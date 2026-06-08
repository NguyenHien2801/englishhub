'use client'
import { useState, useMemo } from 'react'

type Session = Record<string, unknown>

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

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
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
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

const CERT_COLOR: Record<string, string> = {
  VSTEP:  'bg-[#d1fae5] text-[#065f46]',
  TOEIC:  'bg-[#fef3c7] text-[#92400e]',
  APTIS:  'bg-[#ede9fe] text-[#5b21b6]',
}

const SKILL_COLOR: Record<string, string> = {
  'Đọc':      'bg-[#dbeafe] text-[#1d4ed8]',
  'Nghe':     'bg-[#f3e8ff] text-[#6b21a8]',
  'Viết':     'bg-[#fee2e2] text-[#991b1b]',
  'Nói':      'bg-[#fef3c7] text-[#92400e]',
  'Tổng hợp': 'bg-[#d1fae5] text-[#065f46]',
}

const TH: React.CSSProperties = {
  background: 'linear-gradient(180deg, #2d4e7a 0%, #1e3a5f 100%)',
  color: 'rgba(226,232,240,0.82)',
  padding: '11px 14px',
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.07em',
  whiteSpace: 'nowrap' as const,
  userSelect: 'none' as const,
  borderBottom: '2px solid rgba(147,197,253,0.2)',
}
const CELL_BORDER = '1px solid #c2cfe0'

export default function ExamsHistoryClient({ sessions }: { sessions: Session[] }) {
  const [search,      setSearch]      = useState('')
  const [filterCert,  setFilterCert]  = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [selected,    setSelected]    = useState<Session | null>(null)

  const months = useMemo(() => {
    const set = new Set(sessions.map(s => (s.created_at as string).slice(0, 7)))
    return Array.from(set).sort().reverse()
  }, [sessions])

  const filtered = useMemo(() => sessions.filter(s => {
    const user = s.NguoiDung as Record<string, string> | null
    const q = search.toLowerCase()
    return (
      (!q || user?.ho_ten?.toLowerCase().includes(q) || user?.ma_sinh_vien?.toLowerCase().includes(q)) &&
      (!filterCert  || s.loai_chung_chi === filterCert) &&
      (!filterMonth || (s.created_at as string).startsWith(filterMonth))
    )
  }), [sessions, search, filterCert, filterMonth])

  function exportCSV() {
    const rows = [
      ['Mã SV','Họ tên','Lớp','Khoa','Chứng chỉ','Kỹ năng','Câu đúng','Tổng câu','Điểm (%)','Điểm quy đổi','Thời gian (s)','Ngày thi'],
      ...filtered.map(s => {
        const u = s.NguoiDung as Record<string, string> | null
        const pct = s.tong_so_cau ? Math.round(((s.so_cau_dung as number) / (s.tong_so_cau as number)) * 100) : ''
        return [u?.ma_sinh_vien, u?.ho_ten, u?.lop, u?.khoa, s.loai_chung_chi, s.ky_nang, s.so_cau_dung, s.tong_so_cau, pct, s.diem_quy_doi, s.thoi_gian_lam_bai, fmtDate(s.created_at as string)]
      })
    ]
    const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `lich-su-thi-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const totalPass      = filtered.filter(s => s.tong_so_cau && ((s.so_cau_dung as number) / (s.tong_so_cau as number)) >= 0.7).length
  const avgScore       = filtered.length
    ? Math.round(filtered.reduce((acc, s) => acc + (s.tong_so_cau ? ((s.so_cau_dung as number) / (s.tong_so_cau as number)) * 100 : 0), 0) / filtered.length)
    : 0
  const uniqueStudents = new Set(filtered.map(s => (s.NguoiDung as Record<string, string> | null)?.ma_sinh_vien)).size

  const summaryCards = [
    { label: 'Tổng phiên thi', value: sessions.length, icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16"/>
      </svg>
    ), color: '#1e3a5f' },
    { label: 'Sinh viên tham gia', value: uniqueStudents, icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
        <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85"/>
      </svg>
    ), color: '#2563eb' },
    { label: 'Đạt (≥ 70%)', value: totalPass, icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
      </svg>
    ), color: '#059669' },
    { label: 'Điểm trung bình', value: `${avgScore}%`, icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
      </svg>
    ), color: '#d97706' },
  ]

  const cols = [
    { label: 'STT',       minWidth: 48  },
    { label: 'Sinh viên', minWidth: 180 },
    { label: 'Lớp',       minWidth: 80  },
    { label: 'Chứng chỉ', minWidth: 90  },
    { label: 'Kỹ năng',   minWidth: 100 },
    { label: 'Câu đúng',  minWidth: 85  },
    { label: 'Điểm (%)',  minWidth: 80  },
    { label: 'Điểm QĐ',  minWidth: 75  },
    { label: 'Ngày thi',  minWidth: 140 },
  ]

  const selUser = selected ? (selected.NguoiDung as Record<string, unknown>) || {} : null
  const selPct  = selected && selected.tong_so_cau
    ? Math.round(((selected.so_cau_dung as number) / (selected.tong_so_cau as number)) * 100)
    : null

  return (
    <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LỊCH SỬ THI</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Tổng <span className="font-semibold text-[#1e3a5f]">{sessions.length}</span> phiên thi
            {filtered.length !== sessions.length && (
              <> · đang lọc <span className="font-semibold text-[#1e3a5f]">{filtered.length}</span> kết quả</>
            )}
          </p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Xuất CSV
        </button>
      </div>

      {/* Summary cards — giống hệt StudentsProgressClient */}
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
              <div className="text-2xl font-bold text-gray-900">
                {typeof c.value === 'number' ? c.value.toLocaleString('vi-VN') : c.value}
              </div>
              <div className="text-sm text-gray-700 mt-0.5">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters — giống hệt StudentsProgressClient */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã SV..."
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
        <select value={filterCert} onChange={e => setFilterCert(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white">
          <option value="">Tất cả chứng chỉ</option>
          {['VSTEP','TOEIC','APTIS'].map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white">
          <option value="">Tất cả tháng</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {(search || filterCert || filterMonth) && (
          <button onClick={() => { setSearch(''); setFilterCert(''); setFilterMonth('') }}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm hover:border-red-300 hover:text-red-500 transition-colors bg-white">
            Xoá lọc
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">

        {/* Table — giống hệt StudentsProgressClient */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>
          <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#b0bfd4 transparent' }}>
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
                        <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                      Không có kết quả
                    </td>
                  </tr>
                ) : filtered.slice(0, 100).map((s, i) => {
                  const user = s.NguoiDung as Record<string, string> | null
                  const pct  = s.tong_so_cau ? Math.round(((s.so_cau_dung as number) / (s.tong_so_cau as number)) * 100) : null
                  const isSelected = selected?.id === s.id
                  const even = i % 2 === 0
                  return (
                    <tr key={s.id as string}
                      onClick={() => setSelected(isSelected ? null : s)}
                      style={{
                        background: isSelected ? '#eff6ff' : even ? '#f1f5f9' : '#ffffff',
                        cursor: 'pointer', transition: 'background 0.1s',
                      }}
                      className="hover:!bg-blue-50 group">
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center' }}>
                        <span className="text-sm font-mono font-semibold text-gray-700">{i + 1}</span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <div className="flex items-center gap-2">
                          <Avatar name={user?.ho_ten || ''} size={28} />
                          <div>
                            <div className="font-semibold text-gray-800 text-[14px]">{user?.ho_ten || '–'}</div>
                            <div className="text-xs text-gray-500 font-mono">{user?.ma_sinh_vien}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span className="text-sm text-gray-700">{user?.lop || '–'}</span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px' }}>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${CERT_COLOR[s.loai_chung_chi as string] || 'bg-gray-100 text-gray-500'}`}>
                          {s.loai_chung_chi as string}
                        </span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px' }}>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${SKILL_COLOR[s.ky_nang as string] || 'bg-gray-100 text-gray-500'}`}>
                          {(s.ky_nang as string) || '–'}
                        </span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span className="text-sm font-semibold text-gray-800">{s.so_cau_dung as number}</span>
                        <span className="text-sm text-gray-400">/{s.tong_so_cau as number}</span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center' }}>
                        {pct !== null ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            pct >= 70 ? 'bg-[#d1fae5] text-[#065f46]' :
                            pct >= 50 ? 'bg-[#fef3c7] text-[#92400e]' :
                                        'bg-[#fee2e2] text-[#991b1b]'
                          }`}>{pct}%</span>
                        ) : <span className="text-sm text-gray-400">–</span>}
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center' }}>
                        <span className="text-sm font-semibold text-gray-800">
                          {s.diem_quy_doi ? (s.diem_quy_doi as number).toFixed(1) : '–'}
                        </span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span className="text-sm text-gray-700">{fmtDate(s.created_at as string)}</span>
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
              <span>Tổng <strong className="text-[#1e3a5f]">{filtered.length}</strong> phiên thi</span>
              {filtered.length > 100 && (
                <span className="text-gray-400 text-xs">Hiển thị 100/{filtered.length} — Xuất CSV để xem đầy đủ</span>
              )}
            </div>
          )}
        </div>

        {/* Detail panel — giống hệt StudentsProgressClient */}
        <div className="lg:col-span-2">
          {selected && selUser ? (
            <div className="bg-white rounded-2xl shadow-md sticky top-4 overflow-hidden"
              style={{ border: '2px solid #b0bfd4' }}>
              {/* Header */}
              <div className="flex items-center gap-4 px-5 py-4"
                style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
                <Avatar name={selUser.ho_ten as string || ''} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-base truncate">{selUser.ho_ten as string || '–'}</div>
                  <div className="text-blue-200 text-sm font-mono">{selUser.ma_sinh_vien as string}</div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${CERT_COLOR[selected.loai_chung_chi as string] || 'bg-gray-100 text-gray-500'}`}>
                  {selected.loai_chung_chi as string}
                </span>
              </div>

              <div className="p-4 space-y-4">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Lớp',      value: (selUser.lop as string)  || '–' },
                    { label: 'Khoa',     value: (selUser.khoa as string) || '–' },
                    { label: 'Kỹ năng',  value: (selected.ky_nang as string) || '–' },
                    { label: 'Thời gian', value: selected.thoi_gian_lam_bai
                        ? `${Math.floor((selected.thoi_gian_lam_bai as number) / 60)}p ${(selected.thoi_gian_lam_bai as number) % 60}s`
                        : '–' },
                  ].map(item => (
                    <div key={item.label} className="p-2.5 rounded-xl" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                      <div className="text-xs text-gray-500">{item.label}</div>
                      <div className="font-semibold text-sm text-gray-800 mt-0.5">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Kết quả */}
                <div>
                  <div className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">Kết quả</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Câu đúng', value: selected.so_cau_dung as number, color: '#059669' },
                      { label: 'Tổng câu', value: selected.tong_so_cau as number, color: '#0369a1' },
                      { label: 'Điểm QĐ',  value: selected.diem_quy_doi ? (selected.diem_quy_doi as number).toFixed(1) : '–', color: '#d97706' },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl p-2.5 text-center" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                        <div className="font-bold text-base" style={{ color: item.color }}>{item.value}</div>
                        <div className="text-sm text-gray-700 mt-0.5">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score bar */}
                {selPct !== null && (
                  <div>
                    <div className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">Tỉ lệ đúng</div>
                    <div className="rounded-xl p-3" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          selPct >= 70 ? 'bg-[#d1fae5] text-[#065f46]' :
                          selPct >= 50 ? 'bg-[#fef3c7] text-[#92400e]' :
                                         'bg-[#fee2e2] text-[#991b1b]'
                        }`}>{selPct}%</span>
                        <span className="text-sm text-gray-600">
                          {selPct >= 70 ? '✅ Đạt' : selPct >= 50 ? '⚠️ Trung bình' : '❌ Chưa đạt'}
                        </span>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ background: '#e2e8f0' }}>
                        <div className="h-2 rounded-full transition-all"
                          style={{
                            width: `${selPct}%`,
                            background: selPct >= 70
                              ? 'linear-gradient(90deg,#10b981,#34d399)'
                              : selPct >= 50
                                ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                                : 'linear-gradient(90deg,#ef4444,#f87171)',
                          }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Ngày thi */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  {fmtDate(selected.created_at as string)}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md flex flex-col items-center justify-center py-16 text-center"
              style={{ border: '2px solid #b0bfd4' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                  <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16"/>
                </svg>
              </div>
              <div className="font-semibold text-gray-700 text-sm">Chọn phiên thi để xem chi tiết</div>
              <div className="text-sm text-gray-600 mt-1">Click vào một hàng trong bảng</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}