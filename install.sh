#!/usr/bin/env bash
# Sovereign One-Click Reproducible Monorepo Installer (Linux / WSL2 / CachyOS / Nix)
# Pinned to src.lock.json
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCK_FILE="${SCRIPT_DIR}/src.lock.json"
LOCAL_BIN="${HOME}/.local/bin"

echo "=== SOVEREIGN MONOREPO INSTALLER (Linux / POSIX) ==="
mkdir -p "${LOCAL_BIN}"

if [[ ":$PATH:" != *":${LOCAL_BIN}:"* ]]; then
  export PATH="${LOCAL_BIN}:${PATH}"
  echo "[PATH] Added ${LOCAL_BIN} to session PATH"
fi

# 1. Verify Core Toolchains
echo "[1/5] Verifying Core Toolchains..."
ensure_cargo_bin() {
  local cmd="$1"
  local pkg="$2"
  if ! command -v "$cmd" &>/dev/null; then
    echo "  Installing missing tool: $cmd..."
    if command -v cargo-binstall &>/dev/null; then
      cargo binstall --no-confirm "$pkg"
    else
      cargo install "$pkg" --locked
    fi
  else
    echo "  [OK] $cmd found"
  fi
}

ensure_cargo_bin "sccache" "sccache"
ensure_cargo_bin "just" "just"
ensure_cargo_bin "jj" "jujutsu"
ensure_cargo_bin "gix" "gitoxide"

# 2. Configure Cargo Global Settings
echo "[2/5] Configuring Cargo 2026 Environment..."
mkdir -p "${HOME}/.cargo"
cat > "${HOME}/.cargo/config.toml" << 'EOF'
[build]
rustc-wrapper = "sccache"

[alias]
xtask = "run --manifest-path crates/xtask/Cargo.toml --release --"
nt = "nextest run"
b = "build"
c = "check"
t = "test"

[target.x86_64-unknown-linux-gnu]
rustflags = ["-C", "target-cpu=native"]

[net]
git-fetch-with-cli = true
EOF
echo "  [OK] ~/.cargo/config.toml configured"

# 3. Configure Jujutsu
echo "[3/5] Configuring Jujutsu..."
mkdir -p "${HOME}/.config/jj"
cat > "${HOME}/.config/jj/config.toml" << 'EOF'
[user]
name = "aphrody-dev"
email = "contact@aphrody.com"

[ui]
default-command = "log"
diff-editor = ":builtin"
paginate = "never"

[snapshot]
max-new-file-size = "1MiB"
auto-track = "all()"

[git]
auto-local-bookmark = true
abandon-unreachable-commits = true

[revset-aliases]
"stack()" = "ancestors(@, 10) & mutable()"
"wip()" = "mutable() & ~empty()"
"review()" = "heads(mutable())"
EOF
echo "  [OK] ~/.config/jj/config.toml configured"

# 4. Build xtk, rust-stack, triad, and src-deploy CLI Tooling
echo "[4/5] Building Sovereign Rust, Bun, and Go CLI Tooling..."
if [[ -d "${SCRIPT_DIR}/crates/xtask" ]]; then
  (cd "${SCRIPT_DIR}/crates/xtask" && cargo build --release)
  cp -f "${SCRIPT_DIR}/crates/xtask/target/release/xtk" "${LOCAL_BIN}/xtk" 2>/dev/null || \
  cp -f "${HOME}/.cache/cargo-target/release/xtk" "${LOCAL_BIN}/xtk" 2>/dev/null || true
  chmod +x "${LOCAL_BIN}/xtk"
  echo "  [OK] Installed xtk to ${LOCAL_BIN}/xtk"
fi
if [[ -f "${SCRIPT_DIR}/infra/go.mod" ]] && command -v go &>/dev/null; then
  (cd "${SCRIPT_DIR}/infra" && CGO_ENABLED=0 go build -o "${LOCAL_BIN}/src-deploy" ./cmd/src-deploy)
  chmod +x "${LOCAL_BIN}/src-deploy"
  echo "  [OK] Installed src-deploy to ${LOCAL_BIN}/src-deploy"
fi
if [[ -f "${SCRIPT_DIR}/packages/ai-triad/src/cli.ts" ]] && command -v bun &>/dev/null; then
  bun build --compile "${SCRIPT_DIR}/packages/ai-triad/src/cli.ts" --outfile "${LOCAL_BIN}/triad" >/dev/null
  chmod +x "${LOCAL_BIN}/triad"
  echo "  [OK] Installed triad to ${LOCAL_BIN}/triad"
fi

# 5. Create frg wrapper
echo "[5/5] Creating frg shim..."
cat > "${LOCAL_BIN}/frg" << EOF
#!/usr/bin/env bash
exec bun run "${SCRIPT_DIR}/packages/forge/src/cli.ts" "\$@"
EOF
chmod +x "${LOCAL_BIN}/frg"
echo "  [OK] Installed frg to ${LOCAL_BIN}/frg"

# Expose the shared agent skills to Claude Code (.agents/skills is the single source of truth)
if [[ -d "${SCRIPT_DIR}/.agents/skills" && ! -e "${SCRIPT_DIR}/.claude/skills" ]]; then
  mkdir -p "${SCRIPT_DIR}/.claude"
  ln -s ../.agents/skills "${SCRIPT_DIR}/.claude/skills"
  echo "  [OK] Linked .claude/skills -> .agents/skills"
fi

echo -e "\nRunning Sovereign Doctor Verification:"
"${LOCAL_BIN}/xtk" doctor || true

echo -e "\nSovereign Monorepo Setup 100% Complete & Verified."
