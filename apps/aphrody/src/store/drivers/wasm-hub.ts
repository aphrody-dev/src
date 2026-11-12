/**
 * Public WASM + WebGPU Apps Hub Driver
 * Instant zero-install browser execution inside Storytold & macOS windows
 * Zero external npm dependencies
 */

import type { StorePackage } from "../types";

export const WASM_HUB_PACKAGES: StorePackage[] = [
  {
    id: "wasm-artcraft",
    name: "storytold/artcraft",
    ecosystem: "wasm-hub",
    version: "1.0.0",
    description:
      "Storytold Artcraft vector canvas & procedural brush engine in pure WASM + WebGPU",
    author: "Storytold",
    repoUrl: "https://github.com/storytold/artcraft",
    category: "Creative Graphics",
    stars: 320,
    installCmd: "aphrody run wasm:storytold/artcraft",
    runCmd: "aphrody open-window --app=artcraft",
    sandboxed: true,
    tags: ["storytold", "wasm", "webgpu", "artcraft"],
  },
  {
    id: "wasm-storyteller-bevy",
    name: "storytold/storyteller-bevy",
    ecosystem: "wasm-hub",
    version: "0.2.0",
    description:
      "Interactive Bevy 3D ECS mesh viewer and real-time lighting viewport compiled to WASM",
    author: "Storytold",
    repoUrl: "https://github.com/storytold/storyteller-bevy",
    category: "3D & Simulation",
    stars: 410,
    installCmd: "aphrody run wasm:storytold/storyteller-bevy",
    runCmd: "aphrody open-window --app=bevy-3d",
    sandboxed: true,
    tags: ["bevy", "rust", "3d", "wasm", "webgpu"],
  },
  {
    id: "wasm-hanashi-shader",
    name: "storytold/hanashi-graphics",
    ecosystem: "wasm-hub",
    version: "1.1.0",
    description:
      "Realtime generative WGSL procedural shader demo with dynamic uniforms and 60fps loop",
    author: "Storytold",
    repoUrl: "https://github.com/storytold/hanashi-graphics-demo",
    category: "Shaders & Generative",
    stars: 180,
    installCmd: "aphrody run wasm:storytold/hanashi-graphics",
    runCmd: "aphrody open-window --app=hanashi-shader",
    sandboxed: true,
    tags: ["shader", "wgsl", "webgpu", "procedural"],
  },
  {
    id: "wasm-point-generator",
    name: "storytold/point-generator",
    ecosystem: "wasm-hub",
    version: "0.5.0",
    description:
      "3D point cloud & LiDAR particle simulation with interactive orbit and depth coloring",
    author: "Storytold",
    repoUrl: "https://github.com/storytold/point-generator",
    category: "Scientific & Physics",
    stars: 215,
    installCmd: "aphrody run wasm:storytold/point-generator",
    runCmd: "aphrody open-window --app=point-cloud",
    sandboxed: true,
    tags: ["points", "lidar", "simulation", "particles"],
  },
  {
    id: "wasm-runtime-audio",
    name: "storytold/runtime-audio-importer",
    ecosystem: "wasm-hub",
    version: "2.0.0",
    description:
      "Low-latency audio spectrum visualizer & procedural frequency synthesizer",
    author: "Storytold",
    repoUrl: "https://github.com/storytold/RuntimeAudioImporter",
    category: "Audio & Music",
    stars: 520,
    installCmd: "aphrody run wasm:storytold/runtime-audio-importer",
    runCmd: "aphrody open-window --app=audio-vis",
    sandboxed: true,
    tags: ["audio", "spectrum", "dsp", "music"],
  },
];

export async function searchWasmHubPackages(
  query: string,
): Promise<StorePackage[]> {
  const q = query.toLowerCase().trim();
  if (!q) return WASM_HUB_PACKAGES;
  return WASM_HUB_PACKAGES.filter(
    (p) => p.name.includes(q) || p.description.toLowerCase().includes(q),
  );
}
