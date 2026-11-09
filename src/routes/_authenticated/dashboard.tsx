import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  PawPrint,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { expandEvents, useRows, useUpdate } from "@/lib/data";
import { useTx } from "@/lib/tx";
import type { Row } from "@/lib/data";

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
  const pendingToday = todaysTasks.filter((task) => task.status !== "completed");
  const completedToday = todaysTasks.filter((task) => task.status === "completed");
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
  const upcomingTasks = tasks
    .filter((task) => task.status !== "completed" && task.due_at && new Date(task.due_at) > end)
    .slice(0, 3);
  const dayTitle = today.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card p-5 ring-1 ring-border sm:p-8">
        <div className="pointer-events-none absolute -end-8 -top-14 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">{dayTitle}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{greeting}</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {tx("Here's what's on your schedule today.", "إليك ما ينتظرك في جدول اليوم.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/tasks">
                <ListTodo />
                {tx("Open tasks", "فتح المهام")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/calendar">
                <CalendarDays />
                {tx("Calendar", "التقويم")}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Summary
          title={tx("Tasks due today", "مهام مستحقة اليوم")}
          value={`${pendingToday.length}/${todaysTasks.length}`}
          icon={<ListTodo />}
          tone="bg-peach text-orange-700 dark:text-orange-200"
        />
        <Summary
          title={tx("Events today", "فعاليات اليوم")}
          value={todaysEvents.length}
          icon={<CalendarDays />}
          tone="bg-sky text-sky-ink"
        />
        <Summary
          title={tx("Reminders today", "تذكيرات اليوم")}
          value={todayReminders.length}
          icon={<Bell />}
          tone="bg-lavender text-violet-700 dark:text-violet-200"
        />
        <Summary
          title={tx("Day progress", "إنجاز اليوم")}
          value={`${completion}%`}
          icon={<CheckCircle2 />}
          tone="bg-sage-soft text-primary-deep"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.82fr)]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                {tx("Today's schedule", "جدول اليوم")}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {tx(
                  "Your saved events, appointments, and tasks for today.",
                  "فعالياتك ومواعيدك ومهامك المحفوظة لهذا اليوم.",
                )}
              </p>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link to="/calendar">
                {tx("Calendar", "التقويم")}
                <ArrowUpRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventsLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {tx("Loading your schedule…", "جارٍ تحميل جدولك…")}
                </p>
              ) : todaysEvents.length === 0 && todaysTasks.length === 0 ? (
                <Empty
                  icon={<CalendarDays />}
                  title={tx("A clear day", "يوم هادئ")}
                  detail={tx(
                    "No events or due tasks are saved for today.",
                    "لا توجد فعاليات أو مهام مستحقة محفوظة لهذا اليوم.",
                  )}
                />
              ) : (
                <>
                  {todaysEvents.map((event) => (
                    <div
                      key={`${event.id}-${event.occ.toISOString()}`}
                      className="flex items-start gap-3 rounded-xl border p-3"
                    >
                      <div className="min-w-16 pt-0.5 text-xs font-semibold text-primary">
                        {fmtTime(event.occ)}
                      </div>
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{event.title}</p>
                        <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          <span>
                            {fmtTime(event.occ)}–{fmtTime(event.occEnd)}
                          </span>
                          {event.location && <span>{event.location}</span>}
                        </p>
                      </div>
                      <span className="hidden rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground sm:inline-flex">
                        {event.kind}
                      </span>
                    </div>
                  ))}
                  {todaysTasks.map((task) => (
                    <DayTask
                      key={task.id}
                      task={task}
                      onToggle={() =>
                        updateTask.mutate({
                          id: task.id,
                          values: {
                            status: task.status === "completed" ? "todo" : "completed",
                            completed_at:
                              task.status === "completed" ? null : new Date().toISOString(),
                          },
                        })
                      }
                      tx={tx}
                    />
                  ))}
                </>
              )}
            </div>
            {upcomingTasks.length > 0 && (
              <div className="mt-5 border-t pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">{tx("Coming up", "المهام القادمة")}</p>
                  <Button asChild variant="link" size="sm">
                    <Link to="/tasks">{tx("All tasks", "كل المهام")}</Link>
                  </Button>
                </div>
                <div className="space-y-2">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <span className="truncate text-sm">{task.title}</span>
                      {task.due_at && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {fmtDate(task.due_at)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tasksLoading && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {tx("Loading tasks…", "جارٍ تحميل المهام…")}
              </p>
            )}
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Link
            to="/zoo"
            className="group block overflow-hidden rounded-2xl border bg-gradient-to-br from-sage-soft/80 via-card to-lavender/60 p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/80 text-emerald-700 shadow-sm dark:bg-emerald-950/50 dark:text-emerald-200">
                <PawPrint className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{tx("Your living zoo", "حديقتك الحيّة")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tx(
                    "Finish tasks, open gates, meet new companions.",
                    "أنجز مهامك وافتح البوابات وتعرّف على رفاق جدد.",
                  )}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
          </Link>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                {tx("Reminders today", "تذكيرات اليوم")}
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/reminders">
                  {tx("See all", "عرض الكل")}
                  <ArrowUpRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayReminders.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  {tx("No active reminders for today.", "لا توجد تذكيرات نشطة لهذا اليوم.")}
                </p>
              ) : (
                todayReminders.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg border p-2.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 rounded-full"
                      aria-label={tx("Complete reminder", "إكمال التذكير")}
                      onClick={() => updateReminder.mutate({ id: item.id, values: { done: true } })}
                    >
                      <Circle className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{fmtTime(item.remind_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-primary" />
                {tx("Next milestone", "الإنجاز القادم")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nearest ? (
                <div
                  className="rounded-xl border p-4"
                  style={{ borderInlineStartColor: nearest.color, borderInlineStartWidth: 4 }}
                >
                  <p className="font-semibold">{nearest.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {fmtDate(nearest.target_at, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {Math.max(
                      0,
                      Math.ceil((new Date(nearest.target_at).getTime() - Date.now()) / 86400000),
                    ).toLocaleString(locale)}{" "}
                    {tx("days left", "يوم متبقٍ")}
                  </p>
                  <Button asChild variant="link" size="sm" className="mt-2 px-0">
                    <Link to="/countdown">
                      {tx("All countdowns", "كل المواعيد")}
                      <ArrowUpRight />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="py-2">
                  <p className="text-sm text-muted-foreground">
                    {tx("No upcoming countdown saved.", "لا يوجد عدّ تنازلي قادم محفوظ.")}
                  </p>
                  <Button asChild variant="link" className="mt-1 px-0">
                    <Link to="/countdown">
                      {tx("Add an important date", "أضف تاريخًا مهمًا")}
                      <ArrowUpRight />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
function Summary({
  title,
  value,
  icon,
  tone = "bg-primary/10 text-primary",
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <span className={`rounded-xl p-2.5 ${tone}`}>{icon}</span>
      </CardContent>
    </Card>
  );
}
function Empty({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed py-10 text-center">
      <span className="mx-auto flex h-9 w-9 items-center justify-center text-muted-foreground/60">
        {icon}
      </span>
      <p className="mt-2 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
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
    <div className="flex items-center gap-3 rounded-xl border p-3">
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0 rounded-full"
        aria-label={
          task.status === "completed"
            ? tx("Reopen task", "إعادة فتح المهمة")
            : tx("Complete task", "إكمال المهمة")
        }
        onClick={onToggle}
      >
        {task.status === "completed" ? (
          <CheckCircle2 className="h-4 w-4 text-primary" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </Button>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}
        >
          {task.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {tx("Task", "مهمة")}
          {task.priority === "urgent" || task.priority === "high"
            ? ` · ${tx("High priority", "أولوية عالية")}`
            : ""}
        </p>
      </div>
      <ListTodo className="h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
  );
}
