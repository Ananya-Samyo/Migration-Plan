<template>
  <div class="login-page">
    <div class="login-card">
      <img src="/Img/logo.png" alt="Logo" class="logo" />
      <div class="title-box">
        <h1>Migration Plan</h1>
        <h2>เข้าสู่ระบบ</h2>
      </div>

      <div class="login-form">
        <input 
          v-model="email" 
          type="email" 
          placeholder="กรอกอีเมลของคุณ" 
          class="login-input"
          @keyup.enter="handleLogin"
        />
        
        <button class="btn-confirm" @click="handleLogin" :disabled="loading">
          {{ loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ' }}
        </button>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>
      
      <footer>© 2026 Migration Plan System</footer>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import '../../assets/Global/css/Login.css'

const router = useRouter()
const email = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!email.value) {
    error.value = 'กรุณากรอกอีเมล'
    return
  }

  loading.value = true
  error.value = ''

  const response = await axios.post('http://localhost:3000/api/login', {
      email: email.value
    })

    // 1. รับค่า token เพิ่มจาก response (ที่เราจะไปแก้ backend ต่อ)
    const { user, token } = response.data 
    
    // 2. เก็บ token ลง LocalStorage
    localStorage.setItem('token', token) 
    localStorage.setItem('role', user.role)
    localStorage.setItem('user_id', user.user_id)

    // Redirect ตามเดิม
    if (user.role === 'admin') {
      router.push('/admin') 
    } else {
      router.push('/user')
    }
}
</script>