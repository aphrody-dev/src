// Télécharge FFmpeg (gyan.dev essentials), vérifie le SHA-256 puis extrait. Usage : bun scripts/video-lancement-outils.ts [destination]
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const destination = resolve(process.argv[2] ?? join(import.meta.dir, "..", ".cache", "video-outils"));
await mkdir(destination, { recursive: true });
const url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip";
const archive = join(destination, "ffmpeg.zip");
const [zip, somme] = await Promise.all([fetch(url), fetch(url + ".sha256")]);
if (!zip.ok || !somme.ok) throw Error(`Téléchargement FFmpeg impossible (${zip.status}/${somme.status})`);
await Bun.write(archive, zip);
await Bun.write(join(destination, "ffmpeg.sha256"), somme.clone());
const reel = new Bun.CryptoHasher("sha256").update(await Bun.file(archive).arrayBuffer()).digest("hex");
const attendu = (await somme.text()).trim().split(/\s+/)[0]!.toLowerCase();
if (reel !== attendu) throw Error("Empreinte SHA-256 FFmpeg incorrecte");
// bsdtar (Windows 10+, macOS) et GNU tar récent lisent le zip ; `unzip` en repli.
const tar = Bun.spawnSync(["tar", "-xf", archive, "-C", destination]);
if (tar.exitCode !== 0 && Bun.spawnSync(["unzip", "-oq", archive, "-d", destination]).exitCode !== 0)
  throw Error("Extraction de l'archive FFmpeg impossible");
console.log("FFmpeg téléchargé et vérifié :", reel);
for await (const f of new Bun.Glob("**/ffmpeg{,.exe}").scan({ cwd: destination, absolute: true })) console.log(f);
