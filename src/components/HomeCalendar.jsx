import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { COLOR, MODULES, SPACE_MODULE, WEEKDAYS_CA, MONTHS_CA, formatMinutes, expandDateRange, ymd } from "../config";
import { getSpaces, getSpaceBookings } from "../supabaseClient";
import { onTableChange } from "../realtime";

function todayStr() { return ymd(new Date()); }

export default function HomeCalendar() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [popupDate, setPopupDate] = useState(null);

  const load = useCallback(async () => {
    const spacesData = await getSpaces();
    setSpaces(spacesData);
    const ids = spacesData.map(s => s.id).filter(id => SPACE_MODULE[id]);
    if (ids.length === 0) { setBookings([]); return; }
    const bk = await getSpaceBookings(ids, todayStr());
    setBookings(bk);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = onTableChange("room_bookings", load);
    return () => unsubscribe();
  }, [load]);

  const dayMap = useMemo(() => {
    const map = new Map();
    bookings.forEach(b => {
      const moduleKey = SPACE_MODULE[b.room_id];
      if (!moduleKey) return;
      expandDateRange(b.check_in, b.check_out).forEach(d => {
        const entry = map.get(d) || { colors: new Map(), bookings: [] };
        entry.colors.set(moduleKey, MODULES[moduleKey].ink);
        entry.bookings.push(b);
        map.set(d, entry);
      });
    });
    return map;
  }, [bookings]);

  const year = cursor.getFullYear(), month = cursor.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayStr();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Llistat del mes visible, ordenat per dia
  const monthEntries = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return [...dayMap.entries()]
      .filter(([date]) => date.startsWith(prefix))
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [dayMap, year, month]);

  return (
    <div className="px-5 mt-2 mb-2">
      <div className="rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft size={16} style={{ color: COLOR.inkSoft }} /></button>
          <span className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{MONTHS_CA[month]} {year}</span>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight size={16} style={{ color: COLOR.inkSoft }} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-1" style={{ color: COLOR.inkSoft }}>
          {WEEKDAYS_CA.map(w => <div key={w}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const entry = dayMap.get(dateKey);
            const isToday = dateKey === today;
            return (
              <button key={i} onClick={() => entry && setPopupDate(dateKey)}
                className="aspect-square flex flex-col items-center justify-center rounded-lg text-xs"
                style={{ background: COLOR.bg, border: isToday ? `2px solid ${COLOR.ink}` : "2px solid transparent", cursor: entry ? "pointer" : "default" }}>
                <span>{d}</span>
                {entry && entry.colors.size > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {[...entry.colors.values()].map((c, idx) => (
                      <span key={idx} style={{ width: 5, height: 5, borderRadius: 999, background: c, display: "inline-block" }} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-[11px]" style={{ color: COLOR.inkSoft }}>
          <Legend color={MODULES.hostes.ink} label="Hostes" />
          <Legend color={MODULES.polivalent.ink} label="Sala Polivalent" />
          <Legend color={MODULES.moviment.ink} label="Sala de Moviment" />
        </div>

        {monthEntries.length > 0 && (
          <div className="mt-4 pt-3 space-y-1.5" style={{ borderTop: `1px solid ${COLOR.line}` }}>
            <div className="text-[11px] font-semibold uppercase" style={{ color: COLOR.inkSoft }}>Reserves d'aquest mes</div>
            {monthEntries.map(([date, entry]) => (
              <button key={date} onClick={() => setPopupDate(date)} className="w-full text-left flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5" style={{ background: COLOR.bg }}>
                <span>{date}</span>
                <div className="flex gap-1">
                  {[...entry.colors.values()].map((c, idx) => <span key={idx} style={{ width: 6, height: 6, borderRadius: 999, background: c, display: "inline-block" }} />)}
                  <span style={{ color: COLOR.inkSoft }}>{entry.bookings.length}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {popupDate && (
        <DayPopup date={popupDate} entry={dayMap.get(popupDate)} spaces={spaces} onClose={() => setPopupDate(null)} />
      )}
    </div>
  );
}

function DayPopup({ date, entry, spaces, onClose }) {
  const bookings = entry?.bookings ?? [];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(21,36,38,0.45)" }} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[80vh] overflow-y-auto" style={{ background: COLOR.surface }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{date}</span>
          <button onClick={onClose}><X size={20} style={{ color: COLOR.inkSoft }} /></button>
        </div>
        <div className="space-y-2">
          {bookings.map(b => {
            const moduleKey = SPACE_MODULE[b.room_id];
            const style = MODULES[moduleKey];
            const space = spaces.find(s => s.id === b.room_id);
            const isHourly = b.start_min != null;
            const who = b.external_name ? `per a ${b.external_name}` : (b.nickname || `porta ${b.door}`);
            return (
              <div key={b.id} className="rounded-xl p-3" style={{ background: style?.bg || COLOR.bg }}>
                <div className="text-[10px] font-semibold uppercase mb-0.5" style={{ color: style?.ink }}>{style?.label}</div>
                <div className="text-sm font-semibold">{space?.name ?? "Espai"}</div>
                <div className="text-xs" style={{ color: COLOR.inkSoft }}>
                  {isHourly ? `${formatMinutes(b.start_min)}–${formatMinutes(b.end_min)}` : `${b.check_in} → ${b.check_out}`} · {who}
                  {b.sub_area && b.sub_area !== "tot" ? ` · ${b.sub_area === "cuina" ? "Cuina" : "Sala"}` : ""}
                </div>
                {b.external_note && <div className="text-xs mt-0.5" style={{ color: COLOR.inkSoft }}>{b.external_note}</div>}
              </div>
            );
          })}
          {bookings.length === 0 && <p className="text-sm" style={{ color: COLOR.inkSoft }}>Sense reserves aquest dia.</p>}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1">
      <span style={{ width: 8, height: 8, borderRadius: 999, background: color, display: "inline-block" }} />
      {label}
    </div>
  );
}
