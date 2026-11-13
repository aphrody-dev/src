# nushell 0.117 — config.nu du dépôt (stub : $nu.config-path -> ce fichier, manifest.toml).
# Clés vérifiées avec `config nu --doc` (0.117.0). Démarrage : aucun processus externe ici ;
# zoxide et carapace sont pré-générés dans vendor/autoload par shells.ts (chargés après ce fichier).

$env.config.show_banner = false
$env.config.history.file_format = "plaintext"
$env.config.history.max_size = 100_000
$env.config.history.sync_on_enter = true
$env.config.history.ignore_space_prefixed = true
$env.config.completions.algorithm = "fuzzy"
$env.config.completions.case_sensitive = false
$env.config.completions.quick = true
$env.config.completions.partial = true
$env.config.completions.external.enable = true
$env.config.completions.external.max_results = 100
$env.config.table.index_mode = "auto"
$env.config.footer_mode = 25

# Alias : jamais sur une commande interne de nu (ls, find, du, ps restent structurés).
alias ll = eza -la --git --icons=auto --time-style=relative
alias la = eza -a --git --icons=auto
alias tree = eza --tree --icons=auto
alias gs = git status -sb
alias gd = git diff
alias gl = git log --oneline --graph --decorate -20
alias gp = git pull --ff-only
alias gaa = git add -A
alias b = bun
alias bx = bunx

# Complétion native de `ay` (signatures externes générées depuis `ay --help`).
source ../completions/ay.nu
