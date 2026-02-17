import { Router } from 'express'
import multer from 'multer'
import db from '../db.js'
import { sendMail } from '../global/mailer.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()
const upload = multer()

// ================= CSS & Email Helpers =================
const normalize = (v) => {
    if (v === null || v === undefined || v === '') return '-';
    return String(v).trim();
}

const getDiffRow = (label, before, after) => {
    const b = normalize(before);
    const a = normalize(after);
    if (b === a) return '';
    return `
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9fafb; width: 25%; font-weight: bold;">${label}</td>
            <td style="padding: 10px; border: 1px solid #ddd; width: 37%; color: #666;">${b}</td>
            <td style="padding: 10px; border: 1px solid #ddd; width: 37%; color: #000; background-color: #f0fdf4;">${a}</td>
        </tr>
    `;
}

const getTextDiffTable = (title, beforeText, afterText) => {
    const b = normalize(beforeText === '-' ? '' : beforeText);
    const a = normalize(afterText);

    if (b === a) return '';

    return `
        <div style="margin-top: 20px;">
            <div style="background-color: #e5e7eb; padding: 8px 12px; font-weight: bold; border: 1px solid #d1d5db; border-bottom: none; color: #333;">
                ${title}
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #d1d5db; font-size: 14px;">
                <thead>
                    <tr>
                        <th style="width: 50%; background-color: #f3f4f6; padding: 8px; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; text-align: left; color: #555;">ข้อมูลเดิม</th>
                        <th style="width: 50%; background-color: #ecfdf5; padding: 8px; border-bottom: 1px solid #d1d5db; text-align: left; color: #065f46;">ข้อมูลใหม่ (แก้ไข)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 12px; border-right: 1px solid #d1d5db; vertical-align: top; color: #666; background-color: #fff; line-height: 1.6; white-space: pre-line;">${b || '-'}</td>
                        <td style="padding: 12px; vertical-align: top; color: #000; background-color: #fafffc; line-height: 1.6; white-space: pre-line;">${a}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

const generateEmailTemplate = (data) => {
    const {
        projectName, scopeName,
        beforeProgress, afterProgress,
        beforeStatus, afterStatus,
        beforeProblems, afterProblems,
        beforeSolutions, afterSolutions,
        editReason, userEmail
    } = data;

    const rowProgress = getDiffRow('ความก้าวหน้าสะสม', `${beforeProgress}%`, `${afterProgress}%`);
    const rowStatus = getDiffRow('สถานะการดำเนินงาน', beforeStatus, afterStatus);

    let summaryTable = '';
    if (rowProgress || rowStatus) {
        summaryTable = `
            <h3 style="font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">1. สรุปสถานะโครงการ</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
                <thead>
                    <tr>
                        <th style="padding: 10px; border: 1px solid #ddd; background-color: #eee;">รายการ</th>
                        <th style="padding: 10px; border: 1px solid #ddd; background-color: #eee;">ข้อมูลเดิม</th>
                        <th style="padding: 10px; border: 1px solid #ddd; background-color: #eee;">ข้อมูลปัจจุบัน</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowProgress}
                    ${rowStatus}
                </tbody>
            </table>
        `;
    }

    const problemsBlock = getTextDiffTable('2. การเปลี่ยนแปลง: ปัญหาและอุปสรรค', beforeProblems, afterProblems);
    const solutionsBlock = getTextDiffTable('3. การเปลี่ยนแปลง: แนวทางแก้ไข/การดำเนินการ', beforeSolutions, afterSolutions);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600&display=swap');
            body { font-family: 'Sarabun', Arial, sans-serif; }
            table { border-collapse: collapse; }
        </style>
    </head>
    <body style="background-color: #f0f2f5; padding: 20px; color: #333;">
        <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; padding: 40px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            
            <div style="border-bottom: 3px double #1e3a8a; padding-bottom: 15px; margin-bottom: 25px;">
                <h2 style="color: #1e3a8a; margin: 0; font-size: 22px;">รายงานแจ้งการปรับปรุงข้อมูลแผนงาน</h2>
                <div style="color: #666; font-size: 14px; margin-top: 5px;">Project Migration Tracking System</div>
            </div>

            <table width="100%" style="margin-bottom: 30px; font-size: 14px;">
                <tr><td width="15%" style="font-weight: bold; padding: 5px 0;">เรียน:</td><td>คณะทำงานและผู้เกี่ยวข้อง</td></tr>
                <tr><td style="font-weight: bold; padding: 5px 0;">เรื่อง:</td><td>แจ้งผลการแก้ไขข้อมูลแผนงาน: <strong>${projectName}</strong></td></tr>
                <tr><td style="font-weight: bold; padding: 5px 0;">ขอบเขต:</td><td>${scopeName}</td></tr>
                 <tr><td style="font-weight: bold; padding: 5px 0;">วันที่:</td><td>${new Date().toLocaleDateString('th-TH')}</td></tr>
            </table>

            <div style="font-size: 14px; line-height: 1.6;">
                ${summaryTable}
                ${problemsBlock}
                ${solutionsBlock}
                ${(!summaryTable && !problemsBlock && !solutionsBlock) ?
            `<div style="padding: 15px; border: 1px solid #ddd; background-color: #f9fafb; text-align: center;">ไม่มีการเปลี่ยนแปลงข้อมูลสำคัญ (บันทึกสถานะปัจจุบัน)</div>` : ''}
            </div>

            ${editReason ? `
            <div style="margin-top: 30px; background-color: #fff; border: 1px solid #ddd; padding: 15px;">
                <strong style="display:block; margin-bottom: 5px; color: #1e3a8a;">หมายเหตุ / เหตุผลการแก้ไข:</strong>
                <span style="color: #555;">${editReason}</span>
            </div>` : ''}

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center;">
                เอกสารนี้จัดทำโดยระบบอัตโนมัติ<br>
                ผู้ดำเนินการบันทึก: ${userEmail || '-'}
            </div>
        </div>
    </body>
    </html>
    `;
}

// ================= GET Route =================
router.get('/projects/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // 1. ดึงข้อมูล Project หลัก
        const sqlProject = `
            SELECT 
                p.project_plan_id AS id, 
                p.project_plan_name AS name, 
                p.progress_percent AS progress, 
                st.status_code AS status, 
                s.scope_name AS scope, 
                s.start_date AS startDate, 
                s.end_date AS endDate,
                p.details AS details  -- ดึงค่า 'เทส' จากตรงนี้
            FROM project_plans p 
            JOIN scopes s ON p.scope_id = s.scope_id 
            JOIN status st ON p.status_id = st.status_id 
            WHERE p.project_plan_id = ?
        `;

        const [rows] = await db.query(sqlProject, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Project not found' });

        const project = rows[0];

        // 2. ดึงข้อมูล Gaps (แก้ไขชื่อคอลัมน์ให้เป็น detail ตามจริง)
        const sqlGaps = `
            SELECT 
                od.operation_id, 
                od.detail, -- ✅ ใช้ detail (ไม่มีคำว่า operation_) ตามโครงสร้างที่คุณส่งมา
                od.weight_percent, 
                od.status_id, 
                st.status_code 
            FROM operational_details od 
            LEFT JOIN status st ON od.status_id = st.status_id 
            WHERE od.project_plan_id = ?
        `;
        const [gapRows] = await db.query(sqlGaps, [id]);

        project.gaps = gapRows.map(row => ({
            id: row.operation_id,
            text: row.detail,
            weight: row.weight_percent,
            status: row.status_code || 'processing_gap'
        }));

        // 3. Problems (คงเดิม)
        const [probRows] = await db.query(`SELECT problem_detail FROM problems WHERE project_plan_id = ?`, [id]);
        project.problems = probRows.map(r => r.problem_detail).join('\n');

        // 4. Solutions (คงเดิม)
        const [solRows] = await db.query(`SELECT solution_detail FROM solutions WHERE project_plan_id = ?`, [id]);
        project.solutions = solRows.map(r => r.solution_detail).join('\n');

        res.json(project);
    } catch (err) {
        console.error("GET Project Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// ================= UPDATE Route =================
router.put('/projects/:id', upload.array('attachments'), verifyToken, async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { id } = req.params;

        // รับค่า details ที่ส่งมาจาก Frontend
        const { status, progress, problems, solutions, gaps, edit_reason, details } = req.body;

        // 1. Check Project Exists
        const [[beforeProject]] = await conn.query(`
            SELECT pp.progress_percent, st.status_code, pp.project_plan_name, s.scope_name, pp.scope_id
            FROM project_plans pp
            JOIN status st ON pp.status_id = st.status_id
            JOIN scopes s ON pp.scope_id = s.scope_id
            WHERE pp.project_plan_id = ?
        `, [id]);

        if (!beforeProject) throw new Error('Project not found');

        // Fetch Old Data for Email Diff
        const [oldProbRows] = await conn.query(`SELECT problem_detail FROM problems WHERE project_plan_id = ?`, [id]);
        const beforeProblems = oldProbRows.map(r => r.problem_detail).join('\n');

        const [oldSolRows] = await conn.query(`SELECT solution_detail FROM solutions WHERE project_plan_id = ?`, [id]);
        const beforeSolutions = oldSolRows.map(r => r.solution_detail).join('\n');

        // 2. Update Project Plan (เพิ่มฟิลด์ details ลงในการ UPDATE)
        let status_id = 1;
        const statusStr = String(status).toLowerCase();
        if (statusStr.includes('open') || statusStr.includes('processing') || statusStr === '1') status_id = 1;
        else if (statusStr.includes('closed') || statusStr.includes('complete') || statusStr === '2') status_id = 2;
        else if (statusStr.includes('acceptable') || statusStr === '3') status_id = 3;

        // ✅ แก้ไข: เพิ่ม details = ? ในคำสั่ง UPDATE
        await conn.query(`
            UPDATE project_plans 
            SET status_id = ?, progress_percent = ?, details = ?
            WHERE project_plan_id = ?
        `, [status_id, progress, details || '', id]);

        // 3. Update Problems (คงเดิม)
        await conn.query(`DELETE FROM problems WHERE project_plan_id = ?`, [id]);
        if (problems) {
            const problemList = problems.split('\n').filter(p => p.trim() !== '');
            if (problemList.length > 0) {
                await conn.query(`INSERT INTO problems (project_plan_id, problem_detail) VALUES ?`, [problemList.map(p => [id, p])]);
            }
        }

        // 4. Update Solutions (คงเดิม)
        await conn.query(`DELETE FROM solutions WHERE project_plan_id = ?`, [id]);
        if (solutions) {
            const solutionList = solutions.split('\n').filter(s => s.trim() !== '');
            if (solutionList.length > 0) {
                await conn.query(`INSERT INTO solutions (project_plan_id, solution_detail) VALUES ?`, [solutionList.map(s => [id, s])]);
            }
        }

        // 5. Update Operational Details (Gaps) 
        await conn.query(`DELETE FROM operational_details WHERE project_plan_id = ?`, [id]);

        if (gaps) {
            let gapsData = [];
            try { gapsData = typeof gaps === 'string' ? JSON.parse(gaps) : gaps; } catch (e) { }

            if (Array.isArray(gapsData) && gapsData.length > 0) {
                const gapValues = gapsData.map(gap => {
                    let gapStatusId = 1;
                    const gapStatusStr = String(gap.status || '').toLowerCase();

                    if (gapStatusStr.includes('complete') || gapStatusStr === '2') gapStatusId = 2;
                    else if (gapStatusStr.includes('acceptable') || gapStatusStr === '3') gapStatusId = 3;

                    return [
                        id,
                        gap.text || '',
                        gap.weight || 0,
                        0,
                        gapStatusId
                    ];
                });

                const sqlInsertGap = `
    INSERT INTO operational_details 
    (project_plan_id, detail, weight_percent, progress_percent, status_id) 
    VALUES ?
`;

                await conn.query(sqlInsertGap, [gapValues]);
            }
        }

        // 6. Log Reason & Attachments
        if (edit_reason) await conn.query(`INSERT INTO edit_reasons (ref_type, ref_id, reason_text) VALUES ('project_plan', ?, ?)`, [id, edit_reason]);

        if (req.files && req.files.length > 0) {
            const fileValues = req.files.map(file => ['project_plan', id, `/uploads/${file.filename}`, file.mimetype.split('/')[1] || 'file']);
            await conn.query(`INSERT INTO attachments (ref_type, ref_id, file_path, file_type) VALUES ?`, [fileValues]);
        }

        await conn.commit();

        // 7. Send Email (ดึงข้อมูลล่าสุดเพื่อส่งเมล์)
        try {
            const [[afterProject]] = await conn.query(`SELECT pp.project_plan_name, pp.progress_percent, st.status_code, s.scope_name FROM project_plans pp JOIN status st ON pp.status_id = st.status_id JOIN scopes s ON pp.scope_id = s.scope_id WHERE pp.project_plan_id = ?`, [id]);

            const [recipients] = await conn.query(`
                SELECT DISTINCT u.email FROM users u JOIN working_groups wg ON u.user_id = wg.user_id WHERE wg.scope_id = ?
                UNION SELECT DISTINCT u.email FROM users u JOIN scopes s ON u.user_id = s.coordinator_id WHERE s.scope_id = ?
            `, [beforeProject.scope_id, beforeProject.scope_id]);

            if (recipients.length > 0) {
                const htmlContent = generateEmailTemplate({
                    projectName: afterProject.project_plan_name,
                    scopeName: afterProject.scope_name,
                    beforeProgress: beforeProject.progress_percent || 0,
                    afterProgress: afterProject.progress_percent,
                    beforeStatus: beforeProject.status_code,
                    afterStatus: afterProject.status_code,
                    beforeProblems: beforeProblems,
                    afterProblems: problems || '',
                    beforeSolutions: beforeSolutions,
                    afterSolutions: solutions || '',
                    editReason: edit_reason,
                    userEmail: req.user ? req.user.email : 'System'
                });

                await sendMail({
                    to: recipients.map(r => r.email).join(','),
                    subject: `[Update] รายงานความคืบหน้า: ${afterProject.project_plan_name}`,
                    html: htmlContent
                });
            }
        } catch (emailErr) {
            console.error('⚠️ Warning: Failed to send email:', emailErr);
        }

        res.json({ message: 'Update successful' });

    } catch (err) {
        await conn.rollback();
        console.error('Update Project Error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    } finally {
        conn.release();
    }
});

export default router