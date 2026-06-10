'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Pencil, X, Search, BookOpen, CheckCircle, EyeOff, Eye } from 'lucide-react'

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
  success: { chip: 'Thành công',   btnLabel: 'Đóng',     iconPath: <><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></> },
  error:   { chip: 'Lỗi hệ thống', btnLabel: 'Đã hiểu',  iconPath: <><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></> },
  warning: { chip: 'Cảnh báo',    btnLabel: 'Được rồi',  iconPath: <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /> },
  info:    { chip: 'Thông tin',   btnLabel: 'Đóng',      iconPath: <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
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
const LEVELS    = ['A1','A2','B1','B2','C1','C2']
const CERTS     = ['VSTEP','TOEIC','APTIS']
const LOAI_BAI  = ['short_passage','long_passage','double_passage','article']
const EMOJI_LIST = ['📄','📝','📖','📚','🗞️','📰','📜','🔖','✍️','💬']

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
function cleanText(s: string) {
  return s?.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim() ?? ''
}
const filterSelectCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none bg-white text-gray-700 cursor-pointer'

type Passage  = Record<string, unknown>
type Question = Record<string, unknown>

// ═══════════════════════════════════════════════════════
//  PASSAGE FORM DATA
// ═══════════════════════════════════════════════════════
type PassageForm = {
  tieu_de: string
  bieu_tuong: string
  loai_chung_chi: string
  cap_do: string
  loai_bai: string
  noi_dung: string
  mo_ta: string
  thong_tin_ky_thi: string
  so_cau_hoi: number
  thoi_gian_giay: number
  da_kiem_duyet: boolean
  dang_hoat_dong: boolean
}

const EMPTY_FORM: PassageForm = {
  tieu_de: '',
  bieu_tuong: '📄',
  loai_chung_chi: 'VSTEP',
  cap_do: 'B1',
  loai_bai: 'short_passage',
  noi_dung: '',
  mo_ta: '',
  thong_tin_ky_thi: '',
  so_cau_hoi: 5,
  thoi_gian_giay: 600,
  da_kiem_duyet: false,
  dang_hoat_dong: true,
}

// ═══════════════════════════════════════════════════════
//  PASSAGE FORM MODAL
// ═══════════════════════════════════════════════════════
function PassageFormModal({
  mode,
  initial,
  editId,
  onClose,
  onSaved,
}: {
  mode: 'add' | 'edit'
  initial: PassageForm
  editId?: string | null
  onClose: () => void
  onSaved: (p: Passage) => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState<PassageForm>(initial)
  const [saving, setSaving] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set<K extends keyof PassageForm>(k: K, v: PassageForm[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.tieu_de.trim())  { showToast('warning','Vui lòng nhập tiêu đề'); return }
    if (!form.noi_dung.trim()) { showToast('warning','Vui lòng nhập nội dung bài đọc'); return }
    setSaving(true)

    const payload = {
      tieu_de:          form.tieu_de.trim(),
      bieu_tuong:       form.bieu_tuong,
      loai_chung_chi:   form.loai_chung_chi,
      cap_do:           form.cap_do,
      loai_bai:         form.loai_bai,
      noi_dung:         form.noi_dung.trim(),
      mo_ta:            form.mo_ta.trim(),
      thong_tin_ky_thi: form.thong_tin_ky_thi.trim(),
      so_cau_hoi:       form.so_cau_hoi,
      thoi_gian_giay:   form.thoi_gian_giay,
      da_kiem_duyet:    form.da_kiem_duyet,
      dang_hoat_dong:   form.dang_hoat_dong,
    }

    if (mode === 'add') {
      const { data, error } = await supabase.from('BaiDoc').insert(payload).select().single()
      setSaving(false)
      if (error) { showToast('error','Thêm thất bại', error.message); return }
      showToast('success','Đã thêm bài đọc mới')
      onSaved(data as Passage)
    } else {
      const { data, error } = await supabase.from('BaiDoc').update(payload).eq('id', editId!).select().single()
      setSaving(false)
      if (error) { showToast('error','Cập nhật thất bại', error.message); return }
      showToast('success','Đã cập nhật bài đọc')
      onSaved(data as Passage)
    }
    onClose()
  }

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{ position:'fixed',inset:0,zIndex:10000,background:'rgba(10,20,40,0.6)',backdropFilter:'blur(5px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,animation:'pmOverlayIn 0.18s ease' }}
    >
      <div style={{ width:'100%',maxWidth:680,background:'#fff',borderRadius:20,border:`2px solid ${ACCENT}`,overflow:'hidden',boxShadow:'0 24px 64px rgba(10,20,50,0.22)',animation:'pmPopIn 0.26s cubic-bezier(0.34,1.56,0.64,1)',fontFamily:'DM Sans,sans-serif',display:'flex',flexDirection:'column',maxHeight:'92vh' }}>

        {/* Modal header */}
        <div style={{ padding:'18px 24px',background:'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:'rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              {mode==='add'
                ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}><path strokeLinecap="round" d="M12 4v16m8-8H4"/></svg>
                : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}><path strokeLinecap="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/></svg>
              }
            </div>
            <div>
              <div style={{ color:'#fff',fontWeight:700,fontSize:15 }}>{mode==='add' ? 'Thêm bài đọc mới' : 'Chỉnh sửa bài đọc'}</div>
              <div style={{ color:'rgba(255,255,255,0.55)',fontSize:12 }}>{mode==='add' ? 'Tạo bài đọc và thêm vào hệ thống' : `Đang sửa: ${form.tieu_de||'—'}`}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:8,border:'none',background:'rgba(255,255,255,0.12)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <X size={16}/>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY:'auto',flex:1,padding:'20px 24px',display:'flex',flexDirection:'column',gap:18 }}>

          {/* Row 1: emoji + tiêu đề */}
          <div style={{ display:'flex',gap:12,alignItems:'flex-end' }}>
            <div>
              <label className={labelCls}>Biểu tượng</label>
              <select value={form.bieu_tuong} onChange={e=>set('bieu_tuong',e.target.value)}
                style={{ border:'1px solid #d1d5db',borderRadius:10,padding:'8px 10px',fontSize:20,cursor:'pointer',background:'#fff',width:62,textAlign:'center' }}>
                {EMOJI_LIST.map(em => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label className={labelCls}>Tiêu đề <span style={{ color:'#ef4444' }}>*</span></label>
              <input value={form.tieu_de} onChange={e=>set('tieu_de',e.target.value)}
                placeholder="Nhập tiêu đề bài đọc..." className={inputCls}/>
            </div>
          </div>

          {/* Row 2: chứng chỉ + cấp độ + loại bài */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
            <div>
              <label className={labelCls}>Chứng chỉ</label>
              <select value={form.loai_chung_chi} onChange={e=>set('loai_chung_chi',e.target.value)} className={inputCls}>
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
              <label className={labelCls}>Loại bài</label>
              <select value={form.loai_bai} onChange={e=>set('loai_bai',e.target.value)} className={inputCls}>
                {LOAI_BAI.map(lb=><option key={lb} value={lb}>{lb}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: số câu + thời gian */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label className={labelCls}>Số câu hỏi</label>
              <input type="number" min={1} max={50} value={form.so_cau_hoi}
                onChange={e=>set('so_cau_hoi',Number(e.target.value))} className={inputCls}/>
            </div>
            <div>
              <label className={labelCls}>Thời gian (giây)</label>
              <input type="number" min={60} max={7200} step={60} value={form.thoi_gian_giay}
                onChange={e=>set('thoi_gian_giay',Number(e.target.value))} className={inputCls}/>
              <div style={{ fontSize:11,color:'#6b7280',marginTop:3 }}>{Math.floor(form.thoi_gian_giay/60)} phút</div>
            </div>
          </div>

          {/* Nội dung */}
          <div>
            <label className={labelCls}>Nội dung bài đọc <span style={{ color:'#ef4444' }}>*</span></label>
            <textarea value={form.noi_dung} onChange={e=>set('noi_dung',e.target.value)}
              placeholder="Nhập nội dung bài đọc đầy đủ..."
              rows={8} className={inputCls} style={{ resize:'vertical',lineHeight:1.7 }}/>
          </div>

          {/* Mô tả */}
          <div>
            <label className={labelCls}>Mô tả (tóm tắt ngắn)</label>
            <textarea value={form.mo_ta} onChange={e=>set('mo_ta',e.target.value)}
              placeholder="Mô tả ngắn gọn về bài đọc..."
              rows={2} className={inputCls} style={{ resize:'vertical' }}/>
          </div>

          {/* Thông tin kỳ thi */}
          <div>
            <label className={labelCls}>Thông tin kỳ thi</label>
            <input value={form.thong_tin_ky_thi} onChange={e=>set('thong_tin_ky_thi',e.target.value)}
              placeholder="VD: VSTEP 2024 - Đề thi thử số 3..." className={inputCls}/>
          </div>

          {/* Toggles */}
          <div style={{ display:'flex',gap:16,padding:'14px 16px',borderRadius:12,background:'#f8fafc',border:'1px solid #c2cfe0' }}>
            {([
              { key:'da_kiem_duyet' as const,  label:'Đã kiểm duyệt', desc:'Bài đọc được đánh dấu đã qua kiểm duyệt' },
              { key:'dang_hoat_dong' as const, label:'Đang hoạt động', desc:'Bài đọc hiển thị với học viên' },
            ] as const).map(item => (
              <label key={item.key} style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer',flex:1 }}>
                <div
                  onClick={()=>set(item.key, !form[item.key])}
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
              : mode==='add' ? '+ Thêm bài đọc' : '✓ Lưu thay đổi'
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
export default function ReadingAdminClient({ passages }: { passages: Passage[] }) {
  const { confirm, dialog } = useConfirm()
  const supabase = createClient()

  // ── Bài đọc state ──
  const [list, setList]         = useState<Passage[]>(passages)
  const [selected, setSelected] = useState<Passage | null>(null)
  const [searchBD, setSearchBD] = useState('')
  const [filterCert, setFilterCert]   = useState('')
  const [filterLevel, setFilterLevel] = useState('')

  // ── Modal state ──
  const [modalMode, setModalMode]       = useState<'add'|'edit'|null>(null)
  const [modalInitial, setModalInitial] = useState<PassageForm>(EMPTY_FORM)
  const [editId, setEditId]             = useState<string | null>(null)

  // ── Ngân hàng state ──
  const [nhList, setNhList]         = useState<Question[]>([])
  const [nhLoaded, setNhLoaded]     = useState(false)
  const [nhSelected, setNhSelected] = useState<Question | null>(null)
  const [nhSearch, setNhSearch]     = useState('')
  const [nhCert, setNhCert]         = useState('')
  const [nhLevel, setNhLevel]       = useState('')

  const [tab, setTab] = useState<'baidoc'|'nganhang'>('baidoc')

  async function loadNganHang() {
    if (nhLoaded) return
    const { data } = await supabase.from('NganHangCauHoi').select('*').eq('ky_nang','DOC').order('created_at',{ascending:false})
    setNhList(data || [])
    setNhLoaded(true)
  }

  // ── Open modal helpers ──
  function openAdd() {
    setModalInitial(EMPTY_FORM)
    setModalMode('add')
  }

  function openEdit(p: Passage) {
    setEditId(p.id as string)
    setModalInitial({
      tieu_de:          (p.tieu_de as string) || '',
      bieu_tuong:       (p.bieu_tuong as string) || '📄',
      loai_chung_chi:   (p.loai_chung_chi as string) || 'VSTEP',
      cap_do:           (p.cap_do as string) || 'B1',
      loai_bai:         (p.loai_bai as string) || 'short_passage',
      noi_dung:         (p.noi_dung as string) || '',
      mo_ta:            (p.mo_ta as string) || '',
      thong_tin_ky_thi: (p.thong_tin_ky_thi as string) || '',
      so_cau_hoi:       (p.so_cau_hoi as number) || 5,
      thoi_gian_giay:   (p.thoi_gian_giay as number) || 600,
      da_kiem_duyet:    !!(p.da_kiem_duyet),
      dang_hoat_dong:   !!(p.dang_hoat_dong),
    })
    setModalMode('edit')
  }

  function handleSaved(saved: Passage) {
    if (modalMode === 'add') {
      setList(prev => [saved, ...prev])
      setSelected(saved)
    } else {
      setList(prev => prev.map(x => x.id===saved.id ? saved : x))
      setSelected(saved)
    }
  }

  // ── Filters ──
  const filtered = list.filter(p =>
    (!filterCert  || p.loai_chung_chi === filterCert) &&
    (!filterLevel || p.cap_do         === filterLevel) &&
    (!searchBD    || (p.tieu_de as string||'').toLowerCase().includes(searchBD.toLowerCase()))
  )
  const nhFiltered = nhList.filter(q =>
    (!nhCert  || q.loai_chung_chi === nhCert) &&
    (!nhLevel || q.cap_do         === nhLevel) &&
    (!nhSearch|| (q.noi_dung_cau_hoi as string||'').toLowerCase().includes(nhSearch.toLowerCase()))
  )

  // ── Actions ──
  async function toggleApprove(p: Passage) {
    const val = !p.da_kiem_duyet
    const { error } = await supabase.from('BaiDoc').update({ da_kiem_duyet: val }).eq('id', p.id as string)
    if (error) { showToast('error','Cập nhật thất bại',error.message); return }
    setList(prev => prev.map(x => x.id===p.id ? {...x,da_kiem_duyet:val} : x))
    if (selected?.id===p.id) setSelected(s => s ? {...s,da_kiem_duyet:val} : s)
    showToast('success', val ? 'Đã duyệt bài' : 'Đã bỏ duyệt')
  }

  async function toggleActive(p: Passage) {
    const val = !p.dang_hoat_dong
    const { error } = await supabase.from('BaiDoc').update({ dang_hoat_dong: val }).eq('id', p.id as string)
    if (error) { showToast('error','Cập nhật thất bại',error.message); return }
    setList(prev => prev.map(x => x.id===p.id ? {...x,dang_hoat_dong:val} : x))
    if (selected?.id===p.id) setSelected(s => s ? {...s,dang_hoat_dong:val} : s)
    showToast('success', val ? 'Đã hiện bài' : 'Đã ẩn bài')
  }

  async function deletePassage(id: string) {
    const item = list.find(x => x.id===id)
    const ok = await confirm({
      title: 'Xóa bài đọc này?',
      message: item ? `"${item.tieu_de}" và toàn bộ câu hỏi liên quan sẽ bị xóa vĩnh viễn.` : 'Bài đọc và câu hỏi liên quan sẽ bị xóa vĩnh viễn.',
      confirmText: '🗑 Xóa vĩnh viễn', cancelText: 'Giữ lại',
    })
    if (!ok) return
    await supabase.from('BaiDocCauHoi').delete().eq('bai_doc_id', id)
    await supabase.from('KetQuaDocHieu').delete().eq('bai_doc_id', id)
    const { error } = await supabase.from('BaiDoc').delete().eq('id', id)
    if (error) { showToast('error','Xóa thất bại',error.message); return }
    setList(prev => prev.filter(x => x.id!==id))
    if (selected?.id===id) setSelected(null)
    showToast('success','Đã xóa bài đọc')
  }

  async function deleteNH(id: string) {
    const q = nhList.find(x => x.id===id)
    const ok = await confirm({
      title: 'Xóa câu hỏi này?',
      message: q ? `Câu hỏi sẽ bị xóa vĩnh viễn, không thể khôi phục.` : undefined,
      confirmText: '🗑 Xóa', cancelText: 'Giữ lại',
    })
    if (!ok) return
    const { error } = await supabase.from('NganHangCauHoi').delete().eq('id', id)
    if (error) { showToast('error','Xóa thất bại',error.message); return }
    setNhList(prev => prev.filter(x => x.id!==id))
    if (nhSelected?.id===id) setNhSelected(null)
    showToast('success','Đã xóa câu hỏi')
  }

  // ── Stat helpers ──
  const totalActive   = list.filter(p => p.dang_hoat_dong).length
  const totalApproved = list.filter(p => p.da_kiem_duyet).length
  const totalVSTEP    = list.filter(p => p.loai_chung_chi==='VSTEP').length
  const totalTOEIC    = list.filter(p => p.loai_chung_chi==='TOEIC').length

  return (
    <>
      <AlertContainer />
      {dialog}

      {/* Passage Form Modal */}
      {modalMode && (
        <PassageFormModal
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
          <h1 className="text-2xl font-bold text-gray-900">QUẢN LÝ BÀI ĐỌC</h1>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background:'linear-gradient(135deg,#0f2847,#1e3a5f)', boxShadow:'0 4px 14px rgba(15,40,71,0.3)' }}>
            <Plus size={16}/> Thêm bài đọc
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            { label:'Tổng bài đọc',    value:list.length,    color:'#1e3a5f',
              icon:<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg> },
            { label:'Đang hoạt động',  value:totalActive,    color:'#059669',
              icon:<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
            { label:'Đã kiểm duyệt',   value:totalApproved,  color:'#d97706',
              icon:<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg> },
            { label:'Bài VSTEP',       value:totalVSTEP,     color:'#2563eb',
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

        {/* Tabs */}
        <div className="flex gap-1 mb-5" style={{ borderBottom:'2px solid #c2cfe0' }}>
          {([
            { key:'baidoc',   label:`📄 Bài đọc (${list.length})` },
            { key:'nganhang', label:`📋 Ngân hàng câu hỏi DOC${nhLoaded ? ` (${nhList.length})` : ''}` },
          ] as const).map(t => (
            <button key={t.key}
              onClick={() => { setTab(t.key); if (t.key==='nganhang') loadNganHang() }}
              className="px-5 py-2.5 text-sm font-semibold rounded-t-xl border-none cursor-pointer transition-all"
              style={{
                marginBottom:-2,
                background: tab===t.key ? 'linear-gradient(135deg,#0f2847,#1e3a5f)' : 'transparent',
                color: tab===t.key ? '#fff' : '#6b7280',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ TAB: BÀI ĐỌC ══ */}
        {tab==='baidoc' && (
          <div className="grid lg:grid-cols-4 gap-5">

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl overflow-hidden shadow-md" style={{ border:'2px solid #b0bfd4' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ background:'linear-gradient(180deg,#2d4e7a 0%,#1e3a5f 100%)',borderBottom:'2px solid rgba(147,197,253,0.2)' }}>
                  <span style={{ color:'rgba(226,232,240,0.82)',fontSize:15,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em' }}>Danh sách bài đọc</span>
                  <button onClick={openAdd}
                    title="Thêm bài đọc mới"
                    style={{ width:28,height:28,borderRadius:8,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <Plus size={14}/>
                  </button>
                </div>

                {/* Filters */}
                <div className="px-3 py-2.5 space-y-2" style={{ background:'#f8fafc',borderBottom:'1px solid #c2cfe0' }}>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={searchBD} onChange={e=>setSearchBD(e.target.value)} placeholder="Tìm bài đọc..."
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]/50 bg-white" />
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
                  {(filterCert||filterLevel||searchBD) && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#1e3a5f] font-semibold">{filtered.length}/{list.length} bài</span>
                      <button onClick={()=>{setFilterCert('');setFilterLevel('');setSearchBD('')}} className="text-xs text-red-400 hover:text-red-600 font-semibold">Xóa lọc</button>
                    </div>
                  )}
                </div>

                {/* List */}
                <div className="divide-y divide-[#c2cfe0] max-h-[60vh] overflow-y-auto">
                  {filtered.length===0 && (
                    <div className="text-center py-12 text-gray-400 text-sm">Không tìm thấy bài đọc nào</div>
                  )}
                  {filtered.map(p => {
                    const isSel = selected?.id===p.id
                    return (
                      <div key={p.id as string} onClick={()=>setSelected(p)}
                        className="group cursor-pointer transition-colors hover:bg-blue-50"
                        style={{ padding:'12px 14px',background:isSel?'#eff6ff':undefined,borderLeft:isSel?'3px solid #1e3a5f':'3px solid transparent',opacity:p.dang_hoat_dong?1:0.55 }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <span className="text-lg flex-shrink-0 mt-0.5">{(p.bieu_tuong as string)||'📄'}</span>
                            <div className="min-w-0">
                              <div className="font-bold text-gray-800 text-sm leading-snug truncate">{p.tieu_de as string}</div>
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CERT_COLOR[p.loai_chung_chi as string]||'bg-gray-100 text-gray-500'}`}>{p.loai_chung_chi as string}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${LEVEL_COLOR[p.cap_do as string]||'bg-gray-100 text-gray-500'}`}>{p.cap_do as string}</span>
                                {!!p.da_kiem_duyet && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">✓ Duyệt</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={e=>{e.stopPropagation();openEdit(p)}}
                              className="p-1 rounded-lg text-blue-400 border border-blue-200 hover:bg-blue-500 hover:text-white transition-all">
                              <Pencil size={13}/>
                            </button>
                            <button onClick={e=>{e.stopPropagation();deletePassage(p.id as string)}}
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
                      <span className="text-3xl">{(selected.bieu_tuong as string)||'📄'}</span>
                      <div>
                        <div className="text-white font-bold text-base">{selected.tieu_de as string}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${CERT_COLOR[selected.loai_chung_chi as string]||'bg-gray-100 text-gray-500'}`}>{selected.loai_chung_chi as string}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${LEVEL_COLOR[selected.cap_do as string]||'bg-gray-100 text-gray-500'}`}>{selected.cap_do as string}</span>
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
                      <button onClick={()=>toggleApprove(selected)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{ background:selected.da_kiem_duyet?'rgba(16,185,129,0.15)':'rgba(255,255,255,0.12)', color:selected.da_kiem_duyet?'#6ee7b7':'#fff', border:`1px solid ${selected.da_kiem_duyet?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.2)'}` }}>
                        <CheckCircle size={14}/> {selected.da_kiem_duyet?'Bỏ duyệt':'Duyệt bài'}
                      </button>
                      <button onClick={()=>toggleActive(selected)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{ background:selected.dang_hoat_dong?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.12)', color:selected.dang_hoat_dong?'#fca5a5':'#fff', border:`1px solid ${selected.dang_hoat_dong?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.2)'}` }}>
                        {selected.dang_hoat_dong?<><EyeOff size={14}/> Ẩn bài</>:<><Eye size={14}/> Hiện bài</>}
                      </button>
                      <button onClick={()=>deletePassage(selected.id as string)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{ background:'rgba(239,68,68,0.15)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.3)' }}>
                        <Trash2 size={14}/> Xóa
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-0" style={{ borderBottom:'1px solid #c2cfe0' }}>
                    {[
                      { label:'Loại bài',    value: selected.loai_bai as string || '—' },
                      { label:'Số câu hỏi',  value: `${selected.so_cau_hoi ?? 0} câu` },
                      { label:'Thời gian',   value: `${Math.floor((selected.thoi_gian_giay as number||0)/60)} phút` },
                      { label:'Lượt làm',    value: `${(selected.luot_lam as number||0).toLocaleString('vi-VN')}` },
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
                    {!!selected.mo_ta && (
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Mô tả</div>
                        <p className="text-sm text-gray-700 leading-relaxed">{selected.mo_ta as string}</p>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nội dung bài đọc</div>
                      <div className="p-4 rounded-xl text-sm text-gray-800 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap"
                        style={{ background:'#f1f5f9',border:'1px solid #c2cfe0' }}>
                        {selected.noi_dung as string}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-md flex flex-col items-center justify-center py-20 text-center"
                  style={{ border:'2px solid #b0bfd4' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background:'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                    <BookOpen size={32} color="white" strokeWidth={1.8}/>
                  </div>
                  <div className="font-semibold text-gray-700 text-base">Chọn bài đọc bên trái để xem chi tiết</div>
                  <div className="text-sm text-gray-500 mt-1">Dữ liệu từ bảng BaiDoc</div>
                  <button onClick={openAdd}
                    className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background:'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                    <Plus size={15}/> Thêm bài đọc đầu tiên
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ TAB: NGÂN HÀNG ══ */}
        {tab==='nganhang' && (
          <div className="grid lg:grid-cols-4 gap-5">

            {/* Sidebar NH */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl overflow-hidden shadow-md" style={{ border:'2px solid #b0bfd4' }}>
                <div className="px-4 py-3" style={{ background:'linear-gradient(180deg,#2d4e7a 0%,#1e3a5f 100%)',borderBottom:'2px solid rgba(147,197,253,0.2)' }}>
                  <span style={{ color:'rgba(226,232,240,0.82)',fontSize:15,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em' }}>Ngân hàng câu hỏi</span>
                </div>

                <div className="px-3 py-2.5 space-y-2" style={{ background:'#f8fafc',borderBottom:'1px solid #c2cfe0' }}>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input value={nhSearch} onChange={e=>setNhSearch(e.target.value)} placeholder="Tìm câu hỏi..."
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]/50 bg-white"/>
                  </div>
                  <div className="flex gap-1.5">
                    <select value={nhCert}  onChange={e=>setNhCert(e.target.value)}  className={`${filterSelectCls} flex-1`}>
                      <option value="">Tất cả</option>
                      {CERTS.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={nhLevel} onChange={e=>setNhLevel(e.target.value)} className={`${filterSelectCls} flex-1`}>
                      <option value="">Cấp độ</option>
                      {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  {(nhCert||nhLevel||nhSearch) && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#1e3a5f] font-semibold">{nhFiltered.length}/{nhList.length} câu</span>
                      <button onClick={()=>{setNhCert('');setNhLevel('');setNhSearch('')}} className="text-xs text-red-400 hover:text-red-600 font-semibold">Xóa lọc</button>
                    </div>
                  )}
                </div>

                <div className="divide-y divide-[#c2cfe0] max-h-[60vh] overflow-y-auto">
                  {!nhLoaded && <div className="text-center py-12 text-gray-400 text-sm">Đang tải...</div>}
                  {nhLoaded && nhFiltered.length===0 && <div className="text-center py-12 text-gray-400 text-sm">Chưa có câu hỏi nào</div>}
                  {nhFiltered.map(q => {
                    const isSel = nhSelected?.id===q.id
                    return (
                      <div key={q.id as string} onClick={()=>setNhSelected(q)}
                        className="group cursor-pointer transition-colors hover:bg-blue-50"
                        style={{ padding:'12px 14px',background:isSel?'#eff6ff':undefined,borderLeft:isSel?'3px solid #1e3a5f':'3px solid transparent' }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 font-medium leading-snug line-clamp-2">{cleanText(q.noi_dung_cau_hoi as string)}</p>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CERT_COLOR[q.loai_chung_chi as string]||'bg-gray-100 text-gray-500'}`}>{q.loai_chung_chi as string}</span>
                              {!!q.cap_do && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${LEVEL_COLOR[q.cap_do as string]||'bg-gray-100 text-gray-500'}`}>{q.cap_do as string}</span>}
                              {!!q.so_phan && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Phần {q.so_phan as number}</span>}
                            </div>
                          </div>
                          <button onClick={e=>{e.stopPropagation();deleteNH(q.id as string)}}
                            className="p-1 rounded-lg text-red-400 border border-red-200 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Detail NH */}
            <div className="lg:col-span-3">
              {nhSelected ? (
                <div className="rounded-2xl overflow-hidden shadow-md" style={{ border:'2px solid #b0bfd4' }}>
                  <div className="px-5 py-4" style={{ background:'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${CERT_COLOR[nhSelected.loai_chung_chi as string]||'bg-gray-100 text-gray-500'}`}>{nhSelected.loai_chung_chi as string}</span>
                      {!!nhSelected.cap_do && <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${LEVEL_COLOR[nhSelected.cap_do as string]||'bg-gray-100 text-gray-500'}`}>{nhSelected.cap_do as string}</span>}
                      {!!nhSelected.so_phan && <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-blue-200 font-medium">Phần {nhSelected.so_phan as number}</span>}
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Câu hỏi</div>
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{cleanText(nhSelected.noi_dung_cau_hoi as string)}</p>
                    </div>

                    {!!nhSelected.cac_lua_chon && (
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Các lựa chọn</div>
                        <div className="space-y-2">
                          {(() => {
  const lua_chon = nhSelected.cac_lua_chon
  const entries: [string, string][] = Array.isArray(lua_chon)
    ? lua_chon.map((item: Record<string,string>) => [item.key, item.value])
    : Object.entries(lua_chon as Record<string,string>)
  return entries.map(([k, v]) => {
    const correct = k === nhSelected.dap_an_dung
    return (
      <div key={k} className="flex gap-3 items-start px-4 py-3 rounded-xl text-sm"
        style={{ background:correct?'#dcfce7':'#f1f5f9', border:`1px solid ${correct?'#bbf7d0':'#c2cfe0'}` }}>
        <span className="font-bold flex-shrink-0" style={{ color:correct?'#15803d':'#6b7280' }}>{k}.</span>
        <span className="flex-1" style={{ color:correct?'#15803d':'#374151', fontWeight:correct?600:400 }}>{v}</span>
        {correct && <span className="text-emerald-600 font-bold text-xs flex-shrink-0">✓ Đúng</span>}
      </div>
    )
  })
})()}
                        </div>
                      </div>
                    )}

                    {!!nhSelected.giai_thich && (
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Giải thích</div>
                        <div className="p-4 rounded-xl text-sm text-gray-700 leading-relaxed"
                          style={{ background:'#fffbeb',border:'1px solid #fde68a' }}>
                          {nhSelected.giai_thich as string}
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
                    <BookOpen size={32} color="white" strokeWidth={1.8}/>
                  </div>
                  <div className="font-semibold text-gray-700 text-base">Chọn câu hỏi để xem chi tiết</div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  )
}