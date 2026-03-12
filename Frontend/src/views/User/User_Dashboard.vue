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
      <SummaryCard title="ขอบเขตงานทั้งหมด" :value="total" type="primary" icon="📁" />
      <SummaryCard title="ปิด GAP เสร็จแล้ว" :value="closedCount" type="success" icon="✅" />
      <SummaryCard title="ยังไม่ปิด GAP" :value="openCount" type="warning" icon="📌" />
      <SummaryCard title="ไม่สามารถปิด GAP แต่ยอมรับได้" :value="acceptableCount" type="danger" icon="⚠️" />
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
          <StatusChart 
            :open="openCount" 
            :closed="closedCount" 
            :acceptable="acceptableCount" 
            :selectedDate="selectedDate" 
          />
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import '../../assets/Admin/css/Admin_Dashboard.css'

import SummaryCard from '@/components/user/u_SummaryCard.vue'
import TaskTable from '@/components/user/u_TaskTable.vue'
import StatusChart from '@/components/user/u_StatusChart.vue'
import LineChart from '@/components/user/u_LineChart.vue'

const API = import.meta.env.VITE_API_BASE_URL

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

const formatDateISO = (d) => d.toISOString().slice(0, 10)

const currentExportDate = computed(() => {
  const d = new Date()
  return `${d.getDate()} ${d.toLocaleDateString('th-TH', { month: 'long' })} ${d.getFullYear() + 543}`
})

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