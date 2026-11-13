// Static build of a site: app/ -> dist/ (HTML, /_static/*-[hash].*, _headers, _redirects, site.json, robots, sitemap, llms).
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { brotliCompressSync, constants as zlib } from "node:zlib";
import type { BunPlugin } from "bun";
import {
  componentsBundle,
  minifyCss,
  tokensCss,
} from "../../design/src/web.ts";
import { validateWeb } from "../../wck/src/index.ts";
import { type ResolvedSite, localizedPath } from "./config.ts";
import { BRAND_GEN, brandFonts, fontFace } from "./fonts.ts";
import { headersFile, redirectsFile } from "./headers.ts";
import { type Html, html, isHtml, raw } from "./html.ts";
import {
  type Metadata,
  type PublicPage,
  headTags,
  llmsTxt,
  robotsTxt,
  sitemapXml,
} from "./metadata.ts";
import {
  type LayoutModule,
  type PageContext,
  type PageModule,
  type Params,
  fillPattern,
  htmlFile,
  layoutsFor,
  scanApp,
} from "./routes.ts";

export interface BuildOptions {
  root: string;
  site: ResolvedSite;
  outDir?: string;
  plugins?: BunPlugin[];
  /** Extra <head> markup on every page (after metadata, before the stylesheet). */
  head?: Html;
  /** Skip wck (unit tests on synthetic sites). */
  skipWck?: boolean;
  gen?: string;
}

export interface BuildResult {
  outDir: string;
  pages: { path: string; locale: string; file: string; public: boolean }[];
  assets: Record<string, string>;
  wck?: { allPassed: boolean; score: number };
  gz: Record<string, number>;
}

const hash8 = (data: string | Uint8Array) =>
  Bun.hash.wyhash(data).toString(16).padStart(16, "0").slice(0, 8);

function emitStatic(
  outDir: string,
  name: string,
  ext: string,
  data: string | Uint8Array,
): string {
  const rel = `_static/${name}-${hash8(data)}${ext}`;
  mkdirSync(join(outDir, "_static"), { recursive: true });
  writeFileSync(join(outDir, rel), data);
  return `/${rel}`;
}

const str = (v: Html | string) => (isHtml(v) ? v.value : v);

export async function buildSite(o: BuildOptions): Promise<BuildResult> {
  const { root, site } = o;
  const outDir = o.outDir ?? join(root, "dist");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const assets: Record<string, string> = {};

  // Fonts: self-hosted brand fonts, hashed, @font-face + preload (no third-party host).
  const fonts = brandFonts(o.gen ?? BRAND_GEN);
  let fontCss = "";
  const preloads: string[] = [];
  for (const id of o.site.fonts ?? []) {
    const f = fonts.find((x) => x.id === id);
    if (!f) throw new Error(`font ${id} not in fonts.json`);
    const href = emitStatic(
      outDir,
      f.id,
      ".woff2",
      new Uint8Array(readFileSync(join(o.gen ?? BRAND_GEN, f.file))),
    );
    assets[`font:${id}`] = href;
    fontCss += fontFace(f, href);
    if (site.preloadFonts?.includes(id)) preloads.push(href);
  }

  // One stylesheet: fonts + tokens.css + app CSS.
  const appCss = (site.styles ?? [])
    .map((s) => readFileSync(join(root, s), "utf8"))
    .join("\n");
  const cssHref = emitStatic(
    outDir,
    "site",
    ".css",
    minifyCss(fontCss + tokensCss() + appCss),
  );
  assets["css"] = cssHref;

  // Client scripts.
  const scripts: string[] = [];
  if (site.scripts?.length) {
    const r = await Bun.build({
      entrypoints: site.scripts.map((s) => join(root, s)),
      outdir: outDir,
      naming: "_static/[name]-[hash].[ext]",
      publicPath: "/",
      target: "browser",
      format: "esm",
      minify: true,
      splitting: false,
      plugins: o.plugins ?? [],
    });
    if (!r.success)
      throw new Error(`client build:\n${r.logs.map(String).join("\n")}`);
    for (const out of r.outputs)
      if (out.kind === "entry-point") {
        const href = `/${relative(outDir, out.path).replace(/\\/g, "/")}`;
        scripts.push(href);
        assets[`script:${basename(href).replace(/-[\w]+\.js$/, "")}`] = href;
      }
  }
  if (site.elements?.length) {
    const href = emitStatic(
      outDir,
      "md",
      ".js",
      await componentsBundle(site.elements),
    );
    scripts.push(href);
    assets["elements"] = href;
  }

  for (const [to, from] of Object.entries(site.copy ?? {})) {
    const dst = join(outDir, to);
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(join(root, from), dst);
  }

  const assetHead = html`${preloads.map((h) => html`<link rel="preload" href="${h}" as="font" type="font/woff2" crossorigin />`)}<link
      rel="stylesheet"
      href="${cssHref}"
    />${scripts.map((s) => html`<script type="module" src="${s}"></script>`)}`;

  // Pages.
  const appDir = join(root, "app");
  const routes = scanApp(appDir);
  const pages: BuildResult["pages"] = [];
  const publicPages: PublicPage[] = [];
  const render = async (
    pattern: string,
    mod: PageModule,
    ctx: PageContext,
  ): Promise<string> => {
    const meta: Metadata =
      typeof mod.metadata === "function"
        ? await mod.metadata(ctx)
        : (mod.metadata ?? { title: site.name });
    const head = html`${headTags(site, ctx.path, ctx.locale, meta)}${o.head ?? ""}${assetHead}`;
    let body: Html = raw(str(await mod.default(ctx)));
    const chain = layoutsFor(routes, pattern);
    for (const l of chain.reverse()) {
      const lm = (await import(l.file)) as LayoutModule;
      body = raw(str(await lm.default({ ...ctx, children: body, head })));
    }
    const doc = body.value.trimStart();
    if (/^<!doctype/i.test(doc)) return doc;
    return html`<!doctype html>
      <html lang="${ctx.locale}">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          ${head}
        </head>
        <body>
          ${body}
        </body>
      </html>`.value;
  };

  for (const r of routes.filter((x) => x.kind === "page")) {
    const mod = (await import(r.file)) as PageModule;
    let list: Params[] = [{}];
    if (r.params.length) {
      if (!mod.generateStaticParams)
        throw new Error(
          `${r.pattern}: dynamic page without generateStaticParams`,
        );
      list = await mod.generateStaticParams();
    }
    for (const params of list) {
      const path = fillPattern(r.pattern, params);
      for (const locale of site.locales) {
        const ctx: PageContext = { site, locale, path, params };
        const lp = localizedPath(site, locale, path);
        const file = htmlFile(lp);
        mkdirSync(dirname(join(outDir, file)), { recursive: true });
        writeFileSync(join(outDir, file), await render(r.pattern, mod, ctx));
        const meta =
          typeof mod.metadata === "function"
            ? await mod.metadata(ctx)
            : mod.metadata;
        const pub = meta?.public !== false;
        pages.push({ path: lp, locale, file, public: pub });
        if (pub)
          publicPages.push({
            path: lp,
            locale,
            title: meta?.title ?? site.name,
            description: meta?.description,
          });
      }
    }
  }
  const nf = routes.find((x) => x.kind === "not-found" && x.pattern === "/");
  if (nf) {
    const mod = (await import(nf.file)) as PageModule;
    const m =
      typeof mod.metadata === "object" ? mod.metadata : { title: "404" };
    writeFileSync(
      join(outDir, "404.html"),
      await render(
        "/",
        { ...mod, metadata: { ...m, public: false } },
        { site, locale: site.defaultLocale, path: "/404", params: {} },
      ),
    );
  }

  writeFileSync(join(outDir, "robots.txt"), robotsTxt(site));
  writeFileSync(join(outDir, "sitemap.xml"), sitemapXml(site, publicPages));
  writeFileSync(join(outDir, "llms.txt"), llmsTxt(site, publicPages));
  const docs = pages.flatMap((p) =>
    p.path === "/" ? ["/", "/index.html"] : [p.path, `${p.path}/`],
  );
  if (nf) docs.push("/404.html");
  writeFileSync(join(outDir, "_headers"), headersFile(site, docs));
  writeFileSync(join(outDir, "_redirects"), redirectsFile(site));

  // Budgets (gzip, measured before precompression).
  const gz: Record<string, number> = {};
  const gzOf = (rel: string) =>
    (gz[rel] ??= Bun.gzipSync(
      new Uint8Array(readFileSync(join(outDir, rel))),
    ).byteLength);
  const cssGz = gzOf(cssHref.slice(1));
  const b = site.budgets ?? {};
  const fails: string[] = [];
  for (const p of pages) {
    const total = gzOf(p.file) + cssGz;
    if (b.criticalGz && total > b.criticalGz)
      fails.push(`${p.file}+css ${total}B > ${b.criticalGz}B`);
  }
  for (const s of scripts) {
    const n = gzOf(s.slice(1));
    if (b.scriptGz && n > b.scriptGz) fails.push(`${s} ${n}B > ${b.scriptGz}B`);
  }

  writeFileSync(
    join(outDir, "site.json"),
    `${JSON.stringify({ name: site.name, domains: site.domains, locales: site.locales, pages, assets, routes: routes.filter((x) => x.kind === "route").map((x) => x.pattern) }, null, 2)}\n`,
  );

  let wck: BuildResult["wck"];
  if (!o.skipWck) {
    const rep = validateWeb(outDir, { quiet: true });
    wck = { allPassed: rep.allPassed, score: rep.overallScore };
    const errs = Object.entries(rep.specs).flatMap(([id, s]) =>
      ((s as { errors?: string[] }).errors ?? []).map((e) => `wck ${id}: ${e}`),
    );
    fails.push(...errs);
    if (b.wckScore && rep.overallScore < b.wckScore)
      fails.push(`wck score ${rep.overallScore} < ${b.wckScore}`);
  }
  if (fails.length) throw new Error(`budgets:\n${fails.join("\n")}`);

  if (site.target === "bun") precompress(outDir);
  return { outDir, pages, assets, wck, gz };
}

const COMPRESSIBLE = new Set([
  ".html",
  ".css",
  ".js",
  ".json",
  ".svg",
  ".txt",
  ".xml",
]);

/** .br and .gz next to each compressible file (bun target only; the edge compresses itself). */
export function precompress(outDir: string): void {
  for (const rel of new Bun.Glob("**/*").scanSync({ cwd: outDir })) {
    if (!COMPRESSIBLE.has(extname(rel)) || basename(rel).startsWith("_"))
      continue;
    const f = join(outDir, rel);
    const buf = new Uint8Array(readFileSync(f));
    writeFileSync(`${f}.gz`, Bun.gzipSync(buf, { level: 9 }));
    writeFileSync(
      `${f}.br`,
      brotliCompressSync(buf, { params: { [zlib.BROTLI_PARAM_QUALITY]: 11 } }),
    );
  }
}
