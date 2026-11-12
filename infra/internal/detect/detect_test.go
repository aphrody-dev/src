package detect

import (
	"os"
	"path/filepath"
	"testing"
)

func TestGuardWorkspacePathBlocksSystem32(t *testing.T) {
	if err := GuardWorkspacePath(`C:\Windows\System32`); err == nil {
		t.Fatalf("expected C:\\Windows\\System32 to be blocked")
	}
	if err := GuardWorkspacePath(`/usr/bin`); err == nil {
		t.Fatalf("expected /usr/bin to be blocked")
	}
	if err := GuardWorkspacePath(`C:\src\infra`); err != nil {
		t.Fatalf("expected C:\\src\\infra to be allowed, got: %v", err)
	}
}

func TestDetectAllFiveRuntimesAndOverrides(t *testing.T) {
	root := t.TempDir()

	// 1. Bun Fullstack
	bunDir := filepath.Join(root, "my-bun-app")
	_ = os.MkdirAll(bunDir, 0o755)
	_ = os.WriteFile(filepath.Join(bunDir, "package.json"), []byte(`{"name":"my-bun-app","scripts":{"build":"bun run build.ts"}}`), 0o644)
	_ = os.WriteFile(filepath.Join(bunDir, "bun.lock"), []byte(""), 0o644)
	_ = os.WriteFile(filepath.Join(bunDir, "server.ts"), []byte(`Bun.serve({port:3000, fetch(){ return new Response("ok"); }})`), 0o644)
	sBun, err := Detect(bunDir)
	if err != nil {
		t.Fatalf("detect bun: %v", err)
	}
	if sBun.Runtime != RuntimeBunFullstack {
		t.Fatalf("expected bun-fullstack, got %s", sBun.Runtime)
	}

	// 2. Bun Worker with wrangler.toml
	workerDir := filepath.Join(root, "edge-worker")
	_ = os.MkdirAll(workerDir, 0o755)
	_ = os.WriteFile(filepath.Join(workerDir, "package.json"), []byte(`{"name":"edge-worker"}`), 0o644)
	_ = os.WriteFile(filepath.Join(workerDir, "wrangler.toml"), []byte("name = \"edge-worker\"\nmain = \"src/worker.ts\"\nbucket_name = \"edge-bucket\"\n"), 0o644)
	_ = os.MkdirAll(filepath.Join(workerDir, "src"), 0o755)
	_ = os.WriteFile(filepath.Join(workerDir, "src", "worker.ts"), []byte(`export default { fetch() { return new Response("edge"); } }`), 0o644)
	sWorker, err := Detect(workerDir)
	if err != nil {
		t.Fatalf("detect worker: %v", err)
	}
	if sWorker.Runtime != RuntimeBunWorker {
		t.Fatalf("expected bun-worker, got %s", sWorker.Runtime)
	}
	if len(sWorker.R2Buckets) != 1 || sWorker.R2Buckets[0] != "edge-bucket" {
		t.Fatalf("expected r2 bucket edge-bucket, got %+v", sWorker.R2Buckets)
	}

	// 3. Rust Daemon
	rustDir := filepath.Join(root, "fast-daemon")
	_ = os.MkdirAll(filepath.Join(rustDir, "src"), 0o755)
	_ = os.WriteFile(filepath.Join(rustDir, "Cargo.toml"), []byte("[package]\nname = \"fast-daemon\"\nversion = \"0.1.0\"\n"), 0o644)
	_ = os.WriteFile(filepath.Join(rustDir, "src", "main.rs"), []byte("fn main() {}"), 0o644)
	sRust, err := Detect(rustDir)
	if err != nil {
		t.Fatalf("detect rust: %v", err)
	}
	if sRust.Runtime != RuntimeRustDaemon {
		t.Fatalf("expected rust-daemon, got %s", sRust.Runtime)
	}

	// 4. Go Service + src-deploy.json region override
	goDir := filepath.Join(root, "gemini-proxy")
	_ = os.MkdirAll(goDir, 0o755)
	_ = os.WriteFile(filepath.Join(goDir, "go.mod"), []byte("module example.com/gemini\n\ngo 1.27.0\n"), 0o644)
	_ = os.WriteFile(filepath.Join(goDir, "main.go"), []byte("package main\nfunc main(){}\n"), 0o644)
	_ = os.WriteFile(filepath.Join(goDir, "src-deploy.json"), []byte(`{"region":"us-google-egress","domains":["gemini.aphrody.com"],"port":9090}`), 0o644)
	sGo, err := Detect(goDir)
	if err != nil {
		t.Fatalf("detect go: %v", err)
	}
	if sGo.Runtime != RuntimeGoService || sGo.Region != RegionUSGoogleEgress || !sGo.GoogleEgress || sGo.Port != 9090 {
		t.Fatalf("unexpected go spec: %+v", sGo)
	}

	// 5. OCI Dockerfile
	ociDir := filepath.Join(root, "custom-oci")
	_ = os.MkdirAll(ociDir, 0o755)
	_ = os.WriteFile(filepath.Join(ociDir, "Dockerfile"), []byte("FROM scratch\nCOPY app /app\nENTRYPOINT [\"/app\"]\n"), 0o644)
	sOCI, err := Detect(ociDir)
	if err != nil {
		t.Fatalf("detect oci: %v", err)
	}
	if sOCI.Runtime != RuntimeOCIDockerfile {
		t.Fatalf("expected oci-dockerfile, got %s", sOCI.Runtime)
	}

	// 6. Static WASM WebGPU
	wasmDir := filepath.Join(root, "shader-app")
	_ = os.MkdirAll(wasmDir, 0o755)
	_ = os.WriteFile(filepath.Join(wasmDir, "index.html"), []byte("<!doctype html><title>WebGPU</title>"), 0o644)
	_ = os.WriteFile(filepath.Join(wasmDir, "engine.wasm"), []byte{0x00, 0x61, 0x73, 0x6d}, 0o644)
	sWasm, err := Detect(wasmDir)
	if err != nil {
		t.Fatalf("detect wasm: %v", err)
	}
	if sWasm.Runtime != RuntimeStaticWasmWebGPU || sWasm.VerifyGate == "" {
		t.Fatalf("expected static-wasm-webgpu with wck gate, got %+v", sWasm)
	}
}

func TestDetectRealSovereignMonorepoTargets(t *testing.T) {
	if _, err := os.Stat(`C:\src\apps\aphrody`); err != nil {
		t.Skip("C:\\src\\apps\\aphrody not present on test host")
	}
	specs, err := DetectAll(`C:\src`)
	if err != nil {
		t.Fatalf("DetectAll failed: %v", err)
	}
	if len(specs) < 7 {
		t.Fatalf("expected at least 7 sovereign targets, got %d", len(specs))
	}
}
