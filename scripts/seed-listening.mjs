import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envFile = readFileSync('.env.local', 'utf-8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
    .filter(([k]) => k)
)

const GEMINI_KEYS = [
  env.GEMINI_API_KEY_1, env.GEMINI_API_KEY_2, env.GEMINI_API_KEY_3,
  env.GEMINI_API_KEY_4, env.GEMINI_API_KEY_5, env.GEMINI_API_KEY_6,
  env.GEMINI_API_KEY_7,
].filter(Boolean)

const GROQ_KEYS = [
  env.GROQ_API_KEY_1, env.GROQ_API_KEY_2, env.GROQ_API_KEY_3,
  env.GROQ_API_KEY_4, env.GROQ_API_KEY_5, env.GROQ_API_KEY_6,
].filter(Boolean)

console.log('✅ Gemini keys: ' + GEMINI_KEYS.length + '/7')
console.log('✅ Groq keys:   ' + GROQ_KEYS.length + '/6')

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

let geminiIdx = 0
let groqIdx = 0

function nextGeminiKey() {
  const key = GEMINI_KEYS[geminiIdx]
  geminiIdx = (geminiIdx + 1) % GEMINI_KEYS.length
  return key
}

function nextGroqKey() {
  const key = GROQ_KEYS[groqIdx]
  groqIdx = (groqIdx + 1) % GROQ_KEYS.length
  return key
}

async function callGemini(prompt) {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const apiKey = nextGeminiKey()
    try {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' + apiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
          })
        }
      )
      if (res.status === 429) { console.log('  Gemini key ' + (i+1) + ' rate limited...'); continue }
      if (!res.ok) throw new Error('Gemini HTTP ' + res.status)
      const data = await res.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } catch (err) {
      console.log('  Gemini key ' + (i+1) + ' loi: ' + err.message)
    }
  }
  console.log('  Tat ca Gemini fail, chuyen sang Groq...')
  return await callGroq(prompt)
}

async function callGroq(prompt) {
  for (let i = 0; i < GROQ_KEYS.length; i++) {
    const apiKey = nextGroqKey()
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        })
      })
      if (res.status === 429) { console.log('  Groq key ' + (i+1) + ' rate limited...'); continue }
      if (!res.ok) throw new Error('Groq HTTP ' + res.status)
      const data = await res.json()
      return data.choices?.[0]?.message?.content || ''
    } catch (err) {
      console.log('  Groq key ' + (i+1) + ' loi: ' + err.message)
    }
  }
  throw new Error('Tat ca 13 keys deu that bai!')
}

function safeParseJSON(text) {
  try {
    const m = text.match(/```json\s*([\s\S]*?)\s*```/) ||
              text.match(/```\s*([\s\S]*?)\s*```/) ||
              text.match(/(\{[\s\S]*\})/)
    return JSON.parse(m ? m[1] : text)
  } catch { return null }
}

const BAI_CONFIGS = [
  { loai: 'TOEIC', cap_do: 'A2', chu_de: 'Shopping and Services',    so_cau: 3, video_url: null },
  { loai: 'TOEIC', cap_do: 'B1', chu_de: 'Office and Workplace',     so_cau: 4, video_url: 'https://www.youtube.com/embed/sIEFVpPFn0Y' },
  { loai: 'TOEIC', cap_do: 'B1', chu_de: 'Travel and Transportation',so_cau: 4, video_url: null },
  { loai: 'TOEIC', cap_do: 'B2', chu_de: 'Business Meeting', so_cau: 4, video_url: 'https://www.youtube.com/embed/BRFMbgMKNYc' },
  { loai: 'TOEIC', cap_do: 'B2', chu_de: 'Customer Service',         so_cau: 4, video_url: null },
  { loai: 'VSTEP', cap_do: 'A2', chu_de: 'Daily Conversations',      so_cau: 3, video_url: null },
  { loai: 'VSTEP', cap_do: 'B1', chu_de: 'Education and Campus',     so_cau: 4, video_url: null },
  { loai: 'VSTEP', cap_do: 'B1', chu_de: 'Health and Hospital',      so_cau: 4, video_url: 'https://www.youtube.com/embed/7gCDzpAkVn0' },
  { loai: 'VSTEP', cap_do: 'B2', chu_de: 'Environment and Society',  so_cau: 4, video_url: null },
  { loai: 'VSTEP', cap_do: 'B2', chu_de: 'Science and Technology',   so_cau: 4, video_url: null },
  { loai: 'APTIS', cap_do: 'A2', chu_de: 'Social Interaction',       so_cau: 3, video_url: null },
  { loai: 'APTIS', cap_do: 'B1', chu_de: 'Work and Career',          so_cau: 4, video_url: null },
  { loai: 'APTIS', cap_do: 'B1', chu_de: 'Health and Lifestyle', so_cau: 4, video_url: 'https://www.youtube.com/embed/1MkrNFcvVzQ' },
  { loai: 'APTIS', cap_do: 'B2', chu_de: 'Culture and Society',      so_cau: 4, video_url: null },
  { loai: 'APTIS', cap_do: 'B2', chu_de: 'Technology and Future',    so_cau: 4, video_url: null },
]

function buildPrompt(config) {
  return 'Ban la chuyen gia ra de thi tieng Anh chuan quoc te cho ' + config.loai + ', cap do ' + config.cap_do + '.\n' +
    'Tao 1 bai luyen nghe voi chu de "' + config.chu_de + '".\n\n' +
    'Yeu cau:\n' +
    '- script: doan hoi thoai hoac monologue tu nhien, dai 120-180 tu, tieng Anh chuan\n' +
    '- tieu_de: ten bai ngan gon bang tieng Viet\n' +
    '- mo_ta: 1 cau mo ta noi dung bang tieng Viet\n' +
    '- thoi_gian_giay: thoi luong audio uoc tinh (giay)\n' +
    '- ' + config.so_cau + ' cau hoi MCQ (4 lua chon A/B/C/D), cau hoi bang tieng Anh\n' +
    '- dap_an_dung: chi 1 chu cai A/B/C/D\n' +
    '- giai_thich: giai thich tai sao dung bang tieng Viet, trich dan tu script\n\n' +
    'Tra ve JSON duy nhat khong co text ngoai:\n' +
    '{\n' +
    '  "tieu_de": "...",\n' +
    '  "mo_ta": "...",\n' +
    '  "script": "...",\n' +
    '  "thoi_gian_giay": 90,\n' +
    '  "cau_hoi": [\n' +
    '    {\n' +
    '      "so_thu_tu": 1,\n' +
    '      "noi_dung": "...",\n' +
    '      "cac_lua_chon": ["A. ...", "B. ...", "C. ...", "D. ..."],\n' +
    '      "dap_an_dung": "A",\n' +
    '      "giai_thich": "..."\n' +
    '    }\n' +
    '  ]\n' +
    '}'
}

async function insertBai(bai, config) {
  const { data: inserted, error: e1 } = await supabase
    .from('BaiNghe')
    .insert({
      tieu_de: bai.tieu_de,
      mo_ta: bai.mo_ta,
      cap_do: config.cap_do,
      loai_chung_chi: config.loai,
      chu_de: config.chu_de,
      video_url: config.video_url,
      script: bai.script,
      thoi_gian_giay: bai.thoi_gian_giay || 90,
      da_kiem_duyet: true,
    })
    .select('id')
    .single()

  if (e1) throw new Error('Insert BaiNghe: ' + e1.message)

  const rows = bai.cau_hoi.map(q => ({
    bai_nghe_id: inserted.id,
    so_thu_tu: q.so_thu_tu,
    noi_dung: q.noi_dung,
    cac_lua_chon: q.cac_lua_chon,
    dap_an_dung: q.dap_an_dung,
    giai_thich: q.giai_thich,
  }))

  const { error: e2 } = await supabase.from('BaiNgheCauHoi').insert(rows)
  if (e2) throw new Error('Insert BaiNgheCauHoi: ' + e2.message)

  return inserted.id
}

async function main() {
  console.log('\n=== Sinh ' + BAI_CONFIGS.length + ' bai nghe (TOEIC + VSTEP + APTIS) ===')

  let success = 0
  let failed = 0

  for (let i = 0; i < BAI_CONFIGS.length; i++) {
    const config = BAI_CONFIGS[i]
    console.log('\n[' + (i+1) + '/' + BAI_CONFIGS.length + '] ' + config.loai + ' | ' + config.cap_do + ' | ' + config.chu_de)

    try {
      process.stdout.write('  Sinh noi dung...')
      const raw = await callGemini(buildPrompt(config))
      const bai = safeParseJSON(raw)

      if (!bai || !bai.cau_hoi || !bai.cau_hoi.length) {
        throw new Error('AI tra ve JSON khong hop le')
      }
      console.log(' OK: "' + bai.tieu_de + '" - ' + bai.cau_hoi.length + ' cau')

      process.stdout.write('  Insert DB...')
      const id = await insertBai(bai, config)
      console.log(' OK: ' + id.slice(0, 8) + '...')

      success++
      await new Promise(r => setTimeout(r, 1500))

    } catch (err) {
      console.log('\n  LOI: ' + err.message)
      failed++
    }
  }

  console.log('\n=== KET QUA ===')
  console.log('Thanh cong: ' + success + '/' + BAI_CONFIGS.length)
  console.log('That bai:   ' + failed + '/' + BAI_CONFIGS.length)
  console.log('Xong! Kiem tra bang BaiNghe trong Supabase.')
}

main().catch(err => {
  console.error('Crash: ' + err.message)
  process.exit(1)
})
