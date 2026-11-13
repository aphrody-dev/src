// Catalog subset embedded by page.ts; {name} placeholders only (the os.* keys use nothing else).
const cat: Record<string, string> = JSON.parse(
  document.getElementById("i18n")?.textContent ?? "{}",
);
export const t = (
  key: string,
  args?: Record<string, string | number>,
): string =>
  (cat[key] ?? key).replace(/\{(\w+)\}/g, (_, k: string) =>
    String(args?.[k] ?? ""),
  );
export const locale = document.documentElement.lang || "en";
