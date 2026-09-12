import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Droplets } from "lucide-react";
import { COLOR, FLOORS, START_HOURS, CLOSE_HOUR, buildDates, rangesOverlap } from "../config";
import { supabase, getMachines, getBookings, createBooking, cancelBooking, finishBooking } from "../supabaseClient";

const DATES = buildDates();

function formatRange(startHour, durationMinutes) {
  const endTotal = startHour * 60 + durationMinutes;
  const endH = Math.floor(endTotal / 60), endM = endTotal % 60;
  return `${startHour}:00–${endH}:${String(endM).padStart(2, "0")}`;
}

export default function LaundryTab({ identity, showToast }) {
  const [dateIdx, setDateIdx] = useState(0);
  const [floorIdx, setFloorIdx] = useState(() => {
    const fi = FLOORS.findIndex(f => f.zones.some(z => z.id === identity.zone));
    return fi >= 0 ? fi : 0;
  });
  const [machines, setMachines] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [now, setNow] = useState(new Date());

  const dateKey = DATES[dateIdx].key;
  const todayKey = DATES[0].key;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const loadBookings = useCallback(async () => {
    const rows = await getBookings(DATES[0].key, DATES[DATES.length - 1].key);
    setBookings(rows);
  }, []);

  useEffect(() => {
    getMachines().then(setMachines);
    loadBookings();
    const clock = setInterval(() => setNow(new Date()), 30000);
    const channel = supabase
      .channel("bookings_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => loadBookings())
      .subscribe();
    return () => { clearInterval(clock); supabase.removeChannel(channel); };
  }, [loadBookings]);

  async function handleCreate(payload) {
    const { error } = await createBooking(payload);
    if (error) showToast("No s'ha pogut reservar (potser algú s'ha avançat).");
    else showToast("Torn reservat ✔");
    loadBookings();
  }
  async function handleCancel(id) {
    const ok = await cancelBooking(id);
    showToast(ok ? "Reserva cancel·lada" : "No s'ha pogut cancel·lar.");
    loadBookings();
  }
  async function handleFinish(id) {
    const ok = await finishBooking(id);
    showToast(ok ? "Avisat! Ja pots estendre la roba 🧺" : "No s'ha pogut avisar.");
    loadBookings();
  }

  const floor = FLOORS[floorIdx];

  return (
    <div className="px-5">
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {DATES.map((d, i) => (
          <button key={d.key} onClick={() => setDateIdx(i)}
            className="px-3 py-2 rounded-xl text-sm shrink-0"
            style={dateIdx === i ? { background: COLOR.ink, color: "#fff" } : { background: COLOR.surface, border: `1px solid ${COLOR.line}`, color: COLOR.inkSoft }}>
            {d.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {FLOORS.map((f, i) => (
          <button key={f.id} onClick={() => setFloorIdx(i)}
            className="px-3 py-1.5 rounded-full text-sm font-medium"
            style={floorIdx === i ? { background: COLOR.soap, color: COLOR.ink } : { background: COLOR.surface, border: `1px solid ${COLOR.line}`, color: COLOR.inkSoft }}>
            {f.name}
          </button>
        ))}
      </div>

      {floor.zones.map(zone => (
        <div key={zone.id} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{zone.name}</div>
            {identity.zone === zone.id && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: COLOR.water, color: "#fff" }}>La teva zona</span>}
          </div>
          {machines.filter(m => m.zone_id === zone.id).map(machine => (
            <MachineCard key={machine.id}
              machine={machine} dateKey={dateKey} todayKey={todayKey} nowMinutes={nowMinutes}
              bookingsForMachine={bookings.filter(b => b.machine_id === machine.id && b.booking_date === dateKey)}
              identity={identity}
              onCreate={handleCreate} onCancel={handleCancel} onFinish={handleFinish} />
          ))}
          {machines.filter(m => m.zone_id === zone.id).length === 0 && (
            <div className="text-sm rounded-xl p-3" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}`, color: COLOR.inkSoft }}>
              Encara no hi ha rentadores donades d'alta en aquesta zona.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MachineCard({ machine, dateKey, todayKey, nowMinutes, bookingsForMachine, identity, onCreate, onCancel, onFinish }) {
  const [selHour, setSelHour] = useState(null);

  const activeBookings = useMemo(() => bookingsForMachine.filter(b => b.status === "reservado"), [bookingsForMachine]);

  function isFree(h, durationMin) {
    if (dateKey < todayKey) return false;
    if (dateKey === todayKey && h < Math.floor(nowMinutes / 60)) return false;
    const s = h * 60, e = s + durationMin;
    if (e > CLOSE_HOUR * 60) return false;
    return !activeBookings.some(b => rangesOverlap(s, e, b.start_hour * 60, b.start_hour * 60 + b.duration_minutes));
  }

  const bookableHours = START_HOURS.filter(h => isFree(h, machine.short_minutes));
  const longFree = selHour !== null ? isFree(selHour, machine.long_minutes) : false;

  function confirm(durationMinutes) {
    onCreate({
      machine_id: machine.id,
      door: identity.door,
      email: identity.email,
      booking_date: dateKey,
      start_hour: selHour,
      duration_minutes: durationMinutes,
    });
    setSelHour(null);
  }

  const sortedBookings = [...bookingsForMachine].sort((a, b) => a.start_hour - b.start_hour);

  return (
    <div className="rounded-2xl p-3 mb-3" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-sm flex items-center gap-1">
          <Droplets size={14} style={{ color: COLOR.water }} />
          Rentadora núm. {machine.machine_number}{machine.brand ? ` · ${machine.brand}` : ""}
        </div>
        <span className="text-[11px]" style={{ color: COLOR.inkSoft }}>{machine.short_minutes}/{machine.long_minutes} min</span>
      </div>

      {sortedBookings.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {sortedBookings.map(b => {
            const start = b.start_hour * 60, end = start + b.duration_minutes;
            const isNow = dateKey === todayKey && nowMinutes >= start && nowMinutes < end;
            const isPast = dateKey < todayKey || (dateKey === todayKey && nowMinutes >= end);
            const isMine = b.door === identity.door;
            let bg = COLOR.soap, fg = COLOR.ink, label = "Reservada";
            if (b.status === "finalizado") { bg = COLOR.success; fg = "#fff"; label = "Acabada"; }
            else if (isNow) { bg = COLOR.danger; fg = "#fff"; label = "En curs"; }
            else if (isPast) { bg = "#C7CFCD"; fg = "#6b7776"; label = "Passada"; }
            const canCancel = isMine && b.status === "reservado" && !isPast;
            const canFinish = isMine && b.status === "reservado" && (isNow || isPast);
            return (
              <div key={b.id} className="rounded-lg px-2 py-1 text-[11px] flex items-center gap-2" style={{ background: bg, color: fg }}>
                <span>{formatRange(b.start_hour, b.duration_minutes)} · {isMine ? "tu" : `porta ${b.door}`} · {label}</span>
                {canFinish && <button onClick={() => onFinish(b.id)} className="underline">llest</button>}
                {canCancel && <button onClick={() => onCancel(b.id)} className="underline">anul·la</button>}
              </div>
            );
          })}
        </div>
      )}

      {selHour === null ? (
        bookableHours.length === 0 ? (
          <div className="text-xs" style={{ color: COLOR.inkSoft }}>Sense hores lliures per avui en aquesta rentadora.</div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {bookableHours.map(h => (
              <button key={h} onClick={() => setSelHour(h)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: COLOR.bg, border: `1.5px solid ${COLOR.water}`, color: COLOR.waterDark }}>
                {h}:00
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: COLOR.inkSoft }}>A les {selHour}:00 —</span>
          <button onClick={() => confirm(machine.short_minutes)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: COLOR.water }}>
            Curt ({machine.short_minutes} min)
          </button>
          <button disabled={!longFree} onClick={() => confirm(machine.long_minutes)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40" style={{ background: COLOR.waterDark }}>
            Llarg ({machine.long_minutes} min)
          </button>
          <button onClick={() => setSelHour(null)} className="text-xs" style={{ color: COLOR.inkSoft }}>Cancel·la</button>
        </div>
      )}
    </div>
  );
}
