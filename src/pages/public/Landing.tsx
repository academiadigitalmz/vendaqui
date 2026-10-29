import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon, PayLogo } from "@/lib/icons";
import { int, mt, num } from "@/lib/format";
import { METHOD_ORDER } from "@/lib/methods";
import { useApp } from "@/lib/app-state";
import { Avatar, Badge, Btn, IconBtn, Spark, Tile } from "@/components/ui";
import { Logo } from "@/layouts/Shells";

const FEE = { percent: 4.9, fixed: 10 };
const feeOf = (v: number) => v * FEE.percent / 100 + FEE.fixed;
const HERO_SPARK = [60000, 61800, 58200, 64100, 66900, 63200, 69800, 71100, 68400, 74200, 77800, 73900, 81200, 79400, 84600, 88100, 85200, 90400, 94100, 91000, 97800, 99200, 96500, 101800, 104900, 102300, 108600, 111200, 109400, 115800];

const NOTIFS: [string, string, string, "zap" | "cash"][] = [
  ["Venda aprovada", "Excel do Zero ao Avançado · Apple Pay", "+2 367,99 MT", "zap"],
  ["Venda aprovada", "Ebook 100 Fórmulas · e-Mola", "+418,05 MT", "zap"],
  ["Saque concluído", "Para M-Pesa 84 ••• •471 · 38 s", "48 320,00 MT", "cash"],
];
const QUOTES: [string, string, string, string][] = [
  ["Antes confirmava cada pagamento por SMS e mandava o curso no WhatsApp. Hoje o aluno paga com M-Pesa e entra sozinho na área de membros.", "Ana Sitoe", "Excel com a Ana", "Placa 1 milhão"],
  ["O order bump do ebook pagou o tráfego do mês. Ativei num minuto e o ticket médio subiu logo na primeira semana.", "Nélio Cumbe", "Finanças para Jovens", "Placa 500 mil"],
  ["Tenho 40 afiliados a vender a minha mentoria. Cada um vê as suas comissões e eu deixei de fazer contas no Excel.", "Lúcia Mabote", "Mentoria Negócio Digital", "Placa 100 mil"],
];
const FAQ: [string, string][] = [
  ["Preciso de ter empresa para vender?", "Não. Pode vender como pessoa singular com BI e NUIT. Se tiver empresa, registe-a com o NUIT da empresa e a certidão comercial."],
  ["Quanto tempo demora a receber?", "Vendas por M-Pesa e e-Mola ficam disponíveis 2 dias depois da aprovação. Vendas por cartão, Apple Pay e Google Pay ficam disponíveis em 14 dias. Uma reserva de 5% fica retida 30 dias para cobrir reembolsos."],
  ["Que formas de pagamento aceitam?", "M-Pesa e e-Mola (o comprador confirma com o PIN no telemóvel), cartões Visa e Mastercard, Apple Pay e Google Pay. Com Apple Pay e Google Pay a compra fica feita com Face ID ou impressão digital, sem escrever o cartão."],
  ["Posso vender em dólares ou para fora de Moçambique?", "Sim. Ative o cartão internacional no produto e defina um preço em USD. O valor é convertido para meticais no momento do saque."],
  ["O que acontece se o cliente pedir reembolso?", "Dentro do prazo de garantia que definir (7, 15 ou 30 dias), o reembolso é automático e o valor sai do seu saldo. Fora do prazo, decide caso a caso."],
];

export default function Landing() {
  const { isDark, toggleTheme } = useApp();
  const [price, setPrice] = useState(2490);
  const [sales, setSales] = useState(120);
  const gross = price * sales, fee = sales * feeOf(price), net = gross - fee;

  return (
    <div className="lp">
      <nav className="lp-nav" aria-label="Principal"><div className="lp-wrap">
        <Logo />
        <div className="lp-links"><a href="#funcionalidades">Funcionalidades</a><a href="#pagamentos">Pagamentos</a><a href="#taxas">Taxas</a><a href="#faq">Perguntas</a></div>
        <div className="row" style={{ gap: 8 }}>
          <IconBtn icon={isDark ? "sun" : "moon"} label="Alternar tema" onClick={toggleTheme} />
          <Btn v="ghost" to="/entrar" className="lp-login">Entrar</Btn>
          <Btn v="primary" to="/criar-conta">Criar conta grátis</Btn>
        </div>
      </div></nav>

      <header className="lp-hero"><div className="lp-wrap">
        <div>
          <span className="lp-eyebrow"><b>Novo</b>Apple Pay e Google Pay no checkout</span>
          <h1 className="lp-h1">Venda os seus cursos e ebooks. <em>Receba no telemóvel.</em></h1>
          <p className="lp-lead">O VendAqui junta checkout, área de membros, afiliados e pagamentos por M-Pesa, e-Mola, cartão, Apple Pay e Google Pay numa só conta. Crie o produto, partilhe o link e comece a vender hoje.</p>
          <div className="lp-ctas"><Btn v="primary" s="lg" to="/criar-conta" iconRight="arrow">Começar a vender</Btn><Btn s="lg" to="/checkout/excel-zero-avancado" icon="eye">Ver um checkout</Btn></div>
          <div className="lp-trust"><span><Icon name="checkc" size={16} />Sem mensalidade</span><span><Icon name="checkc" size={16} />Conta aprovada em 24 h</span><span><Icon name="checkc" size={16} />Suporte em português</span></div>
        </div>
        <div className="lp-stage" aria-hidden="true">
          <div className="lp-dash">
            <div className="lp-dash-top"><div className="lp-dash-bal"><small>Saldo disponível</small><strong>{mt(48320)}</strong></div><Btn v="primary" s="sm" icon="cash" tabIndex={-1}>Sacar</Btn></div>
            <Spark data={HERO_SPARK} w={300} h={70} />
            <div className="lp-dash-mini"><div><small>Vendas hoje</small><b>37</b></div><div><small>Conversão</small><b>7,8%</b></div><div><small>Ticket médio</small><b>2 143 MT</b></div></div>
          </div>
          <div className="lp-phone"><div className="lp-phone-in"><div className="lp-phone-bar"><i /></div><div className="lp-phone-co">
            <div className="cover cv-orange">Excel do Zero ao Avançado</div>
            <div className="row-between" style={{ fontSize: 12 }}><span className="faint">Total</span><b style={{ fontSize: 16 }}>{mt(2490)}</b></div>
            <div className="lp-pm-row"><span className="on"><PayLogo method="applepay" /></span><span><PayLogo method="googlepay" /></span><span><PayLogo method="mpesa" /></span><span><PayLogo method="card" /></span></div>
            <div className="lp-phone-btn">Pagar com Apple Pay</div>
          </div></div></div>
          <div className="lp-notifs">
            {NOTIFS.map(([t, s, v, i], k) => (
              <div key={k} className="lp-notif" style={{ animationDelay: `${0.25 + k * 0.35}s` }}><span className="tile"><Icon name={i} size={16} /></span><div><b>{t}</b><small>{s}</small></div><strong>{v}</strong></div>
            ))}
          </div>
        </div>
      </div></header>

      <section className="lp-methods" id="pagamentos"><div className="lp-wrap">
        <p>Os seus clientes pagam como preferem</p>
        <div className="pm-logos">{[...METHOD_ORDER, "bank" as const].map((m) => <PayLogo key={m} method={m} />)}</div>
      </div></section>

      <section className="lp-sec" id="funcionalidades"><div className="lp-wrap">
        <div className="lp-head"><span className="lp-kicker">Tudo numa conta</span><h2 className="lp-h2">Do primeiro link de pagamento à primeira placa de 1 milhão.</h2><p className="lp-sub">Ferramentas que os grandes infoprodutores usam, pensadas para quem vende em Moçambique e recebe em meticais.</p></div>
        <div className="bento">
          <div className="bcell w4"><Tile icon="cart" /><h3>Checkout que converte no telemóvel</h3><p>Uma página, sem distrações. Apple Pay e Google Pay com um toque, ou M-Pesa e e-Mola com o PIN no telemóvel. Order bump, cronómetro e testemunhos ativam-se com um clique.</p>
            <div className="bcell-demo"><div className="bump-demo"><Icon name="gift" size={18} /><span><b>Sim, quero o Ebook 100 Fórmulas</b> por apenas 190 MT. Aparece no checkout e sobe o ticket médio em 18%.</span></div></div></div>
          <div className="bcell"><Tile icon="cap" tone="info" /><h3>Área de membros incluída</h3><p>Aulas em vídeo, materiais e certificados. Os alunos entram com o email da compra.</p>
            <div className="bcell-demo mini-lessons"><div><Icon name="checkc" size={16} className="ok" />Primeiros passos</div><div><Icon name="checkc" size={16} className="ok" />Fórmulas essenciais</div><div><Icon name="play" size={16} />Tabelas dinâmicas</div></div></div>
          <div className="bcell inv w3"><span className="ad-tile ad-tile-md" style={{ background: "var(--inv-accent-soft)", color: "var(--inv-accent)" }}><Icon name="share" size={20} /></span><h3>Programa de afiliados</h3><p>Defina a comissão, aprove afiliados e a divisão do valor acontece em cada venda. Cada um vê o seu saldo e saca sozinho.</p>
            <div className="bcell-demo">{[["Kelvin Duarte", "184 vendas", "128 400 MT"], ["Sónia Matavele", "97 vendas", "71 910 MT"], ["Pedro Uamusse", "61 vendas", "42 670 MT"]].map(([n, v, c]) => <div key={n} className="aff-row"><Avatar name={n} s="xs" /><span>{n} <span style={{ color: "var(--inv-text-3)" }}>· {v}</span></span><b>{c}</b></div>)}</div></div>
          <div className="bcell w3"><Tile icon="target" tone="success" /><h3>Recuperação de vendas</h3><p>Quem não concluiu o pagamento recebe SMS, WhatsApp e email automáticos com um link direto. Em média, 28% dos carrinhos abandonados voltam.</p>
            <div className="bcell-demo"><Spark data={[12, 14, 13, 18, 17, 22, 21, 26, 25, 29, 31, 30]} color="var(--success)" w={300} h={56} /></div></div>
          <div className="bcell"><Tile icon="repeat" tone="purple" /><h3>Assinaturas</h3><p>Clubes e comunidades com cobrança mensal. No dia da renovação o assinante confirma o pagamento no telemóvel ou no cartão guardado.</p></div>
          <div className="bcell"><Tile icon="shield" tone="teal" /><h3>Antifraude e KYC</h3><p>Regras por número, por cartão e por dispositivo. Verificação de identidade com BI e NUIT.</p></div>
          <div className="bcell"><Tile icon="plug" tone="orange" /><h3>Pixels e integrações</h3><p>Meta, TikTok e Google Ads com eventos de compra. Webhooks e API para o seu sistema.</p></div>
        </div>
      </div></section>

      <section className="lp-sec" style={{ paddingTop: 0 }}><div className="lp-wrap">
        <div className="lp-head"><span className="lp-kicker">Como funciona</span><h2 className="lp-h2">Três passos até à primeira venda.</h2></div>
        <div className="steps">
          <div className="step"><span className="step-n">Passo 1</span><h3>Crie a conta e verifique-se</h3><p>Nome, BI e NUIT. A equipa aprova em até 24 horas e pode começar a criar produtos enquanto espera.</p></div>
          <div className="step"><span className="step-n">Passo 2</span><h3>Cadastre o produto</h3><p>Curso, ebook, mentoria ou assinatura. Defina o preço, a garantia e como o cliente recebe o acesso.</p></div>
          <div className="step"><span className="step-n">Passo 3</span><h3>Partilhe o link e receba</h3><p>No Instagram, WhatsApp ou em anúncios. Cada venda cai no saldo e saca para M-Pesa, e-Mola ou para o banco.</p></div>
        </div>
      </div></section>

      <section className="lp-sec lp-dark"><div className="lp-wrap payout">
        <div><span className="lp-kicker">Saques</span><h2 className="lp-h2">O dinheiro das vendas na sua carteira, no mesmo dia.</h2><p className="lp-sub">Vendas por carteira móvel ficam disponíveis em 2 dias. Saque para M-Pesa ou e-Mola sem custo, a qualquer hora, ou para qualquer banco moçambicano.</p>
          <div className="payout-facts"><div><b>38 s</b><small>tempo médio de saque para M-Pesa</small></div><div><b>D+2</b><small>libertação de vendas por carteira móvel</small></div><div><b>0 MT</b><small>custo de saque para carteira móvel</small></div></div></div>
        <div className="payout-card"><div className="row-between"><span style={{ color: "var(--inv-text-2)", fontSize: 14 }}>Saque solicitado</span><Badge tone="success" dot>Concluído</Badge></div>
          <div className="payout-big">48 320<small>MT</small></div>
          <div><div className="payout-line"><span>Destino</span><b>M-Pesa · 84 ••• •471</b></div><div className="payout-line"><span>Custo do saque</span><b>0,00 MT</b></div><div className="payout-line"><span>Concluído em</span><b>38 segundos</b></div></div></div>
      </div></section>

      <section className="lp-sec" id="taxas"><div className="lp-wrap">
        <div className="lp-head"><span className="lp-kicker">Taxas</span><h2 className="lp-h2">Só paga quando vende.</h2><p className="lp-sub">Sem mensalidade, sem custo de adesão. Uma taxa por venda aprovada, igual para todos os métodos.</p></div>
        <div className="calc">
          <div className="calc-in">
            <div className="fee-tag"><b>{num(FEE.percent, 1)}%</b>+ {FEE.fixed} MT por venda aprovada</div>
            <div className="range"><div className="range-top"><label htmlFor="calc-price" className="ad-label">Preço do produto</label><b>{mt(price, 0)}</b></div><input type="range" id="calc-price" min={200} max={20000} step={10} value={price} onChange={(e) => setPrice(+e.target.value)} /></div>
            <div className="range"><div className="range-top"><label htmlFor="calc-sales" className="ad-label">Vendas por mês</label><b>{int(sales)}</b></div><input type="range" id="calc-sales" min={1} max={1500} step={1} value={sales} onChange={(e) => setSales(+e.target.value)} /></div>
          </div>
          <div className="calc-out">
            <span className="muted">Recebe por mês</span>
            <span className="calc-total">{mt(net, 0)}</span>
            <dl className="dl" style={{ marginTop: 8 }}><dt>Faturamento</dt><dd>{mt(gross, 0)}</dd><dt>Taxa VendAqui</dt><dd>−{mt(fee, 0)}</dd><dt>Saques para carteira móvel</dt><dd>0 MT</dd></dl>
            <div style={{ marginTop: "auto", paddingTop: 12 }}><Btn v="primary" s="lg" to="/criar-conta" block>Criar conta e começar</Btn></div>
          </div>
        </div>
      </div></section>

      <section className="lp-sec" style={{ paddingTop: 0 }}><div className="lp-wrap">
        <div className="lp-head"><span className="lp-kicker">Quem já vende</span><h2 className="lp-h2">Produtores que trocaram transferências manuais por um link.</h2></div>
        <div className="quotes">{QUOTES.map(([q, n, b, p]) => (
          <figure key={n} className="quote" style={{ margin: 0 }}><span className="stars">{[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={15} />)}</span><p>{q}</p><figcaption className="quote-by"><Avatar name={n} s="md" /><div><b>{n}</b><small>{b}</small></div><span className="plaque">{p}</span></figcaption></figure>
        ))}</div>
      </div></section>

      <section className="lp-sec" id="faq" style={{ paddingTop: 0 }}><div className="lp-wrap" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 40 }}>
        <div className="lp-head"><span className="lp-kicker">Perguntas</span><h2 className="lp-h2">Perguntas frequentes</h2><p className="lp-sub">Não encontrou a resposta? Fale com a equipa pelo chat dentro da conta.</p></div>
        <div className="faq">{FAQ.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}<Icon name="plus" size={18} /></summary><p>{a}</p></details>)}</div>
      </div></section>

      <section style={{ paddingBottom: 72 }}><div className="lp-wrap"><div className="lp-cta"><div><h2>Crie o seu primeiro produto em 10 minutos.</h2><p>Conta grátis. Só paga quando vende.</p></div><Btn v="inverse" s="lg" to="/criar-conta" iconRight="arrow">Criar conta grátis</Btn></div></div></section>
      <footer className="lp-foot"><div className="lp-wrap">
        <div className="stack-sm"><Logo /><p style={{ maxWidth: "30ch" }}>Plataforma de pagamentos para infoprodutores. Maputo, Moçambique.</p></div>
        <div><h4>Produto</h4><ul><li><a href="#funcionalidades">Funcionalidades</a></li><li><a href="#taxas">Taxas</a></li><li><Link to="/checkout/excel-zero-avancado">Exemplo de checkout</Link></li></ul></div>
        <div><h4>Para quem</h4><ul><li><Link to="/criar-conta">Produtores</Link></li><li><Link to="/produtor/afiliados?tab=mercado">Afiliados</Link></li><li><Link to="/aluno">Alunos</Link></li></ul></div>
        <div><h4>Empresa</h4><ul><li><a href="#faq">Ajuda</a></li><li><a href="#faq">Termos de uso</a></li><li><a href="#faq">Privacidade</a></li></ul></div>
      </div></footer>
    </div>
  );
}
