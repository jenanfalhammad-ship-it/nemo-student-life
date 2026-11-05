import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Pub = Database["public"]["Tables"];
export type TableName = keyof Pub;
export type Row<K extends TableName> = Pub[K]["Row"];
export type Insert<K extends TableName> = Pub[K]["Insert"];
export type Update<K extends TableName> = Pub[K]["Update"];

// Generic helpers: supabase-js generics don't narrow well over a union of table names.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export function useRows<K extends TableName>(
  table: K,
  opts: { order?: string; asc?: boolean; filter?: [string, string | number | boolean]; enabled?: boolean; refetchInterval?: number } = {},
) {
  const { order = "created_at", asc = false, filter, enabled = true, refetchInterval } = opts;
  return useQuery({
    queryKey: [table, filter ?? null],
    enabled,
    refetchInterval: refetchInterval ?? false,
    queryFn: async (): Promise<Row<K>[]> => {
      let q = sb.from(table).select("*").order(order, { ascending: asc });
      if (filter) q = q.eq(filter[0], filter[1]);
      const { data, error } = await q.limit(1000);
      if (error) throw error;
      return data as Row<K>[];
    },
  });
}

function useInvalidate(table: TableName) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [table] });
}

export function useInsert<K extends TableName>(table: K, silent = false) {
  const inv = useInvalidate(table);
  return useMutation({
    mutationFn: async (values: Insert<K> | Insert<K>[]) => {
      const { data, error } = await sb.from(table).insert(values).select();
      if (error) throw error;
      return data as Row<K>[];
    },
    onSuccess: () => { inv(); if (!silent) toast.success("✓"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdate<K extends TableName>(table: K) {
  const inv = useInvalidate(table);
  return useMutation({
    mutationFn: async ({ id, values, idCol = "id" }: { id: string; values: Update<K>; idCol?: string }) => {
      const { error } = await sb.from(table).update(values).eq(idCol, id);
      if (error) throw error;
    },
    onSuccess: inv,
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemove<K extends TableName>(table: K) {
  const inv = useInvalidate(table);
  return useMutation({
    mutationFn: async (ids: string | string[]) => {
      const list = Array.isArray(ids) ? ids : [ids];
      const { error } = await sb.from(table).delete().in("id", list);
      if (error) throw error;
    },
    onSuccess: inv,
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profiles", "me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Update<"profiles">) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").upsert({ id: u.user.id, ...values });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profiles"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------- date helpers ---------- */
export const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
/** value for <input type="datetime-local"> */
export const toLocalInput = (d: Date | string | null | undefined) => {
  if (!d) return "";
  const x = new Date(d);
  const off = x.getTimezoneOffset();
  return new Date(x.getTime() - off * 60000).toISOString().slice(0, 16);
};
export const fromLocalInput = (s: string) => (s ? new Date(s).toISOString() : null);

/** Events with weekly recurrence expanded into a date range. */
export function expandEvents(events: Row<"events">[], from: Date, to: Date) {
  const out: (Row<"events"> & { occ: Date; occEnd: Date })[] = [];
  for (const e of events) {
    const s = new Date(e.starts_at), en = new Date(e.ends_at);
    const dur = en.getTime() - s.getTime();
    if (e.recurrence === "weekly") {
      let cur = new Date(s);
      if (cur < from) {
        const weeks = Math.floor((from.getTime() - cur.getTime()) / (7 * 864e5));
        cur = addDays(cur, weeks * 7);
      }
      while (cur <= to) {
        if (cur.getTime() + dur >= from.getTime()) out.push({ ...e, occ: new Date(cur), occEnd: new Date(cur.getTime() + dur) });
        cur = addDays(cur, 7);
      }
    } else if (en >= from && s <= to) out.push({ ...e, occ: s, occEnd: en });
  }
  return out.sort((a, b) => a.occ.getTime() - b.occ.getTime());
}

/* ---------- pearls / zoo ---------- */
export const PEARLS_PER_MIN = 1;
export const RARITY_COST = { common: 30, rare: 60, epic: 120, legendary: 240 } as const;
