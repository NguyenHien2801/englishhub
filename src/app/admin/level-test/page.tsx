import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import LevelTestAdminClient from './LevelTestAdminClient'

export default async function LevelTestAdminPage() {
  // Dùng service role để bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: results } = await supabase
    .from('KetQuaLevelTest')
    .select('*, NguoiDung(ho_ten, ma_sinh_vien, lop, khoa)')
    .order('created_at', { ascending: false })

  return <LevelTestAdminClient results={results || []} />
}