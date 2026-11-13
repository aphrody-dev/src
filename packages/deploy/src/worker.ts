// aphrody.app platform Worker.
//   aphrody.app /, /labs              public pages (projects, labs)
//   aphrody.app /dashboard[...]        Cloudflare Access + JWT check: projects, deployments, logs, promote/rollback
//   aphrody.app /api/...               JSON API; reads public, writes and logs need the deploy token or Access
//   <project>-<sha>.aphrody.app        preview of one deployment
//   <domain of a project>              production of that project (zone aphrody.app)
//   any other *.aphrody.app host       passed through untouched to its origin (tunnel, R2, other Workers)
import { bearerOk, verifyAccess } from "./access.ts";
import {
  dashboard,
  labs,
  landing,
  logPage,
  projectPage,
  type ProjectView,
} from "./pages.ts";
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
}

const APEX = new Set(["aphrody.app", "www.aphrody.app"]);
const JSONH = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};
const HTMLH = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "content-security-policy":
    "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
  "strict-transport-security": "max-age=63072000; includeSubDomains",
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
    return json(
      v.map(({ project, state, latest }) => ({
        ...project,
        production: state?.production ?? null,
        latest,
      })),
    );
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
    return json({
      production: s?.production ?? null,
      history: s?.history ?? [],
      deployments: await deployments(env, p, s),
    });
  }
  const a = await authorize(req, env);
  if (!a) return json({ error: "unauthorized" }, 401);

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
      const rel = seg.slice(5).map(decodeURIComponent).join("/");
      if (!rel || rel.includes("..")) return json({ error: "bad path" }, 400);
      await env.BUCKET.put(keys.file(p, sha, rel), req.body, {
        httpMetadata: {
          contentType:
            req.headers.get("content-type") ?? "application/octet-stream",
          cacheControl: req.headers.get("x-cache-control") ?? undefined,
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
  if (!seg.length) return html(dashboard(reg, await views(env, reg), a.by));
  const project = reg.projects.find((x) => x.name === seg[0]);
  if (!project)
    return html("<!doctype html><title>404</title><p>Projet inconnu.</p>", 404);
  if (seg[1] === "promote" && req.method === "POST") {
    const origin = req.headers.get("origin");
    if (origin && origin !== url.origin)
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
  return html(
    projectPage(reg, project, s, await deployments(env, project.name, s)),
  );
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
      if (
        url.pathname === "/dashboard" ||
        url.pathname.startsWith("/dashboard/")
      )
        return dash(req, env, url);
      const reg = await registry(env);
      if (url.pathname === "/")
        return html(landing(reg, await views(env, reg)));
      if (url.pathname === "/labs") return html(labs(reg));
      if (url.pathname === "/robots.txt")
        return new Response(
          "User-agent: *\nDisallow: /dashboard\nDisallow: /api/\n",
          { headers: { "content-type": "text/plain" } },
        );
      return html(
        landing(reg, await views(env, reg)).replace(
          "<h1",
          '<p class="lead">Page introuvable.</p><h1',
        ),
        404,
      );
    }
    const pv = parsePreviewHost(host, zone);
    if (pv) {
      let s = await readState(env.BUCKET, pv.project);
      let sha = s ? resolveShort(s, pv.short) : undefined;
      if (!sha) {
        s = await readState(env.BUCKET, pv.project, true);
        sha = s ? resolveShort(s, pv.short) : undefined;
      }
      if (sha)
        return serveDeployment(
          env.BUCKET,
          pv.project,
          sha,
          req,
          { "x-robots-tag": "noindex" },
          ctx,
        );
      return new Response("unknown deployment", {
        status: 404,
        headers: { "cache-control": "no-store" },
      });
    }
    const reg = await registry(env);
    const owner = reg.projects.find((p) => p.domains.includes(host));
    if (owner) {
      const r = await serveProduction(env.BUCKET, owner.name, req, ctx);
      if (r) return r;
      return new Response("no production deployment yet", { status: 404 });
    }
    return fetch(req); // not ours: untouched pass-through to the origin of this hostname
  },
};
