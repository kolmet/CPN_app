export const APP_NAME = "Cal Paler Nou";

// Encara no actiu: quan es posi a true, apareixerà el checkbox "no tornis
// a mostrar-ho" a les normes d'ús i es respectarà per no tornar-les a
// ensenyar. De moment les normes es mostren sempre.
export const ENABLE_DONT_SHOW_AGAIN = false;

export const FLOORS = [
  { id: "pb", name: "Planta Baixa", zones: [
    { id: "pb-a", name: "Escala A" },
    { id: "pb-b", name: "Escala B" },
  ]},
  { id: "p1", name: "Planta 1", zones: [
    { id: "p1-a", name: "Escala A" },
    { id: "p1-b", name: "Escala B" },
  ]},
  { id: "p2", name: "Planta 2", zones: [
    { id: "p2-a", name: "Escala A" },
    { id: "p2-b", name: "Escala B" },
  ]},
  { id: "terrat", name: "Terrat", zones: [
    { id: "terrat-b", name: "Escala B" },
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
// L'ordre d'aquest objecte és l'ordre en què surten les rajoles a l'inici.
export const MODULES = {
  bugaderia: { label: "Bugaderia", icon: "washer", bg: "#DCEBFB", ink: "#2A5FA5" },
  polivalent: { label: "Sala Polivalent", icon: "kitchen", bg: "#FCE9D6", ink: "#B5651D" },
  moviment: { label: "Sala de Moviment", icon: "movement", bg: "#FDE1EC", ink: "#B23A6B" },
  hostes: { label: "Hostes", icon: "bed", bg: "#E1F3E1", ink: "#2E7D4F" },
  stats: { label: "Estadístiques", icon: "chart", bg: "#EFE3F7", ink: "#6B3FA0" },
};

// Franja horària per a les sales de reserva per hores (Polivalent/Moviment).
// Es pot triar l'hora d'inici cada 15 min, i la durada en trams de 30 min
// fins a un màxim de 6 hores.
export const SPACE_OPEN_MIN = 8 * 60;   // 8:00
export const SPACE_CLOSE_MIN = 23 * 60; // 23:00
export const SPACE_MAX_DURATION = 6 * 60; // 6 hores
export const SPACE_START_MINUTES = (() => {
  const out = [];
  for (let m = SPACE_OPEN_MIN; m <= SPACE_CLOSE_MIN - 30; m += 15) out.push(m);
  return out;
})();
export const SPACE_DURATIONS_MIN = (() => {
  const out = [];
  for (let d = 30; d <= SPACE_MAX_DURATION; d += 30) out.push(d);
  return out;
})();
export function formatMinutes(totalMin) {
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}
export function formatDuration(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}:${String(m).padStart(2, "0")}h`;
}

// La Sala Polivalent es pot reservar per parts: només la cuina, només la
// sala, o tot l'espai (que bloqueja les dues parts alhora).
export const SPACE_SUB_AREAS = {
  "room-polivalent": [
    { id: "cuina", name: "Cuina" },
    { id: "sala", name: "Sala" },
    { id: "tot", name: "Tot l'espai" },
  ],
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

export const SPACE_MODULE = {
  "room-p1": "hostes",
  "room-p2": "hostes",
  "room-polivalent": "polivalent",
  "room-moviment": "moviment",
};

export const WEEKDAYS_CA = ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"];
export const MONTHS_CA = ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"];
