// Cas de conformité sh/bash. Chaque cas : un script, la sortie attendue (stdout exact, fins de ligne normalisées).
// Groupes : `claude` = ce que Claude Code exige (preuve : binaire claude.exe 2.1.318, voir
// apps/nt/docs/research/shell-replacement.md), `posix`, `bash`, `windows`.
export type Case = {
  id: string;
  group: "claude" | "posix" | "bash" | "windows";
  script: string;
  expect: string;
  argv?: string[];
};

export const cases: Case[] = [
  // Invocation exacte de Claude Code pour l'instantané : spawn(shell, ["-c", "-l", script]).
  {
    id: "claude-c-l",
    group: "claude",
    argv: ["-c", "-l"],
    script: "echo ok",
    expect: "ok",
  },
  {
    id: "claude-declare-F",
    group: "claude",
    script: "f(){ :; }; declare -F | grep -c ' f$'",
    expect: "1",
  },
  {
    id: "claude-typeset-f",
    group: "claude",
    script: "g(){ echo hi; }; typeset -f g | head -1",
    expect: "g () ",
  },
  {
    id: "claude-compgen-v",
    group: "claude",
    script: "ZZ_TEST=1; compgen -v | grep -c '^ZZ_TEST$'",
    expect: "1",
  },
  {
    id: "claude-shopt-aliases",
    group: "claude",
    script: "shopt -s expand_aliases; alias hey='echo alias-ok'\nhey",
    expect: "alias-ok",
  },
  {
    id: "claude-unalias",
    group: "claude",
    script: "alias x=y; unalias -a; alias | wc -l | tr -d ' '",
    expect: "0",
  },
  {
    id: "claude-builtin-eval",
    group: "claude",
    script: "\\builtin eval 'echo ev'",
    expect: "ev",
  },
  {
    id: "claude-command-v",
    group: "claude",
    script: "command -v echo >/dev/null && echo found",
    expect: "found",
  },
  {
    id: "claude-trap-exit",
    group: "claude",
    script: "trap 'echo bye' EXIT; echo hi",
    expect: "hi\nbye",
  },

  // POSIX
  {
    id: "posix-subst",
    group: "posix",
    script: "a=$(printf 'x%s' y); echo \"$a\"",
    expect: "xy",
  },
  {
    id: "posix-pipe",
    group: "posix",
    script: "printf 'b\\na\\n' | sort | head -1",
    expect: "a",
  },
  {
    id: "posix-heredoc",
    group: "posix",
    script: "cat <<EOF\nl1\nl2\nEOF",
    expect: "l1\nl2",
  },
  {
    id: "posix-case",
    group: "posix",
    script: "case abc in a*) echo m;; *) echo n;; esac",
    expect: "m",
  },
  {
    id: "posix-arith",
    group: "posix",
    script: "echo $(( 6 * 7 ))",
    expect: "42",
  },
  {
    id: "posix-func-ret",
    group: "posix",
    script: "f(){ return 3; }; f; echo $?",
    expect: "3",
  },
  {
    id: "posix-param",
    group: "posix",
    script: "p=/a/b/c.txt; echo ${p##*/} ${p%.*}",
    expect: "c.txt /a/b/c",
  },
  {
    id: "posix-set-e",
    group: "posix",
    script: "set -e; false || true; echo alive",
    expect: "alive",
  },
  {
    id: "posix-redirect",
    group: "posix",
    script: "{ echo out; echo err >&2; } 2>&1 | wc -l | tr -d ' '",
    expect: "2",
  },

  // bash
  {
    id: "bash-arrays",
    group: "bash",
    script: "a=(x y z); echo ${#a[@]} ${a[1]}",
    expect: "3 y",
  },
  {
    id: "bash-assoc",
    group: "bash",
    script: "declare -A m; m[k]=v; echo ${m[k]}",
    expect: "v",
  },
  {
    id: "bash-dbl-bracket",
    group: "bash",
    script: "[[ abc == a* && 2 -lt 3 ]] && echo t",
    expect: "t",
  },
  {
    id: "bash-regex",
    group: "bash",
    script: "[[ x12 =~ ^x([0-9]+)$ ]] && echo ${BASH_REMATCH[1]}",
    expect: "12",
  },
  {
    id: "bash-subst-repl",
    group: "bash",
    script: "s=aXbXc; echo ${s//X/-}",
    expect: "a-b-c",
  },
  { id: "bash-procsub", group: "bash", script: "cat <(echo ps)", expect: "ps" },
  {
    id: "bash-herestring",
    group: "bash",
    script: "read -r a b <<< 'one two'; echo $b",
    expect: "two",
  },
  {
    id: "bash-printf-v",
    group: "bash",
    script: "printf -v out '%03d' 7; echo $out",
    expect: "007",
  },
  {
    id: "bash-pipefail",
    group: "bash",
    script: "set -o pipefail; false | true; echo $?",
    expect: "1",
  },
  {
    id: "bash-local",
    group: "bash",
    script: "v=g; f(){ local v=l; echo $v; }; f; echo $v",
    expect: "l\ng",
  },
  { id: "bash-brace", group: "bash", script: "echo {1..3}", expect: "1 2 3" },
  {
    id: "bash-version-var",
    group: "bash",
    script: "[[ -n $BASH_VERSION ]] && echo has",
    expect: "has",
  },

  // Windows
  {
    id: "win-cd-drive",
    group: "windows",
    script: "cd /c/Windows && pwd",
    expect: "/c/Windows",
  },
  {
    id: "win-cd-native",
    group: "windows",
    script: "cd C:/Windows && pwd",
    expect: "/c/Windows",
  },
  {
    id: "win-exe-lookup",
    group: "windows",
    script: "command -v cmd >/dev/null && echo cmd-found",
    expect: "cmd-found",
  },
  // `cmd //c` est un idiome MSYS ; MSYS_NO_PATHCONV=1 rend `/c` neutre sous Git Bash et n'a pas d'effet ailleurs.
  {
    id: "win-run-native",
    group: "windows",
    script: "MSYS_NO_PATHCONV=1 cmd /d /c echo native | tr -d '\\r'",
    expect: "native",
  },
];
