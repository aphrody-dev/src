// SPDX-License-Identifier: Apache-2.0
// @aphrody/vault: one async API for every secret of src (docs/infra/VAULT.md).
export * from "./paths.ts";
export * from "./store.ts";
export { seal, open, isSealed, sealedWithHello, keyedFingerprint, b3, b3Files, masterKey, helloAvailable, HELLO_KEY, RESERVED, MASTER } from "./crypto.ts";
export * from "./age.ts";
export * from "./doc.ts";
export * from "./csv.ts";
export * from "./chrome.ts";
export * from "./sqlite.ts";
export * from "./shred.ts";
export * from "./hosts.ts";
export * from "./sync.ts";
export * from "./profiles.ts";
export * from "./migrate.ts";
export { helloStatus, helloEnroll, dpapiProtect as dpapiProtectRaw } from "./win/pool.ts";
