import { Router } from 'express';
import multer from 'multer';
import db from '../db.js';
import { sendMail } from '../global/mailer.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
const upload = multer(); // เก็บไฟล์ใน Memory Buffer

// --- Helper: สร้าง HTML สำหรับเมลเปรียบเทียบข้อมูล ---
const getDiffRow = (label, before, after) => {
    // ถ้าไม่มีการเปลี่ยนแปลง หรือค่าเหมือนกัน (หลังแปลงเป็น String) ไม่ต้องแสดงแถว
    if (String(before || '') === String(after || '')) return '';
    return `
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9fafb; font-weight: bold;">${label}</td>
            <td style="padding: 10px; border: 1px solid #ddd; color: #666;">${before || '-'}</td>
            <td style="padding: 10px; border: 1px solid #ddd; color: #000; background-color: #f0fdf4;">${after || '-'}</td>
        </tr>`;
};

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
                e.recommendation,
                e.evaluation_status,
                prob.problem_detail,
                u.user_name AS owner
            FROM project_plans p
            LEFT JOIN plan_evaluations e ON p.project_plan_id = e.project_plan_id 
            LEFT JOIN (
                SELECT project_plan_id, GROUP_CONCAT(problem_detail SEPARATOR '\n') as problem_detail 
                FROM problems GROUP BY project_plan_id
            ) prob ON p.project_plan_id = prob.project_plan_id
            LEFT JOIN scopes s ON p.scope_id = s.scope_id
            LEFT JOIN users u ON s.coordinator_id = u.user_id
            WHERE p.project_plan_id = ?
        `;

        const [rows] = await db.query(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลแผนงานที่ระบุ' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("SQL Error:", err);
        res.status(500).json({ message: err.message });
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

        // 1. ดึงข้อมูลเดิม (เพิ่มการ Join scope เพื่อเอา department_id มาทำ Log)
        const [oldRows] = await conn.query(`
            SELECT p.project_plan_name, p.scope_id, s.department_id, e.*, 
                   (SELECT GROUP_CONCAT(problem_detail SEPARATOR '\n') FROM problems WHERE project_plan_id = p.project_plan_id) as problem_detail
            FROM project_plans p 
            LEFT JOIN scopes s ON p.scope_id = s.scope_id
            LEFT JOIN plan_evaluations e ON p.project_plan_id = e.project_plan_id 
            WHERE p.project_plan_id = ?`, [id]);
        
        if (oldRows.length === 0) {
            throw new Error('ไม่พบข้อมูลแผนงานที่ต้องการอัปเดต');
        }
        const old = oldRows[0];

        // 2. บันทึกข้อมูลการประเมิน (Upsert)
        await conn.query(`
            INSERT INTO plan_evaluations (project_plan_id, scope_id, actual_outcome, recommendation, project_status, evaluation_status)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                actual_outcome = VALUES(actual_outcome), 
                recommendation = VALUES(recommendation),
                project_status = VALUES(project_status), 
                evaluation_status = VALUES(evaluation_status)
        `, [id, old.scope_id, actual_outcome, recommendation, project_status, evaluation_status]);

        // 3. จัดการข้อมูลปัญหา (ลบของเก่าแล้วเพิ่มใหม่ถ้าเป็น 'fail')
        await conn.query('DELETE FROM problems WHERE project_plan_id = ?', [id]);
        if (evaluation_status === 'fail' && problem) {
            await conn.query('INSERT INTO problems (project_plan_id, problem_detail) VALUES (?, ?)', [id, problem]);
        }

        // 4. บันทึก Log การเปลี่ยนแปลง
        const [logResult] = await conn.query(
            `INSERT INTO change_logs (user_id, scope_id, project_plan_id, department_id, change_type, change_date)
             VALUES (?, ?, ?, ?, 'evaluation', NOW())`,
            [req.user.id, old.scope_id, id, old.department_id]
        );
        const logId = logResult.insertId;

        const changes = [
            { field: 'evaluation_status', before: old.evaluation_status, after: evaluation_status },
            { field: 'actual_outcome', before: old.actual_outcome, after: actual_outcome },
            { field: 'recommendation', before: old.recommendation, after: recommendation },
            { field: 'project_status', before: old.project_status, after: project_status },
            { field: 'problem_detail', before: old.problem_detail, after: problem }
        ];

        for (const change of changes) {
            if (String(change.before || '') !== String(change.after || '')) {
                await conn.query(
                    `INSERT INTO change_log_details (log_id, field_name, before_value, after_value)
                     VALUES (?, ?, ?, ?)`,
                    [logId, change.field, String(change.before || ''), String(change.after || '')]
                );
            }
        }

        // บันทึกเหตุผลการแก้ไข (ลงตาราง edit_reasons ตาม Schema)
        if (edit_reason) {
            await conn.query(
                `INSERT INTO edit_reasons (ref_type, ref_id, reason_text) VALUES ('evaluation', ?, ?)`,
                [id, edit_reason]
            );
        }

        // 5. บันทึกข้อมูลไฟล์แนบ (ถ้ามี)
        if (files && files.length > 0) {
            for (const file of files) {
                // หมายเหตุ: เนื่องจากเป็น memoryStorage file.path จะไม่มี 
                // ในที่นี้จะเก็บชื่อไฟล์แทน หรือคุณควรย้ายไฟล์ลง Folder ก่อนแล้วเก็บ Path จริง
                const savedPath = `/uploads/${Date.now()}_${file.originalname}`; 
                await conn.query(
                    `INSERT INTO attachments (ref_type, ref_id, file_path, file_type) 
                     VALUES ('evaluation', ?, ?, ?)`,
                    [id, savedPath, file.mimetype.split('/')[1]]
                );
            }
        }

        // 6. ส่งอีเมลแจ้งเตือน
        const emailHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">
                    อัปเดตผลการประเมิน: ${old.project_plan_name}
                </h2>
                <p style="font-size: 14px;"><strong>ผู้ดำเนินการ:</strong> ${req.user.user_name || req.user.email}</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #f3f4f6;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">หัวข้อ</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">ข้อมูลเดิม</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">ข้อมูลใหม่</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${getDiffRow('สถานะการประเมิน', old.evaluation_status, evaluation_status)}
                        ${getDiffRow('ผลที่ได้รับจริง', old.actual_outcome, actual_outcome)}
                        ${getDiffRow('ข้อเสนอแนะ', old.recommendation, recommendation)}
                        ${getDiffRow('สถานะโครงการ', old.project_status, project_status)}
                        ${getDiffRow('ปัญหา/อุปสรรค', old.problem_detail, problem)}
                    </tbody>
                </table>
                ${edit_reason ? `<div style="margin-top: 20px; padding: 10px; background: #fffbeb; border-left: 4px solid #f59e0b;">
                    <strong>เหตุผลในการแก้ไข:</strong> ${edit_reason}
                </div>` : ''}
                <p style="margin-top: 20px; color: #666; font-size: 12px;">ระบบแจ้งเตือนอัตโนมัติจาก Migration Plan System</p>
            </div>`;

        await sendMail({
            to: 'manager@example.com', // หรือดึงเมลจากหัวหน้าแผนกใน DB
            subject: `[Update] ผลการประเมิน: ${old.project_plan_name}`,
            html: emailHtml,
            attachments: files?.map(f => ({ filename: f.originalname, content: f.buffer }))
        });

        await conn.commit();
        res.json({ message: 'บันทึกข้อมูลและส่งอีเมลแจ้งเตือนเรียบร้อยแล้ว' });

    } catch (err) {
        await conn.rollback();
        console.error("Update Error:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', error: err.message });
    } finally {
        conn.release();
    }
});

export default router;