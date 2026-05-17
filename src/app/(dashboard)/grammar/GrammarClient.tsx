'use client'

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BookOpen, Brain, CheckCircle2, ChevronRight,
  FileText, Flame, Target, Zap,
  Send, X, AlertTriangle,
  PenLine, Lightbulb, Check, XCircle,
  ArrowRight, ArrowLeft, Home, RotateCcw,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      '#F8F5EE',
  white:   '#FFFFFF',
  navy:    '#0F1C35',
  navyMid: '#1E2F50',
  gold:    '#C9A84C',
  goldLt:  '#E8C97A',
  goldPale:'#FDF8EE',
  green:   '#00A878',
  greenLt: '#4ECBA8',
  blue:    '#2B6CB0',
  blueLt:  '#4299E1',
  violet:  '#6478F0',
  rose:    '#F06464',
  slate:   '#64748B',
  border:  'rgba(201,168,76,0.18)',
  borderMd:'rgba(201,168,76,0.30)',
  text:    '#1A1E2E',
  textMid: '#4A5568',
  textLt:  '#94A3B8',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Exercise = {
  type: "mc" | "tf" | "fill" | "order";
  q?: string;
  opts?: string[];
  ans: number | boolean | string;
  exp: string;
  words?: string[];
};
type TheoryItem = {
  formula: { label: string; f: string }[];
  uses: { chip: string; ex: string }[];
  note?: string;
  signalWords?: string[];
};
type Lesson = {
  id: string;
  title: string;
  level: string;
  theory: TheoryItem;
  exercises: Exercise[];
  chapterId?: string;
  chapterColor?: string;
};
type Chapter = {
  id: string;
  title: string;
  icon: string;
  color: string;
  desc: string;
  lessons: Lesson[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const LEVEL_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  A1: { bg: "#FFF8EC", color: "#7a5c00",  border: "rgba(201,168,76,.3)"  },
  A2: { bg: "#FDF8EE", color: "#854F0B",  border: "rgba(201,168,76,.35)" },
  B1: { bg: "#E1F5EE", color: "#0F6E56",  border: "rgba(0,168,120,.3)"   },
  B2: { bg: "#E6F1FB", color: "#185FA5",  border: "rgba(24,95,165,.3)"   },
  C1: { bg: "#EEEDFE", color: "#534AB7",  border: "rgba(100,120,240,.3)" },
  C2: { bg: "#FBEAF0", color: "#993556",  border: "rgba(240,100,100,.2)" },
};

function LevelBadge({ level }: { level: string }) {
  const s = LEVEL_STYLE[level] || LEVEL_STYLE.A1;
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 5, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: ".04em",
    }}>{level}</span>
  );
}

function ProgressBar({ value, color = C.gold }: { value: number; color?: string }) {
  return (
    <div style={{ height: 6, background: `${C.navy}08`, borderRadius: 3, overflow: "hidden" }}>
      <div style={{
        width: `${value}%`, height: "100%", background: color, borderRadius: 3,
        transition: "width .5s cubic-bezier(.16,1,.3,1)",
      }} />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, sub, color }: {
  icon: React.ElementType; title: string; sub?: string; color: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `${color}15`, border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={24} color={color} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{
          fontSize: 18, fontWeight: 700, color: C.navy,
          fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.2px',
        }}>{title}</div>
        {sub && <div style={{ fontSize: 15, color: C.textMid, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.white, borderRadius: 20,
      border: `1px solid rgba(201,168,76,.18)`,
      padding: '28px 30px',
      boxShadow: '0 2px 12px rgba(15,28,53,.07)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
function ConfirmModal({
  total, answered, onConfirm, onCancel,
}: {
  total: number; answered: number; onConfirm: () => void; onCancel: () => void;
}) {
  const unanswered = total - answered;
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,28,53,0.55)",
        backdropFilter: "blur(5px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
    >
      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform:translateY(20px) scale(.96) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: 24,
          border: `1px solid rgba(201,168,76,.22)`,
          boxShadow: "0 24px 64px rgba(15,28,53,.2)",
          padding: "36px 32px 28px",
          maxWidth: 420, width: "100%",
          animation: "modalIn .24s cubic-bezier(.16,1,.3,1)",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div style={{
          width: 68, height: 68, borderRadius: 22,
          background: "rgba(201,168,76,.1)",
          border: "1px solid rgba(201,168,76,.28)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 22px",
        }}>
          <Send size={30} color={C.gold} strokeWidth={1.8} />
        </div>

        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22, fontWeight: 900, color: C.navy, marginBottom: 12,
        }}>
          Nộp bài kiểm tra?
        </div>

        {/* Status */}
        {unanswered > 0 ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
            background: "#FFFBEB", border: "1px solid rgba(201,168,76,.35)",
            borderRadius: 12, padding: "10px 16px",
            fontSize: 14, color: "#7a5c00", marginBottom: 16,
          }}>
            <AlertTriangle size={15} color={C.gold} strokeWidth={2} />
            Còn <strong style={{ margin: "0 3px" }}>{unanswered}</strong> câu chưa trả lời
          </div>
        ) : (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
            background: "#E6FDF4", border: "1px solid rgba(0,168,120,.25)",
            borderRadius: 12, padding: "10px 16px",
            fontSize: 14, color: "#0F6E56", marginBottom: 16,
          }}>
            <CheckCircle2 size={15} color={C.green} strokeWidth={2} />
            Đã trả lời tất cả <strong style={{ margin: "0 3px" }}>{total}</strong> câu ✓
          </div>
        )}

        <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.75, marginBottom: 26 }}>
          Sau khi nộp, bạn sẽ thấy kết quả và giải thích chi tiết cho từng câu.
        </p>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 50,
              background: "transparent", border: `1px solid ${C.border}`,
              color: C.textMid, fontSize: 15, fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all .18s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = C.bg;
              (e.currentTarget as HTMLButtonElement).style.borderColor = C.borderMd;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
            }}
          >
            <X size={15} strokeWidth={2} />
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 2, padding: "13px 0", borderRadius: 50,
              background: C.gold, color: C.navy,
              border: "none", fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 6px 20px rgba(201,168,76,.4)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all .22s cubic-bezier(.34,1.56,.64,1)",
            }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.transform = "translateY(-2px)";
              b.style.boxShadow = "0 12px 32px rgba(201,168,76,.5)";
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.transform = "translateY(0)";
              b.style.boxShadow = "0 6px 20px rgba(201,168,76,.4)";
            }}
          >
            <Send size={16} strokeWidth={2} />
            Nộp bài ngay
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SuccessToast ─────────────────────────────────────────────────────────────
function SuccessToast({ score, total }: { score: number; total: number }) {
  const p = total > 0 ? Math.round((score / total) * 100) : 0;
  const label = p >= 80 ? "Xuất sắc!" : p >= 60 ? "Tốt lắm!" : "Cố lên nhé!";
  const accent = p >= 80 ? C.greenLt : p >= 60 ? C.goldLt : "#F08080";

  return (
    <div style={{
      position: "fixed", bottom: 32, right: 32, zIndex: 1100,
      background: C.navy,
      border: `1px solid rgba(201,168,76,.3)`,
      borderRadius: 20,
      boxShadow: "0 16px 48px rgba(15,28,53,.3)",
      padding: "18px 22px",
      display: "flex", alignItems: "center", gap: 16,
      minWidth: 280, maxWidth: 360,
    }}>
      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateX(28px) scale(.96) }
          to   { opacity:1; transform:translateX(0) scale(1) }
        }
        @keyframes toastOut {
          from { opacity:1; transform:translateX(0) }
          to   { opacity:0; transform:translateX(28px) }
        }
        .toast-enter { animation: toastIn .32s cubic-bezier(.16,1,.3,1) both }
      `}</style>
      <div className="toast-enter" style={{ display: "flex", alignItems: "center", gap: 16, width: "100%" }}>
        {/* Icon */}
        <div style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: p >= 60 ? "rgba(0,168,120,.15)" : "rgba(240,100,100,.15)",
          border: `1px solid ${p >= 60 ? "rgba(0,168,120,.35)" : "rgba(240,100,100,.35)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CheckCircle2
            size={22}
            color={p >= 60 ? C.green : C.rose}
            strokeWidth={2}
          />
        </div>
        {/* Text */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 15, fontWeight: 700, color: "#fff",
            marginBottom: 3, fontFamily: "'DM Sans', sans-serif",
          }}>
            Nộp bài thành công!
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>
            {score}/{total} câu đúng · {label}
          </div>
        </div>
        {/* Score */}
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 28, fontWeight: 900, color: accent, lineHeight: 1,
          flexShrink: 0,
        }}>
          {p}%
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GrammarPage() {
  const [view, setView] = useState("home");
  const [CHAPTERS, setCHAPTERS] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [tab, setTab] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number | boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState<Record<string, { score: number; total: number }>>({});
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // ── NEW states ──
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    async function fetchGrammar() {
      const { data, error } = await supabase
        .from("BaiHocNguPhap")
        .select("*")
        .order("thu_tu_hien_thi");

      if (error || !data) { setLoading(false); return; }

      const iconMap: Record<string, string> = {
        "Thì động từ": "⏱", "Câu điều kiện": "🔀", "Câu bị động": "🔄",
        "Động từ khuyết thiếu": "💬", "Danh từ & Mạo từ": "📝",
        "Tính từ & Trạng từ": "✨", "Mệnh đề quan hệ": "🔗",
        "Câu gián tiếp": "💭", "Phrasal Verbs": "🔁", "Subjunctive & Wish": "💫",
        "Câu chẻ & Đảo ngữ": "🔦", "Liên từ & Giới từ": "🔗",
        "Gerund & Infinitive": "📐", "Ngữ pháp C2": "🏆", "Ôn tập tổng hợp": "📋",
      };
      const colorMap: Record<string, string> = {
        "Thì động từ": "#185FA5", "Câu điều kiện": "#6478F0", "Câu bị động": "#00A878",
        "Động từ khuyết thiếu": "#06B6D4", "Danh từ & Mạo từ": "#C9A84C",
        "Tính từ & Trạng từ": "#F06464", "Mệnh đề quan hệ": "#EC4899",
        "Câu gián tiếp": "#1E2F50", "Phrasal Verbs": "#7C3AED", "Subjunctive & Wish": "#B45309",
        "Câu chẻ & Đảo ngữ": "#0F766E", "Liên từ & Giới từ": "#9333EA",
        "Gerund & Infinitive": "#0369A1", "Ngữ pháp C2": "#991B1B", "Ôn tập tổng hợp": "#374151",
      };

      const grouped: Record<string, Chapter> = {};
      data.forEach((row: any) => {
        const key = row.danh_muc || "Khác";
        if (!grouped[key]) {
          grouped[key] = {
            id: key.toLowerCase().replace(/\s+/g, "_"),
            title: key, icon: iconMap[key] || "📚",
            color: colorMap[key] || "#6B7280",
            desc: `Các bài học về ${key}`, lessons: [],
          };
        }
        const rawTheory = row.noi_dung_json || {};
        const normalizedTheory: TheoryItem = {
          formula: Array.isArray(rawTheory.formula) ? rawTheory.formula : [],
          uses: Array.isArray(rawTheory.uses) ? rawTheory.uses : [],
          signalWords: Array.isArray(rawTheory.signalWords) ? rawTheory.signalWords : [],
          note: rawTheory.note || null,
        };
        grouped[key].lessons.push({
          id: row.id, title: row.tieu_de, level: row.cap_do,
          theory: normalizedTheory,
          exercises: Array.isArray(row.bai_tap_json) ? row.bai_tap_json : [],
        });
      });
      setCHAPTERS(Object.values(grouped));
      setLoading(false);
    }
    fetchGrammar();
  }, []);

  // ── Derived state ──
  const allLessons = CHAPTERS.flatMap(c =>
    c.lessons.map(l => ({ ...l, chapterId: c.id, chapterTitle: c.title, chapterColor: c.color }))
  );
  const totalLessons = allLessons.length;
  const completedCount = Object.keys(completed).length;
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // ── Score (memo-safe) ──
  const calcScore = (lesson: Lesson, ans: Record<number, string | number | boolean>) =>
    lesson.exercises.filter((ex, i) => {
      if (ex.type === "mc") return ans[i] === ex.ans;
      if (ex.type === "tf") return ans[i] === ex.ans;
      if (ex.type === "fill" || ex.type === "order")
        return String(ans[i] || "").trim().toLowerCase() === String(ex.ans).toLowerCase();
      return false;
    }).length;

  const currentScore = submitted && activeLesson ? calcScore(activeLesson, answers) : 0;

  // ── Handlers ──
  function openLesson(lesson: Lesson) {
    setActiveLesson(lesson); setView("lesson"); setTab(0);
    setAnswers({}); setSubmitted(false);
    setShowConfirm(false); setShowSuccess(false);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }
  function openChapter(ch: Chapter) {
    setActiveChapter(ch); setView("chapter"); setFilterLevel(null);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }
  function goHome() { setView("home"); setActiveChapter(null); setActiveLesson(null); }
  function goChapter() {
    setView("chapter"); setActiveLesson(null); setTab(0);
    setAnswers({}); setSubmitted(false);
  }
  function handleAnswer(idx: number, val: string | number | boolean) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [idx]: val }));
  }

  // ── NEW: Two-step submit ──
  function handleSubmitClick() {
    if (!activeLesson) return;
    const total    = activeLesson.exercises.length;
    const answered = Object.keys(answers).length;
    if (answered < total) {
      // Vẫn mở modal để thông báo còn câu chưa trả lời
      setShowConfirm(true);
      return;
    }
    setShowConfirm(true);
  }

  function confirmSubmit() {
    if (!activeLesson) return;
    const score = calcScore(activeLesson, answers);
    const total = activeLesson.exercises.length;
    setShowConfirm(false);
    setSubmitted(true);
    setShowSuccess(true);
    // Auto-dismiss toast after 3.5s
    setTimeout(() => setShowSuccess(false), 3500);
    if (score >= Math.ceil(total * 0.6)) {
      setCompleted(prev => ({ ...prev, [activeLesson.id]: { score, total } }));
    }
  }

  function resetQuiz() { setAnswers({}); setSubmitted(false); setShowSuccess(false); }

  const navItems = CHAPTERS.map(ch => ({
    ...ch,
    done: ch.lessons.filter(l => completed[l.id]).length,
    total: ch.lessons.length,
  }));

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 22,
            fontWeight: 900, color: C.navy, marginBottom: 8,
          }}>Grammar</div>
          <div style={{ fontSize: 14, color: C.textLt }}>Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: C.bg,
      fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.7,
    }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: ${C.bg}; }
          ::-webkit-scrollbar { width: 4px; height: 4px; }
          ::-webkit-scrollbar-thumb { background: rgba(201,168,76,.25); border-radius: 4px; }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .fade-in { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) both; }
          .chapter-card, .lesson-card { transition: all .28s cubic-bezier(.16,1,.3,1); }
          .chapter-card:hover, .lesson-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 28px rgba(15,28,53,.1) !important;
            border-color: rgba(201,168,76,.35) !important;
          }
          .nav-item { transition: all .2s; }
          .nav-item:hover { background: ${C.goldPale}; }
          .opt-btn { transition: all .15s; }
          .opt-btn:hover:not(.opt-disabled) {
            border-color: rgba(201,168,76,.5) !important;
            background: ${C.goldPale} !important;
          }
          .tab-btn { transition: all .2s; }
          .tab-btn:hover { color: ${C.navy} !important; }
          @keyframes modalIn {
            from { opacity:0; transform:translateY(20px) scale(.96) }
            to   { opacity:1; transform:translateY(0) scale(1) }
          }
          @keyframes toastIn {
            from { opacity:0; transform:translateX(28px) scale(.96) }
            to   { opacity:1; transform:translateX(0) scale(1) }
          }
          @media (max-width: 768px) {
            .dash-panel { padding: 18px 16px !important; }
          }
        `
      }} />

      {/* ── Confirm Modal ── */}
      {showConfirm && activeLesson && (
        <ConfirmModal
          total={activeLesson.exercises.length}
          answered={Object.keys(answers).length}
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* ── Success Toast ── */}
      {showSuccess && activeLesson && (
        <SuccessToast score={currentScore} total={activeLesson.exercises.length} />
      )}

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <nav style={{
          width: 260, minHeight: "100vh", background: C.white,
          borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column",
          position: "sticky", top: 0, height: "100vh",
          overflowY: "auto", flexShrink: 0,
        }}>
          <div style={{ padding: "28px 24px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20, fontWeight: 900, color: C.navy,
            }}>Grammar</div>
            <div style={{ fontSize: 12, color: C.textLt, marginTop: 4 }}>English Foundation · A1 → C1</div>
          </div>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 13, color: C.textLt, marginBottom: 8,
            }}>
              <span>Tiến độ tổng thể</span>
              <span style={{ color: C.gold, fontWeight: 700 }}>{completedCount}/{totalLessons}</span>
            </div>
            <ProgressBar value={overallPct} />
          </div>
          <div style={{ flex: 1, padding: "12px 0" }}>
            {navItems.map(ch => {
              const isActive = activeChapter?.id === ch.id;
              const pct = ch.total ? Math.round((ch.done / ch.total) * 100) : 0;
              return (
                <div
                  key={ch.id} className="nav-item"
                  onClick={() => openChapter(ch)}
                  style={{
                    padding: "12px 20px", cursor: "pointer",
                    borderLeft: `3px solid ${isActive ? ch.color : "transparent"}`,
                    background: isActive ? `${ch.color}08` : "transparent",
                    display: "flex", alignItems: "center", gap: 12,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{ch.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: isActive ? 700 : 500,
                      color: isActive ? C.navy : C.textMid,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{ch.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 3, background: "rgba(15,28,53,.08)", borderRadius: 2 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: ch.color, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 12, color: C.textLt, flexShrink: 0 }}>
                        {ch.done}/{ch.total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{
            padding: "16px 20px", borderTop: `1px solid ${C.border}`,
            fontSize: 13, color: C.textLt, textAlign: "center",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {completedCount === 0
              ? <><Zap size={13} color={C.gold} strokeWidth={2} /> Bắt đầu học ngay!</>
              : <><Flame size={13} color={C.gold} strokeWidth={2} /> {overallPct}% hoàn thành · Cố lên!</>}
          </div>
        </nav>
      )}

      {/* ── Main ── */}
      <main
        ref={mainRef}
        style={{
          flex: 1, padding: "32px clamp(20px,4vw,48px) 64px",
          overflowY: "auto", minWidth: 0,
        }}
      >
        {/* ══ HOME ══ */}
        {view === "home" && (
          <div className="fade-in" style={{ maxWidth: 1320, margin: '0 auto' }}>
            <div style={{
              background: C.navy, borderRadius: 24, padding: "32px 36px",
              marginBottom: 32, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -40, right: -40,
                width: 180, height: 180, background: "rgba(201,168,76,.07)",
                borderRadius: "60% 40% 30% 70%", pointerEvents: "none",
              }} />
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 14px", background: "rgba(201,168,76,.12)",
                border: "1px solid rgba(201,168,76,.25)", borderRadius: 50,
                fontSize: 11, fontWeight: 700, color: C.gold,
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 16,
              }}>
                Ngữ pháp tiếng Anh
              </div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(26px,4vw,40px)", fontWeight: 900,
                color: "#fff", marginBottom: 12, lineHeight: 1.2,
              }}>
                Nền tảng ngữ pháp <span style={{ color: C.gold }}>A1 → C1</span>
              </h1>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,.55)", maxWidth: 520, lineHeight: 1.7 }}>
                {CHAPTERS.length} chương · {totalLessons} bài học · Lý thuyết + Bài tập đa dạng
              </p>
              <div style={{ display: "flex", gap: 20, marginTop: 28, flexWrap: "wrap" }}>
                {[
                  { label: "Bài hoàn thành", val: completedCount, color: C.greenLt },
                  { label: "Tổng bài học",   val: totalLessons,    color: C.goldLt  },
                  { label: "Tiến độ",         val: `${overallPct}%`, color: C.violet },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(201,168,76,.18)",
                    borderRadius: 16, padding: "12px 20px",
                  }}>
                    <div style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 28, fontWeight: 900, color: s.color,
                    }}>{s.val}</div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginTop: 4 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fill, minmax(300px, 1fr))`,
              gap: 18,
            }}>
              {CHAPTERS.map(ch => {
                const done = ch.lessons.filter(l => completed[l.id]).length;
                const pct = ch.lessons.length ? Math.round((done / ch.lessons.length) * 100) : 0;
                return (
                  <div
                    key={ch.id} className="chapter-card"
                    onClick={() => openChapter(ch)}
                    style={{
                      background: C.white, borderRadius: 20,
                      border: `1px solid ${C.border}`,
                      padding: "24px", cursor: "pointer",
                      boxShadow: "0 2px 12px rgba(15,28,53,.06)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 16,
                        background: `${ch.color}12`, border: `1px solid ${ch.color}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24, flexShrink: 0,
                      }}>{ch.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 18, fontWeight: 800, color: C.navy, marginBottom: 4,
                        }}>{ch.title}</div>
                        <div style={{ fontSize: 14, color: C.textMid }}>{ch.desc}</div>
                      </div>
                    </div>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: 13, color: C.textLt, marginBottom: 8,
                    }}>
                      <span>{ch.lessons.length} bài học</span>
                      <span style={{ color: ch.color, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} color={ch.color} />
                    <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                      {Array.from(new Set(ch.lessons.map(l => l.level))).map(lv => (
                        <LevelBadge key={lv} level={lv} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ CHAPTER ══ */}
        {view === "chapter" && activeChapter && (
          <div className="fade-in" style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{
              fontSize: 14, color: C.textLt, marginBottom: 24,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ cursor: "pointer", color: C.gold, display: "flex", alignItems: "center", gap: 4 }} onClick={goHome}>
                <Home size={13} strokeWidth={2} />Ngữ pháp
              </span>
              <ChevronRight size={14} color={C.textLt} strokeWidth={1.8} />
              <span style={{ color: C.navy, fontWeight: 600 }}>{activeChapter.title}</span>
            </div>

            <div style={{
              background: C.navy, borderRadius: 24, padding: "28px 32px",
              marginBottom: 28, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -40, right: -40,
                width: 160, height: 160, background: "rgba(201,168,76,.07)",
                borderRadius: "60% 40% 30% 70%", pointerEvents: "none",
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `${activeChapter.color}18`,
                  border: `1px solid ${activeChapter.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, flexShrink: 0,
                }}>{activeChapter.icon}</div>
                <div>
                  <h2 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "clamp(20px,3vw,28px)", fontWeight: 900,
                    color: "#fff", marginBottom: 6,
                  }}>{activeChapter.title}</h2>
                  <p style={{ fontSize: 15, color: "rgba(255,255,255,.55)" }}>
                    {activeChapter.desc} · {activeChapter.lessons.length} bài học
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              display: "flex", gap: 6, marginBottom: 24, background: C.white,
              padding: 6, borderRadius: 50, border: `1px solid ${C.border}`,
              width: "fit-content", flexWrap: "wrap",
            }}>
              {["Tất cả", ...Array.from(new Set(activeChapter.lessons.map(l => l.level)))].map(lv => {
                const isActive = lv === "Tất cả" ? !filterLevel : filterLevel === lv;
                return (
                  <button
                    key={lv}
                    onClick={() => setFilterLevel(lv === "Tất cả" ? null : lv)}
                    style={{
                      padding: "6px 18px", borderRadius: 50,
                      fontSize: 13, fontWeight: 600,
                      border: "none", cursor: "pointer", fontFamily: "inherit",
                      background: isActive ? C.navy : "transparent",
                      color: isActive ? "#fff" : C.textMid,
                      boxShadow: isActive ? "0 2px 8px rgba(15,28,53,.2)" : "none",
                    }}
                  >{lv}</button>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activeChapter.lessons
                .filter(l => !filterLevel || l.level === filterLevel)
                .map((lesson, i) => {
                  const isDone = !!completed[lesson.id];
                  const comp = completed[lesson.id];
                  return (
                    <div
                      key={lesson.id} className="lesson-card"
                      onClick={() => openLesson({
                        ...lesson, chapterId: activeChapter.id, chapterColor: activeChapter.color,
                      })}
                      style={{
                        background: C.white, borderRadius: 18,
                        border: `1px solid ${isDone ? "rgba(0,168,120,.25)" : C.border}`,
                        padding: "20px 24px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 18,
                        boxShadow: "0 2px 8px rgba(15,28,53,.05)",
                      }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: isDone ? "rgba(0,168,120,.1)" : `${activeChapter.color}10`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        fontFamily: "'Playfair Display', serif", fontWeight: 900,
                        color: isDone ? C.green : activeChapter.color,
                        fontSize: 18,
                      }}>
                        {isDone
                          ? <CheckCircle2 size={22} color={C.green} strokeWidth={2} />
                          : i + 1
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 10,
                          marginBottom: 6, flexWrap: "wrap",
                        }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>
                            {lesson.title}
                          </span>
                          <LevelBadge level={lesson.level} />
                        </div>
                        <div style={{ fontSize: 14, color: C.textLt }}>
                          {lesson.theory?.formula?.length ?? 0} công thức · {lesson.exercises?.length ?? 0} bài tập
                          {comp && (
                            <span style={{ color: C.green, fontWeight: 600, marginLeft: 10 }}>
                              · {comp.score}/{comp.total} đúng
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, color: C.textLt }}>
                        <ChevronRight size={20} strokeWidth={1.8} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ══ LESSON ══ */}
        {view === "lesson" && activeLesson && (
          <div className="fade-in" style={{ maxWidth: 960, margin: '0 auto' }}>
            {/* Breadcrumb */}
            <div style={{
              fontSize: 14, color: C.textLt, marginBottom: 24,
              display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
            }}>
              <span style={{ cursor: "pointer", color: C.gold, display: "flex", alignItems: "center", gap: 4 }} onClick={goHome}>
                <Home size={13} strokeWidth={2} />Ngữ pháp
              </span>
              <ChevronRight size={14} color={C.textLt} strokeWidth={1.8} />
              <span style={{ cursor: "pointer", color: C.gold }} onClick={goChapter}>
                {CHAPTERS.find(c => c.id === activeLesson.chapterId)?.title}
              </span>
              <ChevronRight size={14} color={C.textLt} strokeWidth={1.8} />
              <span style={{ color: C.navy, fontWeight: 600 }}>{activeLesson.title}</span>
            </div>

            {/* Hero */}
            <div style={{
              background: C.navy, borderRadius: 24, padding: "28px 32px",
              marginBottom: 28, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -40, right: -40,
                width: 160, height: 160, background: "rgba(201,168,76,.07)",
                borderRadius: "60% 40% 30% 70%", pointerEvents: "none",
              }} />
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 14px", background: "rgba(201,168,76,.12)",
                border: "1px solid rgba(201,168,76,.25)", borderRadius: 50,
                fontSize: 11, fontWeight: 700, color: C.gold,
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 14,
              }}>
                {CHAPTERS.find(c => c.id === activeLesson.chapterId)?.title}
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(22px,3vw,32px)", fontWeight: 900,
                color: "#fff", marginBottom: 12, lineHeight: 1.2,
              }}>{activeLesson.title}</h2>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <LevelBadge level={activeLesson.level} />
                <span style={{ fontSize: 14, color: "rgba(255,255,255,.5)" }}>
                  {activeLesson.exercises?.length ?? 0} bài tập · {activeLesson.theory?.formula?.length ?? 0} công thức
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
              {[
                { label: "Lý thuyết", Icon: BookOpen },
                { label: "Bài tập",   Icon: PenLine  },
              ].map(({ label, Icon }, i) => (
                <button
                  key={i} className="tab-btn"
                  onClick={() => setTab(i)}
                  style={{
                    padding: "12px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer",
                    color: tab === i ? C.navy : C.textMid, background: "transparent",
                    border: "none", borderBottom: `3px solid ${tab === i ? C.gold : "transparent"}`,
                    fontFamily: "inherit", marginBottom: -1,
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <Icon size={16} strokeWidth={tab === i ? 2.2 : 1.8} />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Theory Tab ── */}
            {tab === 0 && (
              <div>
                <Panel style={{ marginBottom: 20 }}>
                  <SectionHeader icon={BookOpen} title="Công thức" sub={activeLesson.title} color={C.gold} />
                  <div style={{
                    background: C.navy, borderRadius: 16, padding: "20px 24px",
                    fontFamily: "monospace", fontSize: 14, lineHeight: 1.9,
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute", top: 0, left: 0,
                      width: 4, height: "100%", background: C.gold,
                    }} />
                    {(activeLesson.theory?.formula ?? []).map((f, i) => (
                      <div key={i}>
                        <span style={{ color: "#FAC775" }}>{f.label}:</span>
                        <span style={{ color: "#9FE1CB", marginLeft: 10 }}>{f.f}</span>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel style={{ marginBottom: 20 }}>
                  <SectionHeader icon={Target} title="Khi nào dùng?" color={C.greenLt} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {(activeLesson.theory?.uses ?? []).map((u, i) => (
                      <div key={i} style={{
                        display: "grid", gridTemplateColumns: "140px 1fr",
                        gap: 14, alignItems: "start",
                      }}>
                        <span style={{
                          padding: "4px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                          background: activeLesson.chapterColor ? `${activeLesson.chapterColor}10` : C.goldPale,
                          color: activeLesson.chapterColor || C.gold,
                          border: `1px solid ${activeLesson.chapterColor ? activeLesson.chapterColor + "22" : "rgba(201,168,76,.2)"}`,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>{u.chip}</span>
                        <div
                          style={{
                            padding: "10px 16px", background: C.bg,
                            border: `1px solid ${C.border}`, borderRadius: 10,
                            fontSize: 14, color: C.navy, lineHeight: 1.65, fontStyle: "italic",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: u.ex.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </Panel>

                {activeLesson.theory?.signalWords && activeLesson.theory.signalWords.length > 0 && (
                  <Panel style={{ marginBottom: 20 }}>
                    <SectionHeader icon={Flame} title="Từ nhận biết (Signal words)" color={C.blueLt} />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {activeLesson.theory.signalWords.map((sw, i) => (
                        <span key={i} style={{
                          padding: "6px 14px", background: "rgba(43,108,176,.07)",
                          border: "1px solid rgba(43,108,176,.18)", borderRadius: 10,
                          fontSize: 14, color: C.blue, fontWeight: 500,
                        }}>{sw}</span>
                      ))}
                    </div>
                  </Panel>
                )}

                {activeLesson.theory?.note && (
                  <Panel style={{ marginBottom: 20, background: C.goldPale }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginTop: 2,
                      }}>
                        <Lightbulb size={16} color={C.gold} strokeWidth={2} />
                      </div>
                      <div
                        style={{ fontSize: 15, color: "#7a4a00", lineHeight: 1.75 }}
                        dangerouslySetInnerHTML={{
                          __html: activeLesson.theory.note
                            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                            .replace(/([A-Z]{2,})/g, "<strong>$1</strong>"),
                        }}
                      />
                    </div>
                  </Panel>
                )}

                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button
                    onClick={() => setTab(1)}
                    style={{
                      padding: "12px 28px", borderRadius: 50, background: C.gold, color: C.navy,
                      fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
                      fontFamily: "inherit", boxShadow: "0 6px 20px rgba(201,168,76,.35)",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    Làm bài tập <ArrowRight size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Exercises Tab ── */}
            {tab === 1 && (
              <div>
                {/* Score banner (after submit) */}
                {submitted && (
                  <div className="fade-in" style={{
                    background: C.goldPale, border: `1px solid ${C.border}`,
                    borderRadius: 20, padding: "20px 24px", marginBottom: 24,
                    display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
                  }}>
                    <div>
                      <div style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 38, fontWeight: 900, color: C.navy,
                      }}>
                        {currentScore}/{activeLesson.exercises.length}
                      </div>
                      <div style={{ fontSize: 15, color: C.textMid, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                        {Math.round(currentScore / activeLesson.exercises.length * 100)}% ·{" "}
                        {currentScore >= Math.ceil(activeLesson.exercises.length * 0.8)
                          ? <><CheckCircle2 size={15} color={C.green} strokeWidth={2} /> Xuất sắc!</>
                          : currentScore >= Math.ceil(activeLesson.exercises.length * 0.6)
                          ? <><ArrowRight size={15} color={C.gold} strokeWidth={2} /> Tốt lắm!</>
                          : <><RotateCcw size={15} color={C.rose} strokeWidth={2} /> Ôn lại lý thuyết nhé!</>}
                      </div>
                    </div>
                    <button
                      onClick={resetQuiz}
                      style={{
                        marginLeft: "auto", padding: "8px 20px", borderRadius: 50,
                        background: C.white, border: `1px solid ${C.border}`,
                        color: C.textMid, fontSize: 14, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <RotateCcw size={13} strokeWidth={2} /> Làm lại
                    </button>
                  </div>
                )}

                {/* Exercise cards */}
                {activeLesson.exercises.map((ex, i) => {
                  const userAns = answers[i];
                  const isCorrect = submitted && (
                    ex.type === "mc" ? userAns === ex.ans :
                    ex.type === "tf" ? userAns === ex.ans :
                    String(userAns || "").trim().toLowerCase() === String(ex.ans || "").toLowerCase()
                  );
                  const cardBorder = submitted
                    ? (isCorrect ? "rgba(0,168,120,.3)" : "rgba(240,100,100,.3)")
                    : C.border;

                  return (
                    <div
                      key={i} className="fade-in"
                      style={{
                        background: C.white, borderRadius: 20,
                        border: `1.5px solid ${cardBorder}`,
                        padding: "22px 26px", marginBottom: 16,
                        boxShadow: "0 2px 8px rgba(15,28,53,.05)",
                      }}
                    >
                      {/* Card header */}
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: C.textLt,
                        letterSpacing: ".07em", textTransform: "uppercase",
                        marginBottom: 12, display: "flex", alignItems: "center", gap: 10,
                      }}>
                        Câu {i + 1}
                        <span style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: 11,
                          background: ex.type === "mc" ? "#E6F1FB"
                            : ex.type === "tf" ? "#E1F5EE"
                            : ex.type === "fill" ? C.goldPale : "#EEEDFE",
                          color: ex.type === "mc" ? C.blue
                            : ex.type === "tf" ? C.green
                            : ex.type === "fill" ? C.gold : C.violet,
                          fontWeight: 700,
                        }}>
                          {ex.type === "mc" ? "Trắc nghiệm"
                            : ex.type === "tf" ? "Đúng / Sai"
                            : ex.type === "fill" ? "Điền từ" : "Sắp xếp câu"}
                        </span>
                      </div>

                      {/* Question text */}
                      <div
                        style={{
                          fontSize: 16, color: C.navy, fontWeight: 500,
                          marginBottom: 18, lineHeight: 1.65,
                        }}
                        dangerouslySetInnerHTML={{
                          __html: (ex.q || "").replace(
                            "___",
                            `<span style="display:inline-block;border-bottom:2px solid ${C.navy};min-width:70px;text-align:center;font-style:italic;color:${C.gold};font-weight:700;padding:0 6px">___</span>`
                          ),
                        }}
                      />

                      {/* MC */}
                      {ex.type === "mc" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {(ex.opts || []).map((o, j) => {
                            let bg = C.white, border = C.border, color = C.text;
                            if (submitted) {
                              if (j === ex.ans) { bg = "#E1F5EE"; border = "rgba(0,168,120,.4)"; color = "#0F6E56"; }
                              else if (j === userAns && userAns !== ex.ans) { bg = "#FEF2F2"; border = "rgba(240,100,100,.4)"; color = "#A32D2D"; }
                            } else if (userAns === j) { bg = C.goldPale; border = C.borderMd; color = C.navy; }
                            return (
                              <button
                                key={j}
                                className={`opt-btn${submitted ? " opt-disabled" : ""}`}
                                onClick={() => handleAnswer(i, j)}
                                style={{
                                  padding: "12px 16px", border: `1px solid ${border}`,
                                  borderRadius: 12, fontSize: 14,
                                  cursor: submitted ? "default" : "pointer",
                                  background: bg, color, textAlign: "left",
                                  fontFamily: "inherit", fontWeight: userAns === j ? 600 : 400,
                                }}
                              >
                                {String.fromCharCode(65 + j)}. {o}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* T/F */}
                      {ex.type === "tf" && (
                        <div style={{ display: "flex", gap: 12 }}>
                          {([true, false] as boolean[]).map(v => {
                            let bg = C.white, border = C.border, color = C.text;
                            if (submitted) {
                              if (v === ex.ans) { bg = "#E1F5EE"; border = "rgba(0,168,120,.4)"; color = "#0F6E56"; }
                              else if (v === userAns && userAns !== ex.ans) { bg = "#FEF2F2"; border = "rgba(240,100,100,.4)"; color = "#A32D2D"; }
                            } else if (userAns === v) { bg = C.goldPale; border = C.borderMd; color = C.navy; }
                            return (
                              <button
                                key={String(v)}
                                className={`opt-btn${submitted ? " opt-disabled" : ""}`}
                                onClick={() => handleAnswer(i, v)}
                                style={{
                                  flex: 1, padding: "12px 0",
                                  border: `1px solid ${border}`, borderRadius: 12,
                                  fontSize: 15, cursor: submitted ? "default" : "pointer",
                                  background: bg, color, fontFamily: "inherit", fontWeight: 600,
                                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                }}
                              >
                                {v
                                  ? <><Check size={15} strokeWidth={2.5} /> Đúng</>
                                  : <><X    size={15} strokeWidth={2.5} /> Sai</>}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* ── FIX: Fill / Order ──────────────────────────────────────────
                          - Nếu type="order" + có ex.words → hiển thị chips gợi ý
                          - Nếu type="order" + KHÔNG có ex.words → chỉ hiển thị input
                            (dạng "Viết lại câu" như câu 11 trong ảnh)
                          - Input luôn hiển thị cho cả fill và order
                      ────────────────────────────────────────────────────────────── */}
                      {(ex.type === "fill" || ex.type === "order") && (
                        <div>
                          {/* Word chips — chỉ hiện khi có words */}
                          {ex.type === "order" && ex.words && ex.words.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                              {ex.words.map((w, wi) => (
                                <span key={wi} style={{
                                  padding: "6px 12px",
                                  background: "rgba(100,120,240,.07)",
                                  border: "1px solid rgba(100,120,240,.18)",
                                  borderRadius: 8, fontSize: 14,
                                  color: C.violet, fontWeight: 600,
                                }}>{w}</span>
                              ))}
                            </div>
                          )}

                          {/* Input — luôn hiển thị */}
                          <input
                            value={String(answers[i] || "")}
                            onChange={e => handleAnswer(i, e.target.value)}
                            disabled={submitted}
                            placeholder={
                              ex.type === "fill"
                                ? "Điền câu trả lời..."
                                : ex.words && ex.words.length > 0
                                ? "Nhập câu đã sắp xếp..."
                                : "Viết lại câu..."
                            }
                            style={{
                              width: "100%", padding: "12px 16px", borderRadius: 12,
                              border: `1px solid ${
                                submitted
                                  ? isCorrect ? "rgba(0,168,120,.4)" : "rgba(240,100,100,.4)"
                                  : C.border
                              }`,
                              background: submitted
                                ? isCorrect ? "#E1F5EE" : "#FEF2F2"
                                : C.white,
                              fontSize: 15,
                              color: submitted ? (isCorrect ? "#0F6E56" : "#A32D2D") : C.text,
                              fontFamily: "inherit", outline: "none",
                              transition: "border-color .15s, background .15s",
                            }}
                            onFocus={e => {
                              if (!submitted) e.currentTarget.style.borderColor = C.borderMd;
                            }}
                            onBlur={e => {
                              if (!submitted) e.currentTarget.style.borderColor = C.border;
                            }}
                          />

                          {submitted && !isCorrect && (
                            <div style={{ marginTop: 8, fontSize: 14, color: C.green }}>
                              → Đáp án đúng: <strong>{String(ex.ans)}</strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {submitted && (
                        <div style={{
                          marginTop: 16, padding: "12px 16px", borderRadius: 12,
                          background: isCorrect ? "#E1F5EE" : "#FEF2F2",
                          border: `1px solid ${isCorrect ? "rgba(0,168,120,.2)" : "rgba(240,100,100,.2)"}`,
                          fontSize: 14, color: isCorrect ? "#0F6E56" : "#A32D2D", lineHeight: 1.65,
                          display: "flex", gap: 8, alignItems: "flex-start",
                        }}>
                          {isCorrect
                            ? <CheckCircle2 size={16} color="#0F6E56" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                            : <XCircle      size={16} color="#A32D2D" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />}
                          <span>
                            <strong>{isCorrect ? "Chính xác! " : "Chưa đúng. "}</strong>
                            <span dangerouslySetInnerHTML={{ __html: ex.exp }} />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Action buttons */}
                {!submitted ? (
                  <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                    {/* ── CHANGED: onClick → handleSubmitClick ── */}
                    <button
                      onClick={handleSubmitClick}
                      style={{
                        padding: "12px 32px", borderRadius: 50, background: C.gold, color: C.navy,
                        fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
                        fontFamily: "inherit", boxShadow: "0 6px 20px rgba(201,168,76,.35)",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      <Send size={16} strokeWidth={2} />
                      Kiểm tra đáp án
                    </button>
                    <button
                      onClick={() => setTab(0)}
                      style={{
                        padding: "12px 24px", borderRadius: 50, background: C.white,
                        border: `1px solid ${C.border}`, color: C.textMid,
                        fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      <ArrowLeft size={16} strokeWidth={2} /> Lý thuyết
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={resetQuiz}
                      style={{
                        padding: "12px 24px", borderRadius: 50, background: C.white,
                        border: `1px solid ${C.border}`, color: C.textMid,
                        fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      <RotateCcw size={15} strokeWidth={2} /> Làm lại
                    </button>
                    <button
                      onClick={goChapter}
                      style={{
                        padding: "12px 28px", borderRadius: 50, background: C.navy, color: "#fff",
                        fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
                        fontFamily: "inherit", boxShadow: "0 2px 10px rgba(15,28,53,.22)",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      <ArrowLeft size={16} strokeWidth={2} /> Danh sách bài
                    </button>

                    {(() => {
                      const ch = CHAPTERS.find(c => c.id === activeLesson.chapterId);
                      const idx = ch?.lessons.findIndex(l => l.id === activeLesson.id) ?? -1;
                      const next = ch?.lessons[idx + 1];
                      if (!next || !ch) return null;
                      return (
                        <button
                          onClick={() => openLesson({ ...next, chapterId: ch.id, chapterColor: ch.color })}
                          style={{
                            padding: "12px 28px", borderRadius: 50, background: C.gold, color: C.navy,
                            fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
                            fontFamily: "inherit", boxShadow: "0 6px 20px rgba(201,168,76,.3)",
                            display: "flex", alignItems: "center", gap: 8,
                          }}
                        >
                          Bài tiếp theo <ArrowRight size={16} strokeWidth={2} />
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}