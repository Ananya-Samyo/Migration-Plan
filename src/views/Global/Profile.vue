<template>
  <div class="profile-page">
    <div class="profile-card">

      <!-- ===== Header : Back Button ===== -->
      <div class="profile-header">
        <button class="back-btn-pill" @click="$router.back()">
          <span class="icon-circle">
            ←
          </span>
          <span class="text">ย้อนกลับ</span>
        </button>
      </div>

      <!-- ===== Left : Avatar ===== -->
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <img :src="previewImage || profile.avatar" class="avatar" />
          <label v-if="isEditing" class="upload-overlay">
            📷
            <input type="file" hidden @change="onFileChange" />
          </label>
        </div>

        <h3 class="user-name">{{ profile.name }}</h3>
        <p class="user-position">{{ profile.position }}</p>
      </div>

      <!-- ===== Right : Form ===== -->
      <div class="form-section">
        <div class="form-grid">
          <div class="form-group" v-for="field in fields" :key="field.key">
            <label>{{ field.label }}</label>
            <input v-model="profile[field.key]" :type="field.type || 'text'" :readonly="!isEditing" />
          </div>
        </div>

        <!-- Buttons -->
        <div class="button-group">
          <button v-if="!isEditing" class="edit" @click="isEditing = true">
            ✏️ แก้ไขข้อมูล
          </button>

          <div v-else>
            <button class="save" @click="saveProfile">
              💾 บันทึก
            </button>
            <button class="cancel" @click="cancelEdit">
              ยกเลิก
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import '../../assets/Global/css/Profile.css'

const isEditing = ref(false)
const previewImage = ref(null)

const profile = reactive({
  avatar: 'https://via.placeholder.com/150',
  name: 'นายสมชาย ใจดี',
  division: 'กองเทคโนโลยีสารสนเทศ',
  department: 'แผนกระบบงาน',
  position: 'นักวิชาการคอมพิวเตอร์',
  email: 'somchai@example.com',
  phone: '081-234-5678',
  building: 'อาคาร A'
})

const fields = [
  { key: 'division', label: 'กอง' },
  { key: 'department', label: 'แผนก' },
  { key: 'position', label: 'ตำแหน่ง' },
  { key: 'email', label: 'อีเมล', type: 'email' },
  { key: 'phone', label: 'เบอร์โทร' },
  { key: 'building', label: 'ตึก' }
]

const onFileChange = (e) => {
  const file = e.target.files[0]
  if (file) previewImage.value = URL.createObjectURL(file)
}

const saveProfile = () => {
  isEditing.value = false
  if (previewImage.value) profile.avatar = previewImage.value
}

const cancelEdit = () => {
  isEditing.value = false
  previewImage.value = null
}
</script>

<style scoped>
/* ===== Header ===== */
.profile-header {
  margin-bottom: 16px;
}

.profile-header {
  margin-bottom: 16px;
}

/* ===== Pill Back Button ===== */
.back-btn-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 8px;
  border-radius: 999px;
  border: 1px solid #dcd6fe;
  background: #f4f2ff;
  color: #6d5dfc;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* icon circle */
.back-btn-pill .icon-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #6d5dfc;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
}

/* text */
.back-btn-pill .text {
  white-space: nowrap;
}

/* hover effect */
.back-btn-pill:hover {
  background: #ebe8ff;
  border-color: #c9c2ff;
}

/* ===== Back Button UI (เหมือนหน้าอื่น) ===== */
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  border: none;
  background: #f1f5f9;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn .icon {
  font-size: 18px;
  line-height: 1;
}

.back-btn:hover {
  background: #e2e8f0;
}
</style>
