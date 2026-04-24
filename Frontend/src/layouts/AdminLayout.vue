<template>
  <div class="layout">
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-top">
        <h1 class="sidebar-branding-text" v-if="!isCollapsed">
          Migration Plan
        </h1>
        <nav>
          <RouterLink to="/admin" class="nav-link" exact-active-class="active">
            <span class="icon">📊</span>
            <span v-if="!isCollapsed">แดชบอร์ด</span>
          </RouterLink>

          <RouterLink v-if="rawRole !== 'viewer'" to="/admin/adminproject" class="nav-link" exact-active-class="active">
            <span class="icon">➕</span>
            <span v-if="!isCollapsed">เพิ่มขอบเขตงาน</span>
          </RouterLink>

          <RouterLink to="/admin/scopeproject" class="nav-link" exact-active-class="active">
            <span class="icon">📂</span>
            <span v-if="!isCollapsed">ขอบเขตแผนงาน</span>
          </RouterLink>

          <RouterLink v-if="rawRole !== 'viewer'" to="/admin/export" class="nav-link" exact-active-class="active">
            <span class="icon">📥</span>
            <span v-if="!isCollapsed">นำออกข้อมูล</span>
          </RouterLink>

          <RouterLink v-if="rawRole !== 'viewer'" to="/admin/users" class="nav-link" exact-active-class="active">
            <span class="icon admin-icon">🛡️</span>
            <span v-if="!isCollapsed">รายชื่อผู้ดูแล</span>
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

        <span class="title">
          สถาปัตยกรรมองค์กรในระดับ Low Level ประจำปี

          <select v-if="showYearDropdown" v-model="selectedYear" @change="onYearChange" class="year-dropdown">
            <option value="all">ทั้งหมด</option>
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year + 543 }}
            </option>
          </select>

          <span v-else class="current-year-text">
            {{ currentYear + 543 }}
          </span>
        </span>

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

    <div v-if="!isCollapsed && windowWidth <= 768" class="sidebar-overlay" @click="isCollapsed = true">
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import './../assets/Admin/css/AdminLayout.css'

// === State สำหรับ Responsive ===
const windowWidth = ref(window.innerWidth);
const isCollapsed = ref(window.innerWidth <= 768);

const userName = ref('กำลังโหลด...')
const rawRole = ref('')

// === สถาปัตยกรรม API และปีปัจจุบัน ===
const API = import.meta.env.VITE_API_BASE_URL
const currentYear = new Date().getFullYear();

const userRoleDisplay = computed(() => formatRole(rawRole.value))
const route = useRoute()

const showYearDropdown = computed(() => {
  const allowedPaths = ['/admin', '/admin/scopeproject'];
  return allowedPaths.includes(route.path);
});

// === ส่วนจัดการ Dropdown ปี (Year Selector) ===
const availableYears = ref([]);
const selectedYear = ref(currentYear);

// ส่งตัวแปร selectedYear ให้หน้าย่อย เอาไปใช้ผ่าน inject
provide('globalSelectedYear', selectedYear);

const onYearChange = () => {
  localStorage.setItem('selectedYear', selectedYear.value);
}

const fetchAvailableYears = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API}/api/admin/available-years`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      availableYears.value = data; 
    } else {
      availableYears.value = [currentYear];
    }
  } catch (error) {
    console.error('❌ ไม่สามารถดึงข้อมูลปีจากฐานข้อมูลได้:', error);
    availableYears.value = [currentYear];
  }
}

// ฟังก์ชันจัดการ Resize
const handleResize = () => {
  windowWidth.value = window.innerWidth;
  if (windowWidth.value <= 768) {
    isCollapsed.value = true; 
  } else {
    isCollapsed.value = false; 
  }
};

onMounted(() => {
  // 1. ดึงข้อมูลปี
  fetchAvailableYears();

  // 2. ตั้งค่า Responsive
  handleResize();
  window.addEventListener('resize', handleResize);

  // 3. โหลดค่าปีที่เคยเลือกไว้
  const storedYear = localStorage.getItem('selectedYear');
  if (storedYear) {
    selectedYear.value = storedYear === 'all' ? 'all' : Number(storedYear);
  } else {
    selectedYear.value = currentYear;
  }

  // 4. โหลดข้อมูล User
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

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
})

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

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

<style scoped>
/* 1. ปุ่ม Burger (3 ขีด) */
.burger {
  display: block; 
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 10px;
  color: #333;
  z-index: 1100;
}

/* 2. จัดการหน้าจอขนาดเล็ก (Mobile/Tablet) */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1050; /* เพิ่ม z-index ให้สูงกว่า overlay */
    transition: transform 0.3s ease;
    background-color: #fff; /* เพิ่มพื้นหลังเพื่อให้ไม่โปร่งใสทับเนื้อหา */
    width: 250px;
  }

  .sidebar.collapsed {
    transform: translateX(-100%); 
    display: block !important;
  }

  .sidebar:not(.collapsed) {
    transform: translateX(0);
    box-shadow: 5px 0 15px rgba(0,0,0,0.1);
  }

  .main {
    margin-left: 0 !important;
    width: 100% !important;
  }
}

/* 3. ส่วน Dropdown ปี */
.year-dropdown {
  background-color: transparent;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: inherit;
  font-family: inherit;
  font-weight: bold;
  color: inherit;
  padding: 2px 8px;
  margin-left: 8px;
  cursor: pointer;
  outline: none;
}

.year-dropdown:focus {
  border-color: #6c5ce7;
}

/* 4. Overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1040; /* อยู่ใต้ Sidebar (1050) แต่อยู่บนเนื้อหาหลัก */
}
</style>