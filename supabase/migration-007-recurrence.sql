-- ============================================================
-- Migració 007: reserves periòdiques (setmanals) a les sales
-- Executa-ho al SQL Editor de Supabase (un sol cop)
-- ============================================================

alter table room_bookings add column if not exists recurrence_id uuid;
create index if not exists idx_room_bookings_recurrence on room_bookings (recurrence_id);
