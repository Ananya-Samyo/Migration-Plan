<template>
  <div class="page">

    <h1 class="page-title">เพิ่มแผนงาน</h1>

    <div class="card">

      <!-- ชื่อขอบเขตงาน -->
      <div class="field">
        <label>ชื่อขอบเขตงาน</label>
        <input v-model="form.scopeName" type="text" placeholder="กรอกชื่อขอบเขตงาน" />
      </div>

      <!-- ===============================
           PROJECT LIST
      =============================== -->
      <div v-for="(project, pIndex) in form.projects" :key="pIndex" class="project-card">
        <div class="project-header">
          <h3>แผนงานที่ {{ pIndex + 1 }}</h3>

          <button v-if="form.projects.length > 1" class="remove-project" @click="removeProject(pIndex)">
            ลบแผนงาน
          </button>
        </div>

        <!-- ชื่อแผนงาน -->
        <div class="field">
          <label>ชื่อแผนงาน</label>
          <input v-model="project.projectName" type="text" placeholder="กรอกชื่อแผนงาน" />
        </div>

        <!-- กอง -->
        <div class="field">
          <label>กอง</label>
          <select v-model="project.department_id" class="select-input">
            <option value="">-- เลือกกอง --</option>
            <option v-for="dept in departments" :key="dept.department_id" :value="dept.department_id">
              {{ dept.department_name }}
            </option>
          </select>
        </div>

        <!-- ===============================
     คณะทำงาน
=============================== -->
        <div class="field">
          <label>คณะทำงาน</label>

          <div v-for="(member, mIndex) in project.teamMembers" :key="mIndex" class="team-item">
            <div class="team-inputs">
              <input v-model="member.name" type="text" :placeholder="`ชื่อคณะทำงานคนที่ ${mIndex + 1}`" />
              <input v-model="member.email" type="email" placeholder="อีเมล" />
            </div>

            <button v-if="project.teamMembers.length > 1" class="remove-member" @click="removeMember(pIndex, mIndex)">
              ลบ
            </button>
          </div>

          <button class="add-member" @click="addMember(pIndex)">
            + เพิ่มรายชื่อ
          </button>
        </div>


        <!-- ===============================
             ผู้ประสานงาน
        =============================== -->
        <div class="field">
          <label>ผู้ประสานงาน</label>

          <div class="coordinator-inputs">
            <input v-model="project.coordinator.name" type="text" placeholder="ชื่อ-สกุลผู้ประสานงาน" />
            <input v-model="project.coordinator.email" type="email" placeholder="อีเมลผู้ประสานงาน" />
          </div>
        </div>

        <!-- GAP -->
        <div class="field">
          <label>ผลการวิเคราะห์ช่องว่าง (GAP)</label>

          <div v-for="(gap, gIndex) in project.gaps" :key="gIndex" class="gap-item">
            <textarea v-model="gap.detail" placeholder="กรอกรายละเอียด GAP"></textarea>

            <button v-if="project.gaps.length > 1" class="remove-gap" @click="removeGap(pIndex, gIndex)">
              ลบ
            </button>
          </div>

          <button class="add-gap" @click="addGap(pIndex)">
            + เพิ่ม GAP
          </button>
        </div>

        <div class="status-preview">
          สถานะแผนงาน :
          <span class="status-pill">ยังไม่ปิด GAP</span>
        </div>
      </div>

      <button class="add-project" @click="addProject">
        + เพิ่มแผนงาน
      </button>

      <button class="save-btn" @click="generateEmailDraft">
        บันทึกทั้งหมด
      </button>

      <div v-if="showEmailPreview" class="email-preview-overlay">
        <div class="email-preview">
          <h3>ตรวจสอบอีเมลก่อนส่ง</h3>

          <label>ผู้รับ</label>
          <textarea readonly :value="emailDraft.recipients.join(', ')"></textarea>

          <label>หัวข้อ</label>
          <input v-model="emailDraft.subject" />

          <label>เนื้อหา</label>
          <textarea v-model="emailDraft.body" rows="12"></textarea>

          <div class="actions">
            <button type="button" @click="showEmailPreview = false">
              แก้ไขข้อมูล
            </button>

            <button class="confirm" @click="saveWithConfirm">
              ยืนยันบันทึกและส่งอีเมล
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'
import '../../assets/Admin/css/Admin_Addproject.css'

/* ===============================
   API CONFIG
================================ */
const BASE_API = import.meta.env.VITE_API_BASE_URL

const DEPT_API = `${BASE_API}/api/departments`     
const SCOPE_API = `${BASE_API}/api/admin/scopes`   

/* ===============================
   STATE
================================ */
const departments = ref([])

const form = ref({
  scopeName: '',
  projects: [
    {
      projectName: '',
      department_id: '',
      coordinator: {
        name: '',
        email: ''
      },
      teamMembers: [
        { name: '', email: '' }
      ],
      gaps: [{ detail: '' }],
      status: 'open',
      statusText: 'ยังไม่ปิด GAP'
    }
  ]
})

/* ===============================
   LOAD DEPARTMENTS
================================ */
const loadDepartments = async () => {
  try {
    const res = await fetch(DEPT_API)
    if (!res.ok) throw new Error('Network response was not ok')
    departments.value = await res.json()
  } catch {
    Swal.fire('ผิดพลาด', 'โหลดข้อมูลกองไม่สำเร็จ', 'error')
  }
}

onMounted(loadDepartments)

// Email State
const showEmailPreview = ref(false)
const emailDraft = ref({
  subject: '',
  body: '',
  recipients: []
})


/* ===============================
   ACTIONS (Add/Remove)
================================ */
const addProject = () => {
  form.value.projects.push({
    projectName: '',
    department_id: '',
    coordinator: { name: '', email: '' },
    teamMembers: [{ name: '', email: '' }],
    gaps: [{ detail: '' }],
    status: 'open',
    statusText: 'ยังไม่ปิด GAP'
  })
}

const removeProject = (index) => {
  form.value.projects.splice(index, 1)
}

const addMember = (pIndex) => {
  form.value.projects[pIndex].teamMembers.push({
    name: '',
    email: ''
  })
}

const removeMember = (pIndex, mIndex) => {
  form.value.projects[pIndex].teamMembers.splice(mIndex, 1)
}

const addGap = (pIndex) => {
  form.value.projects[pIndex].gaps.push({ detail: '' })
}

const removeGap = (pIndex, gIndex) => {
  form.value.projects[pIndex].gaps.splice(gIndex, 1)
}

/* ===============================
   VALIDATION & EMAIL GEN
================================ */
const validateForm = () => {
  if (!form.value.scopeName) {
    Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อขอบเขตงาน', 'warning')
    return false
  }

  for (const project of form.value.projects) {
    if (
      !project.projectName ||
      !project.department_id ||
      !project.coordinator.name ||
      !project.coordinator.email
    ) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลแผนงานให้ครบ', 'warning')
      return false
    }

    for (const member of project.teamMembers) {
      if (!member.name || !member.email) {
        Swal.fire(
          'ข้อมูลไม่ครบ',
          'กรุณากรอกชื่อและอีเมลคณะทำงานให้ครบ',
          'warning'
        )
        return false
      }
    }
  }

  return true
}

const generateEmailDraft = () => {
  if (!validateForm()) return

  const recipients = new Set()

  let body = `
  <div style="font-family: Arial, Tahoma, sans-serif; font-size: 14px; color: #000;">
    <p><strong>เรื่อง</strong> แจ้งแผนงานภายใต้ขอบเขตงาน "${form.value.scopeName}"</p>

    <p><strong>เรียน</strong> คณะทำงานและผู้ที่เกี่ยวข้องทุกท่าน</p>

    <p>
      ตามที่มีการจัดทำแผนงานภายใต้ขอบเขตงานดังกล่าว<br />
      ระบบ Migration Plan ขอแจ้งรายละเอียดแผนงานเพื่อทราบและใช้เป็นแนวทางในการดำเนินงาน ดังต่อไปนี้
    </p>

    <hr style="border: none; border-top: 2px solid #444; margin: 24px 0;" />

    <h3 style="margin-bottom: 4px;">
      ขอบเขตงาน : ${form.value.scopeName}
    </h3>
    <hr style="border: none; border-top: 1px solid #999; margin-bottom: 24px;" />
  `

  form.value.projects.forEach((p, i) => {
    body += `
    <div style="margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0;">
        <strong>แผนงานที่ ${i + 1} :</strong> ${p.projectName}
      </p>

      <p style="margin: 0 0 10px 0;">
        <strong>กอง :</strong>
        ${
          departments.value.find(d => d.department_id === p.department_id)
            ?.department_name || '-'
        }
      </p>

      <p style="margin: 0;">
        <strong>ผู้ประสานงาน</strong><br />
        ${p.coordinator.name}<br />
        อีเมล : ${p.coordinator.email}
      </p>
    `

    recipients.add(p.coordinator.email)

    if (p.teamMembers.length) {
      body += `
      <p style="margin: 10px 0 4px 0;"><strong>คณะทำงาน</strong></p>
      <ul style="margin-top: 0;">
      `
      p.teamMembers.forEach(m => {
        body += `<li>${m.name} (${m.email})</li>`
        recipients.add(m.email)
      })
      body += `</ul>`
    }

    if (p.gaps.length) {
      body += `
      <p style="margin: 10px 0 4px 0;"><strong>ผลการวิเคราะห์ช่องว่าง (GAP)</strong></p>
      <ol style="margin-top: 0;">
      `
      p.gaps.forEach(g => {
        body += `<li>${g.detail}</li>`
      })
      body += `</ol>`
    }

    body += `</div>`
  })

  body += `
    <hr style="border: none; border-top: 1px solid #999; margin: 24px 0;" />

    <p>
      จึงเรียนมาเพื่อโปรดทราบ และขอความร่วมมือในการดำเนินงานตามแผนที่กำหนด<br />
      หากมีข้อสงสัยหรือประสงค์สอบถามข้อมูลเพิ่มเติม สามารถติดต่อผู้ประสานงานของแต่ละแผนงานได้โดยตรง
    </p>

    <p>
      ขอขอบคุณในความร่วมมือมา ณ โอกาสนี้
    </p>

    <p>
      ขอแสดงความนับถือ<br />
      <strong>ระบบ Migration Plan</strong>
    </p>
  </div>
  `

  emailDraft.value = {
    subject: `หนังสือแจ้งขอบเขตงาน : ${form.value.scopeName}`,
    body,
    recipients: Array.from(recipients),
    isHtml: true 
  }

  showEmailPreview.value = true
}

const confirmSaveAndSend = async () => {
  if (!validateForm()) return

  try {
    const res = await fetch(SCOPE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form.value,
        email: emailDraft.value
      })
    })

    if (!res.ok) throw new Error('บันทึกไม่สำเร็จ')

    Swal.fire('สำเร็จ', 'บันทึกและส่งอีเมลเรียบร้อยแล้ว', 'success')
    showEmailPreview.value = false

    if (!emailDraft.value.recipients.length) {
      Swal.fire('ไม่มีผู้รับอีเมล', 'กรุณาตรวจสอบข้อมูลอีเมล', 'warning')
      return
    }

  } catch (err) {
    Swal.fire('ผิดพลาด', err.message, 'error')
  }
}


/* ===============================
   CONFIRM ALERT (Main Save Function)
================================ */
const saveWithConfirm = async () => {
  if (!validateForm()) return

  const confirm = await Swal.fire({
    title: 'ยืนยันการบันทึก',
    text: 'ต้องการบันทึกข้อมูลแผนงานทั้งหมดใช่หรือไม่',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true
  })

  if (!confirm.isConfirmed) return

  // 🔄 แสดง loading
  Swal.fire({
    title: 'กำลังดำเนินการ',
    text: 'กำลังบันทึกข้อมูลและส่งอีเมล...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading()
    }
  })

  try {
    // ✅ แก้ไข: ใช้ตัวแปร SCOPE_API แทน Link เดิมที่เขียนผิด
    const res = await fetch(SCOPE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form.value,
        email: emailDraft.value
      })
    })

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'บันทึกไม่สำเร็จ')
    }

    // ✅ ปิด loading แล้วแสดง success
    Swal.fire('สำเร็จ', 'บันทึกและส่งอีเมลเรียบร้อยแล้ว', 'success')
    showEmailPreview.value = false

  } catch (err) {
    Swal.fire('ผิดพลาด', err.message, 'error')
  }
}

</script>