<template>
  <div class="dashboard">

    <header class="page-header">
      <div class="header-title">
        <h1>📊 Dashboard ติดตามงาน</h1>
        <p>ภาพรวมสถานะการดำเนินงานและ Gap Analysis</p>
      </div>

      <div class="header-actions">
        <div class="control-group date-dropdown" @click.stop="isOpen = !isOpen">
          <span class="icon" style="font-size: 1.2rem">🕒</span>
          <span class="label">
            {{
              {
                all: 'ทั้งหมด',
                today: 'วันนี้',
                yesterday: 'เมื่อวาน',
                week: 'สัปดาห์นี้',
                month: 'เดือนนี้',
                year: 'ปีนี้',
                custom: 'กำหนดเอง'
              }[dateMode] || 'กำหนดเอง'
            }}
          </span>
          <span class="arrow">▾</span>

          <ul v-if="isOpen" class="dropdown-menu">
            <li @click.stop="selectMode('all')">ทั้งหมด</li>
            <li @click.stop="selectMode('today')">วันนี้</li>
            <li @click.stop="selectMode('yesterday')">เมื่อวาน</li>
            <li @click.stop="selectMode('week')">สัปดาห์นี้</li>
            <li @click.stop="selectMode('month')">เดือนนี้</li>
          </ul>

        </div>

        <div class="control-group date-picker" @click="openDate">
          <span class="icon" style="font-size: 1.2rem">📅</span>
          <span class="label">{{ buddhistDateText }}</span>
          <input ref="dateInput" type="date" v-model="selectedDate.start" class="hidden-input"
            @change="onManualDateChange" />
        </div>

      </div>
    </header>

    <div class="section-divider main-scope">
      <span class="divider-text">🏢 ภาพรวมการบริหารขอบเขตงาน (Scope Management)</span>
    </div>

    <section class="scope-summary-grid executive-view">
      <div class="scope-status-card total" @click="handleScopeCardClick('all')">
        <div class="card-icon">🗄️</div>
        <div class="card-info">
          <span class="label">ขอบเขตงานทั้งหมด</span>
          <span class="value">{{ tasks.length }} </span>
        </div>
      </div>

      <div class="scope-status-card ongoing" @click="handleScopeCardClick('ongoing')">
        <div class="card-icon">⚙️</div>
        <div class="card-info">
          <span class="label">กำลังดำเนินงาน</span>
          <span class="value">{{ ongoingScopesCount }} </span>
        </div>
      </div>

      <div class="scope-status-card completed" @click="handleScopeCardClick('completed')">
        <div class="card-icon">🏆</div>
        <div class="card-info">
          <span class="label">ดำเนินงานเสร็จสิ้น</span>
          <span class="value">{{ completedScopesCount }} </span>
        </div>
      </div>
    </section>

    <div class="overall-progress-bar">
      <div class="progress-label">
        ความคืบหน้าการดำเนินงานของระบบโดยรวม
        <span>{{ overallProgress }}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{
          width: overallProgress + '%',
          backgroundColor: overallProgressColor
        }" />
      </div>
    </div>

    <div class="section-divider sub-plan">
      <span class="divider-text">🔍 รายละเอียดสถานะแผนงานย่อย (Gap Analysis)</span>
    </div>

    <section class="summary-grid operational-view">
      <SummaryCard title="แผนงานทั้งหมด" :value="planSummary.total" type="warning" icon="📁"
        @click="handleCardClick('all_plans')" />

      <SummaryCard title="แผนงานที่ยังไม่ปิด GAP" :value="planSummary.openCount" type="primary" icon="📌"
        @click="handleCardClick('open')" />

      <SummaryCard title="แผนงานที่ปิด GAP เสร็จแล้ว" :value="planSummary.closedCount" type="success" icon="✅"
        @click="handleCardClick('closed')" />

      <SummaryCard title="แผนงานที่ไม่ได้ปิด GAP แต่ยอมรับได้" :value="planSummary.acceptableCount" type="danger"
        icon="⚠️" @click="handleCardClick('acceptable')" />
    </section>

    <section class="content-layout">
      <div class="panel chart-area">
        <div class="panel-header">
          <h3>📈 สัดส่วนสถานะ</h3>
        </div>
        <div class="panel-body">
          <StatusChart :selectedDate="selectedDate" />
        </div>
      </div>

      <div class="right-column">
        <div class="panel table-area">
          <div class="panel-header">
            <h3>📋 รายการงานทั้งหมด</h3>
            <span class="badge">{{ tasks.length }} รายการ</span>
          </div>
          <div class="panel-body scrollable">
            <TaskTable :tasks="tasks" />
          </div>
        </div>

        <div class="panel table-area">
          <div class="panel-body">
            <LineChart :selectedDate="selectedDate" />
          </div>
        </div>
      </div>
    </section>

    <div v-if="isModalOpen" class="custom-modal-overlay" @click.self="closeModal">
      <div class="custom-modal-content">
        <div class="modal-header">
          <h2>{{ modalTitle }}</h2>
          <button class="close-btn" @click="closeModal">✖</button>
        </div>

        <div class="modal-body">
          <div class="search-box mb-3">
            <span class="search-icon">🔍</span>
            <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อแผนงาน..." class="form-control" />
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th width="5%" class="text-center">ลำดับ</th>
                  <th width="35%">ชื่อแผนงาน</th>
                  <th width="15%" class="text-center">ความคืบหน้า</th>
                  <th width="15%" class="text-center">ความเร่งด่วน</th>
                  <th width="15%" class="text-center">สถานะ</th>
                  <th width="15%" class="text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paginatedData.length === 0">
                  <td colspan="6" class="text-center" style="padding: 40px;">
                    <span style="font-size: 2rem;">📭</span>
                    <p>ไม่พบข้อมูลในหมวดหมู่นี้</p>
                  </td>
                </tr>

                <tr v-for="(item, index) in paginatedData" :key="item.id">
                  <td class="text-center">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                  <td>
                    <div style="font-weight: bold;">{{ item.title || item.plan_name }}</div>
                    <small v-if="item.parent_scope" class="text-muted">หัวข้อหลัก: {{ item.parent_scope }}</small>
                  </td>
                  <td class="text-center">{{ Math.round(item.progress || 0) }} %</td>
                  <td class="text-center">
                    <span :class="['urgency-badge', getUrgency(item.endDate || item.end_date).class]">
                      {{ getUrgency(item.endDate || item.end_date).label }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="badge" :class="getBadgeClass(item.status)">
                      {{
                        item.progress >= 100 ? 'เสร็จสิ้น' :
                          (item.status === 'closed' ? 'ปิด GAP แล้ว' :
                            (item.status === 'acceptable' ? 'ยอมรับได้' : 'ยังไม่ปิด GAP'))
                      }}
                    </span>
                  </td>
                  <td class="text-center">
                    <button class="btn-detail" @click="goToScopePage(item.id)">📄 รายละเอียด</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="custom-task-pagination" v-if="totalPages > 1"
            style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px;">
            <button class="custom-page-btn" @click="prevPage" :disabled="currentPage === 1">
              &lt; ก่อนหน้า
            </button>

            <span class="custom-page-info">
              หน้า {{ currentPage }} จาก {{ totalPages }}
            </span>

            <button class="custom-page-btn" @click="nextPage" :disabled="currentPage === totalPages">
              ถัดไป &gt;
            </button>
          </div>
        </div>

      </div>
    </div>

  </div>

</template>

<script setup>
import { ref, onMounted, computed, watch, inject } from 'vue';
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

import '../../assets/Admin/css/Admin_Dashboard.css'

import SummaryCard from '@/components/SummaryCard.vue'
import TaskTable from '@/components/TaskTable.vue'
import StatusChart from '@/components/StatusChart.vue'
import LineChart from '@/components/LineChart.vue'

/* =========================================
    1. CONSTANTS & ROUTER
========================================= */
const API = import.meta.env.VITE_API_BASE_URL
const router = useRouter()
const itemsPerPage = 10

/* =========================================
    2. STATE
========================================= */
const globalSelectedYear = inject('globalSelectedYear', ref('all'));
const dateMode = ref('all')
const selectedDate = ref({ start: '', end: '' })
const isLoading = ref(false)
const isOpen = ref(false)
const dateInput = ref(null)

const isExporting = ref(false)
const currentExportDate = ref(new Date().toISOString().split('T')[0])

const tasks = ref([])
const gapDetails = ref([])
const gapChartData = ref(null)
const overallProgress = ref(0)
const scopeSummary = ref({ total: 0, ongoing: 0, completed: 0 });
const planSummary = ref({ total: 0, openCount: 0, closedCount: 0, acceptableCount: 0 });

// Modal State
const isModalOpen = ref(false)
const modalTitle = ref('')
const modalDataList = ref([])
const searchQuery = ref('')
const currentPage = ref(1)

/* =========================================
    3. COMPUTED PROPERTIES
========================================= */
const total = computed(() => planSummary.value.total)
const openCount = computed(() => planSummary.value.openCount)
const closedCount = computed(() => planSummary.value.closedCount)
const acceptableCount = computed(() => planSummary.value.acceptableCount)

const ongoingScopesCount = computed(() =>
  tasks.value.filter(t => (t.progress || 0) < 100).length
);

const completedScopesCount = computed(() =>
  tasks.value.filter(t => (t.progress || 0) >= 100).length
);

const filteredData = computed(() => {
  if (!searchQuery.value) return modalDataList.value
  const query = searchQuery.value.toLowerCase()
  return modalDataList.value.filter(item => {
    const name = (item.title || item.name || '').toLowerCase()
    const dept = (item.department_name || '').toLowerCase()
    return name.includes(query) || dept.includes(query)
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / itemsPerPage) || 1
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredData.value.slice(start, end)
})

const overallProgressColor = computed(() => {
  if (overallProgress.value < 50) return '#ef4444'
  if (overallProgress.value < 80) return '#6d28d9'
  return '#16a34a'
})

const buddhistDateText = computed(() => {
  if (dateMode.value === 'all' || !selectedDate.value.start) return 'ทั้งหมด'
  const formatTH = (dateStr) => {
    const d = new Date(dateStr)
    return `${d.getDate()} ${d.toLocaleDateString('th-TH', { month: 'long' })} ${d.getFullYear() + 543}`
  }
  return selectedDate.value.start === selectedDate.value.end
    ? formatTH(selectedDate.value.start)
    : `${formatTH(selectedDate.value.start)} - ${formatTH(selectedDate.value.end)}`
})

/* =========================================
    4. HELPERS
========================================= */
const formatDateISO = (d) => d.toISOString().slice(0, 10)

const setDateRange = (mode) => {
  const now = new Date()
  let start = ''
  let end = ''

  switch (mode) {
    case 'today':
      start = end = formatDateISO(now)
      break
    case 'yesterday':
      const yesterday = new Date()
      yesterday.setDate(now.getDate() - 1)
      start = end = formatDateISO(yesterday)
      break
    case 'week':
      const day = now.getDay() || 7
      const mon = new Date(now)
      mon.setDate(now.getDate() - day + 1)
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      start = formatDateISO(mon)
      end = formatDateISO(sun)
      break
    case 'month':
      start = formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1))
      end = formatDateISO(new Date(now.getFullYear(), now.getMonth() + 1, 0))
      break
    case 'year':
      start = formatDateISO(new Date(now.getFullYear(), 0, 1))
      end = formatDateISO(new Date(now.getFullYear(), 11, 31))
      break
    case 'all':
    default:
      start = ''
      end = ''
      break
  }
  selectedDate.value = { start, end }
}

const getBadgeClass = (status) => {
  const closedStatuses = ['closed', 'Completed', 'complete_gap'];
  const acceptableStatuses = ['acceptable', 'acceptable_gap'];
  if (closedStatuses.includes(status)) return 'badge-success';
  if (acceptableStatuses.includes(status)) return 'badge-warning';
  return 'badge-danger';
}

const getUrgency = (endDate) => {
  if (!endDate) return { label: 'ไม่ระบุ', class: 'gray' };
  const today = new Date();
  const target = new Date(endDate);
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'เลยกำหนด', class: 'urgent-critical' };
  if (diffDays <= 7) return { label: 'ด่วนมาก (ใน 7 วัน)', class: 'urgent-high' };
  if (diffDays <= 30) return { label: 'เร่งด่วน (ใน 1 เดือน)', class: 'urgent-medium' };
  return { label: 'ปกติ', class: 'urgent-low' };
}

/* =========================================
    5. DATA FETCHING
========================================= */
const fetchDashboard = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  isLoading.value = true;

  try {
    const query = new URLSearchParams({
      year: globalSelectedYear.value || 'all',
      startDate: selectedDate.value?.start || '',
      endDate: selectedDate.value?.end || ''
    }).toString();

    const chartQuery = new URLSearchParams({
      year: globalSelectedYear.value || 'all',
      startDate: selectedDate.value?.start || '',
      endDate: selectedDate.value?.end || '',
      mode: dateMode.value === 'all' ? 'year' : (dateMode.value || 'day')
    }).toString();

    const [summaryRes, tasksRes, progressRes, chartRes, gapDetailsRes] = await Promise.all([
      fetch(`${API}/api/admin/dashboard/gap-summary?${query}`, { headers }),
      fetch(`${API}/api/admin/dashboard/tasks?${query}`, { headers }),
      fetch(`${API}/api/admin/dashboard/overall-progress?${query}`, { headers }),
      fetch(`${API}/api/admin/dashboard/gap-closed-chart?${chartQuery}`, { headers }),
      fetch(`${API}/api/admin/dashboard/gap-details?${query}`, { headers })
    ]);

    const summaryData = await summaryRes.json();
    const tasksData = await tasksRes.json();
    const progressData = await progressRes.json();
    const chartData = await chartRes.json();
    const gapDetailsData = await gapDetailsRes.json();

    gapDetails.value = gapDetailsData;

    overallProgress.value = progressData.progress || 0;
    gapChartData.value = chartData;

    planSummary.value = {
      total: summaryData.total || 0,
      openCount: summaryData.open_gap || 0,
      closedCount: summaryData.closed_gap || 0,
      acceptableCount: summaryData.accepted_gap || 0
    };

    tasks.value = tasksData;

    scopeSummary.value = {
      total: tasksData.length,
      ongoing: tasksData.filter(t => (t.progress || 0) < 100).length,
      completed: tasksData.filter(t => (t.progress || 0) >= 100).length
    };

    overallProgress.value = progressData.progress || 0;
    gapChartData.value = chartData;

  } catch (err) {
    console.error('❌ Fetch Dashboard Error:', err);
  } finally {
    isLoading.value = false;
  }
};

/* =========================================
    6. UI EVENTS & ACTIONS
========================================= */
const selectMode = (mode) => {
  dateMode.value = mode
  setDateRange(mode)
  isOpen.value = false
  fetchDashboard()
}

const onManualDateChange = () => {
  dateMode.value = 'custom'
  selectedDate.value.end = selectedDate.value.start
  fetchDashboard()
}

const openDate = () => {
  dateInput.value?.showPicker()
}

const handleCardClick = (type) => {
  searchQuery.value = ''
  currentPage.value = 1

  const titles = {
    all_plans: 'แผนงานทั้งหมด',
    open: 'รายการที่ยังไม่ปิด GAP',
    closed: 'รายการที่ปิด GAP เสร็จแล้ว',
    acceptable: 'รายการที่ไม่สามารถปิด GAP แต่ยอมรับได้'
  }
  modalTitle.value = titles[type] || 'รายละเอียดแผนงานย่อย'

  const closedStatuses = ['closed', 'Completed', 'complete_gap']
  const acceptableStatuses = ['acceptable', 'acceptable_gap']

  if (type === 'all_plans') {
    modalDataList.value = [...gapDetails.value]
  } else if (type === 'open') {
    modalDataList.value = gapDetails.value.filter(t =>
      !closedStatuses.includes(t.status) && !acceptableStatuses.includes(t.status)
    )
  } else if (type === 'closed') {
    modalDataList.value = gapDetails.value.filter(t => closedStatuses.includes(t.status))
  } else if (type === 'acceptable') {
    modalDataList.value = gapDetails.value.filter(t => acceptableStatuses.includes(t.status))
  }

  isModalOpen.value = true
}

const handleScopeCardClick = (type) => {
  searchQuery.value = ''
  currentPage.value = 1

  const titles = {
    all: 'รายการขอบเขตงานทั้งหมด',
    ongoing: 'รายการขอบเขตงานที่กำลังดำเนินงาน',
    completed: 'รายการขอบเขตงานที่ดำเนินการเสร็จสิ้น'
  }
  modalTitle.value = titles[type] || 'รายละเอียด'

  if (type === 'all') {
    modalDataList.value = [...tasks.value]
  } else if (type === 'ongoing') {
    modalDataList.value = tasks.value.filter(t => (t.progress || 0) < 100)
  } else if (type === 'completed') {
    modalDataList.value = tasks.value.filter(t => (t.progress || 0) >= 100)
  }
  isModalOpen.value = true
}

const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
const closeModal = () => { isModalOpen.value = false }

const goToScopePage = (scopeId) => {
  isModalOpen.value = false
  router.push({ path: '/admin/scopeproject', query: { scope_id: scopeId } })
}

/* =========================================
    7. WATCHERS & LIFECYCLE
========================================= */
watch([() => globalSelectedYear.value, () => selectedDate.value], () => {
  fetchDashboard();
}, { deep: true });

onMounted(() => {
  setDateRange('all')
  fetchDashboard()
  window.addEventListener('click', () => { isOpen.value = false })
})
</script>