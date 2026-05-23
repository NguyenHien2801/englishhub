'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  Headphones, Play, StopCircle, ChevronRight, ChevronLeft,
  RotateCcw, Search, SlidersHorizontal, Youtube, Mic,
  Clock, BookOpen, CheckCircle2, XCircle, Lightbulb,
  Trophy, ListFilter, Eye, EyeOff,
  CheckCheck, CircleDot, ArrowRight, PenLine, ToggleLeft,
  Home, GraduationCap, Briefcase, Globe2,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface DuLieuThem {
  dap_an_chap_nhan?: string[][]
  trich_dan_script?: string
  loai?: 'chon_nghia' | 'chon_tu' | 'dien_tu'
  tu_tieng_anh?: string
}
interface CauHoi {
  id: string
  so_thu_tu: number
  noi_dung: string
  cac_lua_chon: string[] | null
  dap_an_dung: string
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

// ── Design tokens — identical to Writing page ────────────────────────────────
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
  VSTEP: '#185FA5',
  TOEIC: '#00A878',
  APTIS: '#6478F0',
}
const CERT_ICON: Record<string, React.ElementType> = {
  VSTEP: GraduationCap,
  TOEIC: Briefcase,
  APTIS: Globe2,
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

// ── Helpers ──────────────────────────────────────────────────────────────────
function normalizeTF(s: string): string {
  return s.trim().toUpperCase().replace(/\s+/g, '_')
}
function checkDienChoTrong(userAnswer: string, correctAnswer: string, duLieuThem: DuLieuThem | null): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/['']/g, "'")
  const userNorm = normalize(userAnswer)
  if (userNorm === normalize(correctAnswer)) return true
  if (duLieuThem?.dap_an_chap_nhan) {
    const firstBlank = duLieuThem.dap_an_chap_nhan[0] ?? []
    if (firstBlank.some(v => normalize(v) === userNorm)) return true
  }
  return false
}
function displayCorrectAnswer(dap_an_dung: string): string {
  try {
    const parsed = JSON.parse(dap_an_dung)
    if (Array.isArray(parsed)) return parsed.join(' / ')
  } catch { /* not JSON */ }
  return dap_an_dung
}
function isAnswerCorrect(q: CauHoi, answer: string): boolean {
  if (!answer) return false
  switch (q.loai_cau_hoi) {
    case 'trac_nghiem':    return answer === q.dap_an_dung
    case 'true_false':     return normalizeTF(answer) === normalizeTF(q.dap_an_dung)
    case 'dien_cho_trong': return checkDienChoTrong(answer, q.dap_an_dung, q.du_lieu_them)
    case 'nghe_tu_vung': {
      const loai = q.du_lieu_them?.loai ?? 'chon_nghia'
      if (loai === 'dien_tu') return answer.trim().toLowerCase() === q.dap_an_dung.trim().toLowerCase()
      return answer === q.dap_an_dung
    }
    default: return answer === q.dap_an_dung
  }
}

// ── Shared atoms (Writing style) ─────────────────────────────────────────────
function Panel({ children, style, className }: {
  children: React.ReactNode; style?: React.CSSProperties; className?: string
}) {
  return (
    <div className={className} style={{
      background: C.white, borderRadius: 20,
      border: `1px solid ${C.border}`,
      padding: '24px 28px',
      boxShadow: '0 2px 12px rgba(15,28,53,.06)',
      ...style,
    }}>{children}</div>
  )
}

function SectionHeader({ icon: Icon, title, sub, color }: {
  icon: React.ElementType; title: string; sub?: string; color: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}15`, border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: "'DM Sans', sans-serif" }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: C.textMid, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function CertBadge({ cert }: { cert: string }) {
  const color = CERT_COLOR[cert] || C.slate
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 5, fontSize: 11, fontWeight: 700,
      background: `${color}12`, color, border: `1px solid ${color}28`,
      letterSpacing: '.04em', fontFamily: "'DM Sans', sans-serif",
    }}>{cert}</span>
  )
}

function LevelBadge({ level }: { level: string }) {
  const s = LEVEL_STYLE[level] || LEVEL_STYLE.B1
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 5, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '.04em', fontFamily: "'DM Sans', sans-serif",
    }}>{level}</span>
  )
}

function QuestionTypeBadge({ type }: { type: CauHoi['loai_cau_hoi'] }) {
  const meta: Record<string, { label: string; color: string; bg: string }> = {
    trac_nghiem:    { label: 'MCQ',     color: C.blue,   bg: '#EBF4FF' },
    dien_cho_trong: { label: 'Fill in', color: C.violet, bg: '#F0EFFE' },
    true_false:     { label: 'T/F/NG',  color: C.green,  bg: '#E1F5EE' },
    nghe_tu_vung:   { label: 'Vocab',   color: C.gold,   bg: C.goldPale },
  }
  const m = meta[type] ?? meta.trac_nghiem
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 800,
      letterSpacing: '.04em', color: m.color, background: m.bg,
      fontFamily: "'DM Sans', sans-serif",
    }}>{m.label}</span>
  )
}

function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = Math.round(score / max * 100)
  const r = 44, cx = 52, cy = 52, circ = 2 * Math.PI * r
  const bar = pct >= 80 ? C.green : pct >= 60 ? C.gold : C.rose
  const txt = pct >= 80 ? '#0F6E56' : pct >= 60 ? '#7a5c00' : '#A32D2D'
  return (
    <svg width={104} height={104} viewBox="0 0 104 104">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${C.navy}10`} strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={bar} strokeWidth={8}
        strokeDasharray={`${circ * score / max} ${circ * (1 - score / max)}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={bar} fontSize={22} fontWeight={700}>{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={C.textLt} fontSize={12}>/{max}</text>
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
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dashoffset .9s' }}
      />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fill={col} fontSize={9} fontWeight={900} fontFamily="'DM Sans',sans-serif"
      >{pct}%</text>
    </svg>
  )
}

function TaskSkeleton() {
  return (
    <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, padding: 24 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: '#F3F4F6' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, background: '#F3F4F6', borderRadius: 4, width: 80, marginBottom: 8 }} />
          <div style={{ height: 16, background: '#F3F4F6', borderRadius: 4, width: 160 }} />
        </div>
      </div>
      <div style={{ height: 12, background: '#F3F4F6', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 12, background: '#F3F4F6', borderRadius: 4, width: '60%' }} />
    </div>
  )
}

// ── Question input components ─────────────────────────────────────────────────
function TracNghiemQuestion({ q, answer, submitted, onAnswer }: {
  q: CauHoi; answer: string; submitted: boolean; onAnswer: (v: string) => void
}) {
  const opts = q.cac_lua_chon ?? []
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {opts.map(opt => {
        const key       = opt.charAt(0)
        const sel       = answer === key
        const isCorrect = submitted && key === q.dap_an_dung
        const isWrong   = submitted && sel && key !== q.dap_an_dung
        return (
          <button key={key}
            onClick={() => !submitted && onAnswer(key)}
            disabled={submitted}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              textAlign: 'left', padding: '11px 14px', borderRadius: 12,
              fontSize: 13.5, fontWeight: sel || isCorrect ? 600 : 400,
              fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
              border: isCorrect ? `2px solid ${C.green}`
                    : isWrong   ? `2px solid ${C.rose}`
                    : sel       ? `2px solid ${C.gold}`
                    : `1.5px solid ${C.border}`,
              background: isCorrect ? '#E1F5EE'
                        : isWrong   ? '#FEF2F2'
                        : sel       ? C.goldPale
                        : C.white,
              color: C.navy, cursor: submitted ? 'default' : 'pointer',
              transition: 'all .15s',
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

function DienChoTrongQuestion({ q, answer, submitted, onAnswer }: {
  q: CauHoi; answer: string; submitted: boolean; onAnswer: (v: string) => void
}) {
  const isCorrect = submitted && checkDienChoTrong(answer, q.dap_an_dung, q.du_lieu_them)
  const isWrong   = submitted && !isCorrect
  const parts     = q.noi_dung.split('___')
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, fontSize: 14.5, color: C.navy, lineHeight: 2.2, fontFamily: "'DM Sans', sans-serif" }}>
        {parts.map((part, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span>{part}</span>
            {i < parts.length - 1 && (
              <input
                value={answer}
                onChange={e => !submitted && onAnswer(e.target.value)}
                disabled={submitted}
                placeholder="..."
                style={{
                  width: Math.max(90, (answer.length || 6) * 9 + 28),
                  padding: '5px 12px', borderRadius: 8,
                  fontSize: 13.5, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  border: isCorrect ? `2px solid ${C.green}`
                        : isWrong   ? `2px solid ${C.rose}`
                        : `1.5px solid ${C.gold}`,
                  background: isCorrect ? '#E1F5EE'
                            : isWrong   ? '#FEF2F2'
                            : C.goldPale,
                  color: C.navy, textAlign: 'center', outline: 'none',
                  transition: 'all .15s', display: 'inline-block',
                }}
              />
            )}
          </span>
        ))}
      </div>
      {submitted && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: isCorrect ? C.green : C.rose, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
          {isCorrect
            ? <><CheckCircle2 size={14} /> Correct!</>
            : <><XCircle size={14} /> Correct answer: <b>{displayCorrectAnswer(q.dap_an_dung)}</b></>
          }
        </div>
      )}
    </div>
  )
}

function TrueFalseQuestion({ q, answer, submitted, onAnswer }: {
  q: CauHoi; answer: string; submitted: boolean; onAnswer: (v: string) => void
}) {
  const opts   = ['TRUE', 'FALSE', 'NOT_GIVEN']
  const labels: Record<string, string> = { TRUE: 'True', FALSE: 'False', NOT_GIVEN: 'Not Given' }
  const colors: Record<string, string> = { TRUE: C.green, FALSE: C.rose, NOT_GIVEN: C.gold }
  const normDB = normalizeTF(q.dap_an_dung)
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {opts.map(opt => {
        const sel       = normalizeTF(answer) === opt
        const isCorrect = submitted && opt === normDB
        const isWrong   = submitted && sel && opt !== normDB
        const col       = colors[opt]
        return (
          <button key={opt}
            onClick={() => !submitted && onAnswer(opt)}
            disabled={submitted}
            style={{
              flex: 1, minWidth: 90,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 16px', borderRadius: 12,
              fontSize: 13.5, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              border: isCorrect ? `2px solid ${col}`
                    : isWrong   ? `2px solid ${C.rose}`
                    : sel       ? `2px solid ${col}`
                    : `1.5px solid ${C.border}`,
              background: isCorrect ? `${col}18`
                        : isWrong   ? '#FEF2F2'
                        : sel       ? `${col}12`
                        : C.white,
              color: isCorrect || sel ? col : C.textMid,
              cursor: submitted ? 'default' : 'pointer', transition: 'all .15s',
            }}>
            {isCorrect && <CheckCircle2 size={14} color={col} />}
            {isWrong   && <XCircle      size={14} color={C.rose} />}
            {labels[opt]}
          </button>
        )
      })}
    </div>
  )
}

function NghetuVungQuestion({ q, answer, submitted, onAnswer }: {
  q: CauHoi; answer: string; submitted: boolean; onAnswer: (v: string) => void
}) {
  const loai = q.du_lieu_them?.loai ?? 'chon_nghia'
  if (loai === 'dien_tu') {
    const isCorrect = submitted && answer.trim().toLowerCase() === q.dap_an_dung.trim().toLowerCase()
    const isWrong   = submitted && !isCorrect
    return (
      <div>
        <input
          value={answer}
          onChange={e => !submitted && onAnswer(e.target.value)}
          disabled={submitted}
          placeholder="Type the missing word…"
          style={{
            width: '100%', padding: '11px 16px', borderRadius: 12,
            fontSize: 13.5, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            border: isCorrect ? `2px solid ${C.green}`
                  : isWrong   ? `2px solid ${C.rose}`
                  : `1.5px solid ${C.gold}`,
            background: isCorrect ? '#E1F5EE' : isWrong ? '#FEF2F2' : C.goldPale,
            color: C.navy, outline: 'none', transition: 'all .15s',
          }}
        />
        {submitted && (
          <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: isCorrect ? C.green : C.rose, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            {isCorrect ? <><CheckCircle2 size={14} /> Correct!</> : <><XCircle size={14} /> Answer: <b>{q.dap_an_dung}</b></>}
          </div>
        )}
      </div>
    )
  }
  return <TracNghiemQuestion q={q} answer={answer} submitted={submitted} onAnswer={onAnswer} />
}

// ── Question card (Writing Panel style) ──────────────────────────────────────
function QuestionCard({ q, index, answer, submitted, onAnswer }: {
  q: CauHoi; index: number; answer: string; submitted: boolean; onAnswer: (v: string) => void
}) {
  return (
    <Panel style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 1,
          background: C.goldPale, border: `1px solid ${C.borderMd}`,
          fontSize: 11, fontWeight: 900, color: C.gold,
          fontFamily: "'DM Sans', sans-serif",
        }}>{index + 1}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 8 }}>
            <QuestionTypeBadge type={q.loai_cau_hoi} />
          </div>
          {q.loai_cau_hoi !== 'dien_cho_trong' && (
            <p style={{ margin: 0, color: C.navy, fontSize: 14.5, fontWeight: 500, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
              {q.noi_dung}
            </p>
          )}
        </div>
      </div>

      {q.loai_cau_hoi === 'trac_nghiem'    && <TracNghiemQuestion q={q} answer={answer} submitted={submitted} onAnswer={onAnswer} />}
      {q.loai_cau_hoi === 'dien_cho_trong' && <DienChoTrongQuestion q={q} answer={answer} submitted={submitted} onAnswer={onAnswer} />}
      {q.loai_cau_hoi === 'true_false'     && <TrueFalseQuestion q={q} answer={answer} submitted={submitted} onAnswer={onAnswer} />}
      {q.loai_cau_hoi === 'nghe_tu_vung'   && <NghetuVungQuestion q={q} answer={answer} submitted={submitted} onAnswer={onAnswer} />}

      {submitted && q.giai_thich && (
        <div style={{
          marginTop: 14, padding: '12px 16px',
          background: C.goldPale, borderRadius: 10,
          border: `1px solid ${C.borderMd}`,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <Lightbulb size={14} color={C.gold} style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: C.text, lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif" }}>{q.giai_thich}</span>
        </div>
      )}

      {submitted && q.loai_cau_hoi === 'true_false' && q.du_lieu_them?.trich_dan_script && (
        <div style={{
          marginTop: 10, padding: '10px 14px',
          background: 'rgba(100,120,240,.05)', borderRadius: 10,
          border: `1px solid rgba(100,120,240,.16)`,
          fontSize: 13, color: C.textMid, fontStyle: 'italic', lineHeight: 1.72,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          📖 "{q.du_lieu_them.trich_dan_script}"
        </div>
      )}
    </Panel>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
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
        body: JSON.stringify({
          baiId: selected.id, tieu_de: selected.tieu_de,
          loai_chung_chi: selected.loai_chung_chi, cap_do: selected.cap_do,
          correct, total, thoiGianLamBai: thoiGian, cauTraLoi: answers,
        }),
      })
      setDaLamMap(p => ({ ...p, [selected.id]: { diem: correct, tong: total, ngay: new Date().toISOString() } }))
    } catch { /* silent */ }
  }

  function goHome() { stopAudio(); setSelected(null) }

  // ══════════════════════════════════════
  // PRACTICE VIEW
  // ══════════════════════════════════════
  if (selected) {
    const qs       = selected.BaiNgheCauHoi
    const total    = qs.length
    const correct  = submitted ? qs.filter(q => isAnswerCorrect(q, answers[q.id] ?? '')).length : 0
    const pct      = submitted ? Math.round((correct / total) * 100) : 0
    const answered = Object.keys(answers).length
    const certColor = CERT_COLOR[selected.loai_chung_chi] || C.slate

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 32, paddingBottom: 60, fontFamily: "'DM Sans', sans-serif" }}>
        <style suppressHydrationWarning>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          .fade-in { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) both; }
          @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
          @keyframes wave { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }
          input:focus { outline: none; }
        `}</style>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.textLt, marginBottom: 24 }}>
          <span onClick={goHome} style={{ cursor: 'pointer', color: C.gold, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Home size={13} strokeWidth={2} /> Luyện nghe
          </span>
          <ChevronRight size={14} color={C.textLt} strokeWidth={1.8} />
          <span style={{ color: C.navy, fontWeight: 600 }}>{selected.tieu_de}</span>
        </div>

        {/* Hero banner — identical structure to Writing */}
        <div style={{
          background: C.navy, borderRadius: 24, padding: '28px 32px',
          marginBottom: 28, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 160, height: 160,
            background: 'rgba(201,168,76,.07)', borderRadius: '60% 40% 30% 70%', pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <CertBadge cert={selected.loai_chung_chi} />
            <LevelBadge level={selected.cap_do} />
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900,
            color: '#fff', marginBottom: 8, lineHeight: 1.2,
          }}>{selected.tieu_de}</h2>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,.45)' }}>{selected.chu_de}</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,.35)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} strokeWidth={1.8} /> {Math.round(selected.thoi_gian_giay / 60)} phút
            </span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,.35)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <BookOpen size={13} strokeWidth={1.8} /> {total} câu hỏi
            </span>
          </div>
          {/* Progress pill — top right */}
          <div style={{
            position: 'absolute', top: 24, right: 32,
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 16px', borderRadius: 50, fontSize: 13, fontWeight: 700,
            background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)',
            color: answered >= total ? C.goldLt : 'rgba(255,255,255,.5)',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {answered >= total ? <CheckCheck size={13} /> : <CircleDot size={13} />}
            {answered}/{total}
          </div>
        </div>

        {/* 2-col layout identical to Writing */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Audio player panel */}
            <Panel style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                background: C.navy, borderRadius: '20px 20px 0 0',
                padding: '20px 24px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: -30, right: -30, width: 120, height: 120,
                  background: 'rgba(201,168,76,.06)', borderRadius: '60% 40% 30% 70%', pointerEvents: 'none',
                }} />
                {/* Player header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: playing ? 14 : 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: 'rgba(201,168,76,.14)', border: '1px solid rgba(201,168,76,.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected.video_url
                        ? <Youtube size={17} color={C.gold} strokeWidth={1.8} />
                        : <Mic     size={17} color={C.gold} strokeWidth={1.8} />
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
                        {selected.video_url ? 'YouTube Video' : 'Audio · Web TTS'}
                      </div>
                      {!selected.video_url && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
                          {playCount}/2 lần phát đã dùng
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Speed selector */}
                  {!selected.video_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginRight: 3, fontFamily: "'DM Sans', sans-serif" }}>Speed</span>
                      {[0.75, 1, 1.25].map(s => (
                        <button key={s} onClick={() => setSpeed(s)} style={{
                          padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700,
                          border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                          background: speed === s ? C.gold : 'rgba(255,255,255,.08)',
                          color: speed === s ? C.navy : 'rgba(255,255,255,.4)',
                          transition: 'all .16s',
                        }}>{s}x</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Waveform */}
                {playing && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, height: 28, marginBottom: 14 }}>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} style={{
                        width: 3, background: C.gold, borderRadius: 2, opacity: .7,
                        height: `${8 + (i % 6) * 4}px`,
                        animation: `wave ${.44 + i * .033}s ease-in-out infinite`,
                        animationDelay: `${i * .04}s`,
                      }} />
                    ))}
                  </div>
                )}

                {/* Controls */}
                {selected.video_url ? (
                  <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9' }}>
                    <iframe src={selected.video_url} style={{ width: '100%', height: '100%' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen />
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={playing ? stopAudio : playAudio} disabled={playCount >= 2} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                      padding: '12px 0', borderRadius: 50, fontSize: 14, fontWeight: 700, border: 'none',
                      cursor: playCount >= 2 ? 'not-allowed' : 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      background: playCount >= 2 ? 'rgba(255,255,255,.06)'
                                : playing ? C.rose : C.green,
                      color: playCount >= 2 ? 'rgba(255,255,255,.2)' : '#fff',
                      boxShadow: playCount >= 2 || playing ? 'none' : '0 4px 18px rgba(0,168,120,.32)',
                      transition: 'all .22s',
                    }}>
                      {playing
                        ? <><StopCircle size={15} /> Dừng</>
                        : playCount === 0
                          ? <><Play size={15} /> Phát Audio</>
                          : <><RotateCcw size={14} /> Phát lại (lần 2)</>}
                    </button>
                    <button onClick={() => setShowScript(v => !v)} style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '12px 18px', borderRadius: 50, fontSize: 13, fontWeight: 600,
                      border: `1px solid ${showScript ? 'rgba(201,168,76,.5)' : 'rgba(255,255,255,.15)'}`,
                      background: showScript ? 'rgba(201,168,76,.14)' : 'rgba(255,255,255,.06)',
                      color: showScript ? C.gold : 'rgba(255,255,255,.5)',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all .2s',
                    }}>
                      {showScript ? <EyeOff size={14} /> : <Eye size={14} />} Script
                    </button>
                  </div>
                )}
              </div>

              {/* Script panel */}
              {showScript && (
                <div style={{ padding: '20px 24px', borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    📖 Script
                  </div>
                  <div style={{
                    fontSize: 14, color: C.textMid, lineHeight: 1.9,
                    whiteSpace: 'pre-line', fontStyle: 'italic',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{selected.script}</div>
                </div>
              )}
            </Panel>

            {/* Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {qs.map((q, i) => (
                <QuestionCard
                  key={q.id} q={q} index={i}
                  answer={answers[q.id] ?? ''}
                  submitted={submitted}
                  onAnswer={val => setAnswers(p => ({ ...p, [q.id]: val }))}
                />
              ))}
            </div>

            {/* Submit / Result */}
            {!submitted ? (
              <button onClick={handleSubmit} disabled={answered < total} style={{
                width: '100%', padding: '14px 0',
                background: answered >= total ? C.gold : C.textLt,
                color: answered >= total ? C.navy : C.white,
                fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 50,
                cursor: answered < total ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: answered >= total ? '0 6px 20px rgba(201,168,76,.4)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all .22s',
              }}>
                <CheckCheck size={16} strokeWidth={2} />
                {answered >= total ? 'Nộp bài' : `Trả lời tất cả câu hỏi (${answered}/${total})`}
              </button>
            ) : (
              /* Result — matches Writing feedback hero */
              <div style={{
                background: C.navy, borderRadius: 24, padding: '32px 36px',
                display: 'flex', alignItems: 'center', gap: 32,
                position: 'relative', overflow: 'hidden', flexWrap: 'wrap',
              }}>
                <div style={{
                  position: 'absolute', top: -40, right: -40, width: 200, height: 200,
                  background: 'rgba(201,168,76,.07)', borderRadius: '60% 40% 30% 70%', pointerEvents: 'none',
                }} />
                <ScoreRing score={correct} max={total} />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(22px,2.5vw,30px)', fontWeight: 900,
                    color: '#fff', marginBottom: 6,
                  }}>
                    {pct >= 80 ? 'Xuất sắc!' : pct >= 60 ? 'Khá tốt!' : 'Cố gắng thêm nhé'}
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', fontFamily: "'DM Sans', sans-serif" }}>
                    {correct}/{total} câu đúng · {pct}%
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => { setAnswers({}); setSubmitted(false); setPlayCount(0); setStartTime(Date.now()) }} style={{
                    padding: '10px 22px', borderRadius: 50, background: 'rgba(255,255,255,.1)',
                    border: '1px solid rgba(255,255,255,.2)', color: '#fff',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}><RotateCcw size={14} /> Làm lại</button>
                  <button onClick={goHome} style={{
                    padding: '10px 22px', borderRadius: 50, background: C.gold,
                    border: 'none', color: C.navy,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <ChevronLeft size={14} strokeWidth={2} /> Bài khác
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar — mirrors Writing sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Progress tracker */}
            <Panel>
              <SectionHeader icon={CircleDot} title="Tiến độ" sub={`${answered}/${total} đã trả lời`} color={certColor} />
              <div style={{ height: 6, background: `${C.navy}08`, borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${Math.min(100, answered / total * 100)}%`,
                  background: answered >= total ? C.green : C.gold,
                  transition: 'width .4s cubic-bezier(.16,1,.3,1)',
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {qs.map((q, i) => {
                  const ans = answers[q.id]
                  const done = !!ans
                  const ok  = submitted && isAnswerCorrect(q, ans ?? '')
                  const bad = submitted && done && !ok
                  return (
                    <div key={q.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 10,
                      background: bad ? '#FEF2F2' : ok ? '#E1F5EE' : done ? C.goldPale : C.bg,
                      border: `1px solid ${bad ? 'rgba(240,100,100,.2)' : ok ? 'rgba(0,168,120,.2)' : done ? C.borderMd : C.border}`,
                    }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        background: bad ? C.rose : ok ? C.green : done ? C.gold : `${C.navy}10`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 900, color: done ? '#fff' : C.textLt,
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: bad ? '#A32D2D' : ok ? '#0F6E56' : done ? '#7a5c00' : C.textLt, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
                        {q.noi_dung.replace(/___/g, '___').substring(0, 36)}{q.noi_dung.length > 36 ? '…' : ''}
                      </span>
                      {bad && <XCircle size={13} color={C.rose} />}
                      {ok  && <CheckCircle2 size={13} color={C.green} />}
                    </div>
                  )
                })}
              </div>
            </Panel>

            {/* Result breakdown — only when submitted */}
            {submitted && (
              <>
                <Panel style={{ background: '#E1F5EE', border: '1px solid rgba(0,168,120,.2)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F6E56', marginBottom: 10 }}>✅ Đúng ({correct})</div>
                  {qs.filter(q => isAnswerCorrect(q, answers[q.id] ?? '')).map((q, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#1a4a3a', fontFamily: "'DM Sans', sans-serif" }}>
                      <CheckCircle2 size={13} color={C.green} style={{ flexShrink: 0, marginTop: 2 }} />
                      Câu {qs.indexOf(q) + 1}
                    </div>
                  ))}
                </Panel>
                <Panel style={{ background: '#FEF2F2', border: '1px solid rgba(240,100,100,.2)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#A32D2D', marginBottom: 10 }}>📈 Cần xem lại ({total - correct})</div>
                  {qs.filter(q => !isAnswerCorrect(q, answers[q.id] ?? '')).map((q, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#5a1a1a', fontFamily: "'DM Sans', sans-serif" }}>
                      <ArrowRight size={13} color={C.rose} style={{ flexShrink: 0, marginTop: 2 }} />
                      Câu {qs.indexOf(q) + 1}
                    </div>
                  ))}
                </Panel>
              </>
            )}

            {/* Tip card — mirrors Writing's Flame tip */}
            {!submitted && (
              <Panel style={{ background: C.goldPale }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Headphones size={18} color={C.gold} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#7a5c00', marginBottom: 4 }}>Lưu ý khi nghe</div>
                    <div style={{ fontSize: 13, color: '#7a5c00', lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif" }}>
                      Nghe toàn bộ audio trước khi trả lời. Bạn chỉ được phát tối đa 2 lần — hãy tập trung từ đầu.
                    </div>
                  </div>
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════
  // LIST VIEW — mirrors Writing list
  // ══════════════════════════════════════
  const grouped = baiList.reduce((acc, b) => {
    if (!acc[b.loai_chung_chi]) acc[b.loai_chung_chi] = []
    acc[b.loai_chung_chi].push(b)
    return acc
  }, {} as Record<string, BaiNghe[]>)

  const doneCount = Object.keys(daLamMap).length
  const highCount = Object.values(daLamMap).filter(v => Math.round(v.diem / v.tong * 100) >= 80).length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 32, fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .task-card { transition: all .28s cubic-bezier(.16,1,.3,1) !important; }
        .task-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(15,28,53,.1) !important; border-color: rgba(201,168,76,.35) !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%,100%{opacity:.35} 50%{opacity:.7} }
        .fade-in { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) both; }
        input:focus { outline: none; border-color: #C9A84C !important; box-shadow: 0 0 0 3px rgba(201,168,76,.12) !important; }
      `}</style>

      {/* Hero banner — matches Writing exactly */}
      <div style={{
        background: C.navy, borderRadius: 24, padding: '32px 36px',
        marginBottom: 32, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          background: 'rgba(201,168,76,.07)', borderRadius: '60% 40% 30% 70%', pointerEvents: 'none',
        }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 14px', background: 'rgba(201,168,76,.12)',
          border: '1px solid rgba(201,168,76,.25)', borderRadius: 50,
          fontSize: 11, fontWeight: 700, color: C.gold,
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16,
        }}>Luyện kỹ năng nghe</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(24px,4vw,38px)', fontWeight: 900,
          color: '#fff', marginBottom: 12, lineHeight: 1.2,
        }}>
          Listening <span style={{ color: C.gold }}>Practice</span>
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', maxWidth: 480, lineHeight: 1.7 }}>
          {baiList.length} bài nghe · Nghe · Hiểu · Trả lời · VSTEP · TOEIC · APTIS
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Tổng bài nghe', val: baiList.length, color: C.goldLt },
            { label: 'Đã hoàn thành', val: doneCount,      color: C.greenLt },
            { label: 'Điểm cao',      val: highCount,       color: C.violet },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(201,168,76,.18)',
              borderRadius: 14, padding: '10px 18px',
            }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search + filters */}
      <div className="fade-in" style={{ animationDelay: '40ms', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
            <Search size={14} color={C.textLt} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm bài nghe…"
              style={{
                width: '100%', padding: '10px 16px 10px 40px',
                borderRadius: 50, fontSize: 13,
                border: `1.5px solid ${search ? C.gold : C.border}`,
                background: C.white, color: C.text,
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 2px 8px rgba(15,28,53,.06)', transition: 'all .2s',
              }}
            />
          </div>
          <button onClick={() => setFiltersOpen(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 50, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${filtersOpen ? C.gold : C.border}`,
            background: filtersOpen ? C.goldPale : C.white,
            color: filtersOpen ? C.gold : C.textMid,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 2px 8px rgba(15,28,53,.06)', transition: 'all .2s',
          }}>
            <SlidersHorizontal size={14} strokeWidth={2.2} /> Lọc
            {hasFilters && <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold }} />}
          </button>
          {hasFilters && (
            <button onClick={clearAll} style={{
              padding: '10px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600,
              border: `1.5px solid ${C.border}`, background: 'transparent',
              color: C.textLt, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>Xóa bộ lọc</button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: C.textLt, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
            <b style={{ color: C.navy }}>{filtered.length}</b> kết quả
          </span>
        </div>

        {filtersOpen && (
          <div style={{
            background: C.white, borderRadius: 18, border: `1px solid ${C.border}`,
            padding: '18px 20px', boxShadow: '0 4px 16px rgba(15,28,53,.08)',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            {[
              { label: 'Chứng chỉ', opts: CERTS,     val: certF,   set: setCertF,   color: C.gold   },
              { label: 'Cấp độ',    opts: LEVELS,    val: levelF,  set: setLevelF,  color: C.green  },
              { label: 'Thời lượng',opts: DURATIONS, val: durF,    set: setDurF,    color: C.blue   },
              { label: 'Trạng thái',opts: STATUSES,  val: statusF, set: setStatusF, color: C.violet },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: C.textLt, textTransform: 'uppercase', letterSpacing: '0.9px', minWidth: 76, fontFamily: "'DM Sans', sans-serif" }}>
                  {row.label}
                </span>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {row.opts.map(o => (
                    <button key={o} onClick={() => row.set(o)} style={{
                      padding: '5px 16px', borderRadius: 50, fontSize: 12, fontWeight: 700,
                      border: `1.5px solid ${row.val === o ? row.color : C.border}`,
                      background: row.val === o ? `${row.color}14` : 'transparent',
                      color: row.val === o ? row.color : C.textLt,
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all .16s',
                    }}>{o}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks grouped by cert — identical structure to Writing */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => <TaskSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Headphones size={44} color={C.gold} strokeWidth={1.2} style={{ opacity: .28, marginBottom: 16 }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>
            Không tìm thấy bài nghe
          </div>
          <div style={{ fontSize: 13.5, color: C.textLt, marginBottom: 18, fontFamily: "'DM Sans', sans-serif" }}>
            Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
          </div>
          {hasFilters && (
            <button onClick={clearAll} style={{
              padding: '10px 24px', borderRadius: 50, fontSize: 13, fontWeight: 700,
              background: C.white, border: `1.5px solid ${C.border}`, color: C.textMid,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>Xóa bộ lọc</button>
          )}
        </div>
      ) : (
        // Group by cert — same as Writing groups tasks by chung_chi
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
            <div key={cert} className="fade-in" style={{ marginBottom: 32 }}>
              {/* Cert section header — identical to Writing */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${certCol}15`, border: `1px solid ${certCol}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CertIconComp size={18} color={certCol} strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: C.navy }}>{cert}</div>
                  <div style={{ fontSize: 13, color: C.textLt }}>{certBais.length} bài nghe</div>
                </div>
                <div style={{ flex: 1, height: 1, background: C.border, marginLeft: 8 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
                {certBais.map(bai => {
                  const dl  = daLamMap[bai.id]
                  const pct = dl ? Math.round((dl.diem / dl.tong) * 100) : null
                  const mins = Math.round(bai.thoi_gian_giay / 60)

                  return (
                    <button key={bai.id} className="task-card"
                      onClick={() => startBai(bai)}
                      style={{
                        padding: 22, background: C.white, borderRadius: 20,
                        border: `1px solid ${C.border}`, textAlign: 'left',
                        cursor: 'pointer', boxShadow: '0 2px 8px rgba(15,28,53,.05)',
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                        {/* Icon — audio vs video */}
                        <div style={{
                          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                          background: bai.video_url ? 'rgba(100,120,240,.1)' : `${certCol}10`,
                          border: `1px solid ${bai.video_url ? 'rgba(100,120,240,.2)' : `${certCol}20`}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                        }}>
                          {bai.video_url
                            ? <Youtube    size={20} color={C.violet} strokeWidth={1.6} />
                            : <Headphones size={20} color={certCol}  strokeWidth={1.6} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                            <CertBadge cert={bai.loai_chung_chi} />
                            <LevelBadge level={bai.cap_do} />
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, lineHeight: 1.3 }}>
                            {bai.tieu_de}
                          </div>
                        </div>
                      </div>

                      <p style={{
                        fontSize: 13, color: C.textMid, lineHeight: 1.6,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        marginBottom: 0,
                      }}>{bai.chu_de}</p>

                      <div style={{
                        marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textLt }}>
                          <Clock size={11} strokeWidth={1.8} /> {mins} phút
                          <span style={{ marginLeft: 8 }}>·</span>
                          <ListFilter size={11} style={{ marginLeft: 8 }} /> {bai.BaiNgheCauHoi.length} câu
                        </span>
                        {pct !== null ? (
                          <SmallScoreRing pct={pct} />
                        ) : (
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: C.textLt,
                            padding: '3px 10px', borderRadius: 50,
                            background: `${C.navy}07`, border: `1px solid ${C.border}`,
                          }}>Chưa làm</span>
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