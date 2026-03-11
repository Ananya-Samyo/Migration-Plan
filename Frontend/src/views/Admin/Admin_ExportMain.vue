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

    <main class="main-content-full">
      <div v-if="currentStep === 1" class="step-content">
        <ProjectSummary :tasks="tasks" @update-tasks="syncTasks" />
      </div>

      <div v-else-if="currentStep === 2" class="step-content">
        <GapAnalysis :selectedTasks="selectedTasks" @update-gaps="syncGaps" />
      </div>

      <div v-else-if="currentStep === 3" class="step-content">
        <EvaluationOverview :selectedTasks="selectedTasks" @update-evaluations="syncEvaluations" />
      </div>

      <div v-else-if="currentStep === 4" class="step-content">
        <ProblemOverview :selectedTasks="selectedTasks" @update-problems="syncProblems" />
      </div>

      <div v-else-if="currentStep === 5" class="step-content">
        <BenefitOverview :selectedTasks="selectedTasks" @update-benefits="syncBenefits" />
      </div>
      <div v-else class="step-content">
        <div class="header-section">
          <h2 class="step-title">{{ currentStep }}. {{ steps[currentStep - 1] }}</h2>
        </div>
      </div>
    </main>

    <footer class="action-footer">
      <div class="footer-left">
        <button v-if="currentStep > 1" class="btn-back" @click="currentStep--">ก่อนหน้า</button>
      </div>

      <div class="footer-right">
        <button class="btn-preview" @click="showPreview = true">👁️ ดูตัวอย่างรายงาน</button>
        <button class="btn-export" @click="exportToPDF">📥 ดาวน์โหลด PDF (วาระที่ {{ currentStep }})</button>
        <button class="btn-next" @click="currentStep++" v-if="currentStep < 5">วาระถัดไป</button>
        <button v-else class="btn-export-primary" @click="handleExportAll">🚀 ดาวน์โหลดฉบับเต็ม</button>
      </div>
    </footer>

    <Transition name="fade">
      <div v-if="showPreview" class="preview-full-overlay">
        <div class="preview-full-container">
          <div class="preview-header">
            <h3>📑 ตัวอย่างรายงาน: {{ steps[currentStep - 1] }}</h3>
            <div class="header-actions">
              <button class="btn-export-modal" @click="exportToPDF">📥 ดาวน์โหลดชุดนี้</button>
              <button class="close-full-btn" @click="showPreview = false">✖ ปิดหน้าต่าง</button>
            </div>
          </div>
          <div class="preview-body-content">
            <ExportPreview :selected-tasks="selectedTasks" :gap-groups="gapGroups" :selected-evaluations="selectedEvals"
              :selected-problems="selectedProblems" :selected-benefits="selectedBenefits" :current-step="currentStep" />
          </div>
        </div>
      </div>
    </Transition>
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
import EvaluationOverview from '../../components/admin/Export/3_EvaluationOverview.vue'
import ProblemOverview from '../../components/admin/Export/4_ProblemOverview.vue';
import BenefitOverview from '../../components/admin/Export/5_BenefitOverview.vue'

const showPreview = ref(false)

const currentStep = ref(1)
const steps = ['การสรุปขอบเขตงาน', 'ผลการปิด GAP', 'ภาพรวมการประเมิน', 'ประเด็น/ปัญหา', 'ประโยชน์']

// ข้อมูลวาระ 1
const tasks = ref([]);
const selectedTasks = computed(() => tasks.value.filter(t => t.selected));
const syncTasks = (updatedTasks) => { tasks.value = updatedTasks }

// 🌟 ข้อมูลวาระ 1
const gapGroups = ref([]);
const syncGaps = (updatedGaps) => { gapGroups.value = updatedGaps }

// 🌟 ข้อมูลวาระ 2
const selectedEvals = ref([]);
const syncEvaluations = (updatedData) => { selectedEvals.value = updatedData }

const selectedProblems = ref([]);
const syncProblems = (updatedData) => { selectedProblems.value = updatedData }

const selectedBenefits = ref([]);
const syncBenefits = (updatedData) => { selectedBenefits.value = updatedData }

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