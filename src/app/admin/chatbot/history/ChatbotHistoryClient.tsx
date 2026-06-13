'use client'
import { useState, useMemo, useEffect } from 'react'
import { Search, MessageSquare, Users, Calendar, Mail, Download, X, Bot, User } from 'lucide-react'

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
    <div onClick={dismiss} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'chOverlayIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, border: `2px solid ${ACCENT}`, overflow: 'hidden', position: 'relative', boxShadow: '0 16px 48px rgba(10,20,50,0.18)', animation: 'chModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: 'DM Sans, sans-serif' }}>
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
        @keyframes chOverlayIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes chModalIn { from { opacity: 0; transform: scale(0.88) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  )
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
type Msg = Record<string, unknown>

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

const LOAI_LABEL: Record<string, string> = {
  general: 'Hội thoại', grammar: 'Ngữ pháp', writing: 'Writing', vocabulary: 'Từ vựng',
}
const LOAI_BADGE: Record<string, string> = {
  general:    'bg-slate-100 text-slate-700 border border-slate-200',
  grammar:    'bg-blue-100 text-blue-700 border border-blue-200',
  writing:    'bg-amber-100 text-amber-700 border border-amber-200',
  vocabulary: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
}

// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════
export default function ChatbotHistoryClient({ messages }: { messages: Msg[] }) {
  const [search, setSearch] = useState('')
  const [filterLoai, setFilterLoai] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const sessions = useMemo(() => {
    const map = new Map<string, { phien_id: string; user: Record<string, string> | null; msgs: Msg[]; last: string; loai: string }>()
    for (const m of messages) {
      const pid = m.phien_id as string
      if (!map.has(pid)) {
        map.set(pid, { phien_id: pid, user: m.NguoiDung as Record<string, string> | null, msgs: [], last: m.created_at as string, loai: (m.loai_ngucan as string) || 'general' })
      }
      map.get(pid)!.msgs.push(m)
    }
    return Array.from(map.values()).sort((a, b) => b.last.localeCompare(a.last))
  }, [messages])

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    return {
      totalSessions: sessions.length,
      totalMsgs: messages.length,
      todaySessions: sessions.filter(s => new Date(s.last).toDateString() === today).length,
      uniqueUsers: new Set(sessions.map(s => s.user?.ma_sinh_vien).filter(Boolean)).size,
    }
  }, [sessions, messages])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return sessions.filter(s => {
      const matchSearch = !q || (s.user?.ho_ten || '').toLowerCase().includes(q) || (s.user?.ma_sinh_vien || '').toLowerCase().includes(q)
      const matchLoai = !filterLoai || s.loai === filterLoai
      const matchDate = !filterDate || new Date(s.last).toISOString().slice(0, 10) === filterDate
      return matchSearch && matchLoai && matchDate
    })
  }, [sessions, search, filterLoai, filterDate])

  const current = selected ? sessions.find(s => s.phien_id === selected) : null

  function exportCSV() {
    const rows = [['Sinh viên', 'Mã SV', 'Thời gian', 'Loại', 'Số tin']]
    for (const s of filtered) rows.push([s.user?.ho_ten || 'Ẩn danh', s.user?.ma_sinh_vien || '', fmtDate(s.last), LOAI_LABEL[s.loai] || s.loai, String(s.msgs.length)])
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `chatbot-history-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    showToast('success', 'Đã xuất file CSV', `${filtered.length} phiên đã được xuất`)
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
      <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily: 'DM Sans,sans-serif' }}>

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">LỊCH SỬ CHATBOT</h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              Tổng <span className="font-semibold text-[#1e3a5f]">{stats.totalSessions}</span> phiên hội thoại
              {filtered.length !== sessions.length && (
                <> · đang lọc <span className="font-semibold text-[#1e3a5f]">{filtered.length}</span> kết quả</>
              )}
            </p>
          </div>
          <button onClick={exportCSV}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
            <Download size={16} strokeWidth={2.5} /> Xuất CSV
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <StatCard label="Tổng phiên"    value={stats.totalSessions} color="#1e3a5f" icon={<MessageSquare size={22} />} />
          <StatCard label="Hôm nay"       value={stats.todaySessions} color="#2563eb" icon={<Calendar size={22} />} />
          <StatCard label="Sinh viên"     value={stats.uniqueUsers}   color="#059669" icon={<Users size={22} />} />
          <StatCard label="Tổng tin nhắn" value={stats.totalMsgs}      color="#C9A84C" icon={<Mail size={22} />} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo họ tên, MSSV..."
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
            {Object.entries(LOAI_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white" />
          {(search || filterLoai || filterDate) && (
            <button onClick={() => { setSearch(''); setFilterLoai(''); setFilterDate('') }}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm hover:border-red-300 hover:text-red-500 transition-colors bg-white">
              Xoá lọc
            </button>
          )}
        </div>

        {/* Main: table + detail */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Sessions table */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>
            <div className="overflow-x-auto" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ ...TH }}>Sinh viên</th>
                    <th style={{ ...TH }}>Loại</th>
                    <th style={{ ...TH, borderRight: 'none' }}>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-16 text-gray-400 bg-white">
                        <MessageSquare className="mx-auto mb-2 text-gray-300" size={36} strokeWidth={1.5} />
                        Không tìm thấy kết quả nào
                      </td>
                    </tr>
                  ) : filtered.map((s, i) => {
                    const even = i % 2 === 0
                    const isActive = selected === s.phien_id
                    return (
                      <tr key={s.phien_id} onClick={() => setSelected(s.phien_id)}
                        style={{ background: isActive ? '#dbeafe' : even ? '#f1f5f9' : '#ffffff', cursor: 'pointer' }}
                        className="hover:!bg-blue-50 transition-colors">
                        <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px' }}>
                          <div className="font-semibold text-gray-800 text-[14px]">{s.user?.ho_ten || 'Ẩn danh'}</div>
                          <div className="text-[12px] font-mono text-gray-500">{s.user?.ma_sinh_vien}</div>
                          <div className="text-[12px] text-gray-500 mt-1 truncate max-w-[200px]">
                            {s.msgs[0]?.noi_dung as string}
                          </div>
                        </td>
                        <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${LOAI_BADGE[s.loai] || LOAI_BADGE.general}`}>
                            {LOAI_LABEL[s.loai] || s.loai}
                          </span>
                          <div className="text-[12px] text-gray-500 mt-1.5">{s.msgs.length} tin</div>
                        </td>
                        <td style={{ borderBottom: CELL_BORDER, padding: '12px 16px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                          <span className="text-sm text-gray-700">{fmtDateShort(s.last)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && (
              <div className="px-4 py-3 flex items-center justify-between text-sm text-gray-500" style={{ background: '#f8fafc', borderTop: '2px solid #c2cfe0' }}>
                <span>Tổng <strong className="text-[#1e3a5f]">{filtered.length}</strong> phiên</span>
                {filtered.length !== sessions.length && <span className="text-gray-600">Lọc từ {sessions.length} phiên</span>}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden shadow-md bg-white flex flex-col" style={{ border: '2px solid #b0bfd4', height: '70vh' }}>
            {current ? (
              <>
                <div className="flex items-center justify-between px-5 py-3.5" style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
                  <div>
                    <div className="text-white font-bold text-[15px]">{current.user?.ho_ten || 'Ẩn danh'}</div>
                    <div className="text-blue-200 text-xs font-mono">{current.user?.ma_sinh_vien}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${LOAI_BADGE[current.loai] || LOAI_BADGE.general}`}>
                    {LOAI_LABEL[current.loai] || current.loai}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f8fafc' }}>
                  {[...current.msgs].reverse().map(m => (
                    <div key={m.id as string} className="flex gap-2.5" style={{ justifyContent: m.vai_tro === 'user' ? 'flex-end' : 'flex-start' }}>
                      {m.vai_tro === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: ACCENT, color: '#fff' }}>
                          <Bot size={16} />
                        </div>
                      )}
                      <div className="max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                        style={{
                          background: m.vai_tro === 'user' ? ACCENT : '#fff',
                          color: m.vai_tro === 'user' ? '#fff' : '#111827',
                          border: m.vai_tro === 'user' ? 'none' : '1px solid #e2e8f0',
                          borderTopRightRadius: m.vai_tro === 'user' ? 4 : 16,
                          borderTopLeftRadius: m.vai_tro === 'user' ? 16 : 4,
                        }}>
                        <p className="whitespace-pre-wrap m-0">{m.noi_dung as string}</p>
                        <div className="text-[11px] mt-1.5" style={{ color: m.vai_tro === 'user' ? 'rgba(255,255,255,.5)' : '#9ca3af' }}>
                          {fmtDate(m.created_at as string)}
                        </div>
                      </div>
                      {m.vai_tro === 'user' && (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-gray-200 text-gray-600">
                          <User size={16} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                <MessageSquare size={40} strokeWidth={1.5} className="text-gray-300" />
                <div className="font-semibold text-[15px] text-gray-500">Chọn một phiên để xem hội thoại</div>
                <div className="text-sm">{filtered.length} phiên đang hiển thị</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}