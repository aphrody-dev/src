// Faits live (versions/dates) — usage: bun facts.ts <out.json>
const out = process.argv[2]!;
const token = (await Bun.$`gh auth token`.quiet().nothrow().text()).trim();
const UA = { "user-agent": "nt-research (bun)" };
const j = async (url: string, h: Record<string, string> = {}) => {
  const r = await fetch(url, { headers: { ...UA, ...h } });
  if (!r.ok) return { error: r.status, url };
  const t = await r.text();
  return JSON.parse(t.replace(/^\)\]\}'\n?/, ""));
};

const nugetIds = [
  "Microsoft.Direct3D.D3D12", "Microsoft.Direct3D.DXC", "Microsoft.Direct3D.WARP", "Microsoft.Direct3D.DirectStorage",
  "Microsoft.WindowsAppSDK", "Microsoft.Windows.CsWin32", "Microsoft.Windows.SDK.BuildTools", "Microsoft.Windows.CppWinRT",
  "Microsoft.Windows.ImplementationLibrary", "Microsoft.DotNet.ILCompiler", "Microsoft.Windows.SDK.NET.Ref",
  "Microsoft.NET.Runtime.WebAssembly.Sdk", "MSTest.Sdk", "Microsoft.Testing.Platform",
];
const crates = [
  "windows", "windows-sys", "windows-core", "windows-bindgen", "windows-window", "windows-reactor", "windows-link",
  "windows-metadata", "wdk", "wdk-sys", "wdk-build", "mimalloc", "hyperlight-host", "wgpu", "wasm-bindgen", "web-sys",
];
const ghRepos = [
  "oven-sh/bun", "microsoft/DirectXShaderCompiler", "microsoft/DirectX-Headers", "microsoft/windows-rs",
  "microsoft/windows-drivers-rs", "microsoft/openvmm", "hyperlight-dev/hyperlight", "microsoft/litebox", "microsoft/mxc",
  "microsoft/WindowsAppSDK", "microsoft/microsoft-ui-xaml", "microsoft/terminal", "microsoft/WSL", "microsoft/edit",
  "microsoft/mimalloc", "microsoft/STL", "microsoft/CsWin32", "microsoft/win32metadata", "dotnet/runtime", "dotnet/sdk",
  "microsoft/vcpkg", "microsoft/DirectStorage", "gfx-rs/wgpu", "gpuweb/gpuweb",
];

const nuget = Object.fromEntries(await Promise.all(nugetIds.map(async (id) => {
  const v = await j(`https://api.nuget.org/v3-flatcontainer/${id.toLowerCase()}/index.json`);
  const vs: string[] = v.versions ?? [];
  return [id, { latestStable: vs.filter((x) => !x.includes("-")).at(-1) ?? null, latest: vs.at(-1) ?? null, count: vs.length }];
})));

const cratesio = Object.fromEntries(await Promise.all(crates.map(async (c) => {
  const v = await j(`https://crates.io/api/v1/crates/${c}`);
  const k = v.crate ?? {};
  return [c, { max: k.max_stable_version ?? k.max_version ?? null, updated: k.updated_at?.slice(0, 10) ?? null, downloads: k.downloads ?? null }];
})));

const gh = Object.fromEntries(await Promise.all(ghRepos.map(async (r) => {
  const h = { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" };
  const [rel, repo] = await Promise.all([j(`https://api.github.com/repos/${r}/releases?per_page=3`, h), j(`https://api.github.com/repos/${r}`, h)]);
  return [r, {
    pushed: repo.pushed_at?.slice(0, 10), stars: repo.stargazers_count, license: repo.license?.spdx_id ?? null,
    releases: Array.isArray(rel) ? rel.map((x: any) => ({ tag: x.tag_name, date: x.published_at?.slice(0, 10), pre: x.prerelease })) : rel,
  }];
})));

const dotnetIdx = await j("https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/releases-index.json");
const dotnet = (dotnetIdx["releases-index"] ?? []).slice(0, 4).map((c: any) => ({
  channel: c["channel-version"], latestRelease: c["latest-release"], date: c["latest-release-date"], sdk: c["latest-sdk"],
  phase: c["support-phase"], type: c["release-type"], eol: c["eol-date"],
}));

const chrome = await j("https://chromestatus.com/api/v0/features?q=webgpu&num=40");
const webgpu = (chrome.features ?? []).map((f: any) => ({
  name: f.name, status: f.browsers?.chrome?.status?.text, desktop: f.browsers?.chrome?.desktop ?? null,
})).filter((f: any) => f.name);

const rustNightly = (await Bun.$`rustc +nightly -V`.quiet().nothrow().text()).trim();
const res = { fetchedAt: new Date().toISOString(), rustNightly, dotnet, nuget, cratesio, gh, webgpu };
await Bun.write(out, JSON.stringify(res, null, 1));
console.log(`ok ${out}: nuget ${nugetIds.length}, crates ${crates.length}, gh ${ghRepos.length}, webgpu ${webgpu.length}`);
