import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET: topics hoặc history ──────────────────────────────────────────────────
export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  // /api/speaking?history=1 → lịch sử đã làm
  if (searchParams.get('history') === '1') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ daLamMap: {} })

    const { data } = await supabase
      .from('KetQuaLuyenNoi')
      .select('bai_luyen_noi_id, tong_diem, max_diem, created_at')
      .eq('nguoi_dung_id', user.id)
      .order('created_at', { ascending: false })

    const daLamMap: Record<string, { diem: number; tong: number; ngay: string }> = {}
    for (const row of data ?? []) {
      if (!daLamMap[row.bai_luyen_noi_id]) {
        daLamMap[row.bai_luyen_noi_id] = {
          diem: row.tong_diem,
          tong: row.max_diem,
          ngay: row.created_at,
        }
      }
    }
    return NextResponse.json({ daLamMap })
  }

  // /api/speaking → danh sách topics (không cần auth)
  const { data, error } = await supabase
    .from('BaiLuyenNoi')
    .select('*')
    .eq('dang_hoat_dong', true)
    .order('thu_tu', { ascending: true })

  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data ?? [])
}

// ── POST: lưu kết quả ────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { baiLuyenNoiId, transcript, tong_diem, max_diem, band, phan_tich_ai, thoi_gian_giay } = await request.json()

  const { data, error } = await supabase
    .from('KetQuaLuyenNoi')
    .insert({
      nguoi_dung_id: user.id,
      bai_luyen_noi_id: baiLuyenNoiId,
      transcript, tong_diem, max_diem, band, phan_tich_ai, thoi_gian_giay,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ result: data })
}