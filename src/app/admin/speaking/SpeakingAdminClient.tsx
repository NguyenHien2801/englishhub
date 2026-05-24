'use client'

const CERTS = ['VSTEP', 'TOEIC', 'APTIS']

const SPEAKING_TYPES = [
  { icon: '🗣️', title: 'Phát âm & Intonation', desc: 'Luyện phát âm chuẩn, trọng âm và ngữ điệu', cert: 'VSTEP', status: 'coming' },
  { icon: '💬', title: 'Task 1 – Describe image', desc: 'Mô tả hình ảnh trong 30–45 giây', cert: 'VSTEP', status: 'coming' },
  { icon: '🎤', title: 'Short talk (TOEIC Speaking)', desc: 'Trả lời câu hỏi ngắn và đọc đoạn văn', cert: 'TOEIC', status: 'coming' },
  { icon: '📢', title: 'Opinion task', desc: 'Trình bày ý kiến cá nhân về một chủ đề', cert: 'APTIS', status: 'coming' },
]

export default function SpeakingAdminClient() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Bài nói (Speaking)</h1>
        <p className="text-[#6B6B60] mt-1">Quản lý bài luyện nói cho VSTEP, TOEIC, APTIS</p>
      </div>

      {/* Banner coming soon */}
      <div className="bg-gradient-to-br from-[#0F1C35] to-[#1a2840] rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="text-5xl mb-3">🚧</div>
          <h2 className="text-2xl font-bold mb-2">Module Speaking đang phát triển</h2>
          <p className="text-white/60 max-w-lg">
            Tính năng luyện nói với AI sẽ được tích hợp sớm. Bao gồm chấm điểm phát âm tự động, gợi ý cải thiện và mô phỏng phỏng vấn VSTEP/TOEIC.
          </p>
          <div className="mt-4 flex gap-3">
            {CERTS.map(c => (
              <span key={c} className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/80 border border-white/20">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Task types preview */}
      <div>
        <h2 className="font-semibold text-[#0D0D0D] mb-4 text-sm uppercase tracking-wide text-[#A0A090]">Các loại bài sẽ triển khai</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {SPEAKING_TYPES.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-[#E8E8E0] p-5 opacity-60">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#0D0D0D]">{item.title}</h3>
                    <span className="text-xs px-2 py-0.5 bg-[#F8F7F2] text-[#A0A090] rounded-full">Sắp có</span>
                  </div>
                  <p className="text-sm text-[#6B6B60]">{item.desc}</p>
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-[#FFF8EC] text-[#F5A623] rounded-full font-medium">{item.cert}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
