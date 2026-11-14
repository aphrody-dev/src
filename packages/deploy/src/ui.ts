// Shared chrome of aphrody.com and aphrody.app: themes dawn (light) and ember (dark) from packages/design, a theme
// switch, and the WebGPU hero (a lit 3D sun sphere over four parallax hill layers, drawn by one fragment shader).
// Both scripts are plain JS strings so the Worker (aphrody.app, CSP script-src 'self') can serve them as /_/theme.js
// and /_/hero.js and the aphrody.com build can emit them as files. No colour is written in CSS: roles only; the
// shader reads the same roles at run time and again when the theme changes.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { catalogs } from "../../i18n/src/index.ts";

const NOTES = Object.fromEntries(
  Object.entries(catalogs).map(([l, c]) => [
    l,
    (c as Record<string, string>)["home.hero.note"],
  ]),
);
const HERO_STYLE =
  ".hero-gl{position:absolute;inset:0;width:100%;height:100%;display:block}[data-hero=gpu] use:not(.stars):not(.volt),[data-hero=gpu] .bg{display:none}.hero-note{position:absolute;z-index:2;left:16px;bottom:12px;max-width:min(56ch,calc(100% - 32px));margin:0;padding:8px 14px;border-radius:var(--md-sys-shape-corner-medium);background:var(--md-sys-color-surface-container-highest);color:var(--md-sys-color-on-surface);font:.8125rem/1.25 inherit}";
/** Themes dawn and ember from packages/design/tokens/themes.css: the plain blocks only. */
export function themeBlocks(root: string): string {
  const f = join(root, "packages", "design", "tokens", "themes.css");
  if (!existsSync(f)) return "";
  const css = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  return [...css.matchAll(/:root\[data-theme="(?:dawn|ember)"\]\s*\{[^}]*\}/g)]
    .map((m) => m[0])
    .join("\n");
}

/** Inline head snippet: data-theme from the stored choice, else the system scheme (no flash). */
/** Inline head snippet of aphrody.com (system scheme, no flash); the stored choice is applied again by theme.js. */
export const THEME_APPLY =
  'document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme:dark)").matches?"ember":"dawn"';

/** Full apply (stored choice, else system scheme), used by the scripts and as the blocking head script of aphrody.app. */
const APPLY_FULL =
  'var r=document.documentElement,v;try{v=localStorage.getItem("aphrody-theme")}catch(x){}r.dataset.theme=v==="dark"||(v!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches)?"ember":"dawn"';

/** Theme script: the snippet above, system scheme changes, and the click on [data-theme-toggle]. */
export const THEME_JS = `(function(){${APPLY_FULL};var m=matchMedia("(prefers-color-scheme:dark)"),k="aphrody-theme";function sync(){document.querySelectorAll("[data-theme-toggle]").forEach(function(b){b.setAttribute("aria-pressed",String(r.dataset.theme==="ember"))})}function a(){var s;try{s=localStorage.getItem(k)}catch(x){}r.dataset.theme=s==="dark"||(s!=="light"&&m.matches)?"ember":"dawn";sync()}a();m.addEventListener("change",a);document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-theme-toggle]");if(!b)return;try{localStorage.setItem(k,r.dataset.theme==="ember"?"light":"dark")}catch(x){}a()})})();`;

const WGSL = `
struct U{res:vec2f,t:f32,dark:f32,ptr:vec2f,pad:vec2f,top:vec4f,bot:vec4f,sun:vec4f,h:array<vec4f,4>}
@group(0) @binding(0) var<uniform> u:U;
@vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f{
  let p=vec2f(f32((i<<1u)&2u),f32(i&2u));
  return vec4f(p*2.0-1.0,0.0,1.0);
}
fn hash(p:vec2f)->f32{return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453);}
fn noise(x:f32)->f32{
  let i=floor(x);let f=fract(x);let w=f*f*(3.0-2.0*f);
  return mix(hash(vec2f(i,0.0)),hash(vec2f(i+1.0,0.0)),w);
}
fn ridge(x:f32,s:f32)->f32{return noise(x+s)*0.6+noise(x*2.3+s*3.0)*0.3+noise(x*5.1+s*7.0)*0.1;}
@fragment fn fs(@builtin(position) fc:vec4f)->@location(0) vec4f{
  let asp=u.res.x/u.res.y;
  let uv=vec2f(fc.x/u.res.x,1.0-fc.y/u.res.y);
  let p=vec2f((uv.x-0.5)*asp,uv.y);
  var col=mix(u.bot.rgb,u.top.rgb,pow(uv.y,0.85));
  // stars (dark theme only)
  if(u.dark>0.5&&uv.y>0.45){
    let g=p*vec2f(70.0,70.0);let c=floor(g);let h=hash(c);
    if(h>0.986){let d=length(fract(g)-vec2f(0.5));col+=vec3f(1.0)*(1.0-smoothstep(0.0,0.22,d))*(0.45+0.45*sin(u.t*2.0+h*60.0));}
  }
  // lit sphere sun: analytic sphere, key light follows the pointer, banded surface, rim and glow
  let sunc=vec2f(min(0.34*asp,0.5*asp-0.21)+u.ptr.x*0.02,select(0.62,0.87,asp<1.0)+u.ptr.y*0.015);
  let q=p-sunc;let r=select(0.17,0.115,asp<1.0);let d2=dot(q,q);let len=sqrt(d2);
  col+=u.sun.rgb*exp(-len*3.4)*0.5;
  let ang=atan2(q.y,q.x);
  let ring=(1.0-smoothstep(0.0,0.004,abs(len-r*1.45)))*(0.5+0.5*sin(ang*12.0+u.t*0.5))*0.45
          +(1.0-smoothstep(0.0,0.004,abs(len-r*2.05)))*(0.5+0.5*sin(ang*7.0-u.t*0.35))*0.3;
  col+=u.sun.rgb*ring;
  if(d2<r*r){
    let z=sqrt(r*r-d2);let n=vec3f(q.x,q.y,-z)/r;
    let L=normalize(vec3f(-0.5+u.ptr.x*0.4,0.6+u.ptr.y*0.3,-0.7));
    let dif=max(dot(n,L),0.0);
    let spec=pow(max(dot(reflect(-L,n),vec3f(0.0,0.0,-1.0)),0.0),36.0);
    let rim=pow(1.0-(-n.z),3.0);
    let band=0.5+0.5*sin(q.y*30.0+u.t*0.6+sin(q.x*10.0)*1.5);
    var s=u.sun.rgb*(0.5+0.65*dif)*(0.94+0.06*band);
    s+=vec3f(1.0,0.96,0.85)*spec*0.55+u.sun.rgb*rim*0.35;
    let edge=(1.0-smoothstep(r-0.003,r,len));
    col=mix(col,s,edge);
  }
  // four hill layers, back to front, parallax from the pointer
  for(var i=0;i<4;i++){
    let fi=f32(i);
    let base=0.36-fi*0.075;let amp=0.075-fi*0.014;
    let x=p.x*(1.1+fi*0.55)+u.ptr.x*(0.12+0.1*fi)+fi*13.0;
    let y=base+amp*(ridge(x,fi*5.0)-0.5)*2.0+0.012*sin(u.t*0.4+fi);
    let m=(1.0-smoothstep(y-0.0035,y+0.0035,uv.y));
    col=mix(col,u.h[i].rgb,m);
  }
  return vec4f(col,1.0);
}`;

/** Hero script. Needs an element [data-hero] holding a [data-hero-stage]; on success sets data-hero="gpu" (the DOM
 * keeps a still illustration underneath), on any failure data-hero="fallback" with data-why and shows .hero-note. */
export const HERO_JS = `(async function(){var hero=document.querySelector(".hero,.hero-art");if(!hero)return;var stage=hero.querySelector("[data-hero-stage],.scene")||hero;var st=document.createElement("style");st.textContent=${JSON.stringify(HERO_STYLE)};document.head.appendChild(st);var NOTES=${JSON.stringify(NOTES)};
function fail(w){hero.dataset.hero="fallback";hero.dataset.why=w;var n=document.createElement("p");n.className="hero-note";n.setAttribute("role","status");n.textContent=NOTES[document.documentElement.lang]||NOTES.en;hero.appendChild(n)}
if(!navigator.gpu)return fail("no-webgpu");
if(matchMedia("(forced-colors:active)").matches)return fail("forced-colors");
try{
var ad=await navigator.gpu.requestAdapter();if(!ad)return fail("no-adapter");
var dev=await ad.requestDevice();var lost=false;dev.lost.then(function(){lost=true;fail("device-lost")});
var cv=document.createElement("canvas");cv.className="hero-gl";cv.setAttribute("aria-hidden","true");stage.insertBefore(cv,stage.firstChild);
var cx=cv.getContext("webgpu");var fmt=navigator.gpu.getPreferredCanvasFormat();cx.configure({device:dev,format:fmt,alphaMode:"opaque"});
var mod=dev.createShaderModule({code:${JSON.stringify(WGSL)}});
var pipe=await dev.createRenderPipelineAsync({layout:"auto",vertex:{module:mod,entryPoint:"vs"},fragment:{module:mod,entryPoint:"fs",targets:[{format:fmt}]},primitive:{topology:"triangle-list"}});
var buf=dev.createBuffer({size:144,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
var bg=dev.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:buf}}]});
var data=new Float32Array(36);var ptr=[0,0],tgt=[0,0];
function rgb(v){var e=document.createElement("i");e.style.color=v;stage.appendChild(e);var c=getComputedStyle(e).color;e.remove();var n=(c.match(/-?[\\d.]+/g)||[0,0,0]).map(Number),k=c.indexOf("color(")===0?1:255;return[n[0]/k,n[1]/k,n[2]/k,1]}
function colors(){var o=[rgb("var(--md-sys-color-primary-container)"),rgb("var(--md-sys-color-tertiary-container)"),rgb("var(--h1)"),rgb("var(--h2)"),rgb("var(--h3)"),rgb("var(--h4)")];data.set(o[0],8);data.set(o[1],12);data.set([1,.702,0,1],16);for(var i=0;i<4;i++)data.set(o[2+i],20+i*4);data[3]=document.documentElement.dataset.theme==="ember"?1:0}
colors();new MutationObserver(function(){colors();draw()}).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
var motion=!matchMedia("(prefers-reduced-motion:reduce)").matches,frames=0,t0=performance.now();
function size(){var d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(stage.clientWidth*d)),h=Math.max(1,Math.round(stage.clientHeight*d));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}data[0]=cv.width;data[1]=cv.height}
function draw(){if(lost)return;size();ptr[0]+=(tgt[0]-ptr[0])*.08;ptr[1]+=(tgt[1]-ptr[1])*.08;data[2]=motion?(performance.now()-t0)/1000:0;data[4]=motion?ptr[0]:0;data[5]=motion?ptr[1]:0;dev.queue.writeBuffer(buf,0,data);var enc=dev.createCommandEncoder();var pass=enc.beginRenderPass({colorAttachments:[{view:cx.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});pass.setPipeline(pipe);pass.setBindGroup(0,bg);pass.draw(3);pass.end();dev.queue.submit([enc.finish()]);frames++;hero.dataset.frames=String(frames);window.__heroFrames=frames}
addEventListener("pointermove",function(e){tgt[0]=e.clientX/innerWidth*2-1;tgt[1]=1-e.clientY/innerHeight*2});
new ResizeObserver(draw).observe(stage);
var vis=true;new IntersectionObserver(function(l){vis=l[0].isIntersecting}).observe(hero);
function loop(){if(vis&&!document.hidden)draw();requestAnimationFrame(loop)}
draw();hero.dataset.hero="gpu";if(motion)requestAnimationFrame(loop);
}catch(x){fail("error:"+(x&&x.message||x))}})();`;

/** CSS shared by both sites: theme switch, hero canvas and fallback note. Roles only. */
const THEME_RULES =
  ".theme-btn{flex:none;width:48px;height:48px;border:0;border-radius:var(--md-sys-shape-corner-full);background:transparent;color:var(--md-sys-color-on-surface);display:inline-grid;place-items:center;cursor:pointer}.theme-btn:hover{background:color-mix(in srgb,var(--md-sys-color-on-surface) 8%,transparent)}.theme-btn:focus-visible{outline:3px solid var(--md-sys-color-secondary);outline-offset:2px}.theme-btn svg{fill:currentColor}";
/** CSS of the theme switch for pages that render the button in markup (aphrody.app). */
export const UI_CSS = THEME_RULES;

const ICON =
  '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 2v14a7 7 0 0 1 0-14Z"/></svg>';

const LABELS = Object.fromEntries(
  Object.entries(catalogs).map(([l, c]) => [
    l,
    (c as Record<string, string>)["home.theme"],
  ]),
);
/** aphrody.com: the switch button is created by script (it does nothing without it) so the first HTML stays inside the 14 KB window. */
export const THEME_BTN_JS = `(function(){var h=document.querySelector(".bar");if(!h||document.querySelector("[data-theme-toggle]"))return;var L=${JSON.stringify(LABELS)};var s=document.createElement("style");s.textContent=${JSON.stringify(THEME_RULES + ".bar .theme-btn{position:absolute;right:16px;top:8px}")};document.head.appendChild(s);var b=document.createElement("button");b.className="theme-btn";b.type="button";b.setAttribute("data-theme-toggle","");b.setAttribute("aria-pressed",String(document.documentElement.dataset.theme==="ember"));b.setAttribute("aria-label",L[document.documentElement.lang]||L.en);b.innerHTML=${JSON.stringify(ICON)};h.appendChild(b)})();`;

/** One deferred file for aphrody.com: theme script, switch button, hero. */
export const HOME_JS = THEME_JS + THEME_BTN_JS + HERO_JS;

/** Theme switch button (sun and moon glyphs, Material Symbols outlines), label localized. */
export const themeButton = (label: string): string =>
  `<button class="theme-btn" type="button" data-theme-toggle aria-pressed="false" aria-label="${label.replace(/"/g, "&quot;")}"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 2v14a7 7 0 0 1 0-14Z"/></svg></button>`;
