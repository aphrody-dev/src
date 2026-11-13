// Tagged HTML: every interpolation is escaped unless it is a Html value (output of html`` or raw()).
const SAFE = Symbol.for("aphrody.site.html");

export interface Html {
  readonly [SAFE]: true;
  readonly value: string;
  toString(): string;
}

const make = (value: string): Html => ({
  [SAFE]: true,
  value,
  toString: () => value,
});

const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
export const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ESC[c]!);

export const isHtml = (v: unknown): v is Html =>
  typeof v === "object" && v !== null && SAFE in v;

/** Trusted markup, not escaped. */
export const raw = (s: string): Html => make(s);

function part(v: unknown): string {
  if (v === null || v === undefined || v === false) return "";
  if (Array.isArray(v)) return v.map(part).join("");
  if (isHtml(v)) return v.value;
  return escapeHtml(String(v));
}

export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Html {
  let out = strings[0]!;
  for (let i = 0; i < values.length; i++)
    out += part(values[i]) + strings[i + 1]!;
  return make(out);
}

/** JSON for an inline <script type="application/json|ld+json">, safe against </script>. */
export const jsonScript = (v: unknown): Html =>
  make(
    JSON.stringify(v)
      .replace(/</g, "\\u003c")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029"),
  );
