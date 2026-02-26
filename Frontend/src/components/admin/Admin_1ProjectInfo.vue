<template>
  <div class="main-wrapper">
    <header class="top-bar">
      <div class="left-head">
        <h1 class="page-title">1. ข้อมูลแผนงาน (Step 1)</h1>
      </div>
      <button class="btn-back-modern" @click="$emit('back')">
        <div class="icon-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd"
              d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
          </svg>
        </div>
        <span class="text">ย้อนกลับ</span>
      </button>
    </header>

    <div class="card">
      <div class="field">
        <label>ชื่อขอบเขตงาน</label>
        <input v-model="form.scopeName" type="text" placeholder="กรอกชื่อขอบเขตงาน" />
      </div>

      <div v-for="(project, pIndex) in form.projects" :key="pIndex" class="project-card">
        <div class="project-header">
          <h3 style="color: var(--primary-purple);">แผนงานที่ {{ pIndex + 1 }}</h3>
          <button v-if="form.projects.length > 1" class="remove-project"
            @click="removeProject(pIndex)">ลบแผนงาน</button>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>ชื่อแผนงาน</label>
            <input v-model="project.projectName" type="text" placeholder="กรอกชื่อแผนงาน" />
          </div>
          <div class="field">
            <label>กอง</label>
            <select v-model="project.department_id" class="select-input">
              <option value="">-- เลือกกอง --</option>
              <option v-for="dept in departments" :key="dept.department_id" :value="dept.department_id">
                {{ dept.department_name }}
              </option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>ผู้ประสานงาน (หลัก)</label>
          <div class="grid-3">
            <input v-model="project.coordinator.name" type="text" placeholder="ชื่อ-สกุล" />
            <input v-model="project.coordinator.email" type="email" placeholder="อีเมล" />
            <input v-model="project.coordinator.phone_number" type="text" placeholder="เบอร์โทรศัพท์" />
          </div>
        </div>

        <div class="field">
          <label>คณะทำงาน</label>
          <div v-for="(member, mIndex) in project.teamMembers" :key="mIndex" class="team-item">
            <div class="grid-3">
              <input v-model="member.name" type="text" :placeholder="`ชื่อคนที่ ${mIndex + 1}`" />
              <input v-model="member.email" type="email" placeholder="อีเมล" />
              <input v-model="member.phone_number" type="text" placeholder="เบอร์โทรศัพท์" />
            </div>
            <button v-if="project.teamMembers.length > 1" @click="removeMember(pIndex, mIndex)">ลบ</button>
          </div>
        </div>

        <div class="field">
          <label>ผลการวิเคราะห์ช่องว่าง (GAP)</label>
          <div v-for="(gap, gIndex) in project.gaps" :key="gIndex" class="gap-item" style="margin-bottom: 10px;">
            <textarea v-model="gap.detail" placeholder="กรอกรายละเอียด GAP"></textarea>
            <button v-if="project.gaps.length > 1" class="remove-gap" @click="removeGap(pIndex, gIndex)">ลบ</button>
          </div>
          <button class="add-gap" @click="addGap(pIndex)">+ เพิ่มรายการ GAP</button>
        </div>
      </div>

      <div style="display: flex; gap: 15px; margin-top: 20px;">
        <button class="add-project" style="flex: 1;" @click="addProject">+ เพิ่มแผนงานใหม่</button>
        <button class="btn-primary" style="flex: 1;" @click="handleNext">ไปขั้นตอนถัดไป ➔</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Swal from 'sweetalert2'
import '../../assets/Admin/css/Admin_UnifiedStyle.css'

const props = defineProps(['modelValue'])
const emit = defineEmits(['next', 'back', 'update:modelValue'])

const BASE_API = import.meta.env.VITE_API_BASE_URL
const DEPT_API = `${BASE_API}/api/departments`

const departments = ref([])

// ใช้ข้อมูลจาก props ถ้ามี (เพื่อให้ย้อนกลับมาแล้วข้อมูลยังอยู่)
const form = ref(props.modelValue && props.modelValue.projects ? props.modelValue : {
  scopeName: '',
  projects: [
    {
      projectName: '',
      department_id: '',
      coordinator: { name: '', email: '', phone_number: '' },
      teamMembers: [{ name: '', email: '', phone_number: '' }],
      gaps: [{ detail: '' }],
      status: 'open'
    }
  ]
})

// คอยส่งข้อมูลกลับไปที่ MasterStepper ตลอดเวลาที่มีการเปลี่ยนแปลง
watch(form, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

onMounted(async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    Swal.fire('Session Expired', 'กรุณาเข้าสู่ระบบใหม่', 'error');
    return;
  }

  try {
    const res = await fetch(DEPT_API, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      departments.value = await res.json();
    } else if (res.status === 403) {
      console.error("403 Forbidden: ตรวจสอบว่า User นี้เป็น Admin หรือไม่");
    }
  } catch (err) {
    console.error(err);
  }
});

const addProject = () => {
  form.value.projects.push({
    projectName: '',
    department_id: '',
    coordinator: { name: '', email: '', phone_number: '' },
    teamMembers: [{ name: '', email: '', phone_number: '' }],
    gaps: [{ detail: '' }],
    status: 'open'
  })
}

const removeProject = (index) => form.value.projects.splice(index, 1)
const addMember = (pIndex) => {form.value.projects[pIndex].teamMembers.push({name: '',email: '',phone_number: ''})}
const removeMember = (pIndex, mIndex) => form.value.projects[pIndex].teamMembers.splice(mIndex, 1)
const addGap = (pIndex) => form.value.projects[pIndex].gaps.push({ detail: '' })
const removeGap = (pIndex, gIndex) => form.value.projects[pIndex].gaps.splice(gIndex, 1)

const handleNext = async () => {
  if (!form.value.scopeName) {
    return Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อขอบเขตงาน', 'warning')
  }

  try {
    Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(form.value)
    });

    const result = await res.json();

    if (res.ok && result.success) {
      Swal.close();
      emit('next', result.id);
    } else {
      throw new Error(result.message || 'บันทึกไม่สำเร็จ');
    }
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
}
</script>