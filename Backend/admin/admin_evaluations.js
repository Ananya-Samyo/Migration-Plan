import { Router } from 'express'
import db from '../db.js'
import multer from 'multer'
import path from 'path'
import { verifyToken } from '../middleware/auth.js' // 1. นำเข้า Middleware

const router = Router()

// สร้าง Middleware สำหรับเช็คสิทธิ์ Admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'ปฏิเสธการเข้าถึง: สำหรับผู้ดูแลระบบเท่านั้น' });
  }
};

// ตั้งค่า multer สำหรับเก็บไฟล์
const upload = multer({ dest: 'uploads/' })

/* ======================================================
   ADMIN EVALUATIONS ROUTES (Protected)
====================================================== */

// [GET] ดึงข้อมูล (เพิ่มการเช็ค Token และ Admin)
router.get('/evaluations/:projectId', verifyToken, isAdmin, async (req, res) => {
  const { projectId } = req.params
  try {
    const [[row]] = await db.query(`
      SELECT pe.*, s.scope_name, u.user_name AS owner
      FROM plan_evaluations pe
      JOIN project_plans pp ON pe.project_plan_id = pp.project_plan_id
      JOIN scopes s ON pp.scope_id = s.scope_id
      LEFT JOIN users u ON u.user_id = s.coordinator_id
      WHERE pp.project_plan_id = ?
    `, [projectId])
    res.json(row || null)
  } catch (err) {
    console.error('get evaluations error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// [PUT] อัปเดตข้อมูล (วาง verifyToken, isAdmin ไว้หน้า upload)
router.put('/evaluations/:projectId', verifyToken, isAdmin, upload.array('attachments'), async (req, res) => {
  const { projectId } = req.params
  const {
    objective, beforeImprove, expectedAfter, actualResult,
    suggestion, projectStatus, evaluation, edit_reason, problem
  } = req.body

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    // 1. อัปเดต plan_evaluations
    await conn.query(`
      UPDATE plan_evaluations SET 
        objective = ?, before_plan = ?, expected_outcome = ?, 
        actual_outcome = ?, recommendation = ?, project_status = ?, 
        evaluation_status = ?, problem = ?
      WHERE project_plan_id = ?
    `, [objective, beforeImprove, expectedAfter, actualResult, suggestion, projectStatus, evaluation, problem, projectId])

    // 2. บันทึกเหตุผลการแก้ไขลงตาราง edit_reasons
    if (edit_reason) {
      await conn.query(`
        INSERT INTO edit_reasons (ref_type, ref_id, reason) 
        VALUES ('evaluation', ?, ?)
      `, [projectId, edit_reason])

      // 3. บันทึกไฟล์แนบลงตาราง attachments
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await conn.query(`
            INSERT INTO attachments (ref_type, ref_id, file_path, file_type) 
            VALUES ('evaluation', ?, ?, ?)
          `, [projectId, file.path, file.mimetype])
        }
      }
    }

    await conn.commit()
    res.json({ message: 'updated' })
  } catch (err) {
    await conn.rollback()
    console.error('update evaluations error:', err)
    res.status(500).json({ message: 'Error' })
  } finally {
    conn.release()
  }
})

export default router