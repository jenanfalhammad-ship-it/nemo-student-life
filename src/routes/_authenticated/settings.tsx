import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, Field, NativeSelect, PageHeader } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSaveProfile, useUpdate, type Update } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { useTheme, type Theme } from "@/lib/theme";
import { useTx } from "@/lib/tx";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NEMO" },
      { name: "description", content: "Settings in NEMO." },
      { property: "og:title", content: "Settings — NEMO" },
      { property: "og:description", content: "Settings in NEMO." },
    ],
  }),
  component: Settings,
});

const OWNED_TABLES = [
  "courses",
  "tasks",
  "events",
  "reminders",
  "countdowns",
  "focus_sessions",
  "flashcard_decks",
  "flashcards",
  "course_notes",
  "course_files",
  "user_animals",
  "ai_messages",
] as const;

function Settings() {
  const { tx, dir } = useTx();
  const { lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const { data: profile, isLoading } = useProfile();
  const update = useUpdate("profiles");
  const createOrUpdate = useSaveProfile();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const persist = async (values: Update<"profiles">) => {
    if (profile?.id) {
      await update.mutateAsync({ id: profile.id, values });
    } else {
      await createOrUpdate.mutateAsync(values);
    }
  };

  const reportSaveError = () =>
    toast.error(
      tx(
        "Your choice is active on this device, but could not be saved to your account.",
        "تم تطبيق اختيارك على هذا الجهاز، لكن تعذّر حفظه في حسابك.",
      ),
    );

  const changeLanguage = async (value: string) => {
    if (value !== "en" && value !== "ar") return;
    setLang(value);
    try {
      await persist({ language: value });
    } catch {
      reportSaveError();
    }
  };

  const changeTheme = async (value: string) => {
    if (value !== "light" && value !== "dark" && value !== "system") return;
    setTheme(value as Theme);
    try {
      await persist({ theme: value });
    } catch {
      reportSaveError();
    }
  };

  const changeProfileSetting = async (values: Update<"profiles">) => {
    try {
      await persist(values);
      toast.success(tx("Preference saved", "تم حفظ التفضيل"));
    } catch {
      toast.error(tx("Could not save this preference.", "تعذّر حفظ هذا التفضيل."));
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error("Not signed in");

      const [profileResult, ownedResults] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        Promise.all(
          OWNED_TABLES.map(async (table) => {
            const rows: unknown[] = [];
            let offset = 0;
            while (true) {
              const { data, error } = await supabase
                .from(table)
                .select("*")
                .eq("user_id", user.id)
                .range(offset, offset + 999);
              if (error) throw error;
              rows.push(...(data ?? []));
              if (!data || data.length < 1000) break;
              offset += 1000;
            }
            return [table, rows] as const;
          }),
        ),
      ]);
      if (profileResult.error) throw profileResult.error;
      const payload = {
        exported_at: new Date().toISOString(),
        account: { id: user.id, email: user.email ?? null, created_at: user.created_at },
        profile: profileResult.data,
        records: Object.fromEntries(ownedResults),
        note: "Rows are limited to this authenticated user's records. Course-file rows contain metadata and paths, not downloaded file contents.",
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `nemo-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.success(tx("Your data export has been prepared.", "تم تجهيز نسخة من بياناتك."));
    } catch {
      toast.error(
        tx("Could not export your data. Please try again.", "تعذّر تصدير بياناتك. حاول مرة أخرى."),
      );
    } finally {
      setExporting(false);
    }
  };

  const clearChat = async () => {
    if (
      !window.confirm(
        tx(
          "Delete all of your saved Nemo chat messages? This cannot be undone.",
          "هل تريد حذف جميع رسائل نيمو المحفوظة؟ لا يمكن التراجع عن ذلك.",
        ),
      )
    )
      return;
    setDeleting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error("Not signed in");
      const { error } = await supabase.from("ai_messages").delete().eq("user_id", authData.user.id);
      if (error) throw error;
      toast.success(tx("Saved chat history deleted.", "تم حذف سجل المحادثة المحفوظ."));
    } catch {
      toast.error(tx("Could not delete chat history.", "تعذّر حذف سجل المحادثة."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div dir={dir}>
      <PageHeader
        title={tx("Settings", "الإعدادات")}
        sub={tx(
          "Manage how NEMO looks and how your account data is handled.",
          "تحكّم في مظهر نيمو وطريقة التعامل مع بيانات حسابك.",
        )}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={tx("Appearance", "المظهر")}>
          <fieldset disabled={isLoading} className="grid gap-4 sm:grid-cols-2">
            <Field label={tx("Language", "اللغة")}>
              <NativeSelect
                value={lang}
                onChange={(value) => void changeLanguage(value)}
                options={[
                  { value: "en", label: "English" },
                  { value: "ar", label: "العربية" },
                ]}
              />
            </Field>
            <Field label={tx("Theme", "السمة")}>
              <NativeSelect
                value={theme}
                onChange={(value) => void changeTheme(value)}
                options={[
                  { value: "light", label: tx("Light", "فاتح") },
                  { value: "dark", label: tx("Dark", "داكن") },
                  { value: "system", label: tx("System", "حسب الجهاز") },
                ]}
              />
            </Field>
          </fieldset>
          <p className="mt-3 text-xs text-muted-foreground">
            {tx(
              "Language and theme are saved on this device and synced to your profile when available.",
              "يُحفظ اختيار اللغة والسمة على هذا الجهاز ويُزامن مع ملفك الشخصي عند توفره.",
            )}
          </p>
        </Card>

        <Card title={tx("Preferences", "التفضيلات")}>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              {tx("Loading preferences…", "جارٍ تحميل التفضيلات…")}
            </p>
          ) : (
            <div className="grid gap-4">
              <Field label={tx("Time format", "صيغة الوقت")}>
                <NativeSelect
                  value={profile?.time_format ?? "12h"}
                  onChange={(value) => void changeProfileSetting({ time_format: value })}
                  options={[
                    { value: "12h", label: tx("12-hour", "١٢ ساعة") },
                    { value: "24h", label: tx("24-hour", "٢٤ ساعة") },
                  ]}
                />
              </Field>
              <Field label={tx("First day of week", "أول يوم في الأسبوع")}>
                <NativeSelect
                  value={String(profile?.week_start ?? 0)}
                  onChange={(value) => void changeProfileSetting({ week_start: Number(value) })}
                  options={[
                    { value: "0", label: tx("Sunday", "الأحد") },
                    { value: "1", label: tx("Monday", "الإثنين") },
                    { value: "6", label: tx("Saturday", "السبت") },
                  ]}
                />
              </Field>
              <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {tx("Show daily Quran verse", "عرض آية اليوم")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tx(
                      "This preference is stored in your profile.",
                      "يُحفظ هذا التفضيل في ملفك الشخصي.",
                    )}
                  </p>
                </div>
                <Switch
                  checked={profile?.show_quran ?? true}
                  onCheckedChange={(checked) => void changeProfileSetting({ show_quran: checked })}
                  aria-label={tx("Show daily Quran verse", "عرض آية اليوم")}
                />
              </div>
            </div>
          )}
        </Card>

        <Card title={tx("Your data", "بياناتك")}>
          <p className="mb-4 text-sm text-muted-foreground">
            {tx(
              "Download your profile and records available to your account as a JSON file. Course-file entries include metadata only, not the file contents.",
              "نزّل ملفك الشخصي وسجلات حسابك المتاحة بصيغة JSON. تتضمن سجلات ملفات المواد بياناتها الوصفية فقط، وليس محتوى الملفات.",
            )}
          </p>
          <Button onClick={() => void exportData()} disabled={exporting}>
            {exporting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting
              ? tx("Preparing export…", "جارٍ تجهيز التصدير…")
              : tx("Export my data", "تصدير بياناتي")}
          </Button>
        </Card>

        <Card title={tx("Privacy", "الخصوصية")}>
          <p className="mb-4 text-sm text-muted-foreground">
            {tx(
              "Delete the saved message log associated with your account. This does not enable or disable an AI service.",
              "احذف سجل الرسائل المحفوظ المرتبط بحسابك. هذا الإجراء لا يفعّل خدمة ذكاء اصطناعي ولا يعطّلها.",
            )}
          </p>
          <Button variant="destructive" onClick={() => void clearChat()} disabled={deleting}>
            {deleting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {deleting
              ? tx("Deleting…", "جارٍ الحذف…")
              : tx("Delete Nemo chat history", "حذف سجل محادثة نيمو")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
