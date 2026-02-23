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
                        <tr class="scope-row" @click="toggleRow(scope.id)">
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

                        <tr v-if="expandedRow === scope.id">
                            <td colspan="4">
                                <div class="detail-box">
                                    <table class="detail-table">
                                        <thead>
                                            <tr>
                                                <th>ชื่อแผนงานที่รับผิดชอบ</th>
                                                <th>รายละเอียดการดำเนินงาน</th>
                                                <th>ผลการวิเคราะห์ช่องว่าง (GAP Analysis)</th>
                                                <th>การจัดการ</th>
                                                <th>ปุ่มดำเนินการ</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            <tr v-for="plan in scope.plans" :key="plan.id" class="plan-row">
                                                <td class="plan-name">{{ plan.name }}</td>

                                                <td>{{ plan.details }}</td>

                                                <td>
                                                    <ul class="gap-list">
                                                        <li v-for="(gap, i) in plan.gaps" :key="i">{{ gap }}</li>
                                                    </ul>
                                                </td>

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
                                                        <button class="btn-progress"
                                                            @click.stop="goToProgress(plan.id)">
                                                            บันทึกความก้าวหน้า
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

const toggleRow = (id) => {
    if (expandedRow.value === id) {
        expandedRow.value = null
    } else {
        expandedRow.value = id
    }
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
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE_API}/api/user/scopes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');

        const data = await res.json();
        scopes.value = data;

        const expandId = Number(route.query.expand);

        if (expandId) {
            // 1. ค้นหาว่า ID ที่ส่งมาอยู่ในข้อมูลที่โหลดมาหรือไม่
            const targetScope = scopes.value.find(s => Number(s.id) === expandId);

            if (targetScope) {
                // 2. สั่งกางแถวนั้น (ใช้ ID แทน Index จะแม่นยำกว่า)
                expandedRow.value = expandId;

                // 3. รอให้ Vue เรนเดอร์หน้าจอเสร็จ แล้วเลื่อนหน้าจอไปหา
                setTimeout(() => {
                    const targetElement = document.getElementById(`scope-${expandId}`);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });

                        targetElement.classList.add('highlight-row');
                    }
                }, 500);
            }
        }
    } catch (err) {
        console.error('Error fetching scopes:', err);
    }
});
</script>