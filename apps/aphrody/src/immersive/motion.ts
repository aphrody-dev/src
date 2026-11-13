// Motion core of the stage: critically damped springs whose rate comes from the M3 duration tokens
// (packages/design/tokens/tokens.css, read by the macro), and the reduced-motion switch.
import { motionTokens } from "./tokens.macro.ts" with { type: "macro" };

export const MOTION = motionTokens();

/** Seconds for a duration token; throws at bundle time on a missing token. */
export function dur(name: string): number {
  const v = MOTION.duration[name];
  if (v === undefined) throw new Error(`unknown motion token ${name}`);
  return v / 1000;
}

/** A critically damped spring that settles in about `seconds` (4.6 time constants, 1 percent). */
export class Spring {
  v = 0;
  constructor(
    public x = 0,
    public target = 0,
    public seconds = 0.25,
  ) {}
  /** Advances by dt seconds with the exact critically damped solution; returns true while moving. */
  step(dt: number): boolean {
    if (!(this.seconds > 0)) {
      this.snap(this.target);
      return false;
    }
    const w = 4.6 / this.seconds;
    const d = this.x - this.target;
    const e = Math.exp(-w * dt);
    const nx = this.target + (d + (this.v + w * d) * dt) * e;
    this.v = (this.v - (this.v + w * d) * w * dt) * e;
    this.x = nx;
    if (Math.abs(this.x - this.target) < 1e-3 && Math.abs(this.v) < 1e-3) {
      this.x = this.target;
      this.v = 0;
      return false;
    }
    return true;
  }
  snap(v: number) {
    this.x = this.target = v;
    this.v = 0;
  }
}
