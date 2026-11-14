# Pull requests tailwindlabs/tailwindcss

Instantané du 2026-11-14.

## Fusionnées sur main depuis 2026-10-15 (37)

| PR | Titre | Auteur | Date | Labels |
|---|---|---|---|---|
| [#20697](https://github.com/tailwindlabs/tailwindcss/pull/20697) | Replace CSS escapes that are not needed during canonicalization | RobinMalfait | 2026-11-10 |  |
| [#20694](https://github.com/tailwindlabs/tailwindcss/pull/20694) | Improve performance when scanning long lines with many `[` characters | RobinMalfait | 2026-11-10 |  |
| [#20693](https://github.com/tailwindlabs/tailwindcss/pull/20693) | Improve performance of candidates with long variant chains | RobinMalfait | 2026-11-10 |  |
| [#20692](https://github.com/tailwindlabs/tailwindcss/pull/20692) | Discard candidates whose selectors grow exponentially when variants are stacked | RobinMalfait | 2026-11-10 |  |
| [#20690](https://github.com/tailwindlabs/tailwindcss/pull/20690) | Ignore arbitrary values that start a CSS comment | RobinMalfait | 2026-11-11 |  |
| [#20688](https://github.com/tailwindlabs/tailwindcss/pull/20688) | Use the incremental build when `from` is set | RobinMalfait | 2026-11-10 |  |
| [#20686](https://github.com/tailwindlabs/tailwindcss/pull/20686) | Clarify the install effect of the WASM fallback in the 4.3.4 changelog | RobinMalfait | 2026-11-09 |  |
| [#20683](https://github.com/tailwindlabs/tailwindcss/pull/20683) | Avoid climbing across Windows drives when rebasing URLs in stylesheets | Rohan-Dedhia | 2026-11-10 |  |
| [#20680](https://github.com/tailwindlabs/tailwindcss/pull/20680) | Only optimize and print new utilities on rebuilds | adamwathan | 2026-11-10 |  |
| [#20678](https://github.com/tailwindlabs/tailwindcss/pull/20678) | Improve `@tailwindcss/vite` build performance by scanning the same sources only once per build | huuyafwww | 2026-11-10 |  |
| [#20672](https://github.com/tailwindlabs/tailwindcss/pull/20672) | 4.3.5 | RobinMalfait | 2026-11-06 |  |
| [#20669](https://github.com/tailwindlabs/tailwindcss/pull/20669) | Make the integration tests resilient to slow package installs | RobinMalfait | 2026-11-05 |  |
| [#20667](https://github.com/tailwindlabs/tailwindcss/pull/20667) | Fix `@tailwindcss/oxide-wasm32-wasi` hanging forever when it loads | RobinMalfait | 2026-11-04 |  |
| [#20666](https://github.com/tailwindlabs/tailwindcss/pull/20666) | Skip the `color-mix(…)` polyfill without a color interpolation method | RobinMalfait | 2026-11-05 |  |
| [#20665](https://github.com/tailwindlabs/tailwindcss/pull/20665) | Ignore `<!--` and `-->` between top-level rules in the CSS parser | b84330808 | 2026-11-04 |  |
| [#20663](https://github.com/tailwindlabs/tailwindcss/pull/20663) | Canonicalization: don't sort all parsed variants when compiling a single candidate | benface | 2026-11-04 |  |
| [#20660](https://github.com/tailwindlabs/tailwindcss/pull/20660) | Don't break CSS modules in the `@tailwindcss/turbopack` README setup | lazerg | 2026-11-04 |  |
| [#20658](https://github.com/tailwindlabs/tailwindcss/pull/20658) | Don't crash on a `color-mix(…)` with a single color and no interpolation method | zerotohero3 | 2026-11-04 |  |
| [#20655](https://github.com/tailwindlabs/tailwindcss/pull/20655) | Keep a declaration without a `;` at the end of the CSS input | RobinMalfait | 2026-11-02 |  |
| [#20653](https://github.com/tailwindlabs/tailwindcss/pull/20653) | Parse a custom property at the end of the input without a trailing `;` | b84330808 | 2026-11-02 |  |
| [#20651](https://github.com/tailwindlabs/tailwindcss/pull/20651) | Move CI jobs off the retired macos-14 runner image | RobinMalfait | 2026-11-01 |  |
| [#20650](https://github.com/tailwindlabs/tailwindcss/pull/20650) | Fix flaky bun upgrade integration test | RobinMalfait | 2026-11-01 |  |
| [#20632](https://github.com/tailwindlabs/tailwindcss/pull/20632) | Fix unshipped relative imports in `@tailwindcss/node` type declarations | wook10 | 2026-11-05 |  |
| [#20627](https://github.com/tailwindlabs/tailwindcss/pull/20627) | Don't treat `!important` inside a declaration value as the important flag | b84330808 | 2026-11-01 |  |
| [#20594](https://github.com/tailwindlabs/tailwindcss/pull/20594) | Add changelog entry for #20591 | RobinMalfait | 2026-10-19 |  |
| [#20593](https://github.com/tailwindlabs/tailwindcss/pull/20593) | Canonicalization: only ignore `--tw-{property}` next to the related property | RobinMalfait | 2026-10-19 |  |
| [#20592](https://github.com/tailwindlabs/tailwindcss/pull/20592) | Add changelog fragments in `.changelog/` | RobinMalfait | 2026-11-01 |  |
| [#20591](https://github.com/tailwindlabs/tailwindcss/pull/20591) | Decode single-digit hexadecimal CSS escapes | jiwoo1222 | 2026-10-19 |  |
| [#20582](https://github.com/tailwindlabs/tailwindcss/pull/20582) | Rebuild `@tailwindcss/turbopack` and `@tailwindcss/webpack` when the input CSS changes | RobinMalfait | 2026-10-16 |  |
| [#20579](https://github.com/tailwindlabs/tailwindcss/pull/20579) | Fix out of memory error in the canonicalize tests on macOS CI | RobinMalfait | 2026-10-15 |  |
| [#20578](https://github.com/tailwindlabs/tailwindcss/pull/20578) | Bump Bun to 1.4 so macOS standalone binaries get a valid code signature | i098 | 2026-10-15 |  |
| [#20577](https://github.com/tailwindlabs/tailwindcss/pull/20577) | Reject arbitrary values with unbalanced parens or brackets | otarampinelli | 2026-10-15 |  |
| [#20575](https://github.com/tailwindlabs/tailwindcss/pull/20575) | Drop nested rules that put a combinator after a pseudo-element | RobinMalfait | 2026-10-15 |  |
| [#20558](https://github.com/tailwindlabs/tailwindcss/pull/20558) | Canonicalization: avoid exponential collapse when a utility sets many properties | SahinurDEV | 2026-10-15 |  |
| [#20487](https://github.com/tailwindlabs/tailwindcss/pull/20487) | Fix incremental source scanning in WASM builds | kkrausse | 2026-11-05 |  |
| [#20486](https://github.com/tailwindlabs/tailwindcss/pull/20486) | Handle vendor-prefixed selector functions in custom variants | OllieinCanada | 2026-10-15 |  |
| [#20447](https://github.com/tailwindlabs/tailwindcss/pull/20447) | 4.3.4 | RobinMalfait | 2026-11-02 |  |

## Ouvertes (84)

| PR | Titre | Auteur | Date | Labels |
|---|---|---|---|---|
| [#20721](https://github.com/tailwindlabs/tailwindcss/pull/20721) | Remove invalid `justify-baseline` utility | TanmayNileshShinde | 2026-11-14 |  |
| [#20720](https://github.com/tailwindlabs/tailwindcss/pull/20720) | Canonicalization: keep arbitrary variants a compound variant can't replace | SudeepGowda55 | 2026-11-14 |  |
| [#20719](https://github.com/tailwindlabs/tailwindcss/pull/20719) | Canonicalization: keep whitespace-only arbitrary property values | SudeepGowda55 | 2026-11-14 |  |
| [#20718](https://github.com/tailwindlabs/tailwindcss/pull/20718) | Don't generate invalid CSS for `*-inherit` colors with an opacity modifier | SudeepGowda55 | 2026-11-14 |  |
| [#20716](https://github.com/tailwindlabs/tailwindcss/pull/20716) | Recognize `abs(…)` and `sign(…)` as math functions in arbitrary values | Mwrnk | 2026-11-13 |  |
| [#20715](https://github.com/tailwindlabs/tailwindcss/pull/20715) | Canonicalization: don't treat different `@scope` variants as the same | benface | 2026-11-13 |  |
| [#20710](https://github.com/tailwindlabs/tailwindcss/pull/20710) | Preserve declaration sources in JavaScript keyframes | darrenfdes | 2026-11-12 |  |
| [#20708](https://github.com/tailwindlabs/tailwindcss/pull/20708) | fix: accept readonly arrays for build candidates and Scanner sources | Sudhakar7J | 2026-11-12 |  |
| [#20703](https://github.com/tailwindlabs/tailwindcss/pull/20703) | Reduce the size of `@tailwindcss/browser` and only scan the elements that changed | adamwathan | 2026-11-11 |  |
| [#20700](https://github.com/tailwindlabs/tailwindcss/pull/20700) | Ensure `@tailwindcss/vite` rebuilds when a plugin changes the input CSS in memory | RobinMalfait | 2026-11-10 |  |
| [#20699](https://github.com/tailwindlabs/tailwindcss/pull/20699) | Don't treat `/*` inside an unquoted `url(…)` as a comment in the CSS parser | RobinMalfait | 2026-11-10 |  |
| [#20698](https://github.com/tailwindlabs/tailwindcss/pull/20698) | Canonicalization: reuse dynamic utility lookups across candidate collapse groups | rudy-07 | 2026-11-10 |  |
| [#20691](https://github.com/tailwindlabs/tailwindcss/pull/20691) | Discard candidates that contain `</style` | RobinMalfait | 2026-11-10 |  |
| [#20684](https://github.com/tailwindlabs/tailwindcss/pull/20684) | Add a single-threaded browser build of `@tailwindcss/oxide` | suasgn | 2026-11-09 |  |
| [#20679](https://github.com/tailwindlabs/tailwindcss/pull/20679) | Don't generate invalid CSS for `drop-shadow-inherit` with an opacity modifier | solquin | 2026-11-08 |  |
| [#20671](https://github.com/tailwindlabs/tailwindcss/pull/20671) | Prefix relative selectors with \:scope\ inside \@scope\ rules | GautamKumarOffical | 2026-11-05 |  |
| [#20664](https://github.com/tailwindlabs/tailwindcss/pull/20664) | Negate combined conditions as a whole in `not-*` variants | b84330808 | 2026-11-04 |  |
| [#20656](https://github.com/tailwindlabs/tailwindcss/pull/20656) | [v3] Reject invalid hyphen-prefixed arbitrary property names | akasakariko | 2026-11-02 | v3 |
| [#20649](https://github.com/tailwindlabs/tailwindcss/pull/20649) | Keep a single-file `@source` exact when automatic source detection is on | Gourav224 | 2026-11-01 |  |
| [#20639](https://github.com/tailwindlabs/tailwindcss/pull/20639) | Resolve `@import`s that failed in a previous compile once the file exists | lazerg | 2026-11-01 |  |
| [#20636](https://github.com/tailwindlabs/tailwindcss/pull/20636) | Fix stale file reads during a CLI rebuild | hadrienblanc | 2026-10-31 | v3 |
| [#20635](https://github.com/tailwindlabs/tailwindcss/pull/20635) | Extract classes from multi-line Ruby in Haml templates | andrewfader | 2026-10-31 |  |
| [#20630](https://github.com/tailwindlabs/tailwindcss/pull/20630) | Treat a lone CR and form feed as line breaks in the CSS parser | b84330808 | 2026-10-29 |  |
| [#20629](https://github.com/tailwindlabs/tailwindcss/pull/20629) | Load Lightning CSS lazily so `optimize: false` works without a native binding | PerryLink | 2026-10-29 |  |
| [#20624](https://github.com/tailwindlabs/tailwindcss/pull/20624) | Preserve inline theme aliases during canonicalization | Boulea7 | 2026-10-28 |  |
| [#20623](https://github.com/tailwindlabs/tailwindcss/pull/20623) | Fix `SOURCEMAP_BROKEN` warning for Tailwind CSS roots in `@tailwindcss/vite` builds | lazerg | 2026-10-28 |  |
| [#20615](https://github.com/tailwindlabs/tailwindcss/pull/20615) | Don't add whitespace around math operators inside strings in arbitrary values | lazerg | 2026-10-25 |  |
| [#20612](https://github.com/tailwindlabs/tailwindcss/pull/20612) | Rewrite `url(…)`s next to an `image-set(…)` when inlining imported stylesheets | NgoQuocViet2001 | 2026-10-23 |  |
| [#20609](https://github.com/tailwindlabs/tailwindcss/pull/20609) | Reject bare color opacity modifiers above 100 | otarampinelli | 2026-10-22 |  |
| [#20608](https://github.com/tailwindlabs/tailwindcss/pull/20608) | Canonicalization: print utilities named `@` without a `-` after the `@` | lazerg | 2026-10-22 |  |
| [#20606](https://github.com/tailwindlabs/tailwindcss/pull/20606) | Keep opacity in the `color-mix(…)` fallback when using a theme prefix | koreahghg | 2026-10-22 |  |
| [#20604](https://github.com/tailwindlabs/tailwindcss/pull/20604) | Don't treat the `/` in theme keys like `width.1/2` as an opacity modifier | spokodev | 2026-10-21 |  |
| [#20603](https://github.com/tailwindlabs/tailwindcss/pull/20603) | Canonicalization: collapse `text-{x} leading-none` into `text-{x}/none` consistently | lazerg | 2026-10-21 |  |
| [#20601](https://github.com/tailwindlabs/tailwindcss/pull/20601) | feat(oxide): add FreeBSD arm64 native binding | samm-git | 2026-10-20 |  |
| [#20599](https://github.com/tailwindlabs/tailwindcss/pull/20599) | Process stylesheets that only use `@theme` in `@tailwindcss/vite` | mkantautas | 2026-10-20 |  |
| [#20598](https://github.com/tailwindlabs/tailwindcss/pull/20598) | Keep `@keyframes` referenced by `animation-name` | mkantautas | 2026-10-20 |  |
| [#20597](https://github.com/tailwindlabs/tailwindcss/pull/20597) | Process Vue `<style module>` blocks in `@tailwindcss/vite` | mkantautas | 2026-10-20 |  |
| [#20585](https://github.com/tailwindlabs/tailwindcss/pull/20585) | Avoid floating point noise when constant folding `calc()` and unit conversion | otarampinelli | 2026-10-16 |  |
| [#20555](https://github.com/tailwindlabs/tailwindcss/pull/20555) | Sort logical sizing utilities next to their physical counterparts | johannpinson | 2026-10-09 |  |
| [#20552](https://github.com/tailwindlabs/tailwindcss/pull/20552) | Add Windows ARM64 standalone binary | debanjanbasu | 2026-10-08 |  |
| [#20541](https://github.com/tailwindlabs/tailwindcss/pull/20541) | v3: Drop the `braces` dependency chain (`fast-glob`, `micromatch`, `chokidar` v3) | yazansalhi | 2026-10-05 | v3 |
| [#20535](https://github.com/tailwindlabs/tailwindcss/pull/20535) | fix(upgrade): don't migrate `variant` prop values in expressions or comments | benjaminkincses | 2026-10-02 |  |
| [#20526](https://github.com/tailwindlabs/tailwindcss/pull/20526) | Fix unmet dependency errors by stripping bundledDependencies in WASM package | abdelrhmanahmed255 | 2026-09-27 |  |
| [#20525](https://github.com/tailwindlabs/tailwindcss/pull/20525) | Fix Vite input dependency rebuild race | irontaek | 2026-09-27 |  |
| [#20524](https://github.com/tailwindlabs/tailwindcss/pull/20524) | Respect git global ignore files (core.excludesFile) in source scanner | Lukecele | 2026-09-27 |  |
| [#20523](https://github.com/tailwindlabs/tailwindcss/pull/20523) | Don't crash when `container` padding uses a screen that isn't a breakpoint | kwy404 | 2026-09-27 |  |
| [#20521](https://github.com/tailwindlabs/tailwindcss/pull/20521) | Fix `sr-only` table caption visibility in Firefox (#20510) | abdelrhmanahmed255 | 2026-09-26 |  |
| [#20520](https://github.com/tailwindlabs/tailwindcss/pull/20520) | Add `content-visibility` utilities | abdelrhmanahmed255 | 2026-09-26 |  |
| [#20519](https://github.com/tailwindlabs/tailwindcss/pull/20519) | Add `text-stable` utility for `text-wrap: stable` | abdelrhmanahmed255 | 2026-09-26 |  |
| [#20518](https://github.com/tailwindlabs/tailwindcss/pull/20518) | feat: add interpolate-size utilities for keyword interpolation in animations | abdelrhmanahmed255 | 2026-09-26 |  |
| [#20515](https://github.com/tailwindlabs/tailwindcss/pull/20515) | Enable lightningcss scroll navigation drafts so :target-current parses | aceeyz | 2026-09-25 |  |
| [#20503](https://github.com/tailwindlabs/tailwindcss/pull/20503) | Do not retain the finished build's plugin context in `@tailwindcss/vite` | lazerg | 2026-09-21 |  |
| [#20499](https://github.com/tailwindlabs/tailwindcss/pull/20499) | Merge user resolve.conditions in @tailwindcss/vite CSS @import resolver | benjaminkincses | 2026-09-19 |  |
| [#20485](https://github.com/tailwindlabs/tailwindcss/pull/20485) | Fix scanning Yarn PnP workspace packages | OllieinCanada | 2026-09-11 |  |
| [#20484](https://github.com/tailwindlabs/tailwindcss/pull/20484) | Ignore Vite build output when scanning sources | OllieinCanada | 2026-09-11 |  |
| [#20475](https://github.com/tailwindlabs/tailwindcss/pull/20475) | Support formatted Vue Pug template tags | cuishuang | 2026-09-10 |  |
| [#20471](https://github.com/tailwindlabs/tailwindcss/pull/20471) | Keep Oxide loaded on Windows after Node worker exit | bompus | 2026-09-08 |  |
| [#20446](https://github.com/tailwindlabs/tailwindcss/pull/20446) | Prevent older watch rebuilds from overwriting newer CSS | michaelglass | 2026-08-31 |  |
| [#20445](https://github.com/tailwindlabs/tailwindcss/pull/20445) | Fix `drop-shadow` ignoring its opacity modifier when no size is specified | koreahghg | 2026-08-31 |  |
| [#20444](https://github.com/tailwindlabs/tailwindcss/pull/20444) | Add a colorMixPolyfill option to @tailwindcss/postcss | bmaurer | 2026-08-30 |  |
| [#20440](https://github.com/tailwindlabs/tailwindcss/pull/20440) | Vite: Exclude build output directories from source scanning in watch mode | yiheng-kkk | 2026-08-29 |  |
| [#20436](https://github.com/tailwindlabs/tailwindcss/pull/20436) | Do not migrate a variant literal behind a conditional | HuzaifaChaudary | 2026-08-27 |  |
| [#20406](https://github.com/tailwindlabs/tailwindcss/pull/20406) | Don't scan sibling files of a concrete `@source` inside an auto source root | benjamincanac | 2026-08-10 |  |
| [#20395](https://github.com/tailwindlabs/tailwindcss/pull/20395) | Fix @tailwindcss/postcss losing watch dependencies after a compile error | andershagbard | 2026-08-07 |  |
| [#20394](https://github.com/tailwindlabs/tailwindcss/pull/20394) | Ensure custom --spacing-* values don't shadow spacing utility keywords | thejamesgore | 2026-08-06 |  |
| [#20388](https://github.com/tailwindlabs/tailwindcss/pull/20388) | fix(cli): exclude noise directories from --watch file watcher | SomSamantray | 2026-08-05 |  |
| [#20327](https://github.com/tailwindlabs/tailwindcss/pull/20327) | Add s390x-unknown-linux-gnu target | satyamg1620 | 2026-07-14 |  |
| [#20276](https://github.com/tailwindlabs/tailwindcss/pull/20276) | feat(oxide): add OpenHarmony (aarch64-unknown-linux-ohos) prebuilt binary support | social4hyq | 2026-06-25 |  |
| [#20274](https://github.com/tailwindlabs/tailwindcss/pull/20274) | Support prefixed custom CSS imports | saadeghi | 2026-06-24 |  |
| [#20201](https://github.com/tailwindlabs/tailwindcss/pull/20201) | Add riscv64 (linux-gnu) prebuilt binary | gounthar | 2026-06-05 |  |
| [#20199](https://github.com/tailwindlabs/tailwindcss/pull/20199) | Add display-mode variants for pwa | mrleblanc101 | 2026-06-04 |  |
| [#20036](https://github.com/tailwindlabs/tailwindcss/pull/20036) | Add Vite polyfills option | lubomirblazekcz | 2026-05-11 |  |
| [#19774](https://github.com/tailwindlabs/tailwindcss/pull/19774) | Fix case-sensitive file path comparison in watch mode on Windows | mvanhorn | 2026-03-10 |  |
| [#19773](https://github.com/tailwindlabs/tailwindcss/pull/19773) | Fix custom spacing values shadowing leading-none staticValues | mvanhorn | 2026-03-10 |  |
| [#19653](https://github.com/tailwindlabs/tailwindcss/pull/19653) | fix(compat): map maxWidth to max-width namespace in v4 migration | NssGourav | 2026-02-09 |  |
| [#19299](https://github.com/tailwindlabs/tailwindcss/pull/19299) | Fix @scope variant output and add test for scoped variant | SHARMA1525 | 2025-11-12 |  |
| [#19298](https://github.com/tailwindlabs/tailwindcss/pull/19298) | Add `corner-shape` utility classes (`corner-*`) | baptisthecht | 2025-11-12 |  |
| [#19254](https://github.com/tailwindlabs/tailwindcss/pull/19254) | Handle utilities with `1` keys in a JS config | thecrypticace | 2025-11-03 |  |
| [#19228](https://github.com/tailwindlabs/tailwindcss/pull/19228) | Add reference CSS syntax showcase | philipp-spiess | 2025-10-29 |  |
| [#18994](https://github.com/tailwindlabs/tailwindcss/pull/18994) | Use custom implementation of canonicalize for wasi | thecrypticace | 2025-09-25 |  |
| [#18292](https://github.com/tailwindlabs/tailwindcss/pull/18292) | Feat: Adds rust config options to detect threading support in oxide | jlukic | 2025-06-12 |  |
| [#17945](https://github.com/tailwindlabs/tailwindcss/pull/17945) | Adds default styles for `[popover]` | brandonmcconnell | 2025-05-09 |  |
| [#16295](https://github.com/tailwindlabs/tailwindcss/pull/16295) | Bun plugin | zackradisic | 2025-02-06 |  |
| [#13389](https://github.com/tailwindlabs/tailwindcss/pull/13389) | Add first-class support for height media/container queries | brandonmcconnell | 2024-03-28 |  |
