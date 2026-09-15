-- ============================================================
-- Migració 010: resum anual (per a tancaments d'any)
-- Executa-ho al SQL Editor de Supabase (un sol cop)
-- ============================================================

create table if not exists yearly_summary (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  category text not null, -- 'bugaderia' | 'hostes' | 'polivalent' | 'moviment' | 'bicicletes'
  total_bookings int not null default 0,
  created_at timestamptz not null default now(),
  unique (year, category)
);

alter table yearly_summary enable row level security;
create policy "yearly_summary select" on yearly_summary for select using (true);
create policy "yearly_summary insert" on yearly_summary for insert with check (true);
create policy "yearly_summary update" on yearly_summary for update using (true);
