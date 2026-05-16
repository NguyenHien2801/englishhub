'use client'
import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  BookOpen, PenLine, MessageSquare, Brain,
  Target, Briefcase, Send, RefreshCw,
  Sparkles, Bot, User, ChevronRight,
} from 'lucide-react'

// ── Design tokens — mirror Dashboard ─────────────────────────────────────────
const C = {
  bg:       '#F8F5EE',
  white:    '#FFFFFF',
  navy:     '#0F1C35',
  navyMid:  '#1E2F50',
  gold:     '#C9A84C',
  goldLt:   '#E8C97A',
  goldPale: '#FDF8EE',
  green:    '#00A878',
  greenLt:  '#4ECBA8',
  blueLt:   '#4299E1',
  violet:   '#6478F0',
  rose:     '#F06464',
  slate:    '#64748B',
  border:   'rgba(201,168,76,0.18)',
  borderMd: 'rgba(201,168,76,0.30)',
  text:     '#1A1E2E',
  textMid:  '#4A5568',
  textLt:   '#94A3B8',
}

// ── Data ──────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  vai_tro: 'user' | 'assistant'
  noi_dung: string
  created_at: string
}

const CHAT_TYPES = [
  { value: 'general',    label: 'Tổng quát',    Icon: MessageSquare, color: C.navy    },
  { value: 'vocabulary', label: 'Từ vựng',       Icon: BookOpen,      color: C.blueLt  },
  { value: 'grammar',    label: 'Ngữ pháp',      Icon: Brain,         color: C.violet  },
  { value: 'writing',    label: 'Writing',        Icon: PenLine,       color: C.gold    },
]

const QUICK_PROMPTS = [
  { Icon: BookOpen,     label: 'Giải thích từ',    prompt: 'Giải thích từ "persistent" chi tiết cho tôi',                         color: C.blueLt  },
  { Icon: PenLine,      label: 'Chấm Writing',     prompt: 'Hãy chấm bài writing này cho tôi theo tiêu chí VSTEP:',              color: C.gold    },
  { Icon: MessageSquare,label: 'Luyện hội thoại',  prompt: 'Hãy luyện hội thoại tiếng Anh với tôi về chủ đề phỏng vấn xin việc', color: C.green   },
  { Icon: Brain,        label: 'Giải thích ngữ pháp', prompt: 'Giải thích sự khác biệt giữa Present Perfect và Past Simple',    color: C.violet  },
  { Icon: Target,       label: 'Ôn tập VSTEP',     prompt: 'Cho tôi 5 câu hỏi luyện thi VSTEP B1 phần đọc hiểu',                color: C.greenLt },
  { Icon: Briefcase,    label: 'TOEIC Tips',        prompt: 'Cho tôi tips làm bài TOEIC Part 7 hiệu quả',                        color: C.rose    },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatMessage(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, `<code style="background:${C.goldPale};padding:2px 7px;border-radius:5px;font-family:monospace;font-size:0.83em;border:1px solid rgba(201,168,76,.2)">$1</code>`)
    .replace(/\n/g, '<br />')
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AIChatPage() {
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [chatType, setChatType]   = useState('general')
  const [sessionId]               = useState(`session_${Date.now()}`)
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const textareaRef               = useRef<HTMLTextAreaElement>(null)

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

  const activeType = CHAT_TYPES.find(t => t.value === chatType)!

  return (
    <div style={{
      background: C.bg,
      minHeight: '100vh',
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Google Fonts */}
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes spin    { from { transform: rotate(0deg) }   to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0;transform:translateY(14px) } to { opacity:1;transform:translateY(0) } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes blink   { 0%,100%{opacity:.25} 50%{opacity:1} }
        ::-webkit-scrollbar       { width:4px; height:4px }
        ::-webkit-scrollbar-thumb { background:rgba(201,168,76,.25); border-radius:4px }
        .msg-bubble { animation: fadeUp .32s cubic-bezier(.16,1,.3,1) both }
        .quick-btn:hover { transform: translateY(-2px) !important; }
        .type-btn:hover  { border-color: rgba(201,168,76,.45) !important; }
        textarea:focus   { outline: none; }
      `}} />

      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: 'clamp(16px,3vw,32px)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        boxSizing: 'border-box',
      }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 20, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(22px,2.5vw,30px)',
                fontWeight: 900,
                color: C.navy,
                margin: 0,
                letterSpacing: '-0.3px',
              }}>
                AI Chatbot
              </h1>
              <p style={{ fontSize: 15, color: C.textLt, marginTop: 4, fontWeight: 400 }}>
                Gemini 2.0 Flash — Hỏi bất cứ điều gì về tiếng Anh
              </p>
            </div>

            {/* Message count badge */}
            {messages.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px',
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 50,
                fontSize: 15, color: C.textMid,
                boxShadow: '0 2px 8px rgba(15,28,53,.06)',
              }}>
                <MessageSquare size={14} color={C.gold} />
                {messages.length} tin nhắn
                <button
                  onClick={() => setMessages([])}
                  title="Xoá hội thoại"
                  style={{
                    marginLeft: 4, background: 'none', border: 'none',
                    cursor: 'pointer', color: C.textLt, display: 'flex', alignItems: 'center',
                    padding: 2, borderRadius: 4,
                    transition: 'color .2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.rose)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.textLt)}
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            )}
          </div>

          {/* ── Chat type tabs ── */}
          <div style={{
            display: 'flex', gap: 6, marginTop: 16,
            flexWrap: 'wrap',
          }}>
            {CHAT_TYPES.map(t => {
              const active = chatType === t.value
              return (
                <button
                  key={t.value}
                  className="type-btn"
                  onClick={() => setChatType(t.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 16px',
                    borderRadius: 50,
                    border: `1px solid ${active ? t.color : C.border}`,
                    background: active ? `${t.color}12` : C.white,
                    color: active ? t.color : C.textMid,
                    fontSize: 15, fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all .22s cubic-bezier(.16,1,.3,1)',
                    boxShadow: active ? `0 2px 10px ${t.color}20` : '0 1px 4px rgba(15,28,53,.06)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <t.Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Messages area ── */}
        <div style={{
          flex: 1,
          background: C.white,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          boxShadow: '0 2px 12px rgba(15,28,53,.07)',
          overflowY: 'auto',
          padding: '24px',
          marginBottom: 12,
          display: 'flex',
          flexDirection: 'column',
        }}>

          {messages.length === 0 ? (
            /* ── Empty state ── */
            <div style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              animation: 'fadeIn .4s ease both',
            }}>
              {/* Icon */}
              <div style={{
                width: 72, height: 72, borderRadius: 22,
                background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
                boxShadow: `0 8px 32px rgba(15,28,53,.22)`,
                position: 'relative',
              }}>
                <Bot size={34} color={C.gold} strokeWidth={1.6} />
                <div style={{
                  position: 'absolute', bottom: -4, right: -4,
                  width: 22, height: 22, borderRadius: 8,
                  background: C.gold,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${C.white}`,
                }}>
                  <Sparkles size={10} color={C.navy} />
                </div>
              </div>

              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22, fontWeight: 800,
                color: C.navy, margin: '0 0 8px',
              }}>
                Xin chào!
              </h2>
              <p style={{
                fontSize: 16, color: C.textMid,
                textAlign: 'center', maxWidth: 400,
                lineHeight: 1.7, marginBottom: 28,
              }}>
                Tôi là AI Gemini của EnglishHub. Hỏi tôi bất cứ điều gì về tiếng Anh — từ vựng, ngữ pháp, luyện thi, hay luyện hội thoại!
              </p>

              {/* Quick prompt grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 10, width: '100%', maxWidth: 640,
              }}>
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    className="quick-btn"
                    onClick={() => sendMessage(p.prompt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px',
                      background: C.white,
                      border: `1px solid ${C.border}`,
                      borderRadius: 14,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                      boxShadow: '0 1px 4px rgba(15,28,53,.06)',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget
                      el.style.borderColor = `${p.color}40`
                      el.style.background = `${p.color}08`
                      el.style.boxShadow = `0 4px 16px ${p.color}18`
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget
                      el.style.borderColor = C.border
                      el.style.background = C.white
                      el.style.boxShadow = '0 1px 4px rgba(15,28,53,.06)'
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: `${p.color}12`,
                      border: `1px solid ${p.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <p.Icon size={16} color={p.color} strokeWidth={1.8} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.navy, lineHeight: 1.4 }}>
                      {p.label}
                    </span>
                    <ChevronRight size={13} color={C.textLt} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>

          ) : (
            /* ── Message list ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map((msg, idx) => {
                const isUser = msg.vai_tro === 'user'
                return (
                  <div
                    key={msg.id}
                    className="msg-bubble"
                    style={{
                      display: 'flex',
                      gap: 10,
                      flexDirection: isUser ? 'row-reverse' : 'row',
                      animationDelay: `${Math.min(idx * 30, 120)}ms`,
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 12,
                      flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isUser
                        ? `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`
                        : `linear-gradient(135deg, ${C.green} 0%, #007A58 100%)`,
                      boxShadow: isUser
                        ? '0 3px 10px rgba(15,28,53,.25)'
                        : '0 3px 10px rgba(0,168,120,.25)',
                    }}>
                      {isUser
                        ? <User size={16} color="#fff" strokeWidth={2} />
                        : <Bot  size={16} color="#fff" strokeWidth={1.8} />
                      }
                    </div>

                    {/* Bubble */}
                    <div style={{
                      maxWidth: '72%',
                      padding: '13px 18px',
                      borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                      fontSize: 16,
                      lineHeight: 1.75,
                      fontFamily: "'DM Sans', sans-serif",
                      ...(isUser ? {
                        background: C.navy,
                        color: '#fff',
                        boxShadow: '0 3px 12px rgba(15,28,53,.18)',
                      } : {
                        background: C.white,
                        color: C.text,
                        border: `1px solid ${C.border}`,
                        boxShadow: '0 2px 8px rgba(15,28,53,.06)',
                      }),
                    }}
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.noi_dung) }}
                    />
                  </div>
                )
              })}

              {/* Loading dots */}
              {loading && (
                <div className="msg-bubble" style={{ display: 'flex', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, ${C.green} 0%, #007A58 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 3px 10px rgba(0,168,120,.25)',
                  }}>
                    <Bot size={16} color="#fff" strokeWidth={1.8} />
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: C.white,
                    border: `1px solid ${C.border}`,
                    borderRadius: '4px 18px 18px 18px',
                    boxShadow: '0 2px 8px rgba(15,28,53,.06)',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: C.green,
                        animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── Input area ── */}
        <div style={{
          background: C.white,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          boxShadow: '0 2px 12px rgba(15,28,53,.07)',
          padding: '14px 16px',
          flexShrink: 0,
        }}>
          {/* Active type indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 10,
            fontSize: 14, color: C.textLt,
            fontWeight: 500,
          }}>
            <activeType.Icon size={12} color={activeType.color} strokeWidth={2} />
            <span style={{ color: activeType.color, fontWeight: 700 }}>Chế độ: {activeType.label}</span>
            <span style={{ margin: '0 4px', opacity: .4 }}>·</span>
            <span>Enter gửi · Shift+Enter xuống dòng</span>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi của bạn..."
              rows={2}
              style={{
                flex: 1,
                resize: 'none',
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '10px 14px',
                fontSize: 16,
                color: C.text,
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.6,
                transition: 'border-color .2s',
              }}
              onFocus={e => (e.target.style.borderColor = C.gold)}
              onBlur={e  => (e.target.style.borderColor = C.border)}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 46, height: 46,
                borderRadius: 14,
                border: 'none',
                background: loading || !input.trim()
                  ? `rgba(201,168,76,.15)`
                  : `linear-gradient(135deg, ${C.gold} 0%, #A8841C 100%)`,
                color: loading || !input.trim() ? C.textLt : C.navy,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                boxShadow: loading || !input.trim()
                  ? 'none'
                  : '0 4px 14px rgba(201,168,76,.35)',
                flexShrink: 0,
              }}
            >
              {loading
                ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                : <Send size={18} strokeWidth={2} />
              }
            </button>
          </div>

          {/* Quick chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {QUICK_PROMPTS.slice(0, 4).map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p.prompt)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px',
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  borderRadius: 50,
                  fontSize: 13, color: C.textMid,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all .2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${p.color}45`
                  e.currentTarget.style.color = p.color
                  e.currentTarget.style.background = `${p.color}08`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.border
                  e.currentTarget.style.color = C.textMid
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <p.Icon size={11} strokeWidth={2} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}