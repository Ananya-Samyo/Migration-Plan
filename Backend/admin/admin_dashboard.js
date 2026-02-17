import { Router } from 'express'
import db from '../db.js'
import { verifyToken } from '../middleware/auth.js' // 1. นำเข้า Middleware

const router = Router()

// สร้าง Middleware ย่อยสำหรับเช็คว่าเป็น Admin เท่านั้น
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'ปฏิเสธการเข้าถึง: สำหรับผู้ดูแลระบบเท่านั้น' });
  }
};

const STATUS_MAP = {
  in_progress: 'processing_gap',
  completed: 'complete_gap',
  acceptedGap: 'acceptable_gap'
}

/* ======================================================
   DASHBOARD ROUTES (Protected by verifyToken & isAdmin)
====================================================== */

// ใช้ทั้ง verifyToken (เช็คว่า login ไหม) และ isAdmin (เช็คว่าเป็น admin ไหม)
router.get('/dashboard/overall-progress', verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        COUNT(*) AS total_scopes,
        IFNULL(AVG(progress_percent), 0) AS avg_progress
      FROM scopes
    `)

    res.json({
      total: rows[0].total_scopes,
      progress: Math.round(rows[0].avg_progress)
    })
  } catch (err) {
    console.error('overall-progress error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/dashboard/tasks', verifyToken, isAdmin, async (req, res) => {
  try {
    const { date } = req.query

    const [rows] = await db.query(`
      SELECT
        s.scope_id        AS id,
        s.scope_name      AS title,
        st.status_code    AS status,
        s.progress_percent,
        s.created_at      AS startDate
      FROM scopes s
      JOIN status st ON s.status_id = st.status_id
      WHERE (
        ? IS NULL
        OR DATE(s.created_at) = ?
      )
      ORDER BY s.created_at DESC
    `, [date || null, date || null]) // ป้องกันค่า undefined

    res.json(rows)
  } catch (err) {
    console.error('dashboard/tasks error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/dashboard/gap-summary', verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        COUNT(DISTINCT s.scope_id) AS total,
        COUNT(DISTINCT CASE WHEN st.status_code = 'processing_gap' THEN s.scope_id END) AS open_gap,
        COUNT(DISTINCT CASE WHEN st.status_code = 'complete_gap' THEN s.scope_id END)   AS closed_gap,
        COUNT(DISTINCT CASE WHEN st.status_code = 'acceptable_gap' THEN s.scope_id END) AS accepted_gap
      FROM scopes s
      JOIN status st ON s.status_id = st.status_id
    `)

    res.json(rows[0])
  } catch (err) {
    console.error('gap-summary error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/dashboard/progress-range', verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        IFNULL(SUM(progress_percent BETWEEN 0  AND 30), 0)  AS low,
        IFNULL(SUM(progress_percent BETWEEN 31 AND 60), 0)  AS mid,
        IFNULL(SUM(progress_percent BETWEEN 61 AND 90), 0)  AS high,
        IFNULL(SUM(progress_percent = 100), 0)              AS done
      FROM scopes
    `)

    res.json(rows[0])
  } catch (err) {
    console.error('progress-range error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/dashboard/gap-closed-chart', verifyToken, isAdmin, async (req, res) => {
  try {
    const { mode = 'day' } = req.query

    let groupBy = ''
    let label = ''

    switch (mode) {
      case 'week':
        groupBy = `YEARWEEK(s.created_at, 1)`
        label = `CONCAT('W', WEEK(s.created_at, 1))`
        break
      case 'month':
        groupBy = `DATE_FORMAT(s.created_at, '%Y-%m')`
        label = `DATE_FORMAT(s.created_at, '%m/%Y')`
        break
      case 'year':
        groupBy = `YEAR(s.created_at)`
        label = `YEAR(s.created_at)`
        break
      default:
        groupBy = `DATE(s.created_at)`
        label = `DATE_FORMAT(s.created_at, '%d/%m')`
    }

    const [rows] = await db.query(`
      SELECT
        ${label} AS label,
        COUNT(*) AS total
      FROM scopes s
      JOIN status st ON s.status_id = st.status_id
      WHERE st.status_code = 'complete_gap'
      GROUP BY ${groupBy}
      ORDER BY ${groupBy}
    `)

    res.json(rows)
  } catch (err) {
    console.error('gap-closed-chart error:', err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

export default router