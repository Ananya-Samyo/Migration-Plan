<template>
    <div class="main-wrapper" v-if="!loading && projectData && projectData.coordinator">
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
            <div class="card project-card">
                <h2 class="section-title mb-4">รายละเอียดแผนงาน</h2>

                <div class="field mb-3">
                    <label class="fw-bold">ชื่อขอบเขตงาน</label>
                    <input v-model="form.scopeName" type="text" class="form-control bg-light" />
                </div>

                <div class="project-info-container border rounded p-3 mb-4 bg-white">
                    <div class="grid-2">
                        <div class="field">
                            <label>ชื่อแผนงาน</label>
                            <input v-model="projectData.projectName" type="text" :disabled="isViewer" />
                        </div>
                        <div class="field">
                            <label>กองที่รับผิดชอบ</label>
                            <select v-model="projectData.department_id" :disabled="isViewer">
                                <option value="">-- เลือกกอง --</option>
                                <option v-for="d in departments" :key="d.department_id" :value="d.department_id">
                                    {{ d.department_name }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="field mt-3">
                        <label>ผู้ประสานงานหลัก (Coordinator)</label>
                        <div class="grid-3">
                            <input v-model="projectData.coordinator.name" placeholder="ชื่อ-สกุล"
                                :disabled="isViewer" />
                            <input v-model="projectData.coordinator.email" placeholder="อีเมล" @blur="checkUserEmail"
                                :disabled="isViewer" />
                            <input v-model="projectData.coordinator.phone_number" placeholder="เบอร์โทร"
                                :disabled="isViewer" />
                        </div>
                    </div>
                </div>
            </div>

            <section class="card mt-4">
                <div class="card-header flex-between">
                    <h2 class="section-title text-success mb-0">ผลที่คาดว่าจะได้รับจากการทำ Low Level</h2>
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
                <h2 class="section-title text-info mb-4">ผลการดำเนินการจริง</h2>
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

                    <div class="form-group col-span-2" v-if="evaluationData.evaluation_status === 'fail'">
                        <label class="fw-bold text-danger"
                            style="display: flex; align-items: center; gap: 6px; position: relative;">
                            ระบุปัญหาอุปสรรค

                            <span class="tooltip-trigger" style="cursor: help; display: flex; align-items: center;">
                                <svg style="width: 16px; height: 16px; fill: #17a2b8;"
                                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                    <path
                                        d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
                                </svg>

                                <div class="custom-tooltip">
                                    <div class="tooltip-header">
                                        การพิจารณาปัญหาในการดำเนินงานและความต้องการการสนับสนุนจากคณะกรรมการ DTG</div>
                                    <ul class="tooltip-list">
                                        <li><strong>1. ปัญหาที่ต้องการบูรณาการร่วมกันระหว่างหน่วยงาน</strong>
                                            <ul>
                                                <li>แผนงานที่เกี่ยวข้องตั้งแต่ 2 สายงาน
                                                    และไม่สามารถหาข้อตกลงระหว่างหน่วยงานเองได้</li>
                                                <li>การเปลี่ยนแปลงในแผนงานที่ต้องการการตัดสินใจจากคณะกรรมการ DTG</li>
                                                <li>แผนงานที่อยู่ในความรับผิดชอบของสายงานหนึ่ง
                                                    ที่สามารถหาข้อตกลงระหว่างหน่วยงานภายในได้</li>
                                                <li>แผนงานที่เกี่ยวข้องตั้งแต่ 2 สายงาน
                                                    แต่สามารถหาข้อตกลงระหว่างหน่วยงานเองได้</li>
                                            </ul>
                                        </li>
                                        <li><strong>2. ปัญหาด้านงบประมาณและทรัพยากร</strong>
                                            <ul>
                                                <li>ความต้องการด้านงบประมาณหรือทรัพยากรที่ไม่สามารถจัดหาได้เองหรือไม่เพียงพอ
                                                    เช่น ไม่มีคนพัฒนาระบบ, ต้องรอคิวในการพัฒนานาน เป็นต้น</li>
                                                <li>ขาดแคลนทรัพยากรที่ต้องเบิก/ขอยืมจากสายงานอื่น</li>
                                                <li>ปัญหาด้านงบประมาณหรือทรัพยากรที่สามารถแก้ไขได้เอง
                                                    โดยการบริหารจัดการงบประมาณ/ทรัพยากรภายในสายงาน
                                                    หรือสามารถขอปรับเปลี่ยนงบประมาณ/ทรัพยากรเองได้</li>
                                            </ul>
                                        </li>
                                        <li><strong>3. ปัญหาที่กระทบต่อวัตถุประสงค์หลักของโครงการ</strong>
                                            <ul>
                                                <li>ปัญหาที่กระทบต่อวัตถุประสงค์หลักขององค์กรในแผนยุทธศาสตร์
                                                    และมีความเร่งด่วนต้องดำเนินงาน</li>
                                                <li>ความล่าช้าที่จะส่งผลให้ไม่สามารถบรรลุเป้าหมายธุรกิจได้</li>
                                                <li>การเปลี่ยนแปลงขอบเขตของโครงการ (Scope Change)
                                                    ที่มีผลกระทบกับงบประมาณ เวลา หรือคุณค่า (Value)</li>
                                                <li>การเปลี่ยนแปลงระยะเวลาหรือลำดับการดำเนินงานของแผนงาน</li>
                                            </ul>
                                        </li>
                                        <li><strong>4. ปัญหาความเสี่ยงระดับสูง</strong>
                                            <ul>
                                                <li>ความเสี่ยงที่อาจทำให้โครงการล้มเหลวหรือกระทบต่อภาพลักษณ์องค์กร</li>
                                                <li>ความเสี่ยงด้านกฎหมาย ความปลอดภัย หรือการกำกับดูแล (compliance)</li>
                                                <li>ความเสี่ยงของแผนงานที่สามารถบริหารจัดการได้เองในสายงาน</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            </span>
                        </label>

                        <textarea v-model="evaluationData.problem" class="form-control"
                            placeholder="โปรดระบุปัญหาหรืออุปสรรคที่ทำให้ไม่เป็นไปตามเป้าหมาย..." rows="2"
                            :disabled="isViewer"></textarea>
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

const projectData = ref({
    projectName: '',
    department_name: '',
    department_id: '',
    coordinator: {
        name: '',
        email: '',
        phone_number: ''
    }
})

const departments = ref([])

watch(
    [
        () => evaluationData.value.actual_number,
        () => evaluationData.value.items[0]?.before_number,
        () => evaluationData.value.items[0]?.expected_number
    ],
    ([newActual, newBefore, newExpected]) => {
        if (!newActual || !newBefore || !newExpected) return;

        const actualNum = Number(newActual);
        const beforeNum = Number(newBefore);
        const expectedNum = Number(newExpected);

        if (isNaN(actualNum) || isNaN(beforeNum) || isNaN(expectedNum)) return;

        const isDecreaseGoal = expectedNum < beforeNum;

        if (isDecreaseGoal) {
            evaluationData.value.evaluation_status = (actualNum <= expectedNum) ? 'pass' : 'fail';
        } else {
            evaluationData.value.evaluation_status = (actualNum >= expectedNum) ? 'pass' : 'fail';
        }
    }
);

onMounted(async () => {
    try {
        const token = localStorage.getItem('token')
        const projectId = route.params.id

        const deptRes = await fetch(`${BASE_API}/api/departments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (deptRes.ok) {
            departments.value = await deptRes.json()
        }

        const res = await fetch(`${BASE_API}/api/admin/evaluation/${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (res.ok) {
            const data = await res.json()

            form.value.scopeName = data.scope_name || ''
            form.value.owner = data.coordinator_name || ''
            evaluationData.value.project_status = data.project_status || 'processing'
            evaluationData.value.evaluation_status = data.evaluation_status || ''
            projectData.value.projectName = data.project_name || data.scope_name || ''
            projectData.value.department_id = data.department_id || ''
            projectData.value.coordinator = {
                name: data.coordinator_name || '',
                email: data.coordinator_email || '',
                phone_number: data.coordinator_phone || ''
            }

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

            evaluationData.value.recommendation = data.recommendation || ''

            if (data.evaluations && data.evaluations.length > 0) {
                evaluationData.value.items = data.evaluations.map(e => {
                    const bpParts = (e.before_plan || '').split('||');
                    const eoParts = (e.expected_outcome || '').split('||');

                    return {
                        evaluation_id: e.evaluation_id,
                        objective: e.objective || '',
                        before_text: bpParts[0] || '',
                        before_number: bpParts[1] || '',
                        before_unit: bpParts[2] || '',
                        before_per: bpParts[3] || '',
                        expected_text: eoParts[0] || '',
                        expected_number: eoParts[1] || '',
                    }
                });
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
            problem: evaluationData.value.problem,

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