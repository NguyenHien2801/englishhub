'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/ui/Sidebar'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function DashboardLayoutClient({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: Record<string, unknown> | null
}) {
  const [sidebarOpen,  setSidebarOpen]  = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router      = useRouter()
  const supabase    = createClient()

  const hoTen   = (profile?.ho_ten as string)          || 'Sinh viên'
  const mssv    = (profile?.ma_sinh_vien as string)     || ''
  const mucTieu = (profile?.muc_tieu_hoc as string)     || 'VSTEP'
  const streak  = (profile?.streak_hien_tai as number)  || 0
  const isAdmin = profile?.vai_tro === 'admin'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Đã đăng xuất')
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-[#F0F2F8]">
      <Sidebar open={sidebarOpen} isAdmin={isAdmin} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>

        {/* ── Header ngang ── */}
        <header className="sticky top-0 z-30 h-14 flex items-center px-4 gap-3 border-b border-white/60"
          style={{ background: 'linear-gradient(90deg, #1a2744 0%, #1e3060 100%)' }}>

          {/* Toggle sidebar */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#c9a227' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo (khi sidebar đóng) */}
          {!sidebarOpen && (
            <span className="font-display font-bold text-white">
              English<span style={{ color: '#c9a227' }}>Hub</span>
            </span>
          )}

          <div className="flex-1" />

          {/* Streak badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)' }}>
            <span className="text-sm">🔥</span>
            <span className="text-xs font-semibold" style={{ color: '#f0c94a' }}>{streak} ngày</span>
          </div>

          {/* Mục tiêu badge */}
          <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <span className="text-xs font-semibold text-white">{mucTieu}</span>
          </div>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors"
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #c9a227 0%, #f0c94a 100%)', color: '#1a2744' }}>
                {hoTen.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-white leading-tight">{hoTen}</div>
                <div className="text-xs font-mono leading-tight" style={{ color: '#8899bb' }}>{mssv}</div>
              </div>
              <svg className={`w-4 h-4 transition-transform text-white/50 ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-[#E8E8E0] shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#E8E8E0]"
                  style={{ background: 'linear-gradient(135deg, #1a2744 0%, #1e3060 100%)' }}>
                  <div className="text-sm font-semibold text-white">{hoTen}</div>
                  <div className="text-xs font-mono" style={{ color: '#8899bb' }}>{mssv}</div>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <Link href="/profile" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#0D0D0D] hover:bg-[#F0F2F8] transition-colors">
                    <span>👤</span> Hồ sơ cá nhân
                  </Link>
                  <Link href="/profile/change-password" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#0D0D0D] hover:bg-[#F0F2F8] transition-colors">
                    <span>🔒</span> Đổi mật khẩu
                  </Link>
                  {isAdmin && (
                    <Link href="/admin/dashboard" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#0D0D0D] hover:bg-[#F0F2F8] transition-colors">
                      <span>⚙️</span> Admin Panel
                    </Link>
                  )}
                </div>

                <div className="p-1.5 border-t border-[#E8E8E0]">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <span>🚪</span> Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

      {/* ── Floating AI Chat Button ── */}
      <Link href="/ai-chat"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #1a2744 0%, #1e3060 100%)', border: '2px solid #c9a227' }}
        title="AI Chatbot"
      >
        <span className="text-2xl">🤖</span>
      </Link>
    </div>
  )
}