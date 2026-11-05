import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, Heart, Lock, PawPrint, Sparkles, Star, Trees, Waves } from "lucide-react";
import { Card, Chip, PageHeader } from "@/components/kit";
import { Nemo } from "@/components/nemo";
import { Button } from "@/components/ui/button";
import { useInsert, useRows } from "@/lib/data";
import { ANIMALS, type Habitat, type Rarity } from "@/lib/catalog";
import { useTx } from "@/lib/tx";
import zooHabitat from "@/assets/nemo-zoo-habitat.png";

export const Route = createFileRoute("/_authenticated/zoo")({
  head: () => ({ meta: [{ title: "My Zoo — NEMO" }, { name: "description", content: "Explore your growing NEMO zoo." }] }),
  component: ZooPage,
});

const habitatInfo: Record<Habitat, { en: string; ar: string; icon: typeof Trees; color: string }> = {
  forest: { en: "Whispering Forest", ar: "غابة الهمسات", icon: Trees, color: "#b9d9c4" },
  ocean: { en: "Bubble Bay", ar: "خليج الفقاعات", icon: Waves, color: "#b8dff0" },
  snow: { en: "Snowy Valley", ar: "وادي الثلج", icon: Sparkles, color: "#e4e4f3" },
  magic: { en: "Starlight Garden", ar: "حديقة النجوم", icon: Star, color: "#ead9f1" },
};
const rarityColor: Record<Rarity, string> = { common: "bg-sage-soft", rare: "bg-sky", epic: "bg-lavender", legendary: "bg-peach" };
const sceneSpots = ["left-[10%] top-[48%]", "left-[26%] top-[64%]", "left-[42%] top-[58%]", "left-[58%] top-[66%]", "left-[73%] top-[43%]", "left-[87%] top-[58%]", "left-[34%] top-[35%]", "left-[64%] top-[31%]", "left-[49%] top-[46%]", "left-[80%] top-[72%]"];

function ZooPage() {
  const { tx, t, num, dir } = useTx();
  const { data: animals = [], isLoading } = useRows("user_animals", { order: "discovered_at", asc: false });
  const { data: sessions = [] } = useRows("focus_sessions", { order: "started_at", asc: false });
  const discover = useInsert("user_animals");
  const [habitat, setHabitat] = useState<Habitat | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const discovered = useMemo(() => new Set(animals.map((animal) => animal.animal_key)), [animals]);
  const pearls = sessions.reduce((sum, session) => sum + (session.pearls ?? 0), 0);
  const filtered = habitat === "all" ? ANIMALS : ANIMALS.filter((animal) => animal.habitat === habitat);
  const selectedAnimal = ANIMALS.find((animal) => animal.key === selected);

  const unlock = (key: string) => {
    if (discovered.has(key)) return;
    discover.mutate({ animal_key: key, nickname: null, discovered_at: new Date().toISOString(), user_id: "00000000-0000-4000-8000-000000000001" });
    setSelected(key);
  };

  return (
    <div dir={dir} className="mx-auto w-full max-w-6xl pb-10">
      <PageHeader title={tx("My Zoo", "زوو نيمو")} sub={tx("A tiny world that grows whenever you show up for yourself.", "عالم صغير يكبر كل ما اهتميت بنفسك وذاكرت بذكاء.")} action={<Link to="/focus" className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted">{tx("Earn more pearls", "اكسب لآلئ أكثر")} <ArrowUpRight className="h-4 w-4" /></Link>} />

      <section className="relative mb-5 overflow-hidden rounded-[2rem] border bg-cover bg-center p-5 shadow-sm sm:p-8" style={{ backgroundImage: `linear-gradient(90deg,rgba(255,250,241,.96),rgba(255,250,241,.72),rgba(232,226,245,.45)),url(${zooHabitat})` }}>
        <div className="absolute -end-10 -top-16 h-56 w-56 rounded-full bg-[#ffbe9e]/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><Chip className="bg-white/75"><Sparkles className="me-1 h-3 w-3" />{tx("NEMO WORLD · Demo habitat", "عالم نيمو · موطن تجريبي")}</Chip><h2 className="mt-3 text-3xl font-extrabold tracking-tight">{tx("Welcome to the cozy side of studying.", "أهلًا بك في الجانب اللطيف من المذاكرة.")}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{tx("Meet curious companions, unlock habitats, and turn focused minutes into a living little world. Every resident has a story, a habitat and a reason to cheer you on.", "قابل رفاقًا لطيفين، افتح مواطن جديدة، وحوّل دقائق التركيز إلى عالم حي. لكل ساكن قصة وموطن وسبب يخليه يشجعك.")}</p><div className="mt-5 flex flex-wrap gap-2"><div className="rounded-2xl bg-white/80 px-4 py-3"><div className="text-2xl font-black">{num(animals.length)}</div><div className="text-xs text-muted-foreground">{tx("Residents", "السكان")}</div></div><div className="rounded-2xl bg-white/80 px-4 py-3"><div className="text-2xl font-black">{num(pearls)}</div><div className="text-xs text-muted-foreground">{tx("Pearls earned", "اللآلئ المكتسبة")}</div></div><div className="rounded-2xl bg-white/80 px-4 py-3"><div className="text-2xl font-black">{num(ANIMALS.length)}</div><div className="text-xs text-muted-foreground">{tx("Discoveries", "اكتشافات")}</div></div></div></div><Nemo mood="celebrating" className="h-36 w-36 self-center lg:h-44 lg:w-44" float /></div>
      </section>

      <section className="relative mb-5 min-h-[360px] overflow-hidden rounded-[2rem] border shadow-lg sm:min-h-[430px]" style={{ backgroundImage: `url(${zooHabitat})`, backgroundPosition: "center", backgroundSize: "cover" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20" />
        <div className="absolute start-4 top-4 rounded-2xl bg-white/80 px-3 py-2 text-xs font-bold shadow-sm backdrop-blur"><Sparkles className="me-1 inline h-3 w-3 text-primary" />{tx("Tap around the habitat", "اضغطي على الحيوانات في الحديقة")}</div>
        {ANIMALS.map((animal, index) => { const unlocked = discovered.has(animal.key); return <button key={animal.key} onClick={() => setSelected(animal.key)} className={`absolute ${sceneSpots[index]} z-10 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white/80 bg-white/65 text-4xl shadow-lg backdrop-blur transition hover:scale-125 ${unlocked ? "animate-bounce [animation-duration:3.5s]" : "grayscale opacity-70"}`} title={tx(animal.en, animal.ar)}>{animal.img ? <img src={animal.img} alt="" className="h-11 w-11 object-contain" /> : animal.emoji}{!unlocked && <span className="absolute -bottom-1 -end-1 grid h-5 w-5 place-items-center rounded-full bg-slate-700 text-[10px] text-white">?</span>}</button>; })}
        <div className="absolute bottom-4 start-1/2 -translate-x-1/2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold shadow backdrop-blur">{num(discovered.size)} / {num(ANIMALS.length)} {tx("companions awake", "رفاق مستيقظون")}</div>
      </section>

      <div className="mb-5 flex flex-wrap gap-2">{(["all", "forest", "ocean", "snow", "magic"] as const).map((key) => { const info = key === "all" ? null : habitatInfo[key]; const Icon = info?.icon ?? PawPrint; return <ButtonLike key={key} active={habitat === key} onClick={() => setHabitat(key)}><Icon className="h-4 w-4" />{key === "all" ? tx("All habitats", "كل المواطن") : tx(info!.en, info!.ar)}</ButtonLike>; })}</div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((animal) => { const info = habitatInfo[animal.habitat]; const unlocked = discovered.has(animal.key); return <button key={animal.key} onClick={() => setSelected(animal.key)} className={`group relative overflow-hidden rounded-3xl border p-4 text-start transition duration-200 hover:-translate-y-1 hover:shadow-lg ${unlocked ? "bg-card" : "bg-muted/30"}`}><div className="absolute end-3 top-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${rarityColor[animal.rarity]}`}>{tx(animal.rarity, animal.rarity === "common" ? "شائع" : animal.rarity === "rare" ? "نادر" : animal.rarity === "epic" ? "ملحمي" : "أسطوري")}</span></div><div className="grid min-h-44 place-items-center rounded-2xl p-5" style={{ background: `linear-gradient(145deg,${info.color},#ffffffaa)` }}>{animal.img ? <img src={animal.img} alt={tx(animal.en, animal.ar)} className={`h-32 w-32 object-contain transition group-hover:scale-110 ${unlocked ? "" : "grayscale opacity-60"}`} /> : <span className={`text-7xl transition group-hover:scale-110 ${unlocked ? "" : "grayscale opacity-50"}`}>{animal.emoji}</span>}{!unlocked && <div className="absolute rounded-full bg-background/85 p-3 shadow"><Lock className="h-5 w-5" /></div>}</div><div className="mt-4 flex items-start justify-between gap-2"><div><h3 className="font-bold">{tx(animal.en, animal.ar)}</h3><p className="mt-1 text-xs text-muted-foreground">{tx(info.en, info.ar)}</p></div>{unlocked && <Heart className="mt-1 h-4 w-4 fill-[#ef8e83] text-[#ef8e83]" />}</div><p className="mt-3 text-xs text-muted-foreground">{unlocked ? tx("Resident · tap for details", "ساكن · اضغط للتفاصيل") : tx("Tap to discover", "اضغط للاكتشاف")}</p></button>; })}</div>
        <aside className="space-y-4"><Card title={tx("Your habitats", "مواطنك")}><div className="space-y-2">{Object.entries(habitatInfo).map(([key, info]) => { const count = ANIMALS.filter((animal) => animal.habitat === key && discovered.has(animal.key)).length; const total = ANIMALS.filter((animal) => animal.habitat === key).length; const Icon = info.icon; return <div key={key} className="flex items-center gap-3 rounded-2xl border p-3"><span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: info.color }}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{tx(info.en, info.ar)}</p><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(count / total) * 100}%` }} /></div></div><span className="text-xs text-muted-foreground">{count}/{total}</span></div>; })}</div></Card><Card title={tx("Nemo's tip", "نصيحة نيمو")}><div className="flex gap-3"><Nemo mood="encouraging" className="h-14 w-14 shrink-0" /><p className="text-sm leading-6 text-muted-foreground">{tx("A 25-minute focus session can be the first step toward your next discovery. No pressure — steady beats perfect.", "جلسة تركيز ٢٥ دقيقة ممكن تكون أول خطوة لاكتشافك القادم. بدون ضغط — الاستمرار أهم من الكمال.")}</p></div></Card></aside>
      </div>

      {selectedAnimal && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4" onClick={() => setSelected(null)}><div className="w-full max-w-md rounded-3xl bg-card p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><Chip>{selectedAnimal.rarity}</Chip><h2 className="mt-2 text-2xl font-extrabold">{tx(selectedAnimal.en, selectedAnimal.ar)}</h2></div><button onClick={() => setSelected(null)} className="rounded-full px-3 py-1 text-xl hover:bg-muted">×</button></div><div className="my-4 grid place-items-center rounded-2xl p-5" style={{ background: `linear-gradient(145deg,${habitatInfo[selectedAnimal.habitat].color},#fff)` }}>{selectedAnimal.img ? <img src={selectedAnimal.img} alt="" className="h-36 w-36 object-contain" /> : <span className="text-8xl">{selectedAnimal.emoji}</span>}</div><div className="grid gap-3 text-sm"><p className="flex gap-2"><PawPrint className="h-4 w-4 text-primary" />{tx(`Habitat: ${habitatInfo[selectedAnimal.habitat].en}`, `الموطن: ${habitatInfo[selectedAnimal.habitat].ar}`)}</p><p className="flex gap-2"><CalendarDays className="h-4 w-4 text-primary" />{discovered.has(selectedAnimal.key) ? tx("Discovered and cheering for you.", "تم اكتشافه وصار يشجعك.") : tx("Complete a focus session to make this discovery feel earned.", "أكملي جلسة تركيز عشان يصير الاكتشاف مستحقًا.")}</p></div>{!discovered.has(selectedAnimal.key) && <Button className="mt-5 w-full" onClick={() => unlock(selectedAnimal.key)} disabled={discover.isPending}><Sparkles />{tx("Discover this companion", "اكتشف هذا الرفيق")}</Button>}</div></div>}
    </div>
  );
}

function ButtonLike({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>{children}</button>; }
