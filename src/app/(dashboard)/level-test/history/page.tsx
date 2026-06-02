'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  History, Trophy, Target, ArrowLeft, RotateCcw,
  Headphones, BookOpen, PenLine, Mic, FileText,
  ChevronDown, ChevronUp, Loader2, CalendarDays,
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
  blue:     '#2B6CB0',
  violet:   '#6478F0',
  rose:     '#F06464',
  border:   'rgba(201,168,76,0.18)',
  text:     '#1A1E2E',
  textMid:  '#4A5568',
  textLt:   '#94A3B8',
}

const CEFR_COLOR: Record<string, string> = {
  A1: '#94A3B8', A2: '#0284C7', B1: '#059669',
  B2: '#D97706', C1: '#7C3AED', C2: '#DB2777',
}
const CEFR_TITLE: Record<string, string> = {
  A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate',
  B2: 'Upper-Intermediate', C1: 'Advanced', C2: 'Proficient',
}
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const SKILL_META = [
  { key: 'trinh_do_listening', label: 'Listening', icon: Headphones, color: '#2B6CB0' },
  { key: 'trinh_do_reading',   label: 'Reading',   icon: BookOpen,   color: '#00A878' },
  { key: 'trinh_do_writing',   label: 'Writing',   icon: PenLine,    color: '#C9A84C' },
  { key: 'trinh_do_speaking',  label: 'Speaking',  icon: Mic,        color: '#6478F0' },
  { key: 'trinh_do_grammar',   label: 'Grammar',   icon: FileText,   color: '#F06464' },
] as const

interface HistoryRecord {
  id: string
  created_at: string
  trinh_do_tong_the: string
  trinh_do_listening: string | null
  trinh_do_reading: string | null
  trinh_do_writing: string | null
  trinh_do_speaking: string | null
  trinh_do_grammar: string | null
  diem_so: number | null
  chu_de: string | null
  lo_trinh_de_xuat_json: Record<string, unknown> | null
}

function CEFRBadge({ level }: { level: string }) {
  const color = CEFR_COLOR[level] || C.textLt
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
      background: `${color}12`, color, border: `1px solid ${color}28`,
      letterSpacing: '.04em', fontFamily: "'DM Sans', sans-serif",
      whiteSpace: 'nowrap',
    }}>{level}</span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const pct = score / 100
  const color = pct >= 0.75 ? C.green : pct >= 0.55 ? C.gold : pct >= 0.35 ? C.blue : C.rose
  return (
    <div style={{
      width: 52, height: 52, borderRadius: '50%',
      border: `3px solid ${color}`,
      background: `${color}10`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', flexShrink: 0,
    }}>
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: 9, color: C.textLt, fontWeight: 600, letterSpacing: '.02em' }}>/ 100</span>
    </div>
  )
}

function RecordCard({ record, index }: { record: HistoryRecord; index: number }) {
  const [open, setOpen] = useState(index === 0)
  const levelColor = CEFR_COLOR[record.trinh_do_tong_the] || C.textLt
  const date = new Date(record.created_at)
  const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const score = record.diem_so ?? 0
  const levelIdx = LEVEL_ORDER.indexOf(record.trinh_do_tong_the)

  return (
    <div style={{
      background: C.white,
      border: `1.5px solid ${open ? levelColor + '40' : C.border}`,
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: open ? '0 4px 24px rgba(15,28,53,.09)' : '0 1px 6px rgba(15,28,53,.05)',
      transition: 'all .2s',
    }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '18px 22px',
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'transparent', border: 'none', cursor: 'pointer',
          textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <ScoreBadge score={score} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 18, fontWeight: 900, color: C.navy,
            }}>
              {CEFR_TITLE[record.trinh_do_tong_the] ?? record.trinh_do_tong_the}
            </span>
            <CEFRBadge level={record.trinh_do_tong_the} />
            {index === 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: `${C.gold}18`, color: C.gold, border: `1px solid ${C.gold}30`,
                textTransform: 'uppercase', letterSpacing: '.06em',
              }}>Mới nhất</span>
            )}
          </div>

          {/* Mini CEFR bar */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {LEVEL_ORDER.map((lv, i) => (
              <div key={lv} style={{
                height: 4, borderRadius: 2, flex: 1,
                background: i <= levelIdx ? levelColor : `${C.navy}10`,
                transition: 'background .3s',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <CalendarDays size={12} color={C.textLt} strokeWidth={2} />
            <span style={{ fontSize: 12, color: C.textLt }}>{dateStr} lúc {timeStr}</span>
            {record.chu_de && (
              <>
                <span style={{ color: C.textLt, fontSize: 10 }}>·</span>
                <span style={{ fontSize: 12, color: C.textMid, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Chủ đề: {record.chu_de}
                </span>
              </>
            )}
          </div>
        </div>

        <div style={{ flexShrink: 0, color: C.textLt }}>
          {open ? <ChevronUp size={18} strokeWidth={2} /> : <ChevronDown size={18} strokeWidth={2} />}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: '0 22px 22px', borderTop: `1px solid ${C.border}` }}>
          {/* Skill breakdown */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textLt, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
              Chi tiết theo kỹ năng
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
              {SKILL_META.map(({ key, label, icon: Icon, color }) => {
                const level = record[key]
                return (
                  <div key={key} style={{
                    padding: '12px 8px', borderRadius: 14, textAlign: 'center',
                    background: C.bg, border: `1px solid ${C.border}`,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: `${color}15`, border: `1px solid ${color}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 8px',
                    }}>
                      <Icon size={15} color={color} strokeWidth={1.8} />
                    </div>
                    <div style={{ fontSize: 11, color: C.textLt, marginBottom: 4 }}>{label}</div>
                    {level
                      ? <CEFRBadge level={level} />
                      : <span style={{ fontSize: 11, color: C.textLt }}>—</span>
                    }
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI roadmap summary */}
          {record.lo_trinh_de_xuat_json && (
            <div style={{ marginTop: 16, padding: '14px 16px', background: C.goldPale, border: `1px solid ${C.border}`, borderRadius: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7a5c00', marginBottom: 6 }}>
                🎯 Mục tiêu học tập được đề xuất
              </div>
              <div style={{ fontSize: 14, color: '#5a4000', lineHeight: 1.65 }}>
                {(record.lo_trinh_de_xuat_json as any)?.lo_trinh?.muc_tieu || 'Xem chi tiết trong bài kiểm tra'}
              </div>
              {(record.lo_trinh_de_xuat_json as any)?.lo_trinh?.thoi_gian && (
                <div style={{ fontSize: 12, color: '#7a5c00', marginTop: 4 }}>
                  ⏱ Thời gian: {(record.lo_trinh_de_xuat_json as any).lo_trinh.thoi_gian}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function LevelTestHistoryPage() {
  const supabase = createClient()
  const router = useRouter()
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('NguoiDung')
        .select('ho_ten')
        .eq('id', user.id)
        .single()
      if (profile) setUserName(profile.ho_ten)

      const { data } = await supabase
        .from('KetQuaLevelTest')
        .select('*')
        .eq('nguoi_dung_id', user.id)
        .order('created_at', { ascending: false })

      setRecords(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Stats
  const latestLevel = records[0]?.trinh_do_tong_the
  const avgScore = records.length
    ? Math.round(records.reduce((s, r) => s + (r.diem_so ?? 0), 0) / records.length)
    : 0
  const bestScore = records.length
    ? Math.max(...records.map(r => r.diem_so ?? 0))
    : 0

  const GLOBAL_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to { transform: rotate(360deg); } }
    .hist-card { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) both; }

    @media(max-width:640px){
      .skill-grid { grid-template-columns: repeat(3,1fr) !important; }
      .stat-grid  { grid-template-columns: 1fr 1fr !important; }
    }
  `

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: "'DM Sans',sans-serif", color: C.gold, gap: 10, fontSize: 16 }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}}` }} />
      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải lịch sử...
    </div>
  )

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '36px clamp(14px,3vw,32px) 72px' }}>

        {/* Header */}
        <div className="hist-card" style={{ animationDelay: '0ms', marginBottom: 32 }}>
          <Link href="/level-test" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: C.textMid, textDecoration: 'none', marginBottom: 16,
            padding: '5px 12px', background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 50, fontWeight: 600,
          }}>
            <ArrowLeft size={13} strokeWidth={2} /> Quay lại kiểm tra
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 14px', background: `${C.gold}12`, border: `1px solid ${C.gold}28`, borderRadius: 50, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
                <History size={11} strokeWidth={2.5} /> Lịch sử kiểm tra
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 900, color: C.navy, margin: 0, lineHeight: 1.2, letterSpacing: '-0.5px' }}>
                Lịch sử <em style={{ fontStyle: 'italic', color: C.gold }}>Level Test</em>
              </h1>
              {userName && (
                <p style={{ fontSize: 15, color: C.textMid, marginTop: 8 }}>
                  Tất cả kết quả kiểm tra của <strong>{userName}</strong>
                </p>
              )}
            </div>
            <button
              onClick={() => router.push('/level-test')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 20px', background: C.gold, color: C.navy,
                border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 6px 20px rgba(201,168,76,.35)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <RotateCcw size={14} strokeWidth={2.2} /> Làm bài mới
            </button>
          </div>
        </div>

        {/* Stats summary — chỉ hiện khi có data */}
        {records.length > 0 && (
          <div className="hist-card stat-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14,
            marginBottom: 28, animationDelay: '60ms',
          }}>
            {[
              {
                icon: Trophy, label: 'Trình độ hiện tại',
                value: latestLevel ?? '—',
                sub: latestLevel ? (CEFR_TITLE[latestLevel] ?? '') : '',
                color: CEFR_COLOR[latestLevel ?? ''] ?? C.textLt,
              },
              {
                icon: Target, label: 'Điểm trung bình',
                value: `${avgScore}`,
                sub: `/ 100 điểm`,
                color: C.blue,
              },
              {
                icon: History, label: 'Tổng lần kiểm tra',
                value: `${records.length}`,
                sub: records.length === 1 ? 'bài kiểm tra' : 'bài kiểm tra',
                color: C.violet,
              },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} style={{
                background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 20, padding: '18px 16px', textAlign: 'center',
                boxShadow: '0 2px 10px rgba(15,28,53,.06)',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Icon size={18} color={color} strokeWidth={1.8} />
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: C.navy, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: C.textMid, marginTop: 4 }}>{sub}</div>
                <div style={{ fontSize: 11, color: C.textLt, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Records list */}
        {records.length === 0 ? (
          <div className="hist-card" style={{
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 24, padding: '52px 32px', textAlign: 'center',
            boxShadow: '0 2px 10px rgba(15,28,53,.06)',
            animationDelay: '120ms',
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: C.navy, marginBottom: 10 }}>
              Chưa có lịch sử kiểm tra
            </div>
            <p style={{ fontSize: 15, color: C.textMid, marginBottom: 28, lineHeight: 1.65 }}>
              Hãy làm bài kiểm tra đầu vào để xác định trình độ tiếng Anh của bạn<br />
              và nhận lộ trình học cá nhân từ AI.
            </p>
            <button
              onClick={() => router.push('/level-test')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 30px', background: C.gold, color: C.navy,
                border: 'none', borderRadius: 50, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 6px 22px rgba(201,168,76,.35)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Target size={16} strokeWidth={2} /> Bắt đầu kiểm tra ngay
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textLt, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
              {records.length} kết quả · Sắp xếp theo mới nhất
            </div>
            {records.map((record, i) => (
              <div key={record.id} className="hist-card" style={{ animationDelay: `${(i + 2) * 60}ms` }}>
                <RecordCard record={record} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}