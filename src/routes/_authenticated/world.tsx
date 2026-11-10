import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, Flame, PawPrint, Sparkles, Target } from "lucide-react";
import { Card, Chip, PageHeader } from "@/components/kit";
import { Nemo } from "@/components/nemo";
import dragon from "@/assets/animal-dragon.png";
import fox from "@/assets/animal-fox.png";
import penguin from "@/assets/animal-penguin.png";
import turtle from "@/assets/animal-turtle.png";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useTx } from "@/lib/tx";
import { useQuery } from "@tanstack/react-query";

import "@/page-themes/world.css";

export const Route = createFileRoute("/_authenticated/world")({
  head: () => ({
    meta: [
      { title: "Nemo's World — NEMO" },
      { name: "description", content: "Your study habitat, based on your recorded work." },
      { property: "og:title", content: "Nemo's World — NEMO" },
      { property: "og:description", content: "Your study habitat, based on your recorded work." },
    ],
  }),
  component: WorldPage,
});

const animalArtwork: Record<string, string> = { dragon, fox, penguin, turtle };

function WorldPage() {
  const { tx, t, num, dir } = useTx();
  const { user } = useAuth();
  const range = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    return start;
  }, []);
  const sessionsQuery = useQuery({
    queryKey: ["world-focus", user?.id, range.toISOString()],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("focus_sessions")
        .select("id,actual_minutes,completed,pearls,started_at")
        .eq("user_id", user!.id)
        .gte("started_at", range.toISOString())
        .order("started_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
  const animalsQuery = useQuery({
    queryKey: ["world-animals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_animals")
        .select("id,animal_key,nickname,discovered_at")
        .eq("user_id", user!.id)
        .order("discovered_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });
  const profileQuery = useQuery({
    queryKey: ["world-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("daily_focus_goal,display_name")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);
  const animals = animalsQuery.data ?? [];
  const days = useMemo(() => {
    const sessionsByDay = new Map<string, number>();
    for (const session of sessions) {
      const key = new Date(session.started_at).toDateString();
      sessionsByDay.set(key, (sessionsByDay.get(key) ?? 0) + session.actual_minutes);
    }
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(range);
      date.setDate(range.getDate() + index);
      return { date, minutes: sessionsByDay.get(date.toDateString()) ?? 0 };
    });
  }, [sessions, range]);
  const today = new Date().toDateString();
  const todayMinutes = days.find((day) => day.date.toDateString() === today)?.minutes ?? 0;
  const weekMinutes = days.reduce((sum, day) => sum + day.minutes, 0);
  const completedCount = sessions.filter((session) => session.completed).length;
  const weeklyPearls = sessions.reduce((sum, session) => sum + session.pearls, 0);
  const goal = profileQuery.data?.daily_focus_goal ?? null;
  const goalProgress =
    goal && goal > 0 ? Math.min(100, Math.round((todayMinutes / goal) * 100)) : null;
  const maxDailyMinutes = Math.max(1, ...days.map((day) => day.minutes));
  const streak = useMemo(() => {
    const activeDays = new Set(
      sessions.map((session) => new Date(session.started_at).toDateString()),
    );
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!activeDays.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
    let count = 0;
    while (activeDays.has(cursor.toDateString())) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [sessions]);

  return (
    <div dir={dir} className="nemo-sea-page nemo-sea-page--world mx-auto w-full max-w-6xl pb-10">
      <PageHeader
        title={tx("Nemo's world", "عالم نيمو")}
        sub={tx(
          "A gentle reflection of the study time and discoveries actually saved to your account.",
          "انعكاس لطيف لوقت الدراسة والاكتشافات المحفوظة فعليًا في حسابك.",
        )}
        action={
          <Link
            to="/focus"
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            {tx("Start a focus session", "ابدأ جلسة تركيز")} <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <section className="relative mb-5 overflow-hidden rounded-2xl border bg-gradient-to-br from-sky/70 via-card to-lavender/60 p-5 sm:p-7">
        <div className="absolute -end-8 -top-10 h-48 w-48 rounded-full bg-sage-soft/60 blur-3xl" />
        <div className="relative flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
          <div className="max-w-xl">
            <Chip className="bg-background/80">
              <Sparkles className="me-1 h-3 w-3" />
              {tx("Your study habitat", "موطن دراستك")}
            </Chip>
            <h2 className="mt-3 text-2xl font-semibold">
              {profileQuery.data?.display_name
                ? tx(
                    `Keep growing, ${profileQuery.data.display_name}.`,
                    `واصل التقدم، ${profileQuery.data.display_name}.`,
                  )
                : tx("Small sessions make a steady world.", "الجلسات الصغيرة تبني عالمًا ثابتًا.")}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {tx(
                "Every number and companion here comes from your saved focus sessions, profile goal, or animal journal. No sample streaks or made-up rewards.",
                "كل رقم ورفيق هنا مصدره جلساتك المسجلة أو هدف ملفك الشخصي أو دفتر الحيوانات. لا سلاسل تجريبية أو مكافآت مختلقة.",
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip className="bg-background/80">
                <CalendarDays className="me-1 h-3 w-3" />
                {tx("Last 7 days", "آخر ٧ أيام")}
              </Chip>
              <Chip className="bg-background/80">
                <Flame className="me-1 h-3 w-3" />
                {num(streak)} {tx("day streak", "أيام متتالية")}
              </Chip>
            </div>
          </div>
          <Nemo
            mood={
              goalProgress !== null && goalProgress >= 100
                ? "celebrating"
                : sessions.length
                  ? "studying"
                  : "default"
            }
            className="h-28 w-28 shrink-0 sm:h-36 sm:w-36"
            float
          />
        </div>
      </section>

      {(sessionsQuery.isError || animalsQuery.isError || profileQuery.isError) && (
        <Card className="mb-5 border-destructive/40">
          <p className="text-sm font-medium">
            {tx(
              "Some of the live habitat data could not be loaded.",
              "تعذر تحميل بعض بيانات الموطن الحالية.",
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tx(
              "Check signed-in access to focus_sessions, user_animals and profiles. Only data returned from those tables is included.",
              "تحقق من صلاحية الحساب المسجل للوصول إلى focus_sessions وuser_animals وprofiles. لا نضمّن إلا البيانات التي تعيدها هذه الجداول.",
            )}
          </p>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{tx("Focus today", "تركيز اليوم")}</span>
            <Target className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums">
            {num(todayMinutes)}{" "}
            <span className="text-sm font-medium text-muted-foreground">{t("minutes")}</span>
          </div>
          {goalProgress !== null ? (
            <>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {num(todayMinutes)} / {num(goal!)} {tx("min daily goal", "دقيقة من الهدف اليومي")}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {profileQuery.isLoading
                ? t("loading")
                : tx("No saved daily goal is available.", "لا يوجد هدف يومي محفوظ.")}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{tx("Last 7 days", "آخر ٧ أيام")}</span>
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums">
            {num(weekMinutes)}{" "}
            <span className="text-sm font-medium text-muted-foreground">{t("minutes")}</span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {num(completedCount)}{" "}
            {tx("completed sessions in this period", "جلسات مكتملة خلال هذه الفترة")}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{tx("Saved streak", "أيام التركيز المتتالية")}</span>
            <Flame className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums">
            {num(streak)}{" "}
            <span className="text-sm font-medium text-muted-foreground">{tx("days", "أيام")}</span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {tx(
              "Based on consecutive calendar days with a recorded session.",
              "استنادًا إلى أيام التقويم المتتالية التي سُجلت فيها جلسة.",
            )}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{tx("Pearls this week", "لآلئ هذا الأسبوع")}</span>
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums">{num(weeklyPearls)}</div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {tx("Awarded on these saved focus sessions.", "ممنوحة في جلسات التركيز المسجلة هذه.")}
          </p>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)]">
        <Card
          title={tx("Your focus rhythm", "إيقاع تركيزك")}
          action={
            <span className="text-xs text-muted-foreground">
              {tx("Recorded minutes", "دقائق مسجلة")}
            </span>
          }
        >
          {sessionsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : sessionsQuery.isError ? (
            <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              {tx(
                "The focus_sessions table is not readable right now.",
                "لا يمكن قراءة جدول focus_sessions حاليًا.",
              )}
            </p>
          ) : (
            <div className="flex h-48 items-end justify-between gap-2 pt-3">
              {days.map((day) => (
                <div
                  key={day.date.toISOString()}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {day.minutes ? num(day.minutes) : "·"}
                  </span>
                  <div className="flex h-32 w-full max-w-12 items-end overflow-hidden rounded-t-lg bg-muted/60">
                    <div
                      className="w-full rounded-t-lg bg-primary/80 transition-all"
                      style={{
                        height: day.minutes
                          ? `${Math.max(8, (day.minutes / maxDailyMinutes) * 100)}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <span
                    className={`text-[10px] ${day.date.toDateString() === today ? "font-bold text-primary" : "text-muted-foreground"}`}
                  >
                    {day.date.toLocaleDateString(tx("en-US", "ar-SA"), { weekday: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            {tx(
              "Minutes are summed from actual_minutes in your saved sessions; days without a row stay at zero.",
              "تُجمع الدقائق من actual_minutes في جلساتك المسجلة، وتبقى الأيام بلا سجلات عند الصفر.",
            )}
          </p>
        </Card>

        <Card
          title={tx("Your recorded companions", "رفاقك المسجلون")}
          action={<PawPrint className="h-4 w-4 text-muted-foreground" />}
        >
          {animalsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : animalsQuery.isError ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              {tx("The animal journal could not be read.", "تعذرت قراءة دفتر الحيوانات.")}
            </p>
          ) : animals.length ? (
            <div className="grid grid-cols-2 gap-2">
              {animals.slice(0, 4).map((animal) => (
                <div
                  key={animal.id}
                  className="flex min-w-0 items-center gap-2 rounded-xl border bg-muted/25 p-2"
                >
                  {animalArtwork[animal.animal_key] ? (
                    <img
                      src={animalArtwork[animal.animal_key]}
                      alt={animal.nickname || animal.animal_key}
                      className="h-12 w-12 shrink-0 object-contain"
                    />
                  ) : (
                    <PawPrint className="mx-3 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate text-xs font-medium">
                    {animal.nickname || animal.animal_key}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-3 py-5 text-center text-sm text-muted-foreground">
              {tx("No animal entries are saved yet.", "لا توجد سجلات حيوانات محفوظة بعد.")}
            </div>
          )}
          <Link
            to="/zoo"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {tx("Open the discovery journal", "افتح دفتر الاكتشافات")}{" "}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>
    </div>
  );
}
