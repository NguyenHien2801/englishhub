import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('NguoiDung').select('vai_tro').eq('id', user.id).single()
  if (!profile || profile.vai_tro !== 'admin') return null
  return user
}

export async function GET(request: Request) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const loai = searchParams.get('loai')
  const kyNang = searchParams.get('kyNang')

  let query = supabase.from('NganHangCauHoi').select('*').order('created_at', { ascending: false })
  if (loai) query = query.eq('loai_chung_chi', loai)
  if (kyNang) query = query.eq('ky_nang', kyNang)

  const { data, count } = await query
  return NextResponse.json({ questions: data || [], count })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { data, error } = await supabase.from('NganHangCauHoi').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ question: data })
}

export async function DELETE(request: Request) {
  const supabase = createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase.from('NganHangCauHoi').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
