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
    meta: { requiresAuth: true, roles: ['admin', 'viewer'] },
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
        path: 'adminproject',
        name: 'AdminProject',
        component: () => import('../views/Admin/Admin_MainStepper.vue')
      },
      {
        path: 'scopeproject',
        name: 'AdminScopeProject',
        component: () => import('../views/Admin/Admin_ScopeProject.vue')
      },
      {
        path: 'project/add',
        name: 'AdminAddProject',
        component: () => import('../components/admin/Admin_1ProjectInfo.vue')
      },
      // 🟢 จุดที่แก้ไข: หน้าความก้าวหน้า (Step 2)
      {
        path: 'progress/:id',
        name: 'AdminProgress',
        component: () => import('../components/admin/Admin_2Progress.vue')
      },
      // 🟢 จุดที่แก้ไข: หน้าการประเมินผล (Step 3)
      {
        path: 'evaluation/:id',
        name: 'AdminEvaluation',
        component: () => import('../components/admin/Admin_3Evaluation.vue')
      },
      {
        path: 'scope/:scope_id',
        name: 'AdminScopeProjectDetail',
        component: () => import('../views/Admin/Admin_ScopeProject.vue'),
        props: true
      },
      {
        path: '/admin/edit-progress/:id',
        name: 'AdminEditProgress',
        component: () => import('../components/admin/Edit/Admin_2EditProgress.vue'),
        props: true
      },
      {
        path: '/admin/edit-evaluation/:id',
        name: 'AdminEditEvaluation',
        component: () => import('../components/admin/Edit/Admin_3EditEvaluation.vue')
      },
      {
        path: 'log',
        name: 'AdminLog',
        component: () => import('../views/Admin/Admin_log.vue')
      },
      {
        path: 'export',
        name: 'AdminExport',
        component: () => import('../views/Admin/Admin_ExportMain.vue')
      }
    ]
  },

  // =====================
  // User & Coordinator
  // =====================
  {
    path: '/user',
    component: UserLayout,
    meta: { requiresAuth: true, roles: ['user', 'coordinator'] },
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
    🧭 NAVIGATION GUARD
====================================================== */
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      return next({ name: 'Login' })
    }

    const allowedRoles = to.matched.find(record => record.meta.roles)?.meta.roles
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้')

      const redirectPath = (userRole === 'admin' || userRole === 'viewer') ? '/admin' : '/user'
      return next(redirectPath)
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