import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/zoo")({
  head: () => ({ meta: [{ title: "My Zoo — NEMO" }, { name: "description", content: "My Zoo in NEMO." }, { property: "og:title", content: "My Zoo — NEMO" }, { property: "og:description", content: "My Zoo in NEMO." }] }),
  component: () => <ComingSoon en="My Zoo" ar="حديقتي" />,
});
