import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import ChatbotHistoryClient from './ChatbotHistoryClient'

export default async function ChatbotHistoryPage() {
  // Dùng service-role client (giống dashboard) để admin xem được
  // lịch sử chat của TẤT CẢ sinh viên, không bị RLS giới hạn về
  // "chỉ đọc data của chính mình" (auth.uid() = nguoi_dung_id).
  const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: messages } = await adminSupabase
    .from('LichSuChatbot')
    .select('*, NguoiDung(ho_ten, ma_sinh_vien, vai_tro)')
    .order('created_at', { ascending: false })
    .limit(1000)

  return <ChatbotHistoryClient messages={messages || []} />
}