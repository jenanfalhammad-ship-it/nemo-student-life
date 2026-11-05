import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — NEMO" }, { name: "description", content: "Calendar in NEMO." }, { property: "og:title", content: "Calendar — NEMO" }, { property: "og:description", content: "Calendar in NEMO." }] }),
  component: () => <ComingSoon en="Calendar" ar="التقويم" />,
});
