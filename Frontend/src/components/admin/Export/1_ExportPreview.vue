<template>
    <div class="a4-landscape-preview">
        <div class="sheet shadow-professional">
            <div class="sheet-header">
                <div class="left-brand">การรายงานในคณะ DTG</div>
                <div class="right-date">ณ วันที่ {{ thaiDate }}</div>
            </div>

            <div class="content-body">
                <div v-if="currentStep === 1" class="fade-in">
                    <div class="agenda-header">
                        <h4 class="agenda-label">วาระที่ 1 :</h4>
                        <h3 class="agenda-title">รายงานผลการดำเนินงานตามขอบเขตงาน</h3>
                    </div>
                    <p class="agenda-sub">1. ผลการดำเนินงานทุกขอบเขตในภาพรวม/รายงานขอบเขต</p>

                    <table class="modern-preview-table">
                        <thead>
                            <tr>
                                <th>ขอบเขตงาน</th>
                                <th width="80" class="text-center">ปีที่ทำ</th>
                                <th width="160">ความคืบหน้า</th>
                                <th width="140" class="text-center">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in selectedTasks" :key="item.id">
                                <td class="font-medium">{{ item.title }}</td>
                                <td class="text-center text-secondary">{{ item.year }}</td>
                                <td>
                                    <div class="preview-p-container">
                                        <div class="preview-p-bar">
                                            <div class="preview-p-fill" :style="{ width: item.progress + '%' }"></div>
                                        </div>
                                        <span class="preview-p-text">{{ item.progress }}%</span>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <span :class="['status-chip-preview', getStatusClass(item.statusText)]">
                                        {{ item.statusText }}
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="selectedTasks.length === 0">
                                <td colspan="4" class="empty-preview-text">
                                    -- กรุณาเลือกข้อมูลโครงการเพื่อแสดงในรายงาน --
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="currentStep === 2" class="fade-in">
                    <div class="agenda-header">
                        <h4 class="agenda-label">วาระที่ 2 :</h4>
                        <h3 class="agenda-title">ผลการปิด GAP รายขอบเขตงาน</h3>
                    </div>

                    <template v-for="group in gapGroups" :key="group.taskId">
                        <div v-if="group.gaps.filter(g => g.selected).length > 0" style="margin-bottom: 30px;">
                            <h4 style="color: var(--primary-purple); font-size: 16px; margin-bottom: 10px; font-weight: 800; -webkit-text-stroke: 0.2px var(--primary-purple);">
                                ◼️ ขอบเขตงาน: {{ group.taskName }}
                            </h4>
                            <table class="modern-preview-table">
                                <thead>
                                    <tr>
                                        <th width="40%">GAP</th>
                                        <th width="15%" class="text-center">ปีที่ทำ</th>
                                        <th width="25%">ความคืบหน้า</th>
                                        <th width="20%" class="text-center">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="gap in group.gaps.filter(g => g.selected)" :key="gap.id">
                                        <td>{{ gap.gapName }}</td>
                                        <td class="text-center">{{ gap.year }}</td>
                                        <td>
                                            <div class="preview-p-container">
                                                <div class="preview-p-bar">
                                                    <div class="preview-p-fill" :style="{ width: gap.progress + '%' }"></div>
                                                </div>
                                                <span class="preview-p-text">{{ gap.progress }}%</span>
                                            </div>
                                        </td>
                                        <td class="text-center">
                                            <span class="status-chip-preview" :class="gap.status === 'closed' ? 'status-closed' : 'status-pending'">
                                                {{ gap.status === 'closed' ? 'ดำเนินการเสร็จสิ้น' : 'กำลังดำเนินการ' }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>
                    
                    <div v-if="!gapGroups || gapGroups.length === 0" class="empty-preview-text">
                        -- กรุณาเลือกข้อมูลจากด้านซ้ายเพื่อแสดงในรายงาน --
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import '@/assets/Admin/css/Admin_Export.css'

const props = defineProps({
    selectedTasks: {
        type: Array,
        default: () => []
    },
    // 🌟 เพิ่มตัวแปรนี้เข้ามารับข้อมูล
    gapGroups: {
        type: Array,
        default: () => []
    },
    currentStep: {
        type: Number,
        default: 1
    }
})

const thaiDate = computed(() => {
    const d = new Date()
    return d.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
})

const getStatusClass = (status) => {
    if (!status) return ''
    const s = status.toLowerCase()

    // 1. กลุ่มเสร็จสิ้นแบบมีเงื่อนไข (ปิดงานแบบไม่ 100% / ยอมรับได้)
    if (s.includes('ยอมรับได้')) {
        return 'status-accepted' 
    }

    // 2. กลุ่มเสร็จสิ้นสมบูรณ์ 100% (สีเขียว)
    if (s.includes('เสร็จสิ้น') || s.includes('ผ่าน')) {
        return 'status-closed'
    }

    // 3. กลุ่มกำลังดำเนินการ (สีน้ำเงิน)
    if (s.includes('กำลัง') || s.includes('ดำเนินการ')) {
        return 'status-pending'
    }

    // 4. กลุ่มยังไม่เริ่ม หรือมีปัญหา (สีแดง)
    if (s.includes('ยังไม่') || s.includes('ล่าช้า') || s.includes('ไม่ผ่าน')) {
        return 'status-open'
    }

    return 'status-open' // ค่าเริ่มต้นถ้าไม่ตรงกับอะไรเลย
}

</script>