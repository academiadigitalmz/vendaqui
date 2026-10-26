"""Gera as páginas do VendAqui a partir de src/.

Saídas em dist/:
  artifact/<variante>.html  — corpo da página para publicar como Artifact (sem <!doctype>)
  site/<pasta>/index.html   — página completa para servir (localmente ou pelo cloudflared)

Uso: python3 src/build.py [variante ...]   (sem argumentos gera todas)
"""
import re, pathlib, sys

SRC = pathlib.Path(__file__).parent
DIST = SRC.parent / "dist"

# variante -> (título, pasta no site, camadas de tokens, camadas de pele, família de letra)
VARIANTS = {
    "vendaqui": ("VendAqui", "", [], [], "Inter"),
    "cakto": ("VendAqui Cakto", "cakto", ["cakto-tokens.css"], ["cakto.css"], "Public Sans"),
}

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
    title, folder, tok_layers, skin_layers, font = VARIANTS[name]
    # tokens da variante antes dos componentes; pele da variante no fim
    css = "\n".join([tokens(), read(tok_layers), read(["ds-components.css", "app.css"]), read(skin_layers)])
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
