# Fork status

Genere par `scripts/fork-pipeline.ts` (fr1, toutes les 15 min). Ne pas editer. Politique : [POLICY.md](POLICY.md).

Briques utilisees : gh API with ETag cache and `gh repo sync`; `aphrody-heavy` on fr1; failure triage through `packages/ai-os`.
Non utilisees : `packages/deploy` (deploie des sites, pas des forks), `vercel-labs/wterm` ; `third_party/vercel-ai` n est atteint que via `packages/ai-os`.

| fork | kind | upstream sha | fork sha | behind/ahead | last action | last PR | open issues |
| --- | --- | --- | --- | --- | --- | --- | --- |
| aphrody-labs/next.js | patched | 8d1f4ed9c010 | 7f5aded5bbb6 | 0/6 | noop | - | 0 |
| aphrody-labs/bun | patched | 9098897a1737 | b6c3f857f7b7 | 0/25 | noop | - | 0 |
| aphrody-labs/agent-browser | mirror | f18b8bb5275e | f18b8bb5275e | 6/0 | fast-forwarded | - | 0 |
| aphrody-labs/A2A | mirror | 4d7cda4b1754 | 2ae117a6a74e | 2/1 | diverged: fork has 1 own commit(s); declare kind = "patched" to rebase | - | 0 |
| aphrody-labs/terminal-control | mirror | 6c255aa4816d | 6c255aa4816d | 0/0 | noop | - | 0 |
| aphrody-labs/apify-cli | mirror | d4da6ec9841e | d4da6ec9841e | 0/0 | noop | - | 0 |
| aphrody-labs/apify-client-js | mirror | 9bd0044eeb3e | 9bd0044eeb3e | 0/0 | noop | - | 0 |
| aphrody-labs/apify-client-python | mirror | ddabc699366e | ddabc699366e | 0/0 | noop | - | 0 |
| aphrody-labs/apify-sdk-js | mirror | 92b44dbeac4b | 92b44dbeac4b | 0/0 | noop | - | 0 |
| aphrody-labs/apify-sdk-python | mirror | ce0f22911a99 | ce0f22911a99 | 0/0 | noop | - | 0 |
| aphrody-labs/crawlee | mirror | a972548a5f39 | a972548a5f39 | 0/0 | noop | - | 0 |
| aphrody-labs/crawlee-python | mirror | aa591bb51423 | aa591bb51423 | 0/0 | noop | - | 0 |
| aphrody-labs/russh-sftp | mirror | 2ef937985fa9 | 2ef937985fa9 | 0/0 | noop | - | 0 |
| aphrody-labs/CachyOS-PKGBUILDS | mirror | 8a0dd4b0b0fc | 8a0dd4b0b0fc | 0/0 | noop | - | 0 |
| aphrody-labs/kernel-patches | mirror | 21d721415790 | 21d721415790 | 0/0 | noop | - | 0 |
| aphrody-labs/linux-cachyos | mirror | 13814d541553 | 13814d541553 | 0/0 | noop | - | 0 |
| aphrody-labs/chrome-devtools-mcp | mirror | 8ba2ac945eba | 8ba2ac945eba | 0/0 | noop | - | 0 |
| aphrody-labs/CLI11 | mirror | 1764a057b760 | 1764a057b760 | 0/0 | noop | - | 0 |
| aphrody-labs/cmark | mirror | d56b4bdced75 | d56b4bdced75 | 0/0 | noop | - | 0 |
| aphrody-labs/crossterm | mirror | de206a81d686 | de206a81d686 | 0/0 | noop | - | 0 |
| aphrody-labs/liquorix-package | mirror | 7bc11a3ceff9 | 7bc11a3ceff9 | 0/0 | noop | - | 0 |
| aphrody-labs/glob-match | mirror | d5a6c671b73f | d5a6c671b73f | 0/0 | noop | - | 0 |
| aphrody-labs/anyrender | mirror | 155a76a31e8f | 155a76a31e8f | 1/0 | fast-forwarded | - | 0 |
| aphrody-labs/blitz | mirror | e7cca1d37162 | e7cca1d37162 | 0/0 | noop | - | 0 |
| aphrody-labs/dioxus | mirror | 97adf7915e1a | 97adf7915e1a | 0/0 | noop | - | 0 |
| aphrody-labs/dioxus-components | mirror | 9a758255ea26 | 9a758255ea26 | 0/0 | noop | - | 0 |
| aphrody-labs/dxvk | mirror | d93875103d40 | d93875103d40 | 0/0 | noop | - | 0 |
| aphrody-labs/emscripten | mirror | 29549afa8c3e | 29549afa8c3e | 0/0 | noop | - | 0 |
| aphrody-labs/emsdk | mirror | 708dcbcc9ee2 | 708dcbcc9ee2 | 0/0 | noop | - | 0 |
| aphrody-labs/musl | mirror | 85e0e3519655 | 85e0e3519655 | 0/0 | noop | - | 0 |
| aphrody-labs/posixtestsuite | mirror | 85555325079e | 85555325079e | 0/0 | noop | - | 0 |
| aphrody-labs/lore | mirror | d3c31145bbc2 | d3c31145bbc2 | 0/0 | noop | - | 0 |
| aphrody-labs/UnrealEngine | mirror | f45729c0b6f0 | f45729c0b6f0 | 0/0 | noop | - | 0 |
| aphrody-labs/russh | mirror | b541663a8838 | a9f644259fa5 | 0/2 | noop | - | 0 |
| aphrody-labs/gamemode | mirror | a74b8106a223 | a74b8106a223 | 0/0 | noop | - | 0 |
| aphrody-labs/MangoHud | mirror | 791f92016625 | 791f92016625 | 0/0 | noop | - | 0 |
| aphrody-labs/fmt | mirror | efc2423b9302 | efc2423b9302 | 0/0 | noop | - | 0 |
| aphrody-labs/wgpu | mirror | 12788112433a | 12788112433a | 0/0 | noop | - | 0 |
| aphrody-labs/design.md | mirror | 1ed38aa9dd44 | 1ed38aa9dd44 | 0/0 | noop | - | 0 |
| aphrody-labs/jules-action | mirror | bff7875eaa12 | 8be62dd5901b | 0/1 | noop | - | 0 |
| aphrody-labs/jules-awesome-list | mirror | 0118486377fd | 0118486377fd | 0/0 | noop | - | 0 |
| aphrody-labs/jules-sdk | mirror | 19fc117ac5cb | 19fc117ac5cb | 0/0 | noop | - | 0 |
| aphrody-labs/jules-skills | mirror | 7a76d3bfcf42 | 7a76d3bfcf42 | 0/0 | noop | - | 0 |
| aphrody-labs/stax | mirror | 4faa444b0672 | 4faa444b0672 | 0/0 | noop | - | 0 |
| aphrody-labs/stitch-sdk | mirror | f6aa86cde10c | f6aa86cde10c | 0/0 | noop | - | 0 |
| aphrody-labs/stitch-skills | mirror | 0337446dadde | 0337446dadde | 0/0 | noop | - | 0 |
| aphrody-labs/dawn | mirror | 12c86c40d485 | 12c86c40d485 | 0/0 | noop | - | 0 |
| aphrody-labs/chrome-for-testing | mirror | 3c9ff76dbdb7 | 3c9ff76dbdb7 | 0/0 | noop | - | 0 |
| aphrody-labs/gradle | mirror | a7f31331a144 | a7f31331a144 | 0/0 | noop | - | 0 |
| aphrody-labs/obscura | mirror | 0d9a2f764ffd | 0d9a2f764ffd | 0/0 | noop | - | 0 |
| aphrody-labs/vkd3d-proton | mirror | 5b1089c89dbc | 5b1089c89dbc | 0/0 | noop | - | 0 |
| aphrody-labs/jni-rs | mirror | dbfb17647988 | dbfb17647988 | 0/0 | noop | - | 0 |
| aphrody-labs/tui-markdown | mirror | 95a2ac2e20bf | 95a2ac2e20bf | 0/0 | noop | - | 0 |
| aphrody-labs/Vulkan-Headers | mirror | b26454f3ccd6 | b26454f3ccd6 | 0/0 | noop | - | 0 |
| aphrody-labs/Vulkan-Loader | mirror | 0b137080f608 | 0b137080f608 | 0/0 | noop | - | 0 |
| aphrody-labs/Vulkan-Tools | mirror | 1d3fbab1ff5a | 1d3fbab1ff5a | 0/0 | noop | - | 0 |
| aphrody-labs/Vulkan-ValidationLayers | mirror | 5a2873f664ec | 5a2873f664ec | 0/0 | noop | - | 0 |
| aphrody-labs/ghidra-decompiler | mirror | 268c3a406d8d | 268c3a406d8d | 0/0 | noop | - | 0 |
| aphrody-labs/steamroom | mirror | 21ba4f8b2117 | 21ba4f8b2117 | 0/0 | noop | - | 0 |
| aphrody-labs/lfs | mirror | 581459fa3041 | 230818516003 | 0/29 | noop | - | 0 |
| aphrody-labs/gpui-kit | mirror | 4379eebf2614 | 4379eebf2614 | 0/0 | noop | - | 0 |
| aphrody-labs/nsh | mirror | 9efc3a2cd5bb | bdd07024661d | 0/0 | noop | - | 0 |
| aphrody-labs/DirectX-Headers | mirror | 61c7718954ec | 61c7718954ec | 0/0 | noop | - | 0 |
| aphrody-labs/DirectXShaderCompiler | mirror | 49fea47e722b | 49fea47e722b | 0/0 | noop | - | 0 |
| aphrody-labs/GSL | mirror | a4651c0f995d | a4651c0f995d | 0/0 | noop | - | 0 |
| aphrody-labs/playwright | mirror | b4d016aadc5c | b4d016aadc5c | 0/0 | noop | - | 0 |
| aphrody-labs/playwright-mcp | mirror | 78eca85361ef | 78eca85361ef | 0/0 | noop | - | 0 |
| aphrody-labs/playwright-python | mirror | 86a5f5a81010 | 86a5f5a81010 | 0/0 | noop | - | 0 |
| aphrody-labs/libsla | mirror | 0a4b0d7b9fce | 0a4b0d7b9fce | 0/0 | noop | - | 0 |
| aphrody-labs/sleigh-compiler | mirror | f461dea27fe1 | f461dea27fe1 | 0/0 | noop | - | 0 |
| aphrody-labs/firefox | mirror | c72617c01649 | c72617c01649 | 0/0 | noop | - | 0 |
| aphrody-labs/ghidra | mirror | 42db038f3c88 | 42db038f3c88 | 0/0 | noop | - | 0 |
| aphrody-labs/ghidra-data | mirror | 3c67d74969e9 | 3c67d74969e9 | 0/0 | noop | - | 0 |
| aphrody-labs/node | mirror | 0b4d0ac5a28d | 0b4d0ac5a28d | 0/0 | noop | - | 0 |
| aphrody-labs/jsoncpp | mirror | 93acc7b15504 | 93acc7b15504 | 0/0 | noop | - | 0 |
| aphrody-labs/umu-launcher | mirror | e2b203a1fdd2 | e2b203a1fdd2 | 0/0 | noop | - | 0 |
| aphrody-labs/WebKit | mirror | 260715a0e779 | 260715a0e779 | 0/0 | noop | - | 0 |
| aphrody-labs/puppeteer | mirror | 12348e4e06f4 | 12348e4e06f4 | 0/0 | noop | - | 0 |
| aphrody-labs/pyo3 | mirror | b3fd214929cb | b3fd214929cb | 0/0 | noop | - | 0 |
| aphrody-labs/quinn | mirror | c7b46a969cd3 | c7b46a969cd3 | 0/0 | noop | - | 0 |
| aphrody-labs/rio | mirror | 93983b78bbc9 | 93983b78bbc9 | 0/0 | noop | - | 0 |
| aphrody-labs/ratatui | mirror | 41c26a74b3bc | 41c26a74b3bc | 0/0 | noop | - | 0 |
| aphrody-labs/scx | mirror | 8820f95ed56d | 8820f95ed56d | 0/0 | noop | - | 0 |
| aphrody-labs/cridecoder | mirror | 7a664164f44e | 7a664164f44e | 0/0 | noop | - | 0 |
| aphrody-labs/servo | mirror | af5f54ba7609 | af5f54ba7609 | 0/0 | noop | - | 0 |
| aphrody-labs/artcraft | mirror | 84a6a7dcf5cc | 79d87b2b54b5 | 22/0 | blocked: HTTP 403: Repository was archived so is read-only. (https://api.github.com/repos/aphrody-labs/artcraft/merge-upstream) | - | 0 |
| aphrody-labs/linux | mirror | aacb77975041 | aacb77975041 | 0/0 | noop | - | 0 |
| aphrody-labs/bazzite | mirror | ce9229d7b3b9 | ce9229d7b3b9 | 0/0 | noop | - | 0 |
| aphrody-labs/GameNetworkingSockets | mirror | d534c19aa760 | d534c19aa760 | 0/0 | noop | - | 0 |
| aphrody-labs/gamescope | mirror | 56603967059a | 56603967059a | 13/2831 | diverged: fork has 2831 own commit(s); declare kind = "patched" to rebase | - | 0 |
| aphrody-labs/Proton | mirror | 1f089f5610a8 | 1f089f5610a8 | 0/0 | noop | - | 0 |
| aphrody-labs/steam-devices | mirror | 22ec85e5ff5e | 22ec85e5ff5e | 0/0 | noop | - | 0 |
| aphrody-labs/wterm | mirror | 1a42b3c652e5 | 1a42b3c652e5 | 0/0 | noop | - | 0 |
| aphrody-labs/wayland | mirror | - | - | ?/? | error: wayland/wayland@main: HTTP 404 | - | 0 |
| aphrody-labs/binaryen | mirror | 5d31e56e852d | 5d31e56e852d | 0/0 | noop | - | 0 |
| aphrody-labs/component-model | mirror | dd1fefc0c618 | dd1fefc0c618 | 0/0 | noop | - | 0 |
| aphrody-labs/design | mirror | 6e43416ebc8b | 6e43416ebc8b | 0/0 | noop | - | 0 |
| aphrody-labs/esm-integration | mirror | ca15ef3d3fb3 | ca15ef3d3fb3 | 0/0 | noop | - | 0 |
| aphrody-labs/js-promise-integration | mirror | 5b247b1026d2 | 5b247b1026d2 | 0/0 | noop | - | 0 |
| aphrody-labs/shared-everything-threads | mirror | de560922268c | de560922268c | 0/0 | noop | - | 0 |
| aphrody-labs/spec | mirror | 943c5df07e84 | 943c5df07e84 | 0/0 | noop | - | 0 |
| aphrody-labs/tool-conventions | mirror | 25aceba5adba | 25aceba5adba | 0/0 | noop | - | 0 |
| aphrody-labs/wabt | mirror | 4fbd7198c766 | 4fbd7198c766 | 0/0 | noop | - | 0 |
| aphrody-labs/wasi-libc | mirror | 4ec32c508731 | 4ec32c508731 | 0/0 | noop | - | 0 |
| aphrody-labs/wasi-sdk | mirror | 0f85552f2cc7 | 0f85552f2cc7 | 0/0 | noop | - | 0 |
| aphrody-labs/wasi-webgpu | mirror | 6a776bada0b6 | 6a776bada0b6 | 0/0 | noop | - | 0 |
| aphrody-labs/wasm-c-api | mirror | 9d6b93764ac9 | 9d6b93764ac9 | 0/0 | noop | - | 0 |
| aphrody-labs/wine | mirror | 9f8c4ae4d35c | 9f8c4ae4d35c | 0/0 | noop | - | 0 |
| aphrody-labs/z3 | mirror | 1a1d88dde7cc | 1a1d88dde7cc | 0/0 | noop | - | 0 |
| aphrody-labs/embedded_gpui | mirror | 28bc6d3d559b | 28bc6d3d559b | 0/0 | noop | - | 0 |
| aphrody-labs/zed | mirror | 56a157e5b01b | 56a157e5b01b | 0/0 | noop | - | 0 |
| aphrody-labs/webpack | mirror | b0939389f5a5 | b0939389f5a5 | 0/0 | noop | - | 0 |
| aphrody-labs/swc | mirror | df1c01862bbe | df1c01862bbe | 0/0 | noop | - | 0 |
| aphrody-labs/postcss | mirror | b6316e5d61e5 | b6316e5d61e5 | 0/0 | noop | - | 0 |
| aphrody-labs/taskr | mirror | 7a50e6e8c1fb | 7a50e6e8c1fb | 0/0 | noop | - | 0 |
| aphrody-labs/node-require-like | mirror | 2e82e0145fe7 | 2e82e0145fe7 | 0/0 | noop | - | 0 |
| aphrody-labs/modern-web-guidance-src | mirror | 5e5cd33a7738 | 5e5cd33a7738 | 0/0 | noop | - | 0 |
| aphrody-labs/wasm-bindgen | mirror | ce77fe15277c | ce77fe15277c | 0/0 | noop | - | 0 |
| aphrody-labs/ui | mirror | e62c9435fff7 | d35c84f981c0 | 8/1 | diverged: fork has 1 own commit(s); declare kind = "patched" to rebase | - | 0 |
| aphrody-labs/base-ui | mirror | 315eba7a3d8a | 0bef63e5fcb3 | 0/2 | noop | - | 0 |
| aphrody-labs/tailwindcss | mirror | b08bf83a3272 | 8ed754c0e837 | 0/2 | noop | - | 0 |
| aphrody-labs/better-auth | mirror | 3fa26c979160 | dcb9f084302f | 10/1 | diverged: fork has 1 own commit(s); declare kind = "patched" to rebase | - | 0 |
| aphrody-labs/Pulsar-Native | mirror | bf673839c57b | bf673839c57b | 1/0 | fast-forwarded | - | 0 |
| aphrody-labs/gpui-ce | mirror | f388375d03e6 | f388375d03e6 | 0/0 | noop | - | 0 |
| aphrody-labs/gpui-fast | mirror | 80be50164ada | 80be50164ada | 0/0 | noop | - | 0 |
| aphrody-labs/gpuix | mirror | 0ce4f41fca8f | 0ce4f41fca8f | 0/0 | noop | - | 0 |
| aphrody-labs/awesome-gpui | mirror | 802579ada517 | 802579ada517 | 0/0 | noop | - | 0 |
| aphrody-labs/create-gpui-app | mirror | 63fbe214da83 | 63fbe214da83 | 0/0 | noop | - | 0 |
