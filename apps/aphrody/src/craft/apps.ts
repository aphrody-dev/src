// Registry of the storytold Craft Apps hosted at /craft/<id>. Each app is the upstream web build
// (packaging/web/package.sh: wasm32, eframe on WebGPU) built on fr1 by scripts/craft-web.sh and published to
// R2 aphrody-assets/craft/<id>/ (https://cdn.aphrody.com/craft/<id>/). Build status per app: docs/games/WASM-DEPLOY.md.
export const CRAFT_CDN = "https://cdn.aphrody.com/craft/";

export interface CraftApp {
  id: string;
  name: string;
  /** One line taken from the upstream README. */
  about: string;
  /** Upstream repository (Apache-2.0, see docs/games/WASM-DEPLOY.md). */
  repo: string;
  /** App icon shipped in the upstream web build, relative to its CDN folder. */
  icon: string;
}

export const CRAFT_APPS: readonly CraftApp[] = [
  {
    id: "photocraft",
    name: "PhotoCraft",
    about:
      "Layers, masks, adjustment layers, layer styles, type, vectors, brushes and real PSD files.",
    repo: "storytold/photocraft",
    icon: "app-icon.png",
  },
  {
    id: "filmcraft",
    name: "FilmCraft",
    about: "Open-source non-linear video editing workflow.",
    repo: "storytold/filmcraft",
    icon: "app-icon.png",
  },
  {
    id: "soundcraft",
    name: "SoundCraft",
    about:
      "Digital audio workstation: multitrack editing, mixer, sends, automation and MIDI.",
    repo: "storytold/soundcraft",
    icon: "app-icon.png",
  },
  {
    id: "craft-launcher",
    name: "ArtCraft Launcher",
    about: "Launcher for the Craft Apps.",
    repo: "storytold/craft-launcher",
    icon: "app-icon.png",
  },
  {
    id: "vectorcraft",
    name: "VectorCraft",
    about: "Vector illustration workflow.",
    repo: "storytold/vectorcraft",
    icon: "app-icon.png",
  },
  {
    id: "lightcraft",
    name: "LightCraft",
    about: "Photo and RAW workflow, drivable by AI agents over MCP.",
    repo: "storytold/lightcraft",
    icon: "app-icon.png",
  },
  {
    id: "designcraft",
    name: "DesignCraft",
    about: "Desktop publishing and page layout workflow.",
    repo: "storytold/designcraft",
    icon: "app-icon.png",
  },
  {
    id: "effectcraft",
    name: "EffectCraft",
    about:
      "Compositor: layers, keyframes, 308 effects, 3D cameras and a render queue.",
    repo: "storytold/effectcraft",
    icon: "app-icon.png",
  },
  {
    id: "gridcraft",
    name: "GridCraft",
    about: "Spreadsheet, clean-room take on modern spreadsheet workflows.",
    repo: "storytold/gridcraft",
    icon: "app-icon.png",
  },
  {
    id: "cadcraft",
    name: "CadCraft",
    about:
      "CAD workflow: command line, object snaps, layers, dimensions and DXF drawings.",
    repo: "storytold/cadcraft",
    icon: "app-icon.png",
  },
  {
    id: "deckcraft",
    name: "DeckCraft",
    about:
      "Presentations with themes, layouts, charts, transitions and .pptx files.",
    repo: "storytold/deckcraft",
    icon: "app-icon.png",
  },
  {
    id: "wordcraft",
    name: "WordCraft",
    about:
      "Word processor with ribbon, styles, tables, track changes and .docx files.",
    repo: "storytold/wordcraft",
    icon: "app-icon.png",
  },
  {
    id: "pdfcraft",
    name: "PdfCraft",
    about: "Read, organize, combine, split and secure PDFs.",
    repo: "storytold/pdfcraft",
    icon: "app-icon.png",
  },
];
