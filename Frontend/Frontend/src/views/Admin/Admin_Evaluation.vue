<template>
  <header class="top-bar">
    <div class="left-head">
      <h1 class="page-title">การประเมินผลประโยชน์ของแผนงาน</h1>
    </div>

    <button class="btn-back-modern" @click="goBack">
      <div class="icon-circle">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd"
            d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
        </svg>
      </div>
      <span class="text">ย้อนกลับ</span>
    </button>
  </header>

  <div class="page">
    <!-- Header -->
    <div class="card header-card">
      <div class="grid-3">
        <div>
          <label>ชื่อขอบเขตงาน</label>
          <input v-model="evaluation.scopeName" />
        </div>

        <div>
          <label>ผู้รับผิดชอบ</label>
          <input v-model="evaluation.owner" />
        </div>

        <div>
          <label>สถานะโครงการ</label>
          <select v-model="evaluation.projectStatus">
            <option value="">-- เลือก --</option>
            <option value="processing">กำลังดำเนินการ</option>
            <option value="finish">เสร็จสิ้น</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Section 1 -->
    <div class="section">
      <h2>ผลที่คาดว่าจะได้รับหลังจากทำ Low Level</h2>

      <label>วัตถุประสงค์ / ผลลัพธ์ที่คาดหวัง</label>
      <textarea v-model="evaluation.objective" />

      <label>ก่อนปรับปรุงตามแผนงาน</label>
      <textarea v-model="evaluation.beforeImprove" />

      <label>ผลที่คาดว่าจะได้รับหลังปรับปรุงตามแผน</label>
      <textarea v-model="evaluation.expectedAfter" />
    </div>

    <!-- Section 2 -->
    <div class="section readonly-section">
      <h2>ผลการดำเนินงานจริง</h2>

      <label>การประเมินผลที่ได้รับ</label>
      <select v-model="evaluation.evaluation" :disabled="evaluation.projectStatus !== 'finish'">
        <option value="">-- เลือก --</option>
        <option value="pass">เป็นไปตามที่คาดหวัง</option>
        <option value="fail">ไม่เป็นไปตามที่คาดหวัง</option>
      </select>


      <label>ผลที่ได้รับหลังดำเนินงานจริง</label>
      <textarea v-model="evaluation.actualResult" :readonly="evaluation.projectStatus !== 'finish'"></textarea>


      <div v-if="evaluation.evaluation === 'fail'">
        <label>ปัญหา / อุปสรรค</label>
        <textarea v-model="evaluation.problem" :readonly="evaluation.projectStatus !== 'finish'"></textarea>
      </div>


      <label>ข้อเสนอแนะเพื่อการปรับปรุงในอนาคต</label>
      <textarea v-model="evaluation.suggestion" :readonly="evaluation.projectStatus !== 'finish'"></textarea>

    </div>

    <button class="submit" @click="saveEvaluation">
      บันทึกการประเมินผล
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import '../../assets/Admin/css/Admin_Evaluation.css'

const router = useRouter()
const route = useRoute()
const API = import.meta.env.VITE_API_BASE_URL
const projectId = route.params.id

const evaluation = ref({
  scopeName: '',
  owner: '',
  projectStatus: '',
  objective: '',
  beforeImprove: '',
  expectedAfter: '',
  evaluation: '',
  actualResult: '',
  problem: '',
  suggestion: ''
})

const originalEvaluation = ref(null)

const hasChanged = () =>
  JSON.stringify(evaluation.value) !== JSON.stringify(originalEvaluation.value)

const goBack = () => router.back()

onMounted(async () => {
  try {
    const res = await fetch(`${API}/evaluations/${projectId}`)
    if (!res.ok) throw new Error('Fetch failed')

    const data = await res.json()
    if (!data) return

    evaluation.value = {
      scopeName: data.scope_name ?? '',
      owner: data.owner ?? '',
      projectStatus: data.project_status ?? '',
      objective: data.objective ?? '',
      beforeImprove: data.before_plan ?? '',
      expectedAfter: data.expected_outcome ?? '',
      evaluation: data.evaluation_status ?? '',
      actualResult: data.actual_outcome ?? '',
      problem: data.problem ?? '',
      suggestion: data.recommendation ?? ''
    }

    originalEvaluation.value = JSON.parse(JSON.stringify(evaluation.value))
  } catch (err) {
    console.error('Load evaluation failed:', err)
  }
})

const saveEvaluation = async () => {
  let editData = null

  if (hasChanged()) {
    const result = await Swal.fire({
      title: 'เหตุผลการแก้ไข',
      html: `
        <textarea id="reason" class="swal2-textarea" placeholder="ระบุเหตุผลการแก้ไข"></textarea>
        <input id="files" type="file" class="swal2-file" multiple />
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      preConfirm: () => {
        const reason = document.getElementById('reason').value
        const files = document.getElementById('files').files
        if (!reason) {
          Swal.showValidationMessage('ต้องระบุเหตุผลการแก้ไข')
          return
        }
        return { reason, files }
      }
    })

    if (!result.isConfirmed) return
    editData = result.value
  }

  const fd = new FormData()
  Object.entries(evaluation.value).forEach(([k, v]) => fd.append(k, v))

  if (editData) {
    fd.append('edit_reason', editData.reason)
    Array.from(editData.files).forEach(f => fd.append('attachments', f))
  }

  await fetch(`${API}/evaluations/${projectId}`, {
    method: 'PUT',
    body: fd
  })

  originalEvaluation.value = JSON.parse(JSON.stringify(evaluation.value))
  await Swal.fire('สำเร็จ', 'บันทึกการประเมินผลเรียบร้อย', 'success')
}
</script>