# VendAqui

Protótipo de UI de um gateway de pagamentos para infoprodutos (Moçambique): landing page, checkout,
área do produtor, área do aluno e backoffice. Uma só página HTML por variante, sem dependências.

## Variantes

| Variante | Visual | Caminho no site |
|---|---|---|
| `vendaqui` | Design System Academia Digital (laranja) | `/` |
| `cakto` | Linguagem visual da Cakto (verde) | `/cakto/` |
| `cakto-laranja` | Linguagem visual da Cakto com o laranja do DS | `/cakto-laranja/` |

## Comandos

```bash
python3 src/build.py          # gera dist/artifact/*.html e dist/site/**/index.html
./test/test.sh                # gera e renderiza todas as rotas de cada variante
python3 -m http.server 8848 --bind 127.0.0.1 --directory dist/site
cloudflared tunnel --url http://127.0.0.1:8848   # expõe para testes
```

## Estrutura

- `src/ds-*.css`: tokens e componentes do Design System Academia Digital (extraídos do ficheiro original)
- `src/app.css`, `src/tokens-extra-*.css`: composições do VendAqui
- `src/cakto*.css`: tokens e pele da variante Cakto; `cakto-laranja` reaproveita-os com a tabela `RECOLOR` de `src/build.py`
- `src/*.js`: dados de exemplo, ecrãs e interações (sem framework)
- `assets/logos/`: originais dos logótipos de pagamento. São marcas dos respetivos donos; confirmar as regras de uso antes de lançar.
