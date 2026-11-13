import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  cpSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { CACHE_CONTROL, type BundleManifest, withUrls } from "./bundle.ts";
import { pool, posix, run, stableJson, which } from "./util.ts";

export type TargetType =
  "dir" | "next" | "ssh" | "rclone" | "s3" | "vercel-blob";

export interface Target {
  name: string;
  type: TargetType;
  /** Own fleet or local disk: no paid or third-party effect, so no owner rule needed. */
  external: boolean;
  public_url?: string;
  dir?: string;
  host?: string;
  remote?: string;
  app?: string;
  /** Names of environment variables holding credentials; never the values. */
  env: Record<string, string>;
  bucket?: string;
  timeout: number;
}

export const targetsFile = (root: string) =>
  join(root, "assets", "targets.toml");

export function parseTargets(text: string): Target[] {
  const doc = Bun.TOML.parse(text) as {
    target?: Record<string, Record<string, unknown>>;
  };
  return Object.entries(doc.target ?? {}).map(([name, t]) => {
    const type = String(t.type ?? "") as TargetType;
    const internal = type === "dir" || type === "next" || t.external === false;
    return {
      name,
      type,
      external: !internal,
      public_url: t.public_url as string | undefined,
      dir: t.dir as string | undefined,
      host: t.host as string | undefined,
      remote: t.remote as string | undefined,
      app: t.app as string | undefined,
      bucket: t.bucket as string | undefined,
      env: (t.env ?? {}) as Record<string, string>,
      timeout: Number(t.timeout ?? 600),
    };
  });
}

export function checkTargets(ts: Target[]): string[] {
  const errs: string[] = [];
  const types = ["dir", "next", "ssh", "rclone", "s3", "vercel-blob"];
  for (const t of ts) {
    if (!types.includes(t.type)) errs.push(`${t.name}: unknown type ${t.type}`);
    if ((t.type === "dir" || t.type === "ssh") && !t.dir)
      errs.push(`${t.name}: dir required`);
    if (t.type === "next" && !t.app) errs.push(`${t.name}: app required`);
    if (t.type === "ssh" && !t.host) errs.push(`${t.name}: host required`);
    if (t.type === "rclone" && !t.remote)
      errs.push(`${t.name}: remote required`);
    if (t.type === "s3" && !t.bucket) errs.push(`${t.name}: bucket required`);
    for (const [k, v] of Object.entries(t.env))
      if (!/^[A-Z][A-Z0-9_]*$/.test(v))
        errs.push(`${t.name}: env.${k} must be a variable name, not a value`);
  }
  return errs;
}

/** Owner rule lookup, same file and semantics as packages/ai-os policy.ts. */
export function allowed(root: string, step: string, command: string): boolean {
  const f = join(root, ".agents", "owner-rules.json");
  if (!existsSync(f)) return false;
  try {
    const rules = (JSON.parse(readFileSync(f, "utf8")).rules ?? []) as {
      effect?: string;
      step?: string;
      command?: string;
    }[];
    const full = (re: string, s: string) => new RegExp(`^(?:${re})$`).test(s);
    return rules.some(
      (r) =>
        r.effect === "external" &&
        typeof r.step === "string" &&
        full(r.step, step) &&
        (r.command === undefined || full(r.command, command)),
    );
  } catch {
    return false;
  }
}

function listFiles(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory()
      ? listFiles(p, base)
      : [posix(relative(base, p))];
  });
}

export interface PublishResult {
  target: string;
  state: "published" | "held" | "dry-run" | "error";
  files: number;
  bytes: number;
  detail?: string;
}

const secretOf = (t: Target, key: string) => {
  const name = t.env[key];
  const v = name ? process.env[name] : undefined;
  if (!v)
    throw new Error(
      `${t.name}: environment variable ${name ?? key} is not set`,
    );
  return v;
};

/** Upload content-hashed files first, the manifest last, so a manifest never points at a missing file. */
export async function publish(
  root: string,
  bundleDir: string,
  man: BundleManifest,
  t: Target,
  opts: { dryRun?: boolean; run?: string } = {},
): Promise<PublishResult> {
  const files = listFiles(bundleDir).filter(
    (f) => f !== "assets-manifest.json",
  );
  const bytes = files.reduce(
    (n, f) => n + statSync(join(bundleDir, f)).size,
    0,
  );
  const res: PublishResult = {
    target: t.name,
    state: "dry-run",
    files: files.length,
    bytes,
  };
  const step = `assets.publish.${t.name}`;
  const cmd = `ay assets publish ${t.name}`;
  if (opts.dryRun) return res;

  if (t.external && !allowed(root, step, cmd)) {
    const rel = join(
      "var",
      "agents",
      "outbox",
      opts.run ?? new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15),
      `${step}.json`,
    );
    mkdirSync(join(root, rel, ".."), { recursive: true });
    writeFileSync(
      join(root, rel),
      stableJson({
        step,
        reason:
          "effet externe sans regle du proprietaire (.agents/owner-rules.json)",
        target: {
          name: t.name,
          type: t.type,
          host: t.host,
          remote: t.remote,
          bucket: t.bucket,
          public_url: t.public_url,
        },
        files: files.length,
        bytes,
        command: cmd,
      }),
    );
    return { ...res, state: "held", detail: posix(rel) };
  }

  const manifestJson = stableJson(
    t.public_url ? withUrls(man, t.public_url) : man,
  );
  const stage = join(bundleDir, "..", `manifest-${t.name}`);
  mkdirSync(stage, { recursive: true });
  writeFileSync(join(stage, "assets-manifest.json"), manifestJson);

  try {
    switch (t.type) {
      case "dir":
      case "next": {
        const dest = resolve(
          root,
          t.type === "next" ? join(t.app!, "public") : t.dir!,
        );
        cpSync(bundleDir, dest, { recursive: true });
        writeFileSync(join(dest, "assets-manifest.json"), manifestJson);
        break;
      }
      case "ssh": {
        // tar over ssh: no rsync needed on the PC; --no-same-owner keeps the edge user in charge.
        if (!which("tar") || !which("ssh"))
          throw new Error("tar and ssh are required");
        const send = async (src: string, names: string[]) => {
          const list = join(stage, `list-${names.length}.txt`);
          writeFileSync(list, names.join("\n") + "\n");
          const tar = Bun.spawn(
            ["tar", "-c", "-C", posix(src), "-T", posix(list)],
            { stdout: "pipe", stderr: "pipe" },
          );
          const ssh = Bun.spawn(
            [
              "ssh",
              "-o",
              "BatchMode=yes",
              t.host!,
              `mkdir -p '${t.dir}' && tar -x --no-same-owner -C '${t.dir}'`,
            ],
            { stdin: tar.stdout, stderr: "pipe", timeout: t.timeout * 1000 },
          );
          const [err, code] = [
            await new Response(ssh.stderr).text(),
            await ssh.exited,
          ];
          if (code || (await tar.exited))
            throw new Error(`ssh ${t.host}: ${err.trim().slice(0, 300)}`);
        };
        await send(bundleDir, files);
        await send(stage, ["assets-manifest.json"]);
        break;
      }
      case "rclone": {
        if (!which("rclone")) throw new Error("rclone not found");
        const common = [
          "--fast-list",
          "--transfers",
          "16",
          "--header-upload",
          `Cache-Control: ${CACHE_CONTROL}`,
          "--no-update-modtime",
        ];
        const a = await run([
          "rclone",
          "copy",
          bundleDir,
          t.remote!,
          "--exclude",
          "assets-manifest.json",
          ...common,
        ]);
        if (!a.ok) throw new Error(`rclone: ${a.err.trim().slice(0, 300)}`);
        const b = await run([
          "rclone",
          "copy",
          stage,
          t.remote!,
          "--header-upload",
          "Cache-Control: public, max-age=60, must-revalidate",
        ]);
        if (!b.ok) throw new Error(`rclone: ${b.err.trim().slice(0, 300)}`);
        break;
      }
      case "s3": {
        const endpoint = t.env.endpoint
          ? process.env[t.env.endpoint]
          : undefined;
        const s3 = new Bun.S3Client({
          accessKeyId: secretOf(t, "access_key_id"),
          secretAccessKey: secretOf(t, "secret_access_key"),
          bucket: t.bucket,
          ...(endpoint ? { endpoint } : {}),
        });
        const put = async (
          name: string,
          data: Uint8Array,
          cc: string,
          type?: string,
          enc?: string,
        ) => {
          const h: Record<string, string> = { "cache-control": cc };
          if (enc) h["content-encoding"] = enc;
          await s3.write(name, data, { type, ...({ headers: h } as object) });
        };
        await pool(files, 8, async (f) => {
          const br = f.endsWith(".br");
          await put(
            f,
            new Uint8Array(readFileSync(join(bundleDir, f))),
            CACHE_CONTROL,
            br ? "application/octet-stream" : undefined,
          );
        });
        await put(
          "assets-manifest.json",
          new TextEncoder().encode(manifestJson),
          "public, max-age=60, must-revalidate",
          "application/json",
        );
        break;
      }
      case "vercel-blob": {
        // Wire format from vercel/storage (src/api.ts, put-helpers.ts, read via context7 2026-11-13).
        // Not live-tested: the Vercel team is soft-blocked (memory vercel-blob).
        const token = secretOf(t, "token");
        const api =
          process.env.VERCEL_BLOB_API_URL ?? "https://vercel.com/api/blob";
        const up = async (name: string, data: Uint8Array, maxAge: number) => {
          const r = await fetch(
            `${api}/?pathname=${encodeURIComponent(name)}`,
            {
              method: "PUT",
              body: data as unknown as BodyInit,
              headers: {
                authorization: `Bearer ${token}`,
                "x-api-version": "13",
                "x-vercel-blob-access": "public",
                "x-add-random-suffix": "0",
                "x-allow-overwrite": "1",
                "x-cache-control-max-age": String(maxAge),
              },
            },
          );
          if (!r.ok) throw new Error(`vercel-blob ${name}: HTTP ${r.status}`);
        };
        await pool(
          files.filter((f) => !f.endsWith(".br")),
          6,
          (f) =>
            up(f, new Uint8Array(readFileSync(join(bundleDir, f))), 31536000),
        );
        await up(
          "assets-manifest.json",
          new TextEncoder().encode(manifestJson),
          60,
        );
        break;
      }
    }
  } catch (e) {
    return {
      ...res,
      state: "error",
      detail: String(e).replace(/(token|key|secret)=\S+/gi, "$1=***"),
    };
  }
  return { ...res, state: "published" };
}
