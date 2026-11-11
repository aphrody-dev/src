---
name: go-infra-oneclick-deploy
description: "Deploy any Bun, Rust, Go, or WASM/WebGPU app in C:\src via Go 1.27 src-deploy / dpl: daemonless OCI v1.1 image builds, Caddy HTTP/3 blue/green across fr1/fr2 and Google-only usa egress, Cloudflare DNS/Workers/R2 S3v4, and 3-way Rust <-> Bun <-> Go FFI (infra_go.dll)."
---

# Go 1.27 One-Click Deploy & Three-Way FFI (`src-deploy` / `dpl`)

Activate this skill when packaging OCI v1.1 container images without a Docker daemon, generating HTTP/3 `Caddyfile` and `systemd` units, uploading assets to Cloudflare R2, or calling `infra_go.dll` via FFI.

## Standard CLI Workflows (`dpl` / `src-deploy`)

1. **Environment & Fleet Readiness**:
   ```powershell
   dpl doctor
   dpl detect C:\src\apps\aphrody
   ```
2. **Generate Deployment Plan & HTTP/3 Caddyfile**:
   ```powershell
   dpl plan --all --out C:\src\infra\generated\deploy-plan.json
   dpl caddyfile --out C:\src\infra\generated\Caddyfile
   ```
3. **Dry-Run or Live Fleet Rollout**:
   ```powershell
   dpl up --all --dry-run
   ```

## Regional Egress Invariant
- `fr1` (`51.77.147.152`) and `fr2` (`51.255.162.6`) host production European workloads with HTTP/3 Blue/Green failover.
- `usa` (`72.60.186.43`) is strictly pinned to Google/Gemini API egress; non-Google workloads are rejected deterministically.

## Progressive Disclosure Reference
- OCI v1.1 layout details, R2 `AWS4-HMAC-SHA256` signing, and `infra_go.dll` C-shared exports: see [`references/oci-fleet-and-ffi.md`](./references/oci-fleet-and-ffi.md).
