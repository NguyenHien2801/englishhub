'use client'
import { useState, useMemo } from 'react'
import { Search, Filter, ChevronRight } from 'lucide-react'

type Result = Record<string, unknown>

// ═══════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const LEVEL_COLOR: Record<string, string> = {
  A1: 'bg-[#ede9fe] text-[#7c3aed]',
  A2: 'bg-[#e0f2fe] text-[#0369a1]',
  B1: 'bg-[#dcfce7] text-[#15803d]',
  B2: 'bg-[#fef9c3] text-[#a16207]',
  C1: 'bg-[#fee2e2] text-[#dc2626]',
  C2: 'bg-[#fae8ff] text-[#9333ea]',
}

const LEVEL_COLOR_INLINE: Record<string, { bg: string; color: string }> = {
  A1: { bg: '#ede9fe', color: '#7c3aed' },
  A2: { bg: '#e0f2fe', color: '#0369a1' },
  B1: { bg: '#dcfce7', color: '#15803d' },
  B2: { bg: '#fef9c3', color: '#a16207' },
  C1: { bg: '#fee2e2', color: '#dc2626' },
  C2: { bg: '#fae8ff', color: '#9333ea' },
}

const SKILLS = ['listening', 'reading', 'grammar', 'writing', 'speaking']
const SKILL_LABELS: Record<string, string> = {
  listening: 'Nghe',
  reading:   'Đọc',
  grammar:   'Ngữ pháp',
  writing:   'Viết',
  speaking:  'Nói',
}

const ACCENT = '#1e3a5f'

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

const filterSelectCls =
  'border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#1e3a5f]/60 transition-colors bg-white text-gray-700 cursor-pointer'

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function LevelBadge({ level, large = false }: { level: string; large?: boolean }) {
  const c = LEVEL_COLOR_INLINE[level]
  if (!c) return <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: 8, padding: large ? '8px 18px' : '3px 10px', fontSize: large ? 20 : 12, fontWeight: 700 }}>{level}</span>
  return (
    <span style={{
      background: c.bg, color: c.color,
      borderRadius: 8,
      padding: large ? '8px 18px' : '3px 10px',
      fontSize: large ? 20 : 12,
      fontWeight: 700,
      display: 'inline-block',
    }}>
      {level}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════
//  STAT CARD
// ═══════════════════════════════════════════════════════════
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12,
      border: `2px solid ${color}30`,
      background: `linear-gradient(135deg, #fff 60%, ${color}0d 100%)`,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: `${color}15`, color, border: `1.5px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{value.toLocaleString('vi-VN')}</div>
        <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  SKILL BREAKDOWN (Detail panel)
// ═══════════════════════════════════════════════════════════
function SkillGrid({ result }: { result: Result }) {
  const scores = result.diem_ky_nang_json as Record<string, number> | null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {SKILLS.map(s => {
        const lvl = (result as Record<string, unknown>)[`trinh_do_${s}`] as string
        const score = scores?.[s]
        if (!lvl) return null
        const c = LEVEL_COLOR_INLINE[lvl]
        return (
          <div key={s} style={{
            padding: '10px 8px', borderRadius: 12, textAlign: 'center',
            background: c?.bg || '#f1f5f9', color: c?.color || '#64748b',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{lvl}</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{SKILL_LABELS[s]}</div>
            {score !== undefined && (
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{score} đ</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function LevelTestAdminClient({ results }: { results: Result[] }) {
  const [search, setSearch]           = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [selected, setSelected]       = useState<Result | null>(null)

  // Distribution counts
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

  const tableCols = [
    { label: 'STT',        minWidth: 52  },
    { label: 'Họ tên',     minWidth: 160 },
    { label: 'Mã SV',      minWidth: 110 },
    { label: 'Lớp',        minWidth: 90  },
    { label: 'Trình độ',   minWidth: 90  },
    { label: 'Kỹ năng',    minWidth: 280 },
    { label: 'Điểm tổng',  minWidth: 90  },
    { label: 'Ngày thi',   minWidth: 100 },
    { label: '',           minWidth: 48  },
  ]

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 8px', fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>KIỂM TRA ĐẦU VÀO (LEVEL TEST)</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{results.length} kết quả kiểm tra đầu vào</p>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard label="Tổng kết quả" value={results.length} color={ACCENT} icon={
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z" />
          </svg>
        } />
        <StatCard label="Trình độ A (A1–A2)" value={dist.filter(d => d.level.startsWith('A')).reduce((s, d) => s + d.count, 0)} color="#2563eb" icon={
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        } />
        <StatCard label="Trình độ B (B1–B2)" value={dist.filter(d => d.level.startsWith('B')).reduce((s, d) => s + d.count, 0)} color="#059669" icon={
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="Trình độ C (C1–C2)" value={dist.filter(d => d.level.startsWith('C')).reduce((s, d) => s + d.count, 0)} color="#7c3aed" icon={
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        } />
      </div>

      {/* ── LEVEL DISTRIBUTION BAR ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '2px solid #b0bfd4', padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2}>
            <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>Phân bổ trình độ</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {dist.map(d => {
            const c = LEVEL_COLOR_INLINE[d.level]
            const isActive = filterLevel === d.level
            return (
              <button key={d.level}
                onClick={() => setFilterLevel(prev => prev === d.level ? '' : d.level)}
                style={{
                  padding: '10px 18px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                  border: isActive ? `2px solid ${ACCENT}` : `2px solid ${c?.bg || '#e5e7eb'}`,
                  background: isActive ? `linear-gradient(135deg,#0f2847,#1e3a5f)` : (c?.bg || '#f1f5f9'),
                  color: isActive ? '#fff' : (c?.color || '#374151'),
                  minWidth: 80, textAlign: 'center',
                }}>
                <div style={{ fontSize: 22, lineHeight: 1 }}>{d.count}</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>{d.level}</div>
              </button>
            )
          })}
          {filterLevel && (
            <button onClick={() => setFilterLevel('')} style={{
              padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
              background: '#fff5f5', color: '#ef4444', border: '2px solid #fecaca',
              fontWeight: 600, fontSize: 12, fontFamily: 'DM Sans, sans-serif',
            }}>
              ✕ Bỏ lọc
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20, alignItems: 'start' }}>

        {/* ── TABLE PANEL ── */}
        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '2px solid #b0bfd4' }}>

          {/* Panel header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)',
          }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Danh sách kết quả</div>
              <div style={{ color: '#93c5fd', fontSize: 12, marginTop: 2 }}>{filtered.length} kết quả{filterLevel && ` · Lọc: ${filterLevel}`}</div>
            </div>
          </div>

          {/* Filter bar */}
          <div style={{ padding: '10px 16px', background: '#f1f5f9', borderBottom: '1px solid #c2cfe0', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <Filter size={13} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <div style={{ position: 'relative', flex: 1, minWidth: 140, maxWidth: 280 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo tên, mã SV..."
                style={{
                  width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8,
                  outline: 'none', background: '#fff', boxSizing: 'border-box',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              />
            </div>
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className={filterSelectCls}>
              <option value="">Tất cả trình độ</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {(search || filterLevel) && (
              <>
                <span style={{ fontSize: 12, color: ACCENT, fontWeight: 600, whiteSpace: 'nowrap' }}>{filtered.length}/{results.length} kết quả</span>
                <button onClick={() => { setSearch(''); setFilterLevel('') }}
                  style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  Xóa lọc
                </button>
              </>
            )}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {tableCols.map((col, ci) => (
                    <th key={col.label} style={{
                      ...TH, minWidth: col.minWidth,
                      borderRight: ci < tableCols.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                    }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={tableCols.length} style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af', background: '#fff' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
                      <div style={{ fontSize: 14 }}>Không có kết quả phù hợp</div>
                    </td>
                  </tr>
                ) : filtered.map((r, i) => {
                  const u = r.NguoiDung as Record<string, string> | null
                  const isSelected = selected?.id === r.id
                  const even = i % 2 === 0
                  return (
                    <tr key={r.id as string}
                      onClick={() => setSelected(prev => prev?.id === r.id ? null : r)}
                      style={{
                        background: isSelected ? '#eff6ff' : (even ? '#f8fafc' : '#fff'),
                        cursor: 'pointer', transition: 'background 0.1s',
                        borderLeft: isSelected ? `3px solid ${ACCENT}` : '3px solid transparent',
                      }}
                      className="group hover:!bg-blue-50"
                    >
                      {/* STT */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#6b7280', fontSize: 13 }}>{i + 1}</span>
                      </td>
                      {/* Họ tên */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{u?.ho_ten || '–'}</span>
                      </td>
                      {/* Mã SV */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', color: '#6b7280', fontSize: 12 }}>{u?.ma_sinh_vien || '–'}</span>
                      </td>
                      {/* Lớp */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#374151', fontSize: 13 }}>{u?.lop || '–'}</span>
                      </td>
                      {/* Trình độ */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <LevelBadge level={r.trinh_do_tong_the as string} />
                      </td>
                      {/* Kỹ năng */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {SKILLS.filter(s => (r as Record<string, unknown>)[`trinh_do_${s}`]).map(s => {
                            const lvl = (r as Record<string, unknown>)[`trinh_do_${s}`] as string
                            const c = LEVEL_COLOR_INLINE[lvl]
                            return (
                              <span key={s} style={{
                                fontSize: 11, padding: '2px 7px', borderRadius: 6, fontWeight: 600,
                                background: c?.bg || '#f1f5f9', color: c?.color || '#374151',
                              }}>
                                {SKILL_LABELS[s]}: {lvl}
                              </span>
                            )
                          })}
                        </div>
                      </td>
                      {/* Điểm tổng */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {r.diem_so
                          ? <span style={{ fontWeight: 700, fontSize: 15, color: '#1e3a5f' }}>{r.diem_so as number}</span>
                          : <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
                        }
                      </td>
                      {/* Ngày thi */}
                      <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(r.created_at as string)}</span>
                      </td>
                      {/* Arrow */}
                      <td style={{ borderBottom: CELL_BORDER, padding: '10px 14px', textAlign: 'center' }}>
                        <ChevronRight size={15} style={{ color: isSelected ? ACCENT : '#d1d5db', transition: 'color 0.1s' }} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '2px solid #c2cfe0' }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              Tổng <strong style={{ color: ACCENT }}>{filtered.length}</strong> kết quả
              {(search || filterLevel) && <> / <strong style={{ color: ACCENT }}>{results.length}</strong> tổng</>}
            </span>
          </div>
        </div>

        {/* ── DETAIL PANEL ── */}
        {selected && (() => {
          const u = selected.NguoiDung as Record<string, string> | null
          const lo_trinh = selected.lo_trinh_de_xuat_json as Record<string, unknown> | null
          return (
            <div style={{
              borderRadius: 16, border: '2px solid #b0bfd4', overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)', position: 'sticky', top: 16,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {/* Header */}
              <div style={{
                padding: '14px 20px',
                background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{u?.ho_ten || '–'}</div>
                  <div style={{ color: '#93c5fd', fontSize: 12 }}>
                    {u?.ma_sinh_vien}{u?.lop ? ` · ${u.lop}` : ''}
                  </div>
                  <div style={{ color: '#93c5fd', fontSize: 11, marginTop: 2 }}>{fmtDate(selected.created_at as string)}</div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <LevelBadge level={selected.trinh_do_tong_the as string} large />
                </div>
              </div>

              <div style={{ padding: 16, background: '#fff', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Score */}
                {selected.diem_so ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e5e7eb',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Điểm tổng hợp</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: ACCENT }}>{selected.diem_so as number}</span>
                  </div>
                ) : null}

                {/* Skills breakdown */}
                <div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: '#9ca3af', marginBottom: 8,
                  }}>
                    Trình độ từng kỹ năng
                  </div>
                  <SkillGrid result={selected} />
                </div>
                {/* Proposed roadmap */}
                {lo_trinh ? (
                  <div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: '#9ca3af', marginBottom: 8,
                    }}>
                      Lộ trình đề xuất
                    </div>

                    {/* Điểm yếu */}
                    {Array.isArray((lo_trinh as any).diem_yeu) && (
                      <div style={{ marginBottom: 10 }}>
                        {((lo_trinh as any).diem_yeu as string[]).map((d, i) => (
                          <div key={i} style={{
                            fontSize: 12, padding: '6px 10px', background: '#fff7ed',
                            border: '1px solid #fed7aa', borderRadius: 8, color: '#9a3412',
                            marginBottom: 4, lineHeight: 1.5,
                          }}>
                            ⚠️ {d}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Phases */}
                    {Array.isArray((lo_trinh as any)?.lo_trinh?.phases) &&
                      ((lo_trinh as any).lo_trinh.phases as any[]).map((phase, i) => (
                        <div key={i} style={{
                          marginBottom: 8, padding: '10px 12px',
                          background: '#f0fdf4', border: '1px solid #bbf7d0',
                          borderRadius: 10,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>
                              {i + 1}. {phase.tieu_de}
                            </span>
                            {phase.ky_nang_chinh && (
                              <span style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 999,
                                background: '#dcfce7', color: '#15803d', fontWeight: 600,
                              }}>
                                {phase.ky_nang_chinh}
                              </span>
                            )}
                          </div>
                          {phase.muc_tieu && (
                            <div style={{ fontSize: 12, color: '#166534', marginBottom: 6, fontStyle: 'italic' }}>
                              🎯 {phase.muc_tieu}
                            </div>
                          )}
                          {Array.isArray(phase.hoat_dong) && (
                            <ul style={{ margin: 0, paddingLeft: 16 }}>
                              {(phase.hoat_dong as string[]).map((h, j) => (
                                <li key={j} style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{h}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))
                    }
                  </div>
                ) : null}

                {/* Chủ đề */}
                {selected.chu_de ? (
                  <div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: '#9ca3af', marginBottom: 6,
                    }}>
                      Chủ đề
                    </div>
                    <span style={{
                      fontSize: 12, padding: '4px 12px', background: '#f1f5f9', borderRadius: 999,
                      color: '#374151', fontWeight: 500,
                    }}>
                      {selected.chu_de as string}
                    </span>
                  </div>
                ) : null}

                {/* Close button */}
                <button onClick={() => setSelected(null)} style={{
                  marginTop: 4, padding: '8px 0', borderRadius: 10, border: '1.5px solid #e5e7eb',
                  background: '#fff', color: '#6b7280', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}>
                  Đóng
                </button>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}