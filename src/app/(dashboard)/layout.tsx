import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from './DashboardLayoutClient'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 👇 Gọi cập nhật streak mỗi khi vào dashboard
  await supabase.rpc('cap_nhat_streak', { p_user_id: user.id })

  const { data: profile } = await supabase
    .from('NguoiDung')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <DashboardLayoutClient profile={profile}>
      {children}
    </DashboardLayoutClient>
  )
}