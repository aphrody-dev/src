// /os entry: stage-backed launcher, window apps, gamepad-first navigation inside windows.
import { startStage, stageSupported } from "../../immersive/stage.ts";
import { createSounds } from "../../immersive/sound.ts";
import { pickNext, stickDir, type Dir } from "../../immersive/nav.ts";
import { t } from "./i18n.ts";
import { anyOpen, topWindow } from "./wm.ts";
import * as apps from "./apps.ts";

const MATERIALS = ["aerial_grass_rock", "aerial_rocks_02"];
const WALLS = [
  "aphrody-dark-mesh",
  "aphrody-dark-aurora",
  "aphrody-dark-facets",
  "aphrody-dark-stars",
  "aphrody-dark-topo",
  "ember-dark-aurora",
];
const sounds = createSounds("/stage/audio");
sounds.enabled = localStorage.getItem("os.sound") !== "0";
const unlock = () => sounds.unlock();
addEventListener("pointerdown", unlock, { once: true });
addEventListener("keydown", unlock, { once: true });

// Wallpaper (owner assets, assets/generated/wallpapers).
let wall = localStorage.getItem("os.wall") ?? WALLS[0]!;
const setWall = (n: string) => {
  wall = n;
  localStorage.setItem("os.wall", n);
  document.documentElement.style.setProperty(
    "--wall",
    `url(/os/wall/${n}.webp)`,
  );
};
setWall(WALLS.includes(wall) ? wall : WALLS[0]!);

const clock = document.getElementById("clock")!;
const tick = () =>
  (clock.textContent = new Date().toLocaleTimeString(
    document.documentElement.lang,
    { hour: "2-digit", minute: "2-digit" },
  ));
tick();
setInterval(tick, 15_000);

const launch: apps.Launch = (app, file) => {
  sounds.play("click");
  switch (app) {
    case "library":
      return void apps.library(launch);
    case "store":
      return void apps.store();
    case "settings":
      return void apps.settings({
        sound: sounds,
        walls: WALLS,
        setWall,
        wall: () => wall,
      });
    case "game":
      return void apps.game();
    case "linux":
      return void apps.linux(file);
    case "flash":
      return void apps.flash(file);
    case "emulator":
      return void apps.emulator(file);
    case "console":
      return void apps.consoleApp();
  }
};
const tiles = [...document.querySelectorAll<HTMLElement>("[data-app]")];
for (const b of tiles)
  b.addEventListener("click", () => launch(b.dataset.app!));

// Gamepad-first navigation inside the focused window (the stage handles the launcher): d-pad or left stick
// moves focus between controls by position, A activates, B closes the window, Start returns home.
// Windows that capture input (VM screen, emulator, game frame) keep the keys; only B/Start are read there.
const FOCUSABLE =
  'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
let held: Dir | null = null;
let next = 0;
const was: boolean[] = [];
const padLoop = (now: number) => {
  requestAnimationFrame(padLoop);
  const gp = [...(navigator.getGamepads?.() ?? [])].find((g) => g?.connected);
  if (!gp) return;
  const press = (i: number) => {
    const d = !!gp.buttons[i]?.pressed;
    const edge = d && !was[i];
    was[i] = d;
    return edge;
  };
  const win = topWindow();
  const b = press(1);
  const start = press(9);
  const a = press(0);
  if (!win) return;
  if (document.documentElement.dataset.input !== "pad")
    document.documentElement.dataset.input = "pad";
  if (b || start) {
    win.close();
    return;
  }
  const items = [...win.el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (e) => !e.closest("iframe") && e.offsetParent,
  );
  const cur = items.indexOf(document.activeElement as HTMLElement);
  if (a && cur >= 0) return void items[cur]!.click();
  let dir = stickDir(gp.axes[0] ?? 0, gp.axes[1] ?? 0);
  if (gp.buttons[14]?.pressed) dir = "left";
  else if (gp.buttons[15]?.pressed) dir = "right";
  else if (gp.buttons[12]?.pressed) dir = "up";
  else if (gp.buttons[13]?.pressed) dir = "down";
  if (!dir) return void (held = null);
  if (dir === held && now < next) return;
  held = dir;
  next = now + (held === dir ? 160 : 320);
  const boxes = items.map((e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const k = cur < 0 ? 0 : pickNext(boxes, cur, dir);
  if (k >= 0) {
    items[k]!.focus({ focusVisible: true } as FocusOptions);
    sounds.play("rollover");
  }
};
requestAnimationFrame(padLoop);
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && anyOpen()) topWindow()?.close();
});

// Stage (WebGPU) behind the launcher tiles; plain DOM when unsupported. The stage only reads input while no window is open.
const sup = stageSupported();
if (sup.ok) {
  const handle = await startStage({
    items: tiles.map((b) => b.closest<HTMLElement>(".l-card")!),
    assetBase: "/stage",
    materials: MATERIALS,
    active: () => !anyOpen(),
    onFocus: () => (sounds.unlock(), sounds.play("rollover")),
    onActivate: () => sounds.play("click"),
  }).catch(() => null);
  (window as unknown as { __stage?: unknown }).__stage = handle?.stats ?? null;
}
(window as unknown as { __os?: unknown }).__os = { launch, t };
tiles[0]?.focus({ preventScroll: true });
const want = location.hash.slice(1);
if (want) launch(want);
