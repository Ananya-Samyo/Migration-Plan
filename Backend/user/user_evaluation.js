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

// ==========================================
// 1. GET: ดึงข้อมูลการประเมิน
// ==========================================
router.get('/evaluations/:id', verifyToken, async (req, res) => {
    const projectPlanId = req.params.id;

    try {
        // ดึงข้อมูลพื้นฐานของโครงการและผู้รับผิดชอบ
        const [projectInfo] = await db.query(
            `SELECT 
                s.scope_id, 
        s.scope_name, 
        p.project_plan_name,       
        u.user_name AS coordinator_name,
        u.email, 
        u.phone_number,
        d.department_id,     
        d.department_name
     FROM project_plans p 
     LEFT JOIN scopes s ON p.scope_id = s.scope_id 
     LEFT JOIN users u ON s.coordinator_id = u.user_id 
     LEFT JOIN departments d ON u.department_id = d.department_id
     WHERE p.project_plan_id = ?`,
            [projectPlanId]
        );

        if (projectInfo.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลโครงการ' });
        }

        const info = projectInfo[0];

        // ดึงข้อมูลจากตาราง plan_evaluations
        const [evalRows] = await db.query(
            `SELECT * FROM plan_evaluations WHERE project_plan_id = ? LIMIT 1`,
            [projectPlanId]
        );

        // ฟังก์ชันช่วยจัดการ JSON Parse ป้องกัน Error กรณีข้อมูลใน DB ไม่ใช่ JSON
        const safeParse = (data) => {
            if (!data) return [];
            if (typeof data !== 'string') return Array.isArray(data) ? data : [data];
            try {
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                // ถ้าไม่ใช่ JSON (เช่น ข้อมูลเก่าที่ใช้ ||) ให้แยกด้วย || หรือส่งเป็นค่าเดียวใน Array
                if (data.includes('||')) return [data];
                return [data];
            }
        };

        let evaluationsArray = [];

        if (evalRows.length === 0) {
            // กรณีใหม่กิ๊ก ยังไม่มีการประเมิน ส่งโครงสร้างว่างไปให้ Frontend
            evaluationsArray = [{
                objective: '',
                before_plan: '',
                expected_outcome: ''
            }];
        } else {
            const dbData = evalRows[0];
            const objectives = safeParse(dbData.objective);
            const beforePlans = safeParse(dbData.before_plan);
            const expectedOutcomes = safeParse(dbData.expected_outcome);

            // รวมข้อมูลกลับเป็น Array ของ Object เพื่อให้ Frontend ใช้ง่าย (v-for)
            const maxLength = Math.max(objectives.length, beforePlans.length, expectedOutcomes.length, 1);
            for (let i = 0; i < maxLength; i++) {
                evaluationsArray.push({
                    objective: objectives[i] || '',
                    before_plan: beforePlans[i] || '',
                    expected_outcome: expectedOutcomes[i] || ''
                });
            }
        }

        // ส่งข้อมูลกลับไปหา Frontend
        return res.status(200).json({
            // ข้อมูลฝั่งแผนงาน (ReadOnly)
            scope_id: info.scope_id,
            scope_name: info.scope_name,
            coordinator_name: info.coordinator_name,
            department_name: info.department_name,

            // ข้อมูลฝั่งประเมิน (Editable)
            project_status: evalRows[0]?.project_status || 'processing',
            evaluation_status: evalRows[0]?.evaluation_status || 'pass',
            actual_outcome: evalRows[0]?.actual_outcome || '',
            recommendation: evalRows[0]?.recommendation || '',
            problem: evalRows[0]?.problem || '',
            evaluations: evaluationsArray // ส่งตัวนี้ไปทำ v-for ในหน้า User_Evaluation
        });

    } catch (error) {
        console.error('Error fetching evaluation:', error);
        return res.status(500).json({ message: 'Server Error: ดึงข้อมูลไม่สำเร็จ' });
    }
});

// ==========================================
// 2. POST: บันทึก/อัปเดตข้อมูล (Update Logic)
// ==========================================
router.post('/evaluation-update', verifyToken, async (req, res) => {
    const {
        project_plan_id,
        project_status,
        evaluation_status,
        actual_outcome,
        recommendation,
        problem, // ถ้ารองรับฟิลด์ปัญหาด้วย
        evaluations // นี่คือ Array [{objective, before_plan, expected_outcome}, ...]
    } = req.body;

    try {
        // 1. หา scope_id มาเก็บไว้ก่อน (DB บังคับใช้)
        const [proj] = await db.query(
            `SELECT scope_id FROM project_plans WHERE project_plan_id = ?`,
            [project_plan_id]
        );

        if (proj.length === 0) return res.status(400).json({ message: 'ไม่พบ ID แผนงานที่ระบุ' });
        const scope_id = proj[0].scope_id;

        // 2. รวมข้อมูลจาก Array แยกเข้าเป็น JSON String รายคอลัมน์
        const objectiveJSON = JSON.stringify(evaluations.map(item => item.objective || ''));
        const beforePlanJSON = JSON.stringify(evaluations.map(item => item.before_plan || ''));
        const expectedOutcomeJSON = JSON.stringify(evaluations.map(item => item.expected_outcome || ''));

        // 3. ตรวจสอบว่าเคยมีข้อมูลในตาราง plan_evaluations หรือยัง
        const [checkExist] = await db.query(
            `SELECT evaluation_id FROM plan_evaluations WHERE project_plan_id = ?`,
            [project_plan_id]
        );

        if (checkExist.length > 0) {
            // --- กรณีมีแล้วให้ UPDATE ---
            await db.query(
                `UPDATE plan_evaluations 
                 SET scope_id = ?, 
                     objective = ?, 
                     before_plan = ?, 
                     expected_outcome = ?, 
                     actual_outcome = ?, 
                     recommendation = ?, 
                     project_status = ?, 
                     evaluation_status = ?,
                     problem = ?
                 WHERE project_plan_id = ?`,
                [
                    scope_id, objectiveJSON, beforePlanJSON, expectedOutcomeJSON,
                    actual_outcome, recommendation, project_status, evaluation_status,
                    problem || '', project_plan_id
                ]
            );
        } else {
            // --- กรณีใหม่ให้ INSERT ---
            await db.query(
                `INSERT INTO plan_evaluations 
                 (project_plan_id, scope_id, objective, before_plan, expected_outcome, 
                  actual_outcome, recommendation, project_status, evaluation_status, problem) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    project_plan_id, scope_id, objectiveJSON, beforePlanJSON, expectedOutcomeJSON,
                    actual_outcome, recommendation, project_status, evaluation_status, problem || ''
                ]
            );
        }

        return res.status(200).json({ message: 'บันทึกข้อมูลการประเมินสำเร็จ' });

    } catch (error) {
        console.error('Error saving evaluation:', error);
        return res.status(500).json({ message: 'Server Error: บันทึกไม่สำเร็จ' });
    }
});

export default router;