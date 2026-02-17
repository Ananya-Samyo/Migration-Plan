import { Router } from 'express'
import db from '../db.js'
import { verifyToken } from '../middleware/auth.js' // 1. นำเข้า Middleware

const userDashboardRouter = Router()

/**
 * SQL Filter: เช็คว่าเป็นเจ้าของงาน (Coordinator) หรือเป็นสมาชิกในทีม (Working Group)
 */
const USER_FILTER_SQL = `(s.coordinator_id = ? OR EXISTS (
    SELECT 1 FROM working_groups wg 
    WHERE wg.scope_id = s.scope_id AND wg.user_id = ?
  ))`

/* ======================================================
   USER DASHBOARD ROUTES (Protected by verifyToken)
====================================================== */

// 1. ดูภาพรวมความคืบหน้า (Overall Progress)
// ใช้ verifyToken คั่นกลาง เพื่อตรวจสอบสิทธิ์ก่อนเข้าถึงข้อมูล
userDashboardRouter.get('/user-dashboard/overall-progress', verifyToken, async (req, res) => {
  try {
    // 2. ดึง user_id จาก req.user (ที่ได้จาก Token) แทนการรับผ่าน query เพื่อความปลอดภัย
    const userId = req.user.user_id; 
    const { startDate, endDate } = req.query;

    const dateCondition = (startDate && endDate) ? `AND DATE(s.created_at) BETWEEN ? AND ?` : '';
    const params = (startDate && endDate) 
      ? [userId, userId, startDate, endDate] 
      : [userId, userId];

    const [rows] = await db.query(`
      SELECT
        COUNT(DISTINCT s.scope_id) AS total_scopes,
        IFNULL(AVG(s.progress_percent), 0) AS avg_progress
      FROM scopes s
      WHERE ${USER_FILTER_SQL}
      ${dateCondition}
    `, params)

    res.json({
      total: rows[0].total_scopes,
      progress: Math.round(rows[0].avg_progress)
    })
  } catch (err) {
    console.error('overall-progress error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// 2. ดึงรายการงาน (Tasks List)
userDashboardRouter.get('/user-dashboard/tasks', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { startDate, endDate } = req.query;

    const dateCondition = (startDate && endDate) ? `AND DATE(s.created_at) BETWEEN ? AND ?` : '';
    const params = (startDate && endDate) 
      ? [userId, userId, startDate, endDate] 
      : [userId, userId];

    const [rows] = await db.query(`
      SELECT DISTINCT
        s.scope_id         AS id,
        s.scope_name       AS title,
        st.status_code     AS status,
        s.progress_percent,
        s.created_at       AS startDate
      FROM scopes s
      JOIN status st ON s.status_id = st.status_id
      WHERE ${USER_FILTER_SQL}
      ${dateCondition}
      ORDER BY s.created_at DESC
    `, params)

    res.json(rows)
  } catch (err) {
    console.error('dashboard/tasks error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// 3. สรุปจำนวน Gap (Summary Cards)
userDashboardRouter.get('/user-dashboard/gap-summary', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { startDate, endDate } = req.query;

    const dateCondition = (startDate && endDate) ? `AND DATE(s.created_at) BETWEEN ? AND ?` : '';
    const params = (startDate && endDate) 
      ? [userId, userId, startDate, endDate] 
      : [userId, userId];

    const [rows] = await db.query(`
      SELECT
        COUNT(DISTINCT s.scope_id) AS total,
        COUNT(DISTINCT CASE WHEN st.status_code = 'processing_gap' THEN s.scope_id END) AS open_gap,
        COUNT(DISTINCT CASE WHEN st.status_code = 'complete_gap' THEN s.scope_id END)   AS closed_gap,
        COUNT(DISTINCT CASE WHEN st.status_code = 'acceptable_gap' THEN s.scope_id END) AS accepted_gap
      FROM scopes s
      JOIN status st ON s.status_id = st.status_id
      WHERE ${USER_FILTER_SQL}
      ${dateCondition}
    `, params)

    res.json(rows[0])
  } catch (err) {
    console.error('gap-summary error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// 4. แบ่งกลุ่มช่วงความคืบหน้า (Progress Range)
userDashboardRouter.get('/user-dashboard/progress-range', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { startDate, endDate } = req.query;

    const dateCondition = (startDate && endDate) ? `AND DATE(s.created_at) BETWEEN ? AND ?` : '';
    const params = (startDate && endDate) 
      ? [userId, userId, startDate, endDate] 
      : [userId, userId];

    const [rows] = await db.query(`
      SELECT
        COUNT(DISTINCT CASE WHEN s.progress_percent BETWEEN 0 AND 30 THEN s.scope_id END) AS low,
        COUNT(DISTINCT CASE WHEN s.progress_percent BETWEEN 31 AND 60 THEN s.scope_id END) AS mid,
        COUNT(DISTINCT CASE WHEN s.progress_percent BETWEEN 61 AND 90 THEN s.scope_id END) AS high,
        COUNT(DISTINCT CASE WHEN s.progress_percent = 100 THEN s.scope_id END) AS done
      FROM scopes s
      WHERE ${USER_FILTER_SQL}
      ${dateCondition}
    `, params)

    res.json(rows[0])
  } catch (err) {
    console.error('progress-range error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// 5. ข้อมูลกราฟแสดงจำนวนงานที่ปิดได้ (Line Chart)
userDashboardRouter.get('/user-dashboard/gap-closed-chart', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { startDate, endDate, mode = 'day' } = req.query;
    
    const dateCondition = (startDate && endDate) ? `AND DATE(s.created_at) BETWEEN ? AND ?` : '';
    const params = (startDate && endDate) 
      ? [userId, userId, startDate, endDate] 
      : [userId, userId];

    let groupBy = ''; let label = '';
    switch (mode) {
      case 'week': 
        groupBy = `YEARWEEK(s.created_at, 1)`; 
        label = `CONCAT('W', WEEK(s.created_at, 1))`; 
        break;
      case 'month': 
        groupBy = `DATE_FORMAT(s.created_at, '%Y-%m')`; 
        label = `DATE_FORMAT(s.created_at, '%m/%Y')`; 
        break;
      case 'year': 
        groupBy = `YEAR(s.created_at)`; 
        label = `YEAR(s.created_at)`; 
        break;
      default: 
        groupBy = `DATE(s.created_at)`; 
        label = `DATE_FORMAT(s.created_at, '%d/%m')`;
    }

    const [rows] = await db.query(`
      SELECT
        ${label} AS label,
        COUNT(DISTINCT s.scope_id) AS total
      FROM scopes s
      JOIN status st ON s.status_id = st.status_id
      WHERE st.status_code = 'complete_gap'
        AND ${USER_FILTER_SQL}
        ${dateCondition}
      GROUP BY ${groupBy}
      ORDER BY ${groupBy} ASC
    `, params)

    res.json(rows)
  } catch (err) {
    console.error('gap-closed-chart error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default userDashboardRouter