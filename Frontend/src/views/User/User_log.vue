<template>
  <div class="main-container">
    <header class="top-bar">
      <h1 class="page-title">ประวัติการบันทึกงานของฉัน (My Change Logs)</h1>
    </header>

    <div class="filter-bar">
      <div class="date-group">
        <label>ตั้งแต่วันที่:</label>
        <input type="date" v-model="filters.from" />
        <label>ถึง:</label>
        <input type="date" v-model="filters.to" />
      </div>

      <input
        type="text"
        v-model="filters.keyword"
        placeholder="ค้นหาชื่อ Scope หรือ แผนงาน"
        style="min-width: 300px;"
      />
    </div>

    <table class="modern-table">
      <thead>
        <tr>
          <th style="width: 15%">วัน-เวลา</th>
          <th style="width: 25%">ขอบเขตงาน (Scope)</th>
          <th style="width: 30%">แผนงาน (Project)</th>
          <th style="width: 20%">หน่วยงาน</th>
          <th style="width: 10%"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="logs.length === 0">
          <td colspan="5" class="text-center">ไม่พบประวัติการแก้ไขข้อมูล</td>
        </tr>
        <tr v-for="log in logs" :key="log.id">
          <td>{{ formatThaiDate(log.date) }}</td>
          <td>{{ log.scope || '-' }}</td>
          <td>{{ log.project || '-' }}</td>
          <td>{{ log.department || '-' }}</td> <td>
            <button class="btn-detail" @click="openDetail(log.id)">
              ดูรายละเอียด
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>รายละเอียดการเปลี่ยนแปลง</h3>
          <button class="btn-close-icon" @click="showModal = false">×</button>
        </div>
        
        <div class="modal-body">
          <div class="log-info">
             <p><strong>แผนงาน:</strong> {{ selectedLog.project_plan_name }}</p>
             <p><strong>เมื่อ:</strong> {{ formatThaiDate(selectedLog.change_date) }}</p>
          </div>

          <table class="detail-table">
            <thead>
              <tr>
                <th>รายการที่แก้ไข</th>
                <th class="old-val">ค่าเดิม</th>
                <th class="new-val">ค่าใหม่</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!selectedLog.changes || selectedLog.changes.length === 0">
                <td colspan="3" style="text-align:center; padding: 20px; color: #999;">
                  ไม่มีรายละเอียดฟิลด์ที่เปลี่ยนแปลง
                </td>
              </tr>
              <tr v-for="(c, i) in selectedLog.changes" :key="i">
                <td>{{ c.field_name }}</td>
                <td class="old-val">{{ c.before_value || '-' }}</td>
                <td class="new-val">{{ c.after_value || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-footer">
          <button class="btn-close" @click="showModal = false">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import '../../assets/Admin/css/Admin_log.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const logs = ref([])
const showModal = ref(false)
const selectedLog = ref({}) // เก็บ object เต็มๆ จาก API detail

const filters = ref({
  from: '',
  to: '',
  keyword: '' // ไม่ต้องส่ง department_id แล้ว
})

// ✅ ฟังก์ชันช่วยดึง Token (สำคัญมาก)
const getAuthHeader = () => {
  const token = localStorage.getItem('token') // หรือ sessionStorage แล้วแต่โปรเจกต์คุณ
  return { 
    headers: { Authorization: `Bearer ${token}` } 
  }
}

// 1. โหลดรายการ Log (User)
const loadLogs = async () => {
  try {
    // ยิงไปที่ /users/change-logs แทน /admin
    const res = await axios.get(`${API_BASE}/users/change-logs`, {
      params: {
        date: filters.value.from, // Backend รับค่า date ตัวเดียว (หรือจะแก้ให้รับ range ก็ได้)
        keyword: filters.value.keyword
      },
      ...getAuthHeader() // ✅ แนบ Token
    })

    // Map ข้อมูลให้ตรงกับตาราง
    logs.value = res.data.map(r => ({
      id: r.log_id,
      date: r.change_date,
      scope: r.scope_name,
      project: r.project_plan_name,
      department: r.department_name
    }))
  } catch (err) {
    console.error('Error loading logs:', err)
    if(err.response?.status === 401) alert('กรุณาเข้าสู่ระบบใหม่')
  }
}

// 2. โหลดรายละเอียด (User Detail)
const openDetail = async (logId) => {
  try {
    const res = await axios.get(`${API_BASE}/user/change-logs/${logId}`, {
      ...getAuthHeader() // ✅ แนบ Token
    })

    // Backend ส่งกลับมาเป็น { ...logData, changes: [...] }
    selectedLog.value = res.data
    showModal.value = true
  } catch (err) {
    console.error('Error loading detail:', err)
    alert('ไม่สามารถโหลดรายละเอียดได้')
  }
}

const formatThaiDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

onMounted(() => {
  loadLogs()
})

watch(filters, () => {
  // ใส่ Debounce นิดหน่อยก็ได้ถ้าต้องการ
  setTimeout(() => loadLogs(), 500)
}, { deep: true })
</script>