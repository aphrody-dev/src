/**
 * Chromium Upstream MIME Table Augmentation for Bun
 * Based on Chromium net/base/mime_util.cc
 */

export const CHROMIUM_MIME_MAP: Record<string, string> = {
  // Web & Graphics
  wgsl: "text/wgsl",
  jxl: "image/jxl",
  avif: "image/avif",
  webp: "image/webp",
  apng: "image/apng",
  svg: "image/svg+xml",
  svgz: "image/svg+xml",
  webmanifest: "application/manifest+json",
  wasm: "application/wasm",
  crx: "application/x-chrome-extension",
  xhtml: "application/xhtml+xml",
  xht: "application/xhtml+xml",
  xhtm: "application/xhtml+xml",

  // Audio & Video
  opus: "audio/opus",
  mka: "audio/matroska",
  mkv: "video/matroska",
  weba: "audio/webm",
  webm: "video/webm",
  flac: "audio/flac",
  wav: "audio/wav",
  m4a: "audio/x-m4a",
  mp4: "video/mp4",
  m4v: "video/mp4",
  ogv: "video/ogg",
  ogm: "video/ogg",

  // Fonts & Text
  woff2: "font/woff2",
  woff: "font/woff",
  vtt: "text/vtt",
  csv: "text/csv",
  mjs: "text/javascript",
  js: "text/javascript",
  css: "text/css",
  html: "text/html",
  htm: "text/html",

  // Bun Specific AOT & Archive
  bunaot: "application/vnd.bun.aot",
};

export class ChromiumMimeRegistry {
  private _table: Map<string, string> = new Map();
  private _reverseTable: Map<string, string> = new Map();

  constructor() {
    for (const [ext, mime] of Object.entries(CHROMIUM_MIME_MAP)) {
      this.register(ext, mime);
    }
  }

  register(extension: string, mimeType: string) {
    const ext = extension.toLowerCase().replace(/^\./, "");
    this._table.set(ext, mimeType);
    if (!this._reverseTable.has(mimeType)) {
      this._reverseTable.set(mimeType, ext);
    }
  }

  getType(pathOrExt: string): string | undefined {
    if (!pathOrExt) return undefined;
    const clean = pathOrExt.toLowerCase();
    const lastDot = clean.lastIndexOf(".");
    const ext = lastDot !== -1 ? clean.slice(lastDot + 1) : clean;
    return this._table.get(ext);
  }

  getExtension(mimeType: string): string | undefined {
    return this._reverseTable.get(mimeType.toLowerCase());
  }

  getAll(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of this._table.entries()) {
      out[k] = v;
    }
    return out;
  }
}

export const BunChromiumMime = new ChromiumMimeRegistry();

export function installMime(target: any = globalThis): void {
  if (!target.BunChromiumMime) {
    Object.defineProperty(target, "BunChromiumMime", {
      value: BunChromiumMime,
      writable: true,
      configurable: true,
    });
  }

  // Augment Bun.file
  const bunObj = target.Bun;
  if (bunObj && typeof bunObj.file === "function") {
    const origFile = bunObj.file;
    const patchedFile = function (path: any, options: any) {
      const f = origFile.call(bunObj, path, options);
      if (typeof path === "string") {
        const lastDot = path.lastIndexOf(".");
        if (lastDot !== -1) {
          const ext = path.slice(lastDot + 1).toLowerCase();
          const augmentedMime = BunChromiumMime.getType(ext);
          if (augmentedMime && f.type === "application/octet-stream") {
            return new Proxy(f, {
              get(t, prop, receiver) {
                if (prop === "type") return augmentedMime;
                return Reflect.get(t, prop, receiver);
              },
            });
          }
        }
      }
      return f;
    };

    try {
      bunObj.file = patchedFile;
    } catch {
      // If assignment fails, fallback
    }
  }
}
