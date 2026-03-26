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

    const step1 = JSON.parse(req.body.step1 || '{}');
    const step2 = JSON.parse(req.body.step2 || '{}');
    const step3 = JSON.parse(req.body.step3 || '{}');
    
    let projectId = req.body.projectId || step1.id; 
    if (projectId === 'undefined' || projectId === 'null') projectId = null;
    if (!projectId) throw new Error("ไม่พบรหัสโครงการ (Project ID)");

    console.log("🔍 ตรวจสอบ Step 2 Data:", JSON.stringify(step2, null, 2));

if (step2.projects && Array.isArray(step2.projects)) {
    for (const p of step2.projects) {
        // ดึง ID ที่ส่งมาจาก Frontend (ต้องเป็นตัวเลข ID จริงๆ จาก DB)
        const pid = p.project_plan_id || p.id || p.projectPlanId;
        
        console.log(`🚀 กำลังประมวลผล Project ID: ${pid}`);

        if (!pid || pid === 'undefined') {
            console.error("❌ ข้ามโครงการเนื่องจากไม่พบ ID:", p.projectName);
            continue;
        }

        // 1. อัปเดตข้อมูลพื้นฐานใน project_plans
        await connection.query(`
            UPDATE project_plans 
            SET start_date = ?, end_date = ?, progress_percent = ? 
            WHERE project_plan_id = ?
        `, [p.startDate || null, p.endDate || null, p.progress || 0, pid]);

        // 2. ลบ GAP เก่าของแผนงานนี้ทิ้งก่อนเพื่อบันทึกใหม่ (ป้องกันข้อมูลซ้ำ)
        await connection.query(`DELETE FROM operational_details WHERE project_plan_id = ?`, [pid]);

        // 3. บันทึก GAP ใหม่
        if (p.gaps && p.gaps.length > 0) {
            console.log(`📦 พบ GAP ${p.gaps.length} รายการ สำหรับ ID: ${pid}`);
            for (const gap of p.gaps) {
                if (gap.detail && gap.detail.trim() !== "") {
                    // ใช้ Subquery หา status_id จาก status_code (เช่น processing_gap)
                    // หากหาไม่เจอ ให้ Default เป็น id 1 (ตามตาราง status ของคุณ)
                    await connection.query(`
                        INSERT INTO operational_details (project_plan_id, detail, weight_percent, progress_percent, status_id)
                        VALUES (?, ?, ?, 0, 
                            COALESCE(
                                (SELECT status_id FROM status WHERE status_code = ? LIMIT 1),
                                1
                            )
                        )
                    `, [
                        pid, 
                        gap.detail, 
                        gap.weight || 0, 
                        gap.status || 'processing_gap'
                    ]);
                }
            }
        }

        // 4. บันทึกปัญหา (Problems) ที่มาจากหน้า 2 (ถ้ามี)
        if (p.issues && p.issues.length > 0) {
            // ลบปัญหาเก่าออกก่อน
            await connection.query(`DELETE FROM problems WHERE project_plan_id = ?`, [pid]);
            for (const iss of p.issues) {
                if (iss.problem && iss.problem.trim() !== "") {
                    await connection.query(`
                        INSERT INTO problems (project_plan_id, problem_detail) 
                        VALUES (?, ?)
                    `, [pid, iss.problem]);
                }
            }
        }
    }
}
// --- 🟢 จบส่วนที่ปรับปรุงใหม่ ---
    // 3. บันทึกข้อมูลลงตาราง plan_evaluations (หน้า 3)
    const [evalRes] = await connection.query(`
      INSERT INTO plan_evaluations 
      (project_plan_id, scope_id, objective, before_plan, expected_outcome, actual_outcome, recommendation, project_status, evaluation_status)
      VALUES (?, (SELECT scope_id FROM project_plans WHERE project_plan_id = ? LIMIT 1), ?, ?, ?, ?, ?, ?, ?)
    `, [
      projectId, projectId,
      JSON.stringify(step3.items?.map(i => i.objective) || []), 
      JSON.stringify(step3.items?.map(i => i.beforeImprove) || []), 
      JSON.stringify(step3.items?.map(i => i.expectedAfter) || []), 
      step3.actualResult,
      step3.suggestion, step3.projectStatus, step3.evaluation
    ]);

    // 4. บันทึกปัญหาหน้า 3 (ถ้ามี)
    if (step3.problem) {
      await connection.query(`INSERT INTO problems (project_plan_id, problem_detail) VALUES (?, ?)`, [projectId, step3.problem]);
    }

    // 5. จัดการไฟล์แนบ
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await connection.query(`
          INSERT INTO attachments (ref_type, ref_id, file_path, file_type)
          VALUES ('evaluation', ?, ?, ?)
        `, [evalRes.insertId, file.filename, file.mimetype]);
      }
    }

    // --- 6. ส่งอีเมล (โค้ดเดิมของคุณ) ---
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

    await connection.commit(); 
    res.json({ success: true, message: 'บันทึกข้อมูลสำเร็จครบถ้วน!' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Workflow Error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

export default router;