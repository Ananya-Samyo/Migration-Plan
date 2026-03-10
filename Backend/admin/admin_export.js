import { Router } from 'express'
import db from '../db.js'
// import { verifyToken } from '../middleware/auth.js'

const router = Router()

router.get('/project-summary', async (req, res) => {
  try {
    const sql = `
    SELECT 
        pp.project_plan_id AS id,
        s.scope_name AS title,  
        COALESCE(YEAR(s.start_date) + 543, '-') AS year,
        pp.progress_percent AS progress,
        st.status_label AS statusText
    FROM project_plans pp
    LEFT JOIN scopes s ON pp.scope_id = s.scope_id
    LEFT JOIN status st ON pp.status_id = st.status_id
    WHERE s.scope_name IS NOT NULL 
    ORDER BY year DESC, pp.project_plan_id ASC
`;
    // ✅ ใช้ db.query หรือ db.execute (ตามที่คุณ config ไว้)
    const [rows] = await db.query(sql);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ดึงข้อมูล GAP แยกตามกลุ่ม Scope (รับค่า scopeIds ที่เลือกจากหน้า 1)
router.get('/gap-analysis', async (req, res) => {
  try {
    const { scopeIds } = req.query;

    // ถ้าไม่มีการเลือก scope อะไรมาเลย ให้ส่งอาร์เรย์ว่างกลับไป
    if (!scopeIds) {
      return res.json([]);
    }

    // แปลง string "1,2,3" เป็น array
    const ids = scopeIds.split(',').map(Number);

    // ใช้ SQL JOIN ดึงข้อมูล Scope และ Project_Plans
    const query = `
      SELECT 
        s.scope_id, 
        s.scope_name,
        p.project_plan_id, 
        p.project_plan_name, 
        p.start_date,  
        p.progress_percent, 
        st.status_code
      FROM project_plans p
      JOIN scopes s ON p.scope_id = s.scope_id 
      LEFT JOIN status st ON p.status_id = st.status_id
      WHERE p.project_plan_id IN (?) 
      ORDER BY s.scope_id, p.project_plan_id;
    `;

    const [rows] = await db.query(query, [ids]);

    // จัดกลุ่มข้อมูล (Group By) ตาม Scope
    const gapGroups = [];
    const scopeMap = new Map();

    rows.forEach(row => {
      // ถ้ายังไม่มีกลุ่ม Scope นี้ใน Map ให้สร้างใหม่
      if (!scopeMap.has(row.scope_id)) {
        const newGroup = {
          taskId: row.scope_id,
          taskName: row.scope_name,
          gaps: []
        };
        scopeMap.set(row.scope_id, newGroup);
        gapGroups.push(newGroup);
      }

      // ถ้า Scope นี้มี GAP (project_plan) อยู่ข้างใน ให้เพิ่มเข้าไป
      if (row.project_plan_id) {
        // แปลงปี ค.ศ. เป็น พ.ศ.
        let yearThai = '-';
        if (row.start_date && row.start_date !== '0000-00-00') {
          const date = new Date(row.start_date);
          yearThai = (date.getFullYear() + 543).toString();
        }

        // แปลงสถานะจาก Code เป็นคำอ่าน
        let statusText = 'pending';
        if (row.status_code === 'complete_gap' || row.status_code === 'acceptable_gap') {
          statusText = 'closed';
        }

        scopeMap.get(row.scope_id).gaps.push({
          id: row.project_plan_id,
          gapName: row.project_plan_name,
          year: yearThai,
          progress: parseFloat(row.progress_percent) || 0,
          status: statusText,
          selected: true,
          year: yearThai
        });
      }
    });

    res.json(gapGroups);

  } catch (error) {
    console.error("Error fetching gap analysis:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;