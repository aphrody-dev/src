// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { DesignSystemState } from "../../model/spec.js";

// ── TAILWIND v4 THEME DATA SCHEMA ────────────────────────────────────
// Category-keyed record of CSS-variable name → value strings.
// The serializer flattens this into an `@theme { ... }` block.
export interface TailwindV4ThemeData {
  colors?: Record<string, string> | undefined;
  fontFamily?: Record<string, string> | undefined;
  fontSize?: Record<string, string> | undefined;
  lineHeight?: Record<string, string> | undefined;
  letterSpacing?: Record<string, string> | undefined;
  fontWeight?: Record<string, string> | undefined;
  borderRadius?: Record<string, string> | undefined;
  spacing?: Record<string, string> | undefined;
}

export type TailwindV4EmitterResult =
  | { success: true; data: { theme: TailwindV4ThemeData } }
  | { success: false; error: { code: string; message: string } };

// ── INTERFACE ──────────────────────────────────────────────────────
export interface TailwindV4EmitterSpec {
  execute(state: DesignSystemState): TailwindV4EmitterResult;
}
