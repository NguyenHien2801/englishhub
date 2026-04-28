import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Nếu chưa đăng nhập thì về login
  if (!user) redirect('/login')

  const [{ data: profile }, { data: recentSRS }, { data: recentExams }] = await Promise.all([
    supabase.from('NguoiDung').select('*').eq('id', user.id).single(),
    supabase.from('TienDoHocTuVung').select('*').eq('nguoi_dung_id', user.id).order('ngay_on_tiep_theo').limit(20),
    supabase.from('PhienLuyenThi').select('*').eq('nguoi_dung_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])

  const dueTodayCount = (recentSRS || []).filter(s => {
    const due = new Date(s.ngay_on_tiep_theo)
    const today = new Date()
    return due <= today
  }).length

  const totalMastered = (recentSRS || []).filter(s => s.trang_thai === 'thuan_thuc').length

  return <DashboardClient
    profile={profile}
    dueTodayCount={dueTodayCount}
    totalMastered={totalMastered}
    recentExams={recentExams || []}
  />
}