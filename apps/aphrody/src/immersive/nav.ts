// Spatial navigation: pick the next focusable item in a direction from rectangles. Pure, no DOM.
export type Dir = "left" | "right" | "up" | "down";
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const cx = (b: Box) => b.x + b.w / 2;
const cy = (b: Box) => b.y + b.h / 2;

/** Index of the best neighbour of `from` in `dir`, or -1. Score favours alignment on the cross axis. */
export function pickNext(boxes: Box[], from: number, dir: Dir): number {
  const a = boxes[from];
  if (!a) return boxes.length ? 0 : -1;
  let best = -1;
  let bestScore = Infinity;
  boxes.forEach((b, i) => {
    if (i === from) return;
    const dx = cx(b) - cx(a);
    const dy = cy(b) - cy(a);
    const main =
      dir === "left" ? -dx : dir === "right" ? dx : dir === "up" ? -dy : dy;
    const cross = dir === "left" || dir === "right" ? dy : dx;
    if (main <= 1) return;
    const score = main + 2 * Math.abs(cross);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

/** Direction of a gamepad stick or d-pad reading, or null inside the dead zone. */
export function stickDir(x: number, y: number, dead = 0.5): Dir | null {
  if (Math.hypot(x, y) < dead) return null;
  return Math.abs(x) > Math.abs(y)
    ? x < 0
      ? "left"
      : "right"
    : y < 0
      ? "up"
      : "down";
}
