<!-- src/views/Logout.vue -->
<template>
  <div class="logout-page">
    กำลังออกจากระบบ...
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import '../../assets/Global/css/Logout.css'

const router = useRouter()

onMounted(async () => {
  // 1️⃣ Alert ยืนยัน
  const result = await Swal.fire({
    title: 'คุณแน่ใจหรือไม่?',
    text: "คุณต้องการออกจากระบบจริง ๆ หรือไม่",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'ใช่, ออกจากระบบ',
    cancelButtonText: 'ยกเลิก'
  })

  if (result.isConfirmed) {
    // 2️⃣ ล้าง token
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')

    // 3️⃣ Alert ว่า logout เรียบร้อยแล้ว
    await Swal.fire(
      'ออกจากระบบแล้ว!',
      'คุณได้ออกจากระบบเรียบร้อยแล้ว',
      'success'
    )

    // 4️⃣ redirect ไปหน้า login
    router.replace('/login')
  } else {
    // ถ้า user ยกเลิก กลับไปหน้าเดิม
    router.back()
  }
})
</script>