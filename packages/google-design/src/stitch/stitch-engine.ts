/**
 * Local Material 3 wireframe generator (offline Stitch-like scaffold) and DESIGN.md helpers.
 * The Stitch API client of src is packages/ai-os/src/google/stitch (absorbed google-labs-code/stitch-sdk);
 * DESIGN.md parsing goes through src/design-md (absorbed google-labs-code/design.md).
 * 100% Pure Bun v1.4.4 - Zero External Dependencies
 * Conforms to upstream google-labs-code/design.md & stitch-sdk specifications.
 */

import { ParserHandler } from "../design-md/parser/handler.ts";

export interface DesignMdDoc {
  name: string;
  overview: string;
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  components: string[];
  proseGuidelines: string[];
}

export interface StitchScreenResult {
  id: string;
  title: string;
  prompt: string;
  componentTree: Record<string, any>;
  html: string;
  cssTokens: string;
}

/**
 * Format structured design into official DESIGN.md Markdown string
 */
export function formatDesignMd(doc: DesignMdDoc): string {
  const colorLines = Object.entries(doc.colors)
    .map(([k, v]) => `  ${k}: '${v}'`)
    .join("\n");

  const typoLines = Object.entries(doc.typography)
    .map(([k, v]) => `  ${k}: '${v}'`)
    .join("\n");

  const proseLines = doc.proseGuidelines.map((p) => `- ${p}`).join("\n");

  return `---
name: ${doc.name}
---

## Overview

${doc.overview}

## Colors

\`\`\`yaml
# Tokens
colors:
${colorLines}
\`\`\`

<!-- Prose -->
${proseLines}

## Typography

\`\`\`yaml
typography:
${typoLines}
\`\`\`

## Components

${doc.components.map((c) => `- \`${c}\``).join("\n")}
`;
}

/**
 * Parse a DESIGN.md file (google-labs-code/design.md format) through the absorbed parser
 * (src/design-md/parser): front matter and fenced yaml blocks, H2 sections for the prose.
 */
export function parseDesignMd(content: string): DesignMdDoc {
  const r = new ParserHandler().execute({ content });
  const ds = r.success ? r.data : undefined;
  const flat = (o: Record<string, unknown> | undefined) =>
    Object.fromEntries(
      Object.entries(o ?? {}).map(([k, v]) => [
        k,
        typeof v === "object" && v !== null
          ? Object.values(v).join(" ")
          : String(v),
      ]),
    );
  const section = (h: string) =>
    ds?.documentSections
      ?.find((s) => s.heading === h)
      ?.content.replace(/^.*\n/, "")
      .replace(/```[\s\S]*?```/g, "")
      .trim() ?? "";
  return {
    name: ds?.name ?? "Google Design Spec",
    overview: section("Overview"),
    colors: flat(ds?.colors),
    typography: flat(ds?.typography),
    spacing: flat(ds?.spacing),
    components: Object.keys(ds?.components ?? {}).length
      ? Object.keys(ds!.components!)
      : [...section("Components").matchAll(/`([^`]+)`/g)].map((m) => m[1]!),
    proseGuidelines: [...section("Colors").matchAll(/^- (.+)$/gm)].map(
      (m) => m[1]!,
    ),
  };
}

/**
 * Generate a responsive Stitch UI screen from prompt
 */
export function generateStitchScreen(
  prompt: string,
  seedColor = "#4285F4",
): StitchScreenResult {
  const id = `screen-${Date.now().toString(36)}`;
  const title = prompt.length > 30 ? `${prompt.slice(0, 27)}...` : prompt;

  const html = `
<div class="stitch-scaffold" data-screen-id="${id}">
  <header class="stitch-top-bar">
    <div class="title-area">
      <span class="symbol-slot" aria-hidden="true">[search]</span>
      <h1 class="headline-medium">${escapeHtml(title)}</h1>
    </div>
    <div class="actions">
      <button class="m3-button filled">Primary Action</button>
      <button class="m3-button outlined">Settings</button>
    </div>
  </header>
  <main class="stitch-body">
    <div class="m3-card elevated">
      <h2 class="title-large">Interactive Wireframe Slot</h2>
      <p class="body-medium">Generated dynamically by Google Stitch Engine for prompt: "${escapeHtml(prompt)}"</p>
      <div class="nano-banana-slot" data-aspect="16:9" data-model="gemini-2.5-flash-image">
        <span class="badge">Nano Banana Asset Slot [gemini-2.5-flash-image]</span>
      </div>
    </div>
  </main>
</div>
`.trim();

  return {
    id,
    title,
    prompt,
    componentTree: {
      type: "Scaffold",
      topBar: { type: "TopAppBar", title },
      body: {
        type: "FlowGrid",
        children: [{ type: "Card", variant: "elevated", content: prompt }],
      },
    },
    html,
    cssTokens: `:root { --seed-color: ${seedColor}; }`,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
