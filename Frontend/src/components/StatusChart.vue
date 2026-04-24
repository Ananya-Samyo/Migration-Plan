<template>
  <div class="charts-container">
    <div class="chart-wrapper">
      <h3>📊 สัดส่วนสถานะขอบเขตงาน</h3>
      <div class="canvas-box">
        <Pie :data="pieChartData" :options="pieOptions" />
      </div>
    </div>

    <div class="chart-wrapper">
      <h3>📈 จำนวนขอบเขตงานตามความคืบหน้า</h3>
      <div class="canvas-box">
        <Bar :data="barChartData" :options="barOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
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
const globalSelectedYear = inject('globalSelectedYear')

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
    // สร้าง query จาก props ที่ได้รับมา
    let query = `?startDate=${props.selectedDate.start}&endDate=${props.selectedDate.end}`
    
    if (globalSelectedYear && globalSelectedYear.value && globalSelectedYear.value !== 'all') {
      query += `&year=${globalSelectedYear.value}`
    }
    
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

watch(globalSelectedYear, () => {
  fetchCharts()
})

/* ===============================
   Pie Chart (แสดงสัดส่วน ขอบเขตงาน)
================================ */
const pieChartData = computed(() => {
  // ใช้ Number() ครอบเพื่อให้แน่ใจว่าเป็นตัวเลขก่อนบวกกัน
  const low = Number(progressRange.value.low || 0)
  const mid = Number(progressRange.value.mid || 0)
  const high = Number(progressRange.value.high || 0)
  const done = Number(progressRange.value.done || 0)

  const ongoingScopes = low + mid + high
  const completedScopes = done

  return {
    labels: ['กำลังดำเนินงาน', 'ดำเนินการเสร็จสิ้น'],
    datasets: [
      {
        data: [ongoingScopes, completedScopes],
        backgroundColor: ['#6C757D', '#16a34a'], 
        borderColor: '#fff',
        borderWidth: 2
      }
    ]
  }
})

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
      backgroundColor: ['#6C757D', '#FFC107', '#3B82F6', '#28A745'],
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