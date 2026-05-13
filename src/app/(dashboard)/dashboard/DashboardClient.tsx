'use client'

// ─────────────────────────────────────────────────────────────────────────────
// DashboardClient.tsx — EnglishHub Dashboard
// Nền trắng/cream, layout dọc editorial, tông màu Navy/Gold đồng bộ Landing
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, ComposedChart,
  PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  type LucideIcon,
  Flame, BookOpen, CheckCircle2, Target, TrendingUp, TrendingDown,
  Minus, Brain, Mic, Headphones, PenLine, Eye, BarChart2,
  Award, Zap, ChevronRight, RefreshCw, Calendar,
  AlertCircle, Loader2, GraduationCap, Activity, Star,
  ArrowUpRight, ArrowDownRight, Sparkles, BookMarked,
  FileText, MessageSquare, Menu, X, Clock,
  Layers, Trophy, LayoutDashboard,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  ho_ten?: string; streak_hien_tai?: number; streak_cao_nhat?: number
  tong_so_tu_da_hoc?: number; muc_tieu_hoc?: string
  trinh_do_hien_tai?: string; diem_yeu?: string; [k: string]: unknown
}
interface VocabRow {
  trang_thai?: string | null; ngay_on_tiep_theo?: string | null
  lan_cuoi_on?: string | null
  TuVung?: { tu_tieng_anh?: string; cap_do?: string } | null
  [k: string]: unknown
}
interface ExamRow {
  id?: string; ky_nang?: string; loai_chung_chi?: string
  so_cau_dung?: number; tong_so_cau?: number
  thoi_gian_lam_bai?: number; created_at?: string
}
interface GrammarProgressRow {
  da_hoan_thanh?: boolean; diem_bai_tap?: number | null
  ngay_hoan_thanh?: string | null
  BaiHocNguPhap?: { tieu_de?: string; cap_do?: string; danh_muc?: string } | null
}
interface GrammarLessonRow { cap_do?: string | null }
interface ChatRow { created_at?: string }
interface Props {
  userId: string; profile: Profile | null
  allVocabProgress: VocabRow[]; dueTodayCount: number
  totalMastered: number; totalLearning: number; totalReview: number; totalNew: number
  streakDatesArr: string[]; recentExams: ExamRow[]; avgScoreAll: number
  allGrammarProgress: GrammarProgressRow[]; allGrammarLessons: GrammarLessonRow[]
  grammarDoneCount: number; chatHistory: ChatRow[]
}

// ─── Tokens — đồng bộ với Landing ────────────────────────────────────────────
const C = {
  navy:    '#0F1C35',
  navyMid: '#162444',
  gold:    '#C9A84C',
  goldLt:  '#E8C97A',
  goldPale:'#FDF8EE',
  cream:   '#F8F5EE',
  white:   '#FFFFFF',
  green:   '#00A878',
  greenLt: '#4ECBA8',
  violet:  '#6478F0',
  rose:    '#F06464',
  text:    '#1A1E2E',
  textMid: '#4A5568',
  border:  'rgba(201,168,76,0.2)',
  borderLight: 'rgba(0,0,0,0.06)',
}

// ─── Constants ────────────────────────────────────────────────────────────────
const RANGE_OPTS = [
  { key:'week',    label:'Tuần',   days:7   },
  { key:'month',   label:'Tháng',  days:30  },
  { key:'quarter', label:'Quý',    days:90  },
  { key:'year',    label:'Năm',    days:365 },
]
const SKILL_META: Record<string, { label:string; Icon:LucideIcon; color:string }> = {
  NGHE:     { label:'Nghe',     Icon:Headphones, color:'#0ea5e9' },
  DOC:      { label:'Đọc',      Icon:Eye,        color:C.greenLt },
  VIET:     { label:'Viết',     Icon:PenLine,    color:C.gold    },
  NOI:      { label:'Nói',      Icon:Mic,        color:C.violet  },
  TU_VUNG:  { label:'Từ vựng',  Icon:BookOpen,   color:'#ec4899' },
  NGU_PHAP: { label:'Ngữ pháp', Icon:Brain,      color:'#06b6d4' },
}
const CERT_COLORS: Record<string,string> = { VSTEP:C.greenLt, TOEIC:C.gold, APTIS:C.violet }
const LEVEL_ORDER  = ['A1','A2','B1','B2','C1','C2']
const LEVEL_COLORS = ['#94a3b8','#0ea5e9',C.greenLt,C.gold,C.violet,C.rose]

// ─── Utils ────────────────────────────────────────────────────────────────────
const pct  = (n?:number, d?:number) => (d ? Math.round(((n??0)/d)*100) : 0)
const fmt  = (n?:number) => (n??0).toLocaleString('vi-VN')
const fmtH = (s:number) => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60); return h>0?`${h}h${m}p`:`${m}p` }

function scoreColor(s:number){ return s>=80?C.green:s>=60?C.gold:C.rose }
function scoreBg(s:number){ return s>=80?'rgba(0,168,120,0.1)':s>=60?'rgba(201,168,76,0.1)':'rgba(240,100,100,0.1)' }

function filterByDays<R extends {created_at?:string}>(rows:R[], days:number):R[] {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-days)
  return rows.filter(r=>r.created_at && new Date(r.created_at)>=cutoff)
}
function groupExams(rows:ExamRow[], days:number) {
  const filtered = filterByDays(rows,days)
  const map:Record<string,{label:string;soPhien:number;totalScore:number;thoiGian:number}> = {}
  filtered.forEach(r=>{
    const d=new Date(r.created_at!)
    let key:string
    if(days<=7)       key=d.toLocaleDateString('vi-VN',{weekday:'short',day:'numeric'})
    else if(days<=30) key=`${d.getDate()}/${d.getMonth()+1}`
    else if(days<=90) key=`T${d.getMonth()+1} W${Math.ceil(d.getDate()/7)}`
    else              key=`Th${d.getMonth()+1}`
    if(!map[key]) map[key]={label:key,soPhien:0,totalScore:0,thoiGian:0}
    map[key].soPhien++
    map[key].totalScore+=pct(r.so_cau_dung,r.tong_so_cau)
    map[key].thoiGian+=r.thoi_gian_lam_bai??0
  })
  return Object.values(map).map(g=>({label:g.label,soPhien:g.soPhien,diemTB:g.soPhien?Math.round(g.totalScore/g.soPhien):0,thoiGian:Math.round(g.thoiGian/60)}))
}
function groupVocab(rows:VocabRow[]) {
  const map:Record<string,{label:string;hoc:number;onTap:number;thuanThuc:number}> = {}
  rows.forEach(r=>{
    const d=r.lan_cuoi_on??r.ngay_on_tiep_theo; if(!d) return
    const key=String(d).slice(5)
    if(!map[key]) map[key]={label:key.replace('-','/'),hoc:0,onTap:0,thuanThuc:0}
    if(r.trang_thai==='moi'||r.trang_thai==='dang_hoc') map[key].hoc++
    else if(r.trang_thai==='on_tap') map[key].onTap++
    else if(r.trang_thai==='thuan_thuc') map[key].thuanThuc++
  })
  return Object.values(map).slice(-30)
}
function weeklyHeatmap(streakDates:Set<string>) {
  const today=new Date()
  const weeks:{key:string;active:boolean;isToday:boolean}[][]=[]
  let week:{key:string;active:boolean;isToday:boolean}[]=[]
  for(let i=363;i>=0;i--){
    const d=new Date(today); d.setDate(today.getDate()-i)
    const key=d.toISOString().split('T')[0]
    week.push({key,active:streakDates.has(key),isToday:i===0})
    if(week.length===7){weeks.push(week);week=[]}
  }
  if(week.length) weeks.push(week)
  return weeks
}

// ─── Tooltip cream ────────────────────────────────────────────────────────────
function CreamTooltip({active,payload,label}:{active?:boolean;payload?:{name:string;value:number;color:string}[];label?:string}) {
  if(!active||!payload?.length) return null
  return (
    <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:'10px 14px',fontSize:12,boxShadow:'0 4px 20px rgba(15,28,53,0.12)',fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{color:C.gold,marginBottom:5,fontWeight:700,fontSize:10,letterSpacing:'0.5px',textTransform:'uppercase'}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:7,marginBottom:2}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:p.color,display:'inline-block'}}/>
          <span style={{color:C.textMid}}>{p.name}:</span>
          <span style={{color:C.navy,fontWeight:700}}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Section header — editorial style ────────────────────────────────────────
function SectionTitle({tag,title,sub}:{tag:string;title:string;sub?:string}) {
  return (
    <div style={{marginBottom:28}}>
      <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'4px 12px',background:C.goldPale,border:`1px solid ${C.border}`,borderRadius:50,fontSize:11,fontWeight:700,color:'#8B6914',textTransform:'uppercase',letterSpacing:'1px',marginBottom:10}}>
        {tag}
      </div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(22px,2.5vw,30px)',fontWeight:900,color:C.navy,lineHeight:1.2,margin:0}}>{title}</h2>
      {sub && <p style={{fontSize:14,color:C.textMid,marginTop:6,lineHeight:1.7}}>{sub}</p>}
    </div>
  )
}

// ─── Stat row — horizontal editorial ─────────────────────────────────────────
function StatRow({icon:Icon,label,value,note,color,trend}:{icon:LucideIcon;label:string;value:string;note?:string;color:string;trend?:number}) {
  const TIcon = trend===undefined?null:trend>0?ArrowUpRight:trend<0?ArrowDownRight:Minus
  const tc = trend===undefined?'':trend>0?C.green:trend<0?C.rose:'#94a3b8'
  return (
    <div style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0',borderBottom:`1px solid ${C.borderLight}`}}>
      <div style={{width:40,height:40,borderRadius:10,background:`${color}12`,border:`1px solid ${color}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <Icon size={17} color={color}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,color:C.textMid,fontWeight:500}}>{label}</div>
        {note && <div style={{fontSize:11,color:'#94a3b8',marginTop:1}}>{note}</div>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
        <span style={{fontSize:20,fontWeight:800,color:C.navy,fontFamily:"'DM Mono',monospace"}}>{value}</span>
        {TIcon&&trend!==undefined&&(
          <span style={{display:'flex',alignItems:'center',gap:2,fontSize:10,fontWeight:700,color:tc,background:`${tc}12`,padding:'2px 6px',borderRadius:5}}>
            <TIcon size={10}/>{Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgBar({label,done,total,color}:{label:string;done:number;total:number;color:string}) {
  const p=pct(done,total||1)
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{display:'inline-flex',padding:'2px 8px',borderRadius:5,background:`${color}12`,border:`1px solid ${color}28`,fontSize:10,fontWeight:700,color}}>{label}</span>
          <span style={{fontSize:11,color:C.textMid}}>{done}/{total} bài</span>
        </div>
        <span style={{fontSize:12,fontWeight:800,color,fontFamily:"'DM Mono',monospace"}}>{p}%</span>
      </div>
      <div style={{height:6,background:'rgba(0,0,0,0.06)',borderRadius:3}}>
        <div style={{width:`${p}%`,height:'100%',background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:3,transition:'width .8s ease'}}/>
      </div>
    </div>
  )
}

// ─── 52-week heatmap ──────────────────────────────────────────────────────────
function Heatmap({streakDates,streakDatesArr}:{streakDates:Set<string>;streakDatesArr:string[]}) {
  const weeks=useMemo(()=>weeklyHeatmap(streakDates),[streakDates])
  const activeDays=streakDates.size
  const longest=useMemo(()=>{
    if(!streakDatesArr.length) return 0
    const sorted=[...streakDatesArr].sort()
    let max=1,cur=1
    for(let i=1;i<sorted.length;i++){
      const diff=(new Date(sorted[i]).getTime()-new Date(sorted[i-1]).getTime())/86400000
      cur=diff===1?cur+1:1; max=Math.max(max,cur)
    }
    return max
  },[streakDatesArr])
  return (
    <div>
      <div style={{overflowX:'auto'}}>
        <div style={{display:'flex',gap:3,minWidth:560}}>
          {weeks.map((wk,wi)=>(
            <div key={wi} style={{display:'flex',flexDirection:'column',gap:3}}>
              {wk.map((c,di)=>(
                <div key={di} title={c.key} style={{
                  width:11,height:11,borderRadius:2,cursor:'default',
                  background:c.isToday?C.gold:c.active?`rgba(201,168,76,0.55)`:'rgba(0,0,0,0.07)',
                  border:c.isToday?`1px solid ${C.gold}`:'1px solid transparent',
                  transition:'transform .1s',
                }}
                  onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.5)')}
                  onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10,flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{fontSize:9,color:C.textMid}}>Ít</span>
          {[0.15,0.3,0.5,0.7,0.9].map((o,i)=>(
            <div key={i} style={{width:9,height:9,borderRadius:2,background:`rgba(201,168,76,${o})`}}/>
          ))}
          <span style={{fontSize:9,color:C.textMid}}>Nhiều</span>
        </div>
        <div style={{display:'flex',gap:20}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:15,fontWeight:800,color:C.gold,fontFamily:"'DM Mono',monospace"}}>{activeDays}</div>
            <div style={{fontSize:9,color:C.textMid}}>Ngày hoạt động</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:15,fontWeight:800,color:C.green,fontFamily:"'DM Mono',monospace"}}>{longest}</div>
            <div style={{fontSize:9,color:C.textMid}}>Streak dài nhất</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Range selector ───────────────────────────────────────────────────────────
function RangeBar({value,onChange}:{value:string;onChange:(r:string)=>void}) {
  return (
    <div style={{display:'flex',gap:3,background:C.cream,borderRadius:9,padding:3,border:`1px solid ${C.borderLight}`}}>
      {RANGE_OPTS.map(o=>(
        <button key={o.key} onClick={()=>onChange(o.key)} style={{
          padding:'5px 12px',borderRadius:7,fontSize:11,fontWeight:700,
          border:'none',cursor:'pointer',transition:'all .15s',
          fontFamily:"'DM Sans',sans-serif",
          background:value===o.key?C.gold:'transparent',
          color:value===o.key?C.navy:C.textMid,
        }}>{o.label}</button>
      ))}
    </div>
  )
}

// ─── AI Insight ───────────────────────────────────────────────────────────────
function AIInsight({profile,dueToday,totalMastered,avgScore}:{profile:Profile|null;dueToday:number;totalMastered:number;avgScore:number}) {
  const [text,setText]=useState('')
  const [loading,setLoading]=useState(false)
  const [done,setDone]=useState(false)
  const run=useCallback(async()=>{
    if(loading||!profile) return
    setLoading(true)
    try {
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',max_tokens:1000,
          messages:[{role:'user',content:`Bạn là gia sư AI chuyên nghiệp cho sinh viên học tiếng Anh tên ${profile.ho_ten}.
Dữ liệu: Mục tiêu ${profile.muc_tieu_hoc} | Trình độ ${profile.trinh_do_hien_tai} | Streak ${profile.streak_hien_tai} ngày | Từ thuần thục ${totalMastered} | Cần ôn hôm nay ${dueToday} | Điểm TB thi ${avgScore}% | Điểm yếu ${profile.diem_yeu??'chưa rõ'}.
Đưa ra đúng 3 nhận xét sắc bén (mỗi cái 1 dòng, bắt đầu bằng emoji) và 1 mục tiêu tuần này in đậm (**...**). Tối đa 100 từ tiếng Việt.`}],
        }),
      })
      const data=await res.json()
      setText(data.content?.map((b:{text?:string})=>b.text||'').join('')||'...')
      setDone(true)
    } catch { setText('Không kết nối được AI.'); setDone(true) }
    finally { setLoading(false) }
  },[loading,profile,dueToday,totalMastered,avgScore])

  return (
    <div style={{background:`linear-gradient(135deg,${C.goldPale},${C.white})`,border:`1px solid ${C.border}`,borderRadius:16,padding:24}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <div style={{width:36,height:36,borderRadius:10,background:`${C.gold}14`,border:`1px solid ${C.gold}28`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Sparkles size={16} color={C.gold}/>
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.navy}}>AI Insight</div>
          <div style={{fontSize:10,color:C.textMid}}>Phân tích cá nhân hoá từ dữ liệu thực</div>
        </div>
      </div>
      {!done?(
        <div style={{textAlign:'center',padding:'16px 0'}}>
          <p style={{fontSize:12,color:C.textMid,marginBottom:14,lineHeight:1.7}}>AI phân tích toàn bộ dữ liệu và đưa ra lời khuyên cá nhân hóa cho bạn</p>
          <button onClick={run} disabled={loading} style={{
            display:'inline-flex',alignItems:'center',gap:7,
            padding:'9px 20px',borderRadius:50,
            background:loading?`${C.gold}14`:C.gold,border:'none',
            color:loading?C.gold:C.navy,fontSize:12,fontWeight:700,
            cursor:loading?'default':'pointer',fontFamily:"'DM Sans',sans-serif",
          }}>
            {loading?<><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/> Đang phân tích...</>
                    :<><Sparkles size={13}/> Phân tích ngay</>}
          </button>
        </div>
      ):(
        <div>
          <div style={{fontSize:13,color:C.text,lineHeight:1.9,whiteSpace:'pre-line',background:C.white,borderRadius:10,padding:'12px 14px',border:`1px solid ${C.borderLight}`}}>{text}</div>
          <button onClick={()=>{setDone(false);setText('')}} style={{display:'inline-flex',alignItems:'center',gap:5,marginTop:8,padding:'4px 10px',borderRadius:6,background:'transparent',border:`1px solid ${C.borderLight}`,color:C.textMid,fontSize:10,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            <RefreshCw size={10}/> Làm mới
          </button>
        </div>
      )}
    </div>
  )
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS=[
  {key:'overview',label:'Tổng quan',  Icon:LayoutDashboard},
  {key:'vocab',   label:'Từ vựng',    Icon:BookOpen},
  {key:'exam',    label:'Luyện thi',  Icon:FileText},
  {key:'grammar', label:'Ngữ pháp',   Icon:Brain},
  {key:'time',    label:'Thời gian',  Icon:Clock},
]

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DashboardClient({
  profile,allVocabProgress,dueTodayCount,totalMastered,totalLearning,totalReview,totalNew,
  streakDatesArr,recentExams,avgScoreAll,allGrammarProgress,allGrammarLessons,grammarDoneCount,chatHistory,
}:Props) {
  const [range,setRange]=useState('month')
  const [activeTab,setActiveTab]=useState('overview')
  const [mobileMenu,setMobileMenu]=useState(false)
  const [isMobile,setIsMobile]=useState(false)

  useEffect(()=>{
    const check=()=>setIsMobile(window.innerWidth<768)
    check(); window.addEventListener('resize',check); return()=>window.removeEventListener('resize',check)
  },[])

  const rangeDays   =RANGE_OPTS.find(r=>r.key===range)?.days??30
  const streakDates =useMemo(()=>new Set(streakDatesArr),[streakDatesArr])
  const examInRange =useMemo(()=>filterByDays(recentExams,rangeDays),[recentExams,rangeDays])
  const chatInRange =useMemo(()=>filterByDays(chatHistory,rangeDays).length,[chatHistory,rangeDays])

  const avgScoreRange=useMemo(()=>{
    if(!examInRange.length) return 0
    return Math.round(examInRange.reduce((s,r)=>s+pct(r.so_cau_dung,r.tong_so_cau),0)/examInRange.length)
  },[examInRange])

  const examChartData  =useMemo(()=>groupExams(recentExams,rangeDays),[recentExams,rangeDays])
  const vocabChartData =useMemo(()=>groupVocab(allVocabProgress),[allVocabProgress])

  const bySkill=useMemo(()=>{
    const m:Record<string,{total:number;correct:number;count:number;thoiGian:number}>={}
    examInRange.forEach(r=>{
      const k=r.ky_nang??'OTHER'
      if(!m[k]) m[k]={total:0,correct:0,count:0,thoiGian:0}
      m[k].total+=r.tong_so_cau??0; m[k].correct+=r.so_cau_dung??0
      m[k].count++; m[k].thoiGian+=r.thoi_gian_lam_bai??0
    })
    return m
  },[examInRange])

  const certPie=useMemo(()=>{
    const m:Record<string,number>={}
    examInRange.forEach(r=>{m[r.loai_chung_chi??'?']=(m[r.loai_chung_chi??'?']??0)+1})
    return Object.entries(m).map(([name,value])=>({name,value,color:CERT_COLORS[name]??'#94a3b8'}))
  },[examInRange])

  const byLevel=useMemo(()=>{
    const m:Record<string,number>={}
    allVocabProgress.forEach(r=>{const lv=r.TuVung?.cap_do??'N/A';m[lv]=(m[lv]??0)+1})
    return m
  },[allVocabProgress])

  const grammarByLevel=useMemo(()=>{
    const total:Record<string,number>={},done:Record<string,number>={}
    allGrammarLessons.forEach(l=>{total[l.cap_do??'?']=(total[l.cap_do??'?']??0)+1})
    allGrammarProgress.filter(g=>g.da_hoan_thanh).forEach(g=>{const lv=g.BaiHocNguPhap?.cap_do??'?';done[lv]=(done[lv]??0)+1})
    return LEVEL_ORDER.map((lv,i)=>({lv,color:LEVEL_COLORS[i],done:done[lv]??0,total:total[lv]??0}))
  },[allGrammarProgress,allGrammarLessons])

  const radarData=useMemo(()=>Object.entries(bySkill).map(([k,v])=>({skill:SKILL_META[k]?.label??k,diemTB:pct(v.correct,v.total)})),[bySkill])

  const totalThoiGian     =useMemo(()=>recentExams.reduce((s,r)=>s+(r.thoi_gian_lam_bai??0),0),[recentExams])
  const totalThoiGianRange=useMemo(()=>examInRange.reduce((s,r)=>s+(r.thoi_gian_lam_bai??0),0),[examInRange])
  const bestExam  =useMemo(()=>examInRange.length?examInRange.reduce((b,r)=>pct(r.so_cau_dung,r.tong_so_cau)>pct(b.so_cau_dung,b.tong_so_cau)?r:b,examInRange[0]):null,[examInRange])
  const worstExam =useMemo(()=>examInRange.length?examInRange.reduce((w,r)=>pct(r.so_cau_dung,r.tong_so_cau)<pct(w.so_cau_dung,w.tong_so_cau)?r:w,examInRange[0]):null,[examInRange])
  const grammarAvg=useMemo(()=>{const d=allGrammarProgress.filter(g=>g.diem_bai_tap!=null);return d.length?Math.round(d.reduce((s,g)=>s+(g.diem_bai_tap??0),0)/d.length*10):0},[allGrammarProgress])

  const chatGrouped=useMemo(()=>{
    const map:Record<string,number>={}
    filterByDays(chatHistory,rangeDays).forEach(c=>{
      if(!c.created_at) return
      const d=new Date(c.created_at)
      const key=rangeDays<=30?`${d.getDate()}/${d.getMonth()+1}`:`T${d.getMonth()+1}`
      map[key]=(map[key]??0)+1
    })
    return Object.entries(map).map(([label,count])=>({label,count}))
  },[chatHistory,rangeDays])

  const hourDist=useMemo(()=>{
    const b=Array(24).fill(0).map((_,h)=>({hour:`${h}h`,count:0,h}))
    recentExams.forEach(r=>{if(r.created_at) b[new Date(r.created_at).getHours()].count++})
    return b.filter(b=>b.h>=5&&b.h<=23)
  },[recentExams])

  const streak=profile?.streak_hien_tai??0
  const streakMax=profile?.streak_cao_nhat??0
  const hoTen=profile?.ho_ten??'Bạn'
  const firstName=hoTen.split(' ').pop()??hoTen

  const axisTick={fontSize:10,fill:C.textMid,fontFamily:"'DM Sans',sans-serif"}
  const tooltipStyle={background:C.white,border:`1px solid ${C.border}`,borderRadius:10,fontFamily:"'DM Sans',sans-serif"}
  const g2=isMobile?'1fr':'1fr 1fr'

  // Divider component
  const Divider=()=><hr style={{border:'none',borderTop:`1px solid ${C.borderLight}`,margin:'32px 0'}}/>

  return (
    <div style={{background:C.cream,minHeight:'100vh',color:C.text,fontFamily:"'DM Sans',sans-serif"}}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{__html:`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,800&family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap');
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fi{animation:fadeUp .3s ease both}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.3);border-radius:4px}
        ::-webkit-scrollbar-track{background:transparent}
        .recharts-cartesian-grid-horizontal line,.recharts-cartesian-grid-vertical line{stroke:rgba(0,0,0,0.05)!important}
      `}}/>

      {/* ══ HEADER ══ */}
      <header style={{
        position:'sticky',top:0,zIndex:100,
        background:'rgba(255,255,255,0.95)',backdropFilter:'blur(16px)',
        borderBottom:`1px solid ${C.borderLight}`,
        boxShadow:'0 1px 12px rgba(15,28,53,0.07)',
      }}>
        <div style={{maxWidth:1280,margin:'0 auto',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(12px,3vw,28px)'}}>

          {/* Logo + greeting */}
          <div style={{display:'flex',alignItems:'center',gap:11}}>
            <div style={{
              width:34,height:34,borderRadius:9,background:C.navy,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:900,color:'#fff',flexShrink:0,
            }}>{hoTen.charAt(0)}</div>
            {!isMobile&&(
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.navy}}>Xin chào, {firstName} 👋</div>
                <div style={{fontSize:10,color:C.textMid}}>
                  <span style={{color:C.gold,fontWeight:700}}>{profile?.muc_tieu_hoc}</span>
                  {' · '}<span style={{color:C.green,fontWeight:700}}>{profile?.trinh_do_hien_tai}</span>
                  {profile?.diem_yeu&&<>{' · '}<span style={{color:C.rose}}>Yếu: {profile.diem_yeu}</span></>}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          {!isMobile&&(
            <nav style={{display:'flex',gap:2}}>
              {TABS.map(t=>(
                <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
                  display:'flex',alignItems:'center',gap:5,
                  padding:'6px 13px',borderRadius:8,fontSize:12,fontWeight:700,
                  border:'none',cursor:'pointer',transition:'all .15s',
                  fontFamily:"'DM Sans',sans-serif",
                  background:activeTab===t.key?C.navy:'transparent',
                  color:activeTab===t.key?'#fff':C.textMid,
                }}>
                  <t.Icon size={12}/>{t.label}
                </button>
              ))}
            </nav>
          )}

          {/* Right */}
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {!isMobile&&<RangeBar value={range} onChange={setRange}/>}
            <div style={{display:'flex',alignItems:'center',gap:5,padding:'5px 11px',background:C.goldPale,border:`1px solid ${C.border}`,borderRadius:50,fontSize:12,fontWeight:700,color:'#8B6914'}}>
              <Flame size={13} color={C.gold}/>
              <span style={{fontFamily:"'DM Mono',monospace"}}>{streak}</span>
              {!isMobile&&<span style={{fontWeight:400,color:C.textMid}}>ngày</span>}
            </div>
            {isMobile&&(
              <button onClick={()=>setMobileMenu(!mobileMenu)} style={{width:34,height:34,borderRadius:8,border:`1px solid ${C.borderLight}`,background:C.cream,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.textMid}}>
                {mobileMenu?<X size={16}/>:<Menu size={16}/>}
              </button>
            )}
          </div>
        </div>

        {isMobile&&mobileMenu&&(
          <div style={{borderTop:`1px solid ${C.borderLight}`,padding:'12px 16px',background:C.white}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
              {TABS.map(t=>(
                <button key={t.key} onClick={()=>{setActiveTab(t.key);setMobileMenu(false)}} style={{
                  display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:8,
                  fontSize:12,fontWeight:700,border:'none',cursor:'pointer',
                  fontFamily:"'DM Sans',sans-serif",
                  background:activeTab===t.key?C.navy:'rgba(0,0,0,0.05)',
                  color:activeTab===t.key?'#fff':C.textMid,
                }}>
                  <t.Icon size={12}/>{t.label}
                </button>
              ))}
            </div>
            <RangeBar value={range} onChange={r=>{setRange(r);setMobileMenu(false)}}/>
          </div>
        )}
      </header>

      {/* ══ MAIN ══ */}
      <main style={{maxWidth:1280,margin:'0 auto',padding:'32px clamp(12px,3vw,28px) 64px'}}>

        {/* Banner ôn tập */}
        {dueTodayCount>0&&(
          <div style={{
            display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,
            background:`linear-gradient(90deg,rgba(0,168,120,0.06),rgba(0,168,120,0.02))`,
            border:'1px solid rgba(0,168,120,0.2)',borderRadius:14,padding:'14px 20px',marginBottom:28,
          }}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:34,height:34,borderRadius:9,background:'rgba(0,168,120,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Zap size={15} color={C.green}/>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:800,color:C.green}}>{dueTodayCount} từ cần ôn tập hôm nay!</div>
                <div style={{fontSize:11,color:C.textMid}}>Ôn đúng lịch SRS giúp ghi nhớ lâu hơn 60% — Đừng bỏ lỡ!</div>
              </div>
            </div>
            <Link href="/vocabulary?mode=review" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:8,background:C.green,color:'#fff',fontSize:12,fontWeight:800,textDecoration:'none',fontFamily:"'DM Sans',sans-serif"}}>
              Ôn ngay <ChevronRight size={13}/>
            </Link>
          </div>
        )}

        {/* ════ TAB: TỔNG QUAN ════════════════════════════════════════════ */}
        {activeTab==='overview'&&(
          <div>
            {/* Phần 1: Tóm tắt học tập */}
            <SectionTitle tag="Tổng quan" title="Bức tranh học tập của bạn" sub={`Kỳ: ${RANGE_OPTS.find(r=>r.key===range)?.label} · Cập nhật thực tế`}/>

            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':g2,gap:20,marginBottom:32}}>
              {/* Cột trái: Stat rows */}
              <div style={{background:C.white,borderRadius:16,padding:'20px 24px',border:`1px solid ${C.borderLight}`}}>
                <div style={{fontSize:12,fontWeight:700,color:C.textMid,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Chỉ số học tập</div>
                <StatRow icon={Flame}        label="Streak hiện tại"    value={`🔥 ${streak} ngày`}  note={`Kỷ lục cá nhân: ${streakMax} ngày`}  color={C.gold}    trend={streak>=(streakMax*0.8)?12:-5}/>
                <StatRow icon={BookOpen}     label="Tổng từ đã học"     value={fmt(profile?.tong_so_tu_da_hoc)} note={`${dueTodayCount} từ cần ôn hôm nay`} color='#0ea5e9' trend={8}/>
                <StatRow icon={CheckCircle2} label="Tỷ lệ thuần thục"   value={`${pct(totalMastered,allVocabProgress.length||1)}%`} note={`${fmt(totalMastered)}/${fmt(allVocabProgress.length)} từ`} color={C.greenLt} trend={15}/>
                <StatRow icon={Target}       label="Điểm TB luyện thi"  value={avgScoreRange?`${avgScoreRange}%`:'—'} note={`${examInRange.length} phiên · ${RANGE_OPTS.find(r=>r.key===range)?.label}`} color={C.violet} trend={examInRange.length>0?4:undefined}/>
                <StatRow icon={Clock}        label="Thời gian học"       value={fmtH(totalThoiGianRange)} note={`Tổng tất cả: ${fmtH(totalThoiGian)}`} color={C.rose}/>
                <div style={{paddingTop:4,display:'flex',gap:16}}>
                  <div style={{textAlign:'center',flex:1}}>
                    <div style={{fontSize:16,fontWeight:800,color:C.violet,fontFamily:"'DM Mono',monospace"}}>{grammarDoneCount}/{allGrammarLessons.length}</div>
                    <div style={{fontSize:10,color:C.textMid}}>Bài ngữ pháp</div>
                  </div>
                  <div style={{textAlign:'center',flex:1}}>
                    <div style={{fontSize:16,fontWeight:800,color:'#0ea5e9',fontFamily:"'DM Mono',monospace"}}>{chatInRange}</div>
                    <div style={{fontSize:10,color:C.textMid}}>Câu AI (kỳ này)</div>
                  </div>
                  <div style={{textAlign:'center',flex:1}}>
                    <div style={{fontSize:16,fontWeight:800,color:C.gold,fontFamily:"'DM Mono',monospace"}}>{grammarAvg}%</div>
                    <div style={{fontSize:10,color:C.textMid}}>Điểm ngữ pháp TB</div>
                  </div>
                </div>
              </div>

              {/* Cột phải: AI Insight */}
              <AIInsight profile={profile} dueToday={dueTodayCount} totalMastered={totalMastered} avgScore={avgScoreAll}/>
            </div>

            <Divider/>

            {/* Phần 2: Heatmap 52 tuần */}
            <SectionTitle tag="Hoạt động" title="Lịch học 52 tuần qua"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`,marginBottom:32}}>
              <Heatmap streakDates={streakDates} streakDatesArr={streakDatesArr}/>
            </div>

            <Divider/>

            {/* Phần 3: Biểu đồ luyện thi */}
            <SectionTitle tag="Luyện thi" title="Tiến độ luyện thi" sub="Điểm trung bình và số phiên theo thời gian"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`,marginBottom:32}}>
              {examChartData.length===0?(
                <div style={{height:220,display:'flex',alignItems:'center',justifyContent:'center',color:C.textMid,fontSize:13,flexDirection:'column',gap:8}}>
                  <Activity size={28} color={C.gold} opacity={0.4}/>
                  Chưa có dữ liệu luyện thi trong kỳ này
                </div>
              ):(
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={examChartData} margin={{top:5,right:5,bottom:0,left:-22}}>
                    <defs>
                      <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.gold} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={C.gold} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="l" tick={axisTick} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="r" orientation="right" tick={axisTick} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CreamTooltip/>}/>
                    <Area yAxisId="l" type="monotone" dataKey="diemTB" name="Điểm TB(%)" stroke={C.gold} fill="url(#gD)" strokeWidth={2.5} dot={{r:3,fill:C.gold}}/>
                    <Bar yAxisId="r" dataKey="soPhien" name="Số phiên" fill={C.violet} fillOpacity={0.25} radius={[4,4,0,0]} maxBarSize={18}/>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            <Divider/>

            {/* Phần 4: Radar kỹ năng + Cert pie */}
            <SectionTitle tag="Phân tích" title="Phân tích kỹ năng & chứng chỉ"/>
            <div style={{display:'grid',gridTemplateColumns:g2,gap:20,marginBottom:32}}>
              <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`}}>
                <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:4}}>Radar kỹ năng</div>
                <div style={{fontSize:11,color:C.textMid,marginBottom:14}}>% đúng trung bình theo kỹ năng</div>
                {radarData.length<2?(
                  <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:C.textMid,fontSize:12,textAlign:'center',flexDirection:'column',gap:6}}>
                    <BarChart2 size={24} color={C.gold} opacity={0.4}/>
                    Cần ít nhất 2 kỹ năng để hiển thị
                  </div>
                ):(
                  <ResponsiveContainer width="100%" height={210}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(0,0,0,0.07)"/>
                      <PolarAngleAxis dataKey="skill" tick={{fontSize:11,fill:C.textMid,fontFamily:"'DM Sans',sans-serif"}}/>
                      <PolarRadiusAxis domain={[0,100]} tick={{fontSize:9,fill:'#94a3b8'}} tickCount={4}/>
                      <Radar name="Điểm TB" dataKey="diemTB" stroke={C.gold} fill={C.gold} fillOpacity={0.1} strokeWidth={2} dot={{r:3,fill:C.gold}}/>
                      <Tooltip formatter={(v:number)=>[`${v}%`,'Điểm TB']} contentStyle={tooltipStyle}/>
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`}}>
                <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:4}}>Phân bổ chứng chỉ</div>
                <div style={{fontSize:11,color:C.textMid,marginBottom:14}}>Số phiên thi theo loại chứng chỉ</div>
                {certPie.length===0?(
                  <div style={{height:160,display:'flex',alignItems:'center',justifyContent:'center',color:C.textMid,fontSize:12}}>Chưa có dữ liệu</div>
                ):(
                  <>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie data={certPie} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={5} strokeWidth={0}>
                          {certPie.map((d,i)=><Cell key={i} fill={d.color}/>)}
                        </Pie>
                        <Tooltip formatter={(v,n)=>[`${v} phiên`,n]} contentStyle={tooltipStyle}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
                      {certPie.map((d,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <div style={{display:'flex',alignItems:'center',gap:7}}>
                            <div style={{width:8,height:8,borderRadius:2,background:d.color}}/>
                            <span style={{fontSize:12,color:C.textMid}}>{d.name}</span>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{width:46,height:3,background:'rgba(0,0,0,0.07)',borderRadius:2}}>
                              <div style={{width:`${pct(d.value,examInRange.length)}%`,height:'100%',background:d.color,borderRadius:2}}/>
                            </div>
                            <span style={{fontSize:12,fontWeight:700,color:d.color,fontFamily:"'DM Mono',monospace"}}>{d.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <Divider/>

            {/* Phần 5: Lịch sử thi */}
            <SectionTitle tag="Lịch sử" title="Các phiên luyện thi gần nhất" sub={`${examInRange.length} phiên trong kỳ này`}/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`}}>
              {recentExams.length===0?(
                <div style={{padding:'24px 0',textAlign:'center',color:C.textMid,fontSize:13}}>
                  Chưa có phiên nào. <Link href="/exam" style={{color:C.gold,fontWeight:700}}>Luyện ngay →</Link>
                </div>
              ):(
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead>
                      <tr>
                        {['Kỹ năng','Chứng chỉ','Đúng/Tổng','Tỉ lệ','Thời gian','Ngày thi'].map((h,i)=>(
                          <th key={i} style={{textAlign:'left',padding:'8px 12px',color:C.textMid,fontWeight:600,borderBottom:`2px solid ${C.border}`,fontSize:11,letterSpacing:'0.4px',textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentExams.slice(0,10).map((r,i)=>{
                        const sc=pct(r.so_cau_dung,r.tong_so_cau)
                        const sc2=scoreColor(sc)
                        const sm=SKILL_META[r.ky_nang??'']
                        return (
                          <tr key={i} style={{borderBottom:`1px solid ${C.borderLight}`,transition:'background .15s'}}
                            onMouseEnter={e=>(e.currentTarget.style.background=C.cream)}
                            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                          >
                            <td style={{padding:'10px 12px'}}>
                              <div style={{display:'flex',alignItems:'center',gap:7}}>
                                {sm&&<sm.Icon size={13} color={sm.color}/>}
                                <span style={{color:C.navy,fontWeight:600}}>{sm?.label??r.ky_nang}</span>
                              </div>
                            </td>
                            <td style={{padding:'10px 12px'}}>
                              <span style={{display:'inline-flex',padding:'2px 8px',borderRadius:5,background:`${CERT_COLORS[r.loai_chung_chi??'']??'#94a3b8'}14`,border:`1px solid ${CERT_COLORS[r.loai_chung_chi??'']??'#94a3b8'}28`,fontSize:10,fontWeight:700,color:CERT_COLORS[r.loai_chung_chi??'']??'#94a3b8'}}>
                                {r.loai_chung_chi??'?'}
                              </span>
                            </td>
                            <td style={{padding:'10px 12px'}}>
                              <span style={{color:sc2,fontWeight:800,fontFamily:"'DM Mono',monospace"}}>{r.so_cau_dung}</span>
                              <span style={{color:C.textMid}}>/{r.tong_so_cau}</span>
                            </td>
                            <td style={{padding:'10px 12px',minWidth:110}}>
                              <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <div style={{flex:1,height:5,background:'rgba(0,0,0,0.07)',borderRadius:3}}>
                                  <div style={{width:`${sc}%`,height:'100%',background:sc2,borderRadius:3}}/>
                                </div>
                                <span style={{fontSize:12,fontWeight:800,color:sc2,fontFamily:"'DM Mono',monospace",minWidth:32}}>{sc}%</span>
                              </div>
                            </td>
                            <td style={{padding:'10px 12px',color:C.textMid,fontFamily:"'DM Mono',monospace",fontSize:12}}>
                              {r.thoi_gian_lam_bai?`${Math.round(r.thoi_gian_lam_bai/60)}p`:'—'}
                            </td>
                            <td style={{padding:'10px 12px',color:C.textMid,fontSize:12,whiteSpace:'nowrap'}}>
                              {r.created_at?new Date(r.created_at).toLocaleDateString('vi-VN',{day:'numeric',month:'short',year:'numeric'}):'—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div style={{paddingTop:14,textAlign:'right'}}>
                    <Link href="/exam" style={{fontSize:12,color:C.gold,textDecoration:'none',fontWeight:700,display:'inline-flex',alignItems:'center',gap:4}}>
                      Xem tất cả phiên thi <ChevronRight size={12}/>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ TAB: TỪ VỰNG ══════════════════════════════════════════════ */}
        {activeTab==='vocab'&&(
          <div>
            <SectionTitle tag="Từ vựng" title="Thống kê từ vựng chi tiết" sub={`Tổng ${fmt(allVocabProgress.length)} từ trong kho của bạn`}/>

            {/* Stat rows vocab */}
            <div style={{background:C.white,borderRadius:16,padding:'20px 24px',border:`1px solid ${C.borderLight}`,marginBottom:24}}>
              <StatRow icon={CheckCircle2} label="Thuần thục (≥5 lần đúng)" value={fmt(totalMastered)} note={`${pct(totalMastered,allVocabProgress.length||1)}% tổng số từ · Đạt mục tiêu`} color={C.greenLt} trend={15}/>
              <StatRow icon={BookOpen}     label="Đang học (trong vòng SRS)" value={fmt(totalLearning)} note={`${pct(totalLearning,allVocabProgress.length||1)}% tổng số từ`} color='#0ea5e9' trend={8}/>
              <StatRow icon={RefreshCw}    label="Cần ôn tập"                value={fmt(totalReview)}   note={`${pct(totalReview,allVocabProgress.length||1)}% · ${dueTodayCount} từ đến hạn hôm nay`} color={C.gold} trend={-3}/>
              <StatRow icon={BookMarked}   label="Từ mới (chưa học)"         value={fmt(totalNew)}      note={`${pct(totalNew,allVocabProgress.length||1)}% tổng số từ`} color='#94a3b8'/>
            </div>

            <Divider/>
            <SectionTitle tag="Hoạt động" title="Biểu đồ hoạt động từ vựng" sub="Từ mới / ôn tập / thuần thục theo ngày"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`,marginBottom:24}}>
              {vocabChartData.length===0?(
                <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:C.textMid,fontSize:13}}>Chưa có dữ liệu</div>
              ):(
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={vocabChartData} margin={{top:5,right:5,bottom:0,left:-22}}>
                    <defs>
                      {[{id:'vH',c:'#0ea5e9'},{id:'vO',c:C.gold},{id:'vT',c:C.greenLt}].map(g=>(
                        <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={g.c} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={g.c} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={Math.ceil(vocabChartData.length/8)}/>
                    <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CreamTooltip/>}/>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,color:C.textMid,fontFamily:"'DM Sans',sans-serif"}}/>
                    <Area type="monotone" dataKey="hoc"       name="Từ mới"     stroke="#0ea5e9" fill="url(#vH)" strokeWidth={2}/>
                    <Area type="monotone" dataKey="onTap"     name="Ôn tập"     stroke={C.gold}  fill="url(#vO)" strokeWidth={2}/>
                    <Area type="monotone" dataKey="thuanThuc" name="Thuần thục" stroke={C.greenLt} fill="url(#vT)" strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <Divider/>
            <SectionTitle tag="Cấp độ CEFR" title="Phân bổ từ vựng theo CEFR" sub="Số từ đã thêm vào mỗi cấp độ"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`,marginBottom:24}}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={LEVEL_ORDER.map((lv,i)=>({lv,soTu:byLevel[lv]??0,color:LEVEL_COLORS[i]}))} margin={{top:5,right:5,bottom:0,left:-22}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="lv" tick={axisTick} axisLine={false} tickLine={false}/>
                  <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={(v,n)=>[`${v} từ`,n]} contentStyle={tooltipStyle}/>
                  <Bar dataKey="soTu" name="Số từ" radius={[6,6,0,0]} maxBarSize={50}>
                    {LEVEL_ORDER.map((_,i)=><Cell key={i} fill={LEVEL_COLORS[i]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:12}}>
                {LEVEL_ORDER.map((lv,i)=>(
                  <div key={lv} style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:C.textMid}}>
                    <div style={{width:9,height:9,borderRadius:2,background:LEVEL_COLORS[i]}}/>
                    {lv}: <span style={{color:C.navy,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{fmt(byLevel[lv]??0)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Divider/>
            <SectionTitle tag="Heatmap" title="Lịch ôn từ vựng — 52 tuần" sub="Mỗi ô vàng = 1 ngày có ôn từ vựng"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`,marginBottom:24}}>
              <Heatmap streakDates={streakDates} streakDatesArr={streakDatesArr}/>
            </div>

            <Divider/>
            <SectionTitle tag="Sức khỏe SRS" title="Phân tích hệ thống nhắc lại SM-2" sub="Trạng thái từng nhóm từ trong vòng học"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`}}>
              {[
                {label:'Đến hạn ôn hôm nay',value:dueTodayCount,max:allVocabProgress.length||1,color:C.rose,icon:AlertCircle},
                {label:'Đã thuần thục',      value:totalMastered,max:allVocabProgress.length||1,color:C.greenLt,icon:CheckCircle2},
                {label:'Trong vòng học SRS', value:totalLearning+totalReview,max:allVocabProgress.length||1,color:'#0ea5e9',icon:RefreshCw},
                {label:'Chờ bắt đầu',        value:totalNew,max:allVocabProgress.length||1,color:'#94a3b8',icon:BookMarked},
              ].map((s,i)=>(
                <div key={i} style={{marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:7,alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <s.icon size={14} color={s.color}/>
                      <span style={{fontSize:13,color:C.text,fontWeight:600}}>{s.label}</span>
                    </div>
                    <span style={{fontSize:13,fontWeight:800,color:s.color,fontFamily:"'DM Mono',monospace"}}>
                      {fmt(s.value)} <span style={{fontSize:11,color:C.textMid,fontWeight:400}}>({pct(s.value,s.max)}%)</span>
                    </span>
                  </div>
                  <div style={{height:8,background:'rgba(0,0,0,0.06)',borderRadius:4}}>
                    <div style={{width:`${pct(s.value,s.max)}%`,height:'100%',background:`linear-gradient(90deg,${s.color}88,${s.color})`,borderRadius:4,transition:'width .8s ease'}}/>
                  </div>
                </div>
              ))}
              <div style={{marginTop:16,padding:'12px 14px',background:C.goldPale,borderRadius:10,border:`1px solid ${C.border}`,fontSize:12,color:C.text,lineHeight:1.7}}>
                💡 Ôn đúng lịch tăng tỷ lệ nhớ từ <strong style={{color:C.rose}}>20%</strong> lên <strong style={{color:C.green}}>90%</strong> sau 30 ngày. SM-2 tự tính khoảng cách ôn tối ưu cho từng từ.
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB: LUYỆN THI ════════════════════════════════════════════ */}
        {activeTab==='exam'&&(
          <div>
            <SectionTitle tag="Luyện thi" title="Thống kê luyện thi chi tiết" sub={`${examInRange.length} phiên · ${RANGE_OPTS.find(r=>r.key===range)?.label}`}/>

            {/* Summary rows */}
            <div style={{background:C.white,borderRadius:16,padding:'20px 24px',border:`1px solid ${C.borderLight}`,marginBottom:24}}>
              <StatRow icon={Target}       label="Điểm trung bình kỳ này"  value={avgScoreRange?`${avgScoreRange}%`:'—'} note={`${examInRange.length} phiên thi`} color={C.gold}/>
              <StatRow icon={TrendingUp}   label="Điểm cao nhất"            value={bestExam?`${pct(bestExam.so_cau_dung,bestExam.tong_so_cau)}%`:'—'} note={bestExam?SKILL_META[bestExam.ky_nang??'']?.label??'':''}  color={C.greenLt} trend={4}/>
              <StatRow icon={TrendingDown} label="Điểm thấp nhất"           value={worstExam?`${pct(worstExam.so_cau_dung,worstExam.tong_so_cau)}%`:'—'} note={worstExam?SKILL_META[worstExam.ky_nang??'']?.label??'':''} color={C.rose}/>
              <StatRow icon={Clock}        label="Thời gian thi kỳ này"     value={fmtH(totalThoiGianRange)} note={examInRange.length?`Trung bình: ${Math.round(totalThoiGianRange/examInRange.length/60)}p/phiên`:'Chưa có'} color={C.violet}/>
            </div>

            <Divider/>
            <SectionTitle tag="Xu hướng" title="Điểm và thời gian theo thời gian" sub="Theo dõi sự tiến bộ qua các mốc"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`,marginBottom:24}}>
              {examChartData.length===0?(
                <div style={{height:220,display:'flex',alignItems:'center',justifyContent:'center',color:C.textMid,fontSize:13}}>Chưa có dữ liệu</div>
              ):(
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={examChartData} margin={{top:5,right:10,bottom:0,left:-22}}>
                    <defs>
                      <linearGradient id="gD2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.gold} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={C.gold} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="l" tick={axisTick} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="r" orientation="right" tick={axisTick} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CreamTooltip/>}/>
                    <Area yAxisId="l" type="monotone" dataKey="diemTB" name="Điểm TB(%)" stroke={C.gold} fill="url(#gD2)" strokeWidth={2.5} dot={{r:3,fill:C.gold}} activeDot={{r:5}}/>
                    <Bar  yAxisId="r" dataKey="thoiGian" name="Thời gian(p)" fill={C.violet} fillOpacity={0.25} radius={[4,4,0,0]} maxBarSize={18}/>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            <Divider/>
            <SectionTitle tag="Theo kỹ năng" title="Điểm trung bình mỗi kỹ năng"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`,marginBottom:24}}>
              {Object.keys(bySkill).length===0?(
                <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:C.textMid,fontSize:13}}>Chưa có dữ liệu</div>
              ):(
                <>
                  <ResponsiveContainer width="100%" height={Object.keys(bySkill).length*52+40}>
                    <BarChart layout="vertical" data={Object.entries(bySkill).map(([k,v])=>({skill:SKILL_META[k]?.label??k,pct:pct(v.correct,v.total),k}))} margin={{top:0,right:20,bottom:0,left:8}}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                      <XAxis type="number" domain={[0,100]} tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                      <YAxis type="category" dataKey="skill" tick={{...axisTick,fill:C.text}} axisLine={false} tickLine={false} width={64}/>
                      <Tooltip formatter={(v:number)=>[`${v}%`,'Điểm TB']} contentStyle={tooltipStyle}/>
                      <Bar dataKey="pct" name="Điểm TB" radius={[0,7,7,0]} maxBarSize={22}>
                        {Object.keys(bySkill).map((k,i)=><Cell key={i} fill={SKILL_META[k]?.color??C.gold}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Detail rows per skill */}
                  <div style={{marginTop:20,display:'flex',flexDirection:'column',gap:12}}>
                    {Object.entries(bySkill).map(([k,v])=>{
                      const meta=SKILL_META[k]; const sc=pct(v.correct,v.total); const sc2=scoreColor(sc)
                      return (
                        <div key={k} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 14px',borderRadius:10,background:scoreBg(sc),border:`1px solid ${sc2}18`}}>
                          {meta&&<meta.Icon size={16} color={meta.color}/>}
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{meta?.label??k}</div>
                            <div style={{fontSize:11,color:C.textMid}}>{v.correct}/{v.total} câu đúng · {v.count} phiên · {Math.round(v.thoiGian/60)}p</div>
                          </div>
                          <div style={{fontSize:22,fontWeight:800,color:sc2,fontFamily:"'DM Mono',monospace"}}>{sc}%</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ════ TAB: NGỮ PHÁP ════════════════════════════════════════════ */}
        {activeTab==='grammar'&&(
          <div>
            <SectionTitle tag="Ngữ pháp" title="Tiến độ học ngữ pháp" sub={`${grammarDoneCount}/${allGrammarLessons.length} bài đã hoàn thành`}/>

            <div style={{background:C.white,borderRadius:16,padding:'20px 24px',border:`1px solid ${C.borderLight}`,marginBottom:24}}>
              <StatRow icon={Brain}        label="Bài đã hoàn thành"   value={`${grammarDoneCount}/${allGrammarLessons.length}`} note={`${pct(grammarDoneCount,allGrammarLessons.length||1)}% hoàn thành`} color={C.violet}/>
              <StatRow icon={Star}         label="Điểm TB bài tập"     value={`${grammarAvg}%`} note="Thang điểm 0–100%" color={C.gold}/>
              <StatRow icon={CheckCircle2} label="Điểm xuất sắc ≥80%"  value={fmt(allGrammarProgress.filter(g=>g.da_hoan_thanh&&(g.diem_bai_tap??0)>=8).length)} note="Số bài đạt xuất sắc" color={C.greenLt}/>
              <StatRow icon={AlertCircle}  label="Chưa hoàn thành"     value={fmt(allGrammarLessons.length-grammarDoneCount)} note="Cần hoàn thành" color={C.rose}/>
            </div>

            <Divider/>
            <SectionTitle tag="Tiến độ CEFR" title="Hoàn thành theo từng cấp độ"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`,marginBottom:24}}>
              {grammarByLevel.map(lv=><ProgBar key={lv.lv} label={lv.lv} done={lv.done} total={lv.total} color={lv.color}/>)}
            </div>

            <Divider/>
            <SectionTitle tag="Điểm theo cấp" title="Điểm bài tập trung bình mỗi cấp CEFR"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`,marginBottom:24}}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={grammarByLevel.filter(g=>g.done>0).map(g=>{
                  const d=allGrammarProgress.filter(p=>p.da_hoan_thanh&&p.BaiHocNguPhap?.cap_do===g.lv&&p.diem_bai_tap!=null)
                  return{lv:g.lv,diemTB:d.length?Math.round(d.reduce((s,p)=>s+(p.diem_bai_tap??0),0)/d.length*10):0}
                })} margin={{top:5,right:5,bottom:0,left:-22}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="lv" tick={axisTick} axisLine={false} tickLine={false}/>
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} domain={[0,100]}/>
                  <Tooltip formatter={(v:number)=>[`${v}%`,'Điểm TB']} contentStyle={tooltipStyle}/>
                  <Bar dataKey="diemTB" name="Điểm TB" radius={[6,6,0,0]} maxBarSize={50}>
                    {LEVEL_ORDER.map((_,i)=><Cell key={i} fill={LEVEL_COLORS[i]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <Divider/>
            <SectionTitle tag="Lịch sử" title="10 bài học đã hoàn thành gần nhất"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`}}>
              {allGrammarProgress.filter(g=>g.da_hoan_thanh).length===0?(
                <div style={{padding:'22px 0',textAlign:'center',color:C.textMid,fontSize:13}}>
                  Chưa hoàn thành bài nào. <Link href="/grammar" style={{color:C.gold,fontWeight:700}}>Học ngay →</Link>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {[...allGrammarProgress].filter(g=>g.da_hoan_thanh)
                    .sort((a,b)=>(b.ngay_hoan_thanh??'').localeCompare(a.ngay_hoan_thanh??''))
                    .slice(0,10).map((g,i)=>{
                      const lv=g.BaiHocNguPhap?.cap_do
                      const lc=LEVEL_COLORS[LEVEL_ORDER.indexOf(lv??'')]??'#94a3b8'
                      const sc2=scoreColor((g.diem_bai_tap??0)*10)
                      return(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',borderRadius:10,border:`1px solid ${C.borderLight}`,transition:'background .15s'}}
                          onMouseEnter={e=>(e.currentTarget.style.background=C.cream)}
                          onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                        >
                          <CheckCircle2 size={14} color={C.green} style={{flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,color:C.navy,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.BaiHocNguPhap?.tieu_de??'Bài học'}</div>
                            <div style={{fontSize:11,color:C.textMid}}>{g.BaiHocNguPhap?.danh_muc}</div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:9,flexShrink:0}}>
                            {lv&&<span style={{padding:'2px 7px',borderRadius:5,background:`${lc}12`,border:`1px solid ${lc}28`,fontSize:10,fontWeight:700,color:lc}}>{lv}</span>}
                            {g.diem_bai_tap!=null&&<span style={{fontSize:13,fontWeight:800,color:sc2,fontFamily:"'DM Mono',monospace"}}>{g.diem_bai_tap}/10</span>}
                            <span style={{fontSize:11,color:C.textMid}}>
                              {g.ngay_hoan_thanh?new Date(g.ngay_hoan_thanh).toLocaleDateString('vi-VN',{day:'numeric',month:'short'}):''}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ TAB: THỜI GIAN ════════════════════════════════════════════ */}
        {activeTab==='time'&&(
          <div>
            <SectionTitle tag="Thời gian" title="Phân tích thời gian học tập" sub="Tổng hợp từ tất cả hoạt động học tập"/>

            <div style={{background:C.white,borderRadius:16,padding:'20px 24px',border:`1px solid ${C.borderLight}`,marginBottom:24}}>
              <StatRow icon={Clock}        label="Tổng giờ học (tất cả)"   value={fmtH(totalThoiGian)}      note="Luyện thi tích lũy" color={C.gold}/>
              <StatRow icon={Clock}        label={`Giờ học (${RANGE_OPTS.find(r=>r.key===range)?.label})`} value={fmtH(totalThoiGianRange)} note={`${examInRange.length} phiên thi`} color={C.violet}/>
              <StatRow icon={Activity}     label="Trung bình mỗi phiên"    value={`${examInRange.length?Math.round(totalThoiGianRange/examInRange.length/60):0}p`} note="Phút/phiên thi" color='#0ea5e9'/>
              <StatRow icon={MessageSquare}label="Câu hỏi AI (tất cả)"     value={fmt(chatHistory.length)} note={`${chatInRange} lượt kỳ này`} color={C.greenLt}/>
            </div>

            <Divider/>
            <SectionTitle tag="Biểu đồ thời gian" title="Phút học theo kỳ" sub="Tổng thời gian luyện thi mỗi mốc"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`,marginBottom:24}}>
              {examChartData.length===0?(
                <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:C.textMid,fontSize:13}}>Chưa có dữ liệu</div>
              ):(
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={examChartData} margin={{top:5,right:5,bottom:0,left:-22}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false}/>
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} unit="p"/>
                    <Tooltip formatter={(v:number)=>[`${v} phút`,'Thời gian']} contentStyle={tooltipStyle}/>
                    <Bar dataKey="thoiGian" name="Thời gian(p)" fill={C.gold} fillOpacity={0.7} radius={[5,5,0,0]} maxBarSize={44}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <Divider/>
            <SectionTitle tag="Khung giờ học" title="Phân bổ học theo giờ trong ngày" sub="Bạn thường học lúc mấy giờ?"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`,marginBottom:24}}>
              {hourDist.every(h=>h.count===0)?(
                <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:C.textMid,fontSize:13}}>Chưa có dữ liệu</div>
              ):(
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={hourDist} margin={{top:5,right:5,bottom:0,left:-28}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                      <XAxis dataKey="hour" tick={axisTick} axisLine={false} tickLine={false} interval={2}/>
                      <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
                      <Tooltip formatter={(v:number)=>[`${v} phiên`,'Số phiên']} contentStyle={tooltipStyle}/>
                      <Bar dataKey="count" name="Số phiên" radius={[4,4,0,0]} maxBarSize={22}>
                        {hourDist.map((h,i)=>{
                          const mx=Math.max(...hourDist.map(d=>d.count))
                          return <Cell key={i} fill={h.count===mx&&mx>0?C.gold:C.navy} fillOpacity={h.count===mx&&mx>0?0.85:0.2}/>
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{fontSize:12,color:C.textMid,marginTop:8}}>
                    {(()=>{const p=hourDist.reduce((a,b)=>b.count>a.count?b:a,hourDist[0]);return p?.count>0?`🏆 Khung giờ học nhiều nhất: ${p.hour} (${p.count} phiên)`:''})()} 
                  </div>
                </>
              )}
            </div>

            <Divider/>
            <SectionTitle tag="AI Chatbot" title="Tần suất sử dụng AI theo thời gian"/>
            <div style={{background:C.white,borderRadius:16,padding:'22px 24px',border:`1px solid ${C.borderLight}`}}>
              {chatHistory.length===0?(
                <div style={{padding:'22px 0',textAlign:'center',color:C.textMid,fontSize:13}}>
                  Chưa sử dụng AI. <Link href="/ai-chat" style={{color:C.gold,fontWeight:700}}>Chat với AI →</Link>
                </div>
              ):chatGrouped.length===0?(
                <div style={{padding:'16px 0',textAlign:'center',color:C.textMid,fontSize:13}}>Không có dữ liệu trong kỳ này</div>
              ):(
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chatGrouped} margin={{top:5,right:5,bottom:0,left:-22}}>
                    <defs>
                      <linearGradient id="gChat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.greenLt} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={C.greenLt} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false}/>
                    <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={(v:number)=>[`${v} câu`,'Hỏi AI']} contentStyle={tooltipStyle}/>
                    <Area type="monotone" dataKey="count" name="Hỏi AI" stroke={C.greenLt} fill="url(#gChat)" strokeWidth={2} dot={{r:3,fill:C.greenLt}}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Module shortcuts */}
        <div style={{marginTop:40,paddingTop:28,borderTop:`1px solid ${C.border}`}}>
          <div style={{fontSize:12,fontWeight:700,color:C.textMid,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:14}}>Truy cập nhanh</div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:10}}>
            {[
              {href:'/vocabulary',Icon:BookOpen,     label:'Học từ vựng',  desc:'SRS thông minh',     color:C.greenLt},
              {href:'/grammar',   Icon:Brain,         label:'Ngữ pháp',     desc:'A1 → C1',            color:C.violet },
              {href:'/exam',      Icon:FileText,      label:'Luyện thi',    desc:'VSTEP·TOEIC·APTIS',  color:C.gold   },
              {href:'/ai-chat',   Icon:MessageSquare, label:'AI Chatbot',   desc:'Luyện nói 24/7',     color:'#0ea5e9'},
            ].map(m=>(
              <Link key={m.href} href={m.href} style={{
                display:'flex',alignItems:'center',gap:10,
                padding:'13px 15px',borderRadius:12,
                background:C.white,border:`1px solid ${C.borderLight}`,
                textDecoration:'none',transition:'all .18s',
                fontFamily:"'DM Sans',sans-serif",
              }}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLAnchorElement;el.style.background=`${m.color}08`;el.style.borderColor=`${m.color}30`;el.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLAnchorElement;el.style.background=C.white;el.style.borderColor=C.borderLight;el.style.transform='translateY(0)'}}
              >
                <div style={{width:34,height:34,borderRadius:9,background:`${m.color}12`,border:`1px solid ${m.color}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <m.Icon size={15} color={m.color}/>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{m.label}</div>
                  <div style={{fontSize:10,color:C.textMid,marginTop:1}}>{m.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}