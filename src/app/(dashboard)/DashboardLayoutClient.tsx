'use client'
import { useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/ui/Sidebar'

export default function DashboardLayoutClient({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: Record<string, unknown> | null
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isAdmin = profile?.vai_tro === 'admin'

  return (
    // bg-[#F8F5EE] = cream đồng bộ Landing page, thay cho bg-[#F0F2F8] xanh xám cũ
    <div className="flex min-h-screen bg-[#F8F5EE]">

      {/* Admin → AdminSidebar dọc | Sinh viên → StudentNavbar ngang */}
      <Sidebar open={sidebarOpen} isAdmin={isAdmin} profile={profile} />

      {/* Nội dung chính */}
      <div
        className="flex-1 flex flex-col"
        style={{
          paddingTop: isAdmin ? 0 : 58,   // tránh bị StudentNavbar che
          marginLeft: isAdmin ? 240 : 0,  // nhường chỗ cho AdminSidebar
          transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Floating AI Chat Button */}
      <Link
        href="/ai-chat"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #1a2744 0%, #1e3060 100%)', border: '2px solid #c9a227' }}
        title="AI Chatbot"
      >
        <span className="text-2xl">🤖</span>
      </Link>
    </div>
  )
}