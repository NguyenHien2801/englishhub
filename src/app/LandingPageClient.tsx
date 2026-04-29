'use client'

import Link from 'next/link'
import { useState } from 'react'

// ─── Ảnh Unsplash dùng tạm — thay bằng file local khi có ảnh thật ─────────
const UNSPLASH = {
  heroBg:      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80',
  schoolPhoto: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=800&q=80',
  featureHero: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=700&q=80',
  dashPreview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=80',
  dashFull:    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&q=80',
  gallery1:    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&q=80',
  gallery2:    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=500&q=80',
  gallery3:    'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=500&q=80',
  gallery4:    'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&q=80',
  exam_vstep:  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80',
  exam_toeic:  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80',
  exam_aptis:  'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=500&q=80',
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const heroCards = [
  { icon: '🃏', title: 'Flashcard SRS',  desc: 'Thuật toán SM-2 tự động lên lịch ôn tập đúng lúc. 10,000+ từ vựng từ A1 đến C1.', cls: 'icon-green' },
  { icon: '🤖', title: 'AI Gemini 24/7', desc: 'Giải thích từ vựng, chấm bài Writing, tạo lộ trình học cá nhân hóa hoàn toàn miễn phí.', cls: 'icon-gold' },
  { icon: '📝', title: '3 Chứng chỉ',   desc: 'Ngân hàng đề thi VSTEP B1, TOEIC, APTIS với đề mẫu riêng từng loại chứng chỉ.', cls: 'icon-blue' },
  { icon: '📊', title: 'Dashboard AI',  desc: 'Theo dõi tiến độ 4 kỹ năng, streak học tập và phân tích điểm yếu cần cải thiện.', cls: 'icon-red' },
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

const features = [
  { icon: '🃏', title: 'Flashcard Thông Minh SRS',  desc: 'Thẻ từ hai mặt với thuật toán SM-2. Hệ thống tự động tính toán thời điểm ôn lại tối ưu dựa trên mức độ ghi nhớ của bạn.', badge: '10,000+ từ vựng', color: '#00A878' },
  { icon: '📚', title: 'Ngữ Pháp Có Hệ Thống',      desc: 'Bài học ngữ pháp từ A1 đến C1 với bài tập thực hành. AI Gemini giải thích ngay khi bạn không hiểu điểm bất kỳ nào.',  badge: 'A1 → C1',       color: '#6478f0' },
  { icon: '🗂️', title: 'Kho Tài Liệu Phong Phú',   desc: 'Upload, tìm kiếm và phân loại tài liệu theo kỹ năng, cấp độ và chứng chỉ. Chia sẻ cộng đồng học tập dễ dàng.',           badge: 'Cộng đồng',      color: '#C8A84B' },
  { icon: '🧪', title: 'Level Test & Lộ Trình AI',  desc: 'Kiểm tra trình độ đầu vào ~20 phút. AI Gemini phân tích kết quả và lập kế hoạch học theo tuần phù hợp mục tiêu.',         badge: 'Cá nhân hóa',    color: '#f06464' },
  { icon: '📊', title: 'Dashboard Tiến Độ',          desc: 'Biểu đồ 4 kỹ năng Nghe/Đọc/Viết/Nói, chuỗi streak học tập hàng ngày và top 3 điểm yếu cần cải thiện.',                   badge: 'Phân tích AI',   color: '#00A878' },
  { icon: '💬', title: 'Cộng Đồng & Diễn Đàn',      desc: 'Hỏi đáp, chia sẻ kinh nghiệm ôn thi, đánh giá tài liệu và kết nối với cộng đồng sinh viên cùng mục tiêu.',              badge: 'Sắp ra mắt',     color: '#6478f0' },
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
  { icon: '💬', title: 'Giải thích từ vựng & ngữ pháp',  desc: 'Click vào bất kỳ từ nào → AI giải thích nghĩa, ví dụ, mẹo nhớ và cách dùng trong TOEIC/VSTEP' },
  { icon: '✍️', title: 'Chấm bài Writing thông minh',    desc: 'Nộp bài viết → AI nhận xét nội dung, ngữ pháp, từ vựng và cho điểm theo tiêu chí VSTEP/APTIS' },
  { icon: '🗺️', title: 'Lộ trình học cá nhân hóa',      desc: 'Sau Level Test, AI phân tích trình độ + mục tiêu → lập kế hoạch học theo tuần phù hợp với bạn' },
  { icon: '📋', title: 'Sinh bài tập tự động',           desc: 'Nhập văn bản bất kỳ → AI tạo quiz trắc nghiệm, điền từ để luyện tập ngay lập tức' },
]

const galleryPhotos = [
  { src: UNSPLASH.gallery1, alt: 'Sinh viên học tại thư viện'  },
  { src: UNSPLASH.gallery2, alt: 'Nhóm ôn thi VSTEP'           },
  { src: UNSPLASH.gallery3, alt: 'Học trực tuyến cùng AI'      },
  { src: UNSPLASH.gallery4, alt: 'Luyện Speaking APTIS'        },
]

// ── 4 bước khớp đúng với flow register: step1→step2→step3→level-test ─────────
const steps = [
  {
    num: '1',
    svgPath: <path d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" />,
    title: 'Tạo tài khoản',
    desc:  'Điền email và mật khẩu. Thêm MSSV nếu muốn nhận nhãn Sinh viên ĐH Thái Bình đã xác thực — hoàn toàn tùy chọn.',
  },
  {
    num: '2',
    svgPath: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    title: 'Hoàn thiện hồ sơ',
    desc:  'Nhập họ tên, lớp, khoa. Chọn mục tiêu học (VSTEP / TOEIC / APTIS / Tổng quát) — AI sẽ lập lộ trình phù hợp.',
  },
  {
    num: '3',
    svgPath: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    title: 'Làm Level Test',
    desc:  'Bài kiểm tra ~20 phút đánh giá trình độ 4 kỹ năng. AI Gemini phân tích kết quả và lập kế hoạch học theo tuần.',
  },
  {
    num: '4',
    svgPath: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    title: 'Học & tiến bộ',
    desc:  'Flashcard SRS, luyện đề, chat với AI và theo dõi tiến độ mỗi ngày trên Dashboard.',
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
  { feature: 'Dashboard 4 kỹ năng chi tiết',   eh: true,  duolingo: false, toeicApp: false },
  { feature: 'Hoàn toàn miễn phí 100%',        eh: true,  duolingo: false, toeicApp: false },
  { feature: 'Lộ trình AI cá nhân hóa',        eh: true,  duolingo: false, toeicApp: false },
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

// ─── SVG ICON helpers ─────────────────────────────────────────────────────────
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

        /* ─ TOPBAR ─ */
        .topbar { background:var(--navy-dark); padding:8px 0; text-align:center; font-size:13px; color:rgba(255,255,255,0.6); letter-spacing:.3px; }
        .topbar span { color:var(--gold); font-weight:600; }

        /* ─ NAV ─ */
        .nav { position:sticky; top:0; z-index:100; background:var(--navy); padding:0 5%; display:flex; align-items:center; justify-content:space-between; height:68px; box-shadow:0 2px 20px rgba(0,0,0,.22); }
        .navLogo { display:flex; align-items:center; gap:14px; text-decoration:none; }
        .logoIcon { width:42px; height:42px; background:var(--gold); border-radius:10px; display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:20px; font-weight:800; color:var(--navy-dark); flex-shrink:0; }
        .logoText { display:flex; flex-direction:column; line-height:1.2; }
        .logoBrand { font-size:18px; font-weight:700; color:#fff; }
        .logoBrand span { color:var(--gold); }
        .logoSub { font-size:11px; color:rgba(255,255,255,.4); font-weight:300; letter-spacing:.5px; }
        .navLinks { display:flex; align-items:center; gap:30px; list-style:none; }
        .navLinks a { text-decoration:none; color:rgba(255,255,255,.68); font-size:14px; font-weight:500; transition:color .2s; }
        .navLinks a:hover { color:var(--gold); }
        .navActions { display:flex; align-items:center; gap:10px; }
        .btnLogin { padding:9px 20px; border:1.5px solid rgba(255,255,255,.22); color:#fff; background:transparent; border-radius:8px; font-size:13px; font-weight:500; font-family:'Be Vietnam Pro',sans-serif; transition:all .2s; text-decoration:none; }
        .btnLogin:hover { border-color:var(--gold); color:var(--gold); }
        .btnRegister { padding:9px 20px; background:var(--gold); color:var(--navy-dark); border:none; border-radius:8px; font-size:13px; font-weight:700; font-family:'Be Vietnam Pro',sans-serif; transition:all .2s; text-decoration:none; display:inline-flex; align-items:center; gap:7px; }
        .btnRegister:hover { background:var(--gold-light); transform:translateY(-1px); }

        /* ─ HERO ─ */
        .hero { background:var(--navy); min-height:92vh; display:flex; align-items:center; position:relative; overflow:hidden; }
        .heroBgImg { position:absolute; inset:0; }
        .heroBgImg img { width:100%; height:100%; object-fit:cover; opacity:.1; }
        .hero::before { content:''; position:absolute; top:-40%; right:-10%; width:700px; height:700px; border-radius:50%; background:radial-gradient(circle,rgba(200,168,75,.14) 0%,transparent 68%); pointer-events:none; }
        .hero::after  { content:''; position:absolute; bottom:-20%; left:-5%; width:450px; height:450px; border-radius:50%; background:radial-gradient(circle,rgba(0,168,120,.09) 0%,transparent 68%); pointer-events:none; }
        .heroDots { position:absolute; inset:0; pointer-events:none; z-index:1; background-image:radial-gradient(rgba(255,255,255,.04) 1px,transparent 1px); background-size:32px 32px; }
        .heroInner { max-width:1200px; margin:0 auto; padding:80px 5%; display:grid; grid-template-columns:1fr 1fr; gap:72px; align-items:center; position:relative; z-index:2; width:100%; }
        .heroBadge { display:inline-flex; align-items:center; gap:8px; padding:7px 16px; background:rgba(200,168,75,.12); border:1px solid rgba(200,168,75,.3); border-radius:50px; font-size:13px; color:var(--gold); font-weight:500; margin-bottom:24px; letter-spacing:.3px; }
        .heroBadge::before { content:''; display:inline-block; width:7px; height:7px; background:var(--gold); border-radius:50%; animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
        .heroH1 { font-family:'Playfair Display',serif; font-size:clamp(36px,4.5vw,58px); font-weight:800; color:#fff; line-height:1.15; margin-bottom:22px; letter-spacing:-.5px; }
        .heroH1 .a1 { color:var(--gold); }
        .heroH1 .a2 { color:#6EDCB8; }
        .heroDesc { font-size:16px; color:rgba(255,255,255,.6); line-height:1.8; margin-bottom:36px; max-width:480px; }
        .heroCta { display:flex; gap:14px; flex-wrap:wrap; }
        .ctaPrimary { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; background:var(--gold); color:var(--navy-dark); font-weight:700; font-size:15px; border-radius:10px; text-decoration:none; transition:all .25s; font-family:'Be Vietnam Pro',sans-serif; }
        .ctaPrimary:hover { background:var(--gold-light); transform:translateY(-2px); box-shadow:0 8px 28px rgba(200,168,75,.38); }
        .ctaSecondary { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; border:1.5px solid rgba(255,255,255,.22); color:rgba(255,255,255,.82); font-size:15px; border-radius:10px; text-decoration:none; transition:all .25s; font-family:'Be Vietnam Pro',sans-serif; }
        .ctaSecondary:hover { border-color:rgba(255,255,255,.5); color:#fff; transform:translateY(-2px); }
        .heroNote { margin-top:18px; font-size:13px; color:rgba(255,255,255,.3); }
        /* Badge MSSV nhỏ gọn dưới CTA */
        .mssvBadge { display:inline-flex; align-items:center; gap:7px; margin-top:14px; padding:7px 14px; background:rgba(0,168,120,.1); border:1px solid rgba(0,168,120,.22); border-radius:8px; font-size:12.5px; color:#4ECBA8; font-weight:500; }
        .mssvBadge svg { flex-shrink:0; color:#4ECBA8; }
        .heroCards { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .heroCard { background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.09); border-radius:16px; padding:22px 20px; transition:all .3s; backdrop-filter:blur(4px); }
        .heroCard:hover { background:rgba(255,255,255,.1); border-color:rgba(200,168,75,.35); transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,.2); }
        .heroCard:nth-child(2),.heroCard:nth-child(4) { margin-top:24px; }
        .cardIcon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; margin-bottom:14px; }
        .icon-green { background:rgba(0,168,120,.18); }
        .icon-gold  { background:rgba(200,168,75,.18); }
        .icon-blue  { background:rgba(100,130,240,.18); }
        .icon-red   { background:rgba(240,100,100,.18); }
        .heroCard h3 { font-size:14px; font-weight:700; color:#fff; margin-bottom:6px; }
        .heroCard p  { font-size:13px; color:rgba(255,255,255,.46); line-height:1.5; }

        /* ─ STATS ─ */
        .statsBar { background:var(--gold); padding:20px 5%; }
        .statsInner { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); text-align:center; }
        .statItem { padding:8px 16px; border-right:1px solid rgba(27,42,74,.2); }
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
        .uniHLItem { display:flex; align-items:center; gap:10px; padding:12px 14px; background:var(--cream); border-radius:10px; border:1px solid rgba(200,168,75,.2); font-size:13px; font-weight:600; color:var(--navy); }
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

        /* ─ FEATURES ─ */
        .featIntroRow { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:start; margin-bottom:56px; }
        .featImgStack { position:relative; }
        .featBubble { position:absolute; bottom:-20px; right:-20px; width:165px; height:115px; border-radius:14px; overflow:hidden; box-shadow:0 10px 36px rgba(27,42,74,.24); border:3px solid #fff; }
        .featBubbleLabel { position:absolute; top:-13px; left:14px; z-index:3; background:var(--gold); color:var(--navy-dark); font-size:11px; font-weight:700; padding:3px 10px; border-radius:6px; }
        .featCards { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
        .featCard { background:var(--white); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; transition:all .32s; position:relative; box-shadow:var(--shadow-sm); }
        .featCard:hover { transform:translateY(-7px); box-shadow:var(--shadow-lg); border-color:rgba(200,168,75,.42); }
        .featCardTop { height:152px; display:flex; align-items:center; justify-content:center; font-size:48px; transition:transform .4s; }
        .featCard:hover .featCardTop { transform:scale(1.06); }
        .featCardBody { padding:20px 20px 24px; }
        .featCardMeta { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .featIcon { width:38px; height:38px; background:var(--navy); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; }
        .featBadge { padding:3px 10px; background:var(--gold-faint); border:1px solid var(--border); color:#8B6914; border-radius:50px; font-size:11px; font-weight:700; letter-spacing:.4px; }
        .featCard h3 { font-size:15px; font-weight:700; color:var(--navy); margin-bottom:8px; }
        .featCard p  { font-size:13px; color:var(--text-mid); line-height:1.65; }
        .featCard::after { content:''; position:absolute; bottom:0; left:0; right:0; height:3px; background:var(--gold); transform:scaleX(0); transition:transform .3s; transform-origin:left; }
        .featCard:hover::after { transform:scaleX(1); }

        /* ─ EXAMS ─ */
        .examsSection { background:var(--navy); padding:88px 5%; }
        .examsGrid { display:grid; grid-template-columns:repeat(3,1fr); gap:26px; margin-top:50px; }
        .examCard { background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.09); border-radius:var(--r); overflow:hidden; transition:all .32s; }
        .examCard:hover { background:rgba(255,255,255,.1); border-color:rgba(200,168,75,.45); transform:translateY(-6px); box-shadow:0 22px 52px rgba(0,0,0,.32); }
        .examImgWrap { height:148px; overflow:hidden; position:relative; }
        .examImgWrap img { width:100%; height:148px; object-fit:cover; filter:brightness(.5) saturate(1.1); transition:transform .4s,filter .3s; display:block; }
        .examCard:hover .examImgWrap img { transform:scale(1.07); filter:brightness(.6) saturate(1.2); }
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
        .aiFeats { margin-top:32px; display:flex; flex-direction:column; gap:16px; }
        .aiFeatRow { display:flex; gap:14px; align-items:flex-start; }
        .aiFeatIcon { width:40px; height:40px; background:var(--white); border:1px solid var(--border); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; box-shadow:var(--shadow-sm); }
        .aiFeatText h4 { font-size:14px; font-weight:700; color:var(--navy); margin-bottom:3px; }
        .aiFeatText p  { font-size:13px; color:var(--text-mid); line-height:1.5; }

        /* ─ GALLERY ─ */
        .galleryHeadRow { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
        .galleryGrid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        .galleryItem { border-radius:16px; overflow:hidden; position:relative; cursor:pointer; }
        .galleryItem img { width:100%; height:210px; object-fit:cover; display:block; transition:transform .4s; }
        .galleryItem:hover img { transform:scale(1.07); }
        .galleryOverlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(15,30,53,.65),transparent 55%); opacity:0; transition:opacity .3s; display:flex; align-items:flex-end; padding:14px 16px; }
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

        /* ─ HOW IT WORKS ─ */
        .stepsSection { background:var(--cream); padding:88px 5%; text-align:center; }
        .stepsGrid { display:grid; grid-template-columns:repeat(4,1fr); margin-top:56px; position:relative; }
        .stepsGrid::before { content:''; position:absolute; top:31px; left:calc(12.5% + 8px); right:calc(12.5% + 8px); height:2px; background:linear-gradient(90deg,var(--gold),rgba(200,168,75,.12)); z-index:0; }
        .stepItem { padding:0 16px; text-align:center; position:relative; z-index:1; }
        /* icon circle — navy avec SVG doré, hover swap */
        .stepIcon { width:64px; height:64px; background:var(--navy); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--gold); margin:0 auto 20px; box-shadow:0 4px 20px rgba(27,42,74,.28); transition:all .25s; }
        .stepItem:hover .stepIcon { background:var(--gold); color:var(--navy-dark); transform:scale(1.1) rotate(-5deg); }
        .stepItem h3 { font-size:15px; font-weight:700; color:var(--navy); margin-bottom:8px; }
        .stepItem p  { font-size:13px; color:var(--text-mid); line-height:1.6; }

        /* ─ TESTIMONIALS ─ */
        .testiSection { background:var(--navy); padding:88px 5%; }
        .testiGrid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:50px; }
        .testiCard { background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.09); border-radius:var(--r); padding:28px 24px; transition:all .3s; position:relative; overflow:hidden; }
        .testiCard::before { content:'\u201C'; position:absolute; top:-8px; right:18px; font-family:'Playfair Display',serif; font-size:90px; color:rgba(200,168,75,.1); line-height:1; pointer-events:none; }
        .testiCard:hover { background:rgba(255,255,255,.09); border-color:rgba(200,168,75,.32); transform:translateY(-4px); }
        .stars { color:var(--gold); font-size:14px; margin-bottom:16px; display:flex; gap:3px; }
        .quoteText { font-size:14px; color:rgba(255,255,255,.7); line-height:1.78; margin-bottom:22px; font-style:italic; }
        .testiAuthor { display:flex; align-items:center; gap:12px; }
        .avatar { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0; border:2px solid rgba(200,168,75,.35); }
        .avatarGold  { background:rgba(200,168,75,.18); color:var(--gold); }
        .avatarGreen { background:rgba(0,168,120,.18); color:#00A878; }
        .avatarBlue  { background:rgba(100,120,240,.18); color:#6478f0; }
        .authorName { font-size:14px; font-weight:700; color:#fff; }
        .authorRole { font-size:12px; color:rgba(255,255,255,.38); }

        /* ─ FAQ ─ */
        .faqSection { background:var(--cream); padding:88px 5%; }
        .faqGrid { display:grid; grid-template-columns:1fr 1fr; gap:60px; margin-top:50px; align-items:start; }
        .faqList { display:flex; flex-direction:column; gap:12px; }
        .faqItem { background:var(--white); border:1px solid var(--border); border-radius:14px; padding:18px 20px; cursor:pointer; transition:all .22s; box-shadow:var(--shadow-sm); }
        .faqItem:hover { border-color:rgba(200,168,75,.4); box-shadow:var(--shadow-md); }
        .faqOpen { border-color:var(--gold) !important; box-shadow:0 4px 20px rgba(200,168,75,.12) !important; }
        .faqQ { display:flex; justify-content:space-between; align-items:center; gap:12px; }
        .faqQ span:first-child { font-size:14px; font-weight:600; color:var(--navy); line-height:1.4; }
        .faqIcon { font-size:20px; color:var(--gold); font-weight:700; flex-shrink:0; line-height:1; }
        .faqA { margin-top:12px; font-size:13.5px; color:var(--text-mid); line-height:1.72; padding-top:12px; border-top:1px solid #f0ead8; }
        .faqContact { background:var(--navy); border-radius:var(--r); padding:40px 36px; display:flex; flex-direction:column; gap:20px; }
        .faqContact h3 { font-family:'Playfair Display',serif; font-size:26px; font-weight:800; color:#fff; line-height:1.25; }
        .faqContact p  { font-size:14px; color:rgba(255,255,255,.55); line-height:1.7; }
        .faqContactItems { display:flex; flex-direction:column; gap:14px; }
        .faqContactItem { display:flex; align-items:center; gap:14px; padding:14px 16px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.09); border-radius:12px; }
        .faqContactIcon { font-size:20px; flex-shrink:0; }
        .faqContactText { font-size:13px; color:rgba(255,255,255,.75); }
        .faqContactText strong { color:#fff; display:block; font-size:14px; margin-bottom:1px; }

        /* ─ CTA ─ */
        .ctaSection { background:var(--gold); padding:80px 5%; text-align:center; }
        .ctaSection h2 { font-family:'Playfair Display',serif; font-size:42px; font-weight:800; color:var(--navy-dark); margin-bottom:16px; line-height:1.2; }
        .ctaSection > div > p { font-size:17px; color:rgba(15,30,53,.66); margin-bottom:36px; }
        .ctaBtns { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; }
        .ctaDark { padding:15px 32px; background:var(--navy); color:#fff; border-radius:10px; font-size:15px; font-weight:700; text-decoration:none; transition:all .25s; font-family:'Be Vietnam Pro',sans-serif; display:inline-flex; align-items:center; gap:9px; }
        .ctaDark:hover { background:var(--navy-dark); transform:translateY(-2px); box-shadow:0 8px 28px rgba(27,42,74,.38); }
        .ctaOutline { padding:15px 32px; border:2px solid rgba(15,30,53,.26); color:var(--navy-dark); border-radius:10px; font-size:15px; font-weight:600; text-decoration:none; transition:all .25s; font-family:'Be Vietnam Pro',sans-serif; display:inline-flex; align-items:center; gap:9px; }
        .ctaOutline:hover { border-color:var(--navy-dark); transform:translateY(-2px); }
        .ctaNoteRow { margin-top:20px; font-size:13px; color:rgba(15,30,53,.5); display:flex; align-items:center; justify-content:center; gap:16px; flex-wrap:wrap; }
        .ctaCheck { display:inline-flex; align-items:center; gap:5px; }
        .ctaCheckCircle { width:16px; height:16px; background:var(--navy); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:var(--gold); flex-shrink:0; }

        /* ─ FOOTER ─ */
        .footer { background:var(--navy-dark); padding:60px 5% 28px; }
        .footerGrid { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:2fr 1fr 1fr 1.5fr; gap:50px; margin-bottom:50px; }
        .fBrand { font-family:'Playfair Display',serif; font-size:24px; font-weight:800; color:#fff; margin-bottom:12px; }
        .fBrand span { color:var(--gold); }
        .fBrandDesc { font-size:13.5px; color:rgba(255,255,255,.4); line-height:1.75; margin-bottom:20px; }
        .fContacts { display:flex; flex-direction:column; gap:8px; }
        .fContactItem { display:flex; align-items:center; gap:8px; font-size:13px; color:rgba(255,255,255,.4); }
        .fColH { font-size:12px; font-weight:700; color:var(--gold); text-transform:uppercase; letter-spacing:1.2px; margin-bottom:18px; }
        .fLinks { list-style:none; display:flex; flex-direction:column; gap:10px; }
        .fLinks a { text-decoration:none; font-size:13.5px; color:rgba(255,255,255,.44); transition:color .2s; }
        .fLinks a:hover { color:var(--gold); }
        .footerBottom { max-width:1200px; margin:0 auto; padding-top:24px; border-top:1px solid rgba(255,255,255,.07); display:flex; justify-content:space-between; align-items:center; }
        .footerBottom p { font-size:13px; color:rgba(255,255,255,.26); }
        .techBadges { display:flex; gap:8px; }
        .techBadge { padding:4px 10px; background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.09); border-radius:6px; font-size:11px; color:rgba(255,255,255,.34); font-weight:600; }

        /* ─ RESPONSIVE ─ */
        @media (max-width:900px) {
          .heroInner,.uniGrid,.aiInner,.compareGrid,.featIntroRow,.faqGrid { grid-template-columns:1fr; gap:40px; }
          .heroCards { grid-template-columns:repeat(2,1fr); }
          .heroCard:nth-child(2),.heroCard:nth-child(4) { margin-top:0; }
          .stepsGrid { grid-template-columns:repeat(2,1fr); gap:32px; }
          .stepsGrid::before { display:none; }
          .examsGrid,.testiGrid,.featCards { grid-template-columns:1fr; }
          .statsInner { grid-template-columns:repeat(2,1fr); }
          .statItem:nth-child(2) { border-right:none; }
          .footerGrid { grid-template-columns:1fr 1fr; }
          .navLinks { display:none; }
          .galleryGrid { grid-template-columns:repeat(2,1fr); }
          .featBubble { display:none; }
          .platformTable thead th:nth-child(3),.platformTable td:nth-child(3) { display:none; }
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
          {/* Thay bằng /assets/hero/hero-bg.jpg khi có */}
          <img src={UNSPLASH.heroBg} alt="" />
        </div>
        <div className="heroDots" />
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
              {/* CTA chính: đăng ký bằng email (không đề MSSV) */}
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
            {/* Ghi chú MSSV nhỏ — tùy chọn, đúng với register flow */}
            <div className="mssvBadge">
              <IconShield />
              Có MSSV? Thêm khi đăng ký để nhận nhãn <strong style={{ marginLeft: 4 }}>✓ Sinh viên đã xác thực</strong>
            </div>
          </div>
          <div className="heroCards">
            {heroCards.map((c, i) => (
              <div key={i} className="heroCard">
                <div className={`cardIcon ${c.cls}`}>{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="statsBar">
        <div className="statsInner">
          {stats.map((s, i) => (
            <div key={i} className="statItem">
              <div className="statNum">{s.num}</div>
              <div className="statLabel">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════ UNIVERSITY ══════════════════ */}
      <section className="sec" style={{ background: 'var(--white)' }}>
        <div className="inner">
          <div className="uniGrid">
            <div className="uniImgWrap">
              {/* Thay bằng /assets/index/TBU.jpg khi có */}
              <img src="/assets/index/TBU.jpg" alt="Trường Đại học Thái Bình"
                style={{ width: '100%', height: '380px', objectFit: 'cover', display: 'block' }} />
              <div className="uniCaption">🏛️ Trường Đại học Thái Bình</div>
            </div>
            <div className="uniContent">
              <div className="tag">Về chúng tôi</div>
              <h2>Xây dựng cho sinh viên <span style={{ color: 'var(--gold)' }}>ĐH Thái Bình</span></h2>
              <p>EnglishHub ra đời từ một bài toán thực tế: sinh viên ĐH Thái Bình cần đạt chuẩn <strong>VSTEP B1</strong> để tốt nghiệp, nhưng thiếu công cụ học tập phù hợp, miễn phí và được cá nhân hóa.</p>
              <p>Dự án được phát triển trong khuôn khổ <strong>Khóa luận tốt nghiệp 2024–2025</strong> của Khoa Công nghệ Thông tin, hướng đến giải quyết đúng nhu cầu của sinh viên trong trường và cộng đồng người học.</p>
              <p>Đăng ký bằng <strong>email</strong> — nhanh chóng, đơn giản. Thêm <strong>MSSV</strong> để nhận nhãn xác thực sinh viên ĐH Thái Bình. Không cần thẻ tín dụng, hoàn toàn miễn phí.</p>
              <div className="uniHL">
                {uniHighlights.map((h, i) => (
                  <div key={i} className="uniHLItem"><div className="dot" />{h}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ COMPARE ══════════════════ */}
      <section className="sec" style={{ background: 'var(--cream)' }}>
        <div className="inner">
          <div style={{ maxWidth: 560 }}>
            <div className="tag">Tại sao EnglishHub?</div>
            <h2 className="h2">Vượt qua giới hạn của các <span className="g">nền tảng hiện tại</span></h2>
            <p className="sub">Các ứng dụng phổ biến phục vụ tốt một mục tiêu nhưng thiếu hoàn toàn các nhu cầu còn lại. EnglishHub giải quyết tất cả trong một nơi duy nhất.</p>
          </div>
          <div className="compareGrid">
            <div className="compareCol">
              <div className="compareHead bad">❌ &nbsp;Vấn đề hiện tại</div>
              <div className="compareBody">
                {problems.map((p, i) => (
                  <div key={i} className="compareRow"><span className="ci">{p.icon}</span>{p.text}</div>
                ))}
              </div>
            </div>
            <div className="compareCol">
              <div className="compareHead good">✓ &nbsp;EnglishHub giải quyết</div>
              <div className="compareBody">
                {solutions.map((s, i) => (
                  <div key={i} className="compareRow"><span className="ci">{s.icon}</span>{s.text}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section className="sec" id="features" style={{ background: 'var(--white)' }}>
        <div className="inner">
          <div className="featIntroRow">
            <div>
              <div className="tag">Tính năng</div>
              <h2 className="h2">Mọi thứ bạn cần để <span className="g">chinh phục tiếng Anh</span></h2>
              <p className="sub">6 module chức năng được thiết kế tích hợp chặt chẽ, hỗ trợ toàn bộ hành trình học từ cơ bản đến thi chứng chỉ quốc tế.</p>
              <Link href="/register" className="ctaPrimary" style={{ display: 'inline-flex', marginTop: 28, background: 'var(--navy)', color: '#fff' }}>
                <IconRocket size={16} />
                Khám phá ngay
              </Link>
            </div>
            <div className="featImgStack">
              {/* Thay bằng /assets/index/Language.jpg khi có */}
              <img src="/assets/index/Language.jpg" alt="Học tiếng Anh với EnglishHub"
                style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-lg)', display: 'block' }} />
              <div className="featBubble">
                <div className="featBubbleLabel">Dashboard AI</div>
                {/* Thay bằng /assets/features/dashboard-preview.jpg khi có */}
                <img src={UNSPLASH.dashPreview} alt="Dashboard preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </div>

          <div className="featCards">
            {features.map((f, i) => (
              <div key={i} className="featCard">
                <div className="featCardTop" style={{ background: `linear-gradient(135deg, ${f.color}22, ${f.color}0a)` }}>
                  {f.icon}
                </div>
                <div className="featCardBody">
                  <div className="featCardMeta">
                    <div className="featIcon">{f.icon}</div>
                    <span className="featBadge">{f.badge}</span>
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ EXAMS ══════════════════ */}
      <section className="examsSection" id="exams">
        <div className="inner">
          <div style={{ maxWidth: 560 }}>
            <div className="tagDark">Luyện thi chứng chỉ</div>
            <h2 className="h2 h2w">3 chứng chỉ · <span className="g">1 nền tảng</span></h2>
            <p className="sub subD">Đề mẫu riêng từng loại chứng chỉ, phân tích điểm mạnh yếu chi tiết sau mỗi bài thi, và AI Gemini hỗ trợ giải thích ngay trong khi làm bài.</p>
          </div>
          <div className="examsGrid">
            {exams.map((e, i) => (
              <div key={i} className="examCard">
                <div className="examImgWrap">
                  {/* Thay bằng /assets/exams/*.jpg khi có */}
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
          </div>
        </div>
      </section>

      {/* ══════════════════ AI SECTION ══════════════════ */}
      <section className="sec" id="ai" style={{ background: 'var(--cream)' }}>
        <div className="inner">
          <div className="aiInner">
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
              {/* Ảnh dashboard — thay bằng /assets/features/dashboard-full.jpg khi có */}
              <div className="aiDashSnap" style={{ marginTop: 16 }}>
                <img src={UNSPLASH.dashFull} alt="Dashboard EnglishHub" />
              </div>
            </div>

            <div>
              <div className="tag">AI Gemini miễn phí</div>
              <h2 className="h2">Trợ lý học tập <span className="g">thông minh 24/7</span></h2>
              <p className="sub">Tích hợp Google Gemini 2.0 Flash — hoàn toàn miễn phí, không cần thẻ tín dụng. Hỗ trợ hoàn toàn bằng tiếng Việt.</p>
              <div className="aiFeats">
                {aiFunctions.map((f, i) => (
                  <div key={i} className="aiFeatRow">
                    <div className="aiFeatIcon">{f.icon}</div>
                    <div className="aiFeatText">
                      <h4>{f.title}</h4>
                      <p>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ GALLERY ══════════════════ */}
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
          {/* Thay bằng /assets/gallery/students-0X.jpg khi có */}
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

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      {/* Flow khớp chính xác register.tsx: Bước 1 Tài khoản → Bước 2 Hồ sơ → Bước 3 Mục tiêu → Level Test */}
      <section className="stepsSection" id="how">
        <div className="inner">
          <div className="tag" style={{ display: 'inline-flex' }}>Cách hoạt động</div>
          <h2 className="h2">Bắt đầu học trong <span className="g">4 bước đơn giản</span></h2>
          <p className="sub" style={{ margin: '0 auto' }}>
            Chỉ cần email là đủ để đăng ký — thêm MSSV tùy chọn để xác thực sinh viên ĐH Thái Bình. Không cần thẻ tín dụng.
          </p>
          <div className="stepsGrid">
            {steps.map((s, i) => (
              <div key={i} className="stepItem">
                <div className="stepIcon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {s.svgPath}
                  </svg>
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="testiSection">
        <div className="inner">
          <div style={{ maxWidth: 560 }}>
            <div className="tagDark">Người dùng nói gì</div>
            <h2 className="h2 h2w">Sinh viên <span className="g">ĐH Thái Bình</span> đánh giá</h2>
          </div>
          <div className="testiGrid">
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
          </div>
        </div>
      </section>

      {/* ══════════════════ FAQ ══════════════════ */}
      <section className="faqSection" id="faq">
        <div className="inner">
          <div className="tag" style={{ display: 'inline-flex' }}>Câu hỏi thường gặp</div>
          <h2 className="h2">Bạn còn <span className="g">thắc mắc?</span></h2>
          <div className="faqGrid">
            <div className="faqList">
              {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
            </div>
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
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section className="ctaSection">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
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