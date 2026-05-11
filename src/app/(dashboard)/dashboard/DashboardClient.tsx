'use client'

// ─────────────────────────────────────────────────────────────────────────────
// DashboardClient.tsx — EnglishHub · CEO-grade Analytics Dashboard
// Tông màu: Navy #0F1C35 / Gold #C9A84C — đồng bộ Landing page
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart,
} from 'recharts'
import {
  type LucideIcon,
  Flame, BookOpen, CheckCircle2, Target, TrendingUp, TrendingDown,
  Minus, Brain, Mic, Headphones, PenLine, Eye, BarChart2,
  Award, Zap, ChevronRight, RefreshCw, Calendar,
  AlertCircle, Loader2, GraduationCap, Activity, Star,
  ArrowUpRight, ArrowDownRight, Sparkles, BookMarked,
  FileText, MessageSquare, Menu, X, Clock,
  Layers, Trophy, LayoutDashboard,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  ho_ten?: string
  streak_hien_tai?: number
  streak_cao_nhat?: number
  tong_so_tu_da_hoc?: number
  muc_tieu_hoc?: string
  trinh_do_hien_tai?: string
  diem_yeu?: string
  [k: string]: unknown
}
interface VocabRow {
  trang_thai?: string | null
  ngay_on_tiep_theo?: string | null
  lan_cuoi_on?: string | null
  TuVung?: { tu_tieng_anh?: string; cap_do?: string } | null
  [k: string]: unknown
}
interface ExamRow {
  id?: string
  ky_nang?: string
  loai_chung_chi?: string
  so_cau_dung?: number
  tong_so_cau?: number
  thoi_gian_lam_bai?: number
  created_at?: string
}
interface GrammarProgressRow {
  da_hoan_thanh?: boolean
  diem_bai_tap?: number | null
  ngay_hoan_thanh?: string | null
  BaiHocNguPhap?: { tieu_de?: string; cap_do?: string; danh_muc?: string } | null
}
interface GrammarLessonRow { cap_do?: string | null }
interface ChatRow { created_at?: string }
interface Props {
  userId: string
  profile: Profile | null
  allVocabProgress: VocabRow[]
  dueTodayCount: number
  totalMastered: number
  totalLearning: number
  totalReview: number
  totalNew: number
  streakDatesArr: string[]
  recentExams: ExamRow[]
  avgScoreAll: number
  allGrammarProgress: GrammarProgressRow[]
  allGrammarLessons: GrammarLessonRow[]
  grammarDoneCount: number
  chatHistory: ChatRow[]
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  navy:    '#0F1C35',
  navyMid: '#162444',
  navyLg:  '#1E2F50',
  gold:    '#C9A84C',
  goldLt:  '#E8C97A',
  green:   '#00A878',
  greenLt: '#4ECBA8',
  violet:  '#6478F0',
  rose:    '#F06464',
  border:  'rgba(201,168,76,0.18)',
}

// ─── Constants ────────────────────────────────────────────────────────────────
const RANGE_OPTS = [
  { key: 'week',    label: 'Tuần',   days: 7   },
  { key: 'month',   label: 'Tháng',  days: 30  },
  { key: 'quarter', label: 'Quý',    days: 90  },
  { key: 'year',    label: 'Năm',    days: 365 },
]

const SKILL_META: Record<string, { label: string; Icon: LucideIcon; color: string }> = {
  NGHE:     { label: 'Nghe',     Icon: Headphones, color: '#38bdf8' },
  DOC:      { label: 'Đọc',      Icon: Eye,        color: T.greenLt },
  VIET:     { label: 'Viết',     Icon: PenLine,    color: T.gold    },
  NOI:      { label: 'Nói',      Icon: Mic,        color: T.violet  },
  TU_VUNG:  { label: 'Từ vựng',  Icon: BookOpen,   color: '#f472b6' },
  NGU_PHAP: { label: 'Ngữ pháp', Icon: Brain,      color: '#22d3ee' },
}

const CERT_COLORS: Record<string, string> = {
  VSTEP: T.greenLt, TOEIC: T.gold, APTIS: T.violet,
}

const LEVEL_ORDER  = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LEVEL_COLORS = ['#64748b', '#38bdf8', T.greenLt, T.gold, T.violet, T.rose]

// ─── Utils ────────────────────────────────────────────────────────────────────
const pct  = (n?: number, d?: number) => (d ? Math.round(((n ?? 0) / d) * 100) : 0)
const fmt  = (n?: number) => (n ?? 0).toLocaleString('vi-VN')
const fmtH = (s: number) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h${m}p` : `${m}p`
}

function scoreColor(s: number) {
  if (s >= 80) return T.greenLt
  if (s >= 60) return T.gold
  return T.rose
}

function filterByDays<R extends { created_at?: string }>(rows: R[], days: number): R[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return rows.filter(r => r.created_at && new Date(r.created_at) >= cutoff)
}

function groupExamsByTime(rows: ExamRow[], days: number) {
  const filtered = filterByDays(rows, days)
  const map: Record<string, { label: string; soPhien: number; totalScore: number; thoiGian: number }> = {}
  filtered.forEach(r => {
    const d = new Date(r.created_at!)
    let key: string
    if (days <= 7)       key = d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' })
    else if (days <= 30) key = `${d.getDate()}/${d.getMonth() + 1}`
    else if (days <= 90) key = `T${d.getMonth() + 1} W${Math.ceil(d.getDate() / 7)}`
    else                 key = `Th${d.getMonth() + 1}`
    if (!map[key]) map[key] = { label: key, soPhien: 0, totalScore: 0, thoiGian: 0 }
    map[key].soPhien++
    map[key].totalScore += pct(r.so_cau_dung, r.tong_so_cau)
    map[key].thoiGian   += r.thoi_gian_lam_bai ?? 0
  })
  return Object.values(map).map(g => ({
    label:    g.label,
    soPhien:  g.soPhien,
    diemTB:   g.soPhien ? Math.round(g.totalScore / g.soPhien) : 0,
    thoiGian: Math.round(g.thoiGian / 60),
  }))
}

function groupVocabActivity(rows: VocabRow[]) {
  const map: Record<string, { label: string; hoc: number; onTap: number; thuanThuc: number }> = {}
  rows.forEach(r => {
    const d = r.lan_cuoi_on ?? r.ngay_on_tiep_theo
    if (!d) return
    const key = String(d).slice(5)
    if (!map[key]) map[key] = { label: key.replace('-', '/'), hoc: 0, onTap: 0, thuanThuc: 0 }
    if (r.trang_thai === 'moi' || r.trang_thai === 'dang_hoc') map[key].hoc++
    else if (r.trang_thai === 'on_tap') map[key].onTap++
    else if (r.trang_thai === 'thuan_thuc') map[key].thuanThuc++
  })
  return Object.values(map).slice(-30)
}

function hourDistribution(rows: ExamRow[]) {
  const buckets = Array(24).fill(0).map((_, h) => ({ hour: `${h}h`, count: 0, h }))
  rows.forEach(r => {
    if (r.created_at) buckets[new Date(r.created_at).getHours()].count++
  })
  return buckets.filter(b => b.h >= 5 && b.h <= 23)
}

function weeklyHeatmap(streakDates: Set<string>) {
  const today = new Date()
  const weeks: { key: string; active: boolean; isThisWeek: boolean }[][] = []
  let week: { key: string; active: boolean; isThisWeek: boolean }[] = []
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    week.push({ key, active: streakDates.has(key), isThisWeek: i < 7 })
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length) weeks.push(week)
  return weeks
}

// ─── Gold Tooltip ─────────────────────────────────────────────────────────────
function GoldTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: T.navy, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 8px 32px rgba(15,28,53,0.7)',
      fontFamily: "'DM Sans',sans-serif",
    }}>
      <div style={{ color: T.gold, marginBottom: 6, fontWeight: 700, fontSize: 10, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>{p.name}:</span>
          <span style={{ color: '#fff', fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, note, trend, color, sub }: {
  icon: LucideIcon; label: string; value: string; note?: string
  trend?: number; color: string; sub?: string
}) {
  const TIcon = trend === undefined ? null : trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus
  const tc    = trend === undefined ? '' : trend > 0 ? T.greenLt : trend < 0 ? T.rose : '#64748b'
  return (
    <div style={{
      background: `linear-gradient(145deg,${T.navyMid},${T.navyLg})`,
      border: `1px solid ${T.border}`, borderRadius: 16,
      padding: 'clamp(14px,2.5vw,20px)', position: 'relative', overflow: 'hidden',
      transition: 'transform .2s,box-shadow .2s', cursor: 'default',
      fontFamily: "'DM Sans',sans-serif",
    }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = `0 16px 48px rgba(201,168,76,0.1)` }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
    >
      {/* Gold accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)`, opacity: 0.8 }} />
      {/* Glow orb */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.06, filter: 'blur(20px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}14`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        {TIcon && trend !== undefined && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: tc, background: `${tc}14`, padding: '3px 7px', borderRadius: 5 }}>
            <TIcon size={11} />{Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 5, fontWeight: 600 }}>{label}</div>
      {note && <div style={{ fontSize: 10, color: `${color}99`, marginTop: 4 }}>{note}</div>}
      {sub  && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: `linear-gradient(145deg,${T.navyMid},${T.navyLg})`,
      border: `1px solid ${T.border}`, borderRadius: 16,
      padding: 'clamp(14px,2.5vw,20px)',
      fontFamily: "'DM Sans',sans-serif",
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Card heading ─────────────────────────────────────────────────────────────
function CardHead({ icon: Icon, title, sub, action, color = T.gold }: {
  icon: LucideIcon; title: string; sub?: string; action?: React.ReactNode; color?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}14`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{title}</div>
          {sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {action}
    </div>
  )
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 5,
      background: `${color}18`, border: `1px solid ${color}35`,
      fontSize: 10, fontWeight: 700, color, letterSpacing: '0.3px',
      fontFamily: "'DM Sans',sans-serif",
    }}>{label}</span>
  )
}

// ─── Range Bar ────────────────────────────────────────────────────────────────
function RangeBar({ value, onChange }: { value: string; onChange: (r: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: 3, border: `1px solid ${T.border}` }}>
      {RANGE_OPTS.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{
          padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700,
          border: 'none', cursor: 'pointer', transition: 'all .15s',
          background: value === o.key ? T.gold : 'transparent',
          color:      value === o.key ? T.navy : 'rgba(255,255,255,0.4)',
          fontFamily: "'DM Sans',sans-serif",
        }}>{o.label}</button>
      ))}
    </div>
  )
}

// ─── Progress Row ─────────────────────────────────────────────────────────────
function ProgressRow({ label, done, total, color }: { label: string; done: number; total: number; color: string }) {
  const p = pct(done, total || 1)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Pill label={label} color={color} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{done}/{total} bài</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color, fontFamily: "'DM Mono',monospace" }}>{p}%</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
        <div style={{ width: `${p}%`, height: '100%', background: `linear-gradient(90deg,${color}88,${color})`, borderRadius: 3, transition: 'width .8s ease', boxShadow: `0 0 8px ${color}44` }} />
      </div>
    </div>
  )
}

// ─── 52-week Activity Heatmap ─────────────────────────────────────────────────
function ActivityHeatmap({ streakDates, streakDatesArr }: { streakDates: Set<string>; streakDatesArr: string[] }) {
  const weeks = useMemo(() => weeklyHeatmap(streakDates), [streakDates])
  const activeDays = streakDates.size
  const longestStreak = useMemo(() => {
    if (!streakDatesArr.length) return 0
    const sorted = [...streakDatesArr].sort()
    let max = 1, cur = 1
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i-1]).getTime()) / 86400000
      cur = diff === 1 ? cur + 1 : 1
      max = Math.max(max, cur)
    }
    return max
  }, [streakDatesArr])

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 3, minWidth: 580 }}>
          {weeks.map((wk, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {wk.map((c, di) => (
                <div key={di} title={c.key} style={{
                  width: 11, height: 11, borderRadius: 2,
                  background: c.active
                    ? c.isThisWeek ? T.gold : 'rgba(201,168,76,0.6)'
                    : 'rgba(255,255,255,0.04)',
                  border: c.isThisWeek && c.active ? `1px solid ${T.gold}` : '1px solid transparent',
                  transition: 'transform .1s', cursor: 'default',
                  boxShadow: c.active ? `0 0 4px rgba(201,168,76,0.25)` : 'none',
                }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.5)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Ít</span>
          {[0.1, 0.3, 0.5, 0.7, 0.95].map((o, i) => (
            <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: `rgba(201,168,76,${o})` }} />
          ))}
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Nhiều</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.gold, fontFamily: "'DM Mono',monospace" }}>{activeDays}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Ngày hoạt động</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.greenLt, fontFamily: "'DM Mono',monospace" }}>{longestStreak}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Streak dài nhất</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AI Insight ───────────────────────────────────────────────────────────────
function AIInsight({ profile, dueToday, totalMastered, avgScore }: {
  profile: Profile | null; dueToday: number; totalMastered: number; avgScore: number
}) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const run = useCallback(async () => {
    if (loading || !profile) return
    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Bạn là gia sư AI chuyên nghiệp cho sinh viên học tiếng Anh tên ${profile.ho_ten}.
Dữ liệu: Mục tiêu ${profile.muc_tieu_hoc} | Trình độ ${profile.trinh_do_hien_tai} | Streak ${profile.streak_hien_tai} ngày | Từ thuần thục ${totalMastered} | Cần ôn hôm nay ${dueToday} | Điểm TB thi ${avgScore}% | Điểm yếu ${profile.diem_yeu ?? 'chưa rõ'}.
Đưa ra đúng 3 nhận xét sắc bén (mỗi cái 1 dòng, bắt đầu bằng emoji phù hợp) và 1 mục tiêu tuần in đậm (**...**). Tối đa 120 từ tiếng Việt, văn phong chuyên gia giáo dục.`,
          }],
        }),
      })
      const data = await res.json()
      setText(data.content?.map((b: { text?: string }) => b.text || '').join('') || '...')
      setDone(true)
    } catch {
      setText('Không kết nối được AI. Vui lòng thử lại.')
      setDone(true)
    } finally {
      setLoading(false)
    }
  }, [loading, profile, dueToday, totalMastered, avgScore])

  return (
    <Card style={{ background: `linear-gradient(145deg,rgba(201,168,76,0.05),${T.navyLg})`, borderColor: 'rgba(201,168,76,0.28)' }}>
      <CardHead icon={Sparkles} title="AI Insight" sub="Phân tích cá nhân hoá từ dữ liệu thực" color={T.gold} />
      {!done ? (
        <div style={{ textAlign: 'center', padding: '18px 0' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${T.gold}12`, border: `1px solid ${T.gold}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Sparkles size={20} color={T.gold} />
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 14, lineHeight: 1.7 }}>
            AI phân tích toàn bộ dữ liệu học tập<br />và đưa ra lời khuyên cá nhân hóa
          </p>
          <button onClick={run} disabled={loading} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 20px', borderRadius: 50,
            background: loading ? `${T.gold}14` : T.gold,
            border: 'none', color: loading ? T.gold : T.navy,
            fontSize: 12, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            fontFamily: "'DM Sans',sans-serif", transition: 'all .2s',
          }}>
            {loading
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Đang phân tích...</>
              : <><Sparkles size={13} /> Phân tích ngay</>
            }
          </button>
        </div>
      ) : (
        <div>
          <div style={{
            fontSize: 12.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.9,
            whiteSpace: 'pre-line', background: 'rgba(201,168,76,0.04)',
            borderRadius: 10, padding: '12px 14px', border: `1px solid rgba(201,168,76,0.12)`,
          }}>{text}</div>
          <button onClick={() => { setDone(false); setText('') }} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            marginTop: 9, padding: '4px 10px', borderRadius: 6,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.3)', fontSize: 10, cursor: 'pointer',
            fontFamily: "'DM Sans',sans-serif",
          }}>
            <RefreshCw size={10} /> Làm mới
          </button>
        </div>
      )}
    </Card>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Tổng quan',  Icon: LayoutDashboard },
  { key: 'vocab',    label: 'Từ vựng',    Icon: BookOpen        },
  { key: 'exam',     label: 'Luyện thi',  Icon: FileText        },
  { key: 'grammar',  label: 'Ngữ pháp',   Icon: Brain           },
  { key: 'time',     label: 'Thời gian',  Icon: Clock           },
]

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DashboardClient({
  profile, allVocabProgress, dueTodayCount, totalMastered, totalLearning, totalReview, totalNew,
  streakDatesArr, recentExams, avgScoreAll, allGrammarProgress, allGrammarLessons, grammarDoneCount, chatHistory,
}: Props) {

  const [range,      setRange]      = useState('month')
  const [activeTab,  setActiveTab]  = useState('overview')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [isMobile,   setIsMobile]   = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const rangeDays   = RANGE_OPTS.find(r => r.key === range)?.days ?? 30
  const streakDates = useMemo(() => new Set(streakDatesArr), [streakDatesArr])

  const examInRange  = useMemo(() => filterByDays(recentExams, rangeDays),    [recentExams, rangeDays])
  const chatInRange  = useMemo(() => filterByDays(chatHistory,  rangeDays).length, [chatHistory, rangeDays])

  const avgScoreRange = useMemo(() => {
    if (!examInRange.length) return 0
    return Math.round(examInRange.reduce((s, r) => s + pct(r.so_cau_dung, r.tong_so_cau), 0) / examInRange.length)
  }, [examInRange])

  const examChartData  = useMemo(() => groupExamsByTime(recentExams, rangeDays), [recentExams, rangeDays])
  const vocabChartData = useMemo(() => groupVocabActivity(allVocabProgress),     [allVocabProgress])
  const hourDist       = useMemo(() => hourDistribution(recentExams),             [recentExams])

  const bySkill = useMemo(() => {
    const m: Record<string, { total: number; correct: number; count: number; thoiGian: number }> = {}
    examInRange.forEach(r => {
      const k = r.ky_nang ?? 'OTHER'
      if (!m[k]) m[k] = { total: 0, correct: 0, count: 0, thoiGian: 0 }
      m[k].total    += r.tong_so_cau        ?? 0
      m[k].correct  += r.so_cau_dung        ?? 0
      m[k].count++
      m[k].thoiGian += r.thoi_gian_lam_bai ?? 0
    })
    return m
  }, [examInRange])

  const certPie = useMemo(() => {
    const m: Record<string, number> = {}
    examInRange.forEach(r => { m[r.loai_chung_chi ?? '?'] = (m[r.loai_chung_chi ?? '?'] ?? 0) + 1 })
    return Object.entries(m).map(([name, value]) => ({ name, value, color: CERT_COLORS[name] ?? '#64748b' }))
  }, [examInRange])

  const vocabStatePie = useMemo(() => [
    { name: 'Thuần thục', value: totalMastered, color: T.greenLt },
    { name: 'Đang học',   value: totalLearning, color: '#38bdf8' },
    { name: 'Ôn tập',     value: totalReview,   color: T.gold    },
    { name: 'Mới',        value: totalNew,       color: '#64748b' },
  ].filter(d => d.value > 0), [totalMastered, totalLearning, totalReview, totalNew])

  const byLevel = useMemo(() => {
    const m: Record<string, number> = {}
    allVocabProgress.forEach(r => { const lv = r.TuVung?.cap_do ?? 'N/A'; m[lv] = (m[lv] ?? 0) + 1 })
    return m
  }, [allVocabProgress])

  const grammarByLevel = useMemo(() => {
    const total: Record<string, number> = {}
    const done:  Record<string, number> = {}
    allGrammarLessons.forEach(l => { total[l.cap_do ?? '?'] = (total[l.cap_do ?? '?'] ?? 0) + 1 })
    allGrammarProgress.filter(g => g.da_hoan_thanh).forEach(g => {
      const lv = g.BaiHocNguPhap?.cap_do ?? '?'; done[lv] = (done[lv] ?? 0) + 1
    })
    return LEVEL_ORDER.map((lv, i) => ({ lv, color: LEVEL_COLORS[i], done: done[lv] ?? 0, total: total[lv] ?? 0 }))
  }, [allGrammarProgress, allGrammarLessons])

  const radarData = useMemo(() =>
    Object.entries(bySkill).map(([k, v]) => ({ skill: SKILL_META[k]?.label ?? k, diemTB: pct(v.correct, v.total) }))
  , [bySkill])

  // Time stats
  const totalThoiGian      = useMemo(() => recentExams.reduce((s, r) => s + (r.thoi_gian_lam_bai ?? 0), 0), [recentExams])
  const totalThoiGianRange = useMemo(() => examInRange.reduce((s, r) => s + (r.thoi_gian_lam_bai ?? 0), 0), [examInRange])

  // Best/worst exam
  const bestExam  = useMemo(() => examInRange.length ? examInRange.reduce((b, r) => pct(r.so_cau_dung, r.tong_so_cau) > pct(b.so_cau_dung, b.tong_so_cau) ? r : b, examInRange[0]) : null, [examInRange])
  const worstExam = useMemo(() => examInRange.length ? examInRange.reduce((w, r) => pct(r.so_cau_dung, r.tong_so_cau) < pct(w.so_cau_dung, w.tong_so_cau) ? r : w, examInRange[0]) : null, [examInRange])

  // Vocab growth rate
  const vocabGrowth = useMemo(() => {
    const half = new Date(); half.setDate(half.getDate() - rangeDays / 2)
    const cut  = new Date(); cut.setDate(cut.getDate()   - rangeDays)
    const rec  = allVocabProgress.filter(v => v.lan_cuoi_on && new Date(v.lan_cuoi_on) >= half).length
    const prev = allVocabProgress.filter(v => v.lan_cuoi_on && new Date(v.lan_cuoi_on) >= cut && new Date(v.lan_cuoi_on) < half).length
    return prev > 0 ? Math.round(((rec - prev) / prev) * 100) : 0
  }, [allVocabProgress, rangeDays])

  // Grammar avg score (scaled to 100)
  const grammarAvg = useMemo(() => {
    const done = allGrammarProgress.filter(g => g.diem_bai_tap != null)
    return done.length ? Math.round(done.reduce((s, g) => s + (g.diem_bai_tap ?? 0), 0) / done.length * 10) : 0
  }, [allGrammarProgress])

  // Chat activity grouped
  const chatGrouped = useMemo(() => {
    const map: Record<string, number> = {}
    filterByDays(chatHistory, rangeDays).forEach(c => {
      if (!c.created_at) return
      const d = new Date(c.created_at)
      const key = rangeDays <= 30 ? `${d.getDate()}/${d.getMonth() + 1}` : `T${d.getMonth() + 1}`
      map[key] = (map[key] ?? 0) + 1
    })
    return Object.entries(map).map(([label, count]) => ({ label, count }))
  }, [chatHistory, rangeDays])

  const streak    = profile?.streak_hien_tai ?? 0
  const streakMax = profile?.streak_cao_nhat  ?? 0
  const hoTen     = profile?.ho_ten ?? 'Bạn'
  const firstName = hoTen.split(' ').pop() ?? hoTen

  // Grid helpers
  const g2  = isMobile ? '1fr'     : '1fr 1fr'
  const g3  = isMobile ? '1fr'     : '1fr 1fr 1fr'
  const g4  = isMobile ? '1fr 1fr' : 'repeat(4,1fr)'
  const g5  = isMobile ? '1fr 1fr' : 'repeat(5,1fr)'
  const g17 = isMobile ? '1fr'     : '1.6fr 1fr'

  const axisTick = { fontSize: 10, fill: 'rgba(255,255,255,0.28)', fontFamily: "'DM Sans',sans-serif" }
  const tooltipStyle = { background: T.navy, border: `1px solid ${T.border}`, borderRadius: 10, fontFamily: "'DM Sans',sans-serif" }

  return (
    <div style={{ background: T.navy, minHeight: '100vh', color: '#e2e8f0', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&family=Playfair+Display:wght@700;800;900&display=swap');
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fi{animation:fadeUp .35s ease both}
        .fi:nth-child(1){animation-delay:.04s}.fi:nth-child(2){animation-delay:.08s}
        .fi:nth-child(3){animation-delay:.12s}.fi:nth-child(4){animation-delay:.16s}
        .fi:nth-child(5){animation-delay:.20s}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.3);border-radius:4px}
        ::-webkit-scrollbar-track{background:transparent}
        .recharts-cartesian-grid-horizontal line,.recharts-cartesian-grid-vertical line{stroke:rgba(201,168,76,0.07)!important}
      `}</style>

      {/* ══ HEADER ══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(15,28,53,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.border}`,
        boxShadow: '0 2px 24px rgba(15,28,53,0.6)',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(12px,3vw,28px)' }}>

          {/* Logo + greeting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, background: '#fff',
              border: `2px solid rgba(201,168,76,0.45)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 900, color: T.navy, flexShrink: 0,
            }}>{hoTen.charAt(0)}</div>
            {!isMobile && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Xin chào, {firstName} 👋</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)' }}>
                  <span style={{ color: T.gold, fontWeight: 700 }}>{profile?.muc_tieu_hoc}</span>
                  {' · '}<span style={{ color: T.greenLt, fontWeight: 700 }}>{profile?.trinh_do_hien_tai}</span>
                  {profile?.diem_yeu && <>{' · '}<span style={{ color: T.rose }}>Yếu: {profile.diem_yeu}</span></>}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          {!isMobile && (
            <nav style={{ display: 'flex', gap: 2 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 13px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: 'none', cursor: 'pointer', transition: 'all .15s',
                  fontFamily: "'DM Sans',sans-serif",
                  background: activeTab === t.key ? T.gold : 'transparent',
                  color:      activeTab === t.key ? T.navy : 'rgba(255,255,255,0.4)',
                }}>
                  <t.Icon size={12} />{t.label}
                </button>
              ))}
            </nav>
          )}

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {!isMobile && <RangeBar value={range} onChange={setRange} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: 'rgba(201,168,76,0.1)', border: `1px solid ${T.border}`, borderRadius: 50, fontSize: 12, fontWeight: 700, color: T.gold }}>
              <Flame size={12} />
              <span style={{ fontFamily: "'DM Mono',monospace" }}>{streak}</span>
              {!isMobile && <span style={{ fontWeight: 400, color: 'rgba(201,168,76,0.55)' }}>ngày</span>}
            </div>
            {isMobile && (
              <button onClick={() => setMobileMenu(!mobileMenu)} style={{
                width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`,
                background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
              }}>
                {mobileMenu ? <X size={16} /> : <Menu size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMobile && mobileMenu && (
          <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 16px', background: T.navyMid }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => { setActiveTab(t.key); setMobileMenu(false) }} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8,
                  fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Sans',sans-serif",
                  background: activeTab === t.key ? T.gold : 'rgba(255,255,255,0.06)',
                  color:      activeTab === t.key ? T.navy : 'rgba(255,255,255,0.6)',
                }}>
                  <t.Icon size={12} />{t.label}
                </button>
              ))}
            </div>
            <RangeBar value={range} onChange={r => { setRange(r); setMobileMenu(false) }} />
          </div>
        )}
      </header>

      {/* ══ MAIN ══ */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '22px clamp(12px,3vw,28px) 56px' }}>

        {/* Banner ôn tập */}
        {dueTodayCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
            background: 'linear-gradient(90deg,rgba(0,168,120,0.07),rgba(0,168,120,0.02))',
            border: '1px solid rgba(0,168,120,0.2)', borderRadius: 12, padding: '12px 18px', marginBottom: 18,
            animation: 'fadeUp .3s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,168,120,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={15} color={T.greenLt} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.greenLt }}>{dueTodayCount} từ cần ôn tập hôm nay!</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>Ôn đúng lịch SRS giúp ghi nhớ lâu hơn 60% — Đừng bỏ lỡ!</div>
              </div>
            </div>
            <Link href="/vocabulary?mode=review" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, background: T.greenLt,
              color: T.navy, fontSize: 12, fontWeight: 800, textDecoration: 'none', fontFamily: "'DM Sans',sans-serif",
            }}>
              Ôn ngay <ChevronRight size={13} />
            </Link>
          </div>
        )}

        {/* KPI row — 5 chỉ số */}
        <div style={{ display: 'grid', gridTemplateColumns: g5, gap: 10, marginBottom: 16 }}>
          {[
            { icon: Flame,        label: 'Streak hiện tại',    color: T.gold,    value: `🔥 ${streak} ngày`,    note: `Kỷ lục: ${streakMax} ngày`,         sub: 'Hoạt động liên tiếp', trend: streak >= streakMax * 0.8 ? 12 : -5 },
            { icon: BookOpen,     label: 'Tổng từ đã học',     color: '#38bdf8', value: fmt(profile?.tong_so_tu_da_hoc), note: `${dueTodayCount} từ cần ôn hôm nay`, sub: `${fmt(totalMastered)} thuần thục`, trend: vocabGrowth },
            { icon: CheckCircle2, label: 'Tỷ lệ thuần thục',   color: T.greenLt, value: `${pct(totalMastered, allVocabProgress.length || 1)}%`, note: `${fmt(totalMastered)}/${fmt(allVocabProgress.length)} từ`, sub: 'Mục tiêu ≥ 70%', trend: 15 },
            { icon: Target,       label: 'Điểm TB luyện thi',  color: T.violet,  value: avgScoreRange ? `${avgScoreRange}%` : '—', note: `${examInRange.length} phiên · ${RANGE_OPTS.find(r => r.key === range)?.label}`, sub: bestExam ? `Tốt nhất: ${pct(bestExam.so_cau_dung, bestExam.tong_so_cau)}%` : undefined, trend: examInRange.length > 0 ? 4 : undefined },
            { icon: Clock,        label: 'Thời gian học',      color: T.rose,    value: fmtH(totalThoiGianRange), note: `${RANGE_OPTS.find(r => r.key === range)?.label} này`, sub: `Tổng tất cả: ${fmtH(totalThoiGian)}`, trend: undefined },
          ].map((k, i) => (
            <div key={i} className="fi"><KpiCard {...k} /></div>
          ))}
        </div>

        {/* ═══ TAB: TỔNG QUAN ════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Row 1: Heatmap 52 tuần + 4 quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: g17, gap: 14 }}>
              <Card>
                <CardHead icon={Calendar} title="Hoạt động học tập — 52 tuần" sub="Vàng = ngày có học · Hover để xem ngày cụ thể" color={T.gold} />
                <ActivityHeatmap streakDates={streakDates} streakDatesArr={streakDatesArr} />
              </Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: Trophy,       label: 'Streak kỷ lục',        value: `${streakMax} ngày`,  color: T.gold    },
                  { icon: Brain,        label: 'Ngữ pháp hoàn thành',  value: `${grammarDoneCount}/${allGrammarLessons.length}`, color: T.violet },
                  { icon: MessageSquare,label: 'Câu hỏi AI (kỳ này)',  value: `${chatInRange} lượt`, color: '#38bdf8' },
                  { icon: Star,         label: 'Điểm ngữ pháp TB',     value: `${grammarAvg}%`,     color: T.greenLt },
                ].map((s, i) => (
                  <Card key={i} style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 11, flex: 1 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}14`, border: `1px solid ${s.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <s.icon size={14} color={s.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.label}</div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', fontFamily: "'DM Mono',monospace", marginTop: 2 }}>{s.value}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Row 2: Area chart luyện thi + Cert pie */}
            <div style={{ display: 'grid', gridTemplateColumns: g17, gap: 14 }}>
              <Card>
                <CardHead icon={Activity} title="Hoạt động luyện thi"
                  sub={`Điểm TB & số phiên · ${RANGE_OPTS.find(r => r.key === range)?.label}`}
                  color={T.gold}
                  action={<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace" }}>{examInRange.length} phiên</span>}
                />
                {examChartData.length === 0 ? (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, flexDirection: 'column', gap: 8 }}>
                    <Activity size={28} color={T.gold} opacity={0.3} />Chưa có dữ liệu
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={examChartData} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                      <defs>
                        <linearGradient id="gDiem" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={T.gold} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={T.gold} stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="l" tick={axisTick} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="r" orientation="right" tick={axisTick} axisLine={false} tickLine={false} />
                      <Tooltip content={<GoldTooltip />} />
                      <Area yAxisId="l" type="monotone" dataKey="diemTB"  name="Điểm TB(%)" stroke={T.gold}   fill="url(#gDiem)" strokeWidth={2.5} dot={{ r: 3, fill: T.gold }} />
                      <Bar  yAxisId="r" dataKey="soPhien" name="Số phiên" fill={T.violet} fillOpacity={0.35} radius={[4,4,0,0]} maxBarSize={18} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card>
                <CardHead icon={Award} title="Phân bổ chứng chỉ" sub="Số phiên theo loại" color={T.gold} />
                {certPie.length === 0 ? (
                  <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Chưa có dữ liệu</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie data={certPie} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={5} strokeWidth={0}>
                          {certPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v} phiên`, n]} contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      {certPie.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{d.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 46, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                              <div style={{ width: `${pct(d.value, examInRange.length)}%`, height: '100%', background: d.color, borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: d.color, fontFamily: "'DM Mono',monospace" }}>{d.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </div>

            {/* Row 3: Radar + AI Insight + Vocab state */}
            <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 14 }}>
              <Card>
                <CardHead icon={Star} title="Radar kỹ năng" sub="% đúng trung bình theo kỹ năng" color={T.gold} />
                {radarData.length < 2 ? (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center', flexDirection: 'column', gap: 8 }}>
                    <BarChart2 size={28} color={T.gold} opacity={0.3} />
                    Cần ít nhất 2 kỹ năng<br />để hiển thị biểu đồ
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={210}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(201,168,76,0.1)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.45)', fontFamily: "'DM Sans',sans-serif" }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} tickCount={4} />
                      <Radar name="Điểm TB" dataKey="diemTB" stroke={T.gold} fill={T.gold} fillOpacity={0.12} strokeWidth={2} dot={{ r: 3, fill: T.gold }} />
                      <Tooltip formatter={(v: number) => [`${v}%`, 'Điểm TB']} contentStyle={tooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <AIInsight profile={profile} dueToday={dueTodayCount} totalMastered={totalMastered} avgScore={avgScoreAll} />

              <Card>
                <CardHead icon={Layers} title="Trạng thái từ vựng" sub={`${fmt(allVocabProgress.length)} từ tổng cộng`} color={T.gold} />
                {vocabStatePie.length === 0 ? (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Chưa có dữ liệu</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie data={vocabStatePie} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={4} strokeWidth={0}>
                          {vocabStatePie.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v} từ`, n]} contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: 8 }}>
                      {vocabStatePie.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{d.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 46, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                              <div style={{ width: `${pct(d.value, allVocabProgress.length)}%`, height: '100%', background: d.color, borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: d.color, fontFamily: "'DM Mono',monospace", minWidth: 22, textAlign: 'right' }}>{d.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </div>

            {/* Row 4: Exam history table */}
            <Card>
              <CardHead icon={FileText} title="Lịch sử luyện thi gần nhất"
                sub={`${examInRange.length} phiên · ${RANGE_OPTS.find(r => r.key === range)?.label}`}
                color={T.gold}
                action={<Link href="/exam" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.gold, textDecoration: 'none', fontWeight: 700 }}>Xem tất cả <ChevronRight size={11} /></Link>}
              />
              {recentExams.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                  Chưa có phiên nào. <Link href="/exam" style={{ color: T.gold }}>Luyện ngay →</Link>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        {['Kỹ năng', 'Chứng chỉ', 'Đúng/Tổng', 'Tỉ lệ', 'Thời gian', 'Ngày thi'].map((h, i) => (
                          <th key={i} style={{ textAlign: 'left', padding: '7px 12px', color: `${T.gold}88`, fontWeight: 700, borderBottom: `1px solid ${T.border}`, fontSize: 10, letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentExams.slice(0, 10).map((r, i) => {
                        const sc  = pct(r.so_cau_dung, r.tong_so_cau)
                        const sc2 = scoreColor(sc)
                        const sm  = SKILL_META[r.ky_nang ?? '']
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background .15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.04)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '9px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                {sm && <sm.Icon size={13} color={sm.color} />}
                                <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{sm?.label ?? r.ky_nang}</span>
                              </div>
                            </td>
                            <td style={{ padding: '9px 12px' }}>
                              <Pill label={r.loai_chung_chi ?? '?'} color={CERT_COLORS[r.loai_chung_chi ?? ''] ?? '#64748b'} />
                            </td>
                            <td style={{ padding: '9px 12px' }}>
                              <span style={{ color: sc2, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>{r.so_cau_dung}</span>
                              <span style={{ color: 'rgba(255,255,255,0.25)' }}>/{r.tong_so_cau}</span>
                            </td>
                            <td style={{ padding: '9px 12px', minWidth: 110 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                                  <div style={{ width: `${sc}%`, height: '100%', background: sc2, borderRadius: 2, boxShadow: `0 0 4px ${sc2}55` }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 800, color: sc2, fontFamily: "'DM Mono',monospace", minWidth: 28 }}>{sc}%</span>
                              </div>
                            </td>
                            <td style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.32)', fontFamily: "'DM Mono',monospace" }}>
                              {r.thoi_gian_lam_bai ? `${Math.round(r.thoi_gian_lam_bai / 60)}p` : '—'}
                            </td>
                            <td style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.28)', fontSize: 11, whiteSpace: 'nowrap' }}>
                              {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ═══ TAB: TỪ VỰNG ════════════════════════════════════════════════ */}
        {activeTab === 'vocab' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: g4, gap: 10 }}>
              {[
                { icon: CheckCircle2, label: 'Thuần thục',  color: T.greenLt, value: fmt(totalMastered), note: `${pct(totalMastered, allVocabProgress.length || 1)}% tổng`, sub: '≥ 5 lần lặp đúng' },
                { icon: BookOpen,     label: 'Đang học',    color: '#38bdf8', value: fmt(totalLearning), note: `${pct(totalLearning, allVocabProgress.length || 1)}% tổng`, sub: 'Trong vòng SRS' },
                { icon: RefreshCw,    label: 'Ôn tập',      color: T.gold,    value: fmt(totalReview),   note: `${pct(totalReview,   allVocabProgress.length || 1)}% tổng`, sub: 'Cần ôn lại' },
                { icon: BookMarked,   label: 'Từ mới',      color: '#64748b', value: fmt(totalNew),      note: `${pct(totalNew,      allVocabProgress.length || 1)}% tổng`, sub: 'Chưa bắt đầu' },
              ].map((k, i) => <div key={i} className="fi"><KpiCard {...k} /></div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 14 }}>
              <Card>
                <CardHead icon={Activity} title="Hoạt động từ vựng theo ngày" sub="Từ mới / Ôn tập / Thuần thục" color={T.gold} />
                {vocabChartData.length === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Chưa có dữ liệu</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={vocabChartData} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                      <defs>
                        {[{ id: 'vH', c: '#38bdf8' }, { id: 'vO', c: T.gold }, { id: 'vT', c: T.greenLt }].map(g => (
                          <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={g.c} stopOpacity={0.28} />
                            <stop offset="95%" stopColor={g.c} stopOpacity={0}    />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={Math.ceil(vocabChartData.length / 8)} />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                      <Tooltip content={<GoldTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans',sans-serif" }} />
                      <Area type="monotone" dataKey="hoc"       name="Từ mới"     stroke="#38bdf8" fill="url(#vH)" strokeWidth={2} />
                      <Area type="monotone" dataKey="onTap"     name="Ôn tập"     stroke={T.gold}  fill="url(#vO)" strokeWidth={2} />
                      <Area type="monotone" dataKey="thuanThuc" name="Thuần thục" stroke={T.greenLt} fill="url(#vT)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card>
                <CardHead icon={GraduationCap} title="Từ vựng theo cấp CEFR" sub="Số từ đã học mỗi cấp độ" color={T.gold} />
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={LEVEL_ORDER.map((lv, i) => ({ lv, soTu: byLevel[lv] ?? 0, color: LEVEL_COLORS[i] }))} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="lv" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v, n) => [`${v} từ`, n]} contentStyle={tooltipStyle} />
                    <Bar dataKey="soTu" name="Số từ" radius={[5, 5, 0, 0]} maxBarSize={44}>
                      {LEVEL_ORDER.map((_, i) => <Cell key={i} fill={LEVEL_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                  {LEVEL_ORDER.map((lv, i) => (
                    <div key={lv} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: LEVEL_COLORS[i] }} />
                      {lv}: <span style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{fmt(byLevel[lv] ?? 0)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 14 }}>
              <Card>
                <CardHead icon={Calendar} title="Lịch ôn tập SRS — 52 tuần" sub="Vàng = ngày có ôn từ vựng" color={T.gold} />
                <ActivityHeatmap streakDates={streakDates} streakDatesArr={streakDatesArr} />
              </Card>
              <Card>
                <CardHead icon={Zap} title="Sức khỏe SRS" sub="Phân tích trạng thái lịch ôn tập" color={T.gold} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                  {[
                    { label: 'Cần ôn hôm nay',   value: dueTodayCount, max: allVocabProgress.length || 1, color: T.rose,    icon: AlertCircle  },
                    { label: 'Đã thuần thục',      value: totalMastered, max: allVocabProgress.length || 1, color: T.greenLt, icon: CheckCircle2 },
                    { label: 'Trong vòng học SRS', value: totalLearning + totalReview, max: allVocabProgress.length || 1, color: T.gold, icon: RefreshCw },
                    { label: 'Chờ bắt đầu',        value: totalNew,       max: allVocabProgress.length || 1, color: '#64748b', icon: BookMarked   },
                  ].map((s, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <s.icon size={12} color={s.color} />
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{s.label}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: s.color, fontFamily: "'DM Mono',monospace" }}>
                          {fmt(s.value)} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>({pct(s.value, s.max)}%)</span>
                        </span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                        <div style={{ width: `${pct(s.value, s.max)}%`, height: '100%', background: s.color, borderRadius: 2, boxShadow: `0 0 5px ${s.color}44`, transition: 'width .7s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 18, padding: '11px 13px', background: 'rgba(201,168,76,0.04)', borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Về thuật toán SM-2</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                    Ôn đúng lịch tăng tỷ lệ nhớ từ <span style={{ color: T.rose, fontWeight: 700 }}>20%</span> lên <span style={{ color: T.greenLt, fontWeight: 700 }}>90%</span> sau 30 ngày nhờ khoảng lặp tăng dần.
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ═══ TAB: LUYỆN THI ══════════════════════════════════════════════ */}
        {activeTab === 'exam' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: g4, gap: 10 }}>
              {[
                { icon: Target,       label: 'Điểm TB kỳ này',      color: T.gold,    value: avgScoreRange ? `${avgScoreRange}%` : '—',   note: `${examInRange.length} phiên thi` },
                { icon: TrendingUp,   label: 'Điểm cao nhất',        color: T.greenLt, value: bestExam ? `${pct(bestExam.so_cau_dung, bestExam.tong_so_cau)}%` : '—', note: bestExam ? SKILL_META[bestExam.ky_nang ?? '']?.label ?? '' : '' },
                { icon: TrendingDown, label: 'Điểm thấp nhất',       color: T.rose,    value: worstExam ? `${pct(worstExam.so_cau_dung, worstExam.tong_so_cau)}%` : '—', note: worstExam ? SKILL_META[worstExam.ky_nang ?? '']?.label ?? '' : '' },
                { icon: Clock,        label: 'Thời gian thi kỳ này', color: T.violet,  value: fmtH(totalThoiGianRange), note: examInRange.length ? `TB: ${Math.round(totalThoiGianRange / examInRange.length / 60)}p/phiên` : 'Chưa có' },
              ].map((k, i) => <div key={i} className="fi"><KpiCard {...k} /></div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 14 }}>
              <Card>
                <CardHead icon={BarChart2} title="Điểm theo kỹ năng" sub="% đúng trung bình mỗi kỹ năng" color={T.gold} />
                {Object.keys(bySkill).length === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Chưa có dữ liệu</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart layout="vertical"
                      data={Object.entries(bySkill).map(([k, v]) => ({ skill: SKILL_META[k]?.label ?? k, pct: pct(v.correct, v.total), phien: v.count, k }))}
                      margin={{ top: 5, right: 20, bottom: 0, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="skill" tick={{ ...axisTick, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip formatter={(v: number) => [`${v}%`, 'Điểm TB']} contentStyle={tooltipStyle} />
                      <Bar dataKey="pct" name="Điểm TB" radius={[0, 6, 6, 0]} maxBarSize={20}>
                        {Object.keys(bySkill).map((k, i) => <Cell key={i} fill={SKILL_META[k]?.color ?? T.gold} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card>
                <CardHead icon={TrendingUp} title="Xu hướng điểm qua thời gian" sub="Điểm TB & thời gian làm bài" color={T.gold} />
                {examChartData.length === 0 ? (
                  <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Chưa có dữ liệu</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={examChartData} margin={{ top: 5, right: 10, bottom: 0, left: -22 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="l" tick={axisTick} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="r" orientation="right" tick={axisTick} axisLine={false} tickLine={false} />
                      <Tooltip content={<GoldTooltip />} />
                      <Line yAxisId="l" type="monotone" dataKey="diemTB"   name="Điểm TB(%)"  stroke={T.gold}   strokeWidth={2.5} dot={{ r: 3, fill: T.gold }}    activeDot={{ r: 5 }} />
                      <Bar  yAxisId="r" dataKey="thoiGian" name="Thời gian(p)" fill={T.violet} fillOpacity={0.3} radius={[4,4,0,0]} maxBarSize={18} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* Skill detail cards */}
            {Object.keys(bySkill).length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12 }}>
                {Object.entries(bySkill).map(([k, v]) => {
                  const meta = SKILL_META[k]
                  const sc   = pct(v.correct, v.total)
                  const sc2  = scoreColor(sc)
                  return (
                    <Card key={k}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {meta && <meta.Icon size={15} color={meta.color} />}
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{meta?.label ?? k}</span>
                        </div>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 5 }}>{v.count} phiên</span>
                      </div>
                      <div style={{ fontSize: 'clamp(24px,4vw,30px)', fontWeight: 800, color: sc2, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>
                        {sc}<span style={{ fontSize: 14 }}>%</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, margin: '10px 0' }}>
                        <div style={{ width: `${sc}%`, height: '100%', background: `linear-gradient(90deg,${sc2}88,${sc2})`, borderRadius: 2, boxShadow: `0 0 6px ${sc2}44`, transition: 'width .7s ease' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        <span>{v.correct}/{v.total} câu đúng</span>
                        <span style={{ fontFamily: "'DM Mono',monospace" }}>{Math.round(v.thoiGian / 60)}p</span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: NGỮ PHÁP ═══════════════════════════════════════════════ */}
        {activeTab === 'grammar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: g4, gap: 10 }}>
              {[
                { icon: Brain,        label: 'Bài đã hoàn thành',  color: T.violet,  value: `${grammarDoneCount}/${allGrammarLessons.length}`, note: `${pct(grammarDoneCount, allGrammarLessons.length || 1)}% hoàn thành` },
                { icon: Star,         label: 'Điểm TB bài tập',    color: T.gold,    value: `${grammarAvg}%`, note: 'Thang điểm 0–100%' },
                { icon: CheckCircle2, label: 'Điểm xuất sắc ≥80%', color: T.greenLt, value: fmt(allGrammarProgress.filter(g => g.da_hoan_thanh && (g.diem_bai_tap ?? 0) >= 8).length), note: 'Đạt xuất sắc' },
                { icon: AlertCircle,  label: 'Chưa hoàn thành',    color: T.rose,    value: fmt(allGrammarLessons.length - grammarDoneCount), note: 'Cần hoàn thành' },
              ].map((k, i) => <div key={i} className="fi"><KpiCard {...k} /></div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 14 }}>
              <Card>
                <CardHead icon={GraduationCap} title="Tiến độ theo cấp CEFR" sub={`${grammarDoneCount}/${allGrammarLessons.length} bài đã hoàn thành`} color={T.gold} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 4 }}>
                  {grammarByLevel.map(lv => (
                    <ProgressRow key={lv.lv} label={lv.lv} done={lv.done} total={lv.total} color={lv.color} />
                  ))}
                </div>
              </Card>

              <Card>
                <CardHead icon={BarChart2} title="Điểm bài tập theo cấp CEFR" sub="Điểm trung bình (%) mỗi cấp" color={T.gold} />
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={grammarByLevel.filter(g => g.done > 0).map(g => {
                      const doneItems = allGrammarProgress.filter(p => p.da_hoan_thanh && p.BaiHocNguPhap?.cap_do === g.lv && p.diem_bai_tap != null)
                      const avg = doneItems.length ? Math.round(doneItems.reduce((s, p) => s + (p.diem_bai_tap ?? 0), 0) / doneItems.length * 10) : 0
                      return { lv: g.lv, diemTB: avg, soBai: g.done }
                    })}
                    margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="lv" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip formatter={(v: number, n: string) => [`${v}${n === 'diemTB' ? '%' : ' bài'}`, n === 'diemTB' ? 'Điểm TB' : 'Số bài']} contentStyle={tooltipStyle} />
                    <Bar dataKey="diemTB" name="diemTB" radius={[6, 6, 0, 0]} maxBarSize={44}>
                      {LEVEL_ORDER.map((_, i) => <Cell key={i} fill={LEVEL_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card>
              <CardHead icon={BookMarked} title="Bài học đã hoàn thành — 10 gần nhất" sub="" color={T.gold}
                action={<Link href="/grammar" style={{ fontSize: 11, color: T.gold, textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>Học thêm <ChevronRight size={11} /></Link>}
              />
              {allGrammarProgress.filter(g => g.da_hoan_thanh).length === 0 ? (
                <div style={{ padding: '22px 0', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                  Chưa hoàn thành bài nào. <Link href="/grammar" style={{ color: T.gold }}>Học ngay →</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[...allGrammarProgress].filter(g => g.da_hoan_thanh)
                    .sort((a, b) => (b.ngay_hoan_thanh ?? '').localeCompare(a.ngay_hoan_thanh ?? ''))
                    .slice(0, 10).map((g, i) => {
                      const lv    = g.BaiHocNguPhap?.cap_do
                      const lvIdx = LEVEL_ORDER.indexOf(lv ?? '')
                      const lc    = LEVEL_COLORS[lvIdx] ?? '#64748b'
                      const sc2   = scoreColor((g.diem_bai_tap ?? 0) * 10)
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '9px 13px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', transition: 'background .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
                            <CheckCircle2 size={13} color={T.greenLt} style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.BaiHocNguPhap?.tieu_de ?? 'Bài học'}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>{g.BaiHocNguPhap?.danh_muc}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
                            {lv && <Pill label={lv} color={lc} />}
                            {g.diem_bai_tap != null && (
                              <span style={{ fontSize: 13, fontWeight: 800, color: sc2, fontFamily: "'DM Mono',monospace" }}>{g.diem_bai_tap}/10</span>
                            )}
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>
                              {g.ngay_hoan_thanh ? new Date(g.ngay_hoan_thanh).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }) : ''}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ═══ TAB: THỜI GIAN ══════════════════════════════════════════════ */}
        {activeTab === 'time' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: g4, gap: 10 }}>
              {[
                { icon: Clock,        label: 'Tổng giờ học (tất cả)', color: T.gold,    value: fmtH(totalThoiGian),      note: 'Luyện thi + ôn tập', sub: 'Toàn bộ thời gian' },
                { icon: Clock,        label: `Giờ học (${RANGE_OPTS.find(r => r.key === range)?.label})`, color: T.violet, value: fmtH(totalThoiGianRange), note: `${examInRange.length} phiên`, sub: 'Kỳ đang xem' },
                { icon: Activity,     label: 'Trung bình / phiên',    color: '#38bdf8', value: `${examInRange.length ? Math.round(totalThoiGianRange / examInRange.length / 60) : 0}p`, note: 'Phút mỗi phiên thi', sub: 'Hiệu suất học' },
                { icon: MessageSquare,label: 'Câu hỏi AI (tất cả)',   color: T.greenLt, value: fmt(chatHistory.length),  note: `${chatInRange} lượt kỳ này`, sub: 'Chatbot AI Gemini' },
              ].map((k, i) => <div key={i} className="fi"><KpiCard {...k} /></div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 14 }}>
              <Card>
                <CardHead icon={Clock} title="Thời gian luyện thi theo kỳ" sub="Phút học mỗi mốc thời gian" color={T.gold} />
                {examChartData.length === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Chưa có dữ liệu</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={examChartData} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} unit="p" />
                      <Tooltip formatter={(v: number) => [`${v} phút`, 'Thời gian']} contentStyle={tooltipStyle} />
                      <Bar dataKey="thoiGian" name="Thời gian(p)" fill={T.gold} fillOpacity={0.75} radius={[5, 5, 0, 0]} maxBarSize={42} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card>
                <CardHead icon={Activity} title="Giờ học trong ngày" sub="Số phiên thi theo từng khung giờ" color={T.gold} />
                {hourDist.every(h => h.count === 0) ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Chưa có dữ liệu</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={hourDist} margin={{ top: 5, right: 5, bottom: 0, left: -28 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hour" tick={axisTick} axisLine={false} tickLine={false} interval={2} />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: number) => [`${v} phiên`, 'Số phiên']} contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Số phiên" radius={[4, 4, 0, 0]} maxBarSize={22}>
                        {hourDist.map((h, i) => {
                          const maxCount = Math.max(...hourDist.map(d => d.count))
                          return <Cell key={i} fill={h.count === maxCount && maxCount > 0 ? T.gold : T.violet} fillOpacity={h.count === maxCount && maxCount > 0 ? 0.9 : 0.55} />
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 8 }}>
                  {(() => {
                    const peak = hourDist.reduce((a, b) => b.count > a.count ? b : a, hourDist[0])
                    return peak?.count > 0 ? `🏆 Khung giờ học nhiều nhất: ${peak.hour} (${peak.count} phiên)` : ''
                  })()}
                </div>
              </Card>
            </div>

            {/* AI chat activity */}
            <Card>
              <CardHead icon={MessageSquare} title="Tần suất sử dụng AI Chatbot" sub="Số câu hỏi AI theo thời gian" color={T.gold} />
              {chatHistory.length === 0 ? (
                <div style={{ padding: '22px 0', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                  Chưa sử dụng AI. <Link href="/ai-chat" style={{ color: T.gold }}>Chat với AI →</Link>
                </div>
              ) : chatGrouped.length === 0 ? (
                <div style={{ padding: '16px 0', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Không có dữ liệu trong kỳ này</div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chatGrouped} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                    <defs>
                      <linearGradient id="gChat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.greenLt} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={T.greenLt} stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [`${v} câu`, 'Hỏi AI']} contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="count" name="Hỏi AI" stroke={T.greenLt} fill="url(#gChat)" strokeWidth={2} dot={{ r: 3, fill: T.greenLt }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        {/* ── Module shortcuts ── */}
        <div style={{ display: 'grid', gridTemplateColumns: g4, gap: 10, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          {[
            { href: '/vocabulary', Icon: BookOpen,      label: 'Học từ vựng',  desc: 'SRS thông minh',    color: T.greenLt },
            { href: '/grammar',    Icon: Brain,          label: 'Ngữ pháp',     desc: 'A1 → C1',           color: T.violet  },
            { href: '/exam',       Icon: FileText,       label: 'Luyện thi',    desc: 'VSTEP·TOEIC·APTIS', color: T.gold    },
            { href: '/ai-chat',    Icon: MessageSquare,  label: 'AI Chatbot',   desc: 'Luyện nói 24/7',    color: '#38bdf8' },
          ].map(m => (
            <Link key={m.href} href={m.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '13px 15px', borderRadius: 12,
              background: `linear-gradient(145deg,${T.navyMid},${T.navyLg})`,
              border: `1px solid ${T.border}`, textDecoration: 'none', transition: 'all .18s',
              fontFamily: "'DM Sans',sans-serif",
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = `linear-gradient(145deg,${m.color}12,${T.navyLg})`; el.style.borderColor = `${m.color}40`; el.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = `linear-gradient(145deg,${T.navyMid},${T.navyLg})`; el.style.borderColor = T.border; el.style.transform = 'translateY(0)' }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${m.color}14`, border: `1px solid ${m.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <m.Icon size={15} color={m.color} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{m.label}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>{m.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}