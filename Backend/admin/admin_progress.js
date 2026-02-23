import { Router } from 'express'
import db from '../db.js'
import { sendMail } from '../global/mailer.js'
import { verifyToken, isAdmin } from '../middleware/auth.js'
import multer from 'multer' // ✅ 1. Import Multer

const router = Router()

// ✅ 2. Config Multer (ใช้ MemoryStorage เพื่อรับค่าไว้ในตัวแปรชั่วคราว)
const upload = multer({ storage: multer.memoryStorage() })

// ================= Helpers =================
const normalize = (v) => {
  if (v === null || v === undefined || v === '') return null
  return String(v).trim()
}

const diffRow = (label, before, after) => {
  const b = normalize(before)
  const a = normalize(after)
  if (b === a) return ''
  return `
    <tr>
      <td style="padding:6px;">${label}</td>
      <td style="padding:6px; color:#6b7280; ${b === null ? 'font-style:italic;' : ''}">
        ${b ?? '-'}
      </td>
      <td style="padding:6px; background:#ecfdf5; color:#065f46; font-weight:600; ${a === null ? 'font-style:italic;' : ''}">
        ${a ?? '-'}
      </td>
    </tr>
  `
}

const diffHtml = (beforeProject, afterProject, finalStatus) => {
  const beforeProgress = beforeProject.progress_percent ?? 0
  const afterProgress = afterProject.progress_percent ?? beforeProgress
  return `
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%; border-color:#e5e7eb;">
      <tr style="background:#f3f4f6">
        <th style="text-align:left;">รายการ</th>
        <th style="text-align:left;">ก่อนแก้ไข</th>
        <th style="text-align:left;">หลังแก้ไข</th>
      </tr>
      ${diffRow('ความก้าวหน้า', beforeProgress + '%', afterProgress + '%')}
      ${diffRow('สถานะ', beforeProject.status_code, finalStatus)}
    </table>
  `
}

// ================= UPDATE Route =================
// ✅ 3. เพิ่ม middleware upload.array('attachments') เพื่อรองรับ FormData
router.put('/projects/:id', verifyToken, isAdmin, upload.array('attachments'), async (req, res) => {
  const { id: projectPlanId } = req.params

  // ✅ ดึง userId จาก Token
  const changeUserId = req.user.user_id;


  const {
    name, status,
    problems, solutions, edit_reason,
    details,
    startDate, endDate
  } = req.body

  // แปลงค่าตัวเลข (FormData ส่งมาเป็น String)
  const progress = req.body.progress ? Number(req.body.progress) : undefined;

  // ✅ แปลง gaps จาก JSON String กลับเป็น Object Array
  let gaps = [];
  try {
    gaps = req.body.gaps ? JSON.parse(req.body.gaps) : [];
  } catch (e) {
    console.error("Error parsing gaps JSON", e);
    gaps = [];
  }

  // ไฟล์แนบจะอยู่ที่ req.files (Array)
  const files = req.files || [];

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    // 1️⃣ BEFORE: ดึงข้อมูลเก่า
    const [[beforeProject]] = await conn.query(`
      SELECT 
        pp.project_plan_name, pp.progress_percent, st.status_code,
        pp.scope_id, pp.project_plan_id
      FROM project_plans pp
      JOIN status st ON pp.status_id = st.status_id 
      WHERE pp.project_plan_id = ?
    `, [projectPlanId])

    if (!beforeProject) throw new Error('Project not found')

    // 2️⃣ หา status_id ใหม่
    const finalStatus = status || beforeProject.status_code
    const [[st]] = await conn.query(`SELECT status_id FROM status WHERE status_code = ?`, [finalStatus])

    if (!st) throw new Error(`Invalid status: ${finalStatus}`)

    const parsedProgress = (progress !== undefined) ? progress : beforeProject.progress_percent

    // 3️⃣ UPDATE Project Plans
    await conn.query(`
  UPDATE project_plans 
  SET 
    project_plan_name = ?, 
    progress_percent = ?, 
    status_id = ?, 
    details = ?,
    start_date = ?, 
    end_date = ?    
  WHERE project_plan_id = ?
`, [
      name,
      parsedProgress,
      st.status_id,
      details || '',
      startDate || null,
      endDate || null,
      projectPlanId
    ])

    // 4️⃣ UPDATE GAP (Operational Details)
    await conn.query(`DELETE FROM operational_details WHERE project_plan_id = ?`, [projectPlanId])

    for (const gap of gaps) {
      // ค้นหา ID ของสถานะ GAP (processing_gap, complete_gap, etc.)
      const [[gapSt]] = await conn.query(`SELECT status_id FROM status WHERE status_code = ?`, [gap.status])

      if (gapSt) {
        await conn.query(`
          INSERT INTO operational_details 
          (project_plan_id, detail, weight_percent, progress_percent, status_id)
          VALUES (?, ?, ?, ?, ?)
        `, [projectPlanId, gap.text, gap.weight, 0, gapSt.status_id])
        // Note: Frontend ไม่ได้ส่ง gap.progress มา จึงใส่ default เป็น 0
      }
    }

    // 5️⃣ PROBLEM / SOLUTION
    if (problems !== undefined) {
      await conn.query(`DELETE FROM problems WHERE project_plan_id = ?`, [projectPlanId])
      if (problems?.trim()) {
        await conn.query(`INSERT INTO problems (project_plan_id, problem_detail) VALUES (?, ?)`, [projectPlanId, problems])
      }
    }

    if (solutions !== undefined) {
      await conn.query(`DELETE FROM solutions WHERE project_plan_id = ?`, [projectPlanId])
      if (solutions?.trim()) {
        await conn.query(`INSERT INTO solutions (project_plan_id, solution_detail) VALUES (?, ?)`, [projectPlanId, solutions])
      }
    }

    // 6️⃣ CHANGE LOG & EDIT REASON
    if (edit_reason) {
      await conn.query(
        `INSERT INTO edit_reasons (ref_type, ref_id, reason_text) VALUES (?, ?, ?)`,
        ['project_plan', projectPlanId, edit_reason]
      )
    }

    // --- (จุดสำหรับเขียนโค้ดบันทึกไฟล์ req.files) ---
    if (files && files.length > 0) {
      for (const file of files) {
        // 1. กำหนด path ของไฟล์ (สมมติว่าใช้ multer เก็บไว้ในโฟลเดอร์ uploads)
        const filePath = `/uploads/${file.filename}`;
        const fileType = file.mimetype.split('/')[1];

        // 2. บันทึกลงตาราง attachments ใน Database
        await conn.query(`
      INSERT INTO attachments (ref_type, ref_id, file_path, file_type, is_active)
      VALUES (?, ?, ?, ?, 1)
    `, ['project_plan', projectPlanId, filePath, fileType]);
      }
    }

    // ดึง department_id ของคนที่แก้ไข
    const [[userRow]] = await conn.query(
      `SELECT department_id FROM users WHERE user_id = ?`,
      [changeUserId]
    )

    // บันทึก Change Log
    await conn.query(`
      INSERT INTO change_logs 
      (scope_id, project_plan_id, user_id, department_id, change_date)
      VALUES (?, ?, ?, ?, NOW())
    `, [
      beforeProject.scope_id,
      projectPlanId,
      changeUserId,
      userRow?.department_id || null
    ])

    await conn.commit()

    // 7️⃣ AFTER & EMAIL
    const [[afterProject]] = await conn.query(`
      SELECT pp.project_plan_name, pp.progress_percent, st.status_code, s.scope_name
      FROM project_plans pp
      JOIN status st ON pp.status_id = st.status_id
      JOIN scopes s ON pp.scope_id = s.scope_id
      WHERE pp.project_plan_id = ?
    `, [projectPlanId])

    const diffHtmlContent = diffHtml(beforeProject, afterProject, afterProject.status_code)

    // หาผู้รับอีเมล
    const [recipients] = await conn.query(`
      SELECT DISTINCT u.email FROM project_plans pp
      JOIN working_groups wg ON pp.scope_id = wg.scope_id
      JOIN users u ON u.user_id = wg.user_id
      WHERE pp.project_plan_id = ?
      UNION
      SELECT u2.email FROM project_plans pp2
      JOIN scopes s ON pp2.scope_id = s.scope_id
      JOIN users u2 ON s.coordinator_id = u2.user_id
      WHERE pp2.project_plan_id = ?
    `, [projectPlanId, projectPlanId])

    if (recipients.length > 0) {
      sendMail({
        to: recipients.map(r => r.email).join(','),
        subject: 'แจ้งปรับปรุงความก้าวหน้าแผนงาน',
        html: `
              <h3>มีการปรับปรุงแผนงาน</h3>
              <p><b>แผนงาน:</b> ${afterProject.project_plan_name}</p>
              <p><b>Scope:</b> ${afterProject.scope_name}</p>
              <br>
              ${diffHtmlContent}
              <br>
              ${edit_reason ? `<p><b>เหตุผลการแก้ไข:</b> ${edit_reason}</p>` : ''}
              <p style="color:#888; font-size:12px;">แก้ไขโดย: ${req.user.role} (ID: ${changeUserId})</p>
            `
      }).catch(err => console.error('Send mail error:', err))
    }

    res.json({ message: 'updated successfully' })

  } catch (err) {
    await conn.rollback()
    console.error('Update project error:', err)
    res.status(500).json({ message: 'Server error: ' + err.message })
  } finally {
    conn.release()
  }
})

// ================= GET Route =================
router.get('/projects/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params
  try {
    const [[project]] = await db.query(`
      SELECT 
        p.project_plan_id, 
        p.scope_id, 
        p.project_plan_name, 
        p.progress_percent, 
        p.start_date AS plan_start,  
        p.end_date AS plan_end,      
        p.details,           
        s.scope_name, 
        s.start_date AS scope_start, 
        s.end_date AS scope_end, 
        st.status_code
      FROM project_plans p
      JOIN scopes s ON p.scope_id = s.scope_id
      JOIN status st ON p.status_id = st.status_id
      WHERE p.project_plan_id = ?
    `, [id])

    if (!project) return res.status(404).json({ message: 'ไม่พบแผนงาน' })

    // ฟังก์ชันช่วยจัดการ format วันที่ให้เป็น YYYY-MM-DD
    const formatDate = (dateVal) => {
      if (!dateVal) return '';
      const d = new Date(dateVal);
      return d.toISOString().split('T')[0]; 
    }

    // ดึงข้อมูล GAPs
    const [gapRows] = await db.query(`
      SELECT od.detail AS text, od.weight_percent AS weight, 
             od.progress_percent AS progress, st.status_code AS status
      FROM operational_details od
      JOIN status st ON od.status_id = st.status_id
      WHERE od.project_plan_id = ?
    `, [id])

    // ดึงข้อมูลปัญหาและทางแก้
    const [problemRows] = await db.query(`SELECT problem_detail FROM problems WHERE project_plan_id = ?`, [id])
    const [solutionRows] = await db.query(`SELECT solution_detail FROM solutions WHERE project_plan_id = ?`, [id])

    res.json({
      id: project.project_plan_id,
      name: project.project_plan_name,
      scope: project.scope_name,
      // 🚩 ส่งวันที่ในรูปแบบที่ input date ต้องการ (YYYY-MM-DD)
      startDate: formatDate(project.plan_start),
      endDate: formatDate(project.plan_end),
      status: project.status_code,
      progress: Number(project.progress_percent),
      gaps: gapRows,
      details: project.details || '',
      problems: problemRows.map(r => r.problem_detail).join('\n'),
      solutions: solutionRows.map(r => r.solution_detail).join('\n')
    })
  } catch (err) {
    console.error('GET project error:', err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

export default router