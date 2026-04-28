import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Save writing submission + AI feedback
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    taskId, taskTitle, cert, level,
    writingText, wordCount,
    tongDiem, nhanXet, diemManh, canCaiThien, chiTiet,
  } = body

  const { data, error } = await supabase.from('PhienLuyenThi').insert({
    nguoi_dung_id: user.id,
    loai_chung_chi: cert,
    ky_nang: 'VIET',
    diem_so: Math.round(tongDiem / 4), // convert /40 to /10
    tong_so_cau: 40,
    so_cau_dung: tongDiem,
    thoi_gian_lam_bai: 0,
    cau_tra_loi_json: {
      taskId, taskTitle, level,
      writingText, wordCount,
      feedback: { tongDiem, nhanXet, diemManh, canCaiThien, chiTiet },
    },
    phan_tich_ai: nhanXet,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ session: data })
}

// GET: Get writing history
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('PhienLuyenThi')
    .select('*')
    .eq('nguoi_dung_id', user.id)
    .eq('ky_nang', 'VIET')
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ sessions: data || [] })
}
