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

                    <button v-if="searchQuery || selectedDepartment" @click="resetFilter"
                        style="padding: 8px 12px; border: 1px solid #ccc; background: white; color: #666; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        ล้างค่า
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
                    <tr v-if="isLoading">
                        <td colspan="4" style="text-align: center; padding: 40px; color: #4b2e83;">
                            <div class="loader-spinner"></div> กำลังโหลดข้อมูล...
                        </td>
                    </tr>

                    <template v-else-if="scopes && scopes.length > 0">
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
                                    <div class="detail-box" style="padding: 20px; background: #f9fafb;">
                                        <table class="detail-table"
                                            style="width: 100%; border-collapse: collapse; background: white;">
                                            <thead>
                                                <tr style="background: #f3f4f6;">
                                                    <th style="padding: 10px; border: 1px solid #ddd;">ชื่อแผนงาน</th>
                                                    <th style="padding: 10px; border: 1px solid #ddd;">
                                                        รายละเอียดการดำเนินงาน</th>
                                                    <th style="padding: 10px; border: 1px solid #ddd;">
                                                        ผลการวิเคราะห์ช่องว่าง (GAP Analysis)</th>
                                                    <th style="padding: 10px; border: 1px solid #ddd;">ความคืบหน้า</th>
                                                    <th style="padding: 10px; border: 1px solid #ddd;">การจัดการ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="plan in scope.plans" :key="plan.id || plan.project_plan_id"
                                                    class="plan-row">
                                                    <td class="plan-name text-center"
                                                        @click="goToProjectDetail(plan.id || plan.project_plan_id)"
                                                        style="cursor: pointer; color: #4b2e83; font-weight: bold; padding: 10px; border: 1px solid #ddd;">
                                                        {{ plan.name || plan.plan_name }}
                                                    </td>
                                                    <td class="text-center"
                                                        style="padding: 10px; border: 1px solid #ddd;">{{ plan.detail }}
                                                    </td>
                                                    <td class="text-center"
                                                        style="padding: 10px; border: 1px solid #ddd;">
                                                        <div v-if="plan.gaps && plan.gaps.length > 0">
                                                            <ul
                                                                style="list-style: none; padding: 0; margin: 0; text-align: left;">
                                                                <li v-for="(gap, i) in plan.gaps" :key="i">
                                                                    - {{ typeof gap === 'object' ? gap.detail : gap }}
                                                                </li>
                                                            </ul>
                                                        </div>
                                                        <span v-else style="color: #ccc;">-</span>
                                                    </td>
                                                    <td style="padding: 10px; border: 1px solid #ddd;">
                                                        <div class="progress-wrapper">
                                                            <div class="progress-container small">
                                                                <div class="progress-bar"
                                                                    :class="progressClass(plan.progress)"
                                                                    :style="{ width: plan.progress + '%' }"></div>
                                                            </div>
                                                            <span class="progress-text">{{ plan.progress }}%</span>
                                                        </div>
                                                    </td>
                                                    <td
                                                        style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                                        <div class="action-buttons"
                                                            style="display: flex; gap: 5px; justify-content: center;">
                                                            <button class="btn-progress"
                                                                @click.stop="goToProgress(plan.id || plan.project_plan_id)">ความก้าวหน้า</button>
                                                            <button class="btn-evaluate"
                                                                @click.stop="goToEvaluation(plan.id || plan.project_plan_id)">การประเมินผล</button>
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
                        <td colspan="4" style="text-align: center; padding: 50px; background: #fafafa;">
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                                <span style="font-size: 48px; filter: grayscale(1);">🔍</span>
                                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #4b2e83;">
                                    ไม่พบข้อมูลที่ท่านค้นหา</p>
                                <p style="margin: 0; font-size: 14px; color: #666;">
                                    กรุณาลองเปลี่ยนคำค้นหา หรือเลือกหน่วยงานอื่น
                                </p>
                                <button @click="resetFilter"
                                    style="margin-top: 10px; padding: 5px 15px; border: 1px solid #4b2e83; background: none; color: #4b2e83; border-radius: 4px; cursor: pointer;">
                                    ล้างการค้นหา
                                </button>
                            </div>
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

const fetchScopes = async (page = 1) => {
    try {
        const token = localStorage.getItem('token')
        if (!token) return router.push('/')

        const targetScopeId = route.query.scope_id
        const limit = targetScopeId ? 1000 : 10

        // สร้าง URL พร้อม Query Params
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

        // 1. ตรวจสอบข้อมูลที่ได้รับ
        if (responseData && responseData.data && responseData.data.length > 0) {
            // ✅ กรณีมีข้อมูล
            scopes.value = responseData.data
            currentPage.value = responseData.meta?.currentPage || 1
            totalPages.value = responseData.meta?.totalPages || 1

            // ป้องกัน Error ตอน Log: เช็กก่อนว่าตัวที่ 0 มี plans ไหม
            if (responseData.data[0].plans) {
                console.log("Plans of first item:", responseData.data[0].plans)
            }
        } else {
            // ❌ กรณีไม่พบข้อมูล (อาเรย์ว่าง)
            scopes.value = []
            currentPage.value = 1
            totalPages.value = 0
            console.log("🔍 ไม่พบข้อมูลที่ตรงตามเงื่อนไข")
        }

        await nextTick()
        handleAutoExpand()

    } catch (err) {
        console.error('Fetch Error:', err)
        scopes.value = []
    }
}

const applyFilter = () => {
    currentPage.value = 1;
    fetchScopes(1);
};

// ฟังก์ชันสำหรับล้างค่าการค้นหาทั้งหมด
const resetFilter = () => {
    searchQuery.value = '';
    selectedDepartment.value = '';
    currentPage.value = 1;
    fetchScopes(1);
};

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