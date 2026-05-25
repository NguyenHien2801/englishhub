'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
// CATEGORIES được lấy động từ data — xem useMemo bên dưới
const PAGE_SIZE = 20

const LEVEL_COLOR: Record<string, string> = {
  A1: 'bg-emerald-100 text-emerald-700',
  A2: 'bg-teal-100 text-teal-700',
  B1: 'bg-amber-100 text-amber-700',
  B2: 'bg-orange-100 text-orange-700',
  C1: 'bg-blue-100 text-blue-700',
  C2: 'bg-red-100 text-red-700',
}

type Lesson = Record<string, unknown>

// ── Kiểu dữ liệu JSON ────────────────────────────────────
interface NoiDungJson {
  note?: string
  uses?: { chip: string; ex: string }[]
  formula?: { label: string; f: string }[]
  signalWords?: string[]
}

interface BaiTapItem {
  q: string
  type: 'mc' | 'fill' | 'tf' | 'rewrite'
  opts?: string[]
  ans: number | boolean | string
  exp?: string
}

// ── Icons ────────────────────────────────────────────────
const IconTrash = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)
const IconEdit = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
)

// ── Tab Lý thuyết ─────────────────────────────────────────
function TabLyThuyet({ data }: { data: NoiDungJson }) {
  return (
    <div className="space-y-5 py-2">
      {/* Ghi chú tổng quan */}
      {data.note && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">📌 Ghi chú</div>
          <p className="text-sm text-blue-900 leading-relaxed">{data.note}</p>
        </div>
      )}

      {/* Công thức */}
      {data.formula && data.formula.length > 0 && (
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📐 Công thức</div>
          <div className="space-y-2">
            {data.formula.map((item, i) => (
              <div key={i} className="flex gap-3 items-start bg-gray-50 rounded-xl p-3 border border-gray-200">
                <span className="text-xs font-semibold text-[#1e3a5f] bg-blue-100 px-2 py-1 rounded-lg whitespace-nowrap mt-0.5 min-w-fit">
                  {item.label}
                </span>
                <code className="text-sm text-gray-800 font-mono leading-relaxed">{item.f}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ví dụ sử dụng */}
      {data.uses && data.uses.length > 0 && (
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">💡 Ví dụ</div>
          <div className="space-y-2">
            {data.uses.map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full whitespace-nowrap mt-0.5 min-w-fit">
                  {item.chip}
                </span>
                <span className="text-sm text-gray-700 italic">"{item.ex}"</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Từ tín hiệu */}
      {data.signalWords && data.signalWords.length > 0 && (
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">🔑 Từ tín hiệu</div>
          <div className="flex flex-wrap gap-2">
            {data.signalWords.map((w, i) => (
              <span key={i} className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab Bài tập ───────────────────────────────────────────
function TabBaiTap({ data }: { data: BaiTapItem[] }) {
  const [answers, setAnswers] = useState<Record<number, string | number | boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    if (Object.keys(answers).length < data.length) {
      toast.error(`Còn ${data.length - Object.keys(answers).length} câu chưa trả lời`)
      return
    }
    setSubmitted(true)
  }

  function isCorrect(i: number): boolean {
    const q = data[i]
    const userAns = answers[i]
    if (q.type === 'mc') return userAns === q.ans
    if (q.type === 'tf') return String(userAns) === String(q.ans)
    if (q.type === 'fill' || q.type === 'rewrite') {
      const correct = String(q.ans).toLowerCase().trim()
      const given = String(userAns || '').toLowerCase().trim()
      return correct.split('/').map(s => s.trim()).some(c => c === given)
    }
    return false
  }

  const score = submitted ? data.reduce((acc, _, i) => acc + (isCorrect(i) ? 1 : 0), 0) : 0

  const TYPE_LABEL: Record<string, string> = { mc: 'Trắc nghiệm', fill: 'Điền từ', tf: 'Đúng/Sai', rewrite: 'Viết lại' }

  return (
    <div className="space-y-4 py-2">
      {submitted && (
        <div className={`rounded-xl p-4 text-center font-bold text-lg ${score >= data.length * 0.7 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
          {score >= data.length * 0.7 ? '🎉' : '📚'} Kết quả: {score}/{data.length} ({Math.round(score / data.length * 100)}%)
        </div>
      )}

      {data.map((q, i) => {
        const correct = submitted ? isCorrect(i) : null
        const borderColor = correct === null ? 'border-gray-200' : correct ? 'border-emerald-300' : 'border-red-300'
        const bgColor = correct === null ? 'bg-white' : correct ? 'bg-emerald-50' : 'bg-red-50'

        return (
          <div key={i} className={`rounded-xl border-2 p-4 ${borderColor} ${bgColor} transition-colors`}>
            <div className="flex items-start gap-2 mb-3">
              <span className="text-xs font-bold bg-[#1e3a5f] text-white px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase">{TYPE_LABEL[q.type]}</span>
                  {submitted && (
                    <span className={`text-xs font-bold ${correct ? 'text-emerald-600' : 'text-red-500'}`}>
                      {correct ? '✓ Đúng' : '✗ Sai'}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800">{q.q}</p>
              </div>
            </div>

            {/* MC */}
            {q.type === 'mc' && q.opts && (
              <div className="grid grid-cols-2 gap-2 ml-6">
                {q.opts.map((opt, oi) => {
                  const isSelected = answers[i] === oi
                  const isAnswer = q.ans === oi
                  let cls = 'px-3 py-2 rounded-lg text-sm border-2 cursor-pointer transition-all text-left '
                  if (submitted) {
                    if (isAnswer) cls += 'border-emerald-400 bg-emerald-100 text-emerald-800 font-semibold'
                    else if (isSelected && !isAnswer) cls += 'border-red-300 bg-red-100 text-red-700'
                    else cls += 'border-gray-200 text-gray-500'
                  } else {
                    cls += isSelected ? 'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f] font-semibold' : 'border-gray-200 hover:border-[#1e3a5f]/40'
                  }
                  return (
                    <button key={oi} className={cls}
                      disabled={submitted}
                      onClick={() => setAnswers(p => ({ ...p, [i]: oi }))}>
                      <span className="font-bold mr-1">{String.fromCharCode(65 + oi)}.</span> {opt}
                    </button>
                  )
                })}
              </div>
            )}

            {/* TF */}
            {q.type === 'tf' && (
              <div className="flex gap-3 ml-6">
                {['true', 'false'].map(v => {
                  const isSelected = String(answers[i]) === v
                  const isAnswer = String(q.ans) === v
                  let cls = 'px-5 py-2 rounded-lg text-sm font-semibold border-2 cursor-pointer transition-all '
                  if (submitted) {
                    if (isAnswer) cls += 'border-emerald-400 bg-emerald-100 text-emerald-700'
                    else if (isSelected) cls += 'border-red-300 bg-red-100 text-red-600'
                    else cls += 'border-gray-200 text-gray-400'
                  } else {
                    cls += isSelected ? 'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f]' : 'border-gray-200 hover:border-[#1e3a5f]/40'
                  }
                  return (
                    <button key={v} className={cls} disabled={submitted}
                      onClick={() => setAnswers(p => ({ ...p, [i]: v === 'true' }))}>
                      {v === 'true' ? '✓ Đúng' : '✗ Sai'}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Fill / Rewrite */}
            {(q.type === 'fill' || q.type === 'rewrite') && (
              <div className="ml-6">
                <input
                  type="text"
                  placeholder={q.type === 'rewrite' ? 'Viết lại câu...' : 'Điền vào chỗ trống...'}
                  value={String(answers[i] || '')}
                  onChange={e => setAnswers(p => ({ ...p, [i]: e.target.value }))}
                  disabled={submitted}
                  className={`w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none transition-colors ${
                    submitted
                      ? correct ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'
                      : 'border-gray-200 focus:border-[#1e3a5f]/60'
                  }`}
                />
              </div>
            )}

            {/* Giải thích */}
            {submitted && q.exp && (
              <div className="ml-6 mt-2 text-xs text-gray-500 bg-white/70 rounded-lg px-3 py-2 border border-gray-200">
                💬 {q.exp}
                {(q.type === 'fill' || q.type === 'rewrite') && (
                  <span className="ml-2 font-semibold text-emerald-700">→ Đáp án: {String(q.ans)}</span>
                )}
              </div>
            )}
          </div>
        )
      })}

      {!submitted && (
        <button onClick={handleSubmit}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm"
          style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
          Nộp bài ({Object.keys(answers).length}/{data.length} câu)
        </button>
      )}
      {submitted && (
        <button onClick={() => { setAnswers({}); setSubmitted(false) }}
          className="w-full py-3 rounded-xl font-semibold text-sm border-2 border-[#1e3a5f]/30 text-[#1e3a5f] hover:bg-blue-50 transition-colors">
          Làm lại
        </button>
      )}
    </div>
  )
}

// ── Tab Chỉnh sửa ─────────────────────────────────────────
function TabChinhSua({ lesson, onSave, categories }: { lesson: Lesson; onSave: (updated: Lesson) => Promise<void>; categories: string[] }) {
  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]/60 transition-colors bg-white'

  // ── Thông tin cơ bản ──
  const [form, setForm] = useState({
    tieu_de: lesson.tieu_de as string || '',
    cap_do: lesson.cap_do as string || 'B1',
    danh_muc: lesson.danh_muc as string || '',
    thu_tu_hien_thi: lesson.thu_tu_hien_thi as number || 0,
    mo_ta: lesson.mo_ta as string || '',
  })

  // ── Lý thuyết: raw JSON ──
  const [jsonText, setJsonText] = useState(
    JSON.stringify(lesson.noi_dung_json || {}, null, 2)
  )
  const [jsonError, setJsonError] = useState('')

  function handleJsonChange(val: string) {
    setJsonText(val)
    try { JSON.parse(val); setJsonError('') }
    catch { setJsonError('JSON không hợp lệ') }
  }

  function formatJson() {
    try { setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2)); setJsonError('') }
    catch { setJsonError('JSON không hợp lệ, không thể format') }
  }

  // ── Bài tập: form UI ──
  const [exercises, setExercises] = useState<BaiTapItem[]>(
    (lesson.bai_tap_json as BaiTapItem[]) || []
  )

  function updateEx(i: number, patch: Partial<BaiTapItem>) {
    setExercises(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e))
  }

  function addEx() {
    setExercises(prev => [...prev, { q: '', type: 'mc', opts: ['', '', '', ''], ans: 0, exp: '' }])
  }

  function removeEx(i: number) {
    setExercises(prev => prev.filter((_, idx) => idx !== i))
  }

  function moveEx(i: number, dir: -1 | 1) {
    setExercises(prev => {
      const arr = [...prev]
      const j = i + dir
      if (j < 0 || j >= arr.length) return arr
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return arr
    })
  }

  // ── section hiện tại ──
  const [section, setSection] = useState<'info' | 'theory' | 'exercises'>('info')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (jsonError) { toast.error('Lý thuyết JSON không hợp lệ'); return }
    let parsedJson: NoiDungJson
    try { parsedJson = JSON.parse(jsonText) }
    catch { toast.error('JSON lý thuyết lỗi'); return }
    setLoading(true)
    await onSave({
      ...lesson,
      ...form,
      noi_dung_json: parsedJson,
      bai_tap_json: exercises,
      tong_bai_tap: exercises.length,
    })
    setLoading(false)
  }

  const sectionBtn = (key: typeof section, label: string) => (
    <button onClick={() => setSection(key)}
      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
        section === key ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}>
      {label}
    </button>
  )

  return (
    <div className="py-2 space-y-4">
      {/* Sub-nav */}
      <div className="flex gap-2">
        {sectionBtn('info', '📋 Thông tin')}
        {sectionBtn('theory', '📖 Lý thuyết JSON')}
        {sectionBtn('exercises', `✏️ Bài tập (${exercises.length})`)}
      </div>

      {/* ── Thông tin cơ bản ── */}
      {section === 'info' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Tiêu đề</label>
            <input className={inputCls} value={form.tieu_de}
              onChange={e => setForm(p => ({ ...p, tieu_de: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Cấp độ</label>
              <select className={inputCls} value={form.cap_do}
                onChange={e => setForm(p => ({ ...p, cap_do: e.target.value }))}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Thứ tự</label>
              <input type="number" className={inputCls} value={form.thu_tu_hien_thi}
                onChange={e => setForm(p => ({ ...p, thu_tu_hien_thi: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Danh mục</label>
            <select className={inputCls} value={form.danh_muc}
              onChange={e => setForm(p => ({ ...p, danh_muc: e.target.value }))}>
              <option value="">-- Chọn --</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Mô tả</label>
            <textarea className={inputCls + ' resize-none'} rows={3} value={form.mo_ta}
              onChange={e => setForm(p => ({ ...p, mo_ta: e.target.value }))} />
          </div>
        </div>
      )}

      {/* ── Lý thuyết raw JSON ── */}
      {section === 'theory' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">Cấu trúc: <code className="bg-gray-100 px-1 rounded">note, formula[], uses[], signalWords[]</code></div>
            <button onClick={formatJson}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
              ✨ Format JSON
            </button>
          </div>
          <textarea
            value={jsonText}
            onChange={e => handleJsonChange(e.target.value)}
            rows={16}
            spellCheck={false}
            className={`w-full font-mono text-xs px-3 py-3 rounded-xl border-2 focus:outline-none transition-colors resize-none ${
              jsonError ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#1e3a5f]/60 bg-gray-50'
            }`}
          />
          {jsonError && (
            <div className="text-xs text-red-600 font-semibold">⚠️ {jsonError}</div>
          )}
        </div>
      )}

      {/* ── Bài tập form UI ── */}
      {section === 'exercises' && (
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <div key={i} className="border-2 border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
              {/* Header câu */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-[#1e3a5f] text-white px-2 py-0.5 rounded-full">
                  {i + 1}
                </span>
                <select value={ex.type}
                  onChange={e => {
                    const t = e.target.value as BaiTapItem['type']
                    const patch: Partial<BaiTapItem> = { type: t }
                    if (t === 'mc') patch.opts = ex.opts?.length ? ex.opts : ['', '', '', '']
                    if (t === 'tf') { patch.ans = true; patch.opts = undefined }
                    if (t === 'fill' || t === 'rewrite') { patch.ans = ''; patch.opts = undefined }
                    updateEx(i, patch)
                  }}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                  <option value="mc">Trắc nghiệm</option>
                  <option value="fill">Điền từ</option>
                  <option value="tf">Đúng / Sai</option>
                  <option value="rewrite">Viết lại</option>
                </select>
                <div className="flex gap-1 ml-auto">
                  <button onClick={() => moveEx(i, -1)} disabled={i === 0}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30">↑</button>
                  <button onClick={() => moveEx(i, 1)} disabled={i === exercises.length - 1}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30">↓</button>
                  <button onClick={() => removeEx(i)}
                    className="p-1 rounded text-red-400 hover:text-red-600">✕</button>
                </div>
              </div>

              {/* Câu hỏi */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 mb-0.5 block">Câu hỏi</label>
                <input value={ex.q} onChange={e => updateEx(i, { q: e.target.value })}
                  placeholder={ex.type === 'fill' ? 'Dùng ___ cho chỗ trống' : 'Nội dung câu hỏi'}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#1e3a5f]/60" />
              </div>

              {/* Đáp án tuỳ loại */}
              {ex.type === 'mc' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-400 block">Các lựa chọn (click radio = đáp án đúng)</label>
                  {(ex.opts || ['', '', '', '']).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`ans_${i}`} checked={ex.ans === oi}
                        onChange={() => updateEx(i, { ans: oi })}
                        className="accent-[#1e3a5f] w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-bold text-gray-500 w-4">{String.fromCharCode(65 + oi)}.</span>
                      <input value={opt}
                        onChange={e => {
                          const opts = [...(ex.opts || ['', '', '', ''])]
                          opts[oi] = e.target.value
                          updateEx(i, { opts })
                        }}
                        placeholder={`Lựa chọn ${String.fromCharCode(65 + oi)}`}
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:border-[#1e3a5f]/60" />
                    </div>
                  ))}
                </div>
              )}

              {ex.type === 'tf' && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 mb-1 block">Đáp án đúng</label>
                  <div className="flex gap-3">
                    {[true, false].map(v => (
                      <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={ex.ans === v}
                          onChange={() => updateEx(i, { ans: v })}
                          className="accent-[#1e3a5f] w-4 h-4" />
                        <span className={`text-sm font-semibold ${v ? 'text-emerald-600' : 'text-red-500'}`}>
                          {v ? '✓ Đúng' : '✗ Sai'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {(ex.type === 'fill' || ex.type === 'rewrite') && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 mb-0.5 block">
                    {ex.type === 'fill' ? 'Đáp án (dùng / nếu nhiều đáp án)' : 'Câu viết lại hoàn chỉnh'}
                  </label>
                  <input value={String(ex.ans || '')}
                    onChange={e => updateEx(i, { ans: e.target.value })}
                    placeholder={ex.type === 'fill' ? 'VD: shall / will' : 'Câu đầy đủ...'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#1e3a5f]/60" />
                </div>
              )}

              {/* Giải thích */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 mb-0.5 block">Giải thích (tuỳ chọn)</label>
                <input value={ex.exp || ''} onChange={e => updateEx(i, { exp: e.target.value })}
                  placeholder="Giải thích đáp án..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#1e3a5f]/60" />
              </div>
            </div>
          ))}

          <button onClick={addEx}
            className="w-full py-2.5 border-2 border-dashed border-[#1e3a5f]/30 rounded-xl text-sm font-semibold text-[#1e3a5f] hover:bg-blue-50 transition-colors">
            + Thêm câu hỏi
          </button>
        </div>
      )}

      {/* Nút lưu luôn hiện */}
      <div className="pt-1 border-t border-gray-100">
        <button onClick={handleSave} disabled={loading || !!jsonError}
          className="w-full py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
          {loading ? 'Đang lưu...' : `💾 Lưu tất cả thay đổi`}
        </button>
      </div>
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────
function LessonModal({ lesson, onClose, onSave, onDelete, categories }: {
  lesson: Lesson
  onClose: () => void
  onSave: (updated: Lesson) => Promise<void>
  onDelete: (id: string) => Promise<void>
  categories: string[]
}) {
  const [tab, setTab] = useState<'theory' | 'exercise' | 'edit'>('theory')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)

  const noiDung = lesson.noi_dung_json as NoiDungJson | null
  const baiTap = lesson.bai_tap_json as BaiTapItem[] | null

  async function handleDelete() {
    setLoadingDelete(true)
    await onDelete(lesson.id as string)
    setLoadingDelete(false)
    onClose()
  }

  const tabs = [
    { key: 'theory', label: '📖 Lý thuyết' },
    { key: 'exercise', label: `✏️ Bài tập (${baiTap?.length ?? 0})` },
    { key: 'edit', label: '⚙️ Chỉnh sửa' },
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,20,40,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl bg-white max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}>📖</div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-base truncate">{lesson.tieu_de as string}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${LEVEL_COLOR[lesson.cap_do as string] || 'bg-gray-100 text-gray-600'}`}>
                {lesson.cap_do as string}
              </span>
              {!!lesson.danh_muc && (
                <span className="text-blue-200 text-xs">{String(lesson.danh_muc)}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors flex-shrink-0">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                tab === t.key
                  ? 'border-[#1e3a5f] text-[#1e3a5f] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {tab === 'theory' && noiDung && <TabLyThuyet data={noiDung} />}
          {tab === 'theory' && !noiDung && (
            <div className="py-12 text-center text-gray-400 text-sm">Không có dữ liệu lý thuyết</div>
          )}
          {tab === 'exercise' && baiTap && baiTap.length > 0 && <TabBaiTap data={baiTap} />}
          {tab === 'exercise' && (!baiTap || baiTap.length === 0) && (
            <div className="py-12 text-center text-gray-400 text-sm">Không có bài tập</div>
          )}
          {tab === 'edit' && <TabChinhSua lesson={lesson} onSave={onSave} categories={categories} />}
        </div>

        {/* Footer xóa */}
        <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <span className="flex-1 text-sm text-red-600 font-medium">Xác nhận xóa bài học này?</span>
              <button onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors">Hủy</button>
              <button onClick={handleDelete} disabled={loadingDelete}
                className="px-4 py-2 rounded-xl text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 transition-colors">
                {loadingDelete ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 rounded-xl text-sm border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
              🗑 Xóa bài học
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add Modal ─────────────────────────────────────────────
function AddModal({ onClose, onGenerate, generating }: {
  onClose: () => void
  onGenerate: (topic: string, level: string) => Promise<void>
  generating: boolean
}) {
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState('B1')
  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]/60 transition-colors bg-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,20,40,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={() => !generating && onClose()}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: 'linear-gradient(135deg,#0f2847 0%,#1e3a5f 100%)' }}>
          <div>
            <div className="text-white font-bold text-base">Tạo bài học bằng AI</div>
            <div className="text-blue-200 text-xs mt-0.5">Gemini tự tạo lý thuyết + bài tập theo đúng cấu trúc CSDL</div>
          </div>
          <button onClick={() => !generating && onClose()} className="text-white/60 hover:text-white transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Chủ đề ngữ pháp *</label>
            <input className={inputCls} placeholder="VD: Present Perfect vs Past Simple"
              value={topic} onChange={e => setTopic(e.target.value)} disabled={generating} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Cấp độ</label>
            <select className={inputCls} value={level} onChange={e => setLevel(e.target.value)} disabled={generating}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <strong>Cấu trúc JSON sẽ tạo:</strong><br />
            <code>noi_dung_json</code>: note, formula[], uses[], signalWords[]<br />
            <code>bai_tap_json</code>: [{'{'}q, type(mc/fill/tf/rewrite), opts?, ans, exp{'}'}]
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button onClick={onClose} disabled={generating}
            className="px-5 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40">Hủy</button>
          <button onClick={() => onGenerate(topic, level)} disabled={generating || !topic.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
            {generating ? '🤖 Đang tạo...' : '✨ Tạo bằng AI'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function GrammarAdminClient({ lessons: init }: { lessons: Lesson[] }) {
  const [list, setList] = useState(init)
  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [sortKey, setSortKey] = useState('thu_tu_hien_thi')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Lesson | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [generating, setGenerating] = useState(false)
  const supabase = createClient()

  // Lấy danh mục động từ data thực tế trong CSDL
  const categories = useMemo(() => {
    const cats = list
      .map(l => (l.danh_muc as string)?.trim())
      .filter(Boolean)
    return Array.from(new Set(cats)).sort()
  }, [list])

  // ── Filter + Sort ─────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let arr = list.filter(l => {
      const matchSearch = !q ||
        (l.tieu_de as string)?.toLowerCase().includes(q) ||
        (l.danh_muc as string)?.toLowerCase().includes(q)
      const matchLevel = !filterLevel || l.cap_do === filterLevel
      const matchCat = !filterCategory || l.danh_muc === filterCategory
      return matchSearch && matchLevel && matchCat
    })
    arr = [...arr].sort((a, b) => {
      const va = (a[sortKey] ?? '') as string | number
      const vb = (b[sortKey] ?? '') as string | number
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [list, search, filterLevel, filterCategory, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  // ── Generate AI — đúng format CSDL ────────────────────
  async function handleGenerate(topic: string, level: string) {
    if (!topic.trim()) { toast.error('Nhập chủ đề ngữ pháp'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Tạo bài học ngữ pháp tiếng Anh về: "${topic}", cấp độ ${level}.

Trả về JSON hợp lệ (KHÔNG markdown, KHÔNG giải thích) với đúng cấu trúc sau:
{
  "tieu_de": "tên bài học ngắn gọn",
  "danh_muc": "một trong: Tenses / Conditionals / Passive / Modal verbs / Articles / Prepositions / Relative clauses / Reported speech / Tag questions / Khác",
  "noi_dung_json": {
    "note": "ghi chú tổng quan về điểm ngữ pháp, viết bằng tiếng Việt, súc tích",
    "formula": [
      { "label": "tên công thức", "f": "cấu trúc công thức" }
    ],
    "uses": [
      { "chip": "tên trường hợp dùng", "ex": "câu ví dụ tiếng Anh" }
    ],
    "signalWords": ["từ/cụm tín hiệu nhận biết"]
  },
  "bai_tap_json": [
    { "q": "câu hỏi", "type": "mc", "opts": ["A","B","C","D"], "ans": 0, "exp": "giải thích" },
    { "q": "câu điền từ ___", "type": "fill", "ans": "đáp án", "exp": "giải thích" },
    { "q": "câu đúng/sai để nhận xét", "type": "tf", "ans": true, "exp": "giải thích" },
    { "q": "Viết lại câu: ...", "type": "rewrite", "ans": "câu viết lại đầy đủ", "exp": "giải thích" }
  ]
}

Tạo ít nhất 8 câu bài tập, trộn đều 4 loại: mc, fill, tf, rewrite. ans của mc là index số (0,1,2,3). ans của tf là true hoặc false (boolean).`,
          type: 'grammar',
        }),
      })
      const data = await res.json()
      const clean = data.response.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      const { data: lesson, error } = await supabase.from('BaiHocNguPhap').insert({
        tieu_de: parsed.tieu_de,
        cap_do: level,
        danh_muc: parsed.danh_muc,
        noi_dung_json: parsed.noi_dung_json,
        bai_tap_json: parsed.bai_tap_json,
        tong_bai_tap: Array.isArray(parsed.bai_tap_json) ? parsed.bai_tap_json.length : 0,
        thu_tu_hien_thi: list.length + 1,
      }).select('*').single()

      if (error) throw error
      setList(prev => [lesson, ...prev])
      setPage(1)
      setShowAdd(false)
      toast.success(`Đã tạo bài "${lesson.tieu_de}"!`)
    } catch (e) {
      toast.error('Lỗi tạo bài học: ' + (e as Error).message)
    }
    setGenerating(false)
  }

  // ── Save / Delete ─────────────────────────────────────
  async function handleSave(updated: Lesson) {
    const { error } = await supabase.from('BaiHocNguPhap').update({
      tieu_de: updated.tieu_de,
      cap_do: updated.cap_do,
      danh_muc: updated.danh_muc,
      thu_tu_hien_thi: updated.thu_tu_hien_thi,
      mo_ta: updated.mo_ta,
      noi_dung_json: updated.noi_dung_json,
      bai_tap_json: updated.bai_tap_json,
      tong_bai_tap: Array.isArray(updated.bai_tap_json) ? (updated.bai_tap_json as unknown[]).length : updated.tong_bai_tap,
    }).eq('id', updated.id as string)
    if (error) { toast.error('Lỗi khi lưu: ' + error.message); return }
    setList(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l))
    setSelected(prev => prev ? { ...prev, ...updated } : null)
    toast.success('Đã lưu thay đổi')
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('BaiHocNguPhap').delete().eq('id', id)
    if (error) { toast.error('Lỗi khi xóa'); return }
    setList(prev => prev.filter(l => l.id !== id))
    toast.success('Đã xóa bài học')
  }

  async function handleDeleteRow(id: string) {
    if (!confirm('Xác nhận xóa bài học này?')) return
    await handleDelete(id)
  }

  // ── Table styles ──────────────────────────────────────
  const TH: React.CSSProperties = {
    background: 'linear-gradient(180deg, #2d4e7a 0%, #1e3a5f 100%)',
    color: 'rgba(226,232,240,0.82)',
    padding: '11px 14px',
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255,255,255,0.12)',
    userSelect: 'none',
    borderBottom: '2px solid rgba(147,197,253,0.2)',
  }
  const CELL_BORDER = '1px solid #c2cfe0'

  function SortIcon({ k }: { k: string }) {
    return (
      <span style={{ marginLeft: 4, display: 'inline-flex', flexDirection: 'column', gap: 2, verticalAlign: 'middle' }}>
        <svg width="7" height="4" viewBox="0 0 7 4" fill={sortKey === k && sortDir === 'asc' ? '#93c5fd' : 'rgba(255,255,255,0.28)'}>
          <path d="M3.5 0L7 4H0z" />
        </svg>
        <svg width="7" height="4" viewBox="0 0 7 4" fill={sortKey === k && sortDir === 'desc' ? '#93c5fd' : 'rgba(255,255,255,0.28)'}>
          <path d="M3.5 4L0 0H7z" />
        </svg>
      </span>
    )
  }

  const cols = [
    { key: 'stt',              label: 'STT',      sortable: false, minWidth: 48  },
    { key: 'tieu_de',          label: 'Tiêu đề',  sortable: true,  minWidth: 200 },
    { key: 'cap_do',           label: 'Cấp độ',   sortable: true,  minWidth: 80  },
    { key: 'danh_muc',         label: 'Danh mục', sortable: true,  minWidth: 140 },
    { key: 'tong_bai_tap',     label: 'Bài tập',  sortable: true,  minWidth: 80  },
    { key: 'thu_tu_hien_thi',  label: 'Thứ tự',   sortable: true,  minWidth: 80  },
    { key: 'created_at',       label: 'Ngày tạo', sortable: true,  minWidth: 120 },
    { key: '_action',          label: 'Thao tác', sortable: false, minWidth: 100 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-2 py-4" style={{ fontFamily: 'DM Sans,sans-serif' }}>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QUẢN LÝ NGỮ PHÁP</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Tổng <span className="font-semibold text-[#1e3a5f]">{list.length}</span> bài học · AI tự động tạo nội dung
            {filtered.length !== list.length && (
              <> · đang lọc <span className="font-semibold text-[#1e3a5f]">{filtered.length}</span> kết quả</>
            )}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg,#0f2847,#1e3a5f)' }}>
          🤖 Tạo bài AI
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm theo tiêu đề, danh mục..."
            className="w-full pl-9 pr-9 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white" />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setPage(1) }}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white">
          <option value="">Tất cả cấp độ</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white">
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={`${sortKey}|${sortDir}`}
          onChange={e => { const [k, d] = e.target.value.split('|'); setSortKey(k); setSortDir(d as 'asc' | 'desc'); setPage(1) }}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1e3a5f]/40 transition-colors bg-white">
          <option value="thu_tu_hien_thi|asc">Thứ tự tăng dần</option>
          <option value="thu_tu_hien_thi|desc">Thứ tự giảm dần</option>
          <option value="created_at|desc">Mới nhất trước</option>
          <option value="created_at|asc">Cũ nhất trước</option>
          <option value="tieu_de|asc">Tiêu đề A → Z</option>
          <option value="tong_bai_tap|desc">Nhiều bài tập nhất</option>
        </select>
        {(search || filterLevel || filterCategory) && (
          <button onClick={() => { setSearch(''); setFilterLevel(''); setFilterCategory(''); setPage(1) }}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm hover:border-red-300 hover:text-red-500 transition-colors bg-white">
            Xoá lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #b0bfd4' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                {cols.map((col, ci) => (
                  <th key={col.key} onClick={() => col.sortable && toggleSort(col.key)}
                    style={{
                      ...TH,
                      cursor: col.sortable ? 'pointer' : 'default',
                      borderRight: ci < cols.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                      minWidth: col.minWidth,
                    }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {col.label}{col.sortable && <SortIcon k={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={cols.length} className="text-center py-16 text-gray-400 bg-white">
                    <svg className="mx-auto mb-2 text-gray-300" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Không tìm thấy bài học nào
                  </td>
                </tr>
              ) : paginated.map((lesson, i) => {
                const even = i % 2 === 0
                return (
                  <tr key={lesson.id as string}
                    style={{ background: even ? '#f1f5f9' : '#ffffff', transition: 'background 0.1s' }}
                    className="hover:!bg-blue-50 group">
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px', textAlign: 'center' }}>
                      <span className="text-sm font-mono font-semibold text-gray-400">
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </span>
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px' }}>
                      <span className="font-semibold text-gray-800 text-[15px]">{lesson.tieu_de as string}</span>
                      {!!lesson.mo_ta && (
                        <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{String(lesson.mo_ta)}</div>
                      )}
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px', textAlign: 'center' }}>
                      <span className={`text-sm font-bold font-mono px-2.5 py-1 rounded ${LEVEL_COLOR[lesson.cap_do as string] || 'bg-gray-100 text-gray-600'}`}>
                        {lesson.cap_do as string}
                      </span>
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px' }}>
                      <span className="px-2.5 py-1 rounded-full text-[13px] font-semibold bg-blue-100 text-blue-700">
                        {(lesson.danh_muc as string) || '—'}
                      </span>
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px', textAlign: 'center' }}>
                      <span className="text-sm font-semibold text-[#1e3a5f]">{(lesson.tong_bai_tap as number) ?? 0}</span>
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px', textAlign: 'center' }}>
                      <span className="font-mono text-sm text-gray-500">{lesson.thu_tu_hien_thi as number}</span>
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, padding: '12px 16px' }}>
                      <span className="text-sm text-gray-500">
                        {lesson.created_at ? new Date(lesson.created_at as string).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </td>
                    <td style={{ borderBottom: CELL_BORDER, padding: '12px 16px' }}>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSelected(lesson)} title="Xem chi tiết"
                          className="p-2 rounded-lg text-[#1e3a5f] border border-[#1e3a5f]/20 hover:bg-[#1e3a5f] hover:text-white transition-all">
                          <IconEdit />
                        </button>
                        <button onClick={() => handleDeleteRow(lesson.id as string)} title="Xóa"
                          className="p-2 rounded-lg text-red-400 border border-red-200 hover:bg-red-500 hover:text-white transition-all">
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer + Phân trang */}
        <div className="px-4 py-3 flex items-center justify-between text-sm text-gray-500"
          style={{ background: '#f8fafc', borderTop: '2px solid #c2cfe0' }}>
          <span>
            Tổng <strong className="text-[#1e3a5f]">{filtered.length}</strong> bài học
            {filtered.length !== list.length && <> · lọc từ {list.length}</>}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors font-medium ${
                    p === page
                      ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white'
                      : 'border-gray-200 hover:bg-gray-100'
                  }`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                →
              </button>
            </div>
          )}
          <span className="text-xs text-gray-400">Trang {page}/{totalPages} · {PAGE_SIZE} bài/trang</span>
        </div>
      </div>

      {showAdd && <AddModal onClose={() => !generating && setShowAdd(false)} onGenerate={handleGenerate} generating={generating} />}
      {selected && (
        <LessonModal lesson={selected} onClose={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} categories={categories} />
      )}
    </div>
  )
}