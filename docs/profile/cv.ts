// Renders docs/profile/CV.md to a print-ready HTML page in the Aphrody style (brand tokens from
// assets/brand/gen/tokens/tokens.css, Google Sans Flex), then to PDF with headless Chrome.
// The PDF step runs on fr1 (no rendering on the workstation):
//   bun docs/profile/cv.ts            -> docs/profile/CV.html
//   bun docs/profile/cv.ts --pdf      -> also docs/profile/CV.pdf (needs google-chrome)
import { join } from "node:path";

const DIR = import.meta.dir;
const ROOT = join(DIR, "..", "..");
const md = await Bun.file(join(DIR, "CV.md")).text();
const tokens = await Bun.file(
  join(ROOT, "assets/brand/gen/tokens/tokens.css"),
).text();
const mark = await Bun.file(
  join(ROOT, "assets/brand/gen/logo/aphrody-dev.svg"),
).text();
const font = join(ROOT, "assets/brand/gen-cache/GoogleSansFlex.ttf");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Aphrody Dev</title>
<style>
@font-face { font-family: "Google Sans Flex"; src: url("file://${font.replaceAll("\\", "/")}"); font-weight: 100 1000; }
${tokens}
@page { size: A4; margin: 16mm 18mm; }
:root { color-scheme: light; }
body { font: 10.5pt/1.55 var(--aph-font); color: var(--md-sys-color-on-surface); background: #fff; margin: 0; }
header { display: flex; gap: 14px; align-items: center; margin-bottom: 4px; }
header svg { width: 44px; height: 44px; flex: none; }
h1 { font-size: 22pt; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
h2 { font-size: 12pt; font-weight: 650; color: var(--md-sys-color-primary); margin: 18px 0 6px; padding-bottom: 4px; border-bottom: 1px solid var(--md-sys-color-outline-variant); }
p, li { margin: 4px 0; }
a { color: var(--md-sys-color-primary); text-decoration: none; }
code { font-size: 9pt; background: var(--md-sys-color-surface-container); border-radius: 4px; padding: 0 3px; }
table { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
th, td { text-align: left; vertical-align: top; padding: 4px 6px; border-bottom: 1px solid var(--md-sys-color-outline-variant); }
th { font-weight: 650; color: var(--md-sys-color-on-surface-variant); }
</style></head>
<body><header>${mark}${Bun.markdown.html(md.split("\n")[0] + "\n")}</header>
${Bun.markdown.html(md.split("\n").slice(1).join("\n"))}
</body></html>
`;
await Bun.write(join(DIR, "CV.html"), html);
console.log("docs/profile/CV.html");

if (process.argv.includes("--pdf")) {
  const out = join(DIR, "CV.pdf");
  const p = Bun.spawnSync(
    [
      "google-chrome",
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${out}`,
      `file://${join(DIR, "CV.html")}`,
    ],
    { stdout: "inherit", stderr: "inherit" },
  );
  if (p.exitCode !== 0) process.exit(p.exitCode ?? 1);
  console.log("docs/profile/CV.pdf");
}
