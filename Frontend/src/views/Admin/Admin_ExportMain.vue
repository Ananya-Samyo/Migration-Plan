<template>
  <div class="export-layout">
    <header class="stepper-header">
      <div class="stepper-wrapper">
        <div v-for="(step, i) in steps" :key="i" class="step"
          :class="{ active: currentStep === i + 1, completed: currentStep > i + 1 }" @click="currentStep = i + 1"
          style="cursor: pointer;">
          <span class="step-num">{{ i + 1 }}</span>
          <span class="step-text">{{ step }}</span>
        </div>
      </div>
    </header>

    <div class="main-content">
      <section class="full-panel">
        <div v-if="currentStep === 1" class="step-content">
          <ProjectSummary :tasks="tasks" @update-tasks="syncTasks" />
        </div>

        <div v-else-if="currentStep === 2" class="step-content">
          <GapAnalysis :selectedTasks="selectedTasks" @update-gaps="syncGaps" />
        </div>

        <div v-else class="step-content">
          <div class="header-section">
            <h2 class="step-title">{{ currentStep }}. {{ steps[currentStep - 1] }}</h2>
          </div>
          <div class="placeholder-box modern-card">
            <div class="empty-content">
              <span>🛠️</span>
              <p>ส่วนนี้สำหรับจัดการเนื้อหา: <strong>{{ steps[currentStep - 1] }}</strong></p>
              <small>ระบบกำลังเตรียมพื้นที่สำหรับกรอกข้อมูลในขั้นตอนนี้</small>
            </div>
          </div>
        </div>

        <div class="action-footer">
          <button class="btn-back" @click="currentStep--" :disabled="currentStep === 1">ก่อนหน้า</button>
          
          <button class="btn-preview" @click="showPreview = true">👁️ ดูตัวอย่างรายงาน</button>
          
          <button class="btn-export" @click="exportToPDF">📥 ดาวน์โหลดรายงาน (เฉพาะวาระที่ {{ currentStep }})</button>
          <button class="btn-next" @click="currentStep++" v-if="currentStep < 5">วาระถัดไป</button>
          <button v-else class="btn-export-primary" @click="handleExportAll">🚀 ดาวน์โหลดรายงานฉบับเต็ม</button>
        </div>
      </section>

      <div v-if="showPreview" class="preview-modal-overlay" @click.self="showPreview = false">
        <div class="preview-modal-content">
          <div class="modal-header">
            <h3>📑 ตัวอย่างรายงาน - {{ steps[currentStep - 1] }}</h3>
            <button class="close-btn" @click="showPreview = false">✖</button>
          </div>
          <div class="modal-body">
            <ExportPreview :selectedTasks="selectedTasks" :gapGroups="gapGroups" :currentStep="currentStep" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios';
import html2pdf from 'html2pdf.js'
import '@/assets/Admin/css/Admin_Export.css'

// 🌟 Import หน้า 1 และ หน้า 2
import ProjectSummary from '../../components/admin/Export/1_ProjectSummary.vue'
import ExportPreview from '../../components/admin/Export/1_ExportPreview.vue'
import GapAnalysis from '../../components/admin/Export/2_GapAnalysis.vue'

const showPreview = ref(false)

const currentStep = ref(1)
const steps = ['การสรุปขอบเขตงาน', 'ผลการปิด GAP', 'ภาพรวมการประเมิน', 'ประเด็น/ปัญหา', 'ประโยชน์']

// ข้อมูลวาระ 1
const tasks = ref([]);
const selectedTasks = computed(() => tasks.value.filter(t => t.selected));
const syncTasks = (updatedTasks) => { tasks.value = updatedTasks }

// 🌟 ข้อมูลวาระ 2
const gapGroups = ref([]);
const syncGaps = (updatedGaps) => { gapGroups.value = updatedGaps }

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/project-summary');
    tasks.value = response.data.map(item => ({ ...item, selected: false }));
  } catch (error) {
    console.error("โหลดข้อมูลล้มเหลว:", error);
  }
})

const exportToPDF = () => {
  const element = document.querySelector('.sheet');
  if (!element) return;
  const options = {
    margin: 0,
    filename: `รายงาน_${steps[currentStep.value - 1]}.pdf`,
    image: { type: 'png' }, 
    html2canvas: { scale: 3, useCORS: true, logging: false, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: false }
  };
  html2pdf().set(options).from(element).save();
}

watch(currentStep, (newStep) => {
  if (newStep === 2) {
    console.log("กำลังไปวาระที่ 2 พร้อมโครงการที่เลือก:", selectedTasks.value);
  }
})
</script>