<template>
  <div class="dashboard">

    <header class="page-header">
      <div class="header-title">
        <h1>📊 Dashboard ติดตามงาน</h1>
        <p>ภาพรวมสถานะการดำเนินงานและ Gap Analysis</p>
      </div>

      <div class="header-actions">
        <div class="control-group date-picker">
          <span class="label">เริ่มต้น:</span>
          <input type="date" v-model="selectedDate.start" class="date-input-field" />
        </div>

        <div class="control-group date-picker">
          <span class="label">สิ้นสุด:</span>
          <input type="date" v-model="selectedDate.end" class="date-input-field" />
        </div>

        <button class="control-group filter-btn" @click="fetchDashboard">
          <span class="icon">🔍</span>
          <span>กรองข้อมูล</span>
        </button>

        <button class="control-group export-btn" @click="exportPNG">
          <span class="icon">📤</span>
          <span>Export PNG</span>
        </button>
      </div>
    </header>

    <section class="summary-grid">
      <SummaryCard title="ขอบเขตงานทั้งหมด" :value="total" type="primary" icon="📁" />
      <SummaryCard title="ปิด GAP เสร็จแล้ว" :value="closedCount" type="success" icon="✅" />
      <SummaryCard title="ยังไม่ปิด GAP" :value="openCount" type="warning" icon="📌" />
      <SummaryCard title="ไม่สามารถปิด GAP แต่ยอมรับได้" :value="acceptableCount" type="danger" icon="⚠️" />
    </section>

    <div class="overall-progress-bar">
      <div class="progress-label">
        ความคืบหน้าการดำเนินงานของระบบโดยรวม (ตามช่วงเวลาที่เลือก)
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
          <StatusChart 
            :open="openCount" 
            :closed="closedCount" 
            :acceptable="acceptableCount" 
          />
        </div>
      </div>

      <div class="right-column">

        <div class="panel table-area">
          <div class="panel-header">
            <h3>📋 รายการงานในช่วงเวลา</h3>
            <span class="badge">{{ total }} รายการ</span>
          </div>
          <div class="panel-body scrollable">
            <TaskTable :tasks="tasks" />
          </div>
        </div>

        <div class="panel chart-area">
          <div class="panel-body">
            <LineChart />
          </div>
        </div>

      </div>
    </section>

    <div v-if="isExporting" class="export-loading">
      <div class="spinner"></div>
      <p>กำลังดาวน์โหลดไฟล์...</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import html2canvas from 'html2canvas'
import '../../assets/Admin/css/Admin_Dashboard.css'

import SummaryCard from '@/components/user/u_SummaryCard.vue'
import TaskTable from '@/components/user/u_TaskTable.vue'
import StatusChart from '@/components/user/u_StatusChart.vue'
import LineChart from '@/components/user/u_LineChart.vue'

/* ===============================
   CONFIG & STATE
================================ */
const API = import.meta.env.VITE_API_BASE_URL 

// ข้อมูลหลักใน Dashboard
const tasks = ref([])
const summary = ref({
  total: 0,
  openCount: 0,
  closedCount: 0,
  acceptableCount: 0
})
const overallProgress = ref(0)
const isExporting = ref(false)

/* ===============================
   DATE LOGIC (ประกาศครั้งเดียวจบ)
================================ */
const format = (d) => d.toISOString().slice(0, 10)
const now = new Date()

const selectedDate = ref({
  start: '',
  end: ''
})

/* ===============================
   FETCH DATA
================================ */
const fetchDashboard = async () => {
  try {
    const userId = localStorage.getItem('user_id')
    const token = localStorage.getItem('token') 

    if (!userId || !token) {
      console.warn('Missing userId or token')
      return
    }

    const { start, end } = selectedDate.value
    const queryParams = `user_id=${userId}&startDate=${start}&endDate=${end}`

    // 2. สร้าง Header ที่มี Authorization
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    const [summaryRes, tasksRes, progressRes] = await Promise.all([
      fetch(`${API}/api/user/user-dashboard/gap-summary?${queryParams}`, { headers }),
      fetch(`${API}/api/user/user-dashboard/tasks?${queryParams}`, { headers }),
      fetch(`${API}/api/user/user-dashboard/overall-progress?${queryParams}`, { headers })
    ])

    // 3. เช็คสถานะ 401
    if (summaryRes.status === 401) {
       console.error("Token หมดอายุ หรือไม่ได้เข้าสู่ระบบ")
       return
    }

    if (!summaryRes.ok || !tasksRes.ok || !progressRes.ok) throw new Error('Network error')

    const summaryData = await summaryRes.json()
    const tasksData = await tasksRes.json()
    const progressData = await progressRes.json()

    // Mapping ข้อมูล... (เหมือนเดิม)
    summary.value = {
      total: summaryData.total || 0,
      openCount: summaryData.open_gap || 0,
      closedCount: summaryData.closed_gap || 0,
      acceptableCount: summaryData.accepted_gap || 0
    }
    tasks.value = tasksData
    overallProgress.value = progressData.progress || 0

  } catch (err) {
    console.error('❌ Fetch Error:', err)
  }
}

// เรียกข้อมูลเมื่อเข้าหน้าเว็บ
onMounted(fetchDashboard)

/* ===============================
   COMPUTED (สำหรับแสดงผล UI)
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

/* ===============================
   EXPORT IMAGE
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
    link.download = `User_Report_${selectedDate.value.start}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    console.error('Export error:', err)
  } finally {
    isExporting.value = false
  }
}
</script>