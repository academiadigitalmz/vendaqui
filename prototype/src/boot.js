
/* ══════════ Arranque ══════════ */
const IN = {
  "calc-price": (el) => { CALC.price = +el.value; calcUpdate(); },
  "calc-sales": (el) => { CALC.sales = +el.value; calcUpdate(); },
  "co-phone": (el) => coPhone(el, "co-wallet"),
  "co-wallet": (el) => coPhone(el, "co-phone"),
  "co-coupon": (el) => { S.checkout.coupon = el.value; },
  "co-cta": (el) => { S.co.cta = el.value || "Comprar agora"; coSave(); },
  "sf-q": (el) => { S.salesFilter.q = el.value; rerenderKeep(el.id); },
  "aff-c": (el) => { const p = prodById(S.prodId), v = +el.value; $("#aff-c-v").textContent = v + "%"; $("#aff-c-h").textContent = `Afiliado recebe ${mt(p.price * v / 100)} por venda; fica com ${mt(p.price * (1 - v / 100) - feeOf(p.price))}.`; },
};
const CHANGE = {
  "co-bump": (el) => { S.checkout.bump = el.checked; render(); },
  "sf-s": (el) => { S.salesFilter.s = el.value; render(); },
  "sf-m": (el) => { S.salesFilter.m = el.value; render(); },
  "sf-p": (el) => { S.salesFilter.p = el.value; render(); },
  "wz-rec": (el) => { S.wizard.recurring = el.value; },
};
function coPhone(el, other) {
  S.checkout.phone = el.value;
  const o = $("#" + other); if (o) o.value = el.value;
  const hint = $("#co-op"), m = S.checkout.method;
  if (hint && METHODS[m].pre.length) hint.innerHTML = opHint(el.value, m);
}
function rerenderKeep(id) {
  const pos = $("#" + id).selectionStart; render();
  const el = $("#" + id); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) {} }
}
document.addEventListener("input", (e) => { const f = IN[e.target.id]; if (f) f(e.target); });
document.addEventListener("change", (e) => { const f = CHANGE[e.target.id]; if (f) f(e.target); });
document.addEventListener("submit", (e) => e.preventDefault());
try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (!S.theme) render(); }); } catch (e) {}

applyTheme();
const start = (location.hash || "").slice(1);
S.route = ROUTES[start] ? start : "inicio";
render();
// simula vendas a chegar enquanto o produtor está no painel
setTimeout(function tick() { if (ROUTES[S.route].layout === "seller" && !S.modal && !S.drawer && document.visibilityState === "visible") saleToast(); setTimeout(tick, 45000); }, 7000);
