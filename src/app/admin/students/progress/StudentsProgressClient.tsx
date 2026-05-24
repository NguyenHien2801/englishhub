'use client'
import { useState, useMemo } from 'react'

type Student = Record<string, unknown>
type VocabProgress = { nguoi_dung_id: string; trang_thai: string }
type GrammarProgress = { nguoi_dung_id: string; da_hoan_thanh: boolean; diem_bai_tap: number }
type Session = { nguoi_dung_id: string; loai_chung_chi: string; diem_so: number }

const LEVEL_COLOR: Record<string, string> = {
  A1: 'bg-[#ede9fe] text-[#7c3aed]',
  A2: 'bg-[#e0f2fe] text-[#0369a1]',
  B1: 'bg-[#dcfce7] text-[#15803d]',
  B2: 'bg-[#fef9c3] text-[#a16207]',
  C1: 'bg-[#fee2e2] text-[#dc2626]',
  C2: 'bg-[#fae8ff] text-[#9333ea]',
}

const GOAL_COLOR: Record<string, string> = {
  VSTEP:   'bg-blue-100 text-blue-700',
  TOEIC:   'bg-purple-100 text-purple-700',
  APTIS:   'bg-pink-100 text-pink-700',
  GENERAL: 'bg-teal-100 text-teal-700',
}

function daysSince(d: string | null) {
  if (!d) return null
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
}

// Avatar giống modal students-client
function getAvatarColor(name: string) {
  const colors = [
    'linear-gradient(135deg,#0f2847,#2563eb)',
    'linear-gradient(135deg,#065f46,#10b981)',
    'linear-gradient(135deg,#7c3aed,#a78bfa)',
    'linear-gradient(135deg,#b45309,#f59e0b)',
    'linear-gradient(135deg,#be123c,#f43f5e)',
    'linear-gradient(135deg,#0369a1,#38bdf8)',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size <= 36 ? 9 : 14,
      background: getAvatarColor(name || ''), flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size <= 36 ? 13 : 22, fontWeight: 800, color: '#fff',
    }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

// ── Table header style — khớp students-client ─────────────
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

export default function StudentsProgressClient({
  students, vocab, grammar, sessions
}: {
  students: Student[]
  vocab: VocabProgress[]
  grammar: GrammarProgress[]
  sessions: Session[]
}) {
  const [search, setSearch]           = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [sortBy, setSortBy]           = useState<'tu_vung' | 'streak' | 'phien_thi'>('tu_vung')
  const [selected, setSelected]       = useState<Student | null>(null)

  const studentStats = useMemo(() => {
    const vocabByUser = new Map<string, { total: number; mastered: number }>()
    for (const v of vocab) {
      const cur = vocabByUser.get(v.nguoi_dung_id) || { total: 0, mastered: 0 }
      cur.total++
      if (v.trang_thai === 'thuan_thuc') cur.mastered++
      vocabByUser.set(v.nguoi_dung_id, cur)
    }
    const grammarByUser = new Map<string, { done: number; avg: number }>()
    for (const g of grammar) {
      const cur = grammarByUser.get(g.nguoi_dung_id) || { done: 0, avg: 0 }
      if (g.da_hoan_thanh) { cur.done++; cur.avg = (cur.avg + (g.diem_bai_tap || 0)) / 2 }
      grammarByUser.set(g.nguoi_dung_id, cur)
    }
    const sessionsByUser = new Map<string, number>()
    for (const s of sessions) sessionsByUser.set(s.nguoi_dung_id, (sessionsByUser.get(s.nguoi_dung_id) || 0) + 1)
    return students.map(s => ({
      ...(s as Record<string, unknown>),
      _vocab:    vocabByUser.get(s.id as string)    || { total: 0, mastered: 0 },
      _grammar:  grammarByUser.get(s.id as string)  || { done: 0, avg: 0 },
      _sessions: sessionsByUser.get(s.id as string) || 0,
    }))
  }, [students, vocab, grammar, sessions])

  const filtered = useMemo(() => {
    let list = studentStats.filter(s => {
      const q = search.toLowerCase()
      const u = s as Record<string, unknown>
      return (
        (!q || (u.ho_ten as string).toLowerCase().includes(q) || (u.ma_sinh_vien as string).toLowerCase().includes(q)) &&
        (!filterLevel || u.trinh_do_hien_tai === filterLevel)
      )
    })
    if (sortBy === 'tu_vung')      list = list.sort((a, b) => b._vocab.total - a._vocab.total)
    else if (sortBy === 'streak')  list = list.sort((a, b) => ((b as Record<string, unknown>).streak_hien_tai as number || 0) - ((a as Record<string, unknown>).streak_hien_tai as number || 0))
    else                           list = list.sort((a, b) => b._sessions - a._sessions)
    return list
  }, [studentStats, search, filterLevel, sortBy])

  const selectedStats = selected
    ? studentStats.find(s => (s as Record<string, unknown>).id === selected.id)
    : null

  const summaryCards = [
    { label: 'Tổng sinh viên',     value: students.length,                              icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
        <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85"/>
      </svg>
    ), color: '#1e3a5f' },
    { label: 'Từ vựng đã học',     value: vocab.length,                                 icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
      </svg>
    ), color: '#2563eb' },
    { label: 'Bài ngữ pháp xong', value: grammar.filter(g => g.da_hoan_thanh).length,  icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ), color: '#059669' },
    { label: 'Phiên luyện thi',    value: sessions.length,                              icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16"/>
      </svg>
    ), color: '#d97706' },
  ]

  const cols = [
    { label: 'STT',        minWidth: 48  },
    { label: 'Sinh viên',  minWidth: 180 },
    { label: 'Trình độ',   minWidth: 80  },
    { label: 'Mục tiêu',   minWidth: 90  },
    { label: 'Từ vựng',    minWidth: 80  },
    { label: 'Ngữ pháp',   minWidth: 80  },
    { label: 'Streak',     minWidth: 75  },
    { label: 'Phiên thi',  minWidth: 80  },
    { label: 'Hoạt động',  minWidth: 120 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily: 'DM Sans,sans-serif' }}>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tiến độ học tập</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Tổng <span className="font-semibold text-[#1e3a5f]">{students.length}</span> sinh viên
            {filtered.length !== students.length && (
              <> · đang lọc <span className="font-semibold text-[#1e3a5f]">{filtered.length}</span> kết quả</>
            )}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {summaryCards.map(c => (
          <div key={c.label} className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            border: `2px solid ${c.color}30`,
            background: `linear-gradient(135deg, #fff 60%, ${c.color}0d 100%)`,
          }}>
           <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: `${c.color}15`, color: c.color, border: `1.5px solid ${c.color}25` }}>
              {c.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{c.value.toLocaleString('vi-VN')}</div>
              <div className="text-sm text-gray-500 mt-0.5">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters — khớp students-client */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, MSSV..."
            className="w-full pl-9 pr-9 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white">
          <option value="">Tất cả trình độ</option>
          {['A1','A2','B1','B2','C1','C2'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white">
          <option value="tu_vung">Sắp xếp: Từ vựng nhiều nhất</option>
          <option value="streak">Sắp xếp: Streak cao nhất</option>
          <option value="phien_thi">Sắp xếp: Phiên thi nhiều nhất</option>
        </select>
        {(search || filterLevel) && (
          <button onClick={() => { setSearch(''); setFilterLevel('') }}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm hover:border-red-300 hover:text-red-500 transition-colors bg-white">
            Xoá lọc
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">

        {/* ── Table ── */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {cols.map((col, ci) => (
                    <th key={col.label} style={{
                      ...TH,
                      minWidth: col.minWidth,
                      borderRight: ci < cols.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                    }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={cols.length} className="text-center py-16 text-gray-400 bg-white">
                      <svg className="mx-auto mb-2 text-gray-300" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
                      </svg>
                      Không tìm thấy kết quả nào
                    </td>
                  </tr>
                ) : filtered.map((s, i) => {
                  const u = s as Record<string, unknown>
                  const days = daysSince(u.ngay_hoc_cuoi as string | null)
                  const isSelected = selected?.id === u.id
                  const even = i % 2 === 0
                  return (
                    <tr key={u.id as string}
                      onClick={() => setSelected(isSelected ? null : s)}
                      style={{
                        background: isSelected ? '#eff6ff' : even ? '#f1f5f9' : '#ffffff',
                        cursor: 'pointer', transition: 'background 0.1s',
                      }}
                      className="hover:!bg-blue-50 group">
                      {/* STT */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center' }}>
                        <span className="text-sm font-mono font-semibold text-gray-400">{i + 1}</span>
                      </td>
                      {/* Sinh viên */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <div className="font-semibold text-gray-800 text-[15px]">{u.ho_ten as string}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{u.ma_sinh_vien as string}</div>
                      </td>
                      {/* Trình độ */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${LEVEL_COLOR[u.trinh_do_hien_tai as string] || 'bg-gray-100 text-gray-500'}`}>
                          {u.trinh_do_hien_tai as string}
                        </span>
                      </td>
                      {/* Mục tiêu */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${GOAL_COLOR[u.muc_tieu_hoc as string] || 'bg-gray-100 text-gray-500'}`}>
                          {u.muc_tieu_hoc as string}
                        </span>
                      </td>
                      {/* Từ vựng */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span className="text-sm font-semibold text-gray-800">{s._vocab.total}</span>
                        {s._vocab.mastered > 0 && (
                          <div className="text-[11px] text-emerald-600 mt-0.5">{s._vocab.mastered} thuần thục</div>
                        )}
                      </td>
                      {/* Ngữ pháp */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span className="text-sm font-semibold text-gray-800">{s._grammar.done}</span>
                      </td>
                      {/* Streak */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span className={`text-sm font-semibold ${(u.streak_hien_tai as number) > 7 ? 'text-amber-500' : 'text-gray-500'}`}>
                          🔥 {(u.streak_hien_tai as number) ?? 0}
                        </span>
                      </td>
                      {/* Phiên thi */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span className="text-sm text-gray-600">{s._sessions}</span>
                      </td>
                      {/* Hoạt động */}
                      <td style={{ borderBottom: CELL_BORDER, padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {days === null
                          ? <span className="text-xs text-gray-400">Chưa học</span>
                          : days === 0
                            ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Hôm nay</span>
                            : <span className="text-xs text-gray-400">{days} ngày trước</span>
                        }
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
              {filtered.length !== students.length && (
                <span className="text-gray-400">Lọc từ {students.length} sinh viên</span>
              )}
            </div>
          )}
        </div>

        {/* ── Detail panel ── */}
        <div className="lg:col-span-2">
          {selectedStats ? (() => {
            const u = selectedStats as Record<string, unknown>
            return (
              <div className="bg-white rounded-2xl shadow-md sticky top-4 overflow-hidden"
                style={{ border: '2px solid #b0bfd4' }}>
                {/* Panel header — navy gradient như modal */}
                <div className="flex items-center gap-4 px-5 py-4"
                  style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
                  <Avatar name={u.ho_ten as string} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-base truncate">{u.ho_ten as string}</div>
                    <div className="text-blue-200 text-sm font-mono">{u.ma_sinh_vien as string}</div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${LEVEL_COLOR[u.trinh_do_hien_tai as string] || 'bg-gray-100 text-gray-500'}`}>
                    {u.trinh_do_hien_tai as string}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Lớp',          value: (u.lop as string) || '–' },
                      { label: 'Khoa',          value: (u.khoa as string) || '–' },
                      { label: 'Mục tiêu',      value: u.muc_tieu_hoc as string },
                      { label: 'Streak cao nhất', value: `🔥 ${u.streak_cao_nhat as number ?? 0}` },
                    ].map(item => (
                      <div key={item.label} className="p-2.5 rounded-xl" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                        <div className="text-xs text-gray-400">{item.label}</div>
                        <div className="font-semibold text-sm text-gray-800 mt-0.5">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Từ vựng */}
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Từ vựng</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Đang học',   value: selectedStats._vocab.total,                        color: '#2563eb' },
                        { label: 'Thuần thục', value: selectedStats._vocab.mastered,                     color: '#059669' },
                        { label: 'Tổng SRS',   value: (u.tong_so_tu_da_hoc as number) || 0,              color: '#7c3aed' },
                      ].map(item => (
                        <div key={item.label} className="rounded-xl p-2.5 text-center" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                          <div className="font-bold text-base" style={{ color: item.color }}>{item.value}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ngữ pháp & Luyện thi */}
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ngữ pháp & Luyện thi</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Bài ngữ pháp xong', value: selectedStats._grammar.done,  color: '#d97706' },
                        { label: 'Phiên luyện thi',   value: selectedStats._sessions,       color: '#0369a1' },
                      ].map(item => (
                        <div key={item.label} className="rounded-xl p-2.5 text-center" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                          <div className="font-bold text-base" style={{ color: item.color }}>{item.value}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Streak bar */}
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Streak hiện tại</div>
                    <div className="rounded-xl p-3" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-amber-600">🔥 {(u.streak_hien_tai as number) ?? 0} ngày</span>
                        <span className="text-xs text-gray-400">Cao nhất: {(u.streak_cao_nhat as number) ?? 0} ngày</span>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ background: '#e2e8f0' }}>
                        <div className="h-2 rounded-full transition-all"
                          style={{
                            background: 'linear-gradient(90deg,#f59e0b,#ef4444)',
                            width: `${Math.min(100, ((u.streak_hien_tai as number) ?? 0) / Math.max(1, (u.streak_cao_nhat as number) ?? 1) * 100)}%`,
                          }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })() : (
            <div className="bg-white rounded-2xl shadow-md flex flex-col items-center justify-center py-16 text-center"
              style={{ border: '2px solid #b0bfd4' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                  <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16"/>
                </svg>
              </div>
              <div className="font-semibold text-gray-700 text-sm">Chọn sinh viên để xem chi tiết</div>
              <div className="text-xs text-gray-400 mt-1">Click vào một hàng trong bảng</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}