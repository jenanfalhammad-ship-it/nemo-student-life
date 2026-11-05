import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/flashcards")({
  head: () => ({ meta: [{ title: "Flashcards — NEMO" }, { name: "description", content: "Flashcards in NEMO." }, { property: "og:title", content: "Flashcards — NEMO" }, { property: "og:description", content: "Flashcards in NEMO." }] }),
  component: () => <ComingSoon en="Flashcards" ar="البطاقات" />,
});
