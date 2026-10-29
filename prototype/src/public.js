
/* ══════════ Landing page ══════════ */
const CALC = { price: 2490, sales: 120 };
function calcOut() {
  const gross = CALC.price * CALC.sales, fee = CALC.sales * feeOf(CALC.price), net = gross - fee;
  return { gross, fee, net };
}
route("inicio", "public", () => {
  const c = calcOut();
  const notifs = [["Venda aprovada", "Excel do Zero ao Avançado · Apple Pay", "+2 367,99 MT"], ["Venda aprovada", "Ebook 100 Fórmulas · e-Mola", "+418,05 MT"], ["Saque concluído", "Para e-Mola 86 ••• •471 · 38 s", "48 320,00 MT"]];
  return `<div class="lp">
  <nav class="lp-nav" aria-label="Principal"><div class="lp-wrap">${logo()}
    <div class="lp-links"><a href="#funcionalidades">Funcionalidades</a><a href="#pagamentos">Pagamentos</a><a href="#taxas">Taxas</a><a href="#faq">Perguntas</a></div>
    <div class="row" style="gap:8px">${ibtn(isDark() ? "sun" : "moon", "Alternar tema", { act: "theme" })}${btn("Entrar", { v: "ghost", go: "entrar", cls: "lp-login" })}${btn("Criar conta grátis", { v: "primary", go: "comecar" })}</div></div></nav>

  <header class="lp-hero"><div class="lp-wrap">
    <div>
      <span class="lp-eyebrow"><b>Novo</b>Apple Pay e Google Pay no checkout</span>
      <h1 class="lp-h1">Venda os seus cursos e ebooks. <em>Receba no telemóvel.</em></h1>
      <p class="lp-lead">O VendAqui junta checkout, área de membros, afiliados e pagamentos por M-Pesa, e-Mola, cartão, Apple Pay e Google Pay numa só conta. Crie o produto, partilhe o link e comece a vender hoje.</p>
      <div class="lp-ctas">${btn("Começar a vender", { v: "primary", s: "lg", go: "comecar", ir: "arrow" })}${btn("Ver um checkout", { s: "lg", go: "checkout", i: "eye" })}</div>
      <div class="lp-trust"><span>${ic("checkc", 16)}Sem mensalidade</span><span>${ic("checkc", 16)}Conta aprovada em 24 h</span><span>${ic("checkc", 16)}Suporte em português</span></div>
    </div>
    <div class="lp-stage" aria-hidden="true">
      <div class="lp-dash">
        <div class="lp-dash-top"><div class="lp-dash-bal"><small>Saldo disponível</small><strong>${mt(48320)}</strong></div>${btn("Sacar", { v: "primary", s: "sm", i: "cash" })}</div>
        ${spark(series(30, 60000, 0.22, 900, 11), "var(--primary)", 300, 70)}
        <div class="lp-dash-mini"><div><small>Vendas hoje</small><b>37</b></div><div><small>Conversão</small><b>7,8%</b></div><div><small>Ticket médio</small><b>2 143 MT</b></div></div>
      </div>
      <div class="lp-phone"><div class="lp-phone-in"><div class="lp-phone-bar"><i></i></div><div class="lp-phone-co">
        <div class="cover cv-orange">Excel do Zero ao Avançado</div>
        <div class="row-between" style="font-size:12px"><span class="faint">Total</span><b style="font-size:16px">${mt(2490)}</b></div>
        <div class="lp-pm-row"><span class="on">${pmLogo("applepay")}</span><span>${pmLogo("googlepay")}</span><span>${pmLogo("mpesa")}</span><span>${pmLogo("card")}</span></div>
        <div class="lp-phone-btn">Pagar com Apple Pay</div>
      </div></div></div>
      <div class="lp-notifs">${notifs.map(([t, s, v], i) => `<div class="lp-notif" style="animation-delay:${0.25 + i * 0.35}s"><span class="tile">${ic(i === 2 ? "cash" : "zap", 16)}</span><div><b>${t}</b><small>${s}</small></div><strong>${v}</strong></div>`).join("")}</div>
    </div>
  </div></header>

  <section class="lp-methods" id="pagamentos"><div class="lp-wrap"><p>Os seus clientes pagam como preferem</p><div class="pm-logos">${[...Object.keys(METHODS), "bank"].map(pmLogo).join("")}</div></div></section>

  <section class="lp-sec" id="funcionalidades"><div class="lp-wrap">
    <div class="lp-head"><span class="lp-kicker">Tudo numa conta</span><h2 class="lp-h2">Do primeiro link de pagamento à primeira placa de 1 milhão.</h2><p class="lp-sub">Ferramentas que os grandes infoprodutores usam, pensadas para quem vende em Moçambique e recebe em meticais.</p></div>
    <div class="bento">
      <div class="bcell w4">${tile("cart", "primary", "md")}<h3>Checkout que converte no telemóvel</h3><p>Uma página, sem distrações. O comprador escreve o número, recebe o pedido de confirmação e introduz o PIN. Order bump, cronómetro e testemunhos ativam-se com um clique.</p>
        <div class="bcell-demo"><div class="bump-demo">${ic("gift", 18)}<span><b>Sim, quero o Ebook 100 Fórmulas</b> por apenas 190 MT. Aparece no checkout e sobe o ticket médio em 18%.</span></div></div></div>
      <div class="bcell">${tile("cap", "info", "md")}<h3>Área de membros incluída</h3><p>Aulas em vídeo, materiais e certificados. Os alunos entram com o email da compra.</p>
        <div class="bcell-demo mini-lessons"><div>${ic("checkc", 16, "ok")}Primeiros passos</div><div>${ic("checkc", 16, "ok")}Fórmulas essenciais</div><div>${ic("play", 16)}Tabelas dinâmicas</div></div></div>
      <div class="bcell inv w3"><span class="ad-tile ad-tile-md" style="background:var(--inv-accent-soft);color:var(--inv-accent)">${ic("share", 20)}</span><h3>Programa de afiliados</h3><p>Defina a comissão, aprove afiliados e a divisão do valor acontece em cada venda. Cada um vê o seu saldo e saca sozinho.</p>
        <div class="bcell-demo">${[["Kelvin Duarte", "184 vendas", "128 400 MT"], ["Sónia Matavele", "97 vendas", "71 910 MT"], ["Pedro Uamusse", "61 vendas", "42 670 MT"]].map(([n, v, c]) => `<div class="aff-row">${avatar(n, "xs")}<span>${n} <span style="color:var(--inv-text-3)">· ${v}</span></span><b>${c}</b></div>`).join("")}</div></div>
      <div class="bcell w3">${tile("target", "success", "md")}<h3>Recuperação de vendas</h3><p>Quem não concluiu o pagamento recebe SMS, WhatsApp e email automáticos com um link direto. Em média, 28% dos carrinhos abandonados voltam.</p>
        <div class="bcell-demo">${spark([12, 14, 13, 18, 17, 22, 21, 26, 25, 29, 31, 30], "var(--success)", 300, 56)}</div></div>
      <div class="bcell">${tile("repeat", "purple", "md")}<h3>Assinaturas</h3><p>Clubes e comunidades com cobrança mensal. No dia da renovação o assinante recebe o pedido no telemóvel.</p></div>
      <div class="bcell">${tile("shield", "teal", "md")}<h3>Antifraude e KYC</h3><p>Regras por número, por cartão e por dispositivo. Verificação de identidade com BI e NUIT.</p></div>
      <div class="bcell">${tile("plug", "orange", "md")}<h3>Pixels e integrações</h3><p>Meta, TikTok e Google Ads com eventos de compra. Webhooks e API para o seu sistema.</p></div>
    </div>
  </div></section>

  <section class="lp-sec" style="padding-top:0"><div class="lp-wrap">
    <div class="lp-head"><span class="lp-kicker">Como funciona</span><h2 class="lp-h2">Três passos até à primeira venda.</h2></div>
    <div class="steps">
      <div class="step"><span class="step-n">Passo 1</span><h3>Crie a conta e verifique-se</h3><p>Nome, BI e NUIT. A equipa aprova em até 24 horas e pode começar a criar produtos enquanto espera.</p></div>
      <div class="step"><span class="step-n">Passo 2</span><h3>Cadastre o produto</h3><p>Curso, ebook, mentoria ou assinatura. Defina o preço, a garantia e como o cliente recebe o acesso.</p></div>
      <div class="step"><span class="step-n">Passo 3</span><h3>Partilhe o link e receba</h3><p>No Instagram, WhatsApp ou em anúncios. Cada venda cai no saldo e saca para e-Mola ou para o banco.</p></div>
    </div>
  </div></section>

  <section class="lp-sec lp-dark"><div class="lp-wrap payout">
    <div><span class="lp-kicker">Saques</span><h2 class="lp-h2">O dinheiro das vendas na sua carteira, no mesmo dia.</h2><p class="lp-sub">Vendas por carteira móvel ficam disponíveis em 2 dias. Saque para M-Pesa ou e-Mola sem custo, a qualquer hora, ou para qualquer banco moçambicano.</p>
      <div class="payout-facts"><div><b>38 s</b><small>tempo médio de saque para e-Mola</small></div><div><b>D+2</b><small>libertação de vendas por carteira móvel</small></div><div><b>0 MT</b><small>custo de saque para carteira móvel</small></div></div></div>
    <div class="payout-card"><div class="row-between"><span style="color:var(--inv-text-2);font-size:14px">Saque solicitado</span>${badge("Concluído", "success", { dot: true })}</div>
      <div class="payout-big">48 320<small>MT</small></div>
      <div><div class="payout-line"><span>Destino</span><b>e-Mola · 86 ••• •471</b></div><div class="payout-line"><span>Custo do saque</span><b>0,00 MT</b></div><div class="payout-line"><span>Concluído em</span><b>38 segundos</b></div></div></div>
  </div></section>

  <section class="lp-sec" id="taxas"><div class="lp-wrap">
    <div class="lp-head"><span class="lp-kicker">Taxas</span><h2 class="lp-h2">Só paga quando vende.</h2><p class="lp-sub">Sem mensalidade, sem custo de adesão. Uma taxa por venda aprovada, igual para todos os métodos.</p></div>
    <div class="calc">
      <div class="calc-in">
        <div class="fee-tag"><b>${num(FEE.pct, 1)}%</b>+ ${FEE.fixed} MT por venda aprovada</div>
        <div class="range"><div class="range-top"><label for="calc-price" class="ad-label">Preço do produto</label><b id="calc-price-v">${mt(CALC.price, 0)}</b></div><input type="range" id="calc-price" min="200" max="20000" step="10" value="${CALC.price}"></div>
        <div class="range"><div class="range-top"><label for="calc-sales" class="ad-label">Vendas por mês</label><b id="calc-sales-v">${int(CALC.sales)}</b></div><input type="range" id="calc-sales" min="1" max="1500" step="1" value="${CALC.sales}"></div>
      </div>
      <div class="calc-out">
        <span class="muted">Recebe por mês</span>
        <span class="calc-total" id="calc-net">${mt(c.net, 0)}</span>
        <dl class="dl" style="margin-top:8px"><dt>Faturamento</dt><dd id="calc-gross">${mt(c.gross, 0)}</dd><dt>Taxa VendAqui</dt><dd id="calc-fee">−${mt(c.fee, 0)}</dd><dt>Saques para carteira móvel</dt><dd>0 MT</dd></dl>
        <div style="margin-top:auto;padding-top:12px">${btn("Criar conta e começar", { v: "primary", s: "lg", go: "comecar", cls: "ad-btn-block" })}</div>
      </div>
    </div>
  </div></section>

  <section class="lp-sec" style="padding-top:0"><div class="lp-wrap">
    <div class="lp-head"><span class="lp-kicker">Quem já vende</span><h2 class="lp-h2">Produtores que trocaram transferências manuais por um link.</h2></div>
    <div class="quotes">
      ${[["Antes confirmava cada pagamento por SMS e mandava o curso no WhatsApp. Hoje o aluno paga com e-Mola ou Apple Pay e entra sozinho na área de membros.", "Ana Sitoe", "Excel com a Ana", "Placa 1 milhão"], ["O order bump do ebook pagou o tráfego do mês. Ativei num minuto e o ticket médio subiu logo na primeira semana.", "Nélio Cumbe", "Finanças para Jovens", "Placa 500 mil"], ["Tenho 40 afiliados a vender a minha mentoria. Cada um vê as suas comissões e eu deixei de fazer contas no Excel.", "Lúcia Mabote", "Mentoria Negócio Digital", "Placa 100 mil"]].map(([q, n, b, p]) => `<figure class="quote" style="margin:0"><span class="stars">${ic("star", 15).repeat(5)}</span><p>${q}</p><figcaption class="quote-by">${avatar(n, "md")}<div><b>${n}</b><small>${b}</small></div><span class="plaque">${p}</span></figcaption></figure>`).join("")}
    </div>
  </div></section>

  <section class="lp-sec" id="faq" style="padding-top:0"><div class="lp-wrap" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:40px">
    <div class="lp-head"><span class="lp-kicker">Perguntas</span><h2 class="lp-h2">Perguntas frequentes</h2><p class="lp-sub">Não encontrou a resposta? Fale com a equipa pelo chat dentro da conta.</p></div>
    <div class="faq">${[["Preciso de ter empresa para vender?", "Não. Pode vender como pessoa singular com BI e NUIT. Se tiver empresa, registe-a com o NUIT da empresa e a certidão comercial."], ["Quanto tempo demora a receber?", "Vendas por M-Pesa e e-Mola ficam disponíveis 2 dias depois da aprovação. Vendas por cartão, Apple Pay e Google Pay ficam disponíveis em 14 dias. Uma reserva de 5% fica retida 30 dias para cobrir reembolsos."], ["Que formas de pagamento aceitam?", "M-Pesa e e-Mola (o comprador confirma com o PIN no telemóvel), cartões Visa e Mastercard, Apple Pay e Google Pay. Com Apple Pay e Google Pay a compra fica feita com Face ID ou impressão digital, sem escrever o cartão."], ["Posso vender em dólares ou para fora de Moçambique?", "Sim. Ative o cartão internacional no produto e defina um preço em USD. O valor é convertido para meticais no momento do saque."], ["O que acontece se o cliente pedir reembolso?", "Dentro do prazo de garantia que definir (7, 15 ou 30 dias), o reembolso é automático e o valor sai do seu saldo. Fora do prazo, decide caso a caso."]].map(([q, a], i) => `<details ${i === 0 ? "open" : ""}><summary>${q}${ic("plus", 18)}</summary><p>${a}</p></details>`).join("")}</div>
  </div></section>

  <section style="padding-bottom:72px"><div class="lp-wrap"><div class="lp-cta"><div><h2>Crie o seu primeiro produto em 10 minutos.</h2><p>Conta grátis. Só paga quando vende.</p></div>${btn("Criar conta grátis", { v: "inverse", s: "lg", go: "comecar", ir: "arrow" })}</div></div></section>
  <footer class="lp-foot"><div class="lp-wrap">
    <div class="stack-sm">${logo()}<p style="max-width:30ch">Plataforma de pagamentos para infoprodutores. Maputo, Moçambique.</p></div>
    <div><h4>Produto</h4><ul><li><a href="#funcionalidades">Funcionalidades</a></li><li><a href="#taxas">Taxas</a></li><li><a href="#" data-go="checkout">Exemplo de checkout</a></li></ul></div>
    <div><h4>Para quem</h4><ul><li><a href="#" data-go="comecar">Produtores</a></li><li><a href="#" data-act="affMarket">Afiliados</a></li><li><a href="#" data-go="aluno">Alunos</a></li></ul></div>
    <div><h4>Empresa</h4><ul><li><a href="#faq">Ajuda</a></li><li><a href="#" data-act="toast" data-arg="Termos de uso abertos">Termos de uso</a></li><li><a href="#" data-act="toast" data-arg="Política de privacidade aberta">Privacidade</a></li></ul></div>
  </div></footer>
  </div>`;
}, "");
function calcUpdate() {
  const c = calcOut();
  $("#calc-price-v").textContent = mt(CALC.price, 0); $("#calc-sales-v").textContent = int(CALC.sales);
  $("#calc-net").textContent = mt(c.net, 0); $("#calc-gross").textContent = mt(c.gross, 0); $("#calc-fee").textContent = "−" + mt(c.fee, 0);
}
ACT.affMarket = () => { go("afiliados"); S.affTab = "mercado"; render(); };

/* ══════════ Checkout ══════════ */
const isXPay = (m) => m === "applepay" || m === "googlepay";
function opHint(phone, m) {
  const op = OPERATOR(phone);
  if (op === "tmcel") return `${ic("alert", 14)}Números Tmcel (82 e 83) não são aceites. Use M-Pesa, e-Mola ou cartão.`;
  if (op && op !== m && S.co.methods[op]) return `${ic("alert", 14)}Este número é ${METHODS[op].fee}. <button class="ad-btn-link" data-act="coMethod" data-arg="${op}">Pagar com ${METHODS[op].l}</button>`;
  return `Números ${METHODS[m].pre.join(" e ")} · ${METHODS[m].fee}`;
}
const OPERATOR = (n) => { const p = n.replace(/\D/g, "").replace(/^258/, "").slice(0, 2); return { 84: "mpesa", 85: "mpesa", 86: "emola", 87: "emola", 82: "tmcel", 83: "tmcel" }[p] || null; };
function coTotals() {
  const p = PRODUCTS[0]; const c = S.checkout;
  const bump = S.co.bump && c.bump ? 190 : 0;
  const disc = c.couponOk ? Math.round(p.price * 0.1) : 0;
  return { p, bump, disc, total: p.price + bump - disc };
}
function checkoutMarkup(preview = false) {
  const co = S.co, c = S.checkout, t = coTotals();
  const methods = Object.keys(METHODS).filter((k) => co.methods[k]);
  if (!methods.includes(c.method)) c.method = methods[0] || "emola";
  const wallet = METHODS[c.method].pre.length > 0, xpay = isXPay(c.method);
  const p = t.p;
  return `<div class="co acc-${co.acc}">
  ${co.timer ? `<div class="co-timer">${ic("clock", 16)}Preço de lançamento termina em <b id="co-timer-val">${String(co.mins).padStart(2, "0")}:00</b></div>` : ""}
  <div class="co-head"><div class="co-wrap"><span class="co-seller">${avatar("Ana Sitoe", "sm")}Excel com a Ana</span><span class="co-secure">${ic("lock", 15)}Pagamento seguro</span></div></div>
  <div class="co-wrap co-grid">
    <div class="stack-sm" style="gap:16px">
      <section class="co-box"><h3><span class="n">1</span>Os seus dados</h3>
        <div class="co-fields">
          ${field("Nome completo", inp("co-name", { value: c.name || "Celso Matsinhe", ph: "Como aparece no BI" }), { id: "co-name", cls: "full" })}
          ${field("Email", inp("co-email", { type: "email", value: c.email || "celso.matsinhe@gmail.com", ph: "Para onde enviamos o acesso" }), { id: "co-email" })}
          ${field("Telemóvel", inp("co-phone", { type: "tel", value: c.phone, prefix: "+258", ph: "86 000 0000", attrs: 'inputmode="tel" autocomplete="tel-national"' }), { id: "co-phone" })}
          ${co.nuit ? field("NUIT (para fatura)", inp("co-nuit", { ph: "Opcional" }), { id: "co-nuit", cls: "full" }) : ""}
        </div></section>
      <section class="co-box"><h3><span class="n">2</span>Pagamento</h3>
        <div class="pmethods" role="radiogroup" aria-label="Método de pagamento">${methods.map((k) => `<button class="pmethod pm-${k} ${c.method === k ? "on" : ""}" role="radio" aria-checked="${c.method === k}" data-act="coMethod" data-arg="${k}">${pmLogo(k)}<b class="sr-only">${METHODS[k].l}</b><small>${METHODS[k].fee}</small><span class="chk">${c.method === k ? ic("check", 12) : ""}</span></button>`).join("")}</div>
        ${wallet ? `${field(`Número ${METHODS[c.method].l}`, inp("co-wallet", { type: "tel", value: c.phone, prefix: "+258", attrs: 'inputmode="tel"' }), { id: "co-wallet", help: `<span id="co-op">${opHint(c.phone, c.method)}</span>` })}
          <div class="co-note">${ic("phone", 18)}<span>Depois de carregar em pagar, recebe no telemóvel um pedido de confirmação de <b>${mt(t.total)}</b>. Introduza o PIN ${METHODS[c.method].l} para concluir. O pedido expira em 60 segundos.</span></div>`
        : xpay ? `<div class="co-note">${ic(METHODS[c.method].icon, 18)}<span>Ao carregar em pagar abre a janela do <b>${METHODS[c.method].l}</b>. Confirme com Face ID, impressão digital ou o código do dispositivo. Não precisa de escrever os dados do cartão.</span></div>`
        : `<div class="co-fields">${field("Número do cartão", inp("co-cc", { value: "4000 0000 0000 0002", icon: "card", attrs: 'inputmode="numeric" autocomplete="cc-number"' }), { id: "co-cc", cls: "full" })}${field("Validade", inp("co-exp", { value: "08/29", ph: "MM/AA" }), { id: "co-exp" })}${field("CVV", inp("co-cvv", { value: "123", ph: "3 dígitos", attrs: 'inputmode="numeric"' }), { id: "co-cvv" })}${field("Nome no cartão", inp("co-ccname", { value: "CELSO MATSINHE" }), { id: "co-ccname", cls: "full" })}</div><div class="co-note">${ic("shield", 18)}<span>Visa e Mastercard, nacionais e internacionais. Pode ser pedida a confirmação 3-D Secure do seu banco.</span></div>`}
      </section>
      ${co.bump ? `<div class="co-bump"><div class="co-bump-top">Oferta única nesta página</div><label for="co-bump"><input type="checkbox" id="co-bump" ${c.bump ? "checked" : ""}><p><b>Sim, quero o Ebook “100 Fórmulas de Excel”</b> por apenas <b>190 MT</b> <s>450 MT</s>. As fórmulas que mais aparecem em entrevistas de emprego, prontas a copiar.</p></label></div>` : ""}
      <button class="co-pay" data-act="${preview ? "" : "pay"}">${ic(xpay ? METHODS[c.method].icon : "lock", 18)}${xpay ? "Pagar com " + METHODS[c.method].l : esc(co.cta)} · ${mt(t.total)}</button>
      <p class="co-legal">Ao comprar aceita os Termos de uso. Processado pela VendAqui em nome de Excel com a Ana. NUIT do vendedor 400 128 765.</p>
    </div>
    <aside class="co-summary">
      <section class="co-box">
        <div class="co-prod"><span class="cover lg cv-orange">${ic("cap", 26)}</span><div><h4>${p.name}</h4><small>Curso online · 20 aulas · acesso por 1 ano</small></div></div>
        <div class="co-lines"><div><span>${p.name}</span><b>${mt(p.price)}</b></div>${t.bump ? `<div><span>Ebook 100 Fórmulas</span><b>${mt(t.bump)}</b></div>` : ""}${t.disc ? `<div><span>Cupão ANA10</span><b style="color:var(--success)">−${mt(t.disc)}</b></div>` : ""}</div>
        ${c.couponOk ? "" : `<div class="row" style="gap:8px;flex-wrap:nowrap">${inp("co-coupon", { ph: "Tem um cupão?", icon: "tag", value: c.coupon })}${btn("Aplicar", { act: "coupon" })}</div>`}
        <div class="co-total"><span class="muted">Total</span><b id="co-total">${mt(t.total)}</b></div>
      </section>
      <section class="co-box"><div class="co-guarantee"><span class="co-seal">7<small>dias</small></span><div><b>Garantia de 7 dias</b><p class="muted" style="font-size:13px;margin-top:2px">Se não gostar, pede o reembolso na área do aluno e recebe o valor de volta pelo mesmo meio de pagamento.</p></div></div></section>
      ${co.testi ? `<div class="co-testi"><span class="stars">${ic("star", 14).repeat(5)}</span>“Fiz o curso em 3 semanas e passei no teste de Excel da entrevista. As aulas de tabelas dinâmicas valem o preço todo.”<b style="font-size:13px">Sheila Mabunda · Maputo</b></div>` : ""}
    </aside>
  </div></div>`;
}
let coTimer = null;
function startTimer() {
  clearInterval(coTimer);
  let left = S.co.mins * 60 - 1;
  coTimer = setInterval(() => { const el = $("#co-timer-val"); if (!el) return clearInterval(coTimer); left = Math.max(0, left - 1); el.textContent = String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0"); }, 1000);
}
route("checkout", "public", () => { AFTER.push(startTimer); return checkoutMarkup(); }, "Checkout");
ACT.coMethod = (el) => { if (!el.dataset.arg) return; S.checkout.method = el.dataset.arg; render(); };
ACT.coupon = () => {
  const v = ($("#co-coupon").value || "").trim().toUpperCase();
  if (v === "ANA10") { S.checkout.couponOk = true; render(); toast("Cupão aplicado", "10% de desconto no curso"); }
  else toast("Este cupão não existe ou já expirou", "Experimente ANA10", "danger", "xc");
};
ACT.pay = () => {
  const name = $("#co-name").value.trim(), email = $("#co-email").value.trim();
  if (!name || !/.+@.+\..+/.test(email)) { toast("Faltam dados", "Preencha o nome e um email válido para receber o acesso.", "danger", "alert"); return; }
  S.checkout.name = name; S.checkout.email = email;
  openModal("paywait", { step: 0 });
  const card = S.checkout.method !== "emola" && S.checkout.method !== "mpesa";
  setTimeout(() => { S.modal && (S.modal.data.step = 1, renderOverlays()); }, card ? 900 : 1200);
  setTimeout(() => { S.modal && (S.modal.data.step = 2, renderOverlays()); }, card ? 2200 : 3600);
  setTimeout(() => { if (S.modal) { S.modal = null; go("obrigado"); } }, card ? 3000 : 4500);
};
MODALS.paywait = ({ step }) => {
  const c = S.checkout, card = c.method === "card", xpay = isXPay(c.method), t = coTotals();
  if (xpay) { const l = METHODS[c.method].l; return { title: "A pagar com " + l, size: "sm", noClose: true, body: `<div class="co-wait"><span class="ad-tile ad-tile-lg ad-tile-soft ad-tone-neutral">${ic(METHODS[c.method].icon, 24)}</span><span class="co-countdown">${mt(t.total)} para Excel com a Ana</span><div class="co-wait-steps">${[`A abrir ${l}`, "Confirmação no dispositivo", "Pagamento aprovado"].map((s, i) => `<div class="${i < step || step === 2 ? "done" : ""}">${i < step || step === 2 ? ic("checkc", 18) : i === step ? '<span class="ad-spinner" style="width:16px;height:16px"></span>' : ic("clock", 18, "faint")}${s}</div>`).join("")}</div></div>` }; }
  const steps = card ? ["A validar o cartão", "Autenticação 3-D Secure", "Pagamento aprovado"] : [`Pedido enviado para +258 ${c.phone}`, `A aguardar o PIN ${METHODS[c.method].l}`, "Pagamento confirmado"];
  return { title: card ? "A processar o pagamento" : "Confirme no seu telemóvel", size: "sm", noClose: true, body: `<div class="co-wait">
    ${card ? `<span class="ad-tile ad-tile-lg ad-tile-soft ad-tone-info">${ic("card", 24)}</span>` : `<div class="co-phone"><div class="co-ussd"><b>${METHODS[c.method].l}</b><br>Confirma pagamento de ${mt(t.total)} a VENDAQUI*EXCEL?<i>PIN: ••••</i></div></div>`}
    <span class="co-countdown">${card ? "Não feche esta janela" : "O pedido expira em 60 s"}</span>
    <div class="co-wait-steps">${steps.map((s, i) => `<div class="${i < step || step === 2 ? "done" : ""}">${i < step || step === 2 ? ic("checkc", 18) : i === step ? '<span class="ad-spinner" style="width:16px;height:16px"></span>' : ic("clock", 18, "faint")}${s}</div>`).join("")}</div></div>` };
};

route("obrigado", "public", () => {
  const t = coTotals(), c = S.checkout;
  return `<div class="co acc-${S.co.acc}"><div class="co-head"><div class="co-wrap"><span class="co-seller">${avatar("Ana Sitoe", "sm")}Excel com a Ana</span><span class="co-secure">${ic("lock", 15)}Pagamento seguro</span></div></div>
  <div class="co-wrap"><div class="ty">
    <div class="ty-hero"><span class="ty-check">${ic("check", 36)}</span><h1>Pagamento aprovado</h1><p>Enviámos o acesso para <b>${esc(c.email || "celso.matsinhe@gmail.com")}</b> e um SMS para +258 ${esc(c.phone)}.</p></div>
    <section class="co-box"><dl class="dl"><dt>Pedido</dt><dd class="mono">VQ-48214</dd><dt>Produto</dt><dd>${t.p.name}${t.bump ? " + Ebook 100 Fórmulas" : ""}</dd><dt>Pago com</dt><dd>${pm(c.method)}</dd><dt>Total</dt><dd>${mt(t.total)}</dd><dt>Garantia até</dt><dd>29 out 2026</dd></dl>
      ${btn("Aceder ao curso", { v: "primary", s: "lg", go: "aula", ir: "arrow", cls: "ad-btn-block" })}</section>
    <div class="upsell"><div class="upsell-top"><span>Espere, esta oferta só aparece agora</span><span>Adicione com 1 clique</span></div>
      <div class="upsell-body"><span class="cover lg cv-blue">${ic("cap", 26)}</span><div class="grow"><b style="font-size:16px">Dashboards Profissionais no Power BI</b><p class="muted" style="font-size:13.5px;margin-top:2px">Transforme as suas folhas de Excel em relatórios interativos. 32 aulas.</p></div><div class="stack-xs" style="align-items:flex-end"><span class="price-old">${mt(3990)}</span><span class="price-new">${mt(2390)}</span></div></div>
      <div style="padding:0 20px 20px" class="row">${btn("Sim, adicionar ao meu pedido", { v: "primary", act: "upsell", cls: "grow" })}${btn("Não, obrigado", { v: "ghost", go: "aluno" })}</div></div>
  </div></div></div>`;
}, "Compra concluída");
ACT.upsell = () => { toast("Power BI adicionado", `Novo pedido de ${mt(2390)} enviado para o seu telemóvel`, "success", "checkc"); setTimeout(() => go("aluno"), 900); };

/* ══════════ Entrar / onboarding ══════════ */
function authSide() {
  return `<aside class="auth-side"><h2>A plataforma de quem vende conhecimento em Moçambique.</h2>
  <div class="stack-sm">${[["cart", "Checkout com M-Pesa, e-Mola, cartão, Apple Pay e Google Pay", "O comprador paga em segundos, sem sair do telemóvel."], ["cap", "Área de membros incluída", "Aulas, materiais e certificados no mesmo lugar."], ["cash", "Saque para e-Mola em menos de 1 minuto", "Sem custo, a qualquer hora."]].map(([i, t, d]) => `<div class="ad-feature"><span class="ad-feature-icon">${ic(i, 16)}</span><div><div class="ad-feature-title">${t}</div><div class="ad-feature-desc">${d}</div></div></div>`).join("")}</div>
  <div class="row" style="gap:28px">${[["3 400+", "produtores ativos"], ["412 mil", "compras em 2026"], ["94,6%", "aprovação nas carteiras"]].map(([a, b]) => `<div><b style="font-size:24px;font-weight:800;letter-spacing:-0.02em">${a}</b><div style="font-size:13px;color:var(--inv-text-2)">${b}</div></div>`).join("")}</div></aside>`;
}
route("entrar", "public", () => `<div class="auth"><div class="auth-main"><div>${logo()}</div>
  <form class="auth-form" data-form="login"><div class="stack-xs"><h1>Bem-vindo de volta</h1><p class="muted">Entre na sua conta para ver as vendas de hoje.</p></div>
  ${field("Email", inp("li-email", { type: "email", value: "ana@excelcomaana.co.mz", icon: "mail", s: "lg" }), { id: "li-email" })}
  ${field("Palavra-passe", inp("li-pass", { type: "password", ph: "A sua palavra-passe", icon: "lock", s: "lg" }), { id: "li-pass", aside: '<button type="button" class="ad-link ad-btn-link" data-act="toast" data-arg="Enviámos um link de recuperação para o seu email">Esqueceu-se?</button>' })}
  <label class="ad-check"><input type="checkbox" checked><span class="ad-check-box">${ic("check", 12)}</span><span class="ad-check-label">Manter sessão iniciada neste dispositivo</span></label>
  ${btn("Entrar", { v: "primary", s: "lg", go: "painel", cls: "ad-btn-block" })}
  <div class="or">ou entrar como demonstração</div>
  <div class="row" style="gap:8px">${btn("Produtor", { s: "sm", i: "store", go: "painel" })}${btn("Aluno", { s: "sm", i: "cap", go: "aluno" })}${btn("Administrador", { s: "sm", i: "shield", go: "admin" })}</div>
  <p class="muted" style="text-align:center">Ainda não vende no VendAqui? <button type="button" class="ad-btn-link" data-go="comecar">Criar conta grátis</button></p></form></div>${authSide()}</div>`, "Entrar");

const OB_STEPS = ["Conta", "Negócio", "Identidade", "Recebimentos"];
route("comecar", "public", () => {
  const o = S.onboard, s = o.step;
  let body = "";
  if (s === 0) body = `<div class="stack-xs"><h1>Crie a sua conta</h1><p class="muted">Grátis. Só paga quando vende.</p></div>
    ${field("Nome completo", inp("ob-name", { value: "Ana Sitoe", s: "lg" }), { id: "ob-name" })}
    ${field("Email", inp("ob-email", { type: "email", value: "ana@excelcomaana.co.mz", s: "lg" }), { id: "ob-email" })}
    ${field("Telemóvel", inp("ob-phone", { type: "tel", value: "84 312 4471", prefix: "+258", s: "lg" }), { id: "ob-phone", help: "Enviamos um código por SMS para confirmar." })}
    ${field("Palavra-passe", inp("ob-pass", { type: "password", ph: "Mínimo 8 caracteres", s: "lg" }), { id: "ob-pass" })}`;
  if (s === 1) body = `<div class="stack-xs"><h1>Sobre o seu negócio</h1><p class="muted">Usamos estes dados na fatura que o comprador recebe.</p></div>
    <div class="choice-grid">${[["singular", "Pessoa singular", "Vende com o seu BI e NUIT pessoal"], ["empresa", "Empresa", "Tem NUIT de empresa e certidão comercial"]].map(([k, t, d]) => `<button type="button" class="choice ${o.kind === k ? "on" : ""}" data-act="obKind" data-arg="${k}">${ic(k === "singular" ? "user" : "store", 20)}<b>${t}</b><small>${d}</small></button>`).join("")}</div>
    ${field("Nome comercial", inp("ob-brand", { value: "Excel com a Ana", s: "lg" }), { id: "ob-brand", help: "Aparece no checkout e no extrato do comprador." })}
    ${field("NUIT", inp("ob-nuit", { value: "400 128 765", s: "lg", attrs: 'inputmode="numeric"' }), { id: "ob-nuit", help: "9 dígitos. Está no cartão de contribuinte." })}
    ${field("O que vai vender?", sel("ob-cat", ["Cursos e formações", "Ebooks e ficheiros", "Mentorias e consultoria", "Comunidades e assinaturas", "Eventos e bilhetes"], { s: "lg" }), { id: "ob-cat" })}`;
  if (s === 2) body = `<div class="stack-xs"><h1>Verifique a sua identidade</h1><p class="muted">Exigido pelo Banco de Moçambique para receber pagamentos. A análise demora até 24 horas.</p></div>
    <div class="docslots">${[["bi1", "BI · frente"], ["bi2", "BI · verso"], ["selfie", "Selfie com o BI"], ["nuit", "Cartão NUIT"]].map(([k, l]) => `<button type="button" class="docslot ${o.docs[k] ? "ok" : ""}" data-act="obDoc" data-arg="${k}">${ic(o.docs[k] ? "checkc" : "upload", 22)}<span>${o.docs[k] ? l + " enviado" : l}</span></button>`).join("")}</div>
    ${alertBox("Dicas para aprovar à primeira", "Fotografe com boa luz, sem reflexos, e com os quatro cantos do documento visíveis.", "info", "info")}`;
  if (s === 3) body = `<div class="stack-xs"><h1>Onde quer receber?</h1><p class="muted">Pode mudar quando quiser em Financeiro.</p></div>
    <div class="choice-grid">${[["mpesa", "M-Pesa", "Saque em segundos, sem custo"], ["emola", "e-Mola", "Saque em segundos, sem custo"], ["bank", "Conta bancária", "1 dia útil · 25 MT por saque"]].map(([k, t, d], i) => `<button type="button" class="choice ${i === 0 ? "on" : ""}" data-act="obPay" data-arg="${k}"><span class="pm pm-${k}"><i></i>${t}</span><small>${d}</small></button>`).join("")}</div>
    ${field("Número e-Mola", inp("ob-emola", { type: "tel", value: "86 312 4471", prefix: "+258", s: "lg" }), { id: "ob-emola", help: "Tem de estar em nome de Ana Sitoe." })}`;
  const docsOk = Object.keys(o.docs).length >= 3;
  return `<div class="auth"><div class="auth-main"><div class="row-between">${logo()}<span class="faint" style="font-size:13px">Passo ${s + 1} de 4 · ${OB_STEPS[s]}</span></div>
  <form class="auth-form" data-form="onboard"><div class="stepper">${OB_STEPS.map((_, i) => `<i class="${i <= s ? "on" : ""}"></i>`).join("")}</div>${body}
  <div class="row" style="gap:8px">${s > 0 ? btn("Voltar", { act: "obStep", arg: s - 1, i: "arrowl" }) : ""}${s < 3 ? btn("Continuar", { v: "primary", s: "lg", act: "obStep", arg: s + 1, cls: "grow", attrs: s === 2 && !docsOk ? "disabled" : "" }) : btn("Concluir e ir para o painel", { v: "primary", s: "lg", act: "obDone", cls: "grow" })}</div>
  ${s === 0 ? '<p class="muted" style="text-align:center">Já tem conta? <button type="button" class="ad-btn-link" data-go="entrar">Entrar</button></p>' : ""}</form></div>${authSide()}</div>`;
}, "Criar conta");
ACT.obStep = (el) => { S.onboard.step = +el.dataset.arg; render(); };
ACT.obKind = (el) => { S.onboard.kind = el.dataset.arg; render(); };
ACT.obDoc = (el) => { S.onboard.docs[el.dataset.arg] = true; render(); };
ACT.obPay = (el) => { $$(".choice", el.parentNode).forEach((b) => b.classList.toggle("on", b === el)); };
ACT.obDone = () => { go("painel"); setTimeout(() => toast("Conta criada", "Os seus documentos estão em análise. Já pode criar produtos.", "info", "info"), 300); };

/* ══════════ Área do aluno ══════════ */
const COURSE = [
  { id: "m1", t: "Primeiros passos", l: ["Conhecer o ecrã do Excel", "Células, linhas e colunas", "Formatar como um profissional", "Guardar e partilhar ficheiros"] },
  { id: "m2", t: "Fórmulas essenciais", l: ["SOMA, MÉDIA e CONTAR", "Referências absolutas com $", "SE e condições encadeadas", "PROCV e PROCX na prática", "Erros comuns e como corrigir"] },
  { id: "m3", t: "Tabelas dinâmicas", l: ["Criar a primeira tabela dinâmica", "Agrupar por datas e categorias", "Segmentação de dados", "Relatório de vendas mensal"] },
  { id: "m4", t: "Gráficos e dashboards", l: ["Escolher o gráfico certo", "Gráficos combinados", "Montar um dashboard numa folha", "Atualizar com um clique"] },
  { id: "m5", t: "Automação com macros", l: ["Gravar a primeira macro", "Botões que executam macros", "Projeto final: controlo de stock"] },
];
const DUR = ["06:12", "08:40", "11:05", "07:31", "09:58", "12:20", "14:03", "10:47", "13:15", "08:02"];
const lessonList = () => COURSE.flatMap((m, mi) => m.l.map((t, li) => ({ id: `${m.id}l${li + 1}`, t, m, mi, li, dur: DUR[(mi * 5 + li) % DUR.length] })));
function stuTop() {
  const cur = S.route;
  return `<header class="stu-top"><div class="lp-wrap">${logo("Área do aluno", "aluno")}
  <div class="ad-tabs ad-tabs-segmented vq-hide-sm">${[["aluno", "Os meus produtos"], ["aluno-compras", "Compras"]].map(([r, l]) => `<button class="ad-tab ${cur === r || (r === "aluno" && cur === "aula") ? "is-active" : ""}" data-go="${r}">${l}</button>`).join("")}</div>
  <div class="row" style="gap:6px">${ibtn(isDark() ? "sun" : "moon", "Alternar tema", { act: "theme" })}<button class="ad-userchip" data-go="aluno-compras">${avatar("Celso Matsinhe")}<span class="ad-userchip-text vq-hide-sm"><span class="ad-userchip-name">Celso Matsinhe</span><span class="ad-userchip-role">Aluno</span></span></button></div></div></header>`;
}
const progress = () => Math.round((S.done.size / lessonList().length) * 100);
route("aluno", "public", () => {
  const ls = lessonList(), next = ls.find((l) => !S.done.has(l.id)) || ls[0];
  const owned = [[PRODUCTS[0], progress(), `${S.done.size} de ${ls.length} aulas`], [PRODUCTS[2], 100, "Ebook · PDF de 84 páginas"], [PRODUCTS[3], 40, "Comunidade · renova a 14 nov"]];
  return `${stuTop()}<main class="lp-wrap" style="padding-block:28px 96px" id="vq-main" tabindex="-1"><div class="stack">
  <div class="stack-xs"><h1 style="font-size:26px;font-weight:700;letter-spacing:-0.02em">Olá, Celso</h1><p class="muted">Continue de onde parou. Faltam ${ls.length - S.done.size} aulas para o certificado.</p></div>
  <section class="stu-continue"><div class="stu-continue-vid"><div class="video-slide"><small>Módulo ${next.mi + 1} · Aula ${next.li + 1}</small><b>${next.t}</b></div><button class="playbtn" data-act="openLesson" data-arg="${next.id}" aria-label="Continuar aula">${ic("play", 26)}</button></div>
    <div class="stu-continue-body"><small>Continuar a ver</small><h2>${PRODUCTS[0].name}</h2><p style="color:var(--inv-text-2)">Próxima aula: ${next.t} · ${next.dur}</p>
    <div class="ad-progress"><div class="ad-progress-top"><span>Progresso do curso</span><strong>${progress()}%</strong></div><div class="ad-progress-track"><div class="ad-progress-fill" style="width:${progress()}%;background:var(--inv-accent)"></div></div></div>
    <div>${btn("Continuar", { v: "primary", act: "openLesson", arg: next.id, i: "play" })}</div></div></section>
  <div class="row-between"><h2 class="section-title">Os meus produtos</h2><span class="faint" style="font-size:13px">3 produtos de Excel com a Ana</span></div>
  <div class="pgrid">${owned.map(([p, pr, sub]) => `<button class="pcard" data-act="${p.id === "p1" ? "openLesson" : "toast"}" data-arg="${p.id === "p1" ? next.id : "A abrir " + p.name}"><div class="pcard-head cv-${p.cv}"><span class="pcard-type">${ic(p.icon, 14)}${p.type}</span><h4>${p.name}</h4></div><div class="pcard-body"><span class="faint" style="font-size:13px">${sub}</span><div class="ad-progress ad-progress-sm"><div class="ad-progress-top"><span>${pr === 100 ? "Concluído" : "Progresso"}</span><strong>${pr}%</strong></div><div class="ad-progress-track"><div class="ad-progress-fill" style="width:${pr}%;background:${pr === 100 ? "var(--success)" : "var(--primary)"}"></div></div></div></div></button>`).join("")}</div>
  <div class="row-between"><h2 class="section-title">Recomendado pela Ana</h2></div>
  <div class="offer-row">${`<span class="cover lg cv-blue">${ic("cap", 24)}</span>`}<div class="grow"><b>Dashboards Profissionais no Power BI</b><span class="faint" style="font-size:13px">Alunos do curso de Excel têm 40% de desconto</span></div><div class="stack-xs" style="align-items:flex-end"><span class="price-old">${mt(3990)}</span><b style="font-size:18px">${mt(2390)}</b></div>${btn("Ver oferta", { v: "primary", go: "checkout" })}</div>
  </div></main>`;
}, "Área do aluno");
ACT.openLesson = (el) => { S.lesson = el.dataset.arg; go("aula"); };

route("aula", "public", () => {
  const ls = lessonList(), cur = ls.find((l) => l.id === S.lesson) || ls[0], idx = ls.indexOf(cur), done = S.done.has(cur.id);
  return `${stuTop()}<main class="lp-wrap" style="padding-block:20px 96px" id="vq-main" tabindex="-1"><div class="stack-sm" style="gap:16px">
  <button class="ad-btn ad-btn-ghost ad-btn-sm" data-go="aluno" style="align-self:flex-start">${ic("arrowl", 16)}<span>Os meus produtos</span></button>
  <div class="player"><div class="stack-sm" style="gap:16px">
    <div class="video"><div class="video-slide"><small>Módulo ${cur.mi + 1} · ${cur.m.t}</small><b>${cur.t}</b></div><button class="playbtn" data-act="toast" data-arg="Reprodução iniciada" aria-label="Reproduzir" style="position:relative">${ic("play", 26)}</button><div class="video-bar">${ic("play", 14)}<span>00:00</span>${meter(0)}<span>${cur.dur}</span></div></div>
    <div class="row-between"><div class="stack-xs"><span class="faint" style="font-size:13px">Aula ${idx + 1} de ${ls.length}</span><h1 style="font-size:22px;font-weight:700;letter-spacing:-0.015em">${cur.t}</h1></div>
      <div class="row" style="gap:8px">${btn(done ? "Concluída" : "Marcar como concluída", { v: done ? "soft" : "secondary", i: done ? "checkc" : "check", act: "lessonDone" })}${idx < ls.length - 1 ? btn("Próxima aula", { v: "primary", act: "openLesson", arg: ls[idx + 1].id, ir: "right" }) : ""}</div></div>
    ${tabs([["d", "Descrição"], ["m", "Materiais", 2], ["c", "Comentários", 14]], "d", "toast", "underline")}
    <p class="muted" style="max-width:68ch;line-height:22px">Nesta aula vemos ${cur.t.toLowerCase()} com uma folha de vendas real de uma loja em Maputo. Descarregue o ficheiro de exercícios nos materiais e acompanhe passo a passo.</p>
    <div class="row" style="gap:8px">${btn("exercicios-aula-" + (idx + 1) + ".xlsx", { s: "sm", i: "download", act: "toast", arg: "Ficheiro de exercícios descarregado" })}${btn("resumo.pdf", { s: "sm", i: "file", act: "toast", arg: "Resumo descarregado" })}</div>
  </div>
  <aside class="stack-sm">${card("Conteúdo do curso", `<div class="ad-progress ad-progress-sm" style="padding:0 0 4px"><div class="ad-progress-top"><span>${S.done.size} de ${ls.length} aulas</span><strong>${progress()}%</strong></div><div class="ad-progress-track"><div class="ad-progress-fill" style="width:${progress()}%;background:var(--primary)"></div></div></div>
    ${COURSE.map((m, mi) => `<div class="module"><div class="module-head">${mi + 1}. ${m.t}<small>${m.l.filter((_, li) => S.done.has(`${m.id}l${li + 1}`)).length}/${m.l.length}</small></div>${m.l.map((t, li) => { const id = `${m.id}l${li + 1}`; return `<button class="lesson ${id === cur.id ? "on" : ""}" data-act="openLesson" data-arg="${id}">${S.done.has(id) ? ic("checkc", 16, "pl-success") : ic(id === cur.id ? "play" : "video", 16)}<span>${t}</span></button>`; }).join("")}</div>`).join("")}`, { icon: "book" })}</aside>
  </div></div></main>`;
}, "Aula");
ACT.lessonDone = () => { S.done.has(S.lesson) ? S.done.delete(S.lesson) : S.done.add(S.lesson); render(); if (S.done.has(S.lesson)) toast("Aula concluída", `Progresso do curso: ${progress()}%`); };

route("aluno-compras", "public", () => {
  const rows = [["VQ-48214", "Excel do Zero ao Avançado", "22 out 2026", "applepay", 2490, "Aprovada", "29 out"], ["VQ-48214", "Ebook: 100 Fórmulas de Excel", "22 out 2026", "applepay", 190, "Aprovada", "29 out"], ["VQ-46102", "Clube Excel Pro · outubro", "14 out 2026", "emola", 790, "Aprovada", "—"], ["VQ-43988", "Clube Excel Pro · setembro", "14 set 2026", "emola", 790, "Aprovada", "—"]];
  return `${stuTop()}<main class="lp-wrap" style="padding-block:28px 96px" id="vq-main" tabindex="-1"><div class="stack">
  ${pagehead("Compras", "Recibos, faturas e pedidos de reembolso.")}
  ${card("", table([{ l: "Pedido", f: (r) => `<span class="mono">${r[0]}</span>` }, { l: "Produto", f: (r) => `<b style="font-weight:500">${r[1]}</b>` }, { l: "Data", f: (r) => r[2] }, { l: "Método", f: (r) => pm(r[3]) }, { l: "Valor", num: 1, f: (r) => mt(r[4]) }, { l: "Estado", f: (r) => st(r[5]) }, { l: "", num: 1, f: (r) => `<div class="row" style="gap:4px;justify-content:flex-end;flex-wrap:nowrap">${btn("Fatura", { s: "sm", v: "ghost", i: "download", act: "toast", arg: "Fatura " + r[0] + " descarregada" })}${r[6] !== "—" ? btn("Reembolso", { s: "sm", v: "ghost", i: "refund", act: "refundReq", arg: r[1] }) : ""}</div>` }], rows), { flush: true })}
  ${alertBox("Garantia ativa até 29 de outubro", "Pode pedir o reembolso do curso de Excel sem justificação. O valor volta para o Apple Pay usado na compra em até 5 dias úteis.", "success", "shield")}
  </div></main>`;
}, "Compras");
ACT.refundReq = (el) => openModal("refund", { p: el.dataset.arg });
MODALS.refund = ({ p }) => ({ title: "Pedir reembolso", desc: p, body: `${field("Motivo (opcional)", sel("rf-why", ["O conteúdo não era o que esperava", "Comprei por engano", "Problemas técnicos no acesso", "Outro motivo"]), { id: "rf-why" })}${field("Comentário para a Ana", area("rf-msg", { ph: "Ajude o produtor a melhorar" }), { id: "rf-msg" })}${alertBox("O acesso ao curso termina quando o reembolso for aprovado", "", "warning", "alert")}`, foot: `${btn("Cancelar", { act: "closeModal" })}${btn("Pedir reembolso", { v: "danger", act: "refundSend" })}` });
ACT.refundSend = () => { S.modal = null; renderOverlays(); toast("Pedido de reembolso enviado", "Recebe uma resposta por email em até 48 horas.", "info", "info"); };
