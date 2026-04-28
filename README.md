# 🎓 EnglishHub — Nền tảng học tiếng Anh AI

> Stack: **Next.js 14** · **Supabase** · **Vercel** · **Gemini AI** · **Free Dictionary API**

---

## ✨ Tính năng

| Module | Mô tả |
|--------|-------|
| 🔐 **Auth MSSV** | Đăng ký/đăng nhập bằng mã số sinh viên |
| 🃏 **Flashcard SRS** | Thuật toán SM-2, 4 mức độ khó |
| 🤖 **Hybrid AI Vocab** | Dictionary API + Gemini sinh nghĩa, ví dụ, cách nhớ |
| 📖 **Ngữ pháp** | Bài học A1→C1 kèm bài tập tương tác |
| 📝 **Luyện thi** | VSTEP B1, TOEIC, APTIS — AI phân tích kết quả |
| 💬 **AI Chatbot** | Gemini 2.0 Flash, xoay vòng 3 key |
| 🎯 **Level Test** | 10 câu, AI đề xuất lộ trình học |
| 📊 **Dashboard** | Streak, biểu đồ 4 kỹ năng, ôn tập hôm nay |

---

## 🚀 Triển khai

### 1. Clone & Cài dependencies

```bash
git clone <repo-url>
cd englishhub
npm install
```

### 2. Tạo Supabase project

1. Vào [supabase.com](https://supabase.com) → New project
2. Vào **SQL Editor** → chạy file `supabase-schema.sql`
3. Chạy tiếp `supabase-seed-words.sql`
4. Vào **Project Settings → API** → copy URL và anon key

### 3. Lấy Gemini API keys

1. Vào [aistudio.google.com](https://aistudio.google.com)
2. Tạo **3 API key** miễn phí (mỗi key ~60 req/phút)
3. Hệ thống tự xoay vòng key khi bị rate limit

### 4. Cấu hình môi trường

```bash
cp .env.example .env.local
```

Điền vào `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
GEMINI_API_KEY_1=AIzaSy...
GEMINI_API_KEY_2=AIzaSy...
GEMINI_API_KEY_3=AIzaSy...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Chạy dev

```bash
npm run dev
```

### 6. Deploy lên Vercel

```bash
# Push lên GitHub trước
git add . && git commit -m "feat: initial EnglishHub"
git push origin main

# Sau đó connect GitHub repo trên vercel.com
# Thêm các biến môi trường trong Vercel Dashboard
```

---

## 💡 Kiến trúc Hybrid AI Vocabulary

```
User học từ "meticulous"
        │
        ▼
┌─────────────────┐
│  Check Supabase │ ──HIT──► Trả về cache ngay
│  TuVungCache    │
└────────┬────────┘
         │ MISS
         ▼
┌─────────────────┐
│ Free Dictionary │ ──► Phát âm IPA + Audio URL
│     API         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gemini 2.0     │ ──► Nghĩa TV + Ví dụ TOEIC + Cách nhớ
│  Flash AI       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Lưu cache vào  │ ──► Lần sau dùng luôn, không gọi API nữa
│  TuVungCache    │
└─────────────────┘
```

**Ưu điểm:** Không cần nhập từ thủ công · Kho từ vô hạn · Cache thông minh

---

## 📁 Cấu trúc dự án

```
englishhub/
├── src/
│   ├── app/
│   │   ├── (auth)/login, register
│   │   ├── (dashboard)/dashboard, vocabulary, grammar, exam, ai-chat, level-test
│   │   └── api/ai, vocabulary, exam, auth, dashboard
│   ├── components/
│   │   ├── ui/Sidebar
│   │   ├── flashcard/FlashcardView
│   │   └── exam/ExamSession, GrammarLesson
│   ├── lib/
│   │   ├── supabase/ (client, server, middleware)
│   │   ├── gemini/ (client với key rotation)
│   │   └── dictionary/ (Free Dict API + SM-2)
│   └── types/
├── supabase-schema.sql     ← Chạy trước
├── supabase-seed-words.sql ← Chạy sau
└── .env.example
```

---

## 🔑 Tài khoản Admin

Sau khi đăng ký tài khoản, vào Supabase → Table Editor → NguoiDung → đổi `vai_tro` thành `admin`.

---

*EnglishHub © 2025 — ĐH Thái Bình · Khóa luận tốt nghiệp*
