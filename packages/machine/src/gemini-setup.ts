// Installe Gemini Desktop sans interaction depuis l'installeur officiel (défaut : var/GeminiSetup.exe, hors dépôt).
// GeminiSetup.exe est le méta-installeur Chromium Updater (chrome/updater, « Google Installer (x86) ») : charge utile
// compressée en ressource PE B7/UPDATER, étiquette Omaha (appguid, appname=Gemini, needsadmin=false) dans le
// certificat factice de la signature. Relevé le 2026-11-14 sur 159.0.8140.0 : `--silent` installe par utilisateur
// dans %LOCALAPPDATA%\Google\Gemini, code 0, sans élévation. Refuse tout fichier non signé « Google LLC ».
// Usage : bun packages/machine/src/gemini-setup.ts [chemin] [--check]   (just gemini-setup)
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(import.meta.dir, "..", "..", "..");
const args = process.argv.slice(2);
const check = args.includes("--check");
const exe = resolve(
  args.find((a) => !a.startsWith("--")) ?? join(SRC, "var", "GeminiSetup.exe"),
);
const ps = (script: string) => {
  const r = Bun.spawnSync(
    ["pwsh", "-NoProfile", "-NonInteractive", "-c", script],
    { stdout: "pipe", stderr: "pipe" },
  );
  return r.stdout.toString().trim();
};
/** Version installée (clé de désinstallation par utilisateur), sinon chaîne vide. */
const installed = () =>
  ps(
    "(Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -EA 0 | ? { $_.DisplayName -eq 'Gemini' -and $_.Publisher -match 'Google' } | select -First 1).DisplayVersion",
  );

if (process.platform !== "win32")
  throw new Error("gemini-setup : Windows seulement");
const before = installed();
if (check) {
  console.log(before ? `ok   Gemini ${before}` : "DIFF Gemini absent");
  process.exitCode = before ? 0 : 1;
} else if (before) {
  console.log(
    `ok   Gemini ${before} déjà installé (mises à jour par Google Updater)`,
  );
} else {
  if (!existsSync(exe))
    throw new Error(
      `installeur absent : ${exe} (https://gemini.google/desktop/)`,
    );
  const sig = ps(
    `$s = Get-AuthenticodeSignature -LiteralPath '${exe.replaceAll("'", "''")}'; "$($s.Status)|$($s.SignerCertificate.Subject)"`,
  );
  if (!/^Valid\|CN=Google LLC, O=Google LLC,/.test(sig))
    throw new Error(`signature refusée : ${sig || "aucune"}`);
  const r = Bun.spawnSync([exe, "--silent"], {
    stdout: "ignore",
    stderr: "ignore",
    timeout: 600_000,
  });
  const after = installed();
  if (r.exitCode !== 0 || !after)
    throw new Error(`installation en échec (code ${r.exitCode})`);
  console.log(`set  Gemini ${after} installé`);
}
