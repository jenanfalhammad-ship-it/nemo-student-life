import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpDown,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  ListTodo,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
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
type DateFilter = "all" | "open" | "today" | "overdue" | "completed";
type PriorityFilter = "all" | "high" | "medium" | "low";
const blankDraft = (): Draft => ({
  title: "",
  description: "",
  due_at: "",
  priority: "medium",
  category: "university",
  estimated_minutes: "",
});
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

function TasksPage() {
  const { tx, fmtDate, fmtTime } = useTx();
  const { data: tasks = [], isLoading, isError } = useRows("tasks", { order: "due_at", asc: true });
  const { data: events = [] } = useRows("events", { order: "starts_at", asc: true });
  const addTask = useInsert("tasks");
  const updateTask = useUpdate("tasks");
  const removeTask = useRemove("tasks");
  const [dateFilter, setDateFilter] = useState<DateFilter>("open");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row<"tasks"> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const current = new Date();
    return new Date(current.getFullYear(), current.getMonth(), 1);
  });
  const today = new Date();
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const calendarCells = Array.from(
    { length: 42 },
    (_, index) =>
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth(),
        index - monthStart.getDay() + 1,
      ),
  );
  const locale = tx("en-US", "ar-SA");
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    new Date(2025, 5, 1 + index).toLocaleDateString(locale, { weekday: "short" }),
  );
  const taskDates = new Set(
    tasks.filter((task) => task.due_at).map((task) => dayKey(new Date(task.due_at!))),
  );
  const eventDates = new Set(events.map((event) => dayKey(new Date(event.starts_at))));
  const scheduleDate = selectedDate ?? today;
  const scheduleEvents = events
    .filter((event) => dayKey(new Date(event.starts_at)) === dayKey(scheduleDate))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  const visibleTasks = tasks.filter((task) => {
    const todayDue = !!task.due_at && dayKey(new Date(task.due_at)) === dayKey(today);
    const overdue = !!task.due_at && new Date(task.due_at) < today && task.status !== "completed";
    const matchesDate = selectedDate
      ? !!task.due_at && dayKey(new Date(task.due_at)) === dayKey(selectedDate)
      : dateFilter === "all" ||
        (dateFilter === "open" && task.status !== "completed") ||
        (dateFilter === "today" && todayDue) ||
        (dateFilter === "overdue" && overdue) ||
        (dateFilter === "completed" && task.status === "completed");
    const matchesPriority =
      priorityFilter === "all" ||
      (priorityFilter === "high" && (task.priority === "high" || task.priority === "urgent")) ||
      task.priority === priorityFilter;
    const matchesSearch = `${task.title} ${task.description ?? ""} ${task.category}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesDate && matchesPriority && matchesSearch;
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
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
  const advanceTask = (task: Row<"tasks">) => {
    const status =
      task.status === "completed"
        ? "todo"
        : task.status === "in_progress"
          ? "completed"
          : "in_progress";
    updateTask.mutate({
      id: task.id,
      values: { status, completed_at: status === "completed" ? new Date().toISOString() : null },
    });
  };

  const dateFilters: { id: DateFilter; label: string }[] = [
    { id: "open", label: tx("Open", "المفتوحة") },
    { id: "today", label: tx("Due today", "اليوم") },
    { id: "overdue", label: tx("Overdue", "المتأخرة") },
    { id: "completed", label: tx("Completed", "المكتملة") },
    { id: "all", label: tx("All", "الكل") },
  ];
  const priorityFilters: { id: PriorityFilter; label: string; active: string }[] = [
    {
      id: "all",
      label: tx("All tasks", "كل المهام"),
      active: "border-primary/30 bg-primary/10 text-primary-deep",
    },
    {
      id: "high",
      label: tx("High priority", "أولوية عالية"),
      active:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
    },
    {
      id: "medium",
      label: tx("Medium", "متوسطة"),
      active:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    },
    {
      id: "low",
      label: tx("Low", "منخفضة"),
      active: "border-sky-200 bg-sky/70 text-sky-ink dark:border-sky-900",
    },
  ];
  const columns = [
    {
      id: "in_progress",
      label: tx("In Progress", "قيد التنفيذ"),
      dot: "bg-violet-500",
      rule: "bg-violet-500",
      surface: "bg-violet-50/55 dark:bg-violet-950/15",
      tasks: visibleTasks.filter((task) => task.status === "in_progress"),
    },
    {
      id: "todo",
      label: tx("To Do", "للبدء"),
      dot: "bg-amber-500",
      rule: "bg-amber-500",
      surface: "bg-amber-50/55 dark:bg-amber-950/15",
      tasks: visibleTasks.filter(
        (task) => task.status !== "completed" && task.status !== "in_progress",
      ),
    },
    {
      id: "completed",
      label: tx("Completed", "مكتملة"),
      dot: "bg-emerald-500",
      rule: "bg-emerald-500",
      surface: "bg-emerald-50/45 dark:bg-emerald-950/15",
      tasks: visibleTasks.filter((task) => task.status === "completed"),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-lavender/45 p-5 shadow-soft sm:p-7">
        <div className="pointer-events-none absolute -end-8 -top-12 h-48 w-48 rounded-full bg-peach/60 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <CalendarDays className="h-4 w-4" />
              {fmtDate(today, { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {tx("Your tasks", "مهامك")}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {tx(
                "Turn your next steps into a clear, colorful path forward.",
                "حوّل خطواتك القادمة إلى مسار واضح ومليء بالحيوية.",
              )}
            </p>
          </div>
          <Button onClick={openNew} className="shadow-sm">
            <Plus />
            {tx("Add task", "إضافة مهمة")}
          </Button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={tx("In progress", "قيد التنفيذ")}
          value={tasks.filter((task) => task.status === "in_progress").length}
          icon={<Play className="h-4 w-4" />}
          tone="bg-lavender text-violet-700 dark:text-violet-200"
        />
        <Stat
          label={tx("To do", "للبدء")}
          value={
            tasks.filter((task) => task.status !== "completed" && task.status !== "in_progress")
              .length
          }
          icon={<Circle className="h-4 w-4" />}
          tone="bg-peach text-orange-700 dark:text-orange-200"
        />
        <Stat
          label={tx("Completed", "مكتملة")}
          value={tasks.filter((task) => task.status === "completed").length}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="bg-sage-soft text-primary-deep"
        />
      </div>

      {showForm && (
        <Card className="border-primary/30 shadow-lift">
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
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
              <Input
                type="datetime-local"
                aria-label={tx("Due date", "تاريخ الاستحقاق")}
                value={draft.due_at}
                onChange={(event) => setDraft({ ...draft, due_at: event.target.value })}
              />
              <Textarea
                placeholder={tx("Notes (optional)", "ملاحظات (اختياري)")}
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
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
                onChange={(event) => setDraft({ ...draft, estimated_minutes: event.target.value })}
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

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={tx("Filter by priority", "تصفية حسب الأولوية")}
        >
          {priorityFilters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPriorityFilter(item.id)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${priorityFilter === item.id ? item.active : "bg-card text-muted-foreground hover:bg-muted"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 sm:w-60">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="ps-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tx("Search tasks…", "ابحث في المهام…")}
            />
          </div>
          <Select
            value={dateFilter}
            onValueChange={(value) => {
              setDateFilter(value as DateFilter);
              setSelectedDate(null);
            }}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateFilters.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          {isLoading ? (
            <div className="rounded-3xl border bg-card p-12 text-center text-sm text-muted-foreground">
              {tx("Loading tasks…", "جارٍ تحميل المهام…")}
            </div>
          ) : isError ? (
            <div className="rounded-3xl border border-destructive/40 bg-card p-12 text-center text-sm text-destructive">
              {tx("Could not load tasks. Please try again.", "تعذر تحميل المهام. حاول مجددًا.")}
            </div>
          ) : (
            <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {columns.map((column) => (
                <section
                  key={column.id}
                  className={`min-w-0 overflow-hidden rounded-3xl border p-2.5 sm:p-3 ${column.surface}`}
                  aria-label={column.label}
                >
                  <div className="mb-3 flex items-center justify-between px-1.5 pt-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${column.dot}`} />
                      <h2 className="truncate text-sm font-extrabold">{column.label}</h2>
                      <span className="text-xs text-muted-foreground">{column.tasks.length}</span>
                    </div>
                    <span className={`h-1 w-12 rounded-full ${column.rule}`} />
                  </div>

                  <div className="flex min-h-40 flex-col gap-2.5">
                    {column.tasks.map((task) => {
                      const isDone = task.status === "completed";
                      const isInProgress = task.status === "in_progress";
                      const priorityTone =
                        task.priority === "urgent"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200"
                          : task.priority === "high"
                            ? "bg-peach text-orange-800 dark:text-orange-200"
                            : task.priority === "low"
                              ? "bg-sky text-sky-ink"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
                      const categoryName =
                        task.category === "university"
                          ? tx("University", "الجامعة")
                          : task.category === "studying"
                            ? tx("Studying", "مذاكرة")
                            : task.category === "personal"
                              ? tx("Personal", "شخصي")
                              : task.category === "projects"
                                ? tx("Projects", "مشاريع")
                                : task.category === "activities"
                                  ? tx("Activities", "أنشطة")
                                  : tx("Other", "أخرى");
                      return (
                        <article
                          key={task.id}
                          className={`group rounded-2xl border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isDone ? "opacity-80" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(task)}
                              className={`min-w-0 text-start text-sm font-extrabold leading-snug hover:text-primary ${isDone ? "text-muted-foreground line-through" : ""}`}
                            >
                              {task.title}
                            </button>
                            <div className="flex shrink-0 gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                aria-label={tx("Edit", "تعديل")}
                                onClick={() => openEdit(task)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                aria-label={tx("Delete", "حذف")}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      tx("Delete this task?", "هل تريد حذف هذه المهمة؟"),
                                    )
                                  )
                                    removeTask.mutate(task.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {task.description && (
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold ${priorityTone}`}
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
                            <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                              {categoryName}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 text-[10px] text-muted-foreground">
                            {task.due_at && (
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3 w-3 text-primary" />
                                {fmtDate(task.due_at)} · {fmtTime(task.due_at)}
                              </span>
                            )}
                            {task.estimated_minutes && (
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="h-3 w-3" />
                                {task.estimated_minutes} {tx("min", "دقيقة")}
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant={isDone ? "outline" : "ghost"}
                            className={`mt-2 h-8 w-full justify-start text-xs ${isInProgress ? "text-emerald-700 hover:text-emerald-800 dark:text-emerald-300" : ""}`}
                            onClick={() => advanceTask(task)}
                          >
                            {isDone ? (
                              <RotateCcw className="h-3.5 w-3.5" />
                            ) : isInProgress ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                            {isDone
                              ? tx("Reopen task", "إعادة فتح المهمة")
                              : isInProgress
                                ? tx("Mark complete", "إكمال المهمة")
                                : tx("Start task", "ابدأ المهمة")}
                          </Button>
                        </article>
                      );
                    })}
                    {column.tasks.length === 0 && (
                      <div className="grid min-h-28 place-items-center rounded-2xl border border-dashed bg-background/45 px-3 py-5 text-center text-xs text-muted-foreground">
                        <div>
                          <ListTodo className="mx-auto h-5 w-5 opacity-50" />
                          <p className="mt-2">{tx("Nothing here yet", "لا توجد مهام هنا بعد")}</p>
                        </div>
                      </div>
                    )}
                    {column.id === "todo" && (
                      <button
                        type="button"
                        onClick={openNew}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-dashed bg-background/45 px-3 py-2 text-xs font-bold text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                      >
                        <Plus className="h-4 w-4" />
                        {tx("Add task", "إضافة مهمة")}
                      </button>
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="overflow-hidden shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">{tx("Calendar", "التقويم")}</CardTitle>
                <p className="mt-1 text-sm font-semibold text-primary">
                  {calendarMonth.toLocaleDateString(locale, { month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={tx("Previous month", "الشهر السابق")}
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={tx("Next month", "الشهر التالي")}
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-1 grid grid-cols-7 gap-1 text-center">
                {weekDays.map((day, index) => (
                  <span
                    key={`${day}-${index}`}
                    className="py-1 text-[10px] font-bold text-muted-foreground"
                  >
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((date) => {
                  const inMonth = date.getMonth() === calendarMonth.getMonth();
                  const selected = selectedDate
                    ? dayKey(date) === dayKey(selectedDate)
                    : dayKey(date) === dayKey(today);
                  const hasTasks = taskDates.has(dayKey(date));
                  const hasEvents = eventDates.has(dayKey(date));
                  return (
                    <button
                      key={dayKey(date)}
                      type="button"
                      aria-label={fmtDate(date, { weekday: "long", month: "long", day: "numeric" })}
                      aria-pressed={selected}
                      onClick={() => {
                        setSelectedDate(date);
                        setDateFilter("all");
                        if (!inMonth)
                          setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                      }}
                      className={`grid aspect-square min-w-0 place-items-center rounded-xl text-xs transition ${selected ? "bg-primary font-extrabold text-primary-foreground shadow-sm" : inMonth ? "text-foreground hover:bg-primary/10" : "text-muted-foreground/40 hover:bg-muted"} ${!selected && dayKey(date) === dayKey(today) ? "ring-1 ring-primary/40" : ""}`}
                    >
                      <span>{date.getDate()}</span>
                      <span className="flex h-1.5 items-center gap-0.5">
                        {hasTasks && (
                          <span
                            className={`h-1 w-1 rounded-full ${selected ? "bg-white" : "bg-amber-500"}`}
                          />
                        )}
                        {hasEvents && (
                          <span
                            className={`h-1 w-1 rounded-full ${selected ? "bg-white/70" : "bg-violet-500"}`}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 border-t pt-3 text-[10px] font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {tx("Tasks", "مهام")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  {tx("Events", "فعاليات")}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="h-fit shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky text-sky-ink">
                  <CalendarDays className="h-4 w-4" />
                </span>
                {selectedDate
                  ? tx("Selected day schedule", "جدول اليوم المحدد")
                  : tx("Today's schedule", "جدول اليوم")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {fmtDate(scheduleDate, { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {scheduleEvents.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  {tx("No events scheduled for this day.", "لا توجد فعاليات مجدولة في هذا اليوم.")}
                </p>
              ) : (
                scheduleEvents.map((event) => (
                  <div key={event.id} className="flex gap-3 border-s-2 border-primary/50 ps-3">
                    <div className="min-w-14 text-xs font-semibold text-primary">
                      {fmtTime(event.starts_at)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{event.title}</p>
                      {event.location && (
                        <p className="truncate text-xs text-muted-foreground">{event.location}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <Button asChild variant="outline" className="w-full">
                <Link to="/calendar">
                  <CalendarDays />
                  {tx("Open calendar", "فتح التقويم")}
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/events">
                  <ArrowUpDown className="h-4 w-4" />
                  {tx("Manage events", "إدارة الفعاليات")}
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Link
            to="/ask"
            className="group block rounded-2xl border bg-gradient-to-br from-lavender/65 via-card to-peach/60 p-4 transition hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/80 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold">
                  {tx("Not sure what to do next?", "مو متأكد وش تسوي بعد؟")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tx("Ask Nemo for a thoughtful recommendation.", "اسأل نيمو عن توصية تناسبك.")}
                </p>
              </div>
            </div>
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-extrabold">{value}</p>
        </div>
        <span className={`rounded-xl p-2.5 ${tone}`}>{icon}</span>
      </CardContent>
    </Card>
  );
}
