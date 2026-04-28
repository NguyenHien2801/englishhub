-- =============================================
-- EnglishHub - Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. NguoiDung (Users)
-- =============================================
CREATE TABLE IF NOT EXISTS public."NguoiDung" (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ma_sinh_vien VARCHAR(20) UNIQUE NOT NULL,
  ho_ten VARCHAR(100) NOT NULL,
  lop VARCHAR(50),
  khoa VARCHAR(100),
  vai_tro VARCHAR(20) DEFAULT 'sinh_vien' CHECK (vai_tro IN ('sinh_vien', 'giang_vien', 'admin')),
  muc_tieu_hoc VARCHAR(20) DEFAULT 'VSTEP' CHECK (muc_tieu_hoc IN ('VSTEP', 'TOEIC', 'APTIS', 'GENERAL')),
  trinh_do_hien_tai VARCHAR(10) DEFAULT 'A1' CHECK (trinh_do_hien_tai IN ('A1','A2','B1','B2','C1','C2')),
  streak_hien_tai INT DEFAULT 0,
  streak_cao_nhat INT DEFAULT 0,
  ngay_hoc_cuoi DATE,
  tong_so_tu_da_hoc INT DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. BoDuVung (Vocabulary Sets)
-- =============================================
CREATE TABLE IF NOT EXISTS public."BoDuVung" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ten_bo VARCHAR(200) NOT NULL,
  mo_ta TEXT,
  loai_bo VARCHAR(20) NOT NULL CHECK (loai_bo IN ('VSTEP','TOEIC','APTIS','CHU_DE','TU_TAO')),
  cap_do VARCHAR(10) CHECK (cap_do IN ('A1','A2','B1','B2','C1','C2','MIXED')),
  chu_de VARCHAR(100),
  hinh_anh_url TEXT,
  tong_so_tu INT DEFAULT 0,
  la_cong_khai BOOLEAN DEFAULT TRUE,
  tao_boi UUID REFERENCES public."NguoiDung"(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. TuVung (Vocabulary Words) - CHỈ seed từ gốc!
-- Nội dung chi tiết do AI sinh + cache vào TuVungCache
-- =============================================
CREATE TABLE IF NOT EXISTS public."TuVung" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bo_du_vung_id UUID REFERENCES public."BoDuVung"(id) ON DELETE CASCADE,
  tu_tieng_anh VARCHAR(200) NOT NULL,
  loai_tu VARCHAR(50), -- noun, verb, adjective...
  cap_do VARCHAR(10) CHECK (cap_do IN ('A1','A2','B1','B2','C1','C2')),
  thu_tu_hien_thi INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bo_du_vung_id, tu_tieng_anh)
);

-- =============================================
-- 4. TuVungCache - AI + Dictionary API generated content
-- Hybrid approach: lưu cache, không seed thủ công!
-- =============================================
CREATE TABLE IF NOT EXISTS public."TuVungCache" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tu_tieng_anh VARCHAR(200) UNIQUE NOT NULL,
  -- Dictionary API data
  phat_am_ipa VARCHAR(100),
  audio_url TEXT,
  -- AI generated (Gemini)
  nghia_tieng_viet TEXT,
  dinh_nghia_tieng_anh TEXT,
  vi_du_cau TEXT[], -- array of example sentences
  vi_du_viet TEXT[], -- Vietnamese translations of examples
  tu_dong_nghia TEXT[],
  tu_trai_nghia TEXT[],
  cach_nho TEXT, -- mnemonic
  nguon_goc_tu TEXT, -- etymology
  cau_hoi_quiz JSONB, -- pre-generated quiz questions
  lan_cuoi_lam_moi TIMESTAMPTZ DEFAULT NOW(),
  so_lan_truy_cap INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. TienDoHocTuVung (SRS Progress)
-- =============================================
CREATE TABLE IF NOT EXISTS public."TienDoHocTuVung" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nguoi_dung_id UUID REFERENCES public."NguoiDung"(id) ON DELETE CASCADE,
  tu_vung_id UUID REFERENCES public."TuVung"(id) ON DELETE CASCADE,
  -- SRS Algorithm (SM-2)
  he_so_de_nho FLOAT DEFAULT 2.5,
  khoang_lap_lai INT DEFAULT 1, -- days until next review
  so_lan_lap_lai INT DEFAULT 0,
  trang_thai VARCHAR(20) DEFAULT 'moi' CHECK (trang_thai IN ('moi', 'dang_hoc', 'on_tap', 'thuan_thuc')),
  ngay_on_tiep_theo DATE DEFAULT CURRENT_DATE,
  lan_cuoi_on DATE,
  diem_so_trung_binh FLOAT DEFAULT 0,
  UNIQUE(nguoi_dung_id, tu_vung_id)
);

-- =============================================
-- 6. BaiHocNguPhap (Grammar Lessons)
-- =============================================
CREATE TABLE IF NOT EXISTS public."BaiHocNguPhap" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tieu_de VARCHAR(200) NOT NULL,
  mo_ta TEXT,
  cap_do VARCHAR(10) NOT NULL CHECK (cap_do IN ('A1','A2','B1','B2','C1','C2')),
  danh_muc VARCHAR(100), -- Tenses, Conditionals, Passive...
  noi_dung_json JSONB NOT NULL, -- { sections: [{title, content, examples}] }
  bai_tap_json JSONB, -- { questions: [{type, question, options, answer, explanation}] }
  thu_tu_hien_thi INT DEFAULT 0,
  tong_bai_tap INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. NganHangCauHoi (Question Bank)
-- =============================================
CREATE TABLE IF NOT EXISTS public."NganHangCauHoi" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loai_chung_chi VARCHAR(20) NOT NULL CHECK (loai_chung_chi IN ('VSTEP','TOEIC','APTIS','LEVEL_TEST')),
  ky_nang VARCHAR(20) NOT NULL CHECK (ky_nang IN ('NGHE','DOC','VIET','NOI','TU_VUNG','NGU_PHAP')),
  so_phan INT DEFAULT 1,
  loai_cau_hoi VARCHAR(50), -- trac_nghiem, dien_tu, ghep_cap...
  noi_dung_cau_hoi TEXT NOT NULL,
  hinh_anh_url TEXT,
  audio_url TEXT,
  cac_lua_chon JSONB, -- [{key: "A", value: "..."}, ...]
  dap_an_dung VARCHAR(10) NOT NULL,
  giai_thich TEXT,
  cap_do VARCHAR(10) CHECK (cap_do IN ('A1','A2','B1','B2','C1','C2')),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. PhienLuyenThi (Exam Sessions)
-- =============================================
CREATE TABLE IF NOT EXISTS public."PhienLuyenThi" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nguoi_dung_id UUID REFERENCES public."NguoiDung"(id) ON DELETE CASCADE,
  loai_chung_chi VARCHAR(20) NOT NULL,
  ky_nang VARCHAR(20),
  la_de_day_du BOOLEAN DEFAULT FALSE,
  diem_so FLOAT,
  diem_quy_doi FLOAT, -- TOEIC scale
  tong_so_cau INT,
  so_cau_dung INT,
  thoi_gian_lam_bai INT, -- seconds
  cau_tra_loi_json JSONB, -- [{question_id, user_answer, is_correct}]
  phan_tich_ai TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. BoDemAI (AI Response Cache)
-- =============================================
CREATE TABLE IF NOT EXISTS public."BoDemAI" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ma_hash_prompt VARCHAR(64) UNIQUE NOT NULL, -- SHA256 of prompt
  noi_dung_cau_hoi TEXT NOT NULL,
  cau_tra_loi_ai TEXT NOT NULL,
  loai_ngucan_ai VARCHAR(50), -- giai_thich_tu, sinh_quiz, cham_writing...
  so_lan_dung INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  het_han_luc TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- =============================================
-- 10. LichSuChatbot (Chat History)
-- =============================================
CREATE TABLE IF NOT EXISTS public."LichSuChatbot" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nguoi_dung_id UUID REFERENCES public."NguoiDung"(id) ON DELETE CASCADE,
  phien_id VARCHAR(50) NOT NULL, -- group messages by session
  vai_tro VARCHAR(10) NOT NULL CHECK (vai_tro IN ('user','assistant')),
  noi_dung TEXT NOT NULL,
  loai_ngucan VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. KetQuaLevelTest (Level Test Results)
-- =============================================
CREATE TABLE IF NOT EXISTS public."KetQuaLevelTest" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nguoi_dung_id UUID REFERENCES public."NguoiDung"(id) ON DELETE CASCADE,
  trinh_do_tong_the VARCHAR(10) NOT NULL,
  diem_ky_nang_json JSONB, -- {nghe: 75, doc: 80, viet: 60, noi: 70}
  lo_trinh_de_xuat_json JSONB, -- AI generated roadmap
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. TienDoNguPhap (Grammar Progress)
-- =============================================
CREATE TABLE IF NOT EXISTS public."TienDoNguPhap" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nguoi_dung_id UUID REFERENCES public."NguoiDung"(id) ON DELETE CASCADE,
  bai_hoc_id UUID REFERENCES public."BaiHocNguPhap"(id) ON DELETE CASCADE,
  da_hoan_thanh BOOLEAN DEFAULT FALSE,
  diem_bai_tap FLOAT,
  ngay_hoan_thanh TIMESTAMPTZ,
  UNIQUE(nguoi_dung_id, bai_hoc_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_tu_vung_bo ON public."TuVung"(bo_du_vung_id);
CREATE INDEX idx_tien_do_user ON public."TienDoHocTuVung"(nguoi_dung_id);
CREATE INDEX idx_tien_do_ngay ON public."TienDoHocTuVung"(ngay_on_tiep_theo);
CREATE INDEX idx_cache_tu ON public."TuVungCache"(tu_tieng_anh);
CREATE INDEX idx_bodem_hash ON public."BoDemAI"(ma_hash_prompt);
CREATE INDEX idx_cau_hoi_loai ON public."NganHangCauHoi"(loai_chung_chi, ky_nang);
CREATE INDEX idx_chat_user_phien ON public."LichSuChatbot"(nguoi_dung_id, phien_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public."NguoiDung" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TienDoHocTuVung" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PhienLuyenThi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LichSuChatbot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."KetQuaLevelTest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TienDoNguPhap" ENABLE ROW LEVEL SECURITY;

-- NguoiDung policies
CREATE POLICY "Users can read own profile" ON public."NguoiDung"
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public."NguoiDung"
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin reads all" ON public."NguoiDung"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public."NguoiDung" WHERE id = auth.uid() AND vai_tro = 'admin')
  );

-- TienDoHocTuVung policies
CREATE POLICY "Users manage own SRS" ON public."TienDoHocTuVung"
  FOR ALL USING (auth.uid() = nguoi_dung_id);

-- PhienLuyenThi policies
CREATE POLICY "Users manage own exams" ON public."PhienLuyenThi"
  FOR ALL USING (auth.uid() = nguoi_dung_id);

-- LichSuChatbot policies
CREATE POLICY "Users manage own chat" ON public."LichSuChatbot"
  FOR ALL USING (auth.uid() = nguoi_dung_id);

-- KetQuaLevelTest policies
CREATE POLICY "Users manage own level test" ON public."KetQuaLevelTest"
  FOR ALL USING (auth.uid() = nguoi_dung_id);

-- TienDoNguPhap policies
CREATE POLICY "Users manage own grammar progress" ON public."TienDoNguPhap"
  FOR ALL USING (auth.uid() = nguoi_dung_id);

-- Public read for content tables
ALTER TABLE public."BoDuVung" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read vocab sets" ON public."BoDuVung" FOR SELECT USING (la_cong_khai = TRUE);
CREATE POLICY "Auth users create vocab sets" ON public."BoDuVung" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public."TuVung" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read words" ON public."TuVung" FOR SELECT USING (TRUE);

ALTER TABLE public."TuVungCache" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cache" ON public."TuVungCache" FOR SELECT USING (TRUE);

ALTER TABLE public."BaiHocNguPhap" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read grammar" ON public."BaiHocNguPhap" FOR SELECT USING (TRUE);

ALTER TABLE public."NganHangCauHoi" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read questions" ON public."NganHangCauHoi" FOR SELECT USING (auth.uid() IS NOT NULL);

ALTER TABLE public."BoDemAI" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read AI cache" ON public."BoDemAI" FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth write AI cache" ON public."BoDemAI" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- SEED DATA - Vocabulary Sets (từ gốc only!)
-- =============================================
INSERT INTO public."BoDuVung" (ten_bo, mo_ta, loai_bo, cap_do, chu_de, tong_so_tu) VALUES
  ('TOEIC Essential 600', 'Từ vựng thiết yếu cho TOEIC điểm 600+', 'TOEIC', 'B1', NULL, 0),
  ('TOEIC Advanced 800', 'Từ vựng nâng cao cho TOEIC điểm 800+', 'TOEIC', 'B2', NULL, 0),
  ('VSTEP B1 Core', 'Từ vựng cốt lõi cho kỳ thi VSTEP B1', 'VSTEP', 'B1', NULL, 0),
  ('Business English', 'Từ vựng tiếng Anh thương mại', 'CHU_DE', 'B2', 'Business', 0),
  ('Academic English', 'Từ vựng học thuật IELTS/APTIS', 'APTIS', 'C1', 'Academic', 0),
  ('Travel & Tourism', 'Từ vựng du lịch và khách sạn', 'CHU_DE', 'A2', 'Travel', 0),
  ('Technology & IT', 'Từ vựng công nghệ thông tin', 'CHU_DE', 'B2', 'Technology', 0);

-- Seed words for TOEIC Essential (bo_du_vung_id sẽ được điền sau khi biết UUID)
-- Chỉ cần từ gốc — AI sẽ sinh nội dung chi tiết khi user học

-- =============================================
-- SEED DATA - Grammar Lessons
-- =============================================
INSERT INTO public."BaiHocNguPhap" (tieu_de, cap_do, danh_muc, noi_dung_json, bai_tap_json, thu_tu_hien_thi) VALUES
(
  'Present Simple & Present Continuous',
  'A2',
  'Tenses',
  '{
    "sections": [
      {
        "title": "Present Simple",
        "content": "Dùng để diễn tả thói quen, sự thật hiển nhiên, lịch trình cố định.",
        "formula": "S + V(s/es) / S + do/does not + V",
        "examples": [
          {"en": "She works at Google.", "vi": "Cô ấy làm việc tại Google."},
          {"en": "The sun rises in the east.", "vi": "Mặt trời mọc ở phía đông."}
        ],
        "signal_words": ["always", "usually", "often", "sometimes", "never", "every day"]
      },
      {
        "title": "Present Continuous",
        "content": "Dùng để diễn tả hành động đang xảy ra tại thời điểm nói hoặc kế hoạch tương lai gần.",
        "formula": "S + am/is/are + V-ing",
        "examples": [
          {"en": "She is studying English right now.", "vi": "Cô ấy đang học tiếng Anh lúc này."},
          {"en": "We are meeting tomorrow.", "vi": "Chúng tôi sẽ gặp nhau vào ngày mai."}
        ],
        "signal_words": ["now", "at the moment", "currently", "right now", "look!", "listen!"]
      }
    ]
  }',
  '{
    "questions": [
      {
        "id": 1,
        "type": "multiple_choice",
        "question": "She ___ (work) at a bank. She ___ (not work) at a hospital.",
        "options": ["A. works / does not work", "B. is working / is not working", "C. worked / did not work", "D. work / not work"],
        "answer": "A",
        "explanation": "Đây là sự thật hiện tại (thói quen/nghề nghiệp) nên dùng Present Simple."
      },
      {
        "id": 2,
        "type": "multiple_choice",
        "question": "Listen! Someone ___ (knock) on the door.",
        "options": ["A. knock", "B. knocks", "C. is knocking", "D. knocked"],
        "answer": "C",
        "explanation": "Từ Listen! là dấu hiệu hành động đang xảy ra → Present Continuous."
      },
      {
        "id": 3,
        "type": "fill_blank",
        "question": "The train ___ (leave) at 9 AM every morning.",
        "answer": "leaves",
        "explanation": "Lịch trình cố định → Present Simple."
      }
    ]
  }',
  1
),
(
  'Past Simple & Past Continuous',
  'B1',
  'Tenses',
  '{
    "sections": [
      {
        "title": "Past Simple",
        "content": "Dùng để diễn tả hành động hoàn thành trong quá khứ tại một thời điểm xác định.",
        "formula": "S + V2/ed / S + did not + V",
        "examples": [
          {"en": "She graduated in 2022.", "vi": "Cô ấy tốt nghiệp năm 2022."},
          {"en": "They did not attend the meeting.", "vi": "Họ đã không tham dự cuộc họp."}
        ],
        "signal_words": ["yesterday", "last night/week/year", "ago", "in 2020", "when I was..."]
      },
      {
        "title": "Past Continuous",
        "content": "Dùng để diễn tả hành động đang xảy ra tại một thời điểm trong quá khứ.",
        "formula": "S + was/were + V-ing",
        "examples": [
          {"en": "I was studying when she called.", "vi": "Tôi đang học thì cô ấy gọi điện."},
          {"en": "They were having dinner at 8 PM.", "vi": "Họ đang ăn tối lúc 8 giờ."}
        ],
        "signal_words": ["while", "when", "at that time", "at 8 PM yesterday"]
      }
    ]
  }',
  '{
    "questions": [
      {
        "id": 1,
        "type": "multiple_choice",
        "question": "When I arrived, she ___ (sleep) on the sofa.",
        "options": ["A. slept", "B. was sleeping", "C. is sleeping", "D. sleeps"],
        "answer": "B",
        "explanation": "Hành động đang xảy ra khi một hành động khác xen vào → Past Continuous."
      }
    ]
  }',
  2
);

-- =============================================
-- SEED DATA - Câu hỏi mẫu TOEIC / VSTEP
-- =============================================
INSERT INTO public."NganHangCauHoi" (loai_chung_chi, ky_nang, so_phan, loai_cau_hoi, noi_dung_cau_hoi, cac_lua_chon, dap_an_dung, giai_thich, cap_do) VALUES

-- TOEIC Part 5 (Grammar)
('TOEIC', 'NGU_PHAP', 5, 'trac_nghiem',
 'The new marketing campaign _____ launched next quarter after final approvals.',
 '[{"key":"A","value":"will be"},{"key":"B","value":"has been"},{"key":"C","value":"was"},{"key":"D","value":"is being"}]',
 'A', 'Future passive voice được dùng cho kế hoạch tương lai chưa xảy ra. "will be launched" = sẽ được ra mắt.', 'B2'),

('TOEIC', 'NGU_PHAP', 5, 'trac_nghiem',
 'The company requires all employees _____ their timesheets by Friday.',
 '[{"key":"A","value":"submit"},{"key":"B","value":"to submit"},{"key":"C","value":"submitting"},{"key":"D","value":"submitted"}]',
 'B', '"require + object + to-infinitive" là cấu trúc cố định trong tiếng Anh thương mại.', 'B1'),

('TOEIC', 'NGU_PHAP', 5, 'trac_nghiem',
 '_____ the weather forecast, the outdoor event will proceed as scheduled.',
 '[{"key":"A","value":"Despite"},{"key":"B","value":"According to"},{"key":"C","value":"Due to"},{"key":"D","value":"In spite"}]',
 'B', '"According to" = theo (nguồn thông tin). "Despite/In spite of" = mặc dù. "Due to" = vì/do.', 'B1'),

('TOEIC', 'NGU_PHAP', 5, 'trac_nghiem',
 'Mr. Chen has been with the company _____ fifteen years and is highly respected.',
 '[{"key":"A","value":"since"},{"key":"B","value":"during"},{"key":"C","value":"for"},{"key":"D","value":"within"}]',
 'C', '"for + khoảng thời gian" (for 15 years). "since + mốc thời gian" (since 2009).', 'A2'),

('TOEIC', 'DOC', 7, 'trac_nghiem',
 'Questions 1-3 refer to the following email:\n\nTo: All Staff\nFrom: HR Department\nSubject: Annual Performance Review Schedule\n\nDear Team,\n\nThis is a reminder that annual performance reviews will be conducted between March 15-30. Each employee should schedule a 45-minute meeting with their direct supervisor through the online booking system by March 10.\n\nReviews will cover: (1) Achievement of 2024 goals, (2) Development areas, (3) 2025 objectives.\n\nPlease prepare a self-assessment form available on the HR portal.\n\nBest regards,\nHR Department\n\nQuestion: What is the purpose of this email?',
 '[{"key":"A","value":"To announce new HR policies"},{"key":"B","value":"To remind staff about performance reviews"},{"key":"C","value":"To introduce a new booking system"},{"key":"D","value":"To set 2025 company goals"}]',
 'B', 'Email nêu rõ "This is a reminder that annual performance reviews will be conducted" → mục đích là nhắc nhở về buổi đánh giá hiệu suất.', 'B1'),

-- VSTEP B1
('VSTEP', 'DOC', 1, 'trac_nghiem',
 'Although the weather was terrible, the football match _____ as planned.',
 '[{"key":"A","value":"went on"},{"key":"B","value":"went off"},{"key":"C","value":"went up"},{"key":"D","value":"went out"}]',
 'A', '"go on" = tiếp tục diễn ra. "went off" = nổ/hỏng. "went up" = tăng lên. "went out" = ra ngoài/tắt.', 'B1'),

('VSTEP', 'NGU_PHAP', 2, 'trac_nghiem',
 'If I _____ you, I would accept their job offer immediately.',
 '[{"key":"A","value":"am"},{"key":"B","value":"was"},{"key":"C","value":"were"},{"key":"D","value":"had been"}]',
 'C', 'Câu điều kiện loại 2: If + S + were... → diễn tả tình huống giả định không thực ở hiện tại. "If I were you" là cấu trúc cố định.', 'B1'),

-- Level Test questions
('LEVEL_TEST', 'NGU_PHAP', 1, 'trac_nghiem',
 'She _____ to the gym three times a week.',
 '[{"key":"A","value":"go"},{"key":"B","value":"goes"},{"key":"C","value":"is going"},{"key":"D","value":"went"}]',
 'B', 'Thói quen hiện tại (three times a week) → Present Simple. Chủ ngữ "she" → động từ thêm s.', 'A2'),

('LEVEL_TEST', 'NGU_PHAP', 1, 'trac_nghiem',
 'By the time the manager arrived, the team _____ the project.',
 '[{"key":"A","value":"finished"},{"key":"B","value":"was finishing"},{"key":"C","value":"had finished"},{"key":"D","value":"has finished"}]',
 'C', '"By the time + past simple" → hành động xảy ra TRƯỚC → Past Perfect (had + V3).', 'B2'),

('LEVEL_TEST', 'TU_VUNG', 1, 'trac_nghiem',
 'The word "meticulous" most closely means:',
 '[{"key":"A","value":"careless"},{"key":"B","value":"extremely careful about details"},{"key":"C","value":"very fast"},{"key":"D","value":"highly creative"}]',
 'B', '"Meticulous" = cực kỳ cẩn thận, tỉ mỉ trong từng chi tiết. Từ quan trọng trong TOEIC/APTIS.', 'C1');


-- =============================================
-- ADMIN: Ensure admin can see all data
-- =============================================

-- Admin policy for PhienLuyenThi
CREATE POLICY "Admin reads all exams" ON public."PhienLuyenThi"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public."NguoiDung" WHERE id = auth.uid() AND vai_tro = 'admin')
  );

-- Admin policy for TienDoHocTuVung
CREATE POLICY "Admin reads all SRS" ON public."TienDoHocTuVung"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public."NguoiDung" WHERE id = auth.uid() AND vai_tro = 'admin')
  );

-- Admin full access to BaiHocNguPhap
CREATE POLICY "Admin manages grammar" ON public."BaiHocNguPhap"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public."NguoiDung" WHERE id = auth.uid() AND vai_tro = 'admin')
  );

-- Admin full access to NganHangCauHoi
CREATE POLICY "Admin manages questions" ON public."NganHangCauHoi"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public."NguoiDung" WHERE id = auth.uid() AND vai_tro = 'admin')
  );

-- Admin full access to BoDuVung
CREATE POLICY "Admin manages vocab sets" ON public."BoDuVung"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public."NguoiDung" WHERE id = auth.uid() AND vai_tro = 'admin')
  );

-- Admin full access to TuVung
CREATE POLICY "Admin manages words" ON public."TuVung"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public."NguoiDung" WHERE id = auth.uid() AND vai_tro = 'admin')
  );
