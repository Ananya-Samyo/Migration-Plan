<template>
  <div class="main-wrapper">
    <header class="top-bar">
      <div class="left-head">
        <h1 class="page-title">2. ความก้าวหน้าและ GAP (Step 2)</h1>
      </div>
      <button class="btn-back-modern" @click="$emit('back')">
        <div class="icon-circle"> ❮ </div>
        <span class="text">ย้อนกลับไปข้อมูลแผนงาน</span>
      </button>
    </header>

    <div class="card">
      <div class="project-card">
        <div class="project-header">
          <h3>ℹ️ ข้อมูลพื้นฐาน</h3>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>วันที่เริ่มต้น</label>
            <input type="date" v-model="form.startDate" />
          </div>
          <div class="field">
            <label>วันที่สิ้นสุด</label>
            <input type="date" v-model="form.endDate" />
          </div>
        </div>
      </div>

      <div class="project-card">
        <div class="project-header">
          <h3>📈 รายการวิเคราะห์ช่องว่าง (GAP)</h3>
          <span :class="['status-badge', totalWeight > 100 ? 'text-red' : 'text-green']">
            น้ำหนักรวม: {{ totalWeight }}%
          </span>
        </div>
        
        <div v-for="(gap, index) in form.gaps" :key="index" class="gap-row">
          <input v-model="gap.detail" placeholder="รายละเอียด GAP" />
          <input type="number" v-model.number="gap.weight" placeholder="%" />
          <select v-model="gap.status">
            <option value="processing_gap">กำลังดำเนินการ</option>
            <option value="complete_gap">เสร็จสิ้น</option>
            <option value="acceptable_gap">ยอมรับได้</option>
          </select>
          <button class="remove-member" @click="removeGap(index)">✕</button>
        </div>
        <button class="add-member" @click="addGap">+ เพิ่มรายการ GAP</button>
      </div>

      <div class="project-card">
        <div class="project-header">
          <h3>📝 ปัญหาและแนวทางแก้ไข</h3>
        </div>
        
        <div v-for="(item, index) in form.issues" :key="index" class="issue-row">
          <textarea v-model="item.problem" placeholder="ปัญหา / อุปสรรค" rows="2"></textarea>
          <textarea v-model="item.solution" placeholder="แนวทางแก้ไข" rows="2"></textarea>
          <button class="remove-member" @click="removeIssue(index)">✕</button>
        </div>
        <button class="add-member" @click="addIssue">+ เพิ่มรายการปัญหา</button>
      </div>

      <div class="project-card">
        <div class="field">
          <label>ความคืบหน้าภาพรวม ({{ form.progress }}%)</label>
          <input type="range" v-model="form.progress" min="0" max="100" style="width: 100%; accent-color: var(--primary-purple);" />
        </div>
      </div>

      <div style="display: flex; gap: 15px; margin-top: 20px;">
        <button class="btn-primary" style="flex: 1;" @click="handleNext">
          ยืนยันและไปขั้นตอนประเมินผล ➔
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Swal from 'sweetalert2'
import '../../assets/Admin/css/Admin_UnifiedStyle.css'
import '../../assets/Admin/css/Admin_Progress.css'

const props = defineProps(['modelValue', 'projectId'])
const emit = defineEmits(['next', 'back', 'update:modelValue'])

// รับค่าจาก Master และตั้งโครงสร้างให้เหมือน Step 1
const form = ref(props.modelValue && props.modelValue.gaps ? props.modelValue : {
  startDate: '',
  endDate: '',
  progress: 0,
  gaps: [{ detail: '', weight: 0, status: 'processing_gap' }],
  issues: [{ problem: '', solution: '' }]
})

// คอยส่งข้อมูลกลับไปที่ MasterStepper ตลอดเวลา
watch(form, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

const totalWeight = computed(() => {
  return form.value.gaps.reduce((sum, g) => sum + Number(g.weight || 0), 0)
})

const addGap = () => form.value.gaps.push({ detail: '', weight: 0, status: 'processing_gap' })
const removeGap = (index) => form.value.gaps.splice(index, 1)

const addIssue = () => form.value.issues.push({ problem: '', solution: '' })
const removeIssue = (index) => form.value.issues.splice(index, 1)

const handleNext = async () => {
  // ตรวจสอบความถูกต้องเบื้องต้น (เช่น น้ำหนัก GAP)
  const totalW = form.value.gaps.reduce((sum, g) => sum + Number(g.weight || 0), 0);
  if (totalW > 100) {
    return Swal.fire('คำเตือน', 'น้ำหนักรวม GAP เกิน 100%', 'warning');
  }

  Swal.fire({ title: 'กำลังบันทึกความก้าวหน้า...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/update-progress`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({
        projectId: props.projectId,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        progress: form.value.progress,
        gaps: form.value.gaps,
        issues: form.value.issues
      })
    });

    if (!res.ok) throw new Error('บันทึกข้อมูล Step 2 ไม่สำเร็จ');

    Swal.close();
    emit('next');
  } catch (err) {
    Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
  }
}
</script>