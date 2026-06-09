'use client'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, Pencil, Sparkles, X, BookOpen, GripVertical } from 'lucide-react'

// ═══════════════════════════════════════════════════════════
//  ALERT / TOAST SYSTEM
// ═══════════════════════════════════════════════════════════
type AlertType = 'success' | 'error' | 'warning' | 'info'
type AlertItem = { id: number; type: AlertType; title: string; message?: string }

let _alertId = 0
let _setAlerts: React.Dispatch<React.SetStateAction<AlertItem[]>> | null = null

function showToast(type: AlertType, title: string, message?: string) {
  if (!_setAlerts) return
  const id = ++_alertId
  _setAlerts(prev => [...prev, { id, type, title, message }])
}

const ACCENT = '#1e3a5f'

const ALERT_META: Record<AlertType, { chip: string; btnLabel: string; iconPath: React.ReactNode }> = {
  success: { chip: 'Thành công', btnLabel: 'Đóng', iconPath: <><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></> },
  error:   { chip: 'Lỗi hệ thống', btnLabel: 'Đã hiểu', iconPath: <><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></> },
  warning: { chip: 'Cảnh báo', btnLabel: 'Được rồi', iconPath: <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /> },
  info:    { chip: 'Thông tin', btnLabel: 'Đóng', iconPath: <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
}

function AlertContainer() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  _setAlerts = setAlerts
  useEffect(() => {
    if (alerts.length === 0) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setAlerts(p => p.slice(1)) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [alerts.length])
  if (alerts.length === 0) return null
  const cur = alerts[0]; const meta = ALERT_META[cur.type]
  function dismiss() { setAlerts(p => p.slice(1)) }
  return (
    <div onClick={dismiss} style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(10,20,40,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,animation:'ahIn 0.18s ease' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%',maxWidth:400,background:'#fff',borderRadius:16,border:`2px solid ${ACCENT}`,overflow:'hidden',position:'relative',boxShadow:'0 16px 48px rgba(10,20,50,0.18)',animation:'ahModal 0.25s cubic-bezier(0.34,1.56,0.64,1)',fontFamily:'DM Sans,sans-serif' }}>
        <button onClick={dismiss} style={{ position:'absolute',top:12,right:12,width:28,height:28,borderRadius:8,border:'none',background:'rgba(30,58,95,0.08)',color:ACCENT,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div style={{ padding:'24px 24px 20px',display:'flex',gap:14,alignItems:'flex-start' }}>
          <div style={{ width:42,height:42,borderRadius:10,flexShrink:0,background:'rgba(30,58,95,0.08)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{meta.iconPath}</svg>
          </div>
          <div style={{ flex:1,minWidth:0,paddingTop:2 }}>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'#0f2847',marginBottom:5 }}>{meta.chip}</div>
            <div style={{ fontSize:16,fontWeight:700,color:'#111827',lineHeight:1.3 }}>{cur.title}</div>
            {cur.message && <p style={{ fontSize:13,color:'#374151',lineHeight:1.6,margin:'6px 0 0' }}>{cur.message}</p>}
          </div>
        </div>
        <div style={{ padding:'12px 24px 20px',display:'flex',alignItems:'center',justifyContent:'flex-end',borderTop:`1px solid rgba(30,58,95,0.12)` }}>
          <button onClick={dismiss} style={{ padding:'9px 22px',borderRadius:10,border:'none',background:ACCENT,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>{meta.btnLabel}</button>
        </div>
      </div>
      <style>{`@keyframes ahIn{from{opacity:0}to{opacity:1}}@keyframes ahModal{from{opacity:0;transform:scale(0.88) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  CONFIRM DIALOG
// ═══════════════════════════════════════════════════════════
type ConfirmVariant = 'danger' | 'warning' | 'info'
type ConfirmOptions = { title: string; message?: string; confirmText?: string; cancelText?: string; variant?: ConfirmVariant }
type ConfirmState = ConfirmOptions & { resolve: (v: boolean) => void }

function ConfirmDialog({ state, onResolve }: { state: ConfirmState; onResolve: (v: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key==='Escape') onResolve(false); if (e.key==='Enter') onResolve(true) }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [onResolve])
  return (
    <div ref={ref} onClick={e=>{ if(e.target===ref.current) onResolve(false) }} style={{ position:'fixed',inset:0,zIndex:9998,background:'rgba(10,20,40,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ width:'100%',maxWidth:400,background:'#fff',borderRadius:16,border:`2px solid ${ACCENT}`,overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,0.16)',fontFamily:'DM Sans,sans-serif' }}>
        <div style={{ padding:'24px 24px 20px',display:'flex',gap:14,alignItems:'flex-start' }}>
          <div style={{ width:42,height:42,borderRadius:10,flexShrink:0,background:'rgba(30,58,95,0.08)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2}><path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <div style={{ flex:1,minWidth:0,paddingTop:2 }}>
            <div style={{ fontSize:16,fontWeight:700,color:'#111827',lineHeight:1.3 }}>{state.title}</div>
            {state.message && <p style={{ fontSize:13,color:'#374151',lineHeight:1.6,margin:'6px 0 0' }}>{state.message}</p>}
          </div>
        </div>
        <div style={{ padding:'12px 24px 20px',display:'flex',gap:10,justifyContent:'flex-end',borderTop:`1px solid rgba(30,58,95,0.12)` }}>
          <button onClick={()=>onResolve(false)} style={{ padding:'9px 20px',borderRadius:10,border:`1.5px solid rgba(30,58,95,0.25)`,background:'#fff',color:'#374151',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>{state.cancelText??'Hủy'}</button>
          <button onClick={()=>onResolve(true)} style={{ padding:'9px 22px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#0f2847,#1e3a5f)',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>{state.confirmText??'Xác nhận'}</button>
        </div>
      </div>
    </div>
  )
}

function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null)
  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> =>
    new Promise<boolean>(resolve => setState({ ...opts, resolve })), [])
  const handleResolve = useCallback((val: boolean) => { state?.resolve(val); setState(null) }, [state])
  const dialog = state ? <ConfirmDialog state={state} onResolve={handleResolve} /> : null
  return { confirm, dialog }
}

// ═══════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const PAGE_SIZE = 20

const LEVEL_COLOR: Record<string, string> = {
  A1: 'bg-[#ede9fe] text-[#7c3aed]',
  A2: 'bg-[#e0f2fe] text-[#0369a1]',
  B1: 'bg-[#dcfce7] text-[#15803d]',
  B2: 'bg-[#fef9c3] text-[#a16207]',
  C1: 'bg-[#fee2e2] text-[#dc2626]',
  C2: 'bg-[#fae8ff] text-[#9333ea]',
}

const TH: React.CSSProperties = {
  background: 'linear-gradient(180deg, #2d4e7a 0%, #1e3a5f 100%)',
  color: 'rgba(226,232,240,0.82)',
  padding: '11px 14px', fontSize: 13, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.07em',
  whiteSpace: 'nowrap', userSelect: 'none',
  borderBottom: '2px solid rgba(147,197,253,0.2)',
}
const CELL_BORDER = '1px solid #c2cfe0'
const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]/60 transition-colors bg-white'

// ═══════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════
type Lesson = Record<string, unknown>

interface NoiDungJson {
  note?: string
  uses?: { chip: string; ex: string }[]
  formula?: { label: string; f: string }[]
  signalWords?: string[]
}

interface BaiTapItem {
  q: string
  type: 'mc' | 'fill' | 'tf' | 'rewrite'
  opts?: string[]
  ans: number | boolean | string
  exp?: string
}

// ═══════════════════════════════════════════════════════════
//  TAB LÝ THUYẾT — xem
// ═══════════════════════════════════════════════════════════
function TabLyThuyet({ data }: { data: NoiDungJson }) {
  return (
    <div className="space-y-5 py-2">
      {data.note && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">📌 Ghi chú tổng quan</div>
          <p className="text-sm text-blue-900 leading-relaxed">{data.note}</p>
        </div>
      )}
      {data.formula && data.formula.length > 0 && (
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📐 Công thức</div>
          <div className="space-y-2">
            {data.formula.map((item, i) => (
              <div key={i} className="flex gap-3 items-start bg-gray-50 rounded-xl p-3 border border-gray-200">
                <span className="text-xs font-semibold text-[#1e3a5f] bg-blue-100 px-2 py-1 rounded-lg whitespace-nowrap mt-0.5 min-w-fit">{item.label}</span>
                <code className="text-sm text-gray-800 font-mono leading-relaxed">{item.f}</code>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.uses && data.uses.length > 0 && (
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">💡 Ví dụ sử dụng</div>
          <div className="space-y-2">
            {data.uses.map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full whitespace-nowrap mt-0.5 min-w-fit">{item.chip}</span>
                <span className="text-sm text-gray-800 italic">"{item.ex}"</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.signalWords && data.signalWords.length > 0 && (
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">🔑 Từ tín hiệu</div>
          <div className="flex flex-wrap gap-2">
            {data.signalWords.map((w, i) => (
              <span key={i} className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">{w}</span>
            ))}
          </div>
        </div>
      )}
      {!data.note && !data.formula?.length && !data.uses?.length && !data.signalWords?.length && (
        <div className="py-12 text-center text-gray-400 text-sm">Chưa có nội dung lý thuyết</div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  TAB BÀI TẬP — làm bài
// ═══════════════════════════════════════════════════════════
function TabBaiTap({ data }: { data: BaiTapItem[] }) {
  const [answers, setAnswers] = useState<Record<number, string | number | boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  function isCorrect(i: number): boolean {
    const q = data[i]; const ua = answers[i]
    if (q.type === 'mc') return ua === q.ans
    if (q.type === 'tf') return String(ua) === String(q.ans)
    const correct = String(q.ans).toLowerCase().trim()
    const given = String(ua || '').toLowerCase().trim()
    return correct.split('/').map(s => s.trim()).some(c => c === given)
  }

  const score = submitted ? data.reduce((acc, _, i) => acc + (isCorrect(i) ? 1 : 0), 0) : 0
  const TYPE_LABEL: Record<string, string> = { mc: 'Trắc nghiệm', fill: 'Điền từ', tf: 'Đúng/Sai', rewrite: 'Viết lại' }

  return (
    <div className="space-y-4 py-2">
      {submitted && (
        <div className={`rounded-xl p-4 text-center font-bold text-lg ${score >= data.length * 0.7 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
          {score >= data.length * 0.7 ? '🎉' : '📚'} Kết quả: {score}/{data.length} ({Math.round(score / data.length * 100)}%)
        </div>
      )}
      {data.map((q, i) => {
        const correct = submitted ? isCorrect(i) : null
        return (
          <div key={i} className={`rounded-xl border-2 p-4 transition-colors ${correct===null?'border-gray-200 bg-white':correct?'border-emerald-300 bg-emerald-50':'border-red-300 bg-red-50'}`}>
            <div className="flex items-start gap-2 mb-3">
              <span className="text-xs font-bold bg-[#1e3a5f] text-white px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">{i+1}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase">{TYPE_LABEL[q.type]}</span>
                  {submitted && <span className={`text-xs font-bold ${correct?'text-emerald-600':'text-red-500'}`}>{correct?'✓ Đúng':'✗ Sai'}</span>}
                </div>
                <p className="text-sm font-medium text-gray-800">{q.q}</p>
              </div>
            </div>
            {q.type==='mc' && q.opts && (
              <div className="grid grid-cols-2 gap-2 ml-6">
                {q.opts.map((opt, oi) => {
                  const isSel = answers[i]===oi; const isAns = q.ans===oi
                  let cls = 'px-3 py-2 rounded-lg text-sm border-2 cursor-pointer transition-all text-left '
                  if (submitted) { if (isAns) cls+='border-emerald-400 bg-emerald-100 text-emerald-800 font-semibold'; else if (isSel&&!isAns) cls+='border-red-300 bg-red-100 text-red-700'; else cls+='border-gray-200 text-gray-500' }
                  else { cls+=isSel?'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f] font-semibold':'border-gray-200 hover:border-[#1e3a5f]/40' }
                  return <button key={oi} className={cls} disabled={submitted} onClick={()=>setAnswers(p=>({...p,[i]:oi}))}><span className="font-bold mr-1">{String.fromCharCode(65+oi)}.</span>{opt}</button>
                })}
              </div>
            )}
            {q.type==='tf' && (
              <div className="flex gap-3 ml-6">
                {['true','false'].map(v=>{
                  const isSel=String(answers[i])===v; const isAns=String(q.ans)===v
                  let cls='px-5 py-2 rounded-lg text-sm font-semibold border-2 cursor-pointer transition-all '
                  if (submitted) { if (isAns) cls+='border-emerald-400 bg-emerald-100 text-emerald-700'; else if (isSel) cls+='border-red-300 bg-red-100 text-red-600'; else cls+='border-gray-200 text-gray-400' }
                  else { cls+=isSel?'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f]':'border-gray-200 hover:border-[#1e3a5f]/40' }
                  return <button key={v} className={cls} disabled={submitted} onClick={()=>setAnswers(p=>({...p,[i]:v==='true'}))}>{v==='true'?'✓ Đúng':'✗ Sai'}</button>
                })}
              </div>
            )}
            {(q.type==='fill'||q.type==='rewrite') && (
              <div className="ml-6">
                <input type="text" placeholder={q.type==='rewrite'?'Viết lại câu...':'Điền vào chỗ trống...'}
                  value={String(answers[i]||'')} onChange={e=>setAnswers(p=>({...p,[i]:e.target.value}))} disabled={submitted}
                  className={`w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none transition-colors ${submitted?correct?'border-emerald-300 bg-emerald-50':'border-red-300 bg-red-50':'border-gray-200 focus:border-[#1e3a5f]/60'}`} />
              </div>
            )}
            {submitted && q.exp && (
              <div className="ml-6 mt-2 text-xs text-gray-500 bg-white/70 rounded-lg px-3 py-2 border border-gray-200">
                💬 {q.exp}
                {(q.type==='fill'||q.type==='rewrite') && <span className="ml-2 font-semibold text-emerald-700">→ Đáp án: {String(q.ans)}</span>}
              </div>
            )}
          </div>
        )
      })}
      {!submitted ? (
        <button onClick={()=>{ if(Object.keys(answers).length<data.length){showToast('warning',`Còn ${data.length-Object.keys(answers).length} câu chưa trả lời`);return}; setSubmitted(true) }}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm" style={{ background:'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
          Nộp bài ({Object.keys(answers).length}/{data.length} câu)
        </button>
      ) : (
        <button onClick={()=>{ setAnswers({}); setSubmitted(false) }}
          className="w-full py-3 rounded-xl font-semibold text-sm border-2 border-[#1e3a5f]/30 text-[#1e3a5f] hover:bg-blue-50 transition-colors">
          Làm lại
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  TAB CHỈNH SỬA — form UI thay vì JSON thô
// ═══════════════════════════════════════════════════════════
function TabChinhSua({ lesson, onSave, categories }: { lesson: Lesson; onSave: (updated: Lesson) => Promise<void>; categories: string[] }) {
  const [section, setSection] = useState<'info' | 'theory' | 'exercises'>('info')
  const [loading, setLoading] = useState(false)

  // ── Thông tin cơ bản ──
  const [form, setForm] = useState({
    tieu_de:         lesson.tieu_de          as string || '',
    cap_do:          lesson.cap_do           as string || 'B1',
    danh_muc:        lesson.danh_muc         as string || '',
    thu_tu_hien_thi: lesson.thu_tu_hien_thi  as number || 0,
    mo_ta:           lesson.mo_ta            as string || '',
  })

  // ── Lý thuyết (form UI) ──
  const rawJson = (lesson.noi_dung_json as NoiDungJson) || {}
  const [note, setNote]               = useState(rawJson.note || '')
  const [formulas, setFormulas]       = useState<{label:string;f:string}[]>(rawJson.formula || [])
  const [uses, setUses]               = useState<{chip:string;ex:string}[]>(rawJson.uses || [])
  const [signalWords, setSignalWords] = useState<string[]>(rawJson.signalWords || [])
  const [newSignal, setNewSignal]     = useState('')

  // ── Bài tập ──
  const [exercises, setExercises] = useState<BaiTapItem[]>((lesson.bai_tap_json as BaiTapItem[]) || [])

  function updateEx(i: number, patch: Partial<BaiTapItem>) {
    setExercises(prev => prev.map((e, idx) => idx===i ? {...e,...patch} : e))
  }
  function addEx() {
    setExercises(prev => [...prev, { q:'', type:'mc', opts:['','','',''], ans:0, exp:'' }])
  }
  function removeEx(i: number) { setExercises(prev => prev.filter((_,idx)=>idx!==i)) }
  function moveEx(i: number, dir: -1|1) {
    setExercises(prev => {
      const arr=[...prev]; const j=i+dir
      if(j<0||j>=arr.length) return arr
      ;[arr[i],arr[j]]=[arr[j],arr[i]]; return arr
    })
  }

  async function handleSave() {
    setLoading(true)
    await onSave({
      ...lesson, ...form,
      noi_dung_json: { note, formula: formulas, uses, signalWords },
      bai_tap_json: exercises,
      tong_bai_tap: exercises.length,
    })
    setLoading(false)
  }

  const sBtn = (key: typeof section, label: string) => (
    <button onClick={()=>setSection(key)}
      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${section===key?'bg-[#1e3a5f] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
      {label}
    </button>
  )

  return (
    <div className="py-2 space-y-4">
      <div className="flex gap-2 flex-wrap">
        {sBtn('info',    '📋 Thông tin')}
        {sBtn('theory',  '📖 Lý thuyết')}
        {sBtn('exercises', `✏️ Bài tập (${exercises.length})`)}
      </div>

      {/* ── THÔNG TIN ── */}
      {section==='info' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Tiêu đề bài học</label>
            <input className={inputCls} value={form.tieu_de} onChange={e=>setForm(p=>({...p,tieu_de:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Cấp độ</label>
              <select className={inputCls} value={form.cap_do} onChange={e=>setForm(p=>({...p,cap_do:e.target.value}))}>
                {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Thứ tự hiển thị</label>
              <input type="number" className={inputCls} value={form.thu_tu_hien_thi} onChange={e=>setForm(p=>({...p,thu_tu_hien_thi:Number(e.target.value)}))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Danh mục</label>
            <select className={inputCls} value={form.danh_muc} onChange={e=>setForm(p=>({...p,danh_muc:e.target.value}))}>
              <option value="">-- Chọn danh mục --</option>
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Mô tả ngắn</label>
            <textarea className={inputCls+' resize-none'} rows={3} value={form.mo_ta} onChange={e=>setForm(p=>({...p,mo_ta:e.target.value}))} />
          </div>
        </div>
      )}

      {/* ── LÝ THUYẾT (form UI) ── */}
      {section==='theory' && (
        <div className="space-y-5">

          {/* Ghi chú */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">📌 Ghi chú tổng quan</label>
            <textarea className={inputCls+' resize-none'} rows={3}
              placeholder="Mô tả ngắn gọn về điểm ngữ pháp này..."
              value={note} onChange={e=>setNote(e.target.value)} />
          </div>

          {/* Công thức */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">📐 Công thức</label>
              <button onClick={()=>setFormulas(p=>[...p,{label:'',f:''}])}
                className="text-xs font-semibold text-[#1e3a5f] bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors">
                + Thêm công thức
              </button>
            </div>
            {formulas.length===0 && <div className="text-xs text-gray-400 italic py-2">Chưa có công thức nào</div>}
            <div className="space-y-2">
              {formulas.map((item,i)=>(
                <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input value={item.label} onChange={e=>setFormulas(p=>p.map((x,idx)=>idx===i?{...x,label:e.target.value}:x))}
                      placeholder="Tên (VD: Khẳng định)"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#1e3a5f]/50 bg-white" />
                    <input value={item.f} onChange={e=>setFormulas(p=>p.map((x,idx)=>idx===i?{...x,f:e.target.value}:x))}
                      placeholder="Cấu trúc (VD: S + have/has + V3)"
                      className="col-span-2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-[#1e3a5f]/50 bg-white" />
                  </div>
                  <button onClick={()=>setFormulas(p=>p.filter((_,idx)=>idx!==i))}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Ví dụ sử dụng */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">💡 Ví dụ sử dụng</label>
              <button onClick={()=>setUses(p=>[...p,{chip:'',ex:''}])}
                className="text-xs font-semibold text-[#1e3a5f] bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors">
                + Thêm ví dụ
              </button>
            </div>
            {uses.length===0 && <div className="text-xs text-gray-400 italic py-2">Chưa có ví dụ nào</div>}
            <div className="space-y-2">
              {uses.map((item,i)=>(
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input value={item.chip} onChange={e=>setUses(p=>p.map((x,idx)=>idx===i?{...x,chip:e.target.value}:x))}
                      placeholder="Nhãn (VD: Hành động vừa xong)"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#1e3a5f]/50 bg-white" />
                    <input value={item.ex} onChange={e=>setUses(p=>p.map((x,idx)=>idx===i?{...x,ex:e.target.value}:x))}
                      placeholder="Câu ví dụ tiếng Anh"
                      className="col-span-2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#1e3a5f]/50 bg-white" />
                  </div>
                  <button onClick={()=>setUses(p=>p.filter((_,idx)=>idx!==i))}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Từ tín hiệu */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">🔑 Từ tín hiệu</label>
            <div className="flex gap-2 mb-2">
              <input value={newSignal} onChange={e=>setNewSignal(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&newSignal.trim()){ setSignalWords(p=>[...p,newSignal.trim()]); setNewSignal('') }}}
                placeholder="Nhập từ rồi nhấn Enter..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1e3a5f]/50 bg-white" />
              <button onClick={()=>{ if(newSignal.trim()){ setSignalWords(p=>[...p,newSignal.trim()]); setNewSignal('') }}}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1e3a5f] bg-blue-50 hover:bg-blue-100 transition-colors">
                Thêm
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {signalWords.length===0 && <div className="text-xs text-gray-400 italic">Chưa có từ tín hiệu</div>}
              {signalWords.map((w,i)=>(
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
                  {w}
                  <button onClick={()=>setSignalWords(p=>p.filter((_,idx)=>idx!==i))} className="hover:text-red-600 transition-colors ml-0.5">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BÀI TẬP ── */}
      {section==='exercises' && (
        <div className="space-y-3">
          {exercises.length===0 && (
            <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              Chưa có câu hỏi nào. Nhấn "+ Thêm câu hỏi" để bắt đầu.
            </div>
          )}
          {exercises.map((ex,i)=>(
            <div key={i} className="border-2 border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-[#1e3a5f] text-white px-2 py-0.5 rounded-full">{i+1}</span>
                <select value={ex.type} onChange={e=>{ const t=e.target.value as BaiTapItem['type']; const patch:Partial<BaiTapItem>={type:t}; if(t==='mc') patch.opts=ex.opts?.length?ex.opts:['','','','']; if(t==='tf'){patch.ans=true;patch.opts=undefined}; if(t==='fill'||t==='rewrite'){patch.ans='';patch.opts=undefined}; updateEx(i,patch) }}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                  <option value="mc">Trắc nghiệm (4 lựa chọn)</option>
                  <option value="fill">Điền vào chỗ trống</option>
                  <option value="tf">Đúng / Sai</option>
                  <option value="rewrite">Viết lại câu</option>
                </select>
                <div className="flex gap-1 ml-auto">
                  <button onClick={()=>moveEx(i,-1)} disabled={i===0} className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 text-base leading-none">↑</button>
                  <button onClick={()=>moveEx(i,1)} disabled={i===exercises.length-1} className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 text-base leading-none">↓</button>
                  <button onClick={()=>removeEx(i)} className="p-1 rounded text-red-400 hover:text-red-600 text-base leading-none">✕</button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-400 mb-0.5 block">Câu hỏi</label>
                <input value={ex.q} onChange={e=>updateEx(i,{q:e.target.value})}
                  placeholder={ex.type==='fill'?'Dùng ___ cho chỗ trống':'Nội dung câu hỏi'}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#1e3a5f]/60" />
              </div>
              {ex.type==='mc' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-400 block">Các lựa chọn — chọn radio = đáp án đúng</label>
                  {(ex.opts||['','','','']).map((opt,oi)=>(
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`ans_${i}`} checked={ex.ans===oi} onChange={()=>updateEx(i,{ans:oi})} className="accent-[#1e3a5f] w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-bold text-gray-500 w-4">{String.fromCharCode(65+oi)}.</span>
                      <input value={opt} onChange={e=>{ const opts=[...(ex.opts||['','','',''])]; opts[oi]=e.target.value; updateEx(i,{opts}) }}
                        placeholder={`Lựa chọn ${String.fromCharCode(65+oi)}`}
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:border-[#1e3a5f]/60" />
                    </div>
                  ))}
                </div>
              )}
              {ex.type==='tf' && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 mb-1 block">Đáp án đúng</label>
                  <div className="flex gap-3">
                    {[true,false].map(v=>(
                      <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={ex.ans===v} onChange={()=>updateEx(i,{ans:v})} className="accent-[#1e3a5f] w-4 h-4" />
                        <span className={`text-sm font-semibold ${v?'text-emerald-600':'text-red-500'}`}>{v?'✓ Đúng':'✗ Sai'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {(ex.type==='fill'||ex.type==='rewrite') && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 mb-0.5 block">
                    {ex.type==='fill'?'Đáp án (dùng / nếu nhiều đáp án)':'Câu viết lại hoàn chỉnh'}
                  </label>
                  <input value={String(ex.ans||'')} onChange={e=>updateEx(i,{ans:e.target.value})}
                    placeholder={ex.type==='fill'?'VD: shall / will':'Câu đầy đủ...'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#1e3a5f]/60" />
                </div>
              )}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 mb-0.5 block">Giải thích (tuỳ chọn)</label>
                <input value={ex.exp||''} onChange={e=>updateEx(i,{exp:e.target.value})}
                  placeholder="Giải thích đáp án..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#1e3a5f]/60" />
              </div>
            </div>
          ))}
          <button onClick={addEx}
            className="w-full py-2.5 border-2 border-dashed border-[#1e3a5f]/30 rounded-xl text-sm font-semibold text-[#1e3a5f] hover:bg-blue-50 transition-colors">
            + Thêm câu hỏi
          </button>
        </div>
      )}

      <div className="pt-1 border-t border-gray-100">
        <button onClick={handleSave} disabled={loading}
          className="w-full py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-60"
          style={{ background:'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
          {loading ? 'Đang lưu...' : '💾 Lưu tất cả thay đổi'}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  LESSON MODAL
// ═══════════════════════════════════════════════════════════
function LessonModal({ lesson, onClose, onSave, onDelete, categories }: {
  lesson: Lesson; onClose: () => void
  onSave: (updated: Lesson) => Promise<void>
  onDelete: (id: string) => Promise<void>
  categories: string[]
}) {
  const { confirm, dialog } = useConfirm()
  const [tab, setTab] = useState<'theory'|'exercise'|'edit'>('theory')
  const [loadingDelete, setLoadingDelete] = useState(false)

  const noiDung = lesson.noi_dung_json as NoiDungJson | null
  const baiTap  = lesson.bai_tap_json  as BaiTapItem[] | null

  async function handleDelete() {
    const ok = await confirm({ title:'Xóa bài học này?', message:'Bài học sẽ bị xóa vĩnh viễn, không thể khôi phục.', confirmText:'🗑 Xóa vĩnh viễn', cancelText:'Giữ lại', variant:'danger' })
    if (!ok) return
    setLoadingDelete(true); await onDelete(lesson.id as string); setLoadingDelete(false); onClose()
  }

  const tabs = [
    { key:'theory',   label:'📖 Lý thuyết' },
    { key:'exercise', label:`✏️ Bài tập (${baiTap?.length ?? 0})` },
    { key:'edit',     label:'⚙️ Chỉnh sửa' },
  ] as const

  return (
    <>
      {dialog}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background:'rgba(10,20,40,0.65)',backdropFilter:'blur(6px)' }} onClick={onClose}>
        <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl bg-white max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>

          <div className="flex items-center gap-4 px-6 py-4 flex-shrink-0" style={{ background:'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background:'rgba(255,255,255,0.15)' }}>📖</div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-base truncate">{lesson.tieu_de as string}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${LEVEL_COLOR[lesson.cap_do as string]||'bg-gray-100 text-gray-600'}`}>{lesson.cap_do as string}</span>
                {!!lesson.danh_muc && <span className="text-blue-200 text-xs">{String(lesson.danh_muc)}</span>}
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors flex-shrink-0">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
            {tabs.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${tab===t.key?'border-[#1e3a5f] text-[#1e3a5f] bg-white':'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2">
            {tab==='theory'   && noiDung && <TabLyThuyet data={noiDung} />}
            {tab==='theory'   && !noiDung && <div className="py-12 text-center text-gray-400 text-sm">Không có dữ liệu lý thuyết</div>}
            {tab==='exercise' && baiTap && baiTap.length>0 && <TabBaiTap data={baiTap} />}
            {tab==='exercise' && (!baiTap||baiTap.length===0) && <div className="py-12 text-center text-gray-400 text-sm">Chưa có bài tập nào</div>}
            {tab==='edit'     && <TabChinhSua lesson={lesson} onSave={onSave} categories={categories} />}
          </div>

          <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0">
            <button onClick={handleDelete} disabled={loadingDelete}
              className="px-4 py-2 rounded-xl text-sm border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
              {loadingDelete ? 'Đang xóa...' : '🗑 Xóa bài học'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
//  MODAL TẠO BÀI AI — giải thích rõ ràng
// ═══════════════════════════════════════════════════════════
function AddModal({ onClose, onGenerate, generating }: {
  onClose: () => void
  onGenerate: (topic: string, level: string) => Promise<void>
  generating: boolean
}) {
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState('B1')

  const steps = [
    { icon: '✍️', label: 'Bạn nhập chủ đề', desc: 'VD: "Present Perfect", "Câu điều kiện loại 2"' },
    { icon: '🤖', label: 'AI tự soạn nội dung', desc: 'Ghi chú, công thức, ví dụ, từ tín hiệu' },
    { icon: '✏️', label: 'AI tạo bài tập', desc: 'Trắc nghiệm, điền từ, đúng/sai, viết lại' },
    { icon: '✅', label: 'Lưu vào hệ thống', desc: 'Sinh viên có thể học ngay lập tức' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(10,20,40,0.6)',backdropFilter:'blur(6px)' }}
      onClick={()=>!generating&&onClose()}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4" style={{ background:'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
          <div>
            <div className="text-white font-bold text-base flex items-center gap-2">
              <Sparkles size={16} className="text-amber-300" /> Tạo bài học bằng AI
            </div>
            <div className="text-blue-200 text-xs mt-0.5">AI tự động soạn lý thuyết và bài tập hoàn chỉnh</div>
          </div>
          <button onClick={()=>!generating&&onClose()} className="text-white/60 hover:text-white">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Giải thích cách hoạt động */}
        <div className="px-6 pt-5 pb-3">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">⚡ Hoạt động như thế nào?</div>
          <div className="grid grid-cols-2 gap-2">
            {steps.map((s,i)=>(
              <div key={i} className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <span className="text-lg flex-shrink-0 mt-0.5">{s.icon}</span>
                <div>
                  <div className="text-xs font-bold text-gray-700">{s.label}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Chủ đề ngữ pháp *</label>
            <input className={inputCls} placeholder="VD: Present Perfect vs Past Simple, Câu bị động, Modal verbs..."
              value={topic} onChange={e=>setTopic(e.target.value)} disabled={generating} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Cấp độ</label>
            <select className={inputCls} value={level} onChange={e=>setLevel(e.target.value)} disabled={generating}>
              {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 leading-relaxed">
            💡 <strong>Mẹo:</strong> Chủ đề càng cụ thể, nội dung càng chất lượng. Ví dụ thay vì "Past tense" hãy nhập "Past Simple vs Past Continuous".
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3 justify-end border-t border-gray-100 pt-4">
          <button onClick={onClose} disabled={generating}
            className="px-5 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40">Hủy</button>
          <button onClick={()=>onGenerate(topic,level)} disabled={generating||!topic.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
            style={{ background:'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
            {generating
              ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang tạo bài học...</>
              : <><Sparkles size={14} /> Tạo bài học</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════
export default function GrammarAdminClient({ lessons: init }: { lessons: Lesson[] }) {
  const { confirm, dialog } = useConfirm()
  const [list, setList]               = useState(init)
  const [search, setSearch]           = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [sortKey, setSortKey]   = useState('thu_tu_hien_thi')
  const [sortDir, setSortDir]   = useState<'asc'|'desc'>('asc')
  const [page, setPage]         = useState(1)
  const [selected, setSelected] = useState<Lesson|null>(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [generating, setGenerating] = useState(false)
  const supabase = createClient()

  const categories = useMemo(()=>{
    const cats = list.map(l=>(l.danh_muc as string)?.trim()).filter(Boolean)
    return Array.from(new Set(cats)).sort()
  }, [list])

  const filtered = useMemo(()=>{
    const q = search.toLowerCase()
    let arr = list.filter(l=>{
      const matchSearch = !q || (l.tieu_de as string)?.toLowerCase().includes(q) || (l.danh_muc as string)?.toLowerCase().includes(q)
      const matchLevel  = !filterLevel    || l.cap_do    === filterLevel
      const matchCat    = !filterCategory || l.danh_muc  === filterCategory
      return matchSearch && matchLevel && matchCat
    })
    arr = [...arr].sort((a,b)=>{
      const va=(a[sortKey]??'') as string|number; const vb=(b[sortKey]??'') as string|number
      if(va<vb) return sortDir==='asc'?-1:1; if(va>vb) return sortDir==='asc'?1:-1; return 0
    })
    return arr
  }, [list,search,filterLevel,filterCategory,sortKey,sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE))
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  function toggleSort(key: string) {
    if (sortKey===key) setSortDir(d=>d==='asc'?'desc':'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  async function handleGenerate(topic: string, level: string) {
    if (!topic.trim()) { showToast('warning','Nhập chủ đề ngữ pháp'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/ai', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          message: `Tạo bài học ngữ pháp tiếng Anh về: "${topic}", cấp độ ${level}.

Trả về JSON hợp lệ (KHÔNG markdown, KHÔNG giải thích) với đúng cấu trúc sau:
{
  "tieu_de": "tên bài học ngắn gọn",
  "danh_muc": "một trong: Tenses / Conditionals / Passive / Modal verbs / Articles / Prepositions / Relative clauses / Reported speech / Tag questions / Khác",
  "noi_dung_json": {
    "note": "ghi chú tổng quan, tiếng Việt, súc tích",
    "formula": [{ "label": "tên công thức", "f": "cấu trúc" }],
    "uses": [{ "chip": "tên trường hợp", "ex": "câu ví dụ tiếng Anh" }],
    "signalWords": ["từ tín hiệu"]
  },
  "bai_tap_json": [
    { "q": "câu hỏi", "type": "mc", "opts": ["A","B","C","D"], "ans": 0, "exp": "giải thích" },
    { "q": "câu điền ___", "type": "fill", "ans": "đáp án", "exp": "giải thích" },
    { "q": "câu đúng/sai", "type": "tf", "ans": true, "exp": "giải thích" },
    { "q": "Viết lại: ...", "type": "rewrite", "ans": "câu viết lại", "exp": "giải thích" }
  ]
}
Tạo ít nhất 8 câu bài tập, trộn đều 4 loại. ans của mc là index số (0-3). ans của tf là boolean.`,
          type: 'grammar',
        }),
      })
      const data = await res.json()
      const clean = data.response.replace(/```json|```/g,'').trim()
      const parsed = JSON.parse(clean)
      const { data: lesson, error } = await supabase.from('BaiHocNguPhap').insert({
        tieu_de:        parsed.tieu_de,
        cap_do:         level,
        danh_muc:       parsed.danh_muc,
        noi_dung_json:  parsed.noi_dung_json,
        bai_tap_json:   parsed.bai_tap_json,
        tong_bai_tap:   Array.isArray(parsed.bai_tap_json) ? parsed.bai_tap_json.length : 0,
        thu_tu_hien_thi: list.length + 1,
      }).select('*').single()
      if (error) throw error
      setList(prev=>[lesson,...prev]); setPage(1); setShowAdd(false)
      showToast('success', `Đã tạo bài "${lesson.tieu_de}"!`, `${Array.isArray(parsed.bai_tap_json)?parsed.bai_tap_json.length:0} câu bài tập`)
    } catch (e) {
      showToast('error','Lỗi tạo bài học',(e as Error).message)
    }
    setGenerating(false)
  }

  async function handleSave(updated: Lesson) {
    const { error } = await supabase.from('BaiHocNguPhap').update({
      tieu_de: updated.tieu_de, cap_do: updated.cap_do, danh_muc: updated.danh_muc,
      thu_tu_hien_thi: updated.thu_tu_hien_thi, mo_ta: updated.mo_ta,
      noi_dung_json: updated.noi_dung_json, bai_tap_json: updated.bai_tap_json,
      tong_bai_tap: Array.isArray(updated.bai_tap_json) ? (updated.bai_tap_json as unknown[]).length : updated.tong_bai_tap,
    }).eq('id', updated.id as string)
    if (error) { showToast('error','Lỗi khi lưu',error.message); return }
    setList(prev=>prev.map(l=>l.id===updated.id?{...l,...updated}:l))
    setSelected(prev=>prev?{...prev,...updated}:null)
    showToast('success','Đã lưu thay đổi')
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('BaiHocNguPhap').delete().eq('id', id)
    if (error) { showToast('error','Lỗi khi xóa'); return }
    setList(prev=>prev.filter(l=>l.id!==id))
    showToast('success','Đã xóa bài học')
  }

  async function handleDeleteRow(lesson: Lesson) {
    const ok = await confirm({ title:'Xóa bài học này?', message:`"${lesson.tieu_de}" sẽ bị xóa vĩnh viễn.`, confirmText:'🗑 Xóa vĩnh viễn', cancelText:'Giữ lại', variant:'danger' })
    if (!ok) return
    await handleDelete(lesson.id as string)
  }

  function SortIcon({ k }: { k: string }) {
    return (
      <span style={{ marginLeft:4,display:'inline-flex',flexDirection:'column',gap:2,verticalAlign:'middle' }}>
        <svg width="7" height="4" viewBox="0 0 7 4" fill={sortKey===k&&sortDir==='asc'?'#93c5fd':'rgba(255,255,255,0.28)'}><path d="M3.5 0L7 4H0z" /></svg>
        <svg width="7" height="4" viewBox="0 0 7 4" fill={sortKey===k&&sortDir==='desc'?'#93c5fd':'rgba(255,255,255,0.28)'}><path d="M3.5 4L0 0H7z" /></svg>
      </span>
    )
  }

  const cols = [
    { key:'stt',             label:'STT',      sortable:false, minWidth:48  },
    { key:'tieu_de',         label:'Tiêu đề',  sortable:true,  minWidth:220 },
    { key:'cap_do',          label:'Cấp độ',   sortable:true,  minWidth:80  },
    { key:'danh_muc',        label:'Danh mục', sortable:true,  minWidth:140 },
    { key:'tong_bai_tap',    label:'Bài tập',  sortable:true,  minWidth:80  },
    { key:'thu_tu_hien_thi', label:'Thứ tự',   sortable:true,  minWidth:80  },
    { key:'created_at',      label:'Ngày tạo', sortable:true,  minWidth:120 },
    { key:'_action',         label:'Thao tác', sortable:false, minWidth:100 },
  ]

  return (
    <>
      <AlertContainer />
      {dialog}

      <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily:'DM Sans,sans-serif' }}>

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QUẢN LÝ NGỮ PHÁP</h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              Tổng <span className="font-semibold text-[#1e3a5f]">{list.length}</span> bài học
              {filtered.length!==list.length && <> · đang lọc <span className="font-semibold text-[#1e3a5f]">{filtered.length}</span> kết quả</>}
            </p>
          </div>
          <button onClick={()=>setShowAdd(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
            style={{ background:'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
            <Sparkles size={15} /> Tạo bài AI
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input type="text" value={search} onChange={e=>{ setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm theo tiêu đề, danh mục..."
              className="w-full pl-9 pr-9 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white" />
            {search && (
              <button onClick={()=>{ setSearch(''); setPage(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
          <select value={filterLevel} onChange={e=>{ setFilterLevel(e.target.value); setPage(1) }}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 bg-white">
            <option value="">Tất cả cấp độ</option>
            {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterCategory} onChange={e=>{ setFilterCategory(e.target.value); setPage(1) }}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 bg-white">
            <option value="">Tất cả danh mục</option>
            {categories.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={`${sortKey}|${sortDir}`}
            onChange={e=>{ const[k,d]=e.target.value.split('|'); setSortKey(k); setSortDir(d as 'asc'|'desc'); setPage(1) }}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 bg-white">
            <option value="thu_tu_hien_thi|asc">Thứ tự tăng dần</option>
            <option value="thu_tu_hien_thi|desc">Thứ tự giảm dần</option>
            <option value="created_at|desc">Mới nhất trước</option>
            <option value="created_at|asc">Cũ nhất trước</option>
            <option value="tieu_de|asc">Tiêu đề A → Z</option>
            <option value="tong_bai_tap|desc">Nhiều bài tập nhất</option>
          </select>
          {(search||filterLevel||filterCategory) && (
            <button onClick={()=>{ setSearch(''); setFilterLevel(''); setFilterCategory(''); setPage(1) }}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm hover:border-red-300 hover:text-red-500 transition-colors bg-white">
              Xoá lọc
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden shadow-md" style={{ border:'2px solid #b0bfd4' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse:'separate',borderSpacing:0 }}>
              <thead>
                <tr>
                  {cols.map((col,ci)=>(
                    <th key={col.key} onClick={()=>col.sortable&&toggleSort(col.key)}
                      style={{ ...TH, cursor:col.sortable?'pointer':'default', borderRight:ci<cols.length-1?'1px solid rgba(255,255,255,0.12)':'none', minWidth:col.minWidth }}>
                      <span style={{ display:'inline-flex',alignItems:'center' }}>{col.label}{col.sortable&&<SortIcon k={col.key} />}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length===0 ? (
                  <tr>
                    <td colSpan={cols.length} className="text-center py-16 text-gray-400 bg-white">
                      <BookOpen className="mx-auto mb-2 text-gray-300" size={36} strokeWidth={1.5} />
                      Không tìm thấy bài học nào
                    </td>
                  </tr>
                ) : paginated.map((lesson,i)=>{
                  const even = i%2===0
                  return (
                    <tr key={lesson.id as string}
                      style={{ background:even?'#f1f5f9':'#ffffff',transition:'background 0.1s' }}
                      className="hover:!bg-blue-50 group">
                      <td style={{ borderBottom:CELL_BORDER,borderRight:CELL_BORDER,padding:'12px 16px',textAlign:'center' }}>
                        <span className="text-sm font-mono font-semibold text-gray-800">{(page-1)*PAGE_SIZE+i+1}</span>
                      </td>
                      <td style={{ borderBottom:CELL_BORDER,borderRight:CELL_BORDER,padding:'12px 16px' }}>
                        <span className="font-semibold text-gray-800 text-[15px]">{lesson.tieu_de as string}</span>
                        {!!lesson.mo_ta && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{String(lesson.mo_ta)}</div>}
                      </td>
                      <td style={{ borderBottom:CELL_BORDER,borderRight:CELL_BORDER,padding:'12px 16px',textAlign:'center' }}>
                        <span className={`text-sm font-bold font-mono px-2.5 py-1 rounded ${LEVEL_COLOR[lesson.cap_do as string]||'bg-gray-100 text-gray-600'}`}>
                          {lesson.cap_do as string}
                        </span>
                      </td>
                      <td style={{ borderBottom:CELL_BORDER,borderRight:CELL_BORDER,padding:'12px 16px' }}>
                        <span className="px-2.5 py-1 rounded-full text-[13px] font-semibold bg-blue-100 text-blue-700">
                          {(lesson.danh_muc as string)||'—'}
                        </span>
                      </td>
                      <td style={{ borderBottom:CELL_BORDER,borderRight:CELL_BORDER,padding:'12px 16px',textAlign:'center' }}>
                        <span className="text-sm font-semibold text-[#1e3a5f]">{(lesson.tong_bai_tap as number)??0}</span>
                      </td>
                      <td style={{ borderBottom:CELL_BORDER,borderRight:CELL_BORDER,padding:'12px 16px',textAlign:'center' }}>
                        <span className="font-mono text-sm text-gray-800">{lesson.thu_tu_hien_thi as number}</span>
                      </td>
                      <td style={{ borderBottom:CELL_BORDER,borderRight:CELL_BORDER,padding:'12px 16px' }}>
                        <span className="text-sm text-gray-800">
                          {lesson.created_at ? new Date(lesson.created_at as string).toLocaleDateString('vi-VN') : '—'}
                        </span>
                      </td>
                      <td style={{ borderBottom:CELL_BORDER,padding:'12px 16px' }}>
                        <div className="flex items-center gap-1.5">
                          <button onClick={()=>setSelected(lesson)} title="Xem / Chỉnh sửa"
                            className="p-2 rounded-lg text-[#1e3a5f] border border-[#1e3a5f]/20 hover:bg-[#1e3a5f] hover:text-white transition-all">
                            <Pencil size={15} />
                          </button>
                          <button onClick={()=>handleDeleteRow(lesson)} title="Xóa"
                            className="p-2 rounded-lg text-red-400 border border-red-200 hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 flex items-center justify-between text-sm text-gray-500"
            style={{ background:'#f8fafc',borderTop:'2px solid #c2cfe0' }}>
            <span>Tổng <strong className="text-[#1e3a5f]">{filtered.length}</strong> bài học{filtered.length!==list.length&&<> · lọc từ {list.length}</>}</span>
            {totalPages>1 && (
              <div className="flex items-center gap-1">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                  <ChevronLeft size={15} />
                </button>
                {Array.from({length:totalPages},(_,i)=>i+1)
                  .filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1)
                  .reduce<(number|'...')[]>((acc,p,idx,arr)=>{ if(idx>0&&typeof arr[idx-1]==='number'&&(p as number)-(arr[idx-1] as number)>1) acc.push('...'); acc.push(p); return acc },[])
                  .map((p,idx)=>p==='...'
                    ?<span key={`e${idx}`} className="px-1 text-gray-400 text-sm">…</span>
                    :<button key={p} onClick={()=>setPage(p as number)}
                        className="w-8 h-8 rounded-lg text-sm font-semibold transition-colors"
                        style={{ background:page===p?'linear-gradient(135deg,#0f2847,#1e3a5f)':undefined, color:page===p?'#fff':'#374151', border:page===p?'none':'1px solid #e5e7eb' }}>
                        {p}
                      </button>
                  )}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
            <span className="text-xs text-gray-400">Trang {page}/{totalPages} · {PAGE_SIZE} bài/trang</span>
          </div>
        </div>

        {showAdd && <AddModal onClose={()=>!generating&&setShowAdd(false)} onGenerate={handleGenerate} generating={generating} />}
        {selected && (
          <LessonModal lesson={selected} onClose={()=>setSelected(null)} onSave={handleSave} onDelete={handleDelete} categories={categories} />
        )}
      </div>
    </>
  )
}