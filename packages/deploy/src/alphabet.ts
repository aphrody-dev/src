// Parser of docs/ALPHABET.md, the single source of the holding page (aphrody.com) and of the labs (aphrody.app/labs).
// Sections are "## " headings; tables are GitHub pipe tables whose first row is the header.

export interface Section {
  title: string;
  paragraphs: string[];
  bullets: string[];
  ordered: string[];
  table: { head: string[]; rows: string[][] } | null;
}

export interface Alphabet {
  title: string;
  intro: string[];
  sections: Section[];
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

export function parseAlphabet(md: string): Alphabet {
  const out: Alphabet = { title: "", intro: [], sections: [] };
  let cur: Section | null = null;
  let para: string[] = [];
  const flush = () => {
    if (!para.length) return;
    (cur ? cur.paragraphs : out.intro).push(para.join(" "));
    para = [];
  };
  for (const raw of md.replace(/\r/g, "").split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("# ")) {
      out.title = line.slice(2).trim();
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      cur = {
        title: line.slice(3).trim(),
        paragraphs: [],
        bullets: [],
        ordered: [],
        table: null,
      };
      out.sections.push(cur);
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    if (cur && line.trimStart().startsWith("|")) {
      flush();
      const c = cells(line);
      if (c.every((x) => /^:?-{3,}:?$/.test(x))) continue;
      if (!cur.table) cur.table = { head: c, rows: [] };
      else cur.table.rows.push(c);
      continue;
    }
    const b = /^[-*] (.*)$/.exec(line.trim());
    if (b && cur) {
      flush();
      cur.bullets.push(b[1]!);
      continue;
    }
    const o = /^\d+\. (.*)$/.exec(line.trim());
    if (o && cur) {
      flush();
      cur.ordered.push(o[1]!);
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return out;
}

export function section(a: Alphabet, prefix: string): Section | undefined {
  return a.sections.find((s) =>
    s.title.toLowerCase().startsWith(prefix.toLowerCase()),
  );
}

/** Inline markdown to HTML: `code`, **bold**, [text](url) and bare https URLs. Input is escaped first. */
export function inline(md: string): string {
  let s = Bun.escapeHTML(md);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/(^|[\s(])(https:\/\/[^\s)<]+)/g, '$1<a href="$2">$2</a>');
  return s;
}

/** Plain text of an inline markdown cell. */
export function plain(md: string): string {
  return md
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

/** First repository path of a cell such as "`apps/nt`" or "`docs/unixwin`, `apps/unixwin`" (brace groups dropped). */
export function firstPath(cell: string): string | undefined {
  const m = /`([^`]+)`/.exec(cell);
  if (!m) return undefined;
  return (
    m[1]!
      .split(",")[0]!
      .replace(/\{.*$/, "")
      .replace(/\/$/, "")
      .split(" ")[0]!
      .trim() || undefined
  );
}

export const isTodo = (s: Section | undefined) =>
  !s || [...s.paragraphs, ...s.bullets].join(" ").includes("TODO(owner)");
