<template>
  <div class="step-container">
    <div class="header-section">
      <h2 class="step-title">5. ประโยชน์และความสำเร็จตามแผน</h2>
    </div>

    <div v-if="!benefitsData || benefitsData.length === 0" class="empty-state" style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 8px;">
      <span>📝</span>
      <p style="margin-top: 10px; color: #64748b;">กรุณาเลือกขอบเขตงานจากหน้า 1 เพื่อกรอกข้อมูลประโยชน์</p>
    </div>

    <div v-else class="table-container" style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
      <table class="modern-table benefit-table" style="width: 100%; min-width: 1300px; border-collapse: collapse; margin: 0;">
        <thead>
          <tr style="background: #f1f5f9; text-align: center;">
            <th rowspan="2" width="12%" style="padding: 10px; border: 1px solid #cbd5e1;">ขอบเขตงาน</th>
            <th rowspan="2" width="10%" style="padding: 10px; border: 1px solid #cbd5e1;">สายงาน</th>
            <th colspan="4" style="padding: 10px; border: 1px solid #cbd5e1; background: #e0e7ff; color: #3730a3;">ประโยชน์ที่คาดว่าจะได้รับ</th>
            <th colspan="3" style="padding: 10px; border: 1px solid #cbd5e1; background: #dcfce7; color: #166534;">ความสำเร็จตาม Migration Plan</th>
          </tr>
          <tr style="background: #f8fafc; text-align: center; font-size: 13px;">
            <th width="10%" style="padding: 8px; border: 1px solid #cbd5e1;">ลดขั้นตอน/เวลา</th>
            <th width="10%" style="padding: 8px; border: 1px solid #cbd5e1;">ลดรายจ่าย</th>
            <th width="10%" style="padding: 8px; border: 1px solid #cbd5e1;">เพิ่มรายได้</th>
            <th width="10%" style="padding: 8px; border: 1px solid #cbd5e1;">เพิ่มความพึงพอใจ</th>
            <th width="6%" style="padding: 8px; border: 1px solid #cbd5e1;">ปี</th>
            <th width="8%" style="padding: 8px; border: 1px solid #cbd5e1;">% สำเร็จ</th>
            <th width="14%" style="padding: 8px; border: 1px solid #cbd5e1;">รายละเอียด</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in benefitsData" :key="row.id" style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 500; color: #334155; vertical-align: top;">
              {{ row.title }}
            </td>

            <td style="padding: 10px; border: 1px solid #cbd5e1; vertical-align: top;">
              <input type="text" v-model="row.lineOfWork" placeholder="ระบุสายงาน" class="benefit-input">
            </td>

            <td style="padding: 10px; border: 1px solid #cbd5e1; vertical-align: top;">
              <label class="check-label"><input type="checkbox" v-model="row.b1_check"> เลือก</label>
              <textarea v-if="row.b1_check" v-model="row.b1_text" placeholder="รายละเอียด..." class="benefit-textarea"></textarea>
            </td>

            <td style="padding: 10px; border: 1px solid #cbd5e1; vertical-align: top;">
              <label class="check-label"><input type="checkbox" v-model="row.b2_check"> เลือก</label>
              <textarea v-if="row.b2_check" v-model="row.b2_text" placeholder="รายละเอียด..." class="benefit-textarea"></textarea>
            </td>

            <td style="padding: 10px; border: 1px solid #cbd5e1; vertical-align: top;">
              <label class="check-label"><input type="checkbox" v-model="row.b3_check"> เลือก</label>
              <textarea v-if="row.b3_check" v-model="row.b3_text" placeholder="รายละเอียด..." class="benefit-textarea"></textarea>
            </td>

            <td style="padding: 10px; border: 1px solid #cbd5e1; vertical-align: top;">
              <label class="check-label"><input type="checkbox" v-model="row.b4_check"> เลือก</label>
              <textarea v-if="row.b4_check" v-model="row.b4_text" placeholder="รายละเอียด..." class="benefit-textarea"></textarea>
            </td>

            <td style="padding: 10px; border: 1px solid #cbd5e1; vertical-align: top;">
              <input type="text" v-model="row.migrationYear" placeholder="พ.ศ." class="benefit-input text-center">
            </td>

            <td style="padding: 10px; border: 1px solid #cbd5e1; vertical-align: top;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                <input type="number" v-model="row.progress" min="0" max="100" placeholder="0" class="benefit-input text-center" style="width: 100%;">
                <span style="font-size: 13px; color: #475569;">%</span>
              </div>
            </td>

            <td style="padding: 10px; border: 1px solid #cbd5e1; vertical-align: top;">
              <textarea v-model="row.migrationDetail" placeholder="ระบุความสำเร็จ" class="benefit-textarea" style="height: 60px;"></textarea>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  selectedTasks: { type: Array, default: () => [] }
})

const emit = defineEmits(['update-benefits'])
const benefitsData = ref([])

const syncDataWithTasks = () => {
  const currentData = [...benefitsData.value]
  const newData = []

  props.selectedTasks.forEach(task => {
    const existingRow = currentData.find(r => r.id === task.id)
    
    if (existingRow) {
      newData.push(existingRow)
    } else {
      newData.push({
        id: task.id,
        title: task.title,
        lineOfWork: '',
        b1_check: false, b1_text: '',
        b2_check: false, b2_text: '',
        b3_check: false, b3_text: '',
        b4_check: false, b4_text: '',
        migrationYear: '',
        progress: '',
        migrationDetail: ''
      })
    }
  })

  benefitsData.value = newData
  emitData()
}

const emitData = () => {
  emit('update-benefits', benefitsData.value)
}

watch(() => props.selectedTasks, syncDataWithTasks, { deep: true })
watch(benefitsData, emitData, { deep: true })

onMounted(syncDataWithTasks)
</script>