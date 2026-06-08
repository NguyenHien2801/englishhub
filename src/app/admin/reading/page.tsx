import { createClient } from '@/lib/supabase/server'
import ReadingAdminClient from './ReadingAdminClient'

export default async function ReadingAdminPage() {
  const supabase = createClient()

  const { data: passages } = await supabase
    .from('BaiDoc')
    .select('id, tieu_de, mo_ta, loai_chung_chi, cap_do, loai_bai, chu_de, bieu_tuong, thong_tin_ky_thi, thoi_gian_giay, so_cau_hoi, luot_lam, da_kiem_duyet, thu_tu, dang_hoat_dong, created_at')
    .order('thu_tu', { ascending: true })
    .order('created_at', { ascending: false })

  return <ReadingAdminClient passages={passages || []} />
}
