import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini/client'

// Cấu hình số câu chuẩn theo từng kỳ thi + kỹ năng + part
const FULL_EXAM_CONFIG: Record<string, Record<string, { soPhan: number; soCau: number }[]>> = {
  TOEIC: {
    NGU_PHAP: [
      { soPhan: 5, soCau: 30 }, // Part 5: Incomplete Sentences
      { soPhan: 6, soCau: 16 }, // Part 6: Text Completion
    ],
    DOC: [
      { soPhan: 7, soCau: 54 }, // Part 7: Reading Comprehension
    ],
    TU_VUNG: [
      { soPhan: 5, soCau: 30 }, // Dùng chung Part 5
    ],
  },
  VSTEP: {
    DOC:     [{ soPhan: 1, soCau: 40 }], // 4 bài đọc × 10 câu
    NGU_PHAP:[{ soPhan: 1, soCau: 30 }],
    TU_VUNG: [{ soPhan: 1, soCau: 25 }],
    NGHE:    [
      { soPhan: 1, soCau: 8  },
      { soPhan: 2, soCau: 12 },
      { soPhan: 3, soCau: 15 },
    ],
  },
  APTIS: {
    NGU_PHAP:[
      { soPhan: 1, soCau: 25 }, // Grammar
      { soPhan: 2, soCau: 25 }, // Vocabulary
    ],
    DOC:     [
      { soPhan: 1, soCau: 10 },
      { soPhan: 2, soCau: 10 },
      { soPhan: 3, soCau: 10 },
      { soPhan: 4, soCau: 10 },
    ],
    TU_VUNG: [{ soPhan: 2, soCau: 25 }],
  },
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const loai   = searchParams.get('loai')   || 'TOEIC'
  const kyNang = searchParams.get('kyNang') || 'NGU_PHAP'
  const mode   = searchParams.get('mode')   || 'quick' // 'quick' | 'full'

  // ── QUICK MODE: random 10 câu (giữ nguyên logic cũ) ──────────────────
  if (mode === 'quick') {
    const { data: questions } = await supabase
      .from('NganHangCauHoi')
      .select('*')
      .eq('loai_chung_chi', loai)
      .eq('ky_nang', kyNang)
      .limit(50) // lấy nhiều rồi shuffle để random hơn

    const shuffled = (questions || [])
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)

    return NextResponse.json({ questions: shuffled, mode: 'quick' })
  }

  // ── FULL MODE: lấy đúng số câu theo chuẩn từng part ──────────────────
  const config = FULL_EXAM_CONFIG[loai]?.[kyNang]
  if (!config) {
    return NextResponse.json({ error: 'Không có cấu hình cho kỳ thi này' }, { status: 400 })
  }

  // Lấy câu hỏi từng part song song
  const partResults = await Promise.all(
    config.map(({ soPhan, soCau }) =>
      supabase
        .from('NganHangCauHoi')
        .select('*')
        .eq('loai_chung_chi', loai)
        .eq('ky_nang', kyNang)
        .eq('so_phan', soPhan)
        .limit(soCau + 20) // lấy dư để shuffle
        .then(({ data }) => ({
          soPhan,
          soCau,
          questions: (data || [])
            .sort(() => Math.random() - 0.5)
            .slice(0, soCau),
        }))
    )
  )

  // Gộp tất cả câu theo thứ tự part
  const allQuestions = partResults.flatMap(p => p.questions)
  const tongSoCauChuan = config.reduce((s, c) => s + c.soCau, 0)

  return NextResponse.json({
    questions: allQuestions,
    mode: 'full',
    cauHinhDeThi: partResults.map(p => ({
      soPhan: p.soPhan,
      soCauChuan: p.soCau,
      soCauThucTe: p.questions.length,
    })),
    tongSoCauChuan,
  })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { loai_chung_chi, ky_nang, answers, questions, thoiGianLamBai, mode } = body

  let diemSo = 0
  const cauTraLoi = answers.map((ans: { questionId: string; answer: string }) => {
    const q = questions.find((q: Record<string, unknown>) => q.id === ans.questionId)
    const isCorrect = q?.dap_an_dung === ans.answer
    if (isCorrect) diemSo++
    return { question_id: ans.questionId, user_answer: ans.answer, is_correct: isCorrect }
  })

  const tongSoCau    = questions.length
  const phanTramDung = Math.round((diemSo / tongSoCau) * 100)

  // Quy đổi điểm theo kỳ thi
  let diemQuyDoi = null
  if (loai_chung_chi === 'TOEIC') {
    // TOEIC Reading: max 495. Full exam (100 câu) → thang 10–495
    diemQuyDoi = Math.round(10 + (diemSo / tongSoCau) * 485)
  } else if (loai_chung_chi === 'VSTEP') {
    // VSTEP thang 10: 0–10
    diemQuyDoi = parseFloat(((diemSo / tongSoCau) * 10).toFixed(1))
  } else if (loai_chung_chi === 'APTIS') {
    // APTIS: 0–50 mỗi component
    diemQuyDoi = Math.round((diemSo / tongSoCau) * 50)
  }

  // AI phân tích
  let phanTichAi = ''
  try {
    const wrongAnswers = cauTraLoi.filter((c: { is_correct: boolean }) => !c.is_correct)
    const modeLabel = mode === 'full' ? 'Đề thi đầy đủ' : 'Luyện nhanh'
    const prompt = `Phân tích kết quả bài thi ${loai_chung_chi} - Kỹ năng ${ky_nang} (${modeLabel}):
- Số câu đúng: ${diemSo}/${tongSoCau} (${phanTramDung}%)
- Số câu sai: ${wrongAnswers.length}
- Thời gian làm bài: ${Math.round(thoiGianLamBai / 60)} phút

Hãy đưa ra:
1. Nhận xét ngắn gọn về kết quả
2. Điểm cần cải thiện
3. Gợi ý bài học tiếp theo
(Trả lời bằng tiếng Việt, ngắn gọn trong 150 từ)`

    phanTichAi = await callGemini(prompt)
  } catch { /* skip */ }

  const { data: session } = await supabase.from('PhienLuyenThi').insert({
    nguoi_dung_id:    user.id,
    loai_chung_chi,
    ky_nang,
    la_de_day_du:     mode === 'full',
    diem_so:          diemSo,
    diem_quy_doi:     diemQuyDoi,
    tong_so_cau:      tongSoCau,
    so_cau_dung:      diemSo,
    thoi_gian_lam_bai: thoiGianLamBai,
    cau_tra_loi_json: cauTraLoi,
    phan_tich_ai:     phanTichAi,
  }).select().single()

  return NextResponse.json({
    session, diemSo, tongSoCau,
    phanTramDung, diemQuyDoi,
    phanTichAi, cauTraLoi,
  })
}