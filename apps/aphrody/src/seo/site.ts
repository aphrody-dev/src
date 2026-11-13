/**
 * Aphrody site model: locales, topic hubs (verticals), package hubs and URL helpers.
 * Single source of truth shared by the build (SSG), the server and the tests.
 * Pure TypeScript, zero dependencies. Content is intentionally factual: it
 * describes what the portal does today and avoids unverifiable claims.
 */

export const SITE_URL = "https://aphrody.com";
export const APP_URL = "https://aphrody.app";
export const ABOUT_URL = "https://about.aphrody.com";

export type Locale = "fr" | "en";
export const LOCALES: Locale[] = ["fr", "en"];
export const HREFLANG: Record<Locale, string> = { fr: "fr-FR", en: "en-US" };
export const OG_LOCALE: Record<Locale, string> = { fr: "fr_FR", en: "en_US" };

export interface LocalizedHub {
  title: string; // <= 60 chars, used in <title>
  description: string; // 50..160 chars
  h1: string;
  intro: string;
  points: string[];
}

export interface Vertical {
  slug: string;
  links: Array<{ href: string; label: Record<Locale, string> }>;
  fr: LocalizedHub;
  en: LocalizedHub;
}

export const VERTICALS: Vertical[] = [
  {
    slug: "web",
    links: [
      {
        href: "/api/q?q=bun",
        label: { fr: "API de suggestions", en: "Suggestions API" },
      },
    ],
    fr: {
      title: "Recherche web - Aphrody",
      description:
        "Zone de recherche Aphrody : suggestions instantanées locales puis résultats Google Search, sans compte ni suivi avant consentement.",
      h1: "Recherche web",
      intro:
        "Aphrody propose une zone de recherche avec suggestions locales. Valider une requête ouvre les résultats de Google Search. Aphrody n'est pas affilié à Google.",
      points: [
        "Suggestions servies par /api/q, sans cookie.",
        "Le formulaire fonctionne sans JavaScript via /search.",
        "Raccourci clavier : touche / pour focaliser la zone de recherche.",
      ],
    },
    en: {
      title: "Web search - Aphrody",
      description:
        "Aphrody search box: instant local suggestions, then Google Search results, with no account and no tracking before consent.",
      h1: "Web search",
      intro:
        "Aphrody offers a search box with local suggestions. Submitting a query opens Google Search results. Aphrody is not affiliated with Google.",
      points: [
        "Suggestions are served by /api/q, without cookies.",
        "The form works without JavaScript through /search.",
        "Keyboard shortcut: press / to focus the search box.",
      ],
    },
  },
  {
    slug: "packages",
    links: [
      {
        href: "/api/pm?q=rust",
        label: { fr: "API catalogue", en: "Catalog API" },
      },
    ],
    fr: {
      title: "Catalogue de paquets - Aphrody",
      description:
        "Catalogue de paquets multi-écosystèmes (Bun, winget, AUR, Nix, Flatpak, Play Store, WASM) avec commandes d'installation officielles.",
      h1: "Catalogue de paquets",
      intro:
        "Un catalogue sélectionné de paquets issus de plusieurs écosystèmes, avec la commande d'installation de chacun. Les entrées sont des métadonnées de catalogue ; vérifiez toujours la source amont.",
      points: [
        "Un hub par écosystème, listant les entrees du catalogue.",
        "Recherche JSON via /api/pm.",
        "Aucun paquet n'est installé par ce site depuis votre navigateur.",
      ],
    },
    en: {
      title: "Package catalog - Aphrody",
      description:
        "Multi-ecosystem package catalog (Bun, winget, AUR, Nix, Flatpak, Play Store, WASM) with the official install command for each entry.",
      h1: "Package catalog",
      intro:
        "A curated catalog of packages from several ecosystems, with the install command for each. Entries are catalog metadata; always check the upstream source.",
      points: [
        "One hub per ecosystem, listing the catalog entries.",
        "JSON search through /api/pm.",
        "This site does not install anything from your browser.",
      ],
    },
  },
  {
    slug: "wasm-webgpu",
    links: [
      {
        href: "/search/benchmarks",
        label: { fr: "Benchmarks", en: "Benchmarks" },
      },
    ],
    fr: {
      title: "WebAssembly et WebGPU - Aphrody",
      description:
        "Démonstrations WebAssembly et WebGPU d'Aphrody, détectées à l'exécution avec repli propre sur les navigateurs sans WebGPU.",
      h1: "WebAssembly et WebGPU",
      intro:
        "Les démonstrations de la suite Storytold utilisent WebAssembly et, si disponible, WebGPU. Les fonctions sont détectées à l'exécution : un navigateur sans WebGPU affiche un message au lieu d'une erreur.",
      points: [
        "WebAssembly est supporte par tous les navigateurs modernes.",
        "WebGPU dépend du navigateur et du matériel.",
        "Aucune capacité n'est supposée : tout est détecté.",
      ],
    },
    en: {
      title: "WebAssembly and WebGPU - Aphrody",
      description:
        "Aphrody WebAssembly and WebGPU demos, feature-detected at runtime with a clean fallback on browsers that lack WebGPU.",
      h1: "WebAssembly and WebGPU",
      intro:
        "The Storytold suite demos use WebAssembly and, when available, WebGPU. Features are detected at runtime: a browser without WebGPU shows a message instead of an error.",
      points: [
        "WebAssembly is supported by all modern browsers.",
        "WebGPU depends on the browser and the hardware.",
        "No capability is assumed: everything is detected.",
      ],
    },
  },
  {
    slug: "wayland-rust-desktop",
    links: [
      { href: APP_URL + "/", label: { fr: "aphrody.app", en: "aphrody.app" } },
    ],
    fr: {
      title: "Bureau Wayland et Rust - Aphrody",
      description:
        "Notes sur les environnements de bureau Wayland et les outils Rust, et lien vers le projet compagnon aphrody.app.",
      h1: "Bureau Wayland et Rust",
      intro:
        "Cette page rassemble des repères sur Wayland et les outils de bureau écrits en Rust, et renvoie vers le projet compagnon aphrody.app. Le catalogue de paquets liste des applications Wayland (AUR, Flatpak, Nix).",
      points: [
        "Wayland est le protocole d'affichage moderne de Linux.",
        "Le hub AUR et le hub Flatpak listent des applications de bureau.",
        "Détails du projet : voir aphrody.app.",
      ],
    },
    en: {
      title: "Wayland and Rust desktop - Aphrody",
      description:
        "Notes on Wayland desktop environments and Rust tooling, with a link to the companion project aphrody.app.",
      h1: "Wayland and Rust desktop",
      intro:
        "This page gathers pointers on Wayland and desktop tools written in Rust, and links to the companion project aphrody.app. The package catalog lists Wayland applications (AUR, Flatpak, Nix).",
      points: [
        "Wayland is the modern Linux display protocol.",
        "The AUR and Flatpak hubs list desktop applications.",
        "Project details: see aphrody.app.",
      ],
    },
  },
  {
    slug: "benchmarks",
    links: [
      { href: "/api/bnc", label: { fr: "Donn�es JSON", en: "JSON data" } },
    ],
    fr: {
      title: "Benchmarks runtime - Aphrody",
      description:
        "Micro-benchmarks exécutés à la demande sur le serveur : débit de copie mémoire, SQLite et calcul. Résultats JSON non figés.",
      h1: "Benchmarks runtime",
      intro:
        "Le point d'accès /api/bnc exécute une suite de micro-benchmarks dans le runtime du serveur et renvoie les mesures en JSON. Les valeurs dépendent de la machine et varient d'une exécution à l'autre.",
      points: [
        "Mesures calculées a chaque appel, jamais pré-enregistrées.",
        "Utiles pour comparer des configurations, pas comme référence absolue.",
        "Le jeu de données est décrit en Schema.org Dataset.",
      ],
    },
    en: {
      title: "Runtime benchmarks - Aphrody",
      description:
        "Micro-benchmarks run on demand on the server: memory copy throughput, SQLite and compute. Non-frozen JSON results.",
      h1: "Runtime benchmarks",
      intro:
        "The /api/bnc endpoint runs a suite of micro-benchmarks in the server runtime and returns the measurements as JSON. Values depend on the machine and vary between runs.",
      points: [
        "Measurements are computed on each call, never pre-recorded.",
        "Useful to compare configurations, not as an absolute reference.",
        "The dataset is described with Schema.org Dataset.",
      ],
    },
  },
  {
    slug: "design-systems",
    links: [
      {
        href: "https://m3.material.io/",
        label: { fr: "Material Design 3", en: "Material Design 3" },
      },
    ],
    fr: {
      title: "Design systems - Aphrody",
      description:
        "Interface Aphrody basée sur les jetons Material Design 3 : cibles tactiles de 48 dp, anneaux de focus, thèmes clair et sombre.",
      h1: "Design systems",
      intro:
        "L'interface s'appuie sur des jetons Material Design 3 (couleurs, formes, élévations), des cibles tactiles d'au moins 48 dp, des anneaux de focus visibles et les thèmes clair et sombre.",
      points: [
        "Jetons exposés dans src/design/material-tokens.ts.",
        "Respect de prefers-reduced-motion et des zones de sécurité.",
        "Le thème suit le système et peut etre bascule.",
      ],
    },
    en: {
      title: "Design systems - Aphrody",
      description:
        "Aphrody UI built on Material Design 3 tokens: 48 dp touch targets, focus rings, light and dark themes.",
      h1: "Design systems",
      intro:
        "The interface uses Material Design 3 tokens (color, shape, elevation), touch targets of at least 48 dp, visible focus rings and light and dark themes.",
      points: [
        "Tokens are exposed in src/design/material-tokens.ts.",
        "Honors prefers-reduced-motion and safe-area insets.",
        "The theme follows the system and can be toggled.",
      ],
    },
  },
  {
    slug: "cloud-edge",
    links: [
      { href: "/ok", label: { fr: "État du service", en: "Service status" } },
    ],
    fr: {
      title: "Cloud et edge - Aphrody",
      description:
        "Déploiement d'Aphrody sur Bun ou Cloudflare Workers : cache immuable, HSTS et routage des sitemaps et d'ads.txt.",
      h1: "Cloud et edge",
      intro:
        "Le site se sert depuis un serveur Bun, ou comme actifs statiques sur Cloudflare Workers. Le build écrit dist/_headers (cache immuable, HSTS), les sitemaps et ads.txt.",
      points: [
        "Actifs pre-compressés (gzip et brotli) servis depuis la mémoire.",
        "ETag fort et réponses 304.",
        "En-têtes Link rel=preload convertibles en Early Hints par un CDN.",
      ],
    },
    en: {
      title: "Cloud and edge - Aphrody",
      description:
        "Deploying Aphrody on Bun or Cloudflare Workers: immutable caching, HSTS and routing for sitemaps and ads.txt.",
      h1: "Cloud and edge",
      intro:
        "The site is served from a Bun server, or as static assets on Cloudflare Workers. The build writes dist/_headers (immutable caching, HSTS), the sitemaps and ads.txt.",
      points: [
        "Pre-compressed assets (gzip and brotli) served from memory.",
        "Strong ETag and 304 responses.",
        "Link rel=preload headers that a CDN can turn into Early Hints.",
      ],
    },
  },
];

export const PACKAGE_ECOSYSTEMS = [
  "bun",
  "winget",
  "aur",
  "nix",
  "flatpak",
  "playstore",
  "wasm-hub",
] as const;
export type PackageEcosystem = (typeof PACKAGE_ECOSYSTEMS)[number];

export const ECOSYSTEM_LABELS: Record<PackageEcosystem, string> = {
  bun: "Bun",
  winget: "winget (Windows)",
  aur: "AUR (Arch Linux)",
  nix: "Nix",
  flatpak: "Flatpak",
  playstore: "Play Store",
  "wasm-hub": "WASM hub",
};

export const HOME: Record<
  Locale,
  { title: string; description: string; h1: string; intro: string }
> = {
  fr: {
    title: "Aphrody — sites et logiciels web indépendants",
    description:
      "Aphrody développe des logiciels web hébergés en France : recherche, catalogue de paquets, benchmarks et aphrody.app, un bureau en mosaïque pour le navigateur.",
    h1: "Aphrody développe des logiciels web et les héberge en France.",
    intro:
      "La recherche, le catalogue de paquets et les benchmarks sont en ligne. aphrody.app, un bureau en mosaïque pour le navigateur, est en cours de développement.",
  },
  en: {
    title: "Aphrody — independent websites and web software",
    description:
      "Aphrody builds web software hosted in France: a search with a package catalog, runtime benchmarks, and aphrody.app, a tiling desktop for the browser.",
    h1: "Aphrody builds web software and hosts it in France.",
    intro:
      "The search, the package catalog and the benchmarks are online. aphrody.app, a tiling desktop for the browser, is in development.",
  },
};

export interface NewsArticle {
  slug: string;
  date: string;
  fr: { title: string; body: string };
  en: { title: string; body: string };
}

export const NEWS: NewsArticle[] = [
  {
    slug: "new-homepage-2026-11",
    date: "2026-11-12",
    fr: {
      title: "Nouvelle page d'accueil",
      body: "La page d'accueil présente maintenant Aphrody et ses produits, sans JavaScript nécessaire. La recherche reste disponible sur /search. Le mode de réponse par IA a été retiré du site.",
    },
    en: {
      title: "New homepage",
      body: "The homepage now presents Aphrody and its products, with no JavaScript required. Search remains available at /search. The AI answer mode has been removed from the site.",
    },
  },
  {
    slug: "platform-upgrade-2026-11",
    date: "2026-11-10",
    fr: {
      title: "Mise à jour: sitemaps, llms.txt et WebMCP",
      body: "Aphrody ajoute un index de sitemaps, des fichiers llms.txt, et des outils WebMCP exposés quand le navigateur les supporte.",
    },
    en: {
      title: "Update: sitemaps, llms.txt and WebMCP",
      body: "Aphrody adds a sitemap index, llms.txt files, and WebMCP tools exposed when the browser supports them.",
    },
  },
];

export function localePrefix(locale: Locale): string {
  return locale === "fr" ? "" : "/en";
}

/** Path of a page for a locale. `path` is the fr path such as "/search/web" or "/". */
export function localizedPath(path: string, locale: Locale): string {
  const prefix = localePrefix(locale);
  if (path === "/") return prefix === "" ? "/" : "/en";
  return prefix + path;
}

export function absoluteUrl(path: string): string {
  return SITE_URL + path;
}

export function verticalPath(slug: string): string {
  return `/search/${slug}`;
}

export function packageHubPath(eco: string): string {
  return `/search/packages/${eco}`;
}

export function newsPath(slug: string): string {
  return `/news/${slug}`;
}

/** All indexable fr paths grouped by sitemap. */
export function pathGroups(): Record<
  "core" | "verticals" | "packages" | "news",
  string[]
> {
  return {
    core: ["/"],
    verticals: VERTICALS.map((v) => verticalPath(v.slug)),
    packages: PACKAGE_ECOSYSTEMS.map(packageHubPath),
    news: NEWS.map((n) => newsPath(n.slug)),
  };
}

export function findVertical(slug: string): Vertical | undefined {
  return VERTICALS.find((v) => v.slug === slug);
}
