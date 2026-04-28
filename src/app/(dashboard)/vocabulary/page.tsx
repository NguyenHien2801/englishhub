import { createClient } from '@/lib/supabase/server'
import VocabularyClient from './VocabularyClient'

export default async function VocabularyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: sets }, { data: dueWords }] = await Promise.all([
    supabase.from('BoDuVung').select('*').eq('la_cong_khai', true).order('thu_tu_hien_thi' as never),
    supabase.from('TienDoHocTuVung')
      .select('*, TuVung(*)')
      .eq('nguoi_dung_id', user!.id)
      .lte('ngay_on_tiep_theo', new Date().toISOString().split('T')[0])
      .limit(50),
  ])

  return <VocabularyClient sets={sets || []} dueWords={dueWords || []} userId={user!.id} />
}
