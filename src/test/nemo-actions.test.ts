import { describe, expect, it } from "vitest";
import { actionValues, deletionCandidates, type NemoAction, type NemoWorkspace } from "@/lib/nemo-actions";

const action: NemoAction = { op: "create", table: "tasks", id: null, title: "مذاكرة رياضيات", when: "2026-11-07T13:00:00+03:00", end: null, priority: null, category: "studying", minutes: null, kind: null, description: null };
const workspace: NemoWorkspace = { tasks: [{ id: "one", title: "Math", status: "todo" }, { id: "two", title: "Physics", status: "completed" }], events: [], reminders: [], countdowns: [], courses: [] };
describe("Nemo actions", () => {
  it("saves the math title separately from today's 1 PM Riyadh time", () => {
    expect(actionValues(action)).toMatchObject({ title: "مذاكرة رياضيات", due_at: "2026-11-07T10:00:00.000Z" });
  });
  it("proposes every task, including completed ones, without deleting", () => {
    const before = structuredClone(workspace);
    const actions = workspace.tasks.map((task) => ({ ...action, op: "delete" as const, id: task.id }));
    expect(deletionCandidates(actions, workspace).map((item) => item.id)).toEqual(["one", "two"]);
    expect(workspace).toEqual(before);
  });
  it("cannot propose deleting an id outside the provided workspace", () => {
    expect(deletionCandidates([{ ...action, op: "delete", id: "someone-else" }], workspace)).toEqual([]);
  });
  it("rejects a due time without an explicit timezone", () => {
    expect(() => actionValues({ ...action, when: "2026-11-07T13:00:00" })).toThrow("timezone");
  });
});