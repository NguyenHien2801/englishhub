'use client'
import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'

type Session = Record<string, unknown>

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ExamsHistoryClient({ sessions }: { sessions: Session[] }) {
  const [search, setSearch] = useState('')
  const [filterCert, setFilterCert] = useState('')
  const [filterMonth, setFilterMonth] = useState('')

  const months = useMemo(() => {
    const set = new Set(sessions.map(s => (s.created_at as string).slice(0, 7)))
    return Array.from(set).sort().reverse()
  }, [sessions])

  const filtered = useMemo(() => sessions.filter(s => {
    const user = s.NguoiDung as Record<string, string> | null
    const q = search.toLowerCase()
    const matchSearch = !q || user?.ho_ten?.toLowerCase().includes(q) || user?.ma_sinh_vien?.toLowerCase().includes(q)
    const matchCert = !filterCert || s.loai_chung_chi === filterCert
    const matchMonth = !filterMonth || (s.created_at as string).startsWith(filterMonth)
    return matchSearch && matchCert && matchMonth
  }), [sessions, search, filterCert, filterMonth])

  function exportCSV() {
    const rows = [
      ['Mã SV', 'Họ tên', 'Lớp', 'Khoa', 'Chứng chỉ', 'Kỹ năng', 'Câu đúng', 'Tổng câu', 'Điểm (%)', 'Điểm quy đổi', 'Thời gian (s)', 'Ngày thi'],
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
    toast.success('Đã xuất file CSV!')
  }

  const certColor: Record<string, string> = {
    VSTEP: 'bg-[#E8FFF8] text-[#00A878]', TOEIC: 'bg-[#FFF8EC] text-[#F5A623]', APTIS: 'bg-[#F0F0FF] text-[#7C7CFF]',
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Lịch sử thi</h1>
          <p className="text-[#6B6B60] mt-1">Toàn bộ {sessions.length} phiên thi gần nhất</p>
        </div>
        <button onClick={exportCSV}
          className="px-5 py-2.5 bg-[#0D0D0D] text-white font-semibold rounded-xl hover:bg-[#333] transition-colors flex items-center gap-2">
          <span>⬇</span> Xuất CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tên, mã SV..."
          className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] w-60" />
        <select value={filterCert} onChange={e => setFilterCert(e.target.value)}
          className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
          <option value="">Tất cả chứng chỉ</option>
          {['VSTEP', 'TOEIC', 'APTIS'].map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
          <option value="">Tất cả tháng</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="text-sm text-[#A0A090] self-center">{filtered.length} kết quả</span>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E8E0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E8E0] bg-[#F8F7F2]">
                {['#', 'Sinh viên', 'Lớp', 'Chứng chỉ', 'Kỹ năng', 'Câu đúng', 'Điểm (%)', 'Điểm QĐ', 'Ngày thi'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-[#A0A090] px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((s, i) => {
                const user = s.NguoiDung as Record<string, string> | null
                const pct = s.tong_so_cau ? Math.round(((s.so_cau_dung as number) / (s.tong_so_cau as number)) * 100) : null
                return (
                  <tr key={s.id as string} className="border-b border-[#F8F7F2] hover:bg-[#F8F7F2] transition-colors">
                    <td className="px-4 py-3 text-xs text-[#A0A090]">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[#0D0D0D] whitespace-nowrap">{user?.ho_ten || '–'}</div>
                      <div className="text-xs text-[#A0A090] font-mono">{user?.ma_sinh_vien}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B6B60] whitespace-nowrap">{user?.lop || '–'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${certColor[s.loai_chung_chi as string] || 'bg-[#F8F7F2] text-[#6B6B60]'}`}>
                        {s.loai_chung_chi as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B6B60]">{(s.ky_nang as string) || '–'}</td>
                    <td className="px-4 py-3 text-sm text-[#6B6B60]">{s.so_cau_dung as number}/{s.tong_so_cau as number}</td>
                    <td className="px-4 py-3">
                      {pct !== null ? (
                        <span className={`text-sm font-bold ${pct >= 70 ? 'text-[#00A878]' : pct >= 50 ? 'text-[#F5A623]' : 'text-[#FF6B6B]'}`}>
                          {pct}%
                        </span>
                      ) : <span className="text-sm text-[#A0A090]">–</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B6B60]">{s.diem_quy_doi ? (s.diem_quy_doi as number).toFixed(1) : '–'}</td>
                    <td className="px-4 py-3 text-xs text-[#A0A090] whitespace-nowrap">{fmtDate(s.created_at as string)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#A0A090] text-sm">Không có kết quả</div>
        )}
        {filtered.length > 100 && (
          <div className="px-4 py-3 text-xs text-[#A0A090] border-t border-[#E8E8E0]">Hiển thị 100/{filtered.length} — Xuất CSV để xem đầy đủ</div>
        )}
      </div>
    </div>
  )
}
