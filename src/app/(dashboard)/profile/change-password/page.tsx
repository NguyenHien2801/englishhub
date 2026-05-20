'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Lock, Eye, EyeOff, Save, ShieldCheck, Loader2 } from 'lucide-react'

const C = {
  bg:       '#F8F5EE',
  white:    '#FFFFFF',
  navy:     '#0F1C35',
  gold:     '#C9A84C',
  goldLt:   '#E8C97A',
  green:    '#00A878',
  rose:     '#F06464',
  border:   'rgba(201,168,76,0.18)',
  textMid:  '#4A5568',
  textLt:   '#94A3B8',
}

export default function ChangePasswordPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [newPass,     setNewPass]     = useState('')
  const [confirmPass, setConfirm]     = useState('')
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving,      setSaving]      = useState(false)

  const strength =
    newPass.length === 0 ? 0
    : newPass.length < 6 ? 1
    : newPass.length < 10 ? 2
    : /[A-Z]/.test(newPass) && /[0-9]/.test(newPass) ? 4 : 3

  const strengthLabel = ['','Quá yếu','Yếu','Trung bình','Mạnh']
  const strengthColor = ['', C.rose, '#F59E0B', C.gold, C.green]
  const match = confirmPass.length > 0 && newPass === confirmPass

  async function handleSave() {
    if (newPass.length < 6)      return toast.error('Mật khẩu tối thiểu 6 ký tự')
    if (newPass !== confirmPass) return toast.error('Mật khẩu xác nhận không khớp')
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) toast.error('Đổi mật khẩu thất bại: ' + error.message)
    else { toast.success('Đã đổi mật khẩu thành công!'); setNewPass(''); setConfirm(''); router.refresh() }
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'12px 44px 12px 16px',
    borderRadius:12, border:`2px solid ${C.border}`,
    fontSize:15, fontFamily:"'DM Sans',sans-serif",
    outline:'none', boxSizing:'border-box',
    background:'#FAFAF8', color:C.navy, transition:'border .18s',
  }

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:"'DM Sans',sans-serif" }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .cp-card { animation: fadeUp .45s cubic-bezier(.16,1,.3,1) both; }
        .cp-input:focus { border-color:#C9A84C!important; background:#fff!important; }
        .cp-eyebtn { position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94A3B8;display:flex;align-items:center;padding:0; }
        .cp-eyebtn:hover { color:#C9A84C; }

        /* ── Nút lưu full-width trên mobile ── */
        @media(max-width:480px){
          .cp-save-btn { width:100%!important; justify-content:center!important; }
          .cp-card-inner { padding:20px 18px!important; }
        }
      ` }} />

      <div style={{ maxWidth:560, margin:'0 auto', padding:'36px clamp(14px,3vw,32px) 72px' }}>

        {/* ── Header ── */}
        <div className="cp-card" style={{ textAlign:'center', marginBottom:36, animationDelay:'0ms' }}>
          <h1 style={{ fontSize:'clamp(24px,3vw,36px)', fontWeight:900, color:C.navy, margin:0, fontFamily:"'Playfair Display',serif", letterSpacing:'-0.5px' }}>
            Đổi mật khẩu
          </h1>
          <p style={{ fontSize:16, color:C.textMid, marginTop:8 }}>
            Mật khẩu tối thiểu 6 ký tự
          </p>
          <div style={{ width:48, height:3, background:`linear-gradient(90deg,${C.gold},${C.goldLt})`, borderRadius:2, margin:'14px auto 0' }} />
        </div>

        {/* ── Form card ── */}
        <div className="cp-card" style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:24, boxShadow:'0 2px 12px rgba(15,28,53,.07)', animationDelay:'60ms' }}>
          <div className="cp-card-inner" style={{ padding:'clamp(20px,3vw,36px)' }}>

            {/* Section header */}
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:`${C.gold}15`, border:`1px solid ${C.gold}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Lock size={24} color={C.gold} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:C.navy, letterSpacing:'-0.2px' }}>Mật khẩu mới</div>
                <div style={{ fontSize:14, color:C.textMid, marginTop:4 }}>Nhập và xác nhận mật khẩu mới của bạn</div>
              </div>
            </div>

            {/* Input mật khẩu mới */}
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:13, fontWeight:600, color:C.textMid, display:'block', marginBottom:8 }}>
                Mật khẩu mới
              </label>
              <div style={{ position:'relative' }}>
                <input
                  className="cp-input"
                  type={showNew ? 'text' : 'password'}
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  style={inputStyle}
                />
                <button className="cp-eyebtn" onClick={() => setShowNew(o => !o)}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPass.length > 0 && (
                <div style={{ marginTop:10 }}>
                  <div style={{ display:'flex', gap:4, marginBottom:5 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i<=strength ? strengthColor[strength] : `${C.navy}10`, transition:'background .25s' }} />
                    ))}
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:strengthColor[strength] }}>
                    {strengthLabel[strength]}
                  </div>
                </div>
              )}
            </div>

            {/* Input xác nhận */}
            <div style={{ marginBottom:28 }}>
              <label style={{ fontSize:13, fontWeight:600, color:C.textMid, display:'block', marginBottom:8 }}>
                Xác nhận mật khẩu
              </label>
              <div style={{ position:'relative' }}>
                <input
                  className="cp-input"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  style={{ ...inputStyle, borderColor: confirmPass.length > 0 ? (match ? C.green : C.rose) : C.border }}
                />
                <button className="cp-eyebtn" onClick={() => setShowConfirm(o => !o)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPass.length > 0 && (
                <div style={{ fontSize:12, fontWeight:600, color: match ? C.green : C.rose, marginTop:6, display:'flex', alignItems:'center', gap:4 }}>
                  {match ? <><ShieldCheck size={13} />Mật khẩu khớp</> : '✕ Mật khẩu chưa khớp'}
                </div>
              )}
            </div>

            {/* Nút lưu */}
            <button onClick={handleSave} disabled={saving} className="cp-save-btn" style={{
              display:'inline-flex', alignItems:'center', gap:8, padding:'12px 32px',
              background: saving ? 'rgba(201,168,76,.15)' : `linear-gradient(135deg,${C.gold},${C.goldLt})`,
              color: saving ? C.gold : C.navy,
              border:'none', borderRadius:50, fontSize:15, fontWeight:700,
              cursor: saving ? 'default' : 'pointer',
              boxShadow: saving ? 'none' : `0 6px 22px rgba(201,168,76,.35)`,
              transition:'all .28s cubic-bezier(.34,1.56,.64,1)',
              fontFamily:"'DM Sans',sans-serif",
            }}>
              {saving
                ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} />Đang lưu...</>
                : <><Save size={16} />Đổi mật khẩu</>
              }
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}