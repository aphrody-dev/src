# Gemini 4 Carbon High : docs/infra/FR2-CLOUDFLARE.md (2026-11-13)

Passe 1 sur le document (lignes edge condensées), gemini.google.com via claude-in-chrome, mode Carbon High. Note : **10/20**. Corrections appliquées : voir la section 7 du document. Verdict brut ci-dessous.

Gemini said

Note globale : 10,0 / 20 — La mécanique d'exécution progressive (mode déclaratif plan/apply, canaris fr2mig-check, garde-fou systemd-run de 180 s, chiffrement systemd-creds, harnais proof.ts) est rigoureuse, mais le document comporte 7 erreurs ou contradictions factuelles, une impasse architecturale sur le repli self-host, un couplage en dur au green_port (23000), un angle mort IPv6 complet et une consigne de fermeture du port 22 dangereuse.

Critère du barème	Note	Justification synthétique
Exactitude factuelle et protocolaire	3,0 / 6	Relevés live précis, mais décomptes erronés (33 CNAME vs 31, 17 certs vs 19), contradiction directe sur nie.aphrody.app (21 vs 22 A), confusion résolution DNS vs origine, limite nginx mTLS inexacte et incohérences de rollback.
Conception réseau et architecture	2,5 / 5	Suppression saine du double saut fr2 → prd, mais ingress couplée en dur à green_port (23000), repli fleet-health rendu inopérant par fr2-edge-fw + Workers + rebouclage mig-tunnel, et hairpinning SSH via cdg malgré wg1.
Sécurité et hygiène	2,0 / 5	Origine IPv4 filtrée, mais IPv6 jamais testée, admin/console/control exposés en 200 sans Access, consigne port 22 exposant sshd aux Workers tiers, jeton fleet-agents bidirectionnel, absence de mTLS d'origine et 4 couches firewall concurrentes.
Complétude et sûreté opérationnelle	2,5 / 4	Jeton CLOUDFLARE_API_TOKEN expiré laissé cassé en production, persistance au reboot de fr2-edge-fw incertaine, binaire cloudflared hors APT, cert Let's Encrypt webroot cassé par le pare-feu et assertions proof.ts lacunaires.
1. Erreurs factuelles et contradictions protocolaires

Décompte erroné des CNAME aphrody.com (sections 1 et 4) : le document annonce « 31 CNAME » à deux reprises, alors que l'énumération explicite entre parenthèses (admin jusqu'à translate) contient exactement 33 sous-domaines.

Décompte incohérent des certificats Let's Encrypt (section 1) : l'inventaire indique « 19 certificats Let's Encrypt (16 en dns-cloudflare, 1 en webroot) ». La somme des méthodes d'authentification fait 17 (
16
+
1
≠
19
16+1

=19) ; le mode de renouvellement de 2 certificats est omis.

Contradiction frontale sur nie.aphrody.app et les « 22 A » (sections 1, 2, 4 et 6) :

La table DNS (section 1) liste 22 enregistrements A sur aphrody.app en incluant nie (8 racines + 14 app-* = 22), et la section 4 affirme avoir migré ces 22 A *.aphrody.app vers le tunnel mig-prd (prd:3010 → 502).

Pourtant, les sections 1 et 6 affirment que nie.aphrody.app (rosegriffon-52, conf.d/rosegriffon-cdn.conf → 72.60.186.43:8443) est « non touché, 404 via CF avant comme après ». Soit seuls 21 enregistrements A ont été migrés, soit nie.aphrody.app a été écrasé par erreur vers prd:3010 (502).

De surcroît, si nie.aphrody.app est resté non touché vers fr2, l'affirmation de la section 2 (« plus aucun nom aphrody ne résout vers fr2, sauf dbfr.aphrody.com ») est doublement fausse : nie.aphrody.app conserve fr2 comme origine, et dbfr.aphrody.com étant désormais proxifié, il ne résout plus vers l'IP de fr2 mais vers l'Anycast Cloudflare (fr2 n'est plus que son origine).

Contradiction d'état sur la fermeture du port 22 (section 2 vs sections 5 et 6) : la table cible (section 2) affiche fait (22 fermé après 7 jours sans incident), alors que la migration a été exécutée le jour même (2026-11-13), que proof.ts (section 5) relève 22 open, et que la section 6 reporte l'action à J+7.

Justification techniquement fausse du rejet d'Authenticated Origin Pulls (section 2) : refuser AOP parce que rosegriffon-cdn.conf est hors périmètre repose sur une prémisse erronée. Dans nginx, ssl_client_certificate et ssl_verify_client se déclarent par bloc server {} (vhost) et non uniquement au niveau global http {}. De plus, l'AOP standard partagé de Cloudflare ne prouve pas l'appartenance à votre compte (tout client Cloudflare activant AOP présente le même certificat) : seul Custom Authenticated Origin Pulls (certificat client propre à la zone/au hostname) authentifie réellement votre zone.

Routage /api derrière un Worker Static Assets non étayé (sections 1, 4 et 5) : la section 4 affirme sur l'apex aphrody.com : « Worker devant ; /api passe par l'ingress prd ». Or la section 1 indique que le Worker aphrody couvre la route [aphrody.com/](https://aphrody.com/)*. Un Worker avec Static Assets ne retombe jamais implicitement sur l'origine DNS/tunnel sans route d'exclusion dédiée ([aphrody.com/api/](https://aphrody.com/api/)* à null) ou appel explicite fetch(request) dans le code Worker — et aucun test de [https://aphrody.com/api/](https://aphrody.com/api/)... ne figure dans proof.ts.

Incohérences des commandes de rollback DNS (section 4) :

La note certifie avoir vérifié update (PUT) en --dry-run, mais la ligne dbfr.aphrody.com utilise une sous-commande différente (cf dns records edit, PATCH partiel sans type/name/content) et omet les deux identifiants d'enregistrements contrairement à l'apex.

Le rollback unitaire d'un des 33 CNAME vers content: "aphrody.com" ne rétablit pas fr2 tant que l'apex aphrody.com reste un CNAME aplati vers le tunnel mig-prd : le sous-domaine continuera d'aboutir sur mig-prd.

2. Risques architecturaux, sécurité et sûreté opérationnelle
Risques critiques

Bombe à retardement Blue/Green (127.0.0.1:23000 codé en dur dans cloudflare.toml) : l'ingress du tunnel mig-prd cible directement deploy.toml green_port (23000) au lieu d'un point d'entrée local stable (:3000). Dès le prochain déploiement de aphrody basculant le trafic actif sur le blue_port, l'intégralité de aphrody.com (/api) et *.aphrody.com tombera en 502 Bad Gateway.

Repli self-host (HOSTING-POLICY / fleet-health) totalement inopérant :

Jeton mort : CLOUDFLARE_API_TOKEN dans /etc/aphrody/secrets.env est un jeton OAuth expiré (section 6), rendant toute bascule automatique impossible aujourd'hui.

Impasse réseau : si fleet-health bascule le DNS en proxied: false vers fr2 lors d'une panne Worker/Cloudflare, fr2-edge-fw rejette 100 % des utilisateurs publics puisque 80/443 sont fermés hors plages Cloudflare. Si le DNS reste proxied: true, les Workers continuent d'intercepter les requêtes avant l'origine fr2.

Faux repli local sur fr2 : le vhost downloads.aphrody.com sur fr2 ne pointe même pas vers le conteneur local Docker downloads (127.0.0.1:28797), mais vers 127.0.0.1:18797 (mig-tunnel.conf → [https://mig-downloads.aphrody.com](https://mig-downloads.aphrody.com)), rebouclant ainsi vers Cloudflare ! De même, cdn.aphrody.com.conf pointe vers prd:8796 et non vers le conteneur local cdn (127.0.0.1:28796).

Consigne de fermeture du port 22 ouvrant une brèche via Cloudflare Workers (section 6) : « ajouter tcp dport 22 au même filtre » (fr2-edge-fw) autoriserait toutes les plages IP publiques Cloudflare à joindre fr2:22. Or cloudflared contacte sshd en local (127.0.0.1:22), jamais depuis l'edge Cloudflare ; ouvrir 22/tcp aux IP Cloudflare permettrait à n'importe quel tiers utilisant WARP ou un Cloudflare Worker via cloudflare:sockets (connect("51.255.162.6:22")) de traverser votre pare-feu. À l'inverse, fermer 22/tcp sans WARP/WireGuard sur le PC d'administration ni mot de passe console KVM OVH validé crée un risque de verrouillage total en cas de panne cloudflared/Access.

Angle mort IPv6 total (2001:41d0:305:2100::a461) : l'adresse IPv6 de fr2 était exposée publiquement sur dbfr.aphrody.com avant migration (présente dans les historiques DNS passifs). Or proof.ts ne teste que l'IPv4 51.255.162.6. Dans une table nftables de famille inet, une règle ip saddr != @cf_v4 drop ignore totalement le trafic IPv6 (nfproto ipv6), qui traverserait alors vers table inet fleet où 80/443 sont ouverts à tous.

Exposition directe de admin.aphrody.com, console.aphrody.com et control.aphrody.com : auparavant en 502 (donc injoignables), ces sous-domaines sensibles répondent désormais 200 DYNAMIC publiquement via le wildcard *.aphrody.com → prd:23000 (confirmé en section 5 depuis une IP hors liste blanche), sans protection Cloudflare Access en frontal contrairement à mig-commons et mig-depot.

Risques majeurs

Contournement trivial de fr2-edge-fw et du WAF par zone Cloudflare tierce : filtrer uniquement par plages IP Cloudflare sur 80/443 sans Custom AOP permet à tout attaquant créant un enregistrement proxifié sur son propre compte Cloudflare vers 51.255.162.6 d'atteindre nginx sur fr2 depuis les IP Cloudflare légitimes, en contournant vos règles fr2-block-probes et fr2-rl-edge.

Mouvement latéral symétrique (fr2 ↔ prd) et SSH navigateur incomplet :

Le jeton de service unique fleet-agents (non_identity), dupliqué sur fr2 et prd, permet à la compromission de fr2 (qui héberge un runner d'agents nt-d6 et nativelink-worker) de prendre immédiatement le contrôle de prd en SSH sans MFA, tout en faisant transiter ce flux interne par Paris (cdg) au lieu du lien direct WireGuard wg1.

Les applications fr2-ssh et prd-ssh activent le rendu SSH navigateur (type=ssh) sans mention d'autorité TrustedUserCAKeys (certificats éphémères Access) dans sshd_config, ce qui rend le terminal navigateur inutilisable ou force l'envoi d'une clé privée dans le navigateur.

Expiration imminente de certificats sur fr2 → futur 526 Invalid SSL Certificate :

achillea.rosegriffon.fr est déjà expiré depuis le 2026-11-10.

Le certificat Let's Encrypt en mode webroot (HTTP-01) ne peut plus se renouveler si le domaine n'est pas proxifié par Cloudflare, car fr2-edge-fw bloque désormais les serveurs de validation Let's Encrypt sur le port 80.

Si le jeton du plugin dns-cloudflare de Certbot sur fr2 est lui aussi invalide ou révoqué, l'expiration de *.aphrody.com provoquera une erreur 526 sur dbfr.aphrody.com (Full strict). À l'inverse, s'il est valide, un secret DNS multi-zones dort sur fr2 pour 15 certificats devenus inutiles.

Persistance au reboot et empilement de 4 pare-feux sur fr2 :

Le rollback (section 4) ne désactive que fr2-edge-fw.timer (pas fr2-edge-fw.service). Si le .service n'est pas activé au boot (WantedBy=multi-user.target / Before=network-online.target) et que le .timer n'a que OnCalendar=daily sans OnBootSec=, un redémarrage de fr2 laisse 80/443 ouverts à tout Internet jusqu'au cycle quotidien suivant.

table inet fleet (source inconnue dans le dépôt !) ouvre udp 443 à tout Internet ; si fr2-edge-fw.sh ne filtre que tcp dport, l'activation future de HTTP/3 (QUIC) sur nginx exposera l'origine en UDP 443. Par ailleurs, fail2ban est mort (f2b-table inactive) alors que 22/tcp reste public.

Risques modérés

Repli silencieux d'authentification dans cf.ts : basculer automatiquement d'un CLOUDFLARE_API_TOKEN invalide vers le login OAuth personnel de cf masque les pannes de secrets CI/VPS et exécute les changements avec des privilèges super-admin non bornés.

Fuite potentielle du jeton tunnel via /proc et binaire cloudflared non maintenu : si cloudflared-fr2.service passe le credential déchiffré via --token (ligne de commande) au lieu de --token-file %d/cloudflared-fr2, le JWT est lisible dans /proc/{pid}/cmdline. De plus, /usr/local/bin/cloudflared (2026.10.7) étant installé hors dépôt APT officiel, apt upgrade ne corrigera jamais ses vulnérabilités quic-go/Go.

Calibrage fr2-rl-edge (400 req / 10 s / IP+colo) et bruit 502 : 40 req/s par PoP est trop lâche pour protéger des routes d'authentification/API, mais peut bloquer des utilisateurs derrière CGNAT chargeant des dizaines de chunks JS/WASM en HTTP/2 si les assets ne sont pas exclus. Enfin, router 22 sous-domaines *.aphrody.app morts vers le tunnel mig-prd consomme des connexions origine pour renvoyer des 502.

3. Corrections concrètes (par composant)
A. Pare-feu infra/fleet/fr2/bin/fr2-edge-fw.sh et unité systemd

Filtrer IPv4 + IPv6 + TCP/UDP 80/443 atomiquement, valider les plages téléchargées avant application, ne jamais inclure 22/tcp dans @cf_v4/@cf_v6, et versionner/absorber table inet fleet :

Code snippet
table inet fr2_edge
delete table inet fr2_edge

table inet fr2_edge {
  set cf_v4    { type ipv4_addr; flags interval; elements = { $CF_V4_CSV }; }
  set cf_v6    { type ipv6_addr; flags interval; elements = { $CF_V6_CSV }; }
  set fleet_v4 { type ipv4_addr; flags interval; elements = { 10.200.77.0/24, $FR1_V4, $PRD_V4 }; }
  set fleet_v6 { type ipv6_addr; flags interval; elements = { $FR1_V6, $PRD_V6 }; }

  chain filter_web {
    iifname { "lo", "wg1" } accept
    ip saddr @fleet_v4 accept
    ip6 saddr @fleet_v6 accept
    ip saddr @cf_v4 accept
    ip6 saddr @cf_v6 accept
    counter drop
  }

  chain input {
    type filter hook input priority -20; policy accept;
    ct state established,related accept
    tcp dport { 80, 443 } jump filter_web
    udp dport { 80, 443 } jump filter_web
    # À J+7 pour fermer SSH public (JAMAIS @cf_v4/@cf_v6 ici) :
    # tcp dport 22 iifname != { "lo", "wg1" } ip saddr != @fleet_v4 ip6 saddr != @fleet_v6 counter drop
  }
}


Garantir l'application dès le boot : activer fr2-edge-fw.service (WantedBy=multi-user.target, Before=nginx.service, exécutant le cache local /var/lib/aphrody/cf-ips.{v4,v6} immédiatement avant toute tentative réseau) et ajouter Persistent=true + OnBootSec=2min dans fr2-edge-fw.timer.

Nettoyer les couches mortes : purger ufw et f2b-table inactifs, vérifier PerSourcePenalties yes dans /etc/ssh/sshd_config tant que 22/tcp est ouvert, et rapatrier les règles légitimes de table inet fleet dans le dépôt avant de supprimer la table orpheline.

B. Authentification d'origine nginx (Custom AOP compatible rosegriffon-cdn et fleet-health)

Émettre un certificat client dédié via votre PKI interne (upki-fetch) et le téléverser sur Cloudflare (Custom Authenticated Origin Pulls par zone), puis configurer nginx par vhost sans toucher à rosegriffon-cdn.conf :

Nginx
# /etc/nginx/conf.d/origin-auth.conf
geo $is_fleet_peer {
    default         0;
    127.0.0.0/8     1;
    ::1/128         1;
    10.200.77.0/24  1;
    # Ajouter ici les IP publiques v4/v6 de fr1 et prd
}

map "$is_fleet_peer:$ssl_client_verify" $origin_denied {
    "~^1:"      0;
    "0:SUCCESS" 0;
    default     1;
}


Dans les seuls blocs server {} de dbfr, api, cdn, creator et downloads :

Nginx
ssl_client_certificate /etc/nginx/certs/aphrody-custom-aop-ca.pem;
ssl_verify_client optional;
if ($origin_denied) { return 403; }


Remplacer les 19 certificats Let's Encrypt de fr2 (hors rosegriffon si DNS direct) par un certificat Cloudflare Origin CA (15 ans) et supprimer /etc/letsencrypt/cloudflare.ini ainsi que le certificat expiré achillea.rosegriffon.fr.

C. Architecture Cloudflare, tunnels et repli (cloudflare.toml, cf.ts, nginx)

Découpler mig-prd du green_port : restaurer un reverse-proxy local léger sur prd écoutant sur 127.0.0.1:3000 (piloté par le switch Blue/Green de deploy.toml) et pointer l'ingress cloudflare.toml sur [http://127.0.0.1:3000](http://127.0.0.1:3000).

Protéger les surfaces d'administration : ajouter immédiatement admin.aphrody.com, console.aphrody.com et control.aphrody.com dans une application Cloudflare Access dédiée avant toute exposition vers prd.

Réparer le repli HOSTING-POLICY (fr2) :

Sur fr2, pointer sites/cdn.aphrody.com.conf vers [http://127.0.0.1:28796](http://127.0.0.1:28796) et sites/downloads.aphrody.com.conf vers [http://127.0.0.1:28797](http://127.0.0.1:28797), puis supprimer conf.d/mig-tunnel.conf (127.0.0.1:18797).

Documenter et coder dans fleet-health qu'une bascule proxied: false vers fr2 doit ouvrir temporairement filter_web sur fr2 (ou utiliser un basculement d'origine derrière Cloudflare sans passer proxied: false).

Durcir cf.ts et remplacer CLOUDFLARE_API_TOKEN : générer un véritable Account API Token à privilèges minimaux, le déployer dans /etc/aphrody/secrets.env (fr2/prd) et modifier cf.ts pour échouer immédiatement (exit 1) si CLOUDFLARE_API_TOKEN est défini mais invalide (interdire le repli silencieux vers OAuth).

Cloisonner le SSH inter-machines et cloudflared :

Faire passer les flux SSH agents fr2 ↔ prd directement par WireGuard (10.200.77.3 / 10.200.77.5) avec clés SSH restreintes (from="10.200.77.x"), et scinder fleet-agents en jetons unidirectionnels distincts par hôte si Access reste requis.

Configurer l'autorité Cloudflare SSH CA (TrustedUserCAKeys) dans sshd_config pour le rendu navigateur de fr2-ssh et prd-ssh.

Vérifier que cloudflared-fr2.service utilise --token-file %d/cloudflared-fr2 (jamais --token en argument) et migrer /usr/local/bin/cloudflared vers le paquet APT officiel cloudflared.

D. Harnais infra/cloudflare/proof.ts et document FR2-CLOUDFLARE.md

Compléter proof.ts :

Ajouter les vérifications origin-closed et origin-ssh en IPv6 sur [2001:41d0:305:2100::a461]:80, :443 et :22.

Ajouter une assertion explicite sur [https://aphrody.com/api/](https://aphrody.com/api/)... (preuve de traversée du Worker vers mig-prd) et sur le blocage 302 Access de admin.aphrody.com.

Figer le code HTTP exact attendu par nom d'hôte dans la table d'assertions (ne jamais tolérer 502 sur un hôte censé répondre 200), et afficher le compte brut de connexions par colo sans déduplication silencieuse.

Corriger docs/infra/FR2-CLOUDFLARE.md : rectifier 31 → 33 CNAME, détailler les 2 certificats Let's Encrypt manquants (16 + 1 + 2 = 19), trancher l'état réel de nie.aphrody.app (21 vs 22 A), passer l'état de fermeture du port 22 en planifié à J+7, préciser les zones couvertes par fr2-rl-edge, et corriger l'ordre ainsi que la syntaxe CLI (update + ID explicites) du tableau de retour arrière.
## Passe 2 (2026-11-13 ~03:05) : 12/20

Barème : exactitude 4/6, réseau 3/5, sécurité 3/5, complétude 2/4. Défauts : ports d'ingress contradictoires (23000/19300), fail2ban et repli DNS contradictoires, preuves de plusieurs instantanés, zone Cloudflare tierce, pool figé sur green_port, port 22 non daté, 21 *.aphrody.app en 502, secret perdu si le dépôt échoue, écriture de secrets.env non atomique, secret de jeton en argv, access-scope trop faible, --record sans garde, chemin expFile cassé hors Windows, retrait du jeton non vérifié, retours arrière incomplets, cloudflared hors APT, rotation non datée.

## Passe 3 (2026-11-13 ~03:17) : 13/20

Barème : exactitude 4/6, réseau 4/5, sécurité 3/5, complétude 2/4. Défauts : boucle de rotation (3e secret perdu), jeton existant sans secret sur l'hôte, corps PUT renvoyant les champs en lecture seule, politique non reliée au jeton courant, retrait sans relecture des politiques, sourcing de secrets.env et absence de trap, 403 ambigu sans contrôle positif, --record figeant les dérives, 502 figés sans motif, mig-depot/mig-commons non figés, horodatage et compteur nft, ordre du retour arrière CNAME, port 22 sans propriétaire, expiration sans alerte, AOP toujours non fait.

## Passe 4 (2026-11-13 ~03:30) : 12/20

Exactitude 4/6, réseau 4/5, sécurité 2/5, complétude 2/4. Défauts : total des vérifications incohérent, section 7 confuse (caractère de contrôle), compteur nft présenté comme preuve, sonde v6 absente, blocs ACME webroot morts, statut « fait » de l'origine publique, liste de pairs dupliquée, AOP lié au Host, absence de test négatif, expiration AOP non contrôlée, clé de CA perdue, chemin temporaire, rotation sur panne ssh, champs d'app perdus au PUT, variable Windows héritée.

## Passe 5 (2026-11-13 ~03:50) : 12/20

Défauts : contournement de l'AOP par un SNI différent du Host, preuve fleet-only statique, prune multi-hôtes et à un seul PoP, fichier temporaire root prévisible, trois listes de pairs, clé de CA au coffre non documentée, CF_PROOF_TOKEN non documenté et rotation AOP dépendante d'OAuth, KEEP conservant destinations, storedClientId confondant fichier absent et hôte injoignable, critères du port 22 non mesurables.

## Passe 6 (2026-11-13 ~04:20) : 12/20

Exactitude 4/6, réseau 4/5, sécurité 2,5/5, complétude 1,5/4. Défauts : runs cités incohérents, critère mesh « depuis fr1 » non mesuré, jours verts sans contrôle de continuité, ssh-ca.ts sans retour arrière si la validation sshd échoue, CA sans AuthorizedPrincipalsFile et sudo sans mot de passe non documenté, unité de sonde dépendante de cloudflared-fr2, fichier de secrets exécuté par la sonde et première clé d'hôte acceptée, contrôle ssh-ca trop faible, jeton posé après l'import de lib.ts, ordre des passes, détails (colos, doublon KVM, chemins installés).
