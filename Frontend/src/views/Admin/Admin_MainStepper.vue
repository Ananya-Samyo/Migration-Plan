<template>
    <div class="main-wrapper">
        <div class="stepper-bar card">
            <div class="stepper-item" :class="{ active: currentStep >= 1 }">
                <div class="step-counter">1</div>
                <div class="step-name">ข้อมูลแผนงาน</div>
            </div>

            <div class="stepper-line" :class="{ active: currentStep >= 2 }"></div>

            <div class="stepper-item" :class="{ active: currentStep >= 2 }">
                <div class="step-counter">2</div>
                <div class="step-name">ความก้าวหน้า</div>
            </div>

            <div class="stepper-line" :class="{ active: currentStep >= 3 }"></div>

            <div class="stepper-item" :class="{ active: currentStep >= 3 }">
                <div class="step-counter">3</div>
                <div class="step-name">ประโยชน์</div>
            </div>
        </div>

        <div class="stepper-content">
            <transition name="fade-slide" mode="out-in">
                <Step1ProjectInfo v-if="currentStep === 1" v-model="masterData.step1" @next="goToStep2" />

                <Step2Progress v-else-if="currentStep === 2" :projectId="masterData.projectId" :masterData="masterData"
                    v-model="masterData.step2" @back="currentStep = 1" @next="goToStep3" />

                <Step3Evaluation v-else-if="currentStep === 3" :projectId="masterData.projectId"
                    :masterData="masterData" v-model="masterData.step3" @back="currentStep = 2"
                    @complete="finishWorkflow" />
            </transition>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// ตรวจสอบ Path การ Import ให้ตรงกับ Folder จริงของคุณนะครับ
import Step1ProjectInfo from '../../components/admin/Admin_1ProjectInfo.vue'
import Step2Progress from '../../components/admin/Admin_2Progress.vue'
import Step3Evaluation from '../../components/admin/Admin_3Evaluation.vue'
import '../../assets/Admin/css/Admin_UnifiedStyle.css'

const router = useRouter()
const currentStep = ref(1)

// ใน Admin_MainStepper.vue
const masterData = ref({
    projectId: null,
    step1: {
        scopeName: '',
        projects: []
    },
    step2: {
        gaps: [],
        issues: []
    },
    step3: {}
})

const goToStep2 = (payload) => {
    const id = typeof payload === 'object' ? payload.id : payload;
    
    if (id) {
        masterData.value.projectId = id;
        
        if (payload.projects) {
            masterData.value.step1.projects = payload.projects;
            console.log("✅ อัปเดต Project IDs เข้า MasterData เรียบร้อย:", payload.projects);
        }
    }
    
    currentStep.value = 2;
}

const goToStep3 = () => {
    currentStep.value = 3;
}

const finishWorkflow = () => {
    router.push('/admin/scopeproject')
}
</script>