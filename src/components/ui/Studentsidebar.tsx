'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_GROUPS = [
  {
    items: [
      { href: '/dashboard',  label: 'TỔNG QUAN',   icon: '📊' },
      { href: '/vocabulary', label: 'TỪ VỰNG SRS',  icon: '🃏' },
      { href: '/grammar',    label: 'NGỮ PHÁP',     icon: '📖' },
      { href: '/exam',       label: 'LUYỆN THI',    icon: '📝' },
    ]
  },
  {
    group: '4 KỸ NĂNG',
    items: [
      { href: '/listening', label: 'LUYỆN NGHE', icon: '🔊' },
      { href: '/writing',   label: 'LUYỆN VIẾT', icon: '✍️' },
      { href: '/speaking',  label: 'LUYỆN NÓI',  icon: '🗣️' },
      { href: '/reading',   label: 'LUYỆN ĐỌC',  icon: '📰' },
    ]
  },
  {
    group: 'KIỂM TRA TRÌNH ĐỘ',
    items: [
      { href: '/level-test', label: 'KIỂM TRA ĐẦU VÀO', icon: '🎯' },
      { href: '/level-test/history', label: 'LỊCH SỬ KIỂM TRA', icon: '📋' },
    ]
  },
]

interface StudentSidebarProps {
  open: boolean
}

export default function StudentSidebar({ open }: StudentSidebarProps) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>(['4 KỸ NĂNG', 'KIỂM TRA TRÌNH ĐỘ'])

  function toggleGroup(group: string) {
    setOpenGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    )
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 flex flex-col z-40 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ background: 'linear-gradient(180deg, #0f1c3a 0%, #162040 60%, #1a2550 100%)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(201,162,39,0.25)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg, #c9a227, #f0c94a)', color: '#0f1c3a' }}>
            EH
          </div>
          <div>
            <div className="text-base font-black tracking-wide text-white">
              ENGLISH<span style={{ color: '#c9a227' }}>HUB</span>
            </div>
            <div className="text-[10px] font-medium tracking-widest uppercase" style={{ color: '#5a6f9a' }}>
              TBU · Học tiếng Anh cùng AI
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-2' : ''}>
            {group.group && (
              <>
                <div className="mx-3 mb-2" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(201,162,39,0.4) 0%, transparent 100%)' }} />
                <button
                  onClick={() => toggleGroup(group.group!)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 transition-all"
                  style={{ color: '#c9a227' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,162,39,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span className="text-xs font-black tracking-[0.12em] flex-1 text-left" style={{ color: '#c9a227' }}>
                    {group.group}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${openGroups.includes(group.group) ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </>
            )}
            {(!group.group || openGroups.includes(group.group)) && (
              <div className={group.group ? 'pl-1' : ''}>
                {group.items.map(item => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold tracking-wide transition-all mb-0.5"
                      style={{
                        color:      active ? '#0f1c3a' : '#a0b0cc',
                        background: active
                          ? 'linear-gradient(135deg, #c9a227 0%, #f0c94a 100%)'
                          : 'transparent',
                        boxShadow:  active ? '0 4px 12px rgba(201,162,39,0.35)' : 'none',
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#ffffff' }}}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a0b0cc' }}}
                    >
                      <span className="w-6 text-center text-sm">{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Version */}
      <div className="px-3 pb-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(201,162,39,0.2)' }}>
        <div className="mt-3 px-3 text-[10px] font-medium tracking-widest" style={{ color: '#3a4f70' }}>
          ENGLISHHUB v3.0 · TBU 2024
        </div>
      </div>
    </aside>
  )
}