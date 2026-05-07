'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

// ─── Hook: scroll-triggered reveal ───────────────────────────────────────────
function useReveal(threshold = 0.15) {
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

// ─── Ảnh Unsplash dùng tạm — thay bằng file local khi có ảnh thật ─────────
const UNSPLASH = {
  heroBg:       'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80',
  dashPreview:  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=80',
  dashFull:     'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&q=80',
  gallery1:     'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&q=80',
  gallery2:     'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=500&q=80',
  gallery3:     'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=500&q=80',
  gallery4:     'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&q=80',
  exam_vstep:   'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80',
  exam_toeic:   'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80',
  exam_aptis:   'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=500&q=80',
  feat_flash:   'https://images.unsplash.com/photo-1616531770192-6eaea74c2456?w=600&q=80',
  feat_grammar: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80',
  feat_library: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&q=80',
  feat_level:   'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80',
  feat_dash:    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
  feat_comm:    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80',
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const heroCards = [
  { title: 'Flashcard SRS',  desc: 'Thuật toán SM-2 tự động lên lịch ôn tập đúng lúc. 10,000+ từ vựng từ A1 đến C1.', cls: 'icon-green',
    svg: <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor" stroke="none"/> },
  { title: 'AI Gemini 24/7', desc: 'Giải thích từ vựng, chấm bài Writing, tạo lộ trình học cá nhân hóa hoàn toàn miễn phí.', cls: 'icon-gold',
    svg: <><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></> },
  { title: '3 Chứng chỉ',   desc: 'Ngân hàng đề thi VSTEP B1, TOEIC, APTIS với đề mẫu riêng từng loại chứng chỉ.', cls: 'icon-blue',
    svg: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></> },
  { title: 'Dashboard AI',  desc: 'Theo dõi tiến độ 4 kỹ năng, streak học tập và phân tích điểm yếu cần cải thiện.', cls: 'icon-red',
    svg: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
]

const stats = [
  { num: '10,000+', label: 'Từ vựng thông minh' },
  { num: '3',       label: 'Chứng chỉ hỗ trợ'  },
  { num: '100%',    label: 'Hoàn toàn miễn phí' },
  { num: '24/7',    label: 'AI hỗ trợ liên tục' },
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

// ─── FEATURE CARDS với ảnh thật ──────────────────────────────────────────────
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

// ─── 4 BƯỚC — AI TIMELINE ────────────────────────────────────────────────────
const steps = [
  {
    num: '01',
    title: 'Tạo tài khoản',
    desc: 'Điền email và mật khẩu — xong trong 60 giây. Thêm MSSV tùy chọn để nhận nhãn Sinh viên ĐH Thái Bình đã xác thực.',
    tag: 'Email · Bảo mật',
    tagColor: '#00A878',
    svg: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>,
  },
  {
    num: '02',
    title: 'Hoàn thiện hồ sơ',
    desc: 'Nhập họ tên, lớp, khoa. Chọn mục tiêu học — VSTEP / TOEIC / APTIS — AI sẽ lập lộ trình phù hợp ngay cho bạn.',
    tag: 'Cá nhân hóa',
    tagColor: '#6478f0',
    svg: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  },
  {
    num: '03',
    title: 'Làm Level Test',
    desc: 'Bài kiểm tra ~20 phút đánh giá 4 kỹ năng. AI Gemini phân tích kết quả và lập kế hoạch học theo tuần.',
    tag: 'AI phân tích',
    tagColor: '#C8A84B',
    svg: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  },
  {
    num: '04',
    title: 'Học & tiến bộ',
    desc: 'Flashcard SRS, luyện đề, chat với AI và theo dõi tiến độ mỗi ngày trên Dashboard trực quan.',
    tag: 'Tiến bộ hàng ngày',
    tagColor: '#f06464',
    svg: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  },
]

const testimonials = [
  { text: 'Từ khi dùng EnglishHub, tôi học từ vựng hiệu quả hơn hẳn nhờ flashcard SRS. AI Gemini giải thích bằng tiếng Việt rất dễ hiểu, không cần tra Google nữa!', initials: 'MT', name: 'Nguyễn Minh Tuấn', role: 'SV Năm 3 · Khoa Kinh tế',   avatarCls: 'avatarGold'  },
  { text: 'Tôi đang ôn TOEIC để xin việc và EnglishHub là thứ tôi cần. Đề thi đủ chuẩn, AI phân tích điểm yếu Part 5 và Part 6 của tôi rất chính xác.',               initials: 'LH', name: 'Trần Lan Hương',    role: 'SV Năm 4 · Khoa CNTT',     avatarCls: 'avatarGreen' },
  { text: 'Điều tôi thích nhất là tất cả miễn phí. Dashboard theo dõi 4 kỹ năng giúp tôi biết mình cần tập trung vào đâu. Đặc biệt tính năng chấm Writing rất tốt!',  initials: 'PD', name: 'Lê Phương Dung',    role: 'SV Năm 2 · Khoa Ngoại ngữ', avatarCls: 'avatarBlue'  },
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
    a: 'Hoàn toàn miễn phí 100% — không có gói Premium, không có tính năng trả phí ẩn. Tất cả tính năng bao gồm AI Gemini, flashcard SRS, đề thi chứng chỉ và dashboard đều miễn phí cho sinh viên ĐH Thái Bình.' },
  { q: 'Tôi cần gì để đăng ký?',
    a: 'Chỉ cần email và mật khẩu là đủ để tạo tài khoản. Bạn có thể thêm Mã Số Sinh Viên (MSSV) tùy chọn để nhận nhãn "Sinh viên đã xác thực" — nhưng MSSV không bắt buộc. Đăng ký xong là dùng được ngay trong vòng 1 phút.' },
  { q: 'EnglishHub hỗ trợ chuẩn bị cho những chứng chỉ nào?',
    a: 'Hiện tại hỗ trợ 3 chứng chỉ: VSTEP B1 (chuẩn đầu ra ĐH Thái Bình), TOEIC (dành cho xin việc và doanh nghiệp), và APTIS (dành cho du học và học bổng Anh). Mỗi chứng chỉ có ngân hàng đề riêng.' },
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

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
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

// ─── Reveal wrapper component ─────────────────────────────────────────────────
function Reveal({ children, cls = 'reveal', delay = 0, style = {} }: {
  children: React.ReactNode; cls?: string; delay?: number; style?: React.CSSProperties
}) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      className={`${cls}${visible ? ' visible' : ''}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  )
}

// ─── Animated stat number ─────────────────────────────────────────────────────
function AnimatedStat({ num, label }: { num: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect() } }, { threshold: .5 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  // Parse numeric value for counting
  const numeric = parseInt(num.replace(/\D/g, '')) || 0
  const suffix  = num.replace(/[0-9]/g, '')
  const count   = useCounter(numeric, 1600, started)
  return (
    <div ref={ref} className="statItem">
      <div className="statNum">{started ? `${count}${suffix}` : num}</div>
      <div className="statLabel">{label}</div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

        :root {
          --navy:        #1B2A4A;
          --navy-dark:   #0F1E35;
          --navy-mid:    #243558;
          --gold:        #C8A84B;
          --gold-light:  #E8C96C;
          --gold-pale:   #FDF6E3;
          --gold-faint:  rgba(200,168,75,0.08);
          --cream:       #F9F6EF;
          --white:       #FFFFFF;
          --text-dark:   #1a1a2e;
          --text-mid:    #4a5568;
          --green:       #00A878;
          --border:      rgba(200,168,75,0.18);
          --shadow-sm:   0 2px 12px rgba(27,42,74,0.07);
          --shadow-md:   0 6px 28px rgba(27,42,74,0.11);
          --shadow-lg:   0 18px 56px rgba(27,42,74,0.17);
          --r:           20px;
        }
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html { scroll-behavior:smooth; }
        body { font-family:'Be Vietnam Pro',sans-serif; font-size:15px; line-height:1.7; color:var(--text-dark); background:var(--cream); overflow-x:hidden; }

        /* ─ ANIMATIONS ─ */
        @keyframes pulse          { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
        @keyframes pulseGlow      { 0%,100%{box-shadow:0 0 0 0 rgba(0,168,120,.25)} 50%{box-shadow:0 0 0 10px rgba(0,168,120,0)} }
        @keyframes float          { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes floatSlow      { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(3deg)} }
        @keyframes fadeSlideUp    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlideLeft  { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeSlideRight { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spinSlow       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes neuralPulse    { 0%,100%{opacity:.06} 50%{opacity:.14} }
        @keyframes shimmer        { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes staggerIn      { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes particleDrift  { 0%{transform:translateY(0) translateX(0) scale(1);opacity:.6} 50%{transform:translateY(-40px) translateX(14px) scale(1.2);opacity:.25} 100%{transform:translateY(-90px) translateX(-6px) scale(.7);opacity:0} }
        @keyframes gradientShift  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes scaleIn        { from{opacity:0;transform:scale(.86)} to{opacity:1;transform:scale(1)} }
        @keyframes ringExpand     { 0%{transform:scale(.8);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
        @keyframes borderGlow     { 0%,100%{border-color:rgba(200,168,75,.18)} 50%{border-color:rgba(200,168,75,.6)} }
        @keyframes typewriter     { from{width:0} to{width:100%} }
        @keyframes blink          { 0%,100%{opacity:1} 50%{opacity:0} }

        /* ─ SCROLL REVEAL SYSTEM ─ */
        .reveal               { opacity:0; transform:translateY(44px); transition:opacity .8s cubic-bezier(.23,1,.32,1), transform .8s cubic-bezier(.23,1,.32,1); }
        .reveal.visible       { opacity:1; transform:translateY(0); }
        .reveal-left          { opacity:0; transform:translateX(-52px); transition:opacity .75s cubic-bezier(.23,1,.32,1), transform .75s cubic-bezier(.23,1,.32,1); }
        .reveal-left.visible  { opacity:1; transform:translateX(0); }
        .reveal-right         { opacity:0; transform:translateX(52px); transition:opacity .75s cubic-bezier(.23,1,.32,1), transform .75s cubic-bezier(.23,1,.32,1); }
        .reveal-right.visible { opacity:1; transform:translateX(0); }
        .reveal-scale         { opacity:0; transform:scale(.86); transition:opacity .7s cubic-bezier(.23,1,.32,1), transform .7s cubic-bezier(.23,1,.32,1); }
        .reveal-scale.visible { opacity:1; transform:scale(1); }

        /* Stagger children */
        .stagger > * { opacity:0; transform:translateY(30px); transition:opacity .65s cubic-bezier(.23,1,.32,1), transform .65s cubic-bezier(.23,1,.32,1); }
        .stagger.visible > *:nth-child(1){opacity:1;transform:none;transition-delay:.04s}
        .stagger.visible > *:nth-child(2){opacity:1;transform:none;transition-delay:.12s}
        .stagger.visible > *:nth-child(3){opacity:1;transform:none;transition-delay:.20s}
        .stagger.visible > *:nth-child(4){opacity:1;transform:none;transition-delay:.28s}
        .stagger.visible > *:nth-child(5){opacity:1;transform:none;transition-delay:.36s}
        .stagger.visible > *:nth-child(6){opacity:1;transform:none;transition-delay:.44s}

        /* ─ PARTICLES ─ */
        .particle { position:absolute; border-radius:50%; pointer-events:none; animation:particleDrift linear infinite; }

        /* ─ ANIMATED GRADIENT TEXT ─ */
        .gradText { background:linear-gradient(270deg,var(--gold),#6EDCB8,var(--gold-light),var(--gold)); background-size:400% 400%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:gradientShift 5s ease infinite; }

        /* ─ RING RIPPLE ─ */
        .ringRipple { position:absolute; border-radius:50%; border:1px solid rgba(200,168,75,.25); pointer-events:none; animation:ringExpand 3s ease-out infinite; }

        /* ─ COUNTER ─ */
        .statNum { animation:fadeSlideUp .5s ease both; }

        /* ─ TOPBAR ─ */
        .topbar { background:var(--navy-dark); padding:8px 0; text-align:center; font-size:13px; color:rgba(255,255,255,0.6); letter-spacing:.3px; }
        .topbar span { color:var(--gold); font-weight:600; }

        /* ─ NAV ─ */
        .nav { position:sticky; top:0; z-index:100; background:var(--navy); padding:0 5%; display:flex; align-items:center; justify-content:space-between; height:68px; box-shadow:0 2px 20px rgba(0,0,0,.22); }
        .navLogo { display:flex; align-items:center; gap:14px; text-decoration:none; }
        .logoIcon { width:42px; height:42px; background:var(--gold); border-radius:10px; display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:20px; font-weight:800; color:var(--navy-dark); flex-shrink:0; transition:transform .3s; }
        .navLogo:hover .logoIcon { transform:rotate(-8deg) scale(1.08); }
        .logoText { display:flex; flex-direction:column; line-height:1.2; }
        .logoBrand { font-size:18px; font-weight:700; color:#fff; }
        .logoBrand span { color:var(--gold); }
        .logoSub { font-size:11px; color:rgba(255,255,255,.4); font-weight:300; letter-spacing:.5px; }
        .navLinks { display:flex; align-items:center; gap:30px; list-style:none; }
        .navLinks a { text-decoration:none; color:rgba(255,255,255,.68); font-size:14px; font-weight:500; transition:color .2s; position:relative; }
        .navLinks a::after { content:''; position:absolute; bottom:-4px; left:0; right:0; height:2px; background:var(--gold); transform:scaleX(0); transition:transform .25s; transform-origin:center; }
        .navLinks a:hover { color:var(--gold); }
        .navLinks a:hover::after { transform:scaleX(1); }
        .navActions { display:flex; align-items:center; gap:10px; }
        .btnLogin { padding:9px 20px; border:1.5px solid rgba(255,255,255,.22); color:#fff; background:transparent; border-radius:8px; font-size:13px; font-weight:500; font-family:'Be Vietnam Pro',sans-serif; transition:all .2s; text-decoration:none; }
        .btnLogin:hover { border-color:var(--gold); color:var(--gold); }
        .btnRegister { padding:9px 20px; background:var(--gold); color:var(--navy-dark); border:none; border-radius:8px; font-size:13px; font-weight:700; font-family:'Be Vietnam Pro',sans-serif; transition:all .25s; text-decoration:none; display:inline-flex; align-items:center; gap:7px; }
        .btnRegister:hover { background:var(--gold-light); transform:translateY(-2px); box-shadow:0 6px 20px rgba(200,168,75,.35); }

        /* ─ HERO ─ */
        .hero { background:var(--navy); min-height:92vh; display:flex; align-items:center; position:relative; overflow:hidden; }
        .heroBgImg { position:absolute; inset:0; }
        .heroBgImg img { width:100%; height:100%; object-fit:cover; opacity:.1; }
        .hero::before { content:''; position:absolute; top:-40%; right:-10%; width:700px; height:700px; border-radius:50%; background:radial-gradient(circle,rgba(200,168,75,.14) 0%,transparent 68%); pointer-events:none; animation:float 8s ease-in-out infinite; }
        .hero::after  { content:''; position:absolute; bottom:-20%; left:-5%; width:450px; height:450px; border-radius:50%; background:radial-gradient(circle,rgba(0,168,120,.09) 0%,transparent 68%); pointer-events:none; animation:float 10s ease-in-out infinite reverse; }
        .heroDots { position:absolute; inset:0; pointer-events:none; z-index:1; background-image:radial-gradient(rgba(255,255,255,.04) 1px,transparent 1px); background-size:32px 32px; }
        .heroInner { max-width:1200px; margin:0 auto; padding:80px 5%; display:grid; grid-template-columns:1fr 1fr; gap:72px; align-items:center; position:relative; z-index:2; width:100%; }
        .heroBadge { display:inline-flex; align-items:center; gap:8px; padding:7px 16px; background:rgba(200,168,75,.12); border:1px solid rgba(200,168,75,.3); border-radius:50px; font-size:13px; color:var(--gold); font-weight:500; margin-bottom:24px; letter-spacing:.3px; animation:fadeSlideUp .6s ease both; }
        .heroBadge::before { content:''; display:inline-block; width:7px; height:7px; background:var(--gold); border-radius:50%; animation:pulse 2s infinite; }
        .heroH1 { font-family:'Playfair Display',serif; font-size:clamp(36px,4.5vw,58px); font-weight:800; color:#fff; line-height:1.15; margin-bottom:22px; letter-spacing:-.5px; animation:fadeSlideUp .7s ease .1s both; }
        .heroH1 .a1 { color:var(--gold); }
        .heroH1 .a2 { color:#6EDCB8; }
        .heroDesc { font-size:16px; color:rgba(255,255,255,.6); line-height:1.8; margin-bottom:36px; max-width:480px; animation:fadeSlideUp .7s ease .2s both; }
        .heroCta { display:flex; gap:14px; flex-wrap:wrap; animation:fadeSlideUp .7s ease .3s both; }
        .ctaPrimary { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; background:var(--gold); color:var(--navy-dark); font-weight:700; font-size:15px; border-radius:10px; text-decoration:none; transition:all .28s cubic-bezier(.23,1,.32,1); font-family:'Be Vietnam Pro',sans-serif; }
        .ctaPrimary:hover { background:var(--gold-light); transform:translateY(-3px); box-shadow:0 10px 32px rgba(200,168,75,.42); }
        .ctaSecondary { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; border:1.5px solid rgba(255,255,255,.22); color:rgba(255,255,255,.82); font-size:15px; border-radius:10px; text-decoration:none; transition:all .28s cubic-bezier(.23,1,.32,1); font-family:'Be Vietnam Pro',sans-serif; }
        .ctaSecondary:hover { border-color:rgba(255,255,255,.5); color:#fff; transform:translateY(-3px); }
        .heroNote { margin-top:18px; font-size:13px; color:rgba(255,255,255,.3); animation:fadeSlideUp .7s ease .4s both; }
        .mssvBadge { display:inline-flex; align-items:center; gap:7px; margin-top:14px; padding:7px 14px; background:rgba(0,168,120,.1); border:1px solid rgba(0,168,120,.22); border-radius:8px; font-size:12.5px; color:#4ECBA8; font-weight:500; animation:fadeSlideUp .7s ease .5s both; }
        .mssvBadge svg { flex-shrink:0; color:#4ECBA8; }
        .heroCards { display:grid; grid-template-columns:1fr 1fr; gap:16px; animation:fadeSlideLeft .8s ease .2s both; }
        .heroCard { background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.09); border-radius:16px; padding:22px 20px; transition:all .35s cubic-bezier(.23,1,.32,1); backdrop-filter:blur(4px); }
        .heroCard:hover { background:rgba(255,255,255,.1); border-color:rgba(200,168,75,.35); transform:translateY(-6px); box-shadow:0 14px 36px rgba(0,0,0,.25); }
        .heroCard:nth-child(2),.heroCard:nth-child(4) { margin-top:24px; }
        .cardIconWrap { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
        .cardIconWrap svg { width:20px; height:20px; }
        .icon-green { background:rgba(0,168,120,.18); color:#4ECBA8; }
        .icon-gold  { background:rgba(200,168,75,.18); color:var(--gold); }
        .icon-blue  { background:rgba(100,130,240,.18); color:#7B96F0; }
        .icon-red   { background:rgba(240,100,100,.18); color:#F07878; }
        .heroCard h3 { font-size:14px; font-weight:700; color:#fff; margin-bottom:6px; }
        .heroCard p  { font-size:13px; color:rgba(255,255,255,.46); line-height:1.5; }

        /* ─ STATS ─ */
        .statsBar { background:var(--gold); padding:20px 5%; }
        .statsInner { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); text-align:center; }
        .statItem { padding:8px 16px; border-right:1px solid rgba(27,42,74,.2); transition:transform .25s; }
        .statItem:hover { transform:scale(1.05); }
        .statItem:last-child { border-right:none; }
        .statNum { font-family:'Playfair Display',serif; font-size:28px; font-weight:800; color:var(--navy-dark); line-height:1; margin-bottom:4px; }
        .statLabel { font-size:12px; color:rgba(15,30,53,.68); font-weight:500; letter-spacing:.3px; }

        /* ─ SHARED ─ */
        .sec { padding:88px 5%; }
        .inner { max-width:1200px; margin:0 auto; }
        .tag { display:inline-flex; align-items:center; gap:8px; padding:5px 14px; background:var(--gold-pale); border:1px solid rgba(200,168,75,.3); border-radius:50px; font-size:12px; font-weight:600; color:#8B6914; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px; }
        .tagDark { display:inline-flex; align-items:center; gap:8px; padding:5px 14px; background:rgba(200,168,75,.12); border:1px solid rgba(200,168,75,.25); border-radius:50px; font-size:12px; font-weight:600; color:var(--gold); text-transform:uppercase; letter-spacing:1px; margin-bottom:16px; }
        .h2 { font-family:'Playfair Display',serif; font-size:clamp(28px,3vw,42px); font-weight:800; color:var(--navy); line-height:1.2; margin-bottom:16px; }
        .h2w { color:#fff; }
        .h2 .g { color:var(--gold); }
        .sub { font-size:16px; color:var(--text-mid); max-width:560px; line-height:1.75; }
        .subD { color:rgba(255,255,255,.5); }

        /* ─ UNIVERSITY ─ */
        .uniGrid { display:grid; grid-template-columns:1.1fr 1fr; gap:72px; align-items:center; }
        .uniImgWrap { position:relative; border-radius:var(--r); overflow:hidden; box-shadow:var(--shadow-lg); }
        .uniImgWrap::after { content:''; position:absolute; bottom:0; left:0; right:0; height:45%; background:linear-gradient(to top,rgba(15,30,53,.5),transparent); pointer-events:none; }
        .uniCaption { position:absolute; bottom:20px; left:20px; z-index:2; background:rgba(200,168,75,.92); color:var(--navy-dark); padding:6px 16px; border-radius:8px; font-size:13px; font-weight:700; }
        .uniContent h2 { font-family:'Playfair Display',serif; font-size:34px; font-weight:800; color:var(--navy); line-height:1.2; margin-bottom:18px; }
        .uniContent p { font-size:15px; color:var(--text-mid); line-height:1.8; margin-bottom:14px; }
        .uniHL { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:28px; }
        .uniHLItem { display:flex; align-items:center; gap:10px; padding:12px 14px; background:var(--cream); border-radius:10px; border:1px solid rgba(200,168,75,.2); font-size:13px; font-weight:600; color:var(--navy); transition:all .25s; }
        .uniHLItem:hover { background:var(--gold-pale); border-color:rgba(200,168,75,.5); transform:translateX(4px); }
        .dot { width:8px; height:8px; background:var(--gold); border-radius:50%; flex-shrink:0; }

        /* ─ COMPARE ─ */
        .compareGrid { display:grid; grid-template-columns:1fr 1fr; gap:28px; margin-top:50px; }
        .compareCol { border-radius:var(--r); overflow:hidden; box-shadow:var(--shadow-md); }
        .compareHead { padding:20px 24px; font-weight:700; font-size:16px; display:flex; align-items:center; gap:10px; }
        .compareHead.bad  { background:#FFF0EE; color:#C0392B; }
        .compareHead.good { background:var(--navy); color:var(--gold); }
        .compareBody { background:#fff; }
        .compareRow { padding:15px 24px; border-bottom:1px solid #f2f2f2; display:flex; gap:14px; align-items:flex-start; font-size:14px; color:var(--text-dark); line-height:1.55; transition:background .15s; }
        .compareRow:hover { background:#fafafa; }
        .compareRow:last-child { border-bottom:none; }
        .ci { font-size:16px; flex-shrink:0; margin-top:1px; }

        /* ══════════════════════════════════════════
           ─ FEATURE CARDS — ảnh thật + overlay ─
           ══════════════════════════════════════════ */
        .featIntroRow { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:start; margin-bottom:56px; }
        .featImgStack { position:relative; }
        .featBubble { position:absolute; bottom:-20px; right:-20px; width:165px; height:115px; border-radius:14px; overflow:hidden; box-shadow:0 10px 36px rgba(27,42,74,.24); border:3px solid #fff; }
        .featBubbleLabel { position:absolute; top:-13px; left:14px; z-index:3; background:var(--gold); color:var(--navy-dark); font-size:11px; font-weight:700; padding:3px 10px; border-radius:6px; }

        .featCards { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }

        /* Card container */
        .featCard { border-radius:20px; overflow:hidden; background:var(--white); border:1px solid rgba(0,0,0,.07); transition:transform .42s cubic-bezier(.23,1,.32,1), box-shadow .42s, border-color .3s; position:relative; cursor:pointer; }
        .featCard:hover { transform:translateY(-12px) scale(1.012); box-shadow:0 30px 64px rgba(27,42,74,.18); border-color:rgba(200,168,75,.4); }

        /* Image section */
        .fcImgWrap { height:178px; overflow:hidden; position:relative; }
        .fcImgWrap img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .6s cubic-bezier(.23,1,.32,1); }
        .featCard:hover .fcImgWrap img { transform:scale(1.1); }
        .fcImgOverlay { position:absolute; inset:0; background:linear-gradient(to bottom, transparent 30%, rgba(15,25,50,.75)); z-index:1; transition:opacity .3s; }
        .featCard:hover .fcImgOverlay { opacity:.85; }

        /* Badge on image top-right */
        .fcBadge { position:absolute; top:11px; right:11px; z-index:2; padding:3px 11px; border-radius:50px; font-size:11px; font-weight:700; letter-spacing:.4px; backdrop-filter:blur(6px); }
        .fcBadgeGreen  { background:rgba(0,168,120,.88); color:#fff; }
        .fcBadgeBlue   { background:rgba(80,110,240,.88); color:#fff; }
        .fcBadgeGold   { background:rgba(200,168,75,.94); color:#1B2A4A; }
        .fcBadgeRed    { background:rgba(220,70,70,.88); color:#fff; }
        .fcBadgeTeal   { background:rgba(0,175,175,.88); color:#fff; }
        .fcBadgePurple { background:rgba(120,70,220,.88); color:#fff; }

        /* Icon + title bottom of image */
        .fcImgLabel { position:absolute; bottom:12px; left:14px; z-index:2; display:flex; align-items:center; gap:9px; }
        .fcImgIcon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.18); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,.28); flex-shrink:0; }
        .fcImgIcon svg { width:15px; height:15px; stroke:#fff; fill:none; stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round; }
        .fcImgTitle { font-size:13px; font-weight:700; color:#fff; text-shadow:0 1px 6px rgba(0,0,0,.5); line-height:1.3; }

        /* Card body */
        .fcBody { padding:18px 18px 22px; }
        .fcBody h3 { font-size:15px; font-weight:700; color:var(--navy); margin-bottom:7px; line-height:1.35; }
        .fcBody p  { font-size:13px; color:var(--text-mid); line-height:1.65; }

        /* Accent line bottom on hover */
        .featCard::after { content:''; position:absolute; bottom:0; left:0; width:0; height:3px; transition:width .42s cubic-bezier(.23,1,.32,1); }
        .featCard:hover::after { width:100%; }
        .featCard:nth-child(1)::after { background:#00A878; }
        .featCard:nth-child(2)::after { background:#6478f0; }
        .featCard:nth-child(3)::after { background:#C8A84B; }
        .featCard:nth-child(4)::after { background:#f06464; }
        .featCard:nth-child(5)::after { background:#00A878; }
        .featCard:nth-child(6)::after { background:#9B59B6; }

        /* Stagger entrance */
        .featCard { animation:staggerIn .55s ease both; }
        .featCard:nth-child(1){animation-delay:.05s}
        .featCard:nth-child(2){animation-delay:.12s}
        .featCard:nth-child(3){animation-delay:.19s}
        .featCard:nth-child(4){animation-delay:.26s}
        .featCard:nth-child(5){animation-delay:.33s}
        .featCard:nth-child(6){animation-delay:.40s}

        /* ─ EXAMS ─ */
        .examsSection { background:var(--navy); padding:88px 5%; }
        .examsGrid { display:grid; grid-template-columns:repeat(3,1fr); gap:26px; margin-top:50px; }
        .examCard { background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.09); border-radius:var(--r); overflow:hidden; transition:all .35s cubic-bezier(.23,1,.32,1); }
        .examCard:hover { background:rgba(255,255,255,.1); border-color:rgba(200,168,75,.45); transform:translateY(-8px); box-shadow:0 24px 56px rgba(0,0,0,.35); }
        .examImgWrap { height:148px; overflow:hidden; position:relative; }
        .examImgWrap img { width:100%; height:148px; object-fit:cover; filter:brightness(.5) saturate(1.1); transition:transform .45s,filter .3s; display:block; }
        .examCard:hover .examImgWrap img { transform:scale(1.08); filter:brightness(.62) saturate(1.2); }
        .examOverlay { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:flex-end; padding:16px 18px; }
        .examLogo { font-family:'Playfair Display',serif; font-size:34px; font-weight:900; color:#fff; line-height:1; text-shadow:0 2px 12px rgba(0,0,0,.4); }
        .examTitle { font-size:11.5px; color:rgba(255,255,255,.62); margin-top:3px; line-height:1.3; }
        .examPurpose { display:inline-block; margin-top:8px; padding:3px 11px; background:rgba(200,168,75,.88); border-radius:50px; font-size:11px; color:var(--navy-dark); font-weight:700; }
        .examBody { padding:18px 20px 22px; }
        .examSkill { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,.05); font-size:13px; color:rgba(255,255,255,.68); }
        .examSkill:last-child { border-bottom:none; }
        .sdot  { width:6px; height:6px; border-radius:50%; background:var(--green); flex-shrink:0; }
        .sdotG { background:var(--gold); }

        /* ─ AI ─ */
        .aiInner { display:grid; grid-template-columns:1fr 1fr; gap:72px; align-items:start; }
        .aiMockup { background:var(--navy); border-radius:var(--r); overflow:hidden; box-shadow:var(--shadow-lg); }
        .aiBar { background:var(--navy-dark); padding:12px 18px; display:flex; align-items:center; gap:8px; border-bottom:1px solid rgba(255,255,255,.07); }
        .dR{width:10px;height:10px;border-radius:50%;background:#FF5F57}
        .dY{width:10px;height:10px;border-radius:50%;background:#FFBD2E}
        .dG{width:10px;height:10px;border-radius:50%;background:#28CA41}
        .dRow{display:flex;gap:6px}
        .aiBarTitle { margin-left:8px; font-size:12px; color:rgba(255,255,255,.36); font-weight:500; }
        .aiChat { padding:20px; display:flex; flex-direction:column; gap:14px; }
        .bubble { max-width:82%; padding:12px 16px; border-radius:14px; font-size:13px; line-height:1.55; }
        .bUser { background:var(--gold); color:var(--navy-dark); font-weight:500; align-self:flex-end; border-bottom-right-radius:4px; }
        .bAi   { background:rgba(255,255,255,.085); color:rgba(255,255,255,.82); align-self:flex-start; border-bottom-left-radius:4px; border:1px solid rgba(255,255,255,.09); }
        .bAi strong { color:var(--gold); }
        .cLabel  { font-size:11px; color:rgba(255,255,255,.26); font-weight:600; letter-spacing:.5px; text-transform:uppercase; margin-bottom:-8px; }
        .cLabelR { text-align:right; }
        .aiDashSnap { margin:0 16px 16px; border-radius:12px; overflow:hidden; }
        .aiDashSnap img { width:100%; display:block; height:130px; object-fit:cover; }
        .aiFeats { margin-top:32px; display:flex; flex-direction:column; gap:18px; }
        .aiFeatRow { display:flex; gap:14px; align-items:flex-start; transition:transform .25s; }
        .aiFeatRow:hover { transform:translateX(5px); }
        .aiFeatIcon { width:42px; height:42px; background:var(--white); border:1px solid var(--border); border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:var(--shadow-sm); transition:all .25s; }
        .aiFeatIcon svg { width:18px; height:18px; stroke:var(--navy); fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
        .aiFeatRow:hover .aiFeatIcon { background:var(--navy); border-color:var(--navy); }
        .aiFeatRow:hover .aiFeatIcon svg { stroke:var(--gold); }
        .aiFeatText h4 { font-size:14px; font-weight:700; color:var(--navy); margin-bottom:3px; }
        .aiFeatText p  { font-size:13px; color:var(--text-mid); line-height:1.5; }

        /* ─ GALLERY ─ */
        .galleryHeadRow { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
        .galleryGrid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        .galleryItem { border-radius:16px; overflow:hidden; position:relative; cursor:pointer; }
        .galleryItem img { width:100%; height:210px; object-fit:cover; display:block; transition:transform .45s cubic-bezier(.23,1,.32,1); }
        .galleryItem:hover img { transform:scale(1.09); }
        .galleryOverlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(15,30,53,.7),transparent 55%); opacity:0; transition:opacity .3s; display:flex; align-items:flex-end; padding:14px 16px; }
        .galleryItem:hover .galleryOverlay { opacity:1; }
        .galleryOText { font-size:12px; font-weight:600; color:rgba(255,255,255,.92); }

        /* ─ PLATFORM ─ */
        .platformSection { background:var(--white); padding:88px 5%; }
        .platformTable { width:100%; border-radius:var(--r); overflow:hidden; box-shadow:var(--shadow-md); margin-top:48px; border-collapse:collapse; }
        .platformTable thead tr { background:var(--navy); }
        .platformTable thead th { padding:16px 24px; text-align:left; font-size:13px; font-weight:700; color:rgba(255,255,255,.55); letter-spacing:.5px; text-transform:uppercase; }
        .platformTable thead th.thEH { color:var(--gold); font-size:14px; }
        .platformTable tbody tr { border-bottom:1px solid #f0f0f0; transition:background .15s; }
        .platformTable tbody tr:last-child { border-bottom:none; }
        .platformTable tbody tr:hover { background:#fafaf8; }
        .platformTable td { padding:14px 24px; font-size:14px; color:var(--text-dark); }
        .platformTable td:first-child { font-weight:500; }
        .chkY  { color:var(--green); font-size:16px; }
        .chkN  { color:#ccc; font-size:16px; }
        .chkEH { color:var(--gold); font-weight:700; font-size:18px; }

        /* ══════════════════════════════════════════
           ─ HOW IT WORKS — AI TIMELINE ─
           ══════════════════════════════════════════ */
        .stepsSection { background:var(--navy); padding:96px 5%; position:relative; overflow:hidden; }

        /* Neural background */
        .neuralBg { position:absolute; inset:0; pointer-events:none; z-index:0; animation:neuralPulse 5s ease-in-out infinite; }

        .stepsHeader { text-align:center; margin-bottom:72px; position:relative; z-index:1; }
        .stepsHeader .tagDark { display:inline-flex; }

        /* Timeline layout */
        .aiTimeline { position:relative; z-index:1; display:flex; flex-direction:column; gap:0; }

        /* Central spine */
        .timelineSpine { position:absolute; left:50%; top:32px; bottom:32px; width:2px; background:linear-gradient(to bottom, transparent, rgba(200,168,75,.5) 10%, rgba(200,168,75,.5) 90%, transparent); transform:translateX(-50%); z-index:0; }

        /* Each row */
        .timelineRow { display:grid; grid-template-columns:1fr 88px 1fr; align-items:center; gap:0; margin-bottom:0; min-height:120px; }

        /* Content card */
        .tlCard { padding:20px 24px; background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.1); border-radius:18px; backdrop-filter:blur(6px); transition:all .35s cubic-bezier(.23,1,.32,1); position:relative; }
        .tlCard:hover { background:rgba(255,255,255,.1); border-color:rgba(200,168,75,.45); transform:scale(1.02); box-shadow:0 12px 40px rgba(0,0,0,.3); }
        .tlCardLeft  { text-align:right; margin-right:16px; }
        .tlCardRight { text-align:left;  margin-left:16px; }

        /* Step tag (colored pill above title) */
        .tlTag { display:inline-block; padding:2px 10px; border-radius:50px; font-size:11px; font-weight:700; letter-spacing:.4px; margin-bottom:7px; }

        .tlCard h3 { font-size:15px; font-weight:700; color:#fff; margin-bottom:5px; line-height:1.3; }
        .tlCard p  { font-size:13px; color:rgba(255,255,255,.52); line-height:1.6; }

        /* Empty side placeholder */
        .tlEmpty { visibility:hidden; }

        /* Center node */
        .tlNode { display:flex; flex-direction:column; align-items:center; position:relative; z-index:2; }
        .tlNodeCircle { width:64px; height:64px; border-radius:50%; background:var(--navy-mid); border:2px solid rgba(200,168,75,.35); display:flex; align-items:center; justify-content:center; transition:all .35s cubic-bezier(.23,1,.32,1); cursor:pointer; position:relative; }
        .tlNodeCircle:hover { background:var(--gold); border-color:var(--gold); transform:scale(1.18) rotate(-8deg); box-shadow:0 6px 24px rgba(200,168,75,.4); }
        .tlNodeCircle:hover svg { stroke:var(--navy-dark); }
        .tlNodeCircle svg { width:26px; height:26px; stroke:var(--gold); fill:none; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; transition:stroke .3s; }
        .tlNumBadge { position:absolute; top:-8px; right:-4px; width:20px; height:20px; background:var(--gold); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:800; color:var(--navy-dark); }

        /* Stagger animations for timeline rows */
        .timelineRow:nth-child(odd) .tlCard   { animation:fadeSlideRight .55s ease both; }
        .timelineRow:nth-child(even) .tlCard  { animation:fadeSlideLeft .55s ease both; }
        .timelineRow:nth-child(1) .tlCard { animation-delay:.1s }
        .timelineRow:nth-child(2) .tlCard { animation-delay:.22s }
        .timelineRow:nth-child(3) .tlCard { animation-delay:.34s }
        .timelineRow:nth-child(4) .tlCard { animation-delay:.46s }
        .tlNodeCircle { animation:fadeSlideUp .5s ease both; }
        .timelineRow:nth-child(1) .tlNodeCircle { animation-delay:.08s }
        .timelineRow:nth-child(2) .tlNodeCircle { animation-delay:.20s }
        .timelineRow:nth-child(3) .tlNodeCircle { animation-delay:.32s }
        .timelineRow:nth-child(4) .tlNodeCircle { animation-delay:.44s }

        /* AI chip at bottom */
        .aiChip { display:inline-flex; align-items:center; gap:10px; padding:10px 22px; background:rgba(255,255,255,.07); border:1px solid rgba(200,168,75,.25); border-radius:50px; font-size:13px; font-weight:600; color:rgba(255,255,255,.75); margin:48px auto 0; position:relative; z-index:1; }
        .aiChipDot { width:7px; height:7px; border-radius:50%; background:var(--green); animation:pulse 1.8s infinite; flex-shrink:0; }

        /* ─ TESTIMONIALS ─ */
        .testiSection { background:var(--cream); padding:88px 5%; }
        .testiGrid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:50px; }
        .testiCard { background:var(--white); border:1px solid var(--border); border-radius:var(--r); padding:28px 24px; transition:all .32s cubic-bezier(.23,1,.32,1); position:relative; overflow:hidden; box-shadow:var(--shadow-sm); }
        .testiCard::before { content:'\u201C'; position:absolute; top:-8px; right:18px; font-family:'Playfair Display',serif; font-size:90px; color:rgba(200,168,75,.12); line-height:1; pointer-events:none; }
        .testiCard:hover { transform:translateY(-6px); box-shadow:var(--shadow-lg); border-color:rgba(200,168,75,.35); }
        .stars { color:var(--gold); font-size:14px; margin-bottom:16px; display:flex; gap:3px; }
        .quoteText { font-size:14px; color:var(--text-mid); line-height:1.78; margin-bottom:22px; font-style:italic; }
        .testiAuthor { display:flex; align-items:center; gap:12px; }
        .avatar { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0; border:2px solid rgba(200,168,75,.35); }
        .avatarGold  { background:rgba(200,168,75,.15); color:var(--gold); }
        .avatarGreen { background:rgba(0,168,120,.15); color:#00A878; }
        .avatarBlue  { background:rgba(100,120,240,.15); color:#6478f0; }
        .authorName { font-size:14px; font-weight:700; color:var(--navy); }
        .authorRole { font-size:12px; color:var(--text-mid); }

        /* ─ FAQ ─ */
        .faqSection { background:var(--white); padding:88px 5%; }
        .faqGrid { display:grid; grid-template-columns:1fr 1fr; gap:60px; margin-top:50px; align-items:start; }
        .faqList { display:flex; flex-direction:column; gap:12px; }
        .faqItem { background:var(--cream); border:1px solid var(--border); border-radius:14px; padding:18px 20px; cursor:pointer; transition:all .22s; box-shadow:var(--shadow-sm); }
        .faqItem:hover { border-color:rgba(200,168,75,.4); box-shadow:var(--shadow-md); }
        .faqOpen { border-color:var(--gold) !important; box-shadow:0 4px 20px rgba(200,168,75,.12) !important; background:var(--white); }
        .faqQ { display:flex; justify-content:space-between; align-items:center; gap:12px; }
        .faqQ span:first-child { font-size:14px; font-weight:600; color:var(--navy); line-height:1.4; }
        .faqIcon { font-size:20px; color:var(--gold); font-weight:700; flex-shrink:0; line-height:1; }
        .faqA { margin-top:12px; font-size:13.5px; color:var(--text-mid); line-height:1.72; padding-top:12px; border-top:1px solid #f0ead8; }
        .faqContact { background:var(--navy); border-radius:var(--r); padding:40px 36px; display:flex; flex-direction:column; gap:20px; }
        .faqContact h3 { font-family:'Playfair Display',serif; font-size:26px; font-weight:800; color:#fff; line-height:1.25; }
        .faqContact p  { font-size:14px; color:rgba(255,255,255,.55); line-height:1.7; }
        .faqContactItems { display:flex; flex-direction:column; gap:14px; }
        .faqContactItem { display:flex; align-items:center; gap:14px; padding:14px 16px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.09); border-radius:12px; transition:all .25s; }
        .faqContactItem:hover { background:rgba(255,255,255,.1); border-color:rgba(200,168,75,.3); }
        .faqContactIcon { font-size:20px; flex-shrink:0; }
        .faqContactText { font-size:13px; color:rgba(255,255,255,.75); }
        .faqContactText strong { color:#fff; display:block; font-size:14px; margin-bottom:1px; }

        /* ─ CTA ─ */
        .ctaSection { background:var(--gold); padding:80px 5%; text-align:center; position:relative; overflow:hidden; }
        .ctaSection::before { content:''; position:absolute; top:-50%; right:-10%; width:500px; height:500px; border-radius:50%; background:rgba(255,255,255,.08); pointer-events:none; }
        .ctaSection h2 { font-family:'Playfair Display',serif; font-size:42px; font-weight:800; color:var(--navy-dark); margin-bottom:16px; line-height:1.2; position:relative; }
        .ctaSection > div > p { font-size:17px; color:rgba(15,30,53,.66); margin-bottom:36px; position:relative; }
        .ctaBtns { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; position:relative; }
        .ctaDark { padding:15px 32px; background:var(--navy); color:#fff; border-radius:10px; font-size:15px; font-weight:700; text-decoration:none; transition:all .28s cubic-bezier(.23,1,.32,1); font-family:'Be Vietnam Pro',sans-serif; display:inline-flex; align-items:center; gap:9px; }
        .ctaDark:hover { background:var(--navy-dark); transform:translateY(-3px); box-shadow:0 10px 32px rgba(27,42,74,.42); }
        .ctaOutline { padding:15px 32px; border:2px solid rgba(15,30,53,.26); color:var(--navy-dark); border-radius:10px; font-size:15px; font-weight:600; text-decoration:none; transition:all .28s; font-family:'Be Vietnam Pro',sans-serif; display:inline-flex; align-items:center; gap:9px; }
        .ctaOutline:hover { border-color:var(--navy-dark); transform:translateY(-3px); }
        .ctaNoteRow { margin-top:20px; font-size:13px; color:rgba(15,30,53,.5); display:flex; align-items:center; justify-content:center; gap:16px; flex-wrap:wrap; position:relative; }
        .ctaCheck { display:inline-flex; align-items:center; gap:5px; }
        .ctaCheckCircle { width:16px; height:16px; background:var(--navy); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:var(--gold); flex-shrink:0; }

        /* ─ FOOTER ─ */
        .footer { background:var(--navy-dark); padding:60px 5% 28px; }
        .footerGrid { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:2fr 1fr 1fr 1.5fr; gap:50px; margin-bottom:50px; }
        .fBrand { font-family:'Playfair Display',serif; font-size:24px; font-weight:800; color:#fff; margin-bottom:12px; }
        .fBrand span { color:var(--gold); }
        .fBrandDesc { font-size:13.5px; color:rgba(255,255,255,.4); line-height:1.75; margin-bottom:20px; }
        .fContacts { display:flex; flex-direction:column; gap:8px; }
        .fContactItem { display:flex; align-items:center; gap:8px; font-size:13px; color:rgba(255,255,255,.4); transition:color .2s; }
        .fContactItem:hover { color:rgba(255,255,255,.7); }
        .fColH { font-size:12px; font-weight:700; color:var(--gold); text-transform:uppercase; letter-spacing:1.2px; margin-bottom:18px; }
        .fLinks { list-style:none; display:flex; flex-direction:column; gap:10px; }
        .fLinks a { text-decoration:none; font-size:13.5px; color:rgba(255,255,255,.44); transition:all .2s; }
        .fLinks a:hover { color:var(--gold); padding-left:4px; }
        .footerBottom { max-width:1200px; margin:0 auto; padding-top:24px; border-top:1px solid rgba(255,255,255,.07); display:flex; justify-content:space-between; align-items:center; }
        .footerBottom p { font-size:13px; color:rgba(255,255,255,.26); }
        .techBadges { display:flex; gap:8px; }
        .techBadge { padding:4px 10px; background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.09); border-radius:6px; font-size:11px; color:rgba(255,255,255,.34); font-weight:600; transition:all .2s; }
        .techBadge:hover { background:rgba(255,255,255,.1); color:rgba(255,255,255,.6); }

        /* ─ RESPONSIVE ─ */
        @media (max-width:900px) {
          .heroInner,.uniGrid,.aiInner,.compareGrid,.featIntroRow,.faqGrid { grid-template-columns:1fr; gap:40px; }
          .heroCards { grid-template-columns:repeat(2,1fr); }
          .heroCard:nth-child(2),.heroCard:nth-child(4) { margin-top:0; }
          .examsGrid,.testiGrid,.featCards { grid-template-columns:1fr; }
          .statsInner { grid-template-columns:repeat(2,1fr); }
          .statItem:nth-child(2) { border-right:none; }
          .footerGrid { grid-template-columns:1fr 1fr; }
          .navLinks { display:none; }
          .galleryGrid { grid-template-columns:repeat(2,1fr); }
          .featBubble { display:none; }
          .platformTable thead th:nth-child(3),.platformTable td:nth-child(3) { display:none; }
          .aiTimeline .timelineSpine { display:none; }
          .timelineRow { grid-template-columns:1fr; gap:12px; }
          .tlEmpty { display:none; }
          .tlNode { flex-direction:row; justify-content:flex-start; margin-bottom:4px; }
          .tlCardLeft,.tlCardRight { margin:0; text-align:left; }
        }
      `}</style>

      {/* ── TOPBAR ── */}
      <div className="topbar">
        🏛️ Dự án Khóa luận tốt nghiệp · Khoa CNTT · <span>Trường ĐH Thái Bình</span> · 2024–2025
      </div>

      {/* ── NAV ── */}
      <nav className="nav">
        <Link href="/" className="navLogo">
          <div className="logoIcon">EH</div>
          <div className="logoText">
            <span className="logoBrand">English<span>Hub</span></span>
            <span className="logoSub">ĐH Thái Bình · AI-Powered</span>
          </div>
        </Link>
        <ul className="navLinks">
          <li><a href="#features">Tính năng</a></li>
          <li><a href="#exams">Chứng chỉ</a></li>
          <li><a href="#ai">AI Gemini</a></li>
          <li><a href="#how">Cách dùng</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <div className="navActions">
          <Link href="/login" className="btnLogin">Đăng nhập</Link>
          <Link href="/register" className="btnRegister">
            <IconGradCap />
            Đăng ký miễn phí
          </Link>
        </div>
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="hero">
        <div className="heroBgImg">
          <img src={UNSPLASH.heroBg} alt="" />
        </div>
        <div className="heroDots" />

        {/* Floating particles */}
        {[
          { w:6,  h:6,  top:'15%', left:'8%',  dur:'6s',  del:'0s',   bg:'rgba(200,168,75,.5)' },
          { w:4,  h:4,  top:'30%', left:'12%', dur:'8s',  del:'1.5s', bg:'rgba(0,168,120,.4)' },
          { w:8,  h:8,  top:'60%', left:'5%',  dur:'7s',  del:'0.8s', bg:'rgba(200,168,75,.3)' },
          { w:5,  h:5,  top:'75%', left:'18%', dur:'9s',  del:'2s',   bg:'rgba(110,220,184,.4)' },
          { w:3,  h:3,  top:'20%', right:'10%',dur:'5s',  del:'0.3s', bg:'rgba(200,168,75,.6)' },
          { w:7,  h:7,  top:'50%', right:'7%', dur:'10s', del:'1s',   bg:'rgba(0,168,120,.3)' },
          { w:4,  h:4,  top:'80%', right:'15%',dur:'7.5s',del:'2.5s', bg:'rgba(200,168,75,.4)' },
          { w:10, h:10, top:'40%', left:'50%', dur:'12s', del:'0s',   bg:'rgba(255,255,255,.06)' },
        ].map((p, i) => (
          <div key={i} className="particle" style={{
            width: p.w, height: p.h, top: p.top, left: (p as any).left, right: (p as any).right,
            animationDuration: p.dur, animationDelay: p.del, background: p.bg,
          }} />
        ))}

        {/* Ring ripples */}
        {[
          { size: 300, top: '10%', right: '5%',  delay: '0s' },
          { size: 200, top: '60%', left: '3%',   delay: '1.5s' },
          { size: 150, top: '35%', right: '20%', delay: '3s' },
        ].map((r, i) => (
          <div key={i} className="ringRipple" style={{
            width: r.size, height: r.size,
            top: r.top, left: (r as any).left, right: (r as any).right,
            animationDelay: r.delay,
            marginLeft: r.size ? -r.size / 2 : undefined,
            marginTop:  r.size ? -r.size / 2 : undefined,
          }} />
        ))}

        <div className="heroInner">
          <div>
            <div className="heroBadge">AI Gemini miễn phí · VSTEP · TOEIC · APTIS</div>
            <h1 className="heroH1">
              Nền tảng học<br />
              tiếng Anh <span className="a1">toàn diện</span><br />
              tích hợp <span className="a2">AI</span>
            </h1>
            <p className="heroDesc">
              Từ vựng SRS thông minh, luyện thi 3 chứng chỉ quốc tế, AI Gemini giải thích 24/7 —
              tất cả miễn phí dành riêng cho sinh viên{' '}
              <strong style={{ color: 'rgba(255,255,255,.88)' }}>ĐH Thái Bình</strong>.
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

          <div className="heroCards">
            {heroCards.map((c, i) => (
              <div key={i} className="heroCard">
                <div className={`cardIconWrap ${c.cls}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {c.svg}
                  </svg>
                </div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS — animated counters ── */}
      <div className="statsBar">
        <div className="statsInner">
          {stats.map((s, i) => <AnimatedStat key={i} num={s.num} label={s.label} />)}
        </div>
      </div>

      {/* ══════════════════ UNIVERSITY ══════════════════ */}
      <section className="sec" style={{ background: 'var(--white)' }}>
        <div className="inner">
          <div className="uniGrid">
            <Reveal cls="reveal-left">
            <div className="uniImgWrap">
              <img src="/assets/index/TBU.jpg" alt="Trường Đại học Thái Bình"
                style={{ width: '100%', height: '380px', objectFit: 'cover', display: 'block' }} />
              <div className="uniCaption">🏛️ Trường Đại học Thái Bình</div>
            </div>
            </Reveal>
            <Reveal cls="reveal-right" delay={100}>
            <div className="uniContent">
              <div className="tag">Về chúng tôi</div>
              <h2>Xây dựng cho sinh viên <span style={{ color: 'var(--gold)' }}>ĐH Thái Bình</span></h2>
              <p>EnglishHub ra đời từ một bài toán thực tế: sinh viên ĐH Thái Bình cần đạt chuẩn <strong>VSTEP B1</strong> để tốt nghiệp, nhưng thiếu công cụ học tập phù hợp, miễn phí và được cá nhân hóa.</p>
              <p>Dự án được phát triển trong khuôn khổ <strong>Khóa luận tốt nghiệp 2024–2025</strong> của Khoa Công nghệ Thông tin, hướng đến giải quyết đúng nhu cầu của sinh viên trong trường và cộng đồng người học.</p>
              <p>Đăng ký bằng <strong>email</strong> — nhanh chóng, đơn giản. Thêm <strong>MSSV</strong> để nhận nhãn xác thực sinh viên ĐH Thái Bình. Không cần thẻ tín dụng, hoàn toàn miễn phí.</p>
              <div className="uniHL stagger" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 28 }}>
                {uniHighlights.map((h, i) => (
                  <div key={i} className="uniHLItem"><div className="dot" />{h}</div>
                ))}
              </div>
            </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════ COMPARE ══════════════════ */}
      <section className="sec" style={{ background: 'var(--cream)' }}>
        <div className="inner">
          <Reveal>
          <div style={{ maxWidth: 560 }}>
            <div className="tag">Tại sao EnglishHub?</div>
            <h2 className="h2">Vượt qua giới hạn của các <span className="g">nền tảng hiện tại</span></h2>
            <p className="sub">Các ứng dụng phổ biến phục vụ tốt một mục tiêu nhưng thiếu hoàn toàn các nhu cầu còn lại. EnglishHub giải quyết tất cả trong một nơi duy nhất.</p>
          </div>
          </Reveal>
          <div className="compareGrid">
            <Reveal cls="reveal-left" delay={80}>
            <div className="compareCol">
              <div className="compareHead bad">❌ &nbsp;Vấn đề hiện tại</div>
              <div className="compareBody">
                {problems.map((p, i) => (
                  <div key={i} className="compareRow"><span className="ci">{p.icon}</span>{p.text}</div>
                ))}
              </div>
            </div>
            </Reveal>
            <Reveal cls="reveal-right" delay={180}>
            <div className="compareCol">
              <div className="compareHead good">✓ &nbsp;EnglishHub giải quyết</div>
              <div className="compareBody">
                {solutions.map((s, i) => (
                  <div key={i} className="compareRow"><span className="ci">{s.icon}</span>{s.text}</div>
                ))}
              </div>
            </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURES — ảnh thật ══════════════════ */}
      <section className="sec" id="features" style={{ background: 'var(--white)' }}>
        <div className="inner">
          <div className="featIntroRow">
            <Reveal cls="reveal-left">
            <div>
              <div className="tag">Tính năng</div>
              <h2 className="h2">Mọi thứ bạn cần để <span className="g">chinh phục tiếng Anh</span></h2>
              <p className="sub">6 module tích hợp AI chặt chẽ, hỗ trợ toàn bộ hành trình từ cơ bản đến chứng chỉ quốc tế.</p>
              <Link href="/register" className="ctaPrimary" style={{ display: 'inline-flex', marginTop: 28, background: 'var(--navy)', color: '#fff' }}>
                <IconRocket size={16} />
                Khám phá ngay
              </Link>
            </div>
            </Reveal>
            <Reveal cls="reveal-right" delay={150}>
            <div className="featImgStack">
              <img src="/assets/index/Language.jpg" alt="Học tiếng Anh với EnglishHub"
                style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-lg)', display: 'block' }} />
              <div className="featBubble">
                <div className="featBubbleLabel">Dashboard AI</div>
                <img src={UNSPLASH.dashPreview} alt="Dashboard preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            </Reveal>
          </div>

          {/* ─── 6 FEATURE CARDS — stagger on scroll ─── */}
          <Reveal cls="stagger reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 } as React.CSSProperties}>
            {features.map((f, i) => (
              <div key={i} className="featCard">
                {/* Image area */}
                <div className="fcImgWrap">
                  <img src={f.img} alt={f.title} />
                  <div className="fcImgOverlay" />
                  <span className={`fcBadge ${f.badgeCls}`}>{f.badge}</span>
                  <div className="fcImgLabel">
                    <div className="fcImgIcon">
                      <svg viewBox="0 0 24 24">
                        {f.iconSvg}
                      </svg>
                    </div>
                    <span className="fcImgTitle">{f.title}</span>
                  </div>
                </div>
                {/* Body */}
                <div className="fcBody">
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ══════════════════ EXAMS ══════════════════ */}
      <section className="examsSection" id="exams">
        <div className="inner">
          <Reveal>
          <div style={{ maxWidth: 560 }}>
            <div className="tagDark">Luyện thi chứng chỉ</div>
            <h2 className="h2 h2w">3 chứng chỉ · <span className="g">1 nền tảng</span></h2>
            <p className="sub subD">Đề mẫu riêng từng loại chứng chỉ, phân tích điểm mạnh yếu chi tiết sau mỗi bài thi, và AI Gemini hỗ trợ giải thích ngay trong khi làm bài.</p>
          </div>
          </Reveal>
          <Reveal cls="stagger reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 26, marginTop: 50 } as React.CSSProperties}>
            {exams.map((e, i) => (
              <div key={i} className="examCard">
                <div className="examImgWrap">
                  <img src={e.imgSrc} alt={e.logo} />
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
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ══════════════════ AI SECTION ══════════════════ */}
      <section className="sec" id="ai" style={{ background: 'var(--cream)' }}>
        <div className="inner">
          <div className="aiInner">
            <Reveal cls="reveal-left">
            <div>
              <div className="aiMockup">
                <div className="aiBar">
                  <div className="dRow"><div className="dR" /><div className="dY" /><div className="dG" /></div>
                  <div className="aiBarTitle">AI Gemini — EnglishHub Chat</div>
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
                <img src={UNSPLASH.dashFull} alt="Dashboard EnglishHub" />
              </div>
            </div>
            </Reveal>

            <Reveal cls="reveal-right" delay={120}>
            <div>
              <div className="tag">AI Gemini miễn phí</div>
              <h2 className="h2">Trợ lý học tập <span className="g">thông minh 24/7</span></h2>
              <p className="sub">Tích hợp Google Gemini 2.0 Flash — hoàn toàn miễn phí, không cần thẻ tín dụng. Hỗ trợ hoàn toàn bằng tiếng Việt.</p>
              <div className="aiFeats stagger">
                {aiFunctions.map((f, i) => (
                  <div key={i} className="aiFeatRow">
                    <div className="aiFeatIcon">
                      <svg viewBox="0 0 24 24">
                        {f.svg}
                      </svg>
                    </div>
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
      <section className="sec" style={{ background: 'var(--white)', paddingTop: 64, paddingBottom: 64 }}>
        <div className="inner">
          <div className="galleryHeadRow">
            <div>
              <div className="tag">Cộng đồng học tập</div>
              <h2 className="h2" style={{ marginBottom: 0 }}>Sinh viên <span className="g">EnglishHub</span></h2>
            </div>
            <Link href="/register" className="ctaPrimary" style={{ background: 'var(--navy)', color: '#fff', whiteSpace: 'nowrap' }}>
              <IconUsers />
              Tham gia ngay
            </Link>
          </div>
          <div className="galleryGrid">
            {galleryPhotos.map((p, i) => (
              <div key={i} className="galleryItem">
                <img src={p.src} alt={p.alt} />
                <div className="galleryOverlay">
                  <span className="galleryOText">{p.alt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ PLATFORM COMPARISON ══════════════════ */}
      <section className="platformSection">
        <div className="inner">
          <div style={{ maxWidth: 560 }}>
            <div className="tag">So sánh nền tảng</div>
            <h2 className="h2">EnglishHub vs <span className="g">các ứng dụng khác</span></h2>
            <p className="sub">Tại sao sinh viên ĐH Thái Bình chọn EnglishHub thay vì Duolingo hay app TOEIC đơn thuần?</p>
          </div>
          <table className="platformTable">
            <thead>
              <tr>
                <th>Tính năng</th>
                <th className="thEH">✦ EnglishHub</th>
                <th>Duolingo</th>
                <th>App TOEIC</th>
              </tr>
            </thead>
            <tbody>
              {platformRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.feature}</td>
                  <td><span className="chkEH">✓</span></td>
                  <td><span className={r.duolingo ? 'chkY' : 'chkN'}>{r.duolingo ? '✓' : '✗'}</span></td>
                  <td><span className={r.toeicApp ? 'chkY' : 'chkN'}>{r.toeicApp ? '✓' : '✗'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS — AI TIMELINE ══════════════════ */}
      <section className="stepsSection" id="how">
        {/* Neural background SVG */}
        <svg className="neuralBg" viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          {/* Nodes */}
          {[
            [600,60],[600,200],[600,340],[600,480],
            [200,130],[400,130],[800,130],[1000,130],
            [200,270],[400,270],[800,270],[1000,270],
            [200,410],[400,410],[800,410],[1000,410],
          ].map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r="4" fill="#C8A84B" opacity=".6" />
          ))}
          {/* Connections */}
          {[
            [600,60,200,130],[600,60,400,130],[600,60,800,130],[600,60,1000,130],
            [600,200,200,130],[600,200,400,130],[600,200,800,130],[600,200,1000,130],
            [600,200,200,270],[600,200,400,270],[600,200,800,270],[600,200,1000,270],
            [600,340,200,270],[600,340,400,270],[600,340,800,270],[600,340,1000,270],
            [600,340,200,410],[600,340,400,410],[600,340,800,410],[600,340,1000,410],
            [600,480,200,410],[600,480,400,410],[600,480,800,410],[600,480,1000,410],
          ].map(([x1,y1,x2,y2],i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C8A84B" strokeWidth=".8" opacity=".4" />
          ))}
        </svg>

        <div className="inner">
          <div className="stepsHeader">
            <div className="tagDark">Cách hoạt động</div>
            <h2 className="h2 h2w">Bắt đầu trong <span className="g">4 bước đơn giản</span></h2>
            <p className="sub subD" style={{ margin: '0 auto' }}>
              Chỉ cần email là đủ. AI Gemini sẽ phân tích và lập lộ trình học cho riêng bạn.
            </p>
          </div>

          <div className="aiTimeline">
            <div className="timelineSpine" />

            {steps.map((s, i) => {
              const isLeft = i % 2 === 0
              return (
                <div key={i} className="timelineRow">
                  {/* Left side */}
                  {isLeft ? (
                    <div className="tlCardLeft">
                      <div className="tlCard">
                        <div className="tlTag" style={{ background: `${s.tagColor}22`, color: s.tagColor, border: `1px solid ${s.tagColor}44` }}>
                          {s.tag}
                        </div>
                        <h3>{s.title}</h3>
                        <p>{s.desc}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="tlEmpty"><div className="tlCard" /></div>
                  )}

                  {/* Center node */}
                  <div className="tlNode">
                    <div className="tlNodeCircle">
                      <span className="tlNumBadge">{s.num}</span>
                      <svg viewBox="0 0 24 24">
                        {s.svg}
                      </svg>
                    </div>
                  </div>

                  {/* Right side */}
                  {!isLeft ? (
                    <div className="tlCardRight">
                      <div className="tlCard">
                        <div className="tlTag" style={{ background: `${s.tagColor}22`, color: s.tagColor, border: `1px solid ${s.tagColor}44` }}>
                          {s.tag}
                        </div>
                        <h3>{s.title}</h3>
                        <p>{s.desc}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="tlEmpty"><div className="tlCard" /></div>
                  )}
                </div>
              )
            })}
          </div>

          {/* AI chip */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="aiChip">
              <div className="aiChipDot" />
              AI Gemini phân tích kết quả và lập lộ trình ngay sau Level Test
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="testiSection">
        <div className="inner">
          <Reveal>
          <div style={{ maxWidth: 560 }}>
            <div className="tag">Người dùng nói gì</div>
            <h2 className="h2">Sinh viên <span className="g">ĐH Thái Bình</span> đánh giá</h2>
          </div>
          </Reveal>
          <Reveal cls="stagger reveal" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, marginTop:50 } as React.CSSProperties}>
            {testimonials.map((t, i) => (
              <div key={i} className="testiCard">
                <div className="stars">
                  {[...Array(5)].map((_, j) => <IconStar key={j} />)}
                </div>
                <p className="quoteText">{t.text}</p>
                <div className="testiAuthor">
                  <div className={`avatar ${t.avatarCls}`}>{t.initials}</div>
                  <div>
                    <div className="authorName">{t.name}</div>
                    <div className="authorRole">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ══════════════════ FAQ ══════════════════ */}
      <section className="faqSection" id="faq">
        <div className="inner">
          <Reveal>
          <div className="tag" style={{ display: 'inline-flex' }}>Câu hỏi thường gặp</div>
          <h2 className="h2">Bạn còn <span className="g">thắc mắc?</span></h2>
          </Reveal>
          <div className="faqGrid">
            <Reveal cls="reveal-left" delay={60}>
            <div className="faqList">
              {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
            </div>
            </Reveal>
            <Reveal cls="reveal-right" delay={160}>
            <div className="faqContact">
              <h3>Vẫn còn câu hỏi?<br />Liên hệ chúng tôi</h3>
              <p>Đội ngũ phát triển EnglishHub — Khoa CNTT, ĐH Thái Bình — luôn sẵn sàng hỗ trợ bạn.</p>
              <div className="faqContactItems">
                {[
                  { icon: '📧', label: 'Email hỗ trợ',      val: 'support@tbu.edu.vn'      },
                  { icon: '📞', label: 'Điện thoại trường', val: '0227.3633669'             },
                  { icon: '📍', label: 'Địa chỉ',           val: 'Phường Thái Bình, tỉnh Hưng Yên' },
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
      <section className="ctaSection">
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <h2>Sẵn sàng chinh phục<br />chứng chỉ tiếng Anh?</h2>
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
            <div className="fContacts">
              <div className="fContactItem">📞 0227.3633669</div>
              <div className="fContactItem">📧 support@tbu.edu.vn</div>
              <div className="fContactItem">📍 Phường Thái Bình, tỉnh Hưng Yên</div>
            </div>
          </div>
          <div>
            <div className="fColH">Tính năng</div>
            <ul className="fLinks">
              <li><Link href="#">Flashcard SRS</Link></li>
              <li><Link href="#">Ngữ pháp</Link></li>
              <li><Link href="#">Kho tài liệu</Link></li>
              <li><Link href="#">AI Gemini</Link></li>
              <li><Link href="#">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <div className="fColH">Chứng chỉ</div>
            <ul className="fLinks">
              <li><Link href="#">VSTEP B1</Link></li>
              <li><Link href="#">TOEIC</Link></li>
              <li><Link href="#">APTIS</Link></li>
              <li><Link href="#">Level Test</Link></li>
              <li><Link href="#">Lộ trình AI</Link></li>
            </ul>
          </div>
          <div>
            <div className="fColH">Dự án</div>
            <ul className="fLinks">
              <li><Link href="#">Về EnglishHub</Link></li>
              <li><Link href="#">Khóa luận 2024–2025</Link></li>
              <li><Link href="#">Khoa CNTT · ĐH Thái Bình</Link></li>
              <li><Link href="#">Hướng dẫn sử dụng</Link></li>
              <li><Link href="#faq">FAQ</Link></li>
            </ul>
          </div>
        </div>
        <div className="footerBottom">
          <p>EnglishHub © 2025 · Khóa luận tốt nghiệp · Khoa CNTT · Trường ĐH Thái Bình</p>
          <div className="techBadges">
            <div className="techBadge">Next.js</div>
            <div className="techBadge">Supabase</div>
            <div className="techBadge">Gemini AI</div>
          </div>
        </div>
      </footer>
    </div>
  )
}