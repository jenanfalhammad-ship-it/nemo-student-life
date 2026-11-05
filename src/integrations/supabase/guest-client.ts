import type { Database } from "./types";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables & string;
type Row<T extends TableName> = Tables[T]["Row"];

type AnyRecord = Record<string, any>;

const GUEST_ID = "00000000-0000-4000-8000-000000000001";
const STORAGE_PREFIX = "nemo-guest-db:";
const memory = new Map<string, AnyRecord[]>();

const tableDefaults: Record<string, AnyRecord[]> = {
  profiles: [{ id: GUEST_ID, display_name: "Student", language: "en", theme: "light", session_minutes: 25, daily_focus_goal: 120, show_quran: true, time_format: "12h", week_start: 0, onboarded: true }],
  courses: [], tasks: [], events: [], reminders: [], countdowns: [], focus_sessions: [],
  flashcard_decks: [], flashcards: [], course_notes: [], course_files: [], user_animals: [],
  study_rooms: [], room_members: [], ai_messages: [],
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readTable(table: string): AnyRecord[] {
  if (canUseStorage()) {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + table);
    if (raw) {
      try { return JSON.parse(raw); } catch { /* recover with an empty table */ }
    }
  }
  if (!memory.has(table)) memory.set(table, structuredClone(tableDefaults[table] ?? []));
  return memory.get(table)!;
}

function writeTable(table: string, rows: AnyRecord[]) {
  memory.set(table, rows);
  if (canUseStorage()) window.localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(rows));
}

function id() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ownedRows(table: string) {
  return readTable(table).filter((row) => !("user_id" in row) || row["user_id"] === GUEST_ID || row["id"] === GUEST_ID);
}

class QueryBuilder<T extends AnyRecord = AnyRecord> implements PromiseLike<{ data: T[] | T | null; error: null }> {
  private filters: Array<[string, unknown]> = [];
  private orderBy?: { column: string; ascending: boolean };
  private max?: number;
  private mode: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: AnyRecord | AnyRecord[] = {};
  private wantRows = false;

  constructor(private readonly table: string) {}
  select() { this.mode = this.mode === "select" ? "select" : this.mode; this.wantRows = true; return this; }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this; }
  in(column: string, values: unknown[]) { this.filters.push([column, values]); return this; }
  order(column: string, options?: { ascending?: boolean }) { this.orderBy = { column, ascending: options?.ascending ?? true }; return this; }
  limit(value: number) { this.max = value; return this; }
  maybeSingle() { this.max = 1; return this as QueryBuilder<T>; }
  single() { this.max = 1; return this as QueryBuilder<T>; }
  insert(payload: AnyRecord | AnyRecord[]) { this.mode = "insert"; this.payload = payload; return this; }
  update(payload: AnyRecord) { this.mode = "update"; this.payload = payload; return this; }
  upsert(payload: AnyRecord | AnyRecord[]) { this.mode = "upsert"; this.payload = payload; return this; }
  delete() { this.mode = "delete"; return this; }

  private matches(row: AnyRecord) {
    return this.filters.every(([column, expected]) => Array.isArray(expected) ? expected.includes(row[column]) : row[column] === expected);
  }

  private execute(): { data: T[] | T | null; error: null } {
    let rows = ownedRows(this.table);
    if (this.mode === "insert") {
      const incoming = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((row) => ({
        id: row.id ?? id(), user_id: row.user_id ?? GUEST_ID, created_at: row.created_at ?? new Date().toISOString(), ...row,
      }));
      writeTable(this.table, [...readTable(this.table), ...incoming]);
      return { data: this.wantRows ? incoming as T[] : null, error: null };
    }
    if (this.mode === "upsert") {
      const incoming = Array.isArray(this.payload) ? this.payload : [this.payload];
      const all = readTable(this.table);
      for (const item of incoming) {
        const index = all.findIndex((row) => row["id"] === item["id"]);
        const next = { user_id: GUEST_ID, ...item };
        if (index >= 0) all[index] = { ...all[index], ...next };
        else all.push({ id: item.id ?? id(), created_at: new Date().toISOString(), ...next });
      }
      writeTable(this.table, all);
      return { data: this.wantRows ? incoming as T[] : null, error: null };
    }
    const matching = rows.filter((row) => this.matches(row));
    if (this.mode === "update") {
      const all = readTable(this.table);
      for (const row of all) if (this.matches(row)) Object.assign(row, this.payload);
      writeTable(this.table, all);
      return { data: this.wantRows ? matching.map((row) => ({ ...row, ...this.payload })) as T[] : null, error: null };
    }
    if (this.mode === "delete") {
      writeTable(this.table, readTable(this.table).filter((row) => !this.matches(row)));
      return { data: null, error: null };
    }
    if (this.orderBy) matching.sort((a, b) => {
      const av = a[this.orderBy!.column] ?? ""; const bv = b[this.orderBy!.column] ?? "";
      const result = av < bv ? -1 : av > bv ? 1 : 0;
      return this.orderBy!.ascending ? result : -result;
    });
    const result = this.max ? matching.slice(0, this.max) : matching;
    return { data: this.max === 1 ? (result[0] ?? null) as T | null : result as T[], error: null };
  }

  then<TResult1 = { data: T[] | T | null; error: null }, TResult2 = never>(onfulfilled?: ((value: { data: T[] | T | null; error: null }) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

function storage() {
  return {
    async listBuckets() { return { data: [{ name: "course-files", public: false }], error: null }; },
    from(bucket: string) {
      return {
        async upload(path: string, file: Blob) {
          if (canUseStorage()) window.localStorage.setItem(`${STORAGE_PREFIX}file:${bucket}:${path}`, JSON.stringify({ name: path, type: file.type, size: file.size }));
          return { data: { path }, error: null };
        },
        async remove(paths: string[]) { paths.forEach((path) => canUseStorage() && window.localStorage.removeItem(`${STORAGE_PREFIX}file:${bucket}:${path}`)); return { data: null, error: null }; },
        async createSignedUrl(path: string) { return { data: { signedUrl: canUseStorage() ? URL.createObjectURL(new Blob([`NEMO guest file: ${path}`], { type: "text/plain" })) : path }, error: null }; },
      };
    },
  };
}

export function createGuestClient() {
  const auth = {
    async getUser() { return { data: { user: { id: GUEST_ID, email: "guest@nemo.local", user_metadata: { full_name: "Student" } } }, error: null }; },
    onAuthStateChange(callback: (event: string, session: unknown) => void) { callback("SIGNED_IN", { user: { id: GUEST_ID } }); return { data: { subscription: { unsubscribe() {} } } }; },
    async signOut() { return { error: null }; },
    async updateUser() { return { data: null, error: null }; },
  };
  return {
    auth,
    from<T extends TableName>(table: T) { return new QueryBuilder<Row<T>>(table); },
    storage: storage(),
    async rpc(name: string, args?: AnyRecord) {
      if (name === "join_room_by_code") {
        const room = readTable("study_rooms").find((item) => item["code"] === String(args?.["_code"] ?? "").toUpperCase());
        if (!room) return { data: null, error: new Error("Room not found") };
        new QueryBuilder("room_members").insert({ room_id: room["id"], user_id: GUEST_ID, display_name: args?.["_name"] ?? "Guest" });
        return { data: room["id"], error: null };
      }
      return { data: null, error: new Error(`Unsupported local operation: ${name}`) };
    },
  };
}

export { GUEST_ID };
