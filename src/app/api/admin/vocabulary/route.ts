import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('NguoiDung').select('vai_tro').eq('id', user.id).single()
  if (!profile || profile.vai_tro !== 'admin') return null
  return user
}

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const bo_du_vung_id = searchParams.get('bo_du_vung_id')
  const stats         = searchParams.get('stats')

  // ── Thống kê học tập cho 1 bộ từ ──
  if (bo_du_vung_id && stats === 'true') {
    // Lấy tất cả từ trong bộ
    const { data: tuVungList } = await supabaseAdmin
      .from('TuVung')
      .select('id')
      .eq('bo_du_vung_id', bo_du_vung_id)

    const wordIds = (tuVungList || []).map(w => w.id)

    if (wordIds.length === 0) {
      return NextResponse.json({
        tong_tu: 0, tong_sinh_vien: 0,
        trang_thai: { moi: 0, dang_hoc: 0, on_tap: 0, thuan_thuc: 0 },
        ty_le_thuan_thuc: 0,
      })
    }

    // Lấy tiến độ học của tất cả sinh viên với các từ trong bộ
    const { data: tienDo } = await supabaseAdmin
      .from('TienDoHocTuVung')
      .select('nguoi_dung_id, trang_thai')
      .in('tu_vung_id', wordIds)

    const list = tienDo || []

    // Đếm theo trạng thái
    const trangThai = { moi: 0, dang_hoc: 0, on_tap: 0, thuan_thuc: 0 }
    for (const row of list) {
      if (row.trang_thai === 'moi')        trangThai.moi++
      else if (row.trang_thai === 'dang_hoc')  trangThai.dang_hoc++
      else if (row.trang_thai === 'on_tap')    trangThai.on_tap++
      else if (row.trang_thai === 'thuan_thuc') trangThai.thuan_thuc++
    }

    const tongSinhVien = new Set(list.map(r => r.nguoi_dung_id)).size
    const tyLe = list.length > 0 ? Math.round(trangThai.thuan_thuc / list.length * 100) : 0

    return NextResponse.json({
      tong_tu:          wordIds.length,
      tong_sinh_vien:   tongSinhVien,
      trang_thai:       trangThai,
      ty_le_thuan_thuc: tyLe,
      tong_luot_hoc:    list.length,
    })
  }

  // ── Load từ trong bộ ──
  if (bo_du_vung_id) {
    const { data: tuVungList, error } = await supabaseAdmin
      .from('TuVung')
      .select('*')
      .eq('bo_du_vung_id', bo_du_vung_id)
      .order('thu_tu_hien_thi')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const words = tuVungList || []
    if (words.length > 0) {
      const { data: cacheList } = await supabaseAdmin
        .from('TuVungCache')
        .select('tu_tieng_anh, nghia_tieng_viet, phat_am_ipa')
        .in('tu_tieng_anh', words.map(w => w.tu_tieng_anh))

      const cacheMap = Object.fromEntries((cacheList || []).map(c => [c.tu_tieng_anh, c]))
      const merged = words.map(w => ({ ...w, TuVungCache: cacheMap[w.tu_tieng_anh] || null }))
      return NextResponse.json(merged)
    }

    return NextResponse.json([])
  }

  // ── Load danh sách bộ từ ──
  const { data } = await supabase.from('BoDuVung').select('*').order('created_at')
  return NextResponse.json({ sets: data || [] })
}

// ── Tạo bộ từ mới ──
export async function POST(request: Request) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { data, error } = await supabase.from('BoDuVung')
    .insert({ ...body, tong_so_tu: 0, la_cong_khai: true }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ set: data })
}

// ── Sửa bộ từ ──
export async function PATCH(request: Request) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await request.json()
  const { ten_bo, mo_ta, cap_do, loai_bo, chu_de } = body

  const { data, error } = await supabase.from('BoDuVung')
    .update({ ten_bo, mo_ta, cap_do, loai_bo, chu_de })
    .eq('id', id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ set: data })
}

// ── Xóa bộ từ ──
export async function DELETE(request: Request) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase.from('BoDuVung').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}