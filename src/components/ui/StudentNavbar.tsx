'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Layers, BookOpen, ClipboardList,
  Headphones, PenLine, Mic, Newspaper,
  Target, History,
  ChevronDown, Menu, X,
  User, Lock, Settings, LogOut,
  Flame, Trophy,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────
interface NavChild  { href: string; label: string; icon: LucideIcon }
interface NavItem   { href: string; label: string; icon: LucideIcon }
interface NavGroup  { label: string; icon: LucideIcon; children: NavChild[] }

// ── Data ───────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',  label: 'Tổng quan',   icon: LayoutDashboard },
  { href: '/vocabulary', label: 'Từ vựng SRS',  icon: Layers },
  { href: '/grammar',    label: 'Ngữ pháp',     icon: BookOpen },
  { href: '/exam',       label: 'Luyện thi',    icon: ClipboardList },
]

const NAV_GROUPS: NavGroup[] = [
  {
    label: '4 Kỹ năng',
    icon: Headphones,
    children: [
      { href: '/listening', label: 'Luyện nghe', icon: Headphones },
      { href: '/writing',   label: 'Luyện viết', icon: PenLine },
      { href: '/speaking',  label: 'Luyện nói',  icon: Mic },
      { href: '/reading',   label: 'Luyện đọc',  icon: Newspaper },
    ],
  },
  {
    label: 'Kiểm tra',
    icon: Target,
    children: [
      { href: '/level-test',         label: 'Kiểm tra đầu vào', icon: Target },
      { href: '/level-test/history', label: 'Lịch sử kiểm tra', icon: History },
    ],
  },
]

// ── CSS ────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');

.eh-navbar{position:fixed;top:0;left:0;right:0;z-index:9000;height:64px;display:flex;align-items:center;padding:0 16px;background:#0F1C35;border-bottom:1px solid rgba(201,168,76,0.18);box-shadow:0 2px 20px rgba(15,28,53,0.4);font-family:'DM Sans',sans-serif;overflow:visible;}

.eh-nav-link{position:relative;display:inline-flex;align-items:center;gap:7px;padding:0 13px;height:64px;font-size:15px;font-weight:500;font-family:'DM Sans',sans-serif;text-decoration:none;white-space:nowrap;flex-shrink:0;transition:color 0.18s;color:rgba(255,255,255,0.88);letter-spacing:0;}
.eh-nav-link::after{content:'';position:absolute;bottom:0;left:11px;right:11px;height:2.5px;background:linear-gradient(90deg,#C9A84C,#E8C97A);transform:scaleX(0);transition:transform 0.22s cubic-bezier(0.16,1,0.3,1);border-radius:2px 2px 0 0;}
.eh-nav-link:hover{color:#C9A84C;}
.eh-nav-link:hover::after{transform:scaleX(1);}
.eh-nav-link.active{color:#C9A84C!important;}
.eh-nav-link.active::after{transform:scaleX(1);}

.eh-nav-btn{position:relative;display:inline-flex;align-items:center;gap:7px;padding:0 13px;height:64px;font-size:15px;font-weight:500;font-family:'DM Sans',sans-serif;white-space:nowrap;flex-shrink:0;background:none;border:none;cursor:pointer;outline:none;transition:color 0.18s;color:rgba(255,255,255,0.88);letter-spacing:0;}
.eh-nav-btn::after{content:'';position:absolute;bottom:0;left:11px;right:11px;height:2.5px;background:linear-gradient(90deg,#C9A84C,#E8C97A);transform:scaleX(0);transition:transform 0.22s cubic-bezier(0.16,1,0.3,1);border-radius:2px 2px 0 0;}
.eh-nav-btn:hover{color:#C9A84C;}
.eh-nav-btn:hover::after{transform:scaleX(1);}
.eh-nav-btn.active{color:#C9A84C!important;}
.eh-nav-btn.active::after{transform:scaleX(1);}

.eh-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:50px;font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;white-space:nowrap;flex-shrink:0;letter-spacing:0;}

.eh-user-menu-item{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:10px;font-size:15px;font-family:'DM Sans',sans-serif;color:#0F1C35;text-decoration:none;transition:all 0.15s;font-weight:400;}
.eh-user-menu-item:hover{background:rgba(201,168,76,0.1);color:#8B6914;}

.eh-chevron{transition:transform 0.2s;flex-shrink:0;}
.eh-chevron.open{transform:rotate(180deg);}

.eh-hamburger{display:none;align-items:center;justify-content:center;width:40px;height:40px;background:none;border:1px solid rgba(255,255,255,0.15);cursor:pointer;padding:0;border-radius:9px;transition:all 0.18s;flex-shrink:0;color:#fff;}
.eh-hamburger:hover{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.25);}

.eh-desktop-nav{display:flex;align-items:center;flex:1;overflow:visible;}

.eh-mobile-menu{position:fixed;top:64px;left:0;right:0;background:#0F1C35;border-bottom:1px solid rgba(201,168,76,0.18);box-shadow:0 8px 32px rgba(15,28,53,0.5);z-index:8999;max-height:0;overflow:hidden;transition:max-height 0.35s cubic-bezier(0.16,1,0.3,1),opacity 0.25s;opacity:0;}
.eh-mobile-menu.open{max-height:90vh;overflow-y:auto;opacity:1;}

.eh-mobile-link{display:flex;align-items:center;gap:12px;padding:13px 20px;font-size:15px;font-weight:500;font-family:'DM Sans',sans-serif;color:rgba(255,255,255,0.82);text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.05);transition:background 0.15s,color 0.15s;}
.eh-mobile-link:hover,.eh-mobile-link.active{background:rgba(201,168,76,0.08);color:#C9A84C;}

.eh-mobile-group-btn{display:flex;align-items:center;justify-content:space-between;width:100%;padding:13px 20px;font-size:15px;font-weight:500;font-family:'DM Sans',sans-serif;color:rgba(255,255,255,0.82);background:none;border:none;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);transition:background 0.15s,color 0.15s;}
.eh-mobile-group-btn:hover,.eh-mobile-group-btn.active{background:rgba(201,168,76,0.08);color:#C9A84C;}

.eh-mobile-children{background:rgba(0,0,0,0.18);}
.eh-mobile-child-link{display:flex;align-items:center;gap:12px;padding:11px 20px 11px 44px;font-size:14px;font-weight:400;font-family:'DM Sans',sans-serif;color:rgba(255,255,255,0.62);text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.15s,color 0.15s;}
.eh-mobile-child-link:hover,.eh-mobile-child-link.active{background:rgba(201,168,76,0.08);color:#C9A84C;}

.eh-mobile-footer{padding:16px 20px;border-top:1px solid rgba(201,168,76,0.15);display:flex;align-items:center;justify-content:space-between;gap:12px;}

@media(max-width:1024px){
  .eh-nav-link,.eh-nav-btn{font-size:14px;padding:0 10px;}
  .eh-pill{font-size:12px;padding:3px 10px;}
}

@media(max-width:767px){
  .eh-navbar{height:60px;}
  .eh-desktop-nav{display:none;}
  .eh-hamburger{display:flex;}
  .eh-right-desktop{display:none!important;}
  .eh-mobile-menu{top:60px;}
  .eh-mobile-topright{display:flex!important;}
}

@media(min-width:768px){
  .eh-mobile-topright{display:none!important;}
}
`
// ── DesktopDropdown ────────────────────────────────────
function DesktopDropdown({ items, visible }: { items: NavChild[]; visible: boolean }) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
      transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)',
      minWidth: 210, borderRadius: 16, overflow: 'hidden',
      background: '#fff', border: '1px solid rgba(201,168,76,0.2)',
      boxShadow: '0 18px 56px rgba(15,28,53,0.18)',
      opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none',
      transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)', zIndex: 9999,
    }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg,#C9A84C,#E8C97A,#C9A84C)' }} />
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 18px', fontSize: 15, fontWeight: 400,
            fontFamily: "'DM Sans',sans-serif", color: '#0F1C35', textDecoration: 'none',
            borderBottom: i < items.length - 1 ? '1px solid rgba(201,168,76,0.1)' : 'none',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; e.currentTarget.style.color = '#8B6914'; e.currentTarget.style.paddingLeft = '22px' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F1C35'; e.currentTarget.style.paddingLeft = '18px' }}
          >
            <Icon size={15} strokeWidth={2} />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

// ── Props ──────────────────────────────────────────────
interface StudentNavbarProps {
  open?: boolean
  profile?: Record<string, unknown> | null
}

// ── Component ──────────────────────────────────────────
export default function StudentNavbar({ profile }: StudentNavbarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const hoTen   = (profile?.ho_ten as string)         || 'Sinh viên'
  const mssv    = (profile?.ma_sinh_vien as string)    || ''
  const mucTieu = (profile?.muc_tieu_hoc as string)    || 'VSTEP'
  const streak  = (profile?.streak_hien_tai as number) || 0
  const isAdmin = profile?.vai_tro === 'admin'

  const [openNav,        setOpenNav]        = useState<string | null>(null)
  const [userMenuOpen,   setUserMenuOpen]   = useState(false)
  const [mobileOpen,     setMobileOpen]     = useState(false)
  const [mobileGroup,    setMobileGroup]    = useState<string | null>(null)
  const [mobileUserOpen, setMobileUserOpen] = useState(false)

  const navRef  = useRef<HTMLElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = 'eh-navbar-styles'
    if (document.getElementById(id)) return
    const el = document.createElement('style')
    el.id = id; el.textContent = CSS
    document.head.appendChild(el)
    return () => { document.getElementById(id)?.remove() }
  }, [])

  useEffect(() => { setMobileOpen(false); setOpenNav(null) }, [pathname])

  function isActive(href?: string, children?: NavChild[]) {
    if (href)     return pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
    if (children) return children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))
    return false
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current  && !navRef.current.contains(e.target as Node))  setOpenNav(null)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Đã đăng xuất')
    router.push('/login')
    router.refresh()
  }

  const userMenuLinks = [
    { href: '/profile',                 Icon: User, label: 'Hồ sơ cá nhân' },
    { href: '/profile/change-password', Icon: Lock, label: 'Đổi mật khẩu'  },
  ] as const

  return (
    <>
      <header ref={navRef} className="eh-navbar">

        {/* ── Logo ── */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', marginRight: 12, flexShrink: 0, textDecoration: 'none' }}>
          <div style={{
            background: '#fff', borderRadius: 9, padding: '4px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 3px 14px rgba(15,28,53,0.35), 0 0 0 1px rgba(201,168,76,0.25)', height: 50,
          }}>
            <img src="/assets/Logo.png" alt="EnglishHub"
              style={{ height: 42, width: 'auto', objectFit: 'contain', display: 'block' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        </Link>

        <div style={{ width: 1, height: 26, background: 'rgba(201,168,76,0.2)', marginRight: 6, flexShrink: 0 }} />

        {/* ── Desktop nav ── */}
        <nav className="eh-desktop-nav">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`eh-nav-link${isActive(href) ? ' active' : ''}`}>
              <Icon size={15} strokeWidth={2} />{label}
            </Link>
          ))}

          {NAV_GROUPS.map(({ label, icon: Icon, children }) => {
            const active = isActive(undefined, children)
            const isOpen = openNav === label
            return (
              <div key={label} style={{ position: 'relative', flexShrink: 0 }}>
                <button className={`eh-nav-btn${active || isOpen ? ' active' : ''}`}
                  onClick={() => setOpenNav(isOpen ? null : label)}>
                  <Icon size={15} strokeWidth={2} />
                  {label}
                  <ChevronDown size={13} strokeWidth={2.5}
                    className={`eh-chevron${isOpen ? ' open' : ''}`}
                    style={{ marginLeft: 1 }} />
                </button>
                <DesktopDropdown items={children} visible={isOpen} />
              </div>
            )
          })}
        </nav>

        {/* ── Desktop right ── */}
        <div className="eh-right-desktop"
          style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>

          <div className="eh-pill" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C' }}>
            <Flame size={13} strokeWidth={2} /><span>{streak} ngày</span>
          </div>
          <div className="eh-pill" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
            <Trophy size={12} strokeWidth={2} /><span>{mucTieu}</span>
          </div>

          <div style={{ width: 1, height: 22, background: 'rgba(201,168,76,0.2)', flexShrink: 0 }} />

          {/* Desktop user button */}
          <div style={{ position: 'relative' }} ref={userRef}>
            <button onClick={() => setUserMenuOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 10,
              background: userMenuOpen ? 'rgba(201,168,76,0.1)' : 'transparent',
              border: userMenuOpen ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.18s',
            }}
              onMouseEnter={e => { if (!userMenuOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' } }}
              onMouseLeave={e => { if (!userMenuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' } }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 9, background: '#fff',
                border: '2px solid rgba(201,168,76,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 800,
                color: '#0F1C35', flexShrink: 0,
              }}>{hoTen.charAt(0)}</div>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.88)', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif" }}>
                {hoTen}
              </span>
              <ChevronDown size={13} strokeWidth={2.5}
                className={`eh-chevron${userMenuOpen ? ' open' : ''}`}
                style={{ color: 'rgba(201,168,76,0.7)' }} />
            </button>

            {/* Desktop user dropdown */}
            {userMenuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                width: 220, background: '#fff', borderRadius: 18,
                border: '1px solid rgba(201,168,76,0.2)',
                boxShadow: '0 18px 56px rgba(15,28,53,0.2)',
                overflow: 'hidden', zIndex: 9999,
              }}>
                <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,#0F1C35 0%,#1E2F50 100%)', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{hoTen}</div>
                  <div style={{ fontSize: 11, color: 'rgba(201,168,76,0.6)', fontFamily: 'monospace' }}>{mssv || mucTieu}</div>
                </div>
                <div style={{ padding: '8px 8px 4px' }}>
                  {userMenuLinks.map(({ href, Icon, label }) => (
                    <Link key={href} href={href} className="eh-user-menu-item" onClick={() => setUserMenuOpen(false)}>
                      <Icon size={15} strokeWidth={2} />{label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link href="/admin/dashboard" className="eh-user-menu-item"
                      onClick={() => setUserMenuOpen(false)}
                      style={{ color: '#8B6914', fontWeight: 600 }}>
                      <Settings size={15} strokeWidth={2} />Admin Panel
                    </Link>
                  )}
                </div>
                <div style={{ borderTop: '1px solid rgba(201,168,76,0.15)', padding: '4px 8px 8px' }}>
                  <button onClick={handleLogout} className="eh-user-menu-item"
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#C0392B', fontWeight: 600, textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={15} strokeWidth={2} />Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile top-right: streak + hamburger ── */}
        <div className="eh-mobile-topright"
          style={{ alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
          <div className="eh-pill" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C' }}>
            <Flame size={12} strokeWidth={2} /><span>{streak}</span>
          </div>
          <button className="eh-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
            {mobileOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>

      </header>

      {/* ── Mobile dropdown menu ── */}
      <div className={`eh-mobile-menu${mobileOpen ? ' open' : ''}`}>

        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={`eh-mobile-link${isActive(href) ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}>
            <Icon size={17} strokeWidth={2} />{label}
          </Link>
        ))}

        {NAV_GROUPS.map(({ label, icon: GroupIcon, children }) => {
          const active = isActive(undefined, children)
          const isOpen = mobileGroup === label
          return (
            <div key={label}>
              <button className={`eh-mobile-group-btn${active ? ' active' : ''}`}
                onClick={() => setMobileGroup(isOpen ? null : label)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <GroupIcon size={17} strokeWidth={2} />{label}
                </span>
                <ChevronDown size={15} strokeWidth={2.5} className={`eh-chevron${isOpen ? ' open' : ''}`} />
              </button>
              {isOpen && (
                <div className="eh-mobile-children">
                  {children.map(({ href, label: childLabel, icon: ChildIcon }) => (
                    <Link key={href} href={href}
                      className={`eh-mobile-child-link${isActive(href) ? ' active' : ''}`}
                      onClick={() => setMobileOpen(false)}>
                      <ChildIcon size={15} strokeWidth={2} />{childLabel}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Mobile footer: user info */}
        <div className="eh-mobile-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: '#fff',
              border: '2px solid rgba(201,168,76,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 800,
              color: '#0F1C35', flexShrink: 0,
            }}>{hoTen.charAt(0)}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#fff', fontFamily: "'DM Sans',sans-serif" }}>{hoTen}</div>
              <div style={{ fontSize: 11, color: 'rgba(201,168,76,0.7)', fontFamily: 'monospace' }}>{mssv || mucTieu}</div>
            </div>
          </div>
          <button onClick={() => setMobileUserOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 600,
            fontFamily: "'DM Sans',sans-serif", cursor: 'pointer',
          }}>
            <User size={13} strokeWidth={2} />
            Tài khoản
            <ChevronDown size={12} strokeWidth={2.5} className={`eh-chevron${mobileUserOpen ? ' open' : ''}`} />
          </button>
        </div>

        {/* Mobile user sub-menu */}
        {mobileUserOpen && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
            {userMenuLinks.map(({ href, Icon, label }) => (
              <Link key={href} href={href} className="eh-mobile-child-link" onClick={() => setMobileOpen(false)}>
                <Icon size={15} strokeWidth={2} />{label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin/dashboard" className="eh-mobile-child-link"
                onClick={() => setMobileOpen(false)} style={{ color: '#C9A84C' }}>
                <Settings size={15} strokeWidth={2} />Admin Panel
              </Link>
            )}
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 20px 11px 44px', width: '100%',
              fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans',sans-serif",
              color: '#E74C3C', background: 'none', border: 'none', cursor: 'pointer',
              borderTop: '1px solid rgba(255,255,255,0.04)',
            }}>
              <LogOut size={15} strokeWidth={2} />Đăng xuất
            </button>
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>

      {/* ── Overlay ── */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, top: 60,
          background: 'rgba(0,0,0,0.45)', zIndex: 8998,
          backdropFilter: 'blur(3px)',
        }} />
      )}
    </>
  )
}