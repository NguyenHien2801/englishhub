import { createClient } from '@/lib/supabase/server'
import SpeakingAdminClient from './SpeakingAdminClient'

export default async function SpeakingAdminPage() {
  const supabase = createClient()
  const { data } = await supabase.from('BaiLuyenNoi').select('*').order('created_at', { ascending: false })
  return <SpeakingAdminClient tasks={data ?? []} />
}