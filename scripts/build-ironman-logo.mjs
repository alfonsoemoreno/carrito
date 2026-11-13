import { readFile, writeFile } from "node:fs/promises";
import fontkitModule from "next/dist/compiled/@next/font/dist/fontkit/index.js";
import sharp from "sharp";

// Hybrid identity: the IRONMAN M-dot and a publication cart share one silhouette.
// Simple vector shapes preserve legibility in the header and installed app icon.
const directory = new URL("../public/icons/ironman-valdivia/", import.meta.url);
function cart({ accent, mint }) {
  // The IRONMAN M supplies the poster and side uprights of the publication cart.
  // Its rails continue directly into the literature rack and the two wheels.
  return `<g fill="${accent}">
  <circle cx="20" cy="5.5" r="4.5"/>
  <path d="M5 34V13H13L20 25 27 13H35V34H28V26L20 39 12 26V34Z"/>
  <circle cx="10" cy="49" r="2.5"/><circle cx="30" cy="49" r="2.5"/>
  </g>
  <g fill="none" stroke="${accent}" stroke-width="2.5" stroke-linejoin="miter">
  <path d="M6.25 32V43.75H33.75V32M10 44V47M30 44V47"/>
  </g>
  <g fill="${mint}"><path d="M10 35H16V41H10Z"/><path d="M24 35H30V41H24Z"/></g>`;
}
const palettes = {
  light: { ink: "#173c46", accent: "#347b88", mint: "#a3d4c3", wash: "#eaf4f0", paper: "#ffffff", gold: "#e9c58b" },
  dark: { ink: "#edf7f5", accent: "#7ebfcb", mint: "#a3d4c3", wash: "#1a363e", paper: "#14242e", gold: "#e9c58b" },
};
// Export typography as outlines: the finished SVG never depends on system fonts.
const fontBytes = await readFile(new URL("./assets/manrope/Manrope.ttf", import.meta.url));
const manrope = fontkitModule.default(fontBytes);
function lettering(text, { x, y, size, weight, tracking = 0, fill }) {
  const font = manrope.getVariation({ wght: weight });
  const run = font.layout(text);
  const scale = size / font.unitsPerEm;
  let cursor = 0;
  const paths = run.glyphs.map((glyph, index) => {
    const position = run.positions[index];
    const glyphX = x + cursor + position.xOffset * scale;
    const glyphY = y - position.yOffset * scale;
    const path = `<path transform="translate(${glyphX.toFixed(4)} ${glyphY.toFixed(4)}) scale(${scale} ${-scale})" d="${glyph.path.toSVG()}"/>`;
    cursor += position.xAdvance * scale + tracking;
    return path;
  }).join("");
  return `<g fill="${fill}">${paths}</g>`;
}
for (const [variant, palette] of Object.entries(palettes)) {
  const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 52" width="40" height="52">${cart(palette)}</svg>\n`;
  await writeFile(new URL(`mark-${variant}.svg`, directory), mark);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 306 72" width="306" height="72" role="img" aria-labelledby="logo-title"><title id="logo-title">IRONMAN 2026</title>
<g transform="translate(2 10)">${cart(palette)}</g>
<path d="M56 13H286V59H56Z" fill="${palette.accent}"/>
${lettering("IRONMAN 2026", { x: 72, y: 44, size: 24, weight: 800, tracking: 0.7, fill: variant === "light" ? "#ffffff" : "#102330" })}</svg>\n`;
  await writeFile(new URL(`logo-${variant}.svg`, directory), svg);
}
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#102330"/><g transform="translate(96 40) scale(8)">${cart(palettes.dark)}</g></svg>\n`;
await writeFile(new URL("event-mark.svg", directory), icon);
for (const [name, size] of [["app-icon-192.png", 192], ["app-icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  await sharp(Buffer.from(icon)).resize(size, size).png().toFile(new URL(name, directory).pathname);
}
