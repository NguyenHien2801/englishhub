import { createClient } from '@/lib/supabase/server'
import LevelTestAdminClient from './LevelTestAdminClient'

export default async function LevelTestAdminPage() {
  const supabase = createClient()
  const { data: results } = await supabase
    .from('KetQuaLevelTest')
    .select('*, NguoiDung(ho_ten, ma_sinh_vien, lop, khoa)')
    .order('created_at', { ascending: false })
  return <LevelTestAdminClient results={results || []} />
}
