'use client'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────
interface CauHoi {
  id: string
  so_thu_tu: number
  noi_dung: string
  cac_lua_chon: string[]
  dap_an_dung: string
  giai_thich: string
}

interface BaiNghe {
  id: string
  tieu_de: string
  mo_ta: string
  cap_do: string
  loai_chung_chi: string
  chu_de: string
  video_url: string | null
  script: string
  thoi_gian_giay: number
  luot_lam: number
  BaiNgheCauHoi: CauHoi[]
}

interface DaLamInfo {
  diem: number
  tong: number
  ngay: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS = ['Tất cả', 'TOEIC', 'VSTEP', 'APTIS']
const CAP_DO_LIST = ['Tất cả', 'A2', 'B1', 'B2']
const CAP_DO_COLOR: Record<string, string> = {
  A1: 'bg-slate-100 text-slate-600',
  A2: 'bg-blue-100 text-blue-700',
  B1: 'bg-emerald-100 text-emerald-700',
  B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
}
const CERT_COLOR: Record<string, string> = {
  TOEIC: 'bg-blue-50 text-blue-600 border-blue-200',
  VSTEP: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  APTIS: 'bg-purple-50 text-purple-600 border-purple-200',
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ListeningPage() {
  const [tab, setTab]             = useState('Tất cả')
  const [capDo, setCapDo]         = useState('Tất cả')
  const [baiList, setBaiList]     = useState<BaiNghe[]>([])
  const [daLamMap, setDaLamMap]   = useState<Record<string, DaLamInfo>>({})
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<BaiNghe | null>(null)

  // Làm bài state
  const [answers, setAnswers]     = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [playing, setPlaying]     = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const [speed, setSpeed]         = useState(1)
  const [startTime, setStartTime] = useState<number>(0)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchBaiNghe()
  }, [tab, capDo])

  async function fetchBaiNghe() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tab !== 'Tất cả') params.set('loai', tab)
      if (capDo !== 'Tất cả') params.set('cap_do', capDo)
      const res = await fetch('/api/listening?' + params.toString())
      const data = await res.json()
      setBaiList(data.baiNghe || [])
      setDaLamMap(data.daLamMap || {})
    } catch {
      toast.error('Không tải được danh sách bài nghe')
    } finally {
      setLoading(false)
    }
  }

  // ── TTS ─────────────────────────────────────────────────────────────────────
  function playAudio() {
    if (!selected || playCount >= 2) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(selected.script)
    utt.lang = 'en-US'
    utt.rate = speed
    utt.onstart = () => setPlaying(true)
    utt.onend = () => { setPlaying(false); setPlayCount(p => p + 1) }
    utt.onerror = () => setPlaying(false)
    utterRef.current = utt
    window.speechSynthesis.speak(utt)
  }

  function stopAudio() {
    window.speechSynthesis.cancel()
    setPlaying(false)
  }

  // ── Start bài ───────────────────────────────────────────────────────────────
  function startBai(bai: BaiNghe) {
    setSelected(bai)
    setAnswers({})
    setSubmitted(false)
    setShowScript(false)
    setPlayCount(0)
    setPlaying(false)
    setStartTime(Date.now())
    window.scrollTo(0, 0)
  }

  // ── Nộp bài ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!selected) return
    const total = selected.BaiNgheCauHoi.length
    if (Object.keys(answers).length < total) {
      toast.error('Trả lời đủ ' + total + ' câu hỏi đã!')
      return
    }

    const correct = selected.BaiNgheCauHoi.filter(q => answers[q.id] === q.dap_an_dung).length
    const pct = Math.round((correct / total) * 100)
    const thoiGian = Math.round((Date.now() - startTime) / 1000)

    setSubmitted(true)

    if (pct >= 80) toast.success('Xuất sắc! ' + correct + '/' + total + ' câu đúng 🎉')
    else if (pct >= 60) toast('Khá tốt! ' + correct + '/' + total + ' câu đúng', { icon: '👍' })
    else toast('Cần luyện thêm. ' + correct + '/' + total + ' câu đúng', { icon: '📖' })

    try {
      await fetch('/api/listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baiId: selected.id,
          tieu_de: selected.tieu_de,
          loai_chung_chi: selected.loai_chung_chi,
          cap_do: selected.cap_do,
          correct,
          total,
          thoiGianLamBai: thoiGian,
          cauTraLoi: answers,
        }),
      })
      // Cập nhật daLamMap local
      setDaLamMap(prev => ({
        ...prev,
        [selected.id]: { diem: correct, tong: total, ngay: new Date().toISOString() }
      }))
    } catch {
      // Lỗi lưu DB không ảnh hưởng UX
    }
  }

  // ── Quay lại danh sách ───────────────────────────────────────────────────────
  function goBack() {
    stopAudio()
    setSelected(null)
    fetchBaiNghe()
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER — Trang làm bài
  // ══════════════════════════════════════════════════════════════════════════════
  if (selected) {
    const cauHois = selected.BaiNgheCauHoi
    const total   = cauHois.length
    const correct = submitted ? cauHois.filter(q => answers[q.id] === q.dap_an_dung).length : 0
    const pct     = submitted ? Math.round((correct / total) * 100) : 0
    const answered = Object.keys(answers).length

    return (
      <div className="max-w-3xl mx-auto px-4 pb-20">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pt-2">
          <button onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-[#6B6B60] hover:text-[#0D0D0D] transition-colors">
            ← Quay lại
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-[#0D0D0D] truncate">{selected.tieu_de}</h1>
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className={'text-xs px-2 py-0.5 rounded-full border font-medium ' + (CERT_COLOR[selected.loai_chung_chi] || 'bg-gray-100 text-gray-600 border-gray-200')}>
                {selected.loai_chung_chi}
              </span>
              <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (CAP_DO_COLOR[selected.cap_do] || 'bg-gray-100 text-gray-600')}>
                {selected.cap_do}
              </span>
              <span className="text-xs text-[#A0A090]">{selected.chu_de}</span>
            </div>
          </div>
          {/* Progress */}
          <div className="text-sm font-medium text-[#6B6B60] shrink-0">
            {answered}/{total} câu
          </div>
        </div>

        {/* Player hoặc YouTube */}
        {selected.video_url ? (
          <div className="rounded-2xl overflow-hidden mb-6 bg-black aspect-video">
            <iframe
              src={selected.video_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="bg-[#0D0D0D] rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-medium text-sm">🔊 Audio (TTS)</div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#A0A090] text-xs">Tốc độ:</span>
                {[0.75, 1, 1.25].map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className={'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ' +
                      (speed === s ? 'bg-[#00A878] text-white' : 'bg-white/10 text-[#A0A090] hover:bg-white/20')}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mb-3">
              <button
                onClick={playing ? stopAudio : playAudio}
                disabled={playCount >= 2}
                className={'flex-1 py-3 rounded-xl font-semibold transition-all ' +
                  (playCount >= 2 ? 'bg-[#E8E8E0] text-[#A0A090] cursor-not-allowed' :
                   playing ? 'bg-rose-500 text-white hover:bg-rose-600' :
                   'bg-[#00A878] text-white hover:bg-[#007A58]')}>
                {playing ? '⏹ Dừng' : playCount === 0 ? '▶ Phát audio' : '▶ Phát lại (lần 2)'}
              </button>
              <button onClick={() => setShowScript(!showScript)}
                className="px-5 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors text-sm">
                {showScript ? 'Ẩn script' : 'Xem script'}
              </button>
            </div>

            {playCount > 0 && (
              <div className="text-xs text-[#A0A090] mb-2">Đã nghe {playCount}/2 lần</div>
            )}

            {playing && (
              <div className="flex items-center gap-2 text-sm text-[#00A878]">
                <div className="flex gap-0.5">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="w-1 bg-[#00A878] rounded-full animate-bounce"
                      style={{ height: (8 + i * 4) + 'px', animationDelay: (i * 0.1) + 's' }} />
                  ))}
                </div>
                Đang phát...
              </div>
            )}

            {showScript && (
              <div className="mt-3 p-4 bg-white/5 rounded-xl text-white/80 text-sm leading-relaxed whitespace-pre-line font-mono">
                {selected.script}
              </div>
            )}
          </div>
        )}

        {/* Câu hỏi */}
        <div className="space-y-4 mb-6">
          {cauHois.map((q, i) => (
            <div key={q.id} className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
              <p className="font-medium text-[#0D0D0D] mb-4">
                <span className="text-xs text-[#A0A090] mr-2">Câu {i + 1}.</span>
                {q.noi_dung}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {q.cac_lua_chon.map(opt => {
                  const key = opt.charAt(0)
                  let cls = 'border-[#E8E8E0] hover:border-[#00A878]/40'
                  if (submitted) {
                    if (key === q.dap_an_dung) cls = 'border-[#00A878] bg-[#E8FFF8]'
                    else if (key === answers[q.id]) cls = 'border-rose-400 bg-rose-50'
                  } else if (answers[q.id] === key) {
                    cls = 'border-[#0D0D0D] bg-[#F8F7F2]'
                  }
                  return (
                    <button key={key}
                      onClick={() => !submitted && setAnswers(prev => ({ ...prev, [q.id]: key }))}
                      disabled={submitted}
                      className={'text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all ' + cls}>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {submitted && (
                <div className="mt-3 p-3 bg-[#FFF8EC] border border-[#F5A623]/20 rounded-xl text-xs text-[#484840]">
                  💡 {q.giai_thich}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Nộp bài hoặc kết quả */}
        {!submitted ? (
          <button onClick={handleSubmit}
            disabled={answered < total}
            className="w-full py-3.5 bg-[#0D0D0D] text-white font-semibold rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Nộp bài ({answered}/{total})
          </button>
        ) : (
          <div className="p-6 bg-white rounded-2xl border border-[#E8E8E0] text-center">
            <div className="text-4xl mb-3">
              {pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📖'}
            </div>
            <div className="font-display text-3xl font-bold text-[#0D0D0D]">{pct}%</div>
            <div className="text-[#6B6B60] text-sm mt-1 mb-5">{correct}/{total} câu đúng</div>

            {/* Score bar */}
            <div className="h-2 bg-[#F0F0E8] rounded-full overflow-hidden mb-6">
              <div className={'h-full rounded-full transition-all duration-700 ' +
                (pct >= 80 ? 'bg-[#00A878]' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-400')}
                style={{ width: pct + '%' }} />
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setAnswers({}); setSubmitted(false); setPlayCount(0); setStartTime(Date.now()) }}
                className="px-5 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-[#0D0D0D] font-medium hover:border-[#0D0D0D] transition-colors text-sm">
                🔄 Làm lại
              </button>
              <button onClick={goBack}
                className="px-5 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors text-sm">
                Bài khác →
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER — Danh sách bài nghe
  // ══════════════════════════════════════════════════════════════════════════════
  const filtered = baiList

  return (
    <div className="max-w-5xl mx-auto px-4">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Luyện nghe</h1>
        <p className="text-[#6B6B60] mt-1">Nghe audio → trả lời câu hỏi · TOEIC · VSTEP · APTIS</p>
      </div>

      {/* Info banner */}
      <div className="mb-6 p-4 bg-[#E8FFF8] border border-[#00A878]/20 rounded-xl text-sm text-[#484840] flex items-start gap-3">
        <span className="text-lg shrink-0">🔊</span>
        <div>
          Bài có <strong>video YouTube</strong> sẽ hiển thị player nhúng. Bài không có video dùng <strong>Web Speech TTS</strong> (Chrome/Edge).
          Mỗi bài nghe tối đa <strong>2 lần</strong>.
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={'px-4 py-2 rounded-xl text-sm font-semibold transition-all ' +
              (tab === t ? 'bg-[#0D0D0D] text-white' : 'bg-white border border-[#E8E8E0] text-[#6B6B60] hover:border-[#0D0D0D]')}>
            {t}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {CAP_DO_LIST.map(c => (
            <button key={c} onClick={() => setCapDo(c)}
              className={'px-3 py-2 rounded-xl text-xs font-semibold transition-all ' +
                (capDo === c ? 'bg-[#00A878] text-white' : 'bg-white border border-[#E8E8E0] text-[#6B6B60] hover:border-[#00A878]')}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách bài */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-[#E8E8E0] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[#A0A090]">
          <div className="text-5xl mb-3">🎧</div>
          <div className="font-medium">Không có bài nghe nào</div>
          <div className="text-sm mt-1">Thử chọn bộ lọc khác</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(bai => {
            const daLam = daLamMap[bai.id]
            const pct   = daLam ? Math.round((daLam.diem / daLam.tong) * 100) : null

            return (
              <button key={bai.id} onClick={() => startBai(bai)}
                className="p-5 bg-white rounded-2xl border-2 border-[#E8E8E0] text-left hover:border-[#00A878]/50 hover:shadow-md transition-all group">

                {/* Icon + status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: bai.video_url ? '#EEF2FF' : '#E8FFF8' }}>
                    {bai.video_url ? '🎬' : '🔊'}
                  </div>
                  {daLam && pct !== null ? (
                    <div className={'text-xs font-bold px-2 py-1 rounded-full ' +
                      (pct >= 80 ? 'bg-emerald-100 text-emerald-700' :
                       pct >= 60 ? 'bg-amber-100 text-amber-700' :
                       'bg-rose-100 text-rose-700')}>
                      {pct}% ✓
                    </div>
                  ) : (
                    <div className="text-xs font-medium px-2 py-1 rounded-full bg-[#F0F0E8] text-[#A0A090]">
                      Chưa làm
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  <span className={'text-xs px-2 py-0.5 rounded-full border font-medium ' +
                    (CERT_COLOR[bai.loai_chung_chi] || 'bg-gray-100 text-gray-600 border-gray-200')}>
                    {bai.loai_chung_chi}
                  </span>
                  <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' +
                    (CAP_DO_COLOR[bai.cap_do] || 'bg-gray-100 text-gray-600')}>
                    {bai.cap_do}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-[#0D0D0D] text-sm group-hover:text-[#00A878] transition-colors mb-1 line-clamp-2">
                  {bai.tieu_de}
                </h3>
                <p className="text-xs text-[#A0A090] mb-3 line-clamp-1">{bai.mo_ta}</p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-[#A0A090]">
                  <span>{bai.BaiNgheCauHoi.length} câu hỏi</span>
                  <span>{bai.video_url ? '🎬 Video' : '🔊 TTS'} · {Math.round(bai.thoi_gian_giay / 60)} phút</span>
                </div>

                {/* Progress bar nếu đã làm */}
                {daLam && pct !== null && (
                  <div className="mt-3 h-1.5 bg-[#F0F0E8] rounded-full overflow-hidden">
                    <div className={'h-full rounded-full ' +
                      (pct >= 80 ? 'bg-[#00A878]' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-400')}
                      style={{ width: pct + '%' }} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}