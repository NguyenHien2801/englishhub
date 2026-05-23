'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  BookOpen, PenLine, ChevronRight, Home,
  CheckCircle2, ArrowRight, ArrowLeft,
  Send, Target, Lightbulb, FileText, Flame,
  GraduationCap, Briefcase, Globe2, Trophy,
} from 'lucide-react'

const C = {
  bg:       '#F8F5EE',
  white:    '#FFFFFF',
  navy:     '#0F1C35',
  navyMid:  '#1E2F50',
  gold:     '#C9A84C',
  goldLt:   '#E8C97A',
  goldPale: '#FDF8EE',
  green:    '#00A878',
  greenLt:  '#4ECBA8',
  blue:     '#2B6CB0',
  violet:   '#6478F0',
  rose:     '#F06464',
  slate:    '#64748B',
  border:   'rgba(201,168,76,0.18)',
  borderMd: 'rgba(201,168,76,0.30)',
  text:     '#1A1E2E',
  textMid:  '#4A5568',
  textLt:   '#94A3B8',
}

const CERT_COLOR: Record<string, string> = {
  VSTEP: '#185FA5',
  TOEIC: '#00A878',
  APTIS: '#6478F0',
}

const CERT_ICON: Record<string, React.ElementType> = {
  VSTEP: GraduationCap,
  TOEIC: Briefcase,
  APTIS: Globe2,
}

const LEVEL_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  B1: { bg: '#E1F5EE', color: '#0F6E56', border: 'rgba(0,168,120,.3)' },
  B2: { bg: '#E6F1FB', color: '#185FA5', border: 'rgba(24,95,165,.3)' },
}

interface Rubric {
  ma_key: string
  ten_tieu_chi: string
  diem_toi_da: number
  mo_ta: string
}
interface BaiLuyenViet {
  id: string
  chung_chi: string
  cap_do: string
  tieu_de: string
  bieu_tuong: string
  de_bai: string
  so_tu_toi_thieu: number
  so_tu_toi_da: number
  thong_tin_ky_thi: string
  rubric_json: Rubric[]
  goi_y_json: string[]
}
interface FeedbackCriterion {
  criterion: string; score: number; max: number; band: string
  strengths: string[]; improvements: string[]; examples: string
}
interface AIFeedback {
  totalScore: number; band: string; overview: string
  strengths: string[]; improvements: string[]
  criteria: FeedbackCriterion[]; correctedSentence?: string
  rewriteSuggestion?: string
}

function buildPrompt(task: BaiLuyenViet, text: string, wordCount: number) {
  const rubricLines = task.rubric_json.map(r =>
    `- ${r.ten_tieu_chi} (max ${r.diem_toi_da} pts): ${r.mo_ta}`
  ).join('\n')
  const criteriaJson = task.rubric_json.map(r => `    {
      "criterion": "${r.ten_tieu_chi}",
      "score": <0-${r.diem_toi_da}>,
      "max": ${r.diem_toi_da},
      "band": "<Xuất sắc|Tốt|Khá|Trung bình|Yếu|Cần cố gắng>",
      "strengths": ["<điểm mạnh cụ thể, trích dẫn từ bài>"],
      "improvements": ["<cần cải thiện, kèm ví dụ sửa>"],
      "examples": "<trích câu/cụm từ từ bài làm>"
    }`).join(',\n')

  return `Bạn là giám khảo chấm thi ${task.chung_chi} chuyên nghiệp, nghiêm khắc.

⚠️ QUY TẮC CHẤM BẮT BUỘC (ưu tiên cao nhất):
1. Trước khi chấm, xác định bài làm có THỰC SỰ trả lời đúng đề không.
2. Nếu bài làm lạc đề, vô nghĩa, copy ngẫu nhiên, hoặc không liên quan đến đề bài → tổng điểm KHÔNG ĐƯỢC vượt quá ${Math.floor(task.rubric_json.reduce((s,r)=>s+r.diem_toi_da,0) * 0.25)} điểm (25% tối đa).
3. Điểm ≥80% chỉ dành cho bài xuất sắc: đúng chủ đề, lập luận rõ ràng, từ vựng phong phú, ít lỗi.
4. Chấm dựa trên NỘI DUNG THỰC TẾ. Không được ước đoán hay cho điểm xã giao.
5. Nếu bài chỉ có vài câu ngắn, thiếu ý hoặc cấu trúc rời rạc → phải trừ điểm nặng ở tiêu chí liên quan.

THÔNG TIN KỲ THI: ${task.thong_tin_ky_thi}
ĐỀ BÀI: ${task.de_bai}
BÀI LÀM (${wordCount} từ):
${text}

TIÊU CHÍ CHẤM:
${rubricLines}

Quy tắc band: "Xuất sắc"(≥90%), "Tốt"(≥80%), "Khá"(≥70%), "Trung bình"(≥60%), "Yếu"(≥50%), "Cần cố gắng"(<50%)

Trả về JSON thuần (KHÔNG markdown, KHÔNG text ngoài JSON):
{
  "totalScore": <0-${task.rubric_json.reduce((s,r)=>s+r.diem_toi_da,0)}>,
  "band": "<band tổng>",
  "overview": "<nhận xét 3-4 câu, nêu rõ bài có đúng đề không và lý do điểm>",
  "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>"],
  "improvements": ["<cải thiện 1>", "<cải thiện 2>", "<cải thiện 3>"],
  "correctedSentence": "<nếu bài ĐÚNG đề thì trích 1 câu lỗi ngữ pháp + bản sửa. Nếu bài SAI đề hoàn toàn thì để null>",
  "rewriteSuggestion": "<nếu bài ĐÚNG đề thì gợi ý 3-4 câu cụ thể để tăng điểm lên band tiếp theo. Nếu SAI đề thì để null>",
  "criteria": [
${criteriaJson}
  ]
}`
}

function getScoreStyle(score: number, max: number) {
  const p = score / max
  if (p >= 0.8) return { bg: '#E1F5EE', text: '#0F6E56', bar: '#00A878', border: 'rgba(0,168,120,.3)' }
  if (p >= 0.6) return { bg: '#FDF8EE', text: '#7a5c00', bar: '#C9A84C', border: 'rgba(201,168,76,.3)' }
  return { bg: '#FEF2F2', text: '#A32D2D', bar: '#F06464', border: 'rgba(240,100,100,.3)' }
}

function LevelBadge({ level }: { level: string }) {
  const s = LEVEL_STYLE[level] || LEVEL_STYLE.B1
  return (
    <span style={{
      padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '.04em', fontFamily: "'DM Sans', sans-serif",
    }}>{level}</span>
  )
}

function CertBadge({ cert }: { cert: string }) {
  const color = CERT_COLOR[cert] || C.slate
  return (
    <span style={{
      padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
      background: `${color}12`, color, border: `1px solid ${color}28`,
      letterSpacing: '.04em', fontFamily: "'DM Sans', sans-serif",
    }}>{cert}</span>
  )
}

function Panel({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={className} style={{
      background: C.white, borderRadius: 24,
      border: `1px solid ${C.border}`,
      padding: '28px 32px',
      boxShadow: '0 2px 16px rgba(15,28,53,.07)',
      ...style,
    }}>{children}</div>
  )
}

function SectionHeader({ icon: Icon, title, sub, color }: {
  icon: React.ElementType; title: string; sub?: string; color: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `${color}15`, border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{
          fontSize: 17, fontWeight: 700, color: C.navy,
          fontFamily: "'DM Sans', sans-serif", lineHeight: 1.3,
        }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: C.textMid, marginTop: 3, lineHeight: 1.5 }}>{sub}</div>}
      </div>
    </div>
  )
}

function ScoreRing({ score, max }: { score: number; max: number }) {
  const r = 44, cx = 52, cy = 52, circ = 2 * Math.PI * r
  const s = getScoreStyle(score, max)
  return (
    <svg width={108} height={108} viewBox="0 0 104 104">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${C.navy}10`} strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={s.bar} strokeWidth={8}
        strokeDasharray={`${circ * score / max} ${circ * (1 - score / max)}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={cx} y={cy - 7} textAnchor="middle" fill={s.bar} fontSize={24} fontWeight={800}
        fontFamily="'Playfair Display', serif">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={C.textLt} fontSize={13}
        fontFamily="'DM Sans', sans-serif">/{max}</text>
    </svg>
  )
}

function CriterionCard({ c }: { c: FeedbackCriterion }) {
  const [open, setOpen] = useState(false)
  const s = getScoreStyle(c.score, c.max)
  const pct = Math.round(c.score / c.max * 100)
  return (
    <div style={{
      border: `1.5px solid ${open ? s.border : C.border}`,
      borderRadius: 18, overflow: 'hidden', background: C.white,
      transition: 'border-color .2s, box-shadow .2s',
      boxShadow: open ? `0 4px 20px rgba(15,28,53,.08)` : 'none',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '18px 22px',
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'transparent', border: 'none', cursor: 'pointer',
        textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          flexShrink: 0, width: 54, height: 54, borderRadius: 14,
          background: s.bg, border: `1px solid ${s.border}`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: s.text, lineHeight: 1,
            fontFamily: "'Playfair Display', serif" }}>{c.score}</span>
          <span style={{ fontSize: 11, color: C.textLt, fontWeight: 500 }}>/{c.max}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{
              fontSize: 15, fontWeight: 700, color: C.navy,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8,
            }}>{c.criterion}</span>
            <span style={{
              flexShrink: 0, fontSize: 12, fontWeight: 700, padding: '3px 10px',
              borderRadius: 8, background: s.bg, color: s.text, border: `1px solid ${s.border}`,
            }}>{c.band}</span>
          </div>
          <div style={{ height: 5, background: `${C.navy}08`, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`, background: s.bar,
              borderRadius: 3, transition: 'width .7s cubic-bezier(.16,1,.3,1)',
            }} />
          </div>
        </div>
        <span style={{ color: C.textLt, fontSize: 14, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 22px 22px', borderTop: `1px solid ${C.border}` }}>
          {c.examples && (
            <div style={{
              marginTop: 16, padding: '12px 16px',
              background: 'rgba(100,120,240,.05)',
              borderLeft: `3px solid ${C.violet}`,
              borderRadius: '0 12px 12px 0',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.violet, marginBottom: 5 }}>📝 Trích từ bài làm</div>
              <div style={{ fontSize: 14, color: C.textMid, fontStyle: 'italic', lineHeight: 1.7 }}>"{c.examples}"</div>
            </div>
          )}
          {c.strengths.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F6E56', marginBottom: 8 }}>✅ Điểm mạnh</div>
              {c.strengths.map((s, i) => (
                <div key={i} style={{ fontSize: 14, color: C.textMid, display: 'flex', gap: 8, marginBottom: 6, lineHeight: 1.6 }}>
                  <span style={{ color: C.green, flexShrink: 0, marginTop: 1 }}>•</span>{s}
                </div>
              ))}
            </div>
          )}
          {c.improvements.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#A32D2D', marginBottom: 8 }}>📈 Cần cải thiện</div>
              {c.improvements.map((s, i) => (
                <div key={i} style={{ fontSize: 14, color: C.textMid, display: 'flex', gap: 8, marginBottom: 6, lineHeight: 1.6 }}>
                  <span style={{ color: C.rose, flexShrink: 0, marginTop: 1 }}>•</span>{s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TaskSkeleton() {
  return (
    <div style={{
      background: C.white, borderRadius: 24, border: `1px solid ${C.border}`,
      padding: 28, boxShadow: '0 2px 12px rgba(15,28,53,.05)',
    }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F3F4F6' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, width: 80, marginBottom: 10 }} />
          <div style={{ height: 18, background: '#F3F4F6', borderRadius: 6, width: 180 }} />
        </div>
      </div>
      <div style={{ height: 13, background: '#F3F4F6', borderRadius: 6, marginBottom: 10 }} />
      <div style={{ height: 13, background: '#F3F4F6', borderRadius: 6, width: '60%' }} />
    </div>
  )
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes blobMorph {
    0%,100%{border-radius:60% 40% 30% 70% / 60% 30% 70% 40%}
    25%{border-radius:30% 60% 70% 40% / 50% 60% 30% 60%}
    50%{border-radius:50% 60% 30% 60% / 40% 50% 60% 50%}
    75%{border-radius:60% 40% 60% 30% / 30% 70% 40% 60%}
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.85)} }
  .fade-in { animation: fadeUp .45s cubic-bezier(.16,1,.3,1) both; }
  .task-card {
    transition: all .38s cubic-bezier(.16,1,.3,1);
    position: relative; overflow: hidden;
  }
  .task-card::after {
    content: ''; position: absolute; bottom: 0; left: 0;
    width: 0; height: 3px; background: #C9A84C;
    transition: width .38s cubic-bezier(.16,1,.3,1);
    border-radius: 0 0 24px 24px;
  }
  .task-card:hover {
    transform: translateY(-7px) scale(1.01);
    box-shadow: 0 28px 56px rgba(15,28,53,.14) !important;
    border-color: rgba(201,168,76,.45) !important;
  }
  .task-card:hover::after { width: 100%; }
  textarea:focus { outline: none; }
  .tab-btn { transition: all .22s cubic-bezier(.16,1,.3,1); }
  .tab-btn:hover { opacity: .85; }
  .submit-btn {
    transition: all .32s cubic-bezier(.34,1.56,.64,1);
  }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.01);
    box-shadow: 0 12px 32px rgba(201,168,76,.5) !important;
  }
`

export default function WritingPage() {
  const [tasks, setTasks] = useState<BaiLuyenViet[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<BaiLuyenViet | null>(null)
  const [view, setView] = useState<'list' | 'write' | 'feedback'>('list')
  const [text, setText] = useState('')
  const [feedback, setFeedback] = useState<AIFeedback | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [startTime] = useState(Date.now())
  const [activeTab, setActiveTab] = useState<'editor' | 'guide'>('editor')

  useEffect(() => {
    fetch('/api/writing-tasks')
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setTasks(data) : toast.error('Không tải được đề bài'))
      .catch(() => toast.error('Lỗi kết nối'))
      .finally(() => setLoading(false))
  }, [])

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const wordStatus = !selected ? 'idle'
    : wordCount < selected.so_tu_toi_thieu ? 'low'
    : wordCount > selected.so_tu_toi_da ? 'high' : 'ok'

  function startTask(task: BaiLuyenViet) {
    setSelected(task); setText(''); setFeedback(null)
    setView('write'); setActiveTab('editor')
  }

  function goHome() { setView('list'); setSelected(null); setFeedback(null) }

  async function submitWriting() {
    if (!selected) return
    if (wordCount < selected.so_tu_toi_thieu) {
      toast.error(`Cần tối thiểu ${selected.so_tu_toi_thieu} từ (hiện: ${wordCount})`)
      return
    }
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i
    if (vietnamesePattern.test(text)) {
      toast.error('Vui lòng viết bài bằng tiếng Anh!')
      return
    }
    const uniqueWords = new Set(text.trim().toLowerCase().split(/\s+/))
    if (uniqueWords.size < 10) {
      toast.error('Bài viết quá đơn giản, vui lòng viết đầy đủ hơn!')
      return
    }
    setSubmitting(true)
    try {
      const aiRes = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: buildPrompt(selected, text, wordCount), type: 'writing' }),
      })
      const aiData = await aiRes.json()
      const rawText: string = aiData.response ?? aiData.message ?? aiData.text ?? aiData.content ?? ''
      if (!rawText) throw new Error('AI trả về rỗng')
      const parsed: AIFeedback = JSON.parse(rawText.replace(/```json[\s\S]*?```|```/g, '').trim())
      setFeedback(parsed)
      setView('feedback')
      toast.success('AI đã chấm bài xong!')
      fetch('/api/writing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baiLuyenVietId: selected.id, tieuDe: selected.tieu_de,
          chungChi: selected.chung_chi, noiDungBaiViet: text, soTu: wordCount,
          tongDiem: parsed.totalScore, thoiGianGiay: Math.round((Date.now() - startTime) / 1000),
          ketQuaAi: parsed,
        }),
      }).catch(() => {})
    } catch (err) {
      console.error('Submit error:', err)
      toast.error('Lỗi chấm bài. Thử lại nhé!')
    }
    setSubmitting(false)
  }

  const totalMax = selected?.rubric_json.reduce((s, r) => s + r.diem_toi_da, 0) ?? 40
  const certColor = selected ? (CERT_COLOR[selected.chung_chi] || C.slate) : C.navy

  // ── VIEW: LIST ────────────────────────────────────────────────────
  if (view === 'list') {
    const grouped = tasks.reduce((acc, t) => {
      if (!acc[t.chung_chi]) acc[t.chung_chi] = []
      acc[t.chung_chi].push(t)
      return acc
    }, {} as Record<string, BaiLuyenViet[]>)

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 36, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
        <style suppressHydrationWarning>{GLOBAL_CSS}</style>

        {/* ── Hero Banner ── */}
        <div style={{
          background: C.navy, borderRadius: 28,
          padding: 'clamp(32px,4vw,52px) clamp(28px,4vw,52px)',
          marginBottom: 40, position: 'relative', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(15,28,53,.25)',
        }}>
          {/* Blob decorations */}
          <div style={{ position: 'absolute', top: -70, right: -70, width: 320, height: 320, background: 'rgba(201,168,76,.07)', borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', animation: 'blobMorph 10s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(24px)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, background: 'rgba(0,168,120,.06)', borderRadius: '40% 60%', pointerEvents: 'none', filter: 'blur(28px)' }} />

          {/* Tag */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 16px', background: 'rgba(201,168,76,.12)',
            border: '1px solid rgba(201,168,76,.28)', borderRadius: 50,
            fontSize: 11, fontWeight: 700, color: C.gold,
            textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 20,
          }}>
            <PenLine size={11} strokeWidth={2.5} />
            Luyện kỹ năng viết
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(32px,4.5vw,52px)', fontWeight: 900,
            color: '#fff', marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.5px',
          }}>
            Writing{' '}
            <em style={{ fontStyle: 'italic', color: C.gold }}>AI Grading</em>
          </h1>
          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,.52)',
            maxWidth: 520, lineHeight: 1.78, marginBottom: 32,
          }}>
            {tasks.length} đề bài · AI chấm theo rubric chuẩn · VSTEP · TOEIC · APTIS
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' as const }}>
            {[
              { label: 'Đề bài', val: tasks.length, icon: <BookOpen size={18} strokeWidth={1.8} color={C.goldLt} /> },
              { label: 'Chứng chỉ', val: Object.keys(grouped).length, icon: <GraduationCap size={18} strokeWidth={1.8} color={C.greenLt} /> },
              { label: 'Thang điểm', val: '40đ', icon: <Trophy size={18} strokeWidth={1.8} color={C.violet} /> },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,.07)',
                border: '1px solid rgba(201,168,76,.2)',
                borderRadius: 18, padding: '14px 22px',
                display: 'flex', alignItems: 'center', gap: 12,
                backdropFilter: 'blur(8px)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'rgba(255,255,255,.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{s.icon}</div>
                <div>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1,
                  }}>{s.val}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Task List ── */}
        {loading
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
              {Array.from({ length: 6 }).map((_, i) => <TaskSkeleton key={i} />)}
            </div>
          : Object.entries(grouped).map(([cert, certTasks]) => {
              const CertIconComp = CERT_ICON[cert] || BookOpen
              const certCol = CERT_COLOR[cert] || C.slate
              return (
                <div key={cert} className="fade-in" style={{ marginBottom: 40 }}>
                  {/* Cert header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: `${certCol}15`, border: `1px solid ${certCol}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CertIconComp size={20} color={certCol} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 22, fontWeight: 800, color: C.navy, lineHeight: 1,
                      }}>{cert}</div>
                      <div style={{ fontSize: 13, color: C.textLt, marginTop: 3 }}>{certTasks.length} đề bài</div>
                    </div>
                    <div style={{ flex: 1, height: 1, background: C.border, marginLeft: 8 }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: 16 }}>
                    {certTasks.map(task => (
                      <button key={task.id} className="task-card"
                        onClick={() => startTask(task)}
                        style={{
                          padding: 26, background: C.white, borderRadius: 24,
                          border: `1px solid ${C.border}`, textAlign: 'left',
                          cursor: 'pointer', boxShadow: '0 2px 14px rgba(15,28,53,.06)',
                          fontFamily: "'DM Sans', sans-serif", width: '100%',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                          <div style={{
                            width: 54, height: 54, borderRadius: 16, flexShrink: 0,
                            background: `${CERT_COLOR[task.chung_chi] || C.slate}10`,
                            border: `1px solid ${CERT_COLOR[task.chung_chi] || C.slate}20`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 26,
                          }}>{task.bieu_tuong}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: 7, marginBottom: 8, flexWrap: 'wrap' }}>
                              <CertBadge cert={task.chung_chi} />
                              <LevelBadge level={task.cap_do} />
                            </div>
                            <div style={{
                              fontSize: 16, fontWeight: 700, color: C.navy, lineHeight: 1.35,
                              fontFamily: "'DM Sans', sans-serif",
                            }}>{task.tieu_de}</div>
                          </div>
                        </div>
                        <p style={{
                          fontSize: 14, color: C.textMid, lineHeight: 1.65,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          marginBottom: 16,
                        }}>{task.de_bai}</p>
                        <div style={{
                          paddingTop: 14, borderTop: `1px solid ${C.border}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <span style={{ fontSize: 13, color: C.textLt }}>
                            {task.so_tu_toi_thieu}–{task.so_tu_toi_da} từ
                          </span>
                          <span style={{ fontSize: 13, color: C.textLt }}>
                            {task.rubric_json.length} tiêu chí · 40 điểm
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
        }
      </div>
    )
  }

  // ── VIEW: WRITE ───────────────────────────────────────────────────
  if (view === 'write' && selected) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 36, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
        <style suppressHydrationWarning>{GLOBAL_CSS}</style>

        {/* Breadcrumb */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 14, color: C.textLt, marginBottom: 28,
        }}>
          <span onClick={goHome} style={{
            cursor: 'pointer', color: C.gold,
            display: 'flex', alignItems: 'center', gap: 5,
            fontWeight: 600, transition: 'opacity .2s',
          }}>
            <Home size={14} strokeWidth={2} /> Luyện viết
          </span>
          <ChevronRight size={15} color={C.textLt} strokeWidth={1.8} />
          <span style={{ color: C.navy, fontWeight: 600, fontSize: 14 }}>{selected.tieu_de}</span>
        </div>

        {/* Header navy */}
        <div style={{
          background: C.navy, borderRadius: 24, padding: '32px 36px',
          marginBottom: 32, position: 'relative', overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(15,28,53,.2)',
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(201,168,76,.07)', borderRadius: '60% 40% 30% 70%', pointerEvents: 'none', filter: 'blur(20px)' }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <CertBadge cert={selected.chung_chi} />
            <LevelBadge level={selected.cap_do} />
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900,
            color: '#fff', marginBottom: 10, lineHeight: 1.2, letterSpacing: '-0.2px',
          }}>{selected.tieu_de}</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.45)', lineHeight: 1.6 }}>{selected.thong_tin_ky_thi}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Đề bài */}
            <Panel>
              <SectionHeader icon={FileText} title="Đề bài" sub={selected.thong_tin_ky_thi} color={certColor} />
              <div style={{
                background: C.bg, borderRadius: 14, padding: '18px 22px',
                fontSize: 15, color: C.navy, lineHeight: 1.85,
                borderLeft: `3px solid ${certColor}`,
              }}>{selected.de_bai}</div>
              <div style={{ display: 'flex', gap: 20, marginTop: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: certColor, fontWeight: 600 }}>
                  📏 {selected.so_tu_toi_thieu}–{selected.so_tu_toi_da} từ
                </span>
                <span style={{ fontSize: 14, color: C.textLt }}>· {totalMax} điểm tối đa</span>
              </div>
            </Panel>

            {/* Textarea */}
            <Panel style={{ padding: 0, overflow: 'hidden' }}>
              {/* Toolbar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 22px', borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <PenLine size={17} color={C.textMid} strokeWidth={1.8} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.textMid }}>Bài làm</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 90, height: 5, background: `${C.navy}08`, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${Math.min(100, wordCount / selected.so_tu_toi_da * 100)}%`,
                      background: wordStatus === 'ok' ? C.green : wordStatus === 'high' ? C.gold : `${C.navy}20`,
                      transition: 'width .3s',
                    }} />
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: 700, fontFamily: 'monospace',
                    color: wordStatus === 'ok' ? C.green : wordStatus === 'high' ? '#7a5c00' : C.rose,
                  }}>
                    {wordCount} / {selected.so_tu_toi_thieu}–{selected.so_tu_toi_da}
                  </span>
                </div>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Start writing your essay here..."
                spellCheck={true}
                lang="en"
                style={{
                  width: '100%', minHeight: 340, padding: '22px',
                  fontSize: 16, color: C.text, lineHeight: 1.85,
                  background: 'transparent', border: 'none',
                  resize: 'vertical', fontFamily: "'DM Sans', sans-serif",
                }}
                rows={14}
              />
            </Panel>

            {/* Submit */}
            <button
              className="submit-btn"
              onClick={submitWriting}
              disabled={submitting || wordCount < selected.so_tu_toi_thieu}
              style={{
                width: '100%', padding: '16px 0',
                background: submitting
                  ? C.textLt
                  : wordCount < selected.so_tu_toi_thieu
                    ? `${C.navy}14`
                    : C.gold,
                color: submitting || wordCount < selected.so_tu_toi_thieu ? C.textLt : C.navy,
                fontWeight: 700, fontSize: 16, letterSpacing: '-0.1px',
                border: 'none', borderRadius: 50,
                cursor: submitting || wordCount < selected.so_tu_toi_thieu ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: submitting || wordCount < selected.so_tu_toi_thieu
                  ? 'none' : '0 8px 24px rgba(201,168,76,.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              }}
            >
              <Send size={16} strokeWidth={2.2} />
              {submitting
                ? 'Đang chấm bài...'
                : wordCount < selected.so_tu_toi_thieu
                  ? `Cần thêm ${selected.so_tu_toi_thieu - wordCount} từ nữa`
                  : `Nộp bài (${wordCount})`}
            </button>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Tab switcher */}
            <div style={{
              display: 'flex', background: C.white, borderRadius: 14,
              border: `1px solid ${C.border}`, padding: 5,
              boxShadow: '0 2px 10px rgba(15,28,53,.05)',
            }}>
              {([['editor', '✍️ Viết bài'], ['guide', '💡 Hướng dẫn']] as const).map(([tab, label]) => (
                <button key={tab} className="tab-btn" onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: '9px 0', borderRadius: 10,
                  fontSize: 14, fontWeight: 600,
                  border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  background: activeTab === tab ? C.navy : 'transparent',
                  color: activeTab === tab ? '#fff' : C.textMid,
                }}>{label}</button>
              ))}
            </div>

            {activeTab === 'guide' && (
              <>
                <Panel>
                  <SectionHeader icon={Lightbulb} title="Gợi ý cấu trúc" color={C.gold} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selected.goi_y_json.map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: C.goldPale, border: `1px solid ${C.borderMd}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 800, color: C.gold, flexShrink: 0, marginTop: 1,
                        }}>{i + 1}</div>
                        <span style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <SectionHeader icon={Target} title="Tiêu chí chấm" color={certColor} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selected.rubric_json.map((r, i) => (
                      <div key={i} style={{
                        padding: '14px 16px', borderRadius: 14,
                        background: C.bg, border: `1px solid ${C.border}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{r.ten_tieu_chi}</span>
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: '3px 10px',
                            borderRadius: 8, background: `${certColor}10`, color: certColor,
                            border: `1px solid ${certColor}22`,
                          }}>{r.diem_toi_da}đ</span>
                        </div>
                        <span style={{ fontSize: 13, color: C.textLt, lineHeight: 1.6 }}>{r.mo_ta}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </>
            )}

            {activeTab === 'editor' && (
              <Panel style={{ background: C.goldPale, border: `1px solid ${C.borderMd}` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(201,168,76,.2)', border: `1px solid ${C.borderMd}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Flame size={18} color={C.gold} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#7a5c00', marginBottom: 6 }}>
                      Lưu ý khi viết bài
                    </div>
                    <div style={{ fontSize: 14, color: '#7a5c00', lineHeight: 1.72 }}>
                      Viết đủ số từ yêu cầu. AI sẽ trích dẫn trực tiếp từ bài làm của bạn để nhận xét — hãy viết tự nhiên, không copy mẫu.
                    </div>
                  </div>
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── VIEW: FEEDBACK ────────────────────────────────────────────────
  if (view === 'feedback' && selected && feedback) {
    const s = getScoreStyle(feedback.totalScore, totalMax)
    const isOnTopic = feedback.totalScore / totalMax >= 0.5

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 36, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
        <style suppressHydrationWarning>{GLOBAL_CSS}</style>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: C.textLt, marginBottom: 28 }}>
          <span onClick={goHome} style={{ cursor: 'pointer', color: C.gold, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
            <Home size={14} strokeWidth={2} /> Luyện viết
          </span>
          <ChevronRight size={15} color={C.textLt} strokeWidth={1.8} />
          <span onClick={() => setView('write')} style={{ cursor: 'pointer', color: C.gold, fontWeight: 500 }}>{selected.tieu_de}</span>
          <ChevronRight size={15} color={C.textLt} strokeWidth={1.8} />
          <span style={{ color: C.navy, fontWeight: 600 }}>Kết quả</span>
        </div>

        {/* Score header */}
        <div className="fade-in" style={{
          background: C.navy, borderRadius: 28, padding: '36px 40px',
          marginBottom: 28, display: 'flex', alignItems: 'center', gap: 36,
          position: 'relative', overflow: 'hidden', flexWrap: 'wrap',
          boxShadow: '0 20px 56px rgba(15,28,53,.22)',
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 260, height: 260, background: 'rgba(201,168,76,.07)', borderRadius: '60% 40% 30% 70%', pointerEvents: 'none', filter: 'blur(24px)' }} />
          <ScoreRing score={feedback.totalScore} max={totalMax} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <CertBadge cert={selected.chung_chi} />
              <LevelBadge level={selected.cap_do} />
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 900,
              color: '#fff', marginBottom: 8, letterSpacing: '-0.3px',
            }}>{feedback.band}</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,.42)', lineHeight: 1.5 }}>{selected.thong_tin_ky_thi}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => { setText(''); setFeedback(null); setView('write') }} style={{
              padding: '11px 24px', borderRadius: 50,
              background: 'rgba(255,255,255,.08)',
              border: '1.5px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.85)',
              fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all .25s',
            }}>
              <PenLine size={15} strokeWidth={2} /> Viết lại
            </button>
            <button onClick={goHome} style={{
              padding: '11px 24px', borderRadius: 50, background: C.gold,
              border: 'none', color: C.navy,
              fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 6px 20px rgba(201,168,76,.45)',
              transition: 'all .28s cubic-bezier(.34,1.56,.64,1)',
            }}>
              <ArrowLeft size={15} strokeWidth={2.2} /> Đề khác
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Tổng thể */}
            <Panel className="fade-in">
              <SectionHeader icon={BookOpen} title="Nhận xét tổng thể" color={C.gold} />
              <div style={{
                padding: '18px 20px', background: C.goldPale,
                borderRadius: 14, border: `1px solid ${C.borderMd}`,
                fontSize: 15, color: '#5a4000', lineHeight: 1.85,
              }}>{feedback.overview}</div>
            </Panel>

            {/* Sửa lỗi — chỉ hiện khi đúng đề */}
            {feedback.correctedSentence && isOnTopic && (
              <Panel>
                <SectionHeader icon={PenLine} title="Ví dụ sửa lỗi" color={C.violet} />
                <div style={{
                  padding: '16px 18px', background: 'rgba(100,120,240,.05)',
                  borderLeft: `3px solid ${C.violet}`, borderRadius: '0 14px 14px 0',
                  fontSize: 15, color: C.textMid, lineHeight: 1.78,
                }}>{feedback.correctedSentence}</div>
              </Panel>
            )}

            {/* Gợi ý nâng điểm — chỉ hiện khi đúng đề */}
            {feedback.rewriteSuggestion && isOnTopic && (
              <Panel style={{ background: '#F0EFFE', border: '1px solid rgba(100,120,240,.22)' }}>
                <SectionHeader icon={Lightbulb} title="Muốn điểm cao hơn?" color={C.violet} />
                <div style={{
                  padding: '16px 18px', background: 'rgba(100,120,240,.07)',
                  borderRadius: 14, border: `1px solid rgba(100,120,240,.15)`,
                  fontSize: 15, color: '#3a3a6a', lineHeight: 1.85,
                }}>{feedback.rewriteSuggestion}</div>
              </Panel>
            )}

            {/* Chi tiết tiêu chí */}
            <Panel>
              <SectionHeader icon={Target} title="Chi tiết từng tiêu chí" color={certColor} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feedback.criteria.map((c, i) => <CriterionCard key={i} c={c} />)}
              </div>
            </Panel>

            {/* Bài làm */}
            <Panel>
              <SectionHeader icon={FileText} title="Bài làm của bạn" sub={`${wordCount} từ`} color={C.slate} />
              <div style={{
                padding: '18px', background: C.bg, borderRadius: 14,
                fontSize: 15, color: C.text, lineHeight: 1.85, whiteSpace: 'pre-wrap',
                maxHeight: 320, overflowY: 'auto',
                border: `1px solid ${C.border}`,
              }}>{text}</div>
            </Panel>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Bảng điểm */}
            <Panel>
              <SectionHeader icon={Target} title="Bảng điểm" color={certColor} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feedback.criteria.map((c, i) => {
                  const cs = getScoreStyle(c.score, c.max)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: cs.bg, border: `1px solid ${cs.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 800, color: cs.text,
                        fontFamily: "'Playfair Display', serif",
                      }}>{c.score}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 5,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{c.criterion}</div>
                        <div style={{ height: 5, background: `${C.navy}08`, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.round(c.score / c.max * 100)}%`,
                            background: cs.bar, borderRadius: 3,
                            transition: 'width .7s cubic-bezier(.16,1,.3,1)',
                          }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: C.textLt, flexShrink: 0 }}>{c.max}đ</span>
                    </div>
                  )
                })}
                <div style={{
                  marginTop: 6, paddingTop: 14, borderTop: `1px solid ${C.border}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Tổng điểm</span>
                  <span style={{
                    fontSize: 22, fontWeight: 900, color: s.text,
                    fontFamily: "'Playfair Display', serif",
                  }}>
                    {feedback.totalScore}
                    <span style={{ fontSize: 14, color: C.textLt, fontFamily: 'inherit' }}>/{totalMax}</span>
                  </span>
                </div>
              </div>
            </Panel>

            {/* Điểm mạnh */}
            <Panel style={{ background: '#E1F5EE', border: '1px solid rgba(0,168,120,.22)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F6E56', marginBottom: 14 }}>✅ Điểm mạnh</div>
              {feedback.strengths.map((str, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 14, color: '#1a4a3a', lineHeight: 1.65 }}>
                  <CheckCircle2 size={15} color={C.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  {str}
                </div>
              ))}
            </Panel>

            {/* Cần cải thiện */}
            <Panel style={{ background: '#FEF2F2', border: '1px solid rgba(240,100,100,.22)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#A32D2D', marginBottom: 14 }}>📈 Cần cải thiện</div>
              {feedback.improvements.map((imp, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 14, color: '#5a1a1a', lineHeight: 1.65 }}>
                  <ArrowRight size={15} color={C.rose} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  {imp}
                </div>
              ))}
            </Panel>
          </div>
        </div>
      </div>
    )
  }

  return null
}