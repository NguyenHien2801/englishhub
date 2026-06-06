import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Admin client dùng Service Role Key
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('NguoiDung').select('vai_tro').eq('id', user.id).single()
  if (!profile || profile.vai_tro !== 'admin') return null
  return user
}

export async function GET() {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('NguoiDung')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ students: data || [] })
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, vai_tro } = await request.json()
  const { error } = await supabase.from('NguoiDung').update({ vai_tro }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

// ── POST: Thêm sinh viên mới ──────────────────────────────
export async function POST(request: Request) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ma_sinh_vien, ho_ten, lop, khoa, muc_tieu_hoc, trinh_do_hien_tai, vai_tro } = await request.json()

  if (!ma_sinh_vien || !ho_ten) {
    return NextResponse.json({ error: 'Thiếu họ tên hoặc MSSV' }, { status: 400 })
  }

  // Kiểm tra MSSV đã tồn tại chưa (tránh lỗi email trùng ở Auth)
  const { data: existing } = await supabaseAdmin
    .from('NguoiDung')
    .select('id')
    .eq('ma_sinh_vien', ma_sinh_vien)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'MSSV này đã được đăng ký trong hệ thống' }, { status: 400 })
  }

  // Bước 1: Tạo auth user
  const tempEmail = `${ma_sinh_vien}@englishhub.local`
  const tempPassword = `EH_${ma_sinh_vien}_${crypto.randomUUID().slice(0, 8)}`

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: tempEmail,
    password: tempPassword,
    email_confirm: true,
  })
  if (authError) {
    // Bắt lỗi email trùng rõ ràng hơn
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
      return NextResponse.json({ error: 'MSSV này đã tồn tại trong hệ thống Auth' }, { status: 400 })
    }
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Bước 2: Insert vào NguoiDung
  const { data: inserted, error: dbError } = await supabaseAdmin
    .from('NguoiDung')
    .insert([{ id: authData.user.id, ma_sinh_vien, ho_ten, lop, khoa, muc_tieu_hoc, trinh_do_hien_tai, vai_tro }])
    .select()
    .single()

  if (dbError) {
    // Rollback: xóa auth user nếu insert DB lỗi
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ data: inserted })
}

// ── DELETE: Xóa sinh viên triệt để ───────────────────────
export async function DELETE(request: Request) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 })

  // Xóa Auth user — DB sẽ cascade xóa row NguoiDung tự động
  // (vì id trong NguoiDung = auth.users.id, có FK constraint)
  // Nếu không có cascade thì xóa DB trước, Auth sau
  const { error: dbError } = await supabaseAdmin
    .from('NguoiDung')
    .delete()
    .eq('id', id)

  if (dbError) return NextResponse.json({ error: 'Lỗi xóa dữ liệu: ' + dbError.message }, { status: 500 })

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (authError) return NextResponse.json({ error: 'Lỗi xóa Auth: ' + authError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}