import { createClient } from '@/lib/supabase/server'
import GrammarClient from './GrammarClient'

export default async function GrammarPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: lessons }, { data: progress }] = await Promise.all([
    supabase.from('BaiHocNguPhap').select('*').order('cap_do').order('thu_tu_hien_thi'),
    supabase.from('TienDoNguPhap').select('*').eq('nguoi_dung_id', user!.id),
  ])

  const completedIds = new Set((progress || []).filter(p => p.da_hoan_thanh).map(p => p.bai_hoc_id))

  return <GrammarClient lessons={lessons || []} completedIds={completedIds} userId={user!.id} />
}
