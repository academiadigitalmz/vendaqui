# VendAqui Frontend

Frontend React/Vite da plataforma VendAqui. A aplicação consome directamente o contrato do `vendaqui-backend`; não possui API simulada nem rotas funcionais fictícias.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
npm run dev
```

Requer Node.js 20.19 ou superior (ou 22.12+ nas séries mais recentes).

| Comando | Finalidade |
|---|---|
| `npm run dev` | Servidor local em `http://localhost:5173` |
| `npm run typecheck` | Validação TypeScript sem gerar ficheiros |
| `npm run build` | Typecheck e build de produção |
| `npm run preview` | Servir localmente o resultado do build |

## Configuração

`VITE_API_URL` contém a origem/base da API sem `/v1`. O cliente acrescenta esse prefixo.

```env
VITE_API_URL=http://localhost:8080
VITE_DEFAULT_SKIN=cakto
VITE_SHOW_SWITCHER=false
```

Em produção, configurar a origem HTTPS real, por exemplo `https://api.vendaqui.academiamz.digital`. O backend deve incluir a origem exacta do frontend em `CORS_ALLOWED_ORIGINS`.

## Autenticação

- O refresh token existe apenas no cookie HttpOnly emitido pelo backend.
- O access token é mantido apenas em memória e nunca é escrito em `localStorage` ou `sessionStorage`.
- Ao recarregar a aplicação, o frontend chama o endpoint de refresh com `credentials: include` e volta a consultar a identidade.
- Pedidos que recebem `401` tentam uma única renovação e repetem a operação uma vez.
- Utilizadores públicos e membros do backoffice usam cookies, audiências e endpoints separados.
- O papel `seller` usado pela interface é derivado da existência do perfil comercial; não é inventado como papel da conta pública.
- Um produtor pode continuar a comprar e consultar a biblioteca como qualquer outro utilizador público.

## Áreas suportadas

- Público: catálogo do checkout, compra autenticada ou convidada e associação posterior da compra.
- Comprador: biblioteca, histórico de encomendas e acesso autorizado ao conteúdo.
- Produtor: perfil comercial, KYC, ebooks, ficheiros, submissão para análise, vendas, saldo, destinos e saques.
- Backoffice: produtores, KYC, moderação de produtos, encomendas e decisões individuais de saques.

O frontend apresenta actualmente apenas ebooks no formulário simplificado. O backend já suporta a estrutura de cursos, mas o editor de módulos e aulas deve ser implementado antes de a opção ser exposta ao utilizador.

## Uploads

Documentos KYC e ficheiros de produtos não passam pelo backend:

1. O frontend pede uma autorização à API.
2. Envia o ficheiro directamente para S3/MinIO usando os campos assinados.
3. Confirma o upload e associa a referência ao recurso.

As capas usam uma URL `PUT` assinada; documentos e conteúdos usam formulário `POST` assinado.

## Segurança financeira

Checkout e saques usam `Idempotency-Key`. Operações incertas são preservadas em `sessionStorage` apenas com a referência e o payload operacional, nunca com tokens ou palavras-passe. Uma resposta ambígua não cria automaticamente outra cobrança ou outro saque.

Valores monetários atravessam a API em meticais como números decimais. A conversão para unidades menores é uma responsabilidade interna do backend.
