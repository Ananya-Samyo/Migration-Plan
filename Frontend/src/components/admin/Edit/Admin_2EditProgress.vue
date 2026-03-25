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

      <div class="gap-list-section card p-4 border-0 shadow-sm"
        style="background-color: #faf7ed; border: 1px dashed #e9ce8a !important; border-radius: 15px;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 class="fw-bold mb-0" style="font-size: 1.1rem; color: #475569;">รายการ GAP Analysis</h3>
            <span :style="{ color: totalWeight > 100 ? '#dc3545' : '#6d28d9' }" class="fw-bold small">
              น้ำหนักรวม: {{ totalWeight }}%
            </span>
          </div>
        </div>

        <div class="grid-gap-layout mb-2 px-2 text-muted fw-bold" style="font-size: 0.85rem;">
          <div>รายละเอียด GAP</div>
          <div class="text-center">น้ำหนัก (%)</div>
          <div class="text-center">สถานะหลังการแก้ปัญหา / ปรับปรุงเพื่อปิด GAP</div>
          <div v-if="!isViewer"></div>
        </div>

        <div v-for="(gap, gIndex) in projectData.gaps" :key="gIndex" class="grid-gap-layout mb-2 align-items-center">
          <div>
            <input v-model="gap.detail" class="form-control shadow-sm border-0" placeholder="ระบุรายละเอียด GAP..."
              :disabled="isViewer" style="border-radius: 10px;" />
          </div>

          <div>
            <input type="number" step="1" v-model.number="gap.weight"
              class="form-control shadow-sm border-0 text-center" placeholder="0" :disabled="isViewer"
              style="border-radius: 10px;" />
          </div>

          <div>
            <select v-model="gap.status" class="form-select shadow-sm border-0" :disabled="isViewer"
              style="border-radius: 10px;">
              <option value="processing_gap">ยังไม่ปิด GAP</option>
              <option value="complete_gap">ปิด GAP เสร็จแล้ว</option>
              <option value="acceptable_gap">ไม่สามารถปิด GAP</option>
            </select>
          </div>

          <div v-if="!isViewer" class="text-center">
            <button class="btn btn-link text-danger p-0 border-0" @click="removeGap(gIndex)">✕</button>
          </div>
        </div>

        <div v-if="!isViewer" class="d-flex justify-content-center mt-3">
          <button @click="addGap" class="btn btn-purple-bright">
            + เพิ่มรายการ GAP
          </button>
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

      <hr class="my-5 border-dashed">

      <h2 class="section-title text-primary mb-4">
        3. ข้อมูลการดำเนินงานและปัญหาอุปสรรค (สำหรับเรียกดูเท่านั้น)
      </h2>

      <div class="operation-section border rounded p-4 mb-4 bg-white shadow-sm">

        <div class="field mb-3">
          <label class="fw-bold mb-1">สถานะหลังการแก้ปัญหา / ปรับปรุงเพื่อปิด GAP</label>
          <textarea class="form-control bg-light" rows="3" readonly disabled
            v-model="projectData.evaluation.actual_outcome"
            placeholder="ไม่มีข้อมูลรายละเอียดผลการดำเนินงาน"></textarea>
        </div>

        <div class="row mb-3">
          <div class="col-md-6">
            <div class="field">
              <label class="fw-bold mb-1">สถานะดำเนินงาน</label>
              <div class="custom-read-only-box">
                <span v-if="projectData.evaluation.project_status === 'finish'" class="status-text success">
                  ⌛ ดำเนินการเสร็จสิ้น
                </span>
                <span v-else class="status-text processing">
                  ⏳ กำลังดำเนินการ
                </span>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="field">
              <label class="fw-bold mb-1">ข้อเสนอแนะ / รายละเอียดเพิ่มเติม</label>
              <input type="text" class="form-control bg-light" readonly disabled
                :value="projectData.evaluation.recommendation || '-'" />
            </div>
          </div>
        </div>

        <div class="gap-analysis-style-box p-3 rounded" style="background-color: #faf7ed; border: 1px dashed #e9ce8a;">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="fw-bold mb-2 text-muted">⚠️ ปัญหาอุปสรรคที่พบ</label>
              <div v-for="(prob, pIdx) in projectData.problems" :key="'p' + pIdx" class="mb-2">
                <input type="text" class="form-control bg-white border-0 shadow-sm" readonly disabled
                  :value="prob.problem_detail" />
              </div>
              <div v-if="!projectData.problems.length" class="text-muted small ms-2">ไม่มีข้อมูลปัญหาอุปสรรค</div>
            </div>

            <div class="col-md-6 mb-3">
              <label class="fw-bold mb-2 text-muted">💡 แนวทางแก้ไข</label>
              <div v-for="(sol, sIdx) in projectData.solutions" :key="'s' + sIdx" class="mb-2">
                <input type="text" class="form-control bg-white border-0 shadow-sm" readonly disabled
                  :value="sol.solution_detail" />
              </div>
              <div v-if="!projectData.solutions.length" class="text-muted small ms-2">ไม่มีข้อมูลแนวทางแก้ไข</div>
            </div>
          </div>
        </div>
      </div>
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
  gaps: [],
  evaluation: {
    actual_outcome: '',
    project_status: 'processing',
    recommendation: ''
  },
  problems: [],
  solutions: []
})

const totalWeight = computed(() => {
  return projectData.value.gaps.reduce((sum, g) => {
    const weight = Math.floor(Number(g.weight || 0));
    return sum + weight;
  }, 0)
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
        gaps: data.gaps && data.gaps.length > 0
          ? data.gaps.map(g => ({
            ...g,
            weight: Math.floor(Number(g.weight || 0)) 
          }))
          : [{ detail: '', weight: 0, status: 'processing_gap' }],
        evaluation: {
          actual_outcome: data.actual_outcome || '',
          project_status: data.project_status || 'processing',
          recommendation: data.recommendation || ''
        },
        problems: data.problems || [],
        solutions: data.solutions || []
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