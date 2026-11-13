# Verdict Gemini 4 Carbon High : versionnement figé (2026-11-13)

Livrable soumis : `docs/VERSIONING.md`, `.github/workflows/canary.yml`, `infra/fleet/bin/fleet-ping.sh`
(état antérieur au commit 006858bd ; contexte : monorepo agent-first, tout sur main, flotte fr1/fr2/prd,
inspiration Linux, Chromium, Bun, Rust). Moteur : gemini.google.com, mode Carbon High, une passe.

## Note : 9/20

Séparation SemVer/CalVer et squelette CI jugés lisibles ; gel impossible en l'état (modèle sans branche
contradictoire, `just ping` qui passe sur des pannes, canary publié depuis un main rouge).

## Défauts relevés

| # | Gravité | Défaut | Suite |
|---|---|---|---|
| C1 | critique | Sans branche, un tag rc/patch embarque tout main : « fixes only » incompatible avec des features qui continuent d'atterrir | corrigé : gel de main semaines 5-6, travail non prêt derrière un flag désactivé, même règle pour les patchs |
| C2 | critique | `fleet-ping.sh` : code de sortie distant = celui de `printf`, `degraded` et unités en échec ignorés | corrigé : l'hôte échoue si systemd n'est pas `running` ou si une unité est en échec (le premier passage a révélé vps et prd `degraded`, 1 unité chacun) |
| C3 | critique | 401/404 acceptés partout, y compris sur le site et `/api/health` | corrigé : codes admis par URL (`/api/health` = 2xx seul ; 404 seulement cdn/downloads sans index) |
| C4 | critique | cron et dispatch publient `github.sha` sans vérifier que `ci` est vert | corrigé : étape « Resolve green SHA » (dernier `ci` vert sur main), no-op si déjà publié |
| M1 | majeur | `ay-canary --version` ne porte pas la version canary ; publication avant l'anneau fr1 | partiel : anneau fr1 avant publication, `ay-canary.VERSION` écrit ; injection de version au build non faite (exige crates/ay, hors périmètre) |
| M2 | majeur | canary inférieur au stable en SemVer, `-rc` dans Cargo.toml donnerait `-rc.1-canary` | déjà résolu par 006858bd (bump de `VERSION` après le stable) ; `${base%%-*}` ajouté dans canary.yml |
| M3 | majeur | `gh release delete` avant upload : canal en 404, détruit en cas d'échec ; pas de garde d'ordre | corrigé : mise à jour en place (tag déplacé, `upload --clobber`, `edit`) et saut si le SHA est `behind`/`diverged` (API compare) |
| M4 | majeur | CalVer `YYYY.MM` à zéro initial invalide pour npm ; gel annoncé « vérifié par canary.yml » | déjà résolu par 006858bd (package.json = `VERSION` SemVer, CalVer = nom de train, gel vérifié par `ay release freeze --check`) |
| M5 | majeur | hôtes `vps cdn prd` vs fr1/fr2/prd ; `timeout` Windows | réfuté : alias `~/.ssh/config` (vps = fr1, cdn = fr2) documentés en tête du script ; `timeout` = coreutils ; ajout de `ServerAliveInterval` |
| m1 | mineur | `actions/checkout@v7` non épinglé ; jeton App sur toute l'org | corrigé : SHA de v7.0.1 (`gh api`), `owner` retiré (jeton borné au dépôt) ; permission `actions: read` ajoutée pour `gh run list` |
| m2 | mineur | beta déployée sur prd sans fr1 | déjà résolu par 006858bd (anneau unique fr1, fr2, prd) |
| m3 | mineur | espaces insécables dans l'indentation | réfuté : 0 octet `C2 A0` dans les 3 fichiers (artefact du collage) |

## Reste

- Injection de la version canary dans le binaire (`option_env!` côté crates/ay).
- Unités systemd en échec sur vps et prd, désormais visibles par `just ping`.
