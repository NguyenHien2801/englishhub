'use client'
import { useState, useMemo } from 'react'

type Result = Record<string, unknown>

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const LEVEL_COLOR: Record<string, string> = {
  A1: 'bg-[#ede9fe] text-[#7c3aed]',
  A2: 'bg-[#e0f2fe] text-[#0369a1]',
  B1: 'bg-[#dcfce7] text-[#15803d]',
  B2: 'bg-[#fef9c3] text-[#a16207]',
  C1: 'bg-[#fee2e2] text-[#dc2626]',
  C2: 'bg-[#fae8ff] text-[#9333ea]',
}

const LEVEL_HEX: Record<string, { bg: string; color: string }> = {
  A1: { bg: '#ede9fe', color: '#7c3aed' },
  A2: { bg: '#e0f2fe', color: '#0369a1' },
  B1: { bg: '#dcfce7', color: '#15803d' },
  B2: { bg: '#fef9c3', color: '#a16207' },
  C1: { bg: '#fee2e2', color: '#dc2626' },
  C2: { bg: '#fae8ff', color: '#9333ea' },
}

const SKILLS = ['listening', 'reading', 'grammar', 'writing', 'speaking']
const SKILL_LBL: Record<string, string> = {
  listening: 'Nghe', reading: 'Đọc', grammar: 'Ngữ pháp', writing: 'Viết', speaking: 'Nói',
}

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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function SkillBadges({ result }: { result: Result }) {
  return (
    <div className="flex flex-wrap gap-1">
      {SKILLS.filter(s => (result as Record<string, unknown>)[`trinh_do_${s}`]).map(s => {
        const lvl = (result as Record<string, unknown>)[`trinh_do_${s}`] as string
        return (
          <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${LEVEL_COLOR[lvl] || 'bg-gray-100 text-gray-500'}`}>
            {SKILL_LBL[s]}: {lvl}
          </span>
        )
      })}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LoTrinhPanel({ data }: { data: Record<string, unknown> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any
  const diemYeu: string[] | undefined = d?.diem_yeu
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const phases: any[] | undefined = d?.lo_trinh?.phases

  if (!Array.isArray(diemYeu) && !Array.isArray(phases)) {
    return (
      <pre className="text-sm leading-relaxed text-green-800 bg-green-50 border border-green-200 rounded-xl p-3 whitespace-pre-wrap break-words">
        {JSON.stringify(data, null, 2)}
      </pre>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {Array.isArray(diemYeu) && diemYeu.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Điểm yếu</div>
          <div className="flex flex-col gap-1.5">
            {diemYeu.map((item, i) => (
              <div key={i} className="text-sm leading-relaxed px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-orange-900">
                ⚠️ {item}
              </div>
            ))}
          </div>
        </div>
      )}
      {Array.isArray(phases) && phases.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Lộ trình học</div>
          <div className="flex flex-col gap-2.5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {phases.map((phase: any, i: number) => (
              <div key={i} className="p-3.5 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-bold text-green-900 text-sm leading-snug">{i + 1}. {phase.tieu_de}</span>
                  {phase.ky_nang_chinh && (
                    <span className="flex-shrink-0 text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">{phase.ky_nang_chinh}</span>
                  )}
                </div>
                {phase.muc_tieu && (
                  <div className="text-sm text-green-800 italic mb-2 leading-snug">🎯 {phase.muc_tieu}</div>
                )}
                {Array.isArray(phase.hoat_dong) && phase.hoat_dong.length > 0 && (
                  <ul className="list-disc pl-4 space-y-1">
                    {(phase.hoat_dong as string[]).map((h, j) => (
                      <li key={j} className="text-sm text-gray-700 leading-relaxed">{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailPanel({
  selected,
  onClose,
}: {
  selected: Result
  onClose: () => void
}) {
  const u = selected.NguoiDung as Record<string, string> | null
  const lo_trinh = selected.lo_trinh_de_xuat_json as Record<string, unknown> | null
  const scores = selected.diem_ky_nang_json as Record<string, number> | null
  const diem = selected.diem_so as number | null
  const chu_de = selected.chu_de as string | null
  const trinh_do = selected.trinh_do_tong_the as string

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ border: '2px solid #b0bfd4' }}>
      {/* Header */}
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-lg truncate">{u?.ho_ten || '–'}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${LEVEL_COLOR[trinh_do] || 'bg-gray-100 text-gray-500'}`}>
              {trinh_do}
            </span>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-5" style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>

        {diem != null && diem > 0 && (
          <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <span className="text-sm font-semibold text-gray-600">Điểm tổng hợp</span>
            <span className="text-2xl font-bold text-[#1e3a5f]">{diem}</span>
          </div>
        )}

        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Trình độ từng kỹ năng</div>
          <div className="grid grid-cols-3 gap-2">
            {SKILLS.map(s => {
              const lvl = (selected as Record<string, unknown>)[`trinh_do_${s}`] as string
              if (!lvl) return null
              const score = scores?.[s]
              return (
                <div key={s} className="rounded-xl p-2.5 text-center" style={{ background: LEVEL_HEX[lvl]?.bg || '#f1f5f9', border: '1px solid #e2e8f0' }}>
                  <div className="font-bold text-base" style={{ color: LEVEL_HEX[lvl]?.color || '#374151' }}>{lvl}</div>
                  <div className="text-xs font-semibold text-gray-600 mt-0.5">{SKILL_LBL[s]}</div>
                  {score !== undefined && <div className="text-xs text-gray-500 mt-0.5">{score} đ</div>}
                </div>
              )
            })}
          </div>
        </div>

        {chu_de && (
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Chủ đề</div>
            <span className="inline-block text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
              {chu_de}
            </span>
          </div>
        )}

        {lo_trinh && (
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Lộ trình đề xuất</div>
            <LoTrinhPanel data={lo_trinh} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function LevelTestAdminClient({ results }: { results: Result[] }) {
  const [search, setSearch]           = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [selected, setSelected]       = useState<Result | null>(null)
  const [modalOpen, setModalOpen]     = useState(false)

  const totalA = results.filter(r => (r.trinh_do_tong_the as string)?.startsWith('A')).length
  const totalB = results.filter(r => (r.trinh_do_tong_the as string)?.startsWith('B')).length
  const totalC = results.filter(r => (r.trinh_do_tong_the as string)?.startsWith('C')).length

  const dist = useMemo(() =>
    LEVELS.map(l => ({ level: l, count: results.filter(r => r.trinh_do_tong_the === l).length })),
    [results])

  const filtered = useMemo(() => results.filter(r => {
    const u = r.NguoiDung as Record<string, string> | null
    const q = search.toLowerCase()
    return (
      (!q || u?.ho_ten?.toLowerCase().includes(q) || u?.ma_sinh_vien?.toLowerCase().includes(q)) &&
      (!filterLevel || r.trinh_do_tong_the === filterLevel)
    )
  }), [results, search, filterLevel])

  const cols = [
    { label: 'STT',       minWidth: 48  },
    { label: 'Sinh viên', minWidth: 200 },
    { label: 'Mã SV',     minWidth: 110 },
    { label: 'Lớp',       minWidth: 100 },
    { label: 'Trình độ',  minWidth: 90  },
    { label: 'Kỹ năng',   minWidth: 320 },
    { label: 'Điểm',      minWidth: 75  },
    { label: 'Ngày thi',  minWidth: 110 },
  ]

  function openDetail(r: Result) {
    setSelected(r)
    setModalOpen(true)
  }

  function closeDetail() {
    setSelected(null)
    setModalOpen(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily: 'DM Sans,sans-serif' }}>

      {/* Title */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">KIỂM TRA ĐẦU VÀO</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Tổng kết quả', value: results.length, color: '#1e3a5f',
            icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"/></svg> },
          { label: 'Trình độ A',   value: totalA,          color: '#2563eb',
            icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg> },
          { label: 'Trình độ B',   value: totalB,          color: '#059669',
            icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
          { label: 'Trình độ C',   value: totalC,          color: '#7c3aed',
            icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ border: `2px solid ${color}30`, background: `linear-gradient(135deg,#fff 60%,${color}0d 100%)` }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}15`, color, border: `1.5px solid ${color}25` }}>{icon}</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{value.toLocaleString('vi-VN')}</div>
              <div className="text-sm text-gray-800 mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Level distribution */}
      <div className="rounded-2xl p-4 mb-5" style={{ border: '2px solid #b0bfd4', background: '#f8fafc' }}>
        <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Phân bổ trình độ</div>
        <div className="flex gap-3 flex-wrap w-full">
          {dist.map(d => {
            const c = LEVEL_HEX[d.level]
            const active = filterLevel === d.level
            return (
              <button key={d.level}
                onClick={() => setFilterLevel(p => p === d.level ? '' : d.level)}
                className="rounded-xl px-5 py-3 font-bold text-center transition-all cursor-pointer flex-1 min-w-[80px]"
                style={{
                  background: active ? 'linear-gradient(135deg,#0f2847,#1e3a5f)' : (c?.bg || '#f1f5f9'),
                  color: active ? '#fff' : (c?.color || '#374151'),
                  border: active ? '2px solid #1e3a5f' : `2px solid ${c?.bg || '#e5e7eb'}`,
                  fontFamily: 'DM Sans,sans-serif',
                }}>
                <div className="text-2xl leading-none">{d.count}</div>
                <div className="text-sm mt-1">{d.level}</div>
              </button>
            )
          })}
          {filterLevel && (
            <button onClick={() => setFilterLevel('')}
              className="rounded-xl px-4 py-3 font-semibold text-sm cursor-pointer transition-all"
              style={{ background: '#fff5f5', color: '#ef4444', border: '2px solid #fecaca', fontFamily: 'DM Sans,sans-serif' }}>
              ✕ Bỏ lọc
            </button>
          )}
        </div>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, mã SV..."
            className="w-full pl-9 pr-9 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 bg-white">
          <option value="">Tất cả trình độ</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        {(search || filterLevel) && (
          <button onClick={() => { setSearch(''); setFilterLevel('') }}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm hover:border-red-300 hover:text-red-500 transition-colors bg-white">
            Xoá lọc
          </button>
        )}
      </div>

      {/* Full-width table */}
      <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>
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
                    <div className="text-4xl mb-2">🎯</div>
                    Không tìm thấy kết quả nào
                  </td>
                </tr>
              ) : filtered.map((r, i) => {
                const u = r.NguoiDung as Record<string, string> | null
                const even = i % 2 === 0
                return (
                  <tr key={r.id as string}
                    onClick={() => openDetail(r)}
                    style={{
                      background: even ? '#f1f5f9' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    className="hover:!bg-blue-50">
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center' }}>
                      <span className="text-sm font-mono font-semibold text-gray-700">{i + 1}</span>
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div className="font-semibold text-gray-800 text-[15px]">{u?.ho_ten || '–'}</div>
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span className="text-xs font-mono text-gray-600">{u?.ma_sinh_vien || '–'}</span>
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span className="text-sm text-gray-700">{u?.lop || '–'}</span>
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${LEVEL_COLOR[r.trinh_do_tong_the as string] || 'bg-gray-100 text-gray-500'}`}>
                        {r.trinh_do_tong_the as string}
                      </span>
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px' }}>
                      <SkillBadges result={r} />
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {(r.diem_so as number) > 0
                        ? <span className="font-bold text-[#1e3a5f]">{r.diem_so as number}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span className="text-sm text-gray-600">{fmtDate(r.created_at as string)}</span>
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
            {filtered.length !== results.length && (
              <span className="text-gray-600">Lọc từ {results.length} kết quả</span>
            )}
          </div>
        )}
      </div>

      {/* Modal overlay */}
      {modalOpen && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,40,71,0.45)', backdropFilter: 'blur(3px)' }}
          onClick={closeDetail}
        >
          <div
            className="w-full max-w-2xl"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <DetailPanel selected={selected} onClose={closeDetail} />
          </div>
        </div>
      )}
    </div>
  )
}