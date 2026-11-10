import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Nemo } from "@/components/nemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/kit";
import { useProfile, useSaveProfile, useUpdate } from "@/lib/data";
import type { Update } from "@/lib/data";
import { useTx } from "@/lib/tx";
import "@/page-themes/onboarding.css";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — NEMO" },
      { name: "description", content: "Set up NEMO." },
      { property: "og:title", content: "Welcome — NEMO" },
      { property: "og:description", content: "Set up NEMO." },
    ],
  }),
  component: Onboarding,
});

type OnboardingForm = {
  display_name: string;
  university: string;
  major: string;
  semester: string;
  course_count: string;
  study_goal: string;
  session_minutes: string;
};
const EMPTY_FORM: OnboardingForm = {
  display_name: "",
  university: "",
  major: "",
  semester: "",
  course_count: "",
  study_goal: "",
  session_minutes: "",
};

function Onboarding() {
  const { tx, dir } = useTx();
  const nav = useNavigate();
  const { data: profile, isLoading, error } = useProfile();
  const update = useUpdate("profiles");
  const createProfile = useSaveProfile();
  const [form, setForm] = useState<OnboardingForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? "",
        university: profile.university ?? "",
        major: profile.major ?? "",
        semester: profile.semester ?? "",
        course_count: profile.course_count == null ? "" : String(profile.course_count),
        study_goal: profile.study_goal ?? "",
        session_minutes: String(profile.session_minutes),
      });
    }
  }, [profile]);

  const set = (key: keyof OnboardingForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const done = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values: Update<"profiles"> = {
      display_name: form.display_name.trim() || null,
      university: form.university.trim() || null,
      major: form.major.trim() || null,
      semester: form.semester.trim() || null,
      course_count: form.course_count === "" ? null : Number(form.course_count),
      study_goal: form.study_goal.trim() || null,
      onboarded: true,
    };
    if (form.session_minutes !== "") values.session_minutes = Number(form.session_minutes);

    setSaving(true);
    try {
      if (profile?.id) await update.mutateAsync({ id: profile.id, values });
      else await createProfile.mutateAsync(values);
      nav({ to: "/dashboard" });
    } catch {
      toast.error(
        tx("Could not save your setup. Please try again.", "تعذّر حفظ إعداداتك. حاول مرة أخرى."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      dir={dir}
      className="nemo-sea-page nemo-sea-page--onboarding grid min-h-screen place-items-center"
    >
      <section className="onboarding-shell">
        <header className="onboarding-intro">
          <div className="onboarding-intro-copy">
            <div className="onboarding-kicker">
              <Sparkles aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
              NEMO
            </div>
            <h1 className="onboarding-title">
              {tx("Let's set up your NEMO", "لنجهّز نيمو الخاص بك")}
            </h1>
            <p className="onboarding-description">
              {tx(
                "Add what you'd like. You can leave fields blank and update them later.",
                "أضف ما ترغب به. يمكنك ترك الحقول فارغة وتعديلها لاحقًا.",
              )}
            </p>
          </div>
          <Nemo mood="celebrating" className="onboarding-mascot" />
        </header>
        <div className="onboarding-body">
          {isLoading ? (
            <p className="onboarding-status">
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {tx("Loading your saved profile…", "جارٍ تحميل ملفك المحفوظ…")}
              </span>
            </p>
          ) : error ? (
            <p role="alert" className="onboarding-status">
              {tx(
                "Your saved profile could not be loaded. Refresh the page and try again.",
                "تعذّر تحميل ملفك المحفوظ. حدّث الصفحة وحاول مرة أخرى.",
              )}
            </p>
          ) : (
            <form
              onSubmit={(event) => void done(event)}
              className="onboarding-fields grid sm:grid-cols-2"
            >
              <Field label={tx("What should we call you?", "بماذا نناديك؟")}>
                <Input
                  id="onboarding-display-name"
                  aria-label={tx("What should we call you?", "بماذا نناديك؟")}
                  value={form.display_name}
                  onChange={set("display_name")}
                  autoComplete="name"
                />
              </Field>
              <Field label={tx("University", "الجامعة")}>
                <Input
                  id="onboarding-university"
                  aria-label={tx("University", "الجامعة")}
                  value={form.university}
                  onChange={set("university")}
                  autoComplete="organization"
                />
              </Field>
              <Field label={tx("Major", "التخصص")}>
                <Input
                  id="onboarding-major"
                  aria-label={tx("Major", "التخصص")}
                  value={form.major}
                  onChange={set("major")}
                />
              </Field>
              <Field label={tx("Current semester", "الفصل الدراسي الحالي")}>
                <Input
                  id="onboarding-semester"
                  aria-label={tx("Current semester", "الفصل الدراسي الحالي")}
                  value={form.semester}
                  onChange={set("semester")}
                />
              </Field>
              <Field label={tx("Number of courses (optional)", "عدد المواد (اختياري)")}>
                <Input
                  id="onboarding-course-count"
                  aria-label={tx("Number of courses (optional)", "عدد المواد (اختياري)")}
                  type="number"
                  min="0"
                  step="1"
                  value={form.course_count}
                  onChange={set("course_count")}
                />
              </Field>
              <Field
                label={tx(
                  "Preferred focus-session length (minutes)",
                  "مدة جلسة التركيز المفضلة (بالدقائق)",
                )}
              >
                <Input
                  id="onboarding-session-minutes"
                  aria-label={tx(
                    "Preferred focus-session length (minutes)",
                    "مدة جلسة التركيز المفضلة (بالدقائق)",
                  )}
                  type="number"
                  min="1"
                  step="1"
                  value={form.session_minutes}
                  onChange={set("session_minutes")}
                />
              </Field>
              <Field
                label={tx("Your study goal (optional)", "هدفك الدراسي (اختياري)")}
                className="sm:col-span-2"
              >
                <Input
                  id="onboarding-study-goal"
                  aria-label={tx("Your study goal (optional)", "هدفك الدراسي (اختياري)")}
                  value={form.study_goal}
                  onChange={set("study_goal")}
                />
              </Field>
              <div className="onboarding-actions sm:col-span-2">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {saving ? tx("Saving…", "جارٍ الحفظ…") : tx("Finish", "إنهاء")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
