const fs = require("fs");
const html = fs.readFileSync(process.argv[2], "utf8");
const js = html.split("\n<script>\n")[1].split("\n</script>")[0];
const el = () => ({ innerHTML: "", textContent: "", value: "", style: {}, classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, removeAttribute() {}, appendChild() {}, addEventListener() {}, focus() {}, dataset: {} });
const els = {};
global.document = { querySelector: (s) => (els[s] = els[s] || el()), querySelectorAll: () => [], addEventListener() {}, documentElement: el(), createElement: el, visibilityState: "hidden", activeElement: { tagName: "BODY" } };
global.window = { scrollTo() {} }; global.location = { hash: "" }; global.history = { replaceState() {} };
global.matchMedia = () => ({ matches: false, addEventListener() {} });
global.navigator = {};
global.setInterval = () => 0; const st = setTimeout; global.setTimeout = (f, t) => 0;
const run = new Function(js + `
let errs = 0;
for (const r of Object.keys(ROUTES)) { try { S.route = r; render(); const n = document.querySelector("#app").innerHTML.length; const h = document.querySelector("#app").innerHTML; const bad = ["undefined","NaN","[object"].filter(w => h.includes(w)).map(w => h.slice(Math.max(0,h.indexOf(w)-60), h.indexOf(w)+20)); console.log("ok", r.padEnd(18), n, bad.slice(0,2).join(" ## ")); } catch (e) { errs++; console.log("FAIL", r, e.stack.split("\\n").slice(0,3).join(" | ")); } }
for (const m of Object.keys(MODALS)) { try { S.modal = { type: m, data: m==="confirmRefund"? {id: SALES[0].id} : m==="dispute"? {id:"DS-311"}: m==="withdraw"?{dest:"bank"}: m==="paywait"? {step:1}: {} }; renderOverlays(); console.log("ok modal", m); } catch (e) { errs++; console.log("FAIL modal", m, e.message); } }
S.modal = null;
for (const d of Object.keys(DRAWERS)) { try { S.drawer = { type: d, data: { id: d === "seller" ? SELLERS[6].id : SALES[2].id } }; renderOverlays(); console.log("ok drawer", d); } catch (e) { errs++; console.log("FAIL drawer", d, e.message); } }
// variações
try { S.drawer=null; S.route="painel"; for (const p of ["hoje","7d","12m"]) { S.period=p; render(); } for (const t of ["ofertas","checkout","upsell","afiliacao"]) { S.prodTab=t; S.route="produto"; render(); } for (const s of [1,2,3,4]) { S.wizard.step=s; S.route="produto-novo"; render(); } for (const s of [1,2,3]) { S.onboard.step=s; S.route="comecar"; render(); } for (const t of ["verificacao","notificacoes","seguranca","equipa"]) { S.accTab=t; S.route="conta"; render(); } for (const t of ["pedidos","mercado"]) { S.affTab=t; S.route="afiliados"; render(); } S.checkout.method="card"; S.route="checkout"; render(); S.checkout.method="googlepay"; render(); S.modal={type:"paywait",data:{step:1}}; renderOverlays(); S.modal=null; S.checkout.phone="84 111 2222"; S.checkout.method="emola"; S.checkout.bump=true; S.checkout.couponOk=true; render(); S.kycSel=4; S.route="admin-kyc"; render(); S.payoutSel.add("SQ-9934"); S.route="admin-saques"; render(); S.salesFilter.q="zzz"; S.route="vendas"; render(); console.log("ok variants"); } catch(e) { errs++; console.log("FAIL variants", e.stack.split("\\n").slice(0,3).join(" | ")); }
console.log("errors:", errs);
`);
run();
