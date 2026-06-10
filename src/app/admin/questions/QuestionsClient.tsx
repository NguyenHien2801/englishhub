'use client'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Trash2, BookOpen, Search,
  ChevronLeft, ChevronRight, Pencil, X, Filter,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════
   ALERT / TOAST SYSTEM
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
   CONFIRM DIALOG
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

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const CERTS  = ['TOEIC', 'VSTEP', 'APTIS', 'LEVEL_TEST']
const SKILLS = ['NGU_PHAP', 'DOC', 'NGHE', 'VIET', 'TU_VUNG']
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
const CERT_COLOR: Record<string, string> = {
  TOEIC:      'bg-purple-100 text-purple-700',
  VSTEP:      'bg-teal-100 text-teal-700',
  APTIS:      'bg-pink-100 text-pink-700',
  LEVEL_TEST: 'bg-blue-100 text-blue-700',
}
const SKILL_COLOR: Record<string, string> = {
  NGU_PHAP: 'bg-[#f3e8ff] text-[#6b21a8]',
  DOC:      'bg-[#dbeafe] text-[#1d4ed8]',
  NGHE:     'bg-[#d1fae5] text-[#065f46]',
  VIET:     'bg-[#fef3c7] text-[#92400e]',
  TU_VUNG:  'bg-[#fce7f3] text-[#9d174d]',
}
const SKILL_LABEL: Record<string, string> = {
  NGU_PHAP: 'Ngữ pháp', DOC: 'Đọc', NGHE: 'Nghe', VIET: 'Viết', TU_VUNG: 'Từ vựng',
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
const filterSelectCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#1e3a5f]/60 transition-colors bg-white text-gray-700 cursor-pointer'

const emptyQ = {
  loai_chung_chi: 'TOEIC', ky_nang: 'NGU_PHAP', so_phan: 5,
  loai_cau_hoi: 'trac_nghiem', noi_dung_cau_hoi: '',
  cac_lua_chon: [{ key: 'A', value: '' }, { key: 'B', value: '' }, { key: 'C', value: '' }, { key: 'D', value: '' }],
  dap_an_dung: 'A', giai_thich: '', cap_do: 'B1',
}

/* ═══════════════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════════════ */
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
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
        <div className="text-2xl font-bold text-gray-900">{value.toLocaleString('vi-VN')}</div>
        <div className="text-sm text-gray-500 mt-1">{label}</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   QUESTION FORM (dùng chung cho thêm + sửa)
═══════════════════════════════════════════════════════════ */
function QuestionForm({
  values, onChange,
}: {
  values: typeof emptyQ
  onChange: (patch: Partial<typeof emptyQ>) => void
}) {
  return (
    <div className="px-6 py-5 space-y-4">
      {/* Row 1: cert / skill / level */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Chứng chỉ</label>
          <select className={inputCls} value={values.loai_chung_chi}
            onChange={e => onChange({ loai_chung_chi: e.target.value })}>
            {CERTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Kỹ năng</label>
          <select className={inputCls} value={values.ky_nang}
            onChange={e => onChange({ ky_nang: e.target.value })}>
            {SKILLS.map(s => <option key={s} value={s}>{SKILL_LABEL[s] ?? s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Cấp độ</label>
          <select className={inputCls} value={values.cap_do}
            onChange={e => onChange({ cap_do: e.target.value })}>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2: part / loai */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Phần (Part)</label>
          <input type="number" className={inputCls} value={values.so_phan}
            onChange={e => onChange({ so_phan: +e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Loại câu hỏi</label>
          <select className={inputCls} value={values.loai_cau_hoi}
            onChange={e => onChange({ loai_cau_hoi: e.target.value })}>
            <option value="trac_nghiem">Trắc nghiệm</option>
            <option value="dien_cho_trong">Điền vào chỗ trống</option>
            <option value="true_false">Đúng / Sai</option>
          </select>
        </div>
      </div>

      {/* Nội dung */}
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Nội dung câu hỏi *</label>
        <textarea className={`${inputCls} resize-vertical font-mono`} rows={3}
          placeholder="The manager _____ all employees to submit their reports by Friday."
          value={values.noi_dung_cau_hoi}
          onChange={e => onChange({ noi_dung_cau_hoi: e.target.value })} />
      </div>

      {/* Đáp án trắc nghiệm */}
      {values.loai_cau_hoi === 'trac_nghiem' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 block">Các lựa chọn</label>
          {(values.cac_lua_chon as { key: string; value: string }[]).map(o => (
            <div key={o.key} className="flex items-center gap-2">
              <button
                onClick={() => onChange({ dap_an_dung: o.key })}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors border"
                style={{
                  background: values.dap_an_dung === o.key ? 'linear-gradient(135deg,#0f2847,#1e3a5f)' : '#f8fafc',
                  color: values.dap_an_dung === o.key ? '#fff' : '#64748b',
                  borderColor: values.dap_an_dung === o.key ? 'transparent' : '#e2e8f0',
                }}>
                {o.key}
              </button>
              <input className={inputCls} placeholder={`Đáp án ${o.key}...`} value={o.value}
                onChange={e => onChange({
                  cac_lua_chon: (values.cac_lua_chon as { key: string; value: string }[]).map(x =>
                    x.key === o.key ? { ...x, value: e.target.value } : x
                  ),
                })} />
            </div>
          ))}
          <p className="text-xs text-gray-400 pt-1">
            Click chữ cái để chọn đáp án đúng — hiện tại: <strong className="text-[#1e3a5f]">{values.dap_an_dung}</strong>
          </p>
        </div>
      )}

      {/* Đáp án True/False */}
      {values.loai_cau_hoi === 'true_false' && (
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Đáp án đúng</label>
          <select className={inputCls} value={values.dap_an_dung}
            onChange={e => onChange({ dap_an_dung: e.target.value })}>
            <option value="True">True (Đúng)</option>
            <option value="False">False (Sai)</option>
          </select>
        </div>
      )}

      {/* Đáp án điền chỗ trống */}
      {values.loai_cau_hoi === 'dien_cho_trong' && (
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Đáp án đúng</label>
          <input className={inputCls} placeholder="VD: environmental"
            value={values.dap_an_dung}
            onChange={e => onChange({ dap_an_dung: e.target.value })} />
        </div>
      )}

      {/* Giải thích */}
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Giải thích đáp án</label>
        <textarea className={`${inputCls} resize-none`} rows={2}
          placeholder="Giải thích tại sao đây là đáp án đúng..."
          value={values.giai_thich}
          onChange={e => onChange({ giai_thich: e.target.value })} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MODAL wrapper (giống Listening)
═══════════════════════════════════════════════════════════ */
function Modal({ title, subtitle, onClose, onSave, saveLabel, saving, children }: {
  title: string; subtitle?: string; onClose: () => void; onSave: () => void
  saveLabel: string; saving?: boolean; children: React.ReactNode
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
            {subtitle && <div className="text-blue-200 text-xs mt-0.5 truncate max-w-[320px]">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
        <div className="px-6 pb-5 pt-3 flex gap-3 justify-end flex-shrink-0 border-t border-gray-100">
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">
            Hủy
          </button>
          <button onClick={onSave} disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
            {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function QuestionsClient({ questions: init }: { questions: Record<string, unknown>[] }) {
  const { confirm, dialog } = useConfirm()
  const supabase = createClient()

  const [questions, setQuestions] = useState(init)
  const [filterCert,  setFilterCert]  = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [search,      setSearch]      = useState('')
  const [page, setPage] = useState(1)

  const [showAdd,  setShowAdd]  = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null)
  const [form,     setForm]     = useState({ ...emptyQ })
  const [editForm, setEditForm] = useState({ ...emptyQ })
  const [saving,   setSaving]   = useState(false)

  /* ── filters ── */
  const filtered = useMemo(() => {
    setPage(1)
    return questions.filter(q => {
      const matchCert  = !filterCert  || q.loai_chung_chi === filterCert
      const matchSkill = !filterSkill || q.ky_nang        === filterSkill
      const matchLevel = !filterLevel || q.cap_do         === filterLevel
      const matchQ     = !search      || (q.noi_dung_cau_hoi as string).toLowerCase().includes(search.toLowerCase())
      return matchCert && matchSkill && matchLevel && matchQ
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, filterCert, filterSkill, filterLevel, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilter  = filterCert || filterSkill || filterLevel || search

  /* ── save new ── */
  async function saveQuestion() {
    if (!form.noi_dung_cau_hoi.trim()) {
      showToast('warning', 'Thiếu nội dung', 'Vui lòng nhập nội dung câu hỏi')
      return
    }
    setSaving(true)
    const { data, error } = await supabase.from('NganHangCauHoi').insert({
      loai_chung_chi: form.loai_chung_chi, ky_nang: form.ky_nang, so_phan: form.so_phan,
      loai_cau_hoi: form.loai_cau_hoi, noi_dung_cau_hoi: form.noi_dung_cau_hoi,
      cac_lua_chon: form.cac_lua_chon, dap_an_dung: form.dap_an_dung,
      giai_thich: form.giai_thich, cap_do: form.cap_do,
    }).select().single()
    setSaving(false)
    if (error) { showToast('error', 'Thêm thất bại', error.message); return }
    setQuestions(prev => [data, ...prev])
    setForm({ ...emptyQ })
    setShowAdd(false)
    showToast('success', 'Đã thêm câu hỏi!')
  }

  /* ── open edit ── */
  function openEdit(q: Record<string, unknown>) {
    setEditData(q)
    setEditForm({
      loai_chung_chi: q.loai_chung_chi as string || 'TOEIC',
      ky_nang:        q.ky_nang        as string || 'NGU_PHAP',
      so_phan:        q.so_phan        as number || 5,
      loai_cau_hoi:   q.loai_cau_hoi   as string || 'trac_nghiem',
      noi_dung_cau_hoi: q.noi_dung_cau_hoi as string || '',
      cac_lua_chon: Array.isArray(q.cac_lua_chon)
        ? q.cac_lua_chon
        : [{ key: 'A', value: '' }, { key: 'B', value: '' }, { key: 'C', value: '' }, { key: 'D', value: '' }],
      dap_an_dung: q.dap_an_dung as string || 'A',
      giai_thich:  q.giai_thich  as string || '',
      cap_do:      q.cap_do      as string || 'B1',
    })
    setShowEdit(true)
  }

  /* ── save edit ── */
  async function saveEdit() {
    if (!editData || !editForm.noi_dung_cau_hoi.trim()) {
      showToast('warning', 'Thiếu nội dung', 'Vui lòng nhập nội dung câu hỏi')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('NganHangCauHoi').update({
      loai_chung_chi: editForm.loai_chung_chi, ky_nang: editForm.ky_nang, so_phan: editForm.so_phan,
      loai_cau_hoi: editForm.loai_cau_hoi, noi_dung_cau_hoi: editForm.noi_dung_cau_hoi,
      cac_lua_chon: editForm.cac_lua_chon, dap_an_dung: editForm.dap_an_dung,
      giai_thich: editForm.giai_thich, cap_do: editForm.cap_do,
    }).eq('id', editData.id as string)
    setSaving(false)
    if (error) { showToast('error', 'Cập nhật thất bại', error.message); return }
    setQuestions(prev => prev.map(q => q.id === editData.id ? { ...q, ...editForm } : q))
    setShowEdit(false)
    setEditData(null)
    showToast('success', 'Đã cập nhật câu hỏi!')
  }

  /* ── delete ── */
  async function deleteQ(q: Record<string, unknown>) {
    const ok = await confirm({
      title: 'Xóa câu hỏi này?',
      message: `"${(q.noi_dung_cau_hoi as string).slice(0, 80)}${(q.noi_dung_cau_hoi as string).length > 80 ? '…' : ''}"`,
      confirmText: '🗑 Xóa',
      cancelText: 'Giữ lại',
      variant: 'danger',
    })
    if (!ok) return
    const { error } = await supabase.from('NganHangCauHoi').delete().eq('id', q.id as string)
    if (error) { showToast('error', 'Xóa thất bại', error.message); return }
    setQuestions(prev => prev.filter(x => x.id !== q.id))
    showToast('success', 'Đã xóa câu hỏi')
  }

  const tableCols = [
    { label: 'STT',        minWidth: 48  },
    { label: 'Nội dung',   minWidth: 280 },
    { label: 'Chứng chỉ', minWidth: 90  },
    { label: 'Kỹ năng',   minWidth: 100 },
    { label: 'Part',       minWidth: 60  },
    { label: 'Cấp độ',    minWidth: 75  },
    { label: 'Đáp án',    minWidth: 80  },
    { label: 'Thao tác',  minWidth: 90  },
  ]

  return (
    <>
      <AlertContainer />
      {dialog}

      <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily: 'DM Sans,sans-serif' }}>

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NGÂN HÀNG CÂU HỎI</h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              Tổng <span className="font-semibold text-[#1e3a5f]">{questions.length}</span> câu hỏi
              {hasFilter && filtered.length !== questions.length && (
                <> · lọc được <span className="font-semibold text-[#1e3a5f]">{filtered.length}</span> câu</>
              )}
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
            <Plus size={16} strokeWidth={2.5} /> Thêm câu hỏi
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <StatCard label="Tổng câu hỏi" value={questions.length} color="#1e3a5f" icon={
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"/>
            </svg>
          } />
          <StatCard label="Câu TOEIC" value={questions.filter(q => q.loai_chung_chi === 'TOEIC').length} color="#7c3aed" icon={
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"/>
            </svg>
          } />
          <StatCard label="Câu VSTEP" value={questions.filter(q => q.loai_chung_chi === 'VSTEP').length} color="#059669" icon={
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          } />
          <StatCard label="Câu APTIS" value={questions.filter(q => q.loai_chung_chi === 'APTIS').length} color="#db2777" icon={
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
            </svg>
          } />
        </div>

        {/* Table card */}
        <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>

          {/* Table header bar */}
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
            <div className="text-white font-bold text-base">Danh sách câu hỏi</div>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-[#1e3a5f]"
              style={{ background: '#fff' }}>
              <Plus size={14} strokeWidth={2.5} /> Thêm câu hỏi
            </button>
          </div>

          {/* Filter bar */}
          <div className="px-4 py-3 flex flex-wrap items-center gap-2"
            style={{ background: '#f1f5f9', borderBottom: '1px solid #c2cfe0' }}>
            <Filter size={13} className="text-gray-400 flex-shrink-0" />
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nội dung câu hỏi..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]/50 bg-white" />
            </div>
            <select value={filterCert} onChange={e => setFilterCert(e.target.value)} className={filterSelectCls}>
              <option value="">Tất cả chứng chỉ</option>
              {CERTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterSkill} onChange={e => setFilterSkill(e.target.value)} className={filterSelectCls}>
              <option value="">Tất cả kỹ năng</option>
              {SKILLS.map(s => <option key={s} value={s}>{SKILL_LABEL[s] ?? s}</option>)}
            </select>
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className={filterSelectCls}>
              <option value="">Tất cả cấp độ</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {hasFilter && (
              <>
                <span className="text-xs text-[#1e3a5f] font-semibold whitespace-nowrap">
                  {filtered.length}/{questions.length} câu
                </span>
                <button onClick={() => { setFilterCert(''); setFilterSkill(''); setFilterLevel(''); setSearch('') }}
                  className="text-xs text-red-400 hover:text-red-600 font-semibold whitespace-nowrap">
                  Xóa lọc
                </button>
              </>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {tableCols.map((col, ci) => (
                    <th key={col.label} style={{
                      ...TH, minWidth: col.minWidth,
                      borderRight: ci < tableCols.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                    }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={tableCols.length} className="text-center py-16 text-gray-400 bg-white">
                      <BookOpen className="mx-auto mb-3 text-gray-300" size={44} strokeWidth={1.5} />
                      <div>{questions.length === 0 ? 'Chưa có câu hỏi nào. Thêm câu hỏi mới!' : 'Không tìm thấy câu phù hợp.'}</div>
                    </td>
                  </tr>
                ) : paged.map((q, i) => {
                  const even = i % 2 === 0
                  const globalIdx = (page - 1) * PAGE_SIZE + i + 1
                  return (
                    <tr key={q.id as string}
                      style={{ background: even ? '#f1f5f9' : '#fff', transition: 'background 0.1s' }}
                      className="hover:!bg-blue-50 group">
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', textAlign: 'center' }}>
                        <span className="text-sm font-mono font-semibold text-gray-400">{globalIdx}</span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', maxWidth: 320 }}>
                        <span className="text-gray-800 font-medium text-sm line-clamp-2 block">
                          {(q.noi_dung_cau_hoi as string).replace(/\\n/g, ' ').trim()}
                        </span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${CERT_COLOR[q.loai_chung_chi as string] || 'bg-gray-100 text-gray-500'}`}>
                          {q.loai_chung_chi as string}
                        </span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${SKILL_COLOR[q.ky_nang as string] || 'bg-gray-100 text-gray-500'}`}>
                          {SKILL_LABEL[q.ky_nang as string] ?? q.ky_nang as string}
                        </span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', textAlign: 'center' }}>
                        <span className="text-sm font-mono font-semibold text-gray-500">{q.so_phan as number}</span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', textAlign: 'center' }}>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${LEVEL_COLOR[q.cap_do as string] || 'bg-gray-100 text-gray-500'}`}>
                          {q.cap_do as string}
                        </span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', textAlign: 'center' }}>
                        <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          {q.dap_an_dung as string}
                        </span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, padding: '11px 14px' }}>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => openEdit(q)}
                            className="p-2 rounded-lg text-blue-400 border border-blue-200 hover:bg-blue-500 hover:text-white transition-all">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => deleteQ(q)}
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
          </div>

          {/* Footer / pagination */}
          {filtered.length > 0 && (
            <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
              style={{ background: '#f8fafc', borderTop: '2px solid #c2cfe0' }}>
              <span className="text-sm text-gray-500">
                {hasFilter
                  ? <>Lọc được <strong className="text-[#1e3a5f]">{filtered.length}</strong> / <strong className="text-[#1e3a5f]">{questions.length}</strong> câu</>
                  : <>Tổng <strong className="text-[#1e3a5f]">{questions.length}</strong> câu hỏi</>
                }
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
                    )
                  }
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal thêm */}
        {showAdd && (
          <Modal title="Thêm câu hỏi mới" onClose={() => setShowAdd(false)}
            onSave={saveQuestion} saveLabel="Lưu câu hỏi" saving={saving}>
            <QuestionForm values={form} onChange={patch => setForm(p => ({ ...p, ...patch }))} />
          </Modal>
        )}

        {/* Modal sửa */}
        {showEdit && editData && (
          <Modal
            title="Sửa câu hỏi"
            subtitle={`${editData.loai_chung_chi as string} · ${SKILL_LABEL[editData.ky_nang as string] ?? editData.ky_nang as string} · Part ${editData.so_phan as number}`}
            onClose={() => { setShowEdit(false); setEditData(null) }}
            onSave={saveEdit} saveLabel="Lưu thay đổi" saving={saving}>
            <QuestionForm values={editForm} onChange={patch => setEditForm(p => ({ ...p, ...patch }))} />
          </Modal>
        )}
      </div>
    </>
  )
}