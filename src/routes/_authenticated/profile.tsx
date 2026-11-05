import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { Field, PageHeader } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useSaveProfile, useUpdate } from "@/lib/data";
import { useTx } from "@/lib/tx";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — NEMO" },
      { name: "description", content: "Profile in NEMO." },
      { property: "og:title", content: "Profile — NEMO" },
      { property: "og:description", content: "Profile in NEMO." },
    ],
  }),
  component: Profile,
});

type ProfileForm = {
  display_name: string;
  university: string;
  major: string;
  semester: string;
  study_goal: string;
};
const EMPTY_FORM: ProfileForm = {
  display_name: "",
  university: "",
  major: "",
  semester: "",
  study_goal: "",
};

function Profile() {
  const { tx, dir } = useTx();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading, error } = useProfile();
  const update = useUpdate("profiles");
  const createProfile = useSaveProfile();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? "",
        university: profile.university ?? "",
        major: profile.major ?? "",
        semester: profile.semester ?? "",
        study_goal: profile.study_goal ?? "",
      });
    }
  }, [profile]);

  const set = (key: keyof ProfileForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = {
      display_name: form.display_name.trim() || null,
      university: form.university.trim() || null,
      major: form.major.trim() || null,
      semester: form.semester.trim() || null,
      study_goal: form.study_goal.trim() || null,
    };
    setSaving(true);
    try {
      if (profile?.id) await update.mutateAsync({ id: profile.id, values });
      else await createProfile.mutateAsync(values);
      toast.success(tx("Profile saved.", "تم حفظ الملف الشخصي."));
    } catch {
      toast.error(
        tx(
          "Could not save your profile. Please try again.",
          "تعذّر حفظ ملفك الشخصي. حاول مرة أخرى.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir={dir}>
      <PageHeader
        title={tx("Profile", "الملف الشخصي")}
        sub={tx(
          "View and update the information stored in your NEMO profile.",
          "اعرض المعلومات المحفوظة في ملفك الشخصي على نيمو وعدّلها.",
        )}
      />
      {isLoading || authLoading ? (
        <p className="text-sm text-muted-foreground">
          {tx("Loading your profile…", "جارٍ تحميل ملفك الشخصي…")}
        </p>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive"
        >
          {tx(
            "Your profile could not be loaded. Refresh the page and try again.",
            "تعذّر تحميل ملفك الشخصي. حدّث الصفحة وحاول مرة أخرى.",
          )}
        </div>
      ) : (
        <form
          onSubmit={(event) => void save(event)}
          className="card-soft grid max-w-2xl gap-4 p-5 sm:grid-cols-2 sm:p-6"
        >
          <Field label={tx("Account email", "بريد الحساب")}>
            <Input
              value={user?.email ?? ""}
              readOnly
              aria-label={tx("Account email", "بريد الحساب")}
              dir="ltr"
            />
          </Field>
          <Field label={tx("Display name", "الاسم الظاهر")}>
            <Input
              id="profile-display-name"
              aria-label={tx("Display name", "الاسم الظاهر")}
              value={form.display_name}
              onChange={set("display_name")}
              autoComplete="name"
            />
          </Field>
          <Field label={tx("University", "الجامعة")}>
            <Input
              id="profile-university"
              aria-label={tx("University", "الجامعة")}
              value={form.university}
              onChange={set("university")}
              autoComplete="organization"
            />
          </Field>
          <Field label={tx("Major", "التخصص")}>
            <Input
              id="profile-major"
              aria-label={tx("Major", "التخصص")}
              value={form.major}
              onChange={set("major")}
            />
          </Field>
          <Field label={tx("Current semester", "الفصل الدراسي الحالي")}>
            <Input
              id="profile-semester"
              aria-label={tx("Current semester", "الفصل الدراسي الحالي")}
              value={form.semester}
              onChange={set("semester")}
            />
          </Field>
          <Field label={tx("Study goal", "الهدف الدراسي")} className="sm:col-span-2">
            <Input
              id="profile-study-goal"
              aria-label={tx("Study goal", "الهدف الدراسي")}
              value={form.study_goal}
              onChange={set("study_goal")}
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? tx("Saving…", "جارٍ الحفظ…") : tx("Save profile", "حفظ الملف الشخصي")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
