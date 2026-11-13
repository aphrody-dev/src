export const SOURCE_LOCALE = "en";
export const LOCALES = ["en", "fr", "zh-CN", "ja", "es"] as const;
export type Locale = (typeof LOCALES)[number];

/** Parse an Accept-Language header into tags ordered by q (stable for ties); q=0 entries are dropped. */
export function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params
        .map((p) => /^\s*q\s*=\s*([\d.]+)\s*$/i.exec(p))
        .find(Boolean);
      return { tag: tag.trim(), q: q ? Number(q[1]) : 1, index };
    })
    .filter((e) => e.tag && e.q > 0 && !Number.isNaN(e.q))
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map((e) => e.tag);
}

/** Closest supported locale for one requested tag: exact, then same language (zh-Hans-CN -> zh-CN). */
export function matchLocale<T extends string>(
  tag: string,
  supported: readonly T[],
): T | undefined {
  const norm = tag.replace(/_/g, "-").split(/[.@]/)[0]!.toLowerCase();
  const exact = supported.find((s) => s.toLowerCase() === norm);
  if (exact) return exact;
  const base = norm.split("-")[0]!;
  return (
    supported.find((s) => s.toLowerCase() === base) ??
    supported.find((s) => s.toLowerCase().split("-")[0] === base)
  );
}

/** Pick a locale from an Accept-Language header; falls back to `fallback` (default en). */
export function negotiate<T extends string = Locale>(
  acceptLanguage: string | null | undefined,
  supported: readonly T[] = LOCALES as unknown as readonly T[],
  fallback: T = SOURCE_LOCALE as unknown as T,
): T {
  if (!acceptLanguage) return fallback;
  for (const tag of parseAcceptLanguage(acceptLanguage)) {
    if (tag === "*") return fallback;
    const m = matchLocale(tag, supported);
    if (m) return m;
  }
  return fallback;
}
