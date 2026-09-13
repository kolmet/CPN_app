import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X, Users, Trash2 } from "lucide-react";
import { COLOR, MODULES, SPACE_START_MINUTES, SPACE_DURATIONS_MIN, SPACE_SUB_AREAS, formatMinutes, formatDuration, expandDateRange, ymd, rangesOverlap } from "../config";
import { supabase, getSpaces, getSpaceBookings, createSpaceBooking, cancelSpaceBooking, cancelRecurrence } from "../supabaseClient";
import MonthCalendar from "./MonthCalendar";

function todayStr() { return ymd(new Date()); }

// Dues reserves d'un mateix dia xoquen si se superposen en el temps I,
// quan hi ha sub-àrees (Cuina/Sala/Tot), afecten la mateixa part de l'espai.
function subAreasClash(a, b) {
  if (!a || !b) return true; // sense sub-àrees: qualsevol reserva ocupa tot l'espai
  if (a === "tot" || b === "tot") return true;
  return a === b;
}

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
  async function handleCreateMany(payloads) {
    let ok = 0, fail = 0;
    for (const p of payloads) {
      const { error } = await createSpaceBooking(p);
      if (error) fail++; else ok++;
    }
    if (ok > 0) showToast(`${ok} reserva${ok > 1 ? "s" : ""} creada${ok > 1 ? "es" : ""}${fail > 0 ? `, ${fail} van xocar amb una altra reserva` : ""} ✔`);
    else showToast("No s'ha pogut crear cap reserva (totes xocaven amb una altra).");
    load();
    return ok > 0;
  }
  async function handleCancel(id) {
    const ok = await cancelSpaceBooking(id);
    showToast(ok ? "Reserva cancel·lada" : "No s'ha pogut cancel·lar.");
    load();
  }
  async function handleCancelRecurrence(recurrenceId) {
    const ok = await cancelRecurrence(recurrenceId, identity.door);
    showToast(ok ? "Totes les repeticions cancel·lades" : "No s'ha pogut cancel·lar.");
    load();
  }

  return (
    <div className="px-5 space-y-4">
      {spaces.map(space => (
        <SpaceCard key={space.id} space={space} style={style} identity={identity}
          bookings={bookings.filter(b => b.room_id === space.id)}
          onCreate={handleCreate} onCreateMany={handleCreateMany} onCancel={handleCancel} onCancelRecurrence={handleCancelRecurrence} />
      ))}
      {spaces.length === 0 && (
        <div className="text-sm rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}`, color: COLOR.inkSoft }}>
          Encara no hi ha cap espai donat d'alta aquí.
        </div>
      )}
    </div>
  );
}

function SpaceCard({ space, style, identity, bookings, onCreate, onCreateMany, onCancel, onCancelRecurrence }) {
  const isHourly = space.booking_mode === "hourly";
  const subAreas = SPACE_SUB_AREAS[space.id] || null;
  const [modalDate, setModalDate] = useState(null);

  const occupiedDates = useMemo(() => {
    const map = new Map();
    bookings.forEach(b => {
      const who = b.external_name ? `per a ${b.external_name}` : (b.nickname || `Porta ${b.door}`);
      const areaTag = b.sub_area && b.sub_area !== "tot" ? ` (${subAreas?.find(a => a.id === b.sub_area)?.name || b.sub_area})` : "";
      const time = isHourly ? ` ${formatMinutes(b.start_min)}-${formatMinutes(b.end_min)}` : "";
      const label = `${who}${areaTag}${time}`;
      expandDateRange(b.check_in, b.check_out).forEach(d => {
        const prev = map.get(d);
        map.set(d, { color: style.ink, label: prev ? `${prev.label}, ${label}` : label });
      });
    });
    return map;
  }, [bookings, style.ink, isHourly, subAreas]);

  const sorted = [...bookings].sort((a, b) => a.check_in.localeCompare(b.check_in) || (a.start_min ?? 0) - (b.start_min ?? 0));

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
            const timePart = isHourly ? ` · ${formatMinutes(b.start_min)}–${formatMinutes(b.end_min)}` : "";
            const areaPart = b.sub_area && b.sub_area !== "tot" ? ` · ${subAreas?.find(a => a.id === b.sub_area)?.name || b.sub_area}` : "";
            const who = b.external_name ? `per a ${b.external_name}` : (isMine ? "tu" : (b.nickname || `porta ${b.door}`));
            const notePart = b.external_note ? ` — ${b.external_note}` : "";
            return (
              <div key={b.id} className="flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5" style={{ background: COLOR.bg }}>
                <span>{isHourly ? b.check_in : `${b.check_in} → ${b.check_out}`}{timePart}{areaPart} · {who}{notePart}{b.recurrence_id ? " · repetitiva" : ""}</span>
                {isMine && (
                  <span className="flex items-center gap-2 shrink-0">
                    <button onClick={() => onCancel(b.id)} className="underline" style={{ color: COLOR.danger }}>anul·la</button>
                    {b.recurrence_id && <button onClick={() => onCancelRecurrence(b.recurrence_id)} className="underline" style={{ color: COLOR.danger }}>anul·la totes</button>}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalDate && (
        <BookingModal
          space={space} style={style} isHourly={isHourly} subAreas={subAreas} date={modalDate} identity={identity}
          bookingsForDate={bookings.filter(b => isHourly ? b.check_in === modalDate : (b.check_in <= modalDate && b.check_out > modalDate))}
          onCreate={onCreate} onCreateMany={onCreateMany} onCancel={onCancel}
          onClose={() => setModalDate(null)}
        />
      )}
    </div>
  );
}

function BookingModal({ space, style, isHourly, subAreas, date, identity, bookingsForDate, onCreate, onCreateMany, onCancel, onClose }) {
  const [checkOut, setCheckOut] = useState("");
  const [subArea, setSubArea] = useState(subAreas ? null : "tot");
  const [startMin, setStartMin] = useState(null);
  const [duration, setDuration] = useState(30);
  const [activityNote, setActivityNote] = useState("");
  const [forOther, setForOther] = useState(false);
  const [externalName, setExternalName] = useState("");
  const [externalNote, setExternalNote] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState("");
  const [saving, setSaving] = useState(false);

  const mineBookingsToday = bookingsForDate.filter(b => b.door === identity.door);
  const othersBookingsToday = bookingsForDate.filter(b => b.door !== identity.door);

  // Reserves que xoquen amb la sub-àrea que s'està mirant ara mateix
  const relevantBookings = useMemo(
    () => bookingsForDate.filter(b => subAreasClash(b.sub_area, subArea)),
    [bookingsForDate, subArea]
  );

  function isMinFree(s, dur) {
    const e = s + dur;
    if (e > 23 * 60) return false;
    return !relevantBookings.some(b => rangesOverlap(s, e, b.start_min, b.end_min));
  }
  const availableStarts = isHourly && subArea ? SPACE_START_MINUTES.filter(s => isMinFree(s, 30)) : [];
  const availableDurations = isHourly && subArea && startMin !== null ? SPACE_DURATIONS_MIN.filter(d => isMinFree(startMin, d)) : [];

  const nightlyBlocked = !isHourly && bookingsForDate.length > 0;

  async function submit() {
    setSaving(true);
    let ok;
    const note = isHourly ? (activityNote.trim() || null) : (forOther ? (externalNote.trim() || null) : null);
    if (isHourly) {
      const endMin = startMin + duration;
      const basePayload = {
        room_id: space.id, door: identity.door, nickname: identity.nickname,
        start_min: startMin, end_min: endMin,
        sub_area: subAreas ? subArea : null,
        external_name: forOther ? externalName.trim() || null : null,
        external_note: note,
      };
      if (repeatWeekly && repeatUntil) {
        const recurrenceId = crypto.randomUUID();
        const dates = [];
        let d = new Date(date + "T00:00:00");
        const until = new Date(repeatUntil + "T00:00:00");
        while (d <= until && dates.length < 52) {
          dates.push(ymd(d));
          d.setDate(d.getDate() + 7);
        }
        const payloads = dates.map(dt => ({
          ...basePayload,
          check_in: dt,
          check_out: ymd(new Date(new Date(dt + "T00:00:00").getTime() + 86400000)),
          recurrence_id: recurrenceId,
        }));
        ok = await onCreateMany(payloads);
      } else {
        ok = await onCreate({
          ...basePayload,
          check_in: date, check_out: ymd(new Date(new Date(date + "T00:00:00").getTime() + 86400000)),
        });
      }
    } else {
      ok = await onCreate({
        room_id: space.id, door: identity.door, nickname: identity.nickname,
        check_in: date, check_out: checkOut,
        external_name: forOther ? externalName.trim() || null : null,
        external_note: note,
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
                Ocupat{isHourly ? ` (${formatMinutes(b.start_min)}–${formatMinutes(b.end_min)})` : ""}
                {b.sub_area && b.sub_area !== "tot" ? ` · ${subAreas?.find(a => a.id === b.sub_area)?.name}` : ""}
                : {b.external_name ? `per a ${b.external_name}` : (b.nickname || `porta ${b.door}`)}{b.external_note ? ` — ${b.external_note}` : ""}
              </div>
            ))}
          </div>
        )}

        {mineBookingsToday.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {mineBookingsToday.map(b => (
              <div key={b.id} className="flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5" style={{ background: style.bg, color: style.ink }}>
                <span>La teva reserva{isHourly ? ` (${formatMinutes(b.start_min)}–${formatMinutes(b.end_min)})` : ` (fins ${b.check_out})`}{b.sub_area && b.sub_area !== "tot" ? ` · ${subAreas?.find(a => a.id === b.sub_area)?.name}` : ""}{b.external_name ? ` — per a ${b.external_name}` : ""}</span>
                <button onClick={() => { onCancel(b.id); onClose(); }} className="flex items-center gap-1 shrink-0" style={{ color: COLOR.danger }}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}

        {isHourly && subAreas && (
          <>
            <label className="block text-xs font-medium mb-1" style={{ color: COLOR.inkSoft }}>Quin espai?</label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {subAreas.map(a => (
                <button key={a.id} onClick={() => { setSubArea(a.id); setStartMin(null); }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                  style={subArea === a.id ? { background: style.ink, color: "#fff" } : { background: COLOR.bg, border: `1.5px solid ${style.ink}`, color: style.ink }}>
                  {a.name}
                </button>
              ))}
            </div>
          </>
        )}

        {isHourly ? (
          !subArea ? null : availableStarts.length === 0 ? (
            <p className="text-sm" style={{ color: COLOR.inkSoft }}>No queden hores lliures aquest dia per a aquesta opció.</p>
          ) : (
            <>
              <label className="block text-xs font-medium mb-1" style={{ color: COLOR.inkSoft }}>Hora d'inici</label>
              <div className="flex flex-wrap gap-1.5 mb-3 max-h-32 overflow-y-auto">
                {availableStarts.map(s => (
                  <button key={s} onClick={() => { setStartMin(s); setDuration(30); }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                    style={startMin === s ? { background: style.ink, color: "#fff" } : { background: COLOR.bg, border: `1.5px solid ${style.ink}`, color: style.ink }}>
                    {formatMinutes(s)}
                  </button>
                ))}
              </div>
              {startMin !== null && (
                <>
                  <label className="block text-xs font-medium mb-1" style={{ color: COLOR.inkSoft }}>Durada</label>
                  <div className="flex flex-wrap gap-1.5 mb-4 max-h-28 overflow-y-auto">
                    {SPACE_DURATIONS_MIN.map(d => {
                      const free = availableDurations.includes(d);
                      return (
                        <button key={d} disabled={!free} onClick={() => setDuration(d)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30"
                          style={duration === d ? { background: style.ink, color: "#fff" } : { background: COLOR.bg, border: `1.5px solid ${style.ink}`, color: style.ink }}>
                          {formatDuration(d)}
                        </button>
                      );
                    })}
                  </div>
                  <label className="block text-xs font-medium mb-1" style={{ color: COLOR.inkSoft }}>De què es tracta? (opcional)</label>
                  <input value={activityNote} onChange={e => setActivityNote(e.target.value)} placeholder="p.ex. 'assemblea', 'ioga', 'festa d'aniversari'"
                    className="px-3 py-2 rounded-lg text-sm mb-4 w-full" style={{ border: `1px solid ${COLOR.line}` }} />
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

        {((isHourly && startMin !== null) || (!isHourly && !nightlyBlocked && checkOut)) && (
          <>
            {isHourly && (
              <>
                <label className="flex items-center gap-2 text-xs mb-2" style={{ color: COLOR.inkSoft }}>
                  <input type="checkbox" checked={repeatWeekly} onChange={e => setRepeatWeekly(e.target.checked)} />
                  Repeteix cada setmana (mateix dia i hora)
                </label>
                {repeatWeekly && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-1" style={{ color: COLOR.inkSoft }}>Fins a quina data</label>
                    <input type="date" min={date} value={repeatUntil} onChange={e => setRepeatUntil(e.target.value)}
                      className="px-3 py-2 rounded-lg text-sm w-full" style={{ border: `1px solid ${COLOR.line}` }} />
                  </div>
                )}
              </>
            )}
            <label className="flex items-center gap-2 text-xs mb-2" style={{ color: COLOR.inkSoft }}>
              <input type="checkbox" checked={forOther} onChange={e => setForOther(e.target.checked)} />
              <Users size={14} /> Reservar per a una altra persona o entitat
            </label>
            {forOther && (
              <div className="flex flex-col gap-2 mb-3">
                <input value={externalName} onChange={e => setExternalName(e.target.value)} placeholder="Nom de la persona o entitat"
                  className="px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${COLOR.line}` }} />
                {!isHourly && (
                  <input value={externalNote} onChange={e => setExternalNote(e.target.value)} placeholder="Breu descripció (p.ex. 'aniversari')"
                    className="px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${COLOR.line}` }} />
                )}
              </div>
            )}
            <button onClick={submit} disabled={saving || (repeatWeekly && !repeatUntil)}
              className="w-full px-4 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-50" style={{ background: style.ink }}>
              {saving ? "Reservant…" : repeatWeekly ? "Confirma totes les reserves" : "Confirma la reserva"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
