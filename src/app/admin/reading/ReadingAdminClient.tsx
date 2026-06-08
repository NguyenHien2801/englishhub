'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAVY = '#0F1C35'
const GOLD = '#C9A84C'
type Passage = Record<string, unknown>
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const CERTS  = ['VSTEP', 'TOEIC', 'APTIS']
const LOAI_BAI = ['short_passage', 'long_passage', 'double_passage', 'article']

const CERT_BADGE: Record<string, { bg: string; color: string }> = {
  VSTEP: { bg: '#d1fae5', color: '#065f46' },
  TOEIC: { bg: '#fef3c7', color: '#92400e' },
  APTIS: { bg: '#ede9fe', color: '#5b21b6' },
}
const LEVEL_BADGE: Record<string, { bg: string; text: string }> = {
  A1: { bg: '#ede9fe', text: '#5b21b6' }, A2: { bg: '#dbeafe', text: '#1d4ed8' },
  B1: { bg: '#d1fae5', text: '#065f46' }, B2: { bg: '#fef3c7', text: '#92400e' },
  C1: { bg: '#fee2e2', text: '#991b1b' }, C2: { bg: '#f3e8ff', text: '#6b21a8' },
}
const selectStyle: React.CSSProperties = {
  padding: '9px 14px', border: '1px solid #E8E8E0', borderRadius: 12, fontSize: 14,
  outline: 'none', background: '#fff', color: NAVY, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
}
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E8E8E0', borderRadius: 18, padding: 20 }

const TH: React.CSSProperties = {
  background: 'linear-gradient(180deg,#1E2F50 0%,#0F1C35 100%)',
  color: 'rgba(226,232,240,0.85)', padding: '11px 14px', fontSize: 13,
  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
  whiteSpace: 'nowrap', borderBottom: `2px solid rgba(201,168,76,0.15)`,
  borderRight: '1px solid rgba(255,255,255,0.1)',
}

export default function ReadingAdminClient({ passages }: { passages: Passage[] }) {
  const [list, setList] = useState<Passage[]>(passages)
  const [filter, setFilter] = useState({ cert: '', level: '' })
  const [selected, setSelected] = useState<Passage | null>(null)
  const [tab, setTab] = useState<'baidoc' | 'nganhang'>('baidoc')
  // NganHangCauHoi state
  const [nhQuestions, setNhQuestions] = useState<Passage[]>([])
  const [nhLoaded, setNhLoaded] = useState(false)
  const [nhSelected, setNhSelected] = useState<Passage | null>(null)
  const [nhFilter, setNhFilter] = useState({ cert: '', level: '' })
  const supabase = createClient()

  async function loadNganHang() {
    if (nhLoaded) return
    const { data } = await supabase.from('NganHangCauHoi').select('*').eq('ky_nang', 'DOC').order('created_at', { ascending: false })
    setNhQuestions(data || [])
    setNhLoaded(true)
  }

  async function toggleApprove(p: Passage) {
    const newVal = !p.da_kiem_duyet
    const { error } = await supabase.from('BaiDoc').update({ da_kiem_duyet: newVal }).eq('id', p.id as string)
    if (error) return
    setList(prev => prev.map(x => x.id === p.id ? { ...x, da_kiem_duyet: newVal } : x))
    if (selected?.id === p.id) setSelected(s => s ? { ...s, da_kiem_duyet: newVal } : s)
  }

  async function toggleActive(p: Passage) {
    const newVal = !p.dang_hoat_dong
    const { error } = await supabase.from('BaiDoc').update({ dang_hoat_dong: newVal }).eq('id', p.id as string)
    if (error) return
    setList(prev => prev.map(x => x.id === p.id ? { ...x, dang_hoat_dong: newVal } : x))
  }

  async function deletePassage(id: string) {
    if (!confirm('Xóa bài đọc này và toàn bộ câu hỏi?')) return
    await supabase.from('BaiDocCauHoi').delete().eq('bai_doc_id', id)
    await supabase.from('KetQuaDocHieu').delete().eq('bai_doc_id', id)
    const { error } = await supabase.from('BaiDoc').delete().eq('id', id)
    if (error) return
    setList(prev => prev.filter(x => x.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  async function deleteNH(id: string) {
    if (!confirm('Xóa câu hỏi này?')) return
    const { error } = await supabase.from('NganHangCauHoi').delete().eq('id', id)
    if (error) return
    setNhQuestions(prev => prev.filter(q => q.id !== id))
    if (nhSelected?.id === id) setNhSelected(null)
  }

  const filtered = list.filter(p =>
    (!filter.cert || p.loai_chung_chi === filter.cert) &&
    (!filter.level || p.cap_do === filter.level)
  )

  const nhFiltered = nhQuestions.filter(q =>
    (!nhFilter.cert || q.loai_chung_chi === nhFilter.cert) &&
    (!nhFilter.level || q.cap_do === nhFilter.level)
  )

  return (
    <div className="max-w-7xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
          Bài đọc (Reading)
        </h1>
        <p style={{ color: '#6B6B60', fontSize: 14 }}>
          Quản lý bài đọc hiểu và ngân hàng câu hỏi DOC
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #E8E8E0' }}>
        {([
          { key: 'baidoc', label: `📄 Bài đọc (${list.length})` },
          { key: 'nganhang', label: `📋 Ngân hàng câu hỏi DOC` },
        ] as const).map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); if (t.key === 'nganhang') loadNganHang() }}
            style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600, borderRadius: '12px 12px 0 0',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: tab === t.key ? NAVY : 'transparent',
              color: tab === t.key ? '#fff' : '#6B6B60',
              marginBottom: -2,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: BaiDoc */}
      {tab === 'baidoc' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={filter.cert} onChange={e => setFilter(p => ({ ...p, cert: e.target.value }))} style={selectStyle}>
              <option value="">Tất cả chứng chỉ</option>
              {CERTS.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filter.level} onChange={e => setFilter(p => ({ ...p, level: e.target.value }))} style={selectStyle}>
              <option value="">Tất cả cấp độ</option>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6B6B60' }}>
              <strong style={{ color: NAVY }}>{filtered.length}</strong> bài đọc
            </span>
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* List */}
            <div className="lg:col-span-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '64px 0', color: '#A0A090' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Chưa có bài đọc nào</div>
                </div>
              )}
              {filtered.map(p => {
                const isActive = selected?.id === p.id
                const cb = CERT_BADGE[p.loai_chung_chi as string]
                const lb = LEVEL_BADGE[p.cap_do as string]
                return (
                  <div key={p.id as string}
                    onClick={() => setSelected(p)}
                    style={{
                      padding: 14, background: '#fff', borderRadius: 14, cursor: 'pointer',
                      border: isActive ? `2px solid ${NAVY}` : '1px solid #E8E8E0',
                      transition: 'all 0.15s', opacity: p.dang_hoat_dong ? 1 : 0.55,
                    }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontSize: 22 }}>{(p.bieu_tuong as string) || '📄'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.tieu_de as string}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B6B60' }}>{(p.chu_de as string) || '—'}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); deletePassage(p.id as string) }}
                        style={{ color: '#ef4444', fontSize: 11, padding: '2px 6px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: cb?.bg || '#F8F7F2', color: cb?.color || '#6B6B60' }}>{p.loai_chung_chi as string}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: lb?.bg || '#F8F7F2', color: lb?.text || '#6B6B60' }}>{p.cap_do as string}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#F8F7F2', color: '#6B6B60' }}>{p.so_cau_hoi as number} câu</span>
                      {p.da_kiem_duyet && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#d1fae5', color: '#065f46' }}>✓ Duyệt</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Detail */}
            <div className="lg:col-span-3">
              {selected ? (
                <div style={{ ...card, position: 'sticky', top: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 28 }}>{(selected.bieu_tuong as string) || '📄'}</span>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ fontWeight: 700, fontSize: 18, color: NAVY }}>{selected.tieu_de as string}</h2>
                      {selected.mo_ta && <p style={{ fontSize: 13, color: '#6B6B60', marginTop: 2 }}>{selected.mo_ta as string}</p>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    {(() => { const cb = CERT_BADGE[selected.loai_chung_chi as string]; return <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 10, fontWeight: 600, background: cb?.bg || '#F8F7F2', color: cb?.color || '#6B6B60' }}>{selected.loai_chung_chi as string}</span> })()}
                    {(() => { const lb = LEVEL_BADGE[selected.cap_do as string]; return <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 10, fontWeight: 600, background: lb?.bg || '#F8F7F2', color: lb?.text || '#6B6B60' }}>{selected.cap_do as string}</span> })()}
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 10, background: '#F8F7F2', color: '#6B6B60' }}>{selected.loai_bai as string}</span>
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 10, background: '#F8F7F2', color: '#6B6B60' }}>{selected.so_cau_hoi as number} câu hỏi</span>
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 10, background: '#F8F7F2', color: '#6B6B60' }}>{Math.floor((selected.thoi_gian_giay as number) / 60)} phút</span>
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 10, background: '#F8F7F2', color: '#6B6B60' }}>{selected.luot_lam as number} lượt làm</span>
                  </div>

                  {selected.thong_tin_ky_thi && (
                    <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(201,168,76,0.06)', borderRadius: 10, border: '1px solid rgba(201,168,76,0.2)', fontSize: 13, color: '#6B6B60' }}>
                      📋 {selected.thong_tin_ky_thi as string}
                    </div>
                  )}

                  <div style={{ marginBottom: 16, maxHeight: 220, overflowY: 'auto', padding: '12px 14px', background: '#F8F7F2', borderRadius: 12, fontSize: 14, color: NAVY, lineHeight: 1.7 }}>
                    {selected.noi_dung as string}
                  </div>

                  <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid #E8E8E0' }}>
                    <button
                      onClick={() => toggleApprove(selected)}
                      style={{
                        padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                        background: selected.da_kiem_duyet ? '#d1fae5' : '#fef3c7',
                        color: selected.da_kiem_duyet ? '#065f46' : '#92400e',
                      }}>
                      {selected.da_kiem_duyet ? '✓ Đã duyệt' : '○ Duyệt bài'}
                    </button>
                    <button
                      onClick={() => toggleActive(selected)}
                      style={{
                        padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                        background: selected.dang_hoat_dong ? '#fee2e2' : '#d1fae5',
                        color: selected.dang_hoat_dong ? '#991b1b' : '#065f46',
                      }}>
                      {selected.dang_hoat_dong ? 'Ẩn bài' : 'Hiện bài'}
                    </button>
                    <button
                      onClick={() => deletePassage(selected.id as string)}
                      style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#fee2e2', color: '#991b1b', marginLeft: 'auto' }}>
                      🗑 Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ ...card, padding: 48, textAlign: 'center', color: '#A0A090' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Chọn bài đọc để xem chi tiết</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Dữ liệu từ bảng BaiDoc</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* TAB: Ngân hàng câu hỏi DOC */}
      {tab === 'nganhang' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={nhFilter.cert} onChange={e => setNhFilter(p => ({ ...p, cert: e.target.value }))} style={selectStyle}>
              <option value="">Tất cả chứng chỉ</option>
              {CERTS.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={nhFilter.level} onChange={e => setNhFilter(p => ({ ...p, level: e.target.value }))} style={selectStyle}>
              <option value="">Tất cả cấp độ</option>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
            {!nhLoaded && <span style={{ fontSize: 13, color: '#A0A090' }}>Đang tải...</span>}
            {nhLoaded && <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6B6B60' }}><strong style={{ color: NAVY }}>{nhFiltered.length}</strong> câu hỏi</span>}
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {nhLoaded && nhFiltered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '64px 0', color: '#A0A090' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ fontWeight: 600 }}>Chưa có câu hỏi DOC nào</div>
                </div>
              )}
              {nhFiltered.map(q => {
                const isAct = nhSelected?.id === q.id
                const cb = CERT_BADGE[q.loai_chung_chi as string]
                const lb = LEVEL_BADGE[q.cap_do as string]
                return (
                  <div key={q.id as string}
                    onClick={() => setNhSelected(q)}
                    style={{
                      padding: 14, background: '#fff', borderRadius: 14, cursor: 'pointer',
                      border: isAct ? `2px solid ${NAVY}` : '1px solid #E8E8E0', transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <p style={{ flex: 1, fontSize: 13, color: NAVY, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {q.noi_dung_cau_hoi as string}
                      </p>
                      <button onClick={e => { e.stopPropagation(); deleteNH(q.id as string) }}
                        style={{ color: '#ef4444', fontSize: 11, padding: '2px 6px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: cb?.bg || '#F8F7F2', color: cb?.color || '#6B6B60' }}>{q.loai_chung_chi as string}</span>
                      {q.cap_do && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: lb?.bg || '#F8F7F2', color: lb?.text || '#6B6B60' }}>{q.cap_do as string}</span>}
                      {q.so_phan && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#F8F7F2', color: '#6B6B60' }}>Phần {q.so_phan as number}</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="lg:col-span-3">
              {nhSelected ? (
                <div style={{ ...card, position: 'sticky', top: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {(() => { const cb = CERT_BADGE[nhSelected.loai_chung_chi as string]; return <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 10, fontWeight: 600, background: cb?.bg || '#F8F7F2', color: cb?.color || '#6B6B60' }}>{nhSelected.loai_chung_chi as string}</span> })()}
                    {nhSelected.cap_do && (() => { const lb = LEVEL_BADGE[nhSelected.cap_do as string]; return <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 10, fontWeight: 600, background: lb?.bg || '#F8F7F2', color: lb?.text || '#6B6B60' }}>{nhSelected.cap_do as string}</span> })()}
                    {nhSelected.so_phan && <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 10, background: '#F8F7F2', color: '#6B6B60' }}>Phần {nhSelected.so_phan as number}</span>}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Câu hỏi</div>
                    <p style={{ fontSize: 14, color: NAVY, lineHeight: 1.7 }}>{nhSelected.noi_dung_cau_hoi as string}</p>
                  </div>
                  {nhSelected.cac_lua_chon && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Các lựa chọn</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {Object.entries(nhSelected.cac_lua_chon as Record<string, string>).map(([k, v]) => {
                          const isCorrect = k === nhSelected.dap_an_dung
                          return (
                            <div key={k} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10, fontSize: 13, alignItems: 'flex-start',
                              background: isCorrect ? '#d1fae5' : '#F8F7F2', border: isCorrect ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent' }}>
                              <span style={{ fontWeight: 700, flexShrink: 0, color: isCorrect ? '#065f46' : '#6B6B60' }}>{k}.</span>
                              <span style={{ flex: 1, color: isCorrect ? '#065f46' : NAVY, fontWeight: isCorrect ? 600 : 400 }}>{v}</span>
                              {isCorrect && <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>✓</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {nhSelected.giai_thich && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Giải thích</div>
                      <div style={{ padding: 12, background: 'rgba(201,168,76,0.06)', borderRadius: 12, fontSize: 13, color: '#6B6B60', lineHeight: 1.6, border: '1px solid rgba(201,168,76,0.15)' }}>
                        {nhSelected.giai_thich as string}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ ...card, padding: 48, textAlign: 'center', color: '#A0A090' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Chọn câu hỏi để xem chi tiết</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
