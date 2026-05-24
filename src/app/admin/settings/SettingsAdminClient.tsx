'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const SECTIONS = [
  {
    title: 'Hệ thống',
    icon: '⚙️',
    items: [
      { label: 'Tên ứng dụng', value: 'EnglishHub', type: 'text', key: 'app_name' },
      { label: 'Phiên bản', value: '1.0.0', type: 'text', key: 'version', readonly: true },
      { label: 'Môi trường', value: 'Production', type: 'text', key: 'env', readonly: true },
    ]
  },
  {
    title: 'AI & Chatbot',
    icon: '🤖',
    items: [
      { label: 'Model AI', value: 'claude-3-haiku', type: 'text', key: 'ai_model' },
      { label: 'Thời hạn cache AI (ngày)', value: '7', type: 'number', key: 'cache_ttl' },
      { label: 'Bật Chatbot', value: 'true', type: 'toggle', key: 'chatbot_enabled' },
    ]
  },
  {
    title: 'Học tập',
    icon: '📚',
    items: [
      { label: 'Số từ mới tối đa/ngày', value: '20', type: 'number', key: 'max_new_words' },
      { label: 'Số ôn tập tối đa/ngày', value: '100', type: 'number', key: 'max_reviews' },
      { label: 'Bật SRS (Spaced Repetition)', value: 'true', type: 'toggle', key: 'srs_enabled' },
    ]
  },
]

const QUICK_LINKS = [
  { label: 'Quản lý sinh viên', href: '/admin/students', icon: '👥' },
  { label: 'Phân quyền tài khoản', href: '/admin/students/roles', icon: '🔐' },
  { label: 'Ngân hàng câu hỏi', href: '/admin/questions', icon: '❓' },
  { label: 'Thống kê hệ thống', href: '/admin/stats', icon: '📊' },
  { label: 'Lịch sử chatbot', href: '/admin/chatbot/history', icon: '💬' },
  { label: 'Cache AI', href: '/admin/chatbot/config', icon: '🗄️' },
]

export default function SettingsAdminClient() {
  const [settings, setSettings] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    SECTIONS.forEach(s => s.items.forEach(i => { obj[i.key] = i.value }))
    return obj
  })

  function save() {
    toast.success('Đã lưu cài đặt (demo — kết nối DB để persist)')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Cài đặt hệ thống</h1>
        <p className="text-[#6B6B60] mt-1">Cấu hình chung cho EnglishHub Admin</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {SECTIONS.map(sec => (
            <div key={sec.title} className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{sec.icon}</span>
                <h3 className="font-semibold text-[#0D0D0D]">{sec.title}</h3>
              </div>
              <div className="space-y-3">
                {sec.items.map(item => (
                  <div key={item.key} className="flex items-center justify-between gap-4">
                    <label className="text-sm text-[#6B6B60] flex-shrink-0">{item.label}</label>
                    {item.type === 'toggle' ? (
                      <button
                        onClick={() => setSettings(p => ({ ...p, [item.key]: p[item.key] === 'true' ? 'false' : 'true' }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${settings[item.key] === 'true' ? 'bg-[#00A878]' : 'bg-[#E8E8E0]'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings[item.key] === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    ) : (
                      <input
                        type={item.type}
                        value={settings[item.key]}
                        readOnly={item.readonly}
                        onChange={e => !item.readonly && setSettings(p => ({ ...p, [item.key]: e.target.value }))}
                        className={`px-3 py-1.5 border-2 rounded-xl text-sm w-48 focus:outline-none ${item.readonly ? 'bg-[#F8F7F2] border-[#E8E8E0] text-[#A0A090] cursor-not-allowed' : 'border-[#E8E8E0] focus:border-[#00A878]'}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button onClick={save}
            className="w-full py-3 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">
            Lưu cài đặt
          </button>
        </div>

        {/* Quick links */}
        <div>
          <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
            <h3 className="font-semibold text-[#0D0D0D] mb-3">Truy cập nhanh</h3>
            <div className="space-y-1.5">
              {QUICK_LINKS.map(link => (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#6B6B60] hover:bg-[#F8F7F2] hover:text-[#0D0D0D] transition-colors">
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                  <span className="ml-auto text-[#A0A090]">→</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 bg-[#FFF8EC] rounded-2xl border border-[#F5A623]/20 p-4">
            <div className="text-sm font-semibold text-[#F5A623] mb-1">⚠️ Lưu ý</div>
            <p className="text-xs text-[#6B6B60] leading-relaxed">
              Các cài đặt trên là giao diện demo. Để persist cài đặt, cần tạo bảng <code className="font-mono text-[#0D0D0D]">CaiDatHeThong</code> trong Supabase.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
