import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Copy,
  DoorOpen,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Plus,
  PawPrint,
  Timer,
  Users,
} from "lucide-react";
import { Card, Chip, PageHeader } from "@/components/kit";
import { Nemo } from "@/components/nemo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useTx } from "@/lib/tx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ANIMALS } from "@/lib/catalog";

import "@/page-themes/together.css";

export const Route = createFileRoute("/_authenticated/together")({
  head: () => ({
    meta: [
      { title: "Study Together — NEMO" },
      { name: "description", content: "Create or join a small study room." },
      { property: "og:title", content: "Study Together — NEMO" },
      { property: "og:description", content: "Create or join a small study room." },
    ],
  }),
  component: TogetherPage,
});

type RoomWithMembers = {
  id: string;
  name: string;
  code: string;
  goal: string | null;
  owner_id: string;
  created_at: string;
  members: {
    room_id: string;
    user_id: string;
    display_name: string | null;
    status: string;
    joined_at: string;
  }[];
};

function TogetherPage() {
  const { tx, t, num, dir } = useTx();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [roomName, setRoomName] = useState("");
  const [sharedGoal, setSharedGoal] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const roomsQuery = useQuery({
    queryKey: ["together-rooms", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<RoomWithMembers[]> => {
      const { data: memberships, error: memberError } = await supabase
        .from("room_members")
        .select("room_id,user_id,display_name,status,joined_at")
        .eq("user_id", user!.id)
        .order("joined_at", { ascending: true });
      if (memberError) throw memberError;
      const ids = [...new Set((memberships ?? []).map((membership) => membership.room_id))];
      if (!ids.length) return [];
      const { data: rooms, error: roomError } = await supabase
        .from("study_rooms")
        .select("id,name,code,goal,owner_id,created_at")
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (roomError) throw roomError;
      const { data: members, error: membersError } = await supabase
        .from("room_members")
        .select("room_id,user_id,display_name,status,joined_at")
        .in("room_id", ids)
        .order("joined_at", { ascending: true });
      if (membersError) throw membersError;
      return (rooms ?? []).map((room) => ({
        ...room,
        members: (members ?? []).filter((member) => member.room_id === room.id),
      }));
    },
  });

  function invalidateRooms() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ["together-rooms", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["study_rooms"] }),
      queryClient.invalidateQueries({ queryKey: ["room_members"] }),
    ]);
  }

  async function currentDisplayName() {
    if (!user) return tx("NEMO student", "طالب نيمو");
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    const metadataName =
      typeof user.user_metadata?.["display_name"] === "string"
        ? user.user_metadata["display_name"]
        : "";
    return (
      data?.display_name?.trim() ||
      metadataName.trim() ||
      user.email?.split("@")[0] ||
      tx("NEMO student", "طالب نيمو")
    );
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not signed in");
      const name = roomName.trim();
      if (!name) throw new Error("room name required");
      const { data: room, error } = await supabase
        .from("study_rooms")
        .insert({ name, goal: sharedGoal.trim() || null, owner_id: user.id })
        .select("id,name,code,goal,owner_id,created_at")
        .single();
      if (error) throw error;
      const { error: membershipError } = await supabase.from("room_members").insert({
        room_id: room.id,
        user_id: user.id,
        display_name: await currentDisplayName(),
        status: "idle",
      });
      if (membershipError) {
        await supabase.from("study_rooms").delete().eq("id", room.id).eq("owner_id", user.id);
        throw membershipError;
      }
      return room;
    },
    onSuccess: async (room) => {
      setRoomName("");
      setSharedGoal("");
      setActionMessage(tx("Room created and you joined it.", "أُنشئت الغرفة وانضممت إليها."));
      await invalidateRooms();
      try {
        await navigator.clipboard.writeText(room.code);
      } catch {
        /* The code remains visible to copy manually. */
      }
    },
    onError: () =>
      setActionMessage(
        tx(
          "Could not create and join the room safely. Check room table access and try again.",
          "تعذر إنشاء الغرفة والانضمام إليها بأمان. تحقق من صلاحية جداول الغرف وحاول مجددًا.",
        ),
      ),
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not signed in");
      const code = joinCode.trim();
      if (!code) throw new Error("room code required");
      const { data: roomId, error } = await supabase.rpc("join_room_by_code", {
        _code: code.toUpperCase(),
        _name: await currentDisplayName(),
      });
      if (error) throw error;
      return roomId;
    },
    onSuccess: async () => {
      setJoinCode("");
      setActionMessage(tx("You joined the room.", "انضممت إلى الغرفة."));
      await invalidateRooms();
    },
    onError: (error) => {
      const message = error.message.toLowerCase();
      if (message.includes("not found"))
        setActionMessage(tx("No room was found for that code.", "لم نعثر على غرفة بهذا الرمز."));
      else if (message.includes("full"))
        setActionMessage(tx("That room is full.", "هذه الغرفة ممتلئة."));
      else
        setActionMessage(
          tx(
            "The declared join_room_by_code operation could not complete. Check Supabase setup and try again.",
            "تعذرت عملية join_room_by_code المعرّفة. تحقق من إعداد Supabase وحاول مجددًا.",
          ),
        );
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (roomId: string) => {
      if (!user) throw new Error("not signed in");
      const { error } = await supabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setActionMessage(
        tx(
          "You left the room. The room itself was not deleted.",
          "غادرت الغرفة ولم تُحذف الغرفة نفسها.",
        ),
      );
      await invalidateRooms();
    },
    onError: () =>
      setActionMessage(
        tx(
          "Could not leave this room. No membership was changed.",
          "تعذرت مغادرة الغرفة. لم تتغير العضوية.",
        ),
      ),
  });

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setActionMessage(tx("Invite code copied.", "نُسخ رمز الدعوة."));
    } catch {
      setActionMessage(
        tx(
          "Copy is unavailable here; select the visible code to copy it.",
          "النسخ غير متاح هنا؛ حدد الرمز الظاهر لنسخه.",
        ),
      );
    }
  }

  const busy = createMutation.isPending || joinMutation.isPending;

  return (
    <div dir={dir} className="nemo-sea-page nemo-sea-page--together mx-auto w-full max-w-6xl pb-10">
      <PageHeader
        title={tx("Study together", "ذاكر مع أصدقائك")}
        sub={tx(
          "Small rooms for shared goals. Only the database's real room and membership records are shown.",
          "غرف صغيرة للأهداف المشتركة. لا نعرض إلا سجلات الغرف والعضويات الفعلية في قاعدة البيانات.",
        )}
        action={<Link2 className="h-5 w-5 text-muted-foreground" />}
      />

      <section className="relative mb-5 overflow-hidden rounded-2xl border bg-gradient-to-br from-lavender/70 via-card to-sage-soft/70 p-5 sm:p-7">
        <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <Chip className="bg-background/80">
              <Users className="me-1 h-3 w-3" />
              {tx("Study rooms", "غرف المذاكرة")}
            </Chip>
            <h2 className="mt-3 text-xl font-semibold">
              {tx("A shared goal, your own pace.", "هدف مشترك، وإيقاعك الخاص.")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {tx(
                "Rooms are limited to eight members by the join RPC. Creating one adds you as a member; joining uses the existing invite-code function.",
                "تقتصر الغرفة على ثمانية أعضاء وفق دالة الانضمام. عند الإنشاء تنضم إليها، والانضمام يستخدم دالة رمز الدعوة الموجودة.",
              )}
            </p>
          </div>
          <Nemo mood="studying" className="h-20 w-20 self-end sm:h-28 sm:w-28" float />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title={tx("Create a room", "إنشاء غرفة")}
          action={<Plus className="h-4 w-4 text-muted-foreground" />}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setActionMessage("");
              createMutation.mutate();
            }}
            className="grid gap-3"
          >
            <label className="grid gap-1.5 text-xs text-muted-foreground">
              {tx("Room name", "اسم الغرفة")}
              <input
                maxLength={80}
                required
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                placeholder={tx("e.g. Library study group", "مثال: مجموعة مذاكرة المكتبة")}
                className="h-10 rounded-lg border bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1.5 text-xs text-muted-foreground">
              {tx("Shared goal (optional)", "الهدف المشترك (اختياري)")}
              <input
                maxLength={160}
                value={sharedGoal}
                onChange={(event) => setSharedGoal(event.target.value)}
                placeholder={tx("What are you studying together?", "ماذا ستذاكرون معًا؟")}
                className="h-10 rounded-lg border bg-background px-3 text-sm text-foreground"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !roomName.trim()}
              className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {tx("Create room", "إنشاء الغرفة")}
            </button>
          </form>
          <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
            <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {tx(
              "Uses the existing owner insert policy and then inserts your own membership. If membership setup fails, the new room is cleaned up when possible.",
              "يستخدم صلاحية إنشاء الغرفة للمالك ثم يضيف عضويتك أنت. إذا تعذر إعداد العضوية، تُحذف الغرفة الجديدة متى أمكن.",
            )}
          </p>
        </Card>

        <Card
          title={tx("Join with an invite code", "انضم برمز دعوة")}
          action={<Link2 className="h-4 w-4 text-muted-foreground" />}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setActionMessage("");
              joinMutation.mutate();
            }}
            className="grid gap-3"
          >
            <label className="grid gap-1.5 text-xs text-muted-foreground">
              {tx("Invite code", "رمز الدعوة")}
              <input
                maxLength={32}
                required
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="ABC123"
                autoCapitalize="characters"
                className="h-11 rounded-lg border bg-background px-3 text-center font-mono text-lg tracking-[.25em] text-foreground"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !joinCode.trim()}
              className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {joinMutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {tx("Join room", "انضم إلى الغرفة")}
            </button>
          </form>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            {tx(
              "The declared join_room_by_code RPC validates the code and enforces the eight-member room limit.",
              "تتحقق دالة join_room_by_code المعرّفة من الرمز وتفرض حد الغرفة البالغ ثمانية أعضاء.",
            )}
          </p>
        </Card>
      </div>

      {actionMessage && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground"
        >
          {actionMessage}
        </p>
      )}

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{tx("Your rooms", "غرفك")}</h2>
          <Chip>
            {num(roomsQuery.data?.length ?? 0)} {tx("joined", "منضم إليها")}
          </Chip>
        </div>
        {roomsQuery.isLoading ? (
          <div className="card-soft p-5 text-sm text-muted-foreground">{t("loading")}</div>
        ) : roomsQuery.isError ? (
          <Card className="border-destructive/40">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">
                  {tx("Room setup is unavailable", "إعداد الغرف غير متاح")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tx(
                    "The app could not safely read room_members and study_rooms. Room actions depend on those tables and their row policies; no room was created, joined, or removed by this page.",
                    "تعذرت قراءة room_members وstudy_rooms بأمان. تعتمد إجراءات الغرف على هذين الجدولين وسياسات الصفوف؛ ولم تُنشئ الصفحة أي غرفة أو تنضم إليها أو تحذف عضوية.",
                  )}
                </p>
              </div>
            </div>
          </Card>
        ) : roomsQuery.data?.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {roomsQuery.data.map((room) => (
              <Card key={room.id} className="overflow-hidden p-0">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/20 p-4 sm:p-5">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold">{room.name}</h3>
                    {room.goal && <p className="mt-1 text-sm text-muted-foreground">{room.goal}</p>}
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {room.owner_id === user?.id
                        ? tx("Created by you", "أنشأتها")
                        : tx("Study room", "غرفة مذاكرة")}{" "}
                      ·{" "}
                      {new Date(room.created_at).toLocaleDateString(tx("en-US", "ar-SA"), {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Chip className="bg-background">
                    <Users className="me-1 h-3 w-3" />
                    {num(room.members.length)} / 8
                  </Chip>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {tx("Invite code", "رمز الدعوة")}
                    </p>
                    <button
                      type="button"
                      onClick={() => void copyCode(room.code)}
                      className="mt-1 inline-flex items-center gap-2 rounded-md font-mono text-lg font-bold tracking-[.18em] hover:text-primary"
                      title={tx("Copy invite code", "انسخ رمز الدعوة")}
                    >
                      {room.code}
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={leaveMutation.isPending}
                    onClick={() => leaveMutation.mutate(room.id)}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-destructive/50 hover:text-destructive disabled:opacity-50"
                  >
                    <DoorOpen className="h-3.5 w-3.5" />
                    {tx("Leave room", "غادر الغرفة")}
                  </button>
                </div>
                <div className="border-t px-4 py-4 sm:px-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold">{t("members")}</h4>
                    <Link
                      to="/focus"
                      className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium hover:bg-muted"
                    >
                      <Timer className="h-3 w-3" />
                      {tx("Open focus room", "افتح جلسة التركيز")}
                    </Link>
                  </div>
                  {room.members.length ? (
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {room.members.map((member) => (
                        <li
                          key={`${member.room_id}-${member.user_id}`}
                          className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-muted/35 px-3 py-2"
                        >
                          <span className="flex min-w-0 items-center gap-2 truncate text-xs font-medium">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage-soft text-lg">
                              {member.user_id === user?.id
                                ? "🐙"
                                : (ANIMALS.find((animal) => animal.key === "fox")?.emoji ?? "🦊")}
                            </span>
                            <span className="truncate">
                              {member.display_name || tx("Member", "عضو")}
                              {member.user_id === user?.id && (
                                <span className="ms-1 text-muted-foreground">
                                  · {tx("you", "أنت")}
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                            <PawPrint className="h-3 w-3 text-primary" />
                            {member.status === "studying"
                              ? t("studying")
                              : member.status === "break"
                                ? t("onBreak")
                                : member.status === "idle"
                                  ? t("idle")
                                  : member.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {tx("No readable member records.", "لا توجد سجلات أعضاء متاحة للقراءة.")}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center gap-2 border-dashed py-8 text-center">
            <Nemo mood="sleeping" className="h-16 w-16" />
            <p className="text-sm text-muted-foreground">
              {tx("You haven't joined a room yet.", "لم تنضم إلى غرفة بعد.")}
            </p>
            <p className="max-w-md text-xs text-muted-foreground">
              {tx(
                "Create a room above or join with a code. This list is based only on your room_members records.",
                "أنشئ غرفة أعلاه أو انضم باستخدام رمز. تستند هذه القائمة إلى سجلات room_members الخاصة بك فقط.",
              )}
            </p>
          </Card>
        )}
      </div>
      <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {tx(
          "Leaving removes only your membership row; it does not delete the room or other members.",
          "المغادرة تحذف سجل عضويتك فقط، ولا تحذف الغرفة أو بقية الأعضاء.",
        )}
      </p>
    </div>
  );
}
