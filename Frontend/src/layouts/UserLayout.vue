<template>
  <div class="layout">
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-top">
        <nav>
          <h1 class="page-title" v-if="!isCollapsed">
            ระบบติดตามแผนงาน
          </h1>

          <RouterLink to="/user" class="nav-link" exact-active-class="active">
            <span class="icon">📊</span>
            <span v-if="!isCollapsed">แดชบอร์ด</span>
          </RouterLink>

          <RouterLink to="/user/user_scopeproject" class="nav-link" exact-active-class="active">
            <span class="icon">📂</span>
            <span v-if="!isCollapsed">ขอบเขตแผนงาน</span>
          </RouterLink>

          <RouterLink to="/user/user_log" class="nav-link" exact-active-class="active">
            <span class="icon">🗂️</span>
            <span v-if="!isCollapsed">บันทึกการเปลี่ยนแปลงข้อมูล</span>
          </RouterLink>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <RouterLink to="/logout" class="nav-link logout-link">
          <span class="icon">🚪</span>
          <span v-if="!isCollapsed">ออกจากระบบ</span>
        </RouterLink>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <button class="burger" @click="toggleSidebar">☰</button>
        <span class="title">ประจำปี {{ currentYear + 543 }}</span>

        <div class="user-info">
          <div class="user-avatar">👤</div>
          <div class="user-details">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">{{ userRole }}</div>
          </div>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import './../assets/Admin/css/AdminLayout.css'

const isCollapsed = ref(false)

// ตัวแปรสำหรับแสดงผลข้อมูลผู้ใช้
const userName = ref('กำลังโหลด...') 
const userRole = ref('User')

onMounted(() => {
  // ดึงข้อมูลจาก localStorage ที่เราเซฟไว้ตอน Login
  const storedName = localStorage.getItem('user_name')
  const storedRole = localStorage.getItem('user_role') || localStorage.getItem('role')

  if (storedName) {
    userName.value = storedName
    userRole.value = formatRole(storedRole)
  } else {
    // ถ้าไม่มีใน localStorage ให้ลองถอดรหัสจาก JWT Token (เผื่อไว้)
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))

        const payload = JSON.parse(jsonPayload)
        
        if (payload.user_name || payload.name) {
          userName.value = payload.user_name || payload.name
        }
        if (payload.role) {
          userRole.value = formatRole(payload.role)
        }
      } catch (e) {
        console.error('อ่านข้อมูลจาก Token ไม่สำเร็จ', e)
        userName.value = 'ผู้ใช้งาน'
      }
    }
  }
})

// ปีปัจจุบัน (พ.ศ.)
const currentYear = computed(() => new Date().getFullYear())

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

// ฟังก์ชันปรับคำแสดงผล Role ให้สวยงาม
const formatRole = (role) => {
  if (!role) return 'ผู้ใช้งานทั่วไป'
  const lowerRole = role.toLowerCase()
  if (lowerRole === 'admin') return 'Administrator'
  if (lowerRole === 'coordinator') return 'ผู้ประสานงาน'
  if (lowerRole === 'user') return 'ผู้ใช้งานทั่วไป'
  return role
}
</script>