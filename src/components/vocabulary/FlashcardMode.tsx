'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { VocabWord, SrsRating } from '@/components/vocabulary/types'
import { saveSrs } from '@/components/vocabulary/types'
import SessionResult from '@/components/vocabulary/SessionResult'

interface Props {
  words: VocabWord[]
  setTitle: string
  userId: string
  isReviewMode: boolean
  onBack: () => void
}

const RATINGS: { id: SrsRating; label: string; sub: string; bg: string; text: string }[] = [
  { id: 'again', label: 'Học lại', sub: '[1]', bg: '#FECACA', text: '#991B1B' },
  { id: 'hard',  label: 'Khó',     sub: '[2]', bg: '#FED7AA', text: '#9A3412' },
  { id: 'good',  label: 'Ổn',      sub: '[3]', bg: '#BBF7D0', text: '#14532D' },
  { id: 'easy',  label: 'Dễ',      sub: '[4]', bg: '#BAE6FD', text: '#0C4A6E' },
]

export default function FlashcardMode({ words, setTitle, userId, isReviewMode, onBack }: Props) {
  const [index, setIndex]     = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [correct, setCorrect] = useState(0)   // good + easy
  const [done, setDone]       = useState(false)
  const supabase = createClient()

  const word    = words[index]
  const cache   = word?.TuVungCache
  const progress = words.length > 0 ? (index / words.length) * 100 : 0

  const flip = useCallback(() => setFlipped(f => !f), [])

  function playAudio() {
    // Ưu tiên 1: audio file từ DB (giọng bản ngữ)
    if (cache?.audio_url) {
      new Audio(cache.audio_url).play().catch(() => speakFallback())
      return
    }
    // Ưu tiên 2: Web Speech API (built-in, không cần DB)
    speakFallback()
  }

  function speakFallback() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(word.tu_tieng_anh)
    utt.lang = 'en-US'
    utt.rate = 0.85
    utt.pitch = 1
    // Ưu tiên giọng en-US nếu có
    const voices = window.speechSynthesis.getVoices()
    const enVoice = voices.find(v => v.lang === 'en-US') ?? voices.find(v => v.lang.startsWith('en'))
    if (enVoice) utt.voice = enVoice
    window.speechSynthesis.speak(utt)
  }

  async function rate(rating: SrsRating) {
    if (!word || saving) return
    setSaving(true)
    try {
      await saveSrs(supabase, userId, word.id, word.TienDoHocTuVung[0], rating)
    } catch {
      toast.error('Lưu tiến độ thất bại')
    }
    if (rating === 'good' || rating === 'easy') setCorrect(c => c + 1)
    if (index + 1 >= words.length) {
      setDone(true)
    } else {
      setFlipped(false)
      setTimeout(() => setIndex(i => i + 1), 120)
    }
    setSaving(false)
  }

  if (done) return (
    <SessionResult
      total={words.length} correct={correct}
      setTitle={setTitle} mode="flashcard"
      onBack={onBack}
      onRetry={() => { setIndex(0); setFlipped(false); setCorrect(0); setDone(false) }}
    />
  )

  if (!word) return null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-sm text-[#6B6B60] hover:text-[#0D0D0D] transition-colors shrink-0">
          ← Quay lại
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-[#A0A090] mb-1">
            <span className="truncate">{setTitle}</span>
            <span className="shrink-0 ml-2">{index + 1} / {words.length}</span>
          </div>
          <div className="h-1.5 bg-[#F1EFE8] rounded-full overflow-hidden">
            <div className="h-full bg-[#00A878] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Card flip */}
      <div className="relative cursor-pointer select-none" style={{ perspective: '1200px', minHeight: 300 }} onClick={flip}>
        <div className="relative w-full transition-transform duration-500" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)', minHeight: 300 }}>

          {/* Front */}
          <div className="absolute inset-0 bg-white border-2 border-[#E8E8E0] rounded-3xl p-8 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}>
            {word.cap_do && (
              <span className="text-xs px-2.5 py-0.5 bg-[#F1EFE8] text-[#6B6B60] rounded-full mb-5">{word.cap_do}</span>
            )}
            <h2 className="text-4xl font-bold text-[#0D0D0D] text-center mb-3">{word.tu_tieng_anh}</h2>
            <div className="flex items-center gap-2 mt-1">
              {cache?.phat_am_ipa && (
                <span className="text-[#6B6B60] font-mono text-lg">/{cache.phat_am_ipa}/</span>
              )}
              <button onClick={e => { e.stopPropagation(); playAudio() }}
                title={cache?.audio_url ? 'Phát âm (file)' : 'Phát âm (tổng hợp)'}
                className="text-[#00A878] hover:text-[#007A5E] transition-colors text-xl leading-none">
                {cache?.audio_url ? '🔊' : '🔈'}
              </button>
            </div>
            {word.loai_tu && <span className="mt-2 text-xs text-[#A0A090] italic">{word.loai_tu}</span>}
            <p className="mt-8 text-xs text-[#C0C0B8]">Nhấn để xem nghĩa</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 bg-white border-2 border-[#00A878]/40 rounded-3xl p-8 flex flex-col gap-4 overflow-y-auto"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <div>
              <p className="text-[10px] font-semibold text-[#A0A090] uppercase tracking-widest mb-1">Nghĩa tiếng Việt</p>
              <p className="text-2xl font-bold text-[#0D0D0D]">
                {cache?.nghia_tieng_viet ?? <span className="text-base text-[#A0A090] italic">Chưa có dữ liệu</span>}
              </p>
            </div>

            {cache?.dinh_nghia_tieng_anh && (
              <div>
                <p className="text-[10px] font-semibold text-[#A0A090] uppercase tracking-widest mb-1">Definition</p>
                <p className="text-sm text-[#6B6B60] italic leading-relaxed">{cache.dinh_nghia_tieng_anh}</p>
              </div>
            )}

            {cache?.vi_du_cau?.[0] && (
              <div>
                <p className="text-[10px] font-semibold text-[#A0A090] uppercase tracking-widest mb-1">Ví dụ</p>
                <p className="text-sm text-[#0D0D0D]">{cache.vi_du_cau[0]}</p>
                {cache.vi_du_viet?.[0] && <p className="text-xs text-[#6B6B60] mt-0.5">{cache.vi_du_viet[0]}</p>}
              </div>
            )}

            {cache?.cach_nho && (
              <div className="p-3 bg-[#FFFBEB] rounded-xl border border-[#FDE68A]">
                <p className="text-[10px] font-semibold text-[#92400E] uppercase tracking-widest mb-1">💡 Mẹo ghi nhớ</p>
                <p className="text-sm text-[#78350F] leading-relaxed">{cache.cach_nho}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      <div className={`mt-5 transition-all duration-300 ${flipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
        <p className="text-center text-xs text-[#A0A090] mb-3">Bạn nhớ từ này ở mức nào?</p>
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map(r => (
            <button key={r.id} onClick={() => rate(r.id)} disabled={saving}
              className="py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: r.bg, color: r.text }}>
              {r.label}
              <span className="block text-xs font-normal opacity-50 mt-0.5">{r.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
