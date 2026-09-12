// supabase/functions/send-due-notifications/index.ts
//
// S'executa periòdicament (via pg_cron, veure README) i:
//  1. Busca reserves de bugaderia ja acabades (data+hora d'inici + durada
//     real de la rentadora) que encara no s'han avisat.
//  2. Per cada una, busca els correus associats a la porta i les seves
//     subscripcions push, i envia la notificació.
//  3. Marca la reserva com a avisada perquè no es torni a enviar.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
const supabase = createClient(supabaseUrl, serviceKey);

Deno.serve(async () => {
  const { data: pending, error } = await supabase
    .from("bookings")
    .select("id, door, machine_id, booking_date, start_hour, duration_minutes, machines(machine_number)")
    .eq("status", "reservado")
    .eq("notified", false);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const now = Date.now();
  const due = (pending ?? []).filter((b) => {
    const start = new Date(`${b.booking_date}T${String(b.start_hour).padStart(2, "0")}:00:00`);
    const end = start.getTime() + b.duration_minutes * 60000;
    return end <= now;
  });

  let pushesSent = 0;

  for (const b of due) {
    const { data: emailRows } = await supabase.from("door_emails").select("email").eq("door", b.door);
    const targets = (emailRows ?? []).map((e) => e.email);

    if (targets.length > 0) {
      const { data: subs } = await supabase.from("push_subscriptions").select("*").in("email", targets);
      for (const sub of subs ?? []) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title: "Bugada llesta 🧺",
              body: `Rentadora núm. ${b.machines?.machine_number ?? "?"} (porta ${b.door}) ha acabat. Ja pots anar a estendre-la!`,
            })
          );
          pushesSent++;
        } catch (err) {
          // Subscripció caducada o invàlida: l'esborrem.
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }
    }
    await supabase.from("bookings").update({ notified: true }).eq("id", b.id);
  }

  return new Response(
    JSON.stringify({ checked: pending?.length ?? 0, due: due.length, pushes_sent: pushesSent }),
    { headers: { "Content-Type": "application/json" } }
  );
});
