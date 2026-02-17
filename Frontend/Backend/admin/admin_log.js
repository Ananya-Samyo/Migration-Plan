import { Router } from 'express'
import db from '../db.js'
import { verifyToken } from '../middleware/auth.js' 

const router = Router()

// สร้าง Middleware ย่อยสำหรับเช็คว่าเป็น Admin เท่านั้น
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'ปฏิเสธการเข้าถึง: สิทธิ์เฉพาะผู้ดูแลระบบเท่านั้น' });
  }
};

// ================= Change Logs : List =================
// 2. ใส่ verifyToken และ isAdmin คั่นไว้
router.get('/change-logs', verifyToken, isAdmin, async (req, res) => {
  try {
    const { date, department_id, keyword } = req.query

    let conditions = []
    let params = []

    if (date) {
      conditions.push('DATE(cl.change_date) = ?')
      params.push(date)
    }

    if (department_id) {
      conditions.push('cl.department_id = ?')
      params.push(department_id)
    }

    if (keyword) {
      conditions.push(`(
        s.scope_name LIKE ?
        OR pp.project_plan_name LIKE ?
        OR u.user_name LIKE ?
      )`)
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }

    const where = conditions.length
      ? 'WHERE ' + conditions.join(' AND ')
      : ''

    const [rows] = await db.query(`
      SELECT
        cl.log_id,
        cl.change_date,
        s.scope_name,
        pp.project_plan_name,
        u.user_name,
        d.department_name
      FROM change_logs cl
      LEFT JOIN scopes s ON cl.scope_id = s.scope_id
      LEFT JOIN project_plans pp ON cl.project_plan_id = pp.project_plan_id
      LEFT JOIN users u ON cl.user_id = u.user_id
      LEFT JOIN departments d ON cl.department_id = d.department_id
      ${where}
      ORDER BY cl.change_date DESC
    `, params)

    res.json(rows)
  } catch (err) {
    console.error('Change log list error:', err)
    res.status(500).json({ message: 'โหลด Change Log ไม่สำเร็จ' })
  }
})

// ================= Change Logs : Detail =================
// 3. ใส่ verifyToken และ isAdmin ในส่วน Detail ด้วย
router.get('/change-logs/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const [[log]] = await db.query(`
      SELECT
        cl.log_id,
        cl.change_date,
        s.scope_name,
        pp.project_plan_name,
        u.user_name
      FROM change_logs cl
      LEFT JOIN scopes s ON cl.scope_id = s.scope_id
      LEFT JOIN project_plans pp ON cl.project_plan_id = pp.project_plan_id
      LEFT JOIN users u ON cl.user_id = u.user_id
      WHERE cl.log_id = ?
    `, [id])

    if (!log) {
      return res.status(404).json({ message: 'ไม่พบข้อมูล' })
    }

    const [details] = await db.query(`
      SELECT
        field_name,
        before_value,
        after_value
      FROM change_log_details
      WHERE log_id = ?
    `, [id])

    res.json({
      ...log,
      changes: details
    })
  } catch (err) {
    console.error('Change log detail error:', err)
    res.status(500).json({ message: 'โหลดรายละเอียดไม่สำเร็จ' })
  }
})

export default router