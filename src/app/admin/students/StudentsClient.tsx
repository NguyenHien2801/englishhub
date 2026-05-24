'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const ROLES: Record<string, string> = {
  sinh_vien: 'Sinh viên',
  giang_vien: 'Giảng viên',
  admin: 'Admin',
}
const GOALS = ['VSTEP', 'TOEIC', 'APTIS', 'GENERAL']
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

type Student = Record<string, unknown>

function roleBadge(r: string) {
  const map: Record<string, string> = {
    admin: 'bg-red-100 text-red-600 border border-red-200',
    giang_vien: 'bg-amber-100 text-amber-700 border border-amber-200',
    sinh_vien: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  }
  return map[r] || 'bg-gray-100 text-gray-500 border border-gray-200'
}

function goalBadge(g: string) {
  const map: Record<string, string> = {
    VSTEP: 'bg-blue-100 text-blue-700',
    TOEIC: 'bg-purple-100 text-purple-700',
    APTIS: 'bg-pink-100 text-pink-700',
    GENERAL: 'bg-teal-100 text-teal-700',
  }
  return map[g] || 'bg-gray-100 text-gray-500'
}

/** Avatar chữ cái — màu lấy từ họ tên để luôn nhất quán */
function getAvatarColor(name: string) {
  const colors = [
    'linear-gradient(135deg,#0f2847,#2563eb)',
    'linear-gradient(135deg,#065f46,#10b981)',
    'linear-gradient(135deg,#7c3aed,#a78bfa)',
    'linear-gradient(135deg,#b45309,#f59e0b)',
    'linear-gradient(135deg,#be123c,#f43f5e)',
    'linear-gradient(135deg,#0369a1,#38bdf8)',
    'linear-gradient(135deg,#4d7c0f,#84cc16)',
    'linear-gradient(135deg,#6d28d9,#c084fc)',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const bg = getAvatarColor(name || '')
  const letter = (name || '?').charAt(0).toUpperCase()
  const radius = size <= 32 ? 8 : 14
  const fontSize = size <= 32 ? 11 : 22
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 800, color: '#fff',
    }}>
      {letter}
    </div>
  )
}

// ── Modal Thêm ────────────────────────────────────────────
function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Student) => Promise<void> }) {
  const [form, setForm] = useState({
    ho_ten: '', ma_sinh_vien: '', lop: '', khoa: '',
    muc_tieu_hoc: 'GENERAL', trinh_do_hien_tai: 'A1', vai_tro: 'sinh_vien',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!form.ho_ten.trim() || !form.ma_sinh_vien.trim()) {
      toast.error('Vui lòng điền họ tên và MSSV')
      return
    }
    setLoading(true)
    await onAdd(form as unknown as Student)
    setLoading(false)
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]/60 transition-colors bg-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,20,40,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
          <div>
            <div className="text-white font-bold text-base">Thêm sinh viên mới</div>
            <div className="text-blue-200 text-xs mt-0.5">Điền thông tin bên dưới</div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Họ tên *</label>
              <input className={inputCls} placeholder="Nguyễn Văn A"
                value={form.ho_ten} onChange={e => setForm(p => ({ ...p, ho_ten: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">MSSV *</label>
              <input className={inputCls} placeholder="2200001"
                value={form.ma_sinh_vien} onChange={e => setForm(p => ({ ...p, ma_sinh_vien: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Lớp</label>
              <input className={inputCls} placeholder="DH11-CNTT2"
                value={form.lop} onChange={e => setForm(p => ({ ...p, lop: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Khoa</label>
              <input className={inputCls} placeholder="Công nghệ và Kỹ thuật"
                value={form.khoa} onChange={e => setForm(p => ({ ...p, khoa: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Mục tiêu</label>
              <select className={inputCls} value={form.muc_tieu_hoc}
                onChange={e => setForm(p => ({ ...p, muc_tieu_hoc: e.target.value }))}>
                {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Trình độ</label>
              <select className={inputCls} value={form.trinh_do_hien_tai}
                onChange={e => setForm(p => ({ ...p, trinh_do_hien_tai: e.target.value }))}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Vai trò</label>
              <select className={inputCls} value={form.vai_tro}
                onChange={e => setForm(p => ({ ...p, vai_tro: e.target.value }))}>
                {Object.entries(ROLES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
            {loading ? 'Đang thêm...' : '+ Thêm sinh viên'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Chi tiết / Sửa / Xóa ───────────────────────────
function StudentModal({
  student, onClose, onSave, onDelete, onToggleLock,
}: {
  student: Student
  onClose: () => void
  onSave: (updated: Student) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onToggleLock: (id: string, locked: boolean) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...student })
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isLocked = !!form.is_locked

  const fields: {
    key: string; label: string; editable: boolean
    type?: string; options?: string[]; labels?: Record<string, string>
    suffix?: string; format?: (v: unknown) => string
  }[] = [
    { key: 'ho_ten', label: 'Họ tên', editable: true },
    { key: 'ma_sinh_vien', label: 'MSSV', editable: false },
    { key: 'lop', label: 'Lớp', editable: true },
    { key: 'khoa', label: 'Khoa', editable: true },
    { key: 'muc_tieu_hoc', label: 'Mục tiêu', editable: true, type: 'select', options: GOALS },
    { key: 'trinh_do_hien_tai', label: 'Trình độ', editable: true, type: 'select', options: LEVELS },
    { key: 'vai_tro', label: 'Vai trò', editable: true, type: 'select', options: Object.keys(ROLES), labels: ROLES },
    { key: 'streak_hien_tai', label: 'Streak hiện tại', editable: false, suffix: ' ngày' },
    { key: 'streak_cao_nhat', label: 'Streak cao nhất', editable: false, suffix: ' ngày' },
    { key: 'tong_so_tu_da_hoc', label: 'Tổng từ đã học', editable: false, suffix: ' từ' },
    { key: 'ngay_hoc_cuoi', label: 'Ngày học cuối', editable: false, format: (v) => v ? new Date(v as string).toLocaleDateString('vi-VN') : '—' },
    { key: 'created_at', label: 'Đăng ký lúc', editable: false, format: (v) => v ? new Date(v as string).toLocaleDateString('vi-VN') : '—' },
  ]

  const inputCls = 'flex-1 border border-[#1e3a5f]/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20'

  async function handleSave() {
    setLoading(true); await onSave(form); setLoading(false); setEditing(false)
  }
  async function handleDelete() {
    setLoading(true); await onDelete(student.id as string); setLoading(false); onClose()
  }
  async function handleToggleLock() {
    setLoading(true)
    await onToggleLock(student.id as string, isLocked)
    setForm(p => ({ ...p, is_locked: !isLocked }))
    setLoading(false)
    toast.success(isLocked ? '🔓 Đã mở khóa tài khoản' : '🔒 Đã khóa tài khoản')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,20,40,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={() => !confirmDelete && onClose()}>
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl bg-white"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5"
          style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
          <Avatar name={form.ho_ten as string} size={56} />
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-lg truncate">{form.ho_ten as string}</div>
            <div className="text-blue-200 text-sm font-mono">{form.ma_sinh_vien as string}</div>
          </div>
          {/* Trạng thái khóa badge */}
          {isLocked && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(251,191,36,.15)', color: '#fcd34d', border: '1px solid rgba(251,191,36,.3)' }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Bị khóa
            </span>
          )}
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[52vh] overflow-y-auto">
          {fields.map(f => {
            const val = form[f.key]
            const display = f.format ? f.format(val) : (val !== undefined && val !== null && val !== '') ? `${val}${f.suffix || ''}` : '—'
            return (
              <div key={f.key} className="flex items-center py-2.5 border-b border-gray-100 last:border-0 gap-3">
                <span className="text-gray-500 text-sm w-36 flex-shrink-0">{f.label}</span>
                {editing && f.editable ? (
                  f.type === 'select' ? (
                    <select value={form[f.key] as string}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className={inputCls}>
                      {(f.options || []).map(o => (
                        <option key={o} value={o}>{f.labels ? f.labels[o] : o}</option>
                      ))}
                    </select>
                  ) : (
                    <input value={form[f.key] as string || ''}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className={inputCls} />
                  )
                ) : (
                  <span className="flex-1 text-sm font-medium text-gray-800">{display as string}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
          {confirmDelete ? (
            <>
              <span className="flex-1 text-sm text-red-600 font-medium">Xác nhận xóa người dùng này?</span>
              <button onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button onClick={handleDelete} disabled={loading}
                className="px-4 py-2 rounded-xl text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 transition-colors">
                {loading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </>
          ) : (
            <>
              {/* Xóa */}
              <button onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 rounded-xl text-sm border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                🗑 Xóa
              </button>

              {/* Khóa / Mở khóa */}
              <button onClick={handleToggleLock} disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60"
                style={isLocked
                  ? { border: '1px solid #a7f3d0', color: '#059669', background: 'transparent' }
                  : { border: '1px solid #fde68a', color: '#d97706', background: 'transparent' }
                }>
                {isLocked ? (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Mở khóa
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Khóa TK
                  </>
                )}
              </button>

              <div className="flex-1" />

              {editing ? (
                <>
                  <button onClick={() => { setForm({ ...student }); setEditing(false) }}
                    className="px-4 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                    Hủy
                  </button>
                  <button onClick={handleSave} disabled={loading}
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                  ✏️ Chỉnh sửa
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function StudentsClient({ students }: { students: Student[] }) {
  const [list, setList] = useState(students)
  const [search, setSearch] = useState('')
  const [filterGoal, setFilterGoal] = useState('')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<Student | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const supabase = createClient()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let arr = list.filter(s => {
      const matchSearch = !q ||
        (s.ho_ten as string)?.toLowerCase().includes(q) ||
        (s.ma_sinh_vien as string)?.toLowerCase().includes(q) ||
        ((s.lop as string) || '').toLowerCase().includes(q)
      const matchGoal = !filterGoal || s.muc_tieu_hoc === filterGoal
      return matchSearch && matchGoal
    })
    arr = [...arr].sort((a, b) => {
      const va = (a[sortKey] ?? '') as string | number
      const vb = (b[sortKey] ?? '') as string | number
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [list, search, filterGoal, sortKey, sortDir])

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  async function handleAdd(data: Student) {
    const { data: inserted, error } = await supabase.from('NguoiDung').insert([data]).select().single()
    if (error) { toast.error('Lỗi khi thêm: ' + error.message); return }
    setList(prev => [inserted, ...prev])
    setShowAdd(false)
    toast.success('Đã thêm sinh viên mới')
  }

  async function handleSave(updated: Student) {
    const { error } = await supabase.from('NguoiDung').update({
      ho_ten: updated.ho_ten, lop: updated.lop, khoa: updated.khoa,
      muc_tieu_hoc: updated.muc_tieu_hoc, trinh_do_hien_tai: updated.trinh_do_hien_tai, vai_tro: updated.vai_tro,
    }).eq('id', updated.id as string)
    if (error) { toast.error('Lỗi khi lưu'); return }
    setList(prev => prev.map(s => s.id === updated.id ? updated : s))
    setSelected(updated)
    toast.success('Đã lưu thay đổi')
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('NguoiDung').delete().eq('id', id)
    if (error) { toast.error('Lỗi khi xóa'); return }
    setList(prev => prev.filter(s => s.id !== id))
    toast.success('Đã xóa người dùng')
  }

  async function handleDeleteRow(id: string) {
    if (!confirm('Xác nhận xóa người dùng này?')) return
    await handleDelete(id)
  }

  async function handleToggleLock(id: string, currentLocked: boolean) {
    const newLocked = !currentLocked
    const { error } = await supabase
      .from('NguoiDung')
      .update({ is_locked: newLocked })
      .eq('id', id)
    if (error) { toast.error('Lỗi khi cập nhật trạng thái'); return }
    setList(prev => prev.map(s => s.id === id ? { ...s, is_locked: newLocked } : s))
    // cập nhật selected nếu đang mở modal
    setSelected(prev => prev && (prev.id === id) ? { ...prev, is_locked: newLocked } : prev)
    toast.success(newLocked ? '🔒 Đã khóa tài khoản' : '🔓 Đã mở khóa tài khoản')
  }

  async function handleToggleLockRow(id: string, currentLocked: boolean) {
    await handleToggleLock(id, currentLocked)
  }

  // ── Table header style ─────────────────────────────────
  const TH: React.CSSProperties = {
    background: 'linear-gradient(180deg, #2d4e7a 0%, #1e3a5f 100%)',
    color: 'rgba(226,232,240,0.82)',
    padding: '11px 14px',
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255,255,255,0.12)',
    userSelect: 'none',
    borderBottom: '2px solid rgba(147,197,253,0.2)',
  }

  const CELL_BORDER = '1px solid #c2cfe0'

  function SortIcon({ k }: { k: string }) {
    return (
      <span style={{ marginLeft: 4, display: 'inline-flex', flexDirection: 'column', gap: 2, verticalAlign: 'middle' }}>
        <svg width="7" height="4" viewBox="0 0 7 4" fill={sortKey === k && sortDir === 'asc' ? '#93c5fd' : 'rgba(255,255,255,0.28)'}>
          <path d="M3.5 0L7 4H0z" />
        </svg>
        <svg width="7" height="4" viewBox="0 0 7 4" fill={sortKey === k && sortDir === 'desc' ? '#93c5fd' : 'rgba(255,255,255,0.28)'}>
          <path d="M3.5 4L0 0H7z" />
        </svg>
      </span>
    )
  }

const cols = [
  { key: 'stt',               label: 'STT',          sortable: false, minWidth: 48   },
  { key: 'ho_ten',            label: 'Họ tên',        sortable: true,  minWidth: 160  },
  { key: 'ma_sinh_vien',      label: 'MSSV',          sortable: true,  minWidth: 100  },
  { key: 'lop',               label: 'Lớp / Khoa',    sortable: false, minWidth: 140  },
  { key: 'muc_tieu_hoc',      label: 'Mục tiêu',      sortable: true,  minWidth: 90   },
  { key: 'trinh_do_hien_tai', label: 'Trình độ',      sortable: true,  minWidth: 80   },
  { key: 'streak_hien_tai',   label: 'Streak',        sortable: true,  minWidth: 72   },
  { key: 'vai_tro',           label: 'Vai trò',       sortable: true,  minWidth: 110  },
  { key: 'created_at',        label: 'Ngày đăng ký',  sortable: true,  minWidth: 120  },
  { key: '_action',           label: 'Thao tác',      sortable: false, minWidth: 110  },
]

  const IconLock = () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
  const IconUnlock = () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  )
  const IconEdit = () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
  const IconTrash = () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )

  return (
    <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily: 'DM Sans,sans-serif' }}>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QUẢN LÝ SINH VIÊN</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Tổng <span className="font-semibold text-[#1e3a5f]">{list.length}</span> người dùng
            {filtered.length !== list.length && (
              <> · đang lọc <span className="font-semibold text-[#1e3a5f]">{filtered.length}</span> kết quả</>
            )}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M12 4v16m8-8H4" />
            </svg>
            Thêm sinh viên
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, MSSV, lớp..."
            className="w-full pl-9 pr-9 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <select value={filterGoal} onChange={e => setFilterGoal(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white">
          <option value="">Tất cả mục tiêu</option>
          {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select
          value={`${sortKey}|${sortDir}`}
          onChange={e => {
            const [k, d] = e.target.value.split('|')
            setSortKey(k); setSortDir(d as 'asc' | 'desc')
          }}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white">
          <option value="created_at|desc">Mới nhất trước</option>
          <option value="created_at|asc">Cũ nhất trước</option>
          <option value="ho_ten|asc">Họ tên A → Z</option>
          <option value="ho_ten|desc">Họ tên Z → A</option>
          <option value="streak_hien_tai|desc">Streak cao nhất</option>
          <option value="trinh_do_hien_tai|desc">Trình độ cao nhất</option>
        </select>
        {(search || filterGoal) && (
          <button onClick={() => { setSearch(''); setFilterGoal('') }}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm hover:border-red-300 hover:text-red-500 transition-colors bg-white">
            Xoá lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                {cols.map((col, ci) => (
                  <th key={col.key}
                    onClick={() => col.sortable && toggleSort(col.key)}
                    style={{
                      ...TH,
                      cursor: col.sortable ? 'pointer' : 'default',
                      borderRight: ci < cols.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                      minWidth: col.minWidth,
                    }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {col.label}
                      {col.sortable && <SortIcon k={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={cols.length} className="text-center py-16 text-gray-400 bg-white">
                    <svg className="mx-auto mb-2 text-gray-300" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                    </svg>
                    Không tìm thấy kết quả nào
                  </td>
                </tr>
              ) : filtered.map((sv, i) => {
                const even = i % 2 === 0
                const bg = even ? '#f1f5f9' : '#ffffff'
                const isLocked = !!sv.is_locked
                return (
                  <tr key={i}
                    style={{ background: isLocked ? '#fffbeb' : bg, transition: 'background 0.1s', opacity: isLocked ? 0.82 : 1 }}
                    className="hover:!bg-blue-50 group">
                    {/* STT */}
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px', textAlign: 'center' }}>
                      <span className="text-sm font-mono font-semibold text-gray-400">{i + 1}</span>
                    </td>
                    {/* Họ tên — no avatar, text only */}
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span className="font-semibold text-gray-800 text-[15px]">{sv.ho_ten as string}</span>
                      {isLocked && (
                        <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Khóa
                        </span>
                      )}
                    </td>
                    {/* MSSV */}
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px' }}>
                      <span className="font-mono text-sm text-gray-500">{sv.ma_sinh_vien as string}</span>
                    </td>
                    {/* Lớp/Khoa */}
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px' }}>
                      <div className="text-sm font-medium text-gray-700">{(sv.lop as string) || '—'}</div>
                      <div className="text-[13px] text-gray-400">{(sv.khoa as string) || ''}</div>
                    </td>
                    {/* Mục tiêu */}
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px' }}>
                      <span className={`px-2.5 py-1 rounded-full text-[13px] font-semibold ${goalBadge(sv.muc_tieu_hoc as string)}`}>
                        {sv.muc_tieu_hoc as string}
                      </span>
                    </td>
                    {/* Trình độ */}
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span className="text-sm font-bold font-mono text-[#1e3a5f] bg-blue-100 px-2.5 py-1 rounded">
                        {sv.trinh_do_hien_tai as string}
                      </span>
                    </td>
                    {/* Streak */}
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                     <span className="text-sm font-semibold text-amber-600">🔥 {(sv.streak_hien_tai as number) ?? 0}</span>
                    </td>
                    {/* Vai trò — text-sm (fix từ text-xs) */}
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <select value={sv.vai_tro as string}
                        onChange={e => {
                          const role = e.target.value
                          supabase.from('NguoiDung').update({ vai_tro: role }).eq('id', sv.id as string)
                            .then(({ error }) => {
                              if (error) { toast.error('Lỗi cập nhật'); return }
                              setList(prev => prev.map(s => s.id === sv.id ? { ...s, vai_tro: role } : s))
                              toast.success('Đã cập nhật vai trò')
                            })
                        }}
                        className={`px-2 py-1 rounded-lg text-sm font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 ${roleBadge(sv.vai_tro as string)}`}>
                        {Object.entries(ROLES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    {/* Ngày đăng ký */}
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px' }}>
                      <span className="text-sm text-gray-500">
                        {sv.created_at ? new Date(sv.created_at as string).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </td>
                    {/* Thao tác — p-2 đồng nhất cho cả 3 nút */}
                    <td style={{ borderBottom: CELL_BORDER, padding: '12px 16px' }}>
                      <div className="flex items-center gap-1.5">
                        {/* Edit */}
                        <button onClick={() => setSelected(sv)} title="Chi tiết / Sửa"
                          className="p-2 rounded-lg text-[#1e3a5f] border border-[#1e3a5f]/20 hover:bg-[#1e3a5f] hover:text-white transition-all">
                          <IconEdit />
                        </button>
                        {/* Lock / Unlock */}
                        {isLocked ? (
                          <button onClick={() => handleToggleLockRow(sv.id as string, true)} title="Mở khóa tài khoản"
                            className="p-2 rounded-lg text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-all">
                            <IconUnlock />
                          </button>
                        ) : (
                          <button onClick={() => handleToggleLockRow(sv.id as string, false)} title="Khóa tài khoản"
                            className="p-2 rounded-lg text-amber-500 border border-amber-200 hover:bg-amber-400 hover:text-white transition-all">
                            <IconLock />
                          </button>
                        )}
                        {/* Delete — p-2 (fix từ p-1.5) */}
                        <button onClick={() => handleDeleteRow(sv.id as string)} title="Xóa"
                          className="p-2 rounded-lg text-red-400 border border-red-200 hover:bg-red-500 hover:text-white transition-all">
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between text-sm text-gray-500"
            style={{ background: '#f8fafc', borderTop: '2px solid #c2cfe0' }}>
            <span>Tổng <strong className="text-[#1e3a5f]">{filtered.length}</strong> bản ghi</span>
            {filtered.length !== list.length && (
              <span className="text-gray-400">Lọc từ {list.length} bản ghi</span>
            )}
          </div>
        )}
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {selected && (
        <StudentModal
          student={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          onToggleLock={handleToggleLock}
        />
      )}
    </div>
  )
}