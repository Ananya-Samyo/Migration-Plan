import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'; 
dotenv.config();           

const JWT_SECRET = process.env.JWT_SECRET; 
console.log("JWT_SECRET used:", JWT_SECRET)

// ส่วนที่ 1: ตรวจสอบ Token
// auth.js
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("❌ No token found in header");
    return res.status(401).json({ message: 'ไม่ได้เข้าสู่ระบบ' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET); // มั่นใจว่าใช้ secret ตัวเดียวกัน
    req.user = verified;
    console.log("✅ Token verified for user:", verified.user_id);
    next();
  } catch (err) {
    console.error("🔥 JWT Verify Error:", err.message); // 🌟 บรรทัดนี้จะทำให้ Log ขึ้นใน Terminal
    res.status(403).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};

export const isAdmin = (req, res, next) => {
    console.log("👮 Checking Admin role for:", req.user);
    if (req.user && req.user.role?.toLowerCase() === 'admin') {
        next();
    } else {
        console.log("🚫 Access Denied: Not an admin");
        return res.status(403).json({ message: "ต้องใช้สิทธิ์ผู้ดูแลระบบ (Admin) เท่านั้น" });
    }
};
// ส่วนที่ 2: สำหรับสิทธิ์ที่ Viewer เข้าถึงได้ (Admin, Viewer, User, Coordinator)
// ใช้กับ: แดชบอร์ด และ ขอบเขตแผนงาน
export const canViewBasic = (req, res, next) => {
    const role = req.user?.role?.toLowerCase().trim();
    const allowedRoles = ['admin', 'user', 'coordinator', 'viewer'];
    
    if (req.user && allowedRoles.includes(role)) {
        next();
    } else {
        console.log("🚫 Role not allowed:", role);
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