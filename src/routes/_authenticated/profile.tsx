import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — NEMO" }, { name: "description", content: "Profile in NEMO." }, { property: "og:title", content: "Profile — NEMO" }, { property: "og:description", content: "Profile in NEMO." }] }),
  component: () => <ComingSoon en="Profile" ar="الملف الشخصي" />,
});
