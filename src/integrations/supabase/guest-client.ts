import type { Database } from "./types";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables & string;
type Row<T extends TableName> = Tables[T]["Row"];

type AnyRecord = Record<string, any>;

const GUEST_ID = "00000000-0000-4000-8000-000000000001";
const STORAGE_PREFIX = "nemo-guest-db:";
const memory = new Map<string, AnyRecord[]>();
const demoDate = (days: number, hour: number) => { const date = new Date(); date.setDate(date.getDate() + days); date.setHours(hour, 0, 0, 0); return date.toISOString(); };
const DEMO_COURSE_ID = "10000000-0000-4000-8000-000000000001";
const DEMO_TASKS = [
  { id: "20000000-0000-4000-8000-000000000001", user_id: GUEST_ID, title: "Review lecture 4 notes", description: "Highlight the three concepts most likely to appear in the quiz.", category: "studying", course_id: DEMO_COURSE_ID, priority: "high", due_at: demoDate(1, 18), estimated_minutes: 45, status: "todo", completed_at: null },
  { id: "20000000-0000-4000-8000-000000000002", user_id: GUEST_ID, title: "Finish lab report outline", description: "Draft the methods and results sections.", category: "university", course_id: DEMO_COURSE_ID, priority: "urgent", due_at: demoDate(4, 20), estimated_minutes: 60, status: "todo", completed_at: null },
  { id: "20000000-0000-4000-8000-000000000003", user_id: GUEST_ID, title: "Plan next week's study blocks", description: "Split the exam chapters into small sessions.", category: "projects", course_id: null, priority: "medium", due_at: demoDate(6, 17), estimated_minutes: 30, status: "todo", completed_at: null },
];

const tableDefaults: Record<string, AnyRecord[]> = {
  profiles: [{ id: GUEST_ID, display_name: "Student", language: "en", theme: "light", session_minutes: 25, daily_focus_goal: 120, show_quran: true, time_format: "12h", week_start: 0, onboarded: true }],
  courses: [{ id: DEMO_COURSE_ID, user_id: GUEST_ID, name: "Biochemistry", code: "BIO 204", color: "#6b9e8a", instructor: "Dr. Lina", semester: "Fall 2026", description: "Molecular systems and metabolism", archived: false, created_at: new Date().toISOString() }],
  tasks: DEMO_TASKS,
  events: [{ id: "30000000-0000-4000-8000-000000000001", user_id: GUEST_ID, title: "Biochemistry lecture", description: "Week 7: enzymes", kind: "lecture", course_id: DEMO_COURSE_ID, starts_at: demoDate(1, 10), ends_at: demoDate(1, 11), location: "Room B12", link: null, recurrence: "none", created_at: new Date().toISOString() }],
  reminders: [{ id: "40000000-0000-4000-8000-000000000001", user_id: GUEST_ID, title: "Start lab report", description: "A small start today makes deadline week lighter.", category: "academic", priority: "high", remind_at: demoDate(2, 17), repeat: "none", done: false, created_at: new Date().toISOString() }],
  countdowns: [{ id: "50000000-0000-4000-8000-000000000001", user_id: GUEST_ID, title: "Biochemistry midterm", category: "midterm", color: "#e0a07a", target_at: demoDate(12, 9), course_id: DEMO_COURSE_ID, created_at: new Date().toISOString() }],
  focus_sessions: [{ id: "60000000-0000-4000-8000-000000000001", user_id: GUEST_ID, mode: "pomodoro", planned_minutes: 25, actual_minutes: 25, completed: true, pearls: 10, task_id: null, course_id: DEMO_COURSE_ID, started_at: demoDate(-1, 19), ended_at: demoDate(-1, 19) }],
  flashcard_decks: [], flashcards: [], course_notes: [], course_files: [],
  study_rooms: [{ id: "80000000-0000-4000-8000-000000000001", user_id: GUEST_ID, name: "NEMO study pond", code: "NEMO25", goal: "Finish this week's study plan", owner_id: GUEST_ID, created_at: new Date().toISOString() }], room_members: [
    { id: "81000000-0000-4000-8000-000000000001", room_id: "80000000-0000-4000-8000-000000000001", user_id: GUEST_ID, display_name: "You · NEMO", status: "studying", joined_at: new Date().toISOString() },
    { id: "81000000-0000-4000-8000-000000000002", room_id: "80000000-0000-4000-8000-000000000001", user_id: "friend-fox", display_name: "Lina · Ember", status: "studying", joined_at: new Date().toISOString() },
  ], ai_messages: [], user_animals: [
    { id: "70000000-0000-4000-8000-000000000001", user_id: GUEST_ID, animal_key: "fox", nickname: "Ember", discovered_at: demoDate(-1, 19) },
    { id: "70000000-0000-4000-8000-000000000002", user_id: GUEST_ID, animal_key: "turtle", nickname: "Pebble", discovered_at: demoDate(-2, 18) },
  ],
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readTable(table: string): AnyRecord[] {
  if (canUseStorage()) {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + table);
    if (raw) { try { return JSON.parse(raw); } catch { /* recover with an empty table */ } }
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
        await new QueryBuilder("room_members").insert({ room_id: room["id"], user_id: GUEST_ID, display_name: args?.["_name"] ?? "Guest" });
        return { data: room["id"], error: null };
      }
      return { data: null, error: new Error(`Unsupported local operation: ${name}`) };
    },
  };
}

export { GUEST_ID };
