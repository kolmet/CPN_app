import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Clock3, CheckCircle2, X } from "lucide-react";
import { COLOR, MODULES, SPACE_MODULE, ymd, zoneById, expandDateRange, formatMinutes } from "../config";
import { getMachines, getBookings, cancelBooking, finishBooking, getSpaces, getSpaceBookings, cancelSpaceBooking } from "../supabaseClient";
import { onTableChange } from "../realtime";
import MonthCalendar from "./MonthCalendar";

function todayStr() { return ymd(new Date()); }
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }

export default function MyBookingsTab({ identity, showToast }) {
  const [machines, setMachines] = useState([]);
  const [laundry, setLaundry] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [spaceBookings, setSpaceBookings] = useState([]);
  const [now] = useState(new Date());

  const load = useCallback(async () => {
    const spacesData = await getSpaces();
    const [m, lb, sb] = await Promise.all([
      getMachines(),
      getBookings(addDays(-1), addDays(14)),
      getSpaceBookings(spacesData.map(s => s.id), todayStr()),
    ]);
    setMachines(m);
    setLaundry(lb.filter(b => b.door === identity.door));
    setSpaces(spacesData);
    setSpaceBookings(sb.filter(b => b.door === identity.door));
  }, [identity.door]);

  useEffect(() => {
    load();
    const unsub1 = onTableChange("bookings", load);
    const unsub2 = onTableChange("room_bookings", load);
    return () => { unsub1(); unsub2(); };
  }, [load]);

  const todayKey = todayStr();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  async function handleCancel(id) { await cancelBooking(id); showToast("Reserva cancel·lada"); load(); }
  async function handleFinish(id) { await finishBooking(id); showToast("Avisat! Ja pots estendre la roba 🧺"); load(); }
  async function handleCancelSpace(id) { await cancelSpaceBooking(id); showToast("Reserva cancel·lada"); load(); }

  const laundrySorted = [...laundry].sort((a, b) => (a.booking_date + a.start_hour).localeCompare(b.booking_date + b.start_hour));
  const spaceSorted = [...spaceBookings].sort((a, b) => a.check_in.localeCompare(b.check_in) || (a.start_min ?? 0) - (b.start_min ?? 0));

  const calendarDates = useMemo(() => {
    const map = new Map();
    laundry.forEach(b => map.set(b.booking_date, { color: MODULES.bugaderia.ink, label: "Bugaderia" }));
    spaceBookings.forEach(b => {
      const moduleKey = SPACE_MODULE[b.room_id] || "hostes";
      const modStyle = MODULES[moduleKey];
      expandDateRange(b.check_in, b.check_out).forEach(d => {
        const prev = map.get(d);
        map.set(d, { color: modStyle.ink, label: prev ? `${prev.label}, ${modStyle.label}` : modStyle.label });
      });
    });
    return map;
  }, [laundry, spaceBookings]);

  if (laundrySorted.length === 0 && spaceSorted.length === 0) {
    return (
      <div className="px-5">
        <div className="rounded-2xl p-6 text-center" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}`, color: COLOR.inkSoft }}>
          Encara no tens cap torn reservat.
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 space-y-3">
      <div className="rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
        <MonthCalendar occupiedDates={calendarDates} />
      </div>
      {laundrySorted.map(b => {
        const machine = machines.find(m => m.id === b.machine_id);
        const start = b.start_hour * 60, end = start + b.duration_minutes;
        const isPast = b.booking_date < todayKey || (b.booking_date === todayKey && nowMinutes >= end);
        const isNow = b.booking_date === todayKey && nowMinutes >= start && nowMinutes < end;
        const canCancel = b.status === "reservado" && !isPast;
        const canFinish = b.status === "reservado" && (isNow || isPast);
        const endH = Math.floor(end / 60), endM = end % 60;
        const style = MODULES.bugaderia;
        return (
          <div key={b.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
            <div>
              <div className="text-[10px] font-semibold uppercase mb-0.5" style={{ color: style.ink }}>Bugaderia</div>
              <div className="font-semibold text-sm">
                {machine ? `${zoneById(machine.zone_id)?.floorName ?? ""} · ${zoneById(machine.zone_id)?.name ?? ""} · Rentadora ${machine.machine_number}` : "Rentadora"}
              </div>
              <div className="text-sm flex items-center gap-1" style={{ color: COLOR.inkSoft }}>
                <Clock3 size={14} /> {b.booking_date} · {b.start_hour}:00–{endH}:{String(endM).padStart(2, "0")}
              </div>
              <div className="text-xs mt-1 font-medium" style={{ color: b.status === "finalizado" ? COLOR.success : isNow ? COLOR.danger : style.ink }}>
                {b.status === "finalizado" ? "Acabat · roba llesta per estendre" : isNow ? "En curs ara" : isPast ? "Torn passat" : "Reservat"}
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {canFinish && (
                <button onClick={() => handleFinish(b.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background: COLOR.success }}>
                  <CheckCircle2 size={14} /> Rentat llest
                </button>
              )}
              {canCancel && (
                <button onClick={() => handleCancel(b.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs" style={{ color: COLOR.danger, border: `1px solid ${COLOR.danger}` }}>
                  <X size={14} /> Cancel·la
                </button>
              )}
            </div>
          </div>
        );
      })}

      {spaceSorted.map(b => {
        const space = spaces.find(s => s.id === b.room_id);
        const moduleKey = SPACE_MODULE[b.room_id] || "hostes";
        const style = MODULES[moduleKey];
        const isHourly = b.start_min != null;
        return (
          <div key={b.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
            <div>
              <div className="text-[10px] font-semibold uppercase mb-0.5" style={{ color: style.ink }}>{style.label}</div>
              <div className="font-semibold text-sm">{space?.name ?? "Espai"}</div>
              <div className="text-sm" style={{ color: COLOR.inkSoft }}>
                {isHourly ? `${b.check_in} · ${formatMinutes(b.start_min)}–${formatMinutes(b.end_min)}` : `${b.check_in} → ${b.check_out}`}
                {b.sub_area && b.sub_area !== "tot" ? ` · ${b.sub_area === "cuina" ? "Cuina" : "Sala"}` : ""}
              </div>
              {b.external_name && <div className="text-xs mt-0.5" style={{ color: COLOR.inkSoft }}>Per a: {b.external_name}{b.external_note ? ` — ${b.external_note}` : ""}</div>}
            </div>
            <button onClick={() => handleCancelSpace(b.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs" style={{ color: COLOR.danger, border: `1px solid ${COLOR.danger}` }}>
              <X size={14} /> Cancel·la
            </button>
          </div>
        );
      })}
    </div>
  );
}
