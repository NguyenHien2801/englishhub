'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
interface MCQQuestion {
  id: string
  question: string
  options: string[]
  correct: string
  difficulty: 'easy' | 'medium' | 'hard'
  skill?: string
  level?: string
  explanation?: string
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
  level: string
  correct?: number
  total?: number
  overall?: number
  feedback?: string
  suggestions?: string[]
  task?: number
  coherence?: number
  vocabulary?: number
  grammar?: number
  fluency?: number
  content?: number
}

interface FinalResult {
  overall: string
  skills: {
    listening: SkillResult
    reading: SkillResult
    grammar: SkillResult
    writing: SkillResult
    speaking: SkillResult
  }
  aiResult: {
    trinh_do: string
    nhan_xet: string
    diem_manh: string[]
    diem_yeu: string[]
    lo_trinh: {
      muc_tieu: string
      thoi_gian: string
      tuan_1_2?: string
      tuan_3_4?: string
      tuan_5_8?: string
      tuan_9_12?: string
    }
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const SKILL_STEPS = ['listening', 'speaking', 'reading', 'writing', 'grammar'] as const
type SkillStep = typeof SKILL_STEPS[number]

const SECTION_TIME: Record<SkillStep, number> = {
  listening: 600,
  speaking: 120,
  reading: 900,
  writing: 1200,
  grammar: 600,
}

const SECTION_META: Record<SkillStep, {
  label: string
  part: string
  instructions: string
  totalQuestions: number
  maxScore: number
  accent: string
  accentDark: string
  icon: string
}> = {
  listening: {
    label: 'Listening',
    part: 'Part 1 of 5',
    instructions: 'You will hear an audio passage. You may listen TWICE only. Answer all questions based on what you hear. Questions will appear after the first play.',
    totalQuestions: 5,
    maxScore: 25,
    accent: '#1D4ED8',
    accentDark: '#1E3A8A',
    icon: '🎧',
  },
  speaking: {
    label: 'Speaking',
    part: 'Part 2 of 5',
    instructions: 'Read the question carefully. You have 15 seconds to prepare, then record your spoken response. Speak clearly and for the full duration allocated.',
    totalQuestions: 1,
    maxScore: 25,
    accent: '#7C3AED',
    accentDark: '#5B21B6',
    icon: '🎤',
  },
  reading: {
    label: 'Reading',
    part: 'Part 3 of 5',
    instructions: 'Read the passage carefully. Answer all questions based only on the information given in the text. Do not use outside knowledge.',
    totalQuestions: 5,
    maxScore: 25,
    accent: '#065F46',
    accentDark: '#064E3B',
    icon: '📖',
  },
  writing: {
    label: 'Writing',
    part: 'Part 4 of 5',
    instructions: 'Write a well-structured response to the prompt. You will be assessed on task achievement, coherence, vocabulary range, and grammatical accuracy.',
    totalQuestions: 1,
    maxScore: 25,
    accent: '#92400E',
    accentDark: '#78350F',
    icon: '✏️',
  },
  grammar: {
    label: 'Language Use',
    part: 'Part 5 of 5',
    instructions: 'Choose the best option (A, B, C, or D) to complete each sentence. Questions are ordered from A1 to C1 difficulty level.',
    totalQuestions: 10,
    maxScore: 25,
    accent: '#9F1239',
    accentDark: '#881337',
    icon: '📝',
  },
}

const CEFR_DESCRIPTORS: Record<string, { title: string; desc: string; color: string }> = {
  A1: { title: 'Beginner',           desc: 'Can understand and use basic familiar expressions and simple phrases.',          color: '#64748B' },
  A2: { title: 'Elementary',         desc: 'Can communicate in simple, routine tasks on familiar topics.',                   color: '#0284C7' },
  B1: { title: 'Intermediate',       desc: 'Can deal with most situations likely to arise while travelling in English.',     color: '#059669' },
  B2: { title: 'Upper-Intermediate', desc: 'Can interact with a degree of fluency and spontaneity with native speakers.',    color: '#D97706' },
  C1: { title: 'Advanced',           desc: 'Can express ideas fluently and spontaneously without much searching for words.', color: '#7C3AED' },
  C2: { title: 'Proficient',         desc: 'Can understand virtually everything heard or read with ease.',                   color: '#DB2777' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CEFRBadge({ level }: { level: string }) {
  const info = CEFR_DESCRIPTORS[level]
  if (!info) return null
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold tracking-wider uppercase"
      style={{ backgroundColor: info.color + '18', color: info.color, border: `1px solid ${info.color}40` }}
    >
      {level}
    </span>
  )
}

function SectionTimer({
  seconds, onExpire, accent,
}: { seconds: number; onExpire: () => void; accent: string }) {
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
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const isLow = remaining < 60

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" stroke="#E5E7EB" strokeWidth="2.5" />
          <circle
            cx="16" cy="16" r="13" fill="none"
            stroke={isLow ? '#EF4444' : accent}
            strokeWidth="2.5"
            strokeDasharray={`${2 * Math.PI * 13}`}
            strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct)}`}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
      </div>
      <span className={`font-mono text-sm font-bold tabular-nums ${isLow ? 'text-red-500' : 'text-gray-700'}`}>
        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  )
}

function AnswerProgress({ current, total, accent }: { current: number; total: number; accent: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(current / total) * 100}%`, backgroundColor: accent }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-400 tabular-nums">{current}/{total}</span>
    </div>
  )
}

function ScoreGauge({ value, max = 10 }: { value: number; max?: number }) {
  const pct = value / max
  const color = pct >= 0.8 ? '#059669' : pct >= 0.6 ? '#D97706' : pct >= 0.4 ? '#0284C7' : '#EF4444'
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{value.toFixed(1)}</span>
    </div>
  )
}

function QuestionCard({
  question, index, selected, onSelect, accent,
}: {
  question: MCQQuestion; index: number; selected?: string; onSelect: (v: string) => void; accent: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <p className="font-medium text-gray-900 mb-3 text-sm leading-relaxed">
        <span className="font-black text-gray-400 mr-2 tabular-nums">{(index + 1).toString().padStart(2, '0')}.</span>
        {question.question}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {question.options.map(opt => {
          const letter = opt.charAt(0)
          const isSelected = selected === letter
          return (
            <button
              key={opt}
              onClick={() => onSelect(letter)}
              className="text-left px-4 py-3 rounded-xl border-2 text-sm transition-all flex items-center gap-2.5"
              style={
                isSelected
                  ? { borderColor: accent, backgroundColor: accent + '10', color: accent, fontWeight: 600 }
                  : { borderColor: '#E5E7EB', color: '#374151' }
              }
            >
              <span
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-black shrink-0"
                style={
                  isSelected
                    ? { borderColor: accent, backgroundColor: accent, color: 'white' }
                    : { borderColor: '#D1D5DB', color: '#9CA3AF' }
                }
              >
                {letter}
              </span>
              {opt.slice(2)}
            </button>
          )
        })}
      </div>
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

  // TTS
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [playCount, setPlayCount] = useState(0)

  // STT
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingDone, setRecordingDone] = useState(false)
  const [prepTime, setPrepTime] = useState(15)
  const [prepStarted, setPrepStarted] = useState(false)
  const [prepDone, setPrepDone] = useState(false)
  const recognitionRef = useRef<any>(null)
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [sectionTimeUp, setSectionTimeUp] = useState(false)
  const [result, setResult] = useState<FinalResult | null>(null)

  const wordCount = writingText.trim() === '' ? 0 : writingText.trim().split(/\s+/).length

  useEffect(() => () => {
    window.speechSynthesis?.cancel()
    if (recTimerRef.current) clearInterval(recTimerRef.current)
    if (prepTimerRef.current) clearInterval(prepTimerRef.current)
    recognitionRef.current?.stop()
  }, [])

  // ── Generate test ───────────────────────────────────────────────────────────
  async function startTest() {
    setPhase('loading')
    setError('')
    try {
      const res = await fetch('/api/level-test/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExam(data.exam)
      setCurrentSkill('listening')
      setMcqAnswers({})
      setWritingText('')
      setSpeakingTranscript('')
      setHasPlayed(false)
      setPlayCount(0)
      setIsPlaying(false)
      setRecordingDone(false)
      setPrepDone(false)
      setPrepStarted(false)
      setPrepTime(15)
      setSectionTimeUp(false)
      setPhase('test')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate test. Please try again.')
      setPhase('intro')
    }
  }

  // ── TTS ─────────────────────────────────────────────────────────────────────
  function playScript() {
    if (!exam || playCount >= 2) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(exam.listening.script)
    utter.lang = 'en-US'
    utter.rate = 0.88
    utter.onstart = () => setIsPlaying(true)
    utter.onend = () => {
      setIsPlaying(false)
      setHasPlayed(true)
      setPlayCount(p => p + 1)
    }
    window.speechSynthesis.speak(utter)
  }

  function stopScript() {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setHasPlayed(true)
    setPlayCount(p => p + 1)
  }

  // ── Prep timer ───────────────────────────────────────────────────────────────
  function startPrepTimer() {
    if (prepStarted) return
    setPrepStarted(true)
    prepTimerRef.current = setInterval(() => {
      setPrepTime(t => {
        if (t <= 1) {
          clearInterval(prepTimerRef.current!)
          setPrepDone(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  function skipPrep() {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current)
    setPrepDone(true)
  }

  // ── STT ─────────────────────────────────────────────────────────────────────
  function startRecording() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError('Speech recognition not supported. Please use Chrome.'); return }
    const rec: any = new SR()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    let final = ''
    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      setSpeakingTranscript(final + interim)
    }
    rec.onend = () => {
      setIsRecording(false)
      setRecordingDone(true)
      if (recTimerRef.current) clearInterval(recTimerRef.current)
    }
    recognitionRef.current = rec
    rec.start()
    setIsRecording(true)
    setRecordingTime(0)
    recTimerRef.current = setInterval(() => {
      setRecordingTime(t => {
        if (t >= (exam?.speaking.time_seconds ?? 90) - 1) { stopRecording(); return t }
        return t + 1
      })
    }, 1000)
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    if (recTimerRef.current) clearInterval(recTimerRef.current)
    setIsRecording(false)
    setRecordingDone(true)
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  const handleSectionExpire = useCallback(() => setSectionTimeUp(true), [])

  function goToSkill(skill: SkillStep) {
    setSectionTimeUp(false)
    setPrepDone(false)
    setPrepStarted(false)
    setPrepTime(15)
    setCurrentSkill(skill)
  }

  function nextSkill() {
    const idx = SKILL_STEPS.indexOf(currentSkill)
    if (idx < SKILL_STEPS.length - 1) goToSkill(SKILL_STEPS[idx + 1])
  }

  function prevSkill() {
    const idx = SKILL_STEPS.indexOf(currentSkill)
    if (idx > 0) goToSkill(SKILL_STEPS[idx - 1])
  }

  function canProceed(): boolean {
    if (!exam) return false
    if (sectionTimeUp) return true
    switch (currentSkill) {
      case 'listening': return hasPlayed && exam.listening.questions.every(q => mcqAnswers[q.id])
      case 'speaking':  return recordingDone && speakingTranscript.trim().length > 5
      case 'reading':   return exam.reading.questions.every(q => mcqAnswers[q.id])
      case 'writing':   return wordCount >= (exam.writing?.min_words ?? 80)
      case 'grammar':   return exam.grammar_vocab.questions.every(q => mcqAnswers[q.id])
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setPhase('submitting')
    try {
      const res = await fetch('/api/level-test/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam, answers: mcqAnswers, writingText, speakingTranscript, topic: exam?.topic }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setPhase('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Please try again.')
      setPhase('test')
      setCurrentSkill('grammar')
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTRO
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'intro') return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm">E</div>
          <span className="font-bold text-sm tracking-widest uppercase text-gray-200">English Proficiency Test</span>
        </div>
        <span className="text-xs text-gray-600 font-mono">CEFR · VSTEP · APTIS Aligned</span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-6">
          Official Assessment Format
        </div>
        <h1 className="text-5xl font-black tracking-tight mb-4 leading-[1.05]">
          English<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Level Test</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl leading-relaxed mb-12">
          A comprehensive 5-section assessment aligned with CEFR, VSTEP and APTIS frameworks. 
          Receive an AI-generated score report with personalised study roadmap.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-12">
          {[
            { label: 'Duration', value: '~40 min', icon: '⏱' },
            { label: 'Sections', value: '5 Parts', icon: '📋' },
            { label: 'Questions', value: '22 items', icon: '❓' },
            { label: 'Scale', value: 'A1 – C2', icon: '🎯' },
          ].map(s => (
            <div key={s.label} className="p-4 bg-white/[0.04] border border-white/8 rounded-2xl text-center">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-white font-black text-lg">{s.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Test structure */}
        <div className="mb-12">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-600 mb-4">Test Structure</h2>
          <div className="space-y-2">
            {SKILL_STEPS.map((s, i) => {
              const m = SECTION_META[s]
              const mins = Math.floor(SECTION_TIME[s] / 60)
              return (
                <div key={s} className="flex items-center gap-4 px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] transition-colors">
                  <span className="text-xs font-mono text-gray-700 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-lg">{m.icon}</span>
                  <div className="flex-1">
                    <span className="font-bold text-white text-sm">{m.label}</span>
                    <span className="text-gray-600 text-xs ml-2">{m.totalQuestions} {m.totalQuestions === 1 ? 'task' : 'questions'}</span>
                  </div>
                  <span className="text-xs text-gray-500">{mins} min</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: m.accent }}>{m.maxScore} pts</span>
                </div>
              )
            })}
            <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.06] border border-white/10 rounded-xl">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total</span>
              <span className="font-black text-white tabular-nums">100 points</span>
            </div>
          </div>
        </div>

        {/* CEFR scale */}
        <div className="mb-12">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-600 mb-4">CEFR Score Scale</h2>
          <div className="grid grid-cols-6 gap-2">
            {LEVEL_ORDER.map(l => {
              const info = CEFR_DESCRIPTORS[l]
              return (
                <div key={l} className="p-3 rounded-xl border text-center" style={{ borderColor: info.color + '25', backgroundColor: info.color + '08' }}>
                  <div className="font-black text-xl" style={{ color: info.color }}>{l}</div>
                  <div className="text-gray-600 text-xs mt-0.5 leading-tight">{info.title}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notice */}
        <div className="p-5 bg-amber-500/6 border border-amber-500/18 rounded-2xl mb-8">
          <h3 className="text-amber-400 font-bold text-sm mb-3">📋 Before You Begin</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            {[
              'Ensure you are in a quiet environment with a working microphone and speakers.',
              'Do not refresh or close the browser during the test — progress cannot be recovered.',
              'Each section has a time limit. When time expires, you must proceed to the next section.',
              'Scores are generated by AI and reflect CEFR proficiency standards.',
            ].map((t, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="text-amber-500/70 shrink-0 font-bold">{i + 1}.</span>{t}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            ⚠ {error}
          </div>
        )}

        <button
          onClick={startTest}
          className="w-full py-5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-lg rounded-2xl transition-all duration-200 tracking-wide shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5"
        >
          Begin Test →
        </button>
        <p className="text-center text-xs text-gray-700 mt-3">
          By starting, you agree to complete the test honestly without external assistance.
        </p>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING / SUBMITTING
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'loading' || phase === 'submitting') return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white px-4">
      <div className="mb-8 relative w-20 h-20">
        <div className="w-20 h-20 rounded-full border-2 border-white/8 flex items-center justify-center">
          <span className="text-4xl animate-pulse">{phase === 'loading' ? '🤖' : '📊'}</span>
        </div>
        <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin" />
      </div>
      <h2 className="text-2xl font-black mb-2 text-center">
        {phase === 'loading' ? 'Generating Your Test Paper...' : 'Analysing Your Responses...'}
      </h2>
      <p className="text-gray-500 text-sm text-center max-w-sm leading-relaxed">
        {phase === 'loading'
          ? 'AI is creating a unique 5-section test aligned with CEFR standards. This may take 10–15 seconds.'
          : 'AI is scoring all 5 sections and generating your personalised feedback report. Please wait.'}
      </p>
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'test' && exam) {
    const skillIdx = SKILL_STEPS.indexOf(currentSkill)
    const isLast = currentSkill === 'grammar'
    const meta = SECTION_META[currentSkill]

    const answeredCount =
      currentSkill === 'listening' ? exam.listening.questions.filter(q => mcqAnswers[q.id]).length :
      currentSkill === 'reading'   ? exam.reading.questions.filter(q => mcqAnswers[q.id]).length :
      currentSkill === 'grammar'   ? exam.grammar_vocab.questions.filter(q => mcqAnswers[q.id]).length :
      meta.totalQuestions

    return (
      <div className="min-h-screen bg-gray-50">

        {/* ── Top bar ───────────────────────────────────────── */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            {/* Section label */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                style={{ backgroundColor: meta.accent }}
              >
                {skillIdx + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-900 text-sm">{meta.label}</span>
                  <span className="text-xs text-gray-400 hidden sm:inline">{meta.part}</span>
                </div>
                <div className="text-xs text-gray-400 truncate hidden sm:block">Topic: {exam.topic}</div>
              </div>
            </div>

            {/* Section steps (desktop) */}
            <div className="hidden md:flex items-center gap-1.5">
              {SKILL_STEPS.map((s, i) => (
                <div
                  key={s}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === skillIdx ? '32px' : '16px',
                    backgroundColor:
                      i < skillIdx ? '#10B981' :
                      i === skillIdx ? meta.accent : '#E5E7EB',
                  }}
                />
              ))}
            </div>

            {/* Right: score + timer */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-gray-400">Section Score</div>
                <div className="text-sm font-black text-gray-700" style={{ color: meta.accent }}>{meta.maxScore} pts</div>
              </div>
              <SectionTimer
                key={currentSkill}
                seconds={SECTION_TIME[currentSkill]}
                onExpire={handleSectionExpire}
                accent={meta.accent}
              />
            </div>
          </div>

          {/* Answer progress strip */}
          {['listening', 'reading', 'grammar'].includes(currentSkill) && (
            <div className="max-w-3xl mx-auto px-4 pb-2.5">
              <AnswerProgress current={answeredCount} total={meta.totalQuestions} accent={meta.accent} />
            </div>
          )}
        </div>

        {/* Time-up banner */}
        {sectionTimeUp && (
          <div className="max-w-3xl mx-auto px-4 pt-4">
            <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <span className="text-lg">⏰</span>
              <div>
                <strong>Time's up for this section.</strong> Unanswered questions score 0. 
                You may now proceed to the next section.
              </div>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 py-6 pb-32">

          {/* Instructions banner */}
          <div
            className="flex items-start gap-3 p-4 rounded-xl mb-6 border"
            style={{ backgroundColor: meta.accent + '07', borderColor: meta.accent + '22' }}
          >
            <span className="text-xl shrink-0 mt-0.5">{meta.icon}</span>
            <div>
              <div className="font-bold text-sm mb-0.5" style={{ color: meta.accent }}>
                Instructions — {meta.label} ({meta.part})
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{meta.instructions}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">⚠ {error}</div>
          )}

          {/* ════════════ LISTENING ════════════ */}
          {currentSkill === 'listening' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900">Audio Passage</h3>
                    <div className="flex items-center gap-1.5">
                      {[1, 2].map(n => (
                        <div
                          key={n}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all"
                          style={
                            playCount >= n
                              ? { backgroundColor: meta.accent, borderColor: meta.accent, color: 'white' }
                              : { backgroundColor: 'white', borderColor: '#E5E7EB', color: '#9CA3AF' }
                          }
                        >
                          {n}
                        </div>
                      ))}
                      <span className="text-xs text-gray-400 ml-1">/ 2 plays</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Play the recording to reveal the questions. Maximum 2 plays allowed.</p>
                </div>

                {/* Waveform */}
                <div className="px-6 py-4 bg-gray-50 flex items-center gap-0.5 h-16">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full transition-all"
                      style={{
                        backgroundColor: isPlaying ? meta.accent : (hasPlayed ? meta.accent + '50' : '#E5E7EB'),
                        height: isPlaying
                          ? `${12 + Math.abs(Math.sin(i * 0.4)) * 22}px`
                          : hasPlayed ? `${6 + Math.abs(Math.sin(i * 0.4)) * 12}px` : '4px',
                        animation: isPlaying ? `bounce ${0.25 + (i % 7) * 0.06}s ease-in-out infinite alternate` : 'none',
                      }}
                    />
                  ))}
                </div>

                <div className="px-6 py-4 flex items-center gap-4">
                  <button
                    onClick={isPlaying ? stopScript : playScript}
                    disabled={playCount >= 2}
                    className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={
                      playCount >= 2 ? { backgroundColor: '#F3F4F6', color: '#9CA3AF' } :
                      isPlaying ? { backgroundColor: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FCA5A5' } :
                      { backgroundColor: meta.accent, color: 'white' }
                    }
                  >
                    {isPlaying ? '⏹ Stop' : playCount === 0 ? '▶ Play Audio' : '▶ Play Again (2nd & final)'}
                  </button>
                  {playCount === 2 && (
                    <span className="text-xs text-gray-400 italic">Maximum plays reached</span>
                  )}
                </div>
              </div>

              {hasPlayed ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                    <div className="h-px flex-1 bg-gray-200" />
                    Comprehension Questions ({exam.listening.questions.length} items · {meta.maxScore} pts)
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  {exam.listening.questions.map((q, i) => (
                    <QuestionCard
                      key={q.id} question={q} index={i}
                      selected={mcqAnswers[q.id]}
                      onSelect={v => setMcqAnswers(p => ({ ...p, [q.id]: v }))}
                      accent={meta.accent}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-5xl mb-3">🔊</div>
                  <p className="text-sm font-medium">Play the audio to reveal the questions.</p>
                  <p className="text-xs mt-1">Questions will appear after the recording ends.</p>
                </div>
              )}
            </div>
          )}

          {/* ════════════ SPEAKING ════════════ */}
          {currentSkill === 'speaking' && (
            <div className="space-y-4">
              {/* Task card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: meta.accent }}>
                      Speaking Task · Part 2 of 5
                    </div>
                    <div className="text-xs text-gray-400">
                      Target level: <strong>{exam.speaking.level_target}</strong> · 
                      Response time: <strong>{exam.speaking.time_seconds}s</strong> · 
                      Score: <strong>25 pts</strong>
                    </div>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 leading-relaxed mb-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  {exam.speaking.prompt}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Fluency & Coherence', pct: 25 },
                    { label: 'Lexical Resource', pct: 25 },
                    { label: 'Grammatical Range', pct: 25 },
                    { label: 'Task Response', pct: 25 },
                  ].map(c => (
                    <div key={c.label} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center">
                      <div className="text-xs font-bold text-gray-700 leading-tight">{c.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{c.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preparation phase */}
              {!prepDone && !isRecording && !recordingDone && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Preparation Time</div>
                  <div
                    className="text-6xl font-black font-mono mb-2 tabular-nums"
                    style={{ color: prepTime <= 5 ? '#EF4444' : meta.accent }}
                  >
                    {prepTime}s
                  </div>
                  <p className="text-sm text-gray-400 mb-6">Use this time to organise your thoughts and key points.</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={skipPrep}
                      className="px-6 py-3 text-white font-bold text-sm rounded-xl transition-all"
                      style={{ backgroundColor: meta.accent }}
                    >
                      Skip Prep — Record Now
                    </button>
                    {!prepStarted && (
                      <button
                        onClick={startPrepTimer}
                        className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:border-gray-400 transition-colors"
                      >
                        ▶ Start Countdown
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Recording phase */}
              {(prepDone || isRecording || recordingDone) && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">Your Response</h3>
                    {isRecording && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="font-mono text-sm font-bold text-red-600 tabular-nums">
                          {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
                          {(recordingTime % 60).toString().padStart(2, '0')}
                          <span className="text-gray-400 font-normal text-xs">
                            /{Math.floor(exam.speaking.time_seconds / 60).toString().padStart(2, '0')}:
                            {(exam.speaking.time_seconds % 60).toString().padStart(2, '0')}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Recording progress bar */}
                  {isRecording && (
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full bg-red-400 rounded-full transition-all"
                        style={{ width: `${(recordingTime / exam.speaking.time_seconds) * 100}%` }}
                      />
                    </div>
                  )}

                  <div className="flex gap-3 mb-4">
                    {!isRecording && !recordingDone && (
                      <button onClick={startRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors">
                        ● Start Recording
                      </button>
                    )}
                    {isRecording && (
                      <button onClick={stopRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-700 text-white rounded-xl font-bold text-sm transition-colors">
                        ■ Stop Recording
                      </button>
                    )}
                    {recordingDone && (
                      <button
                        onClick={() => { setSpeakingTranscript(''); setRecordingDone(false); setRecordingTime(0) }}
                        className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 hover:border-gray-400 text-gray-700 rounded-xl text-sm font-bold transition-colors">
                        ↺ Re-record
                      </button>
                    )}
                  </div>

                  {isRecording && (
                    <div className="flex items-center gap-2.5 text-sm text-red-500 font-medium mb-4 p-3 bg-red-50 rounded-xl">
                      <div className="flex gap-0.5 items-end h-5 shrink-0">
                        {[3, 5, 7, 5, 3, 6, 4, 5, 7].map((h, i) => (
                          <div key={i} className="w-0.5 bg-red-400 rounded-full animate-bounce" style={{ height: `${h * 2.5}px`, animationDelay: `${i * 0.07}s` }} />
                        ))}
                      </div>
                      Recording in progress — speak clearly in English
                    </div>
                  )}

                  {speakingTranscript && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Live Transcript</span>
                        <span className="text-xs text-gray-400 tabular-nums">
                          ~{speakingTranscript.trim().split(/\s+/).length} words
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{speakingTranscript}</p>
                    </div>
                  )}

                  {recordingDone && !speakingTranscript && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                      ⚠ No speech detected. Please check your microphone settings and try again.
                    </div>
                  )}

                  {recordingDone && speakingTranscript && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
                      <span className="text-base">✓</span>
                      Response recorded successfully. You may re-record if you wish.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════════════ READING ════════════ */}
          {currentSkill === 'reading' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.accent }}>Reading Passage</div>
                  <span className="text-xs text-gray-400 tabular-nums">
                    ~{exam.reading.passage.split(/\s+/).length} words
                  </span>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm text-gray-700 leading-[1.9] font-serif">{exam.reading.passage}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                  <div className="h-px flex-1 bg-gray-200" />
                  Comprehension Questions ({exam.reading.questions.length} items · {meta.maxScore} pts)
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                {exam.reading.questions.map((q, i) => (
                  <QuestionCard
                    key={q.id} question={q} index={i}
                    selected={mcqAnswers[q.id]}
                    onSelect={v => setMcqAnswers(p => ({ ...p, [q.id]: v }))}
                    accent={meta.accent}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ════════════ WRITING ════════════ */}
          {currentSkill === 'writing' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.accent }}>Writing Task · Part 4 of 5</div>
                  <div
                    className="px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap"
                    style={{ backgroundColor: meta.accent + '12', color: meta.accent }}
                  >
                    {exam.writing.min_words}–{exam.writing.max_words} words
                  </div>
                </div>
                <p className="font-bold text-gray-900 leading-relaxed text-base mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  {exam.writing.prompt}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {exam.writing.criteria.map((c, i) => (
                    <div key={c} className="flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                        style={{ backgroundColor: meta.accent + '15', color: meta.accent }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-gray-200 focus-within:border-amber-400 transition-colors overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Your Response</span>
                  <span
                    className="text-xs font-mono font-bold tabular-nums"
                    style={{ color: wordCount >= exam.writing.min_words ? '#059669' : '#9CA3AF' }}
                  >
                    {wordCount} words
                  </span>
                </div>
                <textarea
                  value={writingText}
                  onChange={e => setWritingText(e.target.value)}
                  placeholder="Begin writing your response here. Use paragraphs and clear structure..."
                  rows={13}
                  className="w-full px-6 py-5 text-sm text-gray-800 leading-relaxed resize-none outline-none font-serif"
                />
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((wordCount / exam.writing.min_words) * 100, 100)}%`,
                        backgroundColor: wordCount >= exam.writing.min_words ? '#059669' : '#D97706',
                      }}
                    />
                  </div>
                  {wordCount >= exam.writing.min_words
                    ? <span className="text-xs font-bold text-emerald-600 whitespace-nowrap">✓ Minimum word count met</span>
                    : <span className="text-xs text-amber-600 whitespace-nowrap">{exam.writing.min_words - wordCount} more words required</span>
                  }
                </div>
              </div>
            </div>
          )}

          {/* ════════════ LANGUAGE USE (GRAMMAR) ════════════ */}
          {currentSkill === 'grammar' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                <div className="h-px flex-1 bg-gray-200" />
                Language Use · {exam.grammar_vocab.questions.length} Questions · {meta.maxScore} pts · Mixed Grammar &amp; Vocabulary
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              {exam.grammar_vocab.questions.map((q, i) => {
                const isSelected = !!mcqAnswers[q.id]
                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border-2 shadow-sm p-5 transition-colors"
                    style={{ borderColor: isSelected ? meta.accent + '40' : '#E5E7EB' }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="font-medium text-gray-900 flex-1 text-sm leading-relaxed">
                        <span className="font-black text-gray-400 mr-2 tabular-nums">{String(i + 1).padStart(2, '0')}.</span>
                        {q.question}
                      </p>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <CEFRBadge level={q.level ?? 'A2'} />
                        <span className="text-xs text-gray-400">{q.skill === 'grammar' ? 'Grammar' : 'Vocabulary'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map(opt => {
                        const letter = opt.charAt(0)
                        const sel = mcqAnswers[q.id] === letter
                        return (
                          <button
                            key={opt}
                            onClick={() => setMcqAnswers(p => ({ ...p, [q.id]: letter }))}
                            className="text-left px-4 py-3 rounded-xl border-2 text-sm transition-all flex items-center gap-2.5"
                            style={
                              sel
                                ? { borderColor: meta.accent, backgroundColor: meta.accent + '10', color: meta.accentDark, fontWeight: 600 }
                                : { borderColor: '#E5E7EB', color: '#374151' }
                            }
                          >
                            <span
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-black shrink-0"
                              style={
                                sel
                                  ? { borderColor: meta.accent, backgroundColor: meta.accent, color: 'white' }
                                  : { borderColor: '#D1D5DB', color: '#9CA3AF' }
                              }
                            >
                              {letter}
                            </span>
                            {opt.slice(2)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Bottom navigation ──────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 shadow-lg">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            {skillIdx > 0 && (
              <button
                onClick={prevSkill}
                className="px-5 py-3 border-2 border-gray-200 hover:border-gray-400 rounded-xl font-bold text-sm text-gray-600 hover:text-gray-900 transition-all shrink-0"
              >
                ← Back
              </button>
            )}

            {/* Status chip */}
            <div className="flex-1 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2 border border-gray-200 min-w-0">
              <span className="text-xs text-gray-400 shrink-0">Section {skillIdx + 1}/{SKILL_STEPS.length}</span>
              <span className="text-xs font-bold truncate ml-2" style={{ color: meta.accent }}>
                {currentSkill === 'listening' || currentSkill === 'reading' || currentSkill === 'grammar'
                  ? `${answeredCount}/${meta.totalQuestions} answered`
                  : currentSkill === 'writing'
                    ? `${wordCount} / ${exam.writing.min_words} words`
                    : recordingDone ? '✓ Recorded' : 'Not recorded yet'
                }
              </span>
            </div>

            {!isLast ? (
              <button
                onClick={nextSkill}
                disabled={!canProceed()}
                className="px-6 py-3 text-white font-black text-sm rounded-xl transition-all disabled:opacity-35 disabled:cursor-not-allowed shrink-0 shadow-lg"
                style={{ backgroundColor: canProceed() ? meta.accent : '#9CA3AF' }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="px-6 py-3 bg-gray-900 hover:bg-gray-700 text-white font-black text-sm rounded-xl transition-all disabled:opacity-35 disabled:cursor-not-allowed shrink-0 shadow-lg"
              >
                Submit Test →
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESULT
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'result' && result) {
    const { overall, skills, aiResult } = result
    const levelInfo = CEFR_DESCRIPTORS[overall] ?? CEFR_DESCRIPTORS['A1']
    const levelIdx = LEVEL_ORDER.indexOf(overall)
    const vstepGap = LEVEL_ORDER.indexOf('B1') - levelIdx

    const listeningScore = skills.listening.correct != null ? Math.round((skills.listening.correct / (skills.listening.total ?? 5)) * 25) : 0
    const readingScore   = skills.reading.correct != null   ? Math.round((skills.reading.correct / (skills.reading.total ?? 5)) * 25)     : 0
    const grammarScore   = skills.grammar.correct != null   ? Math.round((skills.grammar.correct / (skills.grammar.total ?? 10)) * 25)    : 0
    const writingScore   = skills.writing.overall != null   ? Math.round(skills.writing.overall * 2.5)  : 0
    const speakingScore  = skills.speaking.overall != null  ? Math.round(skills.speaking.overall * 2.5) : 0
    const totalScore     = listeningScore + readingScore + grammarScore + writingScore + speakingScore

    return (
      <div className="min-h-screen bg-gray-950 text-white">
        {/* Report header */}
        <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm">E</div>
            <span className="font-bold text-sm tracking-widest uppercase">English Proficiency Test</span>
          </div>
          <span className="text-xs text-gray-600 font-mono uppercase tracking-widest">Official Score Report</span>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

          {/* ── Overall result card ──────────────────────────── */}
          <div
            className="rounded-2xl p-8 text-center border relative overflow-hidden"
            style={{ backgroundColor: levelInfo.color + '10', borderColor: levelInfo.color + '28' }}
          >
            <div className="text-xs font-black uppercase tracking-widest mb-4 text-gray-400">CEFR Proficiency Level</div>
            <div className="text-9xl font-black mb-2 leading-none" style={{ color: levelInfo.color }}>{overall}</div>
            <div className="text-2xl font-black text-white mb-2">{levelInfo.title}</div>
            <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6 leading-relaxed">{levelInfo.desc}</p>

            {/* Level rail */}
            <div className="flex items-end justify-center gap-1.5 mb-6">
              {LEVEL_ORDER.map((l, i) => (
                <div key={l} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-10 rounded-full transition-all"
                    style={{
                      height: i === levelIdx ? '12px' : '6px',
                      backgroundColor: i === levelIdx ? levelInfo.color : i < levelIdx ? levelInfo.color + '45' : '#374151',
                    }}
                  />
                  <span
                    className="text-xs font-black"
                    style={{ color: i === levelIdx ? levelInfo.color : '#6B7280' }}
                  >
                    {l}
                  </span>
                </div>
              ))}
            </div>

            {/* Total score pill */}
            <div
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-black mb-3"
              style={{ backgroundColor: levelInfo.color + '20', color: levelInfo.color, border: `1px solid ${levelInfo.color}35` }}
            >
              Total Score: {totalScore} / 100
            </div>

            <div className="text-xs">
              {vstepGap > 0 && <span className="text-gray-500">{vstepGap} level{vstepGap > 1 ? 's' : ''} below VSTEP B1 standard</span>}
              {vstepGap === 0 && <span className="text-emerald-400 font-bold">✓ VSTEP B1 Standard achieved</span>}
              {vstepGap < 0 && <span className="text-purple-400 font-bold">✓ Above VSTEP B1 Standard ({Math.abs(vstepGap)} level{Math.abs(vstepGap) > 1 ? 's' : ''})</span>}
            </div>
          </div>

          {/* ── Section Breakdown ────────────────────────────── */}
          <div className="bg-white/[0.04] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
              <h3 className="font-black text-white text-sm uppercase tracking-wider">Section Score Breakdown</h3>
              <span className="text-xs text-gray-600 tabular-nums">Max 25 pts per section</span>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {[
                { key: 'listening' as const, label: 'Listening',    icon: '🎧', score: listeningScore, raw: skills.listening },
                { key: 'reading'   as const, label: 'Reading',      icon: '📖', score: readingScore,   raw: skills.reading   },
                { key: 'writing'   as const, label: 'Writing',      icon: '✏️', score: writingScore,   raw: skills.writing   },
                { key: 'speaking'  as const, label: 'Speaking',     icon: '🎤', score: speakingScore,  raw: skills.speaking  },
                { key: 'grammar'   as const, label: 'Language Use', icon: '📝', score: grammarScore,   raw: skills.grammar   },
              ].map(({ key, label, icon, score, raw }) => {
                const pct = score / 25
                const barColor = pct >= 0.8 ? '#34D399' : pct >= 0.6 ? '#FCD34D' : pct >= 0.4 ? '#60A5FA' : '#F87171'
                return (
                  <div key={key} className="px-6 py-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span>{icon}</span>
                      <span className="font-bold text-sm text-white flex-1">{label}</span>
                      <CEFRBadge level={raw.level} />
                      <span className="font-black tabular-nums text-sm" style={{ color: barColor }}>
                        {score}<span className="text-gray-600 font-normal text-xs">/25</span>
                      </span>
                    </div>
                    <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct * 100}%`, backgroundColor: barColor }} />
                    </div>
                    {'correct' in raw && raw.correct != null && (
                      <div className="text-xs text-gray-600 mt-1.5 tabular-nums">{raw.correct}/{raw.total} correct answers</div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="px-6 py-4 bg-white/[0.04] border-t border-white/8 flex items-center justify-between">
              <span className="font-black uppercase tracking-widest text-xs text-gray-400">Total Score</span>
              <span className="font-black text-3xl text-white tabular-nums">
                {totalScore}<span className="text-gray-600 text-lg font-normal">/100</span>
              </span>
            </div>
          </div>

          {/* ── Writing detailed feedback ─────────────────────── */}
          {skills.writing.feedback && (
            <div className="bg-white/[0.04] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2.5">
                <span>✏️</span>
                <h3 className="font-black text-white text-sm uppercase tracking-wider">Writing — Detailed Assessment</h3>
                <div className="ml-auto"><CEFRBadge level={skills.writing.level} /></div>
              </div>
              <div className="p-6 space-y-5">
                <p className="text-sm text-gray-300 leading-relaxed">{skills.writing.feedback}</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Task Achievement',       val: skills.writing.task },
                    { label: 'Coherence & Cohesion',   val: skills.writing.coherence },
                    { label: 'Lexical Resource',        val: skills.writing.vocabulary },
                    { label: 'Grammatical Range',       val: skills.writing.grammar },
                  ].map(({ label, val }) => (
                    <div key={label} className="p-3.5 bg-white/[0.04] border border-white/8 rounded-xl">
                      <div className="text-xs text-gray-500 mb-2 leading-tight">{label}</div>
                      <div className="font-black text-2xl text-white tabular-nums">
                        {val ?? '–'}<span className="text-gray-600 text-sm font-normal">/10</span>
                      </div>
                      {val != null && <ScoreGauge value={val} />}
                    </div>
                  ))}
                </div>
                {skills.writing.suggestions && skills.writing.suggestions.length > 0 && (
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2.5">Improvement Suggestions</div>
                    <div className="space-y-2">
                      {skills.writing.suggestions.map((s, i) => (
                        <div key={i} className="flex gap-2.5 text-sm text-gray-300 p-3 bg-blue-500/6 border border-blue-500/15 rounded-xl">
                          <span className="text-blue-400 font-bold shrink-0">→</span>{s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Speaking detailed feedback ────────────────────── */}
          {skills.speaking.feedback && (
            <div className="bg-white/[0.04] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2.5">
                <span>🎤</span>
                <h3 className="font-black text-white text-sm uppercase tracking-wider">Speaking — Detailed Assessment</h3>
                <div className="ml-auto"><CEFRBadge level={skills.speaking.level} /></div>
              </div>
              <div className="p-6 space-y-5">
                <p className="text-sm text-gray-300 leading-relaxed">{skills.speaking.feedback}</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Fluency & Coherence', val: skills.speaking.fluency },
                    { label: 'Lexical Resource',     val: skills.speaking.vocabulary },
                    { label: 'Grammatical Range',    val: skills.speaking.grammar },
                    { label: 'Task Response',         val: skills.speaking.content },
                  ].map(({ label, val }) => (
                    <div key={label} className="p-3.5 bg-white/[0.04] border border-white/8 rounded-xl">
                      <div className="text-xs text-gray-500 mb-2 leading-tight">{label}</div>
                      <div className="font-black text-2xl text-white tabular-nums">
                        {val ?? '–'}<span className="text-gray-600 text-sm font-normal">/10</span>
                      </div>
                      {val != null && <ScoreGauge value={val} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── AI Analysis ───────────────────────────────────── */}
          <div className="bg-white/[0.04] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2.5">
              <span>🤖</span>
              <h3 className="font-black text-white text-sm uppercase tracking-wider">AI Analysis</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Overall Assessment</div>
                <p className="text-sm text-gray-300 leading-relaxed">{aiResult.nhan_xet}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {aiResult.diem_manh?.length > 0 && (
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-2.5">✓ Strengths</div>
                    <div className="space-y-2">
                      {aiResult.diem_manh.map((s, i) => (
                        <div key={i} className="flex gap-2.5 text-sm text-gray-300 p-2.5 bg-emerald-500/6 border border-emerald-500/14 rounded-xl">
                          <span className="text-emerald-400 font-black shrink-0">{i + 1}.</span>{s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {aiResult.diem_yeu?.length > 0 && (
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-red-400 mb-2.5">✗ Areas to Improve</div>
                    <div className="space-y-2">
                      {aiResult.diem_yeu.map((s, i) => (
                        <div key={i} className="flex gap-2.5 text-sm text-gray-300 p-2.5 bg-red-500/6 border border-red-500/14 rounded-xl">
                          <span className="text-red-400 font-black shrink-0">{i + 1}.</span>{s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Study Roadmap ─────────────────────────────────── */}
          {aiResult.lo_trinh && (
            <div className="bg-white/[0.04] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8">
                <h3 className="font-black text-white text-sm uppercase tracking-wider mb-0.5">🗺 Personalised Study Roadmap</h3>
                <p className="text-xs text-gray-600">
                  Goal: {aiResult.lo_trinh.muc_tieu} · Timeline: {aiResult.lo_trinh.thoi_gian}
                </p>
              </div>
              <div className="p-6">
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[5px] top-3 bottom-3 w-px bg-white/10" />
                  <div className="space-y-6">
                    {(['tuan_1_2', 'tuan_3_4', 'tuan_5_8', 'tuan_9_12'] as const).map((k, i) => {
                      const content = aiResult.lo_trinh[k]
                      if (!content) return null
                      const phases = ['Phase 1 — Week 1–2', 'Phase 2 — Week 3–4', 'Phase 3 — Week 5–8', 'Phase 4 — Week 9–12']
                      const colors = ['#60A5FA', '#34D399', '#FCD34D', '#C084FC']
                      return (
                        <div key={k} className="flex gap-5">
                          <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ring-4 ring-gray-950 z-10" style={{ backgroundColor: colors[i] }} />
                          <div>
                            <div className="text-xs font-black mb-1.5 tracking-wide" style={{ color: colors[i] }}>
                              {phases[i]}
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">{content}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Actions ───────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => { setPhase('intro'); setResult(null) }}
              className="py-4 border-2 border-white/12 hover:border-white/25 text-gray-400 hover:text-white rounded-xl font-bold text-sm transition-all"
            >
              ↺ Retake
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="py-4 border-2 border-white/12 hover:border-white/25 text-gray-400 hover:text-white rounded-xl font-bold text-sm transition-all"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/vocabulary')}
              className="py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition-all shadow-xl shadow-blue-500/20"
            >
              Start Learning →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}