<template>
  <div class="main-container">
    <header class="top-bar">
      <h1 class="page-title">บันทึกการเปลี่ยนแปลงข้อมูล (Change Log)</h1>
    </header>

    <!-- Filters -->
    <div class="filter-bar">
      <input type="date" v-model="filters.from" />
      <input type="date" v-model="filters.to" />

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

    <!-- Table -->
    <table class="modern-table">
      <thead>
        <tr>
          <th>วันที่แก้ไข</th>
          <th>ขอบเขตงาน</th>
          <th>แผนงาน</th>
          <th>ผู้แก้ไข</th>
          <th>หน่วยงาน</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in logs" :key="log.id">
          <td>{{ formatThaiDate(log.date) }}</td>
          <td>{{ log.scope }}</td>
          <td>{{ log.project }}</td>
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

    <!-- Detail Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal">
        <h3>รายละเอียดการเปลี่ยนแปลง</h3>

        <table class="detail-table">
          <thead>
            <tr>
              <th>รายการ</th>
              <th>ก่อนแก้ไข</th>
              <th>หลังแก้ไข</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(c, i) in selectedLog.changes" :key="i">
              <td>{{ c.field }}</td>
              <td>{{ c.before }}</td>
              <td>{{ c.after }}</td>
            </tr>
          </tbody>
        </table>

        <button class="btn-close" @click="showModal = false">ปิด</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'

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

const loadLogs = async () => {
  const res = await axios.get('/api/admin/change-logs', {
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
}

const loadDepartments = async () => {
  const res = await axios.get('/api/admin/departments')
  departments.value = res.data
}

const openDetail = async (log) => {
  const res = await axios.get(`/api/admin/change-logs/${log.id}`)

  selectedLog.value = {
    ...log,
    changes: res.data.map(d => ({
      field: d.field_name,
      before: d.before_value,
      after: d.after_value
    }))
  }

  showModal.value = true
}

const formatThaiDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  loadDepartments()
  loadLogs()
})

watch(filters, loadLogs, { deep: true })
</script>