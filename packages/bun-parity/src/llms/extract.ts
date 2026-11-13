// Turns the examples of Bun's documentation (https://bun.com/llms-full.txt) into runnable checks.
//
// A documented example states its result in a `// => value` comment, after the expression or on the
// next line under a `console.log(...)`. Each JS/TS block with such comments becomes one case: the
// block, with every `// =>` line rewritten into a call to `__expect(...)`, run as a module by the
// Bun under test (test/llms-docs.test.ts). The expected text is compared as a JS literal when it
// is one, as a constructor name when it names one (`Uint8Array`, `ArrayBuffer(64)`), else as text.
//
// Blocks that need the network, a server, npm packages, files next to them or user input are left
// out, with the reason, so that the report says what the suite does not cover.

export type Expectation = {
  line: number; // 1-based line in the block
  source: string; // the documented line
  expected: string; // text after `// =>`
  mode: "literal" | "type" | "text" | "unverifiable";
  printed?: boolean; // the result is what console.log prints
};

export type Case = {
  id: string;
  page: string;
  url: string;
  lang: string;
  code: string; // runnable module
  expectations: Expectation[];
};

export type Skipped = { id: string; url: string; reason: string };

export type Extracted = {
  source: string;
  sha256: string;
  fetched: string;
  cases: Case[];
  skipped: Skipped[];
};

const JS_LANGS = new Set([
  "ts",
  "js",
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "mjs",
  "mts",
]);

// What a block may not use: it would reach outside the process or wait on someone.
const SKIP_RULES: [RegExp, string][] = [
  [/\bfetch\(\s*["'`]https?:/, "network"],
  [
    /https?:\/\/(?!localhost|127\.0\.0\.1|example\.com\/?["'`])[\w.-]+\.\w+/,
    "network URL",
  ],
  [
    /\bBun\.serve\b|\.listen\(|new WebSocket\(|Bun\.connect\b|Bun\.listen\b|Bun\.udpSocket\b/,
    "server or socket",
  ],
  [
    /\bprompt\(|process\.stdin|console\s*\[?\s*Symbol\.asyncIterator|for await \(const line of console\)/,
    "user input",
  ],
  [
    /\bBun\.(sql|SQL|redis|s3|S3Client|RedisClient)\b|\bsql`|\bredis\.|new SQL\(|\bs3\b/,
    "database or cloud service",
  ],
  [/\bBun\.(spawn|spawnSync)\b|\$`/, "subprocess"],
  [
    /\bBun\.build\b|\bBun\.Transpiler\b.*\bscan\b.*\bfile\b/,
    "bundler on files",
  ],
  [/new Worker\(|\bWorker\b\(/, "worker file"],
  [/Bun\.(file|write)\(\s*["'`](?!\/tmp\/)/, "file next to the example"],
  [/\bBun\.WebView\b|\bBun\.Terminal\b|\bBun\.secrets\b/, "desktop service"],
  [/setInterval\(/, "timer that never ends"],
  [/["'`]\/path\/to\//, "file next to the example"],
];

function importSkip(code: string): string | undefined {
  for (const m of code.matchAll(
    /\b(?:import\s[^"'`;]*?from\s*|import\s*\(\s*|require\(\s*|import\s+)["'`]([^"'`]+)["'`]/g,
  )) {
    const spec = m[1]!;
    if (spec.startsWith("bun:") || spec.startsWith("node:") || spec === "bun")
      continue;
    if (
      /^(fs|path|os|util|crypto|events|stream|buffer|url|assert|zlib|querystring|string_decoder|timers|tty|readline|child_process|worker_threads|perf_hooks|v8|vm|net|http|https|dns)(\/|$)/.test(
        spec,
      )
    )
      continue;
    return spec.startsWith(".") || spec.startsWith("/")
      ? "imports a file next to the example"
      : `imports npm package ${spec}`;
  }
  return undefined;
}

/** Splits llms-full.txt into pages: `# Title` then `Source: <url>`. */
export function pages(
  text: string,
): { title: string; url: string; body: string }[] {
  const out: { title: string; url: string; body: string }[] = [];
  const re = /^# (.+)\r?\nSource: (\S+)\r?\n/gm;
  const heads = [...text.matchAll(re)];
  heads.forEach((h, i) => {
    const start = h.index! + h[0].length;
    const end = i + 1 < heads.length ? heads[i + 1]!.index! : text.length;
    out.push({
      title: h[1]!.trim(),
      url: h[2]!.trim(),
      body: text.slice(start, end),
    });
  });
  return out;
}

/** Fenced blocks of a page with their language (first word of the info string). */
export function blocks(body: string): { lang: string; code: string }[] {
  const out: { lang: string; code: string }[] = [];
  const re = /^```([^\n]*)\n([\s\S]*?)^```/gm;
  for (const m of body.matchAll(re))
    out.push({
      lang: (m[1]!.trim().split(/\s+/)[0] ?? "").toLowerCase(),
      code: m[2]!,
    });
  return out;
}

// A result that only describes itself: a path, an ellipsis, a word of prose.
const UNVERIFIABLE =
  /\.\.\.|…|\/path\/to|path\/to\/|\bnext\b|\bcopies\b|\bascii\b|\bfor\b|\bwhen\b|\bmidnight\b|^\s*$|^\{\s*$|^\[\s*$/;
// Results that depend on the machine, the clock or chance.
const NONDETERMINISTIC =
  /\bBun\.(revision|version|nanoseconds|main|argv)\b|\brandomUUID\b|\brandomUUIDv7\b|\bMath\.random\b|\bnew Date\(\)|\bDate\.now\b|\bperformance\.now\b|\bprocess\.(pid|ppid|uptime|hrtime|cwd|argv|execPath)\b|\bimport\.meta\.(url|path|dir|dirname|filename)\b|\bos\.\w+\(|\bBun\.which\(\s*["'`](?!notfound)|\b(process|Bun|import\.meta)\.env\b/;

// Results that depend on the files around the example.
const CONTEXT =
  /\.scan(Sync)?\(|readdir|\bBun\.Glob\b[^\n]*\.scan|new Date\(|\bexpires\b|\bmaxAge\b/i;

/** `context` is the code of the block up to the line, which may make the result depend on the run. */
export function classify(
  expr: string,
  expected: string,
  context = "",
): Expectation["mode"] {
  const e = expected.trim().replace(/;$/, "");
  if (
    NONDETERMINISTIC.test(expr) ||
    NONDETERMINISTIC.test(context) ||
    CONTEXT.test(context + "\n" + expr) ||
    UNVERIFIABLE.test(e)
  ) {
    return "unverifiable";
  }
  if (
    /^[A-Z][A-Za-z0-9]*(\(\d+\))?$/.test(e) &&
    !/^(true|false|null|undefined|NaN|Infinity)$/.test(e)
  )
    return "type";
  if (/^(string|number|boolean|bigint|object|undefined)$/.test(e))
    return "type";
  if (isLiteral(e)) return "literal";
  return /^[A-Za-z][\w.;=/+\-\s:,()<>"'!@#$%^&*[\]{}|\\]*$/.test(e)
    ? "text"
    : "unverifiable";
}

const LITERAL_WORDS = new Set([
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity",
]);

/**
 * Whether `text` is a JS literal made of strings, numbers, bigints, the constant words, arrays and
 * objects of them: no call, no property access, no other name. Only such text is evaluated.
 */
export function isLiteral(text: string): boolean {
  const rest = text.replace(
    /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\$]|\\.)*`/g,
    "0",
  );
  if (!/^[\s\w.+\-,:[\]{}]*$/.test(rest) || /\.\s*[A-Za-z_$]/.test(rest))
    return false;
  for (const m of rest.matchAll(/[A-Za-z_$][\w$]*/g)) {
    const word = m[0];
    const after = rest.slice(m.index! + word.length).trimStart();
    const isKey = after.startsWith(":");
    const isNumberPart =
      /^\d/.test(rest[m.index! - 1] ?? "") || /^\d+n$/.test(word);
    if (
      !LITERAL_WORDS.has(word) &&
      !isKey &&
      !isNumberPart &&
      !/^e\d*$/.test(word)
    )
      return false;
  }
  try {
    new Function(`"use strict"; return (${text});`);
    return true;
  } catch {
    return false;
  }
}

const STATEMENT =
  /^(const|let|var)\s+(\{[^}]*\}|\[[^\]]*\]|[\w$]+)\s*(?::[^=]+)?=\s*([\s\S]+)$/;

/**
 * Rewrites the `// =>` lines of a block into `__expect` calls. Returns undefined when the block has
 * none that can be checked.
 */
export function transform(
  code: string,
): { code: string; expectations: Expectation[] } | undefined {
  const lines = code.replace(/\r\n/g, "\n").split("\n");
  const expectations: Expectation[] = [];
  const out: string[] = [];
  let lastLog: { index: number; expr: string } | undefined;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    const m = raw.match(/^(\s*)(.*?)\s*\/\/ => ?(.*)$/);
    if (!m) {
      out.push(raw);
      const log = raw.match(/^\s*console\.log\((.+)\);?\s*$/);
      lastLog = log
        ? { index: out.length - 1, expr: log[1]! }
        : raw.trim() === ""
          ? lastLog
          : undefined;
      continue;
    }
    const [, indent, before, expectedRaw] = m as unknown as [
      string,
      string,
      string,
      string,
    ];
    const expected = expectedRaw.trim();
    let target: string | undefined; // expression whose value the comment states
    let prefix = ""; // what stays before the check
    let printed = false;
    let replaces: number | undefined; // index in `out` of the console.log line the check takes over
    const code = before.trim().replace(/;$/, "");

    if (code === "") {
      // `// => value` alone on its line: the result of the `console.log(...)` above it.
      if (lastLog) {
        target = lastLog.expr;
        printed = true;
        replaces = lastLog.index;
      }
    } else {
      const log = code.match(/^console\.log\(([\s\S]+)\)$/);
      const decl = code.match(STATEMENT);
      if (log) {
        target = log[1]!;
        printed = true;
      } else if (decl && /^[\w$]+$/.test(decl[2]!)) {
        prefix = `${code};`;
        target = decl[2]!;
      } else if (
        /^(return|if|for|while|import|export|throw|\}|\{|await using|using)\b/.test(
          code,
        )
      ) {
        prefix = code;
      } else target = code;
    }

    const exp: Expectation = {
      line: i + 1,
      source: raw.trim(),
      expected,
      mode:
        target === undefined
          ? "unverifiable"
          : classify(target, expected, lines.slice(0, i).join("\n")),
      ...(printed ? { printed } : {}),
    };
    expectations.push(exp);

    if (target === undefined || exp.mode === "unverifiable") {
      out.push(code === "" ? "" : `${indent}${prefix || code};`);
      lastLog = undefined;
      continue;
    }
    const isAsync = /\bawait\b/.test(target);
    const call = `${isAsync ? "await " : ""}__expect(${expectations.length - 1}, ${isAsync ? "async " : ""}() => (${target}))`;
    if (replaces !== undefined) {
      // Evaluated once: some results can be read only once (a digest, a stream).
      out[replaces] = out[replaces]!.replace(
        /console\.log\(.+\);?\s*$/,
        `${call};`,
      );
      out.push("");
    } else out.push(`${indent}${prefix}${prefix ? " " : ""}${call};`);
    lastLog = undefined;
  }

  if (!expectations.some((e) => e.mode !== "unverifiable")) return undefined;
  return { code: out.join("\n"), expectations };
}

// Globals the documentation uses without importing them, as the examples assume `import { X } from "bun"`.
const IMPLICIT: Record<string, string> = {
  Glob: "Bun.Glob",
  CryptoHasher: "Bun.CryptoHasher",
  Transpiler: "Bun.Transpiler",
  $: "Bun.$",
  Database: 'require("bun:sqlite").Database',
  dlopen: 'require("bun:ffi").dlopen',
  FFIType: 'require("bun:ffi").FFIType',
};

function declared(code: string): Set<string> {
  const names = new Set<string>();
  for (const m of code.matchAll(
    /\b(?:const|let|var|function|class|using)\s+([A-Za-z_$][\w$]*)/g,
  ))
    names.add(m[1]!);
  for (const m of code.matchAll(/\bimport\s*\{([^}]*)\}/g))
    for (const n of m[1]!.split(","))
      names.add(
        n
          .trim()
          .split(/\s+as\s+/)
          .pop()!,
      );
  for (const m of code.matchAll(/\bimport\s+([A-Za-z_$][\w$]*)\s+from/g))
    names.add(m[1]!);
  return names;
}

const uses = (code: string, name: string) =>
  new RegExp(`(^|[^\\w$.])${name.replace(/\$/g, "\\$")}(?![\\w$])`).test(code);

/**
 * Code the block needs to run on its own: the earlier blocks of the page that declare what it uses
 * (examples continue one another), and the Bun globals it uses without importing them.
 */
function context(code: string, earlier: string[]): string {
  const mine = declared(code);
  // API reference blocks (`interface`, method signatures) describe types; they do not run.
  const runnable = earlier.filter(
    (b) =>
      !/^\s*(interface|declare|type)\s/m.test(b) &&
      !/^\s+[\w$]+\([^)]*\)\s*:\s*[^;{]+;\s*$/m.test(b),
  );
  const needed = new Set<string>();
  for (const b of runnable)
    for (const n of declared(b))
      if (!mine.has(n) && uses(code, n)) needed.add(n);

  // The page's blocks from the first one that declares what this block uses: the ones between
  // them may change it (a write before a read). When they collide on a name, only the declaring ones.
  let parts: string[] = [];
  if (needed.size) {
    const missing = new Set(needed);
    let k = runnable.length;
    while (missing.size && k > 0) {
      k--;
      for (const n of declared(runnable[k]!)) missing.delete(n);
    }
    const run = runnable.slice(k);
    const seen = new Set(mine);
    const collides = run.some((b) =>
      [...declared(b)].some((n) => (seen.has(n) ? true : (seen.add(n), false))),
    );
    parts = collides
      ? run.filter(
          (b) =>
            [...declared(b)].some((n) => needed.has(n)) &&
            ![...declared(b)].some((n) => mine.has(n)),
        )
      : run;
  }
  const have = new Set([...mine, ...parts.flatMap((b) => [...declared(b)])]);
  const all = parts.join("\n") + "\n" + code;
  const implicit = Object.entries(IMPLICIT)
    .filter(([name]) => !have.has(name) && uses(all, name))
    .map(([name, value]) => `const ${name} = ${value};`);
  return [...implicit, ...parts].join("\n");
}

const plain = (code: string) => code.replace(/\s*\/\/ =>.*$/gm, "");

export function extract(text: string): { cases: Case[]; skipped: Skipped[] } {
  const cases: Case[] = [];
  const skipped: Skipped[] = [];
  for (const page of pages(text)) {
    let n = 0;
    const earlier: string[] = [];
    for (const block of blocks(page.body)) {
      if (!JS_LANGS.has(block.lang)) continue;
      const before = earlier.slice();
      earlier.push(plain(block.code));
      if (!block.code.includes("// =>")) continue;
      const id = `${page.url.replace(/^https?:\/\/[^/]+/, "")}#${++n}`;
      const needed = context(block.code, before);
      const whole = needed + "\n" + block.code;
      const reason =
        importSkip(whole) ?? SKIP_RULES.find(([re]) => re.test(whole))?.[1];
      if (reason) {
        skipped.push({ id, url: page.url, reason });
        continue;
      }
      const t = transform(block.code);
      if (!t) {
        skipped.push({ id, url: page.url, reason: "no checkable result" });
        continue;
      }
      // Imports stay first in the module; the context comes after them.
      const imports = needed.match(/^import\s[^\n]*$/gm) ?? [];
      const rest = needed.replace(/^import\s[^\n]*$/gm, "");
      const code = [...imports, rest, t.code].filter(Boolean).join("\n");
      cases.push({
        id,
        page: page.title,
        url: page.url,
        lang: block.lang,
        code,
        expectations: t.expectations,
      });
    }
  }
  return { cases, skipped };
}

export const LLMS_FULL_URL = "https://bun.com/llms-full.txt";

/** Fetches llms-full.txt and writes the cases next to the test (`bpt llms extract`). */
export async function refresh(
  outPath: string,
  url = LLMS_FULL_URL,
): Promise<Extracted> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  const sha256 = new Bun.CryptoHasher("sha256").update(text).digest("hex");
  const { cases, skipped } = extract(text);
  const data: Extracted = {
    source: url,
    sha256,
    fetched: new Date().toISOString(),
    cases,
    skipped,
  };
  await Bun.write(outPath, JSON.stringify(data, null, 1) + "\n");
  return data;
}
