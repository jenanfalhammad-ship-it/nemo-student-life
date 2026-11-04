import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const en = {
  brand: "NEMO", tagline: "Your University Life, Under Control.",
  // nav
  main: "Main", academic: "Academic", focusSocial: "Focus & Social",
  myDay: "My Day", calendar: "Calendar", tasks: "Tasks", reminders: "Reminders", countdown: "Countdown", events: "Events",
  courses: "My Courses", flashcards: "Flashcards & Study Studio", statistics: "Statistics",
  focusRoom: "Focus Room", together: "Study Together", zoo: "My Zoo", world: "Nemo's World",
  askNemo: "Ask Nemo", settings: "Settings", profile: "Profile",
  home: "Home", focus: "Focus", nemo: "Nemo", more: "More", collapse: "Collapse",
  // common
  add: "Add", save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", create: "Create", title: "Title",
  description: "Description", date: "Date", time: "Time", start: "Start", end: "End", location: "Location",
  course: "Course", none: "None", priority: "Priority", category: "Category", search: "Search", all: "All",
  loading: "Loading…", saved: "Saved", deleted: "Deleted", error: "Something went wrong", confirmDelete: "Delete this permanently?",
  low: "Low", medium: "Medium", high: "High", urgent: "Urgent", today: "Today", tomorrow: "Tomorrow", upcoming: "Upcoming",
  name: "Name", color: "Color", signOut: "Sign out", language: "Language", theme: "Theme", light: "Light", dark: "Dark", system: "System",
  // landing/auth
  getStarted: "Get started", signIn: "Sign in", signUp: "Create account", email: "Email", password: "Password",
  withGoogle: "Continue with Google", forgot: "Forgot password?", haveAccount: "Already have an account?", noAccount: "New to NEMO?",
  checkEmail: "Check your email to confirm your account.", resetSent: "Password reset link sent.", newPassword: "New password",
  setPassword: "Set new password", landingSub: "Tasks, lectures, courses, flashcards, focus and a cozy zoo that grows with you — all in one calm place.",
  // onboarding
  welcomeTitle: "Let's set up your NEMO", displayName: "What should we call you?", university: "University", major: "Major",
  semester: "Current semester", courseCount: "Number of courses", studyGoal: "Your study goal", sessionLen: "Preferred session length",
  minutes: "min", next: "Next", back: "Back", skip: "Skip", finish: "Finish",
  welcomeDone: "Welcome to NEMO! Your university life is about to become a little more organized.", enter: "Open My Day",
  // my day
  goodMorning: "Good morning", goodAfternoon: "Good afternoon", goodEvening: "Good evening",
  motivation: "Small steps, every day. You've got this.", verseOfDay: "Verse of the day", tasksDone: "Tasks done",
  tasksLeft: "Tasks left", lectures: "Today's lectures", deadlines: "Upcoming deadlines", exams: "Upcoming exams",
  focusTime: "Focus today", completion: "Day complete", schedule: "Today's schedule", todaysTasks: "Today's tasks",
  nearest: "Next countdown", insight: "Nemo's insight", quickActions: "Quick actions", nothingScheduled: "Nothing scheduled today. Enjoy the space.",
  noTasks: "No tasks yet. Add one to get going.", addTask: "Add task", addEvent: "Add event", addReminder: "Add reminder",
  startPomodoro: "Start Pomodoro", createFlashcards: "Create flashcards", days: "days", hours: "hours", now: "Now",
  // tasks
  myDayView: "My Day", allTasks: "All", overdue: "Overdue", completed: "Completed", board: "Board",
  notStarted: "Not started", inProgress: "In progress", due: "Due", estimate: "Estimate (min)",
  university_c: "University", studying_c: "Studying", personal_c: "Personal", projects_c: "Projects", activities_c: "Activities", other_c: "Other",
  markSelectedDone: "Complete selected", deleteSelected: "Delete selected", quickAdd: "Quick add a task and press Enter",
  // calendar / events
  day: "Day", week: "Week", month: "Month", lecture: "Lecture", exam: "Exam", quiz: "Quiz", assignment: "Assignment",
  project: "Project", study: "Study session", personalEv: "Personal", activity: "University activity",
  conference: "Conference", workshop: "Workshop", seminar: "Seminar", club: "Club activity", meeting: "Meeting", registration: "Registration deadline",
  weeklyRepeat: "Repeats weekly", conflict: "Overlaps with another event", link: "Registration link", list: "List",
  // reminders
  academicR: "Academic", personalR: "Personal", healthR: "Health & habits", projectsR: "Projects", otherR: "Other",
  repeat: "Repeat", once: "Once", daily: "Daily", weekly: "Weekly", snooze: "Snooze 10 min", markDone: "Done",
  enableNotif: "Enable browser notifications", notifBlocked: "Browser notifications are blocked. You'll still see reminders here.",
  notifOn: "Browser notifications on",
  // countdown
  midterm: "Midterm", final: "Final", graduation: "Graduation", scholarship: "Scholarship", left: "left", passed: "Passed",
  // courses
  newCourse: "New course", code: "Code", instructor: "Instructor", files: "Files", notes: "Notes", overview: "Overview",
  upload: "Upload file", noCourses: "No courses yet. Create your first course workspace.", newNote: "New note",
  autosaved: "Autosaved", archive: "Archive", unarchive: "Unarchive", download: "Download", noFiles: "No files yet.",
  pending: "Pending assignments",
  // flashcards
  decks: "Decks", newDeck: "New deck", front: "Front", back_: "Back", addCard: "Add card", studyNow: "Study",
  flip: "Tap to flip", again: "Again", hard: "Hard", good: "Good", easy: "Easy", dueToday: "Due today",
  newC: "New", learning: "Learning", review: "Review", mastered: "Mastered", allDone: "All caught up for now!", shuffle: "Shuffle", cards: "cards",
  // focus
  pomodoro: "Pomodoro", deep: "Deep Focus", custom: "Custom", pause: "Pause", resume: "Resume", reset: "Reset",
  breakTime: "Break", skipBreak: "Skip break", sessionDone: "Session complete!", pearlsEarned: "Pearls earned",
  focusOn: "Focusing on", history: "Session history", dailyGoal: "Daily goal", enterFocus: "Enter focus mode", exitFocus: "Exit",
  // zoo
  pearls: "Pearls", journal: "Discovery Journal", discover: "Discover", cost: "Cost", undiscovered: "Undiscovered",
  common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary", forest: "Forest", ocean: "Ocean", snow: "Snow Valley", magic: "Magic Garden",
  notEnough: "Not enough pearls yet", discovered: "You discovered", zooEmpty: "Your zoo is waiting for its first resident.",
  // rooms
  createRoom: "Create room", joinRoom: "Join with code", roomName: "Room name", leave: "Leave", members: "Members",
  studying: "Studying", onBreak: "On break", idle: "Idle", inviteCode: "Invite code", sharedGoal: "Shared goal", remove: "Remove",
  // ai
  askPlaceholder: "Ask Nemo about your day, tasks or exams…", thinking: "Nemo is thinking…", clearChat: "Clear chat",
  s1: "What do I have tomorrow?", s2: "I have 3 free hours today. Organize my studying.", s3: "Move my unfinished tasks to tomorrow.", s4: "Summarize my focus this week.",
  actionsDone: "Actions taken", aiNote: "Nemo can make mistakes. Check important details.",
  // stats
  totalFocus: "Total focus", sessions: "Sessions", completionRate: "Completion rate", reviewed: "Cards reviewed",
  last7: "Last 7 days", last30: "Last 30 days", recordedNote: "Only completed, recorded focus sessions are counted — not scheduled study time.", byCourse: "By course",
  // settings
  account: "Account", appearance: "Appearance", preferences: "Preferences", privacy: "Privacy", timeFormat: "Time format",
  weekStart: "First day of week", sunday: "Sunday", monday: "Monday", saturday: "Saturday", showVerse: "Show daily Quran verse",
  exportData: "Export my data", clearAi: "Delete Nemo chat history", h12: "12-hour", h24: "24-hour",
};
export type Dict = typeof en;
type Key = keyof Dict;

const ar: Dict = {
  brand: "نيمو", tagline: "حياتك الجامعية، تحت السيطرة.",
  main: "الرئيسية", academic: "الأكاديمي", focusSocial: "التركيز والمجتمع",
  myDay: "يومي", calendar: "التقويم", tasks: "المهام", reminders: "التذكيرات", countdown: "العد التنازلي", events: "الفعاليات",
  courses: "موادي", flashcards: "البطاقات واستوديو المذاكرة", statistics: "الإحصائيات",
  focusRoom: "غرفة التركيز", together: "ذاكر مع أصدقائك", zoo: "حديقتي", world: "عالم نيمو",
  askNemo: "اسأل نيمو", settings: "الإعدادات", profile: "الملف الشخصي",
  home: "الرئيسية", focus: "تركيز", nemo: "نيمو", more: "المزيد", collapse: "طي",
  add: "إضافة", save: "حفظ", cancel: "إلغاء", delete: "حذف", edit: "تعديل", create: "إنشاء", title: "العنوان",
  description: "الوصف", date: "التاريخ", time: "الوقت", start: "البداية", end: "النهاية", location: "المكان",
  course: "المادة", none: "بدون", priority: "الأولوية", category: "التصنيف", search: "بحث", all: "الكل",
  loading: "جارٍ التحميل…", saved: "تم الحفظ", deleted: "تم الحذف", error: "حدث خطأ ما", confirmDelete: "هل تريد الحذف نهائيًا؟",
  low: "منخفضة", medium: "متوسطة", high: "عالية", urgent: "عاجلة", today: "اليوم", tomorrow: "غدًا", upcoming: "القادمة",
  name: "الاسم", color: "اللون", signOut: "تسجيل الخروج", language: "اللغة", theme: "المظهر", light: "فاتح", dark: "داكن", system: "حسب الجهاز",
  getStarted: "ابدأ الآن", signIn: "تسجيل الدخول", signUp: "إنشاء حساب", email: "البريد الإلكتروني", password: "كلمة المرور",
  withGoogle: "المتابعة باستخدام Google", forgot: "نسيت كلمة المرور؟", haveAccount: "لديك حساب بالفعل؟", noAccount: "جديد على نيمو؟",
  checkEmail: "تحقق من بريدك لتأكيد الحساب.", resetSent: "تم إرسال رابط إعادة التعيين.", newPassword: "كلمة مرور جديدة",
  setPassword: "تعيين كلمة المرور", landingSub: "المهام والمحاضرات والمواد والبطاقات والتركيز، وحديقة لطيفة تكبر معك — كلها في مكان هادئ واحد.",
  welcomeTitle: "لنجهّز نيمو الخاص بك", displayName: "بماذا نناديك؟", university: "الجامعة", major: "التخصص",
  semester: "الفصل الدراسي الحالي", courseCount: "عدد المواد", studyGoal: "هدفك الدراسي", sessionLen: "مدة الجلسة المفضلة",
  minutes: "دقيقة", next: "التالي", back: "رجوع", skip: "تخطٍّ", finish: "إنهاء",
  welcomeDone: "أهلًا بك في نيمو! حياتك الجامعية على وشك أن تصبح أكثر تنظيمًا.", enter: "افتح يومي",
  goodMorning: "صباح الخير", goodAfternoon: "مساء الخير", goodEvening: "مساء الخير",
  motivation: "خطوات صغيرة كل يوم. أنت قادر.", verseOfDay: "آية اليوم", tasksDone: "مهام منجزة",
  tasksLeft: "مهام متبقية", lectures: "محاضرات اليوم", deadlines: "مواعيد قادمة", exams: "اختبارات قادمة",
  focusTime: "تركيز اليوم", completion: "إنجاز اليوم", schedule: "جدول اليوم", todaysTasks: "مهام اليوم",
  nearest: "أقرب عد تنازلي", insight: "ملاحظة نيمو", quickActions: "إجراءات سريعة", nothingScheduled: "لا يوجد شيء مجدول اليوم. استمتع بوقتك.",
  noTasks: "لا توجد مهام بعد. أضف مهمة للبدء.", addTask: "إضافة مهمة", addEvent: "إضافة حدث", addReminder: "إضافة تذكير",
  startPomodoro: "ابدأ بومودورو", createFlashcards: "إنشاء بطاقات", days: "أيام", hours: "ساعات", now: "الآن",
  myDayView: "يومي", allTasks: "الكل", overdue: "متأخرة", completed: "مكتملة", board: "اللوحة",
  notStarted: "لم تبدأ", inProgress: "قيد التنفيذ", due: "الاستحقاق", estimate: "التقدير (دقيقة)",
  university_c: "الجامعة", studying_c: "المذاكرة", personal_c: "شخصي", projects_c: "مشاريع", activities_c: "أنشطة", other_c: "أخرى",
  markSelectedDone: "إكمال المحدد", deleteSelected: "حذف المحدد", quickAdd: "أضف مهمة سريعة واضغط Enter",
  day: "يوم", week: "أسبوع", month: "شهر", lecture: "محاضرة", exam: "اختبار", quiz: "اختبار قصير", assignment: "واجب",
  project: "مشروع", study: "جلسة مذاكرة", personalEv: "شخصي", activity: "نشاط جامعي",
  conference: "مؤتمر", workshop: "ورشة عمل", seminar: "ندوة", club: "نشاط نادٍ", meeting: "اجتماع", registration: "آخر موعد للتسجيل",
  weeklyRepeat: "يتكرر أسبوعيًا", conflict: "يتعارض مع حدث آخر", link: "رابط التسجيل", list: "قائمة",
  academicR: "أكاديمي", personalR: "شخصي", healthR: "الصحة والعادات", projectsR: "مشاريع", otherR: "أخرى",
  repeat: "التكرار", once: "مرة واحدة", daily: "يوميًا", weekly: "أسبوعيًا", snooze: "تأجيل ١٠ دقائق", markDone: "تم",
  enableNotif: "تفعيل إشعارات المتصفح", notifBlocked: "إشعارات المتصفح محظورة. ستظهر التذكيرات هنا.",
  notifOn: "إشعارات المتصفح مفعّلة",
  midterm: "اختبار منتصف الفصل", final: "الاختبار النهائي", graduation: "التخرج", scholarship: "منحة", left: "متبقية", passed: "انتهى",
  newCourse: "مادة جديدة", code: "الرمز", instructor: "المحاضر", files: "الملفات", notes: "الملاحظات", overview: "نظرة عامة",
  upload: "رفع ملف", noCourses: "لا توجد مواد بعد. أنشئ أول مساحة لمادتك.", newNote: "ملاحظة جديدة",
  autosaved: "حُفظ تلقائيًا", archive: "أرشفة", unarchive: "إلغاء الأرشفة", download: "تنزيل", noFiles: "لا توجد ملفات بعد.",
  pending: "واجبات معلقة",
  decks: "المجموعات", newDeck: "مجموعة جديدة", front: "الوجه", back_: "الظهر", addCard: "إضافة بطاقة", studyNow: "ذاكر",
  flip: "اضغط للقلب", again: "مجددًا", hard: "صعب", good: "جيد", easy: "سهل", dueToday: "مستحقة اليوم",
  newC: "جديدة", learning: "قيد التعلم", review: "مراجعة", mastered: "متقنة", allDone: "أنهيت كل شيء الآن!", shuffle: "خلط", cards: "بطاقات",
  pomodoro: "بومودورو", deep: "تركيز عميق", custom: "مخصص", pause: "إيقاف مؤقت", resume: "استئناف", reset: "إعادة",
  breakTime: "استراحة", skipBreak: "تخطي الاستراحة", sessionDone: "اكتملت الجلسة!", pearlsEarned: "لآلئ مكتسبة",
  focusOn: "التركيز على", history: "سجل الجلسات", dailyGoal: "الهدف اليومي", enterFocus: "وضع التركيز", exitFocus: "خروج",
  pearls: "لآلئ", journal: "دفتر الاكتشافات", discover: "اكتشف", cost: "التكلفة", undiscovered: "غير مكتشف",
  common: "شائع", rare: "نادر", epic: "ملحمي", legendary: "أسطوري", forest: "الغابة", ocean: "المحيط", snow: "وادي الثلج", magic: "الحديقة السحرية",
  notEnough: "لا تكفي اللآلئ بعد", discovered: "لقد اكتشفت", zooEmpty: "حديقتك بانتظار أول ساكن.",
  createRoom: "إنشاء غرفة", joinRoom: "انضم برمز", roomName: "اسم الغرفة", leave: "مغادرة", members: "الأعضاء",
  studying: "يذاكر", onBreak: "في استراحة", idle: "غير نشط", inviteCode: "رمز الدعوة", sharedGoal: "الهدف المشترك", remove: "إزالة",
  askPlaceholder: "اسأل نيمو عن يومك أو مهامك أو اختباراتك…", thinking: "نيمو يفكر…", clearChat: "مسح المحادثة",
  s1: "ماذا لدي غدًا؟", s2: "لدي ٣ ساعات فراغ اليوم. نظّم مذاكرتي.", s3: "انقل مهامي غير المكتملة إلى الغد.", s4: "لخّص تركيزي هذا الأسبوع.",
  actionsDone: "الإجراءات المنفذة", aiNote: "قد يخطئ نيمو. تحقق من التفاصيل المهمة.",
  totalFocus: "إجمالي التركيز", sessions: "الجلسات", completionRate: "نسبة الإنجاز", reviewed: "بطاقات مراجعة",
  last7: "آخر ٧ أيام", last30: "آخر ٣٠ يومًا", recordedNote: "تُحتسب جلسات التركيز المكتملة والمسجلة فقط — وليس وقت المذاكرة المجدول.", byCourse: "حسب المادة",
  account: "الحساب", appearance: "المظهر", preferences: "التفضيلات", privacy: "الخصوصية", timeFormat: "صيغة الوقت",
  weekStart: "أول يوم في الأسبوع", sunday: "الأحد", monday: "الإثنين", saturday: "السبت", showVerse: "عرض آية اليوم",
  exportData: "تصدير بياناتي", clearAi: "حذف محادثات نيمو", h12: "١٢ ساعة", h24: "٢٤ ساعة",
};

const dicts: Record<Lang, Dict> = { en, ar };

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string; dir: "ltr" | "rtl"; locale: string };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const s = localStorage.getItem("nemo-lang");
    if (s === "ar" || s === "en") setLangState(s);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = (l: Lang) => { localStorage.setItem("nemo-lang", l); setLangState(l); };
  const value: Ctx = {
    lang, setLang, t: (k) => dicts[lang][k] ?? en[k], dir: lang === "ar" ? "rtl" : "ltr",
    locale: lang === "ar" ? "ar-SA-u-nu-arab-ca-gregory" : "en-US",
  };
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}

export type TKey = Key;
