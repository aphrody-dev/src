import { describe, expect, test } from "bun:test";
import { catalogs, checkCatalogsForTest } from "./helpers.ts";
import {
  createTranslator,
  formatMessage,
  matchLocale,
  negotiate,
  parseAcceptLanguage,
  parseMessage,
  MessageSyntaxError,
  LOCALES,
} from "../src/index.ts";
import { extractKeys } from "../src/check.ts";
import fixtures from "./fixtures/format.json";

describe("icu", () => {
  test("plural exact, category and #", () => {
    const m = "{n, plural, =0 {none} one {# item} other {# items}}";
    expect(formatMessage(m, "en", { n: 0 })).toBe("none");
    expect(formatMessage(m, "en", { n: 1 })).toBe("1 item");
    expect(formatMessage(m, "en", { n: 2 })).toBe("2 items");
  });
  test("french treats 0 and 1 as one", () => {
    expect(
      formatMessage("{n, plural, one {# fichier} other {# fichiers}}", "fr", {
        n: 0,
      }),
    ).toBe("0 fichier");
  });
  test("select with other", () => {
    expect(
      formatMessage("{g, select, f {elle} other {iel}}", "en", { g: "f" }),
    ).toBe("elle");
    expect(
      formatMessage("{g, select, f {elle} other {iel}}", "en", { g: "q" }),
    ).toBe("iel");
  });
  test("missing argument stays visible", () => {
    expect(formatMessage("Hi {name}", "en")).toBe("Hi {name}");
  });
  test("number type", () => {
    expect(formatMessage("{n, number}", "en", { n: 1234 })).toBe("1,234");
  });
  test("apostrophe quoting", () => {
    expect(formatMessage("it''s '{'x'}'", "en")).toBe("it's {x}");
  });
  test("syntax errors", () => {
    expect(() => parseMessage("{n, plural, one {x}}")).toThrow(
      MessageSyntaxError,
    );
    expect(() => parseMessage("{n")).toThrow(MessageSyntaxError);
    expect(() => parseMessage("a } b")).toThrow(MessageSyntaxError);
    expect(() => parseMessage("{n, date}")).toThrow(MessageSyntaxError);
  });
});

describe("negotiation", () => {
  test("q ordering", () => {
    expect(parseAcceptLanguage("fr;q=0.5, ja, en;q=0.1, de;q=0")).toEqual([
      "ja",
      "fr",
      "en",
    ]);
  });
  test("negotiate", () => {
    expect(negotiate("fr-CH, fr;q=0.9, en;q=0.8")).toBe("fr");
    expect(negotiate("zh-Hans-CN,zh;q=0.9")).toBe("zh-CN");
    expect(negotiate("zh-TW")).toBe("zh-CN");
    expect(negotiate("ja-JP")).toBe("ja");
    expect(negotiate("de, es;q=0.5")).toBe("es");
    expect(negotiate("de")).toBe("en");
    expect(negotiate("*")).toBe("en");
    expect(negotiate(null)).toBe("en");
    expect(negotiate("es_MX.UTF-8")).toBe("es");
  });
  test("matchLocale", () => {
    expect(matchLocale("ZH-cn", LOCALES)).toBe("zh-CN");
  });
});

describe("translator", () => {
  test("fallback to en then key", () => {
    const t = createTranslator(
      { en: { a: "A", b: "B" }, fr: { a: "AA" } },
      "fr",
    );
    expect(t.t("a")).toBe("AA");
    expect(t.t("b")).toBe("B");
    expect(t.t("c")).toBe("c");
    expect(t.has("b")).toBe(true);
    expect(t.has("c")).toBe(false);
  });
  test("direction", () => {
    expect(createTranslator({ en: {}, ar: {} }, "ar").dir).toBe("rtl");
    expect(createTranslator(catalogs, "ja").dir).toBe("ltr");
  });
  test("shared fixtures", () => {
    for (const f of fixtures) {
      const t = createTranslator(catalogs, f.locale);
      expect(t.t(f.key, f.args as Record<string, string | number>)).toBe(f.out);
    }
  });
});

describe("catalogs", () => {
  test("every locale matches en", () => {
    const { en, ...others } = catalogs;
    for (const r of checkCatalogsForTest(en, others)) {
      expect(r).toEqual({
        locale: r.locale,
        missing: [],
        extra: [],
        placeholders: [],
        syntax: [],
      });
    }
  });
  test("check detects drift", () => {
    const rs = checkCatalogsForTest(
      { a: "{x}", b: "B" },
      { fr: { a: "{y}", c: "C" }, es: { a: "{x", b: "B" } },
    );
    expect(rs[0]).toEqual({
      locale: "fr",
      missing: ["b"],
      extra: ["c"],
      placeholders: ["a"],
      syntax: [],
    });
    expect(rs[1]!.syntax).toEqual(["a"]);
  });
  test("extract finds call sites", () => {
    const src = "t(\"a.b\"); i18n.t('c', {x: 1}); const set = 1; t(`d`)";
    expect(extractKeys(src)).toEqual(["a.b", "c", "d"]);
  });
});
