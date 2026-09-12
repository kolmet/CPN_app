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
];

export const FLAT_ZONES = FLOORS.flatMap(f => f.zones.map(z => ({ ...z, floorId: f.id, floorName: f.name })));

// La bugaderia obre de 8:00 a 22:00. Aquestes són les hores d'inici
// possibles; la disponibilitat real de cada una depèn de la durada
// (curta/llarga) de cada rentadora, calculada dinàmicament.
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
