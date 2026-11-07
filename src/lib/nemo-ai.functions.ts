import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { actionValues, chatInputSchema, deletionCandidates, nemoTables, workspaceSchema, type NemoAction, type PendingDelete } from "./nemo-actions";
export type { PendingDelete } from "./nemo-actions";
export type NemoResult = { reply: string; changed: boolean; pendingDeletes: PendingDelete[]; actions?: NemoAction[]; error?: string };

function failure(lang: "ar" | "en", error: unknown): NemoResult {
  console.error("Nemo request failed", error);
  const status = typeof error === "object" && error !== null && "httpStatus" in error ? error.httpStatus : null;
  const reply = status === 402 ? (lang === "ar" ? "رصيد نيمو خلص؛ يحتاج يتعبّى عشان أكمل معك 🐙" : "Nemo needs more AI credits to continue 🐙")
    : status === 429 ? (lang === "ar" ? "أذرعي الثمانية مشغولة شوي؛ جربي بعد لحظات 🐙" : "My eight arms are busy; try again shortly 🐙")
      : (lang === "ar" ? "تلخبط الحبر عندي 🐙 ما غيرت شيء بهالطلب. جربي مرة ثانية." : "My ink got tangled 🐙 No changes made by this request. Please try again.");
  return { reply, changed: false, pendingDeletes: [], error: "failed" };
}

// Local workspace inference is public but has NO database access or server writes.
// Only the explicitly submitted, bounded local records are sent to the model.
export const askLocalNemo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => chatInputSchema.extend({ workspace: workspaceSchema }).parse(data))
  .handler(async ({ data }): Promise<NemoResult> => {
    try {
      const { generateNemoPlan } = await import("./nemo-ai.server");
      const plan = await generateNemoPlan(data, data.workspace);
      for (const action of plan.actions) if (action.op === "create" || action.op === "update") actionValues(action);
      return { reply: plan.reply, changed: false, pendingDeletes: deletionCandidates(plan.actions, data.workspace), actions: plan.actions };
    } catch (error) { return failure(data.lang, error); }
  });

export const askNemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => chatInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<NemoResult> => {
    try {
      const sb = context.supabase;
      const [tasks, events, reminders, countdowns, courses, profile] = await Promise.all([
        sb.from("tasks").select("*").eq("user_id", context.userId).limit(1000),
        sb.from("events").select("*").eq("user_id", context.userId).limit(1000),
        sb.from("reminders").select("*").eq("user_id", context.userId).limit(1000),
        sb.from("countdowns").select("*").eq("user_id", context.userId).limit(1000),
        sb.from("courses").select("id,name,code").eq("user_id", context.userId).limit(1000),
        sb.from("profiles").select("display_name").eq("id", context.userId).maybeSingle(),
      ]);
      if ([tasks, events, reminders, countdowns, courses, profile].some((result) => result.error)) throw new Error("Workspace unavailable");
      const workspace = workspaceSchema.parse({ tasks: tasks.data, events: events.data, reminders: reminders.data, countdowns: countdowns.data, courses: courses.data });
      const { generateNemoPlan } = await import("./nemo-ai.server");
      const plan = await generateNemoPlan(data, workspace, profile.data?.display_name ?? "");
      // Validate every writable action before executing any writes.
      for (const action of plan.actions) if (action.op === "create" || action.op === "update") actionValues(action);
      const pendingDeletes = deletionCandidates(plan.actions, workspace);
      const failures: string[] = [];
      let changed = false;
      type Tables = Database["public"]["Tables"];
      for (const action of plan.actions) {
        if (action.op === "delete") continue;
        const item = workspace[action.table].find((row) => row.id === action.id);
        if (action.op !== "create" && !item) { failures.push(action.title ?? action.id ?? "item"); continue; }
        const values = action.op === "complete" || action.op === "reopen"
          ? action.table === "tasks" ? { status: action.op === "complete" ? "completed" : "todo", completed_at: action.op === "complete" ? new Date().toISOString() : null }
            : action.table === "reminders" ? { done: action.op === "complete" } : null
          : actionValues(action);
        if (!values) { failures.push(item?.title ?? "item"); continue; }
        let error;
        if (action.op === "create") {
          const payload = { ...values, user_id: context.userId };
          if (action.table === "tasks") ({ error } = await sb.from("tasks").insert(payload as Tables["tasks"]["Insert"]));
          else if (action.table === "events") ({ error } = await sb.from("events").insert(payload as Tables["events"]["Insert"]));
          else if (action.table === "reminders") ({ error } = await sb.from("reminders").insert(payload as Tables["reminders"]["Insert"]));
          else ({ error } = await sb.from("countdowns").insert(payload as Tables["countdowns"]["Insert"]));
        } else if (item) {
          if (action.table === "tasks") ({ error } = await sb.from("tasks").update(values as Tables["tasks"]["Update"]).eq("id", item.id).eq("user_id", context.userId));
          else if (action.table === "events") ({ error } = await sb.from("events").update(values as Tables["events"]["Update"]).eq("id", item.id).eq("user_id", context.userId));
          else if (action.table === "reminders") ({ error } = await sb.from("reminders").update(values as Tables["reminders"]["Update"]).eq("id", item.id).eq("user_id", context.userId));
          else ({ error } = await sb.from("countdowns").update(values as Tables["countdowns"]["Update"]).eq("id", item.id).eq("user_id", context.userId));
        }
        if (error) failures.push(action.title ?? item?.title ?? "item"); else changed = true;
      }
      return { reply: failures.length ? (data.lang === "ar" ? `ما قدرت أحفظ بعض التغييرات: ${failures.join("، ")}. راجعي القائمة قبل إعادة الطلب 🐙` : `Some changes failed: ${failures.join(", ")}. Check the list before retrying.`) : plan.reply, changed, pendingDeletes };
    } catch (error) { return failure(data.lang, error); }
  });

export const confirmNemoDeletes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ items: z.array(z.object({ table: z.enum(nemoTables), id: z.string().uuid(), title: z.string().max(300) })).max(1000) }).parse(data))
  .handler(async ({ data, context }) => {
    let removed = 0; let failed = false;
    for (const table of nemoTables) {
      const ids = data.items.filter((item) => item.table === table).map((item) => item.id);
      if (!ids.length) continue;
      const result = await context.supabase.from(table).delete({ count: "exact" }).in("id", ids).eq("user_id", context.userId);
      if (result.error) failed = true; else removed += result.count ?? 0;
    }
    return { removed, failed };
  });
