# Sovereign Infrastructure & Polyglot Deployment Engine (`C:\src\infra`)

Vercel-style zero-config self-hosted and multi-cloud deployment engine (`git clone` -> Live Production) built in pure **Go 1.27** (`sovereign.local/infra`), bridged zero-copy via Zig CGO (`infra_go.dll`) into **Bun v1.4.4 (`bun:ffi`)** and **Rust (`windows-sys`)**.

## Architecture

1. **`internal/detect` — Zero-Config Framework & Topology Detector**
   - Automatically classifies `bun-fullstack` (`bun build --compile --minify --bytecode`), `bun-worker`, `rust-daemon` (`cargo build --release`), `go-service` (`GOOS=linux GOARCH=amd64 CGO_ENABLED=0`), `oci-dockerfile`, and `static-wasm-webgpu` (`wck` 7-spec gate).
   - Parses `src-deploy.json`, `vercel.json`, and `wrangler.toml` / `wrangler.jsonc` for domains, R2 buckets, routes, and strict regional pinning (`eu-fr` vs `us-google-egress`).
   - Enforces sacred host userspace protection blocking `C:\Windows\System32`.

2. **`internal/oci` — Daemonless OCI Image Layout v1.1 Builder + Docker Engine HTTP Client**
   - Packages any Linux binary directly into a byte-deterministic OCI v1.1 directory (`oci-layout`, `index.json`, `blobs/sha256/...`) and `.tar` bundle without requiring a running Docker daemon.
   - Includes a native Docker Engine HTTP client supporting Windows Named Pipes (`\\.\pipe\docker_engine`), Unix sockets, and TCP SSH tunnels.

3. **`internal/providers` — Multi-Cloud & Self-Hosted Fleet Adapters**
   - **Self-Hosted VPS Fleet (`vps.go`)**: Targets `fr1` (`51.77.147.152` / `10.200.77.1`), `fr2` (`51.255.162.6` / `10.200.77.3`), and `usa` (`72.60.186.43` / `10.200.77.5` strictly restricted to Google/Gemini API egress; rejects non-Google workloads). Generates HTTP/3 QUIC `Caddyfile` + hardened `systemd` `@blue`/`@green` units.
   - **Cloudflare (`cloudflare.go`)**: Native REST v4 client (DNS A/AAAA/CNAME/HTTPS upsert, Workers ES module upload, Zero Trust Tunnels) + pure-Go **Cloudflare R2 S3v4 (`AWS4-HMAC-SHA256`)** client (`PutObject`, `HeadBucket`, presigned URLs).
   - **OVHcloud (`ovh.go`)**: Official `$1$<sha1(AS+CK+METHOD+URL+BODY+TSTAMP)>` signer + `ovhcloud.exe` CLI integration.
   - **Google Cloud (`gcloud.go`) & Vercel (`vercel.go`)**: Cloud Run / Artifact Registry (`--project=aphrody`) and Vercel Deployment API v13 (`/v13/deployments` + `vercel deploy --prebuilt`).
   - **Ollama (`ollama.go`)**: Fleet model orchestrator (`/api/tags`, `/api/pull`, `/api/ps`, `/api/generate`) for `qwen3-coder`, `deepseek-r1`, and `gemma4`.

4. **`cshared` + `ffi-bridge` — Three-Way `Rust <-> Bun <-> Go` Native FFI**
   - Compiled via Zig 0.17.0 CGO (`go build -buildmode=c-shared -o ~/.local/bin/infra_go.dll ./cshared`).
   - Exports `GoInfraVersion`, `GoDetectProjectJSON`, `GoSignR2S3v4AuthHeader`, and `GoComputeOciDigest`.
   - Verified in `ffi-bridge/polyglot.test.ts` (loading Go `infra_go.dll`, Rust `pi_opencode_native.dll`, and Rust `agent_desktop_ffi.dll` in one process with zero-copy `Rust -> Bun -> Go -> Bun` shared memory) and `ffi-bridge/src/lib.rs` (direct `Rust -> Go` dynamic FFI).

## CLI Usage (`src-deploy` / `dpl`)

```powershell
dpl doctor
dpl detect C:\src\apps\aphrody
dpl plan --all --out C:\src\infra\generated\deploy-plan.json
dpl caddyfile --out C:\src\infra\generated\Caddyfile
dpl oci-pack <binary> --tag ghcr.io/aphrody-labs/aphrody:latest --out <dir>
dpl up --all --dry-run --provider all
```
