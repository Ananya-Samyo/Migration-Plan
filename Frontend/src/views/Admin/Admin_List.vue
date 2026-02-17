<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <h1>รายชื่อผู้ดูแลระบบ</h1>

      <button class="btn-primary" @click="openAdd">
        + เพิ่มผู้ดูแล
      </button>
    </div>

    <!-- Card -->
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>ชื่อ</th>
            <th>กอง</th>
            <th>อีเมล</th>
            <th>จัดการ</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(admin, index) in admins" :key="admin.id">
            <td>{{ index + 1 }}</td>
            <td>{{ admin.name }}</td>
            <td>{{ admin.department || '-' }}</td>
            <td>{{ admin.email }}</td>
            <td class="actions">
              <button class="btn-edit" @click="openEdit(admin)">แก้ไข</button>
              <button class="btn-delete" @click="removeAdmin(admin.id)">ลบ</button>
            </td>
          </tr>

          <tr v-if="admins.length === 0">
            <td colspan="5" class="empty">ไม่มีข้อมูล</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal">
        <h2>{{ isEdit ? 'แก้ไขผู้ดูแล' : 'เพิ่มผู้ดูแล' }}</h2>

        <div class="form-group">
          <label>ชื่อ</label>
          <input v-model="form.name" type="text" />
        </div>

        <div class="form-group">
          <label>กอง</label>
          <select v-model="form.department">
            <option value="">-- เลือกกอง --</option>
            <option
              v-for="dept in departments"
              :key="dept.department_id"
              :value="dept.department_name"
            >
              {{ dept.department_name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>อีเมล</label>
          <input v-model="form.email" type="email" />
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

/* ===============================
   API CONFIG
================================ */
const BASE_API = import.meta.env.VITE_API_BASE_URL

const ADMIN_API = `${BASE_API}/admin/users` 
const DEPT_API  = `${BASE_API}/departments`

/* ===============================
   STATE
================================ */
const admins = ref([])
const departments = ref([])

const showModal = ref(false)
const isEdit = ref(false)

const form = ref({
  id: null,
  name: '',
  department: '',
  email: '',
  role: 'ผู้ดูแลระบบ'
})

/* ===============================
   LOAD DATA
================================ */
const loadAdmins = async () => {
  try {
    const res = await fetch(ADMIN_API)
    admins.value = await res.json()
  } catch (err) {
    console.error(err)
    Swal.fire('ผิดพลาด', 'โหลดข้อมูลผู้ดูแลไม่สำเร็จ', 'error')
  }
}

const loadDepartments = async () => {
  try {
    const res = await fetch(DEPT_API)
    departments.value = await res.json()
  } catch (err) {
    console.error(err)
    Swal.fire('ผิดพลาด', 'โหลดข้อมูลกองไม่สำเร็จ', 'error')
  }
}

onMounted(() => {
  loadAdmins()
  loadDepartments()
})

/* ===============================
   ADD
================================ */
const openAdd = () => {
  isEdit.value = false
  form.value = {
    id: null,
    name: '',
    department: '',
    email: '',
    role: 'ผู้ดูแลระบบ'
  }
  showModal.value = true
}

/* ===============================
   EDIT
================================ */
const openEdit = (admin) => {
  isEdit.value = true
  form.value = { ...admin }
  showModal.value = true
}

/* ===============================
   CLOSE MODAL
================================ */
const closeModal = () => {
  showModal.value = false
}

/* ===============================
   SAVE (POST / PUT)
================================ */
const saveAdmin = async () => {
  if (!form.value.name || !form.value.department || !form.value.email) {
    Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลให้ครบ', 'error')
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
    if (isEdit.value) {
      await fetch(`${ADMIN_API}/${form.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.value)
      })
    } else {
      await fetch(ADMIN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.value)
      })
    }

    showModal.value = false
    await loadAdmins()

    Swal.fire({
      icon: 'success',
      title: 'บันทึกสำเร็จ',
      timer: 1200,
      showConfirmButton: false
    })
  } catch (err) {
    console.error(err)
    Swal.fire('ผิดพลาด', 'บันทึกไม่สำเร็จ', 'error')
  }
}

/* ===============================
   DELETE
================================ */
const removeAdmin = async (id) => {
  const admin = admins.value.find(a => a.id === id)

  const confirm = await Swal.fire({
    title: 'ยืนยันการลบ',
    text: `ต้องการลบ ${admin.name} ใช่หรือไม่`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก'
  })

  if (!confirm.isConfirmed) return

  try {
    await fetch(`${ADMIN_API}/${id}`, { method: 'DELETE' })
    await loadAdmins()

    Swal.fire({
      icon: 'success',
      title: 'ลบสำเร็จ',
      timer: 1200,
      showConfirmButton: false
    })
  } catch (err) {
    console.error(err)
    Swal.fire('ผิดพลาด', 'ลบไม่สำเร็จ', 'error')
  }
}
</script>