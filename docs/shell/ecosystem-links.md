# Dépôts liés au shell (vérifiés `gh api`, 2026-11-12)

| Dépôt | Rôle pour le shell ultime | Dernière release | Windows natif | Fork |
|---|---|---|---|---|
| vercel-labs/fx (Zig, Apache-2.0) | agent de code « Unix-like », lance les commandes dans le login shell, cache des fichiers de démarrage (même problème que le snapshot Claude), `AI_AGENT=fx` | v0.0.16 (2026-10-29) | non : binaires linux/macos seulement | aphrody-labs/fx |
| vercel-labs/wterm (TS + Zig→WASM ~49 KB) | émulateur de terminal web, rangées en DOM ; base d'un terminal WebGPU/Blitz pour labs | npm @wterm/* | web | aphrody-labs/wterm |
| vercel-labs/skills (TS, MIT) | outil `npx skills` ; distribution des skills du plugin labs | — | bun | aphrody-labs/skills |
| microsoft/vcpkg (MIT) | paquets C/C++ (readline, ncurses, pcre2) pour patcher brush/busybox sans MSYS | 2026.10.16 | oui | aphrody-labs/vcpkg |
| llvm/llvm-project | clang/lld/libc++ ; toolchain des forks C (busybox-w32, onetrue-awk) sans MinGW | llvmorg-23.1.5 (2026-11-03) | oui | aphrody-labs/llvm-project |
| GNU (gnu.org/software) | référence comportementale : bash, coreutils, gawk, sed, grep, findutils, make, readline | — | non sans MSYS/Cygwin : servent d'oracle de conformité, pas de binaire | — |

Conséquences pour le plan (PLAN.md) :
- awk manquant : compiler onetrue-awk ou goawk ; clang de llvm-project + vcpkg évitent MinGW/MSYS.
- fx : étudier sa mise en cache des startup files pour le snapshot sous 60 KB ; pas de build Windows, port Zig possible (Zig cible windows nativement) [NV].
- wterm : candidat UI terminal dans aphrody (WASM), parallèle à Windows Terminal.
- GNU : tests de conformité brush vs GNU bash 5.3 exécutés sur fr1 (Linux), jamais en local.
