import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, Field, PageHeader } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useTx } from "@/lib/tx";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards — NEMO" },
      { name: "description", content: "Manage and review flashcards in NEMO." },
      { property: "og:title", content: "Flashcards — NEMO" },
      { property: "og:description", content: "Manage and review flashcards in NEMO." },
    ],
  }),
  component: FlashcardsPage,
});

type Deck = Database["public"]["Tables"]["flashcard_decks"]["Row"];
type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];
type DeckForm = { name: string; course_id: string };
type CardForm = { front: string; back: string };
const blankDeck: DeckForm = { name: "", course_id: "" };
const blankCard: CardForm = { front: "", back: "" };
const noCards: Flashcard[] = [];

function FlashcardsPage() {
  const { tx, lang, num } = useTx();
  const qc = useQueryClient();
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [deckFormOpen, setDeckFormOpen] = useState(false);
  const [deckEditing, setDeckEditing] = useState<string | null>(null);
  const [deckForm, setDeckForm] = useState<DeckForm>(blankDeck);
  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [cardEditing, setCardEditing] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState<CardForm>(blankCard);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [dueOnly, setDueOnly] = useState(true);
  const [sessionReviewed, setSessionReviewed] = useState(0);

  const decksQuery = useQuery({
    queryKey: ["flashcard_decks", "page"],
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user)
        throw new Error(tx("Please sign in to load your decks.", "سجّل الدخول لعرض مجموعاتك."));
      const { data, error } = await supabase
        .from("flashcard_decks")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const decks = decksQuery.data ?? [];
  const activeDeck = decks.find((deck) => deck.id === selectedDeck) ?? decks[0] ?? null;
  const coursesQuery = useQuery({
    queryKey: ["courses", "deck-options"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const { data, error } = await supabase
        .from("courses")
        .select("id,name")
        .eq("user_id", auth.user.id)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
  const cardsQuery = useQuery({
    queryKey: ["flashcards", "page"],
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user)
        throw new Error(tx("Please sign in to load cards.", "سجّل الدخول لعرض البطاقات."));
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("due_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
  const cards = cardsQuery.data ?? noCards;
  const deckCards = useMemo(
    () => cards.filter((card) => card.deck_id === activeDeck?.id),
    [cards, activeDeck?.id],
  );
  const queue = useMemo(() => {
    const now = Date.now();
    return deckCards.filter((card) => !dueOnly || new Date(card.due_at).getTime() <= now);
  }, [deckCards, dueOnly]);
  const activeCard = queue.find((card) => card.id === activeCardId) ?? queue[0] ?? null;

  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["flashcards", "page"] }),
      qc.invalidateQueries({ queryKey: ["flashcard_decks", "page"] }),
    ]);
  };
  const saveDeck = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error(tx("Please sign in again.", "يرجى تسجيل الدخول مجددًا."));
      const name = deckForm.name.trim();
      if (!name) throw new Error(tx("Group name is required.", "اسم المجموعة مطلوب."));
      const course_id = deckForm.course_id || null;
      const result = deckEditing
        ? await supabase
            .from("flashcard_decks")
            .update({ name, course_id })
            .eq("id", deckEditing)
            .eq("user_id", auth.user.id)
        : await supabase.from("flashcard_decks").insert({ name, course_id, user_id: auth.user.id });
      if (result.error) throw result.error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["flashcard_decks", "page"] });
      setDeckFormOpen(false);
      setDeckEditing(null);
      setDeckForm(blankDeck);
      toast.success(tx("Group saved.", "تم حفظ المجموعة."));
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const removeDeck = useMutation({
    mutationFn: async (deck: Deck) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error(tx("Please sign in again.", "يرجى تسجيل الدخول مجددًا."));
      const { error } = await supabase
        .from("flashcard_decks")
        .delete()
        .eq("id", deck.id)
        .eq("user_id", auth.user.id);
      if (error) throw error;
    },
    onSuccess: async (_, deck) => {
      await qc.invalidateQueries({ queryKey: ["flashcard_decks", "page"] });
      await qc.invalidateQueries({ queryKey: ["flashcards", "page"] });
      setSelectedDeck((id) => (id === deck.id ? null : id));
      toast.success(tx("Group deleted.", "تم حذف المجموعة."));
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const saveCard = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error(tx("Please sign in again.", "يرجى تسجيل الدخول مجددًا."));
      if (!activeDeck)
        throw new Error(tx("Create or choose a group first.", "أنشئ مجموعة أو اخترها أولًا."));
      const front = cardForm.front.trim();
      const back = cardForm.back.trim();
      if (!front || !back)
        throw new Error(tx("Both sides of the card are required.", "وجها البطاقة مطلوبان."));
      const result = cardEditing
        ? await supabase
            .from("flashcards")
            .update({ front, back })
            .eq("id", cardEditing)
            .eq("user_id", auth.user.id)
        : await supabase.from("flashcards").insert({
            front,
            back,
            deck_id: activeDeck.id,
            user_id: auth.user.id,
            due_at: new Date().toISOString(),
            state: "new",
            reps: 0,
            difficulty: 0,
            stability: 0,
          });
      if (result.error) throw result.error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["flashcards", "page"] });
      setCardFormOpen(false);
      setCardEditing(null);
      setCardForm(blankCard);
      setActiveCardId(null);
      setFlipped(false);
      toast.success(tx("Card saved.", "تم حفظ البطاقة."));
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const removeCard = useMutation({
    mutationFn: async (id: string) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error(tx("Please sign in again.", "يرجى تسجيل الدخول مجددًا."));
      const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", id)
        .eq("user_id", auth.user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["flashcards", "page"] });
      setActiveCardId(null);
      setFlipped(false);
      toast.success(tx("Card deleted.", "تم حذف البطاقة."));
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const saveReview = useMutation({
    mutationFn: async (rating: "again" | "hard" | "good" | "easy") => {
      if (!activeCard)
        throw new Error(tx("There is no card to review.", "لا توجد بطاقة للمراجعة."));
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error(tx("Please sign in again.", "يرجى تسجيل الدخول مجددًا."));
      const currentStability = Math.max(0, activeCard.stability || 0);
      const nextStability =
        rating === "again"
          ? Math.max(0.1, currentStability * 0.5)
          : rating === "hard"
            ? Math.max(1, currentStability * 0.8)
            : rating === "easy"
              ? Math.max(2, currentStability * 1.5)
              : Math.max(1, currentStability || 1);
      const delayMs = rating === "again" ? 10 * 60_000 : nextStability * 24 * 60 * 60_000;
      const nextDifficulty = Math.max(
        0,
        Math.min(10, activeCard.difficulty + (rating === "again" ? 1 : rating === "easy" ? -1 : 0)),
      );
      const { error } = await supabase
        .from("flashcards")
        .update({
          reps: activeCard.reps + 1,
          difficulty: nextDifficulty,
          stability: nextStability,
          due_at: new Date(Date.now() + delayMs).toISOString(),
          state: rating === "again" ? "learning" : "review",
        })
        .eq("id", activeCard.id)
        .eq("user_id", auth.user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setSessionReviewed((count) => count + 1);
      setActiveCardId(null);
      setFlipped(false);
      await qc.invalidateQueries({ queryKey: ["flashcards", "page"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openNewDeck = () => {
    setDeckEditing(null);
    setDeckForm(blankDeck);
    setDeckFormOpen(true);
  };
  const editDeck = (deck: Deck) => {
    setDeckEditing(deck.id);
    setDeckForm({ name: deck.name, course_id: deck.course_id ?? "" });
    setDeckFormOpen(true);
  };
  const openNewCard = () => {
    setCardEditing(null);
    setCardForm(blankCard);
    setCardFormOpen(true);
  };
  const editCard = (card: Flashcard) => {
    setCardEditing(card.id);
    setCardForm({ front: card.front, back: card.back });
    setCardFormOpen(true);
  };
  const submitDeck = (event: FormEvent) => {
    event.preventDefault();
    saveDeck.mutate();
  };
  const submitCard = (event: FormEvent) => {
    event.preventDefault();
    saveCard.mutate();
  };
  const stepCard = (delta: number) => {
    if (!queue.length) return;
    const index = Math.max(
      0,
      queue.findIndex((item) => item.id === activeCard?.id),
    );
    const next = queue[(index + delta + queue.length) % queue.length];
    if (!next) return;
    setActiveCardId(next.id);
    setFlipped(false);
  };

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="mx-auto w-full max-w-6xl px-3 pb-10 sm:px-6"
    >
      <PageHeader
        title={tx("Flashcards", "البطاقات التعليمية")}
        sub={tx(
          "Create groups, add cards and save review progress.",
          "أنشئ مجموعات وبطاقات واحفظ تقدم المراجعة.",
        )}
        action={
          <Button onClick={openNewDeck}>
            <Plus />
            {tx("New group", "مجموعة جديدة")}
          </Button>
        }
      />
      {(decksQuery.error || cardsQuery.error) && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {tx("Could not load flashcards:", "تعذر تحميل البطاقات:")}{" "}
          {(decksQuery.error ?? cardsQuery.error) instanceof Error
            ? (decksQuery.error ?? cardsQuery.error)?.message
            : ""}
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <Card
          title={tx("Groups", "المجموعات")}
          action={
            <Button
              size="icon"
              variant="ghost"
              aria-label={tx("Add group", "إضافة مجموعة")}
              onClick={openNewDeck}
            >
              <Plus />
            </Button>
          }
        >
          {decksQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              {tx("Loading groups…", "جارٍ تحميل المجموعات…")}
            </p>
          ) : decks.length === 0 ? (
            <div className="py-6 text-center">
              <Layers3 className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {tx("No groups yet.", "لا توجد مجموعات بعد.")}
              </p>
            </div>
          ) : (
            <ul className="grid gap-2">
              {decks.map((deck) => {
                const count = cards.filter((card) => card.deck_id === deck.id).length;
                return (
                  <li
                    key={deck.id}
                    className={`rounded-lg border p-2 ${activeDeck?.id === deck.id ? "border-primary/50 bg-accent/50" : "border-border"}`}
                  >
                    <button
                      className="w-full text-start"
                      onClick={() => {
                        setSelectedDeck(deck.id);
                        setActiveCardId(null);
                        setFlipped(false);
                        setCardFormOpen(false);
                      }}
                    >
                      <span className="block truncate text-sm font-semibold">{deck.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {num(count)} {tx("cards", "بطاقات")}
                      </span>
                    </button>
                    <div className="mt-1 flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => editDeck(deck)}>
                        <Pencil />
                        {tx("Edit", "تعديل")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (
                            window.confirm(
                              tx(
                                `Delete “${deck.name}”? Existing cards may prevent deletion.`,
                                `هل تريد حذف «${deck.name}»؟ قد تمنع البطاقات الموجودة الحذف.`,
                              ),
                            )
                          )
                            removeDeck.mutate(deck);
                        }}
                      >
                        <Trash2 className="text-destructive" />
                        {tx("Delete", "حذف")}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <div className="grid content-start gap-5">
          {deckFormOpen && (
            <Card
              title={
                deckEditing
                  ? tx("Edit group", "تعديل المجموعة")
                  : tx("Create group", "إنشاء مجموعة")
              }
            >
              <form onSubmit={submitDeck} className="grid gap-3 sm:grid-cols-2">
                <Field label={tx("Group name *", "اسم المجموعة *")}>
                  <Input
                    required
                    value={deckForm.name}
                    onChange={(e) => setDeckForm({ ...deckForm, name: e.target.value })}
                  />
                </Field>
                <Field label={tx("Linked course (optional)", "المادة المرتبطة (اختياري)")}>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={deckForm.course_id}
                    onChange={(e) => setDeckForm({ ...deckForm, course_id: e.target.value })}
                  >
                    <option value="">{tx("No linked course", "دون مادة مرتبطة")}</option>
                    {coursesQuery.data?.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="flex gap-2 sm:col-span-2">
                  <Button disabled={saveDeck.isPending} type="submit">
                    <Save />
                    {tx("Save group", "حفظ المجموعة")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDeckFormOpen(false)}>
                    <X />
                    {tx("Cancel", "إلغاء")}
                  </Button>
                </div>
              </form>
            </Card>
          )}
          {!activeDeck ? (
            <Card>
              <div className="py-12 text-center">
                <BookOpen className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {tx("Create a group to start adding cards.", "أنشئ مجموعة لبدء إضافة البطاقات.")}
                </p>
                <Button className="mt-4" onClick={openNewDeck}>
                  <Plus />
                  {tx("Create group", "إنشاء مجموعة")}
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Card
                title={activeDeck.name}
                action={
                  <Button size="sm" onClick={openNewCard}>
                    <Plus />
                    {tx("Add card", "إضافة بطاقة")}
                  </Button>
                }
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm">
                  <span className="text-muted-foreground">
                    {tx("Cards", "البطاقات")}: {num(deckCards.length)} ·{" "}
                    {tx("Due now", "مستحقة الآن")}:{" "}
                    {num(
                      deckCards.filter((card) => new Date(card.due_at).getTime() <= Date.now())
                        .length,
                    )}
                  </span>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={dueOnly}
                      onChange={(e) => {
                        setDueOnly(e.target.checked);
                        setActiveCardId(null);
                        setFlipped(false);
                      }}
                    />
                    {tx("Due only", "المستحقة فقط")}
                  </label>
                </div>
                {cardFormOpen && (
                  <form onSubmit={submitCard} className="mb-5 grid gap-3 rounded-lg border p-3">
                    <Field label={tx("Front *", "الوجه الأمامي *")}>
                      <Textarea
                        required
                        rows={2}
                        value={cardForm.front}
                        onChange={(e) => setCardForm({ ...cardForm, front: e.target.value })}
                      />
                    </Field>
                    <Field label={tx("Back *", "الوجه الخلفي *")}>
                      <Textarea
                        required
                        rows={3}
                        value={cardForm.back}
                        onChange={(e) => setCardForm({ ...cardForm, back: e.target.value })}
                      />
                    </Field>
                    <div className="flex gap-2">
                      <Button disabled={saveCard.isPending} type="submit">
                        <Save />
                        {tx("Save card", "حفظ البطاقة")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCardFormOpen(false)}
                      >
                        <X />
                        {tx("Cancel", "إلغاء")}
                      </Button>
                    </div>
                  </form>
                )}
                {cardsQuery.isLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {tx("Loading cards…", "جارٍ تحميل البطاقات…")}
                  </p>
                ) : queue.length === 0 ? (
                  <div className="py-9 text-center">
                    <Check className="mx-auto mb-3 h-8 w-8 text-primary" />
                    <p className="font-medium">
                      {deckCards.length
                        ? tx("All caught up for now.", "أنهيت مراجعة البطاقات المستحقة الآن.")
                        : tx(
                            "This group has no cards yet.",
                            "لا تحتوي هذه المجموعة على بطاقات بعد.",
                          )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {deckCards.length && dueOnly
                        ? tx(
                            "Turn off “Due only” to browse all cards.",
                            "أوقف «المستحقة فقط» لتصفح جميع البطاقات.",
                          )
                        : tx("Add a card to begin.", "أضف بطاقة للبدء.")}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-gradient-to-br from-background to-accent/40 p-5 shadow-sm sm:min-h-56 sm:p-8">
                      <div className="mb-5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {tx("Review", "المراجعة")} ·{" "}
                          {num(queue.findIndex((item) => item.id === activeCard?.id) + 1)} /{" "}
                          {num(queue.length)}
                        </span>
                        <span>
                          {tx("Repetitions", "مرات المراجعة")}: {num(activeCard?.reps ?? 0)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFlipped((value) => !value)}
                        className="grid min-h-28 w-full place-items-center whitespace-pre-wrap break-words text-center text-lg font-semibold sm:min-h-36 sm:text-xl"
                        aria-label={tx("Flip card", "اقلب البطاقة")}
                      >
                        {flipped ? activeCard?.back : activeCard?.front}
                      </button>
                      <p className="mt-3 text-center text-xs text-muted-foreground">
                        {flipped
                          ? tx("Answer", "الإجابة")
                          : tx("Question · tap to reveal", "السؤال · اضغط لإظهار الإجابة")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={tx("Previous card", "البطاقة السابقة")}
                        onClick={() => stepCard(-1)}
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveCardId(null);
                          setFlipped(false);
                        }}
                      >
                        <RotateCcw />
                        {tx("Restart view", "بدء العرض من جديد")}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={tx("Next card", "البطاقة التالية")}
                        onClick={() => stepCard(1)}
                      >
                        <ChevronRight />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => activeCard && editCard(activeCard)}
                      >
                        <Pencil />
                        {tx("Edit", "تعديل")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          activeCard &&
                          window.confirm(tx("Delete this card?", "هل تريد حذف هذه البطاقة؟")) &&
                          removeCard.mutate(activeCard.id)
                        }
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                    {flipped && (
                      <div className="mx-auto grid w-full max-w-2xl gap-2">
                        <p className="text-center text-sm font-medium">
                          {tx(
                            "How well did you remember? Saving updates this card’s review schedule.",
                            "كيف كان تذكرك؟ الحفظ يحدّث موعد مراجعة هذه البطاقة.",
                          )}
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <Button
                            variant="destructive"
                            disabled={saveReview.isPending}
                            onClick={() => saveReview.mutate("again")}
                          >
                            {tx("Again · 10 min", "أعد · ١٠ دقائق")}
                          </Button>
                          <Button
                            variant="outline"
                            disabled={saveReview.isPending}
                            onClick={() => saveReview.mutate("hard")}
                          >
                            {tx("Hard", "صعب")}
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={saveReview.isPending}
                            onClick={() => saveReview.mutate("good")}
                          >
                            {tx("Good", "جيد")}
                          </Button>
                          <Button
                            disabled={saveReview.isPending}
                            onClick={() => saveReview.mutate("easy")}
                          >
                            {tx("Easy", "سهل")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
              <Card title={tx("Study session", "جلسة المذاكرة")}>
                <p className="text-sm text-muted-foreground">
                  {tx("Reviews saved in this session", "المراجعات المحفوظة في هذه الجلسة")}:{" "}
                  <strong className="text-foreground">{num(sessionReviewed)}</strong>.{" "}
                  {tx(
                    "Each rating updates the card’s reps, difficulty, stability, due date and state in Supabase.",
                    "كل تقييم يحدّث عدد مرات التكرار والصعوبة والاستقرار وموعد الاستحقاق والحالة في Supabase.",
                  )}
                </p>
              </Card>
              {deckCards.length > 0 && (
                <Card title={tx("All cards in this group", "كل بطاقات المجموعة")}>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {deckCards.map((card) => (
                      <li key={card.id} className="rounded-lg border p-3">
                        <p className="line-clamp-2 text-sm font-medium">{card.front}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {card.back}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            {tx("Due", "الاستحقاق")}:{" "}
                            {new Date(card.due_at).toLocaleDateString(lang === "ar" ? "ar" : "en")}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => editCard(card)}>
                            <Pencil />
                            {tx("Edit", "تعديل")}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
