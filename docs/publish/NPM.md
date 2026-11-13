# npm: readiness status (2026-11-12)

Verified on fr2 with `bun pm pack --dry-run` (bun 1.4.4) on the `C:\src-merge` tree (branch merge/labs, 06ebcae; same list of 16 packages as `C:\src\packages`). Name availability was read from `registry.npmjs.org`. C:\labs contains no tracked package.json (outside third_party), so no npm package.

## Ownership of the @aphrody scope

- `npm whoami` locally returns **401**: the token in `~/.npmrc` is expired or revoked. Ownership could therefore not be confirmed directly.
- Clues: `@aphrody/web` (1.4.7) and `@aphrody/yolo` (3.2.0) have `<npm-owner>` as sole maintainer. `@aphrody/yolo` declares `repository: aphrody-code/YOLO` and `author: aphrody-code`. This is very likely the owner's account.
- To do: `npm login`, then `npm whoami` (must answer `<npm-owner>`) and `npm org ls aphrody`.

## Packages (packages/*)

| Package                   | Version | private | license | repository | pack dry-run               | Name on npm              |
| ------------------------- | ------- | ------- | ------- | ---------- | -------------------------- | ------------------------ |
| @aphrody/agy              | 2.0.0   | no      | –       | –          | OK, 13 files, 97.6 KB      | free                     |
| @aphrody/ai-os            | 2.1.0   | no      | –       | –          | OK, 76 files, 5.1 MB       | free                     |
| @aphrody/ai-triad         | 1.0.0   | no      | –       | –          | OK, 23 files, 206.9 KB     | free                     |
| @aphrody/brain            | 0.1.0   | **yes** | –       | –          | OK, 6 files                | free                     |
| @aphrody/bun-parity       | 1.0.0   | no      | MIT     | –          | OK, 36 files               | free                     |
| @aphrody/bun-plugins      | 1.0.0   | no      | –       | –          | OK, 15 files               | free                     |
| @aphrody/chromium-bun     | 2.1.0   | no      | –       | –          | OK, 41 files               | free                     |
| @aphrody/env-kit          | 1.0.0   | no      | –       | –          | OK, 26 files               | free                     |
| @aphrody/epic-games       | 0.1.0   | no      | –       | –          | OK, 10 files               | free, **do not publish** |
| @aphrody/forge            | 1.1.0   | no      | –       | –          | OK, 22 files               | free                     |
| @aphrody/google-design    | 2.0.0   | **yes** | –       | –          | OK, 172 files, **33.7 MB** | free                     |
| @aphrody/knowledge-engine | 1.0.0   | no      | –       | –          | OK, 18 files               | free                     |
| @aphrody/machine          | 0.1.0   | **yes** | –       | –          | OK, 8 files                | free                     |
| @aphrody/pi-opencode      | 1.0.0   | no      | –       | –          | OK, 15 files               | free                     |
| @aphrody/shell-matrix     | 0.1.0   | **yes** | –       | –          | OK, 4 files                | free                     |
| @aphrody/wck              | 1.0.0   | no      | –       | –          | OK, 17 files               | free                     |

All 16 pass `pack --dry-run`, and no `workspace:`/`file:`/`link:` dependency would block publication.

## Required fixes

1. `license`: added (`MIT OR Apache-2.0`) to the 15 packages that lack one, and `repository` (`aphrody-dev/src`, with `directory`) to all 16, in `src-publish-fields.patch`.
2. `@aphrody/epic-games`: do not publish it. It embeds the Epic launcher client secret (audit §1), which the Epic terms of service forbid. The patch sets it to `"private": true`.
3. The 4 packages with `private: true` (brain, google-design, machine, shell-matrix) are refused by `npm publish`. An owner decision is needed. google-design (33.7 MB) contains Google assets, whose license must be checked before any publication.
4. The npm packages of aphrody-labs/aphrody-m3 are all already `private: true` except identity, web-to-tauri, scaffold and m3-fonts. Their metadata was fixed in the repository (3e1dcf5).
5. Publication afterwards with `bun publish` (or `npm publish --access public`), once the scope is confirmed.
