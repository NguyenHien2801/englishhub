-- Run AFTER supabase-schema.sql
-- Seeds word roots only (AI generates the content)

-- Get TOEIC Essential 600 set ID first, then run:
DO $$
DECLARE
  toeic_600_id UUID;
  toeic_800_id UUID;
  vstep_b1_id UUID;
  business_id UUID;
BEGIN
  SELECT id INTO toeic_600_id FROM public."BoDuVung" WHERE ten_bo = 'TOEIC Essential 600';
  SELECT id INTO toeic_800_id FROM public."BoDuVung" WHERE ten_bo = 'TOEIC Advanced 800';
  SELECT id INTO vstep_b1_id FROM public."BoDuVung" WHERE ten_bo = 'VSTEP B1 Core';
  SELECT id INTO business_id FROM public."BoDuVung" WHERE ten_bo = 'Business English';

  -- TOEIC 600 words (A2-B1 level)
  INSERT INTO public."TuVung" (bo_du_vung_id, tu_tieng_anh, loai_tu, cap_do, thu_tu_hien_thi) VALUES
    (toeic_600_id, 'acknowledge', 'verb', 'B1', 1),
    (toeic_600_id, 'acquire', 'verb', 'B1', 2),
    (toeic_600_id, 'adequate', 'adjective', 'B1', 3),
    (toeic_600_id, 'agenda', 'noun', 'B1', 4),
    (toeic_600_id, 'allocate', 'verb', 'B2', 5),
    (toeic_600_id, 'ambitious', 'adjective', 'B1', 6),
    (toeic_600_id, 'amendment', 'noun', 'B2', 7),
    (toeic_600_id, 'announce', 'verb', 'A2', 8),
    (toeic_600_id, 'apparent', 'adjective', 'B1', 9),
    (toeic_600_id, 'approve', 'verb', 'A2', 10),
    (toeic_600_id, 'arrange', 'verb', 'A2', 11),
    (toeic_600_id, 'assign', 'verb', 'B1', 12),
    (toeic_600_id, 'assist', 'verb', 'A2', 13),
    (toeic_600_id, 'assume', 'verb', 'B1', 14),
    (toeic_600_id, 'attain', 'verb', 'B2', 15),
    (toeic_600_id, 'benefit', 'noun', 'A2', 16),
    (toeic_600_id, 'candidate', 'noun', 'B1', 17),
    (toeic_600_id, 'capacity', 'noun', 'B1', 18),
    (toeic_600_id, 'collaborate', 'verb', 'B2', 19),
    (toeic_600_id, 'commitment', 'noun', 'B1', 20)
  ON CONFLICT (bo_du_vung_id, tu_tieng_anh) DO NOTHING;

  -- TOEIC 800 words (B2 level)
  INSERT INTO public."TuVung" (bo_du_vung_id, tu_tieng_anh, loai_tu, cap_do, thu_tu_hien_thi) VALUES
    (toeic_800_id, 'accommodate', 'verb', 'B2', 1),
    (toeic_800_id, 'accountable', 'adjective', 'B2', 2),
    (toeic_800_id, 'accumulate', 'verb', 'B2', 3),
    (toeic_800_id, 'anticipate', 'verb', 'B2', 4),
    (toeic_800_id, 'approximately', 'adverb', 'B1', 5),
    (toeic_800_id, 'authorize', 'verb', 'B2', 6),
    (toeic_800_id, 'comprehensive', 'adjective', 'B2', 7),
    (toeic_800_id, 'confidential', 'adjective', 'B2', 8),
    (toeic_800_id, 'consecutive', 'adjective', 'B2', 9),
    (toeic_800_id, 'consolidate', 'verb', 'C1', 10)
  ON CONFLICT (bo_du_vung_id, tu_tieng_anh) DO NOTHING;

  -- VSTEP B1 words
  INSERT INTO public."TuVung" (bo_du_vung_id, tu_tieng_anh, loai_tu, cap_do, thu_tu_hien_thi) VALUES
    (vstep_b1_id, 'communicate', 'verb', 'A2', 1),
    (vstep_b1_id, 'environment', 'noun', 'B1', 2),
    (vstep_b1_id, 'experience', 'noun', 'A2', 3),
    (vstep_b1_id, 'government', 'noun', 'B1', 4),
    (vstep_b1_id, 'important', 'adjective', 'A1', 5),
    (vstep_b1_id, 'international', 'adjective', 'B1', 6),
    (vstep_b1_id, 'opportunity', 'noun', 'B1', 7),
    (vstep_b1_id, 'population', 'noun', 'B1', 8),
    (vstep_b1_id, 'technology', 'noun', 'B1', 9),
    (vstep_b1_id, 'understand', 'verb', 'A2', 10)
  ON CONFLICT (bo_du_vung_id, tu_tieng_anh) DO NOTHING;

  -- Business English words
  INSERT INTO public."TuVung" (bo_du_vung_id, tu_tieng_anh, loai_tu, cap_do, thu_tu_hien_thi) VALUES
    (business_id, 'negotiate', 'verb', 'B2', 1),
    (business_id, 'revenue', 'noun', 'B2', 2),
    (business_id, 'stakeholder', 'noun', 'B2', 3),
    (business_id, 'deadline', 'noun', 'B1', 4),
    (business_id, 'leverage', 'verb', 'C1', 5),
    (business_id, 'outsource', 'verb', 'B2', 6),
    (business_id, 'benchmark', 'noun', 'B2', 7),
    (business_id, 'forecast', 'verb', 'B2', 8),
    (business_id, 'implement', 'verb', 'B2', 9),
    (business_id, 'sustainable', 'adjective', 'B2', 10)
  ON CONFLICT (bo_du_vung_id, tu_tieng_anh) DO NOTHING;

  -- Update word counts
  UPDATE public."BoDuVung" SET tong_so_tu = (
    SELECT COUNT(*) FROM public."TuVung" WHERE bo_du_vung_id = public."BoDuVung".id
  );
END $$;
