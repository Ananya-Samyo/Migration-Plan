import { Router } from 'express'
import db from '../../../db.js'
import { sendMail } from '../mailer.js'

const router = Router()

// ================= Scopes =================
router.post('/scopes', async (req, res) => {
  const { scopeName, projects } = req.body
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    /* -----------------------------
       1. CREATE OR GET COORDINATOR
    ----------------------------- */
    const coordinator = projects[0].coordinator
    let coordinatorId;

    // ✅ แก้ไข: เช็คก่อนว่ามี Email นี้ในระบบหรือยัง
    const [[existingCoord]] = await conn.query(
      `SELECT user_id FROM users WHERE email = ?`, 
      [coordinator.email]
    );

    if (existingCoord) {
      coordinatorId = existingCoord.user_id;
    } else {
      const [coordResult] = await conn.query(
        `INSERT INTO users (user_name, email, role)
         VALUES (?, ?, 'coordinator')`,
        [coordinator.name, coordinator.email]
      )
      coordinatorId = coordResult.insertId
    }

    /* -----------------------------
       2. CREATE SCOPE
    ----------------------------- */
    const [scopeResult] = await conn.query(
      `INSERT INTO scopes
       (scope_name, department_id, gap_detail,coordinator_id, status_id)
       VALUES (?, ?, ?, 1)`,
      [
        scopeName,
        projects[0].department_id,
        coordinatorId
      ]
    )

    const scopeId = scopeResult.insertId

    /* -----------------------------
       3. CREATE PROJECT PLANS
    ----------------------------- */
    for (const project of projects) {
      const [projectResult] = await conn.query(
        `INSERT INTO project_plans
         (scope_id, project_plan_name,  status_id)
         VALUES (?, ?, 1)`,
        [scopeId, project.projectName]
      )

      const projectPlanId = projectResult.insertId

      /* -----------------------------
         4. TEAM MEMBERS
      ----------------------------- */
      for (const member of project.teamMembers) {
        let memberUserId;

        // ✅ แก้ไข: เช็ค Team Member ซ้ำด้วย
        const [[existingMember]] = await conn.query(
            `SELECT user_id FROM users WHERE email = ?`,
            [member.email]
        );

        if (existingMember) {
            memberUserId = existingMember.user_id;
        } else {
            const [userResult] = await conn.query(
              `INSERT INTO users (user_name, email, role)
               VALUES (?, ?, 'user')`,
              [member.name, member.email]
            )
            memberUserId = userResult.insertId;
        }

        await conn.query(
          `INSERT INTO working_groups
           (scope_id, user_id, role)
           VALUES (?, ?, 'Member')`,
          [scopeId, memberUserId]
        )
      }

      /* -----------------------------
         5. GAP → OPERATIONS
      ----------------------------- */
      for (const gap of project.gaps) {
        await conn.query(
          `INSERT INTO operational_details
          (project_plan_id, detail, weight_percent, progress_percent, status_id)
          VALUES (?, ?, ?, ?, ?)`,
          [
            projectPlanId,
            gap.detail,
            0,
            0,
            1
          ]
        )
      }
    }

    await conn.commit()

    const emailDraft = req.body.email

    if (emailDraft?.recipients?.length) {
      try {
        await sendMail({
          to: emailDraft.recipients.join(','),
          subject: emailDraft.subject,
          html: emailDraft.body
        })

      } catch (mailErr) {
        console.error('Send mail failed:', mailErr)
      }
    }

    res.json({ message: 'created', scope_id: scopeId })

  } catch (err) {
    await conn.rollback()
    console.error('CREATE SCOPE error:', err)
    res.status(500).json({ message: 'Server error' })
  } finally {
    conn.release()
  }
})

// ===============================
// /api/scopes
// ===============================
router.get('/scopes', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.scope_id,
        s.scope_name,
        d.department_name,
        u.user_name AS coordinator,

        pp.project_plan_id,
        pp.project_plan_name,
        pp.progress_percent AS plan_progress,

        od.detail AS gap_detail

      FROM scopes s
      LEFT JOIN departments d ON s.department_id = d.department_id
      LEFT JOIN users u ON s.coordinator_id = u.user_id
      LEFT JOIN project_plans pp ON s.scope_id = pp.scope_id
      LEFT JOIN operational_details od ON pp.project_plan_id = od.project_plan_id

      ORDER BY s.scope_id DESC, pp.project_plan_id
    `)

    const map = {}

    for (const r of rows) {
      // ---------- scope ----------
      if (!map[r.scope_id]) {
        map[r.scope_id] = {
          id: r.scope_id,
          scope_name: r.scope_name,
          department_name: r.department_name,
          coordinator: r.coordinator,
          plans: []
        }
      }

      // ---------- plan ----------
      if (r.project_plan_id) {
        let plan = map[r.scope_id].plans.find(
          p => p.id === r.project_plan_id
        )

        if (!plan) {
          plan = {
            id: r.project_plan_id,
            name: r.project_plan_name,
            progress: Number(r.plan_progress || 0),
            gaps: []
          }
          map[r.scope_id].plans.push(plan)
        }

        // ---------- gap ----------
        if (r.gap_detail) {
          plan.gaps.push(r.gap_detail)
        }
      }
    }

    // ✅ คำนวณ progress ของ scope
    const result = Object.values(map).map(scope => {
      if (!scope.plans.length) {
        return {
          ...scope,
          progress_percent: 0
        }
      }

      const avg = Math.round(
        scope.plans.reduce((sum, p) => sum + p.progress, 0) / scope.plans.length
      )

      return {
        ...scope,
        progress_percent: avg
      }
    })

    res.json(result)

  } catch (err) {
    console.error('GET scopes error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router