import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({ meta: [{ title: "Events — NEMO" }, { name: "description", content: "Events in NEMO." }, { property: "og:title", content: "Events — NEMO" }, { property: "og:description", content: "Events in NEMO." }] }),
  component: () => <ComingSoon en="Events" ar="الفعاليات" />,
});
