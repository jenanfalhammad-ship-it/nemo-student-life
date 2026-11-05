import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({ meta: [{ title: "Focus Room — NEMO" }, { name: "description", content: "Focus Room in NEMO." }, { property: "og:title", content: "Focus Room — NEMO" }, { property: "og:description", content: "Focus Room in NEMO." }] }),
  component: () => <ComingSoon en="Focus Room" ar="غرفة التركيز" />,
});
