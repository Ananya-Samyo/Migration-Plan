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
                    <template v-for="(scope, index) in scopes" :key="scope.id">
                        <!-- Main Row -->
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

                        <!-- Expanded Detail -->
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
                                                <!-- ชื่อแผนงาน -->
                                                <td class="plan-name" @click="goToProjectDetail(plan.id)"
                                                    style="cursor: pointer">
                                                    {{ plan.name }}
                                                </td>

                                                <!-- GAP -->
                                                <td>
                                                    <ul class="gap-list">
                                                        <li v-for="(gap, i) in plan.gaps" :key="i">
                                                            {{ gap }}
                                                        </li>
                                                    </ul>
                                                </td>

                                                <!-- รายละเอียด -->
                                                <td>{{ plan.action }}</td>

                                                <!-- ความคืบหน้า -->
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

                                                <!-- การจัดการ -->
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
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import '../../assets/Admin/css/Admin_Scopeproject.css'

const API = import.meta.env.VITE_API_BASE_URL

const router = useRouter()
const route = useRoute()
const expandedRow = ref(null)
const activeScopeId = ref(null)

/* ===============================
   TOGGLE SCOPE ROW
================================ */
const toggleRow = (index) => {
    expandedRow.value = expandedRow.value === index ? null : index
}

/* ===============================
   NAVIGATION
================================ */
const goToProgress = (planId) => {
    router.push({ name: 'AdminProgress', params: { id: planId } })
}

const goToEvaluation = (planId) => {
    router.push({ name: 'AdminEvaluation', params: { id: planId } })
}

/* ===============================
   PROGRESS COLOR
================================ */
const progressClass = (value) => {
  const num = Number(value)

  if (isNaN(num)) return 'danger' 

  if (num < 50) return 'danger'
  if (num < 100) return 'warning'
  return 'success'
}


/* ===============================
   LOCAL STORAGE KEY
================================ */
const STORAGE_KEY = 'admin_scopes'

/* ===============================
   SCOPES STATE
================================ */
const scopes = ref([])

/* ===============================
   LOAD FROM LOCAL STORAGE
================================ */
onMounted(async () => {
    try {
        const res = await fetch(`${API}/admin/scopes`)
        const data = await res.json()
        scopes.value = data

        // 🔥 อ่าน scope_id จาก route
        const scopeIdFromRoute = Number(route.params.scope_id)

        if (scopeIdFromRoute) {
            const index = scopes.value.findIndex(
                s => Number(s.id) === scopeIdFromRoute
            )

            if (index !== -1) {
                expandedRow.value = index

                // (เสริม) scroll ไปตำแหน่งที่กาง
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

    } catch (err) {
        console.error('โหลดข้อมูล scopes ไม่สำเร็จ', err)
    }
})

</script>