import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini/client'

const GENERATE_PROMPT = (usedTopics: string[]) => `
Bạn là chuyên gia ra đề thi tiếng Anh chuẩn VSTEP/TOEIC/APTIS cho sinh viên Việt Nam.

Tạo 1 bộ đề Level Test đầy đủ 4 kỹ năng. Trả về JSON hợp lệ (KHÔNG markdown, KHÔNG backtick).

${usedTopics.length > 0 ? `TUYỆT ĐỐI KHÔNG dùng lại các chủ đề sau: ${usedTopics.slice(-10).join(', ')}` : ''}

Format JSON:
{
  "topic": "tên chủ đề tổng thể (VD: Environment, Technology, Education...)",
  "listening": {
    "script": "Đoạn hội thoại/monologue tiếng Anh 80-120 từ, tự nhiên, phù hợp TOEIC/VSTEP.",
    "questions": [
      { "id": "L1", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "A", "difficulty": "easy" },
      { "id": "L2", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "B", "difficulty": "medium" },
      { "id": "L3", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "C", "difficulty": "medium" }
    ]
  },
  "speaking": {
    "prompt": "Câu hỏi nói ngắn gọn bằng tiếng Anh. VD: Describe your daily routine.",
    "level_target": "B1",
    "time_seconds": 60,
    "sample_answer": "Đoạn trả lời mẫu 60-80 từ chuẩn B1"
  },
  "reading": {
    "passage": "Đoạn văn tiếng Anh 150-200 từ, chủ đề học thuật nhẹ hoặc đời sống.",
    "questions": [
      { "id": "R1", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "A", "difficulty": "easy" },
      { "id": "R2", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "B", "difficulty": "medium" },
      { "id": "R3", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "C", "difficulty": "medium" },
      { "id": "R4", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "A", "difficulty": "hard" }
    ]
  },
  "writing": {
    "prompt": "Đề bài viết rõ ràng, yêu cầu 80-120 từ, phù hợp VSTEP B1.",
    "min_words": 80,
    "max_words": 120,
    "criteria": ["Task Achievement", "Coherence & Cohesion", "Vocabulary", "Grammar"]
  },
  "grammar_vocab": {
    "questions": [
      { "id": "G1",  "difficulty": "easy",   "skill": "grammar",    "level": "A2", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "A", "explanation": "giải thích tiếng Việt" },
      { "id": "G2",  "difficulty": "easy",   "skill": "vocabulary", "level": "A2", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "B", "explanation": "..." },
      { "id": "G3",  "difficulty": "easy",   "skill": "grammar",    "level": "A2", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "C", "explanation": "..." },
      { "id": "G4",  "difficulty": "medium", "skill": "grammar",    "level": "B1", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "A", "explanation": "..." },
      { "id": "G5",  "difficulty": "medium", "skill": "vocabulary", "level": "B1", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "B", "explanation": "..." },
      { "id": "G6",  "difficulty": "medium", "skill": "grammar",    "level": "B2", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "C", "explanation": "..." },
      { "id": "G7",  "difficulty": "medium", "skill": "vocabulary", "level": "B2", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "A", "explanation": "..." },
      { "id": "G8",  "difficulty": "hard",   "skill": "grammar",    "level": "C1", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "B", "explanation": "..." },
      { "id": "G9",  "difficulty": "hard",   "skill": "vocabulary", "level": "C1", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "C", "explanation": "..." },
      { "id": "G10", "difficulty": "hard",   "skill": "grammar",    "level": "C1", "question": "...", "options": ["A. ...","B. ...","C. ...","D. ..."], "correct": "A", "explanation": "..." }
    ]
  }
}
`

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: history } = await supabase
      .from('KetQuaLevelTest')
      .select('chu_de')
      .eq('nguoi_dung_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const usedTopics: string[] = (history || [])
      .map((r: { chu_de?: string }) => r.chu_de)
      .filter(Boolean) as string[]

    const raw = await callGemini(GENERATE_PROMPT(usedTopics), undefined, undefined)
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    if (!parsed.listening || !parsed.speaking || !parsed.reading || !parsed.writing || !parsed.grammar_vocab) {
      throw new Error('Thiếu kỹ năng trong response')
    }

    return NextResponse.json({ exam: parsed })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Không thể tạo đề thi. Vui lòng thử lại.' }, { status: 500 })
  }
}