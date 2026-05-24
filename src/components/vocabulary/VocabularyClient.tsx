'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import FlashcardMode from '@/components/vocabulary/FlashcardMode'
import QuizMode from '@/components/vocabulary/QuizMode'
import MatchingMode from '@/components/vocabulary/MatchingMode'
import type { VocabSet, VocabWord, LearnMode } from '@/components/vocabulary/types'

interface Props {
  sets: VocabSet[]
  dueWords: { TuVung: VocabWord }[]
  userId: string
}

const LOAI_COLORS: Record<string, { bg: string; text: string }> = {
  TOEIC:  { bg: '#E8FFF8', text: '#085041' },
  VSTEP:  { bg: '#F0F0FF', text: '#3C3489' },
  APTIS:  { bg: '#FFF8EC', text: '#633806' },
  CHU_DE: { bg: '#FFF0F0', text: '#791F1F' },
  TU_TAO: { bg: '#F1EFE8', text: '#444441' },
}

const CAP_DO_LIST = ['A1','A2','B1','B2','C1','C2','MIXED']

const MODES: { id: LearnMode; icon: string; label: string; desc: string }[] = [
  { id: 'flashcard', icon: '🃏', label: 'Flashcard', desc: 'Lật thẻ · SRS Anki' },
  { id: 'quiz',      icon: '✏️', label: 'Quiz',      desc: '4 đáp án trắc nghiệm' },
  { id: 'matching',  icon: '🔗', label: 'Matching',  desc: 'Nối từ với nghĩa' },
]

export default function VocabularyClient({ sets, dueWords, userId }: Props) {
  const supabase = createClient()

  // Active learning session
  const [activeMode, setActiveMode]     = useState<LearnMode | null>(null)
  const [activeSet, setActiveSet]       = useState<VocabSet | null>(null)
  const [activeWords, setActiveWords]   = useState<VocabWord[]>([])

  // Browse state
  const [loadingId, setLoadingId]   = useState<string | null>(null)
  const [pendingSet, setPendingSet] = useState<VocabSet | null>(null)  // waiting for mode pick
  const [filterLoai, setFilterLoai] = useState('all')
  const [filterCap, setFilterCap]   = useState('all')
  const [search, setSearch]         = useState('')

  const loaiList = Array.from(new Set(sets.map(s => s.loai_bo)))
  const filtered = sets.filter(s => {
    if (filterLoai !== 'all' && s.loai_bo !== filterLoai) return false
    if (filterCap  !== 'all' && s.cap_do   !== filterCap)  return false
    if (search && !s.ten_bo.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function loadWords(setId: string): Promise<VocabWord[]> {
    // Query 1: lấy danh sách từ trong bộ
    const { data: tuVungList, error: e1 } = await supabase
      .from('TuVung')
      .select('id, tu_tieng_anh, loai_tu, cap_do, thu_tu_hien_thi')
      .eq('bo_du_vung_id', setId)
      .order('thu_tu_hien_thi')
    if (e1) throw e1
    if (!tuVungList?.length) return []

    const wordIds = tuVungList.map(w => w.id)
    const wordNames = tuVungList.map(w => w.tu_tieng_anh)

    // Query 2 & 3 song song
    const [{ data: cacheList }, { data: tienDoList }] = await Promise.all([
      supabase
        .from('TuVungCache')
        .select('*')
        .in('tu_tieng_anh', wordNames),
      supabase
        .from('TienDoHocTuVung')
        .select('*')
        .eq('nguoi_dung_id', userId)
        .in('tu_vung_id', wordIds),
    ])

    // Merge thủ công
    const cacheMap = Object.fromEntries(
      (cacheList || []).map(c => [c.tu_tieng_anh, c])
    )
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
  function closeModePicker() { setPendingSet(null) }

  async function startMode(mode: LearnMode, set: VocabSet, words?: VocabWord[]) {
    closeModePicker()
    if (!words) {
      setLoadingId(set.id)
      try { words = await loadWords(set.id) } catch { toast.error('Lỗi tải từ vựng!'); setLoadingId(null); return }
      setLoadingId(null)
    }
    if (words.length === 0) { toast.error('Bộ từ này chưa có từ nào!'); return }
    setActiveSet(set)
    setActiveWords(words)
    setActiveMode(mode)
  }

  function startReview(mode: LearnMode) {
    if (!dueWords.length) { toast.success('Không có từ nào cần ôn hôm nay! 🎉'); return }
    const reviewSet: VocabSet = { id: '__review__', ten_bo: 'Ôn tập hôm nay', mo_ta: null, loai_bo: '', cap_do: null, chu_de: null, tong_so_tu: dueWords.length }
    startMode(mode, reviewSet, dueWords.map(d => d.TuVung))
  }

  function handleBack() { setActiveMode(null); setActiveSet(null); setActiveWords([]) }

  // ── Active session ──────────────────────────────────────────────────────────
  if (activeMode && activeSet) {
    const props = { words: activeWords, setTitle: activeSet.ten_bo, userId, isReviewMode: activeSet.id === '__review__', onBack: handleBack }
    if (activeMode === 'flashcard') return <FlashcardMode {...props} />
    if (activeMode === 'quiz')      return <QuizMode      {...props} />
    if (activeMode === 'matching')  return <MatchingMode  {...props} />
  }

  // ── Browse ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Từ vựng</h1>
          <p className="text-[#6B6B60] mt-1 text-sm">Học thông minh với Flashcard SRS · Quiz · Matching</p>
        </div>

        {/* Review button group */}
        {dueWords.length > 0 && (
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-[#6B6B60] mb-1.5">📋 {dueWords.length} từ cần ôn hôm nay</p>
            <div className="flex gap-1.5">
              {MODES.map(m => (
                <button key={m.id} onClick={() => startReview(m.id)}
                  className="px-3 py-1.5 bg-[#F5A623] text-white text-xs font-semibold rounded-lg hover:bg-[#E09000] transition-colors">
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap gap-2 items-center">
        <input type="text" placeholder="Tìm bộ từ..." value={search} onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm border border-[#E8E8E0] rounded-xl bg-white focus:outline-none focus:border-[#00A878] w-40" />

        <div className="flex gap-1">
          <button onClick={() => setFilterLoai('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filterLoai === 'all' ? 'bg-[#0D0D0D] text-white' : 'bg-white border border-[#E8E8E0] text-[#6B6B60] hover:border-[#0D0D0D]'}`}>
            Tất cả
          </button>
          {loaiList.map(l => {
            const c = LOAI_COLORS[l] ?? { bg: '#F8F7F2', text: '#444441' }
            const active = filterLoai === l
            return (
              <button key={l} onClick={() => setFilterLoai(active ? 'all' : l)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${active ? 'bg-[#0D0D0D] text-white border-[#0D0D0D]' : 'bg-white border-[#E8E8E0] hover:border-[#0D0D0D]'}`}
                style={active ? {} : { color: c.text }}>
                {l}
              </button>
            )
          })}
        </div>

        <select value={filterCap} onChange={e => setFilterCap(e.target.value)}
          className="px-3 py-1.5 text-xs border border-[#E8E8E0] rounded-xl bg-white focus:outline-none focus:border-[#00A878] text-[#6B6B60]">
          <option value="all">Mọi cấp độ</option>
          {CAP_DO_LIST.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0
        ? <p className="text-center py-16 text-[#A0A090]">Không tìm thấy bộ từ nào</p>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(set => {
              const c = LOAI_COLORS[set.loai_bo] ?? { bg: '#F8F7F2', text: '#444441' }
              const loading = loadingId === set.id
              return (
                <button key={set.id} onClick={() => openModePicker(set)} disabled={loading}
                  className="p-5 bg-white rounded-2xl border-2 border-[#E8E8E0] text-left hover:border-[#00A878]/60 hover:shadow-md transition-all group disabled:opacity-50">
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: c.bg, color: c.text }}>
                      {set.loai_bo}
                    </span>
                    {set.cap_do && <span className="text-xs text-[#A0A090]">{set.cap_do}</span>}
                  </div>
                  <h3 className="font-semibold text-[#0D0D0D] mb-1 group-hover:text-[#00A878] transition-colors">
                    {loading ? 'Đang tải...' : set.ten_bo}
                  </h3>
                  {set.mo_ta && <p className="text-xs text-[#6B6B60] mb-3 line-clamp-2">{set.mo_ta}</p>}
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    <span className="text-xs text-[#A0A090]">🃏 {set.tong_so_tu} từ</span>
                    {set.chu_de && <span className="text-xs px-2 py-0.5 bg-[#F8F7F2] rounded-full text-[#6B6B60]">{set.chu_de}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        )}

      {/* Mode picker bottom sheet */}
      {pendingSet && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={closeModePicker}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-[#A0A090] mb-0.5">Bộ từ đã chọn</p>
            <h2 className="font-bold text-[#0D0D0D] text-lg mb-5">{pendingSet.ten_bo}</h2>
            <div className="flex flex-col gap-2.5">
              {MODES.map(m => (
                <button key={m.id} onClick={() => startMode(m.id, pendingSet)}
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-[#E8E8E0] hover:border-[#00A878] hover:bg-[#F0FDF9] transition-all text-left group">
                  <span className="text-2xl w-8">{m.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-[#0D0D0D] group-hover:text-[#00A878] text-sm">{m.label}</p>
                    <p className="text-xs text-[#6B6B60]">{m.desc}</p>
                  </div>
                  <span className="text-[#D0D0C8] group-hover:text-[#00A878] text-lg">›</span>
                </button>
              ))}
            </div>
            <button onClick={closeModePicker} className="mt-4 w-full py-2.5 text-sm text-[#6B6B60] hover:text-[#0D0D0D] transition-colors">
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}