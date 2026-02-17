import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'; // ✅ 1. เพิ่มการนำเข้า dotenv
dotenv.config();           // ✅ 2. สั่งให้โหลดค่าจากไฟล์ .env

const JWT_SECRET = process.env.JWT_SECRET; // ตอนนี้ค่าจะไม่เป็น undefined แล้ว

// ส่วนที่ 1: ตรวจสอบ Token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'ไม่ได้เข้าสู่ระบบ' });

  try {
    // 💡 ถ้า JWT_SECRET ตรงกันกับตอน Login จะผ่านตรงนี้ฉลุย
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    // 🚩 ถ้าขึ้น 403 ตรงนี้ แสดงว่า Secret Key ไม่ตรง หรือ Token หมดอายุ
    res.status(403).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};

// ส่วนที่ 2: ตรวจสอบสิทธิ์ Admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'สิทธิ์เฉพาะผู้ดูแลระบบเท่านั้น' });
  }
};