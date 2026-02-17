<template>
  <div class="page">
    <h1>การประเมินผลโครงการ</h1>

    <!-- ================= Header Info ================= -->
    <div class="card header-card">
      <div class="grid-3">
        <div>
          <label>ชื่อขอบเขตงาน</label>
          <input v-model="scopeName" placeholder="กรอกชื่อขอบเขตงาน" />
        </div>

        <div>
          <label>ผู้รับผิดชอบ</label>
          <input v-model="owner" placeholder="ชื่อผู้รับผิดชอบ" />
        </div>

        <div>
          <label>สถานะโครงการ</label>
          <select v-model="projectStatus">
            <option value="">-- เลือก --</option>
            <option value="open">กำลังดำเนินการ</option>
            <option value="closed">เสร็จสิ้น</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ================= Section 1 ================= -->
    <div class="section">
      <h2>ผลที่คาดว่าจะได้รับหลังจากทำ Low Level</h2>

      <label>วัตถุประสงค์ / ผลลัพธ์ที่คาดหวัง</label>
      <textarea
        v-model="objective"
        placeholder="ระบุวัตถุประสงค์หรือผลลัพธ์ที่คาดหวัง"
      />

      <label>ก่อนปรับปรุงตามแผนงาน</label>
      <textarea
        v-model="beforeImprove"
        placeholder="อธิบายสภาพก่อนปรับปรุง"
      />

      <label>ผลที่คาดว่าจะได้รับหลังปรับปรุงตามแผน</label>
      <textarea
        v-model="expectedAfter"
        placeholder="ผลลัพธ์ที่คาดว่าจะเกิดขึ้นหลังดำเนินการ"
      />
    </div>

    <!-- ================= Section 2 ================= -->
    <div class="section">
      <h2>ผลการดำเนินงานจริง</h2>

      <label>การประเมินผลที่ได้รับ</label>
      <select v-model="evaluation">
        <option value="">-- เลือกผลการประเมิน --</option>
        <option value="pass">เป็นไปตามที่คาดหวัง</option>
        <option value="fail">ไม่เป็นไปตามที่คาดหวัง</option>
      </select>

      <label>ผลที่ได้รับหลังดำเนินงานจริง</label>
      <textarea
        v-model="actualResult"
        placeholder="อธิบายผลลัพธ์ที่เกิดขึ้นจริง"
      />

      <!-- แสดงเฉพาะกรณีไม่เป็นไปตามคาด -->
      <div v-if="evaluation === 'fail'" class="sub-section">
        <h3>ปัญหา / อุปสรรค</h3>
        <textarea
          v-model="problem"
          placeholder="ระบุปัญหาและอุปสรรคที่พบ"
        />
      </div>

      <label>ข้อเสนอแนะเพื่อการปรับปรุง / เปลี่ยนแปลงในอนาคต</label>
      <textarea
        v-model="suggestion"
        placeholder="แนวทางปรับปรุงในอนาคต"
      />
    </div>

    <button class="submit">บันทึกการประเมินผล</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

/* ---------- Header ---------- */
const scopeName = ref('')
const owner = ref('')
const projectStatus = ref('')

/* ---------- Section 1 ---------- */
const objective = ref('')
const beforeImprove = ref('')
const expectedAfter = ref('')

/* ---------- Section 2 ---------- */
const evaluation = ref('')
const actualResult = ref('')
const problem = ref('')
const suggestion = ref('')
</script>

<style scoped>
.page {
  max-width: 1000px;
  margin: 40px auto;
  padding: 32px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  font-family: 'Prompt', sans-serif;
}

h1 {
  font-size: 26px;
  color: #3f2a63;
  margin-bottom: 32px;
  border-left: 6px solid #7c3aed;
  padding-left: 14px;
}

.card {
  background: #f8f7ff;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 32px;
  border: 1px solid #ebe7ff;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.section {
  margin-bottom: 32px;
  padding: 24px;
  border-radius: 14px;
  background: #faf9ff;
  border: 1px solid #ece8ff;
}

.section h2 {
  font-size: 18px;
  color: #5b3aa4;
  margin-bottom: 16px;
}

.sub-section h3 {
  font-size: 15px;
  color: #6d28d9;
  margin-bottom: 8px;
}

label {
  font-weight: 500;
  display: block;
  margin-top: 16px;
  color: #3f2a63;
}

input,
textarea,
select {
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #d8cfff;
  font-size: 14px;
}

textarea {
  min-height: 90px;
  resize: vertical;
}

.repeat-box {
  background: #ffffff;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #eee;
  margin-bottom: 10px;
}

.add {
  margin-top: 8px;
  background: linear-gradient(135deg, #6d28d9, #a78bfa);
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
}

.remove {
  background: transparent;
  color: #dc2626;
  border: none;
  font-size: 12px;
  margin-top: 6px;
  cursor: pointer;
}

.submit {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  color: white;
  background: linear-gradient(135deg, #7c3aed, #c4b5fd);
}
</style>
