<template>
  <div class="main-wrapper" v-if="!loading && projectData">
    <header class="top-bar">
      <div class="title-section">
        <h1 class="page-title">การประเมินผลประโยชน์ของขอบเขตงาน</h1>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item">User</li>
            <li class="breadcrumb-item active">Evaluation</li>
          </ol>
        </nav>
      </div>
      <button class="btn-back-modern" @click="router.back()">
        <span class="icon">❮</span>
        <span class="text">ย้อนกลับ</span>
      </button>
    </header>

    <div class="content-container">
      <section class="admin-card info-section">
        <div class="card-header">
          <h2 class="card-title"><i class="icon-info"></i> รายละเอียดแผนงาน</h2>
        </div>
        <div class="card-body">
          <div class="grid-2">
            <div class="form-group">
              <label>ชื่อแผนงาน (Scope Name)</label>
              <input :value="projectData.scope_name" type="text" class="form-control read-only" disabled />
            </div>
            <div class="form-group">
              <label>ผู้รับผิดชอบ</label>
              <input :value="projectData.owner" type="text" class="form-control read-only" disabled />
            </div>
          </div>
        </div>
      </section>

      <section class="admin-card evaluation-detail">
        <div class="card-header">
          <h2 class="card-title"><i class="icon-chart"></i> รายละเอียดการประเมิน</h2>
        </div>
        <div class="card-body">
          <div class="form-group full-width mb-4">
            <label>วัตถุประสงค์</label>
            <textarea v-model="objective" class="form-control read-only" rows="3" disabled></textarea>
          </div>

          <div class="grid-2 gap-xl">
            <div class="evaluation-box baseline">
              <h3 class="box-subtitle text-danger">ข้อมูลก่อนการปรับปรุง (Baseline)</h3>
              <textarea v-model="before_text" class="form-control read-only mb-2" disabled></textarea>
              <div class="inline-data-group">
                <div class="data-item">
                  <span>ตัวเลข</span>
                  <div class="val-box">{{ before_number || '-' }}</div>
                </div>
                <div class="data-item">
                  <span>หน่วย</span>
                  <div class="val-box">{{ before_unit || '-' }}</div>
                </div>
                <span class="separator">/</span>
                <div class="data-item">
                  <span>ต่อ</span>
                  <div class="val-box">{{ before_per || '-' }}</div>
                </div>
              </div>
            </div>

            <div class="evaluation-box target">
              <h3 class="box-subtitle text-success">เป้าหมายที่คาดว่าจะได้รับ (Target)</h3>
              <textarea v-model="expected_text" class="form-control read-only mb-2" disabled></textarea>
              <div class="inline-data-group">
                <div class="data-item">
                  <span>ตัวเลข</span>
                  <div class="val-box highlight-success">{{ expected_number || '-' }}</div>
                </div>
                <div class="data-item">
                  <span>หน่วย</span>
                  <div class="val-box">{{ before_unit || '-' }}</div>
                </div>
                <span class="separator">/</span>
                <div class="data-item">
                  <span>ต่อ</span>
                  <div class="val-box">{{ before_per || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="admin-card form-section">
        <div class="card-header">
          <h2 class="card-title"><i class="icon-edit"></i> ผลการดำเนินงาน</h2>
        </div>
        <div class="card-body">
          <div class="grid-2 mb-4">
            <div class="form-group">
              <label class="required">สถานะโครงการ</label>
              <select v-model="form.project_status" class="form-select">
                <option value="">-- เลือกสถานะ --</option>
                <option value="ดำเนินการแล้วเสร็จ">ดำเนินการแล้วเสร็จ</option>
                <option value="อยู่ระหว่างดำเนินการ">อยู่ระหว่างดำเนินการ</option>
                <option value="ยกเลิกโครงการ">ยกเลิกโครงการ</option>
              </select>
            </div>
            <div class="form-group">
              <label class="required">สถานะการประเมิน</label>
              <select v-model="form.evaluation_status" class="form-select">
                <option value="">-- เลือกสถานะ --</option>
                <option value="success">บรรลุวัตถุประสงค์ (Success)</option>
                <option value="fail">ไม่บรรลุวัตถุประสงค์ (Fail)</option>
              </select>
            </div>
          </div>

          <div class="form-group full-width mb-3">
            <label class="required">สรุปผลลัพธ์ที่ได้จริง (Actual Outcome)</label>
            <textarea v-model="form.actual_outcome" rows="4" class="form-control" placeholder="ระบุผลลัพธ์ที่เกิดขึ้นจริง..."></textarea>
          </div>

          <div class="form-group full-width mb-3" v-if="form.evaluation_status === 'fail'">
            <label class="required text-danger">ปัญหา/อุปสรรค</label>
            <textarea v-model="form.problem" rows="3" class="form-control border-danger" placeholder="ระบุปัญหาที่พบเนื่องจากไม่บรรลุเป้าหมาย..."></textarea>
          </div>

          <div class="form-group full-width">
            <label>ข้อเสนอแนะเพิ่มเติม</label>
            <textarea v-model="form.recommendation" rows="2" class="form-control" placeholder="ระบุข้อเสนอแนะ (ถ้ามี)..."></textarea>
          </div>
        </div>
        
        <div class="card-footer">
          <button class="btn-save-admin" @click="handleSave">
            <span class="icon">💾</span> ยืนยันและส่งผลการประเมิน
          </button>
        </div>
      </section>
    </div>
  </div>

  <div v-else-if="loading" class="admin-loading">
    <div class="spinner-container">
      <div class="admin-spinner"></div>
      <p>กำลังดึงข้อมูลโครงการ...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const API = import.meta.env.VITE_API_BASE_URL

const projectId = route.params.id || route.params.project_plan_id
const loading = ref(true)
const projectData = ref(null)

// ตัวแปร Data Mapping
const objective = ref('')
const before_text = ref('')
const before_number = ref('')
const before_unit = ref('')
const before_per = ref('')
const expected_text = ref('')
const expected_number = ref('')

const form = ref({
  project_status: '',
  evaluation_status: '',
  actual_outcome: '',
  recommendation: '',
  problem: '',
  edit_reason: 'ผู้ใช้แก้ไขข้อมูลผ่านหน้าเว็บไซต์' 
})

const fetchData = async () => {
  if (!projectId) {
    Swal.fire('Error', 'ไม่พบรหัสโครงการ', 'error')
    loading.value = false
    return
  }

  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/api/user/evaluations/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (res.ok) {
      const data = await res.json()
      projectData.value = data

      objective.value = data.objective || ''
      const bpParts = (data.before_plan || '').split('||')
      before_text.value = bpParts[0] || ''
      before_number.value = bpParts[1] || ''
      before_unit.value = bpParts[2] || ''
      before_per.value = bpParts[3] || ''

      const eoParts = (data.expected_outcome || '').split('||')
      expected_text.value = eoParts[0] || ''
      expected_number.value = eoParts[1] || ''

      form.value.project_status = data.project_status || ''
      form.value.evaluation_status = data.evaluation_status || ''
      form.value.actual_outcome = data.actual_outcome || ''
      form.value.recommendation = data.recommendation || ''
      form.value.problem = data.problem_detail || ''
    } else {
      throw new Error('ไม่พบข้อมูลโครงการ')
    }
  } catch (err) {
    Swal.fire('Error', err.message, 'error')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!form.value.project_status || !form.value.evaluation_status || !form.value.actual_outcome) {
    Swal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูลในช่องที่จำเป็นให้ครบถ้วน', 'info')
    return
  }

  try {
    const result = await Swal.fire({
      title: 'ยืนยันการบันทึก?',
      text: "ระบบจะทำการส่งอีเมลแจ้งเตือนไปยังผู้เกี่ยวข้อง",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'ยืนยันการส่ง',
      cancelButtonText: 'ยกเลิก'
    })

    if (!result.isConfirmed) return

    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/api/user/evaluations/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    })

    if (res.ok) {
      Swal.fire('สำเร็จ', 'บันทึกข้อมูลและส่งอีเมลเรียบร้อยแล้ว', 'success')
        .then(() => router.back())
    } else {
      const errorData = await res.json()
      throw new Error(errorData.message || 'บันทึกไม่สำเร็จ')
    }
  } catch (err) {
    Swal.fire('Error', err.message, 'error')
  }
}

onMounted(fetchData)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');

/* Main Wrapper */
.main-wrapper {
  padding: 30px;
  background-color: #f1f5f9;
  min-height: 100vh;
  font-family: 'Sarabun', sans-serif;
  color: #334155;
}

/* Top Bar */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}
.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 5px;
}
.breadcrumb {
  display: flex;
  gap: 10px;
  list-style: none;
  padding: 0;
  font-size: 0.85rem;
  color: #64748b;
}
.breadcrumb-item.active { color: #3b82f6; }

/* Admin Back Button */
.btn-back-modern {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.btn-back-modern:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

/* Card Design */
.content-container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 25px;
}
.admin-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.card-header {
  padding: 15px 25px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}
.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 10px;
}
.card-body { padding: 25px; }
.card-footer {
  padding: 20px 25px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: center;
}

/* Form Styles */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.gap-xl { gap: 40px; }
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #475569;
}
.form-group.required label::after {
  content: ' *';
  color: #ef4444;
}

.form-control, .form-select {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}
.form-control:focus, .form-select:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.form-control.read-only {
  background-color: #f1f5f9;
  border-color: #e2e8f0;
  color: #64748b;
}

/* Evaluation Box Design (Baseline/Target) */
.evaluation-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px;
  transition: transform 0.2s;
}
.evaluation-box:hover { transform: translateY(-2px); border-color: #cbd5e1; }
.box-subtitle {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.inline-data-group {
  display: flex;
  align-items: flex-end;
  gap: 15px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #e2e8f0;
}
.data-item { display: flex; flex-direction: column; gap: 5px; }
.data-item span { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
.val-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: 700;
  min-width: 70px;
  text-align: center;
  color: #334155;
}
.val-box.highlight-success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}
.separator { font-size: 1.5rem; color: #cbd5e1; line-height: 1; padding-bottom: 5px; }

/* Alert Banner */
.alert-info {
  background: #eff6ff;
  border: 1px solid #dbeafe;
  color: #1e40af;
  padding: 15px;
  border-radius: 8px;
  font-size: 0.9rem;
}

/* Button Save */
.btn-save-admin {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 14px 40px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
}
.btn-save-admin:hover {
  background: #2563eb;
  transform: scale(1.02);
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
}

/* Loading State */
.admin-loading {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}
.spinner-container { text-align: center; }
.admin-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Icons (Simulated) */
.icon-info::before { content: '📄'; }
.icon-chart::before { content: '📊'; }
.icon-edit::before { content: '✍️'; }

@media (max-width: 768px) {
  .grid-2 { grid-template-columns: 1fr; }
  .top-bar { flex-direction: column; gap: 15px; }
}
</style>