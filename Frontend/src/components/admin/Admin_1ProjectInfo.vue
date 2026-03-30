<template>
  <div class="main-wrapper">
    <header class="top-bar">
      <div class="left-head">
        <h1 class="page-title">ข้อมูลแผนงาน</h1>
      </div>
    </header>

    <div class="card" style="margin-bottom: 20px; border-left: 5px solid #3498db;">
      <div class="field">
        <label style="font-weight: bold;">ชื่อขอบเขตงาน / โครงการหลัก</label>
        <input v-model="form.scopeName" type="text" placeholder="ระบุชื่อขอบเขตงาน" class="input-main" />
      </div>
    </div>

    <div v-for="(project, pIndex) in form.projects" :key="pIndex" class="card" style="margin-bottom: 20px;">

      <div class="field" style="margin-bottom: 20px;">
        <div class="grid-2">
          <div>
            <label style="font-weight: bold;">ชื่อแผนงานที่ {{ pIndex + 1 }}</label>
            <input v-model="project.projectName" type="text" placeholder="ระบุชื่อแผนงาน..." />
          </div>
          <div>
            <label style="font-weight: bold;">หน่วยงานเจ้าของขอบเขตงาน</label>
            <select v-model="project.department_id">
              <option value="">-- เลือกแผนก --</option>
              <option v-for="dept in departments" :key="dept.department_id" :value="dept.department_id">
                {{ dept.department_name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <hr style="margin-bottom: 20px; border: 0; border-top: 1px solid #eee;">

      <div class="field">
        <div class="label-header">
          <label style="margin-bottom: 0; font-weight: bold; color: #2c3e50;">
            ผู้ประสานงาน (หลัก)
          </label>
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

            <span v-if="phoneErrors[`p${pIndex}-coord`]"
              style="color: #ff4d4f; font-size: 13px; margin-top: 5px; display: block; font-weight: bold;">
              * {{ phoneErrors[`p${pIndex}-coord`] }}
            </span>
          </div>
        </div>
      </div>

      <div class="field" style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
        <div class="label-header">
          <label style="margin-bottom: 0; font-weight: bold;">คณะทำงาน</label>
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

              <span v-if="phoneErrors[`p${pIndex}-m${mIndex}`]"
                style="color: #ff4d4f; font-size: 13px; margin-top: 5px; display: block; font-weight: bold;">
                * {{ phoneErrors[`p${pIndex}-m${mIndex}`] }}
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

      <button v-if="form.projects.length > 1" @click="removeProject(pIndex)"
        style="margin-top: 15px; color: #ff4d4f; border: none; background: none; cursor: pointer; font-size: 14px;">
        🗑️ ลบแผนงานนี้
      </button>
    </div>

    <div style="display: flex; gap: 15px; margin-top: 20px; padding-bottom: 40px;">
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
const phoneErrors = ref({});

const validatePhoneNumber = (value, type, pIndex, mIndex = null) => {
  const isInvalid = /[^0-9]/.test(value);
  const key = type === 'coordinator' ? `p${pIndex}-coord` : `p${pIndex}-m${mIndex}`;
  if (isInvalid) {
    phoneErrors.value[key] = 'กรุณากรอกเฉพาะตัวเลขเท่านั้น';
  } else {
    delete phoneErrors.value[key];
  }
};

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

watch(form, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch(DEPT_API, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) departments.value = await res.json();
  } catch (err) { console.error(err); }
});

const copyFromFirst = (currentIndex, type) => {
  const firstProject = form.value.projects[0];
  const currentProject = form.value.projects[currentIndex];
  if (type === 'coordinator') {
    currentProject.coordinator = { ...firstProject.coordinator };
  } else if (type === 'teamMembers') {
    currentProject.teamMembers = firstProject.teamMembers.map(member => ({ ...member }));
  }
  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'คัดลอกเรียบร้อย', showConfirmButton: false, timer: 1000 });
}

const addProject = () => {
  form.value.projects.push({
    projectName: '',
    department_id: '',
    startDate: '',
    endDate: '',
    coordinator: { name: '', email: '', phone_number: '' },
    teamMembers: [{ name: '', email: '', phone_number: '' }],
    gaps: [{ detail: '' }],
    status: 'open'
  })
}

const removeProject = (index) => form.value.projects.splice(index, 1)

const addMember = (pIndex) => {
  form.value.projects[pIndex].teamMembers.push({ name: '', email: '', phone_number: '' })
}

const removeMember = (pIndex, mIndex) => {
  form.value.projects[pIndex].teamMembers.splice(mIndex, 1)
}

const handleNext = async () => {
  if (!form.value.scopeName) {
    return Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อขอบเขตงานหลัก', 'warning');
  }
  if (Object.keys(phoneErrors.value).length > 0) {
    return Swal.fire('ข้อมูลไม่ถูกต้อง', 'กรุณาแก้ไขเบอร์โทรศัพท์ให้ถูกต้อง', 'warning');
  }

  try {
    Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await fetch(`${BASE_API}/api/admin/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(form.value)
    });
    const result = await res.json();
    if (res.ok && result.success) {
      if (result.projects) {
        form.value.projects = form.value.projects.map((p) => {
          const matched = result.projects.find(rp => rp.projectName === p.projectName);
          return { ...p, project_plan_id: matched ? matched.project_plan_id : p.project_plan_id };
        });
      }
      emit('update:modelValue', { ...form.value });
      Swal.close();
      emit('next', { id: result.scopeId, projects: form.value.projects });
    } else {
      throw new Error(result.message || 'บันทึกไม่สำเร็จ');
    }
  } catch (error) {
    Swal.close();
    Swal.fire('Error', error.message, 'error');
  }
}

const checkUserEmail = async (personObj) => {
  if (!personObj.email || !personObj.email.includes('@')) return;
  try {
    const res = await fetch(`${BASE_API}/api/users/check-email?email=${personObj.email}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      const userData = await res.json();
      if (userData.found) {
        personObj.name = userData.user.user_name;
        personObj.phone_number = userData.user.phone_number || '';
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'พบข้อมูล!', showConfirmButton: false, timer: 1500 });
      }
    }
  } catch (err) { console.error(err); }
};
</script>