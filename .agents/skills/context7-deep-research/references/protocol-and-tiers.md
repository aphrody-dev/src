# Context7 v2 & Knowledge-Engine Protocol Reference

## REST & Cache Architecture
- **Search Endpoint**: `GET https://context7.com/api/v2/libs/search?libraryName=<name>&query=<q>`
- **Context Endpoint**: `GET https://context7.com/api/v2/context?libraryId=<id>&query=<q>&type=txt`
- **SQLite WAL Store**: `var/knowledge.sqlite` (`context7_cache` table keyed by `rs_blake3_hex` via `rust_stack_ffi.dll`, 24h TTL).
- **Secret Hygiene**: `CTX7_API_KEY`, `EXA_API_KEY`, and `GITHUB_TOKEN` are loaded in-memory from `.env` via `@aphrody/env-kit` and never written to editor JSON/TOML config files.

## Source Authority Tiers
1. **Tier 1**: Official Specifications (WHATWG, W3C, MCP `2025-03-26`, `kernel.org`), Context7 Official Docs, and Local Verified `src` Lockfiles.
2. **Tier 2**: Upstream GitHub / Freedesktop GitLab Canonical Repositories & Release Tags.
3. **Tier 3**: Exa Neural Web Search Highlights.
