<script setup>
import { ref, computed } from 'vue'
import html2canvas from 'html2canvas'
import { tasks } from '@/data/tasks'
import SummaryCard from '@/components/SummaryCard.vue'
import TaskTable from '@/components/TaskTable.vue'
import StatusChart from '@/components/StatusChart.vue'

/* ===============================
   Date Handling
================================ */
const today = new Date().toISOString().slice(0, 10)
const selectedDate = ref(today)
const dateInput = ref(null)

const openDate = () => {
  dateInput.value?.showPicker()
}

const selectedDateObj = computed(() => new Date(selectedDate.value))

const buddhistDateText = computed(() => {
  const d = selectedDateObj.value
  const day = d.getDate()
  const month = d.toLocaleDateString('th-TH', { month: 'long' })
  const year = d.getFullYear() + 543
  return `${day} ${month} ${year}`
})

/* ===============================
   Summary Logic
================================ */
const total = computed(() => tasks.length)

const todayTasks = computed(() =>
  tasks.filter(t =>
    new Date(t.startDate) <= selectedDateObj.value &&
    new Date(t.endDate) >= selectedDateObj.value
  )
)

const overdue = computed(() =>
  tasks.filter(t =>
    new Date(t.endDate) < selectedDateObj.value &&
    t.status !== 'Completed'
  )
)

/* ===============================
   Export PNG
================================ */
const exportPNG = async () => {
  const dashboard = document.querySelector('.dashboard')
  if (!dashboard) return

  const canvas = await html2canvas(dashboard, {
    scale: 2,
    useCORS: true
  })

  const link = document.createElement('a')
  link.download = `dashboard_${selectedDate.value}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
</script>

<template>
  <div class="dashboard">

    <!-- ================= Header ================= -->
    <div class="page-header">
      <div>
        <h1>📊 Dashboard</h1>
        <p>ภาพรวมการติดตามงานทั้งหมด</p>
      </div>

      <div class="header-actions">
        <!-- Export Button -->
        <button class="export-btn" @click="exportPNG">
          📤 ส่งออกรายงานสรุปการติดตามแผนงาน
        </button>

        <!-- Date Picker -->
        <div class="date-picker" @click="openDate">
          <span class="date-text">{{ buddhistDateText }}</span>
          <input
            ref="dateInput"
            type="date"
            v-model="selectedDate"
            class="hidden-date"
          />
        </div>
      </div>
    </div>

    <!-- ================= Summary ================= -->
    <div class="summary">
      <SummaryCard title="งานทั้งหมด" :value="total" type="primary" />
      <SummaryCard title="งานวันนี้" :value="todayTasks.length" type="info" />
      <SummaryCard title="เกินกำหนด" :value="overdue.length" type="danger" />
    </div>

    <!-- ================= Chart ================= -->
    <section class="panel table">
      <header class="panel-header">
        <h3>📈 สถานะงาน</h3>
        <span>แสดงภาพรวมสถานะทั้งหมด</span>
      </header>
      <StatusChart :tasks="tasks" />
    </section>

    <!-- ================= Table ================= -->
    <section class="panel">
      <header class="panel-header">
        <h3>📋 รายการงาน</h3>
        <span>รายละเอียดงานทั้งหมด</span>
      </header>
      <TaskTable :tasks="tasks" />
    </section>

  </div>
</template>

<style scoped>
:root {
  --purple-main: #6d28d9;
  --purple-dark: #4c1d95;
  --purple-soft: #ede9fe;
  --text-muted: #64748b;
}

/* Layout */
.dashboard {
  width: 100%;
  padding: 24px 32px;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 700;
  color: var(--purple-dark);
}

.page-header p {
  margin-top: 6px;
  font-size: 16px;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Export Button */
.export-btn {
  background: var(--purple-main);
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.export-btn:hover {
  background: var(--purple-dark);
}

/* Date Picker */
.date-picker {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid var(--purple-soft);
  padding: 10px 14px;
  border-radius: 12px;
}

.date-text {
  font-size: 14px;
  color: var(--purple-dark);
  font-weight: 500;
}

.hidden-date {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

/* Summary */
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

/* Panel */
.panel {
  background: #fff;
  border-radius: 18px;
  padding: 24px;
  border: 1px solid var(--purple-soft);
  margin-bottom: 28px;
}

.panel.table {
  max-height: 520px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #e5e7eb;
}

.panel-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--purple-dark);
}

.panel-header span {
  font-size: 14px;
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
