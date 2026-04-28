'use client'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'

interface Props {
  profile: Record<string, unknown> | null
  dueTodayCount: number
  totalMastered: number
  recentExams: Record<string, unknown>[]
}

const SKILL_DATA = [
  { subject: 'Nghe', A: 70 },
  { subject: 'Đọc', A: 80 },
  { subject: 'Viết', A: 55 },
  { subject: 'Nói', A: 50 },
]

const WEEK_DATA = [
  { day: 'T2', words: 12, exams: 1 },
  { day: 'T3', words: 8, exams: 0 },
  { day: 'T4', words: 15, exams: 2 },
  { day: 'T5', words: 6, exams: 0 },
  { day: 'T6', words: 20, exams: 1 },
  { day: 'T7', words: 10, exams: 3 },
  { day: 'CN', words: 5, exams: 0 },
]

export default function DashboardClient({ profile, dueTodayCount, totalMastered, recentExams }: Props) {
  const hoTen = (profile?.ho_ten as string) || 'Bạn'
  const streak = (profile?.streak_hien_tai as number) || 0
  const tongSoTu = (profile?.tong_so_tu_da_hoc as number) || 0
  const mucTieu = (profile?.muc_tieu_hoc as string) || 'VSTEP'

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">
          Xin chào, {hoTen.split(' ').pop()} 👋
        </h1>
        <p className="text-[#6B6B60] mt-1">Mục tiêu: <span className="font-semibold text-[#00A878]">{mucTieu}</span> · Hãy học đều đặn mỗi ngày!</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Streak hiện tại', value: `${streak} ngày`, icon: '🔥', color: '#FFF8EC', border: '#F5A623', textColor: '#F5A623' },
          { label: 'Ôn tập hôm nay', value: `${dueTodayCount} từ`, icon: '📋', color: '#E8FFF8', border: '#00A878', textColor: '#00A878' },
          { label: 'Đã thuần thục', value: `${totalMastered} từ`, icon: '✅', color: '#F0F0FF', border: '#7C7CFF', textColor: '#7C7CFF' },
          { label: 'Tổng đã học', value: `${tongSoTu} từ`, icon: '📚', color: '#FFF0F0', border: '#FF6B6B', textColor: '#FF6B6B' },
        ].map((s, i) => (
          <div key={i} className="p-5 rounded-2xl border-2 bg-white transition-all hover:shadow-md" style={{ borderColor: s.border + '40', backgroundColor: s.color }}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold font-display" style={{ color: s.textColor }}>{s.value}</div>
            <div className="text-xs text-[#6B6B60] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      {dueTodayCount > 0 && (
        <div className="mb-8 p-5 bg-[#E8FFF8] border-2 border-[#00A878]/30 rounded-2xl flex items-center justify-between">
          <div>
            <div className="font-semibold text-[#0D0D0D]">🃏 Có {dueTodayCount} từ cần ôn tập hôm nay!</div>
            <div className="text-sm text-[#6B6B60]">Ôn tập ngay để duy trì streak và ghi nhớ tốt hơn</div>
          </div>
          <Link href="/vocabulary?mode=review" className="px-5 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors whitespace-nowrap">
            Ôn tập ngay →
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8E8E0] p-6">
          <h2 className="font-display font-semibold text-[#0D0D0D] mb-4">Hoạt động tuần này</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={WEEK_DATA} barGap={4}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#A0A090' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E8E8E0', fontSize: '12px' }} />
              <Bar dataKey="words" fill="#00A878" radius={[4, 4, 0, 0]} name="Từ vựng" />
              <Bar dataKey="exams" fill="#F5A623" radius={[4, 4, 0, 0]} name="Bài thi" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill radar */}
        <div className="bg-white rounded-2xl border border-[#E8E8E0] p-6">
          <h2 className="font-display font-semibold text-[#0D0D0D] mb-4">4 Kỹ năng</h2>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={SKILL_DATA}>
              <PolarGrid stroke="#E8E8E0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B6B60' }} />
              <Radar dataKey="A" stroke="#00A878" fill="#00A878" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent exams */}
      <div className="bg-white rounded-2xl border border-[#E8E8E0] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-[#0D0D0D]">Lịch sử luyện thi</h2>
          <Link href="/exam" className="text-sm text-[#00A878] hover:underline">Xem tất cả →</Link>
        </div>
        {recentExams.length === 0 ? (
          <div className="text-center py-8 text-[#A0A090]">
            <div className="text-4xl mb-2">📝</div>
            <div>Chưa có bài thi nào. <Link href="/exam" className="text-[#00A878] hover:underline">Luyện thi ngay!</Link></div>
          </div>
        ) : (
          <div className="space-y-3">
            {recentExams.slice(0, 5).map((exam, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#F8F7F2] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#E8FFF8] flex items-center justify-center text-sm font-bold text-[#00A878]">
                  {exam.loai_chung_chi as string}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#0D0D0D]">{exam.ky_nang as string} — {exam.loai_chung_chi as string}</div>
                  <div className="text-xs text-[#A0A090]">{new Date(exam.created_at as string).toLocaleDateString('vi-VN')}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#0D0D0D]">{exam.diem_so as number}/{exam.tong_so_cau as number}</div>
                  <div className="text-xs text-[#00A878]">{Math.round(((exam.so_cau_dung as number) / (exam.tong_so_cau as number)) * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Module shortcuts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/vocabulary', icon: '🃏', label: 'Học từ vựng', desc: 'SRS thông minh' },
          { href: '/grammar', icon: '📖', label: 'Ngữ pháp', desc: 'A1 → C1' },
          { href: '/exam', icon: '📝', label: 'Luyện thi', desc: 'VSTEP · TOEIC · APTIS' },
          { href: '/ai-chat', icon: '🤖', label: 'AI Chatbot', desc: 'Gemini 24/7' },
        ].map(m => (
          <Link key={m.href} href={m.href} className="p-5 bg-white rounded-2xl border border-[#E8E8E0] hover:border-[#00A878]/40 hover:shadow-md transition-all group">
            <div className="text-3xl mb-3">{m.icon}</div>
            <div className="font-semibold text-[#0D0D0D] text-sm group-hover:text-[#00A878] transition-colors">{m.label}</div>
            <div className="text-xs text-[#A0A090]">{m.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
