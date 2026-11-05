import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/kit";
import { Nemo } from "@/components/nemo";
import { useTx } from "@/lib/tx";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — NEMO" },
      { name: "description", content: "Choose a new password for your NEMO account." },
      { property: "og:title", content: "Reset password — NEMO" },
      { property: "og:description", content: "Choose a new password for your NEMO account." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const { t } = useTx();
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success(t("saved"));
    nav({ to: "/dashboard" });
  };
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <form onSubmit={save} className="card-soft grid w-full max-w-sm gap-4 p-6">
        <Nemo className="mx-auto h-16 w-16" />
        <h1 className="text-lg font-semibold">{t("setPassword")}</h1>
        <Field label={t("newPassword")}><Input type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Button type="submit">{t("save")}</Button>
      </form>
    </div>
  );
}
