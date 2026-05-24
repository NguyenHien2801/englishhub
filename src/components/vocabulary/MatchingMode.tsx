'use client'
import { useState, useEffect } from 'react'
import type { VocabWord } from '@/components/vocabulary/types'
import SessionResult from '@/components/vocabulary/SessionResult'
import { ArrowLeft, Check } from 'lucide-react'

interface Props {
  words: VocabWord[]
  setTitle: string
  userId: string
  isReviewMode: boolean
  onBack: () => void
  onBackToModes: () => void
}

interface Tile { id: string; wordId: string; text: string; side: 'en' | 'vi' }

const BATCH = 6

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       '#F8F5EE',
  white:    '#FFFFFF',
  navy:     '#0F1C35',
  gold:     '#C9A84C',
  goldPale: '#FDF8EE',
  border:   'rgba(201,168,76,0.18)',
  borderMd: 'rgba(201,168,76,0.30)',
  text:     '#1A1E2E',
  textMid:  '#4A5568',
  textLt:   '#94A3B8',
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes popIn   { 0%{transform:scale(.92)} 60%{transform:scale(1.04)} 100%{transform:scale(1)} }
  .fade-in  { animation: fadeUp .38s cubic-bezier(.16,1,.3,1) both; }
  .shake    { animation: shake .45s cubic-bezier(.36,.07,.19,.97) both; }
  .pop-in   { animation: popIn .3s cubic-bezier(.34,1.56,.64,1) both; }
  .tile-btn { transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, border-color .15s, background .15s; }
  .tile-btn:hover:not(:disabled) { transform: translateY(-2px); }
  .tile-btn:active:not(:disabled) { transform: scale(.97); }
  .back-btn { transition: all .2s; }
  .back-btn:hover { opacity: .7; transform: translateX(-2px); }
  .batch-dot { transition: all .35s cubic-bezier(.16,1,.3,1); }
`

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

type TileState = 'idle' | 'selected' | 'matched' | 'wrong'

function getTileStyle(state: TileState): React.CSSProperties {
  switch (state) {
    case 'selected': return {
      border: `2px solid ${C.navy}`,
      background: C.goldPale,
      color: C.navy,
      boxShadow: '0 6px 20px rgba(15,28,53,.12)',
      transform: 'translateY(-2px) scale(1.02)',
    }
    case 'matched': return {
      border: '2px solid rgba(0,168,120,.35)',
      background: '#E1F5EE',
      color: '#0F6E56',
      opacity: 0.55,
      cursor: 'default',
    }
    case 'wrong': return {
      border: '2px solid rgba(240,100,100,.5)',
      background: '#FEF2F2',
      color: '#A32D2D',
    }
    default: return {
      border: `1.5px solid ${C.border}`,
      background: C.white,
      color: C.text,
    }
  }
}

export default function FlashcardMode({ words, setTitle, userId, isReviewMode, onBack, onBackToModes }: Props) {
  const valid      = words.filter(w => w.TuVungCache?.nghia_tieng_viet)
  const totalBatch = Math.ceil(valid.length / BATCH)

  const [batchIdx, setBatchIdx] = useState(0)
  const [tiles, setTiles]       = useState<Tile[]>([])
  const [matched, setMatched]   = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Tile | null>(null)
  const [wrongIds, setWrongIds] = useState<string[]>([])
  const [totalOk, setTotalOk]   = useState(0)
  const [done, setDone]         = useState(false)

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
    if (selected.side === tile.side) { setSelected(tile); return }

    if (selected.wordId === tile.wordId) {
      const next = new Set(matched)
      next.add(tile.wordId)
      setMatched(next)
      setTotalOk(n => n + 1)
      setSelected(null)
      if (next.size === tiles.length / 2) {
        const nextBatch = batchIdx + 1
        if (nextBatch >= totalBatch) { setTimeout(() => setDone(true), 500) }
        else { setTimeout(() => { setBatchIdx(nextBatch); loadBatch(nextBatch) }, 700) }
      }
    } else {
      setWrongIds([selected.id, tile.id])
      setTimeout(() => { setWrongIds([]); setSelected(null) }, 800)
    }
  }

  function getTileState(t: Tile): TileState {
    if (matched.has(t.wordId))   return 'matched'
    if (wrongIds.includes(t.id)) return 'wrong'
    if (selected?.id === t.id)   return 'selected'
    return 'idle'
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
    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ fontSize: 15, color: C.textLt, marginBottom: 16 }}>Bộ từ cần ít nhất 2 từ có nghĩa để chơi Matching.</p>
      <button onClick={onBack} style={{ color: C.gold, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, textDecoration: 'underline' }}>Quay lại</button>
    </div>
  )

  const enTiles   = tiles.filter(t => t.side === 'en')
  const viTiles   = tiles.filter(t => t.side === 'vi')
  const doneSoFar = batchIdx * BATCH + matched.size
  const pct       = valid.length > 0 ? (doneSoFar / valid.length) * 100 : 0

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 32, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning>{GLOBAL_CSS}</style>

      {/* ── Progress header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        {/* Arrow only — no text */}
        <button className="back-btn" onClick={onBackToModes} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: C.white, border: `1.5px solid ${C.border}`, cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={16} strokeWidth={2} color={C.gold} />
        </button>

        {/* Progress bar only — no labels */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ height: 6, background: `${C.navy}0D`, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: C.gold, borderRadius: 3, transition: 'width .5s cubic-bezier(.16,1,.3,1)' }} />
          </div>
        </div>

        {/* Counter — pairs matched */}
        <span style={{ fontSize: 13, fontWeight: 700, color: C.navy, flexShrink: 0, fontFamily: "'Playfair Display', serif" }}>
          {doneSoFar} <span style={{ color: C.textLt, fontWeight: 400, fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}>/ {valid.length}</span>
        </span>
      </div>

      {/* ── Instruction ─────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <p style={{ fontSize: 14, color: C.textMid, fontWeight: 500 }}>
          Chọn một từ tiếng Anh và nghĩa tương ứng để nối cặp
        </p>
        {selected && (
          <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: C.goldPale, border: `1px solid ${C.borderMd}`, borderRadius: 50 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold }} />
            <span style={{ fontSize: 13, color: '#7a5c00', fontWeight: 600 }}>
              Đã chọn: <em style={{ fontStyle: 'normal', fontFamily: selected.side === 'en' ? "'Playfair Display', serif" : "'DM Sans', sans-serif", fontWeight: 700 }}>{selected.text}</em>
            </span>
          </div>
        )}
      </div>

      {/* ── Two-column tile grid ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* EN column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textLt, textTransform: 'uppercase', letterSpacing: '.08em', whiteSpace: 'nowrap' }}>Tiếng Anh</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {enTiles.map(t => {
              const state = getTileState(t)
              return (
                <button
                  key={t.id}
                  className={`tile-btn${state === 'wrong' ? ' shake' : ''}${state === 'matched' ? ' pop-in' : ''}`}
                  onClick={() => tap(t)}
                  disabled={state === 'matched'}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 16,
                    cursor: state === 'matched' ? 'default' : 'pointer',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 16,
                    fontWeight: 700,
                    textAlign: 'center',
                    lineHeight: 1.3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    ...getTileStyle(state),
                  }}
                >
                  {t.text}
                  {state === 'matched' && <Check size={14} strokeWidth={2.5} color="#0F6E56" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* VI column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textLt, textTransform: 'uppercase', letterSpacing: '.08em', whiteSpace: 'nowrap' }}>Tiếng Việt</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {viTiles.map(t => {
              const state = getTileState(t)
              return (
                <button
                  key={t.id}
                  className={`tile-btn${state === 'wrong' ? ' shake' : ''}${state === 'matched' ? ' pop-in' : ''}`}
                  onClick={() => tap(t)}
                  disabled={state === 'matched'}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 16,
                    cursor: state === 'matched' ? 'default' : 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textAlign: 'center',
                    lineHeight: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    ...getTileStyle(state),
                  }}
                >
                  {t.text}
                  {state === 'matched' && <Check size={14} strokeWidth={2.5} color="#0F6E56" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Batch progress dots ──────────────────────────────────────────── */}
      {totalBatch > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 32, alignItems: 'center' }}>
          {Array.from({ length: totalBatch }).map((_, i) => (
            <div
              key={i}
              className="batch-dot"
              style={{
                height: 6,
                borderRadius: 3,
                width: i === batchIdx ? 24 : i < batchIdx ? 20 : 10,
                background: i < batchIdx ? '#00A878' : i === batchIdx ? C.navy : C.border,
              }}
            />
          ))}
          <span style={{ fontSize: 12, color: C.textLt, marginLeft: 8, fontWeight: 500 }}>
            Vòng {batchIdx + 1} / {totalBatch}
          </span>
        </div>
      )}
    </div>
  )
}