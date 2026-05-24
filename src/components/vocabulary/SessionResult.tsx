'use client'

interface Props {
  total: number
  correct: number
  setTitle: string
  mode: 'flashcard' | 'quiz' | 'matching'
  onBack: () => void
  onRetry: () => void
}

const MODE_LABEL = { flashcard: '🃏 Flashcard', quiz: '✏️ Quiz', matching: '🔗 Matching' }

export default function SessionResult({ total, correct, setTitle, mode, onBack, onRetry }: Props) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const { emoji, title, color } =
    pct >= 80 ? { emoji: '🏆', title: 'Xuất sắc!',    color: '#00A878' } :
    pct >= 60 ? { emoji: '👍', title: 'Khá tốt!',     color: '#F5A623' } :
                { emoji: '💪', title: 'Cố lên nào!',  color: '#EF4444' }

  return (
    <div className="max-w-sm mx-auto text-center py-10 px-4">
      <div className="text-5xl mb-3">{emoji}</div>
      <h2 className="text-2xl font-bold text-[#0D0D0D] mb-1">{title}</h2>
      <p className="text-sm text-[#6B6B60] mb-7">{setTitle} · {MODE_LABEL[mode]}</p>

      {/* Ring */}
      <div className="relative w-28 h-28 mx-auto mb-7">
        <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F1EFE8" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#0D0D0D]">{pct}%</span>
          <span className="text-xs text-[#A0A090]">{correct}/{total}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {[
          { label: 'Tổng từ',  value: total,           cls: 'bg-white border border-[#E8E8E0] text-[#0D0D0D]' },
          { label: 'Đúng',     value: correct,          cls: 'bg-[#E8FFF8] border border-[#5DCAA5] text-[#085041]' },
          { label: 'Cần ôn',   value: total - correct,  cls: 'bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B]' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-3 ${s.cls}`}>
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs mt-0.5 opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* XP badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF8EC] border border-[#FDE68A] rounded-xl mb-7">
        <span>⚡</span>
        <span className="text-sm font-semibold text-[#92400E]">+{correct * 5} XP</span>
        <span className="text-xs text-[#A0A090]">· SRS đã lưu</span>
      </div>

      <div className="flex flex-col gap-2.5">
        <button onClick={onRetry}
          className="w-full py-3.5 rounded-xl font-semibold text-white bg-[#0D0D0D] hover:bg-[#333] transition-colors">
          Học lại 🔄
        </button>
        <button onClick={onBack}
          className="w-full py-3.5 rounded-xl font-semibold text-[#0D0D0D] bg-white border-2 border-[#E8E8E0] hover:border-[#0D0D0D] transition-colors">
          Chọn bộ từ khác
        </button>
      </div>
    </div>
  )
}
