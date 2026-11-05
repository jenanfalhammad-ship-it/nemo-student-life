import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/ask")({
  head: () => ({ meta: [{ title: "Ask Nemo — NEMO" }, { name: "description", content: "Ask Nemo in NEMO." }, { property: "og:title", content: "Ask Nemo — NEMO" }, { property: "og:description", content: "Ask Nemo in NEMO." }] }),
  component: () => <ComingSoon en="Ask Nemo" ar="اسأل نيمو" />,
});
