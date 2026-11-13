# Gemini 4 Carbon High : audit d'anonymat de l'identité publique aphrody-dev (2026-11-13)

gemini.google.com via claude-in-chrome, mode Carbon High, trois tours dans le même chat ; aucune donnée personnelle transmise (désignées PII-1 nom réel, PII-2 gmail personnels). Notes : **8/20 -> 10,5/20 -> 11,5/20**. Plafond annoncé par Gemini sans réécriture d'historique : 18/20 ; plafond atteignable par l'agent seul : 12/20, le reste dépend du propriétaire.

Fait : 35 fichiers anonymisés (92418460), comptes Google personnels au coffre, configurations gcloud owner / ai-agent, sous-domaine nominatif supprimé (DNS live), git noreply sur PC et flotte, profils GitHub, routage mail déclaré (342e4916), garde d'anonymat fail-closed dans identity check + secret Actions APHRODY_PII_TERMS. Vérifié : crt.sh 0, SOA et RDAP sans PII, workers.dev aphrody-labs, CV.pdf 191 flux 0 occurrence, sites live 0 occurrence.

Réfuté : condensats salés committés (sel public + termes à faible entropie = oracle par dictionnaire ; Gemini l'admet au tour 3). Hors périmètre : réécriture d'historique et recréation du dépôt (règle du propriétaire) ; 33 commits historiques déclarés.

Reste agent : garde étendue aux binaires/PDF et aux enveloppes de commit, ::add-mask:: par terme en CI, sondes .map sur tous les bundles. Reste propriétaire : email npm @live.fr (maintainers, _npmUser) et Trusted Publishing, 2SV Google puis écran de consentement OAuth, vérification de la destination Email Routing, accord pour purger les 893 exécutions Actions, jeton CLOUDFLARE_API_TOKEN du coffre rejeté (403).

## Verdict brut, tour 3

Gemini said

Note révisée : 11,5 / 20 (+1,0 pt par rapport à 10,5/20 — plafond autonome de l'agent seul : 12,0 / 20 ; plafond avec simple « GO » sur F5 : 13,0 / 20 ; plafond global sans réécriture Git : 18,0 / 20).

Ta réfutation sur F9 est validée sans réserve : sur un espace à faible entropie (prénom, patronyme, identifiant court ou préfixe @live.fr), publier dans un dépôt public un condensat même salé crée un oracle de confirmation instantané par attaque par dictionnaire. Le couple secret GitHub Actions (APHRODY_PII_TERMS) + coffre local DPAPI en mode fail-closed avec sortie limitée à fichier:ligne est cryptographiquement et opérationnellement supérieur. De même, geler la suppression irréversible des 893 runs Actions (F5) dans l'attente d'un accord explicite est la bonne décision de gouvernance, même si l'audit de surface ne peut créditer ce point qu'une fois les journaux effectivement purgés.

Barème actualisé (F1–F10)
Domaine évalué Évolution constatée Responsable du reliquat Score

1. Infra DNS, CT & Registrar (F3, F8) Inchangé, surface propre. — 4,00 / 4
2. Identité Forge & Surface Web (F6, F10) +0,25 pt : CV.pdf validé en profondeur (191 flux zlib + brut + /Info = 0 hit sur 8 termes). Sonde .map partielle (3 hôtes sur 5, nom fixe boot.js.map). Agent (+0,25 pt) 3,75 / 4
3. Registres tiers, OAuth & Mail (F2, F4, F7) +0,00 pt : @live.fr toujours servi en clair sur registry.npmjs.org, console OAuth Google bloquée sans 2SV, règle mail non verrouillée techniquement. Propriétaire (+5,00 pts) 1,00 / 6
4. Garde-fous CI & Logs Actions (F5, F9) +0,75 pt : identity.ts check câblé (just check + judge.yml), testé fail-closed sur 8 termes. Reste 3 angles morts dans le script (F9) et les 893 runs toujours en ligne (F5). Agent (+0,25 pt) + GO Proprio (+1,00 pt) 2,75 / 4
5. Historique Git public (F1) Risque des 33 commits et du diff 92418460 accepté sous contrainte main-only. Plafond structurel 0,00 / 2
   TOTAL Reste à prendre vers 18/20 : +6,50 pts (0,50 agent + 1,00 sur GO + 5,00 propriétaire) — 11,5 / 20
6. Ce qui reste à la main immédiate de l'agent (doit être fait — +0,50 pt + préparation)

Aucun identifiant personnel, OTP ou acte destructif n'est requis pour fermer ces écarts et atteindre le plafond autonome de 12,0 / 20 :

Combler les 3 angles morts de scripts/identity.ts check — F9 (+0,25 pt)

Fichiers binaires ignorés par git grep -I : l'option -I exclut silencieusement CV.pdf, les binaires .wasm et les images. Si CV.pdf est régénéré demain avec un dictionnaire /Author ou un flux XMP contenant PII-1, just check et judge.yml passeront au vert. Intégrer directement dans identity.ts check la décompression zlib (FlateDecode) et le scan brut des .pdf et assets binaires suivis hors third_party transforme ta vérification ponctuelle F6 en garde-fou permanent.

Enveloppes et messages de commit non couverts : git grep n'inspecte que l'arbre de fichiers, jamais Author, Committer ni le message de commit. Sous interdiction de force-push, un seul commit poussé sur main avec un user.email erroné ou un chemin local dans le message crée une fuite définitive. Le script doit vérifier git log --format="%an%n%ae%n%cn%n%ce%n%B" sur les commits entrants (et imposer une liste blanche d'emails d'auteur : contact@aphrody.com ou noreply.github.com), doublé d'un hook local pre-push / commit-msg.

Masquage individuel en CI : lorsque APHRODY_PII_TERMS contient une liste délimitée sur une seule ligne, le runner GitHub Actions masque la chaîne complète mais pas chaque sous-terme isolé si un processus enfant plante sur stderr. Émettre ::add-mask:: pour chacun des 8 termes parsés dès l'initialisation de identity.ts en environnement CI verrouille le scrubber de logs terme par terme.

Étendre la vérification .map aux 5 sous-domaines et aux bundles réels — F6 (+0,25 pt)

Tester uniquement /boot.js.map sur aphrody.com, os. et status. laisse de côté labs.aphrody.com et docs.aphrody.com ainsi que tout chunk à nom haché.

Extraire automatiquement toutes les URL de scripts et modules référencées dans le HTML des 5 sous-domaines, vérifier l'absence d'en-têtes HTTP SourceMap et X-SourceMap sur les réponses des assets, et confirmer qu'aucune URL {bundle}.map ne renvoie un statut 200 avec un corps JSON de source map (attention aux fallbacks SPA qui renvoient 200 text/html).

Préparer les dossiers d'exécution pour réduire l'intervention propriétaire à 5 minutes (0 pt direct, débloque F2/F5/F7)

Préparation F2 (npm) : requêter en lecture seule [https://registry.npmjs.org/](https://registry.npmjs.org/){paquet} sur tous les paquets publiés pour lister chaque couple paquet@version exposant @live.fr dans _npmUser ou maintainers ; pré-rédiger la demande d'effacement RGPD Art. 17 prête à envoyer ; vérifier que les package.json du monorepo sont propres et que le workflow GitHub Actions de release déclare bien permissions: { id-token: write } pour que le Trusted Publishing OIDC fonctionne dès l'activation web.

Préparation F5 (artefacts et caches Actions) : interroger en lecture seule les endpoints Actions artifacts et caches du dépôt afin d'inclure dans le script de purge tout artefact ou cache antérieur à 2026-11-13T04:10Z (gh run delete supprime les journaux d'exécution, mais pas les entrées du cache Actions).

Audit DNS F7 (SPF/DMARC) : vérifier en lecture seule (dig TXT aphrody.com et _dmarc.aphrody.com) la politique DMARC active et réévaluer la présence de include:_spf.google.com. Utiliser contact@aphrody.com comme identité Google Cloud / OAuth ne nécessite pas d'autoriser les serveurs SMTP de Google dans le SPF si 100 % des e-mails légitimes sortent par OVH et Resend : retirer _spf.google.com avec un DMARC strict empêche techniquement un envoi accidentel depuis Gmail de passer pour légitime.

2. Ce qui relève du propriétaire (décision ou identifiants privés — +6,00 pts)
   A. Déblocable par un simple « GO » donné à l'agent (+1,00 pt → 13,0 / 20)

F5 — Purge des 893 exécutions GitHub Actions (+1,00 pt) : dès validation explicite du propriétaire autorisant la destruction des historiques CI antérieurs à 2026-11-13T04:10Z, l'agent exécute lui-même la suppression des runs, artefacts et caches pré-assainissement via le jeton gh déjà disponible, puis vérifie qu'aucun run antérieur ne subsiste.

B. Exclusivement exécutable par le propriétaire avec ses facteurs d'authentification (+5,00 pts → 18,0 / 20)

F2 — Assainissement du compte et du registre npm (+3,00 pts) :

Se connecter avec OTP pour remplacer l'adresse @live.fr par contact@aphrody.com (npm profile set email).

Déclarer la confiance OIDC (Trusted Publisher GitHub Actions) sur chaque paquet dans l'interface npmjs.com, déclencher une publication patch pour nettoyer latest, et révoquer l'intégralité des tokens d'accès npm historiques.

Envoyer depuis l'adresse du compte le ticket pré-rédigé par l'agent au support npm (privacy@npmjs.com) exigeant la purge des champs _npmUser historiques dans le JSON public du registre.

F4 — Enrôlement 2SV Google et verrouillage OAuth (+1,50 pt) :

Activer la validation en deux étapes (clé FIDO2 ou TOTP) sur le compte Google pour déverrouiller la console GCP.

Dans Google Auth Platform, positionner User support email et Developer contact information sur contact@aphrody.com, puis vérifier le rendu réel de l'écran de consentement OAuth dans une session privée.

F7 — Verrouillage de la boîte Gmail personnelle (+0,50 pt) :

Supprimer dans les paramètres Gmail personnels toute entrée « Envoyer des e-mails en tant que » associée à aphrody.com et couper tout transfert susceptible de déclencher une réponse croisée.

Émettre un e-mail de test depuis la boîte OVH / Resend de contact@aphrody.com et inspecter la source brute reçue (Show original) pour confirmer l'alignement SPF/DKIM/DMARC et l'absence totale d'en-tête X-Google-Original-From ou de trace du compte personnel.
