import type { Habitat } from "./catalog";

export const HABITAT_TASKS: Record<Habitat, number> = { forest: 0, ocean: 1, snow: 3, magic: 5 };
export function habitatProgress(habitat: Habitat, tasks: { status: string }[]) {
  const completed = tasks.filter((task) => task.status === "completed").length;
  const required = HABITAT_TASKS[habitat];
  return { completed, required, remaining: Math.max(0, required - completed), unlocked: completed >= required };
}