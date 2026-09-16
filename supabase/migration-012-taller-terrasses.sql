-- ============================================================
-- Migració 012: Taller i Terrasses
-- Executa-ho al SQL Editor de Supabase (un sol cop)
-- ============================================================

insert into rooms (id, name, floor_id, booking_mode) values
  ('room-taller', 'Taller', null, 'hourly'),
  ('room-terrasses', 'Terrasses', null, 'hourly')
on conflict (id) do nothing;
