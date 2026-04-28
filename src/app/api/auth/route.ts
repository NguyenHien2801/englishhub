import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Update streak on login
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('NguoiDung').select('*').eq('id', user.id).single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]
  const lastStudy = profile.ngay_hoc_cuoi
  let newStreak = profile.streak_hien_tai || 0

  if (lastStudy) {
    const last = new Date(lastStudy)
    const now = new Date(today)
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) newStreak += 1
    else if (diffDays > 1) newStreak = 1
    // same day: keep streak
  } else {
    newStreak = 1
  }

  const newHighStreak = Math.max(newStreak, profile.streak_cao_nhat || 0)

  await supabase.from('NguoiDung').update({
    streak_hien_tai: newStreak,
    streak_cao_nhat: newHighStreak,
    ngay_hoc_cuoi: today,
  }).eq('id', user.id)

  return NextResponse.json({ streak: newStreak })
}
