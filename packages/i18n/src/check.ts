import { argNames, MessageSyntaxError, parseMessage } from "./icu.ts";
import type { Catalog } from "./i18n.ts";

export interface LocaleReport {
  locale: string;
  missing: string[];
  extra: string[];
  /** keys whose placeholder names differ from the source */
  placeholders: string[];
  /** keys that do not parse */
  syntax: string[];
}

export function checkCatalogs(
  source: Catalog,
  others: Readonly<Record<string, Catalog>>,
): LocaleReport[] {
  const reports: LocaleReport[] = [];
  const srcArgs = new Map(
    Object.entries(source).map(([k, v]) => [k, safeArgs(v)]),
  );
  for (const [locale, cat] of Object.entries(others)) {
    const r: LocaleReport = {
      locale,
      missing: [],
      extra: [],
      placeholders: [],
      syntax: [],
    };
    for (const k of Object.keys(source)) if (!(k in cat)) r.missing.push(k);
    for (const [k, v] of Object.entries(cat)) {
      if (!(k in source)) {
        r.extra.push(k);
        continue;
      }
      try {
        parseMessage(v);
      } catch (e) {
        if (e instanceof MessageSyntaxError) r.syntax.push(k);
        else throw e;
        continue;
      }
      const want = srcArgs.get(k);
      // CJK locales may drop the plural count argument form, but names must still be a subset-equal set.
      if (want && want.join() !== argNames(v).join()) r.placeholders.push(k);
    }
    reports.push(r);
  }
  return reports;
}

function safeArgs(v: string): string[] {
  try {
    return argNames(v);
  } catch {
    return [];
  }
}

export const reportOk = (r: LocaleReport) =>
  !r.missing.length &&
  !r.extra.length &&
  !r.placeholders.length &&
  !r.syntax.length;

const CALL = /\bt\(\s*(["'`])((?:\\.|(?!\1).)+)\1/g;

/** Static `t("key")` call sites in source text. */
export function extractKeys(text: string): string[] {
  const keys = new Set<string>();
  for (const m of text.matchAll(CALL)) keys.add(m[2]!);
  return [...keys].sort();
}
