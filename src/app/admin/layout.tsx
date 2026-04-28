import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('NguoiDung').select('vai_tro, ho_ten, ma_sinh_vien').eq('id', user.id).single()

  if (!profile || profile.vai_tro !== 'admin') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-[#F8F7F2]">
      <AdminSidebar user={profile} />
      <main className="flex-1 ml-60 p-8 min-h-screen">{children}</main>
    </div>
  )
}
