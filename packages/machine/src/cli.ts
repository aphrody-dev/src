const [sub = "binpath", ...rest] = process.argv.slice(2);

const scripts: Record<string, string> = {
  binpath: "binpath.ts",
  bin: "binpath.ts",
  path: "binpath.ts",
  apply: "apply-user.ts",
  shells: "shells.ts",
  matrix: "../matrix/src/cli.ts",
  toolchain: "toolchain.ts",
};

if (sub === "help" || sub === "--help" || sub === "-h") {
  console.log(`ay machine <${Object.keys(scripts).join("|")}> [args]`);
  process.exit(0);
}

const target = scripts[sub];
if (!target) {
  console.error(
    `unknown machine command: ${sub} (available: ${Object.keys(scripts).join(", ")})`,
  );
  process.exit(1);
}

const r = Bun.spawnSync(
  ["bun", "run", `${import.meta.dir}/${target}`, ...rest],
  {
    stdio: ["inherit", "inherit", "inherit"],
  },
);
process.exit(r.exitCode ?? 1);
