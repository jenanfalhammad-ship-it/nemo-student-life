import { supabase } from "@/integrations/supabase/client";
import { GUEST_ID } from "@/integrations/supabase/guest-client";
import type { Database } from "@/integrations/supabase/types";
import { actionValues, nemoTables, type NemoAction, type NemoWorkspace, type PendingDelete } from "./nemo-actions";

type Tables = Database["public"]["Tables"];
export async function executeLocalNemoActions(actions: NemoAction[], workspace: NemoWorkspace) {
  // Never let the guest execution path write to a signed-in user's cloud workspace.
  const { data } = await supabase.auth.getUser();
  if (data.user?.id !== GUEST_ID) throw new Error("Not a local workspace");
  let failed = false;
  for (const action of actions) {
    if (action.op === "delete") continue;
    const item = workspace[action.table].find((row) => row.id === action.id);
    if (action.op !== "create" && !item) { failed = true; continue; }
    const values = action.op === "complete" || action.op === "reopen"
      ? action.table === "tasks" ? { status: action.op === "complete" ? "completed" : "todo", completed_at: action.op === "complete" ? new Date().toISOString() : null }
        : action.table === "reminders" ? { done: action.op === "complete" } : null
      : actionValues(action);
    if (!values) { failed = true; continue; }
    let error;
    if (action.op === "create") {
      const payload = { ...values, user_id: GUEST_ID };
      if (action.table === "tasks") ({ error } = await supabase.from("tasks").insert(payload as Tables["tasks"]["Insert"]));
      else if (action.table === "events") ({ error } = await supabase.from("events").insert(payload as Tables["events"]["Insert"]));
      else if (action.table === "reminders") ({ error } = await supabase.from("reminders").insert(payload as Tables["reminders"]["Insert"]));
      else ({ error } = await supabase.from("countdowns").insert(payload as Tables["countdowns"]["Insert"]));
    } else if (item) {
      if (action.table === "tasks") ({ error } = await supabase.from("tasks").update(values as Tables["tasks"]["Update"]).eq("id", item.id));
      else if (action.table === "events") ({ error } = await supabase.from("events").update(values as Tables["events"]["Update"]).eq("id", item.id));
      else if (action.table === "reminders") ({ error } = await supabase.from("reminders").update(values as Tables["reminders"]["Update"]).eq("id", item.id));
      else ({ error } = await supabase.from("countdowns").update(values as Tables["countdowns"]["Update"]).eq("id", item.id));
    }
    if (error) failed = true;
  }
  return { failed };
}

export async function removeLocalNemoItems(items: PendingDelete[]) {
  const { data } = await supabase.auth.getUser();
  if (data.user?.id !== GUEST_ID) throw new Error("Not a local workspace");
  let removed = 0; let failed = false;
  for (const table of nemoTables) {
    const ids = items.filter((item) => item.table === table).map((item) => item.id);
    if (!ids.length) continue;
    const before = await supabase.from(table).select("id").in("id", ids);
    if (before.error) { failed = true; continue; }
    const result = await supabase.from(table).delete().in("id", ids);
    if (result.error) failed = true; else removed += before.data?.length ?? 0;
  }
  return { removed, failed };
}