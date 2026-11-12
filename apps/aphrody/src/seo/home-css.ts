/**
 * Inline CSS for the brand homepage. Tokens and rules are specified in DESIGN.md.
 * Kept as one string so the page needs no extra stylesheet request.
 */
export const HOME_CSS = `
@font-face{font-family:"Atkinson Next";src:url(/atkinson-next.woff2) format("woff2");font-weight:200 800;font-style:normal;font-display:optional}
:root{--paper:#F2F4F1;--tile:#FFFFFF;--ink:#17202A;--muted:#55606B;--rule:#848E96;--active:#0B7A75;--live:#2E6B3A;--dev:#8A5A00;
--font:"Atkinson Next",system-ui,-apple-system,"Segoe UI",sans-serif;--gap:.75rem;--radius:6px;--pad:clamp(1.25rem,4vw,3rem);--section:clamp(3rem,6vw,6rem);color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--paper:#151B21;--tile:#1C242C;--ink:#E6EAEE;--muted:#A3ADB7;--rule:#647381;--active:#3FC1B9;--live:#7CC98A;--dev:#E3B35C}}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:400 1.125rem/1.6 var(--font)}
a{color:var(--active);text-underline-offset:.18em}
a:focus-visible{outline:2px solid var(--active);outline-offset:3px;border-radius:2px}
h1,h2,h3,p{margin:0}
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.skip-link{position:absolute;left:var(--pad);top:-4rem;padding:.6rem 1rem;background:var(--tile);color:var(--ink);border:2px solid var(--active);border-radius:var(--radius);z-index:10}
.skip-link:focus{top:.75rem}
.wrap{max-width:76rem;margin:0 auto;padding-inline:max(var(--pad),env(safe-area-inset-left)) max(var(--pad),env(safe-area-inset-right))}
.bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.5rem 1.5rem}
.site-header .bar{min-height:4.5rem}
.brand{font-weight:700;font-size:1.35rem;letter-spacing:-.01em;color:var(--ink);text-decoration:none;display:inline-flex;align-items:center;min-height:44px}
.nav{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:0 1.25rem}
.nav a{display:inline-flex;align-items:center;min-height:44px;color:var(--ink);text-decoration:none}
.nav a:hover{text-decoration:underline}
.hero{padding-block:clamp(2.5rem,7vw,6rem) clamp(2rem,4vw,3.5rem)}
.hero h1{font-size:clamp(2.25rem,1.6rem + 2.6vw,3.6rem);line-height:1.08;font-weight:700;letter-spacing:-.015em;max-width:20ch;text-wrap:balance}
.intro{margin-top:1.25rem;max-width:64ch;color:var(--muted);font-size:1.2rem}
.mosaic{list-style:none;margin:0;padding:0;display:grid;gap:var(--gap)}
.tile{display:flex}
.tile-link{flex:1;display:flex;flex-direction:column;gap:.6rem;padding:1.5rem;background:var(--tile);color:var(--ink);text-decoration:none;border:1px solid var(--rule);border-radius:var(--radius);box-shadow:inset 0 0 0 1px transparent;transition:border-color .12s,box-shadow .12s}
a.tile-link:hover,a.tile-link:focus-visible{border-color:var(--active);box-shadow:inset 0 0 0 1px var(--active);outline:none}
.tile-name{font-size:1.4rem;line-height:1.2;font-weight:700}
.tile-text{color:var(--muted);max-width:52ch}
.tile-status{margin-top:auto;padding-top:.5rem;font-size:.95rem;font-weight:700}
.tile-status[data-status=live]{color:var(--live)}
.tile-status[data-status=dev]{color:var(--dev)}
.tile-app .tile-name{font-size:clamp(1.6rem,1.2rem + 1.4vw,2.4rem);letter-spacing:-.01em}
.tile-app .tile-text{font-size:1.2rem}
.tile-facts{margin:.5rem 0 0;padding:1rem 0 0;list-style:none;border-top:1px solid var(--rule);display:grid;gap:.6rem;max-width:52ch}
.tile-facts li{padding-left:1rem;border-left:2px solid var(--active)}
@media (min-width:720px){
.mosaic{grid-template-columns:2fr 1fr 1fr;grid-template-rows:auto auto}
.tile-app{grid-column:1;grid-row:1/3}
.tile-app .tile-link{padding:2.25rem}
.tile-search{grid-column:2/4;grid-row:1}
.tile-packages{grid-column:2;grid-row:2}
.tile-bench{grid-column:3;grid-row:2}}
.work,.contact{padding-top:var(--section)}
.work h2,.contact h2{font-size:1.6rem;line-height:1.2;font-weight:700}
.work-list{margin-top:1.5rem;display:grid;gap:1.75rem 3rem}
@media (min-width:900px){.work-list{grid-template-columns:repeat(3,minmax(0,1fr))}}
.work-item h3{font-size:1.15rem;font-weight:700}
.work-item p{margin-top:.4rem;color:var(--muted);max-width:64ch}
.contact p{margin-top:.75rem;max-width:64ch}
.email a{font-size:1.35rem;font-weight:700;display:inline-flex;align-items:center;min-height:44px}
.site-footer{margin-top:var(--section);padding-block:1.5rem max(1.5rem,env(safe-area-inset-bottom));color:var(--muted);font-size:.95rem}
.site-footer a{display:inline-flex;align-items:center;min-height:44px}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`
  .replace(/\n/g, "")
  .trim();
