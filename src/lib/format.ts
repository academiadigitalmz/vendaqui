/** Formatação em português de Moçambique: espaço fino nos milhares, vírgula decimal, MT. */
export function num(n: number, d = 2) {
  const p = Math.abs(n).toFixed(d).split(".");
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (n < 0 ? "−" : "") + p.join(",");
}
export const mt = (n: number, d = 2) => num(n, d) + " MT";
export const pct = (n: number, d = 1) => num(n, d) + "%";
export const int = (n: number) => num(n, 0);
export const short = (v: number) => (v >= 1e6 ? num(v / 1e6, v % 1e6 ? (v >= 1e7 ? 1 : 2) : 0) + " M" : v >= 1000 ? num(v / 1000, 0) + " mil" : num(v, 0));
export const initials = (n: string) => n.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
export const maskPhone = (p: string) => p.replace(/(\+258 \d\d) \d{3} (\d)\d{3}/, "$1 ••• •$2");
export function date(iso: string, withTime = true) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }).replace(".", "");
  return withTime ? `${day} · ${d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}` : day;
}
export const dateLong = (iso: string) => new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
