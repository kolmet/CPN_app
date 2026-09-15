-- ============================================================
-- Migració 011: registre d'auditoria (qui esborra què i quan)
-- Executa-ho al SQL Editor de Supabase (un sol cop)
-- ============================================================

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  year int,
  door text,
  nickname text,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;
create policy "audit_log select" on audit_log for select using (true);
create policy "audit_log insert" on audit_log for insert with check (true);
