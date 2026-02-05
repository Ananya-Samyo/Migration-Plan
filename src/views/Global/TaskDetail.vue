<template>
  <div class="page">

    <!-- Header -->
    <div class="page-header">
      <button class="back" @click="router.back()">← ย้อนกลับ</button>
      <h1>รายละเอียดงาน</h1>
    </div>

    <!-- Not found -->
    <div v-if="!task" class="not-found">
      ไม่พบข้อมูลงาน
    </div>

    <!-- Card -->
    <div v-else class="card">

      <!-- Card Header -->
      <div class="card-header">
        <h2>{{ task.title }}</h2>

        <span
          class="status"
          :style="{ backgroundColor: statusStyle.bg, color: statusStyle.text }"
        >
          {{ statusText }}
        </span>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Info -->
      <div class="info">
        <div class="info-item">
          <span class="label">วันที่เริ่มต้น</span>
          <span class="value">{{ formatThaiDate(task.startDate) }}</span>
        </div>

        <div class="info-item">
          <span class="label">วันที่สิ้นสุด</span>
          <span class="value">{{ formatThaiDate(task.endDate) }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tasks } from '../../data/tasks'
import '../../assets/Global/css/TaskDetail.css'

const route = useRoute()
const router = useRouter()

const task = computed(() =>
  tasks.find(t => t.id === Number(route.params.id))
)

/* ===============================
   Status Style
================================ */
const statusStyle = computed(() => {
  if (!task.value) return { bg: '#e5e7eb', text: '#374151' }

  switch (task.value.status) {
    case 'Completed':
      return { bg: '#dcfce7', text: '#15803d' }
    case 'In Progress':
      return { bg: '#ede9fe', text: '#6d28d9' }
    case 'Overdue':
      return { bg: '#fee2e2', text: '#b91c1c' }
    default:
      return { bg: '#e5e7eb', text: '#374151' }
  }
})

const statusText = computed(() => {
  if (!task.value) return '-'
  switch (task.value.status) {
    case 'Completed':
      return 'ปิด GAP เสร็จแล้ว'
    case 'In Progress':
      return 'ยังไม่ปิด GAP'
    case 'Overdue':
      return 'ไม่สามารถปิด GAP แต่ยอมรับได้'
    default:
      return task.value.status
  }
})

const formatThaiDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const day = d.getDate()
  const month = d.toLocaleDateString('th-TH', { month: 'long' })
  const year = d.getFullYear() + 543
  return `${day} ${month} ${year}`
}
</script>