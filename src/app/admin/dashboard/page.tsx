import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = createClient()

  const [
    { count: totalSV },
    { count: totalWords },
    { count: totalExams },
    { count: totalQuestions },
    { data: recentSV },
    { data: recentExams },
  ] = await Promise.all([
    supabase.from('NguoiDung').select('*', { count: 'exact', head: true }).eq('vai_tro', 'sinh_vien'),
    supabase.from('TuVung').select('*', { count: 'exact', head: true }),
    supabase.from('PhienLuyenThi').select('*', { count: 'exact', head: true }),
    supabase.from('NganHangCauHoi').select('*', { count: 'exact', head: true }),
    supabase.from('NguoiDung').select('ho_ten, ma_sinh_vien, lop, muc_tieu_hoc, streak_hien_tai, created_at')
      .eq('vai_tro', 'sinh_vien').order('created_at', { ascending: false }).limit(8),
   supabase.from('PhienLuyenThi').select('loai_chung_chi, ky_nang, diem_so, so_cau_dung, tong_so_cau, created_at, NguoiDung(ho_ten)')
      .order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Sinh viên', value: totalSV ?? 0, icon: '👥', color: '#E8FFF8', text: '#00A878', href: '/admin/students' },
    { label: 'Từ vựng', value: totalWords ?? 0, icon: '📚', color: '#F0F0FF', text: '#7C7CFF', href: '/admin/vocabulary' },
    { label: 'Bài thi đã làm', value: totalExams ?? 0, icon: '📝', color: '#FFF8EC', text: '#F5A623', href: '/admin/stats' },
    { label: 'Câu hỏi', value: totalQuestions ?? 0, icon: '❓', color: '#FFF0F0', text: '#FF6B6B', href: '/admin/questions' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Tổng quan hệ thống</h1>
        <p className="text-[#6B6B60] mt-1">EnglishHub Admin Panel — ĐH Thái Bình</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <Link key={i} href={s.href} className="p-5 rounded-2xl border-2 hover:shadow-md hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: s.color, borderColor: s.text + '30' }}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="font-display text-3xl font-bold" style={{ color: s.text }}>{s.value.toLocaleString()}</div>
            <div className="text-sm text-[#6B6B60] mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#E8E8E0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-[#0D0D0D]">Sinh viên mới đăng ký</h2>
            <Link href="/admin/students" className="text-xs text-[#00A878] hover:underline">Xem tất cả →</Link>
          </div>
          <div className="space-y-3">
            {(recentSV || []).map((sv, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8F7F2] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#E8FFF8] flex items-center justify-center text-sm font-bold text-[#00A878]">
                  {(sv.ho_ten as string).charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#0D0D0D] truncate">{sv.ho_ten}</div>
                  <div className="text-xs text-[#A0A090] font-mono">{sv.ma_sinh_vien} · {sv.lop || 'Chưa có lớp'}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-0.5 bg-[#E8FFF8] text-[#00A878] rounded-full">{sv.muc_tieu_hoc}</span>
                  <div className="text-xs text-[#F5A623] mt-1">🔥 {sv.streak_hien_tai} ngày</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E8E0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-[#0D0D0D]">Bài thi gần đây</h2>
            <Link href="/admin/stats" className="text-xs text-[#00A878] hover:underline">Xem tất cả →</Link>
          </div>
          <div className="space-y-3">
            {(recentExams || []).map((exam, i) => {
              const pct = Math.round((((exam.so_cau_dung as number) ?? (exam.diem_so as number)) / (exam.tong_so_cau as number)) * 100)
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8F7F2] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF8EC] flex items-center justify-center text-xs font-bold text-[#F5A623]">
                    {exam.loai_chung_chi as string}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#0D0D0D]">{((exam.NguoiDung as Record<string,unknown>[])?.[0]?.ho_ten as string) || 'SV'}</div>
                    <div className="text-xs text-[#A0A090]">{exam.ky_nang} · {new Date(exam.created_at).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <div className={`text-sm font-bold ${pct >= 60 ? 'text-[#00A878]' : 'text-[#FF6B6B]'}`}>{pct}%</div>
                </div>
              )
            })}
            {(!recentExams || recentExams.length === 0) && (
              <div className="text-center py-8 text-[#A0A090] text-sm">Chưa có bài thi nào</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
