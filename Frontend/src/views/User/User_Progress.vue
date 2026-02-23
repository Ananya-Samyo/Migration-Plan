<template>
  <div class="main-container">
    <header class="top-bar">
      <div class="left-head">
        <h1 class="page-title">ความก้าวหน้าของแผนงาน</h1>
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

    <div class="content-wrapper">

      <section class="card">
        <div class="card-header">
          <h3>ℹ️ ข้อมูลแผนงาน</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label>ขอบเขตงาน</label>
            <textarea rows="4" v-model="project.scope" readonly class="input-readonly"></textarea>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>ชื่อแผนงาน</label>
              <input type="text" v-model="project.name" readonly class="input-readonly" />
            </div>
            <div class="form-group">
              <label>วันที่เริ่มต้น</label>
              <input type="date" v-model="project.startDate" readonly class="input-readonly" />
            </div>
            <div class="form-group">
              <label>วันที่สิ้นสุด</label>
              <input type="date" v-model="project.endDate" readonly class="input-readonly" />
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h3>📈 ผลการวิเคราะห์ช่องว่าง (GAP)</h3>
        </div>
        <div class="card-body">
          <div class="gap-table-head"
            style="display: flex; gap: 10px; padding-bottom: 10px; font-weight: bold; color: #666;">
            <div style="flex: 5;">GAP</div>
            <div style="flex: 1; text-align: center;">น้ำหนัก</div>
            <div style="flex: 2;">สถานะ</div>
          </div>
          <div v-for="(gap, index) in project.gaps" :key="index" class="gap-row"
            style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
            <div style="flex: 5;">
              <input type="text" v-model="gap.text" readonly class="input-readonly"
                style="width: 100%; padding: 8px; border: 1px solid #eee; border-radius: 6px; background: #f9fafb;" />
            </div>
            <div style="flex: 1;">
              <input type="number" v-model.number="gap.weight" readonly class="input-readonly"
                style="width: 100%; padding: 8px; border: 1px solid #eee; border-radius: 6px; text-align: center; background: #f9fafb;" />
            </div>
            <div style="flex: 2;">
              <select v-model="gap.status"
                style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                <option value="processing_gap">กำลังดำเนินการ</option>
                <option value="complete_gap">ดำเนินการเสร็จสิ้น</option>
                <option value="acceptable_gap">ไม่สามารถปิด GAP แต่ยอมรับได้</option>
              </select>
            </div>
          </div>
          <div class="gap-footer" style="margin-top: 20px; text-align: right; font-weight: bold;">
            <span>รวมน้ำหนัก </span>
            <span class="total-weight" :class="{ 'text-red': totalWeight > 100, 'text-green': totalWeight <= 100 }">
              {{ totalWeight }}%
            </span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h3>📊 สถานะและความคืบหน้า</h3>
        </div>
        <div class="card-body">
          <div class="grid-2">
            <div class="form-group">
              <label>สถานะแผนงาน</label>
              <select v-model="project.status">
                <option value="OPEN">ยังไม่ปิด GAP</option>
                <option value="CLOSED">ปิด GAP แล้ว</option>
                <option value="ACCEPTABLE">ยอมรับ GAP</option>
              </select>
            </div>
            <div class="form-group">
              <label>ความคืบหน้า (%)</label>
              <input type="number" min="0" max="100" v-model.number="project.progress" placeholder="0 - 100" />
            </div>
          </div>
          <div class="progress-container">
            <div class="progress-label">
              <span>ความคืบหน้า</span>
              <span>{{ project.progress }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: project.progress + '%' }"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h3>📝 รายละเอียดเพิ่มเติม</h3>
        </div>

        <div class="card-body">
          <div class="form-group">
            <label>รายละเอียดการดำเนินงาน</label>
            <textarea v-model="project.details" placeholder="ระบุรายละเอียดการดำเนินงาน..." rows="3"></textarea>
          </div>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

          <div class="list-section">
            <div class="list-header flex-between" style="margin-bottom: 10px;">
              <label>ปัญหา/อุปสรรค</label>
              <button class="btn-purple-sm" @click="addProblem">+ เพิ่มปัญหา</button>
            </div>

            <div v-if="project.problems.length === 0" class="empty-state">
              ยังไม่มีข้อมูลปัญหา
            </div>

            <div v-for="(item, index) in project.problems" :key="'prob-' + index" class="list-row flex-row"
              style="margin-bottom: 8px;">
              <input type="text" v-model="item.text" placeholder="ระบุปัญหา..." style="flex: 1;" />
              <button class="btn-text-del" @click="removeProblem(index)">ลบ</button>
            </div>
          </div>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

          <div class="list-section">
            <div class="list-header flex-between" style="margin-bottom: 10px;">
              <label>แนวทางแก้ไข</label>
              <button class="btn-purple-sm" @click="addSolution">+ เพิ่มแนวทาง</button>
            </div>

            <div v-if="project.solutions.length === 0" class="empty-state">
              ยังไม่มีข้อมูลแนวทางแก้ไข
            </div>

            <div v-for="(item, index) in project.solutions" :key="'sol-' + index" class="list-row flex-row"
              style="margin-bottom: 8px;">
              <input type="text" v-model="item.text" placeholder="ระบุแนวทางแก้ไข..." style="flex: 1;" />
              <button class="btn-text-del" @click="removeSolution(index)">ลบ</button>
            </div>
          </div>

        </div>
      </section>

      <div class="bottom-actions">
        <button class="btn-save-gradient" @click="saveProject">
          💾 บันทึกข้อมูล
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import '../../assets/Admin/css/Admin_Progress.css'

const API = import.meta.env.VITE_API_BASE_URL
const router = useRouter()
const route = useRoute()

const project = ref({
  id: null,
  scope: '',
  name: '',
  startDate: '',
  endDate: '',
  status: '',
  progress: 0,
  gaps: [],
  details: '',
  problems: [],
  solutions: []
})

const originalProject = ref(null)

/* =========================
   HELPER FUNCTIONS
========================= */
const textToArray = (str) => {
  if (!str) return []
  return str.split('\n').filter(s => s.trim() !== '').map(s => ({ text: s }))
}

const arrayToText = (arr) => {
  if (!Array.isArray(arr)) return ''
  return arr.map(item => item.text).join('\n')
}

/* =========================
   LOAD PROJECT (จุดที่แก้ไข)
========================= */
onMounted(async () => {
  try {
    const res = await fetch(`${API}/api/user/projects/${route.params.id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!res.ok) throw new Error('Failed to fetch project')

    const data = await res.json()

    console.log("Data from Backend:", data);

    project.value = {
      id: data.id,
      name: data.name,
      scope: data.scope,
      startDate: data.startDate ? data.startDate.split('T')[0] : '',
      endDate: data.endDate ? data.endDate.split('T')[0] : '',

      // ✅ แก้ไข 1: ใช้ status_code (OPEN) แทน status (1) เพื่อให้ตรงกับ <option>
      status: data.status_code || 'OPEN',

      progress: Number(data.progress),

      // ✅ แก้ไข 2: Map ข้อมูล Gaps
      gaps: data.gaps.map(g => ({
        id: g.id,
        text: g.text,
        weight: g.weight,
        status: g.status || 'processing_gap'
      })),

      // ✅ แก้ไข 3: Map ข้อมูล Detail (Backend ส่งมาเป็น string แล้ว)
      details: data.details || '',

      problems: textToArray(data.problems),
      solutions: textToArray(data.solutions)
    }

    originalProject.value = JSON.parse(JSON.stringify(project.value))

  } catch (err) {
    console.error(err)
    Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้', 'error')
  }
})

/* =========================
   COMPUTED
========================= */
const totalWeight = computed(() => {
  if (!Array.isArray(project.value.gaps)) return 0
  return project.value.gaps.reduce((sum, g) => sum + Number(g.weight || 0), 0)
})

/* =========================
   METHODS
========================= */
const goBack = () => router.back()

const addProblem = () => project.value.problems.push({ text: '' })
const removeProblem = (index) => project.value.problems.splice(index, 1)

const addSolution = () => project.value.solutions.push({ text: '' })
const removeSolution = (index) => project.value.solutions.splice(index, 1)

/* =========================
   SAVE TO BACKEND
========================= */
const saveProject = async () => {
  if (project.value.progress < 0 || project.value.progress > 100) {
    await Swal.fire('ข้อมูลไม่ถูกต้อง', 'กรุณาระบุความคืบหน้า 0-100', 'warning')
    return
  }

  let editData = { reason: '', files: [] }

  const result = await Swal.fire({
    title: 'ยืนยันการบันทึก',
    html: `
        <div style="text-align: left">
          <label>ระบุเหตุผล/สิ่งที่ทำเพิ่ม:</label>
          <textarea id="reason" class="swal2-textarea" style="margin-top:5px;" placeholder="เช่น อัปเดตความคืบหน้า..."></textarea>
          <label style="margin-top:10px; display:block;">แนบไฟล์หลักฐาน (ถ้ามี):</label>
          <input id="files" type="file" class="swal2-file" multiple />
        </div>
      `,
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    preConfirm: () => {
      const reason = document.getElementById('reason').value
      const files = document.getElementById('files').files
      return { reason, files }
    }
  })

  if (!result.isConfirmed) return
  editData = result.value

  Swal.fire({ title: 'กำลังบันทึกและส่งอีเมลแจ้งผู้ที่เกี่ยวข้อง...', didOpen: () => Swal.showLoading() })

  const fd = new FormData()
  const userId = localStorage.getItem('user_id')
  if (userId) fd.append('user_id', userId)
  fd.append('status', project.value.status)
  fd.append('progress', project.value.progress)
  fd.append('details', project.value.details || '')
  fd.append('problems', arrayToText(project.value.problems))
  fd.append('solutions', arrayToText(project.value.solutions))
  fd.append('gaps', JSON.stringify(project.value.gaps))

  if (editData.reason) fd.append('edit_reason', editData.reason)
  if (editData.files && editData.files.length > 0) {
    Array.from(editData.files).forEach(file => fd.append('attachments', file))
  }

  try {
    const res = await fetch(`${API}/api/user/projects/${route.params.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: fd
    })

    if (!res.ok) {
      const errJson = await res.json()
      throw new Error(errJson.message || 'Save failed')
    }

    originalProject.value = JSON.parse(JSON.stringify(project.value))
    await Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success')

  } catch (err) {
    console.error(err)
    Swal.fire('ผิดพลาด', err.message || 'บันทึกไม่สำเร็จ', 'error')
  }
}
</script>