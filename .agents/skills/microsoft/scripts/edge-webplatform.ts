for (let v = 146; v <= 157; v++) {
  const r = await fetch(
    `https://learn.microsoft.com/en-us/microsoft-edge/web-platform/release-notes/${v}`,
    { headers: { "user-agent": "nt-research (bun)" } },
  );
  if (!r.ok) {
    console.log(v, r.status);
    continue;
  }
  const html = await r.text();
  const date =
    html.match(/releases on ([A-Z][a-z]{2}\.? \d+, \d{4})/)?.[1] ?? "";
  const heads = [...html.matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/g)]
    .map((m) => m[1]!.replace(/<[^>]+>/g, "").trim())
    .filter((h) =>
      /webgpu|wgsl|webassembly|wasm|webnn|gpu|hdr|canvas/i.test(h),
    );
  console.log(v, date, "|", heads.join(" ; "));
}
