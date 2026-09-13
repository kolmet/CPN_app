import React, { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { COLOR, MODULES, FLAT_ZONES, shortZoneLabel, ymd, MONTHS_CA } from "../config";
import { getMachines, getBookings } from "../supabaseClient";
import MonthCalendar from "./MonthCalendar";

function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }
const style = MODULES.stats;

export default function StatsTab({ identity }) {
  const [machines, setMachines] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [yearBookings, setYearBookings] = useState([]);

  useEffect(() => {
    getMachines().then(setMachines);
    getBookings(addDays(-60), addDays(14)).then(setBookings);
    const jan1 = `${new Date().getFullYear()}-01-01`;
    const dec31 = `${new Date().getFullYear()}-12-31`;
    getBookings(jan1, dec31).then(setYearBookings);
  }, []);

  const stats = useMemo(() => {
    const machineZone = Object.fromEntries(machines.map(m => [m.id, m.zone_id]));
    const byZone = {}; let total = 0;
    bookings.forEach(b => {
      const zoneId = machineZone[b.machine_id];
      if (zoneId) byZone[zoneId] = (byZone[zoneId] || 0) + 1;
      total++;
    });
    const zoneData = FLAT_ZONES.map(z => ({ name: shortZoneLabel(z.id), total: byZone[z.id] || 0 }));
    return { zoneData, total };
  }, [machines, bookings]);

  const myBookings = useMemo(() => bookings.filter(b => b.door === identity.door), [bookings, identity.door]);
  const myOccupiedDates = useMemo(() => {
    const map = new Map();
    myBookings.forEach(b => map.set(b.booking_date, { color: style.ink }));
    return map;
  }, [myBookings]);

  const myYearData = useMemo(() => {
    const counts = Array(12).fill(0);
    yearBookings.filter(b => b.door === identity.door).forEach(b => {
      const m = Number(b.booking_date.slice(5, 7)) - 1;
      counts[m]++;
    });
    return MONTHS_CA.map((name, i) => ({ name: name.slice(0, 3), total: counts[i] }));
  }, [yearBookings, identity.door]);

  return (
    <div className="px-5 space-y-4">
      <div className="rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
        <div className="font-bold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: style.ink }}>El teu ús · Porta {identity.door}</div>
        <p className="text-xs mb-3" style={{ color: COLOR.inkSoft }}>Dies amb bugada feta aquest mes:</p>
        <MonthCalendar occupiedDates={myOccupiedDates} accentColor={style.ink} />
      </div>

      <div className="rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
        <div className="font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: style.ink }}>El teu ús per mes (any {new Date().getFullYear()})</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={myYearData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLOR.line} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="total" fill={style.ink} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
        <div className="text-sm" style={{ color: COLOR.inkSoft }}>Torns de tota la cooperativa (últims 60 dies)</div>
        <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLOR.waterDark }}>{stats.total}</div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
        <div className="font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Ús per zona (tothom)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.zoneData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLOR.line} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="total" fill={COLOR.water} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
