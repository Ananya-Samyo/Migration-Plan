import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'

// ✅ Import Middlewares
import { verifyToken, isAdmin } from './middleware/auth.js'

// ✅ Import Admin Routes 
import adminDashboardRoutes from './admin/admin_dashboard.js' 
import adminUserRoutes from './admin/admin_user.js'
import adminLogRoutes from './admin/admin_log.js'
import adminScopeRoutes from './admin/admin_scopes.js'
import adminProgressRoutes from './admin/admin_progress.js'
import adminEvaluationRoutes from './admin/admin_evaluations.js'

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

// 3. User API Group 
app.use('/api/user', verifyToken, userDashboardRouter)
app.use('/api/user', verifyToken, userEvaluationRouter)
app.use('/api/user', verifyToken, userProgresRouter)
app.use('/api/user', verifyToken, userLogRouter)
app.use('/api/user', verifyToken, userScopesRouter)

// 4. Admin API Group 
app.use('/api/admin', verifyToken, isAdmin, adminDashboardRoutes)
app.use('/api/admin', verifyToken, isAdmin, adminUserRoutes)
app.use('/api/admin', verifyToken, isAdmin, adminScopeRoutes)
app.use('/api/admin', verifyToken, isAdmin, adminProgressRoutes)
app.use('/api/admin', verifyToken, isAdmin, adminEvaluationRoutes)
app.use('/api/admin', verifyToken, isAdmin, adminLogRoutes)

// ===============================================

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})