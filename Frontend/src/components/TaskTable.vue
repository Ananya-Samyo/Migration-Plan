<template>
  <div class="table-container">
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
            v-for="task in paginatedTasks"
            :key="task.scope_id"
            @click="goDetail(task.scope_id)"
          >
            <td class="title">
              {{ task.title }}
            </td>

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
          
          <tr v-if="paginatedTasks.length === 0">
            <td colspan="3" style="text-align: center; padding: 20px; color: #999;">
              ไม่มีรายการงานในช่วงนี้
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button 
        class="page-btn" 
        @click="prevPage" 
        :disabled="currentPage === 1"
      >
        &lt; ก่อนหน้า
      </button>

      <span class="page-info">
        หน้า {{ currentPage }} จาก {{ totalPages }}
      </span>

      <button 
        class="page-btn" 
        @click="nextPage" 
        :disabled="currentPage === totalPages"
      >
        ถัดไป &gt;
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue' // ✅ เพิ่ม ref, watch
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
      scope_id:
        task.scope_id ??
        task.project_scope_id ??
        task.scopeId ??
        task.id
    }))
    .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
})

/* ===============================
   ✅ PAGINATION LOGIC (เพิ่มใหม่)
================================ */
const currentPage = ref(1)
const itemsPerPage = 3 // กำหนดจำนวนแถวต่อหน้าตรงนี้

// คำนวณจำนวนหน้าทั้งหมด
const totalPages = computed(() => {
  return Math.ceil(sortedTasks.value.length / itemsPerPage) || 1
})

// ตัดข้อมูลมาแสดงเฉพาะหน้าปัจจุบัน
const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sortedTasks.value.slice(start, end)
})

// ฟังก์ชันเปลี่ยนหน้า
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

// ถ้ามีการเปลี่ยน Filter หรือ Data ให้รีเซ็ตกลับไปหน้า 1
watch(() => props.tasks, () => {
  currentPage.value = 1
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
.table-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-wrapper {
  overflow-x: auto;
  min-height: 205px;
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

/* ✅ CSS สำหรับ Pagination */
.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
}

.page-info {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #334155;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8fafc;
}
</style>