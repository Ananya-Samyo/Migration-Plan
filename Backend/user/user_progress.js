import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import db from '../db.js'
import { sendMail } from '../global/mailer.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

// --- ตั้งค่าการเก็บไฟล์ลง Disk เพื่อให้มีชื่อไฟล์และ Path ที่ถาวร ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/';
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// ================= Helpers =================
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
        </tr>`;
}

const getTextDiffTable = (title, beforeText, afterText) => {
    const b = normalize(beforeText === '-' ? '' : beforeText);
    const a = normalize(afterText);
    if (b === a) return '';
    return `
        <div style="margin-top: 20px;">
            <div style="background-color: #e5e7eb; padding: 8px 12px; font-weight: bold; border: 1px solid #d1d5db; border-bottom: none; color: #333;">${title}</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #d1d5db; font-size: 14px;">
                <thead>
                    <tr>
                        <th style="width: 50%; background-color: #f3f4f6; padding: 8px; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; text-align: left;">ข้อมูลเดิม</th>
                        <th style="width: 50%; background-color: #ecfdf5; padding: 8px; border-bottom: 1px solid #d1d5db; text-align: left; color: #065f46;">ข้อมูลใหม่</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 12px; border-right: 1px solid #d1d5db; vertical-align: top; color: #666; white-space: pre-line;">${b}</td>
                        <td style="padding: 12px; vertical-align: top; color: #000; background-color: #fafffc; white-space: pre-line;">${a}</td>
                    </tr>
                </tbody>
            </table>
        </div>`;
}

const generateEmailTemplate = (data) => {
    const { projectName, scopeName, beforeProgress, afterProgress, beforeStatus, afterStatus, beforeProblems, afterProblems, beforeSolutions, afterSolutions, editReason, userEmail } = data;
    const rowProgress = getDiffRow('ความก้าวหน้าสะสม', `${beforeProgress}%`, `${afterProgress}%`);
    const rowStatus = getDiffRow('สถานะการดำเนินงาน', beforeStatus, afterStatus);

    return `
    <html>
    <body style="font-family: 'Sarabun', sans-serif; padding: 20px; color: #333; background-color: #f4f4f7;">
        <div style="max-width: 680px; margin: 0 auto; background: #fff; padding: 30px; border: 1px solid #eee;">
            <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">รายงานแจ้งปรับปรุงความคืบหน้า</h2>
            <p><strong>โครงการ:</strong> ${projectName}</p>
            <p><strong>ขอบเขต:</strong> ${scopeName}</p>
            
            ${(rowProgress || rowStatus) ? `
                <table width="100%" style="border-collapse: collapse; margin-top: 20px;">
                    <tr style="background: #eee;"><th style="padding: 10px; border: 1px solid #ddd;">หัวข้อ</th><th style="padding: 10px; border: 1px solid #ddd;">เดิม</th><th style="padding: 10px; border: 1px solid #ddd;">ใหม่</th></tr>
                    ${rowProgress} ${rowStatus}
                </table>` : ''}

            ${getTextDiffTable('ปัญหาและอุปสรรค', beforeProblems, afterProblems)}
            ${getTextDiffTable('แนวทางแก้ไข', beforeSolutions, afterSolutions)}

            ${editReason ? `<p style="margin-top: 20px; padding: 10px; background: #fffbeb;"><strong>เหตุผลการแก้ไข:</strong> ${editReason}</p>` : ''}
            <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
                ดำเนินการโดย: ${userEmail}
            </div>
        </div>
    </body>
    </html>`;
}

// ================= GET Route =================
router.get('/projects/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const sqlProject = `
            SELECT p.project_plan_id AS id, p.project_plan_name AS name, p.progress_percent AS progress, 
                   st.status_code AS status, s.scope_name AS scope, p.details,
                   p.start_date, p.end_date  
            FROM project_plans p 
            JOIN scopes s ON p.scope_id = s.scope_id 
            JOIN status st ON p.status_id = st.status_id 
            WHERE p.project_plan_id = ?`;

        const [rows] = await db.query(sqlProject, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Project not found' });

        const project = rows[0];

        // --- 🚩 ส่วนที่แก้ไข: จัดการ Format วันที่ให้ Frontend อ่านได้ ---
        // ตรวจสอบว่ามีค่าวันที่ใน scope ไหม ถ้ามีให้ตัดเอาเฉพาะ YYYY-MM-DD
        project.startDate = project.start_date 
            ? new Date(project.start_date).toISOString().split('T')[0] 
            : ""; 
            
        project.endDate = project.end_date 
            ? new Date(project.end_date).toISOString().split('T')[0] 
            : "";
        // -------------------------------------------------------

        const [gapRows] = await db.query(`
            SELECT operation_id as id, detail as text, weight_percent as weight, st.status_code as status 
            FROM operational_details od 
            LEFT JOIN status st ON od.status_id = st.status_id 
            WHERE od.project_plan_id = ?`, [id]);
        project.gaps = gapRows;

        const [probs] = await db.query(`SELECT problem_detail FROM problems WHERE project_plan_id = ?`, [id]);
        project.problems = probs.map(r => r.problem_detail).join('\n');

        const [sols] = await db.query(`SELECT solution_detail FROM solutions WHERE project_plan_id = ?`, [id]);
        project.solutions = sols.map(r => r.solution_detail).join('\n');

        // ส่ง Object ที่มี startDate และ endDate (CamelCase) กลับไป
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// ================= UPDATE Route =================
router.put('/projects/:id', verifyToken, upload.array('attachments'), async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { id } = req.params;
        const { status, progress, problems, solutions, gaps, edit_reason, details } = req.body;

        // 1. ดึงข้อมูล Before
        const [[before]] = await conn.query(`
            SELECT pp.*, st.status_code, s.scope_name, s.department_id 
            FROM project_plans pp JOIN status st ON pp.status_id = st.status_id 
            JOIN scopes s ON pp.scope_id = s.scope_id WHERE pp.project_plan_id = ?`, [id]);

        const [oldProbs] = await conn.query(`SELECT problem_detail FROM problems WHERE project_plan_id = ?`, [id]);
        const beforeProbs = oldProbs.map(r => r.problem_detail).join('\n');
        const [oldSols] = await conn.query(`SELECT solution_detail FROM solutions WHERE project_plan_id = ?`, [id]);
        const beforeSols = oldSols.map(r => r.solution_detail).join('\n');

        // 1. ดึง user_id จาก token ที่ verify แล้ว
        const userIdForLog = req.user.id;

        // 2. บันทึก Change Log หลัก (จุดนี้มีในโค้ดคุณอยู่แล้ว แค่เช็คให้แน่ใจ)
        const [log] = await conn.query(
            `INSERT INTO change_logs (user_id, scope_id, project_plan_id, department_id, change_type, change_date) VALUES (?, ?, ?, ?, 'progress', NOW())`,
            [userIdForLog, before.scope_id, id, before.department_id]
        );
        const logId = log.insertId;

        if (gaps) {
            const gapData = typeof gaps === 'string' ? JSON.parse(gaps) : gaps;
            const gVals = gapData.map(g => {
                let gapStatusId = 1;
                if (g.status === 'complete_gap') gapStatusId = 2;
                if (g.status === 'acceptable_gap') gapStatusId = 3;

                return [id, g.text, g.weight, gapStatusId];
            });

            if (gVals.length) {
                await conn.query(`INSERT INTO operational_details (project_plan_id, detail, weight_percent, status_id) VALUES ?`, [gVals]);
            }
        }

        // 3. บันทึกรายละเอียดการเปลี่ยนแปลง
        const status_id = (status === 'closed' || status === '2') ? 2 : 1;
        const changes = [
            { field: 'progress_percent', before: before.progress_percent, after: progress },
            { field: 'status_id', before: before.status_id, after: status_id },
            { field: 'details', before: before.details, after: details },
            { field: 'problems', before: beforeProbs, after: problems },
            { field: 'solutions', before: beforeSols, after: solutions }
        ];

        for (const c of changes) {
            if (normalize(c.before) !== normalize(c.after)) {
                await conn.query(`INSERT INTO change_log_details (log_id, field_name, before_value, after_value) VALUES (?, ?, ?, ?)`,
                    [logId, c.field, String(c.before || ''), String(c.after || '')]);
            }
        }

        // 4. Update ตารางหลัก
        await conn.query(`UPDATE project_plans SET status_id = ?, progress_percent = ?, details = ? WHERE project_plan_id = ?`,
            [status_id, progress, details, id]);

        // Problems & Solutions
        await conn.query(`DELETE FROM problems WHERE project_plan_id = ?`, [id]);
        if (problems) {
            const pList = problems.split('\n').filter(p => p.trim()).map(p => [id, p]);
            if (pList.length) await conn.query(`INSERT INTO problems (project_plan_id, problem_detail) VALUES ?`, [pList]);
        }

        await conn.query(`DELETE FROM solutions WHERE project_plan_id = ?`, [id]);
        if (solutions) {
            const sList = solutions.split('\n').filter(s => s.trim()).map(s => [id, s]);
            if (sList.length) await conn.query(`INSERT INTO solutions (project_plan_id, solution_detail) VALUES ?`, [sList]);
        }

        // Operational Details (Gaps)
        await conn.query(`DELETE FROM operational_details WHERE project_plan_id = ?`, [id]);
        if (gaps) {
            const gapData = typeof gaps === 'string' ? JSON.parse(gaps) : gaps;

            const gVals = gapData.map(g => {
                let statusIdForGap = 1;
                if (g.status === 'complete_gap' || g.status === 'complete') {
                    statusIdForGap = 2;
                } else if (g.status === 'acceptable_gap') {
                    statusIdForGap = 3;
                }

                return [id, g.text, g.weight, statusIdForGap];
            });

            if (gVals.length) {
                await conn.query(
                    `INSERT INTO operational_details (project_plan_id, detail, weight_percent, status_id) VALUES ?`,
                    [gVals]
                );
            }
        }

        // 5. จัดการไฟล์แนบ
        if (req.files?.length) {
            for (const file of req.files) {
                const fPath = `/uploads/${file.filename}`;
                await conn.query(`INSERT INTO attachments (ref_type, ref_id, file_path, file_type) VALUES ('change_log', ?, ?, ?)`,
                    [logId, fPath, file.mimetype.split('/')[1]]);
            }
        }

        await conn.commit();

        // 6. ส่งอีเมลแจ้งเตือน
        const [recipients] = await conn.query(`
            SELECT email FROM users WHERE user_id IN (SELECT user_id FROM working_groups WHERE scope_id = ?)
            UNION SELECT email FROM users WHERE user_id = (SELECT coordinator_id FROM scopes WHERE scope_id = ?)`,
            [before.scope_id, before.scope_id]);

        if (recipients.length) {
            const [[after]] = await conn.query(`SELECT pp.project_plan_name, st.status_code FROM project_plans pp JOIN status st ON pp.status_id = st.status_id WHERE pp.project_plan_id = ?`, [id]);
            await sendMail({
                to: recipients.map(r => r.email).join(','),
                subject: `[Update] ความคืบหน้า: ${after.project_plan_name}`,
                html: generateEmailTemplate({
                    projectName: after.project_plan_name, scopeName: before.scope_name,
                    beforeProgress: before.progress_percent, afterProgress: progress,
                    beforeStatus: before.status_code, afterStatus: after.status_code,
                    beforeProblems: beforeProbs, afterProblems: problems,
                    beforeSolutions: beforeSols, afterSolutions: solutions,
                    editReason: edit_reason, userEmail: req.user.email
                })
            });
        }

        res.json({ message: 'Update successful' });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ message: 'Error', error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

export default router;