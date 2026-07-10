"use client";

import { useState } from "react";

const SEGMENTS: { key: string; label: string; color: string }[] = [
  { key: "BRIEF_ENVOYE", label: "Brief envoyé", color: "#2a78d6" },
  { key: "EN_COURS", label: "En cours", color: "#1baf7a" },
  { key: "LIVRE", label: "Livré", color: "#eda100" },
  { key: "EN_VALIDATION", label: "En validation", color: "#008300" },
  { key: "VALIDE", label: "Validé", color: "#4a3aa7" },
  { key: "REJETE", label: "Rejeté", color: "#e34948" },
];

export function MissionStatusBar({ counts }: { counts: Record<string, number> }) {
  const [active, setActive] = useState<string | null>(null);
  const total = SEGMENTS.reduce((sum, s) => sum + (counts[s.key] ?? 0), 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Aucune mission pour l'instant.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex h-5 gap-0.5 overflow-hidden rounded" style={{ background: "var(--card)" }}>
        {SEGMENTS.map((s) => {
          const count = counts[s.key] ?? 0;
          if (count === 0) return null;
          const pct = (count / total) * 100;
          const isActive = active === s.key;
          return (
            <div
              key={s.key}
              role="img"
              aria-label={`${s.label} : ${count}`}
              tabIndex={0}
              onMouseEnter={() => setActive(s.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(s.key)}
              onBlur={() => setActive(null)}
              className="relative outline-none"
              style={{
                width: `${pct}%`,
                backgroundColor: s.color,
                opacity: active && !isActive ? 0.55 : 1,
                transition: "opacity 120ms",
              }}
            >
              {isActive && (
                <div
                  className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs shadow-sm"
                  role="tooltip"
                >
                  <span className="font-medium">{count}</span>{" "}
                  <span className="text-muted-foreground">{s.label}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block size-2 rounded-sm" style={{ backgroundColor: s.color }} aria-hidden="true" />
            {s.label}
            <span className="font-medium text-foreground">{counts[s.key] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
