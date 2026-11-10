import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
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
import "@/page-themes/reminders.css";

export const Route = createFileRoute("/_authenticated/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders — NEMO" },
      { name: "description", content: "Keep important reminders in NEMO." },
    ],
  }),
  component: RemindersPage,
});

type Draft = {
  title: string;
  description: string;
  remind_at: string;
  category: string;
  priority: string;
  repeat: string;
};
const freshDraft = (): Draft => ({
  title: "",
  description: "",
  remind_at: toLocalInput(new Date(Date.now() + 60 * 60 * 1000)),
  category: "personal",
  priority: "medium",
  repeat: "once",
});

function RemindersPage() {
  const { tx, fmtDate, fmtTime } = useTx();
  const {
    data: reminders = [],
    isLoading,
    isError,
  } = useRows("reminders", { order: "remind_at", asc: true });
  const insert = useInsert("reminders");
  const update = useUpdate("reminders");
  const remove = useRemove("reminders");
  const [filter, setFilter] = useState("open");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Row<"reminders"> | null>(null);
  const [draft, setDraft] = useState<Draft>(freshDraft);
  const now = new Date();
  const visible = reminders.filter((item) => {
    const matchFilter =
      filter === "all" ||
      (filter === "open" && !item.done) ||
      (filter === "done" && item.done) ||
      (filter === "upcoming" && !item.done && new Date(item.remind_at) >= now) ||
      (filter === "past" && !item.done && new Date(item.remind_at) < now);
    return (
      matchFilter &&
      `${item.title} ${item.description ?? ""} ${item.category}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  });
  const startNew = () => {
    setEditing(null);
    setDraft(freshDraft());
    setShowForm(true);
  };
  const startEdit = (item: Row<"reminders">) => {
    setEditing(item);
    setDraft({
      title: item.title,
      description: item.description ?? "",
      remind_at: toLocalInput(item.remind_at),
      category: item.category,
      priority: item.priority,
      repeat: item.repeat,
    });
    setShowForm(true);
  };
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      remind_at: fromLocalInput(draft.remind_at) ?? new Date().toISOString(),
      category: draft.category,
      priority: draft.priority,
      repeat: draft.repeat,
    };
    if (!values.title) return;
    if (editing) update.mutate({ id: editing.id, values });
    else insert.mutate({ ...values, done: false });
    setShowForm(false);
    setEditing(null);
    setDraft(freshDraft());
  };
  const labels = [
    ["open", tx("Active", "نشطة")],
    ["upcoming", tx("Upcoming", "قادمة")],
    ["past", tx("Past due", "فات موعدها")],
    ["done", tx("Completed", "مكتملة")],
    ["all", tx("All", "الكل")],
  ] as const;
  return (
    <div className="nemo-sea-page nemo-sea-page--reminders space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            {tx("Stay on top of the little things", "لا تدع التفاصيل الصغيرة تفوتك")}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{tx("Reminders", "التذكيرات")}</h1>
          <p className="mt-2 text-muted-foreground">
            {tx(
              "Set a time, add context, and mark each reminder when it's done.",
              "حدّد الوقت وأضف التفاصيل، ثم أكمل التذكير عند إنجازه.",
            )}
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus />
          {tx("New reminder", "تذكير جديد")}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          title={tx("Active", "نشطة")}
          count={reminders.filter((r) => !r.done).length}
          icon={<Bell />}
        />
        <Metric
          title={tx("Due today", "موعدها اليوم")}
          count={
            reminders.filter(
              (r) => !r.done && new Date(r.remind_at).toDateString() === now.toDateString(),
            ).length
          }
          icon={<CalendarClock />}
        />
        <Metric
          title={tx("Completed", "مكتملة")}
          count={reminders.filter((r) => r.done).length}
          icon={<CheckCircle2 />}
        />
      </div>
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">
              {editing
                ? tx("Edit reminder", "تعديل التذكير")
                : tx("Create a reminder", "إنشاء تذكير")}
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
                placeholder={tx("What should you remember?", "ما الذي تريد تذكّره؟")}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <Input
                required
                type="datetime-local"
                value={draft.remind_at}
                onChange={(e) => setDraft({ ...draft, remind_at: e.target.value })}
              />
              <Textarea
                placeholder={tx("Add a note (optional)", "أضف ملاحظة (اختياري)")}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="md:col-span-2"
              />
              <Select
                value={draft.category}
                onValueChange={(value) => setDraft({ ...draft, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">{tx("Academic", "أكاديمي")}</SelectItem>
                  <SelectItem value="personal">{tx("Personal", "شخصي")}</SelectItem>
                  <SelectItem value="health">{tx("Health & habits", "الصحة والعادات")}</SelectItem>
                  <SelectItem value="projects">{tx("Projects", "مشاريع")}</SelectItem>
                  <SelectItem value="other">{tx("Other", "أخرى")}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={draft.priority}
                onValueChange={(value) => setDraft({ ...draft, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{tx("Low", "منخفضة")}</SelectItem>
                  <SelectItem value="medium">{tx("Medium", "متوسطة")}</SelectItem>
                  <SelectItem value="high">{tx("High", "عالية")}</SelectItem>
                  <SelectItem value="urgent">{tx("Urgent", "عاجلة")}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={draft.repeat}
                onValueChange={(value) => setDraft({ ...draft, repeat: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">{tx("Once", "مرة واحدة")}</SelectItem>
                  <SelectItem value="daily">{tx("Daily", "يوميًا")}</SelectItem>
                  <SelectItem value="weekly">{tx("Weekly", "أسبوعيًا")}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2 md:col-span-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {tx("Cancel", "إلغاء")}
                </Button>
                <Button type="submit" disabled={insert.isPending || update.isPending}>
                  {editing
                    ? tx("Save changes", "حفظ التعديلات")
                    : tx("Save reminder", "حفظ التذكير")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <CardTitle>{tx("Your reminders", "تذكيراتك")}</CardTitle>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="ps-9"
                placeholder={tx("Search reminders…", "ابحث في التذكيرات…")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {labels.map(([key, label]) => (
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
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">
              {tx("Loading reminders…", "جارٍ تحميل التذكيرات…")}
            </p>
          ) : isError ? (
            <p className="py-8 text-center text-destructive">
              {tx("Could not load reminders.", "تعذر تحميل التذكيرات.")}
            </p>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-dashed py-10 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 font-medium">{tx("Nothing here yet", "لا يوجد شيء هنا بعد")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tx(
                  "Create a reminder to keep an important moment in view.",
                  "أنشئ تذكيرًا لتبقى لحظاتك المهمة أمامك.",
                )}
              </p>
            </div>
          ) : (
            visible.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border p-3 hover:bg-muted/40"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-0.5 shrink-0 rounded-full"
                  aria-label={
                    item.done ? tx("Reopen", "إعادة فتح") : tx("Mark complete", "تحديد كمكتمل")
                  }
                  onClick={() => update.mutate({ id: item.id, values: { done: !item.done } })}
                >
                  {item.done ? <CheckCircle2 className="text-primary" /> : <Check />}
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`font-medium ${item.done ? "text-muted-foreground line-through" : ""}`}
                    >
                      {item.title}
                    </p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {tx(
                        item.category,
                        item.category === "academic"
                          ? "أكاديمي"
                          : item.category === "personal"
                            ? "شخصي"
                            : item.category === "health"
                              ? "الصحة والعادات"
                              : item.category === "projects"
                                ? "مشاريع"
                                : "أخرى",
                      )}
                    </span>
                    <span
                      className={`text-xs ${item.priority === "urgent" || item.priority === "high" ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {tx(
                        item.priority,
                        item.priority === "urgent"
                          ? "عاجلة"
                          : item.priority === "high"
                            ? "عالية"
                            : item.priority === "low"
                              ? "منخفضة"
                              : "متوسطة",
                      )}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  )}
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {fmtDate(item.remind_at, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {fmtTime(item.remind_at)}
                    {item.repeat !== "once" && (
                      <span className="ms-2">
                        · {tx(item.repeat, item.repeat === "daily" ? "يومي" : "أسبوعي")}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={tx("Edit", "تعديل")}
                    onClick={() => startEdit(item)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-destructive"
                    aria-label={tx("Delete", "حذف")}
                    onClick={() => {
                      if (window.confirm(tx("Delete this reminder?", "هل تريد حذف هذا التذكير؟")))
                        remove.mutate(item.id);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
function Metric({ title, count, icon }: { title: string; count: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{count}</p>
        </div>
        <span className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}
