'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const ADMIN_NAV = [
  {
    label: 'Tổng quan',
    href: '/admin/dashboard',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: 'Người dùng',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
        <path d="M21 21v-2a4 4 0 00-3-3.85"/>
      </svg>
    ),
    children: [
      { href: '/admin/users',       label: 'Danh sách học viên' },
      { href: '/admin/users/roles', label: 'Phân quyền' },
    ],
  },
  {
    label: 'Nội dung',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
      </svg>
    ),
    children: [
      { href: '/admin/vocabulary', label: 'Quản lý từ vựng' },
      { href: '/admin/grammar',    label: 'Quản lý ngữ pháp' },
      { href: '/admin/lessons',    label: 'Bài học' },
    ],
  },
  {
    label: 'Thi & Kiểm tra',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
    children: [
      { href: '/admin/exams',      label: 'Đề thi' },
      { href: '/admin/level-test', label: 'Kiểm tra đầu vào' },
      { href: '/admin/results',    label: 'Kết quả học viên' },
    ],
  },
  {
    label: 'Báo cáo',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16"/>
      </svg>
    ),
    children: [
      { href: '/admin/reports/usage',    label: 'Thống kê sử dụng' },
      { href: '/admin/reports/progress', label: 'Tiến độ học' },
    ],
  },
  {
    label: 'Cài đặt',
    href: '/admin/settings',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
]

interface ChildItem { href: string; label: string }

interface AdminSidebarProps {
  collapsed?: boolean
}

export default function AdminSidebar({ collapsed = false }: AdminSidebarProps) {
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(collapsed)

  // Auto-open group that contains current path
  useEffect(() => {
    for (const item of ADMIN_NAV) {
      if (item.children?.some(c => pathname.startsWith(c.href))) {
        setOpenGroup(item.label)
        break
      }
    }
  }, [pathname])

  function isActive(href?: string, children?: ChildItem[]) {
    if (href) return pathname === href || pathname.startsWith(href + '/')
    if (children) return children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))
    return false
  }

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        width: isCollapsed ? 64 : 240,
        background: 'linear-gradient(180deg, #0d1527 0%, #111e38 50%, #0d1a30 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.35)',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: isCollapsed ? '20px 14px' : '20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          minHeight: 68,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 13,
            color: '#fff',
            flexShrink: 0,
            letterSpacing: '-0.5px',
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          }}
        >
          EH
        </div>
        {!isCollapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '0.02em', lineHeight: 1.1 }}>
              ENGLISH<span style={{ color: '#6366f1' }}>HUB</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: '#3f5080', marginTop: 2 }}>
              ADMIN PANEL
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(v => !v)}
        style={{
          position: 'absolute',
          top: 20,
          right: isCollapsed ? -14 : -14,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#1e2d4a',
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7ea8',
          transition: 'all 0.2s',
          zIndex: 10,
          flexShrink: 0,
        }}
        title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
      >
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.25s' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 0' }}>
        {/* Label section */}
        {!isCollapsed && (
          <div style={{ padding: '4px 20px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#2d3d5c', textTransform: 'uppercase' }}>
            Menu
          </div>
        )}

        {ADMIN_NAV.map(item => {
          const active = isActive(item.href, item.children as ChildItem[] | undefined)
          const isOpen = openGroup === item.label
          const hasChildren = !!item.children

          return (
            <div key={item.label}>
              {/* Main item */}
              {item.href && !hasChildren ? (
                <Link
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: isCollapsed ? '10px 20px' : '10px 20px',
                    margin: '2px 10px',
                    borderRadius: 10,
                    color: active ? '#fff' : '#6b7ea8',
                    background: active
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(59,130,246,0.18))'
                      : 'transparent',
                    borderLeft: active ? '2px solid #6366f1' : '2px solid transparent',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    letterSpacing: '0.01em',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#a8b8d8' }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7ea8' }}}
                >
                  <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => !isCollapsed && setOpenGroup(isOpen ? null : item.label)}
                    title={isCollapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 20px',
                      margin: '2px 10px',
                      borderRadius: 10,
                      width: 'calc(100% - 20px)',
                      color: active || isOpen ? '#a8c0e8' : '#6b7ea8',
                      background: active || isOpen ? 'rgba(99,102,241,0.08)' : 'transparent',
                      borderLeft: active ? '2px solid rgba(99,102,241,0.5)' : '2px solid transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      letterSpacing: '0.01em',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={e => { if (!active && !isOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#a8b8d8' }}}
                    onMouseLeave={e => { if (!active && !isOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7ea8' }}}
                  >
                    <span style={{ flexShrink: 0, opacity: active || isOpen ? 1 : 0.7 }}>{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        <svg
                          width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                          style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                      </>
                    )}
                  </button>

                  {/* Children */}
                  {!isCollapsed && isOpen && item.children && (
                    <div style={{ marginBottom: 4 }}>
                      {item.children.map(child => {
                        const childActive = pathname === child.href || pathname.startsWith(child.href + '/')
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '8px 20px 8px 50px',
                              margin: '1px 10px',
                              borderRadius: 8,
                              color: childActive ? '#93c5fd' : '#4a5f80',
                              background: childActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                              textDecoration: 'none',
                              fontSize: 12.5,
                              fontWeight: childActive ? 700 : 400,
                              letterSpacing: '0.01em',
                              transition: 'all 0.15s',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => { if (!childActive) { e.currentTarget.style.color = '#7da4cc'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}}
                            onMouseLeave={e => { if (!childActive) { e.currentTarget.style.color = '#4a5f80'; e.currentTarget.style.background = 'transparent' }}}
                          >
                            <span style={{
                              width: 5, height: 5, borderRadius: '50%',
                              background: childActive ? '#6366f1' : '#2d3d5c',
                              flexShrink: 0, transition: 'background 0.15s',
                            }}/>
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: isCollapsed ? '14px 14px' : '14px 16px', flexShrink: 0 }}>
        <Link
          href="/dashboard"
          title={isCollapsed ? 'Về giao diện học viên' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 10,
            color: '#3f5080',
            textDecoration: 'none',
            fontSize: 12,
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.06)',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#7da4cc'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#3f5080'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          {!isCollapsed && <span>Về giao diện học viên</span>}
        </Link>
      </div>
    </aside>
  )
}