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
        <button class="btn-export" @click="exportToPDF" :disabled="isDownloading">
          <span v-if="!isDownloading">📥 ดาวน์โหลด PDF (วาระที่ {{ currentStep }})</span>
          <span v-else>⏳ กำลังเตรียมไฟล์...</span>
        </button>
        <button class="btn-next" @click="currentStep++" v-if="currentStep < 5">วาระถัดไป</button>
      </div>
    </footer>

    <Transition name="fade">
      <div v-if="showPreview" class="preview-full-overlay">
        <div class="preview-full-container">
          <div class="preview-header">
            <h3>📑 ตัวอย่างรายงาน: {{ steps[currentStep - 1] }}</h3>
            <div class="header-actions">
              <button class="btn-export-modal" @click="exportToPDF" :disabled="isDownloading">
                <span v-if="!isDownloading">📥 ดาวน์โหลดชุดนี้</span>
                <span v-else>⏳ กำลังโหลด...</span>
              </button>
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

    <div id="hidden-export-wrapper" class="pdf-hidden-wrapper">
      <ExportPreview 
        :selected-tasks="selectedTasks" 
        :gap-groups="gapGroups" 
        :selected-evaluations="selectedEvals"
        :selected-problems="selectedProblems" 
        :selected-benefits="selectedBenefits" 
        :current-step="currentStep" 
      />
    </div>

    <Transition name="fade">
      <div v-if="isDownloading" class="loading-overlay">
        <div class="spinner"></div>
        <h3 style="color: white; margin-top: 15px;">กำลังสร้างไฟล์ PDF...</h3>
        <p style="color: #cbd5e1; font-size: 14px;">กรุณารอสักครู่ ระบบกำลังจัดหน้ากระดาษ</p>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios';
import html2pdf from 'html2pdf.js'
import '@/assets/Admin/css/Admin_Export.css'

import ProjectSummary from '../../components/admin/Export/1_ProjectSummary.vue'
import ExportPreview from '../../components/admin/Export/1_ExportPreview.vue'
import GapAnalysis from '../../components/admin/Export/2_GapAnalysis.vue'
import EvaluationOverview from '../../components/admin/Export/3_EvaluationOverview.vue'
import ProblemOverview from '../../components/admin/Export/4_ProblemOverview.vue';
import BenefitOverview from '../../components/admin/Export/5_BenefitOverview.vue'

const showPreview = ref(false)
const isDownloading = ref(false);

const currentStep = ref(1)
const steps = ['การสรุปขอบเขตงาน', 'ผลการปิด GAP', 'ภาพรวมการประเมิน', 'ประเด็น/ปัญหา', 'ประโยชน์']

const tasks = ref([]);
const selectedTasks = computed(() => tasks.value.filter(t => t.selected));
const syncTasks = (updatedTasks) => { tasks.value = updatedTasks }

const gapGroups = ref([]);
const syncGaps = (updatedGaps) => { gapGroups.value = updatedGaps }

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

// 🌟 ฟังก์ชันดาวน์โหลด PDF (ปรับแต่ง html2canvas ให้เสถียรขึ้น)
const exportToPDF = async () => {
  let element;

  if (showPreview.value) {
    element = document.querySelector('.preview-full-container .sheet');
  } else {
    element = document.querySelector('#hidden-export-wrapper .sheet');
  }

  if (!element) {
    console.error("ไม่พบเอกสารสำหรับดาวน์โหลด");
    return;
  }

  isDownloading.value = true;
  
  // 🌟 หน่วงเวลาให้ Vue วาดหน้าจอและโหลด CSS ให้เสร็จก่อนแคปภาพ (สำคัญมากสำหรับตารางซับซ้อน)
  await new Promise(resolve => setTimeout(resolve, 300)); 

  const options = {
    margin: 0,
    filename: `รายงาน_${steps[currentStep.value - 1]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 }, // เปลี่ยนเป็น jpeg ช่วยลดปัญหาภาพแหว่ง
    html2canvas: { 
      scale: 2, // 🌟 ลด scale ลงเหลือ 2 ป้องกันไอคอน/ตารางเพี้ยนตอนขยาย
      useCORS: true, 
      logging: false, 
      backgroundColor: '#ffffff',
      windowWidth: 1122
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: false }
  };

  try {
    await html2pdf().set(options).from(element).save();
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้าง PDF:", error);
  } finally {
    isDownloading.value = false;
  }
}

watch(currentStep, (newStep) => {
  if (newStep === 2) {
    console.log("กำลังไปวาระที่ 2 พร้อมโครงการที่เลือก:", selectedTasks.value);
  }
})
</script>