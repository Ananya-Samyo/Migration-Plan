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
                            <tr class="scope-row" @click="toggleRow(index)">
                                <td>{{ scope.scope_name }}</td>
                                <td>{{ scope.department_name }}</td>
                                <td>{{ scope.coordinator }}</td>
                                <td>
                                    <div class="progress-wrapper">
                                        <div class="progress-container">
                                            <div class="progress-bar" :class="progressClass(scope.progress_percent)"
                                                :style="{ width: scope.progress_percent + '%' }"></div>
                                        </div>
                                        <span class="progress-text">{{ scope.progress_percent }}%</span>
                                    </div>
                                </td>
                            </tr>

                            <tr v-if="expandedRow === index">
                                <td colspan="4">
                                    <div class="detail-box">
                                        <table class="detail-table">
                                            <thead>
                                                <tr>
                                                    <th>ชื่อแผนงาน</th>
                                                    <th>ผลการวิเคราะห์ช่องว่าง (GAP Analysis)</th>
                                                    <th>รายละเอียดการดำเนินงาน</th>
                                                    <th>ความคืบหน้า</th>
                                                    <th>การจัดการ</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                <tr v-for="plan in scope.plans" :key="plan.id" class="plan-row">
                                                    <td class="plan-name" @click="goToProjectDetail(plan.id)"
                                                        style="cursor: pointer">
                                                        {{ plan.name }}
                                                    </td>

                                                    <td>
                                                        <ul class="gap-list">
                                                            <li v-for="(gap, i) in plan.gaps" :key="i">
                                                                {{ gap }}
                                                            </li>
                                                        </ul>
                                                    </td>

                                                    <td>{{ plan.action }}</td>

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
                            ไม่พบข้อมูล
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="pagination-controls" v-if="totalPages > 1">
            <button 
                class="btn-page" 
                :disabled="currentPage === 1" 
                @click="changePage(currentPage - 1)">
                &lt; ย้อนกลับ
            </button>

            <span class="page-info">หน้า {{ currentPage }} จาก {{ totalPages }}</span>

            <button 
                class="btn-page" 
                :disabled="currentPage === totalPages" 
                @click="changePage(currentPage + 1)">
                ถัดไป &gt;
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import '../../assets/Admin/css/Admin_Scopeproject.css'

const API = import.meta.env.VITE_API_BASE_URL
const router = useRouter()
const route = useRoute()

// State
const scopes = ref([]) // เก็บ Array ข้อมูลจริง
const expandedRow = ref(null)

// Pagination State
const currentPage = ref(1)
const totalPages = ref(1)

/* ===============================
   TOGGLE SCOPE ROW
================================ */
const toggleRow = (index) => {
    expandedRow.value = expandedRow.value === index ? null : index
}

/* ===============================
   NAVIGATION functions
================================ */
const goToProgress = (planId) => {
    router.push({ name: 'AdminProgress', params: { id: planId } })
}

const goToEvaluation = (planId) => {
    router.push({ name: 'AdminEvaluation', params: { id: planId } })
}

const progressClass = (value) => {
    const num = Number(value)
    if (isNaN(num)) return 'danger'
    if (num < 50) return 'danger'
    if (num < 100) return 'warning'
    return 'success'
}

/* ===============================
   FETCH DATA (CORE LOGIC)
================================ */
const fetchScopes = async (page = 1) => {
    try {
        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/')
            return
        }

        // 🔥 เรียก API พร้อมส่ง query param ?page=...
        const res = await fetch(`${API}/api/admin/scopes?page=${page}&limit=10`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('token')
                router.push('/')
                return
            }
            throw new Error(`HTTP error! status: ${res.status}`)
        }

        const responseData = await res.json()

        // 🔥 แก้ไขจุดที่เป็นปัญหา: แยก data และ meta ออกจากกัน
        // Backend ส่งมาเป็น: { data: [...], meta: { currentPage: 1, ... } }
        if (responseData.data && Array.isArray(responseData.data)) {
            scopes.value = responseData.data // เอาแค่ Array ไปใส่
            
            // อัปเดต Pagination
            if (responseData.meta) {
                currentPage.value = responseData.meta.currentPage
                totalPages.value = responseData.meta.totalPages
            }
        } else if (Array.isArray(responseData)) {
            // เผื่อกรณี Backend เก่าส่งมาเป็น Array ล้วน
            scopes.value = responseData
        } else {
            console.error('Format ข้อมูลไม่ถูกต้อง:', responseData)
            scopes.value = []
        }

    } catch (err) {
        console.error('โหลดข้อมูล scopes ไม่สำเร็จ', err)
        scopes.value = []
    }
}

// ฟังก์ชันเปลี่ยนหน้า
const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages.value) {
        expandedRow.value = null // หุบแถวที่กางอยู่
        fetchScopes(newPage) // โหลดข้อมูลหน้าใหม่
    }
}

/* ===============================
   ON MOUNTED
================================ */
onMounted(async () => {
    // โหลดหน้า 1 เสมอตอนเข้าครั้งแรก
    await fetchScopes(1)

    // Logic เดิม: เช็ค Route Param เพื่อกางแถว (Deep Linking)
    const scopeIdFromRoute = Number(route.params.scope_id)
    if (scopeIdFromRoute && scopes.value.length > 0) {
        const index = scopes.value.findIndex(
            s => Number(s.scope_id) === scopeIdFromRoute // ตรวจสอบ key ให้ตรงกับ DB (scope_id)
        )

        if (index !== -1) {
            expandedRow.value = index
            setTimeout(() => {
                document
                    .querySelectorAll('.scope-row')
                    [index]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    })
            }, 200)
        }
    }
})
</script>