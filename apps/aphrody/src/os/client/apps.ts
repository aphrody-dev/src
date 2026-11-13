// The apps of the shell. Each opens one window; `ctx` carries the sound hook and the file hand-off.
import { t, locale } from "./i18n.ts";
import { openWindow, type Win } from "./wm.ts";
import * as lib from "./lib.ts";
const putAll = lib.putAll;

export type Launch = (app: string, file?: string) => void;
const h = (
  tag: string,
  props: Record<string, unknown> = {},
  ...kids: (Node | string)[]
) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") e.className = String(v);
    else if (k.startsWith("on"))
      e.addEventListener(k.slice(2), v as EventListener);
    else if (v !== false && v !== undefined) e.setAttribute(k, String(v));
  }
  e.append(...kids);
  return e;
};
const btn = (label: string, onclick: () => void, cls = "btn") =>
  h("button", { type: "button", class: cls, onclick }, label);
const fail = (box: HTMLElement, e: unknown) =>
  box.replaceChildren(
    h(
      "p",
      { class: "err", role: "alert" },
      t("os.error", { reason: String((e as Error)?.message ?? e) }),
    ),
  );
const loadScript = (src: string) =>
  new Promise<void>((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => res();
    s.onerror = () => rej(new Error(src));
    document.head.append(s);
  });

// Library -----------------------------------------------------------------------------------------------
export function library(launch: Launch): Win {
  const w = openWindow("library", t("os.app.library"));
  const drop = h("div", { class: "drop", tabindex: "0" }, t("os.lib.drop"));
  const ul = h("ul", { class: "list" });
  const note = h("p", { class: "note" }, t("os.lib.saved"));
  const add = btn(
    t("os.lib.add"),
    async () => (await putAll(await lib.pick()), refresh()),
    "btn pri",
  );
  const refresh = async () => {
    const items = await lib.list();
    ul.replaceChildren(
      ...(items.length
        ? items.map((e) =>
            h(
              "li",
              {},
              h("span", { class: "n" }, e.name),
              h(
                "span",
                { class: "m" },
                `${t(`os.lib.kind.${e.kind}`)} - ${lib.fmt(e.size)}`,
              ),
              e.kind === "other"
                ? ""
                : btn(t("os.lib.open"), () =>
                    launch(
                      e.kind === "rom"
                        ? "emulator"
                        : e.kind === "iso"
                          ? "linux"
                          : "flash",
                      e.name,
                    ),
                  ),
              btn(
                t("os.lib.remove"),
                async () => (await lib.remove(e.name), refresh()),
              ),
            ),
          )
        : [h("li", {}, t("os.lib.empty"))]),
    );
  };
  drop.addEventListener(
    "dragover",
    (e) => (e.preventDefault(), drop.classList.add("on")),
  );
  drop.addEventListener("dragleave", () => drop.classList.remove("on"));
  drop.addEventListener("drop", async (e) => {
    e.preventDefault();
    drop.classList.remove("on");
    await putAll([...(e.dataTransfer?.files ?? [])]);
    refresh();
  });
  w.body.append(h("div", { class: "row" }, add), drop, ul, note);
  refresh().catch((e) => fail(w.body, e));
  return w;
}

// Store: built-in apps with their licenses, then the open catalog (/os/catalog.json, no Google Play) ------
const BUILTIN: { name: string; license: string; src: string }[] = [
  {
    name: "v86 (x86 VM)",
    license: "BSD-2-Clause",
    src: "https://github.com/copy/v86",
  },
  {
    name: "SeaBIOS, VGABIOS",
    license: "LGPL-3.0",
    src: "https://github.com/copy/v86/tree/master/bios",
  },
  {
    name: "Ruffle (Flash)",
    license: "MIT OR Apache-2.0",
    src: "https://github.com/ruffle-rs/ruffle",
  },
  {
    name: "EmulatorJS (run time)",
    license: "GPL-3.0",
    src: "https://github.com/EmulatorJS/EmulatorJS",
  },
  { name: "Steam (official store and client)", license: "Valve", src: "https://store.steampowered.com" },
  { name: "Epic Games Store (official)", license: "Epic Games", src: "https://store.epicgames.com" },
  {
    name: "Aphrody game (Bevy)",
    license: "MIT OR Apache-2.0",
    src: "https://github.com/aphrody-dev/src",
  },
];
export function store(): Win {
  const w = openWindow("store", t("os.app.store"));
  const q = h("input", {
    type: "search",
    "aria-label": t("os.store.search"),
    placeholder: t("os.store.search"),
  }) as HTMLInputElement;
  const res = h("ul", { class: "list" });
  const built = h(
    "ul",
    { class: "list" },
    ...BUILTIN.map((b) =>
      h(
        "li",
        {},
        h("span", { class: "n" }, b.name),
        h("span", { class: "m" }, `${t("os.store.license")}: ${b.license}`),
        h(
          "a",
          { class: "btn", href: b.src, target: "_blank", rel: "noopener" },
          t("os.store.open"),
        ),
      ),
    ),
  );
  let timer = 0;
  const run = async () => {
    const term = q.value.trim();
    if (!term) return res.replaceChildren();
    try {
      const r = (await (
        await fetch(`/os/catalog.json?q=${encodeURIComponent(term)}`)
      ).json()) as {
        packages: {
          name: string;
          description: string;
          ecosystem: string;
          installCmd: string;
        }[];
      };
      res.replaceChildren(
        ...(r.packages.length
          ? r.packages.map((p) =>
              h(
                "li",
                {},
                h("span", { class: "n" }, `${p.name} - ${p.description}`),
                h("span", { class: "m" }, p.ecosystem),
                h(
                  "code",
                  { class: "m", title: t("os.store.cmd") },
                  p.installCmd,
                ),
              ),
            )
          : [h("li", {}, t("os.store.none"))]),
      );
    } catch (e) {
      fail(res, e);
    }
  };
  q.addEventListener(
    "input",
    () => (clearTimeout(timer), (timer = window.setTimeout(run, 250))),
  );
  w.body.append(
    h("h3", {}, t("os.store.included")),
    built,
    h("h3", {}, t("os.store.catalog")),
    h("div", { class: "row" }, q),
    res,
  );
  return w;
}

// Settings ------------------------------------------------------------------------------------------------
export function settings(o: {
  sound: { enabled: boolean };
  walls: string[];
  setWall: (w: string) => void;
  wall: () => string;
}): Win {
  const w = openWindow("settings", t("os.app.settings"), { w: 640 });
  const langs: [string, string][] = [
    ["en", "English"],
    ["fr", "Français"],
    ["zh-CN", "简体中文"],
    ["ja", "日本語"],
    ["es", "Español"],
  ];
  const sel = h(
    "select",
    { "aria-label": t("os.set.language") },
    ...langs.map(([c, n]) =>
      h("option", { value: c, selected: c === locale }, n),
    ),
  ) as HTMLSelectElement;
  sel.onchange = () =>
    (location.href = sel.value === "en" ? "/os" : `/os/${sel.value}`);
  const snd = btn("", () => {
    o.sound.enabled = !o.sound.enabled;
    localStorage.setItem("os.sound", o.sound.enabled ? "1" : "0");
    snd.textContent = t(o.sound.enabled ? "os.set.on" : "os.set.off");
    snd.setAttribute("aria-pressed", String(o.sound.enabled));
  });
  snd.textContent = t(o.sound.enabled ? "os.set.on" : "os.set.off");
  snd.setAttribute("aria-pressed", String(o.sound.enabled));
  const walls = h("div", { class: "walls" });
  const paint = () =>
    walls
      .querySelectorAll("button")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.w === o.wall())),
      );
  for (const n of o.walls) {
    const b = h(
      "button",
      {
        type: "button",
        "data-w": n,
        "aria-label": n,
        onclick: () => (o.setWall(n), paint()),
      },
      h("img", { src: `/os/wall/${n}.webp`, alt: "", loading: "lazy" }),
    );
    walls.append(b);
  }
  paint();
  const input = h(
    "p",
    { class: "note" },
    `${t("os.set.input")}: ${document.documentElement.dataset.input ?? "ptr"}`,
  );
  w.body.append(
    h("div", { class: "row" }, h("label", {}, `${t("os.set.language")} `), sel),
    h("div", { class: "row" }, h("span", {}, `${t("os.set.sound")}: `), snd),
    h("h3", {}, t("os.set.wallpaper")),
    walls,
    input,
  );
  return w;
}

// Game: the existing /play page in a same-origin frame (its own launcher, WebGPU, gamepad) ----------------
export function game(): Win {
  const w = openWindow("game", t("os.app.game"), {
    flush: true,
    w: 1100,
    h: 700,
  });
  if (w.body.childElementCount) return w;
  w.body.append(
    h("iframe", {
      src: "/play",
      title: t("os.app.game"),
      allow: "gamepad; fullscreen; autoplay",
    }),
  );
  withGamescope(w, w.body);
  return w;
}

// Linux: v86 (x86 emulator in WebAssembly, BSD-2-Clause) booting the Alpine ISO of the webos Worker -------
interface V86 {
  destroy(): void;
}
export function linux(file?: string): Win {
  const w = openWindow("linux", t("os.app.linux"), {
    flush: false,
    w: 1000,
    h: 700,
  });
  if (w.body.childElementCount) return w;
  const screen = h(
    "div",
    { class: "vmscreen" },
    h("div", { style: "white-space:pre;font:14px monospace;line-height:14px" }),
    h("canvas"),
  );
  const status = h("p", { class: "note", role: "status" });
  let vm: V86 | null = null;
  const boot = async (cdrom: Record<string, unknown>) => {
    try {
      status.textContent = t("os.vm.running");
      await loadScript("/os/vendor/v86/libv86.js");
      const V = (window as unknown as { V86: new (o: unknown) => V86 }).V86;
      vm?.destroy();
      vm = new V({
        wasm_path: "/os/vendor/v86/v86.wasm",
        memory_size: 256 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        screen_container: screen,
        bios: { url: "/os/vendor/v86/seabios.bin" },
        vga_bios: { url: "/os/vendor/v86/vgabios.bin" },
        cdrom,
        boot_order: 0x123,
        autostart: true,
      });
      screen.querySelector("canvas")?.focus();
    } catch (e) {
      fail(status, e);
    }
  };
  const fromLib = async (name: string) =>
    boot({ buffer: await (await lib.get(name)).arrayBuffer() });
  const stock = btn(
    t("os.vm.start"),
    async () => {
      const head = await fetch("/os/vm/alpine.iso", { method: "HEAD" }).catch(
        () => null,
      );
      if (!head?.ok) return void (status.textContent = t("os.vm.missing"));
      await boot({
        url: "/os/vm/alpine.iso",
        async: true,
        size: Number(head.headers.get("content-length")),
      });
    },
    "btn pri",
  );
  const choose = btn(t("os.vm.pick"), async () => {
    const f = (await lib.pick(".iso,.img"))[0];
    if (f) await boot({ buffer: await f.arrayBuffer() });
  });
  const stop = btn(
    t("os.vm.stop"),
    () => (vm?.destroy(), (vm = null), (status.textContent = "")),
  );
  w.onClose = () => vm?.destroy();
  w.body.append(
    h(
      "div",
      { class: "row" },
      stock,
      choose,
      stop,
      h("span", { class: "m" }, t("os.vm.image")),
    ),
    status,
    h("div", { style: "height:min(480px,60vh);display:flex" }, screen),
  );
  (screen as HTMLElement).style.flex = "1";
  withGamescope(w, screen.parentElement!);
  if (file) void fromLib(file);
  return w;
}

// Flash: Ruffle (MIT OR Apache-2.0), only for files the user supplies ------------------------------------
export function flash(file?: string): Win {
  const w = openWindow("flash", t("os.app.flash"), { w: 900, h: 660 });
  if (w.body.childElementCount) return w;
  const stage = h("div", { style: "height:min(520px,62vh);background:#000" });
  const play = async (f: File) => {
    try {
      const win = window as unknown as {
        RufflePlayer?: {
          newest(): {
            createPlayer(): HTMLElement & { load(o: unknown): Promise<void> };
          };
          config?: unknown;
        };
      };
      win.RufflePlayer = {
        ...(win.RufflePlayer as object),
        config: { publicPath: "/os/vendor/ruffle/", autoplay: "auto" },
      } as never;
      if (!document.querySelector("script[data-ruffle]")) {
        await loadScript("/os/vendor/ruffle/ruffle.js");
        document
          .querySelector("script[src$='ruffle.js']")
          ?.setAttribute("data-ruffle", "1");
      }
      const p = win.RufflePlayer!.newest().createPlayer();
      p.style.cssText = "width:100%;height:100%";
      stage.replaceChildren(p);
      await p.load({
        data: new Uint8Array(await f.arrayBuffer()),
        allowScriptAccess: false,
      });
    } catch (e) {
      fail(stage, e);
    }
  };
  const choose = btn(
    t("os.flash.pick"),
    async () => {
      const f = (await lib.pick(".swf"))[0];
      if (f) play(f);
    },
    "btn pri",
  );
  w.body.append(
    h("div", { class: "row" }, choose),
    h("p", { class: "note" }, t("os.flash.note")),
    stage,
  );
  withGamescope(w, stage);
  if (file)
    lib
      .get(file)
      .then(play)
      .catch((e) => fail(stage, e));
  return w;
}

// Emulator: EmulatorJS (GPL-3.0) fetched from its CDN at run time after an explicit click; no core is bundled -
export const EMU_PATH = "https://cdn.emulatorjs.org/stable/data/";
export function emulator(file?: string): Win {
  const w = openWindow("emulator", t("os.app.emulator"), { w: 960, h: 680 });
  if (w.body.childElementCount) return w;
  const stage = h("div", {
    id: "emu",
    style: "height:min(520px,62vh);background:#000;position:relative",
  });
  const run = async (f: File) => {
    const core = lib.classify(f.name).core ?? "nes";
    try {
      const g = window as unknown as Record<string, unknown>;
      Object.assign(g, {
        EJS_player: "#emu",
        EJS_core: core,
        EJS_gameUrl: URL.createObjectURL(f),
        EJS_gameName: f.name,
        EJS_pathtodata: EMU_PATH,
        EJS_startOnLoaded: true,
        EJS_language: locale,
      });
      await loadScript(`${EMU_PATH}loader.js`);
    } catch {
      stage.replaceChildren(
        h("p", { class: "err", role: "alert" }, t("os.emu.fail")),
      );
    }
  };
  let pending: File | undefined;
  const choose = btn(t("os.emu.pick"), async () => {
    pending = (await lib.pick())[0];
    if (pending) go.focus();
  });
  const go = btn(t("os.emu.load"), () => pending && run(pending), "btn pri");
  w.body.append(
    h("p", { class: "note" }, t("os.emu.consent")),
    h("div", { class: "row" }, choose, go),
    stage,
  );
  withGamescope(w, stage);
  if (file) lib.get(file).then((f) => ((pending = f), go.focus()));
  return w;
}

// Console: port of the console.aphrody.com dashboard of the aphrody-webos Worker (static snapshot data) -----
export function consoleApp(): Win {
  const w = openWindow("console", t("os.app.console"), { w: 760 });
  if (w.body.childElementCount) return w;
  const parts = ["status", "fleet", "registries", "arena", "orgs"];
  w.body.append(h("p", { class: "note" }, t("os.console.snapshot")));
  Promise.all(
    parts.map(
      async (p) =>
        [p, await (await fetch(`/os/api/console/${p}`)).json()] as const,
    ),
  )
    .then((all) => {
      for (const [p, data] of all) {
        w.body.append(
          h("h3", {}, p === "orgs" ? "Orgs" : t(`os.console.${p}`)),
          h(
            "pre",
            { class: "note", style: "white-space:pre-wrap;overflow:auto" },
            JSON.stringify(data, null, 1),
          ),
        );
      }
    })
    .catch((e) => fail(w.body, e));
  return w;
}

// Gamescope panel: a header button opening the controls of the display pipeline for the window's video surface.
import { startGamescope, type GsHandle, type GsOptions } from "./gamescope.ts";
const GS_KEY = "os.gs";
export function withGamescope(w: Win, host: HTMLElement): void {
  const saved = JSON.parse(
    localStorage.getItem(GS_KEY) ?? "null",
  ) as Partial<GsOptions> | null;
  const opts: GsOptions = {
    filter: "off",
    scaling: "fit",
    sharpness: 0.2,
    cap: 0,
    ...saved,
  };
  opts.filter = "off";
  let handle: GsHandle | null = null;
  const sel = <T extends string>(
    label: string,
    key: "filter" | "scaling",
    values: T[],
    pre: string,
  ) => {
    const s = h(
      "select",
      { "aria-label": label },
      ...values.map((v) =>
        h("option", { value: v, selected: opts[key] === v }, t(`${pre}${v}`)),
      ),
    ) as HTMLSelectElement;
    s.onchange = async () => {
      (opts[key] as string) = s.value;
      localStorage.setItem(GS_KEY, JSON.stringify(opts));
      if (key === "filter" && s.value !== "off" && !handle) {
        handle = await startGamescope(host, opts);
        if (!handle) stats.textContent = t("os.nogpu");
      }
    };
    return h("label", { class: "gs-f" }, `${label} `, s);
  };
  const sharp = h("input", {
    type: "range",
    min: "0",
    max: "1",
    step: "0.05",
    value: String(opts.sharpness),
    "aria-label": t("os.gs.sharp"),
  }) as HTMLInputElement;
  sharp.oninput = () => (opts.sharpness = Number(sharp.value));
  const cap = h(
    "select",
    { "aria-label": t("os.gs.cap") },
    ...[0, 30, 60, 120].map((c) =>
      h("option", { value: String(c) }, c ? `${c} fps` : t("os.gs.nocap")),
    ),
  ) as HTMLSelectElement;
  cap.onchange = () => (opts.cap = Number(cap.value));
  const stats = h("span", { class: "m", role: "status" });
  const panel = h(
    "div",
    { class: "row gs", hidden: "" },
    sel(
      t("os.gs.filter"),
      "filter",
      ["off", "linear", "nearest", "fsr"],
      "os.gs.",
    ),
    sel(
      t("os.gs.scaling"),
      "scaling",
      ["fit", "integer", "stretch", "fill", "center"],
      "os.gs.",
    ),
    h("label", { class: "gs-f" }, `${t("os.gs.sharp")} `, sharp),
    h("label", { class: "gs-f" }, `${t("os.gs.cap")} `, cap),
    stats,
  );
  const b = h(
    "button",
    { type: "button", "aria-expanded": "false" },
    t("os.gs.title"),
  );
  b.onclick = () => {
    panel.hidden = !panel.hidden;
    b.setAttribute("aria-expanded", String(!panel.hidden));
  };
  const head = w.el.querySelector("header")!;
  head.insertBefore(b, head.querySelector("button"));
  w.el.querySelector("header")!.after(panel);
  const tick = setInterval(() => {
    if (!handle) return;
    stats.textContent = handle.stats.frames
      ? t("os.gs.stats", {
          src: handle.stats.src,
          dst: handle.stats.dst,
          fps: handle.stats.fps,
        })
      : t("os.gs.nosrc");
  }, 500);
  const prev = w.onClose;
  w.onClose = () => (prev?.(), clearInterval(tick), handle?.destroy());
  (w as unknown as { gs: unknown }).gs = {
    opts,
    get handle() {
      return handle;
    },
  };
}
