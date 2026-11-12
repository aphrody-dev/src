/**
 * Schema.org @graph builder.
 * Emits Organization, WebSite (+SearchAction), WebApplication (optional), BreadcrumbList,
 * FAQPage, ItemList and Dataset. aphrody.app is not described as a SoftwareApplication
 * until it is public.
 * Descriptions are factual: no ratings, no price claims beyond a free web app,
 * no invented versions. Pure TypeScript, zero dependencies.
 */

import { HREFLANG, SITE_URL, type Locale } from "./site";

export interface GraphFaq {
  question: string;
  answer: string;
}
export interface GraphCrumb {
  name: string;
  url: string;
}
export interface GraphItem {
  name: string;
  url?: string;
}

export interface PageGraphOptions {
  locale: Locale;
  canonicalUrl: string;
  title: string;
  description: string;
  breadcrumbs: GraphCrumb[];
  faqs?: GraphFaq[];
  items?: GraphItem[];
  itemListName?: string;
  dataset?: boolean;
  /** Describe the page as a WebApplication (search tools). Default true. */
  webApp?: boolean;
}

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

export function buildPageGraph(o: PageGraphOptions): Record<string, unknown> {
  const lang = HREFLANG[o.locale];
  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: "Aphrody",
      url: SITE_URL + "/",
      logo: `${SITE_URL}/favicon.svg`,
      email: "contact@aphrody.com",
      // Only profiles that resolve. Products are not "sameAs" the organization.
      sameAs: ["https://github.com/aphrody-dev"],
    },
    {
      "@type": "WebSite",
      "@id": SITE_ID,
      name: "Aphrody",
      url: SITE_URL + "/",
      publisher: { "@id": ORG_ID },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${o.canonicalUrl}#breadcrumb`,
      itemListElement: o.breadcrumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: c.url,
      })),
    },
  ];

  if (o.webApp !== false) {
    graph.splice(2, 0, {
      "@type": "WebApplication",
      "@id": `${o.canonicalUrl}#webapp`,
      name: o.title,
      url: o.canonicalUrl,
      description: o.description,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (web browser)",
      inLanguage: lang,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    });
  }

  if (o.faqs && o.faqs.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${o.canonicalUrl}#faq`,
      mainEntity: o.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  if (o.items && o.items.length) {
    graph.push({
      "@type": "ItemList",
      "@id": `${o.canonicalUrl}#itemlist`,
      name: o.itemListName || o.title,
      numberOfItems: o.items.length,
      itemListElement: o.items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        ...(it.url ? { url: it.url } : {}),
      })),
    });
  }

  if (o.dataset) {
    graph.push({
      "@type": "Dataset",
      "@id": `${SITE_URL}/#dataset-benchmarks`,
      name:
        o.locale === "fr"
          ? "Micro-benchmarks runtime Aphrody"
          : "Aphrody runtime micro-benchmarks",
      description:
        o.locale === "fr"
          ? "Mesures calculées à la demande par /api/bnc ; les valeurs varient selon la machine."
          : "Measurements computed on demand by /api/bnc; values vary by machine.",
      url: `${SITE_URL}/search/benchmarks`,
      creator: { "@id": ORG_ID },
      isAccessibleForFree: true,
      distribution: [
        {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: `${SITE_URL}/api/bnc`,
        },
      ],
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function graphToScript(graph: Record<string, unknown>): string {
  // "<" is escaped so the JSON can never close the script element.
  const json = JSON.stringify(graph).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

export const GRAPH_TYPES = [
  "Organization",
  "WebSite",
  "WebApplication",
  "BreadcrumbList",
  "FAQPage",
  "ItemList",
  "Dataset",
] as const;
