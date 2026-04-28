'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface QuizQ { id: number; type: string; question: string; options?: { key: string; value: string }[]; answer: string; explanation: string }
interface Section { title: string; content: string; formula?: string; examples: { en: string; vi: string }[]; signal_words?: string[] }

interface Props {
  lesson: Record<string, unknown>
  userId: string
  isCompleted: boolean
  onBack: () => void
}

export default function GrammarLesson({ lesson, userId, isCompleted, onBack }: Props) {
  const [tab, setTab] = useState<'learn' | 'practice'>('learn')
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const supabase = createClient()

  const content = lesson.noi_dung_json as { sections: Section[] }
  const practice = lesson.bai_tap_json as { questions: QuizQ[] } | null

  async function handleSubmit() {
    const qs = practice?.questions || []
    let correct = 0
    qs.forEach((q: QuizQ) => { if (answers[q.id] === q.answer) correct++ })
    const pct = Math.round((correct / qs.length) * 100)
    setScore(pct)
    setSubmitted(true)

    await supabase.from('TienDoNguPhap').upsert({
      nguoi_dung_id: userId,
      bai_hoc_id: lesson.id,
      da_hoan_thanh: pct >= 60,
      diem_bai_tap: pct,
      ngay_hoan_thanh: new Date().toISOString(),
    })

    if (pct >= 60) toast.success(`🎉 Xuất sắc! ${correct}/${qs.length} câu đúng`)
    else toast(`${correct}/${qs.length} câu đúng. Học lại nhé!`, { icon: '📖' })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-[#6B6B60] hover:text-[#0D0D0D] transition-colors">← Quay lại</button>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#FFF8EC] text-xs font-semibold rounded-lg">{lesson.cap_do as string}</span>
           {lesson.danh_muc !== undefined && lesson.danh_muc !== null && (<span className="text-xs text-[#A0A090]">{String(lesson.danh_muc)}</span>)}
            {isCompleted && <span className="text-xs text-[#00A878]">✓ Đã hoàn thành</span>}
          </div>
          <h1 className="font-display text-2xl font-bold text-[#0D0D0D]">{lesson.tieu_de as string}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'learn', label: '📖 Lý thuyết' },
          { key: 'practice', label: '✏️ Bài tập' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as 'learn' | 'practice')}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${tab === t.key ? 'bg-[#0D0D0D] text-white' : 'bg-white border border-[#E8E8E0] text-[#6B6B60] hover:border-[#0D0D0D]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'learn' && (
        <div className="space-y-6">
          {content.sections.map((sec: Section, i: number) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E8E8E0] p-6">
              <h2 className="font-display font-bold text-xl text-[#0D0D0D] mb-3">{sec.title}</h2>
              <p className="text-[#484840] mb-4 leading-relaxed">{sec.content}</p>
              {sec.formula && (
                <div className="mb-4 p-4 bg-[#0D0D0D] rounded-xl font-mono text-[#00A878] text-sm">
                  {sec.formula}
                </div>
              )}
              {sec.examples?.map((ex: { en: string; vi: string }, j: number) => (
                <div key={j} className="mb-3 pl-4 border-l-2 border-[#00A878]/30">
                  <div className="text-[#0D0D0D] font-medium">{ex.en}</div>
                  <div className="text-[#6B6B60] text-sm">{ex.vi}</div>
                </div>
              ))}
{sec.signal_words && Array.isArray(sec.signal_words) && sec.signal_words.length > 0 && (
  <div className="mt-4">
    <div className="text-xs font-semibold text-[#A0A090] mb-2">TỪ HIỆU LỆNH</div>
    <div className="flex flex-wrap gap-2">
      {sec.signal_words.map((w: string, k: number) => (
        <span key={k} className="px-3 py-1 bg-[#E8FFF8] text-[#00A878] text-xs font-medium rounded-full">{w}</span>
      ))}
    </div>
  </div>
)}
            </div>
          ))}
          {practice && (
            <button onClick={() => setTab('practice')}
              className="w-full py-3.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">
              Làm bài tập ({practice.questions.length} câu) →
            </button>
          )}
        </div>
      )}

      {tab === 'practice' && practice && (
        <div className="space-y-6">
          {practice.questions.map((q: QuizQ) => (
            <div key={q.id} className="bg-white rounded-2xl border border-[#E8E8E0] p-6">
              <div className="font-medium text-[#0D0D0D] mb-4">
                <span className="text-xs text-[#A0A090] mr-2">Câu {q.id}.</span>
                {q.question}
              </div>
              {q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt: { key: string; value: string }) => {
                    let style = 'border-[#E8E8E0] hover:border-[#00A878]/50'
                    if (submitted) {
                      if (opt.key === q.answer) style = 'border-[#00A878] bg-[#E8FFF8]'
                      else if (opt.key === answers[q.id]) style = 'border-[#FF6B6B] bg-[#FFF0F0]'
                    } else if (answers[q.id] === opt.key) {
                      style = 'border-[#0D0D0D] bg-[#F8F7F2]'
                    }
                    return (
                      <button key={opt.key} onClick={() => !submitted && setAnswers(prev => ({ ...prev, [q.id]: opt.key }))}
                        disabled={submitted}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${style}`}>
                        <span className="font-semibold mr-2">{opt.key}.</span>{opt.value}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <input type="text" value={answers[q.id] || ''} onChange={e => !submitted && setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Nhập đáp án..." disabled={submitted}
                  className="w-full px-4 py-3 border-2 border-[#E8E8E0] rounded-xl focus:outline-none focus:border-[#00A878] transition-colors font-mono" />
              )}
              {submitted && q.explanation && (
                <div className="mt-3 p-3 bg-[#FFF8EC] border border-[#F5A623]/20 rounded-xl text-sm text-[#484840]">
                  💡 {q.explanation}
                </div>
              )}
            </div>
          ))}

          {!submitted ? (
            <button onClick={handleSubmit}
              disabled={Object.keys(answers).length < practice.questions.length}
              className="w-full py-3.5 bg-[#0D0D0D] text-white font-semibold rounded-xl hover:bg-[#2C2C28] transition-colors disabled:opacity-50">
              Nộp bài ({Object.keys(answers).length}/{practice.questions.length} câu)
            </button>
          ) : (
            <div className="p-6 bg-white rounded-2xl border-2 border-[#00A878]/30 text-center">
              <div className="text-4xl mb-2">{score >= 80 ? '🎉' : score >= 60 ? '👍' : '📖'}</div>
              <div className="font-display text-3xl font-bold text-[#0D0D0D] mb-1">{score}%</div>
              <div className="text-[#6B6B60] mb-4">{score >= 80 ? 'Xuất sắc!' : score >= 60 ? 'Tốt lắm!' : 'Cần ôn luyện thêm'}</div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setAnswers({}); setSubmitted(false) }}
                  className="px-5 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-[#0D0D0D] font-medium hover:border-[#0D0D0D] transition-colors">
                  Làm lại
                </button>
                <button onClick={onBack}
                  className="px-5 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">
                  Bài tiếp theo →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
