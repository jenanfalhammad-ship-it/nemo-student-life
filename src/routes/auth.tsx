import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Nemo } from "@/components/nemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/kit";
import { Toggles } from "@/components/app-shell";
import { useTx } from "@/lib/tx";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — NEMO" },
      { name: "description", content: "Sign in or create your NEMO account." },
      { property: "og:title", content: "Sign in — NEMO" },
      { property: "og:description", content: "Sign in or create your NEMO account." },
    ],
  }),
  component: AuthPage,
});

function appUrl(path: string) {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  return new URL(path.replace(/^\/+/, ""), baseUrl).toString();
}

function AuthPage() {
  const { t, tx } = useTx();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) nav({ to: "/dashboard" });
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) nav({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password: pw,
          options: { emailRedirectTo: appUrl("dashboard") },
        });
        if (error) throw error;
        setSent(t("checkEmail"));
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: appUrl("reset-password"),
        });
        if (error) throw error;
        setSent(t("resetSent"));
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (p: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: appUrl("auth") });
    if (r.error) toast.error(r.error.message);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="absolute end-4 top-4">
        <Toggles compact />
      </div>
      <div className="w-full max-w-sm animate-fade-up">
        <Link to="/" className="mb-6 flex flex-col items-center gap-2 text-center">
          <Nemo mood="default" float className="h-24 w-24" />
          <div className="text-2xl font-extrabold">NEMO</div>
          <div className="text-sm text-muted-foreground">{t("tagline")}</div>
        </Link>
        <div className="card-soft p-6">
          {sent ? (
            <div className="text-center">
              <Nemo mood="celebrating" className="mx-auto h-20 w-20" />
              <p className="mt-3 text-sm">{sent}</p>
              <Button
                variant="link"
                onClick={() => {
                  setSent(null);
                  setMode("in");
                }}
              >
                {t("signIn")}
              </Button>
            </div>
          ) : (
            <>
              <h1 className="mb-4 text-lg font-semibold">
                {mode === "up" ? t("signUp") : mode === "forgot" ? t("forgot") : t("signIn")}
              </h1>
              {mode !== "forgot" && (
                <div className="grid gap-2">
                  <Button variant="outline" onClick={() => oauth("google")}>
                    {t("withGoogle")}
                  </Button>
                  <Button variant="outline" onClick={() => oauth("lovable")}>
                    {tx("Continue with Lovable", "المتابعة باستخدام Lovable")}
                  </Button>
                  <div className="my-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    {tx("or", "أو")}
                    <div className="h-px flex-1 bg-border" />
                  </div>
                </div>
              )}
              <form onSubmit={submit} className="grid gap-3">
                <Field label={t("email")}>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                  />
                </Field>
                {mode !== "forgot" && (
                  <Field label={t("password")}>
                    <Input
                      type="password"
                      required
                      minLength={6}
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      dir="ltr"
                    />
                  </Field>
                )}
                <Button type="submit" disabled={busy}>
                  {mode === "up"
                    ? t("signUp")
                    : mode === "forgot"
                      ? tx("Send link", "إرسال الرابط")
                      : t("signIn")}
                </Button>
              </form>
              <div className="mt-4 flex flex-col items-center gap-1 text-sm">
                {mode === "in" && (
                  <button
                    className="text-muted-foreground hover:underline"
                    onClick={() => setMode("forgot")}
                  >
                    {t("forgot")}
                  </button>
                )}
                {mode === "in" ? (
                  <span className="text-muted-foreground">
                    {t("noAccount")}{" "}
                    <button className="font-semibold text-primary" onClick={() => setMode("up")}>
                      {t("signUp")}
                    </button>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {t("haveAccount")}{" "}
                    <button className="font-semibold text-primary" onClick={() => setMode("in")}>
                      {t("signIn")}
                    </button>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
