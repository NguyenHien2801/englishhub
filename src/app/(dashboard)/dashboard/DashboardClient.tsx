'use client'

// ─────────────────────────────────────────────────────────────────────────────
// DashboardClient.tsx
// Trang tổng quan học tiếng Anh — Client Component
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  type LucideIcon,
  Flame, BookOpen, CheckCircle2, Target, TrendingUp,
  Minus, Brain, Mic, Headphones, PenLine, Eye, BarChart2,
  Award, Zap, ChevronRight, RefreshCw,
  Loader2, GraduationCap, Activity, Star,
  ArrowUpRight, ArrowDownRight, Sparkles, BookMarked,
  FileText, MessageSquare, Menu, X, Home,
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

// FIX: TuVung là object | null (đã normalize từ server), KHÔNG phải array
interface VocabRow {
  trang_thai?: string | null
  ngay_on_tiep_theo?: string | null
  lan_cuoi_on?: string | null
  TuVung?: {
    tu_tieng_anh?: string
    cap_do?: string
  } | null
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

// ─── Constants ────────────────────────────────────────────────────────────────

const RANGE_OPTS = [
  { key: 'week',    label: 'Tuần',  days: 7   },
  { key: 'month',   label: 'Tháng', days: 30  },
  { key: 'quarter', label: 'Quý',   days: 90  },
  { key: 'year',    label: 'Năm',   days: 365 },
]

const SKILL_META: Record<string, { label: string; Icon: LucideIcon; color: string }> = {
  NGHE:     { label: 'Nghe',     Icon: Headphones, color: '#38bdf8' },
  DOC:      { label: 'Đọc',      Icon: Eye,        color: '#34d399' },
  VIET:     { label: 'Viết',     Icon: PenLine,    color: '#fbbf24' },
  NOI:      { label: 'Nói',      Icon: Mic,        color: '#a78bfa' },
  TU_VUNG:  { label: 'Từ vựng',  Icon: BookOpen,   color: '#f472b6' },
  NGU_PHAP: { label: 'Ngữ pháp', Icon: Brain,      color: '#22d3ee' },
}

const CERT_COLORS: Record<string, string> = {
  VSTEP: '#34d399', TOEIC: '#fbbf24', APTIS: '#a78bfa',
}

const LEVEL_ORDER  = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LEVEL_COLORS = ['#64748b','#38bdf8','#34d399','#fbbf24','#a78bfa','#f472b6']

// ─── Utils ────────────────────────────────────────────────────────────────────

const pct = (n?: number, d?: number) => (d ? Math.round(((n ?? 0) / d) * 100) : 0)
const fmt = (n?: number) => (n ?? 0).toLocaleString('vi-VN')

function scoreColor(s: number) {
  if (s >= 80) return '#34d399'
  if (s >= 60) return '#fbbf24'
  return '#f87171'
}

function filterByDays<T extends { created_at?: string }>(rows: T[], days: number): T[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return rows.filter(r => r.created_at && new Date(r.created_at) >= cutoff)
}

function groupExams(rows: ExamRow[], days: number) {
  const filtered = filterByDays(rows, days)
  const map: Record<string, { label: string; soPhien: number; totalScore: number; totalCau: number; dung: number }> = {}

  filtered.forEach(r => {
    const d = new Date(r.created_at!)
    let key: string
    if (days <= 7)       key = d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' })
    else if (days <= 30) key = `${d.getDate()}/${d.getMonth() + 1}`
    else if (days <= 90) key = `T${d.getMonth() + 1} W${Math.ceil(d.getDate() / 7)}`
    else                 key = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`

    if (!map[key]) map[key] = { label: key, soPhien: 0, totalScore: 0, totalCau: 0, dung: 0 }
    map[key].soPhien++
    map[key].dung       += r.so_cau_dung  ?? 0
    map[key].totalCau   += r.tong_so_cau  ?? 0
    map[key].totalScore += pct(r.so_cau_dung, r.tong_so_cau)
  })

  return Object.values(map).map(g => ({
    label:   g.label,
    soPhien: g.soPhien,
    diemTB:  g.soPhien ? Math.round(g.totalScore / g.soPhien) : 0,
  }))
}

function groupVocab(rows: VocabRow[]) {
  const map: Record<string, { label: string; hoc: number; onTap: number }> = {}
  rows.forEach(r => {
    const d = r.lan_cuoi_on ?? r.ngay_on_tiep_theo
    if (!d) return
    const key = String(d).slice(5) // MM-DD
    if (!map[key]) map[key] = { label: key.replace('-', '/'), hoc: 0, onTap: 0 }
    if (r.trang_thai === 'moi' || r.trang_thai === 'dang_hoc') map[key].hoc++
    else map[key].onTap++
  })
  return Object.values(map).slice(-24)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(10,11,16,0.96)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '9px 13px', fontSize: 11,
      backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 5, fontWeight: 500 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0, display: 'inline-block' }} />
          <span style={{ color: '#e2e8f0' }}>{p.name}: <strong>{fmt(p.value)}</strong></span>
        </div>
      ))}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, note, trend, color }: {
  icon: LucideIcon
  label: string; value: string; note?: string
  trend?: number; color: string
}) {
  const TIcon = trend === undefined ? null : trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus
  const tc    = trend === undefined ? '' : trend > 0 ? '#34d399' : trend < 0 ? '#f87171' : '#64748b'
  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(255,255,255,0.028),rgba(255,255,255,0.055))',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: 'clamp(14px,2.5vw,20px)',
      position: 'relative', overflow: 'hidden',
      transition: 'transform .18s,box-shadow .18s', cursor: 'default',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = `0 14px 40px ${color}22`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      <div style={{ position:'absolute',top:-24,right:-24,width:80,height:80,borderRadius:'50%',background:color,opacity:.1,filter:'blur(22px)',pointerEvents:'none' }} />
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ width:36,height:36,borderRadius:9,background:`${color}18`,border:`1px solid ${color}30`, display:'flex',alignItems:'center',justifyContent:'center' }}>
          <Icon size={16} color={color} />
        </div>
        {TIcon && trend !== undefined && (
          <span style={{ display:'flex', alignItems:'center', gap:2, fontSize:11, fontWeight:600, color:tc }}>
            <TIcon size={12} />{Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:700, color:'#f1f5f9', letterSpacing:'-0.4px', fontFamily:"'DM Mono',monospace" }}>
        {value}
      </div>
      <div style={{ fontSize:11, color:'#64748b', marginTop:3, fontWeight:500 }}>{label}</div>
      {note && <div style={{ fontSize:10, color:'#475569', marginTop:5 }}>{note}</div>}
    </div>
  )
}

function ChartCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.022)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: 'clamp(14px,2.5vw,20px)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionHead({ icon: Icon, title, sub, action }: {
  icon: LucideIcon
  title: string; sub?: string; action?: React.ReactNode
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <div style={{ width:30,height:30,borderRadius:8,background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.2)',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <Icon size={14} color="#818cf8" />
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{title}</div>
          {sub && <div style={{ fontSize:10, color:'#64748b', marginTop:1 }}>{sub}</div>}
        </div>
      </div>
      {action}
    </div>
  )
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center',
      padding:'2px 7px', borderRadius:5,
      background:`${color}18`, border:`1px solid ${color}30`,
      fontSize:10, fontWeight:700, color, letterSpacing:'0.3px',
    }}>{label}</span>
  )
}

function RangeBar({ value, onChange }: { value: string; onChange: (r: string) => void }) {
  return (
    <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.04)', borderRadius:8, padding:3 }}>
      {RANGE_OPTS.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{
          padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600,
          border:'none', cursor:'pointer', transition:'all .15s',
          background: value === o.key ? 'rgba(99,102,241,0.2)' : 'transparent',
          color: value === o.key ? '#818cf8' : '#64748b',
        }}>{o.label}</button>
      ))}
    </div>
  )
}

// Streak heatmap — 63 ngày
function StreakHeatmap({ dates }: { dates: Set<string> }) {
  const today = new Date()
  const cells: { key: string; active: boolean; isToday: boolean }[] = []
  for (let i = 62; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    cells.push({ key, active: dates.has(key), isToday: i === 0 })
  }
  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div>
      <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
        {weeks.map((wk, wi) => (
          <div key={wi} style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {wk.map((c, di) => (
              <div key={di} title={c.key} style={{
                width:11, height:11, borderRadius:3,
                background: c.isToday ? '#818cf8' : c.active ? `rgba(52,211,153,0.7)` : 'rgba(255,255,255,0.05)',
                border: c.isToday ? '1px solid #6366f1' : '1px solid transparent',
                transition:'transform .1s', cursor:'default',
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.35)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:8 }}>
        <span style={{ fontSize:9, color:'#475569' }}>Ít</span>
        {[0.1,0.3,0.5,0.7,0.95].map((o,i) => (
          <div key={i} style={{ width:9,height:9,borderRadius:2,background:`rgba(52,211,153,${o})` }} />
        ))}
        <span style={{ fontSize:9, color:'#475569' }}>Nhiều</span>
      </div>
    </div>
  )
}

// Progress bar row
function ProgressRow({ label, done, total, color, showPct = true }: {
  label: string; done: number; total: number; color: string; showPct?: boolean
}) {
  const p = pct(done, total || 1)
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <Pill label={label} color={color} />
          <span style={{ fontSize:11, color:'#64748b' }}>{done}/{total} bài</span>
        </div>
        {showPct && <span style={{ fontSize:12, fontWeight:700, color, fontFamily:"'DM Mono',monospace" }}>{p}%</span>}
      </div>
      <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3 }}>
        <div style={{
          width:`${p}%`, height:'100%',
          background:`linear-gradient(90deg,${color}99,${color})`,
          borderRadius:3, transition:'width .7s ease',
          boxShadow:`0 0 6px ${color}55`,
        }} />
      </div>
    </div>
  )
}

// ─── AI Insight ────────────────────────────────────────────────────────────

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
            content: `Bạn là gia sư AI cho sinh viên học tiếng Anh tên ${profile.ho_ten}.
Dữ liệu: Mục tiêu ${profile.muc_tieu_hoc} | Trình độ ${profile.trinh_do_hien_tai} | Streak ${profile.streak_hien_tai} ngày | Từ thuần thục ${totalMastered} | Cần ôn hôm nay ${dueToday} | Điểm TB thi ${avgScore}% | Điểm yếu ${profile.diem_yeu ?? 'chưa rõ'}.
Hãy đưa ra 3 nhận xét ngắn (mỗi cái 1 dòng, bắt đầu bằng emoji phù hợp) và 1 mục tiêu tuần này in đậm (**...**). Tối đa 100 từ tiếng Việt.`,
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
    <ChartCard style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.06))', borderColor:'rgba(99,102,241,0.15)' }}>
      <SectionHead icon={Sparkles} title="Nhận xét AI" sub="Phân tích cá nhân hoá từ dữ liệu thực" />
      {!done ? (
        <div style={{ textAlign:'center', padding:'18px 0' }}>
          <p style={{ fontSize:12, color:'#64748b', marginBottom:12 }}>
            AI sẽ đọc dữ liệu học tập của bạn và đưa ra lời khuyên cụ thể
          </p>
          <button onClick={run} disabled={loading} style={{
            display:'inline-flex', alignItems:'center', gap:7,
            padding:'9px 18px', borderRadius:9,
            background: loading ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.14)',
            border:'1px solid rgba(99,102,241,0.28)',
            color:'#818cf8', fontSize:12, fontWeight:600,
            cursor: loading ? 'default' : 'pointer',
          }}>
            {loading
              ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> Đang phân tích...</>
              : <><Sparkles size={14} /> Phân tích ngay</>
            }
          </button>
        </div>
      ) : (
        <div>
          <div style={{
            fontSize:12, color:'#94a3b8', lineHeight:1.85,
            whiteSpace:'pre-line',
            background:'rgba(255,255,255,0.03)',
            borderRadius:9, padding:'11px 13px',
            border:'1px solid rgba(255,255,255,0.05)',
          }}>
            {text}
          </div>
          <button onClick={() => { setDone(false); setText('') }} style={{
            display:'inline-flex', alignItems:'center', gap:4,
            marginTop:9, padding:'4px 9px', borderRadius:6,
            background:'transparent', border:'1px solid rgba(255,255,255,0.08)',
            color:'#64748b', fontSize:10, cursor:'pointer',
          }}>
            <RefreshCw size={10} /> Làm mới
          </button>
        </div>
      )}
    </ChartCard>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardClient({
  profile,
  allVocabProgress, dueTodayCount, totalMastered, totalLearning, totalReview, totalNew,
  streakDatesArr, recentExams, avgScoreAll,
  allGrammarProgress, allGrammarLessons, grammarDoneCount,
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

  const examInRange = useMemo(() => filterByDays(recentExams, rangeDays), [recentExams, rangeDays])

  const avgScoreRange = useMemo(() => {
    if (!examInRange.length) return 0
    return Math.round(examInRange.reduce((s, r) => s + pct(r.so_cau_dung, r.tong_so_cau), 0) / examInRange.length)
  }, [examInRange])

  const examChartData  = useMemo(() => groupExams(recentExams, rangeDays), [recentExams, rangeDays])
  const vocabChartData = useMemo(() => groupVocab(allVocabProgress), [allVocabProgress])

  const bySkill = useMemo(() => {
    const m: Record<string, { total: number; correct: number; count: number }> = {}
    examInRange.forEach(r => {
      const k = r.ky_nang ?? 'OTHER'
      if (!m[k]) m[k] = { total: 0, correct: 0, count: 0 }
      m[k].total   += r.tong_so_cau ?? 0
      m[k].correct += r.so_cau_dung ?? 0
      m[k].count++
    })
    return m
  }, [examInRange])

  const certPie = useMemo(() => {
    const m: Record<string, number> = {}
    examInRange.forEach(r => { m[r.loai_chung_chi ?? '?'] = (m[r.loai_chung_chi ?? '?'] ?? 0) + 1 })
    return Object.entries(m).map(([name, value]) => ({ name, value, color: CERT_COLORS[name] ?? '#64748b' }))
  }, [examInRange])

  const vocabStatePie = useMemo(() => [
    { name:'Thuần thục', value:totalMastered,  color:'#34d399' },
    { name:'Đang học',   value:totalLearning,  color:'#38bdf8' },
    { name:'Ôn tập',     value:totalReview,    color:'#fbbf24' },
    { name:'Mới',        value:totalNew,       color:'#64748b' },
  ].filter(d => d.value > 0), [totalMastered, totalLearning, totalReview, totalNew])

  const byLevel = useMemo(() => {
    const m: Record<string, number> = {}
    allVocabProgress.forEach(r => {
      const lv = r.TuVung?.cap_do ?? 'N/A'
      m[lv] = (m[lv] ?? 0) + 1
    })
    return m
  }, [allVocabProgress])

  const grammarByLevel = useMemo(() => {
    const total: Record<string, number> = {}
    const done:  Record<string, number> = {}
    allGrammarLessons.forEach(l => { total[l.cap_do ?? '?'] = (total[l.cap_do ?? '?'] ?? 0) + 1 })
    allGrammarProgress.filter(g => g.da_hoan_thanh).forEach(g => {
      const lv = g.BaiHocNguPhap?.cap_do ?? '?'
      done[lv] = (done[lv] ?? 0) + 1
    })
    return LEVEL_ORDER.map((lv, i) => ({
      lv, color: LEVEL_COLORS[i],
      done: done[lv] ?? 0, total: total[lv] ?? 0,
    }))
  }, [allGrammarProgress, allGrammarLessons])

  const radarData = useMemo(() =>
    Object.entries(bySkill).map(([k, v]) => ({
      skill: SKILL_META[k]?.label ?? k,
      diemTB: pct(v.correct, v.total),
    }))
  , [bySkill])

  const streak    = profile?.streak_hien_tai ?? 0
  const streakMax = profile?.streak_cao_nhat  ?? 0
  const hoTen     = profile?.ho_ten ?? 'Bạn'
  const firstName = hoTen.split(' ').pop() ?? hoTen

  const g2  = isMobile ? '1fr'       : '1fr 1fr'
  const g3  = isMobile ? '1fr'       : '1fr 1fr 1fr'
  const g4  = isMobile ? '1fr 1fr'   : 'repeat(4, 1fr)'
  const g17 = isMobile ? '1fr'       : '1.7fr 1fr'

  const TABS = [
    { key:'overview', label:'Tổng quan', Icon: Home       },
    { key:'vocab',    label:'Từ vựng',   Icon: BookOpen   },
    { key:'exam',     label:'Luyện thi', Icon: FileText   },
    { key:'grammar',  label:'Ngữ pháp',  Icon: Brain      },
  ]

  return (
    <div style={{
      background:'#080a0f',
      minHeight:'100vh',
      color:'#e2e8f0',
      fontFamily:"'Plus Jakarta Sans','DM Sans',system-ui,sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .35s ease both}
        .fade-up:nth-child(1){animation-delay:.04s}
        .fade-up:nth-child(2){animation-delay:.08s}
        .fade-up:nth-child(3){animation-delay:.12s}
        .fade-up:nth-child(4){animation-delay:.16s}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        ::-webkit-scrollbar-track{background:transparent}
      `}</style>

      {/* ══ Top nav ══ */}
      <header style={{
        position:'sticky', top:0, zIndex:50,
        background:'rgba(8,10,15,0.85)',
        backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        padding:'0 clamp(12px,3vw,28px)',
      }}>
        <div style={{ maxWidth:1280, margin:'0 auto', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:34, height:34, borderRadius:9,
              background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, fontWeight:800, color:'#fff', flexShrink:0,
            }}>
              {hoTen.charAt(0)}
            </div>
            {!isMobile && (
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9' }}>
                  Xin chào, {firstName} 👋
                </div>
                <div style={{ fontSize:10, color:'#64748b' }}>
                  <span style={{ color:'#818cf8', fontWeight:600 }}>{profile?.muc_tieu_hoc}</span>
                  {' · '}<span style={{ color:'#34d399', fontWeight:600 }}>{profile?.trinh_do_hien_tai}</span>
                </div>
              </div>
            )}
          </div>

          {!isMobile && (
            <nav style={{ display:'flex', gap:2 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:600,
                  border:'none', cursor:'pointer', transition:'all .15s',
                  background: activeTab === t.key ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: activeTab === t.key ? '#818cf8' : '#64748b',
                }}>
                  <t.Icon size={13} />{t.label}
                </button>
              ))}
            </nav>
          )}

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {!isMobile && <RangeBar value={range} onChange={setRange} />}
            {isMobile && (
              <button onClick={() => setMobileMenu(!mobileMenu)} style={{
                width:34, height:34, borderRadius:8, border:'1px solid rgba(255,255,255,0.08)',
                background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', color:'#94a3b8',
              }}>
                {mobileMenu ? <X size={16} /> : <Menu size={16} />}
              </button>
            )}
          </div>
        </div>

        {isMobile && mobileMenu && (
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'12px clamp(12px,3vw,28px)' }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => { setActiveTab(t.key); setMobileMenu(false) }} style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600,
                  border:'none', cursor:'pointer',
                  background: activeTab === t.key ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                  color: activeTab === t.key ? '#818cf8' : '#94a3b8',
                }}>
                  <t.Icon size={12} />{t.label}
                </button>
              ))}
            </div>
            <RangeBar value={range} onChange={r => { setRange(r); setMobileMenu(false) }} />
          </div>
        )}
      </header>

      {/* ══ Main content ══ */}
      <main style={{ maxWidth:1280, margin:'0 auto', padding:'24px clamp(12px,3vw,28px) 48px' }}>

        {/* Banner ôn tập */}
        {dueTodayCount > 0 && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10,
            background:'linear-gradient(90deg,rgba(52,211,153,0.07),rgba(52,211,153,0.03))',
            border:'1px solid rgba(52,211,153,0.18)',
            borderRadius:12, padding:'12px 16px', marginBottom:20,
            animation:'fadeUp .3s ease both',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32,height:32,borderRadius:8,background:'rgba(52,211,153,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <Zap size={15} color="#34d399" />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#34d399' }}>
                  {dueTodayCount} từ cần ôn tập hôm nay
                </div>
                <div style={{ fontSize:11, color:'#64748b' }}>
                  Ôn đúng lịch SRS giúp ghi nhớ lâu hơn 60% — Đừng bỏ lỡ!
                </div>
              </div>
            </div>
            <Link href="/vocabulary?mode=review" style={{
              display:'inline-flex', alignItems:'center', gap:5,
              padding:'7px 14px', borderRadius:8,
              background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.25)',
              color:'#34d399', fontSize:12, fontWeight:700, textDecoration:'none',
            }}>
              Ôn ngay <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:g4, gap:10, marginBottom:18 }}>
          {[
            {
              icon:Flame, label:'Streak hiện tại', color:'#fbbf24',
              value:`🔥 ${streak} ngày`,
              note:`Kỷ lục: ${streakMax} ngày`,
              trend: streak >= streakMax * 0.8 ? 12 : -8,
            },
            {
              icon:BookOpen, label:'Tổng từ đã học', color:'#38bdf8',
              value:fmt(profile?.tong_so_tu_da_hoc),
              note:`${dueTodayCount} từ cần ôn hôm nay`,
              trend:8,
            },
            {
              icon:CheckCircle2, label:'Đã thuần thục', color:'#34d399',
              value:fmt(totalMastered),
              note:`${pct(totalMastered, allVocabProgress.length)}% tổng từ`,
              trend:15,
            },
            {
              icon:Target, label:'Điểm TB luyện thi', color:'#a78bfa',
              value: avgScoreRange ? `${avgScoreRange}%` : '—',
              note:`${examInRange.length} phiên · ${RANGE_OPTS.find(r=>r.key===range)?.label}`,
              trend: examInRange.length > 0 ? 4 : undefined,
            },
          ].map((k, i) => (
            <div key={i} className="fade-up"><KpiCard {...k} /></div>
          ))}
        </div>

        {/* ═══ TAB: TỔNG QUAN ═══ */}
        {activeTab === 'overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Row 1: Area chart + Pie cert */}
            <div style={{ display:'grid', gridTemplateColumns:g17, gap:16 }}>
              <ChartCard>
                <SectionHead icon={Activity} title="Hoạt động luyện thi"
                  sub={`Điểm trung bình & số phiên · ${RANGE_OPTS.find(r=>r.key===range)?.label}`} />
                {examChartData.length === 0 ? (
                  <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', fontSize:12 }}>
                    Chưa có dữ liệu trong kỳ này
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={examChartData} margin={{ top:5,right:5,bottom:0,left:-22 }}>
                      <defs>
                        <linearGradient id="gDiem" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0}    />
                        </linearGradient>
                        <linearGradient id="gPhien" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#34d399" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="label" tick={{ fontSize:10,fill:'#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="l" tick={{ fontSize:10,fill:'#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="r" orientation="right" tick={{ fontSize:10,fill:'#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area yAxisId="l" type="monotone" dataKey="diemTB"  name="Điểm TB(%)" stroke="#818cf8" fill="url(#gDiem)"  strokeWidth={2.5} dot={{ r:3,fill:'#818cf8' }} />
                      <Area yAxisId="r" type="monotone" dataKey="soPhien" name="Số phiên"   stroke="#34d399" fill="url(#gPhien)" strokeWidth={2}   dot={{ r:3,fill:'#34d399' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard>
                <SectionHead icon={Award} title="Phân bổ chứng chỉ" sub="Tỷ lệ phiên thi theo loại" />
                {certPie.length === 0 ? (
                  <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', fontSize:12 }}>Chưa có dữ liệu</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={certPie} cx="50%" cy="50%" innerRadius={44} outerRadius={64}
                          dataKey="value" paddingAngle={4} strokeWidth={0}>
                          {certPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v} phiên`, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:4 }}>
                      {certPie.map((d, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ width:8,height:8,borderRadius:2,background:d.color }} />
                            <span style={{ fontSize:12, color:'#94a3b8' }}>{d.name}</span>
                          </div>
                          <span style={{ fontSize:12, fontWeight:700, color:d.color }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </ChartCard>
            </div>

            {/* Row 2: Streak + AI + Radar */}
            <div style={{ display:'grid', gridTemplateColumns:g3, gap:16 }}>
              <ChartCard>
                <SectionHead icon={Flame} title="Streak học tập" sub="63 ngày gần nhất" />
                <StreakHeatmap dates={streakDates} />
                <div style={{ display:'flex', gap:20, marginTop:14 }}>
                  <div>
                    <div style={{ fontSize:'clamp(18px,3vw,22px)', fontWeight:700, color:'#fbbf24', fontFamily:"'DM Mono',monospace" }}>
                      {streak}<span style={{ fontSize:11, color:'#64748b' }}> ngày</span>
                    </div>
                    <div style={{ fontSize:10, color:'#475569' }}>Hiện tại</div>
                  </div>
                  <div>
                    <div style={{ fontSize:'clamp(18px,3vw,22px)', fontWeight:700, color:'#f1f5f9', fontFamily:"'DM Mono',monospace" }}>
                      {streakMax}<span style={{ fontSize:11, color:'#64748b' }}> ngày</span>
                    </div>
                    <div style={{ fontSize:10, color:'#475569' }}>Kỷ lục</div>
                  </div>
                </div>
              </ChartCard>

              <AIInsight profile={profile} dueToday={dueTodayCount} totalMastered={totalMastered} avgScore={avgScoreAll} />

              <ChartCard>
                <SectionHead icon={Star} title="Radar kỹ năng" sub="% đúng trung bình" />
                {radarData.length < 2 ? (
                  <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', fontSize:12, textAlign:'center' }}>
                    Cần ít nhất 2 kỹ năng<br />để hiển thị biểu đồ
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.07)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize:10, fill:'#64748b' }} />
                      <PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9,fill:'#475569' }} tickCount={4} />
                      <Radar name="Điểm" dataKey="diemTB" stroke="#818cf8" fill="#818cf8" fillOpacity={0.15} strokeWidth={2} dot={{ r:3,fill:'#818cf8' }} />
                      <Tooltip formatter={v => [`${v}%`,'Điểm TB']} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            {/* Row 3: Exam table */}
            <ChartCard>
              <SectionHead
                icon={FileText}
                title="Lịch sử luyện thi"
                sub={`${examInRange.length} phiên · ${RANGE_OPTS.find(r=>r.key===range)?.label}`}
                action={
                  <Link href="/exam" style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#818cf8', textDecoration:'none' }}>
                    Xem tất cả <ChevronRight size={11} />
                  </Link>
                }
              />
              {recentExams.length === 0 ? (
                <div style={{ padding:'24px 0', textAlign:'center', color:'#475569', fontSize:12 }}>
                  Chưa có phiên nào. <Link href="/exam" style={{ color:'#818cf8' }}>Luyện ngay →</Link>
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr>
                        {['Kỹ năng','Chứng chỉ','Đúng/Tổng','Tỉ lệ','Thời gian','Ngày'].map((h,i) => (
                          <th key={i} style={{ textAlign:'left', padding:'7px 10px', color:'#475569', fontWeight:500, borderBottom:'1px solid rgba(255,255,255,0.05)', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentExams.slice(0, 10).map((r, i) => {
                        const sc  = pct(r.so_cau_dung, r.tong_so_cau)
                        const sc2 = scoreColor(sc)
                        const sm  = SKILL_META[r.ky_nang ?? '']
                        return (
                          <tr key={i}
                            style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding:'9px 10px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                {sm && <sm.Icon size={13} color={sm.color} />}
                                <span style={{ color:'#e2e8f0', fontWeight:500 }}>{sm?.label ?? r.ky_nang}</span>
                              </div>
                            </td>
                            <td style={{ padding:'9px 10px' }}>
                              <Pill label={r.loai_chung_chi ?? '?'} color={CERT_COLORS[r.loai_chung_chi ?? ''] ?? '#64748b'} />
                            </td>
                            <td style={{ padding:'9px 10px', color:'#94a3b8' }}>
                              <span style={{ color:sc2, fontWeight:700 }}>{r.so_cau_dung}</span>/{r.tong_so_cau}
                            </td>
                            <td style={{ padding:'9px 10px', minWidth:100 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.07)', borderRadius:2 }}>
                                  <div style={{ width:`${sc}%`, height:'100%', background:sc2, borderRadius:2, transition:'width .5s' }} />
                                </div>
                                <span style={{ fontSize:11, fontWeight:700, color:sc2, minWidth:30 }}>{sc}%</span>
                              </div>
                            </td>
                            <td style={{ padding:'9px 10px', color:'#64748b' }}>
                              {r.thoi_gian_lam_bai ? `${Math.round(r.thoi_gian_lam_bai / 60)}p` : '—'}
                            </td>
                            <td style={{ padding:'9px 10px', color:'#475569', whiteSpace:'nowrap' }}>
                              {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN',{day:'numeric',month:'short'}) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ChartCard>
          </div>
        )}

        {/* ═══ TAB: TỪ VỰNG ═══ */}
        {activeTab === 'vocab' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:g4, gap:10 }}>
              {[
                { icon:CheckCircle2, label:'Thuần thục', color:'#34d399', value:fmt(totalMastered), note:`${pct(totalMastered, allVocabProgress.length)}% tổng` },
                { icon:BookOpen,     label:'Đang học',   color:'#38bdf8', value:fmt(totalLearning), note:`${pct(totalLearning, allVocabProgress.length)}% tổng` },
                { icon:RefreshCw,    label:'Ôn tập',     color:'#fbbf24', value:fmt(totalReview),   note:`${pct(totalReview,   allVocabProgress.length)}% tổng` },
                { icon:BookMarked,   label:'Mới',        color:'#64748b', value:fmt(totalNew),      note:`${pct(totalNew,      allVocabProgress.length)}% tổng` },
              ].map((k,i) => <div key={i} className="fade-up"><KpiCard {...k} /></div>)}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:g2, gap:16 }}>
              <ChartCard>
                <SectionHead icon={Activity} title="Hoạt động từ vựng" sub="Từ mới & ôn tập theo ngày" />
                {vocabChartData.length === 0 ? (
                  <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', fontSize:12 }}>Chưa có dữ liệu</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={vocabChartData} margin={{ top:5,right:5,bottom:0,left:-22 }}>
                      <defs>
                        <linearGradient id="vH" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}   />
                        </linearGradient>
                        <linearGradient id="vO" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#34d399" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="label" tick={{ fontSize:10,fill:'#64748b' }} axisLine={false} tickLine={false} interval={Math.ceil(vocabChartData.length/8)} />
                      <YAxis tick={{ fontSize:10,fill:'#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="hoc"   name="Từ mới"  stroke="#38bdf8" fill="url(#vH)" strokeWidth={2} />
                      <Area type="monotone" dataKey="onTap" name="Ôn tập"  stroke="#34d399" fill="url(#vO)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard>
                <SectionHead icon={BookOpen} title="Trạng thái từ vựng" sub={`Tổng ${fmt(allVocabProgress.length)} từ`} />
                {vocabStatePie.length === 0 ? (
                  <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', fontSize:12 }}>Chưa có dữ liệu</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={vocabStatePie} cx="50%" cy="50%" innerRadius={44} outerRadius={66}
                          dataKey="value" paddingAngle={4} strokeWidth={0}>
                          {vocabStatePie.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip formatter={(v,n) => [`${v} từ`,n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:6 }}>
                      {vocabStatePie.map((d, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                            <div style={{ width:8,height:8,borderRadius:2,background:d.color }} />
                            <span style={{ fontSize:12, color:'#94a3b8' }}>{d.name}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:56,height:3,background:'rgba(255,255,255,0.06)',borderRadius:2 }}>
                              <div style={{ width:`${pct(d.value, allVocabProgress.length)}%`, height:'100%', background:d.color, borderRadius:2 }} />
                            </div>
                            <span style={{ fontSize:11,fontWeight:700,color:d.color,minWidth:26,textAlign:'right' }}>{d.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </ChartCard>
            </div>

            <ChartCard>
              <SectionHead icon={GraduationCap} title="Từ vựng theo cấp độ CEFR" sub="Số từ đã thêm vào mỗi cấp" />
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  data={LEVEL_ORDER.map((lv,i) => ({ lv, soTu: byLevel[lv] ?? 0, color: LEVEL_COLORS[i] }))}
                  margin={{ top:5,right:5,bottom:0,left:-22 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="lv" tick={{ fontSize:11,fill:'#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10,fill:'#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v,n) => [`${v} từ`,n]} />
                  <Bar dataKey="soTu" name="Số từ" radius={[5,5,0,0]} maxBarSize={40}>
                    {LEVEL_ORDER.map((_,i) => <Cell key={i} fill={LEVEL_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
                {LEVEL_ORDER.map((lv,i) => (
                  <div key={lv} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748b' }}>
                    <div style={{ width:8,height:8,borderRadius:2,background:LEVEL_COLORS[i] }} />
                    {lv}: <span style={{ color:'#94a3b8', fontWeight:600 }}>{fmt(byLevel[lv] ?? 0)}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        )}

        {/* ═══ TAB: LUYỆN THI ═══ */}
        {activeTab === 'exam' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:g2, gap:16 }}>
              <ChartCard>
                <SectionHead icon={BarChart2} title="Điểm theo kỹ năng" sub="% đúng trung bình" />
                {Object.keys(bySkill).length === 0 ? (
                  <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', fontSize:12 }}>Chưa có dữ liệu</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      layout="vertical"
                      data={Object.entries(bySkill).map(([k,v]) => ({
                        skill: SKILL_META[k]?.label ?? k,
                        pct: pct(v.correct, v.total),
                      }))}
                      margin={{ top:5,right:20,bottom:0,left:8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" domain={[0,100]} tick={{ fontSize:10,fill:'#64748b' }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
                      <YAxis type="category" dataKey="skill" tick={{ fontSize:11,fill:'#94a3b8' }} axisLine={false} tickLine={false} width={58} />
                      <Tooltip formatter={v=>[`${v}%`,'Điểm TB']} />
                      <Bar dataKey="pct" name="Điểm TB" radius={[0,5,5,0]} maxBarSize={18}>
                        {Object.keys(bySkill).map((k,i) => <Cell key={i} fill={SKILL_META[k]?.color ?? '#64748b'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard>
                <SectionHead icon={TrendingUp} title="Điểm qua thời gian" sub="Xu hướng cải thiện" />
                {examChartData.length === 0 ? (
                  <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', fontSize:12 }}>Chưa có dữ liệu</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={examChartData} margin={{ top:5,right:10,bottom:0,left:-22 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="label" tick={{ fontSize:10,fill:'#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="l" tick={{ fontSize:10,fill:'#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="r" orientation="right" tick={{ fontSize:10,fill:'#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line yAxisId="l" type="monotone" dataKey="diemTB"  name="Điểm TB(%)" stroke="#818cf8" strokeWidth={2.5} dot={{ r:3,fill:'#818cf8' }} activeDot={{ r:5 }} />
                      <Line yAxisId="r" type="monotone" dataKey="soPhien" name="Số phiên"   stroke="#34d399" strokeWidth={2}   strokeDasharray="5 3" dot={{ r:3,fill:'#34d399' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            {Object.keys(bySkill).length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:g3, gap:12 }}>
                {Object.entries(bySkill).map(([k, v]) => {
                  const meta = SKILL_META[k]
                  const sc   = pct(v.correct, v.total)
                  const sc2  = scoreColor(sc)
                  return (
                    <div key={k} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'16px 18px' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          {meta && <meta.Icon size={15} color={meta.color} />}
                          <span style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{meta?.label ?? k}</span>
                        </div>
                        <span style={{ fontSize:10, color:'#64748b' }}>{v.count} phiên</span>
                      </div>
                      <div style={{ fontSize:'clamp(22px,3.5vw,28px)', fontWeight:700, color:sc2, fontFamily:"'DM Mono',monospace" }}>
                        {sc}<span style={{ fontSize:13 }}>%</span>
                      </div>
                      <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, margin:'8px 0' }}>
                        <div style={{ width:`${sc}%`, height:'100%', background:sc2, borderRadius:2, transition:'width .6s ease' }} />
                      </div>
                      <div style={{ fontSize:11, color:'#475569' }}>{v.correct}/{v.total} câu đúng</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: NGỮ PHÁP ═══ */}
        {activeTab === 'grammar' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <ChartCard>
              <SectionHead
                icon={Brain}
                title="Tiến độ ngữ pháp"
                sub={`${grammarDoneCount}/${allGrammarLessons.length} bài hoàn thành`}
              />
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {grammarByLevel.map(lv => (
                  <ProgressRow key={lv.lv} label={lv.lv} done={lv.done} total={lv.total} color={lv.color} />
                ))}
              </div>
            </ChartCard>

            <ChartCard>
              <SectionHead icon={BookMarked} title="Bài học đã hoàn thành" sub="Gần nhất" />
              {allGrammarProgress.filter(g => g.da_hoan_thanh).length === 0 ? (
                <div style={{ padding:'24px 0', textAlign:'center', color:'#475569', fontSize:12 }}>
                  Chưa hoàn thành bài nào. <Link href="/grammar" style={{ color:'#818cf8' }}>Học ngay →</Link>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {[...allGrammarProgress]
                    .filter(g => g.da_hoan_thanh)
                    .sort((a,b) => (b.ngay_hoan_thanh ?? '').localeCompare(a.ngay_hoan_thanh ?? ''))
                    .slice(0, 10)
                    .map((g, i) => {
                      const lv    = g.BaiHocNguPhap?.cap_do
                      const lvIdx = LEVEL_ORDER.indexOf(lv ?? '')
                      const lc    = LEVEL_COLORS[lvIdx] ?? '#64748b'
                      return (
                        <div key={i} style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8,
                          padding:'9px 12px', borderRadius:10,
                          background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)',
                        }}
                          onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.04)')}
                          onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                        >
                          <div style={{ display:'flex', alignItems:'center', gap:9, flex:1, minWidth:0 }}>
                            <CheckCircle2 size={13} color="#34d399" style={{ flexShrink:0 }} />
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {g.BaiHocNguPhap?.tieu_de ?? 'Bài học'}
                              </div>
                              <div style={{ fontSize:10, color:'#64748b' }}>{g.BaiHocNguPhap?.danh_muc}</div>
                            </div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                            {lv && <Pill label={lv} color={lc} />}
                            {g.diem_bai_tap != null && (
                              <span style={{ fontSize:12, fontWeight:700, color: g.diem_bai_tap >= 8 ? '#34d399' : '#fbbf24' }}>
                                {g.diem_bai_tap}/10
                              </span>
                            )}
                            <span style={{ fontSize:10, color:'#475569' }}>
                              {g.ngay_hoan_thanh
                                ? new Date(g.ngay_hoan_thanh).toLocaleDateString('vi-VN',{day:'numeric',month:'short'})
                                : ''}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </ChartCard>
          </div>
        )}

        {/* Module shortcuts */}
        <div style={{ display:'grid', gridTemplateColumns:g4, gap:10, marginTop:24 }}>
          {[
            { href:'/vocabulary', Icon:BookOpen,      label:'Học từ vựng',  desc:'SRS thông minh',  color:'#38bdf8' },
            { href:'/grammar',    Icon:Brain,          label:'Ngữ pháp',     desc:'A1 → C1',         color:'#a78bfa' },
            { href:'/exam',       Icon:FileText,       label:'Luyện thi',    desc:'VSTEP · TOEIC',   color:'#34d399' },
            { href:'/ai-chat',    Icon:MessageSquare,  label:'AI Chatbot',   desc:'Luyện nói 24/7',  color:'#fbbf24' },
          ].map(m => (
            <Link key={m.href} href={m.href} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'13px 15px', borderRadius:12,
              background:'rgba(255,255,255,0.02)',
              border:'1px solid rgba(255,255,255,0.06)',
              textDecoration:'none', transition:'all .15s',
            }}
              onMouseEnter={e=>{
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = `${m.color}10`
                el.style.borderColor = `${m.color}30`
              }}
              onMouseLeave={e=>{
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = 'rgba(255,255,255,0.02)'
                el.style.borderColor = 'rgba(255,255,255,0.06)'
              }}
            >
              <div style={{ width:34,height:34,borderRadius:9,background:`${m.color}14`,border:`1px solid ${m.color}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <m.Icon size={15} color={m.color} />
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'#e2e8f0' }}>{m.label}</div>
                <div style={{ fontSize:10, color:'#475569', marginTop:1 }}>{m.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}