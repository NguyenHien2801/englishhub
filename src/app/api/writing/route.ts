// app/api/writing/route.ts — lưu kết quả vào PhienLuyenThi (bảng có sẵn)
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const cookieStore = cookies()
  const supabaseUser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
  const { data: { user } } = await supabaseUser.auth.getUser()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.from('PhienLuyenThi').insert({
    nguoi_dung_id:    user?.id ?? null,
    loai_chung_chi:   body.chungChi,       // 'VSTEP' | 'TOEIC' | 'APTIS'
    ky_nang:          'VIET',
    la_de_day_du:     false,
    diem_so:          body.tongDiem,        // 0-40
    diem_quy_doi:     body.tongDiem / 40 * 10, // quy về 10
    tong_so_cau:      1,
    so_cau_dung:      null,
    thoi_gian_lam_bai: body.thoiGianGiay ?? null,
    cau_tra_loi_json: {                     // lưu bài viết + metadata
      bai_luyen_viet_id: body.baiLuyenVietId,
      tieu_de:           body.tieuDe,
      noi_dung_bai_viet: body.noiDungBaiViet,
      so_tu:             body.soTu,
    },
    phan_tich_ai: JSON.stringify(body.ketQuaAi), // toàn bộ feedback AI
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}