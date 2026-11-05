import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Layers, Timer, PawPrint, MessageCircle, BookOpen } from "lucide-react";
import { Nemo } from "@/components/nemo";
import { Button } from "@/components/ui/button";
import { Toggles } from "@/components/app-shell";
import { useTx } from "@/lib/tx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEMO — Your University Life, Under Control" },
      { name: "description", content: "Tasks, lectures, courses, flashcards, focus timer, AI assistant and a cozy zoo — one calm workspace for university students." },
      { property: "og:title", content: "NEMO — Your University Life, Under Control" },
      { property: "og:description", content: "An AI-powered academic workspace for university students, in Arabic and English." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, tx } = useTx();
  const features = [
    { icon: CalendarDays, title: tx("Calendar & My Day", "التقويم ويومي"), body: tx("Lectures, exams and deadlines in one view.", "المحاضرات والاختبارات والمواعيد في مكان واحد."), tone: "bg-sky" },
    { icon: BookOpen, title: tx("Course workspaces", "مساحات المواد"), body: tx("Notes, files and tasks per course.", "ملاحظات وملفات ومهام لكل مادة."), tone: "bg-sage-soft" },
    { icon: Layers, title: tx("Smart flashcards", "بطاقات ذكية"), body: tx("Spaced repetition that remembers for you.", "تكرار متباعد يتذكر عنك."), tone: "bg-lavender" },
    { icon: Timer, title: tx("Focus Room", "غرفة التركيز"), body: tx("Pomodoro & deep focus that earn pearls.", "بومودورو وتركيز عميق يكسبك لآلئ."), tone: "bg-peach" },
    { icon: PawPrint, title: tx("My Zoo", "حديقتي"), body: tx("Discover cute animals as you study.", "اكتشف حيوانات لطيفة كلما ذاكرت."), tone: "bg-sage-soft" },
    { icon: MessageCircle, title: tx("Ask Nemo", "اسأل نيمو"), body: tx("An AI assistant that can plan your day.", "مساعد ذكي ينظّم يومك."), tone: "bg-sky" },
  ];
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
        <div className="flex items-center gap-2"><Nemo className="h-9 w-9" /><span className="text-lg font-extrabold">NEMO</span></div>
        <div className="flex items-center gap-2"><Toggles compact /><Button asChild variant="ghost" size="sm"><Link to="/auth">{t("signIn")}</Link></Button></div>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-8 md:grid-cols-2 md:pt-16">
        <div className="animate-fade-up">
          <span className="inline-flex rounded-full bg-sage-soft px-3 py-1 text-xs font-medium text-accent-foreground">{tx("For university students", "لطلاب الجامعة")}</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t("tagline")}</h1>
          <p className="mt-4 max-w-md text-muted-foreground">{t("landingSub")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth">{t("getStarted")}</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/auth">{t("signIn")}</Link></Button>
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-sm">
          <div className="absolute inset-6 rounded-full bg-sage-soft" />
          <div className="absolute end-0 top-6 rounded-2xl bg-card px-3 py-2 text-xs shadow-[var(--shadow-lift)]">✅ {tx("3 tasks done", "٣ مهام منجزة")}</div>
          <div className="absolute bottom-10 start-0 rounded-2xl bg-card px-3 py-2 text-xs shadow-[var(--shadow-lift)]">⏱ {tx("50 min focused", "٥٠ دقيقة تركيز")}</div>
          <Nemo mood="studying" float className="relative h-full w-full p-8" />
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card-soft card-hover p-5">
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${f.tone}`}><f.icon className="h-5 w-5" /></div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">© NEMO</footer>
    </div>
  );
}
