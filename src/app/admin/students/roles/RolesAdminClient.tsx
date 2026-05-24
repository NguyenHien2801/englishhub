'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type User = Record<string, unknown>
type MaXT = Record<string, unknown>

const ROLES = ['sinh_vien', 'giang_vien', 'admin']
const ROLE_LABELS: Record<string, string> = { sinh_vien: 'Sinh viên', giang_vien: 'Giảng viên', admin: 'Admin' }
const ROLE_COLOR: Record<string, string> = {
  sinh_vien: 'bg-[#F8F7F2] text-[#6B6B60]',
  giang_vien: 'bg-[#FFF8EC] text-[#F5A623]',
  admin: 'bg-[#FFF0F0] text-[#FF6B6B]',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function RolesAdminClient({ users, maXacThuc: initMA }: { users: User[]; maXacThuc: MaXT[] }) {
  const [allUsers, setAllUsers] = useState(users)
  const [maXacThuc, setMaXacThuc] = useState(initMA)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'codes'>('users')
  const [newCodeDesc, setNewCodeDesc] = useState('')
  const [newCodeLimit, setNewCodeLimit] = useState('')
  const supabase = createClient()

  const filtered = allUsers.filter(u => {
    const q = search.toLowerCase()
    return (!q || (u.ho_ten as string).toLowerCase().includes(q) || (u.ma_sinh_vien as string).toLowerCase().includes(q)) &&
      (!filterRole || u.vai_tro === filterRole)
  })

  async function changeRole(id: string, newRole: string) {
    if (!confirm(`Đổi vai trò thành "${ROLE_LABELS[newRole]}"?`)) return
    const { error } = await supabase.from('NguoiDung').update({ vai_tro: newRole }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, vai_tro: newRole } : u))
    toast.success(`Đã đổi vai trò thành ${ROLE_LABELS[newRole]}`)
  }

  async function addCode() {
    if (!newCodeDesc.trim()) { toast.error('Nhập mô tả mã'); return }
    const rawCode = Math.random().toString(36).slice(2, 10).toUpperCase()
    const encoder = new TextEncoder()
    const data = encoder.encode(rawCode)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const payload: Record<string, unknown> = { ma_hash: hashHex, mo_ta: newCodeDesc }
    if (newCodeLimit) payload.gioi_han_dung = +newCodeLimit

    const { data: created, error } = await supabase.from('MaXacThucTruong').insert(payload).select().single()
    if (error) { toast.error(error.message); return }
    setMaXacThuc(prev => [created, ...prev])
    setNewCodeDesc('')
    setNewCodeLimit('')
    toast.success(`✅ Mã tạo thành công: ${rawCode}\n(Lưu lại mã này — không hiển thị lại)`, { duration: 8000 })
  }

  async function toggleCode(id: string, cur: boolean) {
    const { error } = await supabase.from('MaXacThucTruong').update({ con_hieu_luc: !cur }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setMaXacThuc(prev => prev.map(m => m.id === id ? { ...m, con_hieu_luc: !cur } : m))
    toast.success(!cur ? 'Đã kích hoạt' : 'Đã vô hiệu hóa')
  }

  async function deleteCode(id: string) {
    if (!confirm('Xóa mã xác thực này?')) return
    const { error } = await supabase.from('MaXacThucTruong').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setMaXacThuc(prev => prev.filter(m => m.id !== id))
    toast.success('Đã xóa')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Phân quyền tài khoản</h1>
        <p className="text-[#6B6B60] mt-1">Quản lý vai trò người dùng và mã xác thực trường</p>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {ROLES.map(r => (
          <button key={r} onClick={() => setFilterRole(prev => prev === r ? '' : r)}
            className={`p-4 rounded-2xl border-2 text-center transition-all ${filterRole === r ? 'border-[#0D0D0D] bg-[#0D0D0D] text-white' : 'border-[#E8E8E0] bg-white hover:border-[#0D0D0D]'}`}>
            <div className="text-2xl font-bold">{allUsers.filter(u => u.vai_tro === r).length}</div>
            <div className="text-sm font-medium mt-0.5">{ROLE_LABELS[r]}</div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#F8F7F2] rounded-xl mb-5 w-fit">
        {[{ key: 'users', label: 'Người dùng' }, { key: 'codes', label: 'Mã xác thực trường' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-white text-[#0D0D0D] shadow-sm' : 'text-[#6B6B60] hover:text-[#0D0D0D]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' ? (
        <>
          <div className="flex gap-3 mb-4">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, mã SV..."
              className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] w-60" />
            <span className="text-sm text-[#A0A090] self-center">{filtered.length} người dùng</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E8E0] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E8E0] bg-[#F8F7F2]">
                  {['Người dùng', 'Lớp/Khoa', 'Vai trò', 'Xác thực trường', 'Ngày tham gia', 'Thao tác'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#A0A090] px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id as string} className="border-b border-[#F8F7F2] hover:bg-[#F8F7F2] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-[#0D0D0D]">{u.ho_ten as string}</div>
                      <div className="text-xs text-[#A0A090] font-mono">{u.ma_sinh_vien as string}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B6B60]">
                      <div>{(u.lop as string) || '–'}</div>
                      <div className="text-xs text-[#A0A090]">{(u.khoa as string) || '–'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[u.vai_tro as string]}`}>
                        {ROLE_LABELS[u.vai_tro as string] || u.vai_tro as string}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.da_xac_thuc_truong ? (
                        <span className="text-xs text-[#00A878]">✓ {u.ngay_xac_thuc ? fmtDate(u.ngay_xac_thuc as string) : ''}</span>
                      ) : (
                        <span className="text-xs text-[#A0A090]">Chưa xác thực</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#A0A090]">{fmtDate(u.created_at as string)}</td>
                    <td className="px-4 py-3">
                      <select value={u.vai_tro as string} onChange={e => changeRole(u.id as string, e.target.value)}
                        className="px-2 py-1.5 border border-[#E8E8E0] rounded-lg text-xs bg-white focus:outline-none focus:border-[#00A878] cursor-pointer">
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-[#A0A090] text-sm">Không có kết quả</div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* Tạo mã mới */}
          <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
            <h3 className="font-semibold text-[#0D0D0D] mb-3">Tạo mã xác thực mới</h3>
            <div className="flex gap-3">
              <input type="text" value={newCodeDesc} onChange={e => setNewCodeDesc(e.target.value)}
                placeholder="Mô tả (VD: Đợt tuyển sinh 2024)"
                className="flex-1 px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878]" />
              <input type="number" value={newCodeLimit} onChange={e => setNewCodeLimit(e.target.value)}
                placeholder="Giới hạn dùng (để trống = không giới hạn)"
                className="w-52 px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878]" />
              <button onClick={addCode}
                className="px-5 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors whitespace-nowrap">
                + Tạo mã
              </button>
            </div>
            <p className="text-xs text-[#A0A090] mt-2">⚠️ Mã sẽ hiển thị 1 lần duy nhất sau khi tạo — hãy lưu lại ngay.</p>
          </div>

          {/* Danh sách mã */}
          <div className="bg-white rounded-2xl border border-[#E8E8E0] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E8E0] bg-[#F8F7F2]">
                  {['Mô tả', 'Lượt dùng', 'Giới hạn', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#A0A090] px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {maXacThuc.map(m => (
                  <tr key={m.id as string} className="border-b border-[#F8F7F2] hover:bg-[#F8F7F2] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[#0D0D0D]">{(m.mo_ta as string) || '–'}</td>
                    <td className="px-4 py-3 text-sm text-[#6B6B60]">{m.so_luot_dung as number}</td>
                    <td className="px-4 py-3 text-sm text-[#6B6B60]">{(m.gioi_han_dung as number) || '∞'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.con_hieu_luc ? 'bg-[#E8FFF8] text-[#00A878]' : 'bg-[#FFF0F0] text-[#FF6B6B]'}`}>
                        {m.con_hieu_luc ? 'Hiệu lực' : 'Vô hiệu'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#A0A090]">{fmtDate(m.created_at as string)}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => toggleCode(m.id as string, m.con_hieu_luc as boolean)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${m.con_hieu_luc ? 'bg-[#FFF0F0] text-[#FF6B6B] hover:bg-[#FFE0E0]' : 'bg-[#E8FFF8] text-[#00A878] hover:bg-[#D0FFF0]'}`}>
                        {m.con_hieu_luc ? 'Vô hiệu' : 'Kích hoạt'}
                      </button>
                      <button onClick={() => deleteCode(m.id as string)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F8F7F2] text-[#FF6B6B] hover:bg-[#FFF0F0] transition-colors">
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {maXacThuc.length === 0 && (
              <div className="text-center py-12 text-[#A0A090] text-sm">Chưa có mã xác thực nào</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
