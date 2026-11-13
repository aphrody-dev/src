---
name: web-a11y-seo-cwv
description: Exigences normatives de src pour l'accessibilité (WCAG 2.2 AA), le référencement technique (Lighthouse SEO) et les Core Web Vitals (LCP, INP, CLS au p75). Utiliser AVANT de créer, modifier ou revoir une page web, un dashboard, une vue WebUI ou un composant HTML/CSS/JS de src, et pour fixer un seuil, une règle de focus, de contraste, de meta/canonical/robots/sitemap/hreflang, ou un budget de performance.
---

# web-a11y-seo-cwv

Trois specs font autorité (sources web.dev, developer.chrome.com et w3.org/TR/WCAG22 lues le 2026-11-13, ids stables, niveaux RFC 2119) :

| Spec | Fichiers | Préfixe d'id |
|---|---|---|
| Accessibilité | `docs/design/specs/a11y/web.md` + `.json` | `web.a11y.*` |
| SEO | `docs/design/specs/seo/web.md` + `.json` | `web.seo.*` |
| Performance | `docs/design/specs/perf/core-web-vitals.md` + `.json` | `web.cwv.*` |

Le JSON (schéma `docs/design/specs/spec.schema.json`) est lisible par machine : citer l'id de la règle dans les revues, les commits et les tests. Textes sources en miroir : `third_party/design-mirror/{web.dev,developer.chrome.com}` (champ `sources[].mirror`).

## Seuils à connaître sans ouvrir la spec

- Terrain, p75, mobile et desktop séparés : LCP ≤ 2500 ms, INP ≤ 200 ms, CLS ≤ 0,1 (mauvais : > 4000 ms, > 500 ms, > 0,25). FCP ≤ 1800 ms et TTFB ≤ 800 ms en diagnostic. FID n'est plus une cible.
- Thread principal : aucune tâche > 50 ms ; céder par `scheduler.yield()` avec repli.
- Contraste 4,5:1 (texte), 3:1 (grand texte, icônes essentielles, composants) ; cible de pointeur ≥ 24 × 24 px CSS (WCAG 2.5.8), 48 px visé pour le tactile.
- Image LCP : jamais `loading="lazy"`, `fetchpriority="high"`, découvrable dans le HTML ; jamais d'écouteur `unload` (bfcache).

## Procédure

1. Lire la spec du domaine touché ; appliquer chaque MUST, justifier par écrit tout SHOULD écarté.
2. Mesurer : Lighthouse 13 (catégories Accessibilité, SEO, insights de performance) et axe-core en CI ; en local, MCP `chrome-devtools` (`lighthouse_audit`, `performance_start_trace`).
3. Compléter par les audits manuels listés dans `web.a11y.test-manual` (clavier, focus, lecteur d'écran).
4. En production : RUM avec la bibliothèque web-vitals + LoAF, en plus de CrUX (`web.cwv.crux-plus-rum`).
5. Une règle sans source ou un seuil nouveau : relire la page en direct (`curl -sL -H "Accept: text/markdown" <url>`), mettre à jour JSON puis `.md`, signaler tout conflit dans la section « Conflits » de la spec.

## Skills voisines, sans doublon

- `web-quality-skills:accessibility`, `:seo`, `:core-web-vitals`, `:performance`, `:best-practices`, `:web-quality-audit` : méthodes d'audit et correctifs génériques. Elles exécutent ; cette skill tranche : en cas d'écart, les specs de src l'emportent.
- `modern-web-guidance:modern-web-guidance` : API HTML/CSS/JS actuelles (dialog, popover, view transitions…). À consulter pour l'implémentation, puis vérifier le résultat contre les ids ci-dessus.
- `cloudflare:web-perf` : diagnostic de performance des sites sur Cloudflare.
- `ui-system` : cibles UI, tokens et composants de src ; `webgpu-wasm-ui` : rendu GPU et wasm dans le navigateur.

## Interdits

- Recopier un passage de web.dev, developer.chrome.com ou WCAG dans le dépôt : reformuler et citer l'URL (WCAG : numéro de critère).
- Affirmer un seuil, un support navigateur ou une version sans page lue dans la session.
