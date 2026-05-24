'use client'
import { useState, useMemo } from 'react'

type Result = Record<string, unknown>

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LEVEL_COLOR: Record<string, string> = {
  A1: 'bg-[#F0F0FF] text-[#7C7CFF]', A2: 'bg-[#E8F8FF] text-[#00AACC]',
  B1: 'bg-[#E8FFF8] text-[#00A878]', B2: 'bg-[#FFF8EC] text-[#F5A623]',
  C1: 'bg-[#FFF0F0] text-[#FF6B6B]', C2: 'bg-[#F8E8FF] text-[#AA00FF]',
}

const SKILLS = ['listening', 'reading', 'grammar', 'writing', 'speaking']
const SKILL_LABELS: Record<string, string> = {
  listening: 'Nghe', reading: 'Đọc', grammar: 'Ngữ pháp', writing: 'Viết', speaking: 'Nói',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function LevelTestAdminClient({ results }: { results: Result[] }) {
  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [selected, setSelected] = useState<Result | null>(null)

  const filtered = useMemo(() => results.filter(r => {
    const u = r.NguoiDung as Record<string, string> | null
    const q = search.toLowerCase()
    return (
      (!q || u?.ho_ten?.toLowerCase().includes(q) || u?.ma_sinh_vien?.toLowerCase().includes(q)) &&
      (!filterLevel || r.trinh_do_tong_the === filterLevel)
    )
  }), [results, search, filterLevel])

  // Distribution
  const dist = useMemo(() =>
    LEVELS.map(l => ({ level: l, count: results.filter(r => r.trinh_do_tong_the === l).length })),
    [results])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Kiểm tra đầu vào (Level Test)</h1>
        <p className="text-[#6B6B60] mt-1">{results.length} kết quả kiểm tra đầu vào</p>
      </div>

      {/* Level distribution */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {dist.map(d => (
          <button key={d.level}
            onClick={() => setFilterLevel(prev => prev === d.level ? '' : d.level)}
            className={`p-3 rounded-2xl border-2 text-center transition-all ${filterLevel === d.level ? 'border-[#0D0D0D] bg-[#0D0D0D] text-white' : 'border-[#E8E8E0] bg-white hover:border-[#0D0D0D]'}`}>
            <div className="text-xl font-bold">{d.count}</div>
            <div className="text-xs mt-0.5 font-medium">{d.level}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tên, mã SV..."
          className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] w-60" />
        <span className="text-sm text-[#A0A090] self-center">{filtered.length} kết quả</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
          {filtered.map(r => {
            const u = r.NguoiDung as Record<string, string> | null
            return (
              <div key={r.id as string}
                onClick={() => setSelected(r)}
                className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${selected?.id === r.id ? 'border-[#00A878]' : 'border-[#E8E8E0]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-sm text-[#0D0D0D]">{u?.ho_ten || '–'}</div>
                    <div className="text-xs text-[#A0A090] font-mono">{u?.ma_sinh_vien}</div>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-xl ${LEVEL_COLOR[r.trinh_do_tong_the as string] || 'bg-[#F8F7F2] text-[#6B6B60]'}`}>
                    {r.trinh_do_tong_the as string}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.filter(s => (r as Record<string, unknown>)[`trinh_do_${s}`]).map(s => (
                    <span key={s} className={`text-xs px-1.5 py-0.5 rounded-md ${LEVEL_COLOR[(r as Record<string, unknown>)[`trinh_do_${s}`] as string] || 'bg-[#F8F7F2] text-[#6B6B60]'}`}>
                      {SKILL_LABELS[s]}: {(r as Record<string, unknown>)[`trinh_do_${s}`] as string}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-[#A0A090] mt-1.5">{fmtDate(r.created_at as string)}</div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#A0A090] text-sm">Không có kết quả</div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (() => {
            const u = selected.NguoiDung as Record<string, string> | null
            const skills_scores = selected.diem_ky_nang_json as Record<string, number> | null
            const lo_trinh = selected.lo_trinh_de_xuat_json as Record<string, unknown> | null
            return (
              <div className="bg-white rounded-2xl border border-[#E8E8E0] p-6 sticky top-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-semibold text-[#0D0D0D] text-lg">{u?.ho_ten}</h3>
                    <div className="text-sm text-[#6B6B60]">{u?.ma_sinh_vien} · {u?.lop || '–'}</div>
                    <div className="text-xs text-[#A0A090] mt-0.5">{fmtDate(selected.created_at as string)}</div>
                  </div>
                  <div className={`text-2xl font-bold px-4 py-2 rounded-xl ${LEVEL_COLOR[selected.trinh_do_tong_the as string]}`}>
                    {selected.trinh_do_tong_the as string}
                  </div>
                </div>

                {/* Skills breakdown */}
                <div className="mb-5">
                  <h4 className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-3">Trình độ từng kỹ năng</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {SKILLS.map(s => {
                      const lvl = (selected as Record<string, unknown>)[`trinh_do_${s}`] as string
                      const score = skills_scores?.[s]
                      if (!lvl) return null
                      return (
                        <div key={s} className={`p-3 rounded-xl text-center ${LEVEL_COLOR[lvl] || 'bg-[#F8F7F2] text-[#6B6B60]'}`}>
                          <div className="text-lg font-bold">{lvl}</div>
                          <div className="text-xs font-medium">{SKILL_LABELS[s]}</div>
                          {score !== undefined ? <div className="text-xs opacity-70 mt-0.5">{score} đ</div> : null}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Score */}
                {selected.diem_so ? (
                  <div className="mb-5 p-3 bg-[#F8F7F2] rounded-xl flex items-center justify-between">
                    <span className="text-sm font-medium text-[#6B6B60]">Điểm tổng hợp</span>
                    <span className="text-xl font-bold text-[#0D0D0D]">{selected.diem_so as number}</span>
                  </div>
                ) : null}

                {/* Lộ trình đề xuất */}
                {lo_trinh ? (
                  <div>
                    <h4 className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-2">Lộ trình đề xuất</h4>
                    <div className="p-3 bg-[#E8FFF8] rounded-xl text-sm text-[#00A878]">
                      <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                        {JSON.stringify(lo_trinh, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : null}

                {/* Chủ đề */}
                {selected.chu_de ? (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-1.5">Chủ đề</h4>
                    <span className="text-sm px-3 py-1 bg-[#F8F7F2] rounded-full text-[#6B6B60]">{selected.chu_de as string}</span>
                  </div>
                ) : null}
              </div>
            )
          })() : (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-12 text-center text-[#A0A090]">
              <div className="text-5xl mb-3">🎯</div>
              <div className="font-medium">Chọn kết quả để xem chi tiết</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}