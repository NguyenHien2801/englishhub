'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const CERTS = ['VSTEP', 'TOEIC', 'APTIS']
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const emptyForm = {
  chung_chi: 'VSTEP', cap_do: 'B1', tieu_de: '', bieu_tuong: '✍️',
  de_bai: '', so_tu_toi_thieu: 150, so_tu_toi_da: 250,
  thong_tin_ky_thi: '', thu_tu: 0, dang_hoat_dong: true,
}

type Lesson = Record<string, unknown>

export default function WritingAdminClient({ lessons: init }: { lessons: Lesson[] }) {
  const [lessons, setLessons] = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [selected, setSelected] = useState<Lesson | null>(null)
  const supabase = createClient()

  const certColor: Record<string, string> = {
    VSTEP: 'bg-[#E8FFF8] text-[#00A878]',
    TOEIC: 'bg-[#FFF8EC] text-[#F5A623]',
    APTIS: 'bg-[#F0F0FF] text-[#7C7CFF]',
  }

  async function save() {
    if (!form.tieu_de.trim() || !form.de_bai.trim()) {
      toast.error('Nhập đầy đủ tiêu đề và đề bài'); return
    }
    const payload = {
      ...form,
      rubric_json: { criteria: ['Nội dung', 'Cấu trúc', 'Từ vựng', 'Ngữ pháp'], weights: [25, 25, 25, 25] },
      goi_y_json: { hints: [], outline: '' },
    }
    const { data, error } = await supabase.from('bailuyenviet').insert(payload).select().single()
    if (error) { toast.error(error.message); return }
    setLessons(prev => [...prev, data].sort((a, b) => (a.thu_tu as number) - (b.thu_tu as number)))
    setForm({ ...emptyForm })
    setShowForm(false)
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Bài viết (Writing)</h1>
          <p className="text-[#6B6B60] mt-1">{lessons.length} bài luyện viết trong hệ thống</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-5 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">
          + Thêm bài viết
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Danh sách */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-2">Danh sách ({lessons.length})</div>
          {lessons.map(lesson => (
            <div key={lesson.id as string}
              onClick={() => setSelected(lesson)}
              className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${selected?.id === lesson.id ? 'border-[#00A878]' : 'border-[#E8E8E0]'} ${!lesson.dang_hoat_dong ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-base">{lesson.bieu_tuong as string}</span>
                <span className="font-semibold text-sm text-[#0D0D0D] line-clamp-2 flex-1">{lesson.tieu_de as string}</span>
                <button onClick={e => { e.stopPropagation(); deleteLesson(lesson.id as string) }}
                  className="text-[#FF6B6B] text-xs hover:bg-[#FFF0F0] px-1.5 py-0.5 rounded flex-shrink-0">✕</button>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-medium ${certColor[lesson.chung_chi as string] || 'bg-[#F8F7F2] text-[#6B6B60]'}`}>
                  {lesson.chung_chi as string}
                </span>
                <span className="px-2 py-0.5 bg-[#F8F7F2] text-[#6B6B60] rounded-full">{lesson.cap_do as string}</span>
              </div>
              <div className="mt-1.5 text-xs text-[#A0A090]">
                {lesson.so_tu_toi_thieu as number}–{lesson.so_tu_toi_da as number} từ
              </div>
            </div>
          ))}
          {lessons.length === 0 && (
            <div className="text-center py-12 text-[#A0A090] text-sm">Chưa có bài viết nào</div>
          )}
        </div>

        {/* Chi tiết */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{selected.bieu_tuong as string}</span>
                  <div>
                    <h3 className="font-semibold text-[#0D0D0D] text-lg">{selected.tieu_de as string}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${certColor[selected.chung_chi as string]}`}>{selected.chung_chi as string}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#F8F7F2] text-[#6B6B60]">{selected.cap_do as string}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => toggleActive(selected.id as string, selected.dang_hoat_dong as boolean)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${selected.dang_hoat_dong ? 'bg-[#FFF0F0] text-[#FF6B6B] hover:bg-[#FFE0E0]' : 'bg-[#E8FFF8] text-[#00A878] hover:bg-[#D0FFF0]'}`}>
                  {selected.dang_hoat_dong ? 'Ẩn bài' : 'Kích hoạt'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Từ tối thiểu', value: `${selected.so_tu_toi_thieu} từ` },
                  { label: 'Từ tối đa', value: `${selected.so_tu_toi_da} từ` },
                  { label: 'Thứ tự', value: `#${selected.thu_tu}` },
                ].map(s => (
                  <div key={s.label} className="p-3 bg-[#F8F7F2] rounded-xl text-center">
                    <div className="text-lg font-bold text-[#0D0D0D]">{s.value}</div>
                    <div className="text-xs text-[#A0A090] mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-[#6B6B60] uppercase tracking-wide mb-2">Đề bài</h4>
                  <div className="p-4 bg-[#F8F7F2] rounded-xl text-sm text-[#0D0D0D] leading-relaxed whitespace-pre-wrap">
                    {selected.de_bai as string}
                  </div>
                </div>
                {selected.thong_tin_ky_thi && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#6B6B60] uppercase tracking-wide mb-2">Thông tin kỳ thi</h4>
                    <div className="p-3 bg-[#FFF8EC] rounded-xl text-sm text-[#6B6B60]">{selected.thong_tin_ky_thi as string}</div>
                  </div>
                )}
                {selected.rubric_json && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#6B6B60] uppercase tracking-wide mb-2">Rubric chấm điểm</h4>
                    <div className="flex flex-wrap gap-2">
                      {((selected.rubric_json as Record<string, unknown>).criteria as string[] || []).map((c, i) => (
                        <span key={i} className="px-3 py-1 bg-[#F0F0FF] text-[#7C7CFF] text-xs rounded-full font-medium">
                          {c} ({((selected.rubric_json as Record<string, unknown>).weights as number[])?.[i]}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-12 text-center text-[#A0A090]">
              <div className="text-5xl mb-3">✍️</div>
              <div className="font-medium">Chọn bài viết để xem chi tiết</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal thêm */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-[#0D0D0D] mb-4">Thêm bài viết mới</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Biểu tượng</label>
                  <input type="text" value={form.bieu_tuong} onChange={e => setForm(p => ({ ...p, bieu_tuong: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] text-center text-xl" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Chứng chỉ</label>
                  <select value={form.chung_chi} onChange={e => setForm(p => ({ ...p, chung_chi: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
                    {CERTS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Cấp độ</label>
                  <select value={form.cap_do} onChange={e => setForm(p => ({ ...p, cap_do: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Tiêu đề *</label>
                <input type="text" value={form.tieu_de} onChange={e => setForm(p => ({ ...p, tieu_de: e.target.value }))}
                  placeholder="VD: VSTEP B1 – Task 1: Formal Letter"
                  className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Đề bài *</label>
                <textarea value={form.de_bai} onChange={e => setForm(p => ({ ...p, de_bai: e.target.value }))}
                  rows={5} placeholder="Nhập đề bài chi tiết..."
                  className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Từ tối thiểu</label>
                  <input type="number" value={form.so_tu_toi_thieu} onChange={e => setForm(p => ({ ...p, so_tu_toi_thieu: +e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Từ tối đa</label>
                  <input type="number" value={form.so_tu_toi_da} onChange={e => setForm(p => ({ ...p, so_tu_toi_da: +e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Thứ tự</label>
                  <input type="number" value={form.thu_tu} onChange={e => setForm(p => ({ ...p, thu_tu: +e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Thông tin kỳ thi</label>
                <input type="text" value={form.thong_tin_ky_thi} onChange={e => setForm(p => ({ ...p, thong_tin_ky_thi: e.target.value }))}
                  placeholder="VD: Part 1 – VSTEP Writing"
                  className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-[#0D0D0D] font-medium hover:border-[#0D0D0D] transition-colors">Hủy</button>
              <button onClick={save} className="flex-1 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">Thêm bài viết</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
