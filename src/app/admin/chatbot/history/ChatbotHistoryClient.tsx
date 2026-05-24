'use client'
import { useState, useMemo } from 'react'

type Msg = Record<string, unknown>

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function ChatbotHistoryClient({ messages }: { messages: Msg[] }) {
  const [search, setSearch] = useState('')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  // Nhóm theo phiên
  const sessions = useMemo(() => {
    const map = new Map<string, { phien_id: string; user: Record<string, string> | null; msgs: Msg[]; last: string }>()
    for (const m of messages) {
      const pid = m.phien_id as string
      if (!map.has(pid)) {
        map.set(pid, { phien_id: pid, user: m.NguoiDung as Record<string, string> | null, msgs: [], last: m.created_at as string })
      }
      map.get(pid)!.msgs.push(m)
    }
    return Array.from(map.values()).sort((a, b) => b.last.localeCompare(a.last))
  }, [messages])

  const filteredSessions = useMemo(() => {
    const q = search.toLowerCase()
    return sessions.filter(s =>
      !q || s.user?.ho_ten?.toLowerCase().includes(q) || s.user?.ma_sinh_vien?.toLowerCase().includes(q)
    )
  }, [sessions, search])

  const currentSession = selectedSession ? sessions.find(s => s.phien_id === selectedSession) : null

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Lịch sử hội thoại Chatbot</h1>
        <p className="text-[#6B6B60] mt-1">{sessions.length} phiên · {messages.length} tin nhắn</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Sessions list */}
        <div className="lg:col-span-2 flex flex-col">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã SV..."
            className="px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] mb-3" />
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredSessions.map(s => {
              const lastMsg = s.msgs[0]
              return (
                <div key={s.phien_id}
                  onClick={() => setSelectedSession(s.phien_id)}
                  className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${selectedSession === s.phien_id ? 'border-[#00A878]' : 'border-[#E8E8E0]'}`}>
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <div className="font-semibold text-sm text-[#0D0D0D]">{s.user?.ho_ten || 'Ẩn danh'}</div>
                      <div className="text-xs text-[#A0A090] font-mono">{s.user?.ma_sinh_vien}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#A0A090]">{fmtDate(s.last)}</div>
                      <div className="text-xs text-[#00A878] mt-0.5">{s.msgs.length} tin</div>
                    </div>
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-[#6B6B60] line-clamp-1">
                      {lastMsg.vai_tro === 'user' ? '👤' : '🤖'} {lastMsg.noi_dung as string}
                    </p>
                  )}
                </div>
              )
            })}
            {filteredSessions.length === 0 && (
              <div className="text-center py-12 text-[#A0A090] text-sm">Không có kết quả</div>
            )}
          </div>
        </div>

        {/* Chat detail */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E8E8E0] flex flex-col overflow-hidden">
          {currentSession ? (
            <>
              <div className="px-5 py-4 border-b border-[#E8E8E0] flex items-center justify-between flex-shrink-0">
                <div>
                  <span className="font-semibold text-[#0D0D0D]">{currentSession.user?.ho_ten || 'Ẩn danh'}</span>
                  <span className="text-sm text-[#6B6B60] ml-2 font-mono">{currentSession.user?.ma_sinh_vien}</span>
                </div>
                <span className="text-xs text-[#A0A090] bg-[#F8F7F2] px-2 py-1 rounded-lg">
                  {currentSession.msgs.length} tin nhắn
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {[...currentSession.msgs].reverse().map(m => (
                  <div key={m.id as string} className={`flex gap-2.5 ${m.vai_tro === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.vai_tro === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-[#0F1C35] flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">🤖</div>
                    )}
                    <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.vai_tro === 'user'
                        ? 'bg-[#0F1C35] text-white rounded-tr-sm'
                        : 'bg-[#F8F7F2] text-[#0D0D0D] rounded-tl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.noi_dung as string}</p>
                      <div className={`text-xs mt-1 ${m.vai_tro === 'user' ? 'text-white/50' : 'text-[#A0A090]'}`}>
                        {fmtDate(m.created_at as string)}
                        {m.loai_ngucan ? ` · ${String(m.loai_ngucan)}` : null}
                      </div>
                    </div>
                    {m.vai_tro === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-[#E8E8E0] flex items-center justify-center text-xs flex-shrink-0 mt-0.5">👤</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#A0A090] flex-col gap-3">
              <div className="text-5xl">💬</div>
              <div className="font-medium">Chọn phiên hội thoại để xem</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
