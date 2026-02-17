import { Router } from 'express'
import db from '../db.js' 
import { verifyToken } from '../middleware/auth.js'

const router = Router()

router.get('/scopes', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id; 

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
      INNER JOIN working_groups wg ON s.scope_id = wg.scope_id
      LEFT JOIN departments d ON s.department_id = d.department_id
      LEFT JOIN users u ON s.coordinator_id = u.user_id
      LEFT JOIN project_plans pp ON s.scope_id = pp.scope_id
      LEFT JOIN operational_details od ON pp.project_plan_id = od.project_plan_id
      WHERE wg.user_id = ?
      ORDER BY s.scope_id DESC, pp.project_plan_id
    `, [userId])

    const map = {}
    for (const r of rows) {
      if (!map[r.scope_id]) {
        map[r.scope_id] = {
          id: r.scope_id,
          scope_name: r.scope_name,
          department_name: r.department_name,
          coordinator: r.coordinator,
          plans: []
        }
      }
      if (r.project_plan_id) {
        let plan = map[r.scope_id].plans.find(p => p.id === r.project_plan_id)
        if (!plan) {
          plan = {
            id: r.project_plan_id,
            name: r.project_plan_name,  
            progress: Number(r.plan_progress || 0),
            action: r.gap_detail || '-', 
            gaps: []
          }
          map[r.scope_id].plans.push(plan)
        }
        if (r.gap_detail) plan.gaps.push(r.gap_detail)
      }
    }

    const result = Object.values(map).map(scope => {
      const avg = scope.plans.length 
        ? Math.round(scope.plans.reduce((sum, p) => sum + p.progress, 0) / scope.plans.length) 
        : 0
      return { ...scope, progress_percent: avg }
    })

    res.json(result)
  } catch (err) {
    console.error('Database Error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router