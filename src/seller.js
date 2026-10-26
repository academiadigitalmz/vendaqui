
/* ══════════ Área do produtor ══════════ */
const PERIODS = { hoje: ["Hoje", 0.034], "7d": ["7 dias", 0.24], "30d": ["30 dias", 1], "12m": ["12 meses", 10.8] };
const periodTabs = (act = "period", cur = S.period) => `<div class="ad-tabs ad-tabs-segmented">${Object.entries(PERIODS).map(([k, [l]]) => `<button class="ad-tab ${cur === k ? "is-active" : ""}" data-act="${act}" data-arg="${k}">${l}</button>`).join("")}</div>`;
ACT.period = (el) => { S.period = el.dataset.arg; render(); };
const REV30 = series(30, 52000, 0.2, 650, 5);
const SALES30 = REV30.map((v) => Math.round(v / 2140));

route("painel", "seller", () => {
  const [pl, f] = PERIODS[S.period];
  const rev = 1648230 * f, n = Math.round(771 * f), refunds = 0.9;
  const chartData = S.period === "12m" ? series(12, 1200000, 0.12, 30000, 9) : S.period === "7d" ? REV30.slice(-7) : S.period === "hoje" ? series(12, 4200, 0.4, 120, 4) : REV30;
  const labels = S.period === "12m" ? ["nov", "dez", "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out"] : S.period === "hoje" ? ["08h", "09h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h", "19h"] : (S.period === "7d" ? DAYS30.slice(-7) : DAYS30).map((d) => dt(d, false));
  const methods = [["mpesa", 46.3], ["emola", 18.2], ["card", 15.4], ["applepay", 10.8], ["googlepay", 9.3]];
  const top = PRODUCTS.slice(0, 4).map((p, i) => [p, [0.52, 0.27, 0.13, 0.08][i]]);
  const goal = 10000000, total = 5870340;
  return `<div class="welcome"><div class="stack-xs"><span class="faint" style="font-size:13px">Quinta-feira, 22 de outubro</span><h1>Olá, Ana</h1><p class="muted">Vendeu ${int(Math.round(37))} vezes hoje. O Excel do Zero continua a puxar as vendas.</p></div>${periodTabs()}</div>
  <div class="g4">
    ${kpi("Faturamento líquido", mt(rev, 0), { icon: "wallet", delta: 12.4, hint: `${pl} · já sem taxas`, spark: REV30.slice(-14) })}
    ${kpi("Vendas aprovadas", int(n), { icon: "receipt", tone: "success", delta: 8.1, hint: `${int(Math.round(n * 0.11))} vieram de afiliados`, spark: SALES30.slice(-14), sc: "var(--success)" })}
    ${kpi("Ticket médio", mt(2137.6, 0), { icon: "tag", tone: "info", delta: 3.2, hint: "Order bump em 28% das vendas" })}
    ${kpi("Conversão do checkout", pct(7.8), { icon: "target", tone: "purple", delta: -0.6, hint: `Reembolsos: ${pct(refunds)}` })}
  </div>
  <div class="g-main">
    ${card("Faturamento", `${areaChart(chartData, labels, { aria: "Faturamento por dia", h: 250 })}`, { icon: "trendup", aside: `<div class="legend"><span><i></i>Líquido em MT</span></div>` })}
    <div class="stack-sm" style="gap:16px">
      <section class="balance-card"><div class="row-between"><small>Saldo disponível</small>${badge("Saque grátis", "success")}</div><span class="big">${mt(48320)}</span>
        <div class="balance-split"><div><small>A libertar</small><b>${mt(126480)}</b></div><div><small>Reserva 5%</small><b>${mt(18210)}</b></div></div>
        <div class="row" style="gap:8px">${btn("Sacar", { v: "primary", i: "cash", act: "withdraw", cls: "grow" })}${btn("Extrato", { go: "financeiro" })}</div>
        <small>Próxima libertação: 24 out · ${mt(6120)}</small></section>
      ${card("", `<div class="plaque"><span class="plaque-medal">${ic("award", 26)}</span><div class="grow stack-xs"><b>Rumo à placa de 10 milhões</b><span class="faint" style="font-size:13px">${mt(total, 0)} faturados desde jan 2025</span></div></div><div class="ad-progress"><div class="ad-progress-top"><span>Faltam ${mt(goal - total < 0 ? 0 : goal - total, 0)}</span><strong>${Math.min(100, Math.round((total / goal) * 100))}%</strong></div><div class="ad-progress-track"><div class="ad-progress-fill" style="width:${Math.min(100, (total / goal) * 100)}%;background:var(--primary)"></div></div></div>`)}
    </div>
  </div>
  <div class="g3">
    ${card("Métodos de pagamento", `<div class="stack-sm">${methods.map(([k, v]) => `<div class="hbar">${pm(k)}${meter(v, `var(--m-${k})`)}<b>${pct(v)}</b></div>`).join("")}</div><p class="faint" style="font-size:12.5px">Aprovação: e-Mola 94,6% · M-Pesa 96,0% · Apple Pay 93,4% · Google Pay 92,1% · Cartão 86,3%</p>`, { icon: "wallet", tone: "info" })}
    ${card("Mais vendidos", `<div class="stack-sm">${top.map(([p, s]) => `<button class="ad-item is-interactive ad-item-plain" data-act="openProduct" data-arg="${p.id}" style="padding:4px 0"><span class="cover cv-${p.cv}">${ic(p.icon, 18)}</span><div class="ad-item-main"><span class="ad-item-title" style="font-size:14px">${p.name}</span><span class="ad-item-meta"><span>${mt(rev * s, 0)}</span></span></div><span class="faint" style="font-size:13px">${pct(s * 100, 0)}</span></button>`).join("")}</div>`, { icon: "package", aside: `<button class="ad-link ad-btn-link" data-go="produtos">Ver todos</button>` })}
    ${card("Configure a sua conta", `<div class="checklist">${[["Verificar identidade", 1, "conta"], ["Criar o primeiro produto", 1, "produto-novo"], ["Adicionar conta de recebimento", 1, "financeiro"], ["Ligar o Pixel da Meta", 0, "integracoes"], ["Convidar o primeiro afiliado", 0, "afiliados"]].map(([t, d, r]) => `<button class="${d ? "done" : ""}" data-go="${r}"><span class="c">${d ? ic("check", 12) : ""}</span><span>${t}</span>${ic("right", 16, "chev")}</button>`).join("")}</div><div class="ad-progress ad-progress-sm"><div class="ad-progress-top"><span>3 de 5 concluídos</span><strong>60%</strong></div><div class="ad-progress-track"><div class="ad-progress-fill" style="width:60%;background:var(--success)"></div></div></div>`, { icon: "checkc", tone: "success" })}
  </div>
  ${card("Últimas vendas", salesTable(SALES.slice(0, 6), true), { icon: "receipt", flush: true, aside: `<button class="ad-link ad-btn-link" data-go="vendas">Ver todas as vendas</button>` })}`;
}, "Painel");

function salesTable(rows, compact = false, pagerN = 0) {
  return table([
    { l: "Venda", f: (s) => `<span class="mono">${s.id}</span><br><small class="faint">${dt(s.t)}</small>` },
    { l: "Cliente", f: (s) => cellUser(s.name, compact ? s.city : mask(s.phone)) },
    { l: "Produto", f: (s) => `<span style="font-weight:500">${s.p.name}</span>${s.bump ? `<br><small class="faint">+ order bump</small>` : ""}${s.aff ? `<br><small class="faint">Afiliado: ${s.aff}</small>` : ""}` },
    { l: "Método", f: (s) => pm(s.m) },
    { l: "Valor", num: 1, f: (s) => `<b style="font-weight:600">${mt(s.val)}</b>${compact ? "" : `<br><small class="faint">Líquido ${mt(s.net)}</small>`}` },
    { l: "Estado", f: (s) => st(s.s) },
  ], rows, { click: "openSale", key: (s) => s.id, pager: pagerN });
}
ACT.openSale = (el) => openDrawer("sale", { id: el.dataset.arg });
DRAWERS.sale = ({ id }) => {
  const s = SALES.find((x) => x.id === id) || SALES[0];
  const ok = s.s === "Aprovada";
  const tl = [["Pedido criado no checkout", dt(new Date(s.t - 90000)), "neutral", "cart"], [s.m === "card" ? "Cartão autorizado pelo banco" : `Pedido de PIN enviado para ${mask(s.phone)}`, dt(new Date(s.t - 60000)), "info", s.m === "card" ? "card" : "phone"], ok ? ["Pagamento aprovado", dt(s.t), "success", "checkc"] : [`Pagamento ${s.s.toLowerCase()}`, dt(s.t), STATUS[s.s], s.s === "Pendente" ? "clock" : "xc"]];
  if (ok) tl.push(["Acesso enviado por email e SMS", dt(new Date(+s.t + 20000)), "success", "mail"], [`Libertação do saldo prevista`, s.m === "card" ? "em 14 dias" : "em 2 dias", "warning", "clock"]);
  return {
    over: s.id, title: mt(s.val), sub: `<div class="row" style="gap:8px">${st(s.s)}${pm(s.m)}</div>`,
    body: `<section class="stack-sm"><h3 class="section-title">Cliente</h3>${cellUser(s.name, s.email)}<dl class="dl"><dt>Telemóvel</dt><dd>${s.phone}</dd><dt>Cidade</dt><dd>${s.city}</dd><dt>IP · dispositivo</dt><dd>197.218.x.x · Android</dd></dl></section><hr class="hr">
    <section class="stack-sm"><h3 class="section-title">Divisão do valor</h3><dl class="dl"><dt>${s.p.name}</dt><dd>${mt(s.p.price)}</dd>${s.bump ? `<dt>Order bump · Ebook</dt><dd>${mt(190)}</dd>` : ""}<dt>Taxa VendAqui (${num(FEE.pct, 1)}% + ${FEE.fixed} MT)</dt><dd>−${mt(s.fee)}</dd>${s.aff ? `<dt>Comissão ${s.aff} (40%)</dt><dd>−${mt(s.affc)}</dd>` : ""}<dt><b style="color:var(--text)">Recebe</b></dt><dd><b>${mt(s.net)}</b></dd></dl></section><hr class="hr">
    <section class="stack-sm"><h3 class="section-title">Histórico</h3><ol class="timeline">${tl.map(([t, d, tone, i]) => `<li class="ad-tone-${tone}"><span class="tl-dot">${ic(i, 13)}</span><div class="tl-body"><b>${t}</b><small>${d}</small></div></li>`).join("")}</ol></section>
    <section class="stack-sm"><h3 class="section-title">Rastreio</h3><dl class="dl"><dt>Origem</dt><dd>${s.aff ? "Link de afiliado" : "Instagram · anúncio"}</dd><dt>utm_campaign</dt><dd class="mono">excel-out-26</dd><dt>Pixel Meta</dt><dd>Purchase enviado</dd></dl></section>`,
    foot: ok ? `${btn("Reenviar acesso", { i: "send", act: "toast", arg: "Acesso reenviado para " + s.email })}${btn("Reembolsar", { v: "danger", i: "refund", act: "refundSale", arg: s.id })}` : s.s === "Pendente" ? btn("Enviar link de pagamento por SMS", { v: "primary", i: "send", act: "toast", arg: "Link enviado por SMS para " + mask(s.phone) }) : btn("Fechar", { act: "closeDrawer" }),
  };
};
ACT.refundSale = (el) => openModal("confirmRefund", { id: el.dataset.arg });
MODALS.confirmRefund = ({ id }) => { const s = SALES.find((x) => x.id === id); return { title: "Reembolsar esta venda?", size: "sm", desc: `${s.id} · ${s.name}`, body: `<p class="muted">Devolvemos ${mt(s.val)} para a carteira ${METHODS[s.m].l} do cliente e retiramos ${mt(s.net)} do seu saldo. O acesso ao produto é cancelado.</p>`, foot: `${btn("Cancelar", { act: "closeModal" })}${btn("Reembolsar " + mt(s.val), { v: "danger", act: "refundDone", arg: id })}` }; };
ACT.refundDone = (el) => { const s = SALES.find((x) => x.id === el.dataset.arg); s.s = "Reembolsada"; S.modal = null; S.drawer = null; render(); toast("Reembolso enviado", `${mt(s.val)} a caminho de ${s.name}`, "info", "refund"); };

/* produtos */
route("produtos", "seller", () => `${pagehead("Produtos", "Cursos, ebooks, mentorias e assinaturas à venda.", btn("Novo produto", { v: "primary", i: "plus", go: "produto-novo" }))}
  <div class="ad-filterbar">${inp("pf-q", { icon: "search", ph: "Procurar produto", s: "sm" }).replace("ad-input ", "ad-input ad-search ")}${tabs([["t", "Todos", 6], ["a", "Ativos", 4], ["r", "Em análise", 1], ["d", "Rascunhos", 1]], "t", "toast", "pill")}</div>
  <div class="pgrid">${PRODUCTS.map((p) => `<button class="pcard" data-act="openProduct" data-arg="${p.id}"><div class="pcard-head cv-${p.cv}"><span class="pcard-type">${ic(p.icon, 14)}${p.type}</span><h4>${p.name}</h4></div><div class="pcard-body"><div class="row-between"><b style="font-size:17px">${mt(p.price, 0)}${p.recurring ? '<small class="faint" style="font-weight:500;font-size:13px"> /mês</small>' : ""}</b>${st(p.status)}</div><div class="pcard-stats"><div><small>Vendas</small><b>${int(p.sales)}</b></div><div><small>Receita</small><b>${short(p.rev)}</b></div><div><small>Conversão</small><b>${p.conv ? pct(p.conv) : "—"}</b></div></div></div></button>`).join("")}
  <button class="pcard" data-go="produto-novo" style="border-style:dashed;align-items:center;justify-content:center;min-height:260px;gap:8px;color:var(--text-secondary)">${tile("plus", "primary", "lg")}<b style="color:var(--text)">Criar produto</b><span style="font-size:13px">Curso, ebook, mentoria ou assinatura</span></button></div>`, "Produtos");
ACT.openProduct = (el) => { S.prodId = el.dataset.arg; S.prodTab = "geral"; go("produto"); };

/* criar produto */
const TYPES = [["curso", "Curso online", "Aulas em vídeo na área de membros", "cap"], ["ebook", "Ebook ou ficheiro", "PDF, planilhas, templates, áudio", "book"], ["mentoria", "Mentoria ou serviço", "Sessões ao vivo, consultoria", "users"], ["assinatura", "Assinatura", "Clube ou comunidade com mensalidade", "repeat"], ["evento", "Evento ou bilhete", "Workshop presencial ou online", "ticket"]];
const WSTEPS = ["Tipo", "Detalhes", "Preço", "Entrega", "Rever"];
route("produto-novo", "seller", () => {
  const w = S.wizard, s = w.step;
  let body = "";
  if (s === 0) body = `<div class="choice-grid" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">${TYPES.map(([k, t, d, i]) => `<button class="choice ${w.type === k ? "on" : ""}" data-act="wzType" data-arg="${k}">${tile(i, w.type === k ? "primary" : "neutral", "md")}<b>${t}</b><small>${d}</small></button>`).join("")}</div>`;
  if (s === 1) body = `<div class="g2">${field("Nome do produto", inp("wz-name", { value: w.name || "Templates de Gestão Financeira", s: "lg" }), { id: "wz-name", req: 1, help: "Até 60 caracteres. Aparece no checkout e no recibo." })}${field("Categoria", sel("wz-cat", ["Finanças e negócios", "Tecnologia e programação", "Marketing digital", "Educação e concursos", "Saúde e bem-estar", "Agricultura"], { s: "lg" }), { id: "wz-cat" })}</div>
    ${field("Descrição", area("wz-desc", { rows: 4, value: "12 planilhas prontas para controlar receitas, despesas, stock e fluxo de caixa de pequenos negócios. Em meticais, com IVA a 16% já configurado." }), { id: "wz-desc" })}
    <div class="ad-dropwrap"><span class="ad-label">Imagem de capa</span><label class="ad-dropzone">${tile("image", "primary", "md")}<span class="ad-dropzone-label">Arraste a imagem ou clique para escolher</span><span class="ad-dropzone-hint">PNG ou JPG, 1200 × 630 px, até 2 MB</span><input type="file" accept="image/*" data-act="toast" data-arg="Capa carregada"></label></div>`;
  if (s === 2) body = `<div class="g2">${field("Preço", inp("wz-price", { value: w.price || "990", suffix: "MT", s: "lg", attrs: 'inputmode="decimal"' }), { id: "wz-price", req: 1, help: `Recebe ${mt(990 - feeOf(990))} por venda depois da taxa.` })}${field("Tipo de cobrança", sel("wz-rec", [["unico", "Pagamento único"], ["mensal", "Mensal"], ["anual", "Anual"]], { s: "lg", value: w.recurring }), { id: "wz-rec" })}</div>
    <div class="stack-xs"><span class="ad-label">Garantia</span><div class="ad-tabs ad-tabs-segmented" style="align-self:flex-start">${["7", "15", "30"].map((d) => `<button class="ad-tab ${w.guarantee === d ? "is-active" : ""}" data-act="wzG" data-arg="${d}">${d} dias</button>`).join("")}</div><span class="ad-helper">Dentro deste prazo o comprador pede o reembolso sem justificação.</span></div>
    <div class="g2">${field("Preço em dólares (opcional)", inp("wz-usd", { ph: "15,00", suffix: "USD", s: "lg" }), { id: "wz-usd", help: "Para compradores com cartão internacional." })}${field("Limite de vendas", inp("wz-lim", { ph: "Sem limite", s: "lg" }), { id: "wz-lim" })}</div>`;
  if (s === 3) body = `<div class="choice-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${[["membros", "Área de membros VendAqui", "O comprador entra com o email da compra", "cap"], ["ficheiro", "Ficheiro para descarregar", "Enviamos o link por email e SMS", "download"], ["externo", "Link externo", "Grupo de WhatsApp, Telegram, Zoom", "ext"]].map(([k, t, d, i]) => `<button class="choice ${w.delivery === k ? "on" : ""}" data-act="wzD" data-arg="${k}">${ic(i, 20)}<b>${t}</b><small>${d}</small></button>`).join("")}</div>
    ${w.delivery === "ficheiro" ? `<label class="ad-dropzone">${tile("upload", "primary", "md")}<span class="ad-dropzone-label">Carregar ficheiros do produto</span><span class="ad-dropzone-hint">Até 500 MB por ficheiro</span><input type="file" multiple></label><ul class="ad-filelist"><li>${ic("file", 16)}<span class="ad-filelist-name">fluxo-de-caixa-2026.xlsx</span><span class="ad-filelist-size">184 KB</span></li><li>${ic("file", 16)}<span class="ad-filelist-name">controlo-de-stock.xlsx</span><span class="ad-filelist-size">212 KB</span></li></ul>` : w.delivery === "externo" ? field("Link de acesso", inp("wz-link", { icon: "link", ph: "https://chat.whatsapp.com/…" }), { id: "wz-link", help: "Só é mostrado depois do pagamento aprovado." }) : alertBox("Depois de publicar, adicione módulos e aulas em Área de membros", "Pode libertar aulas por datas (conteúdo gotejado) e emitir certificado no fim.", "info", "cap")}
    ${field("Mensagem de boas-vindas (email e SMS)", area("wz-msg", { value: "Olá {nome}! Obrigada pela compra. O seu acesso já está disponível: {link}" }), { id: "wz-msg" })}`;
  if (s === 4) body = `<div class="offer-row"><span class="cover lg cv-red">${ic("file", 26)}</span><div class="grow"><b style="font-size:16px">${esc(w.name || "Templates de Gestão Financeira")}</b><span class="faint" style="font-size:13px">${TYPES.find((t) => t[0] === w.type)[1]} · ${w.recurring === "unico" ? "pagamento único" : w.recurring} · garantia ${w.guarantee} dias</span></div><b style="font-size:20px">${mt(+w.price || 990)}</b></div>
    <dl class="dl"><dt>Recebe por venda</dt><dd>${mt((+w.price || 990) - feeOf(+w.price || 990))}</dd><dt>Entrega</dt><dd>${{ membros: "Área de membros", ficheiro: "Ficheiro para descarregar", externo: "Link externo" }[w.delivery]}</dd><dt>Métodos aceites</dt><dd>Apple Pay, Google Pay, M-Pesa, e-Mola, Cartão</dd><dt>Link do checkout</dt><dd class="mono">pay.vendaqui.co.mz/templates-financas</dd></dl>
    ${alertBox("A equipa revê o produto antes de ficar visível", "Normalmente em menos de 2 horas. Recebe um email quando for aprovado. Promessas de ganhos garantidos não são aceites.", "warning", "info")}`;
  return `${pagehead("Novo produto", `Passo ${s + 1} de 5 · ${WSTEPS[s]}`, btn("Cancelar", { v: "ghost", go: "produtos" }))}
  <div class="stepper" style="max-width:640px">${WSTEPS.map((_, i) => `<i class="${i <= s ? "on" : ""}"></i>`).join("")}</div>
  ${card(["Que tipo de produto vai vender?", "Detalhes do produto", "Preço e garantia", "Como o cliente recebe o produto?", "Rever e enviar para análise"][s], `<div class="stack-sm" style="gap:18px">${body}</div>`, { foot: `<div class="row-between">${s > 0 ? btn("Voltar", { act: "wzStep", arg: s - 1, i: "arrowl" }) : "<span></span>"}${s < 4 ? btn("Continuar", { v: "primary", act: "wzStep", arg: s + 1, ir: "arrow" }) : btn("Enviar para análise", { v: "primary", i: "send", act: "wzDone" })}</div>` })}`;
}, "Novo produto");
ACT.wzStep = (el) => { const n = $("#wz-name"), p = $("#wz-price"); if (n) S.wizard.name = n.value; if (p) S.wizard.price = p.value.replace(",", "."); S.wizard.step = +el.dataset.arg; render(); };
ACT.wzType = (el) => { S.wizard.type = el.dataset.arg; render(); };
ACT.wzG = (el) => { S.wizard.guarantee = el.dataset.arg; render(); };
ACT.wzD = (el) => { S.wizard.delivery = el.dataset.arg; render(); };
ACT.wzDone = () => { PRODUCTS[5].status = "Em análise"; S.wizard.step = 0; go("produtos"); toast("Produto enviado para análise", "Recebe um email quando for aprovado."); };

/* página do produto */
route("produto", "seller", () => {
  const p = prodById(S.prodId), t = S.prodTab;
  const link = `pay.vendaqui.co.mz/${p.slug}`;
  let body = "";
  if (t === "geral") body = `<div class="g4">${kpi("Receita", mt(p.rev, 0), { icon: "wallet" })}${kpi("Vendas", int(p.sales), { icon: "receipt", tone: "success" })}${kpi("Conversão", p.conv ? pct(p.conv) : "—", { icon: "target", tone: "info" })}${kpi(p.recurring ? "Assinantes" : "Alunos", int(p.students), { icon: "users", tone: "purple" })}</div>
    <div class="g-main">${card("Informação", `<div class="stack-sm" style="gap:16px">${field("Nome", inp("pd-name", { value: p.name }), { id: "pd-name" })}${field("Descrição", area("pd-desc", { rows: 4, value: "Do primeiro clique à tabela dinâmica: 20 aulas práticas com ficheiros de exercício reais, certificado no fim e suporte da Ana na comunidade." }), { id: "pd-desc" })}<div class="g2">${field("Preço", inp("pd-price", { value: num(p.price), suffix: "MT" }), { id: "pd-price" })}${field("Garantia", sel("pd-g", ["7 dias", "15 dias", "30 dias"]), { id: "pd-g" })}</div>${field("Página de vendas", inp("pd-sales", { icon: "globe", value: "https://excelcomaana.co.mz/curso" }), { id: "pd-sales", help: "Para onde envia o tráfego. O botão de compra aponta para o checkout." })}</div>`, { foot: `<div class="pl-row-end row" style="justify-content:flex-end">${btn("Guardar alterações", { v: "primary", act: "toast", arg: "Alterações guardadas" })}</div>` })}
    ${card("Links de venda", `<div class="stack-sm"><div class="linkbox"><span>${link}</span>${btn("Copiar", { s: "sm", i: "copy", act: "copy", arg: "https://" + link })}</div><div class="row" style="gap:8px">${btn("Abrir checkout", { s: "sm", i: "ext", go: "checkout" })}${btn("QR code", { s: "sm", i: "grid", act: "toast", arg: "QR code descarregado" })}</div><hr class="hr"><dl class="dl"><dt>Estado</dt><dd>${st(p.status)}</dd><dt>Tipo</dt><dd>${p.type}</dd><dt>Criado</dt><dd>12 mar 2025</dd><dt>ID</dt><dd class="mono">${p.id.toUpperCase()}-8F21</dd></dl></div>`, { icon: "link" })}</div>`;
  if (t === "ofertas") body = card("Ofertas", `<p class="muted">Cada oferta tem o seu preço e o seu link. Use-as para campanhas, combos ou preços de lançamento.</p>${[["Principal", p.price, "", 1, 964], ["Black Friday · 40%", Math.round(p.price * 0.6), "bf26", 0, 0], ["Combo Excel + Power BI", p.price + 2990, "combo", 1, 141], ["Turma fechada empresas (10 acessos)", p.price * 7, "empresas", 1, 12]].map(([n, v, s, on, sold]) => `<div class="offer-row"><div class="grow" style="min-width:180px"><b>${n}</b><span class="faint" style="font-size:13px">${mt(v)} · ${sold} vendas</span></div><div class="linkbox"><span>${link}${s ? "/" + s : ""}</span>${ibtn("copy", "Copiar link", { s: "sm", act: "copy", arg: "https://" + link + (s ? "/" + s : "") })}</div>${sw(!!on, "toggle", "", "Ativar oferta")}</div>`).join("")}`, { icon: "tag", aside: btn("Nova oferta", { s: "sm", v: "primary", i: "plus", act: "toast", arg: "Oferta criada" }) });
  if (t === "checkout") body = checkoutEditor();
  if (t === "upsell") body = `<div class="g2">${card("Order bump", `<p class="muted">Um produto extra que o comprador adiciona com um visto, antes de pagar.</p><div class="bump-demo">${ic("gift", 18)}<span><b>Ebook “100 Fórmulas de Excel”</b> por 190 MT (de 450 MT)</span></div><dl class="dl"><dt>Aceitação</dt><dd>28,4%</dd><dt>Receita extra (30 dias)</dt><dd>${mt(41420)}</dd></dl>`, { icon: "gift", aside: sw(S.co.bump, "bumpToggle", "", "Ativar order bump") })}
    ${card("Upsell depois da compra", `<p class="muted">Aparece na página de obrigado. O cliente aceita com 1 clique e recebe novo pedido de confirmação no telemóvel.</p><div class="offer-row"><span class="cover cv-blue">${ic("cap", 18)}</span><div class="grow"><b>Power BI com 40% de desconto</b><span class="faint" style="font-size:13px">${mt(2390)} · aceitação 11,2%</span></div></div>${field("Se recusar, mostrar", sel("ups-down", ["Downsell: Ebook Power BI por 490 MT", "Nada"]), { id: "ups-down" })}`, { icon: "trendup", aside: sw(true, "toggle", "", "Ativar upsell") })}</div>`;
  if (t === "afiliacao") body = card("Programa de afiliados deste produto", `<div class="setting"><div><b>Aceitar afiliados</b><small>O produto aparece no mercado de afiliação</small></div>${sw(true, "toggle")}</div><div class="setting"><div><b>Aprovação automática</b><small>Sem aprovação, analisa cada pedido manualmente</small></div>${sw(false, "toggle")}</div>
    <div class="range" style="padding:12px 0"><div class="range-top"><label class="ad-label" for="aff-c">Comissão do afiliado</label><b id="aff-c-v">40%</b></div><input type="range" id="aff-c" min="5" max="80" value="40"><span class="ad-helper" id="aff-c-h">Afiliado recebe ${mt(p.price * 0.4)} por venda; fica com ${mt(p.price * 0.6 - feeOf(p.price))}.</span></div>
    <div class="g2">${field("Duração do cookie", sel("aff-ck", ["30 dias", "60 dias", "90 dias", "Vitalício"], { value: "60 dias" }), { id: "aff-ck" })}${field("Atribuição", sel("aff-at", ["Último clique", "Primeiro clique"]), { id: "aff-at" })}</div>
    ${field("Materiais para afiliados", inp("aff-mat", { icon: "link", value: "https://drive.google.com/excelcomaana-afiliados" }), { id: "aff-mat" })}`, { icon: "share", foot: `<div class="row" style="justify-content:flex-end">${btn("Guardar", { v: "primary", act: "toast", arg: "Programa de afiliados atualizado" })}</div>` });
  return `<button class="ad-btn ad-btn-ghost ad-btn-sm" data-go="produtos" style="align-self:flex-start;margin-bottom:-12px">${ic("arrowl", 16)}<span>Produtos</span></button>
  <div class="row-between"><div class="prod-head"><span class="cover lg cv-${p.cv}">${ic(p.icon, 26)}</span><div class="stack-xs"><h1>${p.name}</h1><div class="row" style="gap:8px">${st(p.status)}<span class="faint" style="font-size:13px">${p.type} · ${mt(p.price)}</span></div></div></div><div class="row" style="gap:8px">${btn("Ver checkout", { i: "eye", go: "checkout" })}${btn("Copiar link", { v: "primary", i: "copy", act: "copy", arg: "https://" + link })}</div></div>
  ${tabs([["geral", "Visão geral"], ["ofertas", "Ofertas", 4], ["checkout", "Checkout"], ["upsell", "Order bump e upsell"], ["afiliacao", "Afiliação"]], t, "prodTab")}
  ${body}`;
}, "Produto");
ACT.prodTab = (el) => { S.prodTab = el.dataset.arg; render(); };
ACT.bumpToggle = (el) => { S.co.bump = !S.co.bump; store.set("co", S.co); el.setAttribute("aria-checked", S.co.bump); };

function checkoutEditor() {
  const co = S.co;
  const set = (k, label, sub) => `<div class="setting"><div><b>${label}</b><small>${sub}</small></div>${sw(!!co[k], "coSet", k, label)}</div>`;
  return `<div class="g-main-r">
  <div class="stack-sm" style="gap:16px">
    ${card("Aparência", `<div class="stack-xs"><span class="ad-label">Cor principal</span><div class="swatches">${["orange", "blue", "green", "purple", "red", "ink"].map((c) => `<button class="swatch sw-${c} ${co.acc === c ? "on" : ""}" data-act="coAcc" data-arg="${c}" aria-label="Cor ${c}"></button>`).join("")}</div></div>${field("Texto do botão", inp("co-cta", { value: co.cta }), { id: "co-cta" })}`, { icon: "image" })}
    ${card("Elementos de conversão", `${set("timer", "Cronómetro de oferta", `Contagem de ${co.mins} minutos no topo`)}${set("bump", "Order bump", "Ebook 100 Fórmulas por 190 MT")}${set("testi", "Testemunho", "Mostra uma avaliação de aluno")}${set("nuit", "Pedir NUIT", "Para compradores que precisam de fatura")}`, { icon: "zap" })}
    ${card("Métodos de pagamento", Object.entries(METHODS).map(([k, m]) => `<div class="setting"><div><b>${pm(k)}</b><small>${m.fee}</small></div>${sw(!!co.methods[k], "coM", k, m.l)}</div>`).join(""), { icon: "wallet" })}
  </div>
  <div class="stack-sm" style="gap:12px"><div class="row-between"><span class="section-title">Pré-visualização</span><div class="ad-tabs ad-tabs-segmented">${[["0", "Computador", "monitor"], ["1", "Telemóvel", "phone"]].map(([k, l, i]) => `<button class="ad-tab ${+S.mobileView === +k ? "is-active" : ""}" data-act="coView" data-arg="${k}">${ic(i, 15)}${l}</button>`).join("")}</div></div>
    <div class="preview-frame ${S.mobileView ? "is-mobile" : ""}" id="co-preview">${checkoutMarkup(true)}</div>
    <div class="row" style="justify-content:flex-end;gap:8px">${btn("Abrir checkout real", { i: "ext", go: "checkout" })}${btn("Publicar alterações", { v: "primary", act: "toast", arg: "Checkout publicado" })}</div></div>
  </div>`;
}
const coSave = () => { store.set("co", S.co); const pv = $("#co-preview"); if (pv) pv.innerHTML = checkoutMarkup(true); };
ACT.coSet = (el) => { const k = el.dataset.arg; S.co[k] = !S.co[k]; el.setAttribute("aria-checked", S.co[k]); coSave(); };
ACT.coM = (el) => { const k = el.dataset.arg; const on = !S.co.methods[k]; if (!on && Object.values(S.co.methods).filter(Boolean).length === 1) return toast("Mantenha pelo menos um método ativo", "", "warning", "alert"); S.co.methods[k] = on; el.setAttribute("aria-checked", on); coSave(); };
ACT.coAcc = (el) => { S.co.acc = el.dataset.arg; $$(".swatch").forEach((s) => s.classList.toggle("on", s === el)); coSave(); };
ACT.coView = (el) => { S.mobileView = el.dataset.arg === "1"; render(); };

/* vendas */
route("vendas", "seller", () => {
  const f = S.salesFilter;
  const rows = SALES.filter((s) => (!f.s || s.s === f.s) && (!f.m || s.m === f.m) && (!f.p || s.p.id === f.p) && (!f.q || (s.name + s.id + s.email).toLowerCase().includes(f.q.toLowerCase())));
  const cnt = (x) => SALES.filter((s) => s.s === x).length;
  const approved = SALES.filter((s) => s.s === "Aprovada");
  return `${pagehead("Vendas", "Todas as transações dos seus produtos.", `${btn("Exportar CSV", { i: "download", act: "toast", arg: "Exportação enviada para ana@excelcomaana.co.mz" })}`)}
  <div class="g4">${kpi("Aprovadas", int(cnt("Aprovada")), { icon: "checkc", tone: "success", hint: mt(approved.reduce((a, s) => a + s.val, 0)) })}${kpi("Pendentes", int(cnt("Pendente")), { icon: "clock", tone: "warning", hint: "A aguardar o PIN do cliente" })}${kpi("Recusadas e expiradas", int(cnt("Recusada") + cnt("Expirada")), { icon: "xc", tone: "danger", hint: "Recupere em Recuperação de vendas" })}${kpi("Reembolsadas", int(cnt("Reembolsada")), { icon: "refund", tone: "neutral", hint: "Taxa de reembolso 0,9%" })}</div>
  <div class="ad-filterbar"><div class="ad-input ad-input-md ad-search"><span class="ad-input-icon">${ic("search", 16)}</span><input id="sf-q" placeholder="Nome, email ou nº da venda" value="${esc(f.q)}"></div>
    ${sel("sf-s", [["", "Todos os estados"], "Aprovada", "Pendente", "Recusada", "Reembolsada", "Expirada"], { value: f.s })}
    ${sel("sf-m", [["", "Todos os métodos"], ...Object.entries(METHODS).map(([k, m]) => [k, m.l])], { value: f.m })}
    ${sel("sf-p", [["", "Todos os produtos"], ...PRODUCTS.slice(0, 5).map((p) => [p.id, p.name])], { value: f.p })}
    <span class="ad-filterbar-count">${rows.length} vendas</span></div>
  ${card("", rows.length ? salesTable(rows.slice(0, 12), false, rows.length) : empty("search", "Nenhuma venda encontrada", "Experimente limpar os filtros ou procurar por outro nome.", btn("Limpar filtros", { act: "clearSales" })), { flush: true })}`;
}, "Vendas");
ACT.clearSales = () => { S.salesFilter = { q: "", s: "", m: "", p: "" }; render(); };

/* assinaturas */
route("assinaturas", "seller", () => {
  seed = 77;
  const subs = NAMES.slice(0, 10).map((n, i) => ({ n, m: pick(["emola", "emola", "card", "applepay"]), since: ["mar", "abr", "mai", "jun", "jul", "ago", "set"][i % 7], next: `${10 + i} nov`, s: i === 3 ? "Em atraso" : i === 7 ? "Cancelada" : "Ativa", ltv: 790 * (2 + (i % 7)) }));
  return `${pagehead("Assinaturas", "Clube Excel Pro · cobrança mensal de 790 MT.", btn("Configurar cobrança", { i: "sliders", act: "toast", arg: "Definições de cobrança abertas" }))}
  <div class="g4">${kpi("Receita recorrente mensal", mt(251220, 0), { icon: "repeat", tone: "purple", delta: 6.3 })}${kpi("Assinantes ativos", "318", { icon: "users", tone: "success", hint: "+24 este mês" })}${kpi("Cancelamentos", pct(4.2), { icon: "trenddown", tone: "danger", hint: "13 nos últimos 30 dias" })}${kpi("Renovações por confirmar", "12", { icon: "clock", tone: "warning", hint: "Lembrete enviado por SMS" })}</div>
  ${alertBox("Como funciona a renovação por carteira móvel", "No dia da renovação o assinante recebe o pedido de confirmação no telemóvel. Se não confirmar, tentamos de novo em 1, 3 e 5 dias e enviamos um link por SMS. O acesso fica suspenso ao 7.º dia.", "info", "info")}
  ${card("", table([{ l: "Assinante", f: (r) => cellUser(r.n, emailOf(r.n)) }, { l: "Método", f: (r) => pm(r.m) }, { l: "Desde", f: (r) => r.since + " 2026" }, { l: "Próxima cobrança", f: (r) => (r.s === "Cancelada" ? "—" : r.next) }, { l: "Total pago", num: 1, f: (r) => mt(r.ltv, 0) }, { l: "Estado", f: (r) => st(r.s) }], subs, { pager: 318 }), { flush: true })}`;
}, "Assinaturas");

/* clientes */
route("clientes", "seller", () => {
  seed = 99;
  const cl = NAMES.slice(0, 12).map((n, i) => ({ n, city: pick(CITIES), buys: 1 + Math.floor(rnd() * 4), spent: Math.round(450 + rnd() * 9000), last: dt(SALES[i * 3].t, false) }));
  return `${pagehead("Clientes", "Quem comprou os seus produtos.", `${btn("Exportar", { i: "download", act: "toast", arg: "Lista de clientes exportada" })}`)}
  <div class="g4">${kpi("Clientes", "3 641", { icon: "users" })}${kpi("Compraram mais de uma vez", pct(23.5), { icon: "repeat", tone: "success" })}${kpi("Valor médio por cliente", mt(3104, 0), { icon: "wallet", tone: "info" })}${kpi("Cidade com mais compras", "Maputo", { icon: "globe", tone: "purple", hint: "41% dos clientes" })}</div>
  <div class="ad-filterbar"><div class="ad-input ad-input-md ad-search"><span class="ad-input-icon">${ic("search", 16)}</span><input id="cl-q" placeholder="Procurar cliente"></div>${sel("cl-p", ["Todos os produtos", ...PRODUCTS.slice(0, 5).map((p) => p.name)])}</div>
  ${card("", table([{ l: "Cliente", f: (r) => cellUser(r.n, emailOf(r.n)) }, { l: "Cidade", f: (r) => r.city }, { l: "Compras", num: 1, f: (r) => r.buys }, { l: "Total gasto", num: 1, f: (r) => mt(r.spent, 0) }, { l: "Última compra", f: (r) => r.last }, { l: "", num: 1, f: () => ibtn("msg", "Enviar mensagem", { s: "sm", act: "toast", arg: "Mensagem enviada por SMS" }) }], cl, { pager: 3641 }), { flush: true })}`;
}, "Clientes");

/* afiliados */
route("afiliados", "seller", () => {
  const t = S.affTab;
  const affs = [["Kelvin Duarte", 184, 128400, 6.1, "Ativo"], ["Sónia Matavele", 97, 71910, 4.8, "Ativo"], ["Pedro Uamusse", 61, 42670, 3.9, "Ativo"], ["Inês Cuamba", 33, 20120, 2.7, "Ativo"], ["Wilson Mondego", 8, 4980, 1.1, "Suspenso"]];
  let body;
  if (t === "lista") body = card("", table([{ l: "Afiliado", f: (r) => cellUser(r[0], emailOf(r[0])) }, { l: "Vendas", num: 1, f: (r) => r[1] }, { l: "Comissões", num: 1, f: (r) => mt(r[2], 0) }, { l: "Conversão", num: 1, f: (r) => pct(r[3]) }, { l: "Estado", f: (r) => st(r[4]) }, { l: "", num: 1, f: () => ibtn("more", "Mais ações", { s: "sm", act: "toast", arg: "Ações do afiliado" }) }], affs), { flush: true });
  if (t === "pedidos") body = `<div class="stack-sm">${[["Arsénio Bila", "Instagram · 12 mil seguidores", "Excel do Zero ao Avançado"], ["Elsa Nhamuave", "Grupo de WhatsApp de contabilistas", "Ebook: 100 Fórmulas de Excel"], ["Francisco Tamele", "Canal de YouTube · 4 mil subscritores", "Excel do Zero ao Avançado"], ["Lina Macuácua", "TikTok · 31 mil seguidores", "Clube Excel Pro"]].map(([n, o, p]) => `<div class="offer-row">${avatar(n, "md")}<div class="grow"><b>${n}</b><span class="faint" style="font-size:13px">${o} · quer promover ${p}</span></div><div class="row" style="gap:8px">${btn("Recusar", { s: "sm", v: "ghost", act: "affDecide", arg: "0" })}${btn("Aprovar", { s: "sm", v: "primary", i: "check", act: "affDecide", arg: "1" })}</div></div>`).join("")}</div>`;
  if (t === "mercado") body = `<p class="muted">Promova produtos de outros produtores e ganhe comissão em cada venda.</p><div class="pgrid">${[["Finanças para Jovens", "Nélio Cumbe", "Curso online", 1890, 50, "green", "cap", 4.8], ["Inglês para Entrevistas", "Talk Moz", "Curso online", 2900, 45, "blue", "cap", 4.9], ["Guia do Agronegócio", "Campo Vivo", "Ebook", 650, 60, "teal", "book", 4.6], ["Fotografia com Telemóvel", "Lente Moz", "Curso online", 1500, 40, "purple", "cap", 4.7]].map(([n, by, ty, pr, c, cv, i, r]) => `<div class="pcard" style="cursor:default"><div class="pcard-head cv-${cv}"><span class="pcard-type">${ic(i, 14)}${ty}</span><h4>${n}</h4></div><div class="pcard-body"><span class="faint" style="font-size:13px">por ${by} · ${ic("star", 12)} ${num(r, 1)}</span><div class="pcard-stats"><div><small>Preço</small><b>${mt(pr, 0)}</b></div><div><small>Comissão</small><b>${c}%</b></div><div><small>Ganha</small><b>${mt(pr * c / 100, 0)}</b></div></div>${btn("Pedir afiliação", { s: "sm", v: "soft", act: "toast", arg: "Pedido enviado a " + by, cls: "ad-btn-block" })}</div></div>`).join("")}</div>`;
  return `${pagehead("Afiliados", "Quem vende os seus produtos e quanto ganha.", btn("Convidar afiliado", { v: "primary", i: "plus", act: "toast", arg: "Link de convite copiado" }))}
  <div class="g4">${kpi("Vendas por afiliados", "383", { icon: "share", hint: "11% do total" })}${kpi("Comissões pagas", mt(268080, 0), { icon: "cash", tone: "success" })}${kpi("Afiliados ativos", "42", { icon: "users", tone: "info" })}${kpi("Comissão padrão", "40%", { icon: "percent", tone: "purple", hint: "Cookie de 60 dias" })}</div>
  ${tabs([["lista", "Os meus afiliados", 42], ["pedidos", "Pedidos", 4], ["mercado", "Mercado de afiliação"]], t, "affTab")}${body}`;
}, "Afiliados");
ACT.affTab = (el) => { S.affTab = el.dataset.arg; render(); };
ACT.affDecide = (el) => { const row = el.closest(".offer-row"); row.remove(); toast(el.dataset.arg === "1" ? "Afiliado aprovado" : "Pedido recusado", el.dataset.arg === "1" ? "Enviámos o link de afiliado por email" : "", el.dataset.arg === "1" ? "success" : "neutral", el.dataset.arg === "1" ? "checkc" : "x"); };

/* cupões */
const COUPONS = [["ANA10", "10%", 214, 500, "31 dez 2026", "Todos", "Ativo"], ["BEMVINDO", "150 MT", 88, null, "Sem fim", "Excel do Zero", "Ativo"], ["BLACK40", "40%", 0, 300, "27 nov 2026", "Todos", "Rascunho"], ["SETEMBRO", "20%", 120, 120, "30 set 2026", "Power BI", "Expirada"]];
route("cupoes", "seller", () => `${pagehead("Cupões", "Descontos que os clientes escrevem no checkout.", btn("Criar cupão", { v: "primary", i: "plus", act: "newCoupon" }))}
  ${card("", table([{ l: "Código", f: (r) => `<span class="kbd-chip">${r[0]}</span>` }, { l: "Desconto", f: (r) => `<b style="font-weight:600">${r[1]}</b>` }, { l: "Utilizações", f: (r) => `<div class="stack-xs" style="min-width:110px"><span>${r[2]}${r[3] ? " de " + r[3] : ""}</span>${r[3] ? meter((r[2] / r[3]) * 100) : ""}</div>` }, { l: "Validade", f: (r) => r[4] }, { l: "Produtos", f: (r) => r[5] }, { l: "Estado", f: (r) => st(r[6]) }, { l: "", num: 1, f: (r) => ibtn("copy", "Copiar código", { s: "sm", act: "copy", arg: r[0] }) }], COUPONS), { flush: true })}`, "Cupões");
ACT.newCoupon = () => openModal("coupon");
MODALS.coupon = () => ({ title: "Criar cupão", body: `${field("Código", inp("cp-code", { value: "NATAL25", attrs: 'style="text-transform:uppercase"' }), { id: "cp-code", help: "Letras e números, sem espaços." })}<div class="g2">${field("Tipo", sel("cp-type", ["Percentagem", "Valor fixo"]), { id: "cp-type" })}${field("Desconto", inp("cp-val", { value: "25", suffix: "%" }), { id: "cp-val" })}</div><div class="g2">${field("Limite de utilizações", inp("cp-lim", { ph: "Sem limite" }), { id: "cp-lim" })}${field("Válido até", inp("cp-end", { type: "date", value: "2026-12-26" }), { id: "cp-end" })}</div>${field("Produtos", sel("cp-p", ["Todos os produtos", ...PRODUCTS.slice(0, 5).map((p) => p.name)]), { id: "cp-p" })}`, foot: `${btn("Cancelar", { act: "closeModal" })}${btn("Criar cupão", { v: "primary", act: "couponSave" })}` });
ACT.couponSave = () => { const c = ($("#cp-code").value || "NOVO").toUpperCase(); COUPONS.unshift([c, $("#cp-val").value + "%", 0, +$("#cp-lim").value || null, "26 dez 2026", "Todos", "Ativo"]); S.modal = null; render(); toast("Cupão criado", c + " já funciona no checkout"); };

/* recuperação */
route("recuperacao", "seller", () => {
  const carts = SALES.filter((s) => s.s !== "Aprovada" && s.s !== "Reembolsada").slice(0, 7);
  const auto = [["SMS", "15 minutos depois", "Olá {nome}, o seu pagamento de {produto} não foi concluído. Termine aqui: {link}", true, "phone"], ["WhatsApp", "1 hora depois", "Mensagem com o link e uma pergunta: precisa de ajuda com o pagamento?", true, "msg"], ["Email com cupão", "24 horas depois", "Oferece 10% de desconto válido por 48 horas.", false, "mail"]];
  return `${pagehead("Recuperação de vendas", "Mensagens automáticas para quem começou a comprar e não terminou.")}
  <div class="g4">${kpi("Carrinhos abandonados", "214", { icon: "cart", tone: "warning", hint: "Últimos 30 dias" })}${kpi("Recuperados", "61", { icon: "checkc", tone: "success" })}${kpi("Valor recuperado", mt(98400, 0), { icon: "wallet" })}${kpi("Taxa de recuperação", pct(28.5), { icon: "target", tone: "info", delta: 4.1 })}</div>
  <div class="g-main-r">${card("Automações", auto.map(([t, w, d, on, i]) => `<div class="setting"><div style="flex-direction:row;gap:12px;align-items:flex-start">${tile(i, on ? "primary" : "neutral", "sm")}<div class="stack-xs"><b>${t} · ${w}</b><small>${d}</small></div></div>${sw(on, "toggle", "", t)}</div>`).join(""), { icon: "zap" })}
  ${card("Por recuperar", table([{ l: "Cliente", f: (s) => cellUser(s.name, mask(s.phone)) }, { l: "Produto", f: (s) => s.p.name }, { l: "Valor", num: 1, f: (s) => mt(s.val) }, { l: "Motivo", f: (s) => (s.s === "Pendente" ? "PIN não introduzido" : s.s === "Recusada" ? "Saldo insuficiente" : "Pedido expirou") }, { l: "", num: 1, f: (s) => btn("Contactar", { s: "sm", i: "send", act: "toast", arg: "Link de pagamento enviado para " + mask(s.phone) }) }], carts, { dense: 1 }), { icon: "cart", flush: true })}</div>`;
}, "Recuperação de vendas");

/* área de membros */
route("membros", "seller", () => {
  const ls = lessonList(), cur = ls.find((l) => l.id === S.lesson) || ls[0];
  return `${pagehead("Área de membros", "Excel do Zero ao Avançado · 5 módulos, 20 aulas.", `${btn("Ver como aluno", { i: "eye", go: "aula" })}${btn("Nova aula", { v: "primary", i: "plus", act: "toast", arg: "Aula criada no módulo " + (cur.mi + 1) })}`)}
  <div class="g4">${kpi("Alunos ativos", "1 290", { icon: "users" })}${kpi("Conclusão média", pct(46), { icon: "checkc", tone: "success" })}${kpi("Certificados emitidos", "412", { icon: "award", tone: "purple" })}${kpi("Perguntas por responder", "9", { icon: "msg", tone: "warning" })}</div>
  <div class="g-main-r">
    <div class="stack-sm">${COURSE.map((m, mi) => `<div class="module"><div class="module-head">${ic("grip", 16, "faint")}${mi + 1}. ${m.t}<small>${m.l.length} aulas</small></div>${m.l.map((t, li) => { const id = `${m.id}l${li + 1}`; return `<button class="lesson ${id === cur.id ? "on" : ""}" data-act="editLesson" data-arg="${id}">${ic("grip", 14, "grip")}${ic("video", 16)}<span>${t}</span><small>${DUR[(mi * 5 + li) % DUR.length]}</small></button>`; }).join("")}</div>`).join("")}${btn("Adicionar módulo", { i: "plus", act: "toast", arg: "Módulo 6 criado" })}</div>
    ${card("Editar aula", `<div class="stack-sm" style="gap:16px">${field("Título", inp("ls-t", { value: cur.t }), { id: "ls-t" })}
      <div class="video" style="aspect-ratio:16/7"><div class="video-slide"><small>Módulo ${cur.mi + 1}</small><b>${cur.t}</b></div><div class="video-bar">${ic("video", 14)}<span>aula-${cur.mi + 1}-${cur.li + 1}.mp4 · 1080p · ${cur.dur}</span></div></div>
      <div class="row" style="gap:8px">${btn("Substituir vídeo", { s: "sm", i: "upload", act: "toast", arg: "Carregamento iniciado" })}${btn("Legendas", { s: "sm", i: "file", act: "toast", arg: "Legendas geradas automaticamente" })}</div>
      ${field("Descrição", area("ls-d", { value: `Nesta aula vemos ${cur.t.toLowerCase()} com uma folha de vendas real.` }), { id: "ls-d" })}
      <div class="g2">${field("Disponível", sel("ls-drip", ["Logo após a compra", "7 dias após a compra", "14 dias após a compra", "Numa data fixa"]), { id: "ls-drip" })}${field("Materiais", `<ul class="ad-filelist"><li>${ic("file", 16)}<span class="ad-filelist-name">exercicios.xlsx</span><span class="ad-filelist-size">96 KB</span></li></ul>`)}</div>
      <div class="setting"><div><b>Aula de amostra grátis</b><small>Visível na página de vendas sem comprar</small></div>${sw(cur.id === "m1l1", "toggle")}</div></div>`, { icon: "edit", foot: `<div class="row" style="justify-content:flex-end;gap:8px">${btn("Eliminar", { v: "ghost", i: "trash", act: "toast", arg: "Aula movida para o lixo" })}${btn("Guardar aula", { v: "primary", act: "toast", arg: "Aula guardada" })}</div>` })}
  </div>`;
}, "Área de membros");
ACT.editLesson = (el) => { S.lesson = el.dataset.arg; render(); };

/* financeiro */
route("financeiro", "seller", () => {
  const ext = SALES.filter((s) => s.s === "Aprovada").slice(0, 7).map((s) => [dt(s.t), `Venda ${s.id} · ${s.p.name}`, s.net, "credit"]);
  ext.splice(2, 0, [dt(new Date(2026, 9, 21, 18, 2)), "Saque para e-Mola 86 ••• •471", -35000, "debit"]);
  ext.splice(5, 0, [dt(new Date(2026, 9, 21, 9, 15)), "Reembolso VQ-48180", -2367.99, "debit"]);
  return `${pagehead("Financeiro", "Saldo, saques e extrato.", btn("Solicitar saque", { v: "primary", i: "cash", act: "withdraw" }))}
  <div class="g3">
    <section class="balance-card"><small>Disponível para saque</small><span class="big">${mt(48320)}</span><small>Saque para carteira móvel sem custo</small></section>
    ${kpi("A libertar", mt(126480), { icon: "clock", tone: "warning", hint: "Vendas dos últimos 2 dias (carteiras) e 14 dias (cartão)" })}
    ${kpi("Reserva de segurança", mt(18210), { icon: "shield", tone: "info", hint: "5% das vendas, libertado ao fim de 30 dias" })}
  </div>
  <div class="g-main">
    ${card("Extrato", table([{ l: "Data", f: (r) => `<span class="nowrap">${r[0]}</span>` }, { l: "Descrição", f: (r) => r[1] }, { l: "Valor", num: 1, f: (r) => `<b style="font-weight:600;color:${r[2] < 0 ? "var(--danger)" : "var(--success)"}">${r[2] < 0 ? "" : "+"}${mt(r[2])}</b>` }], ext, { dense: 1, pager: 1284 }), { icon: "receipt", flush: true, aside: btn("Exportar", { s: "sm", v: "ghost", i: "download", act: "toast", arg: "Extrato de outubro exportado" }) })}
    <div class="stack-sm" style="gap:16px">
      ${card("Contas de recebimento", `${[["emola", "e-Mola", "86 ••• •471", "Principal · grátis · ~40 s"], ["bank", "BCI", "NIB •••• 2281 5", "25 MT · 1 dia útil"]].map(([k, l, n, d]) => `<div class="offer-row"><span class="pm pm-${k}"><i></i>${l}</span><div class="grow"><b class="mono" style="font-size:13px">${n}</b><span class="faint" style="font-size:12px">${d}</span></div></div>`).join("")}${btn("Adicionar conta", { s: "sm", i: "plus", act: "toast", arg: "Nova conta adicionada para verificação" })}`, { icon: "bank" })}
      ${card("Prazos de libertação", `<dl class="dl"><dt>${pm("emola")}</dt><dd>D+2</dd><dt>${pm("mpesa")}</dt><dd>D+2</dd><dt>${pm("card")}</dt><dd>D+14</dd><dt>${pm("applepay")}</dt><dd>D+14</dd><dt>${pm("googlepay")}</dt><dd>D+14</dd><dt>Reserva</dt><dd>5% · 30 dias</dd></dl><p class="faint" style="font-size:12.5px">Taxa: ${num(FEE.pct, 1)}% + ${FEE.fixed} MT por venda aprovada. Antecipação disponível a partir de 500 mil MT/mês.</p>`, { icon: "calendar", tone: "info" })}
    </div>
  </div>
  ${card("Saques", table([{ l: "Pedido", f: (r) => `<span class="mono">${r[0]}</span>` }, { l: "Data", f: (r) => r[1] }, { l: "Destino", f: (r) => pm(r[2]) }, { l: "Valor", num: 1, f: (r) => mt(r[3]) }, { l: "Estado", f: (r) => st(r[4]) }], [["SQ-9921", "21 out · 18:02", "emola", 35000, "Pago"], ["SQ-9874", "17 out · 09:40", "emola", 61200, "Pago"], ["SQ-9810", "12 out · 15:12", "bank", 150000, "Pago"], ["SQ-9777", "08 out · 11:31", "emola", 22500, "Pago"]], { dense: 1 }), { icon: "cash", flush: true })}`;
}, "Financeiro");
ACT.withdraw = () => openModal("withdraw", { dest: "emola" });
MODALS.withdraw = ({ dest }) => ({ title: "Solicitar saque", desc: `Disponível: ${mt(48320)}`, body: `${field("Valor", inp("wd-v", { value: "48 320,00", suffix: "MT", s: "lg", attrs: 'inputmode="decimal"' }), { id: "wd-v", help: "Mínimo 100 MT." })}
  <div class="stack-xs"><span class="ad-label">Destino</span><div class="choice-grid">${[["emola", "e-Mola · 86 ••• •471", "Grátis · cerca de 40 segundos"], ["bank", "BCI · NIB •••• 2281 5", "25 MT · 1 dia útil"]].map(([k, l, d]) => `<button class="choice ${dest === k ? "on" : ""}" data-act="wdDest" data-arg="${k}"><span class="pm pm-${k}"><i></i>${l}</span><small>${d}</small></button>`).join("")}</div></div>
  <dl class="dl"><dt>Custo do saque</dt><dd>${dest === "bank" ? mt(25) : mt(0)}</dd><dt>Recebe</dt><dd><b>${mt(48320 - (dest === "bank" ? 25 : 0))}</b></dd></dl>`, foot: `${btn("Cancelar", { act: "closeModal" })}${btn("Confirmar saque", { v: "primary", act: "wdDo", arg: dest })}` });
ACT.wdDest = (el) => { S.modal.data.dest = el.dataset.arg; renderOverlays(); };
ACT.wdDo = (el) => { S.modal = null; renderOverlays(); toast("Saque a caminho", el.dataset.arg === "bank" ? "Chega à conta BCI no próximo dia útil." : "O e-Mola confirma por SMS em menos de 1 minuto.", "success", "cash"); };

/* integrações */
route("integracoes", "seller", () => {
  const list = [["Meta Pixel", "Envia Purchase, InitiateCheckout e AddPaymentInfo com API de conversões.", "#1d4ed8", "M", true], ["TikTok Pixel", "Eventos de compra para otimizar campanhas no TikTok Ads.", "#111722", "T", true], ["Google Ads", "Conversões de compra com valor em meticais.", "#12884c", "G", false], ["Google Analytics 4", "Funil do checkout e origem das vendas.", "#b86d04", "A", false], ["WhatsApp Business", "Mensagens de recuperação e de boas-vindas.", "#0b7a4c", "W", true], ["Email marketing", "Adiciona compradores a listas no Mailchimp ou Brevo.", "#7022b2", "@", false]];
  return `${pagehead("Integrações", "Pixels, mensagens e ligação ao seu sistema.")}
  <div class="pgrid">${list.map(([n, d, c, l, on]) => `<div class="intg"><div class="row-between"><span class="intg-logo" style="--il:${c}">${l}</span>${on ? badge("Ligado", "success", { dot: true }) : badge("Desligado", "neutral")}</div><b>${n}</b><p>${d}</p>${btn(on ? "Configurar" : "Ligar", { s: "sm", v: on ? "secondary" : "primary", act: "toast", arg: on ? n + " · definições abertas" : n + " ligado" })}</div>`).join("")}</div>
  <div class="g2">
    ${card("Chaves da API", `<p class="muted">Use para criar cobranças, consultar vendas e libertar acessos a partir do seu sistema.</p><div class="apikey"><code>vq_live_••••••••••••••••••••3f9a</code>${btn("Copiar", { s: "sm", i: "copy", act: "toast", arg: "Chave copiada. Guarde-a num local seguro." })}${btn("Gerar nova", { s: "sm", v: "ghost", act: "toast", arg: "Nova chave gerada. A anterior deixa de funcionar em 24 h." })}</div><div class="apikey"><code>vq_test_••••••••••••••••••••a71c</code>${badge("Teste", "info")}</div>`, { icon: "key" })}
    ${card("Webhooks", table([{ l: "URL", f: (r) => `<span class="mono">${r[0]}</span>` }, { l: "Eventos", f: (r) => r[1] }, { l: "Última entrega", f: (r) => r[2] }], [["https://api.excelcomaana.co.mz/vq", "venda.aprovada, reembolso", `${badge("200", "success")} há 4 min`], ["https://hooks.zapier.com/…/8812", "assinatura.cancelada", `${badge("200", "success")} ontem`]], { dense: 1 }), { icon: "code", flush: true, aside: btn("Adicionar", { s: "sm", i: "plus", act: "toast", arg: "Webhook adicionado" }) })}
  </div>`;
}, "Integrações");

/* definições da conta */
route("conta", "seller", () => {
  const t = S.accTab;
  let body;
  if (t === "perfil") body = card("Perfil público", `<div class="row" style="gap:16px">${avatar("Ana Sitoe", "xl")}<div class="stack-xs">${btn("Alterar foto", { s: "sm", i: "upload", act: "toast", arg: "Foto atualizada" })}<span class="faint" style="font-size:12px">Aparece no checkout e na área de membros.</span></div></div><div class="g2">${field("Nome comercial", inp("ac-b", { value: "Excel com a Ana" }), { id: "ac-b" })}${field("Email de suporte", inp("ac-e", { value: "suporte@excelcomaana.co.mz" }), { id: "ac-e" })}${field("WhatsApp de suporte", inp("ac-w", { value: "84 312 4471", prefix: "+258" }), { id: "ac-w" })}${field("Site", inp("ac-s", { value: "excelcomaana.co.mz" }), { id: "ac-s" })}</div>`, { foot: `<div class="row" style="justify-content:flex-end">${btn("Guardar", { v: "primary", act: "toast", arg: "Perfil guardado" })}</div>` });
  if (t === "verificacao") body = `${alertBox("Identidade verificada", "Nível 2 · sem limite mensal de vendas. Verificado a 14 mar 2025.", "success", "shield")}${card("Documentos", `<ol class="timeline">${[["BI e selfie", "Aprovado a 14 mar 2025", "success", "check"], ["NUIT 400 128 765", "Validado na Autoridade Tributária", "success", "check"], ["Comprovativo de morada", "Aprovado a 15 mar 2025", "success", "check"], ["Certidão comercial", "Necessária só para vendas acima de 2 milhões MT/mês", "neutral", "info"]].map(([a, b, tone, i]) => `<li class="ad-tone-${tone}"><span class="tl-dot">${ic(i, 13)}</span><div class="tl-body"><b>${a}</b><small>${b}</small></div></li>`).join("")}</ol>`)}${card("Limites", `<dl class="dl"><dt>Nível 1 · só BI</dt><dd>até ${mt(50000, 0)} por mês</dd><dt>Nível 2 · BI, NUIT e morada</dt><dd>sem limite</dd><dt>Saque máximo por dia</dt><dd>${mt(500000, 0)}</dd></dl>`)}`;
  if (t === "notificacoes") body = card("Notificações", [["Cada venda aprovada", "Push e som no telemóvel", true], ["Resumo diário", "Email às 20h com as vendas do dia", true], ["Pedidos de reembolso", "Email e SMS", true], ["Novos pedidos de afiliação", "Email", false], ["Saques concluídos", "SMS", true]].map(([a, b, on]) => `<div class="setting"><div><b>${a}</b><small>${b}</small></div>${sw(on, "toggle", "", a)}</div>`).join(""));
  if (t === "seguranca") body = card("Segurança", `<div class="setting"><div><b>Verificação em dois passos</b><small>Código por SMS para entrar e para cada saque</small></div>${sw(true, "toggle")}</div><div class="setting"><div><b>Confirmar saques acima de 100 000 MT por email</b><small>Recomendado</small></div>${sw(true, "toggle")}</div>${table([{ l: "Sessão", f: (r) => r[0] }, { l: "Local", f: (r) => r[1] }, { l: "Último acesso", f: (r) => r[2] }], [["Chrome · macOS (esta)", "Maputo", "Agora"], ["App · Android", "Maputo", "Há 2 h"], ["Safari · iPhone", "Matola", "Há 3 dias"]], { dense: 1 })}`);
  if (t === "equipa") body = card("Equipa", table([{ l: "Membro", f: (r) => cellUser(r[0], r[1]) }, { l: "Função", f: (r) => badge(r[2], r[2] === "Dona da conta" ? "primary" : "neutral") }, { l: "Acesso", f: (r) => r[3] }], [["Ana Sitoe", "ana@excelcomaana.co.mz", "Dona da conta", "Tudo"], ["Jaime Novela", "jaime@excelcomaana.co.mz", "Suporte", "Vendas, clientes, reembolsos"], ["Clara Muthemba", "clara@agencia.co.mz", "Marketing", "Cupões, integrações, relatórios"]]), { flush: true, aside: btn("Convidar", { s: "sm", v: "primary", i: "plus", act: "toast", arg: "Convite enviado" }) });
  return `${pagehead("Definições da conta", "Perfil, verificação, notificações e equipa.")}${tabs([["perfil", "Perfil"], ["verificacao", "Verificação"], ["notificacoes", "Notificações"], ["seguranca", "Segurança"], ["equipa", "Equipa", 3]], t, "accTab")}${body}`;
}, "Definições da conta");
ACT.accTab = (el) => { S.accTab = el.dataset.arg; render(); };
