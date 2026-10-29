// Gera src/styles/skins.generated.css a partir das fontes em src/styles/skins/.
// Cada visual fica dentro de :root[data-skin="…"], para o utilizador poder trocar sem recarregar.
//   academia      → sem regras extra (tokens.css + components.css + app.css)
//   cakto         → cakto-tokens.css + cakto.css
//   cakto-laranja → o mesmo que cakto, com as cores trocadas por recolor-laranja.json
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "styles");
const read = (f) => readFileSync(join(dir, f), "utf8");

// Divide CSS em blocos de topo: { head, body } para regras e @media; comentários são descartados.
function blocks(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    const head = css.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (j < css.length && depth) { if (css[j] === "{") depth++; else if (css[j] === "}") depth--; j++; }
    out.push({ head, body: css.slice(open + 1, j - 1) });
    i = j;
  }
  return out;
}

// Separa uma lista de seletores pelas vírgulas de topo (ignora as que estão dentro de parênteses).
function splitSelectors(s) {
  const parts = []; let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++; if (ch === ")") depth--;
    if (ch === "," && !depth) { parts.push(cur); cur = ""; } else cur += ch;
  }
  parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function scopeSelector(sel, scope) {
  if (sel.startsWith(":root")) return scope + sel.slice(":root".length);
  if (sel === "html") return scope;
  return `${scope} ${sel}`;
}

function scopeCss(css, scope) {
  return blocks(css).map(({ head, body }) => {
    if (head.startsWith("@media") || head.startsWith("@supports")) return `${head} {\n${scopeCss(body, scope)}\n}`;
    if (head.startsWith("@")) return `${head} {${body}}`;
    return `${splitSelectors(head).map((s) => scopeSelector(s, scope)).join(", ")} {${body}}`;
  }).join("\n");
}

const recolor = (css, map) => Object.entries(map).reduce((s, [a, b]) => s.split(a).join(b), css);
const tokens = read("skins/cakto-tokens.css");
const skin = read("skins/cakto.css");
const laranja = JSON.parse(read("skins/recolor-laranja.json"));

const out = [
  "/* Gerado por scripts/skins.mjs — não editar à mão. Edite src/styles/skins/*. */",
  scopeCss(tokens, ':root[data-skin="cakto"]'),
  scopeCss(skin, ':root[data-skin="cakto"]'),
  scopeCss(recolor(tokens, laranja), ':root[data-skin="cakto-laranja"]'),
  scopeCss(recolor(skin, laranja), ':root[data-skin="cakto-laranja"]'),
].join("\n\n");
writeFileSync(join(dir, "skins.generated.css"), out + "\n");
console.log(`skins.generated.css: ${out.length} bytes`);
