export const FLOORS = [
  { id: "pb", name: "Planta Baixa", zones: [
    { id: "pb-a", name: "Zona A" },
    { id: "pb-b", name: "Zona B" },
  ]},
  { id: "p1", name: "Planta 1", zones: [
    { id: "p1-a", name: "Zona A" },
    { id: "p1-b", name: "Zona B" },
  ]},
  { id: "p2", name: "Planta 2", zones: [
    { id: "p2-a", name: "Zona A" },
    { id: "p2-b", name: "Zona B" },
  ]},
  { id: "terrat", name: "Terrat", zones: [
    { id: "terrat-comuna", name: "Zona comuna" },
  ]},
];

export const FLAT_ZONES = FLOORS.flatMap(f => f.zones.map(z => ({ ...z, floorId: f.id, floorName: f.name })));

export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 22;
export const START_HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

export function zoneById(id) { return FLAT_ZONES.find(z => z.id === id); }
export function zoneLabel(id) { const z = zoneById(id); return z ? `${z.floorName} · ${z.name}` : id; }
export function shortZoneLabel(id) {
  const z = zoneById(id);
  if (!z) return id;
  const fl = z.floorId === "pb" ? "PB" : z.floorId.toUpperCase();
  return `${fl}-${z.name.slice(-1)}`;
}

export const COLOR = {
  bg: "#EEF3F1",
  surface: "#FFFFFF",
  ink: "#152426",
  inkSoft: "#4B5F61",
  water: "#2B6E75",
  waterDark: "#1D4E53",
  soap: "#E3A93A",
  success: "#3F8F5F",
  danger: "#C0524A",
  line: "#DCE6E3",
};

// Estil visual (rajola + icona) de cada apartat principal de l'app.
export const MODULES = {
  bugaderia: { label: "Bugaderia", icon: "washer", bg: "#DCEBFB", ink: "#2A5FA5" },
  hostes: { label: "Hostes", icon: "bed", bg: "#E1F3E1", ink: "#2E7D4F" },
  polivalent: { label: "Sala Polivalent", icon: "kitchen", bg: "#FCE9D6", ink: "#B5651D" },
  moviment: { label: "Sala de Moviment", icon: "movement", bg: "#FDE1EC", ink: "#B23A6B" },
  stats: { label: "Estadístiques", icon: "chart", bg: "#EFE3F7", ink: "#6B3FA0" },
};

// Franja horària per a les sales de reserva per hores (Polivalent/Moviment).
export const SPACE_OPEN_HOUR = 8;
export const SPACE_CLOSE_HOUR = 23;
export const SPACE_START_HOURS = Array.from({ length: SPACE_CLOSE_HOUR - SPACE_OPEN_HOUR }, (_, i) => SPACE_OPEN_HOUR + i);
export const SPACE_DURATIONS = [1, 2, 3, 4]; // hores

export function ymd(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function buildDates(count = 7) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    let label;
    if (i === 0) label = "Avui";
    else if (i === 1) label = "Demà";
    else label = d.toLocaleDateString("ca-ES", { weekday: "short", day: "numeric" });
    out.push({ key: ymd(d), label });
  }
  return out;
}
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// Totes les dates (YYYY-MM-DD) compreses entre check_in (inclòs) i
// check_out (exclòs) — útil per pintar un calendari mensual.
export function expandDateRange(checkIn, checkOut) {
  const dates = [];
  let d = new Date(checkIn + "T00:00:00");
  const end = new Date(checkOut + "T00:00:00");
  while (d < end) {
    dates.push(ymd(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export const WEEKDAYS_CA = ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"];
export const MONTHS_CA = ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"];
