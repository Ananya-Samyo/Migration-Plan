import { Router } from 'express'
import db from '../db.js'
import { verifyToken } from '../middleware/auth.js' 

const router = Router()

// ================= Change Logs : List (ดูเฉพาะของตัวเอง) =================
router.get('/change-logs', verifyToken, async (req, res) => {
  try {
    // 1. ดึง user_id ของคนที่ Login เข้ามา
    const userId = req.user.id 
    const { date, keyword } = req.query

    // 2. ตั้งเงื่อนไขเริ่มต้นว่าต้องเป็นของ user คนนี้เท่านั้น
    let conditions = ['cl.user_id = ?'] 
    let params = [userId]

    if (date) {
      conditions.push('DATE(cl.change_date) = ?')
      params.push(date)
    }

    if (keyword) {
      conditions.push(`(
        s.scope_name LIKE ?
        OR pp.project_plan_name LIKE ?
      )`)
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const where = 'WHERE ' + conditions.join(' AND ')

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

// ================= Change Logs : Detail (ดูเฉพาะของตัวเอง) =================
router.get('/change-logs/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id 

    // 3. เพิ่ม AND cl.user_id = ? เพื่อกันไม่ให้ไปแอบดู log ของคนอื่น
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
      WHERE cl.log_id = ? AND cl.user_id = ? 
    `, [id, userId])

    if (!log) {
      return res.status(404).json({ message: 'ไม่พบข้อมูล หรือคุณไม่มีสิทธิ์เข้าถึง' })
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