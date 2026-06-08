'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const NAVY = '#0F1C35'
const GOLD = '#C9A84C'

type CacheEntry = Record<string, unknown>

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function isExpired(d: string) { return new Date(d) < new Date() }

const card: React.CSSProperties = { background: '#fff', border: '1px solid #E8E8E0', borderRadius: 18, padding: 20 }

export default function ChatbotConfigClient() {
  const [cache, setCache] = useState<CacheEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CacheEntry | null>(null)
  const [stats, setStats] = useState({ total: 0, expired: 0, hits: 0 })
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('BoDemAI').select('*').order('so_lan_dung', { ascending: false }).limit(200)
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

  const filtered = cache.filter(e => !search || (e.noi_dung_cau_hoi as string).toLowerCase().includes(search.toLowerCase()))

  const KPI = [
    { label: 'Tổng cache',     value: stats.total,              icon: '🗄️', accent: NAVY },
    { label: 'Đã hết hạn',     value: stats.expired,            icon: '⏰', accent: '#ef4444' },
    { label: 'Tổng lượt dùng', value: stats.hits,               icon: '⚡', accent: GOLD },
    { label: 'Còn hiệu lực',   value: stats.total - stats.expired, icon: '✅', accent: '#10b981' },
  ]

  return (
    <div className="max-w-7xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
          Cấu hình Chatbot AI
        </h1>
        <p style={{ color: '#6B6B60', fontSize: 14 }}>Quản lý bộ đệm (cache) phản hồi AI</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPI.map(k => (
          <div key={k.label} style={{ ...card, borderTop: `3px solid ${k.accent}`, padding: '18px 20px' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.accent, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#6B6B60', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo nội dung câu hỏi..."
          style={{
            flex: 1, minWidth: 200, padding: '10px 14px', border: '1px solid #E8E8E0',
            borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif", color: NAVY,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = NAVY }}
          onBlur={e => { e.currentTarget.style.borderColor = '#E8E8E0' }}
        />
        {stats.expired > 0 && (
          <button onClick={clearExpired} style={{
            padding: '10px 16px', background: '#fee2e2', color: '#991b1b',
            border: '1px solid #fca5a5', borderRadius: 12, fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            🗑 Xóa {stats.expired} cache hết hạn
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {loading && <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0A090' }}>Đang tải...</div>}
          {!loading && filtered.map(e => {
            const expired = isExpired(e.het_han_luc as string)
            const isActive = selected?.id === e.id
            return (
              <div key={e.id as string}
                onClick={() => setSelected(e)}
                style={{
                  padding: 14, background: '#fff', borderRadius: 14, cursor: 'pointer',
                  border: isActive ? `2px solid ${NAVY}` : '1px solid #E8E8E0',
                  opacity: expired ? 0.5 : 1, transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <p style={{ flex: 1, fontSize: 13, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {e.noi_dung_cau_hoi as string}
                  </p>
                  <button onClick={ev => { ev.stopPropagation(); deleteEntry(e.id as string) }}
                    style={{ color: '#ef4444', fontSize: 11, padding: '2px 6px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#A0A090' }}>
                  <span>{e.so_lan_dung as number} lần dùng</span>
                  <span style={{ color: expired ? '#ef4444' : '#10b981', fontWeight: 600 }}>{expired ? '⏰ Hết hạn' : '✓ Còn hạn'}</span>
                </div>
              </div>
            )
          })}
          {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0A090', fontSize: 14 }}>Không có kết quả</div>}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div style={{ ...card, position: 'sticky', top: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #E8E8E0' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>Chi tiết cache</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: isExpired(selected.het_han_luc as string) ? '#fee2e2' : '#d1fae5',
                    color: isExpired(selected.het_han_luc as string) ? '#991b1b' : '#065f46',
                  }}>
                    {isExpired(selected.het_han_luc as string) ? 'Hết hạn' : 'Còn hiệu lực'}
                  </span>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: '#F8F7F2', color: '#6B6B60' }}>{selected.so_lan_dung as number} lượt</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Câu hỏi', value: selected.noi_dung_cau_hoi as string, mono: false, bg: '#F8F7F2', maxH: 'none' },
                  { label: 'Phản hồi AI', value: selected.cau_tra_loi_ai as string, mono: false, bg: '#f0fdf4', maxH: '240px' },
                ].map(({ label, value, bg, maxH }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
                    <div style={{ padding: 12, background: bg, borderRadius: 12, fontSize: 13, color: NAVY, lineHeight: 1.7, maxHeight: maxH, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{value}</div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Nguồn AI', value: (selected.loai_ngucan_ai as string) || '–' },
                    { label: 'Tạo lúc',  value: fmtDate(selected.created_at as string) },
                    { label: 'Hết hạn',  value: fmtDate(selected.het_han_luc as string) },
                    { label: 'Hash',     value: (selected.ma_hash_prompt as string).slice(0, 16) + '…' },
                  ].map(s => (
                    <div key={s.label} style={{ padding: 12, background: '#F8F7F2', borderRadius: 12 }}>
                      <div style={{ fontSize: 11, color: '#A0A090', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, fontFamily: 'monospace' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...card, padding: 48, textAlign: 'center', color: '#A0A090' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗄️</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Chọn cache để xem nội dung</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
