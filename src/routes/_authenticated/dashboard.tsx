import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  PawPrint,
  Play,
  Sparkles,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { expandEvents, useRows, useUpdate } from "@/lib/data";
import { useTx } from "@/lib/tx";
import { useProfile } from "@/lib/data";
import type { Row } from "@/lib/data";
import { Nemo } from "@/components/nemo";
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
    <div className="nemo-dashboard space-y-5">
      <div className="dashboard-heading flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="dashboard-kicker">{dayTitle}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {greeting}
            {helloName} <span className="greeting-wave">👋</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tx("Let's make today productive!", "خلّينا نخلي يومك مليان إنجاز!")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="dashboard-date">
            <CalendarDays className="h-4 w-4" />
            {today.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <Button
            asChild
            variant="outline"
            size="icon"
            className="dashboard-icon-button"
            aria-label={tx("Reminders", "التذكيرات")}
          >
            <Link to="/reminders">
              <Bell className="h-4 w-4" />
              {todayReminders.length > 0 && <span className="notification-dot" />}
            </Link>
          </Button>
        </div>
      </div>

      <section className="ocean-hero">
        <div className="hero-copy">
          <span className="hero-chip">
            <Sparkles className="h-3.5 w-3.5" />
            {tx("YOUR STUDY SPACE", "مساحتك الدراسية")}
          </span>
          <h2>
            {tx(
              "One calm session can change your whole day.",
              "جلسة هادئة واحدة ممكن تغيّر يومك كله.",
            )}
          </h2>
          <p>
            {tx(
              "Pick a task, take a breath, and let Nemo keep you on track.",
              "اختر مهمة، خذ نفسًا، ودع نيمو يساعدك على الاستمرار.",
            )}
          </p>
          <Link to="/focus" className="hero-start">
            <span>
              <Play className="h-4 w-4 fill-current" />
            </span>
            {tx("Start a focus session", "ابدأ جلسة تركيز")}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-orb hero-orb-one" />
          <div className="hero-orb hero-orb-two" />
          <div className="hero-bubble bubble-one" />
          <div className="hero-bubble bubble-two" />
          <div className="hero-bubble bubble-three" />
          <div className="hero-glow" />
          <Nemo mood="studying" float className="hero-nemo" />
          <div className="hero-books">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="hero-counter">
          <Timer className="h-4 w-4" />
          <span>50:00</span>
          <small>{tx("focus timer", "مؤقت التركيز")}</small>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="dash-panel tasks-panel">
          <div className="panel-heading">
            <div>
              <h2>{tx("Today's tasks", "مهام اليوم")}</h2>
              <p>
                {completedToday.length} {tx("completed", "مكتملة")} · {openTasks.length}{" "}
                {tx("in progress", "قيد العمل")}
              </p>
            </div>
            <Button asChild size="sm" className="add-task-button">
              <Link to="/tasks">
                <span>+</span>
                {tx("All tasks", "كل المهام")}
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
              <CalendarDays className="h-4 w-4" />
              {tx("Today's schedule", "جدول اليوم")}
              <span className="footer-count">{todaysEvents.length}</span>
              <ArrowUpRight className="ms-auto h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="dash-panel status-panel">
          <div className="panel-heading">
            <div>
              <h2>{tx("Your day", "يومك")}</h2>
              <p>{tx("A little progress goes a long way.", "كل إنجاز صغير يصنع فرقًا.")}</p>
            </div>
            <Target className="panel-heading-icon" />
          </div>
          <div
            className="productivity-ring"
            style={{ "--progress": `${completion}%` } as React.CSSProperties}
          >
            <div>
              <strong>{completion}%</strong>
              <span>{tx("done today", "إنجاز اليوم")}</span>
            </div>
          </div>
          <div className="status-bars">
            <StatusRow
              icon={<CheckCircle2 />}
              label={tx("Tasks", "المهام")}
              value={todaysTasks.length ? `${completedToday.length}/${todaysTasks.length}` : "0"}
              percent={completion}
              tone="violet"
            />
            <StatusRow
              icon={<CalendarDays />}
              label={tx("Events", "الفعاليات")}
              value={todaysEvents.length.toLocaleString(locale)}
              percent={Math.min(todaysEvents.length * 22, 100)}
              tone="cyan"
            />
            <StatusRow
              icon={<Bell />}
              label={tx("Reminders", "التذكيرات")}
              value={todayReminders.length.toLocaleString(locale)}
              percent={Math.min(todayReminders.length * 24, 100)}
              tone="pink"
            />
          </div>
        </section>

        <section className="dash-panel reminders-panel">
          <div className="panel-heading">
            <div>
              <h2>{tx("Up next", "التالي")}</h2>
              <p>{tx("Your next reminders", "تذكيراتك القادمة")}</p>
            </div>
            <Link className="panel-link" to="/reminders">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          {todayReminders.length === 0 ? (
            <div className="compact-empty">
              <Bell />
              <span>{tx("No active reminders for today.", "ما عندك تذكيرات نشطة اليوم.")}</span>
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
                  <Zap className="h-4 w-4 text-amber-300" />
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
              <ArrowUpRight className="ms-auto h-4 w-4" />
            </Link>
          )}
        </section>
      </div>

      <div className="quick-links-grid">
        <QuickLink
          to="/courses"
          icon={<BookOpen />}
          title={tx("My courses", "موادي")}
          detail={tx("Course workspaces", "مساحات المواد")}
          tone="violet"
        />
        <QuickLink
          to="/calendar"
          icon={<CalendarDays />}
          title={tx("Calendar", "التقويم")}
          detail={tx("Lectures & deadlines", "محاضرات ومواعيد")}
          tone="cyan"
        />
        <QuickLink
          to="/zoo"
          icon={<PawPrint />}
          title={tx("My zoo", "حديقتي")}
          detail={tx("Meet your companions", "تعرّف على رفاقك")}
          tone="coral"
        />
        <QuickLink
          to="/stats"
          icon={<Sparkles />}
          title={tx("Statistics", "الإحصائيات")}
          detail={tx("See your progress", "تابع تقدمك")}
          tone="pink"
        />
      </div>
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
function QuickLink({
  to,
  icon,
  title,
  detail,
  tone,
}: {
  to: "/courses" | "/calendar" | "/zoo" | "/stats";
  icon: React.ReactNode;
  title: string;
  detail: string;
  tone: string;
}) {
  return (
    <Link to={to} className="quick-link">
      <span className={`quick-link-icon ${tone}`}>{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <ArrowUpRight className="ms-auto h-4 w-4 quick-arrow" />
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
      <span
        className={`priority-mark ${task.priority === "urgent" || task.priority === "high" ? "priority-high" : ""}`}
      >
        <Sparkles />
      </span>
    </div>
  );
}
