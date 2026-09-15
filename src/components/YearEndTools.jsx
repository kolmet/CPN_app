import React, { useState } from "react";
import { COLOR, SPACE_MODULE } from "../config";
import {
  getMachines, getSpaces, getBookingsForYear, getRoomBookingsForYear,
  deleteBookingsForYear, deleteRoomBookingsForYear, saveYearlySummary,
} from "../supabaseClient";

function toCsv(rows, headers) {
  function esc(v) {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  const lines = [headers.join(",")];
  rows.forEach(r => lines.push(headers.map(h => esc(r[h])).join(",")));
  return lines.join("\n");
}
function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const LAUNDRY_HEADERS = ["data", "porta", "nickname", "rentadora", "zona", "hora_inici", "durada_min", "estat"];
const SPACE_HEADERS = ["espai", "porta", "nickname", "entrada", "sortida", "inici_min", "fi_min", "subarea", "participants", "per_a", "estat"];

export default function YearEndTools({ showToast }) {
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1); // 1: cal exportar, 2: exportat, 3: resum desat -> es pot netejar
  const [confirmText, setConfirmText] = useState("");

  async function exportCsv() {
    setBusy(true);
    try {
      const y = Number(year);
      const [machines, spaces, laundry, rooms] = await Promise.all([
        getMachines(), getSpaces(), getBookingsForYear(y), getRoomBookingsForYear(y),
      ]);
      const machineMap = Object.fromEntries(machines.map(m => [m.id, m]));
      const spaceMap = Object.fromEntries(spaces.map(s => [s.id, s]));

      const laundryRows = laundry.map(b => ({
        data: b.booking_date, porta: b.door, nickname: b.nickname || "",
        rentadora: machineMap[b.machine_id]?.machine_number ?? "", zona: machineMap[b.machine_id]?.zone_id ?? "",
        hora_inici: b.start_hour, durada_min: b.duration_minutes, estat: b.status,
      }));
      const roomRows = rooms.map(b => ({
        espai: spaceMap[b.room_id]?.name ?? b.room_id, porta: b.door, nickname: b.nickname || "",
        entrada: b.check_in, sortida: b.check_out, inici_min: b.start_min ?? "", fi_min: b.end_min ?? "",
        subarea: b.sub_area ?? "", participants: b.participants ?? "", per_a: b.external_name ?? "", estat: b.status,
      }));

      downloadCsv(`bugaderia-${y}.csv`, toCsv(laundryRows, LAUNDRY_HEADERS));
      downloadCsv(`espais-${y}.csv`, toCsv(roomRows, SPACE_HEADERS));
      showToast(`Exportats ${laundryRows.length} torns de bugaderia i ${roomRows.length} d'espais.`);
      setStep(2);
    } catch (e) {
      showToast("No s'ha pogut exportar.");
    } finally {
      setBusy(false);
    }
  }

  async function saveSummary() {
    setBusy(true);
    try {
      const y = Number(year);
      const [laundry, rooms] = await Promise.all([getBookingsForYear(y), getRoomBookingsForYear(y)]);
      const counts = { bugaderia: laundry.length, hostes: 0, polivalent: 0, moviment: 0, bicicletes: 0 };
      rooms.forEach(b => {
        const m = SPACE_MODULE[b.room_id];
        if (m && counts[m] !== undefined) counts[m]++;
      });
      const ok = await saveYearlySummary(y, counts);
      showToast(ok ? "Resum anual desat ✔ Ja es pot netejar el detall si vols." : "No s'ha pogut desar el resum.");
      if (ok) setStep(3);
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    if (confirmText !== year) { showToast("Escriu l'any exacte per confirmar."); return; }
    setBusy(true);
    try {
      const y = Number(year);
      const ok1 = await deleteBookingsForYear(y);
      const ok2 = await deleteRoomBookingsForYear(y);
      showToast(ok1 && ok2 ? `Dades detallades de ${y} eliminades. El resum anual es conserva.` : "Hi ha hagut un problema eliminant les dades.");
      setStep(1); setConfirmText("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
      <div className="font-bold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Tancament d'any</div>
      <p className="text-xs mb-3" style={{ color: COLOR.inkSoft }}>
        Exporta l'històric d'un any a CSV i, si vols, neteja després les dades detallades d'aquell any.
        El total per any es conserva sempre a "Evolució per anys", encara que s'esborri el detall.
      </p>
      <label className="block text-xs mb-1" style={{ color: COLOR.inkSoft }}>Any</label>
      <input type="number" value={year} onChange={e => { setYear(e.target.value); setStep(1); }}
        className="px-3 py-2 rounded-lg text-sm mb-3" style={{ border: `1px solid ${COLOR.line}` }} />

      <div className="flex flex-col gap-2">
        <button onClick={exportCsv} disabled={busy}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: COLOR.water }}>
          1. Exporta l'any {year} a CSV
        </button>
        <button onClick={saveSummary} disabled={busy || step < 2}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: COLOR.waterDark }}>
          2. Desa el resum anual (per a les gràfiques)
        </button>

        {step >= 3 && (
          <div className="mt-2 p-3 rounded-lg" style={{ background: "#FDEDEB", border: `1px solid ${COLOR.danger}` }}>
            <p className="text-xs mb-2" style={{ color: COLOR.danger }}>
              Això esborrarà per sempre totes les reserves detallades de {year} (qui va reservar què i quan).
              Assegura't d'haver baixat els CSV abans. Escriu <b>{year}</b> per confirmar.
            </p>
            <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder={year}
              className="px-3 py-2 rounded-lg text-sm mb-2 w-full" style={{ border: `1px solid ${COLOR.line}` }} />
            <button onClick={doDelete} disabled={busy}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: COLOR.danger }}>
              3. Elimina les dades detallades de {year}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
