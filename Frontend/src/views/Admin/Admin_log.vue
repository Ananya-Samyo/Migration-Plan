<template>
  <div class="main-container">
    <header class="top-bar">
      <h1 class="page-title">บันทึกการเปลี่ยนแปลงข้อมูล (Change Log)</h1>
    </header>

    <div class="filter-bar">
      <div class="date-group">
        <label>ตั้งแต่วันที่:</label>
        <input type="date" v-model="filters.from" />
        <label>ถึง:</label>
        <input type="date" v-model="filters.to" />
      </div>

      <select v-model="filters.department_id">
        <option value="">ทุกหน่วยงาน</option>
        <option v-for="d in departments" :key="d.id" :value="d.id">
          {{ d.name }}
        </option>
      </select>

      <input
        type="text"
        v-model="filters.keyword"
        placeholder="ค้นหา scope / แผนงาน / ผู้แก้ไข"
      />
    </div>

    <table class="modern-table">
      <thead>
        <tr>
          <th>วัน-เวลาที่แก้ไข</th>
          <th>ขอบเขตงาน</th>
          <th>แผนงาน</th>
          <th>ผู้แก้ไข</th>
          <th>หน่วยงาน</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="logs.length === 0">
          <td colspan="6" class="text-center">ไม่พบข้อมูลบันทึกการเปลี่ยนแปลง</td>
        </tr>
        <tr v-for="log in logs" :key="log.id">
          <td>{{ formatThaiDate(log.date) }}</td>
          <td>{{ log.scope || '-' }}</td>
          <td>{{ log.project || '-' }}</td>
          <td>{{ log.owner }}</td>
          <td>{{ log.department }}</td>
          <td>
            <button class="btn-detail" @click="openDetail(log)">
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
             <p><strong>แก้ไขโดย:</strong> {{ selectedLog.owner }} ({{ selectedLog.department }})</p>
             <p><strong>เมื่อ:</strong> {{ formatThaiDate(selectedLog.date) }}</p>
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
              <tr v-if="selectedLog.changes.length === 0">
                <td colspan="3" style="text-align:center; padding: 20px;">
                  ไม่มีรายละเอียดฟิลด์ที่เปลี่ยนแปลง
                </td>
              </tr>
              <tr v-for="(c, i) in selectedLog.changes" :key="i">
                <td>{{ c.field }}</td>
                <td class="old-val">{{ c.before || '-' }}</td>
                <td class="new-val">{{ c.after || '-' }}</td>
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

// ดึง API Base URL จาก Environment Variable
const API = import.meta.env.VITE_API_BASE_URL

const logs = ref([])
const departments = ref([])
const showModal = ref(false)
const selectedLog = ref({ changes: [] })

const filters = ref({
  from: '',
  to: '',
  department_id: '',
  keyword: ''
})

// โหลดรายการ Log
const loadLogs = async () => {
  try {
    const res = await axios.get(`${API}/admin/change-logs`, {
      params: filters.value
    })

    logs.value = res.data.map(r => ({
      id: r.log_id,
      date: r.change_date,
      scope: r.scope_name,
      project: r.project_plan_name,
      owner: r.user_name,
      department: r.department_name
    }))
  } catch (err) {
    console.error('Error loading logs:', err)
  }
}

// โหลดรายชื่อแผนก
const loadDepartments = async () => {
  try {
    const res = await axios.get(`${API}/admin/departments`)
    departments.value = res.data
  } catch (err) {
    console.error('Error loading departments:', err)
  }
}

// เปิดดูรายละเอียด
const openDetail = async (log) => {
  try {
    const res = await axios.get(`${API}/admin/change-logs/${log.id}`)

    selectedLog.value = {
      ...log,
      changes: res.data.changes ? res.data.changes.map(d => ({
        field: d.field_name,
        before: d.before_value,
        after: d.after_value
      })) : []
    }

    showModal.value = true
  } catch (err) {
    console.error('Error loading detail:', err)
    alert('ไม่สามารถโหลดรายละเอียดได้')
  }
}

// จัดรูปแบบวันที่และเวลาไทย
const formatThaiDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadDepartments()
  loadLogs()
})

// โหลดข้อมูลใหม่เมื่อมีการเปลี่ยน filter
watch(filters, () => {
  loadLogs()
}, { deep: true })
</script>