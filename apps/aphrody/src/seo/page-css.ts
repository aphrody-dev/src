/**
 * CSS used only by content pages (topic hubs, package hubs, news, 404, search
 * results). It is inlined in a <style> element of those pages so the shared
 * stylesheet, which is part of the home page LCP budget, stays small.
 */

export function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([\{\}\:\;\,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

const RAW = `
.page-header{display:flex;align-items:center;justify-content:space-between;padding:8px max(24px,env(safe-area-inset-right)) 8px max(24px,env(safe-area-inset-left))}
.page-brand{display:inline-flex;align-items:center;min-height:48px;font-size:22px;font-weight:500;color:var(--m3-primary)}
.page-lang{display:inline-flex;align-items:center;min-height:48px;padding:0 16px;color:var(--m3-primary)}
main.page{max-width:840px;margin:0 auto;padding:8px max(24px,env(safe-area-inset-right)) 48px max(24px,env(safe-area-inset-left))}
.page h1{font-size:32px;line-height:40px;font-weight:400;margin:16px 0}
.page h2{font-size:22px;line-height:28px;font-weight:400;margin:24px 0 8px}
.lead{font-size:16px;line-height:24px;margin:8px 0 16px}
.points{margin:0 0 16px 24px}
.points li{margin:4px 0}
.crumbs ol,.link-list,.cards{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.crumbs li+li::before{content:"/";margin-right:8px;color:var(--text-secondary)}
.crumbs a,.link-list a{display:inline-flex;align-items:center;min-height:48px;color:var(--m3-primary)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.card{padding:16px;border-radius:12px;background:var(--m3-surfaceContainer)}
.card h2,.card h3{font-size:16px;line-height:24px;margin:0 0 4px}
.card code{display:block;margin-top:8px;overflow-wrap:anywhere;font-size:13px}
.page-footer{max-width:840px;margin:0 auto;padding:16px max(24px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(24px,env(safe-area-inset-left))}
.ad-slot{display:block;width:100%;min-height:280px;margin:24px 0;overflow:hidden;contain:strict}
@media (max-width:600px){.ad-slot{min-height:320px}}
`;

export const PAGE_CSS = minifyCss(RAW);
