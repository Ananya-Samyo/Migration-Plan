<template>
  <div class="main-wrapper">
    <header class="top-bar">
      <div class="left-head">
        <h1 class="page-title">การรายงานความก้าวหน้าโครงการ</h1>
      </div>
      <button class="btn-back-modern" @click="$emit('back')">
        <div class="icon-circle"> ❮ </div>
        <span class="text">ย้อนกลับไปข้อมูลแผนงาน</span>
      </button>
    </header>

    <div class="card">
      <p class="text-muted mb-4" v-if="form.projects.length > 0">
        กรุณาคลิกที่แผนงานเพื่อกางออกและกรอกรายละเอียดความก้าวหน้า</p>
      <p class="text-danger mb-4" v-else>⚠️ ไม่พบข้อมูลแผนงานจากขั้นตอนที่ 1 กรุณากดย้อนกลับไปเพิ่มแผนงาน</p>

      <div v-for="(project, pIndex) in form.projects" :key="pIndex" class="project-card mb-4"
        style="border: 1px solid #eee; border-radius: 8px; margin-bottom: 20px;">

        <div class="project-header" @click="toggleAccordion(pIndex)"
          style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 15px; background-color: #fcfcff; border-radius: 8px;">
          <h3 style="margin: 0; color: var(--primary-purple); font-size: 1.1rem;">
            {{ pIndex + 1 }}. {{ project.projectName || 'แผนงานที่ไม่ได้ระบุชื่อ' }}
          </h3>
          <span>{{ expandedIndex === pIndex ? '▼ ซ่อน' : '▶ กางออก' }}</span>
        </div>

        <div v-show="expandedIndex === pIndex" class="project-body mt-3" style="padding: 15px;">
          <div class="grid-2">
            <div class="field">
              <label>วันที่เริ่มต้น</label>
              <div style="position: relative; width: 100%; display: flex; align-items: center;">
                <span style="position: absolute; left: 10px; z-index: 5;">📅</span>

                <input type="text" :value="toThaiDate(project.start_date)" placeholder="เลือกวันที่เริ่มต้น" readonly
                  style="width: 100%; cursor: pointer; background-color: #fff; padding-left: 35px;" /> <input
                  type="date" v-model="project.start_date" :disabled="isViewer"
                  @click="$event.target.showPicker && $event.target.showPicker()"
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 10;" />
              </div>
            </div>

            <div class="field">
              <label>วันที่สิ้นสุด</label>
              <div style="position: relative; width: 100%; display: flex; align-items: center;">
                <span style="position: absolute; left: 10px; z-index: 5;">📅</span>

                <input type="text" :value="toThaiDate(project.end_date)" placeholder="เลือกวันที่สิ้นสุด" readonly
                  style="width: 100%; cursor: pointer; background-color: #fff; padding-left: 35px;" /> <input
                  type="date" v-model="project.end_date" :disabled="isViewer"
                  @click="$event.target.showPicker && $event.target.showPicker()"
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 10;" />
              </div>
            </div>
          </div>

          <div class="project-header mt-4" style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin-bottom: 0;">📈 รายการวิเคราะห์ช่องว่าง (GAP)</h3>
            <span :class="['status-badge', getTotalWeight(pIndex) > 100 ? 'text-red' : 'text-green']"
              style="font-size: 0.9rem;">
              น้ำหนักรวม: {{ getTotalWeight(pIndex) }}%
            </span>
          </div>

          <div v-for="(gap, gIndex) in project.gaps" :key="gIndex" class="gap-row"
            style="display: flex; gap: 10px; margin-bottom: 10px;">
            <input v-model="gap.detail" placeholder="รายละเอียด GAP" style="flex: 2;" />
            <input type="number" v-model.number="gap.weight" :disabled="isViewer" placeholder="%" min="0" max="100"
              @input="gap.weight = Math.max(0, Math.min(100, gap.weight))" />
            <select v-model="gap.status" style="flex: 1;">
              <option value="processing_gap">กำลังดำเนินการ</option>
              <option value="complete_gap">เสร็จสิ้น</option>
              <option value="acceptable_gap">ยอมรับได้</option>
            </select>
            <button v-if="!isViewer" class="remove-member" @click="removeGap(pIndex, gIndex)"
              style="color: red; background: none; border: none; font-weight: bold;">✕</button>
          </div>
          <button v-if="!isViewer" class="add-member" @click="addGap(pIndex)"
            style="color: var(--primary-purple); background: none; border: none; cursor: pointer;">+ เพิ่มรายการ
            GAP</button>
        </div>
      </div>

      <div style="display: flex; gap: 15px; margin-top: 20px;">
        <button :class="isViewer ? 'btn-next-viewer' : 'btn-primary'"
          style="flex: 1; padding: 12px; border-radius: 8px; color: white; border: none; cursor: pointer; background-color: var(--primary-purple);"
          @click="isViewer ? $emit('next') : handleNext()">
          <span v-if="isViewer">ดูขั้นตอนประเมินผลต่อไป ➔</span>
          <span v-else>ยืนยันและไปขั้นตอนประเมินผล ➔</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import Swal from 'sweetalert2'
import '../../assets/Admin/css/Admin_UnifiedStyle.css'
import '../../assets/Admin/css/Admin_Progress.css'

const rawRole = localStorage.getItem('role') || '';
const isViewer = rawRole.toLowerCase() === 'viewer';

const props = defineProps(['modelValue', 'masterData', 'projectId'])
const emit = defineEmits(['next', 'back', 'update:modelValue'])

// ฟังก์ชันแปลงวันที่ YYYY-MM-DD เป็น วว/ดด/ปปปป (พ.ศ.)
const toThaiDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const thaiYear = parseInt(year) + 543;
  return `${day}/${month}/${thaiYear}`;
}

const form = ref({ projects: [] })
const expandedIndex = ref(0)

const toggleAccordion = (index) => {
  expandedIndex.value = expandedIndex.value === index ? -1 : index;
}

onMounted(() => {
  const step1Projects = props.masterData?.step1?.projects || [];
  const step2Projects = props.modelValue?.projects || [];

  if (step2Projects.length > 0) {
    form.value.projects = JSON.parse(JSON.stringify(step2Projects));
  } else if (step1Projects.length > 0) {
    // 🚩 แก้ไขจุดนี้: มั่นใจว่าเอา ID จากหน้า 1 มาด้วย
    form.value.projects = step1Projects.map(p => ({
      ...p,
      start_date: p.start_date || p.startDate || '',
      end_date: p.end_date || p.endDate || '',

      progress: p.progress || 0,
      gaps: (p.gaps && p.gaps.length > 0)
        ? JSON.parse(JSON.stringify(p.gaps))
        : [{ detail: '', weight: 0, status: 'processing_gap' }],
      issues: (p.issues && p.issues.length > 0)
        ? JSON.parse(JSON.stringify(p.issues))
        : [{ problem: '', solution: '' }]
    }));
  }

  // Check อีกรอบเพื่อความชัวร์ (เอาไว้ Debug)
  console.log("🛠️ ตรวจสอบข้อมูลใน Step 2 หลังจากโหลด:", form.value.projects);
})

// คอยส่งข้อมูลกลับไปเก็บใน masterData.step2 ของหน้าหลัก
watch(form, (newVal) => {
  emit('update:modelValue', { projects: newVal.projects })
}, { deep: true })

const getTotalWeight = (pIndex) => {
  if (!form.value.projects[pIndex] || !form.value.projects[pIndex].gaps) return 0;
  return form.value.projects[pIndex].gaps.reduce((sum, g) => sum + Number(g.weight || 0), 0)
}

const addGap = (pIndex) => form.value.projects[pIndex].gaps.push({ detail: '', weight: 0, status: 'processing_gap' })
const removeGap = (pIndex, gIndex) => form.value.projects[pIndex].gaps.splice(gIndex, 1)

// --- หน้า 2: บันทึกความก้าวหน้าเงียบๆ แล้วไปหน้า 3 ---
const handleNext = async () => {
  let hasError = false;

  // 1. ตรวจสอบเงื่อนไขน้ำหนักรวม
  form.value.projects.forEach((project, index) => {
    const totalW = project.gaps?.reduce((sum, g) => sum + Number(g.weight || 0), 0) || 0;
    if (totalW > 100) {
      Swal.fire('คำเตือน', `น้ำหนักรวม GAP ของ แผนงานที่ ${index + 1} เกิน 100%`, 'warning');
      hasError = true;
    }
  });

  if (hasError) return;

  // 🚩 Log ดูเพื่อความมั่นใจก่อนส่ง
  console.log("📤 ข้อมูลที่จะส่งไป Backend:", form.value.projects);

  try {
    Swal.fire({
      title: 'กำลังบันทึก...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/update-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
  projects: form.value.projects.map((p) => ({
    project_plan_id: p.project_plan_id || p.id,
    projectName: p.projectName,
    // ส่งไปทั้งสองชื่อเพื่อความชัวร์
    start_date: p.start_date, 
    end_date: p.end_date,
    startDate: p.start_date, 
    endDate: p.end_date,
    progress: p.progress ?? 0,
    gaps: p.gaps || [],
    issues: p.issues || []
  })) || []
      })
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึก');
    }

    Swal.close();
    emit('next'); // ไปหน้า 3

  } catch (error) {
    console.error("❌ Save Error:", error);
    Swal.fire('ข้อผิดพลาด', error.message, 'error');
  }
}
</script>