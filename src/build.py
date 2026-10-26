"""Gera as páginas do VendAqui a partir de src/.

Saídas em dist/:
  artifact/<variante>.html  — corpo da página para publicar como Artifact (sem <!doctype>)
  site/<pasta>/index.html   — página completa para servir (localmente ou pelo cloudflared)

Uso: python3 src/build.py [variante ...]   (sem argumentos gera todas)
"""
import re, pathlib, sys

SRC = pathlib.Path(__file__).parent
DIST = SRC.parent / "dist"

# variante -> (título, pasta no site, camadas de tokens, camadas de pele, família de letra, recoloração)
VARIANTS = {
    "vendaqui": ("VendAqui", "", [], [], "Inter", None),
    "cakto": ("VendAqui Cakto", "cakto", ["cakto-tokens.css"], ["cakto.css"], "Public Sans", None),
    "cakto-laranja": ("VendAqui Cakto Laranja", "cakto-laranja", ["cakto-tokens.css"], ["cakto.css"], "Public Sans", "laranja"),
}

# Cakto em laranja: cada verde (e cada neutro esverdeado) passa ao laranja do DS ou a um neutro quente
RECOLOR = {
    "laranja": {
        # marca
        "#3fc958": "#f59e0b", "#61dc76": "#f9b23a", "#071c0c": "#1a1205", "#1c8833": "#d97706", "#66e882": "#fcc865",
        "#72e386": "#fbbf4a", "#4ad463": "#f7a823", "#bcf7a3": "#fedf9f", "#2b9c54": "#d97706", "#0f3d1f": "#6e4207", "#06140b": "#2a1803",
        "#ebf8ee": "#fff4e0", "#b5e2c2": "#fedf9f", "#12261a": "#2b1f08", "#1f4a2c": "#5c4310",
        "rgba(63, 201, 88,": "rgba(245, 158, 11,", "rgba(147, 243, 164,": "rgba(252, 200, 101,", "rgba(147, 231, 163,": "rgba(252, 200, 101,",
        "rgba(102, 232, 130,": "rgba(249, 178, 58,", "rgba(43, 156, 84,": "rgba(217, 119, 6,",
        # neutros escuros
        "#060908": "#0a0806", "#0b0f0d": "#0d0c0a", "#141a17": "#171512", "#111613": "#12110e", "#1b2420": "#201d18", "#233029": "#2a2620",
        "#22302a": "#2a261f", "#3b4d43": "#4a4337", "#f5f8f6": "#f7f5f2", "#a6b2ab": "#b3ada3", "#7f9388": "#8c857a", "#1d2823": "#262219",
        "#0e1511": "#15110c", "#172f21": "#2a1f10", "#1b2920": "#2a2218", "#050806": "#080604", "#0c140f": "#120e0a", "#142219": "#221a10", "#1a281f": "#261e14",
        "#080d0a": "#0d0a07", "#edf5ef": "#fdf5ea",
        # superfícies do site
        "rgba(17, 80, 35, 0.11)": "rgba(120, 70, 10, 0.11)", "rgba(181, 226, 194, 0.1)": "rgba(250, 220, 170, 0.1)",
        "rgba(234, 245, 237, 0.55)": "rgba(253, 243, 227, 0.55)", "rgba(68, 90, 76, 0.2)": "rgba(90, 76, 60, 0.2)", "rgba(20, 32, 24, 0.23)": "rgba(32, 26, 20, 0.23)",
        "rgba(251, 255, 252, 0.86)": "rgba(255, 252, 247, 0.86)", "rgba(12, 19, 15, 0.82)": "rgba(19, 16, 12, 0.82)", "rgba(49, 103, 64, 0.19)": "rgba(120, 80, 20, 0.16)",
    },
}

def recolor(css, scheme):
    if not scheme:
        return css
    for a, b in RECOLOR[scheme].items():
        css = css.replace(a, b)
    return css

def tokens():
    tok = (SRC / "ds-tokens.css").read_text()
    tok = tok.replace(':root, [data-theme="light"] {', ':root {', 1)
    m = re.search(r'\[data-theme="dark"\] \{\n(.*?)\n\}', tok, re.S)
    dark_body = m.group(1)
    tok = tok[:m.start()] + tok[m.end():]
    tok = tok.replace(':root {', ':root {\n' + (SRC / "tokens-extra-light.css").read_text(), 1)
    dark = dark_body + "\n" + (SRC / "tokens-extra-dark.css").read_text()
    tok += '\n@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {\n' + dark + '\n} }\n'
    tok += ':root[data-theme="dark"] {\n' + dark + '\n}\n'
    return tok

def read(files):
    return "\n".join((SRC / f).read_text() for f in files)

def build(name):
    title, folder, tok_layers, skin_layers, font, scheme = VARIANTS[name]
    # tokens da variante antes dos componentes; pele da variante no fim
    css = "\n".join([tokens(), recolor(read(tok_layers), scheme), read(["ds-components.css", "app.css"]), recolor(read(skin_layers), scheme)])
    js = read(["core.js", "logos.js", "public.js", "seller.js", "admin.js", "boot.js"])
    head = (SRC / "head.html").read_text().replace("<title>VendAqui</title>", f"<title>{title}</title>")
    if font != "Inter":
        head = head.replace("family=Inter:wght@400;500;600;700;800", "family=" + font.replace(" ", "+") + ":wght@300;400;500;600;700;800")
    body = head.replace("/*CSS*/", css) + "\n<script>\n" + js + "\n</script>\n"

    art = DIST / "artifact" / f"{name}.html"
    art.parent.mkdir(parents=True, exist_ok=True)
    art.write_text(body)

    page = DIST / "site" / folder / "index.html"
    page.parent.mkdir(parents=True, exist_ok=True)
    page.write_text(
        '<!doctype html>\n<html lang="pt">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="robots" content="noindex, nofollow">\n'
        "<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n"
        "</head>\n<body>\n" + body + "\n</body>\n</html>\n"
    )
    print(f"ok {name:<16} {len(body):>8} bytes -> dist/site/{folder}")

if __name__ == "__main__":
    for n in sys.argv[1:] or VARIANTS:
        build(n)
