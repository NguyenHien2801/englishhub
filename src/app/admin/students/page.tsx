import { createClient } from '@/lib/supabase/server'
import StudentsClient from './StudentsClient'

export default async function StudentsPage() {
  const supabase = createClient()
  const { data: students } = await supabase
    .from('NguoiDung')
    .select('*')
    .eq('vai_tro', 'sinh_vien')  // ← chỉ lấy SV
    .order('created_at', { ascending: false })

  return <StudentsClient students={students || []} />
}