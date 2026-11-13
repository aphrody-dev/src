# Revue Gemini : ay upstream et docs/upstream/STRATEGY.md (2026-11-13)

Moteur : relais ai-os `gemini_review` (antigravity), sur un résumé du document et le code de `replay`, `pickTree`, `moveBranch`, `push`. Note : 12/20.

Retenu et corrigé dans le même commit :

- conflit pendant `sync` : l'état (`last-sync.json`) liste aussi les patchs retirés avant le conflit (`dropped_before`) ;
- `pickTree` : sortie de `git merge-tree` lue avec `-z`, les chemins en conflit restent exacts (espaces, guillemets, non ASCII) ;
- registre des statuts : deux patchs au même nom font échouer la lecture de la pile au lieu de partager un statut.

Déjà couvert (vérifié dans le code) : code de `merge-tree` autre que 0 ou 1 -> exception ; commits de fusion refusés (`branchSeries`) et commit racine refusé (`pickTree`) ; bail lu avant le rejeu ; `isClean` avant `reset --keep` ; `Persistent=true` dans le timer ; échec d'une PR fusionnée en squash modifiée = conflit (code 3) qui nomme le patch, documenté en section 9.

Écarté : SHA identiques entre deux rejeux (le rejeu n'a lieu que si la base change ou si un patch est retiré, et tout changement de base change les SHA) ; verrou entre agents (le bail de `--force-with-lease` suffit, le passage suivant reprend).

Reste ouvert : test d'un push dont le bail est perdu ; alerte si le dernier `sync` réussi date de plus de 36 h (aujourd'hui visible dans `ay upstream status`, `last_sync`).
