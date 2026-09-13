import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X, Users } from "lucide-react";
import { COLOR, MODULES, SPACE_START_HOURS, SPACE_DURATIONS, expandDateRange, ymd } from "../config";
import { supabase, getSpaces, getSpaceBookings, createSpaceBooking, cancelSpaceBooking } from "../supabaseClient";
import MonthCalendar from "./MonthCalendar";

function todayStr() { return ymd(new Date()); }

export default function SpaceTab({ moduleKey, spaceIds, identity, showToast }) {
  const style = MODULES[moduleKey];
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);

  const load = useCallback(async () => {
    const [allSpaces, bk] = await Promise.all([getSpaces(), getSpaceBookings(spaceIds, todayStr())]);
    setSpaces(allSpaces.filter(s => spaceIds.includes(s.id)));
    setBookings(bk);
  }, [spaceIds]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`space_bookings_${moduleKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_bookings" }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load, moduleKey]);

  async function handleCreate(payload) {
    const { error } = await createSpaceBooking(payload);
    if (error) showToast("No s'ha pogut reservar (potser xoca amb una altra reserva).");
    else showToast("Reserva feta ✔");
    load();
  }
  async function handleCancel(id) {
    const ok = await cancelSpaceBooking(id);
    showToast(ok ? "Reserva cancel·lada" : "No s'ha pogut cancel·lar.");
    load();
  }

  return (
    <div className="px-5 space-y-4">
      {spaces.map(space => (
        <SpaceCard key={space.id} space={space} style={style} identity={identity}
          bookings={bookings.filter(b => b.room_id === space.id)}
          onCreate={handleCreate} onCancel={handleCancel} />
      ))}
      {spaces.length === 0 && (
        <div className="text-sm rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}`, color: COLOR.inkSoft }}>
          Encara no hi ha cap espai donat d'alta aquí.
        </div>
      )}
    </div>
  );
}

function SpaceCard({ space, style, identity, bookings, onCreate, onCancel }) {
  const isHourly = space.booking_mode === "hourly";
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [date, setDate] = useState(todayStr());
  const [startHour, setStartHour] = useState(SPACE_START_HOURS[0]);
  const [duration, setDuration] = useState(1);
  const [forOther, setForOther] = useState(false);
  const [externalName, setExternalName] = useState("");
  const [externalNote, setExternalNote] = useState("");

  const occupiedDates = useMemo(() => {
    const map = new Map();
    bookings.forEach(b => {
      const label = b.external_name ? `${b.external_name}${isHourly ? ` (${b.start_hour}:00-${b.end_hour}:00)` : ""}` : `Porta ${b.door}`;
      expandDateRange(b.check_in, b.check_out).forEach(d => map.set(d, { color: style.ink, label }));
    });
    return map;
  }, [bookings, style.ink, isHourly]);

  function resetForm() {
    setCheckIn(""); setCheckOut(""); setDate(todayStr()); setStartHour(SPACE_START_HOURS[0]); setDuration(1);
    setForOther(false); setExternalName(""); setExternalNote("");
  }

  function submitNightly() {
    if (!checkIn || !checkOut || checkOut <= checkIn) return;
    const overlap = bookings.some(b => b.check_in < checkOut && b.check_out > checkIn);
    if (overlap) return alert("Ja hi ha una reserva que xoca amb aquestes dates.");
    onCreate({
      room_id: space.id, door: identity.door, email: identity.email,
      check_in: checkIn, check_out: checkOut,
      external_name: forOther ? externalName.trim() || null : null,
      external_note: forOther ? externalNote.trim() || null : null,
    });
    resetForm();
  }

  function submitHourly() {
    const endHour = startHour + Number(duration);
    if (endHour > 24) return alert("L'horari no pot passar de mitjanit.");
    const sameDay = bookings.filter(b => b.check_in === date);
    const overlap = sameDay.some(b => startHour < b.end_hour && b.start_hour < endHour);
    if (overlap) return alert("Ja hi ha una reserva que xoca amb aquest horari.");
    const nextDay = ymd(new Date(new Date(date + "T00:00:00").getTime() + 86400000));
    onCreate({
      room_id: space.id, door: identity.door, email: identity.email,
      check_in: date, check_out: nextDay, start_hour: startHour, end_hour: endHour,
      external_name: forOther ? externalName.trim() || null : null,
      external_note: forOther ? externalNote.trim() || null : null,
    });
    resetForm();
  }

  const sorted = [...bookings].sort((a, b) => a.check_in.localeCompare(b.check_in) || (a.start_hour ?? 0) - (b.start_hour ?? 0));

  return (
    <div className="rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
      <div className="font-bold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: style.ink }}>{space.name}</div>

      <div className="mb-4">
        <MonthCalendar occupiedDates={occupiedDates} accentColor={style.ink} initialDate={todayStr()} />
      </div>

      {sorted.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {sorted.map(b => {
            const isMine = b.door === identity.door;
            const timePart = isHourly ? ` · ${b.start_hour}:00–${b.end_hour}:00` : "";
            const who = b.external_name ? `per a ${b.external_name}` : (isMine ? "tu" : `porta ${b.door}`);
            return (
              <div key={b.id} className="flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5" style={{ background: COLOR.bg }}>
                <span>{isHourly ? b.check_in : `${b.check_in} → ${b.check_out}`}{timePart} · {who}</span>
                {isMine && <button onClick={() => onCancel(b.id)} className="underline" style={{ color: COLOR.danger }}>anul·la</button>}
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-3" style={{ borderTop: `1px solid ${COLOR.line}` }}>
        {isHourly ? (
          <div className="flex flex-wrap items-end gap-2 mb-2">
            <div>
              <label className="block text-[11px] mb-0.5" style={{ color: COLOR.inkSoft }}>Data</label>
              <input type="date" min={todayStr()} value={date} onChange={e => setDate(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-sm" style={{ border: `1px solid ${COLOR.line}` }} />
            </div>
            <div>
              <label className="block text-[11px] mb-0.5" style={{ color: COLOR.inkSoft }}>Hora d'inici</label>
              <select value={startHour} onChange={e => setStartHour(Number(e.target.value))} className="px-2 py-1.5 rounded-lg text-sm" style={{ border: `1px solid ${COLOR.line}` }}>
                {SPACE_START_HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] mb-0.5" style={{ color: COLOR.inkSoft }}>Durada</label>
              <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="px-2 py-1.5 rounded-lg text-sm" style={{ border: `1px solid ${COLOR.line}` }}>
                {SPACE_DURATIONS.map(h => <option key={h} value={h}>{h}h</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-2 mb-2">
            <div>
              <label className="block text-[11px] mb-0.5" style={{ color: COLOR.inkSoft }}>Entrada</label>
              <input type="date" min={todayStr()} value={checkIn} onChange={e => setCheckIn(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-sm" style={{ border: `1px solid ${COLOR.line}` }} />
            </div>
            <div>
              <label className="block text-[11px] mb-0.5" style={{ color: COLOR.inkSoft }}>Sortida</label>
              <input type="date" min={checkIn || todayStr()} value={checkOut} onChange={e => setCheckOut(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-sm" style={{ border: `1px solid ${COLOR.line}` }} />
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-xs mb-2" style={{ color: COLOR.inkSoft }}>
          <input type="checkbox" checked={forOther} onChange={e => setForOther(e.target.checked)} />
          <Users size={14} /> Reservar per a una altra persona o entitat
        </label>

        {forOther && (
          <div className="flex flex-wrap gap-2 mb-2">
            <input value={externalName} onChange={e => setExternalName(e.target.value)} placeholder="Nom de la persona o entitat"
              className="px-2 py-1.5 rounded-lg text-sm flex-1 min-w-[160px]" style={{ border: `1px solid ${COLOR.line}` }} />
            <input value={externalNote} onChange={e => setExternalNote(e.target.value)} placeholder="Breu descripció (p.ex. 'aniversari')"
              className="px-2 py-1.5 rounded-lg text-sm flex-1 min-w-[160px]" style={{ border: `1px solid ${COLOR.line}` }} />
          </div>
        )}

        <button onClick={isHourly ? submitHourly : submitNightly}
          disabled={isHourly ? false : (!checkIn || !checkOut || checkOut <= checkIn)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40" style={{ background: style.ink }}>
          Reserva
        </button>
      </div>
    </div>
  );
}
