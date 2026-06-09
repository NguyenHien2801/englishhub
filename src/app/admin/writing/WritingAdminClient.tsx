'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Pencil, X, Search, Filter, BookOpen } from 'lucide-react'

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
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAlerts(p => p.slice(1)) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [alerts.length])

  if (alerts.length === 0) return null
  const cur = alerts[0]
  const meta = ALERT_META[cur.type]
  const dismiss = () => setAlerts(p => p.slice(1))

  return (
    <div onClick={dismiss} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'ahOverlayIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, border: `2px solid ${ACCENT}`, overflow: 'hidden', position: 'relative', boxShadow: '0 16px 48px rgba(10,20,50,0.18)', animation: 'ahModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: 'DM Sans, sans-serif' }}>
        <button onClick={dismiss} style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(30,58,95,0.08)', color: ACCENT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div style={{ padding: '24px 24px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: 'rgba(30,58,95,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{meta.iconPath}</svg>
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0f2847', marginBottom: 5 }}>{meta.chip}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{cur.title}</div>
            {cur.message && <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '6px 0 0' }}>{cur.message}</p>}
          </div>
        </div>
        <div style={{ padding: '12px 24px 20px', display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid rgba(30,58,95,0.12)` }}>
          <button onClick={dismiss} style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>{meta.btnLabel}</button>
        </div>
        {alerts.length > 1 && <div style={{ position: 'absolute', top: 10, right: 46, background: ACCENT, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>+{alerts.length - 1}</div>}
      </div>
      <style>{`@keyframes ahOverlayIn{from{opacity:0}to{opacity:1}}@keyframes ahModalIn{from{opacity:0;transform:scale(0.88) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
//  CONFIRM DIALOG
// ═══════════════════════════════════════════════════════
type ConfirmOptions = { title: string; message?: string; confirmText?: string; cancelText?: string }
type ConfirmState  = ConfirmOptions & { resolve: (v: boolean) => void }

function ConfirmDialog({ state, onResolve }: { state: ConfirmState; onResolve: (v: boolean) => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onResolve(false); if (e.key === 'Enter') onResolve(true) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onResolve])

  return (
    <div ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onResolve(false) }} style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'cfOverlayIn 0.18s ease' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, border: `2px solid ${ACCENT}`, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.16)', animation: 'cfPopIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ padding: '24px 24px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: 'rgba(30,58,95,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2}><path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{state.title}</div>
            {state.message && <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '6px 0 0' }}>{state.message}</p>}
          </div>
        </div>
        <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: `1px solid rgba(30,58,95,0.12)` }}>
          <button onClick={() => onResolve(false)} style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid rgba(30,58,95,0.25)', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>{state.cancelText ?? 'Hủy'}</button>
          <button onClick={() => onResolve(true)} style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0f2847,#1e3a5f)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>{state.confirmText ?? 'Xác nhận'}</button>
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
const CERTS  = ['VSTEP', 'TOEIC', 'APTIS']
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const CERT_COLOR: Record<string, string> = {
  VSTEP: 'bg-blue-100 text-blue-700',
  TOEIC: 'bg-purple-100 text-purple-700',
  APTIS: 'bg-pink-100 text-pink-700',
}
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

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]/60 transition-colors bg-white'

const emptyForm = {
  chung_chi: 'VSTEP', cap_do: 'B1', tieu_de: '', bieu_tuong: '✍️',
  de_bai: '', so_tu_toi_thieu: 150, so_tu_toi_da: 250,
  thong_tin_ky_thi: '', thu_tu: 0, dang_hoat_dong: true,
}
type Lesson = Record<string, unknown>

// ═══════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function WritingAdminClient({ lessons: init }: { lessons: Lesson[] }) {
  const { confirm, dialog } = useConfirm()
  const [lessons, setLessons] = useState(init)
  const [selected, setSelected]     = useState<Lesson | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [showEdit, setShowEdit]     = useState(false)
  const [form, setForm]             = useState({ ...emptyForm })
  const [editForm, setEditForm]     = useState({ ...emptyForm })
  const [searchText, setSearchText] = useState('')
  const [filterCert, setFilterCert] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const supabase = createClient()

  const filtered = lessons.filter(l => {
    const matchCert  = !filterCert  || l.chung_chi === filterCert
    const matchLevel = !filterLevel || l.cap_do    === filterLevel
    const matchSearch = !searchText || (l.tieu_de as string).toLowerCase().includes(searchText.toLowerCase())
    return matchCert && matchLevel && matchSearch
  })

  async function save() {
    if (!form.tieu_de.trim() || !form.de_bai.trim()) { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập tiêu đề và đề bài'); return }
    const payload = {
      ...form,
      rubric_json: { criteria: ['Nội dung', 'Cấu trúc', 'Từ vựng', 'Ngữ pháp'], weights: [25, 25, 25, 25] },
      goi_y_json: { hints: [], outline: '' },
    }
    const { data, error } = await supabase.from('bailuyenviet').insert(payload).select().single()
    if (error) { showToast('error', 'Thêm thất bại', error.message); return }
    setLessons(prev => [...prev, data].sort((a, b) => (a.thu_tu as number) - (b.thu_tu as number)))
    setForm({ ...emptyForm }); setShowForm(false)
    showToast('success', 'Đã thêm bài viết!')
  }

  async function saveEdit() {
    if (!selected) return
    if (!editForm.tieu_de.trim() || !editForm.de_bai.trim()) { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập tiêu đề và đề bài'); return }
    const { data, error } = await supabase.from('bailuyenviet').update(editForm).eq('id', selected.id).select().single()
    if (error) { showToast('error', 'Cập nhật thất bại', error.message); return }
    setLessons(prev => prev.map(l => l.id === selected.id ? data : l).sort((a, b) => (a.thu_tu as number) - (b.thu_tu as number)))
    setSelected(data)
    setShowEdit(false)
    showToast('success', 'Đã cập nhật bài viết!')
  }

  async function toggleActive(id: string, cur: boolean) {
    const { error } = await supabase.from('bailuyenviet').update({ dang_hoat_dong: !cur }).eq('id', id)
    if (error) { showToast('error', error.message); return }
    setLessons(prev => prev.map(l => l.id === id ? { ...l, dang_hoat_dong: !cur } : l))
    if (selected?.id === id) setSelected(s => s ? { ...s, dang_hoat_dong: !cur } : s)
    showToast('success', !cur ? 'Đã kích hoạt bài viết' : 'Đã ẩn bài viết')
  }

  async function deleteLesson(id: string) {
    const lesson = lessons.find(l => l.id === id)
    const ok = await confirm({
      title: 'Xóa bài viết này?',
      message: lesson ? `"${lesson.tieu_de}" sẽ bị xóa vĩnh viễn, không thể khôi phục.` : 'Bài viết sẽ bị xóa vĩnh viễn.',
      confirmText: '🗑 Xóa vĩnh viễn',
      cancelText: 'Giữ lại',
    })
    if (!ok) return
    const { error } = await supabase.from('bailuyenviet').delete().eq('id', id)
    if (error) { showToast('error', 'Xóa thất bại', error.message); return }
    setLessons(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(null)
    showToast('success', 'Đã xóa bài viết')
  }

  function openEdit(lesson: Lesson, e: React.MouseEvent) {
    e.stopPropagation()
    setEditForm({
      chung_chi:       lesson.chung_chi       as string || 'VSTEP',
      cap_do:          lesson.cap_do          as string || 'B1',
      tieu_de:         lesson.tieu_de         as string || '',
      bieu_tuong:      lesson.bieu_tuong      as string || '✍️',
      de_bai:          lesson.de_bai          as string || '',
      so_tu_toi_thieu: lesson.so_tu_toi_thieu as number || 150,
      so_tu_toi_da:    lesson.so_tu_toi_da    as number || 250,
      thong_tin_ky_thi:lesson.thong_tin_ky_thi as string || '',
      thu_tu:          lesson.thu_tu          as number || 0,
      dang_hoat_dong:  lesson.dang_hoat_dong  as boolean ?? true,
    })
    setShowEdit(true)
  }

  const rubricColors = ['bg-purple-100 text-purple-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700']

  return (
    <>
      <AlertContainer />
      {dialog}

      <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QUẢN LÝ BÀI VIẾT</h1>
          </div>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
            <Plus size={16} strokeWidth={2.5} /> Thêm bài viết
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            {
              label: 'Tổng bài viết', value: lessons.length, color: '#1e3a5f',
              icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
            },
            {
              label: 'Đang hoạt động', value: lessons.filter(l => l.dang_hoat_dong).length, color: '#059669',
              icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            },
            {
              label: 'Bài VSTEP', value: lessons.filter(l => l.chung_chi === 'VSTEP').length, color: '#2563eb',
              icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>,
            },
            {
              label: 'Bài TOEIC', value: lessons.filter(l => l.chung_chi === 'TOEIC').length, color: '#7c3aed',
              icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
            },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="rounded-2xl p-4 flex items-center gap-3" style={{ border: `2px solid ${color}30`, background: `linear-gradient(135deg, #fff 60%, ${color}0d 100%)` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}15`, color, border: `1.5px solid ${color}25` }}>
                {icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{value.toLocaleString('vi-VN')}</div>
                <div className="text-sm text-gray-800 mt-1">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-5">

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>
              {/* Sidebar header */}
              <div className="px-4 py-3" style={{ background: 'linear-gradient(180deg,#2d4e7a 0%,#1e3a5f 100%)', borderBottom: '2px solid rgba(147,197,253,0.2)' }}>
                <span style={{ color: 'rgba(226,232,240,0.82)', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Danh sách bài viết
                </span>
              </div>

              {/* Filters */}
              <div className="px-3 py-2.5 space-y-2" style={{ background: '#f8fafc', borderBottom: '1px solid #c2cfe0' }}>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Tìm bài viết..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]/50 bg-white" />
                </div>
                <div className="flex gap-1.5">
                  <select value={filterCert} onChange={e => setFilterCert(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-2 text-sm font-semibold focus:outline-none bg-white text-gray-700 cursor-pointer flex-1">
                    <option value="">Tất cả</option>
                    {CERTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-2 text-sm font-semibold focus:outline-none bg-white text-gray-700 cursor-pointer flex-1">
                    <option value="">Cấp độ</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                {(filterCert || filterLevel || searchText) && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#1e3a5f] font-semibold">{filtered.length}/{lessons.length} bài</span>
                    <button onClick={() => { setFilterCert(''); setFilterLevel(''); setSearchText('') }}
                      className="text-xs text-red-400 hover:text-red-600 font-semibold">Xóa lọc</button>
                  </div>
                )}
              </div>

              {/* List */}
              <div className="divide-y divide-[#c2cfe0] max-h-[60vh] overflow-y-auto">
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">Không tìm thấy bài viết nào</div>
                )}
                {filtered.map(lesson => {
                  const isSelected = selected?.id === lesson.id
                  return (
                    <div key={lesson.id as string} onClick={() => setSelected(lesson)}
                      className="group cursor-pointer transition-colors hover:bg-blue-50"
                      style={{ padding: '12px 14px', background: isSelected ? '#eff6ff' : undefined, borderLeft: isSelected ? '3px solid #1e3a5f' : '3px solid transparent', opacity: lesson.dang_hoat_dong ? 1 : 0.55 }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="text-lg flex-shrink-0 mt-0.5">{lesson.bieu_tuong as string}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-800 text-sm leading-snug truncate">{lesson.tieu_de as string}</div>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CERT_COLOR[lesson.chung_chi as string] || 'bg-gray-100 text-gray-500'}`}>{lesson.chung_chi as string}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${LEVEL_COLOR[lesson.cap_do as string] || 'bg-gray-100 text-gray-500'}`}>{lesson.cap_do as string}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={e => { setSelected(lesson); openEdit(lesson, e) }}
                            className="p-1 rounded-lg text-blue-400 border border-blue-200 hover:bg-blue-500 hover:text-white transition-all">
                            <Pencil size={13} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteLesson(lesson.id as string) }}
                            className="p-1 rounded-lg text-red-400 border border-red-200 hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="px-3 py-2.5" style={{ background: '#f8fafc', borderTop: '2px solid #c2cfe0' }}>
                <button onClick={() => setShowForm(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#1e3a5f] py-2 rounded-lg hover:bg-blue-50 transition-colors">
                  <Plus size={13} /> Thêm bài viết mới
                </button>
              </div>
            </div>
          </div>

          {/* ── Detail panel ── */}
          <div className="lg:col-span-3">
            {selected ? (
              <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>
                {/* Panel header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selected.bieu_tuong as string}</span>
                    <div>
                      <div className="text-white font-bold text-base">{selected.tieu_de as string}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${CERT_COLOR[selected.chung_chi as string] || 'bg-gray-100 text-gray-500'}`}>{selected.chung_chi as string}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${LEVEL_COLOR[selected.cap_do as string] || 'bg-gray-100 text-gray-500'}`}>{selected.cap_do as string}</span>
                        {!selected.dang_hoat_dong && <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-600">Đang ẩn</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { openEdit(selected, e) }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <Pencil size={14} /> Sửa
                    </button>
                    <button onClick={() => toggleActive(selected.id as string, selected.dang_hoat_dong as boolean)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: selected.dang_hoat_dong ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: selected.dang_hoat_dong ? '#fca5a5' : '#6ee7b7', border: `1px solid ${selected.dang_hoat_dong ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                      {selected.dang_hoat_dong ? 'Ẩn bài' : 'Kích hoạt'}
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-0" style={{ borderBottom: '1px solid #c2cfe0' }}>
                  {[
                    { label: 'Từ tối thiểu', value: `${selected.so_tu_toi_thieu} từ` },
                    { label: 'Từ tối đa',    value: `${selected.so_tu_toi_da} từ` },
                    { label: 'Thứ tự',       value: `#${selected.thu_tu}` },
                  ].map((s, i) => (
                    <div key={s.label} style={{ padding: '14px 20px', textAlign: 'center', borderRight: i < 2 ? '1px solid #c2cfe0' : 'none', background: '#f8fafc' }}>
                      <div className="text-xl font-bold text-gray-900" style={{ fontFamily: 'DM Sans, sans-serif' }}>{s.value}</div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-semibold">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Body */}
                <div className="p-5 space-y-5">
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Đề bài</div>
                    <div className="p-4 rounded-xl text-sm text-gray-800 leading-relaxed whitespace-pre-wrap" style={{ background: '#f1f5f9', border: '1px solid #c2cfe0' }}>
                      {selected.de_bai as string}
                    </div>
                  </div>

                  {!!selected.thong_tin_ky_thi && (
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Thông tin kỳ thi</div>
                      <div className="p-3 rounded-xl text-sm text-gray-700" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                        {selected.thong_tin_ky_thi as string}
                      </div>
                    </div>
                  )}

                  {!!selected.rubric_json && (
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Rubric chấm điểm</div>
                      <div className="flex flex-wrap gap-2">
                        {((selected.rubric_json as Record<string, unknown>).criteria as string[] || []).map((c, i) => (
                          <span key={i} className={`text-xs px-3 py-1.5 rounded-full font-semibold ${rubricColors[i % rubricColors.length]}`}>
                            {c} &mdash; {((selected.rubric_json as Record<string, unknown>).weights as number[])?.[i]}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md flex flex-col items-center justify-center py-20 text-center"
                style={{ border: '2px solid #b0bfd4' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                  <BookOpen size={32} color="white" strokeWidth={1.8} />
                </div>
                <div className="font-semibold text-gray-700 text-base">Chọn bài viết bên trái để xem chi tiết</div>
                <div className="text-sm text-gray-500 mt-1">Hoặc thêm bài viết mới</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Modal Form (shared for Add & Edit) ── */}
        {(showForm || showEdit) && (() => {
          const isEdit = showEdit
          const f = isEdit ? editForm : form
          const setF = isEdit
            ? (updater: (p: typeof emptyForm) => typeof emptyForm) => setEditForm(updater)
            : (updater: (p: typeof emptyForm) => typeof emptyForm) => setForm(updater)
          const onClose = () => isEdit ? setShowEdit(false) : setShowForm(false)
          const onSave  = isEdit ? saveEdit : save

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(10,20,40,0.6)', backdropFilter: 'blur(6px)' }}
              onClick={onClose}>
              <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
                  <div>
                    <div className="text-white font-bold text-base">{isEdit ? 'Sửa bài viết' : 'Thêm bài viết mới'}</div>
                    <div className="text-blue-200 text-xs mt-0.5">{isEdit ? 'Cập nhật thông tin bên dưới' : 'Điền thông tin bên dưới'}</div>
                  </div>
                  <button onClick={onClose} className="text-white/60 hover:text-white"><X size={18} strokeWidth={2.5} /></button>
                </div>

                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Row 1 */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Biểu tượng</label>
                      <input type="text" value={f.bieu_tuong} onChange={e => setF(p => ({ ...p, bieu_tuong: e.target.value }))}
                        className={inputCls} style={{ textAlign: 'center', fontSize: 20 }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Chứng chỉ</label>
                      <select value={f.chung_chi} onChange={e => setF(p => ({ ...p, chung_chi: e.target.value }))} className={inputCls}>
                        {CERTS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Cấp độ</label>
                      <select value={f.cap_do} onChange={e => setF(p => ({ ...p, cap_do: e.target.value }))} className={inputCls}>
                        {LEVELS.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Tiêu đề */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Tiêu đề *</label>
                    <input type="text" value={f.tieu_de} onChange={e => setF(p => ({ ...p, tieu_de: e.target.value }))}
                      placeholder="VD: VSTEP B1 – Task 1: Formal Letter" className={inputCls} />
                  </div>

                  {/* Thông tin kỳ thi */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Thông tin kỳ thi</label>
                    <input type="text" value={f.thong_tin_ky_thi} onChange={e => setF(p => ({ ...p, thong_tin_ky_thi: e.target.value }))}
                      placeholder="VD: Part 1 – VSTEP Writing" className={inputCls} />
                  </div>

                  {/* Đề bài */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Đề bài *</label>
                    <textarea value={f.de_bai} onChange={e => setF(p => ({ ...p, de_bai: e.target.value }))}
                      rows={5} placeholder="Nhập đề bài chi tiết..."
                      className={inputCls} style={{ resize: 'vertical', lineHeight: 1.6 }} />
                  </div>

                  {/* Numbers */}
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { label: 'Từ tối thiểu', k: 'so_tu_toi_thieu' as const },
                      { label: 'Từ tối đa',    k: 'so_tu_toi_da'    as const },
                      { label: 'Thứ tự',       k: 'thu_tu'          as const },
                    ] as const).map(({ label, k }) => (
                      <div key={k}>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
                        <input type="number" value={f[k] as number} onChange={e => setF(p => ({ ...p, [k]: +e.target.value }))} className={inputCls} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 pb-5 flex gap-3 justify-end" style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                  <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">Hủy</button>
                  <button onClick={onSave}
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                    {isEdit ? 'Lưu thay đổi' : 'Thêm bài viết'}
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </>
  )
}