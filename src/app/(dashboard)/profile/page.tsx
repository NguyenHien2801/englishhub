'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  Camera, Flame, Trophy, BookOpen,
  Target, Save, User, GraduationCap,
  BadgeCheck, Loader2,
} from 'lucide-react'

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
  border:   'rgba(201,168,76,0.18)',
  text:     '#1A1E2E',
  textMid:  '#4A5568',
  textLt:   '#94A3B8',
}

const MUC_TIEU_OPTIONS = [
  { value: 'VSTEP',   label: 'VSTEP',     desc: 'Chứng chỉ tiếng Anh Việt Nam',                 color: C.greenLt },
  { value: 'TOEIC',   label: 'TOEIC',     desc: 'Test of English for International Communication', color: C.gold   },
  { value: 'APTIS',   label: 'APTIS',     desc: 'British Council Aptis',                          color: C.violet  },
  { value: 'GENERAL', label: 'Tổng quát', desc: 'Học tiếng Anh tổng quát',                        color: C.blueLt  },
]

const LEVEL_ORDER  = ['A1','A2','B1','B2','C1','C2']
const LEVEL_COLORS = ['#94A3B8','#38BDF8','#34C897','#C9933A','#6C63D4','#E05252']

export default function ProfilePage() {
  const supabase   = createClient()
  const router     = useRouter()
  const fileRef    = useRef<HTMLInputElement>(null)

  const [profile,       setProfile]       = useState<Record<string,unknown>|null>(null)
  const [mucTieu,       setMucTieu]       = useState('VSTEP')
  const [avatarUrl,     setAvatarUrl]     = useState<string|null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string|null>(null)
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [uploadingAvt,  setUploadingAvt]  = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('NguoiDung').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setMucTieu(data.muc_tieu_hoc || 'VSTEP')
        setAvatarUrl(data.avatar_url as string || null)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setUploadingAvt(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const ext  = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = urlData.publicUrl
      await supabase.from('NguoiDung').update({ avatar_url: publicUrl }).eq('id', user.id)
      setAvatarUrl(publicUrl)
      toast.success('Đã cập nhật ảnh đại diện!')
      router.refresh()
    } catch {
      toast.error('Upload ảnh thất bại')
    } finally {
      setUploadingAvt(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('NguoiDung').update({ muc_tieu_hoc: mucTieu }).eq('id', user.id)
    if (error) toast.error('Lưu thất bại')
    else { toast.success('Đã cập nhật mục tiêu học!'); router.refresh() }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', fontFamily:"'DM Sans',sans-serif", color:C.gold, gap:10, fontSize:16 }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html:`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}` }} />
      <Loader2 size={20} style={{ animation:'spin 1s linear infinite' }} /> Đang tải...
    </div>
  )

  const hoTen        = profile?.ho_ten            as string || ''
  const mssv         = profile?.ma_sinh_vien      as string || ''
  const lop          = profile?.lop               as string || ''
  const khoa         = profile?.khoa              as string || ''
  const streak       = profile?.streak_hien_tai   as number || 0
  const highest      = profile?.streak_cao_nhat   as number || 0
  const tongTu       = profile?.tong_so_tu_da_hoc as number || 0
  const trinh        = profile?.trinh_do_hien_tai as string || 'A1'
  const levelIdx     = Math.max(0, LEVEL_ORDER.indexOf(trinh))
  const displayAvatar = avatarPreview || avatarUrl

  const stats = [
    { icon: Flame,    label: 'Streak hiện tại', value:`${streak} ngày`,  color:'#E8612A', bg:'#FFF3ED'   },
    { icon: Trophy,   label: 'Streak cao nhất', value:`${highest} ngày`, color:C.gold,    bg:C.goldPale  },
    { icon: BookOpen, label: 'Từ đã học',        value:`${tongTu} từ`,   color:C.blueLt,  bg:'#EBF4FF'   },
  ]

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:"'DM Sans',sans-serif" }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes spin   { from{transform:rotate(0)}   to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .prof-card  { animation: fadeUp .45s cubic-bezier(.16,1,.3,1) both; }
        .avt-wrap:hover .avt-overlay { opacity:1!important; }
        .goal-btn   { transition:all .2s cubic-bezier(.16,1,.3,1); }
        .goal-btn:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(15,28,53,.10)!important; }

        /* ── Stats grid: 3 cột desktop, 3 cột tablet, 1 cột mobile ── */
        .prof-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
        @media(max-width:480px){
          .prof-stats { grid-template-columns:1fr; }
        }

        /* ── Goal grid: 2 cột desktop, 1 cột mobile ── */
        .prof-goals { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:28px; }
        @media(max-width:480px){
          .prof-goals { grid-template-columns:1fr; }
        }

        /* ── Info card: flex row desktop, flex col mobile ── */
        .prof-info-row { display:flex; align-items:center; gap:clamp(18px,3vw,32px); flex-wrap:wrap; position:relative; }
        @media(max-width:520px){
          .prof-info-row { flex-direction:column; align-items:flex-start; }
          .prof-level-badge { align-self:stretch; flex-direction:row!important; justify-content:space-between; padding:12px 16px!important; }
        }

        /* ── Nút lưu full-width trên mobile ── */
        @media(max-width:480px){
          .prof-save-btn { width:100%!important; justify-content:center!important; }
        }
      ` }} />

      <div style={{ maxWidth:760, margin:'0 auto', padding:'36px clamp(14px,3vw,32px) 72px' }}>

        {/* ── Header ── */}
        <div className="prof-card" style={{ textAlign:'center', marginBottom:36, animationDelay:'0ms' }}>
          <h1 style={{ fontSize:'clamp(24px,3vw,36px)', fontWeight:900, color:C.navy, margin:0, fontFamily:"'Playfair Display',serif", letterSpacing:'-0.5px' }}>
            Hồ sơ cá nhân
          </h1>
          <p style={{ fontSize:16, color:C.textMid, marginTop:8 }}>
            Xem thông tin và cập nhật mục tiêu học tập
          </p>
          <div style={{ width:48, height:3, background:`linear-gradient(90deg,${C.gold},${C.goldLt})`, borderRadius:2, margin:'14px auto 0' }} />
        </div>

        {/* ── Avatar + Info card ── */}
        <div className="prof-card" style={{
          background:C.navy, borderRadius:24,
          border:'1px solid rgba(201,168,76,.2)',
          padding:'clamp(20px,3vw,36px)',
          marginBottom:20, position:'relative', overflow:'hidden',
          animationDelay:'60ms',
        }}>
          <div style={{ position:'absolute', top:-50, right:-50, width:220, height:220, background:'rgba(201,168,76,.06)', borderRadius:'60% 40% 30% 70%/60% 30% 70% 40%', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-40, left:-30, width:160, height:160, background:'rgba(78,203,168,.04)', borderRadius:'50%', pointerEvents:'none' }} />

          <div className="prof-info-row">
            {/* Avatar */}
            <div className="avt-wrap" style={{ position:'relative', flexShrink:0, cursor:'pointer' }} onClick={() => fileRef.current?.click()}>
              <div style={{ width:88, height:88, borderRadius:22, background: displayAvatar?'transparent':C.white, border:'3px solid rgba(201,168,76,.55)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', boxShadow:'0 8px 32px rgba(15,28,53,.35)' }}>
                {displayAvatar
                  ? <img src={displayAvatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:34, fontWeight:900, color:C.navy, fontFamily:"'Playfair Display',serif" }}>{hoTen.charAt(0)}</span>
                }
              </div>
              <div className="avt-overlay" style={{ position:'absolute', inset:0, borderRadius:22, background:'rgba(15,28,53,.62)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, opacity:0, transition:'opacity .2s' }}>
                {uploadingAvt
                  ? <Loader2 size={20} color="#fff" style={{ animation:'spin 1s linear infinite' }} />
                  : <><Camera size={20} color="#fff" /><span style={{ fontSize:11, color:'#fff', fontWeight:600 }}>Thay ảnh</span></>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange} />
            </div>

            {/* Thông tin */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 12px', background:'rgba(201,168,76,.12)', border:'1px solid rgba(201,168,76,.25)', borderRadius:50, fontSize:11, fontWeight:700, color:C.gold, textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>
                <BadgeCheck size={12} /> Sinh viên
              </div>
              <div style={{ fontSize:'clamp(18px,2.5vw,26px)', fontWeight:900, color:'#fff', fontFamily:"'Playfair Display',serif", lineHeight:1.2, marginBottom:8 }}>
                {hoTen}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 18px' }}>
                {[
                  { Icon:User,          val:mssv,  label:'MSSV' },
                  { Icon:GraduationCap, val:lop,   label:'Lớp'  },
                  { Icon:BookOpen,      val:khoa,  label:'Khoa' },
                ].filter(item => item.val).map(({ Icon, val, label }) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'rgba(255,255,255,.65)' }}>
                    <Icon size={12} color="rgba(201,168,76,.7)" strokeWidth={2} />
                    <span style={{ color:'rgba(255,255,255,.4)', marginRight:2 }}>{label}:</span>
                    <span style={{ color:'rgba(255,255,255,.85)', fontWeight:600, fontFamily:'monospace' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trình độ badge */}
            <div className="prof-level-badge" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'14px 20px', background:'rgba(255,255,255,.05)', border:'1px solid rgba(201,168,76,.2)', borderRadius:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'1px' }}>Trình độ</div>
              <div style={{ fontSize:32, fontWeight:900, color:LEVEL_COLORS[levelIdx], fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{trinh}</div>
              <div style={{ width:80 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  {LEVEL_ORDER.map((lv,i) => (
                    <div key={lv} style={{ fontSize:8, fontWeight:700, color: i<=levelIdx ? C.gold : 'rgba(255,255,255,.15)' }}>{lv}</div>
                  ))}
                </div>
                <div style={{ height:4, background:'rgba(255,255,255,.08)', borderRadius:2 }}>
                  <div style={{ width:`${((levelIdx+1)/LEVEL_ORDER.length)*100}%`, height:'100%', background:`linear-gradient(90deg,${C.greenLt},${C.gold})`, borderRadius:2, transition:'width .85s cubic-bezier(.16,1,.3,1)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="prof-card prof-stats" style={{ animationDelay:'120ms' }}>
          {stats.map(({ icon:Icon, label, value, color, bg }) => (
            <div key={label} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:20, padding:'18px 14px', textAlign:'center', boxShadow:'0 2px 12px rgba(15,28,53,.07)' }}>
              <div style={{ width:44, height:44, borderRadius:13, background:bg, border:`1px solid ${color}20`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
                <Icon size={20} color={color} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize:'clamp(16px,2.5vw,24px)', fontWeight:900, color:C.navy, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:12, color:C.textMid, marginTop:6 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Mục tiêu ── */}
        <div className="prof-card" style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:24, padding:'clamp(18px,3vw,32px)', boxShadow:'0 2px 12px rgba(15,28,53,.07)', animationDelay:'180ms' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`${C.gold}15`, border:`1px solid ${C.gold}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Target size={24} color={C.gold} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:C.navy, letterSpacing:'-0.2px' }}>Mục tiêu học tập</div>
              <div style={{ fontSize:14, color:C.textMid, marginTop:4 }}>Chọn mục tiêu để hệ thống cá nhân hoá nội dung</div>
            </div>
          </div>

          <div className="prof-goals">
            {MUC_TIEU_OPTIONS.map(opt => {
              const active = mucTieu === opt.value
              return (
                <button key={opt.value} className="goal-btn" onClick={() => setMucTieu(opt.value)} style={{
                  padding:'14px 16px', borderRadius:16, textAlign:'left', cursor:'pointer',
                  border: active ? `2px solid ${opt.color}` : `2px solid ${C.border}`,
                  background: active ? `${opt.color}0D` : '#FAFAF8',
                  boxShadow: active ? `0 4px 18px ${opt.color}22` : 'none',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background: active ? opt.color : C.textLt, transition:'background .2s', flexShrink:0 }} />
                    <span style={{ fontSize:14, fontWeight:700, color: active ? C.navy : C.textMid }}>{opt.label}</span>
                    {active && <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, color:opt.color, background:`${opt.color}15`, padding:'2px 7px', borderRadius:20 }}>Đang chọn</span>}
                  </div>
                  <div style={{ fontSize:12, color:C.textLt, paddingLeft:18 }}>{opt.desc}</div>
                </button>
              )
            })}
          </div>

          <button onClick={handleSave} disabled={saving} className="prof-save-btn" style={{
            display:'inline-flex', alignItems:'center', gap:8, padding:'12px 32px',
            background: saving ? 'rgba(201,168,76,.15)' : `linear-gradient(135deg,${C.gold},${C.goldLt})`,
            color: saving ? C.gold : C.navy,
            border:'none', borderRadius:50, fontSize:15, fontWeight:700,
            cursor: saving ? 'default' : 'pointer',
            boxShadow: saving ? 'none' : `0 6px 22px rgba(201,168,76,.35)`,
            transition:'all .28s cubic-bezier(.34,1.56,.64,1)',
          }}>
            {saving
              ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} />Đang lưu...</>
              : <><Save size={16} />Lưu thay đổi</>
            }
          </button>
        </div>

      </div>
    </div>
  )
}