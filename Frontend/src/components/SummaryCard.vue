<template>
  <div class="card clickable" 
       @click="emit('details', type)" 
       :style="{ borderLeft: '5px solid ' + activeTheme.border, background: activeTheme.bg }">
    <div class="icon">{{ displayIcon }}</div>
    <div class="card-content">
      <h4 :style="{ color: activeTheme.border }">{{ title }}</h4>
      <h1>{{ value }}</h1>
    </div>
  </div>
</template>

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

// แจ้งไปยัง Parent ว่ากล่องนี้ถูกคลิก
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

<style scoped>
.card.clickable:hover { filter: brightness(0.95); transform: translateY(-2px); transition: 0.2s; }
.card.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 5px;
  padding: 24px;
  min-height: 140px;
  border-radius: 14px;
  background-color: #fff;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.05);
  transition: transform 0.15s ease;
}

.card:hover {
  transform: translateY(-1px);
}

.icon {
  font-size: 32px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.card-content h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  opacity: 0.9;
}

.card-content h1 {
  margin: 2px 0 0;
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
}
</style>