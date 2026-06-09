import { createClient } from '@supabase/supabase-js'
import ListeningAdminClient from './ListeningAdminClient'

export default async function ListeningAdminPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: lessons } = await supabase
    .from('BaiNghe')
    .select('id, tieu_de, mo_ta, cap_do, loai_chung_chi, chu_de, thoi_gian_giay, luot_lam, da_kiem_duyet, created_at')
    .order('created_at', { ascending: false })

  return <ListeningAdminClient lessons={lessons || []} />
}
