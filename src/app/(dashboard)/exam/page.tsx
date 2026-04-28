'use client'
import { useState } from 'react'
import ExamSession from '@/components/exam/ExamSession'

const CERT_OPTIONS = [
  { value: 'TOEIC', label: 'TOEIC', icon: '💼', color: '#E8FFF8', desc: 'Luyện thi TOEIC 450-990' },
  { value: 'VSTEP', label: 'VSTEP B1', icon: '🎓', color: '#F0F0FF', desc: 'Chuẩn đầu ra ĐH Thái Bình' },
  { value: 'APTIS', label: 'APTIS', icon: '✈️', color: '#FFF8EC', desc: 'Du học, học bổng nước ngoài' },
]

const SKILL_OPTIONS: Record<string, { value: string; label: string; icon: string }[]> = {
  TOEIC: [
    { value: 'NGU_PHAP', label: 'Part 5 - Ngữ pháp', icon: '📝' },
    { value: 'DOC', label: 'Part 7 - Đọc hiểu', icon: '📖' },
    { value: 'TU_VUNG', label: 'Từ vựng', icon: '📚' },
  ],
  VSTEP: [
    { value: 'DOC', label: 'Đọc hiểu', icon: '📖' },
    { value: 'NGU_PHAP', label: 'Ngữ pháp', icon: '📝' },
    { value: 'TU_VUNG', label: 'Từ vựng', icon: '📚' },
  ],
  APTIS: [
    { value: 'DOC', label: 'Reading', icon: '📖' },
    { value: 'NGU_PHAP', label: 'Grammar & Vocab', icon: '📝' },
  ],
}

export default function ExamPage() {
  const [cert, setCert] = useState<string | null>(null)
  const [skill, setSkill] = useState<string | null>(null)
  const [sessionActive, setSessionActive] = useState(false)

  if (sessionActive && cert && skill) {
    return (
      <ExamSession
        loaiChungChi={cert}
        kyNang={skill}
        onFinish={() => { setSessionActive(false); setSkill(null) }}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Luyện thi</h1>
        <p className="text-[#6B6B60] mt-1">VSTEP B1 · TOEIC · APTIS — Ngân hàng câu hỏi chuẩn thi</p>
      </div>

      {/* Step 1: Choose cert */}
      <div className="mb-8">
        <h2 className="font-semibold text-[#0D0D0D] mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#0D0D0D] text-white text-xs flex items-center justify-center">1</span>
          Chọn chứng chỉ
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {CERT_OPTIONS.map(c => (
            <button key={c.value} onClick={() => { setCert(c.value); setSkill(null) }}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${cert === c.value ? 'border-[#00A878] shadow-md' : 'border-[#E8E8E0] bg-white hover:border-[#00A878]/30'}`}
              style={{ backgroundColor: cert === c.value ? c.color : 'white' }}>
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="font-semibold text-[#0D0D0D]">{c.label}</div>
              <div className="text-xs text-[#6B6B60]">{c.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Choose skill */}
      {cert && (
        <div className="mb-8">
          <h2 className="font-semibold text-[#0D0D0D] mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#0D0D0D] text-white text-xs flex items-center justify-center">2</span>
            Chọn kỹ năng / phần thi
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {(SKILL_OPTIONS[cert] || []).map(s => (
              <button key={s.value} onClick={() => setSkill(s.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${skill === s.value ? 'border-[#00A878] bg-[#E8FFF8]' : 'border-[#E8E8E0] bg-white hover:border-[#00A878]/30'}`}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="font-medium text-[#0D0D0D] text-sm">{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Start */}
      {cert && skill && (
        <div className="p-6 bg-[#0D0D0D] rounded-2xl text-white flex items-center justify-between">
          <div>
            <div className="font-display text-xl font-bold mb-1">
              {CERT_OPTIONS.find(c => c.value === cert)?.label} — {SKILL_OPTIONS[cert]?.find(s => s.value === skill)?.label}
            </div>
            <div className="text-[#A0A090] text-sm">10 câu hỏi · ~15 phút · Có giải thích đáp án + AI phân tích</div>
          </div>
          <button onClick={() => setSessionActive(true)}
            className="px-6 py-3 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors whitespace-nowrap">
            Bắt đầu →
          </button>
        </div>
      )}
    </div>
  )
}
