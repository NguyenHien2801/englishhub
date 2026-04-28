'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { calculateNextReview, difficultyToQuality } from '@/lib/dictionary/client'

interface Props {
  words: Record<string, unknown>[]
  setTitle: string
  userId: string
  isReviewMode: boolean
  onBack: () => void
}

type Difficulty = 'easy' | 'good' | 'hard' | 'again'

export default function FlashcardView({ words, setTitle, userId, isReviewMode, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [wordCache, setWordCache] = useState<Record<string, unknown> | null>(null)
  const [loadingCache, setLoadingCache] = useState(false)
  const [finished, setFinished] = useState(false)
  const [stats, setStats] = useState({ easy: 0, good: 0, hard: 0, again: 0 })
  const [isAnimating, setIsAnimating] = useState(false)
  const supabase = createClient()

  const currentWord = words[currentIndex]

  const loadWordCache = useCallback(async (word: string) => {
    setLoadingCache(true)
    setWordCache(null)

    // Check Supabase cache first
    const { data: cached } = await supabase
      .from('TuVungCache')
      .select('*')
      .eq('tu_tieng_anh', word.toLowerCase())
      .single()

    if (cached) {
      setWordCache(cached)
      setLoadingCache(false)
      // Update access count
      supabase.from('TuVungCache').update({ so_lan_truy_cap: (cached.so_lan_truy_cap as number || 0) + 1 })
        .eq('tu_tieng_anh', word.toLowerCase()).then(() => {})
      return
    }

    // Not cached → call our API to fetch + AI generate
    try {
      const res = await fetch(`/api/vocabulary?word=${encodeURIComponent(word)}`)
      const data = await res.json()
      if (data.cache) setWordCache(data.cache)
    } catch {
      toast.error('Không thể tải thông tin từ')
    }
    setLoadingCache(false)
  }, [supabase])

  useEffect(() => {
    if (currentWord && !finished) {
      const wordText = (currentWord.tu_tieng_anh as string) || (currentWord as { TuVung?: { tu_tieng_anh: string } })?.TuVung?.tu_tieng_anh || ''
      if (wordText) loadWordCache(wordText)
      setIsFlipped(false)
    }
  }, [currentIndex, currentWord, finished, loadWordCache])

  async function handleDifficulty(difficulty: Difficulty) {
    if (isAnimating) return
    setStats(prev => ({ ...prev, [difficulty]: prev[difficulty] + 1 }))

    // Update SRS in Supabase
    const wordId = (currentWord.id as string) || ((currentWord as Record<string, unknown>).TuVung as Record<string, unknown>)?.id as string
    if (wordId) {
      const quality = difficultyToQuality(difficulty)
      const { data: existing } = await supabase
        .from('TienDoHocTuVung')
        .select('*')
        .eq('nguoi_dung_id', userId)
        .eq('tu_vung_id', wordId)
        .single()

      const ef = existing?.he_so_de_nho || 2.5
      const reps = existing?.so_lan_lap_lai || 0
      const interval = existing?.khoang_lap_lai || 1
      const { nextInterval, nextEF, nextReps } = calculateNextReview(quality, reps, ef, interval)

      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + nextInterval)

      const newTrangThai = nextReps === 0 ? 'dang_hoc' : nextInterval >= 21 ? 'thuan_thuc' : 'on_tap'

      await supabase.from('TienDoHocTuVung').upsert({
        nguoi_dung_id: userId,
        tu_vung_id: wordId,
        he_so_de_nho: nextEF,
        khoang_lap_lai: nextInterval,
        so_lan_lap_lai: nextReps,
        trang_thai: newTrangThai,
        ngay_on_tiep_theo: nextDate.toISOString().split('T')[0],
        lan_cuoi_on: new Date().toISOString().split('T')[0],
      })
    }

    // Next card
    setIsAnimating(true)
    setTimeout(() => {
      if (currentIndex >= words.length - 1) {
        setFinished(true)
      } else {
        setCurrentIndex(prev => prev + 1)
        setIsFlipped(false)
      }
      setIsAnimating(false)
    }, 300)
  }

  if (finished) {
    const total = stats.easy + stats.good + stats.hard + stats.again
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="text-7xl mb-6">🎉</div>
        <h2 className="font-display text-3xl font-bold text-[#0D0D0D] mb-2">Hoàn thành!</h2>
        <p className="text-[#6B6B60] mb-8">Bạn đã học {total} từ trong bộ "{setTitle}"</p>
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Dễ', count: stats.easy, color: '#00A878' },
            { label: 'Ổn', count: stats.good, color: '#7C7CFF' },
            { label: 'Khó', count: stats.hard, color: '#F5A623' },
            { label: 'Lại', count: stats.again, color: '#FF6B6B' },
          ].map(s => (
            <div key={s.label} className="p-3 bg-white rounded-xl border border-[#E8E8E0]">
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.count}</div>
              <div className="text-xs text-[#6B6B60]">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={onBack} className="px-6 py-3 border-2 border-[#E8E8E0] text-[#0D0D0D] font-medium rounded-xl hover:border-[#0D0D0D] transition-colors">
            ← Quay lại
          </button>
          <button onClick={() => { setCurrentIndex(0); setFinished(false); setStats({ easy: 0, good: 0, hard: 0, again: 0 }) }}
            className="px-6 py-3 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">
            Học lại
          </button>
        </div>
      </div>
    )
  }

  if (!currentWord) return null

  const wordText = (currentWord.tu_tieng_anh as string) || ''
  const progress = ((currentIndex) / words.length) * 100

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-[#6B6B60] hover:text-[#0D0D0D] transition-colors">← Quay lại</button>
        <div className="flex-1">
          <div className="text-sm text-[#6B6B60] mb-1">{setTitle} · {currentIndex + 1}/{words.length}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2 mb-6">
        {[
          { label: '✅ Dễ', count: stats.easy, color: '#E8FFF8' },
          { label: '👍 Ổn', count: stats.good, color: '#F0F0FF' },
          { label: '😓 Khó', count: stats.hard, color: '#FFF8EC' },
          { label: '🔄 Lại', count: stats.again, color: '#FFF0F0' },
        ].map(s => (
          <div key={s.label} className="flex-1 text-center py-1.5 rounded-xl text-xs font-medium text-[#0D0D0D]" style={{ backgroundColor: s.color }}>
            {s.label} {s.count > 0 && <span className="font-bold">{s.count}</span>}
          </div>
        ))}
      </div>

      {/* Flashcard */}
      <div className="flashcard-scene h-80 mb-6" onClick={() => !loadingCache && setIsFlipped(f => !f)}>
        <div className={`flashcard-card cursor-pointer ${isFlipped ? 'is-flipped' : ''}`}>
          {/* Front */}
          <div className="flashcard-front bg-white rounded-3xl border-2 border-[#E8E8E0] flex flex-col items-center justify-center p-8 shadow-sm hover:shadow-md transition-shadow">
            {loadingCache ? (
              <div className="space-y-3 text-center">
                <div className="h-8 w-48 shimmer rounded-lg mx-auto" />
                <div className="h-4 w-32 shimmer rounded mx-auto" />
              </div>
            ) : (
              <>
                <div className="font-display text-5xl font-bold text-[#0D0D0D] mb-3">{wordText}</div>
                {wordCache && (wordCache.phat_am_ipa as string) && (
                  <div className="text-lg text-[#6B6B60] font-mono mb-2">/{wordCache.phat_am_ipa as string}/</div>
                )}
                {wordCache && (wordCache.audio_url as string) && (
                  <button onClick={e => { e.stopPropagation(); new Audio(wordCache.audio_url as string).play() }}
                    className="text-[#00A878] hover:scale-110 transition-transform text-2xl">🔊</button>
                )}
                {(currentWord.loai_tu as string) && (
                  <div className="mt-3 px-3 py-1 bg-[#F8F7F2] rounded-full text-xs text-[#6B6B60]">{currentWord.loai_tu as string}</div>
                )}
                <div className="mt-4 text-sm text-[#A0A090]">Nhấp để xem nghĩa</div>
              </>
            )}
          </div>

          {/* Back */}
          <div className="flashcard-back bg-[#0D0D0D] rounded-3xl border-2 border-[#0D0D0D] flex flex-col p-8 shadow-sm overflow-y-auto">
            {loadingCache ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-[#A0A090]">Đang tải thông tin...</div>
              </div>
            ) : wordCache ? (
              <>
                <div className="font-display text-3xl font-bold text-[#00A878] mb-1">{wordText}</div>
                <div className="text-[#F8F7F2] text-xl font-semibold mb-4">{wordCache.nghia_tieng_viet as string}</div>
                {(wordCache.dinh_nghia_tieng_anh as string) && (
                  <div className="text-[#A0A090] text-sm mb-4 italic">"{wordCache.dinh_nghia_tieng_anh as string}"</div>
                )}
                {(wordCache.vi_du_cau as string[])?.slice(0, 2).map((ex, i) => (
                  <div key={i} className="mb-2 p-3 bg-white/5 rounded-xl">
                    <div className="text-[#F8F7F2] text-sm">{ex}</div>
                    {(wordCache.vi_du_viet as string[])?.[i] && (
                      <div className="text-[#707068] text-xs mt-1">{(wordCache.vi_du_viet as string[])[i]}</div>
                    )}
                  </div>
                ))}
                {(wordCache.cach_nho as string) && (
                  <div className="mt-3 p-3 bg-[#F5A623]/10 border border-[#F5A623]/20 rounded-xl">
                    <div className="text-[#F5A623] text-xs font-semibold mb-1">💡 Cách nhớ</div>
                    <div className="text-[#F8F7F2] text-sm">{wordCache.cach_nho as string}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[#A0A090]">Không có thông tin</div>
            )}
          </div>
        </div>
      </div>

      {/* Difficulty buttons */}
      {isFlipped && (
        <div className="grid grid-cols-4 gap-3">
          {([
            { key: 'again', label: '🔄 Lại', sub: '<1 phút', color: 'bg-[#FFF0F0] border-[#FF6B6B]/30 hover:border-[#FF6B6B] text-[#FF6B6B]' },
            { key: 'hard', label: '😓 Khó', sub: '1 ngày', color: 'bg-[#FFF8EC] border-[#F5A623]/30 hover:border-[#F5A623] text-[#F5A623]' },
            { key: 'good', label: '👍 Ổn', sub: '3 ngày', color: 'bg-[#F0F0FF] border-[#7C7CFF]/30 hover:border-[#7C7CFF] text-[#7C7CFF]' },
            { key: 'easy', label: '✅ Dễ', sub: '7+ ngày', color: 'bg-[#E8FFF8] border-[#00A878]/30 hover:border-[#00A878] text-[#00A878]' },
          ] as { key: Difficulty; label: string; sub: string; color: string }[]).map(btn => (
            <button key={btn.key} onClick={() => handleDifficulty(btn.key)}
              className={`p-3 rounded-xl border-2 transition-all text-center ${btn.color}`}>
              <div className="font-semibold text-sm">{btn.label}</div>
              <div className="text-xs opacity-70">{btn.sub}</div>
            </button>
          ))}
        </div>
      )}
      {!isFlipped && (
        <button onClick={() => setIsFlipped(true)}
          className="w-full py-3.5 bg-[#0D0D0D] text-white font-semibold rounded-xl hover:bg-[#2C2C28] transition-colors">
          Xem nghĩa →
        </button>
      )}
    </div>
  )
}
