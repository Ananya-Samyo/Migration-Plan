<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <nav>
        <h1 class="page-title" v-if="!isCollapsed">
          ระบบติดตามแผนงาน
        </h1>

        <RouterLink to="/user/dashboard" class="nav-link" exact-active-class="active">
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
    </aside>

    <!-- Main -->
    <div class="main">
      <header class="topbar">
        <button class="burger" @click="toggleSidebar">☰</button>
        <span class="title">ประจำปี {{ currentYear + 543 }}</span>

        <!-- User Dropdown -->
        <div class="user-dropdown">
          <div class="user-trigger" @click="toggleUserMenu">
            👤 User <span class="arrow">▼</span>
          </div>

          <ul v-if="isUserMenuOpen" class="dropdown-menu" @click.stop>
            <li>
              <RouterLink to="/profile" class="dropdown-link" @click="closeUserMenu">
                <span class="menu-icon">👤</span> โปรไฟล์
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/logout" class="dropdown-link logout" @click="closeUserMenu">
                <span class="menu-icon">🚪</span> ออกจากระบบ
              </RouterLink>
            </li>
          </ul>
        </div>
      </header>

      <!-- Content -->
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import './../assets/Admin/css/AdminLayout.css'

const isCollapsed = ref(false)
const isUserMenuOpen = ref(false)

// ปีปัจจุบัน (ค.ศ.)
const currentYear = computed(() =>
  new Date().getFullYear()
)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}
</script>