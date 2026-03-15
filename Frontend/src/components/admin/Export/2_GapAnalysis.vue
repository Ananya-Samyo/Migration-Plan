<template>
  <div>
    <div class="header-section">
      <h2 class="step-title">2. ภาพรวมการประเมินผลการปิด GAP</h2>
    </div>

    <div v-if="!gapGroups || gapGroups.length === 0" class="empty-state"
      style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 8px;">
      <span style="font-size: 2rem;">📊</span>
      <p style="margin-top: 10px; color: #64748b;">กรุณาเลือกขอบเขตงานจากหน้า 1 เพื่อประมวลผลการปิด GAP</p>
    </div>

    <div v-else>
      <div v-for="(group, index) in gapGroups" :key="group.scopeId || index" class="gap-group-card"
        style="margin-bottom: 30px; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; background: #fff;">

        <div
          style="background: #fdfcff; padding: 15px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="margin: 0; color: #4b2c82; font-size: 16px; font-weight: 600;">
              📁 ขอบเขตงาน: {{ group.scopeName || group.taskName }}
            </h3>
            <div style="color: #ea580c; font-size: 14px; margin-top: 8px; font-weight: 500; padding-left: 24px;">
              📋 แผนงาน: {{ group.planName || (group.gaps && group.gaps.length > 0 ? group.gaps[0].planName : 'ไม่พบชื่อแผนงาน') }}
            </div>
          </div>
          <button @click="toggleSelectAll(group)"
            style="background: none; border: none; color: #4b2c82; font-weight: bold; cursor: pointer; font-size: 0.9rem; margin-top: 2px;">
            {{ group.gaps.every(g => g.selected) ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด' }}
          </button>
        </div>

        <div class="table-container">
          <table class="modern-table" style="width: 100%; border-collapse: collapse;">
            <thead style="background: #f8fafc; border-bottom: 2px solid #d4af37;">
              <tr>
                <th width="60" class="text-center" style="padding: 12px; color: #4b2c82; font-size: 0.85rem;">เลือก</th>
                <th width="40%" style="padding: 12px; color: #4b2c82; text-align: left; font-size: 0.85rem;">รายการ GAP ANALYSIS</th>
                <th width="35%" style="padding: 12px; color: #4b2c82; text-align: left; font-size: 0.85rem;">ความคืบหน้า</th>
                <th width="120" class="text-center" style="padding: 12px; color: #4b2c82; font-size: 0.85rem;">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="gap in group.gaps" :key="gap.operation_id"
                style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;"
                :style="gap.selected ? 'background-color: #fcfaff;' : ''">

                <td class="text-center" style="padding: 15px;">
                  <input type="checkbox" v-model="gap.selected" @change="emitSelection"
                    style="width: 16px; height: 16px; accent-color: #4b2c82; cursor: pointer;">
                </td>

                <td style="padding: 15px;">
                  <div class="project-title" style="color: #333; font-weight: 500; margin-bottom: 4px;">{{ gap.detail }}</div>
                  <div class="year-text" style="color: #64748b; font-size: 0.85rem;">ปีที่ดำเนินการ: 2569</div>
                </td>

                <td style="padding: 15px;">
                  <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
                    <div style="flex-grow: 1; height: 8px; background: #e2e8f0; border-radius: 10px; overflow: hidden;">
                      <div
                        :style="{ width: (gap.progress_percent || gap.progress || 0) + '%', background: '#6d28d9', height: '100%', borderRadius: '10px', transition: 'width 0.3s' }">
                      </div>
                    </div>
                    <span style="font-size: 0.85rem; font-weight: bold; color: #4b2c82; min-width: 35px;">{{ gap.progress_percent || gap.progress || 0 }}%</span>
                  </div>
                </td>

                <td class="text-center" style="padding: 15px;">
                  <span :class="getStatusClass(gap.status_id)"
                    style="padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 500;">
                    {{ getStatusText(gap.status_id) }}
                  </span>
                </td>
              </tr>

              <tr v-if="!group.gaps || group.gaps.length === 0">
                <td colspan="4" class="text-center" style="padding: 30px; color: #94a3b8;">
                  ไม่มีข้อมูลรายการ GAP สำหรับขอบเขตงานนี้
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
    const scopeIds = props.selectedTasks.map(task => task.id).join(',')
    const token = localStorage.getItem('token') // อย่าลืมแนบ Token

    // ดึงข้อมูลจาก Backend ที่ผ่านการ Group แล้ว หรือไป Group ใน Frontend ก็ได้
    const response = await axios.get(`http://localhost:3000/api/admin/gap-analysis?scopeIds=${scopeIds}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    // จัดการข้อมูล: ตั้งค่าเริ่มต้นให้ checkbox = true หรือ false
    gapGroups.value = response.data.map(group => ({
      ...group,
      gaps: group.gaps.map(gap => ({
        ...gap,
        selected: true
      }))
    }))

    emitSelection()
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูล GAP:', error)
  }
}

// ---------------- Helper Functions สำหรับแปลงสถานะ ---------------- //
const getStatusText = (statusId) => {
  if (statusId === 2) return 'เสร็จสิ้น';
  if (statusId === 3) return 'ยอมรับได้';
  return 'กำลังดำเนินการ'; // ครอบคลุม status_id = 1 หรือ null
}

const getStatusClass = (statusId) => {
  if (statusId === 2) return 'badge-success';
  return 'badge-pending'; // ใช้คลาส CSS สีส้ม/เหลือง ด้านล่าง
}

const toggleSelectAll = (group) => {
  const isAllSelected = group.gaps.every(g => g.selected);
  group.gaps.forEach(g => g.selected = !isAllSelected);
  emitSelection();
}

// ส่งข้อมูลกลับไปที่ไฟล์แม่
const emitSelection = () => {
  // กรองเฉพาะตัวที่ selected = true เพื่อส่งไป Export
  const selectedData = gapGroups.value.map(group => ({
    ...group,
    gaps: group.gaps.filter(gap => gap.selected)
  })).filter(group => group.gaps.length > 0);

  emit('update-gaps', selectedData)
}

// ตรวจสอบการเปลี่ยนแปลงของหน้าที่ 1
watch(() => props.selectedTasks, () => {
  fetchGapData()
}, { immediate: true, deep: true })

</script>

<style scoped>
.text-center {
  text-align: center;
}

/* Status Badges */
.badge-pending {
  background-color: #fef3c7;
  /* สีเหลืองอ่อนตามรูปของคุณ */
  color: #92400e;
  /* สีส้มเข้ม */
  border: 1px solid #fde68a;
}

.badge-success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}
</style>