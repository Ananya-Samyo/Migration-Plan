<template>
  <div class="main-wrapper">
    <header class="top-bar">
      <div class="left-head">
        <h1 class="page-title">ข้อมูลแผนงาน</h1>
      </div>
    </header>

    <div class="card">
   <div class="field">
          <div class="label-header">
            <label style="margin-bottom: 0;">ผู้ประสานงาน (หลัก)</label>
            <label v-if="pIndex > 0" class="copy-checkbox-wrapper">
              <input type="checkbox" @change="copyFromFirst(pIndex, 'coordinator')">
              <span>คัดลอกรายชื่อจากแผนงานที่ 1</span>
            </label>
          </div>
          
          <div class="grid-3">
            <input v-model="project.coordinator.name" type="text" placeholder="ชื่อ-สกุล" />
            <input v-model="project.coordinator.email" type="email" placeholder="อีเมล"
              @blur="checkUserEmail(project.coordinator)" />

            <div class="flex flex-col gap-1">
              <input v-model="project.coordinator.phone_number" type="text" placeholder="เบอร์โทรศัพท์" maxlength="10"
                @input="validatePhoneNumber($event.target.value, 'coordinator', pIndex)"
                :class="{ 'border-red-500': phoneErrors[`p${pIndex}-coord`] }" class="border rounded px-3 py-2" />
              <span v-if="phoneErrors[`p${pIndex}-coord`]" class="text-red-500 text-sm pl-1">
                {{ phoneErrors[`p${pIndex}-coord`] }}
              </span>
            </div>
          </div>
        </div>

        <div class="field">
          <div class="label-header">
            <label style="margin-bottom: 0;">คณะทำงาน</label>
            <label v-if="pIndex > 0" class="copy-checkbox-wrapper">
              <input type="checkbox" @change="copyFromFirst(pIndex, 'teamMembers')">
              <span>คัดลอกรายชื่อจากแผนงานที่ 1</span>
            </label>
          </div>

          <div v-for="(member, mIndex) in project.teamMembers" :key="mIndex" class="team-item" style="margin-top: 10px;">
            <div class="grid-team">
              <input v-model="member.name" type="text" :placeholder="`ชื่อ-สกุลคนที่ ${mIndex + 1}`" />
              <input v-model="member.email" type="email" placeholder="อีเมล" @blur="checkUserEmail(member)" />
              
              <div class="flex flex-col gap-1">
                <input v-model="member.phone_number" type="text" placeholder="เบอร์โทรศัพท์" maxlength="10"
                  @input="validatePhoneNumber($event.target.value, 'teamMember', pIndex, mIndex)"
                  :class="{ 'border-red-500': phoneErrors[`p${pIndex}-m${mIndex}`] }" class="border rounded px-3 py-2" />
                <span v-if="phoneErrors[`p${pIndex}-m${mIndex}`]" class="text-red-500 text-sm pl-1">
                  {{ phoneErrors[`p${pIndex}-m${mIndex}`] }}
                </span>
              </div>

              <button v-if="project.teamMembers.length > 1" class="btn-remove-member"
                @click="removeMember(pIndex, mIndex)">
                ✕
              </button>
              <div v-else></div>
            </div>
          </div>

          <div class="add-member-container" style="margin-top: 15px;">
            <button type="button" class="btn-add-modern" @click="addMember(pIndex)">
              <div class="icon-circle-add">
                <span>+</span>
              </div>
              <span class="text">เพิ่มรายชื่อคณะทำงาน</span>
            </button>
          </div>
        </div>
    </div>

    <div style="display: flex; gap: 15px; margin-top: 20px;">
      <button class="add-project" style="flex: 1;" @click="addProject">+ เพิ่มแผนงานใหม่</button>
      <button class="btn-primary" style="flex: 1;" @click="handleNext">ไปขั้นตอนถัดไป ➔</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Swal from 'sweetalert2'
import '../../assets/Admin/css/Admin_UnifiedStyle.css'

const props = defineProps(['modelValue'])
const emit = defineEmits(['next', 'back', 'update:modelValue'])

const BASE_API = import.meta.env.VITE_API_BASE_URL
const DEPT_API = `${BASE_API}/api/departments`

const departments = ref([])

// 🌟 1. เปลี่ยนโครงสร้าง phoneErrors เป็น Object ว่าง
const phoneErrors = ref({});

// 🌟 2. อัปเดตฟังก์ชัน validate ให้รองรับหลายแผนงาน
const validatePhoneNumber = (value, type, pIndex, mIndex = null) => {
  const isInvalid = /[^0-9]/.test(value);
  
  // สร้าง Key เช่น 'p0-coord' (แผนงานที่ 1 ผู้ประสาน) หรือ 'p1-m2' (แผนงานที่ 2 ทีมงานคนที่ 3)
  const key = type === 'coordinator' ? `p${pIndex}-coord` : `p${pIndex}-m${mIndex}`;

  if (isInvalid) {
    phoneErrors.value[key] = '⚠️ กรุณากรอกตัวเลขเท่านั้น';
  } else {
    // ถ้าแก้ถูกแล้ว ให้ลบ Error ทิ้ง
    delete phoneErrors.value[key];
  }
};

// โครงสร้างข้อมูล Form
const form = ref(props.modelValue && props.modelValue.projects ? props.modelValue : {
  scopeName: '',
  projects: [
    {
      projectName: '',
      department_id: '',
      coordinator: { name: '', email: '', phone_number: '' },
      teamMembers: [{ name: '', email: '', phone_number: '' }],
      gaps: [{ detail: '' }],
      status: 'open'
    }
  ]
})

// Sync ข้อมูลกับ MasterStepper
watch(form, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    Swal.fire('Session Expired', 'กรุณาเข้าสู่ระบบใหม่', 'error');
    return;
  }

  try {
    const res = await fetch(DEPT_API, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      departments.value = await res.json();
    } else {
      console.warn("ไม่สามารถดึงข้อมูลแผนกได้ Status:", res.status);
    }
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลแผนก:", err);
  }
});

// --- ฟังก์ชันคัดลอกข้อมูลจากแผนงานที่ 1 ---
const copyFromFirst = (currentIndex, type) => {
  const firstProject = form.value.projects[0];
  const currentProject = form.value.projects[currentIndex];

  if (type === 'coordinator') {
    currentProject.coordinator = { ...firstProject.coordinator };
  }
  else if (type === 'teamMembers') {
    // คัดลอกรายชื่อคณะทำงานทั้งหมด
    currentProject.teamMembers = firstProject.teamMembers.map(member => ({ ...member }));
  }

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'คัดลอกข้อมูลเรียบร้อย',
    showConfirmButton: false,
    timer: 1000
  });
}

// --- ฟังก์ชันจัดการแผนงาน ---
const addProject = () => {
  form.value.projects.push({
    projectName: '',
    department_id: '',
    coordinator: { name: '', email: '', phone_number: '' },
    teamMembers: [{ name: '', email: '', phone_number: '' }],
    gaps: [{ detail: '' }],
    status: 'open'
  })
}

const removeProject = (index) => form.value.projects.splice(index, 1)

// --- ฟังก์ชันจัดการคณะทำงาน ---
const addMember = (pIndex) => {
  form.value.projects[pIndex].teamMembers.push({
    name: '',
    email: '',
    phone_number: ''
  })
}

const removeMember = (pIndex, mIndex) => {
  form.value.projects[pIndex].teamMembers.splice(mIndex, 1)
}

// --- บันทึกข้อมูล ---
const handleNext = async () => {
  if (!form.value.scopeName) {
    return Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อขอบเขตงาน', 'warning');
  }

  // 🌟 1. เช็คว่ามีแผนงานไหนที่ผู้ประสานงานหลักไม่ได้กรอกเบอร์โทรไหม
  const missingPhone = form.value.projects.some(p => !p.coordinator.phone_number);
  if (missingPhone) {
    return Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกเบอร์โทรศัพท์ผู้ประสานงานหลักให้ครบทุกแผนงาน', 'warning');
  }

  // 🌟 2. เช็คว่ามี Error เบอร์โทรศัพท์พิมพ์ผิด (ตัวอักษร) ค้างอยู่หรือไม่
  if (Object.keys(phoneErrors.value).length > 0) {
    return Swal.fire('ข้อมูลไม่ถูกต้อง', '⚠️ กรุณาแก้ไขเบอร์โทรศัพท์ให้ถูกต้อง (กรอกได้เฉพาะตัวเลขเท่านั้น)', 'warning');
  }

  try {
    // ... โค้ดบันทึก API และ Mapping ID ด้านล่างของคุณถูกต้องสมบูรณ์แล้วครับ ไม่ต้องแก้ ...
    Swal.fire({ title: 'กำลังบันทึกข้อมูลส่วนที่ 1...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(form.value)
    });

    const result = await res.json();

    if (res.ok && result.success) {

      // 🌟 แก้ไขจุดที่ 2: แมป ID โดยหาจากชื่อโปรเจกต์ให้ตรงกัน (ปลอดภัยกว่า)
      if (result.projects && result.projects.length > 0) {
        form.value.projects = form.value.projects.map((p) => {
          // หาโปรเจกต์จาก Backend ที่ชื่อตรงกัน
          const matchedProject = result.projects.find(rp => rp.projectName === p.projectName);

          return {
            ...p,
            // ถ้าเจอตัวที่ตรงกัน ก็เอา ID มาใส่ ถ้าไม่เจอก็ปล่อยผ่าน
            project_plan_id: matchedProject ? matchedProject.project_plan_id : p.project_plan_id
          };
        });
      }

      emit('update:modelValue', { ...form.value });

      Swal.close();

      emit('next', {
        id: result.scopeId, // 🌟 แก้ไขจุดที่ 1: เปลี่ยนจาก scope_id เป็น scopeId ให้ตรงกับ Backend
        projects: form.value.projects
      });

    } else {
      throw new Error(result.message || 'บันทึกไม่สำเร็จ');
    }
  } catch (error) {
    Swal.close(); // อย่าลืมปิด Loading ถ้าเกิด Error ด้วยครับ
    Swal.fire('Error', error.message, 'error');
  }
}

// --- ดึงข้อมูลจาก Email ---
const checkUserEmail = async (personObj) => {
  // ดักจับ: ถ้าช่องว่าง หรือ พิมพ์ยังไม่เป็นอีเมล (ไม่มี @) จะไม่ส่ง API
  if (!personObj.email || !personObj.email.includes('@')) return;

  try {
    const res = await fetch(`${BASE_API}/api/users/check-email?email=${personObj.email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (res.ok) {
      const userData = await res.json();
      if (userData.found) {
        personObj.name = userData.user.user_name;
        personObj.phone_number = userData.user.phone_number || '';

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'พบข้อมูลในระบบ เติมให้อัตโนมัติ!',
          showConfirmButton: false,
          timer: 1500
        });
      }
    }
  } catch (err) {
    console.error("เช็คข้อมูลอีเมลไม่สำเร็จ:", err);
  }
};
</script>