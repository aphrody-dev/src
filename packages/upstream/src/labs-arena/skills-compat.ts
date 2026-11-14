import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  metadata?: Record<string, string | boolean | number>;
}

export interface ParsedSkill {
  name: string;
  description: string;
  license?: string;
  metadata: Record<string, string | boolean | number>;
  internal: boolean;
  filePath: string;
  sourceGroup: string;
  frontmatterBytes: number;
  bodyBytes: number;
  discoveryTokens: number;
  fullActivationTokens: number;
  progressiveSavingsPct: number;
}

export interface SkillValidationIssue {
  filePath: string;
  reason: string;
}

export interface SkillsDiscoveryReport {
  totalDiscovered: number;
  validCount: number;
  invalidCount: number;
  skills: ParsedSkill[];
  issues: SkillValidationIssue[];
  totalDiscoveryTokens: number;
  totalActivationTokens: number;
  averageProgressiveSavingsPct: number;
}

export interface SkillsParserBenchmarkResult {
  skillFilesCount: number;
  totalCorpusBytes: number;
  iterations: number;
  sovereignSinglePassMs: number;
  sovereignOpsPerSec: number;
  baselineRegexYamlMs: number;
  baselineOpsPerSec: number;
  speedupFactor: number;
  sovereignDiscoveryWalkMs: number;
  baselineMultiPassWalkMs: number;
  walkSpeedupFactor: number;
}

function unquoteYamlScalar(raw: string): string | boolean | number {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed;
}

/**
 * Sovereign zero-dependency single-pass indexOf frontmatter scanner.
 * Avoids whole-document regex backtracking (`[\s\S]*?`) and external `yaml` AST allocation,
 * scanning only up to the closing `---` fence.
 */
export function parseSkillFrontmatterSinglePass(raw: string): {
  data: Record<string, unknown>;
  bodyOffset: number;
  frontmatterBytes: number;
} {
  let pos = 0;
  if (raw.charCodeAt(0) === 0xfeff) pos = 1;

  if (
    raw.charCodeAt(pos) !== 45 ||
    raw.charCodeAt(pos + 1) !== 45 ||
    raw.charCodeAt(pos + 2) !== 45
  ) {
    return { data: {}, bodyOffset: pos, frontmatterBytes: 0 };
  }

  let fmStart = pos + 3;
  if (raw.charCodeAt(fmStart) === 13) fmStart++;
  if (raw.charCodeAt(fmStart) !== 10) {
    return { data: {}, bodyOffset: pos, frontmatterBytes: 0 };
  }
  fmStart++;

  let closeIdx = raw.indexOf("\n---", fmStart);
  if (closeIdx === -1) {
    return { data: {}, bodyOffset: pos, frontmatterBytes: 0 };
  }

  // Verify the closing `---` is followed by \r, \n, or EOF
  let afterFence = closeIdx + 4;
  while (
    closeIdx !== -1 &&
    afterFence < raw.length &&
    raw.charCodeAt(afterFence) !== 13 &&
    raw.charCodeAt(afterFence) !== 10
  ) {
    closeIdx = raw.indexOf("\n---", afterFence);
    afterFence = closeIdx + 4;
  }
  if (closeIdx === -1) {
    return { data: {}, bodyOffset: pos, frontmatterBytes: 0 };
  }

  let bodyOffset = afterFence;
  if (raw.charCodeAt(bodyOffset) === 13) bodyOffset++;
  if (raw.charCodeAt(bodyOffset) === 10) bodyOffset++;

  const fmEnd = raw.charCodeAt(closeIdx - 1) === 13 ? closeIdx - 1 : closeIdx;
  const data: Record<string, unknown> = {};
  let currentMapKey: string | null = null;
  let currentBlockKey: string | null = null;
  let blockStyle: "|" | ">" | null = null;
  let blockLines: string[] = [];

  const flushBlock = () => {
    if (currentBlockKey && blockLines.length > 0) {
      data[currentBlockKey] =
        blockStyle === ">"
          ? blockLines.join(" ").trim()
          : blockLines.join("\n").trim();
    }
    currentBlockKey = null;
    blockStyle = null;
    blockLines = [];
  };

  let lineStart = fmStart;
  while (lineStart <= fmEnd) {
    let lineEnd = raw.indexOf("\n", lineStart);
    if (lineEnd === -1 || lineEnd > fmEnd) lineEnd = fmEnd;
    const actualEnd =
      lineEnd > lineStart && raw.charCodeAt(lineEnd - 1) === 13
        ? lineEnd - 1
        : lineEnd;
    const line = raw.slice(lineStart, actualEnd);
    lineStart = lineEnd + 1;

    if (!line.trim() || line.trimStart().startsWith("#")) {
      if (currentBlockKey) blockLines.push("");
      continue;
    }

    const indent = line.length - line.trimStart().length;

    if (currentBlockKey) {
      if (indent > 0) {
        blockLines.push(line.trim());
        continue;
      }
      flushBlock();
    }

    if (indent > 0 && currentMapKey) {
      const colon = line.indexOf(":");
      if (colon !== -1) {
        const subKey = line.slice(0, colon).trim();
        const subVal = unquoteYamlScalar(line.slice(colon + 1));
        const target = data[currentMapKey] as Record<string, unknown>;
        target[subKey] = subVal;
      }
      continue;
    }

    currentMapKey = null;
    const colon = line.indexOf(":");
    if (colon === -1) continue;

    const key = line.slice(0, colon).trim();
    const rest = line.slice(colon + 1).trim();

    if (rest === "" && (key === "metadata" || key === "tags")) {
      currentMapKey = key;
      data[key] = {};
    } else if (
      rest === "" ||
      rest === "|" ||
      rest === ">" ||
      rest === "|-" ||
      rest === ">-"
    ) {
      currentBlockKey = key;
      blockStyle = rest === "" || rest.startsWith(">") ? ">" : "|";
      blockLines = [];
      data[key] = "";
    } else {
      data[key] = unquoteYamlScalar(rest);
    }
  }

  flushBlock();

  return {
    data,
    bodyOffset,
    frontmatterBytes: fmEnd - fmStart,
  };
}

/**
 * Baseline reference matching `vercel-labs/skills/src/frontmatter.ts`:
 * Full-document backtracking regex + multi-pass YAML object construction.
 */
export function parseSkillFrontmatterBaselineRegex(raw: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const match = raw.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };
  const fmText = match[1] ?? "";
  let data: Record<string, unknown> = {};
  try {
    const parsed = Bun.YAML.parse(fmText);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      data = parsed as Record<string, unknown>;
    }
  } catch {
    for (const line of fmText.split(/\r?\n/)) {
      const m = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (m && m[1]) data[m[1]] = m[2]?.trim() ?? "";
    }
  }
  return { data, content: match[2] ?? "" };
}

export function estimateTokens(charCount: number): number {
  return Math.max(1, Math.ceil(charCount / 4));
}

export function validateAndParseSkillContent(
  raw: string,
  filePath: string,
  sourceGroup: string,
): { skill: ParsedSkill | null; issue: SkillValidationIssue | null } {
  const { data, bodyOffset, frontmatterBytes } =
    parseSkillFrontmatterSinglePass(raw);
  const name = data.name;
  const description = data.description;

  if (typeof name !== "string" || name.trim().length === 0) {
    return {
      skill: null,
      issue: {
        filePath,
        reason: 'Missing or non-string required frontmatter field "name"',
      },
    };
  }
  if (typeof description !== "string" || description.trim().length === 0) {
    return {
      skill: null,
      issue: {
        filePath,
        reason:
          'Missing or non-string required frontmatter field "description"',
      },
    };
  }
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(name.trim())) {
    return {
      skill: null,
      issue: { filePath, reason: `Invalid skill identifier "${name}"` },
    };
  }

  const rawMeta =
    typeof data.metadata === "object" &&
    data.metadata !== null &&
    !Array.isArray(data.metadata)
      ? (data.metadata as Record<string, string | boolean | number>)
      : {};
  const internalFlag = rawMeta.internal;
  const internal =
    internalFlag === true || internalFlag === "true" || internalFlag === "1";

  const bodyLength = Math.max(0, raw.length - bodyOffset);
  const discoveryChars = name.length + description.length + 8;
  const discoveryTokens = estimateTokens(discoveryChars);
  const fullActivationTokens = estimateTokens(raw.length);
  const progressiveSavingsPct =
    fullActivationTokens > 0
      ? Number(((1 - discoveryTokens / fullActivationTokens) * 100).toFixed(2))
      : 0;

  return {
    skill: {
      name: name.trim(),
      description: description.trim(),
      license: typeof data.license === "string" ? data.license : undefined,
      metadata: rawMeta,
      internal,
      filePath,
      sourceGroup,
      frontmatterBytes,
      bodyBytes: bodyLength,
      discoveryTokens,
      fullActivationTokens,
      progressiveSavingsPct,
    },
    issue: null,
  };
}

const SKIP_WALK_DIRS = new Set([
  ".git",
  ".jj",
  "node_modules",
  "target",
  "dist",
  "build",
  ".next",
  ".turbo",
]);

function collectSkillFilesFast(
  rootDir: string,
  maxDepth: number,
  out: string[],
  depth = 0,
): void {
  if (depth > maxDepth || !existsSync(rootDir)) return;
  let entries;
  try {
    entries = readdirSync(rootDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isFile() && entry.name === "SKILL.md") {
      out.push(join(rootDir, entry.name));
    } else if (entry.isDirectory() && !SKIP_WALK_DIRS.has(entry.name)) {
      collectSkillFilesFast(
        join(rootDir, entry.name),
        maxDepth,
        out,
        depth + 1,
      );
    }
  }
}

function collectSkillFilesBaselineStat(
  rootDir: string,
  maxDepth: number,
): string[] {
  const found: string[] = [];
  const walk = (dir: string, depth: number) => {
    if (depth > maxDepth || !existsSync(dir)) return;
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      if (SKIP_WALK_DIRS.has(name)) continue;
      const full = join(dir, name);
      try {
        const st = statSync(full);
        if (st.isFile() && name === "SKILL.md") {
          found.push(full);
        } else if (st.isDirectory()) {
          walk(full, depth + 1);
        }
      } catch {
        // ignore
      }
    }
  };
  walk(rootDir, 0);
  return found;
}

export function getDefaultSkillRoots(
  thirdPartyRoot = resolve(
    import.meta.dir,
    "..",
    "..",
    "..",
    "..",
    "third_party",
  ),
): Array<{
  label: string;
  dir: string;
}> {
  const home = homedir();
  const candidates: Array<{ label: string; dir: string }> = [
    {
      label: "vercel-labs/agent-skills",
      dir: join(thirdPartyRoot, "agent-skills", "skills"),
    },
    {
      label: "vercel-labs/portless",
      dir: join(thirdPartyRoot, "portless", "skills"),
    },
    {
      label: "vercel-labs/json-render",
      dir: join(thirdPartyRoot, "json-render", "skills"),
    },
    {
      label: "vercel-labs/agent-browser",
      dir: join(thirdPartyRoot, "agent-browser", "skills"),
    },
    { label: "user/.gemini/skills", dir: join(home, ".gemini", "skills") },
    { label: "workspace/.agents/skills", dir: "C:\\src\\.agents\\skills" },
    { label: "workspace/ralph/skills", dir: "C:\\src\\ralph\\skills" },
  ];
  return candidates.filter((c) => existsSync(c.dir));
}

export function discoverAndValidateSkills(
  roots = getDefaultSkillRoots(),
  options: { maxDepth?: number; includeInternal?: boolean } = {},
): SkillsDiscoveryReport {
  const maxDepth = options.maxDepth ?? 4;
  const includeInternal = options.includeInternal ?? true;
  const skills: ParsedSkill[] = [];
  const issues: SkillValidationIssue[] = [];

  for (const root of roots) {
    const files: string[] = [];
    collectSkillFilesFast(root.dir, maxDepth, files);
    for (const filePath of files) {
      const raw = readFileSync(filePath, "utf8");
      const { skill, issue } = validateAndParseSkillContent(
        raw,
        filePath,
        root.label,
      );
      if (issue) {
        issues.push(issue);
      } else if (skill && (includeInternal || !skill.internal)) {
        skills.push(skill);
      }
    }
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));

  const totalDiscoveryTokens = skills.reduce(
    (acc, s) => acc + s.discoveryTokens,
    0,
  );
  const totalActivationTokens = skills.reduce(
    (acc, s) => acc + s.fullActivationTokens,
    0,
  );
  const averageProgressiveSavingsPct =
    totalActivationTokens > 0
      ? Number(
          ((1 - totalDiscoveryTokens / totalActivationTokens) * 100).toFixed(2),
        )
      : 0;

  return {
    totalDiscovered: skills.length + issues.length,
    validCount: skills.length,
    invalidCount: issues.length,
    skills,
    issues,
    totalDiscoveryTokens,
    totalActivationTokens,
    averageProgressiveSavingsPct,
  };
}

export function benchmarkSkillsParser(
  iterations = 2500,
): SkillsParserBenchmarkResult {
  const roots = getDefaultSkillRoots();
  const files: Array<{ path: string; group: string; raw: string }> = [];
  for (const r of roots) {
    const paths: string[] = [];
    collectSkillFilesFast(r.dir, 4, paths);
    for (const p of paths) {
      files.push({ path: p, group: r.label, raw: readFileSync(p, "utf8") });
    }
  }

  const totalCorpusBytes = files.reduce(
    (sum, f) => sum + Buffer.byteLength(f.raw, "utf8"),
    0,
  );

  // Warmup JIT
  for (let i = 0; i < 50; i++) {
    for (const f of files) {
      parseSkillFrontmatterSinglePass(f.raw);
      parseSkillFrontmatterBaselineRegex(f.raw);
    }
  }

  const tSov0 = Bun.nanoseconds();
  let sinkSov = 0;
  for (let i = 0; i < iterations; i++) {
    for (const f of files) {
      const res = parseSkillFrontmatterSinglePass(f.raw);
      sinkSov += res.bodyOffset;
    }
  }
  const sovereignSinglePassMs = (Bun.nanoseconds() - tSov0) / 1e6;

  const tBase0 = Bun.nanoseconds();
  let sinkBase = 0;
  for (let i = 0; i < iterations; i++) {
    for (const f of files) {
      const res = parseSkillFrontmatterBaselineRegex(f.raw);
      sinkBase += res.content.length;
    }
  }
  const baselineRegexYamlMs = (Bun.nanoseconds() - tBase0) / 1e6;

  if (sinkSov === -1 || sinkBase === -1) {
    throw new Error("Unreachable benchmark sink");
  }

  const walkIterations = 120;
  const tWalkSov0 = Bun.nanoseconds();
  for (let i = 0; i < walkIterations; i++) {
    const out: string[] = [];
    for (const r of roots) collectSkillFilesFast(r.dir, 4, out);
  }
  const sovereignDiscoveryWalkMs = (Bun.nanoseconds() - tWalkSov0) / 1e6;

  const tWalkBase0 = Bun.nanoseconds();
  for (let i = 0; i < walkIterations; i++) {
    for (const r of roots) {
      const paths = collectSkillFilesBaselineStat(r.dir, 4);
      for (const p of paths) {
        const text = readFileSync(p, "utf8");
        parseSkillFrontmatterBaselineRegex(text);
      }
    }
  }
  const baselineMultiPassWalkMs = (Bun.nanoseconds() - tWalkBase0) / 1e6;

  // Include reading frontmatter slice in sovereign discovery walk to keep apples-to-apples discovery work
  const tWalkSovFull0 = Bun.nanoseconds();
  for (let i = 0; i < walkIterations; i++) {
    const out: string[] = [];
    for (const r of roots) collectSkillFilesFast(r.dir, 4, out);
    for (const p of out) {
      const text = readFileSync(p, "utf8");
      parseSkillFrontmatterSinglePass(text);
    }
  }
  const sovereignDiscoveryFullMs = (Bun.nanoseconds() - tWalkSovFull0) / 1e6;

  const totalOps = iterations * Math.max(1, files.length);
  const sovereignOpsPerSec = Math.round(
    (totalOps / sovereignSinglePassMs) * 1000,
  );
  const baselineOpsPerSec = Math.round((totalOps / baselineRegexYamlMs) * 1000);

  return {
    skillFilesCount: files.length,
    totalCorpusBytes,
    iterations,
    sovereignSinglePassMs: Number(sovereignSinglePassMs.toFixed(2)),
    sovereignOpsPerSec,
    baselineRegexYamlMs: Number(baselineRegexYamlMs.toFixed(2)),
    baselineOpsPerSec,
    speedupFactor: Number(
      (baselineRegexYamlMs / Math.max(0.01, sovereignSinglePassMs)).toFixed(2),
    ),
    sovereignDiscoveryWalkMs: Number(
      Math.max(sovereignDiscoveryWalkMs, sovereignDiscoveryFullMs).toFixed(2),
    ),
    baselineMultiPassWalkMs: Number(baselineMultiPassWalkMs.toFixed(2)),
    walkSpeedupFactor: Number(
      (
        baselineMultiPassWalkMs / Math.max(0.01, sovereignDiscoveryFullMs)
      ).toFixed(2),
    ),
  };
}
