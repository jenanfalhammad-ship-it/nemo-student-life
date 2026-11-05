import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Day — NEMO" }, { name: "description", content: "My Day in NEMO." }, { property: "og:title", content: "My Day — NEMO" }, { property: "og:description", content: "My Day in NEMO." }] }),
  component: () => <ComingSoon en="My Day" ar="يومي" />,
});
