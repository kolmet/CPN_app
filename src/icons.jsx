import React from "react";

// Filtre compartit que dona l'aspecte de "boceto a llapis" a qualsevol
// icona: distorsiona lleugerament les línies netes amb soroll, com si
// s'haguessin dibuixat a mà. Es defineix un cop a l'arrel de l'app.
export function SketchFilterDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <filter id="sketch-filter" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" />
      </filter>
    </svg>
  );
}

const strokeProps = { fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

export function WasherIcon({ color = "currentColor", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <rect x="6" y="5" width="36" height="39" rx="6" />
        <circle cx="15" cy="11" r="1.6" />
        <circle cx="22" cy="11" r="1.6" />
        <circle cx="24" cy="28" r="11" />
        <circle cx="24" cy="28" r="5.5" />
      </g>
    </svg>
  );
}

export function BedIcon({ color = "currentColor", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M8 40V15" />
        <path d="M8 30h34v10" />
        <rect x="11" y="18" width="11" height="9" rx="3" />
        <path d="M22 27h20" />
        <path d="M10 40v3M40 40v3" />
      </g>
    </svg>
  );
}

export function ChartIcon({ color = "currentColor", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M6 41h36" />
        <rect x="11" y="25" width="7" height="16" />
        <rect x="21" y="16" width="7" height="25" />
        <rect x="31" y="9" width="7" height="32" />
      </g>
    </svg>
  );
}

export function KitchenIcon({ color = "currentColor", size = 28 }) {
  // Idea: olla de cuina + un dau (joc de taula) — cuina + jocs
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M9 22c0-3 2-4 8-4s8 1 8 4v9c0 3-3 5-8 5s-8-2-8-5z" />
        <path d="M6 22h4M27 22h4" />
        <path d="M13 15c0-2 1-3 2-4M18 15c0-2 -1-3 -2-4" />
        <rect x="29" y="9" width="14" height="14" rx="3" />
      </g>
      <g fill={color}>
        <circle cx="33" cy="13" r="1.3" />
        <circle cx="39" cy="13" r="1.3" />
        <circle cx="36" cy="16" r="1.3" />
        <circle cx="33" cy="19" r="1.3" />
        <circle cx="39" cy="19" r="1.3" />
      </g>
    </svg>
  );
}

export function MovementIcon({ color = "currentColor", size = 28 }) {
  // Sala buida amb terra de parquet (patró d'espiga)
  const rows = 3, cols = 4, x0 = 9, y0 = 14, cellW = 7, cellH = 6;
  const chevrons = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = x0 + c * cellW;
      const cy = y0 + r * cellH;
      chevrons.push(<path key={`${r}-${c}`} d={`M${cx},${cy} l${cellW / 2},${cellH / 2} l${cellW / 2},-${cellH / 2}`} />);
    }
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <rect x="6" y="10" width="36" height="30" rx="3" />
        {chevrons}
      </g>
    </svg>
  );
}

export function ClockIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <circle cx="24" cy="24" r="17" />
        <path d="M24 14v10l7 5" />
      </g>
    </svg>
  );
}

const ICONS = {
  washer: WasherIcon,
  bed: BedIcon,
  chart: ChartIcon,
  kitchen: KitchenIcon,
  movement: MovementIcon,
  clock: ClockIcon,
};

// Rajola quadrada de color amb la icona centrada. Fes servir això per a
// cada apartat principal de l'app (bugaderia, hostes, estadístiques...).
export function IconTile({ icon, bg, ink, size = 72, iconSize = 32, label, onClick, active }) {
  const Icon = ICONS[icon];
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group" style={{ background: "none" }}>
      <div
        className="flex items-center justify-center rounded-3xl transition-transform group-active:scale-95"
        style={{ width: size, height: size, background: bg, border: active ? `2.5px solid ${ink}` : "2.5px solid transparent" }}
      >
        {Icon && <Icon color={ink} size={iconSize} />}
      </div>
      {label && <span className="text-xs font-medium text-center" style={{ color: "#152426", maxWidth: size + 20 }}>{label}</span>}
    </button>
  );
}
