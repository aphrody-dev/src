const BACKUPS = "/srv/shenron/data/backups/container";
const REMOTE = "shenronbackup@10.200.77.3:current/";
const SSH_WRITE = "ssh -i /root/.ssh/id_ed25519_shenron_dbfr_write -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UpdateHostKeys=no -o UserKnownHostsFile=/root/.ssh/known_hosts";
const SSH_READ = "ssh -i /root/.ssh/id_ed25519_shenron_dbfr_read -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UpdateHostKeys=no -o UserKnownHostsFile=/root/.ssh/known_hosts";

async function run(args) {
  const proc = Bun.spawn(args, { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const status = await proc.exited;
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  if (status !== 0) throw new Error(`command failed (${status}): ${args[0]}`);
  return stdout;
}

let snapshots = [];
for await (const name of new Bun.Glob("*").scan({ cwd: BACKUPS, onlyFiles: false })) {
  if (!/^\d{8}T\d{12}Z$/.test(name)) continue;
  const path = `${BACKUPS}/${name}`;
  try {
    if ((await Bun.file(path).stat()).isDirectory()) snapshots.push({ name, path });
  } catch {}
}
snapshots.sort((a, b) => a.name.localeCompare(b.name));
const snapshot = snapshots.at(-1);
if (!snapshot) throw new Error("no timestamped verified backup snapshot found");
const manifestPath = `${snapshot.path}/VERIFIED.json`;
if (!(await Bun.file(manifestPath).exists())) throw new Error("backup manifest missing");
const manifest = await Bun.file(manifestPath).json();
if (manifest.kind !== "shenron-container-backup"
  || manifest.sqliteIntegrity !== "ok"
  || manifest.postgresArchiveList !== "ok"
  || manifest.redisIntegrity !== "ok") throw new Error("backup verification gates are not green");
const ageMs = Date.now() - (await Bun.file(manifestPath).stat()).mtimeMs;
if (ageMs > 36 * 60 * 60 * 1000) throw new Error("latest verified snapshot is older than 36 hours");
for (const [relativePath, expected] of Object.entries(manifest.files)) {
  const hasher = new Bun.CryptoHasher("sha256");
  const filePath = `${snapshot.path}/${relativePath}`;
  for await (const chunk of Bun.file(filePath).stream()) hasher.update(chunk);
  if (hasher.digest("hex") !== expected) throw new Error(`local snapshot hash mismatch: ${relativePath}`);
}
console.log(`Uploading verified snapshot ${snapshot.name} to DBFR`);
await run([
  "rsync", "--archive", "--no-owner", "--no-group", "--checksum",
  "--delete-delay", "--delay-updates",
  "--timeout=1200", "--human-readable", "-e", SSH_WRITE,
  `${snapshot.path}/`, REMOTE,
]);
const differences = await run([
  "rsync", "--recursive", "--checksum", "--itemize-changes", "--dry-run",
  "--out-format=%i %n", "-e", SSH_READ, REMOTE, `${snapshot.path}/`,
]);
if (differences.trim()) throw new Error("DBFR read-back checksum comparison found differences");
console.log(`DBFR snapshot verified by independent read-back: ${snapshot.name}`);
