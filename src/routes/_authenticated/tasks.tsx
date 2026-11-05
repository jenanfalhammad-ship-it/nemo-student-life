import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpDown,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
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

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — NEMO" },
      { name: "description", content: "Plan and complete your tasks in NEMO." },
    ],
  }),
  component: TasksPage,
});

type Draft = {
  title: string;
  description: string;
  due_at: string;
  priority: string;
  category: string;
  estimated_minutes: string;
};
const blankDraft = (): Draft => ({
  title: "",
  description: "",
  due_at: "",
  priority: "medium",
  category: "university",
  estimated_minutes: "",
});
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function TasksPage() {
  const { tx, fmtDate, fmtTime } = useTx();
  const { data: tasks = [], isLoading, isError } = useRows("tasks", { order: "due_at", asc: true });
  const { data: events = [] } = useRows("events", { order: "starts_at", asc: true });
  const addTask = useInsert("tasks");
  const updateTask = useUpdate("tasks");
  const removeTask = useRemove("tasks");
  const [filter, setFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row<"tasks"> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const today = new Date();
  const todaysEvents = expandEvents(
    events,
    new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
  );
  const visible = tasks.filter((task) => {
    const matchFilter =
      filter === "all" ||
      (filter === "open" && task.status !== "completed") ||
      (filter === "completed" && task.status === "completed") ||
      (filter === "today" && !!task.due_at && dayKey(new Date(task.due_at)) === dayKey(today)) ||
      (filter === "overdue" &&
        !!task.due_at &&
        new Date(task.due_at) < today &&
        task.status !== "completed");
    return (
      matchFilter &&
      `${task.title} ${task.description ?? ""} ${task.category}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  const openNew = () => {
    setEditing(null);
    setDraft(blankDraft());
    setShowForm(true);
  };
  const openEdit = (task: Row<"tasks">) => {
    setEditing(task);
    setDraft({
      title: task.title,
      description: task.description ?? "",
      due_at: toLocalInput(task.due_at),
      priority: task.priority,
      category: task.category,
      estimated_minutes: task.estimated_minutes?.toString() ?? "",
    });
    setShowForm(true);
  };
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      due_at: fromLocalInput(draft.due_at),
      priority: draft.priority,
      category: draft.category,
      estimated_minutes: draft.estimated_minutes ? Number(draft.estimated_minutes) : null,
    };
    if (!values.title) return;
    if (editing) updateTask.mutate({ id: editing.id, values });
    else addTask.mutate({ ...values, status: "todo", completed_at: null });
    setShowForm(false);
    setEditing(null);
    setDraft(blankDraft());
  };
  const toggle = (task: Row<"tasks">) => {
    const done = task.status !== "completed";
    updateTask.mutate({
      id: task.id,
      values: {
        status: done ? "completed" : "todo",
        completed_at: done ? new Date().toISOString() : null,
      },
    });
  };
  const filterItems = [
    ["open", tx("To do", "قيد الإنجاز")],
    ["today", tx("Due today", "مستحقة اليوم")],
    ["overdue", tx("Overdue", "متأخرة")],
    ["completed", tx("Completed", "مكتملة")],
    ["all", tx("All", "الكل")],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            {fmtDate(today, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{tx("Tasks", "المهام")}</h1>
          <p className="mt-2 text-muted-foreground">
            {tx(
              "Keep your next steps clear and manageable.",
              "رتّب خطواتك القادمة واجعلها واضحة وسهلة الإنجاز.",
            )}
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus />
          {tx("Add task", "إضافة مهمة")}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={tx("Open", "قيد الإنجاز")}
          value={tasks.filter((x) => x.status !== "completed").length}
          icon={<Circle className="h-4 w-4" />}
        />
        <Stat
          label={tx("Due today", "مستحقة اليوم")}
          value={
            tasks.filter(
              (x) =>
                x.due_at &&
                dayKey(new Date(x.due_at)) === dayKey(today) &&
                x.status !== "completed",
            ).length
          }
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <Stat
          label={tx("Completed", "مكتملة")}
          value={tasks.filter((x) => x.status === "completed").length}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">
              {editing ? tx("Edit task", "تعديل المهمة") : tx("New task", "مهمة جديدة")}
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
                placeholder={tx("Task title", "عنوان المهمة")}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <Input
                type="datetime-local"
                aria-label={tx("Due date", "تاريخ الاستحقاق")}
                value={draft.due_at}
                onChange={(e) => setDraft({ ...draft, due_at: e.target.value })}
              />
              <Textarea
                placeholder={tx("Notes (optional)", "ملاحظات (اختياري)")}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="md:col-span-2"
              />
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
                value={draft.category}
                onValueChange={(value) => setDraft({ ...draft, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="university">{tx("University", "الجامعة")}</SelectItem>
                  <SelectItem value="studying">{tx("Studying", "مذاكرة")}</SelectItem>
                  <SelectItem value="personal">{tx("Personal", "شخصي")}</SelectItem>
                  <SelectItem value="projects">{tx("Projects", "مشاريع")}</SelectItem>
                  <SelectItem value="other">{tx("Other", "أخرى")}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                min="1"
                type="number"
                placeholder={tx("Estimated minutes", "المدة المتوقعة بالدقائق")}
                value={draft.estimated_minutes}
                onChange={(e) => setDraft({ ...draft, estimated_minutes: e.target.value })}
              />
              <div className="flex justify-end gap-2 md:col-span-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {tx("Cancel", "إلغاء")}
                </Button>
                <Button disabled={addTask.isPending || updateTask.isPending} type="submit">
                  {editing
                    ? tx("Save changes", "حفظ التعديلات")
                    : tx("Create task", "إنشاء المهمة")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <CardTitle>{tx("Your tasks", "قائمة المهام")}</CardTitle>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="ps-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={tx("Search tasks…", "ابحث في المهام…")}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterItems.map(([key, label]) => (
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
                {tx("Loading tasks…", "جارٍ تحميل المهام…")}
              </p>
            ) : isError ? (
              <p className="py-8 text-center text-destructive">
                {tx("Could not load tasks. Please try again.", "تعذر تحميل المهام. حاول مجددًا.")}
              </p>
            ) : visible.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 font-medium">
                  {tx("No tasks match this view", "لا توجد مهام في هذا العرض")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tx("Add a task or change your filters.", "أضف مهمة أو غيّر عوامل التصفية.")}
                </p>
              </div>
            ) : (
              visible.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 shrink-0 rounded-full"
                    onClick={() => toggle(task)}
                    aria-label={
                      task.status === "completed"
                        ? tx("Reopen", "إعادة فتح")
                        : tx("Complete", "إكمال")
                    }
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 className="text-primary" />
                    ) : (
                      <Circle />
                    )}
                  </Button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`font-medium ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}
                      >
                        {task.title}
                      </p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {tx(
                          task.category,
                          task.category === "university"
                            ? "الجامعة"
                            : task.category === "studying"
                              ? "مذاكرة"
                              : task.category === "personal"
                                ? "شخصي"
                                : task.category === "projects"
                                  ? "مشاريع"
                                  : "أخرى",
                        )}
                      </span>
                      <span
                        className={`text-xs ${task.priority === "urgent" || task.priority === "high" ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {tx(
                          task.priority,
                          task.priority === "urgent"
                            ? "عاجلة"
                            : task.priority === "high"
                              ? "عالية"
                              : task.priority === "low"
                                ? "منخفضة"
                                : "متوسطة",
                        )}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {task.due_at && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {fmtDate(task.due_at)} · {fmtTime(task.due_at)}
                        </span>
                      )}
                      {task.estimated_minutes && (
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {task.estimated_minutes} {tx("min", "دقيقة")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={tx("Edit", "تعديل")}
                      onClick={() => openEdit(task)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={tx("Delete", "حذف")}
                      onClick={() => {
                        if (window.confirm(tx("Delete this task?", "هل تريد حذف هذه المهمة؟")))
                          removeTask.mutate(task.id);
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
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              {tx("Today's schedule", "جدول اليوم")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {fmtDate(today, { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysEvents.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">
                {tx("No events scheduled today.", "لا توجد فعاليات مجدولة اليوم.")}
              </p>
            ) : (
              todaysEvents.map((event) => (
                <div
                  key={`${event.id}-${event.occ.toISOString()}`}
                  className="flex gap-3 border-s-2 border-primary/40 ps-3"
                >
                  <div className="min-w-14 text-xs font-medium text-muted-foreground">
                    {fmtTime(event.occ)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    {event.location && (
                      <p className="truncate text-xs text-muted-foreground">{event.location}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            <Button asChild variant="outline" className="w-full">
              <Link to="/calendar">{tx("Open calendar", "فتح التقويم")}</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/events">
                <ArrowUpDown className="h-4 w-4" />
                {tx("Manage events", "إدارة الفعاليات")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
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
