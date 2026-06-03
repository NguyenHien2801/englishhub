'use client'
import React, { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  Newspaper, ChevronRight, ChevronLeft, Search,
  CheckCircle2, XCircle, Lightbulb, Clock,
  GraduationCap, Briefcase, Globe2, Trophy,
  RotateCcw, Home, ListFilter, Eye, EyeOff,
  Target, BookOpen,
} from 'lucide-react'

// ── Design tokens ─────────────────────────────────────────────────────────────
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
  VSTEP: '#185FA5', TOEIC: '#00A878', APTIS: '#6478F0',
}
const CERT_ICON: Record<string, React.ElementType> = {
  VSTEP: GraduationCap, TOEIC: Briefcase, APTIS: Globe2,
}
const LEVEL_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  A1: { bg: '#F0F4FF', color: '#64748B', border: 'rgba(100,116,139,.3)' },
  A2: { bg: '#EBF4FF', color: '#2B6CB0', border: 'rgba(43,108,176,.3)' },
  B1: { bg: '#E1F5EE', color: '#0F6E56', border: 'rgba(0,168,120,.3)' },
  B2: { bg: '#E6F1FB', color: '#185FA5', border: 'rgba(24,95,165,.3)' },
  C1: { bg: '#F0EFFE', color: '#4A56C2', border: 'rgba(100,120,240,.3)' },
  C2: { bg: '#FDE8F0', color: '#9B1D4E', border: 'rgba(219,39,119,.3)' },
}

const CERTS   = ['All', 'TOEIC', 'VSTEP', 'APTIS']
const LEVELS  = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const STATUSES = ['All', 'Chưa làm', 'Đã làm', 'Điểm cao']

// ── Types ─────────────────────────────────────────────────────────────────────
interface CauHoi {
  id: string
  so_thu_tu: number
  loai_cau_hoi: 'trac_nghiem' | 'dien_cho_trong' | 'true_false' | 'matching'
  noi_dung: string
  cac_lua_chon: string[] | null
  dap_an_dung: string
  giai_thich: string | null
}
interface BaiDoc {
  id: string
  tieu_de: string
  mo_ta: string | null
  loai_chung_chi: string
  cap_do: string
  loai_bai: string
  chu_de: string | null
  bieu_tuong: string
  noi_dung: string
  thong_tin_ky_thi: string | null
  thoi_gian_giay: number
  so_cau_hoi: number
  luot_lam: number
  BaiDocCauHoi: CauHoi[]
}
interface DaLamInfo { diem: number; tong: number; ngay: string }

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .fade-in  { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) both; }
  .card-btn { transition: all .2s cubic-bezier(.16,1,.3,1); }
  .card-btn:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(15,28,53,.1)!important; }
  .opt-btn  { transition: all .18s cubic-bezier(.16,1,.3,1); }
  .opt-btn:hover { transform:translateY(-1px); }

  /* Reading split layout */
  .reading-layout { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
  @media(max-width:900px){ .reading-layout { grid-template-columns:1fr; } }

  /* Pill filters scroll on mobile */
  .filter-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .filter-scroll::-webkit-scrollbar { display:none; }
`

// ── Helper ────────────────────────────────────────────────────────────────────
function isCorrect(q: CauHoi, answer: string): boolean {
  if (!answer) return false
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  if (q.loai_cau_hoi === 'trac_nghiem') return answer === q.dap_an_dung
  if (q.loai_cau_hoi === 'true_false')  return norm(answer) === norm(q.dap_an_dung)
  return norm(answer) === norm(q.dap_an_dung)
}

// ── Card component ────────────────────────────────────────────────────────────
function BaiDocCard({ bai, daLam, onClick }: {
  bai: BaiDoc; daLam?: DaLamInfo; onClick: () => void
}) {
  const certColor = CERT_COLOR[bai.loai_chung_chi] || C.slate
  const CertIcon  = CERT_ICON[bai.loai_chung_chi] || BookOpen
  const lvStyle   = LEVEL_STYLE[bai.cap_do] || { bg: C.bg, color: C.textMid, border: C.border }
  const mins      = Math.round(bai.thoi_gian_giay / 60)
  const pct       = daLam ? Math.round((daLam.diem / daLam.tong) * 100) : null
  const isHigh    = pct !== null && pct >= 80

  return (
    <button className="card-btn" onClick={onClick} style={{
      width: '100%', textAlign: 'left', background: C.white,
      border: `1.5px solid ${daLam ? (isHigh ? 'rgba(0,168,120,.3)' : C.border) : C.border}`,
      borderRadius: 20, padding: '18px 20px', cursor: 'pointer',
      boxShadow: '0 2px 10px rgba(15,28,53,.05)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Cert stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: certColor, borderRadius: '4px 0 0 4px' }} />

      <div style={{ paddingLeft: 8 }}>
        {/* Top badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 18 }}>{bai.bieu_tuong}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${certColor}15`, color: certColor, border: `1px solid ${certColor}25` }}>
            {bai.loai_chung_chi}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: lvStyle.bg, color: lvStyle.color, border: `1px solid ${lvStyle.border}` }}>
            {bai.cap_do}
          </span>
          {daLam && (
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: isHigh ? '#E1F5EE' : '#FDF8EE', color: isHigh ? '#0F6E56' : '#7a5c00', border: `1px solid ${isHigh ? 'rgba(0,168,120,.2)' : 'rgba(201,168,76,.2)'}` }}>
              {daLam.diem}/{daLam.tong} ({pct}%)
            </span>
          )}
        </div>

        {/* Title */}
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 800, color: C.navy, marginBottom: 6, lineHeight: 1.4 }}>
          {bai.tieu_de}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textLt }}>
            <Clock size={11} strokeWidth={2} /> {mins} phút
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textLt }}>
            <Target size={11} strokeWidth={2} /> {bai.so_cau_hoi || bai.BaiDocCauHoi?.length || 0} câu
          </span>
          {bai.chu_de && (
            <span style={{ fontSize: 11, color: C.textLt }}>{bai.chu_de}</span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReadingPage() {
  const [baiDoc,    setBaiDoc]    = useState<BaiDoc[]>([])
  const [daLamMap,  setDaLamMap]  = useState<Record<string, DaLamInfo>>({})
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState<BaiDoc | null>(null)
  const [view,      setView]      = useState<'list' | 'reading' | 'result'>('list')

  // Filters
  const [search,    setSearch]    = useState('')
  const [certFil,   setCertFil]   = useState('All')
  const [levelFil,  setLevelFil]  = useState('All')
  const [statusFil, setStatusFil] = useState('All')

  // Quiz state
  const [answers,   setAnswers]   = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showExp,   setShowExp]   = useState<Record<string, boolean>>({})
  const [saving,    setSaving]    = useState(false)
  const [elapsed,   setElapsed]   = useState(0)
  const [timerOn,   setTimerOn]   = useState(false)

  useEffect(() => {
    fetch('/api/reading')
      .then(r => r.json())
      .then(d => { setBaiDoc(d.baiDoc || []); setDaLamMap(d.daLamMap || {}) })
      .catch(() => toast.error('Không thể tải bài đọc'))
      .finally(() => setLoading(false))
  }, [])

  // Timer
  useEffect(() => {
    if (!timerOn || submitted) return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [timerOn, submitted])

  const filtered = useMemo(() => {
    return baiDoc.filter(b => {
      const q = search.toLowerCase()
      if (q && !b.tieu_de.toLowerCase().includes(q) && !(b.chu_de ?? '').toLowerCase().includes(q)) return false
      if (certFil !== 'All'  && b.loai_chung_chi !== certFil)  return false
      if (levelFil !== 'All' && b.cap_do !== levelFil) return false
      if (statusFil === 'Chưa làm' && daLamMap[b.id])  return false
      if (statusFil === 'Đã làm'   && !daLamMap[b.id]) return false
      if (statusFil === 'Điểm cao') {
        const dl = daLamMap[b.id]
        if (!dl || dl.diem / dl.tong < 0.8) return false
      }
      return true
    })
  }, [baiDoc, search, certFil, levelFil, statusFil, daLamMap])

  function openBai(bai: BaiDoc) {
    setSelected(bai)
    setAnswers({})
    setSubmitted(false)
    setShowExp({})
    setElapsed(0)
    setTimerOn(true)
    setView('reading')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleAnswer(qId: string, val: string) {
    if (submitted) return
    setAnswers(p => ({ ...p, [qId]: val }))
  }

  async function handleSubmit() {
    if (!selected) return
    const qs = selected.BaiDocCauHoi
    const allAnswered = qs.every(q => answers[q.id])
    if (!allAnswered && !confirm('Bạn chưa trả lời hết câu. Vẫn nộp bài?')) return

    setSaving(true)
    setTimerOn(false)
    const correct = qs.filter(q => isCorrect(q, answers[q.id] ?? '')).length
    const total   = qs.length

    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baiDocId: selected.id,
          correct, total,
          thoiGianGiay: elapsed,
          chiTietTraLoi: answers,
        }),
      })
      if (!res.ok) throw new Error()
      setDaLamMap(prev => ({
        ...prev,
        [selected.id]: { diem: correct, tong: total, ngay: new Date().toISOString() },
      }))
      toast.success(`Nộp bài thành công! ${correct}/${total} câu đúng`)
    } catch {
      toast.error('Không thể lưu kết quả')
    } finally {
      setSaving(false)
      setSubmitted(true)
      setView('result')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  // ── Loading ──
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: "'DM Sans',sans-serif", color: C.gold, gap: 10, fontSize: 16 }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}}` }} />
      <div style={{ width: 20, height: 20, border: `2px solid ${C.gold}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      Đang tải bài đọc...
    </div>
  )

  // ── Reading view ──
  if (view === 'reading' && selected) {
    const qs = selected.BaiDocCauHoi
    const answered = qs.filter(q => answers[q.id]).length
    const certColor = CERT_COLOR[selected.loai_chung_chi] || C.slate

    return (
      <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
        <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

        {/* Sticky top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(248,245,238,.96)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(15,28,53,.07)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <button onClick={() => { setView('list'); setTimerOn(false) }} style={{ width: 34, height: 34, borderRadius: 10, background: C.white, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <ChevronLeft size={16} color={C.textMid} strokeWidth={2} />
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.tieu_de}</div>
                <div style={{ fontSize: 11, color: C.textLt }}>{selected.loai_chung_chi} · {selected.cap_do}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {/* Timer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: C.white, border: `1px solid ${C.border}`, borderRadius: 50, fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: 'monospace' }}>
                <Clock size={12} color={C.textLt} strokeWidth={2} />
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              {/* Progress */}
              <div style={{ fontSize: 13, fontWeight: 700, color: answered === qs.length ? C.green : C.gold }}>
                {answered}/{qs.length}
              </div>
              <button onClick={handleSubmit} disabled={saving} style={{
                padding: '8px 18px', background: C.navy, color: '#fff',
                border: 'none', borderRadius: 50, fontSize: 13, fontWeight: 700,
                cursor: saving ? 'default' : 'pointer', fontFamily: "'DM Sans', sans-serif",
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Đang lưu...' : 'Nộp bài'}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: `${C.navy}08` }}>
            <div style={{ height: '100%', background: `linear-gradient(90deg,${C.gold},${C.goldLt})`, width: `${(answered / qs.length) * 100}%`, transition: 'width .3s' }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 80px' }}>
          {selected.thong_tin_ky_thi && (
            <div style={{ padding: '10px 16px', background: `${certColor}0A`, border: `1px solid ${certColor}20`, borderRadius: 12, fontSize: 13, color: certColor, marginBottom: 18, fontWeight: 600 }}>
              📌 {selected.thong_tin_ky_thi}
            </div>
          )}

          <div className="reading-layout">
            {/* Left: passage */}
            <div style={{ position: 'sticky', top: 72, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', paddingRight: 4 }}>
              <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, padding: '24px 26px', boxShadow: '0 2px 12px rgba(15,28,53,.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${certColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Newspaper size={17} color={certColor} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Bài đọc</div>
                    <div style={{ fontSize: 11, color: C.textLt }}>~{selected.noi_dung.split(/\s+/).length} từ</div>
                  </div>
                </div>
                <div style={{ fontSize: 15, color: C.text, lineHeight: 2.0, whiteSpace: 'pre-wrap', fontFamily: "'DM Sans', sans-serif" }}>
                  {selected.noi_dung}
                </div>
              </div>
            </div>

            {/* Right: questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {qs.map((q, idx) => {
                const userAns = answers[q.id] ?? ''
                const correct = isCorrect(q, userAns)
                const showE   = showExp[q.id]
                const isMultiple = q.loai_cau_hoi === 'trac_nghiem'
                const isTrueFalse = q.loai_cau_hoi === 'true_false'
                const isFill  = q.loai_cau_hoi === 'dien_cho_trong'

                return (
                  <div key={q.id} style={{
                    background: C.white, borderRadius: 18, border: `1.5px solid ${submitted ? (correct ? 'rgba(0,168,120,.3)' : 'rgba(240,100,100,.25)') : (userAns ? `${certColor}35` : C.border)}`,
                    padding: '18px 20px', boxShadow: '0 2px 8px rgba(15,28,53,.05)',
                    transition: 'border-color .2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, lineHeight: 1.7, margin: 0, flex: 1 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 900, color: C.textLt, marginRight: 8 }}>
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        {q.noi_dung}
                      </p>
                      {submitted && (
                        correct
                          ? <CheckCircle2 size={18} color={C.green} strokeWidth={2} style={{ flexShrink: 0 }} />
                          : <XCircle size={18} color={C.rose} strokeWidth={2} style={{ flexShrink: 0 }} />
                      )}
                    </div>

                    {/* Multiple choice */}
                    {(isMultiple || isTrueFalse) && (
                      <div style={{ display: 'grid', gridTemplateColumns: isTrueFalse ? 'repeat(3,1fr)' : '1fr 1fr', gap: 8 }}>
                        {(q.cac_lua_chon && q.cac_lua_chon.length > 0
                          ? q.cac_lua_chon
                          : isTrueFalse ? ['True', 'False', 'Not Given'] : []
                        ).map(opt => {
                          const isSelected = userAns === opt
                          const isDapAn    = submitted && opt === q.dap_an_dung
                          const isWrong    = submitted && isSelected && !isDapAn
                          return (
                            <button key={opt} className="opt-btn" onClick={() => handleAnswer(q.id, opt)} style={{
                              textAlign: 'left', padding: '10px 14px', borderRadius: 12, fontSize: 13,
                              border: `2px solid ${isDapAn ? C.green : isWrong ? C.rose : isSelected ? certColor : C.border}`,
                              background: isDapAn ? '#E1F5EE' : isWrong ? '#FEF2F2' : isSelected ? `${certColor}0D` : C.bg,
                              color: isDapAn ? '#0F6E56' : isWrong ? C.rose : isSelected ? certColor : C.text,
                              fontWeight: isSelected || isDapAn ? 700 : 400,
                              cursor: submitted ? 'default' : 'pointer',
                              fontFamily: "'DM Sans', sans-serif",
                            }}>
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Fill in the blank */}
                    {isFill && (
                      <div>
                        <input
                          type="text"
                          value={userAns}
                          onChange={e => handleAnswer(q.id, e.target.value)}
                          disabled={submitted}
                          placeholder="Điền câu trả lời..."
                          style={{
                            width: '100%', padding: '10px 14px',
                            border: `2px solid ${submitted ? (correct ? C.green : C.rose) : userAns ? certColor : C.border}`,
                            borderRadius: 12, fontSize: 14, color: C.text,
                            background: submitted ? (correct ? '#E1F5EE' : '#FEF2F2') : C.bg,
                            outline: 'none', fontFamily: "'DM Sans', sans-serif",
                          }}
                        />
                        {submitted && !correct && (
                          <div style={{ fontSize: 12, color: C.textMid, marginTop: 6 }}>
                            ✅ Đáp án đúng: <strong>{q.dap_an_dung}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {submitted && q.giai_thich && (
                      <div style={{ marginTop: 10 }}>
                        <button onClick={() => setShowExp(p => ({ ...p, [q.id]: !showE }))} style={{
                          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                          color: C.gold, background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif", fontWeight: 600, padding: 0,
                        }}>
                          <Lightbulb size={13} strokeWidth={2} />
                          {showE ? 'Ẩn giải thích' : 'Xem giải thích'}
                          {showE ? <EyeOff size={11} /> : <Eye size={11} />}
                        </button>
                        {showE && (
                          <div style={{ marginTop: 8, padding: '10px 14px', background: C.goldPale, border: `1px solid ${C.borderMd}`, borderRadius: 10, fontSize: 13, color: '#5a4000', lineHeight: 1.7 }}>
                            {q.giai_thich}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Submit button */}
              {!submitted && (
                <button onClick={handleSubmit} disabled={saving} style={{
                  width: '100%', padding: '14px 0',
                  background: C.navy, color: '#fff',
                  border: 'none', borderRadius: 50, fontSize: 15, fontWeight: 700,
                  cursor: saving ? 'default' : 'pointer', fontFamily: "'DM Sans', sans-serif",
                  boxShadow: '0 6px 22px rgba(15,28,53,.28)', opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? 'Đang lưu...' : '📤 Nộp bài'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Result view ──
  if (view === 'result' && selected) {
    const qs = selected.BaiDocCauHoi
    const correct = qs.filter(q => isCorrect(q, answers[q.id] ?? '')).length
    const total = qs.length
    const pct = Math.round((correct / total) * 100)
    const isPass = pct >= 60
    const certColor = CERT_COLOR[selected.loai_chung_chi] || C.slate

    return (
      <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
        <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 20px 80px' }}>

          {/* Result hero */}
          <div className="fade-in" style={{ background: C.navy, borderRadius: 28, padding: '36px 40px', textAlign: 'center', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: `${certColor}10`, borderRadius: '60% 40% 30% 70%', filter: 'blur(24px)', pointerEvents: 'none' }} />
            <div style={{ fontSize: 52, marginBottom: 12 }}>{isPass ? '🎉' : '📚'}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#fff', marginBottom: 4 }}>
              {correct}<span style={{ fontSize: 22, color: 'rgba(255,255,255,.4)' }}>/{total}</span>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: isPass ? C.goldLt : C.rose, marginBottom: 10 }}>
              {pct}%
            </div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,.55)', marginBottom: 4 }}>
              {isPass ? '✅ Hoàn thành tốt!' : '💪 Hãy ôn tập thêm!'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.35)' }}>
              Thời gian: {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')} · {selected.tieu_de}
            </div>
          </div>

          {/* Action buttons */}
          <div className="fade-in" style={{ display: 'flex', gap: 12, marginBottom: 28, animationDelay: '60ms' }}>
            <button onClick={() => { setView('reading'); setSubmitted(true) }} style={{ flex: 1, padding: '12px 0', background: C.white, border: `2px solid ${C.border}`, borderRadius: 50, fontSize: 14, fontWeight: 700, color: C.navy, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Eye size={14} strokeWidth={2} /> Xem lại bài
            </button>
            <button onClick={() => { openBai(selected) }} style={{ flex: 1, padding: '12px 0', background: C.gold, border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700, color: C.navy, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 6px 20px rgba(201,168,76,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <RotateCcw size={14} strokeWidth={2} /> Làm lại
            </button>
            <button onClick={() => setView('list')} style={{ flex: 1, padding: '12px 0', background: C.navy, border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Home size={14} strokeWidth={2} /> Bài khác
            </button>
          </div>

          {/* Score breakdown */}
          <div className="fade-in" style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: '22px 24px', animationDelay: '120ms' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textLt, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
              Chi tiết câu trả lời
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {qs.map((q, i) => {
                const userAns = answers[q.id] ?? ''
                const ok = isCorrect(q, userAns)
                return (
                  <div key={q.id} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: ok ? '#E1F5EE' : '#FEF2F2', borderRadius: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 900, color: ok ? C.green : C.rose, fontSize: 12, flexShrink: 0, marginTop: 1 }}>{String(i + 1).padStart(2, '0')}.</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: C.navy, marginBottom: 4, lineHeight: 1.5 }}>{q.noi_dung.slice(0, 80)}{q.noi_dung.length > 80 ? '...' : ''}</div>
                      <div style={{ fontSize: 12, color: C.textMid }}>
                        Bạn chọn: <strong style={{ color: ok ? C.green : C.rose }}>{userAns || '(chưa trả lời)'}</strong>
                        {!ok && <> · Đáp án: <strong style={{ color: C.green }}>{q.dap_an_dung}</strong></>}
                      </div>
                    </div>
                    {ok ? <CheckCircle2 size={16} color={C.green} strokeWidth={2} style={{ flexShrink: 0 }} /> : <XCircle size={16} color={C.rose} strokeWidth={2} style={{ flexShrink: 0 }} />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── List view ──
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px clamp(14px,3vw,32px) 72px' }}>

        {/* Header */}
        <div className="fade-in" style={{ marginBottom: 32, animationDelay: '0ms' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 14px', background: `${C.blue}12`, border: `1px solid ${C.blue}28`, borderRadius: 50, fontSize: 11, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
            <Newspaper size={11} strokeWidth={2.5} /> Luyện đọc
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 900, color: C.navy, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            Reading <em style={{ fontStyle: 'italic', color: C.gold }}>Comprehension</em>
          </h1>
          <p style={{ fontSize: 15, color: C.textMid, margin: 0 }}>
            {filtered.length} bài đọc · Chọn bài để bắt đầu luyện tập
          </p>
        </div>

        {/* Search + Filters */}
        <div className="fade-in" style={{ marginBottom: 24, animationDelay: '60ms' }}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={15} color={C.textLt} strokeWidth={2} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm bài đọc..."
              style={{ width: '100%', padding: '11px 14px 11px 38px', background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 50, fontSize: 14, color: C.text, outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>

          <div className="filter-scroll" style={{ display: 'flex', gap: 10, paddingBottom: 4 }}>
            <ListFilter size={14} color={C.textLt} strokeWidth={2} style={{ flexShrink: 0, marginTop: 5 }} />
            {/* Cert */}
            {CERTS.map(c => (
              <button key={c} onClick={() => setCertFil(c)} style={{
                padding: '5px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, flexShrink: 0,
                background: certFil === c ? C.navy : C.white,
                color: certFil === c ? '#fff' : C.textMid,
                border: `1.5px solid ${certFil === c ? C.navy : C.border}`,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>{c}</button>
            ))}
            <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />
            {LEVELS.map(l => (
              <button key={l} onClick={() => setLevelFil(l)} style={{
                padding: '5px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, flexShrink: 0,
                background: levelFil === l ? C.gold : C.white,
                color: levelFil === l ? C.navy : C.textMid,
                border: `1.5px solid ${levelFil === l ? C.gold : C.border}`,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>{l}</button>
            ))}
            <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFil(s)} style={{
                padding: '5px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, flexShrink: 0,
                background: statusFil === s ? C.green : C.white,
                color: statusFil === s ? '#fff' : C.textMid,
                border: `1.5px solid ${statusFil === s ? C.green : C.border}`,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="fade-in" style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 24, padding: '52px 32px', textAlign: 'center', animationDelay: '120ms' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📖</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: C.navy, marginBottom: 10 }}>
              {baiDoc.length === 0 ? 'Chưa có bài đọc nào' : 'Không tìm thấy bài phù hợp'}
            </div>
            <p style={{ fontSize: 14, color: C.textMid, marginBottom: 20 }}>
              {baiDoc.length === 0 ? 'Admin chưa thêm bài đọc. Hãy quay lại sau!' : 'Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.'}
            </p>
            {baiDoc.length > 0 && (
              <button onClick={() => { setSearch(''); setCertFil('All'); setLevelFil('All'); setStatusFil('All') }} style={{ padding: '10px 24px', background: C.gold, border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700, color: C.navy, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Xoá bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14, animationDelay: '120ms' }}>
            {filtered.map(bai => (
              <BaiDocCard key={bai.id} bai={bai} daLam={daLamMap[bai.id]} onClick={() => openBai(bai)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}