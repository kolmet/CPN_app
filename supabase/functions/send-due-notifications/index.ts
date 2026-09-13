// supabase/functions/send-due-notifications/index.ts
//
// S'executa periòdicament (cada minut, via pg_cron) i per a cada reserva
// de bugaderia activa envia:
//   1. Un avís quan falten <= 5 minuts perquè acabi ("notified_soon")
//   2. Un avís quan ja ha acabat ("notified")
// Mai fa servir el correu real: tot es fa amb l'email_hash.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
const supabase = createClient(supabaseUrl, serviceKey);

async function sendToDoor(door: string, title: string, body: string) {
  const { data: hashRows } = await supabase.from("door_emails").select("email_hash").eq("door", door);
  const targets = (hashRows ?? []).map((e) => e.email_hash);
  if (targets.length === 0) return 0;
  const { data: subs } = await supabase.from("push_subscriptions").select("*").in("email_hash", targets);
  let sent = 0;
  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body })
      );
      sent++;
    } catch (err) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }
  return sent;
}

Deno.serve(async () => {
  const { data: pending, error } = await supabase
    .from("bookings")
    .select("id, door, machine_id, booking_date, start_hour, duration_minutes, notified, notified_soon, machines(machine_number)")
    .eq("status", "reservado")
    .or("notified.eq.false,notified_soon.eq.false");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const now = Date.now();
  let soonSent = 0, doneSent = 0;

  for (const b of pending ?? []) {
    const start = new Date(`${b.booking_date}T${String(b.start_hour).padStart(2, "0")}:00:00`).getTime();
    const end = start + b.duration_minutes * 60000;
    const remainingMs = end - now;
    const machineNum = b.machines?.machine_number ?? "?";

    if (remainingMs <= 0) {
      if (!b.notified) {
        const n = await sendToDoor(
          b.door,
          "Bugada llesta 🧺",
          `Rentadora núm. ${machineNum} (porta ${b.door}) ha acabat. Ja pots anar a estendre-la!`
        );
        doneSent += n;
        await supabase.from("bookings").update({ notified: true, notified_soon: true }).eq("id", b.id);
      }
    } else if (remainingMs <= 5 * 60000 && !b.notified_soon) {
      const n = await sendToDoor(
        b.door,
        "Falten 5 minuts ⏰",
        `La rentadora núm. ${machineNum} (porta ${b.door}) està a punt d'acabar.`
      );
      soonSent += n;
      await supabase.from("bookings").update({ notified_soon: true }).eq("id", b.id);
    }
  }

  return new Response(
    JSON.stringify({ checked: pending?.length ?? 0, soon_pushes: soonSent, done_pushes: doneSent }),
    { headers: { "Content-Type": "application/json" } }
  );
});
