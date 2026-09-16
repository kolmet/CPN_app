import React, { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { COLOR, MODULES, SPACE_MODULE, FLAT_ZONES, shortZoneLabel, ymd, MONTHS_CA } from "../config";
import { getMachines, getBookings, getSpaces, getSpaceBookings, getYearlySummary } from "../supabaseClient";
import MonthCalendar from "./MonthCalendar";
import YearEndTools from "./YearEndTools";

function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }
const style = MODULES.stats;

export default function StatsTab({ identity, showToast }) {
  const [machines, setMachines] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [yearBookings, setYearBookings] = useState([]);
  const [spaceBookings, setSpaceBookings] = useState([]);
  const [yearlySummary, setYearlySummary] = useState([]);

  useEffect(() => {
    getMachines().then(setMachines);
    getBookings(addDays(-60), addDays(14)).then(setBookings);
    const jan1 = `${new Date().getFullYear()}-01-01`;
    const dec31 = `${new Date().getFullYear()}-12-31`;
    getBookings(jan1, dec31).then(setYearBookings);
    getSpaces().then(async spaces => {
      const ids = spaces.map(s => s.id).filter(id => SPACE_MODULE[id]);
      if (ids.length === 0) return;
      const bk = await getSpaceBookings(ids, addDays(-60));
      setSpaceBookings(bk);
    });
    getYearlySummary().then(setYearlySummary);
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

  const spaceUsage = useMemo(() => {
    const counts = { hostes: 0, polivalent: 0, moviment: 0, bicicletes: 0, taller: 0, terrasses: 0 };
    spaceBookings.forEach(b => {
      const moduleKey = SPACE_MODULE[b.room_id];
      if (moduleKey && counts[moduleKey] !== undefined) counts[moduleKey]++;
    });
    return [
      { name: "Hostes", total: counts.hostes, fill: MODULES.hostes.ink },
      { name: "Polivalent", total: counts.polivalent, fill: MODULES.polivalent.ink },
      { name: "Moviment", total: counts.moviment, fill: MODULES.moviment.ink },
      { name: "Bicicletes", total: counts.bicicletes, fill: MODULES.bicicletes.ink },
      { name: "Taller", total: counts.taller, fill: MODULES.taller.ink },
      { name: "Terrasses", total: counts.terrasses, fill: MODULES.terrasses.ink },
    ];
  }, [spaceBookings]);

  const yearlyEvolution = useMemo(() => {
    const byYear = {};
    yearlySummary.forEach(r => {
      byYear[r.year] = byYear[r.year] || { year: String(r.year) };
      byYear[r.year][r.category] = r.total_bookings;
    });
    return Object.values(byYear).sort((a, b) => a.year.localeCompare(b.year));
  }, [yearlySummary]);

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
        <div className="text-sm" style={{ color: COLOR.inkSoft }}>Torns de bugaderia (últims 60 dies)</div>
        <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLOR.waterDark }}>{stats.total}</div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
        <div className="font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Ús de bugaderia per zona (tothom)</div>
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

      <div className="rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
        <div className="font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Ús dels espais comuns (últims 60 dies)</div>
        <p className="text-xs mb-2" style={{ color: COLOR.inkSoft }}>Nombre de reserves de Hostes, Sala Polivalent, Sala de Moviment i Bicicletes.</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={spaceUsage}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLOR.line} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
              {spaceUsage.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {yearlyEvolution.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
          <div className="font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Evolució per anys</div>
          <p className="text-xs mb-2" style={{ color: COLOR.inkSoft }}>Totals guardats a cada tancament d'any (es conserven encara que s'esborri el detall).</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yearlyEvolution}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLOR.line} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="bugaderia" stackId="a" fill={MODULES.bugaderia.ink} />
              <Bar dataKey="hostes" stackId="a" fill={MODULES.hostes.ink} />
              <Bar dataKey="polivalent" stackId="a" fill={MODULES.polivalent.ink} />
              <Bar dataKey="moviment" stackId="a" fill={MODULES.moviment.ink} />
              <Bar dataKey="bicicletes" stackId="a" fill={MODULES.bicicletes.ink} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <YearEndTools identity={identity} showToast={showToast} />
    </div>
  );
}
