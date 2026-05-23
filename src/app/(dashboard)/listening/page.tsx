'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  Headphones, Play, StopCircle, ChevronRight, ChevronLeft,
  RotateCcw, Search, SlidersHorizontal, Youtube, Mic,
  Clock, BookOpen, CheckCircle2, XCircle, Lightbulb,
  Trophy, ListFilter, Eye, EyeOff,
  CheckCheck, CircleDot, ArrowRight, PenLine, ToggleLeft,
  Home, GraduationCap, Briefcase, Globe2, Target, FileText,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface DuLieuThem {
  dap_an_chap_nhan?: string[][]
  trich_dan_script?: string
  loai?: 'chon_nghia' | 'chon_tu' | 'dien_tu'
  tu_tieng_anh?: string
}
interface CauHoi {
  id: string; so_thu_tu: number; noi_dung: string
  cac_lua_chon: string[] | null; dap_an_dung: string
  giai_thich: string
  loai_cau_hoi: 'trac_nghiem' | 'dien_cho_trong' | 'true_false' | 'nghe_tu_vung'
  du_lieu_them: DuLieuThem | null
}
interface BaiNghe {
  id: string; tieu_de: string; mo_ta: string; cap_do: string
  loai_chung_chi: string; chu_de: string; video_url: string | null
  script: string; thoi_gian_giay: number; luot_lam: number
  BaiNgheCauHoi: CauHoi[]
}
interface DaLamInfo { diem: number; tong: number; ngay: string }

// ── Design tokens (identical to Writing) ─────────────────────────────────────
const C = {
  bg:       '#F8F5EE',
  white:    '#FFFFFF',
  navy:     '#0F1C35',
  navyMid:  '#1E2F50',
  gold:     '#C9A84C',
  goldLt:   '#E8C97A',
  goldPale: '#FDF8EE',
  green:    '#00A878',
  greenLt:  '#4ECBA8',
  blue:     '#2B6CB0',
  violet:   '#6478F0',
  rose:     '#F06464',
  slate:    '#64748B',
  border:   'rgba(201,168,76,0.18)',
  borderMd: 'rgba(201,168,76,0.30)',
  text:     '#1A1E2E',
  textMid:  '#4A5568',
  textLt:   '#94A3B8',
}
const CERT_COLOR: Record<string, string> = {
  VSTEP: '#185FA5', TOEIC: '#00A878', APTIS: '#6478F0',
}
const CERT_ICON: Record<string, React.ElementType> = {
  VSTEP: GraduationCap, TOEIC: Briefcase, APTIS: Globe2,
}
const LEVEL_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  A2: { bg: '#EBF4FF', color: '#2B6CB0', border: 'rgba(43,108,176,.3)' },
  B1: { bg: '#E1F5EE', color: '#0F6E56', border: 'rgba(0,168,120,.3)' },
  B2: { bg: '#E6F1FB', color: '#185FA5', border: 'rgba(24,95,165,.3)' },
  C1: { bg: '#F0EFFE', color: '#4A56C2', border: 'rgba(100,120,240,.3)' },
}
const CERTS     = ['All', 'TOEIC', 'VSTEP', 'APTIS']
const LEVELS    = ['All', 'A2', 'B1', 'B2']
const DURATIONS = ['All', '< 2 min', '2–5 min', '5+ min']
const STATUSES  = ['All', 'Not done', 'Done', 'High score']

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeTF(s: string) { return s.trim().toUpperCase().replace(/\s+/g, '_') }
function checkDienChoTrong(u: string, c: string, d: DuLieuThem | null) {
  const n = (s: string) => s.trim().toLowerCase().replace(/['']/g, "'")
  if (n(u) === n(c)) return true
  if (d?.dap_an_chap_nhan) {
    const b = d.dap_an_chap_nhan[0] ?? []
    if (b.some(v => n(v) === n(u))) return true
  }
  return false
}
function displayCorrectAnswer(s: string) {
  try { const p = JSON.parse(s); if (Array.isArray(p)) return p.join(' / ') } catch {}
  return s
}
function isAnswerCorrect(q: CauHoi, answer: string) {
  if (!answer) return false
  switch (q.loai_cau_hoi) {
    case 'trac_nghiem':    return answer === q.dap_an_dung
    case 'true_false':     return normalizeTF(answer) === normalizeTF(q.dap_an_dung)
    case 'dien_cho_trong': return checkDienChoTrong(answer, q.dap_an_dung, q.du_lieu_them)
    case 'nghe_tu_vung': {
      const l = q.du_lieu_them?.loai ?? 'chon_nghia'
      if (l === 'dien_tu') return answer.trim().toLowerCase() === q.dap_an_dung.trim().toLowerCase()
      return answer === q.dap_an_dung
    }
    default: return answer === q.dap_an_dung
  }
}

// ── Global CSS (identical to Writing) ────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes blobMorph { 0%,100%{border-radius:60% 40% 30% 70% / 60% 30% 70% 40%} 50%{border-radius:30% 60% 70% 40% / 50% 60% 30% 60%} }
  @keyframes wave { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }
  @keyframes shimmer { 0%,100%{opacity:.35} 50%{opacity:.7} }
  .fade-in { animation: fadeUp .45s cubic-bezier(.16,1,.3,1) both; }
  .task-card { transition: all .38s cubic-bezier(.16,1,.3,1); position: relative; overflow: hidden; }
  .task-card::after { content:''; position:absolute; bottom:0; left:0; width:0; height:3px; background:#C9A84C; transition:width .38s cubic-bezier(.16,1,.3,1); border-radius:0 0 24px 24px; }
  .task-card:hover { transform: translateY(-7px) scale(1.01); box-shadow: 0 28px 56px rgba(15,28,53,.14) !important; border-color: rgba(201,168,76,.45) !important; }
  .task-card:hover::after { width:100%; }
  input:focus { outline: none; border-color: #C9A84C !important; box-shadow: 0 0 0 3px rgba(201,168,76,.12) !important; }
  .submit-btn { transition: all .32s cubic-bezier(.34,1.56,.64,1); }
  .submit-btn:hover:not(:disabled) { transform: translateY(-3px) scale(1.01); box-shadow: 0 12px 32px rgba(201,168,76,.5) !important; }
`

// ── Shared atoms (identical to Writing) ──────────────────────────────────────
function Panel({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={className} style={{ background: C.white, borderRadius: 24, border: `1px solid ${C.border}`, padding: '28px 32px', boxShadow: '0 2px 16px rgba(15,28,53,.07)', ...style }}>{children}</div>
  )
}
function SectionHeader({ icon: Icon, title, sub, color }: { icon: React.ElementType; title: string; sub?: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color={color} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.3 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: C.textMid, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}
function CertBadge({ cert }: { cert: string }) {
  const color = CERT_COLOR[cert] || C.slate
  return <span style={{ padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: `${color}12`, color, border: `1px solid ${color}28`, letterSpacing: '.04em', fontFamily: "'DM Sans', sans-serif" }}>{cert}</span>
}
function LevelBadge({ level }: { level: string }) {
  const s = LEVEL_STYLE[level] || LEVEL_STYLE.B1
  return <span style={{ padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: '.04em', fontFamily: "'DM Sans', sans-serif" }}>{level}</span>
}
function QuestionTypeBadge({ type }: { type: CauHoi['loai_cau_hoi'] }) {
  const meta: Record<string, { label: string; color: string; bg: string }> = {
    trac_nghiem:    { label: 'MCQ',     color: C.blue,   bg: '#EBF4FF' },
    dien_cho_trong: { label: 'Fill in', color: C.violet, bg: '#F0EFFE' },
    true_false:     { label: 'T/F/NG',  color: C.green,  bg: '#E1F5EE' },
    nghe_tu_vung:   { label: 'Vocab',   color: C.gold,   bg: C.goldPale },
  }
  const m = meta[type] ?? meta.trac_nghiem
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: '.04em', color: m.color, background: m.bg, fontFamily: "'DM Sans', sans-serif" }}>{m.label}</span>
}
function ScoreRing({ score, max }: { score: number; max: number }) {
  const r = 44, cx = 52, cy = 52, circ = 2 * Math.PI * r
  const pct = score / max
  const bar = pct >= 0.8 ? C.green : pct >= 0.6 ? C.gold : C.rose
  return (
    <svg width={108} height={108} viewBox="0 0 104 104">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${C.navy}10`} strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={bar} strokeWidth={8}
        strokeDasharray={`${circ * score / max} ${circ * (1 - score / max)}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={cx} y={cy - 7} textAnchor="middle" fill={bar} fontSize={24} fontWeight={800} fontFamily="'Playfair Display', serif">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={C.textLt} fontSize={13} fontFamily="'DM Sans', sans-serif">/{max}</text>
    </svg>
  )
}
function SmallScoreRing({ pct }: { pct: number }) {
  const r = 18, cx = 23, cy = 23, circ = 2 * Math.PI * r
  const col = pct >= 80 ? C.green : pct >= 60 ? C.gold : C.rose
  return (
    <svg width={46} height={46} viewBox="0 0 46 46" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${col}20`} strokeWidth={4} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dashoffset .9s' }}
      />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill={col} fontSize={9} fontWeight={900} fontFamily="'DM Sans',sans-serif">{pct}%</text>
    </svg>
  )
}
function TaskSkeleton() {
  return (
    <div style={{ background: C.white, borderRadius: 24, border: `1px solid ${C.border}`, padding: 28, boxShadow: '0 2px 12px rgba(15,28,53,.05)' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F3F4F6' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, width: 80, marginBottom: 10 }} />
          <div style={{ height: 18, background: '#F3F4F6', borderRadius: 6, width: 180 }} />
        </div>
      </div>
      <div style={{ height: 13, background: '#F3F4F6', borderRadius: 6, marginBottom: 10 }} />
      <div style={{ height: 13, background: '#F3F4F6', borderRadius: 6, width: '60%' }} />
    </div>
  )
}

// ── Question renderers (unchanged logic, updated styling) ─────────────────────
function TracNghiemQuestion({ q, answer, submitted, onAnswer }: { q: CauHoi; answer: string; submitted: boolean; onAnswer: (v: string) => void }) {
  const opts = q.cac_lua_chon ?? []
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {opts.map(opt => {
        const key = opt.charAt(0), sel = answer === key
        const isCorrect = submitted && key === q.dap_an_dung
        const isWrong   = submitted && sel && key !== q.dap_an_dung
        return (
          <button key={key} onClick={() => !submitted && onAnswer(key)} disabled={submitted} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            textAlign: 'left', padding: '12px 15px', borderRadius: 14,
            fontSize: 14, fontWeight: sel || isCorrect ? 600 : 400,
            fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
            border: isCorrect ? `2px solid ${C.green}` : isWrong ? `2px solid ${C.rose}` : sel ? `2px solid ${C.gold}` : `1.5px solid ${C.border}`,
            background: isCorrect ? '#E1F5EE' : isWrong ? '#FEF2F2' : sel ? C.goldPale : C.white,
            color: C.navy, cursor: submitted ? 'default' : 'pointer', transition: 'all .15s',
          }}>
            {isCorrect && <CheckCircle2 size={14} color={C.green} style={{ flexShrink: 0 }} />}
            {isWrong   && <XCircle      size={14} color={C.rose}  style={{ flexShrink: 0 }} />}
            <span>{opt}</span>
          </button>
        )
      })}
    </div>
  )
}
function DienChoTrongQuestion({ q, answer, submitted, onAnswer }: { q: CauHoi; answer: string; submitted: boolean; onAnswer: (v: string) => void }) {
  const isCorrect = submitted && checkDienChoTrong(answer, q.dap_an_dung, q.du_lieu_them)
  const isWrong   = submitted && !isCorrect
  const parts     = q.noi_dung.split('___')
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, fontSize: 15, color: C.navy, lineHeight: 2.2, fontFamily: "'DM Sans', sans-serif" }}>
        {parts.map((part, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span>{part}</span>
            {i < parts.length - 1 && (
              <input value={answer} onChange={e => !submitted && onAnswer(e.target.value)} disabled={submitted} placeholder="..."
                style={{ width: Math.max(90, (answer.length || 6) * 9 + 28), padding: '5px 12px', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", border: isCorrect ? `2px solid ${C.green}` : isWrong ? `2px solid ${C.rose}` : `1.5px solid ${C.gold}`, background: isCorrect ? '#E1F5EE' : isWrong ? '#FEF2F2' : C.goldPale, color: C.navy, textAlign: 'center', outline: 'none', transition: 'all .15s', display: 'inline-block' }}
              />
            )}
          </span>
        ))}
      </div>
      {submitted && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: isCorrect ? C.green : C.rose, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
          {isCorrect ? <><CheckCircle2 size={14} /> Correct!</> : <><XCircle size={14} /> Correct answer: <b>{displayCorrectAnswer(q.dap_an_dung)}</b></>}
        </div>
      )}
    </div>
  )
}
function TrueFalseQuestion({ q, answer, submitted, onAnswer }: { q: CauHoi; answer: string; submitted: boolean; onAnswer: (v: string) => void }) {
  const opts   = ['TRUE', 'FALSE', 'NOT_GIVEN']
  const labels: Record<string, string> = { TRUE: 'True', FALSE: 'False', NOT_GIVEN: 'Not Given' }
  const colors: Record<string, string> = { TRUE: C.green, FALSE: C.rose, NOT_GIVEN: C.gold }
  const normDB = normalizeTF(q.dap_an_dung)
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {opts.map(opt => {
        const sel = normalizeTF(answer) === opt
        const isCorrect = submitted && opt === normDB
        const isWrong   = submitted && sel && opt !== normDB
        const col = colors[opt]
        return (
          <button key={opt} onClick={() => !submitted && onAnswer(opt)} disabled={submitted} style={{ flex: 1, minWidth: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px 16px', borderRadius: 14, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", border: isCorrect ? `2px solid ${col}` : isWrong ? `2px solid ${C.rose}` : sel ? `2px solid ${col}` : `1.5px solid ${C.border}`, background: isCorrect ? `${col}18` : isWrong ? '#FEF2F2' : sel ? `${col}12` : C.white, color: isCorrect || sel ? col : C.textMid, cursor: submitted ? 'default' : 'pointer', transition: 'all .15s' }}>
            {isCorrect && <CheckCircle2 size={14} color={col} />}
            {isWrong   && <XCircle      size={14} color={C.rose} />}
            {labels[opt]}
          </button>
        )
      })}
    </div>
  )
}
function NghetuVungQuestion({ q, answer, submitted, onAnswer }: { q: CauHoi; answer: string; submitted: boolean; onAnswer: (v: string) => void }) {
  const loai = q.du_lieu_them?.loai ?? 'chon_nghia'
  if (loai === 'dien_tu') {
    const isCorrect = submitted && answer.trim().toLowerCase() === q.dap_an_dung.trim().toLowerCase()
    const isWrong   = submitted && !isCorrect
    return (
      <div>
        <input value={answer} onChange={e => !submitted && onAnswer(e.target.value)} disabled={submitted} placeholder="Type the missing word…"
          style={{ width: '100%', padding: '12px 16px', borderRadius: 14, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", border: isCorrect ? `2px solid ${C.green}` : isWrong ? `2px solid ${C.rose}` : `1.5px solid ${C.gold}`, background: isCorrect ? '#E1F5EE' : isWrong ? '#FEF2F2' : C.goldPale, color: C.navy, outline: 'none', transition: 'all .15s' }}
        />
        {submitted && (
          <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: isCorrect ? C.green : C.rose, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            {isCorrect ? <><CheckCircle2 size={14} /> Correct!</> : <><XCircle size={14} /> Answer: <b>{q.dap_an_dung}</b></>}
          </div>
        )}
      </div>
    )
  }
  return <TracNghiemQuestion q={q} answer={answer} submitted={submitted} onAnswer={onAnswer} />
}
function QuestionCard({ q, index, answer, submitted, onAnswer }: { q: CauHoi; index: number; answer: string; submitted: boolean; onAnswer: (v: string) => void }) {
  return (
    <Panel style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 9, flexShrink: 0, marginTop: 1, background: C.goldPale, border: `1px solid ${C.borderMd}`, fontSize: 12, fontWeight: 900, color: C.gold, fontFamily: "'DM Sans', sans-serif" }}>{index + 1}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 10 }}><QuestionTypeBadge type={q.loai_cau_hoi} /></div>
          {q.loai_cau_hoi !== 'dien_cho_trong' && (
            <p style={{ margin: 0, color: C.navy, fontSize: 15, fontWeight: 500, lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif" }}>{q.noi_dung}</p>
          )}
        </div>
      </div>
      {q.loai_cau_hoi === 'trac_nghiem'    && <TracNghiemQuestion    q={q} answer={answer} submitted={submitted} onAnswer={onAnswer} />}
      {q.loai_cau_hoi === 'dien_cho_trong' && <DienChoTrongQuestion  q={q} answer={answer} submitted={submitted} onAnswer={onAnswer} />}
      {q.loai_cau_hoi === 'true_false'     && <TrueFalseQuestion     q={q} answer={answer} submitted={submitted} onAnswer={onAnswer} />}
      {q.loai_cau_hoi === 'nghe_tu_vung'   && <NghetuVungQuestion    q={q} answer={answer} submitted={submitted} onAnswer={onAnswer} />}
      {submitted && q.giai_thich && (
        <div style={{ marginTop: 16, padding: '13px 17px', background: C.goldPale, borderRadius: 12, border: `1px solid ${C.borderMd}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Lightbulb size={15} color={C.gold} style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: C.text, lineHeight: 1.78, fontFamily: "'DM Sans', sans-serif" }}>{q.giai_thich}</span>
        </div>
      )}
      {submitted && q.loai_cau_hoi === 'true_false' && q.du_lieu_them?.trich_dan_script && (
        <div style={{ marginTop: 10, padding: '12px 16px', background: 'rgba(100,120,240,.05)', borderRadius: 12, border: `1px solid rgba(100,120,240,.16)`, fontSize: 14, color: C.textMid, fontStyle: 'italic', lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif" }}>
          📖 "{q.du_lieu_them.trich_dan_script}"
        </div>
      )}
    </Panel>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ListeningPage() {
  const [baiList, setBaiList]   = useState<BaiNghe[]>([])
  const [daLamMap, setDaLamMap] = useState<Record<string, DaLamInfo>>({})
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<BaiNghe | null>(null)

  const [search, setSearch]           = useState('')
  const [certF, setCertF]             = useState('All')
  const [levelF, setLevelF]           = useState('All')
  const [durF, setDurF]               = useState('All')
  const [statusF, setStatusF]         = useState('All')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [answers, setAnswers]       = useState<Record<string, string>>({})
  const [submitted, setSubmitted]   = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [playing, setPlaying]       = useState(false)
  const [playCount, setPlayCount]   = useState(0)
  const [speed, setSpeed]           = useState(1)
  const [startTime, setStartTime]   = useState(0)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => { fetchAll() }, [])
  async function fetchAll() {
    setLoading(true)
    try {
      const res = await fetch('/api/listening')
      const d   = await res.json()
      setBaiList(d.baiNghe || [])
      setDaLamMap(d.daLamMap || {})
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => baiList.filter(b => {
    const dl  = daLamMap[b.id]
    const pct = dl ? Math.round((dl.diem / dl.tong) * 100) : null
    const q   = search.toLowerCase()
    if (q && !b.tieu_de.toLowerCase().includes(q) && !b.chu_de.toLowerCase().includes(q)) return false
    if (certF  !== 'All' && b.loai_chung_chi !== certF) return false
    if (levelF !== 'All' && b.cap_do !== levelF)        return false
    if (durF !== 'All') {
      const m = b.thoi_gian_giay / 60
      if (durF === '< 2 min' && m >= 2)           return false
      if (durF === '2–5 min' && (m < 2 || m > 5)) return false
      if (durF === '5+ min'  && m <= 5)            return false
    }
    if (statusF === 'Not done'   && dl)                         return false
    if (statusF === 'Done'       && !dl)                        return false
    if (statusF === 'High score' && (pct === null || pct < 80)) return false
    return true
  }), [baiList, daLamMap, search, certF, levelF, durF, statusF])

  const hasFilters = certF !== 'All' || levelF !== 'All' || durF !== 'All' || statusF !== 'All' || search !== ''
  const clearAll   = () => { setCertF('All'); setLevelF('All'); setDurF('All'); setStatusF('All'); setSearch('') }

  function playAudio() {
    if (!selected || playCount >= 2) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(selected.script)
    u.lang = 'en-US'; u.rate = speed
    u.onstart = () => setPlaying(true)
    u.onend   = () => { setPlaying(false); setPlayCount(p => p + 1) }
    u.onerror = () => setPlaying(false)
    utterRef.current = u
    window.speechSynthesis.speak(u)
  }
  function stopAudio() { window.speechSynthesis.cancel(); setPlaying(false) }
  function startBai(bai: BaiNghe) {
    setSelected(bai); setAnswers({}); setSubmitted(false)
    setShowScript(false); setPlayCount(0); setPlaying(false)
    setStartTime(Date.now()); window.scrollTo(0, 0)
  }
  async function handleSubmit() {
    if (!selected) return
    const total    = selected.BaiNgheCauHoi.length
    const answered = Object.keys(answers).length
    if (answered < total) { toast.error(`Trả lời tất cả ${total} câu hỏi`); return }
    const correct  = selected.BaiNgheCauHoi.filter(q => isAnswerCorrect(q, answers[q.id] ?? '')).length
    const pct      = Math.round((correct / total) * 100)
    const thoiGian = Math.round((Date.now() - startTime) / 1000)
    setSubmitted(true)
    if (pct >= 80)      toast.success(`Xuất sắc! ${correct}/${total} đúng 🎉`)
    else if (pct >= 60) toast(`Tốt! ${correct}/${total} đúng`, { icon: '👍' })
    else                toast(`Cố gắng thêm. ${correct}/${total} đúng`, { icon: '📖' })
    try {
      await fetch('/api/listening', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baiId: selected.id, tieu_de: selected.tieu_de, loai_chung_chi: selected.loai_chung_chi, cap_do: selected.cap_do, correct, total, thoiGianLamBai: thoiGian, cauTraLoi: answers }),
      })
      setDaLamMap(p => ({ ...p, [selected.id]: { diem: correct, tong: total, ngay: new Date().toISOString() } }))
    } catch { /* silent */ }
  }
  function goHome() { stopAudio(); setSelected(null) }

  // ── PRACTICE VIEW ──────────────────────────────────────────────────────────
  if (selected) {
    const qs       = selected.BaiNgheCauHoi
    const total    = qs.length
    const correct  = submitted ? qs.filter(q => isAnswerCorrect(q, answers[q.id] ?? '')).length : 0
    const pct      = submitted ? Math.round((correct / total) * 100) : 0
    const answered = Object.keys(answers).length
    const certColor = CERT_COLOR[selected.loai_chung_chi] || C.slate

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 36, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
        <style suppressHydrationWarning>{GLOBAL_CSS}</style>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: C.textLt, marginBottom: 28 }}>
          <span onClick={goHome} style={{ cursor: 'pointer', color: C.gold, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
            <Home size={14} strokeWidth={2} /> Luyện nghe
          </span>
          <ChevronRight size={15} color={C.textLt} strokeWidth={1.8} />
          <span style={{ color: C.navy, fontWeight: 600 }}>{selected.tieu_de}</span>
        </div>

        {/* Hero navy banner — identical to Writing */}
        <div style={{ background: C.navy, borderRadius: 24, padding: '32px 36px', marginBottom: 32, position: 'relative', overflow: 'hidden', boxShadow: '0 12px 40px rgba(15,28,53,.2)' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(201,168,76,.07)', borderRadius: '60% 40% 30% 70%', pointerEvents: 'none', filter: 'blur(20px)' }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <CertBadge cert={selected.loai_chung_chi} />
            <LevelBadge level={selected.cap_do} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, color: '#fff', marginBottom: 10, lineHeight: 1.2, letterSpacing: '-0.2px' }}>{selected.tieu_de}</h2>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, color: 'rgba(255,255,255,.45)' }}>{selected.chu_de}</span>
            <span style={{ fontSize: 15, color: 'rgba(255,255,255,.35)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={14} strokeWidth={1.8} /> {Math.round(selected.thoi_gian_giay / 60)} phút
            </span>
            <span style={{ fontSize: 15, color: 'rgba(255,255,255,.35)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <BookOpen size={14} strokeWidth={1.8} /> {total} câu hỏi
            </span>
          </div>
          {/* Progress pill */}
          <div style={{ position: 'absolute', top: 28, right: 36, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 50, fontSize: 14, fontWeight: 700, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', color: answered >= total ? C.goldLt : 'rgba(255,255,255,.5)', fontFamily: "'DM Sans', sans-serif" }}>
            {answered >= total ? <CheckCheck size={14} /> : <CircleDot size={14} />}
            {answered}/{total}
          </div>
        </div>

        {/* 2-col layout identical to Writing */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Audio panel */}
            <Panel style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ background: C.navy, borderRadius: '24px 24px 0 0', padding: '22px 28px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'rgba(201,168,76,.06)', borderRadius: '60% 40% 30% 70%', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: playing ? 16 : 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(201,168,76,.14)', border: '1px solid rgba(201,168,76,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selected.video_url ? <Youtube size={18} color={C.gold} strokeWidth={1.8} /> : <Mic size={18} color={C.gold} strokeWidth={1.8} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>{selected.video_url ? 'YouTube Video' : 'Audio · Web TTS'}</div>
                      {!selected.video_url && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{playCount}/2 lần phát đã dùng</div>}
                    </div>
                  </div>
                  {!selected.video_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginRight: 3 }}>Speed</span>
                      {[0.75, 1, 1.25].map(s => (
                        <button key={s} onClick={() => setSpeed(s)} style={{ padding: '4px 11px', borderRadius: 50, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: speed === s ? C.gold : 'rgba(255,255,255,.08)', color: speed === s ? C.navy : 'rgba(255,255,255,.4)', transition: 'all .16s' }}>{s}x</button>
                      ))}
                    </div>
                  )}
                </div>

                {playing && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, height: 28, marginBottom: 16 }}>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} style={{ width: 3, background: C.gold, borderRadius: 2, opacity: .7, height: `${8 + (i % 6) * 4}px`, animation: `wave ${.44 + i * .033}s ease-in-out infinite`, animationDelay: `${i * .04}s` }} />
                    ))}
                  </div>
                )}

                {selected.video_url ? (
                  <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '16/9' }}>
                    <iframe src={selected.video_url} style={{ width: '100%', height: '100%' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="submit-btn" onClick={playing ? stopAudio : playAudio} disabled={playCount >= 2} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '13px 0', borderRadius: 50, fontSize: 15, fontWeight: 700, border: 'none', cursor: playCount >= 2 ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", background: playCount >= 2 ? 'rgba(255,255,255,.06)' : playing ? C.rose : C.green, color: playCount >= 2 ? 'rgba(255,255,255,.2)' : '#fff', boxShadow: playCount >= 2 || playing ? 'none' : '0 4px 18px rgba(0,168,120,.32)', transition: 'all .22s' }}>
                      {playing ? <><StopCircle size={15} /> Dừng</> : playCount === 0 ? <><Play size={15} /> Phát Audio</> : <><RotateCcw size={14} /> Phát lại (lần 2)</>}
                    </button>
                    <button onClick={() => setShowScript(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 20px', borderRadius: 50, fontSize: 14, fontWeight: 600, border: `1px solid ${showScript ? 'rgba(201,168,76,.5)' : 'rgba(255,255,255,.15)'}`, background: showScript ? 'rgba(201,168,76,.14)' : 'rgba(255,255,255,.06)', color: showScript ? C.gold : 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all .2s' }}>
                      {showScript ? <EyeOff size={15} /> : <Eye size={15} />} Script
                    </button>
                  </div>
                )}
              </div>

              {showScript && (
                <div style={{ padding: '22px 28px', borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>📖 Script</div>
                  <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.9, whiteSpace: 'pre-line', fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif" }}>{selected.script}</div>
                </div>
              )}
            </Panel>

            {/* Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {qs.map((q, i) => (
                <QuestionCard key={q.id} q={q} index={i} answer={answers[q.id] ?? ''} submitted={submitted} onAnswer={val => setAnswers(p => ({ ...p, [q.id]: val }))} />
              ))}
            </div>

            {/* Submit / Result */}
            {!submitted ? (
              <button className="submit-btn" onClick={handleSubmit} disabled={answered < total} style={{ width: '100%', padding: '16px 0', background: answered >= total ? C.gold : `${C.navy}14`, color: answered >= total ? C.navy : C.textLt, fontWeight: 700, fontSize: 16, border: 'none', borderRadius: 50, cursor: answered < total ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: answered >= total ? '0 8px 24px rgba(201,168,76,.4)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                <CheckCheck size={16} strokeWidth={2} />
                {answered >= total ? 'Nộp bài' : `Cần trả lời thêm ${total - answered} câu nữa`}
              </button>
            ) : (
              /* Result card — identical structure to Writing feedback hero */
              <div style={{ background: C.navy, borderRadius: 28, padding: '36px 40px', display: 'flex', alignItems: 'center', gap: 36, position: 'relative', overflow: 'hidden', flexWrap: 'wrap', boxShadow: '0 20px 56px rgba(15,28,53,.22)' }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 260, height: 260, background: 'rgba(201,168,76,.07)', borderRadius: '60% 40% 30% 70%', pointerEvents: 'none', filter: 'blur(24px)' }} />
                <ScoreRing score={correct} max={total} />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>
                    {pct >= 80 ? 'Xuất sắc!' : pct >= 60 ? 'Khá tốt!' : 'Cố gắng thêm nhé'}
                  </div>
                  <div style={{ fontSize: 15, color: 'rgba(255,255,255,.45)', fontFamily: "'DM Sans', sans-serif" }}>
                    {correct}/{total} câu đúng · {pct}%
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button onClick={() => { setAnswers({}); setSubmitted(false); setPlayCount(0); setStartTime(Date.now()) }} style={{ padding: '11px 24px', borderRadius: 50, background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.85)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 8, transition: 'all .25s' }}>
                    <RotateCcw size={15} /> Làm lại
                  </button>
                  <button onClick={goHome} style={{ padding: '11px 24px', borderRadius: 50, background: C.gold, border: 'none', color: C.navy, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 20px rgba(201,168,76,.45)', transition: 'all .28s cubic-bezier(.34,1.56,.64,1)' }}>
                    <ChevronLeft size={15} strokeWidth={2} /> Bài khác
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar — mirrors Writing sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Progress tracker */}
            <Panel>
              <SectionHeader icon={CircleDot} title="Tiến độ" sub={`${answered}/${total} đã trả lời`} color={certColor} />
              <div style={{ height: 6, background: `${C.navy}08`, borderRadius: 3, overflow: 'hidden', marginBottom: 18 }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, answered / total * 100)}%`, background: answered >= total ? C.green : C.gold, transition: 'width .4s cubic-bezier(.16,1,.3,1)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {qs.map((q, i) => {
                  const ans = answers[q.id], done = !!ans
                  const ok  = submitted && isAnswerCorrect(q, ans ?? '')
                  const bad = submitted && done && !ok
                  return (
                    <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 12, background: bad ? '#FEF2F2' : ok ? '#E1F5EE' : done ? C.goldPale : C.bg, border: `1px solid ${bad ? 'rgba(240,100,100,.2)' : ok ? 'rgba(0,168,120,.2)' : done ? C.borderMd : C.border}` }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: bad ? C.rose : ok ? C.green : done ? C.gold : `${C.navy}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: done ? '#fff' : C.textLt }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: bad ? '#A32D2D' : ok ? '#0F6E56' : done ? '#7a5c00' : C.textLt, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
                        {q.noi_dung.substring(0, 36)}{q.noi_dung.length > 36 ? '…' : ''}
                      </span>
                      {bad && <XCircle size={13} color={C.rose} />}
                      {ok  && <CheckCircle2 size={13} color={C.green} />}
                    </div>
                  )
                })}
              </div>
            </Panel>

            {/* Result breakdown */}
            {submitted && (
              <>
                <Panel style={{ background: '#E1F5EE', border: '1px solid rgba(0,168,120,.22)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F6E56', marginBottom: 14 }}>✅ Đúng ({correct})</div>
                  {qs.filter(q => isAnswerCorrect(q, answers[q.id] ?? '')).map((q, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14, color: '#1a4a3a', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
                      <CheckCircle2 size={14} color={C.green} style={{ flexShrink: 0, marginTop: 2 }} /> Câu {qs.indexOf(q) + 1}
                    </div>
                  ))}
                </Panel>
                <Panel style={{ background: '#FEF2F2', border: '1px solid rgba(240,100,100,.22)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#A32D2D', marginBottom: 14 }}>📈 Cần xem lại ({total - correct})</div>
                  {qs.filter(q => !isAnswerCorrect(q, answers[q.id] ?? '')).map((q, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14, color: '#5a1a1a', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
                      <ArrowRight size={14} color={C.rose} style={{ flexShrink: 0, marginTop: 2 }} /> Câu {qs.indexOf(q) + 1}
                    </div>
                  ))}
                </Panel>
              </>
            )}

            {/* Tip card — mirrors Writing's Flame tip */}
            {!submitted && (
              <Panel style={{ background: C.goldPale, border: `1px solid ${C.borderMd}` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(201,168,76,.2)', border: `1px solid ${C.borderMd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Headphones size={18} color={C.gold} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#7a5c00', marginBottom: 6 }}>Lưu ý khi nghe</div>
                    <div style={{ fontSize: 14, color: '#7a5c00', lineHeight: 1.72, fontFamily: "'DM Sans', sans-serif" }}>Nghe toàn bộ audio trước khi trả lời. Bạn chỉ được phát tối đa 2 lần — hãy tập trung từ đầu.</div>
                  </div>
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  const doneCount = Object.keys(daLamMap).length
  const highCount = Object.values(daLamMap).filter(v => Math.round(v.diem / v.tong * 100) >= 80).length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 36, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning>{GLOBAL_CSS}</style>

      {/* Hero — identical to Writing */}
      <div style={{ background: C.navy, borderRadius: 28, padding: 'clamp(32px,4vw,52px) clamp(28px,4vw,52px)', marginBottom: 40, position: 'relative', overflow: 'hidden', boxShadow: '0 20px 60px rgba(15,28,53,.25)' }}>
        <div style={{ position: 'absolute', top: -70, right: -70, width: 320, height: 320, background: 'rgba(201,168,76,.07)', borderRadius: '60% 40% 30% 70%', animation: 'blobMorph 10s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(24px)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, background: 'rgba(0,168,120,.06)', borderRadius: '40% 60%', pointerEvents: 'none', filter: 'blur(28px)' }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.28)', borderRadius: 50, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 20 }}>
          <Headphones size={11} strokeWidth={2.5} /> Luyện kỹ năng nghe
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,4.5vw,52px)', fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
          Listening <em style={{ fontStyle: 'italic', color: C.gold }}>Practice</em>
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,.52)', maxWidth: 520, lineHeight: 1.78, marginBottom: 32 }}>
          {baiList.length} bài nghe · Nghe · Hiểu · Trả lời · VSTEP · TOEIC · APTIS
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' as const }}>
          {[
            { label: 'Tổng bài nghe',   val: baiList.length, icon: <Headphones size={18} strokeWidth={1.8} color={C.goldLt} /> },
            { label: 'Đã hoàn thành',   val: doneCount,      icon: <CheckCircle2 size={18} strokeWidth={1.8} color={C.greenLt} /> },
            { label: 'Điểm cao',        val: highCount,      icon: <Trophy size={18} strokeWidth={1.8} color={C.violet} /> },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 18, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12, backdropFilter: 'blur(8px)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search + filters */}
      <div className="fade-in" style={{ animationDelay: '40ms', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 420 }}>
            <Search size={15} color={C.textLt} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm bài nghe…"
              style={{ width: '100%', padding: '11px 18px 11px 44px', borderRadius: 50, fontSize: 14, border: `1.5px solid ${search ? C.gold : C.border}`, background: C.white, color: C.text, fontFamily: "'DM Sans', sans-serif", boxShadow: '0 2px 10px rgba(15,28,53,.06)', transition: 'all .2s' }}
            />
          </div>
          <button onClick={() => setFiltersOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 50, fontSize: 14, fontWeight: 600, border: `1.5px solid ${filtersOpen ? C.gold : C.border}`, background: filtersOpen ? C.goldPale : C.white, color: filtersOpen ? C.gold : C.textMid, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 2px 10px rgba(15,28,53,.06)', transition: 'all .2s' }}>
            <SlidersHorizontal size={15} strokeWidth={2.2} /> Lọc
            {hasFilters && <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold }} />}
          </button>
          {hasFilters && (
            <button onClick={clearAll} style={{ padding: '11px 18px', borderRadius: 50, fontSize: 13, fontWeight: 600, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.textLt, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Xóa bộ lọc</button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 14, color: C.textLt, whiteSpace: 'nowrap' }}>
            <b style={{ color: C.navy }}>{filtered.length}</b> kết quả
          </span>
        </div>

        {filtersOpen && (
          <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, padding: '20px 24px', boxShadow: '0 4px 20px rgba(15,28,53,.08)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Chứng chỉ',  opts: CERTS,     val: certF,   set: setCertF,   color: C.gold   },
              { label: 'Cấp độ',     opts: LEVELS,    val: levelF,  set: setLevelF,  color: C.green  },
              { label: 'Thời lượng', opts: DURATIONS, val: durF,    set: setDurF,    color: C.blue   },
              { label: 'Trạng thái', opts: STATUSES,  val: statusF, set: setStatusF, color: C.violet },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.textLt, textTransform: 'uppercase', letterSpacing: '0.9px', minWidth: 80, fontFamily: "'DM Sans', sans-serif" }}>{row.label}</span>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {row.opts.map(o => (
                    <button key={o} onClick={() => row.set(o)} style={{ padding: '6px 16px', borderRadius: 50, fontSize: 13, fontWeight: 700, border: `1.5px solid ${row.val === o ? row.color : C.border}`, background: row.val === o ? `${row.color}14` : 'transparent', color: row.val === o ? row.color : C.textLt, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all .16s' }}>{o}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 18 }}>
          {Array.from({ length: 6 }).map((_, i) => <TaskSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Headphones size={48} color={C.gold} strokeWidth={1.2} style={{ opacity: .28, marginBottom: 18 }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: C.navy, marginBottom: 10 }}>Không tìm thấy bài nghe</div>
          <div style={{ fontSize: 15, color: C.textLt, marginBottom: 20 }}>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</div>
          {hasFilters && (
            <button onClick={clearAll} style={{ padding: '11px 26px', borderRadius: 50, fontSize: 14, fontWeight: 700, background: C.white, border: `1.5px solid ${C.border}`, color: C.textMid, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Xóa bộ lọc</button>
          )}
        </div>
      ) : (
        Object.entries(
          filtered.reduce((acc, b) => {
            if (!acc[b.loai_chung_chi]) acc[b.loai_chung_chi] = []
            acc[b.loai_chung_chi].push(b)
            return acc
          }, {} as Record<string, BaiNghe[]>)
        ).map(([cert, certBais]) => {
          const CertIconComp = CERT_ICON[cert] || Headphones
          const certCol = CERT_COLOR[cert] || C.slate
          return (
            <div key={cert} className="fade-in" style={{ marginBottom: 40 }}>
              {/* Cert header — identical to Writing */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${certCol}15`, border: `1px solid ${certCol}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CertIconComp size={20} color={certCol} strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{cert}</div>
                  <div style={{ fontSize: 13, color: C.textLt, marginTop: 3 }}>{certBais.length} bài nghe</div>
                </div>
                <div style={{ flex: 1, height: 1, background: C.border, marginLeft: 8 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: 16 }}>
                {certBais.map(bai => {
                  const dl   = daLamMap[bai.id]
                  const pct  = dl ? Math.round((dl.diem / dl.tong) * 100) : null
                  const mins = Math.round(bai.thoi_gian_giay / 60)
                  return (
                    <button key={bai.id} className="task-card"
                      onClick={() => startBai(bai)}
                      style={{ padding: 26, background: C.white, borderRadius: 24, border: `1px solid ${C.border}`, textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 14px rgba(15,28,53,.06)', fontFamily: "'DM Sans', sans-serif", width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                        <div style={{ width: 54, height: 54, borderRadius: 16, flexShrink: 0, background: bai.video_url ? 'rgba(100,120,240,.1)' : `${certCol}10`, border: `1px solid ${bai.video_url ? 'rgba(100,120,240,.2)' : `${certCol}20`}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {bai.video_url ? <Youtube size={22} color={C.violet} strokeWidth={1.6} /> : <Headphones size={22} color={certCol} strokeWidth={1.6} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 7, marginBottom: 8, flexWrap: 'wrap' }}>
                            <CertBadge cert={bai.loai_chung_chi} />
                            <LevelBadge level={bai.cap_do} />
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, lineHeight: 1.35 }}>{bai.tieu_de}</div>
                        </div>
                      </div>
                      <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 16 }}>{bai.chu_de}</p>
                      <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.textLt }}>
                          <Clock size={12} strokeWidth={1.8} /> {mins} phút · <ListFilter size={12} /> {bai.BaiNgheCauHoi.length} câu
                        </span>
                        {/* Đã làm / Chưa làm — identical to Writing */}
                        {pct !== null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <SmallScoreRing pct={pct} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 80 ? '#0F6E56' : pct >= 60 ? '#7a5c00' : '#A32D2D', background: pct >= 80 ? '#E1F5EE' : pct >= 60 ? C.goldPale : '#FEF2F2', border: `1px solid ${pct >= 80 ? 'rgba(0,168,120,.25)' : pct >= 60 ? C.borderMd : 'rgba(240,100,100,.25)'}`, padding: '3px 10px', borderRadius: 50 }}>
                              Đã làm
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.textLt, background: `${C.navy}07`, border: `1px solid ${C.border}`, padding: '3px 10px', borderRadius: 50 }}>
                            Chưa làm
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}