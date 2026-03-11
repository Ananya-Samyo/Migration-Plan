<template>
  <div class="step-container">
    <div class="header-section">
      <h2 class="step-title">4. ภาพรวมประเด็นปัญหา</h2>
    </div>

    <div v-if="!problemGroups || problemGroups.length === 0" class="empty-state" style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 8px;">
      <span>⚠️</span>
      <p style="margin-top: 10px; color: #64748b;">กรุณาเลือกขอบเขตงานจากหน้า 1 เพื่อประมวลผลประเด็นปัญหา</p>
    </div>

    <div v-else class="problem-content">
      <div v-for="(group, index) in problemGroups" :key="group.scopeId" class="gap-group-card" style="margin-bottom: 30px;">
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px 8px 0 0; border: 1px solid #e2e8f0; border-bottom: none;">
          <h3 style="margin: 0; color: #b91c1c; font-size: 16px;">
            📁 ขอบเขตงาน: {{ group.scopeName }}
          </h3>
        </div>

        <div class="table-container" style="border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
          <table class="modern-table" style="margin: 0; border: none; width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left;">
                <th width="50" style="text-align: center; padding: 10px;">เลือก</th>
                <th width="40%" style="padding: 10px;">แผนงาน/โครงการ (Project Plan)</th>
                <th width="50%" style="padding: 10px;">ประเด็นปัญหา (Problem Detail)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in group.items" :key="idx" style="border-bottom: 1px solid #e2e8f0;">
                <td style="text-align: center; padding: 10px;">
                  <input 
                    type="checkbox" 
                    v-model="item.selected" 
                    @change="emitSelection" 
                    style="width: 18px; height: 18px; cursor: pointer;"
                  >
                </td>
                <td style="padding: 10px; color: #334155;">
                  {{ item.planName || '-' }}
                </td>
                <td style="white-space: pre-wrap; line-height: 1.6; padding: 10px; color: #334155;">
                  {{ item.problemDetail || '-' }}
                </td>
              </tr>
              <tr v-if="group.items.length === 0">
                <td colspan="3" style="text-align: center; padding: 20px; color: #94a3b8;">
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

    // แปลง Map กลับเป็น Array เพื่อให้ Vue นำไปวนลูป (v-for) ได้
    problemGroups.value = Array.from(groupsMap.values())

    // โหลดเสร็จก็ส่งข้อมูลที่ติ๊กอยู่ไปให้หน้าหลัก
    emitSelection()
  } catch (error) {
    console.error('Error fetching problems:', error)
  }
}

// ฟังก์ชันรวบรวมข้อมูลรายการที่ติ๊กเลือก เพื่อส่งกลับหน้าหลัก (Export)
const emitSelection = () => {
  const selectedProblems = []
  
  // แกะข้อมูลที่จัดกลุ่มไว้ ออกมาเป็นแถวเดี่ยวๆ เฉพาะอันที่ติ๊ก
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

watch(() => props.selectedTasks, fetchProblems, { deep: true })
onMounted(fetchProblems)
</script>