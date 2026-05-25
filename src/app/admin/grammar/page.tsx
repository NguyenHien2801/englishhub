import { createClient } from '@/lib/supabase/server'
import GrammarAdminClient from './GrammarAdminClient'

export default async function GrammarAdminPage() {
  const supabase = createClient()
  const { data: lessons } = await supabase
    .from('BaiHocNguPhap')
    .select('*')   // ← đổi thành * để lấy đủ tất cả cột
    .order('thu_tu_hien_thi')

  return <GrammarAdminClient lessons={lessons || []} />
}