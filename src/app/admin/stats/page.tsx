import { createClient } from '@/lib/supabase/server'
import StatsClient from './StatsClient'
export default async function StatsPage() {
  const supabase = createClient()
  const [{ data: exams }, { data: users }, { data: srsData }] = await Promise.all([
    supabase.from('PhienLuyenThi').select('loai_chung_chi, ky_nang, diem_so, tong_so_cau, created_at').order('created_at', { ascending: false }).limit(200),
    supabase.from('NguoiDung').select('muc_tieu_hoc, trinh_do_hien_tai, streak_hien_tai, tong_so_tu_da_hoc, created_at').eq('vai_tro', 'sinh_vien'),
    supabase.from('TienDoHocTuVung').select('trang_thai').limit(1000),
  ])
  return <StatsClient exams={exams || []} users={users || []} srsData={srsData || []} />
}
