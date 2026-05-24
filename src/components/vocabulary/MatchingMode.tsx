'use client'
import { useState, useEffect } from 'react'
import type { VocabWord } from '@/components/vocabulary/types'
import SessionResult from '@/components/vocabulary/SessionResult'

interface Props {
  words: VocabWord[]
  setTitle: string
  userId: string
  isReviewMode: boolean
  onBack: () => void
}

interface Tile { id: string; wordId: string; text: string; side: 'en' | 'vi' }

const BATCH = 6

function makeTiles(batch: VocabWord[]): Tile[] {
  const tiles: Tile[] = []
  for (const w of batch) {
    const nghia = w.TuVungCache?.nghia_tieng_viet
    if (!nghia) continue
    tiles.push({ id: `${w.id}-en`, wordId: w.id, text: w.tu_tieng_anh, side: 'en' })
    tiles.push({ id: `${w.id}-vi`, wordId: w.id, text: nghia,           side: 'vi' })
  }
  return tiles.sort(() => Math.random() - 0.5)
}

export default function MatchingMode({ words, setTitle, userId, isReviewMode, onBack }: Props) {
  const valid       = words.filter(w => w.TuVungCache?.nghia_tieng_viet)
  const totalBatch  = Math.ceil(valid.length / BATCH)

  const [batchIdx, setBatchIdx]   = useState(0)
  const [tiles, setTiles]         = useState<Tile[]>([])
  const [matched, setMatched]     = useState<Set<string>>(new Set())   // wordIds
  const [selected, setSelected]   = useState<Tile | null>(null)
  const [wrongIds, setWrongIds]   = useState<string[]>([])             // tile ids flashing red
  const [totalOk, setTotalOk]     = useState(0)
  const [done, setDone]           = useState(false)

  useEffect(() => { loadBatch(0) }, [])

  function loadBatch(idx: number) {
    const slice = valid.slice(idx * BATCH, idx * BATCH + BATCH)
    setTiles(makeTiles(slice))
    setMatched(new Set())
    setSelected(null)
    setWrongIds([])
  }

  function tap(tile: Tile) {
    if (matched.has(tile.wordId) || wrongIds.length) return
    if (selected?.id === tile.id) { setSelected(null); return }

    if (!selected) { setSelected(tile); return }

    // Same side → swap
    if (selected.side === tile.side) { setSelected(tile); return }

    if (selected.wordId === tile.wordId) {
      // ✅ Match
      const next = new Set(matched); next.add(tile.wordId); setMatched(next)
      setTotalOk(n => n + 1)
      setSelected(null)

      if (next.size === tiles.length / 2) {
        const nextBatch = batchIdx + 1
        if (nextBatch >= totalBatch) { setTimeout(() => setDone(true), 500) }
        else { setTimeout(() => { setBatchIdx(nextBatch); loadBatch(nextBatch) }, 700) }
      }
    } else {
      // ❌ Wrong
      setWrongIds([selected.id, tile.id])
      setTimeout(() => { setWrongIds([]); setSelected(null) }, 800)
    }
  }

  if (done) return (
    <SessionResult
      total={valid.length} correct={totalOk}
      setTitle={setTitle} mode="matching"
      onBack={onBack}
      onRetry={() => { setBatchIdx(0); loadBatch(0); setTotalOk(0); setDone(false) }}
    />
  )

  if (valid.length < 2) return (
    <div className="text-center py-16 text-[#A0A090]">
      Bộ từ cần ít nhất 2 từ có nghĩa để chơi Matching.{' '}
      <button onClick={onBack} className="text-[#00A878] underline">Quay lại</button>
    </div>
  )

  const enTiles = tiles.filter(t => t.side === 'en')
  const viTiles = tiles.filter(t => t.side === 'vi')
  const doneSoFar = batchIdx * BATCH + matched.size
  const pct = valid.length > 0 ? (doneSoFar / valid.length) * 100 : 0

  function tileClass(t: Tile) {
    if (matched.has(t.wordId))   return 'border-[#00A878] bg-[#E8FFF8] text-[#085041] opacity-40 scale-95 cursor-default'
    if (wrongIds.includes(t.id)) return 'border-[#EF4444] bg-[#FEF2F2] text-[#991B1B] animate-shake'
    if (selected?.id === t.id)   return 'border-[#0D0D0D] bg-[#F8F7F2] text-[#0D0D0D] scale-105 shadow-lg'
    return 'border-[#E8E8E0] bg-white text-[#0D0D0D] hover:border-[#00A878]/60 hover:shadow-sm'
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-sm text-[#6B6B60] hover:text-[#0D0D0D] transition-colors shrink-0">← Quay lại</button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-[#A0A090] mb-1">
            <span className="truncate">{setTitle}</span>
            <span className="shrink-0 ml-2">{doneSoFar} / {valid.length} cặp</span>
          </div>
          <div className="h-1.5 bg-[#F1EFE8] rounded-full overflow-hidden">
            <div className="h-full bg-[#00A878] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-[#6B6B60] mb-4">Chọn một từ tiếng Anh và nghĩa tương ứng</p>

      {/* Two-column grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2.5">
          <p className="text-[10px] font-semibold text-[#A0A090] uppercase tracking-widest text-center mb-1">Tiếng Anh</p>
          {enTiles.map(t => (
            <button key={t.id} onClick={() => tap(t)}
              className={`w-full px-4 py-3 rounded-xl border-2 font-semibold text-sm text-center transition-all duration-150 ${tileClass(t)}`}>
              {t.text}
              {matched.has(t.wordId) && <span className="ml-1.5 text-[#00A878]">✓</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          <p className="text-[10px] font-semibold text-[#A0A090] uppercase tracking-widest text-center mb-1">Tiếng Việt</p>
          {viTiles.map(t => (
            <button key={t.id} onClick={() => tap(t)}
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-center transition-all duration-150 ${tileClass(t)}`}>
              {t.text}
              {matched.has(t.wordId) && <span className="ml-1.5 text-[#00A878]">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Batch dots */}
      {totalBatch > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          {Array.from({ length: totalBatch }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300
              ${i < batchIdx ? 'w-5 bg-[#00A878]' : i === batchIdx ? 'w-5 bg-[#0D0D0D]' : 'w-2.5 bg-[#E8E8E0]'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
