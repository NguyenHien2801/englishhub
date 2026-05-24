'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VocabWord } from '@/components/vocabulary/types'
import { saveSrs } from '@/components/vocabulary/types'
import SessionResult from '@/components/vocabulary/SessionResult'

interface Props {
  words: VocabWord[]
  setTitle: string
  userId: string
  isReviewMode: boolean
  onBack: () => void
}

interface BuiltQ {
  wordId: string
  cau_hoi: string
  dap_an: string[]
  correctIndex: number
}

function buildQuestions(words: VocabWord[]): BuiltQ[] {
  const allMeanings = words.map(w => w.TuVungCache?.nghia_tieng_viet).filter(Boolean) as string[]

  return words.flatMap(word => {
    const cache = word.TuVungCache

    // Ưu tiên cau_hoi_quiz có sẵn trong DB
    if (cache?.cau_hoi_quiz?.length) {
      return cache.cau_hoi_quiz.map(q => ({
        wordId: word.id,
        cau_hoi: q.cau_hoi,
        dap_an: q.dap_an,
        correctIndex: q.dung,
      }))
    }

    // Fallback: tự tạo từ nghĩa của các từ khác
    const correct = cache?.nghia_tieng_viet
    if (!correct) return []

    const wrongs = allMeanings.filter(m => m !== correct).sort(() => Math.random() - 0.5).slice(0, 3)
    if (wrongs.length < 1) return []

    const correctIndex = Math.floor(Math.random() * (wrongs.length + 1))
    const dap_an = [...wrongs.slice(0, correctIndex), correct, ...wrongs.slice(correctIndex)]

    return [{ wordId: word.id, cau_hoi: `"${word.tu_tieng_anh}" có nghĩa là gì?`, dap_an, correctIndex }]
  })
}

export default function QuizMode({ words, setTitle, userId, isReviewMode, onBack }: Props) {
  const [questions, setQuestions] = useState<BuiltQ[]>([])
  const [index, setIndex]         = useState(0)
  const [selected, setSelected]   = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [correct, setCorrect]     = useState(0)
  const [done, setDone]           = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setQuestions([...buildQuestions(words)].sort(() => Math.random() - 0.5))
  }, [words])

  const q        = questions[index]
  const progress = questions.length > 0 ? (index / questions.length) * 100 : 0
  const isRight  = confirmed && selected === q?.correctIndex

  async function confirm() {
    if (selected === null || !q) return
    setConfirmed(true)
    const right = selected === q.correctIndex
    if (right) setCorrect(c => c + 1)

    // SRS update: correct → good, wrong → again
    const word = words.find(w => w.id === q.wordId)
    if (word) {
      await saveSrs(supabase, userId, word.id, word.TienDoHocTuVung[0], right ? 'good' : 'again').catch(() => {})
    }
  }

  function next() {
    if (index + 1 >= questions.length) { setDone(true); return }
    setSelected(null); setConfirmed(false); setIndex(i => i + 1)
  }

  if (done) return (
    <SessionResult
      total={questions.length} correct={correct}
      setTitle={setTitle} mode="quiz"
      onBack={onBack}
      onRetry={() => {
        setQuestions([...buildQuestions(words)].sort(() => Math.random() - 0.5))
        setIndex(0); setSelected(null); setConfirmed(false); setCorrect(0); setDone(false)
      }}
    />
  )

  if (!q) return (
    <div className="text-center py-16 text-[#A0A090]">
      Bộ từ chưa đủ dữ liệu để tạo quiz.{' '}
      <button onClick={onBack} className="text-[#00A878] underline">Quay lại</button>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-sm text-[#6B6B60] hover:text-[#0D0D0D] transition-colors shrink-0">← Quay lại</button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-[#A0A090] mb-1">
            <span className="truncate">{setTitle}</span>
            <span className="shrink-0 ml-2">{index + 1} / {questions.length}</span>
          </div>
          <div className="h-1.5 bg-[#F1EFE8] rounded-full overflow-hidden">
            <div className="h-full bg-[#00A878] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="text-sm font-semibold text-[#00A878] shrink-0">{correct} ✓</span>
      </div>

      {/* Question */}
      <div className="bg-white border-2 border-[#E8E8E0] rounded-3xl p-8 mb-5">
        <p className="text-[10px] font-semibold text-[#A0A090] uppercase tracking-widest mb-3">Câu {index + 1}</p>
        <p className="text-xl font-bold text-[#0D0D0D] leading-relaxed">{q.cau_hoi}</p>
      </div>

      {/* Choices */}
      <div className="flex flex-col gap-2.5 mb-5">
        {q.dap_an.map((ans, idx) => {
          let cls = 'border-[#E8E8E0] bg-white text-[#0D0D0D] hover:border-[#00A878]/60 hover:bg-[#F0FDF9]'
          if (confirmed) {
            if (idx === q.correctIndex)              cls = 'border-[#00A878] bg-[#E8FFF8] text-[#085041]'
            else if (idx === selected)               cls = 'border-[#EF4444] bg-[#FEF2F2] text-[#991B1B]'
            else                                     cls = 'border-[#E8E8E0] bg-white text-[#C0C0B8] opacity-60'
          } else if (selected === idx)               cls = 'border-[#0D0D0D] bg-[#F8F7F2] text-[#0D0D0D]'

          return (
            <button key={idx} onClick={() => !confirmed && setSelected(idx)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left font-medium transition-all ${cls}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border transition-colors
                ${confirmed && idx === q.correctIndex ? 'border-[#00A878] bg-[#00A878] text-white' :
                  confirmed && idx === selected       ? 'border-[#EF4444] bg-[#EF4444] text-white' :
                  selected === idx                    ? 'border-[#0D0D0D] bg-[#0D0D0D] text-white' :
                                                        'border-[#E8E8E0] text-[#A0A090]'}`}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{ans}</span>
              {confirmed && idx === q.correctIndex && <span>✅</span>}
              {confirmed && idx === selected && idx !== q.correctIndex && <span>❌</span>}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {confirmed && (
        <div className={`rounded-2xl p-4 mb-4 ${isRight ? 'bg-[#E8FFF8] border border-[#5DCAA5]' : 'bg-[#FEF2F2] border border-[#FCA5A5]'}`}>
          <p className={`font-bold mb-1 ${isRight ? 'text-[#085041]' : 'text-[#991B1B]'}`}>
            {isRight ? '🎉 Chính xác!' : '❌ Sai rồi!'}
          </p>
          {!isRight && (
            <p className="text-sm text-[#6B6B60]">
              Đáp án đúng: <strong className="text-[#0D0D0D]">{q.dap_an[q.correctIndex]}</strong>
            </p>
          )}
        </div>
      )}

      {/* Action */}
      {!confirmed
        ? <button onClick={confirm} disabled={selected === null}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-[#0D0D0D] hover:bg-[#333] transition-colors disabled:opacity-40">
            Kiểm tra
          </button>
        : <button onClick={next}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-[#00A878] hover:bg-[#007A5E] transition-colors">
            {index + 1 >= questions.length ? 'Xem kết quả →' : 'Câu tiếp theo →'}
          </button>
      }
    </div>
  )
}
