'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VocabWord } from '@/components/vocabulary/types'
import { saveSrs } from '@/components/vocabulary/types'
import SessionResult from '@/components/vocabulary/SessionResult'
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight, ChevronRight } from 'lucide-react'

interface Props {
  words: VocabWord[]
  setTitle: string
  userId: string
  isReviewMode: boolean
  onBack: () => void
  onBackToModes: () => void
}

interface BuiltQ {
  wordId: string
  cau_hoi: string
  dap_an: string[]
  correctIndex: number
}

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
  @keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  .fade-in   { animation: fadeUp .38s cubic-bezier(.16,1,.3,1) both; }
  .slide-in  { animation: slideIn .32s cubic-bezier(.16,1,.3,1) both; }
  .choice-btn { transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, border-color .15s, background .15s; }
  .choice-btn:hover:not(:disabled) { transform: translateX(4px); }
  .choice-btn:active:not(:disabled) { transform: scale(.98); }
  .action-btn { transition: all .28s cubic-bezier(.34,1.56,.64,1); }
  .action-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(201,168,76,.4) !important; }
  .back-btn { transition: all .2s; }
  .back-btn:hover { opacity: .7; transform: translateX(-2px); }
`

function buildQuestions(words: VocabWord[]): BuiltQ[] {
  const allMeanings = words.map(w => w.TuVungCache?.nghia_tieng_viet).filter(Boolean) as string[]
  return words.flatMap(word => {
    const cache = word.TuVungCache
    if (cache?.cau_hoi_quiz?.length) {
      return cache.cau_hoi_quiz.map(q => ({
        wordId: word.id, cau_hoi: q.cau_hoi, dap_an: q.dap_an, correctIndex: q.dung,
      }))
    }
    const correct = cache?.nghia_tieng_viet
    if (!correct) return []
    const wrongs = allMeanings.filter(m => m !== correct).sort(() => Math.random() - 0.5).slice(0, 3)
    if (wrongs.length < 1) return []
    const correctIndex = Math.floor(Math.random() * (wrongs.length + 1))
    const dap_an = [...wrongs.slice(0, correctIndex), correct, ...wrongs.slice(correctIndex)]
    return [{ wordId: word.id, cau_hoi: `"${word.tu_tieng_anh}" có nghĩa là gì?`, dap_an, correctIndex }]
  })
}

export default function FlashcardMode({ words, setTitle, userId, isReviewMode, onBack, onBackToModes }: Props) {
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
    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ fontSize: 15, color: C.textLt, marginBottom: 16 }}>Bộ từ chưa đủ dữ liệu để tạo quiz.</p>
      <button onClick={onBack} style={{ color: C.gold, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, textDecoration: 'underline' }}>Quay lại</button>
    </div>
  )

  // ── Choice styles ─────────────────────────────────────────────────────────
  function choiceStyle(idx: number): React.CSSProperties {
    if (confirmed) {
      if (idx === q.correctIndex) return {
        border: '2px solid rgba(0,168,120,.4)',
        background: '#E1F5EE', color: '#0F6E56',
      }
      if (idx === selected) return {
        border: '2px solid rgba(240,100,100,.4)',
        background: '#FEF2F2', color: '#A32D2D',
      }
      return { border: `1.5px solid ${C.border}`, background: C.white, color: C.textLt, opacity: 0.5 }
    }
    if (selected === idx) return {
      border: `2px solid ${C.navy}`,
      background: C.goldPale, color: C.navy,
      boxShadow: '0 4px 16px rgba(15,28,53,.1)',
    }
    return { border: `1.5px solid ${C.border}`, background: C.white, color: C.text }
  }

  function badgeStyle(idx: number): React.CSSProperties {
    if (confirmed && idx === q.correctIndex) return { background: '#00A878', color: '#fff', border: '1.5px solid #00A878' }
    if (confirmed && idx === selected)       return { background: '#F06464', color: '#fff', border: '1.5px solid #F06464' }
    if (selected === idx)                    return { background: C.navy,    color: '#fff', border: `1.5px solid ${C.navy}` }
    return { background: 'transparent', color: C.textLt, border: `1.5px solid ${C.border}` }
  }

  const isLastQ = index + 1 >= questions.length

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 32, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
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
          {index + 1} <span style={{ color: C.textLt, fontWeight: 400, fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}>/ {questions.length}</span>
        </span>

        {/* Correct count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#E1F5EE', borderRadius: 50, border: '1px solid rgba(0,168,120,.25)', flexShrink: 0 }}>
          <CheckCircle2 size={13} color="#0F6E56" strokeWidth={2.5} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F6E56' }}>{correct}</span>
        </div>
      </div>

      {/* ── Question card ───────────────────────────────────────────────── */}
      <div className="fade-in" style={{
        background: C.white, borderRadius: 24,
        border: `1.5px solid ${C.border}`,
        boxShadow: '0 2px 20px rgba(15,28,53,.06)',
        padding: '32px 36px', marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Gold top bar — thay cho "CÂU X" label */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: C.gold, borderRadius: '24px 24px 0 0' }} />

        {/* Set title + number nhỏ xíu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textLt, textTransform: 'uppercase', letterSpacing: '.08em' }}>{setTitle}</span>
          <span style={{ fontSize: 11, color: C.textLt }}>Câu {index + 1}</span>
        </div>

        {/* Question text — Playfair, centered, bold */}
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(20px,3.5vw,26px)',
          fontWeight: 800,
          color: C.navy,
          lineHeight: 1.4,
          textAlign: 'center',
          margin: 0,
        }}>
          {q.cau_hoi}
        </p>
      </div>

      {/* ── Choices ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {q.dap_an.map((ans, idx) => (
          <button
            key={idx}
            className="choice-btn"
            onClick={() => !confirmed && setSelected(idx)}
            disabled={confirmed}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px',
              borderRadius: 16,
              cursor: confirmed ? 'default' : 'pointer',
              textAlign: 'left',
              fontFamily: "'DM Sans', sans-serif",
              ...choiceStyle(idx),
            }}
          >
            {/* Letter badge */}
            <span style={{
              width: 30, height: 30, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
              transition: 'all .18s',
              ...badgeStyle(idx),
            }}>
              {String.fromCharCode(65 + idx)}
            </span>

            <span style={{ flex: 1, fontSize: 15, fontWeight: 500, lineHeight: 1.5 }}>{ans}</span>

            {/* Result icon */}
            {confirmed && idx === q.correctIndex && <CheckCircle2 size={18} color="#0F6E56" strokeWidth={2} style={{ flexShrink: 0 }} />}
            {confirmed && idx === selected && idx !== q.correctIndex && <XCircle size={18} color="#F06464" strokeWidth={2} style={{ flexShrink: 0 }} />}
          </button>
        ))}
      </div>

      {/* ── Feedback banner ──────────────────────────────────────────────── */}
      {confirmed && (
        <div className="slide-in" style={{
          borderRadius: 16, padding: '14px 18px', marginBottom: 16,
          background: isRight ? '#E1F5EE' : '#FEF2F2',
          border: `1px solid ${isRight ? 'rgba(0,168,120,.3)' : 'rgba(240,100,100,.3)'}`,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          {isRight
            ? <CheckCircle2 size={20} color="#0F6E56" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            : <XCircle size={20} color="#F06464" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
          }
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: isRight ? '#0F6E56' : '#A32D2D', marginBottom: isRight ? 0 : 4 }}>
              {isRight ? 'Chính xác!' : 'Sai rồi!'}
            </p>
            {!isRight && (
              <p style={{ fontSize: 14, color: C.textMid }}>
                Đáp án đúng: <strong style={{ color: C.navy }}>{q.dap_an[q.correctIndex]}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Action button ─────────────────────────────────────────────────── */}
      {!confirmed
        ? (
          <button className="action-btn" onClick={confirm} disabled={selected === null}
            style={{
              width: '100%', padding: '15px 0',
              borderRadius: 50, border: 'none',
              background: selected === null ? `${C.navy}18` : C.navy,
              color: selected === null ? C.textLt : '#fff',
              fontSize: 15, fontWeight: 700,
              cursor: selected === null ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: selected === null ? 'none' : '0 6px 20px rgba(15,28,53,.18)',
            }}>
            Kiểm tra
          </button>
        ) : (
          <button className="action-btn" onClick={next}
            style={{
              width: '100%', padding: '15px 0',
              borderRadius: 50, border: 'none',
              background: C.gold,
              color: C.navy,
              fontSize: 15, fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 6px 24px rgba(201,168,76,.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {isLastQ ? 'Xem kết quả' : 'Câu tiếp theo'}
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        )
      }
    </div>
  )
}