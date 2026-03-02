import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'; 
dotenv.config();           

const JWT_SECRET = process.env.JWT_SECRET; 

// ส่วนที่ 1: ตรวจสอบ Token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'ไม่ได้เข้าสู่ระบบ' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};

// ส่วนที่ 2: สำหรับสิทธิ์ที่ Viewer เข้าถึงได้ (Admin, Viewer, User, Coordinator)
// ใช้กับ: แดชบอร์ด และ ขอบเขตแผนงาน
export const canViewBasic = (req, res, next) => {
    const role = req.user?.role?.toLowerCase();
    const allowedRoles = ['admin', 'user', 'coordinator', 'viewer'];

    if (req.user && allowedRoles.includes(role)) {
        next();
    } else {
        return res.status(403).json({ message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลในส่วนนี้" });
    }
};

// ส่วนที่ 3: สำหรับสิทธิ์ที่ User และ Coordinator ต้องทำได้ (Admin, User, Coordinator)
// ใช้กับ: บันทึกการเปลี่ยนแปลงข้อมูล (Log) ในฝั่ง User
export const canAccessLog = (req, res, next) => {
    const role = req.user?.role?.toLowerCase();
    const allowedRoles = ['admin', 'user', 'coordinator'];

    if (req.user && allowedRoles.includes(role)) {
        next();
    } else {
        return res.status(403).json({ message: "สิทธิ์ของคุณไม่สามารถเข้าถึงบันทึกการเปลี่ยนแปลงได้" });
    }
};

// ส่วนที่ 4: สำหรับสิทธิ์ Admin เท่านั้น
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role?.toLowerCase() === 'admin') { 
        next();
    } else {
        return res.status(403).json({ message: "ต้องใช้สิทธิ์ผู้ดูแลระบบ (Admin) เท่านั้น" });
    }
};