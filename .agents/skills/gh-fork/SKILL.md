---
name: gh-fork
description: Forker des dépôts upstream dans l'org aphrody-labs (ou aphrody-dev) et les inscrire dans third_party/forks.txt. Utiliser pour toute demande « forke X », suivi d'upstream, vendorisation.
---
1. Vérifier l'existant : `gh api repos/aphrody-labs/<repo> --jq .full_name` et `rg -i <repo> C:/labs/third_party/forks.txt`.
2. Forker : `gh repo fork <owner>/<repo> --org aphrody-labs --clone=false --default-branch-only 2>&1 | tail -1`.
3. Contrôler : `gh api repos/aphrody-labs/<repo> --jq '.full_name+" fork="+(.fork|tostring)+" parent="+.parent.full_name'`.
4. Ajouter `<owner>/<repo> <langage>` à third_party/forks.txt (pas de doublon). Pas de clone local sauf besoin : le code vit dans third_party/<nom> du monorepo.
