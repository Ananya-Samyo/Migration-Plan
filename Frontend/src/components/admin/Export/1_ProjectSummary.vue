<template>
  <div class="step-container">
    <div class="header-section">
      <h2 class="step-title">1. การสรุปขอบเขตงาน</h2>
      <div class="badge-count">ทั้งหมด {{ filteredTasks.length }} รายการ</div>
    </div>

    <div class="modern-filter-box">
      <div class="filter-group">
        <label>ปีที่ดำเนินการ</label>
        <div class="select-wrapper">
          <select v-model="filters.year" class="modern-input">
            <option value="">ปีทั้งหมด</option>
            <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
      </div>

      <div class="filter-group">
        <label>สถานะ</label>
        <div class="select-wrapper">
          <select v-model="filters.status" class="modern-input">
            <option value="">สถานะทั้งหมด</option>
            <option value="ไม่สามารถปิด GAP แต่ยอมรับได้">ไม่สามารถปิด GAP แต่ยอมรับได้</option>
            <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
            <option value="ดำเนินการเสร็จสิ้น">ดำเนินการเสร็จสิ้น</option>
          </select>
        </div>
      </div>

      <div class="filter-group search">
        <label>ค้นหาขอบเขตงาน</label>
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" v-model="filters.search" placeholder="พิมพ์ชื่อโครงการ..." class="modern-input" />
        </div>
      </div>
    </div>

    <div class="table-container">
      <table class="modern-table">
        <thead>
          <tr>
            <th width="40" class="text-center">
              <input type="checkbox" class="modern-checkbox" @change="toggleAllOnPage" />
            </th>
            <th>ขอบเขตงาน</th>
            <th width="100" class="text-center">ปีที่ทำ</th>
            <th width="180">ความคืบหน้า</th>
            <th width="140" class="text-center">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedTasks" :key="item.id" :class="{ 'is-selected': item.selected }">
            <td class="text-center">
              <input type="checkbox" v-model="item.selected" class="modern-checkbox" @change="emitUpdate" />
            </td>
            <td class="project-title">{{ item.title }}</td>
            <td class="text-center year-text">{{ item.year }}</td>
            <td>
              <div class="progress-container">
                <div class="progress-bar-bg">
                  <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
                </div>
                <span class="progress-text">{{ item.progress }}%</span>
              </div>
            </td>
            <td class="text-center">
              <span :class="['status-chip', getStatusClass(item.statusText)]">
                {{ item.statusText }}
              </span>
            </td>
          </tr>
          <tr v-if="filteredTasks.length === 0">
            <td colspan="5" class="empty-state">
              <div class="empty-content">
                <span>📂</span>
                <p>ไม่พบข้อมูลที่ตรงกับตัวกรองของคุณ</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modern-pagination">
      <div class="pagination-info">
        แสดง <strong>{{ Math.min(itemsPerPage, paginatedTasks.length) }}</strong> จาก <strong>{{ filteredTasks.length }}</strong> รายการ
      </div>
      <div class="pagination-nav">
        <div class="page-indicator">หน้า {{ currentPage }} / {{ totalPages }}</div>
        <button class="nav-btn" @click="currentPage++" :disabled="currentPage >= totalPages">
          ถัดไป →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import '@/assets/Admin/css/Admin_Export.css'


const emit = defineEmits(['update-tasks'])

const filters = reactive({ year: '', status: '', search: '' })
const tasks = ref([])
const itemsPerPage = 5 // ✅ กำหนดหน้าละ 5 รายการ
const currentPage = ref(1)

// 1. ดึงปีที่มีในข้อมูล
const availableYears = computed(() => {
  const years = tasks.value.map(t => t.year).filter(y => y !== '-')
  return [...new Set(years)].sort((a, b) => b - a)
})

// 2. กรองข้อมูลตาม Filter (แต่ยังไม่แบ่งหน้า)
const filteredTasks = computed(() => {
  return tasks.value.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(filters.search.toLowerCase())
    const matchStatus = filters.status === '' || item.statusText === filters.status
    const matchYear = filters.year === '' || item.year.toString() === filters.year.toString()
    return matchSearch && matchStatus && matchYear
  })
})

// 3. คำนวณจำนวนหน้าทั้งหมด
const totalPages = computed(() => Math.ceil(filteredTasks.value.length / itemsPerPage) || 1)

// 4. ตัดข้อมูลมาแสดงเฉพาะหน้าที่เลือก (5 รายการ)
const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredTasks.value.slice(start, start + itemsPerPage)
})

// เมื่อมีการกรองข้อมูลใหม่ ให้กลับไปเริ่มหน้า 1
watch([() => filters.search, () => filters.status, () => filters.year], () => {
  currentPage.value = 1
})

const fetchTasksFromSystem = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/project-summary')
    tasks.value = response.data.map(item => ({ ...item, selected: false }))
    emitUpdate()
  } catch (error) {
    console.error('Error:', error)
  }
}

onMounted(fetchTasksFromSystem)

const emitUpdate = () => {
  emit('update-tasks', tasks.value)
}

// เลือก/ไม่เลือก ทั้งหมดเฉพาะในหน้าปัจจุบัน
const toggleAllOnPage = (e) => {
  paginatedTasks.value.forEach(t => t.selected = e.target.checked)
  emitUpdate()
}

const getStatusClass = (status) => {
  if (!status) return ''
  if (status.includes('ดำเนินการเสร็จสิ้น') || status.includes('เสร็จสิ้น')) return 'status-closed'
  if (status.includes('กำลัง') || status.includes('ดำเนินการ')) return 'status-pending'
  return 'status-open'
}
</script>