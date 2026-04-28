import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Save speaking session result
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    topicId, topicTitle, cert, level,
    transcript, overallScore, fluency, vocabulary, grammar, content,
    thoiGianNoi, detectedKeywords,
  } = body

  const { data, error } = await supabase.from('PhienLuyenThi').insert({
    nguoi_dung_id: user.id,
    loai_chung_chi: cert,
    ky_nang: 'NOI',
    diem_so: Math.round(overallScore),
    tong_so_cau: 10, // max score 10
    so_cau_dung: Math.round(overallScore),
    thoi_gian_lam_bai: thoiGianNoi || 0,
    cau_tra_loi_json: {
      topicId, topicTitle, level, transcript,
      scores: { overallScore, fluency, vocabulary, grammar, content },
      detectedKeywords,
    },
    phan_tich_ai: `Tổng: ${overallScore}/10 | Trôi chảy: ${fluency} | Từ vựng: ${vocabulary} | Ngữ pháp: ${grammar} | Nội dung: ${content}`,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ session: data })
}

// GET: Get speaking history
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('PhienLuyenThi')
    .select('*')
    .eq('nguoi_dung_id', user.id)
    .eq('ky_nang', 'NOI')
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ sessions: data || [] })
}
