'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

const TASKS = [
  {
    id: 1, cert: 'VSTEP', level: 'B1', title: 'Task 1 — Mô tả biểu đồ',
    prompt: 'The chart below shows the percentage of students using different study methods at a Vietnamese university in 2024. Write a report describing the main features and make comparisons where relevant. (150-180 words)',
    minWords: 150, maxWords: 180,
    tips: ['Giới thiệu biểu đồ ở câu đầu', 'Nêu xu hướng chính', 'So sánh các số liệu nổi bật', 'Kết luận ngắn gọn'],
    rubric: ['Task Achievement (nội dung)', 'Coherence & Cohesion (mạch lạc)', 'Vocabulary (từ vựng)', 'Grammar (ngữ pháp)'],
  },
  {
    id: 2, cert: 'VSTEP', level: 'B1', title: 'Task 2 — Bài luận ý kiến',
    prompt: 'Some people believe that university students should study only subjects related to their future careers. Others think it is better to study a wide range of subjects. Discuss both views and give your own opinion. (250-300 words)',
    minWords: 250, maxWords: 300,
    tips: ['Mở bài: paraphrase đề + thesis statement', 'Thân bài 1: quan điểm 1 + ví dụ', 'Thân bài 2: quan điểm 2 + ví dụ', 'Kết bài: tóm tắt + quan điểm của bạn'],
    rubric: ['Task Response (trả lời đúng đề)', 'Coherence & Cohesion', 'Lexical Resource (từ vựng)', 'Grammatical Range & Accuracy'],
  },
  {
    id: 3, cert: 'TOEIC', level: 'B2', title: 'Email phản hồi khách hàng',
    prompt: 'You are a customer service representative at TechCorp. A client has complained that their order #12345 arrived 5 days late and one item was missing. Write a professional email to apologize and explain how you will resolve this issue. (120-150 words)',
    minWords: 120, maxWords: 150,
    tips: ['Tiêu đề email rõ ràng', 'Xin lỗi chân thành ngay đầu email', 'Giải thích nguyên nhân (nếu biết)', 'Nêu giải pháp cụ thể và thời gian', 'Kết thúc chuyên nghiệp'],
    rubric: ['Purpose & Content (mục đích & nội dung)', 'Professional Tone (giọng văn)', 'Vocabulary (từ vựng kinh doanh)', 'Grammar & Accuracy'],
  },
  {
    id: 4, cert: 'APTIS', level: 'B2', title: 'Social media post về môi trường',
    prompt: 'Write a social media post for your university\'s environmental club encouraging students to participate in a "Green Campus Week" campaign. Include 3 specific activities and why students should join. (100-120 words)',
    minWords: 100, maxWords: 120,
    tips: ['Hook thu hút ngay đầu bài', 'Dùng ngôn ngữ năng động, tích cực', 'Liệt kê hoạt động cụ thể', 'Call-to-action rõ ràng', 'Dùng hashtag phù hợp'],
    rubric: ['Content & Relevance', 'Engagement & Style', 'Vocabulary', 'Grammar'],
  },
]

interface FeedbackItem {
  criterion: string; score: number; comment: string
}
interface AIFeedback {
  tongDiem: number; nhanXet: string; diemManh: string[]; canCaiThien: string[]
  chiTiet: FeedbackItem[]
}

export default function WritingPage() {
  const [selected, setSelected] = useState<typeof TASKS[0] | null>(null)
  const [text, setText] = useState('')
  const [feedback, setFeedback] = useState<AIFeedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  function startTask(task: typeof TASKS[0]) {
    setSelected(task)
    setText('')
    setFeedback(null)
    setSubmitted(false)
  }

  async function submitWriting() {
    if (!selected) return
    if (wordCount < selected.minWords) {
      toast.error(`Cần tối thiểu ${selected.minWords} từ (hiện tại: ${wordCount} từ)`)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Chấm bài Writing ${selected.cert} - ${selected.title}

ĐỀ BÀI: ${selected.prompt}

BÀI LÀM CỦA HỌC SINH (${wordCount} từ):
${text}

Hãy chấm bài theo 4 tiêu chí: ${selected.rubric.join(', ')}.
Trả về JSON (KHÔNG markdown):
{
  "tongDiem": <số từ 0-40>,
  "nhanXet": "nhận xét tổng thể 2-3 câu",
  "diemManh": ["điểm mạnh 1", "điểm mạnh 2"],
  "canCaiThien": ["điểm cần cải thiện 1", "điểm cần cải thiện 2", "điểm cần cải thiện 3"],
  "chiTiet": [
    {"criterion": "${selected.rubric[0]}", "score": <0-10>, "comment": "nhận xét"},
    {"criterion": "${selected.rubric[1]}", "score": <0-10>, "comment": "nhận xét"},
    {"criterion": "${selected.rubric[2]}", "score": <0-10>, "comment": "nhận xét"},
    {"criterion": "${selected.rubric[3]}", "score": <0-10>, "comment": "nhận xét"}
  ]
}`,
          type: 'writing',
        }),
      })
      const data = await res.json()
      const clean = data.response.replace(/```json|```/g, '').trim()
      const parsed: AIFeedback = JSON.parse(clean)
      setFeedback(parsed)
      setSubmitted(true)
      toast.success('AI đã chấm bài xong!')
      // Save result to DB
      fetch('/api/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selected.id, taskTitle: selected.title,
          cert: selected.cert, level: selected.level,
          writingText: text, wordCount,
          tongDiem: parsed.tongDiem, nhanXet: parsed.nhanXet,
          diemManh: parsed.diemManh, canCaiThien: parsed.canCaiThien,
          chiTiet: parsed.chiTiet,
        }),
      }).catch(() => {})
    } catch {
      toast.error('Lỗi chấm bài. Thử lại nhé!')
    }
    setLoading(false)
  }

  const scoreColor = (s: number) => s >= 8 ? '#00A878' : s >= 6 ? '#F5A623' : '#FF6B6B'

  if (selected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelected(null)} className="text-[#6B6B60] hover:text-[#0D0D0D] transition-colors">← Quay lại</button>
          <div>
            <div className="flex gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-[#E8FFF8] text-[#00A878] rounded-full font-medium">{selected.cert}</span>
              <span className="text-xs px-2 py-0.5 bg-[#F0F0FF] text-[#7C7CFF] rounded-full">{selected.level}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#0D0D0D]">{selected.title}</h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Prompt */}
            <div className="bg-[#0D0D0D] text-white rounded-2xl p-5">
              <div className="text-xs text-[#707068] font-semibold mb-2 uppercase tracking-wide">Đề bài</div>
              <div className="text-sm leading-relaxed">{selected.prompt}</div>
              <div className="mt-3 text-xs text-[#00A878]">Yêu cầu: {selected.minWords}–{selected.maxWords} từ</div>
            </div>

            {/* Editor */}
            <div className="bg-white rounded-2xl border-2 border-[#E8E8E0] focus-within:border-[#00A878] transition-colors">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#E8E8E0]">
                <span className="text-xs font-semibold text-[#6B6B60]">Bài làm của bạn</span>
                <span className={`text-xs font-mono font-semibold ${
                  wordCount < selected.minWords ? 'text-[#FF6B6B]' :
                  wordCount > selected.maxWords ? 'text-[#F5A623]' : 'text-[#00A878]'
                }`}>
                  {wordCount} / {selected.minWords}–{selected.maxWords} từ
                </span>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                disabled={submitted}
                placeholder="Bắt đầu viết bài của bạn ở đây..."
                className="w-full p-5 text-sm text-[#0D0D0D] leading-relaxed resize-none focus:outline-none rounded-2xl min-h-64"
                rows={14}
              />
            </div>

            {!submitted ? (
              <button onClick={submitWriting} disabled={loading || wordCount < selected.minWords}
                className="w-full py-3.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? '🤖 AI đang chấm bài...' : `Nộp bài → AI chấm (${wordCount} từ)`}
              </button>
            ) : (
              <button onClick={() => { setText(''); setFeedback(null); setSubmitted(false) }}
                className="w-full py-3.5 border-2 border-[#E8E8E0] text-[#0D0D0D] font-medium rounded-xl hover:border-[#0D0D0D] transition-colors">
                ✏️ Viết lại
              </button>
            )}
          </div>

          {/* Right panel: tips + feedback */}
          <div className="space-y-4">
            {/* Tips */}
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
              <div className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-3">💡 Gợi ý cấu trúc</div>
              <div className="space-y-2">
                {selected.tips.map((tip, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#E8FFF8] text-[#00A878] flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                    <span className="text-[#484840]">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rubric */}
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
              <div className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-3">📊 Tiêu chí chấm</div>
              <div className="space-y-1.5">
                {selected.rubric.map((r, i) => (
                  <div key={i} className="text-sm text-[#484840] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A878] flex-shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Feedback */}
            {feedback && (
              <div className="bg-white rounded-2xl border-2 border-[#00A878]/30 p-5">
                <div className="text-center mb-4">
                  <div className="text-xs font-semibold text-[#A0A090] mb-1">🤖 Điểm AI chấm</div>
                  <div className="font-display text-4xl font-bold text-[#00A878]">{feedback.tongDiem}<span className="text-lg text-[#6B6B60]">/40</span></div>
                </div>

                <div className="space-y-2 mb-4">
                  {feedback.chiTiet.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-[#6B6B60] text-xs truncate flex-1 mr-2">{c.criterion}</span>
                      <span className="font-bold text-xs flex-shrink-0" style={{ color: scoreColor(c.score) }}>{c.score}/10</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-[#484840] leading-relaxed mb-3 p-3 bg-[#F8F7F2] rounded-xl">{feedback.nhanXet}</div>

                {feedback.diemManh.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-[#00A878] mb-1">✅ Điểm mạnh</div>
                    {feedback.diemManh.map((d, i) => <div key={i} className="text-xs text-[#484840]">• {d}</div>)}
                  </div>
                )}
                {feedback.canCaiThien.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-[#FF6B6B] mb-1">📈 Cần cải thiện</div>
                    {feedback.canCaiThien.map((d, i) => <div key={i} className="text-xs text-[#484840]">• {d}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Luyện viết</h1>
        <p className="text-[#6B6B60] mt-1">Viết bài → AI Gemini chấm điểm 4 tiêu chí · VSTEP · TOEIC · APTIS</p>
      </div>

      <div className="mb-5 p-4 bg-[#E8FFF8] border border-[#00A878]/20 rounded-xl flex items-center gap-3 text-sm">
        <span className="text-2xl">🤖</span>
        <div>
          <div className="font-semibold text-[#0D0D0D]">AI Gemini chấm bài tự động</div>
          <div className="text-[#6B6B60] text-xs">Nhận xét chi tiết 4 tiêu chí, điểm mạnh, điểm cần cải thiện và gợi ý cụ thể</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {TASKS.map(task => (
          <button key={task.id} onClick={() => startTask(task)}
            className="p-5 bg-white rounded-2xl border-2 border-[#E8E8E0] text-left hover:border-[#00A878]/50 hover:shadow-md transition-all group">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF8EC] flex items-center justify-center text-xl flex-shrink-0">✍️</div>
              <div>
                <div className="flex gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 bg-[#E8FFF8] text-[#00A878] rounded-full font-medium">{task.cert}</span>
                  <span className="text-xs px-2 py-0.5 bg-[#F8F7F2] text-[#6B6B60] rounded-full">{task.level}</span>
                </div>
                <h3 className="font-semibold text-[#0D0D0D] text-sm group-hover:text-[#00A878] transition-colors">{task.title}</h3>
              </div>
            </div>
            <p className="text-xs text-[#6B6B60] line-clamp-2">{task.prompt}</p>
            <div className="mt-3 text-xs text-[#A0A090]">{task.minWords}–{task.maxWords} từ · {task.rubric.length} tiêu chí chấm</div>
          </button>
        ))}
      </div>
    </div>
  )
}
