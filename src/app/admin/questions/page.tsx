import { createClient } from '@/lib/supabase/server'
import QuestionsClient from './QuestionsClient'
export default async function QuestionsPage() {
  const supabase = createClient()
  const { data: questions } = await supabase.from('NganHangCauHoi').select('*').order('created_at', { ascending: false })
  return <QuestionsClient questions={questions || []} />
}
