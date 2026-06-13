import { createClient } from '@/lib/supabase/server'
import ExamsAdminClient from './ExamsAdminClient'

export default async function ExamsAdminPage() {
  const supabase = createClient()

  const { data: sessions } = await supabase
    .from('PhienLuyenThi')
    .select('id, loai_chung_chi, ky_nang, la_de_day_du, diem_so, diem_quy_doi, tong_so_cau, so_cau_dung, thoi_gian_lam_bai, created_at, nguoi_dung_id, NguoiDung(ho_ten, ma_sinh_vien, lop, khoa)')
    .order('created_at', { ascending: false })
    .limit(500)

  const { data: students } = await supabase
    .from('NguoiDung')
    .select('ho_ten, ma_sinh_vien, lop, khoa')
    .eq('vai_tro', 'sinh_vien')

  return <ExamsAdminClient sessions={sessions || []} students={students || []} />
}