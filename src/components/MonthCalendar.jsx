import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COLOR, WEEKDAYS_CA, MONTHS_CA, ymd } from "../config";

// occupiedDates: Map<'YYYY-MM-DD', { color?: string, label?: string }>
// o simplement un Set de dates si totes es pinten igual.
export default function MonthCalendar({ occupiedDates, accentColor = COLOR.water, initialDate }) {
  const [cursor, setCursor] = useState(() => {
    const d = initialDate ? new Date(initialDate + "T00:00:00") : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const today = ymd(new Date());
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // dilluns=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function isOccupied(dateKey) {
    if (!occupiedDates) return null;
    if (occupiedDates instanceof Set) return occupiedDates.has(dateKey) ? {} : null;
    return occupiedDates.get ? occupiedDates.get(dateKey) : occupiedDates[dateKey];
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1"><ChevronLeft size={16} style={{ color: COLOR.inkSoft }} /></button>
        <span className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{MONTHS_CA[month]} {year}</span>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1"><ChevronRight size={16} style={{ color: COLOR.inkSoft }} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-1" style={{ color: COLOR.inkSoft }}>
        {WEEKDAYS_CA.map(w => <div key={w}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const occ = isOccupied(dateKey);
          const isToday = dateKey === today;
          return (
            <div key={i} className="aspect-square flex items-center justify-center rounded-lg text-xs"
              style={{
                background: occ ? (occ.color || accentColor) : COLOR.bg,
                color: occ ? "#fff" : COLOR.ink,
                border: isToday ? `2px solid ${COLOR.ink}` : "2px solid transparent",
              }}
              title={occ?.label || ""}>
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
