import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini, SYSTEM_PROMPTS, GeminiMessage } from '@/lib/gemini/client'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { message, history, type, sessionId } = body

  // Map history to Gemini format
  const geminiHistory: GeminiMessage[] = (history || []).map((m: { vai_tro: string; noi_dung: string }) => ({
    role: m.vai_tro === 'user' ? 'user' : 'model',
    parts: [{ text: m.noi_dung }]
  }))

  let systemPrompt = SYSTEM_PROMPTS.chatbot
  if (type === 'grammar') systemPrompt = SYSTEM_PROMPTS.grammar
  if (type === 'writing') systemPrompt = SYSTEM_PROMPTS.writing
  if (type === 'vocabulary') systemPrompt = SYSTEM_PROMPTS.vocabulary

  const aiResponse = await callGemini(message, systemPrompt, geminiHistory)

  // Save to chat history
  const phienId = sessionId || `session_${Date.now()}`
  await supabase.from('LichSuChatbot').insert([
    { nguoi_dung_id: user.id, phien_id: phienId, vai_tro: 'user', noi_dung: message, loai_ngucan: type || 'general' },
    { nguoi_dung_id: user.id, phien_id: phienId, vai_tro: 'assistant', noi_dung: aiResponse, loai_ngucan: type || 'general' },
  ])

  return NextResponse.json({ response: aiResponse, sessionId: phienId })
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  const query = supabase.from('LichSuChatbot')
    .select('*')
    .eq('nguoi_dung_id', user.id)
    .order('created_at', { ascending: true })
    .limit(100)

  if (sessionId) query.eq('phien_id', sessionId)

  const { data } = await query
  return NextResponse.json({ messages: data || [] })
}
