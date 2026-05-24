'use client'
import { useState, useMemo } from 'react'

type Student = Record<string, unknown>
type VocabProgress = { nguoi_dung_id: string; trang_thai: string }
type GrammarProgress = { nguoi_dung_id: string; da_hoan_thanh: boolean; diem_bai_tap: number }
type Session = { nguoi_dung_id: string; loai_chung_chi: string; diem_so: number }

const LEVEL_COLOR: Record<string, string> = {
  A1: 'bg-[#F0F0FF] text-[#7C7CFF]', A2: 'bg-[#E8F8FF] text-[#00AACC]',
  B1: 'bg-[#E8FFF8] text-[#00A878]', B2: 'bg-[#FFF8EC] text-[#F5A623]',
  C1: 'bg-[#FFF0F0] text-[#FF6B6B]', C2: 'bg-[#F8E8FF] text-[#AA00FF]',
}

function daysSince(d: string | null) {
  if (!d) return null
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
}

export default function StudentsProgressClient({
  students, vocab, grammar, sessions
}: {
  students: Student[]
  vocab: VocabProgress[]
  grammar: GrammarProgress[]
  sessions: Session[]
}) {
  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [sortBy, setSortBy] = useState<'tu_vung' | 'streak' | 'phien_thi'>('tu_vung')
  const [selected, setSelected] = useState<Student | null>(null)

  // Build per-student stats
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
      _vocab: vocabByUser.get(s.id as string) || { total: 0, mastered: 0 },
      _grammar: grammarByUser.get(s.id as string) || { done: 0, avg: 0 },
      _sessions: sessionsByUser.get(s.id as string) || 0,
    }))
  }, [students, vocab, grammar, sessions])

  const filtered = useMemo(() => {
    let list = studentStats.filter(s => {
      const q = search.toLowerCase()
     const u = s as Record<string, unknown>
      return (!q || (u.ho_ten as string).toLowerCase().includes(q) || (u.ma_sinh_vien as string).toLowerCase().includes(q)) &&
        (!filterLevel || u.trinh_do_hien_tai === filterLevel)
    })
    if (sortBy === 'tu_vung') list = list.sort((a, b) => (b._vocab.total) - (a._vocab.total))
    else if (sortBy === 'streak') list = list.sort((a, b) => ((a as Record<string, unknown>).streak_hien_tai as number) - ((b as Record<string, unknown>).streak_hien_tai as number) ? -1 : 1)
    else list = list.sort((a, b) => b._sessions - a._sessions)
    return list
  }, [studentStats, search, filterLevel, sortBy])

const selectedStats = selected ? studentStats.find(s => (s as Record<string, unknown>).id === selected.id) : null

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Tiến độ học tập</h1>
        <p className="text-[#6B6B60] mt-1">{students.length} sinh viên đang học</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng sinh viên', value: students.length, icon: '👥' },
          { label: 'Tổng từ đã học', value: vocab.length, icon: '📚' },
          { label: 'Bài ngữ pháp xong', value: grammar.filter(g => g.da_hoan_thanh).length, icon: '📖' },
          { label: 'Phiên luyện thi', value: sessions.length, icon: '📋' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E8E8E0] p-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-[#0D0D0D]">{s.value.toLocaleString('vi-VN')}</div>
            <div className="text-xs text-[#A0A090] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm sinh viên..."
          className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] w-52" />
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
          className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
          <option value="">Tất cả trình độ</option>
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l}>{l}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
          <option value="tu_vung">Sắp xếp: Từ vựng</option>
          <option value="streak">Sắp xếp: Streak</option>
          <option value="phien_thi">Sắp xếp: Phiên thi</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Table */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E8E8E0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E8E0] bg-[#F8F7F2]">
                  {['Sinh viên', 'Trình độ', 'Từ vựng', 'Ngữ pháp', 'Streak', 'Phiên thi', 'Hoạt động'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#A0A090] px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                    const u = s as Record<string, unknown>
                    const days = daysSince(u.ngay_hoc_cuoi as string | null)
                    return (
                    <tr key={u.id as string}
                      onClick={() => setSelected(s)}
                      className={`border-b border-[#F8F7F2] cursor-pointer hover:bg-[#F8F7F2] transition-colors ${selected?.id === u.id ? 'bg-[#F0FFF8]' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-[#0D0D0D] whitespace-nowrap">{u.ho_ten as string}</div>
                        <div className="text-xs text-[#A0A090] font-mono">{u.ma_sinh_vien as string}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLOR[u.trinh_do_hien_tai as string] || 'bg-[#F8F7F2] text-[#6B6B60]'}`}>
                          {u.trinh_do_hien_tai as string}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#0D0D0D]">{s._vocab.total}</td>
                      <td className="px-4 py-3 text-sm text-[#0D0D0D]">{s._grammar.done}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${(u.streak_hien_tai as number) > 7 ? 'text-[#F5A623]' : 'text-[#6B6B60]'}`}>
                          🔥 {u.streak_hien_tai as number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6B6B60]">{s._sessions}</td>
                      <td className="px-4 py-3 text-xs text-[#A0A090]">
                        {days === null ? 'Chưa học' : days === 0 ? <span className="text-[#00A878] font-medium">Hôm nay</span> : `${days} ngày trước`}
                      </td>
                    </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#A0A090] text-sm">Không có kết quả</div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selectedStats ? (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5 sticky top-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F8F7F2] flex items-center justify-center font-bold text-[#0D0D0D]">
                  {((selectedStats as Record<string, unknown>).ho_ten as string).charAt(0)}
                </div>
                <div>
                 <div className="font-semibold text-[#0D0D0D]">{(selectedStats as Record<string, unknown>).ho_ten as string}</div>
                  <div className="text-xs text-[#A0A090] font-mono">{(selectedStats as Record<string, unknown>).ma_sinh_vien as string}</div>
                </div>
                <span className={`ml-auto text-sm font-bold px-2.5 py-1 rounded-lg ${LEVEL_COLOR[(selectedStats as Record<string, unknown>).trinh_do_hien_tai as string]}`}>
                 {(selectedStats as Record<string, unknown>).trinh_do_hien_tai as string}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Lớp', value: ((selectedStats as Record<string, unknown>).lop as string) || '–' },
                  { label: 'Khoa', value: ((selectedStats as Record<string, unknown>).khoa as string) || '–' },
                  { label: 'Mục tiêu', value: (selectedStats as Record<string, unknown>).muc_tieu_hoc as string },
                  { label: 'Streak cao nhất', value: `🔥 ${(selectedStats as Record<string, unknown>).streak_cao_nhat as number}` },
                ].map(s => (
                  <div key={s.label} className="p-2.5 bg-[#F8F7F2] rounded-xl">
                    <div className="text-xs text-[#A0A090]">{s.label}</div>
                    <div className="font-medium text-sm text-[#0D0D0D]">{s.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-2">Từ vựng</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Đang học', value: selectedStats._vocab.total },
                    { label: 'Thuần thục', value: selectedStats._vocab.mastered },
                    { label: 'Tổng SRS', value: ((selectedStats as Record<string, unknown>).tong_so_tu_da_hoc as number) || 0 },
                  ].map(s => (
                    <div key={s.label} className="p-2.5 bg-[#F8F7F2] rounded-xl text-center">
                      <div className="font-bold text-[#0D0D0D]">{s.value}</div>
                      <div className="text-xs text-[#A0A090]">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-2">Ngữ pháp & Luyện thi</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Bài ngữ pháp xong', value: selectedStats._grammar.done },
                    { label: 'Phiên luyện thi', value: selectedStats._sessions },
                  ].map(s => (
                    <div key={s.label} className="p-2.5 bg-[#F8F7F2] rounded-xl text-center">
                      <div className="font-bold text-[#0D0D0D]">{s.value}</div>
                      <div className="text-xs text-[#A0A090]">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-12 text-center text-[#A0A090]">
              <div className="text-5xl mb-3">📊</div>
              <div className="font-medium">Chọn sinh viên để xem chi tiết</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
