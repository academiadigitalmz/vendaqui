import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon, PayLogo } from "@/lib/icons";
import { int, mt, num } from "@/lib/format";
import { METHOD_ORDER } from "@/lib/methods";
import { useApp } from "@/lib/app-state";
import { Avatar, Badge, Btn, IconBtn, Spark, Tile } from "@/components/ui";
import { Logo } from "@/layouts/Shells";

const FEE = { percent: 10, fixed: 0 };
const feeOf = (v: number) => v * FEE.percent / 100 + FEE.fixed;
const HERO_SPARK = [60000, 61800, 58200, 64100, 66900, 63200, 69800, 71100, 68400, 74200, 77800, 73900, 81200, 79400, 84600, 88100, 85200, 90400, 94100, 91000, 97800, 99200, 96500, 101800, 104900, 102300, 108600, 111200, 109400, 115800];

const NOTIFS: [string, string, string, "zap" | "cash"][] = [
  ["Venda aprovada", "Excel do Zero ao Avançado · M-Pesa", "+2 241,00 MT", "zap"],
  ["Venda aprovada", "Ebook 100 Fórmulas · e-Mola", "+418,05 MT", "zap"],
  ["Saque submetido", "Para M-Pesa 84 ••• •471", "48 320,00 MT", "cash"],
];
const QUOTES: [string, string, string, string][] = [
  ["Crie o produto, defina o preço e envie o conteúdo num único fluxo.", "Criação simples", "Tudo o que precisa para começar", "Produto"],
  ["Partilhe uma página de compra preparada para pagamentos pelo telemóvel.", "Compra simples", "M-Pesa e e-Mola", "Checkout"],
  ["O comprador encontra o conteúdo na sua conta depois do pagamento.", "Entrega organizada", "Conteúdo num só lugar", "Acesso"],
];
const FAQ: [string, string][] = [
  ["Preciso de ter empresa para vender?", "Não. O produtor pode iniciar o processo como pessoa singular; empresas submetem também os respectivos documentos comerciais."],
  ["Quando recebo o valor de uma venda?", "O saldo acompanha o ciclo real do pagamento e da liquidação. Valores pendentes não são apresentados como disponíveis."],
  ["Que formas de pagamento estão disponíveis?", "O checkout suporta os métodos de carteira móvel activados pela equipa VendAqui, actualmente M-Pesa e e-Mola."],
  ["Em que moeda são apresentados os preços?", "Os preços e valores comunicados ao utilizador são apresentados em meticais."],
  ["Quando o comprador recebe o conteúdo?", "O acesso é concedido apenas depois da confirmação do pagamento."],
];

export default function Landing() {
  const { isDark, toggleTheme, session } = useApp();
  const sellerEntry = session
    ? session.user.role === "seller" ? "/produtor" : "/produtor/configurar"
    : "/criar-conta?next=/produtor/configurar";
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
          {session ? <Btn v="ghost" to="/aluno" className="lp-login">As minhas compras</Btn> : <Btn v="ghost" to="/entrar" className="lp-login">Entrar</Btn>}
          <Btn v="primary" to={sellerEntry}>{session?.user.role === "seller" ? "Área do produtor" : "Começar a vender"}</Btn>
        </div>
      </div></nav>

      <header className="lp-hero"><div className="lp-wrap">
        <div>
          <span className="lp-eyebrow"><b>VendAqui</b>Comércio digital em Moçambique</span>
          <h1 className="lp-h1">Venda os seus cursos e ebooks. <em>Receba no telemóvel.</em></h1>
          <p className="lp-lead">O VendAqui junta checkout, conteúdo protegido e pagamentos por M-Pesa e e-Mola. Crie o produto, envie o conteúdo, submeta para revisão e partilhe o link quando estiver aprovado.</p>
          <div className="lp-ctas"><Btn v="primary" s="lg" to={sellerEntry} iconRight="arrow">{session?.user.role === "seller" ? "Área do produtor" : "Começar a vender"}</Btn><Btn s="lg" to={session ? "/aluno" : "/entrar"}>{session ? "As minhas compras" : "Já tenho conta"}</Btn></div>
          <div className="lp-trust"><span><Icon name="checkc" size={16} />Checkout público</span><span><Icon name="checkc" size={16} />Conteúdo organizado</span><span><Icon name="checkc" size={16} />Pagamentos pelo telemóvel</span></div>
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
            <div className="lp-pm-row"><span className="on"><PayLogo method="mpesa" /></span><span><PayLogo method="emola" /></span></div>
            <div className="lp-phone-btn">Pagar com M-Pesa</div>
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
        <div className="pm-logos">{METHOD_ORDER.map((m) => <PayLogo key={m} method={m} />)}</div>
      </div></section>

      <section className="lp-sec" id="funcionalidades"><div className="lp-wrap">
        <div className="lp-head"><span className="lp-kicker">Tudo numa conta</span><h2 className="lp-h2">Do produto ao acesso do comprador.</h2><p className="lp-sub">Crie, venda e entregue conteúdo digital em Moçambique sem depender de tarefas manuais.</p></div>
        <div className="bento">
          <div className="bcell w4"><Tile icon="cart" /><h3>Checkout preparado para o telemóvel</h3><p>Uma página simples para pagar por M-Pesa ou e-Mola, com compra autenticada ou como convidado.</p>
            <div className="bcell-demo"><div className="bump-demo"><Icon name="shield" size={18} /><span><b>Pagamento confirmado antes da entrega.</b> O acesso aparece automaticamente na conta do comprador.</span></div></div></div>
          <div className="bcell"><Tile icon="cap" tone="info" /><h3>Biblioteca do comprador</h3><p>Ebooks e aulas ficam disponíveis na conta do comprador depois do pagamento.</p>
            <div className="bcell-demo mini-lessons"><div><Icon name="checkc" size={16} className="ok" />Primeiros passos</div><div><Icon name="checkc" size={16} className="ok" />Fórmulas essenciais</div><div><Icon name="play" size={16} />Tabelas dinâmicas</div></div></div>
          <div className="bcell inv w3"><span className="ad-tile ad-tile-md" style={{ background: "var(--inv-accent-soft)", color: "var(--inv-accent)" }}><Icon name="share" size={20} /></span><h3>Conteúdo num só lugar</h3><p>Adicione a capa e o conteúdo do produto e acompanhe o que já está pronto para publicação.</p>
            <div className="bcell-demo">{[["Ebook", "ficheiro pronto", "Associado"], ["Capa", "imagem pronta", "Associada"], ["Produto", "conteúdo válido", "Revisão"]].map(([n, v, c]) => <div key={n} className="aff-row"><Avatar name={n} s="xs" /><span>{n} <span style={{ color: "var(--inv-text-3)" }}>· {v}</span></span><b>{c}</b></div>)}</div></div>
          <div className="bcell w3"><Tile icon="target" tone="success" /><h3>Revisão antes da publicação</h3><p>O ebook só pode ser submetido quando tem conteúdo pronto. A equipa analisa antes de permitir novas compras.</p>
            <div className="bcell-demo mini-lessons"><div><Icon name="checkc" size={16} className="ok" />Conteúdo pronto</div><div><Icon name="checkc" size={16} className="ok" />Preço definido</div><div><Icon name="shield" size={16} />Revisão da equipa</div></div></div>
          <div className="bcell"><Tile icon="repeat" tone="purple" /><h3>Acompanhamento do pagamento</h3><p>O comprador acompanha a confirmação e sabe quando o conteúdo está disponível.</p></div>
          <div className="bcell"><Tile icon="shield" tone="teal" /><h3>Verificação do produtor</h3><p>Envie os documentos necessários e acompanhe a análise do perfil comercial.</p></div>
          <div className="bcell"><Tile icon="plug" tone="orange" /><h3>Histórico de vendas</h3><p>Consulte as encomendas, os pagamentos e os valores recebidos num só lugar.</p></div>
        </div>
      </div></section>

      <section className="lp-sec" style={{ paddingTop: 0 }}><div className="lp-wrap">
        <div className="lp-head"><span className="lp-kicker">Como funciona</span><h2 className="lp-h2">Três passos até à primeira venda.</h2></div>
        <div className="steps">
          <div className="step"><span className="step-n">Passo 1</span><h3>Crie a conta e o perfil</h3><p>A conta pessoal também pode comprar. O perfil comercial separado permite vender depois da verificação.</p></div>
          <div className="step"><span className="step-n">Passo 2</span><h3>Cadastre o ebook</h3><p>Defina os dados e o preço, envie o conteúdo e submeta o produto para análise.</p></div>
          <div className="step"><span className="step-n">Passo 3</span><h3>Partilhe o checkout</h3><p>Depois da aprovação, o comprador paga por M-Pesa ou e-Mola e recebe o acesso quando o pagamento for confirmado.</p></div>
        </div>
      </div></section>

      <section className="lp-sec lp-dark"><div className="lp-wrap payout">
        <div><span className="lp-kicker">Saques</span><h2 className="lp-h2">Peça o saque e acompanhe o estado.</h2><p className="lp-sub">Escolha a sua conta de recebimento, indique o valor e consulte o andamento do pedido.</p>
          <div className="payout-facts"><div><b>M-Pesa</b><small>conta de recebimento</small></div><div><b>Visível</b><small>estado do pedido</small></div><div><b>Simples</b><small>histórico de saques</small></div></div></div>
        <div className="payout-card"><div className="row-between"><span style={{ color: "var(--inv-text-2)", fontSize: 14 }}>Saque solicitado</span><Badge tone="warning" dot>Em análise</Badge></div>
          <div className="payout-big">48 320<small>MT</small></div>
          <div><div className="payout-line"><span>Destino</span><b>M-Pesa · 84 ••• •471</b></div><div className="payout-line"><span>Pedido</span><b>Em análise</b></div><div className="payout-line"><span>Estado</span><b>Aguarda aprovação</b></div></div></div>
      </div></section>

      <section className="lp-sec" id="taxas"><div className="lp-wrap">
        <div className="lp-head"><span className="lp-kicker">Simulação</span><h2 className="lp-h2">Perceba quanto pode receber.</h2><p className="lp-sub">Este exemplo usa uma comissão de 10%. Consulte as condições da sua conta para conhecer a comissão aplicável.</p></div>
        <div className="calc">
          <div className="calc-in">
            <div className="fee-tag"><b>{num(FEE.percent, 1)}%</b>+ {FEE.fixed} MT por venda aprovada</div>
            <div className="range"><div className="range-top"><label htmlFor="calc-price" className="ad-label">Preço do produto</label><b>{mt(price, 0)}</b></div><input type="range" id="calc-price" min={200} max={20000} step={10} value={price} onChange={(e) => setPrice(+e.target.value)} /></div>
            <div className="range"><div className="range-top"><label htmlFor="calc-sales" className="ad-label">Vendas por mês</label><b>{int(sales)}</b></div><input type="range" id="calc-sales" min={1} max={1500} step={1} value={sales} onChange={(e) => setSales(+e.target.value)} /></div>
          </div>
          <div className="calc-out">
            <span className="muted">Recebe por mês</span>
            <span className="calc-total">{mt(net, 0)}</span>
            <dl className="dl" style={{ marginTop: 8 }}><dt>Faturamento</dt><dd>{mt(gross, 0)}</dd><dt>Comissão ilustrativa</dt><dd>−{mt(fee, 0)}</dd><dt>Valor líquido estimado</dt><dd>{mt(net, 0)}</dd></dl>
            <div style={{ marginTop: "auto", paddingTop: 12 }}><Btn v="primary" s="lg" to={sellerEntry} block>Começar a vender</Btn></div>
          </div>
        </div>
      </div></section>

      <section className="lp-sec" style={{ paddingTop: 0 }}><div className="lp-wrap">
        <div className="lp-head"><span className="lp-kicker">Feito para simplificar</span><h2 className="lp-h2">Menos tarefas entre o produto e a venda.</h2></div>
        <div className="quotes">{QUOTES.map(([q, n, b, p]) => (
          <figure key={n} className="quote" style={{ margin: 0 }}><span className="stars">{[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={15} />)}</span><p>{q}</p><figcaption className="quote-by"><Avatar name={n} s="md" /><div><b>{n}</b><small>{b}</small></div><span className="plaque">{p}</span></figcaption></figure>
        ))}</div>
      </div></section>

      <section className="lp-sec" id="faq" style={{ paddingTop: 0 }}><div className="lp-wrap" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 40 }}>
        <div className="lp-head"><span className="lp-kicker">Perguntas</span><h2 className="lp-h2">Perguntas frequentes</h2><p className="lp-sub">Não encontrou a resposta? Fale com a equipa pelo chat dentro da conta.</p></div>
        <div className="faq">{FAQ.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}<Icon name="plus" size={18} /></summary><p>{a}</p></details>)}</div>
      </div></section>

      <section style={{ paddingBottom: 72 }}><div className="lp-wrap"><div className="lp-cta"><div><h2>Crie a sua conta e prepare o primeiro ebook.</h2><p>Um fluxo simples, seguro e preparado para revisão.</p></div><Btn v="inverse" s="lg" to={sellerEntry} iconRight="arrow">Começar a vender</Btn></div></div></section>
      <footer className="lp-foot"><div className="lp-wrap">
        <div className="stack-sm"><Logo /><p style={{ maxWidth: "30ch" }}>Plataforma de pagamentos para infoprodutores. Maputo, Moçambique.</p></div>
        <div><h4>Produto</h4><ul><li><a href="#funcionalidades">Funcionalidades</a></li><li><a href="#taxas">Simulação</a></li><li><Link to="/entrar">Entrar</Link></li></ul></div>
        <div><h4>Para quem</h4><ul><li><Link to={sellerEntry}>Produtores</Link></li><li><Link to="/aluno">Compradores</Link></li><li><Link to="/admin/entrar">Equipa</Link></li></ul></div>
        <div><h4>Empresa</h4><ul><li><a href="#faq">Ajuda</a></li><li><a href="#faq">Termos de uso</a></li><li><a href="#faq">Privacidade</a></li></ul></div>
      </div></footer>
    </div>
  );
}
