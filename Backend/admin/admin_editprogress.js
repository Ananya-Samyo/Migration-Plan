import { Router } from 'express'
import db from '../db.js'
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router()

// --- ตั้งค่าการเก็บไฟล์หลักฐาน ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/evidence';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // ตั้งชื่อไฟล์: timestamp-ชื่อไฟล์เดิม
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// 1. GET ข้อมูลเพื่อนำไปแสดงในหน้าแก้ไข
router.get('/edit-detail/:id', async (req, res) => {
    try {
        const projectId = req.params.id;

        // ดึงข้อมูล Project พร้อมข้อมูล Scope และ Coordinator
        const [project] = await db.query(`
            SELECT p.*, s.scope_name, s.department_id, 
                   u.user_name as coord_name, u.email as coord_email, u.phone_number as coord_phone
            FROM project_plans p
            JOIN scopes s ON p.scope_id = s.scope_id
            LEFT JOIN users u ON s.coordinator_id = u.user_id
            WHERE p.project_plan_id = ?`, [projectId]);

        if (!project || project.length === 0) {
            return res.status(404).send('ไม่พบโครงการ');
        }

        // ดึงข้อมูล GAP (operational_details)
        const [gaps] = await db.query(`
            SELECT detail, weight_percent as weight, status_code as status 
            FROM operational_details od
            JOIN status st ON od.status_id = st.status_id
            WHERE project_plan_id = ?`, [projectId]);

        // จัด Format ข้อมูลส่งกลับไปที่ Vue.js
        const result = {
            project_plan_id: project[0].project_plan_id,
            scope_name: project[0].scope_name,
            plan_name: project[0].project_plan_name,
            department_id: project[0].department_id,
            start_date: project[0].start_date,
            end_date: project[0].end_date,
            coordinator: {
                name: project[0].coord_name,
                email: project[0].coord_email,
                phone_number: project[0].coord_phone
            },
            gaps: gaps
        };

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. POST Update All-in-one (บันทึกข้อมูลทั้งหมด)
router.post('/update-all-in-one', upload.single('evidenceFile'), async (req, res) => {
    const project = JSON.parse(req.body.project); 
    const { scopeName, editReason } = req.body; 
    
    const adminId = req.user ? req.user.user_id : null; 

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // --- 1. ดึงข้อมูลเดิม (Before) เพื่อใช้ทำ Log เปรียบเทียบ ---
        const [oldData] = await connection.query(`
            SELECT p.project_plan_name, p.start_date, p.end_date, s.scope_name, s.department_id, s.scope_id
            FROM project_plans p
            JOIN scopes s ON p.scope_id = s.scope_id
            WHERE p.project_plan_id = ?`, [project.id]);

        if (oldData.length === 0) throw new Error('ไม่พบข้อมูลโครงการที่ต้องการแก้ไข');
        const before = oldData[0];

        // --- 2. บันทึกหัวข้อการเปลี่ยนแปลง (change_logs) ---
        const [logResult] = await connection.query(`
            INSERT INTO change_logs (user_id, scope_id, project_plan_id, department_id, change_type, change_date)
            VALUES (?, ?, ?, ?, 'update_project', NOW())`,
            [adminId, before.scope_id, project.id, project.department_id]);
        
        const logId = logResult.insertId;

        // ฟังก์ชันช่วยบันทึกรายละเอียดการเปลี่ยนแปลง (เปรียบเทียบค่า)
        const recordChange = async (fieldName, beforeVal, afterVal) => {
            let b = beforeVal ? String(beforeVal).trim() : '';
            let a = afterVal ? String(afterVal).trim() : '';

            // ถ้าเป็นฟิลด์วันที่ ให้จัดการ format ให้เหมือนกันก่อนเทียบ
            if (fieldName.includes('date') && beforeVal) {
                b = new Date(beforeVal).toISOString().split('T')[0];
            }

            if (b !== a) {
                await connection.query(`
                    INSERT INTO change_log_details (log_id, field_name, before_value, after_value)
                    VALUES (?, ?, ?, ?)`, [logId, fieldName, b, a]);
            }
        };

        // --- 3. บันทึก Log รายละเอียด (เปรียบเทียบทีละฟิลด์) ---
        await recordChange('plan_name', before.project_plan_name, project.projectName);
        await recordChange('scope_name', before.scope_name, scopeName);
        await recordChange('department_id', before.department_id, project.department_id);
        await recordChange('start_date', before.start_date, project.startDate);
        await recordChange('end_date', before.end_date, project.endDate);

        // --- 4. ค้นหา coordinator_id เพื่ออัปเดตข้อมูลผู้รายงาน ---
        const [scopeRow] = await connection.query(
            `SELECT coordinator_id FROM scopes WHERE scope_id = ?`, [before.scope_id]
        );
        const coordinatorId = scopeRow[0]?.coordinator_id;

        if (coordinatorId) {
            await connection.query(
                `UPDATE users SET user_name = ?, email = ?, phone_number = ? WHERE user_id = ?`,
                [project.coordinator.name, project.coordinator.email, project.coordinator.phone_number, coordinatorId]
            );
        }

        // --- 5. อัปเดตตาราง scopes ---
        await connection.query(`
            UPDATE scopes SET scope_name = ?, department_id = ? WHERE scope_id = ?`,
            [scopeName, project.department_id, before.scope_id]);

        // --- 6. อัปเดตตาราง project_plans ---
        await connection.query(`
            UPDATE project_plans 
            SET project_plan_name = ?, start_date = ?, end_date = ?
            WHERE project_plan_id = ?`,
            [project.projectName, project.startDate, project.endDate, project.id]);

        // --- 7. บันทึกเหตุผลการแก้ไข (edit_reasons) ---
        await connection.query(
            `INSERT INTO edit_reasons (ref_type, ref_id, reason_text) VALUES (?, ?, ?)`,
            ['project_plan', project.id, editReason]
        );

        // --- 8. บันทึกข้อมูลไฟล์หลักฐาน (attachments) ---
        if (req.file) {
            await connection.query(
                `INSERT INTO attachments (ref_type, ref_id, file_path, file_type) VALUES (?, ?, ?, ?)`,
                ['project_plan', project.id, req.file.path, req.file.mimetype]
            );
        }

        // --- 9. จัดการ GAP Analysis (ลบและ Insert ใหม่) ---
        await connection.query('DELETE FROM operational_details WHERE project_plan_id = ?', [project.id]);

        for (const gap of project.gaps) {
            const [statusRow] = await connection.query('SELECT status_id FROM status WHERE status_code = ?', [gap.status]);
            if (statusRow.length > 0) {
                await connection.query(`
                    INSERT INTO operational_details (project_plan_id, detail, weight_percent, status_id)
                    VALUES (?, ?, ?, ?)`,
                    [project.id, gap.detail, gap.weight, statusRow[0].status_id]);
            }
        }

        await connection.commit();
        res.json({ message: 'บันทึกข้อมูล หลักฐาน และประวัติการแก้ไขสำเร็จ' });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("❌ Database Error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

export default router;