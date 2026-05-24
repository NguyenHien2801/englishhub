'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface ChildItem { href: string; label: string }
interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  children?: ChildItem[]
}
interface AdminSidebarProps {
  user?: { ho_ten?: string; ma_sinh_vien?: string; vai_tro?: string } | null
}

const Icons = {
  dashboard: (<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>),
  users: (<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.85"/></svg>),
  content: (<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>),
  exam: (<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>),
  stats: (<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16"/></svg>),
  settings: (<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>),
  skills: (<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 18.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z"/><path d="M12 14a2 2 0 100-4 2 2 0 000 4z"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>),
  chatbot: (<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.06L2 22l4.94-1.38A9.953 9.953 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01" strokeLinecap="round" strokeWidth={2.5}/></svg>),
  chevronDown: (<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>),
  back: (<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>),
  logout: (<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>),
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Tổng quan', href: '/admin/dashboard', icon: Icons.dashboard },
  {
    label: 'Sinh viên', icon: Icons.users,
    children: [
      { href: '/admin/students', label: 'Danh sách sinh viên' },
      { href: '/admin/students/progress', label: 'Tiến độ học tập' },
      { href: '/admin/students/roles', label: 'Phân quyền tài khoản' },
    ],
  },
  {
    label: 'Nội dung học', icon: Icons.content,
    children: [
      { href: '/admin/vocabulary', label: 'Quản lý từ vựng' },
      { href: '/admin/grammar', label: 'Quản lý ngữ pháp' },
    ],
  },
  {
    label: '4 Kỹ năng', icon: Icons.skills,
    children: [
      { href: '/admin/listening', label: 'Bài nghe (Listening)' },
      { href: '/admin/writing', label: 'Bài viết (Writing)' },
      { href: '/admin/speaking', label: 'Bài nói (Speaking)' },
      { href: '/admin/reading', label: 'Bài đọc (Reading)' },
    ],
  },
  {
    label: 'Thi & Kiểm tra', icon: Icons.exam,
    children: [
      { href: '/admin/questions', label: 'Ngân hàng câu hỏi' },
      { href: '/admin/exams', label: 'Đề thi & Bài kiểm tra' },
      { href: '/admin/exams/history', label: 'Lịch sử thi' },
      { href: '/admin/level-test', label: 'Kiểm tra đầu vào' },
    ],
  },
  {
    label: 'Chatbot AI', icon: Icons.chatbot,
    children: [
      { href: '/admin/chatbot/history', label: 'Lịch sử hội thoại' },
      { href: '/admin/chatbot/config', label: 'Cấu hình Chatbot' },
    ],
  },
  { label: 'Thống kê', href: '/admin/stats', icon: Icons.stats },
  { label: 'Cài đặt', href: '/admin/settings', icon: Icons.settings },
]

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
.as-wrap *{box-sizing:border-box;margin:0;padding:0;}
.as-wrap{position:fixed;top:0;left:0;bottom:0;z-index:50;display:flex;flex-direction:column;background:#0F1C35;border-right:1px solid rgba(201,168,76,0.18);box-shadow:4px 0 24px rgba(0,0,0,0.35);font-family:'DM Sans',sans-serif;transition:width 0.25s cubic-bezier(0.4,0,0.2,1);overflow:hidden;}
.as-logo{display:flex;align-items:center;gap:12px;padding:0 16px;height:64px;flex-shrink:0;border-bottom:1px solid rgba(201,168,76,0.13);text-decoration:none;}
.as-logo-img{background:#fff;border-radius:9px;padding:4px 10px;display:flex;align-items:center;box-shadow:0 3px 14px rgba(15,28,53,0.35),0 0 0 1px rgba(201,168,76,0.25);height:50px;flex-shrink:0;}
.as-logo-img img{height:42px;width:auto;object-fit:contain;display:block;}
.as-logo-label{overflow:hidden;}
.as-logo-title{font-size:15px;font-weight:700;color:#fff;letter-spacing:0;line-height:1.2;}
.as-toggle{position:absolute;top:20px;right:-13px;width:26px;height:26px;border-radius:50%;background:#1a2840;border:1px solid rgba(201,168,76,0.25);cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(201,168,76,0.6);z-index:10;flex-shrink:0;transition:all 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.3);}
.as-toggle:hover{background:#1e2f50;color:#C9A84C;border-color:rgba(201,168,76,0.5);}
.as-section-label{padding:12px 18px 6px;font-size:11px;font-weight:500;letter-spacing:0.04em;color:rgba(201,168,76,0.4);text-transform:uppercase;}
.as-nav{flex:1;overflow-y:auto;overflow-x:hidden;padding:8px 0;}
.as-nav::-webkit-scrollbar{width:3px;}
.as-nav::-webkit-scrollbar-track{background:transparent;}
.as-nav::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:3px;}
.as-item{display:flex;align-items:center;gap:10px;padding:9px 16px;margin:1px 8px;border-radius:9px;color:rgba(255,255,255,0.88);font-size:15px;font-weight:500;text-decoration:none;background:none;border:none;cursor:pointer;width:calc(100% - 16px);text-align:left;transition:color 0.15s,background 0.15s;white-space:nowrap;overflow:hidden;font-family:'DM Sans',sans-serif;letter-spacing:0;position:relative;}
.as-item::after{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:0;border-radius:0 2px 2px 0;background:#C9A84C;transition:height 0.18s cubic-bezier(0.16,1,0.3,1);}
.as-item:hover{color:rgba(255,255,255,0.95);background:rgba(255,255,255,0.05);}
.as-item.active{color:#C9A84C;font-weight:600;background:rgba(201,168,76,0.1);}
.as-item.active::after{height:60%;}
.as-item.group-open{color:rgba(255,255,255,0.95);background:rgba(255,255,255,0.05);}
.as-item-icon{flex-shrink:0;display:flex;}
.as-item-label{flex:1;}
.as-chevron{flex-shrink:0;transition:transform 0.2s;display:flex;opacity:0.5;}
.as-chevron.open{transform:rotate(180deg);}
.as-children{padding-bottom:2px;}
.as-child{display:flex;align-items:center;gap:8px;padding:8px 16px 8px 42px;margin:1px 8px;border-radius:8px;color:rgba(255,255,255,0.55);font-size:14px;font-weight:400;text-decoration:none;transition:color 0.15s,background 0.15s;white-space:nowrap;font-family:'DM Sans',sans-serif;}
.as-child:hover{color:rgba(255,255,255,0.88);background:rgba(255,255,255,0.04);}
.as-child.active{color:#C9A84C;font-weight:500;background:rgba(201,168,76,0.07);}
.as-child-dot{width:4px;height:4px;border-radius:50%;flex-shrink:0;background:rgba(255,255,255,0.2);transition:background 0.15s;}
.as-child.active .as-child-dot,.as-child:hover .as-child-dot{background:#C9A84C;}
.as-divider{height:1px;background:rgba(201,168,76,0.1);margin:6px 16px;flex-shrink:0;}
.as-footer{flex-shrink:0;padding:8px 8px 12px;}
.as-user{display:flex;align-items:center;gap:10px;padding:10px 10px;border-radius:10px;margin-bottom:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);overflow:hidden;}
.as-user-avatar{width:34px;height:34px;border-radius:9px;flex-shrink:0;background:#fff;border:2px solid rgba(201,168,76,0.5);display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;color:#0F1C35;overflow:hidden;}
.as-user-name{font-size:13px;font-weight:500;color:rgba(255,255,255,0.88);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;}
.as-user-role{font-size:12px;color:rgba(201,168,76,0.6);font-weight:400;}
.as-foot-btn{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:9px;width:100%;font-size:14px;font-weight:500;font-family:'DM Sans',sans-serif;text-decoration:none;background:none;border:1px solid rgba(255,255,255,0.07);cursor:pointer;transition:all 0.15s;white-space:nowrap;overflow:hidden;color:rgba(255,255,255,0.7);margin-bottom:4px;letter-spacing:0;}
.as-foot-btn:hover{color:rgba(255,255,255,0.95);border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.06);}
.as-foot-btn.danger:hover{color:#fc8181;border-color:rgba(252,129,129,0.2);background:rgba(252,129,129,0.05);}
`

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()
  const [openGroup,   setOpenGroup]   = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const hoTen = user?.ho_ten || 'Admin'

  useEffect(() => {
    const id = 'as-styles'
    if (document.getElementById(id)) return
    const el = document.createElement('style')
    el.id = id; el.textContent = CSS
    document.head.appendChild(el)
    return () => { document.getElementById(id)?.remove() }
  }, [])

  useEffect(() => {
    for (const item of ADMIN_NAV) {
      if (item.children?.some(c => pathname.startsWith(c.href))) {
        setOpenGroup(item.label); break
      }
    }
  }, [pathname])

  function isActive(href?: string, children?: ChildItem[]) {
    if (href)     return pathname === href || pathname.startsWith(href + '/')
    if (children) return children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))
    return false
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Đã đăng xuất')
    router.push('/login')
    router.refresh()
  }

  const w = isCollapsed ? 60 : 236

  return (
    <aside className="as-wrap" style={{ width: w }}>
      <Link href="/admin/dashboard" className="as-logo" title="EnglishHub Admin">
        <div className="as-logo-img">
          <img src="/assets/Logo.png" alt="EnglishHub"
            onError={e => {
              const t = e.target as HTMLImageElement
              t.style.display = 'none'
              const fb = document.createElement('span')
              fb.textContent = 'EH'
              fb.style.cssText = 'font-family:DM Sans,sans-serif;font-size:15px;font-weight:700;color:#0F1C35;'
              t.parentElement?.appendChild(fb)
            }}
          />
        </div>
        {!isCollapsed && <div className="as-logo-label"><div className="as-logo-title">EnglishHub</div></div>}
      </Link>

      <button className="as-toggle" onClick={() => setIsCollapsed(v => !v)} title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}>
        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.25s' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>

      <nav className="as-nav">
        {!isCollapsed && <div className="as-section-label">Menu</div>}
        {ADMIN_NAV.map(item => {
          const active  = isActive(item.href, item.children)
          const isOpen  = openGroup === item.label
          const hasKids = !!item.children
          return (
            <div key={item.label}>
              {item.href && !hasKids ? (
                <Link href={item.href}
                  className={`as-item${active ? ' active' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                  style={{ paddingLeft: isCollapsed ? 20 : undefined, justifyContent: isCollapsed ? 'center' : undefined }}>
                  <span className="as-item-icon">{item.icon}</span>
                  {!isCollapsed && <span className="as-item-label">{item.label}</span>}
                </Link>
              ) : (
                <>
                  <button
                    className={`as-item${active || isOpen ? ' group-open' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                    style={{ paddingLeft: isCollapsed ? 20 : undefined, justifyContent: isCollapsed ? 'center' : undefined }}
                    onClick={() => !isCollapsed && setOpenGroup(isOpen ? null : item.label)}>
                    <span className="as-item-icon">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="as-item-label">{item.label}</span>
                        <span className={`as-chevron${isOpen ? ' open' : ''}`}>{Icons.chevronDown}</span>
                      </>
                    )}
                  </button>
                  {!isCollapsed && isOpen && item.children && (
                    <div className="as-children">
                      {item.children.map(child => {
                        const ca = pathname === child.href || pathname.startsWith(child.href + '/')
                        return (
                          <Link key={child.href} href={child.href} className={`as-child${ca ? ' active' : ''}`}>
                            <span className="as-child-dot" />
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

      <div className="as-divider" />

      <div className="as-footer">
        {!isCollapsed && (
          <div className="as-user">
            <div className="as-user-avatar">{hoTen.charAt(0).toUpperCase()}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div className="as-user-name">{hoTen}</div>
              <div className="as-user-role">Administrator</div>
            </div>
          </div>
        )}
        <Link href="/dashboard" className="as-foot-btn" title={isCollapsed ? 'Về giao diện sinh viên' : undefined}>
          {Icons.back}
          {!isCollapsed && <span>Về giao diện sinh viên</span>}
        </Link>
        <button className="as-foot-btn danger" onClick={handleLogout} title={isCollapsed ? 'Đăng xuất' : undefined}>
          {Icons.logout}
          {!isCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}
