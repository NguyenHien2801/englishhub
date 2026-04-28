'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const NAV = [
  { href: '/admin/dashboard', icon: '📊', label: 'Tổng quan' },
  { href: '/admin/students',  icon: '👥', label: 'Sinh viên' },
  { href: '/admin/vocabulary',icon: '📚', label: 'Bộ từ vựng' },
  { href: '/admin/questions', icon: '❓', label: 'Ngân hàng đề' },
  { href: '/admin/grammar',   icon: '📖', label: 'Ngữ pháp' },
  { href: '/admin/stats',     icon: '📈', label: 'Thống kê' },
]

export default function AdminSidebar({ user }: { user: Record<string,unknown> }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    toast.success('Đã đăng xuất')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#0D0D0D] flex flex-col z-40">
      <div className="p-5 border-b border-white/10">
        <div className="font-display text-lg font-bold text-white">
          English<span className="text-[#00A878]">Hub</span>
          <span className="ml-2 text-xs px-2 py-0.5 bg-[#FF6B6B]/20 text-[#FF6B6B] rounded-full font-sans">Admin</span>
        </div>
        <div className="mt-2 text-xs text-[#707068]">{user.ho_ten as string}</div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-[#00A878] text-white' : 'text-[#A0A090] hover:bg-white/5 hover:text-white'
              }`}>
              <span className="text-sm">{item.icon}</span>{item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-0.5">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#707068] hover:bg-white/5 hover:text-white transition-all">
          <span>🎓</span> Trang sinh viên
        </Link>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#707068] hover:bg-white/5 hover:text-white transition-all">
          <span>🚪</span> Đăng xuất
        </button>
      </div>
    </aside>
  )
}
