import { Router } from 'express'
import db from '../db.js'
import { verifyToken } from '../middleware/auth.js' 

const router = Router()

// Middleware เช็คสิทธิ์ Admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'ปฏิเสธการเข้าถึง: สิทธิ์เฉพาะผู้ดูแลระบบเท่านั้น' });
  }
};

// ================= 1. Change Logs : List (เพิ่มฟิลด์ u.role) =================
router.get('/change-logs', verifyToken, isAdmin, async (req, res) => {
  try {
    const { from, to, department_id, keyword } = req.query
    let conditions = []
    let params = []

    if (from) {
      conditions.push('DATE(cl.change_date) >= ?')
      params.push(from)
    }
    if (to) {
      conditions.push('DATE(cl.change_date) <= ?')
      params.push(to)
    }
    if (department_id) {
      conditions.push('cl.department_id = ?') 
      params.push(department_id)
    }
    if (keyword) {
      conditions.push(`(s.scope_name LIKE ? OR pp.project_plan_name LIKE ? OR u.user_name LIKE ?)`)
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

    const [rows] = await db.query(`
      SELECT
        cl.log_id,
        cl.change_date,
        s.scope_name,
        pp.project_plan_name,
        u.user_name,
        u.role,
        d.department_name
      FROM change_logs cl
      LEFT JOIN scopes s ON cl.scope_id = s.scope_id
      LEFT JOIN project_plans pp ON cl.project_plan_id = pp.project_plan_id
      LEFT JOIN users u ON cl.user_id = u.user_id
      LEFT JOIN departments d ON cl.department_id = d.department_id
      ${where}
      ORDER BY cl.change_date DESC
    `, params)

    return res.json(rows)
  } catch (err) {
    console.error('Change log list error:', err)
    return res.status(500).json({ message: 'โหลด Change Log ไม่สำเร็จ' })
  }
})

// ================= 2. Change Logs : Detail =================
router.get('/change-logs/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const [[log]] = await db.query(`
      SELECT
        cl.log_id,
        cl.project_plan_id, 
        cl.change_date,
        s.scope_name,
        pp.project_plan_name,
        u.user_name,
        u.role, 
        d.department_name 
      FROM change_logs cl
      LEFT JOIN scopes s ON cl.scope_id = s.scope_id
      LEFT JOIN project_plans pp ON cl.project_plan_id = pp.project_plan_id
      LEFT JOIN users u ON cl.user_id = u.user_id
      LEFT JOIN departments d ON cl.department_id = d.department_id
      WHERE cl.log_id = ?
    `, [id])

    if (!log) {
      return res.status(404).json({ message: 'ไม่พบข้อมูล' })
    }

    // ดึงรายละเอียดฟิลด์ที่แก้
    const [details] = await db.query(`
      SELECT field_name, before_value, after_value
      FROM change_log_details
      WHERE log_id = ?
    `, [id])

    // ดึงเหตุผลการแก้ไข (ใช้ log.project_plan_id ที่เรา Select ออกมาด้านบน)
    const [reasons] = await db.query(`
        SELECT reason_text FROM edit_reasons 
        WHERE ref_id = ? AND ref_type = 'project_plan' 
        ORDER BY reason_id DESC LIMIT 1
    `, [log.project_plan_id]);

    // ดึงไฟล์แนบ
    const [attachments] = await db.query(`
      SELECT file_path, file_type 
      FROM attachments 
      WHERE ref_id = ? AND ref_type = 'project_plan'
    `, [log.project_plan_id]);

    return res.json({
      ...log,
      edit_reason: reasons.length > 0 ? reasons[0].reason_text : 'ไม่ได้ระบุเหตุผล',
      changes: details,
      attachments: attachments 
    });

  } catch (err) {
    console.error('❌ Change log detail error:', err.message)
    if (!res.headersSent) {
      return res.status(500).json({ message: 'เซิร์ฟเวอร์ทำงานผิดพลาด: ' + err.message })
    }
  }
})

export default router