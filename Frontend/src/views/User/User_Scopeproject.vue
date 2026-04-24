<template>
    <div class="scope-page">
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h1 class="page-title" style="margin: 0;">ขอบเขตแผนงาน</h1>

            <div class="header-actions" style="display: flex; gap: 15px; align-items: center;">
                <div class="search-box" style="display: flex; gap: 5px;">
                    <div style="position: relative; display: flex;">
                        <input v-model="searchQuery" type="text" placeholder="ค้นหา ขอบเขตงาน, ผู้รายงาน..."
                            @keyup.enter="applyFilter"
                            style="padding: 8px 12px; border-radius: 4px 0 0 4px; border: 1px solid #ccc; width: 250px; outline: none;" />

                        <span v-if="searchQuery" @click="resetFilter"
                            style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #ccc;">
                            ✖
                        </span>
                    </div>

                    <button @click="applyFilter"
                        style="padding: 8px 16px; border: none; background: #4b2e83; color: white; border-radius: 0 4px 4px 0; cursor: pointer; font-weight: bold;">
                        ค้นหา
                    </button>
                </div>
            </div>
        </div>

        <div class="table-wrapper">
            <table class="scope-table">
                <thead>
                    <tr>
                        <th class="text-left">ขอบเขตงาน</th>
                        <th class="text-left">หน่วยงาน</th>
                        <th class="text-left">ผู้รายงาน</th>
                        <th class="text-left">ความก้าวหน้า</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-if="loading">
                        <td colspan="4" style="text-align: center; padding: 40px; color: #4b2e83;">
                            <div class="loader-spinner"></div> กำลังโหลดข้อมูล...
                        </td>
                    </tr>

                    <template v-else-if="scopes && scopes.length > 0">
                        <template v-for="(scope, index) in scopes" :key="scope.id || index">
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
                                    <div class="detail-box" style="padding: 20px; background: #f9fafb;">
                                        <table class="detail-table" style="width: 100%; border-collapse: collapse; background: white;">
                                            <thead>
                                                <tr style="background: #f3f4f6;">
                                                    <th style="padding: 10px; border: 1px solid #ddd;">ชื่อแผนงานที่รับผิดชอบ</th>
                                                    <th style="padding: 10px; border: 1px solid #ddd;">รายละเอียดการดำเนินงาน</th>
                                                    <th style="padding: 10px; border: 1px solid #ddd;">ผลการวิเคราะห์ช่องว่าง (GAP Analysis)</th>
                                                    <th style="padding: 10px; border: 1px solid #ddd;">ความคืบหน้า</th>
                                                    <th style="padding: 10px; border: 1px solid #ddd;">การจัดการ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="plan in scope.plans" :key="plan.id" class="plan-row">
                                                    <td class="plan-name text-left" style="font-weight: bold; padding: 10px; border: 1px solid #ddd; color: #4b2e83;">
                                                        {{ plan.name }}
                                                    </td>
                                                    <td class="text-left" style="padding: 10px; border: 1px solid #ddd;">
                                                        {{ plan.details || plan.detail }}
                                                    </td>
                                                    <td class="text-left" style="padding: 10px; border: 1px solid #ddd;">
                                                        <ul v-if="plan.gaps && plan.gaps.length > 0" style="list-style: none; padding: 0; margin: 0;">
                                                            <li v-for="(gap, i) in plan.gaps" :key="i">
                                                                - {{ typeof gap === 'object' ? gap.detail : gap }}
                                                            </li>
                                                        </ul>
                                                        <span v-else style="color: #ccc;">-</span>
                                                    </td>
                                                    <td style="padding: 10px; border: 1px solid #ddd;">
                                                        <div class="progress-wrapper">
                                                            <div class="progress-container small">
                                                                <div class="progress-bar" :class="progressClass(plan.progress)"
                                                                    :style="{ width: plan.progress + '%' }"></div>
                                                            </div>
                                                            <span class="progress-text">{{ plan.progress }}%</span>
                                                        </div>
                                                    </td>
                                                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                                        <div class="action-buttons" style="display: flex; gap: 5px; justify-content: center;">
                                                            <button class="btn-progress" @click.stop="goToProgress(plan.id)">ความก้าวหน้า</button>
                                                            <button class="btn-evaluate" @click.stop="goToEvaluation(plan.id)">การประเมินผล</button>
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
                        <td colspan="4" style="text-align: center; padding: 60px; background: #fafafa;">
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                                <span style="font-size: 64px;">📦</span>
                                <p style="margin: 0; font-size: 20px; font-weight: bold; color: #999;">
                                    ไม่พบข้อมูลขอบเขตงานของคุณ
                                </p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="pagination-controls" v-if="totalPages > 1">
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

const scopes = ref([])
const expandedRow = ref(null)
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(1)

// --- เพิ่มตัวแปรสำหรับ Search ---
const searchQuery = ref('')

const fetchScopes = async (page = 1) => {
    try {
        loading.value = true
        const token = localStorage.getItem('token')
        if (!token) return router.push('/')

        // แก้ไข URL ให้ส่งค่า search ไปด้วย
        let url = `${API}/api/user/scopes?page=${page}&limit=10`
        if (searchQuery.value) {
            url += `&search=${encodeURIComponent(searchQuery.value)}`
        }

        const res = await fetch(url, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')

        const responseData = await res.json()
        
        if (responseData.data) {
            scopes.value = responseData.data
            currentPage.value = responseData.meta?.currentPage || 1
            totalPages.value = responseData.meta?.totalPages || 1
        } else {
            scopes.value = responseData
        }

        await nextTick()
        handleAutoExpand()

    } catch (err) {
        console.error('Fetch Scopes Error:', err)
        scopes.value = []
    } finally {
        loading.value = false
    }
}

// --- ฟังก์ชันสำหรับ Search ---
const applyFilter = () => {
    currentPage.value = 1
    expandedRow.value = null
    fetchScopes(1)
}

const resetFilter = () => {
    searchQuery.value = ''
    currentPage.value = 1
    expandedRow.value = null
    fetchScopes(1)
}

const handleAutoExpand = () => {
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

const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages.value) {
        expandedRow.value = null
        fetchScopes(newPage)
    }
}

const progressClass = (value) => {
    const num = Number(value)
    if (isNaN(num) || num < 50) return 'danger'
    if (num < 100) return 'warning'
    return 'success'
}

const goToProgress = (planId) => {
    router.push({ name: 'UserProgress', params: { id: planId } })
}

const goToEvaluation = (planId) => {
    router.push({ name: 'UserEvaluation', params: { id: planId } })
}

watch(
    () => [route.query.expand, route.query.scope_id],
    () => { handleAutoExpand() }
)

onMounted(() => {
    fetchScopes(1)
})
</script>