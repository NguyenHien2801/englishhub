import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini/client'

// ─── Cấu hình số câu chuẩn ────────────────────────────────────────────────────
const FULL_EXAM_CONFIG: Record<string, Record<string, { soPhan: number; soCau: number }[]>> = {
  TOEIC: {
    NGHE: [
      { soPhan: 1, soCau: 6  },
      { soPhan: 2, soCau: 25 },
      { soPhan: 3, soCau: 39 },
      { soPhan: 4, soCau: 30 },
    ],
    NOI: [
      { soPhan: 1, soCau: 2  },
      { soPhan: 2, soCau: 1  },
      { soPhan: 3, soCau: 3  },
      { soPhan: 4, soCau: 3  },
      { soPhan: 5, soCau: 1  },
      { soPhan: 6, soCau: 1  },
    ],
    DOC:      [{ soPhan: 7, soCau: 54 }],
    VIET:     [{ soPhan: 1, soCau: 5 }, { soPhan: 2, soCau: 2 }, { soPhan: 3, soCau: 1 }],
    NGU_PHAP: [{ soPhan: 5, soCau: 30 }, { soPhan: 6, soCau: 16 }],
    TU_VUNG:  [{ soPhan: 5, soCau: 30 }],
  },
  VSTEP: {
    NGHE: [{ soPhan: 1, soCau: 8 }, { soPhan: 2, soCau: 12 }, { soPhan: 3, soCau: 15 }],
    NOI:  [{ soPhan: 1, soCau: 1 }, { soPhan: 2, soCau: 1  }, { soPhan: 3, soCau: 1  }],
    DOC:      [{ soPhan: 1, soCau: 40 }],
    VIET:     [{ soPhan: 1, soCau: 1 }, { soPhan: 2, soCau: 1 }],
    NGU_PHAP: [{ soPhan: 1, soCau: 30 }],
    TU_VUNG:  [{ soPhan: 1, soCau: 25 }],
  },
  APTIS: {
    NGHE: [{ soPhan: 1, soCau: 6 }, { soPhan: 2, soCau: 6 }, { soPhan: 3, soCau: 6 }, { soPhan: 4, soCau: 7 }],
    NOI:  [{ soPhan: 1, soCau: 1 }, { soPhan: 2, soCau: 1 }, { soPhan: 3, soCau: 1 }, { soPhan: 4, soCau: 1 }, { soPhan: 5, soCau: 1 }],
    DOC:      [{ soPhan: 1, soCau: 10 }, { soPhan: 2, soCau: 10 }, { soPhan: 3, soCau: 10 }, { soPhan: 4, soCau: 10 }],
    VIET:     [{ soPhan: 1, soCau: 1 }, { soPhan: 2, soCau: 1 }, { soPhan: 3, soCau: 1 }, { soPhan: 4, soCau: 1 }],
    NGU_PHAP: [{ soPhan: 1, soCau: 25 }, { soPhan: 2, soCau: 25 }],
    TU_VUNG:  [{ soPhan: 2, soCau: 25 }],
  },
}

// ─── Mô tả từng part để AI sinh đúng dạng câu ────────────────────────────────
const PART_DESCRIPTIONS: Record<string, Record<string, Record<number, string>>> = {
  TOEIC: {
    NGHE: {
      1: 'Part 1 – Photographs: mỗi câu mô tả một bức ảnh, 4 đáp án A/B/C/D, chỉ 1 đáp án đúng phù hợp với ảnh (mô tả bằng văn bản)',
      2: 'Part 2 – Question-Response: một câu hỏi ngắn, 3 đáp án A/B/C, chỉ 1 câu trả lời phù hợp nhất',
      3: 'Part 3 – Conversations: đoạn hội thoại 2–3 người, mỗi đoạn 3 câu hỏi trắc nghiệm A/B/C/D',
      4: 'Part 4 – Talks: bài độc thoại ngắn, mỗi bài 3 câu hỏi trắc nghiệm A/B/C/D',
    },
    NOI: {
      1: 'Part 1 – Read Aloud: cung cấp đoạn văn ngắn (2–3 câu tiếng Anh) để thí sinh đọc to. Không có đáp án đúng/sai, chỉ cần bản văn bản.',
      2: 'Part 2 – Describe a Picture: mô tả một tình huống bằng văn bản (không cần ảnh thật) để thí sinh nói về nó',
      3: 'Part 3 – Respond to Questions: 3 câu hỏi về một chủ đề cụ thể, thí sinh trả lời miệng, không có đáp án trắc nghiệm',
      4: 'Part 4 – Respond Using Information: cung cấp một bảng/lịch trình, kèm 3 câu hỏi để thí sinh trả lời dựa vào thông tin đó',
      5: 'Part 5 – Express an Opinion: một câu hỏi open-ended yêu cầu thí sinh nêu ý kiến và lý do',
      6: 'Part 6 – Respond to Email: một email ngắn, thí sinh trả lời bằng miệng theo yêu cầu',
    },
  },
  VSTEP: {
    NGHE: {
      1: 'Part 1 – Short announcements: nghe thông báo ngắn, 8 câu hỏi trắc nghiệm A/B/C/D',
      2: 'Part 2 – Conversations: hội thoại ngắn, 12 câu hỏi trắc nghiệm A/B/C/D',
      3: 'Part 3 – Long talks/lectures: bài nói dài, 15 câu hỏi trắc nghiệm A/B/C/D',
    },
    NOI: {
      1: 'Part 1 – Monologue: chủ đề nói cá nhân, 1 câu hỏi open-ended về trải nghiệm/quan điểm',
      2: 'Part 2 – Interview: 3–4 câu hỏi phỏng vấn theo chủ đề, thí sinh trả lời tự nhiên',
      3: 'Part 3 – Presentation: một tình huống/vấn đề để thí sinh trình bày 2–3 phút',
    },
  },
  APTIS: {
    NGHE: {
      1: 'Part 1 – Multiple choice short dialogues: 6 câu hỏi trắc nghiệm từ đoạn hội thoại ngắn A/B/C',
      2: 'Part 2 – Sentence completion: nghe và điền từ còn thiếu vào câu, 6 câu',
      3: 'Part 3 – Multiple speakers: nhiều người nói, 6 câu hỏi ghép nối hoặc trắc nghiệm',
      4: 'Part 4 – Long interview/lecture: bài dài, 7 câu hỏi trắc nghiệm A/B/C/D',
    },
    NOI: {
      1: 'Part 1 – Personal interview: 4–5 câu hỏi về bản thân và cuộc sống hàng ngày',
      2: 'Part 2 – Long turn monologue: mô tả và so sánh 2 ảnh/tình huống bằng văn bản',
      3: 'Part 3 – Decision making: một tình huống cần đưa ra quyết định, thí sinh thảo luận',
      4: 'Part 4 – Discussion: câu hỏi abstract/global, thí sinh nêu ý kiến mở rộng',
      5: 'Part 5 – Long speech: một câu hỏi phức tạp để thí sinh nói dài 2+ phút',
    },
  },
}

// ─── Kiểu dữ liệu câu hỏi AI sinh ra ─────────────────────────────────────────
interface AiQuestion {
  id: string
  loai_chung_chi: string
  ky_nang: string
  so_phan: number
  noi_dung: string           // Đề bài / ngữ cảnh / bài nghe (dạng transcript)
  cau_hoi: string            // Câu hỏi cụ thể
  dap_an: Record<string, string> | null  // { A, B, C, D } hoặc null nếu open-ended
  dap_an_dung: string | null            // 'A'|'B'|'C'|'D' hoặc null
  goi_y_tra_loi: string | null          // Gợi ý mẫu cho câu open-ended
  la_cau_ai_sinh: boolean
  do_kho: string
}

// ─── Sinh câu hỏi bằng Gemini ─────────────────────────────────────────────────
async function generateQuestionsWithAI(
  loai: string,
  kyNang: string,
  soPhan: number,
  soLuong: number,
): Promise<AiQuestion[]> {
  const partDesc =
    PART_DESCRIPTIONS[loai]?.[kyNang]?.[soPhan] ??
    `${loai} ${kyNang} Part ${soPhan}: ${soLuong} câu luyện thi`

  const isOpenEnded = kyNang === 'NOI'

  const prompt = `Bạn là chuyên gia ra đề thi tiếng Anh ${loai}.
Hãy tạo ĐÚNG ${soLuong} câu hỏi cho: ${partDesc}.

${isOpenEnded
  ? `Vì đây là kỹ năng Nói, KHÔNG có đáp án trắc nghiệm. Trả về JSON array với ${soLuong} object theo cấu trúc:
{
  "noi_dung": "Ngữ cảnh/tình huống/đoạn văn (nếu có)",
  "cau_hoi": "Câu hỏi hoặc yêu cầu cho thí sinh",
  "dap_an": null,
  "dap_an_dung": null,
  "goi_y_tra_loi": "Câu trả lời mẫu ngắn gọn bằng tiếng Anh",
  "do_kho": "B1" | "B2" | "C1"
}`
  : `Trả về JSON array với ${soLuong} object theo cấu trúc:
{
  "noi_dung": "Transcript/bài nghe hoặc ngữ cảnh bằng tiếng Anh (thực tế đây là bài nghe, hãy viết transcript đầy đủ)",
  "cau_hoi": "Câu hỏi bằng tiếng Anh",
  "dap_an": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "dap_an_dung": "A" | "B" | "C" | "D",
  "goi_y_tra_loi": null,
  "do_kho": "B1" | "B2" | "C1"
}`}

Yêu cầu:
- Nội dung tự nhiên, đúng format thi thật ${loai}
- Đa dạng chủ đề: công việc, du lịch, mua sắm, giáo dục, sức khỏe
- Độ khó phù hợp trình độ B1–B2
- CHỈ trả về JSON array thuần túy, không markdown, không giải thích`

  let raw = await callGemini(prompt)

  // Strip markdown fences nếu có
  raw = raw.replace(/```json|```/g, '').trim()

  // Parse và bổ sung metadata
  const parsed: Omit<AiQuestion, 'id' | 'loai_chung_chi' | 'ky_nang' | 'so_phan' | 'la_cau_ai_sinh'>[] = JSON.parse(raw)

  return parsed.map((q, idx) => ({
    ...q,
    id:             `ai_${loai}_${kyNang}_p${soPhan}_${Date.now()}_${idx}`,
    loai_chung_chi: loai,
    ky_nang:        kyNang,
    so_phan:        soPhan,
    la_cau_ai_sinh: true,
  }))
}

// ─── Lấy câu cho một part, fallback AI nếu thiếu ──────────────────────────────
async function fetchPartQuestions(
  supabase: ReturnType<typeof createClient>,
  loai: string,
  kyNang: string,
  soPhan: number,
  soCauCanLay: number,
): Promise<AiQuestion[]> {
  const { data } = await supabase
    .from('NganHangCauHoi')
    .select('*')
    .eq('loai_chung_chi', loai)
    .eq('ky_nang', kyNang)
    .eq('so_phan', soPhan)
    .limit(soCauCanLay + 20)

  const shuffled = (data || [])
    .sort(() => Math.random() - 0.5)
    .slice(0, soCauCanLay) as AiQuestion[]

  const soCauThieu = soCauCanLay - shuffled.length
  if (soCauThieu <= 0) return shuffled

  // Thiếu → AI sinh bổ sung
  console.log(`[AI fallback] ${loai}/${kyNang}/Part${soPhan}: thiếu ${soCauThieu} câu, gọi Gemini...`)
  try {
    const aiQuestions = await generateQuestionsWithAI(loai, kyNang, soPhan, soCauThieu)
    return [...shuffled, ...aiQuestions]
  } catch (err) {
    console.error('[AI fallback] Lỗi sinh câu:', err)
    return shuffled // trả về những gì có nếu AI lỗi
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/exam
// ═══════════════════════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const loai   = searchParams.get('loai')   || 'TOEIC'
  const kyNang = searchParams.get('kyNang') || 'NGU_PHAP'
  const mode   = searchParams.get('mode')   || 'quick'

  // ── QUICK MODE ──────────────────────────────────────────────────────────────
  if (mode === 'quick') {
    const { data: questions } = await supabase
      .from('NganHangCauHoi')
      .select('*')
      .eq('loai_chung_chi', loai)
      .eq('ky_nang', kyNang)
      .limit(50)

    const fromDB = (questions || []).sort(() => Math.random() - 0.5)
    const soCauDB = Math.min(fromDB.length, 10)
    const result  = fromDB.slice(0, soCauDB) as AiQuestion[]
    const soCauThieu = 10 - soCauDB

    // AI lấp đầy nếu DB có ít hơn 10 câu (đặc biệt cho NGHE/NOI mới setup
    if (soCauThieu > 0) {
      const config = FULL_EXAM_CONFIG[loai]?.[kyNang] ?? []
      const phanNgauNhien = config[Math.floor(Math.random() * config.length)]
      if (phanNgauNhien) {
        try {
          const aiQs = await generateQuestionsWithAI(loai, kyNang, phanNgauNhien.soPhan, soCauThieu)
          return NextResponse.json({ questions: [...result, ...aiQs], mode: 'quick', hasAiQuestions: true })
        } catch (err) {
          console.error('[AI fallback quick]', err)
        }
      }
    }

    return NextResponse.json({ questions: result, mode: 'quick', hasAiQuestions: false })
  }

  // ── FULL MODE ───────────────────────────────────────────────────────────────
  const config = FULL_EXAM_CONFIG[loai]?.[kyNang]
  if (!config) {
    return NextResponse.json({ error: 'Không có cấu hình cho kỳ thi này' }, { status: 400 })
  }

  // Lấy từng part song song, AI tự bù nếu thiếu
  const partResults = await Promise.all(
    config.map(async ({ soPhan, soCau }) => {
      const questions = await fetchPartQuestions(supabase, loai, kyNang, soPhan, soCau)
      return { soPhan, soCauChuan: soCau, soCauThucTe: questions.length, questions }
    })
  )

  const allQuestions   = partResults.flatMap(p => p.questions)
  const tongSoCauChuan = config.reduce((s, c) => s + c.soCau, 0)
  const hasAiQuestions = allQuestions.some((q: AiQuestion) => q.la_cau_ai_sinh)

  return NextResponse.json({
    questions: allQuestions,
    mode: 'full',
    hasAiQuestions,
    cauHinhDeThi: partResults.map(p => ({
      soPhan:       p.soPhan,
      soCauChuan:   p.soCauChuan,
      soCauThucTe:  p.soCauThucTe,
    })),
    tongSoCauChuan,
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/exam  – Nộp bài + AI phân tích
// ═══════════════════════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { loai_chung_chi, ky_nang, answers, questions, thoiGianLamBai, mode } = body

  // ── Chấm điểm ───────────────────────────────────────────────────────────────
  // Câu open-ended (NOI, VIET) không có dap_an_dung → không tính đúng/sai
  let diemSo = 0
  const cauTraLoi = answers.map((ans: { questionId: string; answer: string }) => {
    const q = questions.find((q: Record<string, unknown>) => q.id === ans.questionId)
    const isOpenEnded = q?.dap_an_dung === null || q?.dap_an_dung === undefined
    const isCorrect   = isOpenEnded ? null : q?.dap_an_dung === ans.answer
    if (isCorrect === true) diemSo++
    return { question_id: ans.questionId, user_answer: ans.answer, is_correct: isCorrect }
  })

  const cauTracNghiem = cauTraLoi.filter((c: { is_correct: boolean | null }) => c.is_correct !== null)
  const tongSoCau     = cauTracNghiem.length || questions.length
  const phanTramDung  = tongSoCau > 0 ? Math.round((diemSo / tongSoCau) * 100) : 0

  // ── Quy đổi điểm ────────────────────────────────────────────────────────────
  let diemQuyDoi: number | null = null
  if (loai_chung_chi === 'TOEIC') {
    diemQuyDoi = Math.round(10 + (diemSo / Math.max(tongSoCau, 1)) * 485)
  } else if (loai_chung_chi === 'VSTEP') {
    diemQuyDoi = parseFloat(((diemSo / Math.max(tongSoCau, 1)) * 10).toFixed(1))
  } else if (loai_chung_chi === 'APTIS') {
    diemQuyDoi = Math.round((diemSo / Math.max(tongSoCau, 1)) * 50)
  }

  // ── AI phân tích kết quả ─────────────────────────────────────────────────────
  let phanTichAi = ''
  try {
    const kyNangLabel: Record<string, string> = {
      NGHE: 'Nghe', NOI: 'Nói', DOC: 'Đọc', VIET: 'Viết', NGU_PHAP: 'Ngữ pháp', TU_VUNG: 'Từ vựng',
    }
    const tenKyNang = kyNangLabel[ky_nang] ?? ky_nang
    const modeLabel = mode === 'full' ? 'Đề thi đầy đủ' : 'Luyện nhanh'
    const isOpenEnded = ['NOI', 'VIET'].includes(ky_nang)

    const prompt = isOpenEnded
      ? `Phân tích kết quả bài thi ${loai_chung_chi} - Kỹ năng ${tenKyNang} (${modeLabel}):
- Tổng số câu đã làm: ${questions.length}
- Thời gian làm bài: ${Math.round(thoiGianLamBai / 60)} phút
- Đây là kỹ năng Nói/Viết nên không chấm đúng/sai tự động.

Hãy đưa ra:
1. Lời động viên ngắn gọn
2. Những điểm cần lưu ý khi luyện kỹ năng ${tenKyNang}
3. Gợi ý bước tiếp theo để cải thiện
(Trả lời bằng tiếng Việt, khoảng 150 từ)`
      : `Phân tích kết quả bài thi ${loai_chung_chi} - Kỹ năng ${tenKyNang} (${modeLabel}):
- Số câu đúng: ${diemSo}/${tongSoCau} (${phanTramDung}%)
- Thời gian làm bài: ${Math.round(thoiGianLamBai / 60)} phút

Hãy đưa ra:
1. Nhận xét ngắn gọn về kết quả
2. Điểm cần cải thiện
3. Gợi ý bài học tiếp theo
(Trả lời bằng tiếng Việt, ngắn gọn trong 150 từ)`

    phanTichAi = await callGemini(prompt)
  } catch { /* skip */ }

  // ── Lưu vào Supabase ─────────────────────────────────────────────────────────
  const { data: session } = await supabase.from('PhienLuyenThi').insert({
    nguoi_dung_id:     user.id,
    loai_chung_chi,
    ky_nang,
    la_de_day_du:      mode === 'full',
    diem_so:           diemSo,
    diem_quy_doi:      diemQuyDoi,
    tong_so_cau:       questions.length,
    so_cau_dung:       diemSo,
    thoi_gian_lam_bai: thoiGianLamBai,
    cau_tra_loi_json:  cauTraLoi,
    phan_tich_ai:      phanTichAi,
  }).select().single()

  return NextResponse.json({
    session, diemSo, tongSoCau,
    phanTramDung, diemQuyDoi,
    phanTichAi, cauTraLoi,
  })
}