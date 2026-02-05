<template>
  <div class="panel chart-area">
    <div class="panel-header">
      <h3>📈 จำนวน GAP ที่ปิดได้</h3>
    </div>

    <div class="panel-body chart-body">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Tooltip,
  Legend,
  Filler
)

/* ===============================
   API
================================ */
const API = import.meta.env.VITE_API_BASE_URL

/* ===============================
   State
================================ */
const labels = ref([])
const values = ref([])

/* ===============================
   Fetch From Backend
================================ */
const fetchChartData = async () => {
  try {
    const { data } = await axios.get(
      `${API}/dashboard/gap-closed-chart`
    )

    // backend ส่งมาเป็น [{ label, total }]
    labels.value = data.map(i => i.label)
    values.value = data.map(i => i.total)

  } catch (err) {
    console.error('❌ LineChart API error', err)
    labels.value = []
    values.value = []
  }
}

onMounted(fetchChartData)

/* ===============================
   Chart Data
================================ */
const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'จำนวน GAP ที่ปิดได้',
      data: values.value,
      borderColor: '#4f46e5',
      backgroundColor: 'rgba(79, 70, 229, 0.15)',
      borderWidth: 3,
      tension: 0.4,
      pointRadius: 4,
      fill: true
    }
  ]
}))

/* ===============================
   Chart Options
================================ */
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1 }
    }
  }
}))
</script>

<style scoped>
.panel {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-body {
  width: 100%;
  height: 300px;
}
</style>
