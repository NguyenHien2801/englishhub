'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  Mail, Lock, Eye, EyeOff, LogIn, Loader2,
  BookOpen, Bot, Trophy, LayoutDashboard,
  ShieldCheck, BadgeCheck, GraduationCap, ArrowLeft,
} from 'lucide-react'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') router.replace('/dashboard')
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      toast.error('Email hoặc mật khẩu không đúng')
      setLoading(false)
      return
    }
    toast.success('Đăng nhập thành công!')
    window.location.href = '/dashboard'
  }

  const features = [
    { Icon: BookOpen,        color: '#4ECBA8', bg: 'rgba(78,203,168,.15)',  text: 'Flashcard SRS · 10,000+ từ vựng' },
    { Icon: Bot,             color: '#C9A84C', bg: 'rgba(201,168,76,.15)',  text: 'AI giải thích 24/7 bằng tiếng Việt' },
    { Icon: Trophy,          color: '#8899F4', bg: 'rgba(136,153,244,.15)', text: 'Luyện thi VSTEP · TOEIC · APTIS' },
    { Icon: LayoutDashboard, color: '#F07878', bg: 'rgba(240,120,120,.15)', text: 'Dashboard 4 kỹ năng cá nhân hóa' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { height: 100%; -webkit-font-smoothing: antialiased; }
        body { font-family: 'DM Sans', sans-serif; min-height: 100vh; background: #0F1C35; }

        :root {
          --navy:   #0F1C35;
          --navy-2: #162444;
          --gold:   #C9A84C;
          --cream:  #F8F5EE;
          --white:  #FFFFFF;
          --green:  #00A878;
          --text:   #1A1E2E;
          --muted:  #64748B;
          --border: #E2E8F0;
        }

        @keyframes up   { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes drift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }

        /* ─── SHELL ─── */
        .shell {
          min-height: 100vh;
          overflow: hidden;
          display: grid;
          grid-template-columns: 52% 48%;
        }

        /* ══════ LEFT ══════ */
        .panel-l {
          position: relative; overflow: hidden;
          height: 100vh;
          background: var(--navy);
          display: flex; flex-direction: column;
          padding: 36px 56px;
        }
        .pl-photo { position: absolute; inset: 0; z-index: 0; }
        .pl-photo img { width:100%; height:100%; object-fit:cover; opacity:.45; }
        .pl-photo::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(to right, rgba(15,28,53,.92) 0%, rgba(15,28,53,.7) 35%, rgba(15,28,53,.0) 60%);
        }
        .pl-dots {
          position:absolute; inset:0; z-index:1; pointer-events:none;
          background-image: radial-gradient(rgba(255,255,255,.033) 1px, transparent 1px);
          background-size: 30px 30px;
        }
        .glow {
          position:absolute; border-radius:50%; pointer-events:none;
          z-index:1; filter:blur(70px);
        }
        .g1 { width:420px; height:420px; top:-110px; right:-70px;
              background:radial-gradient(circle,rgba(201,168,76,.14),transparent 68%);
              animation:drift 12s ease-in-out infinite; }
        .g2 { width:300px; height:300px; bottom:-70px; left:-50px;
              background:radial-gradient(circle,rgba(0,168,120,.10),transparent 68%);
              animation:drift 16s ease-in-out infinite 5s; }

        .pl-inner {
          position:relative; z-index:2;
          display:flex; flex-direction:column; height:100%;
        }

        .pl-logo {
          display:inline-flex; align-items:center;
          background:rgba(255,255,255,.96); border-radius:12px;
          padding:9px 16px; width:fit-content; text-decoration:none;
          box-shadow:0 4px 18px rgba(0,0,0,.24);
          transition:transform .25s cubic-bezier(.34,1.56,.64,1);
        }
        .pl-logo:hover { transform:translateY(-3px); }

        .pl-spacer { flex:1; min-height:32px; }

        .pl-h2 {
          font-family:'Playfair Display',serif;
          font-size:clamp(30px,3.2vw,50px); font-weight:900;
          color:#fff; line-height:1.15; letter-spacing:-.4px;
          margin-bottom:16px;
        }
        .pl-h2 em      { font-style:italic; color:var(--gold); }
        .pl-h2 em.teal { color:#6EDCB8; }

        .pl-desc {
          font-size:15px; color:rgba(255,255,255,.44);
          line-height:1.82; max-width:340px; margin-bottom:28px;
        }

        .feat-list { display: flex; flex-direction: column; gap: 9px; margin-bottom: 24px; }
        .feat-row  {
          display:flex; align-items:center; gap:12px;
          font-size:15px; font-weight:500; color:rgba(255,255,255,.62);
        }
        .feat-ic {
          width:30px; height:30px; border-radius:8px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
        }

        .pl-stats {
          display:flex; gap:0;
          padding-top:18px;
          border-top:1px solid rgba(255,255,255,.08);
        }
        .pl-stat {
          flex:1; padding-right:20px; margin-right:20px;
          border-right:1px solid rgba(255,255,255,.08);
        }
        .pl-stat:last-child { border-right:none; padding-right:0; margin-right:0; }
        .sn {
          font-family:'Playfair Display',serif;
          font-size:clamp(18px,2.2vw,26px); font-weight:900;
          color:var(--gold); line-height:1; margin-bottom:4px;
        }
        .sl { font-size:12px; color:rgba(255,255,255,.28); font-weight:500; letter-spacing:.2px; }

        /* ══════ RIGHT ══════ */
        .panel-r {
          background:var(--white);
          display:flex; flex-direction:column;
          height: 100vh;
          overflow-y: auto;
        }

        /* Nav strip at top */
        .r-nav {
          display:flex; align-items:center; justify-content:space-between;
          padding:20px 52px;
          border-bottom:1px solid var(--border);
          flex-shrink:0;
        }
        .r-nav-back {
          display:inline-flex; align-items:center; gap:6px;
          font-size:13.5px; font-weight:500; color:var(--muted);
          text-decoration:none; padding:7px 13px;
          border:1.5px solid var(--border); border-radius:8px;
          transition:all .18s;
        }
        .r-nav-back:hover { color:var(--text); border-color:#94A3B8; background:#F8FAFC; }

        .r-nav-register {
          font-size:13.5px; color:var(--muted);
        }
        .r-nav-register a {
          color:var(--green); font-weight:600;
          text-decoration:none; margin-left:5px;
        }
        .r-nav-register a:hover { text-decoration:underline; }

        /* Scrollable body */
        .r-body {
          flex:1; display:flex; align-items:center; justify-content:center;
          padding:24px 52px;
          animation:up .45s ease both;
        }

        .form-wrap { width:100%; max-width: 380px; text-align: center;}

        .form-kicker {
          display:inline-flex; align-items:center; gap:7px;
          font-size:11.5px; font-weight:700; color:#92400E;
          text-transform:uppercase; letter-spacing:1px;
          background:#FEF3C7; border:1px solid #FDE68A;
          border-radius:50px; padding:4px 12px; margin-bottom:18px;
        }
        .kd { width:6px; height:6px; border-radius:50%; background:var(--gold); animation:pulse 2s infinite; }

        .form-h1 {
          font-family:'Playfair Display',serif;
          font-size:clamp(30px,3.2vw,38px); font-weight:900;
          color:var(--text); line-height:1.1; letter-spacing:-.3px;
          margin-bottom:8px;
        }
        .form-h1 em { font-style:italic; color:var(--gold); }

        .form-sub {
         font-size: 15px; color: var(--muted); line-height: 1.8; margin-bottom: 20px;
        }

        /* Fields */
        .fg { margin-bottom: 12px; text-align: left;}
        .fl {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:7px;
        }
        .fl-t { font-size:15px; font-weight:600; color:var(--text); }
        .fl-a {
          font-size:13.5px; color:var(--green); font-weight:500;
          text-decoration:none; transition:opacity .18s;
        }
        .fl-a:hover { opacity:.7; }

        .iw { position:relative; }
        .ii {
          position:absolute; left:13px; top:50%; transform:translateY(-50%);
          color:#94A3B8; display:flex; pointer-events:none;
        }
        .fi {
          width:100%; height:46px;
          padding:0 14px 0 40px;
          border:1.5px solid var(--border); border-radius:10px;
          font-size:15px; font-family:'DM Sans',sans-serif;
          color:var(--text); background:#FAFBFC;
          outline:none; transition:border-color .18s, box-shadow .18s, background .18s;
        }
        .fi::placeholder { color:#CBD5E1; }
        .fi:focus {
          border-color:var(--gold); background:var(--white);
          box-shadow:0 0 0 3px rgba(201,168,76,.11);
        }
        .ir {
          position:absolute; right:5px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; color:#94A3B8;
          padding:8px; border-radius:7px; display:flex; align-items:center;
          transition:color .18s, background .18s;
        }
        .ir:hover { color:var(--text); background:#F1F5F9; }

        /* Submit */
        .btn-sub {
          width:100%; height:50px; margin-top:6px;
          background:var(--navy); color:#fff; border:none;
          border-radius:10px; cursor:pointer;
          font-family:'DM Sans',sans-serif;
          font-size:13.5px; font-weight:700; letter-spacing:.1px;
          display:flex; align-items:center; justify-content:center; gap:9px;
          transition:background .2s, transform .2s, box-shadow .2s;
        }
        .btn-sub:hover:not(:disabled) {
          background:var(--navy-2);
          transform:translateY(-2px);
          box-shadow:0 8px 22px rgba(15,28,53,.26);
        }
        .btn-sub:active:not(:disabled) { transform:none; box-shadow:none; }
        .btn-sub:disabled { opacity:.48; cursor:not-allowed; }

        /* OR divider */
        .or {
          display:flex; align-items:center; gap:12px; margin:20px 0;
        }
        .or-l { flex:1; height:1px; background:var(--border); }
        .or-t  { font-size:13px; color:#94A3B8; font-weight:500; white-space:nowrap; }

        /* Google */
        .btn-g {
          width:100%; height:46px;
          background:var(--white); border:1.5px solid var(--border);
          border-radius:10px; cursor:pointer;
          font-family:'DM Sans',sans-serif;
          font-size:13.5px; font-weight:600; color:var(--text);
          display:flex; align-items:center; justify-content:center; gap:10px;
          transition:border-color .18s, box-shadow .18s;
        }
        .btn-g:hover { border-color:#94A3B8; box-shadow:0 2px 10px rgba(0,0,0,.06); }

        /* Footer bar */
        .r-foot {
          display:flex; align-items:center; justify-content:center;
          gap:22px; flex-wrap:wrap;
          padding:18px 52px;
          border-top:1px solid var(--border);
          flex-shrink:0;
        }
        .trust {
          display:inline-flex; align-items:center; gap:6px;
          font-size:12.5px; color:var(--muted); font-weight:700;
        }

        /* Mobile bar */
        .m-bar {
          display:none; background:var(--navy);
          padding:13px 20px; align-items:center; justify-content:space-between;
          border-bottom:1px solid rgba(255,255,255,.08);
        }
        .m-bar-chip {
          background:var(--white); border-radius:9px;
          padding:5px 11px; display:flex; align-items:center;
        }
        .m-bar-tag { font-size:12px; color:rgba(255,255,255,.33); }

        @media (max-width:900px) {
          .shell { grid-template-columns: 1fr; height: auto; overflow: visible;}
          .panel-l { display:none; }
          .m-bar { display:flex; }
          .panel-r { height: auto; min-height: calc(100svh - 54px); overflow: visible; }
          .r-nav { padding: 14px 20px; }
          .r-body { padding: 24px 20px; align-items: flex-start;  }
          .r-foot { padding: 14px 20px; gap: 16px; }
        }
        @media (max-width:480px) {
          .r-nav  { padding:13px 16px; }
          .r-body { padding:28px 16px; }
          .r-foot { padding:14px 16px; }
          .form-h1 { font-size:30px; }
          .fi { font-size:15px; }
        }
      `}} />

      {/* Mobile bar */}
      <header className="m-bar">
        <div className="m-bar-chip">
          <Image src="/assets/Logo.png" alt="EnglishHub" width={92} height={25} style={{ objectFit:'contain' }} />
        </div>
        <span className="m-bar-tag">Trường Đại học Thái Bình · Miễn phí</span>
      </header>

      <div className="shell">

        {/* ══ LEFT ══ */}
        <aside className="panel-l" aria-hidden="true">
          <div className="pl-photo">
            <img src="/assets/Login/Login.jpg" alt="" />
          </div>
          <div className="pl-dots" />
          <div className="glow g1" />
          <div className="glow g2" />

          <div className="pl-inner">
            <Link href="/" className="pl-logo">
              <Image src="/assets/Logo.png" alt="EnglishHub" width={132} height={37} style={{ objectFit:'contain' }} priority />
            </Link>

            <div className="pl-spacer" />

            <h2 className="pl-h2">
              Học tiếng Anh<br />
              <em>thông minh</em> hơn<br />
              cùng <em className="teal">AI</em>
            </h2>
            <p className="pl-desc">
              Flashcard SRS, luyện đề 3 chứng chỉ, AI giải thích 24/7 —
              miễn phí hoàn toàn cho sinh viên Trường Đại học Thái Bình.
            </p>

            <div className="feat-list">
              {features.map(({ Icon, color, bg, text }, i) => (
                <div key={i} className="feat-row">
                  <div className="feat-ic" style={{ background: bg }}>
                    <Icon size={14} color={color} strokeWidth={2} />
                  </div>
                  {text}
                </div>
              ))}
            </div>

            <div className="pl-stats">
              {[
                { n:'10K+', l:'Từ vựng' },
                { n:'100%', l:'Miễn phí' },
                { n:'24/7', l:'AI hỗ trợ' },
              ].map((s, i) => (
                <div key={i} className="pl-stat">
                  <div className="sn">{s.n}</div>
                  <div className="sl">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ══ RIGHT ══ */}
        <main className="panel-r">

          {/* Top nav strip */}
          <nav className="r-nav">
            <Link href="/" className="r-nav-back">
              <ArrowLeft size={14} strokeWidth={2} />
              Trang chủ
            </Link>
            <span className="r-nav-register">
              Chưa có tài khoản?
              <Link href="/register">Đăng ký miễn phí</Link>
            </span>
          </nav>

          {/* Form body */}
          <div className="r-body">
            <div className="form-wrap">

              <div className="form-kicker">
                <span className="kd" />
                Chào mừng trở lại
              </div>

              <h1 className="form-h1">Đăng <em>nhập</em></h1>
              <p className="form-sub">Nhập thông tin tài khoản để tiếp tục.</p>

              <form onSubmit={handleLogin} noValidate>

                <div className="fg">
                  <div className="fl">
                    <span className="fl-t">Email</span>
                  </div>
                  <div className="iw">
                    <span className="ii"><Mail size={16} strokeWidth={1.8} /></span>
                    <input
                      className="fi" id="email" type="email"
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="nguyenvana@gmail.com"
                      required autoComplete="email" inputMode="email"
                    />
                  </div>
                </div>

                <div className="fg">
                  <div className="fl">
                    <span className="fl-t">Mật khẩu</span>
                    <Link href="/forgot-password" className="fl-a">Quên mật khẩu?</Link>
                  </div>
                  <div className="iw">
                    <span className="ii"><Lock size={16} strokeWidth={1.8} /></span>
                    <input
                      className="fi" id="password"
                      type={showPw ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required autoComplete="current-password"
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" className="ir"
                      onClick={() => setShowPw(!showPw)}
                      aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                      {showPw ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-sub" disabled={loading}>
                  {loading
                    ? <><Loader2 size={17} strokeWidth={2} style={{ animation:'spin 1s linear infinite' }} />Đang đăng nhập...</>
                    : <><LogIn size={17} strokeWidth={2} />Đăng nhập</>
                  }
                </button>

              </form>

              <div className="or">
                <div className="or-l" /><span className="or-t">hoặc tiếp tục với</span><div className="or-l" />
              </div>

              <button className="btn-g" type="button">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Tiếp tục với Google
              </button>

            </div>
          </div>

          {/* Footer strip */}
          <footer className="r-foot">
            <span className="trust"><ShieldCheck size={13} strokeWidth={2} color="#00A878" />Bảo mật SSL</span>
            <span className="trust"><BadgeCheck   size={13} strokeWidth={2} color="#C9A84C" />Miễn phí 100%</span>
            <span className="trust"><GraduationCap size={13} strokeWidth={2} color="#6478F0" />Xác thực MSSV</span>
          </footer>

        </main>
      </div>
    </>
  )
}