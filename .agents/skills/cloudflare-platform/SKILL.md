---
name: cloudflare-platform
description: Cloudflare Developer Platform reference covering Workers (workerd, wrangler), Pages, D1 SQL, R2 Object Storage, KV, Queues, Hyperdrive, and Zero Trust.
---

# Cloudflare Developer Platform Reference

## Runtime & Tooling

- **Engine**: `workerd` (Open-Source JavaScript / Wasm Runtime).
- **CLI**: `wrangler` (`bunx wrangler` / `npx wrangler`).
  - Dev server: `bunx wrangler dev`
  - Deploy: `bunx wrangler deploy`
  - Tail logs: `bunx wrangler tail`
  - Types generation: `bunx wrangler types`

## Core Storage & Database Primitives

- **Cloudflare D1 (Serverless SQLite)**:
  - Local execute: `bunx wrangler d1 execute <DB_NAME> --local --file=./schema.sql`
  - Remote execute: `bunx wrangler d1 execute <DB_NAME> --remote --command="SELECT * FROM users"`
  - Migrations: `bunx wrangler d1 migrations apply <DB_NAME> --remote`
- **Cloudflare R2 (S3-Compatible Object Storage)**:
  - Bucket operations: `bunx wrangler r2 bucket create <BUCKET_NAME>`
  - Binding in `wrangler.jsonc`:
    ```jsonc
    "r2_buckets": [
      { "binding": "BUCKET", "bucket_name": "production-assets" }
    ]
    ```
- **Workers KV & Queues**:
  - KV: Ultra-low latency eventual consistency read-heavy key-value store.
  - Queues: Guaranteed message delivery between background worker pipelines.

## MCP & Remote Documentation

- Cloudflare Docs MCP Server: `https://docs.mcp.cloudflare.com/mcp`
- Official Cloudflare MCP integration: `@cloudflare/mcp-server-cloudflare`
