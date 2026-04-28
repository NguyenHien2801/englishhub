'use client'
import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

interface Message {
  id: string
  vai_tro: 'user' | 'assistant'
  noi_dung: string
  created_at: string
}

const QUICK_PROMPTS = [
  { label: '📖 Giải thích từ', prompt: 'Giải thích từ "persistent" chi tiết cho tôi' },
  { label: '✍️ Chấm Writing', prompt: 'Hãy chấm bài writing này cho tôi theo tiêu chí VSTEP:' },
  { label: '🗣️ Luyện hội thoại', prompt: 'Hãy luyện hội thoại tiếng Anh với tôi về chủ đề phỏng vấn xin việc' },
  { label: '📝 Giải thích ngữ pháp', prompt: 'Giải thích sự khác biệt giữa Present Perfect và Past Simple' },
  { label: '🎯 Ôn tập VSTEP', prompt: 'Cho tôi 5 câu hỏi luyện thi VSTEP B1 phần đọc hiểu' },
  { label: '💼 TOEIC Tips', prompt: 'Cho tôi tips làm bài TOEIC Part 7 hiệu quả' },
]

const CHAT_TYPES = [
  { value: 'general', label: '💬 Tổng quát' },
  { value: 'vocabulary', label: '📚 Từ vựng' },
  { value: 'grammar', label: '📖 Ngữ pháp' },
  { value: 'writing', label: '✍️ Writing' },
]

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatType, setChatType] = useState('general')
  const [sessionId] = useState(`session_${Date.now()}`)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const msg = (text || input).trim()
    if (!msg || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      vai_tro: 'user',
      noi_dung: msg,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-10),
          type: chatType,
          sessionId,
        }),
      })
      const data = await res.json()
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        vai_tro: 'assistant',
        noi_dung: data.response,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch {
      toast.error('Lỗi kết nối AI. Vui lòng thử lại.')
    }
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function formatMessage(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#F8F7F2;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.85em">$1</code>')
      .replace(/\n/g, '<br />')
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">AI Chatbot</h1>
        <p className="text-[#6B6B60] mt-1">Gemini 2.0 Flash — Hỏi bất cứ điều gì về tiếng Anh</p>
      </div>

      {/* Chat type selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {CHAT_TYPES.map(t => (
          <button key={t.value} onClick={() => setChatType(t.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              chatType === t.value
                ? 'bg-[#0D0D0D] text-white'
                : 'bg-white border border-[#E8E8E0] text-[#6B6B60] hover:border-[#0D0D0D]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div className="flex-1 bg-white rounded-2xl border border-[#E8E8E0] overflow-y-auto p-6 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="font-display text-2xl font-bold text-[#0D0D0D] mb-2">Xin chào!</h2>
            <p className="text-[#6B6B60] text-center mb-8 max-w-md">
              Tôi là AI Gemini của EnglishHub. Hỏi tôi bất cứ điều gì về tiếng Anh — từ vựng, ngữ pháp, luyện thi, hay luyện hội thoại!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.prompt)}
                  className="p-3 bg-[#F8F7F2] border border-[#E8E8E0] rounded-xl text-sm text-left hover:border-[#00A878]/50 hover:bg-[#E8FFF8] transition-all">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.vai_tro === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                  msg.vai_tro === 'user'
                    ? 'bg-[#0D0D0D] text-white'
                    : 'bg-[#00A878] text-white'
                }`}>
                  {msg.vai_tro === 'user' ? 'You' : 'AI'}
                </div>
                <div className={`max-w-[75%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                  msg.vai_tro === 'user'
                    ? 'bg-[#0D0D0D] text-white rounded-tr-md'
                    : 'bg-[#F8F7F2] text-[#0D0D0D] rounded-tl-md'
                }`}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.noi_dung) }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#00A878] flex items-center justify-center text-white text-sm font-bold">AI</div>
                <div className="px-5 py-3.5 bg-[#F8F7F2] rounded-2xl rounded-tl-md">
                  <div className="flex gap-1.5 items-center">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-[#00A878] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="bg-white rounded-2xl border border-[#E8E8E0] p-4">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi... (Enter để gửi, Shift+Enter xuống dòng)"
            rows={2}
            className="flex-1 resize-none bg-[#F8F7F2] rounded-xl px-4 py-3 text-sm text-[#0D0D0D] placeholder-[#A0A090] focus:outline-none focus:ring-2 focus:ring-[#00A878]/30"
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="px-5 py-3 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? '...' : '→'}
          </button>
        </div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {QUICK_PROMPTS.slice(0, 3).map((p, i) => (
            <button key={i} onClick={() => sendMessage(p.prompt)}
              className="text-xs px-3 py-1.5 bg-[#F8F7F2] border border-[#E8E8E0] rounded-full text-[#6B6B60] hover:border-[#00A878]/50 transition-colors">
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
