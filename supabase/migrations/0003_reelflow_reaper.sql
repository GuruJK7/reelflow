-- =====================================================================
-- ReelFlow · 0003 reaper de jobs colgados
-- Si el worker muere a mitad de un job, queda en 'processing' para siempre.
-- Esta función (la llama el worker periódicamente) los marca como 'error'
-- para que el usuario pueda verlos/borrarlos y no bloqueen su cuota útil.
-- =====================================================================

create or replace function public.reelflow_reap_stale_jobs(max_minutes int default 30)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected int;
begin
  update public.reelflow_jobs
     set status = 'error',
         error = 'El procesamiento excedió el tiempo máximo (worker reiniciado o video muy pesado).',
         finished_at = now()
   where status = 'processing'
     and started_at is not null
     and started_at < now() - make_interval(mins => max_minutes);
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.reelflow_reap_stale_jobs(int) from public, anon, authenticated;
grant execute on function public.reelflow_reap_stale_jobs(int) to service_role;
