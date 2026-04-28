import { createClient } from '@/lib/supabase/server'
import VocabAdminClient from './VocabAdminClient'

export default async function VocabAdminPage() {
  const supabase = createClient()
  const { data: sets } = await supabase.from('BoDuVung').select('*').order('thu_tu_hien_thi' as never)
  return <VocabAdminClient sets={sets || []} />
}
