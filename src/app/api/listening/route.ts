import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Save listening session result
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { topicId, topicTitle, cert, level, correct, total, thoiGianLamBai } = body

  const phanTramDung = Math.round((correct / total) * 100)

  const { data, error } = await supabase.from('PhienLuyenThi').insert({
    nguoi_dung_id: user.id,
    loai_chung_chi: cert,
    ky_nang: 'NGHE',
    diem_so: correct,
    tong_so_cau: total,
    so_cau_dung: correct,
    thoi_gian_lam_bai: thoiGianLamBai || 0,
    cau_tra_loi_json: { topicId, topicTitle, level },
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ session: data, phanTramDung })
}

// GET: Get listening history
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('PhienLuyenThi')
    .select('*')
    .eq('nguoi_dung_id', user.id)
    .eq('ky_nang', 'NGHE')
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ sessions: data || [] })
}
