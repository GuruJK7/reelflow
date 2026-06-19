-- =====================================================================
-- ReelFlow · 0001_reelflow_init
-- SaaS multi-tenant: jobs de edición de Reels, aislados por usuario (RLS).
-- Prefijo reelflow_ en todo. Worker usa service_role (bypassa RLS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabla principal de jobs
-- ---------------------------------------------------------------------
create table if not exists public.reelflow_jobs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending','processing','done','error')),
  input_path   text,                       -- ruta en bucket reelflow_uploads
  output_path  text,                       -- ruta en bucket reelflow_outputs
  description  text,                        -- descripción corta del usuario
  format       text not null default '9:16'
               check (format in ('9:16','1:1','4:5','16:9')),
  options      jsonb not null default '{}'::jsonb,
  result       jsonb,                       -- {caption, hook, hashtags, duration_in/out,...}
  error        text,
  progress     int not null default 0 check (progress between 0 and 100),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  started_at   timestamptz,
  finished_at  timestamptz
);

comment on table public.reelflow_jobs is 'ReelFlow: cola de jobs de edición de Reels (multi-tenant, RLS por user_id).';

-- Índices: claim del worker (status,created_at) y dashboard del usuario (user_id,created_at)
create index if not exists reelflow_jobs_status_created_idx on public.reelflow_jobs (status, created_at);
create index if not exists reelflow_jobs_user_created_idx   on public.reelflow_jobs (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Trigger: mantener updated_at
-- ---------------------------------------------------------------------
create or replace function public.reelflow_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reelflow_jobs_set_updated_at on public.reelflow_jobs;
create trigger reelflow_jobs_set_updated_at
  before update on public.reelflow_jobs
  for each row execute function public.reelflow_set_updated_at();

-- ---------------------------------------------------------------------
-- Trigger: forzar estado inicial en INSERT (defensa: el usuario no puede
-- crear un job ya "done" ni setear output_path/progress).
-- ---------------------------------------------------------------------
create or replace function public.reelflow_force_initial_state()
returns trigger language plpgsql as $$
begin
  new.status      := 'pending';
  new.output_path := null;
  new.result      := null;
  new.error       := null;
  new.progress    := 0;
  new.started_at  := null;
  new.finished_at := null;
  new.created_at  := now();
  new.updated_at  := now();
  return new;
end;
$$;

drop trigger if exists reelflow_jobs_force_initial_state on public.reelflow_jobs;
create trigger reelflow_jobs_force_initial_state
  before insert on public.reelflow_jobs
  for each row execute function public.reelflow_force_initial_state();

-- ---------------------------------------------------------------------
-- RPC: claim atómico de un job (lo usa el worker con service_role).
-- FOR UPDATE SKIP LOCKED => seguro ante múltiples workers concurrentes.
-- ---------------------------------------------------------------------
create or replace function public.reelflow_claim_job()
returns public.reelflow_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  claimed public.reelflow_jobs;
begin
  select * into claimed
  from public.reelflow_jobs
  where status = 'pending'
  order by created_at asc
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  update public.reelflow_jobs
     set status = 'processing', started_at = now()
   where id = claimed.id
  returning * into claimed;

  return claimed;
end;
$$;

-- ---------------------------------------------------------------------
-- RLS: cada usuario solo ve/crea/borra SUS jobs. (Worker = service_role bypassa.)
-- ---------------------------------------------------------------------
alter table public.reelflow_jobs enable row level security;

drop policy if exists reelflow_jobs_select_own on public.reelflow_jobs;
create policy reelflow_jobs_select_own on public.reelflow_jobs
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists reelflow_jobs_insert_own on public.reelflow_jobs;
create policy reelflow_jobs_insert_own on public.reelflow_jobs
  for insert to authenticated
  with check (auth.uid() = user_id);

-- El usuario puede borrar sus jobs salvo mientras se procesan.
drop policy if exists reelflow_jobs_delete_own on public.reelflow_jobs;
create policy reelflow_jobs_delete_own on public.reelflow_jobs
  for delete to authenticated
  using (auth.uid() = user_id and status <> 'processing');
-- (Sin UPDATE para usuarios en el MVP: el estado lo maneja solo el worker.)

-- Privilegios de tabla (RLS filtra las filas; los grants habilitan la operación)
revoke all on public.reelflow_jobs from anon;
grant select, insert, delete on public.reelflow_jobs to authenticated;
grant all on public.reelflow_jobs to service_role;

-- El claim solo lo puede ejecutar el worker (service_role)
revoke all on function public.reelflow_claim_job() from public, anon, authenticated;
grant execute on function public.reelflow_claim_job() to service_role;

-- ---------------------------------------------------------------------
-- Storage: buckets privados + políticas por carpeta de usuario.
-- Convención de rutas:  {user_id}/{job_id}/<archivo>
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('reelflow_uploads', 'reelflow_uploads', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('reelflow_outputs', 'reelflow_outputs', false)
on conflict (id) do nothing;

-- Subidas: el usuario solo escribe/lee dentro de su propia carpeta en uploads
drop policy if exists reelflow_uploads_insert_own on storage.objects;
create policy reelflow_uploads_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'reelflow_uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists reelflow_uploads_select_own on storage.objects;
create policy reelflow_uploads_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'reelflow_uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Salidas: el usuario solo lee su propia carpeta (el worker las escribe con service_role)
drop policy if exists reelflow_outputs_select_own on storage.objects;
create policy reelflow_outputs_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'reelflow_outputs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
