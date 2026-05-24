import { createClient } from '@/lib/supabase/server'
import ExamsAdminClient from './ExamsAdminClient'

export default async function ExamsAdminPage() {
  const supabase = createClient()
  const { data: sessions } = await supabase
    .from('PhienLuyenThi')
    .select('id, loai_chung_chi, ky_nang, la_de_day_du, diem_so, diem_quy_doi, tong_so_cau, so_cau_dung, thoi_gian_lam_bai, created_at, nguoi_dung_id, NguoiDung(ho_ten, ma_sinh_vien)')
    .order('created_at', { ascending: false })
    .limit(200)

  return <ExamsAdminClient sessions={sessions || []} />
}
