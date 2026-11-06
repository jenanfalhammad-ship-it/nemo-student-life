import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ChatTurn = { role: "user" | "assistant"; text: string };
type Input = { messages: ChatTurn[]; lang: "ar" | "en"; tz: string; nowLocal: string };
export type PendingDelete = { table: "tasks" | "events" | "reminders" | "countdowns"; id: string; title: string };
export type NemoResult = { reply: string; changed: boolean; pendingDeletes: PendingDelete[]; error?: string };

const TABLES = ["tasks", "events", "reminders", "countdowns"] as const;
const nullable = (t: string, extra: Record<string, unknown> = {}) => ({ type: [t, "null"], ...extra });

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "actions"],
  properties: {
    reply: { type: "string" },
    actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["op", "table", "id", "title", "when", "end", "priority", "category", "minutes", "kind", "description"],
        properties: {
          op: { type: "string", enum: ["create", "update", "complete", "reopen", "delete"] },
          table: { type: "string", enum: [...TABLES] },
          id: nullable("string"),
          title: nullable("string"),
          when: nullable("string"),
          end: nullable("string"),
          priority: nullable("string"),
          category: nullable("string"),
          minutes: nullable("integer"),
          kind: nullable("string"),
          description: nullable("string"),
        },
      },
    },
  },
} as const;

type Action = {
  op: "create" | "update" | "complete" | "reopen" | "delete";
  table: (typeof TABLES)[number];
  id: string | null; title: string | null; when: string | null; end: string | null;
  priority: string | null; category: string | null; minutes: number | null; kind: string | null; description: string | null;
};

const PRI = ["low", "medium", "high", "urgent"];
const iso = (v: string | null) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString(); };

export const askNemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Input) => ({
    messages: (d.messages ?? []).slice(-16).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", text: String(m.text).slice(0, 2000) })) as ChatTurn[],
    lang: d.lang === "en" ? "en" : "ar",
    tz: String(d.tz || "UTC").slice(0, 60),
    nowLocal: String(d.nowLocal).slice(0, 60),
  }))
  .handler(async ({ data, context }): Promise<NemoResult> => {
    const sb = context.supabase;
    const [t, e, r, c, co, p] = await Promise.all([
      sb.from("tasks").select("id,title,status,due_at,priority,category,estimated_minutes").order("due_at", { ascending: true }).limit(200),
      sb.from("events").select("id,title,starts_at,ends_at,kind,location,recurrence").order("starts_at", { ascending: true }).limit(150),
      sb.from("reminders").select("id,title,remind_at,done,category").order("remind_at", { ascending: true }).limit(100),
      sb.from("countdowns").select("id,title,target_at,category").order("target_at", { ascending: true }).limit(50),
      sb.from("courses").select("id,name,code").limit(50),
      sb.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
    ]);
    const ws = { tasks: t.data ?? [], events: e.data ?? [], reminders: r.data ?? [], countdowns: c.data ?? [], courses: co.data ?? [] };
    const name = (p.data as { full_name?: string | null } | null)?.full_name ?? "";

    const instructions = `You are Nemo, a cute, witty red octopus study buddy inside the NEMO student app. Personality: playful, warm, funny, light octopus jokes (8 arms, ink, ocean) and emojis 🐙✨ but brief. ${data.lang === "ar" ? "Reply in friendly Saudi/Gulf Arabic dialect (address the user in feminine form unless context says otherwise)." : "Reply in English."}
User name: ${name || "unknown"}. User timezone: ${data.tz}. Current local date/time: ${data.nowLocal}.

You MUST respond with JSON matching the schema: {reply, actions}.
Rules:
- Understand natural language deeply. Extract a CLEAN short title. Example: "ضيف مهمة لليوم الساعة ١ اسمها مذاكره رياضيات" => create task title "مذاكرة رياضيات", when = today 13:00 local. Never put date/time words in the title.
- Arabic digits (١٢٣) are numbers. "الساعة ١" with no AM/PM: pick the nearest sensible upcoming time (usually PM for 1-7). "بكرة"=tomorrow, "الليلة"=tonight, "بعد ساعتين" relative.
- All datetimes in "when"/"end" must be ISO 8601 WITH the user's UTC offset (e.g. 2026-11-06T13:00:00+03:00).
- tasks: when=due time; priority low|medium|high|urgent; category university|studying|personal|projects|activities|other; minutes=estimate. events: when=start, end=end (default +1h), kind lecture|exam|quiz|assignment|project|study|personal|activity|appointment. reminders: when=remind time, category academic|personal|health|projects|other. countdowns: when=target date.
- update/complete/reopen/delete MUST use exact ids from the workspace JSON below. "delete all tasks" => one delete action per matching task id. Deletes are confirmed by the user afterwards, so in reply say you're waiting for confirmation, don't claim it's deleted.
- For questions ("وش مهامي اليوم؟"), answer from the workspace data, filtering by date correctly in the user's timezone, listing items with times. Don't invent data. If nothing matches say so cheerfully.
- If something is ambiguous, ask a short question with no actions.
- In reply, confirm what you did with title and friendly date/time.

WORKSPACE JSON:
${JSON.stringify(ws)}`;

    try {
      const { generateResponse } = await import("@lovable.dev/ai-gateway");
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions,
        input: data.messages.map((m) => ({ role: m.role, content: m.text })),
        text: { format: { type: "json_schema", name: "nemo_reply", strict: true, schema } },
      } as Parameters<typeof generateResponse>[0]);
      const out = res as unknown as { output_text?: string; output?: { type: string; content?: { type: string; text?: string }[] }[] };
      const raw = out.output_text ?? (out.output ?? []).flatMap((o) => o.content ?? []).filter((x) => x.type === "output_text").map((x) => x.text ?? "").join("");
      const parsed = JSON.parse(raw) as { reply: string; actions: Action[] };

      let changed = false;
      const pendingDeletes: PendingDelete[] = [];
      const failures: string[] = [];
      const owned = (table: Action["table"], id: string | null) => (ws[table] as { id: string; title: string }[]).find((x) => x.id === id);

      for (const a of parsed.actions ?? []) {
        if (a.op === "create") {
          const title = (a.title ?? "").trim();
          if (!title) continue;
          const when = iso(a.when);
          let q;
          if (a.table === "tasks") q = sb.from("tasks").insert({ user_id: context.userId, title, description: a.description, due_at: when, priority: PRI.includes(a.priority ?? "") ? a.priority! : "medium", category: a.category ?? "other", estimated_minutes: a.minutes, status: "todo" });
          else if (a.table === "events") { const s = when ?? new Date().toISOString(); q = sb.from("events").insert({ user_id: context.userId, title, description: a.description, starts_at: s, ends_at: iso(a.end) ?? new Date(new Date(s).getTime() + 3600000).toISOString(), kind: a.kind ?? "appointment", recurrence: "none" }); }
          else if (a.table === "reminders") q = sb.from("reminders").insert({ user_id: context.userId, title, description: a.description, remind_at: when ?? new Date(Date.now() + 3600000).toISOString(), category: a.category ?? "academic", priority: PRI.includes(a.priority ?? "") ? a.priority! : "medium", repeat: "none", done: false });
          else { if (!when) continue; q = sb.from("countdowns").insert({ user_id: context.userId, title, target_at: when, category: a.category ?? "other" }); }
          const { error } = await q; if (error) failures.push(title); else changed = true;
        } else {
          const item = owned(a.table, a.id);
          if (!item) continue;
          if (a.op === "delete") { pendingDeletes.push({ table: a.table, id: item.id, title: item.title }); continue; }
          let error = null;
          if (a.op === "complete" || a.op === "reopen") {
            const done = a.op === "complete";
            if (a.table === "tasks") ({ error } = await sb.from("tasks").update({ status: done ? "completed" : "todo", completed_at: done ? new Date().toISOString() : null }).eq("id", item.id));
            else if (a.table === "reminders") ({ error } = await sb.from("reminders").update({ done }).eq("id", item.id));
          } else {
            const when = iso(a.when);
            if (a.table === "tasks") { const v: Record<string, unknown> = {}; if (a.title) v.title = a.title; if (when) v.due_at = when; if (a.priority && PRI.includes(a.priority)) v.priority = a.priority; if (a.category) v.category = a.category; if (a.minutes) v.estimated_minutes = a.minutes; ({ error } = await sb.from("tasks").update(v).eq("id", item.id)); }
            else if (a.table === "events") { const v: Record<string, unknown> = {}; if (a.title) v.title = a.title; if (when) v.starts_at = when; const end = iso(a.end); if (end) v.ends_at = end; ({ error } = await sb.from("events").update(v).eq("id", item.id)); }
            else if (a.table === "reminders") { const v: Record<string, unknown> = {}; if (a.title) v.title = a.title; if (when) v.remind_at = when; ({ error } = await sb.from("reminders").update(v).eq("id", item.id)); }
            else { const v: Record<string, unknown> = {}; if (a.title) v.title = a.title; if (when) v.target_at = when; ({ error } = await sb.from("countdowns").update(v).eq("id", item.id)); }
          }
          if (error) failures.push(item.title); else changed = true;
        }
      }
      let reply = parsed.reply;
      if (failures.length) reply += data.lang === "ar" ? `\n\n⚠️ ما قدرت أحفظ: ${failures.join("، ")}` : `\n\n⚠️ Couldn't save: ${failures.join(", ")}`;
      return { reply, changed, pendingDeletes };
    } catch (err) {
      console.error("askNemo failed", err);
      const status = (err as { httpStatus?: number })?.httpStatus;
      const msg = status === 402
        ? (data.lang === "ar" ? "رصيد الذكاء الاصطناعي خلص 🥲 لازم يتعبى عشان أرجع أشتغل." : "AI credits ran out 🥲")
        : status === 429
          ? (data.lang === "ar" ? "أذرعي الثمانية مشغولة شوي 🐙 جربي بعد لحظات." : "Too many requests, try again in a moment 🐙")
          : (data.lang === "ar" ? "صار عندي لخبطة حبر صغيرة 🐙 جربي مرة ثانية." : "I got tangled in my ink 🐙 try again.");
      return { reply: msg, changed: false, pendingDeletes: [], error: "failed" };
    }
  });

export const confirmNemoDeletes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { items: PendingDelete[] }) => ({ items: (d.items ?? []).filter((i) => TABLES.includes(i.table)).slice(0, 300) }))
  .handler(async ({ data, context }) => {
    let removed = 0;
    for (const table of TABLES) {
      const ids = data.items.filter((i) => i.table === table).map((i) => i.id);
      if (!ids.length) continue;
      const { error, count } = await context.supabase.from(table).delete({ count: "exact" }).in("id", ids);
      if (!error) removed += count ?? 0;
    }
    return { removed };
  });
