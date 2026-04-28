'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const CERTS = ['TOEIC','VSTEP','APTIS','LEVEL_TEST']
const SKILLS = ['NGU_PHAP','DOC','NGHE','VIET','TU_VUNG']
const LEVELS = ['A1','A2','B1','B2','C1','C2']

const emptyQ = { loai_chung_chi:'TOEIC', ky_nang:'NGU_PHAP', so_phan:5, loai_cau_hoi:'trac_nghiem', noi_dung_cau_hoi:'', cac_lua_chon:[{key:'A',value:''},{key:'B',value:''},{key:'C',value:''},{key:'D',value:''}], dap_an_dung:'A', giai_thich:'', cap_do:'B1' }

export default function QuestionsClient({ questions: init }: { questions: Record<string,unknown>[] }) {
  const [questions, setQuestions] = useState(init)
  const [filterCert, setFilterCert] = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyQ })
  const supabase = createClient()

  const filtered = questions.filter(q =>
    (!filterCert || q.loai_chung_chi === filterCert) &&
    (!filterSkill || q.ky_nang === filterSkill)
  )

  function updateOption(key: string, val: string) {
    setForm(prev => ({ ...prev, cac_lua_chon: (prev.cac_lua_chon as {key:string,value:string}[]).map(o => o.key === key ? { ...o, value: val } : o) }))
  }

  async function saveQuestion() {
    if (!form.noi_dung_cau_hoi.trim()) { toast.error('Nhập nội dung câu hỏi'); return }
    const { data, error } = await supabase.from('NganHangCauHoi').insert({
      loai_chung_chi: form.loai_chung_chi, ky_nang: form.ky_nang, so_phan: form.so_phan,
      loai_cau_hoi: form.loai_cau_hoi, noi_dung_cau_hoi: form.noi_dung_cau_hoi,
      cac_lua_chon: form.cac_lua_chon, dap_an_dung: form.dap_an_dung,
      giai_thich: form.giai_thich, cap_do: form.cap_do,
    }).select().single()
    if (error) { toast.error(error.message); return }
    setQuestions(prev => [data, ...prev])
    setForm({ ...emptyQ })
    setShowForm(false)
    toast.success('Đã thêm câu hỏi!')
  }

  async function deleteQ(id: string) {
    if (!confirm('Xóa câu hỏi này?')) return
    await supabase.from('NganHangCauHoi').delete().eq('id', id)
    setQuestions(prev => prev.filter(q => q.id !== id))
    toast.success('Đã xóa')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Ngân hàng câu hỏi</h1>
          <p className="text-[#6B6B60] mt-1">{filtered.length} / {questions.length} câu hỏi</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">+ Thêm câu hỏi</button>
      </div>

      <div className="flex gap-3 mb-5">
        <select value={filterCert} onChange={e => setFilterCert(e.target.value)}
          className="px-4 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
          <option value="">Tất cả chứng chỉ</option>
          {CERTS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSkill} onChange={e => setFilterSkill(e.target.value)}
          className="px-4 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
          <option value="">Tất cả kỹ năng</option>
          {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((q, i) => (
          <div key={q.id as string} className="bg-white rounded-xl border border-[#E8E8E0] p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex gap-2 mb-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-[#E8FFF8] text-[#00A878] text-xs font-medium rounded-full">{q.loai_chung_chi as string}</span>
                  <span className="px-2 py-0.5 bg-[#F0F0FF] text-[#7C7CFF] text-xs font-medium rounded-full">{q.ky_nang as string}</span>
                  <span className="px-2 py-0.5 bg-[#FFF8EC] text-[#F5A623] text-xs font-medium rounded-full">Part {q.so_phan as number}</span>
                  <span className="px-2 py-0.5 bg-[#F8F7F2] text-[#6B6B60] text-xs rounded-full">{q.cap_do as string}</span>
                </div>
                <div className="text-sm text-[#0D0D0D] font-medium mb-2 leading-relaxed line-clamp-2">{q.noi_dung_cau_hoi as string}</div>
                {(q.cac_lua_chon as {key:string,value:string}[])?.slice(0,2).map(o => (
                  <span key={o.key} className={`inline-block mr-3 text-xs ${o.key === q.dap_an_dung ? 'text-[#00A878] font-bold' : 'text-[#A0A090]'}`}>
                    {o.key === q.dap_an_dung ? '✓' : ''} {o.key}. {o.value.substring(0, 30)}{o.value.length > 30 ? '...' : ''}
                  </span>
                ))}
              </div>
              <button onClick={() => deleteQ(q.id as string)} className="text-[#FF6B6B] text-xs hover:bg-[#FFF0F0] px-2 py-1 rounded-lg transition-colors flex-shrink-0">Xóa</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-[#A0A090] bg-white rounded-2xl border border-[#E8E8E0]">Chưa có câu hỏi nào</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-[#0D0D0D] mb-4">Thêm câu hỏi mới</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Chứng chỉ', key: 'loai_chung_chi', opts: CERTS },
                  { label: 'Kỹ năng', key: 'ky_nang', opts: SKILLS },
                  { label: 'Cấp độ', key: 'cap_do', opts: LEVELS },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-[#6B6B60] mb-1">{f.label}</label>
                    <select value={(form as Record<string,unknown>)[f.key] as string}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
                      {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Nội dung câu hỏi *</label>
                <textarea value={form.noi_dung_cau_hoi} onChange={e => setForm(prev => ({ ...prev, noi_dung_cau_hoi: e.target.value }))}
                  rows={3} placeholder="The manager _____ all employees to submit their reports by Friday."
                  className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] resize-none" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#6B6B60]">Các lựa chọn</label>
                {(form.cac_lua_chon as {key:string,value:string}[]).map(o => (
                  <div key={o.key} className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${form.dap_an_dung === o.key ? 'bg-[#00A878] text-white' : 'bg-[#F8F7F2] text-[#6B6B60]'}`}
                      onClick={() => setForm(prev => ({ ...prev, dap_an_dung: o.key }))} style={{ cursor: 'pointer' }}>
                      {o.key}
                    </span>
                    <input type="text" value={o.value} onChange={e => updateOption(o.key, e.target.value)}
                      placeholder={`Lựa chọn ${o.key}...`}
                      className="flex-1 px-3 py-2 border-2 border-[#E8E8E0] rounded-lg text-sm focus:outline-none focus:border-[#00A878] transition-colors" />
                  </div>
                ))}
                <p className="text-xs text-[#A0A090]">Click vào chữ cái để chọn đáp án đúng (hiện tại: {form.dap_an_dung})</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B6B60] mb-1">Giải thích đáp án</label>
                <textarea value={form.giai_thich} onChange={e => setForm(prev => ({ ...prev, giai_thich: e.target.value }))}
                  rows={2} placeholder="Giải thích tại sao đáp án A đúng..."
                  className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-[#0D0D0D] font-medium hover:border-[#0D0D0D] transition-colors">Hủy</button>
              <button onClick={saveQuestion} className="flex-1 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">Lưu câu hỏi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
