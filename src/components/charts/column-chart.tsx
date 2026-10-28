"use client";

import { useEffect, useRef, useState } from "react";

export interface ColumnDatum {
  /** Category shown on the axis and in the tooltip, e.g. "12 Mar". */
  label: string;
  value: number;
}

/** Formatters live here: functions can't cross from Server to Client Components. */
const inrFull = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const formats = {
  count: { full: (v: number) => v.toLocaleString("en-IN"), tick: (v: number) => v.toLocaleString("en-IN") },
  /** Values are paise. */
  inr: {
    full: (v: number) => inrFull.format(v / 100),
    tick: (v: number) => {
      const r = v / 100;
      const a = Math.abs(r);
      const sign = r < 0 ? "−" : "";
      return `${sign}₹${a >= 1e5 ? `${(a / 1e5).toFixed(a >= 1e6 ? 0 : 1)}L` : a >= 1e3 ? `${(a / 1e3).toFixed(a >= 1e4 ? 0 : 1)}K` : Math.round(a)}`;
    },
  },
} as const;

const HEIGHT = 180;
const PAD = { top: 12, right: 8, bottom: 26, left: 52 };
const MAX_BAR = 24;
const GAP = 2;
const RADIUS = 4;

/** 1/2/5 × 10ⁿ ticks covering [min, max] (both include 0); whole steps for counts. */
function niceTicks(min: number, max: number, integer: boolean, count = 4) {
  const span = max - min || 1;
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(integer ? 1 : 0, [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw)!);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = lo; t <= hi + step / 2; t += step) ticks.push(Math.round(t * 1e6) / 1e6);
  return ticks;
}

/** A bar with a 4 px rounded data end and a square end on the baseline (spec: dataviz marks). */
function barPath(x: number, w: number, y0: number, y1: number) {
  const up = y1 < y0;
  const h = Math.abs(y1 - y0);
  const r = Math.min(RADIUS, w / 2, h);
  if (h < 0.5) return "";
  return up
    ? `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`
    : `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`;
}

/**
 * Single-series column chart (one measure, one axis). Hover or arrow keys show a tooltip; the
 * same numbers are always reachable without hovering through the table view.
 */
export function ColumnChart({ data, kind, label, unit }: { data: ColumnDatum[]; kind: keyof typeof formats; label: string; unit: string }) {
  const format = formats[kind].full;
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.floor(entry!.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const values = data.map((d) => d.value);
  const ticks = niceTicks(Math.min(0, ...values), Math.max(0, ...values, 1), kind === "count");
  const yMin = ticks[0]!;
  const yMax = ticks.at(-1)!;
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin || 1)) * plotH;
  const slot = plotW / Math.max(data.length, 1);
  const barW = Math.max(2, Math.min(MAX_BAR, slot - GAP));
  const x = (i: number) => PAD.left + i * slot + (slot - barW) / 2;
  const tickText = formats[kind].tick;
  // Label the first, middle and last categories only (selective labels).
  const labelled = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);
  const current = active !== null ? data[active] : null;

  return (
    <div>
      <div ref={ref} className="relative overflow-hidden">
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`${label}. Use the table below for every value.`}
          tabIndex={0}
          className="block rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
          onKeyDown={(e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            e.preventDefault();
            setActive((a) => Math.min(data.length - 1, Math.max(0, (a ?? (e.key === "ArrowRight" ? -1 : data.length)) + (e.key === "ArrowRight" ? 1 : -1))));
          }}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--muted-foreground)" className="font-mono tabular-nums">
                {tickText(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => (
            <g key={d.label}>
              <path d={barPath(x(i), barW, y(0), y(d.value))} fill="var(--chart-1)" opacity={active === null || active === i ? 1 : 0.55} />
              {/* The hit target is the whole column slot, not just the painted bar. */}
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={plotH} fill="transparent" onPointerEnter={() => setActive(i)} />
              {labelled.has(i) ? (
                <text x={x(i) + barW / 2} y={HEIGHT - 8} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} fontSize={11} fill="var(--muted-foreground)">
                  {d.label}
                </text>
              ) : null}
            </g>
          ))}
          <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--muted-foreground)" strokeWidth={1} />
        </svg>
        {current ? (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-card"
            style={{ left: Math.min(Math.max(x(active!) + barW / 2 - 70, 0), width - 140), width: 140 }}
          >
            <p className="font-mono font-semibold">{format(current.value)}</p>
            <p className="text-xs text-muted-foreground">
              {unit} · {current.label}
            </p>
          </div>
        ) : null}
      </div>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show as table</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="py-1 font-normal">Day</th>
                <th className="py-1 text-right font-normal">{unit}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.label} className="border-b border-border/60">
                  <td className="py-1">{d.label}</td>
                  <td className="py-1 text-right font-mono tabular-nums">{format(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
