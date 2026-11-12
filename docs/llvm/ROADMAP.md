# Feuille de route `ay` façon LLVM (2026-11-12)

Préalable : fin de la restructuration nt-03 de `C:\src` et merge labs (ARCHITECTURE.md phases 1–3). Exécution et mesures sur prd/fr2 uniquement. Base : cargo 805 tests, bun 45 (ARCHITECTURE-ROOT.md §6).

| # | Phase | Contenu | Critère de sortie mesurable |
|---|---|---|---|
| 0 | RFC | `docs/rfc/0001-ay-llvm.md` = AY-AS-LLVM.md validé par le propriétaire | statut « accepté » |
| 1 | Couches déclarées | `[package.metadata.aphrody] layer` sur les 22 crates du tableau ; règle archguard en mode warn | `ay arch check` liste 0 crate sans couche ; nombre de violations publié |
| 2 | Support + ToolContext | `ToolContext` dans depot-core ; `ay` passe argv/racine/identity aux libs | 0 appel `std::env::args`/`process::exit` hors `depot-ay` (grep CI) ; tests ≥ base |
| 3 | Harnais lit | `depot-lit` (ou réutilisation vérifiée), `ay lit`, golden `--help` de chaque outil | ≥ 1 `.test` par outil (24) ; `ay lit --update` idempotent (2e passe = 0 diff) |
| 4 | Spec tools.toml | build.rs génère dispatch + aide + docs/ay/TOOLS.md | `enum Cmd` supprimé ; `GRAPH_SUBCOMMANDS` supprimé ; NAMING.md ne contient plus de table de commandes ; `ay manifests verify` vert |
| 5 | Dissolution depot-cli | 18 modules `commands/*` déplacés vers leur lib (1 PR/module) | `depot-cli/src/commands` vide ; aucune ligne dupliquée (diff de déplacement pur) ; tests ≥ base |
| 6 | Multicall argv0 | dispatch par stem, `ay install-links`, alias générés | `ay-gclient revinfo` ≡ `ay gclient revinfo` ≡ `gclient revinfo` (3 tests lit) sur windows-msvc et linux-gnu |
| 7 | Renommage dossiers | un dossier par PR selon AY-AS-LLVM §5 | packages inchangés (`cargo metadata` : même liste de noms) ; `ay identity check` vert ; règle archguard passée en erreur |
| 8 | Features par outil | `ay build --tools x,y` ; binaire minimal | taille de `ay` avec 1 outil vs tous, mesurée et publiée ; build propre de chaque feature seule |
| 9 | Allègement Support | sortir gix/just/magika/vault de depot-core si mesure le justifie | temps de build de depot-core seul −X % (seuil fixé après mesure phase 1) |

Règles transverses (DeveloperPolicy LLVM) : PR incrémentales, revert to green si un compteur de tests baisse, test obligatoire par fix, RFC pour toute nouvelle couche ou outil.
