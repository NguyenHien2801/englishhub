'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

// ─── Hook: scroll-triggered reveal ───────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

// ─── Hook: animated counter ───────────────────────────────────────────────────
function useCounter(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

const UNSPLASH = {
  heroBg:       'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80',
  dashPreview:  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=80',
  dashFull:     'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&q=80',
  gallery1:     '/assets/index/SV1.jpg',
  gallery2:     '/assets/index/SV2.jpg',
  gallery3:     '/assets/index/SV3.jpg',
  gallery4:     '/assets/index/SV4.jpg',
  exam_vstep:   'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80',
  exam_toeic:   'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80',
  exam_aptis:   'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=500&q=80',
  feat_flash:   '/assets/index/FlashCard.jpg',
  feat_grammar: '/assets/index/Grammar.jpg',
  feat_library: '/assets/index/KhoTaiLieu.jpg',
  feat_level:   '/assets/index/HoTro.png',
  feat_dash:    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
  feat_comm:    '/assets/index/E.png',
}

const heroCards = [
  { title: 'Flashcard SRS', desc: 'Thuật toán SM-2 tự động lên lịch ôn tập đúng lúc. 10,000+ từ vựng từ A1 đến C1.', cls: 'icon-green', shape: 'circle',
    svg: <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor" stroke="none"/> },
  { title: 'AI Gemini 24/7', desc: 'Giải thích từ vựng, chấm bài Writing, tạo lộ trình học cá nhân hóa hoàn toàn miễn phí.', cls: 'icon-gold', shape: 'blob',
    svg: <><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></> },
  { title: '3 Chứng chỉ', desc: 'Ngân hàng đề thi VSTEP B1, TOEIC, APTIS với đề mẫu riêng từng loại chứng chỉ.', cls: 'icon-blue', shape: 'squircle',
    svg: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></> },
  { title: 'Dashboard AI', desc: 'Theo dõi tiến độ 4 kỹ năng, streak học tập và phân tích điểm yếu cần cải thiện.', cls: 'icon-red', shape: 'triangle',
    svg: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
]

const stats = [
  { num: '10,000+', label: 'Từ vựng thông minh', icon: '📚' },
  { num: '3',       label: 'Chứng chỉ hỗ trợ', icon: '🏆' },
  { num: '100%',    label: 'Hoàn toàn miễn phí', icon: '🆓' },
  { num: '24/7',    label: 'AI hỗ trợ liên tục', icon: '🤖' },
]

const uniHighlights = ['Xác thực qua MSSV', 'Miễn phí 100%', 'Chuẩn đầu ra VSTEP B1', 'AI hỗ trợ tiếng Việt']

const problems = [
  { icon: '😩', text: 'Thiếu tài liệu VSTEP/APTIS miễn phí, chất lượng tốt cho sinh viên trong nước' },
  { icon: '🧠', text: 'Học từ vựng xong quên ngay — không có cơ chế ôn lại đúng thời điểm khoa học' },
  { icon: '🤷', text: 'Không biết trình độ hiện tại ở đâu, không có lộ trình cụ thể để theo' },
  { icon: '🌙', text: 'Không có người hướng dẫn 24/7 khi tự học gặp khó khăn về ngữ pháp, từ vựng' },
  { icon: '📉', text: 'Học mà không biết đã tiến bộ kỹ năng nào, không nhìn thấy sự tiến bộ' },
]

const solutions = [
  { icon: '✅', text: 'Ngân hàng câu hỏi VSTEP/TOEIC/APTIS được tuyển chọn, miễn phí hoàn toàn' },
  { icon: '✅', text: 'Thuật toán Spaced Repetition (SRS) SM-2 khoa học, tự động lên lịch ôn tập tối ưu' },
  { icon: '✅', text: 'Level Test + AI Gemini phân tích và gợi ý lộ trình học cá nhân hóa theo mục tiêu' },
  { icon: '✅', text: 'Chatbot AI Gemini hoạt động 24/7, giải thích bằng tiếng Việt dễ hiểu' },
  { icon: '✅', text: 'Dashboard 4 kỹ năng + streak học tập + phân tích điểm yếu chi tiết' },
]

const features = [
  {
    img: UNSPLASH.feat_flash,
    badge: '10,000+ từ vựng', badgeCls: 'fcBadgeGreen',
    title: 'Flashcard Thông Minh SRS',
    desc: 'Thẻ từ hai mặt với thuật toán SM-2. Tự động tính thời điểm ôn lại tối ưu dựa trên mức độ ghi nhớ của bạn.',
    accentColor: '#00A878',
    iconSvg: <><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M8 10h8M8 14h5"/></>,
  },
  {
    img: UNSPLASH.feat_grammar,
    badge: 'A1 → C1', badgeCls: 'fcBadgeBlue',
    title: 'Ngữ Pháp Có Hệ Thống',
    desc: 'Bài học ngữ pháp từ cơ bản đến nâng cao. AI Gemini giải thích tức thì bằng tiếng Việt khi gặp điểm khó.',
    accentColor: '#6478f0',
    iconSvg: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
  },
  {
    img: UNSPLASH.feat_library,
    badge: 'Cộng đồng', badgeCls: 'fcBadgeGold',
    title: 'Kho Tài Liệu Phong Phú',
    desc: 'Upload, tìm kiếm và phân loại tài liệu theo kỹ năng, cấp độ và chứng chỉ. Chia sẻ cộng đồng dễ dàng.',
    accentColor: '#C8A84B',
    iconSvg: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
  },
  {
    img: UNSPLASH.feat_level,
    badge: 'Cá nhân hóa', badgeCls: 'fcBadgeRed',
    title: 'Level Test & Lộ Trình AI',
    desc: 'Kiểm tra trình độ ~20 phút. AI Gemini phân tích kết quả và lập kế hoạch học theo tuần phù hợp mục tiêu.',
    accentColor: '#f06464',
    iconSvg: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  },
  {
    img: UNSPLASH.feat_dash,
    badge: 'Phân tích AI', badgeCls: 'fcBadgeTeal',
    title: 'Dashboard Tiến Độ',
    desc: 'Biểu đồ 4 kỹ năng Nghe/Đọc/Viết/Nói, chuỗi streak học tập hàng ngày và top 3 điểm yếu cần cải thiện.',
    accentColor: '#00A878',
    iconSvg: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
  },
  {
    img: UNSPLASH.feat_comm,
    badge: 'Sắp ra mắt', badgeCls: 'fcBadgePurple',
    title: 'Cộng Đồng & Diễn Đàn',
    desc: 'Hỏi đáp, chia sẻ kinh nghiệm ôn thi, đánh giá tài liệu và kết nối với cộng đồng sinh viên cùng mục tiêu.',
    accentColor: '#9B59B6',
    iconSvg: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  },
]

const exams = [
  {
    logo: 'VSTEP', name: 'Vietnam Standardized Test of English Proficiency',
    purpose: '🎓 Chuẩn đầu ra ĐH Thái Bình', color: '#00A878', imgSrc: UNSPLASH.exam_vstep,
    skills: [
      { text: 'Nghe: 4 phần, 35 câu, 40 phút', gold: false },
      { text: 'Đọc: 4 phần, 40 câu, 60 phút',  gold: false },
      { text: 'Viết: Điền câu + bài luận',       gold: true  },
      { text: 'Nói: 3 phần, 12 phút',            gold: true  },
    ],
  },
  {
    logo: 'TOEIC', name: 'Test of English for International Communication',
    purpose: '💼 Xin việc · Doanh nghiệp quốc tế', color: '#C8A84B', imgSrc: UNSPLASH.exam_toeic,
    skills: [
      { text: 'Nghe: Part 1–4, 100 câu',  gold: false },
      { text: 'Đọc: Part 5–7, 100 câu',   gold: false },
      { text: 'Thang điểm 10–990',         gold: true  },
      { text: 'AI phân tích từng Part',    gold: true  },
    ],
  },
  {
    logo: 'APTIS', name: 'Assessment of Practical English Proficiency',
    purpose: '✈️ Du học · Học bổng Anh', color: '#6478f0', imgSrc: UNSPLASH.exam_aptis,
    skills: [
      { text: 'Nghe: 4 phần, hội thoại tự nhiên',      gold: false },
      { text: 'Đọc: Điền từ + đọc hiểu đa dạng',       gold: false },
      { text: 'Viết: Email + bài luận ngắn',            gold: true  },
      { text: 'Nói: Mô tả hình, thảo luận',             gold: true  },
    ],
  },
]

const aiFunctions = [
  { title: 'Giải thích từ vựng & ngữ pháp',  desc: 'Click vào bất kỳ từ nào → AI giải thích nghĩa, ví dụ, mẹo nhớ và cách dùng trong TOEIC/VSTEP',
    svg: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></> },
  { title: 'Chấm bài Writing thông minh',    desc: 'Nộp bài viết → AI nhận xét nội dung, ngữ pháp, từ vựng và cho điểm theo tiêu chí VSTEP/APTIS',
    svg: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></> },
  { title: 'Lộ trình học cá nhân hóa',      desc: 'Sau Level Test, AI phân tích trình độ + mục tiêu → lập kế hoạch học theo tuần phù hợp với bạn',
    svg: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
  { title: 'Sinh bài tập tự động',           desc: 'Nhập văn bản bất kỳ → AI tạo quiz trắc nghiệm, điền từ để luyện tập ngay lập tức',
    svg: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
]

const galleryPhotos = [
  { src: UNSPLASH.gallery1, alt: 'Sinh viên học tại thư viện'  },
  { src: UNSPLASH.gallery2, alt: 'Nhóm ôn thi VSTEP'           },
  { src: UNSPLASH.gallery3, alt: 'Học trực tuyến cùng AI'      },
  { src: UNSPLASH.gallery4, alt: 'Luyện Speaking APTIS'        },
]

const steps = [
  {
    num: '01', title: 'Tạo tài khoản',
    desc: 'Điền email và mật khẩu — xong trong 60 giây. Thêm MSSV tùy chọn để nhận nhãn Sinh viên Đại học Thái Bình đã xác thực.',
    tag: 'Email · Bảo mật', tagColor: '#00A878',
    svg: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>,
    shape: 'circle',
  },
  {
    num: '02', title: 'Hoàn thiện hồ sơ',
    desc: 'Nhập họ tên, lớp, khoa. Chọn mục tiêu học — VSTEP / TOEIC / APTIS — AI sẽ lập lộ trình phù hợp ngay cho bạn.',
    tag: 'Cá nhân hóa', tagColor: '#6478f0',
    svg: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    shape: 'blob',
  },
  {
    num: '03', title: 'Làm Level Test',
    desc: 'Bài kiểm tra ~20 phút đánh giá 4 kỹ năng. AI Gemini phân tích kết quả và lập kế hoạch học theo tuần.',
    tag: 'AI phân tích', tagColor: '#C8A84B',
    svg: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    shape: 'squircle',
  },
  {
    num: '04', title: 'Học & tiến bộ',
    desc: 'Flashcard SRS, luyện đề, chat với AI và theo dõi tiến độ mỗi ngày trên Dashboard trực quan.',
    tag: 'Tiến bộ hàng ngày', tagColor: '#f06464',
    svg: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    shape: 'diamond',
  },
]

const testimonials = [
  { text: 'Từ khi dùng EnglishHub, tôi học từ vựng hiệu quả hơn hẳn nhờ flashcard SRS. AI Gemini giải thích bằng tiếng Việt rất dễ hiểu, không cần tra Google nữa!', initials: 'MT', name: 'Nguyễn Minh Tuấn', role: 'SV Năm 3 · Khoa Kinh tế', avatarCls: 'avatarGold' },
  { text: 'Tôi đang ôn TOEIC để xin việc và EnglishHub là thứ tôi cần. Đề thi đủ chuẩn, AI phân tích điểm yếu Part 5 và Part 6 của tôi rất chính xác.',               initials: 'LH', name: 'Trần Lan Hương',    role: 'SV Năm 4 · Khoa CNTT',     avatarCls: 'avatarGreen' },
  { text: 'Điều tôi thích nhất là tất cả miễn phí. Dashboard theo dõi 4 kỹ năng giúp tôi biết mình cần tập trung vào đâu. Đặc biệt tính năng chấm Writing rất tốt!',  initials: 'PD', name: 'Lê Phương Dung',    role: 'SV Năm 2 · Khoa Ngoại ngữ', avatarCls: 'avatarBlue' },
]

const platformRows = [
  { feature: 'Luyện thi VSTEP B1 chuyên sâu',  eh: true,  duolingo: false, toeicApp: false },
  { feature: 'Flashcard SRS (thuật toán SM-2)', eh: true,  duolingo: true,  toeicApp: false },
  { feature: 'AI giải thích bằng tiếng Việt',  eh: true,  duolingo: false, toeicApp: false },
  { feature: 'Chấm bài Writing tự động',        eh: true,  duolingo: false, toeicApp: false },
  { feature: 'Đề thi TOEIC & APTIS chuẩn',     eh: true,  duolingo: false, toeicApp: true  },
  { feature: 'Dashboard 4 kỹ năng chi tiết',    eh: true,  duolingo: false, toeicApp: false },
  { feature: 'Hoàn toàn miễn phí 100%',         eh: true,  duolingo: false, toeicApp: false },
  { feature: 'Lộ trình AI cá nhân hóa',         eh: true,  duolingo: false, toeicApp: false },
]

const faqs = [
  { q: 'EnglishHub có thực sự miễn phí không?',
    a: 'Hoàn toàn miễn phí 100% — không có gói Premium, không có tính năng trả phí ẩn. Tất cả tính năng bao gồm AI Gemini, flashcard SRS, đề thi chứng chỉ và dashboard đều miễn phí cho sinh viên Trường Đại học Thái Bình.' },
  { q: 'Tôi cần gì để đăng ký?',
    a: 'Chỉ cần email và mật khẩu là đủ để tạo tài khoản. Bạn có thể thêm Mã Số Sinh Viên (MSSV) tùy chọn để nhận nhãn "Sinh viên đã xác thực" — nhưng MSSV không bắt buộc.' },
  { q: 'EnglishHub hỗ trợ chuẩn bị cho những chứng chỉ nào?',
    a: 'Hiện tại hỗ trợ 3 chứng chỉ: VSTEP B1 (chuẩn đầu ra Đại học Thái Bình), TOEIC (dành cho xin việc và doanh nghiệp), và APTIS (dành cho du học và học bổng Anh).' },
  { q: 'AI Gemini trong EnglishHub hoạt động như thế nào?',
    a: 'Chúng tôi tích hợp Google Gemini 2.0 Flash. AI có thể giải thích từ vựng và ngữ pháp bằng tiếng Việt, chấm bài Writing theo tiêu chí VSTEP/APTIS, lập lộ trình học sau Level Test, và sinh bài tập từ văn bản bất kỳ.' },
  { q: 'Dữ liệu học tập của tôi có được lưu không?',
    a: 'Có. Toàn bộ lịch sử flashcard SRS, điểm thi, streak học tập và phân tích 4 kỹ năng đều được lưu trữ an toàn. Bạn có thể xem lại tiến trình bất cứ lúc nào trên Dashboard.' },
  { q: 'Thuật toán SRS SM-2 là gì?',
    a: 'SM-2 (SuperMemo 2) là thuật toán lặp lại ngắt quãng được nghiên cứu khoa học, tự động tính toán thời điểm ôn lại mỗi từ dựa trên mức độ ghi nhớ của bạn — giúp ghi nhớ lâu dài với thời gian ôn tập tối thiểu.' },
]

// ─── FAQ ITEM ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faqItem${open ? ' faqOpen' : ''}`} onClick={() => setOpen(!open)}>
      <div className="faqQ">
        <span>{q}</span>
        <span className="faqIcon">{open ? '−' : '+'}</span>
      </div>
      {open && <div className="faqA">{a}</div>}
    </div>
  )
}

// ─── Reveal wrapper ────────────────────────────────────────────────────────────
function Reveal({ children, cls = 'reveal', delay = 0, style = {} }: {
  children: React.ReactNode; cls?: string; delay?: number; style?: React.CSSProperties
}) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className={`${cls}${visible ? ' visible' : ''}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  )
}

// ─── Animated stat ─────────────────────────────────────────────────────────────
function AnimatedStat({ num, label, icon }: { num: string; label: string; icon: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect() } }, { threshold: .5 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  const numeric = parseInt(num.replace(/\D/g, '')) || 0
  const suffix  = num.replace(/[0-9]/g, '')
  const count   = useCounter(numeric, 1600, started)
  return (
    <div ref={ref} className="statItem">
      <div className="statIcon">{icon}</div>
      <div className="statNum">{started ? `${count}${suffix}` : num}</div>
      <div className="statLabel">{label}</div>
    </div>
  )
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IconRocket = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
)
const IconPlay = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>
  </svg>
)
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconLogIn = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
)
const IconCheck = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)
const IconGradCap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
)
const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

// ─── NAV with mobile hamburger ────────────────────────────────────────────────
function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* TẦNG 1: Topbar liên hệ + mạng xã hội */}
      <div className="topbarInfo">
        <div className="topbarInner">
          <div className="topbarLeft">
            <a href="tel:02273633669" className="topbarItem">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              0227.3633669
            </a>
            <a href="mailto:support@tbu.edu.vn" className="topbarItem">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              support@tbu.edu.vn
            </a>
            <a href="https://tbu.edu.vn" target="_blank" rel="noreferrer" className="topbarItem">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              tbu.edu.vn
            </a>
            <a href="#" className="topbarItem">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Phường Thái Bình, Hưng Yên
            </a>
          </div>
          <div className="topbarRight">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="socialBtn" aria-label="Facebook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="socialBtn" aria-label="YouTube">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
              </svg>
            </a>
            <a href="#" target="_blank" rel="noreferrer" className="socialBtn" aria-label="Zalo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V9h2v7zm4 0h-2V9h2v7z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* TẦNG 2: Header trắng — Logo + tên trường */}
      <div className="headerWhite">
        <div className="headerInner">
          <Link href="/" className="headerLogo">
            <img src="/assets/Logo.png" alt="Logo EnglishHub" className="headerLogoImg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="headerLogoText">
              <span className="headerBrand">
                ENGLISH<span>HUB</span>
              </span>
              <span className="headerBrandSub">& Nền Tảng Học Tiếng Anh AI</span>
            </div>
          </Link>
<div className="headerActions">
  <Link href="/register" className="headerBtnPrimary">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
    Đăng Ký Miễn Phí
  </Link>
  <Link href="/login" className="headerBtnSecondary">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
    Đăng Nhập
  </Link>
</div>
        </div>
      </div>

      {/* TẦNG 3: Nav navy — Menu điều hướng */}
      <nav className="navBar">
        <div className="navBarInner">
          <ul className="navBarLinks">
            <li><a href="/" className="navBarItem navBarActive">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Trang Chủ
            </a></li>
            <li><a href="#features" className="navBarItem">Tính Năng</a></li>
            <li><a href="#exams" className="navBarItem">Chứng Chỉ</a></li>
            <li><a href="#ai" className="navBarItem">AI Gemini</a></li>
            <li><a href="#how" className="navBarItem">Cách Dùng</a></li>
            <li><a href="#faq" className="navBarItem">FAQ</a></li>
          </ul>
<div className="navBarRight">
  <div className="navSearch">
    <input type="text" placeholder="Tìm kiếm..." className="navSearchInput" />
    <button className="navSearchBtn" aria-label="Tìm kiếm">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    </button>
  </div>
</div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobileMenu">
          <a href="#features" onClick={() => setMobileOpen(false)}>Tính Năng</a>
          <a href="#exams" onClick={() => setMobileOpen(false)}>Chứng Chỉ</a>
          <a href="#ai" onClick={() => setMobileOpen(false)}>AI Gemini</a>
          <a href="#how" onClick={() => setMobileOpen(false)}>Cách Dùng</a>
          <a href="#faq" onClick={() => setMobileOpen(false)}>FAQ</a>
          <div className="mobileMenuActions">
            <Link href="/login" className="btnLogin" onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
            <Link href="/register" className="btnRegister" onClick={() => setMobileOpen(false)}>
              <IconGradCap /> Đăng ký miễn phí
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Serif+Display:ital@0;1&display=swap');

        /* ── DESIGN TOKENS ── */
        :root {
          --navy:       #0F1C35;
          --navy-mid:   #162444;
          --navy-lg:    #1E2F50;
          --gold:       #C9A84C;
          --gold-lt:    #E8C97A;
          --gold-pale:  #FDF8EE;
          --gold-faint: rgba(201,168,76,0.08);
          --cream:      #F8F5EE;
          --white:      #FFFFFF;
          --green:      #00A878;
          --green-lt:   #4ECBA8;
          --violet:     #6478F0;
          --rose:       #F06464;
          --text:       #1A1E2E;
          --text-mid:   #4A5568;
          --border:     rgba(201,168,76,0.18);
          --r-sm:       12px;
          --r:          20px;
          --r-lg:       32px;
          --r-xl:       48px;
          --sh-sm:      0 2px 12px rgba(15,28,53,0.07);
          --sh-md:      0 6px 28px rgba(15,28,53,0.11);
          --sh-lg:      0 18px 56px rgba(15,28,53,0.17);
          --sh-xl:      0 28px 80px rgba(15,28,53,0.22);
        }

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html { scroll-behavior:smooth; -webkit-font-smoothing:antialiased; }
        body {
          font-family:'DM Sans', sans-serif;
          font-size:16px; line-height:1.7;
          color:var(--text); background:var(--cream);
          overflow-x:hidden;
        }

        /* ── KEYFRAMES ── */
        @keyframes fadeUp    { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeLeft  { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeRight { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes scaleIn   { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
        @keyframes float     { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-14px) rotate(2deg)} }
        @keyframes floatB    { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(-3deg)} }
        @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.85)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes spinSlow  { to{transform:rotate(360deg)} }
        @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes ringOut   { 0%{transform:scale(.75);opacity:.7} 100%{transform:scale(2.4);opacity:0} }
        @keyframes blobMorph {
          0%,100%{border-radius:60% 40% 30% 70% / 60% 30% 70% 40%}
          25%{border-radius:30% 60% 70% 40% / 50% 60% 30% 60%}
          50%{border-radius:50% 60% 30% 60% / 40% 50% 60% 50%}
          75%{border-radius:60% 40% 60% 30% / 30% 70% 40% 60%}
        }
        @keyframes tickerScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes waveform { 0%,100%{height:6px} 50%{height:20px} }
        @keyframes drawLine { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }

        /* ── SCROLL REVEAL ── */
        .reveal       { opacity:0; transform:translateY(44px); transition:opacity .85s cubic-bezier(.16,1,.3,1),transform .85s cubic-bezier(.16,1,.3,1); }
        .reveal.visible { opacity:1; transform:none; }
        .reveal-left  { opacity:0; transform:translateX(-56px); transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1); }
        .reveal-left.visible { opacity:1; transform:none; }
        .reveal-right { opacity:0; transform:translateX(56px); transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1); }
        .reveal-right.visible { opacity:1; transform:none; }
        .reveal-scale { opacity:0; transform:scale(.88); transition:opacity .75s cubic-bezier(.16,1,.3,1),transform .75s cubic-bezier(.16,1,.3,1); }
        .reveal-scale.visible { opacity:1; transform:none; }
        .stagger > * { opacity:0; transform:translateY(28px); transition:opacity .65s cubic-bezier(.16,1,.3,1),transform .65s cubic-bezier(.16,1,.3,1); }
        .stagger.visible > *:nth-child(1){opacity:1;transform:none;transition-delay:.05s}
        .stagger.visible > *:nth-child(2){opacity:1;transform:none;transition-delay:.13s}
        .stagger.visible > *:nth-child(3){opacity:1;transform:none;transition-delay:.21s}
        .stagger.visible > *:nth-child(4){opacity:1;transform:none;transition-delay:.29s}
        .stagger.visible > *:nth-child(5){opacity:1;transform:none;transition-delay:.37s}
        .stagger.visible > *:nth-child(6){opacity:1;transform:none;transition-delay:.45s}

        /* ── GRADIENT TEXT ── */
        .gradText {
          background:linear-gradient(135deg,var(--gold) 0%,#6EDCB8 45%,var(--gold-lt) 100%);
          background-size:300% 300%; animation:gradShift 5s ease infinite;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        /* ── TOPBAR INFO ── */
.topbarInfo {
  background: var(--navy);
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.topbarInner {
  max-width: 1280px; margin: 0 auto;
  padding: 0 clamp(20px,5%,80px);
  display: flex; align-items: center; justify-content: space-between;
}
.topbarLeft { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.topbarItem {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12.5px; color: rgba(255,255,255,.55); text-decoration: none;
  font-weight: 500; transition: color .2s;
}
.topbarItem:hover { color: var(--gold); }
.topbarItem svg { flex-shrink: 0; opacity: .7; }
.topbarRight { display: flex; align-items: center; gap: 6px; }
.socialBtn {
  width: 30px; height: 30px; border-radius: 6px;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.1);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,.6); text-decoration: none;
  transition: all .22s;
}
.socialBtn:hover { background: var(--gold); color: var(--navy); border-color: var(--gold); }

/* ── HEADER TRẮNG ── */
.headerWhite {
  background: #fff;
  border-bottom: 2px solid rgba(201,168,76,.2);
  padding: 18px 0;
}
.headerInner {
  max-width: 1280px; margin: 0 auto;
  padding: 0 clamp(20px,5%,80px);
  display: flex; align-items: center; justify-content: space-between;
}
.headerLogo {
  display: flex; align-items: center; gap: 18px; text-decoration: none;
}
.headerLogoImg {
  height: 90px; width: auto; object-fit: contain;
}
.headerLogoText {
  display: flex; flex-direction: column; line-height: 1.2;
}
.headerBrand {
  font-family: 'Playfair Display', serif;
  font-size: 32px; font-weight: 900;
  color: var(--navy); letter-spacing: 1px; line-height: 1;
}
.headerBrand span { color: var(--gold); }
.headerBrandSub {
  font-size: 12px; color: var(--gold);
  font-weight: 700; letter-spacing: 2px;
  text-transform: uppercase; margin-top: 6px;
}
.headerActions { display: flex; align-items: center; gap: 10px; }
.headerBtnPrimary {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 20px; background: var(--navy); color: #fff;
  border-radius: 8px; font-size: 13.5px; font-weight: 700;
  text-decoration: none; font-family: 'DM Sans', sans-serif;
  transition: all .25s cubic-bezier(.34,1.56,.64,1);
}
.headerBtnPrimary:hover {
  background: var(--navy-mid); transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(15,28,53,.3);
}
.headerBtnSecondary {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 20px; background: transparent; color: var(--gold);
  border: 2px solid var(--gold); border-radius: 8px;
  font-size: 13.5px; font-weight: 700; text-decoration: none;
  font-family: 'DM Sans', sans-serif; transition: all .25s;
}
.headerBtnSecondary:hover {
  background: var(--gold); color: var(--navy); transform: translateY(-2px);
}

/* ── NAV BAR NAVY ── */
.navBar {
  background: var(--navy);
  position: sticky; top: 0; z-index: 200;
  border-bottom: 1px solid rgba(255,255,255,.06);
  box-shadow: 0 2px 16px rgba(0,0,0,.2);
}
.navBarInner {
  max-width: 1280px; margin: 0 auto;
  padding: 0 clamp(20px,5%,80px);
  display: flex; align-items: center; justify-content: space-between;
  height: 52px;
}
.navBarLinks {
  display: flex; align-items: center; gap: 0; list-style: none;
}
.navBarItem {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0 18px; height: 52px; line-height: 52px;
  font-size: 15px; font-weight: 600; color: rgba(255,255,255,.65);
  text-decoration: none; letter-spacing: .2px;
  transition: all .2s; position: relative; white-space: nowrap;
}
.navBarItem::after {
  content: ''; position: absolute; bottom: 0; left: 18px; right: 18px;
  height: 3px; background: var(--gold);
  transform: scaleX(0); transition: transform .25s cubic-bezier(.16,1,.3,1);
}
.navBarItem:hover { color: #fff; background: rgba(255,255,255,.05); }
.navBarItem:hover::after { transform: scaleX(1); }
.navBarActive { color: #fff !important; }
.navBarActive::after { transform: scaleX(1) !important; }
.navBarRight { display: flex; align-items: center; gap: 10px; }
.navSearch {
  display: flex; align-items: center;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
  border-radius: 8px; overflow: hidden; transition: all .25s;
}
.navSearch:focus-within {
  background: rgba(255,255,255,.12); border-color: rgba(201,168,76,.5);
}
.navSearchInput {
  background: transparent; border: none; outline: none;
  padding: 6px 12px; font-size: 13px; color: #fff; width: 150px;
  font-family: 'DM Sans', sans-serif;
}
.navSearchInput::placeholder { color: rgba(255,255,255,.3); }
.navSearchBtn {
  padding: 6px 10px; background: transparent; border: none;
  color: rgba(255,255,255,.5); cursor: pointer; transition: color .2s;
  display: flex; align-items: center;
}
.navSearchBtn:hover { color: var(--gold); }
.navAccountBtn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.12); border-radius: 8px;
  font-size: 13px; font-weight: 600; color: rgba(255,255,255,.75);
  text-decoration: none; transition: all .22s; white-space: nowrap;
}
.navAccountBtn:hover { background: rgba(255,255,255,.13); color: var(--gold); border-color: rgba(201,168,76,.4); }

/* ── MOBILE (giữ lại) ── */
.mobileMenu {
  position: fixed; top: 52px; left: 0; right: 0; z-index: 199;
  background: var(--navy-mid); border-bottom: 1px solid rgba(255,255,255,.08);
  display: flex; flex-direction: column; padding: 20px clamp(20px,5%,40px);
  gap: 4px; box-shadow: 0 12px 40px rgba(0,0,0,.4);
}
.mobileMenu a {
  color: rgba(255,255,255,.7); text-decoration: none;
  font-size: 16px; font-weight: 500; padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,.06); transition: color .2s;
}
.mobileMenu a:hover { color: var(--gold); }
.mobileMenuActions { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.btnLogin {
  padding: 8px 18px; border: 1.5px solid rgba(255,255,255,.18);
  color: rgba(255,255,255,.75); background: transparent; border-radius: 50px;
  font-size: 13px; font-weight: 500; font-family: 'DM Sans',sans-serif;
  transition: all .22s; text-decoration: none;
}
.btnLogin:hover { border-color: var(--gold); color: var(--gold); }
.btnRegister {
  padding: 9px 20px; background: var(--gold); color: var(--navy);
  border: none; border-radius: 50px; font-size: 13px; font-weight: 700;
  font-family: 'DM Sans',sans-serif; transition: all .28s;
  text-decoration: none; display: inline-flex; align-items: center; gap: 7px;
}
.btnRegister:hover { background: var(--gold-lt); }

@media(max-width:768px){
  .topbarLeft .topbarItem:nth-child(n+3) { display: none; }
  .headerBrand { font-size: 24px; }
  .headerBrandSub { display: none; }
  .headerLogoImg { height: 52px; }
  .headerActions .headerBtnSecondary { display: none; }
  .navBarLinks { display: none; }
  .navBarRight { display: none; }
}
        /* ── HERO ── */
        .hero {
          background:var(--navy); min-height:100svh;
          display:flex; align-items:center; position:relative; overflow:hidden;
        }
        /* Mesh gradient backdrop */
.heroBg {
  position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(ellipse 80% 60% at 70% 20%, rgba(201,168,76,.07) 0%, transparent 60%),
    radial-gradient(ellipse 60% 80% at 20% 70%, rgba(0,168,120,.05) 0%, transparent 60%),
    radial-gradient(ellipse 40% 50% at 50% 50%, rgba(100,120,240,.04) 0%, transparent 60%);
}
        /* Dot matrix */
        .heroDots {
          position:absolute; inset:0; pointer-events:none;
          background-image:radial-gradient(rgba(255,255,255,.04) 1px,transparent 1px);
          background-size:30px 30px;
        }
        /* Photo bg */
        .heroBgImg { position:absolute; inset:0; }
        .heroBgImg img { width:100%; height:100%; object-fit:cover; opacity:.18; }

        .heroInner {
          max-width:1280px; margin:0 auto; padding:80px clamp(20px,5%,80px);
          display:grid; grid-template-columns:1.1fr 1fr; gap:64px;
          align-items:center; position:relative; z-index:2; width:100%;
        }

        /* Left copy */
        .heroBadge {
          display:inline-flex; align-items:center; gap:8px; padding:6px 16px;
          background:rgba(201,168,76,.1); border:1px solid rgba(201,168,76,.28);
          border-radius:50px; font-size:13px; color:var(--gold); font-weight:600; margin-bottom:22px;
          animation:fadeUp .6s ease both;
        }
        .heroBadgeDot { width:7px; height:7px; background:var(--gold); border-radius:50%; animation:pulse 2s infinite; }
        .heroH1 {
          font-family:'Playfair Display',serif;
          font-size:clamp(42px,5vw,68px); font-weight:900; color:#fff;
          line-height:1.1; letter-spacing:-.5px; margin-bottom:22px;
          animation:fadeUp .7s ease .1s both;
        }
        .heroH1Em { font-style:italic; color:var(--gold); }
        .heroH1Em2 { font-style:italic; color:var(--green-lt); }
        .heroDesc { font-size:17px; color:rgba(255,255,255,.58); line-height:1.82; margin-bottom:34px; max-width:480px; animation:fadeUp .7s ease .2s both; }
        .heroCta { display:flex; gap:14px; flex-wrap:wrap; animation:fadeUp .7s ease .3s both; }
        .ctaPrimary {
          display:inline-flex; align-items:center; gap:8px; padding:14px 28px;
          background:var(--gold); color:var(--navy); font-weight:700; font-size:15px;
          border-radius:50px; text-decoration:none; transition:all .32s cubic-bezier(.34,1.56,.64,1);
          font-family:'DM Sans',sans-serif; letter-spacing:-.1px;
        }
        .ctaPrimary:hover { background:var(--gold-lt); transform:translateY(-4px) scale(1.03); box-shadow:0 12px 36px rgba(201,168,76,.45); }
        .ctaSecondary {
          display:inline-flex; align-items:center; gap:8px; padding:14px 28px;
          border:1.5px solid rgba(255,255,255,.18); color:rgba(255,255,255,.8); font-size:15px;
          border-radius:50px; text-decoration:none; transition:all .28s cubic-bezier(.16,1,.3,1);
          font-family:'DM Sans',sans-serif;
        }
        .ctaSecondary:hover { border-color:rgba(255,255,255,.45); color:#fff; transform:translateY(-3px); }
        .heroNote { margin-top:20px; font-size:13px; color:rgba(255,255,255,.28); animation:fadeUp .7s ease .4s both; }
        .mssvBadge {
          display:inline-flex; align-items:center; gap:8px; margin-top:16px; padding:8px 16px;
          background:rgba(0,168,120,.1); border:1px solid rgba(0,168,120,.2); border-radius:10px;
          font-size:12.5px; color:#4ECBA8; font-weight:500; animation:fadeUp .7s ease .5s both;
        }

        /* Right: cards grid — organic shapes */
        .heroCardsGrid {
          display:grid; grid-template-columns:1fr 1fr; gap:16px;
          animation:fadeLeft .9s ease .25s both;
        }
        .heroCard {
          padding:24px 20px; border-radius:var(--r);
          background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.09);
          backdrop-filter:blur(8px); transition:all .4s cubic-bezier(.16,1,.3,1);
          position:relative; overflow:hidden;
        }
        .heroCard:hover { background:rgba(255,255,255,.1); transform:translateY(-8px); box-shadow:0 20px 48px rgba(0,0,0,.3); }
        .heroCard:nth-child(2),.heroCard:nth-child(4) { margin-top:28px; }
        /* Organic icon shapes */
        .cardIcon {
          width:48px; height:48px; display:flex; align-items:center; justify-content:center; margin-bottom:16px; position:relative;
        }
        .cardIcon svg.icon-svg { width:22px; height:22px; position:relative; z-index:1; }
        .icon-bg-circle  { position:absolute; inset:0; border-radius:50%; }
        .icon-bg-blob    { position:absolute; inset:0; animation:blobMorph 8s ease-in-out infinite; }
        .icon-bg-squircle{ position:absolute; inset:0; border-radius:38% 62% 62% 38% / 42% 42% 58% 58%; }
        .icon-bg-diamond { position:absolute; inset:6px; border-radius:4px; transform:rotate(45deg); }

        .icon-green .icon-bg-circle,
        .icon-green .icon-bg-blob,
        .icon-green .icon-bg-squircle,
        .icon-green .icon-bg-diamond { background:rgba(0,168,120,.22); }
        .icon-green .icon-svg { stroke:#4ECBA8; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
        .icon-gold .icon-bg-circle,
        .icon-gold .icon-bg-blob,
        .icon-gold .icon-bg-squircle,
        .icon-gold .icon-bg-diamond { background:rgba(201,168,76,.22); }
        .icon-gold .icon-svg { stroke:var(--gold); fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
        .icon-blue .icon-bg-circle,
        .icon-blue .icon-bg-blob,
        .icon-blue .icon-bg-squircle,
        .icon-blue .icon-bg-diamond { background:rgba(100,120,240,.22); }
        .icon-blue .icon-svg { stroke:#7B96F0; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
        .icon-red .icon-bg-circle,
        .icon-red .icon-bg-blob,
        .icon-red .icon-bg-squircle,
        .icon-red .icon-bg-diamond { background:rgba(240,100,100,.22); }
        .icon-red .icon-svg { stroke:#F07878; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }

        .heroCard h3 { font-size:14px; font-weight:700; color:#fff; margin-bottom:6px; line-height:1.35; }
        .heroCard p  { font-size:12.5px; color:rgba(255,255,255,.42); line-height:1.6; }

        /* Glowing corner */
        .heroCard::before { content:''; position:absolute; top:-1px; left:-1px; right:-1px; height:2px; background:linear-gradient(90deg,transparent,var(--gold),transparent); opacity:0; transition:opacity .35s; border-radius:var(--r) var(--r) 0 0; }
        .heroCard:hover::before { opacity:1; }

        /* Floating orbs */
        .orb { position:absolute; border-radius:50%; pointer-events:none; filter:blur(60px); z-index:1; }
        .orb1 { width:400px; height:400px; background:rgba(201,168,76,.12); top:-100px; right:-80px; animation:float 10s ease-in-out infinite; }
        .orb2 { width:300px; height:300px; background:rgba(0,168,120,.09); bottom:-60px; left:-60px; animation:floatB 14s ease-in-out infinite; }
        .orb3 { width:200px; height:200px; background:rgba(100,120,240,.08); top:40%; left:30%; animation:float 8s ease-in-out infinite 2s; }

        /* Ring ripples */
        .ring { position:absolute; border-radius:50%; border:1px solid rgba(201,168,76,.15); pointer-events:none; animation:ringOut 4s ease-out infinite; }

        /* ── STATS BAR ── */
        .statsBar { background:linear-gradient(135deg,var(--gold) 0%,#D4A832 50%,var(--gold-lt) 100%); padding:0; overflow:hidden; }
        .statsInner { max-width:1280px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); }
        .statItem { padding:28px 20px; text-align:center; border-right:1px solid rgba(15,28,53,.15); transition:all .25s; cursor:default; }
        .statItem:last-child { border-right:none; }
        .statItem:hover { background:rgba(15,28,53,.06); }
        .statIcon { font-size:22px; margin-bottom:6px; display:block; }
        .statNum { font-family:'Playfair Display',serif; font-size:30px; font-weight:900; color:var(--navy); line-height:1; margin-bottom:5px; }
        .statLabel { font-size:12px; color:rgba(15,28,53,.62); font-weight:600; letter-spacing:.3px; }

        /* ── SHARED SECTION ── */
        .sec { padding:clamp(60px,8vw,100px) clamp(20px,5%,80px); }
        .inner { max-width:1280px; margin:0 auto; }
        .tag { display:inline-flex; align-items:center; gap:7px; padding:5px 14px; background:var(--gold-pale); border:1px solid rgba(201,168,76,.3); border-radius:50px; font-size:11.5px; font-weight:700; color:#8B6914; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px; }
        .tagDark { display:inline-flex; align-items:center; gap:7px; padding:5px 14px; background:rgba(201,168,76,.12); border:1px solid rgba(201,168,76,.25); border-radius:50px; font-size:11.5px; font-weight:700; color:var(--gold); text-transform:uppercase; letter-spacing:1px; margin-bottom:16px; }
        .h2 { font-family:'Playfair Display',serif; font-size:clamp(32px,3.5vw,48px); font-weight:900; color:var(--navy); line-height:1.18; margin-bottom:16px; letter-spacing:-.3px; }
        .h2w { color:#fff; }
        .h2 .g { color:var(--gold); }
        .sub { font-size:17px; color:var(--text-mid); max-width:560px; line-height:1.8; }
        .subD { color:rgba(255,255,255,.46); }

        /* ── UNI SECTION ── */
        .uniGrid { display:grid; grid-template-columns:1.1fr 1fr; gap:72px; align-items:center; }
        .uniImgWrap { position:relative; }
        .uniImgMain { width:100%; height:400px; object-fit:cover; border-radius:var(--r-lg); box-shadow:var(--sh-xl); display:block; }
        /* Floating badge card */
        .uniBadgeCard {
          position:absolute; bottom:-24px; right:-24px;
          background:#fff; border-radius:var(--r); padding:18px 22px;
          box-shadow:var(--sh-lg); border:1px solid var(--border);
          display:flex; align-items:center; gap:14px; z-index:2;
          animation:float 6s ease-in-out infinite;
        }
        .uniBadgeCircle { width:48px; height:48px; border-radius:50%; background:rgba(201,168,76,.15); display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
        .uniBadgeText { font-size:13px; font-weight:700; color:var(--navy); }
        .uniBadgeText span { display:block; font-size:11px; font-weight:400; color:var(--text-mid); margin-top:2px; }
        /* Blob accent */
        .uniBlob {
          position:absolute; top:-20px; left:-20px; width:120px; height:120px;
          background:var(--gold); border-radius:60% 40% 30% 70% / 60% 30% 70% 40%;
          animation:blobMorph 9s ease-in-out infinite; opacity:.15; z-index:0;
        }
        .uniContent h2 { font-family:'Playfair Display',serif; font-size:clamp(26px,2.8vw,38px); font-weight:900; color:var(--navy); line-height:1.22; margin-bottom:16px; }
        .uniContent p { font-size:15px; color:var(--text-mid); line-height:1.82; margin-bottom:14px; }
        .uniHL { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:28px; }
        .uniHLItem { display:flex; align-items:center; gap:10px; padding:12px 16px; background:var(--cream); border-radius:12px; border:1px solid rgba(201,168,76,.2); font-size:13px; font-weight:600; color:var(--navy); transition:all .25s; }
        .uniHLItem:hover { background:var(--gold-pale); border-color:rgba(201,168,76,.5); transform:translateX(5px); }
        .hlDot { width:8px; height:8px; background:var(--gold); border-radius:50%; flex-shrink:0; }

        /* ── COMPARE ── */
        .compareGrid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:48px; }
        .compareCol { border-radius:var(--r-lg); overflow:hidden; box-shadow:var(--sh-md); }
        .compareHead { padding:20px 26px; font-weight:700; font-size:15px; display:flex; align-items:center; gap:10px; }
        .compareHead.bad  { background:#FFF0EE; color:#C0392B; }
        .compareHead.good { background:var(--navy); color:var(--gold); }
        .compareBody { background:#fff; }
        .compareRow { padding:14px 26px; border-bottom:1px solid #f4f4f2; display:flex; gap:14px; align-items:flex-start; font-size:14px; color:var(--text); line-height:1.55; transition:background .15s; }
        .compareRow:hover { background:#fafaf8; }
        .compareRow:last-child { border-bottom:none; }
        .ci { font-size:18px; flex-shrink:0; margin-top:1px; }

        /* ── FEATURE CARDS ── */
        .featIntroRow { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; margin-bottom:56px; }
        .featImgStack { position:relative; }
        .featImgMain { width:100%; height:320px; object-fit:cover; border-radius:var(--r-xl); box-shadow:var(--sh-xl); display:block; }
        .featBubble { position:absolute; bottom:-16px; right:-16px; width:160px; height:110px; border-radius:var(--r); overflow:hidden; box-shadow:0 12px 40px rgba(15,28,53,.25); border:3px solid #fff; }
        .featBubbleLabel { position:absolute; top:-12px; left:12px; z-index:3; background:var(--gold); color:var(--navy); font-size:10px; font-weight:800; padding:3px 10px; border-radius:50px; letter-spacing:.3px; }
        .featRoundBadge {
          position:absolute; top:-20px; left:50%; transform:translateX(-50%);
          width:64px; height:64px; border-radius:50%; background:var(--navy);
          display:flex; align-items:center; justify-content:center; border:3px solid var(--gold-pale);
          box-shadow:var(--sh-md); font-size:24px; z-index:2;
        }

        .featCards { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
        .featCard { border-radius:var(--r-lg); overflow:hidden; background:var(--white); border:1px solid rgba(0,0,0,.06); transition:transform .45s cubic-bezier(.16,1,.3,1),box-shadow .45s,border-color .3s; position:relative; cursor:pointer; }
        .featCard:hover { transform:translateY(-14px) scale(1.013); box-shadow:0 32px 72px rgba(15,28,53,.17); border-color:rgba(201,168,76,.35); }
        .fcImgWrap { height:240px; overflow:hidden; position:relative; }
        .fcImgWrap img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .65s cubic-bezier(.16,1,.3,1); }
        .featCard:hover .fcImgWrap img { transform:scale(1.1); }
        .fcImgOverlay { position:absolute; inset:0; background:linear-gradient(to bottom,transparent 25%,rgba(10,20,42,.75)); z-index:1; }
        .fcBadge { position:absolute; top:12px; right:12px; z-index:2; padding:4px 12px; border-radius:50px; font-size:11px; font-weight:700; letter-spacing:.3px; backdrop-filter:blur(8px); }
        .fcBadgeGreen  { background:rgba(0,168,120,.9); color:#fff; }
        .fcBadgeBlue   { background:rgba(80,110,240,.9); color:#fff; }
        .fcBadgeGold   { background:rgba(201,168,76,.95); color:var(--navy); }
        .fcBadgeRed    { background:rgba(220,70,70,.9); color:#fff; }
        .fcBadgeTeal   { background:rgba(0,175,175,.9); color:#fff; }
        .fcBadgePurple { background:rgba(120,70,220,.9); color:#fff; }
        .fcImgLabel { position:absolute; bottom:12px; left:14px; z-index:2; display:flex; align-items:center; gap:9px; }
        .fcImgIcon { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.2); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,.3); }
        .fcImgIcon svg { width:15px; height:15px; stroke:#fff; fill:none; stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round; }
        .fcImgTitle { font-size:13px; font-weight:700; color:#fff; text-shadow:0 1px 6px rgba(0,0,0,.5); }
        .fcBody { padding:20px 20px 24px; }
        .fcBody h3 { font-size:15px; font-weight:700; color:var(--navy); margin-bottom:8px; line-height:1.35; }
        .fcBody p  { font-size:13px; color:var(--text-mid); line-height:1.68; }
        .featCard::after { content:''; position:absolute; bottom:0; left:0; width:0; height:3px; transition:width .45s cubic-bezier(.16,1,.3,1); border-radius:0 0 var(--r-lg) var(--r-lg); }
        .featCard:hover::after { width:100%; }
        .featCard:nth-child(1)::after { background:var(--green); }
        .featCard:nth-child(2)::after { background:var(--violet); }
        .featCard:nth-child(3)::after { background:var(--gold); }
        .featCard:nth-child(4)::after { background:var(--rose); }
        .featCard:nth-child(5)::after { background:var(--green); }
        .featCard:nth-child(6)::after { background:#9B59B6; }

        /* ── EXAMS ── */
        .examsSection { background:var(--navy); padding:clamp(60px,8vw,100px) clamp(20px,5%,80px); position:relative; overflow:hidden; }
        .examsBlobBg { position:absolute; pointer-events:none; z-index:0; }
        .examsBlobBg1 { top:-120px; right:-80px; width:400px; height:400px; background:rgba(201,168,76,.08); border-radius:60% 40% 30% 70% / 60% 30% 70% 40%; animation:blobMorph 12s ease-in-out infinite; filter:blur(40px); }
        .examsBlobBg2 { bottom:-100px; left:-60px; width:300px; height:300px; background:rgba(0,168,120,.07); border-radius:40% 60% 60% 40% / 40% 60% 40% 60%; animation:blobMorph 14s ease-in-out infinite reverse; filter:blur(40px); }
        .examsGrid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:48px; position:relative; z-index:1; }
        .examCard { background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.09); border-radius:var(--r-lg); overflow:hidden; transition:all .38s cubic-bezier(.16,1,.3,1); }
        .examCard:hover { background:rgba(255,255,255,.1); border-color:rgba(201,168,76,.4); transform:translateY(-10px); box-shadow:0 28px 64px rgba(0,0,0,.38); }
        .examImgWrap { height:160px; overflow:hidden; position:relative; }
        .examImgWrap img { width:100%; height:160px; object-fit:cover; filter:brightness(.45) saturate(1.2); transition:transform .5s,filter .3s; display:block; }
        .examCard:hover .examImgWrap img { transform:scale(1.08); filter:brightness(.58) saturate(1.3); }
        .examOverlay { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:flex-end; padding:16px 20px; background:linear-gradient(to top,rgba(15,28,53,.7),transparent); }
        .examLogo { font-family:'Playfair Display',serif; font-size:38px; font-weight:900; color:#fff; line-height:1; }
        .examTitle { font-size:11px; color:rgba(255,255,255,.55); margin-top:4px; line-height:1.4; }
        .examPurpose { display:inline-block; margin-top:10px; padding:4px 12px; background:rgba(201,168,76,.9); border-radius:50px; font-size:11px; color:var(--navy); font-weight:700; }
        /* Round badge on exam card */
        .examRoundBadge { position:absolute; top:12px; right:12px; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; background:rgba(255,255,255,.15); backdrop-filter:blur(8px); }
        .examBody { padding:18px 20px 22px; }
        .examSkill { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,.05); font-size:13px; color:rgba(255,255,255,.65); }
        .examSkill:last-child { border-bottom:none; }
        .sdot  { width:6px; height:6px; border-radius:50%; background:var(--green); flex-shrink:0; }
        .sdotG { background:var(--gold); }

        /* ── AI SECTION ── */
        .aiInner { display:grid; grid-template-columns:1fr 1fr; gap:72px; align-items:start; }
        .aiMockup { background:var(--navy); border-radius:var(--r-lg); overflow:hidden; box-shadow:var(--sh-xl); border:1px solid rgba(255,255,255,.06); }
        .aiBar { background:rgba(0,0,0,.3); padding:14px 18px; display:flex; align-items:center; gap:8px; border-bottom:1px solid rgba(255,255,255,.06); }
        .dRow{display:flex;gap:6px}
        .dR{width:10px;height:10px;border-radius:50%;background:#FF5F57}
        .dY{width:10px;height:10px;border-radius:50%;background:#FFBD2E}
        .dG{width:10px;height:10px;border-radius:50%;background:#28CA41}
        .aiBarTitle { margin-left:10px; font-size:12px; color:rgba(255,255,255,.3); }
        /* Waveform indicator */
        .aiWave { display:flex; align-items:center; gap:2px; margin-left:auto; }
        .aiWaveLine { width:3px; border-radius:2px; background:var(--green); animation:waveform .8s ease-in-out infinite; }
        .aiWaveLine:nth-child(2){animation-delay:.1s}
        .aiWaveLine:nth-child(3){animation-delay:.2s}
        .aiWaveLine:nth-child(4){animation-delay:.3s}
        .aiWaveLine:nth-child(5){animation-delay:.4s}
        .aiChat { padding:20px; display:flex; flex-direction:column; gap:14px; }
        .bubble { max-width:84%; padding:13px 17px; border-radius:18px; font-size:13px; line-height:1.58; }
        .bUser { background:var(--gold); color:var(--navy); font-weight:500; align-self:flex-end; border-bottom-right-radius:4px; }
        .bAi   { background:rgba(255,255,255,.08); color:rgba(255,255,255,.8); align-self:flex-start; border-bottom-left-radius:4px; border:1px solid rgba(255,255,255,.09); }
        .bAi strong { color:var(--gold); }
        .cLabel  { font-size:11px; color:rgba(255,255,255,.24); font-weight:600; letter-spacing:.5px; text-transform:uppercase; margin-bottom:-8px; }
        .cLabelR { text-align:right; }
        .aiDashSnap { margin:0 16px 16px; border-radius:var(--r-sm); overflow:hidden; }
        .aiDashSnap img { width:100%; display:block; height:130px; object-fit:cover; }
        .aiFeats { margin-top:32px; display:flex; flex-direction:column; gap:20px; }
        .aiFeatRow { display:flex; gap:16px; align-items:flex-start; transition:transform .28s cubic-bezier(.16,1,.3,1); }
        .aiFeatRow:hover { transform:translateX(6px); }
        .aiFeatIcon { width:44px; height:44px; border-radius:50%; background:var(--white); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:var(--sh-sm); transition:all .28s; }
        .aiFeatIcon svg { width:18px; height:18px; stroke:var(--navy); fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
        .aiFeatRow:hover .aiFeatIcon { background:var(--navy); border-color:var(--navy); }
        .aiFeatRow:hover .aiFeatIcon svg { stroke:var(--gold); }
        .aiFeatText h4 { font-size:14px; font-weight:700; color:var(--navy); margin-bottom:3px; }
        .aiFeatText p  { font-size:13px; color:var(--text-mid); line-height:1.55; }

        /* ── GALLERY ── */
        .galleryHeadRow { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
        /* Masonry-inspired gallery */
        .galleryGrid { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:200px 200px; gap:16px; }
        .galleryItem { border-radius:var(--r); overflow:hidden; position:relative; cursor:pointer; }
        .galleryItem:first-child { grid-column:span 2; grid-row:span 2; }
        .galleryItem img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .5s cubic-bezier(.16,1,.3,1); }
        .galleryItem:hover img { transform:scale(1.08); }
        .galleryOverlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(15,28,53,.7),transparent 55%); opacity:0; transition:opacity .3s; display:flex; align-items:flex-end; padding:16px 18px; }
        .galleryItem:hover .galleryOverlay { opacity:1; }
        .galleryOText { font-size:13px; font-weight:600; color:rgba(255,255,255,.92); }

        /* ── PLATFORM TABLE ── */
        .platformSection { background:var(--white); padding:clamp(60px,8vw,100px) clamp(20px,5%,80px); }
        .platformTable { width:100%; border-radius:var(--r-lg); overflow:hidden; box-shadow:var(--sh-md); margin-top:48px; border-collapse:collapse; }
        .platformTable thead tr { background:var(--navy); }
        .platformTable thead th { padding:16px 24px; text-align:left; font-size:13px; font-weight:700; color:rgba(255,255,255,.5); letter-spacing:.6px; text-transform:uppercase; }
        .platformTable thead th.thEH { color:var(--gold); font-size:14px; }
        .platformTable tbody tr { border-bottom:1px solid #f0f0ee; transition:background .15s; }
        .platformTable tbody tr:last-child { border-bottom:none; }
        .platformTable tbody tr:hover { background:#fafaf8; }
        .platformTable td { padding:14px 24px; font-size:14px; color:var(--text); }
        .platformTable td:first-child { font-weight:500; }
        .chkY  { color:var(--green); font-size:17px; }
        .chkN  { color:#ddd; font-size:17px; }
        .chkEH { color:var(--gold); font-weight:800; font-size:19px; }

        /* ── HOW IT WORKS — TIMELINE ── */
        .stepsSection { background:var(--navy); padding:clamp(60px,8vw,100px) clamp(20px,5%,80px); position:relative; overflow:hidden; }
        .stepsNetBg { position:absolute; inset:0; pointer-events:none; opacity:.07; }
        .stepsHeader { text-align:center; margin-bottom:72px; position:relative; z-index:1; }
        .aiTimeline { position:relative; z-index:1; display:flex; flex-direction:column; }
        .timelineSpine { position:absolute; left:50%; top:32px; bottom:32px; width:2px; background:linear-gradient(to bottom,transparent,rgba(201,168,76,.5) 10%,rgba(201,168,76,.5) 90%,transparent); transform:translateX(-50%); z-index:0; }
        .timelineRow { display:grid; grid-template-columns:1fr 90px 1fr; align-items:center; min-height:130px; }
        .tlCard { padding:22px 26px; background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.1); border-radius:var(--r-lg); backdrop-filter:blur(8px); transition:all .38s cubic-bezier(.16,1,.3,1); }
        .tlCard:hover { background:rgba(255,255,255,.1); border-color:rgba(201,168,76,.4); transform:scale(1.025); box-shadow:0 14px 44px rgba(0,0,0,.3); }
        .tlCardLeft  { text-align:right; margin-right:18px; }
        .tlCardRight { text-align:left;  margin-left:18px; }
        .tlTag { display:inline-block; padding:3px 11px; border-radius:50px; font-size:11px; font-weight:700; letter-spacing:.4px; margin-bottom:8px; }
        .tlCard h3 { font-size:15px; font-weight:700; color:#fff; margin-bottom:5px; }
        .tlCard p  { font-size:13px; color:rgba(255,255,255,.5); line-height:1.62; }
        .tlEmpty { visibility:hidden; }
        .tlNode { display:flex; flex-direction:column; align-items:center; position:relative; z-index:2; }
        /* Organic node shapes */
        .tlNodeCircle { width:66px; height:66px; display:flex; align-items:center; justify-content:center; transition:all .38s cubic-bezier(.16,1,.3,1); cursor:pointer; position:relative; }
        .tlNodeBg {
  position:absolute; inset:0; border-radius:50%;
  background:transparent;
  border:2.5px solid rgba(201,168,76,.6);
  transition:all .38s;
}
.tlNodeCircle:hover .tlNodeBg {
  background:var(--gold);
  border-color:var(--gold);
  transform:scale(1.1);
}
.tlNodeNum {
  font-family:'Playfair Display',serif;
  font-size:20px; font-weight:900;
  color:var(--gold);
  position:relative; z-index:1;
  transition:color .3s;
  letter-spacing:1px;
}
.tlNodeCircle:hover .tlNodeNum { color:var(--navy); }
.tlNumBadge { display:none; }
        .aiChip { display:inline-flex; align-items:center; gap:10px; padding:11px 24px; background:rgba(255,255,255,.07); border:1px solid rgba(201,168,76,.25); border-radius:50px; font-size:13px; font-weight:600; color:rgba(255,255,255,.72); margin:52px auto 0; position:relative; z-index:1; }
        .aiChipDot { width:7px; height:7px; border-radius:50%; background:var(--green); animation:pulse 2s infinite; }

        /* ── TESTIMONIALS ── */
        .testiSection { background:var(--cream); padding:clamp(60px,8vw,100px) clamp(20px,5%,80px); }
        .testiGrid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:48px; }
        .testiCard { background:var(--white); border:1px solid var(--border); border-radius:var(--r-lg); padding:30px 26px; transition:all .35s cubic-bezier(.16,1,.3,1); position:relative; overflow:hidden; box-shadow:var(--sh-sm); }
        .testiCard::before { content:'\u201C'; position:absolute; top:-6px; right:20px; font-family:'Playfair Display',serif; font-size:100px; color:rgba(201,168,76,.1); line-height:1; pointer-events:none; }
        /* Round accent blob */
        .testiBlob { position:absolute; top:-30px; left:-30px; width:100px; height:100px; border-radius:60% 40% 30% 70% / 60% 30% 70% 40%; opacity:.06; pointer-events:none; }
        .testiCard:hover { transform:translateY(-8px); box-shadow:var(--sh-xl); border-color:rgba(201,168,76,.35); }
        .stars { color:var(--gold); font-size:14px; margin-bottom:16px; display:flex; gap:3px; }
        .quoteText { font-size:14px; color:var(--text-mid); line-height:1.8; margin-bottom:22px; font-style:italic; }
        .testiAuthor { display:flex; align-items:center; gap:12px; }
        .avatar { width:46px; height:46px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0; }
        .avatarGold  { background:rgba(201,168,76,.15); color:var(--gold); border:2px solid rgba(201,168,76,.3); }
        .avatarGreen { background:rgba(0,168,120,.15); color:#00A878; border:2px solid rgba(0,168,120,.3); }
        .avatarBlue  { background:rgba(100,120,240,.15); color:#6478f0; border:2px solid rgba(100,120,240,.3); }
        .authorName { font-size:14px; font-weight:700; color:var(--navy); }
        .authorRole { font-size:12px; color:var(--text-mid); }

        /* ── FAQ ── */
        .faqSection { background:var(--white); padding:clamp(60px,8vw,100px) clamp(20px,5%,80px); }
        .faqGrid { display:grid; grid-template-columns:1fr 1fr; gap:60px; margin-top:48px; align-items:start; }
        .faqList { display:flex; flex-direction:column; gap:12px; }
        .faqItem { background:var(--cream); border:1px solid var(--border); border-radius:var(--r); padding:18px 22px; cursor:pointer; transition:all .22s cubic-bezier(.16,1,.3,1); }
        .faqItem:hover { border-color:rgba(201,168,76,.4); box-shadow:var(--sh-md); }
        .faqOpen { border-color:var(--gold) !important; box-shadow:0 4px 22px rgba(201,168,76,.12) !important; background:var(--white); }
        .faqQ { display:flex; justify-content:space-between; align-items:center; gap:12px; }
        .faqQ span:first-child { font-size:14px; font-weight:600; color:var(--navy); line-height:1.45; }
        .faqIcon { font-size:20px; color:var(--gold); font-weight:700; flex-shrink:0; line-height:1; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:var(--gold-pale); }
        .faqA { margin-top:12px; font-size:13.5px; color:var(--text-mid); line-height:1.75; padding-top:12px; border-top:1px solid #f0ead8; }
        .faqContact { background:var(--navy); border-radius:var(--r-lg); padding:40px 36px; display:flex; flex-direction:column; gap:22px; position:relative; overflow:hidden; }
        .faqContactBlob { position:absolute; top:-60px; right:-60px; width:200px; height:200px; background:rgba(201,168,76,.08); border-radius:60% 40% 30% 70% / 60% 30% 70% 40%; animation:blobMorph 10s ease-in-out infinite; pointer-events:none; }
        .faqContact h3 { font-family:'Playfair Display',serif; font-size:28px; font-weight:800; color:#fff; line-height:1.25; position:relative; }
        .faqContact p  { font-size:14px; color:rgba(255,255,255,.5); line-height:1.72; position:relative; }
        .faqContactItems { display:flex; flex-direction:column; gap:14px; position:relative; }
        .faqContactItem { display:flex; align-items:center; gap:14px; padding:14px 18px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.09); border-radius:var(--r); transition:all .25s; }
        .faqContactItem:hover { background:rgba(255,255,255,.1); border-color:rgba(201,168,76,.3); }
        .faqContactIcon { width:36px; height:36px; border-radius:50%; background:rgba(201,168,76,.15); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
        .faqContactText { font-size:13px; color:rgba(255,255,255,.7); }
        .faqContactText strong { color:#fff; display:block; font-size:14px; margin-bottom:1px; }

        /* ── CTA ── */
        .ctaSection { background:var(--gold); padding:clamp(60px,8vw,100px) clamp(20px,5%,80px); text-align:center; position:relative; overflow:hidden; }
        .ctaBlobL { position:absolute; top:-80px; left:-60px; width:320px; height:320px; background:rgba(255,255,255,.15); border-radius:60% 40% 30% 70% / 60% 30% 70% 40%; animation:blobMorph 10s ease-in-out infinite; pointer-events:none; }
        .ctaBlobR { position:absolute; bottom:-80px; right:-60px; width:260px; height:260px; background:rgba(15,28,53,.08); border-radius:40% 60% 60% 40% / 40% 60% 40% 60%; animation:blobMorph 13s ease-in-out infinite reverse; pointer-events:none; }
        .ctaSection h2 { font-family:'Playfair Display',serif; font-size:clamp(30px,4vw,46px); font-weight:900; color:var(--navy); margin-bottom:16px; line-height:1.18; position:relative; }
        .ctaSection > div > p { font-size:17px; color:rgba(15,28,53,.62); margin-bottom:36px; position:relative; max-width:600px; margin-left:auto; margin-right:auto; }
        .ctaBtns { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; position:relative; }
        .ctaDark { padding:16px 32px; background:var(--navy); color:#fff; border-radius:50px; font-size:15px; font-weight:700; text-decoration:none; transition:all .32s cubic-bezier(.34,1.56,.64,1); font-family:'DM Sans',sans-serif; display:inline-flex; align-items:center; gap:9px; }
        .ctaDark:hover { background:var(--navy-mid); transform:translateY(-4px) scale(1.04); box-shadow:0 12px 36px rgba(15,28,53,.45); }
        .ctaOutline { padding:16px 32px; border:2px solid rgba(15,28,53,.24); color:var(--navy); border-radius:50px; font-size:15px; font-weight:600; text-decoration:none; transition:all .28s; font-family:'DM Sans',sans-serif; display:inline-flex; align-items:center; gap:9px; }
        .ctaOutline:hover { border-color:var(--navy); transform:translateY(-3px); }
        .ctaNoteRow { margin-top:22px; font-size:13px; color:rgba(15,28,53,.5); display:flex; align-items:center; justify-content:center; gap:20px; flex-wrap:wrap; position:relative; }
        .ctaCheck { display:inline-flex; align-items:center; gap:6px; }
        .ctaCheckCircle { width:17px; height:17px; background:var(--navy); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:var(--gold); flex-shrink:0; }

        /* ── FOOTER ── */
        .footer { background:var(--navy); padding:clamp(48px,6vw,72px) clamp(20px,5%,80px) 28px; }
        .footerGrid { max-width:1280px; margin:0 auto; display:grid; grid-template-columns:2fr 1fr 1fr 1.5fr; gap:48px; margin-bottom:48px; }
        .fBrand { font-family:'Playfair Display',serif; font-size:24px; font-weight:900; color:#fff; margin-bottom:12px; }
        .fBrand span { color:var(--gold); }
        .fBrandDesc { font-size:13.5px; color:rgba(255,255,255,.38); line-height:1.78; margin-bottom:22px; }
        .fContacts { display:flex; flex-direction:column; gap:9px; }
        .fContactItem { display:flex; align-items:center; gap:9px; font-size:13px; color:rgba(255,255,255,.38); transition:color .2s; }
        .fContactItem:hover { color:rgba(255,255,255,.65); }
        .fColH { font-size:11px; font-weight:700; color:var(--gold); text-transform:uppercase; letter-spacing:1.4px; margin-bottom:18px; }
        .fLinks { list-style:none; display:flex; flex-direction:column; gap:10px; }
        .fLinks a { text-decoration:none; font-size:13.5px; color:rgba(255,255,255,.4); transition:all .22s; }
        .fLinks a:hover { color:var(--gold); padding-left:5px; }
        .footerBottom { max-width:1280px; margin:0 auto; padding-top:24px; border-top:1px solid rgba(255,255,255,.07); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; }
        .footerBottom p { font-size:13px; color:rgba(255,255,255,.24); }
        .techBadges { display:flex; gap:8px; flex-wrap:wrap; }
        .techBadge { padding:4px 12px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.09); border-radius:50px; font-size:11px; color:rgba(255,255,255,.32); font-weight:600; transition:all .2s; }
        .techBadge:hover { background:rgba(255,255,255,.1); color:rgba(255,255,255,.6); }

        /* ── SEO HELPERS (hidden visually) ── */
        .srOnly { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

        /* ── RESPONSIVE ── */
        @media(max-width:1024px){
          .heroInner { grid-template-columns:1fr; gap:48px; }
          .heroCardsGrid { grid-template-columns:repeat(2,1fr); }
          .heroCard:nth-child(2),.heroCard:nth-child(4) { margin-top:0; }
          .uniGrid,.aiInner { grid-template-columns:1fr; gap:44px; }
          .featIntroRow { grid-template-columns:1fr; gap:36px; }
          .featBubble { display:none; }
          .faqGrid { grid-template-columns:1fr; gap:40px; }
          .footerGrid { grid-template-columns:1fr 1fr; gap:36px; }
        }
        @media(max-width:768px){
          .navLinks { display:none; }
          .navActions { display:none; }
          .navBurger { display:flex; }
          .statsInner { grid-template-columns:repeat(2,1fr); }
          .statItem:nth-child(2) { border-right:none; }
          .examsGrid,.testiGrid,.featCards { grid-template-columns:1fr; }
          .compareGrid { grid-template-columns:1fr; }
          .galleryGrid { grid-template-columns:1fr 1fr; grid-template-rows:auto; }
          .galleryItem:first-child { grid-column:span 2; grid-row:span 1; }
          .galleryItem img { height:180px; }
          .galleryItem:first-child img { height:220px; }
          .platformTable thead th:nth-child(4),.platformTable td:nth-child(4) { display:none; }
          .timelineSpine { display:none; }
          .timelineRow { grid-template-columns:1fr; gap:10px; }
          .tlEmpty { display:none; }
          .tlCardLeft,.tlCardRight { text-align:left; margin:0; }
          .tlNode { flex-direction:row; justify-content:flex-start; }
          .uniHL { grid-template-columns:1fr; }
          .uniBadgeCard { position:static; margin-top:20px; width:fit-content; }
          .uniBlob { display:none; }
          .footerGrid { grid-template-columns:1fr; }
          .footerBottom { flex-direction:column; align-items:flex-start; }
        }
        @media(max-width:480px){
          .heroCardsGrid { grid-template-columns:1fr; }
          .statsInner { grid-template-columns:1fr 1fr; }
          .galleryGrid { grid-template-columns:1fr; }
          .galleryItem:first-child { grid-column:span 1; }
          .ctaBtns { flex-direction:column; align-items:center; }
          .heroCta { flex-direction:column; }
          .platformTable thead th:nth-child(3),.platformTable td:nth-child(3) { display:none; }
        }
      `}</style>

      {/* ── SEO: hidden h1 for crawlers if needed ── */}
      <h1 className="srOnly">EnglishHub — Nền tảng học tiếng Anh tích hợp AI Gemini dành cho sinh viên Đại học Thái Bình, hỗ trợ VSTEP B1, TOEIC, APTIS</h1>

      {/* ── NAV ── */}
      <Nav />

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="hero" aria-label="Giới thiệu EnglishHub">
        <div className="heroBgImg" aria-hidden="true">
          <img src="/assets/index/Hero.jpg" alt="" role="presentation" />
        </div>
        <div className="heroBg" aria-hidden="true" />
        <div className="heroDots" aria-hidden="true" />
        {/* Orbs */}
        <div className="orb orb1" aria-hidden="true" />
        <div className="orb orb2" aria-hidden="true" />
        <div className="orb orb3" aria-hidden="true" />
        {/* Rings */}
        {[{s:320,t:'8%',r:'4%',d:'0s'},{s:210,t:'55%',l:'5%',d:'1.8s'},{s:160,t:'30%',r:'22%',d:'3.5s'}].map((r,i) => (
          <div key={i} className="ring" aria-hidden="true" style={{width:r.s,height:r.s,top:r.t,right:(r as any).r,left:(r as any).l,animationDelay:r.d}} />
        ))}

        <div className="heroInner">
          {/* Left copy */}
          <div>
            <div className="heroBadge">
              <span className="heroBadgeDot" aria-hidden="true" />
              AI Gemini miễn phí · VSTEP · TOEIC · APTIS
            </div>
            <h2 className="heroH1">
              Nền tảng học<br />
              tiếng Anh <em className="heroH1Em">toàn diện</em><br />
              tích hợp <em className="heroH1Em2">AI</em>
            </h2>
            <p className="heroDesc">
              Từ vựng SRS thông minh, luyện thi 3 chứng chỉ quốc tế, AI Gemini giải thích 24/7 —
              tất cả miễn phí dành riêng cho sinh viên{' '}
              <strong style={{ color: 'rgba(255,255,255,.9)' }}>Trường Đại học Thái Bình</strong>.
            </p>
            <div className="heroCta">
              <Link href="/register" className="ctaPrimary">
                <IconRocket />
                Đăng ký miễn phí
              </Link>
              <a href="#features" className="ctaSecondary">
                <IconPlay />
                Xem tính năng
              </a>
            </div>
            <p className="heroNote">✓ Hoàn toàn miễn phí &nbsp;·&nbsp; ✓ Không cần thẻ tín dụng &nbsp;·&nbsp; ✓ Đăng ký trong 1 phút</p>
            <div className="mssvBadge">
              <IconShield />
              Có MSSV? Thêm khi đăng ký để nhận nhãn <strong style={{ marginLeft: 4 }}>✓ Sinh viên đã xác thực</strong>
            </div>
          </div>

          {/* Right: organic icon cards */}
          <div className="heroCardsGrid" role="list" aria-label="Tính năng nổi bật">
            {heroCards.map((c, i) => (
              <div key={i} className="heroCard" role="listitem">
                <div className={`cardIcon ${c.cls}`}>
                  {c.shape === 'circle'   && <div className="icon-bg-circle" />}
                  {c.shape === 'blob'     && <div className="icon-bg-blob" />}
                  {c.shape === 'squircle' && <div className="icon-bg-squircle" />}
                  {c.shape === 'triangle' && <div className="icon-bg-diamond" />}
                  <svg className="icon-svg" viewBox="0 0 24 24">{c.svg}</svg>
                </div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="statsBar" role="region" aria-label="Số liệu nổi bật">
        <div className="statsInner">
          {stats.map((s, i) => <AnimatedStat key={i} num={s.num} label={s.label} icon={s.icon} />)}
        </div>
      </div>

      {/* ══════════════════ UNIVERSITY ══════════════════ */}
      <section className="sec" style={{ background: 'var(--white)' }} aria-labelledby="uni-heading">
        <div className="inner">
          <div className="uniGrid">
            <Reveal cls="reveal-left">
              <div className="uniImgWrap">
                <div className="uniBlob" aria-hidden="true" />
                <img src="/assets/index/TBU.jpg" alt="Trường Đại học Thái Bình — khuôn viên chính" className="uniImgMain" />
                <div className="uniBadgeCard" aria-hidden="true">
                  <div className="uniBadgeCircle">🏛️</div>
                  <div className="uniBadgeText">
                    Trường Đại học Thái Bình
                    <span>Phường Thái Bình, Hưng Yên</span>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal cls="reveal-right" delay={100}>
              <div className="uniContent">
                <div className="tag">Về chúng tôi</div>
                <h2 id="uni-heading">Xây dựng cho sinh viên{' '}<span style={{ color: 'var(--gold)', display: 'block' }}>Trường Đại học Thái Bình</span></h2>
                <p>EnglishHub ra đời từ một bài toán thực tế: sinh viên Trường Đại học Thái Bình cần đạt chuẩn <strong>VSTEP B1</strong> để tốt nghiệp, nhưng thiếu công cụ học tập phù hợp, miễn phí và được cá nhân hóa.</p>
                <p>Dự án được phát triển trong khuôn khổ <strong>Khóa luận tốt nghiệp 2024–2025</strong> của Khoa Công nghệ Thông tin, hướng đến giải quyết đúng nhu cầu của sinh viên trong trường và cộng đồng người học.</p>
                <p>Đăng ký bằng <strong>email</strong> — nhanh chóng, đơn giản. Thêm <strong>MSSV</strong> để nhận nhãn xác thực sinh viên Trường Đại học Thái Bình. Không cần thẻ tín dụng, hoàn toàn miễn phí.</p>
                <div className="uniHL stagger">
                  {uniHighlights.map((h, i) => (
                    <div key={i} className="uniHLItem"><div className="hlDot" />{h}</div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════ COMPARE ══════════════════ */}
      <section className="sec" style={{ background: 'var(--cream)' }} aria-labelledby="compare-heading">
        <div className="inner">
          <Reveal>
            <div style={{ maxWidth: 560 }}>
              <div className="tag">Tại sao EnglishHub?</div>
              <h2 id="compare-heading" className="h2">Vượt qua giới hạn của các <span className="g">nền tảng hiện tại</span></h2>
              <p className="sub">Các ứng dụng phổ biến phục vụ tốt một mục tiêu nhưng thiếu hoàn toàn các nhu cầu còn lại. EnglishHub giải quyết tất cả trong một nơi duy nhất.</p>
            </div>
          </Reveal>
          <div className="compareGrid">
            <Reveal cls="reveal-left" delay={80}>
              <div className="compareCol">
                <div className="compareHead bad">❌ &nbsp;Vấn đề hiện tại</div>
                <div className="compareBody">
                  {problems.map((p, i) => <div key={i} className="compareRow"><span className="ci">{p.icon}</span>{p.text}</div>)}
                </div>
              </div>
            </Reveal>
            <Reveal cls="reveal-right" delay={180}>
              <div className="compareCol">
                <div className="compareHead good">✓ &nbsp;EnglishHub giải quyết</div>
                <div className="compareBody">
                  {solutions.map((s, i) => <div key={i} className="compareRow"><span className="ci">{s.icon}</span>{s.text}</div>)}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section className="sec" id="features" style={{ background: 'var(--white)' }} aria-labelledby="features-heading">
        <div className="inner">
          <div className="featIntroRow">
            <Reveal cls="reveal-left">
              <div>
                <div className="tag">Tính năng</div>
                <h2 id="features-heading" className="h2">Mọi thứ bạn cần để <span className="g">chinh phục tiếng Anh</span></h2>
                <p className="sub">6 module tích hợp AI chặt chẽ, hỗ trợ toàn bộ hành trình từ cơ bản đến chứng chỉ quốc tế.</p>
                <Link href="/register" className="ctaPrimary" style={{ display: 'inline-flex', marginTop: 28, background: 'var(--navy)', color: '#fff' }}>
                  <IconRocket size={16} />
                  Khám phá ngay
                </Link>
              </div>
            </Reveal>
            <Reveal cls="reveal-right" delay={150}>
              <div className="featImgStack">
                <img src="/assets/index/Language.jpg" alt="Học tiếng Anh hiệu quả với EnglishHub" className="featImgMain" />
                <div className="featBubble">
                  <div className="featBubbleLabel">Dashboard AI</div>
                  <img src={UNSPLASH.dashPreview} alt="Dashboard preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal cls="stagger reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 } as React.CSSProperties}>
            {features.map((f, i) => (
              <article key={i} className="featCard">
                <div className="fcImgWrap">
                  <img src={f.img} alt={f.title} loading="lazy" />
                  <div className="fcImgOverlay" aria-hidden="true" />
                  <span className={`fcBadge ${f.badgeCls}`}>{f.badge}</span>
                  <div className="fcImgLabel">
                    <div className="fcImgIcon"><svg viewBox="0 0 24 24">{f.iconSvg}</svg></div>
                    <span className="fcImgTitle">{f.title}</span>
                  </div>
                </div>
                <div className="fcBody">
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ══════════════════ EXAMS ══════════════════ */}
      <section className="examsSection" id="exams" aria-labelledby="exams-heading">
        <div className="examsBlobBg examsBlobBg1" aria-hidden="true" />
        <div className="examsBlobBg examsBlobBg2" aria-hidden="true" />
        <div className="inner" style={{ position: 'relative', zIndex: 1 }}>
          <Reveal>
            <div style={{ maxWidth: 560 }}>
              <div className="tagDark">Luyện thi chứng chỉ</div>
              <h2 id="exams-heading" className="h2 h2w">3 chứng chỉ · <span className="g">1 nền tảng</span></h2>
              <p className="sub subD">Đề mẫu riêng từng loại chứng chỉ, phân tích điểm mạnh yếu chi tiết sau mỗi bài thi, và AI Gemini hỗ trợ giải thích ngay trong khi làm bài.</p>
            </div>
          </Reveal>
          <Reveal cls="stagger reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginTop: 48 } as React.CSSProperties}>
            {exams.map((e, i) => (
              <article key={i} className="examCard">
                <div className="examImgWrap">
                  <img src={e.imgSrc} alt={`Luyện thi ${e.logo}`} loading="lazy" />
                  <span className="examRoundBadge" aria-hidden="true">{['🎓','💼','✈️'][i]}</span>
                  <div className="examOverlay">
                    <div>
                      <div className="examLogo">{e.logo}</div>
                      <div className="examTitle">{e.name}</div>
                      <div className="examPurpose">{e.purpose}</div>
                    </div>
                  </div>
                </div>
                <div className="examBody">
                  {e.skills.map((s, j) => (
                    <div key={j} className="examSkill">
                      <div className={s.gold ? 'sdot sdotG' : 'sdot'} />
                      {s.text}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ══════════════════ AI SECTION ══════════════════ */}
      <section className="sec" id="ai" style={{ background: 'var(--cream)' }} aria-labelledby="ai-heading">
        <div className="inner">
          <div className="aiInner">
            <Reveal cls="reveal-left">
              <div>
                <div className="aiMockup" role="img" aria-label="Demo giao diện AI chat EnglishHub">
                  <div className="aiBar">
                    <div className="dRow"><div className="dR" /><div className="dY" /><div className="dG" /></div>
                    <div className="aiBarTitle">AI Gemini — EnglishHub Chat</div>
                    <div className="aiWave" aria-hidden="true">
                      {[10,16,8,18,12].map((h,i) => <div key={i} className="aiWaveLine" style={{height:h}} />)}
                    </div>
                  </div>
                  <div className="aiChat">
                    <div className="cLabel cLabelR">Bạn</div>
                    <div className="bubble bUser">Từ &quot;perseverance&quot; nghĩa là gì và cách dùng trong câu TOEIC?</div>
                    <div className="cLabel">AI Gemini</div>
                    <div className="bubble bAi">
                      <strong>Perseverance</strong> (n) — <em>sự kiên trì, bền chí</em>.<br /><br />
                      📌 Ví dụ TOEIC: <em>&quot;Her perseverance in learning English led to a promotion.&quot;</em><br /><br />
                      💡 Mẹo nhớ: &quot;per-&quot; (xuyên qua) + &quot;severe&quot; (khắc nghiệt) = <strong>kiên trì vượt khó</strong>
                    </div>
                    <div className="cLabel cLabelR">Bạn</div>
                    <div className="bubble bUser">Chấm bài Writing VSTEP của tôi được không?</div>
                    <div className="bubble bAi">
                      Tất nhiên! Dán bài của bạn vào đây, tôi sẽ nhận xét:<br />
                      ✓ Nội dung &amp; ý tưởng &nbsp;·&nbsp; ✓ Ngữ pháp &nbsp;·&nbsp; ✓ Từ vựng &nbsp;·&nbsp; ✓ Cấu trúc
                    </div>
                  </div>
                </div>
                <div className="aiDashSnap" style={{ marginTop: 16 }}>
                  <img src={UNSPLASH.dashFull} alt="Dashboard tiến độ học tập 4 kỹ năng" loading="lazy" />
                </div>
              </div>
            </Reveal>

            <Reveal cls="reveal-right" delay={120}>
              <div>
                <div className="tag">AI Gemini miễn phí</div>
                <h2 id="ai-heading" className="h2">Trợ lý học tập <span className="g">thông minh 24/7</span></h2>
                <p className="sub">Tích hợp Google Gemini 2.0 Flash — hoàn toàn miễn phí, không cần thẻ tín dụng. Hỗ trợ hoàn toàn bằng tiếng Việt.</p>
                <div className="aiFeats stagger">
                  {aiFunctions.map((f, i) => (
                    <div key={i} className="aiFeatRow">
                      <div className="aiFeatIcon"><svg viewBox="0 0 24 24">{f.svg}</svg></div>
                      <div className="aiFeatText">
                        <h4>{f.title}</h4>
                        <p>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════ GALLERY ══════════════════ */}
      <section className="sec" style={{ background: 'var(--white)', paddingTop: 56, paddingBottom: 56 }} aria-labelledby="gallery-heading">
        <div className="inner">
          <div className="galleryHeadRow">
            <div>
              <div className="tag">Cộng đồng học tập</div>
              <h2 id="gallery-heading" className="h2" style={{ marginBottom: 0 }}>Sinh viên <span className="g">EnglishHub</span></h2>
            </div>
            <Link href="/register" className="ctaPrimary" style={{ background: 'var(--navy)', color: '#fff', whiteSpace: 'nowrap' }}>
              <IconUsers />
              Tham gia ngay
            </Link>
          </div>
          <div className="galleryGrid">
            {galleryPhotos.map((p, i) => (
              <div key={i} className="galleryItem">
                <img src={p.src} alt={p.alt} loading="lazy" />
                <div className="galleryOverlay" aria-hidden="true">
                  <span className="galleryOText">{p.alt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ PLATFORM ══════════════════ */}
      <section className="platformSection" aria-labelledby="platform-heading">
        <div className="inner">
          <Reveal>
            <div style={{ maxWidth: 560 }}>
              <div className="tag">So sánh nền tảng</div>
              <h2 id="platform-heading" className="h2">EnglishHub vs <span className="g">các ứng dụng khác</span></h2>
              <p className="sub">Tại sao sinh viên Trường Đại học Thái Bình chọn EnglishHub thay vì Duolingo hay app TOEIC đơn thuần?</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <table className="platformTable">
              <caption className="srOnly">So sánh tính năng giữa EnglishHub, Duolingo và App TOEIC</caption>
              <thead>
                <tr>
                  <th scope="col">Tính năng</th>
                  <th scope="col" className="thEH">✦ EnglishHub</th>
                  <th scope="col">Duolingo</th>
                  <th scope="col">App TOEIC</th>
                </tr>
              </thead>
              <tbody>
                {platformRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.feature}</td>
                    <td><span className="chkEH" aria-label="Có">✓</span></td>
                    <td><span className={r.duolingo ? 'chkY' : 'chkN'} aria-label={r.duolingo ? 'Có' : 'Không'}>{r.duolingo ? '✓' : '✗'}</span></td>
                    <td><span className={r.toeicApp ? 'chkY' : 'chkN'} aria-label={r.toeicApp ? 'Có' : 'Không'}>{r.toeicApp ? '✓' : '✗'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section className="stepsSection" id="how" aria-labelledby="how-heading">
        {/* SVG network background */}
        <svg className="stepsNetBg" viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {[[600,60],[600,200],[600,340],[600,480],[200,130],[400,130],[800,130],[1000,130],[200,270],[400,270],[800,270],[1000,270],[200,410],[400,410],[800,410],[1000,410]].map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r="4" fill="#C8A84B" opacity=".8" />
          ))}
          {[[600,60,200,130],[600,60,800,130],[600,200,400,130],[600,200,800,270],[600,340,400,270],[600,340,800,410],[600,480,200,410],[600,480,1000,410]].map(([x1,y1,x2,y2],i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C8A84B" strokeWidth="1" opacity=".6" strokeDasharray="1000" style={{animation:`drawLine 2s ease ${i*0.2}s both`}} />
          ))}
        </svg>

        <div className="inner">
          <div className="stepsHeader">
            <div className="tagDark">Cách hoạt động</div>
            <h2 id="how-heading" className="h2 h2w">Bắt đầu trong <span className="g">4 bước đơn giản</span></h2>
            <p className="sub subD" style={{ margin: '0 auto' }}>Chỉ cần email là đủ. AI Gemini sẽ phân tích và lập lộ trình học cho riêng bạn.</p>
          </div>

          <ol className="aiTimeline" style={{ listStyle: 'none' }}>
            <div className="timelineSpine" aria-hidden="true" />
            {steps.map((s, i) => {
              const isLeft = i % 2 === 0
              return (
                <li key={i} className="timelineRow">
                  {isLeft ? (
                    <div className="tlCardLeft">
                      <div className="tlCard">
                        <div className="tlTag" style={{ background: `${s.tagColor}22`, color: s.tagColor, border: `1px solid ${s.tagColor}44` }}>{s.tag}</div>
                        <h3>{s.title}</h3>
                        <p>{s.desc}</p>
                      </div>
                    </div>
                  ) : <div className="tlEmpty" aria-hidden="true"><div className="tlCard" /></div>}

                  <div className="tlNode" aria-hidden="true">
                    <div className="tlNodeCircle">
                      <div className="tlNodeBg" />
                      <span className="tlNodeNum">{s.num}</span>
                      </div>
                  </div>

                  {!isLeft ? (
                    <div className="tlCardRight">
                      <div className="tlCard">
                        <div className="tlTag" style={{ background: `${s.tagColor}22`, color: s.tagColor, border: `1px solid ${s.tagColor}44` }}>{s.tag}</div>
                        <h3>{s.title}</h3>
                        <p>{s.desc}</p>
                      </div>
                    </div>
                  ) : <div className="tlEmpty" aria-hidden="true"><div className="tlCard" /></div>}
                </li>
              )
            })}
          </ol>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="aiChip" role="note">
              <div className="aiChipDot" aria-hidden="true" />
              AI Gemini phân tích kết quả và lập lộ trình ngay sau Level Test
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="testiSection" aria-labelledby="testi-heading">
        <div className="inner">
          <Reveal>
            <div style={{ maxWidth: 560 }}>
              <div className="tag">Người dùng nói gì</div>
              <h2 id="testi-heading" className="h2">Sinh viên <span className="g">Trường Đại học Thái Bình</span> đánh giá</h2>
            </div>
          </Reveal>
          <Reveal cls="stagger reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginTop: 48 } as React.CSSProperties}>
            {testimonials.map((t, i) => (
              <blockquote key={i} className="testiCard">
                <div className="testiBlob" aria-hidden="true" style={{ background: ['var(--gold)','var(--green)','var(--violet)'][i] }} />
                <div className="stars" aria-label="5 sao">
                  {[...Array(5)].map((_, j) => <IconStar key={j} />)}
                </div>
                <p className="quoteText">{t.text}</p>
                <footer className="testiAuthor">
                  <div className={`avatar ${t.avatarCls}`} aria-hidden="true">{t.initials}</div>
                  <div>
                    <cite className="authorName" style={{ fontStyle: 'normal' }}>{t.name}</cite>
                    <div className="authorRole">{t.role}</div>
                  </div>
                </footer>
              </blockquote>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ══════════════════ FAQ ══════════════════ */}
      <section className="faqSection" id="faq" aria-labelledby="faq-heading">
        <div className="inner">
          <Reveal>
            <div className="tag" style={{ display: 'inline-flex' }}>Câu hỏi thường gặp</div>
            <h2 id="faq-heading" className="h2">Bạn còn <span className="g">thắc mắc?</span></h2>
          </Reveal>
          <div className="faqGrid">
            <Reveal cls="reveal-left" delay={60}>
              <div className="faqList" role="list">
                {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
              </div>
            </Reveal>
            <Reveal cls="reveal-right" delay={160}>
              <div className="faqContact" role="complementary" aria-label="Thông tin liên hệ">
                <div className="faqContactBlob" aria-hidden="true" />
                <h3>Vẫn còn câu hỏi?<br />Liên hệ chúng tôi</h3>
                <p>Đội ngũ phát triển EnglishHub — Khoa Công nghệ và Kỹ thuật, Trường Đại học Thái Bình — luôn sẵn sàng hỗ trợ bạn.</p>
                <div className="faqContactItems">
                  {[
                    { icon: '📧', label: 'Email hỗ trợ', val: 'support@tbu.edu.vn' },
                    { icon: '📞', label: 'Điện thoại trường', val: '0227.3633669' },
                    { icon: '📍', label: 'Địa chỉ', val: 'Phường Thái Bình, tỉnh Hưng Yên' },
                  ].map((c, i) => (
                    <div key={i} className="faqContactItem">
                      <div className="faqContactIcon">{c.icon}</div>
                      <div className="faqContactText">
                        <strong>{c.label}</strong>
                        {c.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section className="ctaSection" aria-labelledby="cta-heading">
        <div className="ctaBlobL" aria-hidden="true" />
        <div className="ctaBlobR" aria-hidden="true" />
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <h2 id="cta-heading">Sẵn sàng chinh phục<br />chứng chỉ tiếng Anh?</h2>
          <p>Đăng ký miễn phí ngay hôm nay và bắt đầu hành trình học tiếng Anh thông minh hơn cùng AI.</p>
          <div className="ctaBtns">
            <Link href="/register" className="ctaDark">
              <IconRocket />
              Đăng ký miễn phí ngay
            </Link>
            <Link href="/login" className="ctaOutline">
              <IconLogIn />
              Đã có tài khoản
            </Link>
          </div>
          <div className="ctaNoteRow">
            {['Miễn phí 100%', 'Không cần thẻ tín dụng', 'MSSV tùy chọn để xác thực'].map((item, i) => (
              <span key={i} className="ctaCheck">
                <span className="ctaCheckCircle"><IconCheck /></span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="footer">
        <div className="footerGrid">
          <div>
            <div className="fBrand">English<span>Hub</span></div>
            <p className="fBrandDesc">Nền tảng học tiếng Anh toàn diện tích hợp AI Gemini, được xây dựng dành riêng cho sinh viên Trường Đại học Thái Bình.</p>
            <address className="fContacts" style={{ fontStyle: 'normal' }}>
              <div className="fContactItem"><span aria-hidden="true">📞</span> <a href="tel:02273633669" style={{ color: 'inherit', textDecoration: 'none' }}>0227.3633669</a></div>
              <div className="fContactItem"><span aria-hidden="true">📧</span> <a href="mailto:support@tbu.edu.vn" style={{ color: 'inherit', textDecoration: 'none' }}>support@tbu.edu.vn</a></div>
              <div className="fContactItem"><span aria-hidden="true">📍</span> Phường Thái Bình, tỉnh Hưng Yên</div>
            </address>
          </div>
          <nav aria-label="Tính năng">
            <div className="fColH">Tính năng</div>
            <ul className="fLinks">
              <li><Link href="#">Flashcard SRS</Link></li>
              <li><Link href="#">Ngữ pháp</Link></li>
              <li><Link href="#">Kho tài liệu</Link></li>
              <li><Link href="#">AI Gemini</Link></li>
              <li><Link href="#">Dashboard</Link></li>
            </ul>
          </nav>
          <nav aria-label="Chứng chỉ">
            <div className="fColH">Chứng chỉ</div>
            <ul className="fLinks">
              <li><Link href="#">VSTEP B1</Link></li>
              <li><Link href="#">TOEIC</Link></li>
              <li><Link href="#">APTIS</Link></li>
              <li><Link href="#">Level Test</Link></li>
              <li><Link href="#">Lộ trình AI</Link></li>
            </ul>
          </nav>
          <nav aria-label="Về dự án">
            <div className="fColH">Dự án</div>
            <ul className="fLinks">
              <li><Link href="#">Về EnglishHub</Link></li>
              <li><Link href="#">Khóa luận 2024–2025</Link></li>
              <li><Link href="#">Khoa CNTT · ĐH Thái Bình</Link></li>
              <li><Link href="#">Hướng dẫn sử dụng</Link></li>
              <li><Link href="#faq">FAQ</Link></li>
            </ul>
          </nav>
        </div>
        <div className="footerBottom">
          <p>
            <span itemScope itemType="https://schema.org/Organization">
              <span itemProp="name">EnglishHub</span>
            </span>
            {' '}© 2025 · Khóa luận tốt nghiệp · Khoa CNTT · Trường ĐH Thái Bình
          </p>
          <div className="techBadges">
            <span className="techBadge">Next.js</span>
            <span className="techBadge">Supabase</span>
            <span className="techBadge">Gemini AI</span>
            <span className="techBadge">TypeScript</span>
          </div>
        </div>
      </footer>
    </div>
  )
}