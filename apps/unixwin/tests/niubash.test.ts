// niubash de bout en bout : lancement par Bun.spawn et Bun Shell, parité octet pour octet avec GNU bash 5.3
// (stdout, code de sortie) sur une matrice de scripts, redirections, pipelines, encodage, stdin.
// Lancer : bun test ./apps/unixwin/tests
import { $ } from "bun";
import { describe, expect, test } from "bun:test";
import { BASH_REF, NIU, baseEnv, bashRef, niu, spawn } from "./lib";

const t = NIU ? test : test.skip;
const parity = NIU && BASH_REF ? test : test.skip;

describe("lancement", () => {
  t("Bun.spawn : --version", async () => {
    const r = await spawn([NIU!, "--version"]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^Niubash \d+\.\d+\.\d+/);
    expect(r.out).toMatch(/rubash\s+\S+/);
    expect(r.out).toMatch(/winuxcmd\s+WinuxCmd \d/);
  });

  t("Bun Shell : $`niu -c` avec interpolation échappée", async () => {
    const arg = "a b 'c' $HOME;";
    const out = await $`${NIU!} -c ${'printf "%s|" "$@"'} _ ${arg} x`
      .env(baseEnv())
      .text();
    expect(out).toBe(`${arg}|x|`);
  });

  t("Bun Shell : pipeline Bun -> niu -> Bun", async () => {
    const out = await $`echo hello | ${NIU!} -c ${"tr a-z A-Z"}`
      .env(baseEnv())
      .text();
    expect(out).toBe("HELLO\n");
  });

  t("stdin depuis Response, sortie binaire intacte", async () => {
    const all = new Uint8Array(256).map((_, i) => i);
    const r = await spawn([NIU!, "-c", "cat"], { stdin: all });
    expect(r.code).toBe(0);
    expect([...r.bytes]).toEqual([...all]);
  });

  t("aucun CR ajouté sur stdout", async () => {
    const r = await niu("printf 'a\\nb\\n'; echo c");
    expect([...r.bytes]).toEqual([...new TextEncoder().encode("a\nb\nc\n")]);
  });
});

// Matrice : [identifiant, script]. Chaque script doit donner les mêmes octets et le même code que GNU bash.
const MATRIX: [string, string][] = [
  // codes de sortie
  ["exit-7", "exit 7"],
  ["false", "false"],
  ["not", "! true; echo $?"],
  ["set-e", "set -e; false; echo jamais"],
  ["pipefail", "set -o pipefail; false | true; echo $?"],
  ["pipestatus", "true | false | (exit 3); echo ${PIPESTATUS[@]}"],
  ["subshell-exit", "(exit 42); echo $?"],
  ["cmdsubst-status", "x=$(exit 5); echo $?"],
  ["return-func", "f(){ return 9; }; f; echo $?"],
  ["exit-256", "exit 256"],
  ["command-not-found", "nonexistent_cmd_zz 2>/dev/null; echo $?"],
  // redirections
  ["redir-stderr", "echo err >&2; echo out"],
  ["redir-2to1", "{ echo a; echo b >&2; } 2>&1"],
  ["redir-devnull", "echo x >/dev/null; echo ok"],
  ["redir-fd3", "exec 3>&1; echo via3 >&3; exec 3>&-"],
  ["herestring", "cat <<< 'here string'"],
  ["heredoc-expand", "v=42; cat <<EOF\nv=$v\nEOF"],
  ["heredoc-quoted", "v=42; cat <<'EOF'\nv=$v\nEOF"],
  ["heredoc-tab", "cat <<-EOF\n\tindent\n\tEOF"],
  [
    "tmpfile-append",
    'f=$(mktemp); echo 1 >"$f"; echo 2 >>"$f"; cat "$f"; rm -f "$f"',
  ],
  [
    "noclobber",
    'f=$(mktemp); set -C; echo x 2>/dev/null >"$f" || echo refused; rm -f "$f"',
  ],
  // pipelines
  ["pipe-sort", "printf 'c\\na\\nb\\n' | sort"],
  [
    "pipe-while-read",
    "printf '1\\n2\\n3\\n' | while read -r n; do echo $((n*2)); done",
  ],
  [
    "pipe-lastpipe",
    "shopt -s lastpipe; set +m; echo v | read x; echo ${x-unset}",
  ],
  ["pipe-procsub", "cat <(echo from-procsub)"],
  ["pipe-tee", "echo t | tee /dev/null"],
  ["pipe-grep-count", "printf 'a\\nb\\na\\n' | grep -c a"],
  ["pipe-wc", "printf 'x y\\nz\\n' | wc -l"],
  // expansions et syntaxe
  ["param-default", "unset u; echo ${u:-def} ${u-def2}"],
  ["param-case", "v=hello; echo ${v^^} ${v^}"],
  ["param-subst", "v=a-b-c; echo ${v//-/+} ${v#*-} ${v%-*}"],
  ["param-length", "v=abcdef; echo ${#v} ${v:1:3}"],
  ["arith", "echo $(( (7*6) % 5 )) $(( 2**10 )) $(( 0x1f ))"],
  ["brace", "echo {1..5} {a,b}c"],
  [
    "array",
    "a=(x 'y z' w); echo ${#a[@]} \"${a[1]}\"; a+=(v); echo ${a[@]: -1}",
  ],
  ["assoc", "declare -A m=([k]=v [j]=w); echo ${m[k]} ${#m[@]}"],
  ["quoting", "printf '[%s]' \"a  b\" 'c\\d' $'e\\tf'"],
  ["printf-q", "printf '%q\\n' 'a b' \"it's\""],
  [
    "case",
    "for w in apple kiwi; do case $w in a*) echo A;; *) echo O;; esac; done",
  ],
  [
    "getopts",
    "set -- -a -b val x; while getopts ab: o; do echo $o${OPTARG:+=$OPTARG}; done; shift $((OPTIND-1)); echo $1",
  ],
  ["local", "x=g; f(){ local x=l; echo $x; }; f; echo $x"],
  ["trap-exit", "trap 'echo bye' EXIT; echo hi"],
  ["cmdsubst-newlines", "x=$(printf 'a\\n\\n\\n'); echo \"[$x]\""],
  ["ifs-read", "IFS=: read -r a b c <<< 'p:q:r'; echo $c$b$a"],
  ["glob-nomatch", "shopt -s nullglob; echo zz_nomatch_*; echo end"],
  [
    "extglob",
    "shopt -s extglob; v=foo.txt; [[ $v == *.@(txt|md) ]] && echo match",
  ],
  ["regex", "[[ abc123 =~ ^[a-z]+([0-9]+)$ ]] && echo ${BASH_REMATCH[1]}"],
  ["declare-p", "declare -a z=(1 2); declare -p z"],
  ["function-def", "g(){ echo hi; }; declare -f g"],
  ["seq-loop", "for ((i=0;i<3;i++)); do printf %d $i; done; echo"],
  ["mapfile", "mapfile -t L < <(printf 'l1\\nl2\\n'); echo ${#L[@]} ${L[1]}"],
  // persona MSYS (Git for Windows) : pwd -W, cygpath
  ["msys-pwd-W", "cd /c/Windows && pwd -W && pwd -LW"],
  [
    "msys-cygpath",
    "cygpath -w /c/Windows; cygpath -m /c/Windows; cygpath -u 'C:\\Windows'",
  ],
  // glob avec un préfixe Windows venu d’une expansion (variables d’environnement Windows)
  ["glob-backslash-prefix", "d='C:\\Windows'; echo \"$d\"/win*.ini"],
  [
    "glob-env-prefix",
    'echo "$LOCALAPPDATA"/Microsoft/Windows/*.dat | head -c 0; echo "$LOCALAPPDATA"/Temp/../Temp',
  ],
  // noms Windows en majuscules comme sous Git for Windows (SystemRoot -> SYSTEMROOT, windir -> WINDIR)
  ["win-env-upper", "echo \"$SYSTEMROOT|$WINDIR|$COMSPEC|$SYSTEMDRIVE\""],
  // encodage
  ["utf8-echo", "echo 'é€日本𝄞'"],
  ["utf8-length", "v='é€日'; echo ${#v}"],
  ["utf8-printf-hex", "printf '\\xe2\\x82\\xac\\n'"],
  ["utf8-upper", "v='éa'; echo ${v^^}"],
  ["utf8-tr", "echo 'abc' | tr a-c x-z"],
];

describe("parité GNU bash 5.3 (stdout + code)", () => {
  for (const [id, script] of MATRIX) {
    parity(id, async () => {
      const [a, b] = await Promise.all([niu(script), bashRef(script)]);
      expect({ out: a.out, code: a.code }).toEqual({
        out: b.out,
        code: b.code,
      });
    });
  }
});
