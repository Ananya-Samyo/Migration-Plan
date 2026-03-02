import { Router } from 'express'
import db from '../db.js'
import { verifyToken, isAdmin } from '../middleware/auth.js'

const router = Router()

router.use(verifyToken);
router.use(isAdmin);

// ================= 1. GET: รายชื่อ Admin และ Viewer + Pagination =================
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const roleFilter = req.query.role; // ✅ รับค่า role จากหน้าบ้าน (admin หรือ viewer)
    const limit = 10;
    const offset = (page - 1) * limit;

    let queryStr = `
      SELECT 
        u.user_id AS id, u.user_name AS name, u.department_id, 
        d.department_name AS department, u.email, u.phone_number, 
        u.role, u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.department_id
    `;

    let countStr = `SELECT COUNT(*) as total FROM users u`;
    let queryParams = [];
    let countParams = [];

    // ✅ Logic การกรอง Role
    if (roleFilter) {
      // ถ้าเลือก Filter เฉพาะ admin หรือ viewer
      queryStr += ` WHERE u.role = ? `;
      countStr += ` WHERE u.role = ? `;
      queryParams.push(roleFilter);
      countParams.push(roleFilter);
    } else {
      // ถ้าไม่ได้เลือก Filter (เป็นค่าว่าง) ให้ดึงทั้งคู่
      queryStr += ` WHERE u.role IN ('admin', 'viewer') `;
      countStr += ` WHERE u.role IN ('admin', 'viewer') `;
    }

    queryStr += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ? `;
    queryParams.push(limit, offset);

    // SQL Query
    const [rows] = await db.query(queryStr, queryParams);
    const [[{ total }]] = await db.query(countStr, countParams);

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

// ================= 2. POST: เพิ่มผู้ใช้งาน (รับค่า role) =================
router.post('/users', async (req, res) => {
  const { name, email, department_id, phone_number, role } = req.body; 
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[existing]] = await conn.query(`SELECT user_id FROM users WHERE email = ?`, [email]);
    if (existing) {
      await conn.rollback();
      return res.status(400).json({ message: 'Email นี้มีผู้ใช้งานแล้ว' });
    }

    // ✅ บันทึกค่า role ตามที่ส่งมาจากหน้าบ้าน (admin หรือ viewer)
    const [result] = await conn.query(
      `INSERT INTO users (user_name, email, phone_number, role, department_id) VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone_number || null, role || 'admin', department_id || null] 
    );

    await conn.commit();
    res.json({ message: 'created', id: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error('POST error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

// ================= 3. PUT: แก้ไขผู้ใช้งาน =================
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, department_id, phone_number, role } = req.body;
  try {
    // ✅ อัปเดตข้อมูลรวมถึงเปลี่ยนสิทธิ์ (role) ได้
    await db.query(
      `UPDATE users SET user_name = ?, email = ?, phone_number = ?, department_id = ?, role = ? WHERE user_id = ?`,
      [name, email, phone_number || null, department_id || null, role || 'admin', id]
    );
    res.json({ message: 'updated' });
  } catch (err) {
    console.error('PUT error:', err);
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
    console.error('DELETE error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ... ส่วน check-email คงเดิม ...
router.get('/check-email', async (req, res) => {
  const { email } = req.query; 
  if (!email) return res.status(400).json({ found: false, message: 'ไม่มีอีเมลส่งมา' });

  try {
    const [users] = await db.query(
      'SELECT user_name, phone_number FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (users.length > 0) {
      res.json({ 
        found: true, 
        user: {
          user_name: users[0].user_name,
          phone_number: users[0].phone_number
        } 
      });
    } else {
      res.json({ found: false });
    }
  } catch (err) {
    res.status(500).json({ found: false, message: 'Server error' });
  }
});

export default router;