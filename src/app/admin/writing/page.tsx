import { createClient } from '@/lib/supabase/server'
import WritingAdminClient from './WritingAdminClient'

export default async function WritingAdminPage() {
  const supabase = createClient()
  const { data: lessons } = await supabase
    .from('bailuyenviet')
    .select('*')
    .order('thu_tu')
  return <WritingAdminClient lessons={lessons || []} />
}
