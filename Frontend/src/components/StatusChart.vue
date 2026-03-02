<template>
  <div class="charts-container">
    <div class="chart-wrapper">
      <h3>📊 สัดส่วนสถานะ GAP</h3>
      <div class="canvas-box">
        <Pie :data="pieChartData" :options="pieOptions" />
      </div>
    </div>

    <div class="chart-wrapper">
      <h3>📈 จำนวนงานตามระดับความคืบหน้า</h3>
      <div class="canvas-box">
        <Bar :data="barChartData" :options="barOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue' // เพิ่ม watch ตรงนี้
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
   PROPS (รับค่าจาก Dashboard หลัก)
================================ */
const props = defineProps({
  selectedDate: {
    type: Object,
    required: true,
    default: () => ({ start: '', end: '' })
  }
})

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
   Fetch Backend (แก้ไขให้ส่ง Query String)
================================ */
const fetchCharts = async () => {
  try {
    // สร้าง query จาก props ที่ได้รับมา
    const query = `?startDate=${props.selectedDate.start}&endDate=${props.selectedDate.end}`
    
    const [gapRes, progressRes] = await Promise.all([
      axios.get(`${API}/api/admin/dashboard/gap-summary${query}`),
      axios.get(`${API}/api/admin/dashboard/progress-range${query}`)
    ])

    gapSummary.value = gapRes.data
    progressRange.value = progressRes.data
  } catch (err) {
    console.error('❌ StatusChart API error', err)
  }
}

// โหลดครั้งแรกเมื่อ Component พร้อม
onMounted(fetchCharts)

// คอยดูว่าถ้า selectedDate ใน Dashboard เปลี่ยน ให้โหลดข้อมูลกราฟใหม่ทันที
watch(
  () => props.selectedDate,
  () => {
    fetchCharts()
  },
  { deep: true }
)

/* ===============================
   Pie Chart (Computed จะทำงานอัตโนมัติเมื่อ State เปลี่ยน)
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
      backgroundColor: ['#6b7280', '#16a34a', '#dc2626'],
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
      backgroundColor: ['#6C757D', '#FFC107', '#8FD19E', '#28A745'],
      borderRadius: 6
    }
  ]
}))

/* ===============================
   Options (คงเดิม)
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