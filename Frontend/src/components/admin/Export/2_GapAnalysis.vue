<template>
  <div class="step-container">
    <div class="header-section">
      <h2 class="step-title">2. ผลการปิด GAP รายขอบเขตงาน</h2>
    </div>

    <div v-if="!gapGroups || gapGroups.length === 0" class="empty-state"
      style="text-align: center; padding: 40px; color: #94a3b8; background: #f8fafc; border-radius: 8px;">
      <span>📂</span>
      <p style="margin-top: 10px;">กรุณาเลือก "ขอบเขตงาน" จากหน้าก่อนหน้า <br>เพื่อดูข้อมูลผลการปิด GAP</p>
    </div>

    <div v-for="group in gapGroups" :key="group.taskId" class="gap-group-card" style="margin-bottom: 30px;">
      <div
        style="background: #f8fafc; padding: 15px; border-radius: 8px 8px 0 0; border: 1px solid #e2e8f0; border-bottom: none;">
        <h3 style="margin: 0; color: #4c1d95; font-size: 16px;">
          📁 ขอบเขตงาน: {{ group.taskName }}
        </h3>
      </div>

      <div class="table-container" style="border-radius: 0 0 8px 8px;">
        <table class="modern-table">
          <thead>
            <tr>
              <th width="50" class="text-center">เลือก</th>
              <th width="40%">GAP</th>
              <th class="text-center">ความคืบหน้า</th>
              <th width="120" class="text-center">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="gap in group.gaps" :key="gap.id">
              <td class="text-center">
                <input type="checkbox" v-model="gap.selected" @change="emitSelection">
              </td>
              <td>
                <div class="project-title">{{ gap.gapName }}</div>
                <div class="year-text">ปีที่ดำเนินการ: {{ gap.year }}</div>
              </td>
              <td>
                <div class="progress-fill" :style="{ width: gap.progress + '%' }"></div>
                <span>{{ gap.progress }}%</span>
              </td>
              <td class="text-center">
                <span :class="gap.status === 'closed' ? 'status-closed' : 'status-pending'">
                  {{ gap.status === 'closed' ? 'ปิด GAP แล้ว' : 'กำลังดำเนินการ' }}
                </span>
              </td>
            </tr>
            <tr v-if="group.gaps.length === 0">
              <td colspan="4" class="text-center" style="padding: 20px; color: #94a3b8;">
                ไม่มีข้อมูล GAP สำหรับขอบเขตงานนี้
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  selectedTasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update-gaps'])
const gapGroups = ref([])

// ฟังก์ชันหลักในการดึงข้อมูล
const fetchGapData = async () => {
  if (!props.selectedTasks || props.selectedTasks.length === 0) {
    gapGroups.value = []
    emitSelection()
    return
  }

  try {
    // ดึง ID จากโครงการที่เลือกในหน้า 1
    const scopeIds = props.selectedTasks.map(task => task.id).join(',')
    const response = await axios.get(`http://localhost:3000/api/admin/gap-analysis?scopeIds=${scopeIds}`)

    // จัดการข้อมูลที่ได้จาก API (เพิ่มสถานะ selected ให้แต่ละ GAP)
    gapGroups.value = response.data.map(group => ({
      ...group,
      gaps: group.gaps.map(gap => ({ ...gap, selected: false }))
    }))

    emitSelection()
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูล GAP:', error)
  }
}

// ส่งข้อมูลกลับไปที่ไฟล์แม่ (Admin_ExportMain)
const emitSelection = () => {
  emit('update-gaps', gapGroups.value)
}

// ตรวจสอบการเปลี่ยนแปลงของ selectedTasks จากหน้า 1
watch(() => props.selectedTasks, () => {
  fetchGapData()
}, { immediate: true, deep: true })

onMounted(() => {
  fetchGapData()
})
</script>