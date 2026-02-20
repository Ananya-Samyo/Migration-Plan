import { Router } from 'express'
import db from '../db.js'
import { verifyToken } from '../middleware/auth.js' 

const router = Router()

// ลบ isAdmin middleware ออก เพราะเราจะให้ user ทั่วไปเข้าถึงประวัติของตัวเองได้

// ================= 1. Change Logs : List (เฉพาะของตัวเอง) =================
router.get('/change-logs', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id; // ดึง ID จาก Token
    const { from, to, keyword } = req.query
    
    // เริ่มต้นเงื่อนไขบังคับคือต้องเป็น user_id ของผู้ login เท่านั้น
    let conditions = ['cl.user_id = ?']
    let params = [userId]

    // ตัวกรองเพิ่มเติม (ถ้ามี)
    if (from) {
      conditions.push('DATE(cl.change_date) >= ?')
      params.push(from)
    }
    if (to) {
      conditions.push('DATE(cl.change_date) <= ?')
      params.push(to)
    }
    if (keyword) {
      conditions.push(`(s.scope_name LIKE ? OR pp.project_plan_name LIKE ?)`)
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const where = 'WHERE ' + conditions.join(' AND ')

    const [rows] = await db.query(`
      SELECT
        cl.log_id,
        cl.change_date,
        cl.change_type,
        s.scope_name,
        pp.project_plan_name,
        d.department_name
      FROM change_logs cl
      LEFT JOIN scopes s ON cl.scope_id = s.scope_id
      LEFT JOIN project_plans pp ON cl.project_plan_id = pp.project_plan_id
      LEFT JOIN departments d ON cl.department_id = d.department_id
      ${where}
      ORDER BY cl.change_date DESC
    `, params)

    return res.json(rows)
  } catch (err) {
    console.error('My change log list error:', err)
    return res.status(500).json({ message: 'โหลดประวัติการใช้งานไม่สำเร็จ' })
  }
})

// ================= 2. Change Logs : Detail (ตรวจสอบความเป็นเจ้าของ) =================
router.get('/change-logs/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.user_id || req.user.id;

    // ต้องเช็กทั้ง log_id และ user_id เพื่อกันไม่ให้ user สุ่ม ID เพื่อดูข้อมูลคนอื่น
    const [[log]] = await db.query(`
      SELECT
        cl.log_id,
        cl.change_date,
        cl.change_type,
        s.scope_name,
        pp.project_plan_name
      FROM change_logs cl
      LEFT JOIN scopes s ON cl.scope_id = s.scope_id
      LEFT JOIN project_plans pp ON cl.project_plan_id = pp.project_plan_id
      WHERE cl.log_id = ? AND cl.user_id = ?
    `, [id, userId])

    if (!log) {
      // ถ้าไม่พบ log หรือ log นั้นไม่ใช่ของ user นี้
      return res.status(404).json({ message: 'ไม่พบข้อมูลประวัติ หรือคุณไม่มีสิทธิ์เข้าถึง' })
    }

    // ดึงรายละเอียดการเปลี่ยนแปลง (ฟิลด์เดิม -> ฟิลด์ใหม่)
    const [details] = await db.query(`
      SELECT field_name, before_value, after_value
      FROM change_log_details
      WHERE log_id = ?
    `, [id])

    // ดึงไฟล์แนบที่เกี่ยวข้องกับ log นี้
    const [attachments] = await db.query(`
      SELECT file_path, file_type 
      FROM attachments 
      WHERE ref_id = ? AND ref_type = 'change_log'
    `, [id]);

    return res.json({
      ...log,
      changes: details,
      attachments: attachments 
    });

  } catch (err) {
    console.error('My change log detail error:', err)
    if (!res.headersSent) {
      return res.status(500).json({ message: 'โหลดรายละเอียดไม่สำเร็จ' })
    }
  }
})

export default router