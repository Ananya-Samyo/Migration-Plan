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

                    <div class="summary-dashboard" v-if="gapSummary.total > 0">
                        <div class="stat-cards">
                            <div class="stat-card">
                                <span class="stat-label">GAP ที่เลือกทั้งหมด</span>
                                <span class="stat-value">{{ gapSummary.total }}</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-label">ปิด GAP แล้ว (Closed)</span>
                                <span class="stat-value text-success">{{ gapSummary.closed }}</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-label">กำลังดำเนินการ (Pending)</span>
                                <span class="stat-value text-warning">{{ gapSummary.pending }}</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-label">ความคืบหน้าเฉลี่ย</span>
                                <span class="stat-value text-purple">{{ gapSummary.avgProgress }}%</span>
                            </div>
                        </div>

                        <div class="chart-container">
                            <h5 class="chart-title">📊 กราฟสรุปสัดส่วนสถานะการปิด GAP</h5>
                            <div class="stacked-bar-chart">
                                <div class="bar-segment closed" :style="{ width: gapSummary.closedPercent + '%' }">
                                    <span v-if="gapSummary.closedPercent > 5">{{ gapSummary.closedPercent }}%</span>
                                </div>
                                <div class="bar-segment pending" :style="{ width: gapSummary.pendingPercent + '%' }">
                                    <span v-if="gapSummary.pendingPercent > 5">{{ gapSummary.pendingPercent }}%</span>
                                </div>
                            </div>
                            <div class="chart-legend">
                                <div class="legend-item"><span class="dot closed"></span> ปิด GAP แล้ว</div>
                                <div class="legend-item"><span class="dot pending"></span> กำลังดำเนินการ</div>
                            </div>
                        </div>
                    </div>

                    <template v-for="group in gapGroups" :key="group.taskId">
                        <div v-if="group.gaps && group.gaps.filter(g => g.selected).length > 0" class="avoid-break"
                            style="margin-bottom: 30px;">
                            <h4
                                style="color: var(--primary-purple); font-size: 16px; margin-bottom: 10px; font-weight: 800;">
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
                                                    <div class="preview-p-fill" :style="{ width: gap.progress + '%' }">
                                                    </div>
                                                </div>
                                                <span class="preview-p-text">{{ gap.progress }}%</span>
                                            </div>
                                        </td>
                                        <td class="text-center">
                                            <span class="status-chip-preview"
                                                :class="gap.status === 'closed' ? 'status-closed' : 'status-pending'">
                                                {{ gap.status === 'closed' ? 'ปิด GAP แล้ว' : 'กำลังดำเนินการ' }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>

                    <div v-if="gapSummary.total === 0" class="empty-preview-text">
                        -- กรุณาเลือกข้อมูล GAP จากด้านซ้ายเพื่อแสดงในรายงาน --
                    </div>
                </div>

                <div v-if="currentStep === 3" class="fade-in">
                    <div class="agenda-header">
                        <h4 class="agenda-label">วาระที่ 3 :</h4>
                        <h3 class="agenda-title">การประเมินผลประโยชน์ที่ได้รับ</h3>
                    </div>

                    <div class="summary-dashboard" v-if="evalStats.total > 0"
                        style="display: flex; gap: 30px; align-items: center; margin-bottom: 30px;">

                        <div class="chart-box" style="width: 130px; height: 130px; position: relative; flex-shrink: 0;">
                            <svg viewBox="0 0 36 36" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" stroke-width="4.5">
                                </circle>
                                <circle v-if="donutSegments.green.val > 0" cx="18" cy="18" r="15.915" fill="none"
                                    stroke="#22c55e" stroke-width="4.5"
                                    :stroke-dasharray="donutSegments.green.dasharray"
                                    :stroke-dashoffset="donutSegments.green.offset"></circle>
                                <circle v-if="donutSegments.yellow.val > 0" cx="18" cy="18" r="15.915" fill="none"
                                    stroke="#eab308" stroke-width="4.5"
                                    :stroke-dasharray="donutSegments.yellow.dasharray"
                                    :stroke-dashoffset="donutSegments.yellow.offset"></circle>
                                <circle v-if="donutSegments.red.val > 0" cx="18" cy="18" r="15.915" fill="none"
                                    stroke="#ef4444" stroke-width="4.5" :stroke-dasharray="donutSegments.red.dasharray"
                                    :stroke-dashoffset="donutSegments.red.offset"></circle>
                            </svg>

                            <div class="donut-center"
                                style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                                <span style="font-size: 24px; font-weight: bold; color: #1e293b;">{{ evalStats.total
                                    }}</span>
                                <span style="display: block; font-size: 11px; color: #64748b;">รายการ</span>
                            </div>
                        </div>

                        <div class="legend-box"
                            style="display: flex; flex-direction: column; justify-content: center; gap: 10px;">
                            <div class="legend-item"><span class="dot green"></span>
                                เป็นไปตามที่คาดหวัง/ดีกว่าที่คาดหวัง ({{ evalStats.green }})</div>
                            <div class="legend-item"><span class="dot yellow"></span> ทำแล้วดีขึ้น
                                แต่ยังไม่เป็นไปตามที่คาดหวัง ({{ evalStats.yellow }})</div>
                            <div class="legend-item"><span class="dot red"></span> ไม่เป็นตามที่คาดหวัง/ไม่บรรลุเป้าหมาย
                                ({{ evalStats.red }})</div>
                        </div>
                    </div>

                    <template v-for="(group, index) in groupedEvaluations" :key="index">
                        <div class="avoid-break" style="margin-bottom: 30px;">
                            <h4
                                style="color: var(--primary-purple); font-size: 16px; margin-bottom: 10px; font-weight: 800;">
                                ◼️ ขอบเขตงาน: {{ group.scopeName }}
                            </h4>
                            <table class="modern-preview-table">
                                <thead>
                                    <tr>
                                        <th width="40%">1. สรุปประโยชน์ภาพรวม</th>
                                        <th width="40%">2. ข้อเสนอแนะการปรับปรุง</th>
                                        <th width="20%" class="text-center">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, idx) in group.items" :key="idx">
                                        <td style="white-space: pre-wrap; line-height: 1.5;">{{ item.actualOutcome ||
                                            '-' }}</td>
                                        <td style="white-space: pre-wrap; line-height: 1.5;">{{ item.recommendation ||
                                            '-' }}</td>
                                        <td class="text-center">
                                            <span class="status-pill" :class="item.colorStatus">
                                                {{ item.colorStatus === 'green' ? 'เป็นไปตามเป้า' : (item.colorStatus
                                                === 'red' ? 'ไม่บรรลุเป้า' : 'รอปรับปรุง') }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>

                    <div v-if="evalStats.total === 0" class="empty-preview-text">
                        -- กรุณาเลือกข้อมูลการประเมินจากด้านซ้ายเพื่อแสดงในรายงาน --
                    </div>
                </div>

                <div v-if="currentStep === 4" class="fade-in">
                    <div class="agenda-header">
                        <h4 class="agenda-label">วาระที่ 4 :</h4>
                        <h3 class="agenda-title">ภาพรวมประเด็นปัญหา</h3>
                    </div>

                    <template v-for="(group, index) in groupedProblems" :key="index">
                        <div class="avoid-break" style="margin-bottom: 30px;">
                            <h4
                                style="color: var(--primary-purple); font-size: 16px; margin-bottom: 10px; font-weight: 800;">
                                ◼️ ขอบเขตงาน: {{ group.scopeName }}
                            </h4>
                            <table class="modern-preview-table">
                                <thead>
                                    <tr>
                                        <th width="40%">แผนงาน/โครงการ (Project Plan)</th>
                                        <th width="60%">ประเด็นปัญหา (Problem Detail)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, idx) in group.items" :key="idx">
                                        <td style="line-height: 1.5; color: #334155; font-weight: 500;">
                                            {{ item.planName || '-' }}
                                        </td>
                                        <td style="white-space: pre-wrap; line-height: 1.5; color: #475569;">
                                            {{ item.problemDetail || '-' }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>

                    <div v-if="!selectedProblems || selectedProblems.length === 0" class="empty-preview-text">
                        -- กรุณาเลือกข้อมูลประเด็นปัญหาจากด้านซ้ายเพื่อแสดงในรายงาน --
                    </div>
                </div>

                <div v-if="currentStep === 5" class="fade-in">
                    <div class="agenda-header">
                        <h3 class="agenda-title">ประโยชน์และความสำเร็จตามแผน</h3>
                    </div>

                    <table class="modern-preview-table" style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 12px;">
                        <thead>
                            <tr style="background: #f8fafc;">
                                <th rowspan="2" width="15%" style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: middle; text-align: center;">ขอบเขตงาน</th>
                                <th rowspan="2" width="8%" style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: middle; text-align: center;">สายงาน</th>
                                <th colspan="4" style="border: 1px solid #cbd5e1; padding: 8px; background: #f1f5f9; text-align: center;">ประโยชน์ที่คาดว่าจะได้รับ</th>
                                <th rowspan="2" width="25%" style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: middle; text-align: center;">ความสำเร็จตาม Migration Plan</th>
                            </tr>
                            <tr style="background: #f8fafc;">
                                <th width="13%" style="border: 1px solid #cbd5e1; padding: 8px; font-weight: 600; color: #334155; text-align: center;">ลดขั้นตอน/เวลา</th>
                                <th width="13%" style="border: 1px solid #cbd5e1; padding: 8px; font-weight: 600; color: #334155; text-align: center;">ลดรายจ่าย</th>
                                <th width="13%" style="border: 1px solid #cbd5e1; padding: 8px; font-weight: 600; color: #334155; text-align: center;">เพิ่มรายได้</th>
                                <th width="13%" style="border: 1px solid #cbd5e1; padding: 8px; font-weight: 600; color: #334155; text-align: center;">เพิ่มความพึงพอใจ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, index) in selectedBenefits" :key="index">
                                <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top; font-weight: 500; color: #0f172a;">
                                    {{ item.title }}
                                </td>
                                
                                <td class="text-center" style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top; color: #475569;">
                                    {{ item.lineOfWork || '-' }}
                                </td>
                                
                                <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top; text-align: center;">
                                    <div v-if="item.b1_check" style="margin-bottom: 6px;">
                                        <span style="display: inline-flex; justify-content: center; align-items: center; width: 22px; height: 22px; background-color: #4ade80; color: white; border-radius: 50%; font-size: 14px; font-weight: bold;">✓</span>
                                    </div>
                                    <div style="font-size: 11px; color: #475569; line-height: 1.5; text-align: left;">{{ item.b1_text }}</div>
                                </td>
                                
                                <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top; text-align: center;">
                                    <div v-if="item.b2_check" style="margin-bottom: 6px;">
                                        <span style="display: inline-flex; justify-content: center; align-items: center; width: 22px; height: 22px; background-color: #4ade80; color: white; border-radius: 50%; font-size: 14px; font-weight: bold;">✓</span>
                                    </div>
                                    <div style="font-size: 11px; color: #475569; line-height: 1.5; text-align: left;">{{ item.b2_text }}</div>
                                </td>
                                
                                <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top; text-align: center;">
                                    <div v-if="item.b3_check" style="margin-bottom: 6px;">
                                        <span style="display: inline-flex; justify-content: center; align-items: center; width: 22px; height: 22px; background-color: #4ade80; color: white; border-radius: 50%; font-size: 14px; font-weight: bold;">✓</span>
                                    </div>
                                    <div style="font-size: 11px; color: #475569; line-height: 1.5; text-align: left;">{{ item.b3_text }}</div>
                                </td>
                                
                                <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top; text-align: center;">
                                    <div v-if="item.b4_check" style="margin-bottom: 6px;">
                                        <span style="display: inline-flex; justify-content: center; align-items: center; width: 22px; height: 22px; background-color: #4ade80; color: white; border-radius: 50%; font-size: 14px; font-weight: bold;">✓</span>
                                    </div>
                                    <div style="font-size: 11px; color: #475569; line-height: 1.5; text-align: left;">{{ item.b4_text }}</div>
                                </td>

                                <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top;">
                                    <div style="margin-bottom: 8px; font-size: 12px;">
                                        <span style="font-weight: 600; color: #334155;">ปีที่ทำ:</span> <span style="color: #475569;">{{ item.migrationYear || '-' }}</span>
                                    </div>
                                    <div style="margin-bottom: 8px; font-size: 12px;">
                                        <span style="font-weight: 600; color: #334155;">ความคืบหน้า:</span>
                                        <div style="display: flex; align-items: center; margin-top: 4px;">
                                            <div style="flex-grow: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; margin-right: 8px;">
                                                <div :style="{ width: (item.progress || 0) + '%', background: (item.progress >= 80 ? '#16a34a' : '#f97316'), height: '100%' }"></div>
                                            </div>
                                            <span :style="{ fontSize: '11px', fontWeight: '600', color: (item.progress >= 80 ? '#16a34a' : '#f97316'), minWidth: '30px' }">{{ item.progress || 0 }}%</span>
                                        </div>
                                    </div>
                                    <div style="font-size: 12px; margin-top: 8px;">
                                        <span style="font-weight: 600; color: #334155;">รายละเอียด:</span>
                                        <div style="color: #475569; margin-top: 4px; line-height: 1.5; white-space: pre-wrap;">{{ item.migrationDetail || '-' }}</div>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="!selectedBenefits || selectedBenefits.length === 0">
                                <td colspan="7" style="text-align: center; padding: 30px; color: #94a3b8; font-style: italic; border: 1px solid #cbd5e1;">
                                    -- กรุณาเลือกข้อมูลประโยชน์ที่คาดว่าจะได้รับเพื่อแสดงในรายงาน --
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import '@/assets/Admin/css/Admin_Export.css'

const props = defineProps({
    selectedTasks: { type: Array, default: () => [] },
    gapGroups: { type: Array, default: () => [] },
    selectedEvaluations: { type: Array, default: () => [] },
    selectedProblems: { type: Array, default: () => [] }, 
    selectedBenefits: { type: Array, default: () => [] }, 
    currentStep: { type: Number, default: 1 }
})

const thaiDate = computed(() => {
    const d = new Date()
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
})

const getStatusClass = (status) => {
    if (!status) return ''
    const s = status.toLowerCase()
    if (s.includes('ยอมรับได้')) return 'status-accepted'
    if (s.includes('เสร็จสิ้น') || s.includes('ผ่าน')) return 'status-closed'
    if (s.includes('กำลัง') || s.includes('ดำเนินการ')) return 'status-pending'
    if (s.includes('ยังไม่') || s.includes('ล่าช้า') || s.includes('ไม่ผ่าน')) return 'status-open'
    return 'status-open'
}

// ================= ฟังก์ชันสำหรับ Step 2 =================
const gapSummary = computed(() => {
    let total = 0, closed = 0, pending = 0, totalProgress = 0

    if (!props.gapGroups || !Array.isArray(props.gapGroups)) {
        return { total: 0, closed: 0, pending: 0, avgProgress: 0, closedPercent: 0, pendingPercent: 0 }
    }

    props.gapGroups.forEach(group => {
        if (group.gaps && Array.isArray(group.gaps)) {
            const selectedGaps = group.gaps.filter(g => g.selected)
            selectedGaps.forEach(gap => {
                total++
                if (gap.status === 'closed') closed++
                else pending++
                totalProgress += Number(gap.progress) || 0
            })
        }
    })

    const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0
    const closedPercent = total > 0 ? Math.round((closed / total) * 100) : 0
    const pendingPercent = total > 0 ? 100 - closedPercent : 0

    return { total, closed, pending, avgProgress, closedPercent, pendingPercent }
})

// ================= ฟังก์ชันสำหรับ Step 3 =================
const evalStats = computed(() => {
    const total = props.selectedEvaluations.length || 0
    if (total === 0) return { green: 0, yellow: 0, red: 0, total: 0 }

    const green = props.selectedEvaluations.filter(e => e.colorStatus === 'green').length
    const yellow = props.selectedEvaluations.filter(e => e.colorStatus === 'yellow').length
    const red = props.selectedEvaluations.filter(e => e.colorStatus === 'red').length
    return { green, yellow, red, total }
})

const donutSegments = computed(() => {
    const s = evalStats.value
    if (s.total === 0) return { green: { val: 0 }, yellow: { val: 0 }, red: { val: 0 } }

    const pGreen = (s.green / s.total) * 100
    const pYellow = (s.yellow / s.total) * 100
    const pRed = (s.red / s.total) * 100

    return {
        green: { val: pGreen, dasharray: `${pGreen} ${100 - pGreen}`, offset: 0 },
        yellow: { val: pYellow, dasharray: `${pYellow} ${100 - pYellow}`, offset: 100 - pGreen },
        red: { val: pRed, dasharray: `${pRed} ${100 - pRed}`, offset: 100 - (pGreen + pYellow) }
    }
})

const groupedEvaluations = computed(() => {
    const map = new Map()
    props.selectedEvaluations.forEach(item => {
        if (!map.has(item.scopeId)) {
            map.set(item.scopeId, { scopeName: item.scopeName, items: [] })
        }
        map.get(item.scopeId).items.push(item)
    })
    return Array.from(map.values())
})

// ================= ฟังก์ชันสำหรับ Step 4 =================
const groupedProblems = computed(() => {
    const map = new Map()
    if (!props.selectedProblems) return []

    props.selectedProblems.forEach(item => {
        if (!map.has(item.scopeId)) {
            map.set(item.scopeId, { scopeName: item.scopeName, items: [] })
        }
        map.get(item.scopeId).items.push(item)
    })
    return Array.from(map.values())
})

</script>