'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'TỔNG QUAN',  icon: '📊' },
  { href: '/vocabulary', label: 'TỪ VỰNG SRS', icon: '🃏' },
  { href: '/grammar',    label: 'NGỮ PHÁP',    icon: '📖' },
  { href: '/exam',       label: 'LUYỆN THI',   icon: '📝' },
]

const NAV_GROUPS = [
  {
    label: '4 KỸ NĂNG',
    icon: '🎧',
    children: [
      { href: '/listening', label: 'LUYỆN NGHE', icon: '🔊' },
      { href: '/writing',   label: 'LUYỆN VIẾT', icon: '✍️' },
      { href: '/speaking',  label: 'LUYỆN NÓI',  icon: '🗣️' },
      { href: '/reading',   label: 'LUYỆN ĐỌC',  icon: '📰' },
    ],
  },
  {
    label: 'KIỂM TRA',
    icon: '🎯',
    children: [
      { href: '/level-test',         label: 'KIỂM TRA ĐẦU VÀO', icon: '🎯' },
      { href: '/level-test/history', label: 'LỊCH SỬ KIỂM TRA', icon: '📋' },
    ],
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
        zIndex: 100,
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

// Props giữ nguyên để không cần sửa Sidebar.tsx
interface StudentSidebarProps {
  open: boolean
}

export default function StudentSidebar({ open }: StudentSidebarProps) {
  const pathname = usePathname()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  function isActive(href?: string, children?: DropdownItem[]) {
    if (href) return pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
    if (children) return children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))
    return false
  }

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
      <Link href="/dashboard" className="flex items-center gap-2.5 mr-6 flex-shrink-0">
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
            TBU · HỌC TIẾNG ANH CÙNG AI
          </div>
        </div>
      </Link>

      {/* Divider */}
      <div className="h-6 w-px mx-2 flex-shrink-0" style={{ background: 'rgba(201,162,39,0.25)' }} />

      {/* Nav items */}
      <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto">
        {/* Các item đơn */}
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold tracking-wide transition-all flex-shrink-0"
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
          )
        })}

        {/* Dropdown groups */}
        {NAV_GROUPS.map(group => {
          const active = isActive(undefined, group.children)
          const isOpen = openDropdown === group.label
          return (
            <div key={group.label} className="relative flex-shrink-0">
              <button
                onClick={() => setOpenDropdown(isOpen ? null : group.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold tracking-wide transition-all"
                style={{
                  color: active || isOpen ? '#f0c94a' : '#a0b0cc',
                  background: active || isOpen ? 'rgba(201,162,39,0.12)' : 'transparent',
                }}
                onMouseEnter={e => { if (!active && !isOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}}
                onMouseLeave={e => { if (!active && !isOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a0b0cc' }}}
              >
                <span>{group.icon}</span>
                {group.label}
                <svg
                  className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <DropdownMenu items={group.children} visible={isOpen} />
            </div>
          )
        })}
      </nav>
    </header>
  )
}