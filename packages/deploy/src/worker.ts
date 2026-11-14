// aphrody.app platform Worker.
//   aphrody.app /, /labs              public pages (projects, labs)
//   aphrody.app /dashboard[...]        Cloudflare Access + JWT check: projects, deployments, logs, promote/rollback
//   aphrody.app /api/...               JSON API; public reads are reduced (name, domains, sha7, state, date),
//                                      details, writes, logs and insights need the deploy token or Access
//   <project>-<sha>.aphrody.app        preview of one deployment
//   <domain of a project>              production of that project (zone aphrody.app)
//   any other *.aphrody.app host       passed through untouched to its origin (tunnel, R2, other Workers)
import { bearerOk, verifyAccess } from "./access.ts";
import {
  forgetConfig,
  insightsSummary,
  readConfig,
  runtime,
  type DONamespace,
  type ImagesBinding,
} from "./runtime.ts";
import {
  dashboard,
  landing,
  platform,
  LOCALES,
  localePath,
  pagePath,
  logPage,
  tr,
  projectPage,
  type ProjectView,
} from "./pages.ts";
import { HERO_JS, THEME_JS } from "./ui.ts";
import {
  forgetState,
  readState,
  serveDeployment,
  serveProduction,
  type R2Like,
} from "./serve.ts";
import {
  NAME,
  SHA,
  emptyState,
  keys,
  parsePreviewHost,
  previewUrl,
  resolveShort,
  rollbackTarget,
  type Deployment,
  type ProjectState,
  type Registry,
} from "./state.ts";

export interface Env {
  BUCKET: R2Like;
  DEPLOY_TOKEN?: string;
  ACCESS_TEAM?: string; // aphrody-labs.cloudflareaccess.com
  ACCESS_AUD?: string; // AUD tag of the Access application on aphrody.app/dashboard
  ZONE?: string;
  INSIGHTS?: DONamespace; // Durable Object Insights (analytics + speed insights)
  IMAGES?: ImagesBinding; // Images binding (image optimization)
}

export { Insights } from "./runtime.ts";
const PLATFORM = "aphrody-app";
const LLMS = `# aphrody.app

> La plateforme de mise en ligne d'Aphrody : une adresse de prévisualisation par version, mise en ligne et retour arrière en quelques secondes, statistiques de visite sans cookie, vitesse mesurée chez les visiteurs, images allégées, réglages modifiables sans republier.

## Pages

- [Accueil](https://aphrody.app/): présentation de la plateforme et liste des sites publiés

## Groupe

- [Aphrody](https://aphrody.com/): le groupe et ses produits
- Contact : contact@aphrody.com
`; // analytics project of the platform pages themselves

const APEX = new Set(["aphrody.app", "www.aphrody.app"]);
const MDJS = "deploys/_platform/md.js";
// Names of the zone that had no backend (tunnel catch-all to prd:3010, nothing listening): served by the platform.
const ALIASES: Record<string, (u: URL) => string | "api"> = {
  "api.aphrody.app": () => "api",
  "deploy.aphrody.app": () => "https://aphrody.app/dashboard",
  "git.aphrody.app": (u) =>
    `https://github.com/aphrody-labs/src${u.pathname === "/" ? "" : u.pathname}`,
  "source.aphrody.app": (u) =>
    `https://github.com/aphrody-labs/src${u.pathname === "/" ? "" : u.pathname}`,
  "auth.aphrody.app": (u) =>
    `https://auth.aphrody.com${u.pathname === "/" ? "" : u.pathname}${u.search}`,
  "apt.aphrody.app": (u) =>
    `https://store.aphrody.com${u.pathname === "/" ? "" : u.pathname}${u.search}`,
  "play.aphrody.app": () => "https://aphrody.com/wayland/",
  "craft.aphrody.app": () => "https://aphrody.com/",
  "shell.aphrody.app": () => "https://aphrody.com/",
  "bun.aphrody.app": () => "https://aphrody.com/",
  "wildcard-probe.aphrody.app": () => "https://aphrody.app/",
};
const STUDIO_APP_HOSTS: Record<string, string> = {
  "filmcraft.aphrody.app": "film",
  "app-video.aphrody.app": "film",
  "artcraft.aphrody.app": "art",
  "app-generation.aphrody.app": "art",
  "photocraft.aphrody.app": "photo",
  "app-images.aphrody.app": "photo",
  "vectorcraft.aphrody.app": "vector",
  "app-vectors.aphrody.app": "vector",
  "effectcraft.aphrody.app": "effect",
  "app-compositing.aphrody.app": "effect",
  "lightcraft.aphrody.app": "light",
  "app-photo-processing.aphrody.app": "light",
  "pdfcraft.aphrody.app": "pdf",
  "app-pdf.aphrody.app": "pdf",
  "wordcraft.aphrody.app": "word",
  "app-documents.aphrody.app": "word",
  "soundcraft.aphrody.app": "sound",
  "app-audio.aphrody.app": "sound",
  "designcraft.aphrody.app": "design",
  "app-layout.aphrody.app": "design",
  "cadcraft.aphrody.app": "cad",
  "app-cad.aphrody.app": "cad",
  "deckcraft.aphrody.app": "deck",
  "app-slides.aphrody.app": "deck",
  "gridcraft.aphrody.app": "grid",
  "app-tables.aphrody.app": "grid",
  "figcraft.aphrody.app": "fig",
  "app-interface-layouts.aphrody.app": "fig",
};
const JSONH = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};
const HTMLH = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "content-security-policy":
    "default-src 'none'; script-src 'self'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://aphrody.com; connect-src 'self'; manifest-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "x-content-type-options": "nosniff",
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "referrer-policy": "strict-origin-when-cross-origin",
};

const json = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), { status, headers: JSONH });
const html = (s: string, status = 200) =>
  new Response(s, { status, headers: HTMLH });

const FALLBACK: Registry = {
  generatedAt: "",
  commit: "",
  projects: [],
  inventory: [],
  labs: [],
  css: "",
  mark: "",
};
let regCache: { at: number; r: Registry } | null = null;

/** Public form of a commit id: 7 hex digits, enough to tell deployments apart. */
const short = (sha: string | undefined) => (sha ? sha.slice(0, 7) : null);

async function registry(env: Env, fresh = false): Promise<Registry> {
  if (!fresh && regCache && Date.now() - regCache.at < 10_000)
    return regCache.r;
  const o = await env.BUCKET.get(keys.registry());
  const r = o ? ((await o.json()) as Registry) : FALLBACK;
  regCache = { at: Date.now(), r };
  return r;
}

async function getJson<T>(env: Env, key: string): Promise<T | null> {
  const o = await env.BUCKET.get(key);
  return o ? ((await o.json()) as T) : null;
}
const putJson = (env: Env, key: string, v: unknown) =>
  env.BUCKET.put(key, JSON.stringify(v), {
    httpMetadata: { contentType: "application/json" },
  });

async function views(env: Env, reg: Registry): Promise<ProjectView[]> {
  return Promise.all(
    reg.projects.map(async (project) => {
      const state = await readState(env.BUCKET, project.name, true);
      const sha = state?.deployments[0];
      const latest = sha
        ? await getJson<Deployment>(env, keys.record(project.name, sha))
        : null;
      return { project, state, latest };
    }),
  );
}

async function deployments(
  env: Env,
  p: string,
  s: ProjectState | null,
  n = 30,
): Promise<Deployment[]> {
  const out = await Promise.all(
    (s?.deployments ?? [])
      .slice(0, n)
      .map((sha) => getJson<Deployment>(env, keys.record(p, sha))),
  );
  return out.filter((d): d is Deployment => !!d);
}

type Who = { by: string } | null;

async function authorize(req: Request, env: Env): Promise<Who> {
  if (bearerOk(req.headers.get("authorization"), env.DEPLOY_TOKEN))
    return { by: "deploy-token" };
  const jwt = req.headers.get("cf-access-jwt-assertion");
  const id = await verifyAccess(jwt, env.ACCESS_TEAM, env.ACCESS_AUD);
  return id ? { by: id.email ?? id.sub ?? "access" } : null;
}

/** Move the production pointer of `p` to `sha` (promote) or to the previous production (rollback without sha). */
export async function setProduction(
  env: Env,
  p: string,
  sha: string | undefined,
  action: "promote" | "rollback",
  by: string,
): Promise<{ ok: boolean; error?: string; sha?: string; previous?: string }> {
  const s = (await readState(env.BUCKET, p, true)) ?? emptyState();
  let target = sha && sha.length < 40 ? resolveShort(s, sha) : sha;
  if (!target && action === "rollback") target = rollbackTarget(s);
  if (!target) return { ok: false, error: "no target deployment" };
  const rec = await getJson<Deployment>(env, keys.record(p, target));
  if (!rec || rec.state !== "ready")
    return {
      ok: false,
      error: `deployment ${target.slice(0, 7)} is not ready`,
    };
  const previous = s.production;
  s.production = target;
  s.history.push({ sha: target, at: new Date().toISOString(), action, by });
  s.history = s.history.slice(-100);
  await putJson(env, keys.state(p), s);
  forgetState(p);
  return { ok: true, sha: target, previous };
}

async function api(req: Request, env: Env, url: URL): Promise<Response> {
  const seg = url.pathname.split("/").filter(Boolean).slice(1); // after "api"
  const reg = await registry(env);
  const method = req.method;
  if (seg[0] === "health")
    return json({ status: "ok", service: "aphrody-deploy" });
  if (seg[0] === "projects" && seg.length === 1 && method === "GET") {
    const v = await views(env, reg);
    if (await authorize(req, env))
      return json(
        v.map(({ project, state, latest }) => ({
          ...project,
          production: state?.production ?? null,
          latest,
        })),
      );
    return json(
      v.map(({ project, state, latest }) => ({
        name: project.name,
        domains: project.domains,
        production: short(state?.production),
        state: latest?.state ?? null,
        date: latest ? (latest.readyAt ?? latest.createdAt) : null,
      })),
    );
  }
  // PUT /api/assets/md.js: Material Web bundle (packages/design/src/components.ts), built by CI.
  if (seg[0] === "assets" && seg[1] === "md.js" && method === "PUT") {
    if (!(await authorize(req, env)))
      return json({ error: "unauthorized" }, 401);
    await env.BUCKET.put(MDJS, req.body, {
      httpMetadata: { contentType: "text/javascript; charset=utf-8" },
    });
    return json({ ok: true });
  }
  if (seg[0] === "registry" && method === "PUT") {
    const a = await authorize(req, env);
    if (!a) return json({ error: "unauthorized" }, 401);
    const body = (await req.json()) as Registry;
    if (!Array.isArray(body.projects))
      return json({ error: "bad registry" }, 400);
    await putJson(env, keys.registry(), body);
    regCache = null;
    return json({ ok: true, projects: body.projects.length });
  }
  if (seg[0] !== "projects" || !seg[1] || !NAME.test(seg[1]))
    return json({ error: "not found" }, 404);
  const p = seg[1];
  const project = reg.projects.find((x) => x.name === p);
  if (!project) return json({ error: `unknown project ${p}` }, 404);

  // GET /api/projects/<p>/deployments
  if (seg[2] === "deployments" && seg.length === 3 && method === "GET") {
    const s = await readState(env.BUCKET, p, true);
    const list = await deployments(env, p, s);
    if (await authorize(req, env))
      return json({
        production: s?.production ?? null,
        history: s?.history ?? [],
        deployments: list,
      });
    return json({
      name: p,
      domains: project.domains,
      production: short(s?.production),
      deployments: list.map((d) => ({
        sha: short(d.sha),
        state: d.state,
        date: d.readyAt ?? d.createdAt,
      })),
    });
  }
  const a = await authorize(req, env);
  if (!a) return json({ error: "unauthorized" }, 401);

  // GET /api/projects/<p>/insights?days=7&by=route|deployment: analytics and speed insights
  // (Durable Object Insights); `by` adds page views and p75 per metric for each route or deployment.
  if (seg[2] === "insights" && seg.length === 3 && method === "GET") {
    const days = Number(url.searchParams.get("days") ?? 7);
    const by = url.searchParams.get("by");
    if (by && by !== "route" && by !== "deployment")
      return json({ error: "by must be route or deployment" }, 400);
    return json(
      (await insightsSummary(env, p, {
        days,
        by: (by ?? undefined) as "route" | "deployment" | undefined,
      })) ?? { error: "insights not bound" },
    );
  }
  // GET|PUT /api/projects/<p>/config: edge config (JSON object, read by deployments at /_aphrody/config)
  if (seg[2] === "config" && seg.length === 3) {
    if (method === "GET") return json(await readConfig(env.BUCKET, p, true));
    if (method === "PUT") {
      const text = await req.text();
      if (text.length > 64 * 1024)
        return json({ error: "config over 64 KiB" }, 413);
      let v: unknown;
      try {
        v = JSON.parse(text);
      } catch {
        return json({ error: "config must be JSON" }, 400);
      }
      if (!v || typeof v !== "object" || Array.isArray(v))
        return json({ error: "config must be a JSON object" }, 400);
      await putJson(env, keys.config(p), v);
      forgetConfig(p);
      return json({
        ok: true,
        keys: Object.keys(v as object).length,
        by: a.by,
      });
    }
  }

  // POST /api/projects/<p>/deployments {sha, branch, message, run}
  if (seg[2] === "deployments" && seg.length === 3 && method === "POST") {
    const b = (await req.json()) as Partial<Deployment>;
    if (!b.sha || !SHA.test(b.sha))
      return json({ error: "sha must be 40 hex" }, 400);
    const d: Deployment = {
      project: p,
      sha: b.sha,
      branch: String(b.branch ?? "main"),
      message: String(b.message ?? "").slice(0, 200),
      createdAt: new Date().toISOString(),
      state: "building",
      run: b.run,
    };
    await putJson(env, keys.record(p, d.sha), d);
    const s = (await readState(env.BUCKET, p, true)) ?? emptyState();
    s.deployments = [d.sha, ...s.deployments.filter((x) => x !== d.sha)].slice(
      0,
      200,
    );
    await putJson(env, keys.state(p), s);
    forgetState(p);
    return json({ ok: true, url: previewUrl(p, d.sha) }, 201);
  }
  const sha = seg[3];
  if (seg[2] === "deployments" && sha && SHA.test(sha)) {
    // PUT /api/projects/<p>/deployments/<sha>/files/<path>
    if (seg[4] === "files" && method === "PUT") {
      let parts: string[];
      try {
        parts = seg.slice(5).map(decodeURIComponent);
      } catch {
        return json({ error: "bad path" }, 400);
      }
      if (
        !parts.length ||
        parts.some((x) => !x || x === "." || x === ".." || /[\\/\0]/.test(x)) ||
        parts.join("/").length > 512
      )
        return json({ error: "bad path" }, 400);
      const rel = parts.join("/");
      await env.BUCKET.put(keys.file(p, sha, rel), req.body, {
        httpMetadata: {
          contentType:
            req.headers.get("content-type") ?? "application/octet-stream",
        },
      });
      return json({ ok: true });
    }
    // POST /api/projects/<p>/deployments/<sha>/finalize {state, files, bytes, log}
    if (seg[4] === "finalize" && method === "POST") {
      const rec = await getJson<Deployment>(env, keys.record(p, sha));
      if (!rec) return json({ error: "unknown deployment" }, 404);
      const b = (await req.json()) as {
        state?: string;
        files?: number;
        bytes?: number;
        log?: string;
      };
      rec.state = b.state === "error" ? "error" : "ready";
      rec.readyAt = new Date().toISOString();
      rec.files = b.files;
      rec.bytes = b.bytes;
      await putJson(env, keys.record(p, sha), rec);
      if (b.log)
        await env.BUCKET.put(keys.log(p, sha), b.log, {
          httpMetadata: { contentType: "text/plain; charset=utf-8" },
        });
      return json({ ok: true, state: rec.state, url: previewUrl(p, sha) });
    }
    // GET /api/projects/<p>/deployments/<sha>/log
    if (seg[4] === "log" && method === "GET") {
      const o = await env.BUCKET.get(keys.log(p, sha));
      return new Response(o ? o.body : "no log\n", {
        status: o ? 200 : 404,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }
  }
  // POST /api/projects/<p>/promote {sha} | /rollback {sha?}
  if ((seg[2] === "promote" || seg[2] === "rollback") && method === "POST") {
    const b = (await req.json().catch(() => ({}))) as { sha?: string };
    const r = await setProduction(env, p, b.sha, seg[2], a.by);
    return json(r, r.ok ? 200 : 409);
  }
  return json({ error: "not found" }, 404);
}

async function dash(req: Request, env: Env, url: URL): Promise<Response> {
  const a = await authorize(req, env);
  if (!a)
    return html(
      "<!doctype html><title>401</title><p>Accès réservé (Cloudflare Access).</p>",
      401,
    );
  const reg = await registry(env);
  const seg = url.pathname.split("/").filter(Boolean).slice(1);
  if (!seg.length)
    return html(
      dashboard(
        reg,
        await views(env, reg),
        a.by,
        await insightsSummary(env, PLATFORM, { days: 7 }).catch(() => null),
      ),
    );
  const project = reg.projects.find((x) => x.name === seg[0]);
  if (!project)
    return html("<!doctype html><title>404</title><p>Projet inconnu.</p>", 404);
  if (seg[1] === "promote" && req.method === "POST") {
    // CSRF: the form posts from the dashboard itself; anything else (no Origin, cross-site) is refused.
    const origin = req.headers.get("origin");
    const site = req.headers.get("sec-fetch-site");
    if (origin ? origin !== url.origin : site !== "same-origin")
      return html("<p>Origine refusée.</p>", 403);
    const form = await req.formData();
    const sha = String(form.get("sha") ?? "");
    const s = await readState(env.BUCKET, project.name, true);
    const deps = s?.deployments ?? [];
    const action =
      s?.production && deps.indexOf(s.production) < deps.indexOf(sha)
        ? "rollback"
        : "promote";
    const r = await setProduction(env, project.name, sha, action, a.by);
    if (!r.ok) return html(`<p>${r.error}</p>`, 409);
    return Response.redirect(`${url.origin}/dashboard/${project.name}`, 303);
  }
  if (seg[1] && SHA.test(seg[1]) && seg[2] === "log") {
    const o = await env.BUCKET.get(keys.log(project.name, seg[1]));
    return html(
      logPage(reg, project.name, seg[1], o ? await o.text() : "Aucun journal."),
    );
  }
  const s = await readState(env.BUCKET, project.name, true);
  const [deps, ins, cfg] = await Promise.all([
    deployments(env, project.name, s),
    insightsSummary(env, project.name, { days: 7 }).catch(() => null),
    readConfig(env.BUCKET, project.name, true),
  ]);
  return html(projectPage(reg, project, s, deps, ins, cfg));
}

export default {
  async fetch(
    req: Request,
    env: Env,
    ctx?: { waitUntil(p: Promise<unknown>): void },
  ): Promise<Response> {
    const url = new URL(req.url);
    const host = url.hostname;
    const zone = env.ZONE ?? "aphrody.app";
    if (APEX.has(host)) {
      if (host !== zone)
        return Response.redirect(
          `https://${zone}${url.pathname}${url.search}`,
          301,
        );
      if (url.pathname.startsWith("/api/")) return api(req, env, url);
      const rt = await runtime(req, env, PLATFORM, "", ctx);
      if (rt) return rt;
      if (url.pathname === "/_/md.js") {
        const o = await env.BUCKET.get(MDJS);
        if (!o)
          return new Response("// Material Web bundle not uploaded yet\n", {
            status: 404,
            headers: { "content-type": "text/javascript" },
          });
        return new Response(o.body, {
          headers: {
            "content-type": "text/javascript; charset=utf-8",
            "cache-control": "public, max-age=300",
            etag: o.httpEtag,
            "x-content-type-options": "nosniff",
          },
        });
      }
      if (
        url.pathname === "/dashboard" ||
        url.pathname.startsWith("/dashboard/")
      )
        return dash(req, env, url);
      const reg = await registry(env);
      if (url.pathname === "/") return html(landing(reg));
      const loc = LOCALES.find((x) => x !== "fr" && url.pathname === `/${x}`);
      if (loc) return html(landing(reg, loc));
      const plat = LOCALES.find(
        (x) => pagePath("platform", x) === url.pathname,
      );
      if (plat) return html(platform(reg, await views(env, reg), plat));
      if (url.pathname === "/_/theme.js" || url.pathname === "/_/hero.js")
        return new Response(
          url.pathname === "/_/theme.js" ? THEME_JS : HERO_JS,
          {
            headers: {
              "content-type": "text/javascript; charset=utf-8",
              "cache-control": "public, max-age=300",
              "x-content-type-options": "nosniff",
            },
          },
        );
      if (url.pathname === "/labs") return html(landing(reg));
      if (url.pathname === "/llms.txt")
        return new Response(LLMS, {
          headers: {
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      if (url.pathname === "/robots.txt")
        return new Response(
          "User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /api/\n\nSitemap: https://aphrody.app/sitemap.xml\n",
          { headers: { "content-type": "text/plain; charset=utf-8" } },
        );
      if (url.pathname === "/sitemap.xml")
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${LOCALES.flatMap(
            (x) => [localePath(x), pagePath("platform", x)],
          )
            .map(
              (p) =>
                `<url><loc>https://aphrody.app${p}</loc>${reg.generatedAt ? `<lastmod>${reg.generatedAt.slice(0, 10)}</lastmod>` : ""}</url>`,
            )
            .join("")}</urlset>\n`,
          {
            headers: {
              "content-type": "application/xml; charset=utf-8",
              "cache-control": "public, max-age=3600",
            },
          },
        );
      // Icons generated by `ay brand build` (assets/brand), published with aphrody.com.
      if (url.pathname === "/favicon.svg")
        return Response.redirect("https://aphrody.com/favicon.svg", 301);
      if (url.pathname === "/favicon.ico")
        return Response.redirect("https://aphrody.com/favicon.ico", 301);
      return html(
        landing(reg).replace(
          "<h1",
          `<p class="lead">${tr("fr", "plat.notfound")}</p><h1`,
        ),
        404,
      );
    }
    const alias = ALIASES[host]?.(url);
    if (alias === "api") {
      if (url.pathname === "/")
        return Response.redirect("https://aphrody.app/api/projects", 302);
      return api(
        req,
        env,
        new URL(`/api${url.pathname}${url.search}`, "https://aphrody.app"),
      );
    }
    if (alias) return Response.redirect(alias, 302);
    const studio = STUDIO_APP_HOSTS[host];
    if (studio) {
      if (url.pathname === "/health" || url.pathname === "/api/health") {
        return json({
          ok: true,
          status: "ok",
          service: "craft-web",
          studio,
          host,
        });
      }
      const res = html(
        `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aphrody Studio - ${studio}</title><link rel="stylesheet" href="https://aphrody.com/tokens.css"></head><body style="font-family:system-ui,sans-serif;margin:0;padding:2rem;background:var(--md-sys-color-surface,#fbf8ff);color:var(--md-sys-color-on-surface,#1a1b25)"><main style="max-width:44rem;margin:0 auto"><h1>Aphrody ${studio}</h1><p>Studio WebGPU/Wayland unifie sur <code>${host}</code>.</p><p><a href="https://aphrody.com/wayland/">Ouvrir le compositeur Wayland WASM</a> · <a href="https://aphrody.app/">Lanceur aphrody.app</a></p></main></body></html>`,
      );
      res.headers.set("x-craft-studio", studio);
      return res;
    }
    const pv = parsePreviewHost(host, zone);
    if (pv) {
      let s = await readState(env.BUCKET, pv.project);
      let sha = s ? resolveShort(s, pv.short) : undefined;
      if (!sha) {
        s = await readState(env.BUCKET, pv.project, true);
        sha = s ? resolveShort(s, pv.short) : undefined;
      }
      if (sha) {
        const rt = await runtime(req, env, pv.project, sha, ctx);
        if (rt) return rt;
        return serveDeployment(
          env.BUCKET,
          pv.project,
          sha,
          req,
          { "x-robots-tag": "noindex" },
          ctx,
        );
      }
      return new Response("unknown deployment", {
        status: 404,
        headers: { "cache-control": "no-store" },
      });
    }
    const reg = await registry(env);
    const owner = reg.projects.find((p) => p.domains.includes(host));
    if (owner) {
      if (url.pathname.startsWith("/_aphrody/")) {
        const st = await readState(env.BUCKET, owner.name);
        const rt = st?.production
          ? await runtime(req, env, owner.name, st.production, ctx)
          : null;
        if (rt) return rt;
      }
      const r = await serveProduction(env.BUCKET, owner.name, req, ctx);
      if (r) return r;
      return new Response("no production deployment yet", { status: 404 });
    }
    return fetch(req); // not ours: untouched pass-through to the origin of this hostname
  },
};
