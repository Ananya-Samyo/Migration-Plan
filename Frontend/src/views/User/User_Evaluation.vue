<template>
  <div class="page">
    <header class="top-bar">
      <div class="left-head">
        <h1 class="page-title">การประเมินผลประโยชน์ของขอบเขตงาน</h1>
      </div>
      <button class="btn-back-modern" @click="goBack">
        <div class="icon-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
          </svg>
        </div>
        <span class="text">ย้อนกลับ</span>
      </button>
    </header>

    <div class="card">
      <div class="section-header">
          <h2><span class="icon-info">ℹ️</span> ข้อมูลแผนงาน</h2>
      </div>
      <div class="grid-layout">
        <div class="form-group full-width">
          <label>ขอบเขตงาน</label>
          <textarea v-model="scopeName" readonly rows="2"></textarea>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>ชื่อผู้รับผิดชอบ</label>
            <input v-model="owner" readonly />
          </div>
          <div class="form-group">
            <label>สถานะโครงการ</label>
            <select v-model="projectStatus">
              <option value="processing">กำลังดำเนินการ</option>
              <option value="finish">เสร็จสิ้น</option>
            </select>
          </div>
        </div>
      </div>

      <hr class="divider" />

      <div class="section">
        <h2>ผลการดำเนินงานจริง</h2>
        <div class="grid-2">
          <div class="form-group">
            <label>การประเมินผลที่ได้รับ</label>
            <select v-model="evaluation">
              <option value="pass">เป็นไปตามที่คาดหวัง</option>
              <option value="fail">ไม่เป็นไปตามที่คาดหวัง</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>ผลที่ได้รับหลังดำเนินงานจริง</label>
          <textarea v-model="actualResult" placeholder="อธิบายผลลัพธ์ที่เกิดขึ้นจริง"></textarea>
        </div>

        <transition name="fade">
          <div v-if="evaluation === 'fail'" class="sub-section">
            <h3>⚠️ ปัญหา / อุปสรรค</h3>
            <textarea v-model="problem" placeholder="ระบุปัญหาและอุปสรรคที่พบ"></textarea>
          </div>
        </transition>

        <div class="form-group">
          <label>ข้อเสนอแนะเพื่อการปรับปรุง</label>
          <textarea v-model="suggestion" placeholder="แนวทางปรับปรุงในอนาคต"></textarea>
        </div>
      </div>

      <button class="submit" @click="handleSubmit">บันทึกและส่งรายงาน</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router' 
import axios from 'axios'
import Swal from 'sweetalert2'
import '../../assets/User/User_Evaluation.css'

const route = useRoute()
const router = useRouter() 
const API = 'http://localhost:3000'
const projectId = String(route.params.id).split(':')[0]

const scopeName = ref(''); const owner = ref(''); const projectStatus = ref('processing')
const objective = ref(''); const beforeImprove = ref(''); const expectedAfter = ref('')
const evaluation = ref('pass'); const actualResult = ref(''); const problem = ref(''); const suggestion = ref('')

const goBack = () => router.back()

const fetchEvaluation = async () => {
  try {
    const res = await axios.get(`${API}/api/user/evaluations/${projectId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    const data = res.data
    scopeName.value = data.scope_name; projectStatus.value = data.project_status || 'processing'
    objective.value = data.objective || ''; beforeImprove.value = data.before_plan || ''
    expectedAfter.value = data.expected_outcome || ''; evaluation.value = data.evaluation_status || 'pass'
    actualResult.value = data.actual_outcome || ''; suggestion.value = data.recommendation || ''
    problem.value = data.problem_detail || ''
  } catch (error) { console.error("Fetch error:", error) }
}

const handleSubmit = async () => {
  const result = await Swal.fire({
    title: 'ยืนยันการบันทึกการประเมิน',
    html: `
      <div style="text-align: left">
        <label>ระบุเหตุผลการแก้ไข/ข้อมูลเพิ่มเติม:</label>
        <textarea id="reason" class="swal2-textarea" style="margin-top:5px; width: 90%;"></textarea>
        <label style="margin-top:10px; display:block;">แนบไฟล์หลักฐาน (ถ้ามี):</label>
        <input id="eval-files" type="file" class="swal2-file" multiple />
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'บันทึกและส่งอีเมล',
    preConfirm: () => ({
      reason: document.getElementById('reason').value,
      files: document.getElementById('eval-files').files
    })
  })

  if (!result.isConfirmed) return

  Swal.fire({ title: 'กำลังบันทึกและส่งอีเมล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })

  const fd = new FormData()
  fd.append('objective', objective.value); fd.append('before_plan', beforeImprove.value)
  fd.append('expected_outcome', expectedAfter.value); fd.append('actual_outcome', actualResult.value)
  fd.append('recommendation', suggestion.value); fd.append('project_status', projectStatus.value)
  fd.append('evaluation_status', evaluation.value); fd.append('problem', problem.value)
  fd.append('edit_reason', result.value.reason)
  
  if (result.value.files.length > 0) {
    Array.from(result.value.files).forEach(file => fd.append('attachments', file))
  }

  try {
    await axios.put(`${API}/api/user/evaluations/${projectId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    Swal.fire('สำเร็จ', 'บันทึกและส่งรายงานเรียบร้อยแล้ว', 'success')
  } catch (error) {
    Swal.fire('ผิดพลาด', error.response?.data?.message || 'เกิดข้อผิดพลาด', 'error')
  }
}

onMounted(fetchEvaluation)
</script>