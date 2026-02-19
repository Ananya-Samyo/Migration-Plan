import { createRouter, createWebHistory } from 'vue-router'

import Login from '../views/Global/Login.vue'
import Logout from '../views/Global/Logout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import UserLayout from '../layouts/UserLayout.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/logout',
    name: 'Logout',
    component: Logout
  },

  // =====================
  // Admin 
  // =====================
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, role: 'admin' }, 
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('../views/Admin/Admin_Dashboard.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/Admin/Admin_List.vue')
      },
      {
        path: 'project/add',
        name: 'AdminAddProject',
        component: () => import('../views/Admin/Admin_Addproject.vue')
      },
      {
        path: 'progress/:id',
        name: 'AdminProgress',
        component: () => import('../views/Admin/Admin_Progress.vue')
      },
      {
        path: 'evaluation/:id',
        name: 'AdminEvaluation',
        component: () => import('../views/Admin/Admin_Evaluation.vue')
      },
      {
        path: 'scopeproject',
        name: 'AdminScopeproject',
        component: () => import('../views/Admin/Admin_Scopeproject.vue')
      },
      {
        path: 'scope/:scope_id',
        name: 'AdminScopeProject',
        component: () => import('@/views/Admin/Admin_ScopeProject.vue'),
        props: true
      },
      {
        path: 'log',
        name: 'AdminLog',
        component: () => import('../views/Admin/Admin_log.vue')
      }
    ]
  },

  // =====================
  // User
  // =====================
  {
    path: '/user',
    component: UserLayout,
    meta: { requiresAuth: true, role: 'user' },
    children: [
      {
        path: '', 
        name: 'UserDashboard',
        component: () => import('../views/User/User_Dashboard.vue')
      },
      {
        path: 'user_scopeproject',
        name: 'UserScopeproject',
        component: () => import('../views/User/User_Scopeproject.vue')
      },
      {
        path: 'user_progress/:id',
        name: 'UserProgress',
        component: () => import('../views/User/User_Progress.vue')
      },
      {
        path: 'user_evaluation/:id',
        name: 'UserEvaluation',
        component: () => import('../views/User/User_Evaluation.vue')
      },
      {
        path: 'user_log',
        name: 'UserLog',
        component: () => import('../views/User/User_log.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/* ======================================================
   🧭 NAVIGATION GUARD (ระบบรักษาความปลอดภัยหน้าบ้าน)
====================================================== */
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')

  if (to.matched.some(record => record.meta.requiresAuth)) {
    
    if (!token) {
      return next({ name: 'Login' })
    }

    const requiredRole = to.matched.find(record => record.meta.role)?.meta.role

    if (requiredRole && userRole !== requiredRole) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้')
      return next(userRole === 'admin' ? '/admin' : '/user')
    }

    next()
  } else {
    if (to.name === 'Login' && token) {
      return next(userRole === 'admin' ? '/admin' : '/user')
    }
    next()
  }
})

export default router