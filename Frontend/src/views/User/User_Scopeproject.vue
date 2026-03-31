<template>
    <div class="scope-page">
        <h1 class="page-title">ขอบเขตแผนงาน (ส่วนของผู้ใช้งาน)</h1>

        <div class="table-wrapper">
            <table class="scope-table">
                <thead>
                    <tr>
                        <th class="text-left">ขอบเขตงาน</th>
                        <th class="text-left">หน่วยงาน</th>
                        <th class="text-left">ผู้รายงาน</th>
                        <th>ความก้าวหน้าเฉลี่ย</th>
                    </tr>
                </thead>

                <tbody>
                    <template v-if="scopes && scopes.length > 0">
                        <template v-for="(scope, index) in scopes" :key="scope.id">
                            <tr :id="'scope-row-' + scope.id" class="scope-row"
                                :class="{ 'is-expanded': String(expandedRow) === String(scope.id) }"
                                @click="toggleRow(scope.id)">
                                <td>{{ scope.scope_name }}</td>
                                <td>{{ scope.department_name }}</td>
                                <td>{{ scope.coordinator }}</td>
                                <td>
                                    <div class="progress-wrapper">
                                        <div class="progress-container small">
                                            <div class="progress-bar" :class="progressClass(scope.progress_percent)"
                                                :style="{ width: scope.progress_percent + '%' }"></div>
                                        </div>
                                        <span class="progress-text">{{ scope.progress_percent }}%</span>
                                    </div>
                                </td>
                            </tr>

                            <tr v-if="String(expandedRow) === String(scope.id)">
                                <td colspan="4">
                                    <div class="detail-box">
                                        <table class="detail-table">
                                            <thead>
                                                <tr>
                                                    <th class="text-left">ชื่อแผนงานที่รับผิดชอบ</th>
                                                    <th class="text-left">รายละเอียดการดำเนินงาน</th>
                                                    <th class="text-left">ผลการวิเคราะห์ช่องว่าง (GAP Analysis)</th>
                                                    <th>ความคืบหน้า</th>
                                                    <th>การจัดการ</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                <tr v-for="plan in scope.plans" :key="plan.id" class="plan-row">
                                                    <td class="plan-name">
                                                        {{ plan.name }}
                                                    </td>
                                                    <td>{{ plan.details }}</td>
                                                    <td>
                                                        <ul class="gap-list">
                                                            <li v-for="(gap, i) in plan.gaps" :key="i"> {{ gap }}
                                                            </li>
                                                        </ul>
                                                    </td>
                                                    <td>
                                                        <div class="progress-wrapper">
                                                            <div class="progress-container small">
                                                                <div class="progress-bar"
                                                                    :class="progressClass(plan.progress)"
                                                                    :style="{ width: plan.progress + '%' }"></div>
                                                            </div>
                                                            <span class="progress-text">
                                                                {{ plan.progress }}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div class="action-buttons">
                                                            <button class="btn-progress"
                                                                @click.stop="goToProgress(plan.id)">
                                                                ความก้าวหน้า
                                                            </button>

                                                            <button class="btn-evaluate"
                                                                @click.stop="goToEvaluation(plan.id)">
                                                                การประเมินผล
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </template>

                    <tr v-else>
                        <td colspan="4" style="text-align: center; padding: 20px; color: #888;">
                            ไม่พบข้อมูลขอบเขตงานของคุณ
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import '../../assets/Admin/css/Admin_Scopeproject.css'

const API = import.meta.env.VITE_API_BASE_URL
const router = useRouter()
const route = useRoute()

const scopes = ref([])
const expandedRow = ref(null)

/* ===============================
    ฟังก์ชันดึงข้อมูลจาก API (ใช้ Logic ของ User)
================================ */
const fetchScopes = async () => {
    try {
        const token = localStorage.getItem('token')
        if (!token) return router.push('/')

        // เปลี่ยน Endpoint เป็นของฝั่ง User
        const res = await fetch(`${API}/api/user/scopes`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')

        const data = await res.json()
        scopes.value = data

        console.log(`📦 โหลดข้อมูลขอบเขตงานของผู้ใช้สำเร็จ: ${scopes.value.length} รายการ`)
        
        // เมื่อโหลดเสร็จ ให้เช็คว่ามี Query param ให้กางแถวอัตโนมัติหรือไม่
        await nextTick()
        handleAutoExpand()

    } catch (err) {
        console.error('Fetch Scopes Error:', err)
    }
}

/* ===============================
    ฟังก์ชันกางแถวและจัดการ UI (คงไว้จาก Admin)
================================ */
const handleAutoExpand = () => {
    // ใช้ได้ทั้ง query 'expand' (จาก User) หรือ 'scope_id' (จาก Admin)
    const targetId = route.query.expand || route.query.scope_id
    if (!targetId || scopes.value.length === 0) return

    const matchedScope = scopes.value.find(s => String(s.id) === String(targetId))

    if (matchedScope) {
        expandedRow.value = matchedScope.id
        nextTick(() => {
            setTimeout(() => {
                const rowElement = document.getElementById(`scope-row-${matchedScope.id}`)
                if (rowElement) {
                    rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    rowElement.style.transition = 'background-color 0.5s'
                    rowElement.style.backgroundColor = '#fff9db'
                    setTimeout(() => { rowElement.style.backgroundColor = '' }, 2500)
                }
            }, 600) 
        })
    }
}

const toggleRow = (id) => {
    expandedRow.value = String(expandedRow.value) === String(id) ? null : id
}

const progressClass = (value) => {
    const num = Number(value)
    if (isNaN(num) || num < 50) return 'danger'
    if (num < 100) return 'warning'
    return 'success'
}

/* ===============================
    ฟังก์ชันการนำทาง (ปรับให้เข้ากับ User Route)
================================ */
const goToProgress = (planId) => {
    router.push({ name: 'UserProgress', params: { id: planId } })
}

const goToEvaluation = (planId) => {
    router.push({ name: 'UserEvaluation', params: { id: planId } })
}

/* ===============================
    Watcher & Lifecycle
================================ */
watch(
    () => [route.query.expand, route.query.scope_id],
    () => {
        handleAutoExpand()
    }
)

onMounted(() => {
    fetchScopes()
})
</script>