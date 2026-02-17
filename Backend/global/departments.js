import { Router } from 'express'
import db from '../db.js' 
import { verifyToken, isAdmin } from '../middleware/auth.js' // นำเข้า Middleware

const router = Router()

// ================= DEPARTMENTS =================
// เพิ่ม verifyToken และ isAdmin เพื่อป้องกันการดึงข้อมูลรายชื่อแผนกโดยไม่ได้รับอนุญาต
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT department_id, department_name
      FROM departments
      ORDER BY department_name
    `)

    res.json(rows)
  } catch (err) {
    console.error('GET departments error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router