import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'

// 1. Import Routes ทั่วไป (เช่น Login, Profile ส่วนตัว)
import userRoutes from './src/user.js'

// 2. Import Admin Routes (แก้ Path เป็น src/admin/)
import adminUserRoutes from './src/admin/admin_user.js'       
import adminLogRoutes from './src/admin/admin_log.js'         
import adminScopeRoutes from './src/admin/admin_scopes.js'    
import adminProgressRoutes from './src/admin/admin_progress.js'
import adminEvaluationRoutes from './src/admin/admin_evaluations.js' 

const app = express()

app.use(cors())
app.use(express.json())

// ================= Register Routes =================

// A. General User API (ถ้ามี)
app.use('/api', userRoutes) 

// B. Admin API Group
// จัดการ User และ แผนก (GET/POST/PUT/DELETE users, GET departments)
app.use('/api/admin', adminUserRoutes)

// จัดการ Scope และ Project
app.use('/api/admin', adminScopeRoutes)

// จัดการความก้าวหน้า (Progress & Gaps)
app.use('/api/admin', adminProgressRoutes)

// จัดการการประเมินผล (Evaluation)
app.use('/api/admin', adminEvaluationRoutes)

// ดู Log การใช้งาน
app.use('/api/admin', adminLogRoutes)

// ===============================================

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})