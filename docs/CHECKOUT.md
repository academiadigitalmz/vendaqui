# Integração da compra

O checkout usa o contrato do backend `ac665e9`. As restantes áreas mantêm o contrato do protótipo e precisam de alinhamento separado.

## Pedidos

| Operação | Método e caminho (prefixo `/v1`) |
|---|---|
| Produto e ofertas | `GET /public/products/{slug}` |
| Métodos disponíveis | `GET /payments/methods` |
| Criar encomenda e cobrar | `POST /checkout/orders` |
| Consultar resultado | `GET /checkout/orders/{id}` |
| Nova tentativa | `POST /checkout/orders/{id}/payment-attempts` |
| Associar convidado | `POST /checkout/orders/{id}/claim` |

A criação envia `productId`, `offerId`, `method`, `msisdn` e, sem sessão, `buyer: { name, email, msisdn }`. Apenas ofertas activas, únicas e em MZN são seleccionáveis. Métodos precisam de `isEnabled` e `ready`; o fluxo actual suporta M-Pesa e e-Mola. `?offerId=` permite seleccionar uma oferta específica.

O cliente interpreta `{ data: ... }` e `{ error: { code, message, details? } }`. Valores monetários JSON já são expressos em MZN; não dividir por 100.

## Recuperação e idempotência

Antes de enviar a criação, guardar um UUID aleatório e o payload em `sessionStorage`. Repetir uma submissão sem resposta reutiliza exactamente ambos. Guardar também o ID e `checkoutToken` devolvidos; a consulta e as tentativas de convidados enviam `Checkout-Token`. Estes valores nunca entram no URL. O mesmo separador consegue recuperar o acompanhamento depois de recarregar a página.

Não gerar automaticamente outra encomenda após timeout. Se a criação original tiver sido concluída e paga antes de a resposta chegar, o backend pode recusar a repetição sem devolver o ID; esse caso requer recuperação pelo apoio/backend. Não apagar a referência nem inventar sucesso.

Uma nova tentativa só aparece com encomenda `pending_payment` ainda válida, tentativa `failed`/`cancelled` e pagamento sem sucesso nem processamento incerto. Cada nova tentativa tem outro UUID; se a resposta se perder, a sua referência permanece guardada. Não repetir cobranças em `unknown`, `pending` ou reconciliação.

A confirmação exige encomenda `paid` e pagamento `succeeded`. A página de resultado também consulta o servidor; visitar o URL não comprova pagamento.

## Acesso

Depois do pagamento de convidado, aguardar `claimStatus=pending_identity`. O código de email e uma palavra-passe de 12–128 caracteres criam a conta; quem já tem conta inicia sessão no próprio ecrã antes de confirmar o código. Não existe endpoint de reenvio: códigos expirados e revisão manual encaminham para apoio. O endpoint de claim actualmente serializa o utilizador de domínio com chaves PascalCase, incluindo campos internos. O cliente extrai apenas ID, nome, email e MSISDN; o backend deve substituir essa serialização por uma vista pública. A sessão recebida usa `accessToken` e o refresh cookie HttpOnly do backend.

Depois da associação, o botão abre `/compras/{productId}/conteudo`, que usa `/me/products/{productId}/content` e os endpoints autorizados de playback/download. O servidor decide os direitos de acesso. A área antiga `/aluno` ainda usa o contrato do protótipo.

Cupões, upsell, order bump, Apple Pay e campos de cartão de demonstração não são apresentados no checkout de compra. O editor do produtor continua a ser uma pré-visualização separada.

## Configuração e validação

Para API real: `VITE_USE_MOCKS=false`, `VITE_API_URL` sem `/v1`. Configurar CORS com a origem exacta, credenciais e headers `Authorization`, `Content-Type`, `Idempotency-Key`, `Checkout-Token`. Preferir proxy na mesma origem para o refresh cookie.

```sh
VITE_USE_MOCKS=false VITE_DEFAULT_SKIN=cakto npm run build
npm run preview -- --host 127.0.0.1
# Noutro terminal (CHROME_PATH aponta para o Chrome/Chromium instalado):
npm run test:checkout
```

Os testes de contrato interceptam HTTP no browser e cobrem convidados, sessão autenticada, resposta perdida, recarregamento, pagamento incerto, recusa confirmada, associação e conteúdo. Não fazem cobranças reais. Para testar os mocks, construir sem `VITE_USE_MOCKS=false` e executar `test:flows`; código de confirmação de demonstração: `123456`.
