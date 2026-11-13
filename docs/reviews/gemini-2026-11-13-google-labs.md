# Revue Gemini : absorption google-labs-code (2026-11-13)

Moteur : relais `gemini_review` (antigravity), 11/20, sur le transport MCP partagé (`packages/ai-os/src/relay/mcp-http.ts`), le hub Stitch, la route Jules d'`ai-os orch`, `.github/workflows/jules.yml` et le parseur DESIGN.md (`packages/google-design/src/design-md/parser/scan.ts`).

Corrigé dans le même commit :

- réponse JSON-RPC sans `id` attendu (flux coupé, notification seule) : erreur au lieu d'un succès vide ; les notifications avec `error` ne sont plus prises pour la réponse ;
- session expirée (HTTP 404 avec `Mcp-Session-Id`) : nouvelle session et un seul nouvel essai ;
- en-têtes protocolaires appliqués après ceux de l'appelant ; `notifications/initialized` n'est plus avalé ; `initialize` rend son résultat ; DELETE de session borné à 10 s ;
- Jules sur demande explicite seulement : `jules` ou `jules:<owner/repo>` (plus de `julesx`) ;
- `jules.yml` : `@jules` réservé à OWNER, MEMBER, COLLABORATOR ; délimiteur de sortie aléatoire ; job sauté sans `JULES_API_KEY` ;
- parseur : BOM retiré avant le front matter.

Réfuté ou hors périmètre :

- « `deterministic` n'est pas une option fetch » : option de `outboundFetch` (`OutboundInit`, `src/relay/outbound.ts`) ;
- SHA de l'action non audité : c'est le fork aphrody-labs/jules-action = amont + un patch (PR google-labs-code/jules-action#21) ;
- clôtures et blocs de code dans listes et citations : non lus par l'amont non plus pour les tokens DESIGN.md (307 tests amont verts + 2 tests src).

Reste : rafraîchissement du jeton gcloud sur 401 (cache 45 min), tests différentiels contre remark sur un corpus.
