import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Lấy danh sách bài đọc + lịch sử làm bài của user
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const loai   = searchParams.get('loai')
  const cap_do = searchParams.get('cap_do')

  // Lấy danh sách bài đọc kèm câu hỏi
  let query = supabase
    .from('BaiDoc')
    .select(`
      *,
      BaiDocCauHoi (
        id,
        so_thu_tu,
        loai_cau_hoi,
        noi_dung,
        cac_lua_chon,
        dap_an_dung,
        giai_thich
      )
    `)
    .eq('da_kiem_duyet', true)
    .eq('dang_hoat_dong', true)
    .order('thu_tu', { ascending: true })

  if (loai)   query = query.eq('loai_chung_chi', loai)
  if (cap_do) query = query.eq('cap_do', cap_do)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const baiDoc = (data || []).map(bai => ({
    ...bai,
    BaiDocCauHoi: (bai.BaiDocCauHoi || [])
      .sort((a: any, b: any) => a.so_thu_tu - b.so_thu_tu),
  }))

  // Lấy lịch sử kết quả của user
  const { data: lichSu } = await supabase
    .from('KetQuaDocHieu')
    .select('bai_doc_id, so_cau_dung, tong_so_cau, created_at')
    .eq('nguoi_dung_id', user.id)
    .order('created_at', { ascending: false })

  // Map baiId → kết quả gần nhất
  const daLamMap: Record<string, { diem: number; tong: number; ngay: string }> = {}
  for (const s of lichSu || []) {
    if (s.bai_doc_id && !daLamMap[s.bai_doc_id]) {
      daLamMap[s.bai_doc_id] = {
        diem: s.so_cau_dung  ?? 0,
        tong: s.tong_so_cau  ?? 0,
        ngay: s.created_at,
      }
    }
  }

  return NextResponse.json({ baiDoc, daLamMap })
}

// POST: Lưu kết quả làm bài đọc
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { baiDocId, correct, total, thoiGianGiay, chiTietTraLoi } = body

  if (!baiDocId || correct === undefined || !total) {
    return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 })
  }

  const { data, error } = await supabase.from('KetQuaDocHieu').insert({
    nguoi_dung_id:    user.id,
    bai_doc_id:       baiDocId,
    so_cau_dung:      correct,
    tong_so_cau:      total,
    chi_tiet_tra_loi: chiTietTraLoi ?? null,
    thoi_gian_giay:   thoiGianGiay ?? 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Tăng lượt làm
  await supabase
    .from('BaiDoc')
    .update({ luot_lam: supabase.rpc as any })
    .eq('id', baiDocId)

  return NextResponse.json({ result: data, phanTram: Math.round((correct / total) * 100) })
}