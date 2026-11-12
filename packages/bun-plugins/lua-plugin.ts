// SPDX-License-Identifier: Apache-2.0
// Sovereign Bun Plugin for Lua 5.2 Scripts & Compiled Chunks (.lua, .luac, .lua.bin)

export interface BunLuaPluginOptions {
  mode?: "source" | "ast" | "bytecode" | "eval";
  sandbox?: Record<string, any>;
}

export function luaPlugin(options: BunLuaPluginOptions = {}) {
  const mode = options.mode || "source";

  return {
    name: "bun-plugin-lua",
    setup(build: any) {
      build.onLoad(
        { filter: /\.(lua|luac|lua\.bin)$/ },
        async (args: { path: string }) => {
          const isBinary =
            args.path.endsWith(".luac") || args.path.endsWith(".lua.bin");

          if (isBinary) {
            const file = (globalThis as any).Bun?.file(args.path);
            const buffer = file
              ? new Uint8Array(await file.arrayBuffer())
              : new Uint8Array(
                  await (await import("node:fs/promises")).readFile(args.path),
                );

            const isLua52 =
              buffer.length >= 18 &&
              buffer[0] === 0x1b &&
              buffer[1] === 0x4c &&
              buffer[2] === 0x75 &&
              buffer[3] === 0x61 &&
              buffer[4] === 0x52;

            return {
              contents: `export default new Uint8Array(${JSON.stringify(Array.from(buffer))});\nexport const isLua52 = ${isLua52};\nexport const byteLength = ${buffer.length};`,
              loader: "js",
            };
          }

          const file = (globalThis as any).Bun?.file(args.path);
          const source = file
            ? await file.text()
            : await (
                await import("node:fs/promises")
              ).readFile(args.path, "utf8");

          let exportedContent = "";

          if (mode === "source") {
            exportedContent = `export default ${JSON.stringify(source)};\nexport const rawSource = ${JSON.stringify(source)};`;
          } else if (mode === "eval") {
            exportedContent = `
const _source = ${JSON.stringify(source)};
export const rawSource = _source;
export default { source: _source, mode: "eval" };
`;
          } else {
            exportedContent = `export default { source: ${JSON.stringify(source)}, path: ${JSON.stringify(args.path)} };`;
          }

          return {
            contents: exportedContent,
            loader: "js",
          };
        },
      );
    },
  };
}

export function registerLuaPlugin(options: BunLuaPluginOptions = {}) {
  const Bun = (globalThis as any).Bun;
  if (Bun && typeof Bun.plugin === "function") {
    Bun.plugin(luaPlugin(options));
  }
}
