// app/api/writing-tasks/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('bailuyenviet')
    .select('id, chung_chi, cap_do, tieu_de, bieu_tuong, de_bai, so_tu_toi_thieu, so_tu_toi_da, thong_tin_ky_thi, rubric_json, goi_y_json')
    .eq('dang_hoat_dong', true)
    .order('thu_tu')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}