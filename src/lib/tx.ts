import { useI18n } from "./i18n";

/** Inline bilingual strings for page-specific copy not in the main dictionary. */
export function useTx() {
  const i = useI18n();
  const tx = (en: string, ar: string) => (i.lang === "ar" ? ar : en);
  const fmtTime = (d: Date | string, h12 = true) =>
    new Date(d).toLocaleTimeString(i.locale, { hour: "numeric", minute: "2-digit", hour12: h12 });
  const fmtDate = (d: Date | string, o: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) =>
    new Date(d).toLocaleDateString(i.locale, o);
  const num = (n: number) => n.toLocaleString(i.locale);
  return { ...i, tx, fmtTime, fmtDate, num };
}
