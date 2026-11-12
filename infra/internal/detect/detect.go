// Package detect implements zero-config Vercel-style framework, runtime, and topology detection
// across Bun v1.4.4, Rust 2024/2026 Fat-LTO, Go 1.27 static Linux, OCI/Dockerfiles, and Static/WASM/WebGPU.
package detect

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// RuntimeKind identifies the zero-config detected sovereign runtime.
type RuntimeKind string

const (
	RuntimeBunFullstack     RuntimeKind = "bun-fullstack"
	RuntimeBunWorker        RuntimeKind = "bun-worker"
	RuntimeRustDaemon       RuntimeKind = "rust-daemon"
	RuntimeGoService        RuntimeKind = "go-service"
	RuntimeOCIDockerfile    RuntimeKind = "oci-dockerfile"
	RuntimeStaticWasmWebGPU RuntimeKind = "static-wasm-webgpu"
	RuntimeUnknown          RuntimeKind = "unknown"
)

// RegionPin enforces EU sovereign hosting vs strict US Google/Gemini egress.
type RegionPin string

const (
	RegionEUFrance       RegionPin = "eu-fr"
	RegionUSGoogleEgress RegionPin = "us-google-egress"
)

// RouteRule describes an HTTP route or proxy rule.
type RouteRule struct {
	Src  string `json:"src"`
	Dest string `json:"dest"`
}

// ProjectSpec is the deterministic result of inspecting a repository or package directory.
type ProjectSpec struct {
	Name            string            `json:"name"`
	Path            string            `json:"path"`
	Framework       string            `json:"framework"`
	Runtime         RuntimeKind       `json:"runtime"`
	Entrypoint      string            `json:"entrypoint"`
	BuildCommand    string            `json:"buildCommand"`
	ArtifactOut     string            `json:"artifactOut"`
	VerifyGate      string            `json:"verifyGate,omitempty"`
	Region          RegionPin         `json:"region"`
	TargetNodes     []string          `json:"targetNodes"`
	Domains         []string          `json:"domains"`
	Routes          []RouteRule       `json:"routes,omitempty"`
	EnvBindings     []string          `json:"envBindings,omitempty"`
	R2Buckets       []string          `json:"r2Buckets,omitempty"`
	Providers       []string          `json:"providers"`
	Port            int               `json:"port"`
	BluePort        int               `json:"bluePort"`
	GreenPort       int               `json:"greenPort"`
	GoogleEgress    bool              `json:"googleEgress"`
	ConfigSources   []string          `json:"configSources,omitempty"`
	Metadata        map[string]string `json:"metadata,omitempty"`
}

// SrcDeployConfig represents optional overrides in src-deploy.json.
type SrcDeployConfig struct {
	Name         string            `json:"name"`
	Runtime      string            `json:"runtime"`
	Entrypoint   string            `json:"entrypoint"`
	BuildCommand string            `json:"buildCommand"`
	Region       string            `json:"region"`
	TargetNodes  []string          `json:"targetNodes"`
	Domains      []string          `json:"domains"`
	Providers    []string          `json:"providers"`
	Port         int               `json:"port"`
	GoogleEgress *bool             `json:"googleEgress"`
	EnvBindings  []string          `json:"envBindings"`
	R2Buckets    []string          `json:"r2Buckets"`
	Routes       []RouteRule       `json:"routes"`
	Metadata     map[string]string `json:"metadata"`
}

type packageJSON struct {
	Name            string            `json:"name"`
	Description     string            `json:"description"`
	Main            string            `json:"main"`
	Module          string            `json:"module"`
	Scripts         map[string]string `json:"scripts"`
	Dependencies    map[string]string `json:"dependencies"`
	DevDependencies map[string]string `json:"devDependencies"`
}

type vercelJSON struct {
	Name         string            `json:"name"`
	Framework    string            `json:"framework"`
	BuildCommand string            `json:"buildCommand"`
	OutputDir    string            `json:"outputDirectory"`
	Regions      []string          `json:"regions"`
	Alias        []string          `json:"alias"`
	Env          map[string]string `json:"env"`
	Routes       []struct {
		Src  string `json:"src"`
		Dest string `json:"dest"`
	} `json:"routes"`
	Rewrites []struct {
		Source      string `json:"source"`
		Destination string `json:"destination"`
	} `json:"rewrites"`
}

type wranglerJSONC struct {
	Name       string                 `json:"name"`
	Main       string                 `json:"main"`
	AccountID  string                 `json:"account_id"`
	Vars       map[string]any         `json:"vars"`
	Routes     any                    `json:"routes"`
	R2Buckets  []struct {
		Binding    string `json:"binding"`
		BucketName string `json:"bucket_name"`
	} `json:"r2_buckets"`
}

// GuardWorkspacePath blocks access to host OS directories such as C:\Windows\System32.
func GuardWorkspacePath(p string) error {
	clean := strings.ToLower(filepath.Clean(p))
	cleanSlash := strings.ReplaceAll(clean, `\`, `/`)
	forbidden := []string{
		"c:/windows",
		"c:/program files",
		"c:/program files (x86)",
		"/bin",
		"/sbin",
		"/usr/bin",
		"/usr/sbin",
		"/etc",
		"/proc",
		"/sys",
	}
	for _, prefix := range forbidden {
		if cleanSlash == prefix || strings.HasPrefix(cleanSlash, prefix+"/") {
			return fmt.Errorf("forbidden host system path blocked: %s", p)
		}
	}
	return nil
}

// Detect inspects dir and produces a zero-config ProjectSpec.
func Detect(dir string) (*ProjectSpec, error) {
	if strings.TrimSpace(dir) == "" {
		wd, err := os.Getwd()
		if err != nil {
			return nil, err
		}
		dir = wd
	}
	if err := GuardWorkspacePath(dir); err != nil {
		return nil, err
	}
	absDir, err := filepath.Abs(dir)
	if err != nil {
		return nil, err
	}
	if err := GuardWorkspacePath(absDir); err != nil {
		return nil, err
	}
	info, err := os.Stat(absDir)
	if err != nil {
		return nil, fmt.Errorf("stat project dir %s: %w", absDir, err)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("project path is not a directory: %s", absDir)
	}

	baseName := filepath.Base(absDir)
	spec := &ProjectSpec{
		Name:        sanitizeName(baseName),
		Path:        filepath.ToSlash(absDir),
		Runtime:     RuntimeUnknown,
		Framework:   "generic",
		Region:      RegionEUFrance,
		TargetNodes: []string{"fr1", "fr2"},
		Providers:   []string{"self-hosted"},
		Port:        3000,
		BluePort:    13000,
		GreenPort:   23000,
		Metadata:    make(map[string]string),
	}

	hasDockerfile := fileExists(absDir, "Dockerfile") || fileExists(absDir, "Containerfile") ||
		fileExists(absDir, "compose.yaml") || fileExists(absDir, "docker-compose.yml")
	hasGoMod := fileExists(absDir, "go.mod")
	hasCargoToml := fileExists(absDir, "Cargo.toml")
	hasPkgJSON := fileExists(absDir, "package.json")
	hasWrangler := findWranglerFile(absDir) != ""
	hasIndexHTML := fileExists(absDir, "index.html") || fileExists(absDir, "public/index.html")
	hasWasm := hasExtInDir(absDir, ".wasm") || hasExtInDir(filepath.Join(absDir, "public"), ".wasm") ||
		hasExtInDir(filepath.Join(absDir, "dist"), ".wasm")

	var pkg packageJSON
	if hasPkgJSON {
		if raw, err := os.ReadFile(filepath.Join(absDir, "package.json")); err == nil {
			_ = json.Unmarshal(raw, &pkg)
			if pkg.Name != "" {
				spec.Name = sanitizeName(pkg.Name)
			}
		}
	}

	// Runtime precedence:
	// 1. Explicit Dockerfile/Compose ONLY if no native language manifest, OR record docker availability in metadata.
	//    Wait: if a directory is specifically an OCI/Dockerfile project (no go.mod/Cargo.toml/package.json), classify as oci-dockerfile.
	switch {
	case hasGoMod:
		spec.Runtime = RuntimeGoService
		spec.Framework = "go-1.27"
		entry := detectGoEntrypoint(absDir)
		spec.Entrypoint = entry
		outBin := fmt.Sprintf("dist/%s-linux-amd64", spec.Name)
		spec.ArtifactOut = outBin
		spec.BuildCommand = fmt.Sprintf("GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags=\"-s -w\" -o %s %s", outBin, entry)
		spec.Providers = []string{"self-hosted", "gcloud"}
	case hasCargoToml && !hasPkgJSON:
		spec.Runtime = RuntimeRustDaemon
		spec.Framework = "rust-2026-fat-lto"
		crateName := parseCargoPackageName(filepath.Join(absDir, "Cargo.toml"), spec.Name)
		spec.Name = sanitizeName(crateName)
		spec.Entrypoint = detectRustEntrypoint(absDir)
		spec.ArtifactOut = fmt.Sprintf("target/x86_64-unknown-linux-gnu/release/%s", spec.Name)
		spec.BuildCommand = "cargo build --release"
		spec.Providers = []string{"self-hosted"}
	case hasPkgJSON:
		entry := detectBunEntrypoint(absDir, pkg)
		spec.Entrypoint = entry
		if isBunWorkerProject(absDir, pkg, hasWrangler) {
			spec.Runtime = RuntimeBunWorker
			spec.Framework = "bun-cloudflare-worker"
			spec.ArtifactOut = fmt.Sprintf("dist/%s.worker.js", spec.Name)
			spec.BuildCommand = fmt.Sprintf("bun build %s --target=browser --minify --outfile=%s", entry, spec.ArtifactOut)
			spec.Providers = []string{"cloudflare", "self-hosted"}
		} else {
			spec.Runtime = RuntimeBunFullstack
			spec.Framework = detectBunFramework(absDir, pkg)
			spec.ArtifactOut = fmt.Sprintf("dist/%s-linux-x64", spec.Name)
			spec.BuildCommand = fmt.Sprintf("bun build --compile --minify --bytecode --target=bun-linux-x64 %s --outfile %s", entry, spec.ArtifactOut)
			spec.Providers = []string{"self-hosted", "cloudflare", "vercel"}
			if hasIndexHTML || hasWasm {
				spec.VerifyGate = fmt.Sprintf("wck check %s", filepath.ToSlash(absDir))
			}
		}
	case hasDockerfile:
		spec.Runtime = RuntimeOCIDockerfile
		if fileExists(absDir, "Dockerfile") {
			spec.Entrypoint = "Dockerfile"
		} else if fileExists(absDir, "Containerfile") {
			spec.Entrypoint = "Containerfile"
		} else if fileExists(absDir, "compose.yaml") {
			spec.Entrypoint = "compose.yaml"
		} else {
			spec.Entrypoint = "docker-compose.yml"
		}
		spec.Framework = "oci-container"
		spec.ArtifactOut = fmt.Sprintf("dist/%s.oci.tar", spec.Name)
		spec.BuildCommand = fmt.Sprintf("docker build -t sovereign/%s:latest -f %s .", spec.Name, spec.Entrypoint)
		spec.Providers = []string{"self-hosted", "gcloud"}
	case hasIndexHTML || hasWasm:
		spec.Runtime = RuntimeStaticWasmWebGPU
		spec.Framework = "static-wasm-webgpu"
		if fileExists(absDir, "index.html") {
			spec.Entrypoint = "index.html"
		} else {
			spec.Entrypoint = "public/index.html"
		}
		spec.ArtifactOut = "."
		spec.VerifyGate = fmt.Sprintf("wck check %s", filepath.ToSlash(absDir))
		spec.BuildCommand = fmt.Sprintf("wck check %s", filepath.ToSlash(absDir))
		spec.Providers = []string{"cloudflare", "self-hosted"}
	default:
		spec.Runtime = RuntimeUnknown
	}

	if hasDockerfile {
		spec.Metadata["has_dockerfile"] = "true"
	}
	if fileExists(absDir, "bun.lock") || fileExists(absDir, "bun.lockb") {
		spec.Metadata["lockfile"] = "bun.lock"
	} else if fileExists(absDir, "Cargo.lock") {
		spec.Metadata["lockfile"] = "Cargo.lock"
	} else if fileExists(absDir, "go.sum") {
		spec.Metadata["lockfile"] = "go.sum"
	}

	// Apply canonical sovereign monorepo topology defaults by project name before explicit config overrides.
	applySovereignCatalogDefaults(spec)

	// Parse optional wrangler.toml / wrangler.jsonc
	if wf := findWranglerFile(absDir); wf != "" {
		spec.ConfigSources = append(spec.ConfigSources, filepath.ToSlash(wf))
		applyWranglerConfig(spec, wf)
	}

	// Parse optional vercel.json
	if vf := filepath.Join(absDir, "vercel.json"); fileExists(absDir, "vercel.json") {
		spec.ConfigSources = append(spec.ConfigSources, filepath.ToSlash(vf))
		applyVercelConfig(spec, vf)
	}

	// Parse optional src-deploy.json (highest priority)
	if sf := filepath.Join(absDir, "src-deploy.json"); fileExists(absDir, "src-deploy.json") {
		spec.ConfigSources = append(spec.ConfigSources, filepath.ToSlash(sf))
		applySrcDeployConfig(spec, sf)
	}

	dedupeStrings(&spec.Domains)
	dedupeStrings(&spec.EnvBindings)
	dedupeStrings(&spec.R2Buckets)
	dedupeStrings(&spec.Providers)
	dedupeStrings(&spec.TargetNodes)

	return spec, nil
}

// SovereignTarget describes a named deployment target across C:\src.
type SovereignTarget struct {
	Alias       string
	Path        string
	Description string
	Preset      func(*ProjectSpec)
}

// SovereignTargets returns the canonical fleet targets across C:\src.
func SovereignTargets(monorepoRoot string) []SovereignTarget {
	if monorepoRoot == "" {
		monorepoRoot = `C:\src`
	}
	return []SovereignTarget{
		{
			Alias:       "aphrody",
			Path:        filepath.Join(monorepoRoot, "apps", "aphrody"),
			Description: "aphrody.com pixel-accurate surface + Fluent2/M3 + WASM/WebGPU",
		},
		{
			Alias:       "shenron",
			Path:        filepath.Join(monorepoRoot, "apps", "shenron"),
			Description: "dragonballfr.com & tv.dragonballfr.com encyclopedia, streaming & CDN worker",
		},
		{
			Alias:       "rosegriffon",
			Path:        filepath.Join(monorepoRoot, "apps", "rosegriffon"),
			Description: "rosegriffon.fr publishing, ranked Achillea & Azalee platform",
		},
		{
			Alias:       "ai-os",
			Path:        filepath.Join(monorepoRoot, "packages", "ai-os"),
			Description: "Unified Multi-Protocol AI Control Plane (OpenAI /v1, MCP, A2A, ACP)",
		},
		{
			Alias:       "rust-stack",
			Path:        filepath.Join(monorepoRoot, "crates", "depot"),
			Description: "Sovereign Rust monorepo build/graph/artifact engine (depot + forge + xtask)",
			Preset: func(s *ProjectSpec) {
				s.Name = "rust-stack"
				s.Port = 4100
				s.BluePort = 14100
				s.GreenPort = 24100
				s.Domains = []string{"depot.internal.aphrody.com"}
			},
		},
		{
			Alias:       "ai-triad",
			Path:        filepath.Join(monorepoRoot, "packages", "pi-opencode"),
			Description: "Pi + OpenCode + Locally Uncensored / Gemini Egress AI Triad Harness",
			Preset: func(s *ProjectSpec) {
				s.Name = "ai-triad"
				s.Region = RegionUSGoogleEgress
				s.GoogleEgress = true
				s.TargetNodes = []string{"usa", "fr2"}
				s.Domains = []string{"gemini-egress.internal.aphrody.com", "triad.aphrody.com"}
				s.EnvBindings = append(s.EnvBindings, "GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_CLOUD_PROJECT")
				s.Port = 4200
				s.BluePort = 14200
				s.GreenPort = 24200
			},
		},
		{
			Alias:       "ring3-agent",
			Path:        filepath.Join(monorepoRoot, "crates", "ring3-agent"),
			Description: "Native Rust Ring-3 early-boot HTTP + tri-backend inference daemon (r3d)",
		},
	}
}

// DetectTarget resolves either an alias (e.g. "aphrody", "ai-triad") or a filesystem path.
func DetectTarget(monorepoRoot, targetOrDir string) (*ProjectSpec, error) {
	if monorepoRoot == "" {
		monorepoRoot = `C:\src`
	}
	trimmed := strings.TrimSpace(targetOrDir)
	for _, t := range SovereignTargets(monorepoRoot) {
		if strings.EqualFold(t.Alias, trimmed) {
			spec, err := Detect(t.Path)
			if err != nil {
				return nil, err
			}
			if t.Preset != nil {
				t.Preset(spec)
				dedupeStrings(&spec.Domains)
				dedupeStrings(&spec.EnvBindings)
				dedupeStrings(&spec.TargetNodes)
			}
			return spec, nil
		}
	}
	return Detect(trimmed)
}

// DetectAll inspects all canonical sovereign projects in C:\src.
func DetectAll(monorepoRoot string) ([]*ProjectSpec, error) {
	targets := SovereignTargets(monorepoRoot)
	out := make([]*ProjectSpec, 0, len(targets))
	for _, t := range targets {
		if _, err := os.Stat(t.Path); err != nil {
			continue
		}
		spec, err := Detect(t.Path)
		if err != nil {
			return nil, err
		}
		if t.Preset != nil {
			t.Preset(spec)
			dedupeStrings(&spec.Domains)
			dedupeStrings(&spec.EnvBindings)
			dedupeStrings(&spec.TargetNodes)
		}
		out = append(out, spec)
	}
	return out, nil
}

func applySovereignCatalogDefaults(spec *ProjectSpec) {
	lower := strings.ToLower(spec.Name)
	switch {
	case lower == "aphrody":
		spec.Domains = []string{"aphrody.com", "www.aphrody.com"}
		spec.Region = RegionEUFrance
		spec.TargetNodes = []string{"fr1", "fr2"}
		spec.Port = 3000
		spec.BluePort = 13000
		spec.GreenPort = 23000
		spec.R2Buckets = []string{"aphrody-assets"}
		spec.Providers = []string{"self-hosted", "cloudflare", "vercel"}
	case strings.Contains(lower, "shenron"):
		spec.Name = "shenron"
		spec.Domains = []string{"dragonballfr.com", "www.dragonballfr.com", "tv.dragonballfr.com"}
		spec.Region = RegionEUFrance
		spec.TargetNodes = []string{"fr1", "fr2"}
		spec.Port = 3100
		spec.BluePort = 13100
		spec.GreenPort = 23100
		spec.R2Buckets = []string{"shenron-cdn"}
		spec.EnvBindings = []string{"DATABASE_URL", "CLOUDFLARE_ACCOUNT_ID", "SHENRON_MCP_ADMIN_TOKEN"}
		spec.Providers = []string{"self-hosted", "cloudflare"}
	case strings.Contains(lower, "rosegriffon"):
		spec.Name = "rosegriffon"
		spec.Domains = []string{"rosegriffon.fr", "www.rosegriffon.fr"}
		spec.Region = RegionEUFrance
		spec.TargetNodes = []string{"fr1", "fr2"}
		spec.Port = 3320
		spec.BluePort = 13320
		spec.GreenPort = 23320
		spec.R2Buckets = []string{"rosegriffon-media"}
		spec.EnvBindings = []string{"DATABASE_URL", "CLOUDFLARE_ACCOUNT_ID"}
		spec.Providers = []string{"self-hosted", "cloudflare", "vercel"}
	case lower == "ai-os" || strings.HasSuffix(lower, "/ai-os"):
		spec.Name = "ai-os"
		spec.Domains = []string{"ai.aphrody.com"}
		spec.Region = RegionEUFrance
		spec.TargetNodes = []string{"fr1", "fr2"}
		spec.Port = 4000
		spec.BluePort = 14000
		spec.GreenPort = 24000
		spec.EnvBindings = []string{"OPENAI_API_KEY", "ANTHROPIC_API_KEY", "RING3_BASE_URL"}
		spec.Providers = []string{"self-hosted", "gcloud"}
	case strings.Contains(lower, "ring3-agent") || lower == "r3d":
		spec.Name = "ring3-agent"
		spec.Domains = []string{"r3d.internal.aphrody.com"}
		spec.Region = RegionEUFrance
		spec.TargetNodes = []string{"fr2", "fr1"}
		spec.Port = 8080
		spec.BluePort = 18080
		spec.GreenPort = 28080
		spec.Providers = []string{"self-hosted"}
	case strings.Contains(lower, "google") || strings.Contains(lower, "gemini"):
		spec.Region = RegionUSGoogleEgress
		spec.GoogleEgress = true
		spec.TargetNodes = []string{"usa"}
		spec.Port = 8443
		spec.BluePort = 18443
		spec.GreenPort = 28443
	}
}

func findWranglerFile(dir string) string {
	candidates := []string{
		filepath.Join(dir, "wrangler.toml"),
		filepath.Join(dir, "wrangler.jsonc"),
		filepath.Join(dir, "wrangler.json"),
		filepath.Join(dir, "deploy", "cloudflare", "wrangler.toml"),
		filepath.Join(dir, "deploy", "cloudflare", "wrangler.jsonc"),
	}
	for _, c := range candidates {
		if info, err := os.Stat(c); err == nil && !info.IsDir() {
			return c
		}
	}
	return ""
}

func applyWranglerConfig(spec *ProjectSpec, path string) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return
	}
	ext := strings.ToLower(filepath.Ext(path))
	if ext == ".json" || ext == ".jsonc" {
		cleaned := stripJSONC(string(raw))
		var w wranglerJSONC
		if json.Unmarshal([]byte(cleaned), &w) == nil {
			if w.Main != "" && spec.Runtime == RuntimeBunWorker {
				spec.Entrypoint = w.Main
			}
			for _, b := range w.R2Buckets {
				if b.BucketName != "" {
					spec.R2Buckets = append(spec.R2Buckets, b.BucketName)
				}
			}
			for k := range w.Vars {
				spec.EnvBindings = append(spec.EnvBindings, k)
			}
		}
		return
	}

	// Lightweight line parser for wrangler.toml
	lines := strings.Split(strings.ReplaceAll(string(raw), "\r\n", "\n"), "\n")
	for _, line := range lines {
		t := strings.TrimSpace(line)
		if t == "" || strings.HasPrefix(t, "#") {
			continue
		}
		if k, v, ok := splitKV(t); ok {
			switch k {
			case "name":
				if spec.Name == "" || spec.Runtime == RuntimeBunWorker {
					spec.Name = sanitizeName(unquote(v))
				}
			case "main":
				if spec.Runtime == RuntimeBunWorker {
					spec.Entrypoint = unquote(v)
				}
			case "bucket_name":
				spec.R2Buckets = append(spec.R2Buckets, unquote(v))
			case "pattern":
				host := strings.Split(unquote(v), "/")[0]
				if host != "" && !strings.Contains(host, "*") {
					spec.Domains = append(spec.Domains, host)
				}
			}
		}
	}
}

func applyVercelConfig(spec *ProjectSpec, path string) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return
	}
	var v vercelJSON
	if err := json.Unmarshal(raw, &v); err != nil {
		return
	}
	if v.Name != "" {
		spec.Name = sanitizeName(v.Name)
	}
	if v.Framework != "" {
		spec.Framework = v.Framework
	}
	if v.BuildCommand != "" {
		spec.BuildCommand = v.BuildCommand
	}
	if v.OutputDir != "" {
		spec.ArtifactOut = v.OutputDir
	}
	spec.Domains = append(spec.Domains, v.Alias...)
	for k := range v.Env {
		spec.EnvBindings = append(spec.EnvBindings, k)
	}
	for _, r := range v.Routes {
		spec.Routes = append(spec.Routes, RouteRule{Src: r.Src, Dest: r.Dest})
	}
	for _, rw := range v.Rewrites {
		spec.Routes = append(spec.Routes, RouteRule{Src: rw.Source, Dest: rw.Destination})
	}
	for _, reg := range v.Regions {
		r := strings.ToLower(reg)
		if strings.HasPrefix(r, "iad") || strings.HasPrefix(r, "sfo") || strings.HasPrefix(r, "us") {
			spec.Region = RegionUSGoogleEgress
			spec.GoogleEgress = true
			spec.TargetNodes = []string{"usa"}
		} else if strings.HasPrefix(r, "cdg") || strings.HasPrefix(r, "fra") || strings.HasPrefix(r, "eu") {
			spec.Region = RegionEUFrance
			spec.TargetNodes = []string{"fr1", "fr2"}
		}
	}
	spec.Providers = append(spec.Providers, "vercel")
}

func applySrcDeployConfig(spec *ProjectSpec, path string) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return
	}
	var cfg SrcDeployConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return
	}
	if cfg.Name != "" {
		spec.Name = sanitizeName(cfg.Name)
	}
	if cfg.Runtime != "" {
		spec.Runtime = RuntimeKind(cfg.Runtime)
	}
	if cfg.Entrypoint != "" {
		spec.Entrypoint = cfg.Entrypoint
	}
	if cfg.BuildCommand != "" {
		spec.BuildCommand = cfg.BuildCommand
	}
	if cfg.Region != "" {
		spec.Region = RegionPin(cfg.Region)
		if spec.Region == RegionUSGoogleEgress {
			spec.GoogleEgress = true
			if len(cfg.TargetNodes) == 0 {
				spec.TargetNodes = []string{"usa"}
			}
		} else if spec.Region == RegionEUFrance && len(cfg.TargetNodes) == 0 {
			spec.TargetNodes = []string{"fr1", "fr2"}
		}
	}
	if cfg.GoogleEgress != nil {
		spec.GoogleEgress = *cfg.GoogleEgress
	}
	if len(cfg.TargetNodes) > 0 {
		spec.TargetNodes = cfg.TargetNodes
	}
	if len(cfg.Domains) > 0 {
		spec.Domains = cfg.Domains
	}
	if len(cfg.Providers) > 0 {
		spec.Providers = cfg.Providers
	}
	if cfg.Port > 0 {
		spec.Port = cfg.Port
		spec.BluePort = 10000 + cfg.Port
		spec.GreenPort = 20000 + cfg.Port
	}
	spec.EnvBindings = append(spec.EnvBindings, cfg.EnvBindings...)
	spec.R2Buckets = append(spec.R2Buckets, cfg.R2Buckets...)
	spec.Routes = append(spec.Routes, cfg.Routes...)
	for k, v := range cfg.Metadata {
		spec.Metadata[k] = v
	}
}

func detectGoEntrypoint(dir string) string {
	cmdDir := filepath.Join(dir, "cmd")
	if entries, err := os.ReadDir(cmdDir); err == nil {
		for _, e := range entries {
			if e.IsDir() && fileExists(filepath.Join(cmdDir, e.Name()), "main.go") {
				return "./cmd/" + e.Name()
			}
		}
	}
	if fileExists(dir, "main.go") {
		return "."
	}
	return "./..."
}

func detectRustEntrypoint(dir string) string {
	if fileExists(dir, "src/main.rs") {
		return "src/main.rs"
	}
	if fileExists(dir, "crates") {
		return "Cargo.toml (workspace)"
	}
	if fileExists(dir, "src/lib.rs") {
		return "src/lib.rs"
	}
	return "Cargo.toml"
}

func parseCargoPackageName(cargoTomlPath, fallback string) string {
	raw, err := os.ReadFile(cargoTomlPath)
	if err != nil {
		return fallback
	}
	inPkg := false
	for _, line := range strings.Split(strings.ReplaceAll(string(raw), "\r\n", "\n"), "\n") {
		t := strings.TrimSpace(line)
		if strings.HasPrefix(t, "[") {
			inPkg = (t == "[package]")
			continue
		}
		if inPkg {
			if k, v, ok := splitKV(t); ok && k == "name" {
				return unquote(v)
			}
		}
	}
	return fallback
}

func detectBunEntrypoint(dir string, pkg packageJSON) string {
	candidates := []string{
		pkg.Main,
		pkg.Module,
		"server.ts",
		"src/server.ts",
		"src/index.ts",
		"src/cli.ts",
		"src/worker.ts",
		"index.ts",
		"app.ts",
	}
	for _, c := range candidates {
		if c != "" && fileExists(dir, c) {
			return filepath.ToSlash(c)
		}
	}
	// Monorepo fallback (apps/web or apps/server)
	subCandidates := []string{
		"apps/web/src/index.ts",
		"apps/web/server.ts",
		"apps/server/src/index.ts",
		"scripts/compile.ts",
		"build.ts",
	}
	for _, c := range subCandidates {
		if fileExists(dir, c) {
			return c
		}
	}
	return "src/index.ts"
}

func isBunWorkerProject(dir string, pkg packageJSON, hasWrangler bool) bool {
	// Only treat as pure Cloudflare Worker when wrangler.toml/jsonc is at the root of the project
	// (monorepos with deploy/cloudflare/wrangler.jsonc are fullstack apps with edge CDN workers).
	rootWrangler := fileExists(dir, "wrangler.toml") || fileExists(dir, "wrangler.jsonc") || fileExists(dir, "wrangler.json")
	if rootWrangler && !fileExists(dir, "server.ts") && !fileExists(dir, "src/server.ts") {
		return true
	}
	if _, ok := pkg.DevDependencies["@cloudflare/workers-types"]; ok && !fileExists(dir, "server.ts") {
		return true
	}
	_ = hasWrangler
	return false
}

func detectBunFramework(dir string, pkg packageJSON) string {
	if _, ok := pkg.Dependencies["elysia"]; ok {
		return "bun-elysia"
	}
	if _, ok := pkg.Dependencies["hono"]; ok {
		return "bun-hono"
	}
	if _, ok := pkg.Dependencies["next"]; ok {
		return "bun-nextjs-hybrid"
	}
	if fileExists(dir, "server.ts") && len(pkg.Dependencies) == 0 {
		return "bun-web-standards-zero-dep"
	}
	return "bun-v1.4.4-aot"
}

func fileExists(dir, rel string) bool {
	if rel == "" {
		return false
	}
	info, err := os.Stat(filepath.Join(dir, filepath.FromSlash(rel)))
	return err == nil && !info.IsDir()
}

func hasExtInDir(dir, ext string) bool {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return false
	}
	for _, e := range entries {
		if !e.IsDir() && strings.EqualFold(filepath.Ext(e.Name()), ext) {
			return true
		}
	}
	return false
}

func sanitizeName(s string) string {
	s = strings.TrimSpace(s)
	if idx := strings.LastIndex(s, "/"); idx >= 0 {
		s = s[idx+1:]
	}
	s = strings.TrimPrefix(s, "@")
	var sb strings.Builder
	for i := 0; i < len(s); i++ {
		c := s[i]
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' || c == '_' {
			if c >= 'A' && c <= 'Z' {
				sb.WriteByte(c + ('a' - 'A'))
			} else {
				sb.WriteByte(c)
			}
		} else {
			sb.WriteByte('-')
		}
	}
	res := strings.Trim(sb.String(), "-")
	if res == "" {
		return "app"
	}
	return res
}

func splitKV(line string) (string, string, bool) {
	idx := strings.IndexByte(line, '=')
	if idx <= 0 {
		return "", "", false
	}
	return strings.TrimSpace(line[:idx]), strings.TrimSpace(line[idx+1:]), true
}

func unquote(s string) string {
	s = strings.TrimSpace(s)
	if len(s) >= 2 && ((s[0] == '"' && s[len(s)-1] == '"') || (s[0] == '\'' && s[len(s)-1] == '\'')) {
		return s[1 : len(s)-1]
	}
	return s
}

// stripJSONC strips // line comments, /* */ block comments, and trailing commas so encoding/json can parse JSONC.
func stripJSONC(input string) string {
	var out strings.Builder
	inStr := false
	escaped := false
	for i := 0; i < len(input); i++ {
		c := input[i]
		if inStr {
			out.WriteByte(c)
			if escaped {
				escaped = false
			} else if c == '\\' {
				escaped = true
			} else if c == '"' {
				inStr = false
			}
			continue
		}
		if c == '"' {
			inStr = true
			out.WriteByte(c)
			continue
		}
		if c == '/' && i+1 < len(input) && input[i+1] == '/' {
			for i < len(input) && input[i] != '\n' {
				i++
			}
			out.WriteByte('\n')
			continue
		}
		if c == '/' && i+1 < len(input) && input[i+1] == '*' {
			i += 2
			for i+1 < len(input) && !(input[i] == '*' && input[i+1] == '/') {
				i++
			}
			i++
			continue
		}
		out.WriteByte(c)
	}
	// Remove trailing commas before } or ]
	s := out.String()
	var clean strings.Builder
	inStr = false
	escaped = false
	for i := 0; i < len(s); i++ {
		c := s[i]
		if inStr {
			clean.WriteByte(c)
			if escaped {
				escaped = false
			} else if c == '\\' {
				escaped = true
			} else if c == '"' {
				inStr = false
			}
			continue
		}
		if c == '"' {
			inStr = true
			clean.WriteByte(c)
			continue
		}
		if c == ',' {
			j := i + 1
			for j < len(s) && (s[j] == ' ' || s[j] == '\t' || s[j] == '\r' || s[j] == '\n') {
				j++
			}
			if j < len(s) && (s[j] == '}' || s[j] == ']') {
				continue
			}
		}
		clean.WriteByte(c)
	}
	return clean.String()
}

func dedupeStrings(slice *[]string) {
	if len(*slice) <= 1 {
		return
	}
	seen := make(map[string]struct{}, len(*slice))
	out := make([]string, 0, len(*slice))
	for _, item := range *slice {
		if item == "" {
			continue
		}
		if _, ok := seen[item]; !ok {
			seen[item] = struct{}{}
			out = append(out, item)
		}
	}
	sort.SliceStable(out, func(i, j int) bool { return i < j })
	*slice = out
}
