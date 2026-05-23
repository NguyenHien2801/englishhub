'use client'
import { useState } from 'react'
import Sidebar from '@/components/ui/Sidebar'
import AIFloatingChat from '@/components/AIFloatingChat'

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
    <div className="flex min-h-screen" style={{ background: '#F8F5EE' }}>

      <Sidebar open={sidebarOpen} profile={profile} />

      <div
        className="flex-1 flex flex-col"
        style={{
          paddingTop: isAdmin ? 0 : 58,
          marginLeft: isAdmin ? 240 : 0,
          transition: 'margin-left 0.28s cubic-bezier(.16,1,.3,1)',
        }}
      >
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Floating AI Chat — panel mở ngay tại chỗ, không cần thoát trang */}
      <AIFloatingChat />

    </div>
  )
}