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

import type { Config } from "tailwindcss";
import type { DesignSystemState } from "../model/spec.js";

// ── TAILWIND CONFIG SCHEMA ──────────────────────────────────────────
export interface TailwindThemeExtend {
  colors?: Record<string, string> | undefined;
  fontFamily?: Record<string, string[]> | undefined;
  fontSize?: Record<string, [string, Record<string, string>]> | undefined;
  borderRadius?: Record<string, string> | undefined;
  spacing?: Record<string, string> | undefined;
}

export type TailwindEmitterResult =
  | { success: true; data: { theme: { extend: TailwindThemeExtend } } }
  | { success: false; error: { code: string; message: string } };

// ── INTERFACE ──────────────────────────────────────────────────────
export interface TailwindEmitterSpec {
  execute(state: DesignSystemState): TailwindEmitterResult;
}
