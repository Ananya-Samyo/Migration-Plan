// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import Login from '../views/Global/Login.vue'
import Logout from '../views/Global/Logout.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },

  // =====================
  // Auth
  // =====================
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
    meta: { role: 'admin' },
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
        component: () => import('@/views/Admin/Admin_Evaluation.vue')
      },

      // ✅ หน้า scope list
      {
        path: 'scopeproject',
        name: 'AdminScopeproject',
        component: () => import('../views/Admin/Admin_Scopeproject.vue')
      },

      // ✅ หน้า scope detail (สำคัญ)
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
