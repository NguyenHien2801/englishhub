import { createClient } from '@supabase/supabase-js'
import VocabAdminClient from './VocabAdminClient'

export default async function VocabAdminPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: sets } = await supabase
    .from('BoDuVung')
    .select('*')
    .order('created_at')

  return <VocabAdminClient sets={sets || []} />
}