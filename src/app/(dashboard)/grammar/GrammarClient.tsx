'use client'
import { useState } from 'react'
import GrammarLesson from '@/components/exam/GrammarLesson'

const LEVELS = ['A1','A2','B1','B2','C1','C2']
const LEVEL_COLORS: Record<string, string> = {
  A1: '#E8FFF8', A2: '#F0FFF4', B1: '#FFF8EC', B2: '#FFF0E8', C1: '#F0F0FF', C2: '#FFF0F0'
}

interface Props {
  lessons: Record<string, unknown>[]
  completedIds: Set<string>
  userId: string
}

export default function GrammarClient({ lessons, completedIds, userId }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Record<string, unknown> | null>(null)

  const filtered = selectedLevel ? lessons.filter(l => l.cap_do === selectedLevel) : lessons

  if (selectedLesson) {
    return (
      <GrammarLesson
        lesson={selectedLesson}
        userId={userId}
        isCompleted={completedIds.has(selectedLesson.id as string)}
        onBack={() => setSelectedLesson(null)}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Ngữ pháp</h1>
        <p className="text-[#6B6B60] mt-1">{completedIds.size}/{lessons.length} bài đã hoàn thành</p>
        <div className="mt-2 progress-bar w-64">
          <div className="progress-fill" style={{ width: `${lessons.length ? (completedIds.size / lessons.length) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Level filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setSelectedLevel(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!selectedLevel ? 'bg-[#0D0D0D] text-white' : 'bg-white border border-[#E8E8E0] text-[#6B6B60] hover:border-[#0D0D0D]'}`}>
          Tất cả
        </button>
        {LEVELS.map(l => (
          <button key={l} onClick={() => setSelectedLevel(l === selectedLevel ? null : l)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedLevel === l ? 'bg-[#0D0D0D] text-white' : 'bg-white border border-[#E8E8E0] text-[#6B6B60] hover:border-[#0D0D0D]'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Lessons grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#A0A090]">
          <div className="text-4xl mb-3">📖</div>
          <div>Chưa có bài học nào ở cấp độ này</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((lesson, i) => {
            const done = completedIds.has(lesson.id as string)
            return (
              <button key={lesson.id as string} onClick={() => setSelectedLesson(lesson)}
                className="p-5 bg-white rounded-2xl border-2 border-[#E8E8E0] text-left hover:shadow-md hover:border-[#00A878]/30 transition-all group relative overflow-hidden">
                {done && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#00A878] flex items-center justify-center text-white text-xs">✓</div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-semibold text-[#0D0D0D]"
                    style={{ backgroundColor: LEVEL_COLORS[lesson.cap_do as string] || '#F8F7F2' }}>
                    {lesson.cap_do as string}
                  </span>
                  {(lesson.danh_muc as string) && (
                    <span className="text-xs text-[#A0A090]">{lesson.danh_muc as string}</span>
                  )}
                </div>
                <h3 className="font-semibold text-[#0D0D0D] group-hover:text-[#00A878] transition-colors mb-1">
                  {lesson.tieu_de as string}
                </h3>
                {(lesson.mo_ta as string)&& <p className="text-xs text-[#6B6B60]">{lesson.mo_ta as string}</p>}
                <div className="mt-3 text-xs text-[#A0A090]">
                  📝 {(lesson.bai_tap_json as { questions: unknown[] })?.questions?.length || 0} bài tập
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
