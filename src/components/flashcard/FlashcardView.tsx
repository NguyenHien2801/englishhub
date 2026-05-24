// FlashcardView.tsx — wrapper giữ nguyên interface cũ, dùng FlashcardMode mới bên trong
// Không còn gọi AI realtime nữa — dùng dữ liệu từ TuVungCache trong SQL
'use client'
import FlashcardMode from '@/components/vocabulary/FlashcardMode'
import type { VocabWord } from '@/components/vocabulary/types'

interface Props {
  words: Record<string, unknown>[]
  setTitle: string
  userId: string
  isReviewMode: boolean
  onBack: () => void
}

export default function FlashcardView({ words, setTitle, userId, isReviewMode, onBack }: Props) {
  // Ép kiểu sang VocabWord — các field còn thiếu sẽ là null/[]
  const typedWords: VocabWord[] = words.map(w => ({
    id: w.id as string,
    tu_tieng_anh: w.tu_tieng_anh as string,
    loai_tu: (w.loai_tu as string) ?? null,
    cap_do: (w.cap_do as string) ?? null,
    thu_tu_hien_thi: (w.thu_tu_hien_thi as number) ?? 0,
    TuVungCache: (w.TuVungCache as VocabWord['TuVungCache']) ?? null,
    TienDoHocTuVung: (w.TienDoHocTuVung as VocabWord['TienDoHocTuVung']) ?? [],
  }))

  return (
    <FlashcardMode
      words={typedWords}
      setTitle={setTitle}
      userId={userId}
      isReviewMode={isReviewMode}
      onBack={onBack}
    />
  )
}
