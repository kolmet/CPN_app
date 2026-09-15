import { supabase } from "./supabaseClient";

// Abans, cada pantalla (LaundryTab, SpaceTab, MyBookingsTab, HomeCalendar)
// obria el seu propi canal de temps real amb supabase.channel(...), que es
// destruïa i es tornava a crear cada cop que es navegava entre pantalles.
//
// Aquí n'hi ha un de sol per a tota la sessió: es crea una única vegada
// (la primera vegada que algun fitxer importa aquest mòdul) i es queda
// obert mentre l'app estigui oberta. Els components ja no creen cap canal
// propi — només s'apunten (onTableChange) i es desapunten quan deixen de
// necessitar-ho, cosa que no genera cap trànsit de xarxa, només actualitza
// una llista en memòria.

const listeners = {
  bookings: new Set(),
  room_bookings: new Set(),
};

function notify(table) {
  listeners[table].forEach((cb) => {
    try { cb(); } catch (e) { /* ignore errors from individual listeners */ }
  });
}

supabase
  .channel("app-realtime")
  .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => notify("bookings"))
  .on("postgres_changes", { event: "*", schema: "public", table: "room_bookings" }, () => notify("room_bookings"))
  .subscribe();

// Registra una funció que s'executarà cada cop que canviï alguna cosa a
// la taula indicada ("bookings" o "room_bookings"). Retorna una funció per
// desapuntar-se — cridar-la a la neteja del useEffect, com abans.
export function onTableChange(table, callback) {
  listeners[table].add(callback);
  return () => listeners[table].delete(callback);
}
