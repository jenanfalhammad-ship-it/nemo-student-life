import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/world")({
  head: () => ({ meta: [{ title: "Nemo's World — NEMO" }, { name: "description", content: "Nemo's World in NEMO." }, { property: "og:title", content: "Nemo's World — NEMO" }, { property: "og:description", content: "Nemo's World in NEMO." }] }),
  component: () => <ComingSoon en="Nemo's World" ar="عالم نيمو" />,
});
