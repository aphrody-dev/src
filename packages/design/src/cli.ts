// @aphrody/design CLI : bun run src/cli.ts themes [--check] | lint [path] [--format json|text] | screenshots [name...]
//   themes       writes tokens/themes.json and tokens/themes.css from src/themes.ts (--check: fail on drift)
//   lint         validates DESIGN.md frontmatter, 8 canonical sections, token refs, WCAG contrast, zero emoji
//   screenshots  headless Chrome over DevTools (CHROME env, else usual paths) -> assets/brand/captures/themes/<name>-<mode>.png
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildThemes,
  hyprlandConf,
  previewHtml,
  THEMES,
  themesCss,
} from "./themes.ts";

const pkg = join(import.meta.dir, "..");
const root = join(pkg, "..", "..");
const [cmd, ...args] = process.argv.slice(2);

async function themes(check: boolean) {
  const files: [string, string][] = [
    [
      join(pkg, "tokens/themes.json"),
      JSON.stringify(buildThemes(), null, 2) + "\n",
    ],
    [join(pkg, "tokens/themes.css"), themesCss()],
    [join(pkg, "tokens/hyprland.conf"), hyprlandConf()],
  ];
  let drift = 0;
  for (const [f, body] of files) {
    if (check) {
      if (
        !(await Bun.file(f).exists()) ||
        (await Bun.file(f).text()) !== body
      ) {
        console.error(`drift: ${f}`);
        drift++;
      }
    } else await Bun.write(f, body);
  }
  if (drift) process.exit(1);
  console.log(
    `${THEMES.length} themes, ${files.length} files${check ? " (unchanged)" : ""}`,
  );
}

function chromePath(): string {
  const c = [
    process.env.CHROME,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ];
  const f = c.find((p) => p && existsSync(p));
  if (!f) throw new Error("Chrome not found; set CHROME");
  return f;
}

async function screenshots(only: string[]) {
  const out = join(root, "assets/brand/captures/themes");
  mkdirSync(out, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), "design-themes-"));
  // Chrome may fork and exit its launcher: talk to the browser over DevTools (as assets/brand/capture.ts does).
  Bun.spawn(
    [
      chromePath(),
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${join(tmp, "p")}`,
      "--hide-scrollbars",
      "--no-first-run",
      "--disable-extensions",
      "--force-color-profile=srgb",
      "about:blank",
    ],
    { stdout: "ignore", stderr: "ignore" },
  );
  const portFile = join(tmp, "p", "DevToolsActivePort");
  for (let i = 0; i < 100 && !existsSync(portFile); i++) await Bun.sleep(100);
  const [port, path] = (await Bun.file(portFile).text()).trim().split("\n");
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let seq = 0;
  const pending = new Map<number, (m: any) => void>();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(String(e.data));
    pending.get(m.id)?.(m);
  });
  const send = (method: string, params: object = {}, sessionId?: string) =>
    new Promise<any>((res, rej) => {
      const id = ++seq;
      pending.set(id, (m) =>
        m.error
          ? rej(new Error(`${method}: ${m.error.message}`))
          : res(m.result),
      );
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  try {
    for (const t of THEMES.filter(
      (t) => !only.length || only.includes(t.name),
    )) {
      for (const mode of ["light", "dark"] as const) {
        const { targetId } = await send("Target.createTarget", {
          url: "about:blank",
        });
        const { sessionId } = await send("Target.attachToTarget", {
          targetId,
          flatten: true,
        });
        await send("Page.enable", {}, sessionId);
        await send(
          "Emulation.setDeviceMetricsOverride",
          { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false },
          sessionId,
        );
        const { frameTree } = await send("Page.getFrameTree", {}, sessionId);
        await send(
          "Page.setDocumentContent",
          { frameId: frameTree.frame.id, html: previewHtml(t, mode) },
          sessionId,
        );
        await Bun.sleep(300);
        const shot = await send(
          "Page.captureScreenshot",
          { format: "png" },
          sessionId,
        );
        await Bun.write(
          join(out, `${t.name}-${mode}.png`),
          Buffer.from(shot.data, "base64"),
        );
        await send("Target.closeTarget", { targetId });
        console.log(`${t.name}-${mode}.png`);
      }
    }
  } finally {
    await send("Browser.close").catch(() => {});
    ws.close();
    await Bun.sleep(1000);
    rmSync(tmp, { recursive: true, force: true });
  }
}

const CANONICAL_SECTIONS = [
  { name: "Overview", aliases: ["Brand & Style"] },
  { name: "Colors", aliases: [] as string[] },
  { name: "Typography", aliases: [] as string[] },
  { name: "Layout", aliases: ["Layout & Spacing"] },
  { name: "Elevation & Depth", aliases: ["Elevation"] },
  { name: "Shapes", aliases: [] as string[] },
  { name: "Components", aliases: [] as string[] },
  { name: "Do's and Don'ts", aliases: ["Dos and Donts"] },
];

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function wcagContrast(a: string, b: string): number | null {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return null;
  const lum = (rgb: [number, number, number]) =>
    rgb
      .map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      })
      .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i]!, 0);
  const l1 = lum(ra);
  const l2 = lum(rb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

async function lintCommand(cmdArgs: string[]) {
  const fmtIdx = cmdArgs.findIndex((a) => a === "--format" || a === "-f");
  const format = fmtIdx >= 0 ? (cmdArgs[fmtIdx + 1] ?? "text") : "text";
  const fileArg = cmdArgs.find(
    (a, i) => !a.startsWith("-") && i !== fmtIdx + 1,
  );
  const target = fileArg
    ? fileArg.includes(":") || fileArg.startsWith("/")
      ? fileArg
      : join(pkg, fileArg)
    : join(pkg, "DESIGN.md");
  if (!existsSync(target)) {
    console.error(`lint: file not found: ${target}`);
    process.exit(1);
  }
  const raw = await Bun.file(target).text();
  const findings: Array<{
    rule: string;
    severity: "error" | "warning";
    message: string;
  }> = [];
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const colors: Record<string, string> = {};
  const rounded = new Set<string>();
  const spacing = new Set<string>();
  const typography = new Set<string>();
  const compRefs: Array<{ comp: string; prop: string; ref: string }> = [];
  if (!fmMatch) {
    findings.push({
      rule: "missing-frontmatter",
      severity: "warning",
      message: "No YAML frontmatter found",
    });
  } else {
    try {
      const fm = Bun.YAML.parse(fmMatch[1]!) as Record<string, unknown> | null;
      if (fm && typeof fm === "object" && !Array.isArray(fm)) {
        if (fm.colors && typeof fm.colors === "object") {
          for (const [k, v] of Object.entries(fm.colors)) {
            if (v != null && String(v).trim()) colors[k] = String(v).trim();
          }
        }
        if (fm.rounded && typeof fm.rounded === "object") {
          for (const [k, v] of Object.entries(fm.rounded)) {
            if (v != null && String(v).trim()) rounded.add(k);
          }
        }
        if (fm.spacing && typeof fm.spacing === "object") {
          for (const [k, v] of Object.entries(fm.spacing)) {
            if (v != null && String(v).trim()) spacing.add(k);
          }
        }
        if (fm.typography && typeof fm.typography === "object") {
          for (const k of Object.keys(fm.typography)) typography.add(k);
        }
        if (fm.components && typeof fm.components === "object") {
          for (const [comp, props] of Object.entries(fm.components)) {
            if (props && typeof props === "object") {
              for (const [prop, val] of Object.entries(props)) {
                const refMatch = String(val ?? "")
                  .trim()
                  .match(/^\{([^}]+)\}$/);
                if (refMatch) compRefs.push({ comp, prop, ref: refMatch[1]! });
              }
            }
          }
        }
      }
    } catch {}
  }
  if (!colors.primary) {
    findings.push({
      rule: "missing-primary",
      severity: "error",
      message: "Required color token colors.primary is missing",
    });
  }
  for (const [bg, fg] of [
    ["primary", "on-primary"],
    ["surface", "on-surface"],
    ["background", "on-background"],
    ["error", "on-error"],
    ["dark-primary", "dark-on-primary"],
    ["dark-surface", "dark-on-surface"],
  ] as const) {
    if (colors[bg] && colors[fg]) {
      const ratio = wcagContrast(colors[bg]!, colors[fg]!);
      if (ratio !== null && ratio < 4.5) {
        findings.push({
          rule: "contrast-ratio",
          severity: "error",
          message: `Contrast ${bg}/${fg} is ${ratio.toFixed(2)}:1 (< 4.50:1)`,
        });
      }
    }
  }
  for (const { comp, prop, ref } of compRefs) {
    const [ns, key] = ref.split(".", 2);
    const ok =
      (ns === "colors" && Boolean(colors[key!])) ||
      (ns === "rounded" && rounded.has(key!)) ||
      (ns === "spacing" && spacing.has(key!)) ||
      (ns === "typography" && typography.has(key!));
    if (!ok) {
      findings.push({
        rule: "broken-ref",
        severity: "error",
        message: `components.${comp}.${prop} references missing token ${ref}`,
      });
    }
  }
  const headings = [...raw.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1]!.trim());
  for (const s of CANONICAL_SECTIONS) {
    if (
      !headings.some(
        (h) =>
          h.toLowerCase() === s.name.toLowerCase() ||
          s.aliases.some((a) => a.toLowerCase() === h.toLowerCase()),
      )
    ) {
      findings.push({
        rule: "missing-sections",
        severity: "warning",
        message: `Missing canonical section ## ${s.name}`,
      });
    }
  }
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(raw)) {
    findings.push({
      rule: "no-emoji",
      severity: "error",
      message: "Disallowed Unicode emoji found in DESIGN.md",
    });
  }
  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  if (format === "json") {
    console.log(
      JSON.stringify(
        {
          ok: errors === 0,
          file: target,
          colors: Object.keys(colors).length,
          sections: headings.length,
          errors,
          warnings,
          findings,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(
      `${target}: ${errors} error(s), ${warnings} warning(s) (${Object.keys(colors).length} colors, ${headings.length} sections)`,
    );
    for (const f of findings) {
      console.log(`  [${f.severity}] ${f.rule}: ${f.message}`);
    }
  }
  if (errors > 0) process.exit(1);
}

if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
  console.log(
    "usage: cli.ts themes [--check] | lint [path] [--format json|text] | screenshots [name...]",
  );
  process.exitCode = 0;
} else if (cmd === "themes") await themes(args.includes("--check"));
else if (cmd === "lint") await lintCommand(args);
else if (cmd === "screenshots") await screenshots(args);
else {
  console.error(
    "usage: cli.ts themes [--check] | lint [path] [--format json|text] | screenshots [name...]",
  );
  process.exitCode = 2;
}
