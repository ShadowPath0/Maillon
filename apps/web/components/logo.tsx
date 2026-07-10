export function LogoMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Maillon"
    >
      <rect
        x="26"
        y="38"
        width="48"
        height="24"
        rx="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="12"
        transform="rotate(-28 50 50)"
      />
      <rect
        x="26"
        y="38"
        width="48"
        height="24"
        rx="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="12"
        transform="rotate(62 50 50)"
      />
    </svg>
  );
}

export function Logo({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark size={size} className="text-primary" />
      <span className="text-sm font-semibold tracking-tight">Maillon</span>
    </div>
  );
}
