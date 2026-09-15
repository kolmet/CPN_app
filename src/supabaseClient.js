import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error("Falten VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa el fitxer .env (.env.example).");
}

export const supabase = createClient(url, anonKey);

import { hashEmail, maskEmail } from "./crypto";

// ---------- Identitat: porta <-> correus ----------
// El correu real MAI es guarda a Supabase: només el seu hash (per
// comprovar duplicats) i una versió emmascarada (per mostrar-la).
export async function findDoorByEmail(email) {
  const hash = await hashEmail(email);
  const { data } = await supabase.from("door_emails").select("door").eq("email_hash", hash).maybeSingle();
  return data?.door ?? null;
}
export async function registerDoorEmail(door, email, nickname) {
  const hash = await hashEmail(email);
  const { data: existing } = await supabase.from("door_emails").select("door").eq("email_hash", hash).maybeSingle();
  if (existing) {
    if (existing.door === door) return { ok: true };
    return { ok: false, reason: "other_door", existingDoor: existing.door };
  }
  const { error } = await supabase.from("door_emails").insert({ door, email_hash: hash, email_masked: maskEmail(email), nickname });
  return { ok: !error, reason: error ? "insert_error" : null };
}
export async function getResidentsForDoor(door) {
  const { data } = await supabase.from("door_emails").select("email_masked, nickname").eq("door", door);
  return data ?? [];
}
export async function getEmailsForDoor(door) {
  const { data } = await supabase.from("door_emails").select("email_masked").eq("door", door);
  return (data ?? []).map(r => r.email_masked);
}
export async function getDoorZone(door) {
  const { data } = await supabase.from("door_zones").select("zone_id").eq("door", door).maybeSingle();
  return data?.zone_id ?? null;
}
export async function setDoorZone(door, zoneId) {
  const { error } = await supabase.from("door_zones").upsert({ door, zone_id: zoneId });
  return !error;
}

// ---------- Bugaderia ----------
export async function getMachines() {
  const { data } = await supabase.from("machines").select("*").order("machine_number");
  return data ?? [];
}
export async function getBookings(fromDate, toDate) {
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .gte("booking_date", fromDate)
    .lte("booking_date", toDate)
    .neq("status", "cancelado");
  return data ?? [];
}
export async function createBooking(payload) {
  const { data, error } = await supabase.from("bookings").insert(payload).select().single();
  return { data, error };
}
export async function cancelBooking(id) {
  const { error } = await supabase.from("bookings").update({ status: "cancelado" }).eq("id", id);
  return !error;
}
export async function finishBooking(id) {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "finalizado", finished_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

// ---------- Sales / espais (hostes, polivalent, moviment) ----------
export async function getSpaces() {
  const { data } = await supabase.from("rooms").select("*");
  return data ?? [];
}
export async function getSpaceBookings(roomIds, fromDate) {
  const { data } = await supabase
    .from("room_bookings")
    .select("*")
    .in("room_id", roomIds)
    .eq("status", "confirmada")
    .gte("check_out", fromDate);
  return data ?? [];
}
export async function createSpaceBooking(payload) {
  const { data, error } = await supabase.from("room_bookings").insert(payload).select().single();
  return { data, error };
}
export async function cancelSpaceBooking(id) {
  const { error } = await supabase.from("room_bookings").update({ status: "cancelada" }).eq("id", id);
  return !error;
}
export async function cancelRecurrence(recurrenceId, door) {
  const { error } = await supabase.from("room_bookings").update({ status: "cancelada" }).eq("recurrence_id", recurrenceId).eq("door", door);
  return !error;
}

// ---------- Tancament d'any: exportació i neteja ----------
export async function getBookingsForYear(year) {
  const { data } = await supabase.from("bookings").select("*").gte("booking_date", `${year}-01-01`).lte("booking_date", `${year}-12-31`);
  return data ?? [];
}
export async function getRoomBookingsForYear(year) {
  const { data } = await supabase.from("room_bookings").select("*").gte("check_in", `${year}-01-01`).lte("check_in", `${year}-12-31`);
  return data ?? [];
}
export async function deleteBookingsForYear(year) {
  const { error } = await supabase.from("bookings").delete().gte("booking_date", `${year}-01-01`).lte("booking_date", `${year}-12-31`);
  return !error;
}
export async function deleteRoomBookingsForYear(year) {
  const { error } = await supabase.from("room_bookings").delete().gte("check_in", `${year}-01-01`).lte("check_in", `${year}-12-31`);
  return !error;
}
export async function saveYearlySummary(year, categoryCounts) {
  const rows = Object.entries(categoryCounts).map(([category, total_bookings]) => ({ year, category, total_bookings }));
  const { error } = await supabase.from("yearly_summary").upsert(rows, { onConflict: "year,category" });
  return !error;
}
export async function getYearlySummary() {
  const { data } = await supabase.from("yearly_summary").select("*").order("year");
  return data ?? [];
}

// ---------- Registre d'auditoria ----------
export async function logAuditAction(action, year, door, nickname) {
  const { error } = await supabase.from("audit_log").insert({ action, year, door, nickname });
  return !error;
}
export async function getRecentAuditLog(limit = 10) {
  const { data } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}
