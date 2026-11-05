import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/together")({
  head: () => ({ meta: [{ title: "Study Together — NEMO" }, { name: "description", content: "Study Together in NEMO." }, { property: "og:title", content: "Study Together — NEMO" }, { property: "og:description", content: "Study Together in NEMO." }] }),
  component: () => <ComingSoon en="Study Together" ar="ذاكر مع أصدقائك" />,
});
