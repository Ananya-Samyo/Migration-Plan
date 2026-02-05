<template>
  <div class="login-page">
    <div class="login-card">

      <!-- Logo -->
      <img src="/Img/logo.png" alt="Logo" class="logo" />

      <div class="title-box">
        <h1>Migration Plan</h1>
        <h2>ระบบติดตามแผนงาน</h2>
      </div>

      <p class="subtitle">เลือกบทบาทผู้ใช้งาน</p>

      <!-- Select Role -->
      <div class="role-select">
        <button class="role-btn admin" @click="selectRole('admin')">
          🧑‍💼 ผู้ดูแลระบบ (Admin)
        </button>

        <button class="role-btn user" @click="selectRole('user')">
          👤 ผู้ใช้งาน (User)
        </button>
      </div>

      <footer>
        © 2026 Migration Plan System
      </footer>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import '../../assets/Global/css/Login.css'

const router = useRouter()

function selectRole(role) {
  localStorage.setItem('role', role)

  if (role === 'admin') {
    router.push('/admin')
  } else {
    router.push('/user')
  }
}
</script>