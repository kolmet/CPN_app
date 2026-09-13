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

export function LogoIcon({ color = "currentColor", size = 28 }) {
  // Casa amb finestra rodona (amb creu) al capdamunt i dos arbres als costats,
  // inspirada en el logo de Cal Paler Nou.
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M6 22 L24 7 L42 22" />
        <path d="M10 22v16h28V22" />
        <circle cx="24" cy="16" r="3.4" />
        <path d="M24 12.6v6.8M20.6 16h6.8" />
        <rect x="20" y="29" width="8" height="9" rx="1" />
        <circle cx="9" cy="27" r="3" />
        <path d="M9 30v5" />
        <circle cx="39" cy="27" r="3" />
        <path d="M39 30v5" />
      </g>
    </svg>
  );
}

export function DoorPlantIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <rect x="6" y="8" width="16" height="32" rx="2" />
        <path d="M14 8v32" />
        <circle cx="17" cy="24" r="1.3" fill={color} />
        <circle cx="11" cy="24" r="1.3" fill={color} />
        <path d="M30 40V26c0-4 3-7 7-7" />
        <path d="M30 30c-3 0-5-2-5-5" />
        <path d="M32 22c0-3 2-5 5-5" />
      </g>
    </svg>
  );
}

export function BroomIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M38 8 L18 28" />
        <path d="M18 28l-8 12 6-2 2 6 4-8 6 2z" />
        <path d="M8 10l3 3M12 6l3 3M6 14l3 3" />
      </g>
    </svg>
  );
}

export function NoSmokingIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M8 20h20v6H8z" />
        <path d="M24 20v6" />
        <path d="M28 23h8" />
        <circle cx="24" cy="24" r="17" />
        <path d="M12 12l24 24" />
      </g>
    </svg>
  );
}

export function CalendarCheckIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <rect x="7" y="10" width="34" height="30" rx="3" />
        <path d="M7 19h34" />
        <path d="M15 6v8M33 6v8" />
        <path d="M16 29l5 5 11-12" />
      </g>
    </svg>
  );
}

export function NoDogIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M14 26c-2-4 0-8 3-9 1-3 4-4 7-3 3-2 7-1 8 2 3 0 5 3 4 6" />
        <path d="M15 22v8c0 3 2 5 5 5h8c3 0 5-2 5-5v-6" />
        <path d="M18 17l-3-5M30 16l3-5" />
        <circle cx="24" cy="24" r="17" />
        <path d="M12 12l24 24" />
      </g>
    </svg>
  );
}

export function PeopleHeartIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <circle cx="14" cy="16" r="5" />
        <path d="M6 34c0-5 4-9 8-9s8 4 8 9" />
        <circle cx="34" cy="16" r="5" />
        <path d="M26 34c0-5 4-9 8-9s8 4 8 9" />
        <path d="M24 30c-3-3-7-3-7 1 0 3 4 6 7 8 3-2 7-5 7-8 0-4-4-4-7-1z" />
      </g>
    </svg>
  );
}

export function ChairIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M12 8v18" />
        <path d="M36 20v18" />
        <path d="M12 20h24" />
        <path d="M12 20l-3 20M36 20l3 20" />
        <path d="M9 40h30" />
      </g>
    </svg>
  );
}

export function SpeechBubblesIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M6 10h22v14H16l-5 5v-5H6z" />
        <path d="M20 24c1 2 3 4 6 4h6l5 5v-5h4V16H24" />
      </g>
    </svg>
  );
}

export function BasketIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M9 20h30l-3 18H12z" />
        <path d="M9 20c0-6 6-10 15-10s15 4 15 10" />
        <path d="M16 20v18M24 20v18M32 20v18" />
      </g>
    </svg>
  );
}

export function ClothespinIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M18 6l-6 30" />
        <path d="M30 6l6 30" />
        <circle cx="24" cy="16" r="3" />
        <path d="M14 24h20" />
      </g>
    </svg>
  );
}

export function SparkleFrameIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <rect x="8" y="12" width="24" height="24" rx="2" />
        <path d="M8 30l7-8 6 6 5-6 6 8" />
        <path d="M38 10l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" />
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

export function DoorPlantIcon({ color = "currentColor", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <rect x="10" y="8" width="28" height="34" rx="2" />
        <path d="M24 8v34" />
        <circle cx="18" cy="26" r="1.2" fill={color} />
        <circle cx="30" cy="26" r="1.2" fill={color} />
        <path d="M11 8c0-4 2-6 5-7" />
        <circle cx="17" cy="4" r="2.2" />
      </g>
    </svg>
  );
}

export function BroomIcon({ color = "currentColor", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M33 7 L15 34" />
        <path d="M15 34 L8 39 M15 34 L11 43 M15 34 L17 43 M15 34 L21 40" />
        <path d="M36 10l2.5 2.5M39 6l2.5 2.5" />
      </g>
    </svg>
  );
}

export function BasketIcon({ color = "currentColor", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M9 21h30l-4.5 19h-21z" />
        <path d="M15 21c0-7 4-13 9-13s9 6 9 13" />
        <path d="M18 21v-6M24 21v-8M30 21v-6" />
        <path d="M13 27h22M14.5 33h19" />
      </g>
    </svg>
  );
}

export function ClothespinIcon({ color = "currentColor", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M19 6v36" />
        <path d="M29 6v36" />
        <path d="M19 6c0-3.5 10-3.5 10 0" />
        <circle cx="24" cy="15" r="3.4" />
      </g>
    </svg>
  );
}

export function NoSmokingIcon({ color = "currentColor", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <rect x="9" y="23" width="21" height="5.5" rx="1" />
        <path d="M30 23l4.5 1v3.5l-4.5 1" />
        <path d="M13 18c2.5-2 -2-4.5 0-8" />
        <circle cx="24" cy="24" r="18" />
        <path d="M11 11l26 26" />
      </g>
    </svg>
  );
}

export function NoPetIcon({ color = "currentColor", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <circle cx="24" cy="29" r="5.5" />
        <circle cx="15" cy="19" r="3" />
        <circle cx="22" cy="13" r="3" />
        <circle cx="30" cy="13" r="3" />
        <circle cx="35" cy="20" r="3" />
        <circle cx="24" cy="24" r="18" />
        <path d="M11 11l26 26" />
      </g>
    </svg>
  );
}

export function CalendarCheckIcon({ color = "currentColor", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <rect x="7" y="10" width="34" height="30" rx="3" />
        <path d="M7 18h34" />
        <path d="M16 6v8M32 6v8" />
        <path d="M16 27l5 5 11-12" />
      </g>
    </svg>
  );
}

export function PeopleHeartIcon({ color = "currentColor", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <circle cx="14" cy="21" r="5" />
        <path d="M6 41c0-8 4-12 8-12s8 4 8 12" />
        <circle cx="34" cy="21" r="5" />
        <path d="M26 41c0-8 4-12 8-12s8 4 8 12" />
        <path d="M24 10c-2-3-7-2-7 2 0 3.5 7 8.5 7 8.5s7-5 7-8.5c0-4-5-5-7-2z" />
      </g>
    </svg>
  );
}

export function SpeechBubbleIcon({ color = "currentColor", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M7 12h21a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4H16l-6 5v-5H7a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4z" transform="translate(1,0)" />
        <path d="M29 21h9a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3v4l-5-4h-4a3 3 0 0 1-3-3" />
      </g>
    </svg>
  );
}

export function ChairIcon({ color = "currentColor", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ filter: "url(#sketch-filter)" }}>
      <g stroke={color} {...strokeProps}>
        <path d="M14 7c0-2 2-3 4-3h12c2 0 4 1 4 3v17H14z" />
        <rect x="12" y="24" width="24" height="4" />
        <path d="M14 28v11M34 28v11M18 28l-1.5 11M30 28l1.5 11" />
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
  doorplant: DoorPlantIcon,
  broom: BroomIcon,
  basket: BasketIcon,
  clothespin: ClothespinIcon,
  nosmoking: NoSmokingIcon,
  nopet: NoPetIcon,
  calendarcheck: CalendarCheckIcon,
  peopleheart: PeopleHeartIcon,
  speech: SpeechBubbleIcon,
  chair: ChairIcon,
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
