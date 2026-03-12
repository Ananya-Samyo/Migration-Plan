<template>
  <div class="dashboard">

    <header class="page-header">
      <div class="header-title">
        <h1>📊 Dashboard ติดตามงาน</h1>
        <p>ภาพรวมสถานะการดำเนินงานและ Gap Analysis</p>
      </div>

      <div class="header-actions">
        <div class="control-group date-dropdown" @click.stop="isOpen = !isOpen">
          <span class="icon" style="font-size: 1.2rem">🕒</span>
          <span class="label">
            {{
              {
                all: 'ทั้งหมด',
                today: 'วันนี้',
                yesterday: 'เมื่อวาน',
                week: 'สัปดาห์นี้',
                month: 'เดือนนี้',
                year: 'ปีนี้',
                custom: 'กำหนดเอง'
              }[dateMode] || 'กำหนดเอง'
            }}
          </span>
          <span class="arrow">▾</span>

          <ul v-if="isOpen" class="dropdown-menu">
            <li @click.stop="selectMode('all')">ทั้งหมด</li>
            <li @click.stop="selectMode('today')">วันนี้</li>
            <li @click.stop="selectMode('yesterday')">เมื่อวาน</li>
            <li @click.stop="selectMode('week')">สัปดาห์นี้</li>
            <li @click.stop="selectMode('month')">เดือนนี้</li>
            <li @click.stop="selectMode('year')">ปีนี้</li>
          </ul>

        </div>

        <div class="control-group date-picker" @click="openDate">
          <span class="icon" style="font-size: 1.2rem">📅</span>
          <span class="label">{{ buddhistDateText }}</span>
          <input ref="dateInput" type="date" v-model="selectedDate.start" class="hidden-input"
            @change="onManualDateChange" />
        </div>

      </div>
    </header>

    <section class="summary-grid">
      <SummaryCard title="ขอบเขตงานทั้งหมด" :value="total" type="primary" icon="📁" />
      <SummaryCard title="ปิด GAP เสร็จแล้ว" :value="closedCount" type="success" icon="✅" />
      <SummaryCard title="ยังไม่ปิด GAP" :value="openCount" type="warning" icon="📌" />
      <SummaryCard title="ไม่สามารถปิด GAP แต่ยอมรับได้" :value="acceptableCount" type="danger" icon="⚠️" />
    </section>

    <div class="overall-progress-bar">
      <div class="progress-label">
        ความคืบหน้าการดำเนินงานของระบบโดยรวม
        <span>{{ overallProgress }}%</span>
      </div>

      <div class="progress-track">
        <div class="progress-fill" :style="{
          width: overallProgress + '%',
          backgroundColor: overallProgressColor
        }" />
      </div>
    </div>

    <section class="content-layout">
      <div class="panel chart-area">
        <div class="panel-header">
          <h3>📈 สัดส่วนสถานะ</h3>
        </div>
        <div class="panel-body">
          <StatusChart :selectedDate="selectedDate" />
        </div>
      </div>

      <div class="right-column">
        <div class="panel table-area">
          <div class="panel-header">
            <h3>📋 รายการงานล่าสุด</h3>
            <span class="badge">{{ total }} รายการ</span>
          </div>
          <div class="panel-body scrollable">
            <TaskTable :tasks="tasks" />
          </div>
        </div>

        <div class="panel table-area">
          <div class="panel-body">
            <LineChart :selectedDate="selectedDate" />
          </div>
        </div>
      </div>
    </section>

    <div v-if="isExporting" class="export-loading">
      <div class="spinner"></div>
      <p>กำลังดาวน์โหลดไฟล์...</p>
    </div>

    <div class="pdf-export-container" ref="pdfTemplate">

      <div class="dtg-date-right">
        {{
          dateMode === 'all'
            ? `ข้อมูลอัปเดตล่าสุด ณ วันที่: ${currentExportDate}`
            : `ข้อมูล ณ วันที่: ${buddhistDateText}`
        }}
      </div>

      <div class="dtg-header">
        <h2>การรายงานในคณะ DTG</h2>
        <p class="agenda">วาระที่ 1 :</p>
        <p class="topic">รายงานผลการดำเนินงานตามขอบเขตงาน</p>
      </div>

      <div v-if="total > 0" class="dtg-content">

        <div class="dtg-col-left">
          <div class="section-title" style="font-weight: bold; margin-bottom: 10px;">1. ผลการดำเนินงานทุกขอบเขตงานในภาพรวม-รายขอบเขตงาน</div>
          <table class="dtg-table">
            <thead>
              <tr>
                <th style="width: 70%; text-align: center;">ปีที่ทำขอบเขตงาน</th>
                <th style="width: 30%;">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(task, index) in tasks" :key="index">
                <td>{{ task.title || `ขอบเขตงาน ${index + 1}` }}</td>
                <td style="text-align: center;">{{ task.year || '2568' }}</td>
                <td>
                  <div class="progress-wrapper">
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: (task.progress || 0) + '%' }"></div>
                    </div>
                    <span class="progress-text">{{ task.progress || 0 }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="dtg-col-right">
          <div class="section-title" style="font-weight: bold; margin-bottom: 10px;">2. ผลการปิด GAP รายขอบเขตงาน</div>

          <div style="width: 35%; padding-top: 10px;">
              <StatusChart :selectedDate="selectedDate" />
            </div>
          
          <div style="display: flex; gap: 15px; align-items: flex-start;">

            <div style="width: 65%;">
              <table class="dtg-table">
                <thead>
                  <tr>
                    <th style="width: 70%;">ขอบเขตงาน</th>
                    <th style="width: 30%; text-align: center;">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(task, index) in tasks" :key="'right-' + index">
                    <td>{{ task.title || task.name || `ขอบเขตงาน ${index + 1}` }}</td>
                    <td style="text-align: center;">
                      <span class="status-dot" :class="{
                        'green': task.status === 'closed',
                        'yellow': task.status === 'acceptable',
                        'red': task.status === 'open' || !task.status
                      }"></span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      <div v-else class="pdf-empty-state">
        <div style="font-size: 48px; margin-bottom: 15px;">📭</div>
        <h3>ไม่มีข้อมูลสำหรับช่วงเวลานี้</h3>
      </div>

      <div class="dtg-footer-container" v-if="total > 0" style="display: flex; justify-content: flex-end; margin-top: 30px;">
        <div class="dtg-legend-box" style="border: 1px solid #ccc; padding: 15px; border-radius: 4px; background: #fff; min-width: 220px;">
          <div class="legend-title" style="font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">สถานะ :</div>
          <div class="legend-items-vertical" style="display: flex; flex-direction: column; gap: 8px;">
            <div class="legend-item" style="display: flex; align-items: center; gap: 10px;"><span class="status-dot green"></span> ปิด GAP เสร็จแล้ว</div>
            <div class="legend-item" style="display: flex; align-items: center; gap: 10px;"><span class="status-dot yellow"></span> ไม่สามารถปิด GAP แต่ยอมรับได้</div>
            <div class="legend-item" style="display: flex; align-items: center; gap: 10px;"><span class="status-dot red"></span> ยังไม่ปิด GAP</div>
          </div>
        </div>
      </div>

    </div>

  </div>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import html2canvas from 'html2canvas'
import Swal from 'sweetalert2'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import '../../assets/Admin/css/Admin_Dashboard.css'

import { thaiFontBase64 } from '@/assets/fonts/thaiFont.js'

import SummaryCard from '@/components/SummaryCard.vue'
import TaskTable from '@/components/TaskTable.vue'
import StatusChart from '@/components/StatusChart.vue'
import LineChart from '@/components/LineChart.vue'

const API = import.meta.env.VITE_API_BASE_URL

/* ===============================
    STATE & DATE LOGIC
================================ */
const tasks = ref([])
const summary = ref({ total: 0, openCount: 0, closedCount: 0, acceptableCount: 0 })
const overallProgress = ref(0)

const pdfTemplate = ref(null)
const isExporting = ref(false)
const dateInput = ref(null)
const isOpen = ref(false)

const dateMode = ref('all')
const selectedDate = ref({ start: '', end: '' })

const formatDateISO = (d) => d.toISOString().slice(0, 10)

const currentExportDate = computed(() => {
  const d = new Date()
  return `${d.getDate()} ${d.toLocaleDateString('th-TH', { month: 'long' })} ${d.getFullYear() + 543}`
})

/* ===============================
    COMPUTED PROPERTIES
================================ */
const total = computed(() => summary.value.total)
const openCount = computed(() => summary.value.openCount)
const closedCount = computed(() => summary.value.closedCount)
const acceptableCount = computed(() => summary.value.acceptableCount)

const overallProgressColor = computed(() => {
  if (overallProgress.value < 50) return '#ef4444'
  if (overallProgress.value < 80) return '#6d28d9'
  return '#16a34a'
})

const buddhistDateText = computed(() => {
  if (dateMode.value === 'all' || !selectedDate.value.start) return 'ทั้งหมด'
  const formatTH = (dateStr) => {
    const d = new Date(dateStr)
    return `${d.getDate()} ${d.toLocaleDateString('th-TH', { month: 'long' })} ${d.getFullYear() + 543}`
  }
  return selectedDate.value.start === selectedDate.value.end
    ? formatTH(selectedDate.value.start)
    : `${formatTH(selectedDate.value.start)} - ${formatTH(selectedDate.value.end)}`
})

/* ===============================
    ฟังก์ชันคำนวณช่วงเวลา (Ranges)
================================ */
const setDateRange = (mode) => {
  const now = new Date()
  let start = ''
  let end = ''

  switch (mode) {
    case 'today':
      start = end = formatDateISO(now)
      break
    case 'yesterday':
      const yesterday = new Date()
      yesterday.setDate(now.getDate() - 1)
      start = end = formatDateISO(yesterday)
      break
    case 'week':
      const day = now.getDay() || 7
      const mon = new Date(now)
      mon.setDate(now.getDate() - day + 1)
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      start = formatDateISO(mon)
      end = formatDateISO(sun)
      break
    case 'month':
      start = formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1))
      end = formatDateISO(new Date(now.getFullYear(), now.getMonth() + 1, 0))
      break
    case 'year':
      start = formatDateISO(new Date(now.getFullYear(), 0, 1))
      end = formatDateISO(new Date(now.getFullYear(), 11, 31))
      break
    case 'all':
    default:
      start = ''
      end = ''
      break
  }
  selectedDate.value = { start, end }
}

/* ===============================
    FETCH DATA
================================ */
const fetchDashboard = async () => {
  const token = localStorage.getItem('token')
  if (!token) return

  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }

  try {
    const query = `?startDate=${selectedDate.value.start}&endDate=${selectedDate.value.end}`

    const [summaryRes, tasksRes, progressRes] = await Promise.all([
      fetch(`${API}/api/admin/dashboard/gap-summary${query}`, { headers }),
      fetch(`${API}/api/admin/dashboard/tasks${query}`, { headers }),
      fetch(`${API}/api/admin/dashboard/overall-progress${query}`, { headers })
    ])

    const summaryData = await summaryRes.json()
    const tasksData = await tasksRes.json()
    const progressData = await progressRes.json()

    summary.value = {
      total: summaryData.total || 0,
      openCount: summaryData.open_gap || 0,
      closedCount: summaryData.closed_gap || 0,
      acceptableCount: summaryData.accepted_gap || 0
    }
    tasks.value = tasksData
    overallProgress.value = progressData.progress || 0

  } catch (err) {
    console.error('❌ Fetch Dashboard Error:', err)
  }
}

/* ===============================
    EXPORT PDF LOGIC (DTG FORMAL)
================================ */
const openExportSettings = () => {
  if (tasks.value.length === 0) {
    Swal.fire('ไม่พบข้อมูล', 'กรุณารอให้ข้อมูลโหลดเสร็จก่อน', 'warning');
    return;
  }
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  Swal.fire({
    title: 'เลือกขอบเขตงานที่ต้องการรายงาน',
    returnFocus: false,
    html: `
      <div style="margin-bottom: 15px;">
        <input type="text" id="swal-search-task" placeholder="🔍 ค้นหาขอบเขตงาน..." 
          style="width: 100%; padding: 10px 15px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box;"
        >
      </div>

      <div id="task-selector" style="text-align: left; max-height: 400px; overflow-y: auto; padding: 15px; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc;">
        ${tasks.value.map(task => `
          <div class="task-row" data-title="${(task.title || '').toLowerCase()}" 
               style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 12px; padding: 8px; background: white; border-radius: 6px; border: 1px solid #f1f5f9;">
            <input type="checkbox" id="task-${task.id}" value="${task.id}" class="task-cb" checked style="width: 20px; height: 20px; cursor: pointer;">
            <label for="task-${task.id}" style="cursor: pointer; font-size: 14px; color: #1e293b;">${task.title}</label>
          </div>
        `).join('')}
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'สร้างรายงาน PDF',
    didOpen: () => {
      const searchInput = document.getElementById('swal-search-task');
      const taskRows = document.querySelectorAll('.task-row');

      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        taskRows.forEach(row => {
          const title = row.getAttribute('data-title');
          if (title.includes(searchTerm)) {
            row.style.display = 'flex';
          } else {
            row.style.display = 'none';
          }
        });
      });
    },
    preConfirm: () => {
      const checkboxes = document.querySelectorAll('.task-cb:checked');
      if (checkboxes.length === 0) {
        Swal.showValidationMessage('กรุณาเลือกอย่างน้อย 1 รายการ');
        return false;
      }
      return Array.from(checkboxes).map(cb => cb.value);
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const filteredTasks = tasks.value.filter(t => result.value.includes(t.id.toString()));
      generateDTGReport(filteredTasks);
    }
  });
}

const generateDTGReport = async (selectedTasks) => {
  isExporting.value = true;
  const doc = new jsPDF('l', 'mm', 'a4');

  try {

    const fontName = 'Sarabun-Regular.ttf';
    doc.addFileToVFS(fontName, thaiFontBase64);
    doc.addFont(fontName, 'Sarabun', 'normal');
    doc.addFont(fontName, 'Sarabun', 'bold');
    doc.setFont('Sarabun');

    let chartImage = null;
    try {
      const chartCanvas = document.querySelector('.chart-area canvas');
      if (chartCanvas) {
        chartImage = chartCanvas.toDataURL('image/png');
      } else {
        const chartDOM = document.querySelector('.chart-area .panel-body');
        if (chartDOM) {
          const canvasObj = await html2canvas(chartDOM, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
          chartImage = canvasObj.toDataURL('image/png');
        }
      }
    } catch (err) {
      console.warn('ข้ามการดึงรูปภาพ:', err);
    }

    doc.setFontSize(10);
    const dateTitle = dateMode.value === 'all'
      ? `ข้อมูลอัปเดตล่าสุด ณ วันที่: ${currentExportDate.value}`
      : `ข้อมูล ณ วันที่: ${buddhistDateText.value}`;
    doc.text(dateTitle, 285, 15, { align: 'right' });

    doc.setFontSize(22);
    doc.text('การรายงานในคณะ DTG', 15, 25);
    doc.setFontSize(16);
    doc.text('วาระที่ 1 :', 15, 35);
    doc.setFontSize(14);
    doc.text('รายงานผลการดำเนินงานตามขอบเขตงาน', 15, 42);

    // ตารางฝั่งซ้าย 
    autoTable(doc, {
      startY: 50,
      margin: { left: 15, right: 155 },
      head: [['ชื่อขอบเขตงาน', 'ปีที่ทำ', 'สถานะ (%)']],
      body: selectedTasks.map(t => [t.title || t.name || 'ไม่ระบุ', t.year || '2568', `${t.progress || 0}%`]),
      styles: { font: 'Sarabun', fontStyle: 'normal', fontSize: 10, cellPadding: 3 }, 
      headStyles: {
        fillColor: [79, 70, 229],
        halign: 'center'
      },
      columnStyles: {
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 25 }
      }
    });

    // ตารางฝั่งขวา 
    autoTable(doc, {
      startY: 50,
      margin: { left: 155, right: 15 },
      head: [['กราฟสัดส่วน', 'ชื่อขอบเขตงาน', 'สถานะ GAP']],
      body: selectedTasks.map(t => ['', t.title || t.name || 'ไม่ระบุ', '']),
      styles: { font: 'Sarabun', fontStyle: 'normal', fontSize: 10, cellPadding: 3 }, // <--- ย้าย fontStyle มาที่นี่
      headStyles: {
        fillColor: [109, 40, 217],
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 40 },
        2: { halign: 'center', cellWidth: 30 }
      },
      didDrawCell: (data) => {
        if (data.column.index === 2 && data.cell.section === 'body') {
          const task = selectedTasks[data.row.index];
          let dotColor = [239, 68, 68];
          if (task.status === 'closed') dotColor = [22, 163, 74];
          else if (task.status === 'acceptable') dotColor = [234, 179, 8];

          doc.setFillColor(...dotColor);
          doc.circle(data.cell.x + 15, data.cell.y + (data.cell.height / 2), 2, 'F');
        }
      }
    });

    // แปะรูปกราฟ
    if (chartImage) {
      doc.addImage(chartImage, 'PNG', 158, 60, 35, 35);
    }

    const finalY = 185;
    const startX = 210;

    doc.setFontSize(11);
    doc.text('สถานะ :', startX, finalY);

    const legends = [
      { color: [22, 163, 74], text: 'ปิด GAP เสร็จแล้ว' },
      { color: [234, 179, 8], text: 'ไม่สามารถปิด GAP แต่ยอมรับได้' },
      { color: [239, 68, 68], text: 'ยังไม่ปิด GAP' }
    ];

    legends.forEach((item, i) => {
      doc.setFillColor(...item.color);
      doc.circle(startX + 5, finalY + 8 + (i * 7), 2, 'F');
      doc.text(item.text, startX + 10, finalY + 10 + (i * 7));
    });
    doc.save(`DTG_Formal_Report_${new Date().getTime()}.pdf`);
    Swal.fire({ title: 'สำเร็จ!', text: 'ดาวน์โหลดรายงาน PDF เรียบร้อยแล้ว', icon: 'success', timer: 2000 });

  } catch (error) {
    console.error('❌ Export Error:', error);
    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างไฟล์ PDF ได้', 'error');
  } finally {
    isExporting.value = false;
  }
}

/* ===============================
    UI EVENTS
================================ */
const selectMode = (mode) => {
  dateMode.value = mode
  setDateRange(mode)
  isOpen.value = false
  fetchDashboard()
}

const onManualDateChange = () => {
  dateMode.value = 'custom'
  selectedDate.value.end = selectedDate.value.start
  fetchDashboard()
}

const openDate = () => {
  dateInput.value?.showPicker()
}

onMounted(() => {
  setDateRange('all')
  fetchDashboard()
  window.addEventListener('click', () => { isOpen.value = false })
})
</script>