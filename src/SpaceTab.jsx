import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X, Users, Trash2 } from "lucide-react";
import { COLOR, MODULES, SPACE_START_HOURS, SPACE_DURATIONS, expandDateRange, ymd, rangesOverlap } from "../config";
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
    if (error) { showToast("No s'ha pogut reservar (potser xoca amb una altra reserva)."); return false; }
    showToast("Reserva feta ✔");
    load();
    return true;
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
  const [modalDate, setModalDate] = useState(null);

  const occupiedDates = useMemo(() => {
    const map = new Map();
    bookings.forEach(b => {
      const label = b.external_name ? `${b.external_name}${isHourly ? ` (${b.start_hour}:00-${b.end_hour}:00)` : ""}` : `Porta ${b.door}`;
      expandDateRange(b.check_in, b.check_out).forEach(d => {
        const prev = map.get(d);
        map.set(d, { color: style.ink, label: prev ? `${prev.label}, ${label}` : label });
      });
    });
    return map;
  }, [bookings, style.ink, isHourly]);

  const sorted = [...bookings].sort((a, b) => a.check_in.localeCompare(b.check_in) || (a.start_hour ?? 0) - (b.start_hour ?? 0));

  return (
    <div className="rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
      <div className="font-bold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: style.ink }}>{space.name}</div>

      <MonthCalendar occupiedDates={occupiedDates} accentColor={style.ink} initialDate={todayStr()} onDayClick={setModalDate} />
      <p className="text-[11px] mt-2 text-center" style={{ color: COLOR.inkSoft }}>Toca un dia per reservar-lo o veure'n el detall</p>

      {sorted.length > 0 && (
        <div className="space-y-1.5 mt-4 pt-3" style={{ borderTop: `1px solid ${COLOR.line}` }}>
          <div className="text-[11px] font-semibold uppercase" style={{ color: COLOR.inkSoft }}>Properes reserves</div>
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

      {modalDate && (
        <BookingModal
          space={space} style={style} isHourly={isHourly} date={modalDate} identity={identity}
          bookingsForDate={bookings.filter(b => isHourly ? b.check_in === modalDate : (b.check_in <= modalDate && b.check_out > modalDate))}
          onCreate={onCreate} onCancel={onCancel}
          onClose={() => setModalDate(null)}
        />
      )}
    </div>
  );
}

function BookingModal({ space, style, isHourly, date, identity, bookingsForDate, onCreate, onCancel, onClose }) {
  const [checkOut, setCheckOut] = useState("");
  const [startHour, setStartHour] = useState(null);
  const [duration, setDuration] = useState(1);
  const [forOther, setForOther] = useState(false);
  const [externalName, setExternalName] = useState("");
  const [externalNote, setExternalNote] = useState("");
  const [saving, setSaving] = useState(false);

  const mineBookingsToday = bookingsForDate.filter(b => b.door === identity.door);
  const othersBookingsToday = bookingsForDate.filter(b => b.door !== identity.door);

  function isHourFree(h, dur) {
    const s = h * 60, e = s + dur * 60;
    if (e > 24 * 60) return false;
    return !bookingsForDate.some(b => rangesOverlap(s, e, b.start_hour * 60, b.end_hour * 60));
  }
  const availableStartHours = isHourly ? SPACE_START_HOURS.filter(h => isHourFree(h, 1)) : [];
  const availableDurations = isHourly && startHour !== null ? SPACE_DURATIONS.filter(d => isHourFree(startHour, d)) : [];

  const nightlyBlocked = !isHourly && bookingsForDate.length > 0;

  async function submit() {
    setSaving(true);
    let ok;
    if (isHourly) {
      const endHour = startHour + duration;
      ok = await onCreate({
        room_id: space.id, door: identity.door, email: identity.email,
        check_in: date, check_out: ymd(new Date(new Date(date + "T00:00:00").getTime() + 86400000)),
        start_hour: startHour, end_hour: endHour,
        external_name: forOther ? externalName.trim() || null : null,
        external_note: forOther ? externalNote.trim() || null : null,
      });
    } else {
      ok = await onCreate({
        room_id: space.id, door: identity.door, email: identity.email,
        check_in: date, check_out: checkOut,
        external_name: forOther ? externalName.trim() || null : null,
        external_note: forOther ? externalNote.trim() || null : null,
      });
    }
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(21,36,38,0.45)" }} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto" style={{ background: COLOR.surface }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif", color: style.ink }}>{date}</span>
          <button onClick={onClose}><X size={20} style={{ color: COLOR.inkSoft }} /></button>
        </div>
        <p className="text-xs mb-4" style={{ color: COLOR.inkSoft }}>{space.name}</p>

        {othersBookingsToday.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {othersBookingsToday.map(b => (
              <div key={b.id} className="text-xs rounded-lg px-2.5 py-1.5" style={{ background: COLOR.bg }}>
                Ocupat{isHourly ? ` (${b.start_hour}:00–${b.end_hour}:00)` : ""}: {b.external_name ? `per a ${b.external_name}` : `porta ${b.door}`}
              </div>
            ))}
          </div>
        )}

        {mineBookingsToday.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {mineBookingsToday.map(b => (
              <div key={b.id} className="flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5" style={{ background: style.bg, color: style.ink }}>
                <span>La teva reserva{isHourly ? ` (${b.start_hour}:00–${b.end_hour}:00)` : ` (fins ${b.check_out})`}{b.external_name ? ` — per a ${b.external_name}` : ""}</span>
                <button onClick={() => { onCancel(b.id); onClose(); }} className="flex items-center gap-1 shrink-0" style={{ color: COLOR.danger }}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}

        {isHourly ? (
          availableStartHours.length === 0 ? (
            <p className="text-sm" style={{ color: COLOR.inkSoft }}>No queden hores lliures aquest dia.</p>
          ) : (
            <>
              <label className="block text-xs font-medium mb-1" style={{ color: COLOR.inkSoft }}>Hora d'inici</label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {availableStartHours.map(h => (
                  <button key={h} onClick={() => { setStartHour(h); setDuration(1); }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                    style={startHour === h ? { background: style.ink, color: "#fff" } : { background: COLOR.bg, border: `1.5px solid ${style.ink}`, color: style.ink }}>
                    {h}:00
                  </button>
                ))}
              </div>
              {startHour !== null && (
                <>
                  <label className="block text-xs font-medium mb-1" style={{ color: COLOR.inkSoft }}>Durada</label>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {SPACE_DURATIONS.map(d => {
                      const free = availableDurations.includes(d);
                      return (
                        <button key={d} disabled={!free} onClick={() => setDuration(d)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30"
                          style={duration === d ? { background: style.ink, color: "#fff" } : { background: COLOR.bg, border: `1.5px solid ${style.ink}`, color: style.ink }}>
                          {d}h
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )
        ) : nightlyBlocked ? (
          <p className="text-sm mb-3" style={{ color: COLOR.inkSoft }}>Aquest dia ja està ocupat. Tria un altre dia d'entrada.</p>
        ) : (
          <>
            <label className="block text-xs font-medium mb-1" style={{ color: COLOR.inkSoft }}>Data de sortida</label>
            <input type="date" min={ymd(new Date(new Date(date + "T00:00:00").getTime() + 86400000))} value={checkOut}
              onChange={e => setCheckOut(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm mb-4 w-full" style={{ border: `1px solid ${COLOR.line}` }} />
          </>
        )}

        {((isHourly && startHour !== null) || (!isHourly && !nightlyBlocked && checkOut)) && (
          <>
            <label className="flex items-center gap-2 text-xs mb-2" style={{ color: COLOR.inkSoft }}>
              <input type="checkbox" checked={forOther} onChange={e => setForOther(e.target.checked)} />
              <Users size={14} /> Reservar per a una altra persona o entitat
            </label>
            {forOther && (
              <div className="flex flex-col gap-2 mb-3">
                <input value={externalName} onChange={e => setExternalName(e.target.value)} placeholder="Nom de la persona o entitat"
                  className="px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${COLOR.line}` }} />
                <input value={externalNote} onChange={e => setExternalNote(e.target.value)} placeholder="Breu descripció (p.ex. 'aniversari')"
                  className="px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${COLOR.line}` }} />
              </div>
            )}
            <button onClick={submit} disabled={saving}
              className="w-full px-4 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-50" style={{ background: style.ink }}>
              {saving ? "Reservant…" : "Confirma la reserva"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
