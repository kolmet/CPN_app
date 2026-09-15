-- ============================================================
-- Migració 009: nombre de participants (Sala Polivalent)
-- Executa-ho al SQL Editor de Supabase (un sol cop)
-- ============================================================

alter table room_bookings add column if not exists participants int;
