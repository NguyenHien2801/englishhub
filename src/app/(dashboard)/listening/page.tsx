'use client'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  Headphones, Play, Square, ChevronLeft, RotateCcw,
  ChevronRight, FileText, Gauge, Clock, BookOpen,
  Youtube, Mic2, Eye, EyeOff, CheckCircle2, XCircle,
  Lightbulb, Trophy, ThumbsUp, Repeat2,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface CauHoi {
  id: string
  so_thu_tu: number
  noi_dung: string
  cac_lua_chon: string[]
  dap_an_dung: string
  giai_thich: string
}

interface BaiNghe {
  id: string
  tieu_de: string
  mo_ta: string
  cap_do: string
  loai_chung_chi: string
  chu_de: string
  video_url: string | null
  script: string
  thoi_gian_giay: number
  luot_lam: number
  BaiNgheCauHoi: CauHoi[]
}

interface DaLamInfo {
  diem: number
  tong: number
  ngay: string
}

// ── Design Tokens — Mirror Dashboard ─────────────────────────────────────────
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
  blueLt:   '#4299E1',
  violet:   '#6478F0',
  rose:     '#F06464',
  slate:    '#64748B',
  border:   'rgba(201,168,76,0.18)',
  borderMd: 'rgba(201,168,76,0.30)',
  text:     '#1A1E2E',
  textMid:  '#4A5568',
  textLt:   '#94A3B8',
}

// ── Constants ──────────────────────────────────────────────────────────────────
const TABS = ['Tất cả', 'TOEIC', 'VSTEP', 'APTIS']
const CAP_DO_LIST = ['Tất cả', 'A2', 'B1', 'B2']

const CAP_DO_META: Record<string, { color: string; bg: string }> = {
  A1: { color: C.slate,  bg: '#F1F5F9' },
  A2: { color: C.blueLt, bg: '#EBF4FF' },
  B1: { color: C.green,  bg: '#E6FDF4' },
  B2: { color: C.gold,   bg: C.goldPale },
  C1: { color: C.violet, bg: '#F0EFFE' },
}

const CERT_META: Record<string, { color: string; bg: string; border: string }> = {
  TOEIC: { color: C.gold,   bg: C.goldPale, border: 'rgba(201,168,76,.3)' },
  VSTEP: { color: C.green,  bg: '#E6FDF4',  border: 'rgba(0,168,120,.25)' },
  APTIS: { color: C.violet, bg: '#F0EFFE',  border: 'rgba(100,120,240,.25)' },
}

// ── Shared UI primitives ──────────────────────────────────────────────────────
function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.white,
      borderRadius: 20,
      border: `1px solid ${C.border}`,
      padding: '24px 26px',
      boxShadow: '0 2px 12px rgba(15,28,53,.07)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: 50,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
      color, background: bg,
      border: `1px solid ${border ?? color + '30'}`,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {label}
    </span>
  )
}

function ScoreRing({ pct }: { pct: number }) {
  const r = 36, circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const color = pct >= 80 ? C.green : pct >= 60 ? C.gold : C.rose

  return (
    <svg width={88} height={88} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={44} cy={44} r={r} fill="none" stroke={`${color}18`} strokeWidth={7} />
      <circle cx={44} cy={44} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.16,1,.3,1)' }}
      />
      <text x={44} y={44} textAnchor="middle" dominantBaseline="central"
        style={{ transform: 'rotate(90deg)', transformOrigin: '44px 44px' }}
        fill={color} fontSize={15} fontWeight={900}
        fontFamily="'Playfair Display', serif"
      >
        {pct}%
      </text>
    </svg>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ListeningPage() {
  const [tab, setTab]             = useState('Tất cả')
  const [capDo, setCapDo]         = useState('Tất cả')
  const [baiList, setBaiList]     = useState<BaiNghe[]>([])
  const [daLamMap, setDaLamMap]   = useState<Record<string, DaLamInfo>>({})
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<BaiNghe | null>(null)

  const [answers, setAnswers]     = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [playing, setPlaying]     = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const [speed, setSpeed]         = useState(1)
  const [startTime, setStartTime] = useState<number>(0)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => { fetchBaiNghe() }, [tab, capDo])

  async function fetchBaiNghe() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tab !== 'Tất cả') params.set('loai', tab)
      if (capDo !== 'Tất cả') params.set('cap_do', capDo)
      const res  = await fetch('/api/listening?' + params.toString())
      const data = await res.json()
      setBaiList(data.baiNghe || [])
      setDaLamMap(data.daLamMap || {})
    } catch {
      toast.error('Không tải được danh sách bài nghe')
    } finally {
      setLoading(false)
    }
  }

  function playAudio() {
    if (!selected || playCount >= 2) return
    window.speechSynthesis.cancel()
    const utt    = new SpeechSynthesisUtterance(selected.script)
    utt.lang     = 'en-US'
    utt.rate     = speed
    utt.onstart  = () => setPlaying(true)
    utt.onend    = () => { setPlaying(false); setPlayCount(p => p + 1) }
    utt.onerror  = () => setPlaying(false)
    utterRef.current = utt
    window.speechSynthesis.speak(utt)
  }

  function stopAudio() {
    window.speechSynthesis.cancel()
    setPlaying(false)
  }

  function startBai(bai: BaiNghe) {
    setSelected(bai); setAnswers({}); setSubmitted(false)
    setShowScript(false); setPlayCount(0); setPlaying(false)
    setStartTime(Date.now()); window.scrollTo(0, 0)
  }

  async function handleSubmit() {
    if (!selected) return
    const total = selected.BaiNgheCauHoi.length
    if (Object.keys(answers).length < total) {
      toast.error(`Trả lời đủ ${total} câu hỏi đã!`); return
    }
    const correct   = selected.BaiNgheCauHoi.filter(q => answers[q.id] === q.dap_an_dung).length
    const pct       = Math.round((correct / total) * 100)
    const thoiGian  = Math.round((Date.now() - startTime) / 1000)
    setSubmitted(true)

    if (pct >= 80)      toast.success(`Xuất sắc! ${correct}/${total} câu đúng 🎉`)
    else if (pct >= 60) toast(`Khá tốt! ${correct}/${total} câu đúng`, { icon: '👍' })
    else                toast(`Cần luyện thêm. ${correct}/${total} câu đúng`, { icon: '📖' })

    try {
      await fetch('/api/listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baiId: selected.id, tieu_de: selected.tieu_de,
          loai_chung_chi: selected.loai_chung_chi, cap_do: selected.cap_do,
          correct, total, thoiGianLamBai: thoiGian, cauTraLoi: answers,
        }),
      })
      setDaLamMap(prev => ({
        ...prev,
        [selected.id]: { diem: correct, tong: total, ngay: new Date().toISOString() }
      }))
    } catch { /* silent */ }
  }

  function goBack() { stopAudio(); setSelected(null); fetchBaiNghe() }

  // ═══════════════════════════════════════════════════════════
  // TRANG LÀM BÀI
  // ═══════════════════════════════════════════════════════════
  if (selected) {
    const cauHois = selected.BaiNgheCauHoi
    const total   = cauHois.length
    const correct = submitted ? cauHois.filter(q => answers[q.id] === q.dap_an_dung).length : 0
    const pct     = submitted ? Math.round((correct / total) * 100) : 0
    const answered = Object.keys(answers).length
    const certMeta = CERT_META[selected.loai_chung_chi] ?? { color: C.textMid, bg: '#F0F0E8', border: C.border }
    const capMeta  = CAP_DO_META[selected.cap_do] ?? { color: C.textMid, bg: '#F0F0E8' }

    return (
      <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>

        <style dangerouslySetInnerHTML={{ __html: `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
@keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
@keyframes pulse-bar { 0%,100% { opacity:.7 } 50% { opacity:1 } }
.fade-up { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) both }
.q-card:hover { box-shadow: 0 4px 20px rgba(15,28,53,.09) !important; }
` }} />

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px clamp(12px,3vw,28px) 72px' }}>

          {/* ── Header ── */}
          <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <button onClick={goBack} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 50,
              background: C.white, border: `1px solid ${C.border}`,
              color: C.textMid, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 1px 6px rgba(15,28,53,.06)',
              transition: 'all .2s',
            }}>
              <ChevronLeft size={14} /> Quay lại
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                margin: 0, fontSize: 'clamp(17px,2.2vw,22px)',
                fontWeight: 900, color: C.navy, fontFamily: "'Playfair Display', serif",
                letterSpacing: '-0.3px', lineHeight: 1.2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{selected.tieu_de}</h1>
              <div style={{ display: 'flex', gap: 8, marginTop: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                <Badge label={selected.loai_chung_chi} color={certMeta.color} bg={certMeta.bg} border={certMeta.border} />
                <Badge label={selected.cap_do} color={capMeta.color} bg={capMeta.bg} />
                <span style={{ fontSize: 13, color: C.textLt }}>{selected.chu_de}</span>
              </div>
            </div>

            {/* Progress pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 15px', borderRadius: 50,
              background: C.white, border: `1px solid ${C.border}`,
              fontSize: 13, fontWeight: 700, color: C.navy,
              boxShadow: '0 1px 6px rgba(15,28,53,.06)',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ color: answered >= total ? C.green : C.gold, fontSize: 15 }}>
                {answered >= total ? '✓' : '◷'}
              </span>
              {answered}/{total}
            </div>
          </div>

          {/* ── Player ── */}
          <div className="fade-up" style={{ animationDelay: '60ms', marginBottom: 20 }}>
            {selected.video_url ? (
              <div style={{
                borderRadius: 20, overflow: 'hidden',
                border: `1px solid ${C.border}`,
                boxShadow: '0 4px 24px rgba(15,28,53,.10)',
                aspectRatio: '16/9',
              }}>
                <iframe src={selected.video_url} style={{ width: '100%', height: '100%' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />
              </div>
            ) : (
              <Panel style={{ background: C.navy, border: `1px solid rgba(201,168,76,.2)`, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>

                {/* Decorative blob — same as Dashboard's PersonalRoadmap */}
                <div style={{
                  position: 'absolute', top: -50, right: -50,
                  width: 200, height: 200,
                  background: 'rgba(201,168,76,.06)',
                  borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                  pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 11,
                      background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Mic2 size={17} color={C.gold} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Audio · Web TTS</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
                        {playCount}/2 lần phát
                      </div>
                    </div>
                  </div>

                  {/* Speed selector */}
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginRight: 4 }}>Tốc độ</span>
                    {[0.75, 1, 1.25].map(s => (
                      <button key={s} onClick={() => setSpeed(s)} style={{
                        padding: '5px 11px', borderRadius: 50, fontSize: 12, fontWeight: 700,
                        border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        background: speed === s ? C.gold : 'rgba(255,255,255,.08)',
                        color: speed === s ? C.navy : 'rgba(255,255,255,.5)',
                        transition: 'all .2s',
                      }}>{s}x</button>
                    ))}
                  </div>
                </div>

                {/* Waveform animation */}
                {playing && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 16, height: 32 }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} style={{
                        width: 3, borderRadius: 2, background: C.gold,
                        height: `${12 + Math.random() * 16}px`,
                        opacity: 0.7,
                        animation: `pulse-bar ${0.4 + Math.random() * 0.5}s ease-in-out infinite`,
                        animationDelay: `${i * 0.06}s`,
                      }} />
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
                  <button onClick={playing ? stopAudio : playAudio} disabled={playCount >= 2} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
                    border: 'none', cursor: playCount >= 2 ? 'not-allowed' : 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    background: playCount >= 2
                      ? 'rgba(255,255,255,.06)'
                      : playing
                        ? C.rose
                        : `linear-gradient(135deg, ${C.green}, ${C.greenLt})`,
                    color: playCount >= 2 ? 'rgba(255,255,255,.25)' : '#fff',
                    boxShadow: playCount >= 2 || playing ? 'none' : '0 4px 18px rgba(0,168,120,.35)',
                    transition: 'all .25s',
                  }}>
                    {playing
                      ? <><Square size={14} /> Dừng</>
                      : playCount === 0
                        ? <><Play size={14} /> Phát audio</>
                        : <><Repeat2 size={14} /> Phát lại (lần 2)</>}
                  </button>

                  <button onClick={() => setShowScript(v => !v)} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '12px 18px', borderRadius: 12,
                    background: showScript ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.07)',
                    border: `1px solid ${showScript ? 'rgba(201,168,76,.35)' : 'rgba(255,255,255,.1)'}`,
                    color: showScript ? C.gold : 'rgba(255,255,255,.6)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all .2s',
                  }}>
                    {showScript ? <EyeOff size={14} /> : <Eye size={14} />}
                    Script
                  </button>
                </div>

                {showScript && (
                  <div style={{
                    marginTop: 14,
                    padding: '16px 18px',
                    background: 'rgba(255,255,255,.04)',
                    border: '1px solid rgba(201,168,76,.15)',
                    borderRadius: 12,
                    color: 'rgba(255,255,255,.7)',
                    fontSize: 14, lineHeight: 1.8,
                    whiteSpace: 'pre-line',
                    fontFamily: "'DM Sans', sans-serif",
                    position: 'relative',
                  }}>
                    {selected.script}
                  </div>
                )}
              </Panel>
            )}
          </div>

          {/* ── Câu hỏi ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {cauHois.map((q, i) => (
              <div key={q.id} className={`q-card fade-up`}
                style={{
                  background: C.white, borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  padding: '20px 22px',
                  boxShadow: '0 2px 8px rgba(15,28,53,.06)',
                  animationDelay: `${80 + i * 40}ms`,
                  transition: 'box-shadow .2s',
                }}>

                <p style={{
                  margin: '0 0 16px', color: C.navy,
                  fontSize: 15, fontWeight: 600, lineHeight: 1.6,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 24, height: 24, borderRadius: 7,
                    background: C.goldPale, border: `1px solid rgba(201,168,76,.25)`,
                    fontSize: 11, fontWeight: 800, color: C.gold,
                    marginRight: 10, flexShrink: 0, verticalAlign: 'middle',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{i + 1}</span>
                  {q.noi_dung}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {q.cac_lua_chon.map(opt => {
                    const key = opt.charAt(0)
                    const isSelected  = answers[q.id] === key
                    const isCorrect   = submitted && key === q.dap_an_dung
                    const isWrong     = submitted && key === answers[q.id] && key !== q.dap_an_dung

                    let bg     = C.white
                    let border = `1px solid ${C.border}`
                    let color  = C.text
                    let icon   = null as React.ReactNode

                    if (isCorrect)        { bg = '#E6FDF4'; border = `2px solid ${C.green}`; color = C.navy; icon = <CheckCircle2 size={14} color={C.green} style={{ flexShrink: 0 }} /> }
                    else if (isWrong)     { bg = '#FEF2F2'; border = `2px solid ${C.rose}`;  color = C.navy; icon = <XCircle size={14} color={C.rose} style={{ flexShrink: 0 }} /> }
                    else if (isSelected)  { bg = C.goldPale; border = `2px solid ${C.gold}`; color = C.navy }

                    return (
                      <button key={key}
                        onClick={() => !submitted && setAnswers(p => ({ ...p, [q.id]: key }))}
                        disabled={submitted}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          textAlign: 'left', padding: '10px 14px', borderRadius: 11,
                          fontSize: 14, fontWeight: isSelected || isCorrect ? 600 : 400,
                          background: bg, border, color,
                          cursor: submitted ? 'default' : 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                          transition: 'all .18s',
                        }}>
                        {icon}
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {submitted && (
                  <div style={{
                    marginTop: 14, padding: '12px 14px',
                    background: C.goldPale, borderRadius: 10,
                    border: `1px solid rgba(201,168,76,.25)`,
                    display: 'flex', gap: 9, alignItems: 'flex-start',
                  }}>
                    <Lightbulb size={14} color={C.gold} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{q.giai_thich}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Nộp bài / Kết quả ── */}
          {!submitted ? (
            <button onClick={handleSubmit} disabled={answered < total} style={{
              width: '100%', padding: '14px 0', borderRadius: 14,
              background: answered >= total
                ? `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`
                : C.white,
              border: `1px solid ${answered >= total ? 'transparent' : C.border}`,
              color: answered >= total ? '#fff' : C.textLt,
              fontSize: 15, fontWeight: 700,
              cursor: answered < total ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: answered >= total ? '0 4px 20px rgba(15,28,53,.2)' : 'none',
              transition: 'all .25s',
            }}>
              {answered >= total ? 'Nộp bài' : `Trả lời đủ ${total} câu (${answered}/${total})`}
            </button>
          ) : (
            <Panel style={{ textAlign: 'center', padding: '32px 28px' }}>
              {/* Score ring */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <ScoreRing pct={pct} />
              </div>

              <div style={{
                fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900,
                color: C.navy, fontFamily: "'Playfair Display', serif",
                marginBottom: 6,
              }}>
                {pct >= 80 ? 'Xuất sắc!' : pct >= 60 ? 'Khá tốt!' : 'Cần luyện thêm'}
              </div>

              <div style={{ fontSize: 15, color: C.textMid, marginBottom: 22 }}>
                {correct}/{total} câu đúng ·{' '}
                <span style={{ color: pct >= 80 ? C.green : pct >= 60 ? C.gold : C.rose, fontWeight: 700 }}>
                  {pct >= 80 ? '🏆 Tuyệt vời' : pct >= 60 ? '👍 Tiếp tục cố lên' : '📖 Ôn lại nhé'}
                </span>
              </div>

              {/* Score bar */}
              <div style={{ height: 6, background: `${C.navy}0A`, borderRadius: 3, overflow: 'hidden', marginBottom: 24 }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 3,
                  background: pct >= 80 ? C.green : pct >= 60 ? C.gold : C.rose,
                  transition: 'width .9s cubic-bezier(.16,1,.3,1)',
                }} />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => { setAnswers({}); setSubmitted(false); setPlayCount(0); setStartTime(Date.now()) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '11px 22px', borderRadius: 50,
                    background: C.white, border: `1.5px solid ${C.border}`,
                    color: C.navy, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    transition: 'all .2s',
                  }}>
                  <RotateCcw size={13} /> Làm lại
                </button>
                <button onClick={goBack} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '11px 22px', borderRadius: 50,
                  background: C.green, border: 'none',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  boxShadow: '0 4px 16px rgba(0,168,120,.3)',
                  transition: 'all .2s',
                }}>
                  Bài khác <ChevronRight size={13} />
                </button>
              </div>
            </Panel>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // TRANG DANH SÁCH
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
@keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
.fade-up { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) both }
.bai-card:hover { border-color: rgba(0,168,120,.4) !important; box-shadow: 0 6px 28px rgba(15,28,53,.12) !important; transform: translateY(-2px); }
.bai-card { transition: all .25s cubic-bezier(.16,1,.3,1) !important; }
.tab-btn:hover { border-color: ${C.navy} !important; color: ${C.navy} !important; }
` }} />

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px clamp(12px,3vw,32px) 72px' }}>

        {/* ── Header ── */}
        <div className="fade-up" style={{ marginBottom: 24 }}>
          <h1 style={{
            margin: 0, fontSize: 'clamp(22px,2.5vw,32px)',
            fontWeight: 900, color: C.navy,
            fontFamily: "'Playfair Display', serif", letterSpacing: '-0.3px',
          }}>Luyện nghe</h1>
          <p style={{ fontSize: 14, color: C.textLt, marginTop: 6, fontWeight: 400 }}>
            Nghe audio → trả lời câu hỏi · TOEIC · VSTEP · APTIS
          </p>
        </div>

        {/* ── Info banner — same style as Due Today in Dashboard ── */}
        <div className="fade-up" style={{
          animationDelay: '40ms',
          display: 'flex', alignItems: 'flex-start', gap: 14,
          background: 'rgba(0,168,120,.05)',
          border: '1px solid rgba(0,168,120,.2)',
          borderRadius: 20, padding: '14px 20px', marginBottom: 24,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13,
            background: `${C.green}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Headphones size={22} color={C.green} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.green, marginBottom: 3 }}>
              Bài có video YouTube sẽ hiển thị player nhúng
            </div>
            <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>
              Bài không có video dùng <strong>Web Speech TTS</strong> (Chrome / Edge).
              Mỗi bài nghe tối đa <strong>2 lần</strong>.
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="fade-up" style={{
          animationDelay: '60ms',
          display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap', alignItems: 'center',
        }}>
          {/* Cert tabs */}
          <div style={{
            display: 'flex', gap: 3,
            background: C.white, borderRadius: 50, padding: 4,
            border: `1px solid ${C.border}`,
            boxShadow: '0 2px 10px rgba(15,28,53,.06)',
          }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} className="tab-btn" style={{
                padding: '7px 18px', borderRadius: 50,
                fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                background: tab === t ? C.navy : 'transparent',
                color: tab === t ? '#fff' : C.textMid,
                boxShadow: tab === t ? '0 2px 10px rgba(15,28,53,.22)' : 'none',
                transition: 'all .28s cubic-bezier(.16,1,.3,1)',
              }}>{t}</button>
            ))}
          </div>

          {/* Level filter */}
          <div style={{
            display: 'flex', gap: 3,
            background: C.white, borderRadius: 50, padding: 4,
            border: `1px solid ${C.border}`,
            boxShadow: '0 2px 10px rgba(15,28,53,.06)',
            marginLeft: 'auto',
          }}>
            {CAP_DO_LIST.map(c => (
              <button key={c} onClick={() => setCapDo(c)} style={{
                padding: '7px 16px', borderRadius: 50,
                fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                background: capDo === c ? C.green : 'transparent',
                color: capDo === c ? '#fff' : C.textMid,
                boxShadow: capDo === c ? '0 2px 10px rgba(0,168,120,.25)' : 'none',
                transition: 'all .28s cubic-bezier(.16,1,.3,1)',
              }}>{c}</button>
            ))}
          </div>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{
                height: 200, background: C.white, borderRadius: 20,
                border: `1px solid ${C.border}`,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : baiList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: C.textMid }}>
            <div style={{ marginBottom: 14 }}>
              <Headphones size={48} color={C.gold} strokeWidth={1.2} style={{ opacity: .35 }} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Không có bài nghe nào</div>
            <div style={{ fontSize: 14, color: C.textLt }}>Thử chọn bộ lọc khác</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
            {baiList.map((bai, i) => {
              const daLam    = daLamMap[bai.id]
              const pct      = daLam ? Math.round((daLam.diem / daLam.tong) * 100) : null
              const certMeta = CERT_META[bai.loai_chung_chi] ?? { color: C.textMid, bg: '#F0F0E8', border: C.border }
              const capMeta  = CAP_DO_META[bai.cap_do] ?? { color: C.textMid, bg: '#F0F0E8' }
              const scoreColor = pct !== null
                ? (pct >= 80 ? C.green : pct >= 60 ? C.gold : C.rose)
                : C.textLt

              return (
                <button key={bai.id} onClick={() => startBai(bai)} className="bai-card fade-up"
                  style={{
                    display: 'flex', flexDirection: 'column',
                    padding: '22px 22px 18px',
                    background: C.white, borderRadius: 20,
                    border: `1.5px solid ${C.border}`,
                    textAlign: 'left', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(15,28,53,.06)',
                    animationDelay: `${i * 35}ms`,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>

                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: bai.video_url ? '#EEF2FF' : `${C.green}12`,
                      border: `1px solid ${bai.video_url ? 'rgba(100,120,240,.2)' : 'rgba(0,168,120,.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {bai.video_url
                        ? <Youtube size={22} color={C.violet} strokeWidth={1.6} />
                        : <Headphones size={22} color={C.green} strokeWidth={1.6} />}
                    </div>

                    {/* Done badge */}
                    {pct !== null ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 50,
                        background: `${scoreColor}12`, border: `1px solid ${scoreColor}28`,
                        fontSize: 12, fontWeight: 800, color: scoreColor,
                      }}>
                        <Trophy size={11} /> {pct}%
                      </div>
                    ) : (
                      <div style={{
                        padding: '4px 10px', borderRadius: 50,
                        background: `${C.navy}06`, border: `1px solid ${C.border}`,
                        fontSize: 12, fontWeight: 600, color: C.textLt,
                      }}>Chưa làm</div>
                    )}
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <Badge label={bai.loai_chung_chi} color={certMeta.color} bg={certMeta.bg} border={certMeta.border} />
                    <Badge label={bai.cap_do} color={capMeta.color} bg={capMeta.bg} />
                  </div>

                  {/* Title */}
                  <div style={{
                    fontSize: 15, fontWeight: 700, color: C.navy,
                    marginBottom: 6, lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{bai.tieu_de}</div>

                  <div style={{
                    fontSize: 13, color: C.textLt, marginBottom: 14,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{bai.mo_ta}</div>

                  {/* Footer */}
                  <div style={{
                    marginTop: 'auto',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textMid }}>
                        <FileText size={12} color={C.textLt} />
                        {bai.BaiNgheCauHoi.length} câu
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textMid }}>
                        <Clock size={12} color={C.textLt} />
                        {Math.round(bai.thoi_gian_giay / 60)} phút
                      </span>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, fontWeight: 700, color: C.gold,
                    }}>
                      Làm bài <ChevronRight size={13} />
                    </div>
                  </div>

                  {/* Progress bar if done */}
                  {pct !== null && (
                    <div style={{ marginTop: 12, height: 4, background: `${C.navy}08`, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 2,
                        background: scoreColor, transition: 'width .9s cubic-bezier(.16,1,.3,1)',
                      }} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}