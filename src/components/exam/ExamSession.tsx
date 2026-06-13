'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
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

// ─── Constants ────────────────────────────────────────────────────────────────
const C = {
  navy:    '#0F1C35',
  gold:    '#C9A84C',
  green:   '#00A878',
  violet:  '#6478F0',
  red:     '#EF4444',
  white:   '#FFFFFF',
  bg:      '#F8F5EE',
  surface: '#FAFAF7',
  border:  '#E8E8E0',
  text:    '#0D0D0D',
  textMid: '#4A5568',
  textLt:  '#94A3B8',
  slate:   '#64748B',
}

const CERT_COLOR: Record<string, string> = {
  TOEIC: C.green,
  VSTEP: '#185FA5',
  APTIS: C.violet,
}

const SCORE_LABEL: Record<string, (d: number | null | undefined) => string> = {
  TOEIC: d => d ? `~${d} điểm TOEIC` : '',
  VSTEP: d => d ? `~${d}/10 VSTEP`   : '',
  APTIS: d => d ? `~${d}/50 APTIS`   : '',
}

// Countdown limits per mode/skill (seconds)
const TIME_LIMIT: Record<string, number> = {
  quick:   600,   // 10 min
  NGHE:    2700,  // 45 min
  NOI:     1200,  // 20 min
  DOC:     3300,  // 55 min
  VIET:    3600,  // 60 min
  NGU_PHAP:2700,  // 45 min
}

// Rubric defaults
const DEFAULT_RUBRIC: Record<string, string> = {
  NOI: `Tiêu chí chấm điểm Nói:
• Phát âm & trọng âm (25%) — rõ ràng, tự nhiên
• Từ vựng (25%) — phù hợp, đa dạng
• Ngữ pháp (25%) — chính xác, đúng cấu trúc
• Mạch lạc & lưu loát (25%) — trả lời đầy đủ ý, không ngập ngừng quá nhiều`,
  VIET: `Tiêu chí chấm điểm Viết:
• Nội dung (30%) — trả lời đúng yêu cầu, đủ ý
• Từ vựng (25%) — phong phú, chính xác
• Ngữ pháp (25%) — cấu trúc câu đúng, đa dạng
• Bố cục & mạch lạc (20%) — có mở–thân–kết, liên kết ý rõ`,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalize(q: Question) {
  const noiDung = q.noi_dung_cau_hoi || q.noi_dung || ''
  const cauHoi  = q.cau_hoi || ''
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

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Audio player for listening questions */
function AudioPlayer({ src }: { src: string }) {
  const [playing, setPlaying]   = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [plays, setPlays]       = useState(0)
  const MAX_PLAYS = 2
  const audioRef  = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const a = new Audio(src)
    audioRef.current = a
    a.addEventListener('timeupdate',  () => setProgress(a.currentTime))
    a.addEventListener('loadedmetadata', () => setDuration(a.duration))
    a.addEventListener('ended', () => { setPlaying(false) })
    return () => { a.pause(); a.src = '' }
  }, [src])

  const togglePlay = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false); return }
    if (plays >= MAX_PLAYS) { toast('Đã nghe tối đa 2 lần', { icon: '🔒' }); return }
    a.play()
    setPlaying(true)
    setPlays(p => p + 1)
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div style={{ background: '#F0F8F5', border: `1.5px solid ${C.green}30`, borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={togglePlay} style={{ width: 44, height: 44, borderRadius: '50%', background: plays >= MAX_PLAYS ? C.slate : C.green, border: 'none', cursor: plays >= MAX_PLAYS ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${playing ? 'ti-player-pause' : 'ti-player-play'}`} style={{ fontSize: 18, color: '#fff' }} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 6, background: '#D1EAE3', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: C.green, borderRadius: 99, transition: 'width .3s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textMid }}>
            <span>{formatTime(Math.floor(progress))}</span>
            <span>{formatTime(Math.floor(duration))}</span>
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: plays >= MAX_PLAYS ? C.red : C.slate, flexShrink: 0, textAlign: 'right' }}>
          {plays}/{MAX_PLAYS}<br />
          <span style={{ fontWeight: 400 }}>lần nghe</span>
        </div>
      </div>
    </div>
  )
}

/** Speaking recorder */
function SpeakingRecorder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [recording, setRecording]     = useState(false)
  const [hasRecording, setHasRecording] = useState(false)
  const [audioUrl, setAudioUrl]       = useState<string | null>(null)
  const [transcript, setTranscript]   = useState(value)
  const mediaRef   = useRef<MediaRecorder | null>(null)
  const chunksRef  = useRef<Blob[]>([])

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url  = URL.createObjectURL(blob)
        setAudioUrl(url)
        setHasRecording(true)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      setRecording(true)
    } catch {
      toast.error('Không thể truy cập microphone. Hãy kiểm tra quyền trình duyệt.')
    }
  }

  const stopRec = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  const handleTranscript = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Recorder */}
      <div style={{ background: recording ? '#FFF5F5' : '#F8F5EE', border: `1.5px solid ${recording ? C.red : C.border}`, borderRadius: 16, padding: '20px', textAlign: 'center' }}>
        <button
          onClick={recording ? stopRec : startRec}
          style={{ width: 64, height: 64, borderRadius: '50%', background: recording ? C.red : C.navy, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, transition: 'transform .2s', transform: recording ? 'scale(1.1)' : 'scale(1)' }}
        >
          <i className={`ti ${recording ? 'ti-player-stop' : 'ti-microphone'}`} style={{ fontSize: 24, color: '#fff' }} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: recording ? C.red : C.navy }}>
          {recording ? '🔴 Đang ghi âm — nhấn để dừng' : hasRecording ? 'Ghi âm lại' : 'Nhấn để bắt đầu nói'}
        </div>
        {!recording && !hasRecording && (
          <div style={{ fontSize: 12, color: C.textLt, marginTop: 4 }}>Trình duyệt sẽ xin quyền microphone</div>
        )}
      </div>

      {/* Playback */}
      {hasRecording && audioUrl && (
        <div style={{ background: '#F0F8F5', border: `1.5px solid ${C.green}30`, borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="ti ti-circle-check" style={{ fontSize: 20, color: C.green }} />
          <div style={{ flex: 1, fontSize: 13, color: C.textMid }}>Đã ghi âm xong</div>
          <audio controls src={audioUrl} style={{ height: 32, flex: 2 }} />
        </div>
      )}

      {/* Optional transcript */}
      <div>
        <div style={{ fontSize: 12, color: C.textMid, marginBottom: 6, fontWeight: 600 }}>
          Ghi chú / bản nháp <span style={{ fontWeight: 400, color: C.textLt }}>(tuỳ chọn)</span>
        </div>
        <textarea
          placeholder="Ghi lại những gì bạn định nói..."
          value={transcript}
          onChange={handleTranscript}
          rows={3}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, lineHeight: 1.7, resize: 'vertical', fontFamily: "'DM Sans', sans-serif", color: C.text, outline: 'none', background: C.white }}
        />
      </div>
    </div>
  )
}

/** Reading passage + question split layout */
function ReadingLayout({ passage, children }: { passage: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: '20px 22px', maxHeight: 480, overflowY: 'auto', fontSize: 14, lineHeight: 1.85, color: C.text, whiteSpace: 'pre-line' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textLt, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Đoạn văn</div>
        {passage}
      </div>
      <div>{children}</div>
    </div>
  )
}

/** Writing answer area with word count */
function WritingArea({ value, onChange, minWords = 80, placeholder }: { value: string; onChange: (v: string) => void; minWords?: number; placeholder?: string }) {
  const wc = countWords(value)
  const ok = wc >= minWords
  return (
    <div style={{ marginBottom: 28 }}>
      <textarea
        placeholder={placeholder ?? 'Viết câu trả lời của bạn tại đây...'}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={8}
        style={{ width: '100%', padding: '16px', borderRadius: 14, border: `2px solid ${ok ? C.green + '60' : C.border}`, fontSize: 14, lineHeight: 1.8, resize: 'vertical', fontFamily: "'DM Sans', sans-serif", color: C.text, outline: 'none', background: C.white, transition: 'border-color .2s' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 12, color: ok ? C.green : C.textMid, fontWeight: 600 }}>
          {wc} từ {!ok && `(tối thiểu ${minWords} từ)`}
        </span>
        {ok && <span style={{ fontSize: 12, color: C.green }}>✓ Đủ độ dài</span>}
      </div>
    </div>
  )
}

/** Rubric panel */
function RubricPanel({ rubric }: { rubric: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.violet, fontSize: 13, fontWeight: 600, padding: 0 }}>
        <i className="ti ti-award" style={{ fontSize: 15 }} />
        Tiêu chí chấm điểm
        <i className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 13 }} />
      </button>
      {open && (
        <div style={{ marginTop: 10, padding: '14px 16px', background: '#F5F4FF', border: `1px solid ${C.violet}25`, borderRadius: 12, fontSize: 13, color: C.textMid, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {rubric}
        </div>
      )}
    </div>
  )
}

/** Skill intro card shown before first question */
function SkillIntro({ kyNang, loaiChungChi, mode, onStart }: { kyNang: string; loaiChungChi: string; mode: Mode; onStart: () => void }) {
  const certColor = CERT_COLOR[loaiChungChi] ?? C.navy

  const info: Record<string, { icon: string; title: string; desc: string; tips: string[] }> = {
    NGHE: {
      icon: 'ti-headphones',
      title: 'Phần thi Nghe',
      desc: 'Nghe audio và trả lời câu hỏi. Mỗi đoạn âm thanh được phát tối đa 2 lần.',
      tips: ['Đọc câu hỏi TRƯỚC khi bấm play', 'Chú ý từ khoá — số, tên, địa điểm, thời gian', 'Không cần hiểu 100%, đoán theo ngữ cảnh nếu bỏ lỡ'],
    },
    NOI: {
      icon: 'ti-microphone',
      title: 'Phần thi Nói',
      desc: 'Ghi âm câu trả lời của bạn. Đảm bảo microphone hoạt động trước khi bắt đầu.',
      tips: ['Chuẩn bị ý trong 15–20 giây trước khi nói', 'Nói rõ, đủ to — không cần hoàn hảo', 'Dùng từ nối: "First", "However", "In conclusion"'],
    },
    DOC: {
      icon: 'ti-book',
      title: 'Phần thi Đọc',
      desc: 'Đọc đoạn văn bên trái và trả lời câu hỏi bên phải.',
      tips: ['Đọc câu hỏi trước, sau đó tìm thông tin trong bài', 'Skim để lấy ý chính, scan để tìm chi tiết', 'Chú ý từ phủ định: "not", "except", "unlikely"'],
    },
    VIET: {
      icon: 'ti-pencil',
      title: 'Phần thi Viết',
      desc: 'Viết bài theo yêu cầu. Chú ý đủ số từ và đúng format.',
      tips: ['Đọc kỹ yêu cầu — formal hay informal?', 'Lên dàn ý nhanh trước khi viết', 'Kiểm tra lại ngữ pháp và chính tả trước khi nộp'],
    },
    NGU_PHAP: {
      icon: 'ti-list-check',
      title: 'Phần thi Ngữ pháp',
      desc: 'Chọn đáp án đúng điền vào chỗ trống hoặc hoàn thành đoạn văn.',
      tips: ['Xác định từ loại cần điền (danh từ, động từ, trạng từ...)', 'Chú ý thì của động từ và sự hoà hợp chủ-vị', 'Loại trừ các đáp án rõ sai trước'],
    },
  }

  const d = info[kyNang] ?? info.NGU_PHAP

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', paddingTop: 40, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: C.white, borderRadius: 24, border: `1.5px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 4px 24px rgba(15,28,53,.07)' }}>
        <div style={{ background: certColor, padding: '32px 32px 28px', textAlign: 'center' }}>
          <i className={`ti ${d.icon}`} style={{ fontSize: 40, color: '#fff', display: 'block', marginBottom: 12 }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{d.title}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', lineHeight: 1.6 }}>{d.desc}</div>
        </div>
        <div style={{ padding: '24px 32px 28px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textLt, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>Mẹo làm bài</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {d.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${certColor}15`, color: certColor, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                <span style={{ fontSize: 14, color: C.textMid, lineHeight: 1.55 }}>{tip}</span>
              </div>
            ))}
          </div>
          <button
            onClick={onStart}
            style={{ width: '100%', padding: '14px', background: certColor, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            Bắt đầu làm bài →
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
  const certColor = CERT_COLOR[loaiChungChi] ?? C.navy

  // ── Fetch questions ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/exam?loai=${loaiChungChi}&kyNang=${kyNang}&mode=${mode}`)
      .then(r => r.json())
      .then(data => { setQuestions(data.questions || []); setLoading(false) })
      .catch(() => { toast.error('Không thể tải câu hỏi'); setLoading(false) })
  }, [loaiChungChi, kyNang, mode])

  // ── Countdown timer (starts after intro dismissed) ───────────────────────────
  useEffect(() => {
    if (showIntro || submitted || loading) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleSubmit()
          return 0
        }
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
      toast.error('Lỗi khi nộp bài, thử lại')
    } finally {
      setSubmitting(false)
    }
  }, [answers, loaiChungChi, kyNang, mode, questions, submitting])

  const setAnswer = (id: string, val: string) =>
    setAnswers(prev => ({ ...prev, [id]: val }))

  const answered    = Object.keys(answers).length
  const total       = questions.length
  const progressPct = total > 0 ? (answered / total) * 100 : 0
  const timerWarning = timeLeft < 120

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, fontFamily: "'DM Sans',sans-serif", gap: 16 }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${certColor}30`, borderTop: `3px solid ${certColor}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: C.textMid, fontSize: 15 }}>Đang tải câu hỏi...</div>
      </div>
    )
  }

  // ── No questions ─────────────────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingTop: 80, fontFamily: "'DM Sans',sans-serif" }}>
        <i className="ti ti-file-off" style={{ fontSize: 48, color: C.textLt, display: 'block', marginBottom: 16 }} />
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>Chưa có câu hỏi</div>
        <div style={{ color: C.textMid, marginBottom: 24 }}>Phần này chưa có đủ câu hỏi trong ngân hàng đề</div>
        <button onClick={onFinish} style={{ padding: '12px 28px', background: C.navy, color: '#fff', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          ← Quay lại
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

    return (
      <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: "'DM Sans',sans-serif", paddingBottom: 60 }}>
        {/* Score hero */}
        <div style={{ textAlign: 'center', marginBottom: 28, padding: '40px 36px', background: C.navy, borderRadius: 24, color: '#fff' }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>{emoji}</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{pct}%</div>
          <div style={{ color: 'rgba(255,255,255,.45)', marginTop: 10, fontSize: 14 }}>
            {result.diemSo}/{result.tongSoCau} câu đúng
          </div>
          {scoreLabel && (
            <div style={{ marginTop: 14, display: 'inline-block', padding: '6px 18px', background: 'rgba(201,168,76,.2)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 50, color: '#C9A84C', fontSize: 14, fontWeight: 700 }}>
              {scoreLabel}
            </div>
          )}
        </div>

        {/* AI analysis */}
        {result.phanTichAi && result.phanTichAi.trim() !== '' && (
          <div style={{ marginBottom: 22, padding: '20px 22px', background: '#F5F4FF', borderRadius: 16, border: `1px solid ${C.violet}25` }}>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-brain" style={{ fontSize: 18, color: C.violet }} />
              Phân tích AI
            </div>
            <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.85, whiteSpace: 'pre-line' }}>{result.phanTichAi}</div>
          </div>
        )}

        {/* Per-question detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {questions.map((q, i) => {
            const { text } = normalize(q)
            const userAns  = answers[q.id]
            const chamDiem = result.chiTietCham?.find(c => c.id === q.id)
            const isCorrect = q.dap_an_dung === null
              ? null
              : userAns === q.dap_an_dung
            const borderColor = isCorrect === null ? `${C.slate}40` : isCorrect ? `${C.green}40` : '#EF444440'
            const bgColor     = isCorrect === null ? '#F8F8F8'       : isCorrect ? '#EDFAF5'    : '#FEF2F2'
            const iconColor   = isCorrect === null ? C.slate          : isCorrect ? C.green      : C.red
            const icon        = isCorrect === null ? 'ti-minus'       : isCorrect ? 'ti-check'   : 'ti-x'

            return (
              <div key={q.id} style={{ padding: '18px 20px', borderRadius: 16, border: `2px solid ${borderColor}`, background: bgColor }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconColor }}>
                    <i className={`ti ${icon}`} style={{ fontSize: 12, color: '#fff' }} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                      Câu {i + 1}. {text.length > 120 ? text.slice(0, 120) + '…' : text}
                    </div>
                    {isCorrect === false && (
                      <div style={{ fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: C.red }}>Bạn chọn: {userAns || 'Bỏ qua'}</span>
                        {' · '}
                        <span style={{ color: C.green, fontWeight: 600 }}>Đáp án: {q.dap_an_dung}</span>
                      </div>
                    )}
                    {chamDiem && (
                      <div style={{ fontSize: 13, color: C.violet, marginTop: 4, fontWeight: 600 }}>
                        Điểm: {chamDiem.diem}/10
                        {chamDiem.nhanXet && <span style={{ fontWeight: 400, color: C.textMid }}> — {chamDiem.nhanXet}</span>}
                      </div>
                    )}
                    {q.giai_thich && (
                      <div style={{ fontSize: 12, color: C.textMid, marginTop: 6, lineHeight: 1.6 }}>
                        <i className="ti ti-bulb" style={{ fontSize: 13, marginRight: 4 }} />
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
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onFinish} style={{ flex: 1, padding: '14px', border: `2px solid ${C.border}`, color: C.text, fontWeight: 600, borderRadius: 12, background: C.white, cursor: 'pointer', fontSize: 14 }}>
            ← Chọn bài khác
          </button>
          <button
            onClick={() => { setSubmitted(false); setAnswers({}); setCurrentIdx(0); setResult(null); setShowIntro(true); setTimeLeft(mode === 'quick' ? TIME_LIMIT.quick : (TIME_LIMIT[kyNang] ?? 1800)) }}
            style={{ flex: 1, padding: '14px', background: certColor, color: '#fff', fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14 }}>
            Thi lại
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
      <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.border}`, padding: '22px 24px', marginBottom: 18, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
        <div style={{ fontSize: 11, color: C.textLt, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span>Câu {currentIdx + 1}</span>
          {q.so_phan && mode === 'full' && <span style={{ color: C.gold }}>· Part {q.so_phan}</span>}
          {q.la_cau_ai_sinh && <span style={{ color: C.violet }}>· AI</span>}
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, color: C.text, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {text}
        </div>
      </div>

      {/* Audio player for NGHE */}
      {kyNang === 'NGHE' && q.audio_url && (
        <AudioPlayer src={q.audio_url} />
      )}
      {kyNang === 'NGHE' && !q.audio_url && (
        <div style={{ padding: '12px 16px', background: '#FFF8E7', border: '1px solid #F5A62330', borderRadius: 12, fontSize: 13, color: '#92600A', marginBottom: 16 }}>
          <i className="ti ti-alert-triangle" style={{ marginRight: 6 }} />
          Câu này chưa có file audio. Hãy đọc transcript trong nội dung câu hỏi.
        </div>
      )}

      {/* Rubric for speaking/writing */}
      {rubric && <RubricPanel rubric={rubric} />}

      {/* Multiple choice */}
      {!isOpenEnded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {choices.map(opt => {
            const selected = answers[q.id] === opt.key
            return (
              <button key={opt.key}
                onClick={() => setAnswer(q.id, opt.key)}
                style={{ width: '100%', textAlign: 'left', padding: '14px 20px', borderRadius: 14, border: `2px solid ${selected ? certColor : C.border}`, background: selected ? `${certColor}08` : C.white, fontWeight: selected ? 600 : 400, fontSize: 14, cursor: 'pointer', transition: 'all .2s', color: C.text, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: selected ? certColor : '#F0F0EA', color: selected ? '#fff' : C.textMid, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' }}>
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
          <SpeakingRecorder
            value={answers[q.id] || ''}
            onChange={val => setAnswer(q.id, val)}
          />
        </div>
      )}

      {/* Writing */}
      {isOpenEnded && isViet && (
        <WritingArea
          value={answers[q.id] || ''}
          onChange={val => setAnswer(q.id, val)}
          minWords={80}
          placeholder="Viết bài của bạn tại đây. Chú ý format yêu cầu (email, đoạn văn, bài luận)..."
        />
      )}

      {/* Other open-ended (fallback textarea) */}
      {isOpenEnded && !isNoi && !isViet && (
        <div style={{ marginBottom: 28 }}>
          <textarea
            placeholder="Nhập câu trả lời của bạn..."
            value={answers[q.id] || ''}
            onChange={e => setAnswer(q.id, e.target.value)}
            rows={5}
            style={{ width: '100%', padding: '16px', borderRadius: 14, border: `2px solid ${C.border}`, fontSize: 14, lineHeight: 1.7, resize: 'vertical', fontFamily: "'DM Sans',sans-serif", color: C.text, outline: 'none' }}
          />
          {q.goi_y_tra_loi && (
            <div style={{ marginTop: 10, padding: '10px 16px', background: '#F8F7F2', borderRadius: 10, fontSize: 12, color: C.textMid, border: `1px solid ${C.border}` }}>
              <i className="ti ti-bulb" style={{ marginRight: 6, fontSize: 13 }} />
              Gợi ý: {q.goi_y_tra_loi}
            </div>
          )}
        </div>
      )}
    </>
  )

  return (
    <div style={{ maxWidth: isDoc ? 1000 : 680, margin: '0 auto', fontFamily: "'DM Sans',sans-serif", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button onClick={onFinish} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMid, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 14 }} />
          Thoát
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: C.textMid }}>{currentIdx + 1} / {total}</div>
          <div style={{ fontFamily: 'monospace', color: timerWarning ? C.red : certColor, fontWeight: 700, fontSize: 16, transition: 'color .5s' }}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: C.textMid, fontWeight: 600 }}>{loaiChungChi}</span>
          {mode === 'full' && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: `${C.gold}20`, color: C.gold, borderRadius: 20 }}>FULL</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, background: '#F0F0EA', borderRadius: 99, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: certColor, borderRadius: 99, width: `${progressPct}%`, transition: 'width .4s ease' }} />
      </div>
      <div style={{ textAlign: 'right', fontSize: 12, color: C.textLt, marginBottom: 20 }}>
        Đã trả lời <strong style={{ color: certColor }}>{answered}</strong>/{total}
      </div>

      {/* Main content — reading gets split layout */}
      {isDoc && q.passage ? (
        <ReadingLayout passage={q.passage}>
          {questionContent}
        </ReadingLayout>
      ) : (
        questionContent
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
        <button
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          style={{ padding: '10px 20px', border: `2px solid ${C.border}`, borderRadius: 12, color: C.textMid, background: C.white, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', fontSize: 13, opacity: currentIdx === 0 ? 0.35 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 14 }} /> Trước
        </button>

        {/* Page dots — max 20 questions shown */}
        {total <= 20 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                style={{ width: 30, height: 30, borderRadius: 8, fontSize: 11, fontWeight: 600, border: i === currentIdx ? `2px solid ${certColor}` : `1px solid ${C.border}`, background: i === currentIdx ? certColor : answers[questions[i].id] ? `${certColor}18` : C.white, color: i === currentIdx ? '#fff' : answers[questions[i].id] ? certColor : C.textMid, cursor: 'pointer' }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {total > 20 && (
          <span style={{ fontSize: 13, color: C.textMid }}>
            <strong style={{ color: C.text }}>{currentIdx + 1}</strong> / {total}
          </span>
        )}

        {currentIdx < total - 1 ? (
          <button onClick={() => setCurrentIdx(currentIdx + 1)}
            style={{ padding: '10px 20px', background: C.navy, color: '#fff', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            Tiếp <i className="ti ti-arrow-right" style={{ fontSize: 14 }} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={answered === 0 || submitting}
            style={{ padding: '10px 22px', background: answered === 0 ? C.slate : C.green, color: '#fff', borderRadius: 12, border: 'none', cursor: answered === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, opacity: answered === 0 || submitting ? 0.55 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {submitting ? 'Đang nộp...' : <>Nộp bài <i className="ti ti-check" style={{ fontSize: 14 }} /></>}
          </button>
        )}
      </div>

      {/* Submit all button (visible when answered ≥ half) */}
      {answered >= Math.ceil(total / 2) && currentIdx < total - 1 && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 50, padding: '8px 22px', fontSize: 13, color: C.textMid, cursor: 'pointer', fontWeight: 600 }}>
            Nộp bài sớm ({answered}/{total} câu đã trả lời)
          </button>
        </div>
      )}
    </div>
  )
}