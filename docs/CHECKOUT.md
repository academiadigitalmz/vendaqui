# Integração da compra

## Rotas

| Operação | Método e caminho, depois de `/v1` |
|---|---|
| Consultar produto | `GET /public/products/{slug}` |
| Consultar métodos | `GET /payments/methods` |
| Criar encomenda e iniciar cobrança | `POST /checkout/orders` |
| Consultar resultado | `GET /checkout/orders/{id}` |
| Nova tentativa confirmada como segura | `POST /checkout/orders/{id}/payment-attempts` |
| Associar compra de convidado | `POST /checkout/orders/{id}/claim` |

A criação envia `productId`, `offerId`, `method`, `msisdn` e, sem sessão, `buyer: { name, email, msisdn }`. O fluxo actual apresenta apenas M-Pesa e e-Mola quando o método está activo e operacional.

## Idempotência

Antes da criação, o frontend guarda o UUID da operação e o payload em `sessionStorage`. Se a resposta se perder, repete exactamente o mesmo pedido e a mesma `Idempotency-Key`. O ID da encomenda e o `Checkout-Token` ficam associados ao mesmo rascunho e nunca aparecem no URL.

Uma nova tentativa só é oferecida quando a encomenda ainda está válida e o backend confirma uma recusa. Estados `pending`, `processing`, `unknown` ou de reconciliação não permitem repetir a cobrança.

## Sessão

Pedidos usam `credentials: include`. O refresh token permanece no cookie HttpOnly; o access token existe apenas em memória. Para convidados, o `Checkout-Token` autoriza apenas a encomenda concreta e deve estar permitido pelo CORS.

Depois do pagamento, o comprador associa a compra através do código recebido. Se a conta já existir, inicia sessão e confirma a associação; caso contrário define uma palavra-passe de 12–128 caracteres.

## Conteúdo

Depois da associação, `/compras/{productId}/conteudo` consulta exclusivamente endpoints protegidos em `/me/products` e `/me/lessons`. O servidor continua a ser a autoridade sobre os direitos de acesso.

Valores monetários JSON são expressos em MZN. O frontend nunca divide ou multiplica valores por 100.
