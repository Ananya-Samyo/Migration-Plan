<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  value: [Number, String],
  icon: String,
  type: {
    type: String,
    default: 'primary'
  }
})

// --- 1. เพิ่มบรรทัดนี้เพื่อสร้างตัวส่งเหตุการณ์ ---
const emit = defineEmits(['details'])

const theme = {
  warning: { border: '#ca8a04', bg: '#fefce8', defaultIcon: '📁' },
  primary: { border: '#6d28d9', bg: '#ede9fe', defaultIcon: '📌' },
  success: { border: '#15803d', bg: '#dcfce7', defaultIcon: '✅' },
  danger: { border: '#b91c1c', bg: '#fee2e2', defaultIcon: '⚠️' }
}

const activeTheme = computed(() => theme[props.type] || theme['primary'])
const displayIcon = computed(() => props.icon || activeTheme.value.defaultIcon)
</script>

<template>
  <div class="card clickable" 
       @click="emit('details', type)" 
       :style="{
         borderLeft: '5px solid ' + activeTheme.border,
         background: activeTheme.bg
       }">
    <div class="icon">{{ displayIcon }}</div>
    <div class="card-content">
      <h4 :style="{ color: activeTheme.border }">{{ title }}</h4>
      <h1>{{ value }}</h1>
    </div>
  </div>
</template>

<style scoped>
/* --- 3. เพิ่ม CSS ส่วนนี้เพื่อให้ดูเหมือนปุ่มที่กดได้ --- */
.card.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.card.clickable:hover {
  filter: brightness(0.95);
  transform: translateY(-2px);
}

.card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 5px;
  padding: 24px;
  min-height: 140px;
  border-radius: 14px;
  /* ส่วนที่เหลือคงเดิมตามไฟล์ของคุณ */
}

.icon { font-size: 2.5rem; }
.card-content h4 { margin: 0; font-size: 1rem; font-weight: 600; }
.card-content h1 { margin: 8px 0 0; font-size: 2.2rem; font-weight: 700; color: #1e293b; }
</style>