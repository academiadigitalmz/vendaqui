/* ══════════ VendAqui · núcleo ══════════ */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function num(n, d = 2) {
  const p = Math.abs(n).toFixed(d).split(".");
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (n < 0 ? "−" : "") + p.join(",");
}
const mt = (n, d = 2) => num(n, d) + " MT";
const pct = (n, d = 1) => num(n, d) + "%";
const int = (n) => num(n, 0);
const store = {
  get(k, d) { try { const v = localStorage.getItem("vq." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("vq." + k, JSON.stringify(v)); } catch (e) {} },
};

/* ícones — traço 1.8, estilo do DS */
const IC = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  dash: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  usercheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  card: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  phone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  cap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  sliders: '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  arrowl: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  upright: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  trendup: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  trenddown: '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  shieldalert: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  checkc: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  xc: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
  bars: '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
  bank: '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  key: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  refund: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  idcard: '<path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  route: '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  grip: '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',
  edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  percent: '<line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  cash: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
};
const ic = (n, s = 18, cls = "") => `<svg class="ad-icon ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ""}</svg>`;
const MARK = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 6.5 10 18l3.2-6.6"/><path d="M14.6 8.6 17 6.2l2.5 2.4"/><path d="M17 6.2V13"/></svg>`;
const logo = (sub = "", go = "inicio") => `<button class="vq-logo" data-go="${go}" aria-label="VendAqui — início"><span class="vq-mark">${MARK(18)}</span><span class="vq-brandtext"><span class="vq-brandname">Vend<b>Aqui</b></span>${sub ? `<span class="vq-brandsub">${sub}</span>` : ""}</span></button>`;

/* componentes do DS */
const btn = (label, o = {}) => `<button class="ad-btn ad-btn-${o.v || "secondary"} ad-btn-${o.s || "md"} ${o.cls || ""}" ${o.go ? `data-go="${o.go}"` : ""} ${o.act ? `data-act="${o.act}"` : ""} ${o.arg != null ? `data-arg="${esc(o.arg)}"` : ""} ${o.attrs || ""}>${o.i ? ic(o.i, o.s === "sm" ? 16 : 18) : ""}${label ? `<span>${label}</span>` : ""}${o.ir ? ic(o.ir, 16) : ""}</button>`;
const ibtn = (i, label, o = {}) => `<button class="ad-iconbtn ad-iconbtn-${o.s || "md"} ad-btn-${o.v || "ghost"} ${o.cls || ""}" aria-label="${label}" title="${label}" ${o.act ? `data-act="${o.act}"` : ""} ${o.go ? `data-go="${o.go}"` : ""} ${o.arg != null ? `data-arg="${esc(o.arg)}"` : ""}>${ic(i, o.s === "sm" ? 16 : 18)}${o.badge ? `<span class="ad-count ad-iconbtn-badge">${o.badge}</span>` : ""}</button>`;
const badge = (t, tone = "neutral", o = {}) => `<span class="ad-badge ad-badge-${o.v || "soft"} ad-badge-${o.s || "sm"} ad-tone-${tone}">${o.dot ? '<span class="ad-badge-dot"></span>' : ""}${t}</span>`;
const tile = (i, tone = "primary", sz = "md", v = "soft") => `<span class="ad-tile ad-tile-${v} ad-tile-${sz} ad-tone-${tone}">${ic(i, sz === "sm" ? 16 : 20)}</span>`;
const avatar = (name, sz = "sm") => `<span class="ad-avatar ad-avatar-${sz}">${initials(name)}</span>`;
const initials = (n) => n.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const field = (label, input, o = {}) => `<div class="ad-field ${o.cls || ""}">${label ? `<div class="ad-field-top"><label class="ad-label" for="${o.id || ""}">${label}${o.req ? ' <span class="ad-req">*</span>' : ""}</label>${o.aside || ""}</div>` : ""}${input}${o.help ? `<span class="ad-helper">${o.help}</span>` : ""}</div>`;
const inp = (id, o = {}) => `<div class="ad-input ad-input-${o.s || "md"}">${o.icon ? `<span class="ad-input-icon">${ic(o.icon, 16)}</span>` : ""}${o.prefix ? `<span class="co-prefix">${o.prefix}</span>` : ""}<input id="${id}" type="${o.type || "text"}" value="${esc(o.value ?? "")}" placeholder="${esc(o.ph || "")}" ${o.attrs || ""}>${o.suffix ? `<span class="faint" style="font-size:13px">${o.suffix}</span>` : ""}</div>`;
const sel = (id, opts, o = {}) => `<div class="ad-input ad-input-${o.s || "md"} ad-select">${o.icon ? `<span class="ad-input-icon">${ic(o.icon, 16)}</span>` : ""}<select id="${id}" ${o.attrs || ""}>${opts.map((x) => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}" ${o.value === v ? "selected" : ""}>${l}</option>`; }).join("")}</select><span class="ad-select-chevron">${ic("down", 16)}</span></div>`;
const area = (id, o = {}) => `<div class="ad-input ad-textarea"><textarea id="${id}" rows="${o.rows || 3}" placeholder="${esc(o.ph || "")}">${esc(o.value || "")}</textarea></div>`;
const sw = (on, act, arg = "", label = "") => `<button class="ad-switch-track" role="switch" aria-checked="${on}" aria-label="${esc(label)}" data-act="${act}" data-arg="${esc(arg)}"><span class="ad-switch-thumb"></span></button>`;
const tabs = (items, cur, act, kind = "underline") => `<div class="ad-tabs ad-tabs-${kind}" role="tablist">${items.map(([k, l, c]) => `<button class="ad-tab ${k === cur ? "is-active" : ""}" role="tab" aria-selected="${k === cur}" data-act="${act}" data-arg="${k}">${l}${c != null ? `<span class="ad-tab-count">${c}</span>` : ""}</button>`).join("")}</div>`;
const card = (title, body, o = {}) => `<section class="ad-card ${o.cls || ""}">${title ? `<header class="ad-card-head"><div class="ad-card-title">${o.icon ? tile(o.icon, o.tone || "primary", "sm") : ""}<h3>${title}</h3></div>${o.aside || ""}</header>` : ""}<div class="ad-card-body ${o.flush ? "" : "is-padded"}">${body}</div>${o.foot ? `<footer class="ad-card-foot">${o.foot}</footer>` : ""}</section>`;
const pagehead = (title, desc, actions = "", over = "") => `<div class="ad-pagehead"><div>${over ? `<div class="ad-overline">${over}</div>` : ""}<h1 class="ad-pagehead-title">${title}</h1>${desc ? `<p class="ad-pagehead-desc">${desc}</p>` : ""}</div>${actions ? `<div class="ad-pagehead-actions">${actions}</div>` : ""}</div>`;
const kpi = (label, value, o = {}) => `<div class="kpi"><div class="kpi-top">${tile(o.icon || "bars", o.tone || "primary", "sm")}${o.delta != null ? `<span class="delta ${o.delta >= 0 ? "up" : "down"}">${ic(o.delta >= 0 ? "trendup" : "trenddown", 13)}${pct(Math.abs(o.delta))}</span>` : o.aside || ""}</div><span class="kpi-label">${label}</span><span class="kpi-value">${value}</span>${o.hint ? `<span class="kpi-hint">${o.hint}</span>` : ""}${o.spark ? spark(o.spark, o.sc) : ""}</div>`;
const meter = (v, c = "var(--primary)") => `<span class="meter" style="--mc:${c}"><i style="width:${Math.max(2, Math.min(100, v))}%"></i></span>`;
const alertBox = (title, text, tone = "info", icon = "info", action = "") => `<div class="ad-alert ad-tone-${tone}" role="status"><span class="ad-alert-icon">${ic(icon, 20)}</span><div class="ad-alert-body"><span class="ad-alert-title">${title}</span>${text ? `<span class="ad-alert-text">${text}</span>` : ""}${action ? `<div class="ad-alert-action">${action}</div>` : ""}</div></div>`;
const empty = (icon, title, desc, action = "") => `<div class="ad-empty"><span class="ad-empty-icon">${ic(icon, 22)}</span><span class="ad-empty-title">${title}</span><span class="ad-empty-desc">${desc}</span>${action ? `<div class="ad-empty-action">${action}</div>` : ""}</div>`;
const pager = (total, per = 10) => `<div class="tbl-foot"><span>A mostrar 1–${Math.min(per, total)} de ${int(total)}</span><nav class="ad-pagination" aria-label="Paginação"><button class="ad-page" aria-label="Anterior">${ic("left", 16)}</button><button class="ad-page is-active">1</button><button class="ad-page">2</button><button class="ad-page">3</button><span class="ad-page-gap">…</span><button class="ad-page">${Math.max(4, Math.ceil(total / per))}</button><button class="ad-page" aria-label="Seguinte">${ic("right", 16)}</button></nav></div>`;
/* tabela: as colunas viram rótulos no telemóvel */
function table(cols, rows, o = {}) {
  const head = cols.map((c) => `<th class="${c.num ? "num" : ""}">${c.l}</th>`).join("");
  const body = rows.map((r, i) => `<tr class="${o.click ? "click" : ""}" ${o.click ? `data-act="${o.click}" data-arg="${esc(o.key ? o.key(r, i) : i)}"` : ""}>${cols.map((c) => `<td class="${c.num ? "num" : ""}" data-label="${esc(c.l.replace(/<[^>]+>/g, ""))}">${c.f(r, i)}</td>`).join("")}</tr>`).join("");
  return `<div class="ad-table-wrap"><table class="ad-table ${o.dense ? "is-dense" : ""} ${o.cls || ""}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>${o.pager ? pager(o.pager) : ""}`;
}
const cellUser = (name, sub, av = true) => `<div class="cell-user">${av ? avatar(name) : ""}<div><b>${esc(name)}</b>${sub ? `<small>${sub}</small>` : ""}</div></div>`;

/* dados determinísticos */
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const NAMES = ["Celso Matsinhe", "Lurdes Nhantumbo", "Dércio Langa", "Yolanda Muianga", "Edson Tembe", "Fátima Bila", "Hélder Chongo", "Sheila Mabunda", "Ivo Massingue", "Telma Zandamela", "Arlindo Cossa", "Neusa Manhique", "Jorge Mucavele", "Cátia Macamo", "Rui Nhaca", "Benedita Guambe", "Osvaldo Sitoe", "Albertina Chauque", "Marcelino Tivane", "Graça Muchanga", "Abel Novela", "Rosita Mavie"];
const CITIES = ["Maputo", "Matola", "Beira", "Nampula", "Quelimane", "Tete", "Chimoio", "Pemba", "Inhambane", "Xai-Xai", "Lichinga"];
const METHODS = {
  applepay: { l: "Apple Pay", short: "", pre: [], fee: "Face ID ou Touch ID", icon: "phone" },
  googlepay: { l: "Google Pay", short: "", pre: [], fee: "Android · Chrome", icon: "wallet" },
  mpesa: { l: "M-Pesa", short: "M", pre: ["84", "85"], fee: "Vodacom" },
  emola: { l: "e-Mola", short: "e", pre: ["86", "87"], fee: "Movitel" },
  card: { l: "Cartão", short: "", pre: [], fee: "Crédito ou débito", icon: "card" },
};
const pm = (k) => `<span class="pm pm-${k}"><i></i>${METHODS[k] ? METHODS[k].l : k}</span>`;
const phoneFor = (k) => `+258 ${pick(METHODS[k].pre.length ? METHODS[k].pre : ["84"])} ${100 + Math.floor(rnd() * 899)} ${1000 + Math.floor(rnd() * 8999)}`;
const mask = (p) => p.replace(/(\+258 \d\d) \d{3} (\d)\d{3}/, "$1 ••• •$2");
const emailOf = (n) => n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(" ", ".") + "@gmail.com";

const FEE = { pct: 4.9, fixed: 10 };
const feeOf = (v) => +(v * FEE.pct / 100 + FEE.fixed).toFixed(2);
const PRODUCTS = [
  { id: "p1", name: "Excel do Zero ao Avançado", type: "Curso online", icon: "cap", price: 2490, sales: 1284, rev: 2891400, status: "Ativo", cv: "orange", conv: 7.8, students: 1290, slug: "excel-zero-avancado" },
  { id: "p2", name: "Dashboards Profissionais no Power BI", type: "Curso online", icon: "cap", price: 3990, sales: 412, rev: 1498200, status: "Ativo", cv: "blue", conv: 5.1, students: 415, slug: "power-bi-dashboards" },
  { id: "p3", name: "Ebook: 100 Fórmulas de Excel", type: "Ebook", icon: "book", price: 450, sales: 2106, rev: 884520, status: "Ativo", cv: "green", conv: 11.4, students: 2106, slug: "ebook-100-formulas" },
  { id: "p4", name: "Clube Excel Pro", type: "Assinatura", icon: "repeat", price: 790, sales: 318, rev: 251220, status: "Ativo", cv: "purple", conv: 4.2, students: 318, slug: "clube-excel-pro", recurring: true },
  { id: "p5", name: "Mentoria Carreira em Dados", type: "Mentoria", icon: "users", price: 15000, sales: 23, rev: 345000, status: "Em análise", cv: "teal", conv: 1.9, students: 23, slug: "mentoria-dados" },
  { id: "p6", name: "Templates de Gestão Financeira", type: "Pack de ficheiros", icon: "file", price: 990, sales: 0, rev: 0, status: "Rascunho", cv: "red", conv: 0, students: 0, slug: "templates-financas" },
];
const prodById = (id) => PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];
const STATUS = {
  Aprovada: "success", Pendente: "warning", Recusada: "danger", Reembolsada: "neutral", Chargeback: "danger", Expirada: "neutral",
  Ativo: "success", "Em análise": "warning", Rascunho: "neutral", Suspenso: "danger", Ativa: "success", "Em atraso": "warning", Cancelada: "neutral",
  Pago: "success", "Em processamento": "info", Falhou: "danger", Aprovado: "success", Rejeitado: "danger", Pendentes: "warning", Verificado: "success", "Em revisão": "warning", Bloqueado: "danger", Aberta: "warning", Resolvida: "success", "Perdida": "danger",
};
const st = (s) => badge(s, STATUS[s] || "neutral", { dot: true });

function genSales(n) {
  seed = 42;
  const out = [];
  const weights = ["mpesa", "mpesa", "mpesa", "mpesa", "emola", "emola", "applepay", "googlepay", "card", "card"];
  const stw = ["Aprovada", "Aprovada", "Aprovada", "Aprovada", "Aprovada", "Aprovada", "Aprovada", "Pendente", "Recusada", "Reembolsada", "Expirada"];
  let t = new Date(2026, 9, 22, 9, 41).getTime();
  for (let i = 0; i < n; i++) {
    const p = PRODUCTS[Math.floor(rnd() * 4.6)];
    const m = pick(weights);
    const name = pick(NAMES);
    const s = i === 2 ? "Pendente" : pick(stw);
    const bump = rnd() < 0.28 && p.id === "p1";
    const val = p.price + (bump ? 190 : 0);
    const aff = rnd() < 0.3 ? pick(["Kelvin Duarte", "Sónia Matavele", "Pedro Uamusse"]) : null;
    t -= Math.floor(6 + rnd() * 70) * 60000;
    const fee = feeOf(val);
    const affc = aff ? +(val * 0.4).toFixed(2) : 0;
    out.push({ id: "VQ-" + (48213 - i), p, m, name, city: pick(CITIES), phone: phoneFor(METHODS[m].pre.length ? m : "emola"), email: emailOf(name), s, val, fee, aff, affc, net: +(val - fee - affc).toFixed(2), t: new Date(t), bump });
  }
  return out;
}
const SALES = genSales(48);
const dt = (d, withTime = true) => d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }).replace(".", "") + (withTime ? " · " + d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) : "");
function series(n, base, vol, trend, s = 3) {
  seed = s; const a = []; let v = base;
  for (let i = 0; i < n; i++) { v = Math.max(base * 0.35, v * (1 + (rnd() - 0.45) * vol) + trend); const wk = (i % 7 === 5 || i % 7 === 6) ? 0.82 : 1; a.push(Math.round(v * wk)); }
  return a;
}
const DAYS30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(2026, 8, 23 + i); return d; });

/* gráfico de área em SVG, escala única para marcas e eixos */
function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
const short = (v) => v >= 1e6 ? num(v / 1e6, v % 1e6 ? 1 : 0) + " M" : v >= 1000 ? num(v / 1000, 0) + " mil" : num(v, 0);
let chartSeq = 0;
function areaChart(data, labels, o = {}) {
  const W = 720, H = o.h || 240, L = 56, R = 12, T = 12, B = 28;
  const all = o.data2 ? data.concat(o.data2) : data;
  const max = niceMax(Math.max(...all) * 1.08);
  const x = (i) => L + (i * (W - L - R)) / (data.length - 1);
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const path = (d) => d.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);
  const every = Math.ceil(data.length / 6);
  const id = "c" + ++chartSeq;
  CHARTS[id] = { data, data2: o.data2, labels, fmt: o.fmt || mt, n1: o.n1 || "Faturamento", n2: o.n2, W, H, L, R, T, B, max };
  return `<div class="chart" data-chart="${id}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || "Gráfico")}">
    <defs><linearGradient id="gradA" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="gstop1"/><stop offset="1" class="gstop2"/></linearGradient></defs>
    <g class="grid">${ticks.map((t) => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/>`).join("")}</g>
    <g class="axis">${ticks.map((t) => `<text x="${L - 10}" y="${y(t) + 4}" text-anchor="end">${short(t)}</text>`).join("")}
    ${labels.map((l, i) => (i % every === 0 || i === labels.length - 1) && !(i !== labels.length - 1 && labels.length - 1 - i < every * 0.6) ? `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}">${l}</text>` : "").join("")}</g>
    <path class="area" d="${path(data)}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z"/>
    ${o.data2 ? `<path class="line2" d="${path(o.data2)}"/>` : ""}
    <path class="line" d="${path(data)}"/>
    <circle class="enddot" cx="${x(data.length - 1)}" cy="${y(data[data.length - 1])}" r="4"/>
    <line class="cursor" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>
    <circle class="dot" r="5" cx="0" cy="0" visibility="hidden"/>
  </svg><div class="chart-tip"></div></div>`;
}
const CHARTS = {};
function bindCharts() {
  $$(".chart[data-chart]").forEach((el) => {
    const c = CHARTS[el.dataset.chart]; if (!c) return;
    const svg = $("svg", el), tip = $(".chart-tip", el), cur = $(".cursor", el), dot = $(".dot", el);
    const move = (ev) => {
      const r = svg.getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * c.W;
      const i = Math.max(0, Math.min(c.data.length - 1, Math.round(((px - c.L) / (c.W - c.L - c.R)) * (c.data.length - 1))));
      const X = c.L + (i * (c.W - c.L - c.R)) / (c.data.length - 1);
      const Y = c.T + (c.H - c.T - c.B) * (1 - c.data[i] / c.max);
      cur.setAttribute("x1", X); cur.setAttribute("x2", X); cur.setAttribute("visibility", "visible");
      dot.setAttribute("cx", X); dot.setAttribute("cy", Y); dot.setAttribute("visibility", "visible");
      tip.innerHTML = `${c.labels[i]}<b>${c.n1}: ${c.fmt(c.data[i])}</b>${c.data2 ? `<b>${c.n2}: ${c.fmt(c.data2[i])}</b>` : ""}`;
      tip.style.left = (X / c.W) * r.width + "px"; tip.style.top = (Y / c.H) * r.height + "px"; tip.classList.add("on");
    };
    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerleave", () => { tip.classList.remove("on"); cur.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden"); });
  });
}
function spark(d, c = "var(--primary)", w = 120, h = 32) {
  const max = Math.max(...d), min = Math.min(...d);
  const pts = d.map((v, i) => [(i * w) / (d.length - 1), h - 2 - ((v - min) / (max - min || 1)) * (h - 4)]);
  const l = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  return `<svg class="vq-spark" width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="--sc:${c}" aria-hidden="true"><path class="a" d="${l}L${w},${h}L0,${h}Z"/><path class="l" d="${l}" vector-effect="non-scaling-stroke"/></svg>`;
}

/* estado e navegação */
const S = {
  route: "inicio", theme: store.get("theme", null), side: false, modal: null, drawer: null, proto: false, notif: false,
  period: "30d", salesFilter: { q: "", s: "", m: "", p: "" }, prodTab: "geral", prodId: "p1", accTab: "perfil", affTab: "lista",
  co: store.get("co3", { acc: "orange", timer: true, mins: 15, bump: true, testi: true, methods: { applepay: true, googlepay: true, mpesa: true, emola: true, card: true }, cta: "Comprar agora", nuit: false }),
  checkout: { method: "applepay", bump: false, coupon: "", couponOk: false, phone: "84 312 4471", name: "", email: "" },
  wizard: { step: 0, type: "curso", name: "", price: "", guarantee: "7", delivery: "membros", recurring: "unico" },
  onboard: { step: 0, kind: "singular", docs: {} },
  lesson: "m2l3", done: new Set(["m1l1", "m1l2", "m1l3", "m1l4", "m2l1", "m2l2"]),
  kycSel: 0, adminTab: "todos", payoutSel: new Set(), mobileView: false, period2: "30d", chartMode: "rev",
};
const ROUTES = {};
const route = (name, layout, view, title) => (ROUTES[name] = { layout, view, title });
function go(r) {
  if (!ROUTES[r]) r = "inicio";
  S.route = r; S.side = false; S.proto = false; S.notif = false; S.drawer = null;
  try { history.replaceState(null, "", "#" + r); } catch (e) {}
  render(); window.scrollTo(0, 0);
  const m = $("#vq-main") || $("#app"); if (m && m.focus) m.focus({ preventScroll: true });
}
function render() {
  const r = ROUTES[S.route];
  const body = r.view();
  let html = body;
  if (r.layout === "seller") html = shell(body, "seller", r.title);
  else if (r.layout === "admin") html = shell(body, "admin", r.title);
  $("#app").innerHTML = html;
  document.title = (r.title ? r.title + " · " : "") + "VendAqui";
  renderOverlays(); bindCharts(); AFTER.forEach((f) => f()); AFTER.length = 0;
}
const AFTER = [];
function renderOverlays() {
  $("#modal-root").innerHTML = S.modal ? modal(S.modal) : "";
  $("#drawer-root").innerHTML = S.drawer ? drawer(S.drawer) : "";
  $("#proto-root").innerHTML = protoSwitcher();
}

/* tema */
function applyTheme() { if (S.theme) document.documentElement.setAttribute("data-theme", S.theme); else document.documentElement.removeAttribute("data-theme"); }
const isDark = () => S.theme ? S.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;

/* toasts */
function toast(title, text = "", tone = "success", icon = "checkc", cls = "") {
  const el = document.createElement("div");
  el.className = `ad-toast ad-tone-${tone} ${cls}`;
  el.innerHTML = `<span class="ad-toast-icon">${ic(icon, 16)}</span><div class="ad-toast-body"><b>${title}</b>${text ? `<span>${text}</span>` : ""}</div><button class="ad-iconbtn ad-iconbtn-sm ad-btn-ghost" aria-label="Fechar">${ic("x", 14)}</button>`;
  $("button", el).onclick = () => el.remove();
  $("#toast-root").appendChild(el);
  setTimeout(() => el.remove(), 4800);
}
function saleToast() {
  const s = SALES[Math.floor(Math.random() * 12)];
  toast(`Venda aprovada · <b class="amt">+${mt(s.net)}</b>`, `${esc(s.p.name)} · ${METHODS[s.m].l}`, "success", "zap", "sale-toast");
}
function copy(text, msg = "Link copiado") {
  const ok = () => toast(msg, text.length < 60 ? text : "", "success", "copy");
  try { navigator.clipboard.writeText(text).then(ok, ok); } catch (e) { ok(); }
}

/* modal e gaveta genéricos */
const MODALS = {}, DRAWERS = {};
function modal(m) {
  const d = MODALS[m.type](m.data || {});
  return `<div class="ad-overlay" data-act="closeModal" data-self="1"><div class="ad-modal ad-modal-${d.size || "md"}" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="ad-modal-head"><div><h2 class="ad-modal-title" id="mt">${d.title}</h2>${d.desc ? `<p class="ad-modal-desc">${d.desc}</p>` : ""}</div>${d.noClose ? "" : ibtn("x", "Fechar", { act: "closeModal" })}</div><div class="ad-modal-body">${d.body}</div>${d.foot ? `<div class="ad-modal-foot">${d.foot}</div>` : ""}</div></div>`;
}
function drawer(dw) {
  const d = DRAWERS[dw.type](dw.data || {});
  return `<div class="drawer-scrim" data-act="closeDrawer"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dwt"><div class="drawer-head"><div class="stack-xs"><span class="faint" style="font-size:12px">${d.over || ""}</span><h2 id="dwt" class="ad-modal-title">${d.title}</h2>${d.sub || ""}</div>${ibtn("x", "Fechar", { act: "closeDrawer" })}</div><div class="drawer-body">${d.body}</div>${d.foot ? `<div class="drawer-foot">${d.foot}</div>` : ""}</aside>`;
}
const openModal = (type, data) => { S.modal = { type, data }; renderOverlays(); setTimeout(() => { const f = $("#modal-root input, #modal-root button.ad-btn-primary"); f && f.focus(); }, 30); };
const openDrawer = (type, data) => { S.drawer = { type, data }; renderOverlays(); };

/* shell das consolas */
const NAV = {
  seller: [
    ["Principal", [["painel", "Painel", "dash"], ["produtos", "Produtos", "package"], ["vendas", "Vendas", "receipt", 3], ["assinaturas", "Assinaturas", "repeat"], ["clientes", "Clientes", "users"]]],
    ["Crescimento", [["afiliados", "Afiliados", "share", 4], ["cupoes", "Cupões", "tag"], ["recuperacao", "Recuperação de vendas", "target"], ["membros", "Área de membros", "cap"]]],
    ["Conta", [["financeiro", "Financeiro", "wallet"], ["integracoes", "Integrações", "plug"], ["conta", "Definições da conta", "sliders"]]],
  ],
  admin: [
    ["Operação", [["admin", "Visão geral", "dash"], ["admin-transacoes", "Transações", "receipt"], ["admin-saques", "Saques", "cash", 7], ["admin-disputas", "Reembolsos e disputas", "scale", 3]]],
    ["Conformidade", [["admin-produtores", "Produtores", "store"], ["admin-kyc", "Verificação KYC", "idcard", 12], ["admin-produtos", "Produtos em análise", "package", 5], ["admin-risco", "Antifraude", "shieldalert"]]],
    ["Plataforma", [["admin-pagamentos", "Métodos de pagamento", "route"], ["admin-taxas", "Taxas e planos", "percent"], ["admin-equipa", "Equipa e acessos", "usercheck"], ["admin-logs", "Registo de auditoria", "history"]]],
  ],
};
const PARENT = { "produto-novo": "produtos", produto: "produtos" };
function shell(body, kind, title) {
  const admin = kind === "admin";
  const cur = PARENT[S.route] || S.route;
  const nav = NAV[kind].map(([h, items]) => `<div class="ad-sidebar-section"><div class="ad-sidebar-heading">${h}</div>${items.map(([r, l, i, c]) => `<button class="ad-sidebar-item ${cur === r ? "is-active" : ""}" data-go="${r}" ${cur === r ? 'aria-current="page"' : ""}>${ic(i, 18)}<span>${l}</span>${c ? `<span class="ad-tab-count">${c}</span>` : ""}</button>`).join("")}</div>`).join("");
  const foot = admin
    ? `<button class="ad-userchip" data-go="admin-equipa">${avatar("Rita Machava")}<span class="ad-userchip-text"><span class="ad-userchip-name">Rita Machava</span><span class="ad-userchip-role">Administradora · Operações</span></span></button>`
    : `<div class="vq-balance"><small>Saldo disponível</small><strong>${mt(48320)}</strong><button class="ad-btn ad-btn-soft ad-btn-sm" data-act="withdraw" style="margin-top:8px">${ic("cash", 16)}<span>Sacar</span></button></div><button class="ad-userchip" data-go="conta">${avatar("Ana Sitoe")}<span class="ad-userchip-text"><span class="ad-userchip-name">Ana Sitoe</span><span class="ad-userchip-role">Excel com a Ana</span></span></button>`;
  const notifs = admin ? [] : SALES.slice(0, 5);
  return `<div class="vq-shell">
  <div class="vq-scrim ${S.side ? "is-open" : ""}" data-act="side"></div>
  <aside class="vq-side ${admin ? "is-admin" : ""} ${S.side ? "is-open" : ""}" aria-label="Navegação"><nav class="ad-sidebar"><div class="ad-sidebar-brand">${logo(admin ? "Backoffice" : "Área do produtor", admin ? "admin" : "painel")}</div><div class="ad-sidebar-nav">${nav}</div><div class="ad-sidebar-foot">${foot}</div></nav></aside>
  <div class="vq-colmain">
    <header class="ad-topbar vq-top"><div class="ad-topbar-left">${ibtn("menu", "Abrir menu", { act: "side", cls: "vq-menubtn" })}<span class="ad-topbar-title">${title}</span>${admin ? '<span class="vq-envchip vq-hide-sm"><i></i>Produção · todos os sistemas operacionais</span>' : ""}</div>
    <div class="ad-topbar-right"><div class="ad-input ad-input-sm ad-search vq-hide-sm" style="width:240px"><span class="ad-input-icon">${ic("search", 16)}</span><input id="gsearch" placeholder="${admin ? "Procurar produtor, transação, NUIT" : "Procurar vendas, clientes"}" aria-label="Procurar"><span class="ad-kbd">/</span></div>
    ${ibtn(isDark() ? "sun" : "moon", "Alternar tema", { act: "theme" })}
    <div class="ad-menu-wrap">${ibtn("bell", "Notificações", { act: "notif", badge: admin ? 4 : 3 })}${S.notif ? notifMenu(admin, notifs) : ""}</div>
    ${admin ? "" : btn("Novo produto", { v: "primary", s: "sm", i: "plus", go: "produto-novo", cls: "vq-hide-sm" })}</div></header>
    <main class="vq-main" id="vq-main" tabindex="-1"><div class="stack">${body}</div></main>
  </div></div>`;
}
function notifMenu(admin, sales) {
  const items = admin
    ? [["idcard", "12 verificações KYC pendentes", "A mais antiga espera há 26 h", "admin-kyc"], ["cash", "7 saques acima do limite automático", "Total 412 600,00 MT", "admin-saques"], ["alert", "e-Mola com latência elevada", "Aprovação caiu para 91,2% na última hora", "admin-pagamentos"], ["scale", "Chargeback recebido", "VQ-47702 · Cartão · 3 990,00 MT", "admin-disputas"]]
    : sales.slice(0, 4).map((s) => [s.s === "Aprovada" ? "zap" : "clock", s.s === "Aprovada" ? `Venda aprovada · +${mt(s.net)}` : `Pagamento ${s.s.toLowerCase()}`, `${s.p.name} · ${METHODS[s.m].l}`, "vendas"]);
  return `<div class="ad-menu ad-menu-end" style="width:340px;max-width:calc(100vw - 24px)"><div class="ad-menu-header row-between"><b style="color:var(--text);font-size:14px">Notificações</b><button class="ad-btn-link" data-act="notif" style="font-size:12px">Marcar como lidas</button></div>${items.map(([i, t, s, r], k) => `<button class="ad-menu-item" data-go="${r}" style="align-items:flex-start">${tile(i, k === 0 ? "success" : "neutral", "sm")}<span class="stack-xs" style="gap:1px"><b style="font-weight:600;font-size:13.5px">${t}</b><small class="faint" style="font-size:12px">${s}</small></span></button>`).join("")}</div>`;
}

/* seletor de protótipo — atalho entre as áreas */
function protoSwitcher() {
  const items = [["inicio", "Landing page", "Página pública de vendas", "globe"], ["checkout", "Checkout", "O que o comprador vê", "cart"], ["entrar", "Entrar e registo", "Login e onboarding com KYC", "user"], ["painel", "Área do produtor", "Painel do cliente que vende", "dash"], ["aluno", "Área do aluno", "Onde o comprador consome", "cap"], ["admin", "Backoffice", "Consola da plataforma", "shield"]];
  return `<div class="proto">${S.proto ? `<div class="ad-menu" role="menu"><div class="ad-menu-header">Navegar no protótipo</div>${items.map(([r, l, d, i]) => `<button class="ad-menu-item ${S.route === r ? "is-current" : ""}" data-go="${r}" role="menuitem">${ic(i, 18)}<span>${l}<small>${d}</small></span></button>`).join("")}<div class="ad-menu-sep"></div><button class="ad-menu-item" data-act="theme">${ic(isDark() ? "sun" : "moon", 18)}<span>Tema ${isDark() ? "claro" : "escuro"}</span></button></div>` : ""}<button class="proto-btn" data-act="proto" aria-expanded="${S.proto}">${ic("grid", 16)}<span>Áreas do protótipo</span></button></div>`;
}

/* ações */
const ACT = {
  side: () => { S.side = !S.side; render(); },
  proto: () => { S.proto = !S.proto; renderOverlays(); },
  notif: () => { S.notif = !S.notif; render(); },
  theme: () => { S.theme = isDark() ? "light" : "dark"; store.set("theme", S.theme); applyTheme(); render(); },
  closeModal: () => { S.modal = null; renderOverlays(); },
  closeDrawer: () => { S.drawer = null; renderOverlays(); },
  copy: (el) => copy(el.dataset.arg),
  toast: (el) => toast(el.dataset.arg || "Feito"),
  toggle: (el) => { const on = el.getAttribute("aria-checked") !== "true"; el.setAttribute("aria-checked", on); },
};
document.addEventListener("click", (ev) => {
  const a = ev.target.closest("[data-act],[data-go]");
  if (a && !(a.dataset.self && ev.target !== a)) {
    if (a.dataset.act && ACT[a.dataset.act]) { ev.preventDefault(); ACT[a.dataset.act](a, ev); return; }
    if (a.dataset.go) { ev.preventDefault(); S.modal = null; go(a.dataset.go); return; }
  }
  if (S.proto && !ev.target.closest(".proto")) { S.proto = false; renderOverlays(); }
  if (S.notif && !ev.target.closest(".ad-menu-wrap")) { S.notif = false; render(); }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { if (S.modal) ACT.closeModal(); else if (S.drawer) ACT.closeDrawer(); else if (S.proto) ACT.proto(); else if (S.side) ACT.side(); }
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { const s = $("#gsearch"); if (s) { e.preventDefault(); s.focus(); } }
});
