// NHITL policy: allow everything except a small hardcoded deny list that encodes the
// owner's standing constraints. Threat model: an autonomous agent making mistakes or
// rephrasing after a refusal, not a sandbox. Returns null (allow) or a French reason (deny).
// Side effects: bounded git probes (deletion outside roots, git push outgoing files) and
// realpath on deletion targets (junctions/symlinks).
import { realpathSync } from "node:fs";
import { HOME } from "./lib.ts";

export type Verdict = { deny: string } | null;

const TEMP = (process.env.TEMP ?? process.env.TMP ?? `${HOME}/AppData/Local/Temp`).replaceAll("\\", "/");

// Roots where deletion is always fine (compared lowercased, forward slashes, no trailing slash).
const ROOTS = ["c:/src", "c:/msys", "c:/msys64", TEMP, "/tmp", "/var/tmp", "c:/windows/temp", `${HOME}/appdata/local/temp`].map((r) =>
  r.toLowerCase().replace(/\/+$/, ""),
);

// ---------- secrets ----------
const SECRET_RX = new RegExp(
  [
    String.raw`/etc/aphrody(/|$|[\s'"])`,
    // .env, .env.local, .env.production.local, prod.env, secrets.env, .env*, NTFS ::$DATA / trailing dots
    String.raw`(^|[\\/\s'"=:(<,*])([\w-]+)?\.env(\.(?!example\b|sample\b|template\b|dist\b|d\b)[\w-]+)*(\*|::\$DATA|\.+)?(?=$|[\s'"):;|&>,}*?])`,
    String.raw`Microsoft[\\/]+(Protect|Credentials|Vault)\b`,
    String.raw`\.dpapi\b`,
    String.raw`ProtectedData\]?::Unprotect`,
    String.raw`\.credentials\.json\b`,
    String.raw`\.git-credentials\b`,
    String.raw`\bid_(rsa|dsa|ed25519|ecdsa)(_sk)?(?!\.pub)\b`,
  ].join("|"),
  "i",
);

// Commands that print (or copy out) file contents. echo/printf are not readers: they print their args.
const READERS = new Set(
  "cat type head tail less more bat nl strings xxd od hexdump base64 rg grep egrep fgrep sed awk gawk jq jaq yq cut sort uniq tac rev column fold diff cmp get-content gc select-string sls format-hex certutil findstr dd cp copy copy-item cpi curl iconv".split(
    " ",
  ),
);
const SHELLS = new Set(["sh", "bash", "niubash", "osh", "zsh", "dash", "pwsh", "powershell", "cmd", "wsl"]);
const INTERPRETERS = new Set(["python", "python3", "py", "node", "bun", "deno", "perl", "ruby", ...SHELLS]);

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

// File paths in commits: only actual Epic/MSVC artifacts, not docs that merely mention them.
const RESTRICTED_FILE_RX =
  /\.(uasset|umap|upk|uproject|uplugin)$|(^|\/)(UnrealEngine|UE_?[45][\d.]*|Epic ?Games)\/|(^|\/)Engine\/(Source|Binaries|Content|Plugins)\/Runtime\/|VC\/Tools\/MSVC\/|Windows Kits\/|(^|\/)(vcruntime|msvcp|ucrtbase|concrt|vccorlib|vcomp)\w*\.(dll|lib|pdb)$|(^|\/)api-ms-win-crt-|(^|\/)(libcmt|libucrt|libvcruntime|msvcrt|ucrt|libcpmt|msvcprt)d?\.lib$|(^|\/)vc_?redist/i;

export function isRestrictedFile(f: string): boolean {
  return RESTRICTED_FILE_RX.test(f);
}

export function isRestricted(s: string): boolean {
  return RESTRICTED_RX.test(s);
}

// ---------- shell parsing ----------
// Split into simple commands on ; & | && || newlines $( ( ) and tokenize honoring quotes.
// Bash: backslash escapes only $ ` " \ inside double quotes (Windows paths survive), backtick
// starts a command substitution. PowerShell (ps=true): backtick is the escape char.
// Heredoc bodies are data; they are returned separately so shells fed by a heredoc can be checked.
export function segments(cmd: string, ps = false, literal = false): string[][] {
  const segs: string[][] = [];
  let cur: string[] = [];
  let tok = "";
  let has = false;
  let q: string | null = null;
  const heredocs: string[] = [];
  const push = () => {
    if (has) {
      const m = /^<<-?$/.test(tok) ? null : /^<<-?(.+)$/.exec(tok);
      if (m) heredocs.push(m[1]!);
      else if (cur.length && /^<<-?$/.test(cur[cur.length - 1]!)) {
        cur.pop();
        heredocs.push(tok);
        tok = "";
        has = false;
        return;
      }
      cur.push(tok);
    }
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
      else if (!ps && !literal && c === "\\" && q === '"' && /[$`"\\]/.test(cmd[i + 1] ?? "")) tok += cmd[++i];
      else if (ps && c === "`" && q === '"' && i + 1 < cmd.length) tok += cmd[++i];
      else tok += c;
      continue;
    }
    if (c === "'" || c === '"') {
      q = c;
      has = true;
    } else if (ps && c === "`" && i + 1 < cmd.length) {
      tok += cmd[++i];
      has = true;
    } else if (c === " " || c === "\t" || c === "\r") push();
    else if (c === "\n") {
      cut();
      // skip heredoc bodies (data)
      while (heredocs.length) {
        const delim = heredocs.shift()!.replace(/^['"]|['"]$/g, "");
        let j = i + 1;
        const body: string[] = [];
        for (;;) {
          const nl = cmd.indexOf("\n", j);
          const line = cmd.slice(j, nl < 0 ? cmd.length : nl);
          if (line.replace(/^\t+/, "").replace(/\r$/, "") === delim || nl < 0) {
            i = nl < 0 ? cmd.length : nl;
            break;
          }
          body.push(line);
          j = nl + 1;
        }
        segs.push(["<<heredoc>>", body.join("\n")]);
      }
    } else if (c === ";" || c === "&" || c === "|" || (!ps && c === "`") || c === "(" || c === ")") cut();
    else if (c === "$" && cmd[i + 1] === "(") {
      cut();
      i++;
    } else {
      tok += c;
      has = true;
    }
  }
  cut();
  // Unterminated quote after a trailing backslash (Windows path "C:\\x\\"): reparse with literal backslashes too.
  if (q && !ps && !literal) return [...segs, ...segments(cmd, ps, true)];
  return segs;
}

const PREFIX = new Set(["sudo", "doas", "command", "builtin", "exec", "time", "nice", "nohup", "env", "xargs", "call", "&", ".", "start", "start-process", "invoke-expression", "iex"]);

// Return [verb, args] after skipping env assignments and wrappers.
export function verbOf(seg: string[]): [string, string[]] {
  let i = 0;
  while (
    i < seg.length &&
    (PREFIX.has(seg[i]!.toLowerCase()) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(seg[i]!) || (i > 0 && PREFIX.has(seg[i - 1]!.toLowerCase()) && seg[i]!.startsWith("-")))
  )
    i++;
  const v = (seg[i] ?? "")
    .replaceAll("\\", "/")
    .split("/")
    .pop()!
    .toLowerCase()
    .replace(/\.(exe|cmd|bat|ps1)$/, "");
  return [v, seg.slice(i + 1)];
}

// ---------- paths ----------
// Resolve a path argument to an absolute, case-preserved, forward-slash path.
// Returns null when a variable cannot be resolved (caller fails closed for deletions).
export function resolvePath(p: string, cwd: string, vars: Record<string, string> = {}): string | null {
  const env = (n: string): string | undefined => {
    const u = n.toUpperCase();
    if (u === "HOME" || u === "USERPROFILE") return HOME;
    if (u === "TEMP" || u === "TMP" || u === "TMPDIR") return TEMP;
    if (u === "PWD") return cwd;
    return vars[n] ?? process.env[n] ?? process.env[u];
  };
  let unresolved = false;
  let s = p
    .replace(/^~(?=$|[\\/])/, HOME)
    .replace(/\$\{?env:([A-Za-z_][A-Za-z0-9_]*)\}?|\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)|%([A-Za-z_][A-Za-z0-9_]*)%/g, (_m, a, b, c, d) => {
      const v = env(a ?? b ?? c ?? d);
      if (v === undefined) unresolved = true;
      return v ?? "";
    })
    .replaceAll("\\", "/");
  if (unresolved || /\$[({]|\$[0-9@*#?!-]/.test(s)) return null;
  s = s.replace(/^\/([a-zA-Z])(?=\/|$)/, "$1:"); // /c/x -> c:/x (Git Bash)
  s = s.replace(/^([a-zA-Z]:)(?!\/)/, "$1/"); // D:file -> D:/file (drive-relative, conservative)
  s = s.replace(/^\/\/\?\//, "").replace(/(::\$DATA|[. ]+)$/i, (m) => (m === "." || m === ".." ? m : "")); // Win32 normalisation
  const cw = cwd.replaceAll("\\", "/").replace(/^\/([a-zA-Z])(?=\/|$)/, "$1:");
  if (!/^([a-zA-Z]:)?\//.test(s)) s = `${cw}/${s}`;
  const drive = /^[a-zA-Z]:/.exec(s)?.[0] ?? "";
  const parts: string[] = [];
  for (const part of s.slice(drive.length).split("/")) {
    if (part === "..") parts.pop();
    else if (part !== "." && part !== "") parts.push(part);
  }
  // glob: keep the literal directory prefix (after .. resolution)
  const g = parts.findIndex((x) => /[*?[]/.test(x));
  if (g >= 0) parts.length = g;
  return `${drive}/${parts.join("/")}`.replace(/\/+$/, "") || "/";
}

export function normPath(p: string, cwd: string): string | null {
  return resolvePath(p, cwd)?.toLowerCase() ?? null;
}

export function underRoots(p: string): boolean {
  const l = p.toLowerCase();
  return ROOTS.some((r) => l === r || l.startsWith(`${r}/`));
}

function real(p: string): string {
  try {
    return realpathSync.native(p).replaceAll("\\", "/");
  } catch {
    return p;
  }
}

function sh(args: string[], cwd: string, ms = 1500): { ok: boolean; out: string } {
  try {
    const r = Bun.spawnSync(args, { cwd, stdout: "pipe", stderr: "ignore", timeout: ms, windowsHide: true });
    return { ok: r.exitCode === 0, out: r.stdout.toString() };
  } catch {
    return { ok: false, out: "" };
  }
}

// A path outside the roots is deletable only if git holds a clean tracked copy of it.
function gitCopyExists(p: string): boolean {
  const dir = p.replace(/\/[^/]*$/, "") || "/";
  const top = sh(["git", "-C", dir, "rev-parse", "--show-toplevel"], process.cwd());
  if (!top.ok) return false;
  const root = top.out.trim();
  const rel = p.length > root.length && p.toLowerCase().startsWith(`${root.toLowerCase()}/`) ? p.slice(root.length + 1) : null;
  if (rel === null) return false;
  if (!sh(["git", "-C", root, "ls-files", "--error-unmatch", "--", `:(icase)${rel}`], root).ok) return false;
  const st = sh(["git", "-C", root, "status", "--porcelain", "--ignored", "--", `:(icase)${rel}`], root);
  return st.ok && st.out.trim() === "";
}

const DELETERS = new Set(["rm", "rmdir", "del", "erase", "rd", "remove-item", "ri", "unlink", "shred"]);
const PS_VALUED = new Set(["-filter", "-include", "-exclude", "-credential", "-stream"]);

function deleteTargets(verb: string, args: string[]): string[] {
  const t: string[] = [];
  let endOpts = false;
  const cmdStyle = verb === "del" || verb === "erase" || verb === "rd" || verb === "rmdir";
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === "--") {
      endOpts = true;
      continue;
    }
    if (/^\d?>>?/.test(a)) break;
    if (!endOpts && a.startsWith("-")) {
      const [name, val] = a.split(/:(.*)/s) as [string, string | undefined];
      const n = name.toLowerCase();
      if (n === "-path" || n === "-literalpath" || n === "-lp") {
        if (val !== undefined && val !== "") t.push(...val.split(","));
        else if (args[i + 1]) t.push(...args[++i]!.split(","));
      } else if (PS_VALUED.has(n) && (val === undefined || val === "")) i++;
      continue;
    }
    if (!endOpts && cmdStyle && /^(\/[a-zA-Z]{1,2}(:[-\w]*)?)+$/.test(a)) continue;
    t.push(...(verb === "remove-item" || verb === "ri" ? a.split(",") : [a]));
  }
  return t.filter(Boolean);
}

// ---------- git ----------
function gitSub(args: string[]): [string, string[], string | null] {
  let i = 0;
  let dir: string | null = null;
  while (i < args.length && args[i]!.startsWith("-")) {
    const a = args[i]!;
    if (a === "-C") dir = args[++i] ?? null;
    else if (a.startsWith("-C")) dir = a.slice(2);
    else if (a === "-c" || a === "--git-dir" || a === "--work-tree" || a === "--namespace" || a === "--exec-path" || a === "--super-prefix") i++;
    else if (a.startsWith("--work-tree=")) dir = a.slice(12);
    i++;
  }
  return [(args[i] ?? "").toLowerCase(), args.slice(i + 1), dir];
}

const PROTECTED_BRANCH = /^(refs\/heads\/)?(main|master|trunk)$/;
function forcePush(a: string[]): boolean {
  return a.some(
    (x) =>
      /^--(fo|mi|force|mirror)/.test(x) ||
      /^-[a-zA-Z]*f[a-zA-Z]*$/.test(x) ||
      /^\+[^\s]/.test(x) ||
      /:\+/.test(x) ||
      (/^:/.test(x) && PROTECTED_BRANCH.test(x.slice(1))) ||
      (x === "--delete" || x === "-d" ? a.some((y) => PROTECTED_BRANCH.test(y)) : false),
  );
}

// Files in commits that `git push <args>` would send and the remote does not have yet.
function pushFiles(sa: string[], at: string): { ok: boolean; files: string } {
  const pos = sa.filter((x) => !x.startsWith("-"));
  const remotes = sh(["git", "-C", at, "remote"], at).out.split("\n").filter(Boolean);
  // no remote argument: the upstream's remote (git's default), else any remote
  const remote = pos[0] ?? sh(["git", "-C", at, "rev-parse", "--abbrev-ref", "@{push}"], at).out.trim().split("/")[0] ?? "";
  const named = remotes.includes(remote) ? remote : pos[0] === undefined ? "*" : "";
  const refs = sa.includes("--all") || sa.includes("--branches") ? ["--branches"] : pos.slice(1).map((r) => r.replace(/^\+/, "").split(":")[0]!).filter(Boolean);
  const exclude = named === "*" ? ["--remotes"] : named ? [`--remotes=${named}/*`] : []; // URL remote: everything reachable counts
  const r = sh(["git", "-C", at, "log", "--name-only", "--format=", ...(refs.length ? refs : ["HEAD"]), ...(exclude.length ? ["--not", ...exclude] : [])], at, 8000);
  return { ok: r.ok, files: r.out };
}

// ---------- publishing ----------
function publishes(verb: string, args: string[], text: string): boolean {
  const a0 = (args[0] ?? "").toLowerCase();
  const a1 = (args[1] ?? "").toLowerCase();
  switch (verb) {
    case "scp":
    case "rsync":
      return true;
    case "gh":
      return (a0 === "release" && (a1 === "create" || a1 === "upload")) || (a0 === "gist" && a1 === "create");
    case "npm":
    case "pnpm":
    case "yarn":
    case "bun":
    case "cargo":
    case "twine":
      return a0 === "publish" || a0 === "upload";
    case "docker":
    case "podman":
    case "oras":
      return a0 === "push";
    case "rclone":
      return /^(copy|copyto|sync|move|moveto|bisync)$/.test(a0);
    case "aws":
    case "gsutil":
    case "gcloud":
      return /\b(cp|sync|mv|rsync)\b/.test(text);
    case "wrangler":
    case "cf":
      return /\b(put|deploy|upload)\b/.test(text);
    case "dotnet":
    case "nuget":
      return /\bpush\b/.test(text);
    case "curl":
      return args.some((x) => /^(-T|--upload-file|-F|--form|--data-binary)$/.test(x) || /^-d@|^--data(-binary)?=@/.test(x));
    default:
      return false;
  }
}

// ---------- main ----------
export function decide(tool: string, input: Record<string, any>, cwd: string): Verdict {
  if (tool === "AskUserQuestion") return { deny: "NHITL : aucune question à l'utilisateur. Trancher seul avec l'hypothèse la plus raisonnable et continuer." };

  if (tool === "Read" || tool === "NotebookRead") {
    if (isSecretPath(` ${String(input.file_path ?? input.notebook_path ?? "")}`))
      return { deny: "NHITL : lecture d'un fichier secret interdite (utiliser les clés via env, jamais afficher les valeurs)." };
    return null;
  }
  if (tool === "Grep") {
    if (isSecretPath(` ${input.path ?? ""} ${input.glob ?? ""}`)) return { deny: "NHITL : recherche dans un fichier secret interdite." };
    return null;
  }
  if (tool === "Bash" || tool === "Monitor") return shellVerdict(String(input.command ?? ""), cwd, false, false, 0);
  if (tool === "PowerShell") return shellVerdict(String(input.command ?? ""), cwd, false, true, 0);
  return null;
}

// ssh remote commands: options that take a value, so the host is the first other arg.
const SSH_VALUED = new Set(["-p", "-i", "-o", "-l", "-J", "-F", "-b", "-c", "-D", "-E", "-L", "-R", "-W", "-S", "-m", "-O", "-Q", "-w", "-e", "-B", "-I"]);

// Inline code passed to a shell/interpreter: bash -c / -xc, pwsh -Command/-c/-EncodedCommand, cmd /c /k.
function inlineCode(verb: string, args: string[]): { code: string; ps: boolean } | null {
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    const l = a.toLowerCase();
    if (verb === "cmd" && (l === "/c" || l === "/k" || l === "/r")) return { code: args.slice(i + 1).join(" "), ps: false };
    if ((verb === "pwsh" || verb === "powershell") && /^-(e|ec|en|enc|enco|encodedcommand)$/.test(l)) {
      try {
        return { code: Buffer.from(args[i + 1] ?? "", "base64").toString("utf16le"), ps: true };
      } catch {
        return { code: "", ps: true };
      }
    }
    if ((verb === "pwsh" || verb === "powershell") && /^-(c|co|com|comm|comma|comman|command)$/.test(l)) return { code: args.slice(i + 1).join(" "), ps: true };
    if (SHELLS.has(verb) && /^-[a-z]*c[a-z]*$/.test(a) && verb !== "pwsh" && verb !== "powershell" && verb !== "cmd") return { code: args[i + 1] ?? "", ps: false };
    if (/^(-e|-p|-pe|-ne|--eval|--print)$/.test(a) || /^--(eval|print)=/.test(a)) return { code: a.includes("=") ? a.slice(a.indexOf("=") + 1) : (args[i + 1] ?? ""), ps: false };
  }
  return null;
}

const DENY_SECRET = "NHITL : affichage d'un fichier secret interdit (secrets.env, .env, DPAPI, credentials). Passer les valeurs par env sans les imprimer.";
const DENY_PUBLISH = "NHITL : publication de contenu Epic/Unreal ou MSVC SDK/CRT interdite.";

function shellVerdict(cmd: string, cwd: string, remote: boolean, ps: boolean, depth: number): Verdict {
  if (!cmd || depth > 4) return null;
  const vars: Record<string, string> = {};
  const segs = segments(cmd, ps);
  for (let si = 0; si < segs.length; si++) {
    const seg = segs[si]!;
    if (seg[0] === "<<heredoc>>") {
      // a heredoc fed to a shell is code; otherwise it is data
      const [pv] = verbOf(segs[si - 1] ?? []);
      if (SHELLS.has(pv)) {
        const v = shellVerdict(seg[1] ?? "", cwd, remote, pv === "pwsh" || pv === "powershell", depth + 1);
        if (v) return v;
      }
      continue;
    }
    // track simple assignments: X=literal, X=$(mktemp ...)
    const asg = seg.length === 1 ? /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(seg[0]!) : null;
    if (asg) {
      if (asg[2]) vars[asg[1]!] = asg[2];
      else if (verbOf(segs[si + 1] ?? [])[0] === "mktemp") vars[asg[1]!] = TEMP + "/mktemp";
      continue;
    }
    const [verb, args] = verbOf(seg);
    const text = seg.join(" ");
    // Redirection targets are writes, not reads: `echo x > .env` is allowed; `< .env` is a read.
    const readText = seg.filter((t, i) => !/^\d?>>?/.test(t) && !/^\d?>>?$/.test(seg[i - 1] ?? "")).join(" ");
    const inPlace = verb === "sed" && args.some((a) => /^-i/.test(a));

    if (/ProtectedData\]?::Unprotect/i.test(text)) return { deny: "NHITL : déchiffrement DPAPI interdit." };
    const rk = seg.findIndex((t) => /^\d?<(?!<)/.test(t));
    if (rk >= 0) {
      const src = /^\d?<$/.test(seg[rk]!) ? (seg[rk + 1] ?? "") : seg[rk]!.replace(/^\d?</, "");
      if (isSecretPath(` ${src}`)) return { deny: DENY_SECRET };
    }

    const inline = INTERPRETERS.has(verb) ? inlineCode(verb, args) : null;
    if (inline) {
      if (isSecretPath(` ${inline.code}`)) return { deny: DENY_SECRET };
      if (SHELLS.has(verb)) {
        const v = shellVerdict(inline.code, cwd, remote, inline.ps, depth + 1);
        if (v) return v;
      }
      continue;
    }
    if (READERS.has(verb) && !inPlace && isSecretPath(` ${readText}`)) return { deny: DENY_SECRET };

    if (verb === "ssh") {
      let i = 0;
      while (i < args.length && args[i]!.startsWith("-")) i += SSH_VALUED.has(args[i]!) ? 2 : 1;
      const v = shellVerdict(args.slice(i + 1).join(" "), "/", true, false, depth + 1);
      if (v) return v;
      continue;
    }

    if (verb === "git") {
      const [sub, sa, dir] = gitSub(args);
      if (sub === "push" && forcePush(sa)) return { deny: "NHITL : git push --force / +refspec / --mirror / suppression de main interdit. Faire un push normal (fusionner, pas réécrire)." };
      if (
        sub === "filter-branch" ||
        sub === "filter-repo" ||
        (sub === "reflog" && sa[0] === "expire") ||
        (sub === "update-ref" && (sa.includes("-d") || sa.some((x) => /^refs\/heads\//.test(x)))) ||
        (sub === "rebase" && sa.includes("--root"))
      )
        return { deny: "NHITL : réécriture d'historique git interdite." };
      if ((sub === "show" || sub === "diff" || sub === "cat-file" || sub === "grep" || sub === "log") && isSecretPath(` ${sa.join(" ")}`)) return { deny: DENY_SECRET };
      if (remote) continue;
      const at = dir ? (resolvePath(dir, cwd) ?? cwd) : cwd;
      if (sub === "push") {
        const r = pushFiles(sa, at);
        if (!r.ok) return { deny: "NHITL : contrôle du contenu poussé impossible (git log en échec ou trop lent) ; réessayer depuis le dépôt." };
        const bad = r.files.split("\n").find((f) => f && isRestrictedFile(f));
        if (bad) return { deny: `${DENY_PUBLISH} (${bad.slice(0, 120)})` };
      }
      if (sub === "clean" && sa.some((x) => /^-[a-zA-Z]*f/.test(x) || x === "--force") && !underRoots(real(at)))
        return { deny: `NHITL : git clean hors C:\\src, C:\\msys et temp interdit (${at}).` };
      continue;
    }

    if (publishes(verb, args, text) && isRestricted(text)) return { deny: DENY_PUBLISH };

    if (remote) continue; // remote fleet paths are not governed by the local roots rule
    let targets: string[] = [];
    if (DELETERS.has(verb)) {
      targets = deleteTargets(verb, args);
      if (!targets.length && si > 0) return { deny: "NHITL : suppression alimentée par un pipeline, cibles non vérifiables ; lister les chemins explicitement." };
    } else if (verb === "find" && args.some((a) => a === "-delete" || a === "-exec" || a === "-execdir" || a === "-ok")) {
      const ex = args.findIndex((a) => a === "-exec" || a === "-execdir" || a === "-ok");
      if (args.includes("-delete") || (ex >= 0 && DELETERS.has(verbOf(args.slice(ex + 1))[0]))) {
        const firstExpr = args.findIndex((a) => /^[-(!]/.test(a));
        targets = args.slice(0, firstExpr < 0 ? args.length : firstExpr);
        if (!targets.length) targets = ["."];
      }
    } else if (verb === "robocopy" && args.some((a) => /^\/(mir|purge)$/i.test(a)) && args[1]) targets = [args[1]];
    for (const t of targets) {
      const p0 = resolvePath(t, cwd, vars);
      if (p0 === null) return { deny: `NHITL : suppression avec variable non résolue (${t.slice(0, 80)}) ; écrire le chemin littéral.` };
      const p = real(p0);
      if (underRoots(p) && underRoots(p0)) continue;
      if (gitCopyExists(p)) continue;
      return { deny: `NHITL : suppression hors C:\\src, C:\\msys et temp sans copie suivie par git (${p}).` };
    }
  }
  return null;
}
