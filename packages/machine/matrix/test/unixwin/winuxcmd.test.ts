// WinuxCmd de bout en bout : binaire multicall embarqué par niubash, comparé à uutils coreutils (Coreutils for
// Windows de Microsoft) sur une matrice d'applets avec la même entrée ; inventaire, codes de sortie, et applets
// appelés depuis niubash (liens de WinuxCmd dans le PATH du shell).
import { describe, expect, test } from "bun:test";
import { NIU, UUTILS, WINUXCMD, niu, spawn } from "./lib";

const t = WINUXCMD ? test : test.skip;
const parity = WINUXCMD && UUTILS ? test : test.skip;

describe("inventaire", () => {
  t("--list-all : au moins 176 commandes", async () => {
    const r = await spawn([WINUXCMD!, "--list-all"]);
    expect(r.code).toBe(0);
    const names = r.out.split(/\s+/).filter((w) => /^[a-z0-9_.[-]+$/.test(w));
    expect(names.length).toBeGreaterThanOrEqual(176);
    for (const c of [
      "ls",
      "grep",
      "sed",
      "find",
      "sort",
      "xargs",
      "sha256sum",
      "rev",
      "expr",
    ])
      expect(names).toContain(c);
  });

  t("applet inconnu : code non nul", async () => {
    const r = await spawn([WINUXCMD!, "zz-no-such-applet"]);
    expect(r.code).not.toBe(0);
  });
});

const INPUT = "pear 3\napple 10\nfig 2\napple 10\nkiwi 7\n";
// [applet et arguments, entrée] : mêmes octets et même code attendus de WinuxCmd et de uutils.
const MATRIX: [string[], string][] = [
  [["sort"], INPUT],
  [["sort", "-k2", "-n"], INPUT],
  [["sort", "-r", "-u"], INPUT],
  [["uniq", "-c"], "a\na\nb\n"],
  [["wc", "-l"], INPUT],
  [["wc", "-c"], INPUT],
  [["head", "-n", "2"], INPUT],
  [["tail", "-n", "2"], INPUT],
  [["cut", "-d", " ", "-f", "2"], INPUT],
  [["tr", "a-z", "A-Z"], INPUT],
  [["tr", "-d", "aeiou"], INPUT],
  [["tac"], INPUT],
  [["nl"], INPUT],
  [["fold", "-w", "3"], "abcdefgh\n"],
  [["paste", "-s", "-d", ","], "1\n2\n3\n"],
  [["seq", "1", "3", "10"], ""],
  [["seq", "-w", "8", "10"], ""],
  [["printf", "%05.1f|%x|%s\\n", "3.14159", "255", "é"], ""],
  [["echo", "-n", "x"], ""],
  [["basename", "/a/b/c.txt", ".txt"], ""],
  [["dirname", "/a/b/c.txt"], ""],
  [["sha256sum"], "abc"],
  [["md5sum"], "abc"],
  [["b2sum"], "abc"],
  [["base64"], "hello world"],
  [["base64", "-d"], "aGVsbG8gd29ybGQ="],
  [["od", "-An", "-tx1"], "AZ"],
  [["expand"], "a\tb\n"],
  [["join"], ""],
  [["factor", "360"], ""],
  [["numfmt", "--to=iec", "1048576"], ""],
  [["true"], ""],
  [["false"], ""],
  [["test", "1", "-lt", "2"], ""],
  [["wc", "-m"], "é€日\n"],
];

describe("parité uutils coreutils (stdout + code)", () => {
  for (const [argv, input] of MATRIX) {
    parity(argv.join(" "), async () => {
      const [w, u] = await Promise.all([
        spawn([WINUXCMD!, ...argv], { stdin: input }),
        spawn([UUTILS!, ...argv], { stdin: input }),
      ]);
      expect({ out: w.out, code: w.code }).toEqual({
        out: u.out,
        code: u.code,
      });
    });
  }
});

// Applets sans équivalent uutils, ou où uutils diverge (docs/unixwin/LEARNINGS.md) : valeur GNU attendue.
describe("valeurs GNU attendues", () => {
  t("rev (absent de uutils)", async () => {
    expect((await spawn([WINUXCMD!, "rev"], { stdin: "abc\n" })).out).toBe(
      "cba\n",
    );
  });
  t("expr 6 * 7 : argv non re-globbé", async () => {
    // uutils coreutils.exe (multicall) développe lui-même * sous Windows : « unexpected argument ».
    const r = await spawn([WINUXCMD!, "expr", "6", "*", "7"]);
    expect({ out: r.out, code: r.code }).toEqual({ out: "42\n", code: 0 });
  });
});

describe("depuis niubash", () => {
  const tn = WINUXCMD && NIU ? test : test.skip;
  tn("grep -P, sed -E, awk, find dans un pipeline", async () => {
    const r = await niu(
      "printf 'a1\\nb22\\nc333\\n' | grep -P '\\d{2,}' | sed -E 's/([a-z])/<\\1>/' | awk '{print length($0)}'",
    );
    expect(r.out).toBe("5\n6\n");
  });

  tn("xargs et find sur un arbre temporaire", async () => {
    const r = await niu(
      'd=$(mktemp -d) && mkdir -p "$d/x/y" && touch "$d/x/y/f1" "$d/x/f2" && (cd "$d" && find . -type f | sort | xargs -n1 basename) ; rm -rf "$d"',
    );
    expect(r.out).toBe("f2\nf1\n");
  });

  tn("ls d'un chemin POSIX de lecteur", async () => {
    const d = (process.env.SystemDrive ?? "C:").slice(0, 1).toLowerCase();
    const r = await niu(`ls -d /${d}/Windows`);
    expect(r.code).toBe(0);
    expect(r.out.trim().toLowerCase()).toMatch(
      new RegExp(`^(/${d}|${d}:)[\\\\/]windows$`),
    );
  });
});
