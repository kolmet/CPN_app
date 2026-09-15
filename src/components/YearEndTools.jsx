import React, { useState, useEffect } from "react";
import { COLOR, SPACE_MODULE } from "../config";
import {
  getMachines, getSpaces, getBookingsForYear, getRoomBookingsForYear,
  deleteBookingsForYear, deleteRoomBookingsForYear, saveYearlySummary,
  logAuditAction, getRecentAuditLog,
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
// Converteix el text a bytes Windows-1252 ("ANSI"). Per als accents i la ç
// que fem servir, el valor de byte coincideix amb el codi Unicode del
// caràcter, així que no cal cap taula de conversió complexa.
function toWindows1252Bytes(str) {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes[i] = code <= 0xff ? code : 0x3f; // '?' si hi ha algun caràcter fora de rang
  }
  return bytes;
}

function downloadCsv(filename, content) {
  // Alguns Excel ignoren el BOM d'UTF-8 i sempre esperen la codificació
  // "ANSI" clàssica de Windows. Generem el fitxer directament en
  // Windows-1252 per evitar dependre de com detecti la codificació.
  const blob = new Blob([toWindows1252Bytes(content)], { type: "text/csv;charset=windows-1252;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const LAUNDRY_HEADERS = ["data", "porta", "nickname", "rentadora", "zona", "hora_inici", "durada_min", "estat"];
const SPACE_HEADERS = ["espai", "porta", "nickname", "entrada", "sortida", "inici_min", "fi_min", "subarea", "participants", "per_a", "estat"];

export default function YearEndTools({ identity, showToast }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear - 1));
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1); // 1: cal exportar, 2: exportat, 3: resum desat -> es pot netejar
  const [confirmText, setConfirmText] = useState("");
  const [auditLog, setAuditLog] = useState([]);

  const isCurrentOrFutureYear = Number(year) >= currentYear;

  useEffect(() => {
    getRecentAuditLog(10).then(setAuditLog);
  }, []);

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
      showToast("No s'ha pogut exportar: " + (e?.message || "error desconegut"));
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
    if (isCurrentOrFutureYear) { showToast("No es pot esborrar l'any en curs."); return; }
    if (confirmText !== year) { showToast("Escriu l'any exacte per confirmar."); return; }
    setBusy(true);
    try {
      const y = Number(year);
      const ok1 = await deleteBookingsForYear(y);
      const ok2 = await deleteRoomBookingsForYear(y);
      if (ok1 && ok2) {
        await logAuditAction("delete_data", y, identity?.door, identity?.nickname);
        setAuditLog(await getRecentAuditLog(10));
        showToast(`Dades detallades de ${y} eliminades. El resum anual es conserva.`);
      } else {
        showToast("Hi ha hagut un problema eliminant les dades.");
      }
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

        {step >= 3 && isCurrentOrFutureYear && (
          <div className="mt-2 p-3 rounded-lg text-xs" style={{ background: COLOR.bg, color: COLOR.inkSoft }}>
            No es pot esborrar el detall de l'any en curs ({currentYear}). Aquesta opció només és per a anys ja tancats.
          </div>
        )}
        {step >= 3 && !isCurrentOrFutureYear && (
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

      {auditLog.length > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${COLOR.line}` }}>
          <div className="text-xs font-semibold uppercase mb-2" style={{ color: COLOR.inkSoft }}>Registre d'accions</div>
          <div className="space-y-1">
            {auditLog.map(a => (
              <div key={a.id} className="text-xs" style={{ color: COLOR.inkSoft }}>
                {new Date(a.created_at).toLocaleString("ca-ES")} · <b style={{ color: COLOR.ink }}>{a.nickname || "?"}</b> (porta {a.door || "?"}) —
                {a.action === "delete_data" ? ` ha eliminat el detall de ${a.year}` : ` ${a.action} (${a.year})`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
