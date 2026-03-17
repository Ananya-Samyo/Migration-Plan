import { Router } from 'express'
import db from '../db.js'
import { sendMail } from '../global/mailer.js'
import { verifyToken, isAdmin } from '../middleware/auth.js'
import multer from 'multer'

const router = Router()

// ✅ 2. Config Multer (ใช้ MemoryStorage เพื่อรับค่าไว้ในตัวแปรชั่วคราว)
const upload = multer({ storage: multer.memoryStorage() })

// ================= Helpers =================
const normalize = (v) => {
  if (v === null || v === undefined || v === '') return null
  return String(v).trim()
}

const diffRow = (label, before, after) => {
  const b = normalize(before)
  const a = normalize(after)
  if (b === a) return ''
  return `
    <tr>
      <td style="padding:6px;">${label}</td>
      <td style="padding:6px; color:#6b7280; ${b === null ? 'font-style:italic;' : ''}">
        ${b ?? '-'}
      </td>
      <td style="padding:6px; background:#ecfdf5; color:#065f46; font-weight:600; ${a === null ? 'font-style:italic;' : ''}">
        ${a ?? '-'}
      </td>
    </tr>
  `
}

const diffHtml = (beforeProject, afterProject, finalStatus) => {
  const beforeProgress = beforeProject.progress_percent ?? 0
  const afterProgress = afterProject.progress_percent ?? beforeProgress
  return `
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%; border-color:#e5e7eb;">
      <tr style="background:#f3f4f6">
        <th style="text-align:left;">รายการ</th>
        <th style="text-align:left;">ก่อนแก้ไข</th>
        <th style="text-align:left;">หลังแก้ไข</th>
      </tr>
      ${diffRow('ความก้าวหน้า', beforeProgress + '%', afterProgress + '%')}
      ${diffRow('สถานะ', beforeProject.status_code, finalStatus)}
    </table>
  `
}

router.post('/update-progress', verifyToken, isAdmin, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { projectId, startDate, endDate, progress, gaps, issues } = req.body;

    // ตรวจสอบค่าเบื้องต้น
    if (!projectId || projectId === 'undefined') {
      throw new Error('ไม่พบ Project ID (ได้รับค่า: ' + projectId + ')');
    }

    // 1. อัปเดตตาราง project_plans (ระดับแผนงานย่อย)
    await conn.query(`
      UPDATE project_plans 
      SET start_date = ?, end_date = ?, progress_percent = ?
      WHERE project_plan_id = ?
    `, [startDate || null, endDate || null, progress || 0, projectId]);

    // 🌟 2. อัปเดตตาราง scopes (ระดับขอบเขตงานหลัก) 
    // เพื่อให้ข้อมูลวันที่ไปแสดงผลในหน้าสรุปขอบเขตงาน (ช่องปีที่ทำ)
    await conn.query(`
      UPDATE scopes 
      SET start_date = ?, end_date = ?
      WHERE scope_id = (SELECT scope_id FROM project_plans WHERE project_plan_id = ? LIMIT 1)
    `, [startDate || null, endDate || null, projectId]);

    // 3. จัดการ GAPs (ตาราง operational_details)
    await conn.query(`DELETE FROM operational_details WHERE project_plan_id = ?`, [projectId]);

    if (gaps && gaps.length > 0) {
      for (const gap of gaps) {
        console.log("Saving GAP:", gap);

        const gapDetail = gap.detail || gap.text;
        if (gapDetail && gapDetail.trim() !== "") {
          await conn.query(`
        INSERT INTO operational_details (project_plan_id, detail, weight_percent, status_id)
        VALUES (?, ?, ?, (SELECT status_id FROM status WHERE status_code = ? LIMIT 1))
      `, [
            projectId,
            gapDetail,
            gap.weight || 0,
            gap.status || 'processing_gap'
          ]);
        }
      }
    }

    // 4. จัดการ Issues/Solutions
    await conn.query(`DELETE FROM problems WHERE project_plan_id = ?`, [projectId]);
    await conn.query(`DELETE FROM solutions WHERE project_plan_id = ?`, [projectId]);

    if (issues && issues.length > 0) {
      for (const iss of issues) {
        if (iss.problem && iss.problem.trim() !== "") {
          await conn.query(`INSERT INTO problems (project_plan_id, problem_detail) VALUES (?, ?)`, [projectId, iss.problem]);
          if (iss.solution && iss.solution.trim() !== "") {
            await conn.query(`INSERT INTO solutions (project_plan_id, solution_detail) VALUES (?, ?)`, [projectId, iss.solution]);
          }
        }
      }
    }

    await conn.commit();
    res.json({ success: true, message: 'บันทึกข้อมูลสำเร็จ ทั้งในระดับแผนงานและขอบเขตงาน' });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error("❌ Backend Error Log:", err);
    res.status(500).json({ success: false, message: "Server Error: " + err.message });
  } finally {
    if (conn) conn.release();
  }
});

// ================= UPDATE Route =================
// ✅ 3. เพิ่ม middleware upload.array('attachments') เพื่อรองรับ FormData
router.put('/projects/:id', verifyToken, isAdmin, upload.array('attachments'), async (req, res) => {
  const { id: projectPlanId } = req.params

  // ✅ ดึง userId จาก Token
  const changeUserId = req.user.user_id;


  const {
    name, status,
    problems, solutions, edit_reason,
    details,
    startDate, endDate
  } = req.body

  // แปลงค่าตัวเลข (FormData ส่งมาเป็น String)
  const progress = req.body.progress ? Number(req.body.progress) : undefined;

  // ✅ แปลง gaps จาก JSON String กลับเป็น Object Array
  let gaps = [];
  try {
    gaps = req.body.gaps ? JSON.parse(req.body.gaps) : [];
  } catch (e) {
    console.error("Error parsing gaps JSON", e);
    gaps = [];
  }

  // ไฟล์แนบจะอยู่ที่ req.files (Array)
  const files = req.files || [];

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    // 1️⃣ BEFORE: ดึงข้อมูลเก่า
    const [[beforeProject]] = await conn.query(`
      SELECT 
        pp.project_plan_name, pp.progress_percent, st.status_code,
        pp.scope_id, pp.project_plan_id
      FROM project_plans pp
      JOIN status st ON pp.status_id = st.status_id 
      WHERE pp.project_plan_id = ?
    `, [projectPlanId])

    if (!beforeProject) throw new Error('Project not found')

    // 2️⃣ หา status_id ใหม่
    const finalStatus = status || beforeProject.status_code
    const [[st]] = await conn.query(`SELECT status_id FROM status WHERE status_code = ?`, [finalStatus])

    if (!st) throw new Error(`Invalid status: ${finalStatus}`)

    const parsedProgress = (progress !== undefined) ? progress : beforeProject.progress_percent

    // 3️⃣ UPDATE Project Plans
    await conn.query(`
  UPDATE project_plans 
  SET 
    project_plan_name = ?, 
    progress_percent = ?, 
    status_id = ?, 
    details = ?,
    start_date = ?, 
    end_date = ?    
  WHERE project_plan_id = ?
`, [
      name,
      parsedProgress,
      st.status_id,
      details || '',
      startDate || null,
      endDate || null,
      projectPlanId
    ])

    // 4️⃣ UPDATE GAP (Operational Details)
    await conn.query(`DELETE FROM operational_details WHERE project_plan_id = ?`, [projectPlanId])

    for (const gap of gaps) {
      // ค้นหา ID ของสถานะ GAP (processing_gap, complete_gap, etc.)
      const [[gapSt]] = await conn.query(`SELECT status_id FROM status WHERE status_code = ?`, [gap.status])

      if (gapSt) {
        await conn.query(`
          INSERT INTO operational_details 
          (project_plan_id, detail, weight_percent, progress_percent, status_id)
          VALUES (?, ?, ?, ?, ?)
        `, [projectPlanId, gap.text, gap.weight, 0, gapSt.status_id])
        // Note: Frontend ไม่ได้ส่ง gap.progress มา จึงใส่ default เป็น 0
      }
    }

    // 5️⃣ PROBLEM / SOLUTION
    if (problems !== undefined) {
      await conn.query(`DELETE FROM problems WHERE project_plan_id = ?`, [projectPlanId])
      if (problems?.trim()) {
        await conn.query(`INSERT INTO problems (project_plan_id, problem_detail) VALUES (?, ?)`, [projectPlanId, problems])
      }
    }

    if (solutions !== undefined) {
      await conn.query(`DELETE FROM solutions WHERE project_plan_id = ?`, [projectPlanId])
      if (solutions?.trim()) {
        await conn.query(`INSERT INTO solutions (project_plan_id, solution_detail) VALUES (?, ?)`, [projectPlanId, solutions])
      }
    }

    // 6️⃣ CHANGE LOG & EDIT REASON
    if (edit_reason) {
      await conn.query(
        `INSERT INTO edit_reasons (ref_type, ref_id, reason_text) VALUES (?, ?, ?)`,
        ['project_plan', projectPlanId, edit_reason]
      )
    }

    // --- (จุดสำหรับเขียนโค้ดบันทึกไฟล์ req.files) ---
    if (files && files.length > 0) {
      for (const file of files) {
        // 1. กำหนด path ของไฟล์ (สมมติว่าใช้ multer เก็บไว้ในโฟลเดอร์ uploads)
        const filePath = `/uploads/${file.filename}`;
        const fileType = file.mimetype.split('/')[1];

        // 2. บันทึกลงตาราง attachments ใน Database
        await conn.query(`
      INSERT INTO attachments (ref_type, ref_id, file_path, file_type, is_active)
      VALUES (?, ?, ?, ?, 1)
    `, ['project_plan', projectPlanId, filePath, fileType]);
      }
    }

    // ดึง department_id ของคนที่แก้ไข
    const [[userRow]] = await conn.query(
      `SELECT department_id FROM users WHERE user_id = ?`,
      [changeUserId]
    )

    // บันทึก Change Log
    await conn.query(`
      INSERT INTO change_logs 
      (scope_id, project_plan_id, user_id, department_id, change_date)
      VALUES (?, ?, ?, ?, NOW())
    `, [
      beforeProject.scope_id,
      projectPlanId,
      changeUserId,
      userRow?.department_id || null
    ])

    await conn.commit()

    // 7️⃣ AFTER & EMAIL
    const [[afterProject]] = await conn.query(`
      SELECT pp.project_plan_name, pp.progress_percent, st.status_code, s.scope_name
      FROM project_plans pp
      JOIN status st ON pp.status_id = st.status_id
      JOIN scopes s ON pp.scope_id = s.scope_id
      WHERE pp.project_plan_id = ?
    `, [projectPlanId])

    const diffHtmlContent = diffHtml(beforeProject, afterProject, afterProject.status_code)

    // หาผู้รับอีเมล
    const [recipients] = await conn.query(`
      SELECT DISTINCT u.email FROM project_plans pp
      JOIN working_groups wg ON pp.scope_id = wg.scope_id
      JOIN users u ON u.user_id = wg.user_id
      WHERE pp.project_plan_id = ?
      UNION
      SELECT u2.email FROM project_plans pp2
      JOIN scopes s ON pp2.scope_id = s.scope_id
      JOIN users u2 ON s.coordinator_id = u2.user_id
      WHERE pp2.project_plan_id = ?
    `, [projectPlanId, projectPlanId])

    if (recipients.length > 0) {
      sendMail({
        to: recipients.map(r => r.email).join(','),
        subject: 'แจ้งปรับปรุงความก้าวหน้าแผนงาน',
        html: `
              <h3>มีการปรับปรุงแผนงาน</h3>
              <p><b>แผนงาน:</b> ${afterProject.project_plan_name}</p>
              <p><b>Scope:</b> ${afterProject.scope_name}</p>
              <br>
              ${diffHtmlContent}
              <br>
              ${edit_reason ? `<p><b>เหตุผลการแก้ไข:</b> ${edit_reason}</p>` : ''}
              <p style="color:#888; font-size:12px;">แก้ไขโดย: ${req.user.role} (ID: ${changeUserId})</p>
            `
      }).catch(err => console.error('Send mail error:', err))
    }

    res.json({ message: 'updated successfully' })

  } catch (err) {
    await conn.rollback()
    console.error('Update project error:', err)
    res.status(500).json({ message: 'Server error: ' + err.message })
  } finally {
    conn.release()
  }
})

// ================= GET Route =================
router.get('/projects/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // 1. ดึงข้อมูล Project + Scope + ข้อมูลผู้ประสานงาน (JOIN ตาราง users เพิ่ม)
    const [[project]] = await db.query(`
      SELECT 
        p.project_plan_id, 
        p.project_plan_name, 
        p.start_date,  
        p.end_date,      
        p.department_id,
        s.scope_id,
        s.scope_name, 
        u.user_name AS coord_name, 
        u.email AS coord_email, 
        u.phone_number AS coord_phone
      FROM project_plans p
      JOIN scopes s ON p.scope_id = s.scope_id
      LEFT JOIN users u ON s.coordinator_id = u.user_id
      WHERE p.project_plan_id = ?
    `, [id]);

    if (!project) return res.status(404).json({ message: 'ไม่พบแผนงาน' });

    const formatDate = (dateVal) => {
      if (!dateVal) return '';
      const d = new Date(dateVal);
      return d.toISOString().split('T')[0];
    };

    // 2. ดึงข้อมูล GAPs จากตาราง operational_details
    // ในส่วนของ GET /projects/:id
    const [gapRows] = await db.query(`
  SELECT 
    od.operation_id, 
    od.detail, 
    od.weight_percent AS weight, 
    od.progress_percent AS progress, 
    st.status_code AS status
  FROM operational_details od
  JOIN status st ON od.status_id = st.status_id
  WHERE od.project_plan_id = ?
`, [id]);


    // 3. จัด Format ให้ตรงกับ projectData ใน Vue.js
    res.json({
      project_plan_id: project.project_plan_id,
      scope_name: project.scope_name, // แก้ไขได้แล้ว
      plan_name: project.project_plan_name,
      department_id: project.department_id,
      start_date: formatDate(project.start_date),
      end_date: formatDate(project.end_date),
      coordinator: {
        name: project.coord_name || '',
        email: project.coord_email || '',
        phone_number: project.coord_phone || ''
      },
      gaps: gapRows.length > 0 ? gapRows : [{ detail: '', weight: 0, status: 'processing_gap' }]
    });

  } catch (err) {
    console.error('GET project error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ========================================================
// ✅ 4. API สำหรับหน้า Export (ขั้นตอนที่ 2: ดึง GAP ตาม Scope)
// ========================================================
router.get('/gap-analysis', verifyToken, isAdmin, async (req, res) => {
  try {
    const { scopeIds } = req.query;

    // ตรวจสอบว่ามีการส่ง scopeIds มาหรือไม่
    if (!scopeIds) {
      return res.status(400).json({ message: 'กรุณาส่งค่า scopeIds' });
    }

    const scopeIdArray = scopeIds.split(',').map(id => id.trim());

    // 1. ดึงข้อมูล GAP ทั้งหมดที่อยู่ใน scope_id ที่เลือก
    const [rows] = await db.query(`
      SELECT 
        s.scope_id AS scopeId, 
        s.scope_name AS scopeName,
        p.project_plan_name AS planName,
        od.operation_id, 
        od.detail, 
        od.progress_percent, 
        od.status_id
      FROM scopes s
      JOIN project_plans p ON s.scope_id = p.scope_id
      JOIN operational_details od ON p.project_plan_id = od.project_plan_id
      WHERE s.scope_id IN (?)
    `, [scopeIdArray]);

    const groupedData = rows.reduce((acc, row) => {
      // หาว่ามีกลุ่มของ scope_id นี้ใน array หรือยัง
      let group = acc.find(g => g.scopeId === row.scopeId);

      // ถ้ายังไม่มี ให้สร้างกลุ่มใหม่
      if (!group) {
        group = {
          scopeId: row.scopeId,
          scopeName: row.scopeName,
          planName: row.planName,
          gaps: []
        };
        acc.push(group);
      }

      // ใส่ข้อมูล GAP เข้าไปในกลุ่ม
      group.gaps.push({
        operation_id: row.operation_id,
        planName: row.planName,
        detail: row.detail,
        progress_percent: row.progress_percent || 0,
        status_id: row.status_id
      });

      return acc;
    }, []);

    // ส่งข้อมูลที่จัดกลุ่มแล้วกลับไปให้ Frontend
    res.json(groupedData);

  } catch (err) {
    console.error('Error fetching gap-analysis:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router