// app/(dashboard)/dashboard/page.tsx
// Server Component — kéo toàn bộ dữ liệu từ Supabase, truyền xuống Client

import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'
import { redirect } from 'next/navigation'

// ─── helpers ────────────────────────────────────────────────────────────────

function getDateRange(rangeKey: string): string {
  const now = new Date()
  const start = new Date(now)
  if (rangeKey === 'week')    start.setDate(now.getDate() - 6)
  if (rangeKey === 'month')   start.setMonth(now.getMonth() - 1)
  if (rangeKey === 'quarter') start.setMonth(now.getMonth() - 3)
  if (rangeKey === 'year')    start.setFullYear(now.getFullYear() - 1)
  start.setHours(0, 0, 0, 0)
  return start.toISOString()
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = createClient()

  // 1. Auth guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch song song tất cả bảng cần thiết
  const [
    { data: profile },
    { data: rawVocabProgress },
    { data: recentExams },
    { data: allGrammarProgress },
    { data: allGrammarLessons },
    { data: chatHistory },
  ] = await Promise.all([
    // ── Profile đầy đủ
    supabase
      .from('NguoiDung')
      .select('*')
      .eq('id', user.id)
      .single(),

    // ── Toàn bộ tiến độ từ vựng
    // Chú ý: Supabase trả TuVung là array do foreign key — sẽ normalize bên dưới
    supabase
      .from('TienDoHocTuVung')
      .select(`
        id,
        trang_thai,
        ngay_on_tiep_theo,
        lan_cuoi_on,
        he_so_de_nho,
        so_lan_lap_lai,
        diem_so_trung_binh,
        TuVung (
          tu_tieng_anh,
          cap_do,
          BoDuVung ( ten_bo, loai_bo )
        )
      `)
      .eq('nguoi_dung_id', user.id),

    // ── Lịch sử thi (toàn bộ, client lọc theo range)
    supabase
      .from('PhienLuyenThi')
      .select('*')
      .eq('nguoi_dung_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),

    // ── Tiến độ ngữ pháp
    supabase
      .from('TienDoNguPhap')
      .select(`
        id,
        da_hoan_thanh,
        diem_bai_tap,
        ngay_hoan_thanh,
        BaiHocNguPhap ( tieu_de, cap_do, danh_muc, tong_bai_tap )
      `)
      .eq('nguoi_dung_id', user.id),

    // ── Tất cả bài học ngữ pháp (để tính % hoàn thành)
    supabase
      .from('BaiHocNguPhap')
      .select('id, cap_do, danh_muc'),

    // ── Lịch sử chatbot
    supabase
      .from('LichSuChatbot')
      .select('created_at')
      .eq('nguoi_dung_id', user.id)
      .eq('vai_tro', 'user')
      .gte('created_at', getDateRange('year'))
      .order('created_at', { ascending: true }),
  ])

  // 3. Normalize vocab
  // Supabase trả TuVung là [] (array) do quan hệ FK nhiều-một từ TienDoHocTuVung → TuVung
  // → lấy phần tử đầu tiên, convert date → string để truyền qua props
  const vocab = (rawVocabProgress ?? []).map(v => {
    const tuVungRaw = v.TuVung
    const tuVung = Array.isArray(tuVungRaw)
      ? (tuVungRaw[0] ?? null)
      : (tuVungRaw ?? null)

    return {
      ...v,
      // date fields từ Supabase có thể là Date object hoặc string — chuẩn hoá về string
      ngay_on_tiep_theo: v.ngay_on_tiep_theo
        ? String(v.ngay_on_tiep_theo)
        : null,
      lan_cuoi_on: v.lan_cuoi_on
        ? String(v.lan_cuoi_on)
        : null,
      TuVung: tuVung as {
        tu_tieng_anh?: string
        cap_do?: string
      } | null,
    }
  })

  // 4. Tính các stat cơ bản (server-side để tránh hydration lag)
  const todayStr = new Date().toISOString().split('T')[0]

  const dueTodayCount = vocab.filter(
    v => v.ngay_on_tiep_theo && v.ngay_on_tiep_theo <= todayStr
  ).length
  const totalMastered = vocab.filter(v => v.trang_thai === 'thuan_thuc').length
  const totalLearning = vocab.filter(v => v.trang_thai === 'dang_hoc').length
  const totalReview   = vocab.filter(v => v.trang_thai === 'on_tap').length
  const totalNew      = vocab.filter(v => v.trang_thai === 'moi').length

  // Streak dates — dùng lan_cuoi_on để vẽ heatmap
  const streakDatesArr: string[] = Array.from(
    new Set(
      vocab
        .filter(v => v.lan_cuoi_on)
        .map(v => v.lan_cuoi_on as string)
    )
  )

  // Điểm TB toàn bộ phiên thi
  const exams = recentExams ?? []
  const avgScoreAll = exams.length
    ? Math.round(
        exams.reduce(
          (s, r) => s + (r.tong_so_cau ? ((r.so_cau_dung ?? 0) / r.tong_so_cau) * 100 : 0),
          0
        ) / exams.length
      )
    : 0

  // 5. Normalize grammar progress
  type GrammarProgressNorm = {
    da_hoan_thanh?: boolean
    diem_bai_tap?: number | null
    ngay_hoan_thanh?: string | null
    BaiHocNguPhap?: { tieu_de?: string; cap_do?: string; danh_muc?: string } | null
  }
  type GrammarLessonNorm = { cap_do?: string | null }

  const grammarProgressNorm: GrammarProgressNorm[] = (allGrammarProgress ?? []).map(g => ({
    da_hoan_thanh:   g.da_hoan_thanh  ?? false,
    diem_bai_tap:    g.diem_bai_tap   ?? null,
    ngay_hoan_thanh: g.ngay_hoan_thanh
      ? String(g.ngay_hoan_thanh)
      : null,
    BaiHocNguPhap: Array.isArray(g.BaiHocNguPhap)
      ? (g.BaiHocNguPhap[0] ?? null)
      : (g.BaiHocNguPhap ?? null),
  }))

  const grammarLessonsNorm: GrammarLessonNorm[] = (allGrammarLessons ?? []).map(l => ({
    cap_do: l.cap_do ?? null,
  }))

  const grammarDoneCount = grammarProgressNorm.filter(g => g.da_hoan_thanh).length

  return (
    <DashboardClient
      userId={user.id}
      profile={profile}

      allVocabProgress={vocab}
      dueTodayCount={dueTodayCount}
      totalMastered={totalMastered}
      totalLearning={totalLearning}
      totalReview={totalReview}
      totalNew={totalNew}
      streakDatesArr={streakDatesArr}

      recentExams={exams}
      avgScoreAll={avgScoreAll}

      allGrammarProgress={grammarProgressNorm}
      allGrammarLessons={grammarLessonsNorm}
      grammarDoneCount={grammarDoneCount}

      chatHistory={chatHistory ?? []}
    />
  )
}