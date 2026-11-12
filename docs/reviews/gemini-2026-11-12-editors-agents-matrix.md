Gemini said
Review: docs/research/EDITORS-AGENTS-MATRIX.md

Score: 7 / 20 — Good instinct to separate [V] measurements from [NV] judgments and log anomalies in §8, but invalidated by a broken GitHub pagination metric, a false assumption about bun fmt / bun check, a category-error scoring formula that ranks LSP daemons against agent TUIs, contradictory cross-table membership, and recommendations that break sibling monorepo workflows.

Criterion	Score	Verdict
Factual & tooling accuracy	2 / 6	False bun fmt/check claim, broken gh api Link count, VS Code license mix-up, U+200B bug
Statistical & methodological rigor	1 / 5	Cross-species rubric (rust-analyzer vs OpenCode), impossible sub-scores, --version timing fallacy
Internal & monorepo consistency	2 / 5	OpenCode (#1) omitted from §4, drops Gemini CLI used by council, ignores prd/fr2 remote builds
Completeness & operational readiness	2 / 4	Sub-scores hidden in external JSON, no 0–5 anchors, missing clangd/clippy/oxc & SSH remoting
1. Factual Errors

False native bun fmt / bun check replacement claim (§3 & §7):

Claim: Formatage/lint : `bun fmt` / `bun check` couvrent ; Biome inutile and Retirer : ... `biome.exe` et `oxlint.exe` de ~/.bun/bin (remplacés par bun).

Fact: Bun has no built-in linter, formatter, or typechecker named bun fmt or bun check. Running bun fmt or bun check is shorthand for bun run fmt / bun run check, which executes scripts in package.json—typically invoking oxlint / oxfmt or biome (and tsgo/tsc) under the hood. Deleting oxlint.exe breaks the underlying lint pipeline, and Bun provides zero formatting/linting for Rust (rustfmt / clippy) or C++.

Broken GitHub REST pagination methodology & absurd 90-day commit counts (§1, §2, §4, §5):

Claim: gh api repos/{r}/commits?since=2026-08-14 (branche par défaut, dernière page du Link) yields [V] 90-day commit counts, including 48 740 for OpenClaw (541 commits/day) and 46 966 for Hermes Agent (522 commits/day).

Fact: Without &per_page=1, GitHub's REST API defaults to per_page=30, so the rel="last" Link page number is not the commit count. Even with per_page=1, raw default-branch commit counts conflate squash-merged PR workflows (Helix: 20 commits = 20 merged PRs) with un-squashed merge histories, bot commits, or packaging mirrors (Claude Code: 252).

microsoft/typescript-go archival misread (§3, §7, §8):

Claim: microsoft/typescript-go archivé alors que tsgo 7.0.2 publié ; emplacement du dev actuel non vérifié, plus 36 commits after 2026-08-14 on an archived repo whose cited tag is 2026-07-08.

Fact: microsoft/typescript-go was the temporary staging repo for Project Corsa; active TypeScript 7 development consolidated back into mainline microsoft/TypeScript (distributed via npm typescript 7.x / @typescript/native-preview), and a GitHub-archived repository is read-only (0 post-archive commits).

Chimera entity for #1-ranked OpenCode (§5, §6, §8):

Combines GitHub metadata from anomalyco/opencode (v1.19.5, 5 616 commits) with local startup timing from a different binary (v2.2.7, acknowledged in §8 as an unidentified channel or opencode2 fork) into a single [V]/92.0 row.

License misclassifications marked [V] (§2 & §5):

VS Code (§2): Only the microsoft/vscode (Code - OSS) source repository is MIT; the official VS Code binary distribution and Marketplace terms are proprietary Microsoft Software License Terms (same legal class as Cursor/Windsurf).

Zed (§2) & Crush (§5): NOASSERTION from GitHub's license detector means unverified multi/custom license, the opposite of [V]. Zed mixes GPL-3.0-or-later (app), AGPL-3.0-or-later (server), and Apache-2.0 (gpui); Crush uses FSL-1.1-MIT (non-OSI source-available, commercial-competing restriction for 2 years).

Selective [NV] tagging on composite scores (§2–§6):

The header states all 0–5 sub-scores are [NV]. Every weighted sum of [NV] inputs is mathematically [NV], yet [NV] is attached to only 8 rows (Cursor, Windsurf, etc.) and omitted on the other 24, making subjective scores (OpenCode 92.0, VS Code 84.4) appear empirically verified.

Corrupted Unicode (U+200B) in ## Index:

Line ​2. Éditeurs begins with a zero-width space (U+200B), breaking CommonMark <ol> numbering.

2. Design & Methodological Flaws

Cross-species single rubric & meaningless §6. Classement global:

Scoring text editors (Helix), compiler LSP servers (rust-analyzer), debug adapters (codelldb), and agent TUIs (OpenCode) on one 12-criterion formula (MCP: 10, autonomie: 10, DX Rust/TS: 12, LSP/tree-sitter: 8) compares complementary layers as competitors.

Mathematical proof of rubric violation: rust-analyzer has zero MCP (weight 10), zero autonomy (weight 10), and zero TypeScript support (half of DX Rust/TS, weight 12). Even with a perfect 5/5 on every remaining metric—including mem (despite multi-GB RAM usage on monorepos)—its strict ceiling with MCP = 0 and autonomie = 0 is 80.0 (74.0 if penalized half on DX Rust/TS). Scoring 77.4 (387 / 500) proves non-applicable criteria were padded with phantom points.

Inconsistent §4 vs §5 partitioning biases §7's primary recommendation:

Claude Code (86.4), Codex (83.8), Gemini CLI (69.0), and Aider (50.0) appear in both §4 (Agents autonomes) and §5 (TUI d'agents) with identical scores, whereas OpenCode (92.0), pi (79.8), and Crush (79.0) are excluded from §4. As a result, Claude Code wins §4 ("agent principal" in §7) despite trailing OpenCode by 5.6 points on the exact same autonomy-weighted scale.

<bin> --version is not startup latency (§1, §5, §7):

--version exits before loading workspaces, LSPs, TUI buffers, SQLite stores, or network auth, while on Windows it disproportionately measures .cmd → node.exe wrapper spawn overhead (Gemini CLI 824.5 ms) vs native PE binaries (Claude Code / Helix), while skipping codex.cmd entirely. Dropping Gemini CLI over a one-time 0.8 s CLI init in multi-minute NHITL agent runs is premature optimization.

Direct conflicts with C:\src monorepo architecture (§7):

Remote-only builds ignored: docs/ARCHITECTURE-ROOT.md (§1.8) forbids compiling/testing on the local Windows PC (C:\src); all builds run on Linux (prd/fr2). Yet the matrix gives Windows natif double the weight of Linux (10 vs 5) and assigns zero weight to Windows→Linux Remote SSH development, where Zed's remote server maturity on Windows hosts differs sharply from VS Code Remote-SSH or terminal SSH (Helix + OpenCode).

Breaks tools/council: agent/docs/ARCHITECTURE.md (same day, 2026-11-12) defines a codex/gemini/claude cross-CLI council; §7 uninstalls Gemini CLI.

Agent sprawl: Recommends maintaining 5–6 concurrent agent CLIs (Claude Code, OpenCode, Codex, OpenClaw, Hermes, pi) while agent/ is actively consolidating OpenClaw + Hermes + pi + OpenCode into one unified runtime.

3. Missing Items

Inline sub-score matrix & 0–5 anchor definitions: Readers cannot audit why OpenCode = 92.0 (460 / 500) or VS 2026 = 50.4 without the 12 per-criterion scores and explicit 0 / 3 / 5 thresholds.

Remote SSH / Headless NHITL execution criterion: JSON/headless batch flags, non-interactive permission bypass, MCP client/server support, and Windows→Linux SSH remote editing.

Complete C++/Rust/TS toolchain coverage in §3: Missing clangd (mandatory for third_party/llvm-project and chromium), cargo clippy + rustfmt, oxlint + oxfmt, and Windows PDB/D3D12 debugging (WinDbg / Visual Studio Build Tools vs lldb-dap).

Canonical owner/repo + binary package source column: Needed to prevent the OpenCode v1.19.5 vs v2.2.7 mix-up and verify archived/renamed repos.

Empirical agent capability benchmarks: SWE-bench Verified / Terminal-Bench pass rates and token-cost efficiency ($/task) instead of subjective [NV] autonomy guesses.

4. Concrete Fixes
Fix 1 — Accurate GitHub 90-day activity & cold-start commands (Bun / GraphQL)

Replace the broken Link-header pagination and --version micro-benchmark with exact GraphQL commit + merged-PR counts and non-shim binary invocation:

Bash
# 1. Exact 90-day default-branch commit count in 1 GraphQL call (no per_page=30 Link bug)
gh api graphql -F owner="anomalyco" -F name="opencode" -F since="2026-08-14T00:00:00Z" -f query='
  query($owner: String!, $name: String!, $since: GitTimestamp!) {
    repository(owner: $owner, name: $name) {
      isArchived
      licenseInfo { spdxId }
      defaultBranchRef {
        target { ... on Commit { history(since: $since) { totalCount } } }
      }
    }
  }'

# 2. Measure actual binary path (bypassing cmd.exe .cmd wrapper overhead on Windows) + headless prompt/init
hyperfine -N -w 2 -r 5 "hx --health"

Fix 2 — Split into 3 Category-Specific Rubrics (Delete §6. Classement global)

Replace §1 and §6 in docs/research/EDITORS-AGENTS-MATRIX.md (and strip U+200B on 2. Éditeurs):

Markdown
## Index
1. Méthode et barèmes par catégorie
2. Éditeurs et IDE
3. Serveurs de langage, lint et débogage (Rust / TS / C++)
4. Agents autonomes et TUI (NHITL)
5. Recommandation pour l'architecture `C:\src` (`prd`/`fr2`)
6. Anomalies et conflits de sources

## 1. Méthode et barèmes par catégorie
Chaque catégorie possède son propre vecteur de poids (total = 100) afin de ne jamais classer un serveur LSP contre un agent autonome. Tous les scores composites sont **[NV]** (agrégation de notes 0–5 documentées dans `editors-agents.json` avec ancres explicites 0/3/5).
- **Éditeurs (100) :** perf/latence 15, empreinte RAM 10, DX Rust/TS/C++ 20, LSP + tree-sitter 15, Remote SSH Windows→Linux (`prd`/`fr2`) 15, intégration ACP/MCP 10, Windows natif 10, licence OSS 5.
- **Briques IDE / Toolchain (100) :** précision d'analyse 25, perf/incrémentalité 20, RAM sur monorepo 15, support multi-plateforme (Win/Linux) 15, maturité protocole (LSP/DAP) 15, activité/licence 10.
- **Agents & TUI autonomes (100) :** exécution NHITL/headless 20, qualité d'édition/outillage 20, MCP/ACP + contexte/mémoire 15, Windows natif (sans WSL) + Linux 15, extensibilité/skills 10, licence OSS 10, coût/tokens 10.

Fix 3 — Correct §3 & §7 Tooling and Stack Alignment

Replace the erroneous bun fmt/oxlint/tsgo/Gemini CLI guidance in §3 and §7:

Markdown
### Ajouts & corrections §3 (Qualité IDE Rust + TS + C++)
- **Formatage & lint TS/JS :** conserver **`oxlint`** et **`oxfmt`** (`bun fmt` / `bun check` ne sont que des alias `bun run` vers les scripts `package.json`, pas un linter/formateur natif de Bun). `biome.exe` peut être retiré uniquement si aucun script ne l'appelle.
- **Formatage, lint & C++ :** ajouter `rustfmt` + `cargo clippy` (toolchain nightly épinglée) et **`clangd`** (issu de la toolchain LLVM pour `third_party/llvm-project` et `chromium`).
- **TypeScript 7 (`tsgo`) :** suivre désormais le dépôt principal **`microsoft/TypeScript`** (paquet npm `@typescript/native-preview` / `typescript` 7.x), `microsoft/typescript-go` n'étant que l'ancien dépôt de prévisualisation archivé.

### Corrections §7 (Recommandation alignée `C:\src`)
- **Agents & TUI :**
  - Auditer l'origine exacte du binaire local `opencode` (`v2.2.7` vs `anomalyco/opencode` `v1.19.5` : `where.exe opencode` + hash SHA-256) avant de l'utiliser en production.
  - Mettre à jour **`Gemini CLI`** vers `v0.68.0` (exécution directe sous Bun plutôt que suppression) tant que `tools/council` (`codex` / `gemini` / `claude`) en dépend.
  - Geler l'empilement d'agents résidents : utiliser `Claude Code` + `Codex CLI` en production immédiate pendant que les forks `openclaw` et `hermes-agent` convergent vers le runtime unifié du monorepo.
- **Éditeurs & Débogage (contrainte zéro build sur le PC, builds sur `prd`/`fr2`) :**
  - **Helix** (`hx`) + **`rust-analyzer`** (`rustup component add rust-analyzer`) pour l'édition rapide locale et SSH sur `prd`/`fr2`.
  - **Zed** (compiler ou installer en vérifiant le support Remote SSH Windows→Linux) ; conserver `Code - OSS` / `VS Code` ou `WinDbg` en repli pour le débogage graphique PDB/D3D12/WinUI 3 (`windows-msvc`).

