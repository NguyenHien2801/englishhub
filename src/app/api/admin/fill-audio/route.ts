// src/app/api/admin/fill-audio/route.ts
// POST /api/admin/fill-audio
// Tự động lấy audio từ Free Dictionary API và cập nhật TuVungCache
// Chỉ admin mới được gọi

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en'

async function fetchAudio(word: string): Promise<{ audio: string | null; ipa: string | null }> {
  try {
    const res = await fetch(`${DICT_API}/${encodeURIComponent(word)}`, {
      next: { revalidate: 0 },
    })
    if (!res.ok) return { audio: null, ipa: null }

    const data = await res.json()
    const entry = data[0]
    if (!entry?.phonetics?.length) return { audio: null, ipa: null }

    const withBoth  = entry.phonetics.find((p: any) => p.audio && p.text)
    const withAudio = entry.phonetics.find((p: any) => p.audio)
    const withIpa   = entry.phonetics.find((p: any) => p.text)
    const best = withBoth ?? withAudio ?? withIpa

    return {
      audio: best?.audio || null,
      ipa:   (withBoth ?? withIpa)?.text?.replace(/\//g, '') || null,
    }
  } catch {
    return { audio: null, ipa: null }
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Kiểm tra quyền admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('NguoiDung')
    .select('vai_tro')
    .eq('id', user.id)
    .single()

  if (profile?.vai_tro !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Lấy tối đa 50 từ chưa có audio mỗi lần gọi (tránh timeout)
  const { limit = 50 } = await req.json().catch(() => ({}))

  const { data: words, error } = await supabase
    .from('TuVungCache')
    .select('id, tu_tieng_anh, audio_url, phat_am_ipa')
    .is('audio_url', null)
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!words?.length) return NextResponse.json({ message: 'Tất cả từ đã có audio!', filled: 0 })

  let filled = 0
  let notFound = 0
  let skipped = 0

  for (const w of words) {
    // Bỏ qua cụm từ quá dài
    if (w.tu_tieng_anh.split(' ').length > 3) { skipped++; continue }

    const { audio, ipa } = await fetchAudio(w.tu_tieng_anh)

    if (audio) {
      const update: any = { audio_url: audio }
      if (!w.phat_am_ipa && ipa) update.phat_am_ipa = ipa

      await supabase.from('TuVungCache').update(update).eq('id', w.id)
      filled++
    } else {
      notFound++
    }

    // Delay nhỏ tránh rate limit
    await new Promise(r => setTimeout(r, 250))
  }

  const remaining = (words.length === limit)
    ? `Còn từ chưa fill — gọi lại API để tiếp tục`
    : 'Đã fill xong tất cả'

  return NextResponse.json({ filled, notFound, skipped, remaining })
}
