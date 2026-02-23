<template>
    <div class="scope-page">
        <h1 class="page-title">ขอบเขตแผนงาน</h1>

        <div class="table-wrapper">
            <table class="scope-table">
                <thead>
                    <tr>
                        <th>ขอบเขตงาน</th>
                        <th>หน่วยงาน</th>
                        <th>ผู้รายงาน</th>
                        <th>ความก้าวหน้า</th>
                    </tr>
                </thead>

                <tbody>
                    <template v-if="scopes && scopes.length > 0">
                        <template v-for="(scope, index) in scopes" :key="scope.scope_id || index">
                            <tr :id="'scope-row-' + (scope.scope_id || scope.id)" class="scope-row"
                                :class="{ 'is-expanded': String(expandedRow) === String(scope.scope_id || scope.id) }"
                                @click="toggleRow(scope.scope_id || scope.id)">
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

                            <tr v-if="String(expandedRow) === String(scope.scope_id || scope.id)">
                                <td colspan="4">
                                    <div class="detail-box">
                                        <table class="detail-table">
                                            <thead>
                                                <tr>
                                                    <th>ชื่อแผนงาน</th>
                                                    <th>รายละเอียดการดำเนินงาน</th>
                                                    <th>ผลการวิเคราะห์ช่องว่าง (GAP Analysis)</th>
                                                    <th>ความคืบหน้า</th>
                                                    <th>การจัดการ</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                <tr v-for="plan in scope.plans" :key="plan.id || plan.project_plan_id"
                                                    class="plan-row">
                                                    <td class="plan-name"
                                                        @click="goToProjectDetail(plan.id || plan.project_plan_id)"
                                                        style="cursor: pointer">
                                                        {{ plan.name || plan.plan_name }}
                                                    </td>

                                                    <td>{{ plan.details }}</td>

                                                    <td>
                                                        <ul class="gap-list">
                                                            <li v-for="(gap, i) in plan.gaps" :key="i">
                                                                {{ gap }}
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
                                                                @click.stop="goToProgress(plan.id || plan.project_plan_id)">
                                                                ความก้าวหน้า
                                                            </button>

                                                            <button class="btn-evaluate"
                                                                @click.stop="goToEvaluation(plan.id || plan.project_plan_id)">
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
                            ไม่พบข้อมูล
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="pagination-controls" v-if="totalPages > 1 && !route.params.scope_id">
            <button class="btn-page" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
                &lt; ย้อนกลับ
            </button>
            <span class="page-info">หน้า {{ currentPage }} จาก {{ totalPages }}</span>
            <button class="btn-page" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
                ถัดไป &gt;
            </button>
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

// State
const scopes = ref([])
const expandedRow = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)

/* ===============================
    ฟังก์ชันกางแถวอัตโนมัติ
================================ */
const handleAutoExpand = () => {
    const targetId = route.params.scope_id
    if (!targetId || scopes.value.length === 0) return

    console.log("🔍 กำลังพยายามกางแถว ID:", targetId)

    // ค้นหาข้อมูลที่ตรงกัน (รองรับทั้งชื่อฟิลด์ scope_id และ id)
    const matchedScope = scopes.value.find(s => {
        const sID = s.scope_id || s.id;
        return String(sID) === String(targetId);
    })

    if (matchedScope) {
        const finalID = matchedScope.scope_id || matchedScope.id;
        console.log("✅ พบข้อมูลที่ตรงกัน กำลังกางแถว...");

        // ตั้งค่าให้แถวนั้นกางออก
        expandedRow.value = finalID;

        nextTick(() => {
            setTimeout(() => {
                const rowElement = document.getElementById(`scope-row-${finalID}`)
                if (rowElement) {
                    // เลื่อนหน้าจอไปที่แถวนั้น
                    rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

                    // ทำ Highlighting ชั่วคราวเพื่อให้ผู้ใช้สังเกตง่าย
                    rowElement.style.transition = 'background-color 0.5s'
                    rowElement.style.backgroundColor = '#fff9db'
                    setTimeout(() => { rowElement.style.backgroundColor = '' }, 2500)
                }
            }, 600) // รอให้ Animation ของการกางตารางเริ่มทำงานก่อนค่อยเลื่อน
        })
    } else {
        console.warn("❌ ไม่พบ ID นี้ในข้อมูลที่โหลดมา")
    }
}

const toggleRow = (id) => {
    // ถ้าคลิกซ้ำแถวเดิมให้ปิด ถ้าคลิกแถวใหม่ให้เปิด
    expandedRow.value = String(expandedRow.value) === String(id) ? null : id
}

/* ===============================
    ฟังก์ชันดึงข้อมูลจาก API
================================ */
const fetchScopes = async (page = 1) => {
    try {
        const token = localStorage.getItem('token')
        if (!token) return router.push('/')

        // ถ้ามี scope_id ใน URL ให้ดึงข้อมูลชุดใหญ่มาเลยเพื่อให้หา ID นั้นเจอแน่นอน
        const targetScopeId = route.params.scope_id
        const limit = targetScopeId ? 1000 : 10

        const res = await fetch(`${API}/api/admin/scopes?page=${page}&limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        const responseData = await res.json()

        if (responseData.data) {
            scopes.value = responseData.data
            currentPage.value = responseData.meta?.currentPage || 1
            totalPages.value = responseData.meta?.totalPages || 1

            console.log(`📦 โหลดข้อมูลสำเร็จ: ${scopes.value.length} รายการ`)
        }

        // เมื่อข้อมูลลง State แล้ว ให้รอ DOM Update แล้วค่อยสั่งกางแถว
        await nextTick()
        handleAutoExpand()

    } catch (err) {
        console.error('Fetch Error:', err)
    }
}

/* ===============================
    Watcher: ตรวจจับการเปลี่ยนแปลง URL
================================ */
watch(
    () => route.params.scope_id,
    (newId) => {
        // กรณีอยู่ที่หน้าเดิมแต่คลิกเลือก Task ใหม่จาก Sidebar หรือ Dashboard
        if (newId) {
            expandedRow.value = null
            fetchScopes(1)
        }
    }
)

const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages.value) {
        expandedRow.value = null
        fetchScopes(newPage)
    }
}

const progressClass = (value) => {
    const num = Number(value)
    if (num < 50) return 'danger'
    if (num < 100) return 'warning'
    return 'success'
}

/* ===============================
    ฟังก์ชันการนำทาง
================================ */
const goToProjectDetail = (id) => {
    router.push(`/admin/project/${id}`)
}

const goToProgress = (planId) => {
    router.push({ name: 'AdminProgress', params: { id: planId } })
}

const goToEvaluation = (planId) => {
    router.push({ name: 'AdminEvaluation', params: { id: planId } })
}

/* ===============================
    เริ่มต้นโหลดข้อมูล
================================ */
onMounted(() => {
    fetchScopes(1)
})
</script>