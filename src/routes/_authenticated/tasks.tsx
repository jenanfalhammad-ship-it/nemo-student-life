import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks — NEMO" }, { name: "description", content: "Tasks in NEMO." }, { property: "og:title", content: "Tasks — NEMO" }, { property: "og:description", content: "Tasks in NEMO." }] }),
  component: () => <ComingSoon en="Tasks" ar="المهام" />,
});
