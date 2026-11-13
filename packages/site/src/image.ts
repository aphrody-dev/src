import { WIDTHS } from "../../deploy/src/runtime.ts";
import { type Html, html } from "./html.ts";

export { WIDTHS };

export interface ImgProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  quality?: number;
  /** LCP image: eager + fetchpriority=high. */
  priority?: boolean;
  class?: string;
}

const url = (src: string, w: number, q: number) =>
  `/_aphrody/image?url=${encodeURIComponent(src)}&w=${w}&q=${q}`;

/** Responsive image through /_aphrody/image; width and height are required (no layout shift). */
export function img(p: ImgProps): Html {
  if (!(p.width > 0 && p.height > 0))
    throw new Error(`img(${p.src}): width and height are required`);
  const q = p.quality ?? 75;
  if (p.src.endsWith(".svg"))
    return html`<img
      src="${p.src}"
      alt="${p.alt}"
      width="${p.width}"
      height="${p.height}"
      ${p.class ? html` class="${p.class}"` : ""}${p.priority ? html` fetchpriority="high"` : html` loading="lazy"`}
      decoding="async"
    />`;
  const ws = WIDTHS.filter((w) => w <= p.width * 2);
  const list = ws.length ? ws : [WIDTHS[0]!];
  const fallback = list.find((w) => w >= p.width) ?? list.at(-1)!;
  return html`<img
    src="${url(p.src, fallback, q)}"
    srcset="${list.map((w) => `${url(p.src, w, q)} ${w}w`).join(", ")}"
    sizes="${p.sizes ?? `(max-width: ${p.width}px) 100vw, ${p.width}px`}"
    alt="${p.alt}"
    width="${p.width}"
    height="${p.height}"
    ${p.class ? html` class="${p.class}"` : ""}${p.priority ? html` fetchpriority="high"` : html` loading="lazy"`}
    decoding="async"
  />`;
}
