'use client'
import { useState, useMemo } from 'react'

const NAVY = '#0F1C35'
const GOLD = '#C9A84C'

type Msg = Record<string, unknown>

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function ChatbotHistoryClient({ messages }: { messages: Msg[] }) {
  const [search, setSearch] = useState('')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  const sessions = useMemo(() => {
    const map = new Map<string, { phien_id: string; user: Record<string, string> | null; msgs: Msg[]; last: string }>()
    for (const m of messages) {
      const pid = m.phien_id as string
      if (!map.has(pid)) map.set(pid, { phien_id: pid, user: m.NguoiDung as Record<string, string> | null, msgs: [], last: m.created_at as string })
      map.get(pid)!.msgs.push(m)
    }
    return Array.from(map.values()).sort((a, b) => b.last.localeCompare(a.last))
  }, [messages])

  const filteredSessions = useMemo(() => {
    const q = search.toLowerCase()
    return sessions.filter(s => !q || s.user?.ho_ten?.toLowerCase().includes(q) || s.user?.ma_sinh_vien?.toLowerCase().includes(q))
  }, [sessions, search])

  const currentSession = selectedSession ? sessions.find(s => s.phien_id === selectedSession) : null

  return (
    <div className="max-w-7xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
          Lịch sử hội thoại Chatbot
        </h1>
        <p style={{ color: '#6B6B60', fontSize: 14 }}>{sessions.length} phiên · {messages.length} tin nhắn</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Sessions list */}
        <div className="lg:col-span-2 flex flex-col">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã SV..."
            style={{
              padding: '10px 14px', border: '1px solid #E8E8E0', borderRadius: 12, fontSize: 14,
              outline: 'none', marginBottom: 12, fontFamily: "'DM Sans', sans-serif", color: NAVY,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = NAVY }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E8E8E0' }}
          />
          <div className="flex-1 overflow-y-auto pr-1" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredSessions.map(s => {
              const isActive = selectedSession === s.phien_id
              const lastMsg = s.msgs[0]
              return (
                <div key={s.phien_id}
                  onClick={() => setSelectedSession(s.phien_id)}
                  style={{
                    padding: 16, background: '#fff', borderRadius: 14, cursor: 'pointer',
                    border: isActive ? `2px solid ${NAVY}` : '1px solid #E8E8E0',
                    transition: 'all 0.15s',
                    boxShadow: isActive ? `0 0 0 1px ${NAVY}20` : 'none',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = '#C8C8C0' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = '#E8E8E0' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{s.user?.ho_ten || 'Ẩn danh'}</div>
                      <div style={{ fontSize: 12, color: '#A0A090', fontFamily: 'monospace' }}>{s.user?.ma_sinh_vien}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#A0A090' }}>{fmtDate(s.last)}</div>
                      <div style={{ fontSize: 11, color: GOLD, fontWeight: 600, marginTop: 2 }}>{s.msgs.length} tin</div>
                    </div>
                  </div>
                  {lastMsg && (
                    <p style={{ fontSize: 12, color: '#6B6B60', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lastMsg.vai_tro === 'user' ? '👤' : '🤖'} {lastMsg.noi_dung as string}
                    </p>
                  )}
                </div>
              )
            })}
            {filteredSessions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0A090', fontSize: 14 }}>Không có kết quả</div>
            )}
          </div>
        </div>

        {/* Chat detail */}
        <div className="lg:col-span-3" style={{
          background: '#fff', borderRadius: 18, border: '1px solid #E8E8E0',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {currentSession ? (
            <>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid #E8E8E0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>{currentSession.user?.ho_ten || 'Ẩn danh'}</span>
                  <span style={{ fontSize: 13, color: '#6B6B60', marginLeft: 8, fontFamily: 'monospace' }}>{currentSession.user?.ma_sinh_vien}</span>
                </div>
                <span style={{ fontSize: 12, color: '#6B6B60', background: '#F8F7F2', padding: '4px 10px', borderRadius: 8 }}>
                  {currentSession.msgs.length} tin nhắn
                </span>
              </div>
              <div className="flex-1 overflow-y-auto" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...currentSession.msgs].reverse().map(m => (
                  <div key={m.id as string} style={{ display: 'flex', gap: 10, justifyContent: m.vai_tro === 'user' ? 'flex-end' : 'flex-start' }}>
                    {m.vai_tro === 'assistant' && (
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginTop: 2 }}>🤖</div>
                    )}
                    <div style={{
                      maxWidth: '75%', padding: '10px 14px', borderRadius: 16, fontSize: 13, lineHeight: 1.6,
                      background: m.vai_tro === 'user' ? NAVY : '#F8F7F2',
                      color: m.vai_tro === 'user' ? '#fff' : NAVY,
                      borderTopRightRadius: m.vai_tro === 'user' ? 4 : 16,
                      borderTopLeftRadius: m.vai_tro === 'user' ? 16 : 4,
                    }}>
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{m.noi_dung as string}</p>
                      <div style={{ fontSize: 11, marginTop: 4, color: m.vai_tro === 'user' ? 'rgba(255,255,255,0.5)' : '#A0A090' }}>
                        {fmtDate(m.created_at as string)}{m.loai_ngucan ? ` · ${String(m.loai_ngucan)}` : null}
                      </div>
                    </div>
                    {m.vai_tro === 'user' && (
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E8E8E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, marginTop: 2 }}>👤</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#A0A090' }}>
              <div style={{ fontSize: 48 }}>💬</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Chọn phiên hội thoại để xem</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
