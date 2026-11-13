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

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const parse = (text: string): unknown => Bun.YAML.parse(text);

/**
 * DESIGN.md Spec Configuration
 *
 * THE single source of truth for the DESIGN.md format specification.
 * Both the linter and the spec generator read from this file.
 *
 * To change what the spec says:
 *   1. Edit spec-config.yaml
 *   2. Run `bun run spec:gen` to regenerate docs/spec.md
 *   3. Run `bun test` to verify linter alignment
 */

// ── Schema ────────────────────────────────────────────────────────────

interface PropertyDef {
  name: string;
  type: string;
  description?: string | undefined;
}

interface TypeDef {
  description: string;
  formats?: string[] | undefined;
  units?: string[] | undefined;
  note?: string | undefined;
  recommendation?: string | undefined;
}

export interface SpecConfig {
  version: string;
  limits: { max_token_nesting_depth: number; max_reference_depth: number };
  units: string[];
  types: Record<string, TypeDef>;
  sections: Array<{ canonical: string; aliases?: string[] | undefined }>;
  typography_properties: PropertyDef[];
  component_sub_tokens: PropertyDef[];
  color_roles: string[];
  recommended_tokens: Record<string, string[]>;
  examples: {
    colors: Record<string, string>;
    typography: Record<string, Record<string, string | number>>;
    components: Record<string, Record<string, string>>;
  };
}

// Structural check of the YAML (upstream used a zod schema; same rules, no runtime dependency).
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
function fail(path: string, want: string): never {
  throw new Error(`spec-config: ${path}: expected ${want}`);
}
function strArr(v: unknown, path: string, min = 0): string[] {
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string"))
    fail(path, "string[]");
  if (v.length < min) fail(path, `at least ${min} item(s)`);
  return v as string[];
}
function rec<T>(
  v: unknown,
  path: string,
  item: (x: unknown, p: string) => T,
): Record<string, T> {
  if (!isObj(v)) fail(path, "object");
  return Object.fromEntries(
    Object.entries(v).map(([k, x]) => [k, item(x, `${path}.${k}`)]),
  );
}
const str = (v: unknown, path: string): string =>
  typeof v === "string" ? v : fail(path, "string");
const optStr = (v: unknown, path: string) =>
  v === undefined ? undefined : str(v, path);
function props(v: unknown, path: string): PropertyDef[] {
  if (!Array.isArray(v) || v.length < 1) fail(path, "at least 1 item(s)");
  return v.map((x, i) => {
    if (!isObj(x)) fail(`${path}[${i}]`, "object");
    return {
      name: str(x.name, `${path}[${i}].name`),
      type: str(x.type, `${path}[${i}].type`),
      ...(x.description !== undefined && {
        description: str(x.description, `${path}[${i}].description`),
      }),
    };
  });
}
function validateConfig(raw: unknown): SpecConfig {
  if (!isObj(raw)) fail("(root)", "object");
  const limits =
    raw.limits === undefined
      ? {}
      : isObj(raw.limits)
        ? raw.limits
        : fail("limits", "object");
  const num = (v: unknown, d: number, p: string) =>
    v === undefined ? d : typeof v === "number" ? v : fail(p, "number");
  if (!Array.isArray(raw.sections) || raw.sections.length < 1)
    fail("sections", "at least 1 item(s)");
  if (!isObj(raw.examples)) fail("examples", "object");
  const ex = raw.examples;
  return {
    version: str(raw.version, "version"),
    limits: {
      max_token_nesting_depth: num(
        limits.max_token_nesting_depth,
        20,
        "limits.max_token_nesting_depth",
      ),
      max_reference_depth: num(
        limits.max_reference_depth,
        10,
        "limits.max_reference_depth",
      ),
    },
    units: strArr(raw.units, "units", 1),
    types: rec(raw.types, "types", (x, p) => {
      if (!isObj(x)) fail(p, "object");
      const out: TypeDef = {
        description: str(x.description, `${p}.description`),
      };
      if (x.formats !== undefined)
        out.formats = strArr(x.formats, `${p}.formats`);
      if (x.units !== undefined) out.units = strArr(x.units, `${p}.units`);
      if (x.note !== undefined) out.note = optStr(x.note, `${p}.note`);
      if (x.recommendation !== undefined)
        out.recommendation = optStr(x.recommendation, `${p}.recommendation`);
      return out;
    }),
    sections: raw.sections.map((s, i) => {
      if (!isObj(s)) fail(`sections[${i}]`, "object");
      return {
        canonical: str(s.canonical, `sections[${i}].canonical`),
        ...(s.aliases !== undefined && {
          aliases: strArr(s.aliases, `sections[${i}].aliases`),
        }),
      };
    }),
    typography_properties: props(
      raw.typography_properties,
      "typography_properties",
    ),
    component_sub_tokens: props(
      raw.component_sub_tokens,
      "component_sub_tokens",
    ),
    color_roles: strArr(raw.color_roles, "color_roles", 1),
    recommended_tokens: rec(
      raw.recommended_tokens,
      "recommended_tokens",
      (x, p) => strArr(x, p),
    ),
    examples: {
      colors: rec(ex.colors, "examples.colors", str),
      typography: rec(ex.typography, "examples.typography", (x, p) =>
        rec(x, p, (y, q) =>
          typeof y === "string" || typeof y === "number"
            ? y
            : fail(q, "string | number"),
        ),
      ),
      components: rec(ex.components, "examples.components", (x, p) =>
        rec(x, p, str),
      ),
    },
  };
}

// ── Load & Validate ──────────────────────────────────────────────────

export function loadSpecConfig(filePath?: string): SpecConfig {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const yamlPath = filePath
    ? resolve(filePath)
    : resolve(currentDir, "./spec-config.yaml");
  const raw = parse(readFileSync(yamlPath, "utf-8"));
  return validateConfig(raw);
}

// ── Lazy singleton ───────────────────────────────────────────────────
// Config is loaded on first access, not at module evaluation time.
// This prevents redundant file reads and provides a clean entry point
// for programmatic consumers who want to defer loading.

type ParsedConfig = ReturnType<typeof loadSpecConfig>;
let _cachedConfig: ParsedConfig | undefined;

/** Return the parsed spec config, loading and caching it on first call. */
export function getSpecConfig(): ParsedConfig {
  if (!_cachedConfig) {
    _cachedConfig = loadSpecConfig();
  }
  return _cachedConfig;
}

// ── Interfaces ───────────────────────────────────────────────────────

export interface SectionDef {
  /** The canonical section heading. */
  canonical: string;
  /** Acceptable alternative headings that resolve to this section. */
  aliases?: readonly string[] | undefined;
}

export interface TypographyPropertyDef {
  /** Property name as it appears in YAML. */
  name: string;
  /** Human-readable type for the spec document. */
  type: string;
  /** Extended description for the spec (appears after the type). */
  description?: string | undefined;
}

export interface ComponentSubTokenDef {
  /** Sub-token property name. */
  name: string;
  /** The type displayed in the spec (e.g., 'Color', 'Dimension'). */
  type: string;
  /** Extended description for the spec (appears after the type). */
  description?: string | undefined;
}

export interface TypeDef {
  /** One-sentence definition for the type. */
  description: string;
  /** Accepted formats rendered as a bullet list in the generated spec. */
  formats?: readonly string[] | undefined;
  /** Accepted units for dimensional types. */
  units?: readonly string[] | undefined;
  /** Additional normative or implementation note. */
  note?: string | undefined;
  /** Non-normative authoring recommendation. */
  recommendation?: string | undefined;
}

// ── Constant exports ─────────────────────────────────────────────────
// These are eagerly initialized from the lazy singleton on first import.
// The singleton cache ensures the YAML file is read exactly once.

const config = getSpecConfig();

/** Current spec version. Appears in the schema and the front matter example. */
export const SPEC_VERSION = config.version;

/** Performance and safety limits for the model handler. */
export const MAX_TOKEN_NESTING_DEPTH = config.limits.max_token_nesting_depth;
export const MAX_REFERENCE_DEPTH = config.limits.max_reference_depth;

/** Units the spec formally supports for Dimension values. */
export const STANDARD_UNITS = config.units;
export type StandardUnit = (typeof STANDARD_UNITS)[number];

/** Primitive type definitions rendered into the generated spec. */
export const SPEC_TYPES: Record<string, TypeDef> = config.types;

export const SECTIONS = config.sections;

export const TYPOGRAPHY_PROPERTIES: readonly TypographyPropertyDef[] =
  config.typography_properties;

export const COMPONENT_SUB_TOKENS: readonly ComponentSubTokenDef[] =
  config.component_sub_tokens;

/** Core color roles that every design system should define. */
export const CORE_COLOR_ROLES = config.color_roles;

/** Non-normative recommended token names, organized by category. */
export const RECOMMENDED_TOKENS = config.recommended_tokens;

/** Canonical examples that appear in the generated spec document. */
export const EXAMPLES = config.examples;

/** Primitive type definitions (Color, Dimension, etc.) for the spec document. */
export const PRIMITIVE_TYPES: Record<string, TypeDef> = config.types;

// ── Derived constants ─────────────────────────────────────────────────

/** Ordered list of canonical section names. */
export const CANONICAL_ORDER = SECTIONS.map((s) => s.canonical);

/** Map of alias → canonical name. */
export const SECTION_ALIASES: Record<string, string> = Object.fromEntries(
  SECTIONS.flatMap((s) =>
    (s.aliases ?? []).map((alias) => [alias, s.canonical]),
  ),
);

/** Resolve a section heading to its canonical name. */
export function resolveAlias(heading: string): string {
  return SECTION_ALIASES[heading] ?? heading;
}

/** Valid typography property names (for linter validation). */
export const VALID_TYPOGRAPHY_PROPS = TYPOGRAPHY_PROPERTIES.map((p) => p.name);

/** Valid component sub-token names (for linter validation). */
export const VALID_COMPONENT_SUB_TOKENS = COMPONENT_SUB_TOKENS.map(
  (p) => p.name,
);

// ── Aggregate type ────────────────────────────────────────────────────

/** All config values bundled as a single object for renderer injection. */
export interface SpecConfig {
  SPEC_VERSION: typeof SPEC_VERSION;
  MAX_TOKEN_NESTING_DEPTH: typeof MAX_TOKEN_NESTING_DEPTH;
  MAX_REFERENCE_DEPTH: typeof MAX_REFERENCE_DEPTH;
  STANDARD_UNITS: typeof STANDARD_UNITS;
  SPEC_TYPES: typeof SPEC_TYPES;
  SECTIONS: typeof SECTIONS;
  TYPOGRAPHY_PROPERTIES: typeof TYPOGRAPHY_PROPERTIES;
  COMPONENT_SUB_TOKENS: typeof COMPONENT_SUB_TOKENS;
  CORE_COLOR_ROLES: typeof CORE_COLOR_ROLES;
  RECOMMENDED_TOKENS: typeof RECOMMENDED_TOKENS;
  EXAMPLES: typeof EXAMPLES;
  PRIMITIVE_TYPES: typeof PRIMITIVE_TYPES;
}

/** Build a SpecConfig from the module's exports. */
export const SPEC_CONFIG: SpecConfig = {
  SPEC_VERSION,
  MAX_TOKEN_NESTING_DEPTH,
  MAX_REFERENCE_DEPTH,
  STANDARD_UNITS,
  SPEC_TYPES,
  SECTIONS,
  TYPOGRAPHY_PROPERTIES,
  COMPONENT_SUB_TOKENS,
  CORE_COLOR_ROLES,
  RECOMMENDED_TOKENS,
  EXAMPLES,
  PRIMITIVE_TYPES,
};
