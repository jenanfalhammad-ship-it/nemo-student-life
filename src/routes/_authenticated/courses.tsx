import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/courses")({
  head: () => ({ meta: [{ title: "My Courses — NEMO" }, { name: "description", content: "My Courses in NEMO." }, { property: "og:title", content: "My Courses — NEMO" }, { property: "og:description", content: "My Courses in NEMO." }] }),
  component: () => <ComingSoon en="My Courses" ar="موادي" />,
});
