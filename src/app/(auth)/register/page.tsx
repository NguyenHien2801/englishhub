'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  Mail, Lock, Eye, EyeOff, Loader2,
  User, BookOpen, GraduationCap, Building2,
  ArrowLeft, ArrowRight, Rocket,
  ShieldCheck, BadgeCheck, Layers,
  Bot, Trophy, LayoutDashboard,
  CreditCard, CheckCircle2,
} from 'lucide-react'

const GOALS = [
  { value: 'VSTEP',   label: 'VSTEP B1',    desc: 'Chuẩn đầu ra ĐH Thái Bình', icon: GraduationCap, color: '#00A878', bg: 'rgba(0,168,120,.12)' },
  { value: 'TOEIC',   label: 'TOEIC',       desc: 'Xin việc, doanh nghiệp',     icon: CreditCard,    color: '#C9A84C', bg: 'rgba(201,168,76,.12)' },
  { value: 'APTIS',   label: 'APTIS',       desc: 'Du học, học bổng',           icon: Trophy,        color: '#8899F4', bg: 'rgba(136,153,244,.12)' },
  { value: 'GENERAL', label: 'Tổng quát',   desc: 'Cải thiện tiếng Anh chung',  icon: BookOpen,      color: '#F07878', bg: 'rgba(240,120,120,.12)' },
]

const STEPS = [
  { num: 1, title: 'Tài khoản',  sub: 'Email & mật khẩu' },
  { num: 2, title: 'Hồ sơ',      sub: 'Thông tin cá nhân' },
  { num: 3, title: 'Mục tiêu',   sub: 'Lộ trình AI' },
]

const FEATURES = [
  { Icon: Layers,          color: '#4ECBA8', bg: 'rgba(78,203,168,.15)',  text: 'Flashcard SRS · 10,000+ từ vựng' },
  { Icon: Bot,             color: '#C9A84C', bg: 'rgba(201,168,76,.15)',  text: 'AI giải thích 24/7 bằng tiếng Việt' },
  { Icon: Trophy,          color: '#8899F4', bg: 'rgba(136,153,244,.15)', text: 'Luyện thi VSTEP · TOEIC · APTIS' },
  { Icon: LayoutDashboard, color: '#F07878', bg: 'rgba(240,120,120,.15)', text: 'Dashboard 4 kỹ năng cá nhân hóa' },
]

export default function RegisterPage() {
  const [step,    setStep]    = useState(1)
  const [showPw,  setShowPw]  = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form,    setForm]    = useState({
    email: '', mssv: '', password: '', confirmPassword: '',
    hoTen: '', lop: '', khoa: '', mucTieu: 'VSTEP',
  })
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html { height:100%; -webkit-font-smoothing:antialiased; }
        body { font-family:'DM Sans',sans-serif; min-height:100vh; background:#0F1C35; }

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

        @keyframes up    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes drift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

        /* ─── SHELL ─── */
        .shell {
          height:100vh; overflow:hidden;
          display:grid; grid-template-columns:52% 48%;
        }

        /* ══════ LEFT ══════ */
        .panel-l {
          position:relative; overflow:hidden; height:100vh;
          background:var(--navy);
          display:flex; flex-direction:column;
          padding:36px 56px;
        }
        .pl-photo { position:absolute; inset:0; z-index:0; }
        .pl-photo img { width:100%; height:100%; object-fit:cover; opacity:.45; }
        .pl-photo::after {
          content:''; position:absolute; inset:0;
          background:linear-gradient(to right,rgba(15,28,53,.92) 0%,rgba(15,28,53,.7) 35%,rgba(15,28,53,.0) 60%);
        }
        .pl-dots {
          position:absolute; inset:0; z-index:1; pointer-events:none;
          background-image:radial-gradient(rgba(255,255,255,.033) 1px,transparent 1px);
          background-size:30px 30px;
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
        .pl-spacer { flex:1; min-height:24px; }

        .pl-h2 {
          font-family:'Playfair Display',serif;
          font-size:clamp(28px,3vw,46px); font-weight:900;
          color:#fff; line-height:1.15; letter-spacing:-.4px; margin-bottom:14px;
        }
        .pl-h2 em      { font-style:italic; color:var(--gold); }
        .pl-h2 em.teal { color:#6EDCB8; }

        .pl-desc {
          font-size:15px; color:rgba(255,255,255,.44);
          line-height:1.82; max-width:340px; margin-bottom:24px;
        }

        /* Step tracker on left */
        .step-track { display:flex; flex-direction:column; gap:0; margin-bottom:24px; }
        .step-row { display:flex; align-items:center; gap:14px; padding:5px 0; }
        .step-circle {
          width:36px; height:36px; border-radius:50%; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:700;
          border:2px solid transparent; transition:all .3s;
        }
        .step-circle.done   { background:var(--gold); color:var(--navy); border-color:var(--gold); }
        .step-circle.active { background:rgba(201,168,76,.15); color:var(--gold); border-color:var(--gold); box-shadow:0 0 0 4px rgba(201,168,76,.1); }
        .step-circle.idle   { background:rgba(255,255,255,.05); color:rgba(255,255,255,.28); border-color:rgba(255,255,255,.1); }
        .step-meta h4 { font-size:14px; font-weight:600; color:#fff; line-height:1.2; }
        .step-meta h4.idle-txt { color:rgba(255,255,255,.32); }
        .step-meta p { font-size:12px; color:rgba(255,255,255,.32); }
        .step-connector { width:2px; height:22px; margin-left:17px; border-radius:2px; transition:background .3s; }
        .step-connector.done-c { background:var(--gold); }
        .step-connector.idle-c { background:rgba(255,255,255,.08); }

        .feat-list { display:flex; flex-direction:column; gap:9px; }
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
          padding-top:18px; margin-top:18px;
          border-top:1px solid rgba(255,255,255,.08);
        }
        .pl-stat { flex:1; padding-right:20px; margin-right:20px; border-right:1px solid rgba(255,255,255,.08); }
        .pl-stat:last-child { border-right:none; padding-right:0; margin-right:0; }
        .sn { font-family:'Playfair Display',serif; font-size:clamp(16px,2vw,24px); font-weight:900; color:var(--gold); line-height:1; margin-bottom:4px; }
        .sl { font-size:12px; color:rgba(255,255,255,.28); font-weight:500; letter-spacing:.2px; }

        /* ══════ RIGHT ══════ */
        .panel-r {
          background:var(--white);
          display:flex; flex-direction:column;
          height:100vh; overflow-y:auto;
        }

        /* Nav strip */
        .r-nav {
          display:flex; align-items:center; justify-content:space-between;
          padding:20px 52px; border-bottom:1px solid var(--border); flex-shrink:0;
        }
        .r-nav-back {
          display:inline-flex; align-items:center; gap:6px;
          font-size:13.5px; font-weight:500; color:var(--muted);
          text-decoration:none; padding:7px 13px;
          border:1.5px solid var(--border); border-radius:8px; transition:all .18s;
        }
        .r-nav-back:hover { color:var(--text); border-color:#94A3B8; background:#F8FAFC; }
        .r-nav-login { font-size:13.5px; color:var(--muted); }
        .r-nav-login a { color:var(--green); font-weight:600; text-decoration:none; margin-left:5px; }
        .r-nav-login a:hover { text-decoration:underline; }

        /* Form body */
        .r-body {
          flex:1; display:flex; align-items:center; justify-content:center;
          padding:24px 52px; animation:up .45s ease both;
        }
        .form-wrap { width:100%; max-width:420px; }

        /* Step kicker */
        .form-kicker {
          display:inline-flex; align-items:center; gap:7px;
          font-size:11.5px; font-weight:700; color:#92400E;
          text-transform:uppercase; letter-spacing:1px;
          background:#FEF3C7; border:1px solid #FDE68A;
          border-radius:50px; padding:4px 12px; margin-bottom:16px;
        }
        .kd { width:6px; height:6px; border-radius:50%; background:var(--gold); animation:pulse 2s infinite; }

        .form-h1 {
          font-family:'Playfair Display',serif;
          font-size:clamp(26px,3vw,36px); font-weight:900;
          color:var(--text); line-height:1.12; letter-spacing:-.3px; margin-bottom:6px;
        }
        .form-h1 em { font-style:italic; color:var(--gold); }
        .form-sub { font-size:15px; color:var(--muted); line-height:1.8; margin-bottom:22px; }

        /* Fields */
        .fg { margin-bottom:14px; }
        .fl { display:flex; align-items:center; justify-content:space-between; margin-bottom:7px; }
        .fl-t { font-size:15px; font-weight:600; color:var(--text); }
        .fl-opt { font-size:12px; font-weight:400; color:#9BA8C0; margin-left:5px; }
        .fl-a { font-size:13.5px; color:var(--green); font-weight:500; text-decoration:none; transition:opacity .18s; }
        .fl-a:hover { opacity:.7; }

        .iw { position:relative; }
        .ii { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#94A3B8; display:flex; pointer-events:none; }
        .fi {
          width:100%; height:46px; padding:0 14px 0 40px;
          border:1.5px solid var(--border); border-radius:10px;
          font-size:15px; font-family:'DM Sans',sans-serif;
          color:var(--text); background:#FAFBFC;
          outline:none; transition:border-color .18s,box-shadow .18s,background .18s;
        }
        .fi::placeholder { color:#CBD5E1; }
        .fi:focus { border-color:var(--gold); background:var(--white); box-shadow:0 0 0 3px rgba(201,168,76,.11); }
        .ir {
          position:absolute; right:5px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; color:#94A3B8;
          padding:8px; border-radius:7px; display:flex; align-items:center;
          transition:color .18s,background .18s;
        }
        .ir:hover { color:var(--text); background:#F1F5F9; }
        .fi-hint { margin-top:5px; font-size:12px; color:#9BA8C0; display:flex; align-items:center; gap:5px; }
        .fi-hint .hi { color:var(--green); font-weight:600; }

        /* 2-col grid */
        .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

        /* Goal cards */
        .goals-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px; }
        .goal-card {
          padding:14px 14px 12px; border-radius:12px; border:1.5px solid var(--border);
          background:#fff; cursor:pointer; text-align:left;
          display:flex; flex-direction:column; gap:5px;
          transition:all .22s cubic-bezier(.16,1,.3,1);
        }
        .goal-card:hover { border-color:#94A3B8; transform:translateY(-2px); box-shadow:0 4px 16px rgba(15,28,53,.08); }
        .goal-card.selected { border-color:var(--gold); background:#FFFDF5; box-shadow:0 4px 18px rgba(201,168,76,.15); }
        .goal-top { display:flex; align-items:center; justify-content:space-between; }
        .goal-ic { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .goal-check {
          width:18px; height:18px; border-radius:50%; border:1.5px solid var(--border);
          display:flex; align-items:center; justify-content:center; transition:all .2s;
        }
        .goal-card.selected .goal-check { background:var(--gold); border-color:var(--gold); }
        .goal-label { font-size:14px; font-weight:700; color:var(--text); }
        .goal-desc  { font-size:12px; color:var(--muted); line-height:1.4; }

        /* Info note */
        .info-note {
          display:flex; align-items:flex-start; gap:9px;
          padding:11px 14px; background:rgba(0,168,120,.06);
          border:1px solid rgba(0,168,120,.18); border-radius:10px;
          font-size:13px; color:#3D8B70; line-height:1.55; margin-bottom:18px;
        }
        .info-note svg { flex-shrink:0; margin-top:1px; }

        /* Buttons */
        .btn-row { display:flex; gap:10px; }
        .btn-back {
          height:50px; padding:0 20px;
          background:#fff; border:1.5px solid var(--border); border-radius:10px;
          cursor:pointer; font-size:13.5px; font-weight:600; font-family:'DM Sans',sans-serif;
          color:var(--text); transition:all .18s;
          display:flex; align-items:center; justify-content:center; gap:6px;
        }
        .btn-back:hover { border-color:#94A3B8; background:#F8FAFC; }
        .btn-next {
          flex:1; height:50px;
          background:var(--navy); color:#fff; border:none; border-radius:10px;
          cursor:pointer; font-size:13.5px; font-weight:700; font-family:'DM Sans',sans-serif;
          letter-spacing:.1px; transition:all .22s;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .btn-next:hover:not(:disabled) { background:var(--navy-2); transform:translateY(-2px); box-shadow:0 8px 22px rgba(15,28,53,.26); }
        .btn-next:active:not(:disabled) { transform:none; box-shadow:none; }
        .btn-next:disabled { opacity:.48; cursor:not-allowed; }

        .btn-start {
          flex:1; height:50px;
          background:var(--green); color:#fff; border:none; border-radius:10px;
          cursor:pointer; font-size:13.5px; font-weight:700; font-family:'DM Sans',sans-serif;
          transition:all .22s;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .btn-start:hover:not(:disabled) { background:#007A58; transform:translateY(-2px); box-shadow:0 8px 22px rgba(0,168,120,.28); }
        .btn-start:active:not(:disabled) { transform:none; box-shadow:none; }
        .btn-start:disabled { opacity:.48; cursor:not-allowed; }

        /* Footer */
        .r-foot {
          display:flex; align-items:center; justify-content:center;
          gap:22px; flex-wrap:wrap;
          padding:18px 52px; border-top:1px solid var(--border); flex-shrink:0;
        }
        .trust { display:inline-flex; align-items:center; gap:6px; font-size:12.5px; color:var(--muted); font-weight:700; }

        .form-footer { margin-top:20px; text-align:center; font-size:13.5px; color:var(--muted); }
        .form-footer a { color:var(--green); font-weight:600; text-decoration:none; }
        .form-footer a:hover { text-decoration:underline; }

        /* Step animation */
        .step-content { animation:fadeIn .3s ease both; }

        /* Mobile bar */
        .m-bar {
          display:none; background:var(--navy);
          padding:13px 20px; align-items:center; justify-content:space-between;
          border-bottom:1px solid rgba(255,255,255,.08);
        }
        .m-bar-chip { background:var(--white); border-radius:9px; padding:5px 11px; display:flex; align-items:center; }
        .m-bar-tag { font-size:12px; color:rgba(255,255,255,.33); }

        @media (max-width:900px) {
          .shell { grid-template-columns:1fr; height:auto; overflow:visible; }
          .panel-l { display:none; }
          .m-bar { display:flex; }
          .panel-r { height:auto; min-height:calc(100svh - 54px); overflow:visible; }
          .r-nav { padding:14px 20px; }
          .r-body { padding:24px 20px; align-items:flex-start; }
          .r-foot { padding:14px 20px; gap:16px; }
          .form-wrap { max-width:100%; }
        }
        @media (max-width:480px) {
          .r-nav  { padding:13px 16px; }
          .r-body { padding:20px 16px; }
          .r-foot { padding:14px 16px; }
          .grid-2 { grid-template-columns:1fr; }
          .goals-grid { grid-template-columns:1fr 1fr; }
          .form-h1 { font-size:28px; }
          .fi { font-size:15px; }
          .btn-row { flex-direction:column; }
          .btn-back { width:100%; }
        }
        @media (max-width:360px) {
          .goals-grid { grid-template-columns:1fr; }
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
              Đăng ký <em>miễn phí</em><br />
              bắt đầu với <em className="teal">AI</em>
            </h2>
            <p className="pl-desc">
              Tạo tài khoản trong 60 giây. AI Gemini sẽ lập lộ trình học
              riêng cho bạn ngay sau Level Test.
            </p>

            {/* Step tracker */}
            <div className="step-track">
              {STEPS.map((s, i) => (
                <div key={s.num}>
                  <div className="step-row">
                    <div className={`step-circle ${step > s.num ? 'done' : step === s.num ? 'active' : 'idle'}`}>
                      {step > s.num
                        ? <CheckCircle2 size={16} strokeWidth={2.5} />
                        : <span>{s.num}</span>
                      }
                    </div>
                    <div className="step-meta">
                      <h4 className={step < s.num ? 'idle-txt' : ''}>{s.title}</h4>
                      <p>{s.sub}</p>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`step-connector ${step > s.num ? 'done-c' : 'idle-c'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="feat-list" style={{ marginTop: 20 }}>
              {FEATURES.map(({ Icon, color, bg, text }, i) => (
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

          {/* Top nav */}
          <nav className="r-nav">
            <Link href="/" className="r-nav-back">
              <ArrowLeft size={14} strokeWidth={2} />
              Trang chủ
            </Link>
            <span className="r-nav-login">
              Đã có tài khoản?
              <Link href="/login">Đăng nhập</Link>
            </span>
          </nav>

          {/* Form body */}
          <div className="r-body">
            <div className="form-wrap">

              <div className="form-kicker">
                <span className="kd" />
                Bước {step} / 3
              </div>

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <div className="step-content">
                  <h1 className="form-h1">Tạo <em>tài khoản</em></h1>
                  <p className="form-sub">Đăng ký với email. MSSV giúp xác thực sinh viên ĐH Thái Bình.</p>

                  {/* Email */}
                  <div className="fg">
                    <div className="fl"><span className="fl-t">Email</span></div>
                    <div className="iw">
                      <span className="ii"><Mail size={16} strokeWidth={1.8} /></span>
                      <input className="fi" type="email" value={form.email}
                        onChange={e => update('email', e.target.value)}
                        placeholder="nguyenvana@gmail.com"
                        autoComplete="email" inputMode="email" />
                    </div>
                  </div>

                  {/* MSSV */}
                  <div className="fg">
                    <div className="fl">
                      <span className="fl-t">Mã số sinh viên <span className="fl-opt">(không bắt buộc)</span></span>
                    </div>
                    <div className="iw">
                      <span className="ii"><CreditCard size={16} strokeWidth={1.8} /></span>
                      <input className="fi" type="text" value={form.mssv}
                        onChange={e => update('mssv', e.target.value)}
                        placeholder="VD: SV2021001"
                        style={{ fontFamily: 'monospace', letterSpacing: '.05em' }} />
                    </div>
                    <p className="fi-hint">Nhập MSSV để nhận nhãn <span className="hi">✓ Sinh viên đã xác thực</span></p>
                  </div>

                  {/* Password */}
                  <div className="fg">
                    <div className="fl"><span className="fl-t">Mật khẩu</span></div>
                    <div className="iw">
                      <span className="ii"><Lock size={16} strokeWidth={1.8} /></span>
                      <input className="fi" type={showPw ? 'text' : 'password'}
                        value={form.password} onChange={e => update('password', e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        style={{ paddingRight: 44 }} autoComplete="new-password" />
                      <button type="button" className="ir"
                        onClick={() => setShowPw(!showPw)}
                        aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                        {showPw ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm */}
                  <div className="fg">
                    <div className="fl"><span className="fl-t">Xác nhận mật khẩu</span></div>
                    <div className="iw">
                      <span className="ii"><ShieldCheck size={16} strokeWidth={1.8} /></span>
                      <input className="fi" type={showCPw ? 'text' : 'password'}
                        value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        style={{ paddingRight: 44 }} autoComplete="new-password" />
                      <button type="button" className="ir"
                        onClick={() => setShowCPw(!showCPw)}
                        aria-label={showCPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                        {showCPw ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                      </button>
                    </div>
                  </div>

                  <button className="btn-next" style={{ width:'100%', marginTop:6 }}
                    onClick={handleNextStep1} disabled={loading}>
                    {loading
                      ? <><Loader2 size={17} strokeWidth={2} style={{ animation:'spin 1s linear infinite' }} />Đang kiểm tra...</>
                      : <>Tiếp theo <ArrowRight size={16} strokeWidth={2.2} /></>
                    }
                  </button>

                  <p className="form-footer">
                    Đã có tài khoản? <Link href="/login">Đăng nhập →</Link>
                  </p>
                </div>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <div className="step-content">
                  <h1 className="form-h1">Hồ sơ <em>cá nhân</em></h1>
                  <p className="form-sub">Thông tin này giúp AI cá nhân hóa lộ trình học của bạn.</p>

                  <div className="fg">
                    <div className="fl"><span className="fl-t">Họ và tên đầy đủ</span></div>
                    <div className="iw">
                      <span className="ii"><User size={16} strokeWidth={1.8} /></span>
                      <input className="fi" type="text" value={form.hoTen}
                        onChange={e => update('hoTen', e.target.value)}
                        placeholder="Nguyễn Văn An" autoComplete="name" />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="fg">
                      <div className="fl"><span className="fl-t">Lớp <span className="fl-opt">(tuỳ chọn)</span></span></div>
                      <div className="iw">
                        <span className="ii"><GraduationCap size={16} strokeWidth={1.8} /></span>
                        <input className="fi" type="text" value={form.lop}
                          onChange={e => update('lop', e.target.value)}
                          placeholder="CNTT-K15" />
                      </div>
                    </div>
                    <div className="fg">
                      <div className="fl"><span className="fl-t">Khoa <span className="fl-opt">(tuỳ chọn)</span></span></div>
                      <div className="iw">
                        <span className="ii"><Building2 size={16} strokeWidth={1.8} /></span>
                        <input className="fi" type="text" value={form.khoa}
                          onChange={e => update('khoa', e.target.value)}
                          placeholder="CNTT" />
                      </div>
                    </div>
                  </div>

                  <div className="info-note">
                    <ShieldCheck size={15} strokeWidth={2} color="#00A878" />
                    Thông tin của bạn được bảo mật và chỉ dùng để cá nhân hóa trải nghiệm học tập.
                  </div>

                  <div className="btn-row">
                    <button className="btn-back" onClick={() => setStep(1)}>
                      <ArrowLeft size={15} strokeWidth={2} />
                      Quay lại
                    </button>
                    <button className="btn-next"
                      onClick={() => { if (form.hoTen.trim()) setStep(3); else toast.error('Vui lòng nhập họ tên') }}>
                      Tiếp theo <ArrowRight size={16} strokeWidth={2.2} />
                    </button>
                  </div>

                  <p className="form-footer">
                    Đã có tài khoản? <Link href="/login">Đăng nhập →</Link>
                  </p>
                </div>
              )}

              {/* ── STEP 3 ── */}
              {step === 3 && (
                <div className="step-content">
                  <h1 className="form-h1">Mục tiêu <em>học tập</em></h1>
                  <p className="form-sub">AI sẽ lập lộ trình riêng cho bạn dựa trên mục tiêu này. Có thể thay đổi sau.</p>

                  <div className="goals-grid">
                    {GOALS.map(g => {
                      const Icon = g.icon
                      return (
                        <button key={g.value}
                          className={`goal-card${form.mucTieu === g.value ? ' selected' : ''}`}
                          onClick={() => update('mucTieu', g.value)}>
                          <div className="goal-top">
                            <div className="goal-ic" style={{ background: g.bg }}>
                              <Icon size={18} color={g.color} strokeWidth={2} />
                            </div>
                            <div className="goal-check">
                              {form.mucTieu === g.value && (
                                <CheckCircle2 size={14} color="#C9A84C" strokeWidth={2.5} />
                              )}
                            </div>
                          </div>
                          <div className="goal-label">{g.label}</div>
                          <div className="goal-desc">{g.desc}</div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="info-note">
                    <Bot size={15} strokeWidth={2} color="#00A878" />
                    Sau khi đăng ký, bạn sẽ làm Level Test ~20 phút để AI xác định trình độ chính xác hơn.
                  </div>

                  <div className="btn-row">
                    <button className="btn-back" onClick={() => setStep(2)}>
                      <ArrowLeft size={15} strokeWidth={2} />
                      Quay lại
                    </button>
                    <button className="btn-start" onClick={handleRegister} disabled={loading}>
                      {loading
                        ? <><Loader2 size={17} strokeWidth={2} style={{ animation:'spin 1s linear infinite' }} />Đang tạo...</>
                        : <><Rocket size={16} strokeWidth={2} />Bắt đầu học ngay!</>
                      }
                    </button>
                  </div>

                  <p className="form-footer">
                    Đã có tài khoản? <Link href="/login">Đăng nhập →</Link>
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Footer */}
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