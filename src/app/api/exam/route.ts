import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini/client'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const loai = searchParams.get('loai') || 'TOEIC'
  const kyNang = searchParams.get('kyNang') || 'NGU_PHAP'
  const limit = parseInt(searchParams.get('limit') || '10')

  const { data: questions } = await supabase
    .from('NganHangCauHoi')
    .select('*')
    .eq('loai_chung_chi', loai)
    .eq('ky_nang', kyNang)
    .limit(limit)

  // Shuffle questions
  const shuffled = (questions || []).sort(() => Math.random() - 0.5)
  return NextResponse.json({ questions: shuffled })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { loai_chung_chi, ky_nang, answers, questions, thoiGianLamBai } = body

  let diemSo = 0
  const cauTraLoi = answers.map((ans: { questionId: string; answer: string }) => {
    const q = questions.find((q: Record<string, unknown>) => q.id === ans.questionId)
    const isCorrect = q?.dap_an_dung === ans.answer
    if (isCorrect) diemSo++
    return { question_id: ans.questionId, user_answer: ans.answer, is_correct: isCorrect }
  })

  const tongSoCau = questions.length
  const phanTramDung = Math.round((diemSo / tongSoCau) * 100)

  // TOEIC score conversion
  let diemQuyDoi = null
  if (loai_chung_chi === 'TOEIC') {
    diemQuyDoi = Math.round((diemSo / tongSoCau) * 495) // simplified
  }

  // AI analysis
  let phanTichAi = ''
  try {
    const wrongAnswers = cauTraLoi.filter((c: { is_correct: boolean }) => !c.is_correct)
    const prompt = `Phân tích kết quả bài thi ${loai_chung_chi} - Kỹ năng ${ky_nang}:
- Số câu đúng: ${diemSo}/${tongSoCau} (${phanTramDung}%)
- Số câu sai: ${wrongAnswers.length}
- Thời gian làm bài: ${Math.round(thoiGianLamBai / 60)} phút

Hãy đưa ra:
1. Nhận xét ngắn gọn về kết quả
2. Điểm cần cải thiện
3. Gợi ý bài học tiếp theo
(Trả lời bằng tiếng Việt, ngắn gọn trong 150 từ)`

    phanTichAi = await callGemini(prompt)
  } catch { /* skip AI analysis on error */ }

  const { data: session } = await supabase.from('PhienLuyenThi').insert({
    nguoi_dung_id: user.id,
    loai_chung_chi,
    ky_nang,
    diem_so: diemSo,
    diem_quy_doi: diemQuyDoi,
    tong_so_cau: tongSoCau,
    so_cau_dung: diemSo,
    thoi_gian_lam_bai: thoiGianLamBai,
    cau_tra_loi_json: cauTraLoi,
    phan_tich_ai: phanTichAi,
  }).select().single()

  return NextResponse.json({
    session,
    diemSo,
    tongSoCau,
    phanTramDung,
    diemQuyDoi,
    phanTichAi,
    cauTraLoi,
  })
}
