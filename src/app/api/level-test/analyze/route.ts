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
    const weakSkills = [
      listeningCorrect / listeningQs.length < 0.6 ? 'Listening' : null,
      readingCorrect   / readingQs.length   < 0.6 ? 'Reading'   : null,
      gvCorrect        / gvQs.length        < 0.6 ? 'Grammar'   : null,
      writingScore.overall  < 5 ? 'Writing'  : null,
      speakingScore.overall < 5 ? 'Speaking' : null,
    ].filter(Boolean)

    const vstepGap = LEVEL_ORDER.indexOf('B1') - LEVEL_ORDER.indexOf(overallLevel)

    const analysisPrompt = `
Bạn là chuyên gia giáo dục tiếng Anh của ĐH Thái Bình. Phân tích kết quả Level Test và xây dựng lộ trình học CÁ NHÂN HÓA chi tiết.

═══ KẾT QUẢ CHI TIẾT ═══

LISTENING: ${listeningCorrect}/${listeningQs.length} câu đúng (${Math.round(listeningCorrect/listeningQs.length*100)}%) → ${listeningLevel}
${listeningWrong.length > 0 ? `Câu sai:\n${listeningWrong.map(w => `  • ${w}`).join('\n')}` : '✓ Đúng tất cả'}

READING: ${readingCorrect}/${readingQs.length} câu đúng (${Math.round(readingCorrect/readingQs.length*100)}%) → ${readingLevel}
${readingWrong.length > 0 ? `Câu sai:\n${readingWrong.map(w => `  • ${w}`).join('\n')}` : '✓ Đúng tất cả'}

GRAMMAR/VOCAB: ${gvCorrect}/${gvQs.length} câu đúng (${Math.round(gvCorrect/gvQs.length*100)}%) → ${grammarLevel}
${grammarWrong.length > 0 ? `Câu sai:\n${grammarWrong.map(w => `  • ${w}`).join('\n')}` : '✓ Đúng tất cả'}

WRITING: ${writingScore.overall}/10 → ${writingScore.level}
Đề: "${exam.writing.prompt}"
Bài (${writingWords} từ): "${writingTrimmed.slice(0, 250)}${writingTrimmed.length > 250 ? '...' : ''}"
Feedback: ${writingScore.feedback}

SPEAKING: ${speakingScore.overall}/10 → ${speakingScore.level}
Câu hỏi: "${exam.speaking.prompt}"
Transcript (${speakingWords} từ): "${speakingTrimmed.slice(0, 180)}${speakingTrimmed.length > 180 ? '...' : ''}"
Feedback: ${speakingScore.feedback}

═══ BỐI CẢNH ═══
Trình độ tổng thể: ${overallLevel}
Kỹ năng yếu (< 60%): ${weakSkills.length > 0 ? weakSkills.join(', ') : 'Không có'}
Khoảng cách VSTEP B1: ${vstepGap > 0 ? `còn ${vstepGap} bậc` : vstepGap === 0 ? 'Đã đạt B1' : `Vượt B1 ${Math.abs(vstepGap)} bậc`}

═══ YÊU CẦU ═══
Trả về JSON THUẦN TÚY. Tất cả nội dung bằng tiếng Việt.

QUAN TRỌNG về lo_trinh.phases:
- Mỗi phase có ĐÚNG 4-5 hoat_dong CỤ THỂ (tên app/website, loại bài, tần suất/tuần)
- Ví dụ hoat_dong tốt: "Luyện TOEIC Listening Part 1-2 trên app TOEIC Preparation, 30 phút/ngày, 5 ngày/tuần"
- Ví dụ hoat_dong tốt: "Học 10 từ vựng chủ đề ${topic || exam.topic} qua Quizlet, ôn lại theo spaced repetition"
- Ví dụ hoat_dong XẤU (không được dùng): "Luyện nghe thêm" / "Học từ vựng nhiều hơn"
- muc_tieu phải đo lường được: "Đạt 70% câu đúng trong Listening mock test" không phải "Cải thiện Listening"
- ky_nang_chinh: tên kỹ năng ngắn gọn (vd: "Listening & Vocab" hoặc "Writing & Speaking")
- tieu_de: tiêu đề ngắn gọn, có động từ hành động (vd: "Xây nền tảng ${weakSkills[0] ?? 'Grammar'}")
- Thời gian ${vstepGap > 0 ? `ưu tiên kỹ năng yếu: ${weakSkills.join(', ')}` : 'duy trì và nâng lên C1'}

{
  "trinh_do": "${overallLevel}",
  "nhan_xet": "3-4 câu nhận xét thực tế, dẫn số liệu cụ thể, bằng tiếng Việt",
  "diem_manh": [
    "Điểm mạnh 1 — kèm số liệu bằng chứng",
    "Điểm mạnh 2 — kèm số liệu bằng chứng"
  ],
  "diem_yeu": [
    "Điểm yếu 1 — nguyên nhân cụ thể từ kết quả",
    "Điểm yếu 2 — nguyên nhân cụ thể từ kết quả"
  ],
  "lo_trinh": {
    "muc_tieu": "Mục tiêu cụ thể phù hợp trình độ hiện tại",
    "thoi_gian": "X tuần/tháng — ước tính thực tế theo gap",
    "phases": [
      {
        "tieu_de": "Tiêu đề phase 1 có động từ hành động",
        "ky_nang_chinh": "Kỹ năng 1 & Kỹ năng 2",
        "hoat_dong": [
          "Hoạt động cụ thể 1: tên tài liệu/app + thời lượng + tần suất",
          "Hoạt động cụ thể 2: dạng bài cụ thể + mục đích",
          "Hoạt động cụ thể 3: phương pháp học + ví dụ",
          "Hoạt động cụ thể 4: cách ôn luyện + kiểm tra tiến độ"
        ],
        "muc_tieu": "Mục tiêu đo lường được cuối phase 1"
      },
      {
        "tieu_de": "Tiêu đề phase 2",
        "ky_nang_chinh": "Kỹ năng 3 & Kỹ năng 4",
        "hoat_dong": [
          "Hoạt động 1 phase 2",
          "Hoạt động 2 phase 2",
          "Hoạt động 3 phase 2",
          "Hoạt động 4 phase 2"
        ],
        "muc_tieu": "Mục tiêu đo lường được cuối phase 2"
      },
      {
        "tieu_de": "Tiêu đề phase 3",
        "ky_nang_chinh": "Tổng hợp 5 kỹ năng",
        "hoat_dong": [
          "Hoạt động 1 phase 3",
          "Hoạt động 2 phase 3",
          "Hoạt động 3 phase 3",
          "Hoạt động 4 phase 3"
        ],
        "muc_tieu": "Mục tiêu đo lường được cuối phase 3"
      },
      {
        "tieu_de": "Tiêu đề phase 4 — Ôn tập & Thi thử",
        "ky_nang_chinh": "Mock Test & Review",
        "hoat_dong": [
          "Hoạt động 1 phase 4",
          "Hoạt động 2 phase 4",
          "Hoạt động 3 phase 4",
          "Hoạt động 4 phase 4"
        ],
        "muc_tieu": "Sẵn sàng thi VSTEP B1 thực tế"
      }
    ]
  }
}
`
    const aiRaw = await callGemini(analysisPrompt, SYSTEM_PROMPTS.levelTest)
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