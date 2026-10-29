# VendAqui

Plataforma para vender cursos, ebooks, mentorias e assinaturas em Moçambique, com pagamentos por
Apple Pay, Google Pay, M-Pesa, e-Mola e cartão.

Esta pasta contém o **frontend completo**: landing page, checkout, área do produtor, área do aluno e
backoffice. Enquanto o backend não existe, a app responde com dados de exemplo no próprio browser
(MSW), por isso pode ser publicada e testada já.

- **Para quem faz o backend:** leia [docs/BACKEND.md](docs/BACKEND.md). O contrato está em
  [docs/openapi.json](docs/openapi.json).
- **Protótipo original** (HTML único, referência visual): pasta [prototype/](prototype/).

## Começar

```bash
npm install
npm run dev          # http://localhost:5173
```

Requer Node 20 ou mais recente.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera os visuais, verifica os tipos e cria `dist/` |
| `npm run typecheck` | Só a verificação de tipos |
| `npm run openapi` | Regenera `docs/openapi.json` a partir de `src/api/types.ts` |
| `npm run test:routes` | Abre as 38 rotas num browser (precisa de `vite preview` a correr e do Chrome instalado) |
| `npm run test:flows` | Percorre compra, saque, reembolso, cupão, KYC e saques em lote num browser |

## Variáveis de ambiente

Copie `.env.example` para `.env.local`.

| Variável | Por omissão | Para quê |
|---|---|---|
| `VITE_API_URL` | `/api` | Endereço da API (a app acrescenta `/v1`) |
| `VITE_USE_MOCKS` | `true` | `false` quando o backend estiver pronto |
| `VITE_DEFAULT_SKIN` | `cakto` | Visual inicial: `cakto` (verde), `cakto-laranja` ou `academia` |
| `VITE_SHOW_SWITCHER` | `true` | Mostra o botão "Áreas do protótipo" para quem está a testar |

## Áreas e rotas

| Área | Rotas |
|---|---|
| Público | `/`, `/checkout/:slug`, `/obrigado/:pedido`, `/entrar`, `/criar-conta` |
| Produtor | `/produtor`, `/produtor/produtos`, `/produtor/vendas`, `/produtor/financeiro`, … |
| Aluno | `/aluno`, `/aluno/aulas/:aula`, `/aluno/compras` |
| Backoffice | `/admin`, `/admin/kyc`, `/admin/saques`, `/admin/transacoes`, … |

Em modo simulado, abrir uma área cria uma sessão de demonstração com o papel certo. Com o backend real,
as áreas exigem login e redirecionam para `/entrar`.

## Estrutura

```
src/
  api/          contrato (types.ts), cliente HTTP e lista de chamadas
  mocks/        API simulada (MSW) e dados de exemplo
  components/   componentes do Design System em React
  layouts/      molduras do produtor, backoffice e aluno
  pages/        ecrãs por área (public, seller, student, admin)
  lib/          formatação, ícones, logótipos, estado da interface
  styles/       tokens e componentes do Design System Academia Digital e visuais Cakto
scripts/        geração dos visuais, da especificação OpenAPI e teste das rotas
docs/           guia do backend e especificação OpenAPI
prototype/      o protótipo HTML original
```

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` faz o build e publica a demonstração a cada push para `main`,
em `https://<conta>.github.io/<repositório>/`. Para ativar: *Settings → Pages → Source: GitHub Actions*.

No plano gratuito do GitHub, o Pages só está disponível em repositórios públicos.

Para testar localmente como no Pages: `BASE_PATH=/vendaqui/ npm run build`. O build cria um `404.html`
igual ao `index.html`, para que os links diretos (ex.: `/vendaqui/produtor/vendas`) funcionem.

## Publicar no Vercel

O projeto já tem `vercel.json`. No Vercel: *Add New → Project → Import* este repositório. O framework
(Vite), o comando de build e a pasta `dist` são detetados. As rotas do lado do cliente são reescritas para
`index.html`, por isso links diretos como `/produtor/vendas` funcionam.

## Visuais

Três visuais partilham os mesmos componentes e podem ser trocados no botão "Áreas do protótipo":

- **Cakto verde** (por omissão): linguagem visual da Cakto original
- **Cakto laranja**: linguagem visual da Cakto com o laranja da marca
- **Academia Digital**: o Design System original

As fontes estão em `src/styles/skins/`; `scripts/skins.mjs` gera `skins.generated.css` em cada build.

## Marcas

Os logótipos de Apple Pay, Google Pay, Visa, Mastercard, M-Pesa e e-Mola pertencem aos respetivos donos.
Antes de lançar, confirme as regras de uso de cada marca com os fornecedores de pagamento.
