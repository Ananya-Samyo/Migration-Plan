<template>
  <div class="main-container">
    <header class="top-bar">
      <div class="left-head">
        <h1 class="page-title">การประเมินผลประโยชน์</h1>
      </div>

      <button class="btn-back-modern" @click="$emit('back')">
        <div class="icon-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd"
              d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
          </svg>
        </div>
        <span class="text">ย้อนกลับ</span>
      </button>
    </header>

    <div class="content-wrapper">
      <div class="card header-card">
        <div class="grid-3">
          <div class="form-group">
            <label>ชื่อขอบเขตงาน (Scope)</label>
            <input v-model="evaluation.scopeName" readonly class="input-readonly" />
          </div>

          <div class="form-group">
            <label>ผู้รับผิดชอบโครงการ</label>
            <input v-model="evaluation.owner" readonly class="input-readonly" />
          </div>

          <div class="form-group">
            <label>สถานะแผนงานในปัจจุบัน</label>
            <select v-model="evaluation.projectStatus">
              <option value="processing">อยู่ระหว่างการประเมินผลขอบเขตงาน</option>
              <option value="finish">เสร็จสิ้นขอบเขตงาน</option>
            </select>
          </div>
        </div>
      </div>

      <section class="card">
        <div class="card-header flex-between">
          <h3>🎯 ผลที่คาดว่าจะได้รับจากการทำ Low Level</h3>
          <button type="button" class="btn-purple-sm" @click="addItem">+ เพิ่มรายการ</button>
        </div>

        <div class="card-body">
          <div v-for="(item, index) in evaluation.items" :key="index" class="evaluation-item-card">
            <div class="item-header">
              <span class="item-number">รายการที่ {{ index + 1 }}</span>
              <button v-if="evaluation.items.length > 1" @click="removeItem(index)"
                class="btn-text-del">ลบรายการนี้</button>
            </div>

            <div class="form-group">
              <label>วัตถุประสงค์ / ผลลัพธ์ที่คาดหวัง</label>
              <textarea v-model="item.objective" placeholder="ระบุวัตถุประสงค์หลักของหัวข้อนี้..." rows="2" />
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label>ก่อนปรับปรุงตามแผนงาน</label>
                <textarea v-model="item.beforeImprove" placeholder="รายละเอียดสถานะเดิม..." rows="2" />
              </div>
              <div class="form-group">
                <label>ผลที่คาดว่าจะได้รับหลังปรับปรุงแผนงาน</label>
                <textarea v-model="item.expectedAfter" placeholder="รายละเอียดผลที่อยากให้เกิด..." rows="2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="bottom-actions">
        <button class="btn-save-gradient" @click="saveEvaluation">
          <span class="btn-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path
                d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
            </svg>
            บันทึกข้อมูลและจบกระบวนการ
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import Swal from 'sweetalert2'
import '../../assets/Admin/css/Admin_Evaluation.css'
import '../../assets/Admin/css/Admin_UnifiedStyle.css'

// ดึง props และประกาศ emit ไว้บนสุด (สำคัญมาก)
const props = defineProps(['modelValue', 'masterData', 'projectId'])
const emit = defineEmits(['back', 'complete', 'update:modelValue'])

const evaluation = ref(props.modelValue && props.modelValue.items ? props.modelValue : {
  scopeName: props.masterData?.step1?.scopeName || '',
  owner: props.masterData?.step1?.projects?.[0]?.coordinator?.name || '',
  projectStatus: 'processing',
  items: [{ objective: '', beforeImprove: '', expectedAfter: '' }],
  evaluation: '',
  actualResult: '',
  problem: '',
  suggestion: '',
  isAlreadySaved: false
})

const addItem = () => {
  evaluation.value.items.push({ objective: '', beforeImprove: '', expectedAfter: '' })
}

const removeItem = (index) => {
  if (evaluation.value.items.length > 1) {
    evaluation.value.items.splice(index, 1)
  }
}

watch(evaluation, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

const validateFiles = (files) => {
  const maxSize = 5 * 1024 * 1024;
  const forbiddenExts = ['.exe', '.bat', '.sh', '.msi', '.php', '.js'];
  for (let file of files) {
    if (file.size > maxSize) return { valid: false, msg: `ไฟล์ ${file.name} มีขนาดเกิน 5MB` };
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (forbiddenExts.includes(ext)) return { valid: false, msg: `ไฟล์ ${file.name} ไม่ปลอดภัย` };
  }
  return { valid: true };
}

onMounted(() => {
  console.log("Project ID ใน การประเมินผลประโยชน์:", props.projectId);
  console.log("ข้อมูลแผนงาน ใน การประเมินผลประโยชน์:", props.masterData?.step1);
});

// ฟังก์ชันสำหรับกำหนดสไตล์ร่วมกันของ Swal
const swalConfig = {
  confirmButtonColor: '#4b2e83',
  cancelButtonColor: '#333333',
  customClass: {
    popup: 'modern-swal-popup',
    confirmButton: 'modern-confirm-btn',
    cancelButton: 'modern-cancel-btn'
  },
  buttonsStyling: true,
  showCancelButton: true,
  cancelButtonText: 'ยกเลิก'
}

// --- ฟังก์ชันบันทึกข้อมูลหลัก (ทำหน้าที่รวบรวมข้อมูลทั้งหมดส่ง Database) ---
const saveEvaluation = async () => {
  const s1 = props.masterData?.step1 || {};
  const s2 = props.masterData?.step2 || {};
  const s3 = {
    ...evaluation.value,
    projectStatus: evaluation.value.projectStatus === 'finish' ? 'finish' : 'processing',

    // เช็คเจาะจงไปเลย ป้องกันกรณีติดค่า null หรือ undefined
    evaluation: evaluation.value.evaluation === 'pass' ? 'pass' :
      evaluation.value.evaluation === 'fail' ? 'fail' : ''
  };

  console.log("เช็คข้อมูลก่อน Save Step 3:", s2.projects);

  // 1. ตรวจสอบข้อมูลหาย
  let missingFields = [];
  if (!s1.scopeName) missingFields.push("ชื่อขอบเขตงาน (Step 1)");

  // 2. ถ้ามีข้อมูลหาย และยังไม่เคยบันทึกสำเร็จมาก่อน
  if (missingFields.length > 0 && !s3.isAlreadySaved) {
    const checkData = await Swal.fire({
      ...swalConfig,
      title: 'ข้อมูลไม่สมบูรณ์',
      html: `
        <div style="text-align: left;">
          <p>ระบบตรวจพบว่าข้อมูลต่อไปนี้หายไป:</p>
          <ul style="color: #d9534f; font-weight: bold;">
            ${missingFields.map(field => `<li>${field}</li>`).join('')}
          </ul>
          <p>คุณต้องการดำเนินการต่อโดยใช้ข้อมูลเท่าที่มี หรือต้องการย้อนกลับไปแก้ไข?</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ดำเนินการต่อ',
      cancelButtonText: 'ย้อนกลับไปตรวจสอบ',
      confirmButtonColor: '#d4af37',
    });

    if (!checkData.isConfirmed) return;
  }

  const isEditMode = s3.isAlreadySaved;

  // 2. Popup สรุปข้อมูล (Summary Preview)
  const getStatusLabel = (status) => {
    if (status === 'complete_gap') return 'เสร็จสิ้น';
    if (status === 'acceptable_gap') return 'ยอมรับได้';
    return 'กำลังดำเนินการ';
  };

  const gapsHtml = (s2.projects && s2.projects.length > 0)
    ? s2.projects.map((p, pIdx) => `
        <div style="margin-bottom:8px;">
          <b>แผนงานที่ ${pIdx + 1}:</b>
          <ul style="margin:0;">
            ${p.gaps.map(g => `<li>${g.detail || '-'} (${g.weight}%)</li>`).join('')}
          </ul>
        </div>
      `).join('')
    : '<li>- ไม่มีข้อมูล GAP -</li>';

  const issuesHtml = (s2.projects?.[0]?.issues && s2.projects[0].issues.length > 0)
    ? s2.projects[0].issues.map(iss => `<li style="margin-bottom: 8px;"><b>ปัญหา:</b> ${iss.problem || '-'}<br/><b>แนวทางแก้ไข:</b> ${iss.solution || '-'}</li>`).join('')
    : '<li>- ไม่มีข้อมูลปัญหาและอุปสรรค -</li>';

  const { isConfirmed } = await Swal.fire({
    ...swalConfig,
    title: isEditMode ? 'ตรวจสอบการแก้ไขข้อมูล' : 'สรุปข้อมูลและผลการดำเนินการโครงการ',
    width: '850px',
    confirmButtonText: 'ยืนยันข้อมูลถูกต้อง',
    cancelButtonText: 'กลับไปแก้ไข',
    html: `
      <div style="text-align: left; font-family: 'Sarabun', sans-serif; padding: 5px; font-size: 15px; color: #333;">
        <p style="text-align: center; font-weight: bold; margin-bottom: 200px; color: #1e293b;">
          กรุณาตรวจสอบความถูกต้องของข้อมูล ก่อนยืนยันการบันทึกเข้าสู่ระบบ
        </p>
        
        <div style="display: grid; gap: 15px;">
          <div style="border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; background: #f8fafc;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #4b2e83; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
              ส่วนที่ ๑: ข้อมูลทั่วไปของแผนงาน
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="width: 160px; padding: 4px 0;"><b>ชื่อขอบเขตงาน:</b></td><td>${s1.scopeName || '-'}</td></tr>
              <tr><td style="padding: 4px 0;"><b>แผนงาน/โครงการ:</b></td><td>${s1.projects?.[0]?.projectName || '-'}</td></tr>
              <tr><td style="padding: 4px 0;"><b>ผู้ประสานงานหลัก:</b></td><td>${s1.projects?.[0]?.coordinator?.name || '-'}</td></tr>
            </table>
          </div>

          <div style="border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; background: #f8fafc;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #b45309; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
              ส่วนที่ ๒: ความก้าวหน้าและวิเคราะห์ช่องว่าง
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
              <tr>
                <td style="width: 160px; padding: 4px 0;"><b>ระยะเวลาดำเนินการ:</b></td>
                <td>${s2.projects?.[0]?.startDate || '-'} ถึง ${s2.projects?.[0]?.endDate || '-'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><b>ความคืบหน้าภาพรวม:</b></td>
                <td><b>${s2.projects?.[0]?.progress || 0}%</b></td>
              </tr>
            </table>
            <div style="margin-bottom: 5px; font-weight: bold;">รายการวิเคราะห์ช่องว่าง (GAP):</div>
            <ul style="margin: 0 0 15px 20px; padding: 0;">${gapsHtml}</ul>
            <div style="margin-bottom: 5px; font-weight: bold;">ปัญหาอุปสรรคและแนวทางแก้ไข:</div>
            <ul style="margin: 0 0 0 20px; padding: 0;">${issuesHtml}</ul>
          </div>

          <div style="border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; background: #f8fafc;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #16a34a; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
              ส่วนที่ ๓: การประเมินผลลัพธ์
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="width: 160px; padding: 4px 0;"><b>สถานะโครงการ:</b></td><td>${s3.projectStatus === 'finish' ? 'เสร็จสิ้นการดำเนินงาน' : 'อยู่ระหว่างดำเนินการ'}</td></tr>
              <tr><td style="padding: 4px 0;"><b>ผลการประเมิน:</b></td><td>${s3.evaluation === 'pass' ? 'บรรลุเป้าหมาย' :
        s3.evaluation === 'fail' ? 'ไม่บรรลุเป้าหมาย' :
          'ยังไม่บรรลุเป้าหมาย (กำลังดำเนินการ)'
      }</td></tr>
              <tr><td style="padding: 4px 0; vertical-align: top;"><b>ผลที่ได้รับจริง:</b></td><td style="white-space: pre-wrap; background: #fff; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px;">${s3.actualResult || '-'}</td></tr>
            </table>
          </div>
        </div>
      </div>
    `
  });

  if (!isConfirmed) return;

  // 3. Popup ระบุเหตุผลและแนบไฟล์
  const { value: finalData } = await Swal.fire({
    ...swalConfig,
    title: isEditMode ? 'ระบุเหตุผลการแก้ไข' : 'บันทึกและส่งอีเมล',
    confirmButtonText: 'บันทึกข้อมูลสำเร็จ',
    html: `
      <div style="text-align: left; font-family: 'Sarabun', sans-serif;">
        <label style="font-weight: 600; display: block; margin-bottom: 8px; color: #334155;">
          ${isEditMode ? 'เหตุผลที่ขอแก้ไขข้อมูล *' : 'หมายเหตุเพิ่มเติม (ถ้ามี)'}
        </label>
        <textarea id="swal-reason" class="swal2-textarea" 
          style="width: 100%; margin: 0; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 14px;" 
          placeholder="กรุณาระบุรายละเอียด..." rows="3"></textarea>
        
        <label style="font-weight: 600; display: block; margin: 15px 0 8px 0; color: #334155;">แนบหลักฐานประกอบ (จำกัด 5MB)</label>
        <input id="swal-files" type="file" class="swal2-file" 
          style="width: 100%; margin: 0; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px;" multiple />
      </div>
    `,
    preConfirm: () => {
      const reason = document.getElementById('swal-reason').value;
      const files = document.getElementById('swal-files').files;
      if (isEditMode && !reason) return Swal.showValidationMessage('กรุณาระบุเหตุผลในการแก้ไขข้อมูล');
      const check = validateFiles(files);
      if (!check.valid) return Swal.showValidationMessage(check.msg);
      return { reason, files };
    }
  });

  if (!finalData) return;

  // 4. แสดง Loading
  Swal.fire({
    title: 'กำลังบันทึกข้อมูล...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  // 🚩 จุดที่แก้ไข: ดึงค่า ID ที่ถูกต้อง และสร้าง FormData เพียงชุดเดียว
  const actualProjectId = props.projectId || s1.id || s1.scope_id || props.masterData?.projectId;

  console.log("🔍 ตรวจสอบ ID ก่อนส่งไป Backend:", actualProjectId);

  if (!actualProjectId || actualProjectId === 'undefined' || actualProjectId === 'null') {
    return Swal.fire({
      icon: 'error',
      title: 'ไม่พบ ID โครงการ',
      text: 'ระบบไม่พบรหัสโครงการหลัก กรุณาย้อนกลับไปหน้าแรกแล้วกดถัดไปใหม่อีกครั้ง'
    });
  }

  try {
    const fd = new FormData(); // สร้าง FormData ครั้งเดียว

    // ใช้ค่า actualProjectId ที่ตรวจสอบแล้ว
    fd.append('projectId', actualProjectId);

    console.log("Data in Step 3 before saving:", s2.projects);

    // Append ข้อมูลทั้งหมดลงใน fd 
    fd.append('step1', JSON.stringify(s1));
    fd.append('step2', JSON.stringify(s2));
    fd.append('step3', JSON.stringify(s3));
    fd.append('edit_reason', finalData.reason || '');
    fd.append('mode', isEditMode ? 'edit' : 'first_save');

    // แนบไฟล์
    if (finalData.files) {
      Array.from(finalData.files).forEach(f => fd.append('attachments', f));
    }

    // ✅ ส่งข้อมูลไปยัง API
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/complete-workflow`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: fd
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }

    // เมื่อบันทึกสำเร็จ
    evaluation.value.isAlreadySaved = true;
    await Swal.fire({
      title: 'บันทึกสำเร็จ!',
      text: 'ระบบได้บันทึกข้อมูลโครงการครบถ้วนเรียบร้อยแล้ว',
      icon: 'success',
      confirmButtonColor: '#4b2e83',
      confirmButtonText: 'ตกลง'
    });

    emit('complete');

  } catch (err) {
    Swal.fire({
      title: 'เกิดข้อผิดพลาด',
      text: err.message,
      icon: 'error',
      confirmButtonColor: '#ef4444'
    });
  }
}
</script>