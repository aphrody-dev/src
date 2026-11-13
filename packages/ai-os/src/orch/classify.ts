// Classes d'échec d'un moteur, d'après sa sortie (code, stderr, JSON d'erreur). Elles décident de la réparation, avec la
// même séparation que les classes d'erreur d'opencode (packages/ai/src/schema/errors.ts) et le routeur LiteLLM :
//   quota    : 402, crédits, quota de compte, RESOURCE_EXHAUSTED   -> refroidissement long, bascule sans attendre
//   throttle : 429 / rate limit sans texte de quota                -> une attente bornée (Retry-After), puis bascule
//   auth     : session expirée, 401/403                           -> moteur écarté jusqu'à la prochaine sonde
//   missing  : binaire ou checkout absent (ENOENT, code 127)       -> moteur ou hôte écarté
//   context  : contexte dépassé                                    -> moteur à plus grand contexte
//   policy   : refus de politique de contenu                        -> autre fournisseur
//   timeout  : délai dépassé                                        -> une relance, puis bascule
//   overload : 5xx, surcharge, réseau                               -> relance avec attente, puis bascule
//   task     : le moteur a répondu mais la tâche a échoué           -> ticket de correction
export type FailClass =
  | "quota"
  | "throttle"
  | "auth"
  | "missing"
  | "context"
  | "policy"
  | "timeout"
  | "overload"
  | "task";

const RULES: [FailClass, RegExp][] = [
  [
    "quota",
    /insufficient_quota|quota\b.{0,40}\b(exceeded|exhausted|reached)|exceeded your (current )?quota|(daily|monthly) (quota|limit)|credits? balance|out of credits|insufficient credits|(status|http|error|code)\D{0,12}\b402\b|payment required|usage limit|hit your limit|billing|resource_exhausted.{0,200}(credit|billing|daily|plan)/is,
  ],
  [
    "throttle",
    /(status|http|error|code)\D{0,12}\b429\b|rate[ _-]?limit|too many requests|resource_exhausted/i,
  ],
  [
    "auth",
    /failed to authenticate|oauth session expired|not logged in|please (log|sign) ?in|login required|unauthori[sz]ed|(status|http|error|code)\D{0,12}\b40[13]\b|invalid api key|authentication (failed|required|error)/i,
  ],
  [
    "missing",
    /ENOENT|command not found|not recognized as an internal|executable file not found|checkout absent/i,
  ],
  [
    "context",
    /context (length|window)|maximum context|prompt is too long|too many tokens|context_length_exceeded/i,
  ],
  [
    "policy",
    /content policy|content_policy|moderation|flagged by|safety filter/i,
  ],
  ["timeout", /timed? ?out|ETIMEDOUT|deadline exceeded|SIGTERM/i],
  [
    "overload",
    /(status|http|error|code)\D{0,12}\b(50[0234]|529)\b|overloaded|service unavailable|ECONNRESET|ECONNREFUSED|EAI_AGAIN|socket hang up|connection (reset|closed)/i,
  ],
];

export function classify(text: string, code?: number | null): FailClass {
  if (code === 127) return "missing";
  if (code === 124) return "timeout";
  for (const [c, re] of RULES) if (re.test(text)) return c;
  return "task";
}

/** Retry-After cité dans la sortie (secondes, « 500ms », date HTTP ou ISO), borné à 60 s ; 0 si absent. */
export function retryAfterMs(text: string, now = Date.now()): number {
  const m = text.match(
    /retry[- _]after(?:-ms)?["']?\s*[:=]?\s*["']?([^\r\n"';]+)/i,
  );
  if (!m) return 0;
  const v = m[1]!.trim();
  const n = v.match(/^(\d+(?:\.\d+)?)\s*(ms|s)?\b/i);
  const ms = n
    ? Number(n[1]) *
      (n[2]?.toLowerCase() === "ms" || /retry[- _]after-ms/i.test(m[0])
        ? 1
        : 1000)
    : Date.parse(v) - now;
  return Number.isFinite(ms) ? Math.min(Math.max(ms, 0), 60_000) : 0;
}

/** Durée de refroidissement d'un moteur après un échec de cette classe ; 0 = aucun (échec propre à la tâche). */
export function cooldownMs(c: FailClass, fails: number): number {
  const exp = (base: number) => base * 2 ** Math.max(0, Math.min(fails - 1, 5));
  switch (c) {
    case "quota":
      return exp(15 * 60_000);
    case "throttle":
      return exp(60_000);
    case "auth":
      return 6 * 3600_000;
    case "missing":
      return 24 * 3600_000;
    case "overload":
      return exp(60_000);
    case "timeout":
      return exp(2 * 60_000);
    default:
      return 0;
  }
}

/** Échecs qui font changer de moteur sans relancer le même. */
export const switches = (c: FailClass) =>
  c === "quota" ||
  c === "auth" ||
  c === "missing" ||
  c === "context" ||
  c === "policy";
