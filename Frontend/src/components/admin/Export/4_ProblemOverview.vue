<template>
  <div class="step-container">
    <div class="header-section">
      <h2 class="step-title">4. ภาพรวมประเด็นปัญหา</h2>
    </div>

    <div v-if="!selectedTasks || selectedTasks.length === 0" class="empty-state" style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 8px; margin-bottom: 30px;">
      <span style="font-size: 2rem;">⚠️</span>
      <p style="margin-top: 10px; color: #64748b;">กรุณาเลือกขอบเขตงานจากหน้า 1 เพื่อประมวลผลประเด็นปัญหา</p>
    </div>

    <div v-else-if="!problemGroups || problemGroups.length === 0" class="empty-state" style="text-align: center; padding: 40px; background: #f0fdf4; border-radius: 8px; margin-bottom: 30px; border: 1px dashed #86efac;">
      <span style="font-size: 2rem;">✅</span>
      <h3 style="margin-top: 10px; color: #166534; font-size: 1.1rem;">ไม่พบประเด็นปัญหา</h3>
      <p style="color: #15803d; font-size: 0.95rem;">ขอบเขตงานที่คุณเลือกไม่มีประเด็นปัญหาที่ถูกบันทึกไว้</p>
    </div>
    
    <div v-else class="problem-content">
      <div v-for="(group, index) in problemGroups" :key="group.scopeId || index" class="gap-group-card" style="margin-bottom: 30px; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; background: #fff;">
        
        <div style="background: #fdfcff; padding: 15px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="margin: 0; color: #b91c1c; font-size: 16px; font-weight: 600;">
              📁 ขอบเขตงาน: {{ group.scopeName }}
            </h3>
          </div>
          <button @click="toggleSelectAll(group)"
            style="background: none; border: none; color: #b91c1c; font-weight: bold; cursor: pointer; font-size: 0.9rem; margin-top: 2px;">
            {{ group.items.every(item => item.selected) ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด' }}
          </button>
        </div>

        <div class="table-container">
          <table class="modern-table" style="width: 100%; border-collapse: collapse;">
            <thead style="background: #f8fafc; border-bottom: 2px solid #b91c1c;">
              <tr>
                <th width="60" style="text-align: center; padding: 12px; color: #b91c1c; font-size: 0.85rem;">เลือก</th>
                <th width="40%" style="padding: 12px; color: #b91c1c; text-align: left; font-size: 0.85rem;">แผนงาน/โครงการ (Project Plan)</th>
                <th width="50%" style="padding: 12px; color: #b91c1c; text-align: left; font-size: 0.85rem;">ประเด็นปัญหา (Problem Detail)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in group.items" :key="item.problemId || idx" 
                  style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;"
                  :style="item.selected ? 'background-color: #fef2f2;' : ''">
                
                <td style="text-align: center; padding: 15px;">
                  <input 
                    type="checkbox" 
                    v-model="item.selected" 
                    @change="emitSelection" 
                    style="width: 16px; height: 16px; accent-color: #b91c1c; cursor: pointer;"
                  >
                </td>
                
                <td style="padding: 15px; color: #334155; font-weight: 500;">
                  {{ item.planName || '-' }}
                </td>
                
                <td style="white-space: pre-wrap; line-height: 1.6; padding: 15px; color: #64748b;">
                  {{ item.problemDetail || '-' }}
                </td>
              </tr>

              <tr v-if="!group.items || group.items.length === 0">
                <td colspan="3" style="text-align: center; padding: 30px; color: #94a3b8;">
                  ไม่มีประเด็นปัญหาสำหรับขอบเขตงานนี้
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
  selectedTasks: { type: Array, default: () => [] }
})

const emit = defineEmits(['update-problems'])
const problemGroups = ref([])

// ฟังก์ชันดึงและจัดกลุ่มข้อมูล
const fetchProblems = async () => {
  if (!props.selectedTasks || props.selectedTasks.length === 0) {
    problemGroups.value = []
    emitSelection()
    return
  }

  try {
    const scopeIds = props.selectedTasks.map(t => t.id).join(',')
    const response = await axios.get(`http://localhost:3000/api/admin/problems?scopeIds=${scopeIds}`)
    
    // จัดกลุ่มข้อมูล (Group By) ตาม Scope ID
    const groupsMap = new Map()

    response.data.forEach(item => {
      // ถ้ายังไม่มีกลุ่ม Scope นี้ ให้สร้างใหม่
      if (!groupsMap.has(item.scope_id)) {
        groupsMap.set(item.scope_id, {
          scopeId: item.scope_id,
          scopeName: item.scope_name,
          items: []
        })
      }

      // นำข้อมูลปัญหาย่อยใส่เข้าไปในกลุ่มนั้นๆ
      groupsMap.get(item.scope_id).items.push({
        problemId: item.problem_id,
        planId: item.project_plan_id,
        planName: item.project_plan_name,
        problemDetail: item.problem_detail,
        selected: true // ตั้งค่าเริ่มต้นให้ติ๊กเลือก
      })
    })

    // แปลง Map กลับเป็น Array
    problemGroups.value = Array.from(groupsMap.values())

    // โหลดเสร็จก็ส่งข้อมูลที่ติ๊กอยู่ไปให้หน้าหลัก
    emitSelection()
  } catch (error) {
    console.error('Error fetching problems:', error)
  }
}

// ฟังก์ชันสำหรับปุ่ม "เลือกทั้งหมด / ยกเลิกทั้งหมด"
const toggleSelectAll = (group) => {
  const allSelected = group.items.every(item => item.selected)
  group.items.forEach(item => {
    item.selected = !allSelected
  })
  emitSelection()
}

// ฟังก์ชันรวบรวมข้อมูลรายการที่ติ๊กเลือก เพื่อส่งกลับหน้าหลัก (Export)
const emitSelection = () => {
  const selectedProblems = []
  
  problemGroups.value.forEach(group => {
    group.items.forEach(item => {
      if (item.selected) {
        selectedProblems.push({
          scopeId: group.scopeId,
          scopeName: group.scopeName,
          problemId: item.problemId,
          planId: item.planId,
          planName: item.planName,
          problemDetail: item.problemDetail
        })
      }
    })
  })

  emit('update-problems', selectedProblems)
}

watch(() => props.selectedTasks, (newTasks) => {
  if (newTasks && newTasks.length > 0) {
    fetchProblems();
  } else {
    problemGroups.value = [];
    emitSelection();
  }
}, { deep: true, immediate: true })
onMounted(fetchProblems)
</script>