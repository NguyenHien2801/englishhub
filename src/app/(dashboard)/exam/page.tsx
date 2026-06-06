'use client'
import { useState } from 'react'
import { BookOpen, Zap, Brain, FileText, Clock, CheckCircle } from 'lucide-react'
import ExamSession from '@/components/exam/ExamSession'

const C = {
  bg:       '#F8F5EE',
  white:    '#FFFFFF',
  navy:     '#0F1C35',
  gold:     '#C9A84C',
  goldLt:   '#E8C97A',
  goldPale: '#FDF8EE',
  green:    '#00A878',
  greenLt:  '#4ECBA8',
  violet:   '#6478F0',
  slate:    '#64748B',
  border:   'rgba(201,168,76,0.18)',
  borderMd: 'rgba(201,168,76,0.30)',
  text:     '#1A1E2E',
  textMid:  '#4A5568',
  textLt:   '#94A3B8',
}

const CERT_COLOR: Record<string, string> = {
  TOEIC: '#00A878',
  VSTEP: '#185FA5',
  APTIS: '#6478F0',
}

const CERT_OPTIONS = [
  { value: 'TOEIC', label: 'TOEIC',    emoji: '💼', color: '#00A878', desc: 'Luyện thi TOEIC 450–990' },
  { value: 'VSTEP', label: 'VSTEP B1', emoji: '🎓', color: '#185FA5', desc: 'Chuẩn đầu ra Đại học' },
  { value: 'APTIS', label: 'APTIS',    emoji: '✈️', color: '#6478F0', desc: 'Du học, học bổng nước ngoài' },
]

const SKILL_OPTIONS: Record<string, { value: string; label: string; emoji: string }[]> = {
  TOEIC: [
    { value: 'NGU_PHAP', label: 'Part 5+6 – Ngữ pháp', emoji: '📝' },
    { value: 'DOC',      label: 'Part 7 – Đọc hiểu',   emoji: '📖' },
    { value: 'TU_VUNG',  label: 'Từ vựng',              emoji: '📚' },
  ],
  VSTEP: [
    { value: 'DOC',      label: 'Đọc hiểu', emoji: '📖' },
    { value: 'NGU_PHAP', label: 'Ngữ pháp', emoji: '📝' },
    { value: 'TU_VUNG',  label: 'Từ vựng',  emoji: '📚' },
  ],
  APTIS: [
    { value: 'DOC',      label: 'Reading',          emoji: '📖' },
    { value: 'NGU_PHAP', label: 'Grammar & Vocab',  emoji: '📝' },
  ],
}

// Thông tin bài thi đầy đủ theo chuẩn
const FULL_EXAM_INFO: Record<string, Record<string, { soCau: number; thoiGian: string; moTa: string }>> = {
  TOEIC: {
    NGU_PHAP: { soCau: 46,  thoiGian: '~45 phút', moTa: 'Part 5 (30 câu) + Part 6 (16 câu)' },
    DOC:      { soCau: 54,  thoiGian: '~55 phút', moTa: 'Part 7 – Single, Double & Triple Passages' },
    TU_VUNG:  { soCau: 30,  thoiGian: '~30 phút', moTa: 'Part 5 – Từ vựng trong ngữ cảnh' },
  },
  VSTEP: {
    DOC:      { soCau: 40,  thoiGian: '~60 phút', moTa: '4 bài đọc × 10 câu, B1–C1' },
    NGU_PHAP: { soCau: 30,  thoiGian: '~30 phút', moTa: 'Ngữ pháp theo chuẩn VSTEP' },
    TU_VUNG:  { soCau: 25,  thoiGian: '~25 phút', moTa: 'Từ vựng học thuật & thi cử' },
  },
  APTIS: {
    NGU_PHAP: { soCau: 50,  thoiGian: '~25 phút', moTa: 'Grammar (25) + Vocabulary (25)' },
    DOC:      { soCau: 40,  thoiGian: '~35 phút', moTa: 'Reading Parts 1–4 đầy đủ' },
    TU_VUNG:  { soCau: 25,  thoiGian: '~15 phút', moTa: 'Word definition & collocations' },
  },
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes blobMorph {
    0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    50%     { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  }
  .exam-fade-in { animation: fadeUp .45s cubic-bezier(.16,1,.3,1) both; }

  .exam-cert-card {
    transition: all .38s cubic-bezier(.16,1,.3,1);
    position: relative; overflow: hidden;
  }
  .exam-cert-card::after {
    content: ''; position: absolute; bottom: 0; left: 0;
    width: 0; height: 3px; background: #C9A84C;
    transition: width .38s cubic-bezier(.16,1,.3,1);
    border-radius: 0 0 24px 24px;
  }
  .exam-cert-card:hover { transform: translateY(-7px) scale(1.01); box-shadow: 0 28px 56px rgba(15,28,53,.14) !important; border-color: rgba(201,168,76,.45) !important; }
  .exam-cert-card:hover::after { width: 100%; }
  .exam-cert-card.active::after { width: 100%; background: #00A878; }

  .exam-skill-card  { transition: all .25s cubic-bezier(.16,1,.3,1); }
  .exam-skill-card:hover { transform: translateY(-3px); border-color: rgba(201,168,76,.4) !important; }

  .exam-mode-card { transition: all .3s cubic-bezier(.16,1,.3,1); position: relative; overflow: hidden; }
  .exam-mode-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(15,28,53,.12) !important; }
  .exam-mode-card.selected { transform: translateY(-2px); }

  .exam-start-btn { transition: all .32s cubic-bezier(.34,1.56,.64,1); }
  .exam-start-btn:hover:not(:disabled) { transform: translateY(-3px) scale(1.01); box-shadow: 0 12px 32px rgba(201,168,76,.55) !important; }
`

type Mode = 'quick' | 'full'

export default function ExamPage() {
  const [cert,          setCert]          = useState<string | null>(null)
  const [skill,         setSkill]         = useState<string | null>(null)
  const [mode,          setMode]          = useState<Mode | null>(null)
  const [sessionActive, setSessionActive] = useState(false)

  if (sessionActive && cert && skill && mode) {
    return (
      <ExamSession
        loaiChungChi={cert}
        kyNang={skill}
        mode={mode}
        onFinish={() => { setSessionActive(false); setSkill(null); setMode(null) }}
      />
    )
  }

  const certColor  = cert ? (CERT_COLOR[cert] ?? C.slate) : C.slate
  const certLabel  = CERT_OPTIONS.find(c => c.value === cert)?.label ?? ''
  const skillLabel = cert ? (SKILL_OPTIONS[cert]?.find(s => s.value === skill)?.label ?? '') : ''
  const fullInfo   = cert && skill ? FULL_EXAM_INFO[cert]?.[skill] : null

  const modeLabel  = mode === 'quick'
    ? '10 câu · ~10 phút'
    : fullInfo ? `${fullInfo.soCau} câu · ${fullInfo.thoiGian}` : ''

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingTop: 36, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning>{GLOBAL_CSS}</style>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{ background: C.navy, borderRadius: 24, padding: 'clamp(32px,4vw,48px)', marginBottom: 36, position: 'relative', overflow: 'hidden', boxShadow: '0 20px 60px rgba(15,28,53,.25)' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:280, height:280, background:'rgba(201,168,76,.07)', borderRadius:'60% 40% 30% 70%', animation:'blobMorph 10s ease-in-out infinite', filter:'blur(24px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, left:-40, width:180, height:180, background:'rgba(0,168,120,.06)', borderRadius:'40% 60%', filter:'blur(28px)', pointerEvents:'none' }} />

        <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 15px', background:'rgba(201,168,76,.12)', border:'1px solid rgba(201,168,76,.28)', borderRadius:50, fontSize:11, fontWeight:700, color:C.gold, textTransform:'uppercase', letterSpacing:'1px', marginBottom:18 }}>
          <Zap size={11} strokeWidth={2.5} /> Luyện thi
        </div>

        <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:'clamp(32px,4.5vw,48px)', fontWeight:900, color:'#fff', lineHeight:1.08, letterSpacing:'-.5px', marginBottom:12 }}>
          Exam <em style={{ fontStyle:'italic', color:C.gold }}>Practice</em>
        </h1>
        <p style={{ fontSize:16, color:'rgba(255,255,255,.45)', lineHeight:1.75, marginBottom:28, maxWidth:500 }}>
          VSTEP · TOEIC · APTIS — Đề thi chuẩn format thật, có AI phân tích đáp án
        </p>

        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {[
            { icon: <FileText size={17} color={C.goldLt}  strokeWidth={1.8} />, val: '3',    lbl: 'Chứng chỉ' },
            { icon: <Clock    size={17} color={C.greenLt} strokeWidth={1.8} />, val: '2',    lbl: 'Chế độ luyện' },
            { icon: <Brain    size={17} color="#A5B4FC"   strokeWidth={1.8} />, val: 'AI',   lbl: 'Phân tích đáp án' },
          ].map((s, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,.07)', border:'1px solid rgba(201,168,76,.2)', borderRadius:16, padding:'12px 20px', display:'flex', alignItems:'center', gap:10, backdropFilter:'blur(8px)' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily:"'Playfair Display', serif", fontSize:22, fontWeight:900, color:'#fff', lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.38)', marginTop:3, fontWeight:500 }}>{s.lbl}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Chọn chứng chỉ ────────────────────────────────────── */}
      <div className="exam-fade-in" style={{ marginBottom: 28 }}>
        <StepLabel num={1} done={!!cert} label="Chọn chứng chỉ" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {CERT_OPTIONS.map(c => (
            <button key={c.value} className={`exam-cert-card${cert === c.value ? ' active' : ''}`}
              onClick={() => { setCert(c.value); setSkill(null); setMode(null) }}
              style={{ padding:'22px 20px', background:C.white, borderRadius:20, border:`2px solid ${cert === c.value ? C.green : C.border}`, textAlign:'left', cursor:'pointer', boxShadow: cert === c.value ? '0 8px 28px rgba(0,168,120,.15)' : '0 2px 14px rgba(15,28,53,.06)', fontFamily:"'DM Sans', sans-serif" }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{c.emoji}</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:800, color:C.navy, lineHeight:1.1, marginBottom:5 }}>{c.label}</div>
              <div style={{ fontSize:12, color:C.slate, lineHeight:1.5 }}>{c.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Step 2: Chọn kỹ năng ──────────────────────────────────────── */}
      {cert && (
        <div className="exam-fade-in" style={{ marginBottom: 28 }}>
          <div style={{ height:1, background:C.border, marginBottom:28 }} />
          <StepLabel num={2} done={!!skill} label="Chọn kỹ năng / phần thi" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {(SKILL_OPTIONS[cert] ?? []).map(s => (
              <button key={s.value} className="exam-skill-card"
                onClick={() => { setSkill(s.value); setMode(null) }}
                style={{ padding:'16px 14px', background: skill === s.value ? `${certColor}08` : C.white, borderRadius:14, border:`2px solid ${skill === s.value ? certColor : C.border}`, textAlign:'left', cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
                <div style={{ fontSize:22, marginBottom:8 }}>{s.emoji}</div>
                <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: Chọn chế độ ───────────────────────────────────────── */}
      {cert && skill && (
        <div className="exam-fade-in" style={{ marginBottom: 28 }}>
          <div style={{ height:1, background:C.border, marginBottom:28 }} />
          <StepLabel num={3} done={!!mode} label="Chọn chế độ luyện thi" />

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Quick */}
            <button className={`exam-mode-card${mode === 'quick' ? ' selected' : ''}`}
              onClick={() => setMode('quick')}
              style={{ padding:'24px', background: mode === 'quick' ? `${C.green}08` : C.white, borderRadius:20, border:`2px solid ${mode === 'quick' ? C.green : C.border}`, textAlign:'left', cursor:'pointer', boxShadow: mode === 'quick' ? '0 8px 28px rgba(0,168,120,.15)' : '0 2px 14px rgba(15,28,53,.06)', fontFamily:"'DM Sans', sans-serif" }}>
              {mode === 'quick' && <div style={{ position:'absolute', top:16, right:16 }}><CheckCircle size={20} color={C.green} /></div>}
              <div style={{ fontSize:32, marginBottom:12 }}>⚡</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:800, color:C.navy, marginBottom:6 }}>Luyện nhanh</div>
              <div style={{ fontSize:13, color:C.slate, lineHeight:1.6, marginBottom:12 }}>10 câu ngẫu nhiên từ ngân hàng đề — lý tưởng để ôn hàng ngày</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <Tag icon="📋" text="10 câu" color={C.green} />
                <Tag icon="⏱" text="~10 phút" color={C.green} />
                <Tag icon="🎲" text="Ngẫu nhiên" color={C.slate} />
              </div>
            </button>

            {/* Full */}
            <button className={`exam-mode-card${mode === 'full' ? ' selected' : ''}`}
              onClick={() => setMode('full')}
              style={{ padding:'24px', background: mode === 'full' ? `${certColor}08` : C.white, borderRadius:20, border:`2px solid ${mode === 'full' ? certColor : C.border}`, textAlign:'left', cursor:'pointer', boxShadow: mode === 'full' ? `0 8px 28px ${certColor}25` : '0 2px 14px rgba(15,28,53,.06)', fontFamily:"'DM Sans', sans-serif", position:'relative' }}>
              {mode === 'full' && <div style={{ position:'absolute', top:16, right:16 }}><CheckCircle size={20} color={certColor} /></div>}
              <div style={{ position:'absolute', top:16, right: mode === 'full' ? 44 : 16, background: C.gold, color: C.navy, fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.5px' }}>Chuẩn thi</div>
              <div style={{ fontSize:32, marginBottom:12 }}>🎯</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:800, color:C.navy, marginBottom:6 }}>Thi đầy đủ</div>
              <div style={{ fontSize:13, color:C.slate, lineHeight:1.6, marginBottom:12 }}>
                {fullInfo?.moTa ?? 'Đề thi đúng format, đúng số câu như bài thi thật'}
              </div>
              {fullInfo && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <Tag icon="📋" text={`${fullInfo.soCau} câu`} color={certColor} />
                  <Tag icon="⏱" text={fullInfo.thoiGian} color={certColor} />
                  <Tag icon="✅" text="Đúng chuẩn" color={C.gold} />
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: CTA ───────────────────────────────────────────────── */}
      {cert && skill && mode && (
        <div className="exam-fade-in">
          <div style={{ background: C.navy, borderRadius: 20, padding: '26px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', boxShadow: '0 12px 40px rgba(15,28,53,.2)' }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:800, color:'#fff', marginBottom:5 }}>
                {certLabel} — {skillLabel}
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.4)' }}>
                {modeLabel} · AI phân tích sau khi nộp bài
              </div>
            </div>
            <button className="exam-start-btn" onClick={() => setSessionActive(true)}
              style={{ padding:'13px 28px', background: C.gold, color: C.navy, fontWeight:700, fontSize:15, border:'none', borderRadius:50, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'DM Sans', sans-serif", boxShadow:'0 6px 20px rgba(201,168,76,.4)' }}>
              Bắt đầu →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StepLabel({ num, done, label }: { num: number; done: boolean; label: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
      <span style={{ width:26, height:26, borderRadius:'50%', background: done ? '#00A878' : '#0F1C35', color:'#fff', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background .3s' }}>
        {done ? '✓' : num}
      </span>
      <span style={{ fontWeight:700, fontSize:15, color:'#0F1C35' }}>{label}</span>
    </div>
  )
}

function Tag({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', background:`${color}12`, borderRadius:20, fontSize:11, fontWeight:600, color }}>
      {icon} {text}
    </span>
  )
}