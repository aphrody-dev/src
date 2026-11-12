/**
 * WebMCP tool definitions shared by the browser (navigator.modelContext),
 * /.well-known/webmcp.json and /.well-known/agent.json.
 * Each tool maps to one read-only HTTP endpoint of this site.
 */

export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
  /** Read-only HTTP binding used by the browser implementation. */
  http: { method: "GET"; path: string; param: string };
  annotations: { readOnlyHint: true };
}

export const WEBMCP_TOOLS: WebMcpTool[] = [
  {
    name: "aphrody_suggest",
    description: "Return search suggestions for a partial query.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Partial search query" },
      },
      required: ["q"],
    },
    http: { method: "GET", path: "/api/q", param: "q" },
    annotations: { readOnlyHint: true },
  },
  {
    name: "aphrody_package_search",
    description:
      "Search the multi-ecosystem package catalog (Bun, winget, AUR, Nix, Flatpak, Play Store, WASM).",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Package name or keyword" },
      },
      required: ["q"],
    },
    http: { method: "GET", path: "/api/pm", param: "q" },
    annotations: { readOnlyHint: true },
  },
  {
    name: "aphrody_benchmarks",
    description:
      "Run the runtime micro-benchmark suite on the server and return the JSON measurements.",
    inputSchema: { type: "object", properties: {}, required: [] },
    http: { method: "GET", path: "/api/bnc", param: "" },
    annotations: { readOnlyHint: true },
  },
];
