import { Router } from 'express'
import db from '../db.js'
import { createClient } from 'redis'

const router = Router()

/* =========================================
   1. SETUP REDIS CLIENT
   ========================================= */
const redisClient = createClient({
    url: 'redis://redis:6379' 
})

redisClient.on('error', (err) => console.error('Redis Client Error', err))

// เชื่อมต่อ Redis ทันทีเมื่อ Start App (Node 18+ รองรับ Top-level await)
await redisClient.connect()

/* =========================================
   2. HELPERS
   ========================================= */

// สร้าง Key สำหรับ Cache โดยแยกตาม URL และ Query Params เพื่อให้ Filter ทำงานแยกกัน
const getCacheKey = (req) => {
    const path = req.originalUrl || req.url
    return `dashboard:${path}`
}

// จัดการพารามิเตอร์สำหรับ SQL
const getFilterParams = (query) => {
    const { startDate, endDate, year } = query
    const start = startDate && startDate !== '' ? startDate : null
    const end = endDate && endDate !== '' ? endDate : null
    const y = year && year !== 'all' ? year : null
    return [start, start, end, y, y]
}

// ตั้งค่าเวลาหมดอายุของ Cache (หน่วยเป็นวินาที)
const CACHE_TTL = 300 // 5 นาที (เหมาะสำหรับ Dashboard สถิติ)

/* =========================================
   3. ROUTES
   ========================================= */

// 1. ดึงภาพรวมความคืบหน้า (Overall Progress)
router.get('/dashboard/overall-progress', async (req, res) => {
    const cacheKey = getCacheKey(req)
    try {
        const cachedData = await redisClient.get(cacheKey)
        if (cachedData) return res.json(JSON.parse(cachedData))

        const params = getFilterParams(req.query)
        const [rows] = await db.query(`
            SELECT 
                COUNT(*) AS total_scopes,
                IFNULL(AVG(progress_percent), 0) AS avg_progress
            FROM scopes
            WHERE (? IS NULL OR DATE(created_at) BETWEEN ? AND ?)
                AND (? IS NULL OR YEAR(created_at) = ?)
        `, params)

        const result = {
            total: rows[0].total_scopes,
            progress: Math.round(rows[0].avg_progress)
        }

        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result))
        res.json(result)
    } catch (err) {
        console.error('overall-progress error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// 2. ดึงรายการ Task 
router.get('/dashboard/tasks', async (req, res) => {
    const cacheKey = getCacheKey(req)
    try {
        const cachedData = await redisClient.get(cacheKey)
        if (cachedData) return res.json(JSON.parse(cachedData))

        const params = getFilterParams(req.query)
        const [rows] = await db.query(`
            SELECT 
                s.scope_id AS id, 
                s.scope_name AS title, 
                st.status_code AS status, 
                s.progress_percent AS progress, 
                s.created_at AS start_date, 
                s.end_date AS endDate 
            FROM scopes s
            JOIN status st ON s.status_id = st.status_id
            WHERE (? IS NULL OR DATE(s.created_at) BETWEEN ? AND ?)
                AND (? IS NULL OR YEAR(s.created_at) = ?)
            ORDER BY s.created_at DESC 
        `, params)

        await redisClient.setEx(cacheKey, 60, JSON.stringify(rows)) // งานล่าสุด Cache สั้นลงหน่อย (1 นาที)
        res.json(rows)
    } catch (err) {
        console.error('dashboard/tasks error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// 3. สรุปสถานะ Gap ทั้งหมด (Card 4 ใบ)
router.get('/dashboard/gap-summary', async (req, res) => {
    const cacheKey = getCacheKey(req)
    try {
        const cachedData = await redisClient.get(cacheKey)
        if (cachedData) return res.json(JSON.parse(cachedData))

        const params = getFilterParams(req.query)
        const [rows] = await db.query(`
            SELECT 
                COUNT(p.project_plan_id) AS total,
                COUNT(CASE WHEN st.status_code IN ('processing_gap', 'open', 'In Progress') THEN 1 END) AS open_gap,
                COUNT(CASE WHEN st.status_code IN ('complete_gap', 'closed', 'Completed') THEN 1 END) AS closed_gap,
                COUNT(CASE WHEN st.status_code IN ('acceptable_gap', 'acceptable') THEN 1 END) AS accepted_gap
            FROM project_plans p
            JOIN status st ON p.status_id = st.status_id
            WHERE (? IS NULL OR DATE(p.created_at) BETWEEN ? AND ?) 
                AND (? IS NULL OR YEAR(p.created_at) = ?)
        `, params)

        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(rows[0]))
        res.json(rows[0])
    } catch (err) {
        console.error('gap-summary error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// 4. สถิติช่วงความคืบหน้า (Progress Distribution)
router.get('/dashboard/progress-range', async (req, res) => {
    const cacheKey = getCacheKey(req)
    try {
        const cachedData = await redisClient.get(cacheKey)
        if (cachedData) return res.json(JSON.parse(cachedData))

        const params = getFilterParams(req.query)
        const [rows] = await db.query(`
            SELECT 
                IFNULL(SUM(progress_percent BETWEEN 0 AND 30), 0) AS low,
                IFNULL(SUM(progress_percent BETWEEN 31 AND 60), 0) AS mid,
                IFNULL(SUM(progress_percent BETWEEN 61 AND 90), 0) AS high,
                IFNULL(SUM(progress_percent = 100), 0) AS done
            FROM scopes
            WHERE (? IS NULL OR DATE(created_at) BETWEEN ? AND ?)
                AND (? IS NULL OR YEAR(created_at) = ?)
        `, params)

        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(rows[0]))
        res.json(rows[0])
    } catch (err) {
        console.error('progress-range error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// 5. ข้อมูลกราฟสรุป Gap ที่ปิดได้
router.get('/dashboard/gap-closed-chart', async (req, res) => {
    const cacheKey = getCacheKey(req)
    try {
        const cachedData = await redisClient.get(cacheKey)
        if (cachedData) return res.json(JSON.parse(cachedData))

        const { mode = 'day', startDate, endDate, year } = req.query
        const start = startDate && startDate !== '' ? startDate : null
        const end = endDate && endDate !== '' ? endDate : null
        const y = year && year !== 'all' ? year : null

        let groupBy = '', label = ''

        switch (mode) {
            case 'week':
                groupBy = `YEARWEEK(s.created_at, 1)`; label = `CONCAT('W', WEEK(s.created_at, 1))`; break
            case 'month':
                groupBy = `DATE_FORMAT(s.created_at, '%Y-%m')`; label = `DATE_FORMAT(s.created_at, '%m/%Y')`; break
            case 'year':
                groupBy = `YEAR(s.created_at)`; label = `YEAR(s.created_at)`; break
            default:
                groupBy = `DATE(s.created_at)`; label = `DATE_FORMAT(s.created_at, '%d/%m')`
        }

        const params = [start, start, end, y, y]
        const [rows] = await db.query(`
            SELECT ${label} AS label, COUNT(*) AS total
            FROM scopes s
            JOIN status st ON s.status_id = st.status_id
            WHERE st.status_code IN ('complete_gap', 'closed', 'Completed')
                AND (? IS NULL OR DATE(s.created_at) BETWEEN ? AND ?)
                AND (? IS NULL OR YEAR(s.created_at) = ?)
            GROUP BY ${groupBy}
            ORDER BY ${groupBy}
        `, params)

        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(rows))
        res.json(rows)
    } catch (err) {
        console.error('gap-closed-chart error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// 6. ดึงรายละเอียดแผนงานย่อย (Gap Analysis Details)
router.get('/dashboard/gap-details', async (req, res) => {
    const cacheKey = getCacheKey(req)
    try {
        // เช็ค Cache (ถ้าต้องการ)
        const cachedData = await redisClient.get(cacheKey)
        if (cachedData) return res.json(JSON.parse(cachedData))

        const params = getFilterParams(req.query)
        const [rows] = await db.query(`
            SELECT 
                p.project_plan_id AS id,
                s.scope_name AS parent_scope,
                p.project_plan_name AS plan_name,
                st.status_code AS status,
                p.progress_percent AS progress,
                p.start_date,
                p.end_date
            FROM project_plans p
            JOIN scopes s ON p.scope_id = s.scope_id
            JOIN status st ON p.status_id = st.status_id
            WHERE (? IS NULL OR DATE(p.created_at) BETWEEN ? AND ?)
                AND (? IS NULL OR YEAR(p.created_at) = ?)
            ORDER BY p.created_at DESC
        `, params)

        // เก็บ Cache ไว้ 5 นาที
        await redisClient.setEx(cacheKey, 300, JSON.stringify(rows))
        res.json(rows)
    } catch (err) {
        console.error('gap-details error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

export default router