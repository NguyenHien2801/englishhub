'use client'
import { useState, useRef, useEffect } from 'react'
import {
  X, Send, RefreshCw, Bot, User,
  Minimize2, Maximize2, BookOpen, Brain,
  PenLine, Sparkles,
} from 'lucide-react'

const C = {
  bg:       '#F8F5EE',
  white:    '#FFFFFF',
  navy:     '#0F1C35',
  navyMid:  '#1E2F50',
  gold:     '#C9A84C',
  goldPale: '#FDF8EE',
  green:    '#00A878',
  rose:     '#F06464',
  border:   'rgba(201,168,76,0.18)',
  text:     '#1A1E2E',
  textMid:  '#4A5568',
  textLt:   '#94A3B8',
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  time: string
}

const QUICK = [
  { label: '📖 Giải thích từ này',   prompt: 'Giải thích từ vựng này cho tôi: '  },
  { label: '🧠 Giải thích ngữ pháp', prompt: 'Giải thích ngữ pháp này cho tôi: ' },
  { label: '✍️ Sửa câu này',         prompt: 'Hãy sửa và giải thích câu sau: '    },
  { label: '🎯 Gợi ý đáp án',        prompt: 'Gợi ý hướng làm bài cho câu: '      },
]

function fmt(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, `<code style="background:${C.goldPale};padding:1px 6px;border-radius:4px;font-family:monospace;font-size:0.85em;border:1px solid rgba(201,168,76,.2);color:${C.navy}">$1</code>`)
    .replace(/\n/g, '<br />')
}

export default function AIFloatingChat() {
  const [open, setOpen]         = useState(false)
  const [mini, setMini]         = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [unread, setUnread]     = useState(0)
  const [sessionId]             = useState(`float_${Date.now()}`)
  const [hovered, setHovered]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const inputRef                = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open])
  useEffect(() => { if (open) { setUnread(0); inputRef.current?.focus() } }, [open])
  useEffect(() => {
    const ta = inputRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 100) + 'px'
  }, [input])

  async function send(text?: string) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    const userMsg: Message = {
      id: Date.now().toString(), role: 'user', text: msg,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res  = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages.slice(-8).map(m => ({ vai_tro: m.role === 'user' ? 'user' : 'assistant', noi_dung: m.text })), type: 'general', sessionId }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', text: data.response, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }])
      if (!open) setUnread(u => u + 1)
    } catch {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', text: 'Lỗi kết nối. Vui lòng thử lại!', time: '' }])
    }
    setLoading(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const panelW = mini ? 320 : 380
  const panelH = mini ? 480 : 560

  return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { from{opacity:0;transform:scale(.88) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes blink  { 0%,100%{opacity:.2} 50%{opacity:1} }
        @keyframes glow   { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,.55),0 6px 24px rgba(15,28,53,.3)} 60%{box-shadow:0 0 0 9px rgba(201,168,76,0),0 6px 24px rgba(15,28,53,.3)} }

        .float-panel { animation: popIn .3s cubic-bezier(.16,1,.3,1) both }
        .float-msg   { animation: fadeUp .22s cubic-bezier(.16,1,.3,1) both }

        /* Trigger button — circle mặc định, pill khi hover */
        .float-trigger {
          display: flex;
          align-items: center;
          overflow: hidden;
          width: 52px;
          height: 52px;
          border-radius: 50px;
          padding: 0 6px;
          border: 1.5px solid rgba(201,168,76,.35);
          background: linear-gradient(135deg, #0F1C35 0%, #1E2F50 100%);
          cursor: pointer;
          animation: glow 2.8s ease-in-out infinite;
          transition: width .32s cubic-bezier(.34,1.56,.64,1), padding .32s cubic-bezier(.34,1.56,.64,1), border-radius .32s ease, box-shadow .2s ease;
          white-space: nowrap;
          position: relative;
        }
        .float-trigger:hover {
          width: 172px;
          padding: 0 16px 0 6px;
          border-radius: 50px;
          box-shadow: 0 12px 32px rgba(201,168,76,.48) !important;
          animation: none;
        }
        .float-trigger-label {
          opacity: 0;
          max-width: 0;
          overflow: hidden;
          transition: opacity .22s ease .08s, max-width .32s cubic-bezier(.34,1.56,.64,1);
          display: flex; flex-direction: column; align-items: flex-start;
          margin-left: 0;
        }
        .float-trigger:hover .float-trigger-label {
          opacity: 1;
          max-width: 110px;
          margin-left: 10px;
        }

        .float-chip:hover { background:rgba(201,168,76,.1) !important; border-color:rgba(201,168,76,.4) !important; color:${C.navy} !important }
        .float-send:not(:disabled):hover { transform:scale(1.07); box-shadow:0 6px 20px rgba(201,168,76,.4) !important }
        textarea { resize:none; outline:none; border:none; background:transparent; font-family:"DM Sans",sans-serif; font-size:15px; color:${C.text}; line-height:1.6; width:100% }
        textarea::placeholder { color:${C.textLt} }
        ::-webkit-scrollbar { width:3px }
        ::-webkit-scrollbar-thumb { background:rgba(201,168,76,.22); border-radius:4px }
      `}} />

      <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>

        {/* ── Trigger button: circle → pill on hover ── */}
        {!open && (
          <button
            className="float-trigger"
            onClick={() => setOpen(true)}
          >
            {/* Avatar circle */}
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(201,168,76,.12)',
              border: '1.5px solid rgba(201,168,76,.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <Sparkles size={18} color={C.gold} strokeWidth={1.8} />
              {/* Online dot */}
              <div style={{
                position: 'absolute', bottom: 1, right: 1,
                width: 9, height: 9, borderRadius: '50%',
                background: C.green, border: `2px solid ${C.navy}`,
              }} />
            </div>

            {/* Label — ẩn mặc định, hiện khi hover */}
            <div className="float-trigger-label">
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'DM Sans',sans-serif", lineHeight: 1.2 }}>Chatbot</span>
            </div>

            {/* Unread badge */}
            {unread > 0 && (
              <div style={{
                position: 'absolute', top: -5, right: -5,
                minWidth: 19, height: 19, borderRadius: 10,
                background: C.rose, color: '#fff',
                fontSize: 11, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', fontFamily: "'DM Sans',sans-serif",
                border: `2px solid ${C.white}`,
              }}>{unread}</div>
            )}
          </button>
        )}

        {/* Close button khi panel mở */}
        {open && (
          <button onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              height: 44, padding: '0 18px', borderRadius: 50,
              border: '1.5px solid rgba(240,100,100,.28)',
              background: 'rgba(240,100,100,.07)',
              color: C.rose, cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
              fontFamily: "'DM Sans',sans-serif",
              transition: 'all .2s',
              boxShadow: '0 4px 14px rgba(240,100,100,.12)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,100,100,.14)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(240,100,100,.07)' }}
          >
            <X size={15} strokeWidth={2.5} /> Đóng
          </button>
        )}

        {/* ── Chat panel ── */}
        {open && (
          <div className="float-panel" style={{
            width: panelW, height: panelH,
            background: C.white, borderRadius: 22,
            border: `1px solid ${C.border}`,
            boxShadow: '0 24px 64px rgba(15,28,53,.22), 0 4px 16px rgba(15,28,53,.1)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', fontFamily: "'DM Sans',sans-serif",
            transition: 'width .22s, height .22s',
          }}>

            {/* Header */}
            <div style={{ background: `linear-gradient(135deg,${C.navy} 0%,${C.navyMid} 100%)`, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={18} color={C.gold} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>AI Gemini</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>Trực tuyến · EnglishHub</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setMini(m => !m)}
                  style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)' }}>
                  {mini ? <Maximize2 size={13}/> : <Minimize2 size={13}/>}
                </button>
                {messages.length > 0 && (
                  <button onClick={() => setMessages([])}
                    style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,100,100,.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)' }}>
                    <RefreshCw size={12}/>
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px' }}>
              {messages.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 15, background: `${C.gold}12`, border: `1px solid ${C.gold}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Sparkles size={22} color={C.gold} strokeWidth={1.6}/>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, textAlign: 'center', fontFamily: "'Playfair Display',serif", marginBottom: 6 }}>Hỏi gì cũng được!</div>
                  <div style={{ fontSize: 14, color: C.textMid, textAlign: 'center', lineHeight: 1.6, marginBottom: 14 }}>Đang làm bài mà vướng chỗ nào?<br/>Hỏi mình ngay nhé 👇</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
                    {QUICK.map((q, i) => (
                      <button key={i} className="float-chip" onClick={() => send(q.prompt)}
                        style={{ padding: '9px 13px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 11, fontSize: 14, color: C.textMid, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .16s' }}>
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user'
                    return (
                      <div key={msg.id} className="float-msg"
                        style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', animationDelay: `${Math.min(idx*15,60)}ms` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexDirection: isUser ? 'row-reverse' : 'row' }}>
                          <div style={{ width: 22, height: 22, borderRadius: 7, background: isUser ? `linear-gradient(135deg,${C.navy},${C.navyMid})` : `linear-gradient(135deg,${C.green},#007A58)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isUser ? <User size={11} color="#fff" strokeWidth={2.5}/> : <Bot size={11} color="#fff" strokeWidth={2}/>}
                          </div>
                          <span style={{ fontSize: 12, color: C.textLt }}>{msg.time}</span>
                        </div>
                        <div style={{ maxWidth: '86%', padding: '10px 14px', borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px', fontSize: 15, lineHeight: 1.7, fontFamily: "'DM Sans',sans-serif", ...(isUser ? { background: C.navy, color: '#fff', boxShadow: '0 3px 10px rgba(15,28,53,.18)' } : { background: C.bg, color: C.text, border: `1px solid ${C.border}` }) }}
                          dangerouslySetInnerHTML={{ __html: fmt(msg.text) }}
                        />
                      </div>
                    )
                  })}
                  {loading && (
                    <div className="float-msg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 7, background: `linear-gradient(135deg,${C.green},#007A58)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Bot size={11} color="#fff" strokeWidth={2}/>
                        </div>
                        <span style={{ fontSize: 12, color: C.textLt }}>đang soạn...</span>
                      </div>
                      <div style={{ padding: '10px 16px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '4px 16px 16px 16px', display: 'flex', gap: 5 }}>
                        {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, animation: `blink 1.2s ease-in-out ${i*.2}s infinite` }}/>)}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef}/>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 12px 12px', background: C.white, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, padding: '8px 10px 8px 14px', transition: 'border-color .2s' }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = C.gold }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = C.border }}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Hỏi gì đó... (Enter gửi)" rows={1} style={{ flex: 1, minHeight: 28, maxHeight: 100, padding: 0 }} />
                <button className="float-send" onClick={() => send()} disabled={loading || !input.trim()}
                  style={{ width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0, background: loading || !input.trim() ? 'rgba(201,168,76,.12)' : `linear-gradient(135deg,${C.gold},#A8841C)`, color: loading || !input.trim() ? C.textLt : C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', transition: 'all .2s', boxShadow: loading || !input.trim() ? 'none' : '0 3px 10px rgba(201,168,76,.3)' }}>
                  {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }}/> : <Send size={14} strokeWidth={2.2}/>}
                </button>
              </div>
              {messages.length > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                  {[
                    { Icon: BookOpen, label: 'Từ vựng', prompt: 'Giải thích từ vựng: ' },
                    { Icon: Brain,    label: 'Ngữ pháp', prompt: 'Giải thích ngữ pháp: ' },
                    { Icon: PenLine,  label: 'Sửa câu',  prompt: 'Sửa câu này: ' },
                  ].map((c, i) => (
                    <button key={i} className="float-chip" onClick={() => { setInput(c.prompt); inputRef.current?.focus() }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 50, border: `1px solid ${C.border}`, background: 'transparent', fontSize: 12, color: C.textMid, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .15s' }}>
                      <c.Icon size={11} strokeWidth={2}/>{c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}