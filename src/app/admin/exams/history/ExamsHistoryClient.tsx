'use client'
import { useState, useMemo } from 'react'

type Session = Record<string, unknown>

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
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
  VSTEP: 'bg-[#d1fae5] text-[#065f46]',
  TOEIC: 'bg-[#fef3c7] text-[#92400e]',
  APTIS: 'bg-[#ede9fe] text-[#5b21b6]',
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

interface StudentGroup {
  mssv: string
  ho_ten: string
  lop: string
  khoa: string
  sessions: Session[]
}

export default function ExamsHistoryClient({ sessions }: { sessions: Session[] }) {
  const [search,      setSearch]      = useState('')
  const [filterCert,  setFilterCert]  = useState('')
  const [selected,    setSelected]    = useState<StudentGroup | null>(null)

  // Group sessions by student
  const grouped = useMemo(() => {
    const map = new Map<string, StudentGroup>()
    for (const s of sessions) {
      const u = s.NguoiDung as Record<string, string> | null
      const mssv = u?.ma_sinh_vien || 'unknown'
      if (!map.has(mssv)) {
        map.set(mssv, {
          mssv,
          ho_ten: u?.ho_ten || '–',
          lop: u?.lop || '–',
          khoa: u?.khoa || '–',
          sessions: [],
        })
      }
      map.get(mssv)!.sessions.push(s)
    }
    return Array.from(map.values())
  }, [sessions])

  const filtered = useMemo(() => grouped.filter(g => {
    const q = search.toLowerCase()
    const matchSearch = !q || g.ho_ten.toLowerCase().includes(q) || g.mssv.toLowerCase().includes(q)
    const matchCert = !filterCert || g.sessions.some(s => s.loai_chung_chi === filterCert)
    return matchSearch && matchCert
  }), [grouped, search, filterCert])

  function exportCSV() {
    const rows = [
      ['Mã SV','Họ tên','Lớp','Khoa','Chứng chỉ','Kỹ năng','Câu đúng','Tổng câu','Điểm (%)','Điểm quy đổi','Thời gian (s)','Ngày thi'],
      ...sessions.map(s => {
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

  const totalSessions   = sessions.length
  const uniqueStudents  = grouped.length
  const totalPass       = sessions.filter(s => s.tong_so_cau && ((s.so_cau_dung as number) / (s.tong_so_cau as number)) >= 0.7).length
  const avgScore        = sessions.length
    ? Math.round(sessions.reduce((acc, s) => acc + (s.tong_so_cau ? ((s.so_cau_dung as number) / (s.tong_so_cau as number)) * 100 : 0), 0) / sessions.length)
    : 0

  const cols = [
    { label: 'STT',        minWidth: 48  },
    { label: 'Sinh viên',  minWidth: 200 },
    { label: 'Lớp',        minWidth: 90  },
    { label: 'Số lần thi', minWidth: 90  },
    { label: 'Chứng chỉ',  minWidth: 130 },
    { label: 'Lần cuối',   minWidth: 120 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">LỊCH SỬ THI</h1>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Xuất CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Tổng phiên thi',     value: totalSessions,  color: '#1e3a5f',
            icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16"/></svg> },
          { label: 'Sinh viên tham gia', value: uniqueStudents, color: '#2563eb',
            icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85"/></svg> },
          { label: 'Đạt (≥ 70%)',        value: totalPass,      color: '#059669',
            icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg> },
          { label: 'Điểm trung bình',    value: `${avgScore}%`, color: '#d97706',
            icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg> },
        ].map(c => (
          <div key={c.label} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ border: `2px solid ${c.color}30`, background: `linear-gradient(135deg,#fff 60%,${c.color}0d 100%)` }}>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã SV..."
            className="w-full pl-9 pr-9 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
        {(search || filterCert) && (
          <button onClick={() => { setSearch(''); setFilterCert('') }}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm hover:border-red-300 hover:text-red-500 transition-colors bg-white">
            Xoá lọc
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">

        {/* Student list table */}
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
                ) : filtered.map((g, i) => {
                  const isSel = selected?.mssv === g.mssv
                  const even  = i % 2 === 0
                  // Unique certs
                  const certs = Array.from(new Set(g.sessions.map(s => s.loai_chung_chi as string).filter(Boolean)))
                  // Latest session
                  const latest = g.sessions.slice().sort((a, b) =>
                    new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
                  )[0]

                  return (
                    <tr key={g.mssv}
                      onClick={() => setSelected(isSel ? null : g)}
                      style={{
                        background: isSel ? '#eff6ff' : even ? '#f1f5f9' : '#ffffff',
                        cursor: 'pointer', transition: 'background 0.1s',
                        borderLeft: isSel ? '3px solid #1e3a5f' : '3px solid transparent',
                      }}
                      className="hover:!bg-blue-50">
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center' }}>
                        <span className="text-sm font-mono font-semibold text-gray-700">{i + 1}</span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={g.ho_ten} size={30} />
                          <div>
                            <div className="font-semibold text-gray-800 text-[14px]">{g.ho_ten}</div>
                            <div className="text-xs text-gray-500 font-mono">{g.mssv}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span className="text-sm text-gray-700">{g.lop}</span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center' }}>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#0f2847,#2563eb)' }}>
                          {g.sessions.length}
                        </span>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px' }}>
                        <div className="flex flex-wrap gap-1">
                          {certs.map(c => (
                            <span key={c} className={`text-xs px-2 py-0.5 rounded-full font-bold ${CERT_COLOR[c] || 'bg-gray-100 text-gray-500'}`}>{c}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ borderBottom: CELL_BORDER, padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span className="text-sm text-gray-600">{fmtDateShort(latest.created_at as string)}</span>
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
              <span>Tổng <strong className="text-[#1e3a5f]">{filtered.length}</strong> sinh viên</span>
              <span className="text-gray-400 text-xs">{sessions.length} phiên thi</span>
            </div>
          )}
        </div>

        {/* Detail panel: list of sessions for selected student */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-2xl shadow-md sticky top-4 overflow-hidden" style={{ border: '2px solid #b0bfd4' }}>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4"
                style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
                <Avatar name={selected.ho_ten} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-base truncate">{selected.ho_ten}</div>
                  <div className="text-blue-200 text-xs font-mono mt-0.5">{selected.mssv} · {selected.lop}</div>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Session list */}
              <div className="p-4 flex flex-col gap-3" style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                  {selected.sessions.length} phiên thi
                </div>
                {selected.sessions
                  .slice()
                  .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())
                  .map((s, idx) => {
                    const pct = s.tong_so_cau
                      ? Math.round(((s.so_cau_dung as number) / (s.tong_so_cau as number)) * 100)
                      : null
                    return (
                      <div key={s.id as string} className="rounded-xl p-3.5" style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
                        {/* Row 1: cert + skill + date */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-mono text-gray-400">#{selected.sessions.length - idx}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${CERT_COLOR[s.loai_chung_chi as string] || 'bg-gray-100 text-gray-500'}`}>
                              {s.loai_chung_chi as string}
                            </span>
                            {!!s.ky_nang && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SKILL_COLOR[s.ky_nang as string] || 'bg-gray-100 text-gray-500'}`}>
                                {s.ky_nang as string}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">{fmtDateShort(s.created_at as string)}</span>
                        </div>

                        {/* Row 2: stats */}
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold text-gray-700">
                            <span className="text-[#1e3a5f] font-bold">{s.so_cau_dung as number}</span>
                            <span className="text-gray-400 font-normal">/{s.tong_so_cau as number} câu</span>
                          </div>
                          {pct !== null && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              pct >= 70 ? 'bg-[#d1fae5] text-[#065f46]' :
                              pct >= 50 ? 'bg-[#fef3c7] text-[#92400e]' :
                                          'bg-[#fee2e2] text-[#991b1b]'
                            }`}>{pct}%</span>
                          )}
                          {!!s.diem_quy_doi && (
                            <span className="text-xs text-gray-500">
                              QĐ: <span className="font-bold text-gray-700">{(s.diem_quy_doi as number).toFixed(1)}</span>
                            </span>
                          )}
                          {!!s.thoi_gian_lam_bai && (
                            <span className="text-xs text-gray-400 ml-auto">
                              ⏱ {Math.floor((s.thoi_gian_lam_bai as number) / 60)}p{(s.thoi_gian_lam_bai as number) % 60}s
                            </span>
                          )}
                        </div>

                        {/* Progress bar */}
                        {pct !== null && (
                          <div className="mt-2.5 w-full rounded-full h-1.5" style={{ background: '#e2e8f0' }}>
                            <div className="h-1.5 rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                background: pct >= 70
                                  ? 'linear-gradient(90deg,#10b981,#34d399)'
                                  : pct >= 50
                                    ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                                    : 'linear-gradient(90deg,#ef4444,#f87171)',
                              }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
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
              <div className="font-semibold text-gray-700 text-sm">Chọn sinh viên để xem lịch sử</div>
              <div className="text-sm text-gray-500 mt-1">Click vào một hàng trong bảng</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}