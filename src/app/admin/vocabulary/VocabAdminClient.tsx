'use client'
import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Plus, Trash2, BookOpen, Upload, X, ChevronRight, Search, Filter, ChevronLeft, Pencil, Users, BarChart2 } from 'lucide-react'

const LOAI_OPTIONS = ['VSTEP', 'TOEIC', 'APTIS', 'CHU_DE', 'TU_TAO']
const CAP_DO_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'MIXED']
const LOAI_TU_OPTIONS = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'idiom']
const PAGE_SIZE = 20

const LEVEL_COLOR: Record<string, string> = {
  A1: 'bg-[#ede9fe] text-[#7c3aed]',
  A2: 'bg-[#e0f2fe] text-[#0369a1]',
  B1: 'bg-[#dcfce7] text-[#15803d]',
  B2: 'bg-[#fef9c3] text-[#a16207]',
  C1: 'bg-[#fee2e2] text-[#dc2626]',
  C2: 'bg-[#fae8ff] text-[#9333ea]',
  MIXED: 'bg-gray-100 text-gray-600',
}
const LOAI_COLOR: Record<string, string> = {
  VSTEP:  'bg-blue-100 text-blue-700',
  TOEIC:  'bg-purple-100 text-purple-700',
  APTIS:  'bg-pink-100 text-pink-700',
  CHU_DE: 'bg-teal-100 text-teal-700',
  TU_TAO: 'bg-amber-100 text-amber-700',
}
const WORD_TYPE_COLOR: Record<string, string> = {
  noun:      'bg-blue-50 text-blue-600',
  verb:      'bg-emerald-50 text-emerald-600',
  adjective: 'bg-purple-50 text-purple-600',
  adverb:    'bg-amber-50 text-amber-600',
  phrase:    'bg-pink-50 text-pink-600',
  idiom:     'bg-orange-50 text-orange-600',
}

const TRANG_THAI_CONFIG = [
  { key: 'moi',        label: 'Mới',        color: '#94a3b8', bg: '#f1f5f9' },
  { key: 'dang_hoc',   label: 'Đang học',   color: '#3b82f6', bg: '#eff6ff' },
  { key: 'on_tap',     label: 'Ôn tập',     color: '#f59e0b', bg: '#fffbeb' },
  { key: 'thuan_thuc', label: 'Thuần thục', color: '#10b981', bg: '#ecfdf5' },
]

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

type Stats = {
  tong_tu: number
  tong_sinh_vien: number
  tong_luot_hoc: number
  ty_le_thuan_thuc: number
  trang_thai: { moi: number; dang_hoc: number; on_tap: number; thuan_thuc: number }
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
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

// Mini bar chart cho trạng thái
function StatusBar({ stats }: { stats: Stats }) {
  const total = stats.tong_luot_hoc || 1
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ border: '2px solid #b0bfd4', background: '#fff' }}>
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 size={18} className="text-[#1e3a5f]" />
        <span className="text-base font-bold text-gray-700">Phân bổ trạng thái học</span>
        <span className="ml-auto text-sm text-gray-400">{stats.tong_luot_hoc} lượt học</span>
      </div>
      {/* Progress bar tổng */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {TRANG_THAI_CONFIG.map(t => {
          const val = stats.trang_thai[t.key as keyof typeof stats.trang_thai]
          const pct = Math.round(val / total * 100)
          if (pct === 0) return null
          return (
            <div key={t.key} style={{ width: `${pct}%`, background: t.color, transition: 'width 0.5s' }}
              title={`${t.label}: ${val}`} />
          )
        })}
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {TRANG_THAI_CONFIG.map(t => {
          const val = stats.trang_thai[t.key as keyof typeof stats.trang_thai]
          const pct = total > 0 ? Math.round(val / total * 100) : 0
          return (
            <div key={t.key} className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: t.bg, border: `1px solid ${t.color}30` }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                <span className="text-sm font-semibold text-gray-600">{t.label}</span>
              </div>
              <div className="text-right">
                <span className="text-base font-bold" style={{ color: t.color }}>{val}</span>
                <span className="text-xs text-gray-400 ml-1">{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function VocabAdminClient({ sets }: { sets: Record<string, unknown>[] }) {
  const [list, setList]               = useState(sets)
  const [selectedSet, setSelectedSet] = useState<Record<string, unknown> | null>(null)
  const [words, setWords]             = useState<Record<string, unknown>[]>([])
  const [stats, setStats]             = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [showNewSet, setShowNewSet]   = useState(false)
  const [showAddWord, setShowAddWord] = useState(false)
  const [showEditSet, setShowEditSet] = useState(false)
  const [editSet, setEditSet]         = useState({ ten_bo: '', mo_ta: '', loai_bo: 'TOEIC', cap_do: 'B1', chu_de: '' })
  const [csvText, setCsvText]         = useState('')
  const [showCsv, setShowCsv]         = useState(false)
  const [loadingWords, setLoadingWords] = useState(false)
  const [newSet, setNewSet]   = useState({ ten_bo: '', mo_ta: '', loai_bo: 'TOEIC', cap_do: 'B1', chu_de: '' })
  const [newWord, setNewWord] = useState({ tu_tieng_anh: '', loai_tu: 'noun', cap_do: 'B1' })
  const [page, setPage]       = useState(1)

  const [filterLoai, setFilterLoai]   = useState('')
  const [filterCapDo, setFilterCapDo] = useState('')
  const [searchSet, setSearchSet]     = useState('')
  const [searchWord, setSearchWord]         = useState('')
  const [filterWordType, setFilterWordType] = useState('')
  const [filterWordLevel, setFilterWordLevel] = useState('')

  const supabase = createClient()
  const totalWords = list.reduce((sum, s) => sum + ((s.tong_so_tu as number) || 0), 0)

  const filteredList = useMemo(() => list.filter(s => {
    const matchLoai   = !filterLoai  || s.loai_bo === filterLoai
    const matchCapDo  = !filterCapDo || s.cap_do  === filterCapDo
    const matchSearch = !searchSet   || (s.ten_bo as string).toLowerCase().includes(searchSet.toLowerCase())
    return matchLoai && matchCapDo && matchSearch
  }), [list, filterLoai, filterCapDo, searchSet])

  const filteredWords = useMemo(() => {
    setPage(1)
    return words.filter(w => {
      const matchSearch = !searchWord    || (w.tu_tieng_anh as string).toLowerCase().includes(searchWord.toLowerCase())
      const matchType   = !filterWordType  || w.loai_tu === filterWordType
      const matchLevel  = !filterWordLevel || w.cap_do  === filterWordLevel
      return matchSearch && matchType && matchLevel
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, searchWord, filterWordType, filterWordLevel])

  const totalPages = Math.max(1, Math.ceil(filteredWords.length / PAGE_SIZE))
  const pagedWords = filteredWords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasWordFilter = searchWord || filterWordType || filterWordLevel

  async function loadWords(set: Record<string, unknown>) {
    setSelectedSet(set)
    setLoadingWords(true)
    setStats(null)
    setSearchWord(''); setFilterWordType(''); setFilterWordLevel(''); setPage(1)
    try {
      const [wordsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/vocabulary?bo_du_vung_id=${set.id}`),
        fetch(`/api/admin/vocabulary?bo_du_vung_id=${set.id}&stats=true`),
      ])
      const wordsData = await wordsRes.json()
      const statsData = await statsRes.json()
      setWords(Array.isArray(wordsData) ? wordsData : [])
      setStats(statsData)
    } catch {
      toast.error('Không thể tải dữ liệu')
      setWords([])
    }
    setLoadingWords(false)
  }

  async function createSet() {
    if (!newSet.ten_bo.trim()) { toast.error('Nhập tên bộ từ'); return }
    const { data, error } = await supabase.from('BoDuVung')
      .insert({ ...newSet, tong_so_tu: 0, la_cong_khai: true }).select().single()
    if (error) { toast.error(error.message); return }
    setList(prev => [...prev, data])
    setShowNewSet(false)
    setNewSet({ ten_bo: '', mo_ta: '', loai_bo: 'TOEIC', cap_do: 'B1', chu_de: '' })
    toast.success('Đã tạo bộ từ mới!')
  }

  function openEditSet(set: Record<string, unknown>, e: React.MouseEvent) {
    e.stopPropagation()
    setEditSet({
      ten_bo:  set.ten_bo  as string || '',
      mo_ta:   set.mo_ta   as string || '',
      loai_bo: set.loai_bo as string || 'TOEIC',
      cap_do:  set.cap_do  as string || 'B1',
      chu_de:  set.chu_de  as string || '',
    })
    setShowEditSet(true)
  }

  async function saveEditSet() {
    if (!selectedSet) return
    const res = await fetch(`/api/admin/vocabulary?id=${selectedSet.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editSet),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error); return }
    setList(prev => prev.map(s => s.id === selectedSet.id ? { ...s, ...json.set } : s))
    setSelectedSet(prev => prev ? { ...prev, ...json.set } : prev)
    setShowEditSet(false)
    toast.success('Đã cập nhật bộ từ!')
  }

  async function deleteSet(id: string) {
    if (!confirm('Xóa bộ từ này? Tất cả từ trong bộ cũng sẽ bị xóa!')) return
    const { error } = await supabase.from('BoDuVung').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setList(prev => prev.filter(s => s.id !== id))
    if (selectedSet?.id === id) { setSelectedSet(null); setWords([]); setStats(null) }
    toast.success('Đã xóa bộ từ')
  }

  async function addWord() {
    if (!newWord.tu_tieng_anh.trim() || !selectedSet) return
    const { data, error } = await supabase.from('TuVung').insert({
      ...newWord,
      tu_tieng_anh: newWord.tu_tieng_anh.toLowerCase().trim(),
      bo_du_vung_id: selectedSet.id,
      thu_tu_hien_thi: words.length + 1,
    }).select().single()
    if (error) { toast.error(error.message); return }
    setWords(prev => [...prev, data])
    await supabase.from('BoDuVung').update({ tong_so_tu: words.length + 1 }).eq('id', selectedSet.id)
    setList(prev => prev.map(s => s.id === selectedSet.id ? { ...s, tong_so_tu: (s.tong_so_tu as number) + 1 } : s))
    setNewWord({ tu_tieng_anh: '', loai_tu: 'noun', cap_do: 'B1' })
    setShowAddWord(false)
    fetch(`/api/vocabulary?word=${data.tu_tieng_anh}`)
    toast.success(`Đã thêm "${data.tu_tieng_anh}"`)
  }

  async function importCSV() {
    if (!selectedSet || !csvText.trim()) return
    const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean)
    let count = 0
    for (const line of lines) {
      const [word, loaiTu, capDo] = line.split(',').map(s => s.trim())
      if (!word) continue
      const { error } = await supabase.from('TuVung').upsert({
        tu_tieng_anh: word.toLowerCase(), bo_du_vung_id: selectedSet.id,
        loai_tu: loaiTu || 'noun', cap_do: capDo || 'B1',
        thu_tu_hien_thi: words.length + count + 1,
      })
      if (!error) count++
    }
    await supabase.from('BoDuVung').update({ tong_so_tu: words.length + count }).eq('id', selectedSet.id)
    await loadWords(selectedSet)
    setCsvText(''); setShowCsv(false)
    toast.success(`Đã import ${count} từ!`)
  }

  async function deleteWord(id: string) {
    await supabase.from('TuVung').delete().eq('id', id)
    setWords(prev => prev.filter(w => w.id !== id))
    if (selectedSet) {
      const newCount = words.length - 1
      await supabase.from('BoDuVung').update({ tong_so_tu: newCount }).eq('id', selectedSet.id)
      setList(prev => prev.map(s => s.id === selectedSet.id ? { ...s, tong_so_tu: newCount } : s))
    }
    toast.success('Đã xóa từ')
  }

  const wordTableCols = [
    { label: 'STT',      minWidth: 48  },
    { label: 'Từ vựng',  minWidth: 160 },
    { label: 'Nghĩa',    minWidth: 180 },
    { label: 'Phát âm',  minWidth: 110 },
    { label: 'Loại từ',  minWidth: 100 },
    { label: 'Cấp độ',   minWidth: 80  },
    { label: 'Thao tác', minWidth: 80  },
  ]

  return (
    <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily: 'DM Sans,sans-serif' }}>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý từ vựng</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Tổng <span className="font-semibold text-[#1e3a5f]">{list.length}</span> bộ từ
            {selectedSet && <> · <span className="font-semibold text-[#1e3a5f]">{words.length}</span> từ trong bộ đang chọn</>}
          </p>
        </div>
        <button onClick={() => setShowNewSet(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
          <Plus size={16} strokeWidth={2.5} /> Tạo bộ từ mới
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Tổng bộ từ"   value={list.length}  color="#1e3a5f" icon={
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
          </svg>
        } />
        <StatCard label="Tổng từ vựng" value={totalWords}   color="#2563eb" icon={
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"/>
          </svg>
        } />
        <StatCard label="Bộ TOEIC"     value={list.filter(s => s.loai_bo === 'TOEIC').length} color="#7c3aed" icon={
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"/>
          </svg>
        } />
        <StatCard label="Bộ VSTEP"     value={list.filter(s => s.loai_bo === 'VSTEP').length} color="#059669" icon={
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        } />
      </div>

      <div className="grid lg:grid-cols-4 gap-5">

        {/* ── Sidebar ── */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>
            <div className="px-4 py-3" style={{ background: 'linear-gradient(180deg,#2d4e7a 0%,#1e3a5f 100%)', borderBottom: '2px solid rgba(147,197,253,0.2)' }}>
              <span style={{ color: 'rgba(226,232,240,0.82)', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Danh sách bộ từ
              </span>
            </div>

            {/* Filter sidebar */}
            <div className="px-3 py-2.5 space-y-2" style={{ background: '#f8fafc', borderBottom: '1px solid #c2cfe0' }}>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={searchSet} onChange={e => setSearchSet(e.target.value)} placeholder="Tìm bộ từ..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]/50 bg-white" />
              </div>
              <div className="flex gap-1.5">
                <select value={filterLoai} onChange={e => setFilterLoai(e.target.value)} className={`${filterSelectCls} flex-1`}>
                  <option value="">Tất cả loại</option>
                  {LOAI_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={filterCapDo} onChange={e => setFilterCapDo(e.target.value)} className={`${filterSelectCls} flex-1`}>
                  <option value="">Tất cả cấp</option>
                  {CAP_DO_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              {(filterLoai || filterCapDo || searchSet) && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#1e3a5f] font-semibold">{filteredList.length}/{list.length} bộ từ</span>
                  <button onClick={() => { setFilterLoai(''); setFilterCapDo(''); setSearchSet('') }}
                    className="text-xs text-red-400 hover:text-red-600 font-semibold">Xóa lọc</button>
                </div>
              )}
            </div>

            {/* Set items */}
            <div className="divide-y divide-[#c2cfe0] max-h-[60vh] overflow-y-auto">
              {filteredList.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">Không tìm thấy bộ từ nào</div>
              )}
              {filteredList.map(set => {
                const isSelected = selectedSet?.id === set.id
                return (
                  <div key={set.id as string} onClick={() => loadWords(set)}
                    className="group cursor-pointer transition-colors hover:bg-blue-50"
                    style={{ padding: '12px 14px', background: isSelected ? '#eff6ff' : undefined, borderLeft: isSelected ? '3px solid #1e3a5f' : '3px solid transparent' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 text-base truncate">{set.ten_bo as string}</div>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${LOAI_COLOR[set.loai_bo as string] || 'bg-gray-100 text-gray-500'}`}>{set.loai_bo as string}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${LEVEL_COLOR[set.cap_do as string] || 'bg-gray-100 text-gray-500'}`}>{set.cap_do as string}</span>
                          <span className="text-xs text-gray-400 font-medium">{set.tong_so_tu as number} từ</span>
                        </div>
                      </div>
                      {/* ✏️ Sửa + 🗑️ Xóa ở cấp bộ từ */}
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={e => { setSelectedSet(set); openEditSet(set, e) }}
                          className="p-1 rounded-lg text-blue-400 border border-blue-200 hover:bg-blue-500 hover:text-white transition-all">
                          <Pencil size={14} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); deleteSet(set.id as string) }}
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
              <button onClick={() => setShowNewSet(true)}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#1e3a5f] py-2 rounded-lg hover:bg-blue-50 transition-colors">
                <Plus size={13} /> Tạo bộ từ mới
              </button>
            </div>
          </div>
        </div>

        {/* ── Word panel ── */}
        <div className="lg:col-span-3 space-y-4">
          {selectedSet ? (
            <>
              {/* ── Panel thống kê ── */}
              {stats && (
                <div className="grid grid-cols-3 gap-3">
                  {/* Sinh viên đang học */}
                  <div className="rounded-2xl p-4 flex items-center gap-3" style={{ border: '2px solid #bfdbfe', background: 'linear-gradient(135deg,#fff 60%,#eff6ff)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#dbeafe', color: '#2563eb', border: '1.5px solid #bfdbfe' }}>
                      <Users size={22} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.tong_sinh_vien}</div>
                      <div className="text-sm text-gray-500 mt-1">Sinh viên học</div>
                    </div>
                  </div>
                  {/* Tỉ lệ thuần thục */}
                  <div className="rounded-2xl p-4 flex items-center gap-3" style={{ border: '2px solid #a7f3d0', background: 'linear-gradient(135deg,#fff 60%,#ecfdf5)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#d1fae5', color: '#059669', border: '1.5px solid #a7f3d0' }}>
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.ty_le_thuan_thuc}%</div>
                      <div className="text-sm text-gray-500 mt-1">Tỉ lệ thuần thục</div>
                    </div>
                  </div>
                  {/* Tổng lượt học */}
                  <div className="rounded-2xl p-4 flex items-center gap-3" style={{ border: '2px solid #fde68a', background: 'linear-gradient(135deg,#fff 60%,#fffbeb)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#fef3c7', color: '#d97706', border: '1.5px solid #fde68a' }}>
                      <BarChart2 size={22} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.tong_luot_hoc}</div>
                      <div className="text-sm text-gray-500 mt-1">Tổng lượt học</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status bar chart */}
              {stats && stats.tong_luot_hoc > 0 && <StatusBar stats={stats} />}

              {/* ── Bảng từ ── */}
              <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>

                {/* Panel header */}
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
                  <div>
                    <div className="text-white font-bold text-base">{selectedSet.ten_bo as string}</div>
                    <div className="text-blue-200 text-sm mt-0.5">{words.length} từ · AI tự động sinh nội dung khi cần</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowCsv(v => !v)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <Upload size={14} /> Import CSV
                    </button>
                    <button onClick={() => setShowAddWord(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-[#1e3a5f] transition-all"
                      style={{ background: '#fff' }}>
                      <Plus size={14} strokeWidth={2.5} /> Thêm từ
                    </button>
                  </div>
                </div>

                {/* Filter bar */}
                <div className="px-4 py-3 flex flex-wrap items-center gap-2"
                  style={{ background: '#f1f5f9', borderBottom: '1px solid #c2cfe0' }}>
                  <Filter size={13} className="text-gray-400 flex-shrink-0" />
                  <div className="relative flex-1 min-w-[140px] max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={searchWord} onChange={e => setSearchWord(e.target.value)} placeholder="Tìm từ..."
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]/50 bg-white" />
                  </div>
                  <select value={filterWordType} onChange={e => setFilterWordType(e.target.value)} className={filterSelectCls}>
                    <option value="">Tất cả loại từ</option>
                    {LOAI_TU_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <select value={filterWordLevel} onChange={e => setFilterWordLevel(e.target.value)} className={filterSelectCls}>
                    <option value="">Tất cả cấp độ</option>
                    {['A1','A2','B1','B2','C1','C2'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  {hasWordFilter && (
                    <>
                      <span className="text-xs text-[#1e3a5f] font-semibold whitespace-nowrap">{filteredWords.length}/{words.length} từ</span>
                      <button onClick={() => { setSearchWord(''); setFilterWordType(''); setFilterWordLevel('') }}
                        className="text-xs text-red-400 hover:text-red-600 font-semibold whitespace-nowrap">Xóa lọc</button>
                    </>
                  )}
                </div>

                {/* CSV */}
                {showCsv && (
                  <div className="px-5 py-4" style={{ background: '#f1f5f9', borderBottom: '1px solid #c2cfe0' }}>
                    <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                      Import hàng loạt — định dạng: <span className="font-mono normal-case">word, loai_tu, cap_do</span>
                    </div>
                    <textarea value={csvText} onChange={e => setCsvText(e.target.value)}
                      placeholder={"meticulous, adjective, C1\npersistent, adjective, B2"} rows={3}
                      className="w-full text-xs font-mono p-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#1e3a5f]/40 resize-none bg-white" />
                    <div className="flex gap-2 mt-2">
                      <button onClick={importCSV} disabled={!csvText.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                        <Upload size={14} /> Import {csvText.trim().split('\n').filter(Boolean).length} từ
                      </button>
                      <button onClick={() => { setShowCsv(false); setCsvText('') }}
                        className="px-4 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">Hủy</button>
                    </div>
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                  {loadingWords ? (
                    <div className="text-center py-16 text-gray-400 text-base">
                      <div className="w-6 h-6 border-2 border-[#1e3a5f]/30 border-t-[#1e3a5f] rounded-full animate-spin mx-auto mb-3" />
                      Đang tải...
                    </div>
                  ) : (
                    <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                      <thead>
                        <tr>
                          {wordTableCols.map((col, ci) => (
                            <th key={col.label} style={{ ...TH, minWidth: col.minWidth, borderRight: ci < wordTableCols.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedWords.length === 0 ? (
                          <tr>
                            <td colSpan={wordTableCols.length} className="text-center py-16 text-gray-400 bg-white">
                              <BookOpen className="mx-auto mb-3 text-gray-300" size={48} strokeWidth={1.5} />
                              <div>{words.length === 0 ? 'Chưa có từ nào. Thêm từ hoặc import CSV!' : 'Không tìm thấy từ phù hợp.'}</div>
                            </td>
                          </tr>
                        ) : pagedWords.map((w, i) => {
                          const cache = w.TuVungCache as Record<string, string> | null
                          const globalIdx = (page - 1) * PAGE_SIZE + i + 1
                          const even = i % 2 === 0
                          return (
                            <tr key={w.id as string}
                              style={{ background: even ? '#f1f5f9' : '#ffffff', transition: 'background 0.1s' }}
                              className="hover:!bg-blue-50 group">
                              <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', textAlign: 'center' }}>
                                <span className="text-sm font-mono font-semibold text-gray-400">{globalIdx}</span>
                              </td>
                              <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', whiteSpace: 'nowrap' }}>
                                <span className="font-semibold text-gray-800 text-[15px]">{w.tu_tieng_anh as string}</span>
                              </td>
                              <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px' }}>
                                <span className="text-sm text-gray-600">
                                  {cache?.nghia_tieng_viet || <span className="text-gray-300 italic">Chưa có nghĩa</span>}
                                </span>
                              </td>
                              <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', whiteSpace: 'nowrap' }}>
                                <span className="text-sm font-mono text-gray-400">{cache?.phat_am_ipa || '—'}</span>
                              </td>
                              <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', whiteSpace: 'nowrap' }}>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${WORD_TYPE_COLOR[w.loai_tu as string] || 'bg-gray-100 text-gray-500'}`}>
                                  {w.loai_tu as string}
                                </span>
                              </td>
                              <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '11px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${LEVEL_COLOR[w.cap_do as string] || 'bg-gray-100 text-gray-500'}`}>
                                  {w.cap_do as string}
                                </span>
                              </td>
                              <td style={{ borderBottom: CELL_BORDER, padding: '11px 14px' }}>
                                <button onClick={() => deleteWord(w.id as string)}
                                  className="p-2 rounded-lg text-red-400 border border-red-200 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Footer + pagination */}
                {filteredWords.length > 0 && (
                  <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
                    style={{ background: '#f8fafc', borderTop: '2px solid #c2cfe0' }}>
                    <span className="text-sm text-gray-500">
                      {hasWordFilter
                        ? <>Lọc được <strong className="text-[#1e3a5f]">{filteredWords.length}</strong> / <strong className="text-[#1e3a5f]">{words.length}</strong> từ</>
                        : <>Tổng <strong className="text-[#1e3a5f]">{words.length}</strong> từ</>
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
                            if (idx > 0 && typeof arr[idx-1] === 'number' && (p as number) - (arr[idx-1] as number) > 1) acc.push('...')
                            acc.push(p); return acc
                          }, [])
                          .map((p, idx) => p === '...'
                            ? <span key={`e${idx}`} className="px-1 text-gray-400 text-sm">…</span>
                            : <button key={p} onClick={() => setPage(p as number)}
                                className="w-8 h-8 rounded-lg text-sm font-semibold transition-colors"
                                style={{ background: page === p ? 'linear-gradient(135deg,#0f2847,#1e3a5f)' : undefined, color: page === p ? '#fff' : '#374151', border: page === p ? 'none' : '1px solid #e5e7eb' }}>
                                {p}
                              </button>
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
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-md flex flex-col items-center justify-center py-20 text-center"
              style={{ border: '2px solid #b0bfd4' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                <BookOpen size={32} color="white" strokeWidth={1.8} />
              </div>
              <div className="font-semibold text-gray-700 text-base">Chọn bộ từ bên trái để quản lý</div>
              <div className="text-sm text-gray-400 mt-1">Hoặc tạo bộ từ mới</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Tạo bộ từ mới ── */}
      {showNewSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,20,40,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowNewSet(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
              <div>
                <div className="text-white font-bold text-base">Tạo bộ từ mới</div>
                <div className="text-blue-200 text-xs mt-0.5">Điền thông tin bên dưới</div>
              </div>
              <button onClick={() => setShowNewSet(false)} className="text-white/60 hover:text-white"><X size={18} strokeWidth={2.5} /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Tên bộ từ *</label>
                <input className={inputCls} placeholder="TOEIC Essential 600" value={newSet.ten_bo} onChange={e => setNewSet(p => ({ ...p, ten_bo: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Mô tả</label>
                <input className={inputCls} placeholder="Từ vựng thiết yếu..." value={newSet.mo_ta} onChange={e => setNewSet(p => ({ ...p, mo_ta: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Loại</label>
                  <select className={inputCls} value={newSet.loai_bo} onChange={e => setNewSet(p => ({ ...p, loai_bo: e.target.value }))}>
                    {LOAI_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Cấp độ</label>
                  <select className={inputCls} value={newSet.cap_do} onChange={e => setNewSet(p => ({ ...p, cap_do: e.target.value }))}>
                    {CAP_DO_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setShowNewSet(false)} className="px-5 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">Hủy</button>
              <button onClick={createSet} className="px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>Tạo bộ từ</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Sửa bộ từ ── */}
      {showEditSet && selectedSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,20,40,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowEditSet(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
              <div>
                <div className="text-white font-bold text-base">Sửa bộ từ</div>
                <div className="text-blue-200 text-xs mt-0.5 truncate max-w-[240px]">{selectedSet.ten_bo as string}</div>
              </div>
              <button onClick={() => setShowEditSet(false)} className="text-white/60 hover:text-white"><X size={18} strokeWidth={2.5} /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Tên bộ từ *</label>
                <input className={inputCls} value={editSet.ten_bo} onChange={e => setEditSet(p => ({ ...p, ten_bo: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Mô tả</label>
                <input className={inputCls} value={editSet.mo_ta} onChange={e => setEditSet(p => ({ ...p, mo_ta: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Loại</label>
                  <select className={inputCls} value={editSet.loai_bo} onChange={e => setEditSet(p => ({ ...p, loai_bo: e.target.value }))}>
                    {LOAI_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Cấp độ</label>
                  <select className={inputCls} value={editSet.cap_do} onChange={e => setEditSet(p => ({ ...p, cap_do: e.target.value }))}>
                    {CAP_DO_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setShowEditSet(false)} className="px-5 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">Hủy</button>
              <button onClick={saveEditSet} className="px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Thêm từ ── */}
      {showAddWord && selectedSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,20,40,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowAddWord(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
              <div>
                <div className="text-white font-bold text-base">Thêm từ vựng</div>
                <div className="text-blue-200 text-xs mt-0.5 truncate max-w-[200px]">{selectedSet.ten_bo as string}</div>
              </div>
              <button onClick={() => setShowAddWord(false)} className="text-white/60 hover:text-white"><X size={18} strokeWidth={2.5} /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Từ tiếng Anh *</label>
                <input className={`${inputCls} font-mono`} placeholder="meticulous"
                  value={newWord.tu_tieng_anh} onChange={e => setNewWord(p => ({ ...p, tu_tieng_anh: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Loại từ</label>
                  <select className={inputCls} value={newWord.loai_tu} onChange={e => setNewWord(p => ({ ...p, loai_tu: e.target.value }))}>
                    {LOAI_TU_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Cấp độ</label>
                  <select className={inputCls} value={newWord.cap_do} onChange={e => setNewWord(p => ({ ...p, cap_do: e.target.value }))}>
                    {['A1','A2','B1','B2','C1','C2'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                💡 AI sẽ tự động sinh nghĩa, ví dụ và cách nhớ khi sinh viên học từ này.
              </p>
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setShowAddWord(false)} className="px-5 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">Hủy</button>
              <button onClick={addWord} disabled={!newWord.tu_tieng_anh.trim()}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>Thêm từ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}