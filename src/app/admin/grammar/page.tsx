import { createClient } from '@/lib/supabase/server'
import GrammarAdminClient from './GrammarAdminClient'
export default async function GrammarAdminPage() {
  const supabase = createClient()
  const { data: lessons } = await supabase.from('BaiHocNguPhap').select('id, tieu_de, cap_do, danh_muc, tong_bai_tap, thu_tu_hien_thi').order('cap_do').order('thu_tu_hien_thi')
  return <GrammarAdminClient lessons={lessons || []} />
}
