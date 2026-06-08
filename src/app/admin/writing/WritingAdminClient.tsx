'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const NAVY  = '#0F1C35'
const NAVY2 = '#1E2F50'
const GOLD  = '#C9A84C'
const CERTS  = ['VSTEP', 'TOEIC', 'APTIS']
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

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

const emptyForm = {
  chung_chi: 'VSTEP', cap_do: 'B1', tieu_de: '', bieu_tuong: '✍️',
  de_bai: '', so_tu_toi_thieu: 150, so_tu_toi_da: 250,
  thong_tin_ky_thi: '', thu_tu: 0, dang_hoat_dong: true,
}
type Lesson = Record<string, unknown>

const inputCls: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #E8E8E0',
  borderRadius: 10, fontSize: 13, outline: 'none',
  fontFamily: "'DM Sans', sans-serif", color: NAVY, background: '#fff',
}
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E8E8E0', borderRadius: 18 }

export default function WritingAdminClient({ lessons: init }: { lessons: Lesson[] }) {
  const [lessons, setLessons] = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [selected, setSelected] = useState<Lesson | null>(null)
  const supabase = createClient()

  async function save() {
    if (!form.tieu_de.trim() || !form.de_bai.trim()) { toast.error('Nhập đầy đủ tiêu đề và đề bài'); return }
    const payload = {
      ...form,
      rubric_json: { criteria: ['Nội dung', 'Cấu trúc', 'Từ vựng', 'Ngữ pháp'], weights: [25, 25, 25, 25] },
      goi_y_json: { hints: [], outline: '' },
    }
    const { data, error } = await supabase.from('bailuyenviet').insert(payload).select().single()
    if (error) { toast.error(error.message); return }
    setLessons(prev => [...prev, data].sort((a, b) => (a.thu_tu as number) - (b.thu_tu as number)))
    setForm({ ...emptyForm }); setShowForm(false)
    toast.success('Đã thêm bài viết!')
  }

  async function toggleActive(id: string, cur: boolean) {
    const { error } = await supabase.from('bailuyenviet').update({ dang_hoat_dong: !cur }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setLessons(prev => prev.map(l => l.id === id ? { ...l, dang_hoat_dong: !cur } : l))
    if (selected?.id === id) setSelected(s => s ? { ...s, dang_hoat_dong: !cur } : s)
    toast.success(!cur ? 'Đã kích hoạt' : 'Đã ẩn bài viết')
  }

  async function deleteLesson(id: string) {
    if (!confirm('Xóa bài viết này?')) return
    const { error } = await supabase.from('bailuyenviet').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setLessons(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(null)
    toast.success('Đã xóa')
  }

  return (
    <div className="max-w-6xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
            Bài viết (Writing)
          </h1>
          <p style={{ color: '#6B6B60', fontSize: 14 }}>{lessons.length} bài luyện viết trong hệ thống</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: `linear-gradient(135deg, ${NAVY}, ${NAVY2})`,
          color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 12,
          border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 4px 14px rgba(15,28,53,0.2)',
        }}>
          + Thêm bài viết
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* List */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Danh sách ({lessons.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lessons.map(lesson => {
              const cb = CERT_BADGE[lesson.chung_chi as string]
              const lb = LEVEL_BADGE[lesson.cap_do as string]
              const isActive = selected?.id === lesson.id
              return (
                <div key={lesson.id as string}
                  onClick={() => setSelected(lesson)}
                  style={{
                    padding: 14, background: '#fff', borderRadius: 14, cursor: 'pointer',
                    border: isActive ? `2px solid ${NAVY}` : '1px solid #E8E8E0',
                    opacity: lesson.dang_hoat_dong ? 1 : 0.5, transition: 'all 0.15s',
                  }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20 }}>{lesson.bieu_tuong as string}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: NAVY, flex: 1, lineHeight: 1.4 }}>{lesson.tieu_de as string}</span>
                    <button onClick={e => { e.stopPropagation(); deleteLesson(lesson.id as string) }}
                      style={{ color: '#ef4444', fontSize: 11, padding: '2px 6px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: cb?.bg || '#F8F7F2', color: cb?.color || '#6B6B60' }}>{lesson.chung_chi as string}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: lb?.bg || '#F8F7F2', color: lb?.text || '#6B6B60' }}>{lesson.cap_do as string}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#F8F7F2', color: '#6B6B60' }}>{lesson.so_tu_toi_thieu as number}–{lesson.so_tu_toi_da as number} từ</span>
                  </div>
                </div>
              )
            })}
            {lessons.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0A090', fontSize: 14 }}>Chưa có bài viết nào</div>}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div style={{ ...card, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #E8E8E0' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 36 }}>{selected.bieu_tuong as string}</span>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 17, color: NAVY }}>{selected.tieu_de as string}</h3>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      {(() => {
                        const cb = CERT_BADGE[selected.chung_chi as string]
                        const lb = LEVEL_BADGE[selected.cap_do as string]
                        return <>
                          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, fontWeight: 600, background: cb?.bg || '#F8F7F2', color: cb?.color || '#6B6B60' }}>{selected.chung_chi as string}</span>
                          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, fontWeight: 600, background: lb?.bg || '#F8F7F2', color: lb?.text || '#6B6B60' }}>{selected.cap_do as string}</span>
                        </>
                      })()}
                    </div>
                  </div>
                </div>
                <button onClick={() => toggleActive(selected.id as string, selected.dang_hoat_dong as boolean)}
                  style={{
                    padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: selected.dang_hoat_dong ? '#fee2e2' : '#d1fae5',
                    color: selected.dang_hoat_dong ? '#991b1b' : '#065f46',
                  }}>
                  {selected.dang_hoat_dong ? 'Ẩn bài' : 'Kích hoạt'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Từ tối thiểu', value: `${selected.so_tu_toi_thieu} từ` },
                  { label: 'Từ tối đa',    value: `${selected.so_tu_toi_da} từ` },
                  { label: 'Thứ tự',       value: `#${selected.thu_tu}` },
                ].map(s => (
                  <div key={s.label} style={{ padding: 12, background: '#F8F7F2', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: NAVY, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#A0A090', marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Đề bài</div>
                  <div style={{ padding: 14, background: '#F8F7F2', borderRadius: 12, fontSize: 14, color: NAVY, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {selected.de_bai as string}
                  </div>
                </div>
                {selected.thong_tin_ky_thi && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Thông tin kỳ thi</div>
                    <div style={{ padding: 12, background: 'rgba(201,168,76,0.06)', borderRadius: 12, fontSize: 13, color: '#6B6B60', border: '1px solid rgba(201,168,76,0.15)' }}>
                      {selected.thong_tin_ky_thi as string}
                    </div>
                  </div>
                )}
                {selected.rubric_json && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Rubric chấm điểm</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {((selected.rubric_json as Record<string, unknown>).criteria as string[] || []).map((c, i) => (
                        <span key={i} style={{ padding: '5px 12px', background: '#ede9fe', color: '#5b21b6', fontSize: 12, borderRadius: 20, fontWeight: 600 }}>
                          {c} ({((selected.rubric_json as Record<string, unknown>).weights as number[])?.[i]}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ ...card, padding: 48, textAlign: 'center', color: '#A0A090' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✍️</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Chọn bài viết để xem chi tiết</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #E8E8E0' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${NAVY}, ${NAVY2})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: GOLD, fontSize: 18 }}>✍️</span>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: NAVY }}>Thêm bài viết mới</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Biểu tượng', el: <input type="text" value={form.bieu_tuong} onChange={e => setForm(p => ({ ...p, bieu_tuong: e.target.value }))} style={{ ...inputCls, textAlign: 'center', fontSize: 20 }} /> },
                  { label: 'Chứng chỉ', el: (
                    <select value={form.chung_chi} onChange={e => setForm(p => ({ ...p, chung_chi: e.target.value }))} style={{ ...inputCls }}>
                      {CERTS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  )},
                  { label: 'Cấp độ', el: (
                    <select value={form.cap_do} onChange={e => setForm(p => ({ ...p, cap_do: e.target.value }))} style={{ ...inputCls }}>
                      {LEVELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  )},
                ].map(({ label, el }) => (
                  <div key={label}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
                    {el}
                  </div>
                ))}
              </div>

              {[
                { label: 'Tiêu đề *', placeholder: 'VD: VSTEP B1 – Task 1: Formal Letter', key: 'tieu_de' as const },
                { label: 'Thông tin kỳ thi', placeholder: 'VD: Part 1 – VSTEP Writing', key: 'thong_tin_ky_thi' as const },
              ].map(({ label, placeholder, key }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
                  <input type="text" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={inputCls} />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Đề bài *</label>
                <textarea value={form.de_bai} onChange={e => setForm(p => ({ ...p, de_bai: e.target.value }))}
                  rows={5} placeholder="Nhập đề bài chi tiết..."
                  style={{ ...inputCls, resize: 'vertical', lineHeight: 1.6 }} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Từ tối thiểu', k: 'so_tu_toi_thieu' as const },
                  { label: 'Từ tối đa',    k: 'so_tu_toi_da' as const },
                  { label: 'Thứ tự',       k: 'thu_tu' as const },
                ].map(({ label, k }) => (
                  <div key={k}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
                    <input type="number" value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: +e.target.value }))} style={inputCls} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowForm(false)} style={{
                flex: 1, padding: '12px 0', border: '1px solid #E8E8E0', borderRadius: 12,
                color: NAVY, fontWeight: 600, fontSize: 14, cursor: 'pointer', background: '#fff', fontFamily: "'DM Sans', sans-serif",
              }}>Hủy</button>
              <button onClick={save} style={{
                flex: 1, padding: '12px 0', background: `linear-gradient(135deg, ${NAVY}, ${NAVY2})`,
                color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 12, border: 'none',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 14px rgba(15,28,53,0.2)',
              }}>Thêm bài viết</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
