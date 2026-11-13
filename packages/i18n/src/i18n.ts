import { formatMessage, type MessageArgs } from "./icu.ts";
import {
  LOCALES,
  SOURCE_LOCALE,
  matchLocale,
  type Locale,
} from "./negotiate.ts";

export type Catalog = Readonly<Record<string, string>>;
export type Catalogs = Readonly<Partial<Record<string, Catalog>>>;

export interface Translator {
  readonly locale: string;
  /** Translate `key`; missing in the locale falls back to its base language, then en, then the key itself. */
  t(key: string, args?: MessageArgs): string;
  has(key: string): boolean;
  /** Writing direction of the locale. */
  readonly dir: "ltr" | "rtl";
}

const RTL = new Set(["ar", "he", "fa", "ur", "ps", "yi"]);

export function createTranslator(
  catalogs: Catalogs,
  locale: string,
  source: string = SOURCE_LOCALE,
): Translator {
  const known = Object.keys(catalogs);
  const resolved = matchLocale(locale, known) ?? source;
  const chain = [...new Set([resolved, resolved.split("-")[0]!, source])];
  const find = (key: string): { text: string; from: string } | undefined => {
    for (const l of chain) {
      const text = catalogs[l]?.[key];
      if (text !== undefined) return { text, from: l };
    }
    return undefined;
  };
  return {
    locale: resolved,
    dir: RTL.has(resolved.split("-")[0]!) ? "rtl" : "ltr",
    has: (key) => find(key) !== undefined,
    t(key, args) {
      const hit = find(key);
      if (!hit) return key;
      return formatMessage(hit.text, hit.from, args);
    },
  };
}

/** Load the bundled catalogs (packages/i18n/locales/*.json) from disk. */
export async function loadCatalogs(
  dir: string = new URL("../locales/", import.meta.url).pathname,
): Promise<Record<Locale, Catalog>> {
  const out: Record<string, Catalog> = {};
  for (const l of LOCALES)
    out[l] = (await Bun.file(
      `${dir.replace(/\/$/, "")}/${l}.json`,
    ).json()) as Catalog;
  return out as Record<Locale, Catalog>;
}
