import { Router } from 'express'
import db from '../../../db.js'
import pool from '../../db.js'
import { sendMail } from '../mailer.js'

const router = Router()

// ================= Progress =================
// progress
const normalize = (v) => {
  if (v === null || v === undefined || v === '') return null
  return String(v).trim()
}

const diffRow = (label, before, after) => {
  const b = normalize(before)
  const a = normalize(after)

  // ไม่เปลี่ยน → ไม่แสดง
  if (b === a) return ''

  return `
    <tr>
      <td style="padding:6px;">${label}</td>

      <td style="
        padding:6px;
        color:#6b7280;
        ${b === null ? 'font-style:italic;' : ''}
      ">
        ${b ?? '-'}
      </td>

      <td style="
        padding:6px;
        background:#ecfdf5;
        color:#065f46;
        font-weight:600;
        ${a === null ? 'font-style:italic;' : ''}
      ">
        ${a ?? '-'}
      </td>
    </tr>
  `
}

// 🔹 helper: สร้างตาราง diff
const diffHtml = (beforeProject, project, finalStatus) => {
  const beforeProgress = beforeProject.progress_percent ?? 0
  const afterProgress =
    project.progress_percent ?? beforeProgress

  return `
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
  <tr style="background:#f3f4f6">
    <th>รายการ</th>
    <th>ก่อนแก้ไข</th>
    <th>หลังแก้ไข</th>
  </tr>

  ${diffRow(
    'ความก้าวหน้า',
    beforeProgress + '%',
    afterProgress + '%'
  )}

  ${diffRow(
    'สถานะ',
    beforeProject.status_code,
    finalStatus
  )}
</table>
`
}

router.put('/projects/:id', async (req, res) => {
  const { id: projectPlanId } = req.params
  const {
    name, status, progress, gaps,
    problems, solutions, edit_reason
  } = req.body

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    // 1️⃣ BEFORE
    const [[beforeProject]] = await conn.query(`
      SELECT
        pp.project_plan_name,
        pp.progress_percent,
        st.status_code
      FROM project_plans pp
      JOIN status st ON pp.status_id = st.status_id
      WHERE pp.project_plan_id = ?
    `, [projectPlanId])

    // 2️⃣ หา status_id
    const finalStatus = status || beforeProject.status_code
    const [[st]] = await conn.query(
      `SELECT status_id FROM status WHERE status_code = ?`,
      [finalStatus]
    )

    if (!st) throw new Error('Invalid status')

    const parsedProgress =
      progress !== undefined && progress !== null && progress !== ''
        ? Number(progress)
        : beforeProject.progress_percent

    // 3️⃣ UPDATE project
    await conn.query(`
  UPDATE project_plans
  SET project_plan_name = ?, progress_percent = ?, status_id = ?
  WHERE project_plan_id = ?
`, [name, parsedProgress, st.status_id, projectPlanId])


    // 4️⃣ UPDATE GAP
    await conn.query(
      `DELETE FROM operational_details WHERE project_plan_id = ?`,
      [projectPlanId]
    )

    for (const gap of JSON.parse(gaps || '[]')) {
      const [[gapSt]] = await conn.query(
        `SELECT status_id FROM status WHERE status_code = ?`,
        [gap.status]
      )

      await conn.query(`
        INSERT INTO operational_details
        (project_plan_id, detail, weight_percent, progress_percent, status_id)
        VALUES (?, ?, ?, ?, ?)
      `, [
        projectPlanId,
        gap.text,
        gap.weight,
        gap.progress,
        gapSt.status_id
      ])
    }

    // 5️⃣ PROBLEM / SOLUTION
    if (problems?.trim()) {
      await conn.query(`DELETE FROM problems WHERE project_plan_id = ?`, [projectPlanId])
      await conn.query(
        `INSERT INTO problems (project_plan_id, problem_detail) VALUES (?, ?)`,
        [projectPlanId, problems]
      )
    }

    if (solutions?.trim()) {
      await conn.query(`DELETE FROM solutions WHERE project_plan_id = ?`, [projectPlanId])
      await conn.query(
        `INSERT INTO solutions (project_plan_id, solution_detail) VALUES (?, ?)`,
        [projectPlanId, solutions]
      )
    }

    // 6️⃣ CHANGE LOG
   if (edit_reason) {
  await conn.query(
    `INSERT INTO edit_reasons (ref_type, ref_id, reason_text) VALUES (?, ?, ?)`,
    ['project_plan', projectPlanId, edit_reason]
  )
}

    await conn.commit()

    // 7️⃣ AFTER (หลัง commit เท่านั้น)
    const [[afterProject]] = await conn.query(`
      SELECT
        pp.project_plan_name,
        pp.progress_percent,
        st.status_code,
        s.scope_name
      FROM project_plans pp
      JOIN status st ON pp.status_id = st.status_id
      JOIN scopes s ON pp.scope_id = s.scope_id
      WHERE pp.project_plan_id = ?
    `, [projectPlanId])

    // 8️⃣ DIFF
    const diffHtmlContent = diffHtml(
      beforeProject,
      afterProject,
      afterProject.status_code
    )

    // 9️⃣ RECIPIENTS
    const [recipients] = await conn.query(`
      SELECT DISTINCT u.email
      FROM project_plans pp
      JOIN working_groups wg ON pp.scope_id = wg.scope_id
      JOIN users u ON u.user_id = wg.user_id
      WHERE pp.project_plan_id = ?

      UNION

      SELECT u2.email
      FROM project_plans pp2
      JOIN scopes s ON pp2.scope_id = s.scope_id
      JOIN users u2 ON s.coordinator_id = u2.user_id
      WHERE pp2.project_plan_id = ?
    `, [projectPlanId, projectPlanId])

    // 🔟 SEND EMAIL
    await sendMail({
      to: recipients.map(r => r.email).join(','),
      subject: 'แจ้งปรับปรุงความก้าวหน้าแผนงาน',
      html: `
        <p>มีการปรับปรุงแผนงาน</p>
        <p><b>แผนงาน:</b> ${afterProject.project_plan_name}</p>
        <p><b>Scope:</b> ${afterProject.scope_name}</p>
        ${diffHtmlContent}
        ${edit_reason ? `<p><b>เหตุผล:</b> ${edit_reason}</p>` : ''}
      `
    })

    res.json({ message: 'updated successfully' })

    const [updated] = await conn.query(`
  SELECT progress_percent
  FROM project_plans
  WHERE project_plan_id = ?
`, [projectPlanId])


  } catch (err) {
    await conn.rollback()
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  } finally {
    conn.release()
  }
})

router.get('/projects/:id', async (req, res) => {
  const { id } = req.params

  try {
    // 1. project หลัก
    const [[project]] = await pool.query(`
      SELECT
        p.project_plan_id,
        p.scope_id,
        p.project_plan_name,
        p.progress_percent,
        s.scope_name,
        s.start_date,
        s.end_date,
        st.status_code
      FROM project_plans p
      JOIN scopes s ON p.scope_id = s.scope_id
      JOIN status st ON p.status_id = st.status_id
      WHERE p.project_plan_id = ?
    `, [id])

    if (!project) {
      return res.status(404).json({ message: 'ไม่พบแผนงาน' })
    }

    // 2. GAP
    const [gapRows] = await pool.query(`
      SELECT
        od.detail AS text,
        od.weight_percent AS weight,
        st.status_code AS status
      FROM operational_details od
      JOIN status st ON od.status_id = st.status_id
      WHERE od.project_plan_id = ?
    `, [id])

    // 3. problems
    const [problemRows] = await pool.query(`
      SELECT problem_detail FROM problems WHERE project_plan_id = ?
    `, [id])

    // 4. solutions
    const [solutionRows] = await pool.query(`
      SELECT solution_detail FROM solutions WHERE project_plan_id = ?
    `, [id])

    res.json({
      id: project.project_plan_id,
      name: project.project_plan_name,
      scope: project.scope_name,
      startDate: project.start_date,
      endDate: project.end_date,
      status: project.status_code,
      progress: Number(project.progress_percent),
      gaps: gapRows,
      problems: problemRows.map(r => r.problem_detail).join('\n'),
      solutions: solutionRows.map(r => r.solution_detail).join('\n')
    })

  } catch (err) {
    console.error('GET project detail error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router