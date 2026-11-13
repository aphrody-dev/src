# Revue Gemini 2026-11-13 : packages/vault, infra/vault

- Moteur : antigravity (170792 ms), via le relais (`gemini_review`), lot de 40 Ko : vault-host.sh, crypto.ts, sync.ts, chrome.ts, hosts.ts, store.ts
- Note : 10/20

## Suite donnée

| #                     | Grief                                          | Suite                                                                                                                                                                                                                                                                 |
| --------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                     | émetteur non authentifié, rejeu, MANIFEST vide | corrigé en partie : `# seq` monotone refusé si non croissant (rejeu), MANIFEST vide refusé sans `# allow-empty`, entrées non régulières refusées. Signature non ajoutée : pousser exige une session ssh de l'utilisateur, qui lit déjà son credstore (même frontière) |
| 2                     | révocation en mode ouvert (readdir, registre)  | corrigé : `listSecrets` et `loadRegistry` lèvent hors ENOENT                                                                                                                                                                                                          |
| 3                     | receive non atomique, sans verrou              | corrigé : `flock` sur tout le script, `mv -T` ; `apply` sans `inbox/MANIFEST` n'applique ni ne révoque rien                                                                                                                                                           |
| 4                     | blob DPAPI renommable (nom hors entropie)      | corrigé (2e passe) : format v2 `AYD2` + entropie `aphrody/vault/dpapi/v2                                                                                                                                                                                              | <NOM>`, lecture v1 et v2, écriture v2 (migration paresseuse), dans vault, env-kit et la crate Rust ; test : blob renommé refusé |
| 5                     | injection via `fp NAME`                        | corrigé : `assertName` avant ssh                                                                                                                                                                                                                                      |
| 6                     | rétrogradation Hello silencieuse               | documenté : Hello optionnel tant que non enrôlé ; le résultat d'import expose `hello`                                                                                                                                                                                 |
| 7                     | verrou de sync                                 | corrigé : reprise si le PID détenteur est mort                                                                                                                                                                                                                        |
| 8                     | échecs invisibles de la tâche                  | corrigé : `state/last-error.json` ; `last-sync.json` par hôte                                                                                                                                                                                                         |
| 9                     | retrait d'hôte                                 | corrigé (2e passe) : `vault host remove <hôte>` = `decommission` sur l'hôte (révocation, identité, timer, état, script), purge de l'outbox, retrait de hosts.toml, policy.toml et du registre                                                                         |
| 10                    | apply en échec chronique                       | corrigé : sortie 0, échecs par nom comptés                                                                                                                                                                                                                            |
| 11                    | perte de clé avec `--force`                    | corrigé : `identity.old` conservé jusqu'à un apply sans échec                                                                                                                                                                                                         |
| 12                    | épinglage du destinataire                      | accepté : le destinataire arrive par ssh à clé d'hôte épinglée et part dans git (revue au diff)                                                                                                                                                                       |
| 13                    | timer utilisateur, linger, outils              | corrigé : linger signalé, `XDG_RUNTIME_DIR` posé, timer exigé `active`, outils vérifiés                                                                                                                                                                               |
| 14                    | schtasks InteractiveToken, execPath            | corrigé en partie (2e passe) : déclencheurs logon et `SessionUnlock`, tâche S4U `aphrody-vault-push` qui pousse les enveloppes déjà scellées sans DPAPI ; reste : sceller exige la session (documenté)                                                                |
| 15                    | séparation de domaine                          | corrigé : clé d'empreinte dérivée (HMAC « aphrody/vault/fp-key/v1 »)                                                                                                                                                                                                  |
| 16                    | création concurrente de la clé maîtresse       | corrigé : création exclusive (`.master.lock`, relecture)                                                                                                                                                                                                              |
| 19                    | écritures non atomiques                        | corrigé : `.age` et systemd-creds par fichier caché puis rename                                                                                                                                                                                                       |
| 22                    | BLAKE3 nu par `fp`                             | accepté pour les preuves sur valeurs aléatoires ; les index sont des HMAC                                                                                                                                                                                             |
| 17, 18, 20, 21, 23-26 | moyens                                         | consignés ; `shred` et clichés VSS déjà dans le modèle de menace                                                                                                                                                                                                      |

## Texte de la revue

**Note : 10/20.** Le schéma est sain (age par hôte, HMAC, AAD). Les défauts viennent de l'absence d'authentification de l'émetteur, de la révocation qui échoue en mode ouvert et de la concurrence. Je n'ai pas pu relire `age.ts`, `doc.ts`, `paths.ts`, `win/pool.ts` ni `VAULT.md`, et je n'ai rien exécuté. Les lignes sont celles de chaque fichier, pas celles du prompt.

## Critiques

1. **Aucune authentification de l'émetteur** (`vault-host.sh:42-52`). Le MANIFEST ne garantit que l'intégrité. Quiconque peut ouvrir une session ssh peut pousser des enveloppes chiffrées vers la clé publique de l'hôte. Un tar avec un MANIFEST vide est accepté, et `apply` révoque alors tout (`:66-70`). Rien n'empêche non plus le rejeu d'un ancien tar, qui ressuscite des secrets révoqués. Correction : signer le MANIFEST (clé age ou minisign du PC) avec un numéro de séquence monotone vérifié par l'hôte.
2. **Révocation qui échoue en mode ouvert**
   - `listSecrets` avale les erreurs de `readdir` (`store.ts:121-123`). Un dossier momentanément illisible donne `names=[]`, donc `want=[]` (`sync.ts:107-118`), donc des enveloppes supprimées (`:136-142`) et un MANIFEST vide. Tous les hôtes révoquent alors tous leurs credentials.
   - `loadRegistry` renvoie `{}` sur toute erreur (`hosts.ts:81-87`). Tous les noms deviennent des `token` et prennent le scope par défaut. Si `defaults.token` contient un hôte, des documents partiraient vers les hôtes. Je suppose ici que les documents sont dans le même store, car `doc.ts` n'est pas fourni.
   - Correction : lever l'erreur sur tout ce qui n'est pas ENOENT, et refuser un MANIFEST vide sans option explicite.
3. **`receive` non atomique et sans verrou** (`vault-host.sh:51`). Un crash entre les deux `mv` laisse `inbox` absent. Le `apply` suivant révoque alors tout. Le timer `apply` peut aussi s'exécuter pendant l'échange. Correction : `flock` sur tout le script, et échange par `mv -T` (ou `renameat2 RENAME_EXCHANGE`).
4. **Substitution de fichiers DPAPI** (`store.ts:62`). `protect` n'utilise pas `name`, contrairement à la branche systemd-creds. Renommer le blob de A en B est indétectable. Correction : passer `name` en entropie optionnelle dans `dpapiProtect`. Il faut migrer le format v1 ou accepter les deux.
5. **Injection de commande distante** (`sync.ts:247`). `secret` est interpolé dans la commande ssh. Le script valide ensuite, mais le shell distant a déjà interprété `x; …`. Correction : appeler `assertName(secret)` avant l'appel, ou quoter la valeur.
6. **Rétrogradation silencieuse de Hello** (`crypto.ts:75-76`)
   - `helloAvailable` met `.catch(() => ({key:false}))` et accepte `VAULT_HELLO=0`.
   - `importChromeCsv` scelle alors les mots de passe sans Hello (`chrome.ts:65`) et le signale seulement par `hello:false`.
   - Correction : échouer si un document est marqué Hello-requis, et refuser la variable d'environnement pour les documents sensibles.
7. **Verrou de synchronisation** (`sync.ts:59-74`)
   - La reprise d'un verrou périmé est un TOCTOU : deux processus peuvent se supprimer mutuellement leur verrou frais (`:63`).
   - Le `rm` du `finally` peut retirer le verrou d'un autre processus.
   - Si la tâche est tuée par la limite PT10M (`:295`), le verrou reste 15 minutes et trois cycles de 5 minutes échouent.
   - Correction : verrou à durée de vie liée au processus (`LockFileEx` ou un mutex nommé).
8. **Échecs invisibles dans la tâche planifiée** (`sync.ts:295`, `:197`). `conhost --headless` jette stdout et stderr. `last-sync.json` n'est pas écrit si `sync()` lève une exception (verrou pris, erreur DPAPI, `b3sum` introuvable). Aucun journal n'existe. Correction : `try/catch` autour de `main` qui écrit `state/last-error.json` et l'Event Log, et ajouter `RestartOnFailure`.
9. **Revocation de l'hôte non couverte** (`sync.ts:108`). Un hôte retiré de `hosts.toml`, ou sans recipient, est ignoré sans effacement : ses credentials restent. Il n'y a pas de commande `host revoke` ni de rotation des secrets eux-mêmes, et `rotateHost` ne change que l'identité. Correction : ajouter un `hosts decommission` qui pousse un MANIFEST vide signé, plus `rotate-secrets`.

## Majeurs

10. **`apply` en échec chronique** (`vault-host.sh:59,73` et `sync.ts:184-187`). Un seul nom invalide ou une seule enveloppe indéchiffrable fait sortir `apply` en code 1. `push` ne mémorise alors jamais l'état (`sync.ts:187`) et repousse tout toutes les 5 minutes. Correction : séparer le code de sortie de transport de celui d'application, et mettre en quarantaine les noms invalides.
11. **Perte de la clé de l'hôte avec `--force`** (`vault-host.sh:33-36`). L'ancienne identité est écrasée sans conservation. Les enveloppes déjà en inbox deviennent indéchiffrables jusqu'au prochain push. Correction : garder l'ancienne identité sous `.old` jusqu'à ce que `apply` réussisse.
12. **Pas d'epinglage de la clé à `init`** (`sync.ts:231-233`, `hosts.ts:55-70`). Le recipient lu via ssh remplace silencieusement celui du dépôt, sans confirmation hors bande. `setRecipient` réécrit `hosts.toml` sans verrou ni écriture atomique (`:69`). Deux `init` simultanés perdent une mise à jour. Les commentaires de fin de ligne sont aussi supprimés.
13. **Timer systemd en mode utilisateur** (`sync.ts:215,222`). Il n'y a pas de `loginctl enable-linger`, et `XDG_RUNTIME_DIR` manque dans une session ssh non interactive. `systemctl --user` échoue souvent. `installHost` masque l'échec (`>/dev/null 2>&1`) et ne lève rien si le timer n'est pas actif. Il ne vérifie pas non plus que `age`, `age-keygen`, `b3sum` et `systemd-creds` existent sur l'hôte.
14. **`schtasks`** (`sync.ts:276-284,302-303`)
    - `InteractiveToken` signifie qu'il n'y a ni synchronisation ni révocation tant que la session est fermée ou verrouillée.
    - `process.execPath` est figé à l'installation et casse silencieusement à la mise à jour de bun.
    - `USERDOMAIN` ou `USERNAME` absents donnent `undefined\undefined`.
    - `--headless` n'est pas un contrat documenté.
15. **Les clés AES et HMAC viennent de la même master key** (`crypto.ts:68` et `:92`). La clé AES-GCM du chemin non-Hello est la master directe. Elle sert aussi de clé HMAC pour les empreintes. Pas de séparation de domaine. Correction : HKDF avec des étiquettes distinctes.
16. **Master key créée sans exclusion mutuelle** (`crypto.ts:41-48`, `sync.ts:81-87`). Deux processus qui démarrent à vide créent deux clés, et la seconde écrase la première. Les documents scellés avec la première sont perdus. `initPc` a la même fenêtre de course. Correction : création exclusive (`wx`) puis relecture.

## Moyens

17. `locate()` choisit le fichier le plus récent parmi le store et ses dossiers legacy (`store.ts:34-43`). Une copie ancienne restaurée avec un mtime plus récent écrase la valeur courante, ce qui annule une rotation. Préférer le dossier principal.
18. Les noms valides sur NTFS posent des problèmes (`store.ts:15`)
    - `NUL`, `CON`, `AUX` et `COM1` résolvent vers des périphériques, même avec le suffixe `.dpapi`.
    - `Foo` et `FOO` collisionnent (`.age` côté outbox).
    - Le point final est supprimé.
19. Écritures non atomiques
    - `setSecret` systemd écrit directement sur le fichier final (`store.ts:88`).
    - `writeFile` des `.age` ne passe pas par tmp puis rename (`sync.ts:131`). Un fichier tronqué avec index inchangé est poussé comme valide, et le MANIFEST le couvre.
    - Sur le backend systemd, `listSecrets` expose tout fichier parasite qui valide `NAME`, comme `x.tmp` (`store.ts:125`).
20. `b3Files` passe tous les chemins en argv (`crypto.ts:144`). La limite d'environ 32 Ko de la ligne de commande Windows est atteinte vers 300 secrets. Passer les chemins par stdin avec `--no-names`.
21. `resolveSecret` retombe sur `process.env` si le store est illisible (`store.ts:165-176`), ce qui masque une panne DPAPI en tâche planifiée. `runWithSecrets` en mode `pipe` ignore tous les noms sauf le premier (`:157`). Il permet aussi d'écraser `PATH` ou `NODE_OPTIONS` via un secret de ce nom.
22. L'empreinte BLAKE3 non keyée d'un secret circule par ssh (`vault-host.sh:76-80` et `sync.ts:247`, `localFingerprint`). Elle est brute-forçable pour les secrets de faible entropie. Cela contredit le commentaire de `crypto.ts:68` qui interdit un hash non keyé d'un secret. Utiliser un HMAC avec challenge.
23. `chrome.ts`
    - La vérification ne compare que le nombre de lignes (`:67-68`), pas le contenu.
    - `shred` est inefficace sur SSD, NTFS et les clichés VSS (`:69`).
    - `exportChromeCsv` écrit les mots de passe en clair, sans `flag:"wx"`, et le `mode:0o600` n'a aucun effet sous Windows (`:76-77`).
    - Un BOM UTF-8 casse la détection des en-têtes.
    - La fusion « le dernier fichier gagne » écrase une valeur plus récente par une plus ancienne (`:60`).
24. `hosts.ts:42-49` ne valide pas le schéma. `ssh` en chaîne est étalé caractère par caractère dans argv. Un nom d'hôte commençant par `-` s'injecte comme option. `VAULT_HOSTS_FILE` et `VAULT_POLICY_FILE` redirigent par variable d'environnement. Le registre non signé (`registry.json`) peut élargir un scope (`hosts.ts:103-107`).
25. La protection DPAPI avec entropie v1 statique donne tout accès à n'importe quel processus du même utilisateur. De même, le credential systemd lié à la clé de l'hôte, sans TPM, ne protège que par les permissions du fichier.
26. Défauts de forme dans `vault-host.sh`
    - La ligne 76 (`fp`) sort silencieusement avec un code 1 si la validation échoue.
    - `hash()` masque le builtin bash (`:27`).
    - `"${USERFLAG[@]}"` sous `set -u` casse sur bash < 4.4.
    - Le PATH est complété par la fin (`:17`).
    - `process substitution <(identity)` masque l'échec de décryptage de l'identité (`:62`).
    - Un `.new` abandonné par un crash n'est jamais nettoyé.
    - `receive` accepte des liens symboliques et physiques dans le tar (`:41`). Ajouter `--no-same-owner` ne suffit pas : vérifier le type de chaque entrée.

## Passe 2 (12/20, antigravity)

Suite : 1-3 corrigés (`dropTable` borné à la table, tableaux de `policy.toml` comparés en chaîne, trois fichiers validés par `Bun.TOML.parse` avant écriture atomique) ; 4-5 corrigés (`removeHost` sous verrou, garde `pc` en tête) ; 6 corrigé (drapeaux filtrés) ; 7 corrigé (timer et service arrêtés d'abord, verrou tenu jusqu'à la sortie) ; 8 corrigé (migration à la lecture, `migrate-dpapi`, marqueur v2-only en TS, env-kit et Rust) ; 9 corrigé (MANIFEST exigé) ; 10-14 corrigés (erreurs `schtasks` levées, S4U à 15 min, commentaires) ; tests ajoutés : refus v1 après marqueur, garde `pc`, XML des deux tâches, `infra/vault/test-host.sh` (9/9 sur fr1). Restent : 15 (primitive DPAPI brute exportée pour les tests), 17 (constantes v2 recopiées en trois langages sans vecteur partagé).

### Texte

**Note : 12/20**

La note monte de 2 points grâce au format v2 et à la symétrie TS/Rust. Elle reste limitée par un bug de config (`dropTable`), une race non verrouillée dans `removeHost`, un repli v1 qui annule la liaison au nom, et l'absence de tests sur le code le plus risqué. Les numéros de ligne sont ceux de la nouvelle version (calculés depuis les en-têtes de hunk, donc approximatifs).

## Défauts bloquants ou majeurs

1. **`hosts.ts` L60-67, `dropTable` supprime des commentaires qui ne lui appartiennent pas.**
   - `skip` reste vrai jusqu'au prochain `[table]`. Les commentaires placés au-dessus de la table suivante sont donc avalés, et le `while` de remontée ne les rattrape pas.
   - Correction : à la première ligne `#` ou vide après le corps de la table, arrêter `skip` ou mettre ces lignes en tampon.
   - Autre cas : la table `[x]` introuvable n'est pas détectée (aucune erreur).

2. **`hosts.ts` L77-79, parsing de `policy.toml` fragile.**
   - La regex ne couvre que les tableaux sur une seule ligne. Un tableau multiligne garde l'hôte supprimé sans erreur.
   - Le `\[(.*)\]` est glouton : un commentaire de fin de ligne contenant `]` casse la ligne.
   - `new RegExp(`"${host}"`)` n'échappe pas `host`. Utiliser une comparaison de chaîne.
   - Une portée qui devient `[]` n'a pas de sémantique vérifiée (« aucun hôte » ou « défaut » ?).
   - Correction : parser le TOML avec un vrai parseur, ou au minimum échouer si l'hôte reste présent après réécriture.

3. **`hosts.ts` L74-83, écritures non atomiques et sans ordre sûr.** `writeFile` direct sur `hosts.toml`, puis `policy.toml`, puis le registre. Un échec au milieu laisse une config incohérente. Correction : tmp + `rename` pour chaque fichier, et lire/valider les trois avant d'écrire.

4. **`sync.ts` L262-269, `removeHost` n'est pas sous `withLock`.**
   - La tâche de 5 min (`sync`/`push-only`) peut recréer `outbox/<hôte>` et l'état après les `rm`, tant que `forgetHost` n'est pas passé.
   - Correction : envelopper tout le corps dans `withLock`.

5. **`sync.ts` ≈L263 et `hosts.ts` L73, garde `pc` trop tardive.** `removeHost("pc")` appelle `hostByName` puis `ssh(... decommission)` avant que `forgetHost` lève « the PC cannot be removed ». Correction : tester `name === "pc"` en première ligne de `removeHost`.

6. **`cli.ts` ≈L204, parsing des arguments.** `const [sub, h] = a` suivi de `flag(a, "--force")`. `vault host remove --force fr1` donne `h = "--force"`, donc un hôte inconnu. Correction : extraire les flags avant de déstructurer.

7. **`vault-host.sh` L71, `flock -u 9` avant `rm -rf "$VAULT"`.**
   - Libérer le verrou laisse un `apply` en attente (timer ou service déjà lancé) s'exécuter pendant ou après la suppression.
   - Le `disable --now` du timer ne stoppe pas un service `apply` en cours.
   - Correction : garder le verrou jusqu'à la sortie, et `systemctl stop aphrody-vault-apply.service` avant la purge.
   - Le fd 9 n'est pas visible dans le diff. S'il n'est pas ouvert avant le `case`, `flock -u 9` échoue sous `set -e`.

8. **`store.ts`, `secret-store.ts` et `local.rs`, repli v1 permanent.**
   - La lecture v1 reste acceptée sans limite, donc la liaison au nom est contournable : copier un blob v1 d'un autre secret sous un nouveau nom.
   - La « migration à l'écriture » ne migre rien tant que le secret n'est pas réécrit.
   - Correction : migration au `get` (réécrire en v2 après lecture réussie d'un v1) ou commande `vault migrate-dpapi`, puis refus du v1 une fois la migration faite.

9. **`sync.ts` L376, `present` redondant et incorrect.**
   - `stat(MANIFEST)` sinon `readdir` donne « le dossier existe ». Un outbox sans MANIFEST (scellement partiel) est donc poussé.
   - `receive` le refuse, ce qui produit une erreur toutes les 5 min.
   - Correction : exiger `MANIFEST`, et ne pousser qu'un outbox cohérent.

## Défauts mineurs

10. **`sync.ts` L362-364, `installTask`.**
    - Le type de retour passe d'un objet à un tableau, ce qui casse l'API exportée de `@aphrody/vault`.
    - Le code de retour de `schtasks` n'est pas propagé en code de sortie.
    - Si la 2ᵉ tâche échoue, la 1ʳᵉ reste installée.

11. **`sync.ts` L322, `LogonTrigger`.** Le délai passe de PT2M à PT1M sans mention dans la doc.

12. **Doublon de tâches.** Pendant la session ouverte, `sync` et `push` s'exécutent toutes deux toutes les 5 min, avec un travail redondant. La tâche S4U pourrait n'avoir qu'un déclencheur au démarrage ou un intervalle plus long.

13. **`hosts.ts` L54, JSDoc mal placé.** « Rewrites one host's recipient… » décrit maintenant `dropTable`, alors qu'il est censé décrire `setRecipient`.

14. **`ffi.ts` ≈L582, commentaire faux.** Il cite `ENTROPY_V2 || name`, constante qui n'existe pas. L'entropie réelle est `aphrody/vault/dpapi/v2|<name>`.

15. **`index.ts` L16.** `dpapiProtectRaw` expose une primitive sans liaison au nom dans l'API publique, uniquement pour un test. `export *` de `store.ts` expose aussi `dpapiEncode`, `dpapiDecode`, `entropyV2` et `isDpapiV2`.

16. **`sync.ts` L266-267, état résiduel.** `last-push.json` conserve l'hôte supprimé. Les noms `*.index.json` et `*.pushed.json` ne sont pas vérifiés dans le diff.

17. **Constantes dupliquées.** v2 est recopié à la main dans trois endroits (env-kit, vault TS, Rust) sans vecteur de test partagé.

18. **`protect` et `unprotect` de `store.ts`.** L'entropie dépend maintenant de l'argument `name`. Si un appelant protège avec un nom et déprotège avec un autre, le déchiffrement échoue. Les appelants ne figurent pas dans le diff, à vérifier.

## Tests

- **Zéro test** pour `removeHost`, `pushOnly`, `vault-host.sh decommission`, ni pour la lecture v1/v2 de la crate Rust. La doc affirme pourtant que Rust lit les deux versions.
- **`vault.test.ts` L647-648** : `.then(() => "opened", () => "refused")` accepte n'importe quelle erreur (fichier absent, FFI en panne), pas seulement le refus DPAPI.
- **`vault.test.ts` L665-667** : l'assertion `InteractiveToken` de la tâche `sync` a été retirée. Rien ne vérifie plus que `push` n'a aucun déclencheur ni que `sync` reste interactive.
- **`vault.test.ts` L673-681** : le test réécrit `policy.toml` avec `forgetHost`. Il faut vérifier que `VAULT_POLICY_FILE` pointe vers un fichier temporaire. Sinon le test modifie `infra/vault/policy.toml` du dépôt.
- **Imports** : `copyFileSync`, `writeFileSync` et `readFileSync` ne figurent pas dans les imports visibles du diff.

## Documentation (`VAULT.md`)

- La phrase « `env-kit secret set` et `vault add` scellent tout de suite » décrit un comportement absent de ce diff, sans code ni test visible.
- Le « testé le 2026-11-13 » et le test de décommissionnement en bac à sable ne sont pas archivés dans le dépôt, donc non reproductibles.
