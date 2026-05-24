'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { VocabWord, SrsRating } from '@/components/vocabulary/types'
import { saveSrs } from '@/components/vocabulary/types'
import SessionResult from '@/components/vocabulary/SessionResult'
import {
  ArrowLeft, Volume2, Volume1, BookOpen,
  Lightbulb, RotateCcw, ChevronRight,
} from 'lucide-react'

interface Props {
  words: VocabWord[]
  setTitle: string
  userId: string
  isReviewMode: boolean
  onBack: () => void
  onBackToModes: () => void
}

// ── Design tokens (mirrors WritingPage + VocabularyClient) ───────────────────
const C = {
  bg:       '#F8F5EE',
  white:    '#FFFFFF',
  navy:     '#0F1C35',
  navyMid:  '#1E2F50',
  gold:     '#C9A84C',
  goldLt:   '#E8C97A',
  goldPale: '#FDF8EE',
  green:    '#00A878',
  slate:    '#64748B',
  border:   'rgba(201,168,76,0.18)',
  borderMd: 'rgba(201,168,76,0.30)',
  text:     '#1A1E2E',
  textMid:  '#4A5568',
  textLt:   '#94A3B8',
}

const RATINGS: {
  id: SrsRating
  label: string
  sub: string
  bg: string
  color: string
  border: string
  bar: string
}[] = [
  { id: 'again', label: 'Học lại', sub: '1',  bg: '#FEF2F2', color: '#A32D2D', border: 'rgba(240,100,100,.3)',   bar: '#F06464' },
  { id: 'hard',  label: 'Khó',     sub: '2',  bg: '#FAEEDA', color: '#633806', border: 'rgba(185,117,23,.3)',    bar: '#C9A84C' },
  { id: 'good',  label: 'Ổn',      sub: '3',  bg: '#E1F5EE', color: '#0F6E56', border: 'rgba(0,168,120,.3)',     bar: '#00A878' },
  { id: 'easy',  label: 'Dễ',      sub: '4',  bg: '#E6F1FB', color: '#185FA5', border: 'rgba(24,95,165,.3)',     bar: '#2B6CB0' },
]

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideUp  { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulseGold { 0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); } 50% { box-shadow: 0 0 0 6px rgba(201,168,76,.15); } }
  .fade-in   { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) both; }
  .slide-up  { animation: slideUp .38s cubic-bezier(.16,1,.3,1) both; }
  .rating-btn {
    transition: all .28s cubic-bezier(.34,1.56,.64,1);
    position: relative; overflow: hidden;
  }
  .rating-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: currentColor;
    opacity: 0;
    transition: opacity .18s;
    border-radius: inherit;
  }
  .rating-btn:hover:not(:disabled) { transform: translateY(-4px) scale(1.03); }
  .rating-btn:active:not(:disabled) { transform: scale(.97); }
  .audio-btn { transition: all .22s cubic-bezier(.34,1.56,.64,1); }
  .audio-btn:hover { transform: scale(1.12); }
  .back-btn { transition: all .2s; }
  .back-btn:hover { opacity: .7; transform: translateX(-2px); }
  .card-wrap { animation: pulseGold 2.5s ease-in-out 1s 3; }
`

export default function FlashcardMode({ words, setTitle, userId, isReviewMode, onBack, onBackToModes }: Props) {
  const supabase = createClient()

  const [index, setIndex]     = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [correct, setCorrect] = useState(0)
  const [done, setDone]       = useState(false)

  const word     = words[index]
  const cache    = word?.TuVungCache
  const progress = words.length > 0 ? (index / words.length) * 100 : 0

  const flip = useCallback(() => setFlipped(f => !f), [])

  function playAudio() {
    if (cache?.audio_url) {
      new Audio(cache.audio_url).play().catch(() => speakFallback())
      return
    }
    speakFallback()
  }

  function speakFallback() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(word.tu_tieng_anh)
    utt.lang  = 'en-US'
    utt.rate  = 0.85
    utt.pitch = 1
    const voices  = window.speechSynthesis.getVoices()
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
      setTimeout(() => setIndex(i => i + 1), 130)
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
    <div style={{ maxWidth: 680, margin: '0 auto', paddingTop: 32, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
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
            <div style={{ height: '100%', width: `${progress}%`, background: C.gold, borderRadius: 3, transition: 'width .5s cubic-bezier(.16,1,.3,1)' }} />
          </div>
        </div>

        {/* Counter */}
        <span style={{ fontSize: 13, fontWeight: 700, color: C.navy, flexShrink: 0, fontFamily: "'Playfair Display', serif" }}>
          {index + 1} <span style={{ color: C.textLt, fontWeight: 400, fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}>/ {words.length}</span>
        </span>
      </div>

      {/* ── Flashcard ───────────────────────────────────────────────────── */}
      <div
        style={{ perspective: '1400px', cursor: 'pointer', userSelect: 'none', height: 420 }}
        onClick={flip}
      >
        {/* Flip container — fixed height, both faces sit inside it */}
        <div style={{
          position: 'relative', width: '100%', height: '100%',
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform .55s cubic-bezier(.16,1,.3,1)',
        }}>

          {/* ── FRONT ──────────────────────────────────────────────────── */}
          <div style={{
            position: 'absolute', inset: 0,
            background: C.white,
            borderRadius: 28,
            border: `1.5px solid ${C.border}`,
            boxShadow: '0 4px 32px rgba(15,28,53,.08)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '64px 48px 52px',
          }}>
            {/* Gold top accent */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 64, height: 3, background: C.gold, borderRadius: '0 0 4px 4px' }} />

            {/* Set title row */}
            <div style={{ position: 'absolute', top: 16, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textLt, textTransform: 'uppercase', letterSpacing: '.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{setTitle}</span>
              <span style={{ fontSize: 11, color: C.textLt }}>Thẻ {index + 1}</span>
            </div>

            {/* Cap do badge */}
            {word.cap_do && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 50, background: C.goldPale, color: '#7a5c00', border: `1px solid ${C.borderMd}`, marginBottom: 28, letterSpacing: '.05em' }}>
                {word.cap_do}
              </span>
            )}

            {/* Main word — the hero */}
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px,7vw,60px)', fontWeight: 900, color: C.navy, textAlign: 'center', lineHeight: 1.1, letterSpacing: '-0.5px', margin: 0, marginBottom: 20 }}>
              {word.tu_tieng_anh}
            </h2>

            {/* IPA + Audio row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {cache?.phat_am_ipa && (
                <span style={{ fontFamily: "'DM Mono', 'Fira Mono', monospace", fontSize: 16, color: C.textMid, letterSpacing: '.03em' }}>/{cache.phat_am_ipa}/</span>
              )}
              <button
                className="audio-btn"
                onClick={e => { e.stopPropagation(); playAudio() }}
                title={cache?.audio_url ? 'Phát âm (file)' : 'Phát âm (tổng hợp)'}
                style={{ width: 38, height: 38, borderRadius: 11, background: C.goldPale, border: `1px solid ${C.borderMd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              >
                {cache?.audio_url
                  ? <Volume2 size={17} color={C.gold} strokeWidth={2} />
                  : <Volume1 size={17} color={C.gold} strokeWidth={2} />
                }
              </button>
            </div>

            {/* Loai tu */}
            {word.loai_tu && (
              <span style={{ fontSize: 13, color: C.textLt, fontStyle: 'italic' }}>{word.loai_tu}</span>
            )}

            {/* Flip hint — pinned to bottom, inside padding */}
            <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: C.textLt, display: 'flex', alignItems: 'center', gap: 5 }}>
                <RotateCcw size={12} strokeWidth={2} color={C.textLt} />
                Nhấn để xem nghĩa
              </span>
            </div>
          </div>

          {/* ── BACK ───────────────────────────────────────────────────── */}
          <div style={{
            position: 'absolute', inset: 0,
            background: C.white,
            borderRadius: 28,
            border: `1.5px solid ${C.borderMd}`,
            boxShadow: '0 4px 32px rgba(15,28,53,.1)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex', flexDirection: 'column',
            padding: '32px 36px',
            overflowY: 'auto',
          }}>
            {/* Navy top accent */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 64, height: 3, background: C.navy, borderRadius: '0 0 4px 4px' }} />

            {/* Set title row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textLt, textTransform: 'uppercase', letterSpacing: '.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{setTitle}</span>
              <span style={{ fontSize: 11, color: C.textLt }}>Thẻ {index + 1}</span>
            </div>

            {/* Nghia chinh */}
            <div style={{ marginBottom: 20, marginTop: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.textLt, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Nghĩa tiếng Việt</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px,4vw,30px)', fontWeight: 800, color: C.navy, lineHeight: 1.3 }}>
                {cache?.nghia_tieng_viet ?? <span style={{ fontSize: 16, color: C.textLt, fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif" }}>Chưa có dữ liệu</span>}
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: C.border, marginBottom: 18 }} />

            {/* Definition */}
            {cache?.dinh_nghia_tieng_anh && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.textLt, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Definition</p>
                <p style={{ fontSize: 14, color: C.textMid, fontStyle: 'italic', lineHeight: 1.75 }}>{cache.dinh_nghia_tieng_anh}</p>
              </div>
            )}

            {/* Example */}
            {cache?.vi_du_cau?.[0] && (
              <div style={{ marginBottom: 16, padding: '12px 16px', background: C.bg, borderRadius: 14, borderLeft: `3px solid ${C.gold}` }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#7a5c00', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <BookOpen size={11} strokeWidth={2.5} color="#7a5c00" />
                  Ví dụ
                </p>
                <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, marginBottom: cache.vi_du_viet?.[0] ? 4 : 0 }}>{cache.vi_du_cau[0]}</p>
                {cache.vi_du_viet?.[0] && (
                  <p style={{ fontSize: 13, color: C.textMid, fontStyle: 'italic' }}>{cache.vi_du_viet[0]}</p>
                )}
              </div>
            )}

            {/* Memory tip */}
            {cache?.cach_nho && (
              <div style={{ padding: '12px 16px', background: '#FDF8EE', borderRadius: 14, border: `1px solid ${C.borderMd}` }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#7a5c00', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Lightbulb size={11} strokeWidth={2.5} color="#7a5c00" />
                  Mẹo ghi nhớ
                </p>
                <p style={{ fontSize: 14, color: '#5a4000', lineHeight: 1.7 }}>{cache.cach_nho}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Rating buttons ───────────────────────────────────────────────── */}
      <div style={{
        marginTop: 24,
        opacity: flipped ? 1 : 0,
        transform: flipped ? 'translateY(0)' : 'translateY(12px)',
        pointerEvents: flipped ? 'auto' : 'none',
        transition: 'opacity .3s, transform .35s cubic-bezier(.16,1,.3,1)',
      }}>
        <p style={{ textAlign: 'center', fontSize: 13, color: C.textLt, marginBottom: 14, fontWeight: 500 }}>
          Bạn nhớ từ này ở mức nào?
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {RATINGS.map(r => (
            <button
              key={r.id}
              className="rating-btn"
              onClick={() => rate(r.id)}
              disabled={saving}
              style={{
                padding: '14px 8px',
                borderRadius: 16,
                border: `1.5px solid ${r.border}`,
                background: r.bg,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1,
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
            >
              {/* Score indicator bar */}
              <div style={{ width: 28, height: 4, borderRadius: 2, background: r.bar, marginBottom: 4, opacity: 0.7 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: r.color }}>{r.label}</span>
              <span style={{ fontSize: 12, color: r.color, opacity: 0.55, fontWeight: 500 }}>
                [{r.sub}]
              </span>
            </button>
          ))}
        </div>

        {/* Keyboard hint */}
        <p style={{ textAlign: 'center', fontSize: 12, color: C.textLt, marginTop: 12 }}>
          Phím tắt: <kbd style={{ padding: '1px 6px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 11, fontFamily: 'monospace', color: C.textMid }}>1</kbd> · <kbd style={{ padding: '1px 6px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 11, fontFamily: 'monospace', color: C.textMid }}>2</kbd> · <kbd style={{ padding: '1px 6px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 11, fontFamily: 'monospace', color: C.textMid }}>3</kbd> · <kbd style={{ padding: '1px 6px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 11, fontFamily: 'monospace', color: C.textMid }}>4</kbd>
        </p>
      </div>
    </div>
  )
}