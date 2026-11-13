# Internationalization

English is the source language. Supported locales: `en`, `fr`, `zh-CN`, `ja`, `es`.

## Catalogs

One set of flat JSON catalogs, `packages/i18n/locales/<locale>.json` (key to message), read by both runtimes:

- TypeScript: `@aphrody/i18n` (`packages/i18n`, Bun, no npm dependency). `createTranslator(catalogs, locale).t(key, args)`, `negotiate(acceptLanguage)`.
- Rust: `crates/aphrody-i18n` embeds the same files with `include_str!`. `I18n::new(locale).t_args(key, args)`, `negotiate(header)`.
- `crates/tv-i18n` (Fluent, 16 languages, media domain) is unchanged and independent.

A key missing in a locale falls back to its base language, then to `en`, then to the key itself.

## Message syntax (ICU subset)

`{name}`, `{n, number}`, `{n, plural, =0 {..} one {..} other {..}}` with `#` as the count, `{g, select, a {..} other {..}}`, nesting. `'{'` and `'}'` quote braces, `''` is an apostrophe. `plural` and `select` require an `other` case. Plural categories: Intl.PluralRules in TypeScript, hand-coded CLDR rules for the five locales in Rust (en and es: one = 1; fr: one = 0 or 1; zh-CN and ja: other). Numbers print without grouping in Rust, so shared test values stay below 1000.

## Commands

```sh
bun run packages/i18n/src/cli.ts check                 # missing/extra keys, placeholder and syntax parity against en; exit 1 on drift
bun run packages/i18n/src/cli.ts extract <paths...>    # t("key") call sites; unknown and unused keys against en
bun test packages/i18n
cargo test -p aphrody-i18n                              # on fr1 or CI
```

`packages/i18n/tests/fixtures/format.json` holds shared cases run by both the Bun and the Rust tests.

## Translated documents

Short versions (about half the length) of `README.md`, `AGENTS.md` and `docs/games/PLAN.md`: `fr/`, `zh-CN/`, `ja/`, `es/`. The English files stay authoritative.
