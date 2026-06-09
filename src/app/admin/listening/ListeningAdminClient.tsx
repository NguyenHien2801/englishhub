'use client'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Trash2, Headphones, Search,
  ChevronLeft, ChevronRight, Pencil, X,
  Clock, BarChart2, CheckCircle, AlertCircle, FileText,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════
   ALERT / TOAST SYSTEM  (copy từ VocabAdmin)
═══════════════════════════════════════════════════════════ */
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
  success: {
    chip: 'Thành công', btnLabel: 'Đóng',
    iconPath: <><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></>,
  },
  error: {
    chip: 'Lỗi hệ thống', btnLabel: 'Đã hiểu',
    iconPath: <><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></>,
  },
  warning: {
    chip: 'Cảnh báo', btnLabel: 'Được rồi',
    iconPath: <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />,
  },
  info: {
    chip: 'Thông tin', btnLabel: 'Đóng',
    iconPath: <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
}

function AlertContainer() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  _setAlerts = setAlerts

  useEffect(() => {
    if (alerts.length === 0) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAlerts(prev => prev.slice(1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [alerts.length])

  if (alerts.length === 0) return null
  const current = alerts[0]
  const meta = ALERT_META[current.type]
  function dismiss() { setAlerts(prev => prev.slice(1)) }

  return (
    <div onClick={dismiss} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      animation: 'ahOverlayIn 0.18s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16,
        border: `2px solid ${ACCENT}`, overflow: 'hidden', position: 'relative',
        boxShadow: '0 16px 48px rgba(10,20,50,0.18)',
        animation: 'ahModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        <button onClick={dismiss} style={{
          position: 'absolute', top: 12, right: 12, width: 28, height: 28,
          borderRadius: 8, border: 'none', background: 'rgba(30,58,95,0.08)',
          color: ACCENT, cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', transition: 'background 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,58,95,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,58,95,0.08)' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div style={{ padding: '24px 24px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: 'rgba(30,58,95,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
              stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {meta.iconPath}
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0f2847', marginBottom: 5 }}>
              {meta.chip}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
              {current.title}
            </div>
            {current.message && (
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '6px 0 0' }}>
                {current.message}
              </p>
            )}
          </div>
        </div>
        <div style={{ padding: '12px 24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: `1px solid rgba(30,58,95,0.12)` }}>
          <button onClick={dismiss} style={{
            padding: '9px 22px', borderRadius: 10, border: 'none', background: ACCENT,
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', transition: 'opacity 0.15s, transform 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}>
            {meta.btnLabel}
          </button>
        </div>
        {alerts.length > 1 && (
          <div style={{
            position: 'absolute', top: 10, right: 46,
            background: ACCENT, color: '#fff', fontSize: 10, fontWeight: 700,
            borderRadius: 20, padding: '2px 8px',
          }}>+{alerts.length - 1}</div>
        )}
      </div>
      <style>{`
        @keyframes ahOverlayIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ahModalIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   CONFIRM DIALOG  (copy từ VocabAdmin)
═══════════════════════════════════════════════════════════ */
type ConfirmVariant = 'danger' | 'warning' | 'info'
type ConfirmOptions = { title: string; message?: string; confirmText?: string; cancelText?: string; variant?: ConfirmVariant }
type ConfirmState  = ConfirmOptions & { resolve: (v: boolean) => void }

const CONFIRM_ICON: Record<ConfirmVariant, React.ReactNode> = {
  danger: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2}>
      <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  warning: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2}>
      <path strokeLinecap="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2}>
      <path strokeLinecap="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

function ConfirmDialog({ state, onResolve }: { state: ConfirmState; onResolve: (v: boolean) => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onResolve(false)
      if (e.key === 'Enter')  onResolve(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onResolve])

  const variant = state.variant ?? 'danger'
  return (
    <div ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onResolve(false) }} style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      animation: 'cfOverlayIn 0.18s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16,
        border: `2px solid ${ACCENT}`, overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
        animation: 'cfPopIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        <div style={{ padding: '24px 24px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: 'rgba(30,58,95,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {CONFIRM_ICON[variant]}
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
              {state.title}
            </div>
            {state.message && (
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '6px 0 0' }}>
                {state.message}
              </p>
            )}
          </div>
        </div>
        <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: `1px solid rgba(30,58,95,0.12)` }}>
          <button onClick={() => onResolve(false)} style={{
            padding: '9px 20px', borderRadius: 10,
            border: `1.5px solid rgba(30,58,95,0.25)`, background: '#fff',
            color: '#374151', fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'background 0.15s',
          }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = '#f9fafb' }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = '#fff' }}>
            {state.cancelText ?? 'Hủy'}
          </button>
          <button onClick={() => onResolve(true)} style={{
            padding: '9px 22px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#0f2847,#1e3a5f)',
            color: '#fff', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.opacity = '0.85' }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.opacity = '1' }}>
            {state.confirmText ?? 'Xác nhận'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes cfOverlayIn { from { opacity:0 } to { opacity:1 } }
        @keyframes cfPopIn {
          from { opacity:0; transform: scale(0.88) translateY(12px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null)
  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>(resolve => { setState({ ...opts, resolve }) })
  }, [])
  const handleResolve = useCallback((val: boolean) => {
    state?.resolve(val); setState(null)
  }, [state])
  const dialog = state ? <ConfirmDialog state={state} onResolve={handleResolve} /> : null
  return { confirm, dialog }
}

/* ─────────────── constants ─────────────── */
const CERTS  = ['VSTEP', 'TOEIC', 'APTIS']
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const Q_TYPES = [
  { value: 'trac_nghiem',    label: 'Trắc nghiệm'        },
  { value: 'dien_cho_trong', label: 'Điền vào chỗ trống' },
  { value: 'true_false',     label: 'Đúng / Sai'         },
  { value: 'nghe_tu_vung',   label: 'Nghe từ vựng'       },
]
const PAGE_SIZE = 20

const LEVEL_COLOR: Record<string, string> = {
  A1: 'bg-[#ede9fe] text-[#7c3aed]',
  A2: 'bg-[#e0f2fe] text-[#0369a1]',
  B1: 'bg-[#dcfce7] text-[#15803d]',
  B2: 'bg-[#fef9c3] text-[#a16207]',
  C1: 'bg-[#fee2e2] text-[#dc2626]',
  C2: 'bg-[#fae8ff] text-[#9333ea]',
}
const CERT_COLOR: Record<string, string> = {
  VSTEP: 'bg-teal-100 text-teal-700',
  TOEIC: 'bg-purple-100 text-purple-700',
  APTIS: 'bg-pink-100 text-pink-700',
}
const Q_TYPE_COLOR: Record<string, string> = {
  trac_nghiem:    'bg-[#F0F0FF] text-[#5b21b6]',
  dien_cho_trong: 'bg-[#FFF8EC] text-[#b45309]',
  true_false:     'bg-[#ECFDF5] text-[#059669]',
  nghe_tu_vung:   'bg-[#FFF1F2] text-[#e11d48]',
}

const TH: React.CSSProperties = {
  background: 'linear-gradient(180deg, #2d4e7a 0%, #1e3a5f 100%)',
  color: 'rgba(226,232,240,0.82)',
  padding: '11px 14px',
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  borderBottom: '2px solid rgba(147,197,253,0.2)',
}
const CELL_BORDER = '1px solid #c2cfe0'
const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]/60 transition-colors bg-white'
const filterSelectCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#1e3a5f]/60 transition-colors bg-white text-gray-700 cursor-pointer'

const emptyLesson = {
  tieu_de: '', mo_ta: '', cap_do: 'B1', loai_chung_chi: 'VSTEP',
  chu_de: '', video_url: '', script: '', thoi_gian_giay: 300,
}
const emptyQuestion = {
  noi_dung: '', loai_cau_hoi: 'trac_nghiem', so_thu_tu: 1,
  cac_lua_chon: ['', '', '', ''],
  dap_an_dung: 'A', giai_thich: '',
}
function LessonFields({ values, onChange }: {
  values: typeof emptyLesson
  onChange: (patch: Partial<typeof emptyLesson>) => void
}) {
  return (
    <div className="px-6 py-5 space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Tiêu đề *</label>
        <input className={inputCls} placeholder="VD: VSTEP B1 – Listening Practice Test 1"
          value={values.tieu_de} onChange={e => onChange({ tieu_de: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Mô tả</label>
        <input className={inputCls} placeholder="Mô tả nội dung bài nghe..."
          value={values.mo_ta} onChange={e => onChange({ mo_ta: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Chứng chỉ</label>
          <select className={inputCls} value={values.loai_chung_chi}
            onChange={e => onChange({ loai_chung_chi: e.target.value })}>
            {CERTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Cấp độ</label>
          <select className={inputCls} value={values.cap_do}
            onChange={e => onChange({ cap_do: e.target.value })}>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Thời gian (giây)</label>
          <input type="number" className={inputCls} value={values.thoi_gian_giay}
            onChange={e => onChange({ thoi_gian_giay: +e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Chủ đề</label>
        <input className={inputCls} placeholder="VD: Environment, Technology..."
          value={values.chu_de} onChange={e => onChange({ chu_de: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">URL Video / Audio</label>
        <input className={inputCls} placeholder="https://..."
          value={values.video_url} onChange={e => onChange({ video_url: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Script (bản ghi)</label>
        <textarea className={`${inputCls} resize-none font-mono`} rows={4}
          placeholder="Dán nội dung script bài nghe vào đây..."
          value={values.script} onChange={e => onChange({ script: e.target.value })} />
      </div>
    </div>
  )
}

function QuestionFields({ values, onChange }: {
  values: typeof emptyQuestion
  onChange: (patch: Partial<typeof emptyQuestion>) => void
}) {
  const isTN = values.loai_cau_hoi === 'trac_nghiem' || values.loai_cau_hoi === 'nghe_tu_vung'
  const isTF = values.loai_cau_hoi === 'true_false'
  return (
    <div className="px-6 py-5 space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Nội dung câu hỏi *</label>
        <textarea className={`${inputCls} resize-none`} rows={3}
          placeholder="Nhập nội dung câu hỏi..."
          value={values.noi_dung} onChange={e => onChange({ noi_dung: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Loại câu hỏi</label>
          <select className={inputCls} value={values.loai_cau_hoi}
            onChange={e => onChange({ loai_cau_hoi: e.target.value, dap_an_dung: 'A' })}>
            {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Số thứ tự</label>
          <input type="number" className={inputCls} value={values.so_thu_tu}
            onChange={e => onChange({ so_thu_tu: +e.target.value })} />
        </div>
      </div>
      {isTN && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {['A', 'B', 'C', 'D'].map((opt, idx) => (
              <div key={opt}>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Đáp án {opt}</label>
                <input className={inputCls} placeholder={`Đáp án ${opt}...`}
                  value={(values.cac_lua_chon as string[])[idx] || ''}
                  onChange={e => {
                    const updated = [...(values.cac_lua_chon as string[])]
                    updated[idx] = e.target.value
                    onChange({ cac_lua_chon: updated })
                  }} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Đáp án đúng</label>
            <select className={inputCls} value={values.dap_an_dung}
              onChange={e => onChange({ dap_an_dung: e.target.value })}>
              {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </>
      )}
      {isTF && (
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Đáp án đúng</label>
          <select className={inputCls} value={values.dap_an_dung}
            onChange={e => onChange({ dap_an_dung: e.target.value })}>
            <option value="True">True (Đúng)</option>
            <option value="False">False (Sai)</option>
          </select>
        </div>
      )}
      {values.loai_cau_hoi === 'dien_cho_trong' && (
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Đáp án đúng (chuỗi chính xác)</label>
          <input className={inputCls} placeholder="VD: environmental"
            value={values.dap_an_dung} onChange={e => onChange({ dap_an_dung: e.target.value })} />
        </div>
      )}
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Giải thích (tuỳ chọn)</label>
        <textarea className={`${inputCls} resize-none`} rows={2}
          placeholder="Giải thích tại sao đây là đáp án đúng..."
          value={values.giai_thich} onChange={e => onChange({ giai_thich: e.target.value })} />
      </div>
    </div>
  )
}

function Modal({ title, subtitle, onClose, onSave, saveLabel, children }: {
  title: string; subtitle?: string; onClose: () => void; onSave: () => void
  saveLabel: string; children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,20,40,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
          <div>
            <div className="text-white font-bold text-base">{title}</div>
            {subtitle && <div className="text-blue-200 text-xs mt-0.5 truncate max-w-[300px]">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X size={18} strokeWidth={2.5} /></button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
        <div className="px-6 pb-5 pt-3 flex gap-3 justify-end flex-shrink-0 border-t border-gray-100">
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">Hủy</button>
          <button onClick={onSave}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>{saveLabel}</button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── sub-components ─────────────── */
function StatCard({ label, value, icon, color }: {
  label: string; value: number | string; icon: React.ReactNode; color: string
}) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3" style={{
      border: `2px solid ${color}30`,
      background: `linear-gradient(135deg, #fff 60%, ${color}0d 100%)`,
    }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15`, color, border: `1.5px solid ${color}25` }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-1">{label}</div>
      </div>
    </div>
  )
}

/* ─────────────── main component ─────────────── */
export default function ListeningAdminClient({ lessons: init }: { lessons: Record<string, unknown>[] }) {
  // ── popup system ──
  const { confirm, dialog } = useConfirm()

  const [lessons, setLessons] = useState(init)
  const [selectedLesson, setSelectedLesson] = useState<Record<string, unknown> | null>(null)
  const [questions, setQuestions] = useState<Record<string, unknown>[]>([])
  const [loadingQ, setLoadingQ]   = useState(false)
  const [activeTab, setActiveTab] = useState<'questions' | 'script'>('questions')

  const [showNewLesson,  setShowNewLesson]  = useState(false)
  const [showEditLesson, setShowEditLesson] = useState(false)
  const [lessonForm,     setLessonForm]     = useState({ ...emptyLesson })
  const [editLessonForm, setEditLessonForm] = useState({ ...emptyLesson })

  const [showNewQuestion,  setShowNewQuestion]  = useState(false)
  const [showEditQuestion, setShowEditQuestion] = useState(false)
  const [questionForm,     setQuestionForm]     = useState({ ...emptyQuestion })
  const [editQuestionData, setEditQuestionData] = useState<Record<string, unknown> | null>(null)
  const [editQuestionForm, setEditQuestionForm] = useState({ ...emptyQuestion })

  const [filterCert,   setFilterCert]   = useState('')
  const [filterLevel,  setFilterLevel]  = useState('')
  const [searchLesson, setSearchLesson] = useState('')
  const [searchQ,      setSearchQ]      = useState('')
  const [filterQType,  setFilterQType]  = useState('')
  const [page, setPage] = useState(1)

  const supabase = createClient()

  const filteredLessons = useMemo(() => lessons.filter(l => {
    const matchCert   = !filterCert   || l.loai_chung_chi === filterCert
    const matchLevel  = !filterLevel  || l.cap_do          === filterLevel
    const matchSearch = !searchLesson || (l.tieu_de as string).toLowerCase().includes(searchLesson.toLowerCase())
    return matchCert && matchLevel && matchSearch
  }), [lessons, filterCert, filterLevel, searchLesson])

  const filteredQ = useMemo(() => {
    setPage(1)
    return questions.filter(q => {
      const matchSearch = !searchQ     || (q.noi_dung as string).toLowerCase().includes(searchQ.toLowerCase())
      const matchType   = !filterQType || q.loai_cau_hoi === filterQType
      return matchSearch && matchType
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, searchQ, filterQType])

  const totalPages = Math.max(1, Math.ceil(filteredQ.length / PAGE_SIZE))
  const pagedQ     = filteredQ.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasQFilter = searchQ || filterQType

  function fmtTime(secs: number) {
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  }

  async function loadQuestions(lesson: Record<string, unknown>) {
    setSelectedLesson(lesson)
    setActiveTab('questions')
    setLoadingQ(true)
    setSearchQ(''); setFilterQType(''); setPage(1)
    const { data } = await supabase
      .from('BaiNgheCauHoi').select('*')
      .eq('bai_nghe_id', lesson.id).order('so_thu_tu')
    setQuestions(data || [])
    setLoadingQ(false)
  }

  /* ── CRUD lessons ── */
  async function saveNewLesson() {
    if (!lessonForm.tieu_de.trim()) {
      showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập tiêu đề bài nghe')
      return
    }
    const res = await fetch('/api/admin/listening', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _table: 'BaiNghe', ...lessonForm, luot_lam: 0, da_kiem_duyet: false }),
    })
    const data = await res.json()
    if (!res.ok) { showToast('error', 'Thêm thất bại', data.error); return }
    setLessons(prev => [data, ...prev])
    setLessonForm({ ...emptyLesson })
    setShowNewLesson(false)
    showToast('success', 'Đã thêm bài nghe!')
  }

  function openEditLesson(lesson: Record<string, unknown>, e: React.MouseEvent) {
    e.stopPropagation()
    setEditLessonForm({
      tieu_de:        lesson.tieu_de        as string || '',
      mo_ta:          lesson.mo_ta          as string || '',
      cap_do:         lesson.cap_do         as string || 'B1',
      loai_chung_chi: lesson.loai_chung_chi as string || 'VSTEP',
      chu_de:         lesson.chu_de         as string || '',
      video_url:      lesson.video_url      as string || '',
      script:         lesson.script         as string || '',
      thoi_gian_giay: lesson.thoi_gian_giay as number || 300,
    })
    setSelectedLesson(lesson)
    setShowEditLesson(true)
  }

  async function saveEditLesson() {
    if (!selectedLesson) return
    const res = await fetch('/api/admin/listening', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _table: 'BaiNghe', id: selectedLesson.id, ...editLessonForm }),
    })
    const data = await res.json()
    if (!res.ok) { showToast('error', 'Cập nhật thất bại', data.error); return }
    setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, ...data } : l))
    setSelectedLesson(prev => prev ? { ...prev, ...data } : prev)
    setShowEditLesson(false)
    showToast('success', 'Đã cập nhật bài nghe!')
  }

  async function deleteLesson(id: string) {
    const ok = await confirm({
      title: 'Xóa bài nghe này?',
      message: 'Tất cả câu hỏi trong bài cũng sẽ bị xóa vĩnh viễn, không thể khôi phục.',
      confirmText: '🗑 Xóa vĩnh viễn',
      cancelText: 'Giữ lại',
      variant: 'danger',
    })
    if (!ok) return
    await fetch(`/api/admin/listening?id=${id}&table=BaiNgheCauHoi`, { method: 'DELETE' })
    await fetch(`/api/admin/listening?id=${id}&table=BaiNghe`, { method: 'DELETE' })
    setLessons(prev => prev.filter(l => l.id !== id))
    if (selectedLesson?.id === id) { setSelectedLesson(null); setQuestions([]) }
    showToast('success', 'Đã xóa bài nghe')
  }

  async function toggleKiemDuyet(id: string, cur: boolean) {
    const res = await fetch('/api/admin/listening', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _table: 'BaiNghe', id, da_kiem_duyet: !cur }),
    })
    if (!res.ok) { showToast('error', 'Cập nhật thất bại'); return }
    setLessons(prev => prev.map(l => l.id === id ? { ...l, da_kiem_duyet: !cur } : l))
    setSelectedLesson(prev => prev?.id === id ? { ...prev, da_kiem_duyet: !cur } : prev)
    showToast('success', !cur ? 'Đã duyệt bài' : 'Đã bỏ duyệt')
  }

  /* ── CRUD questions ── */
  async function saveNewQuestion() {
    if (!questionForm.noi_dung.trim() || !selectedLesson) return
    const res = await fetch('/api/admin/listening', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...questionForm, bai_nghe_id: selectedLesson.id }),
    })
    const data = await res.json()
    if (!res.ok) { showToast('error', 'Thêm thất bại', data.error); return }
    setQuestions(prev => [...prev, data])
    setQuestionForm({ ...emptyQuestion, so_thu_tu: questions.length + 2 })
    setShowNewQuestion(false)
    showToast('success', 'Đã thêm câu hỏi!')
  }

  function openEditQuestion(q: Record<string, unknown>) {
    setEditQuestionData(q)
    setEditQuestionForm({
      noi_dung:     q.noi_dung     as string || '',
      loai_cau_hoi: q.loai_cau_hoi as string || 'trac_nghiem',
      so_thu_tu:    q.so_thu_tu    as number || 1,
      cac_lua_chon: Array.isArray(q.cac_lua_chon) ? q.cac_lua_chon : ['', '', '', ''],
      dap_an_dung:  q.dap_an_dung  as string || 'A',
      giai_thich:   q.giai_thich   as string || '',
    })
    setShowEditQuestion(true)
  }

  async function saveEditQuestion() {
    if (!editQuestionData) return
    const res = await fetch('/api/admin/listening', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editQuestionData.id, ...editQuestionForm }),
    })
    const data = await res.json()
    if (!res.ok) { showToast('error', 'Cập nhật thất bại', data.error); return }
    setQuestions(prev => prev.map(q =>
      q.id === editQuestionData.id ? { ...q, ...editQuestionForm } : q
    ))
    setShowEditQuestion(false)
    setEditQuestionData(null)
    showToast('success', 'Đã cập nhật câu hỏi!')
  }

  async function deleteQuestion(id: string) {
    const q = questions.find(q => q.id === id)
    const ok = await confirm({
      title: 'Xóa câu hỏi này?',
      message: q?.noi_dung ? `"${(q.noi_dung as string).slice(0, 60)}…"` : 'Câu hỏi sẽ bị xóa vĩnh viễn.',
      confirmText: '🗑 Xóa',
      cancelText: 'Giữ lại',
      variant: 'danger',
    })
    if (!ok) return
    const res = await fetch(`/api/admin/listening?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { showToast('error', 'Xóa thất bại'); return }
    setQuestions(prev => prev.filter(q => q.id !== id))
    showToast('success', 'Đã xóa câu hỏi')
  }

  /* ─────────── render ─────────── */
  return (
    <>
      <AlertContainer />
      {dialog}

      <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QUẢN LÝ BÀI NGHE</h1>
          </div>
          <button onClick={() => setShowNewLesson(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
            <Plus size={16} strokeWidth={2.5} /> Thêm bài nghe
          </button>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <StatCard label="Tổng bài nghe" value={lessons.length}
            color="#1e3a5f" icon={<Headphones size={22} />} />
          <StatCard label="Bài VSTEP" value={lessons.filter(l => l.loai_chung_chi === 'VSTEP').length}
            color="#0d9488" icon={<CheckCircle size={22} />} />
          <StatCard label="Bài TOEIC" value={lessons.filter(l => l.loai_chung_chi === 'TOEIC').length}
            color="#7c3aed" icon={<BarChart2 size={22} />} />
          <StatCard label="Chờ duyệt" value={lessons.filter(l => !l.da_kiem_duyet).length}
            color="#d97706" icon={<AlertCircle size={22} />} />
        </div>

        <div className="grid lg:grid-cols-4 gap-5">

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>
              <div className="px-4 py-3"
                style={{ background: 'linear-gradient(180deg,#2d4e7a 0%,#1e3a5f 100%)', borderBottom: '2px solid rgba(147,197,253,0.2)' }}>
                <span style={{ color: 'rgba(226,232,240,0.82)', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Danh sách bài nghe
                </span>
              </div>

              <div className="px-3 py-2.5 space-y-2" style={{ background: '#f8fafc', borderBottom: '1px solid #c2cfe0' }}>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={searchLesson} onChange={e => setSearchLesson(e.target.value)} placeholder="Tìm bài nghe..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]/50 bg-white" />
                </div>
                <div className="flex gap-1.5">
                  <select value={filterCert} onChange={e => setFilterCert(e.target.value)} className={`${filterSelectCls} flex-1`}>
                    <option value="">Tất cả loại</option>
                    {CERTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className={`${filterSelectCls} flex-1`}>
                    <option value="">Tất cả cấp</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                {(filterCert || filterLevel || searchLesson) && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#1e3a5f] font-semibold">{filteredLessons.length}/{lessons.length} bài</span>
                    <button onClick={() => { setFilterCert(''); setFilterLevel(''); setSearchLesson('') }}
                      className="text-xs text-red-400 hover:text-red-600 font-semibold">Xóa lọc</button>
                  </div>
                )}
              </div>

              <div className="divide-y divide-[#c2cfe0] max-h-[60vh] overflow-y-auto">
                {filteredLessons.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">Không tìm thấy bài nghe nào</div>
                )}
                {filteredLessons.map(lesson => {
                  const isSelected = selectedLesson?.id === lesson.id
                  return (
                    <div key={lesson.id as string} onClick={() => loadQuestions(lesson)}
                      className="group cursor-pointer transition-colors hover:bg-blue-50"
                      style={{
                        padding: '12px 14px',
                        background: isSelected ? '#eff6ff' : undefined,
                        borderLeft: isSelected ? '3px solid #1e3a5f' : '3px solid transparent',
                      }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">
                            {lesson.tieu_de as string}
                          </div>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${CERT_COLOR[lesson.loai_chung_chi as string] || 'bg-gray-100 text-gray-500'}`}>
                              {lesson.loai_chung_chi as string}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${LEVEL_COLOR[lesson.cap_do as string] || 'bg-gray-100 text-gray-500'}`}>
                              {lesson.cap_do as string}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lesson.da_kiem_duyet ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'}`}>
                              {lesson.da_kiem_duyet ? '✓ Đã duyệt' : 'Chờ duyệt'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                            <Clock size={11} />
                            <span>{fmtTime(lesson.thoi_gian_giay as number)}</span>
                            <span className="mx-1">·</span>
                            <span>{lesson.luot_lam as number} lượt</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={e => openEditLesson(lesson, e)}
                            className="p-1 rounded-lg text-blue-400 border border-blue-200 hover:bg-blue-500 hover:text-white transition-all">
                            <Pencil size={14} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteLesson(lesson.id as string) }}
                            className="p-1 rounded-lg text-red-400 border border-red-200 hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="px-3 py-2.5" style={{ background: '#f8fafc', borderTop: '2px solid #c2cfe0' }}>
                <button onClick={() => setShowNewLesson(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#1e3a5f] py-2 rounded-lg hover:bg-blue-50 transition-colors">
                  <Plus size={13} /> Thêm bài nghe mới
                </button>
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="lg:col-span-3 space-y-4">
            {selectedLesson ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ border: '2px solid #bfdbfe', background: 'linear-gradient(135deg,#fff 60%,#eff6ff)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#dbeafe', color: '#2563eb', border: '1.5px solid #bfdbfe' }}>
                      <BarChart2 size={22} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{questions.length}</div>
                      <div className="text-sm text-gray-500 mt-1">Câu hỏi</div>
                    </div>
                  </div>
                  <div className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ border: '2px solid #a7f3d0', background: 'linear-gradient(135deg,#fff 60%,#ecfdf5)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#d1fae5', color: '#059669', border: '1.5px solid #a7f3d0' }}>
                      <Clock size={22} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{fmtTime(selectedLesson.thoi_gian_giay as number)}</div>
                      <div className="text-sm text-gray-500 mt-1">Thời lượng</div>
                    </div>
                  </div>
                  <div className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ border: '2px solid #fde68a', background: 'linear-gradient(135deg,#fff 60%,#fffbeb)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#fef3c7', color: '#d97706', border: '1.5px solid #fde68a' }}>
                      <Headphones size={22} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{(selectedLesson.luot_lam as number) ?? 0}</div>
                      <div className="text-sm text-gray-500 mt-1">Lượt làm</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>
                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="text-white font-bold text-base line-clamp-1">{selectedLesson.tieu_de as string}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CERT_COLOR[selectedLesson.loai_chung_chi as string] || ''}`}>
                          {selectedLesson.loai_chung_chi as string}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${LEVEL_COLOR[selectedLesson.cap_do as string] || ''}`}>
                          {selectedLesson.cap_do as string}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleKiemDuyet(selectedLesson.id as string, selectedLesson.da_kiem_duyet as boolean)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: selectedLesson.da_kiem_duyet ? 'rgba(255,255,255,0.1)' : '#fff',
                          color: selectedLesson.da_kiem_duyet ? '#fff' : '#1e3a5f',
                          border: selectedLesson.da_kiem_duyet ? '1px solid rgba(255,255,255,0.2)' : 'none',
                        }}>
                        {selectedLesson.da_kiem_duyet ? 'Bỏ duyệt' : '✓ Duyệt bài'}
                      </button>
                    </div>
                  </div>

                  <div className="flex border-b border-[#c2cfe0]" style={{ background: '#f8fafc' }}>
                    {([
                      { key: 'questions', label: `Câu hỏi (${questions.length})`, icon: <BarChart2 size={14} /> },
                      { key: 'script',    label: 'Script / Bản ghi',              icon: <FileText size={14} /> },
                    ] as const).map(tab => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className="flex items-center gap-1.5 px-5 py-3 text-sm font-semibold transition-colors"
                        style={{
                          borderBottom: activeTab === tab.key ? '2px solid #1e3a5f' : '2px solid transparent',
                          color: activeTab === tab.key ? '#1e3a5f' : '#64748b',
                          background: 'transparent',
                          marginBottom: -1,
                        }}>
                        {tab.icon}{tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'questions' && (
                    <>
                      <div className="px-4 pt-3 pb-2 flex items-center gap-2"
                        style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        <div className="relative flex-1 min-w-[140px] max-w-xs">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm câu hỏi..."
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]/50 bg-white" />
                        </div>
                        {searchQ && (
                          <span className="text-xs text-[#1e3a5f] font-semibold whitespace-nowrap">{filteredQ.length}/{questions.length} câu</span>
                        )}
                        <button onClick={() => {
                          setQuestionForm({ ...emptyQuestion, so_thu_tu: questions.length + 1 })
                          setShowNewQuestion(true)
                        }}
                          className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white"
                          style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                          <Plus size={14} strokeWidth={2.5} /> Thêm câu hỏi
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto"
                        style={{ background: '#f1f5f9', borderBottom: '1px solid #c2cfe0' }}>
                        {[{ value: '', label: 'Tất cả', count: questions.length }, ...Q_TYPES.map(t => ({
                          value: t.value, label: t.label,
                          count: questions.filter(q => q.loai_cau_hoi === t.value).length,
                        }))].map(tab => (
                          <button key={tab.value} onClick={() => setFilterQType(tab.value)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
                            style={{
                              background: filterQType === tab.value ? '#1e3a5f' : '#fff',
                              color:      filterQType === tab.value ? '#fff'    : '#64748b',
                              border:     filterQType === tab.value ? 'none'    : '1px solid #e2e8f0',
                            }}>
                            {tab.label}
                            {tab.count > 0 && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                                style={{
                                  background: filterQType === tab.value ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                                  color:      filterQType === tab.value ? '#fff' : '#64748b',
                                }}>
                                {tab.count}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="overflow-x-auto">
                        {loadingQ ? (
                          <div className="text-center py-16 text-gray-400">
                            <div className="w-6 h-6 border-2 border-[#1e3a5f]/30 border-t-[#1e3a5f] rounded-full animate-spin mx-auto mb-3" />
                            Đang tải...
                          </div>
                        ) : (
                          <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead>
                              <tr>
                                {[
                                  { label: 'STT',         minWidth: 48  },
                                  { label: 'Nội dung',    minWidth: 260 },
                                  { label: 'Loại câu',    minWidth: 130 },
                                  { label: 'Đáp án đúng', minWidth: 100 },
                                  { label: 'Thứ tự',      minWidth: 75  },
                                  { label: 'Thao tác',    minWidth: 90  },
                                ].map((col, ci, arr) => (
                                  <th key={col.label} style={{
                                    ...TH, minWidth: col.minWidth,
                                    borderRight: ci < arr.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                                  }}>{col.label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {pagedQ.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="text-center py-16 text-gray-400 bg-white">
                                    <Headphones className="mx-auto mb-3 text-gray-300" size={40} strokeWidth={1.5} />
                                    <div>{questions.length === 0 ? 'Chưa có câu hỏi nào. Thêm câu hỏi mới!' : 'Không tìm thấy câu phù hợp.'}</div>
                                  </td>
                                </tr>
                              ) : pagedQ.map((q, i) => {
                                const even = i % 2 === 0
                                const globalIdx = (page - 1) * PAGE_SIZE + i + 1
                                return (
                                  <tr key={q.id as string}
                                    style={{ background: even ? '#f1f5f9' : '#fff', transition: 'background 0.1s' }}
                                    className="hover:!bg-blue-50 group">
                                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', textAlign: 'center' }}>
                                      <span className="text-sm font-mono font-semibold text-gray-400">{globalIdx}</span>
                                    </td>
                                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px' }}>
                                      <span className="text-gray-800 font-medium line-clamp-2">{q.noi_dung as string}</span>
                                    </td>
                                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', whiteSpace: 'nowrap' }}>
                                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${Q_TYPE_COLOR[q.loai_cau_hoi as string] || 'bg-gray-100 text-gray-500'}`}>
                                        {Q_TYPES.find(t => t.value === q.loai_cau_hoi)?.label ?? q.loai_cau_hoi as string}
                                      </span>
                                    </td>
                                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', textAlign: 'center' }}>
                                      <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                        {q.dap_an_dung as string}
                                      </span>
                                    </td>
                                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', textAlign: 'center' }}>
                                      <span className="text-sm font-mono text-gray-500">{q.so_thu_tu as number}</span>
                                    </td>
                                    <td style={{ borderBottom: CELL_BORDER, padding: '11px 14px' }}>
                                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => openEditQuestion(q)}
                                          className="p-2 rounded-lg text-blue-400 border border-blue-200 hover:bg-blue-500 hover:text-white transition-all">
                                          <Pencil size={14} />
                                        </button>
                                        <button onClick={() => deleteQuestion(q.id as string)}
                                          className="p-2 rounded-lg text-red-400 border border-red-200 hover:bg-red-500 hover:text-white transition-all">
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {filteredQ.length > 0 && (
                        <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
                          style={{ background: '#f8fafc', borderTop: '2px solid #c2cfe0' }}>
                          <span className="text-sm text-gray-500">
                            {hasQFilter
                              ? <>Lọc được <strong className="text-[#1e3a5f]">{filteredQ.length}</strong> / <strong className="text-[#1e3a5f]">{questions.length}</strong> câu</>
                              : <>Tổng <strong className="text-[#1e3a5f]">{questions.length}</strong> câu</>}
                            {totalPages > 1 && <> · Trang <strong className="text-[#1e3a5f]">{page}</strong>/{totalPages}</>}
                          </span>
                          {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                <ChevronLeft size={15} />
                              </button>
                              {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                                  if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                                  acc.push(p); return acc
                                }, [])
                                .map((p, idx) => p === '...'
                                  ? <span key={`e${idx}`} className="px-1 text-gray-400 text-sm">…</span>
                                  : <button key={p} onClick={() => setPage(p as number)}
                                      className="w-8 h-8 rounded-lg text-sm font-semibold transition-colors"
                                      style={{
                                        background: page === p ? 'linear-gradient(135deg,#0f2847,#1e3a5f)' : undefined,
                                        color: page === p ? '#fff' : '#374151',
                                        border: page === p ? 'none' : '1px solid #e5e7eb',
                                      }}>{p}</button>
                                )}
                              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                <ChevronRight size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'script' && (
                    <div className="p-5">
                      {!!selectedLesson.video_url && (
                        <div className="mb-4 p-3 rounded-xl flex items-center gap-3"
                          style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                          <Headphones size={18} className="text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-500 mb-0.5">URL Audio / Video</div>
                            <a href={selectedLesson.video_url as string} target="_blank" rel="noreferrer"
                              className="text-sm text-blue-600 font-medium truncate block hover:underline">
                              {selectedLesson.video_url as string}
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedLesson.script ? (
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed p-4 rounded-xl max-h-[500px] overflow-y-auto"
                          style={{ background: '#f8fafc', border: '1px solid #c2cfe0' }}>
                          {selectedLesson.script as string}
                        </pre>
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <FileText size={36} className="mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
                          <div className="text-sm">Bài này chưa có script.</div>
                          <button onClick={e => openEditLesson(selectedLesson, e as unknown as React.MouseEvent)}
                            className="mt-3 text-sm text-[#1e3a5f] font-semibold hover:underline">
                            Thêm script →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-md flex flex-col items-center justify-center py-20 text-center"
                style={{ border: '2px solid #b0bfd4' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                  <Headphones size={32} color="white" strokeWidth={1.8} />
                </div>
                <div className="font-semibold text-gray-700 text-base">Chọn bài nghe bên trái để xem chi tiết</div>
                <div className="text-sm text-gray-400 mt-1">Hoặc thêm bài nghe mới</div>
              </div>
            )}
          </div>
        </div>

        {showNewLesson && (
          <Modal title="Thêm bài nghe mới" onClose={() => setShowNewLesson(false)}
            onSave={saveNewLesson} saveLabel="Thêm bài nghe">
            <LessonFields values={lessonForm} onChange={patch => setLessonForm(p => ({ ...p, ...patch }))} />
          </Modal>
        )}

        {showEditLesson && selectedLesson && (
          <Modal title="Sửa bài nghe" subtitle={selectedLesson.tieu_de as string}
            onClose={() => setShowEditLesson(false)} onSave={saveEditLesson} saveLabel="Lưu thay đổi">
            <LessonFields values={editLessonForm} onChange={patch => setEditLessonForm(p => ({ ...p, ...patch }))} />
          </Modal>
        )}

        {showNewQuestion && selectedLesson && (
          <Modal title="Thêm câu hỏi" subtitle={selectedLesson.tieu_de as string}
            onClose={() => setShowNewQuestion(false)} onSave={saveNewQuestion} saveLabel="Thêm câu hỏi">
            <QuestionFields values={questionForm} onChange={patch => setQuestionForm(p => ({ ...p, ...patch }))} />
          </Modal>
        )}

        {showEditQuestion && editQuestionData && (
          <Modal title="Sửa câu hỏi" subtitle={`Câu ${editQuestionData.so_thu_tu as number}`}
            onClose={() => { setShowEditQuestion(false); setEditQuestionData(null) }}
            onSave={saveEditQuestion} saveLabel="Lưu thay đổi">
            <QuestionFields values={editQuestionForm} onChange={patch => setEditQuestionForm(p => ({ ...p, ...patch }))} />
          </Modal>
        )}
      </div>
    </>
  )
}