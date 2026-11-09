import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  FileText,
  Heart,
  Layers,
  ListTodo,
  MessageCircle,
  Play,
  Sparkles,
  Star,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { expandEvents, useRows, useUpdate } from "@/lib/data";
import { useProfile } from "@/lib/data";
import { useTx } from "@/lib/tx";
import type { Row } from "@/lib/data";
import oceanScene from "@/assets/nemo-ocean-scene.webp";
import nemoMascot from "@/assets/nemo-goggles-mascot.webp";
import "@/dashboard.css";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Day — NEMO" },
      { name: "description", content: "Your tasks and schedule for today in NEMO." },
    ],
  }),
  component: DashboardPage,
});
const dateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

function DashboardPage() {
  const { tx, fmtDate, fmtTime, locale } = useTx();
  const { data: profile } = useProfile();
  const { data: tasks = [], isLoading: tasksLoading } = useRows("tasks", {
    order: "due_at",
    asc: true,
  });
  const { data: events = [], isLoading: eventsLoading } = useRows("events", {
    order: "starts_at",
    asc: true,
  });
  const { data: reminders = [] } = useRows("reminders", { order: "remind_at", asc: true });
  const { data: countdowns = [] } = useRows("countdowns", { order: "target_at", asc: true });
  const { data: sessions = [] } = useRows("focus_sessions", {
    order: "started_at",
    asc: false,
  });
  const updateTask = useUpdate("tasks");
  const updateReminder = useUpdate("reminders");
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  const todaysEvents = expandEvents(events, start, end);
  const todaysTasks = tasks.filter(
    (task) => task.due_at && dateKey(new Date(task.due_at)) === dateKey(today),
  );
  const completedToday = todaysTasks.filter((task) => task.status === "completed");
  const pendingToday = todaysTasks.filter((task) => task.status !== "completed");
  const activeReminders = reminders
    .filter((item) => !item.done)
    .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime());
  const todayReminders = activeReminders.filter(
    (item) => new Date(item.remind_at).toDateString() === today.toDateString(),
  );
  const nearest = countdowns
    .filter((item) => new Date(item.target_at).getTime() >= Date.now())
    .sort((a, b) => new Date(a.target_at).getTime() - new Date(b.target_at).getTime())[0];
  const todaySessions = sessions.filter(
    (session) =>
      session.ended_at && new Date(session.ended_at).toDateString() === today.toDateString(),
  );
  const todayFocusMinutes = todaySessions.reduce(
    (sum, session) => sum + Math.max(0, session.actual_minutes || 0),
    0,
  );
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const minutes = sessions
      .filter((session) => {
        if (!session.ended_at) return false;
        const ended = new Date(session.ended_at);
        return ended >= date && ended < next;
      })
      .reduce((sum, session) => sum + Math.max(0, session.actual_minutes || 0), 0);
    return { date, minutes };
  });
  const peakFocus = Math.max(1, ...week.map((day) => day.minutes));
  const hour = today.getHours();
  const greeting =
    hour < 12
      ? tx("Good morning", "صباح الخير")
      : hour < 18
        ? tx("Good afternoon", "مساء الخير")
        : tx("Good evening", "مساء الخير");
  const completion = todaysTasks.length
    ? Math.round((completedToday.length / todaysTasks.length) * 100)
    : 0;
  const openTasks = pendingToday.slice(0, 5);
  const dayTitle = today.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const helloName = profile?.display_name ? `, ${profile.display_name}` : "";

  return (
    <div className="nemo-dashboard">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-kicker">{dayTitle}</p>
          <h1>
            {greeting}
            {helloName} <span className="greeting-wave">👋</span>
          </h1>
          <p className="dashboard-subtitle">
            {tx("Let's make today productive!", "خلّينا نخلي يومك مليان إنجاز!")}
          </p>
        </div>
        <div className="dashboard-tools">
          <span className="dashboard-date">
            <CalendarDays />
            {today.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <Link
            to="/reminders"
            className="dashboard-bell"
            aria-label={tx("Reminders", "التذكيرات")}
          >
            <Bell />
            {todayReminders.length > 0 && <span className="notification-dot" />}
          </Link>
          <Link
            to="/profile"
            className="dashboard-avatar"
            aria-label={tx("Profile", "الملف الشخصي")}
          >
            <img src={nemoMascot} alt="Nemo" />
          </Link>
        </div>
      </header>

      <section className="dashboard-stage">
        <Link to="/focus" className="focus-card">
          <div className="focus-card-top">
            <span>
              <Target /> {tx("Focus session", "جلسة تركيز")}
            </span>
            <ArrowRight />
          </div>
          <div className="focus-time">25:00</div>
          <div className="focus-card-bottom">
            <span className="focus-play">
              <Play fill="currentColor" />
            </span>
            <span>{tx("Start a focus session", "ابدأ جلسة تركيز")}</span>
            <span className="focus-equalizer">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
          <span className="focus-coral coral-a" />
          <span className="focus-coral coral-b" />
        </Link>

        <div
          className="reef-scene"
          style={{ backgroundImage: `url(${oceanScene})` }}
          role="img"
          aria-label={tx(
            "Nemo studying in a glowing underwater reef",
            "نيمو يذاكر في أعماق بحر مضيئة",
          )}
        >
          <div className="reef-bubbles">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <span className="reef-caption">
            <Sparkles />
            {tx("A little focus goes a long way", "قليل من التركيز يصنع الكثير")}
          </span>
        </div>

        <section className="dash-panel status-panel">
          <div className="panel-heading">
            <h2>{tx("Your status", "حالتك")}</h2>
            <span
              className="status-info"
              title={tx("Based on your saved activity", "استنادًا إلى نشاطك المحفوظ")}
            >
              i
            </span>
          </div>
          <div className="status-main">
            <div
              className="productivity-ring"
              style={{ "--progress": `${completion}%` } as React.CSSProperties}
            >
              <div>
                <strong>{completion}%</strong>
                <span>{tx("Productivity", "الإنجاز")}</span>
              </div>
            </div>
            <div className="status-bars">
              <StatusRow
                icon={<Target />}
                label={tx("Tasks", "المهام")}
                value={`${completedToday.length}/${todaysTasks.length}`}
                percent={completion}
                tone="violet"
              />
              <StatusRow
                icon={<Timer />}
                label={tx("Focus", "التركيز")}
                value={`${todayFocusMinutes} ${tx("min", "د")}`}
                percent={Math.round((todayFocusMinutes / peakFocus) * 100)}
                tone="cyan"
              />
              <StatusRow
                icon={<Bell />}
                label={tx("Reminders", "التذكيرات")}
                value={`${todayReminders.length}`}
                percent={
                  activeReminders.length
                    ? Math.round((todayReminders.length / activeReminders.length) * 100)
                    : 0
                }
                tone="pink"
              />
            </div>
          </div>
        </section>
      </section>

      <div className="dashboard-content-grid">
        <section className="dash-panel tasks-panel">
          <div className="panel-heading">
            <div>
              <h2>{tx("Today's tasks", "مهام اليوم")}</h2>
              <p>
                {completedToday.length} {tx("of", "من")} {todaysTasks.length}{" "}
                {tx("completed", "مكتملة")}
              </p>
            </div>
            <Button asChild size="sm" className="add-task-button">
              <Link to="/tasks">
                <span>+</span>
                {tx("Add task", "إضافة مهمة")}
              </Link>
            </Button>
          </div>
          <div className="task-progress">
            <span style={{ width: `${completion}%` }} />
          </div>
          {tasksLoading ? (
            <p className="empty-note">{tx("Loading your tasks…", "جارٍ تحميل مهامك…")}</p>
          ) : openTasks.length === 0 && completedToday.length === 0 ? (
            <Empty
              icon={<ListTodo />}
              title={tx("Your task list is clear", "قائمة مهامك فارغة")}
              detail={tx("Add a task to get your day moving.", "أضف مهمة لتبدأ يومك.")}
            />
          ) : (
            <div className="dash-list">
              {[...completedToday.slice(0, 2), ...openTasks].slice(0, 5).map((task) => (
                <DayTask
                  key={task.id}
                  task={task}
                  onToggle={() =>
                    updateTask.mutate({
                      id: task.id,
                      values: {
                        status: task.status === "completed" ? "todo" : "completed",
                        completed_at: task.status === "completed" ? null : new Date().toISOString(),
                      },
                    })
                  }
                  tx={tx}
                />
              ))}
            </div>
          )}
          <div className="panel-footer">
            <Link to="/calendar">
              <CalendarDays />
              {tx("Today's schedule", "جدول اليوم")}
              <span className="footer-count">{eventsLoading ? "…" : todaysEvents.length}</span>
              <ArrowUpRight className="footer-arrow" />
            </Link>
          </div>
        </section>

        <section className="dash-panel assistant-panel">
          <div className="panel-heading">
            <h2>
              <Sparkles />
              {tx("Nemo AI", "مساعد نيمو")}
            </h2>
            <Link
              to="/ask"
              className="assistant-chat-icon"
              aria-label={tx("Open Nemo AI", "افتح مساعد نيمو")}
            >
              <MessageCircle />
            </Link>
          </div>
          <img className="assistant-mascot" src={nemoMascot} alt="Nemo" />
          <p className="assistant-prompt">
            {tx("How can I help you today?", "كيف أقدر أساعدك اليوم؟")}
          </p>
          <div className="assistant-actions">
            <AssistantLink
              to="/calendar"
              icon={<Zap />}
              text={tx("Optimize my schedule", "نظّم جدولي")}
            />
            <AssistantLink
              to="/tasks"
              icon={<FileText />}
              text={tx("Break down a task", "قسّم مهمة كبيرة")}
            />
            <AssistantLink
              to="/ask"
              icon={<BookOpen />}
              text={tx("Generate a study plan", "أنشئ خطة مذاكرة")}
            />
            <AssistantLink
              to="/stats"
              icon={<Sparkles />}
              text={tx("Track my progress", "تابع تقدمي")}
            />
          </div>
        </section>

        <div className="dashboard-right-column">
          <section className="dash-panel reminders-panel">
            <div className="panel-heading">
              <h2>
                <Bell />
                {tx("Reminders", "التذكيرات")}
              </h2>
              <Link className="panel-link" to="/reminders">
                <ArrowUpRight />
              </Link>
            </div>
            {todayReminders.length === 0 ? (
              <div className="compact-empty">
                {tx("No reminders for today yet.", "لا توجد تذكيرات لليوم.")}
              </div>
            ) : (
              <div className="dash-list">
                {todayReminders.slice(0, 3).map((item) => (
                  <div key={item.id} className="reminder-row">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="task-check"
                      aria-label={tx("Complete reminder", "إكمال التذكير")}
                      onClick={() => updateReminder.mutate({ id: item.id, values: { done: true } })}
                    >
                      <Circle />
                    </Button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{item.title}</p>
                      <small>{fmtTime(item.remind_at)}</small>
                    </div>
                    <Zap className="reminder-zap" />
                  </div>
                ))}
              </div>
            )}
            {nearest && (
              <Link to="/countdown" className="milestone-link">
                <Clock3 />
                <span>
                  <small>{tx("NEXT MILESTONE", "الموعد القادم")}</small>
                  <strong>{nearest.title}</strong>
                  <small>{fmtDate(nearest.target_at, { month: "short", day: "numeric" })}</small>
                </span>
                <ArrowUpRight className="milestone-arrow" />
              </Link>
            )}
          </section>

          <section className="dash-panel weekly-panel">
            <div className="panel-heading">
              <h2>
                <span className="mini-bars">
                  <i />
                  <i />
                  <i />
                </span>
                {tx("Weekly focus", "تركيز الأسبوع")}
              </h2>
              <Link className="weekly-percent" to="/stats">
                {tx("View all", "عرض الكل")}
                <ArrowUpRight />
              </Link>
            </div>
            <div
              className="weekly-chart"
              aria-label={tx(
                "Weekly minutes from your recorded focus sessions",
                "دقائق الأسبوع من جلسات التركيز المسجلة",
              )}
            >
              <div className="chart-guides">
                <i />
                <i />
                <i />
              </div>
              <svg viewBox="0 0 300 94" role="img" aria-hidden="true">
                <defs>
                  <linearGradient id="focusArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#a489ff" stopOpacity=".36" />
                    <stop offset="100%" stopColor="#8a71ef" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={
                    week
                      .map((day, i) => `${i * 48 + 6},${86 - (day.minutes / peakFocus) * 70}`)
                      .join(" ") + " 294,94 6,94"
                  }
                  fill="url(#focusArea)"
                />
                <polyline
                  points={week
                    .map((day, i) => `${i * 48 + 6},${86 - (day.minutes / peakFocus) * 70}`)
                    .join(" ")}
                  fill="none"
                  stroke="#b8a0ff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {week.map((day, i) => (
                  <circle
                    key={day.date.toISOString()}
                    cx={i * 48 + 6}
                    cy={86 - (day.minutes / peakFocus) * 70}
                    r="3.5"
                    fill="#f4ebff"
                    stroke="#a992ff"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>
            <div className="week-labels">
              {week.map((day) => (
                <span
                  key={day.date.toISOString()}
                  title={`${day.minutes} ${tx("minutes", "دقيقة")}`}
                >
                  {day.date.toLocaleDateString(locale, { weekday: "short" })}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>

      <nav className="dashboard-shortcuts" aria-label={tx("Quick links", "روابط سريعة")}>
        <QuickLink
          to="/courses"
          icon={<BookOpen />}
          title={tx("My courses", "موادي")}
          detail={tx("Course workspaces", "مساحات المواد")}
        />
        <QuickLink
          to="/calendar"
          icon={<CalendarDays />}
          title={tx("Calendar", "التقويم")}
          detail={tx("Lectures & deadlines", "محاضرات ومواعيد")}
        />
        <QuickLink
          to="/flashcards"
          icon={<Layers />}
          title={tx("Flashcards", "البطاقات التعليمية")}
          detail={tx("Review and study", "مراجعة ومذاكرة")}
        />
        <QuickLink
          to="/stats"
          icon={<Sparkles />}
          title={tx("Statistics", "الإحصائيات")}
          detail={tx("See your real progress", "تابع إنجازاتك")}
        />
        <QuickLink
          to="/zoo"
          icon={<Heart />}
          title={tx("My zoo", "حديقتي")}
          detail={tx("Meet your companions", "رفاقك البحريون")}
        />
      </nav>
    </div>
  );
}
function StatusRow({
  icon,
  label,
  value,
  percent,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  percent: number;
  tone: string;
}) {
  return (
    <div className="status-row">
      <span className={`status-icon ${tone}`}>{icon}</span>
      <div className="status-details">
        <div>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
        <div className="status-track">
          <span className={tone} style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}
function AssistantLink({
  to,
  icon,
  text,
}: {
  to: "/calendar" | "/tasks" | "/ask" | "/stats";
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <Link to={to} className="assistant-action">
      <span>{icon}</span>
      <strong>{text}</strong>
      <ArrowRight />
    </Link>
  );
}
function QuickLink({
  to,
  icon,
  title,
  detail,
}: {
  to: "/courses" | "/calendar" | "/flashcards" | "/stats" | "/zoo";
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <Link to={to} className="quick-link">
      <span className="quick-link-icon">{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <ArrowUpRight className="quick-arrow" />
    </Link>
  );
}
function Empty({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="empty-note">
      <span>{icon}</span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </div>
  );
}
function DayTask({
  task,
  onToggle,
  tx,
}: {
  task: Row<"tasks">;
  onToggle: () => void;
  tx: (en: string, ar: string) => string;
}) {
  return (
    <div className={`task-row ${task.status === "completed" ? "is-complete" : ""}`}>
      <Button
        size="icon"
        variant="ghost"
        className="task-check"
        aria-label={
          task.status === "completed"
            ? tx("Reopen task", "إعادة فتح المهمة")
            : tx("Complete task", "إكمال المهمة")
        }
        onClick={onToggle}
      >
        {task.status === "completed" ? <Check /> : <Circle />}
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate">{task.title}</p>
        <small>
          {tx("Task", "مهمة")}
          {task.priority === "urgent" || task.priority === "high"
            ? ` · ${tx("High priority", "أولوية عالية")}`
            : ""}
        </small>
      </div>
      <Star
        className={`priority-mark ${task.priority === "urgent" || task.priority === "high" ? "priority-high" : ""}`}
      />
    </div>
  );
}
