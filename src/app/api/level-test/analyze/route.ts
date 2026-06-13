import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini, SYSTEM_PROMPTS } from '@/lib/gemini/client'

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcMCQLevel(
  questions: { id: string; difficulty: string }[],
  answers: Record<string, string>,
  correctMap: Record<string, string>
): string {
  const countCorrect = (d: string) =>
    questions.filter(q => q.difficulty === d && answers[q.id] === correctMap[q.id]).length
  const countTotal = (d: string) =>
    questions.filter(q => q.difficulty === d).length

  const hardPct = countTotal('hard')   > 0 ? countCorrect('hard')   / countTotal('hard')   : 0
  const medPct  = countTotal('medium') > 0 ? countCorrect('medium') / countTotal('medium') : 0
  const easyPct = countTotal('easy')   > 0 ? countCorrect('easy')   / countTotal('easy')   : 0

  if (hardPct >= 0.6) return 'C1'
  if (medPct  >= 0.8) return 'B2'
  if (medPct  >= 0.5) return 'B1'
  if (easyPct >= 0.8) return 'A2'
  return 'A1'
}

function buildCorrectMap(questions: { id: string; correct: string }[]): Record<string, string> {
  return questions.reduce((acc, q) => ({ ...acc, [q.id]: q.correct }), {} as Record<string, string>)
}

// Detect tiếng Việt (có dấu)
function hasVietnamese(text: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)
}

// Lấy các câu sai cụ thể để đưa vào analysis prompt
function getWrongQuestions(
  questions: { id: string; question: string; correct: string; difficulty: string }[],
  answers: Record<string, string>
): string[] {
  return questions
    .filter(q => answers[q.id] !== q.correct)
    .slice(0, 4) // Tối đa 4 câu sai để tránh prompt quá dài
    .map(q => `"${q.question.slice(0, 80)}..." (đáp án đúng: ${q.correct}, sinh viên chọn: ${answers[q.id] || 'bỏ trống'})`)
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { exam, answers, writingText, speakingTranscript, topic } = body

    // ── 1. Chấm Listening ─────────────────────────────────────────────────
    const listeningQs = exam.listening.questions
    const listeningCorrectMap = buildCorrectMap(listeningQs)
    const listeningCorrect = listeningQs.filter(
      (q: { id: string; correct: string }) => answers[q.id] === q.correct
    ).length
    const listeningLevel = calcMCQLevel(listeningQs, answers, listeningCorrectMap)
    const listeningWrong = getWrongQuestions(listeningQs, answers)

    // ── 2. Chấm Reading ───────────────────────────────────────────────────
    const readingQs = exam.reading.questions
    const readingCorrectMap = buildCorrectMap(readingQs)
    const readingCorrect = readingQs.filter(
      (q: { id: string; correct: string }) => answers[q.id] === q.correct
    ).length
    const readingLevel = calcMCQLevel(readingQs, answers, readingCorrectMap)
    const readingWrong = getWrongQuestions(readingQs, answers)

    // ── 3. Chấm Grammar/Vocab ─────────────────────────────────────────────
    const gvQs = exam.grammar_vocab.questions
    const gvCorrectMap = buildCorrectMap(gvQs)
    const gvCorrect = gvQs.filter(
      (q: { id: string; correct: string }) => answers[q.id] === q.correct
    ).length
    const grammarLevel = calcMCQLevel(gvQs, answers, gvCorrectMap)
    const grammarWrong = getWrongQuestions(gvQs, answers)

    // ── 4. Chấm Writing bằng AI ───────────────────────────────────────────
    let writingScore = {
      task: 0, coherence: 0, vocabulary: 0, grammar: 0,
      overall: 0, feedback: '', level: 'A1', suggestions: [] as string[]
    }

    const writingTrimmed = writingText?.trim() ?? ''
    const writingWords = writingTrimmed ? writingTrimmed.split(/\s+/).length : 0

    if (writingTrimmed.length > 20) {
      // Detect tiếng Việt
      const isVietnamese = hasVietnamese(writingTrimmed)
      // Quá ngắn / spam / không hợp lệ
      const isTooShort = writingWords < 30
      const isGibberish = new Set(writingTrimmed.toLowerCase().split(/\s+/)).size < 8

      if (isVietnamese) {
        writingScore = {
          task: 1, coherence: 1, vocabulary: 1, grammar: 1, overall: 1,
          level: 'A1',
          feedback: 'Bài viết sử dụng tiếng Việt. Yêu cầu viết bằng tiếng Anh. Điểm tối thiểu được áp dụng.',
          suggestions: ['Viết toàn bộ bài bằng tiếng Anh.', 'Không sử dụng từ điển dịch nguyên câu.']
        }
      } else if (isTooShort || isGibberish) {
        writingScore = {
          task: 1, coherence: 1, vocabulary: 1, grammar: 1, overall: 1,
          level: 'A1',
          feedback: 'Bài viết quá ngắn hoặc không có nội dung rõ ràng. Cần viết đầy đủ theo yêu cầu đề bài.',
          suggestions: ['Viết ít nhất đủ số từ yêu cầu.', 'Trả lời đúng trọng tâm đề bài.']
        }
      } else {
        const writingPrompt = `
Bạn là giám khảo VSTEP/TOEIC nghiêm khắc. Chấm bài viết tiếng Anh sau.

ĐỀ BÀI: ${exam.writing.prompt}
YÊU CẦU: ${exam.writing.min_words}–${exam.writing.max_words} từ
SỐ TỪ THỰC TẾ: ${writingWords} từ

BÀI VIẾT:
"${writingTrimmed}"

QUY TẮC CHẤM BẮT BUỘC:
1. Nếu bài LẠCH ĐỀ hoàn toàn → task tối đa 2/10, tổng tối đa 3/10.
2. Nếu bài copy y chang đề bài → task = 1/10.
3. Nếu thiếu từ so với yêu cầu → trừ 1-2 điểm coherence.
4. Điểm ≥7 chỉ dành cho bài thực sự tốt, có ý tưởng rõ ràng, từ vựng đa dạng.
5. Nhận xét phải dẫn chứng CỤ THỂ từ bài viết (trích dẫn câu/cụm từ).
6. Gợi ý cải thiện phải KÈM VÍ DỤ sửa lỗi cụ thể.

Trả về JSON THUẦN TÚY (không markdown):
{
  "task": <0-10>,
  "coherence": <0-10>,
  "vocabulary": <0-10>,
  "grammar": <0-10>,
  "overall": <trung bình có trọng số, 1 chữ số thập phân>,
  "level": "<A1|A2|B1|B2|C1>",
  "feedback": "Nhận xét tổng thể 3-4 câu, có trích dẫn cụ thể từ bài viết, bằng tiếng Việt",
  "suggestions": [
    "Lỗi cụ thể + câu gốc → câu sửa, bằng tiếng Việt",
    "Lỗi cụ thể thứ 2 + cách khắc phục",
    "Gợi ý cải thiện điểm số cụ thể"
  ]
}
`
        const writingRaw = await callGemini(writingPrompt, SYSTEM_PROMPTS.writing)
        const writingCleaned = writingRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        try {
          writingScore = JSON.parse(writingCleaned)
        } catch {
          writingScore = {
            task: 5, coherence: 5, vocabulary: 5, grammar: 5,
            overall: 5, feedback: writingRaw, level: 'B1', suggestions: []
          }
        }
      }
    }

    // ── 5. Chấm Speaking bằng AI ──────────────────────────────────────────
    let speakingScore = {
      fluency: 0, vocabulary: 0, grammar: 0, content: 0,
      overall: 0, feedback: '', level: 'A1', suggestions: [] as string[]
    }

    const speakingTrimmed = speakingTranscript?.trim() ?? ''
    const speakingWords = speakingTrimmed ? speakingTrimmed.split(/\s+/).length : 0

    if (speakingTrimmed.length > 10) {
      const isVietnameseSpeaking = hasVietnamese(speakingTrimmed)
      const isTooShortSpeaking = speakingWords < 15
      const isGibberishSpeaking = new Set(speakingTrimmed.toLowerCase().split(/\s+/)).size < 6

      if (isVietnameseSpeaking) {
        speakingScore = {
          fluency: 1, vocabulary: 1, grammar: 1, content: 1, overall: 1,
          level: 'A1',
          feedback: 'Phần nói sử dụng tiếng Việt. Yêu cầu nói bằng tiếng Anh.',
          suggestions: ['Luyện nói tiếng Anh, không dịch từ tiếng Việt sang.']
        }
      } else if (isTooShortSpeaking || isGibberishSpeaking) {
        speakingScore = {
          fluency: 1, vocabulary: 1, grammar: 1, content: 1, overall: 1,
          level: 'A1',
          feedback: `Phần nói quá ngắn (${speakingWords} từ). Cần nói đầy đủ và liên tục hơn.`,
          suggestions: ['Cố gắng nói ít nhất 5-7 câu hoàn chỉnh.', 'Dùng các từ nối để mở rộng câu trả lời.']
        }
      } else {
        const speakingPrompt = `
Bạn là giám khảo Speaking VSTEP/TOEIC nghiêm khắc. Chấm phần nói sau.

CÂU HỎI: ${exam.speaking.prompt}
THỜI GIAN: ${exam.speaking.time_seconds} giây
MẪU B1: ${exam.speaking.sample_answer}
SỐ TỪ THỰC TẾ: ${speakingWords} từ

TRANSCRIPT:
"${speakingTrimmed}"

QUY TẮC CHẤM:
1. Lạc đề → content tối đa 2/10.
2. Ít hơn 30 từ → fluency tối đa 3/10 (quá ngắn, không thể đánh giá).
3. Câu lặp đi lặp lại → vocabulary tối đa 3/10.
4. Nhận xét phải chỉ ra CỤ THỂ từ/cụm từ trong transcript.
5. Gợi ý phải có ví dụ câu/cụm từ cụ thể.

Trả về JSON THUẦN TÚY:
{
  "fluency": <0-10>,
  "vocabulary": <0-10>,
  "grammar": <0-10>,
  "content": <0-10>,
  "overall": <trung bình, 1 chữ số thập phân>,
  "level": "<A1|A2|B1|B2|C1>",
  "feedback": "Nhận xét 3-4 câu có dẫn chứng từ transcript, bằng tiếng Việt",
  "suggestions": [
    "Lỗi cụ thể + cách sửa với ví dụ, bằng tiếng Việt",
    "Gợi ý mở rộng câu trả lời với ví dụ cụ thể"
  ]
}
`
        const speakingRaw = await callGemini(speakingPrompt, SYSTEM_PROMPTS.chatbot)
        const speakingCleaned = speakingRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        try {
          speakingScore = JSON.parse(speakingCleaned)
        } catch {
          speakingScore = {
            fluency: 5, vocabulary: 5, grammar: 5, content: 5,
            overall: 5, feedback: speakingRaw, level: 'B1', suggestions: []
          }
        }
      }
    }

    // ── 6. Tính trình độ tổng thể ─────────────────────────────────────────
    const allLevels = [
      LEVEL_ORDER.indexOf(listeningLevel),
      LEVEL_ORDER.indexOf(readingLevel),
      LEVEL_ORDER.indexOf(grammarLevel),
      LEVEL_ORDER.indexOf(writingScore.level  || 'A1'),
      LEVEL_ORDER.indexOf(speakingScore.level || 'A1'),
    ]
    const avgIdx = Math.round(allLevels.reduce((a, b) => a + b, 0) / allLevels.length)
    const overallLevel = LEVEL_ORDER[Math.max(0, Math.min(avgIdx, 5))]

    // ── 7. AI phân tích sâu + lộ trình cá nhân hóa ───────────────────────
    //    Truyền đủ context thực tế để AI phân tích có chiều sâu
    // ── 7. AI phân tích sâu + lộ trình cá nhân hóa ───────────────────────
    const skillScores: Record<string, number> = {
      Listening: listeningCorrect / listeningQs.length,
      Reading:   readingCorrect   / readingQs.length,
      Grammar:   gvCorrect        / gvQs.length,
      Writing:   writingScore.overall  / 10,
      Speaking:  speakingScore.overall / 10,
    }

    // Sắp xếp từ yếu → mạnh để AI biết ưu tiên đúng
    const skillPriority = Object.entries(skillScores)
      .sort(([, a], [, b]) => a - b)
      .map(([s, v]) => `${s}(${Math.round(v * 100)}%)`)
      .join(' < ')

    const weakSkills = Object.entries(skillScores)
      .filter(([, v]) => v < 0.6)
      .sort(([, a], [, b]) => a - b)
      .map(([s]) => s)

    const strongSkills = Object.entries(skillScores)
      .filter(([, v]) => v >= 0.6)
      .map(([s]) => s)

    const vstepGap = LEVEL_ORDER.indexOf('B1') - LEVEL_ORDER.indexOf(overallLevel)

    const weak0 = weakSkills[0] ?? strongSkills[0] ?? 'Grammar'
    const weak1 = weakSkills[1] ?? weakSkills[0] ?? 'Củng cố toàn diện'
    const weakTop2 = weakSkills.slice(0, 2).join(' & ') || 'Tất cả kỹ năng'
    const weakNext = weakSkills.slice(1, 3).join(' & ') || weakSkills[0] || 'Củng cố toàn diện'
    const timeEst = vstepGap > 0
      ? `${vstepGap * 6}–${vstepGap * 8} tuần`
      : '8–12 tuần để nâng lên trình độ cao hơn'
    const levelNext = LEVEL_ORDER[Math.min(LEVEL_ORDER.indexOf(overallLevel) + 1, 5)]

    const analysisPrompt = `Bạn là chuyên gia giáo dục tiếng Anh của ĐH Thái Bình. Phân tích kết quả Level Test và tạo lộ trình học CÁ NHÂN HÓA dựa HOÀN TOÀN vào số liệu thực tế dưới đây.

═══ NỀN TẢNG ENGLISHHUB (CHỈ recommend các module này, KHÔNG dùng app/web ngoài) ═══
EnglishHub là web học tiếng Anh của ĐH Thái Bình gồm các module:
- /listening  : Luyện nghe bài audio theo chủ đề, cấp độ A1–C1
- /reading    : Bài đọc hiểu, câu hỏi trắc nghiệm theo cấp độ
- /grammar    : Bài học ngữ pháp có giải thích + bài tập thực hành
- /vocabulary : Flashcard, quiz từ vựng theo bộ chủ đề
- /speaking   : Luyện nói với AI, ghi âm và chấm điểm tự động
- /writing    : Nộp bài viết, AI chấm theo 4 tiêu chí VSTEP
- /exam       : Thi thử VSTEP/TOEIC theo dạng đề thật có tính giờ
- /ai-chat    : Hỏi đáp AI về ngữ pháp, từ vựng, luyện hội thoại

VÍ DỤ hoat_dong TỐT (dùng tên module cụ thể + mô tả + thời lượng):
✓ "Làm 2 bài nghe cấp độ ${overallLevel} trên /listening mỗi ngày, tập trung phần câu hỏi suy luận, 20 phút/ngày"
✓ "Luyện 1 bài flashcard từ vựng chủ đề ${topic || exam.topic} trên /vocabulary, ôn lại 10 phút trước khi ngủ"
✓ "Nộp 1 bài writing trên /writing mỗi tuần, đọc kỹ feedback AI rồi viết lại bài đã sửa"
✓ "Hỏi /ai-chat giải thích từng câu grammar sai trong bài thi, tự tạo 3 câu ví dụ tương tự"
✗ KHÔNG ĐƯỢC: "Dùng Duolingo", "Xem YouTube", "Học Quizlet", "Luyện nghe BBC/CNN"
✗ KHÔNG ĐƯỢC: "Luyện nghe thêm", "Học từ vựng nhiều hơn" (quá chung chung, vô nghĩa)

═══ KẾT QUẢ THI THỰC TẾ ═══

LISTENING: ${listeningCorrect}/${listeningQs.length} câu đúng (${Math.round(listeningCorrect/listeningQs.length*100)}%) → ${listeningLevel}
${listeningWrong.length > 0 ? `Câu sai:\n${listeningWrong.map(w => `  • ${w}`).join('\n')}` : '✓ Đúng tất cả'}

READING: ${readingCorrect}/${readingQs.length} câu đúng (${Math.round(readingCorrect/readingQs.length*100)}%) → ${readingLevel}
${readingWrong.length > 0 ? `Câu sai:\n${readingWrong.map(w => `  • ${w}`).join('\n')}` : '✓ Đúng tất cả'}

GRAMMAR/VOCAB: ${gvCorrect}/${gvQs.length} câu đúng (${Math.round(gvCorrect/gvQs.length*100)}%) → ${grammarLevel}
${grammarWrong.length > 0 ? `Câu sai:\n${grammarWrong.map(w => `  • ${w}`).join('\n')}` : '✓ Đúng tất cả'}

WRITING: ${writingScore.overall}/10 → ${writingScore.level}
Đề bài: "${exam.writing.prompt}"
Bài viết (${writingWords} từ): "${writingTrimmed.slice(0, 600)}${writingTrimmed.length > 600 ? '...' : ''}"
Feedback AI: ${writingScore.feedback}

SPEAKING: ${speakingScore.overall}/10 → ${speakingScore.level}
Câu hỏi: "${exam.speaking.prompt}"
Transcript (${speakingWords} từ): "${speakingTrimmed.slice(0, 300)}${speakingTrimmed.length > 300 ? '...' : ''}"
Feedback AI: ${speakingScore.feedback}

═══ PHÂN TÍCH ═══
Trình độ tổng thể: ${overallLevel}
THỨ TỰ ƯU TIÊN (yếu → mạnh): ${skillPriority}
Kỹ năng CẦN CẢI THIỆN NGAY: ${weakSkills.length > 0 ? weakSkills.join(', ') : 'Không có — duy trì và nâng cao'}
Kỹ năng đã ổn: ${strongSkills.length > 0 ? strongSkills.join(', ') : 'Chưa có'}
Khoảng cách VSTEP B1: ${vstepGap > 0 ? `còn ${vstepGap} bậc CEFR` : vstepGap === 0 ? 'Đã đạt B1' : `Vượt B1 ${Math.abs(vstepGap)} bậc`}

Trả về JSON THUẦN TÚY (không markdown, không backtick, không text ngoài JSON). Tất cả nội dung bằng tiếng Việt:
{
  "trinh_do": "${overallLevel}",
  "nhan_xet": "Nhận xét 3-4 câu PHẢI dẫn số liệu cụ thể (ví dụ: Listening đúng ${listeningCorrect}/${listeningQs.length}, Writing đạt ${writingScore.overall}/10...). Nêu đặc điểm nổi bật và vấn đề chính.",
  "diem_manh": [
    "Kỹ năng mạnh nhất — kèm con số bằng chứng từ kết quả thi",
    "Điểm mạnh thứ 2 — kèm con số bằng chứng"
  ],
  "diem_yeu": [
    "Kỹ năng yếu nhất (${weak0}) — nêu nguyên nhân cụ thể dựa trên câu sai hoặc feedback",
    "Kỹ năng yếu thứ 2 — nêu nguyên nhân cụ thể"
  ],
  "lo_trinh": {
    "muc_tieu": "Đạt ${levelNext} sau ${timeEst}, tập trung cải thiện ${weak0} và ${weak1}",
    "thoi_gian": "${timeEst}",
    "phases": [
      {
        "tieu_de": "Chinh phục ${weak0} — xây nền vững chắc",
        "ky_nang_chinh": "${weakTop2}",
        "hoat_dong": [
          "Hoạt động 1: module EnglishHub cụ thể + mô tả chi tiết + thời lượng/tần suất",
          "Hoạt động 2: module EnglishHub cụ thể + mô tả chi tiết + thời lượng/tần suất",
          "Hoạt động 3: module EnglishHub cụ thể + mô tả chi tiết + thời lượng/tần suất",
          "Hoạt động 4: module EnglishHub cụ thể + mô tả chi tiết + thời lượng/tần suất"
        ],
        "muc_tieu": "Mục tiêu đo lường được sau phase 1 — phải có con số % hoặc điểm cụ thể"
      },
      {
        "tieu_de": "Nâng vững ${weak1} — phát triển song song",
        "ky_nang_chinh": "${weakNext}",
        "hoat_dong": [
          "Hoạt động 1 phase 2: module cụ thể + nội dung + thời lượng",
          "Hoạt động 2 phase 2: module cụ thể + nội dung + thời lượng",
          "Hoạt động 3 phase 2: module cụ thể + nội dung + thời lượng",
          "Hoạt động 4 phase 2: module cụ thể + nội dung + thời lượng"
        ],
        "muc_tieu": "Mục tiêu đo lường được sau phase 2 — có con số cụ thể"
      },
      {
        "tieu_de": "Tích hợp toàn diện — luyện tập tổng hợp",
        "ky_nang_chinh": "Tích hợp 5 kỹ năng",
        "hoat_dong": [
          "Hoạt động 1 phase 3: kết hợp nhiều module, mô tả cụ thể",
          "Hoạt động 2 phase 3: kết hợp nhiều module, mô tả cụ thể",
          "Hoạt động 3 phase 3: kết hợp nhiều module, mô tả cụ thể",
          "Hoạt động 4 phase 3: kết hợp nhiều module, mô tả cụ thể"
        ],
        "muc_tieu": "Mục tiêu đo lường được sau phase 3"
      },
      {
        "tieu_de": "Thi thử & Hoàn thiện — sẵn sàng VSTEP",
        "ky_nang_chinh": "Mock Test & Review",
        "hoat_dong": [
          "Làm đề thi thử VSTEP B1 trên /exam mỗi tuần, đặt đồng hồ đúng thời gian thật",
          "Sau mỗi mock test: phân tích câu sai trên /ai-chat, hiểu nguyên nhân từng lỗi",
          "Hoạt động 3 phase 4: ôn lại điểm yếu còn lại với module phù hợp",
          "Hoạt động 4 phase 4: kiểm tra tiến độ tổng thể, điều chỉnh nếu cần"
        ],
        "muc_tieu": "Đạt ≥ 70% tổng điểm trong 2 mock test liên tiếp trên /exam — sẵn sàng thi thật"
      }
    ]
  }
}`
    const aiRaw = await callGemini(analysisPrompt, SYSTEM_PROMPTS.levelTest, undefined, 3000)
    const aiCleaned = aiRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    let aiResult
    try {
      aiResult = JSON.parse(aiCleaned)
    } catch {
      aiResult = {
        trinh_do: overallLevel,
        nhan_xet: aiRaw,
        diem_manh: [],
        diem_yeu: [],
        lo_trinh: { muc_tieu: 'VSTEP B1', thoi_gian: `${Math.max(1, vstepGap) * 6} tuần` }
      }
    }

    // ── 8. Tính điểm tổng (nhất quán với UI) ─────────────────────────────
    const listeningScore25  = Math.round((listeningCorrect          / listeningQs.length) * 25)
    const readingScore25    = Math.round((readingCorrect            / readingQs.length)   * 25)
    const grammarScore25    = Math.round((gvCorrect                 / gvQs.length)        * 25)
    const writingScore25    = Math.round((writingScore.overall      / 10)                 * 25)
    const speakingScore25   = Math.round((speakingScore.overall     / 10)                 * 25)
    const totalScore = listeningScore25 + readingScore25 + grammarScore25 + writingScore25 + speakingScore25

    // ── 9. Lưu Supabase ───────────────────────────────────────────────────
    await supabase.from('KetQuaLevelTest').insert({
      nguoi_dung_id:         user.id,
      chu_de:                topic || exam.topic,
      trinh_do_tong_the:     overallLevel,
      trinh_do_listening:    listeningLevel,
      trinh_do_reading:      readingLevel,
      trinh_do_grammar:      grammarLevel,
      trinh_do_writing:      writingScore.level,
      trinh_do_speaking:     speakingScore.level,
      diem_so:               totalScore,
      lo_trinh_de_xuat_json: aiResult,
    })

    await supabase.from('NguoiDung')
      .update({ trinh_do_hien_tai: overallLevel })
      .eq('id', user.id)

    return NextResponse.json({
      overall: overallLevel,
      skills: {
        listening: { level: listeningLevel, correct: listeningCorrect, total: listeningQs.length },
        reading:   { level: readingLevel,   correct: readingCorrect,   total: readingQs.length },
        grammar:   { level: grammarLevel,   correct: gvCorrect,        total: gvQs.length },
        writing:   writingScore,
        speaking:  speakingScore,
      },
      aiResult,
    })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: 'Không thể phân tích kết quả.' }, { status: 500 })
  }
}