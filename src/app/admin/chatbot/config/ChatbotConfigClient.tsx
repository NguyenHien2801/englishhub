'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type CacheEntry = Record<string, unknown>

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function isExpired(d: string) { return new Date(d) < new Date() }

export default function ChatbotConfigClient() {
  const [cache, setCache] = useState<CacheEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CacheEntry | null>(null)
  const [stats, setStats] = useState({ total: 0, expired: 0, hits: 0 })
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('BoDemAI')
        .select('*')
        .order('so_lan_dung', { ascending: false })
        .limit(200)
      setCache(data || [])
      const entries = data || []
      setStats({
        total: entries.length,
        expired: entries.filter(e => isExpired(e.het_han_luc as string)).length,
        hits: entries.reduce((a, e) => a + (e.so_lan_dung as number), 0),
      })
      setLoading(false)
    }
    load()
  }, [])

  async function deleteEntry(id: string) {
    if (!confirm('Xóa cache này?')) return
    const { error } = await supabase.from('BoDemAI').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setCache(prev => prev.filter(e => e.id !== id))
    if (selected?.id === id) setSelected(null)
    toast.success('Đã xóa cache')
  }

  async function clearExpired() {
    if (!confirm('Xóa tất cả cache hết hạn?')) return
    const { error } = await supabase.from('BoDemAI').delete().lt('het_han_luc', new Date().toISOString())
    if (error) { toast.error(error.message); return }
    const newCache = cache.filter(e => !isExpired(e.het_han_luc as string))
    setCache(newCache)
    setStats(prev => ({ ...prev, total: newCache.length, expired: 0 }))
    toast.success('Đã xóa cache hết hạn')
  }

  const filtered = cache.filter(e =>
    !search || (e.noi_dung_cau_hoi as string).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Cấu hình Chatbot AI</h1>
        <p className="text-[#6B6B60] mt-1">Quản lý bộ đệm (cache) phản hồi AI</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng cache', value: stats.total, icon: '🗄️', color: 'text-[#0D0D0D]' },
          { label: 'Đã hết hạn', value: stats.expired, icon: '⏰', color: 'text-[#FF6B6B]' },
          { label: 'Tổng lượt dùng', value: stats.hits, icon: '⚡', color: 'text-[#00A878]' },
          { label: 'Còn hiệu lực', value: stats.total - stats.expired, icon: '✅', color: 'text-[#00A878]' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E8E8E0] p-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-[#A0A090] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Actions + search */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo nội dung câu hỏi..."
          className="px-3 py-2 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] flex-1 min-w-52" />
        {stats.expired > 0 && (
          <button onClick={clearExpired}
            className="px-4 py-2 bg-[#FFF0F0] text-[#FF6B6B] font-semibold rounded-xl hover:bg-[#FFE0E0] transition-colors text-sm">
            🗑 Xóa {stats.expired} cache hết hạn
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-12 text-[#A0A090]">Đang tải...</div>
          ) : filtered.map(e => {
            const expired = isExpired(e.het_han_luc as string)
            return (
              <div key={e.id as string}
                onClick={() => setSelected(e)}
                className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${selected?.id === e.id ? 'border-[#00A878]' : 'border-[#E8E8E0]'} ${expired ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm text-[#0D0D0D] line-clamp-2 flex-1">{e.noi_dung_cau_hoi as string}</p>
                  <button onClick={ev => { ev.stopPropagation(); deleteEntry(e.id as string) }}
                    className="text-[#FF6B6B] text-xs hover:bg-[#FFF0F0] px-1.5 py-0.5 rounded flex-shrink-0">✕</button>
                </div>
                <div className="flex items-center justify-between text-xs text-[#A0A090]">
                  <span>{e.so_lan_dung as number} lần dùng</span>
                  <span className={expired ? 'text-[#FF6B6B]' : 'text-[#00A878]'}>
                    {expired ? '⏰ Hết hạn' : '✓ Còn hạn'}
                  </span>
                </div>
              </div>
            )
          })}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-[#A0A090] text-sm">Không có kết quả</div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#0D0D0D]">Chi tiết cache</h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`px-2 py-1 rounded-lg font-medium ${isExpired(selected.het_han_luc as string) ? 'bg-[#FFF0F0] text-[#FF6B6B]' : 'bg-[#E8FFF8] text-[#00A878]'}`}>
                    {isExpired(selected.het_han_luc as string) ? 'Hết hạn' : 'Còn hiệu lực'}
                  </span>
                  <span className="px-2 py-1 bg-[#F8F7F2] text-[#6B6B60] rounded-lg">{selected.so_lan_dung as number} lượt</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-2">Câu hỏi</div>
                  <div className="p-3 bg-[#F8F7F2] rounded-xl text-sm text-[#0D0D0D] leading-relaxed">
                    {selected.noi_dung_cau_hoi as string}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-2">Phản hồi AI</div>
                  <div className="p-3 bg-[#E8FFF8] rounded-xl text-sm text-[#0D0D0D] leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {selected.cau_tra_loi_ai as string}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: 'Nguồn AI', value: (selected.loai_ngucan_ai as string) || '–' },
                    { label: 'Tạo lúc', value: fmtDate(selected.created_at as string) },
                    { label: 'Hết hạn', value: fmtDate(selected.het_han_luc as string) },
                    { label: 'Hash', value: (selected.ma_hash_prompt as string).slice(0, 16) + '…' },
                  ].map(s => (
                    <div key={s.label} className="p-2.5 bg-[#F8F7F2] rounded-xl">
                      <div className="text-[#A0A090] mb-0.5">{s.label}</div>
                      <div className="font-medium text-[#0D0D0D] font-mono">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-12 text-center text-[#A0A090]">
              <div className="text-5xl mb-3">🗄️</div>
              <div className="font-medium">Chọn cache để xem nội dung</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
