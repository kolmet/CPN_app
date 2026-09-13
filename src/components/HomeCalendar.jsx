import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COLOR, MODULES, SPACE_MODULE, WEEKDAYS_CA, MONTHS_CA, expandDateRange, ymd } from "../config";
import { supabase, getSpaces, getSpaceBookings } from "../supabaseClient";

function todayStr() { return ymd(new Date()); }

export default function HomeCalendar() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [dayMap, setDayMap] = useState(new Map());

  const load = useCallback(async () => {
    const spaces = await getSpaces();
    const ids = spaces.map(s => s.id).filter(id => SPACE_MODULE[id]);
    if (ids.length === 0) { setDayMap(new Map()); return; }
    const bookings = await getSpaceBookings(ids, todayStr());
    const map = new Map();
    bookings.forEach(b => {
      const moduleKey = SPACE_MODULE[b.room_id];
      if (!moduleKey) return;
      const color = MODULES[moduleKey].ink;
      expandDateRange(b.check_in, b.check_out).forEach(d => {
        const entry = map.get(d) || new Map();
        entry.set(moduleKey, color);
        map.set(d, entry);
      });
    });
    setDayMap(map);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("home_calendar_bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "room_bookings" }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  const year = cursor.getFullYear(), month = cursor.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayStr();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

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
              <div key={i} className="aspect-square flex flex-col items-center justify-center rounded-lg text-xs"
                style={{ background: COLOR.bg, border: isToday ? `2px solid ${COLOR.ink}` : "2px solid transparent" }}>
                <span>{d}</span>
                {entry && entry.size > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {[...entry.values()].map((c, idx) => (
                      <span key={idx} style={{ width: 5, height: 5, borderRadius: 999, background: c, display: "inline-block" }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-[11px]" style={{ color: COLOR.inkSoft }}>
          <Legend color={MODULES.hostes.ink} label="Hostes" />
          <Legend color={MODULES.polivalent.ink} label="Sala Polivalent" />
          <Legend color={MODULES.moviment.ink} label="Sala de Moviment" />
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
