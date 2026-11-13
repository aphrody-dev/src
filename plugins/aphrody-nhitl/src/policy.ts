// NHITL policy: allow everything except a small hardcoded deny list that encodes the
// owner's standing constraints. Pure except for two bounded git probes (rm outside roots,
// git push outgoing files). Returns null (allow) or a French reason (deny).
import { HOME } from "./lib.ts";

export type Verdict = { deny: string } | null;

const TEMP = (process.env.TEMP ?? process.env.TMP ?? `${HOME}/AppData/Local/Temp`).replaceAll("\\", "/");

// Roots where deletion is always fine (lowercased, forward slashes, no trailing slash).
const ROOTS = ["c:/src", "c:/msys", "c:/msys64", TEMP, "/tmp", "/var/tmp", "c:/windows/temp", `${HOME}/appdata/local/temp`].map(
  (r) => r.toLowerCase().replace(/\/+$/, ""),
);

// ---------- secrets ----------
const SECRET_RX = new RegExp(
  [
    String.raw`/etc/aphrody/secrets\.env`,
    String.raw`(^|[\\/\s'"=:(])\.env(\.(?!example\b|sample\b|template\b|dist\b)[\w-]+)?(?=$|[\s'"):;|&>])`,
    String.raw`Microsoft[\\/]+(Protect|Credentials|Vault)\b`,
    String.raw`\.dpapi\b`,
    String.raw`ProtectedData\]?::Unprotect`,
    String.raw`\.credentials\.json\b`,
    String.raw`\.git-credentials\b`,
    String.raw`\bid_(rsa|ed25519|ecdsa)(?!\.pub)\b`,
  ].join("|"),
  "i",
);

const READERS = new Set(
  "cat type head tail less more bat nl strings xxd od hexdump base64 rg grep egrep fgrep sed awk gawk jq jaq yq cut sort uniq tac rev column fold diff cmp get-content gc select-string sls format-hex certutil findstr out-host write-output echo printf print python python3 py node bun deno perl ruby pwsh powershell sh bash niubash osh cmd".split(" "),
);

const INTERPRETERS = new Set("python python3 py node bun deno perl ruby pwsh powershell sh bash niubash osh cmd".split(" "));

export function isSecretPath(p: string): boolean {
  return SECRET_RX.test(p);
}

// ---------- restricted third-party content (never publish) ----------
const RESTRICTED_RX = new RegExp(
  [
    String.raw`\bUnreal(Engine|BuildTool|HeaderTool)?\b`,
    String.raw`\bUE[45](\.\d+)?\b`,
    String.raw`\.(uasset|umap|upk|uproject)\b`,
    String.raw`\bEpic ?Games\b`,
    String.raw`VC[\\/]+Tools[\\/]+MSVC`,
    String.raw`Windows Kits`,
    String.raw`Microsoft Visual Studio[\\/]`,
    String.raw`\b(vcruntime|msvcp|ucrtbase|concrt|vccorlib|vcomp)\w*\.(dll|lib|pdb)\b`,
    String.raw`\bapi-ms-win-crt-`,
    String.raw`\b(libcmt|libucrt|libvcruntime|msvcrt|ucrt|libcpmt|msvcprt)d?\.lib\b`,
    String.raw`\bvc_?redist`,
  ].join("|"),
  "i",
);

export function isRestricted(s: string): boolean {
  return RESTRICTED_RX.test(s);
}

// ---------- shell parsing ----------
// Split into simple commands on ; & | && || newlines $( ` and tokenize honoring quotes.
export function segments(cmd: string): string[][] {
  const segs: string[][] = [];
  let cur: string[] = [];
  let tok = "";
  let has = false;
  let q: string | null = null;
  const push = () => {
    if (has) cur.push(tok);
    tok = "";
    has = false;
  };
  const cut = () => {
    push();
    if (cur.length) segs.push(cur);
    cur = [];
  };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i]!;
    if (q) {
      if (c === q) q = null;
      else if (c === "\\" && q === '"' && i + 1 < cmd.length) tok += cmd[++i];
      else tok += c;
      continue;
    }
    if (c === "'" || c === '"') {
      q = c;
      has = true;
    } else if (c === " " || c === "\t") push();
    else if (c === ";" || c === "\n" || c === "&" || c === "|" || c === "`" || c === "(" || c === ")") cut();
    else if (c === "$" && cmd[i + 1] === "(") {
      cut();
      i++;
    } else {
      tok += c;
      has = true;
    }
  }
  cut();
  return segs;
}

const PREFIX = new Set(["sudo", "doas", "command", "builtin", "exec", "time", "nice", "nohup", "env", "xargs", "call", "&", "."]);

// Return [verb, args] after skipping env assignments and wrappers.
export function verbOf(seg: string[]): [string, string[]] {
  let i = 0;
  while (i < seg.length && (PREFIX.has(seg[i]!.toLowerCase()) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(seg[i]!) || (i > 0 && PREFIX.has(seg[i - 1]!.toLowerCase()) && seg[i]!.startsWith("-"))))
    i++;
  const v = (seg[i] ?? "").replaceAll("\\", "/").split("/").pop()!.toLowerCase().replace(/\.(exe|cmd|bat|ps1)$/, "");
  return [v, seg.slice(i + 1)];
}

// ---------- paths ----------
export function normPath(p: string, cwd: string): string | null {
  let s = p
    .replace(/^~(?=$|[\\/])/, HOME)
    .replace(/\$\{?(HOME|USERPROFILE)\}?|\$env:(HOME|USERPROFILE)|%(HOME|USERPROFILE)%/gi, HOME)
    .replace(/\$\{?(TEMP|TMP|TMPDIR)\}?|\$env:(TEMP|TMP)|%(TEMP|TMP)%/gi, TEMP)
    .replaceAll("\\", "/");
  if (/[$%]/.test(s)) return null; // unresolved variable
  s = s.replace(/^\/([a-zA-Z])(?=\/|$)/, "$1:"); // /c/x -> c:/x (Git Bash)
  const cw = cwd.replaceAll("\\", "/").replace(/^\/([a-zA-Z])(?=\/|$)/, "$1:");
  if (!/^([a-zA-Z]:)?\//.test(s)) s = `${cw}/${s}`;
  // cut at first glob char, keep the directory part
  const g = s.search(/[*?[]/);
  if (g >= 0) s = s.slice(0, s.lastIndexOf("/", g) + 1) || "/";
  const parts: string[] = [];
  for (const part of s.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== "." && part !== "") parts.push(part);
  }
  let r = parts.join("/");
  if (!/^[a-zA-Z]:/.test(r)) r = `/${r}`;
  return r.toLowerCase().replace(/\/+$/, "") || "/";
}

export function underRoots(p: string): boolean {
  return ROOTS.some((r) => p === r || p.startsWith(`${r}/`));
}

function sh(args: string[], cwd: string, ms = 1500): { ok: boolean; out: string } {
  try {
    const r = Bun.spawnSync(args, { cwd, stdout: "pipe", stderr: "ignore", timeout: ms, windowsHide: true });
    return { ok: r.exitCode === 0, out: r.stdout.toString() };
  } catch {
    return { ok: false, out: "" };
  }
}

// A path outside the roots is deletable only if git holds a clean copy of it.
function gitCopyExists(p: string): boolean {
  const dir = p.replace(/\/[^/]*$/, "") || "/";
  const top = sh(["git", "-C", dir, "rev-parse", "--show-toplevel"], process.cwd());
  if (!top.ok) return false;
  const root = top.out.trim();
  if (!sh(["git", "-C", root, "ls-files", "--error-unmatch", "--", p], root).ok) return false;
  const st = sh(["git", "-C", root, "status", "--porcelain", "--ignored", "--", p], root);
  return st.ok && st.out.trim() === "";
}

const DELETERS = new Set(["rm", "rmdir", "del", "erase", "rd", "remove-item", "ri", "unlink", "shred"]);

function deleteTargets(verb: string, args: string[]): string[] {
  const t: string[] = [];
  let endOpts = false;
  for (const a of args) {
    if (a === "--") {
      endOpts = true;
      continue;
    }
    if (!endOpts && a.startsWith("-")) continue;
    if (!endOpts && (verb === "del" || verb === "erase" || verb === "rd" || verb === "rmdir") && /^\/[a-zA-Z]$/.test(a)) continue;
    if (/^[<>]|^\d?>/.test(a)) break;
    t.push(a);
  }
  return t;
}

// ---------- git ----------
function gitSub(args: string[]): [string, string[], string | null] {
  let i = 0;
  let dir: string | null = null;
  while (i < args.length && args[i]!.startsWith("-")) {
    if (args[i] === "-C") dir = args[++i] ?? null;
    else if (args[i] === "-c") i++;
    i++;
  }
  return [(args[i] ?? "").toLowerCase(), args.slice(i + 1), dir];
}

function forcePush(a: string[]): boolean {
  return a.some(
    (x) => /^--(force(-with-lease|-if-includes)?|mirror)(=.*)?$/.test(x) || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(x) || /^\+[^\s]/.test(x) || /:\+/.test(x),
  );
}

const PUBLISHERS = new Set(["gh", "npm", "bun", "pnpm", "yarn", "cargo", "docker", "podman", "rclone", "scp", "rsync", "wrangler", "cf", "aws", "gsutil", "gcloud", "curl", "oras", "twine", "dotnet", "nuget"]);
const PUBLISH_RX = /\b(publish|push|release (create|upload)|upload|gist create|copy|sync|move|put|cp|object put|deploy)\b|(^|\s)(-T|--upload-file|-F|--data-binary)\b/;

// ---------- main ----------
export function decide(tool: string, input: Record<string, any>, cwd: string): Verdict {
  if (tool === "AskUserQuestion") return { deny: "NHITL : aucune question à l'utilisateur. Trancher seul avec l'hypothèse la plus raisonnable et continuer." };

  if (tool === "Read" || tool === "NotebookRead") {
    if (isSecretPath(String(input.file_path ?? ""))) return { deny: "NHITL : lecture d'un fichier secret interdite (utiliser les clés via env, jamais afficher les valeurs)." };
    return null;
  }
  if (tool === "Grep" || tool === "Glob") {
    const s = `${input.path ?? ""} ${input.glob ?? ""}`;
    if (tool === "Grep" && isSecretPath(s)) return { deny: "NHITL : recherche dans un fichier secret interdite." };
    return null;
  }
  if (tool !== "Bash" && tool !== "PowerShell" && tool !== "Monitor") return null;

  return shellVerdict(String(input.command ?? ""), cwd, false);
}

// ssh remote commands: options that take a value, so the host is the first other arg.
const SSH_VALUED = new Set(["-p", "-i", "-o", "-l", "-J", "-F", "-b", "-c", "-D", "-E", "-L", "-R", "-W", "-S", "-m", "-O", "-Q", "-w", "-e", "-B", "-I"]);

function shellVerdict(cmd: string, cwd: string, remote: boolean): Verdict {
  if (!cmd) return null;
  for (const seg of segments(cmd)) {
    const [verb, args] = verbOf(seg);
    const text = seg.join(" ");
    // Redirection targets are writes, not reads: `echo x > .env` is allowed.
    const readText = seg.filter((t, i) => !/^\d?>>?/.test(t) && !/^\d?>>?$/.test(seg[i - 1] ?? "")).join(" ");
    const inPlace = verb === "sed" && args.some((a) => /^-i/.test(a));
    // Interpreters only count as readers when they run inline code (-e/-c/-Command ...).
    const interp = INTERPRETERS.has(verb) && !args.some((a) => /^(-e|-c|-p|--eval|--print|-command|-Command|-EncodedCommand|\/c)$/i.test(a));

    if (READERS.has(verb) && !inPlace && !interp && isSecretPath(readText)) return { deny: "NHITL : affichage d'un fichier secret interdit (secrets.env, .env, DPAPI, credentials). Passer les valeurs par env sans les imprimer." };
    if (/ProtectedData\]?::Unprotect/i.test(text)) return { deny: "NHITL : déchiffrement DPAPI interdit." };

    if (verb === "ssh") {
      let i = 0;
      while (i < args.length && args[i]!.startsWith("-")) i += SSH_VALUED.has(args[i]!) ? 2 : 1;
      const rest = args.slice(i + 1).join(" ");
      const v = shellVerdict(rest, "/", true);
      if (v) return v;
      continue;
    }

    if (verb === "git") {
      const [sub, sa, dir] = gitSub(args);
      if (sub === "push" && forcePush(sa)) return { deny: "NHITL : git push --force / +refspec / --mirror interdit. Faire un push normal (fusionner, pas réécrire)." };
      if (sub === "filter-branch" || sub === "filter-repo" || (sub === "reflog" && sa[0] === "expire") || (sub === "update-ref" && sa.includes("-d")) || (sub === "rebase" && sa.includes("--root")))
        return { deny: "NHITL : réécriture d'historique git interdite." };
      if (sub === "push" && !remote) {
        const at = dir ? normPath(dir, cwd) ?? cwd : cwd;
        const files = sh(["git", "-C", at, "log", "--name-only", "--format=", "HEAD", "--not", "--remotes"], at).out;
        const bad = files.split("\n").find((f) => f && isRestricted(f));
        if (bad) return { deny: `NHITL : publication de contenu Epic/Unreal ou MSVC SDK/CRT interdite (${bad.slice(0, 120)}).` };
      }
      continue;
    }

    if (PUBLISHERS.has(verb) && (verb === "scp" || verb === "rsync" || PUBLISH_RX.test(text)) && isRestricted(text))
      return { deny: "NHITL : publication de contenu Epic/Unreal ou MSVC SDK/CRT interdite." };

    let targets: string[] = [];
    if (remote) continue; // remote fleet paths are not governed by the local roots rule
    if (DELETERS.has(verb)) targets = deleteTargets(verb, args);
    else if (verb === "find" && args.includes("-delete")) targets = [args.find((a) => !a.startsWith("-")) ?? "."];
    for (const t of targets) {
      const p = normPath(t, cwd);
      if (p === null) continue; // unresolved variable: cannot judge, allowed and logged by caller
      if (underRoots(p)) continue;
      if (gitCopyExists(p)) continue;
      return { deny: `NHITL : suppression hors C:\\src, C:\\msys et temp sans copie suivie par git (${p}).` };
    }
  }
  return null;
}
