import { createClient } from '@/lib/supabase/server'
import ChatbotHistoryClient from './ChatbotHistoryClient'

export default async function ChatbotHistoryPage() {
  const supabase = createClient()
  // Lấy danh sách phiên chat (nhóm theo phien_id)
  const { data: messages } = await supabase
    .from('LichSuChatbot')
    .select('*, NguoiDung(ho_ten, ma_sinh_vien)')
    .order('created_at', { ascending: false })
    .limit(1000)
  return <ChatbotHistoryClient messages={messages || []} />
}
