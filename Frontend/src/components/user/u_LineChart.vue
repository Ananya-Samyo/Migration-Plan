<template>
  <div class="panel chart-area">
    <div class="panel-header">
      <h3>📈 จำนวน GAP ที่ปิดได้ {{ hasFilter ? '(ตามช่วงเวลา)' : '(ทั้งหมด)' }}</h3>
    </div>

    <div class="panel-body chart-body">
      <div v-if="isLoading" class="loading-state">กำลังโหลด...</div>
      
      <div v-else-if="labels.length === 0" class="loading-state">
        ไม่มีข้อมูลในช่วงเวลานี้
      </div>
      
      <Line v-else :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const API = import.meta.env.VITE_API_BASE_URL

/* ===============================
   1. ปรับ Props: ไม่บังคับ (Required: false)
================================ */
const props = defineProps({
  startDate: { type: String, default: '' },
  endDate:   { type: String, default: '' }
})

/* ===============================
   State
================================ */
const labels = ref([])
const values = ref([])
const isLoading = ref(false)

// Computed เช็คว่ากำลังกรองอยู่ไหม (เพื่อเปลี่ยนหัวข้อ)
const hasFilter = computed(() => props.startDate && props.endDate)

/* ===============================
   Fetch Function (หัวใจหลัก)
================================ */
const fetchChartData = async () => {
  // ⚠️ ลบเงื่อนไข return ออก เพื่อให้โหลด All Time ได้
  // if (!props.startDate || !props.endDate) return 
  
  isLoading.value = true
  try {
    const userId = localStorage.getItem('user_id')
    if (!userId) return

    // เตรียม Params พื้นฐาน
    const params = {
      user_id: userId,
      mode: 'day'
    }

    // ✅ Logic: ถ้ามีวันที่ส่งมา ค่อยเติมใส่ params
    // ถ้าไม่มี (เป็นค่าว่าง) Backend จะดึงข้อมูลทั้งหมดให้เอง (ตาม Code Backend ที่เราแก้ไป)
    if (props.startDate && props.endDate) {
      params.startDate = props.startDate
      params.endDate = props.endDate
    }

    const { data } = await axios.get(`${API}/api/user/user-dashboard/gap-closed-chart`, { params })

    labels.value = data.map(i => i.label)
    values.value = data.map(i => i.total)

  } catch (err) {
    console.error('❌ Chart Error:', err)
  } finally {
    isLoading.value = false
  }
}

/* ===============================
   2. Watcher
================================ */
// ทำงานทันทีที่โหลด และทำงานเมื่อ Props เปลี่ยน
watch(() => [props.startDate, props.endDate], fetchChartData, { immediate: true })

/* ===============================
   Chart Config
================================ */
const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'งานที่ปิดได้',
      data: values.value,
      borderColor: '#6d28d9',
      backgroundColor: 'rgba(109, 40, 217, 0.1)',
      borderWidth: 3,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#6d28d9',
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
      backgroundColor: '#1e293b',
      padding: 10,
      cornerRadius: 8,
      displayColors: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { borderDash: [4, 4], color: '#e2e8f0' },
      ticks: { precision: 0 }
    },
    x: {
      grid: { display: false }
    }
  }
}))
</script>

<style scoped>
.chart-body {
  position: relative;
  height: 300px;
  width: 100%;
}
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #94a3b8;
  font-size: 14px;
}
</style>