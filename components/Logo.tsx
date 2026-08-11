// Radar brand mark — a custom SVG radar sweep: concentric range rings,
// a deadline-red sweep wedge, and a bright blip. No stock icons.
export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Radar"
    >
      <defs>
        <linearGradient id="radar-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#191926" />
          <stop offset="1" stopColor="#0E0E14" />
        </linearGradient>
        <linearGradient id="radar-sweep" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#16A34A" stopOpacity="0.55" />
          <stop offset="1" stopColor="#16A34A" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Tile */}
      <rect x="1" y="1" width="46" height="46" rx="12" fill="url(#radar-bg)" stroke="#2A2A3A" strokeWidth="1.5" />

      {/* Range rings */}
      <circle cx="24" cy="24" r="14.5" stroke="#3A3A50" strokeWidth="1" strokeDasharray="2.5 3" />
      <circle cx="24" cy="24" r="9.5" stroke="#3A3A50" strokeWidth="1" strokeDasharray="2 2.5" />

      {/* Sweep wedge (rotated ~ -35deg so the blip sits up-right) */}
      <g transform="rotate(-35 24 24)">
        <path d="M24 24 L37.5 14 A16 16 0 0 1 41 24 Z" fill="url(#radar-sweep)" />
        <line x1="24" y1="24" x2="40" y2="24" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Blip */}
      <circle cx="37.6" cy="10.6" r="3" fill="#22D3EE" />
      <circle cx="37.6" cy="10.6" r="5.5" stroke="#22D3EE" strokeOpacity="0.35" strokeWidth="1" />

      {/* Center */}
      <circle cx="24" cy="24" r="2.2" fill="#22C55E" />
    </svg>
  );
}
