import { Router } from 'express'
import pool from '../db.js' // หรือ import db from '../db.js' (ให้ใช้ชื่อตรงกับในไฟล์ db.js ของคุณ)

const router = Router()

// ==========================================
// 1. GET: ดึงข้อมูลการประเมินเพื่อแสดงผลบนฟอร์ม
// ==========================================
router.get('/evaluation/:id', async (req, res) => {
    const projectPlanId = req.params.id;

    try {
        // 1. ดึงข้อมูลพื้นฐาน โดย JOIN 3 ตาราง (project_plans -> scopes -> users)
        const [projectInfo] = await pool.query(
            `SELECT 
                s.scope_id, 
                s.scope_name, 
                u.user_name AS coordinator_name 
             FROM project_plans p 
             LEFT JOIN scopes s ON p.scope_id = s.scope_id 
             LEFT JOIN users u ON s.coordinator_id = u.user_id 
             WHERE p.project_plan_id = ?`,
            [projectPlanId]
        );

        let scopeId = null;
        let scopeName = '';
        let coordinatorName = '';

        if (projectInfo.length > 0) {
            scopeId = projectInfo[0].scope_id;
            scopeName = projectInfo[0].scope_name || '';
            coordinatorName = projectInfo[0].coordinator_name || '';
        }

        // 2. ดึงข้อมูลการประเมินจากตาราง plan_evaluations
        const [evalRows] = await pool.query(
            `SELECT * FROM plan_evaluations WHERE project_plan_id = ? LIMIT 1`,
            [projectPlanId]
        );

        // กรณีที่ยังไม่เคยประเมินเลย
        if (evalRows.length === 0) {
            return res.status(200).json({ 
                scope_id: scopeId,                // ส่งกลับไปเพื่อใช้ตอนบันทึก
                scope_name: scopeName,            
                coordinator_name: coordinatorName,  
                project_status: 'processing',
                evaluation_status: '',
                actual_outcome: '',
                recommendation: '',
                evaluations: [
                    { evaluation_id: null, objective: '', before_plan: '', expected_outcome: '' }
                ]
            });
        }

        // กรณีเคยมีข้อมูลประเมินแล้ว
        const dbData = evalRows[0];
        const objectives = typeof dbData.objective === 'string' ? JSON.parse(dbData.objective || '[]') : (dbData.objective || []);
        const beforePlans = typeof dbData.before_plan === 'string' ? JSON.parse(dbData.before_plan || '[]') : (dbData.before_plan || []);
        const expectedOutcomes = typeof dbData.expected_outcome === 'string' ? JSON.parse(dbData.expected_outcome || '[]') : (dbData.expected_outcome || []);

        const evaluationsArray = [];
        const maxLength = Math.max(objectives.length, beforePlans.length, expectedOutcomes.length, 1);

        for (let i = 0; i < maxLength; i++) {
            evaluationsArray.push({
                evaluation_id: dbData.evaluation_id,
                objective: objectives[i] || '',
                before_plan: beforePlans[i] || '',
                expected_outcome: expectedOutcomes[i] || ''
            });
        }

        return res.status(200).json({
            scope_id: dbData.scope_id || scopeId, // ใช้ของ eval ถ้ามี หรือใช้ของ project
            scope_name: scopeName,               
            coordinator_name: coordinatorName,   
            project_status: dbData.project_status || 'processing',
            evaluation_status: dbData.evaluation_status || '',
            actual_outcome: dbData.actual_outcome || '',
            recommendation: dbData.recommendation || '',
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