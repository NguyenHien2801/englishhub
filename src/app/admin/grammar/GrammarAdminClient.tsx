'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function GrammarAdminClient({ lessons: init }: { lessons: Record<string,unknown>[] }) {
  const [lessons, setLessons] = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState('B1')
  const supabase = createClient()

  async function generateLesson() {
    if (!topic.trim()) { toast.error('Nhập chủ đề ngữ pháp'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Tạo bài học ngữ pháp tiếng Anh về chủ đề: "${topic}" cấp độ ${level}.
Trả về JSON (KHÔNG markdown) với cấu trúc:
{
  "tieu_de": "tên bài học",
  "danh_muc": "phân loại (Tenses/Conditionals/Passive/Modal verbs/...)",
  "noi_dung_json": {
    "sections": [
      {
        "title": "tên phần",
        "content": "giải thích bằng tiếng Việt rõ ràng",
        "formula": "công thức (tùy chọn)",
        "examples": [{"en": "câu ví dụ", "vi": "dịch"}],
        "signal_words": ["từ hiệu lệnh"]
      }
    ]
  },
  "bai_tap_json": {
    "questions": [
      {"id": 1, "type": "multiple_choice", "question": "...", "options": [{"key":"A","value":"..."}], "answer": "A", "explanation": "..."}
    ]
  }
}`,
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
        tong_bai_tap: parsed.bai_tap_json?.questions?.length || 0,
        thu_tu_hien_thi: lessons.length + 1,
      }).select('id, tieu_de, cap_do, danh_muc, tong_bai_tap, thu_tu_hien_thi').single()

      if (error) throw error
      setLessons(prev => [...prev, lesson])
      setTopic('')
      setShowForm(false)
      toast.success(`Đã tạo bài "${lesson.tieu_de}"!`)
    } catch (e) {
      toast.error('Lỗi tạo bài học: ' + (e as Error).message)
    }
    setGenerating(false)
  }

  async function deleteLesson(id: string) {
    if (!confirm('Xóa bài học này?')) return
    await supabase.from('BaiHocNguPhap').delete().eq('id', id)
    setLessons(prev => prev.filter(l => l.id !== id))
    toast.success('Đã xóa')
  }

  const LEVEL_COLOR: Record<string,string> = { A1:'#E8FFF8', A2:'#F0FFF4', B1:'#FFF8EC', B2:'#FFF0E8', C1:'#F0F0FF', C2:'#FFF0F0' }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Quản lý ngữ pháp</h1>
          <p className="text-[#6B6B60] mt-1">{lessons.length} bài học · AI tự động tạo nội dung</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors flex items-center gap-2">
          🤖 Tạo bài AI
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lessons.map(lesson => (
          <div key={lesson.id as string} className="bg-white rounded-xl border border-[#E8E8E0] p-4 hover:shadow-sm transition-shadow group">
            <div className="flex items-start justify-between mb-2">
              <span className="px-2 py-0.5 rounded-lg text-xs font-semibold text-[#0D0D0D]" style={{ backgroundColor: LEVEL_COLOR[lesson.cap_do as string] || '#F8F7F2' }}>{lesson.cap_do as string}</span>
              <button onClick={() => deleteLesson(lesson.id as string)} className="opacity-0 group-hover:opacity-100 text-[#FF6B6B] text-xs hover:bg-[#FFF0F0] px-2 py-0.5 rounded-lg transition-all">Xóa</button>
            </div>
            <h3 className="font-semibold text-[#0D0D0D] text-sm mb-1">{lesson.tieu_de as string}</h3>
            <div className="text-xs text-[#A0A090]">{lesson.danh_muc as string} · {lesson.tong_bai_tap as number} bài tập</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !generating && setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-[#0D0D0D] mb-2">Tạo bài học ngữ pháp bằng AI</h3>
            <p className="text-sm text-[#6B6B60] mb-4">Nhập chủ đề → Gemini tự tạo lý thuyết + bài tập hoàn chỉnh</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#0D0D0D] mb-1">Chủ đề ngữ pháp *</label>
                <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="VD: Present Perfect vs Past Simple"
                  className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0D0D0D] mb-1">Cấp độ</label>
                <select value={level} onChange={e => setLevel(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
                  {['A1','A2','B1','B2','C1','C2'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} disabled={generating} className="flex-1 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-[#0D0D0D] font-medium disabled:opacity-40">Hủy</button>
              <button onClick={generateLesson} disabled={generating || !topic.trim()} className="flex-1 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors disabled:opacity-50">
                {generating ? '🤖 Đang tạo...' : '✨ Tạo bằng AI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
