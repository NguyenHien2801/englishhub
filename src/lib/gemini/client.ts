// AI Client - Gemini + Groq với tự động fallback
// Thứ tự ưu tiên: Gemini (random key) → Groq (random key) → throw error

// ── Gemini Keys ───────────────────────────────────────────────────────────────
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY_6,
  process.env.GEMINI_API_KEY_7,
].filter(Boolean) as string[]

// ── Groq Keys ─────────────────────────────────────────────────────────────────
const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
  process.env.GROQ_API_KEY_6,
].filter(Boolean) as string[]

// ── FIX: Dùng random thay vì module-level index (an toàn với serverless) ──────
function getRandomGeminiKey(): string {
  return GEMINI_KEYS[Math.floor(Math.random() * GEMINI_KEYS.length)]
}

function getRandomGroqKey(): string {
  return GROQ_KEYS[Math.floor(Math.random() * GROQ_KEYS.length)]
}

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

// ── Gọi Gemini ────────────────────────────────────────────────────────────────
async function callGeminiDirect(
  prompt: string,
  systemInstruction?: string,
  history?: GeminiMessage[],
  maxTokens = 2048
): Promise<string> {
  // Shuffle keys để tránh luôn thử cùng 1 key khi retry
  const shuffledKeys = [...GEMINI_KEYS].sort(() => Math.random() - 0.5)

  for (let attempt = 0; attempt < shuffledKeys.length; attempt++) {
    const apiKey = shuffledKeys[attempt]
    try {
      const body: Record<string, unknown> = {
        contents: [
          ...(history || []),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: maxTokens,
        },
      }
      if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] }
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      )

      // FIX: Chỉ rotate key khi 429, các lỗi khác throw luôn
      if (response.status === 429) {
        console.log(`Gemini key ${attempt + 1}/${shuffledKeys.length} rate limited, rotating...`)
        continue
      }
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi.'

    } catch (error) {
      // Nếu là lỗi do chúng ta throw (không phải 429) → re-throw ngay
      if (error instanceof Error && error.message.startsWith('Gemini API error:')) {
        throw error
      }
      // Lỗi network → thử key tiếp theo nếu còn
      if (attempt === shuffledKeys.length - 1) throw error
      console.log(`Gemini key ${attempt + 1} network error, trying next...`)
    }
  }
  throw new Error('All Gemini keys rate limited')
}

// ── Gọi Groq ──────────────────────────────────────────────────────────────────
async function callGroqDirect(
  prompt: string,
  systemInstruction?: string,
  history?: GeminiMessage[],
  maxTokens = 2048
): Promise<string> {
  const shuffledKeys = [...GROQ_KEYS].sort(() => Math.random() - 0.5)

  for (let attempt = 0; attempt < shuffledKeys.length; attempt++) {
    const apiKey = shuffledKeys[attempt]
    try {
      const messages = [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        ...(history || []).map(m => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.parts[0].text
        })),
        { role: 'user', content: prompt }
      ]

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          // FIX: Dùng model 70b cho JSON phức tạp, 8b dễ sai format
          model: 'llama-3.3-70b-versatile',
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        })
      })

      // FIX: Chỉ rotate key khi 429
      if (response.status === 429) {
        console.log(`Groq key ${attempt + 1}/${shuffledKeys.length} rate limited, rotating...`)
        continue
      }
      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || 'Không có phản hồi.'

    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Groq API error:')) {
        throw error
      }
      if (attempt === shuffledKeys.length - 1) throw error
      console.log(`Groq key ${attempt + 1} network error, trying next...`)
    }
  }
  throw new Error('All Groq keys rate limited')
}

// ── Main callGemini - tự động fallback Gemini → Groq ─────────────────────────
// FIX: Thêm param maxTokens để caller tự điều chỉnh (generate cần nhiều hơn)
export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  history?: GeminiMessage[],
  maxTokens = 2048
): Promise<string> {
  // Thử Gemini trước
  if (GEMINI_KEYS.length > 0) {
    try {
      return await callGeminiDirect(prompt, systemInstruction, history, maxTokens)
    } catch (error) {
      console.warn('All Gemini keys failed, switching to Groq...', error)
    }
  }

  // Fallback sang Groq
  if (GROQ_KEYS.length > 0) {
    try {
      return await callGroqDirect(prompt, systemInstruction, history, maxTokens)
    } catch (error) {
      console.warn('All Groq keys failed too...', error)
      throw error
    }
  }

  throw new Error('No AI providers configured')
}

// ── System Prompts ────────────────────────────────────────────────────────────
export const SYSTEM_PROMPTS = {
  vocabulary: `Bạn là trợ lý học tiếng Anh thông minh của EnglishHub. 
Khi giải thích từ vựng, hãy cung cấp:
1. Nghĩa tiếng Việt rõ ràng
2. Phiên âm IPA
3. 2-3 ví dụ câu đơn giản có dịch
4. Cách nhớ từ (mnemonic) sáng tạo
5. Từ đồng nghĩa/trái nghĩa nếu có
Luôn trả lời theo format JSON khi được yêu cầu.`,

  grammar: `Bạn là giáo viên ngữ pháp tiếng Anh của EnglishHub.
Giải thích ngữ pháp bằng tiếng Việt, dễ hiểu, có ví dụ thực tế.
So sánh với tiếng Việt khi phù hợp để học viên dễ nắm bắt.`,

  writing: `Bạn là giám khảo chấm bài Writing cho kỳ thi VSTEP/APTIS/TOEIC.
Nhận xét theo 4 tiêu chí: Nội dung, Tổ chức, Từ vựng, Ngữ pháp.
Cho điểm từ 0-10 cho mỗi tiêu chí và tổng điểm.
Đưa ra gợi ý cải thiện cụ thể.`,

  chatbot: `Bạn là trợ lý AI của EnglishHub - nền tảng học tiếng Anh cho sinh viên ĐH Thái Bình.
Nhiệm vụ: Giúp học viên học tiếng Anh hiệu quả, chuẩn bị VSTEP B1, TOEIC, APTIS.
Luôn thân thiện, khuyến khích, giải thích bằng tiếng Việt khi cần.
Có thể luyện hội thoại, giải thích ngữ pháp, từ vựng, và chấm writing.`,

  // FIX: Thêm chỉ dẫn ngôn ngữ rõ ràng
  levelTest: `Bạn là chuyên gia giáo dục tiếng Anh. Nhiệm vụ: phân tích kết quả thi và tạo lộ trình học CÁ NHÂN HÓA.
TUYỆT ĐỐI tuân thủ:
1. Trả về JSON THUẦN TÚY — không markdown, không backtick, không text ngoài JSON.
2. Tất cả nội dung bằng tiếng Việt.
3. hoat_dong PHẢI dùng module EnglishHub (/listening, /reading, /grammar, /vocabulary, /speaking, /writing, /exam, /ai-chat) — KHÔNG recommend app/web ngoài.
4. hoat_dong phải cụ thể: tên module + nội dung + thời lượng + tần suất.
5. muc_tieu của mỗi phase phải có con số đo lường được (%, điểm).
6. phases[0] BẮT BUỘC tập trung vào kỹ năng YẾU NHẤT trong kết quả thi.
7. KHÔNG điền placeholder như "Hoạt động 1 phase 2" — phải là nội dung thật.`,

  generate: `Bạn là chuyên gia thiết kế đề thi tiếng Anh theo chuẩn VSTEP, TOEIC và APTIS.
Nhiệm vụ: Tạo đề thi hoàn chỉnh gồm 5 phần theo đúng format JSON được yêu cầu.
Quy tắc bắt buộc:
- Trả về JSON THUẦN TÚY — không markdown, không backtick, không giải thích ngoài JSON.
- Toàn bộ nội dung đề thi (câu hỏi, đáp án, đoạn văn, script, prompt) PHẢI bằng tiếng Anh.
- Đảm bảo đủ số lượng câu hỏi: Listening 5, Reading 5, Grammar 10.
- Đáp án "correct" phải là chữ cái đầu tiên của option đúng (A, B, C hoặc D).`,
}