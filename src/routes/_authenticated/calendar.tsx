import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  expandEvents,
  fromLocalInput,
  toLocalInput,
  useInsert,
  useRemove,
  useRows,
  useUpdate,
} from "@/lib/data";
import { useTx } from "@/lib/tx";
import type { Row } from "@/lib/data";
import "@/page-themes/calendar.css";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — NEMO" },
      { name: "description", content: "View saved events and appointments on your NEMO calendar." },
    ],
  }),
  component: CalendarPage,
});

type Draft = {
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  kind: string;
  location: string;
  recurrence: string;
  course_id: string;
};
const draftFor = (day: Date): Draft => {
  const start = new Date(day);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    title: "",
    description: "",
    starts_at: toLocalInput(start),
    ends_at: toLocalInput(end),
    kind: "appointment",
    location: "",
    recurrence: "none",
    course_id: "none",
  };
};
const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const eventLabel = (kind: string, tx: (en: string, ar: string) => string) =>
  ({
    appointment: tx("Appointment", "موعد"),
    event: tx("Event", "فعالية"),
    lecture: tx("Lecture", "محاضرة"),
    exam: tx("Exam", "اختبار"),
    meeting: tx("Meeting", "اجتماع"),
    assignment: tx("Assignment", "تسليم واجب"),
    study: tx("Study", "مذاكرة"),
    personal: tx("Personal", "شخصي"),
  })[kind] ?? kind;

function CalendarPage() {
  const { tx, fmtDate, fmtTime, locale, dir } = useTx();
  const {
    data: events = [],
    isLoading,
    isError,
  } = useRows("events", { order: "starts_at", asc: true });
  const { data: courses = [] } = useRows("courses", { order: "name", asc: true });
  const insert = useInsert("events");
  const update = useUpdate("events");
  const remove = useRemove("events");
  const [viewMonth, setViewMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selected, setSelected] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
  );
  const [kind, setKind] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Row<"events"> | null>(null);
  const [draft, setDraft] = useState<Draft>(() => draftFor(new Date()));
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - ((monthStart.getDay() + 6) % 7));
  gridStart.setHours(0, 0, 0, 0);
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridStart.getDate() + 42);
  gridEnd.setMilliseconds(-1);
  const days = Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    return day;
  });
  const kinds = [...new Set(events.map((event) => event.kind))];
  const occurrences = expandEvents(
    events.filter((event) => kind === "all" || event.kind === kind),
    gridStart,
    gridEnd,
  );
  const forSelected = occurrences.filter((event) => keyOf(event.occ) === keyOf(selected));
  const openCreate = () => {
    setEditing(null);
    setDraft(draftFor(selected));
    setShowForm(true);
  };
  const openEdit = (event: Row<"events">) => {
    setEditing(event);
    setDraft({
      title: event.title,
      description: event.description ?? "",
      starts_at: toLocalInput(event.starts_at),
      ends_at: toLocalInput(event.ends_at),
      kind: event.kind,
      location: event.location ?? "",
      recurrence: event.recurrence,
      course_id: event.course_id ?? "none",
    });
    setShowForm(true);
  };
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const starts = fromLocalInput(draft.starts_at);
    const ends = fromLocalInput(draft.ends_at);
    if (!starts || !ends || !draft.title.trim() || new Date(ends) < new Date(starts)) return;
    const values = {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      starts_at: starts,
      ends_at: ends,
      kind: draft.kind,
      location: draft.location.trim() || null,
      link: editing?.link ?? null,
      recurrence: draft.recurrence,
      course_id: draft.course_id === "none" ? null : draft.course_id,
    };
    if (editing) update.mutate({ id: editing.id, values });
    else insert.mutate(values);
    setShowForm(false);
    setEditing(null);
    setDraft(draftFor(selected));
  };
  const moveMonth = (step: number) => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + step, 1);
    setViewMonth(next);
    setSelected(
      new Date(
        next.getFullYear(),
        next.getMonth(),
        Math.min(
          selected.getDate(),
          new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate(),
        ),
      ),
    );
  };
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i);
    return d.toLocaleDateString(locale, { weekday: "short" });
  });
  const todayKey = keyOf(new Date());
  const gregorianSelected = selected.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hijriSelected = selected.toLocaleDateString("ar-SA-u-ca-islamic", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div className="nemo-sea-page nemo-sea-page--calendar space-y-6">
      <div className="calendar-heading flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            {tx("Your saved dates, at a glance", "مواعيدك المحفوظة في نظرة واحدة")}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{tx("Calendar", "التقويم")}</h1>
          <p className="mt-2 text-muted-foreground">
            {tx(
              "Select a day to see the events and appointments saved for it.",
              "اختر يومًا لعرض فعالياته ومواعيده المحفوظة.",
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary">
              {gregorianSelected}
            </span>
            <span className="rounded-full bg-sage-soft px-3 py-1.5 font-medium text-primary-deep">
              {hijriSelected}
            </span>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          {tx("Add event", "إضافة فعالية")}
        </Button>
      </div>
      {showForm && (
        <Card className="calendar-form border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">
              {editing
                ? tx("Edit event", "تعديل الفعالية")
                : tx("New event or appointment", "فعالية أو موعد جديد")}
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
                placeholder={tx("Title", "العنوان")}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <Select
                value={draft.kind}
                onValueChange={(value) => setDraft({ ...draft, kind: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment">{tx("Appointment", "موعد")}</SelectItem>
                  <SelectItem value="event">{tx("Event", "فعالية")}</SelectItem>
                  <SelectItem value="lecture">{tx("Lecture", "محاضرة")}</SelectItem>
                  <SelectItem value="exam">{tx("Exam", "اختبار")}</SelectItem>
                  <SelectItem value="meeting">{tx("Meeting", "اجتماع")}</SelectItem>
                  <SelectItem value="assignment">{tx("Assignment", "تسليم واجب")}</SelectItem>
                  <SelectItem value="study">{tx("Study session", "جلسة مذاكرة")}</SelectItem>
                  <SelectItem value="personal">{tx("Personal", "شخصي")}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                required
                type="datetime-local"
                aria-label={tx("Start", "البداية")}
                value={draft.starts_at}
                onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
              />
              <Input
                required
                type="datetime-local"
                aria-label={tx("End", "النهاية")}
                value={draft.ends_at}
                onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
              />
              <Input
                placeholder={tx("Location (optional)", "المكان (اختياري)")}
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
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
              <Select
                value={draft.recurrence}
                onValueChange={(value) => setDraft({ ...draft, recurrence: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tx("Does not repeat", "لا يتكرر")}</SelectItem>
                  <SelectItem value="weekly">{tx("Repeat weekly", "يتكرر أسبوعيًا")}</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                className="md:col-span-2"
                placeholder={tx("Description (optional)", "الوصف (اختياري)")}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
              <div className="flex justify-end gap-2 md:col-span-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {tx("Cancel", "إلغاء")}
                </Button>
                <Button type="submit" disabled={insert.isPending || update.isPending}>
                  {editing ? tx("Save changes", "حفظ التعديلات") : tx("Save event", "حفظ الفعالية")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <div className="calendar-layout grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <Card className="calendar-board">
          <CardHeader className="calendar-board-header flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={tx("Previous month", "الشهر السابق")}
                  onClick={() => moveMonth(dir === "rtl" ? 1 : -1)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={tx("Next month", "الشهر التالي")}
                  onClick={() => moveMonth(dir === "rtl" ? -1 : 1)}
                >
                  <ChevronRight />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                    setSelected(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
                  }}
                >
                  {tx("Today", "اليوم")}
                </Button>
              </div>
              <CardTitle className="text-lg sm:text-xl">
                {viewMonth.toLocaleDateString(locale, { month: "long", year: "numeric" })}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tx("All event types", "كل أنواع الفعاليات")}</SelectItem>
                  {kinds.map((value) => (
                    <SelectItem key={value} value={value}>
                      {eventLabel(value, tx)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="calendar-weekdays grid grid-cols-7 border-b pb-2">
              {weekdays.map((day, i) => (
                <div
                  key={`${day}-${i}`}
                  className="py-1 text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="calendar-grid grid grid-cols-7">
              {days.map((day) => {
                const inMonth = day.getMonth() === viewMonth.getMonth();
                const isSelected = keyOf(day) === keyOf(selected);
                const isToday = keyOf(day) === todayKey;
                const items = occurrences.filter((event) => keyOf(event.occ) === keyOf(day));
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelected(day)}
                    className={`calendar-day relative flex min-h-[76px] flex-col items-center gap-1 border-b border-e p-1.5 text-sm transition-colors hover:bg-accent sm:min-h-[94px] sm:p-2 ${!inMonth ? "text-muted-foreground/50" : ""} ${isSelected ? "bg-primary/5 ring-1 ring-inset ring-primary" : ""}`}
                  >
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : ""} ${isSelected && !isToday ? "font-bold text-primary" : ""}`}
                    >
                      {day.getDate()}
                    </span>
                    <span className="flex max-w-full flex-wrap justify-center gap-0.5">
                      {items.slice(0, 4).map((item, i) => (
                        <span
                          key={`${item.id}-${i}`}
                          className="h-1.5 w-1.5 rounded-full bg-primary"
                        />
                      ))}
                      {items.length > 4 && (
                        <span className="text-[9px] leading-3">+{items.length - 4}</span>
                      )}
                    </span>
                    <span className="hidden w-full truncate text-start text-[10px] sm:block">
                      {items[0]?.title ?? ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="calendar-agenda h-fit">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">{tx("Selected day", "اليوم المحدد")}</p>
              <CardTitle className="mt-1 text-lg">
                {fmtDate(selected, { weekday: "long", month: "long", day: "numeric" })}
              </CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={openCreate}>
              <Plus />
              {tx("Add", "إضافة")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {tx("Loading calendar…", "جارٍ تحميل التقويم…")}
              </p>
            ) : isError ? (
              <p className="py-6 text-center text-sm text-destructive">
                {tx("Could not load calendar events.", "تعذر تحميل أحداث التقويم.")}
              </p>
            ) : forSelected.length === 0 ? (
              <div className="rounded-xl border border-dashed py-8 text-center">
                <CalendarDays className="mx-auto h-7 w-7 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium">
                  {tx("Nothing scheduled for this day", "لا يوجد شيء مجدول لهذا اليوم")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tx(
                    "Add an event or appointment to see it here.",
                    "أضف فعالية أو موعدًا ليظهر هنا.",
                  )}
                </p>
              </div>
            ) : (
              forSelected.map((event) => {
                const course = courses.find((c) => c.id === event.course_id);
                return (
                  <div
                    key={`${event.id}-${event.occ.toISOString()}`}
                    className="calendar-event rounded-xl border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{event.title}</p>
                        <p className="mt-1 text-xs text-primary">
                          {eventLabel(event.kind, tx)}
                          {event.recurrence === "weekly" ? ` · ${tx("Weekly", "أسبوعي")}` : ""}
                        </p>
                      </div>
                      {
                        <div className="flex shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={tx("Edit", "تعديل")}
                            onClick={() => openEdit(event)}
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
                                  tx("Delete this event?", "هل تريد حذف هذه الفعالية؟"),
                                )
                              )
                                remove.mutate(event.id);
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      }
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {fmtTime(event.occ)}–{fmtTime(event.occEnd)}
                    </p>
                    {event.location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </p>
                    )}
                    {course && <p className="mt-1 text-xs text-muted-foreground">{course.name}</p>}
                    {event.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
