import { Router } from 'express'
import db from '../db.js'
import multer from 'multer'
import path from 'path'
import nodemailer from 'nodemailer'
import { verifyToken, isAdmin } from '../middleware/auth.js'

const router = Router()

// ตั้งค่า multer สำหรับเก็บไฟล์
const upload = multer({ dest: 'uploads/' })

// ตั้งค่า Email Transporter
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

// [GET] ดึงข้อมูลการประเมิน (สำหรับใช้โหลดข้อมูลมาแสดงใน Step 3)
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

    // แปลงข้อมูล JSON จาก Database กลับเป็น Array สำหรับ Frontend
    try {
      const parsedObjective = JSON.parse(data.objective || '[]');
      const parsedBefore = JSON.parse(data.before_plan || '[]');
      const parsedExpected = JSON.parse(data.expected_outcome || '[]');

      if (Array.isArray(parsedObjective)) {
        data.items = parsedObjective.map((obj, index) => ({
          objective: obj || '',
          beforeImprove: parsedBefore[index] || '',
          expectedAfter: parsedExpected[index] || ''
        }));
      } else {
        throw new Error("Format incorrect");
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

/* ======================================================
    ADMIN EVALUATIONS ROUTES
====================================================== */

// [GET] ดึงข้อมูลเดิมมาแสดงใน Step 3
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
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// [POST] บันทึกและจบกระบวนการ (แก้ไขจาก 404 เป็นการทำงานจริง)
router.post('/complete-workflow', verifyToken, isAdmin, upload.array('attachments'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. ตรวจสอบข้อมูลที่ส่งมาจาก Frontend
    if (!req.body.step1 || !req.body.step3) {
      throw new Error('ข้อมูลจากหน้าบ้านส่งมาไม่ครบถ้วน');
    }

    const step1 = JSON.parse(req.body.step1 || '{}');
    const step2 = JSON.parse(req.body.step2 || '{}'); 
    const step3 = JSON.parse(req.body.step3 || '{}');

    const { edit_reason, mode } = req.body;

    // ดึง Project ID (เช็คทุกช่องทางเพื่อให้มั่นใจว่าได้เลข 31 หรือ ID ที่ถูกต้อง)
    const projectId = step1.projectId || step1.id || step3.project_plan_id || req.body.projectId;

    if (!projectId || projectId === 'undefined') {
      throw new Error('ไม่พบรหัสแผนงาน (Project ID) กรุณาตรวจสอบการส่งค่าจากหน้าบ้าน');
    }

    // 2. ดึงข้อมูลพื้นฐานโครงการ (เพื่อหา scope_id และอีเมลผู้รับผิดชอบ)
    const [projectData] = await conn.query(`
      SELECT s.scope_id, s.scope_name, u.email, u.user_name 
      FROM project_plans pp
      JOIN scopes s ON pp.scope_id = s.scope_id
      LEFT JOIN users u ON s.coordinator_id = u.user_id
      WHERE pp.project_plan_id = ?
    `, [projectId]);

    if (projectData.length === 0) throw new Error('ไม่พบข้อมูลแผนงานหลักในระบบ');
    const { scope_id, email, user_name, scope_name } = projectData[0];

    // 3. เตรียมข้อมูลประเมิน (แปลง Array เป็น JSON String)
    const objectiveJson = JSON.stringify(step3.items?.map(i => i.objective) || []);
    const beforePlanJson = JSON.stringify(step3.items?.map(i => i.beforeImprove) || []);
    const expectedOutcomeJson = JSON.stringify(step3.items?.map(i => i.expectedAfter) || []);

    // 4. บันทึกผลการประเมินลงตาราง plan_evaluations
    // ✅ แก้ไขชื่อคอลัมน์เป็น 'recommendation' ตาม phpMyAdmin ของคุณ
    // ✅ ตัด 'updated_at' ออก เพราะตารางนี้ของคุณไม่มีคอลัมน์นี้
    await conn.query(`
      INSERT INTO plan_evaluations 
        (project_plan_id, scope_id, objective, before_plan, expected_outcome, actual_outcome, recommendation, project_status, evaluation_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        objective = VALUES(objective),
        before_plan = VALUES(before_plan),
        expected_outcome = VALUES(expected_outcome),
        actual_outcome = VALUES(actual_outcome),
        recommendation = VALUES(recommendation),
        project_status = VALUES(project_status),
        evaluation_status = VALUES(evaluation_status)
    `, [
      projectId,
      scope_id,
      objectiveJson,
      beforePlanJson,
      expectedOutcomeJson,
      step3.actualResult,
      step3.suggestion, // ข้อมูล suggestion จากหน้าบ้านจะลงที่ช่อง recommendation
      step3.projectStatus,
      step3.evaluation
    ]);

    // 5. บันทึกปัญหา (Problems)
    if (step3.problem) {
      await conn.query(`
        INSERT INTO problems (project_plan_id, problem_detail) 
        VALUES (?, ?) ON DUPLICATE KEY UPDATE problem_detail = VALUES(problem_detail)
      `, [projectId, step3.problem]);
    }

    // 6. บันทึกประวัติการแก้ไขและไฟล์แนบ
    await conn.query(`INSERT INTO edit_reasons (ref_type, ref_id, reason_text) VALUES ('evaluation', ?, ?)`,
      [projectId, edit_reason || (mode === 'first_save' ? 'บันทึกข้อมูลครั้งแรก' : 'อัปเดตข้อมูล')]
    );

    // ✅ แก้ไขตาราง attachments: ตัด file_name ออก เพราะใน phpMyAdmin ของคุณไม่มี
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await conn.query(
          `INSERT INTO attachments (ref_type, ref_id, file_path, file_type) VALUES ('evaluation', ?, ?, ?)`,
          [projectId, file.path, file.mimetype]
        );
      }
    }

    await conn.commit();

    // 7. ส่งอีเมลแจ้งเตือน
    if (email) {
      // ฟังก์ชันตัวช่วยสำหรับแสดงสถานะในอีเมล
      const getStatusLabel = (status) => {
        if (status === 'complete_gap') return 'เสร็จสิ้น';
        if (status === 'acceptable_gap') return 'ยอมรับได้';
        return 'กำลังดำเนินการ';
      };

      // เตรียมรายการ List ในรูปแบบ HTML สำหรับอีเมล
      const gapsHtmlEmail = (step2.gaps && step2.gaps.length > 0)
        ? step2.gaps.map(g => `<li style="margin-bottom: 5px;">${g.detail || '-'} (น้ำหนัก: ${g.weight || 0}%, สถานะ: ${getStatusLabel(g.status)})</li>`).join('')
        : '<li>- ไม่มีข้อมูลวิเคราะห์ช่องว่าง -</li>';

      const issuesHtmlEmail = (step2.issues && step2.issues.length > 0)
        ? step2.issues.map(iss => `<li style="margin-bottom: 5px;"><b>ปัญหา:</b> ${iss.problem || '-'}<br/><b>แนวทางแก้ไข:</b> ${iss.solution || '-'}</li>`).join('')
        : '<li>- ไม่มีข้อมูลปัญหาและอุปสรรค -</li>';

      const mailOptions = {
        from: process.env.MAIL_USER,
        to: email,
        subject: `แจ้งสรุปผลการดำเนินงานระบบ Migration Plan: ขอบเขตงาน ${scope_name}`,
        html: `
        <div style="font-family: 'Sarabun', Tahoma, sans-serif; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.6;">
          <h3 style="color: #4b2e83;">เรียน คุณ ${user_name}</h3>
          <p>ขอเรียนให้ทราบว่า ระบบ Migration Plan ได้ดำเนินการบันทึกข้อมูลและผลการประเมินของขอบเขตงาน <b>"${scope_name}"</b> เป็นที่เรียบร้อยแล้ว โดยมีรายละเอียดสรุปผลการดำเนินงานดังนี้:</p>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px;">
                <h4 style="margin-top: 0; color: #4b2e83; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">ส่วนที่ ๑: ข้อมูลทั่วไปของแผนงาน</h4>
                <p style="margin: 5px 0;"><b>ชื่อขอบเขตงาน:</b> ${step1.scopeName || scope_name}</p>
                <p style="margin: 5px 0;"><b>แผนงาน/โครงการ:</b> ${step1.projects?.[0]?.projectName || '-'}</p>
                <p style="margin: 5px 0;"><b>ผู้ประสานงานหลัก:</b> ${step1.projects?.[0]?.coordinator?.name || '-'}</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px;">
                <h4 style="margin-top: 0; color: #b45309; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">ส่วนที่ ๒: ความก้าวหน้าและวิเคราะห์ช่องว่าง</h4>
                <p style="margin: 5px 0;"><b>ระยะเวลาดำเนินการ:</b> ${step2.startDate || '-'} ถึง ${step2.endDate || '-'}</p>
                <p style="margin: 5px 0;"><b>ความคืบหน้าภาพรวม:</b> <span style="color: #b45309; font-weight: bold;">${step2.progress || 0}%</span></p>
                
                <p style="margin: 15px 0 5px 0; font-weight: bold;">รายการวิเคราะห์ช่องว่าง (GAP):</p>
                <ul style="margin: 0; padding-left: 20px;">${gapsHtmlEmail}</ul>

                <p style="margin: 15px 0 5px 0; font-weight: bold;">ปัญหาอุปสรรคและแนวทางแก้ไข:</p>
                <ul style="margin: 0; padding-left: 20px;">${issuesHtmlEmail}</ul>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px;">
                <h4 style="margin-top: 0; color: #16a34a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">ส่วนที่ ๓: การประเมินผลลัพธ์</h4>
                <p style="margin: 5px 0;"><b>สถานะโครงการ:</b> ${step3.projectStatus === 'finish' ? 'เสร็จสิ้นการดำเนินงาน' : 'อยู่ระหว่างดำเนินการ'}</p>
                <p style="margin: 5px 0;"><b>ผลการประเมิน:</b> ${step3.evaluation === 'pass' ? 'บรรลุเป้าหมาย' : step3.evaluation === 'fail' ? 'ไม่บรรลุเป้าหมาย' : 'ยังไม่ได้ระบุ'}</p>
                <p style="margin: 5px 0; font-weight: bold;">ผลที่ได้รับจริง:</p>
                <div style="background: #ffffff; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px; white-space: pre-wrap; font-size: 14px;">${step3.actualResult || '-'}</div>
              </td>
            </tr>
          </table>

          <p>ท่านสามารถเข้าสู่ระบบเพื่อตรวจสอบประวัติการแก้ไขและดาวน์โหลดไฟล์แนบได้ที่เมนูบริหารจัดการโครงการ</p>
          <br/>
          <p>ขอแสดงความนับถือ<br/><b>ระบบบริหารจัดการแผนงาน (Migration Plan)</b></p>
        </div>
        `
      };
      transporter.sendMail(mailOptions).catch(e => console.error("Email Error:", e));
    }

    res.json({ success: true, message: 'บันทึกข้อมูลและจบกระบวนการเรียบร้อยแล้ว' });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error("❌ Workflow Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }

});

export default router;