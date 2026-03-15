import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'

// ✅ 1. Import Middlewares ตัวใหม่เข้ามาให้ครบ
import { verifyToken, isAdmin, canViewBasic, canAccessLog } from './middleware/auth.js'

// ✅ Import Admin Routes 
import adminDashboardRoutes from './admin/admin_dashboard.js' 
import adminUserRoutes from './admin/admin_user.js'
import adminLogRoutes from './admin/admin_log.js'
import adminScopeRoutes from './admin/admin_scopes.js'
import adminProgressRoutes from './admin/admin_progress.js'
import adminEvaluationRoutes from './admin/admin_evaluations.js'
import adminProjectsRoutes from './admin/admin_projects.js'
import adminExportRoutes from './admin/admin_export.js'
import adminEditProjectRoutes from './admin/admin_editprogress.js'

// ✅ Import Global Routes
import departmentRoutes from './global/departments.js'
import login from './global/login.js'

// ✅ Import User Routes 
import userDashboardRouter from './user/user_dashboard.js'
import userEvaluationRouter from './user/user_evaluation.js'
import userProgresRouter from './user/user_progress.js'
import userLogRouter from './user/user_log.js'
import userScopesRouter from './user/user_scopes.js'

const app = express()

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

// ================= Register Routes =================

// 1. Public Routes 
app.use('/api', login)

// 2. Global Routes 
app.use('/api/departments', verifyToken, departmentRoutes)

// 3. User API Group (สิทธิ์สำหรับ User / Coordinator)
// 🟢 Dashboard และ Scopes (ทุกคนเข้าได้ รวมถึง Viewer)
app.use('/api/user', verifyToken, canViewBasic, userDashboardRouter)
app.use('/api/user', verifyToken, canViewBasic, userScopesRouter)

// 🟡 Log และข้อมูลอื่นๆ (Admin, User, Coordinator เข้าได้ | Viewer ห้ามเข้า)
app.use('/api/user', verifyToken, canAccessLog, userLogRouter)
app.use('/api/user', verifyToken, canAccessLog, userEvaluationRouter)
app.use('/api/user', verifyToken, canAccessLog, userProgresRouter)

// 4. Admin API Group (สิทธิ์สำหรับฝั่ง Admin Layout)
// 🟢 Dashboard และ Scopes (Admin และ Viewer เข้าได้ผ่านไฟล์ AdminLayout)
app.use('/api/admin', verifyToken, canViewBasic, adminDashboardRoutes)
app.use('/api/admin', verifyToken, canViewBasic, adminScopeRoutes)

// 🔴 ส่วนที่เหลือ (Admin เท่านั้น | Viewer, User, Coordinator ห้ามเข้า)
app.use('/api/admin', verifyToken, isAdmin, adminUserRoutes)
app.use('/api/admin', verifyToken, isAdmin, adminProgressRoutes)
app.use('/api/admin', verifyToken, isAdmin, adminEvaluationRoutes)
app.use('/api/admin', verifyToken, isAdmin, adminLogRoutes)
app.use('/api/admin', verifyToken, isAdmin, adminProjectsRoutes)
app.use('/api/admin', verifyToken, isAdmin, adminExportRoutes);
app.use('/api/admin', verifyToken, isAdmin, adminEditProjectRoutes)

// ===============================================

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})