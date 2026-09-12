-- ============================================================
-- Esquema complet de la Bugaderia Cooperativa
-- Executa aquest fitxer sencer al SQL Editor de Supabase
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Identitat: correus associats a cada porta ----------
-- Una porta pot tenir diversos correus (una persona per correu),
-- però cada correu pertany a una única porta.
create table if not exists door_emails (
  id uuid primary key default gen_random_uuid(),
  door text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_door_emails_door on door_emails (door);

-- ---------- Zona de bugaderia assignada a cada porta ----------
create table if not exists door_zones (
  door text primary key,
  zone_id text not null
);

-- ---------- Catàleg de rentadores ----------
-- Totes numerades, amb marca, zona i els dos temps de rentat
-- (curt / llarg) perquè cada model triga el que triga de veritat.
create table if not exists machines (
  id text primary key,
  machine_number int not null unique,
  zone_id text not null,
  brand text,
  short_minutes int not null default 60,
  long_minutes int not null default 90
);

-- ---------- Reserves de bugaderia ----------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  machine_id text not null references machines(id),
  door text not null,
  email text,
  booking_date date not null,
  start_hour int not null check (start_hour >= 8 and start_hour <= 21),
  duration_minutes int not null,
  status text not null default 'reservado' check (status in ('reservado','finalizado','cancelado')),
  notified boolean not null default false,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists idx_bookings_date_machine on bookings (booking_date, machine_id);
create index if not exists idx_bookings_door on bookings (door);

-- ---------- Habitacions d'convidats ----------
create table if not exists rooms (
  id text primary key,
  name text not null,
  floor_id text not null
);

create table if not exists room_bookings (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id),
  door text not null,
  email text,
  check_in date not null,
  check_out date not null,
  status text not null default 'confirmada' check (status in ('confirmada','cancelada')),
  created_at timestamptz not null default now(),
  constraint valid_range check (check_out > check_in)
);
create index if not exists idx_room_bookings_room on room_bookings (room_id);

-- ---------- Subscripcions de notificacions push ----------
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_push_subscriptions_email on push_subscriptions (email);

-- ============================================================
-- Seguretat (RLS). Eina interna sense login: lectura/escriptura
-- oberta a taules operatives; catàleg (machines/rooms) només
-- lectura pública (s'edita des del Table Editor de Supabase).
-- ============================================================

alter table door_emails enable row level security;
alter table door_zones enable row level security;
alter table machines enable row level security;
alter table bookings enable row level security;
alter table rooms enable row level security;
alter table room_bookings enable row level security;
alter table push_subscriptions enable row level security;

create policy "door_emails select" on door_emails for select using (true);
create policy "door_emails insert" on door_emails for insert with check (true);

create policy "door_zones select" on door_zones for select using (true);
create policy "door_zones upsert" on door_zones for insert with check (true);
create policy "door_zones update" on door_zones for update using (true);

create policy "machines select" on machines for select using (true);
create policy "rooms select" on rooms for select using (true);

create policy "bookings select" on bookings for select using (true);
create policy "bookings insert" on bookings for insert with check (true);
create policy "bookings update" on bookings for update using (true);

create policy "room_bookings select" on room_bookings for select using (true);
create policy "room_bookings insert" on room_bookings for insert with check (true);
create policy "room_bookings update" on room_bookings for update using (true);

-- Les subscripcions push només s'insereixen des del navegador;
-- es llegeixen des de la funció (service role, que salta RLS).
create policy "push_subscriptions insert" on push_subscriptions for insert with check (true);

-- ============================================================
-- Temps real (perquè tothom vegi els canvis a l'instant)
-- ============================================================
alter publication supabase_realtime add table bookings;
alter publication supabase_realtime add table room_bookings;

-- ============================================================
-- Dades inicials: catàleg de rentadores i habitacions
-- Edita/afegeix files des del Table Editor quan calgui.
-- ============================================================
insert into machines (id, machine_number, zone_id, brand, short_minutes, long_minutes) values
  ('pb-a-1', 1, 'pb-a', 'Marca', 60, 90),
  ('pb-a-2', 2, 'pb-a', 'Marca', 60, 90),
  ('pb-a-3', 3, 'pb-a', 'Marca', 60, 90),
  ('pb-b-1', 4, 'pb-b', 'Marca', 60, 90),
  ('pb-b-2', 5, 'pb-b', 'Marca', 60, 90),
  ('p1-a-1', 6, 'p1-a', 'Marca', 60, 90),
  ('p1-a-2', 7, 'p1-a', 'Marca', 60, 90),
  ('p1-b-1', 8, 'p1-b', 'Marca', 60, 90),
  ('p1-b-2', 9, 'p1-b', 'Marca', 60, 90),
  ('p1-b-3', 10, 'p1-b', 'Marca', 60, 90),
  ('p2-a-1', 11, 'p2-a', 'Marca', 60, 90),
  ('p2-a-2', 12, 'p2-a', 'Marca', 60, 90),
  ('p2-b-1', 13, 'p2-b', 'Marca', 60, 90),
  ('p2-b-2', 14, 'p2-b', 'Marca', 60, 90)
on conflict (id) do nothing;

insert into rooms (id, name, floor_id) values
  ('room-p1', 'Habitació d''hostes · Planta 1', 'p1'),
  ('room-p2', 'Habitació d''hostes · Planta 2', 'p2')
on conflict (id) do nothing;
