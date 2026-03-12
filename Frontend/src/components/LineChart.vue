<template>
  <div class="panel chart-area">
    <div class="panel-header">
      <div class="header-left">
        <span class="icon-box">📈</span>
        <h3>จำนวน GAP ที่ปิดได้</h3>
      </div>
    </div>

    <div class="panel-body chart-container">
      <Line v-if="loaded" :data="chartData" :options="chartOptions" />
      <div v-else class="loading-placeholder">กำลังโหลดข้อมูล...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue' 
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

/* ===============================
   PROPS (เพิ่มใหม่)
================================ */
const props = defineProps({
  selectedDate: {
    type: Object,
    required: true
  }
})

const API = import.meta.env.VITE_API_BASE_URL

/* ===============================
   STATE
================================ */
const loaded = ref(false)
const labels = ref([])
const values = ref([])

/* ===============================
   FETCH DATA (แก้ไขให้ส่งวันที่)
================================ */
const fetchChartData = async () => {
  loaded.value = false
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    // ส่ง startDate และ endDate ไปยัง Backend
    const query = `?mode=day&startDate=${props.selectedDate.start}&endDate=${props.selectedDate.end}`
    
    const res = await fetch(`${API}/api/admin/dashboard/gap-closed-chart${query}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) throw new Error('Fetch Error')
    const data = await res.json()

    labels.value = data.map(i => i.label)
    values.value = data.map(i => i.total)
    loaded.value = true

  } catch (err) {
    console.error('❌ LineChart API error', err)
    labels.value = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']
    values.value = [0, 0, 0, 0, 0, 0, 0]
    loaded.value = true
  }
}

/* ===============================
   WATCHER (เพิ่มใหม่)
================================ */
// เมื่อวันที่จาก Dashboard เปลี่ยน ให้โหลดกราฟเส้นใหม่
watch(() => props.selectedDate, fetchChartData, { deep: true })

onMounted(fetchChartData)

/* ===============================
   CHART CONFIG (คงเดิม)
================================ */
const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'GAP ที่ปิดได้',
      data: values.value,
      borderColor: '#6366f1',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
        return gradient;
      },
      borderWidth: 3,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#6366f1',
      pointBorderWidth: 2,
      pointHoverRadius: 6,
      fill: true
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1e293b',
      bodyColor: '#1e293b',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      callbacks: {
        label: (context) => `✅ ปิดได้: ${context.parsed.y} รายการ`
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b' }
    },
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9', borderDash: [5, 5] },
      ticks: { stepSize: 1, color: '#64748b' }
    }
  }
}))
</script>

<style scoped>

.loading-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #64748b;
}

/* สไตล์ Modern เข้ากับ Dashboard */
.panel {
  background: #ffffff;
  border-radius: 24px; /* โค้งเยอะขึ้น */
  padding: 0; /* Header กับ Body แยก padding กัน */
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-box {
  width: 36px;
  height: 36px;
  background: #e0e7ff;
  color: #6366f1;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  font-family: 'Sarabun', sans-serif;
}

.panel-body {
  padding: 24px;
  flex: 1;
  min-height: 320px;
  position: relative;
}
</style>