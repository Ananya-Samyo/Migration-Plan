<template>
  <div class="dashboard">

    <!-- ================= Header ================= -->
    <header class="page-header">
      <div class="header-title">
        <h1>📊 Dashboard ติดตามงาน</h1>
        <p>ภาพรวมสถานะการดำเนินงานและ Gap Analysis</p>
      </div>

      <div class="header-actions">
        <div class="quick-date">
          <div class="control-group date-dropdown" @click="isOpen = !isOpen">
            <span class="icon">🕒</span>

            <span class="label">
              {{
                {
                  today: 'วันนี้',
                  yesterday: 'เมื่อวาน',
                  week: 'สัปดาห์นี้',
                  month: 'เดือนนี้',
                  year: 'ปีนี้'
                }[dateMode]
              }}
            </span>

            <span class="arrow">▾</span>

            <ul v-if="isOpen" class="dropdown-menu">
              <li @click="selectMode('today')">วันนี้</li>
              <li @click="selectMode('yesterday')">เมื่อวาน</li>
              <li @click="selectMode('week')">สัปดาห์นี้</li>
              <li @click="selectMode('month')">เดือนนี้</li>
              <li @click="selectMode('year')">ปีนี้</li>
            </ul>
          </div>
        </div>

        <div class="control-group date-picker" @click="openDate">
          <span class="icon">📅</span>
          <span class="label">{{ buddhistDateText }}</span>
          <input ref="dateInput" type="date" v-model="selectedDate" class="hidden-input" />
        </div>

        <button class="control-group export-btn" @click="exportPNG">
          <span class="icon">📤</span>
          <span>Export PNG</span>
        </button>
      </div>
    </header>

    <!-- ================= Summary ================= -->
    <section class="summary-grid">
      <SummaryCard title="ขอบเขตงานทั้งหมด" :value="total" type="primary" icon="📁" />
      <SummaryCard title="ปิด GAP เสร็จแล้ว" :value="closedCount" type="success" icon="✅" />
      <SummaryCard title="ยังไม่ปิด GAP" :value="openCount" type="warning" icon="📌" />
      <SummaryCard title="ไม่สามารถปิด GAP แต่ยอมรับได้" :value="acceptableCount" type="danger" icon="⚠️" />
    </section>

    <!-- ================= Overall Progress ================= -->
    <div class="overall-progress-bar">
      <div class="progress-label">
        ความคืบหน้าการดำเนินงานของระบบโดยรวม
        <span>{{ overallProgress }}%</span>
      </div>

      <div class="progress-track">
        <div class="progress-fill" :style="{
          width: overallProgress + '%',
          backgroundColor: overallProgressColor
        }" />
      </div>
    </div>

    <!-- ================= Main Content ================= -->
    <section class="content-layout">

      <!-- ซ้าย -->
      <div class="panel chart-area">
        <div class="panel-header">
          <h3>📈 สัดส่วนสถานะ</h3>
        </div>
        <div class="panel-body">
          <StatusChart :open="openCount" :closed="closedCount" :acceptable="acceptableCount" />
        </div>
      </div>

      <!-- ขวา -->
      <div class="right-column">

        <!-- Table -->
        <div class="panel table-area">
          <div class="panel-header">
            <h3>📋 รายการงานล่าสุด</h3>
            <span class="badge">{{ total }} รายการ</span>
          </div>
          <div class="panel-body scrollable">
            <TaskTable :tasks="tasks" />
          </div>
        </div>

        <!-- Line Chart -->
        <div class="panel table-area">
          <div class="panel-body">
            <LineChart />
          </div>
        </div>

      </div>
    </section>

    <!-- Loading Export -->
    <div v-if="isExporting" class="export-loading">
      <div class="spinner"></div>
      <p>กำลังดาวน์โหลดไฟล์...</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import html2canvas from 'html2canvas'
import '../../assets/Admin/css/Admin_Dashboard.css'

import SummaryCard from '@/components/SummaryCard.vue'
import TaskTable from '@/components/TaskTable.vue'
import StatusChart from '@/components/StatusChart.vue'
import LineChart from '@/components/LineChart.vue'

/* ===============================
   API CONFIG
================================ */
const API = import.meta.env.VITE_API_BASE_URL
console.log('API BASE URL =', API)

/* ===============================
   STATE
================================ */
const tasks = ref([])
const summary = ref({
  total: 0,
  openCount: 0,
  closedCount: 0,
  acceptableCount: 0
})
const overallProgress = ref(0)

const isExporting = ref(false)
const dateInput = ref(null)

/* ===============================
   DATE STATE
================================ */
const dateMode = ref('today')
const selectedDate = ref({
  start: '',
  end: ''
})

/* ===============================
   DATE HELPERS
================================ */
const format = (d) => d.toISOString().slice(0, 10)

const todayRange = () => {
  const d = new Date()
  return { start: format(d), end: format(d) }
}

const yesterdayRange = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return { start: format(d), end: format(d) }
}

const weekRange = () => {
  const now = new Date()
  const day = now.getDay() || 7
  const start = new Date(now)
  start.setDate(now.getDate() - day + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: format(start), end: format(end) }
}

const monthRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: format(start), end: format(end) }
}

const yearRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear(), 11, 31)
  return { start: format(start), end: format(end) }
}

selectedDate.value = todayRange()

/* ===============================
   DATE WATCHERS
================================ */
watch(dateMode, (mode) => {
  if (mode === 'today') selectedDate.value = todayRange()
  else if (mode === 'yesterday') selectedDate.value = yesterdayRange()
  else if (mode === 'week') selectedDate.value = weekRange()
  else if (mode === 'month') selectedDate.value = monthRange()
  else if (mode === 'year') selectedDate.value = yearRange()
})

watch(selectedDate, () => {
  if (dateMode.value !== 'custom') {
    dateMode.value = 'custom'
  }
})

const isOpen = ref(false)

const selectMode = (mode) => {
  dateMode.value = mode
  isOpen.value = false
}


/* ===============================
   FETCH DASHBOARD
================================ */
const fetchDashboard = async () => {
  try {
    const [
      summaryRes,
      tasksRes,
      progressRes
    ] = await Promise.all([
      fetch(`${API}/api/admin/dashboard/gap-summary`),
      fetch(`${API}/api/admin/dashboard/tasks`),
      fetch(`${API}/api/admin/dashboard/overall-progress`)
    ])

    const summaryData = await summaryRes.json()
    const progressData = await progressRes.json()

    summary.value = {
      total:
        summaryData.open_gap +
        summaryData.closed_gap +
        summaryData.accepted_gap,
      openCount: summaryData.open_gap,
      closedCount: summaryData.closed_gap,
      acceptableCount: summaryData.accepted_gap
    }

    tasks.value = await tasksRes.json()

    overallProgress.value = progressData.progress

  } catch (err) {
    console.error('❌ โหลดข้อมูล dashboard ไม่สำเร็จ:', err)
  }
}

onMounted(fetchDashboard)
watch(selectedDate, fetchDashboard)

/* ===============================
   DATE UI
================================ */
const openDate = () => {
  dateMode.value = 'custom'
  dateInput.value?.showPicker()
}

const buddhistDateText = computed(() => {
  const s = new Date(selectedDate.value.start)
  const e = new Date(selectedDate.value.end)

  const formatTH = (d) =>
    `${d.getDate()} ${d.toLocaleDateString('th-TH', { month: 'long' })} ${d.getFullYear() + 543}`

  if (selectedDate.value.start === selectedDate.value.end) {
    return formatTH(s)
  }

  return `${formatTH(s)} - ${formatTH(e)}`
})

/* ===============================
   SUMMARY COMPUTED
================================ */
const total = computed(() => summary.value.total)
const openCount = computed(() => summary.value.openCount)
const closedCount = computed(() => summary.value.closedCount)
const acceptableCount = computed(() => summary.value.acceptableCount)

/* ===============================
   PROGRESS COLOR
================================ */
const overallProgressColor = computed(() => {
  if (overallProgress.value < 50) return '#ef4444'
  if (overallProgress.value < 80) return '#6d28d9'
  return '#16a34a'
})

/* ===============================
   EXPORT PNG
================================ */
const exportPNG = async () => {
  const dashboard = document.querySelector('.dashboard')
  if (!dashboard) return

  isExporting.value = true

  try {
    const canvas = await html2canvas(dashboard, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f1f5f9'
    })

    const link = document.createElement('a')
    link.download = `Report_${selectedDate.value}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    console.error('export error:', err)
  } finally {
    isExporting.value = false
  }
}
</script>
