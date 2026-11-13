# fish 4.x — config.fish du dépôt (stub ~/.config/fish/config.fish -> ce fichier, manifest.toml).
# Linux seulement. Environnement commun : ../env.fish, généré depuis ../env.toml.
source (status dirname)/../env.fish

status is-interactive; or return 0

set -g fish_greeting
# Init en cache (régénérer : rm $AY_SHELL_CACHE/fish/*) : aucun fork au démarrage une fois le cache créé.
set -l c $AY_SHELL_CACHE/fish
if type -q zoxide
    test -s $c/zoxide.fish; or begin; mkdir -p $c; zoxide init fish >$c/zoxide.fish; end
    source $c/zoxide.fish
end

abbr -a gs git status -sb
abbr -a gd git diff
abbr -a gl git log --oneline --graph --decorate -20
abbr -a gp git pull --ff-only
abbr -a gaa git add -A
abbr -a b bun
abbr -a bx bunx
# Complétions : git, cargo, just fournies par fish ; ay = ~/.config/fish/completions/ay.fish (manifest).
