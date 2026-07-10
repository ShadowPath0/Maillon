"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";

const BAR_COLOR = "#2a78d6";
const CHART_HEIGHT = 140;

export function RevenueBarChart({ data }: { data: { key: string; label: string; total: number }[] }) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(...data.map((d) => d.total), 1);
  const allZero = data.every((d) => d.total === 0);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end justify-between gap-3" style={{ height: CHART_HEIGHT }}>
        {data.map((d) => {
          const heightPx = d.total === 0 ? 0 : Math.max((d.total / max) * (CHART_HEIGHT - 24), 3);
          const isActive = active === d.key;
          return (
            <div key={d.key} className="flex flex-1 flex-col items-center justify-end gap-1">
              {d.total > 0 && (
                <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {formatCompact(d.total)}
                </span>
              )}
              <div
                role="img"
                aria-label={`${d.label} : ${formatMoney(d.total)}`}
                tabIndex={0}
                onMouseEnter={() => setActive(d.key)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(d.key)}
                onBlur={() => setActive(null)}
                className="relative w-full max-w-8 rounded-t outline-none"
                style={{
                  height: heightPx,
                  backgroundColor: BAR_COLOR,
                  opacity: active && !isActive ? 0.55 : 1,
                  transition: "opacity 120ms",
                }}
              >
                {isActive && (
                  <div
                    className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs shadow-sm"
                    role="tooltip"
                  >
                    <span className="font-medium">{formatMoney(d.total)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-px bg-border" />
      <div className="flex justify-between gap-3">
        {data.map((d) => (
          <span key={d.key} className="flex-1 text-center text-xs text-muted-foreground">
            {d.label}
          </span>
        ))}
      </div>
      {allZero && <p className="mt-2 text-sm text-muted-foreground">Aucune facture payée sur les 6 derniers mois.</p>}
    </div>
  );
}

function formatCompact(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k€`;
  return `${Math.round(value)}€`;
}
