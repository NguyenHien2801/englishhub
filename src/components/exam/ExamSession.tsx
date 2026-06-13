'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  Headphones, Mic, BookOpen, PenLine, FileText, ListChecks,
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, MinusCircle,
  Play, Square, RotateCcw, Send, AlertCircle, Brain, Award,
  ChevronDown, ChevronUp, Lightbulb, Clock,
} from 'lucide-react'
import type { Mode } from '@/app/(dashboard)/exam/page'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question {
  id: string
  noi_dung_cau_hoi?: string
  noi_dung?: string
  cau_hoi?: string
  audio_url?: string | null
  passage?: string | null
  cac_lua_chon?: { key: string; value: string }[]
  dap_an?: Record<string, string> | null
  dap_an_dung: string | null
  giai_thich?: string
  goi_y_tra_loi?: string | null
  rubric?: string | null
  ky_nang: string
  loai_cau_hoi?: string
  so_phan?: number
  la_cau_ai_sinh?: boolean
}

interface ExamResult {
  diemSo: number
  tongSoCau: number
  phanTramDung: number
  diemQuyDoi?: number | null
  phanTichAi?: string | null
  chiTietCham?: { id: string; diem: number; nhanXet: string }[]
  [key: string]: unknown
}

interface Props {
  loaiChungChi: string
  kyNang: string
  mode: Mode
  onFinish: () => void
}

// ─── Design tokens ────────────────────────────────────────────────────────────
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
  red:      '#EF4444',
  slate:    '#64748B',
  border:   'rgba(201,168,76,0.18)',
  borderMd: 'rgba(201,168,76,0.30)',
  text:     '#1A1E2E',
  textMid:  '#4A5568',
  textLt:   '#94A3B8',
}

const CERT_COLOR: Record<string, string> = {
  TOEIC: C.green,
  VSTEP: C.blue,
  APTIS: C.violet,
}

const SCORE_LABEL: Record<string, (d: number | null | undefined) => string> = {
  TOEIC: d => d ? `~${d} TOEIC points` : '',
  VSTEP: d => d ? `~${d}/10 VSTEP`     : '',
  APTIS: d => d ? `~${d}/50 APTIS`     : '',
}

const SKILL_COLOR: Record<string, string> = {
  NGHE:     '#2B6CB0',
  NOI:      '#6478F0',
  DOC:      '#00A878',
  VIET:     '#C9A84C',
  NGU_PHAP: '#F06464',
}
const SKILL_ICON: Record<string, React.ElementType> = {
  NGHE: Headphones, NOI: Mic, DOC: BookOpen, VIET: PenLine, NGU_PHAP: FileText,
}
const SKILL_LABEL_EN: Record<string, string> = {
  NGHE: 'Listening', NOI: 'Speaking', DOC: 'Reading', VIET: 'Writing', NGU_PHAP: 'Language Use',
}

const TIME_LIMIT: Record<string, number> = {
  quick:    600,
  NGHE:    2700,
  NOI:     1200,
  DOC:     3300,
  VIET:    3600,
  NGU_PHAP:2700,
}

const DEFAULT_RUBRIC: Record<string, string> = {
  NOI: `Speaking criteria:
• Pronunciation & stress (25%) — clear, natural
• Vocabulary (25%) — appropriate, varied
• Grammar (25%) — accurate, correct structures
• Coherence & fluency (25%) — fully developed response, minimal hesitation`,
  VIET: `Writing criteria:
• Content (30%) — addresses the task fully
• Vocabulary (25%) — rich and accurate
• Grammar (25%) — correct, varied sentence structures
• Organisation & cohesion (20%) — clear intro–body–conclusion, logical linking`,
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  .fade-in { animation: fadeUp .45s cubic-bezier(.16,1,.3,1) both; }
  .mcq-opt { transition: all .22s cubic-bezier(.16,1,.3,1); }
  .mcq-opt:hover { transform: translateY(-2px); }
  .mcq-grid { display: flex; flex-direction: column; gap: 10px; }
  .reading-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  @media (max-width: 800px) {
    .reading-grid { grid-template-columns: 1fr; }
    .topbar-cert { display: none !important; }
  }
  .passage-box { max-height: 480px; overflow-y: auto; }
  .writing-criteria-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .speaking-criteria-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  @media (max-width: 640px) {
    .writing-criteria-grid { grid-template-columns: 1fr !important; }
    .speaking-criteria-grid { grid-template-columns: repeat(2,1fr) !important; }
    .result-score-grid { grid-template-columns: repeat(2,1fr) !important; }
  }
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Unescape literal \n sequences that Gemini sometimes returns in JSON strings.
 * Also strips metadata bracket prefixes like [VSTEP READING – Part 1].
 */
function cleanText(str: string): string {
  if (!str) return ''
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/^\[.*?\]\s*/gm, '')   // xoá [bracket prefix] ở đầu mỗi dòng
    .replace(/^\(.*?\)\s*/gm, '')   // xoá (paren prefix) ở đầu mỗi dòng
    .trim()
}

function normalize(q: Question) {
  const noiDung = cleanText(q.noi_dung_cau_hoi || q.noi_dung || '')
  const cauHoi  = cleanText(q.cau_hoi || '')
  const full    = cauHoi ? `${noiDung}\n\n${cauHoi}`.trim() : noiDung
  const choices: { key: string; value: string }[] =
    q.cac_lua_chon ??
    (q.dap_an ? Object.entries(q.dap_an).map(([k, v]) => ({ key: k, value: v })) : [])
  return { text: full, choices }
}

function formatTime(s: number) {
  const abs = Math.abs(s)
  const mm  = Math.floor(abs / 60).toString().padStart(2, '0')
  const ss  = (abs % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

function countWords(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0
}

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

function CertBadge({ loai }: { loai: string }) {
  const color = CERT_COLOR[loai] ?? C.slate
  return (
    <span style={{
      padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
      background: `${color}12`, color, border: `1px solid ${color}28`,
      letterSpacing: '.04em', fontFamily: "'DM Sans', sans-serif",
    }}>{loai}</span>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AudioPlayer({ src, ttsText, color }: { src?: string | null; ttsText?: string; color: string }) {
  const [playing, setPlaying]   = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [plays, setPlays]       = useState(0)
  const MAX_PLAYS = 2
  const audioRef  = useRef<HTMLAudioElement | null>(null)
  const usingTTS  = !src

  useEffect(() => {
    if (!src) return
    const a = new Audio(src)
    audioRef.current = a
    a.addEventListener('timeupdate',     () => setProgress(a.currentTime))
    a.addEventListener('loadedmetadata', () => setDuration(a.duration))
    a.addEventListener('ended',          () => setPlaying(false))
    return () => { a.pause(); a.src = '' }
  }, [src])

  useEffect(() => () => { window.speechSynthesis?.cancel() }, [])

  const togglePlay = () => {
    if (usingTTS) {
      if (playing) { window.speechSynthesis.cancel(); setPlaying(false); return }
      if (plays >= MAX_PLAYS) { toast('Maximum 2 plays reached', { icon: '🔒' }); return }
      if (!ttsText) return
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(ttsText)
      utter.lang = 'en-US'; utter.rate = 0.92
      utter.onstart = () => setPlaying(true)
      utter.onend   = () => { setPlaying(false); setPlays(p => p + 1) }
      window.speechSynthesis.speak(utter)
      return
    }
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false); return }
    if (plays >= MAX_PLAYS) { toast('Maximum 2 plays reached', { icon: '🔒' }); return }
    a.play(); setPlaying(true); setPlays(p => p + 1)
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div style={{ background: `${color}08`, border: `1.5px solid ${color}25`, borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button
          onClick={togglePlay}
          disabled={plays >= MAX_PLAYS && !playing}
          style={{ width: 44, height: 44, borderRadius: '50%', background: plays >= MAX_PLAYS && !playing ? C.slate : color, border: 'none', cursor: plays >= MAX_PLAYS && !playing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: plays >= MAX_PLAYS && !playing ? 'none' : `0 6px 18px ${color}40` }}
        >
          {playing
            ? <Square size={16} strokeWidth={2.5} color="#fff" fill="#fff" />
            : <Play   size={16} strokeWidth={2.5} color="#fff" fill="#fff" />}
        </button>
        <div style={{ flex: 1, minWidth: 140 }}>
          {usingTTS ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
              {playing ? '🔊 Playing (text-to-speech)...' : 'Text-to-speech audio'}
            </div>
          ) : (
            <>
              <div style={{ height: 6, background: `${color}20`, borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .3s linear' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textMid, fontVariantNumeric: 'tabular-nums' }}>
                <span>{formatTime(Math.floor(progress))}</span>
                <span>{formatTime(Math.floor(duration))}</span>
              </div>
            </>
          )}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: plays >= MAX_PLAYS ? C.rose : C.textMid, flexShrink: 0, textAlign: 'right' }}>
          {plays}/{MAX_PLAYS}<br /><span style={{ fontWeight: 500, fontSize: 12 }}>plays</span>
        </div>
      </div>
      {usingTTS && (
        <div style={{ marginTop: 10, fontSize: 12, color: C.textMid, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={13} strokeWidth={2} /> No audio file available — using text-to-speech instead.
        </div>
      )}
    </div>
  )
}

function SpeakingRecorder({ value, onChange, color }: { value: string; onChange: (v: string) => void; color: string }) {
  const [recording, setRecording]       = useState(false)
  const [hasRecording, setHasRecording] = useState(false)
  const [audioUrl, setAudioUrl]         = useState<string | null>(null)
  const [transcript, setTranscript]     = useState(value)
  const mediaRef  = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        setHasRecording(true)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      setRecording(true)
    } catch {
      toast.error('Cannot access microphone. Please check browser permissions.')
    }
  }

  const stopRec = () => { mediaRef.current?.stop(); setRecording(false) }

  const handleTranscript = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: recording ? '#FEF2F2' : `${color}07`, border: `1.5px solid ${recording ? C.rose : color + '20'}`, borderRadius: 16, padding: '20px', textAlign: 'center' }}>
        <button
          onClick={recording ? stopRec : startRec}
          style={{ width: 64, height: 64, borderRadius: '50%', background: recording ? C.rose : color, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, transition: 'transform .2s', transform: recording ? 'scale(1.1)' : 'scale(1)', boxShadow: `0 8px 22px ${recording ? C.rose : color}40` }}
        >
          {recording
            ? <Square size={24} strokeWidth={2.5} color="#fff" fill="#fff" />
            : <Mic    size={24} strokeWidth={2}   color="#fff" />}
        </button>
        <div style={{ fontSize: 15, fontWeight: 700, color: recording ? C.rose : C.navy }}>
          {recording ? '🔴 Recording — tap to stop' : hasRecording ? 'Re-record' : 'Tap to start speaking'}
        </div>
        {!recording && !hasRecording && (
          <div style={{ fontSize: 13, color: C.textMid, marginTop: 4, fontWeight: 500 }}>The browser will ask for microphone permission</div>
        )}
      </div>

      {hasRecording && audioUrl && (
        <div style={{ background: `${C.green}08`, border: `1.5px solid ${C.green}30`, borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <CheckCircle2 size={20} strokeWidth={2} color={C.green} />
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>Recording complete</div>
          <audio controls src={audioUrl} style={{ height: 32, flex: '2 1 200px' }} />
        </div>
      )}

      <div>
        <div style={{ fontSize: 13, color: C.textMid, marginBottom: 6, fontWeight: 700 }}>
          Notes / draft <span style={{ fontWeight: 500, color: C.textLt }}>(optional)</span>
        </div>
        <textarea
          placeholder="Write down what you plan to say..."
          value={transcript}
          onChange={handleTranscript}
          rows={3}
          aria-label="Speaking notes"
          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, lineHeight: 1.7, resize: 'vertical', fontFamily: "'DM Sans', sans-serif", color: C.text, outline: 'none', background: C.white }}
        />
      </div>
    </div>
  )
}

function ReadingLayout({ passage, children, color }: { passage: string; children: React.ReactNode; color: string }) {
  return (
    <div className="reading-grid" style={{ marginBottom: 24 }}>
      <Panel style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={16} color={color} strokeWidth={1.8} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '.06em' }}>Passage</span>
        </div>
        <div className="passage-box" style={{ padding: '20px 22px', fontSize: 16, lineHeight: 1.9, color: C.text, whiteSpace: 'pre-line' }}>
          {passage}
        </div>
      </Panel>
      <div>{children}</div>
    </div>
  )
}

function WritingArea({ value, onChange, minWords = 80, placeholder, color }: { value: string; onChange: (v: string) => void; minWords?: number; placeholder?: string; color: string }) {
  const wc = countWords(value)
  const ok = wc >= minWords
  return (
    <div style={{ background: C.white, borderRadius: 24, border: `2px solid ${ok ? C.green + '60' : C.border}`, overflow: 'hidden', boxShadow: '0 2px 16px rgba(15,28,53,.07)', transition: 'border-color .3s', marginBottom: 28 }}>
      <div style={{ padding: '12px 20px', background: C.bg, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '.06em' }}>Your Response</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 15, fontWeight: 700, color: ok ? C.green : C.textMid }}>{wc} words</span>
      </div>
      <textarea
        placeholder={placeholder ?? 'Write your response here...'}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={11}
        aria-label="Writing response"
        style={{ width: '100%', padding: '22px 24px', fontSize: 16, color: C.text, lineHeight: 1.85, background: 'transparent', border: 'none', resize: 'vertical', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
      />
      <div style={{ padding: '12px 20px', background: C.bg, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 6, background: `${C.navy}08`, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, width: `${Math.min((wc / minWords) * 100, 100)}%`, background: ok ? C.green : color, transition: 'width .3s' }} />
        </div>
        {ok
          ? <span style={{ fontSize: 14, fontWeight: 700, color: C.green, whiteSpace: 'nowrap' }}>✓ Minimum word count met</span>
          : <span style={{ fontSize: 14, color: color, fontWeight: 600, whiteSpace: 'nowrap' }}>{minWords - wc} more words required</span>
        }
      </div>
    </div>
  )
}

function RubricPanel({ rubric, color }: { rubric: string; color: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color, fontSize: 14, fontWeight: 700, padding: 0, fontFamily: "'DM Sans', sans-serif" }}>
        <Award size={16} strokeWidth={2} />
        Scoring Criteria
        {open ? <ChevronUp size={15} strokeWidth={2.5} /> : <ChevronDown size={15} strokeWidth={2.5} />}
      </button>
      {open && (
        <div style={{ marginTop: 10, padding: '14px 16px', background: `${color}08`, border: `1px solid ${color}25`, borderRadius: 12, fontSize: 14, color: C.text, lineHeight: 1.8, whiteSpace: 'pre-line', fontWeight: 500 }}>
          {rubric}
        </div>
      )}
    </div>
  )
}

function SkillIntro({ kyNang, loaiChungChi, mode, onStart }: { kyNang: string; loaiChungChi: string; mode: Mode; onStart: () => void }) {
  const color = SKILL_COLOR[kyNang] ?? C.navy
  const Icon  = SKILL_ICON[kyNang] ?? FileText

  const info: Record<string, { title: string; desc: string; tips: string[] }> = {
    NGHE: {
      title: 'Listening Section',
      desc:  'Listen to the audio and answer the questions. Each clip can be played a maximum of 2 times.',
      tips:  [
        'Read the questions BEFORE pressing play',
        'Listen for key words — numbers, names, places, times',
        "You don't need 100% understanding — use context for missed parts",
      ],
    },
    NOI: {
      title: 'Speaking Section',
      desc:  'Record your spoken response. Make sure your microphone is working before you begin.',
      tips:  [
        'Prepare your ideas for 15–20 seconds before speaking',
        "Speak clearly and confidently — it doesn't need to be perfect",
        'Use linking words: "First", "However", "In conclusion"',
      ],
    },
    DOC: {
      title: 'Reading Section',
      desc:  'Read the passage on the left and answer the questions on the right.',
      tips:  [
        'Read the questions first, then locate the information',
        'Skim for the main idea, scan for details',
        'Watch for negatives: "not", "except", "unlikely"',
      ],
    },
    VIET: {
      title: 'Writing Section',
      desc:  'Write a response to the prompt. Pay attention to word count and required format.',
      tips:  [
        'Read the prompt carefully — formal or informal?',
        'Sketch a quick outline before writing',
        'Proofread grammar and spelling before submitting',
      ],
    },
    NGU_PHAP: {
      title: 'Language Use Section',
      desc:  'Choose the correct option to complete each sentence or passage.',
      tips:  [
        'Identify the part of speech required (noun, verb, adverb...)',
        'Watch verb tenses and subject-verb agreement',
        'Eliminate clearly wrong options first',
      ],
    },
  }

  const d = info[kyNang] ?? info.NGU_PHAP

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', paddingTop: 40, fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning>{GLOBAL_CSS}</style>
      <div style={{ background: C.white, borderRadius: 24, border: `1.5px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 4px 24px rgba(15,28,53,.07)' }}>
        <div style={{ background: C.navy, padding: '32px 32px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: `${color}18`, borderRadius: '60% 40% 30% 70%', filter: 'blur(20px)' }} />
          <div style={{ width: 64, height: 64, borderRadius: 16, background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', position: 'relative' }}>
            <Icon size={28} color={color} strokeWidth={1.8} />
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6, position: 'relative' }}>{d.title}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', lineHeight: 1.6, position: 'relative' }}>{d.desc}</div>
        </div>
        <div style={{ padding: '24px 32px 28px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Tips</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {d.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${color}15`, color, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, border: `1px solid ${color}28` }}>{i + 1}</span>
                <span style={{ fontSize: 14, color: C.text, lineHeight: 1.6, fontWeight: 500 }}>{tip}</span>
              </div>
            ))}
          </div>
          <button
            onClick={onStart}
            style={{ width: '100%', padding: '15px', background: color, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 50, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: `0 8px 24px ${color}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Send size={16} strokeWidth={2.2} /> Begin Section
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ExamSession({ loaiChungChi, kyNang, mode, onFinish }: Props) {
  const [questions,   setQuestions]   = useState<Question[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showIntro,   setShowIntro]   = useState(true)
  const [currentIdx,  setCurrentIdx]  = useState(0)
  const [answers,     setAnswers]     = useState<Record<string, string>>({})
  const [submitted,   setSubmitted]   = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [result,      setResult]      = useState<ExamResult | null>(null)
  const [timeLeft,    setTimeLeft]    = useState<number>(
    mode === 'quick' ? TIME_LIMIT.quick : (TIME_LIMIT[kyNang] ?? 1800)
  )
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const color = SKILL_COLOR[kyNang] ?? C.navy
  const Icon  = SKILL_ICON[kyNang] ?? FileText

  // ── Fetch questions ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/exam?loai=${loaiChungChi}&kyNang=${kyNang}&mode=${mode}`)
      .then(r => r.json())
      .then(data => { setQuestions(data.questions || []); setLoading(false) })
      .catch(() => { toast.error('Could not load questions'); setLoading(false) })
  }, [loaiChungChi, kyNang, mode])

  // ── Countdown ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (showIntro || submitted || loading) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIntro, submitted, loading])

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submitting) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSubmitting(true)
    try {
      const answerList = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }))
      const res = await fetch('/api/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loai_chung_chi: loaiChungChi, ky_nang: kyNang, mode, answers: answerList, questions }),
      })
      const data = await res.json()
      setResult(data as ExamResult)
      setSubmitted(true)
    } catch {
      toast.error('Submission failed, please try again')
    } finally {
      setSubmitting(false)
    }
  }, [answers, loaiChungChi, kyNang, mode, questions, submitting])

  const setAnswer = (id: string, val: string) =>
    setAnswers(prev => ({ ...prev, [id]: val }))

  const answered     = Object.keys(answers).length
  const total        = questions.length
  const progressPct  = total > 0 ? (answered / total) * 100 : 0
  const timerWarning = timeLeft < 120

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, fontFamily: "'DM Sans',sans-serif", gap: 16 }}>
        <style suppressHydrationWarning>{GLOBAL_CSS}</style>
        <div style={{ width: 48, height: 48, border: `3px solid ${color}30`, borderTop: `3px solid ${color}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: C.textMid, fontSize: 15, fontWeight: 600 }}>Loading questions...</div>
      </div>
    )
  }

  // ── No questions ─────────────────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingTop: 80, fontFamily: "'DM Sans',sans-serif" }}>
        <style suppressHydrationWarning>{GLOBAL_CSS}</style>
        <FileText size={48} color={C.textLt} strokeWidth={1.6} style={{ display: 'block', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>No questions yet</div>
        <div style={{ color: C.textMid, marginBottom: 24, fontSize: 15 }}>This section doesn't have enough questions in the bank yet.</div>
        <button onClick={onFinish} style={{ padding: '12px 28px', background: C.navy, color: '#fff', borderRadius: 50, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
          ← Back
        </button>
      </div>
    )
  }

  // ── Intro screen ─────────────────────────────────────────────────────────────
  if (showIntro) {
    return <SkillIntro kyNang={kyNang} loaiChungChi={loaiChungChi} mode={mode} onStart={() => setShowIntro(false)} />
  }

  // ── Result screen ─────────────────────────────────────────────────────────────
  if (submitted && result) {
    const pct        = result.phanTramDung || 0
    const emoji      = pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '📖'
    const scoreLabel = SCORE_LABEL[loaiChungChi]?.(result.diemQuyDoi)
    const scoreColor = pct >= 70 ? C.green : pct >= 50 ? C.gold : C.rose

    return (
      <div style={{ maxWidth: 800, margin: '0 auto', fontFamily: "'DM Sans',sans-serif", paddingBottom: 60 }}>
        <style suppressHydrationWarning>{GLOBAL_CSS}</style>

        {/* Score hero */}
        <div className="fade-in" style={{ textAlign: 'center', marginBottom: 28, padding: '40px 36px', background: C.navy, borderRadius: 28, color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 56px rgba(15,28,53,.22)' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 260, height: 260, background: `${scoreColor}10`, borderRadius: '60% 40% 30% 70%', pointerEvents: 'none', filter: 'blur(24px)' }} />
          <div style={{ fontSize: 52, marginBottom: 10, position: 'relative' }}>{emoji}</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1, position: 'relative' }}>{pct}%</div>
          <div style={{ color: 'rgba(255,255,255,.5)', marginTop: 10, fontSize: 14, fontWeight: 500, position: 'relative' }}>
            {result.diemSo}/{result.tongSoCau} correct
          </div>
          {scoreLabel && (
            <div style={{ marginTop: 14, display: 'inline-block', padding: '6px 18px', background: `${C.gold}25`, border: `1px solid ${C.gold}45`, borderRadius: 50, color: C.goldLt, fontSize: 14, fontWeight: 700, position: 'relative' }}>
              {scoreLabel}
            </div>
          )}
        </div>

        {/* AI analysis */}
        {result.phanTichAi && result.phanTichAi.trim() !== '' && (
          <Panel style={{ marginBottom: 22, background: `${C.violet}07`, border: `1px solid ${C.violet}22` }}>
            <SectionHeader icon={Brain} title="AI Analysis" color={C.violet} />
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.85, whiteSpace: 'pre-line', fontWeight: 500 }}>{result.phanTichAi}</div>
          </Panel>
        )}

        {/* Per-question detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {questions.map((q, i) => {
            const { text } = normalize(q)
            const userAns   = answers[q.id]
            const chamDiem  = result.chiTietCham?.find(c => c.id === q.id)
            const isCorrect = q.dap_an_dung === null ? null : userAns === q.dap_an_dung
            const borderColor = isCorrect === null ? `${C.slate}30` : isCorrect ? `${C.green}35` : `${C.rose}35`
            const bgColor     = isCorrect === null ? '#F8F8F8'       : isCorrect ? `${C.green}08`  : `${C.rose}08`
            const iconColor   = isCorrect === null ? C.slate          : isCorrect ? C.green         : C.rose
            const StatusIcon  = isCorrect === null ? MinusCircle      : isCorrect ? CheckCircle2    : XCircle

            return (
              <div key={q.id} style={{ padding: '18px 20px', borderRadius: 16, border: `2px solid ${borderColor}`, background: bgColor }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${iconColor}15`, border: `1px solid ${iconColor}30` }}>
                    <StatusIcon size={14} color={iconColor} strokeWidth={2.2} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 6, lineHeight: 1.5 }}>
                      Q{i + 1}. {text.length > 120 ? text.slice(0, 120) + '…' : text}
                    </div>
                    {isCorrect === false && (
                      <div style={{ fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
                        <span style={{ color: C.rose }}>Your answer: {userAns || 'Skipped'}</span>
                        {' · '}
                        <span style={{ color: C.green, fontWeight: 700 }}>Correct: {q.dap_an_dung}</span>
                      </div>
                    )}
                    {chamDiem && (
                      <div style={{ fontSize: 13, color: C.violet, marginTop: 4, fontWeight: 700 }}>
                        Score: {chamDiem.diem}/10
                        {chamDiem.nhanXet && <span style={{ fontWeight: 500, color: C.textMid }}> — {chamDiem.nhanXet}</span>}
                      </div>
                    )}
                    {q.giai_thich && (
                      <div style={{ fontSize: 13, color: C.textMid, marginTop: 6, lineHeight: 1.6, display: 'flex', gap: 6, fontWeight: 500 }}>
                        <Lightbulb size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                        {q.giai_thich}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={onFinish} style={{ flex: 1, minWidth: 160, padding: '14px', border: `2px solid ${C.border}`, color: C.navy, fontWeight: 700, borderRadius: 50, background: C.white, cursor: 'pointer', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
            ← Choose another section
          </button>
          <button
            onClick={() => {
              setSubmitted(false); setAnswers({}); setCurrentIdx(0); setResult(null)
              setShowIntro(true)
              setTimeLeft(mode === 'quick' ? TIME_LIMIT.quick : (TIME_LIMIT[kyNang] ?? 1800))
            }}
            style={{ flex: 1, minWidth: 160, padding: '14px', background: color, color: '#fff', fontWeight: 700, borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxShadow: `0 6px 18px ${color}40` }}>
            <RotateCcw size={15} strokeWidth={2.2} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Retake
          </button>
        </div>
      </div>
    )
  }

  // ── Exam screen ───────────────────────────────────────────────────────────────
  const q = questions[currentIdx]
  const { text, choices } = normalize(q)
  const isOpenEnded = choices.length === 0
  const isNoi  = kyNang === 'NOI'
  const isViet = kyNang === 'VIET'
  const isDoc  = kyNang === 'DOC'
  const rubric = q.rubric ?? DEFAULT_RUBRIC[kyNang] ?? null

  const questionContent = (
    <>
      {/* Question card */}
      <Panel style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: C.textMid, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span>Question {currentIdx + 1}</span>
          {q.so_phan && mode === 'full' && <span style={{ color: C.gold }}>· Part {q.so_phan}</span>}
          {q.la_cau_ai_sinh && <span style={{ color: C.violet }}>· AI-generated</span>}
        </div>
        {/* whiteSpace: pre-line renders real \n characters correctly */}
        <div style={{ fontSize: 16, fontWeight: 500, color: C.text, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {text}
        </div>
      </Panel>

      {/* Audio player for NGHE */}
      {kyNang === 'NGHE' && (
        <AudioPlayer src={q.audio_url} ttsText={text} color={color} />
      )}

      {/* Rubric */}
      {rubric && <RubricPanel rubric={rubric} color={color} />}

      {/* Multiple choice */}
      {!isOpenEnded && (
        <div className="mcq-grid" style={{ marginBottom: 28 }}>
          {choices.map(opt => {
            const selected = answers[q.id] === opt.key
            return (
              <button key={opt.key} className="mcq-opt"
                onClick={() => setAnswer(q.id, opt.key)}
                style={{ width: '100%', textAlign: 'left', padding: '14px 20px', borderRadius: 14, border: `2px solid ${selected ? color : C.border}`, background: selected ? `${color}0D` : C.white, fontWeight: selected ? 700 : 400, fontSize: 15, cursor: 'pointer', color: selected ? color : C.text, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: selected ? color : '#F0F0EA', color: selected ? '#fff' : C.textMid, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {opt.key}
                </span>
                {opt.value}
              </button>
            )
          })}
        </div>
      )}

      {/* Speaking */}
      {isOpenEnded && isNoi && (
        <div style={{ marginBottom: 28 }}>
          <SpeakingRecorder value={answers[q.id] || ''} onChange={val => setAnswer(q.id, val)} color={color} />
        </div>
      )}

      {/* Writing */}
      {isOpenEnded && isViet && (
        <WritingArea
          value={answers[q.id] || ''}
          onChange={val => setAnswer(q.id, val)}
          minWords={80}
          placeholder="Write your response here. Pay attention to the required format (email, paragraph, essay)..."
          color={color}
        />
      )}

      {/* Other open-ended */}
      {isOpenEnded && !isNoi && !isViet && (
        <div style={{ marginBottom: 28 }}>
          <textarea
            placeholder="Enter your answer..."
            value={answers[q.id] || ''}
            onChange={e => setAnswer(q.id, e.target.value)}
            rows={5}
            aria-label="Answer"
            style={{ width: '100%', padding: '16px', borderRadius: 14, border: `2px solid ${C.border}`, fontSize: 15, lineHeight: 1.7, resize: 'vertical', fontFamily: "'DM Sans',sans-serif", color: C.text, outline: 'none' }}
          />
          {q.goi_y_tra_loi && (
            <div style={{ marginTop: 10, padding: '12px 16px', background: `${color}08`, borderRadius: 12, fontSize: 13, color: C.text, border: `1px solid ${color}20`, fontWeight: 500, display: 'flex', gap: 8 }}>
              <Lightbulb size={15} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              Hint: {cleanText(q.goi_y_tra_loi)}
            </div>
          )}
        </div>
      )}
    </>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning>{GLOBAL_CSS}</style>

      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(248,245,238,.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, boxShadow: '0 2px 16px rgba(15,28,53,.06)' }}>
        <div style={{ maxWidth: isDoc ? 1100 : 760, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <button onClick={onFinish} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMid, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
            <ArrowLeft size={15} strokeWidth={2.2} /> Exit
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={16} color={color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{SKILL_LABEL_EN[kyNang] ?? kyNang}</div>
              <div className="topbar-cert" style={{ fontSize: 12, color: C.textMid, fontWeight: 600 }}>
                {currentIdx + 1} / {total} · <CertBadge loai={loaiChungChi} />
                {mode === 'full' && <span style={{ fontWeight: 700, color: C.gold }}> · FULL</span>}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: C.textLt, fontWeight: 600 }}>Time left</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontVariantNumeric: 'tabular-nums', color: timerWarning ? C.rose : color, fontWeight: 800, fontSize: 18, transition: 'color .5s' }}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ maxWidth: isDoc ? 1100 : 760, margin: '0 auto', padding: '0 20px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 4, background: `${C.navy}08`, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: color, width: `${progressPct}%`, transition: 'width .4s' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.textMid, fontVariantNumeric: 'tabular-nums' }}>{answered}/{total} answered</span>
        </div>
      </div>

      <div style={{ maxWidth: isDoc ? 1100 : 760, margin: '0 auto', padding: '24px 20px 120px' }}>
        {isDoc && q.passage ? (
          <ReadingLayout passage={cleanText(q.passage)} color={color}>
            {questionContent}
          </ReadingLayout>
        ) : (
          questionContent
        )}

        {/* Page dots */}
        {total <= 20 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4 }}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                style={{ width: 32, height: 32, borderRadius: 9, fontSize: 12, fontWeight: 700, border: i === currentIdx ? `2px solid ${color}` : `1px solid ${C.border}`, background: i === currentIdx ? color : answers[questions[i].id] ? `${color}15` : C.white, color: i === currentIdx ? '#fff' : answers[questions[i].id] ? color : C.textMid, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
        {total > 20 && (
          <div style={{ textAlign: 'center', fontSize: 14, color: C.textMid, fontWeight: 600, marginBottom: 4 }}>
            <strong style={{ color: C.navy }}>{currentIdx + 1}</strong> / {total}
          </div>
        )}

        {/* Submit early */}
        {answered >= Math.ceil(total / 2) && currentIdx < total - 1 && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 50, padding: '8px 22px', fontSize: 13, color: C.textMid, cursor: 'pointer', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
              Submit early ({answered}/{total} answered)
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'rgba(248,245,238,.96)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${C.border}`, padding: '12px 20px', boxShadow: '0 -4px 24px rgba(15,28,53,.08)' }}>
        <div style={{ maxWidth: isDoc ? 1100 : 760, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            style={{ padding: '11px 20px', border: `2px solid ${C.border}`, borderRadius: 50, color: C.textMid, background: C.white, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, opacity: currentIdx === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}
          >
            <ArrowLeft size={15} strokeWidth={2.2} /> Back
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg, borderRadius: 50, padding: '10px 18px', border: `1px solid ${C.border}`, minWidth: 0 }}>
            <span style={{ fontSize: 12, color: C.textLt, fontWeight: 600, whiteSpace: 'nowrap' }}>Q{currentIdx + 1}/{total}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginLeft: 8 }}>
              {answers[q.id] ? '✓ Answered' : 'Not answered'}
            </span>
          </div>

          {currentIdx < total - 1 ? (
            <button onClick={() => setCurrentIdx(currentIdx + 1)}
              style={{ padding: '11px 26px', background: C.navy, color: '#fff', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
              Next <ArrowRight size={15} strokeWidth={2.2} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={answered === 0 || submitting}
              style={{ padding: '11px 26px', background: answered === 0 ? `${C.navy}18` : C.green, color: answered === 0 ? C.textLt : '#fff', borderRadius: 50, border: 'none', cursor: answered === 0 ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, opacity: submitting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, fontFamily: "'DM Sans', sans-serif", boxShadow: answered === 0 ? 'none' : `0 6px 18px ${C.green}40` }}>
              {submitting ? 'Submitting...' : <><Send size={14} strokeWidth={2.2} /> Submit</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}