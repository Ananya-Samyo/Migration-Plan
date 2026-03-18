<template>
    <div class="scope-page">
        <div class="page-header"
            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h1 class="page-title" style="margin: 0;">ขอบเขตแผนงาน</h1>

            <div class="header-actions" style="display: flex; gap: 15px; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-weight: bold; color: #4b2e83;">หน่วยงาน:</label>
                    <select v-model="selectedDepartment" @change="applyFilter" class="filter-select"
                        style="padding: 8px; border-radius: 4px; border: 1px solid #ccc; outline: none;">
                        <option value="">-- ทั้งหมด --</option>
                        <option v-for="dept in departments" :key="dept.department_id" :value="dept.department_name">
                            {{ dept.department_name }}
                        </option>
                    </select>
                </div>

                <div class="search-box" style="display: flex;">
                    <input v-model="searchQuery" type="text" placeholder="ค้นหา ขอบเขตงาน, ผู้รายงาน..."
                        @keyup.enter="applyFilter"
                        style="padding: 8px 12px; border-radius: 4px 0 0 4px; border: 1px solid #ccc; width: 250px; outline: none;" />
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

                                                    <td>{{ plan.detail }}</td>

                                                    <td>
                                                        <div v-if="plan.gaps && plan.gaps.length > 0">
                                                            <ul style="list-style: none; padding: 0; margin: 0;">
                                                                <li v-for="(gap, i) in plan.gaps" :key="i">
                                                                    {{ typeof gap === 'object' ? gap.detail : gap }}
                                                                </li>
                                                            </ul>
                                                        </div>
                                                        <span v-else style="color: #ccc;">-</span>
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

        <div class="pagination-controls" v-if="totalPages > 1 && !route.query.scope_id">
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

// ตัวแปรเดิม
const scopes = ref([])
const expandedRow = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)

// 🌟 ตัวแปรใหม่สำหรับ Filter และ Search
const selectedDepartment = ref('')
const searchQuery = ref('')
const departments = ref([])

/* ===============================
    ฟังก์ชันดึงรายชื่อหน่วยงานสำหรับ Dropdown
================================ */
const fetchDepartments = async () => {
    try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API}/api/departments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (Array.isArray(data)) {
            departments.value = data
        } else if (data.data) {
            departments.value = data.data
        }
    } catch (err) {
        console.error('Fetch Departments Error:', err)
    }
}

/* ===============================
    ฟังก์ชันกดค้นหา / เปลี่ยน Dropdown
================================ */
const applyFilter = () => {
    expandedRow.value = null
    fetchScopes(1)
}

/* ===============================
    ฟังก์ชันกางแถวอัตโนมัติ
================================ */
const handleAutoExpand = () => {
    const targetId = route.query.scope_id
    if (!targetId || scopes.value.length === 0) return

    console.log("🔍 กำลังพยายามกางแถว ID:", targetId)

    const matchedScope = scopes.value.find(s => {
        const sID = s.scope_id || s.id;
        return String(sID) === String(targetId);
    })

    if (matchedScope) {
        const finalID = matchedScope.scope_id || matchedScope.id;
        console.log("✅ พบข้อมูลที่ตรงกัน กำลังกางแถว...");

        expandedRow.value = finalID;

        nextTick(() => {
            setTimeout(() => {
                const rowElement = document.getElementById(`scope-row-${finalID}`)
                if (rowElement) {
                    rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

                    rowElement.style.transition = 'background-color 0.5s'
                    rowElement.style.backgroundColor = '#fff9db'
                    setTimeout(() => { rowElement.style.backgroundColor = '' }, 2500)
                }
            }, 600)
        })
    } else {
        console.warn("❌ ไม่พบ ID นี้ในข้อมูลที่โหลดมา")
    }
}

const toggleRow = (id) => {
    expandedRow.value = String(expandedRow.value) === String(id) ? null : id
}

/* ===============================
    ฟังก์ชันดึงข้อมูลจาก API (อัปเดตเพื่อรองรับ Filter)
================================ */
const fetchScopes = async (page = 1) => {
    try {
        const token = localStorage.getItem('token')
        if (!token) return router.push('/')

        const targetScopeId = route.query.scope_id
        const limit = targetScopeId ? 1000 : 10

        // 🌟 ต่อ string URL เพื่อส่ง parameter search และ department
        let url = `${API}/api/admin/scopes?page=${page}&limit=${limit}`
        if (searchQuery.value) {
            url += `&search=${encodeURIComponent(searchQuery.value)}`
        }
        if (selectedDepartment.value) {
            url += `&department=${encodeURIComponent(selectedDepartment.value)}`
        }

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        const responseData = await res.json()
        console.log("Check Data:", responseData.data);
        console.log(responseData.data[0].plans)

        if (responseData.data) {
            scopes.value = responseData.data
            currentPage.value = responseData.meta?.currentPage || 1
            totalPages.value = responseData.meta?.totalPages || 1

            console.log(`📦 โหลดข้อมูลสำเร็จ: ${scopes.value.length} รายการ`)
        } else {
            // กรณีไม่มีข้อมูล
            scopes.value = []
        }
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
    () => route.query.scope_id,
    (newId) => {
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
const goToProgress = (planId) => {
    router.push({
        name: 'AdminEditProgress',
        params: { id: planId }
    })
}

const goToEvaluation = (planId) => {
    router.push({
        name: 'AdminEditEvaluation',
        params: { id: planId }
    })
}

/* ===============================
    เริ่มต้นโหลดข้อมูล
================================ */
onMounted(() => {
    fetchDepartments()
    fetchScopes(1)
})
</script>