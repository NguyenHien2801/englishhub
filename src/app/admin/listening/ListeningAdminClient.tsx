'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const CERTS = ['VSTEP', 'TOEIC', 'APTIS']
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const emptyForm = {
  tieu_de: '', mo_ta: '', cap_do: 'B1', loai_chung_chi: 'VSTEP',
  chu_de: '', video_url: '', script: '', thoi_gian_giay: 300,
}

export default function ListeningAdminClient({ lessons: init }: { lessons: Record<string, unknown>[] }) {
  const [lessons, setLessons] = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null)
  const [questions, setQuestions] = useState<Record<string, unknown>[]>([])
  const [loadingQ, setLoadingQ] = useState(false)
  const supabase = createClient()

  async function loadQuestions(lesson: Record<string, unknown>) {
    setSelected(lesson)
    setLoadingQ(true)
    const { data } = await supabase
      .from('BaiNgheCauHoi')
      .select('*')
      .eq('bai_nghe_id', lesson.id)
      .order('so_thu_tu')
    setQuestions(data || [])
    setLoadingQ(false)
  }

  async function savelesson() {
    if (!form.tieu_de.trim()) { toast.error('Nhập tiêu đề bài nghe'); return }
    const { data, error } = await supabase
      .from('BaiNghe')
      .insert({ ...form, luot_lam: 0, da_kiem_duyet: false })
      .select()
      .single()
    if (error) { toast.error(error.message); return }
    setLessons(prev => [data, ...prev])
    setForm({ ...emptyForm })
    setShowForm(false)
    toast.success('Đã thêm bài nghe!')
  }

  async function toggleKiemDuyet(id: string, cur: boolean) {
    const { error } = await supabase.from('BaiNghe').update({ da_kiem_duyet: !cur }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setLessons(prev => prev.map(l => l.id === id ? { ...l, da_kiem_duyet: !cur } : l))
    toast.success(!cur ? 'Đã duyệt bài' : 'Đã bỏ duyệt')
  }

  async function deleteLesson(id: string) {
    if (!confirm('Xóa bài nghe này? Tất cả câu hỏi cũng bị xóa!')) return
    await supabase.from('BaiNgheCauHoi').delete().eq('bai_nghe_id', id)
    await supabase.from('BaiNghe').delete().eq('id', id)
    setLessons(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(null)
    toast.success('Đã xóa')
  }

  const certColor: Record<string, string> = {
    VSTEP: 'bg-[#E8FFF8] text-[#00A878]',
    TOEIC: 'bg-[#FFF8EC] text-[#F5A623]',
    APTIS: 'bg-[#F0F0FF] text-[#7C7CFF]',
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Bài nghe (Listening)</h1>
          <p className="text-[#6B6B60] mt-1">{lessons.length} bài nghe trong hệ thống</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-5 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">
          + Thêm bài nghe
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Danh sách bài nghe */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-2">Danh sách ({lessons.length})</div>
          {lessons.map(lesson => (
            <div key={lesson.id as string}
              onClick={() => loadQuestions(lesson)}
              className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${selected?.id === lesson.id ? 'border-[#00A878]' : 'border-[#E8E8E0]'}`}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="font-semibold text-sm text-[#0D0D0D] line-clamp-2 flex-1">{lesson.tieu_de as string}</span>
                <button onClick={e => { e.stopPropagation(); deleteLesson(lesson.id as string) }}
                  className="text-[#FF6B6B] text-xs hover:bg-[#FFF0F0] px-1.5 py-0.5 rounded flex-shrink-0">✕</button>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-medium ${certColor[lesson.loai_chung_chi as string] || 'bg-[#F8F7F2] text-[#6B6B60]'}`}>
                  {lesson.loai_chung_chi as string}
                </span>
                <span className="px-2 py-0.5 bg-[#F8F7F2] text-[#6B6B60] rounded-full">{lesson.cap_do as string}</span>
                <span className={`px-2 py-0.5 rounded-full ${lesson.da_kiem_duyet ? 'bg-[#E8FFF8] text-[#00A878]' : 'bg-[#FFF8EC] text-[#F5A623]'}`}>
                  {lesson.da_kiem_duyet ? '✓ Đã duyệt' : 'Chờ duyệt'}
                </span>
              </div>
              <div className="mt-1.5 text-xs text-[#A0A090]">
                {Math.floor((lesson.thoi_gian_giay as number) / 60)}:{String((lesson.thoi_gian_giay as number) % 60).padStart(2, '0')} · {lesson.luot_lam as number} lượt
              </div>
            </div>
          ))}
          {lessons.length === 0 && (
            <div className="text-center py-12 text-[#A0A090] text-sm">Chưa có bài nghe nào</div>
          )}
        </div>

        {/* Chi tiết & câu hỏi */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-[#0D0D0D] text-lg">{selected.tieu_de as string}</h3>
                  {selected.mo_ta ? <p className="text-sm text-[#6B6B60] mt-0.5">{selected.mo_ta as string}</p> : null}
                </div>
                <button
                  onClick={() => toggleKiemDuyet(selected.id as string, selected.da_kiem_duyet as boolean)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${selected.da_kiem_duyet ? 'bg-[#FFF8EC] text-[#F5A623] hover:bg-[#FFECD0]' : 'bg-[#E8FFF8] text-[#00A878] hover:bg-[#D0FFF0]'}`}>
                  {selected.da_kiem_duyet ? 'Bỏ duyệt' : 'Duyệt bài'}
                </button>
              </div>
              
              {selected.video_url ? (
                <div className="mb-4 p-3 bg-[#F8F7F2] rounded-xl text-sm">
                  <span className="text-[#6B6B60]">🎬 </span>
                  <a href={selected.video_url as string} target="_blank" rel="noreferrer"
                  className="text-[#00A878] hover:underline break-all">{selected.video_url as string}</a>
                  </div>
              ) : null}

              <div className="border-t border-[#F8F7F2] pt-4 mt-4">
                <h4 className="font-semibold text-sm text-[#0D0D0D] mb-3">Câu hỏi ({questions.length})</h4>
                {loadingQ ? (
                  <div className="text-center py-8 text-[#A0A090]">Đang tải...</div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-8 text-[#A0A090] text-sm">Chưa có câu hỏi nào cho bài nghe này</div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {questions.map((q, i) => (
                      <div key={q.id as string} className="p-3 bg-[#F8F7F2] rounded-xl text-sm">
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-xs font-bold text-[#6B6B60] flex-shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-[#0D0D0D] font-medium mb-1">{q.noi_dung as string}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              q.loai_cau_hoi === 'trac_nghiem' ? 'bg-[#F0F0FF] text-[#7C7CFF]' : 'bg-[#FFF8EC] text-[#F5A623]'
                            }`}>{q.loai_cau_hoi as string}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-12 text-center text-[#A0A090]">
              <div className="text-5xl mb-3">🎧</div>
              <div className="font-medium">Chọn bài nghe để xem chi tiết & câu hỏi</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal thêm bài nghe */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-[#0D0D0D] mb-4">Thêm bài nghe mới</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Tiêu đề *</label>
                <input type="text" value={form.tieu_de} onChange={e => setForm(p => ({ ...p, tieu_de: e.target.value }))}
                  placeholder="VD: VSTEP B1 – Listening Practice Test 1"
                  className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Mô tả</label>
                <textarea value={form.mo_ta} onChange={e => setForm(p => ({ ...p, mo_ta: e.target.value }))}
                  rows={2} placeholder="Mô tả nội dung bài nghe..."
                  className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Chứng chỉ', key: 'loai_chung_chi', opts: CERTS },
                  { label: 'Cấp độ', key: 'cap_do', opts: LEVELS },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-[#6B6B60] mb-1">{f.label}</label>
                    <select value={(form as unknown as Record<string, string>)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
                      {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Thời gian (giây)</label>
                  <input type="number" value={form.thoi_gian_giay}
                    onChange={e => setForm(p => ({ ...p, thoi_gian_giay: +e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Chủ đề</label>
                <input type="text" value={form.chu_de} onChange={e => setForm(p => ({ ...p, chu_de: e.target.value }))}
                  placeholder="VD: Environment, Technology..."
                  className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B6B60] mb-1">URL Video/Audio</label>
                <input type="text" value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Script (bản ghi)</label>
                <textarea value={form.script} onChange={e => setForm(p => ({ ...p, script: e.target.value }))}
                  rows={4} placeholder="Dán nội dung script bài nghe vào đây..."
                  className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] resize-none font-mono" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-[#0D0D0D] font-medium hover:border-[#0D0D0D] transition-colors">Hủy</button>
              <button onClick={savelesson} className="flex-1 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">Thêm bài nghe</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
