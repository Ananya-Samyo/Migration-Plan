<template>
  <div class="page">
    <h1>เพิ่มโครงการ</h1>

    <!-- ชื่อโครงการ -->
    <div class="form-group">
      <label>ชื่อโครงการ</label>
      <input v-model="projectName" type="text" placeholder="กรอกชื่อโครงการ" />
    </div>

    <!-- ผลการวิเคราะห์ช่องว่าง (GAP) -->
    <div class="section">
      <h2>ผลการวิเคราะห์ช่องว่าง (GAP)</h2>

      <div v-for="(gap, index) in gapAnalysis" :key="index" class="repeat-box">
        <textarea v-model="gap.text" placeholder="กรอกรายละเอียด GAP"></textarea>
        <button class="remove" v-if="gapAnalysis.length > 1" @click="removeGap(index)">ลบ</button>
      </div>

      <button class="add" @click="addGap">+ เพิ่ม GAP</button>
    </div>

    <!-- สถานะหลังการแก้ปัญหา -->
    <div class="section">
      <label>สถานะหลังการแก้ปัญหา</label>
      <select v-model="status">
        <option value="">-- เลือกสถานะ --</option>
        <option value="closed">ปิด GAP เสร็จแล้ว</option>
        <option value="acceptable">ไม่สามารถปิด GAP แต่ยอมรับได้</option>
        <option value="open">ยังไม่ปิด GAP</option>
      </select>
    </div>

    <!-- แสดงเฉพาะเมื่อยังไม่ปิด GAP -->
    <div v-if="status === 'open'" class="section">
      <h2>รายละเอียดหลังจากนี้</h2>

      <!-- สถานะการดำเนินงาน (%) -->
      <div class="sub-section">
        <h3>สถานะการดำเนินงาน (%)</h3>
        <div v-for="(p, i) in progress" :key="i" class="repeat-box">
          <input type="number" v-model="p.value" min="0" max="100" placeholder="% ความคืบหน้า" />
        </div>
      </div>

      <!-- รายละเอียดการดำเนินงาน -->
      <div class="sub-section">
        <h3>รายละเอียดการดำเนินงาน</h3>
        <div v-for="(d, i) in actions" :key="i" class="repeat-box">
          <textarea v-model="d.text" placeholder="รายละเอียดการดำเนินงาน"></textarea>
          <button class="remove" v-if="actions.length > 1" @click="removeAction(i)">ลบ</button>
        </div>
        <button class="add" @click="addAction">+ เพิ่ม</button>
      </div>

      <!-- ปัญหาอุปสรรค -->
      <div class="sub-section">
        <h3>ปัญหาอุปสรรค</h3>
        <div v-for="(p, i) in problems" :key="i" class="repeat-box">
          <textarea v-model="p.text" placeholder="ปัญหาอุปสรรค"></textarea>
          <button class="remove" v-if="problems.length > 1" @click="removeProblem(i)">ลบ</button>
        </div>
        <button class="add" @click="addProblem">+ เพิ่ม</button>
      </div>

      <!-- แนวทางแก้ไข -->
      <div class="sub-section">
        <h3>แนวทางแก้ไข</h3>
        <div v-for="(s, i) in solutions" :key="i" class="repeat-box">
          <textarea v-model="s.text" placeholder="แนวทางแก้ไข"></textarea>
          <button class="remove" v-if="solutions.length > 1" @click="removeSolution(i)">ลบ</button>
        </div>
        <button class="add" @click="addSolution">+ เพิ่ม</button>
      </div>
    </div>

    <button class="submit">บันทึกโครงการ</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const projectName = ref('')
const status = ref('')

const gapAnalysis = ref([{ text: '' }])
const progress = ref([{ value: '' }])
const actions = ref([{ text: '' }])
const problems = ref([{ text: '' }])
const solutions = ref([{ text: '' }])

const addGap = () => gapAnalysis.value.push({ text: '' })
const removeGap = (i) => gapAnalysis.value.splice(i, 1)

const addProgress = () => progress.value.push({ value: '' })
const removeProgress = (i) => progress.value.splice(i, 1)

const addAction = () => actions.value.push({ text: '' })
const removeAction = (i) => actions.value.splice(i, 1)

const addProblem = () => problems.value.push({ text: '' })
const removeProblem = (i) => problems.value.splice(i, 1)

const addSolution = () => solutions.value.push({ text: '' })
const removeSolution = (i) => solutions.value.splice(i, 1)
</script>

<style scoped>
.page {
  max-width: 900px;
  margin: 32px auto;
  padding: 32px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(74, 44, 122, 0.08);
  font-family: 'Prompt', sans-serif;
}

/* ---------- Title ---------- */
h1 {
  font-size: 26px;
  font-weight: 600;
  color: #4a2c7a;
  margin-bottom: 32px;
  border-left: 6px solid #d4af37;
  padding-left: 12px;
}

/* ---------- Sections ---------- */
.section {
  margin-bottom: 32px;
  padding: 20px;
  border-radius: 12px;
  background: #faf8ff;
  border: 1px solid #eee6ff;
}

.section h2 {
  font-size: 18px;
  color: #4a2c7a;
  margin-bottom: 16px;
}

/* ---------- Sub Sections ---------- */
.sub-section {
  margin-bottom: 24px;
}

.sub-section h3 {
  font-size: 15px;
  font-weight: 500;
  color: #6b4ca3;
  margin-bottom: 10px;
}

/* ---------- Form ---------- */
.form-group label,
.section label {
  font-weight: 500;
  color: #3f2a63;
}

.form-group {
  margin-bottom: 32px; 
}


input,
textarea,
select {
  width: 100%;
  padding: 10px 12px;
  margin-top: 6px;
  border-radius: 8px;
  border: 1px solid #d8cfff;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #a98de3;
  box-shadow: 0 0 0 3px rgba(169, 141, 227, 0.2);
}

/* ---------- Repeat Box ---------- */
.repeat-box {
  background: #ffffff;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #eee;
  margin-bottom: 10px;
}

/* ---------- Buttons ---------- */
.add {
  background: linear-gradient(135deg, #6b4ca3, #4a2c7a);
  color: #ffffff;
  border: none;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.remove {
  background: transparent;
  color: #c0392b;
  border: none;
  font-size: 12px;
  margin-top: 6px;
  cursor: pointer;
}

.remove:hover {
  text-decoration: underline;
}

/* ---------- Submit ---------- */
.submit {
  display: block;
  width: 100%;
  margin-top: 32px;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  color: #4a2c7a;
  background: linear-gradient(
    135deg,
    #f5e7b2,
    #d4af37
  );
  box-shadow: 0 6px 16px rgba(212, 175, 55, 0.35);
  transition: all 0.25s ease;
}

.submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(212, 175, 55, 0.45);
}
</style>