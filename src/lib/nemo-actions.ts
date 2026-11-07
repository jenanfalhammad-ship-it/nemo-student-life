import { z } from "zod";

export const nemoTables = ["tasks", "events", "reminders", "countdowns"] as const;
export const actionSchema = z.object({
  op: z.enum(["create", "update", "complete", "reopen", "delete"]),
  table: z.enum(nemoTables), id: z.string().nullable(), title: z.string().max(300).nullable(),
  when: z.string().nullable(), end: z.string().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).nullable(),
  category: z.string().nullable(), minutes: z.number().int().min(1).max(1440).nullable(),
  kind: z.string().nullable(), description: z.string().max(2000).nullable(),
}).strict();
export const planSchema = z.object({ reply: z.string().min(1).max(10000), actions: z.array(actionSchema).max(1000) });
export type NemoAction = z.infer<typeof actionSchema>;
export type PendingDelete = { table: (typeof nemoTables)[number]; id: string; title: string };
const itemSchema = z.object({
  id: z.string().max(100), title: z.string().max(300), status: z.string().optional(),
  due_at: z.string().nullable().optional(), starts_at: z.string().optional(), ends_at: z.string().optional(),
  remind_at: z.string().optional(), target_at: z.string().optional(), done: z.boolean().optional(),
  priority: z.string().optional(), category: z.string().optional(), estimated_minutes: z.number().nullable().optional(),
});
export const workspaceSchema = z.object({
  tasks: z.array(itemSchema).max(1000), events: z.array(itemSchema).max(1000),
  reminders: z.array(itemSchema).max(1000), countdowns: z.array(itemSchema).max(1000),
  courses: z.array(z.object({ id: z.string(), name: z.string().max(300), code: z.string().nullable().optional() })).max(1000),
});
export type NemoWorkspace = z.infer<typeof workspaceSchema>;
export const chatInputSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(2000) })).min(1).max(16),
  lang: z.enum(["ar", "en"]), tz: z.string().max(60), nowLocal: z.string().max(60),
});
export const outputFormatSchema = {
  type: "object", additionalProperties: false, required: ["reply", "actions"],
  properties: {
    reply: { type: "string" }, actions: { type: "array", items: {
      type: "object", additionalProperties: false,
      required: ["op", "table", "id", "title", "when", "end", "priority", "category", "minutes", "kind", "description"],
      properties: {
        op: { type: "string", enum: ["create", "update", "complete", "reopen", "delete"] },
        table: { type: "string", enum: [...nemoTables] },
        id: { type: ["string", "null"] }, title: { type: ["string", "null"] },
        when: { type: ["string", "null"] }, end: { type: ["string", "null"] },
        priority: { type: ["string", "null"], enum: ["low", "medium", "high", "urgent", null] },
        category: { type: ["string", "null"] }, minutes: { type: ["integer", "null"] },
        kind: { type: ["string", "null"] }, description: { type: ["string", "null"] },
      },
    } },
  },
};

export function validDate(value: string | null): string | null {
  if (!value) return null;
  if (!/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error("A timezone is required");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  return date.toISOString();
}

// Restrict model output to writable fields; ownership and deletion are handled separately.
export function actionValues(action: NemoAction) {
  const a = actionSchema.parse(action);
  const when = validDate(a.when);
  const title = a.title?.trim();
  if (a.op === "create" && !title) throw new Error("A title is required");
  const common = { ...(title ? { title } : {}), ...(a.description !== null ? { description: a.description } : {}) };
  const create = a.op === "create";
  if (a.table === "tasks") return {
    ...common, ...(when || create ? { due_at: when } : {}),
    ...(a.priority || create ? { priority: a.priority ?? "medium" } : {}),
    ...(a.category || create ? { category: a.category ?? "other" } : {}),
    ...(a.minutes !== null ? { estimated_minutes: a.minutes } : {}),
    ...(create ? { status: "todo", completed_at: null } : {}),
  };
  const dateColumn = a.table === "events" ? "starts_at" : a.table === "reminders" ? "remind_at" : "target_at";
  if (create && !when) throw new Error("A date is required");
  if (a.table === "events") {
    const end = validDate(a.end) ?? (create && when ? new Date(new Date(when).getTime() + 3600000).toISOString() : null);
    if (end && when && end <= when) throw new Error("End must follow start");
    return { ...common, ...(when ? { starts_at: when } : {}), ...(end ? { ends_at: end } : {}), ...(create ? { kind: a.kind ?? "appointment", recurrence: "none" } : {}) };
  }
  return { ...(a.table === "countdowns" ? (title ? { title } : {}) : common), ...(when ? { [dateColumn]: when } : {}),
    ...(a.category || create ? { category: a.category ?? (a.table === "reminders" ? "academic" : "other") } : {}),
    ...(a.table === "reminders" && create ? { priority: a.priority ?? "medium", repeat: "none", done: false } : {}),
  };
}

export function deletionCandidates(actions: NemoAction[], workspace: NemoWorkspace): PendingDelete[] {
  const seen = new Set<string>();
  return actions.flatMap((action) => {
    if (action.op !== "delete") return [];
    const item = workspace[action.table].find((row) => row.id === action.id);
    const key = `${action.table}:${action.id}`;
    if (!item || seen.has(key)) return [];
    seen.add(key);
    return [{ table: action.table, id: item.id, title: item.title }];
  });
}