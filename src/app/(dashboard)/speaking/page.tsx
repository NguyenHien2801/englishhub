'use client'
import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  Mic, MicOff, RotateCcw, ChevronRight, Home,
  CheckCircle2, Target, Lightbulb, FileText,
  GraduationCap, Briefcase, Globe2, Trophy,
  Volume2, Clock, BookOpen, MessageSquare,
} from 'lucide-react'

// ── Web Speech API types ──────────────────────────────────────────────────────
interface ISpeechRecognition extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number
  start(): void; stop(): void; abort(): void
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onerror:  ((event: ISpeechRecognitionErrorEvent) => void) | null
  onend:    (() => void) | null
}
interface ISpeechRecognitionEvent { resultIndex: number; results: ISpeechRecognitionResultList }
interface ISpeechRecognitionResultList { length: number; item(i: number): ISpeechRecognitionResult; [i: number]: ISpeechRecognitionResult }
interface ISpeechRecognitionResult { isFinal: boolean; length: number; item(i: number): ISpeechRecognitionAlternative; [i: number]: ISpeechRecognitionAlternative }
interface ISpeechRecognitionAlternative { transcript: string; confidence: number }
interface ISpeechRecognitionErrorEvent extends Event { error: string; message: string }
interface ISpeechRecognitionConstructor { new(): ISpeechRecognition }
declare global {
  interface Window { SpeechRecognition: ISpeechRecognitionConstructor; webkitSpeechRecognition: ISpeechRecognitionConstructor }
}

// ── Design tokens — đồng bộ Writing page ─────────────────────────────────────
const C = {
  bg: '#F8F5EE', white: '#FFFFFF', navy: '#0F1C35', navyMid: '#1E2F50',
  gold: '#C9A84C', goldLt: '#E8C97A', goldPale: '#FDF8EE',
  green: '#00A878', greenLt: '#4ECBA8', blue: '#2B6CB0',
  violet: '#6478F0', rose: '#F06464', slate: '#64748B',
  border: 'rgba(201,168,76,0.18)', borderMd: 'rgba(201,168,76,0.30)',
  text: '#1A1E2E', textMid: '#4A5568', textLt: '#94A3B8',
}
const CERT_COLOR: Record<string, string> = { VSTEP: '#185FA5', TOEIC: '#00A878', APTIS: '#6478F0' }
const CERT_ICON:  Record<string, React.ElementType> = { VSTEP: GraduationCap, TOEIC: Briefcase, APTIS: Globe2 }
const LEVEL_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  A1: { bg: '#F1EFE8', color: '#5F5E5A', border: 'rgba(136,135,128,.3)' },
  A2: { bg: '#F1EFE8', color: '#5F5E5A', border: 'rgba(136,135,128,.3)' },
  B1: { bg: '#E1F5EE', color: '#0F6E56', border: 'rgba(0,168,120,.3)'   },
  B2: { bg: '#E6F1FB', color: '#185FA5', border: 'rgba(24,95,165,.3)'   },
  C1: { bg: '#EEEDFE', color: '#3C3489', border: 'rgba(83,74,183,.3)'   },
  C2: { bg: '#EEEDFE', color: '#3C3489', border: 'rgba(83,74,183,.3)'   },
}

// ── Kiểu dữ liệu khớp bảng BaiLuyenNoi ───────────────────────────────────────
interface BaiLuyenNoi {
  id: string
  loai_chung_chi: string          // VSTEP | TOEIC | APTIS
  cap_do: string                  // A1–C2
  tieu_de: string
  bieu_tuong: string
  mo_ta: string | null
  loai_bai: string                // read_aloud | describe_image | ...
  chu_de: string | null
  thong_tin_ky_thi: string | null
  huong_dan: string | null
  noi_dung_de_bai: string
  thoi_gian_chuan_bi_giay: number
  thoi_gian_tra_loi_giay: number
  goi_y_json: string[]
  tu_khoa_goi_y: string[]
  cau_tra_loi_mau: string | null
  rubric_json: { ma_key: string; ten_tieu_chi: string; diem_toi_da: number }[]
  thu_tu: number
  dang_hoat_dong: boolean
}

// ── Kiểu kết quả AI ───────────────────────────────────────────────────────────
interface SpeechFeedback {
  overallScore: number
  fluency: number; vocabulary: number; grammar: number; content: number
  band: string
  generalComment: string
  strengths: string[]
  improvements: string[]
  detectedKeywords: string[]
  correctedSentence?: string
}
interface DaLamInfo { diem: number; tong: number; ngay: string }
type RecordingState = 'idle' | 'preparing' | 'recording' | 'recorded' | 'analyzing'
type ViewState = 'list' | 'speak' | 'feedback'

// ── Global CSS — giống hệt Writing page ──────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes blobMorph{
    0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}
    50%    {border-radius:30% 60% 70% 40%/50% 60% 30% 60%}
  }
  @keyframes pulseRing{
    0%  {box-shadow:0 0 0 0 rgba(240,100,100,.4)}
    70% {box-shadow:0 0 0 12px rgba(240,100,100,0)}
    100%{box-shadow:0 0 0 0 rgba(240,100,100,0)}
  }
  @keyframes cdShrink { from{width:100%} to{width:0%} }
  .fade-in    { animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both }
  .task-card  { transition:all .38s cubic-bezier(.16,1,.3,1); position:relative; overflow:hidden }
  .task-card::after{ content:''; position:absolute; bottom:0; left:0; width:0; height:3px;
    background:#C9A84C; transition:width .38s cubic-bezier(.16,1,.3,1); border-radius:0 0 24px 24px }
  .task-card:hover{ transform:translateY(-7px) scale(1.01);
    box-shadow:0 28px 56px rgba(15,28,53,.14)!important;
    border-color:rgba(201,168,76,.45)!important }
  .task-card:hover::after{ width:100% }
  .rec-btn  { animation:pulseRing 1.5s ease-out infinite }
  .sub-btn  { transition:all .32s cubic-bezier(.34,1.56,.64,1) }
  .sub-btn:hover:not(:disabled){ transform:translateY(-3px) scale(1.01);
    box-shadow:0 12px 32px rgba(201,168,76,.5)!important }
`

// ── Shared atoms — đồng bộ Writing ───────────────────────────────────────────
function LevelBadge({ level }: { level: string }) {
  const s = LEVEL_STYLE[level] ?? LEVEL_STYLE.A2
  return <span style={{ padding:'3px 12px', borderRadius:6, fontSize:12, fontWeight:700,
    background:s.bg, color:s.color, border:`1px solid ${s.border}`,
    letterSpacing:'.04em', fontFamily:"'DM Sans',sans-serif" }}>{level}</span>
}
function CertBadge({ cert }: { cert: string }) {
  const color = CERT_COLOR[cert] ?? C.slate
  return <span style={{ padding:'3px 12px', borderRadius:6, fontSize:12, fontWeight:700,
    background:`${color}12`, color, border:`1px solid ${color}28`,
    letterSpacing:'.04em', fontFamily:"'DM Sans',sans-serif" }}>{cert}</span>
}
function Panel({ children, style, className }: {
  children: React.ReactNode; style?: React.CSSProperties; className?: string
}) {
  return <div className={className} style={{ background:C.white, borderRadius:24,
    border:`1px solid ${C.border}`, padding:'28px 32px',
    boxShadow:'0 2px 16px rgba(15,28,53,.07)', ...style }}>{children}</div>
}
function SectionHeader({ icon: Icon, title, sub, color }: {
  icon: React.ElementType; title: string; sub?: string; color: string
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
      <div style={{ width:48, height:48, borderRadius:14, background:`${color}15`,
        border:`1px solid ${color}28`, display:'flex', alignItems:'center',
        justifyContent:'center', flexShrink:0 }}>
        <Icon size={22} color={color} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{ fontSize:17, fontWeight:700, color:C.navy,
          fontFamily:"'DM Sans',sans-serif", lineHeight:1.3 }}>{title}</div>
        {sub && <div style={{ fontSize:13, color:C.textMid, marginTop:3 }}>{sub}</div>}
      </div>
    </div>
  )
}
function ScoreRing({ score, max }: { score: number; max: number }) {
  const r=44, cx=52, cy=52, circ=2*Math.PI*r
  const pct = score/max
  const col = pct>=0.8 ? C.green : pct>=0.6 ? C.gold : C.rose
  return (
    <svg width={108} height={108} viewBox="0 0 104 104">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${C.navy}10`} strokeWidth={8}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={8}
        strokeDasharray={`${circ*score/max} ${circ*(1-score/max)}`}
        strokeDashoffset={circ*.25} strokeLinecap="round"
        style={{transition:'stroke-dasharray 1s ease'}}/>
      <text x={cx} y={cy-7} textAnchor="middle" fill={col} fontSize={24} fontWeight={800}
        fontFamily="'Playfair Display',serif">{score}</text>
      <text x={cx} y={cy+14} textAnchor="middle" fill={C.textLt} fontSize={13}
        fontFamily="'DM Sans',sans-serif">/{max}</text>
    </svg>
  )
}
function SmallScoreRing({ pct }: { pct: number }) {
  const r=18, cx=23, cy=23, circ=2*Math.PI*r
  const col = pct>=80 ? C.green : pct>=60 ? C.gold : C.rose
  return (
    <svg width={46} height={46} viewBox="0 0 46 46" style={{flexShrink:0}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${col}20`} strokeWidth={4}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round"
        style={{transform:`rotate(-90deg)`,transformOrigin:`${cx}px ${cy}px`,
          transition:'stroke-dashoffset .9s'}}/>
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fill={col} fontSize={9} fontWeight={900} fontFamily="'DM Sans',sans-serif">{pct}%</text>
    </svg>
  )
}
function TaskSkeleton() {
  return (
    <div style={{ background:C.white, borderRadius:24, border:`1px solid ${C.border}`,
      padding:28, boxShadow:'0 2px 12px rgba(15,28,53,.05)' }}>
      <div style={{ display:'flex', gap:16, marginBottom:18 }}>
        <div style={{ width:56, height:56, borderRadius:16, background:'#F3F4F6' }}/>
        <div style={{ flex:1 }}>
          <div style={{ height:12, background:'#F3F4F6', borderRadius:6, width:80, marginBottom:10 }}/>
          <div style={{ height:18, background:'#F3F4F6', borderRadius:6, width:180 }}/>
        </div>
      </div>
      <div style={{ height:13, background:'#F3F4F6', borderRadius:6, marginBottom:10 }}/>
      <div style={{ height:13, background:'#F3F4F6', borderRadius:6, width:'60%' }}/>
    </div>
  )
}
function getScoreStyle(score: number, max: number) {
  const p = score/max
  if (p>=0.8) return { bg:'#E1F5EE', text:'#0F6E56', bar:C.green, border:'rgba(0,168,120,.3)' }
  if (p>=0.6) return { bg:'#FDF8EE', text:'#7a5c00', bar:C.gold,  border:'rgba(201,168,76,.3)' }
  return           { bg:'#FEF2F2', text:'#A32D2D', bar:C.rose,  border:'rgba(240,100,100,.3)' }
}
function ScoreBar({ label, score, max }: { label:string; score:number; max:number }) {
  const s = getScoreStyle(score, max)
  return (
    <div style={{ padding:'14px 18px', borderRadius:14, background:C.bg, border:`1px solid ${C.border}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontSize:14, fontWeight:700, color:C.navy }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:8,
          background:s.bg, color:s.text, border:`1px solid ${s.border}` }}>{score}/{max}</span>
      </div>
      <div style={{ height:5, background:`${C.navy}08`, borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${score/max*100}%`, background:s.bar, borderRadius:3,
          transition:'width .7s cubic-bezier(.16,1,.3,1)' }}/>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Main component
// ═════════════════════════════════════════════════════════════════════════════
export default function SpeakingPage() {
  const [topics,   setTopics]   = useState<BaiLuyenNoi[]>([])
  const [daLamMap, setDaLamMap] = useState<Record<string, DaLamInfo>>({})
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<BaiLuyenNoi | null>(null)
  const [view,     setView]     = useState<ViewState>('list')
  const [activeTab, setActiveTab] = useState<'speak'|'guide'>('speak')

  const [recordState, setRecordState] = useState<RecordingState>('idle')
  const [transcript,  setTranscript]  = useState('')
  const [feedback,    setFeedback]    = useState<SpeechFeedback | null>(null)
  const [timer,       setTimer]       = useState(0)
  const [prepTimer,   setPrepTimer]   = useState(0)
  const [showSample,  setShowSample]  = useState(false)
  const [supported,   setSupported]   = useState(true)

  const recognitionRef    = useRef<ISpeechRecognition | null>(null)
  const timerRef          = useRef<ReturnType<typeof setInterval>>()
  const prepTimerRef      = useRef<ReturnType<typeof setInterval>>()
  const fullTranscriptRef = useRef('')

  // ── Load dữ liệu từ bảng BaiLuyenNoi ──────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) setSupported(false)

    // Gọi API route map sang bảng BaiLuyenNoi (Supabase)
    fetch('/api/speaking')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setTopics(data)
        else toast.error('Chưa có bài luyện nói nào được kích hoạt.')
      })
      .catch(() => toast.error('Lỗi kết nối server'))
      .finally(() => setLoading(false))

    // Lịch sử đã làm từ KetQuaLuyenNoi
    fetch('/api/speaking?history=1')
      .then(r => r.json())
      .then(data => { if (data?.daLamMap) setDaLamMap(data.daLamMap) })
      .catch(() => {})

    return () => { clearInterval(timerRef.current); clearInterval(prepTimerRef.current); recognitionRef.current?.stop() }
  }, [])

  // ── Recording helpers ──────────────────────────────────────────────────────
  function startPrepare() {
    if (!selected) return
    setRecordState('preparing')
    setTranscript(''); setFeedback(null); fullTranscriptRef.current = ''
    let remaining = selected.thoi_gian_chuan_bi_giay
    setPrepTimer(remaining)
    prepTimerRef.current = setInterval(() => {
      remaining -= 1; setPrepTimer(remaining)
      if (remaining <= 0) { clearInterval(prepTimerRef.current); startRecording() }
    }, 1000)
  }
  function skipPrepare() { clearInterval(prepTimerRef.current); startRecording() }

  function startRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Dùng Google Chrome để sử dụng tính năng này!'); return }
    fullTranscriptRef.current = ''; setTranscript(''); setRecordState('recording'); setTimer(0)
    timerRef.current = setInterval(() => setTimer(t => t+1), 1000)

    const rec = new SR()
    rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1
    rec.onresult = (e: ISpeechRecognitionEvent) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) fullTranscriptRef.current += t + ' '
        else interim += t
      }
      setTranscript(fullTranscriptRef.current + interim)
    }
    rec.onerror = (e: ISpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech') return
      toast.error('Lỗi microphone: ' + e.error); stopRecording()
    }
    rec.onend = () => { if (recognitionRef.current) rec.start() }
    recognitionRef.current = rec; rec.start()
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    recognitionRef.current?.stop(); recognitionRef.current = null
    const final = fullTranscriptRef.current.trim()
    setTranscript(final); setRecordState(final ? 'recorded' : 'idle')
    if (!final) toast('Không nhận được âm thanh. Thử lại nhé!', { icon: '🎙️' })
  }

  function resetAll() {
    clearInterval(timerRef.current); clearInterval(prepTimerRef.current)
    recognitionRef.current?.stop(); recognitionRef.current = null
    setRecordState('idle'); setTranscript(''); setFeedback(null)
    setTimer(0); setPrepTimer(0); fullTranscriptRef.current = ''; setShowSample(false)
  }

  // ── Gọi AI phân tích — prompt khớp rubric_json từ DB ──────────────────────
  async function analyzeWithAI() {
    if (!transcript.trim() || !selected) return
    setRecordState('analyzing')

    const totalMax = selected.rubric_json.reduce((s, r) => s + r.diem_toi_da, 0)
    const detectedKw = selected.tu_khoa_goi_y.filter(kw =>
      transcript.toLowerCase().includes(kw.toLowerCase())
    )
    // Tạo tiêu chí chấm điểm động từ rubric_json trong DB
    const rubricLines = selected.rubric_json
      .map(r => `- ${r.ten_tieu_chi} (max ${r.diem_toi_da} điểm)`)
      .join('\n')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Bạn là giám khảo chấm thi nói ${selected.loai_chung_chi} chuyên nghiệp, nghiêm khắc.

THÔNG TIN BÀI THI:
- Chứng chỉ: ${selected.loai_chung_chi} ${selected.cap_do}
- Chủ đề: ${selected.tieu_de}
- Loại bài: ${selected.loai_bai}
${selected.thong_tin_ky_thi ? `- Thông tin kỳ thi: ${selected.thong_tin_ky_thi}` : ''}

ĐỀ BÀI:
${selected.noi_dung_de_bai}

TRANSCRIPT BÀI NÓI (${Math.floor(timer/60)}:${(timer%60).toString().padStart(2,'0')}):
${transcript}

TỪ KHÓA PHÁT HIỆN: ${detectedKw.join(', ') || 'chưa có'}

TIÊU CHÍ CHẤM (từ rubric):
${rubricLines}
Tổng điểm tối đa: ${totalMax}

QUY TẮC:
1. Điểm ≥80% chỉ cho bài xuất sắc thực sự
2. Trích dẫn cụ thể từ transcript khi nhận xét
3. Band: Xuất sắc(≥90%) Tốt(≥80%) Khá(≥70%) Trung bình(≥60%) Yếu(≥50%) Cần cố gắng(<50%)

Trả về JSON thuần KHÔNG có markdown:
{
  "overallScore": <0-${totalMax}>,
  "fluency":    <0-10>,
  "vocabulary": <0-10>,
  "grammar":    <0-10>,
  "content":    <0-10>,
  "band": "<band>",
  "generalComment": "<nhận xét 3-4 câu bằng tiếng Việt>",
  "strengths":    ["<điểm mạnh 1>", "<điểm mạnh 2>"],
  "improvements": ["<cải thiện 1>", "<cải thiện 2>", "<cải thiện 3>"],
  "correctedSentence": "<1 câu lỗi tiêu biểu + cách sửa, hoặc null>",
  "detectedKeywords": ${JSON.stringify(detectedKw)}
}`,
          type: 'speaking',
        }),
      })
      const data = await res.json()
      const clean = (data.response ?? data.message ?? '').replace(/```json|```/g, '').trim()
      const parsed: SpeechFeedback = JSON.parse(clean)
      setFeedback(parsed); setRecordState('recorded'); setView('feedback')
      toast.success('AI đã phân tích xong!')

      // Lưu vào KetQuaLuyenNoi
      fetch('/api/speaking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baiLuyenNoiId: selected.id,       // FK → BaiLuyenNoi.id
          transcript,
          tong_diem:    parsed.overallScore,
          max_diem:     totalMax,
          band:         parsed.band,
          phan_tich_ai: parsed,
          thoi_gian_giay: timer,
        }),
      }).then(() => {
        setDaLamMap(prev => ({
          ...prev,
          [selected.id]: { diem: parsed.overallScore, tong: totalMax, ngay: new Date().toISOString() },
        }))
      }).catch(() => {})
    } catch {
      toast.error('Lỗi phân tích. Thử lại nhé!')
      setRecordState('recorded')
    }
  }

  const fmt = (s: number) =>
    `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  function startTask(topic: BaiLuyenNoi) {
    setSelected(topic); resetAll(); setView('speak'); setActiveTab('speak')
  }
  function goHome() { resetAll(); setView('list'); setSelected(null) }

  const totalMax  = selected?.rubric_json.reduce((s, r) => s + r.diem_toi_da, 0) ?? 40
  const certColor = selected ? (CERT_COLOR[selected.loai_chung_chi] ?? C.slate) : C.navy

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === 'list') {
    const grouped = topics.reduce((acc, t) => {
      if (!acc[t.loai_chung_chi]) acc[t.loai_chung_chi] = []
      acc[t.loai_chung_chi].push(t)
      return acc
    }, {} as Record<string, BaiLuyenNoi[]>)

    const doneCount = Object.keys(daLamMap).length
    const highCount = Object.values(daLamMap).filter(v => Math.round(v.diem/v.tong*100) >= 80).length

    return (
      <div style={{ maxWidth:1100, margin:'0 auto', paddingTop:36, paddingBottom:80, fontFamily:"'DM Sans',sans-serif" }}>
        <style suppressHydrationWarning>{GLOBAL_CSS}</style>

        {/* Hero */}
        <div style={{ background:C.navy, borderRadius:28, padding:'clamp(32px,4vw,52px) clamp(28px,4vw,52px)', marginBottom:40, position:'relative', overflow:'hidden', boxShadow:'0 20px 60px rgba(15,28,53,.25)' }}>
          <div style={{ position:'absolute', top:-70, right:-70, width:320, height:320, background:'rgba(201,168,76,.07)', borderRadius:'60% 40% 30% 70%', animation:'blobMorph 10s ease-in-out infinite', pointerEvents:'none', filter:'blur(24px)' }}/>
          <div style={{ position:'absolute', bottom:-50, left:-50, width:200, height:200, background:'rgba(0,168,120,.06)', borderRadius:'40% 60%', pointerEvents:'none', filter:'blur(28px)' }}/>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 16px', background:'rgba(201,168,76,.12)', border:'1px solid rgba(201,168,76,.28)', borderRadius:50, fontSize:11, fontWeight:700, color:C.gold, textTransform:'uppercase' as const, letterSpacing:'1px', marginBottom:20 }}>
            <Mic size={11} strokeWidth={2.5}/> Luyện kỹ năng nói
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(32px,4.5vw,52px)', fontWeight:900, color:'#fff', marginBottom:16, lineHeight:1.1, letterSpacing:'-0.5px' }}>
            Speaking <em style={{ fontStyle:'italic', color:C.gold }}>AI Grading</em>
          </h1>
          <p style={{ fontSize:17, color:'rgba(255,255,255,.52)', maxWidth:520, lineHeight:1.78, marginBottom:32 }}>
            {topics.length} chủ đề · Nhận dạng giọng nói · AI chấm theo rubric · VSTEP · TOEIC · APTIS
          </p>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' as const }}>
            {[
              { label:'Chủ đề',   val:topics.length, icon:<MessageSquare size={18} strokeWidth={1.8} color={C.goldLt}/> },
              { label:'Đã luyện', val:doneCount,     icon:<CheckCircle2  size={18} strokeWidth={1.8} color={C.greenLt}/> },
              { label:'Điểm cao', val:highCount,     icon:<Trophy        size={18} strokeWidth={1.8} color={C.violet}/> },
            ].map((s, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,.07)', border:'1px solid rgba(201,168,76,.2)', borderRadius:18, padding:'14px 22px', display:'flex', alignItems:'center', gap:12, backdropFilter:'blur(8px)' }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>{s.icon}</div>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:'#fff', lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.4)', marginTop:4, fontWeight:500 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danh sách theo cert */}
        {loading
          ? <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:18 }}>
              {Array.from({length:4}).map((_,i) => <TaskSkeleton key={i}/>)}
            </div>
          : Object.entries(grouped).map(([cert, certTopics]) => {
              const Icon  = CERT_ICON[cert] ?? BookOpen
              const col   = CERT_COLOR[cert] ?? C.slate
              return (
                <div key={cert} className="fade-in" style={{ marginBottom:40 }}>
                  {/* Cert header */}
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                    <div style={{ width:42, height:42, borderRadius:12, background:`${col}15`, border:`1px solid ${col}28`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon size={20} color={col} strokeWidth={1.8}/>
                    </div>
                    <div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:800, color:C.navy, lineHeight:1 }}>{cert}</div>
                      <div style={{ fontSize:13, color:C.textLt, marginTop:3 }}>{certTopics.length} chủ đề</div>
                    </div>
                    <div style={{ flex:1, height:1, background:C.border, marginLeft:8 }}/>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(330px,1fr))', gap:16 }}>
                    {certTopics.map(topic => {
                      const dl  = daLamMap[topic.id]
                      const pct = dl ? Math.round(dl.diem/dl.tong*100) : null
                      return (
                        <button key={topic.id} className="task-card" onClick={() => startTask(topic)}
                          style={{ padding:26, background:C.white, borderRadius:24, border:`1px solid ${C.border}`, textAlign:'left', cursor:'pointer', boxShadow:'0 2px 14px rgba(15,28,53,.06)', fontFamily:"'DM Sans',sans-serif", width:'100%' }}>
                          <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:16 }}>
                            <div style={{ width:54, height:54, borderRadius:16, flexShrink:0, background:`${col}10`, border:`1px solid ${col}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
                              {topic.bieu_tuong}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', gap:7, marginBottom:8, flexWrap:'wrap' }}>
                                <CertBadge cert={topic.loai_chung_chi}/>
                                <LevelBadge level={topic.cap_do}/>
                              </div>
                              <div style={{ fontSize:16, fontWeight:700, color:C.navy, lineHeight:1.35 }}>{topic.tieu_de}</div>
                            </div>
                          </div>
                          <p style={{ fontSize:14, color:C.textMid, lineHeight:1.65,
                            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                            overflow:'hidden', marginBottom:16 }}>
                            {topic.mo_ta ?? topic.noi_dung_de_bai}
                          </p>
                          <div style={{ paddingTop:14, borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:13, color:C.textLt, display:'flex', alignItems:'center', gap:5 }}>
                              <Clock size={13} strokeWidth={1.8}/>
                              Chuẩn bị {topic.thoi_gian_chuan_bi_giay}s · Nói {Math.ceil(topic.thoi_gian_tra_loi_giay/60)} phút
                            </span>
                            {pct !== null ? (
                              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <SmallScoreRing pct={pct}/>
                                <span style={{ fontSize:11, fontWeight:700,
                                  color:pct>=80?'#0F6E56':pct>=60?'#7a5c00':'#A32D2D',
                                  background:pct>=80?'#E1F5EE':pct>=60?C.goldPale:'#FEF2F2',
                                  border:`1px solid ${pct>=80?'rgba(0,168,120,.25)':pct>=60?C.borderMd:'rgba(240,100,100,.25)'}`,
                                  padding:'3px 10px', borderRadius:50 }}>Đã luyện</span>
                              </div>
                            ) : (
                              <span style={{ fontSize:11, fontWeight:700, color:C.textLt, background:`${C.navy}07`, border:`1px solid ${C.border}`, padding:'3px 10px', borderRadius:50 }}>Chưa luyện</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
        }
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEAK VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === 'speak' && selected) {
    const kwDetected = selected.tu_khoa_goi_y.filter(kw =>
      transcript.toLowerCase().includes(kw.toLowerCase())
    )
    return (
      <div style={{ maxWidth:1100, margin:'0 auto', paddingTop:36, paddingBottom:80, fontFamily:"'DM Sans',sans-serif" }}>
        <style suppressHydrationWarning>{GLOBAL_CSS}</style>

        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, color:C.textLt, marginBottom:28 }}>
          <span onClick={goHome} style={{ cursor:'pointer', color:C.gold, display:'flex', alignItems:'center', gap:5, fontWeight:600 }}>
            <Home size={14} strokeWidth={2}/> Luyện nói
          </span>
          <ChevronRight size={15} color={C.textLt} strokeWidth={1.8}/>
          <span style={{ color:C.navy, fontWeight:600 }}>{selected.tieu_de}</span>
        </div>

        {/* Header navy */}
        <div style={{ background:C.navy, borderRadius:24, padding:'32px 36px', marginBottom:32, position:'relative', overflow:'hidden', boxShadow:'0 12px 40px rgba(15,28,53,.2)' }}>
          <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, background:'rgba(201,168,76,.07)', borderRadius:'60% 40% 30% 70%', pointerEvents:'none', filter:'blur(20px)' }}/>
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            <CertBadge cert={selected.loai_chung_chi}/>
            <LevelBadge level={selected.cap_do}/>
            {selected.loai_bai && (
              <span style={{ padding:'3px 12px', borderRadius:6, fontSize:12, fontWeight:600, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)', border:'1px solid rgba(255,255,255,.15)', fontFamily:"'DM Sans',sans-serif" }}>
                {selected.loai_bai.replace(/_/g,' ')}
              </span>
            )}
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(22px,3vw,32px)', fontWeight:900, color:'#fff', marginBottom:10, lineHeight:1.2 }}>
            {selected.tieu_de}
          </h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.45)', lineHeight:1.6 }}>
            {selected.thong_tin_ky_thi ?? `Chuẩn bị ${selected.thoi_gian_chuan_bi_giay}s · Trả lời ${Math.ceil(selected.thoi_gian_tra_loi_giay/60)} phút`}
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:24, alignItems:'start' }}>
          {/* ── Left ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Đề bài */}
            <Panel>
              <SectionHeader icon={FileText} title="Đề bài" color={certColor}
                sub={selected.thong_tin_ky_thi ?? undefined}/>
              <div style={{ background:C.bg, borderRadius:14, padding:'18px 22px', fontSize:15, color:C.navy, lineHeight:1.85, borderLeft:`3px solid ${certColor}` }}>
                {selected.noi_dung_de_bai}
              </div>
              {/* Hướng dẫn từ DB nếu có */}
              {selected.huong_dan && (
                <div style={{ marginTop:14, padding:'12px 16px', background:`${certColor}08`, borderRadius:12, fontSize:14, color:C.textMid, lineHeight:1.7 }}>
                  💡 {selected.huong_dan}
                </div>
              )}
            </Panel>

            {/* Recording panel */}
            <Panel style={{ padding:0, overflow:'hidden' }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Mic size={17} color={C.textMid} strokeWidth={1.8}/>
                  <span style={{ fontSize:15, fontWeight:600, color:C.textMid }}>Ghi âm bài nói</span>
                </div>
                {recordState === 'recording' && (
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:C.rose }}/>
                    <span style={{ fontFamily:'monospace', fontSize:15, fontWeight:700, color:C.rose }}>{fmt(timer)}</span>
                  </div>
                )}
                {recordState === 'preparing' && (
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Clock size={15} color={C.gold} strokeWidth={2}/>
                    <span style={{ fontFamily:'monospace', fontSize:15, fontWeight:700, color:C.gold }}>Chuẩn bị: {prepTimer}s</span>
                  </div>
                )}
              </div>

              {/* Countdown bar khi chuẩn bị */}
              {recordState === 'preparing' && (
                <div style={{ height:3, background:`${C.gold}20` }}>
                  <div style={{ height:'100%', background:C.gold,
                    animation:`cdShrink ${selected.thoi_gian_chuan_bi_giay}s linear forwards` }}/>
                </div>
              )}

              <div style={{ padding:24 }}>
                {!supported && (
                  <div style={{ marginBottom:18, padding:'14px 18px', background:'#FEF2F2', border:'1px solid rgba(240,100,100,.2)', borderRadius:14, fontSize:14, color:C.rose }}>
                    ⚠️ Trình duyệt không hỗ trợ. Vui lòng dùng Google Chrome!
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display:'flex', gap:12, marginBottom:20 }}>
                  {recordState === 'idle' && (
                    <button onClick={startPrepare} disabled={!supported} className="sub-btn"
                      style={{ flex:1, padding:'14px 0', background:C.gold, color:C.navy, fontWeight:700, fontSize:15, border:'none', borderRadius:50, cursor:supported?'pointer':'not-allowed', opacity:supported?1:.4, fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:9, boxShadow:'0 8px 24px rgba(201,168,76,.4)' }}>
                      <Mic size={17} strokeWidth={2.2}/> Bắt đầu luyện nói
                    </button>
                  )}
                  {recordState === 'preparing' && (
                    <>
                      <div style={{ flex:1, padding:'14px 0', background:C.goldPale, border:`1px solid ${C.borderMd}`, borderRadius:50, fontSize:15, fontWeight:600, color:'#7a5c00', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                        <Clock size={16} strokeWidth={2}/> Chuẩn bị: {prepTimer}s
                      </div>
                      <button onClick={skipPrepare} style={{ padding:'14px 22px', background:C.white, border:`1px solid ${C.border}`, borderRadius:50, fontSize:14, fontWeight:600, color:C.textMid, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                        Bỏ qua →
                      </button>
                    </>
                  )}
                  {recordState === 'recording' && (
                    <button onClick={stopRecording} className="rec-btn"
                      style={{ flex:1, padding:'14px 0', background:C.rose, color:'#fff', fontWeight:700, fontSize:15, border:'none', borderRadius:50, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:9 }}>
                      <MicOff size={17} strokeWidth={2.2}/> Dừng ghi âm
                    </button>
                  )}
                  {recordState === 'recorded' && (
                    <button onClick={startPrepare}
                      style={{ flex:1, padding:'14px 0', background:C.white, border:`1.5px solid ${C.border}`, color:C.navy, fontWeight:600, fontSize:14, borderRadius:50, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                      <RotateCcw size={15} strokeWidth={2}/> Nói lại
                    </button>
                  )}
                  {recordState === 'analyzing' && (
                    <div style={{ flex:1, padding:'14px 0', background:`${C.gold}14`, border:`1px solid ${C.borderMd}`, borderRadius:50, fontSize:15, fontWeight:600, color:'#7a5c00', display:'flex', alignItems:'center', justifyContent:'center', gap:9 }}>
                      ⏳ AI đang phân tích...
                    </div>
                  )}
                </div>

                {/* Transcript */}
                {(transcript || recordState === 'recording' || recordState === 'preparing') && (
                  <div style={{ padding:'16px 18px', background:C.bg, borderRadius:14, minHeight:96, fontSize:15, color:C.textMid, lineHeight:1.8, border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.textLt, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>
                      {recordState==='recording' ? '🔴 Đang nhận dạng...' : '📝 Transcript'}
                    </div>
                    <div style={{ color:transcript?C.text:C.textLt, fontStyle:transcript?'normal':'italic' }}>
                      {transcript || (recordState==='preparing' ? 'Đọc kỹ đề bài, chuẩn bị ý tưởng...' : 'Chưa nhận được âm thanh...')}
                    </div>
                  </div>
                )}

                {/* Keyword pills */}
                {(recordState==='recording'||recordState==='recorded') && selected.tu_khoa_goi_y.length>0 && (
                  <div style={{ marginTop:14, display:'flex', flexWrap:'wrap', gap:8 }}>
                    {selected.tu_khoa_goi_y.map(kw => {
                      const found = transcript.toLowerCase().includes(kw.toLowerCase())
                      return (
                        <span key={kw} style={{ fontSize:12, padding:'4px 12px', borderRadius:50, fontWeight:600, background:found?'#E1F5EE':C.bg, color:found?'#0F6E56':C.textLt, border:`1px solid ${found?'rgba(0,168,120,.25)':C.border}`, transition:'all .3s' }}>
                          {found?'✓':'○'} {kw}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </Panel>

            {/* Nút AI */}
            {recordState==='recorded' && transcript && (
              <button onClick={analyzeWithAI} className="sub-btn"
                style={{ width:'100%', padding:'16px 0', background:C.gold, color:C.navy, fontWeight:700, fontSize:16, border:'none', borderRadius:50, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:'0 8px 24px rgba(201,168,76,.4)', display:'flex', alignItems:'center', justifyContent:'center', gap:9 }}>
                🤖 Phân tích & chấm điểm bằng AI
              </button>
            )}

            {/* Bài mẫu */}
            {selected.cau_tra_loi_mau && (
              <>
                <button onClick={() => setShowSample(!showSample)}
                  style={{ width:'100%', padding:'13px 0', border:`1.5px solid ${C.border}`, background:C.white, color:C.textMid, fontWeight:600, borderRadius:50, cursor:'pointer', fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>
                  {showSample ? 'Ẩn' : 'Xem'} bài mẫu tham khảo
                </button>
                {showSample && (
                  <div style={{ padding:'20px 24px', background:C.goldPale, border:`1px solid ${C.borderMd}`, borderRadius:20 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.gold, marginBottom:10, textTransform:'uppercase', letterSpacing:'.06em' }}>📖 Bài mẫu tham khảo</div>
                    <div style={{ fontSize:15, color:'#5a4000', lineHeight:1.85, fontStyle:'italic' }}>{selected.cau_tra_loi_mau}</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Right ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {/* Tab */}
            <div style={{ display:'flex', background:C.white, borderRadius:14, border:`1px solid ${C.border}`, padding:5, boxShadow:'0 2px 10px rgba(15,28,53,.05)' }}>
              {(['speak','guide'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ flex:1, padding:'9px 0', borderRadius:10, fontSize:14, fontWeight:600, border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", background:activeTab===tab?C.navy:'transparent', color:activeTab===tab?'#fff':C.textMid, transition:'all .22s' }}>
                  {tab==='speak' ? '🎙️ Luyện nói' : '💡 Hướng dẫn'}
                </button>
              ))}
            </div>

            {activeTab==='guide' && (
              <>
                {/* Gợi ý từ goi_y_json */}
                {selected.goi_y_json.length > 0 && (
                  <Panel>
                    <SectionHeader icon={Lightbulb} title="Gợi ý cấu trúc" color={C.gold}/>
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {selected.goi_y_json.map((tip, i) => (
                        <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                          <div style={{ width:26, height:26, borderRadius:'50%', background:C.goldPale, border:`1px solid ${C.borderMd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:C.gold, flexShrink:0, marginTop:1 }}>{i+1}</div>
                          <span style={{ fontSize:14, color:C.textMid, lineHeight:1.7 }}>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}
                {/* Rubric từ rubric_json */}
                <Panel>
                  <SectionHeader icon={Target} title="Tiêu chí chấm" color={certColor}/>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {selected.rubric_json.map((r, i) => (
                      <div key={i} style={{ padding:'12px 16px', borderRadius:12, background:C.bg, border:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:14, fontWeight:600, color:C.navy }}>{r.ten_tieu_chi}</span>
                        <span style={{ fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:8, background:`${certColor}10`, color:certColor, border:`1px solid ${certColor}22` }}>{r.diem_toi_da}đ</span>
                      </div>
                    ))}
                    <div style={{ padding:'10px 16px', borderRadius:12, background:`${C.navy}05`, border:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:14, fontWeight:700, color:C.navy }}>Tổng điểm</span>
                      <span style={{ fontSize:14, fontWeight:800, color:certColor }}>{totalMax}đ</span>
                    </div>
                  </div>
                </Panel>
              </>
            )}

            {activeTab==='speak' && (
              <>
                <Panel style={{ background:C.goldPale, border:`1px solid ${C.borderMd}` }}>
                  <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:'rgba(201,168,76,.2)', border:`1px solid ${C.borderMd}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Volume2 size={18} color={C.gold} strokeWidth={2}/>
                    </div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#7a5c00', marginBottom:6 }}>Lưu ý khi nói</div>
                      <div style={{ fontSize:14, color:'#7a5c00', lineHeight:1.72 }}>
                        Nói tự nhiên, rõ ràng vào microphone. AI nhận dạng và ghi transcript thực — không cần đọc thuộc, hãy diễn đạt theo ý bạn.
                      </div>
                    </div>
                  </div>
                </Panel>

                {(recordState==='recording'||recordState==='recorded') && selected.tu_khoa_goi_y.length>0 && (
                  <Panel>
                    <SectionHeader icon={Target} title="Từ khóa" sub={`${kwDetected.length}/${selected.tu_khoa_goi_y.length} đã dùng`} color={C.green}/>
                    <div style={{ height:6, background:`${C.navy}08`, borderRadius:3, overflow:'hidden', marginBottom:14 }}>
                      <div style={{ height:'100%', width:`${kwDetected.length/selected.tu_khoa_goi_y.length*100}%`, background:C.green, borderRadius:3, transition:'width .5s' }}/>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {selected.tu_khoa_goi_y.map(kw => {
                        const found = kwDetected.includes(kw)
                        return <span key={kw} style={{ fontSize:12, padding:'4px 12px', borderRadius:50, fontWeight:600, background:found?'#E1F5EE':C.bg, color:found?'#0F6E56':C.textLt, border:`1px solid ${found?'rgba(0,168,120,.25)':C.border}` }}>{found?'✓':'○'} {kw}</span>
                      })}
                    </div>
                  </Panel>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FEEDBACK VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (view==='feedback' && selected && feedback) {
    const s = getScoreStyle(feedback.overallScore, totalMax)
    return (
      <div style={{ maxWidth:1100, margin:'0 auto', paddingTop:36, paddingBottom:80, fontFamily:"'DM Sans',sans-serif" }}>
        <style suppressHydrationWarning>{GLOBAL_CSS}</style>

        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, color:C.textLt, marginBottom:28 }}>
          <span onClick={goHome} style={{ cursor:'pointer', color:C.gold, display:'flex', alignItems:'center', gap:5, fontWeight:600 }}>
            <Home size={14} strokeWidth={2}/> Luyện nói
          </span>
          <ChevronRight size={15} color={C.textLt} strokeWidth={1.8}/>
          <span onClick={() => { setView('speak'); setRecordState('idle') }} style={{ cursor:'pointer', color:C.gold, fontWeight:500 }}>{selected.tieu_de}</span>
          <ChevronRight size={15} color={C.textLt} strokeWidth={1.8}/>
          <span style={{ color:C.navy, fontWeight:600 }}>Kết quả</span>
        </div>

        {/* Score header */}
        <div className="fade-in" style={{ background:C.navy, borderRadius:28, padding:'36px 40px', marginBottom:28, display:'flex', alignItems:'center', gap:36, position:'relative', overflow:'hidden', flexWrap:'wrap', boxShadow:'0 20px 56px rgba(15,28,53,.22)' }}>
          <div style={{ position:'absolute', top:-50, right:-50, width:260, height:260, background:'rgba(201,168,76,.07)', borderRadius:'60% 40% 30% 70%', pointerEvents:'none', filter:'blur(24px)' }}/>
          <ScoreRing score={feedback.overallScore} max={totalMax}/>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
              <CertBadge cert={selected.loai_chung_chi}/>
              <LevelBadge level={selected.cap_do}/>
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(26px,3.5vw,40px)', fontWeight:900, color:'#fff', marginBottom:8, letterSpacing:'-0.3px' }}>
              {feedback.band}
            </div>
            <div style={{ fontSize:15, color:'rgba(255,255,255,.42)', lineHeight:1.5 }}>
              Thời gian nói: {fmt(timer)}
            </div>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <button onClick={() => { resetAll(); setView('speak') }}
              style={{ padding:'11px 24px', borderRadius:50, background:'rgba(255,255,255,.08)', border:'1.5px solid rgba(255,255,255,.18)', color:'rgba(255,255,255,.85)', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:8 }}>
              <RotateCcw size={15} strokeWidth={2}/> Nói lại
            </button>
            <button onClick={goHome}
              style={{ padding:'11px 24px', borderRadius:50, background:C.gold, border:'none', color:C.navy, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:8, boxShadow:'0 6px 20px rgba(201,168,76,.45)' }}>
              Chủ đề khác
            </button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:24, alignItems:'start' }}>
          {/* Left */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Panel className="fade-in">
              <SectionHeader icon={BookOpen} title="Nhận xét tổng thể" color={C.gold}/>
              <div style={{ padding:'18px 20px', background:C.goldPale, borderRadius:14, border:`1px solid ${C.borderMd}`, fontSize:15, color:'#5a4000', lineHeight:1.85 }}>
                {feedback.generalComment}
              </div>
            </Panel>

            {feedback.correctedSentence && (
              <Panel>
                <SectionHeader icon={Mic} title="Ví dụ sửa lỗi" color={C.violet}/>
                <div style={{ padding:'16px 18px', background:'rgba(100,120,240,.05)', borderLeft:`3px solid ${C.violet}`, borderRadius:'0 14px 14px 0', fontSize:15, color:C.textMid, lineHeight:1.78 }}>
                  {feedback.correctedSentence}
                </div>
              </Panel>
            )}

            {/* Chi tiết tiêu chí — render động từ rubric_json */}
            <Panel>
              <SectionHeader icon={Target} title="Chi tiết từng tiêu chí" color={certColor}/>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {selected.rubric_json.map(r => {
                  const score = (feedback as unknown as Record<string, number>)[r.ma_key] ?? 0
                  return <ScoreBar key={r.ma_key} label={r.ten_tieu_chi} score={score} max={r.diem_toi_da}/>
                  })}
              </div>
            </Panel>

            <Panel>
              <SectionHeader icon={FileText} title="Transcript bài nói" sub={`${fmt(timer)} · ${transcript.trim().split(/\s+/).length} từ`} color={C.slate}/>
              <div style={{ padding:18, background:C.bg, borderRadius:14, fontSize:15, color:C.text, lineHeight:1.85, whiteSpace:'pre-wrap', maxHeight:240, overflowY:'auto', border:`1px solid ${C.border}` }}>
                {transcript}
              </div>
            </Panel>
          </div>

          {/* Right */}
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <Panel>
              <SectionHeader icon={Target} title="Bảng điểm" color={certColor}/>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {selected.rubric_json.map(r => {
                  const score = (feedback as any)[r.ma_key] ?? 0
                  const cs = getScoreStyle(score, r.diem_toi_da)
                  return (
                    <div key={r.ma_key} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:40, height:40, borderRadius:12, flexShrink:0, background:cs.bg, border:`1px solid ${cs.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:cs.text, fontFamily:"'Playfair Display',serif" }}>{score}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:C.navy, marginBottom:5 }}>{r.ten_tieu_chi}</div>
                        <div style={{ height:5, background:`${C.navy}08`, borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${score/r.diem_toi_da*100}%`, background:cs.bar, borderRadius:3, transition:'width .7s cubic-bezier(.16,1,.3,1)' }}/>
                        </div>
                      </div>
                      <span style={{ fontSize:12, color:C.textLt, flexShrink:0 }}>{r.diem_toi_da}đ</span>
                    </div>
                  )
                })}
                <div style={{ marginTop:6, paddingTop:14, borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:14, fontWeight:700, color:C.navy }}>Tổng điểm</span>
                  <span style={{ fontSize:22, fontWeight:900, color:s.text, fontFamily:"'Playfair Display',serif" }}>
                    {feedback.overallScore}<span style={{ fontSize:14, color:C.textLt }}>/{totalMax}</span>
                  </span>
                </div>
              </div>
            </Panel>

            <Panel style={{ background:'#E1F5EE', border:'1px solid rgba(0,168,120,.22)' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#0F6E56', marginBottom:14 }}>✅ Điểm mạnh</div>
              {feedback.strengths.map((str, i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:14, color:'#1a4a3a', lineHeight:1.65 }}>
                  <CheckCircle2 size={15} color={C.green} strokeWidth={2} style={{ flexShrink:0, marginTop:2 }}/>{str}
                </div>
              ))}
            </Panel>

            <Panel style={{ background:'#FEF2F2', border:'1px solid rgba(240,100,100,.22)' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#A32D2D', marginBottom:14 }}>📈 Cần cải thiện</div>
              {feedback.improvements.map((imp, i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:14, color:'#5a1a1a', lineHeight:1.65 }}>
                  <ChevronRight size={15} color={C.rose} strokeWidth={2} style={{ flexShrink:0, marginTop:2 }}/>{imp}
                </div>
              ))}
            </Panel>

            {feedback.detectedKeywords.length > 0 && (
              <Panel>
                <div style={{ fontSize:13, fontWeight:700, color:C.textMid, marginBottom:12 }}>Từ khóa đã sử dụng</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {feedback.detectedKeywords.map(k => (
                    <span key={k} style={{ fontSize:12, padding:'4px 12px', borderRadius:50, fontWeight:600, background:'#E1F5EE', color:'#0F6E56', border:'1px solid rgba(0,168,120,.25)' }}>{k}</span>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}