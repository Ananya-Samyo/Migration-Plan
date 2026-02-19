import { Router } from 'express'
import db from '../db.js'
import multer from 'multer'
import path from 'path'
import nodemailer from 'nodemailer' // ✅ 1. เพิ่ม nodemailer
import { verifyToken, isAdmin } from '../middleware/auth.js'

const router = Router()

// ตั้งค่า multer สำหรับเก็บไฟล์
const upload = multer({ dest: 'uploads/' })

// ✅ 2. ตั้งค่า Email Transporter
const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

/* ======================================================
    ADMIN EVALUATIONS ROUTES (Protected)
====================================================== */

// [GET] ดึงข้อมูลการประเมิน (เหมือนเดิม ไม่ต้องแก้)
router.get('/evaluations/:projectId', verifyToken, isAdmin, async (req, res) => {
  const { projectId } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        pp.project_plan_id, s.scope_name, u.user_name AS owner,
        pe.objective, pe.before_plan, pe.expected_outcome, 
        pe.actual_outcome, pe.recommendation, pe.project_status, 
        pe.evaluation_status, p.problem_detail AS problem
      FROM project_plans pp
      JOIN scopes s ON pp.scope_id = s.scope_id
      LEFT JOIN users u ON s.coordinator_id = u.user_id
      LEFT JOIN plan_evaluations pe ON pp.project_plan_id = pe.project_plan_id
      LEFT JOIN problems p ON pp.project_plan_id = p.project_plan_id
      WHERE pp.project_plan_id = ? LIMIT 1
    `, [projectId]);

    if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบข้อมูล' });

    const data = rows[0];

    try {
      const parsedObjective = JSON.parse(data.objective);
      const parsedBefore = JSON.parse(data.before_plan);
      const parsedExpected = JSON.parse(data.expected_outcome);

      if (Array.isArray(parsedObjective)) {
        data.items = parsedObjective.map((obj, index) => ({
          objective: obj || '',
          beforeImprove: parsedBefore[index] || '',
          expectedAfter: parsedExpected[index] || ''
        }));
      } else {
        throw new Error("Not an array");
      }
    } catch (e) {
      data.items = [{
        objective: data.objective || '',
        beforeImprove: data.before_plan || '',
        expectedAfter: data.expected_outcome || ''
      }];
    }

    res.json(data);
  } catch (err) {
    console.error('get evaluations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// [PUT] อัปเดตข้อมูลการประเมิน + ส่งอีเมล
router.put('/evaluations/:projectId', verifyToken, isAdmin, upload.array('attachments'), async (req, res) => {
  const { projectId } = req.params;
  const { items, actualResult, suggestion, projectStatus, evaluation, edit_reason, problem } = req.body;
  
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ 3. แก้ไข Query: ดึง scope_id และ EMAIL ของผู้รับผิดชอบมาพร้อมกัน
    const [projectData] = await conn.query(`
      SELECT s.scope_id, s.scope_name, u.email, u.user_name 
      FROM project_plans pp
      JOIN scopes s ON pp.scope_id = s.scope_id
      LEFT JOIN users u ON s.coordinator_id = u.user_id
      WHERE pp.project_plan_id = ?
    `, [projectId]);

    if (projectData.length === 0) {
      throw new Error('ไม่พบข้อมูลแผนงานหลัก (Project Plan Not Found)');
    }

    // เก็บค่าไว้ใช้ส่งเมล
    const { scope_id: scopeId, email: userEmail, user_name: userName, scope_name: scopeName } = projectData[0];

    // --- จัดการข้อมูล items ---
    let objectiveJson = '';
    let beforePlanJson = '';
    let expectedOutcomeJson = '';

    if (items) {
      const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      objectiveJson = JSON.stringify(parsedItems.map(i => i.objective));
      beforePlanJson = JSON.stringify(parsedItems.map(i => i.beforeImprove));
      expectedOutcomeJson = JSON.stringify(parsedItems.map(i => i.expectedAfter));
    }

    // --- ตรวจสอบว่ามี record เดิมหรือไม่ (Upsert) ---
    const [existing] = await conn.query(
      'SELECT project_plan_id FROM plan_evaluations WHERE project_plan_id = ?', 
      [projectId]
    );

    if (existing.length > 0) {
      await conn.query(`
        UPDATE plan_evaluations SET 
          objective = ?, before_plan = ?, expected_outcome = ?, 
          actual_outcome = ?, recommendation = ?, project_status = ?, evaluation_status = ?
        WHERE project_plan_id = ?
      `, [objectiveJson, beforePlanJson, expectedOutcomeJson, actualResult, suggestion, projectStatus, evaluation, projectId]);
    } else {
      await conn.query(`
        INSERT INTO plan_evaluations 
        (project_plan_id, scope_id, objective, before_plan, expected_outcome, actual_outcome, recommendation, project_status, evaluation_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [projectId, scopeId, objectiveJson, beforePlanJson, expectedOutcomeJson, actualResult, suggestion, projectStatus, evaluation]);
    }

    // --- จัดการ Problems และ Reasons ---
    if (problem !== undefined) {
      const [existingProb] = await conn.query('SELECT problem_id FROM problems WHERE project_plan_id = ?', [projectId]);
      if (existingProb.length > 0) {
        await conn.query('UPDATE problems SET problem_detail = ? WHERE project_plan_id = ?', [problem, projectId]);
      } else {
        await conn.query('INSERT INTO problems (project_plan_id, problem_detail) VALUES (?, ?)', [projectId, problem]);
      }
    }

    if (edit_reason) {
      await conn.query(`INSERT INTO edit_reasons (ref_type, ref_id, reason_text) VALUES ('evaluation', ?, ?)`, [projectId, edit_reason]);
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await conn.query(`INSERT INTO attachments (ref_type, ref_id, file_path, file_type) VALUES ('evaluation', ?, ?, ?)`, [projectId, file.path, file.mimetype]);
        }
      }
    }

    await conn.commit();
    res.json({ message: 'บันทึกข้อมูลเรียบร้อยแล้ว' });

    // ✅ 4. ส่งอีเมลแจ้งเตือน (หลังจาก Commit สำเร็จ)
    if (userEmail) {
      const mailOptions = {
        from: process.env.MAIL_USER,
        to: userEmail,
        subject: `📢 แจ้งเตือน: ผลการประเมินโครงการ "${scopeName}" มีการอัปเดต`,
        html: `
          <h3>เรียนคุณ ${userName}</h3>
          <p>Admin ได้ทำการบันทึกผลการประเมินของโครงการที่คุณรับผิดชอบ</p>
          <ul>
            <li><b>โครงการ:</b> ${scopeName}</li>
            <li><b>สถานะโครงการ:</b> ${projectStatus === 'finish' ? 'เสร็จสิ้น' : 'กำลังดำเนินการ'}</li>
            <li><b>ผลการประเมิน:</b> ${evaluation === 'pass' ? '<span style="color:green">ผ่าน</span>' : evaluation === 'fail' ? '<span style="color:red">ไม่ผ่าน</span>' : '-'}</li>
          </ul>
          <p>กรุณาตรวจสอบรายละเอียดเพิ่มเติมในระบบ</p>
        `
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error("❌ ส่งเมลไม่สำเร็จ:", err);
        else console.log("✅ ส่งเมลเรียบร้อย:", info.response);
      });
    }

  } catch (err) {
    await conn.rollback();
    console.error("❌ Error Detail:", err.message);
    res.status(500).json({ message: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  } finally {
    conn.release();
  }
});

export default router;