-- ============================================================
-- Migració 004: deixa de guardar el correu real
-- Executa-ho al SQL Editor de Supabase (un sol cop)
-- ============================================================

create extension if not exists pgcrypto;

-- Funció auxiliar per emmascarar un correu igual que fa l'app
-- (p.ex. "joan.puig@gmail.com" -> "jo***@g***.com")
create or replace function mask_email(input_email text)
returns text
language plpgsql
immutable
as $$
declare
  local_part text;
  domain_part text;
  dot_pos int;
begin
  if position('@' in input_email) = 0 then
    return '***';
  end if;
  local_part := split_part(input_email, '@', 1);
  domain_part := split_part(input_email, '@', 2);
  dot_pos := position('.' in domain_part);
  return
    (case when length(local_part) <= 2 then left(local_part, 1) || '*'
          else left(local_part, 2) || '***' end)
    || '@' ||
    (case when dot_pos = 0 then left(domain_part, 1) || '***'
          else left(domain_part, 1) || '***' || substring(domain_part from dot_pos) end);
end;
$$;

-- ---------- door_emails ----------
alter table door_emails add column if not exists email_hash text;
alter table door_emails add column if not exists email_masked text;

update door_emails
set email_hash = encode(digest(lower(trim(email)), 'sha256'), 'hex'),
    email_masked = mask_email(lower(trim(email)))
where email_hash is null;

alter table door_emails alter column email_hash set not null;
alter table door_emails alter column email_masked set not null;
alter table door_emails add constraint door_emails_email_hash_key unique (email_hash);
alter table door_emails drop column email;

-- ---------- push_subscriptions ----------
alter table push_subscriptions add column if not exists email_hash text;

update push_subscriptions
set email_hash = encode(digest(lower(trim(email)), 'sha256'), 'hex')
where email_hash is null;

alter table push_subscriptions alter column email_hash set not null;
alter table push_subscriptions drop column email;

create index if not exists idx_push_subscriptions_email_hash on push_subscriptions (email_hash);
