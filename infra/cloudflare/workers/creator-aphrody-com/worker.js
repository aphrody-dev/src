const SEC = {
  "x-content-type-options": "nosniff",
  "strict-transport-security": "max-age=63072000",
  "referrer-policy": "strict-origin-when-cross-origin",
};
async function fetchKey(env, key, req) {
  return env.BUCKET.get(key, { range: req.headers, onlyIf: req.headers });
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method !== "GET" && req.method !== "HEAD")
      return new Response("method not allowed", { status: 405 });
    if (url.pathname === "/health")
      return Response.json(
        { status: "ok", service: env.SERVICE || "r2-site" },
        { headers: SEC },
      );
    const base = (env.PREFIX || "").replace(/\/$/, "");
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith("/")) path += "index.html";
    let obj = await fetchKey(env, base + path, req);
    if (!obj && !path.split("/").pop().includes("."))
      obj = await fetchKey(env, base + path + "/index.html", req);
    let status = 200;
    if (!obj && env.SPA === "1")
      obj = await fetchKey(env, base + "/index.html", req);
    if (!obj) {
      obj = await env.BUCKET.get(base + "/404.html");
      status = 404;
      if (!obj) return new Response("not found", { status, headers: SEC });
    }
    const h = new Headers(SEC);
    obj.writeHttpMetadata(h);
    h.set("etag", obj.httpEtag);
    h.set("accept-ranges", "bytes");
    if (!("body" in obj))
      return new Response(null, { status: 304, headers: h });
    if (obj.range && req.headers.has("range")) {
      const { offset = 0, length } = obj.range;
      h.set(
        "content-range",
        `bytes ${offset}-${offset + length - 1}/${obj.size}`,
      );
      status = 206;
    }
    if (!h.has("cache-control"))
      h.set(
        "cache-control",
        path.endsWith(".html") ? "public, max-age=60" : "public, max-age=3600",
      );
    return new Response(req.method === "HEAD" ? null : obj.body, {
      status,
      headers: h,
    });
  },
};
