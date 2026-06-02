import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

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
    { count: totalBaiDoc },
    { count: totalNguPhap },
    { data: recentSV },
    { data: recentExams },
    { data: levelDist },
    { data: goalDist },
    { data: examsByMonth },
    { data: topStreaks },
    { data: recentActivity },
    { data: actRaw },
    { data: phienRaw },
  ] = await Promise.all([
    supabase.from('NguoiDung').select('*', { count: 'exact', head: true }).eq('vai_tro', 'sinh_vien'),
    supabase.from('TuVung').select('*', { count: 'exact', head: true }),
    supabase.from('PhienLuyenThi').select('*', { count: 'exact', head: true }),
    supabase.from('NganHangCauHoi').select('*', { count: 'exact', head: true }),
    supabase.from('BaiNghe').select('*', { count: 'exact', head: true }),
    supabase.from('bailuyenviet').select('*', { count: 'exact', head: true }),
    supabase.from('LichSuChatbot').select('*', { count: 'exact', head: true }),
    supabase.from('BaiDoc').select('*', { count: 'exact', head: true }),
    supabase.from('BaiHocNguPhap').select('*', { count: 'exact', head: true }),

    // Sinh viên mới nhất
    supabase.from('NguoiDung')
      .select('ho_ten, ma_sinh_vien, lop, khoa, muc_tieu_hoc, streak_hien_tai, trinh_do_hien_tai, created_at')
      .eq('vai_tro', 'sinh_vien')
      .order('created_at', { ascending: false })
      .limit(6),

    // Bài thi gần đây
    supabase.from('PhienLuyenThi')
      .select('loai_chung_chi, ky_nang, diem_so, so_cau_dung, tong_so_cau, created_at, NguoiDung(ho_ten)')
      .order('created_at', { ascending: false })
      .limit(6),

    // Phân phối trình độ
    supabase.from('NguoiDung')
      .select('trinh_do_hien_tai')
      .eq('vai_tro', 'sinh_vien'),

    // Phân phối mục tiêu
    supabase.from('NguoiDung')
      .select('muc_tieu_hoc')
      .eq('vai_tro', 'sinh_vien'),

    // Phiên thi theo tháng (12 tháng gần nhất)
    supabase.from('PhienLuyenThi')
      .select('created_at, loai_chung_chi')
      .gte('created_at', new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString())
      .order('created_at', { ascending: true }),

    // Top streak
    supabase.from('NguoiDung')
      .select('ho_ten, streak_hien_tai, streak_cao_nhat, trinh_do_hien_tai, muc_tieu_hoc')
      .eq('vai_tro', 'sinh_vien')
      .order('streak_hien_tai', { ascending: false })
      .limit(5),

    // Hoạt động chatbot gần nhất
    supabase.from('LichSuChatbot')
      .select('noi_dung, vai_tro, created_at, NguoiDung(ho_ten)')
      .eq('vai_tro', 'user')
      .order('created_at', { ascending: false })
      .limit(5),

    // Daily activity 30 ngày
    supabase.from('PhienLuyenThi')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),

    // Skill avg + cert skill avg
    supabase.from('PhienLuyenThi')
      .select('loai_chung_chi, ky_nang, so_cau_dung, tong_so_cau')
      .not('ky_nang', 'is', null)
      .not('tong_so_cau', 'is', null),
  ])

  // ── Phân phối trình độ ──
  const levelMap: Record<string, number> = {}
  for (const u of (levelDist || [])) {
    const l = (u as Record<string, string>).trinh_do_hien_tai
    levelMap[l] = (levelMap[l] || 0) + 1
  }

  // ── Phân phối mục tiêu ──
  const goalMap: Record<string, number> = {}
  for (const u of (goalDist || [])) {
    const g = (u as Record<string, string>).muc_tieu_hoc
    goalMap[g] = (goalMap[g] || 0) + 1
  }

  // ── Phiên thi theo tháng ──
  const monthlyMap: Record<string, number> = {}
  for (const e of (examsByMonth || [])) {
    const d = new Date((e as Record<string, string>).created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap[key] = (monthlyMap[key] || 0) + 1
  }
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - 11 + i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { key, label: `T${d.getMonth() + 1}`, count: monthlyMap[key] || 0 }
  })

  // ── Cert scores ──
  const certScores: Record<string, number[]> = { VSTEP: [], TOEIC: [], APTIS: [] }
  for (const e of (recentExams || [])) {
    const ex = e as Record<string, unknown>
    const cert = ex.loai_chung_chi as string
    if (certScores[cert] && ex.tong_so_cau) {
      const pct = Math.round(((ex.so_cau_dung as number) / (ex.tong_so_cau as number)) * 100)
      certScores[cert].push(pct)
    }
  }

  // ── Daily activity ──
  const dailyMap: Record<string, number> = {}
  for (const r of actRaw ?? []) {
    const day = (r as Record<string, string>).created_at.slice(0, 10)
    dailyMap[day] = (dailyMap[day] ?? 0) + 1
  }
  const dailyActivity = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

  // ── Skill avg + cert skill avg ──
  const skillSum: Record<string, { sum: number; cnt: number }> = {}
  const certSkillSum: Record<string, Record<string, { sum: number; cnt: number }>> = {}
  for (const r of phienRaw ?? []) {
    const row = r as Record<string, unknown>
    const ky = row.ky_nang as string
    const cert = row.loai_chung_chi as string
    const tong = row.tong_so_cau as number
    const dung = row.so_cau_dung as number
    if (!ky || !tong) continue
    const pct = (dung / tong) * 100

    if (!skillSum[ky]) skillSum[ky] = { sum: 0, cnt: 0 }
    skillSum[ky].sum += pct
    skillSum[ky].cnt += 1

    if (!certSkillSum[cert]) certSkillSum[cert] = {}
    if (!certSkillSum[cert][ky]) certSkillSum[cert][ky] = { sum: 0, cnt: 0 }
    certSkillSum[cert][ky].sum += pct
    certSkillSum[cert][ky].cnt += 1
  }
  const skillAvg = Object.fromEntries(
    Object.entries(skillSum).map(([k, v]) => [k, Math.round(v.sum / v.cnt)])
  )
  const certSkillAvg = Object.fromEntries(
    Object.entries(certSkillSum).map(([cert, skills]) => [
      cert,
      Object.fromEntries(
        Object.entries(skills).map(([k, v]) => [k, Math.round(v.sum / v.cnt)])
      ),
    ])
  )

  // ── Avg sessions per day + completion rate ──
  const avgSessionsPerDay = Math.round((actRaw?.length ?? 0) / 30)
  const completionRate = phienRaw?.length
    ? Math.round(
        (phienRaw.filter(r => {
          const row = r as Record<string, unknown>
          const tong = row.tong_so_cau as number
          const dung = row.so_cau_dung as number
          return tong > 0 && dung / tong >= 0.5
        }).length /
          phienRaw.length) *
          100
      )
    : 0

  const props = {
    stats: {
      totalSV: totalSV ?? 0,
      totalWords: totalWords ?? 0,
      totalExams: totalExams ?? 0,
      totalQuestions: totalQuestions ?? 0,
      totalBaiNghe: totalBaiNghe ?? 0,
      totalBaiViet: totalBaiViet ?? 0,
      totalChatMsgs: totalChatMsgs ?? 0,
      totalBaiDoc: totalBaiDoc ?? 0,
      totalNguPhap: totalNguPhap ?? 0,
    },
    recentSV: recentSV || [],
    recentExams: recentExams || [],
    levelMap,
    goalMap,
    last12Months,
    topStreaks: topStreaks || [],
    recentActivity: recentActivity || [],
    certScores,
    dailyActivity,
    skillAvg,
    certSkillAvg,
    avgSessionsPerDay,
    completionRate,
  }

  return <DashboardClient {...props} />
}