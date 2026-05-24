'use client'
import { ArrowLeft, RotateCcw, Zap } from 'lucide-react'

interface Props {
  total: number
  correct: number
  setTitle: string
  mode: 'flashcard' | 'quiz' | 'matching'
  onBack: () => void
  onRetry: () => void
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
  @keyframes fadeUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes scaleIn { from { opacity:0; transform:scale(.88); } to { opacity:1; transform:scale(1); } }
  @keyframes dash    { from { stroke-dasharray: 0 100; } }
  .fade-in   { animation: fadeUp  .42s cubic-bezier(.16,1,.3,1) both; }
  .scale-in  { animation: scaleIn .46s cubic-bezier(.16,1,.3,1) both; }
  .ring-arc  { animation: dash .9s cubic-bezier(.16,1,.3,1) .1s both; }
  .action-btn { transition: all .28s cubic-bezier(.34,1.56,.64,1); }
  .action-btn:hover { transform: translateY(-3px); }
  .back-btn { transition: all .2s; }
  .back-btn:hover { opacity: .7; transform: translateX(-2px); }
`

const MODE_LABEL: Record<string, string> = {
  flashcard: 'Flashcard',
  quiz:      'Quiz',
  matching:  'Matching',
}

const MODE_ICON: Record<string, string> = {
  flashcard: '🃏',
  quiz:      '✏️',
  matching:  '🔗',
}

export default function SessionResult({ total, correct, setTitle, mode, onBack, onRetry }: Props) {
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0
  const wrong   = total - correct

  const { emoji, title, ringColor, ringTrack } =
    pct >= 80 ? { emoji: '🏆', title: 'Xuất sắc!',   ringColor: '#00A878', ringTrack: 'rgba(0,168,120,.12)' } :
    pct >= 60 ? { emoji: '👍', title: 'Khá tốt!',    ringColor: C.gold,   ringTrack: 'rgba(201,168,76,.15)' } :
                { emoji: '💪', title: 'Cố lên nào!', ringColor: '#F06464', ringTrack: 'rgba(240,100,100,.12)' }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 40, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning>{GLOBAL_CSS}</style>

      {/* ── Back button ──────────────────────────────────────────────────── */}
      <div className="fade-in" style={{ marginBottom: 32 }}>
        <button className="back-btn" onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: C.white, border: `1.5px solid ${C.border}`, cursor: 'pointer' }}>
          <ArrowLeft size={16} strokeWidth={2} color={C.gold} />
        </button>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 14 }}>{emoji}</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,6vw,36px)', fontWeight: 900, color: C.navy, margin: '0 0 8px' }}>
          {title}
        </h2>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: C.goldPale, border: `1px solid ${C.borderMd}`, borderRadius: 50 }}>
          <span style={{ fontSize: 13 }}>{MODE_ICON[mode]}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#7a5c00' }}>{MODE_LABEL[mode]}</span>
          <span style={{ fontSize: 12, color: C.textLt }}>· {setTitle}</span>
        </div>
      </div>

      {/* ── Ring ─────────────────────────────────────────────────────────── */}
      <div className="scale-in" style={{ position: 'relative', width: 148, height: 148, margin: '0 auto 36px' }}>
        <svg viewBox="0 0 36 36" style={{ width: 148, height: 148, transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={ringTrack} strokeWidth="2.8" />
          {/* Arc */}
          <circle className="ring-arc" cx="18" cy="18" r="15.9" fill="none"
            stroke={ringColor} strokeWidth="2.8"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: C.navy, lineHeight: 1 }}>{pct}%</span>
          <span style={{ fontSize: 12, color: C.textLt, fontWeight: 500 }}>{correct}/{total}</span>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Tổng từ', value: total,   bg: C.white,    color: C.navy,    border: C.border,                  accent: C.textLt },
          { label: 'Đúng',    value: correct,  bg: '#E1F5EE',  color: '#0F6E56', border: 'rgba(0,168,120,.25)',     accent: '#0F6E56' },
          { label: 'Cần ôn',  value: wrong,    bg: '#FEF2F2',  color: '#A32D2D', border: 'rgba(240,100,100,.25)',   accent: '#A32D2D' },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: 18, padding: '16px 12px', background: s.bg, border: `1.5px solid ${s.border}`, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, marginTop: 4, color: s.accent, fontWeight: 600, opacity: 0.7 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── XP badge ─────────────────────────────────────────────────────── */}
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: C.goldPale, border: `1px solid ${C.borderMd}`, borderRadius: 50 }}>
          <Zap size={14} color={C.gold} strokeWidth={2.5} fill={C.gold} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#7a5c00' }}>+{correct * 5} XP</span>
          <span style={{ fontSize: 12, color: C.textLt }}>· SRS đã lưu</span>
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="action-btn" onClick={onRetry}
          style={{
            width: '100%', padding: '15px 0',
            borderRadius: 50, border: 'none',
            background: C.gold, color: C.navy,
            fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 6px 24px rgba(201,168,76,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <RotateCcw size={15} strokeWidth={2.5} />
          Học lại
        </button>

        <button className="action-btn" onClick={onBack}
          style={{
            width: '100%', padding: '15px 0',
            borderRadius: 50,
            border: `1.5px solid ${C.border}`,
            background: C.white, color: C.navy,
            fontSize: 15, fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>
          Chọn bộ từ khác
        </button>
      </div>
    </div>
  )
}