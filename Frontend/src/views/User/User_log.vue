<template>
  <div class="main-container">
    <header class="top-bar">
      <div class="left-head">
        <h1 class="page-title">ประวัติการบันทึกงาน</h1>
      </div>
    </header>

    <div class="filter-bar">
      <div class="date-group">
        <label>ตั้งแต่วันที่:</label>
        <input 
          type="date" 
          v-model="filters.from" 
          :max="today" 
        />
        <label>ถึง:</label>
        <input 
          type="date" 
          v-model="filters.to" 
          :max="today"
          :min="filters.from" 
        />
      </div>

      <div class="search-group">
        <input type="text" v-model="filters.keyword" placeholder="ค้นหา scope / แผนงาน..." />
        <button class="btn-clear" @click="clearFilters" v-if="hasFilters">
          ล้างการกรอง
        </button>
      </div>
    </div>

    <table class="modern-table">
      <thead>
        <tr>
          <th>วัน-เวลาที่แก้ไข</th>
          <th>ขอบเขตงาน</th>
          <th>แผนงาน</th>
          <th>หน่วยงาน</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="paginatedLogs.length === 0">
          <td colspan="5" class="text-center">ไม่พบข้อมูลบันทึกการเปลี่ยนแปลง</td>
        </tr>
        <tr v-for="log in paginatedLogs" :key="log.id">
          <td data-label="วัน-เวลาที่แก้ไข">{{ formatThaiDate(log.date) }}</td>
          <td data-label="ขอบเขตงาน">{{ log.scope || '-' }}</td>
          <td data-label="แผนงาน">{{ log.project || '-' }}</td>
          <td data-label="หน่วยงาน">{{ log.department }}</td>
          <td>
            <button class="btn-detail" @click="openDetail(log)">
              ดูรายละเอียด
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination-container" v-if="totalPages > 1">
      <button 
        class="btn-page" 
        :disabled="currentPage === 1" 
        @click="changePage(currentPage - 1)"
      >
        &lt; ย้อนกลับ
      </button>

      <div class="page-numbers">
        <span 
          v-for="page in totalPages" 
          :key="page" 
          :class="['page-number', { active: currentPage === page }]"
          @click="changePage(page)"
        >
          {{ page }}
        </span>
      </div>

      <button 
        class="btn-page" 
        :disabled="currentPage === totalPages" 
        @click="changePage(currentPage + 1)"
      >
        ถัดไป &gt;
      </button>
    </div>

    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>รายละเอียดการเปลี่ยนแปลง</h3>
          <button class="btn-close-icon" @click="showModal = false">×</button>
        </div>

        <div class="modal-body">
          <div class="log-info">
            <p><strong>แผนงาน:</strong> {{ selectedLog.project }}</p>
            <p><strong>เมื่อ:</strong> {{ formatThaiDate(selectedLog.date) }}</p>
          </div>

          <table class="detail-table">
            <thead>
              <tr>
                <th>รายการที่แก้ไข</th>
                <th>ค่าเดิม</th>
                <th>ค่าใหม่</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!selectedLog.changes || selectedLog.changes.length === 0">
                <td colspan="3" class="no-detail-text">
                  ไม่มีรายละเอียดฟิลด์ที่เปลี่ยนแปลง
                </td>
              </tr>
              <tr v-for="(c, i) in selectedLog.changes" :key="i">
                <td><strong>{{ c.field }}</strong></td>
                <td><span class="old-val">{{ c.before || '-' }}</span></td>
                <td><span class="new-val">{{ c.after || '-' }}</span></td>
              </tr>
            </tbody>
          </table>

          <div class="attachment-section">
            <h4 class="section-title">หลักฐานที่แนบ</h4>
            <div v-if="selectedLog.attachments && selectedLog.attachments.length > 0" class="attachment-list">
              <div v-for="(file, idx) in selectedLog.attachments" :key="idx" class="file-item">
                <span class="file-icon">📄</span>
                <a :href="file.file_path" target="_blank" class="file-link">
                  ดูไฟล์แนบที่ {{ idx + 1 }} ({{ file.file_type }})
                </a>
              </div>
            </div>
            <div v-else class="no-data-box">
              ไม่มีหลักฐานที่แนบ
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-close" @click="showModal = false">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import axios from 'axios'
import '../../assets/Admin/css/Admin_log.css' 

const API = import.meta.env.VITE_API_BASE_URL

const logs = ref([])
const showModal = ref(false)
const selectedLog = ref({ changes: [], attachments: [] })

// Pagination State
const currentPage = ref(1)
const itemsPerPage = 10 

const filters = ref({
  from: '',
  to: '',
  keyword: ''
})

/* --- Auth Header --- */
const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return {
    headers: { Authorization: `Bearer ${token}` }
  }
}

// 1. แปลชื่อหัวข้อฟิลด์
const translateField = (field) => {
  const dict = {
    'status': 'สถานะการดำเนินงาน', 
    'progress_percent': 'ความก้าวหน้า',
    'status_id': 'สถานะการดำเนินงาน',
    'status_code': 'สถานะ',
    'details': 'รายละเอียดกิจกรรม',
    'problems': 'ปัญหาและอุปสรรค',
    'solutions': 'แนวทางแก้ไข',
    'actual_outcome': 'ผลการดำเนินงานจริง',
    'evaluation_status': 'สถานะการประเมิน',
    'edit_reason': 'เหตุผลการแก้ไข'
  }
  return dict[field] || field
}

// 2. แปลค่าจาก Database เป็นภาษาไทยที่อ่านง่าย
const translateValue = (field, value) => {
  if (value === null || value === undefined || value === '' || value === '-') return '-'

  // ปรับเงื่อนไขให้เช็กคำว่า 'status' เพิ่มเข้าไปด้วย
  const statusFields = ['status', 'status_id', 'status_code', 'evaluation_status'];
  
  if (statusFields.includes(field)) {
    const statusDict = {
      '1': 'กำลังดำเนินการ',
      '2': 'ดำเนินการเสร็จสิ้น',
      '3': 'ยอมรับผลลัพธ์แล้ว',
      'processing_gap': 'กำลังดำเนินการ', 
      'complete_gap': 'ดำเนินการเสร็จสิ้น', 
      'acceptable_gap': 'ไม่สามารถปิด GAP แต่ยอมรับได้'
    }
    return statusDict[value] || value
  }

  if (field === 'progress_percent') {
    return `${value}%`
  }

  return value
}

const formatThaiDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

/* --- Computed Logic --- */
const hasFilters = computed(() => filters.value.from || filters.value.to || filters.value.keyword)
const totalPages = computed(() => Math.ceil(logs.value.length / itemsPerPage) || 1)
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return logs.value.slice(start, start + itemsPerPage)
})
const today = computed(() => new Date().toISOString().split('T')[0])

/* --- Core Functions (API) --- */

const loadLogs = async () => {
  try {
    const res = await axios.get(`${API}/api/user/change-logs`, {
      params: filters.value,
      ...getAuthHeader()
    })
    
    logs.value = res.data.map(r => ({
      id: r.log_id,
      user: r.user_id,
      date: r.change_date,
      type: r.change_type, 
      scope: r.scope_name,
      project: r.project_plan_name,
      department: r.department_name
    }))
  } catch (err) {
    console.error('Error loading logs:', err)
  }
}

const openDetail = async (log) => {
  try {
    const res = await axios.get(`${API}/api/user/change-logs/${log.id}`, getAuthHeader())
    
    selectedLog.value = {
      ...log,
      changes: res.data.changes ? res.data.changes.map(d => ({
        field: translateField(d.field_name),
        before: translateValue(d.field_name, d.before_value), 
        after: translateValue(d.field_name, d.after_value)
      })) : [],
      attachments: res.data.attachments || []
    }
    showModal.value = true
  } catch (err) {
    console.error('Error loading detail:', err)
  }
}

const clearFilters = () => {
  filters.value = { from: '', to: '', keyword: '' }
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

/* --- Lifecycle & Watchers --- */

onMounted(() => loadLogs())

watch(filters, () => {
  currentPage.value = 1
  loadLogs()
}, { deep: true })
</script>