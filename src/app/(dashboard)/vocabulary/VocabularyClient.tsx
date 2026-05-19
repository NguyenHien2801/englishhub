'use client'
import { useState } from 'react'
import FlashcardView from '@/components/flashcard/FlashcardView'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface Props {
  sets: Record<string, unknown>[]
  dueWords: Record<string, unknown>[]
  userId: string
}

const LOAI_COLORS: Record<string, string> = {
  TOEIC: '#E8FFF8',
  VSTEP: '#F0F0FF',
  APTIS: '#FFF8EC',
  CHU_DE: '#FFF0F0',
  TU_TAO: '#F8F7F2',
}

export default function VocabularyClient({ sets, dueWords, userId }: Props) {
  const [mode, setMode] = useState<'browse' | 'flashcard' | 'review'>('browse')
  const [selectedSet, setSelectedSet] = useState<Record<string, unknown> | null>(null)
  const [setWords, setSetWords] = useState<Record<string, unknown>[]>([])
  const [loadingSet, setLoadingSet] = useState<string | null>(null)
  const supabase = createClient()

async function loadSetWords(set: Record<string, unknown>) {
  setLoadingSet(set.id as string)
  
  const { data: wordsRaw } = await supabase
    .from('TuVung')
    .select(`
      *,
      TuVungCache(*),
      TienDoHocTuVung(*)
    `)
    .eq('bo_du_vung_id', set.id)
    .order('thu_tu_hien_thi')

  // Filter TienDoHocTuVung phía client
  const words = (wordsRaw || []).map(word => ({
    ...word,
    TienDoHocTuVung: ((word.TienDoHocTuVung as Record<string, unknown>[]) || [])
      .filter(td => td.nguoi_dung_id === userId)
  }))

  setSelectedSet(set)
  setSetWords(words)
  setMode('flashcard')
  setLoadingSet(null)
}

  async function startReview() {
    if (dueWords.length === 0) {
      toast.success('Không có từ nào cần ôn hôm nay! 🎉')
      return
    }
    const words = dueWords.map(d => (d as Record<string, unknown>).TuVung as Record<string, unknown>)
    setSetWords(words)
    setSelectedSet({ ten_bo: 'Ôn tập hôm nay' })
    setMode('review')
  }

  if (mode === 'flashcard' || mode === 'review') {
    return (
      <FlashcardView
        words={setWords}
        setTitle={(selectedSet?.ten_bo as string) || ''}
        userId={userId}
        isReviewMode={mode === 'review'}
        onBack={() => { setMode('browse'); setSelectedSet(null); setSetWords([]) }}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Từ vựng</h1>
          <p className="text-[#6B6B60] mt-1">Học thông minh với Flashcard SRS + AI Gemini</p>
        </div>
        {dueWords.length > 0 && (
          <button onClick={startReview}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] text-white font-semibold rounded-xl hover:bg-[#E09000] transition-colors shadow-sm">
            <span>📋</span> Ôn tập ({dueWords.length} từ)
          </button>
        )}
      </div>

      {/* How it works banner */}
      <div className="mb-6 p-5 bg-[#0D0D0D] rounded-2xl text-white flex items-center gap-6">
        <div className="text-3xl">🤖</div>
        <div className="flex-1">
          <div className="font-semibold mb-1">Công nghệ Hybrid AI</div>
          <div className="text-[#A0A090] text-sm">Không cần nhập từ thủ công! Hệ thống tự động lấy phát âm từ Dictionary API và để AI Gemini sinh nghĩa tiếng Việt, ví dụ, cách nhớ theo ngữ cảnh thi cử.</div>
        </div>
      </div>

      {/* Vocabulary sets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sets.map(set => (
          <button key={set.id as string} onClick={() => loadSetWords(set)}
            disabled={loadingSet === set.id}
            className="p-5 bg-white rounded-2xl border-2 border-[#E8E8E0] text-left hover:border-[#00A878]/50 hover:shadow-md transition-all group disabled:opacity-60">
            <div className="flex items-start justify-between mb-3">
              <div className="px-2 py-1 rounded-lg text-xs font-semibold text-[#0D0D0D]"
                style={{ backgroundColor: LOAI_COLORS[set.loai_bo as string] || '#F8F7F2' }}>
                {set.loai_bo as string}
              </div>
              <div className="text-xs text-[#A0A090]">{set.cap_do as string}</div>
            </div>
            <h3 className="font-semibold text-[#0D0D0D] mb-1 group-hover:text-[#00A878] transition-colors">
              {loadingSet === set.id ? 'Đang tải...' : set.ten_bo as string}
            </h3>
            <p className="text-xs text-[#6B6B60] mb-3">{set.mo_ta as string}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#A0A090]">🃏 {set.tong_so_tu as number} từ</span>
              {(set.chu_de as string) && <span className="text-xs px-2 py-0.5 bg-[#F8F7F2] rounded-full text-[#6B6B60]">{set.chu_de as string}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
