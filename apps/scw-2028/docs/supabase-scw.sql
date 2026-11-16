-- SCW 2028 · Salle d'organisation — stockage partagé (projet Supabase partagé "foret-enchantee").
-- Appliqué le 2026-11-16 (migration « scw_2028_workspace »). Les 210 tâches ont été importées le même jour
-- depuis l'ancienne version hébergée sur ChatGPT ; elles ne figurent pas dans ce dépôt public.
-- Même principe que les autres applis du site : les tables ne sont pas lisibles directement
-- (RLS sans politique, aucun droit pour anon/authenticated) ; seules les fonctions scw_* y accèdent.
-- Chaque fonction exige le code d'équipe, vérifié côté serveur (empreinte bcrypt dans scw_access).
-- Le code lui-même n'est stocké nulle part en clair, ni dans la base ni dans le dépôt GitHub.
-- Trop d'essais erronés (40 en 15 minutes, tous appareils confondus) bloquent temporairement l'accès.
--
-- Changer le code d'équipe (dans l'éditeur SQL de Supabase) :
--   update public.scw_access set code_hash = extensions.crypt('NOUVEAU-CODE', extensions.gen_salt('bf')) where id = 1;

create table if not exists public.scw_access (
  id integer primary key check (id = 1),
  code_hash text not null
);

create table if not exists public.scw_attempts (
  at timestamptz not null default now()
);

create table if not exists public.scw_tasks (
  id text primary key check (id ~ '^[A-Z]{2,5}-[0-9]{3}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 60000),
  version integer not null default 1,
  updated timestamptz not null default now(),
  updated_by text not null default ''
);

create table if not exists public.scw_history (
  hid bigint generated always as identity primary key,
  task_id text not null,
  action text not null check (action in ('create', 'update', 'delete')),
  before jsonb,
  after jsonb,
  at timestamptz not null default now(),
  who text not null default ''
);
create index if not exists scw_history_task on public.scw_history (task_id, at desc);
create index if not exists scw_history_at on public.scw_history (at desc);

alter table public.scw_access enable row level security;
alter table public.scw_attempts enable row level security;
alter table public.scw_tasks enable row level security;
alter table public.scw_history enable row level security;
revoke all on public.scw_access, public.scw_attempts, public.scw_tasks, public.scw_history from anon, authenticated;

-- Vérifie le code ; renvoie null si correct, sinon 'code' ou 'locked'. Enregistre les échecs.
create or replace function public.scw_check(c text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare h text;
begin
  delete from scw_attempts where at < now() - interval '1 day';
  if (select count(*) from scw_attempts where at > now() - interval '15 minutes') >= 40 then
    return 'locked';
  end if;
  select code_hash into h from scw_access where id = 1;
  if h is null or c is null or length(c) > 200 or extensions.crypt(c, h) <> h then
    insert into scw_attempts default values;
    return 'code';
  end if;
  return null;
end $$;

-- Liste des tâches (toutes, ou seulement celles modifiées depuis « since »).
create or replace function public.scw_list(c text, since timestamptz default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e text := scw_check(c);
begin
  if e is not null then return jsonb_build_object('error', e); end if;
  return jsonb_build_object(
    'now', now(),
    'ids', (select coalesce(jsonb_agg(id), '[]'::jsonb) from scw_tasks),
    'tasks', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'data', data, 'version', version,
                'updated', updated, 'updated_by', updated_by)), '[]'::jsonb)
              from scw_tasks where since is null or updated > since));
end $$;

-- Crée (version absente) ou met à jour (version = version connue) une tâche.
create or replace function public.scw_save(c text, t jsonb, who text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  e text := scw_check(c);
  tid text := t->>'id';
  d jsonb := t->'data';
  v integer := (t->>'version')::integer;
  old jsonb;
  n timestamptz := now();
  w text := left(coalesce(who, ''), 80);
begin
  if e is not null then return jsonb_build_object('error', e); end if;
  if tid is null or tid !~ '^[A-Z]{2,5}-[0-9]{3}$' then return jsonb_build_object('error', 'id'); end if;
  if jsonb_typeof(d) <> 'object' or pg_column_size(d) > 60000
     or coalesce(trim(d->>'title'), '') = '' or length(d->>'title') > 300
     or not (d->>'priority' = any (array['Urgent','High','Medium','Low']))
     or not (d->>'status' = any (array['To do','In progress','Waiting','Decision needed','Blocked','Done'])) then
    return jsonb_build_object('error', 'fields');
  end if;
  if v is null then
    insert into scw_tasks(id, data, version, updated, updated_by) values (tid, d, 1, n, w)
    on conflict (id) do nothing;
    if not found then return jsonb_build_object('error', 'exists'); end if;
    insert into scw_history(task_id, action, before, after, at, who) values (tid, 'create', null, d, n, w);
    return jsonb_build_object('id', tid, 'version', 1, 'updated', n);
  end if;
  select data into old from scw_tasks where id = tid and version = v for update;
  if not found then return jsonb_build_object('error', 'conflict'); end if;
  update scw_tasks set data = d, version = v + 1, updated = n, updated_by = w where id = tid;
  insert into scw_history(task_id, action, before, after, at, who) values (tid, 'update', old, d, n, w);
  return jsonb_build_object('id', tid, 'version', v + 1, 'updated', n);
end $$;

create or replace function public.scw_delete(c text, tid text, v integer, who text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare e text := scw_check(c); old jsonb;
begin
  if e is not null then return jsonb_build_object('error', e); end if;
  delete from scw_tasks where id = tid and version = v returning data into old;
  if old is null then return jsonb_build_object('error', 'conflict'); end if;
  insert into scw_history(task_id, action, before, after, who) values (tid, 'delete', old, null, left(coalesce(who, ''), 80));
  return jsonb_build_object('deleted', true);
end $$;

-- Historique d'une tâche (tid) ou dernières modifications (tid null).
create or replace function public.scw_log(c text, tid text default null, lim integer default 30) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e text := scw_check(c);
begin
  if e is not null then return jsonb_build_object('error', e); end if;
  return jsonb_build_object('log', (select coalesce(jsonb_agg(x order by x.at desc), '[]'::jsonb) from (
    select hid, task_id, action, before, after, at, who from scw_history
    where tid is null or task_id = tid order by at desc limit least(greatest(lim, 1), 200)) x));
end $$;

revoke execute on function public.scw_check(text) from public, anon, authenticated;
revoke execute on function public.scw_list(text, timestamptz), public.scw_save(text, jsonb, text),
  public.scw_delete(text, text, integer, text), public.scw_log(text, text, integer) from public;
grant execute on function public.scw_list(text, timestamptz), public.scw_save(text, jsonb, text),
  public.scw_delete(text, text, integer, text), public.scw_log(text, text, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Migration « scw_2028_meta » (16/11/2026) : documents partagés hors tâches (jalons, rôles).
create table if not exists public.scw_meta (
  key text primary key check (key ~ '^[a-z][a-z0-9-]{1,29}$'),
  value jsonb not null check (pg_column_size(value) < 30000),
  version integer not null default 1,
  updated timestamptz not null default now(),
  updated_by text not null default ''
);
alter table public.scw_meta enable row level security;
revoke all on public.scw_meta from anon, authenticated;
-- scw_list renvoie en plus 'meta' : { clé: { value, version, updated, updated_by } }.
-- scw_meta_save(c, k, v, ver, who) : crée (ver null) ou met à jour (ver = version lue) un document,
-- avec historique dans scw_history (task_id = 'meta:' || clé). Code complet appliqué tel que dans la migration.
