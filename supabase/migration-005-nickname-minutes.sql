-- ============================================================
-- Migració 005
-- Executa-ho al SQL Editor de Supabase (un sol cop)
-- ============================================================

-- ---------- Nickname per persona ----------
alter table door_emails add column if not exists nickname text;
update door_emails set nickname = door where nickname is null;
alter table door_emails alter column nickname set not null;

-- ---------- Bugaderia: mostrar nickname, no el correu ----------
-- (el correu ja no s'hi guardava fiablement; es reomple amb la porta
--  com a valor de reserva mentre no hi hagi nickname real a la reserva)
alter table bookings add column if not exists nickname text;
update bookings set nickname = door where nickname is null;
alter table bookings drop column if exists email;

-- ---------- Sales/habitacions: nickname + reserva per minuts + sub-àrees ----------
alter table room_bookings add column if not exists nickname text;
update room_bookings set nickname = door where nickname is null;
alter table room_bookings drop column if exists email;

alter table room_bookings add column if not exists start_min int;
alter table room_bookings add column if not exists end_min int;
update room_bookings set start_min = start_hour * 60 where start_hour is not null and start_min is null;
update room_bookings set end_min = end_hour * 60 where end_hour is not null and end_min is null;
alter table room_bookings drop column if exists start_hour;
alter table room_bookings drop column if exists end_hour;

-- Cuina / Sala / Tot l'espai (només s'usa a la Sala Polivalent)
alter table room_bookings add column if not exists sub_area text;
