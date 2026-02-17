<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>ขอบเขตงาน</th>
          <th>สถานะ</th>
          <th>ความคืบหน้าการดำเนินงาน</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="task in sortedTasks"
          :key="task.scope_id"
          @click="goDetail(task.scope_id)"
        >
          <!-- ชื่องาน -->
          <td class="title">
            {{ task.title }}
          </td>

          <!-- สถานะ -->
          <td>
            <span
              class="status"
              :style="{
                backgroundColor: statusColor(task.status).bg,
                color: statusColor(task.status).text
              }"
            >
              {{ statusText(task.status) }}
            </span>
          </td>

          <!-- ความคืบหน้า -->
          <td>
            <div class="progress-wrapper">
              <div class="progress-bar">
                <div
                  v-if="normalizeProgress(task.progress_percent, task.status) > 0"
                  class="progress-fill"
                  :style="{
                    width: progressWidth(task.progress_percent, task.status),
                    backgroundColor: progressColor(
                      normalizeProgress(task.progress_percent, task.status)
                    )
                  }"
                ></div>
              </div>

              <span class="progress-text">
                {{ normalizeProgress(task.progress_percent, task.status) }}%
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

/* ===============================
   PROPS
================================ */
const props = defineProps({
  tasks: {
    type: Array,
    required: true
  }
})

const router = useRouter()

/* ===============================
   Navigation
================================ */
const goDetail = (scopeId) => {
  if (!scopeId) {
    console.error('❌ scope_id is missing')
    return
  }

  router.push({
    name: 'AdminScopeProject',
    params: { scope_id: scopeId }
  })
}

/* ===============================
   Normalize + Sorting
================================ */
const sortedTasks = computed(() => {
  return props.tasks
    .map(task => ({
      ...task,
      // กัน backend ส่งชื่อ field ไม่ตรง
      scope_id:
        task.scope_id ??
        task.project_scope_id ??
        task.scopeId ??
        task.id
    }))
    .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
})

/* ===============================
   Progress Logic
================================ */
const normalizeProgress = (value, status) => {
  if (
    status === 'complete_gap' ||
    status === 'closed' ||
    status === 'Completed'
  ) {
    return 100
  }

  if (value === null || value === undefined || value === '') {
    return 0
  }

  const num = Number(value)
  if (isNaN(num) || num < 0) return 0
  if (num > 100) return 100

  return num
}

const progressWidth = (value, status) => {
  const v = normalizeProgress(value, status)
  return v === 0 ? '0%' : v + '%'
}

/* ===============================
   Status Color
================================ */
const statusColor = (status) => {
  switch (status) {
    case 'complete_gap':
    case 'closed':
    case 'Completed':
      return { bg: '#dcfce7', text: '#15803d' }

    case 'processing_gap':
    case 'open':
    case 'In Progress':
      return { bg: '#ede9fe', text: '#6d28d9' }

    case 'acceptable_gap':
    case 'acceptable':
    case 'Overdue':
      return { bg: '#fee2e2', text: '#b91c1c' }

    default:
      return { bg: '#e5e7eb', text: '#374151' }
  }
}

/* ===============================
   Status Text (TH)
================================ */
const statusText = (status) => {
  switch (status) {
    case 'processing_gap':
      return 'อยู่ระหว่างดำเนินการ'

    case 'complete_gap':
      return 'ปิด GAP เสร็จแล้ว'

    case 'acceptable_gap':
      return 'ไม่สามารถปิด GAP แต่ยอมรับได้'

    case 'closed':
    case 'Completed':
      return 'ปิด GAP เสร็จแล้ว'

    case 'open':
    case 'In Progress':
      return 'ยังไม่ปิด GAP'

    default:
      return status
  }
}

/* ===============================
   Progress Color
================================ */
const progressColor = (value) => {
  if (value === 0) return 'transparent'
  if (value < 50) return '#ef4444'
  if (value < 100) return '#6d28d9'
  return '#16a34a'
}
</script>

<style scoped>
.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  padding: 16px 14px;
  font-size: 14px;
  color: #64748b;
  border-bottom: 2px solid #f1f5f9;
  font-weight: 700;
}

td {
  vertical-align: middle;
  padding: 16px 14px;
  font-size: 14px;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
}

tr {
  cursor: pointer;
  transition: background 0.2s ease;
}

tr:hover {
  background: #f8faff;
}

.title {
  font-weight: 600;
}

.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 220px;
  padding: 10px 16px;

  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;

  line-height: 1.4;       
  text-align: center;

  white-space: nowrap;    
  word-break: keep-all;    
}


.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  font-weight: 700;
}
</style>
