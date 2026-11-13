// Copyright 2026 Aphrody. Licensed under the Apache License, Version 2.0.
//
// Line scanner for the parts of CommonMark the DESIGN.md parser reads: YAML front matter, fenced code
// blocks (```yaml / ~~~yml), and level-2 headings (ATX `## x` and setext `x\n---`). It replaces the
// unified + remark-parse + remark-frontmatter + unist-util-visit pipeline of upstream
// (google-labs-code/design.md packages/cli/src/linter/parser/handler.ts) with the same outputs:
// YAML block values with their 1-based start line, and H2 texts built like mdast (text and inline
// code values only; emphasis, strong and links contribute nothing).

export interface YamlBlock {
  yaml: string;
  block: "frontmatter" | number;
  startLine: number;
}

export interface ScanResult {
  blocks: YamlBlock[];
  sections: string[];
  headingsWithLines: Array<{ text: string; line: number }>;
}

const FENCE = /^( {0,3})(`{3,}|~{3,})(.*)$/;
const ATX = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/;
const SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;
const THEMATIC = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const BLOCK_START = /^ {0,3}(?:[>#]|[-+*][ \t]|\d{1,9}[.)][ \t]|`{3}|~{3}|<)/;

/** Heading text as mdast would expose it through `value` children. */
export function headingText(raw: string): string {
  let s = raw.replace(/(?:^|[ \t]+)#+[ \t]*$/, "");
  const parts: string[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i]!;
    if (ch === "\\" && i + 1 < s.length && /[!-/:-@[-`{-~]/.test(s[i + 1]!)) {
      parts.push(s[i + 1]!);
      i += 2;
      continue;
    }
    if (ch === "`") {
      const run = /^`+/.exec(s.slice(i))![0];
      const close = s.indexOf(run, i + run.length);
      if (close > 0) {
        let code = s.slice(i + run.length, close);
        if (
          code.length > 1 &&
          code.startsWith(" ") &&
          code.endsWith(" ") &&
          code.trim()
        )
          code = code.slice(1, -1);
        parts.push(code);
        i = close + run.length;
        continue;
      }
    }
    if (ch === "!" || ch === "[") {
      const m = /^!?\[[^\]]*\]\([^)]*\)/.exec(s.slice(i));
      if (m) {
        i += m[0].length;
        continue;
      }
    }
    if (ch === "*" || ch === "_") {
      const run = /^(\*{1,3}|_{1,3})/.exec(s.slice(i))![0];
      const close = s.indexOf(run, i + run.length);
      if (close > i + run.length && !/\s/.test(s[i + run.length]!)) {
        i = close + run.length;
        continue;
      }
    }
    parts.push(ch);
    i++;
  }
  return parts.join("").trim();
}

export function scanMarkdown(content: string): ScanResult {
  const lines = content
    .replace(/^﻿/, "")
    .split("\n")
    .map((l) => (l.endsWith("\r") ? l.slice(0, -1) : l));
  const blocks: YamlBlock[] = [];
  const headingsWithLines: Array<{ text: string; line: number }> = [];
  let codeIndex = 0;
  let i = 0;

  // Front matter: `---` on the very first line, closed by `---` (remark-frontmatter, yaml preset).
  if (lines[0] === "---") {
    const end = lines.findIndex((l, n) => n > 0 && /^---[ \t]*$/.test(l));
    if (end > 0) {
      blocks.push({
        yaml: lines.slice(1, end).join("\n"),
        block: "frontmatter",
        startLine: 1,
      });
      i = end + 1;
    }
  }

  let para: { start: number; text: string[] } | null = null;
  for (; i < lines.length; i++) {
    const line = lines[i]!;
    const blank = /^[ \t]*$/.test(line);

    const fence = FENCE.exec(line);
    if (fence && !(fence[2]![0] === "`" && fence[3]!.includes("`"))) {
      para = null;
      const indent = fence[1]!.length;
      const marker = fence[2]!;
      const lang = fence[3]!.trim().split(/\s+/)[0] ?? "";
      const body: string[] = [];
      const start = i + 1;
      const close = new RegExp(
        `^ {0,3}${marker[0] === "`" ? "`" : "~"}{${marker.length},}[ \\t]*$`,
      );
      for (i++; i < lines.length && !close.test(lines[i]!); i++) {
        body.push(lines[i]!.replace(new RegExp(`^ {0,${indent}}`), ""));
      }
      if (lang === "yaml" || lang === "yml") {
        blocks.push({
          yaml: body.join("\n"),
          block: codeIndex,
          startLine: start,
        });
        codeIndex++;
      }
      continue;
    }

    const atx = ATX.exec(line);
    if (atx) {
      para = null;
      if (atx[1]!.length === 2) {
        const text = headingText(atx[2] ?? "");
        if (text) headingsWithLines.push({ text, line: i + 1 });
      }
      continue;
    }

    if (para && SETEXT.test(line)) {
      if (line.trim()[0] === "-") {
        const text = headingText(para.text.join("\n"));
        if (text) headingsWithLines.push({ text, line: para.start });
      }
      para = null;
      continue;
    }

    if (blank || THEMATIC.test(line) || BLOCK_START.test(line)) {
      para = null;
      continue;
    }
    if (/^(?: {4}|\t)/.test(line) && !para) continue; // indented code
    if (para) para.text.push(line.trim());
    else para = { start: i + 1, text: [line.trim()] };
  }

  return {
    blocks,
    sections: headingsWithLines.map((h) => h.text),
    headingsWithLines,
  };
}
