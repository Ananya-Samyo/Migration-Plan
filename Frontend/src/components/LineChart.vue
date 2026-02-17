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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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

/* ===============================
   Register Chart.js
================================ */
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
   API CONFIG
================================ */
const API = import.meta.env.VITE_API_BASE_URL

/* ===============================
   STATE
================================ */
const loaded = ref(false)
const labels = ref([])
const values = ref([])

/* ===============================
   FETCH DATA
================================ */
const fetchChartData = async () => {
  loaded.value = false
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    // ✅ 1. แก้ URL ให้มี /api
    // ✅ 2. ใส่ Header Token
    // ✅ 3. (Optional) ใส่ mode=day, week, month ได้ (Default คือ day)
    const res = await fetch(`${API}/api/admin/dashboard/gap-closed-chart?mode=day`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) throw new Error('Fetch Error')

    const data = await res.json()

    // backend ส่งมา: [{ label: '01/01', total: 5 }, ...]
    labels.value = data.map(i => i.label)
    values.value = data.map(i => i.total)

    loaded.value = true

  } catch (err) {
    console.error('❌ LineChart API error', err)
    // Mock Data กรณี Error (จะได้ไม่ดูโล่งตอน Test)
    labels.value = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']
    values.value = [0, 0, 0, 0, 0, 0, 0]
    loaded.value = true
  }
}

onMounted(fetchChartData)

/* ===============================
   CHART CONFIG
================================ */
const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'GAP ที่ปิดได้',
      data: values.value,
      // 🎨 Modern Gradient Look
      borderColor: '#6366f1', // สี Indigo Primary
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)'); // สีเข้มด้านบน
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)'); // จางหายด้านล่าง
        return gradient;
      },
      borderWidth: 3,
      tension: 0.4, // เส้นโค้ง Smooth
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
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1e293b',
      bodyColor: '#1e293b',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      displayColors: false, // ซ่อนสีสี่เหลี่ยมใน tooltip
      callbacks: {
        label: (context) => `✅ ปิดได้: ${context.parsed.y} รายการ`
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { family: 'Sarabun' } }
    },
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9', borderDash: [5, 5] }, // เส้นประจางๆ
      ticks: { stepSize: 1, color: '#64748b', font: { family: 'Sarabun' } },
      border: { display: false } // ซ่อนเส้นแกน Y
    }
  }
}))
</script>

<style scoped>
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