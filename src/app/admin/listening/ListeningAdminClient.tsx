'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, Headphones, Search, Filter,
  ChevronLeft, ChevronRight, Pencil, X, Upload,
  Clock, BarChart2, CheckCircle, AlertCircle,
} from 'lucide-react'

/* ─────────────── constants ─────────────── */
const CERTS   = ['VSTEP', 'TOEIC', 'APTIS']
const LEVELS  = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
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

const emptyForm = {
  tieu_de: '', mo_ta: '', cap_do: 'B1', loai_chung_chi: 'VSTEP',
  chu_de: '', video_url: '', script: '', thoi_gian_giay: 300,
}

/* ─────────────── stat card ─────────────── */
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
  const [lessons,     setLessons]     = useState(init)
  const [selectedLesson, setSelectedLesson] = useState<Record<string, unknown> | null>(null)
  const [questions,   setQuestions]   = useState<Record<string, unknown>[]>([])
  const [loadingQ,    setLoadingQ]    = useState(false)

  /* forms */
  const [showNewForm,  setShowNewForm]  = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [form,     setForm]     = useState({ ...emptyForm })
  const [editForm, setEditForm] = useState({ ...emptyForm })

  /* sidebar filters */
  const [filterCert,   setFilterCert]   = useState('')
  const [filterLevel,  setFilterLevel]  = useState('')
  const [searchLesson, setSearchLesson] = useState('')

  /* question panel filters */
  const [searchQ,     setSearchQ]     = useState('')
  const [filterQType, setFilterQType] = useState('')
  const [page, setPage] = useState(1)

  const supabase = createClient()

  /* ── computed ── */
  const filteredLessons = useMemo(() => lessons.filter(l => {
    const matchCert   = !filterCert  || l.loai_chung_chi === filterCert
    const matchLevel  = !filterLevel || l.cap_do          === filterLevel
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

  /* ── helpers ── */
  function fmtTime(secs: number) {
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  }

  async function loadQuestions(lesson: Record<string, unknown>) {
    setSelectedLesson(lesson)
    setLoadingQ(true)
    setSearchQ(''); setFilterQType(''); setPage(1)
    const { data } = await supabase
      .from('BaiNgheCauHoi')
      .select('*')
      .eq('bai_nghe_id', lesson.id)
      .order('so_thu_tu')
    setQuestions(data || [])
    setLoadingQ(false)
  }

  /* ── CRUD lessons ── */
  async function saveNewLesson() {
    if (!form.tieu_de.trim()) { toast.error('Nhập tiêu đề bài nghe'); return }
    const { data, error } = await supabase
      .from('BaiNghe')
      .insert({ ...form, luot_lam: 0, da_kiem_duyet: false })
      .select().single()
    if (error) { toast.error(error.message); return }
    setLessons(prev => [data, ...prev])
    setForm({ ...emptyForm })
    setShowNewForm(false)
    toast.success('Đã thêm bài nghe!')
  }

  function openEditLesson(lesson: Record<string, unknown>, e: React.MouseEvent) {
    e.stopPropagation()
    setEditForm({
      tieu_de:       lesson.tieu_de       as string || '',
      mo_ta:         lesson.mo_ta         as string || '',
      cap_do:        lesson.cap_do        as string || 'B1',
      loai_chung_chi: lesson.loai_chung_chi as string || 'VSTEP',
      chu_de:        lesson.chu_de        as string || '',
      video_url:     lesson.video_url     as string || '',
      script:        lesson.script        as string || '',
      thoi_gian_giay: lesson.thoi_gian_giay as number || 300,
    })
    setSelectedLesson(lesson)
    setShowEditForm(true)
  }

  async function saveEditLesson() {
    if (!selectedLesson) return
    const { data, error } = await supabase
      .from('BaiNghe').update(editForm).eq('id', selectedLesson.id).select().single()
    if (error) { toast.error(error.message); return }
    setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, ...data } : l))
    setSelectedLesson(prev => prev ? { ...prev, ...data } : prev)
    setShowEditForm(false)
    toast.success('Đã cập nhật bài nghe!')
  }

  async function deleteLesson(id: string) {
    if (!confirm('Xóa bài nghe này? Tất cả câu hỏi cũng bị xóa!')) return
    await supabase.from('BaiNgheCauHoi').delete().eq('bai_nghe_id', id)
    await supabase.from('BaiNghe').delete().eq('id', id)
    setLessons(prev => prev.filter(l => l.id !== id))
    if (selectedLesson?.id === id) { setSelectedLesson(null); setQuestions([]) }
    toast.success('Đã xóa')
  }

  async function toggleKiemDuyet(id: string, cur: boolean) {
    const { error } = await supabase.from('BaiNghe').update({ da_kiem_duyet: !cur }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setLessons(prev => prev.map(l => l.id === id ? { ...l, da_kiem_duyet: !cur } : l))
    setSelectedLesson(prev => prev?.id === id ? { ...prev, da_kiem_duyet: !cur } : prev)
    toast.success(!cur ? 'Đã duyệt bài' : 'Đã bỏ duyệt')
  }

  /* ── form field helper ── */
  function FormFields({ values, onChange }: {
    values: typeof emptyForm
    onChange: (patch: Partial<typeof emptyForm>) => void
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

  /* ── Modal shell ── */
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
          <div className="px-6 pb-5 pt-2 flex gap-3 justify-end flex-shrink-0 border-t border-gray-100">
            <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">Hủy</button>
            <button onClick={onSave}  className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>{saveLabel}</button>
          </div>
        </div>
      </div>
    )
  }

  /* ─────────── render ─────────── */
  return (
    <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý bài nghe</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Tổng <span className="font-semibold text-[#1e3a5f]">{lessons.length}</span> bài nghe
            {selectedLesson && <> · <span className="font-semibold text-[#1e3a5f]">{questions.length}</span> câu hỏi trong bài đang chọn</>}
          </p>
        </div>
        <button onClick={() => setShowNewForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
          <Plus size={16} strokeWidth={2.5} /> Thêm bài nghe
        </button>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Tổng bài nghe" value={lessons.length} color="#1e3a5f" icon={<Headphones size={22} />} />
        <StatCard label="Bài VSTEP"     value={lessons.filter(l => l.loai_chung_chi === 'VSTEP').length} color="#0d9488" icon={<CheckCircle size={22} />} />
        <StatCard label="Bài TOEIC"     value={lessons.filter(l => l.loai_chung_chi === 'TOEIC').length} color="#7c3aed" icon={<BarChart2 size={22} />} />
        <StatCard label="Chờ duyệt"     value={lessons.filter(l => !l.da_kiem_duyet).length}             color="#d97706" icon={<AlertCircle size={22} />} />
      </div>

      <div className="grid lg:grid-cols-4 gap-5">

        {/* ── Sidebar ── */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>
            {/* sidebar header */}
            <div className="px-4 py-3" style={{ background: 'linear-gradient(180deg,#2d4e7a 0%,#1e3a5f 100%)', borderBottom: '2px solid rgba(147,197,253,0.2)' }}>
              <span style={{ color: 'rgba(226,232,240,0.82)', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Danh sách bài nghe
              </span>
            </div>

            {/* sidebar filters */}
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

            {/* lesson items */}
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
                        <div className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">{lesson.tieu_de as string}</div>
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
              <button onClick={() => setShowNewForm(true)}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#1e3a5f] py-2 rounded-lg hover:bg-blue-50 transition-colors">
                <Plus size={13} /> Thêm bài nghe mới
              </button>
            </div>
          </div>
        </div>

        {/* ── Question panel ── */}
        <div className="lg:col-span-3 space-y-4">
          {selectedLesson ? (
            <>
              {/* Detail stat cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl p-4 flex items-center gap-3" style={{ border: '2px solid #bfdbfe', background: 'linear-gradient(135deg,#fff 60%,#eff6ff)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#dbeafe', color: '#2563eb', border: '1.5px solid #bfdbfe' }}>
                    <BarChart2 size={22} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{questions.length}</div>
                    <div className="text-sm text-gray-500 mt-1">Câu hỏi</div>
                  </div>
                </div>
                <div className="rounded-2xl p-4 flex items-center gap-3" style={{ border: '2px solid #a7f3d0', background: 'linear-gradient(135deg,#fff 60%,#ecfdf5)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#d1fae5', color: '#059669', border: '1.5px solid #a7f3d0' }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{fmtTime(selectedLesson.thoi_gian_giay as number)}</div>
                    <div className="text-sm text-gray-500 mt-1">Thời lượng</div>
                  </div>
                </div>
                <div className="rounded-2xl p-4 flex items-center gap-3" style={{ border: '2px solid #fde68a', background: 'linear-gradient(135deg,#fff 60%,#fffbeb)' }}>
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

              {/* Question table panel */}
              <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>

                {/* panel header */}
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
                  <div>
                    <div className="text-white font-bold text-base line-clamp-1">{selectedLesson.tieu_de as string}</div>
                    <div className="text-blue-200 text-sm mt-0.5">{questions.length} câu hỏi</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {typeof selectedLesson.video_url === 'string' && selectedLesson.video_url && (
                      <a href={selectedLesson.video_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <Upload size={14} /> Xem video
                        </a>
                    )}
                    <button
                      onClick={() => toggleKiemDuyet(selectedLesson.id as string, selectedLesson.da_kiem_duyet as boolean)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-[#1e3a5f] transition-all"
                      style={{ background: '#fff' }}>
                      {selectedLesson.da_kiem_duyet ? 'Bỏ duyệt' : '✓ Duyệt bài'}
                    </button>
                  </div>
                </div>

                {/* filter bar */}
                <div className="px-4 py-3 flex flex-wrap items-center gap-2"
                  style={{ background: '#f1f5f9', borderBottom: '1px solid #c2cfe0' }}>
                  <Filter size={13} className="text-gray-400 flex-shrink-0" />
                  <div className="relative flex-1 min-w-[140px] max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm câu hỏi..."
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]/50 bg-white" />
                  </div>
                  <select value={filterQType} onChange={e => setFilterQType(e.target.value)} className={filterSelectCls}>
                    <option value="">Tất cả loại câu</option>
                    <option value="trac_nghiem">Trắc nghiệm</option>
                    <option value="dien_cho_trong">Điền vào chỗ trống</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="nghe_tu_vung">Nghe từ vựng</option>
                  </select>
                  {hasQFilter && (
                    <>
                      <span className="text-xs text-[#1e3a5f] font-semibold whitespace-nowrap">{filteredQ.length}/{questions.length} câu</span>
                      <button onClick={() => { setSearchQ(''); setFilterQType('') }}
                        className="text-xs text-red-400 hover:text-red-600 font-semibold whitespace-nowrap">Xóa lọc</button>
                    </>
                  )}
                </div>

                {/* table */}
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
                          {(['STT', 'Nội dung câu hỏi', 'Loại câu', 'Thứ tự'] as const).map((col, ci, arr) => (
                            <th key={col} style={{ ...TH, minWidth: ci === 1 ? 280 : 90, borderRight: ci < arr.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedQ.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-16 text-gray-400 bg-white">
                              <Headphones className="mx-auto mb-3 text-gray-300" size={48} strokeWidth={1.5} />
                              <div>{questions.length === 0 ? 'Chưa có câu hỏi nào.' : 'Không tìm thấy câu phù hợp.'}</div>
                            </td>
                          </tr>
                        ) : pagedQ.map((q, i) => {
                          const even = i % 2 === 0
                          const globalIdx = (page - 1) * PAGE_SIZE + i + 1
                          return (
                            <tr key={q.id as string}
                              style={{ background: even ? '#f1f5f9' : '#fff', transition: 'background 0.1s' }}
                              className="hover:!bg-blue-50">
                              <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', textAlign: 'center' }}>
                                <span className="text-sm font-mono font-semibold text-gray-400">{globalIdx}</span>
                              </td>
                              <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px' }}>
                                <span className="text-gray-800 font-medium">{q.noi_dung as string}</span>
                              </td>
                              <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', whiteSpace: 'nowrap' }}>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${Q_TYPE_COLOR[q.loai_cau_hoi as string] || 'bg-gray-100 text-gray-500'}`}>
                                  {q.loai_cau_hoi as string}
                                </span>
                              </td>
                              <td style={{ borderBottom: CELL_BORDER, padding: '11px 14px', textAlign: 'center' }}>
                                <span className="text-sm font-mono text-gray-500">{q.so_thu_tu as number}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* footer pagination */}
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
              </div>

              {/* Script preview */}
              {selectedLesson.script && (
                <div className="rounded-2xl p-5" style={{ border: '2px solid #b0bfd4', background: '#f8fafc' }}>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Script / Bản ghi</div>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                    {selectedLesson.script as string}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-md flex flex-col items-center justify-center py-20 text-center"
              style={{ border: '2px solid #b0bfd4' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                <Headphones size={32} color="white" strokeWidth={1.8} />
              </div>
              <div className="font-semibold text-gray-700 text-base">Chọn bài nghe bên trái để xem chi tiết & câu hỏi</div>
              <div className="text-sm text-gray-400 mt-1">Hoặc thêm bài nghe mới</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Thêm bài nghe ── */}
      {showNewForm && (
        <Modal title="Thêm bài nghe mới" onClose={() => setShowNewForm(false)} onSave={saveNewLesson} saveLabel="Thêm bài nghe">
          <FormFields values={form} onChange={patch => setForm(p => ({ ...p, ...patch }))} />
        </Modal>
      )}

      {/* ── Modal Sửa bài nghe ── */}
      {showEditForm && selectedLesson && (
        <Modal title="Sửa bài nghe" subtitle={selectedLesson.tieu_de as string}
          onClose={() => setShowEditForm(false)} onSave={saveEditLesson} saveLabel="Lưu thay đổi">
          <FormFields values={editForm} onChange={patch => setEditForm(p => ({ ...p, ...patch }))} />
        </Modal>
      )}
    </div>
  )
}