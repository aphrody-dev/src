// Home entry: starts the stage over the product tiles after the page has loaded and the main thread
// is idle, so it never competes with LCP or INP. Without WebGPU (or under the opt-outs) it does nothing.
import { startStage, stageSupported } from "./stage.ts";

const MATERIALS = ["aerial_grass_rock", "aerial_rocks_02"];

function boot() {
  if (!stageSupported().ok) return;
  const items = [...document.querySelectorAll<HTMLElement>(".products .card")];
  if (!items.length) return;
  void startStage({ items, assetBase: "/stage", materials: MATERIALS }).then(
    (h) => {
      (window as unknown as { __stage?: unknown }).__stage = h?.stats ?? null;
    },
  );
}

const idle = (f: () => void) =>
  "requestIdleCallback" in window
    ? requestIdleCallback(f, { timeout: 2500 })
    : setTimeout(f, 800);
if (document.readyState === "complete") idle(boot);
else addEventListener("load", () => idle(boot), { once: true });
