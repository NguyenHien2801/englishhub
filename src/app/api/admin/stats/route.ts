import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const [
    { count: totalSV },
    { count: totalWords },
    { count: totalExams },
    { count: totalQuestions },
    { data: examsByType },
    { data: recentExams },
  ] = await Promise.all([
    supabase.from('NguoiDung').select('*', { count: 'exact', head: true }).eq('vai_tro', 'sinh_vien'),
    supabase.from('TuVung').select('*', { count: 'exact', head: true }),
    supabase.from('PhienLuyenThi').select('*', { count: 'exact', head: true }),
    supabase.from('NganHangCauHoi').select('*', { count: 'exact', head: true }),
    supabase.from('PhienLuyenThi')
      .select('loai_chung_chi, ky_nang, diem_so, tong_so_cau')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('PhienLuyenThi')
      .select('loai_chung_chi, ky_nang, diem_so, tong_so_cau, created_at, NguoiDung(ho_ten, ma_sinh_vien)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return NextResponse.json({
    totalSV: totalSV || 0,
    totalWords: totalWords || 0,
    totalExams: totalExams || 0,
    totalQuestions: totalQuestions || 0,
    examsByType: examsByType || [],
    recentExams: recentExams || [],
  })
}
