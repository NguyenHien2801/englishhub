'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import FlashcardMode from '@/components/vocabulary/FlashcardMode'
import QuizMode from '@/components/vocabulary/QuizMode'
import MatchingMode from '@/components/vocabulary/MatchingMode'
import type { VocabSet, VocabWord, LearnMode } from '@/components/vocabulary/types'
import {
  BookOpen, Layers, Link2, GraduationCap, Briefcase,
  Globe2, Trophy, CheckCircle2, Search, ChevronDown, X,
} from 'lucide-react'

interface Props {
  sets: VocabSet[]
  dueWords: { TuVung: VocabWord }[]
  userId: string
}

// ── Design tokens (mirrors WritingPage) ──────────────────────────────────────
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
  slate:    '#64748B',
  border:   'rgba(201,168,76,0.18)',
  borderMd: 'rgba(201,168,76,0.30)',
  text:     '#1A1E2E',
  textMid:  '#4A5568',
  textLt:   '#94A3B8',
}

const LOAI_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  TOEIC:  { bg: '#E1F5EE', color: '#0F6E56', border: 'rgba(0,168,120,.3)' },
  VSTEP:  { bg: '#E6F1FB', color: '#185FA5', border: 'rgba(24,95,165,.3)' },
  APTIS:  { bg: '#EEEDFE', color: '#3C3489', border: 'rgba(83,74,183,.3)' },
  CHU_DE: { bg: '#FAEEDA', color: '#633806', border: 'rgba(185,117,23,.3)' },
  TU_TAO: { bg: '#F1EFE8', color: '#444441', border: 'rgba(100,100,97,.2)' },
}

const CERT_COLOR: Record<string, string> = {
  TOEIC: '#00A878',
  VSTEP: '#185FA5',
  APTIS: '#6478F0',
}
const CERT_ICON: Record<string, React.ElementType> = {
  TOEIC: Briefcase,
  VSTEP: GraduationCap,
  APTIS: Globe2,
}

const CAP_DO_LIST = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'MIXED']

const MODES: { id: LearnMode; icon: React.ElementType; label: string; desc: string }[] = [
  { id: 'flashcard', icon: BookOpen, label: 'Flashcard', desc: 'Lật thẻ · SRS Anki' },
  { id: 'quiz',      icon: Layers,   label: 'Quiz',      desc: '4 đáp án trắc nghiệm' },
  { id: 'matching',  icon: Link2,    label: 'Matching',  desc: 'Nối từ với nghĩa' },
]

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes blobMorph {
    0%,100%{border-radius:60% 40% 30% 70% / 60% 30% 70% 40%}
    50%{border-radius:30% 60% 70% 40% / 50% 60% 30% 60%}
  }
  .fade-in { animation: fadeUp .42s cubic-bezier(.16,1,.3,1) both; }
  .vocab-card {
    transition: all .35s cubic-bezier(.16,1,.3,1);
    position: relative; overflow: hidden;
  }
  .vocab-card::after {
    content:''; position:absolute; bottom:0; left:0;
    width:0; height:3px;
    background: #C9A84C;
    transition: width .35s cubic-bezier(.16,1,.3,1);
    border-radius: 0 0 24px 24px;
  }
  .vocab-card:hover { transform: translateY(-6px) scale(1.01); border-color: rgba(201,168,76,.45) !important; box-shadow: 0 24px 48px rgba(15,28,53,.13) !important; }
  .vocab-card:hover::after { width: 100%; }
  .mode-btn { transition: all .25s cubic-bezier(.16,1,.3,1); }
  .mode-btn:hover { transform: translateX(4px); border-color: rgba(201,168,76,.5) !important; background: #FDF8EE !important; }
  .review-btn { transition: all .28s cubic-bezier(.34,1.56,.64,1); }
  .review-btn:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 10px 28px rgba(201,168,76,.45) !important; }
  .filter-pill { transition: all .2s; }
  input[type=text]:focus, select:focus { outline: none; border-color: rgba(201,168,76,.6) !important; box-shadow: 0 0 0 3px rgba(201,168,76,.12); }
`

// ── Shared atoms ──────────────────────────────────────────────────────────────
function LoaiBadge({ loai }: { loai: string }) {
  const s = LOAI_COLOR[loai] ?? { bg: '#F1EFE8', color: '#444441', border: 'rgba(100,100,97,.2)' }
  return (
    <span style={{
      padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '.04em', fontFamily: "'DM Sans', sans-serif",
    }}>{loai}</span>
  )
}

function CapDoBadge({ cap }: { cap: string }) {
  const isHigh = ['C1','C2'].includes(cap)
  const isMid  = ['B1','B2'].includes(cap)
  const bg    = isHigh ? '#FAEEDA' : isMid ? '#E6F1FB' : '#E1F5EE'
  const color = isHigh ? '#633806' : isMid ? '#185FA5' : '#0F6E56'
  const bdr   = isHigh ? 'rgba(185,117,23,.3)' : isMid ? 'rgba(24,95,165,.3)' : 'rgba(0,168,120,.3)'
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
      background: bg, color, border: `1px solid ${bdr}`,
      letterSpacing: '.04em', fontFamily: "'DM Sans', sans-serif",
    }}>{cap}</span>
  )
}

export default function VocabularyClient({ sets, dueWords, userId }: Props) {
  const supabase = createClient()

  const [activeMode, setActiveMode]   = useState<LearnMode | null>(null)
  const [activeSet, setActiveSet]     = useState<VocabSet | null>(null)
  const [activeWords, setActiveWords] = useState<VocabWord[]>([])
  const [loadingId, setLoadingId]     = useState<string | null>(null)
  const [pendingSet, setPendingSet]       = useState<VocabSet | null>(null)
  const [inSessionSet, setInSessionSet]   = useState<VocabSet | null>(null)
  const [filterLoai, setFilterLoai]   = useState('all')
  const [filterCap, setFilterCap]     = useState('all')
  const [search, setSearch]           = useState('')

  const loaiList = Array.from(new Set(sets.map(s => s.loai_bo)))
  const filtered = sets.filter(s => {
    if (filterLoai !== 'all' && s.loai_bo !== filterLoai) return false
    if (filterCap  !== 'all' && s.cap_do   !== filterCap)  return false
    if (search && !s.ten_bo.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function loadWords(setId: string): Promise<VocabWord[]> {
    const { data: tuVungList, error: e1 } = await supabase
      .from('TuVung')
      .select('id, tu_tieng_anh, loai_tu, cap_do, thu_tu_hien_thi')
      .eq('bo_du_vung_id', setId)
      .order('thu_tu_hien_thi')
    if (e1) throw e1
    if (!tuVungList?.length) return []

    const wordIds   = tuVungList.map(w => w.id)
    const wordNames = tuVungList.map(w => w.tu_tieng_anh)

    const [{ data: cacheList }, { data: tienDoList }] = await Promise.all([
      supabase.from('TuVungCache').select('*').in('tu_tieng_anh', wordNames),
      supabase.from('TienDoHocTuVung').select('*').eq('nguoi_dung_id', userId).in('tu_vung_id', wordIds),
    ])

    const cacheMap  = Object.fromEntries((cacheList || []).map(c => [c.tu_tieng_anh, c]))
    const tienDoMap: Record<string, VocabWord['TienDoHocTuVung']> = {}
    for (const td of (tienDoList || [])) {
      if (!tienDoMap[td.tu_vung_id]) tienDoMap[td.tu_vung_id] = []
      tienDoMap[td.tu_vung_id].push(td)
    }

    return tuVungList.map(w => ({
      ...w,
      TuVungCache: cacheMap[w.tu_tieng_anh] ?? null,
      TienDoHocTuVung: tienDoMap[w.id] ?? [],
    }))
  }

  function openModePicker(set: VocabSet) { setPendingSet(set) }
  function closeModePicker()              { setPendingSet(null) }

  async function startMode(mode: LearnMode, set: VocabSet, words?: VocabWord[]) {
    closeModePicker()
    if (!words) {
      setLoadingId(set.id)
      try { words = await loadWords(set.id) }
      catch { toast.error('Lỗi tải từ vựng!'); setLoadingId(null); return }
      setLoadingId(null)
    }
    if (words.length === 0) { toast.error('Bộ từ này chưa có từ nào!'); return }
    setActiveSet(set); setActiveWords(words); setActiveMode(mode); setInSessionSet(set)
  }

  function startReview(mode: LearnMode) {
    if (!dueWords.length) { toast.success('Không có từ nào cần ôn hôm nay! 🎉'); return }
    const reviewSet: VocabSet = {
      id: '__review__', ten_bo: 'Ôn tập hôm nay', mo_ta: null,
      loai_bo: '', cap_do: null, chu_de: null, tong_so_tu: dueWords.length,
    }
    startMode(mode, reviewSet, dueWords.map(d => d.TuVung))
  }

function handleBack()        { setActiveMode(null); setActiveSet(null); setActiveWords([]) }
function handleBackToModes() { setActiveMode(null); setPendingSet(inSessionSet) }

  // ── Active session ──────────────────────────────────────────────────────────
  if (activeMode && activeSet) {
    const props = {
      words: activeWords, setTitle: activeSet.ten_bo, userId,
      isReviewMode: activeSet.id === '__review__',
      onBack: handleBack,
      onBackToModes: handleBackToModes,
    }
    if (activeMode === 'flashcard') return <FlashcardMode {...props} />
    if (activeMode === 'quiz')      return <QuizMode      {...props} />
    if (activeMode === 'matching')  return <MatchingMode  {...props} />
  }

  // group by loai_bo (same pattern as WritingPage groups by cert)
  const grouped = filtered.reduce((acc, s) => {
    const key = s.loai_bo || 'Khác'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {} as Record<string, VocabSet[]>)

  const doneCount = 0 // placeholder — extend with SRS progress if available

  // ── Browse ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 36, paddingBottom: 80, fontFamily: "'DM Sans', sans-serif" }}>
      <style suppressHydrationWarning>{GLOBAL_CSS}</style>

      {/* ── Hero (mirrors WritingPage hero) ─────────────────────────────── */}
      <div style={{
        background: C.navy, borderRadius: 28,
        padding: 'clamp(32px,4vw,52px) clamp(28px,4vw,52px)',
        marginBottom: 40, position: 'relative', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(15,28,53,.25)',
      }}>
        <div style={{ position: 'absolute', top: -70, right: -70, width: 320, height: 320, background: 'rgba(201,168,76,.07)', borderRadius: '60% 40% 30% 70%', animation: 'blobMorph 10s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(24px)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, background: 'rgba(0,168,120,.06)', borderRadius: '40% 60%', pointerEvents: 'none', filter: 'blur(28px)' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.28)', borderRadius: 50, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 20 }}>
          <BookOpen size={11} strokeWidth={2.5} /> Luyện từ vựng
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,4.5vw,52px)', fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
          Vocabulary <em style={{ fontStyle: 'italic', color: C.gold }}>SRS</em>
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,.52)', maxWidth: 520, lineHeight: 1.78, marginBottom: 32 }}>
          {sets.length} bộ từ · Flashcard SRS Anki · Quiz · Matching — học thông minh hơn mỗi ngày
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: dueWords.length ? 28 : 0 }}>
          {[
            { label: 'Bộ từ',         val: sets.length,    icon: <Layers size={18} strokeWidth={1.8} color={C.goldLt} /> },
            { label: 'Đã học',        val: doneCount,      icon: <CheckCircle2 size={18} strokeWidth={1.8} color={C.greenLt} /> },
            { label: 'Ôn hôm nay',   val: dueWords.length, icon: <Trophy size={18} strokeWidth={1.8} color={C.violet} /> },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 18, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12, backdropFilter: 'blur(8px)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Review strip */}
        {dueWords.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 20, borderTop: '1px solid rgba(201,168,76,.18)' }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,.55)', fontWeight: 500 }}>
              📋 {dueWords.length} từ cần ôn —
            </span>
            {MODES.map(m => {
              const Icon = m.icon
              return (
                <button key={m.id} className="review-btn" onClick={() => startReview(m.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', background: C.gold, border: 'none', borderRadius: 50, color: C.navy, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 6px 20px rgba(201,168,76,.35)' }}>
                  <Icon size={15} strokeWidth={2} /> {m.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={15} color={C.textLt} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Tìm bộ từ..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 50, background: C.white, color: C.text, fontFamily: "'DM Sans', sans-serif", width: 180 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: C.textLt }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Loai pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="filter-pill" onClick={() => setFilterLoai('all')}
            style={{ padding: '7px 16px', borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", border: `1px solid ${filterLoai === 'all' ? C.navy : C.border}`, background: filterLoai === 'all' ? C.navy : C.white, color: filterLoai === 'all' ? '#fff' : C.textMid }}>
            Tất cả
          </button>
          {loaiList.map(l => {
            const s = LOAI_COLOR[l] ?? { bg: '#F1EFE8', color: '#444441', border: 'rgba(100,100,97,.2)' }
            const active = filterLoai === l
            return (
              <button key={l} className="filter-pill" onClick={() => setFilterLoai(active ? 'all' : l)}
                style={{ padding: '7px 16px', borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", border: `1px solid ${active ? C.navy : C.border}`, background: active ? C.navy : C.white, color: active ? '#fff' : s.color }}>
                {l}
              </button>
            )
          })}
        </div>

        {/* Cap do select */}
        <div style={{ position: 'relative' }}>
          <select value={filterCap} onChange={e => setFilterCap(e.target.value)}
            style={{ appearance: 'none', paddingLeft: 14, paddingRight: 32, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 50, background: C.white, color: C.textMid, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>
            <option value="all">Mọi cấp độ</option>
            {CAP_DO_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={13} color={C.textLt} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* ── Grouped grid ─────────────────────────────────────────────────── */}
      {filtered.length === 0
        ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.textLt, marginBottom: 8 }}>Không tìm thấy bộ từ nào</div>
            <p style={{ fontSize: 15, color: C.textLt }}>Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
          </div>
        )
        : Object.entries(grouped).map(([loai, groupSets]) => {
            const certCol  = CERT_COLOR[loai] || C.slate
            const CertIcon = CERT_ICON[loai] || BookOpen
            return (
              <div key={loai} className="fade-in" style={{ marginBottom: 44 }}>
                {/* Group header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${certCol}15`, border: `1px solid ${certCol}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CertIcon size={20} color={certCol} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{loai || 'Khác'}</div>
                    <div style={{ fontSize: 13, color: C.textLt, marginTop: 3 }}>{groupSets.length} bộ từ</div>
                  </div>
                  <div style={{ flex: 1, height: 1, background: C.border, marginLeft: 8 }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
                  {groupSets.map(set => {
                    const loading = loadingId === set.id
                    const loaiS   = LOAI_COLOR[set.loai_bo] ?? { bg: '#F1EFE8', color: '#444441', border: 'rgba(100,100,97,.2)' }
                    return (
                      <button
                        key={set.id}
                        className="vocab-card"
                        onClick={() => openModePicker(set)}
                        disabled={loading}
                        style={{ padding: 26, background: C.white, borderRadius: 24, border: `1px solid ${C.border}`, textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 14px rgba(15,28,53,.06)', fontFamily: "'DM Sans', sans-serif", width: '100%', opacity: loading ? 0.6 : 1 }}
                      >
                        {/* Top row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                            <LoaiBadge loai={set.loai_bo} />
                            {set.cap_do && <CapDoBadge cap={set.cap_do} />}
                          </div>
                          {/* Word count chip */}
                          <span style={{ fontSize: 12, color: C.textLt, fontWeight: 600, padding: '3px 10px', background: C.bg, borderRadius: 50, border: `1px solid ${C.border}`, flexShrink: 0, marginLeft: 8 }}>
                            {set.tong_so_tu} từ
                          </span>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 800, color: C.navy, marginBottom: 6, lineHeight: 1.3, letterSpacing: '-0.1px' }}>
                          {loading ? 'Đang tải...' : set.ten_bo}
                        </h3>

                        {/* Description */}
                        {set.mo_ta && (
                          <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 14 }}>
                            {set.mo_ta}
                          </p>
                        )}

                        {/* Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${C.border}`, marginTop: set.mo_ta ? 0 : 14 }}>
                          {set.chu_de
                            ? <span style={{ fontSize: 13, color: C.textLt, background: C.bg, padding: '3px 10px', borderRadius: 50, border: `1px solid ${C.border}` }}>{set.chu_de}</span>
                            : <span />
                          }
                          {/* Mode icons */}
                          <div style={{ display: 'flex', gap: 6 }}>
                            {MODES.map(m => {
                              const Icon = m.icon
                              return (
                                <div key={m.id} style={{ width: 30, height: 30, borderRadius: 8, background: `${certCol}10`, border: `1px solid ${certCol}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Icon size={14} color={certCol} strokeWidth={1.8} />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
      }

      {/* ── Mode picker bottom sheet ──────────────────────────────────────── */}
      {pendingSet && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,53,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={closeModePicker}
        >
          <div
            className="fade-in"
            style={{ background: C.white, borderRadius: 28, padding: '32px 28px', width: '100%', maxWidth: 420, boxShadow: '0 32px 80px rgba(15,28,53,.25)', marginBottom: 8 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: C.textLt, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Bộ từ đã chọn</p>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: C.navy, lineHeight: 1.2 }}>{pendingSet.ten_bo}</h2>
              <p style={{ fontSize: 14, color: C.textLt, marginTop: 4 }}>Chọn chế độ học</p>
            </div>

            {/* Gold divider */}
            <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

            {/* Mode buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MODES.map(m => {
                const Icon = m.icon
                return (
                  <button
                    key={m.id}
                    className="mode-btn"
                    onClick={() => startMode(m.id, pendingSet)}
                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', borderRadius: 16, border: `1.5px solid ${C.border}`, background: C.white, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: C.goldPale, border: `1px solid ${C.borderMd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={22} color={C.gold} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>{m.label}</p>
                      <p style={{ fontSize: 13, color: C.textLt }}>{m.desc}</p>
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLt, fontSize: 16 }}>›</div>
                  </button>
                )
              })}
            </div>

            <button
              onClick={closeModePicker}
              style={{ marginTop: 18, width: '100%', padding: '12px 0', fontSize: 14, color: C.textLt, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, borderRadius: 50, transition: 'color .2s' }}
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}