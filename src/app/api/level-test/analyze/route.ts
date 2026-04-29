import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini, SYSTEM_PROMPTS } from '@/lib/gemini/client'

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function calcMCQLevel(correct: number, total: number, questions: { difficulty: string }[]): string {
  if (total === 0) return 'A1'
  const easy = questions.filter(q => q.difficulty === 'easy')
  const medium = questions.filter(q => q.difficulty === 'medium')
  const hard = questions.filter(q => q.difficulty === 'hard')

  const easyCorrect = easy.filter((_, i) => i < correct).length // approximate
  const easyPct = easy.length > 0 ? easyCorrect / easy.length : 0
  const medPct = medium.length > 0 ? (correct - Math.min(correct, easy.length)) / medium.length : 0
  const hardPct = hard.length > 0 ? Math.max(0, correct - easy.length - medium.length) / hard.length : 0

  if (hardPct >= 0.6) return 'C1'
  if (medPct >= 0.8) return 'B2'
  if (medPct >= 0.5) return 'B1'
  if (easyPct >= 0.8) return 'A2'
  return 'A1'
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { exam, answers, writingText, speakingTranscript, topic } = body

    // ── 1. Chấm Listening ──────────────────────────────────────────────────
    const listeningQs = exam.listening.questions
    const listeningCorrect = listeningQs.filter(
      (q: { id: string; correct: string }) => answers[q.id] === q.correct
    ).length
    const listeningLevel = calcMCQLevel(listeningCorrect, listeningQs.length, listeningQs)

    // ── 2. Chấm Reading ────────────────────────────────────────────────────
    const readingQs = exam.reading.questions
    const readingCorrect = readingQs.filter(
      (q: { id: string; correct: string }) => answers[q.id] === q.correct
    ).length
    const readingLevel = calcMCQLevel(readingCorrect, readingQs.length, readingQs)

    // ── 3. Chấm Grammar/Vocab ──────────────────────────────────────────────
    const gvQs = exam.grammar_vocab.questions
    const gvCorrect = gvQs.filter(
      (q: { id: string; correct: string }) => answers[q.id] === q.correct
    ).length
    const grammarLevel = calcMCQLevel(gvCorrect, gvQs.length, gvQs)

    // ── 4. Chấm Writing bằng AI ────────────────────────────────────────────
    let writingScore = { task: 0, coherence: 0, vocabulary: 0, grammar: 0, overall: 0, feedback: '', level: 'A1' }
    if (writingText && writingText.trim().length > 20) {
      const writingPrompt = `
Chấm bài viết VSTEP/TOEIC cho sinh viên Việt Nam.

Đề bài: ${exam.writing.prompt}
Yêu cầu: ${exam.writing.min_words}-${exam.writing.max_words} từ

Bài viết của sinh viên:
"${writingText}"

Cho điểm 0-10 từng tiêu chí và nhận xét ngắn bằng tiếng Việt.
Trả về JSON (KHÔNG markdown):
{
  "task": 7,
  "coherence": 6,
  "vocabulary": 7,
  "grammar": 6,
  "overall": 6.5,
  "level": "B1",
  "feedback": "Nhận xét tổng thể 2-3 câu bằng tiếng Việt",
  "suggestions": ["gợi ý cải thiện 1", "gợi ý cải thiện 2"]
}
`
      const writingRaw = await callGemini(writingPrompt, SYSTEM_PROMPTS.writing, undefined)
      const writingCleaned = writingRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      try {
        writingScore = JSON.parse(writingCleaned)
      } catch {
        writingScore = { task: 5, coherence: 5, vocabulary: 5, grammar: 5, overall: 5, feedback: writingRaw, level: 'B1' }
      }
    }

    // ── 5. Chấm Speaking bằng AI ───────────────────────────────────────────
    let speakingScore = { fluency: 0, vocabulary: 0, grammar: 0, content: 0, overall: 0, feedback: '', level: 'A1' }
    if (speakingTranscript && speakingTranscript.trim().length > 10) {
      const speakingPrompt = `
Chấm phần Speaking cho sinh viên Việt Nam luyện VSTEP/TOEIC.

Câu hỏi: ${exam.speaking.prompt}
Thời gian: ${exam.speaking.time_seconds} giây
Câu trả lời mẫu B1: ${exam.speaking.sample_answer}

Transcript bài nói của sinh viên:
"${speakingTranscript}"

Đánh giá và trả về JSON (KHÔNG markdown):
{
  "fluency": 6,
  "vocabulary": 7,
  "grammar": 6,
  "content": 7,
  "overall": 6.5,
  "level": "B1",
  "feedback": "Nhận xét 2-3 câu bằng tiếng Việt",
  "suggestions": ["gợi ý 1", "gợi ý 2"]
}
`
      const speakingRaw = await callGemini(speakingPrompt, SYSTEM_PROMPTS.chatbot, undefined)
      const speakingCleaned = speakingRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      try {
        speakingScore = JSON.parse(speakingCleaned)
      } catch {
        speakingScore = { fluency: 5, vocabulary: 5, grammar: 5, content: 5, overall: 5, feedback: speakingRaw, level: 'B1' }
      }
    }

    // ── 6. Tính trình độ tổng thể ──────────────────────────────────────────
    const allLevels = [
      LEVEL_ORDER.indexOf(listeningLevel),
      LEVEL_ORDER.indexOf(readingLevel),
      LEVEL_ORDER.indexOf(grammarLevel),
      LEVEL_ORDER.indexOf(writingScore.level || 'A1'),
      LEVEL_ORDER.indexOf(speakingScore.level || 'A1'),
    ]
    const avgIdx = Math.round(allLevels.reduce((a, b) => a + b, 0) / allLevels.length)
    const overallLevel = LEVEL_ORDER[Math.max(0, Math.min(avgIdx, 5))]

    // ── 7. AI phân tích tổng thể + lộ trình ──────────────────────────────
    const analysisPrompt = `
Sinh viên ĐH Thái Bình vừa hoàn thành Level Test tiếng Anh 4 kỹ năng:

- Listening:  ${listeningCorrect}/${listeningQs.length} câu → ${listeningLevel}
- Reading:    ${readingCorrect}/${readingQs.length} câu → ${readingLevel}
- Grammar/Vocab: ${gvCorrect}/${gvQs.length} câu → ${grammarLevel}
- Writing:    ${writingScore.overall}/10 → ${writingScore.level}
- Speaking:   ${speakingScore.overall}/10 → ${speakingScore.level}

Trình độ tổng thể: ${overallLevel}
Mục tiêu: Đạt chuẩn đầu ra VSTEP B1 của ĐH Thái Bình.

Phân tích và trả về JSON theo format đúng.
`
    const aiRaw = await callGemini(analysisPrompt, SYSTEM_PROMPTS.levelTest, undefined)
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
        lo_trinh: { muc_tieu: 'VSTEP B1', thoi_gian: '3 tháng' }
      }
    }

    // ── 8. Lưu Supabase ────────────────────────────────────────────────────
    await supabase.from('KetQuaLevelTest').insert({
      nguoi_dung_id: user.id,
      chu_de: topic || exam.topic,
      trinh_do_tong_the: overallLevel,
      trinh_do_listening: listeningLevel,
      trinh_do_reading: readingLevel,
      trinh_do_grammar: grammarLevel,
      trinh_do_writing: writingScore.level,
      trinh_do_speaking: speakingScore.level,
      diem_so: Math.round(
        ((listeningCorrect / listeningQs.length) +
         (readingCorrect / readingQs.length) +
         (gvCorrect / gvQs.length) +
         (writingScore.overall / 10) +
         (speakingScore.overall / 10)) / 5 * 100
      ),
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