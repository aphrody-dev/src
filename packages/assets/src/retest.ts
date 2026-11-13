// Recursive re-test trigger: fingerprint = manifest.toml + the pins of every decoder fork/vendor
// (src.lock.json) + the Cargo.lock stanzas of the decoder crates. When it differs from the stored one,
// `assets test --recursive` runs again; with --watch the check repeats on an interval.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { libraryRoot } from "./manifest.ts";
import { manifestPaths, testCommand } from "./test.ts";

/** Forks and vendors whose pin change can change a decode result. */
export const PIN_PATHS = [
  "third_party/ffmpeg",
  "third_party/storyteller-bevy",
  "third_party/artcraft",
];
/** Cargo.lock packages that decode assets. */
export const LOCK_PACKAGES = [
  "bevy",
  "bevy_gltf",
  "ffmpeg-next",
  "ffmpeg-sys-next",
  "resvg",
  "usvg",
  "gltf",
  "ttf-parser",
  "craft-svg",
  "craft-webp",
  "craft-exr",
];

export function lockStanzas(cargoLock: string, names = LOCK_PACKAGES): string {
  return cargoLock
    .split("\n\n")
    .filter((s) =>
      names.some(
        (n) =>
          s.includes(`\nname = "${n}"\n`) ||
          s.startsWith(`[[package]]\nname = "${n}"\n`),
      ),
    )
    .sort()
    .join("\n\n");
}

export async function fingerprint(root: string): Promise<string> {
  const parts: string[] = [];
  const read = async (p: string) =>
    existsSync(p) ? await Bun.file(p).text() : "";
  for (const f of manifestPaths(libraryRoot(root))) parts.push(await read(f));
  const lock = JSON.parse(
    (await read(join(root, "src.lock.json"))) || "{}",
  ) as { repositories?: Record<string, { commit?: string; url?: string }> };
  for (const p of PIN_PATHS)
    parts.push(`${p}=${lock.repositories?.[p]?.commit ?? "-"}`);
  parts.push(lockStanzas(await read(join(root, "Cargo.lock"))));
  const h = new Bun.CryptoHasher("sha256");
  h.update(parts.join("\n--\n"));
  return h.digest("hex");
}

/** Returns 0 when the stored fingerprint matches (nothing to do) or the re-test passes. */
export async function retest(root: string, args: string[]): Promise<number> {
  const stamp = join(root, "var", "assets-test", "fingerprint");
  const fp = await fingerprint(root);
  const prev = existsSync(stamp) ? (await Bun.file(stamp).text()).trim() : "";
  if (prev === fp && !args.includes("--force")) {
    console.log(`unchanged ${fp.slice(0, 12)}`);
    return 0;
  }
  console.log(
    `changed ${prev.slice(0, 12) || "none"} -> ${fp.slice(0, 12)}: re-testing`,
  );
  const code = await testCommand(root, [
    "--recursive",
    ...args.filter((a) => a !== "--force" && a !== "--watch"),
  ]);
  if (code === 0) await Bun.write(stamp, fp);
  return code;
}

export async function retestCommand(
  root: string,
  args: string[],
): Promise<number> {
  if (!args.includes("--watch")) return retest(root, args);
  const every =
    Number(args.find((a) => a.startsWith("--every="))?.slice(8) ?? 60) * 1000;
  for (;;) {
    await retest(root, args);
    await Bun.sleep(every);
  }
}
