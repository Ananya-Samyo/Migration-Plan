import { Router } from 'express'
import db from '../db.js'

const router = Router()

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
router.post('/update-all-in-one', async (req, res) => {
    const { project, scopeName } = req.body; 
    let connection;

    try {
        connection = await db.getConnection(); 
        await connection.beginTransaction();

        await connection.query(`
            UPDATE scopes s
            JOIN project_plans p ON s.scope_id = p.scope_id
            SET s.scope_name = ?
            WHERE p.project_plan_id = ?`, 
            [scopeName, project.id]);

        // 2. อัปเดตตาราง Project Plans (ชื่อแผนงาน, วันที่, กอง)
        await connection.query(`
            UPDATE project_plans 
            SET project_plan_name = ?, start_date = ?, end_date = ?, department_id = ?
            WHERE project_plan_id = ?`, 
            [project.projectName, project.startDate, project.endDate, project.department_id, project.id]);

        // 3. จัดการ GAP Analysis (ลบแล้วเพิ่มใหม่เหมือนเดิม)
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
        res.json({ message: 'บันทึกข้อมูลสำเร็จ' });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

export default router;