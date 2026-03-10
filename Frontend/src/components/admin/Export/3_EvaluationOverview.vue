<template>
  <div class="step-container">
    <div class="header-section">
      <h2 class="step-title">3. ภาพรวมการประเมินผลประโยชน์</h2>
    </div>

    <div v-if="!evaluationGroups || evaluationGroups.length === 0" class="empty-state" style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 8px;">
      <span>📊</span>
      <p style="margin-top: 10px; color: #64748b;">กรุณาเลือกขอบเขตงานจากหน้า 1 เพื่อประมวลผลประโยชน์ที่ได้รับ</p>
    </div>

    <div v-else class="evaluation-content">
      <div v-for="(group, index) in evaluationGroups" :key="group.scopeId" class="gap-group-card" style="margin-bottom: 30px;">
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px 8px 0 0; border: 1px solid #e2e8f0; border-bottom: none;">
          <h3 style="margin: 0; color: #4c1d95; font-size: 16px;">
            📁 ขอบเขตงาน: {{ group.scopeName }}
          </h3>
        </div>

        <div class="table-container" style="border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
          <table class="modern-table" style="margin: 0; border: none;">
            <thead>
              <tr>
                <th width="50" class="text-center">เลือก</th>
                <th width="40%">1. สรุปประโยชน์ภาพรวม</th>
                <th width="40%">2. ข้อเสนอแนะการปรับปรุง</th>
                <th width="120" class="text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in group.items" :key="idx">
                <td class="text-center">
                  <input 
                    type="checkbox" 
                    v-model="item.selected" 
                    @change="emitSelection" 
                    style="width: 18px; height: 18px; cursor: pointer;"
                  >
                </td>
                <td style="white-space: pre-wrap; line-height: 1.6; color: #334155;">
                  {{ item.actualOutcome || '-' }}
                </td>
                <td style="white-space: pre-wrap; line-height: 1.6; color: #334155;">
                  {{ item.recommendation || '-' }}
                </td>
                <td class="text-center">
                  <span class="status-pill" :class="item.statusClass">
                    {{ item.statusText }}
                  </span>
                </td>
              </tr>
              <tr v-if="group.items.length === 0">
                <td colspan="4" class="text-center" style="padding: 20px; color: #94a3b8;">
                  ไม่มีข้อมูลการประเมินสำหรับขอบเขตงานนี้
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

const emit = defineEmits(['update-evaluations'])
const evaluationGroups = ref([])

// ฟังก์ชันแปลงสถานะให้เป็น Class สี และ ข้อความ
const getStatusDetails = (evalStatus, projStatus) => {
  if (evalStatus === 'pass') {
    return { class: 'green', text: 'เป็นไปตามที่คาดหวัง' }
  }
  if (evalStatus === 'fail' && projStatus === 'finish') {
    return { class: 'red', text: 'ไม่เป็นไปตามที่คาดหวัง' }
  }
  if (evalStatus === 'fail' && projStatus === 'processing') {
    return { class: 'yellow', text: 'ทำแล้วดีขึ้น แต่ยังไม่เป็นไปตามที่คาดหวัง' }
  }
  return { class: 'yellow', text: 'รอประเมิน' } // ค่าเริ่มต้น
}

// ฟังก์ชันดึงและจัดกลุ่มข้อมูล
const fetchEvaluations = async () => {
  if (!props.selectedTasks.length) {
    evaluationGroups.value = []
    emitSelection()
    return
  }

  try {
    const scopeIds = props.selectedTasks.map(t => t.id).join(',')
    const response = await axios.get(`http://localhost:3000/api/admin/evaluations?scopeIds=${scopeIds}`)
    
    // 🌟 ระบบจัดกลุ่มข้อมูล (Group By) ตาม Scope ID
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

      const statusDetails = getStatusDetails(item.evaluation_status, item.project_status)

      // นำข้อมูลย่อยใส่เข้าไปในกลุ่มนั้นๆ
      groupsMap.get(item.scope_id).items.push({
        actualOutcome: item.actual_outcome,
        recommendation: item.recommendation,
        statusClass: statusDetails.class,
        statusText: statusDetails.text,
        colorStatus: statusDetails.class, // เผื่อส่งกลับไปหน้าหลัก
        selected: true // ตั้งค่าเริ่มต้นให้ติ๊กเลือก
      })
    })

    // แปลง Map กลับเป็น Array เพื่อให้ Vue นำไปวนลูป (v-for) ได้
    evaluationGroups.value = Array.from(groupsMap.values())

    // โหลดเสร็จก็ส่งข้อมูลที่ติ๊กอยู่ไปให้หน้าหลัก
    emitSelection()
  } catch (error) {
    console.error('Error fetching evaluations:', error)
  }
}

// ฟังก์ชันรวบรวมข้อมูลรายการที่ติ๊กเลือก เพื่อส่งกลับหน้าหลัก (Export)
const emitSelection = () => {
  const selectedEvals = []
  
  // แกะข้อมูลที่จัดกลุ่มไว้ ออกมาเป็นแถวเดี่ยวๆ เฉพาะอันที่ติ๊ก
  evaluationGroups.value.forEach(group => {
    group.items.forEach(item => {
      if (item.selected) {
        selectedEvals.push({
          scopeId: group.scopeId,
          scopeName: group.scopeName,
          actualOutcome: item.actualOutcome,
          recommendation: item.recommendation,
          colorStatus: item.statusClass
        })
      }
    })
  })

  emit('update-evaluations', selectedEvals)
}

watch(() => props.selectedTasks, fetchEvaluations, { deep: true })
onMounted(fetchEvaluations)
</script>