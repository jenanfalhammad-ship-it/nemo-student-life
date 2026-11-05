import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Nemo } from "@/components/nemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/kit";
import { useSaveProfile } from "@/lib/data";
import { useTx } from "@/lib/tx";
export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — NEMO" }, { name: "description", content: "Set up NEMO." }, { property: "og:title", content: "Welcome — NEMO" }, { property: "og:description", content: "Set up NEMO." }] }),
  component: Onboarding,
});
function Onboarding() {
  const { t } = useTx();
  const nav = useNavigate();
  const save = useSaveProfile();
  const [f, setF] = useState({ display_name: "", university: "", major: "", semester: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const done = async () => { await save.mutateAsync({ ...f, onboarded: true }); nav({ to: "/dashboard" }); };
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="card-soft grid w-full max-w-md gap-3 p-6">
        <Nemo mood="celebrating" className="mx-auto h-20 w-20" />
        <h1 className="text-center text-xl font-bold">{t("welcomeTitle")}</h1>
        <Field label={t("displayName")}><Input value={f.display_name} onChange={set("display_name")} /></Field>
        <Field label={t("university")}><Input value={f.university} onChange={set("university")} /></Field>
        <Field label={t("major")}><Input value={f.major} onChange={set("major")} /></Field>
        <Field label={t("semester")}><Input value={f.semester} onChange={set("semester")} /></Field>
        <Button onClick={done} disabled={save.isPending}>{t("finish")}</Button>
      </div>
    </div>
  );
}
