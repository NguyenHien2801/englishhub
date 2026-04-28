'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const ROLES: Record<string, string> = { sinh_vien: 'Sinh viên', giang_vien: 'Giảng viên', admin: 'Admin' }
const GOALS = ['VSTEP', 'TOEIC', 'APTIS', 'GENERAL']

export default function StudentsClient({ students }: { students: Record<string, unknown>[] }) {
  const [list, setList] = useState(students)
  const [search, setSearch] = useState('')
  const [filterGoal, setFilterGoal] = useState('')
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null)
  const supabase = createClient()

  const filtered = list.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || (s.ho_ten as string).toLowerCase().includes(q) ||
      (s.ma_sinh_vien as string).toLowerCase().includes(q) ||
      ((s.lop as string) || '').toLowerCase().includes(q)
    const matchGoal = !filterGoal || s.muc_tieu_hoc === filterGoal
    return matchSearch && matchGoal
  })

  async function updateRole(id: string, role: string) {
    const { error } = await supabase.from('NguoiDung').update({ vai_tro: role }).eq('id', id)
    if (error) { toast.error('Lỗi cập nhật'); return }
    setList(prev => prev.map(s => s.id === id ? { ...s, vai_tro: role } : s))
    toast.success('Đã cập nhật vai trò')
  }

  const roleBadge = (r: string) => {
    const map: Record<string, string> = { admin: 'bg-[#FFF0F0] text-[#FF6B6B]', giang_vien: 'bg-[#FFF8EC] text-[#F5A623]', sinh_vien: 'bg-[#E8FFF8] text-[#00A878]' }
    return map[r] || 'bg-[#F8F7F2] text-[#6B6B60]'
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Quản lý sinh viên</h1>
          <p className="text-[#6B6B60] mt-1">{filtered.length} / {list.length} người dùng</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo họ tên, MSSV, lớp..."
          className="flex-1 px-4 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] transition-colors" />
        <select value={filterGoal} onChange={e => setFilterGoal(e.target.value)}
          className="px-4 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] transition-colors bg-white">
          <option value="">Tất cả mục tiêu</option>
          {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E8E0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F7F2]">
              <tr>
                {['Họ tên', 'MSSV', 'Lớp / Khoa', 'Mục tiêu', 'Trình độ', 'Streak', 'Vai trò', 'Thao tác'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-[#A0A090] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8F7F2]">
              {filtered.map((sv, i) => (
                <tr key={i} className="hover:bg-[#F8F7F2] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#E8FFF8] flex items-center justify-center text-xs font-bold text-[#00A878]">
                        {(sv.ho_ten as string).charAt(0)}
                      </div>
                      <span className="font-medium text-[#0D0D0D]">{sv.ho_ten as string}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-[#6B6B60]">{sv.ma_sinh_vien as string}</td>
                  <td className="py-3 px-4 text-[#6B6B60] text-xs">{sv.lop as string || '—'}<br/><span className="text-[#A0A090]">{sv.khoa as string || ''}</span></td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 bg-[#E8FFF8] text-[#00A878] rounded-full text-xs font-medium">{sv.muc_tieu_hoc as string}</span></td>
                  <td className="py-3 px-4 text-center"><span className="text-xs font-mono font-semibold text-[#0D0D0D]">{sv.trinh_do_hien_tai as string}</span></td>
                  <td className="py-3 px-4 text-[#F5A623] font-semibold text-xs">🔥 {sv.streak_hien_tai as number}</td>
                  <td className="py-3 px-4">
                    <select value={sv.vai_tro as string} onChange={e => updateRole(sv.id as string, e.target.value)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer focus:outline-none ${roleBadge(sv.vai_tro as string)}`}>
                      {Object.entries(ROLES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => setSelected(sv)}
                      className="text-xs px-3 py-1.5 bg-[#F8F7F2] border border-[#E8E8E0] rounded-lg hover:border-[#00A878]/50 transition-colors">
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#A0A090]">Không tìm thấy sinh viên nào</div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl border border-[#E8E8E0] p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#E8FFF8] flex items-center justify-center text-xl font-bold text-[#00A878]">
                {(selected.ho_ten as string).charAt(0)}
              </div>
              <div>
                <h3 className="font-display font-bold text-[#0D0D0D]">{selected.ho_ten as string}</h3>
                <div className="text-xs text-[#A0A090] font-mono">{selected.ma_sinh_vien as string}</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Lớp', selected.lop || '—'],
                ['Khoa', selected.khoa || '—'],
                ['Mục tiêu', selected.muc_tieu_hoc],
                ['Trình độ', selected.trinh_do_hien_tai],
                ['Streak hiện tại', `${selected.streak_hien_tai} ngày`],
                ['Streak cao nhất', `${selected.streak_cao_nhat} ngày`],
                ['Tổng từ đã học', `${selected.tong_so_tu_da_hoc} từ`],
                ['Ngày học cuối', selected.ngay_hoc_cuoi ? new Date(selected.ngay_hoc_cuoi as string).toLocaleDateString('vi-VN') : '—'],
                ['Đăng ký lúc', new Date(selected.created_at as string).toLocaleDateString('vi-VN')],
              ].map(([k, v], i) => (
                <div key={i} className="flex justify-between py-2 border-b border-[#F8F7F2]">
                  <span className="text-[#6B6B60]">{k}</span>
                  <span className="font-medium text-[#0D0D0D]">{v as string}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelected(null)}
              className="mt-4 w-full py-2.5 bg-[#0D0D0D] text-white rounded-xl font-medium hover:bg-[#2C2C28] transition-colors">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
