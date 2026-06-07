'use client'
import { useState } from 'react'
import { Zap, Brain, FileText, Clock, CheckCircle, GraduationCap, Briefcase, Globe2 } from 'lucide-react'
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
const CERT_ICON: Record<string, React.ElementType> = {
  TOEIC: Briefcase,
  VSTEP: GraduationCap,
  APTIS: Globe2,
}

const CERT_OPTIONS = [
  { value: 'TOEIC', label: 'TOEIC',    desc: 'Luyện thi TOEIC 450–990' },
  { value: 'VSTEP', label: 'VSTEP B1', desc: 'Chuẩn đầu ra Đại học' },
  { value: 'APTIS', label: 'APTIS',    desc: 'Du học, học bổng nước ngoài' },
]

const SKILL_OPTIONS: Record<string, { value: string; label: string; emoji: string }[]> = {
  TOEIC: [
    { value: 'NGHE',     label: 'Part 1–4 – Nghe',       emoji: '🎧' },
    { value: 'NOI',      label: 'Nói – Phản xạ',          emoji: '🗣️' },
    { value: 'DOC',      label: 'Part 7 – Đọc hiểu',     emoji: '📖' },
    { value: 'VIET',     label: 'Viết – Phản hồi email',  emoji: '✍️' },
    { value: 'NGU_PHAP', label: 'Part 5+6 – Ngữ pháp',   emoji: '📝' },
  ],
  VSTEP: [
    { value: 'NGHE',     label: 'Nghe hiểu',  emoji: '🎧' },
    { value: 'NOI',      label: 'Nói',         emoji: '🗣️' },
    { value: 'DOC',      label: 'Đọc hiểu',    emoji: '📖' },
    { value: 'VIET',     label: 'Viết',         emoji: '✍️' },
    { value: 'NGU_PHAP', label: 'Ngữ pháp',    emoji: '📝' },
  ],
  APTIS: [
    { value: 'NGHE',     label: 'Listening',       emoji: '🎧' },
    { value: 'NOI',      label: 'Speaking',         emoji: '🗣️' },
    { value: 'DOC',      label: 'Reading',          emoji: '📖' },
    { value: 'VIET',     label: 'Writing',          emoji: '✍️' },
    { value: 'NGU_PHAP', label: 'Grammar & Vocab', emoji: '📝' },
  ],
}

const FULL_EXAM_INFO: Record<string, Record<string, { soCau: number; thoiGian: string; moTa: string }>> = {
  TOEIC: {
    NGHE:     { soCau: 100, thoiGian: '~45 phút', moTa: 'Part 1–4 – Photographs, Q&A, Conversations, Talks' },
    NOI:      { soCau: 11,  thoiGian: '~20 phút', moTa: 'TOEIC Speaking – Đọc to, mô tả, trả lời câu hỏi' },
    DOC:      { soCau: 54,  thoiGian: '~55 phút', moTa: 'Part 7 – Single, Double & Triple Passages' },
    VIET:     { soCau: 8,   thoiGian: '~60 phút', moTa: 'TOEIC Writing – Mô tả ảnh, email, bài luận' },
    NGU_PHAP: { soCau: 46,  thoiGian: '~45 phút', moTa: 'Part 5 (30 câu) + Part 6 (16 câu)' },
  },
  VSTEP: {
    NGHE:     { soCau: 35, thoiGian: '~40 phút', moTa: 'Part 1 (8 câu) + Part 2 (12 câu) + Part 3 (15 câu)' },
    NOI:      { soCau: 3,  thoiGian: '~12 phút', moTa: 'VSTEP Speaking – Độc thoại, hỏi đáp, trình bày' },
    DOC:      { soCau: 40, thoiGian: '~60 phút', moTa: '4 bài đọc × 10 câu, B1–C1' },
    VIET:     { soCau: 2,  thoiGian: '~60 phút', moTa: 'Viết đoạn văn ngắn + bài luận học thuật' },
    NGU_PHAP: { soCau: 30, thoiGian: '~30 phút', moTa: 'Ngữ pháp theo chuẩn VSTEP' },
  },
  APTIS: {
    NGHE:     { soCau: 25, thoiGian: '~35 phút', moTa: 'Listening Parts 1–4 – Short & long dialogues' },
    NOI:      { soCau: 5,  thoiGian: '~12 phút', moTa: 'Speaking Tasks 1–5 – Interview & discussion' },
    DOC:      { soCau: 40, thoiGian: '~35 phút', moTa: 'Reading Parts 1–4 đầy đủ' },
    VIET:     { soCau: 4,  thoiGian: '~50 phút', moTa: 'Writing Tasks 1–4 – Messages, emails, posts, essay' },
    NGU_PHAP: { soCau: 50, thoiGian: '~25 phút', moTa: 'Grammar (25) + Vocabulary (25)' },
  },
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes blobMorph {
    0%,100%{border-radius:60% 40% 30% 70% / 60% 30% 70% 40%}
    50%{border-radius:30% 60% 70% 40% / 50% 60% 30% 60%}
  }
  .fade-in { animation: fadeUp .45s cubic-bezier(.16,1,.3,1) both; }

  .cert-card { transition: all .38s cubic-bezier(.16,1,.3,1); position: relative; overflow: hidden; }
  .cert-card::after { content:''; position:absolute; bottom:0; left:0; width:0; height:3px; background:#C9A84C; transition:width .38s cubic-bezier(.16,1,.3,1); border-radius:0 0 24px 24px; }
  .cert-card:hover { transform: translateY(-7px) scale(1.01); box-shadow: 0 28px 56px rgba(15,28,53,.14) !important; border-color: rgba(201,168,76,.45) !important; }
  .cert-card:hover::after { width:100%; }
  .cert-card.active::after { width:100%; background:#00A878; }

  .skill-card { transition: all .25s cubic-bezier(.16,1,.3,1); }
  .skill-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(15,28,53,.09) !important; border-color: rgba(201,168,76,.4) !important; }

  .mode-card { transition: all .3s cubic-bezier(.16,1,.3,1); position: relative; overflow: hidden; }
  .mode-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(15,28,53,.12) !important; }
  .mode-card.selected { transform: translateY(-2px); }

  .start-btn { transition: all .32s cubic-bezier(.34,1.56,.64,1); }
  .start-btn:hover:not(:disabled) { transform: translateY(-3px) scale(1.01); box-shadow: 0 12px 32px rgba(201,168,76,.55) !important; }
`

type Mode = 'quick' | 'full'

function StepLabel({ num, done, label }: { num: number; done: boolean; label: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
      <span style={{ width:26, height:26, borderRadius:'50%', background: done ? C.green : C.navy, color:'#fff', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background .3s' }}>
        {done ? '✓' : num}
      </span>
      <span style={{ fontWeight:700, fontSize:15, color:C.navy, fontFamily:"'DM Sans', sans-serif" }}>{label}</span>
    </div>
  )
}

function Tag({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', background:`${color}12`, borderRadius:20, fontSize:13, fontWeight:600, color }}>
      {icon} {text}
    </span>
  )
}

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
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 36, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning>{GLOBAL_CSS}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ background: C.navy, borderRadius: 28, padding: 'clamp(32px,4vw,52px) clamp(28px,4vw,52px)', marginBottom: 40, position: 'relative', overflow: 'hidden', boxShadow: '0 20px 60px rgba(15,28,53,.25)' }}>
        <div style={{ position:'absolute', top:-70, right:-70, width:320, height:320, background:'rgba(201,168,76,.07)', borderRadius:'60% 40% 30% 70%', animation:'blobMorph 10s ease-in-out infinite', filter:'blur(24px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-50, left:-50, width:200, height:200, background:'rgba(0,168,120,.06)', borderRadius:'40% 60%', filter:'blur(28px)', pointerEvents:'none' }} />

        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 16px', background:'rgba(201,168,76,.12)', border:'1px solid rgba(201,168,76,.28)', borderRadius:50, fontSize:11, fontWeight:700, color:C.gold, textTransform:'uppercase', letterSpacing:'1px', marginBottom:20 }}>
          <Zap size={11} strokeWidth={2.5} /> Luyện thi
        </div>
        <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:'clamp(32px,4.5vw,52px)', fontWeight:900, color:'#fff', lineHeight:1.08, letterSpacing:'-.5px', marginBottom:16 }}>
          Exam <em style={{ fontStyle:'italic', color:C.gold }}>Practice</em>
        </h1>
        <p style={{ fontSize:17, color:'rgba(255,255,255,.52)', lineHeight:1.78, marginBottom:32, maxWidth:520 }}>
          VSTEP · TOEIC · APTIS — Đề thi chuẩn format thật, có AI phân tích đáp án
        </p>

        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          {[
            { icon: <FileText size={17} color={C.goldLt}  strokeWidth={1.8} />, val: '3',  lbl: 'Chứng chỉ' },
            { icon: <Clock    size={17} color={C.greenLt} strokeWidth={1.8} />, val: '5',  lbl: 'Kỹ năng luyện' },
            { icon: <Brain    size={17} color="#A5B4FC"   strokeWidth={1.8} />, val: 'AI', lbl: 'Phân tích đáp án' },
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

      {/* ── Step 1: Chọn chứng chỉ ──────────────────────────────────────── */}
      <div className="fade-in" style={{ marginBottom: 28 }}>
        <StepLabel num={1} done={!!cert} label="Chọn chứng chỉ" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {CERT_OPTIONS.map(c => {
            const CertIconComp = CERT_ICON[c.value] || FileText
            const col = CERT_COLOR[c.value]
            return (
              <button key={c.value} className={`cert-card${cert === c.value ? ' active' : ''}`}
                onClick={() => { setCert(c.value); setSkill(null); setMode(null) }}
                style={{ padding:'22px 20px', background:C.white, borderRadius:20, border:`2px solid ${cert === c.value ? C.green : C.border}`, textAlign:'left', cursor:'pointer', boxShadow: cert === c.value ? '0 8px 28px rgba(0,168,120,.15)' : '0 2px 14px rgba(15,28,53,.06)', fontFamily:"'DM Sans', sans-serif", width:'100%' }}>
                <div style={{ width:44, height:44, borderRadius:13, background:`${col}15`, border:`1px solid ${col}28`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                  <CertIconComp size={20} color={col} strokeWidth={1.8} />
                </div>
                <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:800, color:C.navy, lineHeight:1.1, marginBottom:6 }}>{c.label}</div>
                <div style={{ fontSize:13, color:C.textMid, lineHeight:1.55 }}>{c.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Step 2: Chọn kỹ năng ────────────────────────────────────────── */}
      {cert && (
        <div className="fade-in" style={{ marginBottom: 28 }}>
          <div style={{ height:1, background:C.border, marginBottom:28 }} />
          <StepLabel num={2} done={!!skill} label="Chọn kỹ năng / phần thi" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12 }}>
            {(SKILL_OPTIONS[cert] ?? []).map(s => (
              <button key={s.value} className="skill-card"
                onClick={() => { setSkill(s.value); setMode(null) }}
                style={{ padding:'20px 18px', background: skill === s.value ? `${certColor}08` : C.white, borderRadius:16, border:`2px solid ${skill === s.value ? certColor : C.border}`, textAlign:'center', cursor:'pointer', fontFamily:"'DM Sans', sans-serif", width:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontSize:24, marginBottom:10 }}>{s.emoji}</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.navy, lineHeight:1.4 }}>{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: Chọn chế độ ─────────────────────────────────────────── */}
      {cert && skill && (
        <div className="fade-in" style={{ marginBottom: 28 }}>
          <div style={{ height:1, background:C.border, marginBottom:28 }} />
          <StepLabel num={3} done={!!mode} label="Chọn chế độ luyện thi" />

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <button className={`mode-card${mode === 'quick' ? ' selected' : ''}`}
              onClick={() => setMode('quick')}
              style={{ padding:'24px', background: mode === 'quick' ? `${C.green}08` : C.white, borderRadius:20, border:`2px solid ${mode === 'quick' ? C.green : C.border}`, textAlign:'left', cursor:'pointer', boxShadow: mode === 'quick' ? '0 8px 28px rgba(0,168,120,.15)' : '0 2px 14px rgba(15,28,53,.06)', fontFamily:"'DM Sans', sans-serif", width:'100%' }}>
              {mode === 'quick' && <div style={{ position:'absolute', top:16, right:16 }}><CheckCircle size={20} color={C.green} /></div>}
              <div style={{ fontSize:32, marginBottom:12 }}>⚡</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:800, color:C.navy, marginBottom:6 }}>Luyện nhanh</div>
              <div style={{ fontSize:15, color:C.textMid, lineHeight:1.65, marginBottom:14 }}>10 câu ngẫu nhiên từ ngân hàng đề — lý tưởng để ôn hàng ngày</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <Tag icon="📋" text="10 câu" color={C.green} />
                <Tag icon="⏱" text="~10 phút" color={C.green} />
                <Tag icon="🎲" text="Ngẫu nhiên" color={C.slate} />
              </div>
            </button>

            <button className={`mode-card${mode === 'full' ? ' selected' : ''}`}
              onClick={() => setMode('full')}
              style={{ padding:'24px', background: mode === 'full' ? `${certColor}08` : C.white, borderRadius:20, border:`2px solid ${mode === 'full' ? certColor : C.border}`, textAlign:'left', cursor:'pointer', boxShadow: mode === 'full' ? `0 8px 28px ${certColor}25` : '0 2px 14px rgba(15,28,53,.06)', fontFamily:"'DM Sans', sans-serif", position:'relative', width:'100%' }}>
              {mode === 'full' && <div style={{ position:'absolute', top:16, right:16 }}><CheckCircle size={20} color={certColor} /></div>}
              <div style={{ position:'absolute', top:16, right: mode === 'full' ? 44 : 16, background: C.gold, color: C.navy, fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.5px' }}>Chuẩn thi</div>
              <div style={{ fontSize:32, marginBottom:12 }}>🎯</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:800, color:C.navy, marginBottom:6 }}>Thi đầy đủ</div>
              <div style={{ fontSize:15, color:C.textMid, lineHeight:1.65, marginBottom:14 }}>
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

      {/* ── Step 4: CTA ─────────────────────────────────────────────────── */}
      {cert && skill && mode && (
        <div className="fade-in">
          <div style={{ background: C.navy, borderRadius: 20, padding: '26px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap', boxShadow:'0 12px 40px rgba(15,28,53,.2)' }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:800, color:'#fff', marginBottom:5 }}>
                {certLabel} — {skillLabel}
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.4)' }}>
                {modeLabel} · AI phân tích sau khi nộp bài
              </div>
            </div>
            <button className="start-btn" onClick={() => setSessionActive(true)}
              style={{ padding:'13px 28px', background: C.gold, color: C.navy, fontWeight:700, fontSize:15, border:'none', borderRadius:50, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'DM Sans', sans-serif", boxShadow:'0 6px 20px rgba(201,168,76,.4)' }}>
              Bắt đầu →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}