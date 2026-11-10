import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Clock3, Pencil, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toLocalInput, fromLocalInput, useInsert, useRemove, useRows, useUpdate } from "@/lib/data";
import { useTx } from "@/lib/tx";
import type { Row } from "@/lib/data";
import "@/page-themes/countdown.css";

export const Route = createFileRoute("/_authenticated/countdown")({
  head: () => ({
    meta: [
      { title: "Countdown — NEMO" },
      { name: "description", content: "Count down to important dates in NEMO." },
    ],
  }),
  component: CountdownPage,
});

type Draft = {
  title: string;
  category: string;
  target_at: string;
  color: string;
  course_id: string;
};
const emptyDraft = (): Draft => ({
  title: "",
  category: "exam",
  target_at: toLocalInput(new Date(Date.now() + 7 * 86400000)),
  color: "#3b82f6",
  course_id: "none",
});

function CountdownPage() {
  const { tx, fmtDate } = useTx();
  const {
    data: countdowns = [],
    isLoading,
    isError,
  } = useRows("countdowns", { order: "target_at", asc: true });
  const { data: courses = [] } = useRows("courses", { order: "name", asc: true });
  const insert = useInsert("countdowns");
  const update = useUpdate("countdowns");
  const remove = useRemove("countdowns");
  const [editing, setEditing] = useState<Row<"countdowns"> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const upcoming = countdowns.filter((x) => new Date(x.target_at).getTime() >= now);
  const filtered = useMemo(
    () =>
      countdowns.filter(
        (item) =>
          (filter === "all" ||
            (filter === "upcoming" && new Date(item.target_at).getTime() >= now) ||
            (filter === "passed" && new Date(item.target_at).getTime() < now)) &&
          `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [countdowns, filter, now, query],
  );
  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setShowForm(true);
  };
  const openEdit = (item: Row<"countdowns">) => {
    setEditing(item);
    setDraft({
      title: item.title,
      category: item.category,
      target_at: toLocalInput(item.target_at),
      color: item.color,
      course_id: item.course_id ?? "none",
    });
    setShowForm(true);
  };
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = fromLocalInput(draft.target_at);
    if (!target || !draft.title.trim()) return;
    const values = {
      title: draft.title.trim(),
      category: draft.category,
      target_at: target,
      color: draft.color,
      course_id: draft.course_id === "none" ? null : draft.course_id,
    };
    if (editing) update.mutate({ id: editing.id, values });
    else insert.mutate(values);
    setShowForm(false);
    setEditing(null);
    setDraft(emptyDraft());
  };
  const closest = [...upcoming].sort(
    (a, b) => new Date(a.target_at).getTime() - new Date(b.target_at).getTime(),
  )[0];
  return (
    <div className="nemo-sea-page nemo-sea-page--countdown countdown-layout space-y-6">
      <div className="countdown-heading flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            {tx("Count down to what matters", "عدّ للأشياء المهمة في حياتك")}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {tx("Countdowns", "العد التنازلي")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {tx(
              "Keep exams, milestones, and personal dates in one place.",
              "اجمع مواعيد الاختبارات والإنجازات والمناسبات في مكان واحد.",
            )}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          {tx("Add countdown", "إضافة عدّ تنازلي")}
        </Button>
      </div>
      {closest && (
        <Card
          className="countdown-feature overflow-hidden border-0 text-primary-foreground shadow-md"
          style={{
            background: `linear-gradient(120deg, ${closest.color}, color-mix(in srgb, ${closest.color} 65%, #111827))`,
          }}
        >
          <CardContent className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium opacity-85">{tx("Coming up next", "أقرب موعد")}</p>
              <h2 className="mt-1 text-2xl font-bold">{closest.title}</h2>
              <p className="mt-1 opacity-85">
                {fmtDate(closest.target_at, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {closest.course_id && courses.find((c) => c.id === closest.course_id)
                  ? ` · ${courses.find((c) => c.id === closest.course_id)?.name}`
                  : ""}
              </p>
            </div>
            <CountdownParts target={closest.target_at} now={now} tx={tx} prominent />
          </CardContent>
        </Card>
      )}
      <div className="countdown-metrics grid gap-3 sm:grid-cols-3">
        <Metric
          label={tx("All countdowns", "كل المواعيد")}
          value={countdowns.length}
          icon={<CalendarDays />}
        />
        <Metric label={tx("Upcoming", "قادمة")} value={upcoming.length} icon={<Clock3 />} />
        <Metric
          label={tx("Passed", "انقضت")}
          value={countdowns.length - upcoming.length}
          icon={<Sparkles />}
        />
      </div>
      {showForm && (
        <Card className="countdown-form border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">
              {editing
                ? tx("Edit countdown", "تعديل العد التنازلي")
                : tx("New countdown", "عدّ تنازلي جديد")}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowForm(false)}
              aria-label={tx("Close", "إغلاق")}
            >
              <X />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
              <Input
                required
                autoFocus
                placeholder={tx("What are you counting down to?", "إلى ماذا تعدّ؟")}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <Input
                required
                type="datetime-local"
                value={draft.target_at}
                onChange={(e) => setDraft({ ...draft, target_at: e.target.value })}
              />
              <Select
                value={draft.category}
                onValueChange={(value) => setDraft({ ...draft, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="midterm">{tx("Midterm", "اختبار فصلي")}</SelectItem>
                  <SelectItem value="final">{tx("Final exam", "اختبار نهائي")}</SelectItem>
                  <SelectItem value="graduation">{tx("Graduation", "التخرج")}</SelectItem>
                  <SelectItem value="scholarship">{tx("Scholarship", "منحة")}</SelectItem>
                  <SelectItem value="personal">{tx("Personal", "شخصي")}</SelectItem>
                  <SelectItem value="other">{tx("Other", "أخرى")}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={draft.course_id}
                onValueChange={(value) => setDraft({ ...draft, course_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tx("Course (optional)", "المقرر (اختياري)")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tx("No course", "بدون مقرر")}</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                {tx("Card color", "لون البطاقة")}
                <input
                  aria-label={tx("Card color", "لون البطاقة")}
                  type="color"
                  className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
                  value={draft.color}
                  onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                />
              </label>
              <div className="flex justify-end gap-2 md:col-span-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {tx("Cancel", "إلغاء")}
                </Button>
                <Button type="submit" disabled={insert.isPending || update.isPending}>
                  {editing
                    ? tx("Save changes", "حفظ التعديلات")
                    : tx("Create countdown", "إنشاء العد التنازلي")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <Card className="countdown-list">
        <CardHeader className="gap-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <CardTitle>{tx("All dates", "كل المواعيد")}</CardTitle>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="ps-9"
                placeholder={tx("Search countdowns…", "ابحث في المواعيد…")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            {(
              [
                ["all", tx("All", "الكل")],
                ["upcoming", tx("Upcoming", "قادمة")],
                ["passed", tx("Passed", "انقضت")],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={filter === key ? "default" : "outline"}
                onClick={() => setFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">
              {tx("Loading countdowns…", "جارٍ تحميل المواعيد…")}
            </p>
          ) : isError ? (
            <p className="py-8 text-center text-destructive">
              {tx("Could not load countdowns.", "تعذر تحميل المواعيد.")}
            </p>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed py-10 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 font-medium">
                {tx("No countdowns in this view", "لا توجد مواعيد في هذا العرض")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tx(
                  "Add an important date to start counting.",
                  "أضف تاريخًا مهمًا لبدء العد التنازلي.",
                )}
              </p>
            </div>
          ) : (
            <div className="countdown-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => {
                const course = courses.find((c) => c.id === item.course_id);
                const passed = new Date(item.target_at).getTime() < now;
                return (
                  <Card key={item.id} className="countdown-item overflow-hidden">
                    <div className="h-1.5" style={{ backgroundColor: item.color }} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold">{item.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {tx(
                              item.category,
                              item.category === "midterm"
                                ? "اختبار فصلي"
                                : item.category === "final"
                                  ? "اختبار نهائي"
                                  : item.category === "graduation"
                                    ? "التخرج"
                                    : item.category === "scholarship"
                                      ? "منحة"
                                      : item.category === "personal"
                                        ? "شخصي"
                                        : "أخرى",
                            )}
                            {course ? ` · ${course.name}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={tx("Edit", "تعديل")}
                            onClick={() => openEdit(item)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:text-destructive"
                            aria-label={tx("Delete", "حذف")}
                            onClick={() => {
                              if (
                                window.confirm(
                                  tx("Delete this countdown?", "هل تريد حذف هذا الموعد؟"),
                                )
                              )
                                remove.mutate(item.id);
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {fmtDate(item.target_at, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <CountdownParts target={item.target_at} now={now} tx={tx} passed={passed} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
function CountdownParts({
  target,
  now,
  tx,
  prominent = false,
  passed = false,
}: {
  target: string;
  now: number;
  tx: (en: string, ar: string) => string;
  prominent?: boolean;
  passed?: boolean;
}) {
  const diff = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return passed ? (
    <p
      className={`mt-3 font-medium ${prominent ? "text-sm opacity-80" : "text-sm text-muted-foreground"}`}
    >
      {tx("This date has passed", "انقضى هذا الموعد")}
    </p>
  ) : (
    <div className={`countdown-parts mt-3 flex gap-2 ${prominent ? "text-center" : ""}`}>
      {[
        [days, tx("days", "يوم")],
        [hours, tx("hours", "ساعة")],
        [minutes, tx("min", "دقيقة")],
      ].map(([num, label]) => (
        <div
          key={String(label)}
          className={`countdown-part rounded-lg ${prominent ? "bg-white/15 px-4 py-2" : "bg-muted px-3 py-2"}`}
        >
          <strong className={`${prominent ? "text-xl" : "text-lg"}`}>
            {Number(num).toLocaleString()}
          </strong>
          <span className="ms-1 text-xs opacity-80">{label}</span>
        </div>
      ))}
    </div>
  );
}
function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="countdown-metric">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <span className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}
