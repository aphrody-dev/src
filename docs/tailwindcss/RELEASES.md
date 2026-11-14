# Releases tailwindlabs/tailwindcss (60 dernières)

## v4.3.5 (2026-11-06)

### Fixed

- Canonicalization: improve performance in projects with many functional variant values (e.g. a `matchVariant` plugin with thousands of values) ([#20663](https://github.com/tailwindlabs/tailwindcss/pull/20663))
- Don't crash or create a fallback with the wrong color for a `color-mix(…)` without a color interpolation method (e.g. `color-mix(var(--color-red-500))` or `color-mix(currentcolor 50%, transparent)`) ([#20658](https://github.com/tailwindlabs/tailwindcss/pull/20658), [#20666](https://github.com/tailwindlabs/tailwindcss/pull/20666))
- Ensure `@tailwindcss/oxide-wasm32-wasi` loads instead of hanging forever (e.g. with `NAPI_RS_FORCE_WASI=error` or in WebContainers) ([#20667](https://github.com/tailwindlabs/tailwindcss/pull/20667))
- Remove `as: '*.css'` from the `@tailwindcss/turbopack` setup in its README, because it breaks CSS modules ([#20660](https://github.com/tailwindlabs/tailwindcss/pull/20660))
- Ignore `<!--` and `-->` between top-level rules in CSS instead of throwing or swallowing the next rule (e.g. `a { color: red } --> b { color: blue }`) ([#20665](https://github.com/tailwindlabs/tailwindcss/pull/20665))
- Ensure `@tailwindcss/oxide-wasm32-wasi` detects changed and new source files after the first scan (e.g. in WebContainers) ([#20487](https://github.com/tailwindlabs/tailwindcss/pull/20487))
- Prevent type errors with `skipLibCheck: false` caused by imports of unshipped modules in the `@tailwindcss/node` type declarations ([#20632](https://github.com/tailwindlabs/tailwindcss/pull/20632))

## v4.3.4 (2026-11-02)

### Added

- Add `@tailwindcss/turbopack`, a Turbopack loader for using Tailwind CSS with Next.js ([#20367](https://github.com/tailwindlabs/tailwindcss/pull/20367))

### Fixed

- Ensure watch mode detects changes to symlinked `@source` files whose real paths aren't otherwise scanned ([#20356](https://github.com/tailwindlabs/tailwindcss/pull/20356))
- Ensure variants using `@scope` wrap generated utilities instead of nesting inside them ([#20369](https://github.com/tailwindlabs/tailwindcss/pull/20369))
- Ensure nested `@scope` rules preserve their scoping semantics when flattened ([#20369](https://github.com/tailwindlabs/tailwindcss/pull/20369))
- Preserve declarations directly inside `@scope` by wrapping them in `:where(:scope)` ([#20369](https://github.com/tailwindlabs/tailwindcss/pull/20369))
- Ensure generated utilities include a space in empty `var()` fallbacks (e.g. `var(--tw-blur,)` → `var(--tw-blur, )`) ([#20373](https://github.com/tailwindlabs/tailwindcss/pull/20373))
- Canonicalization: convert arbitrary breakpoint and container query variants to named equivalents (e.g. `max-[64rem]:flex` → `max-lg:flex`) ([#20380](https://github.com/tailwindlabs/tailwindcss/pull/20380))
- Prevent `@tailwindcss/vite` from crashing on every edit under Vite's experimental `bundledDev` mode ([#20379](https://github.com/tailwindlabs/tailwindcss/pull/20379))
- Ensure `@tailwindcss/oxide` falls back to WASM on platforms without native bindings (`@tailwindcss/oxide-wasm32-wasi` now installs on all platforms, but only loads when no native binding is available) ([#20383](https://github.com/tailwindlabs/tailwindcss/pull/20383))
- Extract class candidates from Ruby `%w` and `%W` literals using angle brackets or custom delimiters (e.g. `%w<flex>`, `%w|flex|`), including in Slim and Haml templates ([#20387](https://github.com/tailwindlabs/tailwindcss/pull/20387))
- Preserve whitespace in `--default(…)` values in functional `@utility` definitions (e.g. `--default(box alphabetic)` no longer becomes `boxalphabetic`) ([#20392](https://github.com/tailwindlabs/tailwindcss/pull/20392))
- Ensure automatic source detection respects negation-based `.gitignore` files (e.g. `/*` followed by `!/…` patterns) ([#20397](https://github.com/tailwindlabs/tailwindcss/pull/20397))
- Ensure root `theme('…')` namespace lookups in JavaScript plugins and config files return the full namespace object instead of the value of its `DEFAULT` key ([#20399](https://github.com/tailwindlabs/tailwindcss/pull/20399))
- Skip ignored directories when generating watch globs instead of walking their contents on every rebuild ([#20408](https://github.com/tailwindlabs/tailwindcss/pull/20408))
- Drop invalid UTF-8 candidates during class detection ([#20389](https://github.com/tailwindlabs/tailwindcss/pull/20389))
- Prevent `@tailwindcss/vite` from forcing full-page reloads for scanned files that Vite does not handle as modules (e.g. `.php` files) ([#20414](https://github.com/tailwindlabs/tailwindcss/pull/20414))
- Canonicalization: don't merge utilities that reference different theme variables set to CSS-wide keywords like `unset` ([#20417](https://github.com/tailwindlabs/tailwindcss/pull/20417))
- Don't generate utilities when a modifier is used that would otherwise be silently ignored (e.g. `rounded-sm/[5]`, `shadow-sm/foo`, `stroke-2/50`) ([#20419](https://github.com/tailwindlabs/tailwindcss/pull/20419))
- Preserve `and`, `or`, and `not` inside selectors in `supports-[…]` variants (e.g. `supports-[selector(a:not(.foo))]:flex`) ([#20420](https://github.com/tailwindlabs/tailwindcss/pull/20420))
- Don't warn about Angular's `::ng-deep` and `:host-context()` when optimizing CSS ([#20434](https://github.com/tailwindlabs/tailwindcss/pull/20434))
- Don't generate CSS for candidates containing an empty additional modifier (e.g. `bg-red-500/50/` and `group-hover/foo//bar:flex`) ([#20466](https://github.com/tailwindlabs/tailwindcss/pull/20466))
- Ensure `min-*`, `max-*`, and container query variants with decimal values are sorted numerically (e.g. `min-[40.25rem]` before `min-[40.5rem]`) ([#20512](https://github.com/tailwindlabs/tailwindcss/pull/20512))
- Ensure CSS comments ending with `\*/` are closed correctly instead of swallowing the CSS that follows (e.g. `/* C:\temp\*/`) ([#20508](https://github.com/tailwindlabs/tailwindcss/pull/20508))
- Improve style invalidation performance of `group-*` and `peer-*` variants ([#20513](https://github.com/tailwindlabs/tailwindcss/pull/20513))
- Ensure cached compilers release their `loadModule` and `loadStylesheet` callbacks after compilation ([#20531](https://github.com/tailwindlabs/tailwindcss/pull/20531))
- Canonicalization: preserve `&` when moving a pseudo-element into `*` or `**` (e.g. `[&_::before]:flex` → `**:[&::before]:flex`) ([#20550](https://github.com/tailwindlabs/tailwindcss/pull/20550))
- Ensure the `Set.prototype.intersection` polyfill in `canonicalizeCandidates(…)` returns the intersection instead of the first set on Node.js < 22 ([#20562](https://github.com/tailwindlabs/tailwindcss/pull/20562))
- Canonicalization: ensure inline `theme(…)` alphas with more than 2 decimals migrate to a percentage modifier with the same opacity (e.g. `theme(colors.red.500/.12345)` → `text-red-500/[12.345%]`, not `text-red-500/[12.345]`) ([#20563](https://github.com/tailwindlabs/tailwindcss/pull/20563))
- Canonicalization: preserve inline `theme(…)` alphas as an arbitrary percentage when a custom `--opacity-*` theme value would change the opacity (e.g. `theme(colors.red.500/50%)` → `text-red-500/[50%]` with `--opacity-50: 10%`) ([#20563](https://github.com/tailwindlabs/tailwindcss/pull/20563))
- Ensure the `@property` fallback isn't applied in Safari versions that no longer support `margin-trim: inline` ([#20569](https://github.com/tailwindlabs/tailwindcss/pull/20569))
- Treat viewport units like `dvmin` and `svi` and font-relative units like `cap` and `rex` as lengths in arbitrary values (e.g. `text-[10dvmin]` generates `font-size` instead of `color`) ([#20516](https://github.com/tailwindlabs/tailwindcss/pull/20516))
- Write plugin logs to stderr in `tailwindcss canonicalize` so they don't end up in the results on stdout ([#20561](https://github.com/tailwindlabs/tailwindcss/pull/20561))
- Extract class shorthands on later lines when Pug text, comments, or quoted attribute values contain unbalanced brackets, or a quote that doesn't start a string (e.g. `input(pattern=/"/.source)`) ([#20547](https://github.com/tailwindlabs/tailwindcss/pull/20547), [#20572](https://github.com/tailwindlabs/tailwindcss/pull/20572))
- Underline the correct occurrence of an unsupported data type in `--value(…)` warnings ([#20554](https://github.com/tailwindlabs/tailwindcss/pull/20554))
- Canonicalization: prefer an existing candidate when collapsing utilities over another utility with the same default theme value (e.g. `text-foreground text-primary` → `text-primary`, not `text-card-checked-border`) ([#20540](https://github.com/tailwindlabs/tailwindcss/pull/20540))
- Canonicalization: don't collapse utilities into a utility that uses another theme variable with the same default value (e.g. `mt-card mb-card` → `my-card`, not `my-4`) ([#20574](https://github.com/tailwindlabs/tailwindcss/pull/20574))
- Ensure `@tailwindcss/postcss` rewrites relative `url(…)`s of stylesheets that are inlined before it runs (e.g. `@import`s in Vite) in optimized builds ([#20576](https://github.com/tailwindlabs/tailwindcss/pull/20576))
- Drop nested rules that put a combinator after a pseudo-element when using pseudo-element variants (e.g. `selection:*` on a utility with a nested `& > *` rule) ([#20575](https://github.com/tailwindlabs/tailwindcss/pull/20575))
- Don't generate CSS for arbitrary values with unbalanced parentheses or brackets (e.g. `w-[calc(1px]` or `[--x:a[b]`) ([#20577](https://github.com/tailwindlabs/tailwindcss/pull/20577))
- Canonicalization: prevent `collapse: true` from taking exponentially longer when classes are linked through a utility that sets many properties (e.g. `sr-only`) ([#20558](https://github.com/tailwindlabs/tailwindcss/pull/20558))
- Ensure `&` is substituted inside `:-moz-any(…)` and `:-webkit-any(…)` in custom variants (e.g. `@custom-variant firefox (:-moz-any(&));`) ([#20486](https://github.com/tailwindlabs/tailwindcss/pull/20486))
- Ensure the standalone macOS binaries have a valid code signature, so macOS 27 no longer kills them at launch ([#20578](https://github.com/tailwindlabs/tailwindcss/pull/20578))
- Ensure `@tailwindcss/turbopack` and `@tailwindcss/webpack` rebuild when the input CSS changes (e.g. `next dev` with Turbopack no longer serves the CSS of the previous edit) ([#20582](https://github.com/tailwindlabs/tailwindcss/pull/20582))
- Canonicalization: don't drop a utility that sets a `--tw-*` variable when an unrelated property has the same value (e.g. `link mt-4` no longer becomes `mt-4` when `link` sets `margin-top: 16px` and `--tw-translate-x: 16px`) ([#20593](https://github.com/tailwindlabs/tailwindcss/pull/20593))
- Decode single-digit hexadecimal escapes in theme variable and `@utility` names as the CSS spec does (e.g. `@theme { --color-\0: red; }` no longer registers `--color-0`) ([#20591](https://github.com/tailwindlabs/tailwindcss/pull/20591))
- Don't treat `!important` inside strings, comments or `url()` in declaration values as the important flag (e.g. `content: "a !important b"`) ([#20627](https://github.com/tailwindlabs/tailwindcss/pull/20627))
- Parse a custom property at the end of the input when it has no trailing `;` (e.g. `--foo: bar` as the last declaration) ([#20653](https://github.com/tailwindlabs/tailwindcss/pull/20653))
- Keep a declaration without a `;` at the end of the CSS input (e.g. `color: red`) ([#20655](https://github.com/tailwindlabs/tailwindcss/pull/20655))

## v4.3.3 (2026-07-16)

### Fixed

- Support `--watch --poll[=ms]` in `@tailwindcss/cli` when filesystem events are unreliable or unavailable ([#20297](https://github.com/tailwindlabs/tailwindcss/pull/20297))
- Canonicalization: match arbitrary hex colors against theme colors case-insensitively (e.g. `bg-[#fff]` and `bg-[#FFF]` → `bg-white`) ([#20298](https://github.com/tailwindlabs/tailwindcss/pull/20298))
- Prevent Preflight from overriding Firefox's native `iframe:focus-visible` outline styles ([#20292](https://github.com/tailwindlabs/tailwindcss/pull/20292))
- Ensure `theme('colors.foo')` in JS plugins resolves correctly when both `--color-foo` and `--color-foo-bar` exist ([#20299](https://github.com/tailwindlabs/tailwindcss/pull/20299))
- Ensure fractional opacity modifiers work with named shadow sizes like `shadow-sm/12.5`, `text-shadow-sm/12.5`, `drop-shadow-sm/12.5`, and `inset-shadow-sm/12.5` ([#20302](https://github.com/tailwindlabs/tailwindcss/pull/20302))
- Parse selectors like `[data-foo]div` as two selectors instead of one ([#20303](https://github.com/tailwindlabs/tailwindcss/pull/20303))
- Ensure `@tailwindcss/postcss` rebuilds when a preprocessor like Sass changes the input CSS without changing the input file on disk ([#20310](https://github.com/tailwindlabs/tailwindcss/pull/20310))
- Ensure CSS nesting is handled even when Lightning CSS isn't run, such as in `@tailwindcss/browser` and Tailwind Play ([#20124](https://github.com/tailwindlabs/tailwindcss/pull/20124))
- Prevent achromatic theme colors from shifting hue when mixed in polar color spaces like `oklch` ([#20314](https://github.com/tailwindlabs/tailwindcss/pull/20314))
- Ensure `--spacing(0)` is optimized to `0px` instead of `0` so it remains a `<length>` when used in `calc(…)` ([#20319](https://github.com/tailwindlabs/tailwindcss/pull/20319))
- Load `@parcel/watcher` only when needed in `@tailwindcss/cli --watch` mode, so one-off builds and `--watch --poll` work when `@parcel/watcher` can't be loaded ([#20325](https://github.com/tailwindlabs/tailwindcss/pull/20325))
- Use explicit platform fonts instead of `system-ui` and `ui-sans-serif` so CJK text respects the page's `lang` attribute on Windows ([#20318](https://github.com/tailwindlabs/tailwindcss/pull/20318))
- Prevent `@tailwindcss/upgrade` from rewriting ignored files when run from a subdirectory ([#20329](https://github.com/tailwindlabs/tailwindcss/pull/20329))
- Ensure earlier `@source` rules pointing to nested files are scanned when later `@source` rules point to files in parent folders ([#20335](https://github.com/tailwindlabs/tailwindcss/pull/20335))
- Prevent `@tailwindcss/vite` from triggering full page reloads when scanned files are processed by Vite but haven't been loaded as modules yet ([#20336](https://github.com/tailwindlabs/tailwindcss/pull/20336))

## v4.3.2 (2026-06-29)

### Fixed

- Support bare spacing values for `auto-rows-*` and `auto-cols-*` utilities (e.g. `auto-rows-12` and `auto-cols-16`) ([#20229](https://github.com/tailwindlabs/tailwindcss/pull/20229))
- Prevent `@tailwindcss/cli` in `--watch` mode from crashing on Windows when `@source` points to a directory that doesn't exist ([#20242](https://github.com/tailwindlabs/tailwindcss/pull/20242))
- Prevent `@tailwindcss/vite` from crashing in Deno v2.8.x when `context.parentURL` is not a valid URL ([#20245](https://github.com/tailwindlabs/tailwindcss/pull/20245))
- Ensure `@tailwindcss/cli` in `--watch` mode rebuilds when the input CSS file changes in an ignored directory ([#20246](https://github.com/tailwindlabs/tailwindcss/pull/20246))
- Allow `@variant` rules used in `addBase(…)` to use custom variants defined later ([#20247](https://github.com/tailwindlabs/tailwindcss/pull/20247))
- Prevent `@tailwindcss/vite` from crashing during HMR when scanned files or directories are deleted ([#20259](https://github.com/tailwindlabs/tailwindcss/pull/20259))
- Generate `font-size` instead of `color` declarations for `text-[--spacing(…)]` ([#20260](https://github.com/tailwindlabs/tailwindcss/pull/20260))
- Prevent `@source` patterns from scanning unrelated sibling files and folders ([#20263](https://github.com/tailwindlabs/tailwindcss/pull/20263))
- Extract class candidates adjacent to Template Toolkit delimiters like `%]…[%` in `.tt`, `.tt2`, and `.tx` files ([#20269](https://github.com/tailwindlabs/tailwindcss/pull/20269))
- Extract class candidates from conditional Maud syntax like `p.text-black[condition]` ([#20269](https://github.com/tailwindlabs/tailwindcss/pull/20269))
- Prevent `@position-try` rules from triggering unknown at-rule warnings when optimizing CSS ([#20277](https://github.com/tailwindlabs/tailwindcss/pull/20277))
- Support class suggestions for named opacity modifiers from `--opacity` theme values ([#20287](https://github.com/tailwindlabs/tailwindcss/pull/20287))
- Prevent type errors in `@tailwindcss/postcss` when used with newer PostCSS patch releases ([#20289](https://github.com/tailwindlabs/tailwindcss/pull/20289))

## v4.3.1 (2026-06-12)

### Added

- Add `--silent` option to suppress output in `@tailwindcss/cli` ([#20100](https://github.com/tailwindlabs/tailwindcss/pull/20100))

### Fixed

- Remove deprecation warnings by using `Module#registerHooks` instead of `Module#register` on Node 26+ ([#20028](https://github.com/tailwindlabs/tailwindcss/pull/20028))
- Canonicalization: don't crash when plugin utilities throw for unsupported values ([#20052](https://github.com/tailwindlabs/tailwindcss/pull/20052))
- Allow `@apply` to be used with CSS mixins ([#19427](https://github.com/tailwindlabs/tailwindcss/pull/19427))
- Ensure `not-*` correctly negates `@container` queries, including `style(…)` queries ([#20059](https://github.com/tailwindlabs/tailwindcss/pull/20059))
- Ensure `drop-shadow-*` color utilities work with custom shadow values containing `calc(…)` ([#20080](https://github.com/tailwindlabs/tailwindcss/pull/20080))
- Fix 'Sourcemap is likely to be incorrect' warnings when using `@tailwindcss/vite` ([#20103](https://github.com/tailwindlabs/tailwindcss/pull/20103))
- Ensure `@tailwindcss/webpack` can be installed in Rspack projects without requiring `webpack` as a peer dependency ([#20027](https://github.com/tailwindlabs/tailwindcss/pull/20027))
- Canonicalization: don't suggest invalid `calc(…)` expressions (e.g. `px-[calc(1rem+0px)]` → `px-[calc(1rem+0)]`) ([#20127](https://github.com/tailwindlabs/tailwindcss/pull/20127))
- Canonicalization: avoid suggesting large spacing-scale values for arbitrary lengths (e.g. `left-[99999px]` → `left-[99999px]`, not `left-24999.75`) ([#20130](https://github.com/tailwindlabs/tailwindcss/pull/20130))
- Ensure `@tailwindcss/cli` in `--watch` mode recovers when a tracked dependency is deleted and restored ([#20137](https://github.com/tailwindlabs/tailwindcss/pull/20137))
- Ensure standalone `@tailwindcss/cli` binaries are ignored when scanning for class candidates ([#20139](https://github.com/tailwindlabs/tailwindcss/pull/20139))
- Ensure class candidates are extracted from Twig `addClass(…)` and `removeClass(…)` calls ([#20198](https://github.com/tailwindlabs/tailwindcss/pull/20198))
- Don't crash in the Ruby or Vue preprocessors when scanning files containing invalid UTF-8 bytes ([#19588](https://github.com/tailwindlabs/tailwindcss/pull/19588))
- Allow `@variant` to be used inside `addBase` ([#19480](https://github.com/tailwindlabs/tailwindcss/pull/19480))
- Ensure `@source` globs with symlinks are preserved ([#20203](https://github.com/tailwindlabs/tailwindcss/pull/20203))
- Ensure later `@source` rules can re-include files excluded by earlier `@source not` rules ([#20203](https://github.com/tailwindlabs/tailwindcss/pull/20203))
- Upgrade: don't migrate empty class rules to invalid `@utility` rules ([#20205](https://github.com/tailwindlabs/tailwindcss/pull/20205))
- Ensure transitions between `inset-shadow-none` and other inset shadows work correctly ([#20208](https://github.com/tailwindlabs/tailwindcss/pull/20208))
- Ensure explicitly referenced `@source` directories are scanned even when ignored by git ([#20214](https://github.com/tailwindlabs/tailwindcss/pull/20214))
- Ensure `@source` globs ending in `**/*` preserve dynamic path segments to avoid scanning too many files ([#20217](https://github.com/tailwindlabs/tailwindcss/pull/20217))
- Canonicalization: don't fold `calc(…)` divisions when the result would require high precision (e.g. `w-[calc(100%/3.5)]` → `w-[calc(100%/3.5)]`, not `w-[28.571428571428573%]`) ([#20221](https://github.com/tailwindlabs/tailwindcss/pull/20221))
- Serve ESM type declarations to ESM importers of `@tailwindcss/postcss` ([#20228](https://github.com/tailwindlabs/tailwindcss/pull/20228))

### Changed

- Generate `0` instead of `calc(var(--spacing) * 0)` for spacing utilities like `m-0` and `left-0` ([#20196](https://github.com/tailwindlabs/tailwindcss/pull/20196))
- Generate `var(--spacing)` instead of `calc(var(--spacing) * 1)` for spacing utilities like `m-1` and `left-1` ([#20196](https://github.com/tailwindlabs/tailwindcss/pull/20196))

## v4.3.0 (2026-05-08)

### Added

- Add `@container-size` utility ([#18901](https://github.com/tailwindlabs/tailwindcss/pull/18901))
- Add `scrollbar-{auto,thin,none}` utilities for `scrollbar-width`, and `scrollbar-thumb-*` / `scrollbar-track-*` color utilities for `scrollbar-color` ([#19981](https://github.com/tailwindlabs/tailwindcss/pull/19981), [#20019](https://github.com/tailwindlabs/tailwindcss/pull/20019))
- Add `scrollbar-gutter-*` utilities ([#20018](https://github.com/tailwindlabs/tailwindcss/pull/20018))
- Add `zoom-*` utilities ([#20020](https://github.com/tailwindlabs/tailwindcss/pull/20020))
- Add `tab-*` utilities ([#20022](https://github.com/tailwindlabs/tailwindcss/pull/20022))
- Allow using `@variant` with stacked variants (e.g. `@variant hover:focus { … }`) ([#19996](https://github.com/tailwindlabs/tailwindcss/pull/19996))
- Allow using `@variant` with compound variants (e.g. `@variant hover, focus { … }`) ([#19996](https://github.com/tailwindlabs/tailwindcss/pull/19996))
- Support `--default(…)` in `--value(…)` and `--modifier(…)` for functional `@utility` definitions ([#19989](https://github.com/tailwindlabs/tailwindcss/pull/19989))

### Fixed

- Ensure `@plugin` resolves package JavaScript entries instead of browser CSS entries when using `@tailwindcss/vite` ([#19949](https://github.com/tailwindlabs/tailwindcss/pull/19949))
- Fix relative `@import` and `@plugin` paths resolving from the wrong directory when using `@tailwindcss/vite` ([#19965](https://github.com/tailwindlabs/tailwindcss/pull/19965))
- Ensure CSS files containing `@variant` are processed by `@tailwindcss/vite` ([#19966](https://github.com/tailwindlabs/tailwindcss/pull/19966))
- Resolve imports relative to `base` when `result.opts.from` is not provided when using `@tailwindcss/postcss` ([#19980](https://github.com/tailwindlabs/tailwindcss/pull/19980))
- Canonicalization: preserve significant `_` whitespace in arbitrary values ([#19986](https://github.com/tailwindlabs/tailwindcss/pull/19986))
- Canonicalization: add parentheses when removing whitespace from arbitrary values would hurt readability (e.g. `w-[calc(100%---spacing(60))]` → `w-[calc(100%-(--spacing(60)))]`) ([#19986](https://github.com/tailwindlabs/tailwindcss/pull/19986))
- Canonicalization: preserve the original unit in arbitrary values instead of normalizing to base units (e.g. `-mt-[20in]` → `mt-[-20in]`, not `mt-[-1920px]`) ([#19988](https://github.com/tailwindlabs/tailwindcss/pull/19988))
- Canonicalization: migrate arbitrary `:has()` variants from `[&:has(…)]` to `has-[…]` ([#19991](https://github.com/tailwindlabs/tailwindcss/pull/19991))
- Upgrade: don’t migrate inline `style` attributes (e.g. `style="flex-grow: 1"` → `style="flex-grow: 1"`, not `style="grow: 1"`) ([#19918](https://github.com/tailwindlabs/tailwindcss/pull/19918))
- Allow multiple `@utility` definitions with the same name but different value types ([#19777](https://github.com/tailwindlabs/tailwindcss/pull/19777))
- Export missing `PluginWithConfig` type from `tailwindcss/plugin` to fix errors when inferring plugin config types ([#19707](https://github.com/tailwindlabs/tailwindcss/pull/19707))
- Ensure `start` and `end` legacy utilities without values do not generate CSS ([#20003](https://github.com/tailwindlabs/tailwindcss/pull/20003))
- Ensure `--value(…)` is required in functional `@utility` definitions ([#20005](https://github.com/tailwindlabs/tailwindcss/pull/20005))
- Canonicalization: preserve required whitespace around operators in negated arbitrary values (e.g. `-left-[(var(--a)+var(--b))]`) ([#20011](https://github.com/tailwindlabs/tailwindcss/pull/20011))

## v4.2.4 (2026-04-21)

### Fixed

- Ensure imports in `@import` and `@plugin` still resolve correctly when using Vite aliases in `@tailwindcss/vite` ([#19947](https://github.com/tailwindlabs/tailwindcss/pull/19947))

## v4.2.3 (2026-04-20)

### Fixed

- Canonicalization: improve canonicalizations for `tracking-*` utilities by preferring non-negative utilities (e.g. `-tracking-tighter` → `tracking-wider`) ([#19827](https://github.com/tailwindlabs/tailwindcss/pull/19827))
- Fix crash due to invalid characters in candidate (exceeding valid unicode code point range) ([#19829](https://github.com/tailwindlabs/tailwindcss/pull/19829))
- Ensure query params in imports are considered unique resources when using `@tailwindcss/webpack` ([#19723](https://github.com/tailwindlabs/tailwindcss/pull/19723))
- Canonicalization: collapse arbitrary values into shorthand utilities (e.g. `px-[1.2rem] py-[1.2rem]` → `p-[1.2rem]`) ([#19837](https://github.com/tailwindlabs/tailwindcss/pull/19837))
- Canonicalization: collapse `border-{t,b}-*` into `border-y-*`, `border-{l,r}-*` into `border-x-*`, and `border-{t,r,b,l}-*` into `border-*` ([#19842](https://github.com/tailwindlabs/tailwindcss/pull/19842))
- Canonicalization: collapse `scroll-m{t,b}-*` into `scroll-my-*`, `scroll-m{l,r}-*` into `scroll-mx-*`, and `scroll-m{t,r,b,l}-*` into `scroll-m-*` ([#19842](https://github.com/tailwindlabs/tailwindcss/pull/19842))
- Canonicalization: collapse `scroll-p{t,b}-*` into `scroll-py-*`, `scroll-p{l,r}-*` into `scroll-px-*`, and `scroll-p{t,r,b,l}-*` into `scroll-p-*` ([#19842](https://github.com/tailwindlabs/tailwindcss/pull/19842))
- Canonicalization: collapse `overflow-{x,y}-*` into `overflow-*` ([#19842](https://github.com/tailwindlabs/tailwindcss/pull/19842))
- Canonicalization: collapse `overscroll-{x,y}-*` into `overscroll-*` ([#19842](https://github.com/tailwindlabs/tailwindcss/pull/19842))
- Read from `--placeholder-color` instead of `--background-color` for `placeholder-*` utilities ([#19843](https://github.com/tailwindlabs/tailwindcss/pull/19843))
- Upgrade: ensure files are not emptied out when killing the upgrade process while it's running ([#19846](https://github.com/tailwindlabs/tailwindcss/pull/19846))
- Upgrade: use `config.content` when migrating from Tailwind CSS v3 to Tailwind CSS v4 ([#19846](https://github.com/tailwindlabs/tailwindcss/pull/19846))
- Upgrade: never migrate files that are ignored by git ([#19846](https://github.com/tailwindlabs/tailwindcss/pull/19846))
- Add `.env` and `.env.*` to default ignored content files ([#19846](https://github.com/tailwindlabs/tailwindcss/pull/19846))
- Canonicalization: migrate `overflow-ellipsis` into `text-ellipsis` ([#19849](https://github.com/tailwindlabs/tailwindcss/pull/19849))
- Canonicalization: migrate `start-full` → `inset-s-full`, `start-auto` → `inset-s-auto`, `start-px` → `inset-s-px`, and `start-<number>` → `inset-s-<number>` as well as negative versions ([#19849](https://github.com/tailwindlabs/tailwindcss/pull/19849))
- Canonicalization: migrate `end-full` → `inset-e-full`, `end-auto` → `inset-e-auto`, `end-px` → `inset-e-px`, and `end-<number>` → `inset-e-<number>` as well as negative versions ([#19849](https://github.com/tailwindlabs/tailwindcss/pull/19849))
- Canonicalization: move the `-` sign inside the arbitrary value `-left-[9rem]` → `left-[-9rem]` ([#19858](https://github.com/tailwindlabs/tailwindcss/pull/19858))
- Canonicalization: move the `-` sign outside the arbitrary value `ml-[calc(-1*var(--width))]` → `-ml-(--width)` ([#19858](https://github.com/tailwindlabs/tailwindcss/pull/19858))
- Improve performance when scanning JSONL / NDJSON files ([#19862](https://github.com/tailwindlabs/tailwindcss/pull/19862))
- Support `NODE_PATH` environment variable in standalone CLI ([#19617](https://github.com/tailwindlabs/tailwindcss/pull/19617))

## v4.2.2 (2026-03-18)

### Added

- Support Vite 8 in `@tailwindcss/vite` ([#19790](https://github.com/tailwindlabs/tailwindcss/pull/19790))

### Fixed

- Don't crash when candidates contain prototype properties like `row-constructor` ([#19725](https://github.com/tailwindlabs/tailwindcss/pull/19725))
- Canonicalize `calc(var(--spacing)*…)` expressions into `--spacing(…)` ([#19769](https://github.com/tailwindlabs/tailwindcss/pull/19769))
- Fix crash in canonicalization step when handling utilities containing `@property` at-rules (e.g. `shadow-sm border`) ([#19727](https://github.com/tailwindlabs/tailwindcss/pull/19727))
- Skip full reload for server only modules scanned by client CSS when using `@tailwindcss/vite` ([#19745](https://github.com/tailwindlabs/tailwindcss/pull/19745))
- Improve canonicalization for bare values exceeding default spacing scale suggestions (e.g. `w-1234 h-1234` → `size-1234`) ([#19809](https://github.com/tailwindlabs/tailwindcss/pull/19809))
- Fix canonicalization resulting in empty list (e.g. `w-5 h-5 size-5` → `''` instead of `size-5`) ([#19812](https://github.com/tailwindlabs/tailwindcss/pull/19812))

## v4.2.1 (2026-02-23)

### Fixed

- Allow trailing dash in functional utility names for backwards compatibility ([#19696](https://github.com/tailwindlabs/tailwindcss/pull/19696))
- Properly detect classes containing `.` characters within curly braces in MDX files ([#19711](https://github.com/tailwindlabs/tailwindcss/pull/19711))

## v4.2.0 (2026-02-18)

### Added

- Add mauve, olive, mist, and taupe color palettes to the default theme ([#19627](https://github.com/tailwindlabs/tailwindcss/pull/19627))
- Add `@tailwindcss/webpack` package to run Tailwind CSS as a webpack plugin ([#19610](https://github.com/tailwindlabs/tailwindcss/pull/19610))
- Add `pbs-*` and `pbe-*` utilities for `padding-block-start` and `padding-block-end` ([#19601](https://github.com/tailwindlabs/tailwindcss/pull/19601))
- Add `mbs-*` and `mbe-*` utilities for `margin-block-start` and `margin-block-end` ([#19601](https://github.com/tailwindlabs/tailwindcss/pull/19601))
- Add `scroll-pbs-*` and `scroll-pbe-*` utilities for `scroll-padding-block-start` and `scroll-padding-block-end` ([#19601](https://github.com/tailwindlabs/tailwindcss/pull/19601))
- Add `scroll-mbs-*` and `scroll-mbe-*` utilities for `scroll-margin-block-start` and `scroll-margin-block-end` ([#19601](https://github.com/tailwindlabs/tailwindcss/pull/19601))
- Add `border-bs-*` and `border-be-*` utilities for `border-block-start` and `border-block-end` ([#19601](https://github.com/tailwindlabs/tailwindcss/pull/19601))
- Add `inline-*`, `min-inline-*`, `max-inline-*` utilities for `inline-size`, `min-inline-size`, and `max-inline-size` ([#19612](https://github.com/tailwindlabs/tailwindcss/pull/19612))
- Add `block-*`, `min-block-*`, `max-block-*` utilities for `block-size`, `min-block-size`, and `max-block-size` ([#19612](https://github.com/tailwindlabs/tailwindcss/pull/19612))
- Add `inset-s-*`, `inset-e-*`, `inset-bs-*`, `inset-be-*` utilities for `inset-inline-start`, `inset-inline-end`, `inset-block-start`, and `inset-block-end` ([#19613](https://github.com/tailwindlabs/tailwindcss/pull/19613))
- Add `font-features-*` utility for `font-feature-settings` ([#19623](https://github.com/tailwindlabs/tailwindcss/pull/19623))

### Fixed

- Prevent double `@supports` wrapper for `color-mix` values ([#19450](https://github.com/tailwindlabs/tailwindcss/pull/19450))
- Allow whitespace around `@source inline()` argument ([#19461](https://github.com/tailwindlabs/tailwindcss/pull/19461))
- Emit comment when source maps are saved to files when using `@tailwindcss/cli` ([#19447](https://github.com/tailwindlabs/tailwindcss/pull/19447))
- Detect utilities containing capital letters followed by numbers ([#19465](https://github.com/tailwindlabs/tailwindcss/pull/19465))
- Fix class extraction for Rails' strict locals ([#19525](https://github.com/tailwindlabs/tailwindcss/pull/19525))
- Align `@utility` name validation with Oxide scanner rules ([#19524](https://github.com/tailwindlabs/tailwindcss/pull/19524))
- Fix infinite loop when using `@variant` inside `@custom-variant` ([#19633](https://github.com/tailwindlabs/tailwindcss/pull/19633))
- Allow multiples of `.25` in `aspect-*` fractions (e.g. `aspect-8.5/11`) ([#19688](https://github.com/tailwindlabs/tailwindcss/pull/19688))
- Ensure changes to external files listed via `@source` trigger a full page reload when using `@tailwindcss/vite` ([#19670](https://github.com/tailwindlabs/tailwindcss/pull/19670))
- Improve performance of Oxide scanner in bigger projects by reducing file system walks ([#19632](https://github.com/tailwindlabs/tailwindcss/pull/19632))
- Ensure import aliases in Astro v5 work without crashing when using `@tailwindcss/vite` ([#19677](https://github.com/tailwindlabs/tailwindcss/issues/19677))
- Allow escape characters in `@utility` names to improve support with formatters such as Biome ([#19626](https://github.com/tailwindlabs/tailwindcss/pull/19626))
- Fix incorrect canonicalization results when canonicalizing multiple times ([#19675](https://github.com/tailwindlabs/tailwindcss/pull/19675))
- Add `.jj` to default ignored content directories ([#19687](https://github.com/tailwindlabs/tailwindcss/pull/19687))

### Deprecated

- Deprecate `start-*` and `end-*` utilities in favor of `inset-s-*` and `inset-e-*` utilities ([#19613](https://github.com/tailwindlabs/tailwindcss/pull/19613))

## v4.1.18 (2025-12-11)

### Fixed

- Ensure validation of `source(…)` happens relative to the file it is in ([#19274](https://github.com/tailwindlabs/tailwindcss/pull/19274))
- Include filename and line numbers in CSS parse errors ([#19282](https://github.com/tailwindlabs/tailwindcss/pull/19282))
- Skip comments in Ruby files when checking for class names ([#19243](https://github.com/tailwindlabs/tailwindcss/pull/19243))
- Skip over arbitrary property utilities with a top-level `!` in the value ([#19243](https://github.com/tailwindlabs/tailwindcss/pull/19243))
- Support environment API in `@tailwindcss/vite` ([#18970](https://github.com/tailwindlabs/tailwindcss/pull/18970))
- Preserve case of theme keys from JS configs and plugins ([#19337](https://github.com/tailwindlabs/tailwindcss/pull/19337))
- Write source maps correctly on the CLI when using `--watch` ([#19373](https://github.com/tailwindlabs/tailwindcss/pull/19373))
- Handle special defaults (like `ringColor.DEFAULT`) in JS configs ([#19348](https://github.com/tailwindlabs/tailwindcss/pull/19348))
- Improve backwards compatibility for `content` theme key from JS configs ([#19381](https://github.com/tailwindlabs/tailwindcss/pull/19381))
- Upgrade: Handle `future` and `experimental` config keys ([#19344](https://github.com/tailwindlabs/tailwindcss/pull/19344))
- Try to canonicalize any arbitrary utility to a bare value ([#19379](https://github.com/tailwindlabs/tailwindcss/pull/19379))
- Validate candidates similarly to Oxide ([#19397](https://github.com/tailwindlabs/tailwindcss/pull/19397))
- Canonicalization: combine `text-*` and `leading-*` classes ([#19396](https://github.com/tailwindlabs/tailwindcss/pull/19396))
- Correctly handle duplicate CLI arguments ([#19416](https://github.com/tailwindlabs/tailwindcss/pull/19416))
- Don’t emit color-mix fallback rules inside `@keyframes` ([#19419](https://github.com/tailwindlabs/tailwindcss/pull/19419))
- CLI: Don't hang when output is `/dev/stdout` ([#19421](https://github.com/tailwindlabs/tailwindcss/pull/19421))

## v3.4.19 (2025-12-10)

### Fixed

- Don’t break `sibling-*()` functions when used inside `calc(…)` ([#19335](https://github.com/tailwindlabs/tailwindcss/pull/19335))

## v4.1.17 (2025-11-06)

### Fixed

- Substitute `@variant` inside legacy JS APIs ([#19263](https://github.com/tailwindlabs/tailwindcss/pull/19263))
- Prevent occasional crash on Windows when loaded into a worker thread ([#19242](https://github.com/tailwindlabs/tailwindcss/pull/19242))

## v4.1.16 (2025-10-23)

### Fixed

- Discard candidates with an empty data type ([#19172](https://github.com/tailwindlabs/tailwindcss/pull/19172))
- Fix canonicalization of arbitrary variants with attribute selectors ([#19176](https://github.com/tailwindlabs/tailwindcss/pull/19176))
- Fix invalid colors due to nested `&` ([#19184](https://github.com/tailwindlabs/tailwindcss/pull/19184))
- Improve canonicalization for `& > :pseudo` and `& :pseudo` arbitrary variants ([#19178](https://github.com/tailwindlabs/tailwindcss/pull/19178))

## v4.1.15 (2025-10-20)

### Fixed

- Fix Safari devtools rendering issue due to `color-mix` fallback ([#19069](https://github.com/tailwindlabs/tailwindcss/pull/19069))
- Suppress Lightning CSS warnings about `:deep`, `:slotted`, and `:global` ([#19094](https://github.com/tailwindlabs/tailwindcss/pull/19094))
- Fix resolving theme keys when starting with the name of another theme key in JS configs and plugins ([#19097](https://github.com/tailwindlabs/tailwindcss/pull/19097))
- Allow named groups in combination with `not-*`, `has-*`, and `in-*` ([#19100](https://github.com/tailwindlabs/tailwindcss/pull/19100))
- Prevent important utilities from affecting other utilities ([#19110](https://github.com/tailwindlabs/tailwindcss/pull/19110))
- Don’t index into strings with the `theme(…)` function ([#19111](https://github.com/tailwindlabs/tailwindcss/pull/19111))
- Fix parsing issue when `\t` is used in at-rules ([#19130](https://github.com/tailwindlabs/tailwindcss/pull/19130))
- Upgrade: Canonicalize utilities containing `0` values ([#19095](https://github.com/tailwindlabs/tailwindcss/pull/19095))
- Upgrade: Migrate deprecated `break-words` to `wrap-break-word` ([#19157](https://github.com/tailwindlabs/tailwindcss/pull/19157))

### Changed

- Remove the `postinstall` script from oxide ([#19149](https://github.com/tailwindlabs/tailwindcss/pull/19149))

## v4.1.14 (2025-10-01)

### Fixed

- Handle `'` syntax in ClojureScript when extracting classes ([#18888](https://github.com/tailwindlabs/tailwindcss/pull/18888))
- Handle `@variant` inside `@custom-variant` ([#18885](https://github.com/tailwindlabs/tailwindcss/pull/18885))
- Merge suggestions when using `@utility` ([#18900](https://github.com/tailwindlabs/tailwindcss/pull/18900))
- Ensure that file system watchers created when using the CLI are always cleaned up ([#18905](https://github.com/tailwindlabs/tailwindcss/pull/18905))
- Do not generate `grid-column` utilities when configuring `grid-column-start` or `grid-column-end` ([#18907](https://github.com/tailwindlabs/tailwindcss/pull/18907))
- Do not generate `grid-row` utilities when configuring `grid-row-start` or `grid-row-end` ([#18907](https://github.com/tailwindlabs/tailwindcss/pull/18907))
- Prevent duplicate CSS when overwriting a static utility with a theme key ([#18056](https://github.com/tailwindlabs/tailwindcss/pull/18056))
- Show Lightning CSS warnings (if any) when optimizing/minifying ([#18918](https://github.com/tailwindlabs/tailwindcss/pull/18918))
- Use `default` export condition for `@tailwindcss/vite` ([#18948](https://github.com/tailwindlabs/tailwindcss/pull/18948))
- Re-throw errors from PostCSS nodes ([#18373](https://github.com/tailwindlabs/tailwindcss/pull/18373))
- Detect classes in markdown inline directives ([#18967](https://github.com/tailwindlabs/tailwindcss/pull/18967))
- Ensure files with only `@theme` produce no output when built ([#18979](https://github.com/tailwindlabs/tailwindcss/pull/18979))
- Support Maud templates when extracting classes ([#18988](https://github.com/tailwindlabs/tailwindcss/pull/18988))
- Upgrade: Do not migrate `variant = 'outline'` during upgrades ([#18922](https://github.com/tailwindlabs/tailwindcss/pull/18922))
- Upgrade: Show version mismatch (if any) when running upgrade tool ([#19028](https://github.com/tailwindlabs/tailwindcss/pull/19028))
- Upgrade: Ensure first class inside `className` is migrated ([#19031](https://github.com/tailwindlabs/tailwindcss/pull/19031))
- Upgrade: Migrate classes inside `*ClassName` and `*Class` attributes ([#19031](https://github.com/tailwindlabs/tailwindcss/pull/19031))

## v3.4.18 (2025-10-01)

### Fixed

- Improve support for raw `supports-[…]` queries in arbitrary values ([#13605](https://github.com/tailwindlabs/tailwindcss/pull/13605))
- Fix `require.cache` error when loaded through a TypeScript file in Node 22.18+ ([#18665](https://github.com/tailwindlabs/tailwindcss/pull/18665))
- Support `import.meta.resolve(…)` in configs for new enough Node.js versions ([#18938](https://github.com/tailwindlabs/tailwindcss/pull/18938))
- Allow using newer versions of `postcss-load-config` for better ESM and TypeScript PostCSS config support with the CLI ([#18938](https://github.com/tailwindlabs/tailwindcss/pull/18938))
- Remove irrelevant utility rules when matching important classes ([#19030](https://github.com/tailwindlabs/tailwindcss/pull/19030))

## v4.1.13 (2025-09-04)

### Changed

- Drop warning from browser build ([#18731](https://github.com/tailwindlabs/tailwindcss/issues/18731))
- Drop exact duplicate declarations when emitting CSS ([#18809](https://github.com/tailwindlabs/tailwindcss/issues/18809))

### Fixed

- Don't transition `visibility` when using `transition` ([#18795](https://github.com/tailwindlabs/tailwindcss/pull/18795))
- Discard matched variants with unknown named values ([#18799](https://github.com/tailwindlabs/tailwindcss/pull/18799))
- Discard matched variants with non-string values ([#18799](https://github.com/tailwindlabs/tailwindcss/pull/18799))
- Show suggestions for known `matchVariant` values ([#18798](https://github.com/tailwindlabs/tailwindcss/pull/18798))
- Replace deprecated `clip` with `clip-path` in `sr-only` ([#18769](https://github.com/tailwindlabs/tailwindcss/pull/18769))
- Hide internal fields from completions in `matchUtilities` ([#18820](https://github.com/tailwindlabs/tailwindcss/pull/18820))
- Ignore `.vercel` folders by default (can be overridden by `@source …` rules) ([#18855](https://github.com/tailwindlabs/tailwindcss/pull/18855))
- Consider variants starting with `@-` to be invalid (e.g. `@-2xl:flex`) ([#18869](https://github.com/tailwindlabs/tailwindcss/pull/18869))
- Do not allow custom variants to start or end with a `-` or `_` ([#18867](https://github.com/tailwindlabs/tailwindcss/pull/18867), [#18872](https://github.com/tailwindlabs/tailwindcss/pull/18872))
- Upgrade: Migrate `aria` theme keys to `@custom-variant` ([#18815](https://github.com/tailwindlabs/tailwindcss/pull/18815))
- Upgrade: Migrate `data` theme keys to `@custom-variant` ([#18816](https://github.com/tailwindlabs/tailwindcss/pull/18816))
- Upgrade: Migrate `supports` theme keys to `@custom-variant` ([#18817](https://github.com/tailwindlabs/tailwindcss/pull/18817))

## v4.1.12 (2025-08-14)

### Fixed

- Don't consider the global important state in `@apply` ([#18404](https://github.com/tailwindlabs/tailwindcss/pull/18404))
- Add missing suggestions for `flex-<number>` utilities ([#18642](https://github.com/tailwindlabs/tailwindcss/pull/18642))
- Fix trailing `)` from interfering with extraction in Clojure keywords ([#18345](https://github.com/tailwindlabs/tailwindcss/pull/18345))
- Detect classes inside Elixir charlist, word list, and string sigils ([#18432](https://github.com/tailwindlabs/tailwindcss/pull/18432))
- Track source locations through `@plugin` and `@config` ([#18345](https://github.com/tailwindlabs/tailwindcss/pull/18345))
- Allow boolean values of `process.env.DEBUG` in `@tailwindcss/node` ([#18485](https://github.com/tailwindlabs/tailwindcss/pull/18485))
- Ignore consecutive semicolons in the CSS parser ([#18532](https://github.com/tailwindlabs/tailwindcss/pull/18532))
- Center the dropdown icon added to an input with a paired datalist by default ([#18511](https://github.com/tailwindlabs/tailwindcss/pull/18511))
- Extract candidates in Slang templates ([#18565](https://github.com/tailwindlabs/tailwindcss/pull/18565))
- Improve error messages when encountering invalid functional utility names ([#18568](https://github.com/tailwindlabs/tailwindcss/pull/18568))
- Discard CSS AST objects with `false` or `undefined` properties ([#18571](https://github.com/tailwindlabs/tailwindcss/pull/18571))
- Allow users to disable URL rebasing in `@tailwindcss/postcss` via `transformAssetUrls: false` ([#18321](https://github.com/tailwindlabs/tailwindcss/pull/18321))
- Fix false-positive migrations in `addEventListener` and JavaScript variable names ([#18718](https://github.com/tailwindlabs/tailwindcss/pull/18718))
- Fix Standalone CLI showing default Bun help when run via symlink on Windows ([#18723](https://github.com/tailwindlabs/tailwindcss/pull/18723))
- Read from `--border-color-*` theme keys in `divide-*` utilities for backwards compatibility ([#18704](https://github.com/tailwindlabs/tailwindcss/pull/18704/))
- Don't scan `.hdr` and `.exr` files for classes by default ([#18734](https://github.com/tailwindlabs/tailwindcss/pull/18734))

## v4.1.11 (2025-06-26)

### Fixed

- Add heuristic to skip candidate migrations inside `emit(…)` ([#18330](https://github.com/tailwindlabs/tailwindcss/pull/18330))
- Extract candidates with variants in Clojure/ClojureScript keywords ([#18338](https://github.com/tailwindlabs/tailwindcss/pull/18338))
- Document `--watch=always` in the CLI's usage ([#18337](https://github.com/tailwindlabs/tailwindcss/pull/18337))
- Add support for Vite 7 to `@tailwindcss/vite` ([#18384](https://github.com/tailwindlabs/tailwindcss/pull/18384))

## v4.1.10 (2025-06-11)

### Fixed

- Fix incorrectly generated CSS when using percentages in arbitrary values with calc (e.g. `w-[calc(100%-var(--offset))]`) ([#18289](https://github.com/tailwindlabs/tailwindcss/pull/18289))

## v4.1.9 (2025-06-11)

### Fixed

- Correctly parse custom properties with strings containing semicolons ([#18251](https://github.com/tailwindlabs/tailwindcss/pull/18251))
- Upgrade: Migrate arbitrary modifiers without percentage signs to bare values (e.g. `/[0.16]` → `/16`) ([#18184](https://github.com/tailwindlabs/tailwindcss/pull/18184))
- Upgrade: Migrate CSS variable shorthands where fallback value contains function call ([#18184](https://github.com/tailwindlabs/tailwindcss/pull/18184))
- Upgrade: Migrate negative arbitrary values to negative bare values (e.g. `mb-[-32rem]` → `-mb-128`) ([#18212](https://github.com/tailwindlabs/tailwindcss/pull/18212))
- Upgrade: Do not migrate `blur` in `wire:model.blur` ([#18216](https://github.com/tailwindlabs/tailwindcss/pull/18216))
- Don't add spaces around CSS dashed idents when formatting math expressions ([#18220](https://github.com/tailwindlabs/tailwindcss/pull/18220))

## v4.1.8 (2025-05-28)

### Added

- Improve error messages when `@apply` fails ([#18059](https://github.com/tailwindlabs/tailwindcss/pull/18059))

### Fixed

- Upgrade: Do not migrate declarations that look like candidates in `<style>` blocks ([#18057](https://github.com/tailwindlabs/tailwindcss/pull/18057), [18068](https://github.com/tailwindlabs/tailwindcss/pull/18068))
- Upgrade: Don't error when looking for `tailwindcss` in pnpm monorepos ([#18065](https://github.com/tailwindlabs/tailwindcss/pull/18065))
- Upgrade: Don't error when updating dependencies in pnpm monorepos ([#18065](https://github.com/tailwindlabs/tailwindcss/pull/18065))
- Upgrade: Migrate deprecated `order-none` to `order-0` ([#18126](https://github.com/tailwindlabs/tailwindcss/pull/18126))
- Support Leptos `class:` attributes when extracting classes ([#18093](https://github.com/tailwindlabs/tailwindcss/pull/18093))
- Fix "Cannot read properties of undefined" crash on malformed arbitrary value ([#18133](https://github.com/tailwindlabs/tailwindcss/pull/18133))
- Upgrade: Migrate `-mt-[0px]` to `mt-[0px]` instead of the other way around ([#18154](https://github.com/tailwindlabs/tailwindcss/pull/18154))
- Fix Haml pre-processing crash when there is no `\n` at the end of the file ([#18155](https://github.com/tailwindlabs/tailwindcss/pull/18155))
- Ignore `.pnpm-store` folders by default (can be overridden by `@source …` rules) ([#18163](https://github.com/tailwindlabs/tailwindcss/pull/18163))
- Fix PostCSS crash when calling `toJSON()` ([#18083](https://github.com/tailwindlabs/tailwindcss/pull/18083))

## v4.1.7 (2025-05-15)

### Added

- Upgrade: Migrate bare values to named values ([#18000](https://github.com/tailwindlabs/tailwindcss/pull/18000))
- Upgrade: Added cache to improve template migration performance ([#18025](https://github.com/tailwindlabs/tailwindcss/pull/18025))

### Fixed

- Allow `_` before numbers during candidate extraction ([#17961](https://github.com/tailwindlabs/tailwindcss/pull/17961))
- Prevent duplicate suggestions when using `@theme` and `@utility` together ([#17675](https://github.com/tailwindlabs/tailwindcss/pull/17675))
- Ensure that media queries within `::before` and `::after` pseudo selectors create valid CSS rules in production builds ([#17979](https://github.com/tailwindlabs/tailwindcss/pull/17979))
- Ensure that the standalone CLI does not leave temporary files behind ([#17981](https://github.com/tailwindlabs/tailwindcss/pull/17981))
- Ensure `-rotate-*` utilities properly negate arbitrary values ([#18014](https://github.com/tailwindlabs/tailwindcss/pull/18014))
- Ignore custom variants using `:merge(…)` selectors in legacy JS plugins ([#18020](https://github.com/tailwindlabs/tailwindcss/pull/18020))
- Ensure classes containing `.` are properly extracted from Clojure files ([#18038](https://github.com/tailwindlabs/tailwindcss/pull/18038))
- Upgrade: Fix error when using `@import … source(…)` ([#17963](https://github.com/tailwindlabs/tailwindcss/pull/17963))
- Upgrade: Change casing of utilities with named values to kebab-case to match updated theme variables ([#18017](https://github.com/tailwindlabs/tailwindcss/pull/18017))
- Upgrade: Don't migrate strings that match utility names in Vue attribute bindings other than `class` ([#18025](https://github.com/tailwindlabs/tailwindcss/pull/18025))

## v4.1.6 (2025-05-09)

### Added

- Upgrade: Automatically convert arbitrary values to named values when possible (e.g. `h-[1lh]` to `h-lh`) ([#17831](https://github.com/tailwindlabs/tailwindcss/pull/17831), [#17854](https://github.com/tailwindlabs/tailwindcss/pull/17854))
- Upgrade: Update dependencies in parallel for improved performance ([#17898](https://github.com/tailwindlabs/tailwindcss/pull/17898))
- Add detailed logging about `@source` directives, discovered files and scanned files when using `DEBUG=*` ([#17906](https://github.com/tailwindlabs/tailwindcss/pull/17906), [#17952](https://github.com/tailwindlabs/tailwindcss/pull/17952))
- Add support for generating source maps in development ([#17775](https://github.com/tailwindlabs/tailwindcss/pull/17775))

### Fixed

- Ensure negative arbitrary `scale` values generate negative values ([#17831](https://github.com/tailwindlabs/tailwindcss/pull/17831))
- Fix HAML extraction with embedded Ruby ([#17846](https://github.com/tailwindlabs/tailwindcss/pull/17846))
- Don't scan files for utilities when using `@reference` ([#17836](https://github.com/tailwindlabs/tailwindcss/pull/17836))
- Fix incorrectly replacing `_` with ` ` in arbitrary modifier shorthand `bg-red-500/(--my_opacity)` ([#17889](https://github.com/tailwindlabs/tailwindcss/pull/17889))
- Don't scan `.log` files for classes by default ([#17906](https://github.com/tailwindlabs/tailwindcss/pull/17906))
- Ensure that custom utilities applying other custom utilities don't swallow nested `@apply` rules ([#17925](https://github.com/tailwindlabs/tailwindcss/pull/17925))
- Download platform specific package if `optionalDependencies` are skipped ([#17929](https://github.com/tailwindlabs/tailwindcss/pull/17929))

## v4.1.5 (2025-04-30)

### Added

- Support using `@tailwindcss/upgrade` to upgrade between versions of v4.* ([#17717](https://github.com/tailwindlabs/tailwindcss/pull/17717))
- Add `h-lh` / `min-h-lh` / `max-h-lh` utilities ([#17790](https://github.com/tailwindlabs/tailwindcss/pull/17790))
- Transition `display`, `visibility`, `content-visibility`, `overlay`, and `pointer-events` when using `transition` to simplify `@starting-style` usage ([#17812](https://github.com/tailwindlabs/tailwindcss/pull/17812))

### Fixed

- Don't scan `.geojson` or `.db` files for classes by default ([#17700](https://github.com/tailwindlabs/tailwindcss/pull/17700), [#17711](https://github.com/tailwindlabs/tailwindcss/pull/17711))
- Hide default shadow suggestions when missing default shadow theme keys ([#17743](https://github.com/tailwindlabs/tailwindcss/pull/17743))
- Replace `_` with `.` in theme suggestions for `@utility` if surrounded by digits ([#17733](https://github.com/tailwindlabs/tailwindcss/pull/17733))
- Skip `color-mix(…)` when opacity is `100%` ([#17815](https://github.com/tailwindlabs/tailwindcss/pull/17815))
- PostCSS: Ensure that errors in imported stylesheets are recoverable ([#17754](https://github.com/tailwindlabs/tailwindcss/pull/17754))
- Upgrade: Bump all Tailwind CSS related dependencies during upgrade ([#17763](https://github.com/tailwindlabs/tailwindcss/pull/17763))
- Upgrade: Don't add `-` to variants starting with `@` ([#17814](https://github.com/tailwindlabs/tailwindcss/pull/17814))
- Upgrade: Don't format stylesheets that didn't change when upgrading ([#17824](https://github.com/tailwindlabs/tailwindcss/pull/17824))

## v4.1.4 (2025-04-14)

### Added

- Add experimental `@tailwindcss/oxide-wasm32-wasi` target for running Tailwind in browser environments like StackBlitz ([#17558](https://github.com/tailwindlabs/tailwindcss/pull/17558))

### Fixed

- Ensure `color-mix(…)` polyfills do not cause used CSS variables to be removed ([#17555](https://github.com/tailwindlabs/tailwindcss/pull/17555))
- Ensure `color-mix(…)` polyfills create fallbacks for theme variables that reference other theme variables ([#17562](https://github.com/tailwindlabs/tailwindcss/pull/17562))
- Fix brace expansion in declining ranges like `{10..0..5}` and `{0..10..-5}` ([#17591](https://github.com/tailwindlabs/tailwindcss/pull/17591))
- Work around a Chrome rendering bug when using the `skew-*` utilities ([#17627](https://github.com/tailwindlabs/tailwindcss/pull/17627))
- Ensure container query variant names can contain hyphens ([#17628](https://github.com/tailwindlabs/tailwindcss/pull/17628))
- Ensure `shadow-inherit`, `inset-shadow-inherit`, `drop-shadow-inherit`, and `text-shadow-inherit` inherit the shadow color ([#17647](https://github.com/tailwindlabs/tailwindcss/pull/17647))
- Ensure compatibility with array tuples used in `fontSize` JS theme keys ([#17630](https://github.com/tailwindlabs/tailwindcss/pull/17630))
- Ensure folders with binary file extensions in their names are scanned for utilities ([#17595](https://github.com/tailwindlabs/tailwindcss/pull/17595))
- Upgrade: Convert `fontSize` array tuple syntax to CSS theme variables ([#17630](https://github.com/tailwindlabs/tailwindcss/pull/17630))

## v4.1.3 (2025-04-04)

### Fixed

- Show warning when using unsupported bare value data type in `--value(…)` ([#17464](https://github.com/tailwindlabs/tailwindcss/pull/17464))
- PostCSS: Ensure changes to the input CSS file don't generate stale output when using Turbopack ([#17554](https://github.com/tailwindlabs/tailwindcss/pull/17554))
- Ensure classes are detected in Ruby's `%w` syntax in Slim templates ([#17557](https://github.com/tailwindlabs/tailwindcss/pull/17557))

## v4.1.2 (2025-04-03)

### Fixed

- Don't rely on the presence of `@layer base` to polyfill `@property` ([#17506](https://github.com/tailwindlabs/tailwindcss/pull/17506))
- Support setting multiple inset shadows as arbitrary values ([#17523](https://github.com/tailwindlabs/tailwindcss/pull/17523))
- Fix `drop-shadow-*` utilities that are defined with multiple shadows ([#17515](https://github.com/tailwindlabs/tailwindcss/pull/17515))
- PostCSS: Fix race condition when two changes are queued concurrently ([#17514](https://github.com/tailwindlabs/tailwindcss/pull/17514))
- PostCSS: Ensure files containing `@tailwind utilities` are processed ([#17514](https://github.com/tailwindlabs/tailwindcss/pull/17514))
- Ensure the `color-mix(…)` polyfill creates fallbacks even when using colors that cannot be statically analyzed ([#17513](https://github.com/tailwindlabs/tailwindcss/pull/17513))
- Fix slow incremental builds with `@tailwindcss/vite` and `@tailwindcss/postscss` (especially on Windows) ([#17511](https://github.com/tailwindlabs/tailwindcss/pull/17511))
- Vite: Fix missing CSS file in Qwik setups ([#17533](https://github.com/tailwindlabs/tailwindcss/pull/17533))

## v4.1.1 (2025-04-02)

### Fixed

- Disable padding in `@source inline(…)` brace expansion ([#17491](https://github.com/tailwindlabs/tailwindcss/pull/17491))
- Inject polyfills after `@import` and body-less `@layer` ([#17493](https://github.com/tailwindlabs/tailwindcss/pull/17493))
- Ensure `@tailwindcss/cli` does not contain an import for `jiti` ([#17502](https://github.com/tailwindlabs/tailwindcss/pull/17502))

## v4.1.0 (2025-04-01)

### Added

- Add `details-content` variant ([#15319](https://github.com/tailwindlabs/tailwindcss/pull/15319))
- Add `inverted-colors` variant ([#11693](https://github.com/tailwindlabs/tailwindcss/pull/11693))
- Add `noscript` variant ([#11929](https://github.com/tailwindlabs/tailwindcss/pull/11929), [#17431](https://github.com/tailwindlabs/tailwindcss/pull/17431))
- Add `items-baseline-last` and `self-baseline-last` utilities ([#13888](https://github.com/tailwindlabs/tailwindcss/pull/13888), [#17476](https://github.com/tailwindlabs/tailwindcss/pull/17476))
- Add `pointer-none`, `pointer-coarse`, and `pointer-fine` variants ([#16946](https://github.com/tailwindlabs/tailwindcss/pull/16946))
- Add `any-pointer-none`, `any-pointer-coarse`, and `any-pointer-fine` variants ([#16941](https://github.com/tailwindlabs/tailwindcss/pull/16941))
- Add safe alignment utilities ([#14607](https://github.com/tailwindlabs/tailwindcss/pull/14607))
- Add `user-valid` and `user-invalid` variants ([#12370](https://github.com/tailwindlabs/tailwindcss/pull/12370))
- Add `wrap-anywhere`, `wrap-break-word`, and `wrap-normal` utilities ([#12128](https://github.com/tailwindlabs/tailwindcss/pull/12128))
- Add `@source inline(…)` and `@source not inline(…)` ([#17147](https://github.com/tailwindlabs/tailwindcss/pull/17147))
- Add `@source not "…"` ([#17255](https://github.com/tailwindlabs/tailwindcss/pull/17255))
- Add `text-shadow-*` utilities ([#17389](https://github.com/tailwindlabs/tailwindcss/pull/17389))
- Add `mask-*` utilities ([#17134](https://github.com/tailwindlabs/tailwindcss/pull/17134))
- Add `bg-{position,size}-*` utilities for arbitrary values ([#17432](https://github.com/tailwindlabs/tailwindcss/pull/17432))
- Add `shadow-*/<alpha>`, `inset-shadow-*/<alpha>`, `drop-shadow-*/<alpha>`, and `text-shadow-*/<alpha>` utilities to control shadow opacity ([#17398](https://github.com/tailwindlabs/tailwindcss/pull/17398), [#17434](https://github.com/tailwindlabs/tailwindcss/pull/17434))
- Add `drop-shadow-<color>` utilities ([#17434](https://github.com/tailwindlabs/tailwindcss/pull/17434))
- Improve compatibility with older versions of Safari and Firefox ([#17435](https://github.com/tailwindlabs/tailwindcss/pull/17435))

### Fixed

- Follow symlinks when resolving `@source` directives ([#17391](https://github.com/tailwindlabs/tailwindcss/pull/17391))
- Don't scan ignored files for classes when changing an ignored file triggers a rebuild using `@tailwindcss/cli` ([#17255](https://github.com/tailwindlabs/tailwindcss/pull/17255))
- Support negated `content` rules in legacy JavaScript configuration ([#17255](https://github.com/tailwindlabs/tailwindcss/pull/17255))
- Interpret syntax like `@("@")md:…` as `@md:…` in Razor files ([#17427](https://github.com/tailwindlabs/tailwindcss/pull/17427))
- Disallow top-level braces, top-level semicolons, and unbalanced parentheses and brackets in arbitrary values ([#17361](https://github.com/tailwindlabs/tailwindcss/pull/17361))
- Ensure the `--theme(…)` function still resolves to the CSS variables when using legacy JS plugins ([#17458](https://github.com/tailwindlabs/tailwindcss/pull/17458))
- Detect used theme variables in CSS module files ([#17433](https://github.com/tailwindlabs/tailwindcss/pull/17433), [#17467](https://github.com/tailwindlabs/tailwindcss/pull/17467))

### Changed

- Ignore `node_modules` by default (can be overridden by `@source …` rules) ([#17255](https://github.com/tailwindlabs/tailwindcss/pull/17255))
- `@source` rules that include file extensions or point inside `node_modules/` folders no longer consider your `.gitignore` rules ([#17255](https://github.com/tailwindlabs/tailwindcss/pull/17255))
- Deprecate `bg-{left,right}-{top,bottom}` in favor of `bg-{top,bottom}-{left,right}` utilities ([#17378](https://github.com/tailwindlabs/tailwindcss/pull/17378))
- Deprecate `object-{left,right}-{top,bottom}` in favor of `object-{top,bottom}-{left,right}` utilities ([#17437](https://github.com/tailwindlabs/tailwindcss/pull/17437))

## v4.0.17 (2025-03-26)

### Fixed

- Fix an issue causing the CLI to hang when processing Ruby files ([#17383](https://github.com/tailwindlabs/tailwindcss/pull/17383))

## v4.0.16 (2025-03-25)

### Added

- Add support for literal values in `--value('…')` and `--modifier('…')` ([#17304](https://github.com/tailwindlabs/tailwindcss/pull/17304))

### Fixed

- Fix class extraction followed by `(` in Pug ([#17320](https://github.com/tailwindlabs/tailwindcss/pull/17320))
- Ensure `@keyframes` for theme animations are emitted if they are referenced following a comma ([#17352](https://github.com/tailwindlabs/tailwindcss/pull/17352))
- Vite: Ensure that updates to an imported CSS file are properly propagated after updating source files ([#17347](https://github.com/tailwindlabs/tailwindcss/pull/17347))
- Pre process `Slim` templates embedded in Ruby files ([#17336](https://github.com/tailwindlabs/tailwindcss/pull/17336))
- Error when input and output files resolve to the same file when using the CLI ([#17311](https://github.com/tailwindlabs/tailwindcss/pull/17311))
- Add missing suggestions when `--spacing(--value(integer, number))` is used ([#17308](https://github.com/tailwindlabs/tailwindcss/pull/17308))
- Add `::-webkit-details-marker` pseudo to `marker` variant ([#17362](https://github.com/tailwindlabs/tailwindcss/pull/17362))

## v4.0.15 (2025-03-20)

### Fixed

- Fix incorrect angle in `-bg-conic-*` utilities ([#17174](https://github.com/tailwindlabs/tailwindcss/pull/17174))
- Fix `border-[12px_4px]` being interpreted as a `border-color` instead of a `border-width` ([#17248](https://github.com/tailwindlabs/tailwindcss/pull/17248))
- Work around a crash in Safari 16.4 and 16.5 when using the default Preflight styles ([#17306](https://github.com/tailwindlabs/tailwindcss/pull/17306))
- Pre-process `<template lang="…">` in Vue files ([#17252](https://github.com/tailwindlabs/tailwindcss/pull/17252))
- Ensure that all CSS variables used by Preflight are prefixed ([#17036](https://github.com/tailwindlabs/tailwindcss/pull/17036))
- Prevent segfault when loaded in a worker thread on Linux ([#17276](https://github.com/tailwindlabs/tailwindcss/pull/17276))
- Ensure multiple `--value(…)` or `--modifier(…)` calls don't delete subsequent declarations ([#17273](https://github.com/tailwindlabs/tailwindcss/pull/17273))
- Fix class extraction followed by `(` in Slim ([#17278](https://github.com/tailwindlabs/tailwindcss/pull/17278))
- Export `PluginUtils` from `tailwindcss/plugin` for compatibility with v3 ([#17299](https://github.com/tailwindlabs/tailwindcss/pull/17299))
- Remove redundant `line-height: initial` from Preflight ([#15212](https://github.com/tailwindlabs/tailwindcss/pull/15212))
- Increase Standalone hardware compatibility on macOS x64 builds ([#17267](https://github.com/tailwindlabs/tailwindcss/pull/17267))
- Ensure that the CSS file rebuilds if a new CSS variable is used from templates ([#17301](https://github.com/tailwindlabs/tailwindcss/pull/17301))

### Changed

- The `--theme(…)` function now returns CSS variables from your theme variables unless used inside positions where CSS variables are invalid (e.g. inside `@media` queries) ([#17036](https://github.com/tailwindlabs/tailwindcss/pull/17036))

## v4.0.14 (2025-03-13)

### Fixed

- Do not extract candidates with JS string interpolation `${` ([#17142](https://github.com/tailwindlabs/tailwindcss/pull/17142))
- Fix extraction of variants containing `.` character ([#17153](https://github.com/tailwindlabs/tailwindcss/pull/17153))
- Fix extracting candidates in Clojure/ClojureScript ([#17087](https://github.com/tailwindlabs/tailwindcss/pull/17087))

## v4.0.13 (2025-03-11)

### Fixed

- Fix Haml pre-processing ([#17051](https://github.com/tailwindlabs/tailwindcss/pull/17051))
- Ensure `.node` and `.wasm` files are not scanned for utilities ([#17123](https://github.com/tailwindlabs/tailwindcss/pull/17123))
- Improve performance when scanning JSON files ([#17125](https://github.com/tailwindlabs/tailwindcss/pull/17125))
- Fix extracting candidates containing dots in Haml, Pug, and Slim pre processors ([#17094](https://github.com/tailwindlabs/tailwindcss/pull/17094), [#17085](https://github.com/tailwindlabs/tailwindcss/pull/17085), [#17113](https://github.com/tailwindlabs/tailwindcss/pull/17113))
- Don't create invalid CSS when encountering a link wrapped in square brackets ([#17129](https://github.com/tailwindlabs/tailwindcss/pull/17129))

## v4.0.12 (2025-03-07)

### Fixed

- Vite: Fix `url(…)` rebasing in transitively imported CSS files ([#16965](https://github.com/tailwindlabs/tailwindcss/pull/16965))
- PostCSS: Rebase `url(…)`s in imported CSS files ([#16965](https://github.com/tailwindlabs/tailwindcss/pull/16965))
- Ensure utilities are sorted based on their actual property order ([#16995](https://github.com/tailwindlabs/tailwindcss/pull/16995))
- Ensure strings in Pug and Slim templates are handled correctly ([#17000](https://github.com/tailwindlabs/tailwindcss/pull/17000))
- Ensure classes between `}` and `{` are properly extracted ([#17001](https://github.com/tailwindlabs/tailwindcss/pull/17001))
- Fix `razor`/`cshtml` pre-processing ([#17027](https://github.com/tailwindlabs/tailwindcss/pull/17027))
- Ensure extracting candidates from JS embedded in a PHP string works as expected ([#17031](https://github.com/tailwindlabs/tailwindcss/pull/17031))

## v4.0.11 (2025-03-06)

### Fixed

- Ensure classes containing `--` are extracted correctly ([#16972](https://github.com/tailwindlabs/tailwindcss/pull/16972))
- Ensure classes containing numbers followed by dash or underscore are extracted correctly ([#16980](https://github.com/tailwindlabs/tailwindcss/pull/16980))
- Ensure arbitrary container queries are extracted correctly ([#16984](https://github.com/tailwindlabs/tailwindcss/pull/16984))
- Ensure classes ending in `[` are extracted in Slim templating language ([#16985](https://github.com/tailwindlabs/tailwindcss/pull/16985))
- Ensure arbitrary variables with data types are extracted correctly ([#16986](https://github.com/tailwindlabs/tailwindcss/pull/16986))

## v4.0.10 (2025-03-05)

### Added

- Add `col-<number>` and `row-<number>` utilities for `grid-column` and `grid-row` ([#15183](https://github.com/tailwindlabs/tailwindcss/pull/15183))

### Fixed

- Ensure `not-*` does not remove `:is(…)` from variants ([#16825](https://github.com/tailwindlabs/tailwindcss/pull/16825))
- Ensure `@keyframes` are correctly emitted when using a prefix ([#16850](https://github.com/tailwindlabs/tailwindcss/pull/16850))
- Don't swallow `@utility` declarations when `@apply` is used in nested rules ([#16940](https://github.com/tailwindlabs/tailwindcss/pull/16940))
- Ensure `outline-hidden` behaves like `outline-none` outside of forced colors mode ([#16943](https://github.com/tailwindlabs/tailwindcss/pull/16943))
- Allow `!important` on CSS variables again ([#16873](https://github.com/tailwindlabs/tailwindcss/pull/16873))
- Vite: Do not crash when encountering an `.svg` file with `#` or `?` in the filename ([#16957](https://github.com/tailwindlabs/tailwindcss/pull/16957))
- Ensure utilities are properly detected within square brackets ([#16306](https://github.com/tailwindlabs/tailwindcss/pull/16306))
- Ensure utilities are properly detected using Angular's conditional class binding syntax ([#16306](https://github.com/tailwindlabs/tailwindcss/pull/16306))
- Ensure utilities starting with numbers are properly extracted from Slim templates ([#16306](https://github.com/tailwindlabs/tailwindcss/pull/16306))
- Discard arbitrary property candidates that have guaranteed-invalid property names ([#16306](https://github.com/tailwindlabs/tailwindcss/pull/16306))

### Changed

- Removed `max-w-auto` and `max-h-auto` utilities as they generate invalid CSS ([#16917](https://github.com/tailwindlabs/tailwindcss/pull/16917))
- Replaced the existing candidate extractor with a brand new extractor to improve maintainability, correctness, and performance ([#16306](https://github.com/tailwindlabs/tailwindcss/pull/16306))

## v4.0.9 (2025-02-25)

### Fixed

- Make JS APIs available to plugins and configs in the Standalone CLI ([#15934](https://github.com/tailwindlabs/tailwindcss/pull/15934))
- Vite: Don't crash when importing a virtual module from JavaScript that ends in `.css` ([#16780](https://github.com/tailwindlabs/tailwindcss/pull/16780))
- Fix an issue where `@reference "…"` would sometimes omit keyframe animations ([#16774](https://github.com/tailwindlabs/tailwindcss/pull/16774))
- Ensure `z-*!` utilities are properly marked as `!important` ([#16795](https://github.com/tailwindlabs/tailwindcss/pull/16795))
- Read UTF-8 CSS files that start with a byte-order mark (BOM) ([#16800](https://github.com/tailwindlabs/tailwindcss/pull/16800))
- Ensure nested functions in selectors used with JavaScript plugins are not truncated ([#16802](https://github.com/tailwindlabs/tailwindcss/pull/16802))

### Changed

- Emit variable fallbacks when using `@reference "…"` instead of duplicate CSS variable declarations ([#16774](https://github.com/tailwindlabs/tailwindcss/pull/16774))

## v4.0.8 (2025-02-21)

### Added

- Allow `@import` with `theme(…)` options for stylesheets that contain more than just `@theme` rules ([#16514](https://github.com/tailwindlabs/tailwindcss/pull/16514))

### Fixed

- Don't add `!important` to CSS variable declarations when using the important modifier ([#16668](https://github.com/tailwindlabs/tailwindcss/pull/16668))
- Vite: Ignore files and directories specified in your `.gitignore` file when using automatic source detection([#16631](https://github.com/tailwindlabs/tailwindcss/pull/16631))
- Vite: Don't rely on the module graph for detecting candidates to ensure setups with multiple Vite builds work as expected ([#16631](https://github.com/tailwindlabs/tailwindcss/pull/16631))
- Vite: Ensure Astro production builds always contain classes used in client-only components ([#16631](https://github.com/tailwindlabs/tailwindcss/pull/16631))
- Vite: Always scan raw file contents for utility classes before any other transforms have been applied to ensure utility classes are scanned without any additional escaping ([#16631](https://github.com/tailwindlabs/tailwindcss/pull/16631))
- Ensure utilities with more declarations are always sorted before utilities with fewer declarations when utilities only define CSS variables ([#16715](https://github.com/tailwindlabs/tailwindcss/pull/16715))
- Only include `translate-z-px` utilities once in compiled CSS ([#16718](https://github.com/tailwindlabs/tailwindcss/pull/16718))

### Changed

- Don't include theme variables that aren't used in compiled CSS ([#16211](https://github.com/tailwindlabs/tailwindcss/pull/16211), [#16676](https://github.com/tailwindlabs/tailwindcss/pull/16676))

## v4.0.7 (2025-02-18)

### Fixed

- Export `tailwindcss/lib/util/flattenColorPalette.js` for backward compatibility ([#16411](https://github.com/tailwindlabs/tailwindcss/pull/16411))
- Fix sorting of numeric utility suggestions when they have different magnitudes ([#16414](https://github.com/tailwindlabs/tailwindcss/pull/16414))
- Show suggestions for fractions in IntelliSense ([#16353](https://github.com/tailwindlabs/tailwindcss/pull/16353))
- Don’t replace `_` in suggested theme keys ([#16433](https://github.com/tailwindlabs/tailwindcss/pull/16433))
- Ensure `--default-outline-width` can be used to change the `outline-width` value of the `outline` utility ([#16469](https://github.com/tailwindlabs/tailwindcss/pull/16469))
- Ensure drop shadow utilities don't inherit unexpectedly ([#16471](https://github.com/tailwindlabs/tailwindcss/pull/16471))
- Export config and plugin types from `tailwindcss/plugin` for backward compatibility ([#16505](https://github.com/tailwindlabs/tailwindcss/pull/16505))
- Ensure JavaScript plugins that emit nested rules referencing the utility name work as expected ([#16539](https://github.com/tailwindlabs/tailwindcss/pull/16539))
- Statically link Visual Studio redistributables in `@tailwindcss/oxide` Windows builds ([#16602](https://github.com/tailwindlabs/tailwindcss/pull/16602))
- Ensure that Next.js splat routes are scanned for classes ([#16457](https://github.com/tailwindlabs/tailwindcss/pull/16457))
- Pin exact version of `tailwindcss` in `@tailwindcss/*` packages ([#16623](https://github.com/tailwindlabs/tailwindcss/pull/16623))
- Upgrade: Report errors when updating dependencies ([#16504](https://github.com/tailwindlabs/tailwindcss/pull/16504))
- Upgrade: Ensure a `darkMode` JS config setting with block syntax converts to use `@slot` ([#16507](https://github.com/tailwindlabs/tailwindcss/pull/16507))
- Upgrade: Ensure the latest version of `tailwindcss` and `@tailwindcss/postcss` are installed when upgrading ([#16620](https://github.com/tailwindlabs/tailwindcss/pull/16620))

## v4.0.6 (2025-02-10)

### Fixed

- Revert change to no longer include theme variables that aren't used in compiled CSS ([#16403](https://github.com/tailwindlabs/tailwindcss/pull/16403))

## v4.0.5 (2025-02-08)

### Added

- Add `@theme static` option for always including theme variables in compiled CSS ([#16211](https://github.com/tailwindlabs/tailwindcss/pull/16211))

### Fixed

- Remove rogue `console.log` from `@tailwindcss/vite` ([#16307](https://github.com/tailwindlabs/tailwindcss/pull/16307))

### Changed

- Don't include theme variables that aren't used in compiled CSS ([#16211](https://github.com/tailwindlabs/tailwindcss/pull/16211))

## v4.0.4 (2025-02-06)

### Fixed

- Fix a crash when setting JS theme values to `null` ([#16210](https://github.com/tailwindlabs/tailwindcss/pull/16210))
- Ensure escaped underscores in CSS variables in arbitrary values are properly unescaped ([#16206](https://github.com/tailwindlabs/tailwindcss/pull/16206))
- Ensure that the `containers` JS theme key is added to the `--container-*` namespace ([#16169](https://github.com/tailwindlabs/tailwindcss/pull/16169))
- Ensure theme `@keyframes` are generated even if an `--animation-*` variable spans multiple lines ([#16237](https://github.com/tailwindlabs/tailwindcss/pull/16237))
- Vite: Skip parsing stylesheets with the `?commonjs-proxy` flag ([#16238](https://github.com/tailwindlabs/tailwindcss/pull/16238))
- Fix `order-first` and `order-last` for Firefox ([#16266](https://github.com/tailwindlabs/tailwindcss/pull/16266))
- Fix support for older instruction sets on Linux x64 builds of the standalone CLI ([#16244](https://github.com/tailwindlabs/tailwindcss/pull/16244))
- Ensure `NODE_PATH` is respected when resolving JavaScript and CSS files ([#16274](https://github.com/tailwindlabs/tailwindcss/pull/16274))
- Ensure Node addons are packaged correctly with FreeBSD builds ([#16277](https://github.com/tailwindlabs/tailwindcss/pull/16277))
- Fix an issue where `@variant` inside a referenced stylesheet could cause a stack overflow ([#16300](https://github.com/tailwindlabs/tailwindcss/pull/16300))

## v4.0.3 (2025-02-01)

### Fixed

- Fix incorrect removal of `@import url();` ([#16144](https://github.com/tailwindlabs/tailwindcss/pull/16144))

## v4.0.2 (2025-01-31)

### Fixed

- Only generate positive `grid-cols-*` and `grid-rows-*` utilities ([#16020](https://github.com/tailwindlabs/tailwindcss/pull/16020))
- Ensure escaped theme variables are handled correctly ([#16064](https://github.com/tailwindlabs/tailwindcss/pull/16064))
- Ensure we process Tailwind CSS features when only using `@reference` or `@variant` ([#16057](https://github.com/tailwindlabs/tailwindcss/pull/16057))
- Refactor gradient implementation to work around [prettier/prettier#17058](https://github.com/prettier/prettier/issues/17058) ([#16072](https://github.com/tailwindlabs/tailwindcss/pull/16072))
- Vite: Ensure hot-reloading works with SolidStart setups ([#16052](https://github.com/tailwindlabs/tailwindcss/pull/16052))
- Vite: Fix a crash when starting the development server in SolidStart setups ([#16052](https://github.com/tailwindlabs/tailwindcss/pull/16052))
- Vite: Don't rebase URLs that appear to be aliases ([#16078](https://github.com/tailwindlabs/tailwindcss/pull/16078))
- Vite: Transform `<style>` blocks in HTML files ([#16069](https://github.com/tailwindlabs/tailwindcss/pull/16069))
- Prevent camel-casing CSS custom properties added by JavaScript plugins ([#16103](https://github.com/tailwindlabs/tailwindcss/pull/16103))
- Do not emit `@keyframes` in `@theme reference` ([#16120](https://github.com/tailwindlabs/tailwindcss/pull/16120))
- Discard invalid declarations when parsing CSS ([#16093](https://github.com/tailwindlabs/tailwindcss/pull/16093))
- Do not emit empty CSS rules and at-rules ([#16121](https://github.com/tailwindlabs/tailwindcss/pull/16121))
- Handle `@variant` when at the top-level of a stylesheet ([#16129](https://github.com/tailwindlabs/tailwindcss/pull/16129))

## v4.0.1 (2025-01-29)

### Added

- Include `:open` pseudo-class in existing `open` variant ([#15349](https://github.com/tailwindlabs/tailwindcss/pull/15349))

### Fixed

- Remove invalid `min-w/h-none` utilities ([#15845](https://github.com/tailwindlabs/tailwindcss/pull/15845))
- Discard CSS variable shorthand utilities that don't use valid CSS variables ([#15738](https://github.com/tailwindlabs/tailwindcss/pull/15738))
- Ensure font-size utilities with `none` modifier have a line-height set e.g. `text-sm/none` ([#15921](https://github.com/tailwindlabs/tailwindcss/pull/15921))
- Ensure font-size utilities with unknown modifier don't generate CSS ([#15921](https://github.com/tailwindlabs/tailwindcss/pull/15921))
- Don’t suggest font weight utilities more than once ([#15857](https://github.com/tailwindlabs/tailwindcss/pull/15857))
- Suggest container query variants ([#15857](https://github.com/tailwindlabs/tailwindcss/pull/15857))
- Disable bare value suggestions when not using the `--spacing` variable ([#15857](https://github.com/tailwindlabs/tailwindcss/pull/15857))
- Ensure suggested classes are properly sorted ([#15857](https://github.com/tailwindlabs/tailwindcss/pull/15857))
- Don’t look at .gitignore files outside initialized repos ([#15941](https://github.com/tailwindlabs/tailwindcss/pull/15941))
- Find utilities when using the Svelte class shorthand syntax across multiple lines ([#15974](https://github.com/tailwindlabs/tailwindcss/pull/15974))
- Find utilities when using the Angular class shorthand syntax ([#15974](https://github.com/tailwindlabs/tailwindcss/pull/15974))
- Find utilities when using functions inside arrays ([#15974](https://github.com/tailwindlabs/tailwindcss/pull/15974))
- Ensure that `@tailwindcss/browser` does not pollute the global namespace ([#15978](https://github.com/tailwindlabs/tailwindcss/pull/15978))
- Ensure that `tailwind-merge` is not scanned when using the Vite plugin ([#16005](https://github.com/tailwindlabs/tailwindcss/pull/16005))
- Ensure CSS theme variables are available within shadow roots ([#15975](https://github.com/tailwindlabs/tailwindcss/pull/15975))
- Fix crash when project lives in the `/` directory ([#15988](https://github.com/tailwindlabs/tailwindcss/pull/15988))
- Ensure custom variants have a non-empty selector list ([#16009](https://github.com/tailwindlabs/tailwindcss/pull/16009))
- _Upgrade_: Ensure JavaScript config files on different drives are correctly migrated ([#15927](https://github.com/tailwindlabs/tailwindcss/pull/15927))
- _Upgrade_: Migrate `leading-[1]` to `leading-none` ([#16004](https://github.com/tailwindlabs/tailwindcss/pull/16004))
- _Upgrade_: Do not migrate arbitrary leading utilities to bare values ([#16004](https://github.com/tailwindlabs/tailwindcss/pull/16004))

## v4.0.0 (2025-01-22)

[![](https://github.com/user-attachments/assets/cf527dc2-7e42-4884-9628-dbb27459d2aa)](https://tailwindcss.com/blog/tailwindcss-v4)

Holy shit it's actually done — we just tagged Tailwind CSS v4.0.

Tailwind CSS v4.0 is an all-new version of the framework optimized for performance and flexibility, with a reimagined configuration and customization experience, and taking full advantage of the latest advancements the web platform has to offer.

- [New high-performance engine](https://tailwindcss.com/blog/tailwindcss-v4#new-high-performance-engine) — where full builds are up to 5x faster, and incremental builds are over 100x faster — and measured in microseconds.
- [Designed for the modern web](https://tailwindcss.com/blog/tailwindcss-v4#designed-for-the-modern-web) — built on cutting-edge CSS features like cascade layers, registered custom properties with `@property`, and `color-mix()`.
- [Simplified installation](https://tailwindcss.com/blog/tailwindcss-v4#simplified-installation) — fewer dependencies, zero configuration, and just a single line of code in your CSS file.
- [First-party Vite plugin](https://tailwindcss.com/blog/tailwindcss-v4#first-party-vite-plugin) — tight integration for maximum performance and minimum configuration.
- [Automatic content detection](https://tailwindcss.com/blog/tailwindcss-v4#automatic-content-detection) — all of your template files are discovered automatically, with no configuration required.
- [Built-in import support](https://tailwindcss.com/blog/tailwindcss-v4#built-in-import-support) — no additional tooling necessary to bundle multiple CSS files.
- [CSS-first configuration](https://tailwindcss.com/blog/tailwindcss-v4#css-first-configuration) — a reimagined developer experience where you customize and extend the framework directly in CSS instead of a JavaScript configuration file.
- [CSS theme variables](https://tailwindcss.com/blog/tailwindcss-v4#css-theme-variables) — all of your design tokens exposed as native CSS variables so you can access them anywhere.
- [Dynamic utility values and variants](https://tailwindcss.com/blog/tailwindcss-v4#dynamic-utility-values-and-variants) — stop guessing what values exist in your spacing scale, or extending your configuration for things like basic data attributes.
- [Modernized P3 color palette](https://tailwindcss.com/blog/tailwindcss-v4#modernized-p3-color-palette) — a redesigned, more vivid color palette that takes full advantage of modern display technology.
- [Container queries](https://tailwindcss.com/blog/tailwindcss-v4#container-queries) — first-class APIs for styling elements based on their container size, no plugins required.
- [New 3D transform utilities](https://tailwindcss.com/blog/tailwindcss-v4#new-3d-transform-utilities) — transform elements in 3D space directly in your HTML.
- [Expanded gradient APIs](https://tailwindcss.com/blog/tailwindcss-v4#expanded-gradient-apis) — radial and conic gradients, interpolation modes, and more.
- [@starting-style support](https://tailwindcss.com/blog/tailwindcss-v4#starting-style-support) — a new variant you can use to create enter and exit transitions, without the need for JavaScript.
- [not-* variant](https://tailwindcss.com/blog/tailwindcss-v4#not-variant) — style an element only when it doesn't match another variant, custom selector, or media or feature query.
- [Even more new utilities and variants](https://tailwindcss.com/blog/tailwindcss-v4#even-more-new-utilities-and-variants) — including support for `color-scheme`, `field-sizing`, complex shadows, `inert`, and more.

Start using Tailwind CSS v4.0 today by [installing it in a new project](https://tailwindcss.com/docs/installation/), or playing with it directly in the browser on [Tailwind Play](https://play.tailwindcss.com/).

For existing projects, we've published a comprehensive [upgrade guide](https://tailwindcss.com/docs/upgrade-guide) and built an [automated upgrade tool](https://tailwindcss.com/docs/upgrade-guide#using-the-upgrade-tool) to get you on the latest version as quickly and painlessly as possible.

For a deep-dive into everything that's new, [check out the announcement post](https://tailwindcss.com/blog/tailwindcss-v4).

## v4.0.0-beta.10 (2025-01-21) canary

### Added

- Add support for using `@variant` to use variants in your CSS ([#15663](https://github.com/tailwindlabs/tailwindcss/pull/15663))
- Include `outline-color` when transitioning colors ([#15690](https://github.com/tailwindlabs/tailwindcss/pull/15690))

### Fixed

- Add missing `main` and `browser` fields for `@tailwindcss/browser` ([#15594](https://github.com/tailwindlabs/tailwindcss/pull/15594))
- Support escaping `*` in theme namespace syntax (e.g.: `--color-\*: initial;`) ([#15603](https://github.com/tailwindlabs/tailwindcss/pull/15603))
- Respect `@theme` options when resolving values in custom functional utilities ([#15623](https://github.com/tailwindlabs/tailwindcss/pull/15623))
- Discard invalid variants (e.g. `data-checked-[selected=1]:*`) ([#15629](https://github.com/tailwindlabs/tailwindcss/pull/15629))
- Ensure `-outline-offset-*` utilities are suggested in IntelliSense ([#15646](https://github.com/tailwindlabs/tailwindcss/pull/15646))
- Write to `stdout` when `--output` is set to `-` or omitted with `@tailwindcss/cli` ([#15656](https://github.com/tailwindlabs/tailwindcss/pull/15656))
- Prevent `not-*` from being used with variants that have multiple sibling rules ([#15689](https://github.com/tailwindlabs/tailwindcss/pull/15689))
- _Upgrade (experimental)_: Pretty print `--spacing(…)` to prevent ambiguity ([#15596](https://github.com/tailwindlabs/tailwindcss/pull/15596))

### Changed

- Use more modern `--alpha(color / 50%)` syntax instead of `--alpha(color, 50%)` ([#15665](https://github.com/tailwindlabs/tailwindcss/pull/15665))
- Rename `@variant` to `@custom-variant` ([#15663](https://github.com/tailwindlabs/tailwindcss/pull/15663))
- Change `outline-hidden` to set `outline-style: none` except in forced colors mode ([#15690](https://github.com/tailwindlabs/tailwindcss/pull/15690))

## v4.0.0-beta.9 (2025-01-09) canary

### Added

- Add `@tailwindcss/browser` package to run Tailwind CSS in the browser ([#15558](https://github.com/tailwindlabs/tailwindcss/pull/15558))
- Add `@reference "…"` API as a replacement for the previous `@import "…" reference` option ([#15565](https://github.com/tailwindlabs/tailwindcss/pull/15565))
- Add support for defining functional utilities in CSS ([#15455](https://github.com/tailwindlabs/tailwindcss/pull/15455))
- Add new `--spacing(…)`, `--alpha(…)`, and `--theme(…)` CSS functions ([#15572](https://github.com/tailwindlabs/tailwindcss/pull/15572))
- Add musl-based Linux builds of the standalone CLI ([#15567](https://github.com/tailwindlabs/tailwindcss/pull/15567))
- Improve performance of internal AST manipulations ([#15529](https://github.com/tailwindlabs/tailwindcss/pull/15529))

### Fixed

- Use the correct property value for `place-content-between`, `place-content-around`, and `place-content-evenly` utilities ([#15440](https://github.com/tailwindlabs/tailwindcss/pull/15440))
- Don’t detect arbitrary properties when preceded by an escape ([#15456](https://github.com/tailwindlabs/tailwindcss/pull/15456))
- Fix incorrectly named `bg-round` and `bg-space` utilities to `bg-repeat-round` to `bg-repeat-space` ([#15462](https://github.com/tailwindlabs/tailwindcss/pull/15462))
- Fix `inset-shadow-*` suggestions in IntelliSense ([#15471](https://github.com/tailwindlabs/tailwindcss/pull/15471))
- Only compile arbitrary values ending in `]` ([#15503](https://github.com/tailwindlabs/tailwindcss/pull/15503))
- Ensure `@apply` rules are processed in the correct order ([#15542](https://github.com/tailwindlabs/tailwindcss/pull/15542))
- Allow negative utility names in `@utility` ([#15573](https://github.com/tailwindlabs/tailwindcss/pull/15573))
- Remove all `@keyframes` contributed by JavaScript plugins when using `@reference` imports ([#15581](https://github.com/tailwindlabs/tailwindcss/pull/15581))
- _Upgrade (experimental)_: Do not extract class names from functions (e.g. `shadow` in `filter: 'drop-shadow(…)'`) ([#15566](https://github.com/tailwindlabs/tailwindcss/pull/15566))
- _Upgrade (experimental)_: Migrate `theme(spacing.2)` to `--spacing(2)` ([#15579](https://github.com/tailwindlabs/tailwindcss/pull/15579))
- _Upgrade (experimental)_: Migrate `theme(…)` to `--theme(…)` ([#15579](https://github.com/tailwindlabs/tailwindcss/pull/15579))

### Changed

- Remove `--container-prose` in favor of a deprecated `--max-width-prose` theme variable so that `*-prose` is only available for max-width utilities and only for backward compatibility ([#15439](https://github.com/tailwindlabs/tailwindcss/pull/15439))
- Use Vite post-processor APIs for processing Svelte `<style>` blocks ([#15436](https://github.com/tailwindlabs/tailwindcss/pull/15436))

## v4.0.0-beta.8 (2024-12-17) canary

### Fixed

- Ensure `Symbol.dispose` and `Symbol.asyncDispose` are polyfilled ([#15404](https://github.com/tailwindlabs/tailwindcss/pull/15404))

## v3.4.17 (2024-12-17)

### Fixed

- Work around Node v22.12+ issue ([#15421](https://github.com/tailwindlabs/tailwindcss/pull/15421))

## v4.0.0-beta.7 (2024-12-17) canary

### Added

- Export `tailwindcss/lib/util/flattenColorPalette` for backward compatibility ([#15318](https://github.com/tailwindlabs/tailwindcss/pull/15318))
- Improve debug logs to get better insights ([#15303](https://github.com/tailwindlabs/tailwindcss/pull/15303))

### Fixed

- Fix dependency related warnings when using `@tailwindcss/postcss` on Windows ([#15321](https://github.com/tailwindlabs/tailwindcss/pull/15321))
- Skip creating a compiler for CSS files that should not be processed ([#15340](https://github.com/tailwindlabs/tailwindcss/pull/15340))
- Fix missing `shadow-none` suggestion in IntelliSense ([#15342](https://github.com/tailwindlabs/tailwindcss/pull/15342))
- Optimize AST before printing for IntelliSense ([#15347](https://github.com/tailwindlabs/tailwindcss/pull/15347))
- Generate vendor prefixes for Chrome 111+ (e.g. `-webkit-background-clip: text`) ([#15389](https://github.com/tailwindlabs/tailwindcss/pull/15389))

### Changed

- Rename `--aspect-ratio-*` theme key to `--aspect-*` ([#15365](https://github.com/tailwindlabs/tailwindcss/pull/15365))
- Derive `aspect-video` utility from theme ([#15365](https://github.com/tailwindlabs/tailwindcss/pull/15365))

## v4.0.0-beta.6 (2024-12-06) canary

### Fixed

- Ensure `@import "…" reference` never generates utilities ([#15307](https://github.com/tailwindlabs/tailwindcss/pull/15307))

## v4.0.0-beta.5 (2024-12-04) canary

### Added

- Parallelize parsing of individual source files ([#15270](https://github.com/tailwindlabs/tailwindcss/pull/15270))
- Add new `@import "…" reference` option for importing Tailwind CSS configuration details into another CSS entry point without duplicating CSS ([#15228](https://github.com/tailwindlabs/tailwindcss/pull/15228))
- Improve performance of `@tailwindcss/postcss` by translating between internal data structures and PostCSS nodes directly without additional parsing or stringification ([#15297](https://github.com/tailwindlabs/tailwindcss/pull/15297))

### Fixed

- Ensure absolute URLs inside imported CSS files are not rebased when using `@tailwindcss/vite` ([#15275](https://github.com/tailwindlabs/tailwindcss/pull/15275))
- Fix issues with dev servers using Svelte 5 with `@tailwindcss/vite` ([#15274](https://github.com/tailwindlabs/tailwindcss/issues/15274))
- Support installing `@tailwindcss/vite` in Vite 6 projects ([#15274](https://github.com/tailwindlabs/tailwindcss/issues/15274))
- Fix resolution of imported CSS files in SSR builds with `@tailwindcss/vite` ([#15279](https://github.com/tailwindlabs/tailwindcss/issues/15279))
- Ensure other plugins can run after `@tailwindcss/postcss` ([#15273](https://github.com/tailwindlabs/tailwindcss/pull/15273))
- Rebase URLs inside imported CSS files when using Vite with the `@tailwindcss/postcss` extension ([#15273](https://github.com/tailwindlabs/tailwindcss/pull/15273))
- Fix missing font family suggestions in IntelliSense ([#15288](https://github.com/tailwindlabs/tailwindcss/pull/15288))
- Fix missing `@container` suggestion in IntelliSense ([#15288](https://github.com/tailwindlabs/tailwindcss/pull/15288))

## v3.4.16 (2024-12-03)

### Fixed

- Ensure the TypeScript types for `PluginsConfig` allow `undefined` values ([#14668](https://github.com/tailwindlabs/tailwindcss/pull/14668))

# Changed

- Bumped lilconfig to v3.x ([#15289](https://github.com/tailwindlabs/tailwindcss/pull/15289))

## v4.0.0-beta.4 (2024-11-29) canary

### Fixed

- Don't scan source files for utilities unless `@tailwind utilities` is present in the CSS in `@tailwindcss/postcss` and `@tailwindcss/vite` ([#15226](https://github.com/tailwindlabs/tailwindcss/pull/15226))
- Skip reserializing CSS files that don't use Tailwind features in `@tailwindcss/postcss` and `@tailwindcss/vite` ([#15226](https://github.com/tailwindlabs/tailwindcss/pull/15226))
- _Upgrade (experimental)_: Do not migrate the `overflow-clip` utility ([#15244](https://github.com/tailwindlabs/tailwindcss/pull/15244))
- _Upgrade (experimental)_: Rename `backdrop-blur` to `backdrop-blur-sm` and `backdrop-blur-sm` to `backdrop-blur-xs` ([#15242](https://github.com/tailwindlabs/tailwindcss/pull/15242))

## v4.0.0-beta.3 (2024-11-27) canary

### Fixed

- Ensure any necessary vendor prefixes are generated for iOS Safari, Firefox, and Chrome ([#15166](https://github.com/tailwindlabs/tailwindcss/pull/15166))
- Ensure `.group` and `.peer` are prefixed when using the `prefix(…)` option ([#15174](https://github.com/tailwindlabs/tailwindcss/pull/15174))
- Ensure 3D transforms render correctly in Safari ([#15179](https://github.com/tailwindlabs/tailwindcss/pull/15179))
- Ensure `--spacing-*` variables take precedence over `--container-*` variables ([#15180](https://github.com/tailwindlabs/tailwindcss/pull/15180))
- Fix scanning classes delimited by tab characters ([#15169](https://github.com/tailwindlabs/tailwindcss/pull/15169))
- Ensure opacity modifiers and semi-transparent gradients render correctly by default in Safari ([#15201](https://github.com/tailwindlabs/tailwindcss/pull/15201))
- Fix element size thrashing when transitioning gradients on elements with a defined font-size in Safari ([#15216](https://github.com/tailwindlabs/tailwindcss/pull/15216))
- Ensure `translate-*` utilities work with arbitrary values that use `calc(…)` ([#15215](https://github.com/tailwindlabs/tailwindcss/pull/15215))
- Ensure gradient stop position utilities work with arbitrary values that use `calc(…)` ([#15215](https://github.com/tailwindlabs/tailwindcss/pull/15215))
- Ensure Node addons are packaged correctly with Windows ARM builds ([#15171](https://github.com/tailwindlabs/tailwindcss/pull/15171))
- Ensure the Vite plugin resolves CSS and JS files according to the configured resolver conditions ([#15173])(https://github.com/tailwindlabs/tailwindcss/pull/15173)
- _Upgrade (experimental)_: Migrate prefixes for `.group` and `.peer` classes ([#15208](https://github.com/tailwindlabs/tailwindcss/pull/15208))

### Changed

- Interpolate gradients using OKLAB instead of OKLCH by default ([#15201](https://github.com/tailwindlabs/tailwindcss/pull/15201))
- Error when `layer(…)` in `@import` is not first in the list of functions/conditions ([#15109](https://github.com/tailwindlabs/tailwindcss/pull/15109))
- Use unitless line-height values for font-size variables in default theme ([#15216](https://github.com/tailwindlabs/tailwindcss/pull/15216))
- Don't register custom properties with explicit types unless those custom properties need to be animateable ([#15215](https://github.com/tailwindlabs/tailwindcss/pull/15215))
