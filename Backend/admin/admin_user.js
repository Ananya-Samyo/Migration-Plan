import { Router } from 'express'
import db from '../db.js'
import { verifyToken, isAdmin } from '../middleware/auth.js' // นำเข้า Middleware

const router = Router()

// ใช้ Middleware กับทุก Route ในไฟล์นี้ (เนื่องจากเป็นระบบจัดการ Admin ทั้งหมด)
router.use(verifyToken);
router.use(isAdmin);

// ================= User List =================
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.user_id AS id,
        u.user_name AS name,
        d.department_name AS department,
        u.email,
        u.role,
        u.created_at
      FROM users u
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      LEFT JOIN departments d ON up.department_id = d.department_id
      WHERE u.role = 'admin'
      ORDER BY u.created_at DESC
    `)

    res.json(rows)
  } catch (err) {
    console.error('GET admin users error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ================= Create User =================
router.post('/users', async (req, res) => {
  const { name, email, department } = req.body
  
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    // 1. เช็ค Email ซ้ำ
    const [[existing]] = await conn.query(
        `SELECT user_id FROM users WHERE email = ?`, 
        [email]
    )
    if (existing) {
        await conn.rollback()
        return res.status(400).json({ message: 'Email นี้มีผู้ใช้งานแล้ว' })
    }

    // 2. Insert User (บทบาทเป็น admin)
    const [result] = await conn.query(
      `INSERT INTO users (user_name, email, role)
       VALUES (?, ?, 'admin')`,
      [name, email]
    )

    const userId = result.insertId

    // 3. Find Department & Insert Profile
    if (department) {
        const [[dept]] = await conn.query(
          `SELECT department_id FROM departments WHERE department_name = ?`,
          [department]
        )

        if (dept) {
          await conn.query(
              `INSERT INTO user_profiles (user_id, department_id)
               VALUES (?, ?)`,
              [userId, dept.department_id]
          )
        }
    }

    await conn.commit()
    res.json({ message: 'created', id: userId })

  } catch (err) {
    await conn.rollback()
    console.error('POST admin user error:', err)
    res.status(500).json({ message: 'Server error' })
  } finally {
    conn.release()
  }
})

// ================= Update User =================
router.put('/users/:id', async (req, res) => {
  const { id } = req.params
  const { name, email, department } = req.body

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    // 1. Update User Info
    await conn.query(
      `UPDATE users SET user_name = ?, email = ? WHERE user_id = ?`,
      [name, email, id]
    )

    // 2. Update Department (Upsert Logic)
    if (department) {
        const [[dept]] = await conn.query(
            `SELECT department_id FROM departments WHERE department_name = ?`,
            [department]
        )

        if (dept) {
            const [[existingProfile]] = await conn.query(
                `SELECT user_id FROM user_profiles WHERE user_id = ?`,
                [id]
            )

            if (existingProfile) {
                await conn.query(
                    `UPDATE user_profiles SET department_id = ? WHERE user_id = ?`,
                    [dept.department_id, id]
                )
            } else {
                await conn.query(
                    `INSERT INTO user_profiles (user_id, department_id) VALUES (?, ?)`,
                    [id, dept.department_id]
                )
            }
        }
    }

    await conn.commit()
    res.json({ message: 'updated' })

  } catch (err) {
    await conn.rollback()
    console.error('PUT admin user error:', err)
    res.status(500).json({ message: 'Server error' })
  } finally {
    conn.release()
  }
})

// ================= Delete User =================
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params
  
  // ป้องกัน Admin ลบตัวเอง (Optional)
  if (parseInt(id) === req.user.user_id) {
    return res.status(400).json({ message: 'ไม่สามารถลบบัญชีของตัวเองได้' });
  }

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    // ลบข้อมูลที่เกี่ยวข้องตามลำดับ (Child Table -> Parent Table)
    await conn.query(`DELETE FROM user_profiles WHERE user_id = ?`, [id])
    await conn.query(`DELETE FROM users WHERE user_id = ?`, [id])

    await conn.commit()
    res.json({ message: 'deleted' })

  } catch (err) {
    await conn.rollback()
    console.error('DELETE admin user error:', err)
    res.status(500).json({ message: 'Server error' })
  } finally {
    conn.release()
  }
})

export default router