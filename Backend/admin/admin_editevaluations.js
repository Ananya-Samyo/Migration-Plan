import { Router } from 'express'
import pool from '../db.js' 

const router = Router()

// ==========================================
// 1. GET: ดึงข้อมูลการประเมินเพื่อแสดงผลบนฟอร์ม
// ==========================================
router.get('/evaluation/:id', async (req, res) => {
    const projectPlanId = req.params.id;

    try {
        const [projectInfo] = await pool.query(
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

        // เช็คก่อนว่าพบโครงการไหม ป้องกัน Error [0]
        if (projectInfo.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลโครงการ' });
        }

        const info = projectInfo[0];

        // 2. ดึงข้อมูลการประเมิน
        const [evalRows] = await pool.query(
            `SELECT * FROM plan_evaluations WHERE project_plan_id = ? LIMIT 1`,
            [projectPlanId]
        );

        const safeParse = (data) => {
            if (!data) return [];
            if (typeof data !== 'string') return Array.isArray(data) ? data : [data];
            try {
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                return [data];
            }
        };

        let evaluationsArray = [];

        if (evalRows.length === 0) {
            // กรณีไม่มีข้อมูลประเมิน ส่ง Row เปล่าที่มีโครงสร้างครบถ้วน
            evaluationsArray = [{
                evaluation_id: null,
                objective: '',
                before_plan: '',
                expected_outcome: ''
            }];
        } else {
            const dbData = evalRows[0];
            const objectives = safeParse(dbData.objective);
            const beforePlans = safeParse(dbData.before_plan);
            const expectedOutcomes = safeParse(dbData.expected_outcome);

            const maxLength = Math.max(objectives.length, beforePlans.length, expectedOutcomes.length, 1);

            for (let i = 0; i < maxLength; i++) {
                evaluationsArray.push({
                    evaluation_id: dbData.evaluation_id,
                    objective: objectives[i] || '',
                    before_plan: beforePlans[i] || '',
                    expected_outcome: expectedOutcomes[i] || ''
                });
            }
        }

        // 3. ส่ง JSON กลับไป (ใช้ info ตัวแปรที่เราเช็คแล้วว่ามีค่า)
        return res.status(200).json({
            scope_id: evalRows[0]?.scope_id || info.scope_id,
            scope_name: info.scope_name || '',
            coordinator_name: info.coordinator_name || '',
            coordinator_email: info.email || '',
            coordinator_phone: info.phone_number || '',
            department_id: info.department_id || '',
            department_name: info.department_name || '',
            project_status: evalRows[0]?.project_status || 'processing',
            evaluation_status: evalRows[0]?.evaluation_status || '',
            actual_outcome: evalRows[0]?.actual_outcome || '',
            recommendation: evalRows[0]?.recommendation || '',
            problem: evalRows[0]?.problem || '',
            evaluations: evaluationsArray
        });

    } catch (error) {
        console.error('Error fetching evaluation:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเซิร์ฟเวอร์' });
    }
});

// ==========================================
// 2. POST: บันทึก/อัปเดตข้อมูลการประเมิน
// ==========================================
router.post('/evaluation-update', async (req, res) => {
    const {
        project_plan_id,
        project_status,
        evaluation_status,
        actual_outcome,
        recommendation,
        evaluations
    } = req.body;

    try {
        // ต้องหา scope_id ของ project_plan_id นี้ก่อน เพื่อไปใส่ในตาราง plan_evaluations
        const [proj] = await pool.query(
            `SELECT scope_id FROM project_plans WHERE project_plan_id = ?`,
            [project_plan_id]
        );
        const scope_id = proj.length > 0 ? proj[0].scope_id : null;

        if (!scope_id) {
            return res.status(400).json({ message: 'ไม่พบ scope_id ของโครงการนี้' });
        }

        // แปลง Array แยกออกเป็น JSON String
        const objectiveJSON = JSON.stringify(evaluations.map(item => item.objective || ''));
        const beforePlanJSON = JSON.stringify(evaluations.map(item => item.before_plan || ''));
        const expectedOutcomeJSON = JSON.stringify(evaluations.map(item => item.expected_outcome || ''));

        // ตรวจสอบว่ามี record แล้วหรือยัง
        const [checkExist] = await pool.query(
            `SELECT evaluation_id FROM plan_evaluations WHERE project_plan_id = ?`,
            [project_plan_id]
        );

        if (checkExist.length > 0) {
            // Update ข้อมูลเดิม
            await pool.query(
                `UPDATE plan_evaluations 
                 SET scope_id = ?, 
                     objective = ?, 
                     before_plan = ?, 
                     expected_outcome = ?, 
                     actual_outcome = ?, 
                     recommendation = ?, 
                     project_status = ?, 
                     evaluation_status = ?
                 WHERE project_plan_id = ?`,
                [
                    scope_id,
                    objectiveJSON,
                    beforePlanJSON,
                    expectedOutcomeJSON,
                    actual_outcome,
                    recommendation,
                    project_status,
                    evaluation_status,
                    project_plan_id
                ]
            );
        } else {
            // Insert ข้อมูลใหม่ (เพิ่ม scope_id ตามที่ DB ต้องการ)
            await pool.query(
                `INSERT INTO plan_evaluations 
                 (project_plan_id, scope_id, objective, before_plan, expected_outcome, actual_outcome, recommendation, project_status, evaluation_status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    project_plan_id,
                    scope_id,  // ใส่ตัวแปร scope_id ที่ดึงมา
                    objectiveJSON,
                    beforePlanJSON,
                    expectedOutcomeJSON,
                    actual_outcome,
                    recommendation,
                    project_status,
                    evaluation_status
                ]
            );
        }

        return res.status(200).json({ message: 'บันทึกข้อมูลการประเมินสำเร็จ' });

    } catch (error) {
        console.error('Error updating evaluation:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
});

export default router;