import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    { data: profile },
    { count: wordsDueCount },
    { data: recentExams },
    { count: masteredCount },
  ] = await Promise.all([
    supabase.from('NguoiDung').select('*').eq('id', user.id).single(),
    supabase.from('TienDoHocTuVung')
      .select('*', { count: 'exact', head: true })
      .eq('nguoi_dung_id', user.id)
      .lte('ngay_on_tiep_theo', new Date().toISOString().split('T')[0]),
    supabase.from('PhienLuyenThi')
      .select('diem_so,tong_so_cau,loai_chung_chi,ky_nang,created_at')
      .eq('nguoi_dung_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('TienDoHocTuVung')
      .select('*', { count: 'exact', head: true })
      .eq('nguoi_dung_id', user.id)
      .eq('trang_thai', 'thuan_thuc'),
  ])

  return NextResponse.json({
    profile,
    wordsDueCount: wordsDueCount || 0,
    masteredCount: masteredCount || 0,
    recentExams: recentExams || [],
  })
}
