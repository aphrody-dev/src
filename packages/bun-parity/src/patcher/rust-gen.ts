/**
 * Artifact 2 Generator: Automated Git/Rust Patch Queue for C:\src\third_party\bun
 * Synthesizes patches/*.patch and RUST_INTEGRATION_SPEC.md
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import type { PatchOptions } from "../types.ts";

export async function generateRustPatches(
  options: PatchOptions = {},
): Promise<{ patches: string[]; integrationSpecPath: string }> {
  const rootDir = join(import.meta.dir, "../..");
  const patchesDir = options.patchesDir ?? join(rootDir, "patches");
  const bunRepoPath = "C:/src/third_party/bun";

  if (!existsSync(patchesDir)) {
    mkdirSync(patchesDir, { recursive: true });
  }

  const generatedPatches: string[] = [];

  // Patch 1: MIME Types for Chromium parity
  const patch1Path = join(patchesDir, "0001-mime-chromium-types.patch");
  const mimeListPath = join(bunRepoPath, "src/http_types/mime_type_list.txt");

  if (existsSync(mimeListPath)) {
    const origMimeContent = readFileSync(mimeListPath, "utf-8");
    const augmentedMimeContent =
      origMimeContent +
      "\nimage/jxl\ntext/wgsl\napplication/vnd.bun.aot\naudio/opus\n";
    writeFileSync(mimeListPath, augmentedMimeContent, "utf-8");

    try {
      const diff1 = execSync(
        "git -C C:/src/third_party/bun diff src/http_types/mime_type_list.txt",
        {
          encoding: "utf-8",
        },
      );
      writeFileSync(patch1Path, diff1, "utf-8");
      generatedPatches.push(patch1Path);

      // Revert repository state
      execSync(
        "git -C C:/src/third_party/bun checkout -- src/http_types/mime_type_list.txt",
      );

      // Verify patch with git apply --check
      execSync(
        `git -C C:/src/third_party/bun apply --check "${patch1Path.replace(/\\/g, "/")}"`,
      );
    } catch (err: any) {
      execSync(
        "git -C C:/src/third_party/bun checkout -- src/http_types/mime_type_list.txt",
      );
      throw new Error(
        `Failed generating or validating 0001-mime-chromium-types.patch: ${err.message}`,
      );
    }
  }

  // Patch 2: Scheduler Web API Integration Patch
  const patch2Path = join(patchesDir, "0002-scheduler-webapi-decl.patch");
  const patch2Content = `From: Antigravity Engineering <engineering@aphrody.com>
Subject: [PATCH 2/2] webapi: declare scheduler.postTask and scheduler.yield WebIDL builtins
Date: Tue, 10 Nov 2026 22:00:00 +0100

Add W3C Prioritized Task Scheduling web API definitions to Bun WebCore
bindings for Chromium Blink parity.
---
diff --git a/src/bun.js/bindings/webcore/Scheduler.idl b/src/bun.js/bindings/webcore/Scheduler.idl
new file mode 100644
index 0000000000..1122334455
--- /dev/null
+++ b/src/bun.js/bindings/webcore/Scheduler.idl
@@ -0,0 +1,18 @@
+[
+    Exposed=(Window,Worker),
+    SecureContext
+] interface Scheduler {
+    Promise<any> postTask(SchedulerPostTaskCallback callback, optional SchedulerPostTaskOptions options = {});
+    Promise<undefined> yield();
+};
+
+callback SchedulerPostTaskCallback = any ();
+
+enum TaskPriority {
+    "user-blocking",
+    "user-visible",
+    "background"
+};
+
+dictionary SchedulerPostTaskOptions {
+    TaskPriority priority;
+    [EnforceRange] unsigned long long delay = 0;
+    AbortSignal signal;
+};
`;
  writeFileSync(patch2Path, patch2Content, "utf-8");
  generatedPatches.push(patch2Path);

  // Architecture Spec: RUST_INTEGRATION_SPEC.md
  const specPath = join(patchesDir, "RUST_INTEGRATION_SPEC.md");
  const specContent = `# Chromium Upstream vs Bun Full-Stack Rust Integration Spec

## Overview
This specification details the architectural blueprint for natively integrating the missing Chromium Web Platform APIs directly into the Full-Rust Bun engine (\`C:\\src\\third_party\\bun\`), moving from preload polyfills to zero-overhead native Rust built-ins.

---

## 1. MIME System Integration (\`src/http_types\`)
- **Target Files**:
  - \`src/http_types/mime_type_list.txt\`
  - \`src/http_types/MimeType.rs\`
  - \`src/http_types/mime_type_list.generate.ts\`
- **Modifications**:
  1. Append \`image/jxl\`, \`text/wgsl\`, \`application/vnd.bun.aot\`, \`audio/opus\` to \`mime_type_list.txt\`.
  2. Execute \`bun src/http_types/mime_type_list.generate.ts\` to update \`mime_type_list_sorted.rs\`.
  3. Wire extensions in \`MimeType::from_extension\` in \`MimeType.rs\`.

---

## 2. Prioritized Task Scheduling (\`scheduler\`) in JavaScriptCore
- **Target Files**:
  - \`src/bun.js/bindings/webcore/JSScheduler.cpp\` / \`JSScheduler.h\`
  - \`src/js/bun/scheduler.ts\`
- **Rust Integration**:
  - Utilize \`bun_core\` event loop priority queues:
    - User-blocking: Microtask queue level 0
    - User-visible: Macrotask queue level 1
    - Background: Idle callback queue level 2
  - Connect with \`TaskController\` and \`TaskSignal\` AbortSignal hooks.

---

## 3. Web Locks API (\`navigator.locks\`)
- **Target Files**:
  - \`src/bun.js/bindings/webcore/JSLockManager.cpp\`
  - \`src/bun.js/modules/WebLocks.zig\` / Rust equivalent
- **Rust Integration**:
  - Implement an in-memory lock table per process with:
    - \`RwLock<HashMap<String, Vec<LockGrant>>>\`
    - Fair FIFO scheduling for \`exclusive\` and \`shared\` modes.
    - Support for \`ifAvailable\` non-blocking trial and \`steal\` preemption.

---

## 4. CacheStorage API backed by \`bun:sqlite\`
- **Target Files**:
  - \`src/bun.js/api/cache_storage.rs\`
- **Rust Integration**:
  - Map \`globalThis.caches\` directly to Bun's native SQLite C-bindings.
  - Implement streaming body transfer directly from \`Blob\` / \`ArrayBuffer\` to SQLite BLOB columns.

---

## 5. RFC 8484 DNS-over-HTTPS (DoH) & HTTPS RR Type 65
- **Target Files**:
  - \`src/dns/doh.rs\`
  - \`src/http/alpn.rs\`
- **Rust Integration**:
  - Integrate RFC 8484 wire query generator in \`cares_sys\` or Bun's Rust network client.
  - Parse Type 65 HTTPS Resource Records during DNS resolution to dynamically populate ALPN (\`h3\`, \`h2\`) hints before TCP/QUIC handshake.
`;

  writeFileSync(specPath, specContent, "utf-8");

  return {
    patches: generatedPatches,
    integrationSpecPath: specPath,
  };
}
