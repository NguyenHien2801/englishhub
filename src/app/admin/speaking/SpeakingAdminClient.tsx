'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Pencil, X, Search, Mic, CheckCircle, EyeOff, Eye } from 'lucide-react'

// ═══════════════════════════════════════════════════════
//  ALERT / TOAST
// ═══════════════════════════════════════════════════════
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
  success: { chip: 'Thành công',    btnLabel: 'Đóng',    iconPath: <><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></> },
  error:   { chip: 'Lỗi hệ thống', btnLabel: 'Đã hiểu', iconPath: <><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></> },
  warning: { chip: 'Cảnh báo',     btnLabel: 'Được rồi', iconPath: <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /> },
  info:    { chip: 'Thông tin',    btnLabel: 'Đóng',     iconPath: <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
}
function AlertContainer() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  _setAlerts = setAlerts
  useEffect(() => {
    if (alerts.length === 0) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAlerts(p => p.slice(1)) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [alerts.length])
  if (alerts.length === 0) return null
  const cur = alerts[0]
  const meta = ALERT_META[cur.type]
  const dismiss = () => setAlerts(p => p.slice(1))
  return (
    <div onClick={dismiss} style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(10,20,40,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,animation:'ahOverlayIn 0.18s ease' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%',maxWidth:400,background:'#fff',borderRadius:16,border:`2px solid ${ACCENT}`,overflow:'hidden',position:'relative',boxShadow:'0 16px 48px rgba(10,20,50,0.18)',animation:'ahModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',fontFamily:'DM Sans,sans-serif' }}>
        <button onClick={dismiss} style={{ position:'absolute',top:12,right:12,width:28,height:28,borderRadius:8,border:'none',background:'rgba(30,58,95,0.08)',color:ACCENT,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
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
        <div style={{ padding:'12px 24px 20px',display:'flex',justifyContent:'flex-end',borderTop:`1px solid rgba(30,58,95,0.12)` }}>
          <button onClick={dismiss} style={{ padding:'9px 22px',borderRadius:10,border:'none',background:ACCENT,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>{meta.btnLabel}</button>
        </div>
        {alerts.length>1 && <div style={{ position:'absolute',top:10,right:46,background:ACCENT,color:'#fff',fontSize:10,fontWeight:700,borderRadius:20,padding:'2px 8px' }}>+{alerts.length-1}</div>}
      </div>
      <style>{`@keyframes ahOverlayIn{from{opacity:0}to{opacity:1}}@keyframes ahModalIn{from{opacity:0;transform:scale(0.88) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
//  CONFIRM DIALOG
// ═══════════════════════════════════════════════════════
type ConfirmOptions = { title: string; message?: string; confirmText?: string; cancelText?: string }
type ConfirmState   = ConfirmOptions & { resolve: (v: boolean) => void }
function ConfirmDialog({ state, onResolve }: { state: ConfirmState; onResolve: (v: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key==='Escape') onResolve(false); if (e.key==='Enter') onResolve(true) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onResolve])
  return (
    <div ref={ref} onClick={e=>{ if(e.target===ref.current) onResolve(false) }} style={{ position:'fixed',inset:0,zIndex:9998,background:'rgba(10,20,40,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,animation:'cfOverlayIn 0.18s ease' }}>
      <div style={{ width:'100%',maxWidth:400,background:'#fff',borderRadius:16,border:`2px solid ${ACCENT}`,overflow:'hidden',boxShadow:'0 16px 48px rgba(0,0,0,0.16)',animation:'cfPopIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',fontFamily:'DM Sans,sans-serif' }}>
        <div style={{ padding:'24px 24px 20px',display:'flex',gap:14,alignItems:'flex-start' }}>
          <div style={{ width:42,height:42,borderRadius:10,flexShrink:0,background:'rgba(30,58,95,0.08)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2}><path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </div>
          <div style={{ flex:1,minWidth:0,paddingTop:2 }}>
            <div style={{ fontSize:16,fontWeight:700,color:'#111827',lineHeight:1.3 }}>{state.title}</div>
            {state.message && <p style={{ fontSize:13,color:'#374151',lineHeight:1.6,margin:'6px 0 0' }}>{state.message}</p>}
          </div>
        </div>
        <div style={{ padding:'12px 24px 20px',display:'flex',gap:10,justifyContent:'flex-end',borderTop:`1px solid rgba(30,58,95,0.12)` }}>
          <button onClick={()=>onResolve(false)} style={{ padding:'9px 20px',borderRadius:10,border:'1.5px solid rgba(30,58,95,0.25)',background:'#fff',color:'#374151',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>{state.cancelText??'Hủy'}</button>
          <button onClick={()=>onResolve(true)}  style={{ padding:'9px 22px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#0f2847,#1e3a5f)',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>{state.confirmText??'Xác nhận'}</button>
        </div>
      </div>
      <style>{`@keyframes cfOverlayIn{from{opacity:0}to{opacity:1}}@keyframes cfPopIn{from{opacity:0;transform:scale(0.88) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  )
}
function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null)
  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => new Promise(resolve => setState({ ...opts, resolve })), [])
  const handleResolve = useCallback((val: boolean) => { state?.resolve(val); setState(null) }, [state])
  const dialog = state ? <ConfirmDialog state={state} onResolve={handleResolve} /> : null
  return { confirm, dialog }
}

// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════
const LEVELS   = ['A1','A2','B1','B2','C1','C2']
const CERTS    = ['VSTEP','TOEIC','APTIS']
// So_phan theo từng chứng chỉ (Speaking)
const PARTS_BY_CERT: Record<string, { value: number; label: string }[]> = {
  VSTEP: [
    { value:1, label:'Phần 1 – Phát âm / Đọc to' },
    { value:2, label:'Phần 2 – Mô tả hình ảnh' },
    { value:3, label:'Phần 3 – Thuyết trình' },
  ],
  TOEIC: [
    { value:1, label:'Part 1 – Read aloud' },
    { value:2, label:'Part 2 – Describe a picture' },
    { value:3, label:'Part 3 – Respond to questions' },
    { value:4, label:'Part 4 – Respond with information' },
    { value:5, label:'Part 5 – Opinion' },
  ],
  APTIS: [
    { value:1, label:'Part 1 – Personal questions' },
    { value:2, label:'Part 2 – Monologue' },
    { value:3, label:'Part 3 – Conversation' },
    { value:4, label:'Part 4 – Discussion' },
  ],
}
const EMOJI_LIST = ['🎤','🗣️','💬','📢','🔊','🎙️','📝','🎯','💡','🏆']

const CERT_COLOR: Record<string,string> = {
  VSTEP:'bg-blue-100 text-blue-700', TOEIC:'bg-purple-100 text-purple-700', APTIS:'bg-pink-100 text-pink-700',
}
const LEVEL_COLOR: Record<string,string> = {
  A1:'bg-[#ede9fe] text-[#7c3aed]', A2:'bg-[#e0f2fe] text-[#0369a1]',
  B1:'bg-[#dcfce7] text-[#15803d]', B2:'bg-[#fef9c3] text-[#a16207]',
  C1:'bg-[#fee2e2] text-[#dc2626]', C2:'bg-[#fae8ff] text-[#9333ea]',
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]/60 transition-colors bg-white'
const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5'
const filterSelectCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none bg-white text-gray-700 cursor-pointer'

type Task = Record<string, unknown>

// ═══════════════════════════════════════════════════════
//  TASK FORM
// ═══════════════════════════════════════════════════════
type TaskForm = {
  tieu_de: string
  bieu_tuong: string
  loai_chung_chi: string
  cap_do: string
  so_phan: number
  noi_dung: string        // đề bài / prompt cho học viên
  huong_dan: string       // hướng dẫn trả lời
  thong_tin_ky_thi: string
  thoi_gian_chuan_bi: number   // giây chuẩn bị
  thoi_gian_tra_loi: number    // giây trả lời
  da_kiem_duyet: boolean
  dang_hoat_dong: boolean
}
const EMPTY_FORM: TaskForm = {
  tieu_de: '',
  bieu_tuong: '🎤',
  loai_chung_chi: 'VSTEP',
  cap_do: 'B1',
  so_phan: 1,
  noi_dung: '',
  huong_dan: '',
  thong_tin_ky_thi: '',
  thoi_gian_chuan_bi: 30,
  thoi_gian_tra_loi: 60,
  da_kiem_duyet: false,
  dang_hoat_dong: true,
}

// ═══════════════════════════════════════════════════════
//  TASK FORM MODAL
// ═══════════════════════════════════════════════════════
function TaskFormModal({
  mode, initial, editId, onClose, onSaved,
}: {
  mode: 'add'|'edit'
  initial: TaskForm
  editId?: string | null
  onClose: () => void
  onSaved: (t: Task) => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState<TaskForm>(initial)
  const [saving, setSaving] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key==='Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set<K extends keyof TaskForm>(k: K, v: TaskForm[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  // Reset so_phan về 1 khi đổi cert
  function setCert(v: string) {
    setForm(f => ({ ...f, loai_chung_chi: v, so_phan: 1 }))
  }

  async function handleSave() {
    if (!form.tieu_de.trim()) { showToast('warning','Vui lòng nhập tiêu đề'); return }
    if (!form.noi_dung.trim()) { showToast('warning','Vui lòng nhập nội dung / đề bài'); return }
    setSaving(true)

  const payload = {
  tieu_de:                 form.tieu_de.trim(),
  bieu_tuong:              form.bieu_tuong,
  loai_chung_chi:          form.loai_chung_chi,
  cap_do:                  form.cap_do,
  loai_bai:                'respond_questions',
  noi_dung_de_bai:         form.noi_dung.trim(),
  huong_dan:               form.huong_dan.trim(),
  thong_tin_ky_thi:        form.thong_tin_ky_thi.trim(),
  thoi_gian_chuan_bi_giay: form.thoi_gian_chuan_bi,
  thoi_gian_tra_loi_giay:  form.thoi_gian_tra_loi,
  dang_hoat_dong:          form.dang_hoat_dong,
  }


    if (mode === 'add') {
      const { data, error } = await supabase.from('BaiLuyenNoi').insert(payload).select().single()
      setSaving(false)
      if (error) { showToast('error','Thêm thất bại', error.message); return }
      showToast('success','Đã thêm bài nói mới')
      onSaved(data as Task)
    } else {
      const { data, error } = await supabase.from('BaiLuyenNoi').update(payload).eq('id', editId!).select().single()
      setSaving(false)
      if (error) { showToast('error','Cập nhật thất bại', error.message); return }
      showToast('success','Đã cập nhật bài nói')
      onSaved(data as Task)
    }
    onClose()
  }

  const parts = PARTS_BY_CERT[form.loai_chung_chi] ?? []

  return (
    <div ref={overlayRef} onClick={e=>{ if(e.target===overlayRef.current) onClose() }}
      style={{ position:'fixed',inset:0,zIndex:10000,background:'rgba(10,20,40,0.6)',backdropFilter:'blur(5px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,animation:'pmOverlayIn 0.18s ease' }}>
      <div style={{ width:'100%',maxWidth:680,background:'#fff',borderRadius:20,border:`2px solid ${ACCENT}`,overflow:'hidden',boxShadow:'0 24px 64px rgba(10,20,50,0.22)',animation:'pmPopIn 0.26s cubic-bezier(0.34,1.56,0.64,1)',fontFamily:'DM Sans,sans-serif',display:'flex',flexDirection:'column',maxHeight:'92vh' }}>

        {/* Header */}
        <div style={{ padding:'18px 24px',background:'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:'rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              {mode==='add'
                ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}><path strokeLinecap="round" d="M12 4v16m8-8H4"/></svg>
                : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}><path strokeLinecap="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/></svg>
              }
            </div>
            <div>
              <div style={{ color:'#fff',fontWeight:700,fontSize:15 }}>{mode==='add' ? 'Thêm bài nói mới' : 'Chỉnh sửa bài nói'}</div>
              <div style={{ color:'rgba(255,255,255,0.55)',fontSize:12 }}>{mode==='add' ? 'Tạo bài luyện nói và thêm vào hệ thống' : `Đang sửa: ${form.tieu_de||'—'}`}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:8,border:'none',background:'rgba(255,255,255,0.12)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <X size={16}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto',flex:1,padding:'20px 24px',display:'flex',flexDirection:'column',gap:18 }}>

          {/* Emoji + tiêu đề */}
          <div style={{ display:'flex',gap:12,alignItems:'flex-end' }}>
            <div>
              <label className={labelCls}>Biểu tượng</label>
              <select value={form.bieu_tuong} onChange={e=>set('bieu_tuong',e.target.value)}
                style={{ border:'1px solid #d1d5db',borderRadius:10,padding:'8px 10px',fontSize:20,cursor:'pointer',background:'#fff',width:62,textAlign:'center' }}>
                {EMOJI_LIST.map(em=><option key={em} value={em}>{em}</option>)}
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label className={labelCls}>Tiêu đề <span style={{ color:'#ef4444' }}>*</span></label>
              <input value={form.tieu_de} onChange={e=>set('tieu_de',e.target.value)}
                placeholder="VD: Describe the image – VSTEP Part 2..." className={inputCls}/>
            </div>
          </div>

          {/* Chứng chỉ + cấp độ + phần */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 2fr',gap:12 }}>
            <div>
              <label className={labelCls}>Chứng chỉ</label>
              <select value={form.loai_chung_chi} onChange={e=>setCert(e.target.value)} className={inputCls}>
                {CERTS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Cấp độ</label>
              <select value={form.cap_do} onChange={e=>set('cap_do',e.target.value)} className={inputCls}>
                {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Phần thi</label>
              <select value={form.so_phan} onChange={e=>set('so_phan',Number(e.target.value))} className={inputCls}>
                {parts.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Thời gian */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label className={labelCls}>Thời gian chuẩn bị (giây)</label>
              <input type="number" min={0} max={120} step={5} value={form.thoi_gian_chuan_bi}
                onChange={e=>set('thoi_gian_chuan_bi',Number(e.target.value))} className={inputCls}/>
              <div style={{ fontSize:11,color:'#6b7280',marginTop:3 }}>{form.thoi_gian_chuan_bi}s chuẩn bị trước khi nói</div>
            </div>
            <div>
              <label className={labelCls}>Thời gian trả lời (giây)</label>
              <input type="number" min={10} max={600} step={5} value={form.thoi_gian_tra_loi}
                onChange={e=>set('thoi_gian_tra_loi',Number(e.target.value))} className={inputCls}/>
              <div style={{ fontSize:11,color:'#6b7280',marginTop:3 }}>{form.thoi_gian_tra_loi}s ghi âm trả lời</div>
            </div>
          </div>

          {/* Nội dung đề bài */}
          <div>
            <label className={labelCls}>Nội dung / Đề bài <span style={{ color:'#ef4444' }}>*</span></label>
            <textarea value={form.noi_dung} onChange={e=>set('noi_dung',e.target.value)}
              placeholder="Nhập câu hỏi hoặc chủ đề học viên cần nói về..."
              rows={5} className={inputCls} style={{ resize:'vertical',lineHeight:1.7 }}/>
          </div>

          {/* Hướng dẫn */}
          <div>
            <label className={labelCls}>Hướng dẫn trả lời (gợi ý cho học viên)</label>
            <textarea value={form.huong_dan} onChange={e=>set('huong_dan',e.target.value)}
              placeholder="VD: Hãy mô tả những gì bạn thấy trong ảnh theo thứ tự: vị trí, đối tượng, hoạt động..."
              rows={3} className={inputCls} style={{ resize:'vertical' }}/>
          </div>

          {/* Thông tin kỳ thi */}
          <div>
            <label className={labelCls}>Thông tin kỳ thi</label>
            <input value={form.thong_tin_ky_thi} onChange={e=>set('thong_tin_ky_thi',e.target.value)}
              placeholder="VD: VSTEP 2024 – Đề thi thử số 2..." className={inputCls}/>
          </div>

          {/* Toggles */}
          <div style={{ display:'flex',gap:16,padding:'14px 16px',borderRadius:12,background:'#f8fafc',border:'1px solid #c2cfe0' }}>
            {([
              { key:'da_kiem_duyet'  as const, label:'Đã kiểm duyệt', desc:'Bài nói được đánh dấu đã qua kiểm duyệt' },
              { key:'dang_hoat_dong' as const, label:'Đang hoạt động', desc:'Bài nói hiển thị với học viên' },
            ]).map(item => (
              <label key={item.key} style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer',flex:1 }}>
                <div onClick={()=>set(item.key, !form[item.key])}
                  style={{ width:40,height:22,borderRadius:11,background:form[item.key]?'#1e3a5f':'#d1d5db',transition:'background 0.2s',position:'relative',cursor:'pointer',flexShrink:0 }}>
                  <div style={{ position:'absolute',top:3,left:form[item.key]?19:3,width:16,height:16,borderRadius:8,background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
                </div>
                <div>
                  <div style={{ fontSize:13,fontWeight:600,color:'#111827' }}>{item.label}</div>
                  <div style={{ fontSize:11,color:'#6b7280' }}>{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 24px',borderTop:'1px solid rgba(30,58,95,0.12)',display:'flex',justifyContent:'flex-end',gap:10,flexShrink:0,background:'#fafbfc' }}>
          <button onClick={onClose}
            style={{ padding:'10px 22px',borderRadius:10,border:'1.5px solid rgba(30,58,95,0.25)',background:'#fff',color:'#374151',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif' }}>
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding:'10px 26px',borderRadius:10,border:'none',background:saving?'#94a3b8':'linear-gradient(135deg,#0f2847,#1e3a5f)',color:'#fff',fontWeight:700,fontSize:13,cursor:saving?'not-allowed':'pointer',fontFamily:'DM Sans,sans-serif',display:'flex',alignItems:'center',gap:6 }}>
            {saving
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity={0.3}/><path d="M12 3a9 9 0 019 9"/></svg> Đang lưu...</>
              : mode==='add' ? '+ Thêm bài nói' : '✓ Lưu thay đổi'
            }
          </button>
        </div>
      </div>
      <style>{`
        @keyframes pmOverlayIn{from{opacity:0}to{opacity:1}}
        @keyframes pmPopIn{from{opacity:0;transform:scale(0.9) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════
export default function SpeakingAdminClient({ tasks = [] }: { tasks?: Task[] }) {
  const { confirm, dialog } = useConfirm()
  const supabase = createClient()

  const [list, setList]         = useState<Task[]>(tasks)
  const [selected, setSelected] = useState<Task | null>(null)
  const [search, setSearch]     = useState('')
  const [filterCert, setFilterCert]   = useState('')
  const [filterLevel, setFilterLevel] = useState('')

  const [modalMode, setModalMode]       = useState<'add'|'edit'|null>(null)
  const [modalInitial, setModalInitial] = useState<TaskForm>(EMPTY_FORM)
  const [editId, setEditId]             = useState<string | null>(null)

  // ── Filters ──
  const filtered = (list ?? []).filter(t =>
    (!filterCert  || t.loai_chung_chi === filterCert) &&
    (!filterLevel || t.cap_do         === filterLevel) &&
    (!search      || (t.tieu_de as string||'').toLowerCase().includes(search.toLowerCase()))
  )

  // ── Modal helpers ──
  function openAdd() {
    setEditId(null)
    setModalInitial(EMPTY_FORM)
    setModalMode('add')
  }
  function openEdit(t: Task) {
    setEditId(t.id as string)
    setModalInitial({
      tieu_de:            (t.tieu_de as string) || '',
      bieu_tuong:         (t.bieu_tuong as string) || '🎤',
      loai_chung_chi:     (t.loai_chung_chi as string) || 'VSTEP',
      cap_do:             (t.cap_do as string) || 'B1',
      so_phan:            (t.so_phan as number) || 1,
      noi_dung:           (t.noi_dung_de_bai as string) || '',
      huong_dan:          (t.huong_dan as string) || '',
      thong_tin_ky_thi:   (t.thong_tin_ky_thi as string) || '',
      thoi_gian_chuan_bi: (t.thoi_gian_chuan_bi_giay as number) || 30,
      thoi_gian_tra_loi:  (t.thoi_gian_tra_loi_giay as number) || 60,
      da_kiem_duyet:      !!(t.da_kiem_duyet),
      dang_hoat_dong:     !!(t.dang_hoat_dong),
    })
    setModalMode('edit')
  }
  function handleSaved(saved: Task) {
    if (modalMode === 'add') {
      setList(prev => [saved, ...prev])
      setSelected(saved)
    } else {
      setList(prev => prev.map(x => x.id===saved.id ? saved : x))
      setSelected(saved)
    }
  }

  // ── Actions ──
  async function toggleApprove(t: Task) {
    const val = !t.da_kiem_duyet
    const { error } = await supabase.from('BaiLuyenNoi').update({ thu_tu: t.thu_tu as number }).eq('id', t.id as string)
    if (error) { showToast('error','Cập nhật thất bại',error.message); return }
    setList(prev => prev.map(x => x.id===t.id ? {...x,da_kiem_duyet:val} : x))
    if (selected?.id===t.id) setSelected(s => s ? {...s,da_kiem_duyet:val} : s)
    showToast('success', val ? 'Đã duyệt bài' : 'Đã bỏ duyệt')
  }
  async function toggleActive(t: Task) {
    const val = !t.dang_hoat_dong
    const { error } = await supabase.from('BaiLuyenNoi').update({ dang_hoat_dong: val }).eq('id', t.id as string)
    if (error) { showToast('error','Cập nhật thất bại',error.message); return }
    setList(prev => prev.map(x => x.id===t.id ? {...x,dang_hoat_dong:val} : x))
    if (selected?.id===t.id) setSelected(s => s ? {...s,dang_hoat_dong:val} : s)
    showToast('success', val ? 'Đã hiện bài' : 'Đã ẩn bài')
  }
  async function deleteTask(id: string) {
    const item = list.find(x => x.id===id)
    const ok = await confirm({
      title: 'Xóa bài nói này?',
      message: item ? `"${item.tieu_de}" sẽ bị xóa vĩnh viễn, không thể khôi phục.` : undefined,
      confirmText: '🗑 Xóa vĩnh viễn', cancelText: 'Giữ lại',
    })
    if (!ok) return
    await supabase.from('KetQuaLuyenNoi').delete().eq('bai_luyen_noi_id', id)
    const { error } = await supabase.from('BaiLuyenNoi').delete().eq('id', id)
    if (error) { showToast('error','Xóa thất bại',error.message); return }
    setList(prev => prev.filter(x => x.id!==id))
    if (selected?.id===id) setSelected(null)
    showToast('success','Đã xóa bài nói')
  }

  // ── Stats ──
  const totalActive   = list.filter(t => t.dang_hoat_dong).length
  const totalApproved = list.filter(t => t.da_kiem_duyet).length
  const totalVSTEP    = list.filter(t => t.loai_chung_chi==='VSTEP').length
  const totalTOEIC    = list.filter(t => t.loai_chung_chi==='TOEIC').length

  return (
    <>
      <AlertContainer />
      {dialog}

      {modalMode && (
        <TaskFormModal
          mode={modalMode}
          initial={modalInitial}
          editId={editId}
          onClose={() => setModalMode(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily:'DM Sans,sans-serif' }}>

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">QUẢN LÝ BÀI NÓI</h1>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background:'linear-gradient(135deg,#0f2847,#1e3a5f)', boxShadow:'0 4px 14px rgba(15,40,71,0.3)' }}>
            <Plus size={16}/> Thêm bài nói
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            { label:'Tổng bài nói',   value:list.length,    color:'#1e3a5f',
              icon:<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg> },
            { label:'Đang hoạt động', value:totalActive,    color:'#059669',
              icon:<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
            { label:'Đã kiểm duyệt',  value:totalApproved,  color:'#d97706',
              icon:<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg> },
            { label:'Bài VSTEP',      value:totalVSTEP,     color:'#2563eb',
              icon:<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"/></svg> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="rounded-2xl p-4 flex items-center gap-3"
              style={{ border:`2px solid ${color}30`, background:`linear-gradient(135deg,#fff 60%,${color}0d 100%)` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:`${color}15`, color, border:`1.5px solid ${color}25` }}>{icon}</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{value.toLocaleString('vi-VN')}</div>
                <div className="text-sm text-gray-800 mt-1">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Layout: sidebar + detail */}
        <div className="grid lg:grid-cols-4 gap-5">

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl overflow-hidden shadow-md" style={{ border:'2px solid #b0bfd4' }}>
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ background:'linear-gradient(180deg,#2d4e7a 0%,#1e3a5f 100%)',borderBottom:'2px solid rgba(147,197,253,0.2)' }}>
                <span style={{ color:'rgba(226,232,240,0.82)',fontSize:15,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em' }}>Danh sách bài nói</span>
                <button onClick={openAdd} title="Thêm bài nói mới"
                  style={{ width:28,height:28,borderRadius:8,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Plus size={14}/>
                </button>
              </div>

              {/* Filters */}
              <div className="px-3 py-2.5 space-y-2" style={{ background:'#f8fafc',borderBottom:'1px solid #c2cfe0' }}>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm bài nói..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]/50 bg-white"/>
                </div>
                <div className="flex gap-1.5">
                  <select value={filterCert}  onChange={e=>setFilterCert(e.target.value)}  className={`${filterSelectCls} flex-1`}>
                    <option value="">Tất cả</option>
                    {CERTS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filterLevel} onChange={e=>setFilterLevel(e.target.value)} className={`${filterSelectCls} flex-1`}>
                    <option value="">Cấp độ</option>
                    {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                {(filterCert||filterLevel||search) && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#1e3a5f] font-semibold">{filtered.length}/{list.length} bài</span>
                    <button onClick={()=>{setFilterCert('');setFilterLevel('');setSearch('')}} className="text-xs text-red-400 hover:text-red-600 font-semibold">Xóa lọc</button>
                  </div>
                )}
              </div>

              {/* List */}
              <div className="divide-y divide-[#c2cfe0] max-h-[60vh] overflow-y-auto">
                {filtered.length===0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">Không tìm thấy bài nói nào</div>
                )}
                {filtered.map(t => {
                  const isSel = selected?.id===t.id
                  return (
                    <div key={t.id as string} onClick={()=>setSelected(t)}
                      className="group cursor-pointer transition-colors hover:bg-blue-50"
                      style={{ padding:'12px 14px',background:isSel?'#eff6ff':undefined,borderLeft:isSel?'3px solid #1e3a5f':'3px solid transparent',opacity:t.dang_hoat_dong?1:0.55 }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="text-lg flex-shrink-0 mt-0.5">{(t.bieu_tuong as string)||'🎤'}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-800 text-sm leading-snug truncate">{t.tieu_de as string}</div>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CERT_COLOR[t.loai_chung_chi as string]||'bg-gray-100 text-gray-500'}`}>{t.loai_chung_chi as string}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${LEVEL_COLOR[t.cap_do as string]||'bg-gray-100 text-gray-500'}`}>{t.cap_do as string}</span>
                              {!!t.so_phan && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Phần {t.so_phan as number}</span>}
                              {!!t.da_kiem_duyet && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">✓</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={e=>{e.stopPropagation();openEdit(t)}}
                            className="p-1 rounded-lg text-blue-400 border border-blue-200 hover:bg-blue-500 hover:text-white transition-all">
                            <Pencil size={13}/>
                          </button>
                          <button onClick={e=>{e.stopPropagation();deleteTask(t.id as string)}}
                            className="p-1 rounded-lg text-red-400 border border-red-200 hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3">
            {selected ? (
              <div className="rounded-2xl overflow-hidden shadow-md" style={{ border:'2px solid #b0bfd4' }}>
                {/* Panel header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ background:'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{(selected.bieu_tuong as string)||'🎤'}</span>
                    <div>
                      <div className="text-white font-bold text-base">{selected.tieu_de as string}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${CERT_COLOR[selected.loai_chung_chi as string]||'bg-gray-100 text-gray-500'}`}>{selected.loai_chung_chi as string}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${LEVEL_COLOR[selected.cap_do as string]||'bg-gray-100 text-gray-500'}`}>{selected.cap_do as string}</span>
                        {!!selected.so_phan && <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-blue-200 font-medium">Phần {selected.so_phan as number}</span>}
                        {!!selected.da_kiem_duyet  && <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">✓ Đã duyệt</span>}
                        {!selected.dang_hoat_dong && <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-600">Đang ẩn</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <button onClick={()=>openEdit(selected)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background:'rgba(255,255,255,0.15)',color:'#fff',border:'1px solid rgba(255,255,255,0.25)' }}>
                      <Pencil size={14}/> Sửa
                    </button>
                    <button onClick={()=>toggleActive(selected)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background:selected.dang_hoat_dong?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.12)', color:selected.dang_hoat_dong?'#fca5a5':'#fff', border:`1px solid ${selected.dang_hoat_dong?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.2)'}` }}>
                      {selected.dang_hoat_dong?<><EyeOff size={14}/> Ẩn bài</>:<><Eye size={14}/> Hiện bài</>}
                    </button>
                    <button onClick={()=>deleteTask(selected.id as string)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background:'rgba(239,68,68,0.15)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.3)' }}>
                      <Trash2 size={14}/> Xóa
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-0" style={{ borderBottom:'1px solid #c2cfe0' }}>
                  {[
                    { label:'Phần thi',         value: `Phần ${selected.so_phan ?? '—'}` },
                    { label:'T.gian chuẩn bị',  value: `${selected.thoi_gian_chuan_bi_giay ?? 0}s` },
                    { label:'T.gian trả lời',   value: `${selected.thoi_gian_tra_loi_giay ?? 0}s` },
                    { label:'Lượt luyện',       value: (selected.luot_lam as number||0).toLocaleString('vi-VN') },
                  ].map((s,i) => (
                    <div key={s.label} style={{ padding:'14px 16px',textAlign:'center',borderRight:i<3?'1px solid #c2cfe0':'none',background:'#f8fafc' }}>
                      <div className="text-lg font-bold text-gray-900">{s.value}</div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-semibold">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Body */}
                <div className="p-5 space-y-5">
                  {!!selected.thong_tin_ky_thi && (
                    <div className="p-3 rounded-xl text-sm text-gray-700" style={{ background:'#fffbeb',border:'1px solid #fde68a' }}>
                      📋 {selected.thong_tin_ky_thi as string}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Đề bài / Câu hỏi</div>
                    <div className="p-4 rounded-xl text-sm text-gray-800 leading-relaxed whitespace-pre-wrap"
                      style={{ background:'#f1f5f9',border:'1px solid #c2cfe0' }}>
                      {selected.noi_dung_de_bai as string}
                    </div>
                  </div>
                  {!!selected.huong_dan && (
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Hướng dẫn trả lời</div>
                      <div className="p-4 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                        style={{ background:'#fffbeb',border:'1px solid #fde68a' }}>
                        💡 {selected.huong_dan as string}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md flex flex-col items-center justify-center py-20 text-center"
                style={{ border:'2px solid #b0bfd4' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background:'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                  <Mic size={32} color="white" strokeWidth={1.8}/>
                </div>
                <div className="font-semibold text-gray-700 text-base">Chọn bài nói bên trái để xem chi tiết</div>
                <div className="text-sm text-gray-500 mt-1">Dữ liệu từ bảng BaiLuyenNoi</div>
                <button onClick={openAdd}
                  className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background:'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                  <Plus size={15}/> Thêm bài nói đầu tiên
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  )
}