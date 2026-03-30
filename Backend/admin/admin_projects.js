import { Router } from 'express';
import db from '../db.js'; // ปรับ path ให้ตรงกับไฟล์ db ของคุณ
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);
router.use(isAdmin);

// ฟังก์ชันช่วยเหลือสำหรับ หา/สร้าง ผู้ใช้งาน
async function getOrCreateUser(conn, userObj, roleStr, deptId) {
    if (!userObj || !userObj.email || !userObj.name) return null;

    // ค้นหาจาก Email ก่อน
    const [rows] = await conn.query(`SELECT user_id FROM users WHERE email = ?`, [userObj.email]);
    if (rows.length > 0) return rows[0].user_id;

    // ถ้าไม่มีให้สร้างใหม่
    const [ins] = await conn.query(
        `INSERT INTO users (user_name, email, phone_number, role, department_id) VALUES (?, ?, ?, ?, ?)`,
        [userObj.name, userObj.email, userObj.phone_number || null, roleStr, deptId || null]
    );
    return ins.insertId;
}

// ================= POST: บันทึกข้อมูลแผนงาน (Step 1) =================
router.post('/projects', async (req, res) => {
    const { scopeName, projects } = req.body;

    if (!scopeName || !projects || projects.length === 0) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. ดึง department_id และวันที่จากแผนงานแรกมาเป็นของ scope หลัก
        const firstProject = projects[0];
        const primaryDeptId = firstProject.department_id || null;

        // 🌟 ดึงวันที่มาด้วย (ถ้า Frontend ส่งมาในชื่อ startDate, endDate)
        const scopeStartDate = firstProject.startDate || null;
        const scopeEndDate = firstProject.endDate || null;

        // 2. สร้าง Scope (status_id = 1 คือ กำลังดำเนินการ)
        // 🌟 เพิ่ม start_date, end_date เข้าไปในตาราง scopes
        const [scopeResult] = await conn.query(
            `INSERT INTO scopes (scope_name, department_id, status_id, progress_percent, start_date, end_date) 
             VALUES (?, ?, 1, 0, ?, ?)`,
            [scopeName, primaryDeptId, scopeStartDate, scopeEndDate]
        );
        const scopeId = scopeResult.insertId;

        let isFirstProject = true;

        const savedProjects = [];

        // 3. วนลูปสร้าง Project Plans ทีละแผนงาน
        for (const proj of projects) {
            const deptId = proj.department_id || null;
            const projStartDate = proj.start_date || proj.startDate || null;
            const projEndDate = proj.end_date || proj.endDate || null;

            const [planIns] = await conn.query(
        `INSERT INTO project_plans (scope_id, project_plan_name, start_date, end_date, progress_percent, status) 
         VALUES (?, ?, ?, ?, 0, 'open')`,
        [scopeId, proj.projectName, projStartDate, projEndDate] 
    );
    
    const planId = planIns.insertId;

            savedProjects.push({
                projectName: proj.projectName,
                project_plan_id: planId
            });

            // 3.2 จัดการ Coordinator (ผู้ประสานงานหลัก)
            if (proj.coordinator) {
                const coordId = await getOrCreateUser(conn, proj.coordinator, 'coordinator', deptId);
                if (coordId) {
                    await conn.query(
                        `INSERT INTO working_groups (scope_id, user_id, role) VALUES (?, ?, 'Coordinator')`,
                        [scopeId, coordId]
                    );

                    if (isFirstProject) {
                        await conn.query(`UPDATE scopes SET coordinator_id = ? WHERE scope_id = ?`, [coordId, scopeId]);
                        isFirstProject = false;
                    }
                }
            }

            // 3.3 จัดการ Team Members (คณะทำงาน)
            if (proj.teamMembers && proj.teamMembers.length > 0) {
                for (const member of proj.teamMembers) {
                    const memberId = await getOrCreateUser(conn, member, 'user', deptId);
                    if (memberId) {
                        await conn.query(
                            `INSERT INTO working_groups (scope_id, user_id, role) VALUES (?, ?, 'Member')`,
                            [scopeId, memberId]
                        );
                    }
                }
            }

            // 3.4 จัดการ GAPs (operational_details)
            if (proj.gaps && proj.gaps.length > 0) {
                for (const gap of proj.gaps) {
                    if (gap.detail && gap.detail.trim() !== '') {
                        await conn.query(
                            `INSERT INTO operational_details (project_plan_id, detail, weight_percent, progress_percent, status_id) 
                             VALUES (?, ?, 0, 0, 1)`,
                            [planId, gap.detail]
                        );
                    }
                }
            }
        }

        // Commit ข้อมูลทั้งหมดลง Database
        await conn.commit();

        res.json({
            success: true,
            message: 'บันทึกสำเร็จ',
            scopeId: scopeId,
            projects: savedProjects
        });

    } catch (error) {
        await conn.rollback();
        console.error('Create Project Error:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
        conn.release();
    }
});

export default router;