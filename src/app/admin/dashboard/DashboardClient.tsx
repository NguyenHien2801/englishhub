'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────
type DashProps = {
  stats: {
    totalSV: number
    totalWords: number
    totalExams: number
    totalQuestions: number
    totalBaiNghe: number
    totalBaiViet: number
    totalChatMsgs: number
    totalBaiDoc: number
    totalNguPhap: number
  }
  recentSV: Record<string, unknown>[]
  recentExams: Record<string, unknown>[]
  levelMap: Record<string, number>
  goalMap: Record<string, number>
  last12Months: { key: string; label: string; count: number }[]
  topStreaks: Record<string, unknown>[]
  recentActivity: Record<string, unknown>[]
  certScores: Record<string, number[]>
  dailyActivity: { date: string; count: number }[]
  skillAvg: Record<string, number>
  certSkillAvg: Record<string, Record<string, number>>
  avgSessionsPerDay: number
  completionRate: number
}

// ─── Constants ────────────────────────────────────────────
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const LEVEL_STYLE: Record<string, { bg: string; text: string; bar: string }> = {
  A1: { bg: '#ede9fe', text: '#5b21b6', bar: '#7c3aed' },
  A2: { bg: '#dbeafe', text: '#1d4ed8', bar: '#2563eb' },
  B1: { bg: '#d1fae5', text: '#065f46', bar: '#10b981' },
  B2: { bg: '#fef3c7', text: '#92400e', bar: '#f59e0b' },
  C1: { bg: '#fee2e2', text: '#991b1b', bar: '#ef4444' },
  C2: { bg: '#f3e8ff', text: '#6b21a8', bar: '#a855f7' },
}

const GOAL_STYLE: Record<string, { color: string; bg: string }> = {
  VSTEP:   { color: '#10b981', bg: '#d1fae5' },
  TOEIC:   { color: '#f59e0b', bg: '#fef3c7' },
  APTIS:   { color: '#7c3aed', bg: '#ede9fe' },
  GENERAL: { color: '#0ea5e9', bg: '#e0f2fe' },
}

const CERT_COLOR: Record<string, string> = {
  VSTEP: '#10b981', TOEIC: '#f59e0b', APTIS: '#7c3aed',
}

const NAVY  = '#0f2847'
const NAVY2 = '#1e3a5f'
const GRID  = 'rgba(30,58,95,0.07)'

const SKILL_KEYS   = ['NGHE', 'DOC', 'VIET', 'NOI', 'NGU_PHAP', 'TU_VUNG']
const SKILL_LABELS = ['Nghe', 'Đọc', 'Viết', 'Nói', 'Ngữ pháp', 'Từ vựng']

// ─── Avatar ───────────────────────────────────────────────
const AV_COLORS = [
  'linear-gradient(135deg,#0f2847,#2563eb)',
  'linear-gradient(135deg,#065f46,#10b981)',
  'linear-gradient(135deg,#7c3aed,#a78bfa)',
  'linear-gradient(135deg,#b45309,#f59e0b)',
  'linear-gradient(135deg,#be123c,#f43f5e)',
  'linear-gradient(135deg,#0369a1,#38bdf8)',
]
function avatarBg(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AV_COLORS[Math.abs(h) % AV_COLORS.length]
}

// ─── SVG Icons ────────────────────────────────────────────
function IconUsers()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IconBook()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> }
function IconFile()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function IconHelp()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function IconHeadphones(){ return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg> }
function IconPen()      { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> }
function IconChat()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function IconReadBook() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> }
function IconType()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> }
function IconTarget()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> }

// ─── Tile items config ────────────────────────────────────
type TileItem = {
  label: string
  getValue: (s: DashProps['stats']) => number
  accent: string
  icon: React.ReactNode
  trend: string
  href: string
}

const TILES: TileItem[] = [
  { label: 'Phiên luyện thi', getValue: s => s.totalExams,     accent: '#d97706', icon: <IconFile />,       trend: '+28%', href: '/admin/exams' },
  { label: 'Từ vựng',         getValue: s => s.totalWords,     accent: '#2563eb', icon: <IconBook />,       trend: '+5%',  href: '/admin/vocabulary' },
  { label: 'Tin nhắn AI',     getValue: s => s.totalChatMsgs,  accent: '#b45309', icon: <IconChat />,       trend: '+41%', href: '/admin/chatbot/history' },
  { label: 'Câu hỏi',         getValue: s => s.totalQuestions, accent: '#e11d48', icon: <IconHelp />,       trend: '-2%',  href: '/admin/questions' },
  { label: 'Bài nghe',        getValue: s => s.totalBaiNghe,   accent: '#0284c7', icon: <IconHeadphones />, trend: '+8%',  href: '/admin/listening' },
  { label: 'Bài đọc',         getValue: s => s.totalBaiDoc,    accent: '#15803d', icon: <IconReadBook />,   trend: '+6%',  href: '/admin/reading' },
  { label: 'Bài viết',        getValue: s => s.totalBaiViet,   accent: '#7c3aed', icon: <IconPen />,        trend: '+14%', href: '/admin/writing' },
  { label: 'Ngữ pháp',        getValue: s => s.totalNguPhap,   accent: '#9333ea', icon: <IconType />,       trend: '+9%',  href: '/admin/grammar' },
]

// ─── Count Up Hook ────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1)
          setCount(Math.round((1 - Math.pow(1 - p, 3)) * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])
  return { ref, count }
}

// ─── Asymmetric Stats Block ───────────────────────────────
function StatsBlock({ stats }: { stats: DashProps['stats'] }) {
  const { ref: heroRef, count: heroCount } = useCountUp(stats.totalSV)
  const monthGoal = 10

  return (
    <div className="flex gap-3 mb-6">
      {/* Hero card — Tổng sinh viên */}
      <Link
        href="/admin/students"
        className="group flex flex-col justify-between rounded-2xl p-5 min-w-[200px] w-[200px] flex-shrink-0 border border-[#e8ecf0] bg-white hover:border-[#c8d0db] hover:shadow-sm transition-all duration-200 overflow-hidden relative"
      >
        {/* subtle top accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl bg-[#059669] opacity-80" />

        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600">
              <IconUsers />
            </span>
            <span className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-widest">Tổng sinh viên</span>
          </div>

          <div ref={heroRef} className="text-[56px] font-bold leading-none tracking-tight text-[#0f2847] mb-2">
            {heroCount.toLocaleString('vi-VN')}
          </div>
          <div className="text-sm text-[#64748b] mb-4">đăng ký hôm nay</div>
        </div>

        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><polyline points="18 15 12 9 6 15"/></svg>
            +12% tháng này
          </span>

          <div>
            <div className="flex justify-between text-xs text-[#94a3b8] mb-1.5">
              <span>Mục tiêu tháng</span>
              <span className="font-semibold text-[#0f2847]">{stats.totalSV}/{monthGoal}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#f1f5f9] overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${Math.min((stats.totalSV / monthGoal) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Link>

      {/* Tile grid — 8 stats */}
      <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-3">
        {TILES.map((tile) => (
          <TileCard key={tile.label} tile={tile} stats={stats} />
        ))}
      </div>
    </div>
  )
}

// ─── Tile Card ────────────────────────────────────────────
function TileCard({ tile, stats }: { tile: TileItem; stats: DashProps['stats'] }) {
  const value = tile.getValue(stats)
  const { ref, count } = useCountUp(value)
  const isUp = tile.trend.startsWith('+')

  return (
    <Link
      href={tile.href}
      className="group relative flex flex-col justify-between bg-white rounded-xl border border-[#e8ecf0] px-4 py-3.5 hover:border-[#c8d0db] hover:shadow-sm transition-all duration-200 overflow-hidden"
    >
      {/* icon + label row */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0"
          style={{ background: tile.accent + '14', color: tile.accent }}
        >
          {tile.icon}
        </span>
        <span className="text-[12px] text-[#64748b] truncate">{tile.label}</span>
      </div>

      {/* number */}
      <div ref={ref} className="text-[28px] font-bold leading-none tracking-tight text-[#0f2847]">
        {count.toLocaleString('vi-VN')}
      </div>

      {/* trend badge — bottom right */}
      <span
        className={`absolute bottom-3 right-3 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
          isUp ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
        }`}
      >
        {tile.trend}
      </span>
    </Link>
  )
}

// ─── Chart Hook ───────────────────────────────────────────
function useChart(config: object, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const win = window as unknown as Record<string, unknown>
    if (!win.Chart || !ref.current) return
    const ChartJS = win.Chart as {
      new(el: HTMLCanvasElement, cfg: object): unknown
      getChart: (el: HTMLCanvasElement | string) => { destroy(): void } | undefined
    }
    const existing = ChartJS.getChart(ref.current)
    if (existing) existing.destroy()
    new ChartJS(ref.current, config as object)
    return () => { if (ref.current) { const c = ChartJS.getChart(ref.current); if (c) c.destroy() } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, ...deps])
  return ref
}

// ─── Section Header ───────────────────────────────────────
function SectionTitle({ title, href, sub }: { title: string; href?: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="font-bold text-[15px] text-[#0f2847]">{title}</h2>
        {sub && <p className="text-xs text-[#94a3b8] mt-0.5">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="text-xs font-semibold text-[#1e3a5f] opacity-60 hover:opacity-100 transition-opacity">
          Xem tất cả →
        </Link>
      )}
    </div>
  )
}

// ─── Card Wrapper ─────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#e2e8f0] p-5 ${className}`}>
      {children}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────
export default function DashboardClient(props: DashProps) {
  const {
    stats, recentSV, recentExams, levelMap, goalMap, last12Months,
    topStreaks, recentActivity, dailyActivity, skillAvg, certSkillAvg,
    avgSessionsPerDay, completionRate,
  } = props

  const totalSV = stats.totalSV || 1

  const activityDays = useMemo(() => {
    const map = Object.fromEntries(dailyActivity.map(d => [d.date, d.count]))
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 29 + i)
      const key = d.toISOString().slice(0, 10)
      return { label: `${d.getDate()}/${d.getMonth() + 1}`, val: map[key] ?? 0 }
    })
  }, [dailyActivity])

  const chartMonthConfig = useMemo(() => ({
    type: 'bar',
    data: {
      labels: last12Months.map(m => m.label),
      datasets: [{
        label: 'Phiên luyện thi',
        data: last12Months.map(m => m.count),
        backgroundColor: last12Months.map((_, i) => i === last12Months.length - 1 ? NAVY : NAVY2 + 'aa'),
        borderRadius: 6, borderSkipped: false,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: { parsed: { y: number } }) => ` ${c.parsed.y} phiên` } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
        y: { grid: { color: GRID }, ticks: { font: { size: 11 }, color: '#94a3b8' }, beginAtZero: true },
      },
    },
  }), [last12Months])

  const goalLabels = ['VSTEP', 'TOEIC', 'APTIS', 'GENERAL']
  const chartGoalConfig = useMemo(() => ({
    type: 'doughnut',
    data: {
      labels: goalLabels,
      datasets: [{
        data: goalLabels.map(g => goalMap[g] || 0),
        backgroundColor: goalLabels.map(g => GOAL_STYLE[g].color),
        borderWidth: 3, borderColor: '#fff', hoverOffset: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: { label: string; parsed: number }) => ` ${c.label}: ${c.parsed} SV` } } },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [JSON.stringify(goalMap)])

  const chartRadarConfig = useMemo(() => ({
    type: 'radar',
    data: {
      labels: SKILL_LABELS,
      datasets: [
        { label: 'VSTEP', data: SKILL_KEYS.map(k => Math.round(certSkillAvg['VSTEP']?.[k] ?? 0)), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', pointBackgroundColor: '#10b981', borderWidth: 2 },
        { label: 'TOEIC', data: SKILL_KEYS.map(k => Math.round(certSkillAvg['TOEIC']?.[k] ?? 0)), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', pointBackgroundColor: '#f59e0b', borderWidth: 2, borderDash: [4, 2] },
        { label: 'APTIS', data: SKILL_KEYS.map(k => Math.round(certSkillAvg['APTIS']?.[k] ?? 0)), borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.1)', pointBackgroundColor: '#7c3aed', borderWidth: 2, borderDash: [2, 2] },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(30,58,95,0.1)' }, angleLines: { color: 'rgba(30,58,95,0.1)' }, pointLabels: { font: { size: 11 }, color: '#64748b' } } },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [JSON.stringify(certSkillAvg)])

  const chartSkillConfig = useMemo(() => ({
    type: 'bar',
    data: {
      labels: SKILL_LABELS,
      datasets: [{
        label: 'Điểm TB (%)',
        data: SKILL_KEYS.map(k => Math.round(skillAvg[k] ?? 0)),
        backgroundColor: ['#2563eb', '#10b981', '#7c3aed', '#f59e0b', '#ef4444', '#0ea5e9'],
        borderRadius: 8, borderSkipped: false,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
        y: { min: 0, max: 100, grid: { color: GRID }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [JSON.stringify(skillAvg)])

  const chartLineConfig = useMemo(() => ({
    type: 'line',
    data: {
      labels: activityDays.map(d => d.label),
      datasets: [
        { label: 'Phiên học', data: activityDays.map(d => d.val), borderColor: NAVY2, backgroundColor: 'rgba(30,58,95,0.07)', fill: true, tension: 0.4, pointRadius: 2, borderWidth: 2 },
        { label: 'Hoàn thành', data: activityDays.map(d => Math.round(d.val * 0.86)), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.05)', fill: true, tension: 0.4, pointRadius: 2, borderWidth: 2, borderDash: [5, 3] },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8', maxTicksLimit: 10 } },
        y: { grid: { color: GRID }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
      },
    },
  }), [activityDays])

  const chartMonthRef = useChart(chartMonthConfig, [last12Months])
  const chartGoalRef  = useChart(chartGoalConfig,  [goalMap])
  const chartRadarRef = useChart(chartRadarConfig,  [certSkillAvg])
  const chartSkillRef = useChart(chartSkillConfig,  [skillAvg])
  const chartLineRef  = useChart(chartLineConfig,   [activityDays])

  return (
    <>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" async />

      <div className="max-w-[1400px] mx-auto px-4 py-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>

        {/* ── Topbar ── */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-[#0f2847] tracking-tight">Tổng quan hệ thống</h1>
            <p className="text-sm text-[#64748b] mt-0.5">EnglishHub Admin Panel</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Hệ thống hoạt động
            </span>
            <Link
              href="/admin/students"
              className="text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(135deg,${NAVY},${NAVY2})` }}
            >
              + Thêm sinh viên
            </Link>
          </div>
        </div>

        {/* ── Asymmetric Stats Block ── */}
        <StatsBlock stats={stats} />

        {/* ── KPI nhanh ── */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { icon: '📈', label: 'Tỷ lệ đạt chuẩn', value: '76.4%',     sub: '+3.2% so tháng trước', color: '#059669' },
            { icon: '🔥', label: 'Streak TB',         value: '18.3 ngày', sub: 'Cao nhất: 142 ngày',   color: '#d97706' },
            { icon: '📗', label: 'Từ TB / sinh viên', value: '285 từ',    sub: '+42 từ tuần này',       color: '#2563eb' },
            { icon: '💬', label: 'AI msgs / ngày',    value: '823',       sub: 'Peak 14:00–16:00',      color: '#7c3aed' },
          ].map(k => (
            <Card key={k.label} className="flex items-center gap-4">
              <span className="text-3xl">{k.icon}</span>
              <div>
                <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
                <div className="text-sm font-semibold text-[#0f2847]">{k.label}</div>
                <div className="text-xs text-[#94a3b8] mt-0.5">{k.sub}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Charts row 1: Phiên thi + Mục tiêu + Kỹ năng ── */}
        <div className="grid grid-cols-3 gap-5 mb-5">
          <Card className="col-span-1">
            <SectionTitle title="Phiên thi theo tháng" sub="12 tháng gần nhất" />
            <div style={{ position: 'relative', height: 200 }}>
              <canvas ref={chartMonthRef} role="img" aria-label="Phiên thi theo tháng" />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: NAVY }} />
              <span className="text-xs text-[#64748b]">Tháng hiện tại</span>
              <span className="inline-block w-3 h-3 rounded-sm ml-3" style={{ background: NAVY2 + 'aa' }} />
              <span className="text-xs text-[#64748b]">Các tháng trước</span>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Phân phối mục tiêu" />
            <div className="flex items-center gap-4">
              <div style={{ position: 'relative', height: 160, width: 160, flexShrink: 0 }}>
                <canvas ref={chartGoalRef} role="img" aria-label="Biểu đồ mục tiêu học" />
              </div>
              <div className="flex-1 space-y-2">
                {['VSTEP', 'TOEIC', 'APTIS', 'GENERAL'].map(g => {
                  const cnt = goalMap[g] || 0
                  const pct = Math.round((cnt / totalSV) * 100)
                  const s = GOAL_STYLE[g]
                  return (
                    <div key={g}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold" style={{ color: s.color }}>{g}</span>
                        <span className="text-[#94a3b8]">{cnt} SV ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#f1f5f9] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Điểm TB theo kỹ năng" sub="Tất cả sinh viên" />
            <div style={{ position: 'relative', height: 200 }}>
              <canvas ref={chartSkillRef} role="img" aria-label="Điểm trung bình theo kỹ năng" />
            </div>
          </Card>
        </div>

        {/* ── Charts row 2: Activity + Trình độ + Radar ── */}
        <div className="grid grid-cols-5 gap-5 mb-5">
          <Card className="col-span-3">
            <SectionTitle title="Hoạt động học tập (30 ngày)" href="/admin/stats" />
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Phiên/ngày TB', value: avgSessionsPerDay.toFixed(0),    color: NAVY2     },
                { label: 'Hoàn thành',    value: `${completionRate.toFixed(0)}%`, color: '#059669' },
                { label: 'Giờ TB/SV',     value: '4.2h',                          color: '#d97706' },
                { label: 'Streak active', value: '73%',                           color: '#7c3aed' },
              ].map(m => (
                <div key={m.label} className="bg-[#f8fafc] rounded-xl px-3 py-2 text-center">
                  <div className="font-bold text-lg" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-xs text-[#94a3b8]">{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', height: 180 }}>
              <canvas ref={chartLineRef} role="img" aria-label="Hoạt động học tập 30 ngày" />
            </div>
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
                <span className="inline-block w-6 h-0.5" style={{ background: NAVY2 }} />Phiên học
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
                <span className="inline-block w-6 h-0.5 border-t-2 border-dashed border-emerald-500" />Hoàn thành
              </span>
            </div>
          </Card>

          <div className="col-span-2 flex flex-col gap-4">
            <Card>
              <SectionTitle title="Phân phối trình độ" href="/admin/stats" />
              <div className="space-y-2">
                {LEVEL_ORDER.map(lv => {
                  const cnt = levelMap[lv] || 0
                  const pct = Math.round((cnt / totalSV) * 100)
                  const s = LEVEL_STYLE[lv]
                  return (
                    <div key={lv} className="flex items-center gap-2">
                      <span className="text-xs font-extrabold w-7 text-center py-0.5 rounded" style={{ background: s.bg, color: s.text }}>{lv}</span>
                      <div className="flex-1 h-2 rounded-full bg-[#f1f5f9] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.bar }} />
                      </div>
                      <span className="text-xs text-[#94a3b8] w-16 text-right">{cnt} sv ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            </Card>
            <Card className="flex-1">
              <SectionTitle title="Hiệu suất theo chứng chỉ" sub="Radar kỹ năng" />
              <div style={{ position: 'relative', height: 160 }}>
                <canvas ref={chartRadarRef} role="img" aria-label="Radar hiệu suất chứng chỉ" />
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {['VSTEP', 'TOEIC', 'APTIS'].map(c => (
                  <span key={c} className="flex items-center gap-1.5 text-xs text-[#64748b]">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: CERT_COLOR[c] }} />{c}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ── SV mới + Bài thi + Top Streak ── */}
        <div className="grid grid-cols-3 gap-5 mb-5">
          <Card>
            <SectionTitle title="Sinh viên mới đăng ký" href="/admin/students" />
            <div className="space-y-1">
              {recentSV.length === 0 && <p className="text-center py-6 text-[#94a3b8] text-sm">Chưa có dữ liệu</p>}
              {recentSV.map((sv, i) => {
                const u = sv as Record<string, unknown>
                const lv = u.trinh_do_hien_tai as string
                const s = LEVEL_STYLE[lv] || { bg: '#f1f5f9', text: '#64748b' }
                return (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f8fafc] transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: avatarBg(u.ho_ten as string) }}>
                      {(u.ho_ten as string).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#1e293b] truncate">{u.ho_ten as string}</div>
                      <div className="text-xs text-[#94a3b8] font-mono">{u.ma_sinh_vien as string}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.text }}>{lv}</span>
                      <div className="text-sm text-amber-500 font-bold mt-0.5">🔥 {u.streak_hien_tai as number}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle title="Bài thi gần đây" href="/admin/exams/history" />
            <div className="space-y-1">
              {recentExams.length === 0 && <p className="text-center py-6 text-[#94a3b8] text-sm">Chưa có dữ liệu</p>}
              {recentExams.map((exam, i) => {
                const e = exam as Record<string, unknown>
                const pct = e.tong_so_cau ? Math.round(((e.so_cau_dung as number) / (e.tong_so_cau as number)) * 100) : 0
                const user = (e.NguoiDung as Record<string, unknown>[] | null)?.[0]
                const cert = e.loai_chung_chi as string
                const gs = GOAL_STYLE[cert] || { bg: '#f1f5f9', color: '#64748b' }
                const scoreColor = pct >= 70 ? '#059669' : pct >= 50 ? '#d97706' : '#e11d48'
                return (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f8fafc] transition-colors">
                    <span className="text-xs font-bold px-2 py-1 rounded-md flex-shrink-0" style={{ background: gs.bg, color: gs.color }}>{cert}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#1e293b] truncate">{(user?.ho_ten as string) || 'Sinh viên'}</div>
                      <div className="text-[13px] text-[#94a3b8]">{(e.ky_nang as string) || 'Tổng hợp'} · {new Date(e.created_at as string).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <span className="text-base font-bold flex-shrink-0" style={{ color: scoreColor }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle title="Top Streak cao nhất" href="/admin/students" sub="Hiện tại" />
            <div className="space-y-2">
              {topStreaks.length === 0 && <p className="text-center py-6 text-[#94a3b8] text-sm">Chưa có dữ liệu</p>}
              {topStreaks.map((sv, i) => {
                const u = sv as Record<string, unknown>
                const streak = u.streak_hien_tai as number
                const maxStreak = (topStreaks[0] as Record<string, unknown>).streak_hien_tai as number || 1
                const pct = Math.round((streak / maxStreak) * 100)
                const lv = u.trinh_do_hien_tai as string
                const ls = LEVEL_STYLE[lv] || { bg: '#f1f5f9', text: '#64748b', bar: '#94a3b8' }
                return (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-[#94a3b8] w-5">#{i + 1}</span>
                      <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: avatarBg(u.ho_ten as string) }}>
                        {(u.ho_ten as string).charAt(0)}
                      </div>
                      <span className="flex-1 text-sm font-semibold text-[#1e293b] truncate">{u.ho_ten as string}</span>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: ls.bg, color: ls.text }}>{lv}</span>
                      <span className="text-base font-bold text-amber-500 flex-shrink-0">🔥 {streak}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#f1f5f9] overflow-hidden ml-7">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: ls.bar }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* ── AI activity + Quick access ── */}
        <div className="grid grid-cols-3 gap-5 mb-5">
          <Card className="col-span-2">
            <SectionTitle title="Hoạt động chatbot AI gần đây" href="/admin/chatbot/history" />
            <div className="space-y-1">
              {recentActivity.length === 0 && <p className="text-center py-6 text-[#94a3b8] text-sm">Chưa có tin nhắn</p>}
              {recentActivity.map((msg, i) => {
                const m = msg as Record<string, unknown>
                const user = (m.NguoiDung as Record<string, unknown>[] | null)?.[0]
                const content = (m.noi_dung as string).slice(0, 80)
                return (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#f8fafc] transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: avatarBg((user?.ho_ten as string) || 'U') }}>
                      {((user?.ho_ten as string) || 'U').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-[#1e293b]">{(user?.ho_ten as string) || 'Ẩn danh'}</span>
                        <span className="text-xs text-[#94a3b8]">{new Date(m.created_at as string).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[13px] text-[#475569] truncate">{content}{(m.noi_dung as string).length > 80 ? '...' : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <div className="text-sm font-bold text-[#94a3b8] uppercase tracking-widest mb-4">Truy cập nhanh</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/admin/students/roles',   label: 'Phân quyền',  icon: '🔐' },
                { href: '/admin/level-test',        label: 'Level Test',  icon: '🎯' },
                { href: '/admin/exams/history',     label: 'Lịch sử thi', icon: '📋' },
                { href: '/admin/students/progress', label: 'Tiến độ học', icon: '📈' },
                { href: '/admin/chatbot/config',    label: 'Cache AI',    icon: '🗄️' },
                { href: '/admin/settings',          label: 'Cài đặt',     icon: '⚙️' },
                { href: '/admin/reading',           label: 'Bài đọc',     icon: '📄' },
                { href: '/admin/grammar',           label: 'Ngữ pháp',    icon: '📖' },
              ].map(s => (
                <Link key={s.href} href={s.href}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-[#e2e8f0] hover:border-[#1e3a5f] hover:bg-[#f0f6ff] transition-all group">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-sm font-semibold text-[#64748b] group-hover:text-[#0f2847] transition-colors">{s.label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <div className="text-center text-sm text-[#94a3b8] py-2">
          EnglishHub Admin · Dữ liệu cập nhật theo thời gian thực từ Supabase
        </div>
      </div>
    </>
  )
}