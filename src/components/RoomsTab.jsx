import React, { useState, useEffect, useCallback } from "react";
import { BedDouble } from "lucide-react";
import { COLOR, ymd } from "../config";
import { supabase, getRooms, getRoomBookings, createRoomBooking, cancelRoomBooking } from "../supabaseClient";

function todayStr() { return ymd(new Date()); }

export default function RoomsTab({ identity, showToast }) {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);

  const load = useCallback(async () => {
    const [r, b] = await Promise.all([getRooms(), getRoomBookings(todayStr())]);
    setRooms(r); setBookings(b);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("room_bookings_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "room_bookings" }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  async function handleCreate(roomId, checkIn, checkOut) {
    const overlap = bookings.some(b => b.room_id === roomId && b.check_in < checkOut && b.check_out > checkIn);
    if (overlap) { showToast("Ja hi ha una reserva que xoca amb aquestes dates."); return; }
    const { error } = await createRoomBooking({ room_id: roomId, door: identity.door, email: identity.email, check_in: checkIn, check_out: checkOut });
    if (error) showToast("No s'ha pogut reservar l'habitació.");
    else showToast("Habitació reservada ✔");
    load();
  }
  async function handleCancel(id) {
    const ok = await cancelRoomBooking(id);
    showToast(ok ? "Reserva cancel·lada" : "No s'ha pogut cancel·lar.");
    load();
  }

  return (
    <div className="px-5 space-y-4">
      {rooms.map(room => (
        <RoomCard key={room.id} room={room} identity={identity}
          bookings={bookings.filter(b => b.room_id === room.id).sort((a, b) => a.check_in.localeCompare(b.check_in))}
          onCreate={handleCreate} onCancel={handleCancel} />
      ))}
      {rooms.length === 0 && (
        <div className="text-sm rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}`, color: COLOR.inkSoft }}>
          Encara no hi ha habitacions donades d'alta.
        </div>
      )}
    </div>
  );
}

function RoomCard({ room, identity, bookings, onCreate, onCancel }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const min = todayStr();

  return (
    <div className="rounded-2xl p-4" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
      <div className="font-bold flex items-center gap-2 mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <BedDouble size={18} style={{ color: COLOR.water }} /> {room.name}
      </div>

      {bookings.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {bookings.map(b => {
            const isMine = b.door === identity.door;
            return (
              <div key={b.id} className="flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5" style={{ background: COLOR.bg }}>
                <span>{b.check_in} → {b.check_out} · {isMine ? "tu" : `porta ${b.door}`}</span>
                {isMine && <button onClick={() => onCancel(b.id)} className="underline" style={{ color: COLOR.danger }}>anul·la</button>}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-[11px] mb-0.5" style={{ color: COLOR.inkSoft }}>Entrada</label>
          <input type="date" min={min} value={checkIn} onChange={e => setCheckIn(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-sm" style={{ border: `1px solid ${COLOR.line}` }} />
        </div>
        <div>
          <label className="block text-[11px] mb-0.5" style={{ color: COLOR.inkSoft }}>Sortida</label>
          <input type="date" min={checkIn || min} value={checkOut} onChange={e => setCheckOut(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-sm" style={{ border: `1px solid ${COLOR.line}` }} />
        </div>
        <button disabled={!checkIn || !checkOut || checkOut <= checkIn}
          onClick={() => { onCreate(room.id, checkIn, checkOut); setCheckIn(""); setCheckOut(""); }}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40" style={{ background: COLOR.water }}>
          Reserva
        </button>
      </div>
    </div>
  );
}
