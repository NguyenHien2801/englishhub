'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const GOALS = [
  { value: 'VSTEP',   label: 'VSTEP B1',      desc: 'Chuẩn đầu ra ĐH Thái Bình', icon: '🎓', color: '#00A878' },
  { value: 'TOEIC',   label: 'TOEIC',         desc: 'Xin việc, doanh nghiệp',     icon: '💼', color: '#C8A84B' },
  { value: 'APTIS',   label: 'APTIS',         desc: 'Du học, học bổng',           icon: '✈️', color: '#6478f0' },
  { value: 'GENERAL', label: 'Tổng quát',     desc: 'Cải thiện tiếng Anh chung',  icon: '📚', color: '#f06464' },
]

const STEPS = [
  { num: 1, title: 'Tài khoản',   icon: '🔑' },
  { num: 2, title: 'Hồ sơ',       icon: '👤' },
  { num: 3, title: 'Mục tiêu',    icon: '🎯' },
]

export default function RegisterPage() {
  const [step,    setStep]    = useState(1)
  const [showPw,  setShowPw]  = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [form,    setForm]    = useState({
    email: '', mssv: '', password: '', confirmPassword: '',
    hoTen: '', lop: '', khoa: '', mucTieu: 'VSTEP',
  })
  const [loading, setLoading] = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  function update(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function checkMSSV(): Promise<boolean> {
    if (!form.mssv.trim()) return true
    const { data, error } = await supabase
      .from('DanhSachSinhVien').select('mssv').eq('mssv', form.mssv.trim()).single()
    if (error || !data) {
      toast.error('MSSV không có trong danh sách sinh viên của trường')
      return false
    }
    return true
  }

  async function handleNextStep1() {
    if (!form.email || !form.password || !form.confirmPassword) { toast.error('Vui lòng điền đầy đủ thông tin'); return }
    if (form.password !== form.confirmPassword) { toast.error('Mật khẩu không khớp'); return }
    if (form.password.length < 6) { toast.error('Mật khẩu tối thiểu 6 ký tự'); return }
    if (form.mssv.trim()) {
      setLoading(true)
      const valid = await checkMSSV()
      setLoading(false)
      if (!valid) return
    }
    setStep(2)
  }

  async function handleRegister() {
    if (!form.hoTen) { toast.error('Vui lòng nhập họ tên'); return }
    setLoading(true)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(), password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (authError) { toast.error(authError.message); setLoading(false); return }
    if (authData.user) {
      const { error: profileError } = await supabase.from('NguoiDung').insert({
        id: authData.user.id,
        ma_sinh_vien: form.mssv.trim().toUpperCase() || form.email.split('@')[0].toUpperCase(),
        ho_ten: form.hoTen.trim(),
        lop: form.lop.trim() || null,
        khoa: form.khoa.trim() || null,
        muc_tieu_hoc: form.mucTieu,
        vai_tro: 'sinh_vien',
        da_xac_thuc_truong: !!form.mssv.trim(),
      })
      if (profileError) { toast.error('Lỗi tạo hồ sơ: ' + profileError.message); setLoading(false); return }
    }
    setLoading(false)
    toast.success('Đăng ký thành công!')
    router.push('/level-test')
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
        }
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html, body { height:100%; }
        body { font-family:'Be Vietnam Pro',sans-serif; background:var(--navy-dark); }

        .reg-wrap {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 420px 1fr;
        }

        /* ─── LEFT SIDEBAR ─── */
        .reg-sidebar {
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 44px 40px;
          background: var(--navy-dark);
        }
        .reg-bg {
          position: absolute; inset: 0; z-index: 0;
          background:
            linear-gradient(180deg, rgba(15,30,53,0.92) 0%, rgba(27,42,74,0.80) 50%, rgba(15,30,53,0.95) 100%),
            url('/assets/hero/hero-bg.jpg') center/cover no-repeat;
        }
        .reg-bg::after {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .reg-glow-1 {
          position: absolute; top: -100px; right: -60px; width: 360px; height: 360px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200,168,75,0.14) 0%, transparent 70%);
          pointer-events: none; z-index: 1;
        }
        .reg-glow-2 {
          position: absolute; bottom: -80px; left: -40px; width: 280px; height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,168,120,0.10) 0%, transparent 70%);
          pointer-events: none; z-index: 1;
        }
        .reg-c { position: relative; z-index: 2; }

        .logo-wrap { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .logo-icon {
          width: 44px; height: 44px; background: var(--gold); border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 800;
          color: var(--navy-dark);
        }
        .logo-text { display: flex; flex-direction: column; line-height: 1.2; }
        .logo-brand { font-size: 19px; font-weight: 700; color: #fff; }
        .logo-brand span { color: var(--gold); }
        .logo-sub { font-size: 11px; color: rgba(255,255,255,0.36); font-weight: 300; letter-spacing: .5px; }

        /* Step progress */
        .step-track { display: flex; flex-direction: column; gap: 0; }
        .step-line-wrap { display: flex; flex-direction: column; align-items: center; }
        .step-row {
          display: flex; align-items: center; gap: 16px; width: 100%;
          padding: 4px 0;
        }
        .step-circle {
          width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700; flex-shrink: 0;
          transition: all .3s; border: 2px solid transparent;
        }
        .step-circle.done  { background: var(--gold); color: var(--navy-dark); border-color: var(--gold); }
        .step-circle.active { background: rgba(200,168,75,0.18); color: var(--gold); border-color: var(--gold); box-shadow: 0 0 0 5px rgba(200,168,75,0.12); }
        .step-circle.idle  { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.1); }
        .step-meta h4 { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 2px; transition: color .3s; }
        .step-meta h4.idle-txt { color: rgba(255,255,255,0.35); }
        .step-meta p  { font-size: 12px; color: rgba(255,255,255,0.35); }
        .step-connector { width: 2px; height: 28px; margin-left: 19px; margin-bottom: 0; border-radius: 2px; transition: background .3s; }
        .step-connector.done-c { background: var(--gold); }
        .step-connector.idle-c { background: rgba(255,255,255,0.08); }

        /* Benefits */
        .benefits { display: flex; flex-direction: column; gap: 12px; }
        .benefit {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 16px; border-radius: 12px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          transition: all .25s;
        }
        .benefit:hover { background: rgba(255,255,255,0.08); border-color: rgba(200,168,75,0.25); }
        .benefit-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .benefit h5 { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.88); margin-bottom: 2px; }
        .benefit p  { font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.5; }

        /* ─── RIGHT FORM ─── */
        .reg-main {
          background: var(--cream);
          display: flex; align-items: center; justify-content: center;
          padding: 60px 48px;
        }
        .reg-form-box { width: 100%; max-width: 480px; }

        .form-eyebrow {
          display: inline-flex; align-items: center; gap: 7px; padding: 5px 14px;
          background: rgba(200,168,75,0.12); border: 1px solid rgba(200,168,75,0.3);
          border-radius: 50px; font-size: 12px; font-weight: 600; color: #8B6914;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px;
        }
        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 34px; font-weight: 800; color: var(--navy); line-height: 1.15; margin-bottom: 6px;
        }
        .form-sub { font-size: 14.5px; color: #6B7A99; margin-bottom: 32px; line-height: 1.65; }

        /* Input */
        .field { margin-bottom: 18px; }
        .field label {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: var(--navy); margin-bottom: 8px; letter-spacing: .2px;
        }
        .optional { font-size: 11px; font-weight: 400; color: #9BA8C0; }
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
          color: var(--navy); background: #fff; transition: all .2s; outline: none;
        }
        .field input::placeholder { color: #B0BAD0; }
        .field input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(200,168,75,0.12); }
        .input-hint { margin-top: 6px; font-size: 12px; color: #9BA8C0; display: flex; align-items: center; gap: 5px; }
        .input-hint .hi { color: var(--green); font-weight: 600; }
        .pw-toggle {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #9BA8C0;
          display: flex; align-items: center; padding: 2px; transition: color .2s;
        }
        .pw-toggle:hover { color: var(--navy); }
        .pw-toggle svg { width: 18px; height: 18px; }

        /* Grid 2 col */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        /* Goal cards */
        .goals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
        .goal-card {
          padding: 16px; border-radius: 14px; border: 1.5px solid #DDE3EF;
          background: #fff; cursor: pointer; transition: all .25s; text-align: left;
          display: flex; flex-direction: column; gap: 6px;
        }
        .goal-card:hover { border-color: #B0BAD0; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(27,42,74,0.08); }
        .goal-card.selected { border-color: var(--gold); background: #FFFDF5; box-shadow: 0 4px 20px rgba(200,168,75,0.18); }
        .goal-icon { font-size: 22px; }
        .goal-label { font-size: 14px; font-weight: 700; color: var(--navy); }
        .goal-desc  { font-size: 12px; color: #7A869E; line-height: 1.4; }
        .goal-check {
          width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid #DDE3EF;
          display: flex; align-items: center; justify-content: center;
          align-self: flex-end; margin-top: 4px; transition: all .2s;
        }
        .goal-card.selected .goal-check { background: var(--gold); border-color: var(--gold); }
        .goal-check svg { width: 10px; height: 10px; color: #fff; }

        /* Buttons */
        .btn-row { display: flex; gap: 12px; }
        .btn-back {
          flex: 1; padding: 13px 20px;
          background: #fff; border: 1.5px solid #DDE3EF; border-radius: 12px;
          cursor: pointer; font-size: 14px; font-weight: 600; font-family: 'Be Vietnam Pro', sans-serif;
          color: var(--navy); transition: all .2s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .btn-back:hover { border-color: var(--navy); }
        .btn-next {
          flex: 2; padding: 13px 24px;
          background: var(--navy); color: #fff; border: none; border-radius: 12px;
          cursor: pointer; font-size: 14px; font-weight: 700; font-family: 'Be Vietnam Pro', sans-serif;
          letter-spacing: .2px; transition: all .25s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-next:hover:not(:disabled) { background: var(--navy-mid); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(27,42,74,0.24); }
        .btn-next:disabled { opacity: .6; cursor: not-allowed; }
        .btn-start {
          flex: 2; padding: 13px 24px;
          background: var(--green); color: #fff; border: none; border-radius: 12px;
          cursor: pointer; font-size: 14px; font-weight: 700; font-family: 'Be Vietnam Pro', sans-serif;
          transition: all .25s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-start:hover:not(:disabled) { background: #007A58; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,168,120,0.3); }
        .btn-start:disabled { opacity: .6; cursor: not-allowed; }
        .btn-start svg, .btn-next svg { width: 16px; height: 16px; }

        .form-footer { margin-top: 24px; text-align: center; font-size: 13.5px; color: #7A869E; }
        .form-footer a { color: var(--green); font-weight: 600; text-decoration: none; }
        .form-footer a:hover { text-decoration: underline; }

        /* Security note */
        .security-note {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; background: rgba(0,168,120,0.06);
          border: 1px solid rgba(0,168,120,0.18); border-radius: 10px;
          font-size: 12px; color: #3D8B70; margin-top: 16px;
        }
        .security-note svg { width: 14px; height: 14px; flex-shrink: 0; color: var(--green); }

        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .reg-wrap { grid-template-columns: 1fr; }
          .reg-sidebar { display: none; }
          .reg-main { padding: 40px 24px; }
        }
      `}} />

      <div className="reg-wrap">

        {/* ── LEFT SIDEBAR ── */}
        <div className="reg-sidebar">
          <div className="reg-bg" />
          <div className="reg-glow-1" />
          <div className="reg-glow-2" />

          <div className="reg-c">
            <Link href="/" className="logo-wrap">
              <div className="logo-icon">EH</div>
              <div className="logo-text">
                <span className="logo-brand">English<span>Hub</span></span>
                <span className="logo-sub">ĐH Thái Bình · AI-Powered</span>
              </div>
            </Link>
          </div>

          {/* Step tracker */}
          <div className="reg-c">
            <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 24 }}>
              Tiến trình đăng ký
            </p>
            <div className="step-track">
              {STEPS.map((s, i) => (
                <div key={s.num}>
                  <div className="step-row">
                    <div className={`step-circle ${step > s.num ? 'done' : step === s.num ? 'active' : 'idle'}`}>
                      {step > s.num ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : s.icon}
                    </div>
                    <div className="step-meta">
                      <h4 className={step <= s.num && step !== s.num ? 'idle-txt' : ''}>{s.title}</h4>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`step-connector ${step > s.num ? 'done-c' : 'idle-c'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="reg-c">
            <div className="benefits">
              {[
                { icon: '🃏', title: 'Flashcard SRS thông minh', desc: 'Thuật toán SM-2 tự động ôn tập đúng thời điểm' },
                { icon: '🤖', title: 'AI Gemini 24/7 miễn phí',  desc: 'Hỗ trợ bằng tiếng Việt, không giới hạn' },
                { icon: '📊', title: 'Dashboard 4 kỹ năng',      desc: 'Theo dõi tiến độ Nghe · Đọc · Viết · Nói' },
              ].map((b, i) => (
                <div key={i} className="benefit">
                  <div className="benefit-icon">{b.icon}</div>
                  <div>
                    <h5>{b.title}</h5>
                    <p>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM ── */}
        <div className="reg-main">
          <div className="reg-form-box">

            <div className="form-eyebrow">
              Bước {step} / 3
            </div>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <>
                <h1 className="form-title">Tạo tài khoản</h1>
                <p className="form-sub">Đăng ký miễn phí với email của bạn. MSSV giúp xác thực sinh viên ĐH Thái Bình.</p>

                {/* Email */}
                <div className="field">
                  <label>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 7 10-7"/></svg>
                    Email
                  </label>
                  <div className="input-wrap">
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 7 10-7"/></svg>
                    </div>
                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="vd: nguyenvana@gmail.com" required />
                  </div>
                </div>

                {/* MSSV */}
                <div className="field">
                  <label>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 19v2M8 19v2M2 9h20"/></svg>
                    Mã số sinh viên <span className="optional">(không bắt buộc)</span>
                  </label>
                  <div className="input-wrap">
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 19v2M8 19v2M2 9h20"/></svg>
                    </div>
                    <input type="text" value={form.mssv} onChange={e => update('mssv', e.target.value)} placeholder="VD: SV2021001" style={{ fontFamily: 'monospace', letterSpacing: '.05em' }} />
                  </div>
                  <p className="input-hint">Nhập MSSV để nhận nhãn <span className="hi">✓ Sinh viên đã xác thực</span></p>
                </div>

                {/* Password */}
                <div className="field">
                  <label>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Mật khẩu
                  </label>
                  <div className="input-wrap">
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>
                    </div>
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="Tối thiểu 6 ký tự" style={{ paddingRight: 44 }} />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                       : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </div>

                {/* Confirm */}
                <div className="field">
                  <label>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Xác nhận mật khẩu
                  </label>
                  <div className="input-wrap">
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <input type={showCPw ? 'text' : 'password'} value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="Nhập lại mật khẩu" style={{ paddingRight: 44 }} />
                    <button type="button" className="pw-toggle" onClick={() => setShowCPw(!showCPw)}>
                      {showCPw ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                       : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </div>

                <button className="btn-next" style={{ width: '100%' }} onClick={handleNextStep1} disabled={loading}>
                  {loading ? <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> : null}
                  {loading ? 'Đang kiểm tra...' : 'Tiếp theo'}
                  {!loading && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                </button>
              </>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <>
                <h1 className="form-title">Hồ sơ cá nhân</h1>
                <p className="form-sub">Thông tin này giúp cá nhân hóa trải nghiệm học tập của bạn.</p>

                <div className="field">
                  <label>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Họ và tên đầy đủ
                  </label>
                  <div className="input-wrap">
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <input type="text" value={form.hoTen} onChange={e => update('hoTen', e.target.value)} placeholder="Nguyễn Văn An" />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      Lớp
                    </label>
                    <div className="input-wrap">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      </div>
                      <input type="text" value={form.lop} onChange={e => update('lop', e.target.value)} placeholder="CNTT-K15" />
                    </div>
                  </div>
                  <div className="field">
                    <label>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      Khoa
                    </label>
                    <div className="input-wrap">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                      </div>
                      <input type="text" value={form.khoa} onChange={e => update('khoa', e.target.value)} placeholder="CNTT" />
                    </div>
                  </div>
                </div>

                <div className="security-note">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Thông tin của bạn được bảo mật và chỉ dùng để cá nhân hóa học tập.
                </div>

                <div className="btn-row" style={{ marginTop: 24 }}>
                  <button className="btn-back" onClick={() => setStep(1)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Quay lại
                  </button>
                  <button className="btn-next" onClick={() => { if (form.hoTen) setStep(3); else toast.error('Nhập họ tên') }}>
                    Tiếp theo
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <>
                <h1 className="form-title">Mục tiêu học tập</h1>
                <p className="form-sub">AI sẽ lập lộ trình riêng cho bạn dựa trên mục tiêu này. Có thể thay đổi sau.</p>

                <div className="goals-grid">
                  {GOALS.map(g => (
                    <button key={g.value} className={`goal-card ${form.mucTieu === g.value ? 'selected' : ''}`}
                      onClick={() => update('mucTieu', g.value)}>
                      <div className="goal-icon">{g.icon}</div>
                      <div className="goal-label">{g.label}</div>
                      <div className="goal-desc">{g.desc}</div>
                      <div className="goal-check">
                        {form.mucTieu === g.value && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="security-note">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  Sau khi đăng ký, bạn sẽ làm Level Test ~20 phút để AI xác định trình độ chính xác hơn.
                </div>

                <div className="btn-row" style={{ marginTop: 24 }}>
                  <button className="btn-back" onClick={() => setStep(2)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Quay lại
                  </button>
                  <button className="btn-start" onClick={handleRegister} disabled={loading}>
                    {loading ? (
                      <><svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Đang tạo tài khoản...</>
                    ) : (
                      <>🚀 Bắt đầu học ngay!</>
                    )}
                  </button>
                </div>
              </>
            )}

            <p className="form-footer">
              Đã có tài khoản?{' '}
              <Link href="/login">Đăng nhập →</Link>
            </p>
          </div>
        </div>

      </div>
    </>
  )
}