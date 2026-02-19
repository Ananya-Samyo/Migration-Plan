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
      <div class="header-with-btn">
        <h2>ผลที่คาดว่าจะได้รับหลังจากทำ Low Level</h2>
        <button type="button" class="btn-add-item" @click="addItem">+ เพิ่มรายการ</button>
      </div>

      <div v-for="(item, index) in evaluation.items" :key="index" class="evaluation-item-card">
        <div class="item-header">
          <span>รายการที่ {{ index + 1 }}</span>
          <button v-if="evaluation.items.length > 1" @click="removeItem(index)" class="btn-remove">ลบรายการนี้</button>
        </div>

        <label>วัตถุประสงค์ / ผลลัพธ์ที่คาดหวัง</label>
        <textarea v-model="item.objective" placeholder="ระบุวัตถุประสงค์..." />

        <label>ก่อนปรับปรุงตามแผนงาน</label>
        <textarea v-model="item.beforeImprove" placeholder="รายละเอียดก่อนปรับปรุง..." />

        <label>ผลที่คาดว่าจะได้รับหลังปรับปรุงตามแผน</label>
        <textarea v-model="item.expectedAfter" placeholder="รายละเอียดผลที่คาดหวัง..." />
      </div>
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
  <span style="display: flex; align-items: center; justify-content: center; gap: 8px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
    </svg>
    บันทึกและส่งอีเมลแจ้งเตือน
  </span>
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
  items: [
    { objective: '', beforeImprove: '', expectedAfter: '' }
  ],
  evaluation: '',
  actualResult: '',
  problem: '',
  suggestion: ''
})

const originalEvaluation = ref(null)

// ฟังก์ชันสำหรับเพิ่มรายการใหม่
const addItem = () => {
  evaluation.value.items.push({
    objective: '',
    beforeImprove: '',
    expectedAfter: ''
  })
}

// ฟังก์ชันสำหรับลบรายการ
const removeItem = (index) => {
  if (evaluation.value.items.length > 1) {
    evaluation.value.items.splice(index, 1)
  }
}

const hasChanged = () => JSON.stringify(evaluation.value) !== JSON.stringify(originalEvaluation.value)
const goBack = () => router.back()

onMounted(async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/admin/evaluations/${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 401 || res.status === 403) {
      Swal.fire('ปฏิเสธสิทธิ์', 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้ หรือ Token หมดอายุ', 'error');
      return;
    }

    const data = await res.json();
    console.log("Check Data:", data);
    if (!data) return;

    evaluation.value = {
      scopeName: data.scope_name ?? '',
      owner: data.owner ?? '',
      projectStatus: data.project_status ?? '',
      evaluation: data.evaluation_status ?? '',
      actualResult: data.actual_outcome ?? '',
      problem: data.problem ?? '',
      suggestion: data.recommendation ?? '',
      // ถ้า Backend ส่ง items มาให้ใช้ตัวนั้น ถ้าไม่มีให้เอาค่าเดี่ยวมาสร้างเป็น Array
      items: data.items || [
        { 
          objective: data.objective ?? '', 
          beforeImprove: data.before_plan ?? '', 
          expectedAfter: data.expected_outcome ?? '' 
        }
      ]
    };
    originalEvaluation.value = JSON.parse(JSON.stringify(evaluation.value))
  } catch (err) {
    console.error('Load failed', err)
  }
})

const saveEvaluation = async () => {
  let editData = null

  // 1. เช็คการแก้ไข (เหมือนเดิม)
  if (hasChanged()) {
    const result = await Swal.fire({
      title: 'เหตุผลการแก้ไข',
      html: `
        <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
            เมื่อบันทึกแล้ว ระบบจะส่งอีเมลแจ้งเตือนไปยังเจ้าของโครงการโดยอัตโนมัติ
        </p>
        <textarea id="reason" class="swal2-textarea" placeholder="ระบุเหตุผลการแก้ไข..."></textarea>
        <input id="files" type="file" class="swal2-file" multiple />
      `,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันและส่งอีเมล',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const reason = document.getElementById('reason').value
        const files = document.getElementById('files').files
        if (!reason) {
          Swal.showValidationMessage('กรุณาระบุเหตุผล')
          return false
        }
        return { reason, files }
      }
    })

    if (!result.isConfirmed) return
    editData = result.value
  } else {
    // กรณีไม่มีการแก้ไข แต่กดบันทึก (เช่น เข้ามาประเมินครั้งแรก)
    const confirm = await Swal.fire({
        title: 'ยืนยันการบันทึก',
        text: 'ระบบจะบันทึกผลการประเมินและส่งอีเมลแจ้งเตือนไปยังผู้รับผิดชอบโครงการ',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
    })
    if (!confirm.isConfirmed) return
  }

  // 2. เตรียม FormData (เหมือนเดิม)
  const fd = new FormData()
  fd.append('actualResult', evaluation.value.actualResult)
  fd.append('suggestion', evaluation.value.suggestion)
  fd.append('projectStatus', evaluation.value.projectStatus)
  fd.append('evaluation', evaluation.value.evaluation)
  fd.append('problem', evaluation.value.problem)
  fd.append('items', JSON.stringify(evaluation.value.items))

  if (editData) {
    fd.append('edit_reason', editData.reason)
    if(editData.files && editData.files.length > 0) {
        Array.from(editData.files).forEach(f => fd.append('attachments', f))
    }
  }

  // 3. เรียก API พร้อม Loading
  try {
    // แสดง Loading ระหว่างรอ Backend ส่งเมล
    Swal.fire({
        title: 'กำลังดำเนินการ',
        text: 'กำลังบันทึกข้อมูลและส่งอีเมลแจ้งเตือน...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading()
        }
    })

    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/admin/evaluations/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: fd
    })

    const responseData = await res.json()

    if (res.ok) {
      originalEvaluation.value = JSON.parse(JSON.stringify(evaluation.value))
      
      // แสดงข้อความสำเร็จ
      Swal.fire({
          title: 'สำเร็จ',
          text: 'บันทึกข้อมูลและส่งอีเมลแจ้งเตือนเรียบร้อยแล้ว',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
      })
    } else {
      throw new Error(responseData.message || 'ไม่สามารถบันทึกได้')
    }
  } catch (err) {
    Swal.fire('ข้อผิดพลาด', err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error')
  }
}
</script>