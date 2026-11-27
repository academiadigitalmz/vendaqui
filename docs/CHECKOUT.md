# Integração da compra

## Rotas

| Operação                              | Método e caminho, depois de `/v1`             |
| ------------------------------------- | --------------------------------------------- |
| Consultar produto                     | `GET /public/products/{slug}`                 |
| Consultar métodos                     | `GET /payments/methods`                       |
| Criar encomenda e iniciar cobrança    | `POST /checkout/orders`                       |
| Consultar resultado                   | `GET /checkout/orders/{id}`                   |
| Nova tentativa confirmada como segura | `POST /checkout/orders/{id}/payment-attempts` |
| Associar compra de convidado          | `POST /checkout/orders/{id}/claim`            |

A criação envia `productId`, `offerId`, `method`, `msisdn` e, sem sessão, `buyer: { name, email, msisdn }`. O fluxo actual apresenta apenas M-Pesa e e-Mola quando o método está activo e operacional.

## Idempotência

Antes da criação, o frontend guarda o UUID da operação e o payload em `sessionStorage`. Se a resposta se perder, repete exactamente o mesmo pedido e a mesma `Idempotency-Key`. O ID da encomenda e o `Checkout-Token` ficam associados ao mesmo rascunho e nunca aparecem no URL.

Uma nova tentativa só é oferecida quando a encomenda ainda está válida e o backend confirma uma recusa. Estados `pending`, `processing`, `unknown` ou de reconciliação não permitem repetir a cobrança.

Uma resposta 400 ou 422 descarta o pedido guardado, para o comprador o corrigir e enviar outro. Qualquer outra falha mantém a mesma chave e o mesmo payload, e o número fica bloqueado enquanto essa tentativa não for resolvida.

Uma encomenda paga liberta o rascunho do produto. Uma encomenda encerrada só permite uma nova encomenda se estiver reembolsada, ou se o pagamento (`pending`, `failed`, `cancelled`, `expired`) e a tentativa (`failed`, `cancelled`, `expired`) já não puderem cobrar; caso contrário o comprador é encaminhado para o apoio.

Enquanto espera, o comprador vê o número da encomenda. Depois de `expiresAt` é avisado para não pagar de novo e a consulta passa de 2 para 15 segundos.

## Sessão

Pedidos usam `credentials: include`. O refresh token permanece no cookie HttpOnly; o access token existe apenas em memória. Para convidados, o `Checkout-Token` autoriza apenas a encomenda concreta e deve estar permitido pelo CORS.

Depois do pagamento, o comprador associa a compra através do código recebido. Para uma conta existente, o frontend pede a associação automaticamente; se falhar, mostra o erro, permite repetir e iniciar sessão, e só apresenta o acesso depois de a associação resultar. Sem conta, o comprador define uma palavra-passe de 12–128 caracteres.

Das respostas de `claim` e `login` o frontend copia apenas ID, nome, email e MSISDN. O backend deve devolver só esses campos.

## Conteúdo

Depois da associação, `/compras/{productId}/conteudo` consulta exclusivamente endpoints protegidos em `/me/products` e `/me/lessons`. O servidor continua a ser a autoridade sobre os direitos de acesso.

Valores monetários JSON são expressos em MZN. O frontend nunca divide ou multiplica valores por 100.

## Cabeçalhos de segurança

`vercel.json` define a Content Security Policy e os restantes cabeçalhos. Scripts só da própria origem (por isso o arranque do tema está em `public/theme.js`); ligações, imagens e vídeo externos só por HTTPS. A API definida em `VITE_API_URL` e os URLs de armazenamento têm de ser HTTPS. A barra de comentários das pré-visualizações do Vercel fica bloqueada.

## Testes

```sh
npm run build
npm run test:checkout
```

Os testes simulam a API por HTTP, servem `dist/` com os cabeçalhos de `vercel.json` e usam o Chrome instalado (`CHROME_PATH` escolhe outro). Não fazem cobranças nem testam o backend real.
