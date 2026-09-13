-- ============================================================
-- Migració 003
-- Executa-ho al SQL Editor de Supabase (un sol cop)
-- ============================================================

-- 1) Nova planta "Terrat" amb la seva Escala B (rentadores del terrat)
insert into machines (id, machine_number, zone_id, brand, short_minutes, long_minutes) values
  ('terrat-b-1', 15, 'terrat-b', 'Marca', 60, 90),
  ('terrat-b-2', 16, 'terrat-b', 'Marca', 60, 90)
on conflict (id) do nothing;
-- Ajusta aquí marca/quantitat/temps reals quan els tinguis, o edita'ls
-- directament a Table Editor → machines.

-- 2) La segona habitació d'hostes és a Planta Baixa, no a Planta 2
update rooms set name = 'Habitació d''hostes · Planta Baixa', floor_id = 'pb' where id = 'room-p2';

-- 3) Arregla els permisos de push_subscriptions
-- Abans només hi havia permís d'INSERT; com que activar les notificacions
-- fa un "upsert" (insereix o actualitza si ja existia l'endpoint), calia
-- també permís de SELECT (per poder retornar la fila) i d'UPDATE. Sense
-- això, el botó de "Activa avisos" fallava silenciosament.
drop policy if exists "push_subscriptions select" on push_subscriptions;
create policy "push_subscriptions select" on push_subscriptions for select using (true);

drop policy if exists "push_subscriptions update" on push_subscriptions;
create policy "push_subscriptions update" on push_subscriptions for update using (true);
