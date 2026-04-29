'use client'
import { useState, useRef, useEffect } from 'react'
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

const SKILL_META: Record<SkillStep, { label: string; icon: string; color: string; bg: string }> = {
  listening: { label: 'Listening', icon: '🎧', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  speaking:  { label: 'Speaking',  icon: '🎤', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  reading:   { label: 'Reading',   icon: '📖', color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200' },
  writing:   { label: 'Writing',   icon: '✏️', color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  grammar:   { label: 'Grammar & Vocab', icon: '📝', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function LevelBadge({ level }: { level: string }) {
  const idx = LEVEL_ORDER.indexOf(level)
  const colors = ['bg-slate-100 text-slate-700','bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-purple-100 text-purple-700','bg-rose-100 text-rose-700']
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${colors[idx] ?? colors[0]}`}>{level}</span>
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all ${
          i < current ? 'w-6 h-2 bg-[#00A878]' : i === current ? 'w-3 h-3 bg-[#00A878]' : 'w-2 h-2 bg-[#E8E8E0]'
        }`} />
      ))}
    </div>
  )
}

function ScoreBar({ value, max = 10, color = 'bg-[#00A878]' }: { value: number; max?: number; color?: string }) {
  return (
    <div className="h-2 bg-[#F0F0E8] rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LevelTestPage() {
  const router = useRouter()

  // Phase
  const [phase, setPhase] = useState<'intro' | 'loading' | 'test' | 'submitting' | 'result'>('intro')
  const [currentSkill, setCurrentSkill] = useState<SkillStep>('listening')
  const [exam, setExam] = useState<Exam | null>(null)
  const [error, setError] = useState('')

  // Answers
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({})
  const [writingText, setWritingText] = useState('')
  const [speakingTranscript, setSpeakingTranscript] = useState('')

  // TTS (Listening)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // STT (Speaking)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingDone, setRecordingDone] = useState(false)
  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Result
  const [result, setResult] = useState<FinalResult | null>(null)

  // Word count cho writing
  const wordCount = writingText.trim() === '' ? 0 : writingText.trim().split(/\s+/).length

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
      if (timerRef.current) clearInterval(timerRef.current)
      recognitionRef.current?.stop()
    }
  }, [])

  // ── Start Test ──────────────────────────────────────────────────────────────
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
      setRecordingDone(false)
      setPhase('test')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tạo đề')
      setPhase('intro')
    }
  }

  // ── TTS ─────────────────────────────────────────────────────────────────────
  function playScript() {
    if (!exam || playCount >= 2) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(exam.listening.script)
    utter.lang = 'en-US'
    utter.rate = 0.9
    utter.onstart = () => setIsPlaying(true)
    utter.onend = () => {
      setIsPlaying(false)
      setHasPlayed(true)
      setPlayCount(p => p + 1)
    }
    utteranceRef.current = utter
    window.speechSynthesis.speak(utter)
  }

  function stopScript() {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }

  // ── STT ─────────────────────────────────────────────────────────────────────
  function startRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    setError('Trình duyệt không hỗ trợ ghi âm. Vui lòng dùng Chrome.')
    return
  }
  const recognition: any = new SpeechRecognition()  // ← THÊM ": any" vào đây
  recognition.lang = 'en-US'
  recognition.continuous = true
  recognition.interimResults = true
  let finalText = ''
  
  recognition.onresult = (event: any) => {  // ← Giờ sẽ hết đỏ
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) finalText += event.results[i][0].transcript + ' '
      else interim += event.results[i][0].transcript
    }
    setSpeakingTranscript(finalText + interim)
  }
  
  recognition.onend = () => {
    setIsRecording(false)
    setRecordingDone(true)
    if (timerRef.current) clearInterval(timerRef.current)
  }
  
  recognitionRef.current = recognition
  recognition.start()
  setIsRecording(true)
  setRecordingTime(0)
  timerRef.current = setInterval(() => {
    setRecordingTime(t => {
      if (t >= (exam?.speaking.time_seconds ?? 60) - 1) {
        stopRecording()
        return t
      }
      return t + 1
    })
  }, 1000)
}

  function stopRecording() {
    recognitionRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
    setRecordingDone(true)
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  function nextSkill() {
    const idx = SKILL_STEPS.indexOf(currentSkill)
    if (idx < SKILL_STEPS.length - 1) setCurrentSkill(SKILL_STEPS[idx + 1])
  }

  function prevSkill() {
    const idx = SKILL_STEPS.indexOf(currentSkill)
    if (idx > 0) setCurrentSkill(SKILL_STEPS[idx - 1])
  }

  function canProceed(): boolean {
    if (!exam) return false
    switch (currentSkill) {
      case 'listening':
        return hasPlayed && exam.listening.questions.every(q => mcqAnswers[q.id])
      case 'speaking':
        return recordingDone && speakingTranscript.trim().length > 5
      case 'reading':
        return exam.reading.questions.every(q => mcqAnswers[q.id])
      case 'writing':
        return wordCount >= (exam.writing.min_words ?? 80)
      case 'grammar':
        return exam.grammar_vocab.questions.every(q => mcqAnswers[q.id])
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
      setError(e instanceof Error ? e.message : 'Lỗi phân tích')
      setPhase('test')
      setCurrentSkill('grammar')
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  // ── INTRO ────────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="max-w-2xl mx-auto text-center py-16 px-4">
      <div className="text-6xl mb-5">🎯</div>
      <h1 className="font-display text-4xl font-bold text-[#0D0D0D] mb-3">Level Test</h1>
      <p className="text-[#6B6B60] mb-1">Đánh giá trình độ tiếng Anh đầy đủ 4 kỹ năng</p>
      <p className="text-[#A0A090] text-sm mb-8">~40 phút · AI sinh đề mới mỗi lần · Gemini chấm Writing & Speaking</p>

      {error && <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">⚠️ {error}</div>}

      <div className="grid grid-cols-5 gap-2 mb-8">
        {SKILL_STEPS.map(s => {
          const m = SKILL_META[s]
          return (
            <div key={s} className={`p-3 rounded-xl border ${m.bg} text-center`}>
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className={`text-xs font-semibold ${m.color}`}>{m.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8 text-left text-sm">
        {[
          { icon: '🤖', t: 'AI sinh đề động', d: 'Không bao giờ trùng lặp' },
          { icon: '🎧', t: 'TTS tự động', d: 'Đọc to đoạn nghe' },
          { icon: '🎤', t: 'Web Speech API', d: 'Ghi âm Speaking miễn phí' },
        ].map((f, i) => (
          <div key={i} className="p-3 bg-white border border-[#E8E8E0] rounded-xl">
            <div className="text-xl mb-1">{f.icon}</div>
            <div className="font-semibold text-[#0D0D0D]">{f.t}</div>
            <div className="text-xs text-[#6B6B60]">{f.d}</div>
          </div>
        ))}
      </div>

      <button onClick={startTest} className="px-10 py-4 bg-[#00A878] text-white font-semibold text-lg rounded-2xl hover:bg-[#007A58] transition-colors shadow-lg shadow-[#00A878]/25">
        Bắt đầu kiểm tra →
      </button>
    </div>
  )

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'submitting') return (
    <div className="max-w-2xl mx-auto text-center py-32 px-4">
      <div className="text-5xl mb-6 animate-bounce">{phase === 'loading' ? '🤖' : '📊'}</div>
      <h2 className="font-display text-2xl font-bold text-[#0D0D0D] mb-2">
        {phase === 'loading' ? 'AI đang tạo đề thi...' : 'AI đang chấm bài...'}
      </h2>
      <p className="text-[#6B6B60] mb-8">
        {phase === 'loading' ? 'Gemini sinh đề 4 kỹ năng mới, chưa từng xuất hiện' : 'Chấm Writing, Speaking và phân tích toàn diện'}
      </p>
      <div className="flex gap-1.5 justify-center">
        {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 bg-[#00A878] rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
      </div>
    </div>
  )

  // ── TEST ─────────────────────────────────────────────────────────────────────
  if (phase === 'test' && exam) {
    const skillIdx = SKILL_STEPS.indexOf(currentSkill)
    const isLast = currentSkill === 'grammar'
    const meta = SKILL_META[currentSkill]

    return (
      <div className="max-w-2xl mx-auto px-4 pb-16">
        {/* Header */}
        <div className="sticky top-0 bg-[#FAFAF5] pt-4 pb-3 mb-6 z-10 border-b border-[#E8E8E0]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{meta.icon}</span>
              <span className="font-display font-bold text-[#0D0D0D]">{meta.label}</span>
              <span className="text-xs text-[#A0A090]">· Chủ đề: {exam.topic}</span>
            </div>
            <ProgressDots current={skillIdx} total={SKILL_STEPS.length} />
          </div>
        </div>

        {error && <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">⚠️ {error}</div>}

        {/* ── LISTENING ─────────────────────────────────────── */}
        {currentSkill === 'listening' && (
          <div className="space-y-5">
            <div className="p-5 bg-white rounded-2xl border border-[#E8E8E0]">
              <p className="text-sm text-[#6B6B60] mb-4">Nghe đoạn hội thoại (tối đa 2 lần) rồi trả lời câu hỏi bên dưới.</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={isPlaying ? stopScript : playScript}
                  disabled={playCount >= 2}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    playCount >= 2 ? 'bg-[#E8E8E0] text-[#A0A090] cursor-not-allowed'
                    : isPlaying ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-[#00A878] text-white hover:bg-[#007A58]'
                  }`}
                >
                  {isPlaying ? '⏹ Dừng' : playCount === 0 ? '▶ Phát audio' : '▶ Phát lại (lần 2)'}
                </button>
                {playCount > 0 && <span className="text-xs text-[#A0A090]">Đã nghe {playCount}/2 lần</span>}
              </div>
              {isPlaying && (
                <div className="mt-3 flex items-center gap-2 text-sm text-[#00A878]">
                  <div className="flex gap-0.5">
                    {[0,1,2,3].map(i => <div key={i} className="w-1 bg-[#00A878] rounded-full animate-bounce" style={{ height: `${8 + i*4}px`, animationDelay: `${i*0.1}s` }} />)}
                  </div>
                  Đang phát...
                </div>
              )}
            </div>

            {hasPlayed && (
              <div className="space-y-4">
                {exam.listening.questions.map((q, i) => (
                  <div key={q.id} className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
                    <p className="font-medium text-[#0D0D0D] mb-3"><span className="text-xs text-[#A0A090] mr-2">Câu {i+1}.</span>{q.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map(opt => (
                        <button key={opt} onClick={() => setMcqAnswers(p => ({ ...p, [q.id]: opt.charAt(0) }))}
                          className={`text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                            mcqAnswers[q.id] === opt.charAt(0) ? 'border-[#0D0D0D] bg-[#F8F7F2] font-medium' : 'border-[#E8E8E0] hover:border-[#00A878]/50'
                          }`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!hasPlayed && <p className="text-center text-sm text-[#A0A090] py-8">👆 Nhấn phát audio trước để nghe đoạn hội thoại</p>}
          </div>
        )}

        {/* ── SPEAKING ──────────────────────────────────────── */}
        {currentSkill === 'speaking' && (
          <div className="space-y-5">
            <div className="p-5 bg-white rounded-2xl border border-[#E8E8E0]">
              <div className="text-xs font-semibold text-purple-600 mb-2">Câu hỏi Speaking</div>
              <p className="font-medium text-[#0D0D0D] text-lg leading-relaxed">{exam.speaking.prompt}</p>
              <div className="mt-3 flex gap-3 text-xs text-[#6B6B60]">
                <span>⏱ {exam.speaking.time_seconds} giây</span>
                <span>🎯 Mục tiêu: {exam.speaking.level_target}</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E8E8E0]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-[#0D0D0D]">Ghi âm câu trả lời</span>
                {isRecording && (
                  <span className="text-sm font-mono text-rose-500">
                    {Math.floor(recordingTime/60).toString().padStart(2,'0')}:{(recordingTime%60).toString().padStart(2,'0')} / {Math.floor(exam.speaking.time_seconds/60).toString().padStart(2,'0')}:{(exam.speaking.time_seconds%60).toString().padStart(2,'0')}
                  </span>
                )}
              </div>

              <div className="flex gap-3 mb-4">
                {!isRecording && !recordingDone && (
                  <button onClick={startRecording} className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors">
                    🎤 Bắt đầu nói
                  </button>
                )}
                {isRecording && (
                  <button onClick={stopRecording} className="flex items-center gap-2 px-6 py-3 bg-[#0D0D0D] text-white rounded-xl font-semibold hover:bg-[#333] transition-colors">
                    ⏹ Dừng ghi âm
                  </button>
                )}
                {recordingDone && (
                  <button onClick={() => { setSpeakingTranscript(''); setRecordingDone(false); setRecordingTime(0) }}
                    className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm font-medium hover:border-[#0D0D0D] transition-colors">
                    🔄 Ghi lại
                  </button>
                )}
              </div>

              {isRecording && (
                <div className="flex items-center gap-2 text-sm text-rose-500 mb-3">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  Đang ghi âm... Hãy nói bằng tiếng Anh
                </div>
              )}

              {speakingTranscript && (
                <div className="p-4 bg-[#F8F7F2] rounded-xl">
                  <div className="text-xs text-[#A0A090] mb-1">Transcript:</div>
                  <p className="text-sm text-[#484840] leading-relaxed">{speakingTranscript}</p>
                </div>
              )}

              {recordingDone && !speakingTranscript && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl">
                  ⚠️ Không nhận được giọng nói. Hãy kiểm tra microphone hoặc thử ghi lại.
                </p>
              )}
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="text-xs font-semibold text-purple-700 mb-1">💡 Gợi ý</div>
              <p className="text-xs text-purple-600">Nói rõ ràng, đủ ý, khoảng {exam.speaking.time_seconds} giây. Không cần hoàn hảo — AI sẽ đánh giá khách quan.</p>
            </div>
          </div>
        )}

        {/* ── READING ───────────────────────────────────────── */}
        {currentSkill === 'reading' && (
          <div className="space-y-5">
            <div className="p-5 bg-white rounded-2xl border border-[#E8E8E0]">
              <div className="text-xs font-semibold text-emerald-700 mb-2">Đoạn văn</div>
              <p className="text-sm text-[#484840] leading-relaxed">{exam.reading.passage}</p>
            </div>
            <div className="space-y-4">
              {exam.reading.questions.map((q, i) => (
                <div key={q.id} className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
                  <p className="font-medium text-[#0D0D0D] mb-3"><span className="text-xs text-[#A0A090] mr-2">Câu {i+1}.</span>{q.question}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map(opt => (
                      <button key={opt} onClick={() => setMcqAnswers(p => ({ ...p, [q.id]: opt.charAt(0) }))}
                        className={`text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                          mcqAnswers[q.id] === opt.charAt(0) ? 'border-[#0D0D0D] bg-[#F8F7F2] font-medium' : 'border-[#E8E8E0] hover:border-[#00A878]/50'
                        }`}>{opt}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── WRITING ───────────────────────────────────────── */}
        {currentSkill === 'writing' && (
          <div className="space-y-5">
            <div className="p-5 bg-white rounded-2xl border border-[#E8E8E0]">
              <div className="text-xs font-semibold text-amber-700 mb-2">Đề bài</div>
              <p className="font-medium text-[#0D0D0D] leading-relaxed">{exam.writing.prompt}</p>
              <div className="mt-3 flex gap-3 text-xs text-[#6B6B60]">
                <span>📝 {exam.writing.min_words}–{exam.writing.max_words} từ</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E8E0] overflow-hidden">
              <textarea
                value={writingText}
                onChange={e => setWritingText(e.target.value)}
                placeholder="Viết bài của bạn ở đây..."
                rows={10}
                className="w-full p-5 text-sm text-[#0D0D0D] leading-relaxed resize-none outline-none font-sans"
              />
              <div className={`px-5 py-2.5 border-t border-[#E8E8E0] text-xs flex justify-between ${
                wordCount >= exam.writing.min_words ? 'text-emerald-600' : 'text-[#A0A090]'
              }`}>
                <span>{wordCount} từ</span>
                <span>Tối thiểu {exam.writing.min_words} từ {wordCount >= exam.writing.min_words ? '✅' : ''}</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="text-xs font-semibold text-amber-700 mb-1.5">Tiêu chí chấm điểm</div>
              <div className="flex flex-wrap gap-2">
                {exam.writing.criteria.map(c => (
                  <span key={c} className="text-xs bg-white border border-amber-200 text-amber-700 px-2 py-1 rounded-lg">{c}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GRAMMAR & VOCAB ───────────────────────────────── */}
        {currentSkill === 'grammar' && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B6B60]">10 câu Grammar & Vocabulary · Từ dễ đến khó</p>
            {exam.grammar_vocab.questions.map((q, i) => (
              <div key={q.id} className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="font-medium text-[#0D0D0D] flex-1"><span className="text-xs text-[#A0A090] mr-2">Câu {i+1}.</span>{q.question}</p>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <LevelBadge level={q.level ?? 'A2'} />
                    <span className="text-xs text-[#A0A090]">{q.skill === 'grammar' ? '✏️ Grammar' : '📖 Vocab'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map(opt => (
                    <button key={opt} onClick={() => setMcqAnswers(p => ({ ...p, [q.id]: opt.charAt(0) }))}
                      className={`text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                        mcqAnswers[q.id] === opt.charAt(0) ? 'border-[#0D0D0D] bg-[#F8F7F2] font-medium' : 'border-[#E8E8E0] hover:border-[#00A878]/50'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#FAFAF5] border-t border-[#E8E8E0] px-4 py-3 flex gap-3">
          <div className="max-w-2xl mx-auto w-full flex gap-3">
            {skillIdx > 0 && (
              <button onClick={prevSkill} className="px-5 py-3 border-2 border-[#E8E8E0] rounded-xl font-medium text-sm hover:border-[#0D0D0D] transition-colors">
                ← Quay lại
              </button>
            )}
            {!isLast ? (
              <button onClick={nextSkill} disabled={!canProceed()}
                className="flex-1 py-3 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Tiếp theo: {SKILL_META[SKILL_STEPS[skillIdx + 1]].label} →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!canProceed()}
                className="flex-1 py-3 bg-[#0D0D0D] text-white font-semibold rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Nộp bài & Xem kết quả 🤖
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── RESULT ───────────────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const { overall, skills, aiResult } = result
    const levelIdx = LEVEL_ORDER.indexOf(overall)
    const vstepIdx = LEVEL_ORDER.indexOf('B1')
    const gap = vstepIdx - levelIdx

    const skillRows: { key: keyof typeof skills; label: string; icon: string }[] = [
      { key: 'listening', label: 'Listening', icon: '🎧' },
      { key: 'speaking',  label: 'Speaking',  icon: '🎤' },
      { key: 'reading',   label: 'Reading',   icon: '📖' },
      { key: 'writing',   label: 'Writing',   icon: '✏️' },
      { key: 'grammar',   label: 'Grammar & Vocab', icon: '📝' },
    ]

    return (
      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Overall */}
        <div className="text-center mb-8 pt-6">
          <div className="text-6xl mb-4">🎓</div>
          <h2 className="font-display text-3xl font-bold text-[#0D0D0D] mb-3">Kết quả của bạn</h2>
          <div className="inline-block px-10 py-4 bg-[#00A878] text-white rounded-2xl font-display text-4xl font-bold shadow-lg shadow-[#00A878]/30 mb-3">
            {overall}
          </div>
          <p className="text-sm text-[#6B6B60]">
            {gap > 0 && <>Cần thêm <strong>{gap} cấp</strong> để đạt VSTEP B1</>}
            {gap === 0 && <span className="text-emerald-600 font-semibold">🎉 Đã đạt chuẩn VSTEP B1!</span>}
            {gap < 0 && <span className="text-purple-600 font-semibold">🏆 Vượt chuẩn VSTEP B1!</span>}
          </p>
        </div>

        {/* Chi tiết 4 kỹ năng */}
        <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5 mb-4">
          <h3 className="font-semibold text-[#0D0D0D] mb-4">📊 Chi tiết theo kỹ năng</h3>
          <div className="space-y-4">
            {skillRows.map(({ key, label, icon }) => {
              const s = skills[key]
              const isMCQ = 'correct' in s && s.correct !== undefined
              const score = isMCQ ? (s.correct! / s.total!) : ((s.overall ?? 0) / 10)
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-[#0D0D0D]">{icon} {label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#6B6B60]">
                        {isMCQ ? `${s.correct}/${s.total} câu` : `${s.overall?.toFixed(1)}/10`}
                      </span>
                      <LevelBadge level={s.level} />
                    </div>
                  </div>
                  <ScoreBar value={score * 10} max={10} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Writing feedback */}
        {skills.writing.feedback && (
          <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5 mb-4">
            <h3 className="font-semibold text-[#0D0D0D] mb-3">✏️ Nhận xét Writing</h3>
            <p className="text-sm text-[#484840] leading-relaxed mb-3">{skills.writing.feedback}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Task', val: skills.writing.task },
                { label: 'Coherence', val: skills.writing.coherence },
                { label: 'Vocabulary', val: skills.writing.vocabulary },
                { label: 'Grammar', val: skills.writing.grammar },
              ].map(({ label, val }) => (
                <div key={label} className="p-3 bg-[#F8F7F2] rounded-xl">
                  <div className="text-xs text-[#6B6B60] mb-1">{label}</div>
                  <div className="font-bold text-[#0D0D0D]">{val ?? '–'}/10</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Speaking feedback */}
        {skills.speaking.feedback && (
          <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5 mb-4">
            <h3 className="font-semibold text-[#0D0D0D] mb-3">🎤 Nhận xét Speaking</h3>
            <p className="text-sm text-[#484840] leading-relaxed mb-3">{skills.speaking.feedback}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Fluency', val: skills.speaking.fluency },
                { label: 'Vocabulary', val: skills.speaking.vocabulary },
                { label: 'Grammar', val: skills.speaking.grammar },
                { label: 'Content', val: skills.speaking.content },
              ].map(({ label, val }) => (
                <div key={label} className="p-3 bg-[#F8F7F2] rounded-xl">
                  <div className="text-xs text-[#6B6B60] mb-1">{label}</div>
                  <div className="font-bold text-[#0D0D0D]">{val ?? '–'}/10</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5 mb-4">
          <h3 className="font-semibold text-[#0D0D0D] mb-3">🤖 Phân tích AI</h3>
          <p className="text-sm text-[#484840] leading-relaxed mb-4">{aiResult.nhan_xet}</p>
          {aiResult.diem_manh?.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-semibold text-emerald-700 mb-1.5">✅ Điểm mạnh</div>
              {aiResult.diem_manh.map((s, i) => <p key={i} className="text-sm text-[#484840] flex gap-2 mb-1"><span className="text-emerald-500">•</span>{s}</p>)}
            </div>
          )}
          {aiResult.diem_yeu?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-rose-700 mb-1.5">⚠️ Cần cải thiện</div>
              {aiResult.diem_yeu.map((s, i) => <p key={i} className="text-sm text-[#484840] flex gap-2 mb-1"><span className="text-rose-400">•</span>{s}</p>)}
            </div>
          )}
        </div>

        {/* Lộ trình */}
        {aiResult.lo_trinh && (
          <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5 mb-6">
            <h3 className="font-semibold text-[#0D0D0D] mb-1">🗺️ Lộ trình học đề xuất</h3>
            <p className="text-xs text-[#A0A090] mb-4">{aiResult.lo_trinh.muc_tieu} · {aiResult.lo_trinh.thoi_gian}</p>
            <div className="space-y-3">
              {(['tuan_1_2','tuan_3_4','tuan_5_8','tuan_9_12'] as const).map((k, i) => {
                const content = aiResult.lo_trinh[k]
                if (!content) return null
                const labels = ['Tuần 1-2','Tuần 3-4','Tuần 5-8','Tuần 9-12']
                return (
                  <div key={k} className="flex gap-3">
                    <span className="shrink-0 text-xs font-semibold text-[#00A878] bg-[#E8F8F3] px-2 py-0.5 rounded-full h-fit mt-0.5">{labels[i]}</span>
                    <p className="text-sm text-[#484840] leading-relaxed">{content}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => { setPhase('intro'); setResult(null) }}
            className="flex-1 py-3.5 border-2 border-[#E8E8E0] rounded-xl font-medium text-sm hover:border-[#0D0D0D] transition-colors">
            🔄 Làm lại
          </button>
          <button onClick={() => router.push('/dashboard')}
            className="flex-1 py-3.5 border-2 border-[#E8E8E0] rounded-xl font-medium text-sm hover:border-[#0D0D0D] transition-colors">
            Dashboard
          </button>
          <button onClick={() => router.push('/vocabulary')}
            className="flex-1 py-3.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors text-sm">
            Bắt đầu học 🚀
          </button>
        </div>
      </div>
    )
  }

  return null
}