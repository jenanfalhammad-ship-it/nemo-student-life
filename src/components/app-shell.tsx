import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sun,
  Moon,
  Languages,
  Home,
  CalendarDays,
  ListChecks,
  Bell,
  Hourglass,
  Ticket,
  BookOpen,
  Layers,
  BarChart3,
  Timer,
  Users,
  PawPrint,
  Sparkles,
  MessageCircle,
  Settings,
  User,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useI18n, type TKey } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Nemo } from "@/components/nemo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useRows, useUpdate } from "@/lib/data";
import { cn } from "@/lib/utils";

type Item = { to: string; k: TKey; icon: typeof Home };
const GROUPS: { k: TKey; items: Item[] }[] = [
  {
    k: "main",
    items: [
      { to: "/dashboard", k: "myDay", icon: Home },
      { to: "/calendar", k: "calendar", icon: CalendarDays },
      { to: "/tasks", k: "tasks", icon: ListChecks },
      { to: "/reminders", k: "reminders", icon: Bell },
      { to: "/countdown", k: "countdown", icon: Hourglass },
      { to: "/events", k: "events", icon: Ticket },
    ],
  },
  {
    k: "academic",
    items: [
      { to: "/courses", k: "courses", icon: BookOpen },
      { to: "/flashcards", k: "flashcards", icon: Layers },
      { to: "/stats", k: "statistics", icon: BarChart3 },
    ],
  },
  {
    k: "focusSocial",
    items: [
      { to: "/focus", k: "focusRoom", icon: Timer },
      { to: "/together", k: "together", icon: Users },
      { to: "/zoo", k: "zoo", icon: PawPrint },
      { to: "/world", k: "world", icon: Sparkles },
    ],
  },
];
const FOOT: Item[] = [
  { to: "/ask", k: "askNemo", icon: MessageCircle },
  { to: "/settings", k: "settings", icon: Settings },
  { to: "/profile", k: "profile", icon: User },
];
const MOBILE: Item[] = [
  { to: "/dashboard", k: "home", icon: Home },
  { to: "/tasks", k: "tasks", icon: ListChecks },
  { to: "/courses", k: "courses", icon: BookOpen },
  { to: "/focus", k: "focus", icon: Timer },
  { to: "/ask", k: "nemo", icon: MessageCircle },
];
const ICON_TONES: Record<string, string> = {
  "/dashboard": "bg-primary/10 text-primary-deep",
  "/calendar": "bg-sky text-sky-ink",
  "/tasks": "bg-peach text-orange-700 dark:text-orange-200",
  "/reminders": "bg-lavender text-violet-700 dark:text-violet-200",
  "/countdown": "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200",
  "/events": "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-200",
  "/courses": "bg-sky text-sky-ink",
  "/flashcards": "bg-lavender text-violet-700 dark:text-violet-200",
  "/stats": "bg-peach text-orange-700 dark:text-orange-200",
  "/focus": "bg-primary/10 text-primary-deep",
  "/together": "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-200",
  "/zoo": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200",
  "/world": "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200",
  "/ask": "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200",
  "/settings": "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200",
  "/profile": "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200",
};

export function Toggles({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      document.documentElement.classList.contains("dark"));
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size={compact ? "icon" : "sm"}
        onClick={() => setLang(lang === "ar" ? "en" : "ar")}
        aria-label="Language"
      >
        <Languages className="h-4 w-4" />
        {!compact && <span className="text-xs">{lang === "ar" ? "EN" : "عربي"}</span>}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Theme"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function NavLinks({ collapsed, onNav }: { collapsed?: boolean; onNav?: () => void }) {
  const { t } = useI18n();
  const loc = useLocation();
  const link = (it: Item) => {
    const active = loc.pathname === it.to || loc.pathname.startsWith(it.to + "/");
    return (
      <Link
        key={it.to}
        to={it.to}
        onClick={onNav}
        title={t(it.k)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
          active
            ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm ring-1 ring-primary/10"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
          collapsed && "justify-center px-2",
        )}
      >
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors",
            active ? "bg-background/70 text-primary" : ICON_TONES[it.to],
            collapsed && "h-9 w-9",
          )}
        >
          <it.icon className="h-4 w-4" />
        </span>
        {!collapsed && <span className="truncate">{t(it.k)}</span>}
      </Link>
    );
  };
  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
      {GROUPS.map((g) => (
        <div key={g.k} className="grid gap-0.5">
          {!collapsed && (
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(g.k)}
            </div>
          )}
          {g.items.map(link)}
        </div>
      ))}
      <div className="mt-auto grid gap-0.5 border-t pt-3">{FOOT.map(link)}</div>
    </nav>
  );
}

function useReminderWatcher() {
  const { data: reminders } = useRows("reminders", {
    order: "remind_at",
    asc: true,
    refetchInterval: 60000,
  });
  const upd = useUpdate("reminders");
  const fired = useRef(new Set<string>());
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      for (const r of reminders ?? []) {
        const at = new Date(r.remind_at).getTime();
        if (r.done || at > now || now - at > 6 * 3600e3 || fired.current.has(r.id + r.remind_at))
          continue;
        fired.current.add(r.id + r.remind_at);
        toast(`🔔 ${r.title}`, {
          description: r.description ?? undefined,
          duration: 15000,
          action: {
            label: "+10m",
            onClick: () =>
              upd.mutate({
                id: r.id,
                values: { remind_at: new Date(Date.now() + 600000).toISOString() },
              }),
          },
        });
        if ("Notification" in window && Notification.permission === "granted")
          new Notification("NEMO", { body: r.title });
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [reminders, upd]);
}

export function AppShell() {
  const { t, dir } = useI18n();
  const loc = useLocation();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useProfile();
  const [collapsed, setCollapsed] = useState(false);
  const [more, setMore] = useState(false);
  useReminderWatcher();

  useEffect(() => {
    if (!isLoading && profile && !profile.onboarded && loc.pathname !== "/onboarding")
      nav({ to: "/onboarding" });
  }, [isLoading, profile, loc.pathname, nav]);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/", replace: true });
  };

  if (loc.pathname === "/onboarding") return <Outlet />;

  return (
    <div className="nemo-app-shell flex min-h-screen bg-background">
      <aside
        className={cn(
          "nemo-sidebar sticky top-0 hidden h-screen shrink-0 flex-col gap-4 border-e bg-sidebar p-3 lg:flex",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        <div
          className={cn(
            "nemo-brand flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sage-soft/80 via-card to-lavender/50 px-2 py-2",
            collapsed && "justify-center px-1",
          )}
        >
          <Nemo className="h-9 w-9" />
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-extrabold tracking-wide">NEMO</div>
              <div className="text-[10px] text-muted-foreground">{t("tagline")}</div>
            </div>
          )}
        </div>
        <NavLinks collapsed={collapsed} />
        <div className={cn("flex items-center gap-1", collapsed ? "flex-col" : "justify-between")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={t("collapse")}
          >
            {collapsed !== (dir === "rtl") ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label={t("signOut")}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="nemo-topbar sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/85 px-4 backdrop-blur lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
            <Nemo className="h-8 w-8" />
            <span className="font-extrabold">NEMO</span>
          </Link>
          <div className="hidden text-sm text-muted-foreground lg:block">
            {profile?.display_name ? `👋 ${profile.display_name}` : ""}
          </div>
          <Toggles />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {MOBILE.map((it) => {
          const active = loc.pathname.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] transition-colors",
                active ? "font-semibold text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-9 place-items-center rounded-xl transition-colors",
                  active ? "bg-primary/10 text-primary" : ICON_TONES[it.to],
                )}
              >
                <it.icon className="h-4 w-4" />
              </span>
              {t(it.k)}
            </Link>
          );
        })}
        <button
          onClick={() => setMore(true)}
          className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground"
        >
          <Menu className="h-5 w-5" />
          {t("more")}
        </button>
      </nav>
      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent
          side={dir === "rtl" ? "right" : "left"}
          className="flex w-72 flex-col bg-sidebar p-3"
        >
          <SheetTitle className="flex items-center gap-2 px-1">
            <Nemo className="h-8 w-8" />
            NEMO
          </SheetTitle>
          <NavLinks onNav={() => setMore(false)} />
          <Button variant="ghost" className="justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            {t("signOut")}
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
