#!/usr/bin/env osh
# cpp/win32/smoke.sh: Windows-native smoke tests.  Run with the built shell:
#   _build\win32\osh.exe cpp/win32/smoke.sh
# Each case runs in a fresh `osh -c` and compares stdout.

OSH=${OSH:-$0}
case $OSH in
  *.sh) OSH=$(command -v osh 2>/dev/null) ;;
esac
OSH=${SMOKE_OSH:-$OSH}

pass=0
fail=0

t() {
  local name=$1 code=$2 want=$3
  local got
  got=$("$OSH" -c "$code" 2>&1)
  if [[ "$got" == "$want" ]]; then
    pass=$((pass + 1))
    echo "PASS $name"
  else
    fail=$((fail + 1))
    echo "FAIL $name"
    echo "  want: $(printf %q "$want")"
    echo "  got:  $(printf %q "$got")"
  fi
}

tmp=${TMP:-/tmp}
tmp=${tmp//\\//}

t echo 'echo hello' 'hello'
t arith 'echo $((6*7))' '42'
t func 'f() { echo "f:$1:$#"; return 3; }; f a b; echo $?' $'f:a:2\n3'
t array 'a=(x y z); echo ${#a[@]} ${a[1]} "${a[@]:1}"' '3 y y z'
t assoc 'declare -A m; m["k"]=v; echo ${m["k"]}' 'v'
t cmdsub 'x=$(echo sub); echo "[$x]"' '[sub]'
t cmdsub-nested 'echo $(echo $(echo deep))' 'deep'
t cmdsub-ext 'x=$(cmd.exe /d /c echo native); echo "[${x%$'"'"'\r'"'"'}]"' '[native]'
t backtick 'echo `echo bt`' 'bt'
t pipe-builtin-ext 'echo a b c | C:/Windows/System32/find.exe /c " "' $'1'
t pipe-ext-builtin 'cmd.exe /d /c echo hi | { read -r l; echo "got ${l%$'"'"'\r'"'"'}"; }' 'got hi'
t pipe-3 'printf "b\na\nc\n" | sort | { while read -r l; do printf "%s," "$l"; done; }; echo' 'a,b,c,'
t pipestatus 'false | true; echo ${PIPESTATUS[@]}' '1 0'
t redir-out "echo hi > '$tmp/osh_smoke.txt'; read -r l < '$tmp/osh_smoke.txt'; echo \$l" 'hi'
t redir-append "echo a > '$tmp/osh_smoke.txt'; echo b >> '$tmp/osh_smoke.txt'; while read -r l; do printf %s \$l; done < '$tmp/osh_smoke.txt'; echo" 'ab'
t redir-stderr 'echo err >&2 2>/dev/null; { echo e2 >&2; } 2>&1' $'err\ne2'
t devnull 'echo gone > /dev/null; echo ok' 'ok'
t heredoc $'x=1; cat <<EOF\nv=$x\nEOF' 'v=1'
t herestring 'read -r a b <<< "1 2"; echo $b' '2'
t subshell-isolation 'z=1; (z=2; echo in=$z); echo out=$z' $'in=2\nout=1'
t subshell-cd 'cd /; (cd /c/Windows); pwd' '/'
t subshell-exit '(exit 7); echo $?' '7'
t errexit 'set -e; false || echo recovered; echo end' $'recovered\nend'
t case 'case foo.txt in *.txt) echo txt;; esac' 'txt'
t extglob 'shopt -s extglob; case ab in @(ab|cd)) echo yes;; esac' 'yes'
t regex '[[ abc =~ ^a(b)c$ ]] && echo ${BASH_REMATCH[1]}' 'b'
t glob "cd '$tmp'; echo osh_smok*.txt" 'osh_smoke.txt'
t path-lookup 'type -t cmd' 'file'
t external-status 'cmd.exe /d /c exit 5; echo $?' '5'
t not-found 'nonexistent_cmd_xyz 2>/dev/null; echo $?' '127'
t declare-f-roundtrip 's=$(f() { echo x; }; declare -f f); eval "$s"; f' 'x'
t alias $'shopt -s expand_aliases\nalias e1="echo aliased"\ne1' 'aliased'
t shopt-p 'shopt -p extglob' 'shopt -u extglob'
t export-env 'export FOO=bar; cmd.exe /d /c "echo %FOO%"' $'bar\r'
t bg-wait 'sleep_fn() { echo bg; }; sleep_fn & wait; echo done' $'bg\ndone'
t printf-v 'printf -v x "%03d" 7; echo $x' '007'

echo "passed=$pass failed=$fail"
