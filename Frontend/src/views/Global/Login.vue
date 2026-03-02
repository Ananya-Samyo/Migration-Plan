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

  try { // 🟢 ต้องเปิด try { ตรงนี้ครับ
    const response = await axios.post('http://localhost:3000/api/login', {
      email: email.value
    })

    // 1. รับค่า
    const { user, token } = response.data 
    
    // 2. เก็บลง LocalStorage
    localStorage.setItem('token', token) 
    localStorage.setItem('role', user.role)
    localStorage.setItem('user_id', user.user_id)
    localStorage.setItem('user_name', user.user_name)

    // 3. Redirect ตาม Role
    if (user.role === 'admin' || user.role === 'viewer') {
      router.push('/admin') 
    } else if (user.role === 'coordinator' || user.role === 'user') {
      router.push('/user')
    } else {
      error.value = 'สิทธิ์การใช้งานไม่ถูกต้อง'
      localStorage.clear()
    }

  } catch (err) { // 🟢 คู่กับ catch ตรงนี้
    console.error('Login error:', err)
    error.value = 'ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบอีเมลอีกครั้ง'
  } finally {
    // 🟢 finally จะทำงานเสมอไม่ว่าจะสำเร็จหรือ Error (ช่วยปิดสถานะกำลังโหลด)
    loading.value = false 
  }
}
</script>