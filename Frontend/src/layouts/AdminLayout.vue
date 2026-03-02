<template>
  <div class="layout">
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-top">
        <nav>
          <h1 class="page-title" v-if="!isCollapsed">
            Migration Plan
          </h1>

          <RouterLink to="/admin" class="nav-link" exact-active-class="active">
            <span class="icon">📊</span>
            <span v-if="!isCollapsed">แดชบอร์ด</span>
          </RouterLink>

          <RouterLink v-if="rawRole !== 'viewer'" to="/admin/users" class="nav-link" exact-active-class="active">
            <span class="icon admin-icon">🛡️</span>
            <span v-if="!isCollapsed">รายชื่อผู้ดูแล</span>
          </RouterLink>

          <RouterLink v-if="rawRole !== 'viewer'" to="/admin/adminproject" class="nav-link" exact-active-class="active">
            <span class="icon">➕</span>
            <span v-if="!isCollapsed">เพิ่มขอบเขตงาน</span>
          </RouterLink>

          <RouterLink to="/admin/scopeproject" class="nav-link" exact-active-class="active">
            <span class="icon">📂</span>
            <span v-if="!isCollapsed">ขอบเขตแผนงาน</span>
          </RouterLink>

          <RouterLink v-if="rawRole !== 'viewer'" to="/admin/log" class="nav-link" exact-active-class="active">
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
        <span class="title">สถาปัตยกรรมองค์กรในระดับ Low Level ประจำปี {{ currentYear + 543 }}</span>

        <div class="user-info">
          <div class="user-avatar">👤</div>
          <div class="user-details">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">{{ userRoleDisplay }}</div>
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
const userName = ref('กำลังโหลด...')
const rawRole = ref('') // ใช้สำหรับเช็คสิทธิ์ (เก็บค่า 'admin', 'viewer' ฯลฯ)

// ใช้ Computed เพื่อแปลง Role เป็นภาษาไทยสำหรับแสดงผลเท่านั้น
const userRoleDisplay = computed(() => {
  return formatRole(rawRole.value)
})

onMounted(() => {
  const storedName = localStorage.getItem('user_name')
  const storedRole = localStorage.getItem('user_role') || localStorage.getItem('role')

  if (storedName) {
    userName.value = storedName
    rawRole.value = storedRole.toLowerCase()
  } else {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))

        const payload = JSON.parse(jsonPayload)

        if (payload.user_name || payload.name) {
          userName.value = payload.user_name || payload.name
        }
        if (payload.role) {
          rawRole.value = payload.role.toLowerCase()
        }
      } catch (e) {
        console.error('อ่านข้อมูลจาก Token ไม่สำเร็จ', e)
        userName.value = 'ผู้ดูแลระบบ'
        rawRole.value = 'admin'
      }
    }
  }
})

const currentYear = computed(() => new Date().getFullYear())

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

// ฟังก์ชันสำหรับแปลงชื่อ Role เพื่อความสวยงามบน UI
const formatRole = (role) => {
  if (!role) return 'ไม่ระบุตัวตน'
  const r = role.toLowerCase()
  if (r === 'admin') return 'ผู้ดูแลระบบ'
  if (r === 'coordinator') return 'ผู้ประสานงาน'
  if (r === 'user') return 'ผู้ใช้งานทั่วไป'
  if (r === 'viewer') return 'ผู้เข้าชม'
  return role
}
</script>