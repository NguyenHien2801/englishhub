import { createClient } from '@supabase/supabase-js'
import StudentsProgressClient from './StudentsProgressClient'

export default async function StudentsProgressPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const [{ data: students }, { data: vocab }, { data: grammar }, { data: sessions }] = await Promise.all([
    supabase.from('NguoiDung').select('id, ho_ten, ma_sinh_vien, lop, khoa, trinh_do_hien_tai, streak_hien_tai, streak_cao_nhat, tong_so_tu_da_hoc, ngay_hoc_cuoi, muc_tieu_hoc').eq('vai_tro', 'sinh_vien').order('tong_so_tu_da_hoc', { ascending: false }),
    supabase.from('TienDoHocTuVung').select('nguoi_dung_id, trang_thai'),
    supabase.from('TienDoNguPhap').select('nguoi_dung_id, da_hoan_thanh, diem_bai_tap'),
    supabase.from('PhienLuyenThi').select('nguoi_dung_id, loai_chung_chi, diem_so').order('created_at', { ascending: false }).limit(1000),
  ])
  return <StudentsProgressClient students={students || []} vocab={vocab || []} grammar={grammar || []} sessions={sessions || []} />
}
