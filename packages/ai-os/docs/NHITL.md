# Index NHITL

Règle du propriétaire : faire tout le reste à faire avant un récapitulatif ; une pause, une question finale ou une action laissée au propriétaire viole NHITL (no human in the loop). Tout ce qui la viole est indexé ici.

## Commandes

| Commande | Effet |
|---|---|
| `ai-os nhitl scan [--only transcript,settings,code,queue,docs,hook,ledger] [--local]` | rescan reproductible, JSON (comptes par source et par catégorie) |
| `ai-os nhitl list [--source S] [--category C] [--status open\|fixed\|inevitable] [--severity S] [--q fts] [--limit N]` | entrées, tri humain compris |
| `ai-os nhitl stats` | comptes par catégorie et statut, dernier scan par source |
| `ai-os nhitl set <id> <statut> [--reason …]` | tri humain, conservé d'un scan à l'autre |
| `ai-os nhitl login claude\|codex [--hosts prd,fr2]` | connexion des CLI des runners sans saisie par l'agent |
| `ai-os orch queue [--host H]` | tâches en file et jetons estimés de leurs invites |

Recettes : `just nhitl <args>`, `just nhitl-schedule` (tâche planifiée horaire `aphrody-nhitl-scan` sur Windows, crontab sur Unix).

## Base

`<src>/var/agents/nhitl.sqlite` (`NHITL_DB` prime) : table `violation` (source, emplacement, catégorie, gravité, extrait, correctif, statut, raison), FTS5 `violation_fts`, `triage` (statuts posés à la main), `unit_cache` (transcripts inchangés non relus), `scan` (journal). Extraits limités à 160 caractères et expurgés (motifs de jetons, valeurs des variables sensibles).

## Sources

| Source | Lu | Catégories |
|---|---|---|
| transcript | `~/.claude/projects/*/*.jsonl`, dernier texte de chaque tour de l'agent principal | `passive_wait`, `owner_todo`, `conditional_offer`, `final_question` |
| settings | `.claude/settings*.json` (utilisateur, src, projets de `~/.claude.json`), agy (CLI, `config.json`), opencode | `settings_deny`, `settings_confirm` |
| code | src hors `third_party`, tests et docs (`rg --pcre2`) | `interactive_prompt`, `owner_approval`, `endless_wait`, `browser_login`, `missing_noninteractive` |
| queue | `var/agents` du PC, de prd (rebond fr2 sur le mesh) et de fr2 | `queue_failed`, `queue_failed_auth`, `queue_requeued_auth`, `owner_approval`, `held_effect`, `host_unreachable` |
| docs | `*.md` hors `third_party` | `doc_manual_action` (rapports archivés : inévitable) |
| hook | `~/.claude/learning/nhitl.jsonl` (plugin aphrody-nhitl) | `hook_deny`, `hook_confirm` |
| ledger | `src/nhitl/ledger.json`, points relevés à la main avec leur cause | libre |

Statut `inevitable` réservé aux garde-fous (secrets, système), aux effets externes retenus par contrat (`owner-rules`), aux confirmations d'interface web destinées aux utilisateurs finaux et aux gestes physiques du propriétaire (UAC, passkey, application mobile).
