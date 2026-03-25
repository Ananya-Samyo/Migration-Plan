<template>
  <div class="main-wrapper" v-if="!loading">
    <header class="top-bar">
      <div class="left-head">
        <h1 class="page-title">แก้ไขรายละเอียดและความก้าวหน้า</h1>
      </div>
      <button class="btn-back-modern" @click="router.back()">
        <div class="icon-circle"> ❮ </div>
        <span class="text">ย้อนกลับ</span>
      </button>
    </header>

    <div class="card shadow-sm mb-4 p-4">
      <h2 class="section-title mb-4">1. รายละเอียดแผนงาน (Project Info)</h2>

      <div class="field mb-3">
        <label class="fw-bold">ชื่อขอบเขตงาน</label>
        <input v-model="form.scopeName" type="text" class="form-control bg-light" />
      </div>

      <div class="project-info-container border rounded p-3 mb-4 bg-white">
        <div class="grid-2">
          <div class="field">
            <label>ชื่อแผนงาน</label>
            <input v-model="projectData.projectName" type="text" :disabled="isViewer" />
          </div>
          <div class="field">
            <label>กองที่รับผิดชอบ</label>
            <select v-model="projectData.department_id" :disabled="isViewer">
              <option v-for="dept in departments" :key="dept.department_id" :value="dept.department_id">
                {{ dept.department_name }}
              </option>
            </select>
          </div>
        </div>

        <div class="field mt-3">
          <label>ผู้ประสานงานหลัก (Coordinator)</label>
          <div class="grid-3">
            <input v-model="projectData.coordinator.name" placeholder="ชื่อ-สกุล" :disabled="isViewer" />
            <input v-model="projectData.coordinator.email" placeholder="อีเมล" @blur="checkUserEmail"
              :disabled="isViewer" />
            <input v-model="projectData.coordinator.phone_number" placeholder="เบอร์โทร" :disabled="isViewer" />
          </div>
        </div>
      </div>

      <hr class="my-5">

      <h2 class="section-title text-success mb-4">2. ความก้าวหน้าและการวิเคราะห์ช่องว่าง (GAP)</h2>

      <div class="grid-2 mb-4">
        <div class="field">
          <label>วันที่เริ่มต้นแผน</label>
          <div class="custom-date-picker" @click="$refs.startDateInput.showPicker()">
            <span class="date-text">{{ formatToBuddhist(projectData.startDate) }}</span>
            <input ref="startDateInput" type="date" v-model="projectData.startDate" class="hidden-date-input"
              :disabled="isViewer" />
          </div>
        </div>

        <div class="field">
          <label>วันที่สิ้นสุดแผน</label>
          <div class="custom-date-picker" @click="$refs.endDateInput.showPicker()">
            <span class="date-text">{{ formatToBuddhist(projectData.endDate) }}</span>
            <input ref="endDateInput" type="date" v-model="projectData.endDate" class="hidden-date-input"
              :disabled="isViewer" />
          </div>
        </div>
      </div>

      <div class="gap-list-section">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <label class="fw-bold">รายการ GAP Analysis</label>
          <span :style="{ color: totalWeight > 100 ? '#dc3545' : '#6d28d9' }" class="fw-bold">
            น้ำหนักรวม: {{ totalWeight }}%
          </span>
        </div>

        <div v-for="(gap, gIndex) in projectData.gaps" :key="gIndex" class="gap-row d-flex gap-2 mb-2">
          <input v-model="gap.detail" placeholder="รายละเอียด GAP" style="flex: 3;" :disabled="isViewer" />
          <input type="number" v-model.number="gap.weight" placeholder="%" style="width: 80px;" :disabled="isViewer" />
          <select v-model="gap.status" style="flex: 1.5;" :disabled="isViewer">
            <option value="processing_gap">ยังไม่ปิด GAP</option>
            <option value="complete_gap">ปิด GAP เสร็จแล้ว</option>
            <option value="acceptable_gap">ไม่สามารถปิด GAP </option>
          </select>
          <button v-if="!isViewer" class="btn btn-outline-danger btn-sm" @click="removeGap(gIndex)">✕</button>
        </div>

        <button v-if="!isViewer" @click="addGap" class="btn-add-gap mt-2">+ เพิ่มรายการ GAP</button>
      </div>
    </div>

    <div class="action-bar sticky-bottom p-3 bg-white border-top shadow-lg mt-4"
      style="display: flex; justify-content: center; width: 100%;">

      <button v-if="!isViewer" class="btn-primary py-3 px-5" @click="handleSave" style="min-width: 250px;">
        💾 บันทึกข้อมูลการประเมิน
      </button>

      <button v-else class="btn-secondary py-3 px-5" @click="router.back()" style="min-width: 250px;">
        ย้อนกลับ
      </button>

    </div>
  </div>
  <div v-else class="loading-screen text-center p-5">กำลังโหลดข้อมูล...</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'

import '../../../assets/Admin/css/Admin_UnifiedStyle.css'
import '../../../assets/Admin/css/Admin_2EditProgress.css'

const route = useRoute()
const router = useRouter()
const BASE_API = import.meta.env.VITE_API_BASE_URL
const isViewer = localStorage.getItem('role') === 'viewer'

const loading = ref(true)
const departments = ref([])
const form = ref({ scopeName: '' })
const projectData = ref({
  projectName: '',
  department_id: '',
  coordinator: { name: '', email: '', phone_number: '' },
  startDate: '',
  endDate: '',
  gaps: []
})

const totalWeight = computed(() => {
  return projectData.value.gaps.reduce((sum, g) => sum + Number(g.weight || 0), 0)
})

const formatToBuddhist = (dateStr) => {
  if (!dateStr) return 'เลือกวันที่';
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

onMounted(async () => {
  try {
    const token = localStorage.getItem('token')
    // 1. โหลดข้อมูลกอง
    const dRes = await fetch(`${BASE_API}/api/departments`, { headers: { 'Authorization': `Bearer ${token}` } })
    departments.value = await dRes.json()

    // 2. โหลดข้อมูลจาก ID (ดึงข้อมูลแผนงาน + ข้อมูลโครงการ)
    const res = await fetch(`${BASE_API}/api/admin/edit-detail/${route.params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()

    if (res.ok) {
      form.value.scopeName = data.scope_name
      projectData.value = {
        id: data.project_plan_id,
        projectName: data.plan_name,
        department_id: data.department_id,
        coordinator: data.coordinator || { name: '', email: '', phone_number: '' },
        startDate: data.start_date ? data.start_date.split('T')[0] : '',
        endDate: data.end_date ? data.end_date.split('T')[0] : '',
        gaps: data.gaps && data.gaps.length > 0 ? data.gaps : [{ detail: '', weight: 0, status: 'processing_gap' }]
      }
    }
  } catch (err) {
    Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลได้', 'error')
  } finally {
    loading.value = false
  }
})

const addGap = () => projectData.value.gaps.push({ detail: '', weight: 0, status: 'processing_gap' })
const removeGap = (index) => projectData.value.gaps.splice(index, 1)

const handleSave = async () => {
  // 1. ตรวจสอบเงื่อนไขพื้นฐานก่อน (เช่น น้ำหนักรวม)
  if (totalWeight.value > 100) {
    Swal.fire({
      icon: 'error',
      title: 'น้ำหนักรวมเกินกำหนด',
      text: 'กรุณาปรับน้ำหนักรวมของ GAP Analysis ไม่ให้เกิน 100%'
    });
    return;
  }

  // 2. เปิด Popup ของ SweetAlert2 เพื่อให้กรอกเหตุผลและแนบไฟล์
  const { value: formValues } = await Swal.fire({
    title: 'ยืนยันการบันทึกข้อมูล',
    html: `
      <div style="text-align: left;">
        <label class="fw-bold">ระบุเหตุผลในการแก้ไข <span style="color:red">*</span></label>
        <textarea id="swal-reason" class="swal2-textarea" placeholder="ระบุเหตุผล..." style="margin: 10px 0; width: 90%;"></textarea>
        
        <label class="fw-bold">แนบหลักฐานการแก้ไข (ถ้ามี)</label>
        <input type="file" id="swal-file" class="swal2-file" style="margin: 10px 0; width: 90%;">
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'ยืนยันการบันทึก',
    cancelButtonText: 'ยกเลิก',
    preConfirm: () => {
      const reason = document.getElementById('swal-reason').value;
      const file = document.getElementById('swal-file').files[0];

      if (!reason) {
        Swal.showValidationMessage('กรุณาระบุเหตุผลในการแก้ไข');
        return false;
      }
      return { reason: reason, file: file };
    }
  });

  // ถ้าผู้ใช้กดยกเลิก
  if (!formValues) return;

  try {
    // แสดง Loading ระหว่างส่งข้อมูล
    Swal.fire({
      title: 'กำลังบันทึก...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // 3. เตรียมข้อมูลแบบ FormData เพื่อส่งไฟล์
    const formData = new FormData();
    formData.append('scopeName', form.value.scopeName);
    formData.append('project', JSON.stringify(projectData.value));
    formData.append('editReason', formValues.reason);
    if (formValues.file) {
      formData.append('evidenceFile', formValues.file);
    }

    const res = await fetch(`${BASE_API}/api/admin/update-all-in-one`, {
      method: 'POST',
      headers: {
        // ห้ามตั้ง Content-Type เป็น application/json เพราะเราส่ง FormData
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'บันทึกล้มเหลว');
    }

    Swal.fire('สำเร็จ', 'บันทึกข้อมูลและหลักฐานเรียบร้อย', 'success').then(() => router.back());

  } catch (err) {
    console.error(err);
    Swal.fire('Error', err.message || 'บันทึกล้มเหลว', 'error');
  }
};
</script>