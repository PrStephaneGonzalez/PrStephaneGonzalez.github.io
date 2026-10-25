-- Sauvegarde en ligne facultative d'INFLUENCE (projet Supabase partagé "foret-enchantee").
-- Appliquée le 2026-10-25 (migration « influence_profils »). Même principe que filor_* :
-- la table n'est pas lisible directement (RLS sans politique, aucun droit pour anon/authenticated) ;
-- seules ces quatre fonctions SECURITY DEFINER y accèdent, avec l'empreinte SHA-256 de « nom + code ».
-- Le nom et le code ne quittent jamais le navigateur ; seules les victoires et le nombre de parties sont stockés.
create table if not exists public.influence_profils (
  code_hash text primary key check (code_hash ~ '^[a-f0-9]{64}$'),
  payload jsonb not null check (pg_column_size(payload) < 20000),
  revision integer not null default 1,
  updated timestamptz not null default now()
);
alter table public.influence_profils enable row level security;
revoke all on public.influence_profils from anon, authenticated;

create or replace function public.influence_get(k text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('snapshot', payload, 'revision', revision, 'updated', updated)
  from influence_profils where code_hash = k and k ~ '^[a-f0-9]{64}$';
$$;

create or replace function public.influence_create(k text, p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t timestamptz := now();
begin
  if k !~ '^[a-f0-9]{64}$' then raise exception 'code'; end if;
  if jsonb_typeof(p) <> 'object' or pg_column_size(p) > 20000 then raise exception 'size'; end if;
  insert into influence_profils(code_hash, payload, revision, updated) values (k, p, 1, t)
  on conflict (code_hash) do nothing;
  if not found then return jsonb_build_object('error', 'exists'); end if;
  return jsonb_build_object('revision', 1, 'updated', t);
end $$;

create or replace function public.influence_put(k text, p jsonb, rev integer) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t timestamptz := now();
begin
  if k !~ '^[a-f0-9]{64}$' then raise exception 'code'; end if;
  if jsonb_typeof(p) <> 'object' or pg_column_size(p) > 20000 then raise exception 'size'; end if;
  update influence_profils set payload = p, revision = revision + 1, updated = t
  where code_hash = k and revision = rev;
  if not found then return jsonb_build_object('error', 'conflict'); end if;
  return jsonb_build_object('revision', rev + 1, 'updated', t);
end $$;

create or replace function public.influence_delete(k text) returns jsonb
language sql security definer set search_path = public as $$
  delete from influence_profils where code_hash = k and k ~ '^[a-f0-9]{64}$' returning jsonb_build_object('deleted', true);
$$;

revoke execute on function public.influence_get(text), public.influence_create(text, jsonb), public.influence_put(text, jsonb, integer), public.influence_delete(text) from public;
grant execute on function public.influence_get(text), public.influence_create(text, jsonb), public.influence_put(text, jsonb, integer), public.influence_delete(text) to anon, authenticated;
