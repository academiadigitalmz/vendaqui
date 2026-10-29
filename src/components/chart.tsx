import { useId, useRef, useState } from "react";
import { mt, num } from "@/lib/format";

function niceMax(v: number) { const p = Math.pow(10, Math.floor(Math.log10(v || 1))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
const shortTick = (v: number) => (v >= 1e6 ? num(v / 1e6, v % 1e6 ? 1 : 0) + " M" : v >= 1000 ? num(v / 1000, 0) + " mil" : num(v, 0));

/** Gráfico de área com uma escala única para marcas e eixos, e tooltip ao passar o rato. */
export function AreaChart({ data, data2, labels, name1 = "Faturamento", name2, fmt = mt, h = 240, aria = "Gráfico" }: { data: number[]; data2?: number[]; labels: string[]; name1?: string; name2?: string; fmt?: (v: number) => string; h?: number; aria?: string }) {
  const W = 720, L = 56, R = 12, T = 12, B = 28;
  const gid = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  if (!data.length) return null;
  const max = niceMax(Math.max(...data, ...(data2 || [])) * 1.08);
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, data.length - 1);
  const y = (v: number) => T + (h - T - B) * (1 - v / max);
  const path = (d: number[]) => d.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);
  const every = Math.ceil(data.length / 6);
  const showLabel = (i: number) => i === labels.length - 1 || (i % every === 0 && labels.length - 1 - i >= every * 0.6);
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(((px - L) / (W - L - R)) * (data.length - 1)))));
  };
  return (
    <div className="chart">
      <svg ref={ref} viewBox={`0 0 ${W} ${h}`} role="img" aria-label={aria} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" className="gstop1" /><stop offset="1" className="gstop2" /></linearGradient></defs>
        <g className="grid">{ticks.map((t) => <line key={t} x1={L} x2={W - R} y1={y(t)} y2={y(t)} />)}</g>
        <g className="axis">
          {ticks.map((t) => <text key={t} x={L - 10} y={y(t) + 4} textAnchor="end">{shortTick(t)}</text>)}
          {labels.map((l, i) => showLabel(i) ? <text key={i} x={x(i)} y={h - 6} textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}>{l}</text> : null)}
        </g>
        <path style={{ fill: `url(#${gid})` }} d={`${path(data)}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} />
        {data2 ? <path className="line2" d={path(data2)} /> : null}
        <path className="line" d={path(data)} />
        <circle className="enddot" cx={x(data.length - 1)} cy={y(data[data.length - 1])} r={4} />
        {hover != null ? <><line className="cursor" x1={x(hover)} x2={x(hover)} y1={T} y2={h - B} /><circle className="dot" r={5} cx={x(hover)} cy={y(data[hover])} /></> : null}
      </svg>
      {hover != null ? (
        <div className="chart-tip on" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(data[hover]) / h) * 100}%` }}>
          {labels[hover]}<b>{name1}: {fmt(data[hover])}</b>{data2 && name2 ? <b>{name2}: {fmt(data2[hover])}</b> : null}
        </div>
      ) : null}
    </div>
  );
}
