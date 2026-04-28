export interface User {
  id: string
  ma_sinh_vien: string
  ho_ten: string
  lop?: string
  khoa?: string
  vai_tro: 'sinh_vien' | 'giang_vien' | 'admin'
  muc_tieu_hoc: 'VSTEP' | 'TOEIC' | 'APTIS' | 'GENERAL'
  trinh_do_hien_tai: string
  streak_hien_tai: number
  streak_cao_nhat: number
  tong_so_tu_da_hoc: number
  avatar_url?: string
}

export interface VocabSet {
  id: string
  ten_bo: string
  mo_ta?: string
  loai_bo: 'VSTEP' | 'TOEIC' | 'APTIS' | 'CHU_DE' | 'TU_TAO'
  cap_do?: string
  chu_de?: string
  tong_so_tu: number
}

export interface VocabWord {
  id: string
  bo_du_vung_id: string
  tu_tieng_anh: string
  loai_tu?: string
  cap_do?: string
  // Từ TuVungCache (AI generated)
  cache?: VocabCache
  // SRS progress
  srs?: SRSProgress
}

export interface VocabCache {
  tu_tieng_anh: string
  phat_am_ipa?: string
  audio_url?: string
  nghia_tieng_viet?: string
  dinh_nghia_tieng_anh?: string
  vi_du_cau?: string[]
  vi_du_viet?: string[]
  tu_dong_nghia?: string[]
  tu_trai_nghia?: string[]
  cach_nho?: string
  nguon_goc_tu?: string
  cau_hoi_quiz?: QuizQuestion[]
}

export interface SRSProgress {
  he_so_de_nho: number
  khoang_lap_lai: number
  so_lan_lap_lai: number
  trang_thai: 'moi' | 'dang_hoc' | 'on_tap' | 'thuan_thuc'
  ngay_on_tiep_theo: string
}

export interface QuizQuestion {
  type: 'multiple_choice' | 'fill_blank' | 'matching'
  question: string
  options?: { key: string; value: string }[]
  answer: string
  explanation?: string
}

export interface GrammarLesson {
  id: string
  tieu_de: string
  mo_ta?: string
  cap_do: string
  danh_muc?: string
  noi_dung_json: {
    sections: {
      title: string
      content: string
      formula?: string
      examples: { en: string; vi: string }[]
      signal_words?: string[]
    }[]
  }
  bai_tap_json?: {
    questions: QuizQuestion[]
  }
  thu_tu_hien_thi: number
}

export interface ExamQuestion {
  id: string
  loai_chung_chi: 'VSTEP' | 'TOEIC' | 'APTIS' | 'LEVEL_TEST'
  ky_nang: string
  so_phan: number
  loai_cau_hoi: string
  noi_dung_cau_hoi: string
  hinh_anh_url?: string
  audio_url?: string
  cac_lua_chon?: { key: string; value: string }[]
  dap_an_dung: string
  giai_thich?: string
  cap_do?: string
}

export interface ChatMessage {
  id: string
  vai_tro: 'user' | 'assistant'
  noi_dung: string
  created_at: string
}

export interface DashboardStats {
  streak: number
  wordsLearned: number
  examsTaken: number
  studyMinutes: number
  skillScores: {
    listening: number
    reading: number
    writing: number
    speaking: number
  }
  recentActivity: { date: string; words: number; exams: number }[]
}
