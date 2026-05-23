import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini, SYSTEM_PROMPTS } from '@/lib/gemini/client'

const GENERATE_PROMPT = (usedTopics: string[]) => `
You are an expert English language test designer specialising in VSTEP, TOEIC, and APTIS formats.

Generate a complete Level Test with 5 sections. Return VALID JSON ONLY — no markdown, no backticks, no explanation.

CRITICAL LANGUAGE RULE: Every single field — questions, options, prompts, passages, scripts, sample answers, explanations — MUST be written entirely in ENGLISH. No Vietnamese anywhere.

${usedTopics.length > 0 ? `DO NOT reuse any of these previously used topics: ${usedTopics.slice(-10).join(', ')}` : ''}

Return this exact JSON structure:

{
  "topic": "Overall topic name (e.g. Environment, Technology, Urban Life, Health, Travel...)",
  "listening": {
    "script": "A natural dialogue or monologue in English, 80-120 words, TOEIC/VSTEP style. Two speakers or a short announcement.",
    "questions": [
      { "id": "L1", "question": "Question in English about the audio?", "options": ["A. option","B. option","C. option","D. option"], "correct": "A", "difficulty": "easy" },
      { "id": "L2", "question": "Question in English about the audio?", "options": ["A. option","B. option","C. option","D. option"], "correct": "B", "difficulty": "medium" },
      { "id": "L3", "question": "Question in English about the audio?", "options": ["A. option","B. option","C. option","D. option"], "correct": "C", "difficulty": "medium" },
      { "id": "L4", "question": "Question in English about the audio?", "options": ["A. option","B. option","C. option","D. option"], "correct": "D", "difficulty": "medium" },
      { "id": "L5", "question": "Question in English about the audio?", "options": ["A. option","B. option","C. option","D. option"], "correct": "A", "difficulty": "hard" }
    ]
  },
  "speaking": {
    "prompt": "A clear speaking task in English. E.g. Describe a place you enjoy visiting and explain why you like it.",
    "level_target": "B1",
    "time_seconds": 90,
    "sample_answer": "A 80-100 word sample response in English at B1 level."
  },
  "reading": {
    "passage": "An English passage of 180-220 words on an academic-lite or everyday topic related to the main topic.",
    "questions": [
      { "id": "R1", "question": "Question in English about the passage?", "options": ["A. option","B. option","C. option","D. option"], "correct": "A", "difficulty": "easy" },
      { "id": "R2", "question": "Question in English about the passage?", "options": ["A. option","B. option","C. option","D. option"], "correct": "B", "difficulty": "easy" },
      { "id": "R3", "question": "Question in English about the passage?", "options": ["A. option","B. option","C. option","D. option"], "correct": "C", "difficulty": "medium" },
      { "id": "R4", "question": "Question in English about the passage?", "options": ["A. option","B. option","C. option","D. option"], "correct": "A", "difficulty": "medium" },
      { "id": "R5", "question": "Question in English about the passage?", "options": ["A. option","B. option","C. option","D. option"], "correct": "D", "difficulty": "hard" }
    ]
  },
  "writing": {
    "prompt": "A clear writing task in English requiring 80-120 words. E.g. Write an email, short essay, or opinion paragraph related to the topic.",
    "min_words": 80,
    "max_words": 120,
    "criteria": ["Task Achievement", "Coherence & Cohesion", "Lexical Resource", "Grammatical Range & Accuracy"]
  },
  "grammar_vocab": {
    "questions": [
      { "id": "G1",  "difficulty": "easy",   "skill": "grammar",    "level": "A1", "question": "Complete the sentence in English: ___", "options": ["A. option","B. option","C. option","D. option"], "correct": "A", "explanation": "Brief English explanation of why this answer is correct." },
      { "id": "G2",  "difficulty": "easy",   "skill": "vocabulary", "level": "A1", "question": "Complete the sentence in English: ___", "options": ["A. option","B. option","C. option","D. option"], "correct": "B", "explanation": "Brief English explanation." },
      { "id": "G3",  "difficulty": "easy",   "skill": "grammar",    "level": "A2", "question": "Complete the sentence in English: ___", "options": ["A. option","B. option","C. option","D. option"], "correct": "C", "explanation": "Brief English explanation." },
      { "id": "G4",  "difficulty": "easy",   "skill": "vocabulary", "level": "A2", "question": "Complete the sentence in English: ___", "options": ["A. option","B. option","C. option","D. option"], "correct": "A", "explanation": "Brief English explanation." },
      { "id": "G5",  "difficulty": "medium", "skill": "grammar",    "level": "B1", "question": "Complete the sentence in English: ___", "options": ["A. option","B. option","C. option","D. option"], "correct": "B", "explanation": "Brief English explanation." },
      { "id": "G6",  "difficulty": "medium", "skill": "vocabulary", "level": "B1", "question": "Complete the sentence in English: ___", "options": ["A. option","B. option","C. option","D. option"], "correct": "C", "explanation": "Brief English explanation." },
      { "id": "G7",  "difficulty": "medium", "skill": "grammar",    "level": "B2", "question": "Complete the sentence in English: ___", "options": ["A. option","B. option","C. option","D. option"], "correct": "A", "explanation": "Brief English explanation." },
      { "id": "G8",  "difficulty": "medium", "skill": "vocabulary", "level": "B2", "question": "Complete the sentence in English: ___", "options": ["A. option","B. option","C. option","D. option"], "correct": "B", "explanation": "Brief English explanation." },
      { "id": "G9",  "difficulty": "hard",   "skill": "grammar",    "level": "C1", "question": "Complete the sentence in English: ___", "options": ["A. option","B. option","C. option","D. option"], "correct": "C", "explanation": "Brief English explanation." },
      { "id": "G10", "difficulty": "hard",   "skill": "vocabulary", "level": "C1", "question": "Complete the sentence in English: ___", "options": ["A. option","B. option","C. option","D. option"], "correct": "A", "explanation": "Brief English explanation." }
    ]
  }
}

REMINDER: ALL content must be in ENGLISH. Questions, answer options, prompts, passages, scripts — everything. Do not write any Vietnamese.
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

    // FIX: Truyền system prompt + tăng maxTokens lên 4096 cho đề thi đầy đủ
    const raw = await callGemini(
      GENERATE_PROMPT(usedTopics),
      SYSTEM_PROMPTS.generate,
      undefined,
      4096
    )
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    // Validate cấu trúc bắt buộc
    if (!parsed.listening || !parsed.speaking || !parsed.reading || !parsed.writing || !parsed.grammar_vocab) {
      throw new Error('Incomplete exam structure in AI response')
    }

    // FIX: Validate đủ cả 5 section (trước chỉ check 3)
    if (parsed.listening.questions.length < 3)    throw new Error('Listening: insufficient questions')
    if (parsed.reading.questions.length < 4)      throw new Error('Reading: insufficient questions')
    if (parsed.grammar_vocab.questions.length < 10) throw new Error('Grammar: insufficient questions')
    if (!parsed.speaking.prompt?.trim())           throw new Error('Speaking: missing prompt')
    if (!parsed.writing.prompt?.trim())            throw new Error('Writing: missing prompt')

    return NextResponse.json({ exam: parsed })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Failed to generate test. Please try again.' }, { status: 500 })
  }
}