// Boot of /play: WebGPU check, then the wasm game built from crates/game (wasm-bindgen output
// game.js + game_bg.wasm next to this file). Exposes window.__play for scripts/game-fps.ts.
export {};

interface PlayState {
  gpu: boolean;
  started: boolean;
  error?: string;
}

const T = {
  fr: {
    loading: "Chargement du jeu...",
    noGpu:
      "Ce jeu demande WebGPU. Utilisez une version récente de Chrome, Edge ou Safari sur un appareil avec un GPU compatible.",
    missing: "Le jeu n'est pas installé sur ce serveur (build wasm absent).",
    failed: "Le jeu n'a pas pu démarrer.",
    hint: "Cliquez pour capturer la souris. ZQSD / WASD ou stick gauche : marcher. Maj : courir. Espace ou A : sauter. T : accélérer le jour. Échap : libérer la souris.",
  },
  en: {
    loading: "Loading the game...",
    noGpu:
      "This game requires WebGPU. Use a recent Chrome, Edge or Safari on a device with a compatible GPU.",
    missing: "The game is not installed on this server (wasm build missing).",
    failed: "The game could not start.",
    hint: "Click to capture the mouse. WASD or left stick: walk. Shift: run. Space or A: jump. T: speed up the day. Esc: release the mouse.",
  },
} as const;

const lang = navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
const t = T[lang];
const state: PlayState = { gpu: false, started: false };
(window as unknown as { __play: PlayState }).__play = state;

const msg = document.getElementById("msg")!;
const text = document.getElementById("msg-text")!;
const hint = document.getElementById("hint")!;
document.documentElement.lang = lang;

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
      /* @vite-ignore */ new URL("./game.js", import.meta.url).href
    );
  } catch {
    state.error = "game.js missing";
    show(t.missing);
    return;
  }
  try {
    await mod.default({
      module_or_path: new URL("./game_bg.wasm", import.meta.url),
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

await main();
