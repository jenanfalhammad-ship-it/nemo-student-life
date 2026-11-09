import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ListTodo, LoaderCircle, Send, Sparkles, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/kit";
import { Nemo } from "@/components/nemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRows } from "@/lib/data";
import { useTx } from "@/lib/tx";
import { supabase } from "@/integrations/supabase/client";
import { GUEST_ID } from "@/integrations/supabase/guest-client";
import { askLocalNemo, askNemo, confirmNemoDeletes } from "@/lib/nemo-ai.functions";
import { actionValues, nemoTables, workspaceSchema, type PendingDelete } from "@/lib/nemo-actions";
import { executeLocalNemoActions, removeLocalNemoItems } from "@/lib/nemo-local";

type Message = { id: string; role: "assistant" | "user"; text: string };
export const Route = createFileRoute("/_authenticated/ask")({
  head: () => ({
    meta: [
      { title: "Ask Nemo — Your NEMO study companion" },
      { name: "description", content: "Chat with Nemo about your tasks, dates and study plans." },
      { property: "og:title", content: "Ask Nemo — Your NEMO study companion" },
      {
        property: "og:description",
        content: "Your playful study companion for tasks and university life.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AskNemo,
});

function AskNemo() {
  const { tx, lang, dir } = useTx();
  const { data: tasks = [] } = useRows("tasks");
  const { data: events = [] } = useRows("events");
  const { data: reminders = [] } = useRows("reminders");
  const { data: countdowns = [] } = useRows("countdowns");
  const { data: courses = [] } = useRows("courses");
  const localAsk = useServerFn(askLocalNemo);
  const cloudAsk = useServerFn(askNemo);
  const cloudDelete = useServerFn(confirmNemoDeletes);
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [pending, setPending] = useState<PendingDelete[]>([]);
  const [localMode, setLocalMode] = useState(false);
  const [ready, setReady] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const historyKey = useRef("");
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setLocalMode(data.user?.id === GUEST_ID);
      historyKey.current = `nemo-chat:${data.user?.id ?? "local"}`;
      try {
        const history = JSON.parse(localStorage.getItem(historyKey.current) ?? "[]");
        if (Array.isArray(history))
          setMessages(
            history
              .filter(
                (m) => typeof m.text === "string" && (m.role === "user" || m.role === "assistant"),
              )
              .slice(-100),
          );
      } catch {
        /* empty history */
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (ready && historyKey.current)
      localStorage.setItem(historyKey.current, JSON.stringify(messages.slice(-100)));
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, busy, ready]);
  const append = (text: string) =>
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text }]);
  const refresh = () =>
    Promise.all(nemoTables.map((table) => qc.invalidateQueries({ queryKey: [table] })));

  async function confirm() {
    if (lock.current || !pending.length) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = localMode
        ? await removeLocalNemoItems(pending)
        : await cloudDelete({ data: { items: pending } });
      await refresh();
      setPending([]);
      append(
        result.failed
          ? tx(
              `Removed ${result.removed} items, but some couldn't be removed.`,
              `حذفت ${result.removed} عناصر، لكن بعض العناصر ما انحذفت.`,
            )
          : tx(
              `Removed ${result.removed} items. A little more breathing room 🐙`,
              `حذفت ${result.removed} عناصر. كذا صار عندنا مساحة نتنفس 🐙`,
            ),
      );
    } catch {
      append(
        tx(
          "Couldn't delete. Nothing else was changed; try again.",
          "ما قدرت أحذف؛ جربي مرة ثانية 🐙",
        ),
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function cancel() {
    setPending([]);
    append(
      tx("Cancelled. Everything stays right where it is 🐙", "تم، ما حذفت شيء! خليتها مكانها 🐙"),
    );
  }
  async function send(value = input) {
    const text = value.trim();
    if (!text || lock.current || !ready) return;
    if (pending.length && /^(نعم|اي|إي|أكيد|موافق|yes|ok|تمام|احذفها)[.!؟\s]*$/i.test(text)) {
      setInput("");
      await confirm();
      return;
    }
    if (pending.length && /^(لا|لا خلاص|no|cancel|إلغاء)[.!؟\s]*$/i.test(text)) {
      setInput("");
      cancel();
      return;
    }
    lock.current = true;
    setBusy(true);
    setInput("");
    setPending([]);
    const next: Message[] = [...messages, { id: crypto.randomUUID(), role: "user", text }];
    setMessages(next);
    try {
      const data = {
        messages: next
          .slice(-16)
          .map(({ role, text: content }) => ({ role, text: content.slice(0, 2000) })),
        lang,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        nowLocal: new Date().toISOString(),
      };
      const workspace = workspaceSchema.parse({ tasks, events, reminders, countdowns, courses });
      const result = localMode
        ? await localAsk({ data: { ...data, workspace } })
        : await cloudAsk({ data });
      let failed = false;
      if (localMode && result.actions && !result.error) {
        for (const action of result.actions)
          if (action.op === "create" || action.op === "update") actionValues(action);
        const execution = await executeLocalNemoActions(result.actions, workspace);
        failed = execution.failed;
      }
      await refresh();
      setPending(result.pendingDeletes);
      append(
        failed
          ? tx(
              "Some changes couldn't be saved. Check your list before retrying 🐙",
              "بعض التغييرات ما انحفظت. راجع قائمتك قبل إعادة الطلب 🐙",
            )
          : result.reply,
      );
    } catch {
      append(tx("My ink got tangled 🐙 Please try again.", "تلخبط الحبر عندي 🐙 جرّب مرة ثانية."));
      setInput(text);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const suggestions = [
    tx("What do you think I should work on next?", "وش تنصحني أشتغل عليه بعد؟"),
    tx("What are my tasks today?", "وش مهامي اليوم؟"),
    tx("Add a math study task today at 1 PM", "ضيف مهمة لليوم الساعة ١ اسمها مذاكره رياضيات"),
    tx("Help me plan my week", "ساعدني أخطط أسبوعي"),
  ];
  return (
    <div dir={dir} className="mx-auto w-full max-w-5xl pb-10">
      <PageHeader title={tx("Ask Nemo", "اسأل نيمو")} />
      <section className="mb-6 flex items-center gap-4 overflow-hidden rounded-3xl border bg-gradient-to-br from-rose-50 via-card to-lavender/60 p-4 shadow-soft dark:from-rose-950/20 sm:p-5">
        <Nemo mood="happy" float className="h-20 w-20 shrink-0" />
        <div className="min-w-0">
          <p className="text-xl font-bold">
            {tx("Eight arms. Always on your side.", "ثمانية أذرع، وكلها بصفّك 🐙")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tx(
              "Ask for advice, explore ideas, or make a clear plan together.",
              "ناقش أفكارك وخذ رأيًا واضحًا أو رتّب خطتك مع نيمو.",
            )}
          </p>
          {localMode && (
            <p className="mt-2 text-xs text-muted-foreground">
              {tx("Local workspace · saved on this device", "مساحة محلية · محفوظة على هذا الجهاز")}
            </p>
          )}
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <section className="min-w-0 overflow-hidden rounded-3xl border bg-card shadow-soft">
          <div
            aria-live="polite"
            role="log"
            className="max-h-[560px] min-h-[300px] space-y-4 overflow-y-auto bg-gradient-to-b from-sage-soft/25 via-background to-lavender/25 p-4 sm:p-6"
          >
            {!messages.length && (
              <p className="py-8 text-center text-muted-foreground">
                {tx("Hey! What's on your mind? 🐙", "هلا! وش عندك اليوم؟ خلينا نفك الزحمة سوا 🐙")}
              </p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role === "assistant" && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-100 to-peach text-rose-700 dark:from-rose-950/60 dark:to-orange-950/50 dark:text-rose-200">
                    <Sparkles className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={`max-w-[92%] break-words rounded-2xl px-4 py-3 text-sm leading-7 whitespace-pre-line shadow-sm ${message.role === "user" ? "rounded-ee-md bg-gradient-to-br from-primary to-primary-deep text-primary-foreground" : "rounded-es-md border border-primary/10 bg-gradient-to-br from-card via-card to-lavender/35"}`}
                >
                  {message.role === "assistant" && (
                    <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary">
                      <Sparkles className="h-3 w-3" />
                      NEMO
                    </div>
                  )}
                  {message.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                {tx("Nemo is thinking…", "نيمو يفكّر…")}
              </div>
            )}
            <div ref={end} />
          </div>
          {pending.length > 0 && (
            <div className="border-t bg-destructive/5 p-4">
              <p className="flex items-center gap-2 font-semibold">
                <Trash2 className="h-4 w-4" />
                {tx(`Delete ${pending.length} items?`, `أحذف ${pending.length} عناصر؟`)}
              </p>
              <ul className="my-3 max-h-36 list-inside list-disc overflow-y-auto break-words text-sm">
                {pending.map((item) => (
                  <li key={`${item.table}:${item.id}`}>{item.title}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button variant="destructive" disabled={busy} onClick={() => void confirm()}>
                  <Trash2 />
                  {tx("Confirm deletion", "تأكيد الحذف")}
                </Button>
                <Button variant="outline" disabled={busy} onClick={cancel}>
                  <X />
                  {tx("Cancel", "إلغاء")}
                </Button>
              </div>
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="flex gap-2 border-t p-3"
          >
            <Input
              aria-label={tx("Message Nemo", "رسالة لنيمو")}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={2000}
              disabled={busy || !ready}
              placeholder={tx("What's on your mind?", "وش في بالك؟")}
              className="min-w-0"
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy || !ready || !input.trim()}
              aria-label={tx("Send", "إرسال")}
            >
              {busy ? (
                <LoaderCircle className="animate-spin motion-reduce:animate-none" />
              ) : (
                <Send />
              )}
            </Button>
          </form>
        </section>
        <aside className="space-y-3">
          <div className="rounded-2xl border bg-gradient-to-br from-lavender/45 via-card to-sky/50 p-3">
            <p className="mb-2 flex items-center gap-2 px-1 text-xs font-bold text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              {tx("Try asking", "جرّب تسأله")}
            </p>
            <div className="grid gap-2">
              {suggestions.map((suggestion, i) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  disabled={busy || !ready}
                  onClick={() => void send(suggestion)}
                  className={`h-auto min-h-11 justify-start whitespace-normal rounded-xl border bg-card/85 text-start shadow-sm transition hover:-translate-y-0.5 hover:bg-card ${i === 0 ? "border-violet-200 text-violet-800 dark:border-violet-900 dark:text-violet-200" : ""}`}
                >
                  <ListTodo className="shrink-0" />
                  <span className="break-words">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            <Check className="me-1 inline h-3 w-3" />
            {tx(
              `${tasks.filter((t) => t.status !== "completed").length} open tasks · ${events.length} events`,
              `${tasks.filter((t) => t.status !== "completed").length} مهام مفتوحة · ${events.length} فعاليات`,
            )}
          </p>
        </aside>
      </div>
    </div>
  );
}
