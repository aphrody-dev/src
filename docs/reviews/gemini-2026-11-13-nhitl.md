# Revue Gemini 4 Carbon High : plugins/aphrody-nhitl (2026-11-13)

Chat : https://gemini.google.com/app/2ffee3c53d076a83. Entrée : src/policy.ts (état e9c7727) + contexte du plugin. Note provisoire : **9,5/20**.

## Suites données (daa41cb, 92 assertions `bun test`)

- Appliqué : récursion `bash -c`/`-xc`, `pwsh -Command`/`-enc` (base64 UTF-16LE), `cmd /c`, heredoc vers un shell ; tokenizer Windows (`\` littéral sauf avant `$ \` " \`, reparse littéral si guillemet non fermé, backtick PowerShell) ; heredocs = données ; `..` résolus avant le glob, lecteur conservé, `D:x`, `::$DATA`, realpath (jonctions) ; variables non résolues = refus ; `-Path:X`, `-Filter`, `del /ah`, suppression via pipeline, `find` multi-chemins et `-exec rm`, `robocopy /mir`, `git clean -f` hors racines ; git `--git-dir`/`--work-tree`/`-C` collé, préfixes `--mirr`/`--fo`, `:main`, `--delete main`, `update-ref refs/heads`, `git show` d'un secret ; push : refs réelles, remote amont (`@{push}`), fail-closed ; regex de fichiers stricte (une doc citant Unreal n'est plus bloquée) ; noms `prod.env`, `.env.x.y`, `.env*`, `/etc/aphrody`, `< .env` ; echo/printf retirés des lecteurs ; publication détectée par sous-commande (fin des faux positifs `gh issue`, `curl` GET).
- Non retenu (périmètre « petite liste de refus », pas un bac à sable) : Write/Edit hors racines, contenu des dossiers publiés par `npm`/`cargo publish`, lecture indirecte via un script écrit puis exécuté.
- Message 2/2 (hook.ts, hooks.json) non envoyé : la revue continue côté agent pair (session nt-d6) qui a repris le plugin.
