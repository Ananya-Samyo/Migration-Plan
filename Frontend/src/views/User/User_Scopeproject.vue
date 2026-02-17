<template>
    <div class="scope-page">
        <h1 class="page-title">ขอบเขตแผนงาน (ส่วนของผู้ใช้งาน)</h1>

        <div class="table-wrapper">
            <table class="scope-table">
                <thead>
                    <tr>
                        <th>ขอบเขตงาน</th>
                        <th>หน่วยงาน</th>
                        <th>ผู้รายงาน</th>
                        <th>ความก้าวหน้าเฉลี่ย</th>
                    </tr>
                </thead>

                <tbody>
                    <template v-for="(scope, index) in scopes" :key="scope.id">
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
                                                <th>ชื่อแผนงานที่รับผิดชอบ</th>
                                                <th>GAP Analysis</th>
                                                <th>รายละเอียดการดำเนินงาน</th>
                                                <th>ความคืบหน้า</th>
                                                <th>การจัดการ</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            <tr v-for="plan in scope.plans" :key="plan.id" class="plan-row">
                                                <td class="plan-name">{{ plan.name }}</td>
                                                <td>
                                                    <ul class="gap-list">
                                                        <li v-for="(gap, i) in plan.gaps" :key="i">{{ gap }}</li>
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
                                                        <span class="progress-text">{{ plan.progress }}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="action-buttons">
                                                        <button class="btn-progress" @click.stop="goToProgress(plan.id)">
                                                            บันทึกความก้าวหน้า
                                                        </button>
                                                        <button class="btn-evaluate" @click.stop="goToEvaluation(plan.id)">
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
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import '../../assets/Admin/css/Admin_Scopeproject.css' 

const BASE_API = import.meta.env.VITE_API_BASE_URL
const router = useRouter()
const route = useRoute()

const scopes = ref([])
const expandedRow = ref(null)

/* ===============================
   NAVIGATION 
================================ */
const goToProgress = (planId) => {
    router.push({ name: 'UserProgress', params: { id: planId } })
}

const goToEvaluation = (planId) => {
    router.push({ name: 'UserEvaluation', params: { id: planId } })
}

const toggleRow = (index) => {
    expandedRow.value = expandedRow.value === index ? null : index
}

const progressClass = (value) => {
    const num = Number(value)
    if (isNaN(num)) return 'danger'
    if (num < 50) return 'danger'
    if (num < 100) return 'warning'
    return 'success'
}

/* ===============================
   FETCH DATA - ดึงข้อมูลเฉพาะของตัวเอง
================================ */
onMounted(async () => {
    try {
        const token = localStorage.getItem('token'); // ดึงกุญแจ Token
        
        // เรียก API ชุดใหม่ที่เราจะสร้างใน Backend (ฝั่ง User)
        const res = await fetch(`${BASE_API}/api/user/scopes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // ส่ง Token ไปยืนยันตัวตน
                'Content-Type': 'application/json'
            }
        })

        if (!res.ok) {
            if (res.status === 401) {
                alert('เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่');
                router.push('/login');
                return;
            }
            throw new Error('โหลดข้อมูลไม่สำเร็จ');
        }

        const data = await res.json()
        scopes.value = data

        // จัดการเปิด Row ตาม ID ที่ส่งมาทาง URL (ถ้ามี)
        const scopeIdFromRoute = Number(route.params.scope_id)
        if (scopeIdFromRoute) {
            const index = scopes.value.findIndex(s => Number(s.id) === scopeIdFromRoute)
            if (index !== -1) {
                expandedRow.value = index
                setTimeout(() => {
                    document.querySelectorAll('.scope-row')[index]?.scrollIntoView({
                        behavior: 'smooth', block: 'center'
                    })
                }, 200)
            }
        }

    } catch (err) {
        console.error('Error fetching scopes:', err)
    }
})
</script>