import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import axios from 'axios' // 1. นำเข้า axios

/* ======================================================
   AXIOS INTERCEPTORS (ระบบจัดการ Token อัตโนมัติ)
====================================================== */

// ขาไป: แนบ Token ไปกับทุก Request ถ้ามีอยู่ในเครื่อง
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// ขากลับ: ถ้า Server บอกว่า Token ใช้ไม่ได้ (401, 403) ให้ดีดกลับไป Login
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // ล้างข้อมูลที่ค้างอยู่
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('role');
      
      // ส่งไปหน้า Login
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

/* ======================================================
   CREATE APP
====================================================== */
const app = createApp(App)

app.use(router)
app.mount('#app')