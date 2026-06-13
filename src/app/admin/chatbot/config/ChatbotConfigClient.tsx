'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Database, CheckCircle2, Clock, Zap, Trash2, X } from 'lucide-react'

// ═══════════════════════════════════════════════════════════
//  ALERT / TOAST SYSTEM (đồng nhất với các trang admin khác)
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
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setAlerts(prev => prev.slice(1)) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [alerts.length])

  if (alerts.length === 0) return null
  const current = alerts[0]
  const meta = ALERT_META[current.type]
  function dismiss() { setAlerts(prev => prev.slice(1)) }

  return (
    <div onClick={dismiss} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'cfOverlayIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, border: `2px solid ${ACCENT}`, overflow: 'hidden', position: 'relative', boxShadow: '0 16px 48px rgba(10,20,50,0.18)', animation: 'cfModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: 'DM Sans, sans-serif' }}>
        <button onClick={dismiss} style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(30,58,95,0.08)', color: ACCENT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div style={{ padding: '24px 24px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: 'rgba(30,58,95,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{meta.iconPath}</svg>
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0f2847', marginBottom: 5 }}>{meta.chip}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{current.title}</div>
            {current.message && <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '6px 0 0' }}>{current.message}</p>}
          </div>
        </div>
        <div style={{ padding: '12px 24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: `1px solid rgba(30,58,95,0.12)` }}>
          <button onClick={dismiss} style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>{meta.btnLabel}</button>
        </div>
      </div>
      <style>{`
        @keyframes cfOverlayIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cfModalIn { from { opacity: 0; transform: scale(0.88) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  CONFIRM DIALOG (đồng nhất với các trang admin khác)
// ═══════════════════════════════════════════════════════════
type ConfirmVariant = 'danger' | 'warning' | 'info'
type ConfirmOptions = { title: string; message?: string; confirmText?: string; cancelText?: string; variant?: ConfirmVariant }
type ConfirmState = ConfirmOptions & { resolve: (v: boolean) => void }

const CONFIRM_ICON: Record<ConfirmVariant, React.ReactNode> = {
  danger: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2}><path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  warning: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2}><path strokeLinecap="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>,
  info: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2}><path strokeLinecap="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
}

function ConfirmDialog({ state, onResolve }: { state: ConfirmState; onResolve: (v: boolean) => void }) {
  const variant = state.variant ?? 'danger'
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onResolve(false)
      if (e.key === 'Enter') onResolve(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onResolve])

  return (
    <div ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onResolve(false) }}
      style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'cfFadeIn 0.18s ease' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, border: `2px solid ${ACCENT}`, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.16)', animation: 'cfPopIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ padding: '24px 24px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: 'rgba(30,58,95,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {CONFIRM_ICON[variant]}
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{state.title}</div>
            {state.message && <p style={{ fontSize: 13, color: '#111827', lineHeight: 1.6, margin: '6px 0 0' }}>{state.message}</p>}
          </div>
        </div>
        <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: `1px solid rgba(30,58,95,0.12)` }}>
          <button onClick={() => onResolve(false)} style={{ padding: '9px 20px', borderRadius: 10, border: `1.5px solid rgba(30,58,95,0.25)`, background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            {state.cancelText ?? 'Hủy'}
          </button>
          <button onClick={() => onResolve(true)} style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            {state.confirmText ?? 'Xác nhận'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes cfFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes cfPopIn { from { opacity:0; transform: scale(0.88) translateY(12px); } to { opacity:1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  )
}

function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null)
  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>(resolve => setState({ ...opts, resolve }))
  }, [])
  const handleResolve = useCallback((val: boolean) => { state?.resolve(val); setState(null) }, [state])
  const dialog = state ? <ConfirmDialog state={state} onResolve={handleResolve} /> : null
  return { confirm, dialog }
}

// ═══════════════════════════════════════════════════════════
//  STAT CARD (đồng nhất với VocabAdminClient)
// ═══════════════════════════════════════════════════════════
function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ border: `2px solid ${color}30`, background: `linear-gradient(135deg, #fff 60%, ${color}0d 100%)` }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color, border: `1.5px solid ${color}25` }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}</div>
        <div className="text-sm text-gray-800 mt-1">{label}</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
type CacheEntry = Record<string, unknown>

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function isExpired(d: string) { return new Date(d) < new Date() }

const LOAI_LABEL: Record<string, string> = {
  giai_thich_tu: 'Giải thích từ',
  sinh_quiz:     'Sinh quiz',
  cham_writing:  'Chấm writing',
  general:       'Hội thoại',
  grammar:       'Ngữ pháp',
  vocabulary:    'Từ vựng',
}
const LOAI_BADGE: Record<string, string> = {
  giai_thich_tu: 'bg-blue-100 text-blue-700 border border-blue-200',
  sinh_quiz:     'bg-purple-100 text-purple-700 border border-purple-200',
  cham_writing:  'bg-amber-100 text-amber-700 border border-amber-200',
  general:       'bg-slate-100 text-slate-700 border border-slate-200',
  grammar:       'bg-blue-100 text-blue-700 border border-blue-200',
  vocabulary:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
}

// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════
export default function ChatbotConfigClient() {
  const [cache, setCache]     = useState<CacheEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterLoai, setFilterLoai] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all')
  const [selected, setSelected] = useState<CacheEntry | null>(null)
  const { confirm, dialog } = useConfirm()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('BoDemAI').select('*').order('so_lan_dung', { ascending: false }).limit(500)
      if (error) { showToast('error', 'Lỗi tải dữ liệu', error.message); setLoading(false); return }
      setCache(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const stats = {
    total:  cache.length,
    active: cache.filter(e => !isExpired(e.het_han_luc as string)).length,
    expired: cache.filter(e => isExpired(e.het_han_luc as string)).length,
    hits:   cache.reduce((a, e) => a + ((e.so_lan_dung as number) || 0), 0),
  }

  const loaiList = Array.from(new Set(cache.map(e => e.loai_ngucan_ai as string).filter(Boolean)))

  const filtered = cache.filter(e => {
    const matchSearch = !search || (e.noi_dung_cau_hoi as string || '').toLowerCase().includes(search.toLowerCase())
    const matchLoai = !filterLoai || e.loai_ngucan_ai === filterLoai
    const matchStatus = filterStatus === 'all' ? true : filterStatus === 'expired' ? isExpired(e.het_han_luc as string) : !isExpired(e.het_han_luc as string)
    return matchSearch && matchLoai && matchStatus
  })

  async function deleteEntry(entry: CacheEntry) {
    const ok = await confirm({
      title: 'Xóa cache này?',
      message: 'Lần hỏi tiếp theo AI sẽ phải tạo lại phản hồi từ đầu.',
      confirmText: '🗑 Xóa',
      cancelText: 'Giữ lại',
      variant: 'danger',
    })
    if (!ok) return
    const { error } = await supabase.from('BoDemAI').delete().eq('id', entry.id as string)
    if (error) { showToast('error', 'Xóa thất bại', error.message); return }
    setCache(prev => prev.filter(e => e.id !== entry.id))
    if (selected?.id === entry.id) setSelected(null)
    showToast('success', 'Đã xóa cache')
  }

  async function clearExpired() {
    const ok = await confirm({
      title: `Xóa ${stats.expired} cache hết hạn?`,
      message: 'Các mục này không còn được dùng lại, có thể dọn để giảm dung lượng.',
      confirmText: '🗑 Xóa hết hạn',
      cancelText: 'Hủy',
      variant: 'warning',
    })
    if (!ok) return
    const { error } = await supabase.from('BoDemAI').delete().lt('het_han_luc', new Date().toISOString())
    if (error) { showToast('error', 'Xóa thất bại', error.message); return }
    setCache(prev => prev.filter(e => !isExpired(e.het_han_luc as string)))
    setSelected(null)
    showToast('success', 'Đã xóa cache hết hạn')
  }

  async function clearAll() {
    const ok = await confirm({
      title: `Xóa toàn bộ ${stats.total} cache?`,
      message: 'Hành động này không thể hoàn tác. Toàn bộ phản hồi đã lưu sẽ bị xóa.',
      confirmText: '🗑 Xóa tất cả',
      cancelText: 'Hủy',
      variant: 'danger',
    })
    if (!ok) return
    const { error } = await supabase.from('BoDemAI').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) { showToast('error', 'Xóa thất bại', error.message); return }
    setCache([]); setSelected(null)
    showToast('success', 'Đã xóa toàn bộ cache')
  }

  const TH: React.CSSProperties = {
    background: 'linear-gradient(180deg, #2d4e7a 0%, #1e3a5f 100%)',
    color: 'rgba(226,232,240,0.82)', padding: '11px 14px', fontSize: 13, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255,255,255,0.12)', borderBottom: '2px solid rgba(147,197,253,0.2)',
  }
  const CELL_BORDER = '1px solid #c2cfe0'

  return (
    <>
      <AlertContainer />
      {dialog}
      <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily: 'DM Sans,sans-serif' }}>

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CẤU HÌNH CHATBOT AI</h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              Quản lý bộ đệm phản hồi · Tổng <span className="font-semibold text-[#1e3a5f]">{stats.total}</span> mục
              {filtered.length !== cache.length && (
                <> · đang lọc <span className="font-semibold text-[#1e3a5f]">{filtered.length}</span> kết quả</>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {stats.expired > 0 && (
              <button onClick={clearExpired}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors bg-white">
                <Clock size={16} /> Xóa {stats.expired} hết hạn
              </button>
            )}
            {stats.total > 0 && (
              <button onClick={clearAll}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors bg-white">
                <Trash2 size={16} /> Xóa tất cả
              </button>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <StatCard label="Tổng cache"     value={stats.total}   color="#1e3a5f" icon={<Database size={22} />} />
          <StatCard label="Còn hiệu lực"   value={stats.active}  color="#059669" icon={<CheckCircle2 size={22} />} />
          <StatCard label="Hết hạn"        value={stats.expired} color="#dc2626" icon={<Clock size={22} />} />
          <StatCard label="Tổng lượt dùng" value={stats.hits}    color="#C9A84C" icon={<Zap size={22} />} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo nội dung câu hỏi..."
              className="w-full pl-9 pr-9 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>
          <select value={filterLoai} onChange={e => setFilterLoai(e.target.value)}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white">
            <option value="">Tất cả loại</option>
            {loaiList.map(l => <option key={l} value={l}>{LOAI_LABEL[l] || l}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">✅ Còn hiệu lực</option>
            <option value="expired">⏰ Hết hạn</option>
          </select>
          {(search || filterLoai || filterStatus !== 'all') && (
            <button onClick={() => { setSearch(''); setFilterLoai(''); setFilterStatus('all') }}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm hover:border-red-300 hover:text-red-500 transition-colors bg-white">
              Xoá lọc
            </button>
          )}
        </div>

        {/* Main: table + detail */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Cache table */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>
            <div className="overflow-x-auto" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ ...TH }}>Câu hỏi</th>
                    <th style={{ ...TH, borderRight: 'none' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={2} className="text-center py-16 text-gray-400 bg-white">Đang tải...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center py-16 text-gray-400 bg-white">
                        <Database className="mx-auto mb-2 text-gray-300" size={36} strokeWidth={1.5} />
                        Không tìm thấy kết quả nào
                      </td>
                    </tr>
                  ) : filtered.map((e, i) => {
                    const even = i % 2 === 0
                    const expired = isExpired(e.het_han_luc as string)
                    const isActive = selected?.id === e.id
                    return (
                      <tr key={e.id as string} onClick={() => setSelected(e)}
                        style={{ background: isActive ? '#dbeafe' : even ? '#f1f5f9' : '#ffffff', cursor: 'pointer', opacity: expired ? 0.6 : 1 }}
                        className="hover:!bg-blue-50 transition-colors">
                        <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px' }}>
                          <p className="text-[13px] text-gray-800 line-clamp-2 m-0">{e.noi_dung_cau_hoi as string}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {!!e.loai_ngucan_ai && (
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${LOAI_BADGE[e.loai_ngucan_ai as string] || LOAI_BADGE.general}`}>
                                {LOAI_LABEL[e.loai_ngucan_ai as string] || (e.loai_ngucan_ai as string)}
                              </span>
                            )}
                            <span className="text-[12px] text-gray-500">{e.so_lan_dung as number} lần dùng</span>
                          </div>
                        </td>
                        <td style={{ borderBottom: CELL_BORDER, padding: '12px 16px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                          <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${expired ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                            {expired ? 'Hết hạn' : 'Còn hạn'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && (
              <div className="px-4 py-3 flex items-center justify-between text-sm text-gray-500" style={{ background: '#f8fafc', borderTop: '2px solid #c2cfe0' }}>
                <span>Tổng <strong className="text-[#1e3a5f]">{filtered.length}</strong> mục</span>
                {filtered.length !== cache.length && <span className="text-gray-600">Lọc từ {cache.length} mục</span>}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden shadow-md bg-white flex flex-col" style={{ border: '2px solid #b0bfd4', minHeight: '70vh' }}>
            {selected ? (
              <>
                <div className="flex items-center justify-between px-5 py-3.5 flex-wrap gap-2" style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
                  <div className="text-white font-bold text-[15px]">Chi tiết cache</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${isExpired(selected.het_han_luc as string) ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                      {isExpired(selected.het_han_luc as string) ? '⏰ Hết hạn' : '✅ Còn hiệu lực'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-white/10 text-white">{selected.so_lan_dung as number} lượt</span>
                    <button onClick={() => deleteEntry(selected)}
                      className="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-red-500/20 text-red-100 hover:bg-red-500/40 transition-colors">
                      🗑 Xóa
                    </button>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-4 overflow-y-auto">
                  <div>
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Câu hỏi</div>
                    <div className="p-3 rounded-xl text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap" style={{ background: '#f1f5f9' }}>
                      {selected.noi_dung_cau_hoi as string}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Phản hồi AI</div>
                    <div className="p-3 rounded-xl text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap" style={{ background: '#f0fdf4', maxHeight: 280, overflowY: 'auto' }}>
                      {selected.cau_tra_loi_ai as string}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Nguồn AI', value: LOAI_LABEL[selected.loai_ngucan_ai as string] || (selected.loai_ngucan_ai as string) || '–' },
                      { label: 'Tạo lúc',  value: fmtDate(selected.created_at as string) },
                      { label: 'Hết hạn',  value: fmtDate(selected.het_han_luc as string) },
                      { label: 'Hash',     value: (selected.ma_hash_prompt as string)?.slice(0, 16) + '…' },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div className="text-[11px] text-gray-400 mb-1">{s.label}</div>
                        <div className="text-[13px] font-semibold text-gray-800 font-mono break-all">{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 py-20">
                <Database size={40} strokeWidth={1.5} className="text-gray-300" />
                <div className="font-semibold text-[15px] text-gray-500">Chọn một mục cache để xem chi tiết</div>
                <div className="text-sm">{filtered.length} mục đang hiển thị</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}