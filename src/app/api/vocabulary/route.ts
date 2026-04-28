import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchFromDictionary } from '@/lib/dictionary/client'
import { callGemini, SYSTEM_PROMPTS } from '@/lib/gemini/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const word = searchParams.get('word')
  if (!word) return NextResponse.json({ error: 'Missing word' }, { status: 400 })

  const supabase = createClient()

  // Check cache
  const { data: cached } = await supabase
    .from('TuVungCache')
    .select('*')
    .eq('tu_tieng_anh', word.toLowerCase())
    .single()

  if (cached) {
    await supabase.from('TuVungCache')
      .update({ so_lan_truy_cap: (cached.so_lan_truy_cap || 0) + 1 })
      .eq('tu_tieng_anh', word.toLowerCase())
    return NextResponse.json({ cache: cached, source: 'cache' })
  }

  // Step 1: Free Dictionary API
  const dictData = await fetchFromDictionary(word)
  const phonetic = dictData?.phonetic || ''
  const audioUrl = dictData?.audioUrl || ''
  const enDefinition = dictData?.meanings?.[0]?.definitions?.[0]?.definition || ''
  const synonyms = dictData?.meanings?.[0]?.synonyms?.slice(0, 5) || []
  const antonyms = dictData?.meanings?.[0]?.antonyms?.slice(0, 3) || []
  const partOfSpeech = dictData?.meanings?.[0]?.partOfSpeech || ''

  // Step 2: Gemini AI generates Vietnamese content
  const prompt = `Cho từ tiếng Anh: "${word}" (${partOfSpeech || 'unknown POS'})
Định nghĩa tiếng Anh: "${enDefinition}"

Hãy tạo nội dung học từ vựng theo JSON (KHÔNG có markdown):
{
  "nghia_tieng_viet": "nghĩa tiếng Việt ngắn gọn, rõ ràng",
  "vi_du_cau": ["Ví dụ câu tiếng Anh 1 có từ này, liên quan thi TOEIC/VSTEP", "Ví dụ 2"],
  "vi_du_viet": ["Dịch câu 1", "Dịch câu 2"],
  "cach_nho": "Mẹo nhớ từ sáng tạo, có thể dùng câu chuyện, âm thanh, hoặc hình ảnh liên tưởng",
  "nguon_goc_tu": "Nguồn gốc từ ngắn gọn (tiếng Latin/Hy Lạp/etc) nếu có"
}`

  let aiData: Record<string, unknown> = {}
  try {
    const aiResponse = await callGemini(prompt, SYSTEM_PROMPTS.vocabulary)
    const cleaned = aiResponse.replace(/```json|```/g, '').trim()
    aiData = JSON.parse(cleaned)
  } catch {
    aiData = {
      nghia_tieng_viet: 'Đang cập nhật...',
      vi_du_cau: [],
      vi_du_viet: [],
      cach_nho: '',
      nguon_goc_tu: '',
    }
  }

  // Save to cache
  const cacheData = {
    tu_tieng_anh: word.toLowerCase(),
    phat_am_ipa: phonetic,
    audio_url: audioUrl,
    dinh_nghia_tieng_anh: enDefinition,
    nghia_tieng_viet: aiData.nghia_tieng_viet as string || '',
    vi_du_cau: aiData.vi_du_cau as string[] || [],
    vi_du_viet: aiData.vi_du_viet as string[] || [],
    tu_dong_nghia: synonyms,
    tu_trai_nghia: antonyms,
    cach_nho: aiData.cach_nho as string || '',
    nguon_goc_tu: aiData.nguon_goc_tu as string || '',
    so_lan_truy_cap: 1,
  }

  const { data: newCache } = await supabase.from('TuVungCache').insert(cacheData).select().single()

  return NextResponse.json({ cache: newCache || cacheData, source: 'generated' })
}

// POST: Add new word to a vocab set
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { tu_tieng_anh, bo_du_vung_id, loai_tu, cap_do } = body

  const { data, error } = await supabase.from('TuVung').insert({
    tu_tieng_anh: tu_tieng_anh.toLowerCase().trim(),
    bo_du_vung_id,
    loai_tu,
    cap_do,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Trigger cache generation in background
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/vocabulary?word=${tu_tieng_anh}`)

  return NextResponse.json({ word: data })
}
