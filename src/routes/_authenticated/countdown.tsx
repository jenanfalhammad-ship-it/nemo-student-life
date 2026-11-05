import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/countdown")({
  head: () => ({ meta: [{ title: "Countdown — NEMO" }, { name: "description", content: "Countdown in NEMO." }, { property: "og:title", content: "Countdown — NEMO" }, { property: "og:description", content: "Countdown in NEMO." }] }),
  component: () => <ComingSoon en="Countdown" ar="العد التنازلي" />,
});
