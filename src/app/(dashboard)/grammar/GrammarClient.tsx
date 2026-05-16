'use client'
import { useState, useEffect, useRef } from "react";

// ─── Design Tokens (EnglishHub Dashboard) ────────────────────────────────────
const C = {
  bg: "#F8F5EE", white: "#FFFFFF",
  navy: "#0F1C35", navyMid: "#1E2F50",
  gold: "#C9A84C", goldLt: "#E8C97A", goldPale: "#FDF8EE",
  green: "#00A878", greenLt: "#4ECBA8",
  blue: "#185FA5", blueLt: "#4299E1",
  violet: "#6478F0", rose: "#F06464",
  border: "rgba(201,168,76,0.20)", borderMd: "rgba(201,168,76,0.35)",
  text: "#1A1E2E", textMid: "#4A5568", textLt: "#94A3B8",
};

// ─── Full Grammar Curriculum ─────────────────────────────────────────────────
const CHAPTERS: Chapter[] = [
  {
    id: "tenses", title: "Thì động từ", icon: "⏱", color: C.blue,
    desc: "12 thì tiếng Anh từ cơ bản đến nâng cao",
    lessons: [
      {
        id: "prs_simple", title: "Thì hiện tại đơn", level: "A1",
        theory: {
          formula: [
            { label: "Khẳng định", f: "S + V (s/es)" },
            { label: "Phủ định", f: "S + do/does + not + V" },
            { label: "Nghi vấn", f: "Do/Does + S + V?" },
          ],
          uses: [
            { chip: "Thói quen", ex: "She drinks coffee every morning." },
            { chip: "Sự thật KH", ex: "The Earth revolves around the Sun." },
            { chip: "Lịch trình", ex: "The train leaves at 7 AM." },
            { chip: "Trạng thái", ex: "I love reading books." },
          ],
          note: "Thêm -s/es với He/She/It. Stative verbs (know, love, hate...) không dùng tiếp diễn.",
          signalWords: ["always, usually, often, sometimes, never", "every day/week/year", "on Mondays"],
        },
        exercises: [
          { type: "mc", q: "She ___ to school every day.", opts: ["go", "goes", "going", "is go"], ans: 1, exp: "He/She/It → thêm -s: goes" },
          { type: "mc", q: "They ___ not like spicy food.", opts: ["does", "do", "is", "are"], ans: 1, exp: "Số nhiều They → do not" },
          { type: "mc", q: "Water ___ at 100°C.", opts: ["boil", "is boiling", "boils", "boiled"], ans: 2, exp: "Sự thật khoa học, It → boils" },
          { type: "fill", q: "He ___ (work) at a hospital.", ans: "works", exp: "He → works" },
          { type: "fill", q: "They ___ (not/eat) meat.", ans: "don't eat", exp: "Số nhiều → don't eat" },
          { type: "tf", q: "\"She don't like coffee.\" — câu này đúng ngữ pháp.", ans: false, exp: "She → does not like (không dùng don't với she)" },
          { type: "tf", q: "\"He studies hard every day.\" — câu này đúng ngữ pháp.", ans: true, exp: "Study + y → ies: studies ✓" },
          { type: "order", words: ["Does", "he", "work", "on", "weekends?"], ans: "Does he work on weekends?", exp: "Câu hỏi: Does + S + V?" },
        ]
      },
      {
        id: "prs_cont", title: "Thì hiện tại tiếp diễn", level: "A2",
        theory: {
          formula: [
            { label: "Khẳng định", f: "S + am/is/are + V-ing" },
            { label: "Phủ định", f: "S + am/is/are + not + V-ing" },
            { label: "Nghi vấn", f: "Am/Is/Are + S + V-ing?" },
          ],
          uses: [
            { chip: "Đang xảy ra", ex: "She is talking on the phone right now." },
            { chip: "Xung quanh HT", ex: "I am reading a great novel this week." },
            { chip: "Kế hoạch GN", ex: "We are meeting them tomorrow." },
            { chip: "Xu hướng thay đổi", ex: "Prices are rising rapidly." },
          ],
          note: "Stative verbs (know, want, believe...) KHÔNG dùng -ing. Quy tắc thêm -ing: bỏ -e câm (make→making), nhân đôi phụ âm (sit→sitting).",
          signalWords: ["now, right now, at the moment", "currently, at present", "today, this week/month", "Look! Listen!"],
        },
        exercises: [
          { type: "mc", q: "Listen! She ___ a beautiful song.", opts: ["sing", "sings", "is singing", "has sung"], ans: 2, exp: "Listen! → đang xảy ra → is singing" },
          { type: "mc", q: "They ___ dinner right now.", opts: ["have", "are having", "has", "do have"], ans: 1, exp: "right now → Present Continuous: are having" },
          { type: "fill", q: "He ___ (study) for his exam at the moment.", ans: "is studying", exp: "at the moment → is studying" },
          { type: "fill", q: "I ___ (not/understand) this problem.", ans: "don't understand", exp: "understand = stative verb → thì đơn" },
          { type: "tf", q: "\"I am knowing the answer.\" — câu này đúng.", ans: false, exp: "know là stative verb → I know the answer ✓" },
          { type: "tf", q: "\"She is working from home this week.\" — đúng.", ans: true, exp: "this week → xung quanh hiện tại → is working ✓" },
          { type: "order", words: ["Are", "you", "watching", "TV", "now?"], ans: "Are you watching TV now?", exp: "Câu hỏi: Are + S + V-ing?" },
          { type: "mc", q: "Look! The children ___ in the park.", opts: ["play", "plays", "are playing", "played"], ans: 2, exp: "Look! → đang diễn ra → are playing" },
        ]
      },
      {
        id: "past_simple", title: "Thì quá khứ đơn", level: "A2",
        theory: {
          formula: [
            { label: "Khẳng định", f: "S + V-ed / V2 (bất quy tắc)" },
            { label: "Phủ định", f: "S + did not + V (nguyên mẫu)" },
            { label: "Nghi vấn", f: "Did + S + V?" },
          ],
          uses: [
            { chip: "Hành động đã xong", ex: "She visited Paris last year." },
            { chip: "Chuỗi hành động", ex: "He entered, sat down, and opened his book." },
            { chip: "Thói quen quá khứ", ex: "We played football every Saturday." },
          ],
          note: "Sau did/didn't luôn dùng V nguyên mẫu. to be → was (I/He/She/It) / were (We/You/They). Một số V bất quy tắc quan trọng: go→went, eat→ate, take→took, see→saw, have→had.",
          signalWords: ["yesterday, last night/week/year", "ago (2 days ago)", "in 1990, in the past", "when I was young"],
        },
        exercises: [
          { type: "mc", q: "They ___ football yesterday.", opts: ["play", "plays", "played", "are playing"], ans: 2, exp: "yesterday → quá khứ đơn: played" },
          { type: "mc", q: "She ___ not see the movie last night.", opts: ["does", "did", "was", "is"], ans: 1, exp: "Phủ định quá khứ → did not" },
          { type: "fill", q: "He ___ (go) to school by bus yesterday.", ans: "went", exp: "go → went (bất quy tắc)" },
          { type: "fill", q: "They ___ (not/finish) their homework.", ans: "didn't finish", exp: "didn't + V nguyên mẫu" },
          { type: "tf", q: "\"Did she went to the party?\" — đúng ngữ pháp.", ans: false, exp: "Sau Did → V nguyên mẫu: Did she GO?" },
          { type: "tf", q: "\"I was at home last Sunday.\" — đúng.", ans: true, exp: "I + was ✓" },
          { type: "order", words: ["Where", "did", "you", "go", "last", "weekend?"], ans: "Where did you go last weekend?", exp: "Câu hỏi WH: WH + did + S + V?" },
          { type: "mc", q: "I ___ (be) very tired after the exam.", opts: ["was", "were", "am", "been"], ans: 0, exp: "I + quá khứ be → was" },
        ]
      },
      {
        id: "pst_cont", title: "Thì quá khứ tiếp diễn", level: "B1",
        theory: {
          formula: [
            { label: "Khẳng định", f: "S + was/were + V-ing" },
            { label: "Phủ định", f: "S + was/were + not + V-ing" },
            { label: "Nghi vấn", f: "Was/Were + S + V-ing?" },
          ],
          uses: [
            { chip: "Đang xảy ra tại thời điểm QK", ex: "At 8 PM yesterday, she was studying." },
            { chip: "Bị gián đoạn", ex: "I was sleeping when he called." },
            { chip: "Hai việc song song", ex: "She was cooking while he was watching TV." },
          ],
          note: "Kết hợp với Past Simple: hành động NGẮN dùng Past Simple (when), hành động DÀI dùng Past Continuous (while).",
          signalWords: ["when, while, as", "at this time yesterday", "all day/night"],
        },
        exercises: [
          { type: "mc", q: "At 9 PM yesterday, I ___ a book.", opts: ["read", "reads", "was reading", "am reading"], ans: 2, exp: "Tại thời điểm cụ thể QK → was reading" },
          { type: "mc", q: "She ___ (cook) when I arrived.", opts: ["cooked", "was cooking", "is cooking", "cooks"], ans: 1, exp: "Hành động dài bị gián đoạn → was cooking" },
          { type: "fill", q: "They ___ (play) football while it ___ (rain).", ans: "were playing / was raining", exp: "Hai việc song song → were playing / was raining" },
          { type: "tf", q: "\"I was watch TV when you called.\" — đúng.", ans: false, exp: "was + V-ing: was watchING ✓" },
          { type: "order", words: ["Were", "you", "sleeping", "when", "I", "called?"], ans: "Were you sleeping when I called?", exp: "Câu hỏi: Were + S + V-ing?" },
        ]
      },
      {
        id: "prs_perf", title: "Thì hiện tại hoàn thành", level: "B1",
        theory: {
          formula: [
            { label: "Khẳng định", f: "S + have/has + V3 (past participle)" },
            { label: "Phủ định", f: "S + have/has + not + V3" },
            { label: "Nghi vấn", f: "Have/Has + S + V3?" },
          ],
          uses: [
            { chip: "Kinh nghiệm", ex: "I have been to Japan. (ever/never)" },
            { chip: "Kết quả → HT", ex: "She has just left. (just/already/yet)" },
            { chip: "Từ QK → nay", ex: "He has worked here for 5 years. (for/since)" },
            { chip: "Tin tức mới", ex: "Scientists have discovered a new planet." },
          ],
          note: "FOR + khoảng thời gian (for 3 years). SINCE + mốc thời gian (since 2020). Khác Past Simple: HTHT không nêu thời điểm cụ thể.",
          signalWords: ["just, already, yet, ever, never", "for, since", "recently, lately", "so far, up to now"],
        },
        exercises: [
          { type: "mc", q: "She ___ three novels this month.", opts: ["writes", "wrote", "has written", "had written"], ans: 2, exp: "this month (chưa kết thúc) → has written" },
          { type: "mc", q: "I ___ never ___ to Australia.", opts: ["have/been", "has/been", "had/gone", "did/go"], ans: 0, exp: "never + kinh nghiệm → have never been" },
          { type: "fill", q: "We ___ (live) here since 2018.", ans: "have lived", exp: "since 2018 → have lived" },
          { type: "fill", q: "He ___ (just/finish) his homework.", ans: "has just finished", exp: "just → has just finished" },
          { type: "tf", q: "\"I have seen her yesterday.\" — đúng.", ans: false, exp: "yesterday = thời điểm cụ thể → I SAW her yesterday ✓" },
          { type: "tf", q: "\"Have you ever tried sushi?\" — đúng.", ans: true, exp: "ever + kinh nghiệm → Have you ever tried? ✓" },
          { type: "order", words: ["Has", "she", "finished", "her", "project", "yet?"], ans: "Has she finished her project yet?", exp: "yet → cuối câu hỏi" },
          { type: "mc", q: "They ___ for this company for ten years.", opts: ["work", "worked", "have worked", "are working"], ans: 2, exp: "for ten years (đến nay) → have worked" },
        ]
      },
      {
        id: "future", title: "Thì tương lai (Will & Going to)", level: "A2",
        theory: {
          formula: [
            { label: "Will + V", f: "S + will + V (nguyên mẫu)" },
            { label: "Going to + V", f: "S + am/is/are + going to + V" },
            { label: "Present Continuous", f: "S + am/is/are + V-ing (kế hoạch)" },
          ],
          uses: [
            { chip: "Will: quyết định tức thời", ex: "The phone is ringing. I'll answer it." },
            { chip: "Will: dự đoán", ex: "It will rain tomorrow." },
            { chip: "Going to: kế hoạch sẵn", ex: "I'm going to visit my parents this weekend." },
            { chip: "Going to: bằng chứng", ex: "Look at those clouds! It's going to rain." },
          ],
          note: "Will: quyết định TẠI THỜI ĐIỂM NÓI hoặc dự đoán chung. Going to: kế hoạch ĐÃ CÓ SẴN hoặc bằng chứng rõ ràng sắp xảy ra.",
          signalWords: ["tomorrow, next week/year", "soon, in the future", "I think... / I'm sure...", "Look! / Watch out!"],
        },
        exercises: [
          { type: "mc", q: "\"The phone is ringing.\" — \"I ___ answer it.\"", opts: ["am going to", "will", "am", "shall"], ans: 1, exp: "Quyết định tức thời → will" },
          { type: "mc", q: "Look at those clouds! It ___ rain.", opts: ["will", "is going to", "rains", "rained"], ans: 1, exp: "Bằng chứng rõ ràng → is going to" },
          { type: "fill", q: "I have decided. I ___ (study) medicine.", ans: "am going to study", exp: "Kế hoạch đã có → am going to study" },
          { type: "tf", q: "\"I will going to the gym tomorrow.\" — đúng.", ans: false, exp: "will + V nguyên mẫu: I will GO hoặc I'm going to go ✓" },
          { type: "mc", q: "\"I'm thirsty.\" — \"I ___ get you some water.\"", opts: ["am going to", "will", "am", "shall"], ans: 1, exp: "Quyết định tức thời → will" },
        ]
      },
    ]
  },
  {
    id: "conditionals", title: "Câu điều kiện", icon: "🔀", color: C.violet,
    desc: "4 loại câu điều kiện từ thực tế đến giả định",
    lessons: [
      {
        id: "cond_0_1", title: "Câu điều kiện loại 0 & 1", level: "B1",
        theory: {
          formula: [
            { label: "Type 0 — Sự thật", f: "If + Present Simple, Present Simple" },
            { label: "Type 1 — Có thể xảy ra", f: "If + Present Simple, will + V" },
          ],
          uses: [
            { chip: "Type 0: Quy luật tự nhiên", ex: "If you heat water to 100°C, it boils." },
            { chip: "Type 0: Thói quen", ex: "If I don't sleep well, I feel tired." },
            { chip: "Type 1: Điều kiện thực tế", ex: "If it rains, I will stay home." },
            { chip: "Type 1: Cảnh báo/đề nghị", ex: "If you study hard, you will pass." },
          ],
          note: "Type 0: cả hai vế Present Simple. Type 1: mệnh đề IF dùng Present Simple, mệnh đề chính dùng will/can/may + V. Có thể đổi chỗ hai vế, nếu mệnh đề IF đứng sau không cần dấu phẩy.",
          signalWords: ["if, unless (= if not)", "when (= if, type 0)", "provided that, as long as"],
        },
        exercises: [
          { type: "mc", q: "If he ___ harder, he will pass the exam.", opts: ["studied", "studies", "would study", "study"], ans: 1, exp: "Type 1: If + Present Simple → studies" },
          { type: "mc", q: "If you ___ ice, it melts.", opts: ["heat", "heated", "will heat", "would heat"], ans: 0, exp: "Type 0: quy luật tự nhiên → heat" },
          { type: "fill", q: "If she ___ (not/hurry), she will miss the bus.", ans: "doesn't hurry", exp: "Type 1: If + Present Simple" },
          { type: "tf", q: "\"If it will rain, I stay home.\" — đúng.", ans: false, exp: "Type 1: If + Present Simple, NOT will: If it rains ✓" },
          { type: "order", words: ["will", "you", "call", "me", "If", "you", "arrive?"], ans: "If you arrive, will you call me?", exp: "Type 1: If + Present Simple, will + V" },
          { type: "mc", q: "___ you don't eat, you feel hungry. (quy luật)", opts: ["If", "Unless", "When", "Cả A và C"], ans: 3, exp: "Type 0 dùng If hoặc When đều được" },
        ]
      },
      {
        id: "cond_2_3", title: "Câu điều kiện loại 2 & 3", level: "B2",
        theory: {
          formula: [
            { label: "Type 2 — Giả định HT", f: "If + Past Simple, would + V" },
            { label: "Type 3 — Giả định QK", f: "If + Past Perfect, would have + V3" },
          ],
          uses: [
            { chip: "Type 2: Không có thật ở HT", ex: "If I were rich, I would travel everywhere." },
            { chip: "Type 2: Lời khuyên", ex: "If I were you, I wouldn't do that." },
            { chip: "Type 3: Không có thật ở QK", ex: "If she had studied, she would have passed." },
            { chip: "Type 3: Hối tiếc", ex: "If I had woken up earlier, I wouldn't have been late." },
          ],
          note: "Type 2: dùng WERE cho tất cả chủ ngữ (If I WERE you...). Type 3: would have + V3. Mixed: Type 3 If + Type 2 result (If she had studied, she would be a doctor now).",
          signalWords: ["Type 2: wish, if only, imagining...", "Type 3: regret, looking back..."],
        },
        exercises: [
          { type: "mc", q: "If I ___ a bird, I would fly to you.", opts: ["am", "was", "were", "be"], ans: 2, exp: "Type 2: dùng WERE cho mọi chủ ngữ" },
          { type: "mc", q: "If they ___ earlier, they wouldn't have missed the train.", opts: ["had left", "have left", "left", "leave"], ans: 0, exp: "Type 3: If + Past Perfect → had left" },
          { type: "fill", q: "If he ___ (have) more time, he would help us.", ans: "had", exp: "Type 2: If + Past Simple → had" },
          { type: "fill", q: "She ___ (pass) if she had prepared better.", ans: "would have passed", exp: "Type 3: would have + V3" },
          { type: "tf", q: "\"If I would be rich, I would buy a house.\" — đúng.", ans: false, exp: "Type 2: If I WERE rich (không dùng would trong mệnh đề If)" },
          { type: "mc", q: "\"If I ___ you, I would apologize to her.\"", opts: ["am", "was", "were", "be"], ans: 2, exp: "If I were you = lời khuyên (Type 2)" },
          { type: "order", words: ["would", "she", "have", "come", "had", "If", "she", "known?"], ans: "If she had known, would she have come?", exp: "Type 3 câu hỏi: Had + S + V3, would + S + have + V3?" },
        ]
      },
    ]
  },
  {
    id: "passive", title: "Câu bị động", icon: "🔄", color: C.green,
    desc: "Passive Voice trong tất cả các thì",
    lessons: [
      {
        id: "passive_main", title: "Câu bị động cơ bản", level: "B1",
        theory: {
          formula: [
            { label: "Cấu trúc", f: "S + be (chia theo thì) + V3 + (by O)" },
            { label: "Htđ", f: "is/are + V3  →  The room is cleaned." },
            { label: "Qkđ", f: "was/were + V3  →  The window was broken." },
            { label: "Httd", f: "is/are being + V3  →  The car is being fixed." },
            { label: "HTHT", f: "have/has been + V3  →  The letter has been sent." },
            { label: "Tương lai", f: "will be + V3  →  It will be announced." },
          ],
          uses: [
            { chip: "Không biết chủ thể", ex: "My bike was stolen." },
            { chip: "Không quan trọng ai làm", ex: "English is spoken worldwide." },
            { chip: "Nhấn mạnh đối tượng", ex: "This novel was written by Tolstoy." },
            { chip: "Văn phong trang trọng", ex: "The results will be published tomorrow." },
          ],
          note: "\"by + tác nhân\" chỉ thêm khi cần thiết. Động từ không có tân ngữ (go, come, arrive...) KHÔNG thể dùng bị động.",
          signalWords: ["by (by whom)", "get + V3 (informal passive)", "have + O + V3 (causative)"],
        },
        exercises: [
          { type: "mc", q: "The report ___ by the manager yesterday.", opts: ["writes", "was written", "is written", "has written"], ans: 1, exp: "Quá khứ đơn bị động: was written" },
          { type: "mc", q: "English ___ all over the world.", opts: ["speaks", "is spoken", "was spoken", "speaking"], ans: 1, exp: "Sự thật chung → Htđ bị động: is spoken" },
          { type: "fill", q: "The bridge ___ (build) in 1990.", ans: "was built", exp: "in 1990 → quá khứ bị động: was built" },
          { type: "fill", q: "The results ___ (announce) tomorrow.", ans: "will be announced", exp: "tomorrow → tương lai bị động: will be announced" },
          { type: "tf", q: "\"The building is being renovated right now.\" — đúng.", ans: true, exp: "right now + Httd bị động: is being renovated ✓" },
          { type: "tf", q: "\"She was arrived at the station.\" — đúng.", ans: false, exp: "arrive không có tân ngữ → không dùng bị động" },
          { type: "order", words: ["been", "The", "email", "has", "sent."], ans: "The email has been sent.", exp: "HTHT bị động: have/has + been + V3" },
          { type: "mc", q: "The cake ___ by my mom last night.", opts: ["made", "was made", "is made", "has made"], ans: 1, exp: "last night → quá khứ bị động: was made" },
        ]
      },
    ]
  },
  {
    id: "modals", title: "Động từ khuyết thiếu", icon: "💬", color: "#06B6D4",
    desc: "Can, could, may, might, must, should, will, would",
    lessons: [
      {
        id: "modals_ability", title: "Can / Could / Be able to", level: "A2",
        theory: {
          formula: [
            { label: "Can", f: "S + can + V  →  Khả năng hiện tại / cho phép" },
            { label: "Could", f: "S + could + V  →  Khả năng QK / lịch sự" },
            { label: "Be able to", f: "S + am/is/are/was/were able to + V" },
          ],
          uses: [
            { chip: "Can: khả năng HT", ex: "She can swim very well." },
            { chip: "Can: xin phép", ex: "Can I use your phone?" },
            { chip: "Could: khả năng QK", ex: "He could run fast when he was young." },
            { chip: "Could: lịch sự", ex: "Could you help me, please?" },
          ],
          note: "Be able to dùng được ở tất cả các thì (have been able to, will be able to...). Can/Could chỉ dùng được ở hiện tại/quá khứ.",
          signalWords: ["can/can't", "could/couldn't", "be able to/unable to"],
        },
        exercises: [
          { type: "mc", q: "___ you speak French? (xin phép/lịch sự)", opts: ["Can", "Could", "May", "Cả A và B"], ans: 3, exp: "Can và Could đều dùng xin phép, Could lịch sự hơn" },
          { type: "mc", q: "He ___ run fast when he was young.", opts: ["can", "could", "is able to", "will be able to"], ans: 1, exp: "Khả năng trong quá khứ → could" },
          { type: "fill", q: "After surgery, she ___ (be able to/walk) again.", ans: "was able to walk", exp: "Sau phẫu thuật (qk cụ thể) → was able to walk" },
          { type: "tf", q: "\"I couldn't to swim when I was 5.\" — đúng.", ans: false, exp: "Modal + V nguyên mẫu: couldn't swim (không có 'to')" },
        ]
      },
      {
        id: "modals_obligation", title: "Must / Have to / Should", level: "B1",
        theory: {
          formula: [
            { label: "Must", f: "S + must + V  →  Bắt buộc (người nói tự đặt ra)" },
            { label: "Have to", f: "S + have to + V  →  Bắt buộc (hoàn cảnh bên ngoài)" },
            { label: "Should", f: "S + should + V  →  Nên / Lời khuyên" },
            { label: "Mustn't", f: "Cấm tuyệt đối  ≠  Don't have to (không cần, OK nếu muốn)" },
          ],
          uses: [
            { chip: "Must: bắt buộc nội tâm", ex: "I must study harder." },
            { chip: "Have to: quy định bên ngoài", ex: "You have to wear a seatbelt by law." },
            { chip: "Should: lời khuyên", ex: "You should drink more water." },
            { chip: "Mustn't vs Don't have to", ex: "You mustn't smoke here. / You don't have to come." },
          ],
          note: "MUSTN'T = bị cấm. DON'T HAVE TO = không cần thiết (nhưng được phép nếu muốn). Suy luận chắc chắn: must + be (He must be tired).",
          signalWords: ["must, mustn't", "have to, don't have to", "should, shouldn't", "ought to"],
        },
        exercises: [
          { type: "mc", q: "You ___ smoke in hospitals. It's forbidden.", opts: ["mustn't", "don't have to", "couldn't", "shouldn't"], ans: 0, exp: "Cấm tuyệt đối → mustn't" },
          { type: "mc", q: "You ___ wear a uniform at this school. It's the rule.", opts: ["should", "must", "have to", "can"], ans: 2, exp: "Quy định bên ngoài → have to" },
          { type: "fill", q: "It's a free day. You ___ (not/come) to work.", ans: "don't have to come", exp: "Không cần thiết (nhưng được phép) → don't have to" },
          { type: "tf", q: "\"He must be tired — he's been working all day.\" — đúng.", ans: true, exp: "Suy luận chắc chắn → must be ✓" },
          { type: "mc", q: "You ___ eat more vegetables. (lời khuyên)", opts: ["must", "have to", "should", "mustn't"], ans: 2, exp: "Lời khuyên nhẹ → should" },
          { type: "order", words: ["take", "You", "an", "umbrella", "should."], ans: "You should take an umbrella.", exp: "should + V nguyên mẫu" },
        ]
      },
    ]
  },
  {
    id: "nouns_articles", title: "Danh từ & Mạo từ", icon: "📝", color: C.gold,
    desc: "Countable, uncountable, a/an/the/Ø",
    lessons: [
      {
        id: "articles", title: "Mạo từ A / An / The / Ø", level: "A1",
        theory: {
          formula: [
            { label: "a", f: "Danh từ đếm được số ít, lần đầu nhắc, phụ âm" },
            { label: "an", f: "Danh từ đếm được số ít, lần đầu nhắc, nguyên âm (a/e/i/o/u)" },
            { label: "the", f: "Đã nhắc đến / Cụ thể / Duy nhất / Trước mệnh đề quan hệ" },
            { label: "Ø (zero)", f: "Số nhiều/uncountable chung chung, tên riêng, bữa ăn, môn học" },
          ],
          uses: [
            { chip: "a/an: lần đầu", ex: "I saw a dog. The dog was cute." },
            { chip: "the: duy nhất", ex: "The Sun, the Moon, the Eiffel Tower" },
            { chip: "the: mệnh đề quan hệ", ex: "The book that I bought is interesting." },
            { chip: "Ø: chung chung", ex: "I love music. Dogs are loyal animals." },
          ],
          note: "Âm đầu quan trọng hơn chữ cái: an hour (h câm), a university (yu = phụ âm). Tên nước, tên người, tên thành phố thường không dùng the (trừ the USA, the Netherlands...).",
          signalWords: ["a/an: first mention, any one of", "the: specific, unique, both know which", "Ø: in general"],
        },
        exercises: [
          { type: "mc", q: "She is ___ engineer.", opts: ["a", "an", "the", "Ø"], ans: 1, exp: "engineer bắt đầu bằng nguyên âm [e] → an" },
          { type: "mc", q: "___ Sun rises in the east.", opts: ["A", "An", "The", "Ø"], ans: 2, exp: "Duy nhất trên thế giới → The Sun" },
          { type: "fill", q: "I bought ___ book yesterday. ___ book was very interesting.", ans: "a / The", exp: "Lần đầu: a book. Lần sau (đã biết): The book" },
          { type: "tf", q: "\"I love the music.\" (nghĩa: âm nhạc nói chung) — đúng.", ans: false, exp: "Chung chung → I love music (Ø). The music = âm nhạc cụ thể đang nghe" },
          { type: "mc", q: "\"Do you like ___ cats?\" (chung chung)", opts: ["a", "the", "Ø", "an"], ans: 2, exp: "Nói về loài chung → Zero article" },
          { type: "mc", q: "I need ___ advice. (uncountable)", opts: ["an", "a", "some", "the"], ans: 2, exp: "advice = uncountable → không dùng a/an → some advice" },
        ]
      },
    ]
  },
  {
    id: "adjectives_adverbs", title: "Tính từ & Trạng từ", icon: "✨", color: C.rose,
    desc: "Comparatives, superlatives, adjective order",
    lessons: [
      {
        id: "comparison", title: "So sánh hơn & nhất", level: "A2",
        theory: {
          formula: [
            { label: "So sánh hơn (1-2 âm tiết)", f: "adj + -er + than" },
            { label: "So sánh hơn (nhiều âm tiết)", f: "more + adj + than" },
            { label: "So sánh nhất (1-2 âm tiết)", f: "the + adj + -est" },
            { label: "So sánh nhất (nhiều âm tiết)", f: "the most + adj" },
            { label: "So sánh bằng", f: "as + adj + as" },
          ],
          uses: [
            { chip: "So sánh hơn ngắn", ex: "This car is faster than that one." },
            { chip: "So sánh hơn dài", ex: "She is more intelligent than her sister." },
            { chip: "So sánh nhất", ex: "He is the tallest in the class." },
            { chip: "So sánh bằng", ex: "My bag is as heavy as yours." },
          ],
          note: "Bất quy tắc: good→better→best, bad→worse→worst, far→farther/further→farthest/furthest, little→less→least, many/much→more→most. Nhân đôi phụ âm: big→bigger, hot→hotter. Kết thúc -y: happy→happier→happiest.",
          signalWords: ["than (so sánh hơn)", "the ... of/in (so sánh nhất)", "as...as, not as...as", "much/far + comparative (nhấn mạnh)"],
        },
        exercises: [
          { type: "mc", q: "This building is ___ than that one.", opts: ["tall", "taller", "tallest", "more tall"], ans: 1, exp: "tall (1 âm tiết) → taller + than" },
          { type: "mc", q: "She is the ___ student in the class.", opts: ["more intelligent", "intelligent", "most intelligent", "intelligenter"], ans: 2, exp: "Nhiều âm tiết → the most intelligent" },
          { type: "fill", q: "His bag is ___ (heavy) than mine.", ans: "heavier", exp: "heavy → kết thúc -y: heavier" },
          { type: "fill", q: "This is ___ (bad) film I have ever seen.", ans: "the worst", exp: "bad → worst (bất quy tắc)" },
          { type: "tf", q: "\"She is more tall than her brother.\" — đúng.", ans: false, exp: "tall = 1 âm tiết → taller than (không dùng more)" },
          { type: "mc", q: "My English is ___ good ___ his.", opts: ["as/as", "more/than", "so/as", "the/than"], ans: 0, exp: "So sánh bằng: as + adj + as" },
        ]
      },
    ]
  },
  {
    id: "relative", title: "Mệnh đề quan hệ", icon: "🔗", color: "#EC4899",
    desc: "Who, which, that, where, when, whose",
    lessons: [
      {
        id: "relative_main", title: "Relative Clauses", level: "B1",
        theory: {
          formula: [
            { label: "who / that", f: "→ người (chủ ngữ/tân ngữ)" },
            { label: "which / that", f: "→ vật/sự việc" },
            { label: "whose", f: "→ sở hữu" },
            { label: "where", f: "→ nơi chốn" },
            { label: "when", f: "→ thời gian" },
          ],
          uses: [
            { chip: "Xác định (Defining)", ex: "The man who called you is my brother." },
            { chip: "Không xác định (Non-defining)", ex: "My sister, who lives in Hanoi, is a doctor." },
            { chip: "Whose", ex: "The boy whose bag was stolen is crying." },
            { chip: "Where/When", ex: "The town where I grew up is beautiful." },
          ],
          note: "Defining: không có dấu phẩy, không thể bỏ mệnh đề. Non-defining: có dấu phẩy, có thể bỏ mệnh đề, KHÔNG dùng 'that'. Khi relative pronoun là tân ngữ trong mệnh đề xác định, có thể bỏ nó.",
          signalWords: ["who, whom, whose", "which, that", "where, when"],
        },
        exercises: [
          { type: "mc", q: "The woman ___ lives next door is a doctor.", opts: ["which", "who", "whose", "where"], ans: 1, exp: "Người + chủ ngữ → who" },
          { type: "mc", q: "This is the book ___ I bought yesterday.", opts: ["who", "whose", "which", "where"], ans: 2, exp: "Vật + tân ngữ → which/that" },
          { type: "fill", q: "The student ___ bag was stolen went to the police.", ans: "whose", exp: "Sở hữu → whose" },
          { type: "tf", q: "\"The man, that I met, is kind.\" (non-defining) — đúng.", ans: false, exp: "Non-defining KHÔNG dùng 'that' → The man, WHO I met, is kind ✓" },
          { type: "mc", q: "Paris, ___ I visited last year, is beautiful.", opts: ["that", "which", "who", "where"], ans: 1, exp: "Non-defining về vật/thành phố → which (not that)" },
          { type: "order", words: ["is", "The", "town", "I", "where", "grew", "beautiful.", "up"], ans: "The town where I grew up is beautiful.", exp: "where → nơi chốn" },
        ]
      },
    ]
  },
  {
    id: "reported", title: "Câu gián tiếp", icon: "💭", color: C.navyMid,
    desc: "Direct speech → Reported speech",
    lessons: [
      {
        id: "reported_main", title: "Reported Speech", level: "B2",
        theory: {
          formula: [
            { label: "Câu trần thuật", f: "S + said (that) + [backshifted clause]" },
            { label: "Câu hỏi Yes/No", f: "S + asked + whether/if + [clause]" },
            { label: "Câu hỏi WH", f: "S + asked + WH + [clause]" },
            { label: "Câu mệnh lệnh", f: "S + told O + to/not to + V" },
          ],
          uses: [
            { chip: "Lùi thì (backshift)", ex: '"I love you." → He said he loved her.' },
            { chip: "Đổi đại từ", ex: '"I am tired." → She said she was tired.' },
            { chip: "Câu hỏi Y/N", ex: '"Are you happy?" → He asked if she was happy.' },
            { chip: "Câu mệnh lệnh", ex: '"Close the door!" → She told him to close the door.' },
          ],
          note: "Quy tắc lùi thì: Present→Past, Past→Past Perfect, will→would, can→could, may→might, must→had to. Nếu câu trực tiếp là sự thật hiển nhiên, không cần lùi thì.",
          signalWords: ["said, told, asked, replied", "that (optional)", "whether/if (yes/no questions)"],
        },
        exercises: [
          { type: "mc", q: '"I am tired," she said. → She said ___.', opts: ["she is tired", "she was tired", "I am tired", "she were tired"], ans: 1, exp: "Present → Past: am → was" },
          { type: "mc", q: '"Do you speak English?" he asked. → He asked ___.', opts: ["do I speak English", "if I spoke English", "if she speaks English", "whether I spoke English"], ans: 3, exp: "Y/N question: asked + whether/if + backshifted" },
          { type: "fill", q: '"Close the window!" → She told him ___ the window.', ans: "to close", exp: "Mệnh lệnh → told + O + to + V" },
          { type: "tf", q: '"I will come tomorrow." → He said he would come tomorrow. — đúng.', ans: true, exp: "will → would ✓ (tomorrow có thể giữ nguyên hoặc → the next day)" },
          { type: "mc", q: '"Where do you live?" she asked. → She asked ___.', opts: ["where do I live", "where I lived", "where I live", "where did I live"], ans: 1, exp: "WH question: asked + WH + S + V (trật tự câu khẳng định)" },
        ]
      },
    ]
  },
];


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
const LEVEL_STYLE = {
  A1: { bg: "#FFF8EC", color: "#7a5c00", border: "rgba(201,168,76,.3)" },
  A2: { bg: "#FDF8EE", color: "#854F0B", border: "rgba(201,168,76,.35)" },
  B1: { bg: "#E1F5EE", color: "#0F6E56", border: "rgba(0,168,120,.3)" },
  B2: { bg: "#E6F1FB", color: "#185FA5", border: "rgba(24,95,165,.3)" },
  C1: { bg: "#EEEDFE", color: "#534AB7", border: "rgba(100,120,240,.3)" },
  C2: { bg: "#FBEAF0", color: "#993556", border: "rgba(240,100,100,.2)" },
};

function LevelBadge({ level }: { level: string }) {
  const s = LEVEL_STYLE[level as keyof typeof LEVEL_STYLE] || LEVEL_STYLE.A1;
  return (
    <span style={{
      padding: "2px 9px", borderRadius: 5, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: ".04em",
    }}>{level}</span>
  );
}

function ProgressBar({ value, color = C.gold }: { value: number; color?: string }) {
  return (
    <div style={{ height: 4, background: "rgba(15,28,53,.08)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2, transition: "width .5s cubic-bezier(.16,1,.3,1)" }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GrammarPage() {
  const [view, setView] = useState("home"); // home | chapter | lesson
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [tab, setTab] = useState(0); // 0=theory, 1=exercises
  const [answers, setAnswers] = useState<Record<number, string | number | boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState<Record<string, { score: number; total: number }>>({});
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
 const mainRef = useRef<HTMLElement>(null);

  // Flatten all lessons for lookup
  const allLessons = CHAPTERS.flatMap(c => c.lessons.map(l => ({ ...l, chapterId: c.id, chapterTitle: c.title, chapterColor: c.color })));

  const totalLessons = allLessons.length;
  const completedCount = Object.keys(completed).length;
  const overallPct = Math.round((completedCount / totalLessons) * 100);

  function openLesson(lesson: Lesson) {
    setActiveLesson(lesson);
    setView("lesson");
    setTab(0);
    setAnswers({});
    setSubmitted(false);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }

  function openChapter(ch: Chapter) {
    setActiveChapter(ch);
    setView("chapter");
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }

  function goHome() { setView("home"); setActiveChapter(null); setActiveLesson(null); }
  function goChapter() { setView("chapter"); setActiveLesson(null); setTab(0); setAnswers({}); setSubmitted(false); }

  function handleAnswer(idx: number, val: string | number | boolean) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [idx]: val }));
  }

  function submitQuiz() {
    if (!activeLesson) return;
    const total = activeLesson.exercises.length;
    const answered = Object.keys(answers).length;
    if (answered < total) { alert("Vui lòng trả lời tất cả câu hỏi!"); return; }
    const score = activeLesson.exercises.filter((ex, i) => {
      if (ex.type === "mc") return answers[i] === ex.ans;
      if (ex.type === "tf") return answers[i] === ex.ans;
      if (ex.type === "fill" || ex.type === "order") {
        return (String(answers[i] || "")).trim().toLowerCase() === String(ex.ans).toLowerCase();
      }
      return false;
    }).length;
    setSubmitted(true);
    if (score >= Math.ceil(total * 0.6)) {
      setCompleted(prev => ({ ...prev, [activeLesson.id]: { score, total } }));
      CHAPTERS.forEach(c => { const nav = document.getElementById("nav-" + activeLesson.id); if (nav) nav.classList.add("done"); });
    }
  }

  function resetQuiz() { setAnswers({}); setSubmitted(false); }

  const lessons = activeChapter
    ? activeChapter.lessons.filter(l => !filterLevel || l.level === filterLevel)
    : [];

  const score = submitted && activeLesson
    ? activeLesson.exercises.filter((ex, i) => {
      if (ex.type === "mc") return answers[i] === ex.ans;
      if (ex.type === "tf") return answers[i] === ex.ans;
      if (ex.type === "fill" || ex.type === "order") return String(answers[i] || "").trim().toLowerCase() === String(ex.ans).toLowerCase();
      return false;
    }).length
    : 0;

  // ── Sidebar nav data ──
  const navItems = CHAPTERS.map(ch => ({
    ...ch,
    done: ch.lessons.filter(l => completed[l.id]).length,
    total: ch.lessons.length,
  }));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", fontSize: 15 }}>
      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,.3); border-radius: 4px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeUp .3s cubic-bezier(.16,1,.3,1) both; }
        .lesson-card:hover { box-shadow: 0 6px 24px rgba(201,168,76,.18) !important; border-color: rgba(201,168,76,.4) !important; transform: translateY(-2px); }
        .lesson-card { transition: all .22s cubic-bezier(.16,1,.3,1); }
        .chapter-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(15,28,53,.1) !important; }
        .chapter-card { transition: all .22s cubic-bezier(.16,1,.3,1); }
        .nav-item:hover { background: ${C.goldPale}; color: ${C.navy}; }
        .opt-btn:hover:not(.opt-disabled) { border-color: rgba(201,168,76,.5) !important; background: ${C.goldPale} !important; }
        .opt-btn { transition: all .15s; }
        .tab-btn:hover { color: ${C.navy} !important; }
      `}</style>

      {/* ── SIDEBAR ── */}
      {sidebarOpen && (
        <nav style={{
          width: 252, minHeight: "100vh", background: C.white,
          borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column",
          position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{ padding: "22px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: C.navy }}>Grammar</div>
            <div style={{ fontSize: 12, color: C.textLt, marginTop: 2 }}>English Foundation · A1 → C1</div>
          </div>

          {/* Overall progress */}
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textLt, marginBottom: 6 }}>
              <span>Tiến độ tổng thể</span>
              <span style={{ color: C.gold, fontWeight: 700 }}>{completedCount}/{totalLessons}</span>
            </div>
            <ProgressBar value={overallPct} />
          </div>

          {/* Chapter list */}
          <div style={{ flex: 1, padding: "8px 0" }}>
            {navItems.map(ch => {
              const isActive = activeChapter?.id === ch.id;
              const pct = ch.total ? Math.round((ch.done / ch.total) * 100) : 0;
              return (
                <div key={ch.id} className="nav-item" onClick={() => openChapter(ch)} style={{
                  padding: "10px 20px", cursor: "pointer",
                  borderLeft: `3px solid ${isActive ? ch.color : "transparent"}`,
                  background: isActive ? `${ch.color}08` : "transparent",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 16 }}>{ch.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? C.navy : C.textMid, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ch.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <div style={{ flex: 1, height: 2, background: "rgba(15,28,53,.08)", borderRadius: 1 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: ch.color, borderRadius: 1 }} />
                      </div>
                      <span style={{ fontSize: 11, color: C.textLt, flexShrink: 0 }}>{ch.done}/{ch.total}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, color: C.textLt, textAlign: "center" }}>
              {completedCount === 0 ? "Bắt đầu học ngay! 🚀" : `${overallPct}% hoàn thành · Cố lên! 💪`}
            </div>
          </div>
        </nav>
      )}

      {/* ── MAIN ── */}
      <main ref={mainRef} style={{ flex: 1, padding: "28px clamp(16px,3vw,40px) 64px", overflowY: "auto", minWidth: 0 }}>

        {/* ══ HOME ══ */}
        {view === "home" && (
          <div className="fade-in">
            {/* Hero */}
            <div style={{
              background: C.navy, borderRadius: 20, padding: "28px 32px", marginBottom: 28,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: "rgba(201,168,76,.07)", borderRadius: "60% 40% 30% 70%", pointerEvents: "none" }} />
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 12px", background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.25)", borderRadius: 50, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                Ngữ pháp tiếng Anh
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(22px,3vw,32px)", fontWeight: 900, color: "#fff", marginBottom: 8, lineHeight: 1.2 }}>
                Nền tảng ngữ pháp <span style={{ color: C.gold }}>A1 → C1</span>
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,.55)", maxWidth: 480, lineHeight: 1.7 }}>
                {CHAPTERS.length} chương · {totalLessons} bài học · Lý thuyết + Bài tập đa dạng
              </p>
              <div style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Bài hoàn thành", val: completedCount, color: C.greenLt },
                  { label: "Tổng bài học", val: totalLessons, color: C.goldLt },
                  { label: "Tiến độ", val: `${overallPct}%`, color: C.violet },
                ].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(201,168,76,.18)", borderRadius: 12, padding: "10px 18px" }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chapter grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {CHAPTERS.map(ch => {
                const done = ch.lessons.filter(l => completed[l.id]).length;
                const pct = ch.lessons.length ? Math.round((done / ch.lessons.length) * 100) : 0;
                return (
                  <div key={ch.id} className="chapter-card" onClick={() => openChapter(ch)} style={{
                    background: C.white, borderRadius: 18, border: `1px solid ${C.border}`,
                    padding: "22px 24px", cursor: "pointer",
                    boxShadow: "0 2px 10px rgba(15,28,53,.06)",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${ch.color}12`, border: `1px solid ${ch.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{ch.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: 3 }}>{ch.title}</div>
                        <div style={{ fontSize: 12, color: C.textMid }}>{ch.desc}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textLt, marginBottom: 6 }}>
                      <span>{ch.lessons.length} bài học</span>
                      <span style={{ color: ch.color, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} color={ch.color} />
                    <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                      {Array.from(new Set(ch.lessons.map(l => l.level))).map(lv => <LevelBadge key={lv} level={lv} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ CHAPTER ══ */}
        {view === "chapter" && activeChapter && (
          <div className="fade-in">
            {/* Breadcrumb */}
            <div style={{ fontSize: 13, color: C.textLt, marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ cursor: "pointer", color: C.gold }} onClick={goHome}>Ngữ pháp</span>
              <span>›</span>
              <span style={{ color: C.navy, fontWeight: 600 }}>{activeChapter.title}</span>
            </div>

            {/* Chapter header */}
            <div style={{ background: C.navy, borderRadius: 18, padding: "24px 28px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, background: "rgba(201,168,76,.07)", borderRadius: "60% 40% 30% 70%", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${activeChapter.color}18`, border: `1px solid ${activeChapter.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{activeChapter.icon}</div>
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(18px,2vw,26px)", fontWeight: 900, color: "#fff", marginBottom: 4 }}>{activeChapter.title}</h2>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>{activeChapter.desc} · {activeChapter.lessons.length} bài học</p>
                </div>
              </div>
            </div>

            {/* Level filter */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.white, padding: 6, borderRadius: 50, border: `1px solid ${C.border}`, width: "fit-content", flexWrap: "wrap" }}>
              {["Tất cả", ...Array.from(new Set(activeChapter.lessons.map(l => l.level)))].map(lv => (
                <button key={lv} onClick={() => setFilterLevel(lv === "Tất cả" ? null : lv)} style={{
                  padding: "6px 16px", borderRadius: 50, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                  fontFamily: "inherit",
                  background: (lv === "Tất cả" ? !filterLevel : filterLevel === lv) ? C.navy : "transparent",
                  color: (lv === "Tất cả" ? !filterLevel : filterLevel === lv) ? "#fff" : C.textMid,
                  boxShadow: (lv === "Tất cả" ? !filterLevel : filterLevel === lv) ? "0 2px 8px rgba(15,28,53,.2)" : "none",
                }}>{lv}</button>
              ))}
            </div>

            {/* Lessons list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeChapter.lessons.filter(l => !filterLevel || l.level === filterLevel).map((lesson, i) => {
                const isDone = !!completed[lesson.id];
                const comp = completed[lesson.id];
                return (
                  <div key={lesson.id} className="lesson-card" onClick={() => openLesson({ ...lesson, chapterId: activeChapter.id, chapterColor: activeChapter.color })} style={{
                    background: C.white, borderRadius: 14, border: `1px solid ${isDone ? "rgba(0,168,120,.25)" : C.border}`,
                    padding: "18px 22px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16,
                    boxShadow: "0 2px 8px rgba(15,28,53,.05)",
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: isDone ? "rgba(0,168,120,.1)" : `${activeChapter.color}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18, fontFamily: "'Playfair Display', serif", fontWeight: 900, color: isDone ? C.green : activeChapter.color }}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{lesson.title}</span>
                        <LevelBadge level={lesson.level} />
                      </div>
                      <div style={{ fontSize: 12, color: C.textLt }}>
                        {lesson.theory.formula.length} công thức · {lesson.exercises.length} bài tập
                        {comp && <span style={{ color: C.green, fontWeight: 600, marginLeft: 8 }}>· {comp.score}/{comp.total} đúng</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, color: C.textLt, flexShrink: 0 }}>›</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ LESSON ══ */}
        {view === "lesson" && activeLesson && (
          <div className="fade-in">
            {/* Breadcrumb */}
            <div style={{ fontSize: 13, color: C.textLt, marginBottom: 18, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ cursor: "pointer", color: C.gold }} onClick={goHome}>Ngữ pháp</span>
              <span>›</span>
              <span style={{ cursor: "pointer", color: C.gold }} onClick={goChapter}>{CHAPTERS.find(c => c.id === activeLesson.chapterId)?.title}</span>
              <span>›</span>
              <span style={{ color: C.navy, fontWeight: 600 }}>{activeLesson.title}</span>
            </div>

            {/* Lesson header */}
            <div style={{ background: C.navy, borderRadius: 18, padding: "24px 28px", marginBottom: 22, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, background: "rgba(201,168,76,.07)", borderRadius: "60% 40% 30% 70%", pointerEvents: "none" }} />
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 12px", background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.25)", borderRadius: 50, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                {CHAPTERS.find(c => c.id === activeLesson.chapterId)?.title}
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(18px,2vw,26px)", fontWeight: 900, color: "#fff", marginBottom: 6, lineHeight: 1.2 }}>{activeLesson.title}</h2>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <LevelBadge level={activeLesson.level} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,.45)" }}>{activeLesson.exercises.length} bài tập · {activeLesson.theory.formula.length} công thức</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 22 }}>
              {["📖 Lý thuyết", "✏️ Bài tập"].map((t, i) => (
                <button key={i} className="tab-btn" onClick={() => setTab(i)} style={{
                  padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  color: tab === i ? C.navy : C.textMid, background: "transparent",
                  border: "none", borderBottom: `2.5px solid ${tab === i ? C.gold : "transparent"}`,
                  fontFamily: "inherit", marginBottom: -1,
                }}>{t}</button>
              ))}
            </div>

            {/* ── THEORY TAB ── */}
            {tab === 0 && (
              <div>
                {/* Formulas */}
                <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "22px 24px", marginBottom: 16, boxShadow: "0 2px 10px rgba(15,28,53,.05)" }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    Công thức
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: C.goldPale, color: C.gold, border: `1px solid rgba(201,168,76,.2)`, textTransform: "uppercase", letterSpacing: ".04em" }}>
                      {activeLesson.title}
                    </span>
                  </h3>
                  <div style={{ background: C.navy, borderRadius: 12, padding: "16px 20px", fontFamily: "monospace", fontSize: 13, lineHeight: 1.9, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: C.gold }} />
                    {activeLesson.theory.formula.map((f, i) => (
                      <div key={i}>
                        <span style={{ color: "#FAC775" }}>{f.label}:</span>
                        <span style={{ color: "#9FE1CB", marginLeft: 8 }}>{f.f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Uses */}
                <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "22px 24px", marginBottom: 16, boxShadow: "0 2px 10px rgba(15,28,53,.05)" }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: 14 }}>Khi nào dùng?</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {activeLesson.theory.uses.map((u, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "start" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: activeLesson.chapterColor ? `${activeLesson.chapterColor}10` : C.goldPale, color: activeLesson.chapterColor || C.gold, border: `1px solid ${activeLesson.chapterColor ? activeLesson.chapterColor + "22" : "rgba(201,168,76,.2)"}`, display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.chip}</span>
                        <div style={{ padding: "8px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, color: C.navy, lineHeight: 1.55, fontStyle: "italic" }} dangerouslySetInnerHTML={{ __html: u.ex.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Examples 2-col */}
                {activeLesson.theory.signalWords && (
                  <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 24px", marginBottom: 16, boxShadow: "0 2px 10px rgba(15,28,53,.05)" }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: 12 }}>Từ nhận biết (Signal words)</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {activeLesson.theory.signalWords.map((sw, i) => (
                        <span key={i} style={{ padding: "5px 12px", background: `rgba(24,95,165,.07)`, border: `1px solid rgba(24,95,165,.18)`, borderRadius: 8, fontSize: 13, color: C.blue, fontWeight: 500 }}>{sw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note */}
                {activeLesson.theory.note && (
                  <div style={{ background: C.goldPale, border: `1px solid rgba(201,168,76,.22)`, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>💡</span>
                    <div style={{ fontSize: 13, color: "#7a4a00", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: activeLesson.theory.note.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/([A-Z]{2,})/g, "<strong>$1</strong>") }} />
                  </div>
                )}

                {/* CTA */}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={() => setTab(1)} style={{ padding: "10px 24px", borderRadius: 50, background: C.gold, color: C.navy, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(201,168,76,.35)" }}>
                    Làm bài tập →
                  </button>
                </div>
              </div>
            )}

            {/* ── EXERCISES TAB ── */}
            {tab === 1 && (
              <div>
                {/* Score banner */}
                {submitted && (
                  <div className="fade-in" style={{ background: C.goldPale, border: `1px solid rgba(201,168,76,.3)`, borderRadius: 14, padding: "18px 22px", marginBottom: 20, display: "flex", alignItems: "center", gap: 18 }}>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, color: C.navy }}>{score}/{activeLesson.exercises.length}</div>
                      <div style={{ fontSize: 14, color: C.textMid, marginTop: 4 }}>
                        {Math.round(score / activeLesson.exercises.length * 100)}% · {score >= Math.ceil(activeLesson.exercises.length * 0.8) ? "🏆 Xuất sắc!" : score >= Math.ceil(activeLesson.exercises.length * 0.6) ? "📈 Tốt lắm!" : "💪 Ôn lại lý thuyết nhé!"}
                      </div>
                    </div>
                    <button onClick={resetQuiz} style={{ marginLeft: "auto", padding: "8px 18px", borderRadius: 50, background: C.white, border: `1px solid ${C.border}`, color: C.textMid, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Làm lại</button>
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
                  const cardBorder = submitted ? (isCorrect ? "rgba(0,168,120,.3)" : "rgba(240,100,100,.3)") : C.border;

                  return (
                    <div key={i} className="fade-in" style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${cardBorder}`, padding: "20px 22px", marginBottom: 14, boxShadow: "0 2px 8px rgba(15,28,53,.05)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.textLt, letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        Câu {i + 1}
                        <span style={{ padding: "1px 7px", borderRadius: 4, fontSize: 10, background: ex.type === "mc" ? "#E6F1FB" : ex.type === "tf" ? "#E1F5EE" : ex.type === "fill" ? C.goldPale : "#EEEDFE", color: ex.type === "mc" ? C.blue : ex.type === "tf" ? C.green : ex.type === "fill" ? C.gold : C.violet, fontWeight: 700 }}>
                          {ex.type === "mc" ? "Trắc nghiệm" : ex.type === "tf" ? "Đúng / Sai" : ex.type === "fill" ? "Điền từ" : "Sắp xếp câu"}
                        </span>
                      </div>

                      <div style={{ fontSize: 15, color: C.navy, fontWeight: 500, marginBottom: 14, lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={{ __html: (ex.q || "").replace("___", `<span style="display:inline-block;border-bottom:2px solid ${C.navy};min-width:60px;text-align:center;font-style:italic;color:${C.gold};font-weight:700;padding:0 4px">___</span>`) }} />

                      {/* MC */}
                      {ex.type === "mc" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {(ex.opts || []).map((o, j) => {
                            let bg = C.white, border = C.border, color = C.text;
                            if (submitted) {
                              if (j === ex.ans) { bg = "#E1F5EE"; border = "rgba(0,168,120,.4)"; color = "#0F6E56"; }
                              else if (j === userAns && userAns !== ex.ans) { bg = "#FEF2F2"; border = "rgba(240,100,100,.4)"; color = "#A32D2D"; }
                            } else if (userAns === j) { bg = C.goldPale; border = C.borderMd; color = C.navy; }
                            return (
                              <button key={j} className={`opt-btn ${submitted ? "opt-disabled" : ""}`} onClick={() => handleAnswer(i, j)} style={{ padding: "10px 14px", border: `1px solid ${border}`, borderRadius: 10, fontSize: 13.5, cursor: submitted ? "default" : "pointer", background: bg, color, textAlign: "left", fontFamily: "inherit", fontWeight: userAns === j ? 600 : 400 }}>
                                {String.fromCharCode(65 + j)}. {o}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* T/F */}
                      {ex.type === "tf" && (
                        <div style={{ display: "flex", gap: 10 }}>
                          {[true, false].map((v) => {
                            let bg = C.white, border = C.border, color = C.text;
                            if (submitted) {
                              if (v === ex.ans) { bg = "#E1F5EE"; border = "rgba(0,168,120,.4)"; color = "#0F6E56"; }
                              else if (v === userAns && userAns !== ex.ans) { bg = "#FEF2F2"; border = "rgba(240,100,100,.4)"; color = "#A32D2D"; }
                            } else if (userAns === v) { bg = C.goldPale; border = C.borderMd; color = C.navy; }
                            return (
                              <button key={String(v)} className={`opt-btn ${submitted ? "opt-disabled" : ""}`} onClick={() => handleAnswer(i, v)} style={{ flex: 1, padding: "10px 0", border: `1px solid ${border}`, borderRadius: 10, fontSize: 14, cursor: submitted ? "default" : "pointer", background: bg, color, fontFamily: "inherit", fontWeight: 600 }}>
                                {v ? "✓ Đúng" : "✗ Sai"}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Fill / Order */}
                      {(ex.type === "fill" || ex.type === "order") && (
                        <div>
                          {ex.type === "order" && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                              {(ex.words || []).map((w, wi) => (
                                <span key={wi} style={{ padding: "4px 10px", background: "rgba(100,120,240,.07)", border: "1px solid rgba(100,120,240,.18)", borderRadius: 6, fontSize: 13, color: C.violet, fontWeight: 600 }}>{w}</span>
                              ))}
                            </div>
                          )}
                          <input
                            value={String(answers[i] || "")}
                            onChange={e => handleAnswer(i, e.target.value)}
                            disabled={submitted}
                            placeholder={ex.type === "fill" ? "Điền câu trả lời..." : "Nhập câu đã sắp xếp..."}
                            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${submitted ? (isCorrect ? "rgba(0,168,120,.4)" : "rgba(240,100,100,.4)") : C.border}`, background: submitted ? (isCorrect ? "#E1F5EE" : "#FEF2F2") : C.white, fontSize: 14, color: submitted ? (isCorrect ? "#0F6E56" : "#A32D2D") : C.text, fontFamily: "inherit", outline: "none" }}
                          />
                          {submitted && !isCorrect && (
                            <div style={{ marginTop: 6, fontSize: 13, color: C.green }}>→ Đáp án đúng: <strong>{ex.ans}</strong></div>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {submitted && (
                        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: isCorrect ? "#E1F5EE" : "#FEF2F2", border: `1px solid ${isCorrect ? "rgba(0,168,120,.2)" : "rgba(240,100,100,.2)"}`, fontSize: 13, color: isCorrect ? "#0F6E56" : "#A32D2D", lineHeight: 1.6 }}>
                          {isCorrect ? "✓ Chính xác! " : "✗ Chưa đúng. "}<span dangerouslySetInnerHTML={{ __html: ex.exp }} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Submit / nav */}
                {!submitted ? (
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button onClick={submitQuiz} style={{ padding: "11px 28px", borderRadius: 50, background: C.gold, color: C.navy, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(201,168,76,.35)" }}>Kiểm tra đáp án</button>
                    <button onClick={() => setTab(0)} style={{ padding: "11px 22px", borderRadius: 50, background: C.white, border: `1px solid ${C.border}`, color: C.textMid, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>← Lý thuyết</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                    <button onClick={resetQuiz} style={{ padding: "11px 22px", borderRadius: 50, background: C.white, border: `1px solid ${C.border}`, color: C.textMid, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Làm lại</button>
                    <button onClick={goChapter} style={{ padding: "11px 24px", borderRadius: 50, background: C.navy, color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(15,28,53,.22)" }}>← Danh sách bài</button>
                    {(() => {
                      const ch = CHAPTERS.find(c => c.id === activeLesson.chapterId);
                      const idx = ch?.lessons.findIndex(l => l.id === activeLesson.id);
                      const next = ch?.lessons[(idx ?? -1) + 1];
                      if (!next) return null;
                      return (
                        <button onClick={() => openLesson({ ...next, chapterId: ch.id, chapterColor: ch.color })} style={{ padding: "11px 24px", borderRadius: 50, background: C.gold, color: C.navy, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(201,168,76,.3)" }}>
                          Bài tiếp theo →
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