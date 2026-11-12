# Sovereign Guide: Bun v1.4.4 Native Primitives & Monorepo Architecture

> **Source**: `C:\src\third_party\bun\docs` (1,412 MDX canonical specification files).  
> **Philosophy**: Linus Torvalds (flat data structures, sacred host userspace), Jarred Sumner (Full-Rust vertical speed, zero npm glue, zero `bunx`), Larry Page (10x surface clarity, autonomous ambient execution).

---

## 1. Native Bun v1.4.4 Primitives Matrix

| Upstream Fragile Pattern | Bun v1.4.4 Full-Rust Native Primitive | Canonical Spec in `bun/docs` |
|---|---|---|
| `pg`, `mysql2`, `sqlite3` npm packages | `import { sql, SQL } from "bun"` / `bun:sqlite` | `runtime/sql.mdx`, `runtime/sqlite.mdx` |
| `tar`, `archiver`, `decompress` | `Bun.Archive` | `runtime/archive.mdx` |
| `sharp`, `jimp`, `@napi-rs/image` | `Bun.Image` / `blob.image()` | `runtime/image.mdx` |
| `csrf`, `csurf` | `Bun.CSRF.generate()`, `Bun.CSRF.verify()` | `runtime/csrf.mdx` |
| `node-cron`, `cron` | `Bun.cron(expr, callback)` | `runtime/cron.mdx` |
| `marked`, `showdown`, `markdown-it` | `Bun.markdown.html()`, `Bun.markdown.render()` | `runtime/markdown.mdx` |
| `keytar`, plaintext `.env` secret stores | `Bun.secrets.get()`, `Bun.secrets.set()` | `runtime/secrets.mdx` |
| `semver` npm package | `Bun.semver.satisfies()`, `Bun.semver.order()` | `runtime/semver.mdx` |
| `picocolors`, `chalk`, `colorette` | `Bun.color(str, format)` | `runtime/color.mdx` |
| `@babel/core`, `esbuild` npm packages | `new Bun.Transpiler()` | `runtime/transpiler.mdx` |
| `bcrypt`, `argon2` | `Bun.password.hash()`, `Bun.password.verify()` | `runtime/bun-apis.mdx` |
| `crypto` sha/md5 streams | `new Bun.CryptoHasher("blake2b256")` | `runtime/hashing.mdx` |

---

## 2. Monorepo Structural Rules Enforced

1. **Zero unnecessary `dependencies` in packages**: All first-party workspace packages (`packages/*`) maintain 0 external npm dependencies when native Bun v1.4.4 APIs suffice.
2. **Canonical `tsconfig.json`**: Every workspace package defines `"allowImportingTsExtensions": true`, `"noEmit": true`, and `"types": ["bun"]`.
3. **Sacred Host Userspace**: Zero binaries placed in `C:\Windows\System32`. Sovereign binaries compile to `C:\Users\aphro\.local\bin` via `bun build --compile`.
4. **Single AI Ownership**: `@aphrody/ai-os` (`packages/ai-os`) is the sole public AI product and MCP server (`ai-os.exe mcp-stdio`). All other surfaces (`apps/*`, `crates/*`) are generalist platforms without AI slop.
