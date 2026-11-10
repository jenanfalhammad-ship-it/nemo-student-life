import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Heart,
  LockKeyhole,
  PawPrint,
  Sparkles,
  Star,
  Trees,
  Waves,
} from "lucide-react";
import { Card, Chip, PageHeader } from "@/components/kit";
import { Nemo } from "@/components/nemo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useInsert, useRows } from "@/lib/data";
import { ANIMALS, type Animal, type Habitat, type Rarity } from "@/lib/catalog";
import { useTx } from "@/lib/tx";
import { habitatProgress } from "@/lib/zoo-progression";
import zooMap from "@/assets/personal-zoo-map.jpg";

import "@/page-themes/zoo.css";

export const Route = createFileRoute("/_authenticated/zoo")({
  head: () => ({
    meta: [
      { title: "My Zoo — NEMO" },
      { name: "description", content: "Explore your growing NEMO zoo." },
    ],
  }),
  component: ZooPage,
});

const habitatInfo: Record<
  Habitat,
  {
    en: string;
    ar: string;
    shortEn: string;
    shortAr: string;
    icon: typeof Trees;
    color: string;
    pin: { x: number; y: number };
  }
> = {
  forest: {
    en: "Whispering Forest",
    ar: "غابة الهمسات",
    shortEn: "Forest",
    shortAr: "الغابة",
    icon: Trees,
    color: "#c5edc4",
    pin: { x: 24, y: 13 },
  },
  ocean: {
    en: "Bubble Bay",
    ar: "خليج الفقاعات",
    shortEn: "Ocean",
    shortAr: "المحيط",
    icon: Waves,
    color: "#bfeaf0",
    pin: { x: 76, y: 13 },
  },
  snow: {
    en: "Snowy Valley",
    ar: "وادي الثلج",
    shortEn: "Snow valley",
    shortAr: "وادي الثلج",
    icon: Sparkles,
    color: "#dce7fa",
    pin: { x: 24, y: 88 },
  },
  magic: {
    en: "Starlight Garden",
    ar: "حديقة النجوم",
    shortEn: "Starlight",
    shortAr: "حديقة النجوم",
    icon: Star,
    color: "#eadbfa",
    pin: { x: 77, y: 88 },
  },
};

const rarityColor: Record<Rarity, string> = {
  common: "bg-sage-soft text-primary-deep",
  rare: "bg-sky text-sky-ink",
  epic: "bg-lavender text-violet-700 dark:text-violet-200",
  legendary: "bg-peach text-orange-800 dark:text-orange-200",
};

const animalSpots: Record<string, { x: number; y: number }> = {
  fox: { x: 10, y: 29 },
  rabbit: { x: 40, y: 36 },
  owl: { x: 33, y: 20 },
  turtle: { x: 66, y: 30 },
  fish: { x: 80, y: 24 },
  whale: { x: 91, y: 38 },
  penguin: { x: 12, y: 68 },
  polar: { x: 37, y: 77 },
  unicorn: { x: 65, y: 77 },
  dragon: { x: 87, y: 70 },
};

function ZooPage() {
  const { tx, num, dir } = useTx();
  const { user } = useAuth();
  const {
    data: residents = [],
    isLoading: animalsLoading,
    isError: animalsError,
  } = useRows("user_animals", { order: "discovered_at", asc: false });
  const { data: tasks = [], isLoading: tasksLoading } = useRows("tasks", {
    order: "created_at",
    asc: false,
  });
  const { data: sessions = [] } = useRows("focus_sessions", {
    order: "started_at",
    asc: false,
  });
  const discover = useInsert("user_animals");
  const [habitatFilter, setHabitatFilter] = useState<Habitat | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const discovered = useMemo(
    () => new Set(residents.map((animal) => animal.animal_key)),
    [residents],
  );
  const completedTasks = tasks.filter((task) => task.status === "completed");
  const totalPearls = sessions.reduce((sum, session) => sum + (session.pearls ?? 0), 0);
  const filteredAnimals =
    habitatFilter === "all"
      ? ANIMALS
      : ANIMALS.filter((animal) => animal.habitat === habitatFilter);
  const selectedAnimal = ANIMALS.find((animal) => animal.key === selected);

  const gateFor = (habitat: Habitat) => {
    const progress = habitatProgress(habitat, completedTasks);
    const hasResident = ANIMALS.some(
      (animal) => animal.habitat === habitat && discovered.has(animal.key),
    );
    return { ...progress, unlocked: progress.unlocked || hasResident };
  };

  const claimAnimal = async (animal: Animal) => {
    if (
      !user ||
      !gateFor(animal.habitat).unlocked ||
      discovered.has(animal.key) ||
      discover.isPending
    )
      return;
    try {
      await discover.mutateAsync({
        animal_key: animal.key,
        nickname: null,
        discovered_at: new Date().toISOString(),
        user_id: user.id,
      });
    } catch {
      // The shared mutation reports the database error; the animal remains unclaimed.
    }
  };

  const nextGate = (Object.keys(habitatInfo) as Habitat[])
    .map((habitat) => ({ habitat, ...gateFor(habitat) }))
    .find((gate) => !gate.unlocked);

  return (
    <div dir={dir} className="nemo-sea-page nemo-sea-page--zoo mx-auto w-full max-w-7xl pb-10">
      <PageHeader
        title={tx("My Zoo", "حديقتي")}
        sub={tx(
          "A little world that grows with every task you finish. Your animals have room to roam.",
          "عالمك الصغير يكبر مع كل مهمة تنجزها، وحيواناتك تتجول بحرية في موطنها.",
        )}
        action={
          <Link
            to="/tasks"
            className="inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <PawPrint className="h-4 w-4 text-primary" />
            {tx("Complete a task", "أنجز مهمة")}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={<PawPrint />}
          tone="bg-sage-soft text-primary-deep"
          label={tx("Your residents", "حيواناتك")}
          value={`${num(discovered.size)} / ${num(ANIMALS.length)}`}
        />
        <StatTile
          icon={<Sparkles />}
          tone="bg-lavender text-violet-700 dark:text-violet-200"
          label={tx("Focus pearls", "لآلئ التركيز")}
          value={num(totalPearls)}
        />
        <StatTile
          icon={nextGate ? <LockKeyhole /> : <Check />}
          tone={nextGate ? "bg-peach text-orange-800 dark:text-orange-200" : "bg-sky text-sky-ink"}
          label={tx("Next gate", "البوابة القادمة")}
          value={
            nextGate
              ? `${num(nextGate.remaining)} ${tx("tasks to go", "مهام متبقية")}`
              : tx("All habitats open", "كل المواطن مفتوحة")
          }
        />
      </section>

      <section className="mb-6 overflow-hidden rounded-[1.75rem] border bg-card shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gradient-to-r from-sage-soft/70 via-sky/50 to-lavender/70 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/80 text-primary shadow-sm">
              <Trees className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold">{tx("Your living park", "حديقتك الحيّة")}</h2>
              <p className="text-xs text-muted-foreground">
                {tx(
                  "Only your discovered companions appear on this map.",
                  "تظهر في الخريطة حيواناتك المكتشفة فقط.",
                )}
              </p>
            </div>
          </div>
          <Chip className="bg-white/85 text-primary-deep">
            <Sparkles className="me-1 h-3.5 w-3.5" />
            {num(completedTasks.length)} {tx("tasks completed", "مهام منجزة")}
          </Chip>
        </div>

        <div
          className="zoo-map relative isolate aspect-[3/2] min-h-[360px] overflow-hidden bg-cover bg-center sm:min-h-[470px]"
          style={{ backgroundImage: `url(${zooMap})` }}
          aria-label={tx("Map of your personal zoo", "خريطة حديقة حيواناتك الخاصة")}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-slate-950/10" />

          {(Object.keys(habitatInfo) as Habitat[]).map((habitat) => {
            const info = habitatInfo[habitat];
            const gate = gateFor(habitat);
            const Icon = info.icon;
            return (
              <div
                key={habitat}
                className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 ${gate.unlocked ? "" : "zoo-gate-locked"}`}
                style={{ left: `${info.pin.x}%`, top: `${info.pin.y}%` }}
              >
                <button
                  type="button"
                  onClick={() => setHabitatFilter(habitat)}
                  className={`flex max-w-[45vw] items-center gap-2 rounded-2xl border px-2.5 py-2 text-start shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 sm:max-w-none sm:px-3 ${gate.unlocked ? "border-white/80 bg-white/90 text-slate-800" : "border-white/50 bg-slate-900/80 text-white"}`}
                  aria-label={`${tx(info.en, info.ar)}${gate.unlocked ? "" : ` · ${num(gate.remaining)} ${tx("tasks remaining", "مهام متبقية")}`}`}
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                    style={{ backgroundColor: info.color }}
                  >
                    {gate.unlocked ? (
                      <Icon className="h-4 w-4 text-slate-800" />
                    ) : (
                      <LockKeyhole className="h-4 w-4 text-slate-800" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-extrabold sm:text-xs">
                      {tx(info.shortEn, info.shortAr)}
                    </span>
                    <span
                      className={`block text-[10px] font-semibold ${gate.unlocked ? "text-emerald-800" : "text-white/80"}`}
                    >
                      {gate.unlocked
                        ? tx("Gate open", "البوابة مفتوحة")
                        : `${num(gate.completed)} / ${num(gate.required)} ${tx("tasks", "مهام")}`}
                    </span>
                  </span>
                </button>
                {!gate.unlocked && (
                  <div className="mx-auto mt-1 max-w-[46vw] rounded-xl border border-white/50 bg-slate-900/80 px-2 py-1.5 text-center text-[9px] font-semibold text-white shadow-lg backdrop-blur sm:max-w-40 sm:text-[10px]">
                    <div className="mb-1 flex items-center justify-center gap-1">
                      <LockKeyhole className="h-3 w-3" />
                      {tx("Fence closed", "السياج مغلق")}
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/25">
                      <div
                        className="h-full rounded-full bg-amber-300 transition-all"
                        style={{
                          width: `${Math.min(100, (gate.completed / gate.required) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="mt-1 block">
                      {num(gate.remaining)} {tx("more completed tasks", "مهام منجزة لفتحه")}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {!animalsLoading && discovered.size === 0 && (
            <div className="absolute left-1/2 top-1/2 z-20 w-[min(80%,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/70 bg-white/90 p-4 text-center shadow-xl backdrop-blur sm:p-5">
              <Nemo mood="encouraging" className="mx-auto h-16 w-16" float />
              <p className="mt-2 font-extrabold text-slate-800">
                {tx("Your park is ready for its first resident", "حديقتك جاهزة لأول ساكن فيها")}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {tx(
                  "Start with the open forest below. Finish tasks to open the fenced habitats.",
                  "ابدأ بالغابة المفتوحة أدناه، وأنجز المهام لفتح المواطن المسيّجة.",
                )}
              </p>
            </div>
          )}

          {ANIMALS.filter((animal) => discovered.has(animal.key)).map((animal) => {
            const spot = animalSpots[animal.key];
            if (!spot) return null;
            return (
              <button
                key={animal.key}
                type="button"
                onClick={() => setSelected(animal.key)}
                className="zoo-animal-marker group absolute z-20 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white/90 bg-white/80 text-2xl shadow-lg backdrop-blur transition hover:scale-125 sm:h-12 sm:w-12"
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                aria-label={tx(animal.en, animal.ar)}
                title={tx(animal.en, animal.ar)}
              >
                {animal.img ? (
                  <img
                    src={animal.img}
                    alt=""
                    className="zoo-animal-drift h-8 w-8 object-contain sm:h-10 sm:w-10"
                  />
                ) : (
                  <span className="zoo-animal-drift leading-none">{animal.emoji}</span>
                )}
                <span className="pointer-events-none absolute -bottom-2 -end-1 rounded-full bg-rose-500 p-0.5 text-white opacity-0 transition group-hover:opacity-100">
                  <Heart className="h-2.5 w-2.5 fill-current" />
                </span>
              </button>
            );
          })}

          <div className="absolute bottom-3 start-1/2 z-30 -translate-x-1/2 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-center text-[10px] font-bold text-slate-700 shadow-lg backdrop-blur sm:bottom-4 sm:px-4 sm:py-2 sm:text-xs">
            {num(discovered.size)} / {num(ANIMALS.length)}{" "}
            {tx("residents exploring", "حيوانات تتجول")}
          </div>
        </div>
      </section>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold">
            {tx("Meet your next companion", "تعرّف على رفيقك القادم")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tx(
              "Each new area opens as you finish more of your tasks.",
              "كل منطقة جديدة تفتح مع إنجاز المزيد من مهامك.",
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={habitatFilter === "all"}
            onClick={() => setHabitatFilter("all")}
            icon={<PawPrint className="h-4 w-4" />}
          >
            {tx("All habitats", "كل المواطن")}
          </FilterButton>
          {(Object.keys(habitatInfo) as Habitat[]).map((habitat) => {
            const info = habitatInfo[habitat];
            const Icon = info.icon;
            return (
              <FilterButton
                key={habitat}
                active={habitatFilter === habitat}
                onClick={() => setHabitatFilter(habitat)}
                icon={<Icon className="h-4 w-4" />}
              >
                {tx(info.shortEn, info.shortAr)}
              </FilterButton>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAnimals.map((animal) => {
            const info = habitatInfo[animal.habitat];
            const open = gateFor(animal.habitat).unlocked;
            const claimed = discovered.has(animal.key);
            return (
              <button
                key={animal.key}
                type="button"
                onClick={() => setSelected(animal.key)}
                className={`group relative overflow-hidden rounded-3xl border p-3 text-start shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lift ${claimed ? "bg-card" : "bg-card/80"}`}
              >
                <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${rarityColor[animal.rarity]}`}
                  >
                    {tx(
                      animal.rarity,
                      animal.rarity === "common"
                        ? "شائع"
                        : animal.rarity === "rare"
                          ? "نادر"
                          : animal.rarity === "epic"
                            ? "ملحمي"
                            : "أسطوري",
                    )}
                  </span>
                  {claimed ? (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white shadow-sm">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : !open ? (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900/80 text-white">
                      <LockKeyhole className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/80 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <div
                  className="grid min-h-40 place-items-center overflow-hidden rounded-2xl p-5"
                  style={{ background: `linear-gradient(145deg, ${info.color}, #ffffffcc)` }}
                >
                  {animal.img ? (
                    <img
                      src={animal.img}
                      alt={tx(animal.en, animal.ar)}
                      className={`zoo-animal-drift h-28 w-28 object-contain transition group-hover:scale-110 ${claimed ? "" : "grayscale-[.35]"}`}
                    />
                  ) : (
                    <span
                      className={`zoo-animal-drift text-7xl transition group-hover:scale-110 ${claimed ? "" : "grayscale-[.35]"}`}
                    >
                      {animal.emoji}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">{tx(animal.en, animal.ar)}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <PawPrint className="h-3 w-3" />
                      {tx(info.en, info.ar)}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-3 rounded-xl bg-muted/65 px-2.5 py-2 text-xs font-medium text-muted-foreground">
                  {claimed
                    ? tx("In your park · tap for details", "يسكن حديقتك · اضغط للتفاصيل")
                    : open
                      ? tx("Ready to welcome · tap to adopt", "جاهز للترحيب · اضغط لاستضافته")
                      : tx(
                          `${num(gateFor(animal.habitat).remaining)} tasks to open this habitat`,
                          `${num(gateFor(animal.habitat).remaining)} مهام لفتح هذا الموطن`,
                        )}
                </p>
              </button>
            );
          })}
        </div>

        <aside className="space-y-4">
          <Card title={tx("Habitat trail", "مسار المواطن")}>
            <div className="space-y-3">
              {(Object.keys(habitatInfo) as Habitat[]).map((habitat, index) => {
                const info = habitatInfo[habitat];
                const gate = gateFor(habitat);
                const Icon = info.icon;
                const residentCount = ANIMALS.filter(
                  (animal) => animal.habitat === habitat && discovered.has(animal.key),
                ).length;
                const total = ANIMALS.filter((animal) => animal.habitat === habitat).length;
                const progressValue =
                  gate.required === 0 ? 100 : Math.min(100, (gate.completed / gate.required) * 100);
                return (
                  <div
                    key={habitat}
                    className={`relative flex gap-3 rounded-2xl border p-3 transition ${gate.unlocked ? "bg-card" : "bg-muted/50"}`}
                  >
                    {index < 3 && (
                      <span className="absolute start-[1.35rem] top-12 h-5 border-s border-dashed border-border" />
                    )}
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                      style={{ backgroundColor: info.color }}
                    >
                      {gate.unlocked ? (
                        <Icon className="h-4 w-4 text-slate-800" />
                      ) : (
                        <LockKeyhole className="h-4 w-4 text-slate-700" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold">{tx(info.en, info.ar)}</p>
                        <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                          {num(residentCount)}/{num(total)}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${gate.unlocked ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${progressValue}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-muted-foreground">
                        {gate.unlocked
                          ? tx("Open · explore freely", "مفتوح · استكشف بحرية")
                          : `${num(gate.completed)} / ${num(gate.required)} ${tx("tasks completed", "مهام منجزة")}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-lavender/85 via-card to-peach/65">
            <div className="flex items-start gap-3">
              <Nemo mood="encouraging" className="h-14 w-14 shrink-0" />
              <div>
                <p className="font-extrabold">{tx("A task, a new trail", "كل مهمة تفتح دربًا")}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {nextGate
                    ? tx(
                        `Finish ${nextGate.remaining} more task${nextGate.remaining === 1 ? "" : "s"} and the ${habitatInfo[nextGate.habitat].en} gate opens.`,
                        `أنجز ${num(nextGate.remaining)} ${nextGate.remaining === 1 ? "مهمة" : "مهام"} إضافية لتفتح بوابة ${habitatInfo[nextGate.habitat].ar}.`,
                      )
                    : tx(
                        "Every habitat is open. Keep collecting companions and caring for your park.",
                        "كل المواطن مفتوحة. واصل جمع الرفاق والاهتمام بحديقتك.",
                      )}
                </p>
                {nextGate && (
                  <Button asChild size="sm" className="mt-3">
                    <Link to="/tasks">
                      {tx("See my tasks", "شاهد مهامي")}
                      <ArrowUpRight />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </Card>
          {animalsError && (
            <Card className="border-destructive/40">
              <p className="flex items-start gap-2 text-sm text-destructive">
                <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />
                {tx(
                  "Your resident list could not be loaded. The map is still here, but new companions cannot be saved yet.",
                  "تعذر تحميل قائمة حيواناتك. الخريطة متاحة، لكن لا يمكن حفظ رفاق جدد الآن.",
                )}
              </p>
            </Card>
          )}
        </aside>
      </div>

      {selectedAnimal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="animal-title"
            className="w-full max-w-md overflow-hidden rounded-[1.75rem] border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="relative grid min-h-48 place-items-center p-5"
              style={{
                background: `linear-gradient(145deg, ${habitatInfo[selectedAnimal.habitat].color}, #fff)`,
              }}
            >
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute end-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-xl shadow-sm"
                aria-label={tx("Close", "إغلاق")}
              >
                ×
              </button>
              {selectedAnimal.img ? (
                <img
                  src={selectedAnimal.img}
                  alt={tx(selectedAnimal.en, selectedAnimal.ar)}
                  className="zoo-animal-drift h-36 w-36 object-contain"
                />
              ) : (
                <span className="zoo-animal-drift text-8xl">{selectedAnimal.emoji}</span>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <Chip className={rarityColor[selectedAnimal.rarity]}>
                  {tx(
                    selectedAnimal.rarity,
                    selectedAnimal.rarity === "common"
                      ? "شائع"
                      : selectedAnimal.rarity === "rare"
                        ? "نادر"
                        : selectedAnimal.rarity === "epic"
                          ? "ملحمي"
                          : "أسطوري",
                  )}
                </Chip>
                <span className="text-xs text-muted-foreground">
                  {tx(
                    habitatInfo[selectedAnimal.habitat].en,
                    habitatInfo[selectedAnimal.habitat].ar,
                  )}
                </span>
              </div>
              <h2 id="animal-title" className="mt-2 text-2xl font-extrabold">
                {tx(selectedAnimal.en, selectedAnimal.ar)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {discovered.has(selectedAnimal.key)
                  ? tx(
                      "This little friend is one of your residents and can be spotted wandering around its habitat.",
                      "هذا الرفيق أحد سكان حديقتك، ويمكنك مشاهدته يتجول في موطنه.",
                    )
                  : gateFor(selectedAnimal.habitat).unlocked
                    ? tx(
                        "The gate is open. Invite this companion to make your park feel more alive.",
                        "البوابة مفتوحة. رحّب بهذا الرفيق لتصبح حديقتك أكثر حياة.",
                      )
                    : tx(
                        `This habitat is fenced until you finish ${gateFor(selectedAnimal.habitat).remaining} more task${gateFor(selectedAnimal.habitat).remaining === 1 ? "" : "s"}.`,
                        `هذا الموطن مسيّج حتى تنجز ${num(gateFor(selectedAnimal.habitat).remaining)} ${gateFor(selectedAnimal.habitat).remaining === 1 ? "مهمة" : "مهام"} إضافية.`,
                      )}
              </p>
              {discovered.has(selectedAnimal.key) ? (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  <Heart className="h-4 w-4 fill-current" />
                  {tx("Already exploring your park", "يتجول في حديقتك الآن")}
                </div>
              ) : gateFor(selectedAnimal.habitat).unlocked ? (
                <Button
                  className="mt-5 w-full"
                  onClick={() => void claimAnimal(selectedAnimal)}
                  disabled={discover.isPending || !user}
                >
                  <PawPrint className="h-4 w-4" />
                  {discover.isPending
                    ? tx("Welcoming…", "جارٍ الترحيب…")
                    : tx("Welcome to my park", "رحّب به في حديقتي")}
                </Button>
              ) : (
                <Button asChild className="mt-5 w-full">
                  <Link to="/tasks">
                    <LockKeyhole className="h-4 w-4" />
                    {tx("Open the task list", "افتح قائمة المهام")}
                    <ArrowUpRight />
                  </Link>
                </Button>
              )}
              {tasksLoading && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {tx("Checking your task progress…", "جارٍ التحقق من تقدم مهامك…")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({
  icon,
  tone,
  label,
  value,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-extrabold leading-tight">{value}</span>
        <span className="block truncate text-xs text-muted-foreground">{label}</span>
      </span>
    </Card>
  );
}

function FilterButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground hover:bg-muted"}`}
    >
      {icon}
      {children}
    </button>
  );
}
