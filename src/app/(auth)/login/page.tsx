'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

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

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
        :root {
          --navy:      #1B2A4A;
          --navy-dark: #0F1E35;
          --navy-mid:  #243558;
          --gold:      #C8A84B;
          --gold-lt:   #E8C96C;
          --cream:     #F9F6EF;
          --green:     #00A878;
          --border:    rgba(200,168,75,0.22);
        }
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html, body { height:100%; }
        body { font-family:'Be Vietnam Pro',sans-serif; background:var(--navy-dark); }

        .login-wrap {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* ─── LEFT HERO ─── */
        .hero-side {
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 44px 52px;
        }
        .hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background:
            linear-gradient(160deg, rgba(15,30,53,0.88) 0%, rgba(27,42,74,0.72) 60%, rgba(15,30,53,0.92) 100%),
            url('/assets/hero/hero-bg.jpg') center/cover no-repeat;
        }
        /* Dot grid overlay */
        .hero-bg::after {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        /* Gold glow */
        .hero-glow {
          position: absolute; top: -120px; right: -80px; width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200,168,75,0.16) 0%, transparent 68%);
          pointer-events: none; z-index: 1;
        }
        .hero-glow-2 {
          position: absolute; bottom: -100px; left: -60px; width: 360px; height: 360px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,168,120,0.10) 0%, transparent 68%);
          pointer-events: none; z-index: 1;
        }

        .hero-content { position: relative; z-index: 2; }

        /* Logo */
        .logo-wrap { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .logo-icon {
          width: 44px; height: 44px; background: var(--gold); border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 800;
          color: var(--navy-dark); flex-shrink: 0;
        }
        .logo-text { display: flex; flex-direction: column; line-height: 1.2; }
        .logo-brand { font-size: 19px; font-weight: 700; color: #fff; }
        .logo-brand span { color: var(--gold); }
        .logo-sub { font-size: 11px; color: rgba(255,255,255,0.38); font-weight: 300; letter-spacing: .5px; }

        /* Headline */
        .hero-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 3.5vw, 52px);
          font-weight: 800; color: #fff;
          line-height: 1.18; margin-bottom: 20px; letter-spacing: -.4px;
        }
        .hero-headline .g { color: var(--gold); }
        .hero-headline .g2 { color: #6EDCB8; }
        .hero-desc { font-size: 15px; color: rgba(255,255,255,0.54); line-height: 1.8; margin-bottom: 38px; max-width: 380px; }

        /* Feature pills */
        .hero-pills { display: flex; flex-wrap: wrap; gap: 10px; }
        .pill {
          display: flex; align-items: center; gap: 8px; padding: 9px 16px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50px; font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 500;
          backdrop-filter: blur(4px); transition: all .25s;
        }
        .pill:hover { background: rgba(255,255,255,0.12); border-color: rgba(200,168,75,0.4); color: #fff; }
        .pill-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        /* Stats row */
        .hero-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 0; }
        .hero-stat { padding: 16px 0; border-right: 1px solid rgba(255,255,255,0.07); text-align: center; }
        .hero-stat:last-child { border-right: none; }
        .hero-stat-num { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 800; color: var(--gold); line-height: 1; margin-bottom: 4px; }
        .hero-stat-label { font-size: 11px; color: rgba(255,255,255,0.38); font-weight: 500; letter-spacing: .3px; }

        /* ─── RIGHT FORM ─── */
        .form-side {
          background: var(--cream);
          display: flex; align-items: center; justify-content: center;
          padding: 60px 48px;
        }
        .form-box { width: 100%; max-width: 420px; }

        .form-eyebrow {
          display: inline-flex; align-items: center; gap: 7px; padding: 5px 14px;
          background: rgba(200,168,75,0.12); border: 1px solid rgba(200,168,75,0.3);
          border-radius: 50px; font-size: 12px; font-weight: 600; color: #8B6914;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;
        }
        .form-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }

        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 36px; font-weight: 800; color: var(--navy); line-height: 1.15; margin-bottom: 8px;
        }
        .form-sub { font-size: 15px; color: #6B7A99; margin-bottom: 36px; line-height: 1.6; }

        /* Input groups */
        .field { margin-bottom: 20px; }
        .field label { display: block; font-size: 13px; font-weight: 600; color: var(--navy); margin-bottom: 8px; letter-spacing: .2px; }
        .input-wrap { position: relative; }
        .input-icon {
          position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
          width: 18px; height: 18px; color: #9BA8C0; pointer-events: none;
          display: flex; align-items: center; justify-content: center;
        }
        .input-icon svg { width: 18px; height: 18px; }
        .field input {
          width: 100%; padding: 13px 16px 13px 44px;
          border: 1.5px solid #DDE3EF; border-radius: 12px;
          font-size: 14px; font-family: 'Be Vietnam Pro', sans-serif;
          color: var(--navy); background: #fff;
          transition: border-color .2s, box-shadow .2s; outline: none;
        }
        .field input::placeholder { color: #B0BAD0; }
        .field input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(200,168,75,0.12); }
        .pw-toggle {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #9BA8C0;
          display: flex; align-items: center; padding: 2px;
          transition: color .2s;
        }
        .pw-toggle:hover { color: var(--navy); }
        .pw-toggle svg { width: 18px; height: 18px; }

        /* Forgot */
        .forgot-row { display: flex; justify-content: flex-end; margin-top: -10px; margin-bottom: 20px; }
        .forgot { font-size: 13px; color: var(--green); text-decoration: none; font-weight: 500; }
        .forgot:hover { text-decoration: underline; }

        /* Submit */
        .btn-submit {
          width: 100%; padding: 14px 24px;
          background: var(--navy); color: #fff;
          border: none; border-radius: 12px; cursor: pointer;
          font-size: 15px; font-weight: 700; font-family: 'Be Vietnam Pro', sans-serif;
          letter-spacing: .3px; transition: all .25s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-submit:hover:not(:disabled) { background: var(--navy-mid); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(27,42,74,0.28); }
        .btn-submit:disabled { opacity: .6; cursor: not-allowed; }

        /* Divider */
        .divider { display: flex; align-items: center; gap: 12px; margin: 24px 0; }
        .divider-line { flex: 1; height: 1px; background: #DDE3EF; }
        .divider span { font-size: 12px; color: #9BA8C0; font-weight: 500; }

        /* Social */
        .btn-social {
          width: 100%; padding: 12px 20px;
          background: #fff; border: 1.5px solid #DDE3EF; border-radius: 12px;
          cursor: pointer; font-size: 14px; font-weight: 600; font-family: 'Be Vietnam Pro', sans-serif;
          color: var(--navy); transition: all .2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .btn-social:hover { border-color: #B0BAD0; background: #FAFAFE; }
        .btn-social svg { width: 18px; height: 18px; }

        /* Footer note */
        .form-footer { margin-top: 28px; text-align: center; font-size: 13.5px; color: #7A869E; }
        .form-footer a { color: var(--green); font-weight: 600; text-decoration: none; }
        .form-footer a:hover { text-decoration: underline; }

        /* Trust badges */
        .trust-row { display: flex; gap: 8px; justify-content: center; margin-top: 20px; flex-wrap: wrap; }
        .trust-badge {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 10px; background: #fff;
          border: 1px solid #DDE3EF; border-radius: 50px;
          font-size: 11px; color: #6B7A99; font-weight: 500;
        }
        .trust-badge svg { width: 12px; height: 12px; color: var(--green); }

        @media (max-width: 800px) {
          .login-wrap { grid-template-columns: 1fr; }
          .hero-side { display: none; }
          .form-side { padding: 40px 24px; }
        }
      `}} />

      <div className="login-wrap">

        {/* ── LEFT HERO ── */}
        <div className="hero-side">
          <div className="hero-bg" />
          <div className="hero-glow" />
          <div className="hero-glow-2" />

          {/* Logo */}
          <div className="hero-content">
            <Link href="/" className="logo-wrap">
              <div className="logo-icon">EH</div>
              <div className="logo-text">
                <span className="logo-brand">English<span>Hub</span></span>
                <span className="logo-sub">ĐH Thái Bình · AI-Powered</span>
              </div>
            </Link>
          </div>

          {/* Main copy */}
          <div className="hero-content">
            <h2 className="hero-headline">
              Học tiếng Anh<br />
              <span className="g">toàn diện</span> cùng<br />
              <span className="g2">AI Gemini</span> miễn phí
            </h2>
            <p className="hero-desc">
              Từ vựng SRS thông minh, luyện thi VSTEP · TOEIC · APTIS —
              hoàn toàn miễn phí dành riêng cho sinh viên ĐH Thái Bình.
            </p>
            <div className="hero-pills">
              {[
                { dot: '#00A878', text: 'Flashcard SRS SM-2' },
                { dot: '#C8A84B', text: 'AI Gemini 24/7' },
                { dot: '#6478f0', text: 'VSTEP · TOEIC · APTIS' },
                { dot: '#f06464', text: 'Dashboard 4 kỹ năng' },
              ].map((p, i) => (
                <div key={i} className="pill">
                  <div className="pill-dot" style={{ background: p.dot }} />
                  {p.text}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="hero-content">
            <div className="hero-stats">
              {[
                { num: '10K+', label: 'Từ vựng thông minh' },
                { num: '100%', label: 'Miễn phí hoàn toàn' },
                { num: '24/7', label: 'AI hỗ trợ liên tục' },
              ].map((s, i) => (
                <div key={i} className="hero-stat">
                  <div className="hero-stat-num">{s.num}</div>
                  <div className="hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM ── */}
        <div className="form-side">
          <div className="form-box">

            <div className="form-eyebrow">
              <div className="form-eyebrow-dot" />
              Chào mừng trở lại
            </div>

            <h1 className="form-title">Đăng nhập</h1>
            <p className="form-sub">Nhập thông tin tài khoản của bạn để tiếp tục hành trình học.</p>

            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="field">
                <label htmlFor="email">Email</label>
                <div className="input-wrap">
                  <div className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 7 10-7"/>
                    </svg>
                  </div>
                  <input
                    id="email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vd: nguyenvana@gmail.com"
                    required autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field">
                <label htmlFor="password">Mật khẩu</label>
                <div className="input-wrap">
                  <div className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    </svg>
                  </div>
                  <input
                    id="password" type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} aria-label="Hiện/ẩn mật khẩu">
                    {showPw ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="forgot-row">
                <Link href="/forgot-password" className="forgot">Quên mật khẩu?</Link>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>

              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span>hoặc tiếp tục với</span>
              <div className="divider-line" />
            </div>

            <button className="btn-social">
              <svg viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập với Google
            </button>

            <p className="form-footer">
              Chưa có tài khoản?{' '}
              <Link href="/register">Đăng ký miễn phí →</Link>
            </p>

            <div className="trust-row">
              {[
                { icon: '🔒', text: 'Bảo mật SSL' },
                { icon: '✓',  text: 'Miễn phí 100%' },
                { icon: '🎓', text: 'Xác thực MSSV' },
              ].map((b, i) => (
                <div key={i} className="trust-badge">
                  <span style={{ fontSize: 11 }}>{b.icon}</span>
                  {b.text}
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </>
  )
}