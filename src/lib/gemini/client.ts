// AI Client - Gemini + Groq với tự động fallback
// Thứ tự ưu tiên: Gemini (tất cả key) → Groq (tất cả key) → throw error

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

let geminiKeyIndex = 0
let groqKeyIndex = 0

function getNextGeminiKey(): string {
  const key = GEMINI_KEYS[geminiKeyIndex]
  geminiKeyIndex = (geminiKeyIndex + 1) % GEMINI_KEYS.length
  return key
}

function getNextGroqKey(): string {
  const key = GROQ_KEYS[groqKeyIndex]
  groqKeyIndex = (groqKeyIndex + 1) % GROQ_KEYS.length
  return key
}

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

// ── Gọi Gemini ────────────────────────────────────────────────────────────────
async function callGeminiDirect(
  prompt: string,
  systemInstruction?: string,
  history?: GeminiMessage[]
): Promise<string> {
  for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
    const apiKey = getNextGeminiKey()
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
        body.systemInstruction = { parts: [{ text: systemInstruction }] }
      }
      const response = await fetch(
        // Sửa trong client.ts:
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      )
      if (response.status === 429) {
        console.log(`Gemini key ${attempt + 1} rate limited, rotating...`)
        continue
      }
      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi.'
    } catch (error) {
      if (attempt === GEMINI_KEYS.length - 1) throw error
    }
  }
  throw new Error('All Gemini keys exhausted')
}

// ── Gọi Groq ──────────────────────────────────────────────────────────────────
async function callGroqDirect(
  prompt: string,
  systemInstruction?: string,
  history?: GeminiMessage[]
): Promise<string> {
  for (let attempt = 0; attempt < GROQ_KEYS.length; attempt++) {
    const apiKey = getNextGroqKey()
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
          model: 'llama-3.1-8b-instant',
          messages,
          max_tokens: 2048,
          temperature: 0.7,
          response_format: { type: 'json_object' }, 
        })
      })
      if (response.status === 429) {
        console.log(`Groq key ${attempt + 1} rate limited, rotating...`)
        continue
      }
      if (!response.ok) throw new Error(`Groq API error: ${response.status}`)
      const data = await response.json()
      return data.choices?.[0]?.message?.content || 'Không có phản hồi.'
    } catch (error) {
      if (attempt === GROQ_KEYS.length - 1) throw error
    }
  }
  throw new Error('All Groq keys exhausted')
}

// ── Main callGemini - tự động fallback Gemini → Groq ─────────────────────────
export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  history?: GeminiMessage[]
): Promise<string> {
  // Thử Gemini trước
  if (GEMINI_KEYS.length > 0) {
    try {
      return await callGeminiDirect(prompt, systemInstruction, history)
    } catch (error) {
      console.warn('All Gemini keys failed, switching to Groq...', error)
    }
  }

  // Fallback sang Groq
  if (GROQ_KEYS.length > 0) {
    try {
      return await callGroqDirect(prompt, systemInstruction, history)
    } catch (error) {
      console.warn('All Groq keys failed too...', error)
    }
  }

  throw new Error('All AI providers exhausted')
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