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

      <!-- ข้อมูลแผนงาน -->
      <section class="card">
        <div class="card-header">
          <h3>ℹ️ ข้อมูลแผนงาน</h3>
        </div>

        <div class="card-body">
          <div class="form-group">
            <label>ขอบเขตงาน</label>
            <textarea rows="4" v-model="project.scope"></textarea>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label>ชื่อแผนงาน</label>
              <input type="text" v-model="project.name" />
            </div>

            <div class="form-group">
              <label>วันที่เริ่มต้น</label>
              <input type="date" v-model="project.startDate" />
            </div>

            <div class="form-group">
              <label>วันที่สิ้นสุด</label>
              <input type="date" v-model="project.endDate" />
            </div>
          </div>
        </div>
      </section>

      <!-- GAP -->
      <section class="card">
        <div class="card-header flex-between">
          <h3>📈 ผลการวิเคราะห์ช่องว่าง (GAP)</h3>
          <button class="btn-purple-sm" @click="addGap">+ เพิ่ม GAP</button>
        </div>

        <div class="card-body">

          <div class="gap-table-head">
            <span class="col-gap">GAP</span>
            <span class="col-weight">น้ำหนัก</span>
            <span class="col-status">สถานะ</span>
            <span class="col-action"></span>
          </div>

          <div v-for="(gap, index) in project.gaps" :key="index" class="gap-row">
            <input class="gap-text" v-model="gap.text" placeholder="ระบุ GAP" />

            <input class="gap-weight" type="number" v-model.number="gap.weight" min="0" max="100" />

            <select v-model="gap.status" class="gap-status">
              <option value="processing_gap">กำลังดำเนินการ</option>
              <option value="complete_gap">ดำเนินการเสร็จสิ้น</option>
              <option value="acceptable_gap">ไม่สามารถปิด GAP แต่ยอมรับได้</option>
            </select>

            <button class="btn-text-del" @click="removeGap(index)">
              ลบ
            </button>
          </div>

          <div class="gap-footer">
            <span>รวมน้ำหนัก</span>
            <span class="total-weight">{{ totalWeight }}%</span>
          </div>
        </div>

      </section>

      <!-- สถานะ -->
      <section class="card">
        <div class="card-header">
          <h3>📊 สถานะและความคืบหน้า</h3>
        </div>

        <div class="card-body">

          <div class="form-group">
            <label>สถานะ</label>
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


      <!-- รายละเอียด -->
      <section class="card">
        <div class="card-header">
          <h3>📝 รายละเอียดเพิ่มเติม</h3>
        </div>

        <div class="card-body">
          <div class="form-group">
            <label>รายละเอียด</label>
            <textarea v-model="project.details" placeholder="รายละเอียด" rows="3" readonly></textarea>
          </div>

          <div class="form-group">
            <label>ปัญหา</label>
            <textarea v-model="project.problems" placeholder="ปัญหา" rows="3" readonly></textarea>
          </div>

          <div class="form-group">
            <label>แนวทางแก้ไข</label>
            <textarea v-model="project.solutions" placeholder="แนวทางแก้ไข" rows="3" readonly></textarea>
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
  problems: '',
  solutions: ''
})

const originalProject = ref(null)

/* =========================
   LOAD PROJECT FROM API
========================= */
onMounted(async () => {
  const res = await fetch(`${API}/projects/${route.params.id}`)
  const data = await res.json()

  project.value = {
    id: data.id,
    name: data.name,
    scope: data.scope,
    startDate: data.startDate,
    endDate: data.endDate,
    status: data.status,
    progress: data.progress,
    gaps: data.gaps || [],
    details: data.details || '',
    problems: data.problems || '',
    solutions: data.solutions || ''
  }

  originalProject.value = JSON.parse(JSON.stringify(project.value))
})

/* =========================
   COMPUTED
========================= */
const totalWeight = computed(() => {
  if (!Array.isArray(project.value.gaps)) return 0
  return project.value.gaps.reduce(
    (sum, g) => sum + Number(g.weight || 0),
    0
  )
})



const hasProjectChanged = () =>
  JSON.stringify(project.value) !== JSON.stringify(originalProject.value)

/* =========================
   METHODS
========================= */
const goBack = () => router.back()

const addGap = () => {
  project.value.gaps.push({ text: '', weight: 0, status: 'open' })
}

const removeGap = (i) => project.value.gaps.splice(i, 1)

/* =========================
   SAVE TO BACKEND
========================= */
const saveProject = async () => {
  // ---------- VALIDATION ----------
  if (project.value.progress < 0 || project.value.progress > 100) {
    await Swal.fire(
      'ข้อมูลไม่ถูกต้อง',
      'กรุณาระบุความคืบหน้าเป็นตัวเลขระหว่าง 0 - 100',
      'warning'
    )
    return
  }

  if (totalWeight.value > 100) {
    await Swal.fire('ผิดพลาด', 'น้ำหนัก GAP รวมเกิน 100%', 'warning')
    return
  }

  if (!project.value.status) {
    await Swal.fire('ผิดพลาด', 'กรุณาเลือกสถานะแผนงาน', 'warning')
    return
  }

  // ---------- ASK EDIT REASON ----------
  let editData = null

  if (hasProjectChanged()) {
    const result = await Swal.fire({
      title: 'เหตุผลการแก้ไข',
      html: `
        <textarea id="reason" class="swal2-textarea"
          placeholder="กรุณาระบุเหตุผลการแก้ไข"></textarea>
        <input id="files" type="file" class="swal2-file" multiple />
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
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

  // ---------- LOADING ----------
  Swal.fire({
    title: 'กำลังดำเนินการ',
    text: 'กำลังบันทึกข้อมูลและส่งอีเมล...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  })

  // ---------- FormData ----------
  const fd = new FormData()
  fd.append('name', project.value.name)
  fd.append('status', project.value.status)
  fd.append('progress', project.value.progress)
  fd.append('gaps', JSON.stringify(project.value.gaps))

  if (editData) {
    fd.append('edit_reason', editData.reason)
    Array.from(editData.files).forEach(file => {
      fd.append('attachments', file)
    })
  }

  try {
    await fetch(`${API}/projects/${project.value.id}`, {
      method: 'PUT',
      body: fd
    })

    originalProject.value = JSON.parse(JSON.stringify(project.value))
    Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย และส่งอีเมลแล้ว', 'success')
  } catch (err) {
    Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error')
  }
}

</script>