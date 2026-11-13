// Boot of /play: WebGPU check, then the wasm game built from crates/game (wasm-bindgen output
// game.js + game_bg.wasm next to this file). Exposes window.__play for scripts/game-fps.ts.
import { launcher } from "../immersive/play-launcher.ts";

interface PlayState {
  gpu: boolean;
  started: boolean;
  error?: string;
}

const dict = JSON.parse(
  document.getElementById("i18n")?.textContent ?? "{}",
) as Record<string, string>;
const t = {
  loading: dict["play.loading"] ?? "",
  noGpu: dict["play.nogpu"] ?? "",
  missing: dict["play.missing"] ?? "",
  failed: dict["play.failed"] ?? "",
  hint: dict["play.hint"] ?? "",
};
const state: PlayState = { gpu: false, started: false };
(window as unknown as { __play: PlayState }).__play = state;

const msg = document.getElementById("msg")!;
const text = document.getElementById("msg-text")!;
const hint = document.getElementById("hint")!;

function show(message: string) {
  text.textContent = message;
  msg.hidden = false;
}

async function hasWebGpu(): Promise<boolean> {
  const gpu = (
    navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } }
  ).gpu;
  if (!gpu) return false;
  try {
    return (await gpu.requestAdapter()) != null;
  } catch {
    return false;
  }
}

// wasm build published by .github/workflows/game.yml (fr1) to R2; the site deployment does not carry it.
const GAME_BASE = "https://cdn.aphrody.com/game/";

async function main() {
  show(t.loading);
  state.gpu = await hasWebGpu();
  if (!state.gpu) {
    show(t.noGpu);
    return;
  }
  let mod: { default: (opts?: unknown) => Promise<unknown> };
  try {
    mod = await import(
      /* @vite-ignore */ GAME_BASE + "game.js"
    );
  } catch {
    state.error = "game.js missing";
    show(t.missing);
    return;
  }
  try {
    await mod.default({
      module_or_path: GAME_BASE + "game_bg.wasm",
    });
  } catch (e) {
    // winit on the web ends init by throwing this on purpose (control flow, not an error).
    if (!String(e).includes("Using exceptions for control flow")) {
      state.error = String(e);
      show(t.failed);
      return;
    }
  }
  msg.hidden = true;
  hint.textContent = t.hint;
  hint.hidden = false;
  setTimeout(() => hint.classList.add("gone"), 12000);
  // "started" once the browser has actually painted frames after init.
  let frames = 0;
  const tick = () => {
    if (++frames >= 10) state.started = true;
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

await launcher();
await main();
