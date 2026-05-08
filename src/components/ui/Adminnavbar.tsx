'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

const ADMIN_NAV = [
  {
    label: 'TỔNG QUAN',
    href: '/admin/dashboard',
    icon: '📊',
  },
  {
    label: 'NGƯỜI DÙNG',
    icon: '👥',
    children: [
      { href: '/admin/users',         label: 'Danh sách học viên', icon: '🎓' },
      { href: '/admin/users/roles',   label: 'Phân quyền',         icon: '🔑' },
    ],
  },
  {
    label: 'NỘI DUNG',
    icon: '📚',
    children: [
      { href: '/admin/vocabulary', label: 'Quản lý từ vựng', icon: '🃏' },
      { href: '/admin/grammar',    label: 'Quản lý ngữ pháp', icon: '📖' },
      { href: '/admin/lessons',    label: 'Bài học',          icon: '📝' },
    ],
  },
  {
    label: 'THI & KIỂM TRA',
    icon: '🎯',
    children: [
      { href: '/admin/exams',          label: 'Đề thi',             icon: '📋' },
      { href: '/admin/level-test',     label: 'Kiểm tra đầu vào',   icon: '🏆' },
      { href: '/admin/results',        label: 'Kết quả học viên',   icon: '📈' },
    ],
  },
  {
    label: 'BÁO CÁO',
    icon: '📈',
    children: [
      { href: '/admin/reports/usage',    label: 'Thống kê sử dụng', icon: '📉' },
      { href: '/admin/reports/progress', label: 'Tiến độ học',      icon: '🗂️' },
    ],
  },
  {
    label: 'CÀI ĐẶT',
    href: '/admin/settings',
    icon: '⚙️',
  },
]

interface DropdownItem {
  href: string
  label: string
  icon: string
}

function DropdownMenu({ items, visible }: { items: DropdownItem[]; visible: boolean }) {
  return (
    <div
      className="absolute top-full left-0 mt-1 min-w-[200px] rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: 'linear-gradient(180deg, #0f1c3a 0%, #162040 100%)',
        border: '1px solid rgba(201,162,39,0.25)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transform: visible ? 'translateY(0)' : 'translateY(-6px)',
      }}
    >
      {items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold tracking-wide transition-all"
          style={{ color: '#a0b0cc' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,162,39,0.1)'; e.currentTarget.style.color = '#f0c94a' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a0b0cc' }}
        >
          <span className="text-sm">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </div>
  )
}

interface AdminNavbarProps {
  /** optional: toggle mobile drawer if needed */
  onMenuClick?: () => void
}

export default function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
  const pathname = usePathname()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  function isActive(href?: string, children?: DropdownItem[]) {
    if (href) return pathname === href || pathname.startsWith(href + '/')
    if (children) return children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))
    return false
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 flex items-center px-4 h-14"
      style={{
        background: 'linear-gradient(90deg, #0f1c3a 0%, #162040 60%, #1a2550 100%)',
        borderBottom: '1px solid rgba(201,162,39,0.25)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Logo */}
      <Link href="/admin/dashboard" className="flex items-center gap-2.5 mr-6 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow"
          style={{ background: 'linear-gradient(135deg, #c9a227, #f0c94a)', color: '#0f1c3a' }}
        >
          EH
        </div>
        <div>
          <div className="text-sm font-black tracking-wide text-white leading-none">
            ENGLISH<span style={{ color: '#c9a227' }}>HUB</span>
          </div>
          <div className="text-[9px] font-semibold tracking-widest" style={{ color: '#5a6f9a' }}>
            ADMIN PANEL
          </div>
        </div>
      </Link>

      {/* Divider */}
      <div className="h-6 w-px mx-2 flex-shrink-0" style={{ background: 'rgba(201,162,39,0.25)' }} />

      {/* Nav items */}
      <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
        {ADMIN_NAV.map(item => {
          const active = isActive(item.href, item.children as DropdownItem[] | undefined)
          const hasChildren = !!item.children
          const isOpen = openDropdown === item.label

          return (
            <div key={item.label} className="relative flex-shrink-0">
              {item.href && !hasChildren ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold tracking-wide transition-all"
                  style={{
                    color: active ? '#0f1c3a' : '#a0b0cc',
                    background: active
                      ? 'linear-gradient(135deg, #c9a227, #f0c94a)'
                      : 'transparent',
                    boxShadow: active ? '0 2px 10px rgba(201,162,39,0.4)' : 'none',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a0b0cc' }}}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ) : (
                <button
                  onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold tracking-wide transition-all"
                  style={{
                    color: active || isOpen ? '#f0c94a' : '#a0b0cc',
                    background: active || isOpen ? 'rgba(201,162,39,0.12)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!active && !isOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}}
                  onMouseLeave={e => { if (!active && !isOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a0b0cc' }}}
                >
                  <span>{item.icon}</span>
                  {item.label}
                  <svg
                    className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}

              {/* Dropdown */}
              {hasChildren && (
                <DropdownMenu
                  items={item.children as DropdownItem[]}
                  visible={isOpen}
                />
              )}
            </div>
          )
        })}
      </nav>

      {/* Right side: badge + back to student view */}
      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest"
          style={{ background: 'rgba(201,162,39,0.15)', color: '#c9a227', border: '1px solid rgba(201,162,39,0.3)' }}
        >
          ADMIN
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all"
          style={{ color: '#5a6f9a', border: '1px solid rgba(90,111,154,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#a0b0cc'; e.currentTarget.style.borderColor = 'rgba(160,176,204,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#5a6f9a'; e.currentTarget.style.borderColor = 'rgba(90,111,154,0.3)' }}
          title="Về giao diện học viên"
        >
          ← Học viên
        </Link>
      </div>
    </header>
  )
}