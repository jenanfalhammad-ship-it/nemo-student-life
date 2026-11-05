import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Search,
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
import { fromLocalInput, toLocalInput, useInsert, useRemove, useRows, useUpdate } from "@/lib/data";
import { useTx } from "@/lib/tx";
import type { Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [
      { title: "Events — NEMO" },
      { name: "description", content: "Manage your saved events and appointments in NEMO." },
    ],
  }),
  component: EventsPage,
});

type Draft = {
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  kind: string;
  location: string;
  link: string;
  recurrence: string;
  course_id: string;
};
const freshDraft = (): Draft => {
  const start = new Date();
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    title: "",
    description: "",
    starts_at: toLocalInput(start),
    ends_at: toLocalInput(end),
    kind: "event",
    location: "",
    link: "",
    recurrence: "none",
    course_id: "none",
  };
};
const kindLabel = (kind: string, tx: (en: string, ar: string) => string) =>
  ({
    event: tx("Event", "فعالية"),
    appointment: tx("Appointment", "موعد"),
    lecture: tx("Lecture", "محاضرة"),
    exam: tx("Exam", "اختبار"),
    meeting: tx("Meeting", "اجتماع"),
    assignment: tx("Assignment", "تسليم واجب"),
    study: tx("Study session", "جلسة مذاكرة"),
    personal: tx("Personal", "شخصي"),
  })[kind] ?? kind;

function EventsPage() {
  const { tx, fmtDate, fmtTime } = useTx();
  const {
    data: events = [],
    isLoading,
    isError,
  } = useRows("events", { order: "starts_at", asc: true });
  const { data: courses = [] } = useRows("courses", { order: "name", asc: true });
  const insert = useInsert("events");
  const update = useUpdate("events");
  const remove = useRemove("events");
  const [period, setPeriod] = useState("upcoming");
  const [kind, setKind] = useState("all");
  const [course, setCourse] = useState("all");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Row<"events"> | null>(null);
  const [draft, setDraft] = useState<Draft>(freshDraft);
  const now = new Date();
  const kinds = [...new Set(events.map((event) => event.kind))];
  const visible = events.filter((event) => {
    const start = new Date(event.starts_at);
    const periodMatch =
      period === "all" ||
      (period === "upcoming" && (start >= now || event.recurrence === "weekly")) ||
      (period === "past" && start < now && event.recurrence !== "weekly");
    return (
      periodMatch &&
      (kind === "all" || event.kind === kind) &&
      (course === "all" || event.course_id === course) &&
      `${event.title} ${event.description ?? ""} ${event.location ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  });
  const startNew = () => {
    setEditing(null);
    setDraft(freshDraft());
    setShowForm(true);
  };
  const startEdit = (event: Row<"events">) => {
    setEditing(event);
    setDraft({
      title: event.title,
      description: event.description ?? "",
      starts_at: toLocalInput(event.starts_at),
      ends_at: toLocalInput(event.ends_at),
      kind: event.kind,
      location: event.location ?? "",
      link: event.link ?? "",
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
      link: draft.link.trim() || null,
      recurrence: draft.recurrence,
      course_id: draft.course_id === "none" ? null : draft.course_id,
    };
    if (editing) update.mutate({ id: editing.id, values });
    else insert.mutate(values);
    setShowForm(false);
    setEditing(null);
    setDraft(freshDraft());
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            {tx("Every lecture, appointment, and occasion", "محاضراتك ومواعيدك ومناسباتك")}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{tx("Events", "الفعاليات")}</h1>
          <p className="mt-2 text-muted-foreground">
            {tx("One place for the dates you have saved.", "مكان واحد لكل المواعيد التي حفظتها.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/calendar">
              <CalendarDays />
              {tx("Open calendar", "فتح التقويم")}
            </Link>
          </Button>
          <Button onClick={startNew}>
            <Plus />
            {tx("Add event", "إضافة فعالية")}
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary
          title={tx("Upcoming", "قادمة")}
          value={
            events.filter((x) => new Date(x.starts_at) >= now || x.recurrence === "weekly").length
          }
          icon={<CalendarDays />}
        />
        <Summary
          title={tx("Appointments", "مواعيد")}
          value={events.filter((x) => x.kind === "appointment").length}
          icon={<Clock3 />}
        />
        <Summary
          title={tx("Linked to courses", "مرتبطة بمقرر")}
          value={events.filter((x) => x.course_id).length}
          icon={<MapPin />}
        />
      </div>
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">
              {editing ? tx("Edit event", "تعديل الفعالية") : tx("Create an event", "إنشاء فعالية")}
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
                placeholder={tx("Event title", "عنوان الفعالية")}
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
                  <SelectItem value="event">{tx("Event", "فعالية")}</SelectItem>
                  <SelectItem value="appointment">{tx("Appointment", "موعد")}</SelectItem>
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
              <Input
                type="url"
                placeholder={tx("Link (optional)", "رابط (اختياري)")}
                value={draft.link}
                onChange={(e) => setDraft({ ...draft, link: e.target.value })}
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
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <CardTitle>
              {tx("Saved events & appointments", "الفعاليات والمواعيد المحفوظة")}
            </CardTitle>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="ps-9"
                placeholder={tx("Search events…", "ابحث في الفعاليات…")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["upcoming", tx("Upcoming", "قادمة")],
                ["past", tx("Past", "سابقة")],
                ["all", tx("All dates", "كل المواعيد")],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={period === key ? "default" : "outline"}
                onClick={() => setPeriod(key)}
              >
                {label}
              </Button>
            ))}
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tx("All types", "كل الأنواع")}</SelectItem>
                {kinds.map((value) => (
                  <SelectItem key={value} value={value}>
                    {kindLabel(value, tx)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={course} onValueChange={setCourse}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tx("All courses", "كل المقررات")}</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">
              {tx("Loading events…", "جارٍ تحميل الفعاليات…")}
            </p>
          ) : isError ? (
            <p className="py-8 text-center text-destructive">
              {tx("Could not load events.", "تعذر تحميل الفعاليات.")}
            </p>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-dashed py-10 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 font-medium">
                {tx("No saved events in this view", "لا توجد فعاليات محفوظة في هذا العرض")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tx(
                  "Add a lecture, appointment, or event to see it here and on your calendar.",
                  "أضف محاضرة أو موعدًا أو فعالية لتظهر هنا وفي التقويم.",
                )}
              </p>
            </div>
          ) : (
            visible.map((event) => {
              const linkedCourse = courses.find((c) => c.id === event.course_id);
              const start = new Date(event.starts_at);
              const end = new Date(event.ends_at);
              return (
                <div
                  key={event.id}
                  className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start"
                >
                  <div className="flex w-full shrink-0 items-center gap-3 rounded-lg bg-primary/5 p-3 sm:w-28 sm:flex-col sm:items-start">
                    <span className="text-xs font-semibold uppercase text-primary">
                      {fmtDate(start, { month: "short" })}
                    </span>
                    <strong className="text-2xl leading-none">{start.getDate()}</strong>
                    <span className="text-xs text-muted-foreground">{fmtTime(start)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {kindLabel(event.kind, tx)}
                      </span>
                      {event.recurrence === "weekly" && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {tx("Weekly", "أسبوعي")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {fmtTime(start)}–{fmtTime(end)}
                      </span>
                      {event.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      )}
                      {linkedCourse && <span>{linkedCourse.name}</span>}
                    </p>
                    {event.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                    {event.link && (
                      <a
                        className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        href={event.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {tx("Open link", "فتح الرابط")}
                      </a>
                    )}
                  </div>
                  <div className="flex self-end sm:self-start">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={tx("Edit", "تعديل")}
                      onClick={() => startEdit(event)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:text-destructive"
                      aria-label={tx("Delete", "حذف")}
                      onClick={() => {
                        if (window.confirm(tx("Delete this event?", "هل تريد حذف هذه الفعالية؟")))
                          remove.mutate(event.id);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
function Summary({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <span className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}
