import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Target,
} from "lucide-react";
import { Card, Chip, PageHeader } from "@/components/kit";
import { Nemo } from "@/components/nemo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTx } from "@/lib/tx";
import { ANIMALS } from "@/lib/catalog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import "@/page-themes/focus.css";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({
    meta: [
      { title: "Focus Room — NEMO" },
      { name: "description", content: "A calm, recorded focus timer." },
      { property: "og:title", content: "Focus Room — NEMO" },
      { property: "og:description", content: "A calm, recorded focus timer." },
    ],
  }),
  component: FocusPage,
});

type FocusMode = "pomodoro" | "deep" | "custom";
const PRESETS = [25, 50];

function FocusPage() {
  const { tx, t, num, dir } = useTx();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<FocusMode>("pomodoro");
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState("40");
  const [courseId, setCourseId] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [segmentStartedAtMs, setSegmentStartedAtMs] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [clockNow, setClockNow] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [breakUntil, setBreakUntil] = useState<number | null>(null);
  const [sessionTodo, setSessionTodo] = useState<string[]>([]);
  const [todoInput, setTodoInput] = useState("");

  const coursesQuery = useQuery({
    queryKey: ["focus-courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,name,color")
        .eq("user_id", user!.id)
        .eq("archived", false)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
  const historyQuery = useQuery({
    queryKey: ["focus-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from("focus_sessions")
        .select(
          "id,actual_minutes,completed,course_id,ended_at,mode,pearls,planned_minutes,started_at",
        )
        .eq("user_id", user!.id)
        .gte("started_at", since.toISOString())
        .order("started_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  const activeMs =
    elapsedMs + (isRunning && segmentStartedAtMs ? Math.max(0, clockNow - segmentStartedAtMs) : 0);
  const activeSeconds = Math.floor(activeMs / 1000);
  const targetSeconds = plannedMinutes * 60;
  const remainingSeconds = Math.max(0, targetSeconds - activeSeconds);
  const canComplete = !!startedAtMs && activeSeconds >= targetSeconds;
  const clockLabel = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
  const progress = Math.min(1, activeSeconds / Math.max(1, targetSeconds));
  const breakSeconds = breakUntil ? Math.max(0, Math.ceil((breakUntil - clockNow) / 1000)) : 0;
  const history = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);
  const todaySessions = history.filter(
    (session) => new Date(session.started_at).toDateString() === new Date().toDateString(),
  );
  const todayMinutes = todaySessions.reduce((sum, session) => sum + session.actual_minutes, 0);
  const todayPearls = todaySessions.reduce((sum, session) => sum + session.pearls, 0);
  const recentSessions = useMemo(() => history.slice(0, 5), [history]);

  function resetTimer() {
    setIsRunning(false);
    setStartedAtMs(null);
    setSegmentStartedAtMs(null);
    setElapsedMs(0);
    setClockNow(Date.now());
    setNotice("");
  }

  function startTimer() {
    const now = Date.now();
    setStartedAtMs(now);
    setSegmentStartedAtMs(now);
    setElapsedMs(0);
    setIsRunning(true);
    setNotice("");
  }

  function pauseTimer() {
    if (segmentStartedAtMs)
      setElapsedMs((value) => value + Math.max(0, Date.now() - segmentStartedAtMs));
    setSegmentStartedAtMs(null);
    setIsRunning(false);
  }

  async function saveSession(completed: boolean) {
    if (!user || startedAtMs === null) return;
    const now = Date.now();
    const elapsed =
      elapsedMs + (isRunning && segmentStartedAtMs ? Math.max(0, now - segmentStartedAtMs) : 0);
    const start = new Date(startedAtMs);
    const end = new Date(now);
    const wallSeconds = Math.floor((now - startedAtMs) / 1000);
    const measuredSeconds = Math.floor(elapsed / 1000);
    const validClock =
      Number.isFinite(start.getTime()) &&
      Number.isFinite(end.getTime()) &&
      start.getTime() <= now &&
      measuredSeconds > 0 &&
      measuredSeconds <= wallSeconds + 2;
    if (!validClock) {
      setNotice(
        tx(
          "The timer could not verify a valid elapsed time. Nothing was saved.",
          "تعذر التحقق من مدة صالحة للمؤقت؛ لم تُحفظ أي جلسة.",
        ),
      );
      return;
    }
    if (completed && measuredSeconds < plannedMinutes * 60) {
      setNotice(
        tx(
          "Finish the full timer before marking this session complete.",
          "أكمل مدة المؤقت كاملة قبل تسجيل الجلسة كمكتملة.",
        ),
      );
      return;
    }
    setSaving(true);
    setNotice("");
    const { error } = await supabase.from("focus_sessions").insert({
      user_id: user.id,
      mode,
      planned_minutes: plannedMinutes,
      actual_minutes: Math.max(1, Math.ceil(measuredSeconds / 60)),
      completed,
      course_id: courseId || null,
      task_id: null,
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
    });
    setSaving(false);
    if (error) {
      setNotice(
        tx("Could not save this session. Please try again.", "تعذر حفظ الجلسة. حاول مرة أخرى."),
      );
      return;
    }
    if (completed) {
      const { data: owned } = await supabase
        .from("user_animals")
        .select("animal_key")
        .eq("user_id", user.id);
      const ownedKeys = new Set((owned ?? []).map((animal) => animal.animal_key));
      const nextAnimal = ANIMALS.find((animal) => !ownedKeys.has(animal.key));
      if (nextAnimal)
        await supabase.from("user_animals").insert({
          animal_key: nextAnimal.key,
          nickname: null,
          discovered_at: new Date().toISOString(),
          user_id: user.id,
        });
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["focus-history", user.id] }),
      queryClient.invalidateQueries({ queryKey: ["focus_sessions"] }),
      queryClient.invalidateQueries({ queryKey: ["user_animals"] }),
    ]);
    setNotice(
      completed
        ? tx("Session recorded. Well focused!", "تم تسجيل الجلسة. أحسنت التركيز!")
        : tx(
            "Session stopped and its verified time was recorded.",
            "أُوقفت الجلسة وسُجل وقتها بعد التحقق.",
          ),
    );
    setIsRunning(false);
    setStartedAtMs(null);
    setSegmentStartedAtMs(null);
    setElapsedMs(0);
  }

  function chooseMode(next: FocusMode) {
    if (startedAtMs !== null) return;
    setMode(next);
    if (next === "pomodoro") setPlannedMinutes(25);
    if (next === "deep") setPlannedMinutes(50);
    if (next === "custom")
      setPlannedMinutes(Math.min(180, Math.max(5, Number(customMinutes) || 40)));
  }

  const modeOptions: { key: FocusMode; label: string }[] = [
    { key: "pomodoro", label: t("pomodoro") },
    { key: "deep", label: t("deep") },
    { key: "custom", label: t("custom") },
  ];

  return (
    <div dir={dir} className="nemo-sea-page nemo-sea-page--focus mx-auto w-full max-w-6xl pb-10">
      <PageHeader
        title={tx("Focus room", "غرفة التركيز")}
        sub={tx(
          "One calm session at a time. Your saved minutes stay tied to your studies.",
          "جلسة هادئة واحدة في كل مرة، ودقائقك المسجلة مرتبطة بدراستك.",
        )}
        action={
          <Link
            to="/stats"
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            {tx("Statistics", "الإحصاءات")} <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
        <Card className="focus-timer-panel relative overflow-hidden bg-gradient-to-br from-card via-card to-sage-soft/60 p-5 sm:p-8">
          <div className="absolute -end-8 -top-10 h-44 w-44 rounded-full bg-sage-soft/70 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div>
              <Chip className="bg-sage-soft">
                {isRunning
                  ? tx("In session", "جلسة جارية")
                  : startedAtMs
                    ? tx("Paused", "متوقفة مؤقتًا")
                    : tx("Ready when you are", "ابدأ عندما تكون مستعدًا")}
              </Chip>
              <h2 className="mt-3 text-lg font-semibold">
                {tx("Make room for one good thing", "امنح نفسك مساحة لإنجاز شيء واحد")}
              </h2>
            </div>
            <Nemo
              mood={canComplete ? "celebrating" : isRunning ? "studying" : "default"}
              className="h-16 w-16 sm:h-20 sm:w-20"
              float={isRunning}
            />
          </div>

          <div className="relative mx-auto my-6 grid max-w-sm place-items-center sm:my-8">
            <svg
              viewBox="0 0 220 220"
              className="h-56 w-56 -rotate-90 sm:h-64 sm:w-64"
              aria-hidden="true"
            >
              <circle
                cx="110"
                cy="110"
                r="96"
                fill="none"
                stroke="currentColor"
                strokeOpacity=".09"
                strokeWidth="8"
              />
              <circle
                cx="110"
                cy="110"
                r="96"
                fill="none"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 96}
                strokeDashoffset={2 * Math.PI * 96 * (1 - progress)}
                style={{ transition: "stroke-dashoffset 700ms ease" }}
              />
            </svg>
            <div className="absolute text-center tabular-nums">
              <div className="text-5xl font-semibold tracking-tight sm:text-6xl" aria-live="polite">
                {clockLabel}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {`${num(Math.floor(activeSeconds / 60))}:${String(activeSeconds % 60).padStart(2, "0")}`}{" "}
                {tx("focused", "من التركيز")}
              </div>
            </div>
          </div>

          <div className="relative flex flex-wrap justify-center gap-2">
            {!startedAtMs ? (
              <Button onClick={startTimer} className="min-w-36 gap-2 rounded-full px-6">
                <Play className="h-4 w-4" />
                {tx("Start focus", "ابدأ التركيز")}
              </Button>
            ) : (
              <>
                <Button
                  onClick={
                    isRunning
                      ? pauseTimer
                      : () => {
                          setSegmentStartedAtMs(Date.now());
                          setIsRunning(true);
                        }
                  }
                  variant="outline"
                  className="min-w-32 gap-2 rounded-full"
                >
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isRunning ? t("pause") : t("resume")}
                </Button>
                <Button
                  onClick={() => void saveSession(false)}
                  variant="outline"
                  disabled={saving || activeSeconds < 1}
                  className="gap-2 rounded-full"
                >
                  <Square className="h-3.5 w-3.5" />
                  {tx("Stop & save", "أوقف واحفظ")}
                </Button>
                <Button
                  onClick={() => void saveSession(true)}
                  disabled={saving || !canComplete}
                  className="gap-2 rounded-full"
                >
                  <Check className="h-4 w-4" />
                  {tx("Complete", "إكمال")}
                </Button>
              </>
            )}
            {startedAtMs !== null && !isRunning && (
              <Button
                aria-label={tx("Discard timer", "إعادة المؤقت")}
                onClick={resetTimer}
                variant="ghost"
                className="rounded-full"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
          {notice && (
            <p role="status" className="relative mt-4 text-center text-sm text-muted-foreground">
              {notice}
            </p>
          )}
        </Card>

        <div className="focus-side grid content-start gap-5">
          <Card title={tx("Session setup", "إعداد الجلسة")}>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={tx("Focus mode", "وضع التركيز")}
            >
              {modeOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  disabled={startedAtMs !== null}
                  onClick={() => chooseMode(option.key)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${mode === option.key ? "border-primary bg-sage-soft font-semibold text-primary-deep" : "hover:bg-muted"} disabled:opacity-50`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {mode === "custom" && (
              <label className="mt-4 block text-xs text-muted-foreground">
                {tx("Minutes (5–180)", "الدقائق (٥–١٨٠)")}
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={customMinutes}
                  disabled={startedAtMs !== null}
                  onChange={(event) => {
                    setCustomMinutes(event.target.value);
                    const n = Number(event.target.value);
                    if (n >= 5 && n <= 180) setPlannedMinutes(n);
                  }}
                  onBlur={() => {
                    const n = Math.min(180, Math.max(5, Number(customMinutes) || 40));
                    setCustomMinutes(String(n));
                    setPlannedMinutes(n);
                  }}
                  className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm"
                />
              </label>
            )}
            <div className="mt-4 flex gap-2">
              {PRESETS.map((n) => (
                <button
                  type="button"
                  key={n}
                  disabled={startedAtMs !== null || mode === "custom"}
                  onClick={() => setPlannedMinutes(n)}
                  className={`rounded-lg border px-3 py-2 text-sm ${plannedMinutes === n ? "border-primary bg-sage-soft font-medium" : "hover:bg-muted"} disabled:opacity-50`}
                >
                  {num(n)} {t("minutes")}
                </button>
              ))}
            </div>
            <label className="mt-5 block text-xs text-muted-foreground">
              <span className="mb-1.5 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {tx("Link to a course (optional)", "اربطها بمادة (اختياري)")}
              </span>
              <select
                value={courseId}
                disabled={startedAtMs !== null}
                onChange={(event) => setCourseId(event.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground"
              >
                <option value="">{tx("No course", "بدون مادة")}</option>
                {(coursesQuery.data ?? []).map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
              <Target className="mt-0.5 h-4 w-4 shrink-0" />
              {tx(
                "Only time measured by this timer is submitted. The database also caps recorded minutes to the start/end timestamps.",
                "لا يُرسل إلا الوقت الذي يقيسه هذا المؤقت، كما تحد قاعدة البيانات الدقائق المسجلة بوقتَي البداية والنهاية.",
              )}
            </p>
          </Card>

          <Card title={tx("Your session side panel", "لوحتك خلال الجلسة")}>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-sage-soft/60 p-3">
                <div className="text-xl font-bold tabular-nums">{clockLabel}</div>
                <div className="text-[11px] text-muted-foreground">
                  {tx("until focus ends", "حتى نهاية التركيز")}
                </div>
              </div>
              <div className="rounded-xl bg-lavender/50 p-3">
                <div className="text-xl font-bold tabular-nums">
                  {breakUntil
                    ? `${Math.floor(breakSeconds / 60)}:${String(breakSeconds % 60).padStart(2, "0")}`
                    : "—"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {tx("next break", "البريك القادم")}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBreakUntil(Date.now() + 5 * 60 * 1000)}
              >
                <Clock3 className="h-3.5 w-3.5" />
                {tx("Add 5-min break", "أضف بريك ٥ د")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setBreakUntil(null)}>
                {tx("Skip break", "تخطي البريك")}
              </Button>
            </div>
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                <Check className="h-3.5 w-3.5 text-primary" />
                {tx("Session to-do", "مهام الجلسة")}
              </p>
              <div className="flex gap-2">
                <input
                  value={todoInput}
                  onChange={(event) => setTodoInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && todoInput.trim()) {
                      setSessionTodo((items) => [...items, todoInput.trim()]);
                      setTodoInput("");
                    }
                  }}
                  placeholder={tx("One tiny thing to finish…", "شيء صغير أنجزه الآن…")}
                  className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-2 text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    if (todoInput.trim()) {
                      setSessionTodo((items) => [...items, todoInput.trim()]);
                      setTodoInput("");
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 grid gap-1.5">
                {sessionTodo.map((item, index) => (
                  <button
                    key={`${item}-${index}`}
                    onClick={() =>
                      setSessionTodo((items) => items.filter((_, itemIndex) => itemIndex !== index))
                    }
                    className="flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5 text-start text-xs hover:line-through"
                  >
                    <span className="h-3 w-3 rounded border" />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card title={tx("Today, from saved sessions", "اليوم، من الجلسات المسجلة")}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-muted/50 px-2 py-3">
                <div className="text-xl font-bold tabular-nums">{num(todayMinutes)}</div>
                <div className="text-[11px] text-muted-foreground">{t("minutes")}</div>
              </div>
              <div className="rounded-xl bg-muted/50 px-2 py-3">
                <div className="text-xl font-bold tabular-nums">{num(todaySessions.length)}</div>
                <div className="text-[11px] text-muted-foreground">{t("sessions")}</div>
              </div>
              <div className="rounded-xl bg-muted/50 px-2 py-3">
                <div className="text-xl font-bold tabular-nums">{num(todayPearls)}</div>
                <div className="text-[11px] text-muted-foreground">{t("pearls")}</div>
              </div>
            </div>
            {historyQuery.isError && (
              <p className="mt-3 text-xs text-destructive">
                {tx(
                  "Saved-session statistics are unavailable right now.",
                  "إحصاءات الجلسات المسجلة غير متاحة الآن.",
                )}
              </p>
            )}
          </Card>
        </div>
      </div>

      <Card
        className="focus-history mt-5"
        title={tx("Recent recorded sessions", "أحدث الجلسات المسجلة")}
        action={<Clock3 className="h-4 w-4 text-muted-foreground" />}
      >
        {historyQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : recentSessions.length ? (
          <div className="divide-y">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    {session.mode === "deep"
                      ? t("deep")
                      : session.mode === "custom"
                        ? t("custom")
                        : t("pomodoro")}
                    <Chip className={session.completed ? "bg-sage-soft" : "bg-muted"}>
                      {session.completed ? tx("Completed", "مكتملة") : tx("Stopped", "متوقفة")}
                    </Chip>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(session.started_at).toLocaleString(tx("en-US", "ar-SA"), {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="tabular-nums">
                    {num(session.actual_minutes)} {t("minutes")}
                  </span>
                  {session.pearls > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <Sparkles className="h-3.5 w-3.5" />
                      {num(session.pearls)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 py-2">
            <Nemo mood="sleeping" className="h-12 w-12" />
            <p className="text-sm text-muted-foreground">
              {tx(
                "Your recorded sessions will appear here after you finish or stop a timer.",
                "ستظهر جلساتك المسجلة هنا بعد إكمال المؤقت أو إيقافه.",
              )}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
