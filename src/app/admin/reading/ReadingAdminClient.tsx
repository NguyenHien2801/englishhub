'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Question = Record<string, unknown>

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const CERTS = ['VSTEP', 'TOEIC', 'APTIS']

export default function ReadingAdminClient() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ cert: '', level: '' })
  const [selected, setSelected] = useState<Question | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const query = supabase.from('NganHangCauHoi').select('*').eq('ky_nang', 'DOC').order('created_at', { ascending: false })
      const { data } = await query
      setQuestions(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = questions.filter(q =>
    (!filter.cert || q.loai_chung_chi === filter.cert) &&
    (!filter.level || q.cap_do === filter.level)
  )

  async function deleteQ(id: string) {
    if (!confirm('Xóa câu hỏi này?')) return
    const { error } = await supabase.from('NganHangCauHoi').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setQuestions(prev => prev.filter(q => q.id !== id))
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
          <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Bài đọc (Reading)</h1>
          <p className="text-[#6B6B60] mt-1">{filtered.length} câu hỏi đọc hiểu</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select value={filter.cert} onChange={e => setFilter(p => ({ ...p, cert: e.target.value }))}
          className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
          <option value="">Tất cả chứng chỉ</option>
          {CERTS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filter.level} onChange={e => setFilter(p => ({ ...p, level: e.target.value }))}
          className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
          <option value="">Tất cả cấp độ</option>
          {LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
        <div className="flex gap-2 ml-auto text-xs text-[#A0A090]">
          {LEVELS.map(l => {
            const count = questions.filter(q => q.cap_do === l).length
            if (!count) return null
            return <span key={l} className="px-2 py-1 bg-[#F8F7F2] rounded-lg">{l}: {count}</span>
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-16 text-[#A0A090]">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[#A0A090] text-sm">
              <div className="text-4xl mb-3">📖</div>
              <div>Chưa có câu hỏi đọc hiểu nào</div>
              <div className="mt-2 text-xs">Thêm từ trang Ngân hàng câu hỏi với kỹ năng DOC</div>
            </div>
          ) : filtered.map(q => (
            <div key={q.id as string}
              onClick={() => setSelected(q)}
              className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${selected?.id === q.id ? 'border-[#00A878]' : 'border-[#E8E8E0]'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm text-[#0D0D0D] line-clamp-2 flex-1">{q.noi_dung_cau_hoi as string}</p>
                <button onClick={e => { e.stopPropagation(); deleteQ(q.id as string) }}
                  className="text-[#FF6B6B] text-xs hover:bg-[#FFF0F0] px-1.5 py-0.5 rounded flex-shrink-0">✕</button>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${certColor[q.loai_chung_chi as string] || 'bg-[#F8F7F2] text-[#6B6B60]'}`}>
                  {q.loai_chung_chi as string}
                </span>
                {q.cap_do && <span className="text-xs px-2 py-0.5 rounded-full bg-[#F8F7F2] text-[#6B6B60]">{q.cap_do as string}</span>}
                {q.so_phan && <span className="text-xs px-2 py-0.5 rounded-full bg-[#F8F7F2] text-[#6B6B60]">Phần {q.so_phan as number}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-6 sticky top-4">
              <div className="flex gap-2 mb-4 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${certColor[selected.loai_chung_chi as string]}`}>{selected.loai_chung_chi as string}</span>
                {selected.cap_do && <span className="text-xs px-2 py-1 rounded-full bg-[#F8F7F2] text-[#6B6B60]">{selected.cap_do as string}</span>}
                {selected.so_phan && <span className="text-xs px-2 py-1 rounded-full bg-[#F8F7F2] text-[#6B6B60]">Phần {selected.so_phan as number}</span>}
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-2">Câu hỏi</h4>
                <p className="text-[#0D0D0D] leading-relaxed">{selected.noi_dung_cau_hoi as string}</p>
              </div>

              {selected.hinh_anh_url && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-2">Hình ảnh</h4>
                  <img src={selected.hinh_anh_url as string} alt="question" className="rounded-xl max-h-48 object-cover border border-[#E8E8E0]" />
                </div>
              )}

              {selected.cac_lua_chon && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-2">Các lựa chọn</h4>
                  <div className="space-y-2">
                    {Object.entries(selected.cac_lua_chon as Record<string, string>).map(([k, v]) => (
                      <div key={k} className={`flex items-start gap-2 p-2.5 rounded-lg text-sm ${k === selected.dap_an_dung ? 'bg-[#E8FFF8] border border-[#00A878]/30' : 'bg-[#F8F7F2]'}`}>
                        <span className={`font-bold flex-shrink-0 ${k === selected.dap_an_dung ? 'text-[#00A878]' : 'text-[#6B6B60]'}`}>{k}.</span>
                        <span className={k === selected.dap_an_dung ? 'text-[#00A878] font-medium' : 'text-[#0D0D0D]'}>{v}</span>
                        {k === selected.dap_an_dung && <span className="ml-auto text-xs text-[#00A878]">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.giai_thich && (
                <div>
                  <h4 className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-2">Giải thích</h4>
                  <div className="p-3 bg-[#FFF8EC] rounded-xl text-sm text-[#6B6B60] leading-relaxed">{selected.giai_thich as string}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-12 text-center text-[#A0A090]">
              <div className="text-5xl mb-3">📖</div>
              <div className="font-medium">Chọn câu hỏi để xem chi tiết</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
