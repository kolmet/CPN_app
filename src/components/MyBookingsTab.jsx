import React, { useState, useEffect, useCallback } from "react";
import { Clock3, BedDouble, CheckCircle2, X } from "lucide-react";
import { COLOR, ymd, zoneById } from "../config";
import { supabase, getMachines, getBookings, cancelBooking, finishBooking, getRooms, getRoomBookings, cancelRoomBooking } from "../supabaseClient";

function todayStr() { return ymd(new Date()); }
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }

export default function MyBookingsTab({ identity, showToast }) {
  const [machines, setMachines] = useState([]);
  const [laundry, setLaundry] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomBookings, setRoomBookings] = useState([]);
  const [now] = useState(new Date());

  const load = useCallback(async () => {
    const [m, lb, r, rb] = await Promise.all([
      getMachines(),
      getBookings(addDays(-1), addDays(14)),
      getRooms(),
      getRoomBookings(todayStr()),
    ]);
    setMachines(m);
    setLaundry(lb.filter(b => b.door === identity.door));
    setRooms(r);
    setRoomBookings(rb.filter(b => b.door === identity.door));
  }, [identity.door]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("my_bookings_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_bookings" }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  const todayKey = todayStr();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  async function handleCancel(id) { await cancelBooking(id); showToast("Reserva cancel·lada"); load(); }
  async function handleFinish(id) { await finishBooking(id); showToast("Avisat! Ja pots estendre la roba 🧺"); load(); }
  async function handleCancelRoom(id) { await cancelRoomBooking(id); showToast("Reserva cancel·lada"); load(); }

  const laundrySorted = [...laundry].sort((a, b) => (a.booking_date + a.start_hour).localeCompare(b.booking_date + b.start_hour));

  if (laundrySorted.length === 0 && roomBookings.length === 0) {
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
      {laundrySorted.map(b => {
        const machine = machines.find(m => m.id === b.machine_id);
        const start = b.start_hour * 60, end = start + b.duration_minutes;
        const isPast = b.booking_date < todayKey || (b.booking_date === todayKey && nowMinutes >= end);
        const isNow = b.booking_date === todayKey && nowMinutes >= start && nowMinutes < end;
        const canCancel = b.status === "reservado" && !isPast;
        const canFinish = b.status === "reservado" && (isNow || isPast);
        const endH = Math.floor(end / 60), endM = end % 60;
        return (
          <div key={b.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
            <div>
              <div className="font-semibold text-sm">
                {machine ? `${zoneById(machine.zone_id)?.floorName ?? ""} · ${zoneById(machine.zone_id)?.name ?? ""} · Rentadora ${machine.machine_number}` : "Rentadora"}
              </div>
              <div className="text-sm flex items-center gap-1" style={{ color: COLOR.inkSoft }}>
                <Clock3 size={14} /> {b.booking_date} · {b.start_hour}:00–{endH}:{String(endM).padStart(2, "0")}
              </div>
              <div className="text-xs mt-1 font-medium" style={{ color: b.status === "finalizado" ? COLOR.success : isNow ? COLOR.danger : COLOR.water }}>
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

      {roomBookings.map(b => {
        const room = rooms.find(r => r.id === b.room_id);
        return (
          <div key={b.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
            <div>
              <div className="font-semibold text-sm flex items-center gap-1"><BedDouble size={14} /> {room?.name ?? "Habitació"}</div>
              <div className="text-sm" style={{ color: COLOR.inkSoft }}>{b.check_in} → {b.check_out}</div>
            </div>
            <button onClick={() => handleCancelRoom(b.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs" style={{ color: COLOR.danger, border: `1px solid ${COLOR.danger}` }}>
              <X size={14} /> Cancel·la
            </button>
          </div>
        );
      })}
    </div>
  );
}
