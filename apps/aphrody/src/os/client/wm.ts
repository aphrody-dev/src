// Window manager: DOM windows over the stage. Drag by the title bar (pointer), maximize, close, focus order.
import { t } from "./i18n.ts";

export interface Win {
  el: HTMLElement;
  body: HTMLElement;
  close(): void;
  onClose?: () => void;
}
const svg = (d: string) =>
  `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="${d}"/></svg>`;
const ICON_MAX = svg("M3 3h10v10H3z");
const ICON_RESTORE = svg("M5 5h8v8H5zM3 10V3h7");
const ICON_CLOSE = svg("M3 3l10 10M13 3L3 13");
const layer = () => document.getElementById("windows")!;
let z = 1;
const open = new Map<string, Win>();

export function openWindow(
  id: string,
  title: string,
  o: { flush?: boolean; w?: number; h?: number } = {},
): Win {
  const prev = open.get(id);
  if (prev) {
    prev.el.style.zIndex = String(++z);
    prev.el.querySelector<HTMLElement>("button")?.focus();
    return prev;
  }
  const el = document.createElement("section");
  el.className = "win";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", title);
  const w = Math.min(o.w ?? 920, innerWidth - 24);
  const h = Math.min(o.h ?? 620, innerHeight - 24);
  Object.assign(el.style, {
    width: `${w}px`,
    height: `${h}px`,
    left: `${Math.max(12, (innerWidth - w) / 2 + open.size * 28)}px`,
    top: `${Math.max(12, (innerHeight - h) / 2 + open.size * 28)}px`,
    zIndex: String(++z),
  });
  if (innerWidth < 720) el.classList.add("max");
  el.innerHTML = `<header><h2></h2><button type="button" data-a="max"></button><button type="button" data-a="close"></button></header><div class="body${o.flush ? " flush" : ""}"></div>`;
  el.querySelector("h2")!.textContent = title;
  const bMax = el.querySelector<HTMLButtonElement>('[data-a="max"]')!;
  const bClose = el.querySelector<HTMLButtonElement>('[data-a="close"]')!;
  const label = () => {
    bMax.innerHTML = el.classList.contains("max") ? ICON_RESTORE : ICON_MAX;
    bMax.setAttribute(
      "aria-label",
      t(el.classList.contains("max") ? "os.window.restore" : "os.window.max"),
    );
  };
  bClose.innerHTML = ICON_CLOSE;
  bClose.setAttribute("aria-label", t("os.window.close"));
  label();
  const win: Win = { el, body: el.querySelector(".body")!, close };
  function close() {
    win.onClose?.();
    el.remove();
    open.delete(id);
    document
      .querySelector<HTMLElement>(`[data-app="${id.split(":")[0]}"]`)
      ?.focus();
  }
  bClose.onclick = close;
  bMax.onclick = () => {
    el.classList.toggle("max");
    label();
  };
  el.addEventListener(
    "pointerdown",
    () => (el.style.zIndex = String(++z)),
    true,
  );
  const head = el.querySelector("header")!;
  head.addEventListener("pointerdown", (e) => {
    if (
      (e.target as HTMLElement).closest("button") ||
      el.classList.contains("max")
    )
      return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - r.left;
    const dy = e.clientY - r.top;
    head.setPointerCapture(e.pointerId);
    const mv = (m: PointerEvent) => {
      el.style.left = `${Math.min(Math.max(0, m.clientX - dx), innerWidth - 80)}px`;
      el.style.top = `${Math.min(Math.max(0, m.clientY - dy), innerHeight - 40)}px`;
    };
    const up = () => {
      head.removeEventListener("pointermove", mv);
      head.removeEventListener("pointerup", up);
    };
    head.addEventListener("pointermove", mv);
    head.addEventListener("pointerup", up);
  });
  layer().append(el);
  open.set(id, win);
  return win;
}
export const topWindow = (): Win | undefined =>
  [...open.values()].sort(
    (a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex),
  )[0];
export const anyOpen = () => open.size > 0;
