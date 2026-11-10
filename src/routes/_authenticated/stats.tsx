import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  NotebookPen,
  RotateCcw,
  Target,
} from "lucide-react";
import { Card, PageHeader, Stat } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useTx } from "@/lib/tx";

import "@/page-themes/stats.css";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({
    meta: [
      { title: "Statistics — NEMO" },
      { name: "description", content: "Study statistics from your saved NEMO records." },
      { property: "og:title", content: "Statistics — NEMO" },
      { property: "og:description", content: "Study statistics from your saved NEMO records." },
    ],
  }),
  component: StatsPage,
});

type Course = Database["public"]["Tables"]["courses"]["Row"];
type Note = Database["public"]["Tables"]["course_notes"]["Row"];
type CourseFile = Database["public"]["Tables"]["course_files"]["Row"];
type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];
type FocusSession = Database["public"]["Tables"]["focus_sessions"]["Row"];
type StatsData = {
  courses: Course[];
  notes: Note[];
  files: CourseFile[];
  cards: Flashcard[];
  tasks: Task[];
  sessions: FocusSession[];
};

function StatsPage() {
  const { tx, lang, num, fmtDate } = useTx();
  const statsQuery = useQuery({
    queryKey: ["study-stats", "actual-records"],
    queryFn: async (): Promise<StatsData> => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user)
        throw new Error(
          tx("Please sign in to load your statistics.", "سجّل الدخول لعرض إحصاءاتك."),
        );
      const uid = auth.user.id;
      const [courses, notes, files, cards, tasks, sessions] = await Promise.all([
        supabase.from("courses").select("*").eq("user_id", uid),
        supabase.from("course_notes").select("*").eq("user_id", uid),
        supabase.from("course_files").select("*").eq("user_id", uid),
        supabase.from("flashcards").select("*").eq("user_id", uid),
        supabase.from("tasks").select("*").eq("user_id", uid),
        supabase.from("focus_sessions").select("*").eq("user_id", uid),
      ]);
      const failure = [courses, notes, files, cards, tasks, sessions].find(
        (result) => result.error,
      )?.error;
      if (failure) throw failure;
      return {
        courses: courses.data ?? [],
        notes: notes.data ?? [],
        files: files.data ?? [],
        cards: cards.data ?? [],
        tasks: tasks.data ?? [],
        sessions: sessions.data ?? [],
      };
    },
  });
  const data = statsQuery.data;
  const sessions = data?.sessions ?? [];
  const tasks = data?.tasks ?? [];
  const cards = data?.cards ?? [];
  const completedTasks = tasks.filter((task) => task.completed_at !== null).length;
  const totalFocusMinutes = sessions.reduce(
    (sum, session) => sum + Math.max(0, session.actual_minutes || 0),
    0,
  );
  const reviewedRepetitions = cards.reduce((sum, card) => sum + Math.max(0, card.reps || 0), 0);
  const dueCards = cards.filter((card) => new Date(card.due_at).getTime() <= Date.now()).length;
  const validSessions = sessions.filter((session) =>
    Number.isFinite(new Date(session.ended_at).getTime()),
  );
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const minutes = validSessions
      .filter((session) => {
        const ended = new Date(session.ended_at);
        return ended >= date && ended < next;
      })
      .reduce((sum, session) => sum + Math.max(0, session.actual_minutes || 0), 0);
    return { date, minutes };
  });
  const peakMinutes = Math.max(1, ...lastSevenDays.map((day) => day.minutes));
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime())
    .slice(0, 6);

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="nemo-sea-page nemo-sea-page--stats mx-auto w-full max-w-6xl px-3 pb-10 sm:px-6"
    >
      <PageHeader
        title={tx("Study statistics", "إحصاءات الدراسة")}
        sub={tx(
          "A snapshot of records saved to your account—not sample or estimated activity.",
          "ملخص السجلات المحفوظة في حسابك، دون نشاط تجريبي أو تقديري.",
        )}
      />
      {statsQuery.isLoading ? (
        <p className="py-12 text-center text-muted-foreground">
          {tx("Loading saved records…", "جارٍ تحميل السجلات المحفوظة…")}
        </p>
      ) : statsQuery.error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive"
        >
          <h2 className="font-semibold">
            {tx("Statistics could not be loaded.", "تعذر تحميل الإحصاءات.")}
          </h2>
          <p className="mt-1">
            {statsQuery.error instanceof Error
              ? statsQuery.error.message
              : tx(
                  "Check your Supabase connection and table permissions.",
                  "تحقق من اتصال Supabase وصلاحيات الجداول.",
                )}
          </p>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Stat
              label={tx("Courses", "المواد")}
              value={num(data.courses.length)}
              icon={<BookOpen />}
            />
            <Stat
              label={tx("Saved notes", "الملاحظات المحفوظة")}
              value={num(data.notes.length)}
              icon={<NotebookPen />}
              tone="bg-sage-soft"
            />
            <Stat
              label={tx("File records", "سجلات الملفات")}
              value={num(data.files.length)}
              icon={<FileText />}
              tone="bg-sky-soft"
            />
            <Stat
              label={tx("Flashcards", "البطاقات التعليمية")}
              value={num(cards.length)}
              icon={<Layers3 />}
              tone="bg-lavender-soft"
            />
            <Stat
              label={tx("Review repetitions", "مرات مراجعة البطاقات")}
              value={num(reviewedRepetitions)}
              icon={<RotateCcw />}
              tone="bg-peach-soft"
            />
            <Stat
              label={tx("Focus sessions", "جلسات التركيز")}
              value={num(sessions.length)}
              icon={<Target />}
              tone="bg-sage-soft"
            />
            <Stat
              label={tx("Focus time (minutes)", "وقت التركيز (دقيقة)")}
              value={num(totalFocusMinutes)}
              icon={<Clock3 />}
              tone="bg-sky-soft"
            />
            <Stat
              label={tx("Completed tasks", "المهام المكتملة")}
              value={num(completedTasks)}
              icon={<CheckCircle2 />}
              tone="bg-lavender-soft"
            />
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
            <Card title={tx("Focus minutes · last 7 days", "دقائق التركيز · آخر ٧ أيام")}>
              {validSessions.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {tx(
                    "No saved focus sessions yet. Complete a focus session to see it here.",
                    "لا توجد جلسات تركيز محفوظة بعد. أكمل جلسة تركيز لتظهر هنا.",
                  )}
                </p>
              ) : (
                <div className="grid h-52 grid-cols-7 items-end gap-2 pt-4 sm:gap-4">
                  {lastSevenDays.map(({ date, minutes }) => (
                    <div
                      key={date.toISOString()}
                      className="flex h-full min-w-0 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-[10px] text-muted-foreground">{num(minutes)}</span>
                      <div className="flex h-full w-full items-end rounded-md bg-muted/50">
                        <div
                          title={`${num(minutes)} ${tx("minutes", "دقيقة")}`}
                          className="w-full rounded-md bg-primary/75 transition-all"
                          style={{
                            height: `${minutes > 0 ? Math.max(4, (minutes / peakMinutes) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-center text-[10px] text-muted-foreground">
                        {date.toLocaleDateString(lang === "ar" ? "ar" : "en", { weekday: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {tx(
                  "Totals are calculated from actual_minutes and ended_at in your saved focus_sessions rows.",
                  "تُحسب المجاميع من actual_minutes وended_at في سجلات focus_sessions المحفوظة.",
                )}
              </p>
            </Card>
            <Card title={tx("Tasks and card reviews", "المهام ومراجعات البطاقات")}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">
                    {tx("Task completion", "إنجاز المهام")}
                  </div>
                  <div className="mt-1 text-xl font-bold">
                    {num(completedTasks)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / {num(tasks.length)} {tx("tasks with records", "مهمة مسجلة")}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${tasks.length ? (completedTasks / tasks.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">
                    {tx("Cards due now", "بطاقات مستحقة الآن")}
                  </div>
                  <div className="mt-1 text-xl font-bold">
                    {num(dueCards)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / {num(cards.length)} {tx("cards", "بطاقة")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {tx(
                      "Based on each saved card’s due_at timestamp.",
                      "استنادًا إلى وقت due_at المحفوظ لكل بطاقة.",
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>
          <Card className="mt-5" title={tx("Recent focus sessions", "جلسات التركيز الأخيرة")}>
            {recentSessions.length === 0 ? (
              <p className="py-5 text-sm text-muted-foreground">
                {tx(
                  "No focus-session rows are saved yet.",
                  "لا توجد سجلات جلسات تركيز محفوظة بعد.",
                )}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-start text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="px-2 py-2 text-start font-medium">
                        {tx("Ended", "الانتهاء")}
                      </th>
                      <th className="px-2 py-2 text-start font-medium">{tx("Mode", "النمط")}</th>
                      <th className="px-2 py-2 text-start font-medium">
                        {tx("Actual minutes", "الدقائق الفعلية")}
                      </th>
                      <th className="px-2 py-2 text-start font-medium">{tx("Status", "الحالة")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.map((session) => (
                      <tr key={session.id} className="border-b last:border-0">
                        <td className="px-2 py-3">
                          {fmtDate(session.ended_at, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-2 py-3">{session.mode}</td>
                        <td className="px-2 py-3">{num(session.actual_minutes)}</td>
                        <td className="px-2 py-3">
                          {session.completed ? tx("Completed", "مكتملة") : tx("Recorded", "مسجلة")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {tx(
              "Stats reflect only records currently returned by your Supabase account policies. Empty values mean no matching saved rows.",
              "تعكس الإحصاءات السجلات التي تسمح سياسات Supabase لحسابك بقراءتها فقط. القيمة الفارغة تعني عدم وجود سجلات محفوظة مطابقة.",
            )}
          </p>
        </>
      ) : null}
    </main>
  );
}
