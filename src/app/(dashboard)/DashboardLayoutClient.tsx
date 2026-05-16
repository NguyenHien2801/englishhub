'use client'
import { useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/ui/Sidebar'

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
    // --cream từ Landing: #F8F5EE
    <div className="flex min-h-screen" style={{ background: '#F8F5EE' }}>

      <Sidebar open={sidebarOpen} isAdmin={isAdmin} profile={profile} />

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

      {/*
        Floating AI Chat Button
        — Navy nền + viền gold + pill-radius 50px khớp .ctaPrimary Landing
        — hover: scale + shadow vàng như .ctaPrimary:hover
      */}
      <Link
        href="/ai-chat"
        title="AI Chatbot — Hỏi gì cũng được"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 50,
          width: 56,
          height: 56,
          borderRadius: 50,
          background: '#0F1C35',           // --navy
          border: '2px solid #C9A84C',     // --gold
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(15,28,53,.35)',
          transition: 'all .32s cubic-bezier(.34,1.56,.64,1)',
          textDecoration: 'none',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.transform = 'translateY(-4px) scale(1.08)'
          el.style.boxShadow = '0 12px 32px rgba(201,168,76,.45)'
          el.style.background = '#1E2F50'  // --navy-lg khi hover
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.transform = 'translateY(0) scale(1)'
          el.style.boxShadow = '0 6px 24px rgba(15,28,53,.35)'
          el.style.background = '#0F1C35'
        }}
      >
        {/* Icon Sparkles SVG — cùng stroke style với aiFeatIcon trong Dashboard */}
        <svg
          width="22" height="22" viewBox="0 0 24 24"
          fill="none" stroke="#C9A84C" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V4a1 1 0 0 1 1-1z"/>
          <path d="M12 19a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1z"/>
          <path d="M3 12a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1z"/>
          <path d="M19 12a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2h-1a1 1 0 0 1-1-1z"/>
          <path d="M5.64 5.64a1 1 0 0 1 1.41 0l.71.71a1 1 0 0 1-1.41 1.41l-.71-.71a1 1 0 0 1 0-1.41z"/>
          <path d="M16.24 16.24a1 1 0 0 1 1.41 0l.71.71a1 1 0 0 1-1.41 1.41l-.71-.71a1 1 0 0 1 0-1.41z"/>
          <path d="M5.64 18.36a1 1 0 0 1 0-1.41l.71-.71a1 1 0 1 1 1.41 1.41l-.71.71a1 1 0 0 1-1.41 0z"/>
          <path d="M16.24 7.76a1 1 0 0 1 0-1.41l.71-.71a1 1 0 1 1 1.41 1.41l-.71.71a1 1 0 0 1-1.41 0z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </Link>
    </div>
  )
}