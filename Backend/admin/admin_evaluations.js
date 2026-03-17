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

// [POST] บันทึกผลการประเมิน อัปโหลดไฟล์ และส่งอีเมลจบกระบวนการ
router.post('/complete-workflow', verifyToken, isAdmin, upload.array('attachments'), async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 🟢 1. ตรวจสอบข้อมูลที่รับมาก่อน (ช่วยให้รู้ว่าหน้าบ้านส่งอะไรมาบ้าง)
    console.log("📦 ข้อมูลที่ได้รับจาก Frontend:", req.body);

    // แกะกล่องข้อมูลที่ส่งมาจาก Frontend
    const step1 = JSON.parse(req.body.step1 || '{}');
    const step2 = JSON.parse(req.body.step2 || '{}');
    const step3 = JSON.parse(req.body.step3 || '{}');
    
    // 🟢 2. ดึง Project ID และดักจับกรณีค่าเป็นตัวหนังสือ 'undefined' หรือ 'null'
    let projectId = req.body.projectId || step1.id; 
    if (projectId === 'undefined' || projectId === 'null') {
        projectId = null;
    }
    
    if (!projectId) throw new Error("ไม่พบรหัสโครงการ (Project ID) กรุณากลับไปเริ่มใหม่");

    // 3. บันทึกข้อมูลลงตาราง plan_evaluations
    const [evalRes] = await connection.query(`
      INSERT INTO plan_evaluations 
      (project_plan_id, scope_id, objective, before_plan, expected_outcome, actual_outcome, recommendation, project_status, evaluation_status)
      VALUES (?, (SELECT scope_id FROM project_plans WHERE project_plan_id = ?), ?, ?, ?, ?, ?, ?, ?)
    `, [
      projectId, projectId,
      JSON.stringify(step3.objective || []), 
      JSON.stringify(step3.beforePlan || []), 
      JSON.stringify(step3.expectedResult || []), 
      step3.actualResult,
      step3.suggestion, step3.projectStatus, step3.evaluation
    ]);

    // 4. บันทึกปัญหา (ถ้ามีการกรอกมาในหน้า 3) ลงตาราง problems
    if (step3.problem) {
      await connection.query(`
        INSERT INTO problems (project_plan_id, problem_detail) VALUES (?, ?)
      `, [projectId, step3.problem]);
    }

    // 5. จัดการไฟล์แนบ (ถ้ามี) บันทึกลงตาราง attachments
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await connection.query(`
          INSERT INTO attachments (ref_type, ref_id, file_path, file_type)
          VALUES ('evaluation', ?, ?, ?)
        `, [evalRes.insertId, file.filename, file.mimetype]);
      }
    }

    // --- 6. จัดเตรียมข้อมูลและตรวจสอบอีเมลก่อนส่ง ---
    
    // 🟢 แก้ไขเส้นทางการดึงอีเมลให้เจาะเข้าไปใน projects[0] (อนุโลมให้ใช้อีเมลของคนแรกเป็นหลัก)
    let userEmail = step1.projects?.[0]?.coordinator?.email;
    
    if (!userEmail || userEmail === 'undefined' || userEmail === 'null' || userEmail.trim() === '') {
        userEmail = req.user ? req.user.email : null;
    }

    // 🟢 สร้างเงื่อนไข "เกราะป้องกันขั้นสุด": ต้องเป็น String และต้องมีตัว @ เท่านั้นถึงจะส่ง
    const isEmailValid = typeof userEmail === 'string' && userEmail.includes('@');

    if (isEmailValid) {
        // 🌟 [แก้ไขจุดนี้] วนลูปดึงชื่อแผนงานทั้งหมดมาสร้างเป็น List <li>
        let projectListHTML = '<p style="display:inline; margin-left:5px;">โครงการใหม่</p>';
        if (step1.projects && step1.projects.length > 0) {
            projectListHTML = '<ul style="margin-top: 5px; margin-bottom: 0; padding-left: 20px;">' + 
                              step1.projects.map(p => `<li style="margin-bottom: 4px;">${p.projectName}</li>`).join('') + 
                              '</ul>';
        }

        const statusText = step3.projectStatus === 'finish' ? 'เสร็จสิ้นการดำเนินงาน' : 'อยู่ระหว่างดำเนินการ';
        const evalText = step3.evaluation === 'pass' ? 'บรรลุเป้าหมาย' : (step3.evaluation === 'fail' ? 'ไม่บรรลุเป้าหมาย' : 'ยังไม่ได้ระบุ');

        // สร้าง HTML สำหรับอีเมล
        const mailOptions = {
          from: `"Migration Plan System" <${process.env.MAIL_USER}>`,
          to: userEmail,
          // เปลี่ยน Subject ให้ครอบคลุมด้วยชื่อขอบเขตงาน (Scope) เพราะตอนนี้มีหลายแผนงาน
          subject: `[แจ้งเตือน] สรุปผลการดำเนินงาน: ${step1.scopeName || 'โครงการ'}`,
          html: `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">สรุปรายงานความก้าวหน้าโครงการ</h2>
            <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;">
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px;">
                  <h4 style="margin-top: 0; color: #4f46e5; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">ข้อมูลส่วนที่ ๑: รายละเอียดแผนงาน</h4>
                  <p><b>ชื่อขอบเขตงาน:</b> ${step1.scopeName || '-'}</p>
                  <div><b>ชื่อแผนงาน:</b> ${projectListHTML}</div>
                </td>
              </tr>
              <tr><td style="height: 15px;"></td></tr>
              
              <tr>
                <td style="background-color: #fcfcff; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px;">
                  <h4 style="margin-top: 0; color: #b45309; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">ข้อมูลส่วนที่ ๒: ปัญหาและข้อเสนอแนะ</h4>
                  <ul>
                    <li style="margin-bottom: 5px;"><b>ปัญหาอุปสรรค:</b> ${step3.problem || '- ไม่มี -'}</li>
                    <li style="margin-bottom: 5px;"><b>ข้อเสนอแนะ:</b> ${step3.suggestion || '- ไม่มี -'}</li>
                  </ul>
                </td>
              </tr>
              <tr><td style="height: 15px;"></td></tr>

              <tr>
                <td style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px;">
                  <h4 style="margin-top: 0; color: #16a34a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">ส่วนที่ ๓: การประเมินผลลัพธ์</h4>
                  <p><b>สถานะโครงการ:</b> ${statusText}</p>
                  <p><b>ผลการประเมิน:</b> <span style="color: ${step3.evaluation === 'pass' ? '#16a34a' : '#dc2626'}; font-weight: bold;">${evalText}</span></p>
                  <p><b>ผลที่ได้รับจริง:</b><br/> ${step3.actualResult || '-'}</p>
                </td>
              </tr>
            </table>
            <br/>
            <p style="text-align: center; color: #666;">อีเมลฉบับนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบ กรุณาอย่าตอบกลับ</p>
          </div>
          `
        };

        // 🟢 แยก try-catch เฉพาะการส่งอีเมล เผื่อเมลส่งไม่ผ่าน Database จะได้ไม่พัง
        try {
            await transporter.sendMail(mailOptions);
            console.log(`📧 ส่งอีเมลสำเร็จไปยัง: ${userEmail}`);
        } catch (mailError) {
            console.log(`⚠️ ส่งอีเมลไม่สำเร็จ แต่บันทึกข้อมูลแล้ว:`, mailError.message);
        }

    } else {
        console.log(`⚠️ ข้ามการส่งอีเมล: เนื่องจากหา Email ผู้รับไม่พบ หรืออีเมลไม่ถูกต้อง (ค่าที่ได้คือ: ${userEmail})`);
    }

    // 🟢 7. ยืนยันการบันทึกฐานข้อมูล (ทำงานเสมอ ไม่ว่าเมลจะถูกส่งหรือไม่ก็ตาม)
    await connection.commit(); 
    res.json({ success: true, message: 'บันทึกข้อมูลสำเร็จ!' });

  } catch (error) {
    if (connection) await connection.rollback(); // ถ้ายกเลิก ให้ย้อนกลับข้อมูลที่ทำมาทั้งหมด
    console.error('Workflow Error:', error);
    res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  } finally {
    if (connection) connection.release();
  }
});

export default router;