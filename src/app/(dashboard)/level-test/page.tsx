'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const LEVEL_QUESTIONS = [
  { id: 1, q: 'She ___ to the gym three times a week.', opts: ['A. go','B. goes','C. is going','D. went'], ans: 'B', level: 'A2' },
  { id: 2, q: 'I ___ my homework before dinner yesterday.', opts: ['A. finish','B. have finished','C. finished','D. am finishing'], ans: 'C', level: 'A2' },
  { id: 3, q: 'When I arrived, she ___ on the phone.', opts: ['A. talks','B. talked','C. was talking','D. has talked'], ans: 'C', level: 'B1' },
  { id: 4, q: 'If I ___ you, I would accept the offer.', opts: ['A. am','B. was','C. were','D. had been'], ans: 'C', level: 'B1' },
  { id: 5, q: 'By the time she arrived, we ___ waiting for an hour.', opts: ['A. were','B. had been','C. are','D. have been'], ans: 'B', level: 'B2' },
  { id: 6, q: 'The report ___ by the team before the deadline.', opts: ['A. submitted','B. has submitted','C. was submitted','D. submits'], ans: 'C', level: 'B1' },
  { id: 7, q: '"Meticulous" most closely means:', opts: ['A. careless','B. very detailed and careful','C. very fast','D. creative'], ans: 'B', level: 'C1' },
  { id: 8, q: 'She speaks English ___ a native speaker.', opts: ['A. as well as','B. as good as','C. better than','D. more fluent than'], ans: 'A', level: 'B2' },
  { id: 9, q: 'Not only ___ he finish the task, but he exceeded expectations.', opts: ['A. did','B. does','C. had','D. has'], ans: 'A', level: 'C1' },
  { id: 10, q: 'The phenomenon ___ to climate change has worsened over the decade.', opts: ['A. attributing','B. attributed','C. that attributed','D. which attributing'], ans: 'B', level: 'C1' },
]

export default function LevelTestPage() {
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ level: string; analysis: string; roadmap: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit() {
    setLoading(true)
    let correct = 0
    LEVEL_QUESTIONS.forEach(q => { if (answers[q.id] === q.ans) correct++ })
    const pct = (correct / LEVEL_QUESTIONS.length) * 100

    const level = pct >= 80 ? 'C1' : pct >= 65 ? 'B2' : pct >= 50 ? 'B1' : pct >= 35 ? 'A2' : 'A1'

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Học sinh đã làm bài kiểm tra trình độ tiếng Anh và đạt ${correct}/${LEVEL_QUESTIONS.length} câu (${pct.toFixed(0)}%). Trình độ ước tính: ${level}.
Hãy:
1. Nhận xét ngắn về trình độ hiện tại (2-3 câu)
2. Đề xuất lộ trình học 3 tháng để đạt VSTEP B1
3. Gợi ý module nên học đầu tiên trên EnglishHub

Trả lời bằng tiếng Việt, thân thiện và khuyến khích.`,
          type: 'general',
        }),
      })
      const data = await res.json()

      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        await supabase.from('NguoiDung').update({ trinh_do_hien_tai: level }).eq('id', user.user.id)
        await supabase.from('KetQuaLevelTest').insert({
          nguoi_dung_id: user.user.id,
          trinh_do_tong_the: level,
          lo_trinh_de_xuat_json: { ai_analysis: data.response },
        })
      }

      setResult({ level, analysis: data.response, roadmap: '' })
    } catch {
      setResult({ level, analysis: 'Không thể tải phân tích AI. Trình độ của bạn: ' + level, roadmap: '' })
    }
    setSubmitted(true)
    setLoading(false)
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-7xl mb-6">🎯</div>
        <h1 className="font-display text-4xl font-bold text-[#0D0D0D] mb-4">Level Test</h1>
        <p className="text-[#6B6B60] mb-2">Kiểm tra trình độ tiếng Anh của bạn qua 10 câu hỏi</p>
        <p className="text-[#A0A090] text-sm mb-8">Thời gian: ~10 phút · AI phân tích kết quả và đề xuất lộ trình cá nhân</p>
        <div className="grid grid-cols-3 gap-3 mb-8 text-left">
          {[
            { icon: '📝', label: '10 câu hỏi', desc: 'Từ A1 đến C1' },
            { icon: '🤖', label: 'AI phân tích', desc: 'Lộ trình cá nhân hoá' },
            { icon: '📊', label: 'Trình độ chính xác', desc: 'A1 → C2' },
          ].map((f, i) => (
            <div key={i} className="p-4 bg-white rounded-xl border border-[#E8E8E0]">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="font-semibold text-[#0D0D0D] text-sm">{f.label}</div>
              <div className="text-xs text-[#6B6B60]">{f.desc}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setStarted(true)} className="px-8 py-4 bg-[#00A878] text-white font-semibold text-lg rounded-2xl hover:bg-[#007A58] transition-colors shadow-lg shadow-[#00A878]/25">
          Bắt đầu kiểm tra →
        </button>
      </div>
    )
  }

  if (submitted && result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">🎓</div>
          <h2 className="font-display text-4xl font-bold text-[#0D0D0D] mb-2">Trình độ của bạn</h2>
          <div className="inline-block px-8 py-3 bg-[#00A878] text-white rounded-2xl font-display text-3xl font-bold shadow-lg shadow-[#00A878]/30 mb-4">
            {result.level}
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-[#E8E8E0] mb-6">
          <div className="font-semibold text-[#0D0D0D] mb-3 flex items-center gap-2">🤖 Phân tích & Lộ trình AI</div>
          <div className="text-sm text-[#484840] leading-relaxed whitespace-pre-line">{result.analysis}</div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.push('/dashboard')} className="flex-1 py-3.5 border-2 border-[#E8E8E0] text-[#0D0D0D] font-medium rounded-xl hover:border-[#0D0D0D] transition-colors">
            Dashboard
          </button>
          <button onClick={() => router.push('/vocabulary')} className="flex-1 py-3.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">
            Bắt đầu học 🚀
          </button>
        </div>
      </div>
    )
  }

  const current = LEVEL_QUESTIONS[0] // show all at once for level test
  void current
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#0D0D0D]">Level Test</h1>
        <p className="text-[#6B6B60]">Trả lời tất cả {LEVEL_QUESTIONS.length} câu hỏi</p>
        <div className="mt-2 progress-bar">
          <div className="progress-fill" style={{ width: `${(Object.keys(answers).length / LEVEL_QUESTIONS.length) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {LEVEL_QUESTIONS.map((q, i) => (
          <div key={q.id} className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
            <div className="font-medium text-[#0D0D0D] mb-4">
              <span className="text-xs text-[#A0A090] mr-2">Câu {i+1}.</span>{q.q}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {q.opts.map(opt => (
                <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.charAt(0) }))}
                  className={`text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                    answers[q.id] === opt.charAt(0) ? 'border-[#0D0D0D] bg-[#F8F7F2] font-medium' : 'border-[#E8E8E0] hover:border-[#00A878]/40'
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSubmit}
        disabled={loading || Object.keys(answers).length < LEVEL_QUESTIONS.length}
        className="w-full py-4 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg">
        {loading ? '🤖 AI đang phân tích...' : `Xem kết quả (${Object.keys(answers).length}/${LEVEL_QUESTIONS.length} câu)`}
      </button>
    </div>
  )
}
