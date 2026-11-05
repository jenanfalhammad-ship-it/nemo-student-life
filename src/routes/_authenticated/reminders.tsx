import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/reminders")({
  head: () => ({ meta: [{ title: "Reminders — NEMO" }, { name: "description", content: "Reminders in NEMO." }, { property: "og:title", content: "Reminders — NEMO" }, { property: "og:description", content: "Reminders in NEMO." }] }),
  component: () => <ComingSoon en="Reminders" ar="التذكيرات" />,
});
