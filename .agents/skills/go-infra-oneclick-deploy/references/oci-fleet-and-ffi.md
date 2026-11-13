# Go Infra OCI v1.1, Fleet Routing & `infra_go.dll` FFI

## Daemonless OCI v1.1 Packaging (`infra/internal/oci`)
Writes deterministic `oci-layout`, `index.json`, config blobs, and tar layers directly to `blobs/sha256/*` without requiring `dockerd`, plus supports Windows Named Pipe `\\.\pipe\docker_engine` and SSH tunnel pushes when a daemon is present.

## Zig 0.17 CGO Shared Library (`C:\Users\aphro\.local\bin\infra_go.dll`)
- `GoInfraVersion()` — ABI version string.
- `GoDetectProjectJSON(path)` — Framework & regional topology classification.
- `GoSignR2S3v4AuthHeader(...)` — Pure-Go Cloudflare R2 S3v4 signature generator.
- `GoComputeOciDigest(buffer)` — Deterministic SHA-256 OCI layer digest.
- Tested end-to-end across Rust, Bun, and Go in `packages/ffi-bridge/rust-stack-ffi.test.ts`.
