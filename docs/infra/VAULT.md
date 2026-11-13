# Coffre aphrody (`var/secrets`)

Ce coffre unique sert tout `src`. Il range les jetons et clés d'API, les mots de passe Chromium au format CSV, les documents chiffrés (json, toml, csv, xml, binaire), un SQLite chiffré ligne par ligne, et les sauvegardes des profils Chromium des agents et des données utilisateur. Il est synchronisé vers la flotte sans humain ni agent.

- API TS asynchrone : `packages/vault` (`@aphrody/vault`).
- API Rust : `packages/vault/native` (crate `aphrody-vault`, C ABI pour bun:ffi).
- Commandes : `env-kit vault …`, ou `ay vault …`, qui passe par env-kit. `env-kit secret …` et `ay secret …` sont inchangées et utilisent les mêmes fichiers.
- Côté hôte : `infra/vault/vault-host.sh`, plus `aphrody-vault-apply.timer`.
- Données publiques versionnées : `infra/vault/hosts.toml` (destinataires age), `policy.toml` (portées), `profiles.toml` (chemins à sauvegarder).

## Emplacements

| Hôte | Racine | Couche locale |
|---|---|---|
| PC (Windows) | `C:\src\var\secrets` | `local\<NOM>.dpapi` : DPAPI utilisateur (`CryptProtectData`, entropie `aphrody/env-kit/secret-store/v1`) |
| VPS, utilisateur | `~/.local/share/aphrody/vault` (inbox, applied) | `~/.config/credstore.encrypted/<NOM>` : `systemd-creds --user` |
| VPS, root | idem | `/etc/credstore.encrypted/<NOM>` : `systemd-creds` (clé d'hôte, plus TPM2 si présent) |

Git ignore `var/` : la liste blanche `/*` du `.gitignore` racine ne réinclut pas `var/`. `git check-ignore -v var/secrets/x` renvoie `.gitignore:20:/*`, et `git ls-files var` est vide.

L'ancien magasin `%LOCALAPPDATA%\aphrody\secrets` a migré dans `var\secrets\local` le 2026-11-13 (`env-kit vault init`). Les blobs DPAPI ont été copiés tels quels, sans être déchiffrés, puis contrôlés au déchiffrement : 28 sur 28. L'ancien emplacement reste lisible et le fichier le plus récent l'emporte. Hors monorepo, le paquet npm `@aphrody/env-kit` utilise encore l'ancien emplacement.

Structure de `var\secrets` :

```
local/          couche DPAPI (un fichier par secret ; VAULT_MASTER_KEY, VAULT_AGE_IDENTITY inclus)
docs/           <nom>.<format>.ayv : documents AYV1
outbox/<hôte>/  <NOM>.age (destinataire : cet hôte seul) + MANIFEST (BLAKE3)
backups/<nom>/  <horodatage>.tar.age (profils, données utilisateur ; 3 derniers gardés)
state/          index à empreinte HMAC, dernière poussée, verrou
registry.json   type et portée par nom (aucune valeur)
```

## Chiffrement à deux couches

1. **Couche locale, liée à la machine.**
   - Windows : DPAPI utilisateur. Les appels FFI tournent dans un pool de Workers bun (`src/win/pool.ts`), jamais sur la boucle d'événements.
   - Option Windows Hello : une clé RSA-2048 dans le « Microsoft Passport Key Storage Provider » (NCrypt). Elle enveloppe la clé de chaque document `--hello`. Sceller fait une opération publique (`NCryptEncrypt`), sans geste. Ouvrir passe par `NCryptDecrypt` et demande le geste Hello.
   - Linux : `systemd-creds`. L'option `--user` lie le credential à l'UID et au machine-id.
2. **Enveloppe de transport et de portabilité : age X25519, un destinataire par hôte.**
   - La clé privée de chaque hôte est générée sur l'hôte et scellée par `systemd-creds` sous le nom de credential `aphrody-vault-age`. Elle ne quitte jamais l'hôte.
   - La clé privée du PC est le secret DPAPI `VAULT_AGE_IDENTITY`.
   - DPAPI étant lié à la machine, seule l'enveloppe age est synchronisée.
3. **Documents : format AYV1** (`src/crypto.ts`, identique en Rust).
   - Structure : `"AYV1" | flags | wrapLen | wrap | nonce[12] | AES-256-GCM`, avec l'AAD `doc|<format>|<nom>`.
   - Clé maîtresse : 32 octets aléatoires `VAULT_MASTER_KEY` dans la couche locale.
   - Avec Hello : clé = HMAC-SHA256(maître, "ayv1|" ‖ DEK), la DEK étant enveloppée par la clé Hello. Il faut alors le compte Windows **et** le geste.
   - Le vecteur `packages/vault/native/tests/vectors/ayv1-master07.hex`, scellé en TS, s'ouvre en Rust.

## Types, schémas et portées

| Type | Schéma | Portée par défaut | Synchronisé |
|---|---|---|---|
| `token` | un fichier par nom `^[A-Za-z_][A-Za-z0-9_.-]{0,127}$` | `pc` | oui, vers les hôtes de sa portée (credstore) |
| `document` | AYV1 json/toml/csv/xml/bin | `pc` | non |
| `chrome-passwords` | document `chrome-passwords.csv` : `name,url,username,password,note` | `pc` | jamais (`[never].kinds`) |
| `profile` | `tar` → age vers le PC | `pc` | jamais |

Ordre de priorité de la portée : `env-kit vault add NOM --scope a,b` (registre local), puis `[scope]` de `policy.toml`, puis `[defaults]`. Le code (`scopeOf`) retire toujours les hôtes distants des noms réservés (`VAULT_MASTER_KEY`, `VAULT_AGE_IDENTITY`, `aphrody-vault-age`) et des types `[never]`.

**Ce qui ne quitte jamais le PC** :
- la clé maîtresse et l'identité age du PC ;
- les mots de passe Chromium ;
- les profils et les données utilisateur ;
- les documents ;
- tout jeton dont la portée se limite à `pc`, soit tous ceux qui ne sont pas listés.

Aujourd'hui, seuls `VAULT_PROOF_TOKEN` et `CLAUDE_CODE_OAUTH_TOKEN` partent vers prd et fr2. Le second partait déjà vers ces hôtes par `nhitl login`, et ses empreintes étaient identiques sur les trois machines avant la bascule.

## Synchronisation

- **PC.** La tâche planifiée `aphrody-vault-sync` tourne toutes les 5 min et à l'ouverture de session (`env-kit vault sync --install-task 5`). Elle utilise `InteractiveToken`, car les clés DPAPI de l'utilisateur ne sont pas disponibles en S4U, et `conhost --headless` pour rester sans fenêtre. Elle ne lance qu'une instance à la fois.
  1. **seal.** Pour chaque hôte, le PC chiffre en age chaque jeton de la portée. Une empreinte HMAC (clé maîtresse, hôte, destinataire, valeur) saute les valeurs inchangées. Un nom sorti de la portée est retiré.
  2. **push.** Le PC envoie `MANIFEST` (BLAKE3 de chaque enveloppe) et les enveloppes en `tar` par ssh sur le mesh (`fr2`, `fr1`, prd via `-J fr2 agent@10.200.77.5`) vers `vault-host.sh receive`. La poussée est sautée si le MANIFEST n'a pas changé, sauf toutes les 6 h (`VAULT_REPUSH_HOURS`).
- **Hôte.** `receive` vérifie chaque ligne du MANIFEST et refuse un fichier altéré ou une archive sans MANIFEST, ce qui protège contre une révocation massive par erreur. Il bascule l'inbox de façon atomique, puis lance `apply`.
  - `apply` déchiffre avec l'identité de l'hôte (`age -d -i <(systemd-creds decrypt …)`) et rechiffre aussitôt par `systemd-creds encrypt --name=<NOM>`. L'opération est idempotente par BLAKE3.
  - Il révoque les credentials qu'il a lui-même appliqués quand ils ne sont plus reçus. Les autres ne sont jamais touchés.
  - `aphrody-vault-apply.timer` réapplique toutes les heures.
- **Services.** Ils lisent `LoadCredentialEncrypted=<NOM>`. Une unité utilisateur cherche dans `~/.config/credstore.encrypted`, qui doit avoir été chiffré avec `--user` (`man systemd.exec`, systemd 261 sur fr2 ; `--user` existe depuis la v256). Un runner lit avec `systemd-creds --user decrypt --name=<NOM>`, comme `infra/agents/runner.ts`.
- **Rotation.**
  - `env-kit vault rotate <hôte>` crée une nouvelle identité sur l'hôte, met à jour `hosts.toml`, rescelle et pousse aussitôt.
  - `env-kit vault rotate --master` crée une nouvelle clé maîtresse et rescelle les documents.
  - Les sauvegardes gardent les 3 dernières générations (`VAULT_BACKUPS_KEEP`).

### Preuve (2026-11-13)

`VAULT_PROOF_TOKEN` (32 octets aléatoires, jamais affichés) a été ajouté sur le PC par `env-kit vault add` à 03:50:24 UTC. Il est arrivé à 03:55:08 UTC par la tâche planifiée, sans autre action, dans le credstore de prd (`/home/agent/.config/credstore.encrypted`, `applied=1`) et de fr2 (`/home/ubuntu/.config/credstore.encrypted`, `applied=1`). Le BLAKE3 commence par `2cb3004505082c33` sur le PC, sur prd et sur fr2 (`env-kit vault fp VAULT_PROOF_TOKEN --host <h>`). fr1 n'a rien reçu, car il est hors portée. Revue : `docs/reviews/vault-2026-11-13-gemini.md`.

## Chromium : ce qui est portable

Source : `/srv/chromium/src` sur fr1, Chromium 157.0.8103.78, commit `4b3d0dabb8250b6f152d2d85d79e7706e309d087`.

| Fait | Chemin |
|---|---|
| Windows v10 : clé AES-256 dans `Local State` → `os_crypt.encrypted_key`, préfixe `DPAPI`, blob DPAPI utilisateur ; données en `v10` ‖ nonce 12 ‖ GCM | `components/os_crypt/async/browser/dpapi_key_provider.cc:28,32,36`, `components/os_crypt/async/common/encryptor.cc:36,64-65,125-130` |
| App-bound (v20) : `os_crypt.app_bound_encrypted_key`, préfixe `APPB`, clé liée au contexte SYSTEM par le service d'élévation (« does not roam ») | `chrome/browser/os_crypt/app_bound_encryption_provider_win.h:42,46,50`, `app_bound_encryption_win.cc` |
| L'app-bound s'applique à une installation système avec user-data-dir par défaut, ni désactivée par la politique `ApplicationBoundEncryptionEnabled`, ni profil itinérant. Une installation zip ou utilisateur (Chrome for Testing, Chromium décompressé) reste en DPAPI v10. | `app_bound_encryption_win.cc:61,71-115`, `browser_process_impl.cc:1612-1627` |
| Linux `--password-store=basic` : `v10`, clé PBKDF2-SHA1(« peanuts », « saltysalt », 1 itération), AES-128-CBC, IV de 16 espaces. Cette clé est fixe et publique, donc équivalente à du clair. | `components/os_crypt/async/browser/posix_key_provider.cc:17-22`, `encryptor.cc:38-40,67-68` |
| Linux `v11` : libsecret ou KWallet (`FreedesktopSecretKeyProvider`) | `freedesktop_secret_key_provider.cc:42,206-215` |
| `components/os_crypt/sync` n'existe plus en 157 | `ls components/os_crypt` |
| CSV : en-tête d'export `name,url,username,password,note` ; colonnes acceptées à l'import : url/website/origin/hostname/login_uri, username/user/login/account/login_username, password/login_password, note/notes/comment/comments | `components/password_manager/core/browser/export/password_csv_writer.cc:16-20`, `import/csv_password_sequence.cc:25-49` |

Conséquences :
- **Restaurer un profil** sur le même compte Windows rend ses cookies et ses mots de passe lisibles (même blob DPAPI dans `Local State`). Sur une autre machine ou un autre compte, il ne les lit pas.
- **Le relais CDP** (`%LOCALAPPDATA%\aphrody\relay\chrome`) tourne sous Chrome stable, installé au niveau système. Ses cookies sont donc en `v20` : ils ne se restaurent que sur ce PC avec ce Chrome. L'outil ne contourne pas l'app-bound encryption.
- **Pour un profil d'agent portable**, il faut Chromium ou CfT dans un user-data-dir dédié : DPAPI v10 sous Windows, `--password-store=basic` sous Linux. Le profil Linux est alors à protéger comme du clair, d'où l'enveloppe age. Sur les VPS, les profils sont sauvegardés depuis le VPS lui-même ; il n'y a pas de transcodage Windows → Linux.
- **Le profil principal du propriétaire** (`Google\Chrome\User Data`, Edge, `~/.config/google-chrome`) est refusé par le code, en sauvegarde comme en restauration.
- **Les mots de passe passent par le CSV** que le propriétaire exporte lui-même :
  - `env-kit vault import-chrome-csv <fichier>` fusionne les entrées par (url, username), scelle le document (avec Hello s'il est enrôlé), le rouvre pour vérifier, puis efface le fichier en clair ;
  - `env-kit vault export-chrome-csv <sortie>` le réécrit au format d'export pour l'importer dans le fork aphrody ou dans CfT (`chrome://password-manager/settings`). Effacer ensuite la sortie avec `env-kit vault shred <sortie>`.

## API

TypeScript, entièrement asynchrone :
- secrets : `setSecret`, `getSecret`, `hasSecret`, `listSecrets`, `deleteSecret`, `runWithSecrets` (valeur dans l'env ou le stdin de l'enfant) ;
- enveloppes : `seal`, `open`, `writeDocument`, `readDocument`, `sealDoc`, `openDoc` ;
- SQLite : `EncryptedTable`, clés aveuglées par HMAC ;
- age : `ageEncrypt`, `ageEncryptToFile` (flux), `ageDecryptFile` (identité sur stdin) ;
- Chromium : `importChromeCsv`, `exportChromeCsv` ;
- sauvegardes : `backup`, `restore`, en flux `tar | age`, sans archive en clair ;
- synchronisation : `sync`, `sealOutbox`, `push`, `initHost`, `rotateHost`, `remoteFingerprint`.

Rust : `aphrody_vault::{set_secret, get_secret, list_secrets}` (tokio ; DPAPI via `spawn_blocking`), `win::{ng_protect, ng_unprotect}` (DPAPI-NG, par exemple `LOCAL=user`), `ayv1::{seal, open}`, `envelope::{age_encrypt, age_decrypt}`. C ABI : `aphrody_vault_get_secret`, `_set_secret`, `_seal`, `_open`, `_age_encrypt`, `_free` (mise à zéro), `_last_error`. Ces appels sont bloquants : les faire depuis un Worker bun.

Appels migrés :
- `env-kit secret` : l'API asynchrone, et après `set` ou `import` d'un nom de portée distante, un scellement immédiat ;
- `ai-os nhitl login claude` : coffre, puis sync, puis vérification sur l'hôte ; il ne pousse plus le jeton par ssh ;
- `relay/oauth.ts` : l'état devient le document scellé `relay-oauth` ; l'ancien `oauth.json` en clair est migré puis effacé ;
- `var/secrets/npm_recovery_codes.txt` en clair : scellé dans le document `npm-recovery-codes` (bin), contrôlé par BLAKE3, puis effacé ;
- les scripts de `%LOCALAPPDATA%\aphrody\scripts` (pat-watch, pty-login) ont disparu entre-temps, et `npm-trust.ps1` ne touche aucun secret.

Bench (`bun packages/vault/bench/bench.ts`, PC, bun 1.4.5) : p50 / p99 en ms, avec la pire latence de la boucle d'événements.

| Opération | p50 | p99 | Pire latence de la boucle |
|---|---|---|---|
| set local DPAPI 64 o (16 en parallèle) | 8.3 | 11.2 | 2.1 |
| get local DPAPI 64 o | 1.0 | 2.1 | 1.1 |
| seal AYV1 64 o | 0.38 | 0.65 | 1.7 |
| seal AYV1 1 Mio | 1.5 | 4.0 | 7.0 |
| SQLite put+get, clés aveuglées | 15 | 22 | 38 (bun:sqlite est synchrone) |
| age encrypt 64 o (spawn) | 29 | 47 | 45 (`CreateProcess` sous Windows) |

## Modèle de menace

| Menace | Protection | Limite |
|---|---|---|
| Fuite par git | `var/` ignoré par la liste blanche ; seules des clés publiques et des noms sont versionnés | une copie hors de `C:\src` n'est pas couverte |
| Vol du disque du PC ou de la sauvegarde | DPAPI : clé maîtresse dérivée du mot de passe du compte | un attaquant connecté sous le compte déchiffre tout, sauf les documents `--hello`, qui demandent le geste |
| Transcript d'agent ou journal | aucune commande n'affiche de valeur : entrée par stdin, sortie par l'env ou le stdin d'un enfant, preuves par longueur ou BLAKE3 | `doc pipe` vers une commande qui affiche |
| Compromission d'un VPS | il ne reçoit que les jetons de sa portée, chiffrés pour lui seul ; sa clé n'ouvre ni les autres hôtes ni le PC | les jetons de sa portée sont exposés : `rotate` puis révoquer chez le fournisseur |
| Altération en transit | ssh (clés d'hôte épinglées, `StrictHostKeyChecking yes`) + MANIFEST BLAKE3 | le MANIFEST n'est pas signé : l'authenticité repose sur ssh |
| Révocation massive par erreur | `receive` refuse une archive sans MANIFEST ; seuls les noms appliqués par le coffre sont révocables | — |
| CSV Chrome en clair | scellé, vérifié, puis écrasé, synchronisé sur le disque, renommé, supprimé | SSD (wear levelling), journal NTFS, clichés VSS, OneDrive : exporter hors des dossiers synchronisés et sauvegardés |
| Valeur faible et empreinte | les index sont des HMAC sous la clé maîtresse ; seules les commandes de preuve calculent un BLAKE3 nu, à la demande | — |

## Restauration

- **PC, même compte Windows** : rien à faire. `var\secrets` et ses blobs DPAPI suffisent.
- **PC réinstallé ou nouveau compte** : les blobs DPAPI sont perdus. Il faut :
  1. rejouer `env-kit vault init`, qui crée une nouvelle identité et une nouvelle clé maîtresse ;
  2. réimporter les jetons depuis leurs fournisseurs (`ay auth repair`) et les mots de passe par un nouvel export CSV ;
  3. relancer `env-kit vault rotate <hôte>` pour chaque VPS.

  Les sauvegardes `backups/*.tar.age` ne s'ouvrent qu'avec l'ancienne `VAULT_AGE_IDENTITY`. Pour s'en prémunir, ajouter dans `hosts.toml` un destinataire hors ligne (clé age papier ou `age-plugin-yubikey`) à la portée `profile`.
- **VPS réinstallé** : `env-kit vault hosts init <hôte>`, puis `env-kit vault sync --force --host <hôte>`.
- **Profil d'agent** : navigateur fermé, puis `env-kit vault restore <nom> [dest]` (flux `age -d | tar -x`).

## Étude (vérifiée le 2026-11-13)

Windows (Microsoft Learn ; SDK 10.0.26100.0) :
- **DPAPI** (`dpapi.h`, Crypt32.dll) : `CryptProtectData` / `CryptUnprotectData`, sortie à libérer par `LocalFree`. Flags : `CRYPTPROTECT_UI_FORBIDDEN` 0x1, `CRYPTPROTECT_LOCAL_MACHINE` 0x4, `CRYPTPROTECT_VERIFY_PROTECTION` 0x40. Le mode à invite (`pPromptStruct`) est déprécié et sera retiré en avril 2027 ; le coffre passe NULL.
- **DPAPI-NG** (`ncryptprotect.h`, NCrypt.dll) : `NCryptCreateProtectionDescriptor`, `NCryptProtectSecret` / `NCryptUnprotectSecret` (`NCRYPT_SILENT_FLAG`). Descripteurs : `LOCAL=user|machine`, `SID=…`, `SDDL=…`, `WEBCREDENTIALS=…`, `CERTIFICATE=…`, avec `AND` / `OR`. Implémenté côté Rust (`win::ng_protect`).
- **Passport KSP** : `MS_NGC_KEY_STORAGE_PROVIDER` = « Microsoft Passport Key Storage Provider ». `NCRYPT_UI_POLICY` et les propriétés du cache de PIN sont dans `ncrypt.h`. **Non documenté** : le format du nom de clé NGC. Le coffre utilise `<SID>//aphrody//vault//aphrody-vault`, format des clients Hello tiers ; il est à valider à l'enrôlement.
- **KeyCredentialManager** (WinRT, 10.0.10240+) : `IsSupportedAsync`, `RequestCreateAsync`, `OpenAsync`, `KeyCredential.RequestSignAsync`. Il exige un geste pour chaque opération, y compris le scellement. Le coffre lui préfère le Passport KSP, où le scellement passe par l'opération publique.
- **TPM** : `MS_PLATFORM_CRYPTO_PROVIDER` = « Microsoft Platform Crypto Provider ». Le nom diffère entre Learn et `ncrypt.h` (`MS_PLATFORM_KEY_STORAGE_PROVIDER`). Côté age : `age-plugin-tpm` v1.0.1.

Linux : `systemd-creds` (v261 sur fr2 et fr1, v262 sur prd) accepte `--with-key=host|tpm2|host+tpm2|auto`, et `--user` / `--uid` depuis la v256. Le keyring du noyau (`keyctl`, `@u`, `@s`, `get_persistent`) est volatil : le coffre ne l'utilise pas, car `systemd-creds` persiste et alimente `LoadCredentialEncrypted=`.

age :
- spec C2SP `age-encryption.org/v1`, avec type hybride post-quantique MLKEM768-X25519 ;
- binaire age v1.3.2 (2026-08-29, à jour sur le PC), `age-keygen -pq` ;
- crates `age` et `rage` 0.12.1 (2026-07-14) ;
- les destinataires PQ (`age1pq1…`, environ 2000 caractères) sont une évolution possible de `hosts.toml`.

SQLite chiffré :
- SQLCipher v4.20.0 (BSD-3) et SQLite3MultipleCiphers v2.6.1 (MIT) existent ; rusqlite 0.42.0 offre `bundled-sqlcipher` ;
- bun:sqlite ne peut pas les charger hors macOS : `Database.setCustomSQLite` y est sans effet, car SQLite est lié statiquement ;
- d'où le chiffrement applicatif par ligne (`EncryptedTable`, AES-GCM WebCrypto).

Bibliothèques (crates.io, npm) :
- windows 0.62.2, la dernière publiée ; windows-core et windows-bindgen 0.100.0 ;
- tokio 1.54.1, aes-gcm 0.11.1, getrandom 0.4.3, zeroize 1.9.1, keyring 4.2.0, secrecy 0.10.3 ;
- npm `age-encryption` 0.3.1, non retenu : env-kit et vault restent sans dépendance, avec le binaire age.

Bun 1.4.5 (canary ; la dernière release est 1.4.4) :
- présents : `Worker`, `Bun.spawn`, `crypto.subtle` AES-GCM, `JSCallback({ threadsafe: true })` ;
- `Bun.CryptoHasher` n'a pas blake3, d'où le binaire `b3sum`, installé sur prd (pacman) et sur fr2.

## Reste au propriétaire

- Exporter les mots de passe depuis `chrome://password-manager/settings` (Exporter), puis lancer `env-kit vault import-chrome-csv "<fichier>"`. Le fichier en clair est effacé après le scellement.
- Optionnel : `env-kit vault hello enroll`, qui affiche l'invite Windows Hello. Les imports suivants seront alors scellés avec Hello.
