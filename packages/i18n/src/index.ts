export * from "./icu.ts";
export * from "./negotiate.ts";
export * from "./i18n.ts";
import en from "../locales/en.json" with { type: "json" };
import es from "../locales/es.json" with { type: "json" };
import fr from "../locales/fr.json" with { type: "json" };
import ja from "../locales/ja.json" with { type: "json" };
import zhCN from "../locales/zh-CN.json" with { type: "json" };

/** Bundled catalogs; the same JSON files are read by src/i18n. */
export const catalogs = { en, fr, "zh-CN": zhCN, ja, es } as const;
