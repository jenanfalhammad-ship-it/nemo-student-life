import { describe, expect, it } from "vitest";
import { habitatProgress } from "../lib/zoo-progression";

describe("Task-gated habitats", () => {
  it("opens the forest without tasks", () =>
    expect(habitatProgress("forest", []).unlocked).toBe(true));
  it("opens the ocean only after one completed task", () => {
    expect(habitatProgress("ocean", [{ status: "todo" }]).unlocked).toBe(false);
    expect(habitatProgress("ocean", [{ status: "completed" }]).unlocked).toBe(true);
  });
  it("requires three completed tasks for snow", () => {
    expect(habitatProgress("snow", Array(2).fill({ status: "completed" })).unlocked).toBe(false);
    expect(habitatProgress("snow", Array(3).fill({ status: "completed" })).unlocked).toBe(true);
  });
  it("requires five completed tasks for magic", () => {
    expect(habitatProgress("magic", Array(4).fill({ status: "completed" })).unlocked).toBe(false);
    expect(habitatProgress("magic", Array(5).fill({ status: "completed" })).unlocked).toBe(true);
  });

  it("counts only tasks that are currently completed toward the next gate", () => {
    const progress = habitatProgress("snow", [
      { status: "completed" },
      { status: "todo" },
      { status: "in_progress" },
    ]);
    expect(progress).toEqual({ completed: 1, required: 3, remaining: 2, unlocked: false });
  });
});
