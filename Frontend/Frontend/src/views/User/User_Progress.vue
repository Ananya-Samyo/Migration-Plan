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
            <textarea rows="4" v-model="project.scope"
              placeholder="รายละเอียดขอบเขตแผนงาน (เชื่อมกับหน้าขอบเขตแผนงาน)"></textarea>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label>ชื่อแผนงาน</label>
              <input type="text" v-model="project.name" />
            </div>

            <div class="form-group">
              <label>ผู้รับผิดชอบ</label>
              <input type="email" v-model="project.owner" />
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
          <button class="btn-purple-sm" @click="addGap">
            + เพิ่ม GAP
          </button>
        </div>
        <div class="card-body">
          <div class="gap-table-head">
            <div style="flex: 4;">รายการ GAP</div>
            <div style="flex: 1; text-align: center;">น้ำหนัก (%)</div>
            <div style="flex: 2;">สถานะ</div>
            <div style="flex: 0.5; text-align: center;">จัดการ</div>
          </div>

          <div v-for="(gap, index) in project.gaps" :key="index" class="gap-row">
            <div class="col-text" style="flex: 4;">
              <input type="text" v-model="gap.text" placeholder="ระบุ GAP..." />
            </div>
            <div class="col-weight" style="flex: 1;">
              <input type="number" v-model.number="gap.weight" placeholder="0" />
            </div>
            <div class="col-status" style="flex: 2;">
              <select v-model="gap.status">
                <option value="open">ยังไม่ปิด GAP</option>
                <option value="closed">ปิด GAP เสร็จแล้ว</option>
                <option value="pending">ไม่สามารถปิด GAP แต่ยอมรับได้</option>
              </select>
            </div>
            <div class="col-action" style="flex: 0.5;">
              <button class="btn-text-del" @click="removeGap(index)">
                ลบ
              </button>
            </div>
          </div>

          <div class="gap-footer">
            <span>รวมน้ำหนัก</span>
            <span class="total-weight">{{ totalWeight }}%</span>
          </div>
        </div>
      </section>

      <!-- สถานะและความคืบหน้า -->
      <section class="card">
        <div class="card-header">
          <h3>📊 สถานะและความคืบหน้า</h3>
        </div>
        <div class="card-body">
          <div class="grid-2">
            <div class="form-group">
              <label>สถานะการแก้ปัญหา</label>
              <select v-model="project.status">
                <option value="in_progress">ยังไม่ปิด GAP</option>
                <option value="completed">ปิด GAP เสร็จแล้ว</option>
                <option value="acceptedGap">ไม่สามารถปิด GAP แต่ยอมรับได้</option>
              </select>
            </div>
            <div class="form-group">
              <label>สถานะการดำเนินงาน (%)</label>
              <div class="input-suffix">
                <input type="number" v-model.number="project.progress" />
              </div>
            </div>
          </div>

          <div class="progress-container">
            <div class="progress-label">
              ความคืบหน้าแผนงาน <span>{{ displayProgress }}%</span>
            </div>
            <div class="progress-track">
              <div v-if="progress !== null" class="progress-fill" :style="{ width: displayProgress + '%' }"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- รายละเอียด -->
      <section class="card">
        <div class="card-header">
          <h3>📝 รายละเอียดการดำเนินงาน</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label>รายละเอียดการดำเนินงาน</label>
            <textarea rows="3" v-model="project.details"></textarea>
          </div>
          <div class="form-group">
            <label>ปัญหาอุปสรรค</label>
            <textarea rows="3" v-model="project.problems"></textarea>
          </div>
          <div class="form-group">
            <label>แนวทางแก้ไข</label>
            <textarea rows="4" v-model="project.solutions"></textarea>
          </div>
        </div>
      </section>

      <div class="bottom-actions">
        <button class="btn-save-gradient" @click="saveProject">
          <span>💾 บันทึกข้อมูลแผนงาน</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { adminScopesMock } from '@/data/adminScopesMock'
import '../../assets/Admin/css/Admin_Progress.css'

const router = useRouter()
const STORAGE_KEY = 'admin_scopes'


/* =========================
   project (ผูกกับ plan)
========================= */
const project = ref({
  id: null,
  scope: '',
  name: '',
  owner: '',
  startDate: '',
  endDate: '',
  status: 'in_progress',
  progress: 0,
  gaps: [],
  details: '',
  problems: '',
  solutions: ''
})

/* =========================
   scopes (mock / localStorage)
========================= */
const scopes = ref([])

/* =========================
   Load mock / localStorage
========================= */
onMounted(() => {
  localStorage.removeItem(STORAGE_KEY)

  scopes.value = adminScopesMock
  localStorage.setItem(STORAGE_KEY, JSON.stringify(adminScopesMock))

  const scope = scopes.value[0]
  const plan = scope?.plans[0]

  if (plan) {
    project.value = {
      id: plan.id,
      name: plan.name,
      owner: scope.reporter,
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      scope: plan.scope, 
      status: plan.progress === 100 ? 'completed' : 'in_progress',
      progress: plan.progress,
      gaps: plan.gaps.map(g => ({
        text: g,
        weight: 0,
        status: 'open'
      })),
      details: plan.action,
      problems: '',
      solutions: ''
    }
  }
})

/* =========================
   Computed
========================= */
const totalWeight = computed(() =>
  project.value.gaps.reduce((sum, item) => sum + (item.weight || 0), 0)
)

const displayProgress = computed(() =>
  Math.min(project.value.progress || 0, 100)
)

/* =========================
   Methods
========================= */
const goBack = () => router.back()

const addGap = () => {
  project.value.gaps.push({
    text: '',
    weight: 0,
    status: 'open'
  })
}

const removeGap = (index) => {
  project.value.gaps.splice(index, 1)
}

/* =========================
   Save (Mock → LocalStorage)
========================= */
const saveProject = async () => {
  if (totalWeight.value > 100) {
    await Swal.fire({
      icon: 'warning',
      title: 'น้ำหนัก GAP เกิน 100%',
      text: 'กรุณาปรับน้ำหนัก GAP ให้รวมไม่เกิน 100%',
      confirmButtonColor: '#6D28D9'
    })
    return
  }

  if (project.value.progress > 100) {
    await Swal.fire({
      icon: 'warning',
      title: 'ความคืบหน้าเกิน 100%',
      text: 'สถานะการดำเนินงานต้องไม่เกิน 100%',
      confirmButtonColor: '#6D28D9'
    })
    return
  }

  const result = await Swal.fire({
    title: 'ยืนยันการบันทึก?',
    text: 'ข้อมูลแผนงานและขอบเขตจะถูกอัปเดต',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#6D28D9',
    reverseButtons: true
  })

  if (!result.isConfirmed) return

  /* 🔁 update กลับไปที่ scopes */
  scopes.value.forEach(scope => {
    scope.plans.forEach(plan => {
      if (plan.id === project.value.id) {
        plan.name = project.value.name
        plan.scope = project.value.scope
        plan.action = project.value.details
        plan.progress = project.value.progress
        plan.gaps = project.value.gaps.map(g => g.text)
      }
    })
  })

  localStorage.setItem(STORAGE_KEY, JSON.stringify(scopes.value))

  Swal.fire('สำเร็จ!', 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success')
}
</script>