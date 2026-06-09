import { createClient } from '@supabase/supabase-js'
import WritingAdminClient from './WritingAdminClient'

export default async function WritingAdminPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: lessons } = await supabase
    .from('bailuyenviet')
    .select('*')
    .order('thu_tu')
  return <WritingAdminClient lessons={lessons || []} />
}