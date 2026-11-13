import type { Env, Target } from "./types";

const proc = (): Record<string, string | undefined> =>
  typeof process !== "undefined" ? process.env : {};

/** Worker string bindings over process.env. No secret is ever read from disk. */
export function makeEnv(bindings?: Record<string, unknown>): Env {
  const get = (n: string) => {
    const b = bindings?.[n];
    return typeof b === "string" ? b : proc()[n];
  };
  return {
    get,
    require(n) {
      const v = get(n);
      if (v === undefined || v === "") throw new Error(`missing env ${n}`);
      return v;
    },
  };
}

/** RUNTIME_TARGET wins, else detection. */
export function detectTarget(bindings?: Record<string, unknown>): Target {
  const t =
    (bindings?.RUNTIME_TARGET as string | undefined) ?? proc().RUNTIME_TARGET;
  if (t === "cf" || t === "vercel" || t === "vps") return t;
  if (proc().VERCEL) return "vercel";
  if (
    typeof navigator !== "undefined" &&
    navigator.userAgent === "Cloudflare-Workers"
  )
    return "cf";
  return "vps";
}
