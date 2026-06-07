'use client'

// ─────────────────────────────────────────────────────────────────────────────
// DashboardClient.tsx — EnglishHub Analytics Dashboard
// Layout: thuần trang thống kê, không sidebar, không tab bar
// Recharts: Area, Bar, Composed, Pie, Radar
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, ComposedChart,
  PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LabelList,
} from 'recharts'

import {
  type LucideIcon,
  Flame, BookOpen, CheckCircle2, Target, Clock,
  Brain, Mic, Headphones, PenLine, Eye,
  Award, Zap, ChevronRight, RefreshCw,
  Loader2, Activity, Star,
  ArrowUpRight, ArrowDownRight, Minus, Sparkles,
  BookMarked, FileText, MessageSquare, TrendingUp,
  BarChart2, Calendar,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  ho_ten?: string; streak_hien_tai?: number; streak_cao_nhat?: number
  tong_so_tu_da_hoc?: number; muc_tieu_hoc?: string
  trinh_do_hien_tai?: string; diem_yeu?: string; [k: string]: unknown
}
interface VocabRow {
  trang_thai?: string | null; ngay_on_tiep_theo?: string | null
  lan_cuoi_on?: string | null
  TuVung?: { tu_tieng_anh?: string; cap_do?: string } | null
  [k: string]: unknown
}
interface ExamRow {
  id?: string; ky_nang?: string; loai_chung_chi?: string
  so_cau_dung?: number; tong_so_cau?: number
  thoi_gian_lam_bai?: number; created_at?: string
  diem_so?: number; diem_quy_doi?: number
}
interface GrammarProgressRow {
  da_hoan_thanh?: boolean; diem_bai_tap?: number | null
  ngay_hoan_thanh?: string | null
  BaiHocNguPhap?: { tieu_de?: string; cap_do?: string; danh_muc?: string } | null
}
interface GrammarLessonRow { cap_do?: string | null }
interface ChatRow { created_at?: string }
interface Props {
  userId: string; profile: Profile | null
  allVocabProgress: VocabRow[]; dueTodayCount: number
  totalMastered: number; totalLearning: number; totalReview: number; totalNew: number
  streakDatesArr: string[]; recentExams: ExamRow[]; avgScoreAll: number
  allGrammarProgress: GrammarProgressRow[]; allGrammarLessons: GrammarLessonRow[]
  grammarDoneCount: number; chatHistory: ChatRow[]
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  bg:      '#F8F5EE',    // --cream từ Landing
  white:   '#FFFFFF',
  navy:    '#0F1C35',    // --navy
  navyMid: '#1E2F50',    // --navy-lg
  gold:    '#C9A84C',    // --gold (sửa từ #C9933A)
  goldLt:  '#E8C97A',    // --gold-lt
  goldPale:'#FDF8EE',    // --gold-pale
  green:   '#00A878',    // --green
  greenLt: '#4ECBA8',    // --green-lt
  blue:    '#2B6CB0',
  blueLt:  '#4299E1',
  violet:  '#6478F0',    // --violet (sửa từ #6C63D4)
  rose:    '#F06464',    // --rose (sửa từ #E05252)
  roseLt:  '#F08080',
  slate:   '#64748B',
  border:  'rgba(201,168,76,0.18)',  // --border từ Landing (gold-tinted)
  borderMd:'rgba(201,168,76,0.30)',
  text:    '#1A1E2E',
  textMid: '#4A5568',
  textLt:  '#94A3B8',
}

const RANGE_OPTS = [
  { key: 'week',    label: 'Tuần',  days: 7   },
  { key: 'month',   label: 'Tháng', days: 30  },
  { key: 'quarter', label: 'Quý',   days: 90  },
  { key: 'year',    label: 'Năm',   days: 365 },
]

const SKILL_META: Record<string, { label: string; Icon: LucideIcon; color: string; bg: string }> = {
  NGHE:     { label: 'Nghe',     Icon: Headphones, color: C.blueLt,  bg: '#EBF4FF' },
  DOC:      { label: 'Đọc',      Icon: Eye,        color: C.greenLt, bg: '#E6FDF4' },
  VIET:     { label: 'Viết',     Icon: PenLine,    color: C.gold,    bg: C.goldPale},
  NOI:      { label: 'Nói',      Icon: Mic,        color: C.violet,  bg: '#F0EFFE' },
  TU_VUNG:  { label: 'Từ vựng',  Icon: BookOpen,   color: '#EC4899', bg: '#FDF2F8' },
  NGU_PHAP: { label: 'Ngữ pháp', Icon: Brain,      color: '#06B6D4', bg: '#ECFEFF' },
}

const CERT_COLORS: Record<string, string> = {
  VSTEP: C.greenLt, TOEIC: C.gold, APTIS: C.violet,
}

const LEVEL_ORDER  = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LEVEL_COLORS = ['#94A3B8', '#38BDF8', '#34C897', '#C9933A', '#6C63D4', '#E05252']

// ─── Utils ────────────────────────────────────────────────────────────────────
const pct  = (n?: number, d?: number) => d ? Math.round(((n ?? 0) / d) * 100) : 0
const fmt  = (n?: number) => (n ?? 0).toLocaleString('vi-VN')
const fmtH = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h${m}p` : `${m}p` }
const scoreColor = (s: number) => s >= 80 ? C.green : s >= 60 ? C.gold : C.rose
const scoreBg    = (s: number) => s >= 80 ? '#E6FDF4' : s >= 60 ? C.goldPale : '#FEF2F2'

function filterByDays<R extends { created_at?: string }>(rows: R[], days: number): R[] {
  const c = new Date(); c.setDate(c.getDate() - days)
  return rows.filter(r => r.created_at && new Date(r.created_at) >= c)
}

// THAY BẰNG:
function groupExams(rows: ExamRow[], days: number) {
  const f = filterByDays(rows, days)
    .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime())
  const m: Record<string, { label: string; soPhien: number; totalScore: number; thoiGian: number; ts: number }> = {}
  f.forEach(r => {
    const d = new Date(r.created_at!)
    let k: string
    if (days <= 7)       k = d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })
    else if (days <= 30) k = `${d.getDate()}/${d.getMonth() + 1}`
    else if (days <= 90) k = `T${d.getMonth() + 1} W${Math.ceil(d.getDate() / 7)}`
    else                 k = `Th${d.getMonth() + 1}`
    if (!m[k]) m[k] = { label: k, soPhien: 0, totalScore: 0, thoiGian: 0, ts: d.getTime() }
    m[k].soPhien++; m[k].totalScore += pct(r.so_cau_dung, r.tong_so_cau); m[k].thoiGian += r.thoi_gian_lam_bai ?? 0
  })
  return Object.values(m)
    .sort((a, b) => a.ts - b.ts)
    .map(g => ({
      label: g.label, soPhien: g.soPhien,
      diemTB: g.soPhien ? Math.round(g.totalScore / g.soPhien) : 0,
      thoiGian: Math.round(g.thoiGian / 60),
    }))
}

function groupVocabByDay(rows: VocabRow[], days: number) {
  const result: Record<string, { label: string; hoc: number; onTap: number; thuanThuc: number }> = {}
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days)
  rows.forEach(r => {
    const rawDate = r.lan_cuoi_on   // ← bỏ ?? r.ngay_on_tiep_theo
    if (!rawDate) return
    const d = new Date(String(rawDate))
    if (d < cutoff) return
    const k = String(rawDate).slice(0, 10)
    if (!result[k]) result[k] = { label: k.slice(5).replace('-', '/'), hoc: 0, onTap: 0, thuanThuc: 0 }
    if (r.trang_thai === 'moi' || r.trang_thai === 'dang_hoc') result[k].hoc++
    else if (r.trang_thai === 'on_tap')     result[k].onTap++
    else if (r.trang_thai === 'thuan_thuc') result[k].thuanThuc++
  })
   return Object.entries(result)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([, v]) => v)
}

function weeklyHeatmap(s: Set<string>) {
  const today = new Date()
  const weeks: { key: string; active: boolean; isToday: boolean }[][] = []
  let week: { key: string; active: boolean; isToday: boolean }[] = []
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    week.push({ key, active: s.has(key), isToday: i === 0 })
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length) weeks.push(week)
  return weeks
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 4px 24px rgba(15,28,53,0.10)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ color: C.textMid, fontSize: 13, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: C.textMid, fontSize: 14 }}>{p.name}:</span>
          <span style={{ color: C.navy, fontWeight: 700, fontSize: 14 }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}
// ─── Personal Roadmap Banner ─────────────────────────────────────────────────
function PersonalRoadmap({ profile, totalMastered, avgScore, grammarDoneCount, totalGrammar }: {
  profile: Profile | null
  totalMastered: number
  avgScore: number
  grammarDoneCount: number
  totalGrammar: number
}) {
  if (!profile) return null

  const certLabel: Record<string, string> = {
    VSTEP: 'VSTEP B1', TOEIC: 'TOEIC 600+', APTIS: 'APTIS B2', GENERAL: 'Tiếng Anh tổng quát'
  }
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const levelIdx = Math.max(0, levelOrder.indexOf(profile.trinh_do_hien_tai ?? 'A1'))

  // Tiến độ tổng thể: trung bình 3 chỉ số
  const vocabPct   = Math.min(100, Math.round((totalMastered / 500) * 100))
  const grammarPct = totalGrammar ? Math.round((grammarDoneCount / totalGrammar) * 100) : 0
  const overall    = Math.round((vocabPct + grammarPct + Math.min(100, avgScore)) / 3)

  const milestones = [
    { label: 'Từ vựng', pct: vocabPct,   color: C.blueLt },
    { label: 'Ngữ pháp', pct: grammarPct, color: C.violet },
    { label: 'Luyện thi', pct: Math.min(100, avgScore), color: C.gold  },
  ]

  return (
    <div style={{
      background: C.navy,
      borderRadius: 20,
      border: `1px solid rgba(201,168,76,.2)`,
      padding: '24px 28px',
      marginBottom: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Blob trang trí góc phải — giống Landing */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 180, height: 180,
        background: 'rgba(201,168,76,.07)',
        borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 20, position: 'relative' }}>

        {/* Trái: thông tin lộ trình */}
        <div style={{ flex: 1, minWidth: 240 }}>
          {/* Tag nhỏ kiểu Landing */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '4px 14px',
            background: 'rgba(201,168,76,.12)',
            border: '1px solid rgba(201,168,76,.25)',
            borderRadius: 50,
            fontSize: 11, fontWeight: 700, color: C.gold,
            textTransform: 'uppercase', letterSpacing: '1px',
            marginBottom: 12,
          }}>
            Lộ trình của bạn
          </div>

          <div style={{
            fontSize: 'clamp(18px,2vw,24px)', fontWeight: 900, color: '#fff',
            fontFamily: "'Playfair Display', serif", lineHeight: 1.2, marginBottom: 8,
          }}>
            Mục tiêu:{' '}
            <span style={{ color: C.gold }}>
              {certLabel[profile.muc_tieu_hoc ?? 'VSTEP']}
            </span>
          </div>

          <div style={{ fontSize: 16, color: 'rgba(255,255,255,.55)', marginBottom: 18, lineHeight: 1.6 }}>
            Trình độ hiện tại · Streak{' '}
            <span style={{ color: C.greenLt, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Flame size={14} color={C.greenLt} strokeWidth={1.8} />
                {profile.streak_hien_tai ?? 0} ngày
            </span>
            {profile.diem_yeu && (
              <span style={{ color: C.rose }}>
                {' '}· Cần cải thiện: {profile.diem_yeu}
              </span>
            )}
          </div>

          {/* Level progress bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 0, marginBottom: 6 }}>
              {levelOrder.map((lv, i) => (
                <div key={lv} style={{
                  flex: 1, textAlign: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: i <= levelIdx ? C.gold : 'rgba(255,255,255,.2)',
                  transition: 'color .3s',
                }}>{lv}</div>
              ))}
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3 }}>
              <div style={{
                width: `${((levelIdx + 1) / levelOrder.length) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${C.greenLt}, ${C.gold})`,
                borderRadius: 3,
                transition: 'width .85s cubic-bezier(.16,1,.3,1)',
              }} />
            </div>
          </div>

          {/* 3 milestone mini bars */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {milestones.map((m, i) => (
              <div key={i} style={{ flex: 1, minWidth: 80 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  fontSize: 14, color: 'rgba(255,255,255,.45)', marginBottom: 5 }}>
                  <span>{m.label}</span>
                  <span style={{ color: m.color, fontWeight: 700 }}>{m.pct}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2 }}>
                  <div style={{
                    width: `${m.pct}%`, height: '100%',
                    background: m.color, borderRadius: 2,
                    transition: 'width .85s cubic-bezier(.16,1,.3,1)',
                    opacity: 0.85,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phải: Overall score — kiểu số lớn Playfair */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 4,
          padding: '16px 24px',
          background: 'rgba(255,255,255,.05)',
          border: '1px solid rgba(201,168,76,.2)',
          borderRadius: 16,
          minWidth: 120,
        }}>
          <div style={{
            fontSize: 48, fontWeight: 900, lineHeight: 1,
            fontFamily: "'Playfair Display', serif",
            color: overall >= 70 ? C.greenLt : overall >= 40 ? C.goldLt : C.roseLt,
          }}>{overall}%</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,.45)', textAlign: 'center' }}>
            Tiến độ tổng thể
          </div>
          {/* Mô tả ngắn */}
          <div style={{
            marginTop: 6, fontSize: 14, fontWeight: 700, textAlign: 'center',
            color: overall >= 70 ? C.greenLt : overall >= 40 ? C.gold : C.rose,
          }}>
            {overall >= 70 ? '🚀 Xuất sắc' : overall >= 40 ? '📈 Đang tiến bộ' : '💪 Hãy cố lên!'}
          </div>
        </div>
      </div>
    </div>
  )
}
// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, sub, color, bg, trend, suffix, isSmall = false,
}: {
  icon: LucideIcon; label: string; value: string | number; sub?: string
  color: string; bg: string; trend?: number; suffix?: string; isSmall?: boolean
}) {
  const TIcon = trend === undefined ? null : trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus
  const tc = trend === undefined ? '' : trend > 0 ? C.green : trend < 0 ? C.rose : C.textLt
  return (
  <div style={{
    background: C.white, borderRadius: 20,
    border: `1px solid rgba(201,168,76,.18)`,
    padding: isSmall ? '16px 18px' : '24px 26px',
    display: 'flex', flexDirection: 'column', gap: 12,
    boxShadow: '0 2px 12px rgba(15,28,53,.07)',
    transition: 'box-shadow .25s',
  }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
           width: 52, height: 52, borderRadius: 15, background: bg, border: `1px solid ${color}20`,
           display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={24} color={color} strokeWidth={1.8} />
        </div>
        {TIcon && trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 13, fontWeight: 700, color: tc,
            background: `${tc}15`, padding: '4px 10px', borderRadius: 20,
          }}>
            <TIcon size={13} />{Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 15, color: C.textMid, fontWeight: 500, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
        <div style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 900, color: C.navy, lineHeight: 1, fontFamily: "'Playfair Display', serif", letterSpacing: '-0.5px' }}>
          {value}{suffix && <span style={{ fontSize: 17, color: C.textMid, fontWeight: 400, marginLeft: 5 }}>{suffix}</span>}
        </div>
        {sub && <div style={{ fontSize: 15, color: C.textLt, marginTop: 8 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, sub, color }: {
  icon: LucideIcon; title: string; sub?: string; color: string
}) {
return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `${color}15`, border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={24} color={color} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{
          fontSize: 18, fontWeight: 700, color: C.navy,
          fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.2px',
        }}>{title}</div>
        {sub && <div style={{ fontSize: 15, color: C.textMid, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────
function Panel({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const [isSmall, setIsSmall] = useState(false)
  useEffect(() => {
    const handle = () => setIsSmall(window.innerWidth < 480)
    handle()
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])
  return (
    <div className={`dash-panel${className ? ` ${className}` : ''}`} style={{
      background: C.white, borderRadius: 20,
      border: `1px solid rgba(201,168,76,.18)`,
      padding: isSmall ? '18px 16px' : '28px 30px',
      boxShadow: '0 2px 12px rgba(15,28,53,.07)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────
function Heatmap({ streakDates, streakDatesArr }: { streakDates: Set<string>; streakDatesArr: string[] }) {
  const weeks = useMemo(() => weeklyHeatmap(streakDates), [streakDates])
  const activeDays = streakDates.size
  const longest = useMemo(() => {
    if (!streakDatesArr.length) return 0
    const sorted = [...streakDatesArr].sort(); let max = 1, cur = 1
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000
      cur = diff === 1 ? cur + 1 : 1; max = Math.max(max, cur)
    }
    return max
  }, [streakDatesArr])
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 4, minWidth: 660 }}>
          {weeks.map((wk, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {wk.map((c, di) => (
                <div key={di} title={c.key} style={{
                  width: 14, height: 14, borderRadius: 3, cursor: 'default',
                  background: c.isToday ? C.gold : c.active ? `${C.gold}55` : `${C.navy}08`,
                  border: c.isToday ? `1px solid ${C.gold}` : '1px solid transparent',
                  transition: 'transform .1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.6)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 13, color: C.textLt }}>Ít</span>
         {[0.12, 0.28, 0.46, 0.65, 0.85].map((o, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: `rgba(201,147,58,${o})` }} />
          ))}
          <span style={{ fontSize: 11, color: C.textLt }}>Nhiều</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.gold,
              fontFamily: "'Playfair Display', serif" }}>{activeDays}</div>
            <div style={{ fontSize: 14, color: C.textMid }}>Ngày hoạt động</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.green, fontFamily: "'Playfair Display', serif" }}>{longest}</div>
            <div style={{ fontSize: 14, color: C.textMid }}>Streak dài nhất</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Progress Bar Row ─────────────────────────────────────────────────────────
function ProgRow({ label, done, total, color }: { label: string; done: number; total: number; color: string }) {
  const p = pct(done, total || 1)
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-block', padding: '1px 8px', borderRadius: 5,
            background: `${color}14`, border: `1px solid ${color}28`,
            fontSize: 12, fontWeight: 700, color,
          }}>{label}</span>
          <span style={{ fontSize: 12, color: C.textMid }}>{done}/{total}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{p}%</span>
      </div>
      <div style={{ height: 6, background: `${C.navy}08`, borderRadius: 3 }}>
        <div style={{ width: `${p}%`, height: '100%',background: color,borderRadius: 3, transition: 'width .85s cubic-bezier(.16,1,.3,1)',}} />
      </div>
    </div>
  )
}

// ─── AI Insight ───────────────────────────────────────────────────────────────
function AIInsight({ profile, dueToday, totalMastered, avgScore }: {
  profile: Profile | null; dueToday: number; totalMastered: number; avgScore: number
}) {
  const [text, setText] = useState('')
  const [prevText, setPrevText] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const run = useCallback(async () => {
    if (loading || !profile) return
    setPrevText(text)
    setLoading(true)
    try {
      const res = await fetch('/api/insight', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Gia sư AI cho ${profile.ho_ten}. Dữ liệu: ${profile.muc_tieu_hoc}|${profile.trinh_do_hien_tai}|Streak ${profile.streak_hien_tai}|Thuần thục ${totalMastered}|Ôn hôm nay ${dueToday}|Điểm TB ${avgScore}%|Yếu ${profile.diem_yeu ?? 'chưa rõ'}. 3 nhận xét sắc bén (emoji + 1 dòng) + 1 mục tiêu tuần (**...**). Tối đa 100 từ tiếng Việt.`,
        }),
      })
      const d = await res.json()
      setText(d.text || '...')
      setDone(true)
    } catch { setText('Không kết nối được AI.'); setDone(true) }
    finally { setLoading(false) }
  }, [loading, profile, dueToday, totalMastered, avgScore, text])

  return (
    <Panel>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(201,168,76,.1)',
            border: '1px solid rgba(201,168,76,.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={16} color={C.gold} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>AI Insight</div>
            <div style={{ fontSize: 14, color: C.textMid }}>Phân tích cá nhân hoá</div>
          </div>
        </div>
        {done && !loading && (
          <button onClick={() => { run() }} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 7, background: 'transparent',
            border: `1px solid ${C.border}`, color: C.textMid, fontSize: 12, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <RefreshCw size={11} /> Làm mới
          </button>
        )}
      </div>

      {!done ? (
        <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
          <p style={{ fontSize: 16, color: C.textMid, marginBottom: 16, lineHeight: 1.75 }}>
            AI phân tích dữ liệu học tập và đưa ra lời khuyên cá nhân hoá cho bạn.
          </p>
          <button onClick={run} disabled={loading} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 24px', borderRadius: 50,
            background: loading ? 'rgba(201,168,76,.1)' : C.gold,
            border: 'none', color: loading ? C.gold : C.navy,
            fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: loading ? 'none' : '0 6px 20px rgba(201,168,76,.35)',
            transition: 'all .32s cubic-bezier(.34,1.56,.64,1)',
            transformOrigin: 'center',
          }}>
            {loading
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang phân tích...</>
              : <><Sparkles size={14} /> Phân tích ngay</>}
          </button>
        </div>
      ) : (
        <div style={{
          fontSize: 16, color: C.text, lineHeight: 1.85, whiteSpace: 'pre-line',
          background: `${C.navy}04`, borderRadius: 10,
          padding: '14px 16px', border: `1px solid ${C.border}`,
          opacity: loading ? 0.4 : 1,
          transition: 'opacity .3s ease',
          position: 'relative',
        }}>
          {loading && prevText ? prevText : text}
          {loading && (
            <div style={{
              position: 'absolute', top: 10, right: 12,
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, color: C.gold,
            }}>
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              Đang cập nhật...
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}
// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyChart({ label, href }: { label: string; href: string }) {
  return (
    <div style={{
      minHeight: 180, height: 180, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      <BarChart2 size={30} color={C.gold} opacity={0.3} />
      <div style={{ fontSize: 14, color: C.textMid }}>{label}</div>
      <Link href={href} style={{
        fontSize: 13, color: C.gold, fontWeight: 700,
        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
      }}>
        Bắt đầu ngay <ChevronRight size={12} />
      </Link>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DashboardClient({
  profile, allVocabProgress, dueTodayCount, totalMastered, totalLearning, totalReview, totalNew,
  streakDatesArr, recentExams, avgScoreAll, allGrammarProgress, allGrammarLessons,
  grammarDoneCount, chatHistory,
}: Props) {
  const [range, setRange] = useState('month')
 const [isMobile, setIsMobile] = useState(false)
 const [isSmall, setIsSmall] = useState(false)

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      setIsMobile(w < 768)
      setIsSmall(w < 480)
    }
    check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check)
  }, [])

  const rangeDays    = RANGE_OPTS.find(r => r.key === range)?.days ?? 30
  const rangeLabel   = RANGE_OPTS.find(r => r.key === range)?.label ?? 'Tháng'
  const streakDates  = useMemo(() => new Set(streakDatesArr), [streakDatesArr])
  const examInRange  = useMemo(() => filterByDays(recentExams, rangeDays), [recentExams, rangeDays])
  const chatInRange  = useMemo(() => filterByDays(chatHistory, rangeDays).length, [chatHistory, rangeDays])

  const avgScoreRange = useMemo(() => {
    if (!examInRange.length) return 0
    return Math.round(examInRange.reduce((s, r) => s + pct(r.so_cau_dung, r.tong_so_cau), 0) / examInRange.length)
  }, [examInRange])

  const examChartData = useMemo(() => groupExams(recentExams, rangeDays), [recentExams, rangeDays])
  const vocabChartData = useMemo(() => groupVocabByDay(allVocabProgress, rangeDays), [allVocabProgress, rangeDays])

  const bySkill = useMemo(() => {
    const m: Record<string, { total: number; correct: number; count: number; thoiGian: number }> = {}
    examInRange.forEach(r => {
      const k = r.ky_nang ?? 'OTHER'
      if (!m[k]) m[k] = { total: 0, correct: 0, count: 0, thoiGian: 0 }
      m[k].total += r.tong_so_cau ?? 0; m[k].correct += r.so_cau_dung ?? 0
      m[k].count++; m[k].thoiGian += r.thoi_gian_lam_bai ?? 0
    })
    return m
  }, [examInRange])

  const certPie = useMemo(() => {
    const m: Record<string, number> = {}
    examInRange.forEach(r => { m[r.loai_chung_chi ?? '?'] = (m[r.loai_chung_chi ?? '?'] ?? 0) + 1 })
    return Object.entries(m).map(([name, value]) => ({ name, value, color: CERT_COLORS[name] ?? '#94A3B8' }))
  }, [examInRange])

  const vocabByLevel = useMemo(() => {
    const m: Record<string, number> = {}
    allVocabProgress.forEach(r => { const lv = r.TuVung?.cap_do ?? 'N/A'; m[lv] = (m[lv] ?? 0) + 1 })
    return m
  }, [allVocabProgress])

  const grammarByLevel = useMemo(() => {
    const total: Record<string, number> = {}, done: Record<string, number> = {}
    allGrammarLessons.forEach(l => { total[l.cap_do ?? '?'] = (total[l.cap_do ?? '?'] ?? 0) + 1 })
    allGrammarProgress.filter(g => g.da_hoan_thanh).forEach(g => {
      const lv = g.BaiHocNguPhap?.cap_do ?? '?'; done[lv] = (done[lv] ?? 0) + 1
    })
    return LEVEL_ORDER.map((lv, i) => ({ lv, color: LEVEL_COLORS[i], done: done[lv] ?? 0, total: total[lv] ?? 0 }))
  }, [allGrammarProgress, allGrammarLessons])

  const radarData = useMemo(() =>
    Object.entries(bySkill).map(([k, v]) => ({ skill: SKILL_META[k]?.label ?? k, diem: pct(v.correct, v.total) }))
  , [bySkill])

  const skillBarData = useMemo(() =>
    Object.entries(bySkill).map(([k, v]) => ({
      skill: SKILL_META[k]?.label ?? k,
      diem: pct(v.correct, v.total),
      color: SKILL_META[k]?.color ?? C.gold,
    }))
  , [bySkill])

  const totalThoiGian      = useMemo(() => recentExams.reduce((s, r) => s + (r.thoi_gian_lam_bai ?? 0), 0), [recentExams])
  const totalThoiGianRange = useMemo(() => examInRange.reduce((s, r) => s + (r.thoi_gian_lam_bai ?? 0), 0), [examInRange])
  const grammarAvg = useMemo(() => {
    const d = allGrammarProgress.filter(g => g.diem_bai_tap != null)
    return d.length ? Math.round(d.reduce((s, g) => s + (g.diem_bai_tap ?? 0), 0) / d.length * 10) : 0
  }, [allGrammarProgress])

  const chatGrouped = useMemo(() => {
    const m: Record<string, number> = {}
    filterByDays(chatHistory, rangeDays).forEach(c => {
      if (!c.created_at) return
      const d = new Date(c.created_at)
      const k = rangeDays <= 30 ? `${d.getDate()}/${d.getMonth() + 1}` : `T${d.getMonth() + 1}`
      m[k] = (m[k] ?? 0) + 1
    })
    return Object.entries(m)
      .sort(([a], [b]) => {
        const parse = (s: string) => {
          if (s.startsWith('T')) return parseInt(s.slice(1)) * 100
          const [d, mo] = s.split('/').map(Number)
          return (mo ?? 0) * 100 + (d ?? 0)
        }
        return parse(a) - parse(b)
      })
      .map(([label, count]) => ({ label, count }))
  }, [chatHistory, rangeDays])

// ✅ Dùng examInRange thay vì recentExams → cập nhật theo range
const hourDist = useMemo(() => {
  const b = Array(24).fill(0).map((_, h) => ({ hour: `${h}h`, count: 0, h }))
  examInRange.forEach(r => { if (r.created_at) b[new Date(r.created_at).getHours()].count++ })
  return b.filter(b => b.h >= 5 && b.h <= 23)
}, [examInRange])  // ← dependency đổi từ recentExams → examInRange

  const streak    = profile?.streak_hien_tai ?? 0
  const streakMax = profile?.streak_cao_nhat ?? 0
  
  const col2 = isSmall ? '1fr' : (isMobile ? '1fr' : '1fr 1fr')
  const col3 = isSmall ? '1fr' : (isMobile ? '1fr' : '1fr 1fr 1fr')
  const col4 = isSmall ? '1fr' : (isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr')

  const axis = { fontSize: 14, fill: C.textMid, fontFamily: "'DM Sans', sans-serif" }
  const ttStyle = {
    background: C.white, border: `1px solid ${C.border}`,
    borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
  }
  const maxHour = Math.max(...hourDist.map(d => d.count))

  // ─── Vocab SRS pie data
  const srsPie = [
    { name: 'Thuần thục', value: totalMastered,  color: C.green   },
    { name: 'Đang học',   value: totalLearning,  color: C.blueLt  },
    { name: 'Cần ôn',     value: totalReview,    color: C.gold    },
    { name: 'Chưa học',   value: totalNew,        color: C.textLt  },
  ].filter(d => d.value > 0)

  return (
  <div style={{
    background: C.bg, minHeight: '100vh',
    fontFamily: "'DM Sans', sans-serif",
  }}>

    <style suppressHydrationWarning dangerouslySetInnerHTML={{
      __html: `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes fadeUp { from { opacity:0;transform:translateY(16px) } to { opacity:1;transform:translateY(0) } }
::-webkit-scrollbar { width: 4px; height: 4px }
::-webkit-scrollbar-thumb { background: rgba(201,168,76,.25); border-radius: 4px }
.recharts-cartesian-grid-horizontal line,
.recharts-cartesian-grid-vertical line { stroke: rgba(15,28,53,.05) !important }
.recharts-tooltip-wrapper { outline: none !important }
.dash-card { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) both }

/* ── BASE SCALE — giống Landing ── */
* { box-sizing: border-box; }
body, .dash-root { font-size: 16px; line-height: 1.7; }

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .dash-grid-4  { grid-template-columns: 1fr 1fr !important; }
  .dash-grid-3  { grid-template-columns: 1fr 1fr !important; }
  .dash-grid-2l { grid-template-columns: 1fr !important; }
  .dash-grid-3l { grid-template-columns: 1fr !important; }
}
@media (max-width: 768px) {
  .dash-grid-4  { grid-template-columns: 1fr 1fr !important; }
  .dash-grid-3  { grid-template-columns: 1fr !important; }
  .dash-grid-2  { grid-template-columns: 1fr !important; }
  .dash-grid-2l { grid-template-columns: 1fr !important; }
  .dash-grid-3l { grid-template-columns: 1fr !important; }
  .dash-hide-mobile { display: none !important; }
  .dash-panel { padding: 18px 16px !important; }
}
  /* Bổ sung responsive cho mobile */
@media (max-width: 768px) {
  .dash-panel { padding: 18px 16px !important; }
  .dash-card { animation-delay: 0ms !important; }
  .recharts-default-tooltip { font-size: 11px !important; padding: 6px 10px !important; }
  .recharts-text { font-size: 11px !important; }
}
@media (max-width: 480px) {
  .dash-range-sel button { padding: 4px 10px !important; font-size: 11px !important; }
  table, td, th { font-size: 11px !important; }
  .recharts-wrapper { margin-left: -8px; }
}
@media (max-width: 480px) {
  .dash-grid-4  { grid-template-columns: 1fr !important; }
  .dash-header-row { flex-direction: column !important; align-items: flex-start !important; }
  .dash-range-sel { width: 100% !important; justify-content: space-between !important; }
  .dash-range-sel button { padding: 6px 10px !important; font-size: 12px !important; }
}
`
      }} />

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px clamp(12px,3vw,32px) 72px' }}>

        {/* ── Header row ── */}
        <div className="dash-header-row" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, marginBottom: 28,
        }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px,2.5vw,32px)', fontWeight: 900, color: C.navy, margin: 0, fontFamily: "'Playfair Display', serif", letterSpacing: '-0.3px' }}>
            Thống kê học tập
          </h1>
          <p style={{ fontSize: 13, color: C.textLt, marginTop: 4, fontWeight: 400 }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

      {/* Range selector */}
      <div className="dash-range-sel" style={{
        display: 'flex', gap: 3, background: C.white,
        borderRadius: 50, padding: 4,
        flexWrap: 'wrap',
        border: `1px solid rgba(201,168,76,.22)`,
        boxShadow: '0 2px 12px rgba(15,28,53,.07)',
        }}>
          {RANGE_OPTS.map(o => (
            <button key={o.key} onClick={() => setRange(o.key)} style={{
              padding: '6px 18px', borderRadius: 50,
              fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              transition: 'all .28s cubic-bezier(.16,1,.3,1)',
              fontFamily: "'DM Sans', sans-serif",
              background: range === o.key ? C.navy : 'transparent',
              color: range === o.key ? '#fff' : C.textMid,
              boxShadow: range === o.key ? '0 2px 10px rgba(15,28,53,.22)' : 'none',
           }}>{o.label}</button>
          ))}
        </div>
        </div>
        {/* ── Personal Roadmap ── */}
        <PersonalRoadmap
        profile={profile}
        totalMastered={totalMastered}
        avgScore={avgScoreAll}
        grammarDoneCount={grammarDoneCount}
        totalGrammar={allGrammarLessons.length}
        />
        {/* ── Due today banner ── */}
        {dueTodayCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 10,
            background: `rgba(0,168,120,.05)`,
            border: `1px solid rgba(0,168,120,.2)`, borderRadius: 20,
            padding: '13px 20px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: `${C.green}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                  <Zap size={26} color={C.green} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.green }}>
                  {dueTodayCount} từ cần ôn tập hôm nay!
                </div>
                <div style={{ fontSize: 15, color: C.textMid, marginTop: 3  }}>
                  Ôn đúng lịch SRS giúp ghi nhớ lâu hơn 60% — đừng bỏ lỡ!
                </div>
              </div>
            </div>
            <Link href="/vocabulary?mode=review" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 20px', borderRadius: 50,
              background: C.green, color: '#fff', fontSize: 13, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: `0 4px 14px rgba(0,168,120,.3)`,
              transition: 'all .28s cubic-bezier(.34,1.56,.64,1)',
            }}>
              Ôn ngay <ChevronRight size={13} />
            </Link>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            SECTION 1 — KPI CARDS (4 cột)
        ═══════════════════════════════════════════════════════════ */}
        <div className="dash-grid-4" style={{ display: 'grid', gridTemplateColumns: col4, gap: 14, marginBottom: 20 }}>
          <div className="dash-card" style={{ animationDelay: '0ms' }}>
            <KpiCard icon={Flame} label="Streak hiện tại" value={`🔥 ${streak}`} suffix="ngày"
            sub={`Kỷ lục cá nhân: ${streakMax} ngày`} color={C.gold} bg={C.goldPale}
            />
          </div>
          <div className="dash-card" style={{ animationDelay: '60ms' }}>
            <KpiCard icon={BookOpen} label="Tổng từ đã học" value={fmt(profile?.tong_so_tu_da_hoc)} suffix="từ"
            sub={`${dueTodayCount} từ đến hạn ôn hôm nay`} color={C.blueLt} bg="#EBF4FF"
            />
          </div>
          <div className="dash-card" style={{ animationDelay: '120ms' }}>
            <KpiCard icon={Target} label={`Điểm TB (${rangeLabel})`} value={avgScoreRange || '—'}
            suffix={avgScoreRange ? '%' : ''} sub={`${examInRange.length} phiên thi`}
            color={C.violet} bg="#F0EFFE"
            />
          </div>
          <div className="dash-card" style={{ animationDelay: '180ms' }}>
            <KpiCard
              icon={Clock} label={`Thời gian (${rangeLabel})`}
              value={fmtH(totalThoiGianRange)}
              sub={`Tổng tất cả: ${fmtH(totalThoiGian)}`}
              color={C.rose} bg="#FEF2F2"
            />
          </div>
        </div>

        {/* ── Row 2: 4 KPI nhỏ hơn ── */}
        <div className="dash-grid-4" style={{ display: 'grid', gridTemplateColumns: col4, gap: 14, marginBottom: 28 }}>
          {[
            { icon: CheckCircle2, label: 'Thuần thục', value: fmt(totalMastered), sub: `${pct(totalMastered, allVocabProgress.length || 1)}% tổng từ`, color: C.green,  bg: '#E6FDF4' },
            { icon: Brain,        label: 'Bài ngữ pháp', value: `${grammarDoneCount}/${allGrammarLessons.length}`, sub: `Điểm TB ${grammarAvg}%`, color: C.violet, bg: '#F0EFFE' },
            { icon: MessageSquare,label: `Câu AI (${rangeLabel})`, value: fmt(chatInRange), sub: `Tổng: ${fmt(chatHistory.length)} lượt`, color: '#06B6D4', bg: '#ECFEFF' },
            { icon: Award,        label: 'Điểm TB tổng', value: `${avgScoreAll}%`, sub: `${recentExams.length} phiên tất cả`, color: C.gold, bg: C.goldPale },
          ].map((item, i) => (
            <div key={i} className="dash-card" style={{ animationDelay: `${240 + i * 60}ms` }}>
              <KpiCard {...item} />
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2 — BIỂU ĐỒ LUYỆN THI (Area + Bar) + AI Insight
        ═══════════════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Area chart: điểm luyện thi */}
          <Panel>
            <SectionHeader icon={TrendingUp} title="Xu hướng luyện thi" sub={`Điểm và số phiên — ${rangeLabel}`} color={C.gold} />
            {examChartData.length === 0
              ? <EmptyChart label="Chưa có phiên thi nào trong kỳ này" href="/exam" />
              : (
                <ResponsiveContainer width="100%" height={isMobile ? 160 : 210}>
                  <ComposedChart data={examChartData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="gExam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.gold} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="l" tick={axis} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <YAxis yAxisId="r" orientation="right" tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area yAxisId="l" type="monotone" dataKey="diemTB" name="Điểm TB(%)"
                      stroke={C.gold} fill="url(#gExam)" strokeWidth={2.5}
                      dot={{ r: 3, fill: C.gold, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: C.gold }}
                    />
                    <Bar yAxisId="r" dataKey="soPhien" name="Số phiên"
                      fill={C.violet} fillOpacity={0.2}
                      radius={[4, 4, 0, 0]} maxBarSize={16}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
          </Panel>

          {/* AI Insight */}
          <AIInsight
            profile={profile} dueToday={dueTodayCount}
            totalMastered={totalMastered} avgScore={avgScoreAll}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3 — TỪ VỰNG (Area chart + Pie SRS + Bar CEFR)
        ═══════════════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Area chart: vocab activity */}
          <Panel>
            <SectionHeader icon={BookOpen} title="Hoạt động từ vựng" sub={`Từ mới · Ôn tập · Thuần thục — ${rangeLabel}`} color={C.blueLt} />
            {vocabChartData.length === 0
              ? <EmptyChart label="Chưa có dữ liệu từ vựng" href="/vocabulary" />
              : (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={vocabChartData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      {[
                        { id: 'vHoc', c: C.blueLt },
                        { id: 'vOn',  c: C.gold   },
                        { id: 'vTT',  c: C.greenLt},
                      ].map(g => (
                        <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={g.c} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={g.c} stopOpacity={0}   />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false}
                      interval={Math.ceil(vocabChartData.length / 8)} />
                    <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={7}
                    wrapperStyle={{ fontSize: 12, color: C.textMid, fontFamily: "'DM Sans', sans-serif" }}
                    />
                    <Area type="monotone" dataKey="hoc"       name="Từ mới"     stroke={C.blueLt}  fill="url(#vHoc)" strokeWidth={2} />
                    <Area type="monotone" dataKey="onTap"     name="Ôn tập"     stroke={C.gold}    fill="url(#vOn)"  strokeWidth={2} />
                    <Area type="monotone" dataKey="thuanThuc" name="Thuần thục" stroke={C.greenLt} fill="url(#vTT)"  strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
          </Panel>

          {/* Pie: SRS health */}
          <Panel>
            <SectionHeader icon={Activity} title="Sức khoẻ SRS" sub="Phân bổ trạng thái kho từ" color={C.greenLt} />
            {srsPie.length === 0
              ? <EmptyChart label="Chưa có dữ liệu SRS" href="/vocabulary" />
              : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={srsPie} cx="50%" cy="50%"
                        innerRadius={38} outerRadius={58}
                        dataKey="value" paddingAngle={4} strokeWidth={0}
                      >
                        {srsPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${fmt(v as number)} từ`, n]} contentStyle={ttStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
                    {srsPie.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                          <span style={{ fontSize: 12, color: C.textMid }}>{d.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 40, height: 3, background: `${C.navy}08`, borderRadius: 2 }}>
                            <div style={{
                              width: `${pct(d.value, allVocabProgress.length || 1)}%`,
                              height: '100%', background: d.color, borderRadius: 2,
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: d.color, minWidth: 36, textAlign: 'right' }}>
                            {fmt(d.value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </Panel>
        </div>

        {/* ── Bar: từ vựng theo CEFR ── */}
       <div className="dash-grid-2" style={{ display: 'grid', gridTemplateColumns: col2, gap: 18, marginBottom: 18 }}>
          <Panel>
            <SectionHeader icon={BookMarked} title="Từ vựng theo cấp CEFR" sub="Số từ đã học ở từng cấp độ" color={C.green} />
            <ResponsiveContainer width="100%" height={170}>
              <BarChart
                data={LEVEL_ORDER.map((lv, i) => ({ lv, soTu: vocabByLevel[lv] ?? 0, color: LEVEL_COLORS[i] }))}
                margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="lv" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, n) => [`${fmt(v as number)} từ`, 'Từ vựng']} contentStyle={ttStyle} />
                <Bar dataKey="soTu" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {LEVEL_ORDER.map((_, i) => <Cell key={i} fill={LEVEL_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
              {LEVEL_ORDER.map((lv, i) => (
                <div key={lv} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textMid }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: LEVEL_COLORS[i] }} />
                  {lv}: <span style={{ color: C.navy, fontWeight: 700 }}>{fmt(vocabByLevel[lv] ?? 0)}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Radar: kỹ năng */}
          <Panel>
            <SectionHeader icon={BarChart2} title="Radar kỹ năng" sub="% đúng trung bình theo kỹ năng" color={C.violet} />
            {radarData.length < 2
             ? <EmptyChart label="Cần ít nhất 2 kỹ năng để hiển thị radar" href="/exam" />
              : (
                <ResponsiveContainer width="100%" height={210}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={`${C.navy}0A`} />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: C.textMid, fontFamily: "'DM Sans', sans-serif" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: C.textLt }} tickCount={4} />
                    <Radar name="Điểm TB" dataKey="diem"
                      stroke={C.gold} fill={C.gold} fillOpacity={0.12}
                      strokeWidth={2} dot={{ r: 3, fill: C.gold, strokeWidth: 0 }}
                    />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Điểm TB']} contentStyle={ttStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
          </Panel>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 4 — KỸ NĂNG (Bar ngang) + CHỨNG CHỈ (Pie)
        ═══════════════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 16, marginBottom: 16 }}>

          {/* Bar ngang: điểm theo kỹ năng */}
          <Panel>
            <SectionHeader icon={Activity} title="Điểm theo kỹ năng" sub={`Chi tiết từng kỹ năng — ${rangeLabel}`} color={C.violet} />
            {Object.keys(bySkill).length === 0
              ? <EmptyChart label="Chưa có dữ liệu luyện thi" href="/exam" />
              : (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(160, Object.keys(bySkill).length * 52 + 30)}>
                    <BarChart
                      layout="vertical"
                      data={skillBarData}
                      margin={{ top: 0, right: 48, bottom: 0, left: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={axis} axisLine={false} tickLine={false}
                        tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="skill"
                        tick={{ ...axis, fill: C.text, fontSize: 12 }}
                        axisLine={false} tickLine={false} width={62}
                      />
                      <Tooltip formatter={(v: number) => [`${v}%`, 'Điểm TB']} contentStyle={ttStyle} />
                      <Bar dataKey="diem" name="Điểm TB" radius={[0, 6, 6, 0]} maxBarSize={22}>
                        {skillBarData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {Object.entries(bySkill).map(([k, v]) => {
                      const meta = SKILL_META[k], sc = pct(v.correct, v.total)
                      return (
                        <div key={k} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', borderRadius: 10,
                          border: `1px solid ${C.border}`,
                          background: scoreBg(sc),
                        }}>
                          {meta && (
                            <div style={{
                              width: 40, height: 40, borderRadius: 10, background: meta.bg,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                              <meta.Icon size={20} color={meta.color} />
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{meta?.label ?? k}</div>
                            <div style={{ fontSize: 14, color: C.textMid }}>
                              {v.correct}/{v.total} câu · {v.count} phiên · {Math.round(v.thoiGian / 60)}p
                            </div>
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 900, color: scoreColor(sc), fontFamily: "'Playfair Display', serif" }}>{sc}%</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
          </Panel>

          {/* Pie: chứng chỉ + Pie: phân bổ thời gian */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Panel>
              <SectionHeader icon={Award} title="Phân bổ chứng chỉ" sub="Số phiên theo loại chứng chỉ" color={C.goldLt} />
              {certPie.length === 0
                ? <EmptyChart label="Chưa có dữ liệu" href="/exam" />
                : (
                  <>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={certPie} cx="50%" cy="50%"
                          innerRadius={32} outerRadius={50}
                          dataKey="value" paddingAngle={5} strokeWidth={0}
                        >
                          {certPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v} phiên`, n]} contentStyle={ttStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {certPie.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                            <span style={{ fontSize: 12, color: C.textMid }}>{d.name}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
            </Panel>

            {/* Top/worst exam */}
            <Panel>
              <SectionHeader icon={Star} title="Điểm nổi bật" sub={rangeLabel} color={C.green} />
              {(() => {
                if (!examInRange.length) return (
                  <div style={{ fontSize: 13, color: C.textMid, textAlign: 'center', padding: '16px 0' }}>
                    Chưa có phiên nào
                  </div>
                )
                const best  = examInRange.reduce((b, r) => pct(r.so_cau_dung, r.tong_so_cau) > pct(b.so_cau_dung, b.tong_so_cau) ? r : b, examInRange[0])
                const worst = examInRange.reduce((w, r) => pct(r.so_cau_dung, r.tong_so_cau) < pct(w.so_cau_dung, w.tong_so_cau) ? r : w, examInRange[0])
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: '🏆 Cao nhất', exam: best, color: C.green },
                      { label: '📉 Thấp nhất', exam: worst, color: C.rose },
                    ].map(({ label, exam, color }, i) => {
                      const sc = pct(exam.so_cau_dung, exam.tong_so_cau)
                      const meta = SKILL_META[exam.ky_nang ?? '']
                      return (
                        <div key={i} style={{
                          padding: '10px 12px', borderRadius: 10,
                          background: `${color}08`, border: `1px solid ${color}18`,
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
                                {meta?.label ?? exam.ky_nang} · {exam.loai_chung_chi}
                              </div>
                              <div style={{ fontSize: 14, color: C.textMid }}>
                                {exam.so_cau_dung}/{exam.tong_so_cau} câu đúng
                              </div>
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 800, color }}>{sc}%</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </Panel>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 5 — NGỮ PHÁP
        ═══════════════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 16, marginBottom: 16 }}>

          {/* Progress bars ngữ pháp */}
          <Panel>
            <SectionHeader icon={Brain} title="Tiến độ ngữ pháp" sub={`${grammarDoneCount}/${allGrammarLessons.length} bài · Điểm TB ${grammarAvg}%`} color={C.violet} />
            {grammarByLevel.map(lv => (
              <ProgRow key={lv.lv} label={lv.lv} done={lv.done} total={lv.total} color={lv.color} />
            ))}
            <div style={{
              marginTop: 14, padding: '10px 13px',
              background: C.goldPale, borderRadius: 10,
              border: `1px solid ${C.gold}20`,
              fontSize: 14, color: C.text, lineHeight: 1.75,
            }}>
              💡 Điểm TB ngữ pháp: <strong style={{ color: scoreColor(grammarAvg) }}>{grammarAvg}%</strong>
              &ensp;·&ensp;
              {allGrammarProgress.filter(g => g.da_hoan_thanh && (g.diem_bai_tap ?? 0) >= 8).length} bài xuất sắc (≥8/10)
            </div>
          </Panel>

          {/* Bar chart: điểm ngữ pháp theo CEFR */}
          <Panel>
            <SectionHeader icon={BarChart2} title="Điểm ngữ pháp theo CEFR" sub="Điểm TB bài tập từng cấp" color={C.blue} />
 {(() => {
  const grammarChartData = grammarByLevel.filter(g => g.done > 0).map(g => {
    const d = allGrammarProgress.filter(p => p.da_hoan_thanh && p.BaiHocNguPhap?.cap_do === g.lv && p.diem_bai_tap != null)
    return {
      lv: g.lv, color: g.color,
      diemTB: d.length ? Math.round(d.reduce((s, p) => s + (p.diem_bai_tap ?? 0), 0) / d.length * 10) : 0,
    }
  })
  if (grammarChartData.length === 0) {
    return <EmptyChart label="Chưa có bài ngữ pháp nào hoàn thành" href="/grammar" />
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={grammarChartData}
        margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="lv" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} width={42} />
        <Tooltip formatter={(v: number) => [`${v}%`, 'Điểm TB']} contentStyle={ttStyle} />
        <Bar dataKey="diemTB" name="Điểm TB" radius={[6, 6, 0, 0]} maxBarSize={50}>
          {LEVEL_ORDER.map((_, i) => <Cell key={i} fill={LEVEL_COLORS[i]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
})()}

            {/* Lịch sử bài học */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textMid, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Gần đây
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...allGrammarProgress]
                  .filter(g => g.da_hoan_thanh)
                  .sort((a, b) => (b.ngay_hoan_thanh ?? '').localeCompare(a.ngay_hoan_thanh ?? ''))
                  .slice(0, 4).map((g, i) => {
                    const lv = g.BaiHocNguPhap?.cap_do
                    const lc = LEVEL_COLORS[LEVEL_ORDER.indexOf(lv ?? '')] ?? C.textLt
                    const sc2 = scoreColor((g.diem_bai_tap ?? 0) * 10)
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 9,
                        padding: '8px 11px', borderRadius: 9, border: `1px solid ${C.border}`,
                      }}>
                        <CheckCircle2 size={12} color={C.green} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 16, color: C.navy, fontWeight: 600,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{g.BaiHocNguPhap?.tieu_de ?? 'Bài học'}</div>
                          <div style={{ fontSize: 14, color: C.textLt }}>{g.BaiHocNguPhap?.danh_muc}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {lv && (
                            <span style={{
                              padding: '2px 6px', borderRadius: 4,
                              background: `${lc}12`, border: `1px solid ${lc}22`,
                              fontSize: 12, fontWeight: 700, color: lc,
                            }}>{lv}</span>
                          )}
                          {g.diem_bai_tap != null && (
                            <span style={{ fontSize: 15, fontWeight: 700, color: sc2 }}>
                              {g.diem_bai_tap}/10
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </Panel>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 6 — THỜI GIAN & HOẠT ĐỘNG
        ═══════════════════════════════════════════════════════════ */}
        <div className="dash-grid-3l" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 18, marginBottom: 18 }}>
          {/* Bar: phút học theo kỳ */}
          <Panel>
            <SectionHeader icon={Clock} title="Phút học" sub={`Thời gian luyện thi — ${rangeLabel}`} color={C.rose} />
            {examChartData.length === 0
              ? <EmptyChart label="Chưa có dữ liệu" href="/exam" />
              : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={examChartData} margin={{ top: 5, right: 5, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                    <YAxis tick={axis} axisLine={false} tickLine={false} unit="p" allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [`${v} phút`, 'Thời gian']} contentStyle={ttStyle} />
                    <Bar dataKey="thoiGian" name="Thời gian" fill={C.rose} fillOpacity={0.7}
                      radius={[5, 5, 0, 0]} maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
          </Panel>

          {/* Bar: khung giờ học */}
          <Panel>
            <SectionHeader icon={Calendar} title="Khung giờ học" sub="Số phiên thi theo giờ trong ngày" color={C.navy} />
            {hourDist.every(h => h.count === 0)
              ? <EmptyChart label="Chưa có dữ liệu" href="/exam" />
              : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={hourDist} margin={{ top: 5, right: 5, bottom: 0, left: -28 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hour" tick={axis} axisLine={false} tickLine={false} interval={2} />
                      <YAxis hide />
<Tooltip formatter={(v: number) => [`${v} phiên`, 'Số phiên']} contentStyle={ttStyle} />
<Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={22}>
  {hourDist.map((h, i) => (
    <Cell key={i}
      fill={h.count === maxHour && maxHour > 0 ? C.gold : C.navy}
      fillOpacity={h.count === maxHour && maxHour > 0 ? 0.85 : 0.16}
    />
  ))}
  <LabelList
    dataKey="count"
    position="top"
    formatter={(v: number) => v > 0 ? v : ''}
    style={{ fontSize: 11, fill: C.textMid, fontFamily: "'DM Sans', sans-serif" }}
  />
</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ fontSize: 14, color: C.textMid, marginTop: 10 }}>
                    {(() => {
                      const p = hourDist.reduce((a, b) => b.count > a.count ? b : a, hourDist[0])
                      return p?.count > 0
                        ? `🏆 Hay học nhất: ${p.hour} (${p.count} phiên)`
                        : ''
                    })()}
                  </div>
                </>
              )}
          </Panel>

          {/* Area: AI chat */}
          <Panel>
            <SectionHeader icon={MessageSquare} title="Tần suất AI chat" sub={`Lượt hỏi theo thời gian — ${rangeLabel}`} color="#06B6D4" />
            {chatGrouped.length === 0
              ? (
                <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <MessageSquare size={26} color={C.textLt} opacity={0.5} />
                  <div style={{ fontSize: 15, color: C.textMid }}>Chưa sử dụng AI</div>
                  <Link href="/ai-chat" style={{ fontSize: 14, color: '#06B6D4', fontWeight: 700, textDecoration: 'none' }}>
                    Chat ngay →
                  </Link>
                </div>
              )
              : (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chatGrouped} margin={{ top: 5, right: 5, bottom: 0, left: -24 }}>
                    <defs>
                      <linearGradient id="gChat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                    <YAxis tick={axis} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [`${v} câu`, 'Hỏi AI']} contentStyle={ttStyle} />
                    <Area type="monotone" dataKey="count" name="Hỏi AI"
                      stroke="#06B6D4" fill="url(#gChat)" strokeWidth={2}
                      dot={{ r: 3, fill: '#06B6D4', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
          </Panel>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 7 — HEATMAP 52 TUẦN
        ═══════════════════════════════════════════════════════════ */}
        <Panel style={{ marginBottom: 16 }}>
          <SectionHeader icon={Calendar} title="Lịch học 52 tuần qua" sub="Vòng tròn vàng = hôm nay" color={C.gold} />
          <Heatmap streakDates={streakDates} streakDatesArr={streakDatesArr} />
        </Panel>

        {/* ══════════════════════════════════════════════════════════
            SECTION 8 — BẢNG LỊCH SỬ PHIÊN THI
        ═══════════════════════════════════════════════════════════ */}
        <Panel style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
           <SectionHeader
           icon={FileText}
           title="Lịch sử phiên thi"
           sub={`${examInRange.length} phiên — ${rangeLabel}${recentExams.length > 12 ? ` (hiển thị 12/${recentExams.length})` : ''}`}
           color={C.navy}
           />
            <Link href="/exam" style={{
              fontSize: 12, color: C.gold, fontWeight: 700, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Xem tất cả <ChevronRight size={12} />
            </Link>
          </div>
          {recentExams.length === 0
            ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: C.textMid, fontSize: 13 }}>
                Chưa có phiên nào.{' '}
                <Link href="/exam" style={{ color: C.gold, fontWeight: 700 }}>Luyện ngay →</Link>
              </div>
            )
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Kỹ năng', 'Chứng chỉ', 'Đúng/Tổng', 'Tỷ lệ', 'Thời gian', 'Ngày thi'].map((h, i) => (
                        <th key={i} style={{
                          textAlign: 'left', padding: '10px 14px',
                          color: C.textMid, fontWeight: 600,
                          borderBottom: `2px solid rgba(201,168,76,.2)`,
                          fontSize: 13, letterSpacing: '0.8px', textTransform: 'uppercase',
                          whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif",
                          background: '#FDFAF3',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentExams.slice(0, 12).map((r, i) => {
                      const sc = pct(r.so_cau_dung, r.tong_so_cau)
                      const sc2 = scoreColor(sc)
                      const meta = SKILL_META[r.ky_nang ?? '']
                      const certColor = CERT_COLORS[r.loai_chung_chi ?? ''] ?? C.textLt
                      return (
                        <tr key={i}
                          style={{ borderBottom: `1px solid ${C.border}`, transition: 'background .12s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {meta && (
                                <div style={{
                                  width: 34, height: 34, borderRadius: 9, background: meta.bg,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <meta.Icon size={17} color={meta.color} />
                                </div>
                              )}
                              <span style={{ color: C.navy, fontWeight: 600 }}>{meta?.label ?? r.ky_nang}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              display: 'inline-flex', padding: '2px 8px', borderRadius: 5,
                              background: `${certColor}12`, border: `1px solid ${certColor}25`,
                              fontSize: 11, fontWeight: 700, color: certColor,
                            }}>{r.loai_chung_chi ?? '?'}</span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ color: sc2, fontWeight: 800 }}>{r.so_cau_dung}</span>
                            <span style={{ color: C.textLt }}>/{r.tong_so_cau}</span>
                          </td>
                          <td style={{ padding: '10px 12px', minWidth: 110 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 5, background: `${C.navy}08`, borderRadius: 3 }}>
                                <div style={{ width: `${sc}%`, height: '100%', background: sc2, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 700, color: sc2, minWidth: 32 }}>{sc}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', color: C.textMid, fontSize: 13 }}>
                            {r.thoi_gian_lam_bai ? `${Math.round(r.thoi_gian_lam_bai / 60)}p` : '—'}
                          </td>
                          <td style={{ padding: '10px 14px', color: C.textMid, fontSize: 13, whiteSpace: 'nowrap' }}>
                            {r.created_at
                              ? new Date(r.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </Panel>

        {/* ── Shortcut buttons ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10 }}>
          {[
            { href: '/vocabulary', Icon: BookOpen,      label: 'Học từ vựng',  desc: 'SRS thông minh',     color: C.greenLt },
            { href: '/grammar',    Icon: Brain,          label: 'Ngữ pháp',     desc: 'A1 → C2 đầy đủ',    color: C.violet  },
            { href: '/exam',       Icon: FileText,       label: 'Luyện thi',    desc: 'VSTEP · TOEIC · APTIS', color: C.gold  },
            { href: '/ai-chat',    Icon: MessageSquare,  label: 'AI Chatbot',   desc: 'Luyện nói 24/7',     color: '#06B6D4' },
          ].map(m => (
            <Link key={m.href} href={m.href} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px',
              borderRadius: 16, background: C.white,
              border: '1px solid rgba(201,168,76,.18)',
              boxShadow: '0 2px 8px rgba(15,28,53,.06)',
              textDecoration: 'none',
              transition: 'all .28s cubic-bezier(.16,1,.3,1)',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = `${m.color}08`
                el.style.borderColor = `${m.color}30`
                el.style.transform = 'translateY(-2px)'
                el.style.boxShadow = `0 6px 20px ${m.color}20`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = C.white
                el.style.borderColor = C.border
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: `${m.color}12`, border: `1px solid ${m.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <m.Icon size={20} color={m.color} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.navy,fontFamily: "'DM Sans', sans-serif" }}>{m.label}</div>
                <div style={{ fontSize: 14, color: C.textMid, marginTop: 4 }}>{m.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}