'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Tổng quan',  icon: '📊' },
  { href: '/vocabulary', label: 'Từ vựng SRS', icon: '🃏' },
  { href: '/grammar',    label: 'Ngữ pháp',    icon: '📖' },
  { href: '/exam',       label: 'Luyện thi',   icon: '📝' },
]

const NAV_GROUPS = [
  {
    label: '4 Kỹ năng',
    icon: '🎧',
    children: [
      { href: '/listening', label: 'Luyện nghe', icon: '🔊' },
      { href: '/writing',   label: 'Luyện viết', icon: '✍️' },
      { href: '/speaking',  label: 'Luyện nói',  icon: '🗣️' },
      { href: '/reading',   label: 'Luyện đọc',  icon: '📰' },
    ],
  },
  {
    label: 'Kiểm tra',
    icon: '🎯',
    children: [
      { href: '/level-test',         label: 'Kiểm tra đầu vào',  icon: '🎯' },
      { href: '/level-test/history', label: 'Lịch sử kiểm tra',  icon: '📋' },
    ],
  },
]

interface DropdownItem { href: string; label: string; icon: string }

function DropdownMenu({ items, visible }: { items: DropdownItem[]; visible: boolean }) {
  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 6px)',
      left: '50%',
      transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-6px)',
      minWidth: 200, borderRadius: 14, overflow: 'hidden',
      background: '#fff', border: '1px solid rgba(34,139,34,0.12)',
      boxShadow: '0 12px 36px rgba(0,100,0,0.12)',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)', zIndex: 100,
    }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #22a845, #5ecb6f)' }} />
      {items.map((item, i) => (
        <Link key={item.href} href={item.href} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 16px', fontSize: 13, fontWeight: 600,
          color: '#2d5a2d', textDecoration: 'none',
          borderBottom: i < items.length - 1 ? '1px solid rgba(0,100,0,0.06)' : 'none',
          transition: 'background 0.12s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,168,69,0.07)'; e.currentTarget.style.color = '#1a7a30' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2d5a2d' }}
        >
          <span style={{ fontSize: 15 }}>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </div>
  )
}

interface StudentNavbarProps {
  open?: boolean
  profile?: Record<string, unknown> | null
}

export default function StudentNavbar({ profile }: StudentNavbarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()

  const hoTen   = (profile?.ho_ten as string)         || 'Sinh viên'
  const mssv    = (profile?.ma_sinh_vien as string)    || ''
  const mucTieu = (profile?.muc_tieu_hoc as string)    || 'VSTEP'
  const streak  = (profile?.streak_hien_tai as number) || 0
  const isAdmin = profile?.vai_tro === 'admin'

  const [openNav,      setOpenNav]      = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navRef     = useRef<HTMLElement>(null)
  const userRef    = useRef<HTMLDivElement>(null)

  function isActive(href?: string, children?: DropdownItem[]) {
    if (href) return pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
    if (children) return children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))
    return false
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenNav(null)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Đã đăng xuất')
    router.push('/login')
    router.refresh()
  }

  return (
    <header ref={navRef} style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 58, display: 'flex', alignItems: 'center',
      padding: '0 12px 0 16px',
      background: 'linear-gradient(90deg, #1a7a30 0%, #228b3b 40%, #27a347 100%)',
      borderBottom: '1px solid rgba(0,0,0,0.12)',
      boxShadow: '0 2px 16px rgba(0,100,0,0.2)',
    }}>

      {/* Logo */}
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 16, flexShrink: 0, textDecoration: 'none' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: '#fff', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 11, color: '#1a7a30',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>EH</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '0.02em', lineHeight: 1.1 }}>
            ENGLISH<span style={{ color: '#ffe066' }}>HUB</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
            TBU · HỌC TIẾNG ANH CÙNG AI
          </div>
        </div>
      </Link>

      <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.2)', marginRight: 12, flexShrink: 0 }} />

      {/* Nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflowX: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 8,
              fontSize: 12, fontWeight: active ? 800 : 600,
              color: active ? '#1a7a30' : 'rgba(255,255,255,0.9)',
              background: active ? '#fff' : 'transparent',
              boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent' }}}
            >
              <span style={{ fontSize: 13 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        {NAV_GROUPS.map(group => {
          const active = isActive(undefined, group.children)
          const isOpen = openNav === group.label
          return (
            <div key={group.label} style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => setOpenNav(isOpen ? null : group.label)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 8,
                fontSize: 12, fontWeight: active || isOpen ? 800 : 600,
                color: 'rgba(255,255,255,0.9)',
                background: active || isOpen ? 'rgba(255,255,255,0.18)' : 'transparent',
                cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
                transition: 'all 0.15s', outline: 'none',
              }}
                onMouseEnter={e => { if (!active && !isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
                onMouseLeave={e => { if (!active && !isOpen) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 13 }}>{group.icon}</span>
                {group.label}
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  style={{ marginLeft: 1, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <DropdownMenu items={group.children} visible={isOpen} />
            </div>
          )
        })}
      </nav>

      {/* Right: streak + mục tiêu + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 20,
          background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <span style={{ fontSize: 12 }}>🔥</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#ffe066' }}>{streak} ngày</span>
        </div>

        <div style={{
          padding: '4px 10px', borderRadius: 20,
          background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.15)',
          fontSize: 11.5, fontWeight: 700, color: '#fff',
        }}>
          {mucTieu}
        </div>

        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.2)' }} />

        {/* User dropdown */}
        <div style={{ position: 'relative' }} ref={userRef}>
          <button onClick={() => setUserMenuOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '4px 8px', borderRadius: 10,
            background: 'transparent', border: 'none', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {hoTen.charAt(0)}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{hoTen}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace', lineHeight: 1.2 }}>{mssv}</div>
            </div>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              style={{ color: 'rgba(255,255,255,0.55)', transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {userMenuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: 210, background: '#fff', borderRadius: 16,
              border: '1px solid #e8e8e0',
              boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
              overflow: 'hidden', zIndex: 200,
            }}>
              <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #1a7a30, #27a347)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{hoTen}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{mssv}</div>
              </div>
              <div style={{ padding: 6 }}>
                {[
                  { href: '/profile', icon: '👤', label: 'Hồ sơ cá nhân' },
                  { href: '/profile/change-password', icon: '🔒', label: 'Đổi mật khẩu' },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                    fontSize: 13, color: '#0d0d0d', textDecoration: 'none',
                    transition: 'background 0.12s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f2f8')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>{item.icon}</span>{item.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link href="/admin/dashboard" onClick={() => setUserMenuOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                    fontSize: 13, color: '#0d0d0d', textDecoration: 'none',
                    transition: 'background 0.12s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f2f8')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>⚙️</span>Admin Panel
                  </Link>
                )}
              </div>
              <div style={{ padding: 6, borderTop: '1px solid #e8e8e0' }}>
                <button onClick={handleLogout} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 10,
                  fontSize: 13, color: '#ef4444',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>🚪</span>Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}