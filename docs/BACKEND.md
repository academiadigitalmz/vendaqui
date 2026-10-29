# Guia para quem vai fazer o backend

O frontend já está completo e funciona com uma API simulada no próprio browser. O seu trabalho é
implementar a API real com o mesmo contrato. Quando estiver pronta, muda-se uma variável de ambiente e
a app passa a falar com o seu servidor, sem mexer no código das páginas.

## Onde está o contrato

| Ficheiro | O que tem |
|---|---|
| `docs/openapi.json` | Especificação OpenAPI 3.1: 56 operações, pedidos, respostas e erros. Abra em [editor.swagger.io](https://editor.swagger.io) ou importe no Postman/Insomnia. |
| `src/api/types.ts` | Os mesmos objetos em TypeScript, com comentários. É a fonte de verdade: a especificação é gerada a partir daqui com `npm run openapi`. |
| `src/api/endpoints.ts` | Cada chamada que a app faz, com o método e o caminho. |
| `src/mocks/handlers.ts` | Implementação de referência que corre no browser (MSW). Mostra as regras de negócio esperadas: validações, códigos de erro, transições de estado. |

Se precisar de mudar um formato, mude `src/api/types.ts`, corra `npm run openapi` e `npm run typecheck`. O
TypeScript aponta todas as páginas que precisam de ajuste.

## Ligar a app ao seu backend

```bash
VITE_API_URL=https://api.vendaqui.co.mz   # sem /v1 e sem barra no fim; a app acrescenta /v1
VITE_USE_MOCKS=false
```

No Vercel, defina estas variáveis em *Project → Settings → Environment Variables* e faça um novo deploy.
Para desenvolvimento local, crie `.env.local` com os mesmos valores.

Se a API ficar noutro domínio, ative CORS para o domínio do frontend com os cabeçalhos `Authorization` e
`Content-Type`. Alternativa: servir a API em `/api` no mesmo domínio (por exemplo com um rewrite do Vercel
para o seu servidor) e deixar `VITE_API_URL=/api`.

## Convenções

- **Base:** todos os caminhos começam em `/v1` (ex.: `GET /v1/seller/dashboard`).
- **Autenticação:** `POST /auth/login` e `POST /auth/register` devolvem `{ token, user }`. A app envia
  `Authorization: Bearer <token>` em todos os pedidos seguintes. `user.role` é `seller`, `admin` ou `student`
  e decide a área a que a pessoa tem acesso. Rotas `/public/*` não exigem token.
- **Dinheiro:** número decimal em meticais (`2490` = 2 490,00 MT). A app formata; não envie texto.
- **Datas:** ISO 8601 em UTC (`2026-10-22T09:41:00Z`).
- **Erros:** código HTTP 4xx/5xx com corpo `ApiError` `{ code, message, fields? }`. A `message` é mostrada ao
  utilizador tal como vier, por isso escreva-a em português e diga como resolver
  (ex.: `"O valor mínimo de saque é 100 MT."`).
- **Listas paginadas:** `{ items, page, pageSize, total }`.
- **Sem conteúdo:** ações sem resposta devolvem `204` (ou `202` quando ficam em processamento).

## Fluxos que merecem atenção

### Pagamento no checkout
1. `POST /public/checkout/{slug}/orders` cria o pedido com estado `awaiting_confirmation` e inicia a cobrança:
   - **M-Pesa** (84, 85) e **e-Mola** (86, 87): pedido C2B com push USSD para `walletPhone`. Valide o prefixo e
     devolva `422 wallet_mismatch` se não corresponder ao método. Números Tmcel (82, 83) não são aceites.
   - **Cartão**: a app envia `cardToken`, nunca o número do cartão. Antes de ligar o real, troque os campos
     de cartão do checkout pelos campos alojados do adquirente (que devolvem o token). Assim o servidor nunca
     toca no número do cartão e o âmbito PCI fica mínimo.
   - **Apple Pay / Google Pay**: o token de pagamento do dispositivo segue pelo mesmo adquirente do cartão.
2. A app consulta `GET /public/orders/{id}` a cada segundo até o estado ser `approved`, `declined` ou `expired`.
   O pedido de PIN expira em 60 segundos.
3. Com `approved`, a app abre `/obrigado/{id}`. O backend deve enviar o acesso por email e SMS e disparar os
   webhooks e pixels do produtor.

### Saldo e saques
- Taxa por venda aprovada: 4,9% + 10 MT (configurável por plano em `/admin/fees`).
- Libertação: carteiras móveis D+2; cartão, Apple Pay e Google Pay D+14; reserva de 5% durante 30 dias.
- `POST /seller/payouts`: mínimo 100 MT, não pode passar o saldo disponível (`422`). Saques acima de
  100 000 MT ficam `pending` e aparecem em `/admin/payouts` para aprovação manual.

### Reembolsos e garantia
- Dentro do prazo de garantia do produto (7, 15 ou 30 dias) o reembolso pedido pelo aluno é automático.
- `POST /seller/sales/{id}/refund` só aceita vendas `approved` (`409 not_refundable` nos outros casos).

### KYC
- `POST /auth/register` cria a conta com `kycStatus: "pending"`. Os documentos (BI frente e verso, selfie,
  NUIT) ainda não têm endpoint de upload: falta definir onde ficam guardados (ver "Por decidir").

## Por decidir com o produto

- Fornecedores reais: integração M-Pesa (Vodacom) e e-Mola (Movitel), e o adquirente de cartões que também
  faz Apple Pay e Google Pay.
- Upload de ficheiros: documentos KYC, capas, vídeos das aulas e ficheiros de produto (armazenamento e
  URLs assinadas). Os ecrãs já existem; falta o endpoint.
- Notificações em tempo real (nova venda): hoje a app mostra avisos simulados. Pode ser WebSocket, SSE ou
  consulta periódica.
- Paginação no servidor para vendas, clientes, transações e auditoria (o contrato já tem `page`).

## Testar a sua implementação contra o frontend

```bash
cp .env.example .env.local      # e ponha VITE_USE_MOCKS=false e o seu VITE_API_URL
npm install
npm run dev                     # abre em http://localhost:5173
npm run build && npx vite preview --port 4173 &
npm run test:routes             # abre as 38 rotas num browser e falha em erros de consola ou páginas vazias
```
