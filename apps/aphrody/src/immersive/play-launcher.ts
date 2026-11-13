// /play launcher: spatial menu on the stage (Start, Controls, Sound) before the game boots. Start by
// click, Enter, or gamepad A. ?autostart=1 skips it (scripts/game-fps.ts). Without WebGPU it resolves at
// once so play.ts shows its own message.
import { startStage, stageSupported } from "./stage.ts";
import { createSounds } from "./sound.ts";

const MATERIALS = ["aerial_grass_rock", "aerial_rocks_02"];

export async function launcher(): Promise<void> {
  const root = document.getElementById("launcher");
  if (!root || new URLSearchParams(location.search).has("autostart") || !stageSupported().ok) {
    root?.setAttribute("hidden", "");
    return;
  }
  const sounds = createSounds("/stage/audio");
  const unlock = () => sounds.unlock();
  addEventListener("pointerdown", unlock, { once: true });
  addEventListener("keydown", unlock, { once: true });

  const q = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const start = q<HTMLButtonElement>("l-start");
  const controls = q<HTMLButtonElement>("l-controls");
  const sound = q<HTMLButtonElement>("l-sound");
  const panel = q<HTMLElement>("l-panel");

  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));
  const handle = await startStage({
    items: [start, controls, sound].map((b) => b.closest<HTMLElement>(".l-card")!),
    assetBase: "/stage",
    materials: MATERIALS,
    onFocus: () => (sounds.unlock(), sounds.play("rollover")),
    onActivate: () => sounds.play("click"),
  }).catch(() => null);
  (window as unknown as { __stage?: unknown }).__stage = handle?.stats ?? null;

  controls.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    controls.setAttribute("aria-expanded", String(open));
  });
  sound.addEventListener("click", () => {
    sounds.enabled = !sounds.enabled;
    sound.setAttribute("aria-pressed", String(sounds.enabled));
    sound.querySelector(".l-state")!.textContent = sounds.enabled ? sound.dataset.on! : sound.dataset.off!;
  });
  start.addEventListener("click", () => resolve());
  start.focus({ preventScroll: true });
  await done;
  handle?.destroy();
  root.setAttribute("hidden", "");
}
