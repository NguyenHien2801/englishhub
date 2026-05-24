// src/components/vocabulary/types.ts
// Dùng chung cho VocabularyClient, FlashcardMode, QuizMode, MatchingMode

export interface QuizQuestion {
  cau_hoi: string
  dap_an: string[]
  dung: number // index đáp án đúng trong mảng dap_an
}

export interface TuVungCache {
  phat_am_ipa: string | null
  audio_url: string | null
  nghia_tieng_viet: string | null
  dinh_nghia_tieng_anh: string | null
  vi_du_cau: string[] | null
  vi_du_viet: string[] | null
  tu_dong_nghia: string[] | null
  cach_nho: string | null
  cau_hoi_quiz: QuizQuestion[] | null
}

export interface TienDo {
  nguoi_dung_id: string
  he_so_de_nho: number
  khoang_lap_lai: number
  so_lan_lap_lai: number
  trang_thai: string
  ngay_on_tiep_theo: string
}

export interface VocabWord {
  id: string
  tu_tieng_anh: string
  loai_tu: string | null
  cap_do: string | null
  thu_tu_hien_thi: number
  TuVungCache: TuVungCache | null
  TienDoHocTuVung: TienDo[]
}

export interface VocabSet {
  id: string
  ten_bo: string
  mo_ta: string | null
  loai_bo: string
  cap_do: string | null
  chu_de: string | null
  tong_so_tu: number
}

export type LearnMode = 'flashcard' | 'quiz' | 'matching'
export type SrsRating = 'again' | 'hard' | 'good' | 'easy'

/** SM-2 tính interval/ef mới từ rating */
export function sm2Update(
  current: { he_so_de_nho: number; khoang_lap_lai: number; so_lan_lap_lai: number },
  rating: SrsRating
) {
  const qualityMap: Record<SrsRating, number> = { again: 0, hard: 2, good: 4, easy: 5 }
  const q = qualityMap[rating]
  let { he_so_de_nho: ef, khoang_lap_lai: interval, so_lan_lap_lai: reps } = current

  if (q < 3) { reps = 0; interval = 1 }
  else {
    reps += 1
    interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(interval * ef)
    ef = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  }

  const next = new Date()
  next.setDate(next.getDate() + interval)
  const ngay_on_tiep_theo = next.toISOString().split('T')[0]
  const trang_thai = reps === 0 ? 'moi' : reps <= 2 ? 'dang_hoc' : reps <= 5 ? 'on_tap' : 'thuan_thuc'

  return { he_so_de_nho: ef, khoang_lap_lai: interval, so_lan_lap_lai: reps, ngay_on_tiep_theo, trang_thai }
}

/** Lưu/cập nhật TienDoHocTuVung — dùng chung cho 3 mode */
export async function saveSrs(
  supabase: ReturnType<typeof import('@/lib/supabase/client').createClient>,
  userId: string,
  wordId: string,
  existing: TienDo | undefined,
  rating: SrsRating
) {
  const base = existing
    ? { he_so_de_nho: existing.he_so_de_nho, khoang_lap_lai: existing.khoang_lap_lai, so_lan_lap_lai: existing.so_lan_lap_lai }
    : { he_so_de_nho: 2.5, khoang_lap_lai: 1, so_lan_lap_lai: 0 }

  const updated = sm2Update(base, rating)
  const today = new Date().toISOString().split('T')[0]

  if (existing) {
    await supabase.from('TienDoHocTuVung')
      .update({ ...updated, lan_cuoi_on: today })
      .eq('nguoi_dung_id', userId)
      .eq('tu_vung_id', wordId)
  } else {
    await supabase.from('TienDoHocTuVung').insert({
      nguoi_dung_id: userId, tu_vung_id: wordId, ...updated, lan_cuoi_on: today,
    })
  }
}
