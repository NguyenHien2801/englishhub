'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Headphones, Mic, BookOpen, PenLine, FileText,
  ChevronRight, Home, CheckCircle2, ArrowRight,
  Target, Trophy, Clock, BarChart3, GraduationCap,
  Play, Square, RotateCcw, Send, Flame, AlertCircle,
} from 'lucide-react'

// ─── Design tokens (đồng nhất với Writing page) ───────────────────────────────
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

// ─── Skill accent colors (thay cho SECTION_META accent) ───────────────────────
const SKILL_COLOR: Record<string, string> = {
  listening: '#2B6CB0',
  speaking:  '#6478F0',
  reading:   '#00A878',
  writing:   '#C9A84C',
  grammar:   '#F06464',
}

const SKILL_ICON: Record<string, React.ElementType> = {
  listening: Headphones,
  speaking:  Mic,
  reading:   BookOpen,
  writing:   PenLine,
  grammar:   FileText,
}

const SKILL_LABEL: Record<string, string> = {
  listening: 'Listening',
  speaking:  'Speaking',
  reading:   'Reading',
  writing:   'Writing',
  grammar:   'Language Use',
}

const SKILL_PART: Record<string, string> = {
  listening: 'Part 1 of 5',
  speaking:  'Part 2 of 5',
  reading:   'Part 3 of 5',
  writing:   'Part 4 of 5',
  grammar:   'Part 5 of 5',
}

const SKILL_INSTRUCTIONS: Record<string, string> = {
  listening: 'You will hear an audio passage. You may listen TWICE only. Answer all questions based on what you hear. Questions will appear after the first play.',
  speaking:  'Read the question carefully. You have 15 seconds to prepare, then record your spoken response. Speak clearly and for the full duration allocated.',
  reading:   'Read the passage carefully. Answer all questions based only on the information given in the text. Do not use outside knowledge.',
  writing:   'Write a well-structured response to the prompt. You will be assessed on task achievement, coherence, vocabulary range, and grammatical accuracy.',
  grammar:   'Choose the best option (A, B, C, or D) to complete each sentence. Questions are ordered from A1 to C1 difficulty level.',
}

const CEFR_COLOR: Record<string, string> = {
  A1: '#64748B', A2: '#0284C7', B1: '#059669',
  B2: '#D97706', C1: '#7C3AED', C2: '#DB2777',
}
const CEFR_TITLE: Record<string, string> = {
  A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate',
  B2: 'Upper-Intermediate', C1: 'Advanced', C2: 'Proficient',
}
const CEFR_DESC: Record<string, string> = {
  A1: 'Can understand and use basic familiar expressions and simple phrases.',
  A2: 'Can communicate in simple, routine tasks on familiar topics.',
  B1: 'Can deal with most situations likely to arise while travelling in English.',
  B2: 'Can interact with a degree of fluency and spontaneity with native speakers.',
  C1: 'Can express ideas fluently and spontaneously without much searching for words.',
  C2: 'Can understand virtually everything heard or read with ease.',
}

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const SKILL_STEPS = ['listening', 'speaking', 'reading', 'writing', 'grammar'] as const
type SkillStep = typeof SKILL_STEPS[number]

const SECTION_TIME: Record<SkillStep, number> = {
  listening: 600, speaking: 120, reading: 900, writing: 1200, grammar: 600,
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface MCQQuestion {
  id: string; question: string; options: string[]; correct: string
  difficulty: 'easy' | 'medium' | 'hard'; skill?: string; level?: string; explanation?: string
}
interface Exam {
  topic: string
  listening: { script: string; questions: MCQQuestion[] }
  speaking: { prompt: string; level_target: string; time_seconds: number; sample_answer: string }
  reading: { passage: string; questions: MCQQuestion[] }
  writing: { prompt: string; min_words: number; max_words: number; criteria: string[] }
  grammar_vocab: { questions: MCQQuestion[] }
}
interface SkillResult {
  level: string; correct?: number; total?: number; overall?: number
  feedback?: string; suggestions?: string[]
  task?: number; coherence?: number; vocabulary?: number; grammar?: number
  fluency?: number; content?: number
}
interface RoadmapPhase {
  tieu_de: string
  ky_nang_chinh: string
  hoat_dong: string[]
  muc_tieu: string
}
interface FinalResult {
  overall: string
  skills: { listening: SkillResult; reading: SkillResult; grammar: SkillResult; writing: SkillResult; speaking: SkillResult }
  aiResult: {
    trinh_do: string; nhan_xet: string; diem_manh: string[]; diem_yeu: string[]
    lo_trinh: {
      muc_tieu: string; thoi_gian: string
      phases?: RoadmapPhase[]
      // fallback legacy
      tuan_1_2?: string; tuan_3_4?: string; tuan_5_8?: string; tuan_9_12?: string
    }
  }
}

// ─── Global CSS (đồng nhất với Writing) ──────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes blobMorph {
    0%,100%{border-radius:60% 40% 30% 70% / 60% 30% 70% 40%}
    50%{border-radius:30% 60% 70% 40% / 50% 60% 30% 60%}
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  .fade-in { animation: fadeUp .45s cubic-bezier(.16,1,.3,1) both; }
  .mcq-opt { transition: all .22s cubic-bezier(.16,1,.3,1); }
  .mcq-opt:hover { transform: translateY(-2px); }
  .skill-tab { transition: all .25s cubic-bezier(.16,1,.3,1); }

  /* ── Responsive grids ── */
  .mcq-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media (max-width: 640px) {
    .mcq-grid { grid-template-columns: 1fr; }
    .speaking-criteria-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .writing-criteria-grid { grid-template-columns: 1fr !important; }
    .result-grid { grid-template-columns: 1fr !important; }
    .topbar-score { display: none !important; }
  }

  /* ── Reading passage scroll ── */
  .passage-box {
    max-height: 420px;
    overflow-y: auto;
  }
`

// ─── Shared atoms ─────────────────────────────────────────────────────────────
function Panel({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={className} style={{
      background: C.white, borderRadius: 24,
      border: `1px solid ${C.border}`,
      padding: '28px 32px',
      boxShadow: '0 2px 16px rgba(15,28,53,.07)',
      ...style,
    }}>{children}</div>
  )
}

function SectionHeader({ icon: Icon, title, sub, color }: {
  icon: React.ElementType; title: string; sub?: string; color: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `${color}15`, border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.3 }}>{title}</div>
        {sub && <div style={{ fontSize: 14, color: C.textMid, fontWeight: 500, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  )
}

function CEFRBadge({ level }: { level: string }) {
  const color = CEFR_COLOR[level] || C.slate
  return (
    <span style={{
      padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
      background: `${color}12`, color, border: `1px solid ${color}28`,
      letterSpacing: '.04em', fontFamily: "'DM Sans', sans-serif",
    }}>{level}</span>
  )
}

function ScoreRing({ score, max }: { score: number; max: number }) {
  const r = 44, cx = 52, cy = 52, circ = 2 * Math.PI * r
  const pct = score / max
  const barColor = pct >= 0.8 ? C.green : pct >= 0.6 ? C.gold : pct >= 0.4 ? C.blue : C.rose
  const scoreFontSize = score >= 100 ? 20 : 24
  return (
    <svg width={108} height={108} viewBox="0 0 104 104">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${C.navy}10`} strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={barColor} strokeWidth={8}
        strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={cx} y={cy - 7} textAnchor="middle" fill={barColor} fontSize={scoreFontSize} fontWeight={800}
        fontFamily="'Playfair Display', serif">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={C.textLt} fontSize={13}
        fontFamily="'DM Sans', sans-serif">/{max}</text>
    </svg>
  )
}

function SectionTimer({ seconds, onExpire, color }: { seconds: number; onExpire: () => void; color: string }) {
  const [remaining, setRemaining] = useState(seconds)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { setRemaining(seconds) }, [seconds])
  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(ref.current!); onExpire(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [seconds, onExpire])

  const pct = remaining / seconds
  const isLow = remaining < 60
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const r = 13, circ = 2 * Math.PI * r

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={32} height={32} viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={16} cy={16} r={r} fill="none" stroke={`${C.navy}12`} strokeWidth={2.5} />
        <circle cx={16} cy={16} r={r} fill="none"
          stroke={isLow ? C.rose : color} strokeWidth={2.5}
          strokeDasharray={`${circ * pct} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s linear' }} />
      </svg>
      <span style={{
        fontFamily: "'DM Sans', sans-serif", fontVariantNumeric: 'tabular-nums',
        fontSize: 14, fontWeight: 700,
        color: isLow ? C.rose : C.navy, letterSpacing: '0.05em',
      }}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  )
}

function MCQCard({ question, index, selected, onSelect, color }: {
  question: MCQQuestion; index: number; selected?: string; onSelect: (v: string) => void; color: string
}) {
  return (
    <Panel style={{ padding: '22px 26px' }}>
      <p style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 16, lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif" }}>
        <span style={{ fontWeight: 900, color: C.textLt, marginRight: 8, fontFamily: "'DM Sans', sans-serif" }}>
          {String(index + 1).padStart(2, '0')}.
        </span>
        {question.question}
      </p>
      <div className="mcq-grid">
        {question.options.map(opt => {
          const letter = opt.charAt(0)
          const isSel = selected === letter
          return (
            <button key={opt} className="mcq-opt"
              onClick={() => onSelect(letter)}
              style={{
                textAlign: 'left', padding: '12px 16px', borderRadius: 14,
                border: `2px solid ${isSel ? color : C.border}`,
                background: isSel ? `${color}0D` : C.white,
                color: isSel ? color : C.text,
                fontWeight: isSel ? 700 : 400, fontSize: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: "'DM Sans', sans-serif",
              }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${isSel ? color : '#D1D5DB'}`,
                background: isSel ? color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900, color: isSel ? '#fff' : C.textLt,
              }}>{letter}</span>
              {opt.slice(2)}
            </button>
          )
        })}
      </div>
    </Panel>
  )
}

// ─── RoadmapCard — expandable, giống CriterionCard của Writing ───────────────
function RoadmapCard({ phase, index }: {
  phase: { label: string; week: string; color: string; title: string; ky_nang: string; hoat_dong: string[]; muc_tieu: string }
  index: number
}) {
  const [open, setOpen] = useState(index === 0) // Phase 1 mở sẵn
  const { color, label, week, title, ky_nang, hoat_dong, muc_tieu } = phase
  const hasDetail = hoat_dong.length > 0 || !!muc_tieu

  return (
    <div style={{
      border: `1.5px solid ${open ? color + '50' : C.border}`,
      borderRadius: 18, overflow: 'hidden', background: C.white,
      transition: 'border-color .2s, box-shadow .2s',
      boxShadow: open ? `0 4px 20px rgba(15,28,53,.08)` : 'none',
    }}>
      <button
        onClick={() => hasDetail && setOpen(o => !o)}
        style={{
          width: '100%', padding: '18px 22px',
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'transparent', border: 'none',
          cursor: hasDetail ? 'pointer' : 'default',
          textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Phase number box — giống score box của CriterionCard */}
        <div style={{
  flexShrink: 0, width: 80, height: 64, borderRadius: 14,
  background: `${color}12`, border: `1px solid ${color}28`,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  padding: '0 10px',
}}>
  <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
  <span style={{ fontSize: 12, color: C.textMid, marginTop: 3, fontWeight: 500, whiteSpace: 'nowrap' }}>{week}</span>
</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Skill badge + title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: ky_nang ? 6 : 0 }}>
            <span style={{
              fontSize: 15, fontWeight: 700, color: C.navy,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', lineHeight: 1.35,
            }}>
              {title}
            </span>
            {ky_nang && (
              <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: `${color}12`, color, border: `1px solid ${color}22`, whiteSpace: 'nowrap' }}>
                {ky_nang}
              </span>
            )}
          </div>
          {/* Progress bar — decorative, 100% per phase */}
          <div style={{ height: 4, background: `${C.navy}08`, borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
            <div style={{ height: '100%', width: `${(index + 1) * 25}%`, background: color, borderRadius: 2, transition: 'width .6s cubic-bezier(.16,1,.3,1)' }} />
          </div>
        </div>

        {hasDetail && (
          <span style={{ color: C.textLt, fontSize: 13, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
        )}
      </button>

      {/* Expanded detail */}
      {open && hasDetail && (
        <div style={{ padding: '0 22px 22px', borderTop: `1px solid ${C.border}` }}>
          {/* Activities list */}
          {hoat_dong.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.textMid, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
                Hoạt động cụ thể
              </div>
              {hoat_dong.map((act, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 15, color: C.text, lineHeight: 1.7 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  {act}
                </div>
              ))}
            </div>
          )}

          {/* Mục tiêu đo lường */}
          {muc_tieu && (
            <div style={{ marginTop: 14, padding: '12px 16px', background: `${color}08`, borderLeft: `3px solid ${color}`, borderRadius: '0 12px 12px 0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>🎯 Mục tiêu cuối phase</div>
              <div style={{ fontSize: 15, color: C.text, lineHeight: 1.7, fontWeight: 500 }}>{muc_tieu}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LevelTestPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'intro' | 'loading' | 'test' | 'submitting' | 'result'>('intro')
  const [currentSkill, setCurrentSkill] = useState<SkillStep>('listening')
  const [exam, setExam] = useState<Exam | null>(null)
  const [error, setError] = useState('')
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({})
  const [writingText, setWritingText] = useState('')
  const [speakingTranscript, setSpeakingTranscript] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingDone, setRecordingDone] = useState(false)
  const [prepTime, setPrepTime] = useState(15)
  const [prepStarted, setPrepStarted] = useState(false)
  const [prepDone, setPrepDone] = useState(false)
  const [sectionTimeUp, setSectionTimeUp] = useState(false)
  const [result, setResult] = useState<FinalResult | null>(null)
  const recognitionRef = useRef<any>(null)
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const wordCount = writingText.trim() === '' ? 0 : writingText.trim().split(/\s+/).length

  useEffect(() => () => {
    window.speechSynthesis?.cancel()
    if (recTimerRef.current) clearInterval(recTimerRef.current)
    if (prepTimerRef.current) clearInterval(prepTimerRef.current)
    recognitionRef.current?.stop()
  }, [])

  async function startTest() {
    setPhase('loading'); setError('')
    try {
      const res = await fetch('/api/level-test/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExam(data.exam); setCurrentSkill('listening')
      setMcqAnswers({}); setWritingText(''); setSpeakingTranscript('')
      setHasPlayed(false); setPlayCount(0); setIsPlaying(false)
      setRecordingDone(false); setPrepDone(false); setPrepStarted(false)
      setPrepTime(15); setSectionTimeUp(false); setPhase('test')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate test. Please try again.')
      setPhase('intro')
    }
  }

  function playScript() {
    if (!exam || playCount >= 2) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(exam.listening.script)
    utter.lang = 'en-US'; utter.rate = 0.88
    utter.onstart = () => setIsPlaying(true)
    utter.onend = () => { setIsPlaying(false); setHasPlayed(true); setPlayCount(p => p + 1) }
    window.speechSynthesis.speak(utter)
  }
  function stopScript() {
    window.speechSynthesis.cancel(); setIsPlaying(false); setHasPlayed(true); setPlayCount(p => p + 1)
  }
  function startPrepTimer() {
    if (prepStarted) return; setPrepStarted(true)
    prepTimerRef.current = setInterval(() => {
      setPrepTime(t => { if (t <= 1) { clearInterval(prepTimerRef.current!); setPrepDone(true); return 0 } return t - 1 })
    }, 1000)
  }
  function skipPrep() { if (prepTimerRef.current) clearInterval(prepTimerRef.current); setPrepDone(true) }

  function startRecording() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError('Speech recognition not supported. Please use Chrome.'); return }
    const rec: any = new SR(); rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true
    let final = ''
    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      setSpeakingTranscript(final + interim)
    }
    rec.onend = () => { setIsRecording(false); setRecordingDone(true); if (recTimerRef.current) clearInterval(recTimerRef.current) }
    recognitionRef.current = rec; rec.start(); setIsRecording(true); setRecordingTime(0)
    recTimerRef.current = setInterval(() => {
      setRecordingTime(t => { if (t >= (exam?.speaking.time_seconds ?? 90) - 1) { stopRecording(); return t } return t + 1 })
    }, 1000)
  }
  function stopRecording() {
    recognitionRef.current?.stop(); if (recTimerRef.current) clearInterval(recTimerRef.current)
    setIsRecording(false); setRecordingDone(true)
  }

  const handleSectionExpire = useCallback(() => setSectionTimeUp(true), [])

  function goToSkill(skill: SkillStep) {
    setSectionTimeUp(false); setPrepDone(false); setPrepStarted(false); setPrepTime(15); setCurrentSkill(skill)
  }
  function nextSkill() { const i = SKILL_STEPS.indexOf(currentSkill); if (i < SKILL_STEPS.length - 1) goToSkill(SKILL_STEPS[i + 1]) }
  function prevSkill() { const i = SKILL_STEPS.indexOf(currentSkill); if (i > 0) goToSkill(SKILL_STEPS[i - 1]) }

  function canProceed(): boolean {
    if (!exam) return false; if (sectionTimeUp) return true
    switch (currentSkill) {
      case 'listening': return hasPlayed && exam.listening.questions.every(q => mcqAnswers[q.id])
      case 'speaking':  return recordingDone && speakingTranscript.trim().length > 5
      case 'reading':   return exam.reading.questions.every(q => mcqAnswers[q.id])
      case 'writing':   return wordCount >= (exam.writing?.min_words ?? 80)
      case 'grammar':   return exam.grammar_vocab.questions.every(q => mcqAnswers[q.id])
      default:          return false
    }
  }

  async function handleSubmit() {
    setPhase('submitting')
    try {
      const res = await fetch('/api/level-test/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam, answers: mcqAnswers, writingText, speakingTranscript, topic: exam?.topic }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data); setPhase('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Please try again.')
      setPhase('test'); setCurrentSkill('grammar')
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTRO
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'intro') return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingTop: 36, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning>{GLOBAL_CSS}</style>

      {/* Hero */}
      <div style={{
        background: C.navy, borderRadius: 28,
        padding: 'clamp(32px,4vw,52px) clamp(28px,4vw,52px)',
        marginBottom: 40, position: 'relative', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(15,28,53,.25)',
      }}>
        <div style={{ position: 'absolute', top: -70, right: -70, width: 320, height: 320, background: 'rgba(201,168,76,.07)', borderRadius: '60% 40% 30% 70%', animation: 'blobMorph 10s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(24px)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, background: 'rgba(100,120,240,.06)', borderRadius: '40% 60%', pointerEvents: 'none', filter: 'blur(28px)' }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.28)', borderRadius: 50, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 20 }}>
          <GraduationCap size={11} strokeWidth={2.5} /> Official Assessment Format
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,4.5vw,52px)', fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
          English <em style={{ fontStyle: 'italic', color: C.gold }}>Level Test</em>
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,.52)', maxWidth: 520, lineHeight: 1.78, marginBottom: 32 }}>
          A comprehensive 5-section assessment aligned with CEFR, VSTEP and APTIS frameworks. Receive an AI-generated score report with personalised study roadmap.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'Duration',   val: '~40 min', icon: <Clock size={18} strokeWidth={1.8} color={C.goldLt} /> },
            { label: 'Sections',   val: '5 Parts', icon: <BarChart3 size={18} strokeWidth={1.8} color={C.greenLt} /> },
            { label: 'Questions',  val: '22 items', icon: <Target size={18} strokeWidth={1.8} color={C.violet} /> },
            { label: 'Scale',      val: 'A1 – C2', icon: <Trophy size={18} strokeWidth={1.8} color={C.goldLt} /> },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 18, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12, backdropFilter: 'blur(8px)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test structure */}
      <Panel style={{ marginBottom: 24 }}>
        <SectionHeader icon={BarChart3} title="Test Structure" sub="5 sections · 100 points total" color={C.gold} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SKILL_STEPS.map((s, i) => {
            const Icon = SKILL_ICON[s]; const color = SKILL_COLOR[s]
            const mins = Math.floor(SECTION_TIME[s] / 60)
            const qCount = s === 'grammar' ? 10 : s === 'listening' || s === 'reading' ? 5 : 1
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: C.bg, borderRadius: 14, border: `1px solid ${C.border}` }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={color} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{SKILL_LABEL[s]}</span>
                 <span style={{ fontSize: 14, color: C.textMid, marginLeft: 8, fontWeight: 500 }}>{qCount} {qCount === 1 ? 'task' : 'questions'}</span>
                </div>
               <span style={{ fontSize: 14, color: C.textMid, fontWeight: 500 }}>{mins} min</span>
                <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'Playfair Display', serif" }}>25 pts</span>
              </div>
            )
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: `${C.navy}06`, borderRadius: 14, border: `1px solid ${C.border}`, marginTop: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: '.06em' }}>Total</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: C.navy }}>100 pts</span>
          </div>
        </div>
      </Panel>

      {/* CEFR scale */}
      <Panel style={{ marginBottom: 24 }}>
        <SectionHeader icon={Trophy} title="CEFR Score Scale" color={C.gold} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
          {LEVEL_ORDER.map(l => {
            const color = CEFR_COLOR[l]
            return (
              <div key={l} style={{ padding: '12px 8px', borderRadius: 14, border: `1px solid ${color}25`, background: `${color}08`, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color }}>{l}</div>
               <div style={{ fontSize: 12, color: C.textMid, marginTop: 4, lineHeight: 1.3, fontWeight: 500 }}>{CEFR_TITLE[l]}</div>
              </div>
            )
          })}
        </div>
      </Panel>

      {/* Before you begin */}
      <div style={{ padding: '22px 28px', background: C.goldPale, border: `1px solid ${C.borderMd}`, borderRadius: 20, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Flame size={18} color={C.gold} strokeWidth={2} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#7a5c00' }}>Before You Begin</span>
        </div>
        {[
          'Ensure you are in a quiet environment with a working microphone and speakers.',
          'Do not refresh or close the browser during the test — progress cannot be recovered.',
          'Each section has a time limit. When time expires, you must proceed to the next section.',
          'Scores are generated by AI and reflect CEFR proficiency standards.',
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14, color: '#7a5c00', lineHeight: 1.65 }}>
            <span style={{ fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>{t}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: '14px 20px', background: '#FEF2F2', border: '1px solid rgba(240,100,100,.3)', borderRadius: 14, color: '#A32D2D', fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} strokeWidth={2} /> {error}
        </div>
      )}

      <button
        onClick={startTest}
        style={{
          width: '100%', padding: '18px 0',
          background: C.gold, color: C.navy,
          fontWeight: 700, fontSize: 17, border: 'none', borderRadius: 50,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 8px 28px rgba(201,168,76,.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'all .32s cubic-bezier(.34,1.56,.64,1)',
        }}
        onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)')}
        onMouseOut={e => (e.currentTarget.style.transform = '')}
      >
        <Send size={17} strokeWidth={2.2} /> Begin Test
      </button>
      <p style={{ textAlign: 'center', fontSize: 13, color: C.textMid, marginTop: 12, fontWeight: 500 }}>
        By starting, you agree to complete the test honestly without external assistance.
      </p>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING / SUBMITTING
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'loading' || phase === 'submitting') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.navy, fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning>{GLOBAL_CSS}</style>
      <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 32 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', border: `2px solid rgba(255,255,255,.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, animation: 'pulse 2s ease-in-out infinite' }}>
          {phase === 'loading' ? '🤖' : '📊'}
        </div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid transparent`, borderTop: `2px solid ${C.gold}`, animation: 'spin 1s linear infinite' }} />
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 10, textAlign: 'center' }}>
        {phase === 'loading' ? 'Generating Your Test Paper...' : 'Analysing Your Responses...'}
      </h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', textAlign: 'center', maxWidth: 360, lineHeight: 1.7 }}>
        {phase === 'loading'
          ? 'AI is creating a unique 5-section test aligned with CEFR standards.'
          : 'AI is scoring all 5 sections and generating your personalised feedback report.'}
      </p>
      <div style={{ display: 'flex', gap: 6, marginTop: 28 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ width: 8, height: 8, background: C.gold, borderRadius: '50%', animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />
        ))}
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // TEST
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'test' && exam) {
    const skillIdx = SKILL_STEPS.indexOf(currentSkill)
    const isLast = currentSkill === 'grammar'
    const color = SKILL_COLOR[currentSkill]
    const Icon = SKILL_ICON[currentSkill]

    const answeredCount =
      currentSkill === 'listening' ? exam.listening.questions.filter(q => mcqAnswers[q.id]).length :
      currentSkill === 'reading'   ? exam.reading.questions.filter(q => mcqAnswers[q.id]).length :
      currentSkill === 'grammar'   ? exam.grammar_vocab.questions.filter(q => mcqAnswers[q.id]).length :
      1

    const totalQs =
      currentSkill === 'grammar' ? 10 :
      currentSkill === 'listening' || currentSkill === 'reading' ? 5 : 1

    const writingMin = exam.writing?.min_words ?? 80
    const wordStatus = wordCount < writingMin ? 'low' : 'ok'

    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
        <style suppressHydrationWarning>{GLOBAL_CSS}</style>

        {/* Top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(248,245,238,.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, boxShadow: '0 2px 16px rgba(15,28,53,.06)' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{SKILL_LABEL[currentSkill]}</div>
                <div style={{ fontSize: 13, color: '#4A5568', fontWeight: 600 }}>{SKILL_PART[currentSkill]} · {exam.topic}</div>
              </div>
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {SKILL_STEPS.map((s, i) => (
                <div key={s} style={{
                  height: 6, borderRadius: 3, transition: 'all .3s',
                  width: i === skillIdx ? 28 : 14,
                  background: i < skillIdx ? C.green : i === skillIdx ? color : `${C.navy}15`,
                }} />
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="topbar-score" style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: C.textLt }}>Section Score</div>
                <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "'Playfair Display', serif" }}>25 pts</div>
              </div>
              <SectionTimer key={currentSkill} seconds={SECTION_TIME[currentSkill]} onExpire={handleSectionExpire} color={color} />
            </div>
          </div>

          {/* Progress bar for MCQ */}
          {['listening', 'reading', 'grammar'].includes(currentSkill) && (
            <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 4, background: `${C.navy}08`, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, background: color, width: `${(answeredCount / totalQs) * 100}%`, transition: 'width .4s' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.textLt, fontVariantNumeric: 'tabular-nums' }}>{answeredCount}/{totalQs}</span>
            </div>
          )}
        </div>

        {/* Time up banner */}
        {sectionTimeUp && (
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: C.goldPale, border: `1px solid ${C.borderMd}`, borderRadius: 14, fontSize: 14, color: '#7a5c00' }}>
              <Clock size={16} color={C.gold} strokeWidth={2} />
              <strong>Time's up for this section.</strong>&nbsp; Unanswered questions score 0. You may now proceed.
            </div>
          </div>
        )}

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px 120px' }}>

          {/* Instructions */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', background: `${color}07`, border: `1px solid ${color}20`, borderRadius: 16, marginBottom: 24 }}>
            <Icon size={20} color={color} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Instructions — {SKILL_LABEL[currentSkill]} ({SKILL_PART[currentSkill]})
              </div>
              <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7, margin: 0 }}>{SKILL_INSTRUCTIONS[currentSkill]}</p>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 18px', background: '#FEF2F2', border: '1px solid rgba(240,100,100,.3)', borderRadius: 12, color: '#A32D2D', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={15} strokeWidth={2} /> {error}
            </div>
          )}

          {/* ── LISTENING ── */}
          {currentSkill === 'listening' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Panel>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <SectionHeader icon={Headphones} title="Audio Passage" color={color} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {[1, 2].map(n => (
                      <div key={n} style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${playCount >= n ? color : C.border}`, background: playCount >= n ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: playCount >= n ? '#fff' : C.textLt }}>{n}</div>
                    ))}
                    <span style={{ fontSize: 12, color: C.textLt }}> / 2 plays</span>
                  </div>
                </div>

                {/* Waveform */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 52, padding: '0 4px', background: C.bg, borderRadius: 12, marginBottom: 16 }}>
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} style={{
                      flex: 1, borderRadius: 2,
                      background: isPlaying ? color : hasPlayed ? `${color}50` : `${C.navy}12`,
                      height: isPlaying ? `${14 + Math.abs(Math.sin(i * 0.4)) * 24}px` : hasPlayed ? `${8 + Math.abs(Math.sin(i * 0.4)) * 14}px` : '4px',
                      transition: 'height .1s',
                      animation: isPlaying ? `bounce ${0.25 + (i % 7) * 0.06}s ease-in-out infinite alternate` : 'none',
                    }} />
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={isPlaying ? stopScript : playScript}
                    disabled={playCount >= 2}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
                      borderRadius: 50, fontWeight: 700, fontSize: 14, border: 'none', cursor: playCount >= 2 ? 'not-allowed' : 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      background: playCount >= 2 ? `${C.navy}08` : isPlaying ? '#FEF2F2' : color,
                      color: playCount >= 2 ? C.textLt : isPlaying ? C.rose : '#fff',
                      opacity: playCount >= 2 ? 0.5 : 1,
                      boxShadow: playCount >= 2 || isPlaying ? 'none' : `0 6px 18px ${color}40`,
                    }}>
                    {isPlaying ? <><Square size={14} strokeWidth={2.5} /> Stop</> : <><Play size={14} strokeWidth={2.5} fill="currentColor" /> {playCount === 0 ? 'Play Audio' : 'Play Again (final)'}</>}
                  </button>
                  {playCount >= 2 && <span style={{ fontSize: 14, color: C.textMid, fontWeight: 500 }}>Maximum plays reached</span>}
                </div>
              </Panel>

              {hasPlayed ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 1, background: C.border }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'center' }}>
                      Comprehension Questions · {exam.listening.questions.length} items · 25 pts
                    </span>
                    <div style={{ flex: 1, height: 1, background: C.border }} />
                  </div>
                  {exam.listening.questions.map((q, i) => (
                    <MCQCard key={q.id} question={q} index={i} selected={mcqAnswers[q.id]}
                      onSelect={v => setMcqAnswers(p => ({ ...p, [q.id]: v }))} color={color} />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: C.textLt }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>🔊</div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: C.navy, margin: 0 }}>Play the audio to reveal the questions.</p>
                  <p style={{ fontSize: 14, color: C.textMid, fontWeight: 500, marginTop: 6 }}>Questions will appear after the recording ends.</p>
                </div>
              )}
            </div>
          )}

          {/* ── SPEAKING ── */}
          {currentSkill === 'speaking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Panel>
                <SectionHeader icon={Mic} title="Speaking Task" sub={`Target: ${exam.speaking.level_target} · ${exam.speaking.time_seconds}s · 25 pts`} color={color} />
                <div style={{ padding: '18px 20px', background: `${color}07`, border: `1px solid ${color}20`, borderRadius: 14, fontSize: 15, fontWeight: 600, color: C.navy, lineHeight: 1.7, marginBottom: 18 }}>
                  {exam.speaking.prompt}
                </div>
                <div className="speaking-criteria-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  {['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Task Response'].map(c => (
                    <div key={c} style={{ padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, lineHeight: 1.3 }}>{c}</div>
                      <div style={{ fontSize: 13, color: C.textMid, fontWeight: 500, marginTop: 4 }}>25%</div>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Prep */}
              {!prepDone && !isRecording && !recordingDone && (
                <Panel style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Preparation Time</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 64, fontWeight: 900, color: prepTime <= 5 ? C.rose : color, marginBottom: 8, lineHeight: 1 }}>{prepTime}s</div>
                  <p style={{ fontSize: 15, color: C.text, fontWeight: 500, marginBottom: 24 }}>Use this time to organise your thoughts and key points.</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={skipPrep} style={{ padding: '11px 26px', background: color, color: '#fff', border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: `0 6px 18px ${color}40` }}>
                      Skip — Record Now
                    </button>
                    {!prepStarted && (
                      <button onClick={startPrepTimer} style={{ padding: '11px 26px', background: C.bg, border: `2px solid ${C.border}`, color: C.textMid, borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        <Play size={13} strokeWidth={2.5} style={{ display: 'inline', marginRight: 6 }} />Start Countdown
                      </button>
                    )}
                  </div>
                </Panel>
              )}

              {/* Recording */}
              {(prepDone || isRecording || recordingDone) && (
                <Panel>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
                    <SectionHeader icon={Mic} title="Your Response" color={color} />
                    {isRecording && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#FEF2F2', border: '1px solid rgba(240,100,100,.3)', borderRadius: 50 }}>
                        <div style={{ width: 8, height: 8, background: C.rose, borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontVariantNumeric: 'tabular-nums', fontSize: 14, fontWeight: 700, color: C.rose }}>
                          {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}
                          <span style={{ color: C.textMid, fontWeight: 500, fontSize: 14 }}>/{String(Math.floor(exam.speaking.time_seconds / 60)).padStart(2, '0')}:{String(exam.speaking.time_seconds % 60).padStart(2, '0')}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {isRecording && (
                    <div style={{ height: 4, background: `${C.navy}08`, borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ height: '100%', background: C.rose, borderRadius: 2, width: `${(recordingTime / exam.speaking.time_seconds) * 100}%`, transition: 'width 1s linear' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    {!isRecording && !recordingDone && (
                      <button onClick={startRecording} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: C.rose, color: '#fff', border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: `0 6px 18px ${C.rose}40` }}>
                        <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%' }} /> Start Recording
                      </button>
                    )}
                    {isRecording && (
                      <button onClick={stopRecording} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: C.navy, color: '#fff', border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        <Square size={13} strokeWidth={2.5} fill="currentColor" /> Stop Recording
                      </button>
                    )}
                    {recordingDone && (
                      <button onClick={() => { setSpeakingTranscript(''); setRecordingDone(false); setRecordingTime(0) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: C.bg, border: `2px solid ${C.border}`, color: C.textMid, borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        <RotateCcw size={13} strokeWidth={2.5} /> Re-record
                      </button>
                    )}
                  </div>

                  {speakingTranscript && (
                    <div style={{ padding: '16px 18px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '.06em' }}>Live Transcript</span>
                        <span style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>~{speakingTranscript.trim().split(/\s+/).length} words</span>
                      </div>
                      <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, margin: 0 }}>{speakingTranscript}</p>
                    </div>
                  )}

                  {recordingDone && !speakingTranscript && (
                    <div style={{ padding: '12px 16px', background: C.goldPale, border: `1px solid ${C.borderMd}`, borderRadius: 12, fontSize: 14, color: '#7a5c00', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={15} strokeWidth={2} /> No speech detected. Please check your microphone and try again.
                    </div>
                  )}
                  {recordingDone && speakingTranscript && (
                    <div style={{ marginTop: 12, padding: '12px 16px', background: '#E1F5EE', border: '1px solid rgba(0,168,120,.22)', borderRadius: 12, fontSize: 14, color: '#0F6E56', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={15} strokeWidth={2} /> Response recorded successfully. You may re-record if you wish.
                    </div>
                  )}
                </Panel>
              )}
            </div>
          )}

          {/* ── READING ── */}
          {currentSkill === 'reading' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Panel>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <SectionHeader icon={BookOpen} title="Reading Passage" color={color} />
                  <span style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>~{exam.reading.passage.split(/\s+/).length} words</span>
                </div>
                <div className="passage-box" style={{ padding: '18px 20px', background: C.bg, borderRadius: 14, border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 16, color: C.text, lineHeight: 1.95, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{exam.reading.passage}</p>
                </div>
              </Panel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
               <span style={{ fontSize: 13, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'center' }}>
                Comprehension Questions · {exam.reading.questions.length} items · 25 pts
               </span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>
              {exam.reading.questions.map((q, i) => (
                <MCQCard key={q.id} question={q} index={i} selected={mcqAnswers[q.id]}
                  onSelect={v => setMcqAnswers(p => ({ ...p, [q.id]: v }))} color={color} />
              ))}
            </div>
          )}

          {/* ── WRITING ── */}
          {currentSkill === 'writing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Panel>
                <SectionHeader icon={PenLine} title="Writing Task" sub={`${exam.writing.min_words}–${exam.writing.max_words} words · 25 pts`} color={color} />
                <div style={{ padding: '16px 20px', background: C.goldPale, border: `1px solid ${C.borderMd}`, borderRadius: 14, fontSize: 15, fontWeight: 600, color: '#5a4000', lineHeight: 1.75, marginBottom: 18 }}>
                  {exam.writing.prompt}
                </div>
                <div className="writing-criteria-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {exam.writing.criteria.map((c, i) => (
                    <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color, flexShrink: 0 }}>{i + 1}</div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              <div style={{ background: C.white, borderRadius: 24, border: `2px solid ${wordStatus === 'ok' ? C.green : C.border}`, overflow: 'hidden', boxShadow: '0 2px 16px rgba(15,28,53,.07)', transition: 'border-color .3s' }}>
                <div style={{ padding: '12px 20px', background: C.bg, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '.06em' }}>Your Response</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 15, fontWeight: 700, color: wordStatus === 'ok' ? C.green : C.textMid }}>{wordCount} words</span>
                </div>
                <textarea
                  value={writingText} onChange={e => setWritingText(e.target.value)}
                  placeholder="Begin writing your response here. Use paragraphs and clear structure..."
                  rows={13}
                  aria-label="Writing response"
                  style={{ width: '100%', padding: '22px 24px', fontSize: 16, color: C.text, lineHeight: 1.85, background: 'transparent', border: 'none', resize: 'vertical', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
                />
                <div style={{ padding: '12px 20px', background: C.bg, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 6, background: `${C.navy}08`, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${Math.min((wordCount / writingMin) * 100, 100)}%`, background: wordStatus === 'ok' ? C.green : C.gold, transition: 'width .3s' }} />
                  </div>
                  {wordStatus === 'ok'
                   ? <span style={{ fontSize: 14, fontWeight: 700, color: C.green, whiteSpace: 'nowrap' }}>✓ Minimum word count met</span>
                   : <span style={{ fontSize: 14, color: C.gold, fontWeight: 600, whiteSpace: 'nowrap' }}>{writingMin - wordCount} more words required</span>
                  }
                </div>
              </div>
            </div>
          )}

          {/* ── GRAMMAR ── */}
          {currentSkill === 'grammar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'center' }}>
                Language Use · {exam.grammar_vocab.questions.length} Questions · 25 pts · Grammar & Vocabulary
                </span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>
              {exam.grammar_vocab.questions.map((q, i) => (
                <Panel key={q.id} style={{ padding: '20px 24px', border: `2px solid ${mcqAnswers[q.id] ? `${color}35` : C.border}`, transition: 'border-color .2s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: C.navy, flex: 1, lineHeight: 1.65, margin: 0 }}>
                      <span style={{ fontWeight: 900, color: C.textLt, marginRight: 8, fontFamily: "'DM Sans', sans-serif" }}>{String(i + 1).padStart(2, '0')}.</span>
                      {q.question}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <CEFRBadge level={q.level ?? 'A2'} />
                      <span style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>{q.skill === 'grammar' ? 'Grammar' : 'Vocabulary'}</span>
                    </div>
                  </div>
                  <div className="mcq-grid">
                    {q.options.map(opt => {
                      const letter = opt.charAt(0); const sel = mcqAnswers[q.id] === letter
                      return (
                        <button key={opt} className="mcq-opt"
                          onClick={() => setMcqAnswers(p => ({ ...p, [q.id]: letter }))}
                          style={{ textAlign: 'left', padding: '12px 16px', borderRadius: 14, border: `2px solid ${sel ? color : C.border}`, background: sel ? `${color}0D` : C.bg, color: sel ? color : C.text, fontWeight: sel ? 700 : 400, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Sans', sans-serif" }}>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, border: `2px solid ${sel ? color : '#D1D5DB'}`, background: sel ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: sel ? '#fff' : C.textLt }}>{letter}</span>
                          {opt.slice(2)}
                        </button>
                      )
                    })}
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'rgba(248,245,238,.96)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${C.border}`, padding: '12px 20px', boxShadow: '0 -4px 24px rgba(15,28,53,.08)' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {skillIdx > 0 && (
              <button onClick={prevSkill} style={{ padding: '11px 20px', background: C.bg, border: `2px solid ${C.border}`, color: C.textMid, borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                ← Back
              </button>
            )}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg, borderRadius: 50, padding: '10px 18px', border: `1px solid ${C.border}`, minWidth: 0 }}>
              <span style={{ fontSize: 12, color: C.textLt, whiteSpace: 'nowrap' }}>Section {skillIdx + 1}/{SKILL_STEPS.length}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginLeft: 8 }}>
                {currentSkill === 'writing' ? `${wordCount} / ${writingMin} words`
                  : currentSkill === 'speaking' ? (recordingDone ? '✓ Recorded' : 'Not recorded yet')
                  : `${answeredCount}/${totalQs} answered`}
              </span>
            </div>
            {!isLast ? (
              <button onClick={nextSkill} disabled={!canProceed()} style={{ padding: '11px 26px', background: canProceed() ? color : `${C.navy}18`, color: canProceed() ? '#fff' : C.textLt, border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: canProceed() ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif", flexShrink: 0, boxShadow: canProceed() ? `0 6px 18px ${color}40` : 'none' }}>
                Next →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!canProceed()} style={{ padding: '11px 26px', background: canProceed() ? C.navy : `${C.navy}18`, color: canProceed() ? '#fff' : C.textLt, border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: canProceed() ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif", flexShrink: 0, boxShadow: canProceed() ? '0 6px 18px rgba(15,28,53,.35)' : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Send size={14} strokeWidth={2.2} /> Submit Test
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULT
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'result' && result) {
    const { overall, skills, aiResult } = result
    const levelColor = CEFR_COLOR[overall] ?? C.slate
    const levelIdx = LEVEL_ORDER.indexOf(overall)
    const vstepGap = LEVEL_ORDER.indexOf('B1') - levelIdx

    const listeningScore = skills.listening.correct != null ? Math.round((skills.listening.correct / (skills.listening.total ?? 5)) * 25) : 0
    const readingScore   = skills.reading.correct != null   ? Math.round((skills.reading.correct   / (skills.reading.total   ?? 5)) * 25) : 0
    const grammarScore   = skills.grammar.correct != null   ? Math.round((skills.grammar.correct   / (skills.grammar.total   ?? 10)) * 25) : 0
    const writingScore   = skills.writing.overall  != null  ? Math.round(skills.writing.overall  * 2.5) : 0
    const speakingScore  = skills.speaking.overall != null  ? Math.round(skills.speaking.overall * 2.5) : 0
    const totalScore     = listeningScore + readingScore + grammarScore + writingScore + speakingScore

    const sectionScores = [
      { key: 'listening', label: 'Listening',    icon: Headphones, score: listeningScore, raw: skills.listening },
      { key: 'reading',   label: 'Reading',      icon: BookOpen,   score: readingScore,   raw: skills.reading   },
      { key: 'writing',   label: 'Writing',      icon: PenLine,    score: writingScore,   raw: skills.writing   },
      { key: 'speaking',  label: 'Speaking',     icon: Mic,        score: speakingScore,  raw: skills.speaking  },
      { key: 'grammar',   label: 'Language Use', icon: FileText,   score: grammarScore,   raw: skills.grammar   },
    ] as const

    // Roadmap phases — dùng rich format nếu có, fallback về legacy
    const PHASE_COLORS = [C.blue, C.green, C.gold, C.violet]
    const PHASE_LABELS = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']
    const PHASE_WEEKS  = ['Tuần 1–2', 'Tuần 3–4', 'Tuần 5–8', 'Tuần 9–12']
    const LEGACY_KEYS  = ['tuan_1_2', 'tuan_3_4', 'tuan_5_8', 'tuan_9_12'] as const

    const roadmapPhases: Array<{ label: string; week: string; color: string; title: string; ky_nang: string; hoat_dong: string[]; muc_tieu: string }> =
      aiResult.lo_trinh.phases?.map((p, i) => ({
        label:    PHASE_LABELS[i] ?? `Phase ${i + 1}`,
        week:     PHASE_WEEKS[i]  ?? '',
        color:    PHASE_COLORS[i] ?? C.slate,
        title:    p.tieu_de,
        ky_nang:  p.ky_nang_chinh,
        hoat_dong: p.hoat_dong,
        muc_tieu: p.muc_tieu,
      })) ??
      LEGACY_KEYS
        .map((k, i) => ({ k, i, content: aiResult.lo_trinh[k] }))
        .filter(({ content }) => !!content)
        .map(({ content, i }) => ({
          label: PHASE_LABELS[i], week: PHASE_WEEKS[i], color: PHASE_COLORS[i],
          title: content as string, ky_nang: '', hoat_dong: [], muc_tieu: '',
        }))

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 36, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
        <style suppressHydrationWarning>{GLOBAL_CSS}</style>

        {/* ── Score header ── */}
        <div className="fade-in" style={{ background: C.navy, borderRadius: 28, padding: '36px 40px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 36, position: 'relative', overflow: 'hidden', flexWrap: 'wrap', boxShadow: '0 20px 56px rgba(15,28,53,.22)' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 260, height: 260, background: `${levelColor}10`, borderRadius: '60% 40% 30% 70%', pointerEvents: 'none', filter: 'blur(24px)' }} />
          <ScoreRing score={totalScore} max={100} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', background: `${levelColor}20`, border: `1px solid ${levelColor}35`, borderRadius: 50, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: levelColor, letterSpacing: '.05em' }}>CEFR {overall}</span>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 900, color: '#fff', marginBottom: 6 }}>{CEFR_TITLE[overall] ?? overall}</div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.42)', lineHeight: 1.6, margin: 0 }}>{CEFR_DESC[overall]}</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: 18 }}>
              {LEVEL_ORDER.map((l, i) => (
                <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 36, borderRadius: 3, height: i === levelIdx ? 12 : 6, background: i === levelIdx ? levelColor : i < levelIdx ? `${levelColor}45` : 'rgba(255,255,255,.12)' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: i === levelIdx ? levelColor : 'rgba(255,255,255,.3)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => { setPhase('intro'); setResult(null) }} style={{ padding: '11px 22px', background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.85)', borderRadius: 50, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 7 }}>
              <RotateCcw size={14} strokeWidth={2} /> Làm lại
            </button>
            <button onClick={() => router.push('/dashboard')} style={{ padding: '11px 22px', background: C.gold, border: 'none', color: C.navy, borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 6px 20px rgba(201,168,76,.45)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <ArrowRight size={14} strokeWidth={2.2} /> Bắt đầu học
            </button>
          </div>
          <div style={{ width: '100%', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.08)', fontSize: 13 }}>
            {vstepGap > 0 && <span style={{ color: 'rgba(255,255,255,.4)' }}>Còn {vstepGap} bậc so với chuẩn VSTEP B1</span>}
            {vstepGap === 0 && <span style={{ color: C.greenLt, fontWeight: 700 }}>✓ Đạt chuẩn VSTEP B1</span>}
            {vstepGap < 0 && <span style={{ color: '#C084FC', fontWeight: 700 }}>✓ Vượt chuẩn VSTEP B1 — {Math.abs(vstepGap)} bậc</span>}
          </div>
        </div>

        {/* ── 2-column layout (giống Writing feedback view) ── */}
        <div className="result-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Nhận xét tổng thể */}
            <Panel className="fade-in">
              <SectionHeader icon={Target} title="Nhận xét tổng thể" color={C.gold} />
              <div style={{ padding: '18px 20px', background: C.goldPale, borderRadius: 14, border: `1px solid ${C.borderMd}`, fontSize: 15, color: '#5a4000', lineHeight: 1.85 }}>
                {aiResult.nhan_xet}
              </div>
            </Panel>

            {/* Writing detail */}
            {skills.writing.feedback && (
              <Panel>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                  <SectionHeader icon={PenLine} title="Writing — Chi tiết" color={SKILL_COLOR.writing} />
                  <CEFRBadge level={skills.writing.level} />
                </div>
                <div style={{ padding: '14px 18px', background: C.goldPale, border: `1px solid ${C.borderMd}`, borderRadius: 14, fontSize: 14, color: '#5a4000', lineHeight: 1.8, marginBottom: 18 }}>
                  {skills.writing.feedback}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 18 }}>
                  {[
                    { label: 'Task',       val: skills.writing.task },
                    { label: 'Coherence', val: skills.writing.coherence },
                    { label: 'Vocabulary', val: skills.writing.vocabulary },
                    { label: 'Grammar',   val: skills.writing.grammar },
                  ].map(({ label, val }) => {
                    const pct = (val ?? 0) / 10
                    const c = pct >= 0.8 ? C.green : pct >= 0.6 ? C.gold : pct >= 0.4 ? C.blue : C.rose
                    return (
                      <div key={label} style={{ padding: '14px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14 }}>
                        <div style={{ fontSize: 11, color: C.textLt, marginBottom: 6, lineHeight: 1.3 }}>{label}</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: c, lineHeight: 1 }}>
                          {val ?? '–'}<span style={{ fontSize: 12, color: C.textLt, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>/10</span>
                        </div>
                        {val != null && (
                          <div style={{ height: 4, background: `${C.navy}08`, borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
                            <div style={{ height: '100%', borderRadius: 2, width: `${pct * 100}%`, background: c, transition: 'width .7s' }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {skills.writing.suggestions && skills.writing.suggestions.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Gợi ý cải thiện</div>
                    {skills.writing.suggestions.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: C.textMid, padding: '10px 14px', background: `${C.blue}07`, border: `1px solid ${C.blue}18`, borderRadius: 12, marginBottom: 8, lineHeight: 1.65 }}>
                        <ArrowRight size={14} color={C.blue} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />{s}
                      </div>
                    ))}
                  </>
                )}
              </Panel>
            )}

            {/* Speaking detail */}
            {skills.speaking.feedback && (
              <Panel>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                  <SectionHeader icon={Mic} title="Speaking — Chi tiết" color={SKILL_COLOR.speaking} />
                  <CEFRBadge level={skills.speaking.level} />
                </div>
                <div style={{ padding: '14px 18px', background: `${SKILL_COLOR.speaking}07`, border: `1px solid ${SKILL_COLOR.speaking}20`, borderRadius: 14, fontSize: 14, color: C.textMid, lineHeight: 1.8, marginBottom: 18 }}>
                  {skills.speaking.feedback}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'Fluency',    val: skills.speaking.fluency },
                    { label: 'Vocabulary', val: skills.speaking.vocabulary },
                    { label: 'Grammar',    val: skills.speaking.grammar },
                    { label: 'Content',    val: skills.speaking.content },
                  ].map(({ label, val }) => {
                    const pct = (val ?? 0) / 10
                    const c = pct >= 0.8 ? C.green : pct >= 0.6 ? C.gold : pct >= 0.4 ? C.blue : C.rose
                    return (
                      <div key={label} style={{ padding: '14px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14 }}>
                        <div style={{ fontSize: 11, color: C.textLt, marginBottom: 6 }}>{label}</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: c, lineHeight: 1 }}>
                          {val ?? '–'}<span style={{ fontSize: 12, color: C.textLt, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>/10</span>
                        </div>
                        {val != null && (
                          <div style={{ height: 4, background: `${C.navy}08`, borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
                            <div style={{ height: '100%', borderRadius: 2, width: `${pct * 100}%`, background: c, transition: 'width .7s' }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Panel>
            )}

            {/* ── Roadmap — expandable cards (giống CriterionCard của Writing) ── */}
            {roadmapPhases.length > 0 && (
              <Panel>
                <SectionHeader icon={Trophy} title="Lộ trình học cá nhân" sub={`${aiResult.lo_trinh.muc_tieu} · ${aiResult.lo_trinh.thoi_gian}`} color={C.gold} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {roadmapPhases.map((ph, i) => (
                    <RoadmapCard key={i} phase={ph} index={i} />
                  ))}
                </div>
              </Panel>
            )}
          </div>

          {/* ── RIGHT COLUMN (giống Writing sidebar) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Score breakdown */}
            <Panel>
              <SectionHeader icon={BarChart3} title="Bảng điểm" color={C.gold} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {sectionScores.map(({ key, label, icon: Icon, score, raw }) => {
                  const pct = score / 25
                  const barColor = pct >= 0.8 ? C.green : pct >= 0.6 ? C.gold : pct >= 0.4 ? C.blue : C.rose
                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${barColor}15`, border: `1px solid ${barColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={15} color={barColor} strokeWidth={1.8} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.navy, flex: 1 }}>{label}</span>
                        <CEFRBadge level={raw.level} />
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 900, color: barColor }}>
                          {score}<span style={{ fontSize: 12, color: C.textLt, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>/25</span>
                        </span>
                      </div>
                      <div style={{ height: 5, background: `${C.navy}08`, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${pct * 100}%`, background: barColor, transition: 'width .7s cubic-bezier(.16,1,.3,1)' }} />
                      </div>
                      {'correct' in raw && raw.correct != null && (
                        <div style={{ fontSize: 13, color: C.textMid, marginTop: 4, fontWeight: 500 }}>{raw.correct}/{raw.total} câu đúng</div>
                      )}
                    </div>
                  )
                })}
                <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: '.06em' }}>Tổng điểm</span>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: C.navy }}>
                    {totalScore}<span style={{ fontSize: 14, color: C.textLt, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>/100</span>
                  </span>
                </div>
              </div>
            </Panel>

            {/* Điểm mạnh */}
            {aiResult.diem_manh?.length > 0 && (
              <Panel style={{ background: '#E1F5EE', border: '1px solid rgba(0,168,120,.22)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F6E56', marginBottom: 14 }}>✅ Điểm mạnh</div>
                {aiResult.diem_manh.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 14, color: '#1a4a3a', lineHeight: 1.65 }}>
                    <CheckCircle2 size={15} color={C.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />{s}
                  </div>
                ))}
              </Panel>
            )}

            {/* Cần cải thiện */}
            {aiResult.diem_yeu?.length > 0 && (
              <Panel style={{ background: '#FEF2F2', border: '1px solid rgba(240,100,100,.22)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#A32D2D', marginBottom: 14 }}>📈 Cần cải thiện</div>
                {aiResult.diem_yeu.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 14, color: '#5a1a1a', lineHeight: 1.65 }}>
                    <ArrowRight size={15} color={C.rose} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />{s}
                  </div>
                ))}
              </Panel>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}