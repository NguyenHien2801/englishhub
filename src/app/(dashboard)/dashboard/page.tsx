// app/(dashboard)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: rawVocab },
    { data: recentExams },
    { data: allGrammarProgress },
    { data: allGrammarLessons },
    { data: chatHistory },
  ] = await Promise.all([
    supabase.from('NguoiDung').select('*').eq('id', user.id).single(),

    supabase.from('TienDoHocTuVung').select(`
      id, trang_thai, ngay_on_tiep_theo, lan_cuoi_on,
      he_so_de_nho, so_lan_lap_lai, diem_so_trung_binh,
      TuVung ( tu_tieng_anh, cap_do, BoDuVung ( ten_bo, loai_bo ) )
    `).eq('nguoi_dung_id', user.id),

    supabase.from('PhienLuyenThi').select('*')
      .eq('nguoi_dung_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),

    supabase.from('TienDoNguPhap').select(`
      id, da_hoan_thanh, diem_bai_tap, ngay_hoan_thanh,
      BaiHocNguPhap ( tieu_de, cap_do, danh_muc, tong_bai_tap )
    `).eq('nguoi_dung_id', user.id),

    supabase.from('BaiHocNguPhap').select('id, cap_do, danh_muc'),

    supabase.from('LichSuChatbot').select('created_at, vai_tro')
      .eq('nguoi_dung_id', user.id)
      .eq('vai_tro', 'user')   // ✅ chỉ lấy tin nhắn của user, không lấy assistant
      .order('created_at', { ascending: true }),
  ])

  // ── Normalize vocab ──────────────────────────────────────────────────────
  const vocab = (rawVocab ?? []).map(v => ({
    ...v,
    ngay_on_tiep_theo: v.ngay_on_tiep_theo ? String(v.ngay_on_tiep_theo) : null,
    lan_cuoi_on:       v.lan_cuoi_on       ? String(v.lan_cuoi_on)       : null,
    TuVung: (Array.isArray(v.TuVung) ? v.TuVung[0] : v.TuVung) as
      { tu_tieng_anh?: string; cap_do?: string } | null,
  }))

  const todayStr = new Date().toISOString().split('T')[0]

  // ✅ Fix Bug 3: dueTodayCount chỉ đếm từ đang học/ôn tập — không đếm từ mới chưa học
  const dueTodayCount = vocab.filter(v =>
    v.ngay_on_tiep_theo &&
    v.ngay_on_tiep_theo <= todayStr &&
    (v.trang_thai === 'dang_hoc' || v.trang_thai === 'on_tap')
  ).length

  const totalMastered = vocab.filter(v => v.trang_thai === 'thuan_thuc').length
  const totalLearning = vocab.filter(v => v.trang_thai === 'dang_hoc').length
  const totalReview   = vocab.filter(v => v.trang_thai === 'on_tap').length
  const totalNew      = vocab.filter(v => v.trang_thai === 'moi').length

  // ✅ Fix Bug 1 & 4: streakDates gộp từ CẢ HAI nguồn — vocab + phiên luyện thi
  const vocabDates = vocab
    .filter(v => v.lan_cuoi_on)
    .map(v => v.lan_cuoi_on as string)

  const examDates = (recentExams ?? [])
    .filter(r => r.created_at)
    .map(r => (r.created_at as string).split('T')[0])

  const streakDatesArr = Array.from(new Set([...vocabDates, ...examDates])).sort()

  // ── Exams ────────────────────────────────────────────────────────────────
  const exams = recentExams ?? []
  const avgScoreAll = exams.length
    ? Math.round(
        exams.reduce((s, r) =>
          s + (r.tong_so_cau ? ((r.so_cau_dung ?? 0) / r.tong_so_cau) * 100 : 0), 0
        ) / exams.length
      )
    : 0

  // ── Normalize grammar ────────────────────────────────────────────────────
  type GrammarProgressNorm = {
    da_hoan_thanh?: boolean
    diem_bai_tap?: number | null
    ngay_hoan_thanh?: string | null
    BaiHocNguPhap?: { tieu_de?: string; cap_do?: string; danh_muc?: string } | null
  }
  type GrammarLessonNorm = { cap_do?: string | null }

  const grammarProgressNorm: GrammarProgressNorm[] = (allGrammarProgress ?? []).map(g => ({
    da_hoan_thanh:   g.da_hoan_thanh ?? false,
    // ✅ Fix Bug 2: diem_bai_tap trong DB là 0-10, nhân 10 trong Client → đúng
    // Nhưng cần đảm bảo không bị null thành 0 khi chưa có điểm
    diem_bai_tap:    g.diem_bai_tap ?? null,
    ngay_hoan_thanh: g.ngay_hoan_thanh ? String(g.ngay_hoan_thanh) : null,
    BaiHocNguPhap:   Array.isArray(g.BaiHocNguPhap)
      ? (g.BaiHocNguPhap[0] ?? null)
      : (g.BaiHocNguPhap ?? null),
  }))

  const grammarLessonsNorm: GrammarLessonNorm[] = (allGrammarLessons ?? []).map(l => ({
    cap_do: l.cap_do ?? null,
  }))

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
      grammarDoneCount={grammarProgressNorm.filter(g => g.da_hoan_thanh).length}
      chatHistory={chatHistory ?? []}
    />
  )
}