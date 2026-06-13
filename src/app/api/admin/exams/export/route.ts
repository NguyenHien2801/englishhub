// app/api/admin/exams/export/route.ts
// POST body: { sessions: Session[], students?: Student[] }

import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

// ── Colors ─────────────────────────────────────────────────────────────
const NAVY       = '0F2847'
const NAVY2      = '1E3A5F'
const NAVY_TEXT  = 'E2E8F0'
const WHITE      = 'FFFFFF'
const LIGHT_ROW  = 'F1F5F9'
const BORDER_C   = '94A3B8'
const KPI_BORDER = 'CBD5E1'
const VSTEP_BG   = 'D1FAE5'; const VSTEP_FG = '065F46'
const TOEIC_BG   = 'FEF3C7'; const TOEIC_FG = '92400E'
const APTIS_BG   = 'EDE9FE'; const APTIS_FG = '5B21B6'
const PASS_BG    = 'D1FAE5'; const PASS_FG  = '065F46'
const WARN_BG    = 'FEF3C7'; const WARN_FG  = '92400E'
const FAIL_BG    = 'FEE2E2'; const FAIL_FG  = '991B1B'

type Session = Record<string, unknown>
type Student = Record<string, unknown>

const CERT_STYLE: Record<string, { bg: string; fg: string }> = {
  VSTEP:  { bg: VSTEP_BG,  fg: VSTEP_FG  },
  TOEIC:  { bg: TOEIC_BG,  fg: TOEIC_FG  },
  APTIS:  { bg: APTIS_BG,  fg: APTIS_FG  },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function scoreColor(pct: number) {
  if (pct >= 70) return { bg: PASS_BG, fg: PASS_FG }
  if (pct >= 50) return { bg: WARN_BG, fg: WARN_FG }
  return { bg: FAIL_BG, fg: FAIL_FG }
}

// Shared style helpers
function applyHeaderRow(row: ExcelJS.Row, bg = NAVY2) {
  row.height = 26
  row.eachCell((cell) => {
    cell.font      = { name: 'DM Sans', bold: true, size: 10, color: { argb: 'FF' + NAVY_TEXT } }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border    = border()
  })
}

function border(): Partial<ExcelJS.Borders> {
  const s = { style: 'thin' as const, color: { argb: 'FF' + BORDER_C } }
  return { top: s, bottom: s, left: s, right: s }
}

function kpiBorder(): Partial<ExcelJS.Borders> {
  const s = { style: 'medium' as const, color: { argb: 'FF' + KPI_BORDER } }
  return { top: s, bottom: s, left: s, right: s }
}

function titleBanner(ws: ExcelJS.Worksheet, text: string, startCol: string, endCol: string, height = 50) {
  ws.mergeCells(`${startCol}1:${endCol}3`)
  const cell = ws.getCell(`${startCol}1`)
  cell.value     = text
  cell.font      = { name: 'DM Sans', bold: true, size: 18, color: { argb: 'FF' + WHITE } }
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + NAVY } }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 10
  ws.getRow(2).height = height
  ws.getRow(3).height = 10
}

// ── Fetch chart image from QuickChart ────────────────────────────────────
async function fetchChartImage(config: Record<string, unknown>): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch('https://quickchart.io/chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chart: config,
        width: 600,
        height: 360,
        format: 'png',
        backgroundColor: 'white',
      }),
    })
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { sessions, students = [] }: { sessions: Session[]; students?: Student[] } = await req.json()

  // ── Group by student ──────────────────────────────────────────────
  const groupMap = new Map<string, { mssv: string; ho_ten: string; lop: string; khoa: string; sessions: Session[] }>()
  for (const s of sessions) {
    const u = (s.NguoiDung as Record<string, string> | null) ?? {}
    const mssv = u.ma_sinh_vien || 'unknown'
    if (!groupMap.has(mssv)) groupMap.set(mssv, { mssv, ho_ten: u.ho_ten || '–', lop: u.lop || '–', khoa: u.khoa || '–', sessions: [] })
    groupMap.get(mssv)!.sessions.push(s)
  }
  const grouped = Array.from(groupMap.values())

  // ── Cert stats ────────────────────────────────────────────────────
  const certStats = (['VSTEP', 'TOEIC', 'APTIS'] as const).map((cert) => {
    const lst = sessions.filter((s) => s.loai_chung_chi === cert)
    const ws  = lst.filter((s) => s.tong_so_cau)
    const avg = ws.length ? Math.round(ws.reduce((a, s) => a + (s.so_cau_dung as number) / (s.tong_so_cau as number) * 100, 0) / ws.length) : 0
    const pass = ws.filter((s) => (s.so_cau_dung as number) / (s.tong_so_cau as number) >= 0.7).length
    const rate = ws.length ? Math.round((pass / ws.length) * 100) : 0
    const sv   = new Set(lst.map((s) => ((s.NguoiDung as Record<string, string> | null) ?? {}).ma_sinh_vien)).size
    return { cert, count: lst.length, avg, pass, rate, sv }
  })

  // ── Global stats ──────────────────────────────────────────────────
  const totalS = sessions.length
  const uniqSv = grouped.length
  const totalP = sessions.filter((s) => s.tong_so_cau && (s.so_cau_dung as number) / (s.tong_so_cau as number) >= 0.7).length
  const wsF    = sessions.filter((s) => s.tong_so_cau)
  const avgAll = wsF.length ? Math.round(wsF.reduce((a, s) => a + (s.so_cau_dung as number) / (s.tong_so_cau as number) * 100, 0) / wsF.length) : 0

  // ── Charts ──────────────────────────────────────────────────────────
  const certLabels = certStats.map((c) => c.cert)

  const barChartConfig = {
    type: 'bar',
    data: {
      labels: certLabels,
      datasets: [
        {
          label: 'Lượt thi',
          data: certStats.map((c) => c.count),
          backgroundColor: '#1E3A5F',
        },
        {
          label: 'Đạt ≥70%',
          data: certStats.map((c) => c.pass),
          backgroundColor: '#10B981',
        },
      ],
    },
    options: {
      plugins: {
        title: { display: true, text: 'Lượt thi & số lượt đạt theo chứng chỉ', font: { size: 16 } },
        legend: { position: 'bottom' },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  }

  const pieChartConfig = {
    type: 'doughnut',
    data: {
      labels: ['Đạt (≥70%)', 'Chưa đạt (<70%)'],
      datasets: [
        {
          data: [totalP, Math.max(wsF.length - totalP, 0)],
          backgroundColor: ['#10B981', '#EF4444'],
        },
      ],
    },
    options: {
      plugins: {
        title: { display: true, text: 'Tỉ lệ đạt / chưa đạt (toàn bộ)', font: { size: 16 } },
        legend: { position: 'bottom' },
      },
    },
  }

  const [barImg, pieImg] = await Promise.all([
    fetchChartImage(barChartConfig),
    fetchChartImage(pieChartConfig),
  ])

  // ── Workbook ──────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  wb.creator  = 'EnglishHub Admin'
  wb.created  = new Date()
  wb.modified = new Date()

  // ══════════════════════════════════════════════════════════════════
  // Sheet 1: Tổng quan
  // ══════════════════════════════════════════════════════════════════
  const s1 = wb.addWorksheet('📊 Tổng quan', { views: [{ showGridLines: false }] })
  s1.getColumn('A').width = 3
  ;['B','C','D','E','F','G','H','I'].forEach((col, i) => {
    s1.getColumn(col).width = [24,14,14,14,14,14,14,14][i]
  })

  // Title
  titleBanner(s1, 'BÁO CÁO KẾT QUẢ THI — EnglishHub', 'B', 'I')

  // KPI cards  (row 5-7)
  const kpis = [
    { label: 'Tổng phiên thi',     value: totalS,      color: NAVY,   colStart: 'B', colEnd: 'C' },
    { label: 'Sinh viên tham gia', value: uniqSv,      color: '2563EB', colStart: 'D', colEnd: 'E' },
    { label: 'Đạt (≥ 70%)',        value: totalP,      color: '059669', colStart: 'F', colEnd: 'G' },
    { label: 'Điểm trung bình',    value: `${avgAll}%`, color: 'D97706', colStart: 'H', colEnd: 'I' },
  ]
  s1.getRow(4).height = 8
  for (const kpi of kpis) {
    s1.mergeCells(`${kpi.colStart}5:${kpi.colEnd}6`)
    s1.mergeCells(`${kpi.colStart}7:${kpi.colEnd}7`)
    const valCell = s1.getCell(`${kpi.colStart}5`)
    valCell.value     = kpi.value
    valCell.font      = { name: 'DM Sans', bold: true, size: 22, color: { argb: 'FF' + kpi.color } }
    valCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
    valCell.alignment = { horizontal: 'center', vertical: 'middle' }
    valCell.border    = kpiBorder()
    const lblCell = s1.getCell(`${kpi.colStart}7`)
    lblCell.value     = kpi.label
    lblCell.font      = { name: 'DM Sans', bold: true, size: 10, color: { argb: 'FF64748B' } }
    lblCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
    lblCell.alignment = { horizontal: 'center', vertical: 'middle' }
    lblCell.border    = kpiBorder()
    // apply border to every cell in the merged ranges so it shows fully
    for (const range of [`${kpi.colStart}5:${kpi.colEnd}6`, `${kpi.colStart}7:${kpi.colEnd}7`]) {
      const [start, end] = range.split(':')
      const startCol = start.replace(/[0-9]/g, '')
      const endCol = end.replace(/[0-9]/g, '')
      const startRow = parseInt(start.replace(/[A-Z]/g, ''), 10)
      const endRow = parseInt(end.replace(/[A-Z]/g, ''), 10)
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol.charCodeAt(0); c <= endCol.charCodeAt(0); c++) {
          s1.getCell(`${String.fromCharCode(c)}${r}`).border = kpiBorder()
        }
      }
    }
  }
  s1.getRow(5).height = 26
  s1.getRow(6).height = 16
  s1.getRow(7).height = 22
  s1.getRow(8).height = 10

  // Cert table header
  s1.mergeCells('B9:I9')
  const certTitle = s1.getCell('B9')
  certTitle.value     = 'THỐNG KÊ THEO CHỨNG CHỈ'
  certTitle.font      = { name: 'DM Sans', bold: true, size: 11, color: { argb: 'FF' + WHITE } }
  certTitle.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + NAVY } }
  certTitle.alignment = { horizontal: 'center', vertical: 'middle' }
  s1.getRow(9).height = 24

  const certHdrs = ['Chứng chỉ', 'Lượt thi', 'Sinh viên', 'Điểm TB (%)', 'Đạt ≥70%', 'Tỉ lệ đạt', 'Độ khó', '']
  const r10 = s1.getRow(10)
  certHdrs.forEach((h, i) => { r10.getCell(i + 2).value = h })
  applyHeaderRow(r10, NAVY2)

  certStats.forEach(({ cert, count, avg, pass, rate, sv }, ri) => {
    const row = s1.getRow(11 + ri)
    row.height = 24
    const { bg, fg } = CERT_STYLE[cert] ?? { bg: LIGHT_ROW, fg: NAVY }
    const diff      = avg >= 70 ? 'Dễ' : avg >= 50 ? 'Trung bình' : 'Khó'
    const diffColor = scoreColor(avg)
    const rowBg     = ri % 2 === 0 ? WHITE : LIGHT_ROW
    const vals: ExcelJS.CellValue[] = [cert, count, sv, `${avg}%`, pass, `${rate}%`, diff, '']
    vals.forEach((v, ci) => {
      const cell = row.getCell(ci + 2)
      cell.value     = v
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border    = border()
      if (ci === 0) {
        cell.font = { name: 'DM Sans', bold: true, size: 10, color: { argb: 'FF' + fg } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } }
      } else if (ci === 6) {
        cell.font = { name: 'DM Sans', bold: true, size: 10, color: { argb: 'FF' + diffColor.fg } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + diffColor.bg } }
      } else {
        cell.font = { name: 'DM Sans', bold: ci === 1 || ci === 3 || ci === 5, size: 10, color: { argb: 'FF1E293B' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + rowBg } }
      }
    })
  })

  // ── Charts section ───────────────────────────────────────────────
  s1.getRow(16).height = 8

  s1.mergeCells('B17:I17')
  const chartSecTitle = s1.getCell('B17')
  chartSecTitle.value     = 'BIỂU ĐỒ THỐNG KÊ'
  chartSecTitle.font      = { name: 'DM Sans', bold: true, size: 11, color: { argb: 'FF' + WHITE } }
  chartSecTitle.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + NAVY } }
  chartSecTitle.alignment = { horizontal: 'center', vertical: 'middle' }
  s1.getRow(17).height = 24

  // Add images if fetched successfully
  let chartRowEnd = 18
  if (barImg) {
    const imgId = wb.addImage({ buffer: Buffer.from(barImg) as any, extension: 'png' })
    s1.addImage(imgId, { tl: { col: 1, row: 17.3 }, ext: { width: 430, height: 258 } })
  }
  if (pieImg) {
    const imgId = wb.addImage({ buffer: Buffer.from(pieImg) as any, extension: 'png' })
    s1.addImage(imgId, { tl: { col: 5, row: 17.3 }, ext: { width: 430, height: 258 } })
  }
  if (barImg || pieImg) {
    chartRowEnd = 31 // reserve ~13 rows of height for the images
    for (let r = 18; r <= chartRowEnd; r++) s1.getRow(r).height = 20
  } else {
    // Fallback: keep the raw data table if chart fetch failed
    const chartHdrs = ['Chứng chỉ', 'Lượt thi', 'Đạt ≥70%', 'Tỉ lệ đạt (%)', '']
    const r18 = s1.getRow(18)
    chartHdrs.forEach((h, i) => { r18.getCell(i + 2).value = h })
    applyHeaderRow(r18, '334E7A')
    s1.getRow(18).height = 22

    certStats.forEach(({ cert, count, pass, rate }, ri) => {
      const chartRow = s1.getRow(19 + ri)
      chartRow.height = 22
      const { bg, fg } = CERT_STYLE[cert] ?? { bg: LIGHT_ROW, fg: NAVY }
      const rowBg = ri % 2 === 0 ? WHITE : LIGHT_ROW
      const vals: ExcelJS.CellValue[] = [cert, count, pass, rate, '']
      vals.forEach((v, ci) => {
        const cell = chartRow.getCell(ci + 2)
        cell.value     = v
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border    = border()
        if (ci === 0) {
          cell.font = { name: 'DM Sans', bold: true, size: 10, color: { argb: 'FF' + fg } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } }
        } else {
          cell.font = { name: 'DM Sans', bold: true, size: 11, color: { argb: 'FF' + NAVY } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + rowBg } }
        }
      })
    })
    chartRowEnd = 19 + certStats.length
  }

  // ══════════════════════════════════════════════════════════════════
  // Sheet 2: Danh sách sinh viên
  // ══════════════════════════════════════════════════════════════════
  const s2 = wb.addWorksheet('👥 Sinh viên', { views: [{ showGridLines: false, state: 'frozen', ySplit: 4 }] })
  const s2Widths = [3, 14, 26, 12, 12, 12, 18, 14, 16, 22]
  ;['A','B','C','D','E','F','G','H','I','J'].forEach((col, i) => { s2.getColumn(col).width = s2Widths[i] })

  titleBanner(s2, 'DANH SÁCH SINH VIÊN — KẾT QUẢ THI', 'B', 'J', 40)

  const sv2Hdrs = ['STT', 'Mã SV', 'Họ tên', 'Lớp', 'Khoa', 'Lần thi', 'Chứng chỉ', 'Điểm TB', 'Đạt ≥70%', 'Lần cuối']
  const r4s2 = s2.getRow(4)
  sv2Hdrs.forEach((h, i) => { r4s2.getCell(i + 2).value = h })
  applyHeaderRow(r4s2)

  grouped.forEach((g, ri) => {
    const wsG   = g.sessions.filter((s) => s.tong_so_cau)
    const avgG  = wsG.length ? Math.round(wsG.reduce((a, s) => a + (s.so_cau_dung as number) / (s.tong_so_cau as number) * 100, 0) / wsG.length) : 0
    const passG = wsG.filter((s) => (s.so_cau_dung as number) / (s.tong_so_cau as number) >= 0.7).length
    const certs = Array.from(new Set(g.sessions.map((s) => s.loai_chung_chi as string).filter(Boolean)))
    const latest = g.sessions.slice().sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())[0]
    const sColor = scoreColor(avgG)
    const rowBg  = ri % 2 === 0 ? WHITE : LIGHT_ROW

    const row = s2.getRow(5 + ri)
    row.height = 24
    const vals: ExcelJS.CellValue[] = [ri + 1, g.mssv, g.ho_ten, g.lop, g.khoa, g.sessions.length, certs.join(', '), `${avgG}%`, `${passG}/${wsG.length}`, fmtDate(latest.created_at as string)]
    vals.forEach((v, ci) => {
      const cell = row.getCell(ci + 2)
      cell.value     = v
      cell.border    = border()
      if (ci === 7) {  // Điểm TB
        cell.font      = { name: 'DM Sans', bold: true, size: 10, color: { argb: 'FF' + sColor.fg } }
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + sColor.bg } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      } else {
        cell.font      = { name: 'DM Sans', bold: ci === 1 || ci === 2, size: 10, color: { argb: 'FF1E293B' } }
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + rowBg } }
        cell.alignment = { horizontal: ci === 2 ? 'left' : 'center', vertical: 'middle' }
      }
    })
  })

  // Add a totals row for clarity
  if (grouped.length > 0) {
    const totalRow = s2.getRow(5 + grouped.length)
    totalRow.height = 24
    s2.mergeCells(`B${totalRow.number}:G${totalRow.number}`)
    const totalLabel = totalRow.getCell(2)
    totalLabel.value     = `TỔNG: ${grouped.length} sinh viên`
    totalLabel.font      = { name: 'DM Sans', bold: true, size: 10, color: { argb: 'FF' + WHITE } }
    totalLabel.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + NAVY2 } }
    totalLabel.alignment = { horizontal: 'left', vertical: 'middle' }
    for (const col of ['B','C','D','E','F','G','H','I','J']) {
      const cell = totalRow.getCell(col)
      cell.border = border()
      if (!cell.fill) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + NAVY2 } }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // Sheet 3: Lịch sử phiên thi
  // ══════════════════════════════════════════════════════════════════
  const s3 = wb.addWorksheet('📋 Lịch sử thi', { views: [{ showGridLines: false, state: 'frozen', ySplit: 4 }] })
  const s3W = [3, 14, 26, 10, 10, 12, 12, 9, 9, 10, 12, 12, 22]
  ;['A','B','C','D','E','F','G','H','I','J','K','L','M'].forEach((col, i) => { s3.getColumn(col).width = s3W[i] })

  titleBanner(s3, 'LỊCH SỬ PHIÊN THI CHI TIẾT', 'B', 'M', 40)

  const s3Hdrs = ['Mã SV','Họ tên','Lớp','Khoa','Chứng chỉ','Kỹ năng','Câu đúng','Tổng câu','Điểm (%)','Điểm quy đổi','Thời gian','Ngày thi']
  const r4s3 = s3.getRow(4)
  s3Hdrs.forEach((h, i) => { r4s3.getCell(i + 2).value = h })
  applyHeaderRow(r4s3)

  let rowIdx = 5
  for (const g of grouped) {
    for (const s of g.sessions.slice().sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())) {
      const pct   = s.tong_so_cau ? Math.round((s.so_cau_dung as number) / (s.tong_so_cau as number) * 100) : null
      const cert  = s.loai_chung_chi as string
      const cStyle = CERT_STYLE[cert] ?? { bg: LIGHT_ROW, fg: NAVY }
      const sColor = pct !== null ? scoreColor(pct) : null
      const rowBg  = (rowIdx - 5) % 2 === 0 ? WHITE : LIGHT_ROW
      const dur    = s.thoi_gian_lam_bai ? `${Math.floor((s.thoi_gian_lam_bai as number) / 60)}p ${(s.thoi_gian_lam_bai as number) % 60}s` : ''

      const row = s3.getRow(rowIdx)
      row.height = 22
      const vals: ExcelJS.CellValue[] = [g.mssv, g.ho_ten, g.lop, g.khoa, cert, (s.ky_nang as string) || '',
        (s.so_cau_dung as number) ?? '', (s.tong_so_cau as number) ?? '', pct !== null ? `${pct}%` : '', s.diem_quy_doi ? String((s.diem_quy_doi as number).toFixed(1)) : '', dur, fmtDate(s.created_at as string)]
      vals.forEach((v, ci) => {
        const cell = row.getCell(ci + 2)
        cell.value  = v
        cell.border = border()
        if (ci === 4) {  // cert badge
          cell.font      = { name: 'DM Sans', bold: true, size: 10, color: { argb: 'FF' + cStyle.fg } }
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + cStyle.bg } }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        } else if (ci === 8 && sColor) {  // score %
          cell.font      = { name: 'DM Sans', bold: true, size: 10, color: { argb: 'FF' + sColor.fg } }
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + sColor.bg } }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        } else {
          cell.font      = { name: 'DM Sans', size: 10, color: { argb: 'FF1E293B' } }
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + rowBg } }
          cell.alignment = { horizontal: ci === 1 ? 'left' : 'center', vertical: 'middle' }
        }
      })
      rowIdx++
    }
  }

  // ── Output ────────────────────────────────────────────────────────
  const buf = await wb.xlsx.writeBuffer()
  const now = new Date().toISOString().slice(0, 10)

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="bao-cao-ket-qua-thi-${now}.xlsx"`,
    },
  })
}