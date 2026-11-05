import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Check, Clock3, ListTodo, Send, Sparkles, Trash2 } from "lucide-react";
import { Card, Chip, PageHeader } from "@/components/kit";
import { Nemo } from "@/components/nemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInsert, useRemove, useRows, useUpdate } from "@/lib/data";
import { useTx } from "@/lib/tx";

type Message = { id: number; role: "nemo" | "user"; text: string; action?: "confirm-delete" | "confirm-reminder"; targetId?: string };

type Pending = { kind: "delete" | "reminder"; title: string; id?: string; date?: string } | null;

export const Route = createFileRoute("/_authenticated/ask")({
  head: () => ({ meta: [{ title: "Ask Nemo — NEMO" }, { name: "description", content: "Nemo can plan and update your workspace." }] }),
  component: AskNemo,
});

const nextWeekDate = () => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(18, 0, 0, 0); return d.toISOString(); };
const tomorrowDate = (hour = 18) => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(hour, 0, 0, 0); return d.toISOString(); };
const cleanTitle = (value: string) => value.replace(/^(مهمة|فعالية|موعد|تذكير)\s*/i, "").replace(/^(to do|task|event|reminder)\s*/i, "").trim();

function AskNemo() {
  const { tx, locale, dir } = useTx();
  const { data: tasks = [] } = useRows("tasks", { order: "due_at", asc: true });
  const { data: events = [] } = useRows("events", { order: "starts_at", asc: true });
  const { data: reminders = [] } = useRows("reminders", { order: "remind_at", asc: true });
  const { data: countdowns = [] } = useRows("countdowns", { order: "target_at", asc: true });
  const { data: courses = [] } = useRows("courses", { order: "name", asc: true });
  const addTask = useInsert("tasks"); const updateTask = useUpdate("tasks"); const removeTask = useRemove("tasks");
  const addEvent = useInsert("events"); const removeEvent = useRemove("events");
  const addReminder = useInsert("reminders"); const removeReminder = useRemove("reminders");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: "nemo", text: tx("Hey! I can see your NEMO workspace and add, update, complete or remove things with your permission. Try: add a task for tomorrow.", "هلا! أنا نيمو، أقدر أشوف مساحة نيمو وأضيف وأعدّل وأنجز وأحذف بإذنك. جربي: أضف مهمة لبكرة.") }]);

  const openTasks = useMemo(() => tasks.filter((task) => task.status !== "completed"), [tasks]);
  const dateText = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" }) : tx("no date", "بدون تاريخ");
  const add = (message: Message) => setMessages((current) => [...current, message]);
  const findTask = (title: string) => openTasks.find((task) => task.title.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(task.title.toLowerCase()));
  const findEvent = (title: string) => events.find((event) => event.title.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(event.title.toLowerCase()));

  async function executePending() {
    if (!pending) return;
    if (pending.kind === "delete" && pending.id) {
      const task = tasks.find((item) => item.id === pending.id); const event = events.find((item) => item.id === pending.id); const reminder = reminders.find((item) => item.id === pending.id);
      if (task) await removeTask.mutateAsync(task.id); else if (event) await removeEvent.mutateAsync(event.id); else if (reminder) await removeReminder.mutateAsync(reminder.id);
      add({ id: Date.now(), role: "nemo", text: tx(`Done — I removed “${pending.title}”.`, `تم — حذفت «${pending.title}».`) });
    }
    if (pending.kind === "reminder") { await addReminder.mutateAsync({ title: pending.title, description: tx("Saved by Nemo from your chat.", "حفظه نيمو من المحادثة."), category: "academic", priority: "high", remind_at: pending.date ?? nextWeekDate(), repeat: "none", done: false }); add({ id: Date.now(), role: "nemo", text: tx("Saved! I’ll remind you at the right time.", "تم الحفظ! بذكرك في الوقت المناسب.") }); }
    setPending(null);
  }

  async function respond(raw: string) {
    const text = raw.trim(); const lower = text.toLowerCase();
    if (/^(نعم|اي|إي|أكيد|موافق|yes|ok|تمام)/i.test(text) && pending) { await executePending(); return; }
    if (/^(لا|لا خلاص|no|cancel)/i.test(text) && pending) { setPending(null); add({ id: Date.now(), role: "nemo", text: tx("ولا يهمك، ما غيرت أي شيء.", "ولا يهمك، ما غيرت أي شيء.") }); return; }

    const isAddTask = /أضف|ضيف|سجل|add|create/i.test(lower) && /مهمة|task|تو ?دو/i.test(lower);
    if (isAddTask) { const title = cleanTitle(text.replace(/.*?(مهمة|task|تو ?دو)/i, "")); const due = /بكرة|غدا|tomorrow/i.test(text) ? tomorrowDate() : null; const result = await addTask.mutateAsync({ title: title || tx("New task", "مهمة جديدة"), description: null, due_at: due, estimated_minutes: 30, category: "other", priority: "medium", status: "todo", completed_at: null }); add({ id: Date.now(), role: "nemo", text: tx(`Added “${result[0]?.title ?? title}” to your to-do list${due ? ` — due ${dateText(due)}` : ""}.`, `أضفت «${result[0]?.title ?? title}» لقائمة مهامك${due ? ` — موعدها ${dateText(due)}` : ""}.`) }); return; }
    const isAddEvent = /أضف|ضيف|سجل|add|create/i.test(lower) && /فعالية|موعد|event|appointment/i.test(lower);
    if (isAddEvent) { const title = cleanTitle(text.replace(/.*?(فعالية|موعد|event|appointment)/i, "")); const start = /بكرة|غدا|tomorrow/i.test(text) ? tomorrowDate(10) : tomorrowDate(10); const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString(); await addEvent.mutateAsync({ title: title || tx("New event", "فعالية جديدة"), description: null, starts_at: start, ends_at: end, kind: "appointment", location: null, link: null, recurrence: "none", course_id: null }); add({ id: Date.now(), role: "nemo", text: tx(`Added “${title || "New event"}” to your calendar for ${dateText(start)}.`, `أضفت «${title || "فعالية جديدة"}» لتقويمك في ${dateText(start)}.`) }); return; }
    const taskToComplete = openTasks.find((task) => /أنجز|خلص|complete|done|تمت/i.test(lower) && lower.includes(task.title.toLowerCase()));
    if (taskToComplete) { await updateTask.mutateAsync({ id: taskToComplete.id, values: { status: "completed", completed_at: new Date().toISOString() } }); add({ id: Date.now(), role: "nemo", text: tx(`Nice! “${taskToComplete.title}” is marked complete. Tiny win, big energy.`, `يا سلام! علّمت «${taskToComplete.title}» كمكتملة. إنجاز صغير بطاقة كبيرة.`) }); return; }
    const deletionPhrase = /احذف|شيل|امسح|delete|remove/i.test(lower);
    if (deletionPhrase) { const title = cleanTitle(text.replace(/.*?(احذف|شيل|امسح|delete|remove)/i, "")); const match = findTask(title) ?? findEvent(title) ?? reminders.find((item) => item.title.toLowerCase().includes(title.toLowerCase())); if (!match) { add({ id: Date.now(), role: "nemo", text: tx("I couldn’t find that item. Tell me its exact title and I’ll look again.", "ما لقيت العنصر. اكتبي عنوانه بالضبط وأنا أبحث عنه مرة ثانية.") }); return; } setPending({ kind: "delete", id: match.id, title: match.title }); add({ id: Date.now(), role: "nemo", text: tx(`I found “${match.title}”. Should I delete it? Reply yes or no.`, `لقيت «${match.title}». أحذفه؟ ردي بنعم أو لا.`) }); return; }
    if (/ذكرني|ذكّرني|remind/i.test(lower)) { const title = cleanTitle(text.replace(/.*?(ذكرني|ذكّرني|remind)/i, "")) || tx("Review your upcoming deadlines", "راجعي التسليمات القادمة"); setPending({ kind: "reminder", title, date: /بكرة|غدا|tomorrow/i.test(text) ? tomorrowDate() : nextWeekDate() }); add({ id: Date.now(), role: "nemo", text: tx(`I can save a reminder for “${title}”. Reply yes and I’ll add it, or no to cancel.`, `أقدر أحفظ تذكير «${title}». ردي بنعم عشان أضيفه أو لا للإلغاء.`) }); return; }
    if (/وش|ايش|ماذا|عندي|list|show|what|calendar|جدول|مهام|tasks/i.test(lower)) {
      const lines = [tx(`You have ${openTasks.length} open tasks, ${events.length} calendar events, ${reminders.filter((r) => !r.done).length} reminders and ${countdowns.length} countdowns.`, `عندك ${openTasks.length} مهام مفتوحة، ${events.length} فعاليات، ${reminders.filter((r) => !r.done).length} تذكيرات و${countdowns.length} عدادات.`), ...openTasks.slice(0, 4).map((task) => `• ${task.title} — ${dateText(task.due_at)}`), ...events.slice(0, 3).map((event) => `• ${event.title} — ${dateText(event.starts_at)}`)]; add({ id: Date.now(), role: "nemo", text: lines.join("\n") }); return; }
    if (/خطة|plan|ضغط|busy|أسبوع/i.test(lower)) { const plan = openTasks.slice(0, 4).map((task, index) => `${index + 1}. ${task.title} — ${task.estimated_minutes ?? 30} ${tx("min", "دقيقة")}`); add({ id: Date.now(), role: "nemo", text: plan.length ? tx(`I checked your workspace and made a light plan:\n${plan.join("\n")}\n\nStart with the nearest deadline, then take a proper break.`, `راجعت مساحتك وسويت لك خطة خفيفة:\n${plan.join("\n")}\n\nابدئي بأقرب تسليم، وبعدها خذي بريك حقيقي.`) : tx("Your list is clear! Add a task and I’ll help you split it into doable steps.", "قائمتك فاضية! أضيفي مهمة وأنا أقسمها لك لخطوات سهلة." ) }); return; }
    add({ id: Date.now(), role: "nemo", text: tx("I’m with you. I can list your workspace, add or delete tasks and events, mark tasks done, save reminders, or make a study plan. What should we do first?", "أنا معك. أقدر أعرض مساحتك، أضيف أو أحذف مهام وفعاليات، أعلّم المهام كمكتملة، أحفظ تذكيرات، أو أسوي خطة مذاكرة. وش نبدأ فيه؟") });
  }

  const send = async (value = input) => { const text = value.trim(); if (!text) return; add({ id: Date.now(), role: "user", text }); setInput(""); await respond(text); };
  return <div dir={dir} className="mx-auto w-full max-w-5xl pb-10"><PageHeader title={tx("Ask Nemo", "اسأل نيمو")} sub={tx("A real workspace companion: ask, plan, add, update and tidy up.", "رفيق مساحة حقيقي: اسألي، خططي، أضيفي، عدّلي ورتبي.")} /><section className="relative mb-5 overflow-hidden rounded-3xl border bg-gradient-to-br from-[#ffe5dc] via-card to-[#e7e0f8] p-5 shadow-sm sm:p-7"><div className="relative flex items-center gap-4"><Nemo mood="happy" float className="h-20 w-20 shrink-0" /><div><Chip className="bg-white/70"><Sparkles className="me-1 h-3 w-3" />{tx("Nemo is listening", "نيمو يسمعك")}</Chip><h2 className="mt-2 text-xl font-bold">{tx("Tell me what’s on your mind — I’ll help you make it lighter.", "قولي لي وش في بالك — وأنا أساعدك نخليه أخف.")}</h2></div></div></section><div className="grid gap-5 lg:grid-cols-[1fr_270px]"><Card className="overflow-hidden p-0"><div className="max-h-[560px] space-y-4 overflow-y-auto p-4 sm:p-6">{messages.map((message) => <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}><div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-line ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/70"}`}>{message.role === "nemo" && <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary"><Sparkles className="h-3 w-3" />NEMO</div>}{message.text}</div></div>)}</div><div className="border-t bg-muted/20 p-3"><div className="flex gap-2"><Input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void send(); }} placeholder={tx("Try: أضف مهمة أراجع المحاضرة بكرة…", "جربي: أضف مهمة أراجع المحاضرة بكرة…")} /><Button size="icon" onClick={() => void send()} aria-label={tx("Send", "إرسال")}><Send /></Button></div></div></Card><aside className="space-y-3"><Card title={tx("I can do this", "أقدر أسوي هذا")}><div className="grid gap-2 text-sm"><Quick icon={ListTodo} text={tx("وش عندي؟", "وش عندي؟")} onClick={() => void send("وش عندي؟")} /><Quick icon={CalendarDays} text={tx("أضف فعالية بكرة", "أضف فعالية بكرة")} onClick={() => void send("أضف فعالية بكرة")} /><Quick icon={Check} text={tx("سوي لي خطة", "سوي لي خطة")} onClick={() => void send("سوي لي خطة")} /><Quick icon={Clock3} text={tx("ذكرني الأسبوع الجاي", "ذكرني الأسبوع الجاي")} onClick={() => void send("ذكرني بمراجعة التسليم الأسبوع الجاي")} /><Quick icon={Trash2} text={tx("احذف مهمة", "احذف مهمة")} onClick={() => void send("احذف Review lecture 4 notes")} /></div></Card><Card><p className="text-xs leading-5 text-muted-foreground">{tx(`${openTasks.length} open tasks · ${events.length} events · ${courses.length} courses`, `${openTasks.length} مهام مفتوحة · ${events.length} فعاليات · ${courses.length} مواد`)}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{tx("Nemo asks before destructive actions. It never silently deletes anything.", "نيمو يستأذن قبل الحذف، وما يحذف أي شيء بصمت.")}</p></Card></aside></div></div>;
}
function Quick({ icon: Icon, text, onClick }: { icon: typeof ListTodo; text: string; onClick: () => void }) { return <button onClick={onClick} className="flex items-center gap-2 rounded-xl border p-3 text-start transition hover:-translate-y-0.5 hover:bg-muted"><Icon className="h-4 w-4 text-primary" />{text}</button>; }
