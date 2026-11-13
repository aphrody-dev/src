// ICU MessageFormat subset: {name}, {n, number}, {n, plural, =0 {} one {} other {}} with #,
// {g, select, a {} other {}}, nesting, and apostrophe quoting ('' is a literal apostrophe,
// '{' and '}' quote a brace). Zero dependencies; plural categories come from Intl.PluralRules.

export type MessageArg = string | number | boolean;
export type MessageArgs = Readonly<Record<string, MessageArg>>;

export type Node =
  | { t: "text"; v: string }
  | { t: "arg"; name: string; number: boolean }
  | { t: "pound" }
  | { t: "plural"; name: string; cases: Record<string, Node[]> }
  | { t: "select"; name: string; cases: Record<string, Node[]> };

export class MessageSyntaxError extends Error {
  constructor(
    message: string,
    readonly source: string,
    readonly position: number,
  ) {
    super(`${message} at ${position} in ${JSON.stringify(source)}`);
    this.name = "MessageSyntaxError";
  }
}

const cache = new Map<string, Node[]>();

export function parseMessage(source: string): Node[] {
  const hit = cache.get(source);
  if (hit) return hit;
  const p = new Parser(source);
  const nodes = p.parseNodes(false, false);
  if (p.i < source.length)
    throw new MessageSyntaxError("unexpected }", source, p.i);
  cache.set(source, nodes);
  return nodes;
}

class Parser {
  i = 0;
  constructor(readonly s: string) {}

  fail(msg: string): never {
    throw new MessageSyntaxError(msg, this.s, this.i);
  }

  parseNodes(nested: boolean, inPlural: boolean): Node[] {
    const out: Node[] = [];
    let text = "";
    const flush = () => {
      if (text) out.push({ t: "text", v: text });
      text = "";
    };
    while (this.i < this.s.length) {
      const c = this.s[this.i]!;
      if (c === "'") {
        const n = this.s[this.i + 1];
        if (n === "'") {
          text += "'";
          this.i += 2;
        } else if (n === "{" || n === "}") {
          // quoted run until the next lone apostrophe
          this.i++;
          while (this.i < this.s.length) {
            if (this.s[this.i] === "'") {
              if (this.s[this.i + 1] === "'") {
                text += "'";
                this.i += 2;
                continue;
              }
              this.i++;
              break;
            }
            text += this.s[this.i++];
          }
        } else {
          text += c;
          this.i++;
        }
      } else if (c === "{") {
        flush();
        out.push(this.parseArgument());
      } else if (c === "}") {
        if (nested) break;
        this.fail("unmatched }");
      } else if (c === "#" && inPlural) {
        flush();
        out.push({ t: "pound" });
        this.i++;
      } else {
        text += c;
        this.i++;
      }
    }
    flush();
    return out;
  }

  ws() {
    while (this.i < this.s.length && /\s/.test(this.s[this.i]!)) this.i++;
  }

  ident(): string {
    this.ws();
    const m = /^[^\s,{}]+/.exec(this.s.slice(this.i));
    if (!m) this.fail("expected identifier");
    this.i += m[0].length;
    return m[0];
  }

  parseArgument(): Node {
    this.i++; // {
    const name = this.ident();
    this.ws();
    if (this.s[this.i] === "}") {
      this.i++;
      return { t: "arg", name, number: false };
    }
    if (this.s[this.i] !== ",") this.fail("expected , or }");
    this.i++;
    const kind = this.ident();
    this.ws();
    if (kind === "number") {
      if (this.s[this.i] !== "}") this.fail("expected }");
      this.i++;
      return { t: "arg", name, number: true };
    }
    if (kind !== "plural" && kind !== "select")
      this.fail(`unsupported type ${kind}`);
    if (this.s[this.i] !== ",") this.fail("expected ,");
    this.i++;
    const cases: Record<string, Node[]> = {};
    for (;;) {
      this.ws();
      if (this.s[this.i] === "}") {
        this.i++;
        break;
      }
      if (this.i >= this.s.length) this.fail("unterminated argument");
      const key = this.ident();
      this.ws();
      if (this.s[this.i] !== "{") this.fail("expected {");
      this.i++;
      cases[key] = this.parseNodes(true, kind === "plural");
      if (this.s[this.i] !== "}") this.fail("unterminated case");
      this.i++;
    }
    if (!("other" in cases)) this.fail(`${kind} requires an other case`);
    return { t: kind, name, cases };
  }
}

export function formatMessage(
  source: string,
  locale: string,
  args: MessageArgs = {},
): string {
  return render(parseMessage(source), locale, args, undefined);
}

function render(
  nodes: Node[],
  locale: string,
  args: MessageArgs,
  pound: number | undefined,
): string {
  let out = "";
  for (const n of nodes) {
    switch (n.t) {
      case "text":
        out += n.v;
        break;
      case "pound":
        out += pound === undefined ? "#" : numberText(pound, locale);
        break;
      case "arg": {
        const v = args[n.name];
        if (v === undefined) out += `{${n.name}}`;
        else
          out +=
            n.number && typeof v === "number"
              ? numberText(v, locale)
              : String(v);
        break;
      }
      case "plural": {
        const v = Number(args[n.name]);
        if (Number.isNaN(v)) {
          out += `{${n.name}}`;
          break;
        }
        const branch =
          n.cases[`=${v}`] ??
          n.cases[pluralCategory(v, locale)] ??
          n.cases.other!;
        out += render(branch, locale, args, v);
        break;
      }
      case "select": {
        const v = String(args[n.name]);
        out += render(n.cases[v] ?? n.cases.other!, locale, args, pound);
        break;
      }
    }
  }
  return out;
}

function numberText(v: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(v);
  } catch {
    return String(v);
  }
}

export function pluralCategory(n: number, locale: string): Intl.LDMLPluralRule {
  try {
    return new Intl.PluralRules(locale).select(n);
  } catch {
    return "other";
  }
}

/** Argument names used by a message (for check: placeholder parity across locales). */
export function argNames(source: string): string[] {
  const names = new Set<string>();
  const walk = (nodes: Node[]) => {
    for (const n of nodes) {
      if (n.t === "arg") names.add(n.name);
      else if (n.t === "plural" || n.t === "select") {
        names.add(n.name);
        for (const c of Object.values(n.cases)) walk(c);
      }
    }
  };
  walk(parseMessage(source));
  return [...names].sort();
}
