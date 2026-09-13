-- ============================================================
-- Migració 002: sales polivalents + reserves per a tercers
-- Executa-ho al SQL Editor de Supabase (un sol cop)
-- ============================================================

-- Les habitacions ja no estan lligades a una planta obligatòriament
alter table rooms alter column floor_id drop not null;

-- Mode de reserva: "nightly" (com les habitacions, per dates de nit)
-- o "hourly" (com la bugaderia, per franja horària dins un dia)
alter table rooms add column if not exists booking_mode text not null default 'nightly'
  check (booking_mode in ('nightly', 'hourly'));

-- Per a reserves "hourly": franja horària dins el dia
alter table room_bookings add column if not exists start_hour int;
alter table room_bookings add column if not exists end_hour int;

-- Per a reserves fetes en nom d'una altra persona o entitat
-- (per exemple, algú de la cooperativa que lloga la sala per a un tercer)
alter table room_bookings add column if not exists external_name text;
alter table room_bookings add column if not exists external_note text;

create index if not exists idx_room_bookings_room_checkin on room_bookings (room_id, check_in);

-- Dades inicials de les dues sales noves
insert into rooms (id, name, floor_id, booking_mode) values
  ('room-polivalent', 'Sala Polivalent', null, 'hourly'),
  ('room-moviment', 'Sala de Moviment', null, 'hourly')
on conflict (id) do nothing;
