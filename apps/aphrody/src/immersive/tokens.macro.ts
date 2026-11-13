// Bun macro: reads the M3 motion tokens of packages/design/tokens/tokens.css at bundle time so the
// browser bundle carries numbers, not the 27 KB stylesheet.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface MotionTokens {
  /** Milliseconds by token name, e.g. "short2" -> 100. */
  duration: Record<string, number>;
  /** Cubic-bezier control points by token name, e.g. "emphasized" -> [0.2, 0, 0, 1]. */
  easing: Record<string, [number, number, number, number]>;
}

export function parseMotion(css: string): MotionTokens {
  const duration: MotionTokens["duration"] = {};
  const easing: MotionTokens["easing"] = {};
  for (const m of css.matchAll(
    /--md-sys-motion-duration-([a-z0-9-]+):\s*(\d+)ms/g,
  )) {
    if (!(m[1]! in duration)) duration[m[1]!] = Number(m[2]);
  }
  for (const m of css.matchAll(
    /--md-sys-motion-easing-([a-z0-9-]+):\s*cubic-bezier\(([^)]+)\)/g,
  ))
    easing[m[1]!] ??= m[2]!.split(",").map(Number) as [
      number,
      number,
      number,
      number,
    ];
  return { duration, easing };
}

export function motionTokens(): MotionTokens {
  const css = readFileSync(
    join(
      import.meta.dir,
      "..",
      "..",
      "..",
      "..",
      "packages",
      "design",
      "tokens",
      "tokens.css",
    ),
    "utf8",
  );
  return parseMotion(css);
}
