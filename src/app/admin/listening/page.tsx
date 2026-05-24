import { createClient } from '@/lib/supabase/server'
import ListeningAdminClient from './ListeningAdminClient'

export default async function ListeningAdminPage() {
  const supabase = createClient()
  const { data: lessons } = await supabase
    .from('BaiNghe')
    .select('id, tieu_de, mo_ta, cap_do, loai_chung_chi, chu_de, thoi_gian_giay, luot_lam, da_kiem_duyet, created_at')
    .order('created_at', { ascending: false })

  return <ListeningAdminClient lessons={lessons || []} />
}
