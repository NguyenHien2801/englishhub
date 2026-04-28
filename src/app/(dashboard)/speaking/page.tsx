'use client'
import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

const TOPICS = [
  {
    id: 1, title: 'Giới thiệu bản thân', level: 'A2', cert: 'VSTEP',
    prompt: 'Please introduce yourself. Talk about your name, where you are from, what you study, and your hobbies. (1–2 minutes)',
    sampleAnswer: 'My name is Nguyen Van An. I am from Thai Binh province in northern Vietnam. I am currently studying Information Technology at Thai Binh University. In my free time, I enjoy reading books, playing football with my friends, and learning English. I am preparing for the VSTEP B1 exam to meet my university graduation requirements.',
    keywords: ['name', 'from', 'study', 'hobby', 'university'],
  },
  {
    id: 2, title: 'Mô tả nơi sống', level: 'B1', cert: 'VSTEP',
    prompt: 'Describe the city or town where you live. What do you like most about it? What would you like to change? (1–2 minutes)',
    sampleAnswer: 'I live in Thai Binh, a coastal province in northern Vietnam. It is a peaceful and friendly city with a population of about one million people. What I like most about Thai Binh is its fresh seafood and beautiful beaches. The people here are very warm and welcoming. However, I think the city needs better public transportation and more entertainment options for young people.',
    keywords: ['location', 'population', 'like', 'change', 'describe'],
  },
  {
    id: 3, title: 'Công nghệ và cuộc sống', level: 'B2', cert: 'TOEIC',
    prompt: 'How has technology changed the way people work and communicate? Give specific examples from your own experience. (2–3 minutes)',
    sampleAnswer: 'Technology has revolutionized the way we work and communicate in many ways. For example, video conferencing tools like Zoom allow people to collaborate from different locations, eliminating the need for long business trips. In my own experience, I use smartphones to access emails and work documents anywhere. Social media platforms have also changed communication, making it instant and global.',
    keywords: ['technology', 'work', 'communicate', 'example', 'change'],
  },
  {
    id: 4, title: 'Mô tả biểu đồ (Part 3)', level: 'B1', cert: 'VSTEP',
    prompt: 'Look at this scenario: A survey showed that 65% of Vietnamese students prefer online learning, 25% prefer face-to-face classes, and 10% prefer a blended approach. Describe this information and give your opinion. (1–2 minutes)',
    sampleAnswer: 'According to the survey, the majority of Vietnamese students, which is sixty-five percent, prefer online learning. A quarter of students still prefer traditional face-to-face classes, while only ten percent choose a blended approach. In my opinion, online learning is popular because it offers flexibility and convenience. However, face-to-face interaction is still important for developing communication skills and building relationships with classmates.',
    keywords: ['percent', 'majority', 'opinion', 'prefer', 'survey'],
  },
]

type RecordingState = 'idle' | 'recording' | 'recorded' | 'analyzing'

interface SpeechFeedback {
  overallScore: number
  fluency: number
  vocabulary: number
  grammar: number
  content: number
  generalComment: string
  strengths: string[]
  improvements: string[]
  detectedKeywords: string[]
}

export default function SpeakingPage() {
  const [selected, setSelected] = useState<typeof TOPICS[0] | null>(null)
  const [state, setState] = useState<RecordingState>('idle')
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null)
  const [timer, setTimer] = useState(0)
  const [showSample, setShowSample] = useState(false)
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timerRef = useRef<NodeJS.Timeout>()
  const fullTranscriptRef = useRef('')

  useEffect(() => {
    const SR = window.SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) setSupported(false)
    return () => {
      clearInterval(timerRef.current)
      recognitionRef.current?.stop()
    }
  }, [])

  function startRecording() {
    const SR = window.SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) { toast.error('Trình duyệt không hỗ trợ. Dùng Chrome nhé!'); return }

    fullTranscriptRef.current = ''
    setTranscript('')
    setState('recording')
    setTimer(0)
    setFeedback(null)

    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += t + ' '
          fullTranscriptRef.current += t + ' '
        } else {
          interimTranscript += t
        }
      }
      setTranscript(fullTranscriptRef.current + interimTranscript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech error:', event.error)
      if (event.error === 'no-speech') return
      toast.error('Lỗi microphone: ' + event.error)
      stopRecording()
    }

    recognition.onend = () => {
      if (state === 'recording') recognition.start()
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    recognitionRef.current?.stop()
    recognitionRef.current = null
    const final = fullTranscriptRef.current.trim()
    setTranscript(final)
    setState(final ? 'recorded' : 'idle')
    if (!final) toast('Không nhận được âm thanh. Thử lại nhé!', { icon: '🎙️' })
  }

  async function analyzeWithAI() {
    if (!transcript.trim() || !selected) return
    setState('analyzing')

    const detectedKw = selected.keywords.filter(kw =>
      transcript.toLowerCase().includes(kw.toLowerCase())
    )

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Chấm điểm bài nói tiếng Anh theo chủ đề: "${selected.title}" (${selected.cert} ${selected.level})

ĐỀ BÀI: ${selected.prompt}

TRANSCRIPT BÀI NÓI:
${transcript}

TỪ KHÓA PHÁT HIỆN: ${detectedKw.join(', ') || 'chưa phát hiện'}
THỜI GIAN NÓI: ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}

Chấm điểm theo thang 0-10 cho từng tiêu chí và trả về JSON (KHÔNG markdown):
{
  "overallScore": <0-10>,
  "fluency": <0-10>,
  "vocabulary": <0-10>,
  "grammar": <0-10>,
  "content": <0-10>,
  "generalComment": "nhận xét tổng thể bằng tiếng Việt 2-3 câu",
  "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
  "improvements": ["cần cải thiện 1", "cần cải thiện 2", "cần cải thiện 3"],
  "detectedKeywords": ${JSON.stringify(detectedKw)}
}`,
          type: 'general',
        }),
      })
      const data = await res.json()
      const clean = data.response.replace(/```json|```/g, '').trim()
      const parsed: SpeechFeedback = JSON.parse(clean)
      setFeedback(parsed)
      setState('recorded')
      toast.success('AI đã phân tích xong!')
      // Save result to DB
      fetch('/api/speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selected.id, topicTitle: selected.title,
          cert: selected.cert, level: selected.level,
          transcript, thoiGianNoi: timer,
          overallScore: parsed.overallScore,
          fluency: parsed.fluency, vocabulary: parsed.vocabulary,
          grammar: parsed.grammar, content: parsed.content,
          detectedKeywords: parsed.detectedKeywords,
        }),
      }).catch(() => {})
    } catch {
      toast.error('Lỗi phân tích. Thử lại nhé!')
      setState('recorded')
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  const scoreColor = (s: number) => s >= 8 ? '#00A878' : s >= 6 ? '#F5A623' : '#FF6B6B'

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => { recognitionRef.current?.stop(); clearInterval(timerRef.current); setSelected(null) }}
            className="text-[#6B6B60] hover:text-[#0D0D0D] transition-colors">← Quay lại</button>
          <div>
            <div className="flex gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-[#E8FFF8] text-[#00A878] rounded-full font-medium">{selected.cert}</span>
              <span className="text-xs px-2 py-0.5 bg-[#F0F0FF] text-[#7C7CFF] rounded-full">{selected.level}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#0D0D0D]">{selected.title}</h1>
          </div>
        </div>

        {/* Prompt */}
        <div className="bg-[#0D0D0D] text-white rounded-2xl p-5 mb-5">
          <div className="text-xs text-[#707068] font-semibold mb-2 uppercase tracking-wide">Đề bài</div>
          <div className="text-sm leading-relaxed">{selected.prompt}</div>
        </div>

        {/* Recording area */}
        <div className="bg-white rounded-2xl border-2 border-[#E8E8E0] p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-[#0D0D0D]">🎙️ Ghi âm bài nói</div>
            {state === 'recording' && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse" />
                <span className="font-mono text-[#FF6B6B] font-semibold">{formatTime(timer)}</span>
              </div>
            )}
          </div>

          {!supported && (
            <div className="mb-4 p-4 bg-[#FFF0F0] border border-[#FF6B6B]/20 rounded-xl text-sm text-[#FF6B6B]">
              ⚠️ Trình duyệt không hỗ trợ Speech Recognition. Vui lòng dùng Google Chrome!
            </div>
          )}

          <div className="flex gap-3 mb-4">
            {state === 'idle' || state === 'recorded' ? (
              <button onClick={startRecording} disabled={!supported}
                className="flex-1 py-3.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                <span className="text-lg">🎙️</span>
                {state === 'recorded' ? 'Ghi lại' : 'Bắt đầu nói'}
              </button>
            ) : state === 'recording' ? (
              <button onClick={stopRecording}
                className="flex-1 py-3.5 bg-[#FF6B6B] text-white font-semibold rounded-xl hover:bg-[#E05050] transition-colors flex items-center justify-center gap-2 animate-pulse-jade">
                <span>⏹</span> Dừng ghi âm
              </button>
            ) : (
              <button disabled className="flex-1 py-3.5 bg-[#F5A623] text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> AI đang phân tích...
              </button>
            )}
          </div>

          {/* Live transcript */}
          {(transcript || state === 'recording') && (
            <div className="p-4 bg-[#F8F7F2] rounded-xl min-h-24 text-sm text-[#484840] leading-relaxed">
              <div className="text-xs font-semibold text-[#A0A090] mb-2">
                {state === 'recording' ? '🔴 Đang nhận dạng...' : '📝 Transcript'}
              </div>
              <div>{transcript || <span className="text-[#A0A090] italic">Chưa nhận được âm thanh...</span>}</div>
            </div>
          )}

          {/* Keywords detected */}
          {state !== 'idle' && selected.keywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.keywords.map(kw => {
                const found = transcript.toLowerCase().includes(kw.toLowerCase())
                return (
                  <span key={kw} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                    found ? 'bg-[#E8FFF8] text-[#00A878]' : 'bg-[#F8F7F2] text-[#A0A090]'
                  }`}>
                    {found ? '✓' : '○'} {kw}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        {state === 'recorded' && transcript && !feedback && (
          <button onClick={analyzeWithAI}
            className="w-full py-3.5 bg-[#0D0D0D] text-white font-semibold rounded-xl hover:bg-[#2C2C28] transition-colors mb-4 flex items-center justify-center gap-2">
            🤖 Phân tích bằng AI Gemini
          </button>
        )}

        {/* Sample answer */}
        <button onClick={() => setShowSample(!showSample)}
          className="w-full py-3 border-2 border-[#E8E8E0] text-[#6B6B60] font-medium rounded-xl hover:border-[#0D0D0D] hover:text-[#0D0D0D] transition-colors text-sm mb-4">
          {showSample ? 'Ẩn' : 'Xem'} bài mẫu tham khảo
        </button>
        {showSample && (
          <div className="mb-4 p-5 bg-[#FFF8EC] border border-[#F5A623]/20 rounded-2xl">
            <div className="text-xs font-semibold text-[#F5A623] mb-2">📖 Bài mẫu tham khảo</div>
            <div className="text-sm text-[#484840] leading-relaxed italic">{selected.sampleAnswer}</div>
          </div>
        )}

        {/* AI Feedback */}
        {feedback && (
          <div className="bg-white rounded-2xl border-2 border-[#00A878]/30 p-6">
            <div className="text-center mb-6">
              <div className="text-sm font-semibold text-[#6B6B60] mb-1">🤖 Điểm tổng thể</div>
              <div className="font-display text-5xl font-bold" style={{ color: scoreColor(feedback.overallScore) }}>
                {feedback.overallScore}<span className="text-xl text-[#6B6B60]">/10</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Trôi chảy (Fluency)', score: feedback.fluency },
                { label: 'Từ vựng (Vocabulary)', score: feedback.vocabulary },
                { label: 'Ngữ pháp (Grammar)', score: feedback.grammar },
                { label: 'Nội dung (Content)', score: feedback.content },
              ].map((c, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#F8F7F2]">
                  <div className="text-xs text-[#6B6B60] mb-1">{c.label}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#E8E8E0] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${c.score * 10}%`, backgroundColor: scoreColor(c.score) }} />
                    </div>
                    <span className="text-sm font-bold" style={{ color: scoreColor(c.score) }}>{c.score}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#F8F7F2] rounded-xl mb-4 text-sm text-[#484840] leading-relaxed">
              {feedback.generalComment}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {feedback.strengths.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#00A878] mb-2">✅ Điểm mạnh</div>
                  {feedback.strengths.map((s, i) => <div key={i} className="text-xs text-[#484840] mb-1">• {s}</div>)}
                </div>
              )}
              {feedback.improvements.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#FF6B6B] mb-2">📈 Cần cải thiện</div>
                  {feedback.improvements.map((s, i) => <div key={i} className="text-xs text-[#484840] mb-1">• {s}</div>)}
                </div>
              )}
            </div>

            {feedback.detectedKeywords.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E8E8E0]">
                <div className="text-xs text-[#6B6B60]">
                  Từ khóa sử dụng: {feedback.detectedKeywords.map(k => <span key={k} className="ml-1 px-2 py-0.5 bg-[#E8FFF8] text-[#00A878] rounded-full text-xs">{k}</span>)}
                </div>
              </div>
            )}

            <button onClick={() => { setState('idle'); setTranscript(''); setFeedback(null); fullTranscriptRef.current = ''; setTimer(0) }}
              className="mt-4 w-full py-3 border-2 border-[#E8E8E0] text-[#0D0D0D] font-medium rounded-xl hover:border-[#0D0D0D] transition-colors text-sm">
              🎙️ Nói lại
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Luyện nói</h1>
        <p className="text-[#6B6B60] mt-1">Nói → Nhận dạng giọng nói → AI Gemini chấm điểm · VSTEP · TOEIC</p>
      </div>

      <div className="mb-5 p-4 bg-[#0D0D0D] rounded-xl flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🎙️</span>
        <div>
          <div className="font-semibold text-white text-sm mb-1">Cách hoạt động</div>
          <div className="text-[#A0A090] text-xs leading-relaxed">
            Dùng Web Speech API (Chrome) để nhận dạng giọng nói → Gemini AI chấm điểm 4 tiêu chí: Trôi chảy, Từ vựng, Ngữ pháp, Nội dung. Yêu cầu: <span className="text-[#00A878]">Google Chrome + microphone</span>.
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {TOPICS.map(topic => (
          <button key={topic.id} onClick={() => { setSelected(topic); setState('idle'); setTranscript(''); setFeedback(null) }}
            className="p-5 bg-white rounded-2xl border-2 border-[#E8E8E0] text-left hover:border-[#00A878]/50 hover:shadow-md transition-all group">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8FFF8] flex items-center justify-center text-xl flex-shrink-0">🗣️</div>
              <div>
                <div className="flex gap-2 mb-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 bg-[#E8FFF8] text-[#00A878] rounded-full font-medium">{topic.cert}</span>
                  <span className="text-xs px-2 py-0.5 bg-[#F8F7F2] text-[#6B6B60] rounded-full">{topic.level}</span>
                </div>
                <h3 className="font-semibold text-[#0D0D0D] text-sm group-hover:text-[#00A878] transition-colors">{topic.title}</h3>
              </div>
            </div>
            <p className="text-xs text-[#6B6B60] line-clamp-2">{topic.prompt}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {topic.keywords.slice(0, 4).map(kw => (
                <span key={kw} className="text-xs px-2 py-0.5 bg-[#F0F0FF] text-[#7C7CFF] rounded-full">{kw}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
