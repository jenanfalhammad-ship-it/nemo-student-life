import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({ meta: [{ title: "Statistics — NEMO" }, { name: "description", content: "Statistics in NEMO." }, { property: "og:title", content: "Statistics — NEMO" }, { property: "og:description", content: "Statistics in NEMO." }] }),
  component: () => <ComingSoon en="Statistics" ar="الإحصائيات" />,
});
