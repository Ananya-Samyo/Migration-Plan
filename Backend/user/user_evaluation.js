import { Router } from 'express'
import multer from 'multer'
import db from '../db.js'
import { sendMail } from '../global/mailer.js' // ฟังก์ชันส่งเมลที่มีอยู่ของคุณ
import { verifyToken } from '../middleware/auth.js'

const router = Router()
const upload = multer() // เก็บไฟล์ใน Memory Buffer

// --- Helper: สร้าง HTML สำหรับเมลเปรียบเทียบข้อมูล ---
const getDiffRow = (label, before, after) => {
    if (before === after) return '';
    return `
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9fafb; font-weight: bold;">${label}</td>
            <td style="padding: 10px; border: 1px solid #ddd; color: #666;">${before || '-'}</td>
            <td style="padding: 10px; border: 1px solid #ddd; color: #000; background-color: #f0fdf4;">${after || '-'}</td>
        </tr>`;
}

// ================= GET Route =================
router.get('/evaluations/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const sql = `
            SELECT 
                p.project_plan_name AS scope_name,
                e.project_status,
                e.objective,
                e.before_plan,
                e.expected_outcome,
                e.actual_outcome,
                e.evaluation_status,
                e.recommendation,
                -- ดึงปัญหาจากตาราง problems เหมือนเดิม
                (SELECT problem_detail FROM problems WHERE project_plan_id = p.project_plan_id LIMIT 1) AS problem_detail
            FROM project_plans p
            LEFT JOIN plan_evaluations e ON p.project_plan_id = e.project_plan_id
            WHERE p.project_plan_id = ?
        `;

        const [rows] = await db.query(sql, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Project not found' });

        res.json(rows[0]);
    } catch (err) {
        console.error("GET Evaluation Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// --- API: UPDATE Evaluation & Send Email ---
router.put('/evaluations/:id', verifyToken, upload.array('attachments'), async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { id } = req.params;
        const { actual_outcome, recommendation, project_status, evaluation_status, problem, edit_reason } = req.body;
        const files = req.files;

        // 1. ดึงข้อมูลเก่าเก็บไว้ก่อนเพื่อเปรียบเทียบในเมล
        const [oldRows] = await conn.query(`
            SELECT p.project_plan_name, e.*, pb.problem_detail 
            FROM project_plans p 
            LEFT JOIN plan_evaluations e ON p.project_plan_id = e.project_plan_id 
            LEFT JOIN problems pb ON p.project_plan_id = pb.project_plan_id
            WHERE p.project_plan_id = ?`, [id]);
        const old = oldRows[0] || {};

        // 2. บันทึกข้อมูลการประเมิน (Upsert)
        const [[proj]] = await conn.query('SELECT scope_id FROM project_plans WHERE project_plan_id = ?', [id]);
        await conn.query(`
            INSERT INTO plan_evaluations (project_plan_id, scope_id, actual_outcome, recommendation, project_status, evaluation_status)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                actual_outcome = VALUES(actual_outcome), recommendation = VALUES(recommendation),
                project_status = VALUES(project_status), evaluation_status = VALUES(evaluation_status)
        `, [id, proj?.scope_id, actual_outcome, recommendation, project_status, evaluation_status]);

        // 3. จัดการข้อมูลปัญหา
        await conn.query('DELETE FROM problems WHERE project_plan_id = ?', [id]);
        if (evaluation_status === 'fail' && problem) {
            await conn.query('INSERT INTO problems (project_plan_id, problem_detail) VALUES (?, ?)', [id, problem]);
        }

        // 4. Logic การส่งเมลจาก Backend
        const emailHtml = `
            <div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #1e3a8a;">แจ้งอัปเดตการประเมิน: ${old.project_plan_name}</h2>
                <p>ผู้ดำเนินการ: ${req.user.email}</p>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: #eee;">
                        <th style="padding: 10px; border: 1px solid #ddd;">รายการ</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">เดิม</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">ใหม่</th>
                    </tr>
                    ${getDiffRow('สถานะการประเมิน', old.evaluation_status, evaluation_status)}
                    ${getDiffRow('ผลที่ได้รับจริง', old.actual_outcome, actual_outcome)}
                    ${getDiffRow('ปัญหา/อุปสรรค', old.problem_detail, problem)}
                </table>
                ${edit_reason ? `<p><strong>เหตุผลเพิ่มเติม:</strong> ${edit_reason}</p>` : ''}
            </div>`;

        await sendMail({
            to: 'manager@example.com', // หรือ query จาก DB
            subject: `[Update] การประเมินผล: ${old.project_plan_name}`,
            html: emailHtml,
            attachments: files?.map(f => ({ filename: f.originalname, content: f.buffer }))
        });

        await conn.commit();
        res.json({ message: 'บันทึกและส่งอีเมลเรียบร้อย' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: 'Server Error', error: err.message });
    } finally {
        conn.release();
    }
});

export default router;