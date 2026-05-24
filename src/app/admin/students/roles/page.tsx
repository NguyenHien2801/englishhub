import { createClient } from '@/lib/supabase/server'
import RolesAdminClient from './RolesAdminClient'

export default async function RolesAdminPage() {
  const supabase = createClient()
  const { data: users } = await supabase
    .from('NguoiDung')
    .select('id, ho_ten, ma_sinh_vien, lop, khoa, vai_tro, da_xac_thuc_truong, ngay_xac_thuc, created_at')
    .order('vai_tro')
    .order('created_at', { ascending: false })

  const { data: maXacThuc } = await supabase
    .from('MaXacThucTruong')
    .select('*')
    .order('created_at', { ascending: false })

  return <RolesAdminClient users={users || []} maXacThuc={maXacThuc || []} />
}
