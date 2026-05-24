import { createClient } from '@/lib/supabase/server'
import VocabularyClient from '@/components/vocabulary/VocabularyClient'

export default async function VocabularyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Query 1: bộ từ
  const { data: sets } = await supabase
    .from('BoDuVung')
    .select('id, ten_bo, mo_ta, loai_bo, cap_do, chu_de, tong_so_tu')
    .eq('la_cong_khai', true)
    .order('loai_bo')
    .order('cap_do')

  // Query 2: tiến độ đến hạn ôn hôm nay
  const today = new Date().toISOString().split('T')[0]
  const { data: tienDoList } = await supabase
    .from('TienDoHocTuVung')
    .select('*')
    .eq('nguoi_dung_id', user!.id)
    .lte('ngay_on_tiep_theo', today)
    .limit(100)

  // Query 3: lấy thông tin từ vựng tương ứng
  const wordIds = (tienDoList || []).map(d => d.tu_vung_id)
  let dueWords: { TuVung: any }[] = []

  if (wordIds.length > 0) {
    const [{ data: tuVungList }, { data: cacheList }] = await Promise.all([
      supabase
        .from('TuVung')
        .select('id, tu_tieng_anh, loai_tu, cap_do, thu_tu_hien_thi')
        .in('id', wordIds),
      supabase
        .from('TuVungCache')
        .select('*')
        .in('tu_tieng_anh', (await supabase
          .from('TuVung')
          .select('tu_tieng_anh')
          .in('id', wordIds)
        ).data?.map(w => w.tu_tieng_anh) || []),
    ])

    const cacheMap = Object.fromEntries(
      (cacheList || []).map(c => [c.tu_tieng_anh, c])
    )
    const tienDoMap = Object.fromEntries(
      (tienDoList || []).map(d => [d.tu_vung_id, d])
    )

    dueWords = (tuVungList || []).map(w => ({
      TuVung: {
        ...w,
        TuVungCache: cacheMap[w.tu_tieng_anh] ?? null,
        TienDoHocTuVung: tienDoMap[w.id] ? [{
          nguoi_dung_id: tienDoMap[w.id].nguoi_dung_id,
          he_so_de_nho: tienDoMap[w.id].he_so_de_nho,
          khoang_lap_lai: tienDoMap[w.id].khoang_lap_lai,
          so_lan_lap_lai: tienDoMap[w.id].so_lan_lap_lai,
          trang_thai: tienDoMap[w.id].trang_thai,
          ngay_on_tiep_theo: tienDoMap[w.id].ngay_on_tiep_theo,
        }] : [],
      }
    }))
  }

  return (
    <VocabularyClient
      sets={sets || []}
      dueWords={dueWords}
      userId={user!.id}
    />
  )
}