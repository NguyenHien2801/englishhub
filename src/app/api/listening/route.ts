import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Lấy danh sách bài nghe từ DB hoặc lịch sử làm bài
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const loai   = searchParams.get('loai')
  const cap_do = searchParams.get('cap_do')
  const mode   = searchParams.get('mode')

  // Lấy lịch sử làm bài
  if (mode === 'history') {
    const { data } = await supabase
      .from('PhienLuyenThi')
      .select('*')
      .eq('nguoi_dung_id', user.id)
      .eq('ky_nang', 'NGHE')
      .order('created_at', { ascending: false })
      .limit(20)
    return NextResponse.json({ sessions: data || [] })
  }

  // Lấy danh sách bài nghe + câu hỏi (thêm loai_cau_hoi và du_lieu_them)
  let query = supabase
    .from('BaiNghe')
    .select(`
      *,
      BaiNgheCauHoi (
        id,
        so_thu_tu,
        noi_dung,
        cac_lua_chon,
        dap_an_dung,
        giai_thich,
        loai_cau_hoi,
        du_lieu_them
      )
    `)
    .eq('da_kiem_duyet', true)
    .order('created_at', { ascending: false })

  if (loai)   query = query.eq('loai_chung_chi', loai)
  if (cap_do) query = query.eq('cap_do', cap_do)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Sort câu hỏi theo thứ tự + normalize dap_an_dung cho true_false
  const baiNghe = (data || []).map(bai => ({
    ...bai,
    BaiNgheCauHoi: (bai.BaiNgheCauHoi || [])
      .sort((a: any, b: any) => a.so_thu_tu - b.so_thu_tu)
      .map((ch: any) => ({
        ...ch,
        // Normalize đáp án true_false về dạng chuẩn: TRUE / FALSE / NOT_GIVEN
        dap_an_dung: ch.loai_cau_hoi === 'true_false'
          ? ch.dap_an_dung
              .trim()
              .toUpperCase()
              .replace(/\s+/g, '_')
          : ch.dap_an_dung,
      })),
  }))

  // Lấy lịch sử để biết bài nào đã làm
  const { data: lichSu } = await supabase
    .from('PhienLuyenThi')
    .select('cau_tra_loi_json, diem_so, tong_so_cau, created_at')
    .eq('nguoi_dung_id', user.id)
    .eq('ky_nang', 'NGHE')
    .order('created_at', { ascending: false })

  // Map baiId → kết quả gần nhất
  const daLamMap: Record<string, { diem: number; tong: number; ngay: string }> = {}
  for (const s of lichSu || []) {
    const baiId = (s.cau_tra_loi_json as any)?.baiId
    if (baiId && !daLamMap[baiId]) {
      daLamMap[baiId] = {
        diem: s.diem_so    ?? 0,
        tong: s.tong_so_cau ?? 0,
        ngay: s.created_at,
      }
    }
  }

  return NextResponse.json({ baiNghe, daLamMap })
}

// POST: Lưu kết quả làm bài
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { baiId, tieu_de, loai_chung_chi, cap_do, correct, total, thoiGianLamBai, cauTraLoi } = body

  if (!baiId || correct === undefined || !total) {
    return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 })
  }

  const phanTram = Math.round((correct / total) * 100)

  const { data, error } = await supabase.from('PhienLuyenThi').insert({
    nguoi_dung_id:     user.id,
    loai_chung_chi:    loai_chung_chi || 'GENERAL',
    ky_nang:           'NGHE',
    diem_so:           correct,
    tong_so_cau:       total,
    so_cau_dung:       correct,
    thoi_gian_lam_bai: thoiGianLamBai || 0,
    cau_tra_loi_json: {
      baiId,
      tieu_de,
      cap_do,
      phanTram,
      cauTraLoi,
    },
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Cập nhật lượt làm bài
  await supabase.rpc('increment_luot_lam', { bai_id: baiId }).maybeSingle()

  return NextResponse.json({ session: data, phanTram })
}