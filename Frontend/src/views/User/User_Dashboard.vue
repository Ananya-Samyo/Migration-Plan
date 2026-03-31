<template>
  <div class="dashboard">

    <header class="page-header">
      <div class="header-title">
        <h1>📊 Dashboard ติดตามงานของฉัน</h1>
        <p>ภาพรวมสถานะการดำเนินงานและ Gap Analysis</p>
      </div>

      <div class="header-actions">
        <div class="control-group date-dropdown" @click.stop="isOpen = !isOpen">
          <span class="icon" style="font-size: 1.2rem">🕒</span>
          <span class="label">
            {{
              {
                all: 'ทั้งหมด',
                today: 'วันนี้',
                yesterday: 'เมื่อวาน',
                week: 'สัปดาห์นี้',
                month: 'เดือนนี้',
                year: 'ปีนี้',
                custom: 'กำหนดเอง'
              }[dateMode] || 'กำหนดเอง'
            }}
          </span>
          <span class="arrow">▾</span>

          <ul v-if="isOpen" class="dropdown-menu">
            <li @click.stop="selectMode('all')">ทั้งหมด</li>
            <li @click.stop="selectMode('today')">วันนี้</li>
            <li @click.stop="selectMode('yesterday')">เมื่อวาน</li>
            <li @click.stop="selectMode('week')">สัปดาห์นี้</li>
            <li @click.stop="selectMode('month')">เดือนนี้</li>
            <li @click.stop="selectMode('year')">ปีนี้</li>
          </ul>
        </div>

        <div class="control-group date-picker" @click="openDate">
          <span class="icon" style="font-size: 1.2rem">📅</span>
          <span class="label">{{ buddhistDateText }}</span>
          <input ref="dateInput" type="date" v-model="selectedDate.start" class="hidden-input"
            @change="onManualDateChange" />
        </div>
      </div>
    </header>

    <section class="summary-grid">
      <SummaryCard title="ขอบเขตงานทั้งหมด" :value="total" type="warning" icon="📁"
        @details="handleCardClick('warning', tasks)" />

      <SummaryCard title="ยังไม่ปิด GAP" :value="openCount" type="primary" icon="📌"
        @details="handleCardClick('primary', tasks)" />

      <SummaryCard title="ปิด GAP เสร็จแล้ว" :value="closedCount" type="success" icon="✅"
        @details="handleCardClick('success', tasks)" />

      <SummaryCard title="ไม่สามารถปิด GAP แต่ยอมรับได้" :value="acceptableCount" type="danger" icon="⚠️"
        @details="handleCardClick('danger', tasks)" />
    </section>

    <div class="overall-progress-bar">
      <div class="progress-label">
        ความคืบหน้าการดำเนินงานส่วนตัวโดยรวม
        <span>{{ overallProgress }}%</span>
      </div>

      <div class="progress-track">
        <div class="progress-fill" :style="{
          width: overallProgress + '%',
          backgroundColor: overallProgressColor
        }" />
      </div>
    </div>

    <section class="content-layout">
      <div class="panel chart-area">
        <div class="panel-header">
          <h3>📈 สัดส่วนสถานะ</h3>
        </div>
        <div class="panel-body">
          <StatusChart :open="openCount" :closed="closedCount" :acceptable="acceptableCount"
            :selectedDate="selectedDate" />
        </div>
      </div>

      <div class="right-column">
        <div class="panel table-area">
          <div class="panel-header">
            <h3>📋 รายการงานล่าสุด</h3>
            <span class="badge">{{ total }} รายการ</span>
          </div>
          <div class="panel-body scrollable">
            <TaskTable :tasks="tasks" />
          </div>
        </div>

        <div class="panel table-area">
          <div class="panel-body">
            <LineChart :selectedDate="selectedDate" />
          </div>
        </div>
      </div>
    </section>

    <div v-if="isExporting" class="export-loading">
      <div class="spinner"></div>
      <p>กำลังเตรียมไฟล์ PDF...</p>
    </div>

    <div class="pdf-export-container" ref="pdfTemplate" style="position: absolute; left: -9999px;">
    </div>
  </div>

  <div v-if="isModalOpen" class="custom-modal-overlay" @click.self="closeModal">
    <div class="custom-modal-content">
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button class="close-btn" @click="closeModal">✖</button>
      </div>

      <div class="modal-body">
        <div class="search-box mb-3">
          <span class="search-icon">🔍</span>
          <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อแผนงาน หรือ กองที่รับผิดชอบ..."
            class="form-control" />
        </div>

        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th width="5%" class="text-center">ลำดับ</th>
                <th width="35%">ชื่อแผนงาน</th>
                <th width="15%" class="text-center">ความคืบหน้า</th>
                <th width="15%" class="text-center">ความเร่งด่วน</th>
                <th width="15%" class="text-center">สถานะ</th>
                <th width="15%" class="text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedData.length === 0">
                <td colspan="6" class="empty-state-container">
                  <div class="empty-state-content">
                    <span class="empty-icon">📭</span>
                    <p class="empty-text">ไม่พบข้อมูลในหมวดหมู่นี้</p>
                  </div>
                </td>
              </tr>
              <tr v-for="(item, index) in paginatedData" :key="item.id">
                <td class="text-center">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                <td>{{ item.title || item.name || 'ไม่มีชื่อแผนงาน' }}</td>
                <td class="text-center">{{ Math.round(item.progress || 0) }} %</td>
                <td class="text-center">
                  <span :class="['urgency-badge', getUrgency(item.endDate || item.end_date).class]">
                    {{ getUrgency(item.endDate || item.end_date).label }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="badge" :class="getBadgeClass(item.status)">
                    {{ item.status === 'closed' ? 'ปิด GAP แล้ว' : (item.status === 'acceptable' ? 'ยอมรับได้' :
                    'ยังไม่ปิด GAP') }}
                  </span>
                </td>
                <td class="text-center">
                  <button class="btn-detail" @click="goToScopePage(item.id)">📄 รายละเอียด</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="custom-task-pagination" v-if="totalPages > 1">
        <button class="custom-page-btn" @click="prevPage" :disabled="currentPage === 1">&lt; ก่อนหน้า</button>
        <span class="custom-page-info">หน้า {{ currentPage }} จาก {{ totalPages }}</span>
        <button class="custom-page-btn" @click="nextPage" :disabled="currentPage === totalPages">ถัดไป &gt;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import '../../assets/Admin/css/Admin_Dashboard.css'

import SummaryCard from '@/components/user/u_SummaryCard.vue'
import TaskTable from '@/components/user/u_TaskTable.vue'
import StatusChart from '@/components/user/u_StatusChart.vue'
import LineChart from '@/components/user/u_LineChart.vue'

const API = import.meta.env.VITE_API_BASE_URL

const router = useRouter()

/* ===============================
    STATE & DATE LOGIC
================================ */
const tasks = ref([])
const summary = ref({ total: 0, openCount: 0, closedCount: 0, acceptableCount: 0 })
const overallProgress = ref(0)
const isExporting = ref(false)
const dateInput = ref(null)
const isOpen = ref(false)
const dateMode = ref('all')
const selectedDate = ref({ start: '', end: '' })

const isModalOpen = ref(false)
const modalTitle = ref('')
const modalDataList = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const formatDateISO = (d) => d.toISOString().slice(0, 10)

const currentExportDate = computed(() => {
  const d = new Date()
  return `${d.getDate()} ${d.toLocaleDateString('th-TH', { month: 'long' })} ${d.getFullYear() + 543}`
})

// --- Logic การค้นหาและแบ่งหน้า ---
const filteredData = computed(() => {
  if (!searchQuery.value) return modalDataList.value
  const query = searchQuery.value.toLowerCase()
  return modalDataList.value.filter(item => {
    const name = (item.title || item.name || '').toLowerCase()
    const dept = (item.department_name || '').toLowerCase()
    return name.includes(query) || dept.includes(query)
  })
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / itemsPerPage) || 1)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredData.value.slice(start, start + itemsPerPage)
})

// --- Functions ---
const closeModal = () => { isModalOpen.value = false }
const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }

const getBadgeClass = (status) => {
  if (status === 'closed') return 'badge-success'
  if (status === 'acceptable') return 'badge-warning'
  return 'badge-danger'
}

const getUrgency = (endDate) => {
  if (!endDate) return { label: 'ไม่ระบุ', class: 'gray' }
  const today = new Date()
  const target = new Date(endDate)
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: 'เลยกำหนด', class: 'urgent-critical' }
  if (diffDays <= 7) return { label: 'ด่วนมาก', class: 'urgent-high' }
  if (diffDays <= 30) return { label: 'เร่งด่วน', class: 'urgent-medium' }
  return { label: 'ปกติ', class: 'urgent-low' }
}

const handleCardClick = (type, allTasks) => {
  if (!allTasks || allTasks.length === 0) return; 
  
  searchQuery.value = ''
  currentPage.value = 1
  
  const titles = {
    warning: 'ขอบเขตงานทั้งหมด',
    primary: 'รายการที่ยังไม่ปิด GAP',
    success: 'รายการที่ปิด GAP เสร็จแล้ว',
    danger: 'รายการที่ไม่สามารถปิด GAP แต่ยอมรับได้'
  }
  modalTitle.value = titles[type] || 'รายละเอียด'

  // กรองข้อมูล
  if (type === 'warning') modalDataList.value = [...allTasks]
  else if (type === 'primary') modalDataList.value = allTasks.filter(t => t.status !== 'closed' && t.status !== 'acceptable')
  else if (type === 'success') modalDataList.value = allTasks.filter(t => t.status === 'closed')
  else if (type === 'danger') modalDataList.value = allTasks.filter(t => t.status === 'acceptable')

  isModalOpen.value = true
}

const goToScopePage = (scopeId) => {
  isModalOpen.value = false
  router.push({ path: '/user/user_scopeproject', query: { scope_id: scopeId } })
}

/* ===============================
    COMPUTED PROPERTIES
================================ */
const total = computed(() => summary.value.total)
const openCount = computed(() => summary.value.openCount)
const closedCount = computed(() => summary.value.closedCount)
const acceptableCount = computed(() => summary.value.acceptableCount)

const overallProgressColor = computed(() => {
  if (overallProgress.value < 50) return '#ef4444'
  if (overallProgress.value < 80) return '#6d28d9'
  return '#16a34a'
})

const buddhistDateText = computed(() => {
  if (dateMode.value === 'all' || !selectedDate.value.start) return 'ทั้งหมด'
  const formatTH = (dateStr) => {
    const d = new Date(dateStr)
    return `${d.getDate()} ${d.toLocaleDateString('th-TH', { month: 'long' })} ${d.getFullYear() + 543}`
  }
  return selectedDate.value.start === selectedDate.value.end
    ? formatTH(selectedDate.value.start)
    : `${formatTH(selectedDate.value.start)} - ${formatTH(selectedDate.value.end)}`
})

/* ===============================
    FETCH DATA (ปรับเป็นแบบ User)
================================ */
const fetchDashboard = async () => {
  const userId = localStorage.getItem('user_id') // ดึง User ID เหมือนใน User_Dashboard
  const token = localStorage.getItem('token')

  if (!userId || !token) {
    console.error('Missing userId or token')
    return
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  try {
    // แก้ไข Endpoint ให้เป็นของฝั่ง User และส่ง user_id ไปด้วย
    const query = `?user_id=${userId}&startDate=${selectedDate.value.start}&endDate=${selectedDate.value.end}`

    const [summaryRes, tasksRes, progressRes] = await Promise.all([
      fetch(`${API}/api/user/user-dashboard/gap-summary${query}`, { headers }),
      fetch(`${API}/api/user/user-dashboard/tasks${query}`, { headers }),
      fetch(`${API}/api/user/user-dashboard/overall-progress${query}`, { headers })
    ])

    if (summaryRes.status === 401) {
      console.error("Token หมดอายุ")
      return
    }

    const summaryData = await summaryRes.json()
    const tasksData = await tasksRes.json()
    const progressData = await progressRes.json()

    summary.value = {
      total: summaryData.total || 0,
      openCount: summaryData.open_gap || 0,
      closedCount: summaryData.closed_gap || 0,
      acceptableCount: summaryData.accepted_gap || 0
    }
    tasks.value = tasksData
    overallProgress.value = progressData.progress || 0

  } catch (err) {
    console.error('❌ Fetch Dashboard Error:', err)
  }
}

/* ===============================
    DATE RANGE & UI EVENTS
================================ */
const setDateRange = (mode) => {
  const now = new Date()
  let start = ''
  let end = ''

  switch (mode) {
    case 'today': start = end = formatDateISO(now); break
    case 'yesterday':
      const yesterday = new Date(); yesterday.setDate(now.getDate() - 1)
      start = end = formatDateISO(yesterday); break
    case 'week':
      const day = now.getDay() || 7; const mon = new Date(now); mon.setDate(now.getDate() - day + 1)
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      start = formatDateISO(mon); end = formatDateISO(sun); break
    case 'month':
      start = formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1))
      end = formatDateISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)); break
    case 'year':
      start = formatDateISO(new Date(now.getFullYear(), 0, 1))
      end = formatDateISO(new Date(now.getFullYear(), 11, 31)); break
    default: start = ''; end = ''; break
  }
  selectedDate.value = { start, end }
}

const selectMode = (mode) => {
  dateMode.value = mode
  setDateRange(mode)
  isOpen.value = false
  fetchDashboard()
}

const onManualDateChange = () => {
  dateMode.value = 'custom'
  selectedDate.value.end = selectedDate.value.start
  fetchDashboard()
}

const openDate = () => { dateInput.value?.showPicker() }

onMounted(() => {
  setDateRange('all')
  fetchDashboard()
  window.addEventListener('click', () => { isOpen.value = false })
})
</script>