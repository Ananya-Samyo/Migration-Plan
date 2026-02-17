<template>
  <div class="charts-container">

    <!-- Pie -->
    <div class="chart-wrapper">
      <h3>📊 สัดส่วนสถานะ GAP</h3>
      <div class="canvas-box">
        <Pie :data="pieChartData" :options="pieOptions" />
      </div>
    </div>

    <!-- Bar -->
    <div class="chart-wrapper">
      <h3>📈 จำนวนงานตามระดับความคืบหน้า</h3>
      <div class="canvas-box">
        <Bar :data="barChartData" :options="barOptions" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Pie, Bar } from 'vue-chartjs'
import axios from 'axios'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ChartDataLabels
)

/* ===============================
   API
================================ */
const API = import.meta.env.VITE_API_BASE_URL

/* ===============================
   State
================================ */
const gapSummary = ref({
  open_gap: 0,
  closed_gap: 0,
  accepted_gap: 0
})

const progressRange = ref({
  low: 0,
  mid: 0,
  high: 0,
  done: 0
})

/* ===============================
   Fetch Backend
================================ */
const fetchCharts = async () => {
  try {
    const [gapRes, progressRes] = await Promise.all([
      axios.get(`${API}/dashboard/gap-summary`),
      axios.get(`${API}/dashboard/progress-range`)
    ])

    gapSummary.value = gapRes.data
    progressRange.value = progressRes.data
  } catch (err) {
    console.error('❌ StatusChart API error', err)
  }
}

onMounted(fetchCharts)

/* ===============================
   Pie Chart
================================ */
const pieChartData = computed(() => ({
  labels: ['ยังไม่ปิด GAP', 'ปิด GAP เสร็จแล้ว', 'ไม่สามารถปิด GAP แต่ยอมรับได้'],
  datasets: [
    {
      data: [
        gapSummary.value.open_gap,
        gapSummary.value.closed_gap,
        gapSummary.value.accepted_gap
      ],
      backgroundColor: ['#6d28d9', '#16a34a', '#dc2626'],
      borderColor: '#fff',
      borderWidth: 2
    }
  ]
}))

/* ===============================
   Bar Chart
================================ */
const barChartData = computed(() => ({
  labels: ['0%', '1–49%', '50–99%', '100%'],
  datasets: [
    {
      data: [
        progressRange.value.low,
        progressRange.value.mid,
        progressRange.value.high,
        progressRange.value.done
      ],
      backgroundColor: ['#6b7280', '#dc2626', '#6d28d9', '#16a34a'],
      borderRadius: 6
    }
  ]
}))

/* ===============================
   Options
================================ */
const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
    datalabels: {
      color: '#fff',
      font: { weight: 'bold' },
      formatter: v => (v > 0 ? v : '')
    }
  }
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    datalabels: {
      anchor: 'end',
      align: 'top',
      font: { weight: 'bold' },
      formatter: v => (v > 0 ? v : '')
    }
  },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } }
  }
}
</script>

<style scoped>
.charts-container {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
}

.chart-wrapper {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,.05);
  min-width: 300px;
  max-width: 500px;
}

.canvas-box {
  height: 250px;
}
</style>
