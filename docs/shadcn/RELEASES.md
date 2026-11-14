# Releases shadcn-ui/ui (60 dernières)

## shadcn@4.23.0 (2026-10-27)

### Minor Changes

- [#12296](https://github.com/shadcn-ui/ui/pull/12296) [`15f59b4`](https://github.com/shadcn-ui/ui/commit/15f59b41750542ef5d41ee34601a85a4e7c1be17) Thanks [@mattzcarey](https://github.com/mattzcarey)! - Upgrade the MCP server to MCP TypeScript SDK v2 (`@modelcontextprotocol/server`). `shadcn mcp` now serves MCP protocol 2026-07-28 as well as earlier versions. The `shadcn/mcp` export is now an `McpServer`, and a new `createServer()` export returns a fresh instance per connection. Code that called `server.setRequestHandler(...)` on the old `Server` export should use `server.registerTool(...)` or `server.server.setRequestHandler(...)` instead.

## shadcn@4.22.2 (2026-10-27)

### Patch Changes

- [#12479](https://github.com/shadcn-ui/ui/pull/12479) [`8f04138`](https://github.com/shadcn-ui/ui/commit/8f04138777c1b6996e709993362a7b0a12888ecf) Thanks [@dependabot](https://github.com/apps/dependabot)! - Update `undici` to 7.30.1.

- Updated dependencies [[`8f04138`](https://github.com/shadcn-ui/ui/commit/8f04138777c1b6996e709993362a7b0a12888ecf)]:
  - @shadcn/registry@0.2.1

## @shadcn/registry@0.2.1 (2026-10-27)

### Patch Changes

- [#12479](https://github.com/shadcn-ui/ui/pull/12479) [`8f04138`](https://github.com/shadcn-ui/ui/commit/8f04138777c1b6996e709993362a7b0a12888ecf) Thanks [@dependabot](https://github.com/apps/dependabot)! - Update `undici` to 7.30.1.

## shadcn@4.22.1 (2026-10-18)

### Patch Changes

- [#12360](https://github.com/shadcn-ui/ui/pull/12360) [`4381eeb`](https://github.com/shadcn-ui/ui/commit/4381eeb3fe421af7d25b780f85ff9cbc8d50c51a) Thanks [@shadcn](https://github.com/shadcn)! - Fix `shadcn add --all` and the component picker to only include components available for the project's style.

## shadcn@4.22.0 (2026-10-16)

### Minor Changes

- [#12298](https://github.com/shadcn-ui/ui/pull/12298) [`954ce95`](https://github.com/shadcn-ui/ui/commit/954ce953412867a57b7e067c076fa7fd395ea115) Thanks [@shadcn](https://github.com/shadcn)! - Upgrade to Zod 4. `shadcn/schema` and `@shadcn/registry/schema` now export Zod 4 schemas, so passing them to Zod 3's `z` no longer typechecks. On Zod 3, use the exported types (`RegistryItem`, `RegistryItemFile`, `Config`) and the schema's own methods (`registryItemSchema.array()`) instead of `z.infer` and `z.array`. Zod errors expose `issues`, not `errors`. Validation messages now use Zod 4's wording.

### Patch Changes

- Updated dependencies [[`954ce95`](https://github.com/shadcn-ui/ui/commit/954ce953412867a57b7e067c076fa7fd395ea115)]:
  - @shadcn/registry@0.2.0

## @shadcn/registry@0.2.0 (2026-10-16)

### Minor Changes

- [#12298](https://github.com/shadcn-ui/ui/pull/12298) [`954ce95`](https://github.com/shadcn-ui/ui/commit/954ce953412867a57b7e067c076fa7fd395ea115) Thanks [@shadcn](https://github.com/shadcn)! - Upgrade to Zod 4. `shadcn/schema` and `@shadcn/registry/schema` now export Zod 4 schemas, so passing them to Zod 3's `z` no longer typechecks. On Zod 3, use the exported types (`RegistryItem`, `RegistryItemFile`, `Config`) and the schema's own methods (`registryItemSchema.array()`) instead of `z.infer` and `z.array`. Zod errors expose `issues`, not `errors`. Validation messages now use Zod 4's wording.

## @shadcn/helpers@0.3.0 (2026-10-16)

### Minor Changes

- [#12307](https://github.com/shadcn-ui/ui/pull/12307) [`4233ed1`](https://github.com/shadcn-ui/ui/commit/4233ed1caded8c38f4bc14b14afe1f93ebcaf966) Thanks [@shadcn](https://github.com/shadcn)! - Add `{ preliminary: true }` to the tool handle's `output()` to stream preliminary tool output.

## shadcn@4.21.5 (2026-10-14)

### Patch Changes

- [#12214](https://github.com/shadcn-ui/ui/pull/12214) [`4407349`](https://github.com/shadcn-ui/ui/commit/440734966e04a1e429bb8df8a29d7095a5e4a60f) Thanks [@dependabot](https://github.com/apps/dependabot)! - Update `@modelcontextprotocol/sdk`, `browserslist`, `open` and `postcss-selector-parser`.

- [#12192](https://github.com/shadcn-ui/ui/pull/12192) [`dd34945`](https://github.com/shadcn-ui/ui/commit/dd34945272729ecd198fabb0e32082f6321c210e) Thanks [@shadcn](https://github.com/shadcn)! - Move @shadcn/registry modules out of utils.

- [#12297](https://github.com/shadcn-ui/ui/pull/12297) [`7aa2110`](https://github.com/shadcn-ui/ui/commit/7aa2110d4ae0910429093c2240948c916d18dd7f) Thanks [@mattzcarey](https://github.com/mattzcarey)! - Fix MCP search and list results showing `[object Promise]` instead of the add command.

- [#12174](https://github.com/shadcn-ui/ui/pull/12174) [`2af71ac`](https://github.com/shadcn-ui/ui/commit/2af71ac3188a89e42027bca3817daf128cbce7c2) Thanks [@dependabot](https://github.com/apps/dependabot)! - Update `@modelcontextprotocol/sdk` to 1.31.0.

- [#12048](https://github.com/shadcn-ui/ui/pull/12048) [`cfb4cb6`](https://github.com/shadcn-ui/ui/commit/cfb4cb6fce835cda9342fae1592b21ece48ce23d) Thanks [@dependabot](https://github.com/apps/dependabot)! - Update `undici` to 7.29.1.

- Updated dependencies [[`97ddbf4`](https://github.com/shadcn-ui/ui/commit/97ddbf4274ed09d02aa7fd34375f2cf1e48cbbf0), [`dd34945`](https://github.com/shadcn-ui/ui/commit/dd34945272729ecd198fabb0e32082f6321c210e), [`cfb4cb6`](https://github.com/shadcn-ui/ui/commit/cfb4cb6fce835cda9342fae1592b21ece48ce23d)]:
  - @shadcn/registry@0.1.4

## @shadcn/registry@0.1.4 (2026-10-14)

### Patch Changes

- [#12195](https://github.com/shadcn-ui/ui/pull/12195) [`97ddbf4`](https://github.com/shadcn-ui/ui/commit/97ddbf4274ed09d02aa7fd34375f2cf1e48cbbf0) Thanks [@shadcn](https://github.com/shadcn)! - Remove narrating comments and no-op guards from @shadcn/registry.

- [#12192](https://github.com/shadcn-ui/ui/pull/12192) [`dd34945`](https://github.com/shadcn-ui/ui/commit/dd34945272729ecd198fabb0e32082f6321c210e) Thanks [@shadcn](https://github.com/shadcn)! - Move @shadcn/registry modules out of utils.

- [#12048](https://github.com/shadcn-ui/ui/pull/12048) [`cfb4cb6`](https://github.com/shadcn-ui/ui/commit/cfb4cb6fce835cda9342fae1592b21ece48ce23d) Thanks [@dependabot](https://github.com/apps/dependabot)! - Update `undici` to 7.29.1.

## shadcn@4.21.4 (2026-10-07)

### Patch Changes

- [#12189](https://github.com/shadcn-ui/ui/pull/12189) [`76fd499595ba7cc01f49d159bd7ac82d7aca8e63`](https://github.com/shadcn-ui/ui/commit/76fd499595ba7cc01f49d159bd7ac82d7aca8e63) Thanks [@shadcn](https://github.com/shadcn)! - Drop the ts-morph dependency from @shadcn/registry.

- [#12184](https://github.com/shadcn-ui/ui/pull/12184) [`995c2cfff44c373bd210d451089726ec097ab917`](https://github.com/shadcn-ui/ui/commit/995c2cfff44c373bd210d451089726ec097ab917) Thanks [@shadcn](https://github.com/shadcn)! - Run the icons and asChild transformers without ts-morph.

- [#12160](https://github.com/shadcn-ui/ui/pull/12160) [`6efecd8fe9aa167886fe2cc0c05c5623a5bb5670`](https://github.com/shadcn-ui/ui/commit/6efecd8fe9aa167886fe2cc0c05c5623a5bb5670) Thanks [@shadcn](https://github.com/shadcn)! - Edit the Next.js layout for font items without ts-morph, and skip it with a warning instead of writing a broken layout.

- [#12188](https://github.com/shadcn-ui/ui/pull/12188) [`efa11781f756c86debb0392fbea4fe468250b41b`](https://github.com/shadcn-ui/ui/commit/efa11781f756c86debb0392fbea4fe468250b41b) Thanks [@shadcn](https://github.com/shadcn)! - Rewrite imports and crawl file imports without ts-morph.

- [#12177](https://github.com/shadcn-ui/ui/pull/12177) [`e8c3143b1cd191280befcd6c9538284bb43399a8`](https://github.com/shadcn-ui/ui/commit/e8c3143b1cd191280befcd6c9538284bb43399a8) Thanks [@shadcn](https://github.com/shadcn)! - Edit tailwind.config without ts-morph, and skip it with a warning instead of writing a broken config.

- [#12183](https://github.com/shadcn-ui/ui/pull/12183) [`f56bbd7282f0116a925a601cb6d7e0c3fede448b`](https://github.com/shadcn-ui/ui/commit/f56bbd7282f0116a925a601cb6d7e0c3fede448b) Thanks [@shadcn](https://github.com/shadcn)! - Run the rsc, import, CSS variable, cleanup, font and menu transformers without ts-morph.

- [#12185](https://github.com/shadcn-ui/ui/pull/12185) [`4a90344c42dc9ae47494179065219377ff5f2a8f`](https://github.com/shadcn-ui/ui/commit/4a90344c42dc9ae47494179065219377ff5f2a8f) Thanks [@shadcn](https://github.com/shadcn)! - Run the Tailwind prefix and RTL transformers without ts-morph.

- Updated dependencies [[`76fd499595ba7cc01f49d159bd7ac82d7aca8e63`](https://github.com/shadcn-ui/ui/commit/76fd499595ba7cc01f49d159bd7ac82d7aca8e63), [`995c2cfff44c373bd210d451089726ec097ab917`](https://github.com/shadcn-ui/ui/commit/995c2cfff44c373bd210d451089726ec097ab917), [`6efecd8fe9aa167886fe2cc0c05c5623a5bb5670`](https://github.com/shadcn-ui/ui/commit/6efecd8fe9aa167886fe2cc0c05c5623a5bb5670), [`232d7e2c128d94d37a6dae74e3b0e1a8f08ff6e4`](https://github.com/shadcn-ui/ui/commit/232d7e2c128d94d37a6dae74e3b0e1a8f08ff6e4), [`efa11781f756c86debb0392fbea4fe468250b41b`](https://github.com/shadcn-ui/ui/commit/efa11781f756c86debb0392fbea4fe468250b41b), [`e8c3143b1cd191280befcd6c9538284bb43399a8`](https://github.com/shadcn-ui/ui/commit/e8c3143b1cd191280befcd6c9538284bb43399a8), [`f56bbd7282f0116a925a601cb6d7e0c3fede448b`](https://github.com/shadcn-ui/ui/commit/f56bbd7282f0116a925a601cb6d7e0c3fede448b), [`4a90344c42dc9ae47494179065219377ff5f2a8f`](https://github.com/shadcn-ui/ui/commit/4a90344c42dc9ae47494179065219377ff5f2a8f)]:
  - @shadcn/registry@0.1.3

## @shadcn/registry@0.1.3 (2026-10-07)

### Patch Changes

- [#12189](https://github.com/shadcn-ui/ui/pull/12189) [`76fd499595ba7cc01f49d159bd7ac82d7aca8e63`](https://github.com/shadcn-ui/ui/commit/76fd499595ba7cc01f49d159bd7ac82d7aca8e63) Thanks [@shadcn](https://github.com/shadcn)! - Drop the ts-morph dependency from @shadcn/registry.

- [#12184](https://github.com/shadcn-ui/ui/pull/12184) [`995c2cfff44c373bd210d451089726ec097ab917`](https://github.com/shadcn-ui/ui/commit/995c2cfff44c373bd210d451089726ec097ab917) Thanks [@shadcn](https://github.com/shadcn)! - Run the icons and asChild transformers without ts-morph.

- [#12160](https://github.com/shadcn-ui/ui/pull/12160) [`6efecd8fe9aa167886fe2cc0c05c5623a5bb5670`](https://github.com/shadcn-ui/ui/commit/6efecd8fe9aa167886fe2cc0c05c5623a5bb5670) Thanks [@shadcn](https://github.com/shadcn)! - Edit the Next.js layout for font items without ts-morph, and skip it with a warning instead of writing a broken layout.

- [#12146](https://github.com/shadcn-ui/ui/pull/12146) [`232d7e2c128d94d37a6dae74e3b0e1a8f08ff6e4`](https://github.com/shadcn-ui/ui/commit/232d7e2c128d94d37a6dae74e3b0e1a8f08ff6e4) Thanks [@shadcn](https://github.com/shadcn)! - Load ts-morph only for `addRegistryItems`, so the read-only API bundles about 6 MB smaller.

- [#12188](https://github.com/shadcn-ui/ui/pull/12188) [`efa11781f756c86debb0392fbea4fe468250b41b`](https://github.com/shadcn-ui/ui/commit/efa11781f756c86debb0392fbea4fe468250b41b) Thanks [@shadcn](https://github.com/shadcn)! - Rewrite imports and crawl file imports without ts-morph.

- [#12177](https://github.com/shadcn-ui/ui/pull/12177) [`e8c3143b1cd191280befcd6c9538284bb43399a8`](https://github.com/shadcn-ui/ui/commit/e8c3143b1cd191280befcd6c9538284bb43399a8) Thanks [@shadcn](https://github.com/shadcn)! - Edit tailwind.config without ts-morph, and skip it with a warning instead of writing a broken config.

- [#12183](https://github.com/shadcn-ui/ui/pull/12183) [`f56bbd7282f0116a925a601cb6d7e0c3fede448b`](https://github.com/shadcn-ui/ui/commit/f56bbd7282f0116a925a601cb6d7e0c3fede448b) Thanks [@shadcn](https://github.com/shadcn)! - Run the rsc, import, CSS variable, cleanup, font and menu transformers without ts-morph.

- [#12185](https://github.com/shadcn-ui/ui/pull/12185) [`4a90344c42dc9ae47494179065219377ff5f2a8f`](https://github.com/shadcn-ui/ui/commit/4a90344c42dc9ae47494179065219377ff5f2a8f) Thanks [@shadcn](https://github.com/shadcn)! - Run the Tailwind prefix and RTL transformers without ts-morph.

## shadcn@4.21.3 (2026-10-06)

### Patch Changes

- [#12148](https://github.com/shadcn-ui/ui/pull/12148) [`596be8dda8f94927281184b8c4575150531f85ea`](https://github.com/shadcn-ui/ui/commit/596be8dda8f94927281184b8c4575150531f85ea) Thanks [@shadcn](https://github.com/shadcn)! - Fix `ERR_REQUIRE_CYCLE_MODULE` when running the CLI with `pnpm dlx` on Windows.

- Updated dependencies [[`596be8dda8f94927281184b8c4575150531f85ea`](https://github.com/shadcn-ui/ui/commit/596be8dda8f94927281184b8c4575150531f85ea)]:
  - @shadcn/registry@0.1.2

## @shadcn/registry@0.1.2 (2026-10-06)

### Patch Changes

- [#12148](https://github.com/shadcn-ui/ui/pull/12148) [`596be8dda8f94927281184b8c4575150531f85ea`](https://github.com/shadcn-ui/ui/commit/596be8dda8f94927281184b8c4575150531f85ea) Thanks [@shadcn](https://github.com/shadcn)! - Fix `ERR_REQUIRE_CYCLE_MODULE` when running the CLI with `pnpm dlx` on Windows.

## shadcn@4.21.2 (2026-10-05)

### Patch Changes

- [#12143](https://github.com/shadcn-ui/ui/pull/12143) [`8c2bf3882cb856ac10abbb162bdc0b8383ebd432`](https://github.com/shadcn-ui/ui/commit/8c2bf3882cb856ac10abbb162bdc0b8383ebd432) Thanks [@shadcn](https://github.com/shadcn)! - Accept `components.json` and `package.json` files that start with a UTF-8 byte order mark.

- [#12142](https://github.com/shadcn-ui/ui/pull/12142) [`95efb5cd8d7f13adba70b58b1119211e8980683f`](https://github.com/shadcn-ui/ui/commit/95efb5cd8d7f13adba70b58b1119211e8980683f) Thanks [@shadcn](https://github.com/shadcn)! - replace cosmiconfig with a smaller custom reader.

- [#12140](https://github.com/shadcn-ui/ui/pull/12140) [`3b1ae6e43f082dd82d0e5710b813cfad929abdb4`](https://github.com/shadcn-ui/ui/commit/3b1ae6e43f082dd82d0e5710b813cfad929abdb4) Thanks [@shadcn](https://github.com/shadcn)! - Skip `npm audit` and the funding check when installing or removing dependencies, or creating a project, with npm.

- Updated dependencies [[`8c2bf3882cb856ac10abbb162bdc0b8383ebd432`](https://github.com/shadcn-ui/ui/commit/8c2bf3882cb856ac10abbb162bdc0b8383ebd432), [`95efb5cd8d7f13adba70b58b1119211e8980683f`](https://github.com/shadcn-ui/ui/commit/95efb5cd8d7f13adba70b58b1119211e8980683f), [`3b1ae6e43f082dd82d0e5710b813cfad929abdb4`](https://github.com/shadcn-ui/ui/commit/3b1ae6e43f082dd82d0e5710b813cfad929abdb4)]:
  - @shadcn/registry@0.1.1

## @shadcn/registry@0.1.1 (2026-10-05)

### Patch Changes

- [#12143](https://github.com/shadcn-ui/ui/pull/12143) [`8c2bf3882cb856ac10abbb162bdc0b8383ebd432`](https://github.com/shadcn-ui/ui/commit/8c2bf3882cb856ac10abbb162bdc0b8383ebd432) Thanks [@shadcn](https://github.com/shadcn)! - Accept `components.json` and `package.json` files that start with a UTF-8 byte order mark.

- [#12142](https://github.com/shadcn-ui/ui/pull/12142) [`95efb5cd8d7f13adba70b58b1119211e8980683f`](https://github.com/shadcn-ui/ui/commit/95efb5cd8d7f13adba70b58b1119211e8980683f) Thanks [@shadcn](https://github.com/shadcn)! - replace cosmiconfig with a smaller custom reader.

- [#12140](https://github.com/shadcn-ui/ui/pull/12140) [`3b1ae6e43f082dd82d0e5710b813cfad929abdb4`](https://github.com/shadcn-ui/ui/commit/3b1ae6e43f082dd82d0e5710b813cfad929abdb4) Thanks [@shadcn](https://github.com/shadcn)! - Skip `npm audit` and the funding check when installing or removing dependencies, or creating a project, with npm.

## shadcn@4.21.1 (2026-10-01)

### Patch Changes

- [#12087](https://github.com/shadcn-ui/ui/pull/12087) [`bf6646b449684e687f28531305eca4e4768c2782`](https://github.com/shadcn-ui/ui/commit/bf6646b449684e687f28531305eca4e4768c2782) Thanks [@shadcn](https://github.com/shadcn)! - Add `@shadcn/registry`, the registry engine behind the CLI. `shadcn` now depends on it, and `shadcn/registry` and `shadcn/schema` re-export it, so there are no changes for existing users.

- [#12061](https://github.com/shadcn-ui/ui/pull/12061) [`a9c1da49ec4eab488dc99c69ae20a7ffaa4897d4`](https://github.com/shadcn-ui/ui/commit/a9c1da49ec4eab488dc99c69ae20a7ffaa4897d4) Thanks [@shadcn](https://github.com/shadcn)! - fix shimmer reduced motion handling when used with a variant

- [#12087](https://github.com/shadcn-ui/ui/pull/12087) [`bf6646b449684e687f28531305eca4e4768c2782`](https://github.com/shadcn-ui/ui/commit/bf6646b449684e687f28531305eca4e4768c2782) Thanks [@shadcn](https://github.com/shadcn)! - `shadcn docs` only rewrites links on the ui.shadcn.com host.

- Updated dependencies [[`bf6646b449684e687f28531305eca4e4768c2782`](https://github.com/shadcn-ui/ui/commit/bf6646b449684e687f28531305eca4e4768c2782)]:
  - @shadcn/registry@0.1.0

## @shadcn/registry@0.1.0 (2026-10-01)

### Minor Changes

- [#12087](https://github.com/shadcn-ui/ui/pull/12087) [`bf6646b449684e687f28531305eca4e4768c2782`](https://github.com/shadcn-ui/ui/commit/bf6646b449684e687f28531305eca4e4768c2782) Thanks [@shadcn](https://github.com/shadcn)! - Add `@shadcn/registry`, the registry engine behind the CLI. `shadcn` now depends on it, and `shadcn/registry` and `shadcn/schema` re-export it, so there are no changes for existing users.

## shadcn@4.21.0 (2026-09-04)

### Minor Changes

- [#11758](https://github.com/shadcn-ui/ui/pull/11758) [`c257f688cf4de7ec10cc1be84cad29cd4631182c`](https://github.com/shadcn-ui/ui/commit/c257f688cf4de7ec10cc1be84cad29cd4631182c) Thanks [@shadcn](https://github.com/shadcn)! - install `cn` and generate `export { cn } from "cn"` for `lib/utils` on init. Registry components now import `cn` from the `cn` package.

### Patch Changes

- [`8720dec73f5aebed9f649ea58636f54599fdedf1`](https://github.com/shadcn-ui/ui/commit/8720dec73f5aebed9f649ea58636f54599fdedf1) Thanks [@shadcn](https://github.com/shadcn)! - use `twMerge` from `cn` instead of `tailwind-merge` internally.

## shadcn@4.20.1 (2026-09-02)

### Patch Changes

- [#11742](https://github.com/shadcn-ui/ui/pull/11742) [`04bb134c52af23af7d77673618ef4e3862b7c310`](https://github.com/shadcn-ui/ui/commit/04bb134c52af23af7d77673618ef4e3862b7c310) Thanks [@shadcn](https://github.com/shadcn)! - preserve leading comments when running `shadcn migrate cn`.

## shadcn@4.20.0 (2026-09-02)

### Minor Changes

- [#11728](https://github.com/shadcn-ui/ui/pull/11728) [`51f3e12203b0026ea106cafb4f770bda9abead87`](https://github.com/shadcn-ui/ui/commit/51f3e12203b0026ea106cafb4f770bda9abead87) Thanks [@shadcn](https://github.com/shadcn)! - add `npx shadcn migrate cn` to replace `clsx`, `tailwind-merge` and `cnfast` in Tailwind CSS v4 projects.

## shadcn@4.19.1 (2026-08-31)

### Patch Changes

- [#11713](https://github.com/shadcn-ui/ui/pull/11713) [`f9ea1e600ea5dd7b1b79769b7b25cafa400cee6f`](https://github.com/shadcn-ui/ui/commit/f9ea1e600ea5dd7b1b79769b7b25cafa400cee6f) Thanks [@shadcn](https://github.com/shadcn)! - Add the official shadcn/ui website to the package metadata.

## @shadcn/react@0.3.1 (2026-08-31)

### Patch Changes

- [#11720](https://github.com/shadcn-ui/ui/pull/11720) [`503a3a57aec9a3817e37f90aa0817b1fabd284d0`](https://github.com/shadcn-ui/ui/commit/503a3a57aec9a3817e37f90aa0817b1fabd284d0) Thanks [@shadcn](https://github.com/shadcn)! - Set `data-pending-scroll` on the MessageScroller root and viewport until `defaultScrollPosition` (`"end"` or `"last-anchor"`) is applied, so the viewport can be hidden and a server-rendered transcript does not flash the top of the thread on reload.

## shadcn@4.19.0 (2026-08-21)

### Minor Changes

- [#11582](https://github.com/shadcn-ui/ui/pull/11582) [`33c81f991f1013653444d6819107b2b356563f57`](https://github.com/shadcn-ui/ui/commit/33c81f991f1013653444d6819107b2b356563f57) Thanks [@shadcn](https://github.com/shadcn)! - add private repository support to GitHub registries via GitHub CLI credentials or GH_TOKEN.

- [#11248](https://github.com/shadcn-ui/ui/pull/11248) [`b4f2023b1d5c733db67d4e90eb9485a95c5ed480`](https://github.com/shadcn-ui/ui/commit/b4f2023b1d5c733db67d4e90eb9485a95c5ed480) Thanks [@rbadillap](https://github.com/rbadillap)! - add `npx shadcn migrate base-color` to switch a project's base color.

## shadcn@4.18.0 (2026-08-13)

### Minor Changes

- [#11501](https://github.com/shadcn-ui/ui/pull/11501) [`aef1cdca54e8da689351cdddf959342909e45e76`](https://github.com/shadcn-ui/ui/commit/aef1cdca54e8da689351cdddf959342909e45e76) Thanks [@shadcn](https://github.com/shadcn)! - merge registries from package.json and components.json, and support adding registries to package.json when components.json is not present

### Patch Changes

- [#11500](https://github.com/shadcn-ui/ui/pull/11500) [`e66b99b14dd9c54afc434dbf5a702f170b1153b0`](https://github.com/shadcn-ui/ui/commit/e66b99b14dd9c54afc434dbf5a702f170b1153b0) Thanks [@shadcn](https://github.com/shadcn)! - Skip unreadable directories during file scans instead of failing with `EACCES`.

- [#11504](https://github.com/shadcn-ui/ui/pull/11504) [`9f4e3ff26025d16a243ea03cc891c734c4cf0b59`](https://github.com/shadcn-ui/ui/commit/9f4e3ff26025d16a243ea03cc891c734c4cf0b59) Thanks [@shadcn](https://github.com/shadcn)! - Skip unreadable directories when resolving monorepo targets.

- [#11502](https://github.com/shadcn-ui/ui/pull/11502) [`87d71b3629c34f3c38a353a211ec8591c1ff1721`](https://github.com/shadcn-ui/ui/commit/87d71b3629c34f3c38a353a211ec8591c1ff1721) Thanks [@shadcn](https://github.com/shadcn)! - resolve registries declared in package.json when adding components. `shadcn add`, `search`, `view` and `init` now resolve registries from package.json in memory without persisting them to components.json

- [#9248](https://github.com/shadcn-ui/ui/pull/9248) [`03c45b822e60195796dfd3d2fcf7c223ff4ece86`](https://github.com/shadcn-ui/ui/commit/03c45b822e60195796dfd3d2fcf7c223ff4ece86) Thanks [@Grafikart](https://github.com/Grafikart)! - Fix shadcn for projects with unreadable permission files

## shadcn@4.17.0 (2026-08-11)

### Minor Changes

- [#10453](https://github.com/shadcn-ui/ui/pull/10453) [`deda4df80fb350230b2fce2b575e769a90cae076`](https://github.com/shadcn-ui/ui/commit/deda4df80fb350230b2fce2b575e769a90cae076) Thanks [@nbouvrette](https://github.com/nbouvrette)! - Add SOCKS4/SOCKS5 proxy support to the registry HTTP stack via `ALL_PROXY=socks5://...` (the curl convention), backed by the `socks` package.

  Proxy selection now goes through a `createProxyDispatcher(env)` factory that checks `ALL_PROXY` / `all_proxy` for a `socks*://` URL before falling back to the existing HTTP/HTTPS handling. `ALL_PROXY` with a non-SOCKS scheme is ignored here — `HTTP_PROXY` / `HTTPS_PROXY` remain the way to configure those. Existing `HTTPS_PROXY` / `HTTP_PROXY` / `NO_PROXY` handling via `undici.EnvHttpProxyAgent` is unchanged.

## @shadcn/helpers@0.2.0 (2026-08-11)

### Minor Changes

- [#11484](https://github.com/shadcn-ui/ui/pull/11484) [`401d10b8180b17eb1fdd36d537abaa8aeb68708f`](https://github.com/shadcn-ui/ui/commit/401d10b8180b17eb1fdd36d537abaa8aeb68708f) Thanks [@shadcn](https://github.com/shadcn)! - Add human-in-the-loop mocking for the AI SDK.

- [#11484](https://github.com/shadcn-ui/ui/pull/11484) [`401d10b8180b17eb1fdd36d537abaa8aeb68708f`](https://github.com/shadcn-ui/ui/commit/401d10b8180b17eb1fdd36d537abaa8aeb68708f) Thanks [@shadcn](https://github.com/shadcn)! - Make `createChat` generic over the UI message type, like `useChat`.

## shadcn@4.16.2 (2026-08-06)

### Patch Changes

- [#11348](https://github.com/shadcn-ui/ui/pull/11348) [`df664e1bba86c6712bc5e08c8626590dca736089`](https://github.com/shadcn-ui/ui/commit/df664e1bba86c6712bc5e08c8626590dca736089) Thanks [@OwenKephart](https://github.com/OwenKephart)! - Include registry item titles in `searchRegistries` results and fuzzy matching.

## @shadcn/react@0.3.0 (2026-08-05)

### Minor Changes

- [#11414](https://github.com/shadcn-ui/ui/pull/11414) [`3e54530e31020e2277df03490a30a08e3bc1792b`](https://github.com/shadcn-ui/ui/commit/3e54530e31020e2277df03490a30a08e3bc1792b) Thanks [@shadcn](https://github.com/shadcn)! - Add the Questionnaire primitive for multi-step questions, freeform answers, validation, and keyboard navigation.

## shadcn@4.16.1 (2026-07-31)

### Patch Changes

- [#11322](https://github.com/shadcn-ui/ui/pull/11322) [`bfa1b5e9a69a155b2f590523d50fda810bde1a9a`](https://github.com/shadcn-ui/ui/commit/bfa1b5e9a69a155b2f590523d50fda810bde1a9a) Thanks [@AndrewBarba](https://github.com/AndrewBarba)! - fix `shadcn build` failing with ENOENT when registry item names contain path segments (e.g. `extension/foo`) by creating nested output directories before writing

- [#11352](https://github.com/shadcn-ui/ui/pull/11352) [`5ca53ca7c7dea390e0e78091ff7c54adc48c773a`](https://github.com/shadcn-ui/ui/commit/5ca53ca7c7dea390e0e78091ff7c54adc48c773a) Thanks [@shadcn](https://github.com/shadcn)! - forward search params to registries for server-side dynamic search

## shadcn@4.16.0 (2026-07-27)

### Minor Changes

- [#11307](https://github.com/shadcn-ui/ui/pull/11307) [`431da7169cae753643e67e56e168b93ec31dfe90`](https://github.com/shadcn-ui/ui/commit/431da7169cae753643e67e56e168b93ec31dfe90) Thanks [@shadcn](https://github.com/shadcn)! - make addRegistryItems accept explicit registry configuration instead of loading components.json

- [#11304](https://github.com/shadcn-ui/ui/pull/11304) [`bf906bb8aeebc64d374afb54497b822d587ac6d7`](https://github.com/shadcn-ui/ui/commit/bf906bb8aeebc64d374afb54497b822d587ac6d7) Thanks [@shadcn](https://github.com/shadcn)! - add getRegistriesConfig and registries in package.json support

## shadcn@4.15.0 (2026-07-25)

### Minor Changes

- [#11276](https://github.com/shadcn-ui/ui/pull/11276) [`7d90dfc0a5ec70cdc3bd08b741a42440041907ac`](https://github.com/shadcn-ui/ui/commit/7d90dfc0a5ec70cdc3bd08b741a42440041907ac) Thanks [@cmpadden](https://github.com/cmpadden)! - Add a public `addRegistryItems` API for installing registry items programmatically without invoking the CLI.

## shadcn@4.14.1 (2026-07-23)

### Patch Changes

- [#11266](https://github.com/shadcn-ui/ui/pull/11266) [`6cd3f4c65c361ab6554e06a77e6a0af9cf8b6e37`](https://github.com/shadcn-ui/ui/commit/6cd3f4c65c361ab6554e06a77e6a0af9cf8b6e37) Thanks [@shadcn](https://github.com/shadcn)! - Add Base UI Toast support.

## shadcn@4.14.0 (2026-07-22)

### Minor Changes

- [#11241](https://github.com/shadcn-ui/ui/pull/11241) [`3c26ee2dbd3a772c1cddc2c76249cc1cb0a250d5`](https://github.com/shadcn-ui/ui/commit/3c26ee2dbd3a772c1cddc2c76249cc1cb0a250d5) Thanks [@shadcn](https://github.com/shadcn)! - add support for icon migration

## shadcn@4.13.1 (2026-07-17)

### Patch Changes

- [#11196](https://github.com/shadcn-ui/ui/pull/11196) [`c49c3061b5b86b130736d36bf20008349f89b416`](https://github.com/shadcn-ui/ui/commit/c49c3061b5b86b130736d36bf20008349f89b416) Thanks [@shadcn](https://github.com/shadcn)! - Drop custom registry headers on cross-origin redirects to prevent credential leakage.

- [#11191](https://github.com/shadcn-ui/ui/pull/11191) [`df2656111fc8ca030eb768ade2da26cef2fd11b5`](https://github.com/shadcn-ui/ui/commit/df2656111fc8ca030eb768ade2da26cef2fd11b5) Thanks [@shadcn](https://github.com/shadcn)! - Validate file paths for registry items without an explicit target to prevent path traversal.

- [#11195](https://github.com/shadcn-ui/ui/pull/11195) [`b8a8e9209659fa810514b61c60ad593bc81973f9`](https://github.com/shadcn-ui/ui/commit/b8a8e9209659fa810514b61c60ad593bc81973f9) Thanks [@shadcn](https://github.com/shadcn)! - Prevent flag injection from registry-supplied dependency strings during install.

- [#11208](https://github.com/shadcn-ui/ui/pull/11208) [`2b89d67e19ceda27381477e127b349f9aaa25355`](https://github.com/shadcn-ui/ui/commit/2b89d67e19ceda27381477e127b349f9aaa25355) Thanks [@shadcn](https://github.com/shadcn)! - Add React Aria support.

## @shadcn/react@0.2.1 (2026-07-08)

### Patch Changes

- [#11106](https://github.com/shadcn-ui/ui/pull/11106) [`f6a26478547c7057aeda82516666dc3473dc39bd`](https://github.com/shadcn-ui/ui/commit/f6a26478547c7057aeda82516666dc3473dc39bd) Thanks [@shadcn](https://github.com/shadcn)! - Fix MessageScroller autoScroll around anchored turns: the anchor hold now hands off to follow-output once the streamed reply fills the viewport, content growth outrunning the frame-coalesced resize handler no longer releases follow-output, and the scroll button no longer flickers while follow-output closes the gap a streamed chunk just opened.

- [#11100](https://github.com/shadcn-ui/ui/pull/11100) [`dd6ce77cf1606eee2839368a97cc35417f763232`](https://github.com/shadcn-ui/ui/commit/dd6ce77cf1606eee2839368a97cc35417f763232) Thanks [@shadcn](https://github.com/shadcn)! - Fix MessageScroller abandoning a newly appended scrollAnchor placement when autoScroll is enabled, so the anchored turn holds at the reading line while the reply streams.

- [#11085](https://github.com/shadcn-ui/ui/pull/11085) [`628e427231ca4bb7f586a69f99fe7809749a53e2`](https://github.com/shadcn-ui/ui/commit/628e427231ca4bb7f586a69f99fe7809749a53e2) Thanks [@devnomic](https://github.com/devnomic)! - Fix MessageScroller firing "ResizeObserver loop completed with undelivered notifications" during streamed content growth by coalescing ResizeObserver callbacks into requestAnimationFrame.

## shadcn@4.13.0 (2026-07-03)

### Minor Changes

- [#11082](https://github.com/shadcn-ui/ui/pull/11082) [`f3e7de11752b087b1c4bf61f4035a866f3a4f9ed`](https://github.com/shadcn-ui/ui/commit/f3e7de11752b087b1c4bf61f4035a866f3a4f9ed) Thanks [@shadcn](https://github.com/shadcn)! - base-ui is now default

## @shadcn/react@0.2.0 (2026-06-30)

### Minor Changes

- [#11022](https://github.com/shadcn-ui/ui/pull/11022) [`18fcf0f766857a7249cc0daac3c1609610edd158`](https://github.com/shadcn-ui/ui/commit/18fcf0f766857a7249cc0daac3c1609610edd158) Thanks [@shadcn](https://github.com/shadcn)! - initial release of @shadcn/react

## shadcn@4.12.0 (2026-06-26)

### Minor Changes

- [#11022](https://github.com/shadcn-ui/ui/pull/11022) [`18fcf0f766857a7249cc0daac3c1609610edd158`](https://github.com/shadcn-ui/ui/commit/18fcf0f766857a7249cc0daac3c1609610edd158) Thanks [@shadcn](https://github.com/shadcn)! - add scroll-fade and shimmer utilities

## shadcn@4.11.1 (2026-06-26)

### Patch Changes

- [#10905](https://github.com/shadcn-ui/ui/pull/10905) [`9197676b3d09b77f51b17b63e5978db29e498ca4`](https://github.com/shadcn-ui/ui/commit/9197676b3d09b77f51b17b63e5978db29e498ca4) Thanks [@shadcn](https://github.com/shadcn)! - replace node-fetch with native fetch

- [#10967](https://github.com/shadcn-ui/ui/pull/10967) [`365d53b590a6ddb79c1487a9dbeabcde5f4ac37f`](https://github.com/shadcn-ui/ui/commit/365d53b590a6ddb79c1487a9dbeabcde5f4ac37f) Thanks [@shadcn](https://github.com/shadcn)! - Preserve existing dependency specifiers in package.json when running `shadcn add`.

## shadcn@4.11.0 (2026-06-08)

### Minor Changes

- [#10886](https://github.com/shadcn-ui/ui/pull/10886) [`05eb2b968bdc769ad78df9628dc2260e1dec903c`](https://github.com/shadcn-ui/ui/commit/05eb2b968bdc769ad78df9628dc2260e1dec903c) Thanks [@shadcn](https://github.com/shadcn)! - improve search command

### Patch Changes

- [#10851](https://github.com/shadcn-ui/ui/pull/10851) [`7dfd933102fdb881f8abd24fc1ef11a669682b94`](https://github.com/shadcn-ui/ui/commit/7dfd933102fdb881f8abd24fc1ef11a669682b94) Thanks [@harshithasompura](https://github.com/harshithasompura)! - move msw to devDependencies

## shadcn@4.10.0 (2026-06-01)

### Minor Changes

- [#10842](https://github.com/shadcn-ui/ui/pull/10842) [`7c63c467361dee9e20631b2999040912439b35d4`](https://github.com/shadcn-ui/ui/commit/7c63c467361dee9e20631b2999040912439b35d4) Thanks [@shadcn](https://github.com/shadcn)! - add support for GitHub registries. See the [docs](https://ui.shadcn.com/docs/registry/github).

## shadcn@4.9.0 (2026-05-31)

### Minor Changes

- [#10834](https://github.com/shadcn-ui/ui/pull/10834) [`8e2d2d1439f54260aa0c51747261c220334ec641`](https://github.com/shadcn-ui/ui/commit/8e2d2d1439f54260aa0c51747261c220334ec641) Thanks [@shadcn](https://github.com/shadcn)! - add npx shadcn eject

## shadcn@4.8.3 (2026-05-29)

### Patch Changes

- [#10659](https://github.com/shadcn-ui/ui/pull/10659) [`07900769d91b09def00e68179bcb7a821f59b954`](https://github.com/shadcn-ui/ui/commit/07900769d91b09def00e68179bcb7a821f59b954) Thanks [@raashish1601](https://github.com/raashish1601)! - update template handling

- [#10495](https://github.com/shadcn-ui/ui/pull/10495) [`360e8a19c3ee13ac78b656027462007c8bdaa6d5`](https://github.com/shadcn-ui/ui/commit/360e8a19c3ee13ac78b656027462007c8bdaa6d5) Thanks [@artemxknpv](https://github.com/artemxknpv)! - Preserve quotes in className literals when applying RTL transforms.

## shadcn@4.8.2 (2026-05-27)

### Patch Changes

- [#10786](https://github.com/shadcn-ui/ui/pull/10786) [`55ea86f2525e63c2d0373754314f0e31212572d2`](https://github.com/shadcn-ui/ui/commit/55ea86f2525e63c2d0373754314f0e31212572d2) Thanks [@shadcn](https://github.com/shadcn)! - Update template handling.

## shadcn@4.8.1 (2026-05-26)

### Patch Changes

- [#10779](https://github.com/shadcn-ui/ui/pull/10779) [`df1752dfe092957f84aa467d2270436139e3ecc7`](https://github.com/shadcn-ui/ui/commit/df1752dfe092957f84aa467d2270436139e3ecc7) Thanks [@shadcn](https://github.com/shadcn)! - add style rhea

## shadcn@4.8.0 (2026-05-21)

### Minor Changes

- [#10715](https://github.com/shadcn-ui/ui/pull/10715) [`51e3cfaf32faeff2589e5c74d81ffd109f509e93`](https://github.com/shadcn-ui/ui/commit/51e3cfaf32faeff2589e5c74d81ffd109f509e93) Thanks [@shadcn](https://github.com/shadcn)! - add shadcn registry validate command

- [#10708](https://github.com/shadcn-ui/ui/pull/10708) [`c8ab3801ecf97c0350ac0234a25e61f19ccaba62`](https://github.com/shadcn-ui/ui/commit/c8ab3801ecf97c0350ac0234a25e61f19ccaba62) Thanks [@shadcn](https://github.com/shadcn)! - add include to registry.json

### Patch Changes

- [#10567](https://github.com/shadcn-ui/ui/pull/10567) [`1c4a53a37adeba36dbd5c07980c5bb6d295cea9e`](https://github.com/shadcn-ui/ui/commit/1c4a53a37adeba36dbd5c07980c5bb6d295cea9e) Thanks [@shadcn](https://github.com/shadcn)! - fix failing version derivation test

## shadcn@4.7.0 (2026-05-05)

### Minor Changes

- [#10519](https://github.com/shadcn-ui/ui/pull/10519) [`eb42ae25fda81e90e621f1e334e5126b1f22371d`](https://github.com/shadcn-ui/ui/commit/eb42ae25fda81e90e621f1e334e5126b1f22371d) Thanks [@shadcn](https://github.com/shadcn)! - add support for package imports

- [#10528](https://github.com/shadcn-ui/ui/pull/10528) [`309d95017fce3936548c15d2ef827c84560cc45a`](https://github.com/shadcn-ui/ui/commit/309d95017fce3936548c15d2ef827c84560cc45a) Thanks [@shadcn](https://github.com/shadcn)! - allow alias placeholders in target for registry items

### Patch Changes

- [#10559](https://github.com/shadcn-ui/ui/pull/10559) [`28b3e5f36086677b0533583817407d8f936a567b`](https://github.com/shadcn-ui/ui/commit/28b3e5f36086677b0533583817407d8f936a567b) Thanks [@shadcn](https://github.com/shadcn)! - add previous version error suggestion

## shadcn@4.6.0 (2026-04-28)

### Minor Changes

- [#10530](https://github.com/shadcn-ui/ui/pull/10530) [`ea6086cbcc33b359bb876651374e26f643ea85b1`](https://github.com/shadcn-ui/ui/commit/ea6086cbcc33b359bb876651374e26f643ea85b1) Thanks [@shadcn](https://github.com/shadcn)! - add shadcn preset commands

- [#10516](https://github.com/shadcn-ui/ui/pull/10516) [`c236d0c009b4ff87c77a04c618d2b348cac7cdcb`](https://github.com/shadcn-ui/ui/commit/c236d0c009b4ff87c77a04c618d2b348cac7cdcb) Thanks [@shadcn](https://github.com/shadcn)! - add preset info to npx shadcn info

### Patch Changes

- [#10526](https://github.com/shadcn-ui/ui/pull/10526) [`55fd4dc71be9e6410a528d6ce6bc7287ffba262c`](https://github.com/shadcn-ui/ui/commit/55fd4dc71be9e6410a528d6ce6bc7287ffba262c) Thanks [@shadcn](https://github.com/shadcn)! - update docs and info urls

- [#10524](https://github.com/shadcn-ui/ui/pull/10524) [`6dea65ebcbbdb8773b3072ca74c9cee4e386988b`](https://github.com/shadcn-ui/ui/commit/6dea65ebcbbdb8773b3072ca74c9cee4e386988b) Thanks [@shadcn](https://github.com/shadcn)! - fix apply in monorepo

## shadcn@4.5.0 (2026-04-25)

### Minor Changes

- [#10488](https://github.com/shadcn-ui/ui/pull/10488) [`eb6e783fb3861aba3b35289a473954080e6f1607`](https://github.com/shadcn-ui/ui/commit/eb6e783fb3861aba3b35289a473954080e6f1607) Thanks [@shadcn](https://github.com/shadcn)! - add --pointer option to cli.

  npx shadcn init --pointer will enable cursor: pointer on buttons.

## shadcn@4.4.0 (2026-04-21)

### Minor Changes

- [#10451](https://github.com/shadcn-ui/ui/pull/10451) [`e456fed9d3f0b7aacf7084aecc02a75e8fde622d`](https://github.com/shadcn-ui/ui/commit/e456fed9d3f0b7aacf7084aecc02a75e8fde622d) Thanks [@shadcn](https://github.com/shadcn)! - add apply --only

### Patch Changes

- [`9c572ab778b5a0ab42693eb07bc4a75d0c24603e`](https://github.com/shadcn-ui/ui/commit/9c572ab778b5a0ab42693eb07bc4a75d0c24603e) Thanks [@shadcn](https://github.com/shadcn)! - fix chartColor in presets

## shadcn@4.3.1 (2026-04-20)

### Patch Changes

- [#10436](https://github.com/shadcn-ui/ui/pull/10436) [`b7cfc364aca36bc90f8efa86773bc81011502036`](https://github.com/shadcn-ui/ui/commit/b7cfc364aca36bc90f8efa86773bc81011502036) Thanks [@shadcn](https://github.com/shadcn)! - Ensure `init` only runs template post-init hooks for newly created projects.

- [#10179](https://github.com/shadcn-ui/ui/pull/10179) [`d00605c5fb5fe3cfbcb68cea65398430cdd819f8`](https://github.com/shadcn-ui/ui/commit/d00605c5fb5fe3cfbcb68cea65398430cdd819f8) Thanks [@EthanThatOneKid](https://github.com/EthanThatOneKid)! - Send `Accept: application/vnd.shadcn.v1+json, application/json;q=0.9` and `User-Agent: shadcn` on registry fetches so servers using HTTP content negotiation can reliably serve JSON to the CLI. Fixes #10164.

## shadcn@4.3.0 (2026-04-16)

### Minor Changes

- [#10416](https://github.com/shadcn-ui/ui/pull/10416) [`101741046813622d48c081dfc19c40d0aa76484b`](https://github.com/shadcn-ui/ui/commit/101741046813622d48c081dfc19c40d0aa76484b) Thanks [@shadcn](https://github.com/shadcn)! - add style sera

## shadcn@4.2.0 (2026-04-07)

### Minor Changes

- [#10313](https://github.com/shadcn-ui/ui/pull/10313) [`c1e29824cd7a6809448e45b6b7fe8f7be71ecb0f`](https://github.com/shadcn-ui/ui/commit/c1e29824cd7a6809448e45b6b7fe8f7be71ecb0f) Thanks [@shadcn](https://github.com/shadcn)! - add shadcn apply command

## shadcn@4.1.2 (2026-03-31)

### Patch Changes

- [#10246](https://github.com/shadcn-ui/ui/pull/10246) [`44c09a19b0658cf8e72ac84bbba5b76e05192a0d`](https://github.com/shadcn-ui/ui/commit/44c09a19b0658cf8e72ac84bbba5b76e05192a0d) Thanks [@shadcn](https://github.com/shadcn)! - add style luma

## shadcn@4.1.1 (2026-03-27)

### Patch Changes

- [#10202](https://github.com/shadcn-ui/ui/pull/10202) [`12b49c986fcf7e6db9be7f515df6142f822f2236`](https://github.com/shadcn-ui/ui/commit/12b49c986fcf7e6db9be7f515df6142f822f2236) Thanks [@shadcn](https://github.com/shadcn)! - fix packageManager in package.json

## shadcn@4.1.0 (2026-03-19)

### Minor Changes

- [#10115](https://github.com/shadcn-ui/ui/pull/10115) [`687f09817b614a3450f0f56779edf367082e1e53`](https://github.com/shadcn-ui/ui/commit/687f09817b614a3450f0f56779edf367082e1e53) Thanks [@shadcn](https://github.com/shadcn)! - add fontHeading to presets

- [#10115](https://github.com/shadcn-ui/ui/pull/10115) [`687f09817b614a3450f0f56779edf367082e1e53`](https://github.com/shadcn-ui/ui/commit/687f09817b614a3450f0f56779edf367082e1e53) Thanks [@shadcn](https://github.com/shadcn)! - add chartColor

## shadcn@4.0.8 (2026-03-15)

### Patch Changes

- [#10041](https://github.com/shadcn-ui/ui/pull/10041) [`a97ebe54f1824032d8ad00d1d0c079e3dc6f52d7`](https://github.com/shadcn-ui/ui/commit/a97ebe54f1824032d8ad00d1d0c079e3dc6f52d7) Thanks [@shadcn](https://github.com/shadcn)! - Bundle @antfu/ni and tinyexec to fix missing module error with npx

## shadcn@4.0.7 (2026-03-14)

### Patch Changes

- [#9929](https://github.com/shadcn-ui/ui/pull/9929) [`f9b365bc7f9d591c995952976711dbdd7b1bc45a`](https://github.com/shadcn-ui/ui/commit/f9b365bc7f9d591c995952976711dbdd7b1bc45a) Thanks [@kapishdima](https://github.com/kapishdima)! - add dependency field to registry:font

## shadcn@4.0.6 (2026-03-13)

### Patch Changes

- [#10022](https://github.com/shadcn-ui/ui/pull/10022) [`7e93eb81ea8160c06c86f98bb6bfeb1ddfd0d237`](https://github.com/shadcn-ui/ui/commit/7e93eb81ea8160c06c86f98bb6bfeb1ddfd0d237) Thanks [@shadcn](https://github.com/shadcn)! - ensure monorepo respect package manager

## shadcn@4.0.5 (2026-03-11)

### Patch Changes

- [#9960](https://github.com/shadcn-ui/ui/pull/9960) [`5ee456735377158c12cf55eefbe872f7303e1325`](https://github.com/shadcn-ui/ui/commit/5ee456735377158c12cf55eefbe872f7303e1325) Thanks [@shadcn](https://github.com/shadcn)! - update handling of init urls
