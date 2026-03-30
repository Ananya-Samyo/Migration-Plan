<template>
    <div class="main-wrapper" v-if="!loading">
        <header class="top-bar">
            <div class="left-head">
                <h1 class="page-title">แก้ไขการประเมินผลประโยชน์</h1>
            </div>

            <button class="btn-back-modern" @click="router.back()">
                <div class="icon-circle"> ❮ </div>
                <span class="text">ย้อนกลับ</span>
            </button>
        </header>

        <div class="content-wrapper">
            <div class="card header-card">
                <h2 class="section-title mb-4">1. ข้อมูลทั่วไปและสถานะโครงการ</h2>
                <div class="grid-3">
                    <div class="form-group">
                        <label>ชื่อขอบเขตงาน (Scope)</label>
                        <input v-model="form.scopeName" readonly class="input-readonly form-control bg-light" />
                    </div>

                    <div class="form-group">
                        <label>ผู้รับผิดชอบโครงการ</label>
                        <input v-model="form.owner" readonly class="input-readonly form-control bg-light" />
                    </div>

                    <div class="form-group">
                        <label>สถานะแผนงาน (project_status)</label>
                        <select v-model="evaluationData.project_status" :disabled="isViewer" class="form-control">
                            <option value="processing">กำลังดำเนินการ</option>
                            <option value="finish">เสร็จสิ้นโครงการ</option>
                        </select>
                    </div>
                </div>
            </div>

            <section class="card mt-4">
                <div class="card-header flex-between">
                    <h2 class="section-title text-success mb-0">2. ผลที่คาดว่าจะได้รับ (Expected Benefits)</h2>
                    <button v-if="!isViewer" type="button" class="btn-purple-sm" @click="addItem">+ เพิ่มรายการ</button>
                </div>

                <div class="card-body">
                    <div v-for="(item, index) in evaluationData.items" :key="index"
                        class="evaluation-item-card border rounded p-3 mb-4 bg-white">
                        <div class="item-header d-flex justify-content-between align-items-center mb-3">
                            <span class="item-number fw-bold text-primary">รายการที่ {{ index + 1 }}</span>
                            <button v-if="!isViewer && evaluationData.items.length > 1" @click="removeItem(index)"
                                class="btn btn-outline-danger btn-sm">ลบรายการนี้</button>
                        </div>

                        <div class="form-group mb-3">
                            <label class="fw-bold">วัตถุประสงค์ / ผลลัพธ์ที่คาดหวัง</label>
                            <textarea v-model="item.objective" placeholder="ระบุวัตถุประสงค์หลัก..." rows="2"
                                class="modern-input" :disabled="isViewer" />
                        </div>

                        <div class="form-group mb-3" style="margin-top: 20px;">
                            <label class="fw-bold text-danger">ก่อนปรับปรุงตามแผนงาน</label>
                            <input v-model="item.before_text" type="text" placeholder="ข้อความ (เช่น ลดระยะเวลา...)"
                                class="modern-input mb-2" :disabled="isViewer" />

                            <div class="inline-input-group">
                                <input v-model="item.before_number" type="number" step="0.01" placeholder="ตัวเลข"
                                    class="modern-input short-input" :disabled="isViewer" />

                                <select v-model="item.before_unit" class="modern-input short-input"
                                    :disabled="isViewer">
                                    <option value="">-- ไม่ระบุ --</option>
                                    <option value="ชั่วโมง">ชั่วโมง</option>
                                    <option value="นาที">นาที</option>
                                    <option value="วัน">วัน</option>
                                    <option value="เดือน">เดือน</option>
                                    <option value="ปี">ปี</option>
                                    <option value="บาท">บาท</option>
                                    <option value="ครั้ง">ครั้ง</option>
                                    <option value="ชิ้น">ชิ้น</option>
                                    <option value="คน">คน</option>
                                    <option value="%">%</option>
                                </select>

                                <span class="slash-divider">/</span>

                                <select v-model="item.before_per" class="modern-input short-input" :disabled="isViewer">
                                    <option value="">-- ไม่ระบุ --</option>
                                    <option value="ครั้ง">ครั้ง</option>
                                    <option value="วัน">วัน</option>
                                    <option value="เดือน">เดือน</option>
                                    <option value="ปี">ปี</option>
                                    <option value="ชิ้น">ชิ้น</option>
                                    <option value="บาท">บาท</option>
                                    <option value="คน">คน</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group mb-2" style="margin-top: 20px;">
                            <label class="fw-bold text-success">ผลที่คาดว่าจะได้รับหลังปรับปรุงตามแผนงาน</label>
                            <input v-model="item.expected_text" type="text" placeholder="ข้อความ (เช่น ลดเหลือ...)"
                                class="modern-input mb-2" :disabled="isViewer" />

                            <div class="inline-input-group">
                                <input v-model="item.expected_number" type="number" step="0.01" placeholder="ตัวเลข"
                                    class="modern-input short-input" :disabled="isViewer" />

                                <select v-model="item.before_unit" class="modern-input short-input readonly-input"
                                    disabled>
                                    <option value="">-- ไม่ระบุ --</option>
                                    <option value="ชั่วโมง">ชั่วโมง</option>
                                    <option value="นาที">นาที</option>
                                    <option value="วัน">วัน</option>
                                    <option value="เดือน">เดือน</option>
                                    <option value="ปี">ปี</option>
                                    <option value="บาท">บาท</option>
                                    <option value="ครั้ง">ครั้ง</option>
                                    <option value="ชิ้น">ชิ้น</option>
                                    <option value="คน">คน</option>
                                    <option value="%">%</option>
                                </select>

                                <span v-if="item.before_unit && item.before_per" class="slash-divider">/</span>

                                <select v-model="item.before_per" class="modern-input short-input readonly-input"
                                    disabled>
                                    <option value="">-- ไม่ระบุ --</option>
                                    <option value="ครั้ง">ครั้ง</option>
                                    <option value="วัน">วัน</option>
                                    <option value="เดือน">เดือน</option>
                                    <option value="ปี">ปี</option>
                                    <option value="ชิ้น">ชิ้น</option>
                                    <option value="บาท">บาท</option>
                                    <option value="คน">คน</option>
                                </select>
                            </div>

                            <div v-if="item.before_number && item.expected_number"
                                class="mt-3 p-3 bg-light border rounded d-flex align-items-center">
                                <span class="fw-bold me-2">ผลลัพธ์ที่คาดหวัง:</span>

                                <span v-if="Number(item.before_number) > Number(item.expected_number)"
                                    class="text-success fw-bold">
                                    ลดลง {{ (Number(item.before_number) -
                                        Number(item.expected_number)).toLocaleString(undefined, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 2
                                        }) }} {{ [item.before_unit,
                                    item.before_per].filter(Boolean).join(' / ') }}
                                </span>

                                <span v-else-if="Number(item.expected_number) > Number(item.before_number)"
                                    class="text-primary fw-bold">
                                    เพิ่มขึ้น {{ (Number(item.expected_number) -
                                        Number(item.before_number)).toLocaleString(undefined, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 2
                                        }) }} {{ [item.before_unit,
                                    item.before_per].filter(Boolean).join(' / ') }}
                                </span>

                                <span v-else class="text-secondary fw-bold">
                                    ไม่มีการเปลี่ยนแปลง
                                </span>
                            </div>

                        </div>

                    </div>
                </div>
            </section>

            <section class="card mt-4">
                <h2 class="section-title text-info mb-4">3. สรุปผลการประเมิน</h2>
                <div class="grid-2 gap-3">

                    <div class="form-group col-span-2">
                        <label class="fw-bold">ผลที่รับหลังปรับปรุงตามการดำเนินงานจริง</label>

                        <div class="radio-group-inline">
                            <label class="custom-radio">
                                <input type="radio" v-model="evaluationData.actual_type" value="text"
                                    :disabled="isViewer">
                                <span class="radio-mark"></span>
                                <span class="radio-text">กรอกเป็นข้อความ</span>
                            </label>

                            <label class="custom-radio">
                                <input type="radio" v-model="evaluationData.actual_type" value="number"
                                    :disabled="isViewer">
                                <span class="radio-mark"></span>
                                <span class="radio-text">กรอกเป็นตัวเลข</span>
                            </label>
                        </div>

                        <textarea v-if="evaluationData.actual_type === 'text'" v-model="evaluationData.actual_text"
                            class="form-control" placeholder="ผลลัพธ์ที่เกิดขึ้นจริง..." rows="3"
                            :disabled="isViewer" />

                        <div v-if="evaluationData.actual_type === 'number'" class="number-input-section">
                            <input v-model="evaluationData.actual_text" type="text"
                                placeholder="ข้อความ (เช่น ลดเหลือ...)" class="modern-input mb-2"
                                :disabled="isViewer" />

                            <div class="inline-input-group">
                                <input v-model="evaluationData.actual_number" type="number" step="0.01"
                                    placeholder="ตัวเลข" class="modern-input short-input" :disabled="isViewer" />

                                <select :value="evaluationData.items[0]?.before_unit"
                                    class="modern-input short-input readonly-input" disabled>
                                    <option value="">-- ไม่ระบุ --</option>
                                    <option value="ชั่วโมง">ชั่วโมง</option>
                                    <option value="นาที">นาที</option>
                                    <option value="วัน">วัน</option>
                                    <option value="เดือน">เดือน</option>
                                    <option value="ปี">ปี</option>
                                    <option value="บาท">บาท</option>
                                    <option value="ครั้ง">ครั้ง</option>
                                    <option value="ชิ้น">ชิ้น</option>
                                    <option value="คน">คน</option>
                                    <option value="%">%</option>
                                </select>

                                <span v-if="evaluationData.items[0]?.before_unit && evaluationData.items[0]?.before_per"
                                    class="slash-divider">/</span>

                                <select :value="evaluationData.items[0]?.before_per"
                                    class="modern-input short-input readonly-input" disabled>
                                    <option value="">-- ไม่ระบุ --</option>
                                    <option value="ครั้ง">ครั้ง</option>
                                    <option value="วัน">วัน</option>
                                    <option value="เดือน">เดือน</option>
                                    <option value="ปี">ปี</option>
                                    <option value="ชิ้น">ชิ้น</option>
                                    <option value="บาท">บาท</option>
                                    <option value="คน">คน</option>
                                </select>
                            </div>

                            <div v-if="evaluationData.items[0]?.before_number && evaluationData.actual_number"
                                class="mt-3 p-3 bg-light border rounded d-flex align-items-center">
                                <span class="fw-bold me-2">ผลลัพธ์จริงที่ได้ (เทียบกับก่อนปรับปรุง):</span>

                                <span
                                    v-if="Number(evaluationData.items[0].before_number) > Number(evaluationData.actual_number)"
                                    class="text-success fw-bold">
                                    ลดลง {{ (Number(evaluationData.items[0].before_number) -
                                        Number(evaluationData.actual_number)).toLocaleString(undefined, {
                                            minimumFractionDigits: 0, maximumFractionDigits: 2
                                        }) }} {{
                                        [evaluationData.items[0].before_unit,
                                        evaluationData.items[0].before_per].filter(Boolean).join(' / ') }}
                                </span>
                                <span
                                    v-else-if="Number(evaluationData.actual_number) > Number(evaluationData.items[0].before_number)"
                                    class="text-primary fw-bold">
                                    เพิ่มขึ้น {{ (Number(evaluationData.actual_number) -
                                        Number(evaluationData.items[0].before_number)).toLocaleString(undefined, {
                                            minimumFractionDigits: 0, maximumFractionDigits: 2
                                        }) }} {{
                                        [evaluationData.items[0].before_unit,
                                        evaluationData.items[0].before_per].filter(Boolean).join(' / ') }}
                                </span>
                                <span v-else class="text-secondary fw-bold">
                                    ไม่มีการเปลี่ยนแปลง
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="fw-bold">การประเมินผลที่ได้รับ</label>
                        <select v-model="evaluationData.evaluation_status" :disabled="isViewer" class="form-control">
                            <option value="">-- ระบุสถานะ --</option>
                            <option value="pass">เป็นไปตามที่คาดหวัง</option>
                            <option value="fail">ไม่เป็นไปตามที่คาดหวัง</option>
                            <option value="pending">ยังไม่สามารถประเมินได้</option>
                        </select>
                    </div>

                    <div class="form-group col-span-2">
                        <label class="fw-bold">ข้อเสนอแนะ (recommendation)</label>
                        <textarea v-model="evaluationData.recommendation" class="form-control"
                            placeholder="ข้อเสนอแนะเพิ่มเติม..." rows="2" :disabled="isViewer" />
                    </div>
                </div>
            </section>

            <div class="action-bar sticky-bottom p-3 bg-white border-top shadow-lg mt-4"
                style="display: flex; justify-content: center; width: 100%;">

                <button v-if="!isViewer" class="btn-primary py-3 px-5" @click="handleSave" style="min-width: 250px;">
                    💾 บันทึกข้อมูลการประเมิน
                </button>

                <button v-else class="btn-secondary py-3 px-5" @click="router.back()" style="min-width: 250px;">
                    ย้อนกลับ
                </button>

            </div>
        </div>
    </div>
    <div v-else class="loading-screen text-center p-5">
        <h3>กำลังโหลดข้อมูล...</h3>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'

import '../../../assets/Admin/css/Admin_UnifiedStyle.css'
import '../../../assets/Admin/css/Admin_2EditProgress.css'

const route = useRoute()
const router = useRouter()
const BASE_API = import.meta.env.VITE_API_BASE_URL
const isViewer = localStorage.getItem('role') === 'viewer'

const loading = ref(true)

const form = ref({
    scopeName: '',
    owner: ''
})

const evaluationData = ref({
    project_status: 'processing',
    evaluation_status: '',
    actual_type: 'text',
    actual_text: '',
    actual_number: '',
    recommendation: '',
    items: []
})

// 👇 เพิ่มโค้ด watch ตรงนี้ 👇
watch(() => evaluationData.value.actual_number, (newValue) => {
    // 1. ถ้าไม่ได้กรอกตัวเลข หรือไม่มีข้อมูล items ให้ข้ามไป
    if (!newValue || newValue === '' || evaluationData.value.items.length === 0) return;

    // 2. ดึงค่ามาเป็นตัวเลขเพื่อคำนวณ
    const actualNum = Number(newValue);
    const beforeNum = Number(evaluationData.value.items[0].before_number);
    const expectedNum = Number(evaluationData.value.items[0].expected_number);

    // ถ้าค่าเป้าหมายหรือก่อนปรับปรุงยังไม่ถูกกรอก ให้ข้ามไป
    if (isNaN(expectedNum) || isNaN(beforeNum)) return;

    // 3. วิเคราะห์ว่าเป็นเป้าหมายแบบ "ต้องการให้ลดลง" หรือ "ต้องการให้เพิ่มขึ้น"
    const isDecreaseGoal = expectedNum < beforeNum; 
    const isIncreaseGoal = expectedNum > beforeNum; 

    // 4. ตัดสินผลลัพธ์
    if (isDecreaseGoal) {
        // กรณีเป้าหมายลดลง: ของจริงต้อง "น้อยกว่าหรือเท่ากับ" เป้าหมายถึงจะผ่าน
        if (actualNum <= expectedNum) {
            evaluationData.value.evaluation_status = 'pass';
        } else {
            evaluationData.value.evaluation_status = 'fail';
        }
    } else if (isIncreaseGoal) {
        // กรณีเป้าหมายเพิ่มขึ้น: ของจริงต้อง "มากกว่าหรือเท่ากับ" เป้าหมายถึงจะผ่าน
        if (actualNum >= expectedNum) {
            evaluationData.value.evaluation_status = 'pass';
        } else {
            evaluationData.value.evaluation_status = 'fail';
        }
    }
});

onMounted(async () => {
    try {
        const token = localStorage.getItem('token')
        const projectId = route.params.id

        const res = await fetch(`${BASE_API}/api/admin/evaluation/${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (res.ok) {
            const data = await res.json()

            form.value.scopeName = data.scope_name || ''
            form.value.owner = data.coordinator_name || ''
            evaluationData.value.project_status = data.project_status || 'processing'
            evaluationData.value.evaluation_status = data.evaluation_status || ''

            // 👇 เริ่มส่วนที่แยกประเภท ผลลัพธ์จริง (actual_outcome) 👇
            const actualStr = data.actual_outcome || ''
            const actualParts = actualStr.split('||')

            // เช็คว่ามีตัวเลขเชื่อมอยู่ด้วย || หรือไม่
            if (actualParts.length > 1) {
                evaluationData.value.actual_type = 'number'
                evaluationData.value.actual_text = actualParts[0]
                evaluationData.value.actual_number = actualParts[1]
            } else {
                evaluationData.value.actual_type = 'text'
                evaluationData.value.actual_text = actualStr
            }
            // 👆 จบส่วนที่แยกประเภท 👆

            evaluationData.value.recommendation = data.recommendation || ''

            // จัดการชุดข้อมูล Evaluations (ลบส่วนที่ซ้ำซ้อนออกแล้ว)
            if (data.evaluations && data.evaluations.length > 0) {
                evaluationData.value.items = data.evaluations.map(e => {
                    // แยกข้อมูลที่ถูกเชื่อมด้วย || กลับมาใส่แต่ละช่อง
                    const bpParts = (e.before_plan || '').split('||')
                    const eoParts = (e.expected_outcome || '').split('||')

                    return {
                        evaluation_id: e.evaluation_id,
                        objective: e.objective || '',
                        before_text: bpParts[0] || (bpParts.length === 1 ? e.before_plan : ''),
                        before_number: bpParts[1] || '',
                        before_unit: bpParts[2] || '',
                        before_per: bpParts[3] || '',
                        expected_text: eoParts[0] || (eoParts.length === 1 ? e.expected_outcome : ''),
                        expected_number: eoParts[1] || ''
                    }
                })
            } else {
                addItem() // กรณีไม่มีข้อมูลเลย ให้สร้างช่องว่าง 1 ชุด
            }
        }
    } catch (err) {
        Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลได้', 'error')
        console.error(err)
    } finally {
        loading.value = false
    }
})

const addItem = () => {
    evaluationData.value.items.push({
        evaluation_id: null,
        objective: '',
        before_text: '',
        before_number: '',
        before_unit: '',
        before_per: '',
        expected_text: '',
        expected_number: ''
    })
}

const removeItem = (index) => {
    if (evaluationData.value.items.length > 1) {
        evaluationData.value.items.splice(index, 1)
    }
}

const handleSave = async () => {
    try {
        Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })

        let finalActualOutcome = evaluationData.value.actual_text;
        if (evaluationData.value.actual_type === 'number') {
            finalActualOutcome = `${evaluationData.value.actual_text || ''}||${evaluationData.value.actual_number || ''}`;
        }

        const payload = {
            project_plan_id: route.params.id,
            project_status: evaluationData.value.project_status,
            evaluation_status: evaluationData.value.evaluation_status,
            actual_outcome: finalActualOutcome,
            recommendation: evaluationData.value.recommendation,

            evaluations: evaluationData.value.items.map(item => ({
                evaluation_id: item.evaluation_id,
                objective: item.objective,
                before_plan: `${item.before_text || ''}||${item.before_number || ''}||${item.before_unit || ''}||${item.before_per || ''}`,
                expected_outcome: `${item.expected_text || ''}||${item.expected_number || ''}||${item.before_unit || ''}||${item.before_per || ''}`
            }))
        }

        const res = await fetch(`${BASE_API}/api/admin/evaluation-update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        })

        if (res.ok) {
            Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success').then(() => router.back())
        } else {
            throw new Error('ไม่สามารถบันทึกข้อมูลได้')
        }
    } catch (err) {
        Swal.fire('Error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error')
        console.error(err)
    }
}
</script>