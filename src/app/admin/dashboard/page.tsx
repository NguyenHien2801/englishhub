import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = createClient()

  const [
    { count: totalSV },
    { count: totalWords },
    { count: totalExams },
    { count: totalQuestions },
    { count: totalBaiNghe },
    { count: totalBaiViet },
    { count: totalChatMsgs },
    { data: recentSV },
    { data: recentExams },
    { data: levelDist },
  ] = await Promise.all([
    supabase.from('NguoiDung').select('*', { count: 'exact', head: true }).eq('vai_tro', 'sinh_vien'),
    supabase.from('TuVung').select('*', { count: 'exact', head: true }),
    supabase.from('PhienLuyenThi').select('*', { count: 'exact', head: true }),
    supabase.from('NganHangCauHoi').select('*', { count: 'exact', head: true }),
    supabase.from('BaiNghe').select('*', { count: 'exact', head: true }),
    supabase.from('bailuyenviet').select('*', { count: 'exact', head: true }),
    supabase.from('LichSuChatbot').select('*', { count: 'exact', head: true }),
    supabase.from('NguoiDung')
      .select('ho_ten, ma_sinh_vien, lop, muc_tieu_hoc, streak_hien_tai, trinh_do_hien_tai, created_at')
      .eq('vai_tro', 'sinh_vien').order('created_at', { ascending: false }).limit(6),
    supabase.from('PhienLuyenThi')
      .select('loai_chung_chi, ky_nang, diem_so, so_cau_dung, tong_so_cau, created_at, NguoiDung(ho_ten)')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('NguoiDung')
      .select('trinh_do_hien_tai')
      .eq('vai_tro', 'sinh_vien'),
  ])

  const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const levelMap: Record<string, number> = {}
  for (const u of (levelDist || [])) {
    const l = (u as Record<string, string>).trinh_do_hien_tai
    levelMap[l] = (levelMap[l] || 0) + 1
  }

  const LEVEL_COLOR: Record<string, { bg: string; text: string }> = {
    A1: { bg: '#F0F0FF', text: '#7C7CFF' }, A2: { bg: '#E8F8FF', text: '#00AACC' },
    B1: { bg: '#E8FFF8', text: '#00A878' }, B2: { bg: '#FFF8EC', text: '#F5A623' },
    C1: { bg: '#FFF0F0', text: '#FF6B6B' }, C2: { bg: '#F8E8FF', text: '#AA00FF' },
  }

  const quickStats = [
    { label: 'Sinh viên', value: totalSV ?? 0, icon: '👥', bg: '#E8FFF8', text: '#00A878', href: '/admin/students' },
    { label: 'Từ vựng', value: totalWords ?? 0, icon: '📚', bg: '#F0F0FF', text: '#7C7CFF', href: '/admin/vocabulary' },
    { label: 'Phiên luyện thi', value: totalExams ?? 0, icon: '📝', bg: '#FFF8EC', text: '#F5A623', href: '/admin/exams' },
    { label: 'Câu hỏi', value: totalQuestions ?? 0, icon: '❓', bg: '#FFF0F0', text: '#FF6B6B', href: '/admin/questions' },
    { label: 'Bài nghe', value: totalBaiNghe ?? 0, icon: '🎧', bg: '#E8F8FF', text: '#00AACC', href: '/admin/listening' },
    { label: 'Bài viết', value: totalBaiViet ?? 0, icon: '✍️', bg: '#F8E8FF', text: '#AA00FF', href: '/admin/writing' },
    { label: 'Tin nhắn AI', value: totalChatMsgs ?? 0, icon: '🤖', bg: '#FFF8EC', text: '#F5A623', href: '/admin/chatbot/history' },
    { label: 'Ngữ pháp (CH)', value: totalQuestions ?? 0, icon: '📖', bg: '#F0FFF0', text: '#00AA44', href: '/admin/grammar' },
  ]

  const SHORTCUTS = [
    { href: '/admin/students/roles', label: 'Phân quyền', icon: '🔐' },
    { href: '/admin/level-test', label: 'Level Test', icon: '🎯' },
    { href: '/admin/exams/history', label: 'Lịch sử thi', icon: '📋' },
    { href: '/admin/students/progress', label: 'Tiến độ học', icon: '📈' },
    { href: '/admin/chatbot/config', label: 'Cache AI', icon: '🗄️' },
    { href: '/admin/settings', label: 'Cài đặt', icon: '⚙️' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Tổng quan hệ thống</h1>
        <p className="text-[#6B6B60] mt-1">EnglishHub Admin Panel</p>
      </div>

      {/* 8 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((s) => (
          <Link key={s.label} href={s.href}
            className="p-5 rounded-2xl border-2 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            style={{ backgroundColor: s.bg, borderColor: s.text + '30' }}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="font-display text-2xl font-bold" style={{ color: s.text }}>
              {s.value.toLocaleString('vi-VN')}
            </div>
            <div className="text-sm text-[#6B6B60] mt-0.5 group-hover:text-[#0D0D0D] transition-colors">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Sinh viên mới */}
        <div className="bg-white rounded-2xl border border-[#E8E8E0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#0D0D0D]">Sinh viên mới</h2>
            <Link href="/admin/students" className="text-xs text-[#00A878] hover:underline">Xem tất cả →</Link>
          </div>
          <div className="space-y-2">
            {(recentSV || []).map((sv, i) => {
              const u = sv as Record<string, unknown>
              const lc = LEVEL_COLOR[(u.trinh_do_hien_tai as string)] || { bg: '#F8F7F2', text: '#6B6B60' }
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8F7F2] transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: lc.bg, color: lc.text }}>
                    {(u.ho_ten as string).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#0D0D0D] truncate">{u.ho_ten as string}</div>
                    <div className="text-xs text-[#A0A090] font-mono">{u.ma_sinh_vien as string}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                      style={{ backgroundColor: lc.bg, color: lc.text }}>
                      {u.trinh_do_hien_tai as string}
                    </span>
                    <div className="text-xs text-[#A0A090] mt-0.5">🔥 {u.streak_hien_tai as number}</div>
                  </div>
                </div>
              )
            })}
            {(!recentSV || recentSV.length === 0) && (
              <div className="text-center py-8 text-[#A0A090] text-sm">Chưa có sinh viên</div>
            )}
          </div>
        </div>

        {/* Bài thi gần đây */}
        <div className="bg-white rounded-2xl border border-[#E8E8E0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#0D0D0D]">Bài thi gần đây</h2>
            <Link href="/admin/exams/history" className="text-xs text-[#00A878] hover:underline">Xem tất cả →</Link>
          </div>
          <div className="space-y-2">
            {(recentExams || []).map((exam, i) => {
              const e = exam as Record<string, unknown>
              const pct = e.tong_so_cau ? Math.round(((e.so_cau_dung as number) / (e.tong_so_cau as number)) * 100) : 0
              const user = (e.NguoiDung as Record<string, unknown>[] | null)?.[0]
              const certBg: Record<string, string> = { VSTEP: '#E8FFF8', TOEIC: '#FFF8EC', APTIS: '#F0F0FF' }
              const certTx: Record<string, string> = { VSTEP: '#00A878', TOEIC: '#F5A623', APTIS: '#7C7CFF' }
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8F7F2] transition-colors">
                  <div className="w-10 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: certBg[e.loai_chung_chi as string] || '#F8F7F2', color: certTx[e.loai_chung_chi as string] || '#6B6B60' }}>
                    {e.loai_chung_chi as string}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#0D0D0D] truncate">{(user?.ho_ten as string) || 'Sinh viên'}</div>
                    <div className="text-xs text-[#A0A090]">
                      {(e.ky_nang as string) || 'Tổng hợp'} · {new Date(e.created_at as string).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div className={`text-sm font-bold flex-shrink-0 ${pct >= 70 ? 'text-[#00A878]' : pct >= 50 ? 'text-[#F5A623]' : 'text-[#FF6B6B]'}`}>
                    {pct}%
                  </div>
                </div>
              )
            })}
            {(!recentExams || recentExams.length === 0) && (
              <div className="text-center py-8 text-[#A0A090] text-sm">Chưa có bài thi</div>
            )}
          </div>
        </div>

        {/* Phân phối trình độ */}
        <div className="bg-white rounded-2xl border border-[#E8E8E0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#0D0D0D]">Phân phối trình độ</h2>
            <Link href="/admin/stats" className="text-xs text-[#00A878] hover:underline">Chi tiết →</Link>
          </div>
          <div className="space-y-2.5">
            {LEVEL_ORDER.map(level => {
              const count = levelMap[level] || 0
              const total = totalSV || 1
              const pct = Math.round((count / total) * 100)
              const lc = LEVEL_COLOR[level]
              return (
                <div key={level}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-semibold" style={{ color: lc.text }}>{level}</span>
                    <span className="text-[#A0A090]">{count} sinh viên</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F8F7F2] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: lc.text }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
        <h2 className="font-semibold text-[#0D0D0D] mb-3 text-sm uppercase tracking-wide text-[#A0A090]">Truy cập nhanh</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SHORTCUTS.map(s => (
            <Link key={s.href} href={s.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[#E8E8E0] hover:border-[#00A878] hover:bg-[#F0FFF8] transition-all text-center group">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xs font-medium text-[#6B6B60] group-hover:text-[#00A878] transition-colors">{s.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
