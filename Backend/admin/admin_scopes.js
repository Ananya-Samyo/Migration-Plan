import { Router } from 'express'
import db from '../db.js'
import { sendMail } from '../global/mailer.js'
import { verifyToken, isAdmin, canViewBasic } from '../middleware/auth.js'

const router = Router()

// ================= Scopes : CREATE =================
// เพิ่ม verifyToken และ isAdmin เพื่อล็อคสิทธิ์เฉพาะผู้ดูแลระบบ
router.post('/scopes', verifyToken, isAdmin, async (req, res) => {
  const { scopeName, projects, email } = req.body
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    /* -----------------------------
       1. CREATE OR GET COORDINATOR
    ----------------------------- */
    const coordinator = projects[0].coordinator
    let coordinatorId;

    // เช็คว่ามี Email นี้ในระบบหรือยัง
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
        (scope_name, department_id, coordinator_id, status_id)
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
      // 3.1 Insert Project Plan
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
          5. GAP -> OPERATIONS
      ----------------------------- */
      if (project.gaps && project.gaps.length > 0) {
        for (const gap of project.gaps) {
          await conn.query(
            `INSERT INTO operational_details
              (project_plan_id, detail, weight_percent, progress_percent, status_id)
              VALUES (?, ?, ?, ?, ?)`,
            [
              projectPlanId,
              gap.detail,
              0, // weight เริ่มต้น
              0, // progress เริ่มต้น
              1  // status_id = 1
            ]
          )
        }
      }
    }

    await conn.commit()

    // ส่งอีเมลแจ้งเตือน
    if (email?.recipients?.length) {
      try {
        await sendMail({
          to: email.recipients.join(','),
          subject: email.subject,
          html: email.body
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

// ================= Scopes : GET LIST (With Pagination) =================
router.get('/scopes', verifyToken, canViewBasic, async (req, res) => {
  try {
    // 1. รับค่า page และ limit จาก Frontend (ถ้าไม่ส่งมา ให้ใช้ค่า Default)
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit

    // 2. หาจำนวน Scope ทั้งหมดก่อน (เพื่อคำนวณ Total Pages)
    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM scopes`)
    const totalItems = countResult[0].total
    const totalPages = Math.ceil(totalItems / limit)

    // 3. ดึงเฉพาะ scope_id ของหน้านั้นๆ (เรียงล่าสุดก่อน)
    const [scopeIdsResult] = await db.query(
      `SELECT scope_id FROM scopes ORDER BY scope_id DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    // ถ้าไม่มีข้อมูลในหน้านี้เลย ให้ส่งอาเรย์ว่างกลับไป
    if (scopeIdsResult.length === 0) {
      return res.json({
        data: [],
        meta: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalItems
        }
      })
    }

    const scopeIds = scopeIdsResult.map(row => row.scope_id)

    const [rows] = await db.query(`
    SELECT 
        s.scope_id, 
        s.scope_name, 
        d.department_name, 
        u.user_name AS coordinator,
        pp.project_plan_id,
        pp.project_plan_name,
        pp.progress_percent AS plan_progress,
        pp.details AS plan_details,
        od.detail AS gap_detail 
    FROM scopes s
    LEFT JOIN departments d ON s.department_id = d.department_id
    LEFT JOIN users u ON s.coordinator_id = u.user_id
    LEFT JOIN project_plans pp ON s.scope_id = pp.scope_id
    LEFT JOIN operational_details od ON pp.project_plan_id = od.project_plan_id
    WHERE s.scope_id IN (?) 
    ORDER BY s.scope_id DESC, pp.project_plan_id
`, [scopeIds])

    const map = {}

    for (const r of rows) {
      if (!map[r.scope_id]) {
        map[r.scope_id] = {
          id: r.scope_id,
          scope_name: r.scope_name,
          department_name: r.department_name,
          coordinator: r.coordinator,
          progress_percent: 0,
          plansMap: {},
          plans: []
        }
      }

      const currentScope = map[r.scope_id];

      if (r.project_plan_id) {
        const planId = String(r.project_plan_id);

        if (!currentScope.plansMap[planId]) {
          currentScope.plansMap[planId] = {
            id: r.project_plan_id,
            name: r.project_plan_name,
            progress: Number(r.plan_progress || 0),
            details: r.plan_details || '-',
            gaps: []
          };
          currentScope.plans.push(currentScope.plansMap[planId]);
        }

        if (r.gap_detail) {
          const isExist = currentScope.plansMap[planId].gaps.some(g => g.detail === r.gap_detail);
          if (!isExist) {
            currentScope.plansMap[planId].gaps.push({ detail: r.gap_detail });
          }
        }
      }
    }

    const resultData = Object.values(map).map(scope => {
      delete scope.plansMap; 

      if (!scope.plans.length) {
        scope.progress_percent = 0;
      } else {
        const totalProgress = scope.plans.reduce((sum, p) => sum + p.progress, 0);
        scope.progress_percent = Math.round(totalProgress / scope.plans.length);
      }
      return scope;
    });

    // เรียงลำดับ resultData ให้ตรงกับ scopeIds อีกครั้ง (เพื่อให้มั่นใจว่า Scope ล่าสุดอยู่บนสุด)
    const sortedResult = scopeIds.map(id => resultData.find(item => item.id === id)).filter(Boolean)

    // 6. ส่งข้อมูลกลับพร้อม Metadata
    res.json({
      data: sortedResult,
      meta: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems
      }
    })

  } catch (err) {
    console.error('GET scopes error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})
export default router