'use client'
import { useState } from 'react'

type Session = Record<string, unknown>

const CERTS = ['VSTEP', 'TOEIC', 'APTIS']
const SKILLS = ['NGHE', 'DOC', 'VIET', 'NOI', 'TU_VUNG', 'NGU_PHAP']

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtTime(s: number) {
  const m = Math.floor(s / 60); const ss = s % 60
  return `${m}:${String(ss).padStart(2, '0')}`
}

export default function ExamsAdminClient({ sessions }: { sessions: Session[] }) {
  const [filter, setFilter] = useState({ cert: '', skill: '', full: '' })
  const [selected, setSelected] = useState<Session | null>(null)

  const filtered = sessions.filter(s =>
    (!filter.cert || s.loai_chung_chi === filter.cert) &&
    (!filter.skill || s.ky_nang === filter.skill) &&
    (!filter.full || String(s.la_de_day_du) === filter.full)
  )

  const avgScore = filtered.length
    ? (filtered.reduce((a, s) => a + (s.diem_so as number || 0), 0) / filtered.length).toFixed(1)
    : '–'

  const certColor: Record<string, string> = {
    VSTEP: 'bg-[#E8FFF8] text-[#00A878]', TOEIC: 'bg-[#FFF8EC] text-[#F5A623]', APTIS: 'bg-[#F0F0FF] text-[#7C7CFF]',
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Đề thi & Bài kiểm tra</h1>
        <p className="text-[#6B6B60] mt-1">Toàn bộ phiên luyện thi của sinh viên</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng phiên thi', value: sessions.length, icon: '📋' },
          { label: 'Đề đầy đủ', value: sessions.filter(s => s.la_de_day_du).length, icon: '📄' },
          { label: 'Điểm TB', value: avgScore, icon: '⭐' },
          { label: 'Đang lọc', value: filtered.length, icon: '🔍' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E8E8E0] p-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-[#0D0D0D]">{s.value}</div>
            <div className="text-xs text-[#A0A090] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={filter.cert} onChange={e => setFilter(p => ({ ...p, cert: e.target.value }))}
          className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
          <option value="">Tất cả chứng chỉ</option>
          {CERTS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filter.skill} onChange={e => setFilter(p => ({ ...p, skill: e.target.value }))}
          className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
          <option value="">Tất cả kỹ năng</option>
          {SKILLS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filter.full} onChange={e => setFilter(p => ({ ...p, full: e.target.value }))}
          className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
          <option value="">Tất cả loại</option>
          <option value="true">Đề đầy đủ</option>
          <option value="false">Luyện nhanh</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Table */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E8E8E0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E8E0]">
                  {['Sinh viên', 'Chứng chỉ', 'Kỹ năng', 'Điểm', 'Thời gian', 'Ngày'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#A0A090] px-4 py-3 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map(s => {
                  const user = s.NguoiDung as Record<string, string> | null
                  const pct = s.tong_so_cau ? Math.round(((s.so_cau_dung as number) / (s.tong_so_cau as number)) * 100) : null
                  return (
                    <tr key={s.id as string}
                      onClick={() => setSelected(s)}
                      className={`border-b border-[#F8F7F2] cursor-pointer hover:bg-[#F8F7F2] transition-colors ${selected?.id === s.id ? 'bg-[#F0FFF8]' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-[#0D0D0D]">{user?.ho_ten || '–'}</div>
                        <div className="text-xs text-[#A0A090] font-mono">{user?.ma_sinh_vien || '–'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${certColor[s.loai_chung_chi as string] || 'bg-[#F8F7F2] text-[#6B6B60]'}`}>
                          {s.loai_chung_chi as string}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6B6B60]">{(s.ky_nang as string) || '–'}</td>
                      <td className="px-4 py-3">
                        {pct !== null ? (
                          <span className={`text-sm font-semibold ${pct >= 70 ? 'text-[#00A878]' : pct >= 50 ? 'text-[#F5A623]' : 'text-[#FF6B6B]'}`}>
                            {pct}%
                          </span>
                        ) : <span className="text-sm text-[#A0A090]">–</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6B6B60]">
                        {s.thoi_gian_lam_bai ? fmtTime(s.thoi_gian_lam_bai as number) : '–'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#A0A090]">{fmtDate(s.created_at as string)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#A0A090] text-sm">Không có kết quả</div>
          )}
          {filtered.length > 50 && (
            <div className="px-4 py-3 text-xs text-[#A0A090] border-t border-[#E8E8E0]">Hiển thị 50/{filtered.length} kết quả</div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5 sticky top-4">
              <h3 className="font-semibold text-[#0D0D0D] mb-4">Chi tiết phiên thi</h3>
              {(() => {
                const user = selected.NguoiDung as Record<string, string> | null
                const pct = selected.tong_so_cau ? Math.round(((selected.so_cau_dung as number) / (selected.tong_so_cau as number)) * 100) : null
                return (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#F8F7F2] rounded-xl">
                      <div className="text-xs text-[#A0A090] mb-0.5">Sinh viên</div>
                      <div className="font-semibold">{user?.ho_ten || '–'}</div>
                      <div className="text-sm text-[#6B6B60] font-mono">{user?.ma_sinh_vien}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Chứng chỉ', value: selected.loai_chung_chi as string },
                        { label: 'Kỹ năng', value: (selected.ky_nang as string) || 'Tổng hợp' },
                        { label: 'Câu đúng', value: `${selected.so_cau_dung}/${selected.tong_so_cau}` },
                        { label: 'Tỉ lệ', value: pct !== null ? `${pct}%` : '–' },
                        { label: 'Điểm quy đổi', value: selected.diem_quy_doi ? String(selected.diem_quy_doi) : '–' },
                        { label: 'Thời gian', value: selected.thoi_gian_lam_bai ? fmtTime(selected.thoi_gian_lam_bai as number) : '–' },
                      ].map(s => (
                        <div key={s.label} className="p-2.5 bg-[#F8F7F2] rounded-xl text-center">
                          <div className="font-bold text-[#0D0D0D]">{s.value}</div>
                          <div className="text-xs text-[#A0A090]">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-[#A0A090] text-center pt-1">
                      {fmtDate(selected.created_at as string)} · {selected.la_de_day_du ? 'Đề đầy đủ' : 'Luyện nhanh'}
                    </div>
                    {selected.phan_tich_ai ? (
                      <div>
                        <div className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-1.5">Phân tích AI</div>
                        <div className="p-3 bg-[#F0F0FF] rounded-xl text-xs text-[#6B6B60] leading-relaxed">
                          {selected.phan_tich_ai as string}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })()}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-12 text-center text-[#A0A090]">
              <div className="text-5xl mb-3">📋</div>
              <div className="font-medium">Chọn phiên thi để xem chi tiết</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
