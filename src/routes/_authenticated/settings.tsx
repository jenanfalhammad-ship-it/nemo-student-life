import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — NEMO" }, { name: "description", content: "Settings in NEMO." }, { property: "og:title", content: "Settings — NEMO" }, { property: "og:description", content: "Settings in NEMO." }] }),
  component: () => <ComingSoon en="Settings" ar="الإعدادات" />,
});
