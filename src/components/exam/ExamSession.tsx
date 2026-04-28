'use client'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

interface Question {
  id: string
  noi_dung_cau_hoi: string
  cac_lua_chon?: { key: string; value: string }[]
  dap_an_dung: string
  giai_thich?: string
  ky_nang: string
  loai_cau_hoi: string
}

interface Props {
  loaiChungChi: string
  kyNang: string
  onFinish: () => void
}

export default function ExamSession({ loaiChungChi, kyNang, onFinish }: Props) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    fetch(`/api/exam?loai=${loaiChungChi}&kyNang=${kyNang}&limit=10`)
      .then(r => r.json())
      .then(data => { setQuestions(data.questions || []); setLoading(false) })
      .catch(() => { toast.error('Không thể tải câu hỏi'); setLoading(false) })
  }, [loaiChungChi, kyNang])

  useEffect(() => {
    if (!submitted && !loading) {
      timerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [submitted, loading])

  async function handleSubmit() {
    clearInterval(timerRef.current)
    const answerList = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }))
    const res = await fetch('/api/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loai_chung_chi: loaiChungChi,
        ky_nang: kyNang,
        answers: answerList,
        questions,
        thoiGianLamBai: timeElapsed,
      }),
    })
    const data = await res.json()
    setResult(data)
    setSubmitted(true)
  }

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20">
        <div className="text-4xl mb-4 animate-bounce">📝</div>
        <div className="text-[#6B6B60]">Đang tải câu hỏi...</div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-4xl mb-4">😅</div>
        <div className="font-display text-2xl font-bold text-[#0D0D0D] mb-2">Chưa có câu hỏi</div>
        <div className="text-[#6B6B60] mb-6">Phần này chưa có câu hỏi trong ngân hàng</div>
        <button onClick={onFinish} className="px-6 py-3 bg-[#0D0D0D] text-white rounded-xl font-medium hover:bg-[#2C2C28] transition-colors">
          ← Quay lại
        </button>
      </div>
    )
  }

  if (submitted && result) {
    const pct = result.phanTramDung as number
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '📖'}</div>
          <h2 className="font-display text-4xl font-bold text-[#0D0D0D] mb-2">{pct}%</h2>
          <p className="text-[#6B6B60]">{result.diemSo as number}/{result.tongSoCau as number} câu đúng · {formatTime(timeElapsed)}</p>
          {result.diemQuyDoi && (
            <div className="mt-2 px-4 py-1.5 bg-[#E8FFF8] inline-block rounded-full text-[#00A878] font-semibold">
              Ước tính TOEIC: {result.diemQuyDoi as number} điểm
            </div>
          )}
        </div>

        {result.phanTichAi && (
          <div className="mb-6 p-5 bg-[#F8F7F2] rounded-2xl border border-[#E8E8E0]">
            <div className="font-semibold text-[#0D0D0D] mb-2 flex items-center gap-2">🤖 AI phân tích</div>
            <div className="text-sm text-[#484840] leading-relaxed whitespace-pre-line">{result.phanTichAi as string}</div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {questions.map((q, i) => {
            const userAns = answers[q.id]
            const isCorrect = userAns === q.dap_an_dung
            return (
              <div key={q.id} className={`p-5 rounded-2xl border-2 ${isCorrect ? 'border-[#00A878]/30 bg-[#E8FFF8]' : 'border-[#FF6B6B]/30 bg-[#FFF0F0]'}`}>
                <div className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${isCorrect ? 'bg-[#00A878]' : 'bg-[#FF6B6B]'}`}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#0D0D0D] mb-2">Câu {i+1}. {q.noi_dung_cau_hoi}</div>
                    {!isCorrect && (
                      <div className="text-sm">
                        <span className="text-[#FF6B6B]">Bạn chọn: {userAns || 'Bỏ qua'}</span>
                        {' · '}
                        <span className="text-[#00A878]">Đáp án: {q.dap_an_dung}</span>
                      </div>
                    )}
                    {q.giai_thich && (
                      <div className="mt-2 text-xs text-[#6B6B60]">💡 {q.giai_thich}</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={onFinish} className="flex-1 py-3.5 border-2 border-[#E8E8E0] text-[#0D0D0D] font-medium rounded-xl hover:border-[#0D0D0D] transition-colors">
            ← Quay lại
          </button>
          <button onClick={() => { setSubmitted(false); setAnswers({}); setCurrentIdx(0); setTimeElapsed(0); setResult(null) }}
            className="flex-1 py-3.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">
            Thi lại
          </button>
        </div>
      </div>
    )
  }

  const q = questions[currentIdx]
  const progress = ((currentIdx) / questions.length) * 100

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onFinish} className="text-[#6B6B60] hover:text-[#0D0D0D] transition-colors text-sm">← Thoát</button>
        <div className="text-center">
          <div className="text-sm text-[#6B6B60]">{currentIdx + 1} / {questions.length}</div>
          <div className="font-mono text-[#F5A623] font-semibold">{formatTime(timeElapsed)}</div>
        </div>
        <div className="text-sm text-[#00A878] font-medium">{loaiChungChi} · {kyNang}</div>
      </div>

      <div className="progress-bar mb-8">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl border border-[#E8E8E0] p-6 mb-6">
        <div className="text-xs text-[#A0A090] mb-2">Câu hỏi {currentIdx + 1}</div>
        <div className="font-medium text-[#0D0D0D] leading-relaxed whitespace-pre-line">{q.noi_dung_cau_hoi}</div>
      </div>

      {/* Options */}
      {q.cac_lua_chon && (
        <div className="space-y-3 mb-8">
          {q.cac_lua_chon.map(opt => (
            <button key={opt.key} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.key }))}
              className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all text-sm ${
                answers[q.id] === opt.key
                  ? 'border-[#0D0D0D] bg-[#F8F7F2] font-medium'
                  : 'border-[#E8E8E0] bg-white hover:border-[#00A878]/40'
              }`}>
              <span className="font-semibold mr-2">{opt.key}.</span>{opt.value}
            </button>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="px-5 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-[#6B6B60] hover:border-[#0D0D0D] hover:text-[#0D0D0D] transition-colors disabled:opacity-30">
          ← Trước
        </button>

        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrentIdx(i)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                i === currentIdx ? 'bg-[#0D0D0D] text-white' :
                answers[questions[i].id] ? 'bg-[#00A878]/20 text-[#00A878]' :
                'bg-white border border-[#E8E8E0] text-[#6B6B60]'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>

        {currentIdx < questions.length - 1 ? (
          <button onClick={() => setCurrentIdx(currentIdx + 1)}
            className="px-5 py-2.5 bg-[#0D0D0D] text-white rounded-xl font-medium hover:bg-[#2C2C28] transition-colors">
            Tiếp →
          </button>
        ) : (
          <button onClick={handleSubmit}
            disabled={Object.keys(answers).length === 0}
            className="px-5 py-2.5 bg-[#00A878] text-white rounded-xl font-semibold hover:bg-[#007A58] transition-colors disabled:opacity-50">
            Nộp bài ✓
          </button>
        )}
      </div>
    </div>
  )
}
