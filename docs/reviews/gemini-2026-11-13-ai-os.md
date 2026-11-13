# Revue Gemini : packages/ai-os (fusion de aphrody-labs/agent)

- Date : 2026-11-13. Moteur : gemini.google.com, modèle Carbon High (claude-in-chrome), conversation 571d66aba4c63013.
- Objet : commit f2df75e (src/llm, src/relay/agent-tools.ts, protocols.ts, cli.ts, gateway, core/agent.ts, tui).
- Note : 11/20.

## Corrections appliquées (commit suivant)

- llm/schema.ts : clés propres uniquement (Object.hasOwn), propriété optionnelle undefined acceptée, number fini, objet sans properties contrôlé.
- llm/generate.ts : outils résolus par Object.hasOwn, sortie undefined sérialisée en null, AbortSignal vérifié entre outils.
- llm/model.ts : réponse non JSON ou error en HTTP 200 rejetée, contenu multi-parties, identifiants de tool call uniques, modèle vide refusé, embeddings triés par index et comptés, llmAsk déplacé ici (cycle models <-> model rompu), signal sur les modèles CLI.
- llm/agents.ts : agy et claude sortis de relay/backends.ts (plus de dépendance llm -> relay), délai borné ; models.ts : `agy models` avec délai et code de retour, RELAY_OPENAI_ENDPOINTS découpé au premier =, filtre en sous-chaîne (plus de RegExp client).
- relay/protocols.ts : arguments validés contre inputSchema (-32602), structuredContent seulement pour un objet, lot vide et éléments invalides en -32600, pas de réponse aux notifications, liste A2A_SKILLS partagée par la carte et SendMessage.
- relay/agent-tools.ts : cwd confiné à AGENT_HOME, dossier créé, schémas via llm/schema, membres du conseil vérifiés.
- relay/cli.ts mcp-stdio : UTF-8 en flux, -32700 sur JSON invalide, requêtes en parallèle.
- gateway : /channels/:id exige le jeton sauf Channel.verify, idleTimeout 255, file de session nettoyée, comparaison du jeton en temps constant.
- core/agent.ts : sources par défaut avant la config, journal AGENT_DEBUG sans plantage.
- tui : plus de process.exit dans startTui, spinner unique et saisie en pause, blocs de code et code en ligne préservés.

## Non retenu

- `claude/default` : alias de la CLI (modèle par défaut du compte), pas un modèle codé en dur ; découverte par présence de la CLI, l authentification est vérifiée à l appel.
- Mise en cache de Memory par home et TTL des sessions de la passerelle : hors périmètre de la fusion.

## Verdict brut

Note : 11/20

Le découpage souffre de failles de sécurité (contournement d'authentification sur la passerelle, absence de validation des schémas sur MCP/RPC/A2A, traversée de répertoire via cwd), de violations protocolaires bloquantes (MCP structuredContent invalide, JSON-RPC 2.0 lot/notifications non conformes, timeout HTTP Bun à 10 s), de crashs à l'exécution (TypeError sur undefined et clés de Object.prototype) et d'écarts directs avec la promesse d'architecture (claude/default codé en dur, couplage circulaire et remontant llm vers relay).

1. Pont de modèles (src/llm)

packages/ai-os/src/llm/schema.ts (lignes 56–57, 77–87) — Collision Object.prototype, rejet des propriétés optionnelles undefined et validation incomplète

Défaut : schema.properties[k] (ligne 82) et o[k] (ligne 80) accèdent à la chaîne de prototypes : une entrée contenant constructor, toString ou valueOf contourne additionalProperties: false et required. Si un appelant passe { scope: undefined } pour un champ optionnel, Object.entries(o) l'évalue et échoue (expected string, got undefined). Si schema vaut { type: "object", additionalProperties: false } sans properties, ligne 77 ignore required et additionalProperties. Enfin, t === "number" (ligne 56) accepte NaN et Infinity.

Correction :

TypeScript
if (t === "integer" ? !Number.isInteger(value) : t === "number" ? typeof value !== "number" || !Number.isFinite(value) : t && t !== kind)
return [`${path}: expected ${t}, got ${kind}`];
// ...
if (kind === "object") {
const o = value as Record<string, unknown>;
const props = schema.properties ?? {};
for (const k of schema.required ?? [])
if (!Object.hasOwn(o, k) || o[k] === undefined) out.push(`${path}.${k}: required`);
for (const [k, v] of Object.entries(o)) {
if (v === undefined && !(schema.required ?? []).includes(k)) continue;
if (Object.hasOwn(props, k)) out.push(...validate(props[k]!, v, `${path}.${k}`));
else if (schema.additionalProperties === false) out.push(`${path}.${k}: unexpected`);
}
}

packages/ai-os/src/llm/generate.ts (lignes 45–46, 83–105) — Crash TypeError sur noms d'outils hérités, content: undefined sur retour void, et AbortSignal ignoré

Défaut : Ligne 84, const t = o.tools?.[call.name] résout Object.prototype.constructor ou toString comme défini, puis appelle validate(undefined!, call.input) (ligne 89) hors du bloc try/catch (lignes 92–96), provoquant un TypeError non intercepté. Lignes 45–46, JSON.stringify(undefined) renvoie undefined : si t.execute() ne retourne rien, Message.content vaut undefined (ligne 103), ce qui provoque un HTTP 400 sur l'étape suivante des API compatibles OpenAI. Lignes 83–105, o.signal n'est jamais vérifié entre deux outils.

Correction :

TypeScript
const stringify = (v: unknown): string =>
typeof v === "string" ? v : JSON.stringify(v ?? null);
// ... dans la boucle for (const call of r.toolCalls) :
o.signal?.throwIfAborted();
const t = o.tools && Object.hasOwn(o.tools, call.name) ? o.tools[call.name] : undefined;

packages/ai-os/src/llm/model.ts (lignes 4, 96–110, 128–139, 149–153, 182–225) — Contrat manquant, IDs d'outils dupliqués, silence sur erreurs HTTP 200, et validation absente

Défaut :

Ligne 4 annonce resolveEmbedder() qui n'existe pas dans le module.

Ligne 96 : await r.json().catch(() => ({})) sur un statut 200 renvoyant du HTML (portail captif/proxy) ou une erreur amont { error } (cas OpenRouter en cours de réponse) retourne silencieusement { text: "", finishReason: "stop" }.

Ligne 104 : c.id ?? "call_" + i réinitialise i à 0 à chaque étape de generateText, produisant plusieurs call_0 dans le même historique et faisant échouer les fournisseurs stricts en HTTP 400.

Ligne 110 : String(msg.content) sérialise en "[object Object]" les réponses multi-parties (Array).

Lignes 128–139 et 149–153 : flatten() perd m.toolCalls sur les tours assistant et cliModel ignore req.signal.

Lignes 185–194 : resolveModel("ollama") passe mid = "" sans erreur ; resolveModel ne vérifie pas await p.available(), alors que ollama, antigravity et claude sont poussés inconditionnellement dans providers().

Lignes 198 et 221 : providerEmbedder n'exige pas de nom de modèle non vide, ne trie pas j.data par d.index et ne vérifie pas la cardinalité du lot retourné.

Correction : Exporter réellement resolveEmbedder(), remplacer le repli d'ID par crypto.randomUUID(), extraire le texte si Array.isArray(msg.content), rejeter !mid dans resolveModel et providerEmbedder, vérifier if (!r.ok || j.error) sans masquer un JSON invalide, et trier j.data par index.

packages/ai-os/src/llm/models.ts (lignes 16–17, 47–59, 105, 118, 122, 145, 169–191, 216, 233) — Modèle codé en dur, dépendance inverse llm vers relay, RegExp non échappée et Bun.spawn sans timeout

Défaut :

Lignes 16–17 : src/llm/models.ts importe ../relay/backends.ts (inversion de couche : llm dépend de relay) et crée un cycle d'import avec ./model.ts.

Lignes 184–191 : contrairement à l'en-tête et au message de commit (« aucun modèle codé en dur », « CLI authentifiée »), claude/default est codé en dur (ligne 187) et available() teste uniquement Bun.which("claude") / Bun.which("agy") (présence binaire, pas l'authentification). Conséquence critique : defaultModelId() (model.ts:175) peut sélectionner claude/default (tools: false) comme modèle par défaut de l'agent outillé.

Lignes 47–59 et 171 : run(["agy", "models"]) n'a aucun timeout (bloque listModels() indéfiniment si la CLI attend une saisie) et ignore code !== 0.

Ligne 105 : pair.split("=") tronque toute URL de RELAY_OPENAI_ENDPOINTS contenant un paramètre de requête =.

Lignes 118, 122, 145 : available: async () => true ment hors-ligne, et openrouter (ligne 122) omet bearer(env("OPENROUTER_API_KEY")).

Ligne 216 : new RegExp(filter, "i") lève une SyntaxError sur entrée utilisateur/MCP contenant [ ou ( et expose au ReDoS.

Ligne 233 : llmAsk retourne le paramètre model brut (potentiellement undefined via A2A) au lieu de m.id.

Correction : Déplacer les exécuteurs CLI bas niveau dans src/llm/ (et llmAsk dans model.ts pour briser le cycle), utiliser pair.indexOf("=") pour découper name et url, ajouter timeout + vérification code === 0 dans run(), échapper filter (RegExp.escape ou recherche sous-chaîne insensible à la casse), retourner m.id dans llmAsk, et préférer dans defaultModelId() un modèle supportant tools: true ou vérifier l'état d'authentification réel des CLIs.

packages/ai-os/src/llm/testing.ts (lignes 19–20) — Signal d'annulation ignoré dans le modèle de test

Défaut : scriptedModel efface signal: undefined sans appeler req.signal?.throwIfAborted(), empêchant tout test unitaire d'annulation.

Correction : Appeler req.signal?.throwIfAborted() en ligne 20 avant calls.push(...).

2. Boucle agent et passerelle (src/core, src/gateway)

packages/ai-os/src/core/agent.ts (lignes 13–26, 28–31, 37–47, 53–73) — Crash AGENT_DEBUG, réindexation complète à chaque tour, contournement du mask et absence d'AbortSignal

Défaut :

Ligne 69 : si un outil retourne undefined sans erreur avec AGENT_DEBUG=1, JSON.stringify(t.error ?? t.output) renvoie undefined et .slice(0, 300) lève un TypeError fatal.

Lignes 37–41 : chaque tour de parole ouvre une nouvelle connexion SQLite, relance skills.sync() et indexHomeDocs() sur tout le disque, puis referme la base — provoquant une contention SQLITE_BUSY entre sessions concurrentes de la passerelle et une latence E/S inutile à chaque message.

Lignes 43–45 et 57–62 : sources: ["memory", "skill", "research", "doc"] écrase cfg.context.sources dès que o.mask?.sources est absent, et o.mask n'est pas transmis à makeTools(...), permettant à l'agent d'interroger directement les outils mémoire/skills hors masque.

Lignes 28–31 et 54 : INSTRUCTIONS ordonne d'appeler skill_create, skill_view et memory_add même quand o.model.tools === false (modèles CLI), induisant des appels d'outils hallucinés en texte brut.

Lignes 13–26 : RunOptions n'accepte aucun signal?: AbortSignal.

Correction :

TypeScript
// Ligne 69 :
console.error(`[tool] ${t.call.name} ${(JSON.stringify(t.error ?? t.output) ?? "undefined").slice(0, 300)}`);
// Lignes 42–47 : placer sources par défaut AVANT ...cfg.context, propager mask dans makeTools,
// adapter INSTRUCTIONS selon o.model.tools, ajouter signal?: AbortSignal dans RunOptions,
// et partager/mettre en cache l'instance Memory + indexation par home.

packages/ai-os/src/gateway/index.ts (lignes 54, 58, 80–85, 88–130) — Faille d'authentification critique sur /channels/:id, timeout Bun à 10 s, fuite mémoire et collision de session OpenAI

Défaut :

Critique (lignes 56, 119–130) : /channels/:id ne vérifie jamais authed(req), alors que webhookChannel("webhook") est activé par défaut (ligne 56) sans vérification de signature. Même avec o.token défini (et allowShell: true), n'importe quel client peut exécuter des tâches agent via POST /channels/webhook sans jeton.

Critique (lignes 83–85) : Bun.serve utilise idleTimeout = 10 s par défaut ; toute exécution agent dépassant 10 secondes sur /v1/chat/completions ou /channels/:id est coupée brutalement par Bun.

Fuite mémoire (lignes 54, 58–78) : sessions et queue croissent indéfiniment sans TTL ni plafond LRU (queue conserve même les promesses résolues).

Protocole /v1/chat/completions (lignes 92–117) : l'historique fourni dans j.messages et le modèle j.model sont ignorés (seul le dernier message user est lu), j.stream === true n'est ni géré ni rejeté en 400, req.json() hors try/catch renvoie 500 sur JSON malformé, et tous les clients standard sans user ni x-session partagent la même session globale "openai" (fuite de contexte inter-utilisateurs).

Sécurité (lignes 80–81, 136) : comparaison du secret par === non constante en temps (et si o.token est undefined, searchParams.get("token") !== o.token ligne 136 est court-circuité par !authed(req), mais la comparaison directe reste fragile).

Correction : Protéger /channels/:id par authed(req) (ou exiger une méthode verify(req) explicite par Channel), configurer idleTimeout: 255 dans Bun.serve, nettoyer queue en .finally(), borner sessions (LRU + TTL), ne persister une session OpenAI que si x-session ou j.user est explicitement fourni (sinon passer j.messages sans état partagé), et comparer le jeton via crypto.timingSafeEqual.

3. Relais MCP / A2A et CLI (src/relay, src/cli.ts)

packages/ai-os/src/relay/protocols.ts (lignes 46–52, 65, 86–92, 136–143, 162, 184, 208–212, 240–253) — Violation du schéma MCP structuredContent, absence de validation d'arguments et crash JSON-RPC en lot

Défaut :

Critique MCP (ligne 141) : structuredContent: v injecte directement v même quand v est une string (memory_search, memory_add, skills_list, council). Or la spécification MCP impose que structuredContent soit un objet JSON : les clients stricts (Claude Code, SDK officiel MCP) rejettent la réponse tools/call.

Validation absente (lignes 46–52) : call() exécute t.run(args ?? {}) sans appeler validate(t.inputSchema, args ?? {}) (contrairement au commentaire de llm/schema.ts:2).

Crash JSON-RPC (lignes 47, 87, 244–251) : dans un lot (Array.isArray(body)), les éléments ne sont pas validés avant h(b as Req) : envoyer [null] fait planter mcpRpc ligne 87 (r.params sur null hors du try) avec un TypeError non géré ; envoyer { "jsonrpc": "2.0" } sans method fait planter call() ligne 47 (name.includes sur undefined) ; envoyer un lot vide [] retourne null au lieu de l'erreur -32600 exigée par JSON-RPC 2.0 §6.

Notifications JSON-RPC (lignes 65, 89, 162, 197) : une requête sans id (r.id === undefined) retourne un objet error (id: null), violant JSON-RPC 2.0 §4.1.

Désynchronisation A2A (lignes 184 vs 208–212) : agentCard publie dynamiquement tout outil filtré par /ask|review|agent_run/, tandis que a2aRpc bloque par une liste blanche figée en expression régulière.

Correction :

TypeScript
// Dans call() :
const input = args ?? {};
const bad = validate(t.inputSchema as JsonSchema, input);
if (bad.length) throw Object.assign(new Error(bad.join("; ")), { code: -32602 });
return t.run(input);

// Dans mcpRpc tools/call (lignes 138–143) :
const isObj = v !== null && typeof v === "object" && !Array.isArray(v);
return ok(r.id, complete({
content: [{ type: "text", text: text(v) }],
...(isObj ? { structuredContent: v } : {}),
isError: false,
}));

// Dans dispatch() : rejeter [] avec fail(null, -32600, ...), valider chaque élément
// (objet + jsonrpc === "2.0" + typeof method === "string"), et retourner null si r.id === undefined sur erreur.

packages/ai-os/src/relay/agent-tools.ts (lignes 14–28, 37–60, 84, 104–112) — Escalade de répertoire via cwd, crash base absente et duplication des constructeurs de schéma

Défaut :

Ligne 109 : cwd: a.cwd ?? home() autorise tout client MCP/A2A/RPC à cibler n'importe quel répertoire système (/, /etc, clés SSH) sans confinement.

Lignes 21–28 et 58 : new Memory(join(home(), "memory.sqlite")) n'appelle pas mkdirSync(home(), { recursive: true }) (crash SQLite si ~/.agent n'existe pas encore) et recode les chemins au lieu d'utiliser layout(home()) (../core/home).

Lignes 14–20 : redéfinit str et obj au lieu d'utiliser s de ../llm/schema.

Ligne 84 : CLI[id] sans Object.hasOwn(CLI, id), et council appelé même si ids.length === 0.

Correction : Importer s depuis ../llm/schema et layout depuis ../core/home, créer mkdirSync(home(), { recursive: true }) dans withMemory, vérifier Object.hasOwn(CLI, id) et ids.length, et restreindre cwd à une racine autorisée (ou l'interdire à distance sauf configuration explicite).

packages/ai-os/src/relay/cli.ts (lignes 21, 70–87, 92–110) — Corruption UTF-8 et code d'erreur invalide en mcp-stdio, altération des prompts dans ask, exposition du jeton dans mcp-add

Défaut :

Ligne 72 : Buffer.from(chunk).toString("utf8") décode chaque fragment stdin isolément ; un caractère UTF-8 multi-octets coupé à la frontière d'un chunk est corrompu en U+FFFD.

Lignes 78–83 : un JSON malformé est transformé en null, produisant -32600 (Invalid Request) au lieu de -32700 (Parse error), et await dispatch(...) bloque la lecture de stdin en série (impossible de traiter notifications/cancelled pendant un appel long).

Ligne 21 : rest.filter((w) => !w.startsWith("--")) supprime silencieusement tous les mots commençant par -- contenus dans le prompt utilisateur (ex. options CLI dans une question technique).

Lignes 94–108 : mcp-add expose le jeton Bearer en clair dans les arguments du processus (ps aux) et n'échoue pas si p.exitCode !== 0.

Correction : Utiliser new TextDecoder("utf-8") en mode { stream: true } sur process.stdin, renvoyer -32700 si JSON.parse échoue, détacher l'exécution asynchrone de dispatch de la boucle de lecture, parser uniquement les options connues (--claude, --web, --headful) sans filtrer le reste du prompt, et propager process.exit(p.exitCode) dans mcp-add.

4. TUI native (src/tui)

packages/ai-os/src/tui/index.ts (lignes 25–35, 66, 90–120) — process.exit(0) intempestif, corruption du Markdown / blocs de code, fuite d'intervalle et collision d'affichage

Défaut :

Lignes 111 et 119 : startTui appelle process.exit(0) en sortie de boucle et sur SIGINT, tuant brutalement le processus hôte ou le lanceur bun test lorsqu'on lui injecte o.input / o.output (pourtant prévus aux lignes 13–14). Sur SIGINT, busy(false) n'est même pas appelé pour nettoyer le spinner ni annuler le run() en cours.

Lignes 22–35 : renderMarkdown traite le texte ligne par ligne sans détecter les blocs de code ``` : les commentaires # ... (Bash, Python, TOML) perdent leur # (ligne 26), et les expressions régulières gras/italique s'appliquent à l'intérieur du code en ligne `...`.

Lignes 31 et 66 : _tools: ${r.toolCalls.join(", ")}_ échoue systématiquement à passer en italique dès qu'un nom d'outil contient un underscore (memory_search, agent_run, etc.), car [^_]+ refuse _, laissant les underscores bruts à l'écran.

Lignes 91–99 : appeler busy(true) deux fois de suite écrase spin sans clearInterval, créant un setInterval fantôme infini ; de plus, rl.pause() n'est pas appelé pendant l'attente, mêlant la saisie clavier au \r du spinner.

Correction : Retirer process.exit(0) de startTui (laisser rl.close() terminer proprement la fonction et utiliser un AbortController sur SIGINT pour interrompre le run() actif), appeler clearInterval(spin) en début de busy(true) ainsi que rl.pause() / rl.resume(), utiliser directement styleText("italic", ...) ou un bloc dédié pour l'affichage des outils (ligne 66), et isoler les blocs ``` ainsi que les segments `...` avant d'appliquer le formatage gras/italique/titres dans renderMarkdown.

## Re-revues (même chat, 2026-11-13) : 11 -> 14,5 -> 17,5 -> 18,5/20

- Tour 1 (a3a0b08 : Memory partagé acquire/release, sessions TTL/LRU/historique borné) : 14,5/20. Relevé : coupe de l'historique entre tool_call et résultat, SQLITE_CANTOPEN sur home neuf, évasion du cwd par lien symbolique, session OpenAI globale partagée, 500 sur JSON invalide, stream ignoré, notifications JSON-RPC avec réponse, id/params non validés, _meta écrasé, stringify sur BigInt, masque contourné par les outils, pas de signal, longueur du jeton exposée, défaut sur un modèle sans outils. Réfutation partiellement acceptée : `claude/default` alias de CLI.
- Tour 2 (c644c1d, tout corrigé) : 17,5/20. Réfutée et acceptée : pas de transaction entrelacée (transactions bun:sqlite synchrones). Relevé : historique OpenAI sans état perdu, parties de contenu, -32602 non appliqué au schéma, trame WS null, file par session affamant le global, Origin /ws, redact absent de memory_search, indexation non portée par le store, :memory:.
- Tour 3 (edcfb12) : 18,5/20, aucun défaut critique ni majeur. Restes moyens/mineurs corrigés ensuite (Origin exigée locale sur tous les POST sans jeton, comptage de file 1 actif + N en attente, historique sans état tronqué avant le tour, 499 sur client parti, prompt vide 400, stop() idempotent, tableau de params refusé avant le hub) ; tests ai-os 95/95.
