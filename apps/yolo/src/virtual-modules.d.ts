declare module "m3:icon/*" {
  const svgMarkup: string;
  export default svgMarkup;
}

declare module "symbol:*" {
  export const svg: string;
  export const name: string;
  export default svg;
}

declare module "m3:tokens.css" {
  const cssText: string;
  export default cssText;
}
