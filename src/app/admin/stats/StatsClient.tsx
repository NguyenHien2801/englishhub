'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

interface Props {
  exams: Record<string,unknown>[]
  users: Record<string,unknown>[]
  srsData: Record<string,unknown>[]
}

const COLORS = ['#00A878','#F5A623','#FF6B6B','#7C7CFF','#00D49A']

export default function StatsClient({ exams, users, srsData }: Props) {
  const avgScore = exams.length ? Math.round(exams.reduce((s, e) => s + Math.round(((e.diem_so as number) / (e.tong_so_cau as number)) * 100), 0) / exams.length) : 0
  const avgStreak = users.length ? Math.round(users.reduce((s, u) => s + (u.streak_hien_tai as number), 0) / users.length) : 0
  const totalWords = users.reduce((s, u) => s + (u.tong_so_tu_da_hoc as number), 0)

  const byGoal = Object.entries(users.reduce((acc: Record<string,number>, u) => {
    const g = u.muc_tieu_hoc as string
    acc[g] = (acc[g] || 0) + 1; return acc
  }, {})).map(([name, value]) => ({ name, value }))

  const byLevel = Object.entries(users.reduce((acc: Record<string,number>, u) => {
    const l = u.trinh_do_hien_tai as string
    acc[l] = (acc[l] || 0) + 1; return acc
  }, {})).map(([name, value]) => ({ name, value })).sort((a,b) => ['A1','A2','B1','B2','C1','C2'].indexOf(a.name) - ['A1','A2','B1','B2','C1','C2'].indexOf(b.name))

  const byCert = Object.entries(exams.reduce((acc: Record<string,number>, e) => {
    const c = e.loai_chung_chi as string
    acc[c] = (acc[c] || 0) + 1; return acc
  }, {})).map(([name, value]) => ({ name, value }))

  const srsStats = ['moi','dang_hoc','on_tap','thuan_thuc'].map(t => ({
    name: { moi: 'Từ mới', dang_hoc: 'Đang học', on_tap: 'Ôn tập', thuan_thuc: 'Thuần thục' }[t],
    value: srsData.filter(s => s.trang_thai === t).length,
  }))

  const regByMonth = Object.entries(users.reduce((acc: Record<string,number>, u) => {
    const m = new Date(u.created_at as string).toLocaleDateString('vi-VN', { month: 'short' })
    acc[m] = (acc[m] || 0) + 1; return acc
  }, {})).map(([month, count]) => ({ month, count })).slice(-6)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Thống kê hệ thống</h1>
        <p className="text-[#6B6B60] mt-1">Tổng quan hoạt động học tập của sinh viên</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tổng sinh viên', value: users.length, icon: '👥', color: '#E8FFF8', text: '#00A878' },
          { label: 'Điểm TB bài thi', value: `${avgScore}%`, icon: '📝', color: '#FFF8EC', text: '#F5A623' },
          { label: 'Streak TB', value: `${avgStreak} ngày`, icon: '🔥', color: '#FFF0F0', text: '#FF6B6B' },
          { label: 'Tổng từ đã học', value: totalWords.toLocaleString(), icon: '📚', color: '#F0F0FF', text: '#7C7CFF' },
        ].map((s, i) => (
          <div key={i} className="p-5 rounded-2xl border-2" style={{ backgroundColor: s.color, borderColor: s.text + '30' }}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-display text-2xl font-bold" style={{ color: s.text }}>{s.value}</div>
            <div className="text-xs text-[#6B6B60]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
          <h3 className="font-semibold text-[#0D0D0D] mb-4">Mục tiêu học tập</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={byGoal} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
              {byGoal.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
          <h3 className="font-semibold text-[#0D0D0D] mb-4">Phân phối trình độ</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byLevel} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide /><Tooltip />
              <Bar dataKey="value" fill="#00A878" radius={[4,4,0,0]} name="Sinh viên" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
          <h3 className="font-semibold text-[#0D0D0D] mb-4">Bài thi theo chứng chỉ</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byCert} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide /><Tooltip />
              <Bar dataKey="value" fill="#F5A623" radius={[4,4,0,0]} name="Số bài thi" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
          <h3 className="font-semibold text-[#0D0D0D] mb-4">Trạng thái từ vựng SRS</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={srsStats} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''} labelLine={false} fontSize={10}>
              {srsStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {regByMonth.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
          <h3 className="font-semibold text-[#0D0D0D] mb-4">Sinh viên đăng ký theo tháng</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={regByMonth}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide /><Tooltip />
              <Line type="monotone" dataKey="count" stroke="#00A878" strokeWidth={2} dot={{ fill: '#00A878', r: 4 }} name="Sinh viên mới" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
