'use client'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

interface Question {
  id: string
  noi_dung_cau_hoi: string
  cac_lua_chon?: { key: string; value: string }[]
  dap_an_dung: string
  giai_thich?: string
  ky_nang: string
  loai_cau_hoi: string
  so_phan?: number
}

interface ExamResult {
  diemSo: number
  tongSoCau: number
  phanTramDung: number
  diemQuyDoi?: number | null
  phanTichAi?: string | null
  [key: string]: unknown
}

interface Props {
  loaiChungChi: string
  kyNang: string
  mode: 'quick' | 'full'
  onFinish: () => void
}

const SCORE_LABEL: Record<string, (diem: number | null | undefined) => string> = {
  TOEIC: (d) => d ? `~${d} điểm TOEIC` : '',
  VSTEP: (d) => d ? `~${d}/10 VSTEP` : '',
  APTIS: (d) => d ? `~${d}/50 APTIS` : '',
}

export default function ExamSession({ loaiChungChi, kyNang, mode, onFinish }: Props) {
  const [questions,  setQuestions]  = useState<Question[]>([])
  const [loading,    setLoading]    = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers,    setAnswers]    = useState<Record<string, string>>({})
  const [submitted,  setSubmitted]  = useState(false)
  const [result,     setResult]     = useState<ExamResult | null>(null)
  const [timeElapsed,setTimeElapsed]= useState(0)
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    fetch(`/api/exam?loai=${loaiChungChi}&kyNang=${kyNang}&mode=${mode}`)
      .then(r => r.json())
      .then(data => { setQuestions(data.questions || []); setLoading(false) })
      .catch(() => { toast.error('Không thể tải câu hỏi'); setLoading(false) })
  }, [loaiChungChi, kyNang, mode])

  useEffect(() => {
    if (!submitted && !loading) {
      timerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [submitted, loading])

  async function handleSubmit() {
    if (timerRef.current) clearInterval(timerRef.current)
    const answerList = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }))
    const res = await fetch('/api/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loai_chung_chi: loaiChungChi,
        ky_nang: kyNang,
        mode,
        answers: answerList,
        questions,
        thoiGianLamBai: timeElapsed,
      }),
    })
    const data = await res.json()
    setResult(data as ExamResult)
    setSubmitted(true)
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const answered    = Object.keys(answers).length
  const total       = questions.length
  const progressPct = total > 0 ? (answered / total) * 100 : 0

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop: 80, fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ fontSize:48, marginBottom:16, animation:'bounce 1s infinite' }}>📝</div>
        <div style={{ color:'#6B6B60', fontSize:15 }}>
          {mode === 'full' ? 'Đang tải đề thi đầy đủ...' : 'Đang tải câu hỏi...'}
        </div>
      </div>
    )
  }

  // ── No questions ──────────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign:'center', paddingTop: 80, fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>😅</div>
        <div style={{ fontSize:24, fontWeight:800, color:'#0D0D0D', marginBottom:8 }}>Chưa có câu hỏi</div>
        <div style={{ color:'#6B6B60', marginBottom:24 }}>Phần này chưa có đủ câu hỏi trong ngân hàng</div>
        <button onClick={onFinish} style={{ padding:'12px 24px', background:'#0D0D0D', color:'#fff', borderRadius:12, border:'none', cursor:'pointer', fontWeight:600 }}>
          ← Quay lại
        </button>
      </div>
    )
  }

  // ── Result screen ─────────────────────────────────────────────────────
  if (submitted && result) {
    const pct       = result.phanTramDung || 0
    const emoji     = pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '📖'
    const scoreLabel = SCORE_LABEL[loaiChungChi]?.(result.diemQuyDoi)

    return (
      <div style={{ maxWidth: 720, margin: '0 auto', fontFamily:"'DM Sans',sans-serif", paddingBottom: 60 }}>
        {/* Score hero */}
        <div style={{ textAlign:'center', marginBottom:32, padding:'36px', background:'#0F1C35', borderRadius:24, color:'#fff' }}>
          <div style={{ fontSize:56, marginBottom:8 }}>{emoji}</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:900, color:'#fff', lineHeight:1 }}>{pct}%</div>
          <div style={{ color:'rgba(255,255,255,.5)', marginTop:8, fontSize:14 }}>
            {result.diemSo}/{result.tongSoCau} câu đúng · {formatTime(timeElapsed)}
          </div>
          {scoreLabel && (
            <div style={{ marginTop:12, display:'inline-block', padding:'6px 18px', background:'rgba(201,168,76,.2)', border:'1px solid rgba(201,168,76,.4)', borderRadius:50, color:'#C9A84C', fontSize:14, fontWeight:700 }}>
              {scoreLabel}
            </div>
          )}
          {mode === 'full' && (
            <div style={{ marginTop:8, display:'inline-block', padding:'4px 14px', background:'rgba(0,168,120,.15)', border:'1px solid rgba(0,168,120,.3)', borderRadius:50, color:'#4ECBA8', fontSize:12, fontWeight:600, marginLeft:8 }}>
              ✅ Đề thi đầy đủ
            </div>
          )}
        </div>

        {/* AI phân tích */}
        {result.phanTichAi && result.phanTichAi.trim() !== '' && (
          <div style={{ marginBottom:24, padding:20, background:'#F8F7F2', borderRadius:16, border:'1px solid #E8E8E0' }}>
            <div style={{ fontWeight:700, color:'#0D0D0D', marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
              🤖 AI phân tích
            </div>
            <div style={{ fontSize:14, color:'#484840', lineHeight:1.8, whiteSpace:'pre-line' }}>{result.phanTichAi}</div>
          </div>
        )}

        {/* Chi tiết từng câu */}
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
          {questions.map((q, i) => {
            const userAns  = answers[q.id]
            const isCorrect = userAns === q.dap_an_dung
            return (
              <div key={q.id} style={{ padding:20, borderRadius:16, border:`2px solid ${isCorrect ? 'rgba(0,168,120,.3)' : 'rgba(255,107,107,.3)'}`, background: isCorrect ? '#E8FFF8' : '#FFF0F0' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <span style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:700, background: isCorrect ? '#00A878' : '#FF6B6B' }}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#0D0D0D', marginBottom:6 }}>
                      Câu {i + 1}. {q.noi_dung_cau_hoi.length > 120 ? q.noi_dung_cau_hoi.slice(0, 120) + '...' : q.noi_dung_cau_hoi}
                    </div>
                    {!isCorrect && (
                      <div style={{ fontSize:13, marginBottom:4 }}>
                        <span style={{ color:'#FF6B6B' }}>Bạn chọn: {userAns || 'Bỏ qua'}</span>
                        {' · '}
                        <span style={{ color:'#00A878', fontWeight:600 }}>Đáp án: {q.dap_an_dung}</span>
                      </div>
                    )}
                    {q.giai_thich && (
                      <div style={{ fontSize:12, color:'#6B6B60', marginTop:4 }}>💡 {q.giai_thich}</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={onFinish}
            style={{ flex:1, padding:'14px', border:'2px solid #E8E8E0', color:'#0D0D0D', fontWeight:600, borderRadius:12, background:'#fff', cursor:'pointer', fontSize:14 }}>
            ← Quay lại
          </button>
          <button onClick={() => { setSubmitted(false); setAnswers({}); setCurrentIdx(0); setTimeElapsed(0); setResult(null) }}
            style={{ flex:1, padding:'14px', background:'#00A878', color:'#fff', fontWeight:700, borderRadius:12, border:'none', cursor:'pointer', fontSize:14 }}>
            Thi lại
          </button>
        </div>
      </div>
    )
  }

  // ── Exam screen ───────────────────────────────────────────────────────
  const q = questions[currentIdx]

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', fontFamily:"'DM Sans',sans-serif", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <button onClick={onFinish} style={{ background:'none', border:'none', cursor:'pointer', color:'#6B6B60', fontSize:13 }}>← Thoát</button>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:12, color:'#6B6B60' }}>{currentIdx + 1} / {total}</div>
          <div style={{ fontFamily:'monospace', color:'#F5A623', fontWeight:700, fontSize:15 }}>{formatTime(timeElapsed)}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:'#6B6B60' }}>{loaiChungChi}</span>
          {mode === 'full' && (
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', background:'rgba(201,168,76,.15)', color:'#C9A84C', borderRadius:20 }}>FULL</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:6, background:'#F0F0EA', borderRadius:99, marginBottom:24, overflow:'hidden' }}>
        <div style={{ height:'100%', background:'#00A878', borderRadius:99, width:`${progressPct}%`, transition:'width .4s ease' }} />
      </div>

      {/* Answered counter */}
      <div style={{ textAlign:'right', fontSize:12, color:'#94A3B8', marginBottom:16 }}>
        Đã trả lời: <strong style={{ color:'#00A878' }}>{answered}</strong>/{total}
      </div>

      {/* Question card */}
      <div style={{ background:'#fff', borderRadius:20, border:'1px solid #E8E8E0', padding:24, marginBottom:20, boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}>
        <div style={{ fontSize:11, color:'#A0A090', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600 }}>
          Câu {currentIdx + 1}
          {mode === 'full' && q.so_phan && (
            <span style={{ marginLeft:8, color:'#C9A84C' }}>· Part {q.so_phan}</span>
          )}
        </div>
        <div style={{ fontSize:15, fontWeight:500, color:'#0D0D0D', lineHeight:1.75, whiteSpace:'pre-line' }}>
          {q.noi_dung_cau_hoi}
        </div>
      </div>

      {/* Options */}
      {q.cac_lua_chon && (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
          {q.cac_lua_chon.map(opt => {
            const selected = answers[q.id] === opt.key
            return (
              <button key={opt.key}
                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.key }))}
                style={{ width:'100%', textAlign:'left', padding:'14px 20px', borderRadius:14, border:`2px solid ${selected ? '#0D0D0D' : '#E8E8E0'}`, background: selected ? '#F8F7F2' : '#fff', fontWeight: selected ? 600 : 400, fontSize:14, cursor:'pointer', transition:'all .2s', color:'#0D0D0D' }}>
                <span style={{ fontWeight:700, marginRight:8 }}>{opt.key}.</span>{opt.value}
              </button>
            )
          })}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          style={{ padding:'10px 20px', border:'2px solid #E8E8E0', borderRadius:12, color:'#6B6B60', background:'#fff', cursor:'pointer', fontSize:13, opacity: currentIdx === 0 ? 0.3 : 1 }}>
          ← Trước
        </button>

        {/* Dot navigator — chỉ hiện nếu ≤ 20 câu */}
        {total <= 20 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                style={{ width:30, height:30, borderRadius:8, fontSize:11, fontWeight:600, border: i === currentIdx ? '2px solid #0D0D0D' : '1px solid #E8E8E0', background: i === currentIdx ? '#0D0D0D' : answers[questions[i].id] ? '#00A87820' : '#fff', color: i === currentIdx ? '#fff' : answers[questions[i].id] ? '#00A878' : '#6B6B60', cursor:'pointer' }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Full mode: compact progress thay dot navigator */}
        {total > 20 && (
          <div style={{ fontSize:13, color:'#6B6B60', textAlign:'center' }}>
            <span style={{ fontWeight:700, color:'#0D0D0D' }}>{currentIdx + 1}</span> / {total}
          </div>
        )}

        {currentIdx < total - 1 ? (
          <button onClick={() => setCurrentIdx(currentIdx + 1)}
            style={{ padding:'10px 20px', background:'#0D0D0D', color:'#fff', borderRadius:12, border:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            Tiếp →
          </button>
        ) : (
          <button onClick={handleSubmit}
            disabled={answered === 0}
            style={{ padding:'10px 20px', background:'#00A878', color:'#fff', borderRadius:12, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, opacity: answered === 0 ? 0.5 : 1 }}>
            Nộp bài ✓
          </button>
        )}
      </div>
    </div>
  )
}