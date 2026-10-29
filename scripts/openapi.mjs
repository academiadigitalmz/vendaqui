// Gera docs/openapi.json a partir de src/api/types.ts (esquemas) e da tabela de rotas abaixo.
// Mantém a especificação igual ao que o frontend realmente usa: corra `npm run openapi`
// sempre que mudar types.ts ou endpoints.ts.
import { createGenerator } from "ts-json-schema-generator";
import { writeFileSync } from "node:fs";

import { readFileSync } from "node:fs";
const gen = createGenerator({ path: "src/api/types.ts", tsconfig: "tsconfig.json", expose: "export", topRef: true, skipTypeCheck: true, jsDoc: "extended" });
// gera cada tipo exportado (o modo "*" omite os tipos que ninguém referencia)
const names = [...readFileSync("src/api/types.ts", "utf8").matchAll(/^export (?:interface|type) (\w+)(?![\w<])/gm)].map((m) => m[1]);
const defs = {};
for (const n of names) Object.assign(defs, gen.createSchema(n).definitions);
// nomes genéricos (Paginated<X>) viram PaginatedX, porque "<" e ">" não são válidos em referências
const clean = (str) => str.replaceAll("%3C", "<").replaceAll("%3E", ">").replace(/(Paginated)<(\w+)>/g, "$1$2");
const schemas = JSON.parse(clean(JSON.stringify(defs).replaceAll("#/definitions/", "#/components/schemas/")));

const ref = (t) => {
  if (!t) return undefined;
  if (t.endsWith("[]")) return { type: "array", items: ref(t.slice(0, -2)) };
  if (t.startsWith("Paginated<")) {
    const inner = t.slice(10, -1);
    return { allOf: [{ $ref: "#/components/schemas/PaginatedBase" }, { type: "object", properties: { items: { type: "array", items: ref(inner) } }, required: ["items"] }] };
  }
  return { $ref: `#/components/schemas/${t}` };
};
schemas.PaginatedBase = { type: "object", properties: { page: { type: "number" }, pageSize: { type: "number" }, total: { type: "number" } }, required: ["page", "pageSize", "total"] };
schemas.Inline = { type: "object", description: "Objeto descrito no resumo da operação; ver src/api/endpoints.ts." };
schemas.DecisionInput = { type: "object", properties: { decision: { type: "string", enum: ["approve", "reject"] } }, required: ["decision"] };
schemas.KycDecisionInput = { type: "object", properties: { decision: { $ref: "#/components/schemas/KycDecision" }, note: { type: "string" } }, required: ["decision"] };
schemas.EnabledInput = { type: "object", properties: { enabled: { type: "boolean" } }, required: ["enabled"] };
schemas.DoneInput = { type: "object", properties: { done: { type: "boolean" } }, required: ["done"] };
schemas.CodeInput = { type: "object", properties: { code: { type: "string" } }, required: ["code"] };
schemas.NoteInput = { type: "object", properties: { note: { type: "string" } }, required: ["note"] };
schemas.BatchDecisionInput = { type: "object", properties: { ids: { type: "array", items: { type: "string" } }, decision: { type: "string", enum: ["approve", "reject"] } }, required: ["ids", "decision"] };
schemas.SellerPatch = { type: "object", properties: { status: { type: "string", enum: ["verified", "in_review", "blocked"] }, feePercent: { type: "number" }, feeFixed: { type: "number" } } };

// [método, caminho, tag, resumo, corpo do pedido, resposta, parâmetros de query, público?]
const R = [
  ["post", "/auth/login", "Autenticação", "Entrar com email e palavra-passe", "LoginInput", "Session", [], true],
  ["post", "/auth/register", "Autenticação", "Criar conta de produtor (inicia o KYC)", "RegisterInput", "Session", [], true],
  ["get", "/me", "Autenticação", "Utilizador da sessão", null, "User"],

  ["get", "/seller/dashboard", "Produtor", "Resumo do painel para o período", null, "Dashboard", [["period", "today|7d|30d|12m", true]]],
  ["get", "/seller/products", "Produtor", "Lista de produtos", null, "Product[]"],
  ["post", "/seller/products", "Produtor", "Criar produto (fica em análise)", "ProductInput", "Product"],
  ["get", "/seller/products/{id}", "Produtor", "Detalhe do produto com ofertas, checkout, upsell e afiliação", null, "ProductDetail"],
  ["patch", "/seller/products/{id}", "Produtor", "Atualizar campos do produto", "ProductDetail", "ProductDetail"],
  ["put", "/seller/products/{id}/checkout", "Produtor", "Guardar a configuração do checkout", "CheckoutSettings", "CheckoutSettings"],
  ["get", "/seller/sales", "Produtor", "Vendas com filtros e contagens por estado", null, "SalesPage", [["q", "string"], ["status", "SaleStatus"], ["method", "PaymentMethod"], ["productId", "string"], ["page", "number"]]],
  ["get", "/seller/sales/{id}", "Produtor", "Detalhe da venda com histórico e rastreio", null, "SaleDetail"],
  ["post", "/seller/sales/{id}/refund", "Produtor", "Reembolsar uma venda aprovada", null, "SaleDetail"],
  ["post", "/seller/sales/{id}/resend-access", "Produtor", "Reenviar o acesso ao comprador", null, null],
  ["get", "/seller/subscriptions", "Produtor", "Assinantes e resumo { summary: SubscriptionsSummary, items: Subscription[], total }", null, "Inline"],
  ["get", "/seller/customers", "Produtor", "Clientes { summary: CustomersSummary } + Paginated<Customer>", null, "Inline", [["q", "string"]]],
  ["get", "/seller/affiliates", "Produtor", "Afiliados, pedidos e mercado de afiliação", null, "AffiliatesOverview"],
  ["post", "/seller/affiliates/requests/{id}", "Produtor", "Aprovar ou recusar um pedido de afiliação", "DecisionInput", null],
  ["get", "/seller/coupons", "Produtor", "Cupões", null, "Coupon[]"],
  ["post", "/seller/coupons", "Produtor", "Criar cupão (409 se o código já existir)", "CouponInput", "Coupon"],
  ["get", "/seller/recovery", "Produtor", "Carrinhos abandonados e automações", null, "RecoveryOverview"],
  ["patch", "/seller/recovery/automations/{id}", "Produtor", "Ligar ou desligar uma automação", "EnabledInput", "RecoveryAutomation"],
  ["post", "/seller/recovery/carts/{id}/contact", "Produtor", "Enviar link de pagamento ao comprador", null, null],
  ["get", "/seller/courses/{productId}", "Produtor", "Módulos e aulas do curso, com estatísticas", null, "Course"],
  ["get", "/seller/finance", "Produtor", "Saldo, extrato, saques, contas e prazos", null, "Finance"],
  ["post", "/seller/payouts", "Produtor", "Pedir saque (422 se abaixo de 100 MT ou acima do saldo)", "PayoutInput", "Payout"],
  ["get", "/seller/integrations", "Produtor", "Integrações, chaves da API e webhooks", null, "IntegrationsOverview"],
  ["get", "/seller/account", "Produtor", "Perfil, verificação, notificações, segurança e equipa", null, "Account"],
  ["patch", "/seller/account/profile", "Produtor", "Atualizar o perfil público", "Inline", "Inline"],

  ["get", "/public/checkout/{slug}", "Checkout público", "Dados do checkout de um produto", null, "PublicCheckout", [], true],
  ["post", "/public/checkout/{slug}/coupons", "Checkout público", "Validar cupão", "CodeInput", "CouponCheck", [], true],
  ["post", "/public/checkout/{slug}/orders", "Checkout público", "Criar pedido e iniciar o pagamento. M-Pesa/e-Mola enviam push USSD; cartão usa cardToken do adquirente", "OrderInput", "Order", [], true],
  ["get", "/public/orders/{id}", "Checkout público", "Estado do pedido (o frontend consulta de segundo a segundo até sair de awaiting_confirmation)", null, "Order", [], true],
  ["post", "/public/orders/{id}/upsell", "Checkout público", "Aceitar o upsell com 1 clique", null, "Order", [], true],

  ["get", "/student/library", "Aluno", "Produtos comprados e recomendação", null, "Library"],
  ["get", "/student/courses/{productId}", "Aluno", "Curso com o progresso do aluno", null, "Course"],
  ["post", "/student/lessons/{id}/progress", "Aluno", "Marcar aula como concluída ou não", "DoneInput", "Course"],
  ["get", "/student/purchases", "Aluno", "Compras do aluno", null, "Purchase[]"],
  ["post", "/student/purchases/{id}/refund", "Aluno", "Pedir reembolso (202)", "RefundRequestInput", null],

  ["get", "/admin/overview", "Backoffice", "Indicadores em tempo real, fila de trabalho e saúde dos métodos", null, "AdminOverview"],
  ["get", "/admin/sellers", "Backoffice", "Produtores", null, "Paginated<SellerRow>", [["q", "string"]]],
  ["patch", "/admin/sellers/{id}", "Backoffice", "Alterar estado ou taxa do produtor", "SellerPatch", "SellerRow"],
  ["get", "/admin/kyc", "Backoffice", "Fila de verificação de identidade", null, "KycRequest[]"],
  ["post", "/admin/kyc/{id}/decision", "Backoffice", "Aprovar, pedir correção ou rejeitar", "KycDecisionInput", null],
  ["get", "/admin/moderation", "Backoffice", "Produtos à espera de revisão", null, "ModerationItem[]"],
  ["post", "/admin/moderation/{id}/decision", "Backoffice", "Aprovar ou recusar um produto", "DecisionInput", null],
  ["get", "/admin/transactions", "Backoffice", "Todas as transações com risco e rota", null, "Paginated<AdminTransaction>"],
  ["get", "/admin/risk", "Backoffice", "Regras antifraude, listas de bloqueio e suspeitas", null, "RiskOverview"],
  ["patch", "/admin/risk/rules/{id}", "Backoffice", "Ligar ou desligar uma regra", "EnabledInput", null],
  ["get", "/admin/payouts", "Backoffice", "Saques para aprovar e resumo { summary, items: Payout[] }", null, "Inline"],
  ["post", "/admin/payouts/batch", "Backoffice", "Aprovar ou rejeitar saques em lote", "BatchDecisionInput", null],
  ["get", "/admin/disputes", "Backoffice", "Chargebacks e reclamações", null, "Dispute[]"],
  ["post", "/admin/disputes/{id}/evidence", "Backoffice", "Enviar provas ao adquirente (202)", "NoteInput", null],
  ["get", "/admin/gateways", "Backoffice", "Fornecedores de pagamento e encaminhamento { gateways: Gateway[], routing: RoutingRule[], incident? }", null, "Inline"],
  ["get", "/admin/fees", "Backoffice", "Planos, prazos de libertação e regras de saque", null, "FeesConfig"],
  ["get", "/admin/team", "Backoffice", "Equipa e matriz de permissões { members: StaffMember[], roles }", null, "Inline"],
  ["get", "/admin/audit-logs", "Backoffice", "Registo de auditoria", null, "Paginated<AuditLog>"],
];

const paths = {};
for (const [method, path, tag, summary, body, res, query = [], pub = false] of R) {
  const params = [...path.matchAll(/\{(\w+)\}/g)].map(([, n]) => ({ name: n, in: "path", required: true, schema: { type: "string" } }));
  for (const [n, t, req] of query) params.push({ name: n, in: "query", required: !!req, schema: ["string", "number"].includes(t) ? { type: t } : t.includes("|") ? { type: "string", enum: t.split("|") } : ref(t) });
  const op = { tags: [tag], summary, operationId: (method + path).replace(/[{}]/g, "").replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()), parameters: params.length ? params : undefined, security: pub ? [] : undefined, responses: {} };
  if (body) op.requestBody = { required: true, content: { "application/json": { schema: ref(body) } } };
  op.responses[res ? "200" : method === "post" && /refund|evidence/.test(path) ? "202" : "204"] = res ? { description: "OK", content: { "application/json": { schema: ref(res) } } } : { description: "Sem conteúdo" };
  op.responses["4XX"] = { description: "Erro de validação, autorização ou estado", content: { "application/json": { schema: ref("ApiError") } } };
  (paths[path] ??= {})[method] = op;
}

const doc = {
  openapi: "3.1.0",
  info: { title: "VendAqui API", version: "1.0.0", description: "Contrato entre o frontend VendAqui e o backend. Gerado a partir de src/api/types.ts. Valores monetários em meticais (MZN), datas em ISO 8601. Erros devolvem ApiError com código HTTP 4xx." },
  servers: [{ url: "/api/v1", description: "Mesmo domínio (VITE_API_URL=/api)" }, { url: "https://api.vendaqui.co.mz/v1", description: "Exemplo de produção" }],
  security: [{ bearer: [] }],
  tags: ["Autenticação", "Produtor", "Checkout público", "Aluno", "Backoffice"].map((name) => ({ name })),
  paths,
  components: { securitySchemes: { bearer: { type: "http", scheme: "bearer", description: "Token devolvido por /auth/login ou /auth/register" } }, schemas },
};
writeFileSync("docs/openapi.json", JSON.stringify(doc, null, 2) + "\n");
console.log(`docs/openapi.json: ${R.length} operações, ${Object.keys(schemas).length} esquemas`);
