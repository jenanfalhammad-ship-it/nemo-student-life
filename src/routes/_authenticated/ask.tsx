import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Check, Clock3, Lightbulb, Send, Sparkles, Target } from "lucide-react";
import { Card, Chip, PageHeader } from "@/components/kit";
import { Nemo } from "@/components/nemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInsert, useRows } from "@/lib/data";
import { useTx } from "@/lib/tx";

type Message = { id: number; role: "nemo" | "user"; text: string; plan?: string[]; reminder?: { title: string; date: string } };

export const Route = createFileRoute("/_authenticated/ask")({
  head: () => ({ meta: [{ title: "Ask Nemo — NEMO" }, { name: "description", content: "Your practical academic companion." }] }),
  component: AskNemo,
});

function dateLabel(date: Date, locale: string) {
  return date.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" });
}

function AskNemo() {
  const { tx, locale, dir } = useTx();
  const { data: tasks = [] } = useRows("tasks", { order: "due_at", asc: true });
  const { data: events = [] } = useRows("events", { order: "starts_at", asc: true });
  const { data: reminders = [] } = useRows("reminders", { order: "remind_at", asc: true });
  const addReminder = useInsert("reminders");
  const [input, setInput] = useState("");
  const [sent, setSent] = useState(0);
  const [savedReminder, setSavedReminder] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "nemo", text: tx("Hey! I can look at your tasks, events and reminders, then help you make a realistic plan. Try asking: What do I have tomorrow?", "هلا! أقدر أراجع مهامك وفعالياتك وتذكيراتك وأرتب لك خطة واقعية. جربي: وش عندي بكرة؟") },
  ]);

  const upcoming = useMemo(() => tasks.filter((task) => task.status !== "completed" && task.due_at).slice(0, 6), [tasks]);

  const respond = (raw: string): Message => {
    const text = raw.toLowerCase();
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow); tomorrowEnd.setHours(23, 59, 59, 999);
    if (text.includes("بكرة") || text.includes("غدا") || text.includes("tomorrow")) {
      const tomorrowTasks = tasks.filter((item) => item.due_at && new Date(item.due_at) >= tomorrow && new Date(item.due_at) <= tomorrowEnd);
      const tomorrowEvents = events.filter((item) => new Date(item.starts_at) >= tomorrow && new Date(item.starts_at) <= tomorrowEnd);
      const lines = [...tomorrowEvents.map((item) => `• ${item.title} — ${new Date(item.starts_at).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}`), ...tomorrowTasks.map((item) => `• ${item.title}`)];
      return { id: Date.now(), role: "nemo", text: lines.length ? tx(`Tomorrow looks like this:\n${lines.join("\n")}`, `بكرة عندك:\n${lines.join("\n")}`) : tx("Tomorrow is clear so far — a good day to get ahead.", "بكرة فاضي إلى الآن — فرصة حلوة تسبقين الضغط.") };
    }
    if (text.includes("خطة") || text.includes("plan") || text.includes("free") || text.includes("ساعات")) {
      const plan = upcoming.slice(0, 3).map((item, index) => `${index + 1}. ${item.title} — ${item.estimated_minutes ?? 30} min`);
      return { id: Date.now(), role: "nemo", text: tx("I built a gentle starting plan from your open tasks. Keep the first block small, then take a real break.", "سويت لك خطة بداية خفيفة من مهامك المفتوحة. ابدئي بأول جزء صغير وخذي استراحة فعلية بعدها."), plan: plan.length ? plan : [tx("Add one task and I will shape a plan around it.", "أضيفي مهمة واحدة وأنا أرتب لك خطة حولها.")] };
    }
    if (text.includes("ذكرني") || text.includes("ذكّرني") || text.includes("remind")) {
      const date = new Date(); date.setDate(date.getDate() + 7); date.setHours(18, 0, 0, 0);
      return { id: Date.now(), role: "nemo", text: tx("I can save a reminder for next week at 6:00 PM. Want me to add it?", "أقدر أحفظ لك تذكير الأسبوع الجاي الساعة ٦ مساءً. تبين أضيفه؟"), reminder: { title: raw.replace(/ذكرني|ذكّرني|remind/gi, "").trim() || tx("Review upcoming deadlines", "راجعي التسليمات القادمة"), date: date.toISOString() } };
    }
    const open = tasks.filter((item) => item.status !== "completed").length;
    const next = upcoming[0];
    return { id: Date.now(), role: "nemo", text: next ? tx(`You have ${open} open tasks. Your next deadline is “${next.title}”. Want a plan, a reminder, or a quick summary of tomorrow?`, `عندك ${open} مهام مفتوحة. أقرب استحقاق هو «${next.title}». تبين خطة، تذكير، أو ملخص بكرة؟`) : tx("Your workspace is calm right now. Add a task or event and I will help you turn it into a plan.", "مساحتك هادئة حاليًا. أضيفي مهمة أو فعالية وأنا أساعدك نحولها لخطة.") };
  };

  const send = (value = input) => {
    const trimmed = value.trim(); if (!trimmed) return;
    const answer = respond(trimmed);
    setMessages((current) => [...current, { id: sent + 1, role: "user", text: trimmed }, answer]);
    setSent((value) => value + 2); setInput(""); setSavedReminder(false);
  };

  const saveReminder = (message: Message) => {
    if (!message.reminder) return;
    addReminder.mutate({ title: message.reminder.title, category: "academic", priority: "high", remind_at: message.reminder.date, repeat: "none", done: false, description: tx("Suggested by Nemo from your chat.", "اقترحه نيمو من المحادثة.") });
    setSavedReminder(true);
  };

  return (
    <div dir={dir} className="mx-auto w-full max-w-4xl pb-10">
      <PageHeader title={tx("Ask Nemo", "اسأل نيمو")} sub={tx("Your cheerful academic sidekick — grounded in your real workspace.", "مساعدك الجامعي الفرفوش — يفهم بيانات مساحتك الفعلية.")} />
      <section className="relative mb-5 overflow-hidden rounded-3xl border bg-gradient-to-br from-[#ffe5dc] via-card to-[#e7e0f8] p-5 shadow-sm sm:p-7">
        <div className="absolute -end-10 -top-12 h-44 w-44 rounded-full bg-[#f9a38f]/30 blur-3xl" />
        <div className="relative flex items-center gap-4"><Nemo mood="happy" float className="h-20 w-20 shrink-0" /><div><Chip className="bg-white/70"><Sparkles className="me-1 h-3 w-3" />{tx("Nemo is ready", "نيمو جاهز")}</Chip><h2 className="mt-2 text-xl font-bold">{tx("Let’s make the busy week feel lighter.", "خلّينا نخلي الأسبوع المزدحم أخف عليك.")}</h2></div></div>
      </section>
      <div className="grid gap-5 lg:grid-cols-[1fr_250px]">
        <Card className="overflow-hidden p-0">
          <div className="max-h-[520px] space-y-4 overflow-y-auto p-4 sm:p-6">
            {messages.map((message) => <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-line ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/70"}`}>{message.role === "nemo" && <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary"><Sparkles className="h-3 w-3" />NEMO</div>}{message.text}{message.plan && <div className="mt-3 space-y-2 rounded-xl bg-background/70 p-3 text-foreground">{message.plan.map((line) => <div key={line} className="flex gap-2 text-sm"><Target className="mt-1 h-4 w-4 shrink-0 text-primary" />{line}</div>)}</div>}{message.reminder && <div className="mt-3 rounded-xl border bg-background/80 p-3 text-foreground"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4" />{dateLabel(new Date(message.reminder.date), locale)}</div><p className="mt-1 font-medium">{message.reminder.title}</p><Button size="sm" className="mt-3" onClick={() => saveReminder(message)} disabled={savedReminder || addReminder.isPending}>{savedReminder ? <><Check />{tx("Saved", "تم الحفظ")}</> : tx("Save reminder", "حفظ التذكير")}</Button></div>}</div></div>)}
          </div>
          <div className="border-t bg-muted/20 p-3"><div className="flex gap-2"><Input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder={tx("Ask about your day, deadlines or a study plan…", "اسألي عن يومك أو التسليمات أو خطة مذاكرة…")} /><Button size="icon" onClick={() => send()} aria-label={tx("Send", "إرسال")}><Send /></Button></div></div>
        </Card>
        <aside className="space-y-3"><Card title={tx("Try asking", "جربي تسألين")}><div className="grid gap-2">{[tx("What do I have tomorrow?", "وش عندي بكرة؟"), tx("Make me a plan for this week", "سوي لي خطة لهذا الأسبوع"), tx("Remind me about my next deadline", "ذكرني بأقرب تسليم")].map((prompt) => <button key={prompt} onClick={() => send(prompt)} className="rounded-xl border p-3 text-start text-sm transition hover:-translate-y-0.5 hover:bg-muted">{prompt}</button>)}</div></Card><Card><div className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-primary" />{tx(`${tasks.filter((item) => item.status !== "completed").length} open tasks`, `${tasks.filter((item) => item.status !== "completed").length} مهام مفتوحة`)}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{tx("Nemo uses the tasks, events and reminders saved in this workspace. It does not invent your schedule.", "نيمو يعتمد على المهام والفعاليات والتذكيرات المحفوظة هنا، ولا يخترع جدولك.")}</p></Card></aside>
      </div>
    </div>
  );
}
