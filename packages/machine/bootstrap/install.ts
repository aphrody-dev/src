// Fresh-machine bootstrap: build `ay` once, then `ay up --bootstrap` applies tools.toml
// (tools, config files, links, clones from src.lock.json, ay doctor). docs/infra/INSTALL_UPDATE.md §4.
import { homedir } from "node:os";
import { delimiter, join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..", "..", "..");
const local = join(homedir(), ".local");
const env = { ...process.env, SRC_ROOT: root, PATH: `${join(local, "bin")}${delimiter}${process.env.PATH ?? ""}` };
const run = async (cmd: string[], extra: Record<string, string> = {}) =>
  await Bun.spawn(cmd, { env: { ...env, ...extra }, stdout: "inherit", stderr: "inherit" }).exited;

if (!Bun.which("ay", { PATH: env.PATH })) {
  const code = await run(
    ["cargo", "install", "--path", join(root, "src", "ay"), "--root", local, "--locked", "--no-track"],
    { RUSTC_WRAPPER: "" },
  );
  if (code) process.exit(code);
}
process.exitCode = await run(["ay", "up", "--bootstrap"]);
