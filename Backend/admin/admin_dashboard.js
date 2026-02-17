import { Router } from 'express'
import db from '../db.js'

const router = Router()

// 1. ดึงภาพรวมความคืบหน้า (Overall Progress)
router.get('/dashboard/overall-progress', async (req, res) => {
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


// 2. ดึงรายการ Task (รองรับการ Filter แบบช่วงวันที่ Start - End)
router.get('/dashboard/tasks', async (req, res) => {
  try {
    // รับค่า startDate และ endDate จาก Query String
    const { startDate, endDate } = req.query

    // ถ้าส่งมาแค่วันเดียว (startDate) ให้ถือว่า endDate คือวันเดียวกัน
    const start = startDate || null
    const end = endDate || startDate || null

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
        OR DATE(s.created_at) BETWEEN ? AND ?
      )
      ORDER BY s.created_at DESC
    `, [start, start, end])

    res.json(rows)
  } catch (err) {
    console.error('dashboard/tasks error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// 3. สรุปสถานะ Gap ทั้งหมด
router.get('/dashboard/gap-summary', async (req, res) => {
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

// 4. สถิติช่วงความคืบหน้า (Progress Distribution)
router.get('/dashboard/progress-range', async (req, res) => {
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

// 5. ข้อมูลกราฟสรุป Gap ที่ปิดได้ (แบ่งตาม วัน/สัปดาห์/เดือน/ปี)
router.get('/dashboard/gap-closed-chart', async (req, res) => {
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
    res.status(500).json({ message: 'Server error' })
  }
})

export default router