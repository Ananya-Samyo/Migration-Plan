import { Router } from 'express'
import db from '../db.js'
import jwt from 'jsonwebtoken' // 1. นำเข้า jwt

const authRouter = Router()

// แนะนำให้ใช้รหัสลับจากไฟล์ .env เพื่อความปลอดภัยสูงสุด
const JWT_SECRET = process.env.JWT_SECRET;

authRouter.post('/login', async (req, res) => {
  const { email } = req.body

  try {
    const [users] = await db.query(`
      SELECT user_id, user_name, email, role 
      FROM users 
      WHERE email = ?
    `, [email])

    if (users.length === 0) {
      return res.status(401).json({ message: 'ไม่พบอีเมลนี้ในระบบ' })
    }

    const user = users[0]

    // 2. สร้าง Token โดยฝัง user_id และ role ไว้ข้างใน
    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' } // Token มีอายุ 24 ชั่วโมง
    )

    // 3. ส่งข้อมูลกลับไปพร้อม Token
    res.json({
      message: 'Login successful',
      token: token, // ส่งกุญแจลับกลับไป
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        email: user.email,
        role: user.role
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default authRouter