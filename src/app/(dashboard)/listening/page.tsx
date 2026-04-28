'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

const TOPICS = [
  { id: 1, title: 'Cuộc trò chuyện tại văn phòng', level: 'B1', cert: 'TOEIC', duration: '2:30', script: 'Man: Good morning, Sarah. Have you finished the quarterly report?\nWoman: Almost. I just need to add the sales figures from last month. Do you need it before the meeting?\nMan: Yes, please. The meeting starts at 2 PM, so I need it by noon at the latest.\nWoman: No problem. I\'ll have it ready by 11:30.', questions: [
    { q: 'What does the man ask about?', opts: ['A. A sales meeting', 'B. A quarterly report', 'C. Monthly figures', 'D. Office schedule'], ans: 'B', exp: 'Man hỏi "Have you finished the quarterly report?" → đáp án B.' },
    { q: 'When does the meeting start?', opts: ['A. 11:30 AM', 'B. 12:00 PM', 'C. 2:00 PM', 'D. 2:30 PM'], ans: 'C', exp: '"The meeting starts at 2 PM" → đáp án C.' },
    { q: 'When will Sarah finish the report?', opts: ['A. 11:00 AM', 'B. 11:30 AM', 'C. 12:00 PM', 'D. 2:00 PM'], ans: 'B', exp: '"I\'ll have it ready by 11:30" → đáp án B.' },
  ]},
  { id: 2, title: 'Thông báo sân bay', level: 'B1', cert: 'TOEIC', duration: '1:45', script: 'Attention passengers. Flight VN202 to Ho Chi Minh City is now boarding at Gate 12. Passengers requiring special assistance should proceed to the gate immediately. All other passengers should have their boarding passes and identification ready. The flight will depart in approximately 30 minutes.', questions: [
    { q: 'What is the flight number?', opts: ['A. VN12', 'B. VN202', 'C. VN212', 'D. VN2002'], ans: 'B', exp: '"Flight VN202" → đáp án B.' },
    { q: 'Who should board first?', opts: ['A. Business class', 'B. Frequent flyers', 'C. Passengers needing help', 'D. All passengers'], ans: 'C', exp: '"Passengers requiring special assistance should proceed immediately" → đáp án C.' },
  ]},
  { id: 3, title: 'Hội thoại đặt phòng khách sạn', level: 'A2', cert: 'VSTEP', duration: '2:00', script: 'Receptionist: Good afternoon. How can I help you?\nGuest: I\'d like to book a room for three nights, from the 15th to the 18th.\nReceptionist: Of course. Would you prefer a single or double room?\nGuest: A double room, please. Do you have one with a sea view?\nReceptionist: Yes, we have one available. It\'s 120 dollars per night.\nGuest: That\'s fine. I\'ll take it.', questions: [
    { q: 'How many nights does the guest want to stay?', opts: ['A. 2 nights', 'B. 3 nights', 'C. 4 nights', 'D. 5 nights'], ans: 'B', exp: '"three nights, from the 15th to the 18th" → đáp án B.' },
    { q: 'What type of room does the guest want?', opts: ['A. Single with sea view', 'B. Double without view', 'C. Double with sea view', 'D. Suite'], ans: 'C', exp: 'Guest yêu cầu "double room" và "sea view" → đáp án C.' },
    { q: 'How much is the room per night?', opts: ['A. $100', 'B. $110', 'C. $115', 'D. $120'], ans: 'D', exp: '"It\'s 120 dollars per night" → đáp án D.' },
  ]},
]

export default function ListeningPage() {
  const [selected, setSelected] = useState<typeof TOPICS[0] | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [transcriptIdx, setTranscriptIdx] = useState(0)

  function startTopic(topic: typeof TOPICS[0]) {
    setSelected(topic)
    setAnswers({})
    setSubmitted(false)
    setShowScript(false)
    setTranscriptIdx(0)
  }

  function playAudio() {
    if (!selected || !window.speechSynthesis) { toast.error('Trình duyệt không hỗ trợ TTS'); return }
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(selected.script)
    utt.lang = 'en-US'
    utt.rate = speed
    utt.onstart = () => setPlaying(true)
    utt.onend = () => setPlaying(false)
    utt.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(utt)
    setPlaying(true)
  }

  function stopAudio() {
    window.speechSynthesis?.cancel()
    setPlaying(false)
  }

  function handleSubmit() {
    if (Object.keys(answers).length < selected!.questions.length) { toast.error('Trả lời đủ câu hỏi đã'); return }
    setSubmitted(true)
    const correct = selected!.questions.filter((q, i) => answers[i] === q.ans).length
    const pct = Math.round((correct / selected!.questions.length) * 100)
    if (pct >= 80) toast.success(`🎉 Xuất sắc! ${correct}/${selected!.questions.length} câu đúng`)
    else if (pct >= 60) toast(`👍 Khá tốt! ${correct}/${selected!.questions.length} câu đúng`, { icon: '📊' })
    else toast(`📖 Cần luyện thêm. ${correct}/${selected!.questions.length} câu đúng`, { icon: '🔊' })
    // Save result to DB
    fetch('/api/listening', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: selected!.id, topicTitle: selected!.title,
        cert: selected!.cert, level: selected!.level,
        correct, total: selected!.questions.length,
      }),
    }).catch(() => {})
  }

  if (selected) {
    const correct = submitted ? selected.questions.filter((q, i) => answers[i] === q.ans).length : 0
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => { stopAudio(); setSelected(null) }} className="text-[#6B6B60] hover:text-[#0D0D0D] transition-colors">← Quay lại</button>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#0D0D0D]">{selected.title}</h1>
            <div className="flex gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-[#E8FFF8] text-[#00A878] rounded-full">{selected.cert}</span>
              <span className="text-xs px-2 py-0.5 bg-[#F8F7F2] text-[#6B6B60] rounded-full">{selected.level}</span>
              <span className="text-xs text-[#A0A090]">⏱ {selected.duration}</span>
            </div>
          </div>
        </div>

        {/* Player */}
        <div className="bg-[#0D0D0D] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white font-medium text-sm">🔊 Audio (Web Speech TTS)</div>
            <div className="flex items-center gap-2">
              <span className="text-[#A0A090] text-xs">Tốc độ:</span>
              {[0.75, 1, 1.25].map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${speed === s ? 'bg-[#00A878] text-white' : 'bg-white/10 text-[#A0A090] hover:bg-white/20'}`}>
                  {s}x
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={playing ? stopAudio : playAudio}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${playing ? 'bg-[#FF6B6B] text-white' : 'bg-[#00A878] text-white hover:bg-[#007A58]'}`}>
              {playing ? '⏹ Dừng' : '▶ Nghe bài'} ({speed}x)
            </button>
            <button onClick={() => setShowScript(!showScript)}
              className="px-5 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors text-sm">
              {showScript ? 'Ẩn script' : 'Xem script'}
            </button>
          </div>
          {showScript && (
            <div className="mt-4 p-4 bg-white/5 rounded-xl text-white/80 text-sm leading-relaxed whitespace-pre-line font-mono">
              {selected.script}
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-5 mb-6">
          {selected.questions.map((q, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
              <div className="font-medium text-[#0D0D0D] mb-4">
                <span className="text-xs text-[#A0A090] mr-2">Câu {i+1}.</span>{q.q}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {q.opts.map(opt => {
                  const key = opt.charAt(0)
                  let style = 'border-[#E8E8E0] hover:border-[#00A878]/40'
                  if (submitted) {
                    if (key === q.ans) style = 'border-[#00A878] bg-[#E8FFF8]'
                    else if (key === answers[i]) style = 'border-[#FF6B6B] bg-[#FFF0F0]'
                  } else if (answers[i] === key) style = 'border-[#0D0D0D] bg-[#F8F7F2]'
                  return (
                    <button key={key} onClick={() => !submitted && setAnswers(prev => ({ ...prev, [i]: key }))}
                      disabled={submitted}
                      className={`text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${style}`}>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {submitted && (
                <div className="mt-3 p-3 bg-[#FFF8EC] border border-[#F5A623]/20 rounded-xl text-xs text-[#484840]">
                  💡 {q.exp}
                </div>
              )}
            </div>
          ))}
        </div>

        {!submitted ? (
          <button onClick={handleSubmit} disabled={Object.keys(answers).length < selected.questions.length}
            className="w-full py-3.5 bg-[#0D0D0D] text-white font-semibold rounded-xl hover:bg-[#2C2C28] transition-colors disabled:opacity-50">
            Nộp bài ({Object.keys(answers).length}/{selected.questions.length})
          </button>
        ) : (
          <div className="p-5 bg-white rounded-2xl border border-[#E8E8E0] text-center">
            <div className="text-3xl mb-2">{correct === selected.questions.length ? '🏆' : correct >= selected.questions.length * 0.6 ? '👍' : '📖'}</div>
            <div className="font-display text-2xl font-bold text-[#0D0D0D]">{Math.round((correct / selected.questions.length) * 100)}%</div>
            <div className="text-[#6B6B60] text-sm mb-4">{correct}/{selected.questions.length} câu đúng</div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setAnswers({}); setSubmitted(false) }} className="px-5 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-[#0D0D0D] font-medium hover:border-[#0D0D0D] transition-colors">Làm lại</button>
              <button onClick={() => setSelected(null)} className="px-5 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">Bài khác →</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Luyện nghe</h1>
        <p className="text-[#6B6B60] mt-1">Nghe audio → trả lời câu hỏi · Web Speech TTS · TOEIC · VSTEP</p>
      </div>
      <div className="mb-6 p-4 bg-[#E8FFF8] border border-[#00A878]/20 rounded-xl text-sm text-[#484840]">
        🔊 Hệ thống dùng Web Speech API (có sẵn trong Chrome/Edge) để phát audio. Chọn tốc độ nghe phù hợp với trình độ.
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOPICS.map(topic => (
          <button key={topic.id} onClick={() => startTopic(topic)}
            className="p-5 bg-white rounded-2xl border-2 border-[#E8E8E0] text-left hover:border-[#00A878]/50 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-[#E8FFF8] flex items-center justify-center text-2xl mb-3">🔊</div>
            <div className="flex gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 bg-[#E8FFF8] text-[#00A878] rounded-full font-medium">{topic.cert}</span>
              <span className="text-xs px-2 py-0.5 bg-[#F8F7F2] text-[#6B6B60] rounded-full">{topic.level}</span>
            </div>
            <h3 className="font-semibold text-[#0D0D0D] text-sm group-hover:text-[#00A878] transition-colors mb-1">{topic.title}</h3>
            <div className="text-xs text-[#A0A090]">⏱ {topic.duration} · {topic.questions.length} câu hỏi</div>
          </button>
        ))}
      </div>
    </div>
  )
}
