import { Router } from 'express'
import db from '../db.js'
import { verifyToken, isAdmin } from '../middleware/auth.js'

const router = Router()

router.use(verifyToken);
router.use(isAdmin);

// ================= 1. GET: รายชื่อ Admin + Pagination =================
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // ดึงข้อมูล 10 รายชื่อ
    const [rows] = await db.query(`
      SELECT
        u.user_id AS id,
        u.user_name AS name,
        u.department_id,
        d.department_name AS department,
        u.email,
        u.role,
        u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.department_id
      WHERE u.role = 'admin'
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // นับจำนวนทั้งหมดเพื่อคำนวณหน้า
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM users WHERE role = 'admin'`
    );

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: rows,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (err) {
    console.error('GET error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= 2. POST: เพิ่มผู้ดูแล (ใช้ ID ตรงๆ) =================
router.post('/users', async (req, res) => {
  const { name, email, department_id } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[existing]] = await conn.query(`SELECT user_id FROM users WHERE email = ?`, [email]);
    if (existing) {
      await conn.rollback();
      return res.status(400).json({ message: 'Email นี้มีผู้ใช้งานแล้ว' });
    }

    // บันทึกลงตาราง users โดยตรง (ตัดขั้นตอนหาชื่อซ้ำออก)
    const [result] = await conn.query(
      `INSERT INTO users (user_name, email, role, department_id) VALUES (?, ?, 'admin', ?)`,
      [name, email, department_id || null]
    );

    await conn.commit();
    res.json({ message: 'created', id: result.insertId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

// ================= 3. PUT: แก้ไขผู้ดูแล =================
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, department_id } = req.body;
  try {
    // อัปเดตข้อมูลรวมถึง department_id ในคำสั่งเดียว
    await db.query(
      `UPDATE users SET user_name = ?, email = ?, department_id = ? WHERE user_id = ?`,
      [name, email, department_id || null, id]
    );
    res.json({ message: 'updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= 4. DELETE: ลบผู้ดูแล =================
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  if (req.user && parseInt(id) === req.user.user_id) {
    return res.status(400).json({ message: 'ไม่สามารถลบบัญชีของตัวเองได้' });
  }
  try {
    await db.query(`DELETE FROM users WHERE user_id = ?`, [id]);
    res.json({ message: 'deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;