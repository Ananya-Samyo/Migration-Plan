<template>
  <div class="page">
    <div class="page-header">
      <h1>จัดการผู้ใช้งาน</h1>

      <div class="header-actions">
        <span class="filter-label">กรองสิทธิ์:</span>
        <select v-model="filterRole" @change="loadAdmins(1)" class="filter-select">
          <option value="">ทั้งหมด</option>
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>

        <button class="btn-primary" @click="openAdd">
          + เพิ่มผู้ดูแล
        </button>
      </div>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>ชื่อ</th>
            <th>กอง</th>
            <th>อีเมล</th>
            <th>เบอร์โทร</th>
            <th>สิทธิ์</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(admin, index) in adminsData" :key="admin.id">
            <td>{{ ((currentPage - 1) * 10) + (index + 1) }}</td>
            <td>{{ admin.name }}</td>
            <td>{{ admin.department || '-' }}</td>
            <td>{{ admin.email }}</td>
            <td>{{ admin.phone_number || '-' }}</td>
            <td>
              <span :class="['role-badge', admin.role]">
                {{ admin.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้เข้าชม (Viewer)' }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-edit" @click="openEdit(admin)">แก้ไข</button>
              <button class="btn-delete" @click="removeAdmin(admin.id)">ลบ</button>
            </td>
          </tr>
          <tr v-if="adminsData.length === 0">
            <td colspan="7" class="empty">ไม่มีข้อมูล</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" v-if="totalPages > 1">
        <button class="btn-page" :disabled="currentPage === 1" @click="loadAdmins(currentPage - 1)">
          ก่อนหน้า
        </button>
        <span class="page-info">หน้า {{ currentPage }} / {{ totalPages }}</span>
        <button class="btn-page" :disabled="currentPage === totalPages" @click="loadAdmins(currentPage + 1)">
          ถัดไป
        </button>
      </div>
    </div>

    <div v-if="showModal" class="modal-backdrop">
      <div class="modal">
        <h2>{{ isEdit ? 'แก้ไขผู้ดูแล' : 'เพิ่มผู้ดูแล' }}</h2>

        <div class="form-group">
          <label>ชื่อ</label>
          <input v-model="form.name" type="text" />
        </div>

        <div class="form-group">
          <label>กอง</label>
          <select v-model="form.department_id">
            <option value="">-- เลือกกอง --</option>
            <option v-for="dept in departments" :key="dept.department_id" :value="dept.department_id">
              {{ dept.department_name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>อีเมล</label>
          <input v-model="form.email" type="email" />
        </div>

        <div class="form-group">
          <label>เบอร์โทรศัพท์</label>
          <input v-model="form.phone_number" type="text" placeholder="กรอกหมายเลขโทรศัพท์" />
        </div>

        <div class="form-group">
          <label>สิทธิ์การใช้งาน</label>
          <select v-model="form.role">
            <option value="admin">ผู้ดูแลระบบ (Admin)</option>
            <option value="viewer">ผู้เข้าชม (Viewer)</option>
          </select>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeModal">ยกเลิก</button>
          <button class="btn-primary" @click="saveAdmin">บันทึก</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'
import '@/assets/Admin/css/Admin_List.css'

const BASE_API = import.meta.env.VITE_API_BASE_URL
const ADMIN_API = `${BASE_API}/api/admin/users`
const DEPT_API = `${BASE_API}/api/departments`

// State Variables
const adminsData = ref([])
const departments = ref([])
const showModal = ref(false)
const isEdit = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)

const filterRole = ref('')

// Form Structure
const form = ref({
  id: null,
  name: '',
  department_id: '',
  email: '',
  phone_number: '',
  role: 'admin'
})

const getHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

const loadAdmins = async (page = 1) => {
  try {
    let url = `${ADMIN_API}?page=${page}`
    if (filterRole.value) {
      url += `&role=${filterRole.value}`
    }

    const res = await fetch(url, { headers: getHeaders() })
    const result = await res.json()

    adminsData.value = result.data || []
    currentPage.value = result.currentPage || 1
    totalPages.value = result.totalPages || 1
  } catch (err) {
    Swal.fire('ผิดพลาด', 'โหลดข้อมูลไม่สำเร็จ', 'error')
  }
}

const loadDepartments = async () => {
  try {
    const res = await fetch(DEPT_API, { headers: getHeaders() })
    departments.value = await res.json()
  } catch (err) {
    console.error('Load Dept Error:', err)
  }
}

onMounted(() => {
  loadAdmins(1)
  loadDepartments()
})

const openAdd = () => {
  isEdit.value = false
  form.value = {
    id: null,
    name: '',
    department_id: '',
    email: '',
    phone_number: '',
    role: 'admin'
  }
  showModal.value = true
}

const openEdit = (admin) => {
  isEdit.value = true
  form.value = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    phone_number: admin.phone_number || '',
    department_id: admin.department_id || '',
    role: admin.role || 'admin'
  }
  showModal.value = true
}

const closeModal = () => { showModal.value = false }

// บันทึกข้อมูล (Create / Update)
const saveAdmin = async () => {
  const name = form.value.name?.trim()
  const email = form.value.email?.trim()
  const dept_id = form.value.department_id

  if (!name || !email || !dept_id) {
    Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลและเลือกกองให้ครบถ้วน', 'warning')
    return
  }

  const confirm = await Swal.fire({
    title: 'ยืนยันการบันทึก',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    cancelButtonText: 'ยกเลิก'
  })

  if (!confirm.isConfirmed) return

  try {
    const method = isEdit.value ? 'PUT' : 'POST'
    const url = isEdit.value ? `${ADMIN_API}/${form.value.id}` : ADMIN_API

    const res = await fetch(url, {
      method: method,
      headers: getHeaders(),
      body: JSON.stringify({
        name: name,
        email: email,
        phone_number: form.value.phone_number,
        department_id: dept_id,
        role: form.value.role
      })
    })

    const result = await res.json()
    if (!res.ok) throw new Error(result.message || 'บันทึกไม่สำเร็จ')

    showModal.value = false
    // โหลดข้อมูลหน้าปัจจุบันใหม่
    await loadAdmins(currentPage.value)
    Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false })
  } catch (err) {
    Swal.fire('ผิดพลาด', err.message, 'error')
  }
}

// ลบข้อมูล
const removeAdmin = async (id) => {
  // แก้ไข: ใช้ adminsData แทน admins
  const admin = adminsData.value.find(a => a.id === id)

  const confirm = await Swal.fire({
    title: 'ยืนยันการลบ',
    text: `ต้องการลบผู้ดูแล "${admin?.name}" ใช่หรือไม่?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก'
  })

  if (!confirm.isConfirmed) return

  try {
    const res = await fetch(`${ADMIN_API}/${id}`, { method: 'DELETE', headers: getHeaders() })
    if (!res.ok) throw new Error('ลบไม่สำเร็จ')

    if (adminsData.value.length === 1 && currentPage.value > 1) {
      await loadAdmins(currentPage.value - 1)
    } else {
      await loadAdmins(currentPage.value)
    }

    Swal.fire({ icon: 'success', title: 'ลบข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false })
  } catch (err) {
    Swal.fire('ผิดพลาด', err.message, 'error')
  }
}
</script>