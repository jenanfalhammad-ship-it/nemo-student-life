const ADVICE_PATTERNS = [
  /\bwhat do you think\b/i,
  /\bwhat(?:'s| is) your (?:opinion|take)\b/i,
  /\bwhere should i (?:put|place|add)\b/i,
  /\bwhich (?:one|option|course|category)\b/i,
  /\bshould i\b/i,
  /\bwould you recommend\b/i,
  /\bcan you advise\b/i,
  /\bwhat would you do\b/i,
  /\bis it better to\b/i,
];

const ARABIC_ADVICE_PATTERNS = [
  /شرايك/,
  /(?:وش|ايش|إيش|ما)\s*(?:رايك|رأيك|تشوف|تنصح)/,
  /(?:وين|أين|فين)\s*(?:أ?حط|أ?ضع|أ?ضيف|أ?رتب|أ?سجل)/,
  /(?:وين|فين)\s*(?:مكان|احسن|أفضل)/,
  /(?:هل|وش|ايش|إيش)\s*(?:الأفضل|الأنسب|أحسن|أرتب)/,
  /(?:تنصحني|وش تسوي مكاني|لو كنت مكاني|برأيك)/,
  /(?:أحطه|احطه|أضيفه|اضيفه)\s*(?:وين|فين|في أي|بأي)/,
  /(?:هل أضيف|هل اضيف|أحط هذا|احط هذا|أرتب هذا)\b/,
];

/**
 * Detect a user asking for judgement or advice rather than issuing a command.
 * The server uses this as a final safety guard: advice replies must never carry
 * database actions, even if the model mistakenly includes one.
 */
export function isNemoAdviceMessage(text: string): boolean {
  const normalized = text
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآ]/g, "ا")
    .toLocaleLowerCase()
    .trim();
  return (
    ADVICE_PATTERNS.some((pattern) => pattern.test(normalized)) ||
    ARABIC_ADVICE_PATTERNS.some((pattern) => pattern.test(normalized))
  );
}
