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

// GET — nếu có ?bo_du_vung_id thì trả từ, không thì trả danh sách bộ từ
export async function GET(request: Request) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const bo_du_vung_id = searchParams.get('bo_du_vung_id')

  // Load từ trong bộ — query riêng rồi merge vì không có foreign key
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

  // Load danh sách bộ từ
  const { data } = await supabase.from('BoDuVung').select('*').order('created_at')
  return NextResponse.json({ sets: data || [] })
}

// POST create new set
export async function POST(request: Request) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { data, error } = await supabase.from('BoDuVung').insert({ ...body, tong_so_tu: 0, la_cong_khai: true }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ set: data })
}

// DELETE a set
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