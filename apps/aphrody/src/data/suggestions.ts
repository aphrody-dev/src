export interface SuggestionItem {
  text: string;
  isHistory?: boolean;
}

export const POPULAR_SUGGESTIONS: string[] = [
  "aphrody",
  "actualités du jour",
  "météo france",
  "traducteur français anglais",
  "google maps",
  "youtube tendances",
  "programme tv ce soir",
  "recette facile et rapide",
  "bun runtime",
  "le monde actualité",
  "résultats loto",
  "sncf connect horaires",
  "amazon france",
];

export function getSuggestions(query: string): SuggestionItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [
      { text: "aphrody.com", isHistory: true },
      { text: "actualités france", isHistory: true },
      { text: "météo", isHistory: true },
    ];
  }

  const matches = POPULAR_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(trimmed),
  );

  const results: SuggestionItem[] = matches.map((m) => ({
    text: m,
    isHistory: false,
  }));

  if (!matches.some((m) => m.toLowerCase() === trimmed)) {
    results.unshift({ text: query, isHistory: false });
  }

  return results.slice(0, 8);
}
