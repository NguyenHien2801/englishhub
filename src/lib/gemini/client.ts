// Gemini AI Client với xoay vòng key
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[]

let currentKeyIndex = 0

function getNextKey(): string {
  const key = GEMINI_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length
  return key
}

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  history?: GeminiMessage[],
  retries = 3
): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const apiKey = getNextKey()
    
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
          maxOutputTokens: 2048,
        },
      }

      if (systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: systemInstruction }]
        }
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )

      if (response.status === 429) {
        // Rate limit - thử key tiếp theo
        console.log(`Key ${currentKeyIndex} rate limited, rotating...`)
        continue
      }

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi.'
    } catch (error) {
      if (attempt === retries - 1) throw error
    }
  }
  throw new Error('All Gemini API keys exhausted')
}

// System prompts
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

  levelTest: `Phân tích kết quả Level Test và tạo lộ trình học cá nhân.
Trả về JSON với format:
{
  "trinh_do": "B1",
  "nhan_xet": "...",
  "diem_manh": ["..."],
  "diem_yeu": ["..."],
  "lo_trinh": {
    "muc_tieu": "VSTEP B1",
    "thoi_gian": "3 tháng",
    "tuan_1_2": "...",
    "tuan_3_4": "...",
    "tuan_5_8": "...",
    "tuan_9_12": "..."
  }
}`
}
