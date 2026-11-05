import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, PawPrint, Sparkles } from "lucide-react";
import { Card, Chip, PageHeader } from "@/components/kit";
import { Nemo } from "@/components/nemo";
import dragon from "@/assets/animal-dragon.png";
import fox from "@/assets/animal-fox.png";
import penguin from "@/assets/animal-penguin.png";
import turtle from "@/assets/animal-turtle.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTx } from "@/lib/tx";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/zoo")({
  head: () => ({
    meta: [
      { title: "My Zoo — NEMO" },
      { name: "description", content: "Your saved NEMO animal discoveries." },
      { property: "og:title", content: "My Zoo — NEMO" },
      { property: "og:description", content: "Your saved NEMO animal discoveries." },
    ],
  }),
  component: ZooPage,
});

const artwork: Record<string, string> = { dragon, fox, penguin, turtle };
const artCatalog = ["fox", "turtle", "penguin", "dragon"];

function ZooPage() {
  const { tx, t, num, dir } = useTx();
  const { user } = useAuth();
  const animalsQuery = useQuery({
    queryKey: ["user_animals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_animals")
        .select("id,animal_key,discovered_at,nickname,user_id")
        .eq("user_id", user!.id)
        .order("discovered_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const sessionQuery = useQuery({
    queryKey: ["zoo-pearls", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("focus_sessions")
        .select("id,pearls")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });
  const animals = useMemo(() => animalsQuery.data ?? [], [animalsQuery.data]);
  const discoveredKeys = useMemo(
    () => new Set(animals.map((animal) => animal.animal_key)),
    [animals],
  );
  const earnedPearls = (sessionQuery.data ?? []).reduce((sum, session) => sum + session.pearls, 0);
  const residents = animals.map((animal) => ({ ...animal, image: artwork[animal.animal_key] }));
  const unrecorded = artCatalog.filter((key) => !discoveredKeys.has(key));

  return (
    <div dir={dir} className="mx-auto w-full max-w-6xl pb-10">
      <PageHeader
        title={tx("My zoo", "حديقتي")}
        sub={tx(
          "A little journal of the companions recorded on your account.",
          "دفتر صغير للحيوانات المسجلة في حسابك.",
        )}
        action={
          <Link
            to="/focus"
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            {tx("Focus room", "غرفة التركيز")} <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <section className="relative mb-5 overflow-hidden rounded-2xl border bg-gradient-to-br from-sage-soft/80 via-card to-sky/50 p-5 sm:p-7">
        <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <Chip className="bg-background/80">
              <PawPrint className="me-1 h-3 w-3" />
              {tx("Your discovery journal", "دفتر اكتشافاتك")}
            </Chip>
            <h2 className="mt-3 text-xl font-semibold">
              {animals.length
                ? tx("Every resident has a real entry.", "لكل ساكن سجل فعلي.")
                : tx(
                    "A quiet habitat, ready for its first recorded resident.",
                    "موطن هادئ ينتظر أول ساكن مسجل.",
                  )}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {tx(
                "This page only shows animals saved in your account. Pearls below are the total awarded by recorded focus sessions—not a spendable balance.",
                "تعرض هذه الصفحة الحيوانات المحفوظة في حسابك فقط. اللآلئ أدناه هي مجموع ما منحته جلسات التركيز المسجلة، وليست رصيدًا قابلًا للإنفاق.",
              )}
            </p>
          </div>
          <Nemo
            mood={animals.length ? "happy" : "sleeping"}
            className="h-24 w-24 self-end sm:h-32 sm:w-32"
            float
          />
        </div>
      </section>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Card className="flex items-center gap-3 p-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-peach">
            <PawPrint className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{num(animals.length)}</div>
            <div className="text-xs text-muted-foreground">
              {tx("Recorded residents", "الحيوانات المسجلة")}
            </div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-lavender">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{num(earnedPearls)}</div>
            <div className="text-xs text-muted-foreground">
              {tx("Pearls awarded in recorded sessions", "اللآلئ الممنوحة في الجلسات المسجلة")}
            </div>
          </div>
        </Card>
      </div>

      {animalsQuery.isError && (
        <Card className="mb-5 border-destructive/40">
          <p className="text-sm font-medium">
            {tx(
              "Your saved animal collection could not be loaded.",
              "تعذر تحميل مجموعة الحيوانات المحفوظة.",
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tx(
              "The page needs the user_animals table to be available to your signed-in account.",
              "تحتاج الصفحة إلى إتاحة جدول user_animals لحسابك المسجل.",
            )}
          </p>
        </Card>
      )}
      {sessionQuery.isError && (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          {tx(
            "Focus pearl totals are unavailable until focus_sessions can be read.",
            "إجمالي لآلئ التركيز غير متاح حتى يمكن قراءة focus_sessions.",
          )}
        </p>
      )}

      <Card
        title={tx("Your recorded residents", "حيواناتك المسجلة")}
        action={
          <span className="text-xs text-muted-foreground">
            {num(animals.length)} {tx("saved", "مسجلة")}
          </span>
        }
      >
        {animalsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : animalsQuery.isError ? (
          <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
            {tx(
              "Collection unavailable. No discovery claims are shown.",
              "المجموعة غير متاحة. لا نعرض أي اكتشافات غير مؤكدة.",
            )}
          </div>
        ) : residents.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {residents.map((animal) => (
              <article
                key={animal.id}
                className="card-hover flex min-w-0 items-center gap-3 rounded-xl border bg-background/70 p-3"
              >
                {animal.image ? (
                  <img
                    src={animal.image}
                    alt={animal.nickname || animal.animal_key}
                    className="h-16 w-16 shrink-0 object-contain"
                  />
                ) : (
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-muted">
                    <PawPrint className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">
                    {animal.nickname ||
                      tx(
                        animal.animal_key.charAt(0).toUpperCase() + animal.animal_key.slice(1),
                        animal.animal_key,
                      )}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {tx("Recorded", "تاريخ التسجيل")} ·{" "}
                    {new Date(animal.discovered_at).toLocaleDateString(tx("en-US", "ar-SA"), {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-8 text-center">
            <Nemo mood="sleeping" className="h-16 w-16" />
            <p className="text-sm text-muted-foreground">{t("zooEmpty")}</p>
            <p className="max-w-md text-xs text-muted-foreground">
              {tx(
                "There is no supported animal-unlock flow in the current database setup, so this journal will not invent one.",
                "لا توجد آلية موثقة لفتح الحيوانات في إعداد قاعدة البيانات الحالي، لذلك لن ننشئ آلية غير موجودة.",
              )}
            </p>
          </div>
        )}
      </Card>

      {!animalsQuery.isError && (
        <Card className="mt-5" title={tx("Artwork in this habitat", "الرسومات المتاحة في الموطن")}>
          <p className="mb-4 text-xs text-muted-foreground">
            {tx(
              "These supplied images are a visual catalog only. An animal is marked as a resident only when an actual user_animals row exists.",
              "هذه الصور المتوفرة للعرض فقط. لا يُعد الحيوان ساكنًا إلا عند وجود سجل فعلي له في user_animals.",
            )}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {artCatalog.map((key) => (
              <div
                key={key}
                className={`rounded-xl border p-3 text-center ${discoveredKeys.has(key) ? "bg-sage-soft/45" : "bg-muted/25"}`}
              >
                <img
                  src={artwork[key]}
                  alt={key}
                  className="mx-auto h-20 w-20 object-contain sm:h-24 sm:w-24"
                />
                <div className="text-sm font-medium">
                  {tx(
                    key.charAt(0).toUpperCase() + key.slice(1),
                    key === "fox"
                      ? "ثعلب"
                      : key === "turtle"
                        ? "سلحفاة"
                        : key === "penguin"
                          ? "بطريق"
                          : "تنين",
                  )}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {discoveredKeys.has(key)
                    ? tx("Recorded resident", "ساكن مسجل")
                    : tx("No saved entry", "لا يوجد سجل محفوظ")}
                </div>
              </div>
            ))}
          </div>
          {unrecorded.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {tx(
                "No claim button is shown: the current schema has no verified purchase/unlock operation.",
                "لا يظهر زر اكتساب؛ فالمخطط الحالي لا يتضمن عملية شراء أو فتح موثقة.",
              )}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
