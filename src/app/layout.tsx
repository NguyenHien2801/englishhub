import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'EnglishHub — Học tiếng Anh toàn diện',
  description: 'Nền tảng học tiếng Anh tích hợp AI: Từ vựng SRS, Ngữ pháp, Luyện thi VSTEP/TOEIC/APTIS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        {children}
        <Toaster position="top-right" toastOptions={{
          style: {
            fontFamily: 'var(--font-body)',
            background: '#0D0D0D',
            color: '#F8F7F2',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#00A878', secondary: '#F8F7F2' } },
        }} />
      </body>
    </html>
  )
}
